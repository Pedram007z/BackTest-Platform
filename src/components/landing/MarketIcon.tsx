import { useId, type ReactNode } from 'react';
import type { SymbolInfo } from '../../lib/market';

/**
 * Round icons for the markets section: flags for currencies and countries, coins for metals and
 * crypto, and simple marks for energy. Drawn on a 32 × 32 grid and clipped to a circle.
 */

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.4 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const UNION_JACK = (
  <>
    <rect width="32" height="32" fill="#012169" />
    <path d="M0 0L32 32M32 0L0 32" stroke="#fff" strokeWidth="6.4" />
    <path d="M0 0L32 32M32 0L0 32" stroke="#C8102E" strokeWidth="2.2" />
    <path d="M16 0V32M0 16H32" stroke="#fff" strokeWidth="8" />
    <path d="M16 0V32M0 16H32" stroke="#C8102E" strokeWidth="4.4" />
  </>
);

const vertical = (a: string, b: string, c: string) => (
  <>
    <rect width="11" height="32" fill={a} />
    <rect x="10.67" width="10.67" height="32" fill={b} />
    <rect x="21.33" width="10.67" height="32" fill={c} />
  </>
);

const FLAGS: Record<string, ReactNode> = {
  US: (
    <>
      <rect width="32" height="32" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 4.92} width="32" height="2.46" fill="#B22234" />
      ))}
      <rect width="16" height="17.2" fill="#3C3B6E" />
      {[3, 8, 13].flatMap((x) => [3.5, 8.5, 13.5].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#fff" />))}
    </>
  ),
  EU: (
    <>
      <rect width="32" height="32" fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <polygon key={i} points={star(16 + 8.5 * Math.cos(a), 16 + 8.5 * Math.sin(a), 1.7)} fill="#FFCC00" />;
      })}
    </>
  ),
  GB: UNION_JACK,
  JP: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <circle cx="16" cy="16" r="7.5" fill="#BC002D" />
    </>
  ),
  CH: (
    <>
      <rect width="32" height="32" fill="#DA291C" />
      <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#fff" />
    </>
  ),
  CA: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <rect width="8" height="32" fill="#D52B1E" />
      <rect x="24" width="8" height="32" fill="#D52B1E" />
      <path
        d="M16 8.5l1.5 2.8 1.7-.9-.6 3.6 2.3-2.1.5 1.5 2.2-.4-.8 2.7 1 .6-4 3.2.4 1.5-3.4-.5V23h-1.6v-2.5l-3.4.5.4-1.5-4-3.2 1-.6-.8-2.7 2.2.4.5-1.5 2.3 2.1-.6-3.6 1.7.9z"
        fill="#D52B1E"
      />
    </>
  ),
  AU: (
    <>
      <rect width="32" height="32" fill="#012169" />
      <g transform="scale(.5)">{UNION_JACK}</g>
      <polygon points={star(8, 24.5, 3)} fill="#fff" />
      {[
        [24, 7, 1.7],
        [19.5, 14, 1.7],
        [27.5, 12.5, 1.7],
        [24, 25, 1.9],
        [25.5, 17.5, 1],
      ].map(([x, y, r]) => (
        <polygon key={`${x}${y}`} points={star(x, y, r)} fill="#fff" />
      ))}
    </>
  ),
  NZ: (
    <>
      <rect width="32" height="32" fill="#012169" />
      <g transform="scale(.5)">{UNION_JACK}</g>
      {[
        [24, 7, 2],
        [19.5, 14, 1.8],
        [27.5, 12.5, 1.8],
        [24, 25, 2.2],
      ].map(([x, y, r]) => (
        <polygon key={`${x}${y}`} points={star(x, y, r)} fill="#C8102E" stroke="#fff" strokeWidth=".6" />
      ))}
    </>
  ),
  TR: (
    <>
      <rect width="32" height="32" fill="#E30A17" />
      <circle cx="13" cy="16" r="7" fill="#fff" />
      <circle cx="14.8" cy="16" r="5.6" fill="#E30A17" />
      <polygon points={star(21.5, 16, 2.8)} fill="#fff" transform="rotate(-18 21.5 16)" />
    </>
  ),
  ZA: (
    <>
      <rect width="32" height="16" fill="#E03C31" />
      <rect y="16" width="32" height="16" fill="#001489" />
      <path d="M0 0L13 16L0 32M13 16H32" stroke="#fff" strokeWidth="10" fill="none" />
      <path d="M0 0L13 16L0 32M13 16H32" stroke="#007749" strokeWidth="6" fill="none" />
      <polygon points="0,6 9,16 0,26" fill="#FFB81C" />
      <polygon points="0,8.6 6.8,16 0,23.4" fill="#000" />
    </>
  ),
  MX: (
    <>
      {vertical('#006847', '#fff', '#CE1126')}
      <circle cx="16" cy="16" r="2.6" fill="#8C5A2B" />
    </>
  ),
  SE: (
    <>
      <rect width="32" height="32" fill="#006AA7" />
      <path d="M9 0h5v13.5h18v5H14V32H9V18.5H0v-5h9z" fill="#FECC00" />
    </>
  ),
  NO: (
    <>
      <rect width="32" height="32" fill="#BA0C2F" />
      <path d="M8 0h8v12h16v8H16v12H8V20H0v-8h8z" fill="#fff" />
      <path d="M10 0h4v14h18v4H14v14h-4V18H0v-4h10z" fill="#00205B" />
    </>
  ),
  SG: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <rect width="32" height="16" fill="#EF3340" />
      <circle cx="10" cy="8.5" r="5" fill="#fff" />
      <circle cx="12" cy="8.5" r="4.6" fill="#EF3340" />
      {[
        [15.5, 5],
        [18.5, 7.2],
        [17.4, 10.6],
        [13.6, 10.6],
        [12.5, 7.2],
      ].map(([x, y]) => (
        <polygon key={`${x}${y}`} points={star(x + 1, y, 1.1)} fill="#fff" />
      ))}
    </>
  ),
  HK: (
    <>
      <rect width="32" height="32" fill="#DE2910" />
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse key={i} cx="16" cy="10.8" rx="2.7" ry="5" fill="#fff" transform={`rotate(${i * 72} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="1.2" fill="#DE2910" />
    </>
  ),
  PL: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <rect y="16" width="32" height="16" fill="#DC143C" />
    </>
  ),
  CN: (
    <>
      <rect width="32" height="32" fill="#DE2910" />
      <polygon points={star(10, 11, 5)} fill="#FFDE00" />
      {[
        [17, 5],
        [20, 8.5],
        [20, 13],
        [17, 16.5],
      ].map(([x, y]) => (
        <polygon key={`${x}${y}`} points={star(x, y, 1.6)} fill="#FFDE00" />
      ))}
    </>
  ),
  DE: (
    <>
      <rect width="32" height="11" fill="#000" />
      <rect y="10.67" width="32" height="11" fill="#DD0000" />
      <rect y="21.33" width="32" height="10.67" fill="#FFCE00" />
    </>
  ),
  FR: vertical('#002395', '#fff', '#ED2939'),
};

/** Currency → the flag it is shown with. */
const CURRENCY_FLAG: Record<string, string> = {
  USD: 'US',
  EUR: 'EU',
  GBP: 'GB',
  JPY: 'JP',
  CHF: 'CH',
  CAD: 'CA',
  AUD: 'AU',
  NZD: 'NZ',
  TRY: 'TR',
  ZAR: 'ZA',
  MXN: 'MX',
  SEK: 'SE',
  NOK: 'NO',
  SGD: 'SG',
  HKD: 'HK',
  PLN: 'PL',
  CNH: 'CN',
};

const INDEX_FLAG: Record<string, string> = { GER40: 'DE', UK100: 'GB', FRA40: 'FR', EU50: 'EU', JPN225: 'JP', AUS200: 'AU', HK50: 'HK' };

const coin = (bg: string, mark: ReactNode) => (
  <>
    <rect width="32" height="32" fill={bg} />
    {mark}
  </>
);

const metal = (light: string, dark: string, text: string, ink: string) => (id: string) => (
  <>
    <defs>
      <radialGradient id={id} cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor={light} />
        <stop offset="1" stopColor={dark} />
      </radialGradient>
    </defs>
    <rect width="32" height="32" fill={`url(#${id})`} />
    <circle cx="16" cy="16" r="12.5" fill="none" stroke={ink} strokeOpacity=".25" />
    <text x="16" y="20.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="12" fill={ink}>
      {text}
    </text>
  </>
);

const drop = (bg: string, fill: string) => coin(bg, <path d="M16 6.5c3.6 5 6.3 8.6 6.3 12a6.3 6.3 0 0 1-12.6 0c0-3.4 2.7-7 6.3-12z" fill={fill} />);

const MARKS: Record<string, (id: string) => ReactNode> = {
  XAUUSD: metal('#FBE7A1', '#C08A12', 'Au', '#5C3D00'),
  XAGUSD: metal('#F4F6F8', '#8E98A3', 'Ag', '#323A44'),
  XPTUSD: metal('#EDEDF0', '#7D8590', 'Pt', '#2B3038'),
  USOIL: () => drop('#F5A623', '#1B1B1F'),
  UKOIL: () => drop('#14B8A6', '#0B2E2A'),
  NGAS: () =>
    coin(
      '#E8F1FF',
      <>
        <path d="M16 6c1 3.4 5.8 6.3 5.8 11.4a5.8 5.8 0 0 1-11.6 0c0-2.6 1.4-4.3 2.6-5.6.2 1.8 1 2.9 2 3.4-.4-3.2.1-6.3 1.2-9.2z" fill="#2F6BFF" />
        <path d="M16 15.5c1.6 1.8 2.6 3 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.6 1-2.8 2.6-4.6z" fill="#9CC0FF" />
      </>,
    ),
  BTCUSD: () =>
    coin(
      '#F7931A',
      <>
        <path d="M14 8.5v2M17.5 8.5v2M14 21.5v2M17.5 21.5v2" stroke="#fff" strokeWidth="1.6" />
        <text x="16.2" y="21" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="14" fill="#fff" transform="rotate(12 16 16)">
          B
        </text>
      </>,
    ),
  ETHUSD: () =>
    coin(
      '#627EEA',
      <>
        <polygon points="16,5.5 22.5,16.3 16,20 9.5,16.3" fill="#fff" />
        <polygon points="16,21.4 22.5,17.7 16,26.5 9.5,17.7" fill="#fff" fillOpacity=".8" />
      </>,
    ),
  BNBUSD: () =>
    coin(
      '#F3BA2F',
      <>
        <rect x="13" y="13" width="6" height="6" fill="#fff" transform="rotate(45 16 16)" />
        {[
          [16, 8.6],
          [23.4, 16],
          [16, 23.4],
          [8.6, 16],
        ].map(([x, y]) => (
          <rect key={`${x}${y}`} x={x - 1.8} y={y - 1.8} width="3.6" height="3.6" fill="#fff" transform={`rotate(45 ${x} ${y})`} />
        ))}
      </>,
    ),
  SOLUSD: (id) =>
    coin(
      '#121218',
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
        {[10, 15, 20].map((y, i) => (
          <path key={y} d={i === 1 ? `M8.5 ${y}h13l2 2.6h-13z` : `M10.5 ${y}h13l-2 2.6h-13z`} fill={`url(#${id})`} />
        ))}
      </>,
    ),
  XRPUSD: () =>
    coin(
      '#23292F',
      <path d="M9.5 9.5l4.2 4.2a3.2 3.2 0 0 0 4.6 0l4.2-4.2M9.5 22.5l4.2-4.2a3.2 3.2 0 0 1 4.6 0l4.2 4.2" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />,
    ),
  ADAUSD: () =>
    coin(
      '#0033AD',
      <>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3;
          return <circle key={i} cx={16 + 6.5 * Math.cos(a)} cy={16 + 6.5 * Math.sin(a)} r="1.7" fill="#fff" />;
        })}
        <circle cx="16" cy="16" r="2.4" fill="#fff" />
      </>,
    ),
  DOGEUSD: () =>
    coin(
      '#C2A633',
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="14" fill="#fff">
        D
      </text>,
    ),
  LTCUSD: () => coin('#345D9D', <path d="M14 8.5V22.5H22M10.5 17.5l7-3.2" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinejoin="round" />),
  DOTUSD: () =>
    coin(
      '#E6007A',
      <>
        <ellipse cx="16" cy="9.3" rx="3.6" ry="2.2" fill="#fff" />
        <ellipse cx="16" cy="22.7" rx="3.6" ry="2.2" fill="#fff" />
        {[60, 120, 240, 300].map((d) => (
          <ellipse key={d} cx="16" cy="9.3" rx="3.6" ry="2.2" fill="#fff" transform={`rotate(${d} 16 16)`} />
        ))}
      </>,
    ),
  AVAXUSD: () => coin('#E84142', <path d="M16 8.5l7.5 13.5h-5l-2.5-4.6-2.5 4.6h-5z" fill="#fff" />),
  LINKUSD: () => coin('#2A5ADA', <polygon points="16,8 22.9,12 22.9,20 16,24 9.1,20 9.1,12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />),
  TRXUSD: () => coin('#EB0029', <path d="M9 9.5l14 3-8 11.5zM9 9.5l6 14.5M23 12.5l-8 2" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />),
};

