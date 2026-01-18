# agent-media

Media processing CLI for AI agents.

- **Image**: generate, edit, remove-background, resize, convert, extend
- **Video**: extract audio
- **Audio**: transcribe (with speaker identification)

## Quick Start

Requires an API key from one of these providers:

- [fal.ai](https://fal.ai/dashboard/keys) → `FAL_API_KEY`
- [Replicate](https://replicate.com/account/api-tokens) → `REPLICATE_API_TOKEN`
- [Runpod](https://www.runpod.io/console/user/settings) → `RUNPOD_API_KEY`

```bash
# Generate an image
npx agent-media@latest image generate --prompt "a robot painting a sunset"

# Edit the generated image
npx agent-media@latest image edit --in .agent-media/generated_*.png --prompt "add a cat watching"

# Remove background
npx agent-media@latest image remove-background --in .agent-media/edited_*.png

# Convert to webp
npx agent-media@latest image convert --in .agent-media/nobg_*.png --format webp
```

**Video to transcript** (no API key needed for extract)

```bash
# Extract audio from video (local, no API key)
npx agent-media@latest audio extract --in video.mp4

# Transcribe with speaker identification
npx agent-media@latest audio transcribe --in .agent-media/extracted_*.mp3 --diarize
```

**Local processing** (no API key needed)

```bash
npx agent-media@latest image resize --in photo.jpg --width 800
npx agent-media@latest image convert --in photo.png --format webp
npx agent-media@latest image extend --in photo.jpg --padding 50 --color "#FFFFFF"
```

## Installation

```bash
# Use directly with npx (no install)
npx agent-media@latest --help

# Or install globally
npm install -g agent-media
```

### From Source

```bash
git clone https://github.com/TimPietrusky/agent-media
cd agent-media
pnpm install && pnpm build && pnpm link --global
```

## Requirements

- Node.js >= 18.0.0
- API key for AI features (generate, edit, remove-background, transcribe)

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

### resize

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

### convert

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

### remove-background

```bash
agent-media image remove-background --in portrait.jpg
agent-media image remove-background --in https://example.com/photo.jpg
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate) |

### generate

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

### extend

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

### edit

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

### audio extract

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

### audio transcribe

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

| Provider | resize | convert | extend | generate | edit | remove-background | transcribe |
|----------|--------|---------|--------|----------|------|-------------------|------------|
| **local** | ✓ | ✓ | ✓ | - | - | - | - |
| **fal** | - | - | - | `fal-ai/flux-2` | `fal-ai/flux-2/edit` | `fal-ai/birefnet/v2` | `fal-ai/wizper` |
| **replicate** | - | - | - | `black-forest-labs/flux-2-dev` | `black-forest-labs/flux-kontext-dev` | `men1scus/birefnet` | WhisperX |
| **runpod** | - | - | - | `alibaba/wan-2.6` | `google/nano-banana-pro-edit` | - | - |

Use `--model <name>` to override the default model for any command.

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
