import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'src');
const appTsx = readFileSync(resolve(root, 'App.tsx'), 'utf8');
const hookTs = readFileSync(resolve(root, 'hooks/use-croplab-editor.ts'), 'utf8');
const workspaceTsx = readFileSync(resolve(root, 'components/EditorWorkspace.tsx'), 'utf8');

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

  it('keeps the canvas workspace presentation outside App', () => {
    expect(workspaceTsx).toMatch(/EditorSidebar/);
    expect(workspaceTsx).toMatch(/EditorToolbar/);
    expect(workspaceTsx).toMatch(/FreeformCropper/);
    expect(workspaceTsx).toMatch(/MobileEditorControls/);
    expect(workspaceTsx).toMatch(/handleFit/);
  });
});
