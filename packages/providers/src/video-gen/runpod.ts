import { readFile } from 'node:fs/promises';
import type { VideoGenerationConfig, VideoGenerationResult } from './index.js';

interface RunpodJobResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

interface RunpodStatusResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: {
    video_url?: string;
    result?: string;
  };
  error?: string;
}

function snapDuration(duration: number): 5 | 10 | 15 {
  if (duration <= 7) return 5;
  if (duration <= 12) return 10;
  return 15;
}

function mapResolution(resolution: string): string {
  switch (resolution) {
    case '1080p':
      return '1920*1080';
    case '720p':
    default:
      return '1280*720';
  }
}

async function prepareImageInput(imagePath: string, isUrl: boolean): Promise<string> {
  if (isUrl) {
    return imagePath;
  }
  const buffer = await readFile(imagePath);
  const base64 = buffer.toString('base64');
  const ext = imagePath.toLowerCase().split('.').pop();
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

async function pollForCompletion(
  endpoint: string,
  jobId: string,
  apiKey: string,
  maxAttempts: number = 60,
  pollInterval: number = 5000
): Promise<RunpodStatusResponse> {
  const statusUrl = `${endpoint.replace('/run', '')}/status/${jobId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to check job status: ${response.statusText}`);
    }

    const status = (await response.json()) as RunpodStatusResponse;

    if (status.status === 'COMPLETED') {
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error || 'Video generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Video generation timed out');
}

export async function generateVideoRunpod(
  config: VideoGenerationConfig,
  apiKey: string
): Promise<VideoGenerationResult> {
  const {
    prompt,
    inputImage,
    inputIsUrl = false,
    duration = 5,
    resolution = '720p',
    generateAudio = false,
  } = config;

  const isImageToVideo = !!inputImage;
  const endpoint = isImageToVideo
    ? 'https://api.runpod.ai/v2/wan-2-6-i2v/run'
    : 'https://api.runpod.ai/v2/wan-2-6-t2v/run';

  const input: Record<string, unknown> = {
    prompt,
    duration: snapDuration(duration),
    size: mapResolution(resolution),
    enable_audio: generateAudio,
  };

  if (isImageToVideo && inputImage) {
    const imageUrl = await prepareImageInput(inputImage, inputIsUrl);
    input['image'] = imageUrl;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit video generation job: ${response.statusText} - ${errorText}`);
  }

  const job = (await response.json()) as RunpodJobResponse;
  const result = await pollForCompletion(endpoint, job.id, apiKey);
  const videoUrl = result.output?.video_url || result.output?.result;

  if (!videoUrl) {
    throw new Error('No video URL returned from Runpod API');
  }

  return {
    url: videoUrl,
    contentType: 'video/mp4',
  };
}
