'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { AppHeader } from '@/components/AppHeader';
import { EditorSidebar, type EditorTool } from '@/components/EditorSidebar';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ExportPanel } from '@/components/ExportPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { Toast } from '@/components/Toast';
import { UploadScreen } from '@/components/UploadScreen';
import { useEditorHistory } from '@/hooks/use-editor-history';
import { useExportPreview } from '@/hooks/use-export-preview';
import { useSupportedExportFormats } from '@/hooks/use-supported-export-formats';
import { useImageLoader } from '@/hooks/use-image-loader';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_CROP_STATE } from '@/lib/image/constants';
import { createExportCanvas, encodeCanvas, getFileExtension, getOutputDimensions } from '@/lib/image/export';
import { getCropperTransform } from '@/lib/image/transform';
import { clampZoom, DEFAULT_ZOOM, deriveDimension, MAX_ZOOM, MIN_ZOOM, normalizeRotation, rotateBy } from '@/lib/editor/interaction';
import type { CropState, EditorSnapshot, ExportSettings, ExportStatus, ImageFormat } from '@/types/editor';

const DEFAULT_BACKGROUND = '#ffffff';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

export function App() {
  const { theme, setTheme } = useTheme();
  const [activeTool, setActiveTool] = useState<EditorTool | null>('crop');
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
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [downloadStatus, setDownloadStatus] = useState<ExportStatus>('idle');
  const interactionStartRef = useRef<{ snapshot: EditorSnapshot; label: string } | null>(null);
  const resizeStartRef = useRef<EditorSnapshot | null>(null);
  const qualityStartRef = useRef<EditorSnapshot | null>(null);
  const resizeTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    window.setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  const { loadedImage, load, clear } = useImageLoader(showToast);
  const { undoStack, redoStack, saveState, resetHistory, undo, redo } = useEditorHistory();
  const supportedFormats = useSupportedExportFormats();

  const currentSnapshot = useMemo<EditorSnapshot>(() => ({
    cropState,
    selectedAspect,
    width: customWidth,
    height: customHeight,
    format: exportFormat,
    quality: exportQuality,
    backgroundColor,
  }), [backgroundColor, cropState, customHeight, customWidth, exportFormat, exportQuality, selectedAspect]);

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setCropState(snapshot.cropState);
    setSelectedAspect(snapshot.selectedAspect);
    setCustomWidth(snapshot.width);
    setCustomHeight(snapshot.height);
    setExportFormat(snapshot.format);
    setExportQuality(snapshot.quality);
    setBackgroundColor(snapshot.backgroundColor);
    setCroppedAreaPixels(null);
  }, []);

  const flushPendingResize = useCallback(() => {
    if (resizeTimerRef.current !== null) {
      window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = null;
    }
    if (resizeStartRef.current) {
      saveState(resizeStartRef.current, 'Resize');
      resizeStartRef.current = null;
    }
  }, [saveState]);

  const commit = useCallback((next: CropState, label: string) => {
    flushPendingResize();
    saveState(currentSnapshot, label);
    setCropState(next);
  }, [currentSnapshot, flushPendingResize, saveState]);

  const resetEditor = useCallback(() => {
    flushPendingResize();
    setCropState(DEFAULT_CROP_STATE);
    setCroppedAreaPixels(null);
    setSelectedAspect(null);
    setCustomWidth(null);
    setCustomHeight(null);
    setExportFormat('png');
    setExportQuality(0.9);
    setLockAspectRatio(true);
    setBackgroundColor(DEFAULT_BACKGROUND);
    setDownloadStatus('idle');
    resetHistory();
  }, [flushPendingResize, resetHistory]);

  const loadAndReset = useCallback(async (file: File) => {
    const image = await load(file);
    if (!image) return;
    resetEditor();
    showToast('Image loaded successfully');
  }, [load, resetEditor, showToast]);

  useEffect(() => () => {
    if (resizeTimerRef.current !== null) window.clearTimeout(resizeTimerRef.current);
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      for (const item of Array.from(event.clipboardData?.items ?? [])) {
        if (!item.type.includes('image')) continue;
        const file = item.getAsFile();
        if (file) void loadAndReset(file);
        break;
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadAndReset]);

  const performUndo = useCallback(() => {
    flushPendingResize();
    const previous = undo(currentSnapshot);
    if (previous) {
      applySnapshot(previous);
      showToast('Undo');
    }
  }, [applySnapshot, currentSnapshot, flushPendingResize, showToast, undo]);

  const performRedo = useCallback(() => {
    flushPendingResize();
    const next = redo(currentSnapshot);
    if (next) {
      applySnapshot(next);
      showToast('Redo');
    }
  }, [applySnapshot, currentSnapshot, flushPendingResize, redo, showToast]);

  const rotate = useCallback((amount: number) => {
    const nextRotation = rotateBy(cropState.transform.rotation, amount);
    commit({ ...cropState, transform: { ...cropState.transform, rotation: nextRotation } }, `Rotate ${amount > 0 ? '90°' : '-90°'}`);
    showToast(amount > 0 ? 'Rotated right' : 'Rotated left');
  }, [commit, cropState, showToast]);

  const flip = useCallback((axis: 'x' | 'y') => {
    const key = axis === 'x' ? 'flipX' : 'flipY';
    commit({ ...cropState, transform: { ...cropState.transform, [key]: !cropState.transform[key] } }, axis === 'x' ? 'Flip horizontal' : 'Flip vertical');
    showToast(axis === 'x' ? 'Flipped horizontally' : 'Flipped vertically');
  }, [commit, cropState, showToast]);

  const beginCropInteraction = useCallback(() => { interactionStartRef.current = { snapshot: currentSnapshot, label: 'Crop' }; }, [currentSnapshot]);
  const beginRotationInteraction = useCallback(() => { interactionStartRef.current = { snapshot: currentSnapshot, label: 'Rotate' }; }, [currentSnapshot]);
  const beginZoomInteraction = useCallback(() => { interactionStartRef.current = { snapshot: currentSnapshot, label: 'Zoom' }; }, [currentSnapshot]);
  const endInteraction = useCallback(() => {
    const start = interactionStartRef.current;
    interactionStartRef.current = null;
    if (!start || JSON.stringify(start.snapshot) === JSON.stringify(currentSnapshot)) return;
    flushPendingResize();
    saveState(start.snapshot, start.label);
  }, [currentSnapshot, flushPendingResize, saveState]);

  const handleZoom = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom: clampZoom(zoom) })), []);
  const handleRotation = useCallback((rotation: number) => setCropState((prev) => ({ ...prev, transform: { ...prev.transform, rotation: normalizeRotation(rotation) } })), []);
  const cropperTransform = useMemo(() => getCropperTransform(cropState), [cropState]);

  const commitZoomPreset = useCallback((zoom: number) => commit({ ...cropState, zoom: clampZoom(zoom) }, `Zoom ${Math.round(clampZoom(zoom) * 100)}%`), [commit, cropState]);
  const zoomIn = useCallback(() => commit({ ...cropState, zoom: clampZoom(cropState.zoom + 0.1) }, `Zoom ${Math.round(clampZoom(cropState.zoom + 0.1) * 100)}%`), [commit, cropState]);
  const zoomOut = useCallback(() => commit({ ...cropState, zoom: clampZoom(cropState.zoom - 0.1) }, `Zoom ${Math.round(clampZoom(cropState.zoom - 0.1) * 100)}%`), [commit, cropState]);
  const resetZoom = useCallback(() => commit({ ...cropState, zoom: DEFAULT_ZOOM }, 'Zoom 100%'), [commit, cropState]);

  const openImage = useCallback(() => document.getElementById('replace-image-input')?.click(), []);
  const exportFromShortcut = useCallback(() => {
    document.getElementById('download-image-button')?.click();
  }, []);

  useKeyboardShortcuts({ onUndo: performUndo, onRedo: performRedo, onZoomIn: zoomIn, onZoomOut: zoomOut, onZoomReset: resetZoom, onZoomPreset: commitZoomPreset, onRotate: () => rotate(90), onOpen: openImage, onExport: exportFromShortcut, onEscape: () => setActiveTool(null) });

  const resetCrop = useCallback(() => {
    flushPendingResize();
    saveState(currentSnapshot, 'Crop reset');
    setCropState((prev) => ({ ...prev, crop: DEFAULT_CROP_STATE.crop, zoom: DEFAULT_ZOOM }));
    setSelectedAspect(null);
    setCroppedAreaPixels(null);
    showToast('Crop reset');
  }, [currentSnapshot, flushPendingResize, saveState, showToast]);

  const handleAspectChange = useCallback((value: number | null, label: string) => {
    flushPendingResize();
    saveState(currentSnapshot, `Crop · ${label}`);
    setSelectedAspect(value);
    setCroppedAreaPixels(null);
    showToast(`Aspect ratio set to ${label}`);
  }, [currentSnapshot, flushPendingResize, saveState, showToast]);

  const handleDimension = useCallback((axis: 'width' | 'height', value: string) => {
    if (value === '') {
      if (!resizeStartRef.current) resizeStartRef.current = currentSnapshot;
      if (axis === 'width') setCustomWidth(null); else setCustomHeight(null);
    } else {
      const num = Number.parseInt(value, 10);
      if (!Number.isFinite(num) || num <= 0) return;
      if (!resizeStartRef.current) resizeStartRef.current = currentSnapshot;
      if (!lockAspectRatio || !croppedAreaPixels) {
        if (axis === 'width') setCustomWidth(num); else setCustomHeight(num);
      } else if (axis === 'width') {
        setCustomWidth(num);
        setCustomHeight(deriveDimension(num, croppedAreaPixels.width, croppedAreaPixels.height, 'width'));
      } else {
        setCustomHeight(num);
        setCustomWidth(deriveDimension(num, croppedAreaPixels.width, croppedAreaPixels.height, 'height'));
      }
    }
    if (resizeTimerRef.current !== null) window.clearTimeout(resizeTimerRef.current);
    resizeTimerRef.current = window.setTimeout(() => flushPendingResize(), 500);
  }, [croppedAreaPixels, currentSnapshot, flushPendingResize, lockAspectRatio]);

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

  const exportSettings: ExportSettings = useMemo(() => ({
    format: exportFormat,
    quality: exportQuality,
    width: customWidth,
    height: customHeight,
    lockAspectRatio,
    backgroundColor,
  }), [backgroundColor, customHeight, customWidth, exportFormat, exportQuality, lockAspectRatio]);

  const preview = useExportPreview({
    image: loadedImage?.element ?? null,
    crop: croppedAreaPixels,
    transform: cropState.transform,
    settings: exportSettings,
  });

  const handleFormatChange = useCallback((format: ImageFormat) => {
    flushPendingResize();
    saveState(currentSnapshot, `Format · ${format.toUpperCase()}`);
    setExportFormat(format);
    if (format === 'png') setExportQuality(0.9);
    showToast(`Format set to ${format.toUpperCase()}`);
  }, [currentSnapshot, flushPendingResize, saveState, showToast]);

  const handleQualityInteractionStart = useCallback(() => {
    qualityStartRef.current = currentSnapshot;
  }, [currentSnapshot]);

  const handleQualityChange = useCallback((quality: number) => {
    setExportQuality(quality);
  }, []);

  const handleQualityCommit = useCallback(() => {
    const start = qualityStartRef.current;
    qualityStartRef.current = null;
    if (!start || JSON.stringify(start) === JSON.stringify(currentSnapshot)) return;
    flushPendingResize();
    saveState(start, `Quality · ${Math.round(exportQuality * 100)}%`);
  }, [currentSnapshot, exportQuality, flushPendingResize, saveState]);

  const handleDownload = useCallback(async () => {
    flushPendingResize();
    if (!loadedImage || !croppedAreaPixels) {
      showToast('No image to export');
      return;
    }

    setIsLoading(true);
    setDownloadStatus('preparing');

    try {
      await nextFrame();
      setDownloadStatus('cropping');
      await nextFrame();
      setDownloadStatus('resizing');
      const canvas = createExportCanvas(loadedImage.element, croppedAreaPixels, cropState.transform, exportSettings);
      await nextFrame();
      setDownloadStatus('encoding');
      const blob = await encodeCanvas(canvas, exportSettings);
      setDownloadStatus('downloading');

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `croplab-${Date.now()}.${getFileExtension(exportFormat)}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setDownloadStatus('complete');
      showToast('Export complete');
      window.setTimeout(() => setDownloadStatus('idle'), 1400);
    } catch (error) {
      console.error('Export error:', error);
      setDownloadStatus('error');
      showToast(error instanceof Error ? error.message : 'Failed to export image. Please try again.');
      window.setTimeout(() => setDownloadStatus('idle'), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [cropState.transform, croppedAreaPixels, exportFormat, exportSettings, flushPendingResize, loadedImage, showToast]);

  const outputDimensions = croppedAreaPixels ? getOutputDimensions(croppedAreaPixels, exportSettings) : null;
  const visibleExportStatus = downloadStatus === 'idle' ? preview.status : downloadStatus;

  return <div className={`app ${theme}`}>
    <AppHeader theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
    <main className="app-main">
      {!loadedImage ? <UploadScreen onLoad={(file) => void loadAndReset(file)} /> : <>
        <input id="replace-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadAndReset(file); event.currentTarget.value = ''; }} />
        <div className="workspace-shell">
          <div className="workspace-grid">
            <EditorSidebar activeTool={activeTool} selectedAspect={selectedAspect} cropWidth={croppedAreaPixels?.width ?? null} cropHeight={croppedAreaPixels?.height ?? null} onToolChange={setActiveTool} onAspectChange={handleAspectChange} onCropReset={resetCrop} />
            <section className="canvas-workspace" aria-label="Image canvas">
              <div className="canvas-header"><div><span className="eyebrow">Canvas</span><strong>{loadedImage.element.naturalWidth} × {loadedImage.element.naturalHeight}</strong></div><span>Drag to reposition · scroll to zoom · pinch on touch</span></div>
              <EditorToolbar canUndo={Boolean(undoStack.length)} canRedo={Boolean(redoStack.length)} zoom={cropState.zoom} rotation={cropState.transform.rotation} onReplace={replaceImage} onClear={clearImage} onUndo={performUndo} onRedo={performRedo} onRotateLeft={() => rotate(-90)} onRotateRight={() => rotate(90)} onFlipHorizontal={() => flip('x')} onFlipVertical={() => flip('y')} onReset={resetEdits} onZoomChange={handleZoom} onZoomCommit={endInteraction} onZoomInteractionStart={beginZoomInteraction} onZoomPreset={commitZoomPreset} onRotationChange={handleRotation} onRotationCommit={endInteraction} onRotationInteractionStart={beginRotationInteraction} />
              <div className="canvas-stage">
                <Cropper image={loadedImage.src} crop={cropState.crop} zoom={cropState.zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} zoomWithScroll aspect={selectedAspect ?? 0} onCropChange={(crop: Point) => setCropState((prev) => ({ ...prev, crop }))} onZoomChange={handleZoom} rotation={cropState.transform.rotation} onRotationChange={handleRotation} onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)} onInteractionStart={beginCropInteraction} onInteractionEnd={endInteraction} keyboardStep={5} showGrid transform={cropperTransform} />
              </div>
              <div className="canvas-footer"><span>Persistent transforms stay available above the canvas.</span><span>{loadedImage.format === 'gif' ? 'GIF edits use the first frame and export as a static image.' : 'Edits stay in this browser.'}</span></div>
            </section>
            <div className="right-workspace-column">
              <ExportPanel
                originalWidth={loadedImage.element.naturalWidth}
                originalHeight={loadedImage.element.naturalHeight}
                fileSize={loadedImage.fileSize}
                cropWidth={croppedAreaPixels?.width ?? null}
                cropHeight={croppedAreaPixels?.height ?? null}
                outputWidth={outputDimensions?.width ?? null}
                outputHeight={outputDimensions?.height ?? null}
                format={exportFormat}
                quality={exportQuality}
                width={customWidth}
                height={customHeight}
                lockAspectRatio={lockAspectRatio}
                backgroundColor={backgroundColor}
                estimatedSize={preview.size}
                exportStatus={visibleExportStatus}
                supportedFormats={supportedFormats}
                isLoading={isLoading}
                onFormatChange={handleFormatChange}
                onQualityChange={handleQualityChange}
                onQualityInteractionStart={handleQualityInteractionStart}
                onQualityCommit={handleQualityCommit}
                onWidthChange={(value) => handleDimension('width', value)}
                onHeightChange={(value) => handleDimension('height', value)}
                onLockToggle={() => setLockAspectRatio((prev) => !prev)}
                onBackgroundChange={setBackgroundColor}
                onDownload={() => void handleDownload()}
                              />
              <HistoryPanel entries={undoStack} redoCount={redoStack.length} />
            </div>
          </div>
        </div>
      </>}
    </main>
    <Toast visible={toast.visible} message={toast.message} />
    <footer className="app-footer"><div className="footer-content"><span><strong>CropLab</strong> · Private by design</span><span>JPEG · PNG · WebP · runs entirely in your browser</span><span>© {new Date().getFullYear()}</span></div></footer>
  </div>;
}

export default App;
