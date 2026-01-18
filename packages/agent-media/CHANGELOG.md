# agent-media

## 0.4.0

### Minor Changes

- d0377dd: Add transformers.js provider for local ML inference without API keys

  - `remove-background` using Xenova/modnet model
  - `transcribe` using Moonshine model (5x faster than Whisper)
  - Models downloaded on first use and cached locally
  - Updated sharp to ^0.34.1 to match transformers.js requirements

### Patch Changes

- Updated dependencies [d0377dd]
  - @agent-media/providers@0.3.0
  - @agent-media/audio@0.3.1
  - @agent-media/image@0.2.1

## 0.3.5

### Patch Changes

- ebe7581: Restructure README: group by image/audio, mark each command as _local_ or _API key required_

## 0.3.4

### Patch Changes

- cb263ce: Add bunx examples to README (bunx first, then npx) and ensure all npx/bunx commands use @latest

## 0.3.3

### Patch Changes

- 88183a9: Rename packages/cli to packages/agent-media for consistency with package name

## 0.3.2

### Patch Changes

- 834c9af: Sync CLI README with root README for correct npm display

## 0.3.1

### Patch Changes

- fb32740: Clean up README: lowercase command headlines, remove duplicate provider sections

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
  - @agent-media/image@0.2.0
  - @agent-media/audio@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [ac65ff4]
  - @agent-media/audio@0.2.1

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
  - @agent-media/audio@0.2.0
  - @agent-media/core@0.2.0
  - @agent-media/providers@0.1.1
  - @agent-media/image@0.1.1
