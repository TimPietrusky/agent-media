import type { MediaResult, MediaInput, ActionContext } from '@agent-media/core';
import { executeAction, globalRegistry } from '@agent-media/core';

export interface TranscribeInput {
  /** Input audio file path or URL */
  input: string;
  /** Enable speaker identification */
  diarize?: boolean;
  /** Language code (auto-detected if not provided) */
  language?: string;
  /** Number of speakers hint */
  numSpeakers?: number;
  /** Output directory (overrides default) */
  out?: string;
  /** Provider to use (overrides auto-detection) */
  provider?: string;
  /** Model to use (overrides provider default) */
  model?: string;
}

/**
 * Transcribe audio to text with timestamps
 */
export async function transcribe(options: TranscribeInput): Promise<MediaResult> {
  const isUrl = options.input.startsWith('http://') || options.input.startsWith('https://');

  const input: MediaInput = {
    source: options.input,
    isUrl,
  };

  const context: ActionContext = {
    outputDir: options.out ?? process.cwd() + '/.agent-media',
    provider: options.provider,
  };

  return executeAction(
    globalRegistry,
    {
      action: 'transcribe',
      options: {
        input,
        diarize: options.diarize,
        language: options.language,
        numSpeakers: options.numSpeakers,
        model: options.model,
      },
    },
    context
  );
}
