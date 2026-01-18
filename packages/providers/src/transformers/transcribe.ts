import { pipeline, env } from '@huggingface/transformers';
import { writeFile } from 'node:fs/promises';
import type {
  MediaResult,
  ActionContext,
  TranscribeOptions,
  TranscriptionData,
} from '@agent-media/core';
import {
  createError,
  createTranscriptionSuccess,
  resolveOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';

// Disable local model loading from disk cache check warnings
env.allowLocalModels = false;

/**
 * Default model for transcription
 * Moonshine is 5x faster than Whisper for short audio with better accuracy
 * https://huggingface.co/onnx-community/moonshine-base-ONNX
 */
const DEFAULT_MODEL = 'onnx-community/moonshine-base-ONNX';

/**
 * Model aliases for user-friendly selection
 */
const MODEL_ALIASES: Record<string, string> = {
  // Moonshine models (recommended - faster and more accurate)
  'moonshine-tiny': 'onnx-community/moonshine-tiny-ONNX',
  'moonshine-base': 'onnx-community/moonshine-base-ONNX',
  // Whisper models (for compatibility)
  'whisper-tiny': 'Xenova/whisper-tiny',
  'whisper-base': 'Xenova/whisper-base',
  'whisper-small': 'Xenova/whisper-small',
  'whisper-medium': 'Xenova/whisper-medium',
  'whisper-large-v3-turbo': 'onnx-community/whisper-large-v3-turbo',
  // Distil-Whisper (fast, English only)
  'distil-whisper': 'distil-whisper/distil-large-v3.5-ONNX',
};

/**
 * Type for ASR pipeline
 */
type ASRPipeline = Awaited<ReturnType<typeof pipeline<'automatic-speech-recognition'>>>;

/**
 * ASR output type
 */
interface ASROutput {
  text: string;
  chunks?: Array<{
    timestamp: [number, number];
    text: string;
  }>;
}

/**
 * Cache for loaded pipelines to avoid reloading models
 */
let cachedPipeline: ASRPipeline | null = null;
let cachedModelId: string | null = null;

/**
 * Dispose of the cached pipeline to prevent cleanup errors
 */
export async function disposePipeline(): Promise<void> {
  if (cachedPipeline && typeof (cachedPipeline as any).dispose === 'function') {
    await (cachedPipeline as any).dispose();
  }
  cachedPipeline = null;
  cachedModelId = null;
}

/**
 * Get or create pipeline for automatic speech recognition
 */
async function getASRPipeline(modelId: string): Promise<ASRPipeline> {
  if (cachedPipeline && cachedModelId === modelId) {
    return cachedPipeline;
  }

  cachedPipeline = await pipeline('automatic-speech-recognition', modelId, {
    device: 'cpu',
  });
  cachedModelId = modelId;

  return cachedPipeline;
}

/**
 * Resolve model name from alias or use as-is
 */
function resolveModel(model?: string): string {
  if (!model) {
    return DEFAULT_MODEL;
  }

  const lowerModel = model.toLowerCase();
  return MODEL_ALIASES[lowerModel] || model;
}

/**
 * Execute transcription using Transformers.js automatic-speech-recognition pipeline
 */
export async function executeTranscribe(
  options: TranscribeOptions,
  context: ActionContext
): Promise<MediaResult> {
  const { input, diarize = false, language, model } = options;

  if (!input?.source) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      'Input source is required for transcription'
    );
  }

  // Diarization is not supported locally - return helpful error
  if (diarize) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      'Diarization (speaker identification) is not supported by the local transformers provider. Use --provider fal or --provider replicate for diarization support.'
    );
  }

  const modelId = resolveModel(model);

  try {
    // Get or create the ASR pipeline
    const transcriber = await getASRPipeline(modelId);

    // Run transcription with timestamp chunks
    // The pipeline accepts URL or file path directly
    const result = await transcriber(input.source, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5,
      language: language || undefined,
    });

    // Result can be a single object or array
    const output = (Array.isArray(result) ? result[0] : result) as ASROutput;

    if (!output || typeof output.text !== 'string') {
      return createError(
        ErrorCodes.PROVIDER_ERROR,
        'No transcription output returned from model'
      );
    }

    // Build transcription data
    const chunks = output.chunks;

    const transcription: TranscriptionData = {
      text: output.text.trim(),
      language: language || 'auto',
      segments: chunks
        ? chunks.map((chunk) => ({
            start: chunk.timestamp[0] ?? 0,
            end: chunk.timestamp[1] ?? 0,
            text: chunk.text.trim(),
          }))
        : [
            {
              start: 0,
              end: 0,
              text: output.text.trim(),
            },
          ],
    };

    // Save transcription to JSON file
    const outputFilename = resolveOutputFilename('json', 'transcription', context.outputName, context.inputSource);
    const outputPath = getOutputPath(context.outputDir, outputFilename);

    await writeFile(outputPath, JSON.stringify(transcription, null, 2));

    return createTranscriptionSuccess({
      mediaType: 'audio',
      provider: 'transformers',
      outputPath: outputPath,
      transcription,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Provide helpful error for model download issues
    if (message.includes('fetch') || message.includes('network')) {
      return createError(
        ErrorCodes.NETWORK_ERROR,
        `Failed to download model ${modelId}. Ensure you have internet connectivity. Models are cached after first download.`
      );
    }

    // Handle audio format issues
    if (
      message.includes('audio') ||
      message.includes('decode') ||
      message.includes('format')
    ) {
      return createError(
        ErrorCodes.INVALID_FORMAT,
        `Failed to process audio file. Supported formats: mp3, wav, mp4, m4a, webm, ogg. Error: ${message}`
      );
    }

    return createError(ErrorCodes.PROVIDER_ERROR, message);
  }
}
