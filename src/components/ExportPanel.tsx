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
  supportedFormats: readonly ExportFormatDefinition[];
  isLoading: boolean;
  onFormatChange: (format: ImageFormat) => void;
  onQualityChange: (quality: number) => void;
  onQualityInteractionStart: () => void;
  onQualityCommit: () => void;
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

const QUALITY_PRESETS = [
  { label: 'Small', value: 0.35 },
  { label: 'Balanced', value: 0.65 },
  { label: 'High Quality', value: 0.85 },
  { label: 'Maximum', value: 1 },
] as const;

function getBackgroundMode(color: string): 'white' | 'black' | 'custom' {
  const normalized = color.toLowerCase();
  if (normalized === '#ffffff') return 'white';
  if (normalized === '#000000') return 'black';
  return 'custom';
}

function getFormatCapability(format: ImageFormat): string {
  if (format === 'png') return 'Lossless · Transparency preserved';
  if (format === 'webp') return 'Lossy · Transparency preserved';
  return 'Lossy · No transparency';
}

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
  onQualityInteractionStart,
  onQualityCommit,
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
  const backgroundMode = getBackgroundMode(backgroundColor);
  const currentPreset = QUALITY_PRESETS.find((preset) => Math.abs(preset.value - quality) < 0.005)?.label ?? 'Custom';

  return (
    <aside className="export-panel export-panel-v2" aria-label="Export controls">
      <div className="export-v2-header">
        <div>
          <div className="panel-label">Export</div>
          <h2>Output</h2>
        </div>
        <span className="local-badge">Local</span>
      </div>

      <div className="export-v2-scroll">
        <section className="export-v2-section export-v2-output-section">
          <div className="export-v2-section-heading">
            <span>Output</span>
            <span className="export-v2-capability">Browser encoded</span>
          </div>

          <label className="export-v2-field-label" htmlFor="format-select">Format</label>
          <select
            className="export-v2-select"
            id="format-select"
            value={format}
            onChange={(event) => onFormatChange(event.target.value as ImageFormat)}
            disabled={isLoading}
          >
            {supportedFormats.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>

          <div className="export-v2-format-meta">
            <strong>{activeFormat?.label ?? 'Selected format'}</strong>
            <span>{getFormatCapability(format)}</span>
          </div>
        </section>

        {activeFormat?.supportsQuality && (
          <section className="export-v2-section">
            <div className="export-v2-section-heading">
              <span>Compression</span>
              <strong>{qualityPercent}%</strong>
            </div>

            <div className="export-v2-quality-row">
              <label className="export-v2-sr-only" htmlFor="quality-slider">Quality</label>
              <input
                className="export-v2-range"
                type="range"
                id="quality-slider"
                min="0.2"
                max="1"
                step="0.01"
                value={quality}
                onChange={(event) => onQualityChange(Number(event.target.value))}
                onPointerDown={onQualityInteractionStart}
                onPointerUp={onQualityCommit}
                onKeyUp={onQualityCommit}
                disabled={isLoading}
              />
            </div>

            <div className="export-v2-quality-scale" aria-hidden="true">
              <span>20%</span>
              <span>50%</span>
              <span>100%</span>
            </div>

            <div className="export-v2-preset-row" aria-label="Quality presets">
              {QUALITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`export-v2-preset ${Math.abs(preset.value - quality) < 0.005 ? 'active' : ''}`}
                  onClick={() => onQualityChange(preset.value)}
                  onPointerDown={onQualityInteractionStart}
                  onPointerUp={onQualityCommit}
                  disabled={isLoading}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="export-v2-help">Quality changes encoder quality; it does not promise a matching percentage reduction in file size.</p>
            <div className="export-v2-subtle-value">Current preset: {currentPreset}</div>
          </section>
        )}

        {format === 'png' && (
          <section className="export-v2-section export-v2-static-section">
            <div className="export-v2-section-heading"><span>Transparency</span><strong>Preserved</strong></div>
            <p className="export-v2-help">Transparent pixels remain transparent in PNG output.</p>
          </section>
        )}

        {format === 'webp' && (
          <section className="export-v2-section export-v2-static-section">
            <div className="export-v2-section-heading"><span>Transparency</span><strong>Preserved</strong></div>
            <p className="export-v2-help">Transparent pixels are preserved. Lossless WebP mode is not enabled by the current browser canvas encoder.</p>
          </section>
        )}

        {activeFormat?.supportsBackground && (
          <section className="export-v2-section">
            <div className="export-v2-section-heading"><span>Background</span><span>JPEG</span></div>
            <p className="export-v2-help">JPEG cannot store transparency. Transparent pixels are composited before encoding.</p>

            <div className="export-v2-choice-row" role="radiogroup" aria-label="JPEG background">
              <button type="button" className={`export-v2-choice ${backgroundMode === 'white' ? 'active' : ''}`} onClick={() => onBackgroundChange('#ffffff')} disabled={isLoading}>White</button>
              <button type="button" className={`export-v2-choice ${backgroundMode === 'black' ? 'active' : ''}`} onClick={() => onBackgroundChange('#000000')} disabled={isLoading}>Black</button>
              <button type="button" className={`export-v2-choice ${backgroundMode === 'custom' ? 'active' : ''}`} onClick={() => onBackgroundChange(backgroundMode === 'custom' ? backgroundColor : '#ffffff')} disabled={isLoading}>Custom</button>
            </div>

            {backgroundMode === 'custom' && (
              <div className="export-v2-color-control">
                <input
                  id="jpeg-background"
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => onBackgroundChange(event.target.value)}
                  disabled={isLoading}
                  aria-label="Custom JPEG background color"
                />
                <span>{backgroundColor.toUpperCase()}</span>
              </div>
            )}
          </section>
        )}

        <section className="export-v2-section">
          <div className="export-v2-section-heading">
            <span>Dimensions</span>
            <button
              type="button"
              className={`export-v2-lock ${lockAspectRatio ? 'active' : ''}`}
              onClick={onLockToggle}
              title={lockAspectRatio ? 'Unlock aspect ratio' : 'Maintain aspect ratio'}
              aria-label={lockAspectRatio ? 'Unlock aspect ratio' : 'Maintain aspect ratio'}
            >
              {lockAspectRatio ? <Lock size={13} /> : <Unlock size={13} />}
              {lockAspectRatio ? 'Locked' : 'Free'}
            </button>
          </div>

          <div className="export-v2-dimensions">
            <div>
              <label htmlFor="output-width">Width</label>
              <div className="export-v2-input-wrap"><input id="output-width" type="number" value={width ?? ''} onChange={(event) => onWidthChange(event.target.value)} min="1" disabled={isLoading} /><span>px</span></div>
            </div>
            <span className="export-v2-times">×</span>
            <div>
              <label htmlFor="output-height">Height</label>
              <div className="export-v2-input-wrap"><input id="output-height" type="number" value={height ?? ''} onChange={(event) => onHeightChange(event.target.value)} min="1" disabled={isLoading} /><span>px</span></div>
            </div>
          </div>

          <div className="export-v2-dimension-summary">
            <span>Original</span><strong>{originalWidth} × {originalHeight}</strong>
            <span>Crop</span><strong>{cropWidth && cropHeight ? `${Math.round(cropWidth)} × ${Math.round(cropHeight)}` : '--'}</strong>
            <span>Output</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '--'}</strong>
          </div>
        </section>

        <section className="export-v2-summary">
          <div className="export-v2-section-heading"><span>Output summary</span><span>{activeFormat?.label ?? format.toUpperCase()}</span></div>
          <div className="export-v2-summary-grid">
            <div><span>Original</span><strong>{formatFileSize(fileSize)}</strong></div>
            <div><span>Estimated</span><strong>{formatFileSize(estimatedSize)}</strong></div>
            <div><span>Reduction</span><strong>{reduction === null ? '--' : reduction > 0 ? `${reduction}% smaller` : reduction < 0 ? `${Math.abs(reduction)}% larger` : 'Same size'}</strong></div>
            <div><span>Dimensions</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '--'}</strong></div>
          </div>
        </section>
      </div>

      <div className="export-v2-footer">
        <div className={`export-v2-status export-v2-status-${exportStatus}`} role="status" aria-live="polite">
          <span className="export-v2-status-dot" />
          <span>{isEncoding && format === 'webp' && exportStatus === 'encoding' ? 'Encoding WebP…' : STATUS_LABELS[exportStatus]}</span>
        </div>
        <button id="download-image-button" className="download-btn export-v2-download" onClick={onDownload} disabled={isLoading || !cropWidth || !cropHeight}>
          {isLoading ? <span>{STATUS_LABELS[exportStatus]}</span> : <><Download size={17} /> Download {activeFormat?.label ?? 'image'}</>}
        </button>
      </div>
    </aside>
  );
}
