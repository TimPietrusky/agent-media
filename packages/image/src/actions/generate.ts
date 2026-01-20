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
  /** Seed for reproducible image generation */
  seed?: number;
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
 * Generate an image from a text prompt
 * Requires an external provider (file, replicate, or runpod)
 */
export async function generate(options: GenerateInput): Promise<MediaResult> {
  const context: ActionContext = {
    outputDir: options.out ?? process.cwd() + '/.agent-media',
    provider: options.provider,
    outputName: options.name,
    // No inputSource for generate - uses generic prefix
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
        seed: options.seed,
        model: options.model,
      },
    },
    context
  );
}
