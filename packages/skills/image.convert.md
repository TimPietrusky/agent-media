# Skill: Image Convert

## Description

Converts an image to a different format (PNG, JPG, or WebP).

## Command

```bash
agent-media image convert --in <path> --format <format> [options]
```

## Inputs

| Option | Required | Description |
|--------|----------|-------------|
| `--in` | Yes | Input file path or URL |
| `--format` | Yes | Output format: `png`, `jpg`, `webp` |
| `--quality` | No | Quality for lossy formats (1-100, default: 80) |
| `--out` | No | Output directory (default: `.agent-media/`) |
| `--provider` | No | Provider to use (default: auto-detect) |

## Output

Returns a JSON object with the converted image path:

```json
{
  "ok": true,
  "media_type": "image",
  "action": "convert",
  "provider": "local",
  "output_path": ".agent-media/converted_123_abc.webp",
  "mime": "image/webp",
  "bytes": 23456
}
```

## Examples

Convert PNG to WebP:
```bash
agent-media image convert --in photo.png --format webp
```

Convert to high-quality JPEG:
```bash
agent-media image convert --in photo.png --format jpg --quality 95
```

Convert with custom output directory:
```bash
agent-media image convert --in image.png --format webp --out ./converted
```

## Providers

- **local** (default) - Uses sharp library
