# CropLab --- Complete Version & Phase Update History

This document consolidates the implementation history from **Phase 1
through Phase 9** so the individual `PHASE-*.md` files and scattered
version patch files can be removed from the repository.

## Current Status

**Current version:** `1.15.0`\
**Current milestone:** Phase 9 complete\
**Application model:** browser-local image editor; image processing and
exports run in the user's browser with no backend image-processing
service.

------------------------------------------------------------------------

# Phase 1 --- Foundation

## Objective

Refactor the original monolithic editor structure into a maintainable
application foundation without changing the product workflow.

## Changes

-   Refactored the main `App.tsx` into a smaller application shell.
-   Added `EditorWorkspace`.
-   Added the central CropLab editor hook.
-   Separated editor state and workspace responsibilities.
-   Added architecture-focused tests.
-   Preserved the existing image editing and export behavior.
-   Established a cleaner foundation for subsequent phases.

## Result

The application became structured around reusable editor state and
workspace components instead of continuing to grow inside one large
component.

------------------------------------------------------------------------

# Phase 2 --- Editor UX

## Objective

Improve the core editing controls and remove unnecessary or misleading
UI.

## Changes

### Crop ratios

Kept:

-   Free
-   1:1
-   4:3
-   3:4
-   16:9
-   9:16

Removed:

-   3:2
-   2:3

Added proper inline SVG ratio glyphs.

### Resize

-   Improved resize control clarity.
-   Made resize behavior and resulting dimensions clearer.

### Rotation

-   Expanded the rotation control.
-   Added numeric rotation handling.
-   Added reset behavior.
-   Added rotation snapping.

### Zoom

-   Expanded zoom control.
-   Added 50%, 100%, and 200% presets.
-   Added functional Fit behavior.
-   Added `0` keyboard shortcut for Fit.

### Destructive actions

-   Added confirmation flows for destructive operations.

### Transparency

-   Added White, Black, and Custom transparency/background choices.
-   Added a native color picker for Custom.

### Product/UX cleanup

-   Removed construction/future UI.
-   Removed unnecessary workflow numbering.
-   Removed "Final step" wording.
-   Kept capabilities independent instead of presenting the editor as a
    mandatory linear pipeline.

------------------------------------------------------------------------

# Phase 3 --- Adjustments

## Objective

Introduce deterministic image adjustments while preserving the existing
export pipeline.

## Adjustment state

Added:

``` text
brightness: 0
contrast: 0
saturation: 0
exposure: 0
sharpen: 0
blur: 0
```

## Controls

-   Brightness: `-100` to `+100`
-   Contrast: `-100` to `+100`
-   Saturation: `-100` to `+100`
-   Exposure: `-100` to `+100`
-   Sharpen: `0` to `100`
-   Blur: `0` to `20px`

## Processing

-   Added adjustment processing to the image pipeline.
-   Added live CSS filtering for tone/blur preview.
-   Added pixel-level sharpening during export/preview.
-   Added adjustment caching.
-   Integrated adjustments with undo/redo history.
-   Added mobile adjustment controls.

## Performance correction

The first implementation processed full-resolution output for
interactive previews.

This was changed to:

``` text
Interactive preview:
Original → Crop → max 1280px → Adjustments → Preview

Actual export:
Original → Crop → requested output dimensions → Adjustments → Encode
```

This kept interactive adjustment performance bounded while preserving
full-quality exports.

## Result

Large-image adjustment previews became substantially more responsive
without reducing actual export quality.

------------------------------------------------------------------------

# Phase 4 --- Preview

## Objective

Turn Preview into a final-output inspection environment rather than a
persistent live-preview system.

## Changes

-   Added an interactive preview viewport.
-   Added zoom and pan for output inspection.
-   Added Before/After comparison.
-   Before represents the same crop, transform, resize, format,
    background, and other export settings with adjustments neutralized.
-   Added output information.
-   Added high-resolution inspection for detailed comparison.
-   Kept the actual export pipeline unchanged.
-   Preserved the Phase 3 interactive-preview performance cap.

## Architecture

The main canvas remains the working editor result.

Preview is used for inspecting the actual intended output.

------------------------------------------------------------------------

# Phase 5 --- Input Foundation

## Objective

Make image input robust enough to support multiple images while keeping
the editor itself single-image at this phase boundary.

## Changes

### File picker

-   Added multiple-file selection.
-   First selected image opens automatically.
-   Additional selected images are reported to the user.

### Drag and drop

-   Added multiple-file drag/drop.
-   Prevented dropped files from triggering browser navigation.
-   Reused the existing validation rules.

### Clipboard

-   Added image paste through the same input normalization path.
-   Supports multiple image items from the clipboard.

### Validation

-   Added shared `ImageInputResult`.
-   Reused existing file validation.
-   Invalid files are reported without breaking valid input.

### Replace input

-   Replace input was extended to accept multiple files.
-   The editor remained single-image at the Phase 5 boundary.

## Result

All major image-input paths now converge on the same normalized input
flow.

------------------------------------------------------------------------

