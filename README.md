# agent-media

Media processing CLI for AI agents.

- **Image**: generate, edit, remove-background, resize, convert, extend
- **Video**: generate (text-to-video and image-to-video)
- **Audio**: extract from video, transcribe (with speaker identification)

## Installation

### Global

```bash
npm install -g agent-media@latest
```

### From Source

```bash
git clone https://github.com/agntswrm/agent-media
cd agent-media
pnpm install && pnpm build && pnpm link --global
```

### Via bunx / npx

Run directly without installing:

```bash
bunx agent-media@latest --help
npx agent-media@latest --help
```

### Skills for AI Agents

Install agent-media skills to your coding agent (Claude Code, Cursor, Codex, etc.):

```bash
npx skills add agntswrm/agent-media
```

This adds media processing skills that your AI agent can use automatically. Available skills:
- `agent-media` - Overview of all capabilities
- `image-generate` - Generate images from text
- `image-resize` - Resize images
- `image-convert` - Convert image formats
- `image-remove-background` - Remove backgrounds
- `audio-extract` - Extract audio from video
- `audio-transcribe` - Transcribe audio to text
- `video-generate` - Generate videos from text or images

## Quick Start

```bash
# Generate an image
agent-media image generate --prompt "a robot painting a sunset"

# Edit the generated image
agent-media image edit --in .agent-media/generated_*.png --prompt "add a cat watching"

# Remove background
agent-media image remove-background --in .agent-media/edited_*.png

# Convert to different format
agent-media image convert --in .agent-media/nobg_*.png --format webp

# Generate a video from an image (with audio)
agent-media video generate --in woman-portrait.png --prompt "The woman speaks: 'Hello! Welcome to Agent Media.'" --audio --duration 10

# Extract audio from video
agent-media audio extract --in .agent-media/generated_*.mp4

# Transcribe the audio
agent-media audio transcribe --in .agent-media/*_extracted_*.mp3
```

## Requirements

- Node.js >= 18.0.0
- API key from [fal.ai](https://fal.ai/dashboard/keys), [Replicate](https://replicate.com/account/api-tokens), or [Runpod](https://www.runpod.io/console/user/settings) for AI features

**Local processing** (no API key): resize, convert, extend, audio extract, remove-background, transcribe

**Cloud processing** (API key required): image generate, image edit, video generate

> **Note**: You may see a `mutex lock failed` error when using local remove-background or transcribe — ignore it, the output is correct if JSON shows `"ok": true`.

---

## image

```bash
agent-media image resize --in <path> [options]
agent-media image convert --in <path> --format <f>
agent-media image extend --in <path> --padding <px> --color <hex>
agent-media image generate --prompt <text>
agent-media image edit --in <path> --prompt <text>
agent-media image remove-background --in <path>
```

### resize

*local*

```bash
agent-media image resize --in sunset-mountains.jpg --width 800
agent-media image resize --in sunset-mountains.jpg --height 600
agent-media image resize --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/sunset-mountains.jpg --width 800
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
agent-media image convert --in sunset-mountains.png --format webp
agent-media image convert --in sunset-mountains.jpg --format png
agent-media image convert --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/sunset-mountains.png --format jpg --quality 90
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
agent-media image extend --in sunset-mountains.jpg --padding 50 --color "#E4ECF8"
agent-media image extend --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/sunset-mountains.png --padding 100 --color "#FFFFFF"
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

### edit

*API key required*

Edit an image using a text prompt (image-to-image).

```bash
agent-media image edit --in sunset-mountains.jpg --prompt "make the sky more vibrant"
agent-media image edit --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/man-portrait.png --prompt "add sunglasses"
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
agent-media image remove-background --in man-portrait.png
agent-media image remove-background --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/man-portrait.png
```

| Option | Description |
|--------|-------------|
| `--in <path>` | Input file path or URL (required) |
| `--out <dir>` | Output directory |
| `--provider <name>` | Provider (fal, replicate) |

---

## video

```bash
# Generate video from text
agent-media video generate --prompt <text>

# Generate video from image (animate an image)
agent-media video generate --in <image> --prompt <text>
```

### generate

*API key required*

Generate video from a text prompt. Optionally provide an input image to animate it (image-to-video). The prompt describes what should happen in the video.

```bash
# Text-to-video
agent-media video generate --prompt "a cat walking through a garden"

# Image-to-video (animate an image)
agent-media video generate --in woman-portrait.png --prompt "person smiles and waves hello"

# With audio generation
agent-media video generate --prompt "fireworks in the night sky" --audio --duration 10

# Higher resolution
agent-media video generate --prompt "ocean waves" --resolution 1080p
```

| Option | Description |
|--------|-------------|
| `--prompt <text>` | Text description of the video (required) |
| `--in <path>` | Input image for image-to-video (optional) |
| `--duration <s>` | Duration: 6, 8, 10, 12, 14, 16, 18, 20 (default: 6) |
| `--resolution <r>` | Resolution: 720p, 1080p, 1440p, 2160p (default: 720p) |
| `--fps <n>` | Frame rate: 25, 50 (default: 25) |
| `--audio` | Generate audio track |
| `--out <dir>` | Output directory |
| `--name <filename>` | Output filename (extension auto-added) |
| `--provider <name>` | Provider (fal, replicate) |
| `--model <name>` | Model override |

---

## audio

```bash
# Extract audio from video
agent-media audio extract --in <video>

# Transcribe audio to text
agent-media audio transcribe --in <audio>
```

### extract

*local*

Extract audio track from a video file.

```bash
agent-media audio extract --in woman-greeting.mp4
agent-media audio extract --in woman-greeting.mp4 --format wav
agent-media audio extract --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/woman-greeting.mp4
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
agent-media audio transcribe --in woman-greeting.mp3
agent-media audio transcribe --in woman-greeting.mp3 --diarize --speakers 2
agent-media audio transcribe --in https://ytrzap04kkm0giml.public.blob.vercel-storage.com/woman-greeting.mp3
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

| Provider | resize | convert | extend | image generate | image edit | remove-background | video generate | transcribe |
|----------|--------|---------|--------|----------------|------------|-------------------|----------------|------------|
| **local** | ✓* | ✓* | ✓* | - | - | `Xenova/modnet`** | - | `moonshine-base`** |
| **fal** | - | - | - | `fal-ai/flux-2` | `fal-ai/flux-2/edit` | `fal-ai/birefnet/v2` | `fal-ai/ltx-2` | `fal-ai/wizper` |
| **replicate** | - | - | - | `black-forest-labs/flux-2-dev` | `black-forest-labs/flux-kontext-dev` | `men1scus/birefnet` | `lightricks/ltx-video` | `whisper-diarization` |
| **runpod** | - | - | - | `alibaba/wan-2.6` | `google/nano-banana-pro-edit` | - | - | - |

\* Powered by [Sharp](https://sharp.pixelplumbing.com/) for fast image processing
\** Powered by [Transformers.js](https://huggingface.co/docs/transformers.js) for local ML inference (models downloaded on first use)

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
| `AGENT_MEDIA_DIR` | Output directory (default: `.agent-media/`) | - |

## Roadmap

- [x] Local background removal (zero API keys)
- [x] Local transcription (zero API keys)
- [x] Video generation (text-to-video and image-to-video)
- [ ] Batch processing support
