# Export Tab V2 — Height Fix

## Scope
Only the Export tab layout was changed. No editor, crop, canvas, history, upload, or export-engine files were modified.

## Fix
The Export panel now explicitly fills the desktop workspace grid track with `height: 100%` and `max-height: 100%`, while its internal content remains inside the dedicated scroll container.

This prevents format-specific sections (JPEG background and WebP/quality controls) from increasing the page/grid height when switching formats.

At responsive widths where the workspace intentionally becomes a normal document flow, the panel returns to `height: auto` and `max-height: none`.
