import type { MediaResult, MediaInput, ActionContext, ImageFormat } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface ConvertInput {
  /** Input file path or URL */
  input: string;
  /** Output format (png, jpg, webp) */
  format: ImageFormat;
  /** Quality for lossy formats (1-100, default: 80) */
  quality?: number;
  /** DPI/density for output image (default: 72) */
  dpi?: number;
  /** Target width in pixels (for rasterizing vector formats like SVG) */
  width?: number;
  /** Target height in pixels (for rasterizing vector formats like SVG) */
  height?: number;
  /** Output directory (overrides default) */
  out?: string;
  /** Output filename (extension auto-added if missing) */
  name?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
}

/**
 * Convert an image to a different format
 */
export async function convert(options: ConvertInput): Promise<MediaResult> {
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
      action: 'convert',
      options: {
        input,
        format: options.format,
        quality: options.quality,
        dpi: options.dpi,
        width: options.width,
        height: options.height,
      },
    },
    context
  );
}
