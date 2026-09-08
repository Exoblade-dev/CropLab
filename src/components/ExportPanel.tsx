import { Download, Lock, Unlock } from 'lucide-react';
import { formatFileSize, getSizeReductionPercent } from '@/lib/image/export';
import type { ExportFormatDefinition } from '@/lib/image/formats';
import type { ExportStatus, ImageFormat } from '@/types/editor';

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
  backgroundColor: string;
  estimatedSize: number | null;
  exportStatus: ExportStatus;
  supportedFormats: ExportFormatDefinition[];
  isLoading: boolean;
  onFormatChange: (format: ImageFormat) => void;
  onQualityChange: (quality: number) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onLockToggle: () => void;
  onBackgroundChange: (color: string) => void;
  onDownload: () => void;
};

const STATUS_LABELS: Record<ExportStatus, string> = {
  idle: 'Ready',
  preparing: 'Preparing…',
  cropping: 'Cropping…',
  resizing: 'Resizing…',
  encoding: 'Encoding…',
  downloading: 'Downloading…',
  complete: 'Complete',
  error: 'Export failed',
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
  backgroundColor,
  estimatedSize,
  exportStatus,
  supportedFormats,
  isLoading,
  onFormatChange,
  onQualityChange,
  onWidthChange,
  onHeightChange,
  onLockToggle,
  onBackgroundChange,
  onDownload,
}: Props) {
  const activeFormat = supportedFormats.find((item) => item.id === format);
  const reduction = estimatedSize === null ? null : getSizeReductionPercent(fileSize, estimatedSize);
  const isEncoding = exportStatus === 'preparing' || exportStatus === 'cropping' || exportStatus === 'resizing' || exportStatus === 'encoding';
  const qualityPercent = Math.round(quality * 100);

  return (
    <aside className="export-panel" aria-label="Export controls">
      <div className="panel-heading">
        <div><div className="panel-label">Export</div><h2>Output</h2></div>
        <span className="local-badge">Local</span>
      </div>

      <section className="export-section-block">
        <label htmlFor="format-select">Format</label>
        <select id="format-select" value={format} onChange={(event) => onFormatChange(event.target.value as ImageFormat)}>
          {supportedFormats.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <small>{activeFormat?.label ?? 'Selected format'} is encoded by the browser before download. Unsupported browser encoders are not offered.</small>
      </section>

      {activeFormat?.supportsQuality && (
        <section className="export-section-block">
          <div className="section-label-row"><label htmlFor="quality-slider">Quality</label><span>{qualityPercent}%</span></div>
          <input className="export-range" type="range" id="quality-slider" min="0.2" max="1" step="0.01" value={quality} onChange={(event) => onQualityChange(Number(event.target.value))} disabled={isLoading} />
          <div className="quality-scale" aria-hidden="true"><span>Low</span><span>Medium</span><span>Best</span></div>
          <div className="quality-scale quality-values" aria-hidden="true"><span>20%</span><span>50%</span><span>100%</span></div>
          <small>Quality controls encoder quality; it does not target an exact file-size percentage.</small>
        </section>
      )}

      {activeFormat?.supportsBackground && (
        <section className="export-section-block">
          <div className="section-label-row"><label htmlFor="jpeg-background">Background</label><span>JPEG has no transparency</span></div>
          <div className="background-control">
            <input id="jpeg-background" type="color" value={backgroundColor} onChange={(event) => onBackgroundChange(event.target.value)} disabled={isLoading} />
            <span>{backgroundColor.toUpperCase()}</span>
          </div>
          <small>Transparent pixels are composited onto this color before JPEG encoding.</small>
        </section>
      )}

      <section className="export-section-block">
        <div className="section-label-row">
          <label>Dimensions</label>
          <button className={`mini-lock ${lockAspectRatio ? 'active' : ''}`} onClick={onLockToggle} title={lockAspectRatio ? 'Unlock aspect ratio' : 'Maintain aspect ratio'} aria-label={lockAspectRatio ? 'Unlock aspect ratio' : 'Maintain aspect ratio'}>
            {lockAspectRatio ? <Lock size={13} /> : <Unlock size={13} />}{lockAspectRatio ? 'Locked' : 'Free'}
          </button>
        </div>
        <div className="dimension-stack">
          <div><label className="dimension-label" htmlFor="output-width">Width</label><input id="output-width" type="number" value={width ?? ''} onChange={(event) => onWidthChange(event.target.value)} min="1" aria-label="Output width in pixels" /></div>
          <span>×</span>
          <div><label className="dimension-label" htmlFor="output-height">Height</label><input id="output-height" type="number" value={height ?? ''} onChange={(event) => onHeightChange(event.target.value)} min="1" aria-label="Output height in pixels" /></div>
        </div>
        <small>{lockAspectRatio ? 'Changing width or height immediately derives the other dimension.' : 'Width and height can be set independently.'}</small>
      </section>

      <section className="export-stats">
        <div><span>Original</span><strong>{formatFileSize(fileSize)}</strong></div>
        <div><span>Estimated output</span><strong>{formatFileSize(estimatedSize)}</strong></div>
        <div><span>Crop</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)}` : '--'}</strong></div>
        <div><span>Output</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '--'}</strong></div>
        <div><span>Source</span><strong>{originalWidth} × {originalHeight}</strong></div>
        <div><span>Compression</span><strong>{reduction === null ? '--' : reduction > 0 ? `${reduction}% smaller` : reduction < 0 ? `${Math.abs(reduction)}% larger` : 'Same size'}</strong></div>
      </section>

      <div className={`export-status export-status-${exportStatus}`} role="status" aria-live="polite">
        <span className="export-status-dot" />
        <span>{isEncoding && format === 'webp' && exportStatus === 'encoding' ? 'Encoding WebP…' : STATUS_LABELS[exportStatus]}</span>
      </div>

      <div className="export-spacer" />
      <button className="download-btn" onClick={onDownload} disabled={isLoading || !cropWidth || !cropHeight}>
        {isLoading ? <span>{STATUS_LABELS[exportStatus]}</span> : <><Download size={17} /> Download image</>}
      </button>
    </aside>
  );
}
