'use client';

import { Archive, Images, LoaderCircle, Plus, X } from 'lucide-react';
import { useRef } from 'react';
import type { ImageCollectionItem } from '@/hooks/use-image-collection';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

type Props = {
  items: ImageCollectionItem[];
  activeId: string | null;
  disabled?: boolean;
  batchExportActive: boolean;
  batchCompleted: number;
  batchTotal: number;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (files: File[]) => void;
  onBatchExport: () => void;
  onCancelBatchExport: () => void;
};

export function ImageThumbnailRail({
  items,
  activeId,
  disabled = false,
  batchExportActive,
  batchCompleted,
  batchTotal,
  onSelect,
  onRemove,
  onAdd,
  onBatchExport,
  onCancelBatchExport,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="image-collection-rail" aria-label="Image collection" aria-describedby="image-collection-help">
      <p id="image-collection-help" className="sr-only">Select an image to edit it. Use the remove button to delete an image from the collection.</p>
      <div className="image-collection-header">
        <div>
          <span className="eyebrow">Images</span>
          <strong>{items.length}</strong>
        </div>
        <Images size={14} aria-hidden="true" />
      </div>

      <div className="image-thumbnail-list" role="list" aria-label={`${items.length} images`}>
        {items.map((item, index) => {
          const active = item.id === activeId;
          const currentSnapshot = item.history.entries[item.history.currentIndex]?.snapshot;
          const hasEdits = item.history.currentIndex > 0;

          return (
            <div
              key={item.id}
              className={`image-thumbnail${active ? ' active' : ''}`}
              role="listitem"
            >
              <button
                type="button"
                className="image-thumbnail-select"
                onClick={() => onSelect(item.id)}
                disabled={disabled || batchExportActive}
                aria-current={active ? 'true' : undefined}
                aria-label={`Image ${index + 1}: ${item.file.name}${hasEdits ? ', edited' : ''}`}
                title={item.file.name}
              >
                <span className="image-thumbnail-frame">
                  <img src={item.thumbnailUrl} alt="" draggable={false} />
                  {hasEdits && <span className="image-thumbnail-edited" aria-hidden="true" />}
                </span>
                <span className="image-thumbnail-index">{index + 1}</span>
                {currentSnapshot?.format && <span className="image-thumbnail-format">{currentSnapshot.format === 'jpeg' ? 'JPG' : currentSnapshot.format.toUpperCase()}</span>}
              </button>
              <button
                type="button"
                className="image-thumbnail-remove"
                onClick={(event) => { event.stopPropagation(); onRemove(item.id); }}
                disabled={disabled || batchExportActive}
                aria-label={`Remove image ${index + 1}`}
                title="Remove image"
              >
                <X size={11} strokeWidth={2.2} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="image-collection-actions">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(event) => {
            onAdd(Array.from(event.target.files ?? []));
            event.currentTarget.value = '';
          }}
        />
        <button type="button" className="image-collection-add" onClick={() => inputRef.current?.click()} disabled={disabled || batchExportActive}>
          <Plus size={14} />
          <span>Add images</span>
        </button>

        {items.length > 1 && (
          batchExportActive ? (
            <div className="image-batch-progress" aria-live="polite">
              <div className="image-batch-progress-copy">
                <span>Exporting</span>
                <strong>{batchCompleted}/{batchTotal}</strong>
              </div>
              <div className="image-batch-progress-track"><span style={{ width: `${batchTotal ? (batchCompleted / batchTotal) * 100 : 0}%` }} /></div>
              <button type="button" className="image-batch-cancel" onClick={onCancelBatchExport}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="image-collection-export" onClick={onBatchExport} disabled={disabled}>
              <Archive size={14} />
              <span>Export ZIP</span>
            </button>
          )
        )}
      </div>

      {batchExportActive && <LoaderCircle className="image-batch-spinner" size={12} aria-hidden="true" />}
    </aside>
  );
}
