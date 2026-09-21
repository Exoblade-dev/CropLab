export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;
export const DEFAULT_ZOOM = 1;
export const FIT_ZOOM = MIN_ZOOM;

export function getRotatedBounds(width: number, height: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
}

export function calculateFitZoom(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  aspect: number | null,
  rotation: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) return DEFAULT_ZOOM;

  const bounds = getRotatedBounds(imageWidth, imageHeight, rotation);
  let targetWidth = containerWidth;
  let targetHeight = containerHeight;

  if (aspect) {
    if (containerWidth / containerHeight > aspect) {
      targetHeight = containerHeight;
      targetWidth = targetHeight * aspect;
    } else {
      targetWidth = containerWidth;
      targetHeight = targetWidth / aspect;
    }
  }

  const coverScale = Math.max(targetWidth / bounds.width, targetHeight / bounds.height);
  const containScale = Math.min(targetWidth / bounds.width, targetHeight / bounds.height);
  return clampZoom(containScale / coverScale);
}

export function snapRotation(value: number, tolerance = 2): number {
  const normalized = normalizeRotation(value);
  const snapPoints = [0, 90, -90, 180];
  const match = snapPoints.find((point) => Math.abs(normalized - point) <= tolerance);
  return match ?? normalized;
}

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
