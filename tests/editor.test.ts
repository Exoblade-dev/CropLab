import { describe, expect, it } from 'vitest';
import { clampZoom, deriveDimension, normalizeRotation, rotateBy } from '@/lib/editor/interaction';
import { getFileExtension, getMimeType, getOutputDimensions, getSizeReductionPercent } from '@/lib/image/export';
import { getFormatDefinition } from '@/lib/image/formats';
import { detectImageFormat, validateCanvasDimensions, validateImageDimensions, validateImageFile } from '@/lib/image/validation';
import { getCropperTransform } from '@/lib/image/transform';
import type { CropState, ExportSettings } from '@/types/editor';

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

describe('v1.5 export engine', () => {
  const settings: ExportSettings = {
    format: 'jpeg',
    quality: 0.5,
    width: null,
    height: null,
    lockAspectRatio: true,
    backgroundColor: '#ffffff',
  };

  it('keeps format metadata honest and extensible', () => {
    expect(getFormatDefinition('png').supportsQuality).toBe(false);
    expect(getFormatDefinition('jpeg').supportsQuality).toBe(true);
    expect(getFormatDefinition('jpeg').supportsTransparency).toBe(false);
    expect(getFormatDefinition('webp').supportsQuality).toBe(true);
    expect(getMimeType('webp')).toBe('image/webp');
    expect(getFileExtension('jpeg')).toBe('jpg');
  });

  it('derives output dimensions from the crop and export settings', () => {
    expect(getOutputDimensions({ x: 0, y: 0, width: 1920, height: 1080 }, settings)).toEqual({ width: 1920, height: 1080 });
    expect(getOutputDimensions({ x: 0, y: 0, width: 1920, height: 1080 }, { ...settings, width: 1280 })).toEqual({ width: 1280, height: 720 });
    expect(getOutputDimensions({ x: 0, y: 0, width: 1920, height: 1080 }, { ...settings, height: 720 })).toEqual({ width: 1280, height: 720 });
  });

  it('calculates real size reduction instead of treating quality as file-size percentage', () => {
    expect(getSizeReductionPercent(3_800_000, 842_000)).toBe(78);
    expect(getSizeReductionPercent(100_000, 120_000)).toBe(-20);
    expect(getSizeReductionPercent(100_000, 100_000)).toBe(0);
  });
});

describe('v1.6 image handling', () => {
  it('detects supported image signatures', () => {
    expect(detectImageFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(detectImageFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectImageFormat(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('gif');
    expect(detectImageFormat(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe('webp');
    expect(detectImageFormat(new Uint8Array([0, 1, 2, 3]))).toBeNull();
  });

  it('accepts the v1.9 50 MP safety ceiling and rejects larger images', () => {
    expect(validateImageDimensions(8064, 6048)).toEqual({ valid: true });
    expect(validateImageDimensions(8192, 6104)).toEqual({ valid: false, message: expect.stringContaining('pixels') });
    expect(validateImageDimensions(8193, 100)).toEqual({ valid: false, message: expect.stringContaining('8192') });
    expect(validateImageDimensions(0, 100)).toEqual({ valid: false, message: 'Image has invalid dimensions' });
    expect(validateCanvasDimensions(8192, 4096)).toEqual({ valid: true });
    expect(validateCanvasDimensions(9000, 1000)).toEqual({ valid: false, message: expect.stringContaining('8192') });
  });

  it('validates file signatures and MIME types before decoding', async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'test.png', { type: 'image/png' });
    const spoofed = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'test.jpg', { type: 'image/jpeg' });
    const unsupported = new File([new Uint8Array([0, 1, 2, 3])], 'test.bmp', { type: 'image/bmp' });

    expect((await validateImageFile(png)).valid).toBe(true);
    expect(await validateImageFile(spoofed)).toEqual({ valid: false, message: 'The file type does not match the image data.' });
    expect((await validateImageFile(unsupported)).valid).toBe(false);
  });
});

describe('v1.7 keyboard interaction system', () => {
  it('maps editor shortcuts without requiring UI handlers to know key details', async () => {
    const { getEditorShortcut } = await import('@/lib/editor/shortcuts');
    const event = (key: string, modifiers: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }> = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...modifiers });

    expect(getEditorShortcut(event('z', { ctrlKey: true }), false)).toBe('undo');
    expect(getEditorShortcut(event('z', { metaKey: true, shiftKey: true }), false)).toBe('redo');
    expect(getEditorShortcut(event('r'), false)).toBe('rotate');
    expect(getEditorShortcut(event('0'), false)).toBe('fit');
    expect(getEditorShortcut(event('1'), false)).toBe('zoom100');
    expect(getEditorShortcut(event('2'), false)).toBe('zoom200');
    expect(getEditorShortcut(event('='), false)).toBe('zoomIn');
    expect(getEditorShortcut(event('-'), false)).toBe('zoomOut');
    expect(getEditorShortcut(event('o', { ctrlKey: true }), false)).toBe('open');
    expect(getEditorShortcut(event('s', { metaKey: true }), false)).toBe('export');
    expect(getEditorShortcut(event('Escape'), false)).toBe('escape');
  });

  it('does not consume shortcuts while editing form controls', async () => {
    const { getEditorShortcut } = await import('@/lib/editor/shortcuts');
    expect(getEditorShortcut({ key: 'z', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }, true)).toBeNull();
    expect(getEditorShortcut({ key: 'r', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }, true)).toBeNull();
  });
});

