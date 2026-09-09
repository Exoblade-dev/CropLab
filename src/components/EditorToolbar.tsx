import { FileInput, FlipHorizontal, FlipVertical, History, Redo2, RotateCcw, RotateCw, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  isHistoryOpen: boolean;
  zoom: number;
  rotation: number;
  onHistory: () => void;
  onReplace: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onReset: () => void;
  onZoomChange: (value: number) => void;
  onZoomPreset: (value: number) => void;
  onRotationChange: (value: number) => void;
  onRotationCommit: () => void;
  onRotationInteractionStart: () => void;
};

export function EditorToolbar({ canUndo, canRedo, isHistoryOpen, zoom, rotation, onHistory, onReplace, onClear, onUndo, onRedo, onRotateLeft, onRotateRight, onFlipHorizontal, onFlipVertical, onReset, onZoomChange, onZoomPreset, onRotationChange, onRotationCommit, onRotationInteractionStart }: Props) {
  return (
    <div className="persistent-toolbar" aria-label="Persistent editor toolbar">
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onReplace} title="Replace image" aria-label="Replace image"><FileInput size={16} /></button><button className="toolbar-btn" onClick={onClear} title="Clear image" aria-label="Clear image"><Trash2 size={16} /></button></div>
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={16} /></button><button className="toolbar-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={16} /></button><button className={`toolbar-btn ${isHistoryOpen ? 'active' : ''}`} onClick={onHistory} title="History" aria-label="Open edit history" aria-pressed={isHistoryOpen}><History size={16} /></button></div>
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onRotateLeft} title="Rotate left 90°" aria-label="Rotate left 90 degrees"><RotateCcw size={16} /></button><button className="toolbar-btn" onClick={onRotateRight} title="Rotate right 90°" aria-label="Rotate right 90 degrees"><RotateCw size={16} /></button></div>
      <div className="toolbar-group"><button className="toolbar-btn" onClick={onFlipHorizontal} title="Flip horizontal" aria-label="Flip horizontal"><FlipHorizontal size={16} /></button><button className="toolbar-btn" onClick={onFlipVertical} title="Flip vertical" aria-label="Flip vertical"><FlipVertical size={16} /></button></div>
      <div className="toolbar-control rotation-control">
        <div className="toolbar-control-heading"><span>Rotation</span><strong>{Math.round(rotation)}°</strong></div>
        <input aria-label="Rotation" type="range" min="-180" max="180" step="1" value={rotation} onChange={(event) => onRotationChange(Number(event.target.value))} onPointerDown={onRotationInteractionStart} onPointerUp={onRotationCommit} onKeyUp={onRotationCommit} />
        <div className="range-ends"><span>-180°</span><span>180°</span></div>
      </div>
      <div className="toolbar-control zoom-control">
        <div className="toolbar-control-heading"><span>Zoom</span><strong>{Math.round(zoom * 100)}%</strong></div>
        <div className="zoom-row"><button className="toolbar-btn" onClick={() => onZoomPreset(zoom - 0.1)} title="Zoom out" aria-label="Zoom out"><ZoomOut size={15} /></button><input aria-label="Zoom" type="range" min="0.2" max="2" step="0.01" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} /><button className="toolbar-btn" onClick={() => onZoomPreset(zoom + 0.1)} title="Zoom in" aria-label="Zoom in"><ZoomIn size={15} /></button></div>
        <div className="zoom-presets"><button onClick={() => onZoomPreset(0.2)}>Fit</button><button className={zoom === 1 ? 'active' : ''} onClick={() => onZoomPreset(1)}>100%</button><button className={zoom === 2 ? 'active' : ''} onClick={() => onZoomPreset(2)}>200%</button><button onClick={() => onZoomPreset(1)}>Reset</button></div>
      </div>
      <div className="toolbar-spacer" />
      <button className="toolbar-btn toolbar-reset" onClick={onReset} title="Reset all edits" aria-label="Reset all edits"><RotateCcw size={16} /></button>
    </div>
  );
}
