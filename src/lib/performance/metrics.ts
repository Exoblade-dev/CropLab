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

export type PerformanceSummary = {
  name: string;
  count: number;
  totalMs: number;
  averageMs: number;
  maxMs: number;
};

export type CropLabPerformanceSnapshot = {
  measures: PerformanceMetric[];
  summaries: PerformanceSummary[];
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
let diagnosticsEnabled = false;
let observer: PerformanceObserver | null = null;

function hasPerformanceApi(): boolean {
  return typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function';
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function shouldMeasure(): boolean {
  if (!hasPerformanceApi()) return false;
  return !isBrowser() || isPerformanceDiagnosticsEnabled();
}

function readPerformanceDiagnosticsEnabled(): boolean {
  if (!isBrowser()) return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get(PERFORMANCE_FLAG) === '1') return true;
  try {
    return window.localStorage.getItem(PERFORMANCE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

if (isBrowser()) diagnosticsEnabled = readPerformanceDiagnosticsEnabled();

export function isPerformanceDiagnosticsEnabled(): boolean {
  return diagnosticsEnabled;
}

export function setPerformanceDiagnosticsEnabled(enabled: boolean): void {
  if (!isBrowser()) return;
  diagnosticsEnabled = enabled;
  try {
    if (enabled) window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, '1');
    else window.localStorage.removeItem(PERFORMANCE_STORAGE_KEY);
  } catch {
    // Diagnostics remain available through the Performance API even if storage is unavailable.
  }
  if (enabled) startLongTaskObserver();
  else stopLongTaskObserver();
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
  if (!shouldMeasure()) return callback();

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
  if (!shouldMeasure()) return callback();

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

export function summarizePerformanceMeasures(measures = getPerformanceMeasures()): PerformanceSummary[] {
  const groups = new Map<string, PerformanceSummary>();
  for (const measure of measures) {
    const current = groups.get(measure.name) ?? { name: measure.name, count: 0, totalMs: 0, averageMs: 0, maxMs: 0 };
    current.count += 1;
    current.totalMs += measure.duration;
    current.maxMs = Math.max(current.maxMs, measure.duration);
    current.averageMs = current.totalMs / current.count;
    groups.set(measure.name, current);
  }
  return [...groups.values()].sort((a, b) => b.totalMs - a.totalMs);
}

export function getPerformanceSnapshot(): CropLabPerformanceSnapshot {
  const measures = getPerformanceMeasures();
  return {
    measures,
    summaries: summarizePerformanceMeasures(measures),
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
  observer = new PerformanceObserver((list) => {
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

function stopLongTaskObserver(): void {
  observer?.disconnect();
  observer = null;
  observerStarted = false;
}

if (isPerformanceDiagnosticsEnabled()) {
  startLongTaskObserver();
}
