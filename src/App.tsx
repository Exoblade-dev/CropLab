'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { AppHeader } from '@/components/AppHeader';
import { EditorSidebar, type EditorTool } from '@/components/EditorSidebar';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ExportPanel } from '@/components/ExportPanel';
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
import type { CropState, ExportSettings, ExportStatus, ImageFormat } from '@/types/editor';

const DEFAULT_BACKGROUND = '#ffffff';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

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
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [downloadStatus, setDownloadStatus] = useState<ExportStatus>('idle');
  const interactionStartRef = useRef<CropState | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    window.setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  const { loadedImage, load, clear } = useImageLoader(showToast);
  const { undoStack, redoStack, saveState, resetHistory, undo, redo } = useEditorHistory();
  const supportedFormats = useSupportedExportFormats();

  const resetEditor = useCallback(() => {
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
    const previous = undo(cropState);
    if (previous) {
      setCropState(previous);
      showToast('Undo');
    }
  }, [cropState, undo, showToast]);

  const performRedo = useCallback(() => {
    const next = redo(cropState);
    if (next) {
      setCropState(next);
      showToast('Redo');
    }
  }, [cropState, redo, showToast]);

  const commit = useCallback((next: CropState) => {
    saveState(cropState);
    setCropState(next);
  }, [cropState, saveState]);

  const rotate = useCallback((amount: number) => {
    commit({ ...cropState, transform: { ...cropState.transform, rotation: rotateBy(cropState.transform.rotation, amount) } });
    showToast(amount > 0 ? 'Rotated right' : 'Rotated left');
  }, [commit, cropState, showToast]);

  const flip = useCallback((axis: 'x' | 'y') => {
    const key = axis === 'x' ? 'flipX' : 'flipY';
    commit({ ...cropState, transform: { ...cropState.transform, [key]: !cropState.transform[key] } });
    showToast(axis === 'x' ? 'Flipped horizontally' : 'Flipped vertically');
  }, [commit, cropState, showToast]);

  const beginInteraction = useCallback(() => { interactionStartRef.current = cropState; }, [cropState]);
  const endInteraction = useCallback(() => {
    const start = interactionStartRef.current;
    interactionStartRef.current = null;
    if (!start) return;
    if (JSON.stringify(start) !== JSON.stringify(cropState)) saveState(start);
  }, [cropState, saveState]);

  const handleZoom = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom: clampZoom(zoom) })), []);
  const handleRotation = useCallback((rotation: number) => setCropState((prev) => ({ ...prev, transform: { ...prev.transform, rotation: normalizeRotation(rotation) } })), []);
  const cropperTransform = useMemo(() => getCropperTransform(cropState), [cropState]);

  const commitZoomPreset = useCallback((zoom: number) => commit({ ...cropState, zoom: clampZoom(zoom) }), [commit, cropState]);
  const zoomIn = useCallback(() => commit({ ...cropState, zoom: clampZoom(cropState.zoom + 0.1) }), [commit, cropState]);
  const zoomOut = useCallback(() => commit({ ...cropState, zoom: clampZoom(cropState.zoom - 0.1) }), [commit, cropState]);
  const resetZoom = useCallback(() => commit({ ...cropState, zoom: DEFAULT_ZOOM }), [commit, cropState]);

  useKeyboardShortcuts({ onUndo: performUndo, onRedo: performRedo, onZoomIn: zoomIn, onZoomOut: zoomOut, onZoomReset: resetZoom, onZoomPreset: commitZoomPreset });

  const resetCrop = useCallback(() => {
    saveState(cropState);
    setCropState((prev) => ({ ...prev, crop: DEFAULT_CROP_STATE.crop, zoom: DEFAULT_ZOOM }));
    setSelectedAspect(null);
    setCroppedAreaPixels(null);
    showToast('Crop reset');
  }, [cropState, saveState, showToast]);

  const handleAspectChange = useCallback((value: number | null, label: string) => {
    saveState(cropState);
    setSelectedAspect(value);
    setCroppedAreaPixels(null);
    showToast(`Aspect ratio set to ${label}`);
  }, [cropState, saveState, showToast]);

  const handleDimension = useCallback((axis: 'width' | 'height', value: string) => {
    if (value === '') {
      if (axis === 'width') setCustomWidth(null);
      else setCustomHeight(null);
      return;
    }
    const num = Number.parseInt(value, 10);
    if (!Number.isFinite(num) || num <= 0) return;
    if (!lockAspectRatio || !croppedAreaPixels) {
      if (axis === 'width') setCustomWidth(num);
      else setCustomHeight(num);
      return;
    }
    if (axis === 'width') {
      setCustomWidth(num);
      setCustomHeight(deriveDimension(num, croppedAreaPixels.width, croppedAreaPixels.height, 'width'));
    } else {
      setCustomHeight(num);
      setCustomWidth(deriveDimension(num, croppedAreaPixels.width, croppedAreaPixels.height, 'height'));
    }
  }, [croppedAreaPixels, lockAspectRatio]);

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
    setExportFormat(format);
    if (format === 'png') setExportQuality(0.9);
    showToast(`Format set to ${format.toUpperCase()}`);
  }, [showToast]);

  const handleDownload = useCallback(async () => {
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
  }, [cropState.transform, croppedAreaPixels, exportFormat, exportSettings, loadedImage, showToast]);

  const outputDimensions = croppedAreaPixels ? getOutputDimensions(croppedAreaPixels, exportSettings) : null;
  const visibleExportStatus = downloadStatus === 'idle' ? preview.status : downloadStatus;

  return <div className={`app ${theme}`}>
    <AppHeader theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
    <main className="app-main">
      {!loadedImage ? <UploadScreen onLoad={(file) => void loadAndReset(file)} /> : <>
        <input id="replace-image-input" type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadAndReset(file); event.currentTarget.value = ''; }} />
        <div className="workspace-shell">
          <div className="workspace-grid">
            <EditorSidebar activeTool={activeTool} selectedAspect={selectedAspect} cropWidth={croppedAreaPixels?.width ?? null} cropHeight={croppedAreaPixels?.height ?? null} onToolChange={setActiveTool} onAspectChange={handleAspectChange} onCropReset={resetCrop} />
            <section className="canvas-workspace" aria-label="Image canvas">
              <div className="canvas-header"><div><span className="eyebrow">Canvas</span><strong>{loadedImage.element.naturalWidth} × {loadedImage.element.naturalHeight}</strong></div><span>Drag to reposition · scroll to zoom · pinch on touch</span></div>
              <EditorToolbar canUndo={Boolean(undoStack.length)} canRedo={Boolean(redoStack.length)} zoom={cropState.zoom} rotation={cropState.transform.rotation} onReplace={replaceImage} onClear={clearImage} onUndo={performUndo} onRedo={performRedo} onRotateLeft={() => rotate(-90)} onRotateRight={() => rotate(90)} onFlipHorizontal={() => flip('x')} onFlipVertical={() => flip('y')} onReset={resetEdits} onZoomChange={handleZoom} onZoomCommit={endInteraction} onZoomInteractionStart={beginInteraction} onZoomPreset={commitZoomPreset} onRotationChange={handleRotation} onRotationCommit={endInteraction} onRotationInteractionStart={beginInteraction} />
              <div className="canvas-stage">
                <Cropper image={loadedImage.src} crop={cropState.crop} zoom={cropState.zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} zoomWithScroll aspect={selectedAspect ?? 0} onCropChange={(crop: Point) => setCropState((prev) => ({ ...prev, crop }))} onZoomChange={handleZoom} rotation={cropState.transform.rotation} onRotationChange={handleRotation} onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)} onInteractionStart={beginInteraction} onInteractionEnd={endInteraction} keyboardStep={5} showGrid transform={cropperTransform} />
              </div>
              <div className="canvas-footer"><span>Persistent transforms stay available above the canvas.</span><span>Edits stay in this browser.</span></div>
            </section>
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
              onQualityChange={setExportQuality}
              onWidthChange={(value) => handleDimension('width', value)}
              onHeightChange={(value) => handleDimension('height', value)}
              onLockToggle={() => setLockAspectRatio((prev) => !prev)}
              onBackgroundChange={setBackgroundColor}
              onDownload={() => void handleDownload()}
            />
          </div>
        </div>
      </>}
    </main>
    <Toast visible={toast.visible} message={toast.message} />
    <footer className="app-footer"><div className="footer-content"><span><strong>CropLab</strong> · Private by design</span><span>JPEG · PNG · WebP · runs entirely in your browser</span><span>© {new Date().getFullYear()}</span></div></footer>
  </div>;
}

export default App;
