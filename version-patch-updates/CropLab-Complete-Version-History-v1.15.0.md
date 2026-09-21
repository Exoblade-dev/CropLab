# CropLab — Complete Version History v1.15.0

## Phase 1 — Foundation

- Refactored the editor architecture around `EditorWorkspace` and the CropLab editor hook.
- Split the monolithic application state into focused components/hooks.
- Added architecture regression coverage.

## Phase 2 — Editor UX

- Refined crop aspect-ratio controls and removed 3:2 / 2:3 presets.
- Added SVG aspect-ratio glyphs.
- Improved resize clarity, rotation controls, zoom presets, and Fit behavior.
- Added destructive-action confirmations.
- Added a custom transparency color picker.

## Phase 3 — Adjustments

- Added deterministic brightness, contrast, saturation, exposure, sharpen, and blur adjustments.
- Integrated adjustments with editor history and undo/redo.
- Added optimized interactive adjustment previews with a 1280px maximum working dimension.
- Preserved full-resolution adjustment processing for actual export.

## Phase 4 — Preview

- Added interactive final-output preview.
- Added Before/After comparison using the same crop, transform, resize, format, and background settings.
- Added output information and high-resolution inspection.

## Phase 5 — Input

- Added multiple-file picker input.
- Added multiple-file drag/drop.
- Added clipboard image paste.
- Unified picker, drop, and clipboard normalization.
- Preserved validation and prevented browser navigation from dropped files.

## Phase 6 — Image Collection & Batch Export

- Added browser-local image collection state.
- Added independent editor/history state per image.
- Added thumbnail rail, image switching, image removal, and Add Images.
- Added current-image export and full-batch ZIP export.
- Added sequential batch processing, progress, and cancellation.
- Added a custom browser-local stored ZIP writer.
- Removed the visible Replace Image UI while retaining the underlying shortcut flow.

## Phase 7 — Metadata

- Added source image information: filename, format, dimensions, file size, metadata detection, metadata block types, and GPS presence status.
- Added common JPEG EXIF fields: camera make/model, capture date, ISO, exposure time, aperture, focal length, and orientation.
- Explicitly documented that Canvas-based exports do not preserve source metadata.
- GPS coordinates are never displayed.

## Phase 8 — Accessibility

- Added shared dialog focus management, focus trapping, Escape handling, and focus restoration.
- Added keyboard resizing for Freeform crop handles.
- Improved screen-reader labels and guidance for core editor and collection controls.
- Added stronger visible focus treatment.
- Added reduced-motion behavior through `prefers-reduced-motion`.

## Phase 9 — Performance

- Added opt-in Performance Diagnostics through `?perf=1`.
- Added aggregated Performance API timing summaries.
- Instrumented image load, decode, metadata processing, canvas drawing, encoding, and total export timing.
- Added separate interactive and full-resolution export benchmarks.
- Added browser long-task observation with lifecycle control.
- Added a neutral-adjustment fast path to avoid unnecessary adjustment processing.
- Preserved the 1280px interactive preview cap and full-resolution export path.
- Kept Workers, OffscreenCanvas, server-side processing, and uploads out of the local editing architecture.

## Current v1.15.0 Baseline

CropLab is a browser-local image editor with independent editing capabilities, a local image collection, batch ZIP export, metadata inspection, accessibility hardening, and opt-in performance diagnostics.

The active editor supports:

- Crop and Freeform crop
- Resize
- Rotate and flip
- Zoom and Fit
- Brightness, contrast, saturation, exposure, sharpen, and blur
- Interactive final-output preview and Before/After inspection
- PNG, JPEG, and WebP export
- Transparency/background handling
- Per-image history
- Multi-image collection and batch ZIP export
- Source metadata inspection with explicit metadata stripping policy
- Keyboard, focus, screen-reader, and reduced-motion support
- Real-browser performance diagnostics and benchmarking

Intentional boundaries remain: no server-side image processing, PDF/AVIF export, animated GIF/APNG export, target-file-size compression, metadata rewriting, or advanced encoder controls.
