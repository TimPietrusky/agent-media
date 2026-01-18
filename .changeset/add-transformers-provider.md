---
"agent-media": minor
"@agent-media/providers": minor
---

Add transformers.js provider for local ML inference without API keys

- `remove-background` using Xenova/modnet model
- `transcribe` using Moonshine model (5x faster than Whisper)
- Models downloaded on first use and cached locally
- Updated sharp to ^0.34.1 to match transformers.js requirements
