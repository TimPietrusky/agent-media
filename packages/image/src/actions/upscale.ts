import type { MediaResult, MediaInput, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface UpscaleInput {
  /** Input file path or URL */
  input: string;
  /** Scale factor (e.g., 2 or 4, default: 2) */
  scale?: number;
  /** Output directory (overrides default) */
  out?: string;
  /** Output filename (extension auto-added if missing) */
  name?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
  /** Model to use (overrides provider default) */
  model?: string;
}

/**
 * Upscale an image using AI super-resolution
 * Supports local (Swin2SR), fal (ESRGAN), and replicate (Real-ESRGAN) providers
 */
export async function upscale(options: UpscaleInput): Promise<MediaResult> {
  const isUrl = options.input.startsWith('http://') || options.input.startsWith('https://');

  const input: MediaInput = {
    source: options.input,
    isUrl,
  };

  const context: ActionContext = {
    outputDir: options.out ?? process.cwd(),
    provider: options.provider,
    outputName: options.name,
    inputSource: options.input,
  };

  return executeAction(
    globalRegistry,
    {
      action: 'upscale',
      options: {
        input,
        scale: options.scale,
        model: options.model,
      },
    },
    context
  );
}
