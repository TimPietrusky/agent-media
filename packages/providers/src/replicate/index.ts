import { createReplicate } from '@ai-sdk/replicate';
import Replicate from 'replicate';
import { generateImage } from 'ai';
import { writeFile, readFile, stat } from 'node:fs/promises';
import type {
  MediaProvider,
  MediaResult,
  ActionOptions,
  ActionContext,
  GenerateOptions,
  RemoveBackgroundOptions,
  TranscribeOptions,
  TranscriptionData,
  EditOptions,
  VideoGenerateOptions,
} from '@agent-media/core';
import {
  createSuccess,
  createError,
  createTranscriptionSuccess,
  ensureOutputDir,
  resolveOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';
import { generateVideoReplicate } from '../video-gen/index.js';

/**
 * Actions supported by the replicate provider
 */
const SUPPORTED_ACTIONS = ['generate', 'remove-background', 'transcribe', 'edit', 'video-generate'];

/**
 * Replicate provider for image generation and processing
 * Requires REPLICATE_API_TOKEN environment variable
 */
export const replicateProvider: MediaProvider = {
  name: 'replicate',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    const apiToken = process.env['REPLICATE_API_TOKEN'];

    if (!apiToken) {
      return createError(
        ErrorCodes.API_ERROR,
        'REPLICATE_API_TOKEN environment variable is not set'
      );
    }

    try {
      await ensureOutputDir(context.outputDir);

      switch (actionConfig.action) {
        case 'generate':
          return await executeGenerate(actionConfig.options, context, apiToken);
        case 'remove-background':
          return await executeRemoveBackground(actionConfig.options, context, apiToken);
        case 'transcribe':
          return await executeTranscribe(actionConfig.options, context, apiToken);
        case 'edit':
          return await executeEdit(actionConfig.options, context, apiToken);
        case 'video-generate':
          return await executeVideoGenerate(actionConfig.options, context, apiToken);
        default:
          return createError(
            ErrorCodes.INVALID_INPUT,
            `Action '${actionConfig.action}' not supported by replicate provider`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

/**
 * Execute generate action using Replicate flux model via AI SDK
 * Default model: black-forest-labs/flux-2-dev (FLUX.2 Dev)
 */
async function executeGenerate(
  options: GenerateOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { prompt, width = 1280, height = 720, model, seed } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image generation');
  }

  const replicateClient = createReplicate({ apiToken });
  const modelId = model || 'black-forest-labs/flux-2-dev';

  const { image } = await generateImage({
    model: replicateClient.image(modelId),
    prompt,
    size: `${width}x${height}`,
    seed,
  });

  const outputFilename = resolveOutputFilename('webp', 'generated', context.outputName);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'generate',
    provider: 'replicate',
    outputPath: outputPath,
    mime: 'image/webp',
    bytes: stats.size,
  });
}

/**
 * Execute edit action using Replicate flux-kontext model via AI SDK
 * Default model: black-forest-labs/flux-kontext-dev
 */
async function executeEdit(
  options: EditOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { input, prompt, model } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for image editing');
  }

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image editing');
  }

  // Prepare the image as a data URL for the replicate API
  let imageDataUrl: string;
  if (input.isUrl) {
    // For URLs, fetch and convert to data URL
    const response = await fetch(input.source);
    if (!response.ok) {
      return createError(ErrorCodes.NETWORK_ERROR, `Failed to fetch input image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    imageDataUrl = `data:${contentType};base64,${base64}`;
  } else {
    // For local files, read and convert to data URL
    const buffer = await readFile(input.source);
    const base64 = buffer.toString('base64');
    const ext = input.source.toLowerCase().split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    imageDataUrl = `data:${mimeType};base64,${base64}`;
  }

  const replicateClient = createReplicate({ apiToken });
  const modelId = model || 'black-forest-labs/flux-kontext-dev';

  const { image } = await generateImage({
    model: replicateClient.image(modelId),
    prompt,
    providerOptions: {
      replicate: {
        image: imageDataUrl,
      },
    },
  });

  const outputFilename = resolveOutputFilename('webp', 'edited', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'edit',
    provider: 'replicate',
    outputPath: outputPath,
    mime: 'image/webp',
    bytes: stats.size,
  });
}

/**
 * Execute remove-background action using Replicate BiRefNet model via AI SDK
 */
async function executeRemoveBackground(
  options: RemoveBackgroundOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { input } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for background removal');
  }

  const replicate = createReplicate({ apiToken });

  // Prepare the image input
  let imageBuffer: Buffer;
  if (input.isUrl) {
    const response = await fetch(input.source);
    if (!response.ok) {
      return createError(ErrorCodes.NETWORK_ERROR, `Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    imageBuffer = await readFile(input.source);
  }

  // Use BiRefNet for background removal (same model as fal provider)
  const { image } = await generateImage({
    model: replicate.image('men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7'),
    prompt: {
      text: '',
      images: [imageBuffer],
    },
  });

  const outputFilename = resolveOutputFilename('png', 'nobg', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'remove-background',
    provider: 'replicate',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute transcribe action using Replicate whisper-diarization model
 * Uses thomasmol/whisper-diarization with Whisper Large V3 Turbo
 * Supports diarization without requiring additional tokens
 */
async function executeTranscribe(
  options: TranscribeOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { input, language, numSpeakers } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for transcription');
  }

  // Initialize Replicate client
  const replicate = new Replicate({ auth: apiToken });

  // Build request input for whisper-diarization
  const requestInput: Record<string, unknown> = {};

  // Prepare the audio input
  if (input.isUrl) {
    requestInput['file_url'] = input.source;
  } else {
    // Convert local file to base64
    const buffer = await readFile(input.source);
    const base64 = buffer.toString('base64');
    requestInput['file_string'] = base64;
  }

  if (numSpeakers) {
    requestInput['num_speakers'] = numSpeakers;
  }

  if (language) {
    requestInput['language'] = language;
  }

  // Call whisper-diarization via Replicate SDK (handles polling automatically)
  const output = await replicate.run(
    'thomasmol/whisper-diarization:1495a9cddc83b2203b0d8d3516e38b80fd1572ebc4bc5700ac1da56a9b3ed886',
    { input: requestInput }
  );

  const result = output as {
    language?: string;
    num_speakers?: number;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      speaker?: string;
    }>;
  };

  if (!result) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'No output from transcription');
  }

  // Transform to our TranscriptionData format
  const segments = result.segments || [];
  const transcription: TranscriptionData = {
    text: segments.map(s => s.text).join(' '),
    language: result.language || language || 'unknown',
    segments: segments.map(segment => ({
      start: segment.start,
      end: segment.end,
      text: segment.text,
      ...(segment.speaker ? { speaker: segment.speaker } : {}),
    })),
  };

  // Save transcription to JSON file
  const outputFilename = resolveOutputFilename('json', 'transcription', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, JSON.stringify(transcription, null, 2));

  return createTranscriptionSuccess({
    mediaType: 'audio',
    provider: 'replicate',
    outputPath: outputPath,
    transcription,
  });
}

