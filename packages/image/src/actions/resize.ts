import type { MediaResult, MediaInput, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface ResizeInput {
  /** Input file path or URL */
  input: string;
  /** Target width in pixels */
  width?: number;
  /** Target height in pixels */
  height?: number;
  /** Maintain aspect ratio (default: true) */
  maintainAspectRatio?: boolean;
  /** Output directory (overrides default) */
  out?: string;
  /** Output filename (extension auto-added if missing) */
  name?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
}

/**
 * Resize an image to the specified dimensions
 */
export async function resize(options: ResizeInput): Promise<MediaResult> {
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
      action: 'resize',
      options: {
        input,
        width: options.width,
        height: options.height,
        maintainAspectRatio: options.maintainAspectRatio,
      },
    },
    context
  );
}
