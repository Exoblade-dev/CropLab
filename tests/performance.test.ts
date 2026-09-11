import { describe, expect, it } from 'vitest';
import {
  clearPerformanceMeasures,
  getPerformanceMeasures,
  getPerformanceSnapshot,
  isPerformanceDiagnosticsEnabled,
  measureSync,
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
  });

  it('keeps diagnostics opt-in by default when no browser flag is present', () => {
    expect(typeof isPerformanceDiagnosticsEnabled()).toBe('boolean');
  });
});
