# agent-media

Media processing CLI for AI agents. Resize, convert, generate, and remove backgrounds from images.

## Installation

### npm (recommended)

```bash
npm install -g agent-media
```

### From Source

```bash
git clone https://github.com/anthropics/agent-media
cd agent-media
pnpm install
pnpm build
pnpm link --global
```

## Quick Start

```bash
agent-media image resize --in photo.jpg --width 800
agent-media image convert --in photo.png --format webp
agent-media image remove-background --in portrait.jpg
agent-media image generate --prompt "a red robot"
```

## Commands

### Image Commands

```bash
agent-media image resize --in <path> [options]      # Resize image
agent-media image convert --in <path> --format <f>  # Convert format
agent-media image remove-background --in <path>     # Remove background
agent-media image generate --prompt <text>          # Generate from prompt
```

### Resize

```bash
agent-media image resize --in photo.jpg --width 800
agent-media image resize --in photo.jpg --height 600
agent-media image resize --in photo.jpg --width 800 --height 600
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--width <px>` | Target width in pixels |
| `--height <px>` | Target height in pixels |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (local) |

### Convert

```bash
agent-media image convert --in photo.png --format webp
agent-media image convert --in photo.jpg --format png
agent-media image convert --in photo.png --format jpg --quality 90
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--format <f>` | Output format: png, jpg, webp (required) |
| `--quality <n>` | Quality 1-100 for lossy formats (default: 80) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (local) |

### Remove Background

```bash
agent-media image remove-background --in portrait.jpg
agent-media image remove-background --in https://example.com/photo.jpg
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate) |

### Generate

```bash
agent-media image generate --prompt "a cat wearing a hat"
agent-media image generate --prompt "sunset over mountains" --width 1024 --height 768
```

| Option | Description |
|--------|-------------|
| `--prompt <text>` | Text description (required) |
| `--width <px>` | Width (default: 1024) |
| `--height <px>` | Height (default: 1024) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate, runpod) |

## Output Format

All commands return JSON to stdout:

```json
{
  "ok": true,
  "media_type": "image",
  "action": "resize",
  "provider": "local",
  "output_path": ".agent-media/resized_123_abc.png",
  "mime": "image/png",
  "bytes": 45678
}
```

On error:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "At least one of width or height must be specified"
  }
}
```

Exit code is `0` on success, `1` on error.

## Providers

### Local (default)

Uses Sharp for image processing. No API key required.

**Supports:** resize, convert

```bash
agent-media image resize --in photo.jpg --width 800  # Uses local automatically
```

### Fal

Uses fal.ai for AI-powered image operations.

**Supports:** generate, remove-background

```bash
export FAL_API_KEY=your-key
agent-media image generate --prompt "a red robot"
agent-media image remove-background --in photo.jpg
```

### Replicate

Uses Replicate for AI-powered image operations.

**Supports:** generate, remove-background

```bash
export REPLICATE_API_TOKEN=your-token
agent-media image generate --prompt "a red robot" --provider replicate
```

### Runpod

Uses Runpod for AI-powered image generation.

**Supports:** generate

```bash
export RUNPOD_API_KEY=your-key
agent-media image generate --prompt "a red robot" --provider runpod
```

### Provider Selection

1. **Explicit flag** (highest priority): `--provider fal`
2. **Environment auto-detect**: Set `FAL_API_KEY` to auto-select fal
3. **Fallback to local**: For resize/convert when no provider specified
4. **First supporting provider**: For generate/remove-background

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FAL_API_KEY` | fal.ai API key |
| `REPLICATE_API_TOKEN` | Replicate API key |
| `RUNPOD_API_KEY` | Runpod API key |
| `AGENT_MEDIA_DIR` | Output directory (default: `.agent-media/`) |

## Usage with AI Agents

### Just ask the agent

```
Use agent-media to resize this image to 800px wide.
Run agent-media --help to see available commands.
```

### AGENTS.md / CLAUDE.md

Add to your project instructions:

```markdown
## Media Processing

Use `agent-media` for image operations. Run `agent-media --help` for commands.

- `agent-media image resize --in <path> --width <px>` - Resize image
- `agent-media image convert --in <path> --format <f>` - Convert format
- `agent-media image generate --prompt <text>` - Generate image
- `agent-media image remove-background --in <path>` - Remove background

All commands output JSON with `ok: true/false` and exit 0/1.
```

