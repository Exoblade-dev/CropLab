import { X } from 'lucide-react';

const SHORTCUTS = [
  ['Ctrl/Cmd + Z', 'Undo'],
  ['Ctrl/Cmd + Shift + Z', 'Redo'],
  ['R', 'Rotate 90° right'],
  ['0', 'Fit view'],
  ['1', 'Zoom to 100%'],
  ['2', 'Zoom to 200%'],
  ['+ / =', 'Zoom in'],
  ['-', 'Zoom out'],
  ['Esc', 'Exit the active tool / close an open editor surface'],
  ['Ctrl/Cmd + O', 'Open or replace an image'],
  ['Ctrl/Cmd + S', 'Export the current image'],
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutGuide({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="app-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="app-modal shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-guide-title" aria-describedby="shortcut-guide-description">
        <header className="app-modal-header">
          <div>
            <span className="eyebrow">Keyboard</span>
            <h2 id="shortcut-guide-title">Shortcut guide</h2>
          </div>
          <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close shortcut guide" title="Close shortcut guide">
            <X size={18} />
          </button>
        </header>
        <p id="shortcut-guide-description" className="app-modal-description">
          Use these shortcuts to move through common editing actions faster. Shortcuts are ignored while you edit form controls.
        </p>
        <div className="shortcut-list">
          {SHORTCUTS.map(([keys, action]) => (
            <div className="shortcut-row" key={keys}>
              <kbd>{keys}</kbd>
              <span>{action}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
