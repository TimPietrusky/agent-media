// Types
export type {
  MediaType,
  ImageAction,
  ImageFormat,
  MediaInput,
  ResizeOptions,
  ConvertOptions,
  RemoveBackgroundOptions,
  GenerateOptions,
  ExtendOptions,
  EditOptions,
  ActionOptions,
  MediaError,
  MediaSuccessResult,
  MediaErrorResult,
  MediaResult,
  ActionContext,
  MediaProvider,
} from './types/index.js';

// Provider
export {
  ProviderRegistry,
  detectProviderFromEnv,
  resolveProvider,
  executeAction,
  globalRegistry,
} from './provider/index.js';

// Config
export {
  DEFAULT_OUTPUT_DIR,
  getConfig,
  ensureOutputDir,
  generateOutputFilename,
  getOutputPath,
  mergeConfig,
} from './config/index.js';
export type { AgentMediaConfig, MergedConfig } from './config/index.js';

// Result
export {
  ErrorCodes,
  createSuccess,
  createError,
  isSuccess,
  isError,
  formatResult,
  printResult,
} from './result/index.js';
export type { ErrorCode } from './result/index.js';
