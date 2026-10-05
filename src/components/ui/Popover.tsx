import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

/** Button with a panel under it that closes on outside click or Escape. */
export function Popover({
  button,
  children,
  align = 'start',
  panelClass,
  open: controlled,
  onOpenChange,
}: {
  button: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'start' | 'end';
  panelClass?: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const setOpen = useCallback(
    (v: boolean) => {
      if (controlled === undefined) setOwn(v);
      onOpenChange?.(v);
    },
    [controlled, onOpenChange],
  );
  const ref = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => [ref], []);
  const close = useCallback(() => setOpen(false), [setOpen]);
  useClickOutside(refs, close, open);

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      {button({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div className={clsx('anim-pop absolute top-full z-40 mt-2 rounded-2xl border border-line bg-surface shadow-pop', align === 'start' ? 'right-0' : 'left-0', panelClass)}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
}
