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

## Requirements

- Node.js >= 18.0.0
- pnpm (for development from source)

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
agent-media image extend --in <path> --padding <px> --color <hex>  # Extend canvas
agent-media image edit --in <path> --prompt <text>  # Edit with prompt
```

### Audio Commands

```bash
agent-media audio extract --in <video>              # Extract audio from video
agent-media audio transcribe --in <audio>           # Transcribe audio to text
```

---

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
| `--model <name>` | Model override (e.g., `fal-ai/flux-2`, `black-forest-labs/flux-2-dev`) |

### Extend

Extend image canvas by adding padding on all sides with a solid background color.

```bash
agent-media image extend --in photo.jpg --padding 50 --color "#E4ECF8"
agent-media image extend --in photo.png --padding 100 --color "#FFFFFF" --dpi 300
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--padding <px>` | Padding size in pixels to add on all sides (required) |
| `--color <hex>` | Background color for extended area (required). Also flattens transparency. |
| `--dpi <n>` | DPI/density for output image (default: 300) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (local) |

### Edit

Edit an image using a text prompt (image-to-image).

```bash
agent-media image edit --in photo.jpg --prompt "make the sky more vibrant"
agent-media image edit --in portrait.jpg --prompt "add sunglasses"
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--prompt <text>` | Text description of the desired edit (required) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate, runpod) |
| `--model <name>` | Model override (e.g., `fal-ai/flux-2/edit`) |

### Audio Extract

Extract audio track from a video file. Uses local ffmpeg, no API key needed.

```bash
agent-media audio extract --in video.mp4
agent-media audio extract --in video.mp4 --format wav
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input video file path or URL (required) |
| `--format <f>` | Output format: mp3, wav (default: mp3) |
| `--out <dir>` | Output directory |

### Audio Transcribe

Transcribe audio to text with timestamps. Supports speaker identification.

```bash
agent-media audio transcribe --in audio.mp3
agent-media audio transcribe --in audio.mp3 --diarize --speakers 2
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input audio file path or URL (required) |
| `--diarize` | Enable speaker identification |
| `--language <code>` | Language code (auto-detected if not provided) |
| `--speakers <n>` | Number of speakers hint |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate) |
| `--model <name>` | Model override |

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

### Default Models

| Provider | generate | edit | remove-background | transcribe |
|----------|----------|------|-------------------|------------|
| **fal** | `fal-ai/flux-2` | `fal-ai/flux-2/edit` | `fal-ai/birefnet/v2` | `fal-ai/wizper` |
| **replicate** | `black-forest-labs/flux-2-dev` | `black-forest-labs/flux-kontext-dev` | `men1scus/birefnet` | WhisperX |
| **runpod** | `alibaba/wan-2.6` | `google/nano-banana-pro-edit` | - | - |
| **local** | - | - | - | - |

Use `--model <name>` to override the default model for any command.

### Local (default)

Uses Sharp for image processing. No API key required.

**Supports:** resize, convert, extend

```bash
agent-media image resize --in photo.jpg --width 800  # Uses local automatically
```

### Fal

Uses fal.ai for AI-powered image and audio operations.

**Supports:** generate, edit, remove-background, transcribe

```bash
export FAL_API_KEY=your-key
agent-media image generate --prompt "a red robot"
agent-media image edit --in photo.jpg --prompt "add a hat"
agent-media image remove-background --in photo.jpg
agent-media audio transcribe --in audio.mp3
```

[Get your FAL API key](https://fal.ai/dashboard/keys)

### Replicate

Uses Replicate for AI-powered image and audio operations.

**Supports:** generate, edit, remove-background, transcribe

```bash
export REPLICATE_API_TOKEN=your-token
agent-media image generate --prompt "a red robot" --provider replicate
agent-media image edit --in photo.jpg --prompt "add a hat" --provider replicate
```

[Get your Replicate API token](https://replicate.com/account/api-tokens)

### Runpod

Uses Runpod for AI-powered image generation and editing.

**Supports:** generate, edit

```bash
export RUNPOD_API_KEY=your-key
agent-media image generate --prompt "a red robot" --provider runpod
agent-media image edit --in photo.jpg --prompt "add sunglasses" --provider runpod
```

[Get your Runpod API key](https://www.runpod.io/console/user/settings)

### Provider Selection

1. **Explicit flag** (highest priority): `--provider fal`
2. **Environment auto-detect**: Set `FAL_API_KEY` to auto-select fal
3. **Fallback to local**: For resize/convert when no provider specified
4. **First supporting provider**: For generate/remove-background

## Environment Variables

| Variable | Description | Get Key |
|----------|-------------|---------|
| `FAL_API_KEY` | fal.ai API key | [fal.ai](https://fal.ai/dashboard/keys) |
| `REPLICATE_API_TOKEN` | Replicate API token | [replicate.com](https://replicate.com/account/api-tokens) |
| `RUNPOD_API_KEY` | Runpod API key | [runpod.io](https://www.runpod.io/console/user/settings) |
| `HUGGINGFACE_ACCESS_TOKEN` | For transcription with speaker ID (replicate only) | [huggingface.co](https://huggingface.co/settings/tokens) |
| `AGENT_MEDIA_DIR` | Output directory (default: `.agent-media/`) | - |

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

Use `agent-media` for image and audio operations. Run `agent-media --help` for commands.

- `agent-media image resize --in <path> --width <px>` - Resize image
- `agent-media image convert --in <path> --format <f>` - Convert format
- `agent-media image generate --prompt <text>` - Generate image
- `agent-media image edit --in <path> --prompt <text>` - Edit image
- `agent-media image remove-background --in <path>` - Remove background
- `agent-media audio extract --in <video>` - Extract audio from video
- `agent-media audio transcribe --in <audio>` - Transcribe audio

All commands output JSON with `ok: true/false` and exit 0/1.
```

## Roadmap

- [ ] Local CPU background removal via transformers.js/ONNX (zero API keys)
- [ ] Video processing actions
- [ ] Batch processing support
