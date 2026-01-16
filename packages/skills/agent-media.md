# Skill: Agent Media

## Description

Agent Media is an agent-first media toolkit that provides CLI-accessible commands for image, video, and audio processing. All commands produce deterministic, machine-readable JSON output.

## Available Commands

### Image Commands
- `agent-media image resize` - Resize an image
- `agent-media image convert` - Convert image format
- `agent-media image remove-background` - Remove image background
- `agent-media image generate` - Generate image from text

## Output Format

All commands return JSON to stdout:

```json
{
  "ok": true,
  "media_type": "image",
  "action": "resize",
  "provider": "local",
  "output_path": ".agent-media/output_123.webp",
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

- **local** - Default provider using Sharp (resize, convert)
- **fal** - fal.ai provider (generate, remove-background)
- **replicate** - Replicate API (generate, remove-background)
- **runpod** - Runpod API (generate only)

## Provider Selection

1. Explicit: `--provider <name>`
2. Auto-detect from environment variables
3. Fallback to local provider

## Environment Variables

- `AGENT_MEDIA_DIR` - Custom output directory
- `FAL_API_KEY` - Enable fal provider
- `REPLICATE_API_TOKEN` - Enable replicate provider
- `RUNPOD_API_KEY` - Enable runpod provider
