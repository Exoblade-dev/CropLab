import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('phase 8 accessibility foundation', () => {
  it('provides shared dialog focus management', () => {
    const source = read('src/hooks/use-dialog-a11y.ts');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain('previousFocusRef.current?.focus()');
    expect(source).toContain('event.key !== \'Tab\'');
  });

  it('makes freeform crop handles keyboard-operable', () => {
    const source = read('src/components/FreeformCropper.tsx');
    expect(source).toContain('handleKeyboardResize');
    expect(source).toContain('ArrowUp ArrowDown ArrowLeft ArrowRight');
    expect(source).toContain('onKeyDown={(event) => handleKeyboardResize(event, handle)}');
  });

  it('supports reduced motion and visible keyboard focus', () => {
    const css = read('src/App.css');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.image-thumbnail-select:focus-visible');
    expect(css).toContain('.freeform-crop-handle:focus-visible');
  });

  it('announces key editor range values and labels controls', () => {
    const toolbar = read('src/components/EditorToolbar.tsx');
    const adjustments = read('src/components/AdjustmentControls.tsx');
    expect(toolbar).toContain('aria-valuetext={`${Math.round(zoom * 100)} percent`}');
    expect(toolbar).toContain('aria-valuetext={`${Math.round(rotation)} degrees`}');
    expect(adjustments).toContain('aria-valuetext={`${display}${control.unit}`}');
  });
});
