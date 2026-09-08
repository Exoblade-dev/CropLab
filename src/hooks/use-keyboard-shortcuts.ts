import { useEffect } from 'react';

type Options = {
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomPreset?: (value: number) => void;
};

export function useKeyboardShortcuts({ onUndo, onRedo, onZoomIn, onZoomOut, onZoomReset, onZoomPreset }: Options) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable;
      if (isTyping) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) onRedo(); else onUndo();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.key === '+' || event.key === '=') && onZoomIn) { event.preventDefault(); onZoomIn(); return; }
      if (event.key === '-' && onZoomOut) { event.preventDefault(); onZoomOut(); return; }
      if (event.key === '0' && onZoomReset) { event.preventDefault(); onZoomReset(); return; }
      if (event.key === '1' && onZoomPreset) { event.preventDefault(); onZoomPreset(1); return; }
      if (event.key === '2' && onZoomPreset) { event.preventDefault(); onZoomPreset(2); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRedo, onUndo, onZoomIn, onZoomOut, onZoomPreset, onZoomReset]);
}
