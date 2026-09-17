import { useEffect, useRef } from 'react';
import { Check, Download, FileImage, Info, X } from 'lucide-react';
import { formatFileSize, getSizeReductionPercent } from '@/lib/image/export';
import type { ExportFormatDefinition } from '@/lib/image/formats';
import type { ExportStatus, ImageFormat } from '@/types/editor';

type Props = {
  originalWidth: number; originalHeight: number; fileSize: number; cropWidth: number | null; cropHeight: number | null;
  outputWidth: number | null; outputHeight: number | null; format: ImageFormat; quality: number; backgroundColor: string;
  estimatedSize: number | null; exportStatus: ExportStatus; supportedFormats: readonly ExportFormatDefinition[]; isLoading: boolean;
  onFormatChange: (format: ImageFormat) => void; onQualityChange: (quality: number) => void; onQualityInteractionStart: () => void;
  onQualityCommit: () => void; onBackgroundChange: (color: string) => void; onDownload: () => void; open: boolean; onClose: () => void;
};

const STATUS_LABELS: Record<ExportStatus, string> = { idle: 'Ready to export', preparing: 'Preparing…', cropping: 'Cropping…', resizing: 'Resizing…', encoding: 'Encoding…', downloading: 'Downloading…', complete: 'Export complete', error: 'Export failed' };
const QUALITY_PRESETS = [{ label: 'Small', value: 0.35 }, { label: 'Balanced', value: 0.65 }, { label: 'High', value: 0.85 }, { label: 'Maximum', value: 1 }] as const;

function getBackgroundMode(color: string): 'white' | 'black' | 'custom' { const normalized = color.toLowerCase(); if (normalized === '#ffffff') return 'white'; if (normalized === '#000000') return 'black'; return 'custom'; }
function getFormatCapability(format: ImageFormat): string { if (format === 'png') return 'Lossless · transparency preserved'; if (format === 'webp') return 'Lossy · transparency preserved'; return 'Lossy · transparency composited'; }

