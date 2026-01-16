import type { MediaProvider, MediaResult, ActionOptions, ActionContext } from '../types/index.js';
import { createError } from '../result/index.js';

/**
 * Environment variable to provider mapping for auto-detection
 */
const ENV_PROVIDER_MAP: Record<string, string> = {
  FAL_API_KEY: 'fal',
  REPLICATE_API_TOKEN: 'replicate',
  RUNPOD_API_KEY: 'runpod',
};

/**
 * Registry for managing media providers
 */
export class ProviderRegistry {
  private providers: Map<string, MediaProvider> = new Map();

  /**
   * Register a provider
   */
  register(provider: MediaProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  get(name: string): MediaProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider exists
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Find providers that support a given action
   */
  findSupportingProviders(action: string): MediaProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.supports(action)
    );
  }
}

/**
 * Detect provider from environment variables
 */
export function detectProviderFromEnv(): string | undefined {
  for (const [envVar, providerName] of Object.entries(ENV_PROVIDER_MAP)) {
    if (process.env[envVar]) {
      return providerName;
    }
  }
  return undefined;
}

/**
 * Resolve which provider to use based on:
 * 1. Explicit CLI flag (highest priority)
 * 2. Environment variable auto-detection
 * 3. Fallback to local provider
 */
export function resolveProvider(
  registry: ProviderRegistry,
  action: string,
  explicitProvider?: string
): MediaProvider | undefined {
  // 1. Explicit provider selection (highest priority)
  if (explicitProvider) {
    const provider = registry.get(explicitProvider);
    if (provider && provider.supports(action)) {
      return provider;
    }
    // If explicit provider doesn't support action, return undefined
    // Let the caller handle the error
    return undefined;
  }

  // 2. Auto-detect from environment variables
  const envProvider = detectProviderFromEnv();
  if (envProvider) {
    const provider = registry.get(envProvider);
    if (provider && provider.supports(action)) {
      return provider;
    }
  }

  // 3. Fallback to local provider
  const localProvider = registry.get('local');
  if (localProvider && localProvider.supports(action)) {
    return localProvider;
  }

  // 4. Find any provider that supports the action
  const supportingProviders = registry.findSupportingProviders(action);
  if (supportingProviders.length > 0) {
    return supportingProviders[0];
  }

  return undefined;
}

/**
 * Execute an action using the resolved provider
 */
export async function executeAction(
  registry: ProviderRegistry,
  actionConfig: ActionOptions,
  context: ActionContext
): Promise<MediaResult> {
  const provider = resolveProvider(
    registry,
    actionConfig.action,
    context.provider
  );

  if (!provider) {
    if (context.provider) {
      return createError(
        'PROVIDER_NOT_FOUND',
        `Provider '${context.provider}' not found or does not support action '${actionConfig.action}'`
      );
    }
    return createError(
      'NO_PROVIDER',
      `No provider available for action '${actionConfig.action}'`
    );
  }

  return provider.execute(actionConfig, context);
}

/**
 * Global provider registry instance
 */
export const globalRegistry = new ProviderRegistry();
