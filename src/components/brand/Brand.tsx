import clsx from 'clsx';
import { useId, type CSSProperties } from 'react';
import { MARK, WORDMARK } from './paths';

/** The app icon: two rising bars and the play button on the violet tile. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={clsx('shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9273FF" />
          <stop offset="1" stopColor="#5430E6" />
        </linearGradient>
        <radialGradient id={`${id}-hl`} cx="0.22" cy="0.12" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" rx="23.5" fill={`url(#${id}-bg)`} />
      <rect width="100" height="100" rx="23.5" fill={`url(#${id}-hl)`} />
      <path d={MARK.bar1} fill="#FFFFFF" fillOpacity="0.55" />
      <path d={MARK.bar2} fill="#FFFFFF" fillOpacity="0.8" />
      <path d={MARK.play} fill="#FFFFFF" />
    </svg>
  );
}

/** «بک‌تست‌لب» in the custom lettering: «بک‌تست» in the text colour, «لب» in the accent. */
export function BrandWordmark({ height = 24, className, style }: { height?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg
      height={height}
      width={(height * WORDMARK.width) / WORDMARK.height}
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      className={clsx('shrink-0', className)}
      style={style}
      role="img"
      aria-label="بک‌تست‌لب"
    >
      <path d={WORDMARK.ink} fill="currentColor" />
      <path d={WORDMARK.accent} className="fill-accent-ink" />
    </svg>
  );
}

/** Icon size in px; the lettering is sized from it. */
const SIZES = { sm: 26, md: 30, lg: 40 } as const;
/** Height of the letters (top of «ل» to the baseline) as a share of the icon. */
const LETTERS = 0.6;

/** Icon + lettering, icon on the right (RTL). The letters sit centred on the icon; the dots hang below. */
export function Logo({ size = 'md', className }: { size?: keyof typeof SIZES; className?: string }) {
  const icon = SIZES[size];
  const ascent = icon * LETTERS;
  return (
    <div className={clsx('flex select-none items-start gap-2', className)} style={{ height: icon }}>
      <BrandMark size={icon} />
      <BrandWordmark height={(ascent * WORDMARK.height) / WORDMARK.ascent} className="relative" style={{ top: (icon - ascent) / 2 }} />
    </div>
  );
}
