#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { registerAllProviders } from '@agent-media/providers';
import { resize, convert, removeBackground, generate, extend, edit, printResult } from '@agent-media/image';
import { extract, transcribe } from '@agent-media/audio';
import { generate as videoGenerate } from '@agent-media/video';
import type { ImageFormat, AudioFormat, VideoResolution, VideoFps } from '@agent-media/core';
import { getConfig, mergeConfig } from '@agent-media/core';

// Register all providers on startup
registerAllProviders();

const program = new Command();

program
  .name('agent-media')
  .description('Agent-first media toolkit with CLI-accessible commands')
  .version('0.1.0');

// Image command group
const imageCommand = program
  .command('image')
  .description('Image manipulation commands');

// Image resize command
imageCommand
  .command('resize')
  .description('Resize an image to specified dimensions')
  .requiredOption('--in <path>', 'Input file path or URL')
  .option('--width <pixels>', 'Target width in pixels', parseInt)
  .option('--height <pixels>', 'Target height in pixels', parseInt)
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (local, fal, replicate, runpod)')
  .action(async (options: {
    in: string;
    width?: number;
    height?: number;
    out?: string;
    name?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await resize({
      input: options.in,
      width: options.width,
      height: options.height,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Image convert command
imageCommand
  .command('convert')
  .description('Convert an image to a different format')
  .requiredOption('--in <path>', 'Input file path or URL')
  .requiredOption('--format <format>', 'Output format (png, jpg, webp)')
  .option('--quality <percent>', 'Quality for lossy formats (1-100)', parseInt)
  .option('--dpi <number>', 'DPI/density for output image (default: 72)', parseInt)
  .option('--width <pixels>', 'Target width in pixels', parseInt)
  .option('--height <pixels>', 'Target height in pixels', parseInt)
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (local, fal, replicate, runpod)')
  .action(async (options: {
    in: string;
    format: string;
    quality?: number;
    dpi?: number;
    width?: number;
    height?: number;
    out?: string;
    name?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await convert({
      input: options.in,
      format: options.format as ImageFormat,
      quality: options.quality,
      dpi: options.dpi,
      width: options.width,
      height: options.height,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Image remove-background command
imageCommand
  .command('remove-background')
  .description('Remove the background from an image')
  .requiredOption('--in <path>', 'Input file path or URL')
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (fal, replicate)')
  .option('--model <name>', 'Model to use (overrides provider default)')
  .action(async (options: {
    in: string;
    out?: string;
    name?: string;
    provider?: string;
    model?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await removeBackground({
      input: options.in,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
      model: options.model,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Image generate command
imageCommand
  .command('generate')
  .description('Generate an image from a text prompt')
  .requiredOption('--prompt <text>', 'Text description of the image to generate')
  .option('--width <pixels>', 'Width of the generated image', parseInt)
  .option('--height <pixels>', 'Height of the generated image', parseInt)
  .option('--count <number>', 'Number of images to generate', parseInt)
  .option('--seed <number>', 'Seed for reproducible image generation', parseInt)
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (fal, replicate, runpod)')
  .option('--model <name>', 'Model to use (overrides provider default, e.g., fal-ai/flux-2)')
  .action(async (options: {
    prompt: string;
    width?: number;
    height?: number;
    count?: number;
    seed?: number;
    out?: string;
    name?: string;
    provider?: string;
    model?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await generate({
      prompt: options.prompt,
      width: options.width,
      height: options.height,
      count: options.count,
      seed: options.seed,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
      model: options.model,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Image extend command
imageCommand
  .command('extend')
  .description('Extend image canvas by adding padding on all sides with a solid background color')
  .requiredOption('--in <path>', 'Input file path or URL')
  .requiredOption('--padding <pixels>', 'Padding size in pixels to add on all sides', parseInt)
  .requiredOption('--color <hex>', 'Background color for extended area (e.g., "#E4ECF8"). Also flattens transparency.')
  .option('--dpi <number>', 'DPI/density for output image (default: 300)', parseInt)
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (local)')
  .action(async (options: {
    in: string;
    padding: number;
    color: string;
    dpi?: number;
    out?: string;
    name?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await extend({
      input: options.in,
      padding: options.padding,
      color: options.color,
      dpi: options.dpi,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Image edit command
imageCommand
  .command('edit')
  .description('Edit an image using a text prompt (image-to-image)')
  .requiredOption('--in <path>', 'Input file path or URL')
  .requiredOption('--prompt <text>', 'Text description of the desired edit')
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (fal, replicate, runpod)')
  .option('--model <name>', 'Model to use (overrides provider default, e.g., fal-ai/flux-2/edit)')
  .action(async (options: {
    in: string;
    prompt: string;
    out?: string;
    name?: string;
    provider?: string;
    model?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await edit({
      input: options.in,
      prompt: options.prompt,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
      model: options.model,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Audio command group
const audioCommand = program
  .command('audio')
  .description('Audio processing commands');

// Audio extract command
audioCommand
  .command('extract')
  .description('Extract audio track from a video file (local processing, no API needed)')
  .requiredOption('--in <path>', 'Input video file path or URL')
  .option('--format <format>', 'Output audio format (mp3, wav)', 'mp3')
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .action(async (options: {
    in: string;
    format?: string;
    out?: string;
    name?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, name: options.name });

    const result = await extract({
      input: options.in,
      format: (options.format as AudioFormat) || 'mp3',
      out: merged.outputDir,
      name: merged.outputName,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Audio transcribe command
audioCommand
  .command('transcribe')
  .description('Transcribe audio to text with timestamps')
  .requiredOption('--in <path>', 'Input audio file path or URL')
  .option('--diarize', 'Enable speaker identification')
  .option('--language <code>', 'Language code (auto-detected if not provided)')
  .option('--speakers <number>', 'Number of speakers hint', parseInt)
  .option('--out <path>', 'Output directory')
  .option('--provider <name>', 'Provider to use (fal, replicate)')
  .option('--model <name>', 'Model to use (overrides provider default)')
  .action(async (options: {
    in: string;
    diarize?: boolean;
    language?: string;
    speakers?: number;
    out?: string;
    provider?: string;
    model?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await transcribe({
      input: options.in,
      diarize: options.diarize,
      language: options.language,
      numSpeakers: options.speakers,
      out: merged.outputDir,
      provider: merged.provider,
      model: options.model,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Video command group
const videoCommand = program
  .command('video')
  .description('Video processing commands');

// Video generate command
videoCommand
  .command('generate')
  .description('Generate video from a text prompt, optionally animating an input image')
  .requiredOption('--prompt <text>', 'Text description of the video to generate')
  .option('--in <path>', 'Input image for image-to-video')
  .option('--duration <seconds>', 'Duration in seconds (6, 8, 10, 12, 14, 16, 18, 20)', parseInt)
  .option('--resolution <res>', 'Video resolution (720p, 1080p, 1440p, 2160p)')
  .option('--fps <rate>', 'Frame rate (25 or 50)', parseInt)
  .option('--audio', 'Generate audio track')
  .option('--out <path>', 'Output directory')
  .option('--name <filename>', 'Output filename (extension auto-added if missing)')
  .option('--provider <name>', 'Provider to use (fal, replicate)')
  .option('--model <name>', 'Model to use (overrides provider default)')
  .action(async (options: {
    prompt: string;
    in?: string;
    duration?: number;
    resolution?: string;
    fps?: number;
    audio?: boolean;
    out?: string;
    name?: string;
    provider?: string;
    model?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider, name: options.name });

    const result = await videoGenerate({
      prompt: options.prompt,
      input: options.in,
      duration: options.duration,
      resolution: options.resolution as VideoResolution | undefined,
      fps: options.fps as VideoFps | undefined,
      audio: options.audio,
      out: merged.outputDir,
      name: merged.outputName,
      provider: merged.provider,
      model: options.model,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Parse and execute
program.parse();
