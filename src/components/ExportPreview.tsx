import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { Eye, Hand, Minus, Plus, X } from 'lucide-react';
import type { ExportStatus, ImageFormat } from '@/types/editor';
import { formatFileSize, getSizeReductionPercent } from '@/lib/image/export';
import {
  clampPreviewPan,
  getNextPreviewZoom,
  getPreviewFitScale,
  getPreviewScale,
  PREVIEW_ZOOM_PRESETS,
  type PreviewZoom,
} from '@/lib/image/preview-viewport';

type Props = {
  previewUrl: string | null;
  beforePreviewUrl: string | null;
  beforePreviewReady: boolean;
  previewStatus: ExportStatus;
  previewSize: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  originalWidth: number;
  originalHeight: number;
  originalFileSize: number;
  format: ImageFormat;
  quality: number;
  backgroundColor: string;
  availableFormats: readonly ImageFormat[];
  onFormatChange: (format: ImageFormat) => void;
  getInspectionBlob?: () => Promise<Blob | null>;
  getBeforeInspectionBlob?: () => Promise<Blob | null>;
  disabled?: boolean;
};

type Pan = { x: number; y: number };
type ActivePan = { pointerId: number; startX: number; startY: number; originX: number; originY: number };
type PreviewView = 'after' | 'before';

function getFormatLabel(format: ImageFormat) {
  return format === 'jpeg' ? 'JPEG' : format.toUpperCase();
}

function getZoomLabel(zoom: PreviewZoom) {
  return zoom === 'fit' ? 'Fit' : `${zoom}%`;
}

function getTransparencyLabel(format: ImageFormat, backgroundColor: string) {
  if (format === 'jpeg') return `Composited · ${backgroundColor.toUpperCase()}`;
  return 'Preserved';
}

