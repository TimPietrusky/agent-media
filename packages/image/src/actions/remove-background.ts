import type { MediaResult, MediaInput, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface RemoveBackgroundInput {
  /** Input file path or URL */
  input: string;
  /** Output directory (overrides default) */
  out?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
  /** Model to use (overrides provider default) */
  model?: string;
}

/**
 * Remove the background from an image
 * Requires an external provider (file, replicate, or runpod)
 */
export async function removeBackground(options: RemoveBackgroundInput): Promise<MediaResult> {
  const isUrl = options.input.startsWith('http://') || options.input.startsWith('https://');

  const input: MediaInput = {
    source: options.input,
    isUrl,
  };

  const context: ActionContext = {
    outputDir: options.out ?? process.cwd() + '/.agent-media',
    provider: options.provider,
  };

  return executeAction(
    globalRegistry,
    {
      action: 'remove-background',
      options: {
        input,
        model: options.model,
      },
    },
    context
  );
}
