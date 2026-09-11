import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector<HTMLElement>('.confirmation-dialog');
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="app-modal-backdrop confirmation-backdrop" role="presentation">
      <section className="app-modal confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message">
        <div className="confirmation-icon" aria-hidden="true"><AlertTriangle size={20} /></div>
        <button type="button" className="app-modal-close confirmation-close" onClick={onCancel} aria-label="Cancel" title="Cancel">
          <X size={18} />
        </button>
        <h2 id="confirmation-title">{title}</h2>
        <p id="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <button type="button" className="confirmation-cancel" ref={cancelRef} onClick={onCancel}>No, cancel</button>
          <button type="button" className="confirmation-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
