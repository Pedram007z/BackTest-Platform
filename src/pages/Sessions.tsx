import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SessionList } from '../components/sessions/SessionList';
import { SessionModal } from '../components/sessions/SessionModal';
import { Select } from '../components/ui/controls';
import { fmtNum } from '../lib/format';
import { sessionRemainingDays } from '../lib/stats';
import { useStore } from '../store/useStore';

type Status = 'all' | 'active' | 'done';
type Sort = 'recent' | 'created' | 'name';

export default function Sessions() {
  const sessions = useStore((s) => s.sessions);
  const strategies = useStore((s) => s.strategies);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [strategy, setStrategy] = useState('all');
  const [sort, setSort] = useState<Sort>('recent');

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return sessions
      .filter((s) => !query || s.name.toLowerCase().includes(query) || s.symbols.some((x) => x.toLowerCase().includes(query)))
      .filter((s) => status === 'all' || (status === 'done' ? sessionRemainingDays(s) === 0 : sessionRemainingDays(s) > 0))
      .filter((s) => strategy === 'all' || s.strategyId === strategy)
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, 'fa');
        if (sort === 'created') return b.createdAt - a.createdAt;
        return (b.lastOpenedAt ?? b.createdAt) - (a.lastOpenedAt ?? a.createdAt);
      });
  }, [sessions, q, status, strategy, sort]);

  const active = sessions.filter((s) => sessionRemainingDays(s) > 0).length;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">جلسات</h1>
          <p className="num mt-1 text-sm text-muted">
            {fmtNum(sessions.length)} جلسه، {fmtNum(active)} در حال انجام
          </p>
        </div>
        <button type="button" className="btn-primary rounded-full px-4" onClick={() => setCreating(true)}>
          <Plus size={16} /> جلسه جدید
        </button>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input id="session-search" className="field pr-9" placeholder="جستجو در نام جلسه یا نماد…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="sm:w-40">
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'همه‌ی جلسات' },
              { value: 'active', label: 'در حال انجام' },
              { value: 'done', label: 'تمام‌شده' },
            ]}
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={strategy}
            onChange={setStrategy}
            options={[{ value: 'all', label: 'همه‌ی استراتژی‌ها' }, ...strategies.map((s) => ({ value: s.id, label: s.name }))]}
          />
        </div>
        <div className="sm:w-44">
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'آخرین بازدید' },
              { value: 'created', label: 'جدیدترین' },
              { value: 'name', label: 'بر اساس نام' },
            ]}
          />
        </div>
      </div>

      <SessionList
        sessions={list}
        initialPageSize={10}
        emptyText={sessions.length ? 'جلسه‌ای با این فیلترها پیدا نشد.' : 'هنوز جلسه‌ای نساخته‌اید. با «جلسه جدید» شروع کنید.'}
      />
      <SessionModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
