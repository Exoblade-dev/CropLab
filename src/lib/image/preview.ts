import type { Area } from 'react-easy-crop';

export const MAX_PREVIEW_DIMENSION = 4096;

export type PreviewDimensions = {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
};

export function getPreviewDimensions(
  width: number,
  height: number,
  maxDimension = MAX_PREVIEW_DIMENSION,
): PreviewDimensions {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height, scaleX: 1, scaleY: 1 };
  }

  const scale = maxDimension / Math.max(width, height);
  const previewWidth = Math.max(1, Math.round(width * scale));
  const previewHeight = Math.max(1, Math.round(height * scale));

  return {
    width: previewWidth,
    height: previewHeight,
    scaleX: width / previewWidth,
    scaleY: height / previewHeight,
  };
}

export function scaleCropAreaToSource(
  area: Area,
  scaleX: number,
  scaleY: number,
): Area {
  return {
    x: Math.max(0, Math.round(area.x * scaleX)),
    y: Math.max(0, Math.round(area.y * scaleY)),
    width: Math.max(1, Math.round(area.width * scaleX)),
    height: Math.max(1, Math.round(area.height * scaleY)),
  };
}
