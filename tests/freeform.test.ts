import { describe, expect, it } from 'vitest';
import {
  clampFreeformCropRect,
  freeformCropRectToArea,
  getFreeformGeometry,
  getInitialFreeformCropRect,
  resizeFreeformCropRect,
} from '@/lib/editor/freeform';

describe('freeform crop geometry', () => {
  it('fits the rotated preview into the crop stage', () => {
    const geometry = getFreeformGeometry(1000, 800, 2000, 1600, 1, 0);
    expect(geometry.imageBounds).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    });
    expect(geometry.displayScale).toBeCloseTo(0.5, 8);
  });

  it('accounts for rotation when calculating the displayed image bounds', () => {
    const geometry = getFreeformGeometry(1000, 800, 2000, 1600, 1, 90);
    expect(geometry.imageBounds.width).toBeCloseTo(640, 8);
    expect(geometry.imageBounds.height).toBeCloseTo(800, 8);
    expect(geometry.displayScale).toBeCloseTo(0.4, 8);
  });

  it('starts with a centered 1000px square when the image can contain it', () => {
    const geometry = getFreeformGeometry(1200, 900, 2400, 1800, 1, 0);
    const rect = getInitialFreeformCropRect(geometry, 1, 1);

    expect(rect.width).toBeCloseTo(500, 8);
    expect(rect.height).toBeCloseTo(500, 8);
    expect(rect.x).toBeCloseTo(350, 8);
    expect(rect.y).toBeCloseTo(200, 8);
  });

  it('clamps the initial square when the working image is smaller than 1000px', () => {
    const geometry = getFreeformGeometry(800, 800, 600, 600, 1, 0);
    const rect = getInitialFreeformCropRect(geometry, 1, 1);

    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 800,
    });
  });

  it('keeps the crop rectangle inside the rotated image bounds', () => {
    const bounds = { x: 100, y: 50, width: 600, height: 400 };
    expect(clampFreeformCropRect(
      { x: 0, y: 0, width: 900, height: 700 },
      bounds,
      10,
    )).toEqual(bounds);
  });

  it('resizes corners while preserving the opposite anchor', () => {
    const start = { x: 100, y: 100, width: 300, height: 200 };
    const bounds = { x: 0, y: 0, width: 600, height: 500 };

    expect(resizeFreeformCropRect(start, 'nw', -50, -25, bounds, 20, 20)).toEqual({
      x: 50,
      y: 75,
      width: 350,
      height: 225,
    });

    expect(resizeFreeformCropRect(start, 'se', 50, 25, bounds, 20, 20)).toEqual({
      x: 100,
      y: 100,
      width: 350,
      height: 225,
    });
  });

  it('resizes edge handles on only one axis', () => {
    const start = { x: 100, y: 100, width: 300, height: 200 };
    const bounds = { x: 0, y: 0, width: 600, height: 500 };

    expect(resizeFreeformCropRect(start, 'e', 100, 75, bounds, 20, 20)).toEqual({
      x: 100,
      y: 100,
      width: 400,
      height: 200,
    });

    expect(resizeFreeformCropRect(start, 'n', 100, -50, bounds, 20, 20)).toEqual({
      x: 100,
      y: 50,
      width: 300,
      height: 250,
    });
  });

  it('enforces the minimum size and image boundary during resize', () => {
    const start = { x: 100, y: 100, width: 100, height: 100 };
    const bounds = { x: 0, y: 0, width: 300, height: 300 };

    expect(resizeFreeformCropRect(start, 'nw', 500, 500, bounds, 20, 20)).toEqual({
      x: 180,
      y: 180,
      width: 20,
      height: 20,
    });

    expect(resizeFreeformCropRect(start, 'se', 500, 500, bounds, 20, 20)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 200,
    });
  });

  it('maps a screen crop rectangle into source pixels using preview scaling', () => {
    const geometry = getFreeformGeometry(1000, 800, 2000, 1600, 1, 0);
    const area = freeformCropRectToArea(
      { x: 250, y: 200, width: 500, height: 400 },
      geometry,
      2,
      2,
    );

    expect(area).toEqual({
      x: 1000,
      y: 800,
      width: 2000,
      height: 1600,
    });
  });

  it('maps freeform crop coordinates against the rotated bounding box', () => {
    const geometry = getFreeformGeometry(1000, 800, 2000, 1600, 1, 90);
    const area = freeformCropRectToArea(
      geometry.imageBounds,
      geometry,
      2,
      2,
    );

    expect(area.x).toBe(0);
    expect(area.y).toBe(0);
    expect(area.width).toBe(3200);
    expect(area.height).toBe(4000);
  });
});
