import { mkdir } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Default output directory name
 */
export const DEFAULT_OUTPUT_DIR = '.agent-media';

/**
 * Configuration for agent-media
 */
export interface AgentMediaConfig {
  /** Base output directory */
  outputDir: string;
  /** API keys for providers */
  apiKeys: {
    fal?: string;
    replicate?: string;
    runpod?: string;
  };
}

/**
 * Get configuration from environment variables and defaults
 */
export function getConfig(): AgentMediaConfig {
  const outputDir =
    process.env['AGENT_MEDIA_DIR'] ?? join(process.cwd(), DEFAULT_OUTPUT_DIR);

  return {
    outputDir: resolve(outputDir),
    apiKeys: {
      fal: process.env['FAL_API_KEY'],
      replicate: process.env['REPLICATE_API_TOKEN'],
      runpod: process.env['RUNPOD_API_KEY'],
    },
  };
}

/**
 * Ensure the output directory exists
 */
export async function ensureOutputDir(outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
}

/**
 * Generate a unique output filename (legacy function for backwards compatibility)
 */
export function generateOutputFilename(
  extension: string,
  prefix = 'output'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Extract base filename without extension from a path or URL
 */
export function extractBasename(source: string): string {
  // Handle URLs
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const url = new URL(source);
    const pathname = url.pathname;
    const filename = pathname.split('/').pop() || 'file';
    return filename.replace(/\.[^.]+$/, '');
  }
  // Handle local paths
  const filename = basename(source);
  return filename.replace(/\.[^.]+$/, '');
}

/**
 * Resolve output filename based on context
 * - If customName provided: use it (with correct extension)
 * - If inputSource provided: derive from input filename
 * - Otherwise: use action prefix
 */
export function resolveOutputFilename(
  extension: string,
  actionPrefix: string,
  customName?: string,
  inputSource?: string
): string {
  if (customName) {
    // Strip any existing extension and add the correct one
    const baseName = customName.replace(/\.[^.]+$/, '');
    return `${baseName}.${extension}`;
  }

  // Generate UUID without dashes for cleaner filenames
  const uuid = randomUUID().replace(/-/g, '');

  if (inputSource) {
    // Derive from input: {basename}_{action}_{uuid}.{ext}
    const baseName = extractBasename(inputSource);
    return `${baseName}_${actionPrefix}_${uuid}.${extension}`;
  }

  // No input (e.g., generate): {action}_{uuid}.{ext}
  return `${actionPrefix}_${uuid}.${extension}`;
}

/**
 * Get the full output path for a file
 */
export function getOutputPath(
  outputDir: string,
  filename: string
): string {
  return join(outputDir, filename);
}

/**
 * Merged configuration result
 */
export interface MergedConfig {
  outputDir: string;
  provider?: string;
  outputName?: string;
}

/**
 * Merge CLI options with config defaults
 * CLI options take precedence over environment config
 */
export function mergeConfig(
  config: AgentMediaConfig,
  cliOptions: {
    out?: string;
    provider?: string;
    name?: string;
  }
): MergedConfig {
  return {
    outputDir: cliOptions.out ? resolve(cliOptions.out) : config.outputDir,
    provider: cliOptions.provider,
    outputName: cliOptions.name,
  };
}
