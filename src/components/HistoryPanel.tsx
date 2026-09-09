import { History } from 'lucide-react';
import type { EditorHistoryEntry } from '@/types/editor';

type Props = {
  entries: readonly EditorHistoryEntry[];
  redoCount: number;
};

export function HistoryPanel({ entries, redoCount }: Props) {
  const recent = [...entries].reverse().slice(0, 12);

  return (
    <section className="history-panel" aria-label="Edit history">
      <div className="history-heading">
        <div><div className="panel-label">History</div><h2><History size={14} /> Operations</h2></div>
        <span>{entries.length + redoCount}</span>
      </div>
      {recent.length ? (
        <ol className="history-list">
          {recent.map((entry) => <li key={entry.id}>{entry.label}</li>)}
        </ol>
      ) : <p className="history-empty">No edits yet. Your next change will appear here.</p>}
      {redoCount > 0 && <div className="history-redo">{redoCount} redo {redoCount === 1 ? 'step' : 'steps'} available</div>}
    </section>
  );
}
