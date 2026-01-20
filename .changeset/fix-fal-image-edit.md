---
"@agent-media/providers": patch
---

Refactor providers to use SDKs instead of raw fetch calls:
- fal provider: Use AI SDK with providerOptions for image editing, fal client SDK for transcription and background removal
- replicate provider: Use AI SDK with providerOptions for image editing, replicate SDK for transcription
- video-gen: Use fal client SDK and replicate SDK instead of raw fetch
