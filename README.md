# CropLab

> A privacy-focused browser image editor for cropping, transforming, resizing, previewing, and exporting images locally.

CropLab is a client-side image editing application built around a simple, explicit workflow:

**Import → Crop → Resize → Export**

The editor performs normal image processing in the browser. Images are loaded with browser object URLs, edited through the Canvas API, and exported locally without requiring an application backend.

---

## Current Status

**v1.x final baseline**

CropLab's v1.x cycle is complete and frozen as the stable foundation for future v2 development.

The final v1.x implementation focuses on a reliable core editor rather than a large collection of unfinished tools. The currently active editing workflow is:

1. **Crop** — choose a fixed aspect ratio or use Freeform crop.
2. **Transform** — rotate, flip, and zoom from the persistent editor controls.
3. **Resize** — set the final output width and height in pixels.
4. **Export** — choose PNG, JPEG, or WebP, configure quality where supported, inspect the final output, and download it.

Additional capabilities such as compression workflows, image adjustments, presets, background removal, OCR, and batch processing are intentionally reserved for later development.

---

## Features

### Image import

- File picker upload.
- Drag-and-drop image import.
- Clipboard image paste.
- Replace the current image through the editor.
- Clear the current image and return to the upload surface.
- Explicit confirmation before destructive replace/clear actions.
- Image decoding before the file enters the editor.

### Supported input formats

CropLab accepts:

- JPEG
- PNG
- WebP
- GIF

GIF input is treated as a static image. CropLab edits the first frame and does not preserve animation during export.

### Image validation and safety limits

Input validation happens before normal editing begins.

| Limit | Value |
| --- | ---: |
| Maximum input file size | **50 MB** |
| Maximum source dimension | **8192 px** |
| Maximum decoded image pixels | **50,000,000** |
| Large-image working preview | **4096 px max dimension** |

The loader checks actual image signatures rather than relying only on file extensions or MIME types. MIME/signature mismatches are rejected, as are malformed, empty, unsupported, or oversized images.

The 4096 px working preview is an interaction optimization for large source images. The original decoded image remains the authoritative source used for export.

---

## Crop

CropLab provides both fixed-ratio and Freeform cropping.

### Fixed aspect ratios

Available presets:

- Free
- 1:1
- 4:3
- 3:4
- 3:2
- 2:3
- 16:9
- 9:16

Fixed-ratio cropping uses the established `react-easy-crop` interaction model. The image can be repositioned underneath the crop frame while zoom and rotation remain available.

### Freeform crop

Freeform mode uses a dedicated crop-box interaction rather than forcing arbitrary cropping through the fixed-ratio cropper.

It provides:

- Eight resize handles: corners and edge centers.
- Independent width and height resizing.
- Crop-box movement.
- Minimum-size constraints.
- Image-boundary constraints.
- Touch/pointer interaction.
- Source-pixel coordinate conversion.
- Rotation-aware working geometry.
- A centered initial crop based on a preferred 1000 × 1000 source-pixel size when possible.

The Freeform geometry is mapped back into the same source-pixel/export coordinate model used by the export engine.

At non-90° rotations, the crop boundary is based on the rotated image's bounding box rather than the exact rotated polygon. This is an intentional v1.x geometry model shared with the export pipeline.

---

## Transform controls

The persistent editor controls provide:

### Rotation

- Rotate left 90°.
- Rotate right 90°.
- Arbitrary rotation through a slider.
- Rotation normalized to the `-180°` to `180°` range.
- Rotation participates in history.

### Flip

- Horizontal flip.
- Vertical flip.
- Crop position, rotation, and zoom are preserved when flipping.
- Flip state participates in the complete editor snapshot/history model.

### Zoom

- 20%–200% range.
- Zoom in/out controls.
- Fit view.
- 100% preset.
- 200% preset.
- Reset zoom.
- Mouse-wheel zoom on supported desktop interaction.
- Touch pinch interaction.
- Keyboard shortcuts.

Zoom/navigation state is intentionally excluded from the history timeline because it is treated as view state rather than an image edit.

