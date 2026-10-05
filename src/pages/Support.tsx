import clsx from 'clsx';
import { LifeBuoy, LoaderCircle, Plus, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '../components/ui/controls';
import { Modal } from '../components/ui/Modal';
import { fmtDayLong, localDayKey } from '../lib/calendar';
import { faDigits } from '../lib/format';
import { BackendError, backend } from '../services';
import type { Ticket } from '../services/types';
import { toast } from '../store/useStore';

export const TICKET_STATUS: Record<Ticket['status'], { label: string; cls: string }> = {
  open: { label: 'در انتظار پاسخ', cls: 'bg-amber/15 text-amber' },
  answered: { label: 'پاسخ داده شد', cls: 'bg-gain/15 text-gain' },
  closed: { label: 'بسته', cls: 'bg-raised text-muted' },
};

const when = (ms: number) => `${fmtDayLong(localDayKey(new Date(ms)))}، ${faDigits(new Date(ms).toTimeString().slice(0, 5))}`;

export function TicketThread({ ticket, viewer }: { ticket: Ticket; viewer: 'user' | 'admin' }) {
  return (
    <ul className="flex flex-col gap-3">
      {ticket.messages.map((m, i) => {
        const mine = m.from === viewer;
        return (
          <li key={i} className={clsx('flex', mine ? 'justify-start' : 'justify-end')}>
            <div className={clsx('max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7', mine ? 'rounded-tr-md bg-accent/15' : 'rounded-tl-md bg-raised')}>
              <p className="mb-1 text-[11px] font-semibold text-muted">{m.from === 'admin' ? 'پشتیبانی' : ticket.userName}</p>
              <p className="whitespace-pre-line">{m.text}</p>
              <p className="num mt-1 text-[10px] text-faint">{when(m.at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => void backend.myTickets().then((t) => setTickets(t.sort((a, b) => b.updatedAt - a.updatedAt)));
  useEffect(load, []);
  const open = tickets?.find((t) => t.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">پشتیبانی</h1>
          <p className="mt-1 text-sm text-muted">سؤال، مشکل پرداخت یا پیشنهاد؟ تیکت بفرستید؛ معمولاً تا چند ساعت پاسخ می‌دهیم.</p>
        </div>
        <button type="button" className="btn-primary rounded-full px-4" onClick={() => setCreating(true)}>
          <Plus size={16} /> تیکت جدید
        </button>
      </div>
      <div className="card overflow-hidden">
        {tickets === null ? (
          <p className="p-8 text-center text-muted">
            <LoaderCircle className="mx-auto animate-spin" />
          </p>
        ) : tickets.length === 0 ? (
          <EmptyState icon={<LifeBuoy size={22} />} title="تیکتی ندارید" text="برای ارتباط با پشتیبانی یک تیکت جدید بسازید." />
        ) : (
          <ul>
            {tickets.map((t) => (
              <li key={t.id} className="border-b border-line/60 last:border-0">
                <button type="button" onClick={() => setOpenId(t.id)} className="flex w-full items-center gap-3 px-5 py-4 text-start hover:bg-raised/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.subject}</p>
                    <p className="num text-xs text-faint">آخرین به‌روزرسانی: {when(t.updatedAt)}</p>
                  </div>
                  <span className={clsx('rounded-md px-2 py-0.5 text-[11px] font-bold', TICKET_STATUS[t.status].cls)}>{TICKET_STATUS[t.status].label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="تیکت جدید"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || subject.trim().length < 3 || text.trim().length < 5}
              onClick={async () => {
                setBusy(true);
                try {
                  await backend.createTicket(subject.trim(), text.trim());
                  toast('تیکت ثبت شد');
                  setCreating(false);
                  setSubject('');
                  setText('');
                  load();
                } catch (e) {
                  toast(e instanceof BackendError ? e.message : 'ثبت تیکت انجام نشد', 'error');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Send size={15} className="-scale-x-100" /> ارسال
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="ticket-subject">
              موضوع
            </label>
            <input id="ticket-subject" className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثلاً: پرداخت انجام شد ولی اشتراک فعال نشد" />
          </div>
          <div>
            <label className="label" htmlFor="ticket-text">
              پیام
            </label>
            <textarea id="ticket-text" className="field min-h-[140px] leading-7" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal open={!!open} onClose={() => setOpenId(null)} size="lg" title={open?.subject ?? ''}>
        {open && (
          <>
            <TicketThread ticket={open} viewer="user" />
            {open.status !== 'closed' && (
              <form
                className="mt-4 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  await backend.replyMyTicket(open.id, reply.trim());
                  setReply('');
                  load();
                }}
              >
                <label className="sr-only" htmlFor="ticket-reply">
                  پاسخ
                </label>
                <input id="ticket-reply" className="field" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پاسخ خود را بنویسید…" />
                <button type="submit" className="btn-primary shrink-0 whitespace-nowrap" disabled={!reply.trim()}>
                  ارسال
                </button>
              </form>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