export function ExportPreview({
  previewUrl,
  beforePreviewUrl,
  beforePreviewReady,
  previewStatus,
  previewSize,
  outputWidth,
  outputHeight,
  originalWidth,
  originalHeight,
  originalFileSize,
  format,
  quality,
  backgroundColor,
  availableFormats,
  onFormatChange,
  getInspectionBlob,
  getBeforeInspectionBlob,
  disabled = false,
}: Props) {
  const [openedPreviewUrl, setOpenedPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<PreviewZoom>('fit');
  const [view, setView] = useState<PreviewView>('after');
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [inspectionUrl, setInspectionUrl] = useState<string | null>(null);
  const [beforeInspectionUrl, setBeforeInspectionUrl] = useState<string | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [beforeInspectionStatus, setBeforeInspectionStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [inspectionSize, setInspectionSize] = useState<number | null>(null);
  const [inspectionSourceUrl, setInspectionSourceUrl] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const activePanRef = useRef<ActivePan | null>(null);

  const canOpen = Boolean(previewUrl && previewStatus === 'complete' && outputWidth && outputHeight && !disabled);
  const isOpen = openedPreviewUrl !== null && !disabled;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedPreviewUrl(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (inspectionUrl) URL.revokeObjectURL(inspectionUrl);
    if (beforeInspectionUrl) URL.revokeObjectURL(beforeInspectionUrl);
  }, [beforeInspectionUrl, inspectionUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const node = viewportRef.current;
    if (!node) return;
    const updateViewport = () => {
      const rect = node.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen]);

  const fitScale = useMemo(
    () => getPreviewFitScale(viewport.width, viewport.height, imageSize.width, imageSize.height),
    [imageSize.height, imageSize.width, viewport.height, viewport.width],
  );
  const scale = getPreviewScale(zoom, fitScale);
  const boundedPan = useMemo(
    () => clampPreviewPan(pan.x, pan.y, viewport.width, viewport.height, imageSize.width, imageSize.height, scale),
    [imageSize.height, imageSize.width, pan.x, pan.y, scale, viewport.height, viewport.width],
  );
  const previewReady = viewport.width > 0 && viewport.height > 0 && imageSize.width > 0 && imageSize.height > 0;

  const openPreview = () => {
    if (!previewUrl) return;
    activePanRef.current = null;
    setZoom('fit');
    setView('after');
    setPan({ x: 0, y: 0 });
    setImageSize({ width: 0, height: 0 });
    if (inspectionUrl) URL.revokeObjectURL(inspectionUrl);
    if (beforeInspectionUrl) URL.revokeObjectURL(beforeInspectionUrl);
    setInspectionUrl(null);
    setBeforeInspectionUrl(null);
    setInspectionStatus('idle');
    setBeforeInspectionStatus('idle');
    setInspectionSize(null);
    setInspectionSourceUrl(null);
    setOpenedPreviewUrl(previewUrl);
  };

  const closePreview = () => {
    activePanRef.current = null;
    setOpenedPreviewUrl(null);
    if (inspectionUrl) URL.revokeObjectURL(inspectionUrl);
    if (beforeInspectionUrl) URL.revokeObjectURL(beforeInspectionUrl);
    setInspectionUrl(null);
    setBeforeInspectionUrl(null);
    setInspectionStatus('idle');
    setBeforeInspectionStatus('idle');
    setInspectionSize(null);
    setInspectionSourceUrl(null);
  };

  const resetInspectionForSourceChange = () => {
    if (inspectionUrl) URL.revokeObjectURL(inspectionUrl);
    if (beforeInspectionUrl) URL.revokeObjectURL(beforeInspectionUrl);
    setInspectionUrl(null);
    setBeforeInspectionUrl(null);
    setInspectionStatus('idle');
    setBeforeInspectionStatus('idle');
    setInspectionSize(null);
    setInspectionSourceUrl(null);
    setImageSize({ width: 0, height: 0 });
    setZoom('fit');
    setView('after');
    setPan({ x: 0, y: 0 });
  };

  const ensureInspectionPreview = async (target: PreviewView) => {
    const getter = target === 'after' ? getInspectionBlob : getBeforeInspectionBlob;
    if (!getter || !previewUrl) return;

    if (target === 'after') {
      if (inspectionSourceUrl === previewUrl && (inspectionStatus === 'loading' || inspectionStatus === 'ready')) return;
      setInspectionStatus('loading');
    } else {
      if (beforeInspectionStatus === 'loading' || beforeInspectionStatus === 'ready') return;
      setBeforeInspectionStatus('loading');
    }

    const blob = await getter();
    if (!blob) {
      if (target === 'after') setInspectionStatus('error');
      else setBeforeInspectionStatus('error');
      return;
    }

    const url = URL.createObjectURL(blob);
    if (target === 'after') {
      setInspectionSourceUrl(previewUrl);
      setInspectionUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      setInspectionStatus('ready');
      setInspectionSize(blob.size);
    } else {
      setBeforeInspectionUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      setBeforeInspectionStatus('ready');
    }
  };

  const setPresetZoom = (nextZoom: PreviewZoom) => {
    activePanRef.current = null;
    setZoom(nextZoom);
    setPan({ x: 0, y: 0 });
    if (nextZoom === 200 || nextZoom === 400) {
      void ensureInspectionPreview('after');
      if (view === 'before') void ensureInspectionPreview('before');
    }
  };

  const stepZoom = (direction: 'in' | 'out') => {
    setPresetZoom(getNextPreviewZoom(zoom, direction));
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!previewReady) return;
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const direction = event.deltaY < 0 ? 'in' : 'out';
    const nextZoom = getNextPreviewZoom(zoom, direction);
    if (nextZoom === zoom) return;
    const oldScale = scale;
    const nextScale = getPreviewScale(nextZoom, fitScale);
    const pointerX = event.clientX - (rect.left + rect.width / 2);
    const pointerY = event.clientY - (rect.top + rect.height / 2);
    const nextPan = {
      x: pointerX - ((pointerX - boundedPan.x) / oldScale) * nextScale,
      y: pointerY - ((pointerY - boundedPan.y) / oldScale) * nextScale,
    };
    setZoom(nextZoom);
    if (nextZoom === 200 || nextZoom === 400) {
      void ensureInspectionPreview('after');
      if (view === 'before') void ensureInspectionPreview('before');
    }
    setPan(clampPreviewPan(nextPan.x, nextPan.y, viewport.width, viewport.height, imageSize.width, imageSize.height, nextScale));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewReady || scale <= fitScale) return;
    event.preventDefault();
    viewportRef.current?.setPointerCapture(event.pointerId);
    activePanRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: boundedPan.x, originY: boundedPan.y };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = activePanRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    setPan(clampPreviewPan(active.originX + event.clientX - active.startX, active.originY + event.clientY - active.startY, viewport.width, viewport.height, imageSize.width, imageSize.height, scale));
  };

  const finishPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = activePanRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    activePanRef.current = null;
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) viewportRef.current.releasePointerCapture(event.pointerId);
  };

  const handleViewChange = (nextView: PreviewView) => {
    setView(nextView);
    activePanRef.current = null;
    if (nextView === 'before' && (zoom === 200 || zoom === 400)) void ensureInspectionPreview('before');
  };

  const dimensionLabel = outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : '—';
  const sourceDimensionLabel = originalWidth && originalHeight ? `${originalWidth} × ${originalHeight} px` : '—';
  const formatLabel = getFormatLabel(format);
  const hasCurrentInspection = inspectionUrl !== null && inspectionSourceUrl === previewUrl && inspectionStatus === 'ready';
  const hasCurrentBeforeInspection = beforeInspectionUrl !== null && beforeInspectionStatus === 'ready';
  const displayUrl = view === 'before'
    ? (hasCurrentBeforeInspection ? beforeInspectionUrl : beforePreviewUrl)
    : (hasCurrentInspection ? inspectionUrl : previewUrl);
  const displayInspectionSize = hasCurrentInspection ? inspectionSize : null;
  const sizeReduction = displayInspectionSize === null ? null : getSizeReductionPercent(originalFileSize, displayInspectionSize);

  return (
    <>
      <button
        type="button"
        className="canvas-preview-button"
        onClick={openPreview}
        disabled={!canOpen}
        aria-label={canOpen ? `Open export preview at ${dimensionLabel}` : 'Preview is not ready'}
      >
        <Eye size={14} />
        Preview
      </button>

      {isOpen && (
        <div className="export-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closePreview(); }}>
          <section className="export-preview-modal" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
            <header className="export-preview-modal-header">
              <div>
                <div className="panel-label">Preview</div>
                <h2 id="export-preview-title">Final export</h2>
                <p>Inspect the exact crop, adjustments, format, and output before exporting.</p>
              </div>
              <button ref={closeButtonRef} type="button" className="export-preview-close" onClick={closePreview} aria-label="Close export preview"><X size={18} /></button>
            </header>

            <div className="export-preview-modal-body">
              <div className="export-preview-main">
                <div
                  ref={viewportRef}
                  className="export-preview-large-stage"
                  onWheel={handleWheel}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishPan}
                  onPointerCancel={finishPan}
                  aria-label="Interactive export preview. Drag to pan and scroll to zoom."
                >
                  <div className="export-preview-checkerboard" aria-hidden="true">
                    {displayUrl ? <img
                      src={displayUrl}
                      alt={view === 'before' ? 'Before adjustments export preview' : 'Final export preview'}
                      className={`export-preview-large-image${previewReady ? ' is-ready' : ''}`}
                      draggable={false}
                      onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                      style={previewReady ? {
                        width: `${imageSize.width}px`,
                        height: `${imageSize.height}px`,
                        transform: `translate3d(calc(-50% + ${boundedPan.x}px), calc(-50% + ${boundedPan.y}px), 0) scale(${scale})`,
                      } : undefined}
                    /> : <div className="export-preview-loading">Preparing export preview…</div>}
                  </div>
                  <div className="export-preview-pan-hint" aria-hidden="true"><Hand size={13} /><span>Drag to pan · Scroll to zoom</span></div>
                  {((view === 'after' && inspectionStatus === 'loading') || (view === 'before' && beforeInspectionStatus === 'loading')) && <div className="export-preview-inspection-status" role="status">Loading full-resolution inspection…</div>}
                  {((view === 'after' && inspectionStatus === 'error') || (view === 'before' && beforeInspectionStatus === 'error')) && <div className="export-preview-inspection-status" role="status">Full-resolution inspection could not be prepared.</div>}
                </div>

                <div className="export-preview-toolbar" aria-label="Preview controls">
                  <div className="export-preview-format-presets" role="group" aria-label="Export format">
                    {availableFormats.map((item) => (
                      <button key={item} type="button" className={`export-preview-format-button${format === item ? ' active' : ''}`} onClick={() => { resetInspectionForSourceChange(); onFormatChange(item); }} disabled={disabled || format === item} aria-pressed={format === item}>{getFormatLabel(item)}</button>
                    ))}
                  </div>
                  <div className="export-preview-view-presets" role="group" aria-label="Before and after preview">
                    <button type="button" className={`export-preview-preset${view === 'after' ? ' active' : ''}`} onClick={() => handleViewChange('after')}>After</button>
                    <button type="button" className={`export-preview-preset${view === 'before' ? ' active' : ''}`} onClick={() => handleViewChange('before')} disabled={!beforePreviewReady} aria-pressed={view === 'before'}>Before</button>
                  </div>
                  <div className="export-preview-zoom-group">
                    <button type="button" className="export-preview-zoom-button" onClick={() => stepZoom('out')} disabled={zoom === 'fit'} aria-label="Zoom out"><Minus size={13} /></button>
                    <button type="button" className="export-preview-zoom-value" onClick={() => setPresetZoom('fit')} aria-label="Fit image to preview window">{getZoomLabel(zoom)}</button>
                    <button type="button" className="export-preview-zoom-button" onClick={() => stepZoom('in')} disabled={zoom === 400} aria-label="Zoom in"><Plus size={13} /></button>
                  </div>
                  <div className="export-preview-zoom-presets" role="group" aria-label="Zoom presets">
                    <button type="button" className={`export-preview-preset${zoom === 'fit' ? ' active' : ''}`} onClick={() => setPresetZoom('fit')}>Fit</button>
                    {PREVIEW_ZOOM_PRESETS.map((preset) => <button key={preset} type="button" className={`export-preview-preset${zoom === preset ? ' active' : ''}`} onClick={() => setPresetZoom(preset)}>{preset}%</button>)}
                  </div>
                </div>
              </div>

              <div className="export-preview-details">
                <div><span>Output</span><strong>{dimensionLabel}</strong></div>
                <div><span>Source</span><strong>{sourceDimensionLabel}</strong></div>
                <div><span>Format</span><strong>{formatLabel}</strong></div>
                <div><span>Quality</span><strong>{format === 'png' ? 'Lossless' : `${Math.round(quality * 100)}%`}</strong></div>
                <div><span>{hasCurrentInspection ? 'Export size' : 'Estimated preview size'}</span><strong>{formatFileSize(hasCurrentInspection ? inspectionSize : previewSize)}</strong></div>
                <div><span>Size vs source</span><strong>{sizeReduction === null ? 'Available at 200% / 400%' : sizeReduction > 0 ? `${sizeReduction}% smaller` : sizeReduction < 0 ? `${Math.abs(sizeReduction)}% larger` : 'Same size'}</strong></div>
                <div><span>Transparency</span><strong>{getTransparencyLabel(format, backgroundColor)}</strong></div>
                {format === 'jpeg' && <p className="export-preview-note">Transparent pixels are composited onto {backgroundColor.toUpperCase()} for JPEG.</p>}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
