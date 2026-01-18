import type { MediaResult, MediaInput, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface ExtendInput {
  /** Input file path or URL */
  input: string;
  /** Padding size in pixels to add on all sides */
  padding: number;
  /** Background color for the extended area (hex, e.g., "#E4ECF8"). Also flattens any transparency to this color. */
  color: string;
  /** DPI/density for output image metadata */
  dpi?: number;
  /** Output directory (overrides default) */
  out?: string;
  /** Output filename (extension auto-added if missing) */
  name?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
}

/**
 * Extend an image canvas by adding padding on all sides with a solid background color.
 * Also flattens any transparency in the original image to the specified color.
 */
export async function extend(options: ExtendInput): Promise<MediaResult> {
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
      action: 'extend',
      options: {
        input,
        padding: options.padding,
        color: options.color,
        dpi: options.dpi,
      },
    },
    context
  );
}
