import type { MediaResult, MediaInput, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface CropInput {
  /** Input file path or URL */
  input: string;
  /** Width of crop area in pixels */
  width: number;
  /** Height of crop area in pixels */
  height: number;
  /** Focal point X position as percentage (0-100, default: 50) */
  focusX?: number;
  /** Focal point Y position as percentage (0-100, default: 50) */
  focusY?: number;
  /** DPI/density for output image (default: 300) */
  dpi?: number;
  /** Output directory (overrides default) */
  out?: string;
  /** Output filename (extension auto-added if missing) */
  name?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
}

/**
 * Crop an image to specified dimensions centered on a focal point
 */
export async function crop(options: CropInput): Promise<MediaResult> {
  const isUrl = options.input.startsWith('http://') || options.input.startsWith('https://');

  const input: MediaInput = {
    source: options.input,
    isUrl,
  };

  const context: ActionContext = {
    outputDir: options.out ?? process.cwd() + '/.agent-media',
    provider: options.provider,
    outputName: options.name,
    inputSource: options.input,
  };

  return executeAction(
    globalRegistry,
    {
      action: 'crop',
      options: {
        input,
        width: options.width,
        height: options.height,
        focusX: options.focusX,
        focusY: options.focusY,
        dpi: options.dpi,
      },
    },
    context
  );
}
