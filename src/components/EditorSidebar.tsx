import { Crop, RotateCcw, SlidersHorizontal, Sparkles, StretchHorizontal } from 'lucide-react';
import { ASPECT_RATIOS } from '@/lib/image/constants';

export type EditorTool = 'crop' | 'resize' | 'compress' | 'adjust';
type Props = {
  activeTool: EditorTool | null;
  selectedAspect: number | null;
  cropWidth: number | null;
  cropHeight: number | null;
  onToolChange: (tool: EditorTool) => void;
  onAspectChange: (value: number | null, label: string) => void;
  onCropReset: () => void;
};

const tools: { id: EditorTool; label: string; description: string; icon: typeof Crop }[] = [
  { id: 'crop', label: 'Crop', description: 'Frame and aspect ratio', icon: Crop },
  { id: 'resize', label: 'Resize', description: 'Set output dimensions', icon: StretchHorizontal },
  { id: 'compress', label: 'Compress', description: 'Reduce file weight', icon: Sparkles },
  { id: 'adjust', label: 'Adjust', description: 'Tune image appearance', icon: SlidersHorizontal },
];

export function EditorSidebar({ activeTool, selectedAspect, cropWidth, cropHeight, onToolChange, onAspectChange, onCropReset }: Props) {
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
        {activeTool === 'resize' && <ToolNotice title="Resize" body="Set exact output width and height in the Export panel. With the lock enabled, changing either value derives the other immediately." />}
        {activeTool === 'compress' && <ToolNotice title="Compress" body="Choose JPEG or WebP and tune quality in the Export panel. Output settings remain visible while you edit." />}
        {activeTool === 'adjust' && <ToolNotice title="Adjust" body="Brightness, contrast, saturation, exposure, blur, and sharpen controls are reserved for the next adjustment pass." disabled />}
      </div>
    </aside>
  );
}

function ToolNotice({ title, body, disabled = false }: { title: string; body: string; disabled?: boolean }) {
  return <div className={`tool-detail-section ${disabled ? 'is-muted' : ''}`}><div className="detail-kicker">{title}</div><h2>{title === 'Adjust' ? 'Visual adjustments' : 'Use the export panel'}</h2><p>{body}</p>{disabled && <span className="coming-soon">Next adjustment pass</span>}</div>;
}
