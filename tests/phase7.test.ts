import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'src');
function read(path: string) { return readFileSync(resolve(root, path), 'utf8'); }

describe('phase 7 metadata architecture', () => {
  it('keeps metadata parsing in the image layer and attaches it to loaded images', () => {
    const metadata = read('lib/image/metadata.ts');
    const loading = read('lib/image/loading.ts');
    const types = read('types/editor.ts');
    expect(metadata).toMatch(/readImageMetadata/);
    expect(metadata).toMatch(/EXIF/);
    expect(metadata).toMatch(/hasGps/);
    expect(loading).toMatch(/readImageMetadata/);
    expect(loading).toMatch(/metadata/);
    expect(types).toMatch(/ImageMetadata/);
  });

  it('keeps the export information cards in the requested order', () => {
    const panel = read('components/ExportPanel.tsx');
    const format = panel.indexOf('<h3>Format</h3>');
    const summary = panel.indexOf('What will be exported');
    const information = panel.indexOf('Image information');
    const policy = panel.indexOf('Metadata export policy');
    expect(format).toBeGreaterThan(-1);
    expect(summary).toBeGreaterThan(format);
    expect(information).toBeGreaterThan(summary);
    expect(policy).toBeGreaterThan(information);
  });

  it('makes the Canvas metadata policy explicit instead of claiming preservation', () => {
    const panel = read('components/ExportPanel.tsx');
    const exportEngine = read('lib/image/export.ts');
    expect(panel).toMatch(/Metadata export policy/);
    expect(panel).toMatch(/Remove source metadata/);
    expect(panel).toMatch(/EXIF, XMP, GPS, ICC/);
    expect(exportEngine).not.toMatch(/inject.*EXIF/i);
  });
});
