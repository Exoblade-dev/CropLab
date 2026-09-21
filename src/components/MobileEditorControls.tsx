import { Crop, Download, FlipHorizontal, History, MoreHorizontal, SlidersHorizontal, RotateCw, RotateCcw, Trash2, Undo2, Redo2, X, ZoomIn, ZoomOut, RotateCcw as ResetIcon, StretchHorizontal, Lock, Unlock, Maximize2 } from 'lucide-react';
import { ASPECT_RATIOS } from '@/lib/image/constants';
import { AspectRatioIcon } from '@/components/AspectRatioIcon';
import type { EditorTool } from '@/components/EditorSidebar';
import type { AdjustmentState } from '@/types/editor';
import { AdjustmentControls } from '@/components/AdjustmentControls';

type Panel = EditorTool | 'more' | null;
type Props = {
  panel: Panel; selectedAspect: number | null; zoom: number; canUndo: boolean; canRedo: boolean;
  onPanelChange: (panel: Panel) => void; onExport: () => void; onAspectChange: (value: number | null, label: string) => void; onCropReset: () => void;
  outputWidth: number | null; outputHeight: number | null; lockAspectRatio: boolean; isLoading: boolean;
  onWidthChange: (value: string) => void; onHeightChange: (value: string) => void; onLockToggle: () => void;
  onRotateLeft: () => void; onRotateRight: () => void; onFlipHorizontal: () => void; onZoomPreset: (value: number) => void; onFit: () => void;
  onUndo: () => void; onRedo: () => void; onHistory: () => void; onClear: () => void; onReset: () => void;
  adjustments: AdjustmentState; onAdjustmentChange: (key: keyof AdjustmentState, value: number) => void; onAdjustmentCommit: (key: keyof AdjustmentState) => void; onAdjustmentsReset: () => void;
};

