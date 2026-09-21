'use client';

import { useCallback } from 'react';
import { normalizeImageInput, type ImageInputResult, type ImageInputSource } from '@/lib/image/input';

export function useImageInput(onInput: (input: ImageInputResult) => void | Promise<void>, onError: (message: string) => void) {
  return useCallback(async (files: Iterable<File>, source: ImageInputSource) => {
    const normalized = await normalizeImageInput(files, source);

    if (normalized.result) await onInput(normalized.result);

    if (normalized.rejected.length > 0) {
      const acceptedPrefix = normalized.result
        ? `${normalized.result.files.length} valid image${normalized.result.files.length === 1 ? '' : 's'} received. `
        : '';
      const rejectedMessage = normalized.rejected.length === 1
        ? `${acceptedPrefix}${normalized.rejected[0].file.name}: ${normalized.rejected[0].message}`
        : `${acceptedPrefix}${normalized.rejected.length} files were rejected because they are unsupported or invalid images.`;
      onError(rejectedMessage);
    }
  }, [onError, onInput]);
}
