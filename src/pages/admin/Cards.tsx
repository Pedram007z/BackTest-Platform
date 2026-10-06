import clsx from 'clsx';
import { Check, Pencil, Plus, Search, Trash2, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Field, Loading, PageHeader, Pager, act, dateTime, tomanFmt, useLoad } from '../../components/admin/kit';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Select, Toggle } from '../../components/ui/controls';
import { fmtPhone } from '../../lib/auth';
import { faDigits, fmtNum, toLatinDigits } from '../../lib/format';
import { backend } from '../../services';
import { bankOfCard, cardDigits, fmtCardNumber, isCardNumber } from '../../services/cards';
import type { CardAdmin, CardToCardSettings, Payment, PaymentCard } from '../../services/types';
import { RialAmount } from '../CardPay';

type CardRow = CardAdmin['cards'][number];
type Draft = Pick<PaymentCard, 'id' | 'number' | 'holder' | 'bank' | 'active'>;

const STATUS: Record<Payment['status'], [string, 'gain' | 'amber' | 'loss' | 'muted' | 'accent']> = {
  review: ['در انتظار تأیید', 'accent'],
  pending: ['منتظر واریز', 'amber'],
  paid: ['تأیید شد', 'gain'],
  failed: ['بسته شد', 'loss'],
  refunded: ['مسترد', 'muted'],
};
const CLOSED: Record<NonNullable<NonNullable<Payment['transfer']>['closed']>, string> = { expired: 'مهلت تمام شد', cancelled: 'لغو شد', rejected: 'رد شد' };

