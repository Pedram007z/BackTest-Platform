import { addDays, type DayKey } from './calendar';

/**
 * Days with chart data, as sorted, non-overlapping inclusive ranges of day keys (from the server's
 * GET /api/market/coverage). A session can only use days every one of its symbols has data for.
 */
export type DayRanges = [DayKey, DayKey][];

/** Days in all of the lists. */
export function intersectRanges(lists: DayRanges[]): DayRanges {
  if (!lists.length) return [];
  let acc = lists[0];
  for (const next of lists.slice(1)) {
    const out: DayRanges = [];
    let i = 0;
    let j = 0;
    while (i < acc.length && j < next.length) {
      const lo = acc[i][0] > next[j][0] ? acc[i][0] : next[j][0];
      const hi = acc[i][1] < next[j][1] ? acc[i][1] : next[j][1];
      if (lo <= hi) out.push([lo, hi]);
      if (acc[i][1] < next[j][1]) i++;
      else j++;
    }
    acc = out;
  }
  return acc;
}

/** The range holding `day`, if any. */
export const rangeOf = (ranges: DayRanges, day: DayKey): [DayKey, DayKey] | undefined => ranges.find(([a, b]) => a <= day && day <= b);

export const covered = (ranges: DayRanges, day: DayKey) => !!rangeOf(ranges, day);

/** The first missing stretch inside [from, to], or null when every day there has data. */
export function gapIn(ranges: DayRanges, from: DayKey, to: DayKey): { from: DayKey; to: DayKey } | null {
  const r = rangeOf(ranges, from);
  if (!r) return { from, to: addDays(firstAfter(ranges, from) ?? addDays(to, 1), -1) };
  if (to <= r[1]) return null;
  const after = addDays(r[1], 1);
  return { from: after, to: addDays(firstAfter(ranges, after) ?? addDays(to, 1), -1) };
}

/** The first day with data after `day`. */
function firstAfter(ranges: DayRanges, day: DayKey): DayKey | undefined {
  return ranges.find(([a]) => a > day)?.[0];
}
