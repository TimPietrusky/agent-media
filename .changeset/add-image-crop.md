---
"agent-media": minor
"@agent-media/core": minor
"@agent-media/providers": minor
"@agent-media/image": minor
---

Add image crop action with configurable focal point

- New `crop` action for images using Sharp's `extract()` method
- Supports `--width` and `--height` for crop dimensions
- Supports `--focus-x` and `--focus-y` (0-100%) to control focal point (default: center)
- Crop region automatically clamped to image bounds
- Local-only processing, no API key required
