---
"agent-media": minor
"@agent-media/core": minor
"@agent-media/providers": minor
"@agent-media/video": minor
---

Add video generation command supporting text-to-video and image-to-video

- New `video generate` CLI command with options for duration, resolution, fps, and audio
- Support for fal.ai (LTX-2) and Replicate (lightricks/ltx-video) providers
- Image-to-video: animate a static image with a text prompt
- Optional audio generation with `--audio` flag
