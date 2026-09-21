import { validateImageFile } from '@/lib/image/validation';

export type ImageInputSource = 'picker' | 'drop' | 'clipboard';

export type ImageInputResult = {
  files: File[];
  source: ImageInputSource;
};

export type RejectedImageInput = {
  file: File;
  message: string;
};

export type NormalizedImageInput = {
  result: ImageInputResult | null;
  rejected: RejectedImageInput[];
};

/**
 * Normalizes every supported input source into an ordered File[] and runs the
 * existing file-level validation before the editor sees any file.
 */
export async function normalizeImageInput(
  files: Iterable<File>,
  source: ImageInputSource,
): Promise<NormalizedImageInput> {
  const accepted: File[] = [];
  const rejected: RejectedImageInput[] = [];

  for (const file of files) {
    const validation = await validateImageFile(file);
    if (validation.valid) {
      accepted.push(file);
    } else {
      rejected.push({ file, message: validation.message });
    }
  }

  return {
    result: accepted.length > 0 ? { files: accepted, source } : null,
    rejected,
  };
}
