/**
 * End-to-end tests for media providers
 *
 * These tests call actual APIs and require environment variables to be set:
 * - FAL_API_KEY
 * - REPLICATE_API_TOKEN
 * - RUNPOD_API_KEY
 * - AI_GATEWAY_API_KEY
 *
 * Run with: pnpm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync, statSync } from 'node:fs';

// Helper to run CLI commands and parse JSON output
function runCli(args: string): { ok: boolean; output_path?: string; error?: { code: string; message: string } } {
  try {
    const result = execSync(`node packages/agent-media/dist/index.js ${args}`, {
      encoding: 'utf-8',
      timeout: 120000,
    });
    return JSON.parse(result);
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        throw new Error(`CLI failed with non-JSON output: ${err.stdout}`);
      }
    }
    throw error;
  }
}

// Clean up generated files after tests
function cleanup(path: string | undefined) {
  if (path && existsSync(path)) {
    unlinkSync(path);
  }
}

describe('AI Gateway Provider', () => {
  const hasApiKey = !!process.env.AI_GATEWAY_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.warn('Skipping AI Gateway tests: AI_GATEWAY_API_KEY not set');
    }
  });

  describe('generate', () => {
    it.skipIf(!hasApiKey)('should generate an image with default model (bfl/flux-2-pro)', async () => {
      const result = runCli('image generate --prompt "A simple red circle on white background" --provider ai-gateway');

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      // Verify file has content
      const stats = statSync(result.output_path!);
      expect(stats.size).toBeGreaterThan(1000);

      cleanup(result.output_path);
    });

    it.skipIf(!hasApiKey)('should generate an image with custom model (google/imagen-4.0-fast-generate-001)', async () => {
      const result = runCli('image generate --prompt "A blue square" --model "google/imagen-4.0-fast-generate-001" --provider ai-gateway');

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      cleanup(result.output_path);
    });

    it.skipIf(!hasApiKey)('should handle errors gracefully', async () => {
      // Test with invalid model
      const result = runCli('image generate --prompt "test" --model "invalid/nonexistent-model" --provider ai-gateway');

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('PROVIDER_ERROR');
      // The error message should be a string, not "[object Promise]"
      expect(result.error?.message).not.toBe('[object Promise]');
    });
  });

  describe('edit', () => {
    let testImagePath: string | undefined;

    beforeAll(async () => {
      if (!hasApiKey) return;

      // Generate a test image to use for editing
      const result = runCli('image generate --prompt "A plain white background" --provider ai-gateway');
      if (result.ok) {
        testImagePath = result.output_path;
      }
    });

    it.skipIf(!hasApiKey)('should edit an image with default model (google/gemini-3-pro-image)', async () => {
      if (!testImagePath) {
        throw new Error('Test image not available');
      }

      const result = runCli(`image edit --in "${testImagePath}" --prompt "Add a red dot in the center" --provider ai-gateway`);

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      // Verify file has content
      const stats = statSync(result.output_path!);
      expect(stats.size).toBeGreaterThan(1000);

      cleanup(result.output_path);
      cleanup(testImagePath);
    });
  });
});

describe('Fal Provider', () => {
  const hasApiKey = !!process.env.FAL_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.warn('Skipping Fal tests: FAL_API_KEY not set');
    }
  });

  describe('generate', () => {
    it.skipIf(!hasApiKey)('should generate an image', async () => {
      const result = runCli('image generate --prompt "A green triangle" --provider fal');

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      cleanup(result.output_path);
    });
  });
});

describe('Replicate Provider', () => {
  const hasApiKey = !!process.env.REPLICATE_API_TOKEN;

  beforeAll(() => {
    if (!hasApiKey) {
      console.warn('Skipping Replicate tests: REPLICATE_API_TOKEN not set');
    }
  });

  describe('generate', () => {
    it.skipIf(!hasApiKey)('should generate an image', async () => {
      const result = runCli('image generate --prompt "A yellow star" --provider replicate');

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      cleanup(result.output_path);
    });
  });
});

describe('RunPod Provider', () => {
  const hasApiKey = !!process.env.RUNPOD_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.warn('Skipping RunPod tests: RUNPOD_API_KEY not set');
    }
  });

  describe('generate', () => {
    it.skipIf(!hasApiKey)('should generate an image', async () => {
      const result = runCli('image generate --prompt "A purple hexagon" --provider runpod');

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      cleanup(result.output_path);
    });
  });
});

describe('Local Provider', () => {
  describe('resize', () => {
    it('should resize an image', async () => {
      // First generate a test image using any available provider
      const providers = ['ai-gateway', 'fal', 'replicate', 'runpod'];
      let testImagePath: string | undefined;

      for (const provider of providers) {
        const envVars: Record<string, string> = {
          'ai-gateway': 'AI_GATEWAY_API_KEY',
          fal: 'FAL_API_KEY',
          replicate: 'REPLICATE_API_TOKEN',
          runpod: 'RUNPOD_API_KEY',
        };

        if (process.env[envVars[provider]]) {
          const result = runCli(`image generate --prompt "Test image" --provider ${provider}`);
          if (result.ok) {
            testImagePath = result.output_path;
            break;
          }
        }
      }

      if (!testImagePath) {
        console.warn('Skipping local resize test: no provider API key available to generate test image');
        return;
      }

      const result = runCli(`image resize --in "${testImagePath}" --width 256 --height 256 --provider local`);

      expect(result.ok).toBe(true);
      expect(result.output_path).toBeDefined();
      expect(existsSync(result.output_path!)).toBe(true);

      cleanup(result.output_path);
      cleanup(testImagePath);
    });
  });
});