---

## Resize

Resize is the single source of truth for final output dimensions.

The editor provides:

- Exact width in pixels.
- Exact height in pixels.
- Maintain-aspect-ratio lock.
- Automatic derivation of the opposite dimension when the lock is enabled.
- Independent dimensions when unlocked.
- Crop dimensions shown for context.
- Output dimensions shown before export.

The Export workspace does **not** duplicate editable width/height controls. It reports the final dimensions that will be exported, while dimensions are changed only through **Edit → Resize**.

This keeps the editing pipeline explicit:

```text
Crop
  ↓
Resize
  ↓
Export
```

---

## Export

CropLab exports locally through the browser Canvas API.

### Formats

| Format | Quality | Transparency | Background |
| --- | --- | --- | --- |
| PNG | Lossless | Preserved | Not required |
| JPEG | 20%–100% | Composited | White / Black / Custom |
| WebP | 20%–100% | Preserved | Not required |

PNG is offered as a lossless format. JPEG and WebP expose browser encoder quality controls.

JPEG cannot contain alpha transparency, so transparent pixels are composited onto the selected background color.

Browser capability detection is used for optional JPEG/WebP encoders; PNG remains required.

### Export pipeline

The export engine is structured around:

```text
Crop area
   ↓
Output dimensions
   ↓
Rotation / flip transform
   ↓
Canvas rendering
   ↓
Browser encoder
   ↓
Blob
   ↓
Download
```

The output canvas uses the source image and the selected crop/transform state. Rotation is rendered in the rotated bounding-box coordinate system to keep crop geometry and export geometry aligned.

### Output information

The Export workspace communicates:

- Selected format.
- Quality where applicable.
- Final output dimensions.
- Original image information.
- Estimated encoded file size.
- Size reduction compared with the original file.
- Export status.

Quality is **not** presented as a file-size percentage. Size estimates are based on the actual encoded Blob.

---

## Live export preview

CropLab includes a debounced live export preview.

The preview uses the same core export functions as the actual download path rather than maintaining a separate approximate renderer.

Preview behavior includes:

- Crop rendering.
- Resize rendering.
- Rotation and flip rendering.
- Format encoding.
- Quality changes.
- JPEG background changes.
- Encoded Blob size estimation.
- Status feedback while the preview is being prepared.
- Click-to-enlarge final export preview.
- Final preview details for dimensions, format, quality, and estimated size.

The preview Blob can be reused for download when its complete export state still matches the requested export, avoiding unnecessary duplicate encoding work.

---

## History

CropLab uses snapshot-based editor history.

The history system supports:

- Original state plus up to 50 edit operations.
- Undo.
- Redo.
- Direct selection of a previous history state.
- Complete editor-state restoration.
- Linear branching behavior: editing from an older state removes the future branch.
- Duplicate-state protection.

A history snapshot includes the editing state required to reproduce an output, including:

- Crop state.
- Crop area.
- Freeform crop rectangle.
- Selected crop ratio.
- Output width and height.
- Aspect-ratio lock.
- Export format.
- Export quality.
- JPEG background color.
- Rotation/flip state through the crop transform.

View-only zoom/navigation changes are not recorded as image-edit history.

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `R` | Rotate 90° right |
| `0` | Fit view |
| `1` | Zoom to 100% |
| `2` | Zoom to 200% |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `Esc` | Exit active tool / close editor surface |
| `Ctrl/Cmd + O` | Open or replace an image |
| `Ctrl/Cmd + S` | Export |

Shortcuts are centralized and are ignored while the user is interacting with form controls.

A persistent **Shortcuts** control in the application header opens the full shortcut guide.

---

## Mobile editor

CropLab does not simply shrink the desktop editor onto a phone.

At mobile widths it uses a dedicated interaction model with:

- Dedicated mobile canvas workspace.
- Touch-friendly controls.
- Touch crop dragging.
- Pinch zoom.
- Persistent quick controls for high-frequency actions.
- Dedicated Crop and Resize panels.
- A secondary More menu for history and image-management actions.
- A modal-style Export surface.
- Internal scrolling when the export surface needs additional space.

