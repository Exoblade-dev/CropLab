import { describe, expect, it } from 'vitest';
import { ADJUSTMENT_LIMITS, DEFAULT_ADJUSTMENTS, getAdjustmentCssFilter, normalizeAdjustments } from '@/lib/image/adjustments';

describe('v3 adjustment state', () => {
  it('starts neutral so existing exports remain unchanged', () => {
    expect(DEFAULT_ADJUSTMENTS).toEqual({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      sharpen: 0,
      blur: 0,
    });
  });

  it('clamps every adjustment to its supported range', () => {
    expect(normalizeAdjustments({ brightness: -500, contrast: 500, saturation: -500, exposure: 500, sharpen: -20, blur: 100 })).toEqual({
      brightness: -100,
      contrast: 100,
      saturation: -100,
      exposure: 100,
      sharpen: 0,
      blur: 20,
    });
  });

  it('generates a browser-local preview filter for viewport adjustments', () => {
    expect(getAdjustmentCssFilter({ ...DEFAULT_ADJUSTMENTS, brightness: 20, contrast: -10, saturation: 15, exposure: 10, blur: 2, sharpen: 60 })).toContain('brightness(');
    expect(getAdjustmentCssFilter(DEFAULT_ADJUSTMENTS)).toBe('none');
  });

  it('keeps the documented ranges explicit', () => {
    expect(ADJUSTMENT_LIMITS).toEqual({
      brightness: { min: -100, max: 100 },
      contrast: { min: -100, max: 100 },
      saturation: { min: -100, max: 100 },
      exposure: { min: -100, max: 100 },
      sharpen: { min: 0, max: 100 },
      blur: { min: 0, max: 20 },
    });
  });
});
