import { Crop, FlipHorizontal, History, MoreHorizontal, RotateCw, RotateCcw, Trash2, Undo2, Redo2, X, ZoomIn, ZoomOut, FileInput, RotateCcw as ResetIcon, StretchHorizontal, Lock, Unlock } from 'lucide-react';
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
  outputWidth: number | null;
  outputHeight: number | null;
  lockAspectRatio: boolean;
  isLoading: boolean;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onLockToggle: () => void;
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
  outputWidth,
  outputHeight,
  lockAspectRatio,
  isLoading,
  onWidthChange,
  onHeightChange,
  onLockToggle,
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
            <strong>{panel === 'crop' ? 'Crop' : panel === 'resize' ? 'Resize' : 'More controls'}</strong>
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

          {panel === 'resize' && (
            <div className="mobile-resize-controls">
              <p>Set the exact pixel dimensions for the exported image.</p>
              <div className="mobile-resize-dimensions">
                <div>
                  <label htmlFor="mobile-resize-width">Width</label>
                  <input id="mobile-resize-width" type="number" min="1" value={outputWidth ?? ''} onChange={(event) => onWidthChange(event.target.value)} disabled={isLoading} />
                </div>
                <span>×</span>
                <div>
                  <label htmlFor="mobile-resize-height">Height</label>
                  <input id="mobile-resize-height" type="number" min="1" value={outputHeight ?? ''} onChange={(event) => onHeightChange(event.target.value)} disabled={isLoading} />
                </div>
              </div>
              <button type="button" className={`mobile-resize-lock ${lockAspectRatio ? 'active' : ''}`} onClick={onLockToggle} disabled={isLoading} aria-pressed={lockAspectRatio}>
                {lockAspectRatio ? <Lock size={14} /> : <Unlock size={14} />} Maintain aspect ratio
              </button>
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
        <button className="mobile-quick-button" onClick={onRotateLeft} aria-label="Rotate left 90 degrees" title="Rotate left 90 degrees">
          <RotateCcw size={16} />
        </button>
        <button className="mobile-quick-button" onClick={onRotateRight} aria-label="Rotate right 90 degrees" title="Rotate right 90 degrees">
          <RotateCw size={16} />
        </button>
        <span className="mobile-quick-divider" aria-hidden="true" />
        <button className="mobile-quick-button" onClick={onFlipHorizontal} aria-label="Flip horizontally" title="Flip horizontal">
          <FlipHorizontal size={16} />
        </button>
        <button className="mobile-quick-button" onClick={onFlipVertical} aria-label="Flip vertically" title="Flip vertical">
          <FlipHorizontal size={16} className="flip-vertical-icon" />
        </button>
        <span className="mobile-quick-divider" aria-hidden="true" />
        <button className="mobile-quick-button" onClick={() => onZoomPreset(zoom + 0.1)} aria-label="Zoom in" title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button className="mobile-quick-button" onClick={() => onZoomPreset(zoom - 0.1)} aria-label="Zoom out" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button className={`mobile-quick-value ${Math.abs(zoom - 1) < 0.01 ? 'active' : ''}`} onClick={() => onZoomPreset(1)} aria-label="Zoom to 100 percent" title="100 percent">100%</button>
      </div>

      <nav className="mobile-bottom-bar" aria-label="Mobile editor controls" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <button className={panel === 'crop' ? 'active' : ''} onClick={() => onPanelChange(panel === 'crop' ? null : 'crop')} aria-pressed={panel === 'crop'}><Crop size={18} /><span>Crop</span></button>
        <button className={panel === 'resize' ? 'active' : ''} onClick={() => onPanelChange(panel === 'resize' ? null : 'resize')} aria-pressed={panel === 'resize'}><StretchHorizontal size={18} /><span>Resize</span></button>
        <button className={panel === 'more' ? 'active' : ''} onClick={() => onPanelChange(panel === 'more' ? null : 'more')} aria-pressed={panel === 'more'}><MoreHorizontal size={18} /><span>More</span></button>
        <button className={panel === 'export' ? 'active' : ''} onClick={() => onPanelChange(panel === 'export' ? null : 'export')} aria-pressed={panel === 'export'}><span className="mobile-export-icon">↓</span><span>Export</span></button>
      </nav>
    </>
  );
}
