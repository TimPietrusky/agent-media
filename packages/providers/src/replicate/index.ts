import { createReplicate } from '@ai-sdk/replicate';
import { generateImage } from 'ai';
import { writeFile, readFile, stat } from 'node:fs/promises';
import type {
  MediaProvider,
  MediaResult,
  ActionOptions,
  ActionContext,
  GenerateOptions,
  RemoveBackgroundOptions,
} from '@agent-media/core';
import {
  createSuccess,
  createError,
  ensureOutputDir,
  generateOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';

/**
 * Actions supported by the replicate provider
 */
const SUPPORTED_ACTIONS = ['generate', 'remove-background'];

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
 * Execute generate action using Replicate flux-schnell model via AI SDK
 */
async function executeGenerate(
  options: GenerateOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { prompt, width = 1024, height = 1024 } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image generation');
  }

  const replicate = createReplicate({ apiToken });

  const { image } = await generateImage({
    model: replicate.image('black-forest-labs/flux-schnell'),
    prompt,
    size: `${width}x${height}`,
  });

  const outputFilename = generateOutputFilename('webp', 'generated');
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

  const outputFilename = generateOutputFilename('png', 'nobg');
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

export default replicateProvider;
