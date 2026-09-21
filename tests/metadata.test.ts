import { describe, expect, it } from 'vitest';
import { readImageMetadata } from '@/lib/image/metadata';

function jpegWithExif() {
  const bytes = new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe1, 0x00, 0x31,
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x02, 0x00,
    0x0f, 0x01, 0x02, 0x00, 0x05, 0x00, 0x00, 0x00, 0x26, 0x00, 0x00, 0x00,
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x53, 0x6f, 0x6e, 0x79, 0x00,
    0xff, 0xd9,
  ]);
  return new File([bytes], 'camera.jpg', { type: 'image/jpeg' });
}

function pngWithText() {
  const bytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x08, 0x74, 0x45, 0x58, 0x74, 0x41, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x00, 0x45, 0x78, 0x6f,
    0x00, 0x00, 0x00, 0x00,
  ]);
  return new File([bytes], 'note.png', { type: 'image/png' });
}

describe('phase 7 metadata', () => {
  it('detects and reads basic JPEG EXIF metadata', async () => {
    const metadata = await readImageMetadata(jpegWithExif(), 'jpeg');
    expect(metadata.hasMetadata).toBe(true);
    expect(metadata.kinds).toContain('EXIF');
    expect(metadata.cameraMake).toBe('Sony');
    expect(metadata.orientation).toBe(1);
  });

  it('detects PNG text metadata without inventing EXIF fields', async () => {
    const metadata = await readImageMetadata(pngWithText(), 'png');
    expect(metadata.hasMetadata).toBe(true);
    expect(metadata.kinds).toContain('Text');
    expect(metadata.cameraMake).toBeNull();
  });

  it('reports no metadata for a minimal GIF', async () => {
    const file = new File([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00])], 'plain.gif', { type: 'image/gif' });
    const metadata = await readImageMetadata(file, 'gif');
    expect(metadata.hasMetadata).toBe(false);
    expect(metadata.kinds).toEqual([]);
  });
});
