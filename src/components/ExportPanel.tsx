import { useEffect, useRef, useState } from 'react';
import { Archive, Check, Download, FileImage, Info, X } from 'lucide-react';
import { formatFileSize, getSizeReductionPercent } from '@/lib/image/export';
import type { ExportFormatDefinition } from '@/lib/image/formats';
import type { ExportStatus, ImageFormat, ImageMetadata } from '@/types/editor';
import { useDialogA11y } from '@/hooks/use-dialog-a11y';

type Props = {
  originalWidth: number; originalHeight: number; fileSize: number; fileName: string; sourceFormat: string; metadata: ImageMetadata | null; cropWidth: number | null; cropHeight: number | null;
  outputWidth: number | null; outputHeight: number | null; format: ImageFormat; quality: number; backgroundColor: string;
  estimatedSize: number | null; exportStatus: ExportStatus; supportedFormats: readonly ExportFormatDefinition[]; isLoading: boolean;
  onFormatChange: (format: ImageFormat) => void; onQualityChange: (quality: number) => void; onQualityInteractionStart: () => void;
  onQualityCommit: () => void; onBackgroundChange: (color: string) => void;
  onBatchExport: () => void; onCancelBatchExport: () => void;
  batchExportActive: boolean; batchCompleted: number; batchTotal: number; batchAvailable: boolean;
  onDownload: () => void; open: boolean; onClose: () => void;
};

const STATUS_LABELS: Record<ExportStatus, string> = { idle: 'Ready to export', preparing: 'Preparing…', cropping: 'Cropping…', resizing: 'Resizing…', encoding: 'Encoding…', downloading: 'Downloading…', complete: 'Export complete', error: 'Export failed' };
const QUALITY_PRESETS = [{ label: 'Small', value: 0.35 }, { label: 'Balanced', value: 0.65 }, { label: 'High', value: 0.85 }, { label: 'Maximum', value: 1 }] as const;

function getBackgroundMode(color: string): 'white' | 'black' | 'custom' { const normalized = color.toLowerCase(); if (normalized === '#ffffff') return 'white'; if (normalized === '#000000') return 'black'; return 'custom'; }
function getFormatCapability(format: ImageFormat): string { if (format === 'png') return 'Lossless · transparency preserved'; if (format === 'webp') return 'Lossy · transparency preserved'; return 'Lossy · transparency composited'; }

