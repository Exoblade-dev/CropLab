import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createZipBlob } from '@/lib/image/zip';

const root = resolve(process.cwd(), 'src');

function read(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('phase 6 image collection', () => {
  it('keeps collection state separate from the editor hook', () => {
    const collection = read('hooks/use-image-collection.ts');
    const hook = read('hooks/use-croplab-editor.ts');

    expect(collection).toMatch(/ImageCollectionItem/);
    expect(collection).toMatch(/thumbnailUrl/);
    expect(collection).toMatch(/history/);
    expect(hook).toMatch(/useImageCollection/);
    expect(hook).toMatch(/switchImage/);
    expect(hook).toMatch(/handleBatchExport/);
    expect(hook).toMatch(/removeCollectionImage/);
  });

  it('keeps the thumbnail rail outside the canvas implementation', () => {
    const workspace = read('components/EditorWorkspace.tsx');
    const rail = read('components/ImageThumbnailRail.tsx');

    expect(workspace).toMatch(/ImageThumbnailRail/);
    expect(rail).toMatch(/Add images/);
    expect(rail).toMatch(/Export ZIP/);
    expect(rail).toMatch(/onSelect/);
    expect(rail).toMatch(/onRemove/);
    expect(rail).toMatch(/image-thumbnail-remove/);
  });

  it('creates a valid stored ZIP with multiple entries', async () => {
    const blob = createZipBlob([
      { name: 'first.png', data: new Uint8Array([1, 2, 3]) },
      { name: 'second.webp', data: new Uint8Array([4, 5, 6, 7]) },
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const signature = (offset: number) => new DataView(bytes.buffer).getUint32(offset, true);

    expect(blob.type).toBe('application/zip');
    expect(signature(0)).toBe(0x04034b50);
    expect(Array.from(bytes).filter((_, index) => index + 3 < bytes.length && signature(index) === 0x02014b50).length).toBe(2);
    expect(signature(bytes.length - 22)).toBe(0x06054b50);
  });
});
