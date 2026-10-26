import { LineChart, Monitor, Search, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Loading, PageHeader, Pager, dateTime, useLoad } from '../../components/admin/kit';
import { Link } from '../../components/ui/AppLink';
import { Select } from '../../components/ui/controls';
import { fmtPhone } from '../../lib/auth';
import { deviceLabel, isMobileUa } from '../../lib/userAgent';
import { backend } from '../../services';
import type { LoginEventKind } from '../../services/types';
import { LOGIN_KIND, LOGIN_METHOD } from './Backtests';

/** Every sign-in and sign-out, with the IP address and browser it came from. */

const PAGE = 50;
const KINDS: { value: LoginEventKind | 'all'; label: string }[] = [
  { value: 'all', label: 'همه‌ی رویدادها' },
  { value: 'login', label: 'ورود' },
  { value: 'logout', label: 'خروج' },
  { value: 'signed_out_by_admin', label: 'خروج توسط مدیر' },
];

export function AdminActivity() {
  const [params, setParams] = useSearchParams();
  const userId = params.get('userId') ?? '';
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<LoginEventKind | 'all'>('all');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => setPage(1), [q, kind, userId]);
  const list = useLoad(() => backend.admin.activity({ q, userId: userId || undefined, kind: kind === 'all' ? undefined : kind, page }), [q, kind, userId, page]);
  const d = list.data;
  const userName = userId ? d?.items[0]?.userName : undefined;

  return (
    <>
      <PageHeader title="ورود و خروج کاربران" text="هر ورود و خروج، با IP و مرورگری که از آن انجام شده است." onReload={list.reload} loading={list.loading} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="field pr-9" placeholder="نام، موبایل، IP یا مرورگر" value={text} onChange={(e) => setText(e.target.value)} aria-label="جستجو" />
        </div>
        <div className="w-44">
          <Select compact value={kind} options={KINDS} onChange={setKind} />
        </div>
      </div>
      {userId && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1 font-semibold text-accent-ink">
            فقط {userName ?? 'این کاربر'}
            <button
              type="button"
              className="rounded p-0.5 hover:bg-accent/20"
              onClick={() => setParams({}, { replace: true })}
              aria-label="نمایش همه‌ی کاربران"
              title="نمایش همه‌ی کاربران"
            >
              <X size={13} />
            </button>
          </span>
          <Link to={`/admin/backtests/${encodeURIComponent(userId)}`} className="inline-flex items-center gap-1 text-accent-ink hover:underline">
            <LineChart size={14} /> بک‌تست‌ها و دستگاه‌های این کاربر
          </Link>
        </div>
      )}
      <div className="card overflow-x-auto">
        {!d ? (
          <Loading />
        ) : d.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{q || kind !== 'all' || userId ? 'چیزی پیدا نشد.' : 'هنوز ورودی ثبت نشده است.'}</p>
        ) : (
          <table className="w-full min-w-[900px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['زمان', 'کاربر', 'رویداد', 'روش ورود', 'IP', 'دستگاه', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.items.map((e) => (
                <tr key={e.id} className="border-t border-line/50 hover:bg-raised/30">
                  <td className="td num text-muted">{dateTime(e.at)}</td>
                  <td className="td">
                    <span className="block font-semibold">{e.userName}</span>
                    <span className="num block text-[11px] text-faint" dir="ltr" style={{ textAlign: 'right' }}>
                      {fmtPhone(e.phone)}
                    </span>
                  </td>
                  <td className="td">
                    <Badge tone={LOGIN_KIND[e.kind].tone}>{LOGIN_KIND[e.kind].label}</Badge>
                  </td>
                  <td className="td text-muted">{e.method ? LOGIN_METHOD[e.method] : '—'}</td>
                  <td className="td num" dir="ltr" style={{ textAlign: 'right' }}>
                    {e.ip ? (
                      <button type="button" className="hover:text-accent-ink hover:underline" onClick={() => setText(e.ip)} title="ورودهای دیگر از این IP">
                        {e.ip}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="td text-muted" title={e.userAgent}>
                    <span className="inline-flex items-center gap-1.5">
                      {isMobileUa(e.userAgent) ? <Smartphone size={14} /> : <Monitor size={14} />}
                      {deviceLabel(e.userAgent)}
                    </span>
                  </td>
                  <td className="td">
                    {!userId && (
                      <Link to={`/admin/activity?userId=${encodeURIComponent(e.userId)}`} className="text-xs text-accent-ink hover:underline">
                        همه‌ی ورودهای این کاربر
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {d && <Pager page={page} total={d.total} pageSize={PAGE} onPage={setPage} />}
    </>
  );
}