describe('v1.7 history timeline', () => {
  const snapshot = (zoom: number): import('@/types/editor').EditorSnapshot => ({
    cropState: {
      crop: { x: 50, y: 50 },
      zoom,
      transform: { rotation: 0, flipX: false, flipY: false },
    },
    cropArea: null,
    freeCropRect: null,
    selectedAspect: null,
    width: null,
    height: null,
    lockAspectRatio: true,
    format: 'png',
    quality: 0.9,
    backgroundColor: '#ffffff',
  });

  it('jumps directly to a selected state', async () => {
    const { appendHistory, selectHistory } = await import('@/lib/editor/history');
    const first = [{ id: 'original', label: 'Original', snapshot: snapshot(1) }];
    const second = appendHistory(first, 0, snapshot(1.2), 'Rotate 90°');
    const third = appendHistory(second.entries, second.currentIndex, snapshot(1.4), 'Resize → 1600 × 900');
    const selected = selectHistory(third.entries, third.currentIndex, 1);
    expect(selected.currentIndex).toBe(1);
    expect(selected.snapshot?.cropState.zoom).toBe(1.2);
  });

  it('removes the future branch when editing from an older state', async () => {
    const { appendHistory, selectHistory } = await import('@/lib/editor/history');
    const first = [{ id: 'original', label: 'Original', snapshot: snapshot(1) }];
    const second = appendHistory(first, 0, snapshot(1.2), 'Rotate 90°');
    const third = appendHistory(second.entries, second.currentIndex, snapshot(1.4), 'Resize → 1600 × 900');
    const selected = selectHistory(third.entries, third.currentIndex, 1);
    const branched = appendHistory(selected.entries, selected.currentIndex, snapshot(1.6), 'Flip horizontal');
    expect(branched.entries.map((entry) => entry.label)).toEqual(['Original', 'Rotate 90°', 'Flip horizontal']);
  });

  it('keeps the original state plus at most 50 operations', async () => {
    const { appendHistory } = await import('@/lib/editor/history');
    let result = { entries: [{ id: 'original', label: 'Original', snapshot: snapshot(1) }], currentIndex: 0 };
    for (let index = 1; index <= 60; index += 1) result = appendHistory(result.entries, result.currentIndex, snapshot(index), `Operation ${index}`);
    expect(result.entries).toHaveLength(51);
    expect(result.entries[0].label).toBe('Original');
    expect(result.entries.at(-1)?.label).toBe('Operation 60');
  });

  it('does not add a duplicate state', async () => {
    const { appendHistory } = await import('@/lib/editor/history');
    const first = [{ id: 'original', label: 'Original', snapshot: snapshot(1) }];
    const duplicate = appendHistory(first, 0, snapshot(1), 'No change');
    expect(duplicate.entries).toBe(first);
    expect(duplicate.currentIndex).toBe(0);
  });
});
