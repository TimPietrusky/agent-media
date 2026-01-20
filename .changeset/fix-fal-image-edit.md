---
"agent-media": minor
"@agent-media/core": minor
"@agent-media/image": minor
"@agent-media/providers": minor
---

Add seed parameter for reproducible image generation and refactor providers to use AI SDK consistently:

**New feature:**
- Add `--seed` option to `image generate` command for reproducible image generation

**Refactoring:**
- fal provider: Use AI SDK for all image operations (generate, edit, remove-background) and transcription
- replicate provider: Use AI SDK for all image operations (generate, edit, remove-background); replicate SDK for transcription (AI SDK doesn't support replicate transcription)
- video-gen: Use fal client SDK and replicate SDK for video generation (AI SDK doesn't support video)
