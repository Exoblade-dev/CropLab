import { FileInput, FlipHorizontal, FlipVertical, Redo2, RotateCcw, RotateCw, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';

type Props = { canUndo: boolean; canRedo: boolean; zoom: number; onReplace: () => void; onClear: () => void; onUndo: () => void; onRedo: () => void; onRotateLeft: () => void; onRotateRight: () => void; onFlipHorizontal: () => void; onFlipVertical: () => void; onReset: () => void; onZoomChange: (value: number) => void; };

export function EditorToolbar({ canUndo, canRedo, zoom, onReplace, onClear, onUndo, onRedo, onRotateLeft, onRotateRight, onFlipHorizontal, onFlipVertical, onReset, onZoomChange }: Props) {
  return (
    <div className="persistent-toolbar" aria-label="Persistent editor toolbar">
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onReplace} title="Replace image" aria-label="Replace image"><FileInput size={16} /></button><button className="toolbar-btn" onClick={onClear} title="Clear image" aria-label="Clear image"><Trash2 size={16} /></button></div>
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={16} /></button><button className="toolbar-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={16} /></button></div>
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onRotateLeft} title="Rotate left 90°" aria-label="Rotate left"><RotateCcw size={16} /></button><button className="toolbar-btn" onClick={onRotateRight} title="Rotate right 90°" aria-label="Rotate right"><RotateCw size={16} /></button></div>
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onFlipHorizontal} title="Flip horizontal" aria-label="Flip horizontal"><FlipHorizontal size={16} /></button><button className="toolbar-btn" onClick={onFlipVertical} title="Flip vertical" aria-label="Flip vertical"><FlipVertical size={16} /></button></div>
      <div className="toolbar-divider" />
      <div className="toolbar-zoom"><button className="toolbar-btn" onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))} title="Zoom out" aria-label="Zoom out"><ZoomOut size={15} /></button><input aria-label="Zoom" type="range" min="0.1" max="5" step="0.05" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} /><span>{Math.round(zoom * 100)}%</span><button className="toolbar-btn" onClick={() => onZoomChange(Math.min(5, zoom + 0.1))} title="Zoom in" aria-label="Zoom in"><ZoomIn size={15} /></button></div>
      <div className="toolbar-spacer" /><button className="toolbar-btn toolbar-reset" onClick={onReset} title="Reset all edits" aria-label="Reset all edits"><RotateCcw size={16} /></button>
    </div>
  );
}
