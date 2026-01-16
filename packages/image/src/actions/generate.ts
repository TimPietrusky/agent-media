import type { MediaResult, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface GenerateInput {
  /** Text prompt describing the image to generate */
  prompt: string;
  /** Width of the generated image */
  width?: number;
  /** Height of the generated image */
  height?: number;
  /** Number of images to generate (default: 1) */
  count?: number;
  /** Output directory (overrides default) */
  out?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
}

/**
 * Generate an image from a text prompt
 * Requires an external provider (file, replicate, or runpod)
 */
export async function generate(options: GenerateInput): Promise<MediaResult> {
  const context: ActionContext = {
    outputDir: options.out ?? process.cwd() + '/.agent-media',
    provider: options.provider,
  };

  return executeAction(
    globalRegistry,
    {
      action: 'generate',
      options: {
        prompt: options.prompt,
        width: options.width,
        height: options.height,
        count: options.count,
      },
    },
    context
  );
}