// ---------- settings ----------
function SettingsCard({ settings, hasActiveCard, onSaved }: { settings: CardToCardSettings; hasActiveCard: boolean; onSaved: () => void }) {
  const [d, setD] = useState(settings);
  const dirty = JSON.stringify(d) !== JSON.stringify(settings);
  return (
    <section className="card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-ink">
          <WalletCards size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">پرداخت کارت به کارت در صفحه‌ی خرید</p>
          <p className="text-xs text-muted">کنار درگاه‌های بانکی، با عنوان «کارت به کارت».</p>
        </div>
        <Toggle checked={d.enabled} onChange={(enabled) => setD({ ...d, enabled })} label="فعال بودن کارت به کارت" />
      </div>
      {d.enabled && !hasActiveCard && (
        <p className="mt-3 rounded-xl bg-amber/10 px-3 py-2 text-xs text-amber">هنوز کارت فعالی ندارید؛ تا یک کارت اضافه نکنید این روش در صفحه‌ی خرید دیده نمی‌شود.</p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
        <Field label="مهلت واریز (دقیقه)" htmlFor="c2c-minutes" hint="۵ تا ۱۴۴۰">
          <input
            id="c2c-minutes"
            className="field num"
            dir="ltr"
            inputMode="numeric"
            value={d.payMinutes || ''}
            onChange={(e) => setD({ ...d, payMinutes: Number(toLatinDigits(e.target.value).replace(/\D/g, '')) || 0 })}
          />
        </Field>
        <Field label="توضیح برای پرداخت‌کننده (اختیاری)" htmlFor="c2c-note" hint="زیر کارت نمایش داده می‌شود؛ مثلاً ساعت‌های بررسی واریزها.">
          <input id="c2c-note" className="field" maxLength={300} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="btn-primary py-1.5"
          disabled={!dirty}
          onClick={async () => {
            if (await act(backend.admin.saveCardSettings(d), 'تنظیمات کارت به کارت ذخیره شد')) onSaved();
          }}
        >
          ذخیره
        </button>
      </div>
    </section>
  );
}

// ---------- cards ----------
function CardEditor({ card, onClose, onSaved }: { card: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(card);
  const digits = cardDigits(d.number);
  const valid = isCardNumber(digits);
  const detected = bankOfCard(digits);
  const isNew = !card.number;
  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'کارت جدید' : 'ویرایش کارت'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!valid || d.holder.trim().length < 2}
            onClick={async () => {
              if (await act(backend.admin.saveCard({ ...d, number: digits, bank: d.bank.trim() || detected }), 'کارت ذخیره شد')) onSaved();
            }}
          >
            ذخیره
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field
          label="شماره کارت"
          htmlFor="card-number"
          hint={digits.length === 16 && !valid ? 'این شماره کارت معتبر نیست؛ دوباره بررسی کنید.' : '۱۶ رقم؛ ارقام فارسی هم قبول است.'}
        >
          <input
            id="card-number"
            className={clsx('field font-mono text-[15px] tracking-wider', digits.length === 16 && !valid && 'border-loss')}
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={fmtCardNumber(d.number)}
            onChange={(e) => setD({ ...d, number: cardDigits(e.target.value).slice(0, 16) })}
          />
        </Field>
        <Field label="نام صاحب کارت" htmlFor="card-holder" hint="همان نامی که بانک پرداخت‌کننده پیش از انتقال نشان می‌دهد.">
          <input id="card-holder" className="field" maxLength={60} value={d.holder} onChange={(e) => setD({ ...d, holder: e.target.value })} />
        </Field>
        <Field label="بانک" htmlFor="card-bank" hint={detected ? `از شماره کارت: ${detected}` : 'از شماره کارت پیدا نشد؛ نام بانک را بنویسید.'}>
          <input id="card-bank" className="field" maxLength={40} placeholder={detected} value={d.bank} onChange={(e) => setD({ ...d, bank: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Toggle checked={d.active} onChange={(active) => setD({ ...d, active })} label="کارت فعال" /> فعال (به پرداخت‌کننده‌ها نشان داده می‌شود)
        </label>
      </div>
    </Modal>
  );
}

function CardTile({ c, onEdit, onDelete, onToggle }: { c: CardRow; onEdit: () => void; onDelete: () => void; onToggle: (active: boolean) => void }) {
  return (
    <section className={clsx('card flex flex-col p-4', !c.active && 'opacity-60')}>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-bold">{c.bank || 'کارت بانکی'}</p>
        {c.active ? <Badge tone="gain">فعال</Badge> : <Badge>غیرفعال</Badge>}
        <Toggle checked={c.active} onChange={onToggle} label={`فعال بودن کارت ${c.holder}`} />
      </div>
      <p dir="ltr" className="mt-3 text-center font-mono text-[17px] font-semibold tracking-wider">
        {fmtCardNumber(c.number).replace(/-/g, ' ')}
      </p>
      <p className="mt-1 text-center text-sm">به نام {c.holder}</p>
      <dl className="num mt-4 grid grid-cols-3 gap-2 rounded-xl bg-raised/50 p-2 text-center text-[12px]">
        <div>
          <dt className="text-faint">باز</dt>
          <dd className="font-bold">{fmtNum(c.open)}</dd>
        </div>
        <div>
          <dt className="text-faint">تأییدشده</dt>
          <dd className="font-bold">{fmtNum(c.paidCount)}</dd>
        </div>
        <div>
          <dt className="text-faint">جمع</dt>
          <dd className="font-bold">{tomanFmt(c.paidToman)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex justify-end gap-1">
        <button type="button" className="icon-btn h-8 w-8" onClick={onEdit} aria-label={`ویرایش کارت ${c.holder}`}>
          <Pencil size={15} />
        </button>
        <button type="button" className="icon-btn h-8 w-8 hover:text-loss" onClick={onDelete} aria-label={`حذف کارت ${c.holder}`}>
          <Trash2 size={15} />
        </button>
      </div>
    </section>
  );
}

// ---------- transfers ----------
function ConfirmTransfer({ p, onClose, onDone }: { p: Payment; onClose: () => void; onDone: () => void }) {
  const t = p.transfer!;
  const [refId, setRefId] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="تأیید واریز"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await act(backend.admin.confirmPayment(p.id, toLatinDigits(refId).trim() || undefined), `پرداخت ${p.userName} تأیید و ${p.planName} فعال شد`);
              setBusy(false);
              if (r) onDone();
            }}
          >
            <Check size={16} /> واریز را دیدم، تأیید
          </button>
        </>
      }
    >
      <p className="text-sm leading-7">
        واریز <RialAmount amount={t.amountRial} code={t.code} className="font-bold" /> ریال به کارت {t.bank} (<span dir="ltr">****{faDigits(t.cardNumber.slice(-4))}</span>) را در
        حساب دیدید؟ با تأیید، پلن «{p.planName}» برای {p.userName} فعال می‌شود.
      </p>
      <div className="mt-4">
        <Field label="شماره‌ی پیگیری بانک (اختیاری)" htmlFor="confirm-ref" hint={t.payerRef ? `پرداخت‌کننده نوشته: ${t.payerRef}` : undefined}>
          <input id="confirm-ref" className="field num" dir="ltr" maxLength={30} value={refId} onChange={(e) => setRefId(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

const REASONS = ['واریزی با این مبلغ به حساب نرسید.', 'مبلغ واریزشده با مبلغ سفارش برابر نیست؛ با پشتیبانی تماس بگیرید.'];

function RejectTransfer({ p, onClose, onDone }: { p: Payment; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="رد واریز"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary bg-loss hover:bg-loss/90"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await act(backend.admin.rejectPayment(p.id, reason), 'پرداخت رد شد');
              setBusy(false);
              if (r) onDone();
            }}
          >
            <X size={16} /> رد پرداخت
          </button>
        </>
      }
    >
      <Field label="دلیل (به پرداخت‌کننده نشان داده می‌شود)" htmlFor="reject-reason">
        <textarea id="reject-reason" className="field min-h-[80px] leading-7" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button key={r} type="button" className="rounded-lg bg-raised px-2 py-1 text-[11px] text-muted hover:text-ink" onClick={() => setReason(r)}>
            {r}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Transfers({ onChanged }: { onChanged: () => void }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | Payment['status']>('review');
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<Payment | null>(null);
  const [rejecting, setRejecting] = useState<Payment | null>(null);
  const { data, loading, reload } = useLoad(() => backend.admin.payments({ q, status, gateway: 'card', page, pageSize: 15 }), [q, status, page]);
  const done = () => {
    setConfirming(null);
    setRejecting(null);
    void reload();
    onChanged();
  };
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">واریزها</h2>
          <p className="text-[13px] text-muted">پیامک یا گردش حساب را ببینید و سه رقم آخر مبلغ واریزی را این‌جا جست‌وجو کنید؛ هر پرداخت باز سه رقم مخصوص خودش را دارد.</p>
        </div>
      </div>
      <div className="card mb-3 grid gap-2 p-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            id="transfer-search"
            className="field pr-9"
            placeholder="سه رقم آخر مبلغ (مثلاً ۳۴۷)، مبلغ کامل، نام، موبایل یا شماره پیگیری…"
            value={q}
            onChange={(e) => {
              setQ(toLatinDigits(e.target.value));
              setPage(1);
            }}
          />
        </div>
        <div className="sm:w-44">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: 'review', label: 'در انتظار تأیید' },
              { value: 'pending', label: 'منتظر واریز' },
              { value: 'paid', label: 'تأیید شده' },
              { value: 'failed', label: 'بسته شده' },
              { value: 'all', label: 'همه' },
            ]}
          />
        </div>
      </div>
      <div className="card overflow-x-auto">
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {loading ? '…' : q ? 'پرداختی با این مشخصات پیدا نشد.' : status === 'review' ? 'واریزی در انتظار تأیید نیست.' : 'موردی نیست.'}
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['زمان', 'کاربر و پلن', 'مبلغ (ریال)', 'به کارت', 'گزارش پرداخت‌کننده', 'وضعیت', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => {
                const t = p.transfer!;
                return (
                  <tr key={p.id} className="border-t border-line/50 hover:bg-raised/30">
                    <td className="td num text-muted">{dateTime(p.createdAt)}</td>
                    <td className="td">
                      <p className="font-semibold">{p.userName}</p>
                      <p className="text-[11px] text-faint">
                        <span className="num" dir="ltr">
                          {fmtPhone(p.phone)}
                        </span>{' '}
                        · {p.planName}
                      </p>
                    </td>
                    <td className="td whitespace-nowrap text-[15px] font-bold">
                      <RialAmount amount={t.amountRial} code={t.code} />
                    </td>
                    <td className="td">
                      <p>{t.bank}</p>
                      <p className="num text-[11px] text-faint" dir="ltr" style={{ textAlign: 'right' }}>
                        ****{faDigits(t.cardNumber.slice(-4))}
                      </p>
                    </td>
                    <td className="td num text-[12px]">
                      {t.sentAt ? (
                        <>
                          <p>کارت: {t.payerCard ? <span dir="ltr">****{faDigits(t.payerCard)}</span> : '—'}</p>
                          <p className="text-faint">{t.payerRef ? `پیگیری ${faDigits(t.payerRef)}` : 'پیگیری: —'}</p>
                        </>
                      ) : (
                        <span className="text-faint">هنوز «واریز کردم» نزده</span>
                      )}
                    </td>
                    <td className="td">
                      <Badge tone={STATUS[p.status][1]}>{p.status === 'failed' && t.closed ? CLOSED[t.closed] : STATUS[p.status][0]}</Badge>
                      {p.status === 'paid' && t.reviewedBy && <p className="mt-1 text-[11px] text-faint">{t.reviewedBy}</p>}
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        {(p.status === 'pending' || p.status === 'review' || p.status === 'failed') && (
                          <button type="button" className="btn-soft px-2 py-1 text-[12px]" onClick={() => setConfirming(p)}>
                            <Check size={13} /> تأیید
                          </button>
                        )}
                        {(p.status === 'pending' || p.status === 'review') && (
                          <button type="button" className="btn-ghost px-2 py-1 text-[12px] text-loss" onClick={() => setRejecting(p)}>
                            <X size={13} /> رد
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pager page={page} total={data.total} pageSize={15} onPage={setPage} />}
      {confirming && <ConfirmTransfer p={confirming} onClose={() => setConfirming(null)} onDone={done} />}
      {rejecting && <RejectTransfer p={rejecting} onClose={() => setRejecting(null)} onDone={done} />}
    </section>
  );
}

export function AdminCards() {
  const { data, loading, reload } = useLoad(() => backend.admin.cards());
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<CardRow | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (version) void reload();
  }, [version]);
  return (
    <>
      <PageHeader
        title="کارت به کارت"
        text="کارت‌هایی که پرداخت‌کننده‌ها به آن‌ها واریز می‌کنند، و تأیید واریزها. مبلغ هر پرداخت به ریال است و سه رقم آخرش مخصوص همان پرداخت است."
        onReload={reload}
        loading={loading}
        actions={
          <button type="button" className="btn-primary" onClick={() => setEditing({ id: `card_${Date.now().toString(36)}`, number: '', holder: '', bank: '', active: true })}>
            <Plus size={16} /> کارت جدید
          </button>
        }
      />
      {!data ? (
        <Loading />
      ) : (
        <>
          <SettingsCard key={JSON.stringify(data.settings)} settings={data.settings} hasActiveCard={data.cards.some((c) => c.active)} onSaved={reload} />
          <h2 className="mb-3 mt-8 font-display text-lg font-bold">کارت‌ها</h2>
          {data.cards.length === 0 ? (
            <div className="card px-5 py-8 text-center text-sm text-muted">
              هنوز کارتی اضافه نشده است.{' '}
              <button
                type="button"
                className="font-semibold text-accent-ink hover:underline"
                onClick={() => setEditing({ id: `card_${Date.now().toString(36)}`, number: '', holder: '', bank: '', active: true })}
              >
                افزودن کارت
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.cards.map((c) => (
                  <CardTile
                    key={c.id}
                    c={c}
                    onEdit={() => setEditing({ id: c.id, number: c.number, holder: c.holder, bank: c.bank, active: c.active })}
                    onDelete={() => setDeleting(c)}
                    onToggle={async (active) => {
                      if (await act(backend.admin.saveCard({ id: c.id, number: c.number, holder: c.holder, bank: c.bank, active }), active ? 'کارت فعال شد' : 'کارت غیرفعال شد'))
                        void reload();
                    }}
                  />
                ))}
              </div>
              {data.cards.filter((c) => c.active).length > 1 && <p className="mt-2 text-[12px] text-faint">کارت‌های فعال به نوبت به پرداخت‌کننده‌ها نشان داده می‌شوند.</p>}
            </>
          )}
        </>
      )}
      <Transfers onChanged={() => setVersion((v) => v + 1)} />
      {editing && (
        <CardEditor
          card={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="حذف کارت"
        message={`کارت ${deleting?.holder ?? ''} (${deleting ? fmtCardNumber(deleting.number) : ''}) حذف شود؟ پرداخت‌های قبلی با همین کارت در تاریخچه می‌مانند.`}
        confirmLabel="حذف"
        onConfirm={async () => {
          if (deleting && (await act(backend.admin.deleteCard(deleting.id), 'کارت حذف شد')) !== null) void reload();
        }}
      />
    </>
  );
}
