'use client';

import { useMemo, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { Activity, Copy, RefreshCw, Trash2, X } from 'lucide-react';
import type { ExportSettings, TransformState } from '@/types/editor';
import { runExportBenchmark } from '@/lib/performance/benchmark';
import { getPerformanceSnapshot, isPerformanceDiagnosticsEnabled, clearPerformanceMeasures } from '@/lib/performance/metrics';

const formatMs = (value: number) => `${value.toFixed(value >= 100 ? 0 : 1)} ms`;

function currentSnapshot() {
  return getPerformanceSnapshot();
}

type Props = {
  image: HTMLImageElement | null;
  crop: Area | null;
  transform: TransformState;
  settings: ExportSettings;
};

export function PerformanceDiagnostics({ image, crop, transform, settings }: Props) {
  const enabled = useMemo(() => isPerformanceDiagnosticsEnabled(), []);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [snapshot, setSnapshot] = useState(currentSnapshot);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) return null;

  const refresh = () => setSnapshot(currentSnapshot());
  const clear = () => {
    clearPerformanceMeasures();
    setSnapshot(currentSnapshot());
    setError(null);
  };

  const benchmark = async () => {
    if (!image || !crop || running) return;
    setRunning(true);
    setError(null);
    try {
      const next = await runExportBenchmark(image, crop, transform, settings);
      setSnapshot(next.snapshot);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Benchmark failed');
      setSnapshot(currentSnapshot());
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    } catch {
      setError('Clipboard access is unavailable in this browser.');
    }
  };

  return (
    <aside className={`performance-diagnostics${open ? ' is-open' : ''}`} aria-label="Performance diagnostics">
      <button type="button" className="performance-diagnostics-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Activity size={14} /> Performance
      </button>
      {open && (
        <div className="performance-diagnostics-panel" role="region" aria-label="Performance benchmark results">
          <header>
            <div><strong>Performance diagnostics</strong><span>Development-only · ?perf=1</span></div>
            <button type="button" className="performance-icon-button" onClick={() => setOpen(false)} aria-label="Close performance diagnostics"><X size={15} /></button>
          </header>
          <div className="performance-diagnostics-actions">
            <button type="button" onClick={() => void benchmark()} disabled={!image || !crop || running}>
              <Activity size={14} /> {running ? 'Benchmarking…' : 'Run export benchmark'}
            </button>
            <button type="button" onClick={refresh} aria-label="Refresh performance measurements"><RefreshCw size={14} /></button>
            <button type="button" onClick={clear} aria-label="Clear performance measurements"><Trash2 size={14} /></button>
            <button type="button" onClick={() => void copy()} aria-label="Copy performance measurements"><Copy size={14} /></button>
          </div>
          {error && <p className="performance-diagnostics-error" role="alert">{error}</p>}
          <div className="performance-diagnostics-summary">
            <span><strong>{snapshot.longTaskCount}</strong> long tasks</span>
            <span><strong>{formatMs(snapshot.longTaskTotalMs)}</strong> blocked</span>
            <span><strong>{snapshot.measures.length}</strong> measures</span>
          </div>
          <div className="performance-diagnostics-table" role="table" aria-label="Performance measure summary">
            <div className="performance-row performance-row-head" role="row"><span>Measure</span><span>Avg</span><span>Max</span></div>
            {snapshot.summaries.slice(0, 12).map((item) => (
              <div className="performance-row" role="row" key={item.name}>
                <span title={`${item.count} sample${item.count === 1 ? '' : 's'}`}>{item.name.replace('croplab.', '')}</span>
                <span>{formatMs(item.averageMs)}</span>
                <span>{formatMs(item.maxMs)}</span>
              </div>
            ))}
            {snapshot.summaries.length === 0 && <p className="performance-empty">No measurements yet.</p>}
          </div>
        </div>
      )}
    </aside>
  );
}
