'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Area } from 'react-easy-crop';
import {
  clampFreeformCropRect,
  freeformCropRectToArea,
  getFreeformGeometry,
  getInitialFreeformCropRect,
  getMinimumFreeformCropPreviewSize,
  resizeFreeformCropRect,
} from '@/lib/editor/freeform';
import type { FreeformCropRect, TransformState } from '@/types/editor';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

type Props = {
  image: string;
  previewWidth: number;
  previewHeight: number;
  previewScaleX: number;
  previewScaleY: number;
  zoom: number;
  transform: TransformState;
  cropRect: FreeformCropRect | null;
  onCropRectChange: (rect: FreeformCropRect, area: Area) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
};

const HANDLE_LABELS: Record<ResizeHandle, string> = {
  nw: 'top-left corner',
  n: 'top edge',
  ne: 'top-right corner',
  w: 'left edge',
  e: 'right edge',
  sw: 'bottom-left corner',
  s: 'bottom edge',
  se: 'bottom-right corner',
};

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  w: 'ew-resize',
  e: 'ew-resize',
  sw: 'nesw-resize',
  s: 'ns-resize',
  se: 'nwse-resize',
};

type ActiveInteraction =
  | { kind: 'move'; pointerX: number; pointerY: number; start: FreeformCropRect }
  | { kind: 'resize'; pointerX: number; pointerY: number; start: FreeformCropRect; handle: ResizeHandle }
  | null;

export function FreeformCropper({
  image,
  previewWidth,
  previewHeight,
  previewScaleX,
  previewScaleY,
  zoom,
  transform,
  cropRect,
  onCropRectChange,
  onInteractionStart,
  onInteractionEnd,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const activeInteractionRef = useRef<ActiveInteraction>(null);
  const lastEmissionKeyRef = useRef<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const geometry = useMemo(
    () => getFreeformGeometry(
      stageSize.width,
      stageSize.height,
      previewWidth,
      previewHeight,
      zoom,
      transform.rotation,
    ),
    [previewHeight, previewWidth, stageSize.height, stageSize.width, transform.rotation, zoom],
  );

  const minimumScreenSize = useMemo(
    () => getMinimumFreeformCropPreviewSize() * geometry.displayScale,
    [geometry.displayScale],
  );

  const emitRect = useCallback((nextRect: FreeformCropRect) => {
    const clamped = clampFreeformCropRect(nextRect, geometry.imageBounds, geometry.displayScale);
    const area = freeformCropRectToArea(clamped, geometry, previewScaleX, previewScaleY);
    lastEmissionKeyRef.current = [
      stageSize.width,
      stageSize.height,
      zoom,
      transform.rotation,
      clamped.x,
      clamped.y,
      clamped.width,
      clamped.height,
    ].join(':');
    onCropRectChange(clamped, area);
  }, [geometry, onCropRectChange, previewScaleX, previewScaleY, stageSize.height, stageSize.width, transform.rotation, zoom]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) return;

    const next = cropRect
      ? clampFreeformCropRect(cropRect, geometry.imageBounds, geometry.displayScale)
      : getInitialFreeformCropRect(geometry, previewScaleX, previewScaleY);
    const key = [
      stageSize.width,
      stageSize.height,
      zoom,
      transform.rotation,
      next.x,
      next.y,
      next.width,
      next.height,
    ].join(':');

    if (lastEmissionKeyRef.current !== key) {
      emitRect(next);
    }
  }, [cropRect, emitRect, geometry, previewScaleX, previewScaleY, stageSize.height, stageSize.width, transform.rotation, zoom]);

  const beginInteraction = useCallback((
    event: ReactPointerEvent<HTMLElement>,
    interaction: ActiveInteraction,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    stageRef.current?.setPointerCapture(event.pointerId);
    activeInteractionRef.current = interaction;
    onInteractionStart();
  }, [onInteractionStart]);

  const handlePointerDown = useCallback((
    event: ReactPointerEvent<HTMLElement>,
    handle: ResizeHandle,
  ) => {
    if (!cropRect) return;
    beginInteraction(event, {
      kind: 'resize',
      pointerX: event.clientX,
      pointerY: event.clientY,
      start: cropRect,
      handle,
    });
  }, [beginInteraction, cropRect]);

  const handleMovePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!cropRect) return;
    beginInteraction(event, {
      kind: 'move',
      pointerX: event.clientX,
      pointerY: event.clientY,
      start: cropRect,
    });
  }, [beginInteraction, cropRect]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const active = activeInteractionRef.current;
    if (!active || !cropRect) return;

    const dx = event.clientX - active.pointerX;
    const dy = event.clientY - active.pointerY;
    let next: FreeformCropRect;

    if (active.kind === 'move') {
      next = {
        ...active.start,
        x: active.start.x + dx,
        y: active.start.y + dy,
      };
    } else {
        next = resizeFreeformCropRect(
        active.start,
        active.handle,
        dx,
        dy,
        geometry.imageBounds,
        Math.min(minimumScreenSize, geometry.imageBounds.width),
        Math.min(minimumScreenSize, geometry.imageBounds.height),
      );
    }

    emitRect(next);
  }, [cropRect, emitRect, geometry.imageBounds, minimumScreenSize]);

  const finishInteraction = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!activeInteractionRef.current) return;
    activeInteractionRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }
    onInteractionEnd();
  }, [onInteractionEnd]);

  const imageStyle = useMemo(() => ({
    width: `${previewWidth * geometry.displayScale}px`,
    height: `${previewHeight * geometry.displayScale}px`,
    transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scaleX(${transform.flipX ? -1 : 1}) scaleY(${transform.flipY ? -1 : 1})`,
  }), [geometry.displayScale, previewHeight, previewWidth, transform.flipX, transform.flipY, transform.rotation]);

  return (
    <div
      ref={stageRef}
      className="freeform-cropper"
      onPointerMove={handlePointerMove}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
      aria-label="Freeform crop canvas"
    >
      <img
        className="freeform-cropper-image"
        src={image}
        alt=""
        draggable={false}
        style={imageStyle}
      />
      {cropRect && (
        <div
          className="freeform-crop-box"
          style={{
            left: cropRect.x,
            top: cropRect.y,
            width: cropRect.width,
            height: cropRect.height,
          }}
          onPointerDown={handleMovePointerDown}
          role="region"
          aria-label={`Crop area ${Math.round(cropRect.width / geometry.displayScale * previewScaleX)} by ${Math.round(cropRect.height / geometry.displayScale * previewScaleY)} pixels`}
        >
          <div className="freeform-crop-grid" aria-hidden="true">
            <span className="freeform-grid-line vertical one" />
            <span className="freeform-grid-line vertical two" />
            <span className="freeform-grid-line horizontal one" />
            <span className="freeform-grid-line horizontal two" />
          </div>
          {(Object.keys(HANDLE_CURSORS) as ResizeHandle[]).map((handle) => (
            <button
              key={handle}
              type="button"
              className={`freeform-crop-handle handle-${handle}`}
              data-freeform-handle={handle}
              aria-label={`Resize crop from ${HANDLE_LABELS[handle]}`}
              title={`Resize from ${HANDLE_LABELS[handle]}`}
              style={{ cursor: HANDLE_CURSORS[handle] }}
              onPointerDown={(event) => handlePointerDown(event, handle)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
