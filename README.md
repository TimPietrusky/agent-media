# agent-media

Media processing CLI for AI agents.

- **Image**: generate, edit, remove-background, resize, convert, extend
- **Video**: extract audio
- **Audio**: transcribe (with speaker identification)

## Quick Start

### Local processing (no API key needed)

Uses [Sharp](https://sharp.pixelplumbing.com/) for image operations and [transformers.js](https://huggingface.co/docs/transformers.js) for local AI (background removal, transcription).

```bash
bunx agent-media@latest image resize --in sunset-mountains.jpg --width 800
bunx agent-media@latest image convert --in sunset-mountains.png --format webp
bunx agent-media@latest image extend --in sunset-mountains.jpg --padding 50 --color "#FFFFFF"
bunx agent-media@latest image remove-background --in portrait-headshot.png --provider transformers
bunx agent-media@latest audio extract --in video.mp4
bunx agent-media@latest audio transcribe --in audio.mp3 --provider transformers
```

> **Note**: You may see a `mutex lock failed` error with `--provider transformers` — ignore it, the output is correct if JSON shows `"ok": true`.

### AI-powered features

Requires an API key from one of these providers:

- [fal.ai](https://fal.ai/dashboard/keys) → `FAL_API_KEY`
- [Replicate](https://replicate.com/account/api-tokens) → `REPLICATE_API_TOKEN`
- [Runpod](https://www.runpod.io/console/user/settings) → `RUNPOD_API_KEY`

### bunx

```bash
# Generate an image
bunx agent-media@latest image generate --prompt "a robot painting a sunset"

# Edit the generated image
bunx agent-media@latest image edit --in .agent-media/generated_*.png --prompt "add a cat watching"

# Remove background
bunx agent-media@latest image remove-background --in .agent-media/edited_*.png

# Transcribe with speaker identification
bunx agent-media@latest audio transcribe --in audio.mp3 --diarize
```

### npx

```bash
# Generate an image
npx agent-media@latest image generate --prompt "a robot painting a sunset"

# Edit the generated image
npx agent-media@latest image edit --in .agent-media/generated_*.png --prompt "add a cat watching"

# Remove background
npx agent-media@latest image remove-background --in .agent-media/edited_*.png

# Transcribe with speaker identification
npx agent-media@latest audio transcribe --in audio.mp3 --diarize
```

## Installation

```bash
# Use directly with bunx (no install)
bunx agent-media@latest --help

# Or with npx
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

---

## image

```bash
# Resize image
agent-media@latest image resize --in <path> [options]

# Convert format
agent-media@latest image convert --in <path> --format <f>

# Extend canvas with padding
agent-media@latest image extend --in <path> --padding <px> --color <hex>

# Generate image from text
agent-media@latest image generate --prompt <text>

# Edit image with text prompt
agent-media@latest image edit --in <path> --prompt <text>

# Remove background
agent-media@latest image remove-background --in <path>
```

### resize

*local*

```bash
agent-media@latest image resize --in sunset-mountains.jpg --width 800
agent-media@latest image resize --in sunset-mountains.jpg --height 600
agent-media@latest image resize --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/sunset-mountains.jpg --width 800
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--width <px>` | Target width in pixels |
| `--height <px>` | Target height in pixels |
| `--out <dir>` | Output directory |

### convert

*local*

```bash
agent-media@latest image convert --in sunset-mountains.png --format webp
agent-media@latest image convert --in sunset-mountains.jpg --format png
agent-media@latest image convert --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/sunset-mountains.png --format jpg --quality 90
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--format <f>` | Output format: png, jpg, webp (required) |
| `--quality <n>` | Quality 1-100 for lossy formats (default: 80) |
| `--out <dir>` | Output directory |

### extend

*local*

Extend image canvas by adding padding on all sides with a solid background color.

```bash
agent-media@latest image extend --in sunset-mountains.jpg --padding 50 --color "#E4ECF8"
agent-media@latest image extend --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/sunset-mountains.png --padding 100 --color "#FFFFFF"
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--padding <px>` | Padding size in pixels to add on all sides (required) |
| `--color <hex>` | Background color for extended area (required). Also flattens transparency. |
| `--dpi <n>` | DPI/density for output image (default: 300) |
| `--out <dir>` | Output directory |

### generate

*API key required*

```bash
agent-media@latest image generate --prompt "a cat wearing a hat"
agent-media@latest image generate --prompt "sunset over mountains" --width 1024 --height 768
```

| Option | Description |
|--------|-------------|
| `--prompt <text>` | Text description (required) |
| `--width <px>` | Width (default: 1024) |
| `--height <px>` | Height (default: 1024) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate, runpod) |
| `--model <name>` | Model override (e.g., `fal-ai/flux-2`, `black-forest-labs/flux-2-dev`) |

### edit

*API key required*

Edit an image using a text prompt (image-to-image).

```bash
agent-media@latest image edit --in sunset-mountains.jpg --prompt "make the sky more vibrant"
agent-media@latest image edit --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/portrait-headshot.png --prompt "add sunglasses"
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--prompt <text>` | Text description of the desired edit (required) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate, runpod) |
| `--model <name>` | Model override (e.g., `fal-ai/flux-2/edit`) |

### remove-background

*API key required*

```bash
agent-media@latest image remove-background --in portrait-headshot.png
agent-media@latest image remove-background --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/portrait-headshot.png
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate) |

---

## audio

```bash
# Extract audio from video
agent-media@latest audio extract --in <video>

# Transcribe audio to text
agent-media@latest audio transcribe --in <audio>
```

### extract

*local*

Extract audio track from a video file.

```bash
agent-media@latest audio extract --in video.mp4
agent-media@latest audio extract --in video.mp4 --format wav
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input video file path or URL (required) |
| `--format <f>` | Output format: mp3, wav (default: mp3) |
| `--out <dir>` | Output directory |

### transcribe

*API key required*

Transcribe audio to text with timestamps. Supports speaker identification.

```bash
agent-media@latest audio transcribe --in audio.mp3
agent-media@latest audio transcribe --in audio.mp3 --diarize --speakers 2
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

---

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
| **transformers** | - | - | - | - | - | `Xenova/modnet` | `moonshine-base` |
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

## Roadmap

- [x] Local CPU background removal via transformers.js/ONNX (zero API keys)
- [x] Local CPU transcription via transformers.js/ONNX (zero API keys)
- [ ] Video processing actions
- [ ] Batch processing support