/**
 * Execute video-generate action using Replicate lightricks/ltx-video model
 * Supports both text-to-video and image-to-video
 */
async function executeVideoGenerate(
  options: VideoGenerateOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { prompt, input, duration, resolution, fps, model } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for video generation');
  }

  try {
    const result = await generateVideoReplicate(
      {
        prompt,
        inputImage: input?.source,
        inputIsUrl: input?.isUrl,
        duration,
        resolution,
        fps,
        model,
      },
      apiToken
    );

    // Download the generated video
    const videoResponse = await fetch(result.url);
    if (!videoResponse.ok) {
      return createError(
        ErrorCodes.NETWORK_ERROR,
        `Failed to download generated video: ${videoResponse.statusText}`
      );
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const outputFilename = resolveOutputFilename('mp4', 'generated', context.outputName, context.inputSource);
    const outputPath = getOutputPath(context.outputDir, outputFilename);

    await writeFile(outputPath, buffer);

    const stats = await stat(outputPath);

    return createSuccess({
      mediaType: 'video',
      action: 'video-generate',
      provider: 'replicate',
      outputPath: outputPath,
      mime: 'video/mp4',
      bytes: stats.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createError(ErrorCodes.PROVIDER_ERROR, message);
  }
}

export default replicateProvider;
