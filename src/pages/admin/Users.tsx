import clsx from 'clsx';
import { Ban, Fingerprint, LineChart, Search, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';
import { Badge, Field, Loading, PageHeader, Pager, act, dateTime, useLoad } from '../../components/admin/kit';
import { Link } from '../../components/ui/AppLink';
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/controls';
import { addDays, fmtDayLong, localDayKey } from '../../lib/calendar';
import { fmtPhone } from '../../lib/auth';
import { fmtNum } from '../../lib/format';
import { backend } from '../../services';
import type { AccountUser, Plan } from '../../services/types';

const PAGE = 15;

function EditUser({ user, plans, onClose, onSaved }: { user: AccountUser; plans: Plan[]; onClose: () => void; onSaved: (u: AccountUser) => void }) {
  const [draft, setDraft] = useState(user);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<AccountUser>) => setDraft((d) => ({ ...d, ...p }));
  const extend = (days: number) => {
    const base = draft.planEndsAt > localDayKey() ? draft.planEndsAt : localDayKey();
    set({ planEndsAt: addDays(base, days) });
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`ویرایش ${user.name}`}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || draft.name.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              const u = await act(
                backend.admin.updateUser(user.id, { name: draft.name.trim(), role: draft.role, status: draft.status, planId: draft.planId, planStartedAt: draft.planStartedAt, planEndsAt: draft.planEndsAt, note: draft.note }),
                'کاربر ذخیره شد',
              );
              setBusy(false);
              if (u) onSaved(u);
            }}
          >
            ذخیره
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام" htmlFor="au-name">
          <input id="au-name" className="field" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="موبایل" htmlFor="au-phone" hint="شماره ورود قابل تغییر نیست.">
          <input id="au-phone" className="field num" dir="ltr" value={fmtPhone(user.phone)} disabled />
        </Field>
        <Field label="نقش" htmlFor="au-role">
          <Select
            id="au-role"
            value={draft.role}
            onChange={(role) => set({ role })}
            options={[
              { value: 'user', label: 'کاربر' },
              { value: 'admin', label: 'مدیر' },
            ]}
          />
        </Field>
        <Field label="وضعیت" htmlFor="au-status">
          <Select
            id="au-status"
            value={draft.status}
            onChange={(status) => set({ status })}
            options={[
              { value: 'active', label: 'فعال' },
              { value: 'banned', label: 'مسدود' },
            ]}
          />
        </Field>
        <Field label="پلن" htmlFor="au-plan">
          <Select id="au-plan" value={draft.planId} onChange={(planId) => set({ planId })} options={plans.map((p) => ({ value: p.id, label: p.name }))} />
        </Field>
        <div>
          <span className="label">پایان اشتراک</span>
          <DatePicker id="au-end" value={draft.planEndsAt} onChange={(planEndsAt) => set({ planEndsAt })} min="2020-01-01" max={addDays(localDayKey(), 3650)} />
          <div className="mt-1.5 flex gap-1">
            {[30, 90, 365].map((d) => (
              <button key={d} type="button" className="chip hover:text-ink" onClick={() => extend(d)}>
                +{fmtNum(d)} روز
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Field label="یادداشت مدیر" htmlFor="au-note">
            <textarea id="au-note" className="field min-h-[80px]" value={draft.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [role, setRole] = useState<'all' | 'user' | 'admin'>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AccountUser | null>(null);
  const [deleting, setDeleting] = useState<AccountUser | null>(null);
  const plans = useLoad(() => backend.admin.plans());
  const list = useLoad(() => backend.admin.users({ q, planId: plan, status, role, page, pageSize: PAGE }), [q, plan, status, role, page]);
  const planName = (id: string) => plans.data?.find((p) => p.id === id)?.name ?? id;
  const today = localDayKey();

  return (
    <>
      <PageHeader title="کاربران" text="جستجو، تغییر پلن و تمدید اشتراک، مسدودسازی و دسترسی مدیر." onReload={list.reload} loading={list.loading} />
      <div className="card mb-4 grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            id="admin-user-search"
            className="field pr-9"
            placeholder="نام یا شماره موبایل…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="lg:w-44">
          <Select
            value={plan}
            onChange={(v) => {
              setPlan(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'همه‌ی پلن‌ها' }, ...(plans.data ?? []).map((p) => ({ value: p.id, label: p.name }))]}
          />
        </div>
        <div className="lg:w-44">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه‌ی وضعیت‌ها' },
              { value: 'active', label: 'فعال' },
              { value: 'banned', label: 'مسدود' },
            ]}
          />
        </div>
        <div className="lg:w-40">
          <Select
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه‌ی نقش‌ها' },
              { value: 'user', label: 'کاربر' },
              { value: 'admin', label: 'مدیر' },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {!list.data ? (
          <Loading />
        ) : (
          <table className="w-full min-w-[1040px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['کاربر', 'موبایل', 'پلن', 'پایان اشتراک', 'وضعیت', 'عضویت', 'آخرین ورود', 'آخرین IP', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((u) => {
                const expired = u.planId !== 'free' && u.planEndsAt < today;
                return (
                  <tr key={u.id} className="border-t border-line/50 hover:bg-raised/30">
                    <td className="td">
                      <span className="flex items-center gap-2 font-semibold">
                        {u.name}
                        {u.role === 'admin' && <Badge tone="accent">مدیر</Badge>}
                        {u.demo && <Badge>نمایشی</Badge>}
                      </span>
                    </td>
                    <td className="td num" dir="ltr" style={{ textAlign: 'right' }}>
                      {fmtPhone(u.phone)}
                    </td>
                    <td className="td">{planName(u.planId)}</td>
                    <td className={clsx('td num', expired && 'text-loss')}>{u.planId === 'free' ? '—' : fmtDayLong(u.planEndsAt)}</td>
                    <td className="td">{u.status === 'banned' ? <Badge tone="loss">مسدود</Badge> : expired ? <Badge tone="amber">منقضی</Badge> : <Badge tone="gain">فعال</Badge>}</td>
                    <td className="td num text-muted">{dateTime(u.createdAt)}</td>
                    <td className="td num text-muted">{u.lastLoginAt ? dateTime(u.lastLoginAt) : '—'}</td>
                    <td className="td num text-muted" dir="ltr" style={{ textAlign: 'right' }}>
                      {u.lastIp || '—'}
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/backtests/${encodeURIComponent(u.id)}`} className="icon-btn h-8 w-8" aria-label={`بک‌تست‌های ${u.name}`} title="بک‌تست‌ها و دستگاه‌ها">
                          <LineChart size={15} />
                        </Link>
                        <Link
                          to={`/admin/activity?userId=${encodeURIComponent(u.id)}`}
                          className="icon-btn h-8 w-8"
                          aria-label={`ورود و خروج‌های ${u.name}`}
                          title="ورود و خروج‌ها"
                        >
                          <Fingerprint size={15} />
                        </Link>
                        <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(u)} aria-label={`ویرایش ${u.name}`} title="ویرایش">
                          <UserCog size={15} />
                        </button>
                        <button
                          type="button"
                          className={clsx('icon-btn h-8 w-8', u.status === 'banned' ? 'text-gain' : 'hover:text-loss')}
                          title={u.status === 'banned' ? 'رفع مسدودی' : 'مسدود کردن'}
                          aria-label={u.status === 'banned' ? `رفع مسدودی ${u.name}` : `مسدود کردن ${u.name}`}
                          onClick={async () => {
                            const r = await act(backend.admin.updateUser(u.id, { status: u.status === 'banned' ? 'active' : 'banned' }), u.status === 'banned' ? 'مسدودی برداشته شد' : 'کاربر مسدود شد');
                            if (r) void list.reload();
                          }}
                        >
                          {u.status === 'banned' ? <ShieldCheck size={15} /> : <Ban size={15} />}
                        </button>
                        <button type="button" className="icon-btn h-8 w-8 hover:text-loss" onClick={() => setDeleting(u)} aria-label={`حذف ${u.name}`} title="حذف">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {list.data && <Pager page={page} total={list.data.total} pageSize={PAGE} onPage={setPage} />}

      {editing && plans.data && (
        <EditUser
          user={editing}
          plans={plans.data}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void list.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="حذف کاربر"
        message={`حساب «${deleting?.name}» حذف می‌شود. تراکنش‌های او در گزارش‌ها باقی می‌ماند.`}
        confirmLabel="حذف کاربر"
        onConfirm={async () => {
          if (deleting && (await act(backend.admin.deleteUser(deleting.id), 'کاربر حذف شد')) !== null) void list.reload();
        }}
      />
    </>
  );
}