The mobile editor keeps the core crop → resize → export workflow intact while adapting the interaction surfaces for touch.

---

## Accessibility

The v1.x editor includes an accessibility layer covering the major interaction surfaces.

- Keyboard-accessible skip link.
- Semantic navigation and native controls where practical.
- Strong `:focus-visible` treatment.
- Descriptive labels for icon-only controls.
- Accessible pressed states.
- `aria-live` toast announcements.
- Labelled dialogs.
- Focus containment and restoration for modal surfaces.
- Keyboard dismissal for dialogs.
- Touch-friendly target sizing.
- Reduced-motion support.
- Browser zoom preserved.
- Mobile form controls sized appropriately for iOS interaction.

---

## Theme

CropLab supports a persistent light/dark theme.

Theme state is handled through a dedicated hook with Next.js SSR/hydration concerns accounted for.

---

## Privacy model

CropLab is designed around browser-local image processing.

For the normal editor workflow:

- Images are loaded through browser object URLs.
- Image editing is performed in the browser.
- Canvas is used for rendering and encoding.
- Exported files are generated locally.
- No application backend is required for image editing or export.

Object URLs are revoked when they are no longer needed, including replacement/clearing flows and component cleanup.

CropLab does not require uploading the working image to an application server for the normal editing workflow.

---

## Performance architecture

v1.9 introduced measurement before architectural optimization.

Performance instrumentation covers:

- Image loading.
- Image decoding.
- GIF first-frame materialization.
- Preview generation.
- Export canvas drawing.
- Browser encoding.
- Total export timing.
- Optional browser long-task observation.

Performance diagnostics can be enabled with:

```text
?perf=1
```

or through the local-storage flag:

```text
croplab-performance = 1
```

The v1.x performance work deliberately does **not** introduce Workers or OffscreenCanvas. The large-image pass instead reduces interactive raster workload through a capped working preview while retaining the original source for export.

The large-image stress target is:

```text
8064 × 6048
48,771,072 pixels
```

This remains below the 50,000,000-pixel safety ceiling.

---

## Architecture

CropLab is organized into separate UI, interaction, image-processing, history, performance, and type layers.

```text
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── AppHeader.tsx
│   ├── ConfirmationDialog.tsx
│   ├── EditorSidebar.tsx
│   ├── EditorToolbar.tsx
│   ├── ExportPanel.tsx
│   ├── ExportPreview.tsx
│   ├── FreeformCropper.tsx
│   ├── HistoryPanel.tsx
│   ├── MobileEditorControls.tsx
│   ├── ShortcutGuide.tsx
│   ├── Toast.tsx
│   └── UploadScreen.tsx
│
├── hooks/
│   ├── use-editor-history.ts
│   ├── use-export-preview.ts
│   ├── use-image-loader.ts
│   ├── use-keyboard-shortcuts.ts
│   ├── use-supported-export-formats.ts
│   └── use-theme.ts
│
├── lib/
│   ├── editor/
│   │   ├── freeform.ts
│   │   ├── history.ts
│   │   ├── interaction.ts
│   │   └── shortcuts.ts
│   │
│   ├── image/
│   │   ├── constants.ts
│   │   ├── export.ts
│   │   ├── formats.ts
│   │   ├── loading.ts
│   │   ├── preview.ts
│   │   ├── transform.ts
│   │   └── validation.ts
│   │
│   └── performance/
│       └── metrics.ts
│
├── types/
│   └── editor.ts
│
├── App.tsx
├── App.css
├── cropper.css
├── dialogs.css
├── export.css
├── history.css
└── index.css
```

### Responsibility overview

| Area | Responsibility |
| --- | --- |
| `components/` | Editor UI and interaction surfaces |
| `hooks/` | Stateful editor behaviors and browser lifecycle logic |
| `lib/editor/` | Crop interaction, freeform geometry, history, and shortcuts |
| `lib/image/` | Validation, loading, preview scaling, transforms, formats, and export |
| `lib/performance/` | Browser Performance API diagnostics |
| `types/` | Shared editor and export types |
| `tests/` | Regression and behavior-level unit tests |

