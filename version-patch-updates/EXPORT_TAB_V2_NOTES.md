# CropLab Export Tab V2

This patch changes only the Export surface.

## Included

- New format-aware export UI for the formats currently exposed by CropLab's encoder registry: PNG, JPEG, and WebP.
- PNG presents lossless output and preserved transparency without a quality control.
- JPEG presents quality, quality presets, dimensions, and White / Black / Custom background controls.
- WebP presents quality and preserved transparency while explicitly avoiding a fake lossless mode because the current browser canvas encoder does not expose one.
- First-class width / height controls with the existing aspect-ratio lock behavior.
- Original, crop, and output dimensions are shown together.
- Output summary keeps the existing actual encoded-size estimate and reduction calculation.
- Existing export status state machine is preserved.
- Download action remains wired to the existing export engine.
- AVIF is intentionally not added to the selector because the current repository does not have an AVIF encoder/capability entry. The UI does not advertise unsupported encoding.

## Deliberately not included in this pass

- No AVIF encoder implementation.
- No metadata editor.
- No filename editor.
- No batch export.
- No new resize algorithms.
- No changes to the existing export engine.
- No changes to crop, resize, history, toolbar, canvas, upload, or other editor behavior.

## Files changed

- `src/components/ExportPanel.tsx`
- `src/export.css`
- `src/app/layout.tsx` (re-enables the export stylesheet for the Export surface)
