export const PREVIEW_ZOOM_PRESETS = [50, 100, 200, 400] as const;
export type PreviewZoom = 'fit' | (typeof PREVIEW_ZOOM_PRESETS[number]);

export function getPreviewFitScale(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (viewportWidth <= 0 || viewportHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return 1;
  return Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
}

export function getPreviewScale(zoom: PreviewZoom, fitScale: number): number {
  return zoom === 'fit' ? fitScale : zoom / 100;
}

export function getNextPreviewZoom(zoom: PreviewZoom, direction: 'in' | 'out'): PreviewZoom {
  const levels: PreviewZoom[] = ['fit', ...PREVIEW_ZOOM_PRESETS];
  const index = levels.indexOf(zoom);
  const nextIndex = direction === 'in'
    ? Math.min(levels.length - 1, index + 1)
    : Math.max(0, index - 1);
  return levels[nextIndex];
}

export function clampPreviewPan(
  panX: number,
  panY: number,
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale: number,
) {
  const maxX = Math.max(0, (imageWidth * scale - viewportWidth) / 2);
  const maxY = Math.max(0, (imageHeight * scale - viewportHeight) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, panX)),
    y: Math.min(maxY, Math.max(-maxY, panY)),
  };
}
