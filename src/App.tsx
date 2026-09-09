'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { AppHeader } from '@/components/AppHeader';
import { EditorSidebar, type EditorTool } from '@/components/EditorSidebar';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ExportPanel } from '@/components/ExportPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { MobileEditorControls } from '@/components/MobileEditorControls';
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

type MobilePanel = EditorTool | 'more' | 'export' | null;

const DEFAULT_EDITOR_SNAPSHOT: EditorSnapshot = {
  cropState: DEFAULT_CROP_STATE,
  cropArea: null,
  selectedAspect: null,
  width: null,
  height: null,
  lockAspectRatio: true,
  format: 'png',
  quality: 0.9,
  backgroundColor: DEFAULT_BACKGROUND,
};

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

export function App() {
  const { theme, setTheme } = useTheme();
  const [activeTool, setActiveTool] = useState<EditorTool | null>('crop');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
  const interactionStartRef = useRef<{ snapshot: EditorSnapshot; label: string } | null>(null);
  const resizeStartRef = useRef<EditorSnapshot | null>(null);
  const qualityStartRef = useRef<EditorSnapshot | null>(null);
  const resizeTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    window.setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  const { loadedImage, load, clear } = useImageLoader(showToast);
  const { entries: historyEntries, currentIndex: historyCurrentIndex, canUndo, canRedo, record: recordHistory, resetHistory, undo, redo, jumpTo } = useEditorHistory(DEFAULT_EDITOR_SNAPSHOT);
  const supportedFormats = useSupportedExportFormats();

  const currentSnapshot = useMemo<EditorSnapshot>(() => ({
    cropState,
    selectedAspect,
    width: customWidth,
    height: customHeight,
    format: exportFormat,
    quality: exportQuality,
    backgroundColor,
    cropArea: croppedAreaPixels,
    lockAspectRatio,
  }), [backgroundColor, cropState, croppedAreaPixels, customHeight, customWidth, exportFormat, exportQuality, lockAspectRatio, selectedAspect]);

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setCropState(snapshot.cropState);
    setSelectedAspect(snapshot.selectedAspect);
    setCustomWidth(snapshot.width);
    setCustomHeight(snapshot.height);
    setExportFormat(snapshot.format);
    setExportQuality(snapshot.quality);
    setBackgroundColor(snapshot.backgroundColor);
    setLockAspectRatio(snapshot.lockAspectRatio);
    setCroppedAreaPixels(snapshot.cropArea);
  }, []);

  const flushPendingResize = useCallback(() => {
    if (resizeTimerRef.current !== null) {
      window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = null;
    }
    if (resizeStartRef.current) {
      if (JSON.stringify(resizeStartRef.current) !== JSON.stringify(currentSnapshot)) {
        const label = currentSnapshot.width && currentSnapshot.height ? `Resize → ${currentSnapshot.width} × ${currentSnapshot.height}` : 'Resize';
        recordHistory(currentSnapshot, label);
      }
      resizeStartRef.current = null;
    }
  }, [currentSnapshot, recordHistory]);

  const commit = useCallback((next: CropState, label: string) => {
    flushPendingResize();
    recordHistory({ ...currentSnapshot, cropState: next }, label);
    setCropState(next);
  }, [currentSnapshot, flushPendingResize, recordHistory]);

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
    setIsHistoryOpen(false);
    setMobilePanel(null);
    resetHistory(DEFAULT_EDITOR_SNAPSHOT);
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
    const previous = undo();
    if (previous) {
      applySnapshot(previous);
      showToast('Undo');
    }
  }, [applySnapshot, flushPendingResize, showToast, undo]);

  const performRedo = useCallback(() => {
    flushPendingResize();
    const next = redo();
    if (next) {
      applySnapshot(next);
      showToast('Redo');
    }
  }, [applySnapshot, flushPendingResize, redo, showToast]);

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
  const endInteraction = useCallback(() => {
    const start = interactionStartRef.current;
    interactionStartRef.current = null;
    if (!start || JSON.stringify(start.snapshot) === JSON.stringify(currentSnapshot)) return;
    flushPendingResize();
    recordHistory(currentSnapshot, start.label);
  }, [currentSnapshot, flushPendingResize, recordHistory]);

  const handleZoom = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom: clampZoom(zoom) })), []);
  const handleRotation = useCallback((rotation: number) => setCropState((prev) => ({ ...prev, transform: { ...prev.transform, rotation: normalizeRotation(rotation) } })), []);
  const cropperTransform = useMemo(() => getCropperTransform(cropState), [cropState]);

  const commitZoomPreset = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom: clampZoom(zoom) })), []);
  const zoomIn = useCallback(() => setCropState((prev) => ({ ...prev, zoom: clampZoom(prev.zoom + 0.1) })), []);
  const zoomOut = useCallback(() => setCropState((prev) => ({ ...prev, zoom: clampZoom(prev.zoom - 0.1) })), []);
  const resetZoom = useCallback(() => setCropState((prev) => ({ ...prev, zoom: DEFAULT_ZOOM })), []);

  const resetCrop = useCallback(() => {
    flushPendingResize();
    const nextCropState = { ...cropState, crop: DEFAULT_CROP_STATE.crop, zoom: DEFAULT_ZOOM };
    const nextSnapshot = { ...currentSnapshot, cropState: nextCropState, selectedAspect: null, cropArea: null };
    recordHistory(nextSnapshot, 'Crop reset');
    setCropState(nextCropState);
    setSelectedAspect(null);
    setCroppedAreaPixels(null);
    showToast('Crop reset');
  }, [cropState, currentSnapshot, flushPendingResize, recordHistory, showToast]);

  const handleAspectChange = useCallback((value: number | null, label: string) => {
    flushPendingResize();
    recordHistory({ ...currentSnapshot, selectedAspect: value, cropArea: null }, `Crop · ${label}`);
    setSelectedAspect(value);
    setCroppedAreaPixels(null);
    showToast(`Aspect ratio set to ${label}`);
  }, [currentSnapshot, flushPendingResize, recordHistory, showToast]);

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
    flushPendingResize();
    recordHistory(DEFAULT_EDITOR_SNAPSHOT, 'Reset to original');
    applySnapshot(DEFAULT_EDITOR_SNAPSHOT);
    showToast('Reset to original');
  }, [applySnapshot, flushPendingResize, recordHistory, showToast]);

  const clearImage = useCallback(() => {
    if (!window.confirm('Clear current image and return to upload screen?')) return;
    clear();
    resetEditor();
    showToast('Image cleared');
  }, [clear, resetEditor, showToast]);

  const replaceImage = useCallback(() => {
    if (canUndo || canRedo) {
      if (!window.confirm('Replace image? This will discard current edits.')) return;
    }
    document.getElementById('replace-image-input')?.click();
  }, [canRedo, canUndo]);

  const openImage = useCallback(() => {
    if (loadedImage) replaceImage();
    else document.getElementById('upload-image-input')?.click();
  }, [loadedImage, replaceImage]);
  const exportFromShortcut = useCallback(() => {
    document.getElementById('download-image-button')?.click();
  }, []);

  const handleHistorySelect = useCallback((index: number) => {
    flushPendingResize();
    const snapshot = jumpTo(index);
    if (!snapshot) return;
    applySnapshot(snapshot);
    showToast(index === 0 ? 'Returned to original' : `Returned to: ${historyEntries[index].label}`);
  }, [applySnapshot, flushPendingResize, historyEntries, jumpTo, showToast]);

  useKeyboardShortcuts({ onUndo: performUndo, onRedo: performRedo, onZoomIn: zoomIn, onZoomOut: zoomOut, onZoomReset: resetZoom, onZoomPreset: commitZoomPreset, onRotate: () => rotate(90), onOpen: openImage, onExport: exportFromShortcut, onEscape: () => { setActiveTool(null); setMobilePanel(null); } });

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
    const nextQuality = format === 'png' ? 0.9 : exportQuality;
    recordHistory({ ...currentSnapshot, format, quality: nextQuality }, `Format · ${format.toUpperCase()}`);
    setExportFormat(format);
    if (format === 'png') setExportQuality(nextQuality);
    showToast(`Format set to ${format.toUpperCase()}`);
  }, [currentSnapshot, exportQuality, flushPendingResize, recordHistory, showToast]);

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
    recordHistory(currentSnapshot, `Quality · ${Math.round(exportQuality * 100)}%`);
  }, [currentSnapshot, exportQuality, flushPendingResize, recordHistory]);

  const handleLockToggle = useCallback(() => {
    flushPendingResize();
    const nextLock = !lockAspectRatio;
    recordHistory({ ...currentSnapshot, lockAspectRatio: nextLock }, nextLock ? 'Lock aspect ratio' : 'Unlock aspect ratio');
    setLockAspectRatio(nextLock);
  }, [currentSnapshot, flushPendingResize, lockAspectRatio, recordHistory]);

  const handleBackgroundChange = useCallback((color: string) => {
    recordHistory({ ...currentSnapshot, backgroundColor: color }, `JPEG background · ${color.toUpperCase()}`);
    setBackgroundColor(color);
  }, [currentSnapshot, recordHistory]);

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
    <a className="skip-link" href="#main-content">Skip to editor</a>
    <AppHeader theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} onExport={loadedImage ? () => setMobilePanel('export') : undefined} />
    <main className="app-main" id="main-content">
      {!loadedImage ? <UploadScreen onLoad={(file) => void loadAndReset(file)} /> : <>
        <input id="replace-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadAndReset(file); event.currentTarget.value = ''; }} />
        <div className="workspace-shell">
          <div className={`workspace-grid ${mobilePanel === 'export' ? 'mobile-export-open' : ''}`}>
            <EditorSidebar activeTool={activeTool} selectedAspect={selectedAspect} cropWidth={croppedAreaPixels?.width ?? null} cropHeight={croppedAreaPixels?.height ?? null} onToolChange={setActiveTool} onAspectChange={handleAspectChange} onCropReset={resetCrop} />
            <section className="canvas-workspace" aria-label="Image canvas">
              <div className="canvas-header"><div><span className="eyebrow">Canvas</span><strong>{loadedImage.element.naturalWidth} × {loadedImage.element.naturalHeight}</strong></div><span>Drag to reposition · scroll to zoom · pinch on touch</span></div>
              <EditorToolbar canUndo={canUndo} canRedo={canRedo} isHistoryOpen={isHistoryOpen} onHistory={() => setIsHistoryOpen(true)} zoom={cropState.zoom} rotation={cropState.transform.rotation} onReplace={replaceImage} onClear={clearImage} onUndo={performUndo} onRedo={performRedo} onRotateLeft={() => rotate(-90)} onRotateRight={() => rotate(90)} onFlipHorizontal={() => flip('x')} onFlipVertical={() => flip('y')} onReset={resetEdits} onZoomChange={handleZoom} onZoomPreset={commitZoomPreset} onRotationChange={handleRotation} onRotationCommit={endInteraction} onRotationInteractionStart={beginRotationInteraction} />
              <div className="canvas-stage">
                <Cropper image={loadedImage.src} crop={cropState.crop} zoom={cropState.zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} zoomWithScroll aspect={selectedAspect ?? 0} onCropChange={(crop: Point) => setCropState((prev) => ({ ...prev, crop }))} onZoomChange={handleZoom} rotation={cropState.transform.rotation} onRotationChange={handleRotation} onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)} onInteractionStart={beginCropInteraction} onInteractionEnd={endInteraction} keyboardStep={5} showGrid transform={cropperTransform} />
              </div>
              <div className="canvas-footer"><span>Persistent transforms stay available above the canvas.</span><span>{loadedImage.format === 'gif' ? 'GIF edits use the first frame and export as a static image.' : 'Edits stay in this browser.'}</span></div>
            </section>
            <div className={`right-workspace-column ${mobilePanel === 'export' ? 'mobile-open' : ''}`}>
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
                onLockToggle={handleLockToggle}
                onBackgroundChange={handleBackgroundChange}
                onDownload={() => void handleDownload()}
              />
            </div>
          </div>
          <MobileEditorControls
            panel={mobilePanel}
            selectedAspect={selectedAspect}
            zoom={cropState.zoom}
            canUndo={canUndo}
            canRedo={canRedo}
            onPanelChange={setMobilePanel}
            onAspectChange={handleAspectChange}
            onCropReset={resetCrop}
            onRotateLeft={() => rotate(-90)}
            onRotateRight={() => rotate(90)}
            onFlipHorizontal={() => flip('x')}
            onFlipVertical={() => flip('y')}
            onZoomPreset={commitZoomPreset}
            onUndo={performUndo}
            onRedo={performRedo}
            onHistory={() => setIsHistoryOpen(true)}
            onReplace={replaceImage}
            onClear={clearImage}
            onReset={resetEdits}
          />
        </div>
      </>}
    </main>
    <Toast visible={toast.visible} message={toast.message} />
    <HistoryPanel open={isHistoryOpen} entries={historyEntries} currentIndex={historyCurrentIndex} onSelect={handleHistorySelect} onClose={closeHistory} />
    <footer className="app-footer"><div className="footer-content"><span><strong>CropLab</strong> · Private by design</span><span>JPEG · PNG · WebP · runs entirely in your browser</span><span>© {new Date().getFullYear()}</span></div></footer>
  </div>;
}

export default App;
