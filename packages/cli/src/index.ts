#!/usr/bin/env node

import { Command } from 'commander';
import { registerAllProviders } from '@agent-media/providers';
import { resize, convert, removeBackground, generate, extend, edit, printResult } from '@agent-media/image';
import type { ImageFormat } from '@agent-media/core';
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
  .option('--provider <name>', 'Provider to use (local, fal, replicate, runpod)')
  .action(async (options: {
    in: string;
    width?: number;
    height?: number;
    out?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await resize({
      input: options.in,
      width: options.width,
      height: options.height,
      out: merged.outputDir,
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
  .option('--provider <name>', 'Provider to use (local, fal, replicate, runpod)')
  .action(async (options: {
    in: string;
    format: string;
    quality?: number;
    dpi?: number;
    width?: number;
    height?: number;
    out?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await convert({
      input: options.in,
      format: options.format as ImageFormat,
      quality: options.quality,
      dpi: options.dpi,
      width: options.width,
      height: options.height,
      out: merged.outputDir,
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
  .option('--provider <name>', 'Provider to use (fal, replicate, runpod)')
  .action(async (options: {
    in: string;
    out?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await removeBackground({
      input: options.in,
      out: merged.outputDir,
      provider: merged.provider,
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
  .option('--out <path>', 'Output directory')
  .option('--provider <name>', 'Provider to use (fal, replicate, runpod)')
  .action(async (options: {
    prompt: string;
    width?: number;
    height?: number;
    count?: number;
    out?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await generate({
      prompt: options.prompt,
      width: options.width,
      height: options.height,
      count: options.count,
      out: merged.outputDir,
      provider: merged.provider,
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
  .option('--provider <name>', 'Provider to use (local)')
  .action(async (options: {
    in: string;
    padding: number;
    color: string;
    dpi?: number;
    out?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await extend({
      input: options.in,
      padding: options.padding,
      color: options.color,
      dpi: options.dpi,
      out: merged.outputDir,
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
  .option('--provider <name>', 'Provider to use (runpod)')
  .action(async (options: {
    in: string;
    prompt: string;
    out?: string;
    provider?: string;
  }) => {
    const config = getConfig();
    const merged = mergeConfig(config, { out: options.out, provider: options.provider });

    const result = await edit({
      input: options.in,
      prompt: options.prompt,
      out: merged.outputDir,
      provider: merged.provider,
    });

    printResult(result);
    process.exit(result.ok ? 0 : 1);
  });

// Parse and execute
program.parse();
