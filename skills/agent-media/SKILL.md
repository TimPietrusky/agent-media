---
name: agent-media
description: Agent-first media toolkit for image, video, and audio processing. Use when you need to resize, convert, generate, edit, upscale images, remove backgrounds, extend or crop canvases, extract audio, transcribe speech, or generate videos. All commands return deterministic JSON output.
---

# Agent Media

Agent Media is an agent-first media toolkit that provides CLI-accessible commands for image, video, and audio processing. All commands produce deterministic, machine-readable JSON output.

## Available Commands

### Image Commands
- `agent-media image resize` - Resize an image
- `agent-media image convert` - Convert image format
- `agent-media image generate` - Generate image from text
- `agent-media image edit` - Edit image with text prompt
- `agent-media image remove-background` - Remove image background
- `agent-media image upscale` - Upscale image with AI super-resolution
- `agent-media image extend` - Extend image canvas with padding
- `agent-media image crop` - Crop image to dimensions around focal point

### Audio Commands
- `agent-media audio extract` - Extract audio from video
- `agent-media audio transcribe` - Transcribe audio to text

### Video Commands
- `agent-media video generate` - Generate video from text or image

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

## Provider Selection

1. Explicit: `--provider <name>`
2. Auto-detect from environment variables
3. Fallback to local provider

## Environment Variables

- `AGENT_MEDIA_DIR` - Custom output directory
- `FAL_API_KEY` - Enable fal provider
- `REPLICATE_API_TOKEN` - Enable replicate provider
- `RUNPOD_API_KEY` - Enable runpod provider
- `AI_GATEWAY_API_KEY` - Enable ai-gateway provider
