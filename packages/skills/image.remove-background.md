# Skill: Image Remove Background

## Description

Removes the background from an image, leaving only the foreground subject with transparency.

## Command

```bash
agent-media image remove-background --in <path> [options]
```

## Inputs

| Option | Required | Description |
|--------|----------|-------------|
| `--in` | Yes | Input file path or URL |
| `--out` | No | Output directory (default: `.agent-media/`) |
| `--provider` | No | Provider to use (default: auto-detect) |

## Output

Returns a JSON object with the processed image path:

```json
{
  "ok": true,
  "media_type": "image",
  "action": "remove-background",
  "provider": "fal",
  "output_path": ".agent-media/nobg_123_abc.png",
  "mime": "image/png",
  "bytes": 34567
}
```

## Examples

Remove background from local file:
```bash
agent-media image remove-background --in portrait.jpg
```

Remove background using specific provider:
```bash
agent-media image remove-background --in portrait.jpg --provider replicate
```

## Providers

### transformers.js

Runs locally on CPU, no API key required.

- Uses `Xenova/modnet` model
- Models downloaded on first use (~25MB)
- You may see a `mutex lock failed` error — ignore it, the output is correct if `"ok": true`

```bash
agent-media image remove-background --in portrait.jpg --provider transformers
```

### fal

- Requires `FAL_API_KEY`
- Uses `birefnet/v2` model

### replicate

- Requires `REPLICATE_API_TOKEN`
- Uses `birefnet` model
