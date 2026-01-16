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
node packages/cli/dist/index.js image <action> [options]
```

## Architecture

This is a **pnpm monorepo** with five packages:

```
packages/
├── core/       # Shared types, provider registry, result builders, config
├── image/      # Image action implementations (resize, convert, generate, remove-background, extend, edit)
├── providers/  # Provider implementations (local/Sharp, fal.ai, replicate, runpod)
├── cli/        # Commander.js entry point (bin: agent-media)
└── skills/     # Markdown skill definitions for agent discovery
```

### Key Patterns

**Provider Pattern**: All media operations flow through providers implementing `MediaProvider`:
- `packages/core/src/provider/index.ts` - Registry and resolution logic
- Provider resolution priority: CLI flag → env vars → local → any supporting provider

**Action Layer**: Each action in `packages/image/src/actions/` validates input and delegates to providers via `executeAction()`.

**Result Contract**: All output is JSON via `MediaResult` (success or error):
- `packages/core/src/result/index.ts` - `createSuccess()`, `createError()`, `printResult()`
- Error codes defined in `packages/core/src/types/index.ts`

**Local Provider**: Uses Sharp for zero-config image operations (resize, convert) without external APIs.

**Fal Provider**: Uses @ai-sdk/fal for image generation (flux/schnell) and background removal (birefnet/v2). Requires `FAL_API_KEY`.

**Replicate Provider**: Uses @ai-sdk/replicate for image generation (flux-schnell) and background removal (birefnet v1). Requires `REPLICATE_API_TOKEN`. Note: Replicate only has BiRefNet v1 (legacy), while fal has v2.

**Runpod Provider**: Uses @runpod/ai-sdk-provider for image generation (alibaba/wan-2.6) and image editing (google/nano-banana-pro-edit). Requires `RUNPOD_API_KEY`.

### Adding a New Provider

1. Create provider in `packages/providers/src/<name>/index.ts`
2. Implement `MediaProvider` interface with `name`, `supports()`, and `execute()`
3. Register in `packages/providers/src/index.ts`

### Adding a New Image Action

1. Add action type to `ImageAction` in `packages/core/src/types/index.ts`
2. Create action function in `packages/image/src/actions/<action>.ts`
3. Export from `packages/image/src/actions/index.ts`
4. Add CLI command in `packages/cli/src/index.ts`
5. Create skill definition in `packages/skills/`

## Environment Variables

- `FAL_API_KEY` - fal provider (generate, remove-background)
- `REPLICATE_API_TOKEN` - replicate provider (generate, remove-background)
- `RUNPOD_API_KEY` - runpod provider (generate, edit)
- `AGENT_MEDIA_DIR` - Custom output directory (default: `.agent-media/`)

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
