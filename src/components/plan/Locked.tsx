import { BarChart3, CalendarDays, Check, Layers, Lock, NotebookPen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FREE_SESSION_MESSAGE, PLAN_FEATURE_LABEL, lockedMessage, type PlanFeature } from '../../services/plan';
import { Modal } from '../ui/Modal';

const ICON = { journal: NotebookPen, analytics: BarChart3, calendar: CalendarDays, sessions: Layers };
const PERKS = ['جلسه‌های بک‌تست نامحدود', 'ژورنال معاملات', 'آنالیز کامل', 'تقویم اقتصادی روی چارت'];

function Perks() {
  return (
    <ul className="mt-5 grid gap-2 text-start text-[13px] sm:grid-cols-2">
      {PERKS.map((p) => (
        <li key={p} className="flex items-center gap-2 text-muted">
          <Check size={15} className="shrink-0 text-gain" /> {p}
        </li>
      ))}
    </ul>
  );
}

function LockedIcon({ kind }: { kind: PlanFeature | 'sessions' }) {
  const Icon = ICON[kind];
  return (
    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-raised text-muted">
      <Icon size={26} />
      <span className="absolute -bottom-1.5 -left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-pop">
        <Lock size={14} />
      </span>
    </div>
  );
}

/** A small lock beside the name of a section the plan does not include. */
export function LockMark({ className = '' }: { className?: string }) {
  return <Lock size={12} className={`shrink-0 text-faint ${className}`} aria-label="قفل در پلن رایگان" />;
}

/** In place of a page the free plan does not include (the journal, analytics). */
export function LockedPage({ feature }: { feature: PlanFeature }) {
  const label = PLAN_FEATURE_LABEL[feature];
  return (
    <div className="mx-auto max-w-[720px] px-4 pb-16 pt-10 sm:px-6">
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <LockedIcon kind={feature} />
        <h1 className="font-display text-xl font-bold">{label} قفل است</h1>
        <p className="mt-2 max-w-md text-sm leading-7 text-muted">{lockedMessage(feature)}</p>
        <Perks />
        <Link to="/billing" className="btn-primary mt-7">
          <Sparkles size={16} /> ارتقای اشتراک
        </Link>
      </div>
    </div>
  );
}

/** Asks to upgrade: for a locked section (`feature`), or for another session (no `feature`). */
export function UpgradeModal({ open, onClose, feature }: { open: boolean; onClose: () => void; feature?: PlanFeature }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={feature ? `${PLAN_FEATURE_LABEL[feature]} قفل است` : 'سقف جلسه‌های پلن رایگان'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            بستن
          </button>
          <Link to="/billing" className="btn-primary" onClick={onClose} data-autofocus>
            <Sparkles size={16} /> ارتقای اشتراک
          </Link>
        </>
      }
    >
      <div className="py-2 text-center">
        <LockedIcon kind={feature ?? 'sessions'} />
        <p className="mx-auto max-w-sm text-sm leading-7 text-muted">{feature ? lockedMessage(feature) : FREE_SESSION_MESSAGE}</p>
        <div className="mx-auto w-fit">
          <Perks />
        </div>
      </div>
    </Modal>
  );
}
