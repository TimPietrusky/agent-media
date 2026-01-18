import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type {
  MediaProvider,
  MediaResult,
  ActionOptions,
  ActionContext,
  ImageFormat,
  ResizeOptions,
  ConvertOptions,
  ExtendOptions,
} from '@agent-media/core';
import {
  createSuccess,
  createError,
  ensureOutputDir,
  generateOutputFilename,
  getOutputPath,
  ErrorCodes,
} from '@agent-media/core';
import { executeBackgroundRemoval } from '../transformers/background-removal.js';
import { executeTranscribe } from '../transformers/transcribe.js';

/**
 * Actions supported by the local provider
 * - Sharp: resize, convert, extend
 * - Transformers.js: remove-background, transcribe
 */
const SUPPORTED_ACTIONS = ['resize', 'convert', 'extend', 'remove-background', 'transcribe'];

/**
 * MIME types for image formats
 */
const MIME_TYPES: Record<ImageFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Get the output format extension
 */
function getFormatExtension(format: ImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/**
 * Get input stream from source (file path or URL)
 */
async function getInputBuffer(
  source: string,
  isUrl: boolean
): Promise<Buffer> {
  if (isUrl) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Read from file
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(source);
    stream.on('data', (chunk) => chunks.push(chunk as Buffer));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Local provider for zero-API-key operations
 * - Sharp: resize, convert, extend
 * - Transformers.js: remove-background, transcribe
 */
export const localProvider: MediaProvider = {
  name: 'local',

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    try {
      await ensureOutputDir(context.outputDir);

      switch (actionConfig.action) {
        case 'resize':
          return await executeResize(actionConfig.options, context);
        case 'convert':
          return await executeConvert(actionConfig.options, context);
        case 'extend':
          return await executeExtend(actionConfig.options, context);
        case 'remove-background': {
          const result = await executeBackgroundRemoval(actionConfig.options, context);
          if (result.ok) {
            return { ...result, provider: 'local' };
          }
          return result;
        }
        case 'transcribe': {
          const result = await executeTranscribe(actionConfig.options, context);
          if (result.ok) {
            return { ...result, provider: 'local' };
          }
          return result;
        }
        default:
          return createError(
            ErrorCodes.INVALID_INPUT,
            `Action '${actionConfig.action}' not supported by local provider`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

/**
 * Execute resize action
 */
async function executeResize(
  options: ResizeOptions,
  context: ActionContext
): Promise<MediaResult> {
  const { input, width, height, maintainAspectRatio = true } = options;

  if (!width && !height) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      'At least one of width or height must be specified'
    );
  }

  const inputBuffer = await getInputBuffer(input.source, input.isUrl);
  let pipeline = sharp(inputBuffer);

  // Get original metadata to determine output format
  const metadata = await pipeline.metadata();
  const outputFormat = (metadata.format as ImageFormat) || 'png';

  pipeline = pipeline.resize({
    width: width,
    height: height,
    fit: maintainAspectRatio ? 'inside' : 'fill',
    withoutEnlargement: true,
  });

  const outputFilename = generateOutputFilename(
    getFormatExtension(outputFormat),
    'resized'
  );
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await pipeline.toFile(outputPath);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'resize',
    provider: 'local',
    outputPath: outputPath,
    mime: MIME_TYPES[outputFormat] ?? 'application/octet-stream',
    bytes: stats.size,
  });
}

/**
 * Check if source is an SVG file
 */
function isSvgSource(source: string): boolean {
  return source.toLowerCase().endsWith('.svg');
}

/**
 * Execute convert action
 */
async function executeConvert(
  options: ConvertOptions,
  context: ActionContext
): Promise<MediaResult> {
  const { input, format, quality = 80, dpi = 72, width, height } = options;

  const isSvg = isSvgSource(input.source);
  const inputBuffer = await getInputBuffer(input.source, input.isUrl);

  // For SVG files, we need to specify density and optionally resize
  // Sharp uses density (DPI) when rasterizing SVGs
  let pipeline: sharp.Sharp;

  if (isSvg) {
    // When converting SVG, use the specified DPI for rasterization
    // If width/height provided, Sharp will resize accordingly
    const sharpOptions: sharp.SharpOptions = {
      density: dpi,
    };
    pipeline = sharp(inputBuffer, sharpOptions);

    // If width or height specified, resize (maintaining aspect ratio)
    if (width || height) {
      pipeline = pipeline.resize({
        width: width,
        height: height,
        fit: 'inside',
        withoutEnlargement: false, // Allow enlargement for high-DPI output
      });
    }
  } else {
    pipeline = sharp(inputBuffer);
  }

  // Apply format conversion with DPI metadata
  switch (format) {
    case 'png':
      pipeline = pipeline.png();
      break;
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      return createError(
        ErrorCodes.INVALID_FORMAT,
        `Unsupported output format: ${format}`
      );
  }

  // Set output DPI metadata using withMetadata
  pipeline = pipeline.withMetadata({
    density: dpi,
  });

  const outputFilename = generateOutputFilename(
    getFormatExtension(format),
    'converted'
  );
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await pipeline.toFile(outputPath);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'convert',
    provider: 'local',
    outputPath: outputPath,
    mime: MIME_TYPES[format] ?? 'application/octet-stream',
    bytes: stats.size,
  });
}

/**
 * Parse hex color to RGB object
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/**
 * Execute extend action
 * Extends the image canvas by adding padding on all sides with a solid background color.
 * Also flattens any transparency in the original image to the specified color.
 */
async function executeExtend(
  options: ExtendOptions,
  context: ActionContext
): Promise<MediaResult> {
  const { input, padding, color, dpi = 300 } = options;

  const inputBuffer = await getInputBuffer(input.source, input.isUrl);

  // Parse the background color
  const bgColor = parseHexColor(color);

  // Get input dimensions
  const metadata = await sharp(inputBuffer).metadata();
  const inputWidth = metadata.width || 0;
  const inputHeight = metadata.height || 0;

  // Calculate final dimensions with padding
  const finalWidth = inputWidth + padding * 2;
  const finalHeight = inputHeight + padding * 2;

  // Create a solid background canvas with the specified color
  // This ensures NO transparency anywhere in the final image
  const background = await sharp({
    create: {
      width: finalWidth,
      height: finalHeight,
      channels: 3,
      background: { r: bgColor.r, g: bgColor.g, b: bgColor.b },
    },
  })
    .png()
    .toBuffer();

  // Flatten the input image onto the background color (removes transparency)
  const flattenedInput = await sharp(inputBuffer)
    .flatten({ background: { r: bgColor.r, g: bgColor.g, b: bgColor.b } })
    .png()
    .toBuffer();

  // Composite the flattened image onto the background with padding offset
  let pipeline = sharp(background).composite([
    {
      input: flattenedInput,
      top: padding,
      left: padding,
    },
  ]);

  // Remove alpha channel and apply PNG format
  pipeline = pipeline.removeAlpha().png();

  // Set DPI metadata
  pipeline = pipeline.withMetadata({
    density: dpi,
  });

  const outputFilename = generateOutputFilename('png', 'extended');
  const outputPath = getOutputPath(context.outputDir, outputFilename);

  await pipeline.toFile(outputPath);

  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: 'image',
    action: 'extend',
    provider: 'local',
    outputPath: outputPath,
    mime: 'image/png',
    bytes: stats.size,
  });
}

export default localProvider;
