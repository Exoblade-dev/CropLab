const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function patch(file, replacements) {
  const full = path.join(root, file);
  let source = fs.readFileSync(full, 'utf8');

  for (const [before, after] of replacements) {
    if (!source.includes(before)) {
      throw new Error(`Patch anchor not found in ${file}:\n${before}`);
    }
    const occurrences = source.split(before).length - 1;
    if (occurrences !== 1) {
      throw new Error(`Patch anchor in ${file} matched ${occurrences} times; refusing ambiguous edit.`);
    }
    source = source.replace(before, after);
  }

  fs.writeFileSync(full, source);
  console.log(`Patched ${file}`);
}

patch('src/lib/image/export.ts', [
  [
    `import { applyAdjustments } from '@/lib/image/adjustments';\n\n`,
    `import { applyAdjustments } from '@/lib/image/adjustments';\n\nexport const MAX_INTERACTIVE_PREVIEW_DIMENSION = 1280;\n\n`,
  ],
  [
    `export function getMimeType(format: ImageFormat): string {`,
    `export function getInteractivePreviewSettings(crop: Area, settings: ExportSettings): ExportSettings {\n  const output = getOutputDimensions(crop, settings);\n  const largestDimension = Math.max(output.width, output.height);\n\n  if (largestDimension <= MAX_INTERACTIVE_PREVIEW_DIMENSION) {\n    return settings;\n  }\n\n  const scale = MAX_INTERACTIVE_PREVIEW_DIMENSION / largestDimension;\n  return {\n    ...settings,\n    width: Math.max(1, Math.round(output.width * scale)),\n    height: Math.max(1, Math.round(output.height * scale)),\n  };\n}\n\nexport function getMimeType(format: ImageFormat): string {`,
  ],
]);

patch('src/hooks/use-export-preview.ts', [
  [
    `import { createExportCanvas, encodeCanvas } from '@/lib/image/export';`,
    `import { createExportCanvas, encodeCanvas, getInteractivePreviewSettings } from '@/lib/image/export';`,
  ],
  [
    `        setPreview((current) => ({ ...current, status: 'resizing', error: null }));\n        const canvas = createExportCanvas(image, crop, transform, settings);`,
    `        setPreview((current) => ({ ...current, status: 'resizing', error: null }));\n        // Interactive preview must never run the full-resolution export pipeline.\n        // In particular, sharpen is a per-pixel convolution and can otherwise\n        // block the main thread for large source/output images.\n        const previewSettings = getInteractivePreviewSettings(crop, settings);\n        const canvas = createExportCanvas(image, crop, transform, previewSettings);`,
  ],
  [
    `        const encodePromise = encodeCanvas(canvas, settings);`,
    `        const encodePromise = encodeCanvas(canvas, previewSettings);`,
  ],
]);

console.log('Performance patch applied.');
console.log('Run: npm.cmd run typecheck && npm.cmd run lint && npm.cmd run test && npm.cmd run build');
