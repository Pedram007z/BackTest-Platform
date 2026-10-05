import clsx from 'clsx';
import { Camera, Check, ImagePlus, LoaderCircle, Star, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fmtMarketTime } from '../../lib/calendar';
import { faDigits, fmtNum, fmtR, fmtUsd } from '../../lib/format';
import { SYMBOL_MAP, fmtPx } from '../../lib/market';
import { deleteShot, readFile, saveShot, useShot } from '../../lib/shots';
import { orderTitle } from '../../lib/trading';
import type { JournalEntry, OrderType, Side } from '../../lib/types';
import { toast, useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Select, Slider } from '../ui/controls';

export interface JournalContext {
  symbol: string;
  side: Side;
  type: OrderType;
  entry: number;
  sl: number;
  tp: number;
  rr: number;
  lots?: number;
  /** market time (UTC ms) */
  time: number;
  sessionName?: string;
  /** closed trades show their result */
  pnl?: number;
  r?: number;
  status?: string;
}

const MAX_SHOTS = 6;
const TAG_SUGGESTIONS = ['ورود مارکت', 'پولبک', 'شکست', 'خلاف روند', 'سشن لندن', 'سشن نیویورک', 'قبل از خبر', 'FOMO', 'طبق پلن'];
const NONE = '__none__';

export const emptyJournal = (checklistId?: string): JournalEntry => ({
  screenshots: [],
  checklistId,
  checked: [],
  confidence: 50,
  rating: 0,
  notes: '',
  tags: [],
  updatedAt: Date.now(),
});

