import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { clearIndicatorDefault, saveIndicatorDefault, savedIndicatorDefault } from '../../chart/indicatorDefaults';
import type { IndicatorConfig } from '../../chart/indicators';
import type { IndicatorDefault } from '../../services/chartPrefs';
import { toast, useStore } from '../../store/useStore';
import { FloatingPanel } from './drawingControls';

/**
 * «قالب» in an indicator's settings: its settings saved as the default for new copies of it (kept with
 * the account, chart/indicatorDefaults), that default put back, or the factory settings.
 */
export function IndicatorTemplate({
  cfg,
  name,
  onApply,
  onFactory,
}: {
  /** the settings as they are in the dialog now */
  cfg: IndicatorConfig;
  name: string;
  onApply: (d: IndicatorDefault) => void;
  onFactory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  // re-read when the saved defaults change
  useStore((s) => s.indicatorDefaults);
  const saved = savedIndicatorDefault(cfg);
  const items = [
    {
      label: 'ذخیره به‌عنوان پیش‌فرض',
      hint: 'این اندیکاتور از این به بعد با همین تنظیمات اضافه می‌شود',
      run: () => {
        saveIndicatorDefault(cfg);
        toast(`پیش‌فرض «${name}» ذخیره شد`);
      },
    },
    ...(saved ? [{ label: 'اعمال پیش‌فرض', hint: 'تنظیمات پیش‌فرض ذخیره‌شده روی همین اندیکاتور', run: () => onApply(saved) }] : []),
    {
      label: 'بازگشت به تنظیمات اولیه',
      hint: saved ? 'پیش‌فرض ذخیره‌شده پاک و تنظیمات کارخانه اعمال می‌شود' : 'تنظیمات کارخانه روی همین اندیکاتور',
      run: () => {
        if (saved) {
          clearIndicatorDefault(cfg);
          toast(`پیش‌فرض «${name}» به حالت اولیه برگشت`);
        }
        onFactory();
      },
    },
  ];
  return (
    <div className="me-auto">
      <button ref={ref} type="button" className="btn-ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        قالب
        <ChevronDown size={14} />
      </button>
      {open && (
        <FloatingPanel anchor={ref} onClose={() => setOpen(false)} className="w-72 p-1">
          {items.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => {
                m.run();
                setOpen(false);
              }}
              className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-start hover:bg-raised"
            >
              <span className="text-[13px] font-semibold">{m.label}</span>
              <span className="text-[11px] text-faint">{m.hint}</span>
            </button>
          ))}
        </FloatingPanel>
      )}
    </div>
  );
}
