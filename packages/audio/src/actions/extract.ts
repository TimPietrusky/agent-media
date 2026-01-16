import { spawn } from 'node:child_process';
import { writeFile, stat, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import type { MediaResult } from '@agent-media/core';
import {
  createSuccess,
  createError,
  ensureOutputDir,
  generateOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';

/**
 * Supported audio output formats for extraction
 */
export type AudioOutputFormat = 'mp3' | 'wav';

export interface ExtractInput {
  /** Input video file path or URL */
  input: string;
  /** Output audio format (mp3, wav) */
  format?: AudioOutputFormat;
  /** Output directory (overrides default) */
  out?: string;
}

/**
 * Run ffmpeg command and return a promise
 */
function runFfmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('ffmpeg-static path not found'));
      return;
    }

    const process = spawn(ffmpegPath, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Extract audio track from a video file
 * Uses ffmpeg-static - binary is bundled, no external installation required
 */
export async function extract(options: ExtractInput): Promise<MediaResult> {
  const { input: inputPath, format = 'mp3', out } = options;
  const outputDir = out ?? process.cwd() + '/.agent-media';

  try {
    await ensureOutputDir(outputDir);

    // Check if input is URL or local file
    const isUrl = inputPath.startsWith('http://') || inputPath.startsWith('https://');

    let actualInputPath = inputPath;
    let tempFile: string | null = null;

    // If URL, download to temp file first
    if (isUrl) {
      const response = await fetch(inputPath);
      if (!response.ok) {
        return createError(ErrorCodes.NETWORK_ERROR, `Failed to fetch URL: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create temp file
      tempFile = join(tmpdir(), `agent-media-${Date.now()}.tmp`);
      await writeFile(tempFile, buffer);
      actualInputPath = tempFile;
    }

    // Generate output filename
    const outputFilename = generateOutputFilename(format, 'extracted');
    const outputPath = getOutputPath(outputDir, outputFilename);

    // Build ffmpeg arguments
    const args = [
      '-i', actualInputPath,
      '-vn', // No video
      '-acodec', format === 'mp3' ? 'libmp3lame' : 'pcm_s16le',
      '-y', // Overwrite output
      outputPath,
    ];

    // Run ffmpeg
    await runFfmpeg(args);

    // Clean up temp file if created
    if (tempFile) {
      await unlink(tempFile).catch(() => {}); // Ignore errors
    }

    const stats = await stat(outputPath);

    const mimeType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';

    return createSuccess({
      mediaType: 'audio',
      action: 'extract',
      provider: 'local',
      outputPath: outputPath,
      mime: mimeType,
      bytes: stats.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createError(ErrorCodes.PROVIDER_ERROR, `Audio extraction failed: ${message}`);
  }
}
