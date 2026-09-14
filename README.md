# CropLab

> A privacy-focused browser image editor. Crop, transform, resize, and export images locally.

## v1.1 — Foundation

v1.1 migrates CropLab from Vite to Next.js 16 App Router and separates the editor foundation without intentionally redesigning the product. The existing workflow remains the focus while image loading, validation, export calculations, history, keyboard shortcuts, theme handling, and UI pieces are isolated into reusable modules.

### Stack

- Next.js 16.x (App Router)
- React 19
- TypeScript
- react-easy-crop
- HTML Canvas API
- CSS
- Vitest
- Oxlint

### Privacy model

Normal image processing is performed in the browser. Image files are loaded through browser object URLs and exported through Canvas; no application backend is required for the editor workflow.

### Development

```bash
npm install
npm run dev
```

### Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

### Project structure

```text
src/
├── app/
├── components/
├── hooks/
├── lib/
│   └── image/
├── types/
├── App.tsx
├── App.css
└── index.css
```

### Scope

v1.1 is a foundation release. Visual redesign, advanced adjustments, compression workflows, presets, OCR, background removal, and batch processing are intentionally deferred to later versions.