function Thumb({ id, onRemove, onOpen }: { id: string; onRemove: () => void; onOpen: (src: string) => void }) {
  const src = useShot(id);
  return (
    <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-raised">
      {src ? (
        <button type="button" className="h-full w-full" onClick={() => onOpen(src)} aria-label="نمایش اسکرین‌شات">
          <img src={src} alt="اسکرین‌شات چارت" className="h-full w-full object-cover" />
        </button>
      ) : (
        <div className="flex h-full items-center justify-center text-faint">
          <LoaderCircle size={18} className="animate-spin" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
        aria-label="حذف اسکرین‌شات"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function StarRating({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1" dir="ltr" role={onChange ? 'radiogroup' : undefined} aria-label="امتیاز معامله">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        const star = <Star size={size} className={clsx('transition', on ? 'fill-amber text-amber' : 'text-faint')} strokeWidth={1.6} />;
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${faDigits(n)} ستاره`}
            onClick={() => onChange(n === value ? 0 : n)}
            className="rounded-md p-0.5 hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

const confidenceWord = (v: number) => (v < 34 ? 'کم' : v < 67 ? 'متوسط' : 'زیاد');

interface Props {
  open: boolean;
  onClose: () => void;
  ctx: JournalContext | null;
  initial?: JournalEntry;
  defaultChecklistId?: string;
  onSave: (entry: JournalEntry) => void;
  onDelete?: () => void;
  /** Capture the chart (chart page only). */
  onCapture?: () => Promise<string | null>;
}

export function JournalModal({ open, onClose, ctx, initial, defaultChecklistId, onSave, onDelete, onCapture }: Props) {
  const checklists = useStore((s) => s.checklists);
  const [entry, setEntry] = useState<JournalEntry>(() => initial ?? emptyJournal(defaultChecklistId));
  const [capturing, setCapturing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** screenshots added in this window, removed again if it is cancelled */
  const added = useRef<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setEntry(initial ? { ...initial } : emptyJournal(defaultChecklistId));
    setTagInput('');
    setConfirmDelete(false);
    added.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<JournalEntry>) => setEntry((e) => ({ ...e, ...patch }));
  const checklist = checklists.find((c) => c.id === entry.checklistId);
  const missing = checklist?.items.filter((i) => i.required && !entry.checked.includes(i.id)) ?? [];

  const addShot = async (dataUrl: string | null) => {
    if (!dataUrl) {
      toast('گرفتن اسکرین‌شات انجام نشد', 'error');
      return;
    }
    const id = await saveShot(dataUrl);
    added.current.push(id);
    setEntry((e) => ({ ...e, screenshots: [...e.screenshots, id].slice(0, MAX_SHOTS) }));
  };

  const capture = async () => {
    if (!onCapture || capturing) return;
    setCapturing(true);
    try {
      await addShot(await onCapture());
      toast('اسکرین‌شات چارت ذخیره شد');
    } finally {
      setCapturing(false);
    }
  };

  const cancel = () => {
    for (const id of added.current) void deleteShot(id);
    added.current = [];
    onClose();
  };

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t || entry.tags.includes(t)) return;
    set({ tags: [...entry.tags, t].slice(0, 8) });
    setTagInput('');
  };

  if (!ctx) return null;
  const sym = SYMBOL_MAP[ctx.symbol];
  const details: [string, string, string?][] = [
    ['قیمت ورود', fmtPx(ctx.symbol, ctx.entry)],
    ['حد ضرر', fmtPx(ctx.symbol, ctx.sl), 'text-loss'],
    ['حد سود', ctx.tp > 0 ? fmtPx(ctx.symbol, ctx.tp) : '—', 'text-gain'],
    ['ریسک به ریوارد', ctx.rr > 0 ? `1 : ${ctx.rr.toFixed(2)}` : '—'],
  ];
  if (ctx.lots !== undefined) details.push(['حجم', `${ctx.lots} لات`]);
  if (ctx.pnl !== undefined) details.push(['نتیجه', `${fmtUsd(ctx.pnl, 2, true)}  (${fmtR(ctx.r ?? 0)})`, ctx.pnl >= 0 ? 'text-gain' : 'text-loss']);

  return (
    <>
      <Modal
        open={open}
        onClose={cancel}
        size="xl"
        title={
          <span className="flex flex-wrap items-center gap-2">
            ژورنال معامله
            <span className={clsx('chip', ctx.side === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}>{orderTitle(ctx.side, ctx.type)}</span>
            <span className="chip" dir="ltr">
              {sym?.ticker ?? ctx.symbol}
            </span>
          </span>
        }
        footer={
          <>
            {onDelete && (
              <div className="me-auto">
                {confirmDelete ? (
                  <span className="flex items-center gap-2 text-xs text-muted">
                    ژورنال این معامله حذف شود؟
                    <button
                      type="button"
                      className="btn-danger py-1.5"
                      onClick={() => {
                        for (const id of entry.screenshots) void deleteShot(id);
                        onDelete();
                      }}
                    >
                      حذف
                    </button>
                    <button type="button" className="btn-ghost py-1.5" onClick={() => setConfirmDelete(false)}>
                      نه
                    </button>
                  </span>
                ) : (
                  <button type="button" className="btn-ghost text-loss hover:bg-loss/10 hover:text-loss" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={15} /> حذف ژورنال
                  </button>
                )}
              </div>
            )}
            <button type="button" className="btn-ghost" onClick={cancel}>
              انصراف
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onSave({ ...entry, notes: entry.notes.trim(), updatedAt: Date.now() });
                added.current = [];
              }}
            >
              <Check size={16} /> ذخیره ژورنال
            </button>
          </>
        }
      >
        <p className="num -mt-2 mb-4 text-xs text-faint">
          {fmtMarketTime(ctx.time)} (زمان بازار، UTC){ctx.sessionName ? ` · ${ctx.sessionName}` : ''}
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* screenshots + details */}
          <div className="flex min-w-0 flex-col gap-4">
            <section>
              <h3 className="label">اسکرین‌شات‌ها</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {entry.screenshots.map((id) => (
                  <Thumb
                    key={id}
                    id={id}
                    onOpen={setPreview}
                    onRemove={() => {
                      void deleteShot(id);
                      set({ screenshots: entry.screenshots.filter((x) => x !== id) });
                    }}
                  />
                ))}
                {entry.screenshots.length < MAX_SHOTS && (
                  <div className="flex aspect-[16/10] flex-col items-stretch gap-1.5 rounded-xl border border-dashed border-line p-1.5">
                    {onCapture && (
                      <button type="button" onClick={capture} disabled={capturing} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg bg-accent/10 text-[12px] font-semibold text-accent-ink transition hover:bg-accent/15">
                        {capturing ? <LoaderCircle size={18} className="animate-spin" /> : <Camera size={18} />}
                        ذخیره اسکرین‌شات چارت
                      </button>
                    )}
                    <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[12px] font-medium text-muted transition hover:bg-raised hover:text-ink">
                      <ImagePlus size={17} />
                      افزودن تصویر
                    </button>
                    <input
                      ref={fileRef}
                      id="journal-file"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) await addShot(await readFile(f));
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="num mt-1.5 text-[11px] text-faint">
                {faDigits(entry.screenshots.length)} از {faDigits(MAX_SHOTS)}
              </p>
            </section>

            <section className="panel p-4">
              <h3 className="mb-2 text-[13px] font-bold">جزئیات معامله</h3>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px]">
                {details.map(([k, v, tone]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className={clsx('num text-end font-semibold', tone)} dir="ltr">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* checklist, rating, notes */}
          <div className="flex min-w-0 flex-col gap-4">
            <section>
              <label className="label" htmlFor="journal-checklist">
                چک‌لیست
              </label>
              <Select
                id="journal-checklist"
                value={entry.checklistId ?? NONE}
                onChange={(v) => set({ checklistId: v === NONE ? undefined : v, checked: [] })}
                options={[{ value: NONE, label: 'بدون چک‌لیست' }, ...checklists.map((c) => ({ value: c.id, label: c.name, hint: `${fmtNum(c.items.length)} آیتم` }))]}
              />
              {checklist && (
                <ul className="mt-2 flex flex-col gap-1 rounded-xl border border-line/70 p-1.5">
                  {checklist.items.map((it) => {
                    const on = entry.checked.includes(it.id);
                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => set({ checked: on ? entry.checked.filter((x) => x !== it.id) : [...entry.checked, it.id] })}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start text-[13px] hover:bg-raised/70"
                        >
                          <span className={clsx('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border', on ? 'border-gain bg-gain text-white' : 'border-faint')}>
                            {on && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">{it.text}</span>
                          {it.required && <span className={clsx('text-[11px] font-bold', on ? 'text-gain' : 'text-amber')}>الزامی</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {missing.length > 0 && <p className="mt-1.5 text-xs text-amber">{fmtNum(missing.length)} آیتم الزامی هنوز تیک نخورده است.</p>}
            </section>

            <section>
              <label className="label" htmlFor="journal-tags">
                برچسب‌ها
              </label>
              <div className="field flex min-h-[44px] flex-wrap items-center gap-1.5 py-1.5">
                {entry.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-ink">
                    {t}
                    <button type="button" aria-label={`حذف برچسب ${t}`} onClick={() => set({ tags: entry.tags.filter((x) => x !== t) })}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  id="journal-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder={entry.tags.length ? '' : 'برچسب بنویسید و Enter بزنید'}
                  className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-faint"
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {TAG_SUGGESTIONS.filter((t) => !entry.tags.includes(t))
                  .slice(0, 6)
                  .map((t) => (
                    <button key={t} type="button" className="chip hover:text-ink" onClick={() => addTag(t)}>
                      + {t}
                    </button>
                  ))}
              </div>
            </section>

            <section>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0" htmlFor="journal-confidence">
                  میزان اطمینان
                </label>
                <span className="num text-xs font-semibold text-accent-ink">
                  {faDigits(entry.confidence)}٪ · {confidenceWord(entry.confidence)}
                </span>
              </div>
              <Slider id="journal-confidence" label="میزان اطمینان" min={0} max={100} step={5} value={entry.confidence} onChange={(confidence) => set({ confidence })} />
            </section>

            <section>
              <span className="label">امتیاز معامله</span>
              <StarRating value={entry.rating} onChange={(rating) => set({ rating })} />
            </section>

            <section>
              <label className="label" htmlFor="journal-notes">
                یادداشت‌ها
              </label>
              <textarea
                id="journal-notes"
                className="field min-h-[120px] leading-7"
                value={entry.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="دلیل ورود، احساسات، اشتباهات، درس‌ها…"
              />
            </section>
          </div>
        </div>
      </Modal>

      {preview && (
        <Modal open onClose={() => setPreview(null)} size="xl" title="اسکرین‌شات">
          <img src={preview} alt="اسکرین‌شات چارت" className="w-full rounded-xl" />
        </Modal>
      )}
    </>
  );
}
