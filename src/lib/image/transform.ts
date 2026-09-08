import type { CropState } from '@/types/editor';
export function getCropperTransform(cropState: CropState): string {
  const { crop, zoom, transform } = cropState;
  return [`translate(${crop.x}px, ${crop.y}px)`, `rotateZ(${transform.rotation}deg)`, `rotateY(${transform.flipX ? 180 : 0}deg)`, `rotateX(${transform.flipY ? 180 : 0}deg)`, `scale(${zoom})`].join(' ');
}
