import { describe, expect, it } from 'vitest';
import type { Area } from 'react-easy-crop';
import { getInteractivePreviewSettings, MAX_INTERACTIVE_PREVIEW_DIMENSION } from '@/lib/image/export';
import type { ExportSettings } from '@/types/editor';

const crop: Area = { x: 0, y: 0, width: 6000, height: 4000 };
const settings: ExportSettings = {
  format: 'png',
  quality: 0.9,
  width: null,
  height: null,
  lockAspectRatio: true,
  backgroundColor: '#ffffff',
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    sharpen: 100,
    blur: 0,
  },
};

describe('interactive adjustment preview performance', () => {
  it('caps large preview canvases without changing the requested aspect ratio', () => {
    const preview = getInteractivePreviewSettings(crop, settings);

    expect(Math.max(preview.width ?? 0, preview.height ?? 0)).toBe(MAX_INTERACTIVE_PREVIEW_DIMENSION);
    expect(preview.width).toBe(1280);
    expect(preview.height).toBe(853);
  });

  it('keeps small outputs at their requested dimensions', () => {
    const smallCrop: Area = { x: 0, y: 0, width: 1000, height: 700 };
    const preview = getInteractivePreviewSettings(smallCrop, settings);

    expect(preview.width).toBeNull();
    expect(preview.height).toBeNull();
  });

  it('preserves adjustment settings for the preview pipeline', () => {
    const preview = getInteractivePreviewSettings(crop, settings);

    expect(preview.adjustments.sharpen).toBe(100);
    expect(preview.format).toBe('png');
    expect(preview.quality).toBe(0.9);
  });
});
