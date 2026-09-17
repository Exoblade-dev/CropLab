import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8');
const appTsx = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const sidebarTsx = readFileSync(new URL('../src/components/EditorSidebar.tsx', import.meta.url), 'utf8');
const exportPanelTsx = readFileSync(new URL('../src/components/ExportPanel.tsx', import.meta.url), 'utf8');
const mobileTsx = readFileSync(new URL('../src/components/MobileEditorControls.tsx', import.meta.url), 'utf8');

describe('v2 edit workspace layout', () => {
  it('uses a two-column editor workspace and keeps export out of the permanent grid', () => {
    expect(appCss).toMatch(
      /\.workspace-grid\s*\{[^}]*grid-template-columns:\s*minmax\(330px,\s*360px\)\s+minmax\(0,\s*1fr\);/s,
    );
    expect(appCss).not.toMatch(/grid-template-columns:[^;]*285px/);
    expect(appTsx).not.toMatch(/right-workspace-column/);
    expect(appTsx).toMatch(/<EditorSidebar[\s\S]*<section className="canvas-workspace"/);
  });

  it('splits the edit sidebar into a tool rail and contextual inspector', () => {
    expect(sidebarTsx).toMatch(/className="edit-panel"/);
    expect(sidebarTsx).toMatch(/className="edit-rail"/);
    expect(sidebarTsx).toMatch(/className="edit-rail-tools"/);
    expect(sidebarTsx).toMatch(/className="edit-inspector"/);
    expect(sidebarTsx).toMatch(/activeTools[\s\S]*Crop[\s\S]*Resize/);
    expect(sidebarTsx).toMatch(/futureTools[\s\S]*Batch[\s\S]*Enhance[\s\S]*More/);
    expect(appCss).toMatch(
      /\.edit-panel\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*78px\s+minmax\(0,\s*1fr\);/s,
    );
    expect(appCss).toMatch(/\.edit-inspector\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto\s+auto;/s);
  });

  it('keeps contextual controls scrollable while reserving a dedicated live preview region', () => {
    expect(sidebarTsx).toMatch(/className="inspector-scroll"/);
    expect(sidebarTsx).toMatch(/className="preview-region"/);
    expect(sidebarTsx).toMatch(/aria-label="Live export preview"/);
    expect(appCss).toMatch(/\.inspector-scroll\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*auto;/s);
    expect(appCss).toMatch(/\.preview-region\s*\{[^}]*border-top:\s*1px solid var\(--border\);/s);
    expect(appCss).toMatch(/\.tool-preview-stage\s*\{[^}]*height:\s*112px;/s);
    expect(appCss).toMatch(/@media\s*\(max-height:\s*760px\)\s*and\s*\(min-width:\s*901px\)/s);
    expect(appCss).toMatch(/\.tool-preview-stage\s*\{\s*height:\s*88px;/s);
  });

  it('opens export on demand as a right-side drawer instead of reserving workspace space', () => {
    expect(appTsx).toMatch(/const \[isExportOpen, setIsExportOpen\] = useState\(false\)/);
    expect(appTsx).toMatch(/<ExportPanel[\s\S]*open=\{isExportOpen\}/);
    expect(appTsx).toMatch(/className="canvas-export-button"/);
    expect(appTsx).toMatch(/setIsExportOpen\(true\)/);
    expect(exportPanelTsx).toMatch(/className="export-overlay"/);
    expect(exportPanelTsx).toMatch(/className="export-drawer"/);
    expect(exportPanelTsx).toMatch(/role="dialog"/);
    expect(exportPanelTsx).toMatch(/className="export-drawer-body"/);
    expect(exportPanelTsx).toMatch(/className="primary-export-button"/);
    expect(appCss).toMatch(/\.export-overlay\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;/s);
    expect(appCss).toMatch(/\.export-drawer\s*\{[^}]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto;/s);
    expect(appCss).not.toMatch(/\.export-dialog-backdrop\s*\{/);
  });

  it('keeps mobile export on-demand through the shared export action', () => {
    expect(mobileTsx).toMatch(/onExport: \(\) => void/);
    expect(mobileTsx).toMatch(/onClick=\{onExport\}/);
    expect(mobileTsx).toMatch(/<span>Export<\/span>/);
    expect(mobileTsx).not.toMatch(/type Panel = EditorTool \| 'export'/);
    expect(appCss).toMatch(/\.mobile-bottom-bar\s*\{[^}]*grid-template-columns:\s*repeat\(4,1fr\);/s);
  });

  it('preserves constrained-height and responsive workspace behavior', () => {
    expect(appCss).toMatch(/\.workspace-shell\s*\{[^}]*height:\s*calc\(100dvh - 104px\);[^}]*min-height:\s*560px;/s);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*1100px\)\s+and\s+\(min-width:\s*901px\)/);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*900px\)/);
    expect(appCss).toMatch(/\.workspace-grid\s*\{\s*display:\s*block;\s*height:\s*auto;/s);
    expect(appCss).toMatch(/\.edit-panel\s*\{\s*display:\s*none;/s);
  });
});
