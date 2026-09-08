'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { AppHeader } from '@/components/AppHeader';
import { EditorSidebar, type EditorTool } from '@/components/EditorSidebar';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ExportPanel } from '@/components/ExportPanel';
import { Toast } from '@/components/Toast';
import { UploadScreen } from '@/components/UploadScreen';
import { useEditorHistory } from '@/hooks/use-editor-history';
import { useImageLoader } from '@/hooks/use-image-loader';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_CROP_STATE } from '@/lib/image/constants';
import { exportCanvasImage, getFileExtension, getOutputDimensions } from '@/lib/image/export';
import { getCropperTransform } from '@/lib/image/transform';
import type { CropState, ImageFormat } from '@/types/editor';

export function App() {
  const { theme, setTheme } = useTheme();
  const [activeTool, setActiveTool] = useState<EditorTool>('crop');
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
    setCropState(DEFAULT_CROP_STATE); setCroppedAreaPixels(null); setSelectedAspect(null); setCustomWidth(null); setCustomHeight(null); setExportFormat('png'); setExportQuality(0.9); setLockAspectRatio(true); setActiveTool('crop'); resetHistory();
  }, [resetHistory]);

  const loadAndReset = useCallback(async (file: File) => { const image = await load(file); if (!image) return; resetEditor(); showToast('Image loaded successfully'); }, [load, resetEditor, showToast]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => { for (const item of Array.from(event.clipboardData?.items ?? [])) { if (!item.type.includes('image')) continue; const file = item.getAsFile(); if (file) void loadAndReset(file); break; } };
    window.addEventListener('paste', handlePaste); return () => window.removeEventListener('paste', handlePaste);
  }, [loadAndReset]);

  const performUndo = useCallback(() => { const previous = undo(cropState); if (previous) { setCropState(previous); showToast('Undo'); } }, [cropState, undo, showToast]);
  const performRedo = useCallback(() => { const next = redo(cropState); if (next) { setCropState(next); showToast('Redo'); } }, [cropState, redo, showToast]);
  useKeyboardShortcuts(performUndo, performRedo);

  const commit = useCallback((next: CropState) => { saveState(cropState); setCropState(next); }, [cropState, saveState]);
  const rotate = useCallback((amount: number) => { const rotation = ((cropState.transform.rotation + amount) % 360 + 360) % 360; commit({ ...cropState, transform: { ...cropState.transform, rotation } }); showToast(amount > 0 ? 'Rotated right' : 'Rotated left'); }, [commit, cropState, showToast]);
  const flip = useCallback((axis: 'x' | 'y') => { const key = axis === 'x' ? 'flipX' : 'flipY'; commit({ ...cropState, transform: { ...cropState.transform, [key]: !cropState.transform[key] } }); showToast(axis === 'x' ? 'Flipped horizontally' : 'Flipped vertically'); }, [commit, cropState, showToast]);
  const handleZoom = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom })), []);
  const handleRotation = useCallback((rotation: number) => setCropState((prev) => ({ ...prev, transform: { ...prev.transform, rotation } })), []);
  const cropperTransform = useMemo(() => getCropperTransform(cropState), [cropState]);

  const resetEdits = useCallback(() => { if (!window.confirm('Reset all edits to original state?')) return; resetEditor(); showToast('Reset to original'); }, [resetEditor, showToast]);
  const clearImage = useCallback(() => { if (!window.confirm('Clear current image and return to upload screen?')) return; clear(); resetEditor(); showToast('Image cleared'); }, [clear, resetEditor, showToast]);
  const replaceImage = useCallback(() => { if (undoStack.length || redoStack.length) { if (!window.confirm('Replace image? This will discard current edits.')) return; } document.getElementById('replace-image-input')?.click(); }, [redoStack.length, undoStack.length]);

  const handleDimension = useCallback((axis: 'width' | 'height', value: string) => {
    if (value === '') { if (axis === 'width') setCustomWidth(null); else setCustomHeight(null); return; }
    const num = Number.parseInt(value, 10); if (!Number.isFinite(num) || num <= 0) return;
    if (axis === 'width') { setCustomWidth(num); if (lockAspectRatio) setCustomHeight(null); } else { setCustomHeight(num); if (lockAspectRatio) setCustomWidth(null); }
  }, [lockAspectRatio]);

  const handleDownload = useCallback(async () => {
    if (!loadedImage || !croppedAreaPixels) { showToast('No image to export'); return; }
    setIsLoading(true);
    try {
      const settings = { format: exportFormat, quality: exportQuality, width: customWidth, height: customHeight, lockAspectRatio };
      const blob = await exportCanvasImage(loadedImage.element, croppedAreaPixels, cropState.transform, settings);
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `croplab-${Date.now()}.${getFileExtension(exportFormat)}`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); showToast('Image downloaded successfully');
    } catch (error) { console.error('Export error:', error); showToast('Failed to export image. Please try again.'); } finally { setIsLoading(false); }
  }, [cropState.transform, croppedAreaPixels, customHeight, customWidth, exportFormat, exportQuality, loadedImage, lockAspectRatio, showToast]);

  const outputDimensions = croppedAreaPixels ? getOutputDimensions(croppedAreaPixels, { format: exportFormat, quality: exportQuality, width: customWidth, height: customHeight, lockAspectRatio }) : null;

  return <div className={`app ${theme}`}>
    <AppHeader theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
    <main className="app-main">
      {!loadedImage ? <UploadScreen onLoad={(file) => void loadAndReset(file)} /> : <>
        <input id="replace-image-input" type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadAndReset(file); event.currentTarget.value = ''; }} />
        <div className="workspace-shell">
          <div className="workspace-grid">
            <EditorSidebar activeTool={activeTool} selectedAspect={selectedAspect} onToolChange={setActiveTool} onAspectChange={(value, label) => { saveState(cropState); setSelectedAspect(value); showToast(`Aspect ratio set to ${label}`); }} />
            <section className="canvas-workspace" aria-label="Image canvas">
              <div className="canvas-header"><div><span className="eyebrow">Canvas</span><strong>{loadedImage.element.naturalWidth} × {loadedImage.element.naturalHeight}</strong></div><span>Drag to reposition · scroll to zoom</span></div>
              <EditorToolbar canUndo={Boolean(undoStack.length)} canRedo={Boolean(redoStack.length)} zoom={cropState.zoom} onReplace={replaceImage} onClear={clearImage} onUndo={performUndo} onRedo={performRedo} onRotateLeft={() => rotate(-90)} onRotateRight={() => rotate(90)} onFlipHorizontal={() => flip('x')} onFlipVertical={() => flip('y')} onReset={resetEdits} onZoomChange={handleZoom} />
              <div className="canvas-stage"><Cropper image={loadedImage.src} crop={cropState.crop} zoom={cropState.zoom} aspect={selectedAspect ?? 0} onCropChange={(crop: Point) => setCropState((prev) => ({ ...prev, crop }))} onZoomChange={handleZoom} rotation={cropState.transform.rotation} onRotationChange={handleRotation} onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)} showGrid transform={cropperTransform} /></div>
              <div className="canvas-footer"><span>Persistent transforms stay available above the canvas.</span><span>Edits stay in this browser.</span></div>
            </section>
            <ExportPanel originalWidth={loadedImage.element.naturalWidth} originalHeight={loadedImage.element.naturalHeight} fileSize={loadedImage.fileSize} cropWidth={croppedAreaPixels?.width ?? null} cropHeight={croppedAreaPixels?.height ?? null} outputWidth={outputDimensions?.width ?? null} outputHeight={outputDimensions?.height ?? null} format={exportFormat} quality={exportQuality} width={customWidth} height={customHeight} lockAspectRatio={lockAspectRatio} isLoading={isLoading} onFormatChange={(format) => { setExportFormat(format); showToast(`Format set to ${format.toUpperCase()}`); }} onQualityChange={setExportQuality} onWidthChange={(value) => handleDimension('width', value)} onHeightChange={(value) => handleDimension('height', value)} onLockToggle={() => setLockAspectRatio((prev) => !prev)} onDownload={() => void handleDownload()} />
          </div>
        </div>
      </>}
    </main>
    <Toast visible={toast.visible} message={toast.message} />
    <footer className="app-footer"><div className="footer-content"><span><strong>CropLab</strong> · Private by design</span><span>JPEG · PNG · WebP · runs entirely in your browser</span><span>© {new Date().getFullYear()}</span></div></footer>
  </div>;
}

export default App;