# Phase 6 --- Image Collection & Batch Export

## Objective

Move from a single active image to a browser-local image collection with
independent editing state and batch export.

## Image collection

Each image is represented by:

``` text
{
  id,
  file,
  thumbnailUrl,
  history
}
```

## Collection behavior

-   Multiple selected images are added to the collection.
-   The first image opens automatically.
-   Additional images can be added without replacing the active image.
-   Clicking a thumbnail switches the active image.
-   Each image preserves its own editor/history state.
-   Removing an image selects an appropriate remaining image.
-   Removing the final image returns to the upload screen.
-   Added/removal status is communicated through toasts.

## Thumbnail rail

-   Added a right-side desktop image rail.
-   Added a horizontal mobile thumbnail strip.
-   Added active-image indication.
-   Added edited-state indication.
-   Added per-image `×` delete controls.
-   Added an Add Images control.
-   Removed the visible Replace Image button.
-   Removed visible scrollbars while preserving scrolling.
-   Widened the desktop rail for improved usability.

## Batch export

Added:

-   Current-image export.
-   Full-batch ZIP export.
-   Batch progress.
-   Batch cancellation through `AbortController`.
-   Per-image format, quality, resize, transparency/background, and
    adjustment settings.

Batch processing uses the existing export pipeline for every image.

## ZIP implementation

Added a custom stored ZIP writer with:

-   local file headers
-   central directory
-   end-of-central-directory record
-   CRC-32
-   UTF-8 filenames
-   cancellation checks between images

No runtime ZIP dependency was introduced.

------------------------------------------------------------------------

# Phase 7 --- Metadata

## Objective

Expose useful source-image information and make metadata behavior
explicit.

## Image information

Added information for:

-   file name
-   source format
-   original dimensions
-   original file size
-   whether metadata was detected
-   metadata block types
-   GPS presence status

GPS coordinates are never displayed; only presence/detection status is
exposed.

## JPEG EXIF

When available, the UI can report:

-   camera make
-   camera model
-   capture date
-   ISO
-   exposure time
-   aperture
-   focal length
-   orientation

## Metadata policy

-   Source metadata is detected and reported.
-   Exports are re-encoded through Canvas.
-   Original source metadata is therefore not copied into exported
    files.
-   No misleading "Keep metadata" option was added.

## Export drawer order

The export drawer was explicitly ordered as:

1.  Format
2.  What will be exported
3.  Image information
4.  Metadata export policy

Quality and JPEG background remain below these sections.

------------------------------------------------------------------------

# Phase 8 --- Accessibility

## Objective

Make the editor usable without a mouse and improve keyboard, dialog,
screen-reader, focus, and reduced-motion behavior.

## Dialog accessibility

Added shared `useDialogA11y` behavior for dialogs:

-   focus enters the dialog
-   initial focus handling
-   Escape closes the dialog
-   Tab cycles within the dialog
-   Shift+Tab cycles within the dialog
-   focus is restored after closing
-   body scroll locking remains supported

Applied to:

-   Export dialog
-   Shortcut Guide
-   existing destructive/history dialog flows

## Keyboard accessibility

Added keyboard interaction for editor controls.

### Freeform crop

-   Crop handles can receive keyboard focus.
-   Arrow keys resize the focused handle.
-   Shift+Arrow uses a larger resize step.
-   Added appropriate keyboard accessibility metadata.

## Screen-reader accessibility

Improved:

-   editor controls
-   range controls
-   zoom presets
-   rotation range
-   adjustment sliders
-   image collection rail
-   header export control
-   collection guidance

Added screen-reader-only helper content where appropriate.

## Focus visibility

Added stronger visible `:focus-visible` styling for dense editor
controls.

## Reduced motion

Added `prefers-reduced-motion: reduce` handling to reduce/disable:

-   transitions
-   animations
-   hover transforms

## Result

The editor can be operated substantially through the keyboard, including
core editing controls, dialogs, collection controls, and freeform crop
resizing.

------------------------------------------------------------------------

# Phase 9 --- Performance

## Objective

Add real performance instrumentation and benchmarking so future
optimization decisions are based on measured behavior rather than
assumptions.

## Diagnostics

Added development-only performance diagnostics enabled through:

``` text
?perf=1
```

The Performance control exposes benchmark and diagnostic information
without adding the diagnostics UI to normal production use.

## Instrumented operations

Added measurements for:

-   image load
-   image decode
-   image metadata processing
-   canvas drawing
-   export encoding
-   total export
-   interactive benchmark
-   full benchmark

## Benchmark aggregation

Performance diagnostics provide:

-   measurement count
-   average duration
-   maximum duration
-   accumulated timing information
-   long-task count
-   blocked time

## Long-task diagnostics

Added browser long-task observation when performance diagnostics are
enabled.

Normal application use does not continuously run the diagnostic
observer.

## Performance overhead

Performance instrumentation is opt-in rather than permanently active
during normal use.

## Benchmark architecture

Interactive and full-resolution export paths are measured separately.

The existing interactive preview protection remains:

