import clsx from 'clsx';
import { CircleAlert, Code2, FilePlus2, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { IndicatorApi } from '../../chart/lwIndicators';
import { compileSource } from '../../pine/compile';
import { PineError } from '../../pine/lexer';
import { toast, useStore } from '../../store/useStore';
import { Link } from '../ui/AppLink';
import { Modal } from '../ui/Modal';
import { CodeEditor, type CodeEditorHandle } from '../tester/CodeEditor';
import { InputField } from '../tester/SettingsModal';

/**
 * The user's own indicators on the replay chart: Pine scripts written or pasted here (or in the
 * strategy tester), listed in the chart's indicators dialog and drawn by lwIndicators.
 */

export const INDICATOR_TEMPLATE = `//@version=5
indicator("اندیکاتور من", overlay = true)

// کد اندیکاتور خود را اینجا بنویسید یا از تریدینگ‌ویو کپی کنید
length = input.int(20, "طول")
src    = input.source(close, "منبع")

basis = ta.ema(src, length)
plot(basis, "EMA", color.orange, 2)
`;

export type ScriptKind = 'indicator' | 'strategy' | 'unknown';

/** What a script declares: indicator(…) / study(…) or strategy(…). */
export function scriptKind(code: string): ScriptKind {
  if (/^\s*(indicator|study)\s*\(/m.test(code)) return 'indicator';
  if (/^\s*strategy\s*\(/m.test(code)) return 'strategy';
  return 'unknown';
}

/** Write or paste a script; a new one is saved to the user's scripts (and synced). */
export function PineCodeModal({ scriptId, onClose, onSaved }: { scriptId?: string; onClose: () => void; onSaved: (scriptId: string, isNew: boolean) => void }) {
  const script = useStore((s) => s.scripts.find((x) => x.id === scriptId));
  const addScript = useStore((s) => s.addScript);
  const updateScript = useStore((s) => s.updateScript);
  const [name, setName] = useState(script?.name ?? 'اندیکاتور من');
  const [code, setCode] = useState(script?.code ?? INDICATOR_TEMPLATE);
  const [lint, setLint] = useState<{ message: string; line: number; col: number } | null>(null);
  const editor = useRef<CodeEditorHandle>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        compileSource(code);
        setLint(null);
      } catch (e) {
        setLint(e instanceof PineError ? { message: e.message, line: e.line, col: e.col } : { message: String((e as Error)?.message ?? e), line: 0, col: 0 });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [code]);

  const kind = scriptKind(code);
  const save = () => {
    if (lint) {
      if (lint.line) editor.current?.jumpTo(lint.line, lint.col || 1);
      return;
    }
    const n = name.trim() || 'اندیکاتور من';
    if (script) {
      updateScript(script.id, { name: n, code });
      onSaved(script.id, false);
    } else onSaved(addScript({ name: n, code }).id, true);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={script ? `ویرایش کد «${script.name}»` : 'اندیکاتور جدید با Pine Script'}
      footer={
        <>
          <Link to="/strategy-tester" className="btn-ghost me-auto text-[13px]">
            <Code2 size={15} /> اسکریپت‌ها در صفحه‌ی تست خودکار
          </Link>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={!!lint}>
            {script ? 'ذخیره' : 'ذخیره و افزودن به چارت'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="pine-ind-name">
            نام
          </label>
          <input id="pine-ind-name" className="field" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
        <p className="text-[12px] leading-6 text-muted">
          کد اندیکاتور را بنویسید یا از تریدینگ‌ویو کپی کنید (نسخه‌ی ۵ و ۶ و بیشتر اسکریپت‌های نسخه‌ی ۴). اندیکاتور فقط کندل‌هایی را می‌بیند که ریپلی تا الان نشان داده و با هر قدم
          دوباره حساب می‌شود.
        </p>
        <CodeEditor ref={editor} value={code} onChange={setCode} errorLine={lint?.line || undefined} onSave={save} className="h-[380px]" />
        {lint ? (
          <button
            type="button"
            className="flex items-start gap-2 rounded-xl border border-loss/50 bg-loss/10 px-3 py-2 text-start text-[13px]"
            onClick={() => lint.line && editor.current?.jumpTo(lint.line, lint.col || 1)}
          >
            <CircleAlert size={16} className="mt-0.5 shrink-0 text-loss" />
            <span>
              {lint.line ? <b>خط {lint.line}: </b> : null}
              {lint.message}
            </span>
          </button>
        ) : kind === 'strategy' ? (
          <p className="rounded-xl bg-amber/10 px-3 py-2 text-[12px] leading-6 text-amber">
            این کد یک strategy است: روی چارت فقط خطوط و شکل‌هایش نمایش داده می‌شود. نتیجه‌ی معاملات آن را در صفحه‌ی «تست خودکار» ببینید.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

/** The user's scripts in the chart's indicators dialog. */
export function PineScriptsSection({ api, query, onAdded }: { api: IndicatorApi; query: string; onAdded: () => void }) {
  const scripts = useStore((s) => s.scripts);
  const [coding, setCoding] = useState(false);
  const q = query.trim().toLowerCase();
  const list = scripts.filter((s) => !q || s.name.toLowerCase().includes(q) || 'pine'.includes(q));
  const add = (id: string, name: string) => {
    api.addPine(id);
    toast(`${name} به چارت اضافه شد`);
    onAdded();
  };
  return (
    <section className="mb-3 border-b border-line/60 pb-3" aria-label="اندیکاتورهای من">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <h3 className="text-[12px] font-bold text-muted">اندیکاتورهای من (Pine Script)</h3>
        <button type="button" className="btn-soft h-8 px-2.5 text-[12px]" onClick={() => setCoding(true)}>
          <Plus size={14} /> اندیکاتور جدید با کد
        </button>
      </div>
      {list.length ? (
        <ul className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
          {list.map((s) => {
            const kind = scriptKind(s.code);
            return (
              <li key={s.id}>
                <button type="button" onClick={() => add(s.id, s.name)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start hover:bg-raised">
                  <Code2 size={16} className="shrink-0 text-accent-ink" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.name}</span>
                  <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-semibold', kind === 'strategy' ? 'bg-amber/15 text-amber' : 'bg-accent/10 text-accent-ink')}>
                    {kind === 'strategy' ? 'استراتژی' : 'اندیکاتور'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !q && (
          <button
            type="button"
            onClick={() => setCoding(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line px-3 py-3 text-start text-[13px] text-muted hover:border-accent hover:text-ink"
          >
            <FilePlus2 size={16} className="shrink-0" /> کد اندیکاتور دلخواهتان را بنویسید یا از تریدینگ‌ویو کپی کنید تا روی چارت اضافه شود.
          </button>
        )
      )}
      {coding && (
        <PineCodeModal
          onClose={() => setCoding(false)}
          onSaved={(id) => {
            setCoding(false);
            const name = useStore.getState().scripts.find((x) => x.id === id)?.name ?? 'اندیکاتور';
            add(id, name);
          }}
        />
      )}
    </section>
  );
}

/** Settings of a Pine indicator on the chart: its inputs, and its code. */
export function PineIndicatorSettings({ api, id, onClose }: { api: IndicatorApi; id: string; onClose: () => void }) {
  const cfg = api.list().find((c) => c.id === id);
  const [info, setInfo] = useState(() => api.pineInfo(id));
  const [values, setValues] = useState<Record<string, unknown>>(cfg?.pine?.inputs ?? {});
  const [coding, setCoding] = useState(false);
  useEffect(() => api.subscribe(() => setInfo(api.pineInfo(id))), [api, id]);
  if (!cfg || !info) return null;
  const scriptId = cfg.pine?.script ?? '';
  return (
    <>
      <Modal
        open={!coding}
        onClose={onClose}
        size="md"
        title={info.title}
        footer={
          <>
            <button type="button" className="btn-ghost me-auto" onClick={() => setValues({})} disabled={!info.inputs.length}>
              <RotateCcw size={15} /> پیش‌فرض
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>
              انصراف
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                api.update({ ...cfg, pine: { script: scriptId, inputs: values } });
                onClose();
              }}
            >
              ذخیره
            </button>
          </>
        }
      >
        {info.error && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-loss/50 bg-loss/10 px-3 py-2 text-[13px]">
            <CircleAlert size={16} className="mt-0.5 shrink-0 text-loss" /> {info.error}
          </p>
        )}
        {info.inputs.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {info.inputs.map((d) => (
              <div key={d.key} className={clsx(d.type === 'bool' && 'flex items-center justify-between gap-3 rounded-xl border border-line/60 px-3 py-2')}>
                <label className={clsx(d.type === 'bool' ? 'text-[13px]' : 'label')} htmlFor={`in-${d.key}`} title={d.tooltip}>
                  {d.title || d.key}
                </label>
                <InputField def={d} value={values[d.key]} onChange={(v) => setValues((x) => ({ ...x, [d.key]: v }))} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">این اندیکاتور ورودی (input) ندارد.</p>
        )}
        <button type="button" className="btn-soft mt-5 w-full" onClick={() => setCoding(true)} disabled={!useStore.getState().scripts.some((s) => s.id === scriptId)}>
          <Code2 size={15} /> ویرایش کد اندیکاتور
        </button>
      </Modal>
      {coding && (
        <PineCodeModal
          scriptId={scriptId}
          onClose={() => setCoding(false)}
          onSaved={() => {
            setCoding(false);
            toast('کد اندیکاتور ذخیره شد');
          }}
        />
      )}
    </>
  );
}
