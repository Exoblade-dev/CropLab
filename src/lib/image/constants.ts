import type { AspectRatio, CropState } from '@/types/editor';
import { DEFAULT_ZOOM } from '@/lib/editor/interaction';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8192;
export const MAX_IMAGE_PIXELS = 50_000_000;

export const DEFAULT_CROP_STATE: CropState = {
  crop: { x: 50, y: 50 },
  zoom: DEFAULT_ZOOM,
  transform: { rotation: 0, flipX: false, flipY: false },
};

export const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
];
