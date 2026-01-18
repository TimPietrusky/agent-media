# Skill: Audio Transcribe

## Description

Transcribes audio files to text with timestamps. Supports automatic language detection, speaker identification (diarization), and outputs structured JSON with segment-level timing.

## Command

```bash
agent-media audio transcribe --in <path> [options]
```

## Inputs

| Option | Required | Description |
|--------|----------|-------------|
| `--in` | Yes | Input audio file path or URL (supports mp3, wav, m4a, ogg) |
| `--diarize` | No | Enable speaker identification |
| `--language` | No | Language code (auto-detected if not provided) |
| `--speakers` | No | Number of speakers hint for diarization |
| `--out` | No | Output directory (default: `.agent-media/`) |
| `--provider` | No | Provider to use (fal, replicate) |

## Output

Returns a JSON object with transcription data:

```json
{
  "ok": true,
  "media_type": "audio",
  "action": "transcribe",
  "provider": "fal",
  "output_path": ".agent-media/transcription_123_abc.json",
  "transcription": {
    "text": "Full transcription text...",
    "language": "en",
    "segments": [
      { "start": 0.0, "end": 2.5, "text": "Hello.", "speaker": "SPEAKER_0" },
      { "start": 2.5, "end": 5.0, "text": "Hi there.", "speaker": "SPEAKER_1" }
    ]
  }
}
```

## Examples

Basic transcription (auto-detect language):
```bash
agent-media audio transcribe --in interview.mp3
```

Transcription with speaker identification:
```bash
agent-media audio transcribe --in meeting.wav --diarize
```

Transcription with specific language and speaker count:
```bash
agent-media audio transcribe --in podcast.mp3 --diarize --language en --speakers 3
```

Transcribe with custom output:
```bash
agent-media audio transcribe --in audio.mp3 --out ./transcripts
```

Use specific provider:
```bash
agent-media audio transcribe --in audio.wav --provider replicate
```

## Extracting Audio from Video

To transcribe a video file, first extract the audio:

```bash
# Step 1: Extract audio from video
agent-media audio extract --in video.mp4 --format mp3

# Step 2: Transcribe the extracted audio
agent-media audio transcribe --in .agent-media/extracted_xxx.mp3
```

## Providers

### transformers.js

Runs locally on CPU, no API key required.

- Uses Moonshine model (5x faster than Whisper)
- Models downloaded on first use (~100MB)
- Does NOT support diarization — use fal or replicate for speaker identification
- You may see a `mutex lock failed` error — ignore it, the output is correct if `"ok": true`

```bash
agent-media audio transcribe --in audio.mp3 --provider transformers
```

### fal

- Requires `FAL_API_KEY`
- Uses `wizper` model for fast transcription (2x faster) when diarization is disabled
- Uses `whisper` model when diarization is enabled (native support)
- Auto-selects optimal model based on options

### replicate

- Requires `REPLICATE_API_TOKEN`
- Uses `whisperx` model with 70x realtime speed
- Diarization requires `HUGGINGFACE_ACCESS_TOKEN` environment variable (for pyannote model access)
- Provides word-level timestamps with alignment

## Environment Variables

| Variable | Provider | Required For |
|----------|----------|--------------|
| `FAL_API_KEY` | fal | All transcription |
| `REPLICATE_API_TOKEN` | replicate | All transcription |
| `HUGGINGFACE_ACCESS_TOKEN` | replicate | Diarization only |
