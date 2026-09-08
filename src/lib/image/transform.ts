import type { CropState } from '@/types/editor';

/**
 * Keeps react-easy-crop's internal interaction transform intact while adding
 * horizontal and vertical flips. The library documents this full transform
 * shape for custom media transforms; replacing it with only scaleX/scaleY
 * causes crop/drag coordinates to become inconsistent after repeated flips.
 */
export function getCropperTransform(cropState: CropState): string {
  const { crop, zoom, transform } = cropState;

  return [
    `translate(${crop.x}px, ${crop.y}px)`,
    `rotateZ(${transform.rotation}deg)`,
    `rotateY(${transform.flipX ? 180 : 0}deg)`,
    `rotateX(${transform.flipY ? 180 : 0}deg)`,
    `scale(${zoom})`,
  ].join(' ');
}
