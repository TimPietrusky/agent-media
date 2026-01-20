import { generateImage, generateText } from 'ai';
import { writeFile, readFile, stat } from 'node:fs/promises';

/**
 * Unwrap Promise-wrapped errors from the AI SDK gateway
 * The gateway sometimes throws errors that are themselves Promises
 */
async function unwrapError(error: unknown): Promise<string> {
  let current = error;

  // Recursively unwrap if it's a Promise (up to 3 levels deep)
  for (let i = 0; i < 3; i++) {
    if (current && typeof (current as { then?: unknown }).then === 'function') {
      try {
        await (current as Promise<unknown>);
        // If we get here, the Promise resolved successfully which is unexpected
        return 'Unknown error (Promise resolved unexpectedly)';
      } catch (e) {
        current = e;
      }
    } else {
      break;
    }
  }

  // Now extract the message
  if (current instanceof Error) {
    return current.message;
  }

  // Check for error-like objects
  if (current && typeof current === 'object') {
    const errObj = current as { message?: unknown; error?: unknown };
    if (typeof errObj.message === 'string') {
      return errObj.message;
    }
    if (typeof errObj.error === 'string') {
      return errObj.error;
    }
  }

  const str = String(current);
  // Avoid returning "[object Promise]" or "[object Object]"
  if (str.startsWith('[object ')) {
    return 'Unknown error';
  }

  return str;
}

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
  resolveOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';

/**
 * Actions supported by the ai-gateway provider
 */
const SUPPORTED_ACTIONS = ['generate', 'edit'];

/**
 * AI Gateway provider for image generation and editing
 * Requires AI_GATEWAY_API_KEY environment variable
 *
 * Supported actions:
 * - generate: Text-to-image using BFL Flux, Google Imagen, Recraft models
 *   Default model: bfl/flux-2-pro
 * - edit: Image editing using Google Nano Banana Pro
 *   Default model: google/gemini-3-pro-image
 */
export const aiGatewayProvider: MediaProvider = {
  name: 'ai-gateway',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    const apiKey = process.env['AI_GATEWAY_API_KEY'];

    if (!apiKey) {
      return createError(
        ErrorCodes.API_ERROR,
        'AI_GATEWAY_API_KEY environment variable is not set'
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
            `Action '${actionConfig.action}' not supported by ai-gateway provider`
          );
      }
    } catch (error) {
      const message = await unwrapError(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

/**
 * Execute generate action using AI Gateway
 * Default model: bfl/flux-2-pro
 *
 * Supported models:
 * - BFL Flux: bfl/flux-2-pro, bfl/flux-2-flex, bfl/flux-kontext-max, bfl/flux-kontext-pro, bfl/flux-pro-1.1
 * - Google Imagen: google/imagen-4.0-ultra-generate-001, google/imagen-4.0-generate-001
 *
 * Note: AI Gateway uses model ID strings directly, not a provider client.
 * The API key is passed via environment variable AI_GATEWAY_API_KEY which is
 * automatically read by the AI SDK when using gateway model IDs.
 */
async function executeGenerate(
  options: GenerateOptions,
  context: ActionContext,
  _apiKey: string
): Promise<MediaResult> {
  const { prompt, width = 1280, height = 720, model, seed } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image generation');
  }

  const modelId = model || 'bfl/flux-2-pro';

  // AI Gateway image-only models use experimental_generateImage with model ID as string
  // The API key is read from AI_GATEWAY_API_KEY environment variable automatically
  let result;
  try {
    result = await generateImage({
      model: modelId,
      prompt,
      aspectRatio: width === height ? '1:1' : `${width}:${height}`,
      seed,
    });
  } catch (err) {
    const errMsg = await unwrapError(err);
    return createError(ErrorCodes.PROVIDER_ERROR, errMsg);
  }

  // Image-only models return images in result.images as base64
  if (!result.images || result.images.length === 0) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'No image was generated');
  }

  const generatedImage = result.images[0];
  if (!generatedImage || !generatedImage.base64) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'Generated image has no data');
  }

  const outputFilename = resolveOutputFilename('png', 'generated', context.outputName);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  // Decode base64 and write to file
  const buffer = Buffer.from(generatedImage.base64, 'base64');
  await writeFile(outputPath, buffer);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'generate',
    provider: 'ai-gateway',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute edit action using AI Gateway with Google Nano Banana Pro
 * Default model: google/gemini-3-pro-image
 *
 * Uses generateText() with multimodal input and extracts generated images from result.files
 * Note: AI Gateway uses model ID strings directly, not a provider client.
 */
async function executeEdit(
  options: EditOptions,
  context: ActionContext,
  _apiKey: string
): Promise<MediaResult> {
  const { input, prompt, model } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for image editing');
  }

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image editing');
  }

  // Prepare the image as base64 data URL
  let imageDataUrl: string;
  if (input.isUrl) {
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
    const buffer = await readFile(input.source);
    const base64 = buffer.toString('base64');
    const ext = input.source.toLowerCase().split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    imageDataUrl = `data:${mimeType};base64,${base64}`;
  }

  const modelId = model || 'google/gemini-3-pro-image';

  // Use generateText with multimodal content for image editing
  // Nano Banana Pro models can generate images as output files
  // The API key is read from AI_GATEWAY_API_KEY environment variable automatically
  let result;
  try {
    result = await generateText({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageDataUrl,
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });
  } catch (err) {
    const errMsg = await unwrapError(err);
    return createError(ErrorCodes.PROVIDER_ERROR, errMsg);
  }

  // Extract generated image from result.files
  if (!result.files || result.files.length === 0) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'No image was generated by the model');
  }

  const generatedImage = result.files[0];
  if (!generatedImage || !generatedImage.uint8Array) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'Generated image has no data');
  }

  const outputFilename = resolveOutputFilename('png', 'edited', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, generatedImage.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'edit',
    provider: 'ai-gateway',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

export default aiGatewayProvider;
