# @agent-media/audio

## 0.4.6

### Patch Changes

- Updated dependencies [df1311e]
  - @agent-media/core@0.8.0
  - @agent-media/providers@0.8.0

## 0.4.5

### Patch Changes

- Updated dependencies [02643b6]
  - @agent-media/core@0.7.0
  - @agent-media/providers@0.7.0

## 0.4.4

### Patch Changes

- Updated dependencies [8be70eb]
  - @agent-media/core@0.6.0
  - @agent-media/providers@0.6.0

## 0.4.3

### Patch Changes

- b0f02ba: Update repository URLs to agntswrm organization
- Updated dependencies [b0f02ba]
  - @agent-media/core@0.5.1
  - @agent-media/providers@0.5.2

## 0.4.2

### Patch Changes

- Updated dependencies [cac474a]
  - @agent-media/providers@0.5.1

## 0.4.1

### Patch Changes

- Updated dependencies [6097a41]
  - @agent-media/core@0.5.0
  - @agent-media/providers@0.5.0

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
  - @agent-media/providers@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [d0377dd]
  - @agent-media/providers@0.3.0

## 0.3.0

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

## 0.2.1

### Patch Changes

- ac65ff4: Test OIDC publishing via GitHub Actions

## 0.2.0

### Minor Changes

- Add audio package with extract and transcribe actions

  - New `@agent-media/audio` package with `ffmpeg-static` for local audio extraction
  - `audio extract`: Extract audio track from video files (MP3, WAV output)
  - `audio transcribe`: Moved from video package, transcribes audio to text with timestamps
  - New CLI commands: `agent-media audio extract` and `agent-media audio transcribe`
  - Updated providers to return `media_type: "audio"` for transcription results

### Patch Changes

- Updated dependencies
  - @agent-media/core@0.2.0
  - @agent-media/providers@0.1.1
