import {
  FileInput,
  FlipHorizontal,
  FlipVertical,
  Redo2,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
} from 'lucide-react';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onReplace: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onReset: () => void;
};

export function EditorToolbar({
  canUndo,
  canRedo,
  onReplace,
  onClear,
  onUndo,
  onRedo,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
  onReset,
}: Props) {
  return (
    <div className="editor-toolbar" aria-label="Image editing toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onReplace} title="Replace image" aria-label="Replace image"><FileInput size={17} /></button>
        <button className="toolbar-btn" onClick={onClear} title="Clear image" aria-label="Clear image"><Trash2 size={17} /></button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={17} /></button>
        <button className="toolbar-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={17} /></button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onRotateLeft} title="Rotate left 90°" aria-label="Rotate left"><RotateCcw size={17} /></button>
        <button className="toolbar-btn" onClick={onRotateRight} title="Rotate right 90°" aria-label="Rotate right"><RotateCw size={17} /></button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onFlipHorizontal} title="Flip horizontal" aria-label="Flip horizontal"><FlipHorizontal size={17} /></button>
        <button className="toolbar-btn" onClick={onFlipVertical} title="Flip vertical" aria-label="Flip vertical"><FlipVertical size={17} /></button>
      </div>
      <div className="toolbar-spacer" />
      <button className="toolbar-btn toolbar-reset" onClick={onReset} title="Reset all edits" aria-label="Reset all edits"><RotateCcw size={17} /></button>
    </div>
  );
}