export function ExportPanel({ originalWidth, originalHeight, fileSize, fileName, sourceFormat, metadata, cropWidth, cropHeight, outputWidth, outputHeight, format, quality, backgroundColor, estimatedSize, exportStatus, supportedFormats, isLoading, onFormatChange, onQualityChange, onQualityInteractionStart, onQualityCommit, onBackgroundChange, onBatchExport, onCancelBatchExport, batchExportActive, batchCompleted, batchTotal, batchAvailable, onDownload, open, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const customColorRef = useRef<HTMLInputElement | null>(null);
  const [customColor, setCustomColor] = useState('#e6e6e6');

  useDialogA11y(open, onClose, closeButtonRef);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  if (!open) return null;
  const activeFormat = supportedFormats.find((item) => item.id === format);
  const reduction = estimatedSize === null ? null : getSizeReductionPercent(fileSize, estimatedSize);
  const isEncoding = ['preparing', 'cropping', 'resizing', 'encoding'].includes(exportStatus);
  const qualityPercent = Math.round(quality * 100);
  const backgroundMode = getBackgroundMode(backgroundColor);
  const currentPreset = QUALITY_PRESETS.find((preset) => Math.abs(preset.value - quality) < 0.005)?.label ?? 'Custom';
  const canDownload = Boolean(cropWidth && cropHeight && outputWidth && outputHeight && !isLoading);
  const openCustomColorPicker = () => {
    if (backgroundMode !== 'custom') {
      setCustomColor('#e6e6e6');
      onBackgroundChange('#e6e6e6');
    }
    window.requestAnimationFrame(() => customColorRef.current?.click());
  };

  return (
    <div className="export-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="export-drawer" role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
        <header className="export-drawer-header">
          <div className="export-title-mark"><FileImage size={19} /></div>
          <div><span className="export-kicker">Output</span><h2 id="export-dialog-title">Export image</h2><p>Choose how the finished image should leave your device.</p></div>
          <button ref={closeButtonRef} type="button" className="drawer-close" onClick={onClose} aria-label="Close export"><X size={18} /></button>
        </header>

        <div className="export-drawer-body">
          <section className="export-hero-summary">
            <div><span>Ready</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : 'Set dimensions in Resize'}</strong></div>
            <div><span>Source</span><strong>{originalWidth} × {originalHeight}</strong></div>
          </section>

          <section className="export-card">
            <div className="export-card-heading"><div><h3>Format</h3></div><span className="export-card-note">Browser encoded</span></div>
            <div className="format-choice-grid">
              {supportedFormats.map((item) => (
                <button key={item.id} type="button" className={`format-choice ${format === item.id ? 'active' : ''}`} onClick={() => onFormatChange(item.id)} disabled={isLoading} aria-pressed={format === item.id}>
                  <span className="format-choice-icon">{item.label.slice(0, 3).toUpperCase()}</span><span><strong>{item.label}</strong><small>{item.id === 'png' ? 'Lossless' : 'Compressed'}</small></span>{format === item.id && <Check size={15} />}
                </button>
              ))}
            </div>
            <p className="export-capability"><Info size={13} /> {getFormatCapability(format)}</p>
          </section>



          <section className="export-card export-summary-card">
            <div className="export-card-heading"><div><span className="export-section-kicker">Summary</span><h3>What will be exported</h3></div></div>
            <div className="export-facts"><div><span>Final size</span><strong>{outputWidth && outputHeight ? `${outputWidth} × ${outputHeight}` : '—'}</strong></div><div><span>Estimated file</span><strong>{formatFileSize(estimatedSize)}</strong></div><div><span>Original file</span><strong>{formatFileSize(fileSize)}</strong></div><div><span>Change</span><strong>{reduction === null ? '—' : reduction > 0 ? `${reduction}% smaller` : reduction < 0 ? `${Math.abs(reduction)}% larger` : 'Same size'}</strong></div></div>
          </section>

          <section className="export-card export-info-card">
            <div className="export-card-heading"><div><span className="export-section-kicker">Source</span><h3>Image information</h3></div></div>
            <div className="export-facts">
              <div><span>File</span><strong title={fileName}>{fileName}</strong></div>
              <div><span>Source format</span><strong>{sourceFormat.toUpperCase()}</strong></div>
              <div><span>Dimensions</span><strong>{originalWidth} × {originalHeight} px</strong></div>
              <div><span>File size</span><strong>{formatFileSize(fileSize)}</strong></div>
              <div><span>Metadata</span><strong>{metadata?.hasMetadata ? 'Present' : 'None detected'}</strong></div>
              <div><span>Blocks</span><strong>{metadata?.kinds.length ? metadata.kinds.join(' · ') : 'None'}</strong></div>
              <div><span>GPS</span><strong>{metadata?.hasGps ? 'Present' : 'Not detected'}</strong></div>
            </div>
            {metadata?.hasMetadata && (metadata.cameraMake || metadata.cameraModel || metadata.captureDate || metadata.iso || metadata.exposureTime || metadata.fNumber || metadata.focalLength) && (
              <div className="metadata-detail-list">
                {metadata.cameraModel && <div><span>Camera</span><strong>{[metadata.cameraMake, metadata.cameraModel].filter(Boolean).join(' ')}</strong></div>}
                {metadata.captureDate && <div><span>Captured</span><strong>{metadata.captureDate}</strong></div>}
                {metadata.iso && <div><span>ISO</span><strong>{metadata.iso}</strong></div>}
                {metadata.exposureTime && <div><span>Exposure</span><strong>{metadata.exposureTime}</strong></div>}
                {metadata.fNumber && <div><span>Aperture</span><strong>f/{metadata.fNumber}</strong></div>}
                {metadata.focalLength && <div><span>Focal length</span><strong>{metadata.focalLength}</strong></div>}
              </div>
            )}
          </section>

          <section className="export-card metadata-policy-card">
            <div className="export-card-heading"><div><span className="export-section-kicker">Privacy</span><h3>Metadata export policy</h3></div><span className="export-card-note">Canvas output</span></div>
            <div className="metadata-policy"><span className="metadata-policy-dot" aria-hidden="true" /><div><strong>Remove source metadata</strong><p>CropLab re-encodes exports through Canvas, so source EXIF, XMP, GPS, ICC, and comment blocks are not copied into the exported image.</p></div></div>
          </section>




          {activeFormat?.supportsQuality && (
            <section className="export-card">
              <div className="export-card-heading"><div><h3>Quality</h3></div><strong className="export-value">{qualityPercent}%</strong></div>
              <input className="export-quality-slider" aria-label="Quality" type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => onQualityChange(Number(event.target.value))} onPointerDown={onQualityInteractionStart} onPointerUp={onQualityCommit} onKeyUp={onQualityCommit} disabled={isLoading} />
              <div className="quality-scale"><span>Smaller file</span><span>Maximum detail</span></div>
              <div className="quality-presets">{QUALITY_PRESETS.map((preset) => <button key={preset.label} type="button" className={currentPreset === preset.label ? 'active' : ''} onClick={() => onQualityChange(preset.value)} disabled={isLoading}>{preset.label}</button>)}</div>
            </section>
          )}

          {activeFormat?.supportsBackground && (
            <section className="export-card">
              <div className="export-card-heading"><div><h3>JPEG background</h3></div><span className="export-card-note">Transparency</span></div>
              <p className="export-help">JPEG cannot store transparent pixels, so they are filled before encoding.</p>
              <div className="background-choice-row"><button type="button" className={backgroundMode === 'white' ? 'active' : ''} onClick={() => onBackgroundChange('#ffffff')} disabled={isLoading}><span className="swatch white" /> White</button><button type="button" className={backgroundMode === 'black' ? 'active' : ''} onClick={() => onBackgroundChange('#000000')} disabled={isLoading}><span className="swatch black" /> Black</button><button type="button" className={backgroundMode === 'custom' ? 'active' : ''} onClick={openCustomColorPicker} disabled={isLoading}><span className="swatch custom" style={{ backgroundColor: backgroundMode === 'custom' ? backgroundColor : customColor }} /> Custom</button></div>
              <div className="custom-color-row"><input ref={customColorRef} id="jpeg-background" type="color" value={backgroundMode === 'custom' ? backgroundColor : customColor} onChange={(event) => { setCustomColor(event.target.value); onBackgroundChange(event.target.value); }} disabled={isLoading} aria-label="Custom JPEG background color" /><strong>{(backgroundMode === 'custom' ? backgroundColor : customColor).toUpperCase()}</strong><span>Click Custom to choose a color.</span></div>
            </section>
          )}

        </div>

        <footer className="export-drawer-footer">
          <div className={`export-status export-status-${exportStatus}`} role="status" aria-live="polite"><span className="export-status-dot" />{batchExportActive ? `Exporting batch · ${batchCompleted}/${batchTotal}` : isEncoding && format === 'webp' && exportStatus === 'encoding' ? 'Encoding WebP…' : STATUS_LABELS[exportStatus]}</div>
          <div className="export-action-stack">
            <button id="download-image-button" type="button" className="primary-export-button" onClick={onDownload} disabled={!canDownload || isLoading || batchExportActive}>{isLoading && !batchExportActive ? STATUS_LABELS[exportStatus] : <><Download size={17} /> Export current image</>}</button>
            {batchExportActive ? (
              <button type="button" className="secondary-export-button" onClick={onCancelBatchExport}>Cancel batch export</button>
            ) : (
              <button type="button" className="secondary-export-button" onClick={onBatchExport} disabled={!batchAvailable || isLoading}><><Archive size={16} /> Export full batch as ZIP</></button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
}
