import clsx from 'clsx';
import { GripVertical, Pause, Play, StepForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { faDigits } from '../../lib/format';
import { TIMEFRAMES, type Timeframe } from '../../lib/market';
import { Slider } from '../ui/controls';

/** Candles per second for each slider stop. */
export const SPEEDS = [0.5, 1, 2, 3, 5, 8, 12, 20];

interface Props {
  playing: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  speedIndex: number;
  onSpeedIndex: (i: number) => void;
  stepTf: Timeframe;
  onStepTf: (tf: Timeframe) => void;
  disabled: boolean;
}

/**
 * Floating replay controls: drag the grip to move the bar anywhere over the chart.
 * Step shows one more candle; play keeps stepping at the chosen speed.
 */
export function PlaybackBar({ playing, onTogglePlay, onStep, speedIndex, onSpeedIndex, stepTf, onStepTf, disabled }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // keep the bar inside its container when the window or panels resize
  useEffect(() => {
    const clamp = () => {
      const el = bar.current;
      const parent = el?.parentElement;
      if (!el || !parent || !pos) return;
      const maxX = parent.clientWidth - el.offsetWidth - 4;
      const maxY = parent.clientHeight - el.offsetHeight - 4;
      if (pos.x > maxX || pos.y > maxY) setPos({ x: Math.max(4, Math.min(pos.x, maxX)), y: Math.max(4, Math.min(pos.y, maxY)) });
    };
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [pos]);

  const startDrag = (e: React.PointerEvent) => {
    const el = bar.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    e.preventDefault();
    const pr = parent.getBoundingClientRect();
    const br = el.getBoundingClientRect();
    const dx = e.clientX - br.left;
    const dy = e.clientY - br.top;
    const move = (ev: PointerEvent) => {
      const x = Math.max(4, Math.min(ev.clientX - pr.left - dx, pr.width - br.width - 4));
      const y = Math.max(4, Math.min(ev.clientY - pr.top - dy, pr.height - br.height - 4));
      setPos({ x, y });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const speed = SPEEDS[speedIndex];
  return (
    <div
      ref={bar}
      dir="rtl"
      className="absolute z-20 flex items-center gap-1.5 rounded-2xl border border-line bg-surface/95 p-1.5 shadow-pop backdrop-blur"
      style={pos ? { left: pos.x, top: pos.y } : { left: '50%', bottom: 14, transform: 'translateX(-50%)' }}
      role="toolbar"
      aria-label="کنترل پخش"
    >
      <button type="button" onPointerDown={startDrag} className="flex h-8 w-5 cursor-grab items-center justify-center text-faint active:cursor-grabbing" aria-label="جابه‌جا کردن نوار پخش" title="بکشید تا جابه‌جا شود">
        <GripVertical size={16} />
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={disabled}
        className={clsx('flex h-9 w-9 items-center justify-center rounded-xl text-white transition disabled:opacity-40', playing ? 'bg-amber' : 'bg-accent hover:brightness-110')}
        aria-label={playing ? 'توقف پخش خودکار' : 'پخش خودکار'}
        title={playing ? 'توقف (Space)' : 'پخش خودکار (Space)'}
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="-translate-x-[1px]" />}
      </button>
      <button type="button" onClick={onStep} disabled={disabled} className="icon-btn h-9 w-9" aria-label="نمایش کندل بعدی" title="کندل بعدی (→)">
        <StepForward size={18} />
      </button>
      <div className="flex w-36 flex-col px-1.5 sm:w-44">
        <Slider label="سرعت پخش" min={0} max={SPEEDS.length - 1} value={speedIndex} onChange={onSpeedIndex} />
        <span className="num -mt-0.5 text-center text-[10px] text-muted">
          سرعت: {faDigits(speed)} کندل در ثانیه
        </span>
      </div>
      <label className="sr-only" htmlFor="step-tf">
        اندازه هر گام
      </label>
      <select
        id="step-tf"
        value={stepTf}
        onChange={(e) => onStepTf(e.target.value as Timeframe)}
        className="h-9 rounded-xl border border-line bg-raised px-2 text-[12px] font-semibold text-ink outline-none"
        dir="ltr"
        title="اندازه‌ی هر گام"
      >
        {TIMEFRAMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.short}
          </option>
        ))}
      </select>
    </div>
  );
}
