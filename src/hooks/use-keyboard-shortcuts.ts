import { useEffect } from 'react';
import { getEditorShortcut } from '@/lib/editor/shortcuts';

type Options = {
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomPreset?: (value: number) => void;
  onRotate?: () => void;
  onOpen?: () => void;
  onExport?: () => void;
  onEscape?: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(element.tagName);
}

export function useKeyboardShortcuts({ onUndo, onRedo, onZoomIn, onZoomOut, onZoomReset, onZoomPreset, onRotate, onOpen, onExport, onEscape }: Options) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = getEditorShortcut(event, isEditableTarget(event.target));
      if (!shortcut) return;
      event.preventDefault();

      switch (shortcut) {
        case 'undo': onUndo(); break;
        case 'redo': onRedo(); break;
        case 'rotate': onRotate?.(); break;
        case 'fit': onZoomReset?.(); break;
        case 'zoom100': onZoomPreset?.(1); break;
        case 'zoom200': onZoomPreset?.(2); break;
        case 'zoomIn': onZoomIn?.(); break;
        case 'zoomOut': onZoomOut?.(); break;
        case 'open': onOpen?.(); break;
        case 'export': onExport?.(); break;
        case 'escape': onEscape?.(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onExport, onOpen, onRedo, onRotate, onUndo, onZoomIn, onZoomOut, onZoomPreset, onZoomReset]);
}
