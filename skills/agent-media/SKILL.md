---
name: agent-media
description: Agent-first media toolkit for image, video, and audio processing. Use when you need to resize, convert, generate, edit, upscale images, remove backgrounds, extend or crop canvases, extract audio, transcribe speech, or generate videos. All commands return deterministic JSON output.
compatibility: Requires Node.js 18+. Run via npx agent-media@latest or npm install -g agent-media.
---

# Agent Media

Agent Media is an agent-first media toolkit that provides CLI-accessible commands for image, video, and audio processing. All commands produce deterministic, machine-readable JSON output.

## Available Commands

### Image Commands
- `npx agent-media@latest image resize` - Resize an image
- `npx agent-media@latest image convert` - Convert image format
- `npx agent-media@latest image generate` - Generate image from text
- `npx agent-media@latest image edit` - Edit one or more images with text prompt
- `npx agent-media@latest image remove-background` - Remove image background
- `npx agent-media@latest image upscale` - Upscale image with AI super-resolution
- `npx agent-media@latest image extend` - Extend image canvas with padding
- `npx agent-media@latest image crop` - Crop image to dimensions around focal point

### Audio Commands
- `npx agent-media@latest audio extract` - Extract audio from video
- `npx agent-media@latest audio transcribe` - Transcribe audio to text

### Video Commands
- `npx agent-media@latest video generate` - Generate video from text or image

## Output Format

All commands return JSON to stdout:

```json
{
  "ok": true,
  "media_type": "image",
  "action": "resize",
  "provider": "local",
  "output_path": "output_123.webp",
  "mime": "image/webp",
  "bytes": 12345
}
```

On error:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "input file not found"
  }
}
```

## Providers

- **local** - Default provider using Sharp (resize, convert, extend, crop) and Transformers.js (remove-background, upscale, transcribe)
- **fal** - fal.ai provider (generate, edit, remove-background, upscale, transcribe, video)
- **replicate** - Replicate API (generate, edit, remove-background, upscale, transcribe, video)
- **runpod** - Runpod API (generate, edit, video)
- **ai-gateway** - Vercel AI Gateway (generate, edit)
- **atlas** - Atlas Cloud (upscale; explicit opt-in)

## Provider Selection

1. Explicit: `--provider <name>`
2. Auto-detect from environment variables
3. Fallback to local provider

Atlas is never auto-selected from its API key. Use `--provider atlas` so local
processing remains the default.

## Environment Variables

- `AGENT_MEDIA_DIR` - Custom output directory
- `FAL_API_KEY` - Enable fal provider
- `REPLICATE_API_TOKEN` - Enable replicate provider
- `RUNPOD_API_KEY` - Enable runpod provider
- `AI_GATEWAY_API_KEY` - Enable ai-gateway provider
- `ATLASCLOUD_API_KEY` - Enable the explicit Atlas provider
