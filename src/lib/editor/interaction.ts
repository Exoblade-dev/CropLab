export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2;
export const DEFAULT_ZOOM = 1;
export const FIT_ZOOM = MIN_ZOOM;

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function normalizeRotation(value: number): number {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

export function rotateBy(current: number, amount: number): number {
  return normalizeRotation(current + amount);
}

export function deriveDimension(value: number, sourceWidth: number, sourceHeight: number, axis: 'width' | 'height'): number {
  if (axis === 'width') return Math.max(1, Math.round(value * (sourceHeight / sourceWidth)));
  return Math.max(1, Math.round(value * (sourceWidth / sourceHeight)));
}
