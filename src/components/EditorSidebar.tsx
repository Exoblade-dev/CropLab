import { Crop, Lock, RotateCcw, StretchHorizontal, Unlock } from 'lucide-react';
import { ASPECT_RATIOS } from '@/lib/image/constants';
import { AspectRatioIcon } from '@/components/AspectRatioIcon';

export type EditorTool = 'crop' | 'resize';
type Props = {
  activeTool: EditorTool | null;
  selectedAspect: number | null;
  cropWidth: number | null;
  cropHeight: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  lockAspectRatio: boolean;
  isLoading: boolean;
  onToolChange: (tool: EditorTool) => void;
  onAspectChange: (value: number | null, label: string) => void;
  onCropReset: () => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onLockToggle: () => void;
};

const activeTools = [
  { id: 'crop' as const, label: 'Crop', hint: 'Frame', icon: Crop },
  { id: 'resize' as const, label: 'Resize', hint: 'Scale', icon: StretchHorizontal },
];

export function EditorSidebar({ activeTool, selectedAspect, cropWidth, cropHeight, outputWidth, outputHeight, lockAspectRatio, isLoading, onToolChange, onAspectChange, onCropReset, onWidthChange, onHeightChange, onLockToggle }: Props) {
  return (
    <aside className="edit-panel" aria-label="Edit workspace">
      <div className="edit-rail">
        <div className="edit-rail-brand" aria-hidden="true">E</div>
        <div className="edit-rail-label">EDIT</div>
        <nav className="edit-rail-tools" aria-label="Editing tools">
          {activeTools.map(({ id, label, hint, icon: Icon }) => (
            <button key={id} type="button" className={`edit-rail-tool ${activeTool === id ? 'active' : ''}`} onClick={() => onToolChange(id)} aria-pressed={activeTool === id} title={`${label} — ${hint}`}>
              <span className="edit-rail-icon"><Icon size={19} /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="edit-inspector">
        <div className="inspector-scroll">
          {activeTool === 'crop' && (
            <section className="inspector-tool" aria-live="polite">
              <div className="inspector-eyebrow">Crop</div>
              <div className="inspector-title-row">
                <div><h2>Frame your image</h2><p>Choose a ratio or create a free crop. Drag directly on the canvas.</p></div>
                <button type="button" className="ghost-action" onClick={onCropReset} disabled={isLoading} title="Reset crop"><RotateCcw size={14} /> Reset</button>
              </div>
              <div className="control-label-row"><span>Aspect ratio</span><span className="control-hint">{selectedAspect === null ? 'Freeform' : 'Fixed frame'}</span></div>
              <div className="aspect-ratio-list">
                {ASPECT_RATIOS.map((ratio) => (
                  <button key={ratio.label} type="button" className={`aspect-btn ${selectedAspect === ratio.value ? 'active' : ''}`} onClick={() => onAspectChange(ratio.value, ratio.label)} aria-label={`Crop ratio ${ratio.label}`} aria-pressed={selectedAspect === ratio.value}>
                    <AspectRatioIcon label={ratio.label} />
                    <span>{ratio.label}</span>
                  </button>
                ))}
              </div>
              <div className="dimension-readout">
                <div><span>Crop size</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)}` : '—'}</strong></div>
                <span>px</span>
              </div>
            </section>
          )}

          {activeTool === 'resize' && (
            <section className="inspector-tool" aria-live="polite">
              <div className="inspector-eyebrow">Resize</div>
              <div className="inspector-title-row"><div><h2>Set output size</h2><p>Resize changes the exported image dimensions. Zoom only changes how you view the canvas.</p></div></div>
              <div className="resize-dimensions">
                <div><label htmlFor="resize-width">Width</label><div className="resize-input-wrap"><input id="resize-width" type="number" min="1" value={outputWidth ?? ''} onChange={(event) => onWidthChange(event.target.value)} disabled={isLoading} /><span>px</span></div></div>
                <span className="resize-times">×</span>
                <div><label htmlFor="resize-height">Height</label><div className="resize-input-wrap"><input id="resize-height" type="number" min="1" value={outputHeight ?? ''} onChange={(event) => onHeightChange(event.target.value)} disabled={isLoading} /><span>px</span></div></div>
              </div>
              <button type="button" className={`resize-lock ${lockAspectRatio ? 'active' : ''}`} onClick={onLockToggle} disabled={isLoading} aria-pressed={lockAspectRatio}>{lockAspectRatio ? <Lock size={14} /> : <Unlock size={14} />} <span>Maintain aspect ratio</span></button>
              <div className="resize-summary"><div><span>Crop</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)}` : '—'}</strong></div><div><span>Output</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '—'}</strong></div></div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
