'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { useEditorHistory } from '@/hooks/use-editor-history';
import { useExportPreview } from '@/hooks/use-export-preview';
import { useSupportedExportFormats } from '@/hooks/use-supported-export-formats';
import { useImageLoader } from '@/hooks/use-image-loader';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_CROP_STATE } from '@/lib/image/constants';
import { createExportCanvas, encodeCanvas, getFileExtension, getOutputDimensions } from '@/lib/image/export';
import { getCropperTransform } from '@/lib/image/transform';
import type { FreeformCropRect } from '@/lib/editor/freeform';
import { DEFAULT_ADJUSTMENTS, ADJUSTMENT_LIMITS, getAdjustmentCssFilter } from '@/lib/image/adjustments';
import { calculateFitZoom, clampZoom, DEFAULT_ZOOM, deriveDimension, rotateBy, snapRotation } from '@/lib/editor/interaction';
import type { CropState, EditorSnapshot, ExportSettings, ExportStatus, ImageFormat } from '@/types/editor';
import type { EditorTool } from '@/components/EditorSidebar';

const DEFAULT_BACKGROUND = '#ffffff';

type MobilePanel = EditorTool | 'more' | null;
type ConfirmationRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
};

export const DEFAULT_EDITOR_SNAPSHOT: EditorSnapshot = {
  cropState: DEFAULT_CROP_STATE,
  cropArea: null,
  freeCropRect: null,
  selectedAspect: null,
  width: null,
  height: null,
  lockAspectRatio: true,
  format: 'png',
  quality: 0.9,
  backgroundColor: DEFAULT_BACKGROUND,
  adjustments: DEFAULT_ADJUSTMENTS,
};

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

