import { useSyncExternalStore } from 'react';
import { EXPORT_FORMATS, getSupportedExportFormats, type ExportFormatDefinition } from '@/lib/image/formats';

let clientSnapshot: readonly ExportFormatDefinition[] | null = null;

function subscribe() {
  return () => undefined;
}

function getClientSnapshot(): readonly ExportFormatDefinition[] {
  clientSnapshot ??= getSupportedExportFormats();
  return clientSnapshot;
}

function getServerSnapshot(): readonly ExportFormatDefinition[] {
  return EXPORT_FORMATS;
}

export function useSupportedExportFormats(): readonly ExportFormatDefinition[] {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
