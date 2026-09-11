import { describe, expect, it } from 'vitest';
import { getPreviewDimensions, scaleCropAreaToSource } from '@/lib/image/preview';

describe('image preview scaling', () => {
  it('keeps small images at their original resolution', () => {
    expect(getPreviewDimensions(1920, 1080)).toEqual({
      width: 1920,
      height: 1080,
      scaleX: 1,
      scaleY: 1,
    });
  });

  it('caps a large image at 4096px on its longest side', () => {
    const result = getPreviewDimensions(8064, 6048);

    expect(result.width).toBe(4096);
    expect(result.height).toBe(3072);
    expect(result.scaleX).toBeCloseTo(8064 / 4096);
    expect(result.scaleY).toBeCloseTo(6048 / 3072);
  });

  it('maps crop coordinates from preview pixels back to source pixels', () => {
    const result = scaleCropAreaToSource(
      { x: 512, y: 384, width: 2048, height: 1536 },
      8064 / 4096,
      6048 / 3072,
    );

    expect(result).toEqual({
      x: 1008,
      y: 756,
      width: 4032,
      height: 3024,
    });
  });
});
