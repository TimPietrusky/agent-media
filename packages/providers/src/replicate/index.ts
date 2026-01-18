import { createReplicate } from '@ai-sdk/replicate';
import { generateImage } from 'ai';
import { writeFile, readFile, stat } from 'node:fs/promises';
import type {
  MediaProvider,
  MediaResult,
  ActionOptions,
  ActionContext,
  GenerateOptions,
  RemoveBackgroundOptions,
  TranscribeOptions,
  TranscriptionData,
  EditOptions,
  VideoGenerateOptions,
} from '@agent-media/core';
import {
  createSuccess,
  createError,
  createTranscriptionSuccess,
  ensureOutputDir,
  resolveOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';
import { generateVideoReplicate } from '../video-gen/index.js';

/**
 * Actions supported by the replicate provider
 */
const SUPPORTED_ACTIONS = ['generate', 'remove-background', 'transcribe', 'edit', 'video-generate'];

/**
 * Replicate provider for image generation and processing
 * Requires REPLICATE_API_TOKEN environment variable
 */
export const replicateProvider: MediaProvider = {
  name: 'replicate',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    const apiToken = process.env['REPLICATE_API_TOKEN'];

    if (!apiToken) {
      return createError(
        ErrorCodes.API_ERROR,
        'REPLICATE_API_TOKEN environment variable is not set'
      );
    }

    try {
      await ensureOutputDir(context.outputDir);

      switch (actionConfig.action) {
        case 'generate':
          return await executeGenerate(actionConfig.options, context, apiToken);
        case 'remove-background':
          return await executeRemoveBackground(actionConfig.options, context, apiToken);
        case 'transcribe':
          return await executeTranscribe(actionConfig.options, context, apiToken);
        case 'edit':
          return await executeEdit(actionConfig.options, context, apiToken);
        case 'video-generate':
          return await executeVideoGenerate(actionConfig.options, context, apiToken);
        default:
          return createError(
            ErrorCodes.INVALID_INPUT,
            `Action '${actionConfig.action}' not supported by replicate provider`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

/**
 * Execute generate action using Replicate flux model via AI SDK
 * Default model: black-forest-labs/flux-2-dev (FLUX.2 Dev)
 */
async function executeGenerate(
  options: GenerateOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { prompt, width = 1024, height = 1024, model } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image generation');
  }

  const replicateClient = createReplicate({ apiToken });
  const modelId = model || 'black-forest-labs/flux-2-dev';

  const { image } = await generateImage({
    model: replicateClient.image(modelId),
    prompt,
    size: `${width}x${height}`,
  });

  const outputFilename = resolveOutputFilename('webp', 'generated', context.outputName);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'generate',
    provider: 'replicate',
    outputPath: outputPath,
    mime: 'image/webp',
    bytes: stats.size,
  });
}

/**
 * Execute edit action using Replicate flux-kontext model
 * Default model: black-forest-labs/flux-kontext-dev
 */
async function executeEdit(
  options: EditOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { input, prompt, model } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for image editing');
  }

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for image editing');
  }

  // Prepare the image input
  let imageUrl: string;
  if (input.isUrl) {
    imageUrl = input.source;
  } else {
    // Convert local file to data URI
    const buffer = await readFile(input.source);
    const base64 = buffer.toString('base64');
    const ext = input.source.toLowerCase().split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    imageUrl = `data:${mimeType};base64,${base64}`;
  }

  const modelId = model || 'black-forest-labs/flux-kontext-dev';

  // Call the edit model via Replicate API
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      model: modelId,
      input: {
        image: imageUrl,
        prompt,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return createError(ErrorCodes.API_ERROR, `Replicate API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as {
    output?: string | string[];
    status?: string;
    error?: string;
    urls?: { get: string };
  };

  // Handle async predictions (poll if needed)
  let outputUrl: string | undefined;
  if (result.status === 'succeeded' && result.output) {
    outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  } else if (result.status === 'processing' && result.urls?.get) {
    // Poll for completion
    const maxAttempts = 60;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Bearer ${apiToken}` },
      });
      const pollResult = await pollResponse.json() as typeof result;

      if (pollResult.status === 'succeeded' && pollResult.output) {
        outputUrl = Array.isArray(pollResult.output) ? pollResult.output[0] : pollResult.output;
        break;
      } else if (pollResult.status === 'failed') {
        return createError(ErrorCodes.PROVIDER_ERROR, pollResult.error || 'Edit failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    if (!outputUrl) {
      return createError(ErrorCodes.PROVIDER_ERROR, 'Edit timed out');
    }
  } else if (result.output) {
    outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  }

  if (!outputUrl) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'No image returned from edit operation');
  }

  // Download the edited image
  const imageResponse = await fetch(outputUrl);
  if (!imageResponse.ok) {
    return createError(ErrorCodes.NETWORK_ERROR, `Failed to download edited image: ${imageResponse.statusText}`);
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outputFilename = resolveOutputFilename('webp', 'edited', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, buffer);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'edit',
    provider: 'replicate',
    outputPath: outputPath,
    mime: 'image/webp',
    bytes: stats.size,
  });
}

/**
 * Execute remove-background action using Replicate BiRefNet model via AI SDK
 */
