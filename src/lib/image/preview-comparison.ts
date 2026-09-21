import { DEFAULT_ADJUSTMENTS } from '@/lib/image/adjustments';
import type { ExportSettings } from '@/types/editor';

export function hasActiveAdjustments(settings: ExportSettings): boolean {
  return Object.entries(settings.adjustments).some(([key, value]) => value !== DEFAULT_ADJUSTMENTS[key as keyof typeof DEFAULT_ADJUSTMENTS]);
}

export function getBeforeExportSettings(settings: ExportSettings): ExportSettings {
  return { ...settings, adjustments: DEFAULT_ADJUSTMENTS };
}
