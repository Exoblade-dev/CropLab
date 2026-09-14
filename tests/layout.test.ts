import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8');

describe('desktop sidebar layout resilience', () => {
  it('keeps the desktop workspace shrinkable instead of enforcing a rigid minimum height', () => {
    expect(appCss).toMatch(/\.workspace-shell\s*\{[^}]*min-height:\s*0;/s);
    expect(appCss).not.toMatch(/\.workspace-shell\s*\{[^}]*min-height:\s*620px;/s);
  });

  it('contains the sidebar and gives overflow ownership to the workflow region', () => {
    expect(appCss).toMatch(/\.tools-panel\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;/s);
    expect(appCss).toMatch(/\.tool-detail\s*\{[^}]*flex:\s*0 0 auto;[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;/s);
    expect(appCss).toMatch(/\.tool-workflow\s*\{[^}]*flex:\s*1 1 0;[^}]*min-height:\s*0;[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;/s);
  });

  it('makes the live preview responsive at constrained desktop heights', () => {
    expect(appCss).toMatch(/\.tool-preview-stage\s*\{[^}]*height:\s*clamp\(64px,\s*12vh,\s*96px\);/s);
    expect(appCss).toMatch(/@media\s*\(max-height:\s*760px\)\s*and\s*\(min-width:\s*901px\)/s);
  });
});
