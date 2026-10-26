import clsx from 'clsx';
import { useMemo, useState } from 'react';
import type { IndicatorConfig } from '../../chart/indicators';
import type { IndicatorApi } from '../../chart/lwIndicators';
import { defaultSessionsConfig, isHHMM, sessionMinutes, sessionsFromParams, sessionsToParams, type SessionDef, type SessionsConfig } from '../../chart/sessions';
import { faDigits } from '../../lib/format';
import { allTimeZones, fmtOffset, tzName } from '../../lib/timezone';
import { Modal } from '../ui/Modal';

/** Settings of the «سشن‌ها» indicator on the built-in chart: four sessions, each on or off with its own hours. */
export function SessionsSettings({ api, cfg, onClose }: { api: IndicatorApi; cfg: IndicatorConfig; onClose: () => void }) {
  const [draft, setDraft] = useState<SessionsConfig>(() => sessionsFromParams(cfg.params, cfg.colors));
  const zones = useMemo(() => allTimeZones(), []);
  const setSession = (i: number, p: Partial<SessionDef>) => setDraft((d) => ({ ...d, sessions: d.sessions.map((s, k) => (k === i ? { ...s, ...p } : s)) }));
  const valid = draft.sessions.every((s) => s.name.trim() && isHHMM(s.start) && isHHMM(s.end));
  const hours = (s: SessionDef) => {
    const m = sessionMinutes(s);
    return `${faDigits(String(Math.floor(m / 60)))} ساعت${m % 60 ? ` و ${faDigits(String(m % 60))} دقیقه` : ''}`;
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="سشن‌های معاملاتی (سقف و کف)"
      footer={
        <>
          <button type="button" className="btn-ghost me-auto" onClick={() => setDraft(defaultSessionsConfig())}>
            پیش‌فرض
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!valid}
            onClick={() => {
              const clean = sessionsFromParams(sessionsToParams(draft).params, sessionsToParams(draft).colors);
              api.update({ ...cfg, ...sessionsToParams(clean) });
              onClose();
            }}
          >
            ذخیره
          </button>
        </>
      }
    >
      <p className="mb-3 text-[12px] leading-6 text-muted">
        برای هر روز، جعبه‌ای از اولین تا آخرین کندل سشن کشیده می‌شود؛ لبه‌ی بالا و پایین آن سقف و کف همان سشن است. ساعت‌ها به وقت منطقه‌ی زمانی خود سشن حساب می‌شوند (ساعت تابستانی
        خودکار). روی تایم‌فریم ۱ ساعت و کوچک‌تر دیده می‌شود و فقط از کندل‌هایی که تا الان پخش شده‌اند استفاده می‌کند.
      </p>
      <div className="flex flex-col gap-2">
        {draft.sessions.map((s, i) => (
          <fieldset key={i} className={clsx('rounded-xl border p-3 transition', s.on ? 'border-line bg-raised/40' : 'border-line/60 opacity-70')} data-session-row={i}>
            <legend className="sr-only">سشن {faDigits(String(i + 1))}</legend>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent,#7c5cff)]"
                  checked={s.on}
                  onChange={(e) => setSession(i, { on: e.target.checked })}
                  aria-label={`نمایش سشن ${s.name}`}
                />
                <input
                  type="color"
                  className="h-7 w-8 cursor-pointer rounded border border-line bg-transparent"
                  value={s.color}
                  onChange={(e) => setSession(i, { color: e.target.value })}
                  aria-label={`رنگ سشن ${s.name}`}
                />
              </label>
              <input
                className="field h-9 w-36 py-1 text-[13px]"
                value={s.name}
                maxLength={24}
                onChange={(e) => setSession(i, { name: e.target.value })}
                aria-label={`نام سشن ${i + 1}`}
              />
              <span className="ms-auto text-[11px] text-faint">{hours(s)}</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[auto_auto_1fr]">
              <label className="flex items-center gap-1.5 text-[12px] text-muted">
                شروع
                <input
                  type="time"
                  className="field num h-9 w-[8.5rem] py-1"
                  dir="ltr"
                  value={s.start}
                  onChange={(e) => setSession(i, { start: e.target.value })}
                  aria-label={`شروع سشن ${s.name}`}
                />
              </label>
              <label className="flex items-center gap-1.5 text-[12px] text-muted">
                پایان
                <input
                  type="time"
                  className="field num h-9 w-[8.5rem] py-1"
                  dir="ltr"
                  value={s.end}
                  onChange={(e) => setSession(i, { end: e.target.value })}
                  aria-label={`پایان سشن ${s.name}`}
                />
              </label>
              <label className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
                به وقت
                <select
                  className="field h-9 min-w-0 flex-1 py-1 text-[12px]"
                  value={s.tz}
                  onChange={(e) => setSession(i, { tz: e.target.value })}
                  aria-label={`منطقه‌ی زمانی سشن ${s.name}`}
                >
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {tzName(z)} ({fmtOffset(Date.now(), z)})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={draft.fill} onChange={(e) => setDraft({ ...draft, fill: e.target.checked })} />
          رنگ داخل جعبه‌ها
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={draft.labels} onChange={(e) => setDraft({ ...draft, labels: e.target.checked })} />
          نام سشن بالای جعبه
        </label>
      </div>
    </Modal>
  );
}
