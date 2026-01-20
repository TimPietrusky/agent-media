# @agent-media/image

## 0.5.0

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
  - @agent-media/providers@0.8.0

## 0.4.1

### Patch Changes

- Updated dependencies [02643b6]
  - @agent-media/core@0.7.0
  - @agent-media/providers@0.7.0

## 0.4.0

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
  - @agent-media/providers@0.6.0

## 0.3.3

### Patch Changes

- b0f02ba: Update repository URLs to agntswrm organization
- Updated dependencies [b0f02ba]
  - @agent-media/core@0.5.1
  - @agent-media/providers@0.5.2

## 0.3.2

### Patch Changes

- Updated dependencies [cac474a]
  - @agent-media/providers@0.5.1

## 0.3.1

### Patch Changes

- Updated dependencies [6097a41]
  - @agent-media/core@0.5.0
  - @agent-media/providers@0.5.0

## 0.3.0

### Minor Changes

- 5304b44: Add --name parameter for custom output filenames

  - New `--name` option on all file-generating commands to specify custom output filename
  - Without `--name`: output filename now derives from input filename (e.g., `photo_resized_<uuid>.png`)
  - With `--name`: uses exact name provided, auto-corrects extension if wrong
  - UUIDs in filenames are now without dashes for cleaner names

### Patch Changes

- Updated dependencies [5304b44]
  - @agent-media/core@0.4.0
  - @agent-media/providers@0.4.0

## 0.2.1

### Patch Changes

- Updated dependencies [d0377dd]
  - @agent-media/providers@0.3.0

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
  - @agent-media/providers@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies
  - @agent-media/core@0.2.0
  - @agent-media/providers@0.1.1
