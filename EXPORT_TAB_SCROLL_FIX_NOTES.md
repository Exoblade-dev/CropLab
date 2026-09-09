# Export Tab Scroll Fix

This patch is isolated to `src/export.css`.

- Removes the previous Export-specific viewport rules that changed the overall editor viewport sizing.
- Restores the existing middle canvas/workspace height as the source of truth for the desktop grid.
- Keeps the Export panel at the grid height with `height: 100%` / `max-height: 100%`.
- Makes only the Export content area scroll when its content exceeds the panel height.
- Keeps the scrollbar background transparent and styles the thumb using CropLab theme variables.
- Does not modify the export engine, ExportPanel component, canvas, editor, history, upload, or other application behavior.