export function useCropLabEditor() {
  const { theme, setTheme } = useTheme();
  const [activeTool, setActiveTool] = useState<EditorTool | null>('crop');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [cropState, setCropState] = useState<CropState>(DEFAULT_CROP_STATE);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [freeCropRect, setFreeCropRect] = useState<FreeformCropRect | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<ImageFormat>('png');
  const [exportQuality, setExportQuality] = useState(0.9);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);
  const [fitContainerSize, setFitContainerSize] = useState({ width: 0, height: 0 });
  const [downloadStatus, setDownloadStatus] = useState<ExportStatus>('idle');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutGuideOpen, setIsShortcutGuideOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
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
    adjustments,
    cropArea: croppedAreaPixels,
    freeCropRect,
    lockAspectRatio,
  }), [adjustments, backgroundColor, cropState, croppedAreaPixels, customHeight, customWidth, exportFormat, exportQuality, freeCropRect, lockAspectRatio, selectedAspect]);

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setCropState(snapshot.cropState);
    setSelectedAspect(snapshot.selectedAspect);
    setCustomWidth(snapshot.width);
    setCustomHeight(snapshot.height);
    setExportFormat(snapshot.format);
    setExportQuality(snapshot.quality);
    setBackgroundColor(snapshot.backgroundColor);
    setAdjustments(snapshot.adjustments ?? DEFAULT_ADJUSTMENTS);
    setLockAspectRatio(snapshot.lockAspectRatio);
    setCroppedAreaPixels(snapshot.cropArea);
    setFreeCropRect(snapshot.freeCropRect ?? null);
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
    setFreeCropRect(null);
    setSelectedAspect(null);
    setCustomWidth(null);
    setCustomHeight(null);
    setExportFormat('png');
    setExportQuality(0.9);
    setLockAspectRatio(true);
    setBackgroundColor(DEFAULT_BACKGROUND);
    setAdjustments(DEFAULT_ADJUSTMENTS);
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
  const handleCropPositionChange = useCallback((crop: { x: number; y: number }) => setCropState((prev) => ({ ...prev, crop })), []);
  const handleCropAreaChange = useCallback((area: Area) => setCroppedAreaPixels(area), []);
  const handleRotation = useCallback((rotation: number) => setCropState((prev) => ({ ...prev, transform: { ...prev.transform, rotation: snapRotation(rotation) } })), []);
  const cropperTransform = useMemo(() => getCropperTransform(cropState), [cropState]);

  const updateFitContainerSize = useCallback((width: number, height: number) => {
    setFitContainerSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
  }, []);

  const handleFit = useCallback(() => {
    if (!loadedImage || fitContainerSize.width <= 0 || fitContainerSize.height <= 0) return;
    const fitZoom = calculateFitZoom(
      loadedImage.previewWidth,
      loadedImage.previewHeight,
      fitContainerSize.width,
      fitContainerSize.height,
      selectedAspect,
      cropState.transform.rotation,
    );
    setCropState((prev) => ({ ...prev, zoom: fitZoom, crop: { x: 0, y: 0 } }));
  }, [cropState.transform.rotation, fitContainerSize, loadedImage, selectedAspect]);

  const commitZoomPreset = useCallback((zoom: number) => setCropState((prev) => ({ ...prev, zoom: clampZoom(zoom) })), []);
  const zoomIn = useCallback(() => setCropState((prev) => ({ ...prev, zoom: clampZoom(prev.zoom + 0.1) })), []);
  const zoomOut = useCallback(() => setCropState((prev) => ({ ...prev, zoom: clampZoom(prev.zoom - 0.1) })), []);
  const resetZoom = useCallback(() => setCropState((prev) => ({ ...prev, zoom: DEFAULT_ZOOM })), []);

  const resetRotation = useCallback(() => {
    flushPendingResize();
    const nextCropState = { ...cropState, transform: { ...cropState.transform, rotation: 0 } };
    recordHistory({ ...currentSnapshot, cropState: nextCropState }, 'Rotation reset');
    setCropState(nextCropState);
    showToast('Rotation reset');
  }, [cropState, currentSnapshot, flushPendingResize, recordHistory, showToast]);

  const resetCrop = useCallback(() => {
    flushPendingResize();
    const nextCropState = { ...cropState, crop: DEFAULT_CROP_STATE.crop, zoom: DEFAULT_ZOOM };
    const nextSnapshot = { ...currentSnapshot, cropState: nextCropState, selectedAspect: null, cropArea: null, freeCropRect: null };
    recordHistory(nextSnapshot, 'Crop reset');
    setCropState(nextCropState);
    setSelectedAspect(null);
    setCroppedAreaPixels(null);
    setFreeCropRect(null);
    showToast('Crop reset');
  }, [cropState, currentSnapshot, flushPendingResize, recordHistory, showToast]);

  const handleAspectChange = useCallback((value: number | null, label: string) => {
    flushPendingResize();
    recordHistory({ ...currentSnapshot, selectedAspect: value, cropArea: null, freeCropRect: null }, `Crop · ${label}`);
    setSelectedAspect(value);
    setCroppedAreaPixels(null);
    setFreeCropRect(null);
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
    setConfirmation({
      title: 'Reset edits?',
      message: 'This will remove the current crop, transforms, resize settings, format, quality, and background choices. The source image will remain loaded.',
      confirmLabel: 'Yes, reset',
      action: () => {
        flushPendingResize();
        recordHistory(DEFAULT_EDITOR_SNAPSHOT, 'Reset to original');
        applySnapshot(DEFAULT_EDITOR_SNAPSHOT);
        showToast('Reset to original');
      },
    });
  }, [applySnapshot, flushPendingResize, recordHistory, showToast]);

  const clearImage = useCallback(() => {
    setConfirmation({
      title: 'Clear current image?',
      message: 'This will remove the current image and all of its edits from CropLab and return to the upload screen.',
      confirmLabel: 'Yes, clear image',
      action: () => {
        clear();
        resetEditor();
        showToast('Image cleared');
      },
    });
  }, [clear, resetEditor, showToast]);

  const replaceImage = useCallback(() => {
    const openPicker = () => document.getElementById('replace-image-input')?.click();
    setConfirmation({
      title: 'Replace image?',
      message: 'This will replace the current image and discard all edits attached to it.',
      confirmLabel: 'Yes, replace',
      action: openPicker,
    });
  }, []);

  const goHome = useCallback(() => {
    if (!loadedImage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setConfirmation({
      title: 'Return to home?',
      message: 'This will clear the current image and all edits before returning to the CropLab home screen.',
      confirmLabel: 'Yes, go home',
      action: () => {
        clear();
        resetEditor();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Returned to home');
      },
    });
  }, [clear, loadedImage, resetEditor, showToast]);

  const confirmAction = useCallback(() => {
    const action = confirmation?.action;
    setConfirmation(null);
    action?.();
  }, [confirmation]);
  const cancelConfirmation = useCallback(() => setConfirmation(null), []);
  const openImage = useCallback(() => {
    if (loadedImage) replaceImage();
    else document.getElementById('upload-image-input')?.click();
  }, [loadedImage, replaceImage]);
  const exportFromShortcut = useCallback(() => setIsExportOpen(true), []);

  const handleHistorySelect = useCallback((index: number) => {
    flushPendingResize();
    const snapshot = jumpTo(index);
    if (!snapshot) return;
    applySnapshot(snapshot);
    showToast(index === 0 ? 'Returned to original' : `Returned to: ${historyEntries[index].label}`);
  }, [applySnapshot, flushPendingResize, historyEntries, jumpTo, showToast]);

  useKeyboardShortcuts({ onUndo: performUndo, onRedo: performRedo, onZoomIn: zoomIn, onZoomOut: zoomOut, onZoomReset: handleFit, onZoomPreset: commitZoomPreset, onRotate: () => rotate(90), onOpen: openImage, onExport: exportFromShortcut, onEscape: () => { setActiveTool(null); setMobilePanel(null); setIsExportOpen(false); } });

  const adjustmentCssFilter = useMemo(() => getAdjustmentCssFilter(adjustments), [adjustments]);
  const exportSettings: ExportSettings = useMemo(() => ({ format: exportFormat, quality: exportQuality, width: customWidth, height: customHeight, lockAspectRatio, backgroundColor, adjustments }), [adjustments, backgroundColor, customHeight, customWidth, exportFormat, exportQuality, lockAspectRatio]);
  const preview = useExportPreview({ image: loadedImage?.element ?? null, crop: croppedAreaPixels, transform: cropState.transform, settings: exportSettings });
  const handleFreeformCropChange = useCallback((rect: FreeformCropRect, area: Area) => { setFreeCropRect(rect); setCroppedAreaPixels(area); }, []);

  const handleFormatChange = useCallback((format: ImageFormat) => {
    flushPendingResize();
    const nextQuality = format === 'png' ? 0.9 : exportQuality;
    recordHistory({ ...currentSnapshot, format, quality: nextQuality }, `Format · ${format.toUpperCase()}`);
    setExportFormat(format);
    if (format === 'png') setExportQuality(nextQuality);
    showToast(`Format set to ${format.toUpperCase()}`);
  }, [currentSnapshot, exportQuality, flushPendingResize, recordHistory, showToast]);

  const handleQualityInteractionStart = useCallback(() => { qualityStartRef.current = currentSnapshot; }, [currentSnapshot]);
  const handleQualityChange = useCallback((quality: number) => setExportQuality(quality), []);
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

  const handleAdjustmentChange = useCallback((key: keyof typeof DEFAULT_ADJUSTMENTS, value: number) => {
    const limits = ADJUSTMENT_LIMITS[key];
    const nextValue = Math.min(limits.max, Math.max(limits.min, value));
    setAdjustments((previous) => ({ ...previous, [key]: nextValue }));
  }, []);

  const handleAdjustmentCommit = useCallback((key: keyof typeof DEFAULT_ADJUSTMENTS) => {
    flushPendingResize();
    const nextAdjustments = { ...adjustments };
    const value = Math.round(nextAdjustments[key] * 10) / 10;
    recordHistory({ ...currentSnapshot, adjustments: nextAdjustments }, `${key[0].toUpperCase()}${key.slice(1)} · ${value > 0 ? '+' : ''}${value}`);
  }, [adjustments, currentSnapshot, flushPendingResize, recordHistory]);

  const resetAdjustments = useCallback(() => {
    flushPendingResize();
    if (JSON.stringify(adjustments) === JSON.stringify(DEFAULT_ADJUSTMENTS)) return;
    recordHistory({ ...currentSnapshot, adjustments: DEFAULT_ADJUSTMENTS }, 'Adjustments reset');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    showToast('Adjustments reset');
  }, [adjustments, currentSnapshot, flushPendingResize, recordHistory, showToast]);

  const handleDownload = useCallback(async () => {
    flushPendingResize();
    if (!loadedImage || !croppedAreaPixels) {
      showToast('No image to export');
      return;
    }
    setIsLoading(true);
    setDownloadStatus('preparing');
    try {
      await nextFrame(); setDownloadStatus('cropping');
      await nextFrame(); setDownloadStatus('resizing');
      await nextFrame(); setDownloadStatus('encoding');
      let blob = preview.getBlob();
      if (!blob) {
        const canvas = createExportCanvas(loadedImage.element, croppedAreaPixels, cropState.transform, exportSettings);
        blob = await encodeCanvas(canvas, exportSettings);
      }
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
  }, [cropState.transform, croppedAreaPixels, exportFormat, exportSettings, flushPendingResize, loadedImage, preview, showToast]);

  const outputDimensions = croppedAreaPixels ? getOutputDimensions(croppedAreaPixels, exportSettings) : null;
  const visibleExportStatus = downloadStatus === 'idle' ? preview.status : downloadStatus;

  return {
    theme, setTheme, activeTool, setActiveTool, mobilePanel, setMobilePanel, toast, isLoading,
    loadedImage, loadAndReset, clear, cropState, croppedAreaPixels, freeCropRect, selectedAspect,
    exportFormat, exportQuality, customWidth, customHeight, lockAspectRatio, backgroundColor, adjustments,
    downloadStatus, isHistoryOpen, setIsHistoryOpen, isExportOpen, setIsExportOpen, isShortcutGuideOpen,
    setIsShortcutGuideOpen, confirmation, confirmAction, cancelConfirmation, historyEntries,
    historyCurrentIndex, canUndo, canRedo, supportedFormats, preview, outputDimensions, visibleExportStatus,
    cropperTransform, resetCrop, handleAspectChange, handleDimension, handleLockToggle, rotate, flip,
    resetRotation, resetEdits, replaceImage, clearImage, performUndo, performRedo, handleZoom, commitZoomPreset,
    zoomIn, zoomOut, resetZoom, handleRotation, beginCropInteraction, beginRotationInteraction, endInteraction,
    handleFreeformCropChange, handleCropPositionChange, handleCropAreaChange, handleFit, updateFitContainerSize,
    handleHistorySelect, handleFormatChange, handleQualityChange, handleQualityInteractionStart,
    handleQualityCommit, handleBackgroundChange, adjustmentCssFilter, handleAdjustmentChange, handleAdjustmentCommit, resetAdjustments, handleDownload, goHome, openImage,
  };
}
