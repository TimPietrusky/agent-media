/**
 * Video generation abstraction layer
 * Provides consistent interface for video generation since AI SDK doesn't support video
 */

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
 * Generate video using Fal.ai LTX-2 model
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

  const { width, height } = getResolutionDimensions(resolution);

  // Determine endpoint based on whether we have an input image
  const isImageToVideo = !!inputImage;
  const endpoint = isImageToVideo
    ? 'https://fal.run/fal-ai/ltx-2/image-to-video/fast'
    : 'https://fal.run/fal-ai/ltx-2/text-to-video/fast';

  // Build request body
  const requestBody: Record<string, unknown> = {
    prompt,
    duration,
    fps,
    width,
    height,
  };

  // Add image input if provided
  if (isImageToVideo && inputImage) {
    const imageUrl = await prepareImageInput(inputImage, inputIsUrl);
    requestBody['image_url'] = imageUrl;
  }

  // Add audio generation if requested
  if (generateAudio) {
    requestBody['audio'] = {
      enabled: true,
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as {
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
 * Generate video using Replicate lightricks/ltx-video model
 * Uses polling API since video generation takes time
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

  // Create prediction
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'lightricks/ltx-video',
      input,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  const prediction = await response.json() as {
    id: string;
    status: string;
    output?: string | string[];
    urls?: { get: string };
    error?: string;
  };

  // Poll for completion
  const maxAttempts = 180; // 15 minutes max (video generation can take a while)
  let attempts = 0;
  let result = prediction;

  while (attempts < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    if (!result.urls?.get) {
      throw new Error('No polling URL returned from Replicate');
    }

    const pollResponse = await fetch(result.urls.get, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!pollResponse.ok) {
      throw new Error(`Failed to poll prediction status: ${pollResponse.status}`);
    }

    result = await pollResponse.json() as typeof prediction;
    attempts++;
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Video generation failed');
  }

  if (attempts >= maxAttempts) {
    throw new Error('Video generation timed out');
  }

  // Extract output URL
  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

  if (!outputUrl) {
    throw new Error('No video returned from Replicate');
  }

  return {
    url: outputUrl,
    contentType: 'video/mp4',
  };
}
