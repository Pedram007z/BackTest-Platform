/** A day of 1-minute bars in the data API's form: a base candle, then per bar the step in bars and the price changes. */
export function toApiCandles(bars: Float64Array, start: number, multiplier: number) {
  const units = (v: number) => Math.round(v / multiplier);
  const out = {
    timestamp: start,
    shift: 60_000,
    multiplier,
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    times: [] as number[],
    opens: [] as number[],
    highs: [] as number[],
    lows: [] as number[],
    closes: [] as number[],
    volumes: [] as number[],
  };
  let prev: number[] | null = null;
  let last = 0;
  for (let j = 0; j < bars.length / 4; j++) {
    if (Number.isNaN(bars[j * 4])) continue;
    const u = [0, 1, 2, 3].map((k) => units(bars[j * 4 + k]));
    if (!prev) {
      [out.open, out.high, out.low, out.close] = u.map((x) => x * multiplier);
      prev = u;
    }
    out.times.push(j - last);
    last = j;
    out.opens.push(u[0] - prev[0]);
    out.highs.push(u[1] - prev[1]);
    out.lows.push(u[2] - prev[2]);
    out.closes.push(u[3] - prev[3]);
    out.volumes.push(1.5);
    prev = u;
  }
  return out;
}
