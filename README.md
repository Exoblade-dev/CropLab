# CropLab

> A modern, privacy-focused image cropping and editing tool that runs entirely in your browser.
>
> CropLab is a client-side image editor built with React and TypeScript. It provides precise image cropping, basic editing, transformations, resizing, and export tools through a responsive interface designed for both desktop and mobile devices.
>
> **Your images never leave your device.** Image processing and export are performed locally in the browser using the HTML5 Canvas API.

**Live Demo:** [CropLab](https://YOUR-VERCEL-DOMAIN.vercel.app)

## Features

### Image Input

- Upload images using the file picker
- Drag and drop images directly into the editor
- Paste images directly from the clipboard
- Replace the current image without restarting the application
- Clear the current image with confirmation

### Advanced Cropping

- Interactive crop area with resize handles
- Freely drag the crop region
- Visual crop grid
- Free-form cropping
- Preset aspect ratios: Free, 1:1, 4:3, 3:4, 3:2, 2:3, 16:9, and 9:16

### Image Controls

- Zoom from 1% to 500% with slider and controls
- Reset zoom
- Rotation from -180° to +180°
- 90° clockwise and counter-clockwise rotation
- Horizontal and vertical flip

### Editing History

- Undo and redo
- `Ctrl/Cmd + Z` to undo
- `Ctrl/Cmd + Shift + Z` to redo

### Output Configuration

- View original image dimensions
- View crop dimensions
- Configure custom output width and height
- Lock or unlock the aspect ratio
- Preview output dimensions before exporting

### Export

Export processed images directly from the browser as PNG, JPEG, or WebP. JPEG and WebP exports support adjustable quality and custom output dimensions.

Image processing and export are handled using the browser's Canvas API.

### User Interface

- Modern image-editor interface
- Dark and light modes with persistent theme preference
- Responsive desktop, tablet, and mobile layouts
- Keyboard accessibility, focus states, and ARIA labels
- Toast notifications and unsaved-changes warnings

## Privacy First

CropLab is designed as a fully client-side application. Your images are loaded and processed locally inside your browser using JavaScript and the HTML5 Canvas API.

The application does not use backend servers, databases, image upload APIs, cloud image-processing services, or server-side image storage.

> **Your images stay on your device.**

## Tech Stack

| Technology | Purpose |
| --- | --- |
| **React** | UI and application architecture |
| **TypeScript** | Type-safe application development |
| **Vite** | Development server and production bundling |
| **react-easy-crop** | Interactive image cropping |
| **HTML5 Canvas** | Image transformation and export |
| **CSS** | Responsive styling and theming |
| **localStorage** | Persisting UI preferences |

## Architecture

```text
CropLab UI (React + TypeScript)
        |
        v
Image Processing (react-easy-crop + Canvas)
        |
        v
Browser / Device (local image processing)
```

There is no backend dependency. This keeps CropLab lightweight, fast, easy to deploy, easy to maintain, and privacy-friendly.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm

Verify your installation:

```bash
node --version
npm --version
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

The application is normally available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Production files are generated in `dist/`.

### Preview the Production Build

```bash
npm run preview
```

## Usage

1. Open CropLab.
2. Upload an image, drag one into the editor, or paste one from the clipboard.
3. Adjust the crop area and select an aspect ratio if needed.
4. Adjust zoom, rotation, or flips.
5. Use undo or redo when needed.
6. Configure the output dimensions and format.
7. Adjust quality for JPEG or WebP exports.
8. Export the processed image.

All image processing happens locally in the browser.

## Project Structure

```text
crop-lab/
├── public/
├── src/
│   ├── assets/
│   │   └── hero.png
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

`node_modules/` and `dist/` are intentionally excluded from version control. Run `npm install` and `npm run build` to restore dependencies and regenerate the production build.

## Deployment

CropLab is a static client-side application and can be deployed to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static hosting provider.

### Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Vercel detects the Vite project automatically.
4. Deploy the application.

Typical settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

No backend server is required.

## Data and Privacy

CropLab does not intentionally transmit uploaded images to a remote server. Images are loaded and processed within the browser, and the application does not require an account or cloud image service.

Browser behavior, extensions, hosting infrastructure, or future modifications may affect how data is handled. Review the deployed application's implementation before using it for highly sensitive material.

## Limitations

- Animated GIFs are processed as static images using the first frame.
- Image metadata such as EXIF information may not be preserved during export.
- Export format support depends on the user's browser.
- Very large images can consume significant browser memory.
- Browser Canvas APIs impose practical limits on extremely large dimensions.
- Exported images may not preserve every piece of metadata from the original file.

## Screenshot

![CropLab Editor](./src/assets/hero.png)

## Project Goals

- **Privacy:** Process images locally whenever possible.
- **Simplicity:** Provide an easy workflow without accounts or complicated setup.
- **Responsiveness:** Remain usable across desktop, tablet, and mobile devices.
- **Accessibility:** Support keyboard navigation and appropriate semantic and ARIA information.
- **Performance:** Process images locally without unnecessary network requests.
- **Deployability:** Work as a standard static frontend.

## Future Improvements

- Brightness, contrast, saturation, and exposure controls
- Sharpening and filters
- Before-and-after comparison
- Batch image processing
- Additional export options
- More advanced image transformations
- Improved mobile editing controls

## License

This project does not currently include an open-source license. Unless a license is added to this repository, the source code should not be assumed to be freely reusable, modified, or redistributed.

## Acknowledgements

CropLab uses:

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [react-easy-crop](https://github.com/ValentinH/react-easy-crop)

---

**Crop. Edit. Export. Locally.**

Built with React and TypeScript.
