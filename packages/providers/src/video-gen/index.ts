/**
 * Video generation abstraction layer
 * Provides consistent interface for video generation since AI SDK doesn't support video
 * Uses provider SDKs (fal client, replicate) instead of raw fetch
 */

import { fal } from '@fal-ai/client';
import Replicate from 'replicate';
import { readFile } from 'node:fs/promises';
import type { VideoResolution, VideoFps } from '@agent-media/core';

/**
 * Configuration for video generation
 */
export interface VideoGenerationConfig {
  /** Text description of the video to generate */
  prompt: string;
  /** Input image path or URL for image-to-video (optional) */
  inputImage?: string;
  /** Whether input is a URL */
  inputIsUrl?: boolean;
  /** Duration in seconds */
  duration?: number;
  /** Video resolution */
  resolution?: VideoResolution;
  /** Frame rate */
  fps?: VideoFps;
  /** Generate audio track */
  generateAudio?: boolean;
  /** Model override */
  model?: string;
}

/**
 * Result from video generation
 */
export interface VideoGenerationResult {
  /** URL to download the generated video */
  url: string;
  /** Content type of the video */
  contentType: string;
}

/**
 * Map resolution string to dimensions
 */
function getResolutionDimensions(resolution: VideoResolution): { width: number; height: number } {
  switch (resolution) {
    case '720p':
      return { width: 1280, height: 720 };
    case '1080p':
      return { width: 1920, height: 1080 };
    case '1440p':
      return { width: 2560, height: 1440 };
    case '2160p':
      return { width: 3840, height: 2160 };
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Prepare image for API submission
 * Converts local files to data URI
 */
async function prepareImageInput(imagePath: string, isUrl: boolean): Promise<string> {
  if (isUrl) {
    return imagePath;
  }

  // Convert local file to data URI
  const buffer = await readFile(imagePath);
  const base64 = buffer.toString('base64');
  const ext = imagePath.toLowerCase().split('.').pop();
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Generate video using Fal.ai LTX-2 model via fal client SDK
 * Uses text-to-video or image-to-video endpoint based on input
 */
export async function generateVideoFal(
  config: VideoGenerationConfig,
  apiKey: string
): Promise<VideoGenerationResult> {
  const {
    prompt,
    inputImage,
    inputIsUrl = false,
    duration = 6,
    resolution = '720p',
    fps = 25,
    generateAudio = false,
  } = config;

  // Configure fal client with API key
  fal.config({ credentials: apiKey });

  const { width, height } = getResolutionDimensions(resolution);

  // Determine model based on whether we have an input image
  const isImageToVideo = !!inputImage;
  const model = isImageToVideo
    ? 'fal-ai/ltx-2/image-to-video/fast'
    : 'fal-ai/ltx-2/text-to-video/fast';

  // Build request input
  const requestInput: Record<string, unknown> = {
    prompt,
    duration,
    fps,
    width,
    height,
  };

  // Add image input if provided
  if (isImageToVideo && inputImage) {
    const imageUrl = await prepareImageInput(inputImage, inputIsUrl);
    requestInput['image_url'] = imageUrl;
  }

  // Add audio generation if requested
  if (generateAudio) {
    requestInput['audio'] = {
      enabled: true,
    };
  }

  // Call fal via SDK (handles auth and request formatting)
  // Using type assertion for dynamic model selection
  const response = await (fal.run as (endpoint: string, options: { input: unknown }) => Promise<{ data: unknown }>)(model, { input: requestInput });

  const result = response.data as {
    video?: { url: string; content_type?: string };
  };

  if (!result.video?.url) {
    throw new Error('No video returned from Fal API');
  }

  return {
    url: result.video.url,
    contentType: result.video.content_type || 'video/mp4',
  };
}

/**
 * Generate video using Replicate lightricks/ltx-video model via Replicate SDK
 * SDK handles polling automatically
 */
export async function generateVideoReplicate(
  config: VideoGenerationConfig,
  apiToken: string
): Promise<VideoGenerationResult> {
  const {
    prompt,
    inputImage,
    inputIsUrl = false,
    duration = 6,
    resolution = '720p',
    fps = 25,
  } = config;

  // Initialize Replicate client
  const replicate = new Replicate({ auth: apiToken });

  const { width, height } = getResolutionDimensions(resolution);

  // Determine if this is image-to-video
  const isImageToVideo = !!inputImage;

  // Build request input
  const input: Record<string, unknown> = {
    prompt,
    num_frames: Math.round(duration * fps), // Convert duration to frame count
    width,
    height,
    fps,
  };

  // Add image input if provided
  if (isImageToVideo && inputImage) {
    const imageUrl = await prepareImageInput(inputImage, inputIsUrl);
    input['image'] = imageUrl;
  }

  // Call Replicate via SDK (handles polling automatically)
  const output = await replicate.run('lightricks/ltx-video', { input });

  // Extract output URL
  const outputUrl = Array.isArray(output) ? output[0] : output;

  if (!outputUrl || typeof outputUrl !== 'string') {
    throw new Error('No video returned from Replicate');
  }

  return {
    url: outputUrl,
    contentType: 'video/mp4',
  };
}
