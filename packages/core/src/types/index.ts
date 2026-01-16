/**
 * Supported media types
 */
export type MediaType = 'image' | 'video' | 'audio';

/**
 * Supported image actions
 */
export type ImageAction = 'resize' | 'convert' | 'remove-background' | 'generate' | 'extend' | 'edit';

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
  | { action: 'edit'; options: EditOptions };

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
export type MediaResult = MediaSuccessResult | MediaErrorResult;

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
