import type { Area } from 'react-easy-crop';
import { getRotatedImageBounds } from '@/lib/image/export';
import type { FreeformCropRect } from '@/types/editor';

export type { FreeformCropRect } from '@/types/editor';

export type FreeformGeometry = {
  imageBounds: FreeformCropRect;
  displayScale: number;
  previewWidth: number;
  previewHeight: number;
};

export const INITIAL_FREEFORM_CROP_SOURCE_SIZE = 1000;
export const MIN_FREEFORM_CROP_PREVIEW_PIXELS = 2;

export type FreeformResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export function resizeFreeformCropRect(
  start: FreeformCropRect,
  handle: FreeformResizeHandle,
  dx: number,
  dy: number,
  bounds: FreeformCropRect,
  minimumWidth: number,
  minimumHeight: number,
): FreeformCropRect {
  const left = start.x;
  const right = start.x + start.width;
  const top = start.y;
  const bottom = start.y + start.height;
  let nextLeft = left;
  let nextRight = right;
  let nextTop = top;
  let nextBottom = bottom;

  if (handle.includes('w')) nextLeft = Math.min(Math.max(bounds.x, left + dx), right - minimumWidth);
  if (handle.includes('e')) nextRight = Math.max(Math.min(bounds.x + bounds.width, right + dx), left + minimumWidth);
  if (handle.includes('n')) nextTop = Math.min(Math.max(bounds.y, top + dy), bottom - minimumHeight);
  if (handle.includes('s')) nextBottom = Math.max(Math.min(bounds.y + bounds.height, bottom + dy), top + minimumHeight);

  return {
    x: nextLeft,
    y: nextTop,
    width: Math.max(minimumWidth, nextRight - nextLeft),
    height: Math.max(minimumHeight, nextBottom - nextTop),
  };
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getFreeformGeometry(
  stageWidth: number,
  stageHeight: number,
  previewWidth: number,
  previewHeight: number,
  zoom: number,
  rotation: number,
): FreeformGeometry {
  const rotated = getRotatedImageBounds(previewWidth, previewHeight, rotation);
  // Freeform keeps the whole transformed image visible at 100% so the crop
  // rectangle can move across the complete source without an image-drag mode.
  const baseScale = Math.min(stageWidth / rotated.width, stageHeight / rotated.height);
  const displayScale = Math.max(Number.EPSILON, baseScale * zoom);
  const imageWidth = rotated.width * displayScale;
  const imageHeight = rotated.height * displayScale;

  return {
    imageBounds: {
      x: (stageWidth - imageWidth) / 2,
      y: (stageHeight - imageHeight) / 2,
      width: imageWidth,
      height: imageHeight,
    },
    displayScale,
    previewWidth: rotated.width,
    previewHeight: rotated.height,
  };
}

export function getMinimumFreeformCropPreviewSize(): number {
  return MIN_FREEFORM_CROP_PREVIEW_PIXELS;
}

export function getInitialFreeformCropRect(
  geometry: FreeformGeometry,
  sourceScaleX: number,
  sourceScaleY: number,
  preferredSourceSize = INITIAL_FREEFORM_CROP_SOURCE_SIZE,
): FreeformCropRect {
  const previewSize = Math.min(
    preferredSourceSize / sourceScaleX,
    preferredSourceSize / sourceScaleY,
    geometry.previewWidth,
    geometry.previewHeight,
  );
  const size = Math.max(
    getMinimumFreeformCropPreviewSize(),
    Math.min(previewSize, geometry.previewWidth, geometry.previewHeight),
  );
  const width = size * geometry.displayScale;
  const height = size * geometry.displayScale;

  return {
    x: geometry.imageBounds.x + (geometry.imageBounds.width - width) / 2,
    y: geometry.imageBounds.y + (geometry.imageBounds.height - height) / 2,
    width,
    height,
  };
}

export function clampFreeformCropRect(
  rect: FreeformCropRect,
  imageBounds: FreeformCropRect,
  displayScale: number,
): FreeformCropRect {
  const minimum = getMinimumFreeformCropPreviewSize() * displayScale;
  const minimumWidth = Math.min(minimum, imageBounds.width);
  const minimumHeight = Math.min(minimum, imageBounds.height);
  const width = clamp(rect.width, minimumWidth, imageBounds.width);
  const height = clamp(rect.height, minimumHeight, imageBounds.height);
  const x = clamp(rect.x, imageBounds.x, imageBounds.x + imageBounds.width - width);
  const y = clamp(rect.y, imageBounds.y, imageBounds.y + imageBounds.height - height);

  return { x, y, width, height };
}

export function freeformCropRectToArea(
  rect: FreeformCropRect,
  geometry: FreeformGeometry,
  sourceScaleX: number,
  sourceScaleY: number,
): Area {
  const x = clamp((rect.x - geometry.imageBounds.x) / geometry.displayScale, 0, geometry.previewWidth);
  const y = clamp((rect.y - geometry.imageBounds.y) / geometry.displayScale, 0, geometry.previewHeight);
  const width = clamp(rect.width / geometry.displayScale, 1, geometry.previewWidth - x);
  const height = clamp(rect.height / geometry.displayScale, 1, geometry.previewHeight - y);

  return {
    x: Math.max(0, Math.round(x * sourceScaleX)),
    y: Math.max(0, Math.round(y * sourceScaleY)),
    width: Math.max(1, Math.round(width * sourceScaleX)),
    height: Math.max(1, Math.round(height * sourceScaleY)),
  };
}

