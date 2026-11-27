import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';
import { cleanPatch } from '../../src/services/workspace';
import { lookChanges, lookOfLayout, parseColor, withLookChanges } from '../../src/chart/tvLook';
import { defaultChartStyle, resolveChartStyle } from '../../src/chart/style';

let s: Awaited<ReturnType<typeof startServer>>;
before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
});
after(() => s.stop());

// ---------- what the server keeps ----------

test('TradingView settings: every library setting is kept (favorites apart), within limits', () => {
  const tool = JSON.stringify({ linecolor: '#ff0000', linewidth: 3 });
  const p = cleanPatch({
    prefs: {
      tvSettings: {
        linetooltrendline: tool,
        'chartproperties.mainSeriesProperties': '{"candleStyle":{"upColor":"#089981"}}',
        'chart.favoriteDrawings': '["LineToolTrendLine"]',
        'bad\nkey': 'x',
        __proto__: 'x',
        big: 'x'.repeat(100_001),
        number: 42,
      },
    },
  });
  assert.deepEqual(p.prefs?.tvSettings, { linetooltrendline: tool, 'chartproperties.mainSeriesProperties': '{"candleStyle":{"upColor":"#089981"}}' });
  assert.equal(cleanPatch({ prefs: { tvSettings: 'x' } }).prefs, undefined);
});

test('drawing and indicator defaults, and the replay chart options: only known shapes are kept', () => {
  const p = cleanPatch({
    prefs: {
      drawDefaults: {
        trend: { color: '#2962ff', width: 2, style: { dash: 'dashed', extendRight: true, fontSize: 14 } },
        fib: { color: '#787b86', width: 1, style: {}, levels: [{ value: 0.618, color: '#089981', visible: true }] },
        rect: { color: '#9c27b0', width: 'thick', style: {} },
        __proto__: { color: '#000000', width: 1, style: {} },
        'Not A Tool': { color: '#000000', width: 1, style: {} },
      },
      indicatorDefaults: {
        ema: { params: { length: 50, source: 'close', evil: { x: 1 } }, colors: { value: '#ff9800' } },
        lib_supertrend: { params: {}, colors: {}, inputs: { atrLength: 7, factor: 2.5, showSignals: false } },
        rsi: { params: 'x', colors: {} },
      },
      chartPrefs: {
        magnet: true,
        stay: 'yes',
        lockAll: true,
        speed: 99,
        risk: 0.01,
        history: false,
        engine: 'tradingview',
        favBar: { x: 2, y: 0.3, hidden: true },
        playBar: { x: 120.4, y: 40 },
        groupTools: { lines: 'ray', fib: 'Bad Tool', __proto__: 'x' },
        tester: { scriptId: 'pine_abc12', from: '2024-01-01', to: 'tomorrow' },
        extra: 1,
      },
    },
  });
  assert.deepEqual(p.prefs?.drawDefaults, {
    trend: { color: '#2962ff', width: 2, style: { dash: 'dashed', extendRight: true, fontSize: 14 } },
    fib: { color: '#787b86', width: 1, style: {}, levels: [{ value: 0.618, color: '#089981', visible: true }] },
  });
  assert.deepEqual(p.prefs?.indicatorDefaults, {
    ema: { params: { length: 50, source: 'close' }, colors: { value: '#ff9800' } },
    lib_supertrend: { params: {}, colors: {}, inputs: { atrLength: 7, factor: 2.5, showSignals: false } },
  });
  assert.deepEqual(p.prefs?.chartPrefs, {
    magnet: true,
    lockAll: true,
    history: false,
    speed: 7,
    risk: 0.1,
    favBar: { x: 1, y: 0.3, hidden: true },
    playBar: { x: 120, y: 40 },
    groupTools: { lines: 'ray' },
    tester: { scriptId: 'pine_abc12', from: '2024-01-01' },
  });
});

test('chart settings stay after signing out and in, and on another device', async () => {
  const first = await s.signIn('09130000077', 'نگار');
  const prefs = {
    chartStyle: { upColor: '#00897b', downColor: '#e53935', body: false },
    tvSettings: { linetoolhorzline: '{"linecolor":"#ff9800"}' },
    drawDefaults: { trend: { color: '#ff9800', width: 3, style: { dash: 'dotted' } } },
    indicatorDefaults: { ema: { params: { length: 200 }, colors: { value: '#2962ff' } } },
    chartPrefs: { magnet: true, speed: 5, risk: 2, engine: 'lightweight', history: false },
  };
  const put = await s.call('POST', '/api/me/workspace', { baseRev: 0, pid: 'pid_chart_prefs1', patch: { prefs } }, first.token);
  assert.equal(put.status, 200);
  assert.equal((await s.call('POST', '/api/auth/logout', {}, first.token)).status < 300, true);

  // signed in again (or on a phone): everything is there
  const again = await s.signIn('09130000077', 'نگار');
  const got = await s.call('GET', '/api/me/workspace', undefined, again.token);
  assert.equal(got.status, 200);
  for (const [k, v] of Object.entries(prefs)) assert.deepEqual(got.data.data.prefs[k], v, k);
});

