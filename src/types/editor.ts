import type { Area, Point } from 'react-easy-crop';
import type { InputImageFormat } from '@/lib/image/validation';

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type TransformState = { rotation: number; flipX: boolean; flipY: boolean };
export type AdjustmentState = { brightness: number; contrast: number; saturation: number; exposure: number; sharpen: number; blur: number };
export type CropState = { crop: Point; zoom: number; transform: TransformState };
export type FreeformCropRect = { x: number; y: number; width: number; height: number };
export type AspectRatio = { label: string; value: number | null };
export type EditorSnapshot = {
  cropState: CropState;
  cropArea: Area | null;
  freeCropRect: FreeformCropRect | null;
  selectedAspect: number | null;
  width: number | null;
  height: number | null;
  lockAspectRatio: boolean;
  format: ImageFormat;
  quality: number;
  backgroundColor: string;
  adjustments: AdjustmentState;
};
export type EditorHistoryEntry = { id: string; label: string; snapshot: EditorSnapshot };
export type EditorHistoryState = { entries: EditorHistoryEntry[]; currentIndex: number };
export type ExportSettings = {
  format: ImageFormat;
  quality: number;
  width: number | null;
  height: number | null;
  lockAspectRatio: boolean;
  backgroundColor: string;
  adjustments: AdjustmentState;
};
export type ImageMetadataKind = 'EXIF' | 'XMP' | 'ICC' | 'IPTC' | 'Comment' | 'Text' | 'Unknown';
export type ImageMetadata = {
  kinds: ImageMetadataKind[];
  hasMetadata: boolean;
  cameraMake: string | null;
  cameraModel: string | null;
  captureDate: string | null;
  orientation: number | null;
  iso: number | null;
  exposureTime: string | null;
  fNumber: string | null;
  focalLength: string | null;
  hasGps: boolean;
};

export type LoadedImage = {
  src: string;
  element: HTMLImageElement;
  fileSize: number;
  format: InputImageFormat;
  metadata: ImageMetadata;
  previewScaleX: number;
  previewScaleY: number;
  previewWidth: number;
  previewHeight: number;
};
export type CropArea = Area | null;
export type ExportStatus = 'idle' | 'preparing' | 'cropping' | 'resizing' | 'encoding' | 'downloading' | 'complete' | 'error';
