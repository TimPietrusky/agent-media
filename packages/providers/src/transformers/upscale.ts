import { pipeline, env, RawImage } from '@huggingface/transformers';
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import type {
  MediaResult,
  ActionContext,
  UpscaleOptions,
} from '@agent-media/core';
import {
  createSuccess,
  createError,
  resolveOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';

// Disable local model loading from disk cache check warnings
env.allowLocalModels = false;

/**
 * Default model for image upscaling
 * Xenova/swin2SR-compressed-sr-x4-48 is a lightweight super-resolution model (~1.3MB ONNX)
 * Always outputs 4x upscale regardless of --scale flag (model architecture limitation)
 */
const DEFAULT_MODEL = 'Xenova/swin2SR-compressed-sr-x4-48';

/**
 * Model aliases for user-friendly selection
 */
const MODEL_ALIASES: Record<string, string> = {
  'swin2sr': 'Xenova/swin2SR-compressed-sr-x4-48',
};

/**
 * Type for image-to-image pipeline
 */
type ImageToImagePipeline = Awaited<ReturnType<typeof pipeline<'image-to-image'>>>;

/**
 * Cache for loaded pipelines to avoid reloading models
 */
let cachedPipeline: ImageToImagePipeline | null = null;
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
 * Get or create pipeline for image upscaling
 */
async function getUpscalePipeline(modelId: string): Promise<ImageToImagePipeline> {
  if (cachedPipeline && cachedModelId === modelId) {
    return cachedPipeline;
  }

  cachedPipeline = await pipeline('image-to-image', modelId, {
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
 * Execute image upscaling using Transformers.js image-to-image pipeline
 * Note: Local provider always outputs 4x regardless of --scale (model architecture limitation)
 */
export async function executeUpscale(
  options: UpscaleOptions,
  context: ActionContext
): Promise<MediaResult> {
  const { input, model } = options;

  if (!input?.source) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      'Input source is required for upscaling'
    );
  }

  const modelId = resolveModel(model);

  try {
    // Get or create the upscale pipeline
    const upscaler = await getUpscalePipeline(modelId);

    // Run upscaling - accepts URL or file path
    const result = await upscaler(input.source);

    // Result is a RawImage object
    const outputImage = Array.isArray(result) ? result[0] : result;

    if (!outputImage) {
      return createError(
        ErrorCodes.PROVIDER_ERROR,
        'No image returned from upscaling'
      );
    }

    // Convert RawImage to PNG using sharp
    const { data, width, height, channels } = outputImage as RawImage;

    const sharpInstance = sharp(Buffer.from(data.buffer), {
      raw: {
        width,
        height,
        channels: channels as 1 | 2 | 3 | 4,
      },
    });

    const outputFilename = resolveOutputFilename('png', 'upscaled', context.outputName, context.inputSource);
    const outputPath = getOutputPath(context.outputDir, outputFilename);

    // Save as PNG
    await sharpInstance.png().toFile(outputPath);

    const stats = await stat(outputPath);

    return createSuccess({
      mediaType: 'image',
      action: 'upscale',
      provider: 'transformers',
      outputPath: outputPath,
      mime: 'image/png',
      bytes: stats.size,
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

    return createError(ErrorCodes.PROVIDER_ERROR, message);
  }
}
