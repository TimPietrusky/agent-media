import { globalRegistry } from '@agent-media/core';
import { localProvider } from './local/index.js';
import { falProvider } from './fal/index.js';
import { replicateProvider } from './replicate/index.js';
import { runpodProvider } from './runpod/index.js';

// Export individual providers
export { localProvider } from './local/index.js';
export { falProvider } from './fal/index.js';
export { replicateProvider } from './replicate/index.js';
export { runpodProvider } from './runpod/index.js';

/**
 * All available providers
 */
export const providers = {
  local: localProvider,
  fal: falProvider,
  replicate: replicateProvider,
  runpod: runpodProvider,
};

/**
 * Register all providers with the global registry
 */
export function registerAllProviders(): void {
  globalRegistry.register(localProvider);
  globalRegistry.register(falProvider);
  globalRegistry.register(replicateProvider);
  globalRegistry.register(runpodProvider);
}

/**
 * Register only the local provider (for minimal setup)
 */
export function registerLocalProvider(): void {
  globalRegistry.register(localProvider);
}
