import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { PALETTE_GRID, type LineDash } from '../../chart/drawings';
import { toLatinDigits } from '../../lib/format';

/** Small controls of the drawing editor and settings dialog. */

/** A panel next to an anchor, in a portal (it is not clipped by dialogs); closes on outside press or Escape. */
export function FloatingPanel({ anchor, onClose, children, className }: { anchor: RefObject<HTMLElement | null>; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const a = anchor.current?.getBoundingClientRect();
    const el = ref.current;
    if (!a || !el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = a.left;
    let top = a.bottom + 6;
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    if (top + h > window.innerHeight - 8) top = Math.max(8, a.top - h - 6);
    setPos({ left, top });
  }, [anchor]);
  useEffect(() => {
    const down = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('touchstart', down, true);
    window.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('touchstart', down, true);
      window.removeEventListener('keydown', key, true);
    };
  }, [anchor, onClose]);
  return createPortal(
    <div
      ref={ref}
      dir="rtl"
      className={clsx('anim-pop fixed z-[60] rounded-xl border border-line bg-surface p-2 shadow-pop', className)}
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

/** A colour swatch that opens TradingView's palette and a custom colour. */
export function ColorButton({ value, onChange, label, size = 'md' }: { value: string; onChange: (c: string) => void; label: string; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const norm = value.toLowerCase();
  return (
    <>
      <button
        ref={ref}
        type="button"
        title={label}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={clsx('grid shrink-0 place-items-center rounded-md border border-line bg-raised/70 hover:border-faint', size === 'sm' ? 'h-6 w-6' : 'h-8 w-8')}
      >
        <span className={clsx('block rounded', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} style={{ background: value }} />
      </button>
      {open && (
        <FloatingPanel anchor={ref} onClose={() => setOpen(false)}>
          <div className="grid grid-cols-10 gap-1" dir="ltr">
            {PALETTE_GRID.flat().map((c, i) => (
              <button
                key={`${c}-${i}`}
                type="button"
                aria-label={c}
                title={c}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={clsx('relative h-[18px] w-[18px] rounded-[4px] border', c.toLowerCase() === norm ? 'border-ink' : 'border-black/10')}
                style={{ background: c }}
              >
                {c.toLowerCase() === norm && <Check size={12} className="absolute inset-0 m-auto" color={isLight(c) ? '#000' : '#fff'} />}
              </button>
            ))}
          </div>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[12px] text-muted hover:bg-raised">
            <input type="color" className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent" value={toHex(value)} onChange={(e) => onChange(e.target.value)} />
            رنگ دلخواه
            <span className="ms-auto font-mono text-[11px] text-faint" dir="ltr">
              {toHex(value)}
            </span>
          </label>
        </FloatingPanel>
      )}
    </>
  );
}

function toHex(c: string) {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  return '#2962ff';
}
function isLight(c: string) {
  const h = toHex(c);
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

export function DashIcon({ dash, w = 22 }: { dash: LineDash; w?: number }) {
  return (
    <svg width={w} height={8} viewBox={`0 0 ${w} 8`} aria-hidden>
      <line
        x1={1}
        y1={4}
        x2={w - 1}
        y2={4}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={dash === 'dashed' ? '5 3' : dash === 'dotted' ? '0.1 4' : undefined}
      />
    </svg>
  );
}

export const DASHES: { value: LineDash; label: string }[] = [
  { value: 'solid', label: 'ممتد' },
  { value: 'dashed', label: 'خط‌چین' },
  { value: 'dotted', label: 'نقطه‌چین' },
];

/** line width 1–4 as four small buttons */
export function WidthPicker({ value, onChange }: { value: number; onChange: (w: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4].map((w) => (
        <button
          key={w}
          type="button"
          title={`ضخامت ${w}`}
          aria-label={`ضخامت ${w}`}
          aria-pressed={value === w}
          onClick={() => onChange(w)}
          className={clsx('grid h-7 w-7 place-items-center rounded-md', value === w ? 'bg-accent/15' : 'hover:bg-raised')}
        >
          <span className="block w-3.5 rounded-full bg-ink" style={{ height: w }} />
        </button>
      ))}
    </div>
  );
}

export function DashPicker({ value, onChange }: { value: LineDash; onChange: (d: LineDash) => void }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {DASHES.map((d) => (
        <button
          key={d.value}
          type="button"
          title={d.label}
          aria-label={d.label}
          aria-pressed={value === d.value}
          onClick={() => onChange(d.value)}
          className={clsx('grid h-7 w-8 place-items-center rounded-md text-ink', value === d.value ? 'bg-accent/15' : 'hover:bg-raised')}
        >
          <DashIcon dash={d.value} />
        </button>
      ))}
    </div>
  );
}

/** a number typed freely (Persian digits too); the value changes when it parses */
export function NumberField({
  value,
  onChange,
  label,
  className,
  step,
  min,
  max,
  autoFocus,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
  step?: number;
  min?: number;
  max?: number;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(Number.isFinite(value) ? String(value) : '');
  }, [value]);
  const parse = (s: string) => {
    const n = parseFloat(
      toLatinDigits(s)
        .replace(/[٫,]/g, '.')
        .replace(/[^\d.\-eE+]/g, ''),
    );
    if (!Number.isFinite(n)) return null;
    if (min !== undefined && n < min) return null;
    if (max !== undefined && n > max) return null;
    return n;
  };
  return (
    <input
      className={clsx('field num h-8 px-2 py-0 text-[13px]', className)}
      dir="ltr"
      inputMode="decimal"
      aria-label={label}
      title={label}
      value={text}
      autoFocus={autoFocus}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        const n = parse(text);
        setText(n === null ? String(value) : String(n));
      }}
      onChange={(e) => {
        setText(e.target.value);
        const n = parse(e.target.value);
        if (n !== null) onChange(n);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && step) {
          e.preventDefault();
          const n = (parse(text) ?? value) + (e.key === 'ArrowUp' ? step : -step);
          const r = Math.round(n * 1e8) / 1e8;
          setText(String(r));
          onChange(r);
        }
      }}
    />
  );
}

export function CheckRow({ checked, onChange, label, children }: { checked: boolean; onChange: (v: boolean) => void; label: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-[13px]">
        <input type="checkbox" className="h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--accent))]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="truncate">{label}</span>
      </label>
      {children}
    </div>
  );
}

/** segmented choice */
export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx('seg-item', value === o.value && 'seg-item-on')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
