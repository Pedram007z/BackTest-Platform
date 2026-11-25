import clsx from 'clsx';
import { Bot, CircleAlert, Copy, FilePlus2, Info, LoaderCircle, Lock, Play, Settings2, Square, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../components/ui/AppLink';
import { CodeEditor, type CodeEditorHandle } from '../components/tester/CodeEditor';
import { Results } from '../components/tester/Results';
import { SettingsModal, type Props as TesterProps } from '../components/tester/SettingsModal';
import { TesterChart } from '../components/tester/TesterChart';
import { Select } from '../components/ui/controls';
import { DatePicker } from '../components/ui/DatePicker';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { usePlan } from '../hooks/usePlan';
import { addDays, diffDays, fmtDayLong, type DayKey } from '../lib/calendar';
import { faDigits, fmtNum } from '../lib/format';
import { SYMBOLS, SYMBOL_MAP, dataEnd, dataStartOf } from '../lib/market';
import { local } from '../lib/storage';
import type { PineScript } from '../lib/types';
import { TESTER_TIMEFRAMES } from '../pine/bars';
import { cancelRun, runTester, type Stage } from '../pine/client';
import { compileSource } from '../pine/compile';
import { PineError } from '../pine/lexer';
import type { RunResult } from '../pine/run';
import { BLANK_SCRIPT, SAMPLES } from '../pine/samples';
import { AUTOTEST_LABEL } from '../services/plan';
import { useEnabledSymbols } from '../services/marketFeed';
import { toast, useStore } from '../store/useStore';

/**
 * The strategy tester: write or paste a Pine Script, pick a symbol, timeframe and date range, and run
 * it on the platform's real market data. Indicators show their plots; strategies also get
 * TradingView-style results (overview, performance summary, list of trades), which need the paid
 * automatic testing add-on.
 */

/** Longest range per timeframe (days), to keep the data and the run reasonable. */
const MAX_DAYS: Record<string, number> = { '5': 92, '15': 183, '30': 366, '60': 731, '120': 1096, '240': 1827, D: 3653, W: 3653 };
const QUICK: [string, number][] = [
  ['۱ ماه', 30],
  ['۳ ماه', 91],
  ['۶ ماه', 182],
  ['۱ سال', 365],
  ['۳ سال', 1095],
];
const PREF = 'btl:tester';

interface Prefs {
  scriptId?: string;
  from?: DayKey;
  to?: DayKey;
}
const readPrefs = (): Prefs => {
  try {
    return JSON.parse(local.getItem(PREF) ?? '{}') as Prefs;
  } catch {
    return {};
  }
};
const writePrefs = (p: Prefs) => {
  try {
    local.setItem(PREF, JSON.stringify({ ...readPrefs(), ...p }));
  } catch {
    /* storage blocked */
  }
};

function TemplatePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (name: string, code: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title="اسکریپت جدید">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <button type="button" className="card flex flex-col items-start gap-1 p-4 text-start transition hover:border-accent" onClick={() => onPick('اسکریپت جدید', BLANK_SCRIPT)}>
          <span className="flex items-center gap-2 font-bold">
            <FilePlus2 size={16} className="text-accent-ink" /> اسکریپت خالی
          </span>
          <span className="text-[12px] text-muted">یک استراتژی ساده برای شروع؛ کد خودتان را بنویسید یا از تریدینگ‌ویو کپی کنید.</span>
        </button>
        {SAMPLES.map((s) => (
          <button key={s.id} type="button" className="card flex flex-col items-start gap-1 p-4 text-start transition hover:border-accent" onClick={() => onPick(s.name, s.code)}>
            <span className="font-bold">{s.name}</span>
            <span className="text-[12px] leading-5 text-muted">{s.description}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Help() {
  return (
    <details className="card group p-4 text-[13px]">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
        <Info size={16} className="text-accent-ink" /> چه چیزهایی از Pine Script پشتیبانی می‌شود؟
      </summary>
      <div className="mt-3 grid gap-4 leading-7 text-muted md:grid-cols-2">
        <ul className="list-disc ps-5">
          <li>نسخه‌های ۵ و ۶ (و اسکریپت‌های قدیمی نسخه‌ی ۴)، با indicator و strategy.</li>
          <li>متغیرها، var، تاریخچه با [ ]، if / for / while / switch، تابع‌ها، method و type.</li>
          <li>بیش از ۵۰ تابع ta (میانگین‌ها، RSI، MACD، ATR، بولینگر، سوپرترند، پیوت‌ها و …)، math، str، array، map و رنگ‌ها.</li>
          <li>strategy.entry / order / exit / close / cancel با حد سود، حد ضرر، تریلینگ استاپ، پیرامیدینگ، کمیسیون و لغزش؛ پر شدن سفارش‌ها مثل Strategy Tester تریدینگ‌ویو.</li>
          <li>request.security برای تایم‌فریم بالاتر و نمادهای دیگر سایت؛ ورودی‌ها (input.*) در «تنظیمات» قابل تغییرند.</li>
        </ul>
        <ul className="list-disc ps-5">
          <li>داده‌ها همان قیمت‌های واقعی سایت‌اند (قیمت Bid)؛ حجم (volume) در داده نیست و na است.</li>
          <li>حجم سفارش به واحد است (در فارکس ۱ لات = ۱۰۰٬۰۰۰ واحد) و سود و زیان به دلار.</li>
          <li>import کتابخانه‌ها، request.* به جز security، و رسم line / box / table روی چارت پشتیبانی نمی‌شوند (label‌ها نمایش داده می‌شوند).</li>
          <li>میان‌برها: Ctrl+Enter اجرا، Ctrl+S ذخیره، Ctrl+/ کامنت کردن خطوط، Tab تورفتگی.</li>
          <li>اجرای اندیکاتورها آزاد است؛ دیدن نتیجه‌ی استراتژی‌ها به افزونه‌ی «{AUTOTEST_LABEL}» نیاز دارد.</li>
        </ul>
      </div>
    </details>
  );
}

export default function StrategyTester() {
  const scripts = useStore((s) => s.scripts);
  const addScript = useStore((s) => s.addScript);
  const updateScript = useStore((s) => s.updateScript);
  const deleteScript = useStore((s) => s.deleteScript);
  const { autoTest } = usePlan();
  const enabled = useEnabledSymbols();

  const prefs = useMemo(readPrefs, []);
  const [scriptId, setScriptId] = useState<string>(() => (prefs.scriptId && scripts.some((s) => s.id === prefs.scriptId) ? prefs.scriptId : (scripts[0]?.id ?? '')));
  const script: PineScript | undefined = scripts.find((s) => s.id === scriptId);
  const [code, setCode] = useState(script?.code ?? '');
  const [name, setName] = useState(script?.name ?? '');
  const [symbol, setSymbol] = useState(script?.symbol ?? 'EURUSD');
  const [timeframe, setTimeframe] = useState(script?.timeframe ?? '60');
  const maxDay = dataEnd();
  const [to, setTo] = useState<DayKey>(prefs.to && prefs.to <= maxDay ? prefs.to : maxDay);
  const [from, setFrom] = useState<DayKey>(prefs.from && prefs.from < (prefs.to ?? maxDay) ? prefs.from : addDays(maxDay, -182));
  const [stage, setStage] = useState<Stage | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [lint, setLint] = useState<{ message: string; line: number; col: number } | null>(null);
  const [templates, setTemplates] = useState(false);
  const [settings, setSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editor = useRef<CodeEditorHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // the first visit: start from the first template
  useEffect(() => {
    if (!scripts.length) {
      const s = addScript({ name: SAMPLES[0].name, code: SAMPLES[0].code });
      setScriptId(s.id);
    }
  }, []);
  // another script picked (or the one just made): load it
  useEffect(() => {
    if (!script) return;
    setCode(script.code);
    setName(script.name);
    if (script.symbol) setSymbol(script.symbol);
    if (script.timeframe) setTimeframe(script.timeframe);
    setResult(null);
    writePrefs({ scriptId: script.id });
  }, [scriptId, !!script]);

  // typing saves after a short pause (and syncs to the user's other devices)
  const save = (now = false) => {
    if (!script) return;
    clearTimeout(saveTimer.current);
    const write = () => {
      if (code !== script.code || name.trim() !== script.name) updateScript(script.id, { code, name: name.trim() || 'بدون نام' });
    };
    if (now) {
      write();
      toast('اسکریپت ذخیره شد');
    } else saveTimer.current = setTimeout(write, 700);
  };
  useEffect(() => {
    save();
    return () => clearTimeout(saveTimer.current);
  }, [code, name]);

  // syntax check while typing
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        compileSource(code);
        setLint(null);
      } catch (e) {
        setLint(e instanceof PineError ? { message: e.message, line: e.line, col: e.col } : null);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => writePrefs({ from, to }), [from, to]);

  const symbolOptions = useMemo(() => SYMBOLS.filter((s) => !enabled || enabled.has(s.id)).map((s) => ({ value: s.id, label: s.ticker, hint: s.name })), [enabled]);
  const maxDays = MAX_DAYS[timeframe] ?? 365;
  const days = diffDays(from, to) + 1;
  const rangeError =
    from > to
      ? 'تاریخ شروع بعد از پایان است.'
      : days > maxDays
        ? `در تایم‌فریم انتخاب‌شده بازه حداکثر ${fmtNum(maxDays)} روز است؛ تایم‌فریم بزرگ‌تر یا بازه‌ی کوتاه‌تر انتخاب کنید.`
        : '';
  const minDay = dataStartOf(symbol);

  const run = async (overrides?: { inputs?: Record<string, unknown>; settings?: TesterProps }) => {
    if (stage || !script) return;
    if (rangeError) {
      toast(rangeError, 'error');
      return;
    }
    save(false);
    updateScript(script.id, {
      code,
      symbol,
      timeframe,
      ...(overrides?.inputs ? { inputs: overrides.inputs } : {}),
      ...(overrides?.settings ? { settings: overrides.settings } : {}),
    });
    try {
      const r = await runTester(
        { code, symbol, timeframe, from, to, inputs: overrides?.inputs ?? script.inputs, settings: (overrides?.settings ?? script.settings) as TesterProps },
        setStage,
      );
      setResult(r);
      if (!r.ok && r.error.line) setTimeout(() => editor.current?.jumpTo(r.error.line, r.error.col || 1), 50);
    } catch (e) {
      setResult({ ok: false, error: { message: (e as Error).message || 'دریافت داده انجام نشد.', line: 0, col: 0 }, inputs: [], logs: [] });
    } finally {
      setStage(null);
    }
  };

  const ok = result?.ok ? result : null;
  const fail = result && !result.ok ? result : null;
  const strategyLocked = !!ok?.strategy && !autoTest;
  const errorLine = fail?.error.line || lint?.line || undefined;
  const sym = SYMBOL_MAP[symbol];

  const lockPanel = strategyLocked ? (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-raised text-muted">
        <Bot size={24} />
        <span className="absolute -bottom-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
          <Lock size={12} />
        </span>
      </div>
      <p className="font-bold">نتیجه‌ی تست خودکار به افزونه نیاز دارد</p>
      <p className="mt-1 max-w-md text-[13px] leading-6 text-muted">
        استراتژی اجرا شد و {faDigits(ok!.strategy!.closed.length)} معامله در این بازه انجام داد. برای دیدن گزارش عملکرد، فهرست معاملات و منحنی سرمایه، افزونه‌ی «{AUTOTEST_LABEL}»
        را فعال کنید.
      </p>
      <Link to="/billing?addon=1" className="btn-primary mt-5">
        فعال‌سازی تست خودکار
      </Link>
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">تست خودکار استراتژی</h1>
          <p className="mt-1 text-sm text-muted">استراتژی یا اندیکاتور Pine Script بنویسید یا از تریدینگ‌ویو کپی کنید و روی داده‌ی واقعی بازار اجرا کنید.</p>
        </div>
        <span className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold', autoTest ? 'bg-gain/15 text-gain' : 'bg-raised text-muted')}>
          <Bot size={14} /> {autoTest ? 'افزونه‌ی تست خودکار فعال است' : 'افزونه‌ی تست خودکار فعال نیست'}
        </span>
      </div>

      {/* script and run settings */}
      <section className="card mb-4 flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-56">
            <span className="label">اسکریپت</span>
            <Select compact value={scriptId} onChange={setScriptId} options={scripts.map((s) => ({ value: s.id, label: s.name }))} placeholder="اسکریپتی نیست" />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="label" htmlFor="pine-name">
              نام
            </label>
            <input id="pine-name" className="field py-1.5" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            <button type="button" className="btn-soft h-9 px-3" onClick={() => setTemplates(true)} title="اسکریپت جدید">
              <FilePlus2 size={16} /> جدید
            </button>
            <button
              type="button"
              className="btn-ghost h-9 px-2.5"
              title="کپی"
              aria-label="کپی اسکریپت"
              disabled={!script}
              onClick={() => {
                const s = addScript({ name: `${name} (کپی)`, code });
                setScriptId(s.id);
              }}
            >
              <Copy size={16} />
            </button>
            <button type="button" className="btn-ghost h-9 px-2.5 hover:text-loss" title="حذف" aria-label="حذف اسکریپت" disabled={!script} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-36">
            <span className="label">نماد</span>
            <Select compact value={symbol} onChange={setSymbol} options={symbolOptions} />
          </div>
          <div className="w-32">
            <span className="label">تایم‌فریم</span>
            <Select compact value={timeframe} onChange={setTimeframe} options={TESTER_TIMEFRAMES.map((t) => ({ value: t.tv, label: t.label }))} />
          </div>
          <div className="w-full min-[480px]:w-56">
            <span className="label">از</span>
            <DatePicker id="pine-from" value={from} onChange={setFrom} min={minDay} max={to} rangeWith={to} />
          </div>
          <div className="w-full min-[480px]:w-56">
            <span className="label">تا</span>
            <DatePicker id="pine-to" value={to} onChange={setTo} min={from} max={maxDay} rangeWith={from} />
          </div>
          <div className="flex flex-wrap gap-1 pb-1.5">
            {QUICK.map(([label, d]) => (
              <button
                key={label}
                type="button"
                className="chip hover:text-ink disabled:opacity-40"
                disabled={d > maxDays}
                onClick={() => setFrom(addDays(to, -d + 1) < minDay ? minDay : addDays(to, -d + 1))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ms-auto flex gap-1.5">
            <button type="button" className="btn-ghost h-10 px-3" onClick={() => setSettings(true)} disabled={!script}>
              <Settings2 size={16} /> تنظیمات
            </button>
            {stage ? (
              <button type="button" className="btn-soft h-10 px-4" onClick={cancelRun}>
                <Square size={14} /> توقف
              </button>
            ) : (
              <button type="button" className="btn-primary h-10 px-5" onClick={() => void run()} disabled={!script || !!lint}>
                <Play size={16} /> اجرا
              </button>
            )}
          </div>
        </div>
        {rangeError && <p className="text-[12px] text-loss">{rangeError}</p>}
        {!rangeError && (
          <p className="num text-[11px] text-faint">
            {fmtDayLong(from)} تا {fmtDayLong(to)} · {fmtNum(days)} روز
          </p>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <CodeEditor ref={editor} value={code} onChange={setCode} errorLine={errorLine} onRun={() => void run()} onSave={() => save(true)} className="h-[460px]" />
          {(lint || fail) && (
            <button
              type="button"
              className="flex items-start gap-2 rounded-xl border border-loss/50 bg-loss/10 px-3 py-2.5 text-start text-[13px]"
              onClick={() => {
                const e = lint ?? fail?.error;
                if (e?.line) editor.current?.jumpTo(e.line, e.col || 1);
              }}
            >
              <CircleAlert size={17} className="mt-0.5 shrink-0 text-loss" />
              <span className="min-w-0">
                {(lint ?? fail?.error)?.line ? <b className="num">خط {faDigits((lint ?? fail!.error).line)}: </b> : null}
                {(lint ?? fail!.error).message}
                {!lint && fail?.error.time !== undefined && (
                  <span className="num block text-[11px] text-muted">در کندل {fmtDayLong(new Date(fail.error.time).toISOString().slice(0, 10))}</span>
                )}
              </span>
            </button>
          )}
        </div>

        <div className="card relative min-h-[460px] overflow-hidden p-0">
          {ok && sym ? (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/60 px-4 py-2 text-[12px]">
                <b>{ok.decl.title}</b>
                <span className="text-muted">
                  {sym.ticker} · {TESTER_TIMEFRAMES.find((t) => t.tv === timeframe)?.label}
                </span>
                <span className="num text-faint">
                  {fmtNum(ok.bars.time.length)} کندل · {fmtNum(ok.ms / 1000, 1)} ثانیه
                </span>
              </div>
              <TesterChart result={ok} digits={sym.digits} showTrades={!strategyLocked} height={420} />
            </>
          ) : (
            <div className="flex h-full min-h-[460px] flex-col items-center justify-center gap-3 p-6 text-center text-muted">
              {stage ? (
                <>
                  <LoaderCircle size={28} className="animate-spin text-accent-ink" />
                  <p className="text-sm">{stage === 'data' ? 'در حال دریافت داده‌ی بازار…' : 'در حال اجرای اسکریپت…'}</p>
                </>
              ) : (
                <>
                  <Play size={28} className="text-faint" />
                  <p className="text-sm">نماد، تایم‌فریم و بازه را انتخاب کنید و «اجرا» را بزنید.</p>
                </>
              )}
            </div>
          )}
          {stage && ok && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-[1px]">
              <LoaderCircle size={28} className="animate-spin text-accent-ink" />
            </div>
          )}
        </div>
      </div>

      {ok && (
        <div className="mt-4">
          <Results key={ok.ms + ok.bars.time.length} result={ok} locked={lockPanel} contractSize={sym?.contractSize ?? 1} digits={sym?.digits ?? 5} />
        </div>
      )}
      {fail && fail.logs.length > 0 && (
        <section className="card mt-4 p-4">
          <h2 className="mb-2 text-[13px] font-bold">لاگ‌ها تا پیش از خطا</h2>
          <ul className="max-h-60 overflow-y-auto font-mono text-[12px]" dir="ltr">
            {fail.logs.map((l, i) => (
              <li key={i} className="border-t border-line/40 py-1 first:border-0" dir="auto">
                {l.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4">
        <Help />
      </div>

      <TemplatePicker
        open={templates}
        onClose={() => setTemplates(false)}
        onPick={(n, c) => {
          const s = addScript({ name: n, code: c });
          setScriptId(s.id);
          setTemplates(false);
        }}
      />
      {settings && script && (
        <SettingsModal
          open
          onClose={() => setSettings(false)}
          inputs={ok?.inputs ?? fail?.inputs ?? []}
          values={script.inputs ?? {}}
          effective={ok?.strategy?.settings ?? null}
          props={(script.settings ?? {}) as TesterProps}
          onApply={(inputs, props) => void run({ inputs, settings: props })}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="حذف اسکریپت"
        message={`«${script?.name ?? ''}» حذف شود؟ این کار برگشت‌پذیر نیست.`}
        confirmLabel="حذف"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!script) return;
          const next = scripts.find((s) => s.id !== script.id);
          deleteScript(script.id);
          setScriptId(next?.id ?? '');
          setConfirmDelete(false);
          if (!next) {
            const s = addScript({ name: 'اسکریپت جدید', code: BLANK_SCRIPT });
            setScriptId(s.id);
          }
        }}
      />
    </div>
  );
}
