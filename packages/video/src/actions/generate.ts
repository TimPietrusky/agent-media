import type { MediaResult, MediaInput, ActionContext, VideoResolution, VideoFps } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface VideoGenerateInput {
  /** Text description of the video to generate */
  prompt: string;
  /** Input image path or URL for image-to-video (optional) */
  input?: string;
  /** Duration in seconds: 6, 8, 10, 12, 14, 16, 18, or 20 (default: 6) */
  duration?: number;
  /** Video resolution: 720p, 1080p, 1440p, 2160p (default: 720p) */
  resolution?: VideoResolution;
  /** Frame rate: 25 or 50 (default: 25) */
  fps?: VideoFps;
  /** Generate audio track (default: false) */
  audio?: boolean;
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
 * Generate a video from a text prompt
 * Optionally accepts an input image for image-to-video generation
 * Requires an external provider (fal or replicate)
 */
export async function generate(options: VideoGenerateInput): Promise<MediaResult> {
  // Prepare input if provided (for image-to-video)
  let input: MediaInput | undefined;
  if (options.input) {
    const isUrl = options.input.startsWith('http://') || options.input.startsWith('https://');
    input = {
      source: options.input,
      isUrl,
    };
  }

  const context: ActionContext = {
    outputDir: options.out ?? process.cwd() + '/.agent-media',
    provider: options.provider,
    outputName: options.name,
    inputSource: options.input,
  };

  return executeAction(
    globalRegistry,
    {
      action: 'video-generate',
      options: {
        prompt: options.prompt,
        input,
        duration: options.duration,
        resolution: options.resolution,
        fps: options.fps,
        generateAudio: options.audio,
        model: options.model,
      },
    },
    context
  );
}
