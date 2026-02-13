import type {
  MediaProvider,
  MediaResult,
  ActionOptions,
  ActionContext,
} from '@agent-media/core';
import { createError, ensureOutputDir, ErrorCodes } from '@agent-media/core';
import { executeBackgroundRemoval } from './background-removal.js';
import { executeTranscribe } from './transcribe.js';
import { executeUpscale } from './upscale.js';

/**
 * Note: ONNX runtime on macOS may cause a mutex error during cleanup.
 * This does not affect output - the JSON result and saved files are correct.
 * The error "mutex lock failed: Invalid argument" can be safely ignored.
 */

/**
 * Actions supported by the transformers provider
 */
const SUPPORTED_ACTIONS = ['remove-background', 'transcribe', 'upscale'];

/**
 * Transformers.js provider for local ML inference
 * Uses @huggingface/transformers for zero-API-key operations
 *
 * Supports:
 * - remove-background: Xenova/modnet (default), briaai/RMBG-2.0 (requires HF auth)
 * - transcribe: Moonshine (default, 5x faster than Whisper), Whisper, Distil-Whisper
 * - upscale: Xenova/swin2SR-compressed-sr-x4-48 (default, ~1.3MB, always 4x)
 *
 * Models are downloaded on first use and cached locally (~/.cache/huggingface/).
 * No API keys required.
 */
export const transformersProvider: MediaProvider = {
  name: 'transformers',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    try {
      await ensureOutputDir(context.outputDir);

      let result: MediaResult;
      switch (actionConfig.action) {
        case 'remove-background':
          result = await executeBackgroundRemoval(actionConfig.options, context);
          break;
        case 'transcribe':
          result = await executeTranscribe(actionConfig.options, context);
          break;
        case 'upscale':
          result = await executeUpscale(actionConfig.options, context);
          break;
        default:
          return createError(
            ErrorCodes.INVALID_INPUT,
            `Action '${actionConfig.action}' not supported by transformers provider`
          );
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

export default transformersProvider;
