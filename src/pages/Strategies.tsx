import clsx from 'clsx';
import { Layers, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EquityArea } from '../components/charts/Charts';
import { SessionModal } from '../components/sessions/SessionModal';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { KebabMenu } from '../components/ui/controls';
import { fmtNum, fmtPct, fmtUsdShort } from '../lib/format';
import { equitySeries, summarize } from '../lib/stats';
import type { Strategy, Trade } from '../lib/types';
import { toast, useStore } from '../store/useStore';

function StrategyModal({ open, onClose, strategy }: { open: boolean; onClose: () => void; strategy?: Strategy }) {
  const addStrategy = useStore((s) => s.addStrategy);
  const updateStrategy = useStore((s) => s.updateStrategy);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(strategy?.name ?? '');
    setDescription(strategy?.description ?? '');
    setTouched(false);
  }, [open, strategy]);

  const save = () => {
    setTouched(true);
    if (!name.trim()) return;
    if (strategy) {
      updateStrategy(strategy.id, { name: name.trim(), description: description.trim() });
      toast('استراتژی به‌روزرسانی شد');
    } else {
      addStrategy({ name: name.trim(), description: description.trim() });
      toast(`استراتژی «${name.trim()}» ساخته شد`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={strategy ? 'ویرایش استراتژی' : 'ساخت استراتژی جدید'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            {strategy ? 'ذخیره' : 'ذخیره استراتژی'}
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div>
          <label className="label" htmlFor="strategy-name">
            نام استراتژی
          </label>
          <input id="strategy-name" className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: شکست رنج آسیا" />
          {touched && !name.trim() && <p className="mt-1.5 text-xs text-loss">نام استراتژی را بنویسید.</p>}
        </div>
        <div>
          <label className="label" htmlFor="strategy-desc">
            توضیحات
          </label>
          <textarea
            id="strategy-desc"
            className="field min-h-[120px] resize-y leading-7"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="شرایط ورود، حد ضرر، حد سود و مدیریت معامله را بنویسید."
          />
          <p className="num mt-1 text-end text-[11px] text-faint">{fmtNum(description.length)} / ۵۰۰</p>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className={clsx('num mt-0.5 truncate text-base font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{value}</dd>
    </div>
  );
}

function StrategyCard({ strategy, trades, onEdit, onDelete, onStart }: { strategy: Strategy; trades: Trade[]; onEdit: () => void; onDelete: () => void; onStart: () => void }) {
  const s = summarize(trades);
  const equity = equitySeries(trades, 0);
  const sessionsCount = new Set(trades.map((t) => t.sessionId)).size;

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Layers size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold">{strategy.name}</h3>
          <p className="num text-[11px] text-faint">
            {sessionsCount ? `در ${fmtNum(sessionsCount)} جلسه استفاده شده` : 'هنوز در جلسه‌ای استفاده نشده'}
          </p>
        </div>
        <KebabMenu
          items={[
            { label: 'شروع جلسه با این استراتژی', icon: <Play size={15} />, onClick: onStart },
            { label: 'ویرایش', icon: <Pencil size={15} />, onClick: onEdit },
            { label: 'حذف', icon: <Trash2 size={15} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>
      {strategy.description && <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-muted">{strategy.description}</p>}

      <dl className="mt-4 grid grid-cols-4 gap-3 border-t border-line/60 pt-4">
        <Stat label="کل معاملات" value={fmtNum(s.total)} />
        <Stat label="وین‌ریت" value={s.total ? fmtPct(s.winRate, 1) : '—'} />
        <Stat label="RR میانگین" value={trades.length ? fmtNum(s.avgRR, 2) : '—'} />
        <Stat label="سود خالص" value={s.total ? fmtUsdShort(s.netPnl, true) : '—'} tone={s.total ? (s.netPnl >= 0 ? 'gain' : 'loss') : undefined} />
      </dl>

      <div className="mt-4">
        <p className="mb-1 text-xs font-semibold text-muted">تغییرات اکوئیتی (دلار)</p>
        {s.total > 0 ? (
          <EquityArea data={equity} baseline={0} height={130} />
        ) : (
          <div className="flex h-[130px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line text-center text-xs text-muted">
            <span className="px-4">با انتخاب این استراتژی در یک جلسه، آمار و نمودار اینجا نمایش داده می‌شود.</span>
            <button type="button" className="btn-soft py-1.5" onClick={onStart}>
              <Play size={14} /> شروع جلسه
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Strategies() {
  const strategies = useStore((s) => s.strategies);
  const trades = useStore((s) => s.trades);
  const deleteStrategy = useStore((s) => s.deleteStrategy);
  const [modal, setModal] = useState<{ open: boolean; strategy?: Strategy }>({ open: false });
  const [toDelete, setToDelete] = useState<Strategy | null>(null);
  const [startWith, setStartWith] = useState<string | null>(null);

  const byStrategy = useMemo(() => {
    const m = new Map<string, Trade[]>();
    for (const t of trades) if (t.strategyId) (m.get(t.strategyId) ?? m.set(t.strategyId, []).get(t.strategyId)!).push(t);
    return m;
  }, [trades]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">استراتژی‌ها</h1>

      <button
        type="button"
        onClick={() => setModal({ open: true })}
        className="group mb-6 flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-line bg-surface/40 p-5 text-start transition hover:border-accent/60 hover:bg-surface"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition group-hover:scale-105">
          <Plus size={22} />
        </span>
        <span>
          <span className="block text-base font-bold">ساخت استراتژی جدید</span>
          <span className="block text-sm text-muted">نام و توضیح استراتژی را بنویسید تا در جلسات بک‌تست قابل انتخاب باشد.</span>
        </span>
      </button>

      {strategies.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">هنوز استراتژی‌ای نساخته‌اید.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {strategies.map((st) => (
            <StrategyCard
              key={st.id}
              strategy={st}
              trades={byStrategy.get(st.id) ?? []}
              onEdit={() => setModal({ open: true, strategy: st })}
              onDelete={() => setToDelete(st)}
              onStart={() => setStartWith(st.id)}
            />
          ))}
        </div>
      )}

      <StrategyModal open={modal.open} strategy={modal.strategy} onClose={() => setModal({ open: false })} />
      <SessionModal open={!!startWith} presetStrategyId={startWith ?? undefined} onClose={() => setStartWith(null)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="حذف استراتژی"
        message={`استراتژی «${toDelete?.name ?? ''}» حذف می‌شود. معاملات ثبت‌شده باقی می‌مانند ولی دیگر به این استراتژی وصل نیستند.`}
        confirmLabel="حذف استراتژی"
        onConfirm={() => {
          if (toDelete) deleteStrategy(toDelete.id);
          toast('استراتژی حذف شد', 'info');
        }}
      />
    </div>
  );
}
