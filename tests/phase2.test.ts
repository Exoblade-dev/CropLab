import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calculateFitZoom, snapRotation } from '@/lib/editor/interaction';

const constantsTs = readFileSync(new URL('../src/lib/image/constants.ts', import.meta.url), 'utf8');
const iconTs = readFileSync(new URL('../src/components/AspectRatioIcon.tsx', import.meta.url), 'utf8');
const sidebarTsx = readFileSync(new URL('../src/components/EditorSidebar.tsx', import.meta.url), 'utf8');
const toolbarTsx = readFileSync(new URL('../src/components/EditorToolbar.tsx', import.meta.url), 'utf8');
const exportPanelTsx = readFileSync(new URL('../src/components/ExportPanel.tsx', import.meta.url), 'utf8');

describe('phase 2 editor UX', () => {
  it('keeps the focused aspect ratio set', () => {
    expect(constantsTs).toMatch(/Free/);
    expect(constantsTs).toMatch(/1:1/);
    expect(constantsTs).toMatch(/4:3/);
    expect(constantsTs).toMatch(/3:4/);
    expect(constantsTs).toMatch(/16:9/);
    expect(constantsTs).toMatch(/9:16/);
    expect(constantsTs).not.toMatch(/3:2|2:3/);
    expect(iconTs).not.toMatch(/'3:2'|'2:3'/);
  });

  it('makes resize semantics explicit and removes construction-site editor tools', () => {
    expect(sidebarTsx).toMatch(/Resize changes the exported image dimensions/);
    expect(sidebarTsx).toMatch(/Zoom only changes how you view the canvas/);
    expect(sidebarTsx).not.toMatch(/Coming soon|futureTools|More tools/);
  });

  it('supports a dedicated fit action and snapped manual rotation', () => {
    expect(toolbarTsx).toMatch(/onFit/);
    expect(toolbarTsx).toMatch(/Fit image in canvas/);
    expect(snapRotation(0.8)).toBe(0);
    expect(snapRotation(89.2)).toBe(90);
    expect(snapRotation(-89.2)).toBe(-90);
    expect(snapRotation(179.4)).toBe(180);
    expect(snapRotation(37)).toBe(37);
  });

  it('calculates fit as contain-over-cover rather than using an arbitrary percentage', () => {
    expect(calculateFitZoom(4000, 3000, 1000, 700, 4 / 3, 0)).toBeCloseTo(1, 3);
    expect(calculateFitZoom(4000, 3000, 1000, 700, 16 / 9, 90)).toBeCloseTo(0.421875, 3);
  });

  it('uses an actual native color picker for custom JPEG backgrounds', () => {
    expect(exportPanelTsx).toMatch(/type="color"/);
    expect(exportPanelTsx).toMatch(/openCustomColorPicker/);
    expect(exportPanelTsx).toMatch(/customColorRef\.current\?\.click\(\)/);
  });
});
