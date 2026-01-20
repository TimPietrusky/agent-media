---
"agent-media": minor
"@agent-media/core": minor
"@agent-media/image": minor
"@agent-media/audio": minor
"@agent-media/video": minor
---

Change default output directory from `.agent-media/` to current working directory

Files are now written to the current working directory by default instead of a `.agent-media/` subfolder. This makes the tool easier to use in pipelines where output files need to be in the current directory.

- `--out` flag still works to override the output directory
- `AGENT_MEDIA_DIR` environment variable still works to set a custom default
