import { useEffect, useRef } from 'react';
import { Check, History, X } from 'lucide-react';
import { ASPECT_RATIOS } from '@/lib/image/constants';
import type { EditorHistoryEntry } from '@/types/editor';

type Props = {
  open: boolean;
  entries: readonly EditorHistoryEntry[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
};

function formatRatio(value: number | null): string {
  if (value === null) return 'Free crop';
  const match = ASPECT_RATIOS.find((ratio) => ratio.value !== null && Math.abs(ratio.value - value) < 0.001);
  return match?.label ?? `${value.toFixed(2)}:1`;
}

function getDetails(entry: EditorHistoryEntry): string {
  const { snapshot } = entry;
  const details: string[] = [];
  if (entry.label.startsWith('Resize')) details.push(snapshot.width && snapshot.height ? `${snapshot.width} × ${snapshot.height}` : 'Auto dimensions');
  if (entry.label.startsWith('Crop')) details.push(formatRatio(snapshot.selectedAspect));
  if (entry.label.startsWith('Rotate')) details.push(`${Math.round(snapshot.cropState.transform.rotation)}°`);
  if (entry.label.startsWith('Flip')) details.push(`${snapshot.cropState.transform.flipX ? 'H' : ''}${snapshot.cropState.transform.flipY ? ' V' : ''}`.trim());
  if (entry.label.startsWith('Quality')) details.push(`${Math.round(snapshot.quality * 100)}%`);
  if (entry.label.startsWith('Format')) details.push(snapshot.format.toUpperCase());
  if (snapshot.width && snapshot.height && !entry.label.startsWith('Resize')) details.push(`${snapshot.width} × ${snapshot.height}`);
  return details.join(' · ') || 'Editor state';
}

export function HistoryPanel({ open, entries, currentIndex, onSelect, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = closeButtonRef.current?.closest('[role=dialog]');
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="history-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title" aria-describedby="history-dialog-description">
        <header className="history-dialog-header">
          <div>
            <div className="panel-label">History</div>
            <h2 id="history-dialog-title"><History size={16} aria-hidden="true" /> Edit history</h2>
            <p id="history-dialog-description">Select any state to return the editor to that exact point. New edits from an older state replace the future branch.</p>
          </div>
          <button ref={closeButtonRef} className="history-close" onClick={onClose} aria-label="Close history"><X size={17} aria-hidden="true" /></button>
        </header>
        <div className="history-dialog-body">
          <ol className="history-timeline">
            {entries.map((entry, index) => {
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              return (
                <li key={entry.id} className={`${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}>
                  <button className="history-entry" onClick={() => onSelect(index)} aria-current={isCurrent ? 'step' : undefined}>
                    <span className="history-entry-marker" aria-hidden="true">{isCurrent ? <Check size={12} /> : index === 0 ? <span className="history-entry-dot" /> : index}</span>
                    <span className="history-entry-copy"><strong>{entry.label}</strong><small>{getDetails(entry)}</small></span>
                    {isCurrent && <span className="history-current">Current</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <footer className="history-dialog-footer"><span>{entries.length - 1} {entries.length - 1 === 1 ? 'operation' : 'operations'}</span><span>Up to 50 operations retained</span></footer>
      </section>
    </div>
  );
}
