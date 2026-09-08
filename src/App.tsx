"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Download, FileInput, FlipHorizontal, FlipVertical, Lock, RotateCcw, RotateCw, Trash2, Undo2, Redo2, Unlock, ZoomIn, ZoomOut } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Toast } from '@/components/Toast';
import { UploadScreen } from '@/components/UploadScreen';
import { useEditorHistory } from '@/hooks/use-editor-history';
import { useImageLoader } from '@/hooks/use-image-loader';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTheme } from '@/hooks/use-theme';
import { ASPECT_RATIOS, DEFAULT_CROP_STATE } from '@/lib/image/constants';
import { exportCanvasImage, getFileExtension, getOutputDimensions } from '@/lib/image/export';
import { getCropperTransform } from '@/lib/image/transform';
import type { CropState, ImageFormat } from '@/types/editor';

export function App() {
  const { theme, setTheme } = useTheme();
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [cropState, setCropState] = useState<CropState>(DEFAULT_CROP_STATE);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<ImageFormat>('png');
  const [exportQuality, setExportQuality] = useState(0.9);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    window.setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  const { loadedImage, load, clear } = useImageLoader(showToast);
  const { undoStack, redoStack, saveState, resetHistory, undo, redo } = useEditorHistory();

  const resetEditor = useCallback(() => {
    setCropState(DEFAULT_CROP_STATE);
    setCroppedAreaPixels(null);
    setSelectedAspect(null);
    setCustomWidth(null);
    setCustomHeight(null);
    resetHistory();
  }, [resetHistory]);

  const loadAndReset = useCallback(async (file: File) => {
    const image = await load(file);
    if (!image) return;
    resetEditor();
    showToast('Image loaded successfully');
  }, [load, resetEditor, showToast]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      for (const item of Array.from(event.clipboardData?.items ?? [])) {
        if (item.type.includes('image')) {
          const file = item.getAsFile();
          if (file) void loadAndReset(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadAndReset]);

  const performUndo = useCallback(() => {
    const previous = undo(cropState);
    if (previous) { setCropState(previous); showToast('Undo'); }
  }, [cropState, undo, showToast]);

  const performRedo = useCallback(() => {
    const next = redo(cropState);
    if (next) { setCropState(next); showToast('Redo'); }
  }, [cropState, redo, showToast]);

  useKeyboardShortcuts(performUndo, performRedo);

  const commit = useCallback((next: CropState) => {
    saveState(cropState);
    setCropState(next);
  }, [cropState, saveState]);

  const rotate = useCallback((amount: number) => {
    const rotation = ((cropState.transform.rotation + amount) % 360 + 360) % 360;
    commit({ ...cropState, transform: { ...cropState.transform, rotation } });
    showToast(amount > 0 ? 'Rotated right' : 'Rotated left');
  }, [commit, cropState, showToast]);

  const flip = useCallback((axis: 'x' | 'y') => {
    commit({ ...cropState, transform: { ...cropState.transform, [axis === 'x' ? 'flipX' : 'flipY']: !(axis === 'x' ? cropState.transform.flipX : cropState.transform.flipY) } });
    showToast(axis === 'x' ? 'Flipped horizontally' : 'Flipped vertically');
  }, [commit, cropState, showToast]);

  const handleZoom = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom })), []);
  const handleRotation = useCallback((rotation: number) => setCropState((prev) => ({ ...prev, transform: { ...prev.transform, rotation } })), []);

  const cropperTransform = useMemo(() => getCropperTransform(cropState), [cropState]);

  const resetEdits = useCallback(() => {
    if (!window.confirm('Reset all edits to original state?')) return;
    resetEditor();
    showToast('Reset to original');
  }, [resetEditor, showToast]);

  const clearImage = useCallback(() => {
    if (!window.confirm('Clear current image and return to upload screen?')) return;
    clear();
    resetEditor();
    showToast('Image cleared');
  }, [clear, resetEditor, showToast]);

  const replaceImage = useCallback(() => {
    if (undoStack.length || redoStack.length) {
      if (!window.confirm('Replace image? This will discard current edits.')) return;
    }
    document.getElementById('replace-image-input')?.click();
  }, [redoStack.length, undoStack.length]);

  const handleDimension = useCallback((axis: 'width' | 'height', value: string) => {
    const num = Number.parseInt(value, 10);
    if (!Number.isFinite(num) || num <= 0) return;
    if (axis === 'width') { setCustomWidth(num); if (lockAspectRatio) setCustomHeight(null); }
    else { setCustomHeight(num); if (lockAspectRatio) setCustomWidth(null); }
  }, [lockAspectRatio]);

  const handleDownload = useCallback(async () => {
    if (!loadedImage || !croppedAreaPixels) { showToast('No image to export'); return; }
    setIsLoading(true);
    try {
      const settings = { format: exportFormat, quality: exportQuality, width: customWidth, height: customHeight, lockAspectRatio };
      const blob = await exportCanvasImage(loadedImage.element, croppedAreaPixels, cropState.transform, settings);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `croplab-${Date.now()}.${getFileExtension(exportFormat)}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Image downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export image. Please try again.');
    } finally { setIsLoading(false); }
  }, [cropState.transform, croppedAreaPixels, customHeight, customWidth, exportFormat, exportQuality, loadedImage, lockAspectRatio, showToast]);

  const outputDimensions = croppedAreaPixels ? getOutputDimensions(croppedAreaPixels, { format: exportFormat, quality: exportQuality, width: customWidth, height: customHeight, lockAspectRatio }) : null;

  return <div className={`app ${theme}`}>
    <AppHeader theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
    <main className="app-main">
      {!loadedImage ? <UploadScreen onLoad={(file) => void loadAndReset(file)} /> : <div className="editor-container">
        <input id="replace-image-input" type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadAndReset(file); event.currentTarget.value = ''; }} />
        <div className="editor-toolbar">
          <div className="toolbar-group"><button className="toolbar-btn" onClick={replaceImage} title="Replace image" aria-label="Replace image"><FileInput size={18} /></button><button className="toolbar-btn" onClick={clearImage} title="Clear image" aria-label="Clear image"><Trash2 size={18} /></button></div>
          <div className="toolbar-group"><button className="toolbar-btn" onClick={performUndo} disabled={!undoStack.length} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={18} /></button><button className="toolbar-btn" onClick={performRedo} disabled={!redoStack.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={18} /></button></div>
          <div className="toolbar-group"><button className="toolbar-btn" onClick={() => rotate(-90)} title="Rotate left 90°" aria-label="Rotate left"><RotateCcw size={18} /></button><button className="toolbar-btn" onClick={() => rotate(90)} title="Rotate right 90°" aria-label="Rotate right"><RotateCw size={18} /></button></div>
          <div className="toolbar-group"><button className="toolbar-btn" onClick={() => flip('x')} title="Flip horizontal" aria-label="Flip horizontal"><FlipHorizontal size={18} /></button><button className="toolbar-btn" onClick={() => flip('y')} title="Flip vertical" aria-label="Flip vertical"><FlipVertical size={18} /></button></div>
          <div className="toolbar-group"><button className="toolbar-btn" onClick={resetEdits} title="Reset all edits" aria-label="Reset"><RotateCcw size={18} /></button></div>
        </div>
        <div className="editor-main">
          <div className="editor-canvas-wrapper"><Cropper image={loadedImage.src} crop={cropState.crop} zoom={cropState.zoom} aspect={selectedAspect ?? 0} onCropChange={(crop: Point) => setCropState((prev) => ({ ...prev, crop }))} onZoomChange={handleZoom} rotation={cropState.transform.rotation} onRotationChange={handleRotation} onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)} showGrid transform={cropperTransform} /></div>
          <div className="editor-sidebar">
            <div className="sidebar-section"><h3>Aspect Ratio</h3><div className="aspect-ratio-list">{ASPECT_RATIOS.map((ratio) => <button key={ratio.label} className={`aspect-btn ${selectedAspect === ratio.value ? 'active' : ''}`} onClick={() => { saveState(cropState); setSelectedAspect(ratio.value); showToast(`Aspect ratio set to ${ratio.label}`); }} title={ratio.label}>{ratio.label}</button>)}</div></div>
            <div className="sidebar-section"><h3>Zoom</h3><div className="zoom-controls"><button className="zoom-btn" onClick={() => { saveState(cropState); handleZoom(Math.max(0.1, cropState.zoom - 0.1)); }} title="Zoom out" aria-label="Zoom out"><ZoomOut size={16} /></button><div className="zoom-slider-container"><input type="range" min="0.1" max="5" step="0.05" value={cropState.zoom} onChange={(e) => handleZoom(Number(e.target.value))} onMouseDown={() => saveState(cropState)} className="zoom-slider" aria-label="Zoom level" /><span className="zoom-value">{Math.round(cropState.zoom * 100)}%</span></div><button className="zoom-btn" onClick={() => { saveState(cropState); handleZoom(Math.min(5, cropState.zoom + 0.1)); }} title="Zoom in" aria-label="Zoom in"><ZoomIn size={16} /></button><button className="zoom-btn" onClick={() => { saveState(cropState); handleZoom(1); }} title="Reset zoom" aria-label="Reset zoom">100</button></div></div>
            <div className="sidebar-section"><h3>Rotate</h3><div className="rotate-slider-container"><input type="range" min="-180" max="180" step="1" value={cropState.transform.rotation} onChange={(e) => handleRotation(Number(e.target.value))} onMouseDown={() => saveState(cropState)} className="rotate-slider" aria-label="Rotation" /><span className="rotate-value">{cropState.transform.rotation}°</span></div></div>
            <div className="sidebar-section"><h3>Flip</h3><div className="flip-toggle-group"><button className={`flip-action ${cropState.transform.flipX ? 'active' : ''}`} onClick={() => flip('x')}><FlipHorizontal size={16} /> Horizontal</button><button className={`flip-action ${cropState.transform.flipY ? 'active' : ''}`} onClick={() => flip('y')}><FlipVertical size={16} /> Vertical</button></div></div>
          </div>
        </div>
        <div className="export-section"><div className="export-content"><div className="export-top"><div className="image-info"><div className="info-item"><span className="info-label">Original</span><span className="info-value">{loadedImage.element.naturalWidth} × {loadedImage.element.naturalHeight}</span></div><div className="info-item"><span className="info-label">Crop</span><span className="info-value">{croppedAreaPixels ? `${Math.round(croppedAreaPixels.width)} × ${Math.round(croppedAreaPixels.height)}` : '--'}</span></div><div className="info-item"><span className="info-label">Output</span><span className="info-value">{outputDimensions ? `${outputDimensions.width} × ${outputDimensions.height}` : '--'}</span></div><div className="info-item"><span className="info-label">File Size</span><span className="info-value">{(loadedImage.fileSize / 1024).toFixed(1)} KB</span></div></div><div className="export-controls"><div className="format-group"><label htmlFor="format-select">Format</label><select id="format-select" value={exportFormat} onChange={(e) => { const format = e.target.value as ImageFormat; setExportFormat(format); showToast(`Format set to ${format.toUpperCase()}`); }}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></select></div>{exportFormat !== 'png' && <div className="quality-group"><label htmlFor="quality-slider">Quality</label><div className="quality-slider-container"><input type="range" id="quality-slider" min="0.1" max="1" step="0.01" value={exportQuality} onChange={(e) => setExportQuality(Number(e.target.value))} className="quality-slider" /><span className="quality-value">{Math.round(exportQuality * 100)}%</span></div></div>}<div className="dimensions-group"><label>Dimensions (px)</label><div className="dimensions-inputs"><input type="number" placeholder="Width" value={customWidth ?? ''} onChange={(e) => handleDimension('width', e.target.value)} min="1" className="dimension-input" aria-label="Custom width" /><button className="lock-btn" onClick={() => setLockAspectRatio((prev) => !prev)} title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'} aria-label={lockAspectRatio ? 'Unlock' : 'Lock'}>{lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}</button><input type="number" placeholder="Height" value={customHeight ?? ''} onChange={(e) => handleDimension('height', e.target.value)} min="1" className="dimension-input" aria-label="Custom height" /></div></div></div></div><button className="download-btn" onClick={() => void handleDownload()} disabled={isLoading || !croppedAreaPixels}>{isLoading ? 'Processing...' : <><Download size={18} /> Download Image</>}</button></div></div>
      </div>}
    </main>
    <Toast visible={toast.visible} message={toast.message} />
    <footer className="app-footer"><div className="footer-content"><div className="footer-brand"><strong>CropLab</strong><span> · Private by design — runs entirely in your browser</span></div><div className="footer-meta"><span>Supports JPEG, PNG, WebP, GIF</span><span className="footer-divider">·</span><span>© {new Date().getFullYear()} CropLab</span></div></div></footer>
  </div>;
}

export default App;
