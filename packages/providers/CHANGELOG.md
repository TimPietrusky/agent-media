# @agent-media/providers

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