export function MobileEditorControls({ panel, selectedAspect, zoom, canUndo, canRedo, onPanelChange, onExport, onAspectChange, onCropReset, outputWidth, outputHeight, lockAspectRatio, isLoading, onWidthChange, onHeightChange, onLockToggle, onRotateLeft, onRotateRight, onFlipHorizontal, onZoomPreset, onFit, onUndo, onRedo, onHistory, onClear, onReset, adjustments, onAdjustmentChange, onAdjustmentCommit, onAdjustmentsReset }: Props) {
  const closePanel = () => onPanelChange(null);
  return (
    <>
      {panel && <section className="mobile-control-sheet" aria-label="Mobile editor controls">
        <header className="mobile-sheet-header">
          <div><span className="mobile-sheet-kicker">Edit</span><strong>{panel === 'crop' ? 'Crop' : panel === 'resize' ? 'Resize' : panel === 'adjust' ? 'Adjust' : 'More controls'}</strong></div>
          <button className="mobile-icon-button" onClick={closePanel} aria-label="Close controls"><X size={17} /></button>
        </header>
        {panel === 'crop' && <div className="mobile-crop-controls"><div className="mobile-section-label"><span>Aspect ratio</span><small>{selectedAspect === null ? 'Freeform' : 'Fixed'}</small></div><div className="mobile-aspect-grid">{ASPECT_RATIOS.map((ratio) => <button key={ratio.label} className={`mobile-aspect-button ${selectedAspect === ratio.value ? 'active' : ''}`} onClick={() => onAspectChange(ratio.value, ratio.label)} aria-pressed={selectedAspect === ratio.value}><AspectRatioIcon label={ratio.label} /><span>{ratio.label}</span></button>)}</div><button className="mobile-secondary-button" onClick={onCropReset}><ResetIcon size={14} /> Reset crop</button></div>}
        {panel === 'adjust' && <div className="mobile-adjust-controls"><AdjustmentControls compact adjustments={adjustments} isLoading={isLoading} onChange={onAdjustmentChange} onCommit={onAdjustmentCommit} onReset={onAdjustmentsReset} /></div>}
        {panel === 'resize' && <div className="mobile-resize-controls"><p>Set the final pixel dimensions. Keep the lock on to preserve the crop ratio.</p><div className="mobile-resize-dimensions"><div><label htmlFor="mobile-resize-width">Width</label><input id="mobile-resize-width" type="number" min="1" value={outputWidth ?? ''} onChange={(event) => onWidthChange(event.target.value)} disabled={isLoading} /></div><span>×</span><div><label htmlFor="mobile-resize-height">Height</label><input id="mobile-resize-height" type="number" min="1" value={outputHeight ?? ''} onChange={(event) => onHeightChange(event.target.value)} disabled={isLoading} /></div></div><button type="button" className={`mobile-resize-lock ${lockAspectRatio ? 'active' : ''}`} onClick={onLockToggle} disabled={isLoading} aria-pressed={lockAspectRatio}>{lockAspectRatio ? <Lock size={14} /> : <Unlock size={14} />} Maintain aspect ratio</button></div>}
        {panel === 'more' && <div className="mobile-more-controls"><div className="mobile-control-grid"><button className="mobile-control-button" onClick={onUndo} disabled={!canUndo}><Undo2 size={17} /><span>Undo</span></button><button className="mobile-control-button" onClick={onRedo} disabled={!canRedo}><Redo2 size={17} /><span>Redo</span></button><button className="mobile-control-button" onClick={onHistory}><History size={17} /><span>History</span></button><button className="mobile-control-button mobile-important-button" onClick={onReset}><ResetIcon size={17} /><span>Reset</span></button><button className="mobile-control-button mobile-danger-button" onClick={onClear}><Trash2 size={17} /><span>Delete</span></button></div></div>}
      </section>}

      <div className="mobile-quick-bar" aria-label="Quick editor controls">
        <button className="mobile-quick-button" onClick={onUndo} disabled={!canUndo} aria-label="Undo last edit"><Undo2 size={16} /></button>
        <button className="mobile-quick-button" onClick={onRedo} disabled={!canRedo} aria-label="Redo last edit"><Redo2 size={16} /></button>
        <span className="mobile-quick-divider" />
        <button className="mobile-quick-button" onClick={onRotateLeft} aria-label="Rotate left 90 degrees"><RotateCcw size={16} /></button>
        <button className="mobile-quick-button" onClick={onRotateRight} aria-label="Rotate right 90 degrees"><RotateCw size={16} /></button>
        <button className="mobile-quick-button" onClick={onFlipHorizontal} aria-label="Flip horizontally"><FlipHorizontal size={16} /></button>
                <span className="mobile-quick-divider" />
        <button className="mobile-quick-button" onClick={() => onZoomPreset(zoom - 0.1)} aria-label="Zoom out"><ZoomOut size={16} /></button>
        <button className="mobile-quick-button" onClick={() => onZoomPreset(zoom + 0.1)} aria-label="Zoom in"><ZoomIn size={16} /></button>
        <button className="mobile-quick-value" onClick={onFit} aria-label="Fit image in canvas"><Maximize2 size={13} /></button><button className={`mobile-quick-value ${Math.abs(zoom - 0.5) < 0.01 ? 'active' : ''}`} onClick={() => onZoomPreset(0.5)} aria-label="Zoom to 50 percent">50%</button><button className={`mobile-quick-value ${Math.abs(zoom - 1) < 0.01 ? 'active' : ''}`} onClick={() => onZoomPreset(1)} aria-label="Zoom to 100 percent">100%</button><button className={`mobile-quick-value ${Math.abs(zoom - 2) < 0.01 ? 'active' : ''}`} onClick={() => onZoomPreset(2)} aria-label="Zoom to 200 percent">200%</button>
      </div>

      <nav className="mobile-bottom-bar" aria-label="Mobile editor navigation">
        <button className={panel === 'crop' ? 'active' : ''} onClick={() => onPanelChange(panel === 'crop' ? null : 'crop')} aria-pressed={panel === 'crop'}><Crop size={18} /><span>Crop</span></button>
        <button className={panel === 'resize' ? 'active' : ''} onClick={() => onPanelChange(panel === 'resize' ? null : 'resize')} aria-pressed={panel === 'resize'}><StretchHorizontal size={18} /><span>Resize</span></button>
        <button className={panel === 'adjust' ? 'active' : ''} onClick={() => onPanelChange(panel === 'adjust' ? null : 'adjust')} aria-pressed={panel === 'adjust'}><SlidersHorizontal size={18} /><span>Adjust</span></button>
        <button className={panel === 'more' ? 'active' : ''} onClick={() => onPanelChange(panel === 'more' ? null : 'more')} aria-pressed={panel === 'more'}><MoreHorizontal size={18} /><span>More</span></button>
        <button type="button" onClick={onExport}><Download size={18} /><span>Export</span></button>
      </nav>
    </>
  );
}
