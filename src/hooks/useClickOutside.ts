import { useEffect, type RefObject } from 'react';

export function useClickOutside(refs: RefObject<HTMLElement | null>[], onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onOutside();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [refs, onOutside, active]);
}

/** Keep a just-opened popover visible inside scrolling containers such as modal bodies. */
export function useRevealOnOpen(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    return () => cancelAnimationFrame(id);
  }, [ref, open]);
}