async function executeRemoveBackground(
  options: RemoveBackgroundOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { input } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for background removal');
  }

  const replicate = createReplicate({ apiToken });

  // Prepare the image input
  let imageBuffer: Buffer;
  if (input.isUrl) {
    const response = await fetch(input.source);
    if (!response.ok) {
      return createError(ErrorCodes.NETWORK_ERROR, `Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    imageBuffer = await readFile(input.source);
  }

  // Use BiRefNet for background removal (same model as fal provider)
  const { image } = await generateImage({
    model: replicate.image('men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7'),
    prompt: {
      text: '',
      images: [imageBuffer],
    },
  });

  const outputFilename = resolveOutputFilename('png', 'nobg', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, image.uint8Array);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'remove-background',
    provider: 'replicate',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

/**
 * Execute transcribe action using Replicate whisperx model
 * Supports diarization (requires HUGGINGFACE_ACCESS_TOKEN for pyannote model)
 */
async function executeTranscribe(
  options: TranscribeOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { input, diarize = false, language, numSpeakers } = options;

  if (!input?.source) {
    return createError(ErrorCodes.INVALID_INPUT, 'Input source is required for transcription');
  }

  // Prepare the audio input
  let audioUrl: string;
  if (input.isUrl) {
    audioUrl = input.source;
  } else {
    // Convert local file to data URI
    const buffer = await readFile(input.source);
    const base64 = buffer.toString('base64');
    // Detect mime type from extension
    const ext = input.source.toLowerCase().split('.').pop();
    let mimeType: string;
    switch (ext) {
      case 'mp3':
        mimeType = 'audio/mpeg';
        break;
      case 'wav':
        mimeType = 'audio/wav';
        break;
      case 'mp4':
      case 'm4a':
        mimeType = 'audio/mp4';
        break;
      case 'webm':
        mimeType = 'audio/webm';
        break;
      case 'ogg':
        mimeType = 'audio/ogg';
        break;
      default:
        mimeType = 'audio/mpeg';
    }
    audioUrl = `data:${mimeType};base64,${base64}`;
  }

  // Build request body for whisperx
  const requestBody: Record<string, unknown> = {
    audio_file: audioUrl,
    align_output: true,
  };

  if (diarize) {
    requestBody['diarization'] = true;
    // Note: Diarization requires HUGGINGFACE_ACCESS_TOKEN env var
    const hfToken = process.env['HUGGINGFACE_ACCESS_TOKEN'];
    if (hfToken) {
      requestBody['huggingface_access_token'] = hfToken;
    }
    if (numSpeakers) {
      requestBody['min_speakers'] = numSpeakers;
      requestBody['max_speakers'] = numSpeakers;
    }
  }

  if (language) {
    requestBody['language'] = language;
  }

  // Call whisperx via Replicate API
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb',
      input: requestBody,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return createError(ErrorCodes.API_ERROR, `Replicate API error: ${response.status} - ${errorText}`);
  }

  const prediction = await response.json() as {
    id: string;
    status: string;
    urls: { get: string };
  };

  // Poll for completion
  let result: {
    status: string;
    output?: {
      detected_language?: string;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
        speaker?: string;
      }>;
    };
    error?: string;
  };

  const maxAttempts = 120; // 10 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const pollResponse = await fetch(prediction.urls.get, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!pollResponse.ok) {
      return createError(ErrorCodes.API_ERROR, `Failed to poll prediction status`);
    }

    result = await pollResponse.json() as typeof result;

    if (result.status === 'succeeded') {
      break;
    } else if (result.status === 'failed') {
      return createError(ErrorCodes.PROVIDER_ERROR, result.error || 'Transcription failed');
    } else if (result.status === 'canceled') {
      return createError(ErrorCodes.PROVIDER_ERROR, 'Transcription was canceled');
    }

    // Wait 5 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'Transcription timed out');
  }

  if (!result!.output) {
    return createError(ErrorCodes.PROVIDER_ERROR, 'No output from transcription');
  }

  // Transform to our TranscriptionData format
  const segments = result!.output.segments || [];
  const transcription: TranscriptionData = {
    text: segments.map(s => s.text).join(' '),
    language: result!.output.detected_language || language || 'unknown',
    segments: segments.map(segment => ({
      start: segment.start,
      end: segment.end,
      text: segment.text,
      ...(segment.speaker ? { speaker: segment.speaker } : {}),
    })),
  };

  // Save transcription to JSON file
  const outputFilename = resolveOutputFilename('json', 'transcription', context.outputName, context.inputSource);
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await writeFile(outputPath, JSON.stringify(transcription, null, 2));

  return createTranscriptionSuccess({
    mediaType: 'audio',
    provider: 'replicate',
    outputPath: outputPath,
    transcription,
  });
}

/**
 * Execute video-generate action using Replicate lightricks/ltx-video model
 * Supports both text-to-video and image-to-video
 */
async function executeVideoGenerate(
  options: VideoGenerateOptions,
  context: ActionContext,
  apiToken: string
): Promise<MediaResult> {
  const { prompt, input, duration, resolution, fps, model } = options;

  if (!prompt) {
    return createError(ErrorCodes.INVALID_INPUT, 'Prompt is required for video generation');
  }

  try {
    const result = await generateVideoReplicate(
      {
        prompt,
        inputImage: input?.source,
        inputIsUrl: input?.isUrl,
        duration,
        resolution,
        fps,
        model,
      },
      apiToken
    );

    // Download the generated video
    const videoResponse = await fetch(result.url);
    if (!videoResponse.ok) {
      return createError(
        ErrorCodes.NETWORK_ERROR,
        `Failed to download generated video: ${videoResponse.statusText}`
      );
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const outputFilename = resolveOutputFilename('mp4', 'generated', context.outputName, context.inputSource);
    const outputPath = getOutputPath(context.outputDir, outputFilename);

    await writeFile(outputPath, buffer);

    const stats = await stat(outputPath);

    return createSuccess({
      mediaType: 'video',
      action: 'video-generate',
      provider: 'replicate',
      outputPath: outputPath,
      mime: 'video/mp4',
      bytes: stats.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createError(ErrorCodes.PROVIDER_ERROR, message);
  }
}

export default replicateProvider;
