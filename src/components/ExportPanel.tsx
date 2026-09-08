import { Download } from 'lucide-react';
import type { ImageFormat } from '@/types/editor';

type Props = {
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
  cropWidth: number | null;
  cropHeight: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  format: ImageFormat;
  quality: number;
  width: number | null;
  height: number | null;
  lockAspectRatio: boolean;
  isLoading: boolean;
  onFormatChange: (format: ImageFormat) => void;
  onQualityChange: (quality: number) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onLockToggle: () => void;
  onDownload: () => void;
};

export function ExportPanel({
  originalWidth,
  originalHeight,
  fileSize,
  cropWidth,
  cropHeight,
  outputWidth,
  outputHeight,
  format,
  quality,
  width,
  height,
  lockAspectRatio,
  isLoading,
  onFormatChange,
  onQualityChange,
  onWidthChange,
  onHeightChange,
  onLockToggle,
  onDownload,
}: Props) {
  return (
    <section className="export-section" aria-label="Export image">
      <div className="export-heading">
        <div><span className="eyebrow">Output</span><h2>Export image</h2></div>
        <span className="export-note">Processed locally</span>
      </div>
      <div className="image-info">
        <div className="info-item"><span className="info-label">Original</span><strong>{originalWidth} × {originalHeight}</strong></div>
        <div className="info-item"><span className="info-label">Crop</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)}` : '--'}</strong></div>
        <div className="info-item"><span className="info-label">Output</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '--'}</strong></div>
        <div className="info-item"><span className="info-label">Source size</span><strong>{(fileSize / 1024).toFixed(1)} KB</strong></div>
      </div>
      <div className="export-controls">
        <div className="format-group"><label htmlFor="format-select">Format</label><select id="format-select" value={format} onChange={(event) => onFormatChange(event.target.value as ImageFormat)}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></select></div>
        {format !== 'png' && <div className="quality-group"><label htmlFor="quality-slider">Quality <span>{Math.round(quality * 100)}%</span></label><input type="range" id="quality-slider" min="0.1" max="1" step="0.01" value={quality} onChange={(event) => onQualityChange(Number(event.target.value))} /></div>}
        <div className="dimensions-group"><label>Dimensions (px)</label><div className="dimensions-inputs"><input type="number" placeholder="Width" value={width ?? ''} onChange={(event) => onWidthChange(event.target.value)} min="1" className="dimension-input" aria-label="Custom width" /><button className={`lock-btn ${lockAspectRatio ? 'active' : ''}`} onClick={onLockToggle} title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'} aria-label={lockAspectRatio ? 'Unlock' : 'Lock aspect ratio'}>{lockAspectRatio ? 'Lock' : 'Free'}</button><input type="number" placeholder="Height" value={height ?? ''} onChange={(event) => onHeightChange(event.target.value)} min="1" className="dimension-input" aria-label="Custom height" /></div></div>
      </div>
      <button className="download-btn" onClick={onDownload} disabled={isLoading || !cropWidth || !cropHeight}>{isLoading ? 'Processing…' : <><Download size={17} /> Download image</>}</button>
    </section>
  );
}
