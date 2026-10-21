import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';
import { CHART_PRESETS, cleanChartStyle, resolveChartStyle } from '../../src/chart/style';

let s: Awaited<ReturnType<typeof startServer>>;
before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
});
after(() => s.stop());

test('chart colours: only known fields with valid values are kept', () => {
  assert.equal(cleanChartStyle(null), undefined);
  assert.equal(cleanChartStyle({}), undefined);
  assert.deepEqual(cleanChartStyle({ upColor: '#089981', downColor: 'red', bg: '#FFFFFF', body: false, bgType: 'gradient', gridOpacity: 140, fontSize: 13, evil: '<script>' }), {
    upColor: '#089981',
    bg: '#ffffff',
    body: false,
    bgType: 'gradient',
    gridOpacity: 100,
    fontSize: 13,
  });
  assert.deepEqual(cleanChartStyle({ fontSize: 99, bgType: 'image' }), undefined);
  // every ready-made look is valid as it is
  for (const p of CHART_PRESETS) assert.deepEqual(cleanChartStyle(p.style) ?? {}, p.style, p.id);
  // what the user did not change follows the theme
  assert.equal(resolveChartStyle('dark', { upColor: '#2962ff' }).upColor, '#2962ff');
  assert.notEqual(resolveChartStyle('dark', {}).bg, resolveChartStyle('light', {}).bg);
});

test('chart colours are saved with the account; a reset ({}) is kept too', async () => {
  const u = await s.signIn('09351119901', 'رنگ‌ها');
  const push = (baseRev: number, pid: string, prefs: unknown) => s.call('POST', '/api/me/workspace', { baseRev, pid, patch: { prefs } }, u.token);
  const r1 = await push(0, 'pid_style_1', { chartStyle: { upColor: '#2962ff', bg: 'javascript:alert(1)' } });
  assert.equal(r1.status, 200);
  let ws = await s.call('GET', '/api/me/workspace', undefined, u.token);
  assert.deepEqual(ws.data.data.prefs.chartStyle, { upColor: '#2962ff' });

  const r2 = await push(r1.data.rev, 'pid_style_2', { chartStyle: {} });
  assert.equal(r2.status, 200);
  ws = await s.call('GET', '/api/me/workspace', undefined, u.token);
  assert.deepEqual(ws.data.data.prefs.chartStyle, {});
});
