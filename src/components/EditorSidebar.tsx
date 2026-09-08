import { FlipHorizontal, FlipVertical, Lock, Unlock, ZoomIn, ZoomOut } from 'lucide-react';
import { ASPECT_RATIOS } from '@/lib/image/constants';

type Props = {
  selectedAspect: number | null;
  zoom: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  lockAspectRatio: boolean;
  onAspectChange: (value: number | null, label: string) => void;
  onZoomChange: (value: number) => void;
  onZoomCommit: () => void;
  onRotationChange: (value: number) => void;
  onRotationCommit: () => void;
  onFlip: (axis: 'x' | 'y') => void;
  onLockToggle: () => void;
};

export function EditorSidebar({
  selectedAspect,
  zoom,
  rotation,
  flipX,
  flipY,
  lockAspectRatio,
  onAspectChange,
  onZoomChange,
  onZoomCommit,
  onRotationChange,
  onRotationCommit,
  onFlip,
  onLockToggle,
}: Props) {
  return (
    <aside className="editor-sidebar" aria-label="Editor controls">
      <div className="sidebar-heading">
        <div>
          <span className="eyebrow">Adjust</span>
          <h2>Image controls</h2>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Aspect ratio</h3>
        <div className="aspect-ratio-list">
          {ASPECT_RATIOS.map((ratio) => (
            <button key={ratio.label} className={`aspect-btn ${selectedAspect === ratio.value ? 'active' : ''}`} onClick={() => onAspectChange(ratio.value, ratio.label)}>
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="control-heading"><h3>Zoom</h3><span>{Math.round(zoom * 100)}%</span></div>
        <div className="range-row">
          <button className="zoom-btn" onClick={() => { onZoomCommit(); onZoomChange(Math.max(0.1, zoom - 0.1)); }} title="Zoom out" aria-label="Zoom out"><ZoomOut size={15} /></button>
          <input type="range" min="0.1" max="5" step="0.05" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} onPointerDown={onZoomCommit} aria-label="Zoom level" />
          <button className="zoom-btn" onClick={() => { onZoomCommit(); onZoomChange(Math.min(5, zoom + 0.1)); }} title="Zoom in" aria-label="Zoom in"><ZoomIn size={15} /></button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="control-heading"><h3>Rotation</h3><span>{rotation}°</span></div>
        <input className="full-range" type="range" min="-180" max="180" step="1" value={rotation} onChange={(event) => onRotationChange(Number(event.target.value))} onPointerDown={onRotationCommit} aria-label="Rotation" />
      </div>

      <div className="sidebar-section">
        <div className="control-heading"><h3>Flip</h3><span>Axis</span></div>
        <div className="flip-toggle-group">
          <button className={`flip-action ${flipX ? 'active' : ''}`} onClick={() => onFlip('x')}><FlipHorizontal size={15} /> Horizontal</button>
          <button className={`flip-action ${flipY ? 'active' : ''}`} onClick={() => onFlip('y')}><FlipVertical size={15} /> Vertical</button>
        </div>
      </div>

      <div className="sidebar-section sidebar-lock">
        <button className="lock-control" onClick={onLockToggle} aria-label={lockAspectRatio ? 'Unlock export aspect ratio' : 'Lock export aspect ratio'}>
          {lockAspectRatio ? <Lock size={15} /> : <Unlock size={15} />}
          <span>{lockAspectRatio ? 'Output ratio locked' : 'Output ratio unlocked'}</span>
        </button>
      </div>
    </aside>
  );
}
