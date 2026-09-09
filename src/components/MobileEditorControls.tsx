import { Crop, FlipHorizontal, History, MoreHorizontal, RotateCw, RotateCcw, Trash2, Undo2, Redo2, X, ZoomIn, ZoomOut, FileInput, RotateCcw as ResetIcon } from 'lucide-react';
import { ASPECT_RATIOS } from '@/lib/image/constants';
import type { EditorTool } from '@/components/EditorSidebar';

type Panel = EditorTool | 'more' | 'export' | null;

type Props = {
  panel: Panel;
  selectedAspect: number | null;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  onPanelChange: (panel: Panel) => void;
  onAspectChange: (value: number | null, label: string) => void;
  onCropReset: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onZoomPreset: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onHistory: () => void;
  onReplace: () => void;
  onClear: () => void;
  onReset: () => void;
};

export function MobileEditorControls({
  panel,
  selectedAspect,
  zoom,
  canUndo,
  canRedo,
  onPanelChange,
  onAspectChange,
  onCropReset,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
  onZoomPreset,
  onUndo,
  onRedo,
  onHistory,
  onReplace,
  onClear,
  onReset,
}: Props) {
  const closePanel = () => onPanelChange(null);

  return (
    <>
      {panel && panel !== 'export' && (
        <section className="mobile-control-sheet" aria-label="Mobile editor controls">
          <div className="mobile-sheet-header">
            <strong>{panel === 'crop' ? 'Crop' : 'More controls'}</strong>
            <button className="mobile-icon-button" onClick={closePanel} aria-label="Close controls"><X size={18} /></button>
          </div>

          {panel === 'crop' && (
            <div className="mobile-crop-controls">
              <div className="mobile-section-label">Aspect ratio</div>
              <div className="mobile-aspect-grid">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.label}
                    className={`mobile-aspect-button ${selectedAspect === ratio.value ? 'active' : ''}`}
                    onClick={() => onAspectChange(ratio.value, ratio.label)}
                    aria-pressed={selectedAspect === ratio.value}
                  >
                    <span className={`ratio-preview ${ratio.value === null ? 'free' : ''}`} style={ratio.value ? { aspectRatio: String(ratio.value) } : undefined} />
                    <span>{ratio.label}</span>
                  </button>
                ))}
              </div>
              <button className="mobile-secondary-button" onClick={onCropReset}><ResetIcon size={15} /> Reset crop</button>
            </div>
          )}

          {panel === 'more' && (
            <div className="mobile-more-controls">
              <div className="mobile-control-grid">
                <button className="mobile-control-button" onClick={onUndo} disabled={!canUndo}><Undo2 size={17} /><span>Undo</span></button>
                <button className="mobile-control-button" onClick={onRedo} disabled={!canRedo}><Redo2 size={17} /><span>Redo</span></button>
                <button className="mobile-control-button" onClick={onHistory}><History size={17} /><span>History</span></button>
                <button className="mobile-control-button" onClick={onReplace}><FileInput size={17} /><span>Replace</span></button>
                <button className="mobile-control-button" onClick={onClear}><Trash2 size={17} /><span>Clear</span></button>
                <button className="mobile-control-button" onClick={onReset}><ResetIcon size={17} /><span>Reset</span></button>
              </div>
              <div className="mobile-section-label">Zoom · {Math.round(zoom * 100)}%</div>
              <div className="mobile-zoom-row">
                <button className="mobile-icon-button" onClick={() => onZoomPreset(zoom - 0.1)} aria-label="Zoom out"><ZoomOut size={18} /></button>
                <button className="mobile-secondary-button" onClick={() => onZoomPreset(0.2)}>Fit</button>
                <button className="mobile-secondary-button" onClick={() => onZoomPreset(1)}>100%</button>
                <button className="mobile-secondary-button" onClick={() => onZoomPreset(2)}>200%</button>
                <button className="mobile-icon-button" onClick={() => onZoomPreset(zoom + 0.1)} aria-label="Zoom in"><ZoomIn size={18} /></button>
              </div>
              <div className="mobile-flip-row">
                <button className="mobile-secondary-button" onClick={onFlipHorizontal}><FlipHorizontal size={15} /> Flip H</button>
                <button className="mobile-secondary-button" onClick={onFlipVertical}><FlipHorizontal size={15} className="flip-vertical-icon" /> Flip V</button>
                <button className="mobile-secondary-button" onClick={onRotateLeft} aria-label="Rotate left 90 degrees"><RotateCcw size={15} /> Rotate left</button>
                <button className="mobile-secondary-button" onClick={onRotateRight} aria-label="Rotate right 90 degrees"><RotateCw size={15} /> Rotate right</button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mobile-quick-bar" aria-label="Quick editor controls">
        <button className="mobile-quick-button" onClick={onUndo} disabled={!canUndo} aria-label="Undo last edit" title="Undo">
          <Undo2 size={16} />
        </button>
        <button className="mobile-quick-button" onClick={onRedo} disabled={!canRedo} aria-label="Redo last edit" title="Redo">
          <Redo2 size={16} />
        </button>
        <span className="mobile-quick-divider" aria-hidden="true" />
        <button className="mobile-quick-button" onClick={() => onZoomPreset(zoom - 0.1)} aria-label="Zoom out" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button className="mobile-quick-value" onClick={() => onZoomPreset(0.2)} aria-label="Fit image" title="Fit image">Fit</button>
        <button className={`mobile-quick-value ${Math.abs(zoom - 1) < 0.01 ? 'active' : ''}`} onClick={() => onZoomPreset(1)} aria-label="Zoom to 100 percent" title="100 percent">100%</button>
        <button className="mobile-quick-button" onClick={() => onZoomPreset(zoom + 0.1)} aria-label="Zoom in" title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <span className="mobile-quick-zoom" aria-live="polite">{Math.round(zoom * 100)}%</span>
      </div>

      <nav className="mobile-bottom-bar" aria-label="Mobile editor controls">
        <button className={panel === 'crop' ? 'active' : ''} onClick={() => onPanelChange(panel === 'crop' ? null : 'crop')} aria-pressed={panel === 'crop'}><Crop size={18} /><span>Crop</span></button>
        <button onClick={onRotateRight} aria-label="Rotate right 90 degrees"><RotateCw size={18} /><span>Rotate</span></button>
        <button onClick={onFlipHorizontal} aria-label="Flip horizontal"><FlipHorizontal size={18} /><span>Flip</span></button>
        <button className={panel === 'more' ? 'active' : ''} onClick={() => onPanelChange(panel === 'more' ? null : 'more')} aria-pressed={panel === 'more'}><MoreHorizontal size={18} /><span>More</span></button>
        <button className={panel === 'export' ? 'active' : ''} onClick={() => onPanelChange(panel === 'export' ? null : 'export')} aria-pressed={panel === 'export'}><span className="mobile-export-icon">↓</span><span>Export</span></button>
      </nav>
    </>
  );
}
