import { describe, expect, it } from 'vitest';
import { getRotatedImageBounds } from '@/lib/image/export';
import { scaleCropAreaToSource } from '@/lib/image/preview';

describe('v1.9 rotated export geometry', () => {
  it('keeps unrotated image bounds unchanged', () => {
    expect(getRotatedImageBounds(4000, 3000, 0)).toEqual({ width: 4000, height: 3000 });
    expect(getRotatedImageBounds(4000, 3000, 180).width).toBeCloseTo(4000, 8);
    expect(getRotatedImageBounds(4000, 3000, 180).height).toBeCloseTo(3000, 8);
  });

  it('swaps the bounding-box dimensions at 90-degree rotation', () => {
    const bounds = getRotatedImageBounds(4000, 3000, 90);
    expect(bounds.width).toBeCloseTo(3000, 8);
    expect(bounds.height).toBeCloseTo(4000, 8);
  });

  it('uses the full rotated bounding box for a full-image crop', () => {
    const bounds = getRotatedImageBounds(5376, 3584, 90);
    expect(Math.round(bounds.width)).toBe(3584);
    expect(Math.round(bounds.height)).toBe(5376);
  });

  it('preserves rotated crop coordinates when scaling a working preview back to source pixels', () => {
    const previewCrop = { x: 200, y: 300, width: 1600, height: 900 };
    expect(scaleCropAreaToSource(previewCrop, 2, 2)).toEqual({
      x: 400,
      y: 600,
      width: 3200,
      height: 1800,
    });
  });
});
