# Export Tab Clean Fix

This patch fixes only the Export surface.

- Restores the Export V2 stylesheet with explicit component styling.
- Keeps the workspace bounded to the available desktop viewport.
- Keeps the canvas at the workspace height.
- Makes only Export content scroll when its content exceeds the available height.
- Keeps the Export header and download/status footer fixed.
- Preserves the CropLab scrollbar treatment.
- Root layout explicitly imports `export.css`.
- No React logic, export engine, crop, canvas, history, upload, or image handling changes.
