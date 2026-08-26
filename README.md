# CropLab

> A modern, privacy-focused image cropping and editing tool that runs entirely in your browser.

CropLab is a client-side image editor built with React and TypeScript. It provides precise image cropping, transformations, resizing, and export tools through a responsive interface designed for both desktop and mobile devices.

**Your images never leave your device.** Image processing and export are performed locally in the browser using the HTML5 Canvas API.

---

## ✨ Features

### 🖼️ Image Input

- Drag and drop images directly into the editor
- Select images using the file picker
- Paste images directly from the clipboard
- Replace the current image at any time
- Clear the current image with confirmation

### ✂️ Advanced Cropping

- Interactive crop area
- 8-point crop resizing handles
- Free-form cropping
- Aspect ratio presets:
  - Free
  - 1:1
  - 4:3
  - 3:4
  - 3:2
  - 2:3
  - 16:9
  - 9:16
- Crop grid overlay
- Real-time crop preview

### 🔍 Zoom & Transform

- Zoom from 1% to 500%
- Zoom controls and slider
- Reset zoom
- Rotate from -180° to +180°
- Quick 90° rotation controls
- Horizontal flip
- Vertical flip

### ↩️ Editing History

- Undo
- Redo
- Keyboard shortcuts
  - `Ctrl/Cmd + Z` — Undo
  - `Ctrl/Cmd + Shift + Z` — Redo

### 📐 Output Controls

- View original image dimensions
- View crop dimensions
- Configure output dimensions
- Lock/unlock aspect ratio
- Export at custom resolutions

### 📦 Export

Export your edited image as:

- PNG
- JPEG
- WebP

For JPEG and WebP:

- Adjustable output quality
- Custom output dimensions
- Browser-native Canvas rendering

### 🎨 Interface

- Modern responsive UI
- Light and dark themes
- Theme preference persisted locally
- Desktop, tablet, and mobile layouts
- Keyboard-accessible controls
- Accessible labels and focus states
- Responsive editor controls

### 🔒 Privacy First

CropLab does not upload your images to a server.

All image processing happens locally:

```text
Your Image
    ↓
Your Browser
    ↓
CropLab
    ↓
HTML5 Canvas
    ↓
Exported Image
