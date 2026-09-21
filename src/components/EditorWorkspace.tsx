'use client';

import Cropper from 'react-easy-crop';
import { Download } from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import { EditorSidebar } from '@/components/EditorSidebar';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ExportPreview } from '@/components/ExportPreview';
import { MobileEditorControls } from '@/components/MobileEditorControls';
import { ImageThumbnailRail } from '@/components/ImageThumbnailRail';
import { FreeformCropper } from '@/components/FreeformCropper';
import type { useCropLabEditor } from '@/hooks/use-croplab-editor';
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/editor/interaction';
import { scaleCropAreaToSource } from '@/lib/image/preview';

type EditorState = ReturnType<typeof useCropLabEditor>;

export function EditorWorkspace({ editor }: { editor: EditorState }) {
  const {
    loadedImage, submitImageInput, submitReplaceInput, imageItems, activeImageId, switchImage, removeCollectionImage, batchExport, handleBatchExport, cancelBatchExport, activeTool, selectedAspect, croppedAreaPixels, outputDimensions, lockAspectRatio,
    isLoading, setActiveTool, handleAspectChange, resetCrop, handleDimension, handleLockToggle, cropState,
    canUndo, canRedo, isHistoryOpen, setIsHistoryOpen, clearImage, performUndo, performRedo,
    rotate, flip, resetRotation, resetEdits, handleZoom, commitZoomPreset, handleRotation, endInteraction,
    beginRotationInteraction, beginCropInteraction, freeCropRect, handleFreeformCropChange, cropperTransform,
    handleCropPositionChange, handleCropAreaChange, preview, updateFitContainerSize, exportFormat, exportQuality, backgroundColor, setIsExportOpen, mobilePanel, setMobilePanel, adjustments, handleAdjustmentChange, handleAdjustmentCommit, resetAdjustments, supportedFormats,
  } = editor;
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !loadedImage) return;
    const update = () => {
      const rect = stage.getBoundingClientRect();
      updateFitContainerSize(rect.width, rect.height);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [loadedImage, updateFitContainerSize]);

  if (!loadedImage) return null;

  const handleFit = editor.handleFit;

  return <>
        <input id="replace-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(event) => { void submitReplaceInput(Array.from(event.target.files ?? []), 'picker'); event.currentTarget.value = ''; }} />
        <div className="workspace-shell">
          <div className="workspace-grid">
            <EditorSidebar
              activeTool={activeTool}
              selectedAspect={selectedAspect}
              cropWidth={croppedAreaPixels?.width ?? null}
              cropHeight={croppedAreaPixels?.height ?? null}
              outputWidth={outputDimensions?.width ?? null}
              outputHeight={outputDimensions?.height ?? null}
              lockAspectRatio={lockAspectRatio}
              isLoading={isLoading}
              onToolChange={setActiveTool}
              onAspectChange={handleAspectChange}
              onCropReset={resetCrop}
              onWidthChange={(value) => handleDimension('width', value)}
              onHeightChange={(value) => handleDimension('height', value)}
              onLockToggle={handleLockToggle}
              adjustments={adjustments}
              onAdjustmentChange={handleAdjustmentChange}
              onAdjustmentCommit={handleAdjustmentCommit}
              onAdjustmentsReset={resetAdjustments}
            />
            <section className="canvas-workspace" aria-label="Image canvas">
              <div className="canvas-header"><div><span className="eyebrow">Canvas</span><strong>{loadedImage.element.naturalWidth} × {loadedImage.element.naturalHeight}</strong></div><div className="canvas-header-actions"><span>{selectedAspect === null ? 'Drag crop box · resize handles · zoom and rotate above' : 'Drag to reposition · scroll to zoom · pinch on touch'}</span><div className="canvas-header-actions-buttons"><ExportPreview previewUrl={preview.url} beforePreviewUrl={preview.beforePreviewUrl} beforePreviewReady={preview.beforePreviewReady} previewStatus={preview.status} previewSize={preview.size} outputWidth={outputDimensions?.width ?? null} outputHeight={outputDimensions?.height ?? null} originalWidth={loadedImage.element.naturalWidth} originalHeight={loadedImage.element.naturalHeight} originalFileSize={loadedImage.fileSize} format={exportFormat} quality={exportQuality} backgroundColor={backgroundColor} availableFormats={supportedFormats.map((item) => item.id)} onFormatChange={editor.handleFormatChange} getInspectionBlob={preview.getInspectionBlob} getBeforeInspectionBlob={preview.getBeforeInspectionBlob} disabled={isLoading} /><button type="button" className="canvas-export-button" onClick={() => setIsExportOpen(true)} disabled={isLoading}><Download size={14} /> Export</button></div></div></div>
              <EditorToolbar canUndo={canUndo} canRedo={canRedo} isHistoryOpen={isHistoryOpen} onHistory={() => setIsHistoryOpen(true)} zoom={cropState.zoom} rotation={cropState.transform.rotation} onClear={clearImage} onUndo={performUndo} onRedo={performRedo} onRotateLeft={() => rotate(-90)} onRotateRight={() => rotate(90)} onFlipHorizontal={() => flip('x')} onResetRotation={resetRotation} onReset={resetEdits} onZoomChange={handleZoom} onZoomPreset={commitZoomPreset} onFit={handleFit} onRotationChange={handleRotation} onRotationCommit={endInteraction} onRotationInteractionStart={beginRotationInteraction} />
              <div className="canvas-stage" ref={stageRef} style={{ '--croplab-adjust-filter': editor.adjustmentCssFilter } as CSSProperties}>
                {selectedAspect === null ? (
                  <FreeformCropper
                    image={loadedImage.src}
                    previewWidth={loadedImage.previewWidth}
                    previewHeight={loadedImage.previewHeight}
                    previewScaleX={loadedImage.previewScaleX}
                    previewScaleY={loadedImage.previewScaleY}
                    zoom={cropState.zoom}
                    transform={cropState.transform}
                    adjustments={adjustments}
                    cropRect={freeCropRect}
                    onCropRectChange={handleFreeformCropChange}
                    onInteractionStart={beginCropInteraction}
                    onInteractionEnd={endInteraction}
                  />
                ) : (
                  <Cropper
                    image={loadedImage.src}
                    crop={cropState.crop}
                    zoom={cropState.zoom}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                    zoomWithScroll
                    aspect={selectedAspect}
                    onCropChange={handleCropPositionChange}
                    onZoomChange={handleZoom}
                    rotation={cropState.transform.rotation}
                    onRotationChange={handleRotation}
                    onCropComplete={(_area, pixels) => handleCropAreaChange(scaleCropAreaToSource(pixels, loadedImage.previewScaleX, loadedImage.previewScaleY))}
                    onInteractionStart={beginCropInteraction}
                    onInteractionEnd={endInteraction}
                    keyboardStep={5}
                    showGrid
                    transform={cropperTransform}
                  />
                )}
              </div>
              <div className="canvas-footer"><span>Persistent transforms stay available above the canvas.</span><span>{loadedImage.format === 'gif' ? 'GIF edits use the first frame and export as a static image.' : 'Edits stay in this browser.'}</span></div>
            </section>
            <ImageThumbnailRail
              items={imageItems}
              activeId={activeImageId}
              disabled={isLoading}
              batchExportActive={batchExport.active}
              batchCompleted={batchExport.completed}
              batchTotal={batchExport.total}
              onSelect={(id) => void switchImage(id)}
              onRemove={removeCollectionImage}
              onAdd={(files) => { if (files.length > 0) void submitImageInput(files, 'picker'); }}
              onBatchExport={() => void handleBatchExport()}
              onCancelBatchExport={cancelBatchExport}
            />
          </div>
          <MobileEditorControls
            panel={mobilePanel}
            selectedAspect={selectedAspect}
            zoom={cropState.zoom}
            canUndo={canUndo}
            canRedo={canRedo}
            onPanelChange={setMobilePanel}
            onExport={() => setIsExportOpen(true)}
            onAspectChange={handleAspectChange}
            onCropReset={resetCrop}
            outputWidth={outputDimensions?.width ?? null}
            outputHeight={outputDimensions?.height ?? null}
            lockAspectRatio={lockAspectRatio}
            isLoading={isLoading}
            onWidthChange={(value) => handleDimension('width', value)}
            onHeightChange={(value) => handleDimension('height', value)}
            onLockToggle={handleLockToggle}
            onRotateLeft={() => rotate(-90)}
            onRotateRight={() => rotate(90)}
            onFlipHorizontal={() => flip('x')}
            onZoomPreset={commitZoomPreset}
            onFit={handleFit}
            onUndo={performUndo}
            onRedo={performRedo}
            onHistory={() => setIsHistoryOpen(true)}
            onClear={clearImage}
            onReset={resetEdits}
            adjustments={adjustments}
            onAdjustmentChange={handleAdjustmentChange}
            onAdjustmentCommit={handleAdjustmentCommit}
            onAdjustmentsReset={resetAdjustments}
          />
        </div>
  </>;
}
