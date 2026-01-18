import { globalRegistry } from '@agent-media/core';
import { localProvider } from './local/index.js';
import { transformersProvider } from './transformers/index.js';
import { falProvider } from './fal/index.js';
import { replicateProvider } from './replicate/index.js';
import { runpodProvider } from './runpod/index.js';

// Export individual providers
export { localProvider } from './local/index.js';
export { transformersProvider } from './transformers/index.js';
export { falProvider } from './fal/index.js';
export { replicateProvider } from './replicate/index.js';
export { runpodProvider } from './runpod/index.js';

/**
 * All available providers
 */
export const providers = {
  local: localProvider,
  transformers: transformersProvider,
  fal: falProvider,
  replicate: replicateProvider,
  runpod: runpodProvider,
};

/**
 * Register all providers with the global registry
 * Order matters: local providers (local, transformers) are registered first
 * so they are preferred for actions they support when no explicit provider is specified.
 */
export function registerAllProviders(): void {
  globalRegistry.register(localProvider);
  globalRegistry.register(transformersProvider);
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
