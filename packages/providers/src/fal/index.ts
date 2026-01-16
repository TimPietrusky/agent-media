import { createFal } from '@ai-sdk/fal';
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
 * Actions supported by the fal provider
 */
const SUPPORTED_ACTIONS = ['generate', 'remove-background'];

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
 */
async function executeGenerate(
  options: GenerateOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { prompt, width = 1024, height = 1024 } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image generation');
  }

  const fal = createFal({ apiKey });

  const { image } = await generateImage({
    model: fal.image('fal-ai/flux/schnell'),
    prompt,
    size: `${width}x${height}`,
  });

  const outputFilename = generateOutputFilename('png', 'generated');
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
 * Execute remove-background action using fal.ai birefnet/v2 model
 * Uses direct API call since birefnet is an image processing model, not generative
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

  // Prepare the image URL - birefnet requires a URL
  let imageUrl: string;
  if (input.isUrl) {
    imageUrl = input.source;
  } else {
    // Convert local file to data URI
    const buffer = await readFile(input.source);
    const base64 = buffer.toString('base64');
    // Detect mime type from extension
    const ext = input.source.toLowerCase().split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    imageUrl = `data:${mimeType};base64,${base64}`;
  }

  // Call birefnet/v2 directly via fal.run API
  const response = await fetch('https://fal.run/fal-ai/birefnet/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      model: 'General Use (Light)',
      output_format: 'png',
      refine_foreground: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return createError(ErrorCodes.API_ERROR, `Fal API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as {
    image: {
      url: string;
      content_type: string;
    };
  };

  if (!result.image?.url) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'No image returned from background removal');
  }

  // Download the processed image
  const imageResponse = await fetch(result.image.url);
  if (!imageResponse.ok) {
    return createError(ErrorCodes.NETWORK_ERROR, `Failed to download processed image: ${imageResponse.statusText}`);
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outputFilename = generateOutputFilename('png', 'nobg');
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, buffer);

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

export default falProvider;
