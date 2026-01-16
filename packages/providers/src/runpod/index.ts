import { createRunpod } from '@runpod/ai-sdk-provider';
import { generateImage } from 'ai';
import { writeFile, readFile, stat } from 'node:fs/promises';
import type {
  MediaProvider,
  MediaResult,
  ActionOptions,
  ActionContext,
  GenerateOptions,
  EditOptions,
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
 * Actions supported by the runpod provider
 */
const SUPPORTED_ACTIONS = ['generate', 'edit'];

/**
 * Runpod provider for image generation and editing
 * Requires RUNPOD_API_KEY environment variable
 *
 * Supported actions:
 * - generate: Text-to-image using alibaba/wan-2.6
 * - edit: Image-to-image editing using google/nano-banana-pro-edit
 */
export const runpodProvider: MediaProvider = {
  name: 'runpod',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    const apiKey = process.env['RUNPOD_API_KEY'];

    if (!apiKey) {
      return createError(
        ErrorCodes.API_ERROR,
        'RUNPOD_API_KEY environment variable is not set'
      );
    }

    try {
      await ensureOutputDir(context.outputDir);

      switch (actionConfig.action) {
        case 'generate':
          return await executeGenerate(actionConfig.options, context, apiKey);
        case 'edit':
          return await executeEdit(actionConfig.options, context, apiKey);
        default:
          return createError(
            ErrorCodes.INVALID_INPUT,
            `Action '${actionConfig.action}' not supported by runpod provider`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

/**
 * Execute generate action using Runpod alibaba/wan-2.6 model via AI SDK
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

  const runpod = createRunpod({ apiKey });

  const { image } = await generateImage({
    model: runpod.image('alibaba/wan-2.6'),
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
    provider: 'runpod',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute edit action using Runpod google/nano-banana-pro-edit model via AI SDK
 */
async function executeEdit(
  options: EditOptions,
  context: ActionContext,
  apiKey: string
): Promise<MediaResult> {
  const { input, prompt } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for image editing');
  }

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image editing');
  }

  const runpod = createRunpod({ apiKey });

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

  const { image } = await generateImage({
    model: runpod.image('google/nano-banana-pro-edit'),
    prompt: {
      text: prompt,
      images: [imageBuffer],
    },
  });

  const outputFilename = generateOutputFilename('png', 'edited');
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'edit',
    provider: 'runpod',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

export default runpodProvider;
