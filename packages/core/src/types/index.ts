/**
 * Supported media types
 */
export type MediaType = 'image' | 'video' | 'audio';

/**
 * Supported image actions
 */
export type ImageAction = 'resize' | 'convert' | 'remove-background' | 'generate' | 'extend' | 'edit';

/**
 * Supported audio actions
 */
export type AudioAction = 'extract' | 'transcribe';

/**
 * Supported audio output formats for extraction
 */
export type AudioFormat = 'mp3' | 'wav';

/**
 * Options for extract action (extract audio from video)
 */
export interface ExtractOptions {
  input: MediaInput;
  /** Output audio format */
  format?: AudioFormat;
}

/**
 * Supported image formats
 */
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

/**
 * Input source for media operations
 */
export interface MediaInput {
  /** Local file path or URL */
  source: string;
  /** Whether the source is a URL */
  isUrl: boolean;
}

/**
 * Options for resize action
 */
export interface ResizeOptions {
  input: MediaInput;
  width?: number;
  height?: number;
  /** Maintain aspect ratio (default: true) */
  maintainAspectRatio?: boolean;
}

/**
 * Options for convert action
 */
export interface ConvertOptions {
  input: MediaInput;
  format: ImageFormat;
  /** Quality for lossy formats (1-100, default: 80) */
  quality?: number;
  /** DPI/density for output image (default: 72) */
  dpi?: number;
  /** Target width in pixels (for rasterizing vector formats like SVG) */
  width?: number;
  /** Target height in pixels (for rasterizing vector formats like SVG) */
  height?: number;
}

/**
 * Options for remove-background action
 */
export interface RemoveBackgroundOptions {
  input: MediaInput;
  /** Override default model (e.g., "fal-ai/birefnet/v2") */
  model?: string;
}

/**
 * Options for generate action
 */
export interface GenerateOptions {
  prompt: string;
  width?: number;
  height?: number;
  /** Number of images to generate (default: 1) */
  count?: number;
  /** Override default model (e.g., "fal-ai/flux-2", "black-forest-labs/flux-2-dev") */
  model?: string;
}

/**
 * Options for extend action
 */
export interface ExtendOptions {
  input: MediaInput;
  /** Padding size in pixels to add on all sides */
  padding: number;
  /** Background color for the extended area (hex, e.g., "#E4ECF8"). Also flattens any transparency to this color. */
  color: string;
  /** DPI/density for output image metadata */
  dpi?: number;
}

/**
 * Options for edit action (image-to-image with prompt)
 */
export interface EditOptions {
  input: MediaInput;
  /** Text prompt describing the desired edit */
  prompt: string;
  /** Override default model (e.g., "fal-ai/flux-2/edit") */
  model?: string;
}

/**
 * A segment of transcribed text with timing information
 */
export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

/**
 * Complete transcription data
 */
export interface TranscriptionData {
  text: string;
  language: string;
  segments: TranscriptionSegment[];
}

/**
 * Options for transcribe action
 */
export interface TranscribeOptions {
  input: MediaInput;
  diarize?: boolean;
  language?: string;
  numSpeakers?: number;
  /** Override default model (e.g., "fal-ai/whisper") */
  model?: string;
}

/**
 * Successful result from a transcription operation
 */
export interface TranscriptionSuccessResult {
  ok: true;
  media_type: 'video' | 'audio';
  action: 'transcribe';
  provider: string;
  output_path: string;
  transcription: TranscriptionData;
}

/**
 * Union type for all action options
 */
export type ActionOptions =
  | { action: 'resize'; options: ResizeOptions }
  | { action: 'convert'; options: ConvertOptions }
  | { action: 'remove-background'; options: RemoveBackgroundOptions }
  | { action: 'generate'; options: GenerateOptions }
  | { action: 'extend'; options: ExtendOptions }
  | { action: 'edit'; options: EditOptions }
  | { action: 'extract'; options: ExtractOptions }
  | { action: 'transcribe'; options: TranscribeOptions };

/**
 * Structured error information
 */
export interface MediaError {
  code: string;
  message: string;
}

/**
 * Successful result from a media operation
 */
export interface MediaSuccessResult {
  ok: true;
  media_type: MediaType;
  action: string;
  provider: string;
  output_path: string;
  mime: string;
  bytes: number;
}

/**
 * Failed result from a media operation
 */
export interface MediaErrorResult {
  ok: false;
  error: MediaError;
}

/**
 * Result from a media operation
 */
export type MediaResult = MediaSuccessResult | MediaErrorResult | TranscriptionSuccessResult;

/**
 * Context for executing an action
 */
export interface ActionContext {
  /** Output directory for results */
  outputDir: string;
  /** Explicitly selected provider (overrides auto-detection) */
  provider?: string;
}

/**
 * Provider interface that all media providers must implement
 */
export interface MediaProvider {
  /** Unique name of the provider */
  name: string;

  /** Check if this provider supports the given action */
  supports(action: string): boolean;

  /** Execute an action and return the result */
  execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult>;
}
