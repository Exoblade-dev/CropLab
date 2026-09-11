export type PerformanceDetail = Record<string, string | number | boolean | null>;

export type PerformanceMetric = {
  name: string;
  duration: number;
  detail: PerformanceDetail | null;
};

export type LongTaskMetric = {
  duration: number;
  startTime: number;
};

export type CropLabPerformanceSnapshot = {
  measures: PerformanceMetric[];
  longTasks: LongTaskMetric[];
  longTaskCount: number;
  longTaskTotalMs: number;
};

const PREFIX = 'croplab.';
const LONG_TASK_THRESHOLD_MS = 50;
const PERFORMANCE_FLAG = 'perf';
const PERFORMANCE_STORAGE_KEY = 'croplab-performance';

let longTasks: LongTaskMetric[] = [];
let observerStarted = false;

function hasPerformanceApi(): boolean {
  return typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function';
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isPerformanceDiagnosticsEnabled(): boolean {
  if (!isBrowser()) return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get(PERFORMANCE_FLAG) === '1') return true;
  try {
    return window.localStorage.getItem(PERFORMANCE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPerformanceDiagnosticsEnabled(enabled: boolean): void {
  if (!isBrowser()) return;
  try {
    if (enabled) window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, '1');
    else window.localStorage.removeItem(PERFORMANCE_STORAGE_KEY);
  } catch {
    // Diagnostics remain available through the Performance API even if storage is unavailable.
  }
}

function createMarkName(name: string, phase: 'start' | 'end'): string {
  return `${name}.${phase}.${Math.random().toString(36).slice(2)}`;
}

function safeMeasure(name: string, startMark: string, endMark: string, detail: PerformanceDetail | undefined): number | null {
  if (!hasPerformanceApi()) return null;
  try {
    const entry = performance.measure(name, {
      start: startMark,
      end: endMark,
      detail: detail ?? null,
    });
    return entry.duration;
  } catch {
    return null;
  } finally {
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
  }
}

export function measureSync<T>(name: string, callback: () => T, detail?: PerformanceDetail): T {
  if (!hasPerformanceApi()) return callback();

  const start = createMarkName(name, 'start');
  const end = createMarkName(name, 'end');
  performance.mark(start);
  try {
    return callback();
  } finally {
    performance.mark(end);
    safeMeasure(name, start, end, detail);
  }
}

export async function measureAsync<T>(name: string, callback: () => Promise<T>, detail?: PerformanceDetail): Promise<T> {
  if (!hasPerformanceApi()) return callback();

  const start = createMarkName(name, 'start');
  const end = createMarkName(name, 'end');
  performance.mark(start);
  try {
    return await callback();
  } finally {
    performance.mark(end);
    safeMeasure(name, start, end, detail);
  }
}

export function getPerformanceMeasures(): PerformanceMetric[] {
  if (!hasPerformanceApi()) return [];
  return performance
    .getEntriesByType('measure')
    .filter((entry) => entry.name.startsWith(PREFIX))
    .map((entry) => {
      const measure = entry as PerformanceMeasure & { detail?: PerformanceDetail | null };
      return {
        name: measure.name,
        duration: measure.duration,
        detail: measure.detail ?? null,
      };
    });
}

export function getPerformanceSnapshot(): CropLabPerformanceSnapshot {
  return {
    measures: getPerformanceMeasures(),
    longTasks: [...longTasks],
    longTaskCount: longTasks.length,
    longTaskTotalMs: longTasks.reduce((total, task) => total + task.duration, 0),
  };
}

export function clearPerformanceMeasures(): void {
  if (hasPerformanceApi()) {
    performance.getEntriesByType('measure')
      .filter((entry) => entry.name.startsWith(PREFIX))
      .forEach((entry) => performance.clearMeasures(entry.name));
  }
  longTasks = [];
}

function startLongTaskObserver(): void {
  if (!isBrowser() || observerStarted || !isPerformanceDiagnosticsEnabled()) return;
  if (typeof PerformanceObserver === 'undefined') return;
  if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;

  observerStarted = true;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration < LONG_TASK_THRESHOLD_MS) continue;
      longTasks.push({
        duration: entry.duration,
        startTime: entry.startTime,
      });
    }
  });

  observer.observe({ type: 'longtask', buffered: true });
}

if (isPerformanceDiagnosticsEnabled()) {
  startLongTaskObserver();
}
