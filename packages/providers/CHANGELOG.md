# @agent-media/providers

## 0.10.0

### Minor Changes

- d61796e: Add image upscale action with AI super-resolution support for local (Swin2SR), fal (ESRGAN), and replicate (Real-ESRGAN) providers

### Patch Changes

- Updated dependencies [d61796e]
  - @agent-media/core@0.10.0

## 0.9.0

### Minor Changes

- 268f212: feat: add transcription support to RunPod provider

  - Upgrade @runpod/ai-sdk-provider to v1.2.0
  - Add transcribe action using pruna/whisper-v3-large model
  - Note: RunPod does not support diarization (speaker identification)

## 0.8.1

### Patch Changes

- Updated dependencies [1383717]
  - @agent-media/core@0.9.0

## 0.8.0

### Minor Changes

- df1311e: Add image crop action with configurable focal point

  - New `crop` action for images using Sharp's `extract()` method
  - Supports `--width` and `--height` for crop dimensions
  - Supports `--focus-x` and `--focus-y` (0-100%) to control focal point (default: center)
  - Crop region automatically clamped to image bounds
  - Local-only processing, no API key required

### Patch Changes

- Updated dependencies [df1311e]
  - @agent-media/core@0.8.0

## 0.7.0

### Minor Changes

- 02643b6: Add AI Gateway provider for image generation and editing via Vercel's unified API. Supports BFL Flux (flux-2-pro) for generation and Google Gemini (gemini-3-pro-image) for editing. Set AI_GATEWAY_API_KEY environment variable to use.

### Patch Changes

- Updated dependencies [02643b6]
  - @agent-media/core@0.7.0

## 0.6.0

### Minor Changes

- 8be70eb: Add seed parameter for reproducible image generation and refactor providers to use AI SDK consistently:

  **New feature:**

  - Add `--seed` option to `image generate` command for reproducible image generation

  **Refactoring:**

  - fal provider: Use AI SDK for all image operations (generate, edit, remove-background) and transcription
  - replicate provider: Use AI SDK for all image operations (generate, edit, remove-background); replicate SDK for transcription (AI SDK doesn't support replicate transcription)
  - video-gen: Use fal client SDK and replicate SDK for video generation (AI SDK doesn't support video)

### Patch Changes

- Updated dependencies [8be70eb]
  - @agent-media/core@0.6.0

## 0.5.2

### Patch Changes

- b0f02ba: Update repository URLs to agntswrm organization
- Updated dependencies [b0f02ba]
  - @agent-media/core@0.5.1

## 0.5.1

### Patch Changes

- cac474a: Update Replicate transcription and documentation

  - Switch Replicate transcription to thomasmol/whisper-diarization model
  - Remove HUGGINGFACE_ACCESS_TOKEN requirement (no longer needed)
  - Add woman-portrait.png (16:9 portrait for video generation)
  - Add woman-greeting.mp4 (talking avatar video example)
  - Add woman-greeting.mp3 (extracted speech audio example)
  - Rename portrait-headshot.png to man-portrait.png for consistency
  - Update all documentation with new file names and URL examples

## 0.5.0

### Minor Changes

- 6097a41: Add video generation command supporting text-to-video and image-to-video

  - New `video generate` CLI command with options for duration, resolution, fps, and audio
  - Support for fal.ai (LTX-2) and Replicate (lightricks/ltx-video) providers
  - Image-to-video: animate a static image with a text prompt
  - Optional audio generation with `--audio` flag

### Patch Changes

- Updated dependencies [6097a41]
  - @agent-media/core@0.5.0

## 0.4.0

### Minor Changes

- 5304b44: Add --name parameter for custom output filenames

  - New `--name` option on all file-generating commands to specify custom output filename
  - Without `--name`: output filename now derives from input filename (e.g., `photo_resized_<uuid>.png`)
  - With `--name`: uses exact name provided, auto-corrects extension if wrong
  - UUIDs in filenames are now without dashes for cleaner names

### Patch Changes

- Updated dependencies [5304b44]
  - @agent-media/core@0.4.0

## 0.3.0

### Minor Changes

- d0377dd: Add transformers.js provider for local ML inference without API keys

  - `remove-background` using Xenova/modnet model
  - `transcribe` using Moonshine model (5x faster than Whisper)
  - Models downloaded on first use and cached locally
  - Updated sharp to ^0.34.1 to match transformers.js requirements

## 0.2.0

### Minor Changes

- 36ce78a: Update to FLUX.2 models and add edit support to fal/replicate

  **Breaking Changes:**

  - Default image generation models updated:
    - fal: `fal-ai/flux/schnell` → `fal-ai/flux-2`
    - replicate: `black-forest-labs/flux-schnell` → `black-forest-labs/flux-2-dev`

  **New Features:**

  - Image editing support added to fal (`fal-ai/flux-2/edit`) and replicate (`black-forest-labs/flux-kontext-dev`)
  - `--model` flag added to generate, edit, remove-background, and transcribe commands for model override

  **Documentation:**

  - Added default models table to README
  - Added audio commands documentation
  - Added API key acquisition links
  - Added roadmap section

### Patch Changes

- Updated dependencies [36ce78a]
  - @agent-media/core@0.3.0

## 0.1.1

### Patch Changes

- Add audio package with extract and transcribe actions

  - New `@agent-media/audio` package with `ffmpeg-static` for local audio extraction
  - `audio extract`: Extract audio track from video files (MP3, WAV output)
  - `audio transcribe`: Moved from video package, transcribes audio to text with timestamps
  - New CLI commands: `agent-media audio extract` and `agent-media audio transcribe`
  - Updated providers to return `media_type: "audio"` for transcription results

- Updated dependencies
  - @agent-media/core@0.2.0
