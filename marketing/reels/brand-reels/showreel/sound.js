// The soundtrack, written in code: an OfflineAudioContext renders 25 s at 120 BPM and window.renderAudio() returns
// it as a 16-bit stereo WAV (base64). A kick on every beat; a hit (boom, crack, chord stab) on every scene change; a
// whoosh under each exit move; a riser through bar 11 into the last full bar; a bell under the end title. Anything
// that rings past 25 s is folded back onto the start, so the track loops like the picture. Noise is seeded.
window.renderAudio = async () => {
  const SR = 48000, LOOP = 25, TAIL = 2.5, O = 0.5, ctx = new OfflineAudioContext(2, SR * (O + LOOP + TAIL), SR);
  let seed = 7; const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const NOISE = ctx.createBuffer(1, SR * 3, SR); NOISE.getChannelData(0).forEach((_, i, d) => { d[i] = rnd() * 2 - 1; });
  const B = 0.5, BAR = 2;
  // ---- buses: drums → master; music → sidechain gain (ducks on every kick) → master; reverb send
  const master = ctx.createGain(); master.gain.value = 0.7;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.15;
  master.connect(comp); comp.connect(ctx.destination);
  const drums = ctx.createGain(); drums.connect(master);
  const music = ctx.createGain(); music.connect(master);
  const rv = ctx.createConvolver(); { const n = SR * 2.2, b = ctx.createBuffer(2, n, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, 3.2); } rv.buffer = b; }
  const rvOut = ctx.createGain(); rvOut.gain.value = 0.32; rv.connect(rvOut); rvOut.connect(music);
  const send = (node, amt) => { const g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(rv); };
  const pan = (node, p, to) => { const s = ctx.createStereoPanner(); s.pan.value = p; node.connect(s); s.connect(to); return s; };
  // ---- helpers
  const env = (g, t, a, peak, d, end = 0.0001) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); };
  const noise = (t, dur, off = 0) => { const s = ctx.createBufferSource(); s.buffer = NOISE; s.start(t, off % 2.4, dur); return s; };
  const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const osc = (type, f, t, dur, det = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.start(t); o.stop(t + dur); return o; };
  // ---- drums
  function kick(t, amp = 1) {
    const o = osc('sine', 150, t, 0.5), g = ctx.createGain(); o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.11); env(g, t, 0.002, amp, 0.42); o.connect(g); g.connect(drums);
    const c = noise(t, 0.02, t * 3.1), cg = ctx.createGain(), hp = filt('highpass', 2500); env(cg, t, 0.001, 0.25 * amp, 0.015); c.connect(hp); hp.connect(cg); cg.connect(drums);
    music.gain.setValueAtTime(0.32, t); music.gain.setTargetAtTime(1, t + 0.03, 0.07);   // sidechain
  }
  function hat(t, amp = 0.18, dec = 0.045, p = 0.25) { const s = noise(t, dec * 4, t * 7.7), hp = filt('highpass', 7600), g = ctx.createGain(); env(g, t, 0.001, amp, dec); s.connect(hp); hp.connect(g); pan(g, p, drums); }
  function clap(t, amp = 0.5) {
    const g = ctx.createGain(), bp = filt('bandpass', 1500, 1.1); g.gain.setValueAtTime(0.0001, t);
    [0, 0.011, 0.022].forEach((o) => { g.gain.setValueAtTime(amp, t + o); g.gain.exponentialRampToValueAtTime(amp * 0.25, t + o + 0.009); });
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); const s = noise(t, 0.25, t * 5.3); s.connect(bp); bp.connect(g); g.connect(drums); send(g, 0.35);
  }
  function snare(t, amp) { const s = noise(t, 0.12, t * 2.3), bp = filt('bandpass', 2200, 0.8), g = ctx.createGain(); env(g, t, 0.001, amp, 0.07); s.connect(bp); bp.connect(g); g.connect(drums); }
  // ---- tones
  const N = { A1: 55, B1: 61.74, C2: 65.41, D2: 73.42, E1: 41.2, F1: 43.65, G1: 49, A2: 110 };
  const CH = { Am: [220, 261.63, 329.63, 440], F: [174.61, 220, 261.63, 329.63], C: [196, 261.63, 329.63, 392], G: [196, 246.94, 293.66, 392], Fmaj9: [174.61, 220, 261.63, 329.63, 392] };
  const ROOT = { Am: N.A1, F: N.F1, C: N.C2, G: N.G1, Fmaj9: N.F1 };
  // bars 1–4 and 5–8: Am F C G; 9 Am, 10 F, 11 G (the riser), 12 Am (the strongest bar), end title: Fmaj9, which loops into Am
  const PROG = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am', 'Fmaj9'];
  function bass(t, f, dur = 0.22, amp = 0.34, cut = 700) {
    const g = ctx.createGain(), lp = filt('lowpass', cut, 3); lp.frequency.setValueAtTime(cut * 2.6, t); lp.frequency.exponentialRampToValueAtTime(cut * 0.55, t + dur);
    [0, 9].forEach((d) => osc('sawtooth', f, t, dur + 0.05, d).connect(lp)); osc('sine', f, t, dur + 0.05).connect(g);
    env(g, t, 0.004, amp, dur); lp.connect(g); g.connect(music);
  }
  function stab(t, notes, amp = 0.16, dec = 0.32, bright = 4200) {
    const g = ctx.createGain(), lp = filt('lowpass', bright, 1.2); lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(500, t + dec);
    notes.forEach((f, i) => { [-8, 8].forEach((d) => osc('sawtooth', f, t, dec + 0.1, d).connect(lp)); });
    env(g, t, 0.003, amp, dec); lp.connect(g); g.connect(music); send(g, 0.5);
  }
  function pad(t, notes, dur, amp = 0.045, cut = 1100) {
    const g = ctx.createGain(), lp = filt('lowpass', cut, 0.5); notes.forEach((f) => [-12, 0, 12].forEach((d) => osc('sawtooth', f, t, dur + 0.3, d).connect(lp)));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.08); g.gain.setValueAtTime(amp, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    lp.connect(g); pan(g, 0, music); send(g, 0.3);
  }
  function pluck(t, f, amp = 0.09, p = 0) { const g = ctx.createGain(), lp = filt('lowpass', 3000, 2); lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.16);
    osc('square', f, t, 0.25).connect(lp); env(g, t, 0.002, amp, 0.17); lp.connect(g); pan(g, p, music); send(g, 0.4); }
  function pop(t, f, amp = 0.16) { const o = osc('sine', f, t, 0.2), g = ctx.createGain(); o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03); env(g, t, 0.002, amp, 0.12); o.connect(g); g.connect(music); send(g, 0.4); }
  function bell(t, f, amp = 0.13) { [[1, 1], [2.76, 0.4], [5.4, 0.2], [8.93, 0.08]].forEach(([r, a]) => { const o = osc('sine', f * r, t, 3), g = ctx.createGain(); env(g, t, 0.003, amp * a, 2.4 / r); o.connect(g); g.connect(master); send(g, 0.5); }); }
  // ---- the scene-change hit: sub boom, a noise crack, the bar's chord as a stab
  function hit(t, chord, big = 0) {
    const o = osc('sine', 70, t, 1.2), g = ctx.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.6); env(g, t, 0.003, 0.55 + 0.25 * big, 0.7 + 0.4 * big); o.connect(g); g.connect(drums);
    const s = noise(t, 0.5, t * 1.7), bp = filt('bandpass', 1800, 0.6), sg = ctx.createGain(); env(sg, t, 0.001, 0.35 + 0.2 * big, 0.22 + 0.2 * big); s.connect(bp); bp.connect(sg); sg.connect(drums); send(sg, 0.6);
    stab(t, CH[chord], 0.17 + 0.07 * big, 0.45 + 0.4 * big, 5200);
  }
  // the exit whoosh: band-passed noise sweeping up under each bar's last fast move (x.78 → the next bar)
  function whoosh(t0, t1, amp = 0.12, f0 = 500, f1 = 5000) { const s = noise(t0, t1 - t0 + 0.05, t0 * 4.1), bp = filt('bandpass', f0, 2.5), g = ctx.createGain();
    bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t1); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t1 - 0.01); g.gain.linearRampToValueAtTime(0, t1); s.connect(bp); bp.connect(g); pan(g, 0, drums); }
  function riser(t0, t1) {
    const s = noise(t0, t1 - t0, 0.3), bp = filt('bandpass', 300, 3), g = ctx.createGain(); bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(9000, t1);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t1 - 0.02); g.gain.linearRampToValueAtTime(0, t1); s.connect(bp); bp.connect(g); g.connect(master);
    [0, 7].forEach((d) => { const o = osc('sawtooth', 110, t0, t1 - t0, d), lp = filt('lowpass', 400, 4), og = ctx.createGain(); o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t1);
      lp.frequency.setValueAtTime(400, t0); lp.frequency.exponentialRampToValueAtTime(6000, t1); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.06, t1 - 0.02); og.gain.linearRampToValueAtTime(0, t1);
      o.connect(lp); lp.connect(og); og.connect(master); });
    for (let k = 0; k < 16; k++) snare(t0 + k * 0.125, 0.04 + 0.22 * (k / 15)); for (let k = 0; k < 8; k++) snare(t0 + 1 + k * 0.0625, 0.15 + 0.15 * (k / 7)); for (let k = 0; k < 8; k++) snare(t0 + 1.5 + k * 0.0625, 0.3 + 0.12 * (k / 7));
  }
  // ---- the score (everything sits O seconds into the render: a pre-roll, so the first downbeat starts from a settled graph)
  for (let i = 0; i < LOOP / B; i++) { const t = i * B; kick(O + t, t >= 24 ? (t === 24 ? 1 : 0.55) : 1); }
  for (let bar = 0; bar < 13; bar++) {
    const t0 = O + bar * BAR, ch = PROG[bar], root = ROOT[ch], last = bar === 12, rise = bar === 10, peak = bar === 11;
    hit(t0, ch, peak ? 1 : last ? 0.6 : 0);
    if (last) { bell(t0, 440); bell(t0 + 0.25, 659.25, 0.07); pad(t0, CH.Fmaj9, 0.95, 0.05, 1600); hat(t0 + 0.25, 0.1); hat(t0 + 0.75, 0.1); continue; }
    if (bar >= 1 && !rise) { clap(t0 + 0.5, 0.45); clap(t0 + 1.5, 0.45); }
    for (let k = 0; k < 4; k++) { hat(t0 + k * B + 0.25, 0.2); if (bar >= 4) { hat(t0 + k * B + 0.125, 0.06, 0.02, -0.3); hat(t0 + k * B + 0.375, 0.06, 0.02, -0.3); } }
    if (!rise && bar >= 1) for (let k = 0; k < 4; k++) { bass(t0 + k * B + 0.25, root * (k === 3 && bar % 2 ? 2 : 1), 0.2, peak ? 0.4 : 0.32, peak ? 900 : bar >= 8 ? 600 : 750); }
    if (!rise) pad(t0, CH[ch], BAR, bar < 4 ? 0.03 : 0.045, peak ? 1800 : 1100);
    if (bar < 10) whoosh(t0 + 1.74, t0 + 2.0, 0.1);
    // motifs: a pluck on every beat of the type bars (the words land on beats), sixteenths through the strongest bar
    if (bar === 0 || bar === 4 || bar === 8) [0, 0.5, 1, 1.5].forEach((o, k) => pluck(t0 + o, CH[ch][k % CH[ch].length] * 2, 0.07, (k % 2 ? -0.3 : 0.3)));
    if (peak) for (let k = 0; k < 16; k++) pluck(t0 + k * 0.125, CH.Am[[0, 2, 1, 3][k % 4]] * (k >= 8 ? 2 : 1), 0.05 + 0.03 * (k / 15), k % 2 ? -0.4 : 0.4);
    if (rise) { riser(t0, t0 + BAR); pad(t0, CH.G, BAR, 0.035, 900); }
  }
  // the data moments: a tick under each result as it lands (bar 4's +2R, the four panels in bar 12)
  pop(O + 7.5, 880); [0, 1, 2, 3].forEach((i) => pop(O + 23.5 + i * 0.125, [880, 1046.5, 1318.5, 1760][i], 0.13));
  // ---- render, fold the tail onto the start, encode (reading from the downbeat, less the compressor's 6 ms look-ahead)
  const buf = await ctx.startRendering(), n = SR * LOOP, o = SR * O + Math.round(0.006 * SR), L = buf.getChannelData(0).subarray(o), Rt = buf.getChannelData(1).subarray(o), out = new Int16Array(n * 2);
  const at = (C, i) => C[i] + (i + n < C.length ? C[i + n] : 0);
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(at(L, i)), Math.abs(at(Rt, i)));
  const sc = 0.89 / Math.max(pk, 1e-6); for (let i = 0; i < n; i++) { out[2 * i] = Math.round(at(L, i) * sc * 32767); out[2 * i + 1] = Math.round(at(Rt, i) * sc * 32767); }
  const hdr = new DataView(new ArrayBuffer(44)), w4 = (o, s) => [...s].forEach((c, i) => hdr.setUint8(o + i, c.charCodeAt(0)));
  w4(0, 'RIFF'); hdr.setUint32(4, 36 + out.byteLength, true); w4(8, 'WAVE'); w4(12, 'fmt '); hdr.setUint32(16, 16, true); hdr.setUint16(20, 1, true); hdr.setUint16(22, 2, true); hdr.setUint32(24, SR, true); hdr.setUint32(28, SR * 4, true); hdr.setUint16(32, 4, true); hdr.setUint16(34, 16, true); w4(36, 'data'); hdr.setUint32(40, out.byteLength, true);
  const bytes = new Uint8Array(44 + out.byteLength); bytes.set(new Uint8Array(hdr.buffer), 0); bytes.set(new Uint8Array(out.buffer), 44);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s);
};
