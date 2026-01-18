---
"agent-media": minor
"@agent-media/core": minor
"@agent-media/providers": minor
"@agent-media/image": minor
"@agent-media/audio": minor
---

Add --name parameter for custom output filenames

- New `--name` option on all file-generating commands to specify custom output filename
- Without `--name`: output filename now derives from input filename (e.g., `photo_resized_<uuid>.png`)
- With `--name`: uses exact name provided, auto-corrects extension if wrong
- UUIDs in filenames are now without dashes for cleaner names
