import { usePlan } from '../../hooks/usePlan';
import { UpgradeModal } from '../plan/Locked';
import { DollarSign, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DAY_MS, addDays, addMonths, fmtDayLong, keyToMs } from '../../lib/calendar';
import { fmtNum, toLatinDigits } from '../../lib/format';
import { GROUP_LABELS, SYMBOLS, SYMBOL_MAP, dataEnd, dataStartOf } from '../../lib/market';
import { covered, gapIn, intersectRanges, rangeOf, type DayRanges } from '../../lib/coverage';
import { useDataCoverage, useEnabledSymbols } from '../../services/marketFeed';
import type { Session } from '../../lib/types';
import { toast, useStore } from '../../store/useStore';
import { DatePicker } from '../ui/DatePicker';
import { Modal } from '../ui/Modal';
import { MultiSelect, Select } from '../ui/controls';
import { CostsEditor, costsError, costsFromDraft, draftFromCosts, type CostsDraft } from './CostsEditor';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit an existing session instead of creating one. */
  session?: Session;
  presetStrategyId?: string;
  onCreated?: (s: Session) => void;
}

const NONE = '__none__';

export function SessionModal({ open, onClose, session, presetStrategyId, onCreated }: Props) {
  const strategies = useStore((s) => s.strategies);
  const checklists = useStore((s) => s.checklists);
  const addSession = useStore((s) => s.addSession);
  const { canAddSession } = usePlan();
  const updateSession = useStore((s) => s.updateSession);
  const addStrategy = useStore((s) => s.addStrategy);
  const enabledSymbols = useEnabledSymbols();

  const max = dataEnd();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('10000');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [strategyId, setStrategyId] = useState<string>(NONE);
  const [checklistId, setChecklistId] = useState<string>(NONE);
  const [quickStrategy, setQuickStrategy] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [costs, setCosts] = useState<CostsDraft>({});

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setQuickStrategy(null);
    if (session) {
      setName(session.name);
      setBalance(String(session.balance));
      setSymbols(session.symbols);
      setStart(session.startDate);
      setEnd(session.endDate);
      setStrategyId(session.strategyId ?? NONE);
      setChecklistId(session.checklistId ?? NONE);
      setCosts(draftFromCosts(session.costs, session.symbols));
    } else {
      setName('');
      setBalance('10000');
      setSymbols([]);
      setStart('');
      setEnd('');
      setStrategyId(presetStrategyId ?? NONE);
      setChecklistId(NONE);
      setCosts({});
    }
  }, [open, session, presetStrategyId]);

  const balanceNum = Number(balance.replace(/[^\d.]/g, ''));
  const hasTrades = useStore((s) => (session ? s.trades.some((t) => t.sessionId === session.id) : false));

  // days every chosen symbol has chart data for on the server (the demo's generated prices cover every day)
  const coverage = useDataCoverage(open);
  const avail = useMemo<DayRanges | null>(
    () => (coverage.ranges && symbols.length ? intersectRanges(symbols.map((sym) => coverage.ranges![sym] ?? [])) : null),
    [coverage.ranges, symbols],
  );
  const firstDay = avail?.length ? avail[0][0] : dataStartOf(...symbols);
  const lastDay = avail?.length ? avail[avail.length - 1][1] : max;
  // the end date stays inside the stretch of data the start date is in
  const startRange = avail && start ? rangeOf(avail, start) : undefined;
  const endMax = startRange ? startRange[1] : lastDay;
  const noData = (k: string) => !!avail && !covered(avail, k);
  // a start date needs at least one more day with data after it
  const badStart = (k: string) => noData(k) || (!!avail && rangeOf(avail, k)?.[1] === k);
  // an existing session's dates are only checked again when they change
  const datesChanged = !session || start !== session.startDate || end !== session.endDate;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'یک نام برای جلسه بنویسید.';
    if (!(balanceNum >= 100)) e.balance = 'موجودی حساب باید حداقل ۱۰۰ دلار باشد.';
    if (symbols.length === 0) e.symbols = 'حداقل یک دارایی انتخاب کنید.';
    const missing = coverage.ranges ? symbols.filter((sym) => !coverage.ranges![sym]?.length) : [];
    if (missing.length) e.symbols = `داده‌ی چارت ${missing.map((sym) => SYMBOL_MAP[sym]?.ticker ?? sym).join('، ')} هنوز روی سرور نیست.`;
    else if (avail && symbols.length && !avail.length) e.symbols = 'این نمادها روز مشترکی با داده‌ی چارت ندارند.';
    if (!start) e.start = 'تاریخ شروع را انتخاب کنید.';
    else if (datesChanged && coverage.loading) e.start = 'در حال دریافت روزهایی که داده‌ی چارت دارند…';
    else if (datesChanged && avail && badStart(start)) e.start = 'برای این روز (یا روز بعد از آن) داده‌ی چارت نداریم؛ روز دیگری انتخاب کنید.';
    else if (start < dataStartOf(...symbols)) e.start = `داده‌ی واقعی این نمادها از ${fmtDayLong(dataStartOf(...symbols))} شروع می‌شود.`;
    if (!end) e.end = 'تاریخ پایان را انتخاب کنید.';
    if (start && end && end <= start) e.end = 'تاریخ پایان باید بعد از تاریخ شروع باشد.';
    else if (datesChanged && avail && start && end && !e.start) {
      const gap = gapIn(avail, start, end);
      if (gap) e.end = `از ${fmtDayLong(gap.from)} تا ${fmtDayLong(gap.to)} داده‌ی چارت نداریم؛ تاریخ پایان را تا ${fmtDayLong(endMax)} انتخاب کنید.`;
    }
    const c = costsError(costs, symbols);
    if (c) e.costs = c;
    return e;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, balanceNum, symbols, start, end, costs, avail, coverage.ranges, coverage.loading, datesChanged]);
  const valid = Object.keys(errors).length === 0;

  const quickEnd = (fn: (k: string) => string) => {
    const base = start || firstDay;
    let k = fn(base);
    if (k > endMax) k = endMax;
    setEnd(k);
  };

  const submit = () => {
    if (!session && !canAddSession) return;
    setTouched(true);
    if (!valid) return;
    const payload = {
      name: name.trim(),
      balance: balanceNum,
      symbols,
      startDate: start,
      endDate: end,
      strategyId: strategyId === NONE ? undefined : strategyId,
      checklistId: checklistId === NONE ? undefined : checklistId,
      costs: costsFromDraft(costs, symbols),
    };
    if (session) {
      const patch: Partial<Session> = { ...payload };
      if (!symbols.includes(session.activeSymbol)) patch.activeSymbol = symbols[0];
      // keep the replay position inside the new date range
      const lo = keyToMs(start);
      const hi = keyToMs(end) + DAY_MS;
      if (session.cursor < lo || session.cursor > hi) patch.cursor = lo;
      updateSession(session.id, patch);
      toast('تغییرات جلسه ذخیره شد');
    } else {
      const created = addSession(payload);
      toast(`جلسه «${created.name}» ساخته شد`);
      onCreated?.(created);
    }
    onClose();
  };

  const err = (k: string) => (touched && errors[k] ? <p className="mt-1.5 text-xs text-loss">{errors[k]}</p> : null);

  // the admin can limit which symbols new sessions offer; an edited session keeps the ones it has
  const symbolOptions = SYMBOLS.filter((s) => !enabledSymbols || enabledSymbols.has(s.id) || session?.symbols.includes(s.id)).map((s) => ({
    value: s.id,
    label: s.id,
    hint: s.name,
    group: GROUP_LABELS[s.group],
  }));
  const strategyOptions = [{ value: NONE, label: 'بدون استراتژی' }, ...strategies.map((s) => ({ value: s.id, label: s.name, hint: s.description.slice(0, 60) }))];
  const checklistOptions = [{ value: NONE, label: 'بدون چک‌لیست' }, ...checklists.map((c) => ({ value: c.id, label: c.name, hint: `${fmtNum(c.items.length)} آیتم` }))];

  // the free plan has one session: asks to upgrade instead
  if (!session && !canAddSession) return <UpgradeModal open={open} onClose={onClose} />;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={session ? 'ویرایش جلسه' : 'ساخت جلسه جدید'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={touched && !valid}>
            {session ? 'ذخیره تغییرات' : 'ساخت جلسه'}
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <label className="label" htmlFor="session-name">
            نام جلسه
          </label>
          <input id="session-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: شکست لندن | EURUSD" maxLength={60} />
          {err('name')}
        </div>

        <div>
          <label className="label" htmlFor="session-balance">
            موجودی حساب
          </label>
          <div className="relative">
            <DollarSign size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="session-balance"
              className="field num pr-9"
              inputMode="decimal"
              dir="ltr"
              style={{ textAlign: 'right' }}
              value={balance}
              onChange={(e) => setBalance(toLatinDigits(e.target.value).replace(/[^\d.,]/g, ''))}
              disabled={hasTrades}
            />
          </div>
          {hasTrades ? <p className="mt-1.5 text-xs text-faint">این جلسه معامله دارد؛ موجودی اولیه قابل تغییر نیست.</p> : err('balance')}
        </div>

        <div>
          <label className="label" htmlFor="session-assets">
            دارایی‌ها
          </label>
          <MultiSelect id="session-assets" values={symbols} options={symbolOptions} onChange={setSymbols} placeholder="نمادها را انتخاب کنید" />
          {err('symbols')}
        </div>

        {symbols.length > 0 && (
          <div>
            <CostsEditor symbols={symbols} value={costs} onChange={setCosts} editingWithTrades={!!session && hasTrades} />
            {err('costs')}
          </div>
        )}

        <div>
          <label className="label" htmlFor="session-strategy">
            استراتژی
          </label>
          {quickStrategy === null ? (
            <Select
              id="session-strategy"
              value={strategyId}
              options={strategyOptions}
              onChange={setStrategyId}
              footer={
                <button type="button" className="btn-ghost w-full justify-start text-accent" onClick={() => setQuickStrategy('')}>
                  <Plus size={15} /> استراتژی جدید
                </button>
              }
            />
          ) : (
            <div className="flex gap-2">
              <input
                id="session-strategy-new"
                className="field"
                autoFocus
                value={quickStrategy}
                onChange={(e) => setQuickStrategy(e.target.value)}
                placeholder="نام استراتژی جدید"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
              <button
                type="button"
                className="btn-soft shrink-0"
                disabled={!quickStrategy.trim()}
                onClick={() => {
                  const s = addStrategy({ name: quickStrategy.trim(), description: '' });
                  setStrategyId(s.id);
                  setQuickStrategy(null);
                  toast(`استراتژی «${s.name}» ساخته شد`);
                }}
              >
                افزودن
              </button>
              <button type="button" className="btn-ghost shrink-0" onClick={() => setQuickStrategy(null)}>
                لغو
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="session-checklist">
            چک‌لیست ورود <span className="font-normal text-faint">(اختیاری)</span>
          </label>
          <Select id="session-checklist" value={checklistId} options={checklistOptions} onChange={setChecklistId} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="session-start">
              تاریخ شروع
            </label>
            <DatePicker
              id="session-start"
              value={start}
              onChange={setStart}
              min={firstDay}
              max={addDays(lastDay, -1)}
              rangeWith={end}
              isDisabled={badStart}
              disabledReason="داده‌ی چارت این روز روی سرور نیست"
            />
            <p className="mt-1.5 text-xs text-faint">
              {avail?.length ? `داده‌ی چارت: ${fmtDayLong(firstDay)} تا ${fmtDayLong(lastDay)}` : `حداقل: ${fmtDayLong(firstDay)}`}
              {avail && avail.length > 1 && ' · روزهای بدون داده خط خورده‌اند'}
            </p>
            {err('start')}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0" htmlFor="session-end">
                تاریخ پایان
              </label>
              <div className="flex gap-1" dir="ltr">
                {[
                  { l: '+1D', fn: (k: string) => addDays(k, 1) },
                  { l: '+1W', fn: (k: string) => addDays(k, 7) },
                  { l: '+1M', fn: (k: string) => addMonths(k, 1) },
                ].map((q) => (
                  <button
                    key={q.l}
                    type="button"
                    className="rounded-md bg-raised px-1.5 py-0.5 text-[11px] font-semibold text-muted transition hover:text-ink"
                    onClick={() => quickEnd(q.fn)}
                    title="نسبت به تاریخ شروع"
                  >
                    {q.l}
                  </button>
                ))}
              </div>
            </div>
            <DatePicker
              id="session-end"
              value={end}
              onChange={setEnd}
              min={start ? addDays(start, 1) : addDays(firstDay, 1)}
              max={endMax}
              rangeWith={start}
              isDisabled={noData}
              disabledReason="داده‌ی چارت این روز روی سرور نیست"
            />
            <p className="mt-1.5 text-xs text-faint">حداکثر: {fmtDayLong(endMax)}</p>
            {err('end')}
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
