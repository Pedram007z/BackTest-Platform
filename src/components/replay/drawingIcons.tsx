import type { ReactNode } from 'react';
import type { DrawingType } from '../../chart/drawings';

/** Line icons of the drawing tools, in TradingView's spirit (28×28 grid, current colour). */

const S = {
  width: 22,
  height: 22,
  viewBox: '0 0 28 28',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const dot = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={2.4} fill="currentColor" stroke="none" />;
const dash = { strokeDasharray: '2 3', opacity: 0.6 };
const soft = { fill: 'currentColor', fillOpacity: 0.18 };

const ICONS: Record<DrawingType, ReactNode> = {
  // ----- lines -----
  trend: (
    <>
      <path d="M6 22 22 6" />
      {dot(6, 22)}
      {dot(22, 6)}
    </>
  ),
  ray: (
    <>
      <path d="M6 22 24 4" />
      {dot(6, 22)}
      {dot(14, 14)}
    </>
  ),
  infoline: (
    <>
      <path d="M6 22 22 10" />
      {dot(6, 22)}
      {dot(22, 10)}
      <rect x={4} y={4} width={11} height={7} rx={1.5} />
    </>
  ),
  extended: (
    <>
      <path d="M2 26 26 2" />
      {dot(10, 18)}
      {dot(18, 10)}
    </>
  ),
  trendangle: (
    <>
      <path d="M5 22 23 8M5 22h18" />
      <path d="M14 22a9 9 0 0 0-2-5.5" />
      {dot(5, 22)}
      {dot(23, 8)}
    </>
  ),
  hline: (
    <>
      <path d="M3 14h22" />
      {dot(14, 14)}
    </>
  ),
  hray: (
    <>
      <path d="M8 14h17" />
      {dot(8, 14)}
    </>
  ),
  vline: (
    <>
      <path d="M14 3v22" />
      {dot(14, 14)}
    </>
  ),
  crossline: (
    <>
      <path d="M3 14h22M14 3v22" />
      {dot(14, 14)}
    </>
  ),
  // ----- channels -----
  channel: (
    <>
      <path d="M4 17 18 5M10 23 24 11" />
      <path d="M7 20 21 8" {...dash} />
    </>
  ),
  regression: (
    <>
      <path d="M4 14 24 6M4 22 24 14" />
      <path d="M4 18 24 10" {...dash} />
    </>
  ),
  flattop: (
    <>
      <path d="M4 7h20M4 22 24 13" />
      {dot(4, 22)}
      {dot(24, 13)}
    </>
  ),
  disjoint: (
    <>
      <path d="M4 6 24 11M4 22 24 16" />
      {dot(4, 6)}
      {dot(4, 22)}
    </>
  ),
  pitchfork: (
    <>
      <path d="M4 24 13 15M10 8 16 21M10 8 25 3M13 15 26 10M16 21 26 17" />
      {dot(4, 24)}
    </>
  ),
  schiff: (
    <>
      <path d="M10 8 16 21M10 8 25 3M13 15 26 10M16 21 26 17" />
      <path d="M4 24 13 15" {...dash} />
      {dot(4, 24)}
    </>
  ),
  modschiff: (
    <>
      <path d="M7 16 13 15M10 8 16 21M10 8 25 3M13 15 26 10M16 21 26 17" />
      {dot(7, 16)}
    </>
  ),
  insidepitchfork: (
    <>
      <path d="M4 22 14 14M11 10 16 18M14 14 26 8M11 10 24 4M16 18 26 13" />
      {dot(4, 22)}
    </>
  ),
  // ----- fibonacci -----
  fib: (
    <>
      <path d="M4 6h20M4 11h20M4 16h20M4 22h20" />
      <path d="M6 22 22 6" {...dash} />
    </>
  ),
  fibext: (
    <>
      <path d="M12 5h13M12 10h13M12 15h13" />
      <path d="M3 24 8 12 12 19" {...dash} />
      {dot(3, 24)}
      {dot(8, 12)}
      {dot(12, 19)}
    </>
  ),
  fibchannel: <path d="M4 13 24 5M4 18 24 10M4 24 24 16" />,
  fibtimezone: <path d="M4 4v20M6.5 4v20M10 4v20M15 4v20M23 4v20" />,
  fibfan: <path d="M4 24 24 4M4 24 24 11M4 24 24 18M4 24 17 4M4 24 10 4" />,
  fibtime: (
    <>
      <path d="M13 4v20M17 4v20M24 4v20" />
      <path d="M3 20 6 10 10 16" {...dash} />
    </>
  ),
  fibcircles: (
    <>
      <circle cx={14} cy={14} r={3.5} />
      <circle cx={14} cy={14} r={7} />
      <circle cx={14} cy={14} r={11} />
    </>
  ),
  fibspiral: <path d="M14 14a2 2 0 0 1 3 1.5 4 4 0 0 1-4.5 4.3 6.5 6.5 0 0 1-6-7.2A10 10 0 0 1 17.5 4.4 12 12 0 0 1 25.8 18" />,
  fibarcs: (
    <>
      <path d="M2 22a12 12 0 0 1 24 0M6.5 22a7.5 7.5 0 0 1 15 0M10.5 22a3.5 3.5 0 0 1 7 0" />
      <path d="M14 22 24 6" {...dash} />
    </>
  ),
  fibwedge: (
    <>
      <path d="M4 22 25 5M4 22h22" />
      <path d="M13.5 22a9.5 9.5 0 0 0-2-6M19.5 22a15.5 15.5 0 0 0-3.2-9.8" />
    </>
  ),
  pitchfan: (
    <>
      <path d="M4 24 20 4M4 24 23 10M4 24 25 17M20 4 25 17" />
      {dot(4, 24)}
    </>
  ),
  // ----- gann -----
  gannbox: (
    <>
      <rect x={4} y={5} width={20} height={18} />
      <path d="M4 11h20M4 17h20M11 5v18M17 5v18" opacity={0.7} />
    </>
  ),
  gannsqfixed: (
    <>
      <rect x={5} y={5} width={18} height={18} />
      <path d="M5 23 23 5M5 23a12 12 0 0 1 12-12" opacity={0.8} />
    </>
  ),
  gannsquare: (
    <>
      <rect x={5} y={5} width={18} height={18} />
      <path d="M5 23 23 5M5 23 23 14M5 23 14 5" opacity={0.8} />
    </>
  ),
  gannfan: <path d="M4 24 24 4M4 24 24 14M4 24 14 4M4 24 25 20M4 24 8 3" />,
  // ----- shapes -----
  brush: <path d="M4 20c4-11 7 6 11-5s6-5 9-3" strokeWidth={2} />,
  highlighter: (
    <>
      <path d="M4 18c5-4 10-4 20-6" strokeWidth={5} opacity={0.4} />
      <path d="M17 4 24 11 15 20 8 13Z" />
    </>
  ),
  arrowmarker: <path d="M5 21 17 9l-3-3h9v9l-3-3L8 24Z" {...soft} />,
  arrow: <path d="M6 22 22 6M13 6h9v9" />,
  arrowup: <path d="M14 4 22 13h-5v11h-6V13H6Z" {...soft} />,
  arrowdown: <path d="M14 24 22 15h-5V4h-6v11H6Z" {...soft} />,
  rect: (
    <>
      <rect x={6} y={8} width={16} height={12} rx={1} />
      {dot(6, 8)}
      {dot(22, 20)}
    </>
  ),
  rotrect: <path d="M10 3 25 10 18 25 3 18Z" />,
  path: (
    <>
      <path d="M4 22 10 11 16 18 23 6" />
      <path d="M17 6h6v6" />
    </>
  ),
  circle: <circle cx={14} cy={14} r={9} />,
  ellipse: <ellipse cx={14} cy={14} rx={11} ry={7} />,
  polyline: <path d="M5 20 9 6 22 9 24 21 13 24Z" />,
  triangle: <path d="M14 5 24 22H4Z" />,
  arc: <path d="M4 20Q14 2 24 20Z" {...soft} />,
  curve: <path d="M4 21Q14 0 24 21" />,
  doublecurve: <path d="M3 16C10 0 18 28 25 12" />,
  // ----- annotations -----
  text: <path d="M7 7h14M14 7v15M11 22h6" />,
  anchoredtext: (
    <>
      <rect x={3} y={3} width={22} height={22} rx={3} strokeDasharray="3 2.5" opacity={0.7} />
      <path d="M9 9h10M14 9v11" />
    </>
  ),
  note: (
    <>
      <rect x={6} y={4} width={16} height={18} rx={2} />
      <path d="M10 10h8M10 14h8M10 18h4" />
    </>
  ),
  pricenote: (
    <>
      <path d="M6 20 14 12" />
      {dot(6, 20)}
      <rect x={14} y={7} width={11} height={8} rx={1.5} />
    </>
  ),
  pin: (
    <>
      <path d="M14 25c-4-6-8-9-8-14a8 8 0 0 1 16 0c0 5-4 8-8 14Z" />
      <circle cx={14} cy={11} r={2.5} />
    </>
  ),
  callout: <path d="M5 5h18v12H13l-6 6v-6H5Z" />,
  comment: (
    <>
      <path d="M6 20a9 8 0 1 1 4 2l-5 2Z" />
    </>
  ),
  pricelabel: <path d="M4 14 10 7h14v14H10Z" />,
  signpost: (
    <>
      <path d="M14 25V12" />
      <rect x={6} y={4} width={16} height={8} rx={2} />
    </>
  ),
  flag: <path d="M7 25V4M7 5h14l-4 5 4 5H7" />,
  // ----- patterns -----
  xabcd: (
    <>
      <path d="M3 21 8 6 12 15 18 4 25 22" />
      <path d="M3 21 12 15 8 6Z" {...soft} stroke="none" />
      <path d="M12 15 18 4 25 22Z" {...soft} stroke="none" />
    </>
  ),
  cypher: (
    <>
      <path d="M3 22 9 9 13 15 19 4 25 18" />
      <path d="M3 22 13 15 9 9Z" {...soft} stroke="none" />
    </>
  ),
  headshoulders: (
    <>
      <path d="M2 22 7 13 10 17 14 5 18 17 21 13 26 22" />
      <path d="M4 17h20" {...dash} />
    </>
  ),
  abcd: (
    <>
      <path d="M4 22 11 8 16 16 24 4" />
      {dot(4, 22)}
      {dot(24, 4)}
    </>
  ),
  trianglepattern: (
    <>
      <path d="M3 6 9 21 14 9 18 18 22 12" />
      <path d="M3 6 26 13M9 21 26 14" {...dash} />
    </>
  ),
  threedrives: <path d="M2 24 7 16 9 19 15 10 17 14 24 4 26 8" />,
  elliott5: (
    <>
      <path d="M3 23 8 15 11 19 18 6 21 11 25 4" />
      {dot(18, 6)}
    </>
  ),
  elliott3: (
    <>
      <path d="M4 5 11 18 16 12 24 24" />
      {dot(11, 18)}
    </>
  ),
  elliotttriangle: <path d="M2 6 7 22 12 9 17 19 21 12 25 16" />,
  elliottwxy: (
    <>
      <path d="M4 22 11 9 17 16 24 4" />
      {dot(11, 9)}
      {dot(17, 16)}
    </>
  ),
  elliottwxyxz: <path d="M2 23 7 13 11 18 16 8 20 13 26 4" />,
  cycliclines: <path d="M5 4v20M11 4v20M17 4v20M23 4v20" />,
  timecycles: <path d="M2 20a4 4 0 0 1 8 0 4 4 0 0 1 8 0 4 4 0 0 1 8 0M2 20h24" />,
  sineline: <path d="M2 14c3-8 6-8 8 0s5 8 8 0 5-8 8 0" />,
  // ----- prediction and measurement -----
  long: (
    <>
      <rect x={5} y={4} width={18} height={10} fill="#26c281" fillOpacity={0.35} stroke="none" />
      <rect x={5} y={14} width={18} height={9} fill="#f25466" fillOpacity={0.35} stroke="none" />
      <path d="M5 14h18M14 18v-9M11 12l3-3 3 3" />
    </>
  ),
  short: (
    <>
      <rect x={5} y={4} width={18} height={10} fill="#f25466" fillOpacity={0.35} stroke="none" />
      <rect x={5} y={14} width={18} height={9} fill="#26c281" fillOpacity={0.35} stroke="none" />
      <path d="M5 14h18M14 10v9M11 16l3 3 3-3" />
    </>
  ),
  forecast: (
    <>
      <circle cx={6} cy={20} r={2.5} />
      <path d="M8 18 21 8" {...dash} opacity={1} />
      <path d="M15 8h6v6" />
    </>
  ),
  barspattern: (
    <>
      <path d="M7 5v18M14 8v14M21 4v14" />
      <rect x={5} y={9} width={4} height={9} {...soft} />
      <rect x={12} y={11} width={4} height={6} {...soft} />
      <rect x={19} y={7} width={4} height={7} {...soft} />
    </>
  ),
  ghostfeed: (
    <>
      <path d="M6 8v14M13 6v14M20 4v14" strokeDasharray="2 2" />
      <rect x={4} y={11} width={4} height={7} strokeDasharray="2 2" />
      <rect x={11} y={9} width={4} height={6} strokeDasharray="2 2" />
      <rect x={18} y={7} width={4} height={7} strokeDasharray="2 2" />
    </>
  ),
  projection: (
    <>
      <path d="M4 22 24 8M4 22h20" />
      <path d="M17 22a13 13 0 0 0-2-7.5" {...dash} opacity={1} />
      {dot(4, 22)}
    </>
  ),
  daterange: (
    <>
      <path d="M5 5v18M23 5v18M7 14h14M17 10l4 4-4 4" />
    </>
  ),
  pricerange: (
    <>
      <path d="M5 5h18M5 23h18M14 21V7M10 11l4-4 4 4" />
    </>
  ),
  measure: (
    <>
      <rect x={5} y={6} width={18} height={16} rx={1} strokeDasharray="2 2" />
      <path d="M14 20V8M11 11l3-3 3 3" />
    </>
  ),
};

export function ToolIcon({ id, size = 22 }: { id: DrawingType; size?: number }) {
  return (
    <svg {...S} width={size} height={size}>
      {ICONS[id]}
    </svg>
  );
}
