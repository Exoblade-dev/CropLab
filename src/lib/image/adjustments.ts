import type { AdjustmentState } from '@/types/editor';

export const DEFAULT_ADJUSTMENTS: AdjustmentState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  sharpen: 0,
  blur: 0,
};

export const ADJUSTMENT_LIMITS = {
  brightness: { min: -100, max: 100 },
  contrast: { min: -100, max: 100 },
  saturation: { min: -100, max: 100 },
  exposure: { min: -100, max: 100 },
  sharpen: { min: 0, max: 100 },
  blur: { min: 0, max: 20 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeAdjustments(adjustments: AdjustmentState): AdjustmentState {
  return {
    brightness: clamp(adjustments.brightness, -100, 100),
    contrast: clamp(adjustments.contrast, -100, 100),
    saturation: clamp(adjustments.saturation, -100, 100),
    exposure: clamp(adjustments.exposure, -100, 100),
    sharpen: clamp(adjustments.sharpen, 0, 100),
    blur: clamp(adjustments.blur, 0, 20),
  };
}

function hasToneAdjustments(adjustments: AdjustmentState) {
  return adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0 || adjustments.exposure !== 0;
}

function applySharpen(canvas: HTMLCanvasElement, amount: number) {
  if (amount <= 0) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for sharpening');

  const width = canvas.width;
  const height = canvas.height;
  const source = ctx.getImageData(0, 0, width, height);
  const output = ctx.createImageData(width, height);
  const src = source.data;
  const dst = output.data;
  const strength = (amount / 100) * 0.85;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        dst[index] = src[index];
        dst[index + 1] = src[index + 1];
        dst[index + 2] = src[index + 2];
        dst[index + 3] = src[index + 3];
        continue;
      }

      const north = index - width * 4;
      const south = index + width * 4;
      const west = index - 4;
      const east = index + 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const sharpened = src[index + channel] * (1 + 4 * strength)
          - src[north + channel] * strength
          - src[south + channel] * strength
          - src[west + channel] * strength
          - src[east + channel] * strength;
        dst[index + channel] = clamp(Math.round(sharpened), 0, 255);
      }
      dst[index + 3] = src[index + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

export function applyAdjustments(canvas: HTMLCanvasElement, rawAdjustments: AdjustmentState): HTMLCanvasElement {
  const adjustments = normalizeAdjustments(rawAdjustments);
  const hasPixelWork = hasToneAdjustments(adjustments) || adjustments.blur > 0 || adjustments.sharpen > 0;
  if (!hasPixelWork) return canvas;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for adjustments');

  if (hasToneAdjustments(adjustments) || adjustments.blur > 0) {
    const filterParts: string[] = [];
    const brightness = (1 + adjustments.brightness / 100) * Math.pow(2, adjustments.exposure / 100);
    if (brightness !== 1) filterParts.push(`brightness(${brightness})`);
    if (adjustments.contrast !== 0) filterParts.push(`contrast(${1 + adjustments.contrast / 100})`);
    if (adjustments.saturation !== 0) filterParts.push(`saturate(${1 + adjustments.saturation / 100})`);
    if (adjustments.blur > 0) filterParts.push(`blur(${adjustments.blur}px)`);

    if (filterParts.length > 0) {
      const filtered = document.createElement('canvas');
      filtered.width = canvas.width;
      filtered.height = canvas.height;
      const filteredContext = filtered.getContext('2d');
      if (!filteredContext) throw new Error('Could not create adjustment buffer');
      filteredContext.filter = filterParts.join(' ');
      filteredContext.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(filtered, 0, 0);
    }
  }

  applySharpen(canvas, adjustments.sharpen);
  return canvas;
}

export function getAdjustmentCssFilter(rawAdjustments: AdjustmentState): string {
  const adjustments = normalizeAdjustments(rawAdjustments);
  const brightness = (1 + adjustments.brightness / 100) * Math.pow(2, adjustments.exposure / 100);
  const parts: string[] = [];
  if (brightness !== 1) parts.push(`brightness(${brightness})`);
  if (adjustments.contrast !== 0) parts.push(`contrast(${1 + adjustments.contrast / 100})`);
  if (adjustments.saturation !== 0) parts.push(`saturate(${1 + adjustments.saturation / 100})`);
  if (adjustments.blur > 0) parts.push(`blur(${adjustments.blur}px)`);
  return parts.join(' ') || 'none';
}
