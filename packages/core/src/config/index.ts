import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

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
 * Generate a unique output filename
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
  }
): MergedConfig {
  return {
    outputDir: cliOptions.out ? resolve(cliOptions.out) : config.outputDir,
    provider: cliOptions.provider,
  };
}
