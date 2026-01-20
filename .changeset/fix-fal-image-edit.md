---
"@agent-media/providers": patch
---

Refactor providers to use AI SDK consistently instead of raw fetch calls:
- fal provider: Use AI SDK for all image operations (generate, edit, remove-background) and transcription
- replicate provider: Use AI SDK for all image operations (generate, edit, remove-background); replicate SDK for transcription (AI SDK doesn't support replicate transcription)
- video-gen: Use fal client SDK and replicate SDK for video generation (AI SDK doesn't support video)
