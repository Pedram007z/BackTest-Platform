import { TOOL_SPECS, styleOf, type Drawing, type DrawingType } from '../drawings';
import { fibArcs, fibChannel, fibCircles, fibExtension, fibFan, fibRetracement, fibSpiral, fibTime, fibTimeZone, fibWedge, gannBox, gannFan, gannSquare, pitchfan } from './fib';
import { Kit, dist, type Pt, type View } from './kit';
import { channel, crossline, disjoint, flattop, hline, measure, pitchfork, position, rect, regression, text, trendLike, vline } from './lines';
import {
  abcd,
  barsPattern,
  cyclicLines,
  dateRange,
  elliott,
  forecast,
  ghostFeed,
  headShoulders,
  priceRange,
  projection,
  sineLine,
  threeDrives,
  timeCycles,
  trianglePattern,
  xabcd,
} from './patterns';
import {
  anchoredText,
  arc,
  arrowLine,
  arrowMark,
  arrowMarker,
  brush,
  callout,
  circle,
  comment,
  curve,
  ellipse,
  flag,
  note,
  pin,
  polyline,
  priceLabel,
  priceNote,
  rotatedRect,
  signpost,
} from './shapes';

export type { View } from './kit';

const RENDER: Record<DrawingType, (k: Kit) => void> = {
  trend: trendLike,
  ray: trendLike,
  infoline: trendLike,
  extended: trendLike,
  trendangle: trendLike,
  hline,
  hray: hline,
  vline,
  crossline,
  channel,
  regression,
  flattop,
  disjoint,
  pitchfork,
  schiff: pitchfork,
  modschiff: pitchfork,
  insidepitchfork: pitchfork,
  fib: fibRetracement,
  fibext: fibExtension,
  fibchannel: fibChannel,
  fibtimezone: fibTimeZone,
  fibfan: fibFan,
  fibtime: fibTime,
  fibcircles: fibCircles,
  fibspiral: fibSpiral,
  fibarcs: fibArcs,
  fibwedge: fibWedge,
  pitchfan,
  gannbox: gannBox,
  gannsqfixed: gannSquare,
  gannsquare: gannSquare,
  gannfan: gannFan,
  brush,
  highlighter: brush,
  arrowmarker: arrowMarker,
  arrow: arrowLine,
  arrowup: arrowMark,
  arrowdown: arrowMark,
  rect,
  rotrect: rotatedRect,
  path: polyline,
  circle,
  ellipse,
  polyline,
  triangle: polyline,
  arc,
  curve,
  doublecurve: curve,
  text,
  anchoredtext: anchoredText,
  note,
  pricenote: priceNote,
  pin,
  callout,
  comment,
  pricelabel: priceLabel,
  signpost,
  flag,
  xabcd,
  cypher: xabcd,
  headshoulders: headShoulders,
  abcd,
  trianglepattern: trianglePattern,
  threedrives: threeDrives,
  elliott5: elliott,
  elliott3: elliott,
  elliotttriangle: elliott,
  elliottwxy: elliott,
  elliottwxyxz: elliott,
  cycliclines: cyclicLines,
  timecycles: timeCycles,
  sineline: sineLine,
  long: position,
  short: position,
  forecast,
  barspattern: barsPattern,
  ghostfeed: ghostFeed,
  projection,
  daterange: dateRange,
  pricerange: priceRange,
  measure,
};

/** labels and text reach this far beyond a drawing's points */
const MARGIN = 400;

/** whether the drawing spreads beyond its points horizontally (never skipped off-screen) */
function wide(d: Drawing) {
  const s = TOOL_SPECS[d.type];
  if (s.wide) return true;
  return !!s.extend && (!!styleOf(d, 'extendLeft') || !!styleOf(d, 'extendRight'));
}

export interface DrawOpts {
  selected: boolean;
  interactive: boolean;
  /** being drawn (not saved yet) */
  preview?: boolean;
}

/** Draws one drawing into the parent group; skipped when it is far off-screen. */
export function drawDrawing(parent: SVGElement, d: Drawing, v: View, o: DrawOpts) {
  const render = RENDER[d.type];
  if (!render) return;
  let pts: Pt[] = [];
  if (d.type !== 'anchoredtext') {
    pts = new Array<Pt>(d.points.length);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < d.points.length; i++) {
      const p = d.points[i];
      const x = v.x(p.time);
      const y = v.y(p.price);
      if (x === null || y === null) return;
      pts[i] = { x, y };
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (!pts.length) return;
    if (!o.preview && !wide(d)) {
      let reach = MARGIN;
      // circles and ellipses reach a radius beyond their points
      if (d.type === 'circle' || d.type === 'ellipse') reach += dist(pts[0], pts[1]);
      if (maxX < -reach || minX > v.W + reach) return;
    }
  }
  const k = new Kit(parent, d, pts, v, o.selected, o.interactive, !!o.preview);
  render(k);
  k.finish();
}
