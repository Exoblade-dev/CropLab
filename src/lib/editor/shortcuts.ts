export type EditorShortcut = 'undo' | 'redo' | 'rotate' | 'fit' | 'zoom100' | 'zoom200' | 'zoomIn' | 'zoomOut' | 'open' | 'export' | 'escape';

export function getEditorShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>, editable: boolean): EditorShortcut | null {
  if (editable) return null;
  const command = event.ctrlKey || event.metaKey;

  if (event.key === 'Escape') return 'escape';
  if (command && event.key.toLowerCase() === 'z') return event.shiftKey ? 'redo' : 'undo';
  if (command && event.key.toLowerCase() === 'o') return 'open';
  if (command && event.key.toLowerCase() === 's') return 'export';
  if (command || event.altKey) return null;
  if (event.key.toLowerCase() === 'r') return 'rotate';
  if (event.key === '+' || event.key === '=') return 'zoomIn';
  if (event.key === '-') return 'zoomOut';
  if (event.key === '0') return 'fit';
  if (event.key === '1') return 'zoom100';
  if (event.key === '2') return 'zoom200';
  return null;
}