function Round({ size, children, ring }: { size: number; children: ReactNode; ring?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={ring ? 'rounded-full ring-2 ring-surface' : 'rounded-full'}>
      <defs>
        <clipPath id={`c${id}`}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>{children}</g>
      <circle cx="16" cy="16" r="15.6" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth=".8" />
    </svg>
  );
}

function Mark({ symbol, size, ring }: { symbol: string; size: number; ring?: boolean }) {
  const id = `m${useId().replace(/:/g, '')}`;
  return (
    <Round size={size} ring={ring}>
      {MARKS[symbol](id)}
    </Round>
  );
}

const Flag = ({ code, size, ring }: { code: string; size: number; ring?: boolean }) => (
  <Round size={size} ring={ring}>
    {FLAGS[code] ?? FLAGS.US}
  </Round>
);

/** The symbol's icon: two overlapping flags for a currency pair, the asset over its quote currency otherwise. */
export function MarketIcon({ symbol }: { symbol: SymbolInfo }) {
  const pair = (front: ReactNode, back: ReactNode) => (
    <span className="relative block h-10 w-10 shrink-0" dir="ltr">
      <span className="absolute bottom-0 right-0">{back}</span>
      <span className="absolute left-0 top-0">{front}</span>
    </span>
  );
  if (symbol.group === 'forex') {
    const [base, quote] = symbol.currencies;
    return pair(<Flag code={CURRENCY_FLAG[base]} size={28} ring />, <Flag code={CURRENCY_FLAG[quote]} size={22} />);
  }
  if (symbol.group === 'index') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
        <Flag code={INDEX_FLAG[symbol.id] ?? 'US'} size={34} />
      </span>
    );
  }
  if (!MARKS[symbol.id]) return pair(<Flag code="US" size={28} ring />, null);
  return pair(<Mark symbol={symbol.id} size={28} ring />, <Flag code={CURRENCY_FLAG[symbol.quote] ?? 'US'} size={20} />);
}