// ---------- colours changed in TradingView's own settings dialog ----------

test('colours: the forms the library writes are read as #rrggbb and an opacity', () => {
  assert.deepEqual(parseColor('#089981'), { hex: '#089981', alpha: 1 });
  assert.deepEqual(parseColor('#F23645'), { hex: '#f23645', alpha: 1 });
  assert.deepEqual(parseColor('#abc'), { hex: '#aabbcc', alpha: 1 });
  assert.deepEqual(parseColor('rgba(42, 46, 57, 0.06)'), { hex: '#2a2e39', alpha: 0.06 });
  assert.deepEqual(parseColor('rgb(255,0,0)'), { hex: '#ff0000', alpha: 1 });
  assert.equal(parseColor('red'), null);
  assert.equal(parseColor(undefined), null);
});

/** A saved layout in the library's shape, with the given main series candle style and chart properties. */
const layout = (candleStyle: object, chartProperties: object) => ({
  charts: [
    {
      panes: [
        {
          sources: [
            { type: 'Study', state: {} },
            { type: 'MainSeries', state: { style: 1, candleStyle } },
          ],
        },
      ],
      chartProperties,
    },
  ],
});

test('a layout the dialog changed: its colours, compared with the ones applied', () => {
  const applied = resolveChartStyle('dark', {});
  const seen = lookOfLayout(
    layout(
      {
        upColor: '#FF9800',
        downColor: applied.downColor,
        drawBody: true,
        drawBorder: false,
        drawWick: true,
        borderUpColor: applied.borderUpColor,
        wickUpColor: applied.wickUpColor,
      },
      {
        paneProperties: {
          backgroundType: 'solid',
          background: '#101010',
          vertGridProperties: { color: 'rgba(0,0,0,0)' },
          horzGridProperties: { color: 'rgba(0,0,0,0)' },
          crossHairProperties: { color: applied.crosshairColor },
        },
        scalesProperties: { textColor: applied.textColor, fontSize: 14 },
      },
    ),
  );
  const changes = lookChanges(applied, seen);
  assert.deepEqual(changes, { upColor: '#ff9800', borders: false, bg: '#101010', vertGrid: false, horzGrid: false, fontSize: 14 });

  // kept as the user's colours; a value back at the theme's is no override
  const kept = withLookChanges('dark', { downColor: '#123456', upColor: '#000000' }, { ...changes, downColor: defaultChartStyle('dark').downColor });
  assert.deepEqual(kept, { upColor: '#ff9800', borders: false, bg: '#101010', vertGrid: false, horzGrid: false, fontSize: 14 });
});

test('a layout showing just what was applied changes nothing (no loop with the chart)', () => {
  const st = resolveChartStyle('light', { upColor: '#089981', gridOpacity: 44 });
  const grid = `rgba(${parseInt(st.gridColor.slice(1, 3), 16)}, ${parseInt(st.gridColor.slice(3, 5), 16)}, ${parseInt(st.gridColor.slice(5, 7), 16)}, 0.44)`;
  const seen = lookOfLayout(
    layout(
      {
        upColor: st.upColor.toUpperCase(),
        downColor: st.downColor,
        borderUpColor: st.borderUpColor,
        borderDownColor: st.borderDownColor,
        wickUpColor: st.wickUpColor,
        wickDownColor: st.wickDownColor,
        drawBody: st.body,
        drawBorder: st.borders,
        drawWick: st.wick,
      },
      {
        paneProperties: {
          backgroundType: 'solid',
          background: st.bg,
          backgroundGradientStartColor: st.bg,
          backgroundGradientEndColor: st.bg,
          vertGridProperties: { color: grid },
          horzGridProperties: { color: grid },
          crossHairProperties: { color: st.crosshairColor },
        },
        scalesProperties: { textColor: st.textColor, fontSize: st.fontSize },
      },
    ),
  );
  assert.deepEqual(lookChanges(st, seen), {});
  assert.deepEqual(lookOfLayout(null), {});
  assert.deepEqual(lookOfLayout({ charts: 'x' }), {});
});
