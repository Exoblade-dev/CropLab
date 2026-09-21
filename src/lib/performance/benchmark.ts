import type { Area } from 'react-easy-crop';
import type { ExportSettings, TransformState } from '@/types/editor';
import { createExportCanvas, encodeCanvas, getInteractivePreviewSettings, getOutputDimensions } from '@/lib/image/export';
import { clearPerformanceMeasures, getPerformanceSnapshot, measureAsync } from '@/lib/performance/metrics';

export type BenchmarkResult = {
  interactive: {
    width: number;
    height: number;
    blobBytes: number;
  };
  full: {
    width: number;
    height: number;
    blobBytes: number;
  };
};

export async function runExportBenchmark(
  image: HTMLImageElement,
  crop: Area,
  transform: TransformState,
  settings: ExportSettings,
): Promise<{ result: BenchmarkResult; snapshot: ReturnType<typeof getPerformanceSnapshot> }> {
  clearPerformanceMeasures();

  const interactiveSettings = getInteractivePreviewSettings(crop, settings);
  const interactiveDimensions = getOutputDimensions(crop, interactiveSettings);
  const fullDimensions = getOutputDimensions(crop, settings);
  const interactive = await measureAsync('croplab.benchmark.interactive', async () => {
    const canvas = createExportCanvas(image, crop, transform, interactiveSettings);
    const blob = await encodeCanvas(canvas, interactiveSettings);
    return { width: canvas.width, height: canvas.height, blobBytes: blob.size };
  }, {
    mode: 'interactive',
    sourcePixels: image.naturalWidth * image.naturalHeight,
    outputPixels: interactiveDimensions.width * interactiveDimensions.height,
  });

  const full = await measureAsync('croplab.benchmark.full', async () => {
    const canvas = createExportCanvas(image, crop, transform, settings);
    const blob = await encodeCanvas(canvas, settings);
    return { width: canvas.width, height: canvas.height, blobBytes: blob.size };
  }, {
    mode: 'full',
    sourcePixels: image.naturalWidth * image.naturalHeight,
    outputPixels: fullDimensions.width * fullDimensions.height,
  });

  return {
    result: { interactive, full },
    snapshot: getPerformanceSnapshot(),
  };
}
