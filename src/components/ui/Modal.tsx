import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Open dialogs, newest last: Escape closes only the one on top (a confirm box over an editor, say). */
const escapeStack: (() => void)[] = [];

/** Close the dialog with Escape while it is open and on top of any others. */
export function useEscapeClose(onClose: () => void, open = true) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const entry = () => close.current();
    escapeStack.push(entry);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeStack[escapeStack.length - 1] === entry) entry();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      escapeStack.splice(escapeStack.indexOf(entry), 1);
    };
  }, [open]);
}

export function Modal({ open, onClose, title, children, footer, headerExtra, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeClose(onClose, open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus the first field
    const t = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input, textarea, button[data-autofocus]')?.focus();
    }, 30);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" dir="rtl">
      <div className="anim-fade absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={clsx(
          'anim-pop relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
          size === 'xl' && 'sm:max-w-5xl',
        )}
      >
        <div className="flex items-center gap-3 border-b border-line/70 px-5 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <div className="ms-auto flex items-center gap-2">
            {headerExtra}
            <button type="button" className="icon-btn h-8 w-8" onClick={onClose} aria-label="بستن">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line/70 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            data-autofocus
            className="btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-7 text-muted">{message}</p>
    </Modal>
  );
}
