import { useEffect, useRef, useState } from 'react';
import { Eye, Maximize2, X } from 'lucide-react';
import type { ExportStatus, ImageFormat } from '@/types/editor';
import { formatFileSize } from '@/lib/image/export';

type Props = {
  previewUrl: string | null;
  previewStatus: ExportStatus;
  previewSize: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  format: ImageFormat;
  quality: number;
  backgroundColor: string;
  disabled?: boolean;
};

const STATUS_COPY: Partial<Record<ExportStatus, string>> = {
  preparing: 'Preparing preview…',
  cropping: 'Rendering crop…',
  resizing: 'Applying resize…',
  encoding: 'Updating preview…',
  error: 'Preview unavailable',
};

function getFormatLabel(format: ImageFormat) {
  return format === 'jpeg' ? 'JPEG' : format.toUpperCase();
}

export function ExportPreview({ previewUrl, previewStatus, previewSize, outputWidth, outputHeight, format, quality, backgroundColor, disabled = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (previewStatus !== 'complete') setIsOpen(false);
  }, [previewStatus]);

  const canOpen = Boolean(previewUrl && previewStatus === 'complete' && outputWidth && outputHeight && !disabled);
  const statusCopy = STATUS_COPY[previewStatus];
  const dimensionLabel = outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : '—';
  const formatLabel = getFormatLabel(format);

  return (
    <>
      <div className="tool-preview" aria-label="Live export preview">
        <div className="tool-preview-heading">
          <span><Eye size={11} /> Live preview</span>
          <span>{canOpen ? 'Click to enlarge' : statusCopy ?? 'Final image'}</span>
        </div>
        <button
          type="button"
          className={`tool-preview-stage ${canOpen ? 'is-clickable' : ''}`}
          onClick={() => canOpen && setIsOpen(true)}
          disabled={!canOpen}
          aria-label={canOpen ? `Open export preview at ${dimensionLabel}` : 'Export preview is not ready'}
        >
          {previewUrl ? (
            <span className="tool-preview-checkerboard">
              <img src={previewUrl} alt="Live preview of the exported image" className="tool-preview-image" />
            </span>
          ) : (
            <span className="tool-preview-placeholder">
              {statusCopy ?? 'Preview will appear here'}
            </span>
          )}
          {canOpen && <span className="tool-preview-expand" aria-hidden="true"><Maximize2 size={12} /></span>}
          {previewStatus !== 'complete' && previewUrl && <span className="tool-preview-status">{statusCopy ?? 'Updating…'}</span>}
        </button>
        <div className="tool-preview-meta">
          <strong>{dimensionLabel}</strong>
          <span>{previewSize === null ? `${formatLabel} · estimating size` : `${formatLabel} · ${formatFileSize(previewSize)}`}</span>
        </div>
      </div>

      {isOpen && previewUrl && (
        <div className="export-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsOpen(false); }}>
          <section className="export-preview-modal" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
            <header className="export-preview-modal-header">
              <div>
                <div className="panel-label">Preview</div>
                <h2 id="export-preview-title">Final export</h2>
                <p>Exactly what CropLab is preparing to export.</p>
              </div>
              <button ref={closeButtonRef} type="button" className="export-preview-close" onClick={() => setIsOpen(false)} aria-label="Close export preview">
                <X size={18} />
              </button>
            </header>

            <div className="export-preview-modal-body">
              <div className="export-preview-large-stage">
                <span className="export-preview-checkerboard">
                  <img src={previewUrl} alt="Final export preview" className="export-preview-large-image" />
                </span>
              </div>

              <div className="export-preview-details">
                <div><span>Dimensions</span><strong>{dimensionLabel}</strong></div>
                <div><span>Format</span><strong>{formatLabel}</strong></div>
                <div><span>Quality</span><strong>{format === 'png' ? 'Lossless' : `${Math.round(quality * 100)}%`}</strong></div>
                <div><span>Estimated size</span><strong>{formatFileSize(previewSize)}</strong></div>
              </div>

              {format === 'jpeg' && <p className="export-preview-note">Transparent pixels are composited onto {backgroundColor.toUpperCase()} for JPEG.</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
