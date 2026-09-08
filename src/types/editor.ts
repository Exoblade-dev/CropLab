import type { Area, Point } from 'react-easy-crop';

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export type TransformState = {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
};

export type CropState = {
  crop: Point;
  zoom: number;
  transform: TransformState;
};

export type AspectRatio = { label: string; value: number | null };

export type EditorHistoryState = {
  undo: CropState[];
  redo: CropState[];
};

export type ExportSettings = {
  format: ImageFormat;
  quality: number;
  width: number | null;
  height: number | null;
  lockAspectRatio: boolean;
};

export type LoadedImage = {
  src: string;
  element: HTMLImageElement;
  fileSize: number;
};

export type CropArea = Area | null;
