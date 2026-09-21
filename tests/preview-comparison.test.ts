import { describe, expect, it } from 'vitest';
import { getBeforeExportSettings, hasActiveAdjustments } from '@/lib/image/preview-comparison';
import type { ExportSettings } from '@/types/editor';

const settings: ExportSettings = {
  format: 'jpeg',
  quality: 0.85,
  width: 1600,
  height: 900,
  lockAspectRatio: true,
  backgroundColor: '#ffffff',
  adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, sharpen: 0, blur: 0 },
};

describe('preview before/after comparison', () => {
  it('detects whether the current export contains adjustments', () => {
    expect(hasActiveAdjustments(settings)).toBe(false);
    expect(hasActiveAdjustments({ ...settings, adjustments: { ...settings.adjustments, contrast: 25 } })).toBe(true);
    expect(hasActiveAdjustments({ ...settings, adjustments: { ...settings.adjustments, sharpen: 40 } })).toBe(true);
  });

  it('creates a before state without changing export geometry or format settings', () => {
    const before = getBeforeExportSettings({ ...settings, adjustments: { ...settings.adjustments, brightness: 35, sharpen: 80 } });
    expect(before).toEqual({ ...settings, adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, sharpen: 0, blur: 0 } });
    expect(before.format).toBe(settings.format);
    expect(before.width).toBe(settings.width);
    expect(before.height).toBe(settings.height);
    expect(before.backgroundColor).toBe(settings.backgroundColor);
  });
});
