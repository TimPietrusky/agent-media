import { pipeline, env } from '@huggingface/transformers';
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import type {
  MediaResult,
  ActionContext,
  RemoveBackgroundOptions,
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
 * Default model for background removal
 * Xenova/modnet is publicly accessible (~25MB)
 * briaai/RMBG-2.0 requires HuggingFace authentication
 */
const DEFAULT_MODEL = 'Xenova/modnet';

/**
 * Model aliases for user-friendly selection
 */
const MODEL_ALIASES: Record<string, string> = {
  'modnet': 'Xenova/modnet',
  'rmbg-2.0': 'briaai/RMBG-2.0',
  'rmbg-1.4': 'briaai/RMBG-1.4',
};

/**
 * Type for background removal pipeline
 */
type BackgroundRemovalPipeline = Awaited<ReturnType<typeof pipeline<'background-removal'>>>;

/**
 * Cache for loaded pipelines to avoid reloading models
 */
let cachedPipeline: BackgroundRemovalPipeline | null = null;
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
 * Get or create pipeline for background removal
 */
async function getBackgroundRemovalPipeline(modelId: string): Promise<BackgroundRemovalPipeline> {
  if (cachedPipeline && cachedModelId === modelId) {
    return cachedPipeline;
  }

  cachedPipeline = await pipeline('background-removal', modelId, {
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
 * Execute background removal using Transformers.js background-removal pipeline
 */
export async function executeBackgroundRemoval(
  options: RemoveBackgroundOptions,
  context: ActionContext
): Promise<MediaResult> {
  const { input, model } = options;

  if (!input?.source) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      'Input source is required for background removal'
    );
  }

  const modelId = resolveModel(model);

  try {
    // Get or create the background removal pipeline
    const remover = await getBackgroundRemovalPipeline(modelId);

    // Run background removal - accepts URL or file path
    const result = await remover(input.source);

    // Result is an array of RawImage objects with transparency
    const outputImage = Array.isArray(result) ? result[0] : result;

    if (!outputImage) {
      return createError(
        ErrorCodes.PROVIDER_ERROR,
        'No image returned from background removal'
      );
    }

    // Convert RawImage to PNG using sharp (toBlob only works in browser)
    // RawImage has data (Uint8ClampedArray), width, height, and channels properties
    const { data, width, height, channels } = outputImage;

    // Create sharp instance from raw pixel data
    const sharpInstance = sharp(Buffer.from(data.buffer), {
      raw: {
        width,
        height,
        channels: channels as 1 | 2 | 3 | 4,
      },
    });

    const outputFilename = resolveOutputFilename('png', 'nobg', context.outputName, context.inputSource);
    const outputPath = getOutputPath(context.outputDir, outputFilename);

    // Save as PNG
    await sharpInstance.png().toFile(outputPath);

    const stats = await stat(outputPath);

    return createSuccess({
      mediaType: 'image',
      action: 'remove-background',
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
