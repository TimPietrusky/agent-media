import type { MediaResult, ActionContext, MediaInput } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface EditInput {
  /** Input file path or URL */
  input: string;
  /** Text prompt describing the desired edit */
  prompt: string;
  /** Output directory (overrides default) */
  out?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
}

/**
 * Edit an image using a text prompt (image-to-image)
 * Requires an external provider (runpod)
 */
export async function edit(options: EditInput): Promise<MediaResult> {
  const isUrl = options.input.startsWith('http://') || options.input.startsWith('https://');

  const mediaInput: MediaInput = {
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
      action: 'edit',
      options: {
        input: mediaInput,
        prompt: options.prompt,
      },
    },
    context
  );
}
