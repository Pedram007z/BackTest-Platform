/** Simplified flags for the calendar currencies (drawn, so they look the same on every OS). */
export function Flag({ currency, size = 18 }: { currency: string; size?: number }) {
  const w = size;
  const h = Math.round(size * 0.7);
  const body = (() => {
    switch (currency) {
      case 'USD':
        return (
          <>
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} y={(i * 2 * 14) / 13} width="20" height={14 / 13} fill="#b22234" />
            ))}
            <rect width="20" height="14" fill="#fff" opacity="0" />
            <rect width="9" height={(14 * 7) / 13} fill="#3c3b6e" />
          </>
        );
      case 'EUR':
        return (
          <>
            <rect width="20" height="14" fill="#003399" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <circle key={i} cx={10 + Math.cos(a) * 4} cy={7 + Math.sin(a) * 4} r="0.7" fill="#ffcc00" />;
            })}
          </>
        );
      case 'GBP':
        return (
          <>
            <rect width="20" height="14" fill="#012169" />
            <path d="M0 0L20 14M20 0L0 14" stroke="#fff" strokeWidth="2.6" />
            <path d="M0 0L20 14M20 0L0 14" stroke="#c8102e" strokeWidth="1" />
            <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4" />
            <path d="M10 0V14M0 7H20" stroke="#c8102e" strokeWidth="2.2" />
          </>
        );
      case 'JPY':
        return (
          <>
            <rect width="20" height="14" fill="#fff" />
            <circle cx="10" cy="7" r="3.8" fill="#bc002d" />
          </>
        );
      case 'CHF':
        return (
          <>
            <rect width="20" height="14" fill="#d52b1e" />
            <path d="M10 3.2V10.8M6.2 7H13.8" stroke="#fff" strokeWidth="2.4" />
          </>
        );
      case 'CAD':
        return (
          <>
            <rect width="20" height="14" fill="#fff" />
            <rect width="5" height="14" fill="#d52b1e" />
            <rect x="15" width="5" height="14" fill="#d52b1e" />
            <path d="M10 3.5l1 2 1.6-.6-.6 2.4 1.4.2-3.4 2.8-3.4-2.8 1.4-.2-.6-2.4 1.6.6z" fill="#d52b1e" />
          </>
        );
      case 'AUD':
      case 'NZD':
        return (
          <>
            <rect width="20" height="14" fill="#012169" />
            <path d="M0 0L9 7M9 0L0 7" stroke="#fff" strokeWidth="1.4" />
            <path d="M4.5 0V7M0 3.5H9" stroke="#fff" strokeWidth="2" />
            <path d="M4.5 0V7M0 3.5H9" stroke="#c8102e" strokeWidth="1" />
            {(currency === 'AUD'
              ? [
                  [15, 3],
                  [13, 7],
                  [17, 8],
                  [15, 11.5],
                  [5, 11],
                ]
              : [
                  [15, 3],
                  [13, 7],
                  [17, 7.5],
                  [15, 11],
                ]
            ).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="0.9" fill={currency === 'NZD' ? '#c8102e' : '#fff'} stroke="#fff" strokeWidth="0.3" />
            ))}
          </>
        );
      case 'CNY':
        return (
          <>
            <rect width="20" height="14" fill="#de2910" />
            <path d="M4 2.2l.7 2 2.1.1-1.7 1.2.6 2-1.7-1.2-1.7 1.2.6-2-1.7-1.2 2.1-.1z" fill="#ffde00" />
          </>
        );
      default:
        return <rect width="20" height="14" fill="rgb(var(--raised))" />;
    }
  })();
  return (
    <svg width={w} height={h} viewBox="0 0 20 14" className="shrink-0 rounded-[3px] ring-1 ring-black/20" aria-hidden="true">
      {currency === 'USD' && <rect width="20" height="14" fill="#fff" />}
      {body}
    </svg>
  );
}
