// Export all actions
export {
  resize,
  convert,
  removeBackground,
  generate,
  extend,
  edit,
} from './actions/index.js';

// Export action input types
export type {
  ResizeInput,
  ConvertInput,
  RemoveBackgroundInput,
  GenerateInput,
  ExtendInput,
  EditInput,
} from './actions/index.js';

// Re-export core types for convenience
export type {
  MediaResult,
  MediaSuccessResult,
  MediaErrorResult,
  ImageFormat,
} from '@agent-media/core';

export { isSuccess, isError, printResult } from '@agent-media/core';