export function ExportPanel({ originalWidth, originalHeight, fileSize, cropWidth, cropHeight, outputWidth, outputHeight, format, quality, backgroundColor, estimatedSize, exportStatus, supportedFormats, isLoading, onFormatChange, onQualityChange, onQualityInteractionStart, onQualityCommit, onBackgroundChange, onDownload, open, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKeyDown); };
  }, [onClose, open]);

  if (!open) return null;
  const activeFormat = supportedFormats.find((item) => item.id === format);
  const reduction = estimatedSize === null ? null : getSizeReductionPercent(fileSize, estimatedSize);
  const isEncoding = ['preparing', 'cropping', 'resizing', 'encoding'].includes(exportStatus);
  const qualityPercent = Math.round(quality * 100);
  const backgroundMode = getBackgroundMode(backgroundColor);
  const currentPreset = QUALITY_PRESETS.find((preset) => Math.abs(preset.value - quality) < 0.005)?.label ?? 'Custom';
  const canDownload = Boolean(cropWidth && cropHeight && outputWidth && outputHeight && !isLoading);

  return (
    <div className="export-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="export-drawer" role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
        <header className="export-drawer-header">
          <div className="export-title-mark"><FileImage size={19} /></div>
          <div><span className="export-kicker">Final step</span><h2 id="export-dialog-title">Export image</h2><p>Choose how the finished image should leave your device.</p></div>
          <button ref={closeButtonRef} type="button" className="drawer-close" onClick={onClose} aria-label="Close export"><X size={18} /></button>
        </header>

        <div className="export-drawer-body">
          <section className="export-hero-summary">
            <div><span>Ready</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : 'Set dimensions in Resize'}</strong></div>
            <div><span>Source</span><strong>{originalWidth} × {originalHeight}</strong></div>
          </section>

          <section className="export-card">
            <div className="export-card-heading"><div><span className="export-section-kicker">01</span><h3>Format</h3></div><span className="export-card-note">Browser encoded</span></div>
            <div className="format-choice-grid">
              {supportedFormats.map((item) => (
                <button key={item.id} type="button" className={`format-choice ${format === item.id ? 'active' : ''}`} onClick={() => onFormatChange(item.id)} disabled={isLoading} aria-pressed={format === item.id}>
                  <span className="format-choice-icon">{item.label.slice(0, 3).toUpperCase()}</span><span><strong>{item.label}</strong><small>{item.id === 'png' ? 'Lossless' : 'Compressed'}</small></span>{format === item.id && <Check size={15} />}
                </button>
              ))}
            </div>
            <p className="export-capability"><Info size={13} /> {getFormatCapability(format)}</p>
          </section>

          {activeFormat?.supportsQuality && (
            <section className="export-card">
              <div className="export-card-heading"><div><span className="export-section-kicker">02</span><h3>Quality</h3></div><strong className="export-value">{qualityPercent}%</strong></div>
              <input className="export-quality-slider" aria-label="Quality" type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => onQualityChange(Number(event.target.value))} onPointerDown={onQualityInteractionStart} onPointerUp={onQualityCommit} onKeyUp={onQualityCommit} disabled={isLoading} />
              <div className="quality-scale"><span>Smaller file</span><span>Maximum detail</span></div>
              <div className="quality-presets">{QUALITY_PRESETS.map((preset) => <button key={preset.label} type="button" className={currentPreset === preset.label ? 'active' : ''} onClick={() => onQualityChange(preset.value)} disabled={isLoading}>{preset.label}</button>)}</div>
            </section>
          )}

          {activeFormat?.supportsBackground && (
            <section className="export-card">
              <div className="export-card-heading"><div><span className="export-section-kicker">03</span><h3>JPEG background</h3></div><span className="export-card-note">Transparency</span></div>
              <p className="export-help">JPEG cannot store transparent pixels, so they are filled before encoding.</p>
              <div className="background-choice-row"><button type="button" className={backgroundMode === 'white' ? 'active' : ''} onClick={() => onBackgroundChange('#ffffff')} disabled={isLoading}><span className="swatch white" /> White</button><button type="button" className={backgroundMode === 'black' ? 'active' : ''} onClick={() => onBackgroundChange('#000000')} disabled={isLoading}><span className="swatch black" /> Black</button><button type="button" className={backgroundMode === 'custom' ? 'active' : ''} onClick={() => onBackgroundChange(backgroundMode === 'custom' ? backgroundColor : '#ffffff')} disabled={isLoading}><span className="swatch custom" style={{ backgroundColor }} /> Custom</button></div>
              {backgroundMode === 'custom' && <div className="custom-color-row"><input id="jpeg-background" type="color" value={backgroundColor} onChange={(event) => onBackgroundChange(event.target.value)} disabled={isLoading} aria-label="Custom JPEG background color" /><strong>{backgroundColor.toUpperCase()}</strong></div>}
            </section>
          )}

          <section className="export-card export-summary-card">
            <div className="export-card-heading"><div><span className="export-section-kicker">Summary</span><h3>What will be exported</h3></div></div>
            <div className="export-facts"><div><span>Final size</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '—'}</strong></div><div><span>Estimated file</span><strong>{formatFileSize(estimatedSize)}</strong></div><div><span>Original file</span><strong>{formatFileSize(fileSize)}</strong></div><div><span>Change</span><strong>{reduction === null ? '—' : reduction > 0 ? `${reduction}% smaller` : reduction < 0 ? `${Math.abs(reduction)}% larger` : 'Same size'}</strong></div></div>
          </section>
        </div>

        <footer className="export-drawer-footer">
          <div className={`export-status export-status-${exportStatus}`} role="status" aria-live="polite"><span className="export-status-dot" />{isEncoding && format === 'webp' && exportStatus === 'encoding' ? 'Encoding WebP…' : STATUS_LABELS[exportStatus]}</div>
          <button id="download-image-button" type="button" className="primary-export-button" onClick={onDownload} disabled={!canDownload}>{isLoading ? STATUS_LABELS[exportStatus] : <><Download size={17} /> Download {activeFormat?.label ?? 'image'}</>}</button>
        </footer>
      </aside>
    </div>
  );
}