``` text
Interactive:
Original → Crop → max 1280px → Adjustments → Preview

Actual export:
Original → Crop → requested output dimensions → Adjustments → Encode
```

## Validation

Phase 9 was verified with:

-   TypeScript typecheck passing.
-   Lint passing with zero errors.
-   Existing non-blocking lint warnings remaining.
-   Full test suite passing.
-   Production build passing.
-   Production server starting successfully.
-   Performance diagnostics producing real measurements.
-   Interactive benchmark completing.
-   Full benchmark completing.
-   Large-image processing remaining functional.
-   Existing editing/export workflows remaining functional.

Final verified test result:

``` text
17 test files passed
86 tests passed
0 failed
```

------------------------------------------------------------------------

# Version History

## v1.10.x --- Phase 4

-   Interactive Preview.
-   Before/After comparison.
-   Output information.
-   High-resolution output inspection.

## v1.11.0 --- Phase 5

-   Multiple file input.
-   Multiple drag/drop.
-   Clipboard image input.
-   Shared input normalization.
-   Multi-file validation.
-   Browser navigation prevention for drops.

## v1.12.x --- Phase 6

-   Image collection state.
-   Per-image editor/history state.
-   Thumbnail rail.
-   Image switching.
-   Image removal.
-   Batch export.
-   ZIP generation.
-   Batch progress and cancellation.
-   Collection UX refinements.
-   Replace Image button removal.
-   Thumbnail rail layout/test corrections.

## v1.13.x --- Phase 7

-   Image information.
-   Metadata detection.
-   JPEG EXIF information.
-   GPS presence reporting without coordinates.
-   Explicit metadata export policy.
-   Final export drawer card order.

## v1.14.0 --- Phase 8

-   Keyboard accessibility.
-   Dialog focus management.
-   Escape handling.
-   Focus trapping/restoration.
-   Freeform crop keyboard handles.
-   Screen-reader labels and guidance.
-   Focus-visible styling.
-   Reduced-motion support.

## v1.15.0 --- Phase 9

-   Performance diagnostics.
-   Export benchmarking.
-   Interactive/full benchmark separation.
-   Canvas-draw timing.
-   Encode timing.
-   Image load/decode timing.
-   Metadata timing.
-   Long-task diagnostics.
-   Opt-in performance instrumentation.
-   Performance aggregation.
-   Performance tests.

------------------------------------------------------------------------

# Product Architecture After Phase 9

CropLab now follows this broad architecture:

``` text
INPUT
  ├── File picker
  ├── Drag & drop
  └── Clipboard
        ↓
IMAGE COLLECTION
  ├── Image A → independent editor/history
  ├── Image B → independent editor/history
  ├── Image C → independent editor/history
  └── ...
        ↓
EDITOR
  ├── Crop
  ├── Resize
  ├── Rotate
  ├── Zoom / Fit
  ├── Flip
  └── Adjustments
        ↓
PREVIEW
  ├── Interactive viewport
  ├── Before / After
  └── Output inspection
        ↓
EXPORT
  ├── Current image
  └── Full batch → ZIP
        ↓
METADATA
  ├── Source information
  ├── EXIF inspection
  └── Explicit export policy
        ↓
ACCESSIBILITY
  ├── Keyboard
  ├── Focus management
  ├── Screen readers
  └── Reduced motion
        ↓
PERFORMANCE
  ├── Instrumentation
  ├── Benchmarking
  └── Long-task diagnostics
```

------------------------------------------------------------------------

# Consolidated Git Commit Message

Recommended commit message for syncing the complete Phase 1--9
implementation:

``` text
feat: complete CropLab editor foundation through phase 9

- refactor editor architecture and workspace state
- improve crop, resize, rotation, zoom, and transparency UX
- add deterministic image adjustments and optimized previews
- add interactive before/after output preview
- add multi-file input, drag/drop, and clipboard support
- add image collection state and batch ZIP export
- add metadata inspection and explicit export policy
- add keyboard, dialog, screen-reader, focus, and reduced-motion accessibility
- add performance instrumentation, benchmarking, and long-task diagnostics
- preserve full-resolution export while bounding interactive processing
- add and update regression tests across all phases

Verified through Phase 9:
- 17 test files passed
- 86 tests passed
- typecheck passed
- lint passed with 0 errors
- production build passed
```

## Short alternative

If you prefer a cleaner Git history:

``` text
feat: complete CropLab phases 1-9
```

with the detailed body above.

------------------------------------------------------------------------

## Repository cleanup

After adding this consolidated file, you can remove the accumulated:

``` text
PHASE-1.md
PHASE-2.md
PHASE-3.md
PHASE-4.md
PHASE-5.md
PHASE-6.md
PHASE-7.md
PHASE-8.md
PHASE-9.md
```

and the individual version patch files such as:

``` text
version-patch-updates/v1.12.md
version-patch-updates/v1.13.md
version-patch-updates/v1.13.1.md
version-patch-updates/v1.14.md
...
```

Keep the single consolidated history file as the long-term project
record.
