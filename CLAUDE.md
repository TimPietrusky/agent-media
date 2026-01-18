# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Media is an agent-first CLI toolkit for image, video, and audio processing. It provides deterministic, machine-readable JSON output designed for both human and AI agent consumption.

## Commands

```bash
# Build all packages
pnpm build

# Clean all dist/ directories
pnpm clean

# Type-check without emitting
pnpm typecheck

# Run the CLI locally during development
node packages/agent-media/dist/index.js image <action> [options]
```

## Architecture

This is a **pnpm monorepo** with seven packages:

```
packages/
├── agent-media/  # Commander.js CLI entry point (bin: agent-media)
├── core/         # Shared types, provider registry, result builders, config
├── image/        # Image action implementations (resize, convert, generate, remove-background, extend, edit)
├── audio/        # Audio action implementations (extract, transcribe)
├── video/        # Reserved for future video-specific actions
├── providers/    # Provider implementations (local/Sharp, fal.ai, replicate, runpod)
└── skills/       # Markdown skill definitions for agent discovery
```

### Key Patterns

**Provider Pattern**: All media operations flow through providers implementing `MediaProvider`:
- `packages/core/src/provider/index.ts` - Registry and resolution logic
- Provider resolution priority: CLI flag → env vars → local → any supporting provider

**Action Layer**: Each action in `packages/image/src/actions/` or `packages/audio/src/actions/` validates input and delegates to providers via `executeAction()`.

**Audio Package**: The `packages/audio/` package handles audio operations:
- `extract` - Extracts audio from video files using bundled ffmpeg (via `ffmpeg-static`). No API keys needed.
- `transcribe` - Transcribes audio to text using cloud providers (fal, replicate).

**Result Contract**: All output is JSON via `MediaResult` (success or error):
- `packages/core/src/result/index.ts` - `createSuccess()`, `createError()`, `printResult()`
- Error codes defined in `packages/core/src/types/index.ts`

**Local Provider**: Uses Sharp for zero-config image operations (resize, convert) without external APIs.

**Fal Provider**: Uses @ai-sdk/fal for image generation (fal-ai/flux-2), editing (fal-ai/flux-2/edit), and background removal (birefnet/v2). Requires `FAL_API_KEY`.

**Replicate Provider**: Uses @ai-sdk/replicate for image generation (black-forest-labs/flux-2-dev), editing (black-forest-labs/flux-kontext-dev), and background removal (birefnet). Requires `REPLICATE_API_TOKEN`.

**Runpod Provider**: Uses @runpod/ai-sdk-provider for image generation (alibaba/wan-2.6) and image editing (google/nano-banana-pro-edit). Requires `RUNPOD_API_KEY`.

**Input Support**: All providers support both local file paths and URLs as input. Local files are handled via:
- Local provider: `createReadStream()` → Buffer → Sharp
- Fal provider: `readFile()` → base64 data URI (images) or `fal.storage.upload()` (audio)
- Replicate provider: `readFile()` → Buffer (images) or data URI (audio)
- Runpod provider: `readFile()` → Buffer

### Adding a New Provider

1. Create provider in `packages/providers/src/<name>/index.ts`
2. Implement `MediaProvider` interface with `name`, `supports()`, and `execute()`
3. Register in `packages/providers/src/index.ts`

### Adding a New Image Action

1. Add action type to `ImageAction` in `packages/core/src/types/index.ts`
2. Create action function in `packages/image/src/actions/<action>.ts`
3. Export from `packages/image/src/actions/index.ts`
4. Add CLI command in `packages/agent-media/src/index.ts`
5. Create skill definition in `packages/skills/`

### Adding a New Audio Action

1. Add action type to `AudioAction` in `packages/core/src/types/index.ts`
2. Create action function in `packages/audio/src/actions/<action>.ts`
3. Export from `packages/audio/src/actions/index.ts`
4. Add CLI command in `packages/agent-media/src/index.ts`
5. Create skill definition in `packages/skills/`

## Environment Variables

- `FAL_API_KEY` - fal provider (generate, remove-background, transcribe)
- `REPLICATE_API_TOKEN` - replicate provider (generate, remove-background, transcribe)
- `RUNPOD_API_KEY` - runpod provider (generate, edit)
- `HUGGINGFACE_ACCESS_TOKEN` - replicate provider (transcribe with diarization only)
- `AGENT_MEDIA_DIR` - Custom output directory (default: `.agent-media/`)

## Commit Workflow

When the user asks to "commit" or you need to commit changes, follow this workflow:

