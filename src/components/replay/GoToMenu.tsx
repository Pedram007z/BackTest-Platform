import clsx from 'clsx';
import { Check, Clock3, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { fmtDayLong, msToKey } from '../../lib/calendar';
import { faDigits } from '../../lib/format';
import { SYMBOL_MAP, dayIndexOf, isTradingDay } from '../../lib/market';
import { BUILTIN_GOTO, TZ_OPTIONS, fmtTehran, nextOccurrence, tzLabel } from '../../lib/timezone';
import type { GoToPreset } from '../../lib/types';
import { useStore } from '../../store/useStore';
import { Popover } from '../ui/Popover';

interface Props {
  cursor: number;
  endMs: number;
  symbols: string[];
  disabled: boolean;
  onJump: (target: number, label: string) => void;
}

const HOUR = 3_600_000;

function Editor({ initial, onSave, onCancel }: { initial: Partial<GoToPreset>; onSave: (p: Omit<GoToPreset, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.name ?? '');
  const [time, setTime] = useState(initial.time ?? '16:30');
  const [tz, setTz] = useState(initial.tz ?? 'Asia/Tehran');
  const ok = name.trim().length > 0 && /^\d{2}:\d{2}$/.test(time);
  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-line bg-raised/50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSave({ name: name.trim(), time, tz, favorite: initial.favorite, builtin: initial.builtin });
      }}
    >
      <label className="text-[12px] font-medium" htmlFor="goto-name">
        نام مقصد
      </label>
      <input id="goto-name" className="field py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: شروع سشن نیویورک" autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[12px] font-medium" htmlFor="goto-time">
            ساعت
          </label>
          <input id="goto-time" type="time" className="field num py-2" dir="ltr" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium" htmlFor="goto-tz">
            منطقه‌ی زمانی
          </label>
          <select id="goto-tz" className="field py-2" value={tz} onChange={(e) => setTz(e.target.value)}>
            {TZ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" className="btn-ghost py-1.5" onClick={onCancel}>
          انصراف
        </button>
        <button type="submit" className="btn-primary py-1.5" disabled={!ok}>
          <Check size={15} /> ذخیره
        </button>
      </div>
    </form>
  );
}

export function GoToMenu({ cursor, endMs, symbols, disabled, onJump }: Props) {
  const stored = useStore((s) => s.goToPresets);
  const add = useStore((s) => s.addGoToPreset);
  const update = useStore((s) => s.updateGoToPreset);
  const remove = useStore((s) => s.deleteGoToPreset);
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const builtinIds = new Set(BUILTIN_GOTO.map((b) => b.id));
  const presets: GoToPreset[] = [...BUILTIN_GOTO.map((b) => ({ ...b, ...stored.find((s) => s.id === b.id) })), ...stored.filter((s) => !builtinIds.has(s.id))].sort(
    (a, b) => Number(!!b.favorite) - Number(!!a.favorite),
  );

  const syms = symbols.map((s) => SYMBOL_MAP[s]).filter(Boolean);
  const accept = (ms: number) => syms.some((s) => isTradingDay(s, dayIndexOf(ms)));

  const go = (target: number, label: string, close: () => void) => {
    if (target > endMs) return;
    onJump(target, label);
    close();
  };

  return (
    <Popover
      align="end"
      panelClass="w-[min(92vw,380px)] p-3"
      onOpenChange={(v) => !v && setEditing(null)}
      button={({ open, toggle }) => (
        <button type="button" onClick={toggle} disabled={disabled} aria-expanded={open} className={clsx('btn-soft py-1.5', open && 'border-accent/60')}>
          <Clock3 size={15} /> برو به
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">برو به زمان بعدی</p>
            <p className="num text-[11px] text-faint">الان: {fmtTehran(cursor)} تهران</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { l: '۱ ساعت', ms: HOUR },
              { l: '۴ ساعت', ms: 4 * HOUR },
              { l: '۱ روز', ms: 24 * HOUR },
              { l: '۱ هفته', ms: 7 * 24 * HOUR },
            ].map((q) => (
              <button key={q.l} type="button" className="chip hover:text-ink" onClick={() => go(Math.min(endMs, cursor + q.ms), `${q.l} بعد`, close)}>
                +{q.l}
              </button>
            ))}
          </div>
          <ul className="-mx-1 flex max-h-[min(50vh,360px)] flex-col overflow-y-auto">
            {presets.map((p) => {
              const next = nextOccurrence(cursor, p.time, p.tz, accept);
              const beyond = next <= cursor || next > endMs;
              if (editing === p.id)
                return (
                  <li key={p.id} className="px-1 py-1">
                    <Editor
                      initial={p}
                      onCancel={() => setEditing(null)}
                      onSave={(v) => {
                        update(p.id, { ...v, id: p.id });
                        setEditing(null);
                      }}
                    />
                  </li>
                );
              return (
                <li key={p.id} className="group flex items-center gap-1 rounded-xl px-1 hover:bg-raised/70">
                  <button
                    type="button"
                    onClick={() => update(p.id, { ...p, favorite: !p.favorite })}
                    className="p-1.5"
                    aria-label={p.favorite ? 'حذف از ستاره‌دارها' : 'ستاره‌دار کردن'}
                    aria-pressed={!!p.favorite}
                  >
                    <Star size={15} className={p.favorite ? 'fill-amber text-amber' : 'text-faint'} />
                  </button>
                  <button type="button" disabled={beyond} onClick={() => go(next, p.name, close)} className="min-w-0 flex-1 py-2 text-start disabled:opacity-50">
                    <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                    <span className="num block text-[11px] text-faint">
                      {faDigits(p.time)} {tzLabel(p.tz)}
                      {!beyond && (
                        <span className="text-muted">
                          {' '}
                          ← {fmtDayLong(msToKey(next))}، {fmtTehran(next)} تهران
                        </span>
                      )}
                      {beyond && <span> · بیرون از بازه‌ی جلسه</span>}
                    </span>
                  </button>
                  <button type="button" className="icon-btn h-8 w-8 opacity-60 group-hover:opacity-100" onClick={() => setEditing(p.id)} aria-label={`ویرایش ${p.name}`}>
                    <Pencil size={14} />
                  </button>
                  {!p.builtin && (
                    <button type="button" className="icon-btn h-8 w-8 opacity-60 hover:text-loss group-hover:opacity-100" onClick={() => remove(p.id)} aria-label={`حذف ${p.name}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {editing === 'new' ? (
            <Editor
              initial={{}}
              onCancel={() => setEditing(null)}
              onSave={(v) => {
                add({ ...v, favorite: true });
                setEditing(null);
              }}
            />
          ) : (
            <button type="button" className="btn-ghost justify-start text-accent-ink" onClick={() => setEditing('new')}>
              <Plus size={15} /> مقصد سفارشی (نام و ساعت دلخواه)
            </button>
          )}
          <p className="flex items-start gap-1.5 text-[11px] leading-5 text-faint">
            <X size={12} className="mt-1 shrink-0 rotate-45" />
            ساعت هر مقصد در منطقه‌ی زمانی خودش حساب می‌شود؛ تغییر ساعت تابستانی لندن و نیویورک خودکار اعمال می‌شود.
          </p>
        </div>
      )}
    </Popover>
  );
}
