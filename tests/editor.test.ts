import { describe, expect, it } from 'vitest';
import { clampZoom, deriveDimension, normalizeRotation, rotateBy } from '@/lib/editor/interaction';
import { getCropperTransform } from '@/lib/image/transform';
import type { CropState } from '@/types/editor';

describe('editing interaction helpers', () => {
  it('clamps zoom to the v1.4 interaction range', () => {
    expect(clampZoom(0.1)).toBe(0.2);
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(3)).toBe(2);
  });

  it('normalizes rotation to the -180..180 range', () => {
    expect(normalizeRotation(180)).toBe(180);
    expect(normalizeRotation(270)).toBe(-90);
    expect(normalizeRotation(-270)).toBe(90);
    expect(rotateBy(170, 20)).toBe(-170);
  });

  it('derives the linked resize dimension from the crop ratio', () => {
    expect(deriveDimension(1920, 1920, 1080, 'width')).toBe(1080);
    expect(deriveDimension(1080, 1920, 1080, 'height')).toBe(1920);
  });
});

describe('cropper transform regression', () => {
  const base: CropState = {
    crop: { x: 12, y: -8 },
    zoom: 1.25,
    transform: { rotation: -90, flipX: false, flipY: false },
  };

  it('keeps the complete transform without flips', () => {
    expect(getCropperTransform(base)).toBe('translate(12px, -8px) rotateZ(-90deg) rotateY(0deg) rotateX(0deg) scale(1.25)');
  });

  it('preserves crop, rotation and zoom when horizontal flip is enabled', () => {
    expect(getCropperTransform({ ...base, transform: { ...base.transform, flipX: true } })).toBe('translate(12px, -8px) rotateZ(-90deg) rotateY(180deg) rotateX(0deg) scale(1.25)');
  });

  it('preserves crop, rotation and zoom when both flips are enabled', () => {
    expect(getCropperTransform({ ...base, transform: { ...base.transform, flipX: true, flipY: true } })).toBe('translate(12px, -8px) rotateZ(-90deg) rotateY(180deg) rotateX(180deg) scale(1.25)');
  });
});
