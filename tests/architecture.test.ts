import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'src');
const appTsx = readFileSync(resolve(root, 'App.tsx'), 'utf8');
const hookTs = readFileSync(resolve(root, 'hooks/use-croplab-editor.ts'), 'utf8');
const workspaceTsx = readFileSync(resolve(root, 'components/EditorWorkspace.tsx'), 'utf8');
const adjustmentTsx = readFileSync(resolve(root, 'components/AdjustmentControls.tsx'), 'utf8');
const adjustmentLibTs = readFileSync(resolve(root, 'lib/image/adjustments.ts'), 'utf8');
const uploadTsx = readFileSync(resolve(root, 'components/UploadScreen.tsx'), 'utf8');
const inputTs = readFileSync(resolve(root, 'lib/image/input.ts'), 'utf8');

describe('editor architecture', () => {
  it('keeps App as an orchestration layer', () => {
    expect(appTsx).toMatch(/useCropLabEditor/);
    expect(appTsx).toMatch(/EditorWorkspace/);
    expect(appTsx).not.toMatch(/useState\(/);
    expect(appTsx).not.toMatch(/useEditorHistory/);
    expect(appTsx).not.toMatch(/useExportPreview/);
    expect(appTsx).not.toMatch(/createExportCanvas/);
  });

  it('keeps editor state and image/export actions inside the editor hook', () => {
    expect(hookTs).toMatch(/useEditorHistory/);
    expect(hookTs).toMatch(/useExportPreview/);
    expect(hookTs).toMatch(/useImageLoader/);
    expect(hookTs).toMatch(/handleDownload/);
  });

  it('keeps image input normalized before the editor load boundary', () => {
    expect(hookTs).toMatch(/useImageInput/);
    expect(hookTs).toMatch(/submitImageInput/);
    expect(uploadTsx).toMatch(/multiple/);
    expect(inputTs).toMatch(/normalizeImageInput/);
    expect(inputTs).toMatch(/validateImageFile/);
    expect(inputTs).toMatch(/picker.*drop.*clipboard|picker.*clipboard/);
  });

  it('keeps deterministic image adjustments in the editor pipeline', () => {
    expect(hookTs).toMatch(/adjustments/);
    expect(hookTs).toMatch(/handleAdjustmentChange/);
    expect(workspaceTsx).toMatch(/AdjustmentControls|adjustments/);
    expect(adjustmentTsx).toMatch(/Brightness/);
    expect(adjustmentTsx).toMatch(/Sharpen/);
    expect(adjustmentTsx).toMatch(/Blur/);
    expect(adjustmentLibTs).toMatch(/applyAdjustments/);
    expect(adjustmentLibTs).not.toMatch(/fetch\(|XMLHttpRequest|Image\.src\s*=\s*['"]https?:/);
  });

  it('keeps the canvas workspace presentation outside App', () => {
    expect(workspaceTsx).toMatch(/EditorSidebar/);
    expect(workspaceTsx).toMatch(/EditorToolbar/);
    expect(workspaceTsx).toMatch(/FreeformCropper/);
    expect(workspaceTsx).toMatch(/MobileEditorControls/);
    expect(workspaceTsx).toMatch(/handleFit/);
  });
});
