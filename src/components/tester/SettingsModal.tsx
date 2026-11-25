import clsx from 'clsx';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { BrokerSettings } from '../../pine/broker';
import { SOURCE_NAMES, type InputDef } from '../../pine/core';
import { Select, Toggle } from '../ui/controls';
import { Modal } from '../ui/Modal';

/**
 * The script's settings, as TradingView's: «ورودی‌ها» are the script's input.* values, «ویژگی‌ها» the
 * strategy's properties (capital, order size, commission, …), which win over strategy(…).
 */

export type Props = Partial<
  Pick<BrokerSettings, 'initialCapital' | 'qtyType' | 'qtyValue' | 'pyramiding' | 'commissionType' | 'commissionValue' | 'slippage' | 'processOnClose' | 'magnifier'>
>;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  inputs: InputDef[];
  values: Record<string, unknown>;
  /** the strategy's settings in the last run (strategy(…) with the overrides) */
  effective: BrokerSettings | null;
  props: Props;
  onApply: (values: Record<string, unknown>, props: Props) => void;
}

const numberOr = (s: string, d: number) => {
  const n = Number(s.replace(/[^\d.\-eE]/g, ''));
  return Number.isFinite(n) ? n : d;
};

function InputField({ def, value, onChange }: { def: InputDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = `in-${def.key}`;
  const v = value === undefined ? def.defval : value;
  if (def.type === 'bool') return <Toggle id={id} checked={v === true} onChange={onChange} label={def.title || def.key} />;
  if (def.type === 'source') return <Select id={id} compact value={String(v)} onChange={onChange} options={SOURCE_NAMES.map((s) => ({ value: s, label: s }))} />;
  if (def.options?.length)
    return (
      <Select
        id={id}
        compact
        value={String(v)}
        onChange={(x) => onChange(def.type === 'int' || def.type === 'float' ? Number(x) : x)}
        options={def.options.map((o) => ({ value: String(o), label: String(o) }))}
      />
    );
  if (def.type === 'color') {
    const hex = typeof v === 'string' ? v.slice(0, 7) : '#2196f3';
    return (
      <input id={id} type="color" className="h-9 w-16 cursor-pointer rounded-lg border border-line bg-transparent" value={hex} onChange={(e) => onChange(`${e.target.value}ff`)} />
    );
  }
  if (def.type === 'int' || def.type === 'float' || def.type === 'price' || def.type === 'time')
    return (
      <input
        id={id}
        className="field num py-1.5"
        dir="ltr"
        type="number"
        inputMode="decimal"
        step={def.step ?? (def.type === 'int' ? 1 : 'any')}
        min={def.minval}
        max={def.maxval}
        value={typeof v === 'number' && Number.isFinite(v) ? v : ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    );
  return <input id={id} className="field py-1.5" dir="ltr" value={String(v ?? '')} onChange={(e) => onChange(e.target.value)} />;
}

export function SettingsModal({ open, onClose, inputs, values, effective, props, onApply }: ModalProps) {
  const [tab, setTab] = useState<'inputs' | 'props'>(inputs.length || !effective ? 'inputs' : 'props');
  const [vals, setVals] = useState(values);
  const [pr, setPr] = useState<Props>(props);
  const eff = { ...effective, ...pr } as BrokerSettings;
  const groups = [...new Set(inputs.map((d) => d.group ?? ''))];
  const setProp = (p: Props) => setPr((x) => ({ ...x, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="تنظیمات اسکریپت"
      footer={
        <>
          <button
            type="button"
            className="btn-ghost me-auto"
            onClick={() => {
              if (tab === 'inputs') setVals({});
              else setPr({});
            }}
          >
            <RotateCcw size={15} /> پیش‌فرض‌های اسکریپت
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onApply(vals, pr);
              onClose();
            }}
          >
            اعمال و اجرا
          </button>
        </>
      }
    >
      <div className="mb-4 flex gap-1" role="tablist">
        {(
          [
            ['inputs', 'ورودی‌ها'],
            ['props', 'ویژگی‌های استراتژی'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            disabled={id === 'props' && !effective}
            onClick={() => setTab(id)}
            className={clsx('rounded-lg px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40', tab === id ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-raised')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'inputs' ? (
        inputs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">این اسکریپت ورودی (input) ندارد. پس از اولین اجرا، ورودی‌های اسکریپت اینجا نمایش داده می‌شوند.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <section key={g}>
                {g && <h3 className="mb-2 text-[12px] font-bold text-muted">{g}</h3>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {inputs
                    .filter((d) => (d.group ?? '') === g)
                    .map((d) => (
                      <div key={d.key} className={clsx(d.type === 'bool' && 'flex items-center justify-between gap-3 rounded-xl border border-line/60 px-3 py-2')}>
                        <label className={clsx(d.type === 'bool' ? 'text-[13px]' : 'label')} htmlFor={`in-${d.key}`} title={d.tooltip}>
                          {d.title || d.key}
                        </label>
                        <InputField def={d} value={vals[d.key]} onChange={(v) => setVals((x) => ({ ...x, [d.key]: v }))} />
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : effective ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pr-capital">
              سرمایه‌ی اولیه (دلار)
            </label>
            <input
              id="pr-capital"
              className="field num"
              dir="ltr"
              inputMode="decimal"
              value={eff.initialCapital}
              onChange={(e) => setProp({ initialCapital: numberOr(e.target.value, eff.initialCapital) })}
            />
          </div>
          <div>
            <span className="label">اندازه‌ی سفارش پیش‌فرض</span>
            <div className="flex gap-2">
              <input
                className="field num w-28"
                aria-label="مقدار"
                dir="ltr"
                inputMode="decimal"
                value={eff.qtyValue}
                onChange={(e) => setProp({ qtyValue: numberOr(e.target.value, eff.qtyValue) })}
              />
              <div className="flex-1">
                <Select
                  compact
                  value={eff.qtyType}
                  onChange={(qtyType) => setProp({ qtyType })}
                  options={[
                    { value: 'fixed', label: 'واحد (قرارداد)', hint: 'در فارکس ۱ لات = ۱۰۰٬۰۰۰ واحد' },
                    { value: 'cash', label: 'دلار' },
                    { value: 'percent_of_equity', label: 'درصد سرمایه' },
                  ]}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="pr-pyr">
              پیرامیدینگ (حداکثر ورود هم‌جهت)
            </label>
            <input
              id="pr-pyr"
              className="field num"
              dir="ltr"
              inputMode="numeric"
              value={eff.pyramiding}
              onChange={(e) => setProp({ pyramiding: Math.max(0, Math.round(numberOr(e.target.value, eff.pyramiding))) })}
            />
          </div>
          <div>
            <span className="label">کمیسیون</span>
            <div className="flex gap-2">
              <input
                className="field num w-28"
                aria-label="کمیسیون"
                dir="ltr"
                inputMode="decimal"
                value={eff.commissionValue}
                onChange={(e) => setProp({ commissionValue: numberOr(e.target.value, eff.commissionValue) })}
              />
              <div className="flex-1">
                <Select
                  compact
                  value={eff.commissionType}
                  onChange={(commissionType) => setProp({ commissionType })}
                  options={[
                    { value: 'percent', label: 'درصد ارزش معامله' },
                    { value: 'cash_per_contract', label: 'دلار برای هر واحد' },
                    { value: 'cash_per_order', label: 'دلار برای هر سفارش' },
                  ]}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="pr-slip">
              لغزش قیمت (تیک)
            </label>
            <input
              id="pr-slip"
              className="field num"
              dir="ltr"
              inputMode="numeric"
              value={eff.slippage}
              onChange={(e) => setProp({ slippage: Math.max(0, numberOr(e.target.value, eff.slippage)) })}
            />
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line/60 px-3 py-2.5">
              <div>
                <p className="text-[13px] font-semibold">دقت درون کندل با کندل‌های ۵ دقیقه‌ای (Bar Magnifier)</p>
                <p className="text-[11px] leading-5 text-muted">
                  حد سود و ضرر داخل هر کندل با ترتیب واقعی حرکت قیمت در کندل‌های ۵ دقیقه‌ای پر می‌شوند، نه با فرض باز → نزدیک‌ترین سقف/کف → بسته.
                </p>
              </div>
              <Toggle checked={!!eff.magnifier} onChange={(magnifier) => setProp({ magnifier })} label="Bar Magnifier" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line/60 px-3 py-2.5">
              <div>
                <p className="text-[13px] font-semibold">اجرای سفارش در بسته شدن کندل</p>
                <p className="text-[11px] leading-5 text-muted">سفارش‌های مارکت همان کندلی که سیگنال داده پر می‌شوند (process_orders_on_close)، نه در باز شدن کندل بعد.</p>
              </div>
              <Toggle checked={!!eff.processOnClose} onChange={(processOnClose) => setProp({ processOnClose })} label="process_orders_on_close" />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
