---
"@agent-media/providers": minor
"agent-media": patch
---

feat: add transcription support to RunPod provider

- Upgrade @runpod/ai-sdk-provider to v1.2.0
- Add transcribe action using pruna/whisper-v3-large model
- Note: RunPod does not support diarization (speaker identification)