`App.tsx` acts as the application orchestration layer, connecting the editor state, history, image loader, cropper, export preview, export engine, desktop UI, and mobile controls.

---

## Testing

The repository contains regression coverage for the core editor and image-processing foundations.

Current test areas include:

- Editing interaction helpers.
- Zoom and rotation normalization.
- Cropper transform preservation.
- Export format metadata.
- Output dimension derivation.
- Encoded size-reduction calculations.
- Image signature detection.
- File validation.
- Image/canvas safety limits.
- Keyboard shortcut mapping.
- Form-control shortcut suppression.
- History selection and branching.
- History operation limits.
- Duplicate history-state prevention.
- Freeform crop geometry.
- Freeform resize handles.
- Crop boundary enforcement.
- Preview-to-source coordinate conversion.
- Rotated freeform geometry.
- Preview sizing.
- Performance measurement behavior.
- Rotation-aware export geometry.

Run the verification commands locally after installing dependencies:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

For development:

```bash
npm install
npm run dev
```

---

## Tech stack

- **Next.js 16** — App Router application structure.
- **React 19** — editor UI and stateful interaction.
- **TypeScript** — strict typed application code.
- **react-easy-crop** — fixed-ratio crop interaction.
- **Lucide React** — interface icons.
- **HTML Canvas API** — local rendering and encoding.
- **Vitest** — regression/unit testing.
- **Oxlint** — linting.

The package manifest currently targets Next.js 16.3.x, React 19.2.x, TypeScript 6.x, Vitest 5.x, Oxlint 1.x, `react-easy-crop` 6.x, and Lucide React 1.x.

---

## Intentional v1.x boundaries

The final v1.x release deliberately does **not** pretend that unfinished capabilities are complete.

The following are visible as future capabilities but are not active editing tools:

- Compress
- Adjust
- Presets
- Background Removal
- OCR / Image to Text
- Batch Processing

The following are also outside the v1.x export scope:

- PDF export.
- AVIF export.
- Animated GIF/APNG export.
- Server-side encoding.
- Target-file-size compression.
- Batch export.
- Advanced encoder controls.

These boundaries keep the v1.x editor focused on a reliable local crop/transform/resize/export workflow.

---

## Version history

The repository keeps a consolidated record of the v1.x development cycle in `version-patch-updates/`.

| Version | Focus |
| --- | --- |
| **v1.1** | Foundation and architecture |
| **v1.2** | Editor foundation and UI refinement |
| **v1.3** | Three-zone editor workspace |
| **v1.4** | Editing engine and interaction UX |
| **v1.5** | Export engine and release cleanup |
| **v1.6** | Reliability and image handling |
| **v1.7** | History, interaction, and export workspace |
| **v1.8** | Mobile interaction and accessibility |
| **v1.9** | Performance architecture, large-image handling, export stabilization, and final v1.x refinement |

See the individual Markdown files in `version-patch-updates/` for the detailed implementation record of each release.

---

## Repository notes

`tsconfig.tsbuildinfo` is included in the repository as TypeScript incremental build metadata for the current project state.

It is generated build metadata rather than application source code. If the project later adopts a clean-source-only repository policy, it can be regenerated locally and ignored by Git without affecting the application itself.

---

## v1.x freeze

CropLab v1.x is intentionally treated as a stable baseline.

The objective of the completed cycle was not to build every possible image-editing feature. It was to establish a dependable local editor with:

- Clear editing workflow.
- Real crop and Freeform interactions.
- Persistent transforms.
- Exact resize controls.
- Format-aware export.
- Real encoded-size estimation.
- Live export preview.
- Snapshot history.
- Large-image safeguards.
- Mobile interaction.
- Accessibility support.
- Performance diagnostics.
- Browser-local processing.

Future v2 work should build on this baseline rather than continuing to expand v1.x incrementally.
