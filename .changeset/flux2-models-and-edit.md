---
"agent-media": minor
"@agent-media/core": minor
"@agent-media/providers": minor
"@agent-media/image": minor
"@agent-media/audio": minor
"@agent-media/cli": minor
---

Update to FLUX.2 models and add edit support to fal/replicate

**Breaking Changes:**
- Default image generation models updated:
  - fal: `fal-ai/flux/schnell` → `fal-ai/flux-2`
  - replicate: `black-forest-labs/flux-schnell` → `black-forest-labs/flux-2-dev`

**New Features:**
- Image editing support added to fal (`fal-ai/flux-2/edit`) and replicate (`black-forest-labs/flux-kontext-dev`)
- `--model` flag added to generate, edit, remove-background, and transcribe commands for model override

**Documentation:**
- Added default models table to README
- Added audio commands documentation
- Added API key acquisition links
- Added roadmap section
