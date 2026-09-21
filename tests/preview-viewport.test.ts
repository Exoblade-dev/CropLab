import { describe, expect, it } from 'vitest';
import {
  clampPreviewPan,
  getNextPreviewZoom,
  getPreviewFitScale,
  getPreviewScale,
} from '@/lib/image/preview-viewport';

describe('interactive preview viewport', () => {
  it('fits the complete image inside the viewport without changing its aspect ratio', () => {
    expect(getPreviewFitScale(800, 600, 1000, 500)).toBeCloseTo(0.8, 8);
    expect(getPreviewFitScale(800, 600, 500, 1000)).toBeCloseTo(0.6, 8);
  });

  it('keeps preset zooms independent from Fit', () => {
    expect(getPreviewScale('fit', 0.25)).toBeCloseTo(0.25, 8);
    expect(getPreviewScale(50, 0.25)).toBe(0.5);
    expect(getPreviewScale(100, 0.25)).toBe(1);
    expect(getPreviewScale(400, 0.25)).toBe(4);
  });

  it('moves through Fit and the supported zoom presets', () => {
    expect(getNextPreviewZoom('fit', 'in')).toBe(50);
    expect(getNextPreviewZoom(50, 'in')).toBe(100);
    expect(getNextPreviewZoom(100, 'in')).toBe(200);
    expect(getNextPreviewZoom(400, 'in')).toBe(400);
    expect(getNextPreviewZoom(50, 'out')).toBe('fit');
    expect(getNextPreviewZoom('fit', 'out')).toBe('fit');
  });

  it('clamps panning so empty space cannot be dragged inside the viewport', () => {
    expect(clampPreviewPan(900, -900, 800, 600, 1200, 1000, 1)).toEqual({ x: 200, y: -200 });
    expect(clampPreviewPan(100, 100, 800, 600, 400, 300, 1)).toEqual({ x: 0, y: 0 });
  });
});
