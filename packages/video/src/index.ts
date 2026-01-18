// Video package - video-specific actions

// Export actions
export { generate } from './actions/index.js';
export type { VideoGenerateInput } from './actions/index.js';

// Re-export core types for convenience
export type {
  MediaResult,
  VideoResolution,
  VideoFps,
} from '@agent-media/core';

export { isSuccess, isError, printResult } from '@agent-media/core';
