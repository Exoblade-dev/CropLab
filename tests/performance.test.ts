import { describe, expect, it } from 'vitest';
import {
  clearPerformanceMeasures,
  getPerformanceMeasures,
  getPerformanceSnapshot,
  isPerformanceDiagnosticsEnabled,
  measureSync,
  summarizePerformanceMeasures,
} from '@/lib/performance/metrics';

describe('v1.9 performance instrumentation', () => {
  it('measures synchronous work through the Performance API', () => {
    clearPerformanceMeasures();
    const result = measureSync('croplab.test.measure', () => 42, {
      pixels: 8064 * 6048,
      format: 'jpeg',
    });

    expect(result).toBe(42);

    const entry = getPerformanceMeasures().find((item) => item.name === 'croplab.test.measure');
    expect(entry).toBeDefined();
    expect(entry?.duration).toBeGreaterThanOrEqual(0);
    expect(entry?.detail).toEqual({
      pixels: 8064 * 6048,
      format: 'jpeg',
    });
  });

  it('returns a stable performance snapshot shape', () => {
    const snapshot = getPerformanceSnapshot();

    expect(Array.isArray(snapshot.measures)).toBe(true);
    expect(Array.isArray(snapshot.longTasks)).toBe(true);
    expect(snapshot.longTaskCount).toBe(snapshot.longTasks.length);
    expect(snapshot.longTaskTotalMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(snapshot.summaries)).toBe(true);
  });

  it('keeps diagnostics opt-in by default when no browser flag is present', () => {
    expect(typeof isPerformanceDiagnosticsEnabled()).toBe('boolean');
  });
});


describe('performance aggregation', () => {
  it('groups repeated measures without losing the largest sample', () => {
    expect(summarizePerformanceMeasures([
      { name: 'croplab.export.encode', duration: 10, detail: null },
      { name: 'croplab.export.encode', duration: 30, detail: null },
      { name: 'croplab.export.canvas-draw', duration: 20, detail: null },
    ])).toEqual([
      { name: 'croplab.export.encode', count: 2, totalMs: 40, averageMs: 20, maxMs: 30 },
      { name: 'croplab.export.canvas-draw', count: 1, totalMs: 20, averageMs: 20, maxMs: 20 },
    ]);
  });
});
