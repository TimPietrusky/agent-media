# User Story: Agent Media – Agent-First Media Toolkit (TypeScript)

## Goal

Build a **TypeScript-based, agent-first media toolkit** called **`agent-media`**.

The project provides **CLI-accessible media commands** (image, video, audio) that can be used by:
- humans via terminal
- agents via deterministic CLI calls and structured stdout
- agent frameworks via Markdown-based skills

The toolkit must be:
- easy to install
- work out of the box with zero config
- extensible via optional providers
- predictable and consistent for agents

---

## Core Principles

1. **Agent-first design**
   - Every command must be deterministic
   - Output must be machine-readable
   - Errors must be structured

2. **Zero-config default**
   - Local functionality works immediately after install
   - No external binaries required
   - No provider installation required for basic usage

3. **Explicit but helpful “magic”**
   - Providers can be selected explicitly
   - Providers can also be auto-detected via environment variables
   - Auto-detection must never override explicit configuration

4. **One command = one action**
   - No pipelines
   - No chained steps
   - Each command does exactly one thing

---

## Project Name

**agent-media**

---

## Scope (Initial Version)

### Media types
- Image (initial focus)
- Video and audio are placeholders for future extension

### Supported image actions (v1)
- resize
- convert (png, jpg, webp)
- remove-background
- generate (via providers)

---

## Repository Structure

The project must be structured as a **monorepo**.

```txt
agent-media/
├─ packages/
│  ├─ core/
│  │  ├─ types/
│  │  ├─ provider/
│  │  ├─ config/
│  │  └─ result/
│  ├─ image/
│  │  ├─ actions/
│  │  │  ├─ resize.ts
│  │  │  ├─ convert.ts
│  │  │  ├─ remove-background.ts
│  │  │  └─ generate.ts
│  │  └─ index.ts
│  ├─ providers/
│  │  ├─ local/
│  │  ├─ file/
│  │  ├─ replicate/
│  │  └─ runpod/
│  ├─ cli/
│  │  └─ index.ts
│  └─ skills/
│     ├─ image.resize.md
│     ├─ image.convert.md
│     ├─ image.remove-background.md
│     ├─ image.generate.md
│     └─ agent-media.md
├─ .gitignore
├─ README.md
└─ package.json
```

---

## CLI Design

### Command grammar

The CLI must follow this structure:

```bash
agent-media <media-type> <action> [options]
```

Examples:

```bash
agent-media image resize --in input.png --width 1024
agent-media image convert --in input.png --format webp
agent-media image remove-background --in input.png
agent-media image generate --prompt "a red robot"
```

---

## Input / Output Contract

### Inputs
- `--in` accepts:
  - local file path
  - URL
- Generated commands do not require input files

### Outputs
- Default output directory:
  - `./.agent-media/`
- Custom output path:
  - `--out <path>`

### STDOUT (always JSON)

Every command must return a JSON object to stdout:

```json
{
  "ok": true,
  "media_type": "image",
  "action": "resize",
  "provider": "local",
  "output_path": ".agent-media/out/abc123.webp",
  "mime": "image/webp",
  "bytes": 182734
}
```

On error:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "input file not found"
  }
}
```

No logs or human text on stdout.

---

## Providers

### Provider concept

Providers are responsible for executing an action.

There are two types:
1. **Local providers** (bundled, zero-config)
2. **External providers** (optional, API-based)

---

### Default provider (local)

- Uses `sharp` for image manipulation
- Must be bundled
- Must require no external binaries
- Must handle:
  - resize
  - convert

---

### External providers

Supported (initial):
- file
- replicate
- runpod

These providers:
- are optional
- are activated only if:
  - explicitly selected via CLI or config
  - or auto-detected via environment variables

---

## Provider Selection Logic (Important)

Provider resolution must follow this order:

1. **Explicit CLI flag**
   ```bash
   agent-media image generate --provider replicate
   ```

2. **Environment variable auto-detection**
   - If `FILE_API_KEY` is set → use `file`
   - If `REPLICATE_API_TOKEN` is set → use `replicate`
   - If `RUNPOD_API_KEY` is set → use `runpod`

3. **Fallback**
   - Use local provider
   - If local provider cannot perform the action, return a structured error

Auto-detection must never override explicit selection.

---

## Configuration

### Environment variables

Examples:
- `AGENT_MEDIA_DIR`
- `FILE_API_KEY`
- `REPLICATE_API_TOKEN`
- `RUNPOD_API_KEY`

### CLI flags override environment variables.

---

## Skills (Markdown)

### Purpose

Skills are **Markdown files** describing what the agent can do.
They are **not code**.

Agents:
- see file names first
- load full skill only when needed

---

### Skill format (example)

`image.resize.md`

```md
# Skill: Image Resize

## Description
Resizes an image to a target width or height.

## Command
agent-media image resize

## Inputs
- --in: path or URL
- --width (optional)
- --height (optional)

## Output
- Local image file
- JSON metadata via stdout

## Providers
- local (default)
```

---

## TypeScript Requirements

- Strict TypeScript
- No `any`
- Clear shared types in `core`
- Providers must implement a shared interface

Example provider interface:

```ts
interface MediaProvider {
  name: string
  supports(action: string): boolean
  execute(input: MediaInput): Promise<MediaResult>
}
```

---

## Non-Goals (Explicitly Out of Scope)

- No pipelines or chained actions
- No UI
- No browser APIs
- No stateful sessions
- No cloud storage abstraction
- No background workers

---

## Success Criteria

The project is considered successful when:

- `npx agent-media image resize` works without configuration
- Setting `FILE_API_KEY` automatically enables the file provider
- Output is deterministic and machine-readable
- Skills are discoverable and understandable by agents
- Adding a new provider requires no changes to existing commands

---

## Summary

Agent Media is a **clean, explicit, agent-native media command system** that:
- works locally by default
- scales to cloud providers
- is safe for agent contexts
- prioritizes clarity over cleverness

Build for correctness first. Extend later.
