import { ArrowRight, Crop, Lock, RotateCcw, StretchHorizontal, Unlock } from 'lucide-react';
import { ExportPreview } from '@/components/ExportPreview';
import type { ExportStatus, ImageFormat } from '@/types/editor';
import { ASPECT_RATIOS } from '@/lib/image/constants';

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
  previewUrl: string | null;
  previewStatus: ExportStatus;
  previewSize: number | null;
  format: ImageFormat;
  quality: number;
  backgroundColor: string;
};

const tools: { id: EditorTool; label: string; description: string; icon: typeof Crop }[] = [
  { id: 'crop', label: 'Crop', description: 'Frame and aspect ratio', icon: Crop },
  { id: 'resize', label: 'Resize', description: 'Set output dimensions', icon: StretchHorizontal },
];

const comingSoonTools = [
  'Compress',
  'Adjust',
  'Presets',
  'Background Removal',
  'OCR / Image to Text',
  'Batch Processing',
] as const;

export function EditorSidebar({ activeTool, selectedAspect, cropWidth, cropHeight, outputWidth, outputHeight, lockAspectRatio, isLoading, onToolChange, onAspectChange, onCropReset, onWidthChange, onHeightChange, onLockToggle, previewUrl, previewStatus, previewSize, format, quality, backgroundColor }: Props) {
  return (
    <aside className="tools-panel" aria-label="Primary editing tools">
      <div className="panel-label">Edit</div>
      <nav className="tool-list" aria-label="Editing sections">
        {tools.map(({ id, label, description, icon: Icon }) => (
          <button key={id} className={`tool-item ${activeTool === id ? 'active' : ''}`} onClick={() => onToolChange(id)} aria-pressed={activeTool === id}>
            <span className="tool-icon"><Icon size={17} /></span>
            <span><strong>{label}</strong><small>{description}</small></span>
          </button>
        ))}
      </nav>
      <div className="tool-detail">
        {activeTool === 'crop' && (
          <div className="tool-detail-section">
            <div className="detail-kicker">Crop</div>
            <div className="detail-heading-row"><div><h2>Crop frame</h2><p>Drag the image or crop edges. Choose a ratio or stay free.</p></div><button className="icon-text-btn" onClick={onCropReset} title="Reset crop" aria-label="Reset crop"><RotateCcw size={13} /> Reset</button></div>
            <div className="aspect-ratio-list">
              {ASPECT_RATIOS.map((ratio) => (
                <button key={ratio.label} className={`aspect-btn ${selectedAspect === ratio.value ? 'active' : ''}`} onClick={() => onAspectChange(ratio.value, ratio.label)} aria-label={`Crop ratio ${ratio.label}`}>
                  <span className={`ratio-preview ${ratio.value === null ? 'free' : ''}`} style={ratio.value ? { aspectRatio: String(ratio.value) } : undefined} />
                  <span>{ratio.label}</span>
                </button>
              ))}
            </div>
            <div className="crop-dimensions"><span>Crop dimensions</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)} px` : '—'}</strong></div>
          </div>
        )}
        {activeTool === 'resize' && (
          <div className="tool-detail-section">
            <div className="detail-kicker">Resize</div>
            <div className="detail-heading-row">
              <div><h2>Output dimensions</h2><p>Set the exact pixel dimensions for the exported image.</p></div>
            </div>
            <div className="resize-dimensions">
              <div>
                <label htmlFor="resize-width">Width</label>
                <div className="resize-input-wrap"><input id="resize-width" type="number" min="1" value={outputWidth ?? ''} onChange={(event) => onWidthChange(event.target.value)} disabled={isLoading} /><span>px</span></div>
              </div>
              <span className="resize-times">×</span>
              <div>
                <label htmlFor="resize-height">Height</label>
                <div className="resize-input-wrap"><input id="resize-height" type="number" min="1" value={outputHeight ?? ''} onChange={(event) => onHeightChange(event.target.value)} disabled={isLoading} /><span>px</span></div>
              </div>
            </div>
            <button type="button" className={`resize-lock ${lockAspectRatio ? 'active' : ''}`} onClick={onLockToggle} disabled={isLoading} aria-pressed={lockAspectRatio}>
              {lockAspectRatio ? <Lock size={13} /> : <Unlock size={13} />} Maintain aspect ratio
            </button>
            <div className="resize-dimension-meta">
              <span>Crop</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)} px` : '—'}</strong>
              <span>Output</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : '—'}</strong>
            </div>
          </div>
        )}
      </div>
      <div className="tool-workflow" aria-label="Editing workflow">
        <ExportPreview
          previewUrl={previewUrl}
          previewStatus={previewStatus}
          previewSize={previewSize}
          outputWidth={outputWidth}
          outputHeight={outputHeight}
          format={format}
          quality={quality}
          backgroundColor={backgroundColor}
          disabled={isLoading}
        />
        <div className="tool-workflow-heading">
          <span className="tool-workflow-kicker">Workflow</span>
          <span className="tool-workflow-step">{activeTool === 'crop' ? '1 of 3' : '2 of 3'}</span>
        </div>
        <div className="tool-workflow-path" aria-label="Crop, Resize, Export workflow">
          <span className={activeTool === 'crop' ? 'current' : 'complete'}>Crop</span>
          <ArrowRight size={11} aria-hidden="true" />
          <span className={activeTool === 'resize' ? 'current' : ''}>Resize</span>
          <ArrowRight size={11} aria-hidden="true" />
          <span>Export</span>
        </div>
        <p>{activeTool === 'crop' ? 'Frame the image first, then set the final pixel dimensions in Resize.' : 'Set the final pixel dimensions here, then choose format and quality in Export.'}</p>
        <div className="tool-coming-soon" aria-label="Additional tools coming soon">
          <span className="tool-coming-soon-label">More tools</span>
          <span className="tool-coming-soon-count">{comingSoonTools.length} coming soon</span>
        </div>
      </div>
    </aside>
  );
}

