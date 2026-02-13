import { createFal } from '@ai-sdk/fal';
import { generateImage, experimental_transcribe as transcribe } from 'ai';
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
  UpscaleOptions,
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
import { generateVideoFal } from '../video-gen/index.js';

/**
 * Actions supported by the fal provider
 */
const SUPPORTED_ACTIONS = ['generate', 'remove-background', 'transcribe', 'edit', 'upscale', 'video-generate'];

/**
 * Fal.ai provider for image generation and processing
 * Requires FAL_API_KEY environment variable
 */
export const falProvider: MediaProvider = {
  name: 'fal',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    const apiKey = process.env['FAL_API_KEY'];

    if (!apiKey) {
      return createError(
        ErrorCodes.API_ERROR,
        'FAL_API_KEY environment variable is not set'
      );
    }

    try {
      await ensureOutputDir(context.outputDir);

      switch (actionConfig.action) {
        case 'generate':
          return await executeGenerate(actionConfig.options, context, apiKey);
        case 'remove-background':
          return await executeRemoveBackground(actionConfig.options, context, apiKey);
        case 'transcribe':
          return await executeTranscribe(actionConfig.options, context, apiKey);
        case 'edit':
          return await executeEdit(actionConfig.options, context, apiKey);
        case 'upscale':
          return await executeUpscale(actionConfig.options, context, apiKey);
        case 'video-generate':
          return await executeVideoGenerate(actionConfig.options, context, apiKey);
        default:
          return createError(
            ErrorCodes.INVALID_INPUT,
            `Action '${actionConfig.action}' not supported by fal provider`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

/**
 * Execute generate action using fal.ai flux model via AI SDK
 * Default model: fal-ai/flux-2 (FLUX.2 Dev)
 */
async function executeGenerate(
  options: GenerateOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { prompt, width = 1280, height = 720, model, seed } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image generation');
  }

  const falClient = createFal({ apiKey });
  const modelId = model || 'fal-ai/flux-2';

  const { image } = await generateImage({
    model: falClient.image(modelId),
    prompt,
    size: `${width}x${height}`,
    seed,
  });

  const outputFilename = resolveOutputFilename('png', 'generated', context.outputName);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'generate',
    provider: 'fal',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute edit action using fal.ai flux-2 edit model via AI SDK
 * Default model: fal-ai/flux-2/edit
 */
async function executeEdit(
  options: EditOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { input, prompt, model } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for image editing');
  }

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image editing');
  }

  // Prepare the image as a data URL for the fal API
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

  const falClient = createFal({ apiKey });
  const modelId = model || 'fal-ai/flux-2/edit';

  const { image } = await generateImage({
    model: falClient.image(modelId),
    prompt,
    providerOptions: {
      fal: {
        image_urls: [imageDataUrl],
      },
    },
  });

  const outputFilename = resolveOutputFilename('png', 'edited', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'edit',
    provider: 'fal',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute remove-background action using fal.ai birefnet/v2 model via AI SDK
 * Uses generateImage with image input and minimal text prompt
 */
async function executeRemoveBackground(
  options: RemoveBackgroundOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { input } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for background removal');
  }

  const falClient = createFal({ apiKey });

  // Prepare the image input
  let imageBuffer: Buffer;
  if (input.isUrl) {
    const response = await fetch(input.source);
    if (!response.ok) {
      return createError(ErrorCodes.NETWORK_ERROR, `Failed to fetch input image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    imageBuffer = await readFile(input.source);
  }

  // Use generateImage with birefnet model - image input only, minimal text
  const { image } = await generateImage({
    model: falClient.image('fal-ai/birefnet/v2'),
    prompt: {
      text: '',
      images: [imageBuffer],
    },
    providerOptions: {
      fal: {
        model: 'General Use (Light)',
        outputFormat: 'png',
        refineForeground: true,
      },
    },
  });

  const outputFilename = resolveOutputFilename('png', 'nobg', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'remove-background',
    provider: 'fal',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute upscale action using fal.ai ESRGAN model via AI SDK
 * Default model: fal-ai/esrgan
 */
async function executeUpscale(
  options: UpscaleOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { input, scale = 2, model } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for upscaling');
  }

  const falClient = createFal({ apiKey });
  const modelId = model || 'fal-ai/esrgan';

  // Prepare the image input
  let imageBuffer: Buffer;
  if (input.isUrl) {
    const response = await fetch(input.source);
    if (!response.ok) {
      return createError(ErrorCodes.NETWORK_ERROR, `Failed to fetch input image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    imageBuffer = await readFile(input.source);
  }

  const { image } = await generateImage({
    model: falClient.image(modelId),
    prompt: {
      text: '',
      images: [imageBuffer],
    },
    providerOptions: {
      fal: {
        scale,
      },
    },
  });

  const outputFilename = resolveOutputFilename('png', 'upscaled', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'upscale',
    provider: 'fal',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute transcribe action using fal.ai whisper models via AI SDK
 * Uses wizper (faster) when diarize=false, whisper when diarize=true
 */
async function executeTranscribe(
  options: TranscribeOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { input, diarize = false, language, numSpeakers } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for transcription');
  }

  const falClient = createFal({ apiKey });

  // Prepare audio input - AI SDK accepts Buffer, Uint8Array, or URL
  let audioInput: Buffer | string;
  if (input.isUrl) {
    audioInput = input.source;
  } else {
    audioInput = await readFile(input.source);
  }

  // Select model based on diarize flag
  // wizper is 2x faster but doesn't support diarization
  // whisper supports diarization
  const modelId = diarize ? 'whisper' : 'wizper';

  // Build provider options for fal
  const providerOptions: Record<string, unknown> = {
    chunkLevel: 'segment',
  };

  if (diarize) {
    providerOptions['diarize'] = true;
    if (numSpeakers) {
      providerOptions['numSpeakers'] = numSpeakers;
    }
  }

  if (language) {
    providerOptions['language'] = language;
  }

  // Call transcription via AI SDK
  const result = await transcribe({
    model: falClient.transcription(modelId),
    audio: audioInput,
    providerOptions: {
      fal: providerOptions as Record<string, string | number | boolean>,
    },
  });

  // Transform to our TranscriptionData format
  // AI SDK uses startSecond/endSecond for segment timestamps
  const transcription: TranscriptionData = {
    text: result.text || '',
    language: result.language || language || 'unknown',
    segments: (result.segments || []).map(segment => ({
      start: segment.startSecond,
      end: segment.endSecond,
      text: segment.text,
    })),
  };

  // Save transcription to JSON file
  const outputFilename = resolveOutputFilename('json', 'transcription', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, JSON.stringify(transcription, null, 2));

  return createTranscriptionSuccess({
    mediaType: 'audio',
    provider: 'fal',
    outputPath: outputPath,
    transcription,
  });
}

/**
 * Execute video-generate action using fal.ai LTX-2 model
 * Supports both text-to-video and image-to-video
 */
async function executeVideoGenerate(
  options: VideoGenerateOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { prompt, input, duration, resolution, fps, generateAudio, model } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for video generation');
  }

  try {
    const result = await generateVideoFal(
      {
        prompt,
        inputImage: input?.source,
        inputIsUrl: input?.isUrl,
        duration,
        resolution,
        fps,
        generateAudio,
        model,
      },
      apiKey
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
      provider: 'fal',
      outputPath: outputPath,
      mime: 'video/mp4',
      bytes: stats.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createError(ErrorCodes.PROVIDER_ERROR, message);
  }
}

export default falProvider;
