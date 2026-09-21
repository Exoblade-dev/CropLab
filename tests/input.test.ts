import { describe, expect, it } from 'vitest';
import { normalizeImageInput } from '@/lib/image/input';

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function imageFile(name: string, type = 'image/png') {
  return new File([pngBytes], name, { type });
}

describe('phase 5 image input normalization', () => {
  it('preserves valid file order and records the input source', async () => {
    const first = imageFile('first.png');
    const second = imageFile('second.png');

    const normalized = await normalizeImageInput([first, second], 'drop');

    expect(normalized.result).toEqual({ files: [first, second], source: 'drop' });
    expect(normalized.rejected).toEqual([]);
  });

  it('validates every file instead of silently accepting unsupported files', async () => {
    const valid = imageFile('valid.png');
    const invalid = new File([new Uint8Array([0, 1, 2, 3])], 'notes.txt', { type: 'text/plain' });

    const normalized = await normalizeImageInput([valid, invalid], 'picker');

    expect(normalized.result?.files).toEqual([valid]);
    expect(normalized.result?.source).toBe('picker');
    expect(normalized.rejected).toHaveLength(1);
    expect(normalized.rejected[0].file).toBe(invalid);
    expect(normalized.rejected[0].message).toContain('Unsupported or invalid image format');
  });

  it('returns no accepted result when every file is rejected', async () => {
    const invalid = new File([new Uint8Array([1, 2, 3])], 'bad.bin', { type: 'application/octet-stream' });

    const normalized = await normalizeImageInput([invalid], 'clipboard');

    expect(normalized.result).toBeNull();
    expect(normalized.rejected).toHaveLength(1);
  });

  it('keeps clipboard inputs ordered when multiple image items are present', async () => {
    const first = imageFile('clipboard-1.png');
    const second = imageFile('clipboard-2.png');

    const normalized = await normalizeImageInput([first, second], 'clipboard');

    expect(normalized.result?.files.map((file) => file.name)).toEqual(['clipboard-1.png', 'clipboard-2.png']);
    expect(normalized.result?.source).toBe('clipboard');
  });
});
