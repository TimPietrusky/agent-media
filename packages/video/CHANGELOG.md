# @agent-media/video

## 0.3.2

### Patch Changes

- Updated dependencies [d61796e]
  - @agent-media/core@0.10.0
  - @agent-media/providers@0.10.0

## 0.3.1

### Patch Changes

- Updated dependencies [268f212]
  - @agent-media/providers@0.9.0

## 0.3.0

### Minor Changes

- 1383717: Change default output directory from `.agent-media/` to current working directory

  Files are now written to the current working directory by default instead of a `.agent-media/` subfolder. This makes the tool easier to use in pipelines where output files need to be in the current directory.

  - `--out` flag still works to override the output directory
  - `AGENT_MEDIA_DIR` environment variable still works to set a custom default

### Patch Changes

- Updated dependencies [1383717]
  - @agent-media/core@0.9.0
  - @agent-media/providers@0.8.1

## 0.2.5

### Patch Changes

- Updated dependencies [df1311e]
  - @agent-media/core@0.8.0
  - @agent-media/providers@0.8.0

## 0.2.4

### Patch Changes

- Updated dependencies [02643b6]
  - @agent-media/core@0.7.0
  - @agent-media/providers@0.7.0

## 0.2.3

### Patch Changes

- Updated dependencies [8be70eb]
  - @agent-media/core@0.6.0
  - @agent-media/providers@0.6.0

## 0.2.2

### Patch Changes

- b0f02ba: Update repository URLs to agntswrm organization
- Updated dependencies [b0f02ba]
  - @agent-media/core@0.5.1
  - @agent-media/providers@0.5.2

## 0.2.1

### Patch Changes

- Updated dependencies [cac474a]
  - @agent-media/providers@0.5.1

## 0.2.0

### Minor Changes

- 6097a41: Add video generation command supporting text-to-video and image-to-video

  - New `video generate` CLI command with options for duration, resolution, fps, and audio
  - Support for fal.ai (LTX-2) and Replicate (lightricks/ltx-video) providers
  - Image-to-video: animate a static image with a text prompt
  - Optional audio generation with `--audio` flag

### Patch Changes

- Updated dependencies [6097a41]
  - @agent-media/core@0.5.0
  - @agent-media/providers@0.5.0

## 0.1.5

### Patch Changes

- Updated dependencies [5304b44]
  - @agent-media/core@0.4.0
  - @agent-media/providers@0.4.0

## 0.1.4

### Patch Changes

- Updated dependencies [d0377dd]
  - @agent-media/providers@0.3.0

## 0.1.3

### Patch Changes

- Updated dependencies [36ce78a]
  - @agent-media/core@0.3.0
  - @agent-media/providers@0.2.0

## 0.1.2

### Patch Changes

- ac65ff4: Test OIDC publishing via GitHub Actions

## 0.1.1

### Patch Changes

- Updated dependencies
  - @agent-media/core@0.2.0
  - @agent-media/providers@0.1.1
