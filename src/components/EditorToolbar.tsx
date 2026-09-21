import { FileInput, FlipHorizontal, History, Redo2, RotateCcw, RotateCw, Trash2, Undo2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

type Props = {
  canUndo: boolean; canRedo: boolean; isHistoryOpen: boolean; zoom: number; rotation: number;
  onHistory: () => void; onReplace: () => void; onClear: () => void; onUndo: () => void; onRedo: () => void;
  onRotateLeft: () => void; onRotateRight: () => void; onFlipHorizontal: () => void; onResetRotation: () => void; onReset: () => void;
  onZoomChange: (value: number) => void; onZoomPreset: (value: number) => void; onFit: () => void; onRotationChange: (value: number) => void;
  onRotationCommit: () => void; onRotationInteractionStart: () => void;
};

export function EditorToolbar({ canUndo, canRedo, isHistoryOpen, zoom, rotation, onHistory, onReplace, onClear, onUndo, onRedo, onRotateLeft, onRotateRight, onFlipHorizontal, onResetRotation, onReset, onZoomChange, onZoomPreset, onFit, onRotationChange, onRotationCommit, onRotationInteractionStart }: Props) {
  return (
    <div className="canvas-toolbar" aria-label="Image controls">
      <div className="toolbar-cluster">
        <button className="toolbar-icon-button" onClick={onReplace} title="Replace image" aria-label="Replace image"><FileInput size={16} /></button>
        
      </div>
      <span className="toolbar-rule" />
      <div className="toolbar-cluster">
        <button className="toolbar-icon-button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={16} /></button>
        <button className="toolbar-icon-button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={16} /></button>
        <button className={`toolbar-icon-button ${isHistoryOpen ? 'active' : ''}`} onClick={onHistory} title="Edit history" aria-label="Open edit history" aria-pressed={isHistoryOpen}><History size={16} /></button>
      </div>
      <span className="toolbar-rule" />
      <div className="toolbar-cluster">
        <button className="toolbar-icon-button" onClick={onRotateLeft} title="Rotate left 90°" aria-label="Rotate left 90 degrees"><RotateCcw size={16} /></button>
        <button className="toolbar-icon-button" onClick={onRotateRight} title="Rotate right 90°" aria-label="Rotate right 90 degrees"><RotateCw size={16} /></button>
        <button className="toolbar-icon-button" onClick={onFlipHorizontal} title="Flip horizontal" aria-label="Flip horizontal"><FlipHorizontal size={16} /></button>
              </div>
      <span className="toolbar-rule" />
      <div className="toolbar-range rotation-range">
        <div className="toolbar-range-head"><span>Rotation</span><strong>{Math.round(rotation)}°</strong></div>
        <div className="rotation-control-row">
          <input aria-label="Rotation in degrees" className="rotation-number-input" type="number" min="-180" max="180" step="1" value={Math.round(rotation)} onFocus={onRotationInteractionStart} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) onRotationChange(Math.max(-180, Math.min(180, value))); }} onBlur={onRotationCommit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
          <span className="rotation-degree">°</span>
          <button className="toolbar-mini-button rotation-reset-button" onClick={onResetRotation} title="Reset rotation to 0°" aria-label="Reset rotation to 0 degrees"><RotateCcw size={13} /></button>
        </div>
        <input aria-label="Rotation" type="range" min="-180" max="180" step="1" value={rotation} onChange={(event) => onRotationChange(Number(event.target.value))} onPointerDown={onRotationInteractionStart} onPointerUp={onRotationCommit} onKeyUp={onRotationCommit} />
      </div>
      <div className="toolbar-range zoom-range">
        <div className="toolbar-range-head"><span>Zoom</span><strong>{Math.round(zoom * 100)}%</strong></div>
        <div className="zoom-control-row"><button className="toolbar-mini-button" onClick={() => onZoomPreset(zoom - 0.1)} title="Zoom out" aria-label="Zoom out"><ZoomOut size={14} /></button><input aria-label="Zoom" type="range" min="0.2" max="5" step="0.01" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} /><button className="toolbar-mini-button" onClick={() => onZoomPreset(zoom + 0.1)} title="Zoom in" aria-label="Zoom in"><ZoomIn size={14} /></button></div>
        <div className="zoom-presets"><button className="toolbar-fit-button" onClick={onFit} title="Fit image in canvas" aria-label="Fit image in canvas"><Maximize2 size={11} /> Fit</button><button className={Math.abs(zoom - 0.5) < 0.01 ? 'active' : ''} onClick={() => onZoomPreset(0.5)}>50%</button><button className={Math.abs(zoom - 1) < 0.01 ? 'active' : ''} onClick={() => onZoomPreset(1)}>100%</button><button className={Math.abs(zoom - 2) < 0.01 ? 'active' : ''} onClick={() => onZoomPreset(2)}>200%</button></div>
      </div>
      <div className="toolbar-cluster toolbar-danger-cluster"><button className="toolbar-icon-button toolbar-important-button" onClick={onReset} title="Reset all edits" aria-label="Reset all edits"><RotateCcw size={16} /></button><button className="toolbar-icon-button toolbar-clear-button" onClick={onClear} title="Delete image" aria-label="Delete image"><Trash2 size={16} /></button></div>
    </div>
  );
}
