import type { Area, Point } from 'react-easy-crop';
import type { InputImageFormat } from '@/lib/image/validation';

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type TransformState = { rotation: number; flipX: boolean; flipY: boolean };
export type CropState = { crop: Point; zoom: number; transform: TransformState };
export type AspectRatio = { label: string; value: number | null };
export type EditorSnapshot = {
  cropState: CropState;
  selectedAspect: number | null;
  width: number | null;
  height: number | null;
  format: ImageFormat;
  quality: number;
  backgroundColor: string;
};
export type EditorHistoryEntry = { id: string; label: string; snapshot: EditorSnapshot };
export type EditorHistoryState = { undo: EditorHistoryEntry[]; redo: EditorHistoryEntry[] };
export type ExportSettings = {
  format: ImageFormat;
  quality: number;
  width: number | null;
  height: number | null;
  lockAspectRatio: boolean;
  backgroundColor: string;
};
export type LoadedImage = { src: string; element: HTMLImageElement; fileSize: number; format: InputImageFormat };
export type CropArea = Area | null;
export type ExportStatus = 'idle' | 'preparing' | 'cropping' | 'resizing' | 'encoding' | 'downloading' | 'complete' | 'error';
