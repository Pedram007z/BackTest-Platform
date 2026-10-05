import clsx from 'clsx';
import { Check, ChevronDown, EllipsisVertical, Info, Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useClickOutside, useRevealOnOpen } from '../../hooks/useClickOutside';

// ---------- Toggle ----------
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full border transition',
        checked ? 'border-gain bg-gain' : 'border-line bg-raised',
      )}
    >
      <span
        className={clsx(
          'absolute h-4 w-4 rounded-full bg-white shadow transition-all',
          // RTL: "off" knob sits on the right, "on" slides to the left
          checked ? 'right-[20px]' : 'right-[2px]',
        )}
      />
    </button>
  );
}

// ---------- InfoTip ----------
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-raised text-faint transition hover:text-ink"
      >
        <Info size={11} strokeWidth={2.5} />
      </span>
      <span className="pointer-events-none absolute left-0 top-6 z-20 w-56 rounded-lg border border-line bg-raised px-3 py-2 text-xs leading-6 text-ink opacity-0 shadow-pop transition group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

// ---------- Select ----------
export interface Option<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = 'انتخاب کنید',
  id,
  compact,
  footer,
}: {
  value: T | '';
  options: Option<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  id?: string;
  compact?: boolean;
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const refs = useMemo(() => [ref], []);
  useClickOutside(refs, close, open);
  const panel = useRef<HTMLDivElement>(null);
  useRevealOnOpen(panel, open);
  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx('field flex items-center justify-between gap-2 text-start', compact && 'py-1.5')}
      >
        <span className={clsx('truncate', !current && 'text-faint')}>{current?.label ?? placeholder}</span>
        <ChevronDown size={16} className={clsx('shrink-0 text-muted transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div ref={panel} className="anim-pop absolute inset-x-0 top-full z-30 mt-1.5 min-w-[10rem] overflow-hidden rounded-lg border border-line bg-raised shadow-pop">
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={clsx(
                    'flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-surface',
                    o.value === value && 'text-accent',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-xs text-faint">{o.hint}</span>}
                  </span>
                  {o.value === value && <Check size={15} />}
                </button>
              </li>
            ))}
          </ul>
          {footer && <div className="border-t border-line p-1">{footer}</div>}
        </div>
      )}
    </div>
  );
}

// ---------- MultiSelect (chips) ----------
export interface GroupedOption extends Option {
  group: string;
}

export function MultiSelect({
  values,
  options,
  onChange,
  placeholder = 'انتخاب کنید',
  id,
}: {
  values: string[];
  options: GroupedOption[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const refs = useMemo(() => [ref], []);
  useClickOutside(refs, close, open);
  const panel = useRef<HTMLDivElement>(null);
  useRevealOnOpen(panel, open);

  const filtered = options.filter(
    (o) => !q || o.label.toLowerCase().includes(q.toLowerCase()) || (o.hint ?? '').includes(q),
  );
  const groups = [...new Set(filtered.map((o) => o.group))];
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <div ref={ref} className="relative">
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="field flex min-h-[44px] cursor-pointer flex-wrap items-center gap-1.5 py-1.5"
      >
        {values.length === 0 && <span className="text-faint">{placeholder}</span>}
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-xs font-semibold" dir="ltr">
            {options.find((o) => o.value === v)?.label ?? v}
            <button
              type="button"
              aria-label={`حذف ${v}`}
              className="text-faint hover:text-loss"
              onClick={(e) => {
                e.stopPropagation();
                toggle(v);
              }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <ChevronDown size={16} className={clsx('ms-auto shrink-0 text-muted transition', open && 'rotate-180')} />
      </div>
      {open && (
        <div ref={panel} className="anim-pop absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-raised shadow-pop">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search size={15} className="text-faint" />
            <input
              id={id ? `${id}-search` : undefined}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی نماد…"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-faint"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {groups.length === 0 && <p className="px-3 py-3 text-sm text-faint">نمادی پیدا نشد.</p>}
            {groups.map((g) => (
              <div key={g}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold tracking-wide text-faint">{g}</p>
                {filtered
                  .filter((o) => o.group === g)
                  .map((o) => {
                    const on = values.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggle(o.value)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-surface"
                      >
                        <span
                          className={clsx(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            on ? 'border-accent bg-accent text-white' : 'border-faint',
                          )}
                        >
                          {on && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="font-semibold" dir="ltr">
                          {o.label}
                        </span>
                        <span className="ms-auto text-xs text-faint">{o.hint}</span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Kebab menu ----------
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export function KebabMenu({ items, label = 'گزینه‌ها' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const refs = useMemo(() => [ref], []);
  useClickOutside(refs, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="icon-btn h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <EllipsisVertical size={17} />
      </button>
      {open && (
        <div className="anim-pop absolute left-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-raised py-1 shadow-pop">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onClick();
              }}
              className={clsx(
                'flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm hover:bg-surface',
                it.danger ? 'text-loss' : 'text-ink',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Progress bar ----------
export function Meter({ value, tone = 'gain', className }: { value: number; tone?: 'gain' | 'accent' | 'amber' | 'loss'; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={clsx('h-1.5 overflow-hidden rounded-full bg-raised', className)}>
      <div
        className={clsx(
          'h-full rounded-full transition-[width] duration-500',
          tone === 'gain' && 'bg-gain',
          tone === 'accent' && 'bg-accent',
          tone === 'amber' && 'bg-amber',
          tone === 'loss' && 'bg-loss',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------- Empty state ----------
export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-raised text-muted">{icon}</div>
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-sm leading-7 text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Slider (round handle) ----------
export function Slider({
  id,
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  className,
}: {
  id?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      dir="ltr"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      className={clsx('slider w-full', className)}
      style={{ ['--fill' as string]: `${fill}%` }}
    />
  );
}