### 1. Build and verify
```bash
pnpm build
```

### 2. Check what changed
```bash
git status
git diff --stat
```

### 3. Create a changeset file

**IMPORTANT:** The CLI package is named `agent-media` (NOT `@agent-media/cli`).

Create `.changeset/<descriptive-name>.md`:
```markdown
---
"agent-media": patch|minor|major
"@agent-media/core": patch|minor|major
"@agent-media/providers": patch|minor|major
"@agent-media/image": patch|minor|major
"@agent-media/audio": patch|minor|major
"@agent-media/video": patch|minor|major
---

Brief description of changes
```

Only include packages that were actually modified. Use:
- `patch` for bug fixes
- `minor` for new features (backward compatible)
- `major` for breaking changes

### 4. Create feature branch
```bash
git checkout -b feat/<descriptive-name>
# or fix/<descriptive-name> for bug fixes
```

### 5. Stage and commit
```bash
git add <files> .changeset/<name>.md
git commit -m "feat|fix: descriptive message"
```

### 6. Push and create PR
```bash
git push -u origin <branch-name>

# Switch to TimPietrusky account for this repo (remote is github.com-private)
gh auth switch --user TimPietrusky

gh pr create --title "..." --body "..."

# ALWAYS switch back to RunPod account when done
gh auth switch --user TimPietruskyRunPod
```

### Important
- **NEVER** manually edit CHANGELOG.md - changesets auto-generates it
- **NEVER** run `pnpm changeset version` locally
- Always include the changeset file with your commit
- The GitHub Action handles version bumps and npm publishing

## Releasing to npm

This project uses **changesets** for versioning and automated npm publishing via GitHub Actions with OIDC authentication (no npm token needed).

### How it works

1. Create a changeset file (see Commit Workflow above)

2. Commit and push the changeset file along with your code changes

3. Create a PR to `main`

4. When merged, the GitHub Action (`.github/workflows/release.yml`) automatically:
   - Detects the changeset
   - Creates a "Version Packages" PR that bumps versions and updates CHANGELOGs
   - When that PR is merged, publishes all updated packages to npm

### Important

- **Do NOT run `pnpm changeset version` locally** - let the GitHub Action handle it
- **Do NOT manually create/edit CHANGELOG.md** - changesets handles it
- The repo uses OIDC authentication with npm (via `id-token: write` permission) - no npm token secrets needed
- Just create the changeset file, commit, push, and let automation handle the rest

### GitHub repo settings (for new maintainers)

- Settings → Actions → General → Workflow permissions:
  - ✅ "Read and write permissions"
  - ✅ "Allow GitHub Actions to create and approve pull requests"

**Adding a new package to npm:**
1. New packages must be published manually the first time: `cd packages/<name> && npm publish --access public`
2. Future releases via GitHub Actions will work automatically (OIDC auth, no npm token needed)

## README Sync

**IMPORTANT:** The root `README.md` must be copied to `packages/cli/README.md` whenever it changes.

npm displays the README from the published package directory, not the repository root. Since the CLI package (`agent-media`) is published from `packages/cli/`, that's where npm looks for the README.

**When updating README.md:**
```bash
# After editing the root README.md, always sync to CLI package:
cp README.md packages/cli/README.md
```

Include this copy in the same commit/PR as your README changes.

## Design Principles

- **JSON-only output**: All commands output structured JSON to stdout
- **Zero-config default**: Works immediately with local provider (no API keys needed)
- **One command = one action**: Each CLI command does exactly one thing
- **Explicit over magic**: Provider selection is predictable and documented

### Naming Conventions (Agent-First Design)

This toolkit is designed for AI agents to understand and use. Follow these naming rules:

- **Use generic, descriptive names**: Avoid domain-specific jargon. Use names that clearly describe what the action does.
  - ✅ `extend` (adds padding to canvas)
  - ❌ `add-bleed` (print-specific jargon)
  - ✅ `flatten` (removes transparency)
  - ❌ `rasterize` (technical jargon)

- **No hidden functionality**: Each command should do exactly what its name implies. If a command does multiple things, either split it into separate commands or document all behaviors clearly in the description.

- **Parameter names should be self-explanatory**: An agent should understand what a parameter does from its name alone.
  - ✅ `--padding` (clear: adds space around)
  - ❌ `--bleed` (requires print knowledge)
  - ✅ `--color` (clear: specifies a color)

- **Descriptions must be complete**: Include all side effects in command descriptions. Example: "Also flattens any transparency to this color."
