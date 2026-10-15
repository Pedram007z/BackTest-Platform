// «زمان‌گرد» (the Time-Walker): BacktestLab's fantasy character, drawn from the founder's photo: the thick swept-up
// dark hair with a loose fringe, smoky-grey rectangular glasses with three silver dots at the hinges, a short dark beard
// and moustache, calm dark eyes, the patterned grey shirt (now a tunic under a violet hooded cloak with gold candlestick
// embroidery) and an hourglass whose sand is candles: he rewinds the market and trades it again.
// characterSVG({ mouth: 0–1 open, shape: 'rest'|'o'|'e', blink: 0–1, brow: −1…1, look: −1…1, glow: 0–1 }) → SVG string (1080×1350)
function characterSVG(o = {}) {
  const mouth = o.mouth ?? 0, blink = o.blink ?? 0, brow = o.brow ?? 0, look = o.look ?? 0, glow = o.glow ?? 1, shape = o.shape ?? 'rest';
  const R = (s) => { let x = s; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
  const r = R(7);
  // hair: a thick, swept-up mass (slightly to his left, our right) with textured strokes inside it and a loose fringe
  const HAIR = 'M366 585 C352 470 372 360 430 300 C470 258 525 236 585 240 C650 244 700 280 718 340 C732 392 724 470 714 585 C706 520 694 488 678 470 C640 440 596 430 548 432 C498 434 452 444 412 472 C392 490 376 520 366 585 Z';
  let strands = '';
  for (let i = 0; i < 90; i++) {
    const a = r(), x0 = 380 + a * 330, y0 = 470 - Math.sin(a * Math.PI) * 60 + r() * 30, len = 70 + r() * 110;
    const ang = -Math.PI / 2 + 0.55 + (a - 0.5) * 0.5 + (r() - 0.5) * 0.35, x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    const c = ['#2A1F1A', '#33261F', '#3E2E25', '#1E1612'][Math.floor(r() * 4)];
    strands += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${(x0 + (x1 - x0) * 0.3 - 12).toFixed(1)} ${(y0 + (y1 - y0) * 0.55).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${c}" stroke-width="${(3 + r() * 5).toFixed(1)}" stroke-linecap="round" fill="none" opacity="${(0.6 + r() * 0.4).toFixed(2)}"/>`;
  }
  let tufts = '';
  for (let i = 0; i < 16; i++) {
    const a = i / 15, x = 400 + a * 300, y = 300 - Math.sin(a * Math.PI) * 50 + 60 * Math.abs(a - 0.55) + r() * 14;
    tufts += `<path d="M${(x - 26).toFixed(1)} ${(y + 34).toFixed(1)} Q${(x - 6).toFixed(1)} ${(y - 14).toFixed(1)} ${(x + 34 + r() * 16).toFixed(1)} ${(y - 18 - r() * 18).toFixed(1)} Q${(x + 10).toFixed(1)} ${(y + 6).toFixed(1)} ${(x + 6).toFixed(1)} ${(y + 34).toFixed(1)} Z" fill="${i % 3 ? '#1A130F' : '#2C211B'}"/>`;
  }
  let fringe = '';
  for (let i = 0; i < 7; i++) {
    const x0 = 548 + i * 13 + r() * 6, y0 = 420 + r() * 10, x1 = x0 + 10 + r() * 16, y1 = 470 + r() * 26;
    fringe += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${(x0 + 22).toFixed(1)} ${(y0 + 26).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${i % 2 ? '#1B1411' : '#2E221C'}" stroke-width="${(5 + r() * 4).toFixed(1)}" stroke-linecap="round" fill="none"/>`;
  }
  let stubble = '';
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI, rr = 0.82 + r() * 0.2, x = 540 + Math.cos(a) * 165 * rr * (r() < 0.5 ? -1 : 1) * 0.98, y = 655 + Math.sin(a) * 150 * rr;
    if (y < 640 || (Math.abs(x - 540) < 60 && y < 745 && y > 690)) continue;
    stubble += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + r() * 1.3).toFixed(1)}" fill="#0E0A08" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
  }
  let pattern = '';   // the shirt's woven pattern, on the tunic
  for (let i = 0; i < 70; i++) {
    const x = 455 + r() * 170, y = 930 + r() * 420, s = 6 + r() * 12;
    pattern += `<path d="M${(x - s).toFixed(1)} ${y.toFixed(1)} q${s.toFixed(1)} ${(-s).toFixed(1)} ${(2 * s).toFixed(1)} 0 q${(-s).toFixed(1)} ${s.toFixed(1)} ${(-2 * s).toFixed(1)} 0" stroke="#B7B7C2" stroke-width="1.6" fill="none" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`;
  }
  let candles = '';   // floating candles around him
  [[150, 420, 1, 1.1], [205, 640, 0, 0.8], [130, 860, 1, 0.9], [930, 380, 0, 1.0], [880, 610, 1, 0.75], [955, 820, 1, 1.1], [240, 260, 0, 0.6], [840, 230, 1, 0.65]].forEach(([x, y, up, s], i) => {
    const c = up ? '#26C281' : '#F25466', h = 70 * s, w = 22 * s;
    candles += `<g opacity="${(0.55 + 0.45 * glow).toFixed(2)}" filter="url(#soft)"><line x1="${x}" y1="${y - h * 0.9}" x2="${x}" y2="${y + h * 0.9}" stroke="${c}" stroke-width="${3 * s}"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${4 * s}" fill="${c}"/></g>`;
  });
  let dust = '';
  for (let i = 0; i < 70; i++) { const x = r() * 1080, y = r() * 1350; dust += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + r() * 2.5).toFixed(1)}" fill="${r() < 0.5 ? '#B5A2FF' : '#FFD27A'}" opacity="${(0.15 + r() * 0.5).toFixed(2)}"/>`; }
  // eyes: almond whites, dark iris, heavy upper lid; blink closes the lids
  const eye = (cx, mirror) => {
    const lid = 1 - blink, ix = cx + look * 7;
    return `<g>
      <path d="M${cx - 40} 582 Q${cx - 4} ${558 - 4 * lid} ${cx + 40} 580 Q${cx} ${600} ${cx - 40} 582 Z" fill="#F4EEE8"/>
      <clipPath id="ec${cx}"><path d="M${cx - 40} 582 Q${cx - 4} ${558 - 4 * lid} ${cx + 40} 580 Q${cx} ${600} ${cx - 40} 582 Z"/></clipPath>
      <g clip-path="url(#ec${cx})"><circle cx="${ix}" cy="581" r="16.5" fill="#3B2416"/><circle cx="${ix}" cy="581" r="8" fill="#100906"/><circle cx="${ix + 6}" cy="575" r="4" fill="#fff" opacity="0.9"/>
        <rect x="${cx - 44}" y="${552}" width="88" height="${12 + 30 * blink}" fill="#D9AE8C"/></g>
      <path d="M${cx - 42} 581 Q${cx - 4} ${557 - 3 * lid + 20 * blink} ${cx + 42} 579" stroke="#1A100C" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx - 34} 592 Q${cx} 602 ${cx + 34} 591" stroke="#9C6E55" stroke-width="2" fill="none" opacity="0.6"/>
    </g>`;
  };
  // mouth: lower lip and the opening under the moustache
  const open = mouth * (shape === 'o' ? 22 : shape === 'e' ? 12 : 18), wide = shape === 'o' ? 20 : shape === 'e' ? 40 : 32;
  const mouthSvg = open > 0.5
    ? `<path d="M${540 - wide} 716 Q540 ${712 - 2} ${540 + wide} 716 Q540 ${716 + open * 1.6} ${540 - wide} 716 Z" fill="#3A1414"/><path d="M${540 - wide + 6} ${716 + open * 0.9} Q540 ${716 + open * 1.5} ${540 + wide - 6} ${716 + open * 0.9}" stroke="#E8DCD6" stroke-width="${Math.min(5, open * 0.3)}" fill="none" opacity="0.7"/>
       <path d="M${540 - wide - 2} ${718 + open * 0.6} Q540 ${734 + open * 1.4} ${540 + wide + 2} ${718 + open * 0.6} Q540 ${724 + open * 1.4} ${540 - wide - 2} ${718 + open * 0.6} Z" fill="#C47A72"/>`
    : `<path d="M508 716 Q540 722 572 716" stroke="#5C2B26" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M502 718 Q540 750 578 718 Q540 734 502 718 Z" fill="#C47A72"/><path d="M520 728 Q540 736 560 728" stroke="#E3A39A" stroke-width="3" fill="none" opacity="0.6"/>`;
  const b = brow * 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3A2470"/><stop offset="0.55" stop-color="#170F30"/><stop offset="1" stop-color="#07050F"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9273FF" stop-opacity="${0.55 * glow}"/><stop offset="1" stop-color="#9273FF" stop-opacity="0"/></radialGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C79473"/><stop offset="0.25" stop-color="#E2B896"/><stop offset="0.7" stop-color="#E8C2A2"/><stop offset="1" stop-color="#BF8B6A"/></linearGradient>
  <linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A2F8A"/><stop offset="1" stop-color="#1E1240"/></linearGradient>
  <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B5A2FF" stop-opacity="${0.20 + 0.15 * glow}"/><stop offset="0.5" stop-color="#7C5CFF" stop-opacity="0.06"/><stop offset="1" stop-color="#26C281" stop-opacity="${0.10 * glow}"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset="1" stop-color="#C98A2B"/></linearGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="1080" height="1350" fill="url(#bg)"/>
<circle cx="540" cy="560" r="470" fill="url(#halo)"/>
<g opacity="0.35" stroke="#B5A2FF" stroke-width="2" fill="none"><circle cx="540" cy="560" r="410" stroke-dasharray="4 14"/><circle cx="540" cy="560" r="445" stroke-dasharray="40 10 4 10" opacity="0.6"/></g>
${dust}${candles}
<!-- hood, behind the head -->
<path d="M120 1350 C130 1060 220 930 300 880 C262 760 262 420 360 280 C420 196 480 176 540 174 C600 176 660 196 720 280 C818 420 818 760 780 880 C860 930 950 1060 960 1350 Z" fill="url(#cloak)"/>
<path d="M330 900 C300 760 300 450 390 320 C440 252 490 238 540 236 C590 238 640 252 690 320 C780 450 780 760 750 900 C680 940 400 940 330 900 Z" fill="#0E0920"/>
<path d="M300 880 C262 760 262 420 360 280 C420 196 480 176 540 174 C600 176 660 196 720 280 C818 420 818 760 780 880" stroke="url(#gold)" stroke-width="6" fill="none"/>
<path d="M330 640 C320 760 340 860 380 900 M750 640 C760 760 740 860 700 900" stroke="#2E1D5A" stroke-width="10" fill="none" opacity="0.8"/>
<!-- ears and neck -->
<ellipse cx="362" cy="604" rx="26" ry="48" fill="#C99673"/><ellipse cx="718" cy="604" rx="26" ry="48" fill="#C99673"/><path d="M356 584 q-10 20 2 40" stroke="#A8745A" stroke-width="4" fill="none"/><path d="M724 584 q10 20 -2 40" stroke="#A8745A" stroke-width="4" fill="none"/>
<path d="M470 760 L466 880 Q540 912 614 880 L610 760 Z" fill="#B98463"/>
<!-- tunic (his shirt's pattern) and cloak panels -->
<path d="M430 900 Q540 880 650 900 L700 1350 L380 1350 Z" fill="#4C4C56"/>${pattern}
<path d="M455 905 L540 1010 L625 905" stroke="#2C2C34" stroke-width="10" fill="none"/>
<path d="M120 1350 C150 1060 330 930 466 888 L520 1015 L470 1350 Z" fill="url(#cloak)"/>
<path d="M960 1350 C930 1060 750 930 614 888 L560 1015 L610 1350 Z" fill="url(#cloak)"/>
<path d="M470 892 L520 1015 L470 1350 M610 892 L560 1015 L610 1350" stroke="url(#gold)" stroke-width="6" fill="none"/>
${[0, 1, 2, 3].map((k) => `<g fill="url(#gold)" opacity="0.85"><rect x="${488 - k * 6}" y="${1080 + k * 62}" width="10" height="34" rx="2"/><line x1="${493 - k * 6}" y1="${1068 + k * 62}" x2="${493 - k * 6}" y2="${1126 + k * 62}" stroke="url(#gold)" stroke-width="3"/><rect x="${582 + k * 6}" y="${1092 + k * 62}" width="10" height="26" rx="2"/><line x1="${587 + k * 6}" y1="${1078 + k * 62}" x2="${587 + k * 6}" y2="${1132 + k * 62}" stroke="url(#gold)" stroke-width="3"/></g>`).join('')}
<!-- the hourglass amulet: sand made of candles -->
<path d="M486 905 Q540 1000 540 1040 M594 905 Q540 1000 540 1040" stroke="url(#gold)" stroke-width="3" fill="none"/>
<g transform="translate(540 1100)"><circle r="70" fill="#FFD27A" opacity="${0.25 * glow}" filter="url(#bloom)"/>
  <rect x="-40" y="-62" width="80" height="10" rx="3" fill="url(#gold)"/><rect x="-40" y="52" width="80" height="10" rx="3" fill="url(#gold)"/>
  <path d="M-32 -52 L32 -52 L4 0 L32 52 L-32 52 L-4 0 Z" fill="#E9E4FF" opacity="0.18" stroke="#FFE29A" stroke-width="2.5"/>
  <path d="M-22 -40 L22 -40 L3 -6 L-3 -6 Z" fill="#26C281" opacity="0.9"/><path d="M-24 50 L24 50 L8 30 L-8 30 Z" fill="#F25466" opacity="0.9"/>
  <line x1="0" y1="-6" x2="0" y2="30" stroke="#FFE29A" stroke-width="2" stroke-dasharray="3 4"/></g>
<!-- face -->
<path d="M540 372 C650 372 716 440 716 566 C716 652 698 712 656 752 C616 790 578 806 540 806 C502 806 464 790 424 752 C382 712 364 652 364 566 C364 440 430 372 540 372 Z" fill="url(#skin)"/>
<path d="M386 640 C400 700 440 760 500 790" stroke="#B07C5D" stroke-width="10" fill="none" opacity="0.25"/>
<!-- beard and moustache -->
<path d="M378 612 C386 700 430 770 482 806 C505 822 525 830 540 830 C555 830 575 822 598 806 C650 770 694 700 702 612 C690 660 664 690 628 700 C612 706 600 708 592 712 C590 742 570 760 540 762 C510 760 490 742 488 712 C480 708 468 706 452 700 C416 690 390 660 378 612 Z" fill="#241913" opacity="0.92"/>
${stubble}
<path d="M486 708 C498 690 520 686 540 692 C560 686 582 690 594 708 C580 704 560 702 540 706 C520 702 500 704 486 708 Z" fill="#1A120E"/>
<!-- nose -->
<path d="M548 590 C550 620 556 645 562 664" stroke="#B57E5E" stroke-width="5" fill="none" opacity="0.55" stroke-linecap="round"/>
<path d="M512 670 C520 660 530 662 540 668 C550 662 560 660 568 670 C562 684 518 684 512 670 Z" fill="#C88F6E"/>
<ellipse cx="526" cy="674" rx="7" ry="4" fill="#7A4A36" opacity="0.8"/><ellipse cx="554" cy="674" rx="7" ry="4" fill="#7A4A36" opacity="0.8"/>
${mouthSvg}
<!-- eyes, brows -->
${eye(468)}${eye(612)}
<path d="M408 ${520 - b} C440 ${496 - b} 482 ${494 - b} 516 ${506 - b * 0.6} L514 ${522 - b * 0.6} C482 ${512 - b} 446 ${514 - b} 414 ${532 - b} Z" fill="#17100D"/>
<path d="M672 ${520 - b} C640 ${496 - b} 598 ${494 - b} 564 ${506 - b * 0.6} L566 ${522 - b * 0.6} C598 ${512 - b} 634 ${514 - b} 666 ${532 - b} Z" fill="#17100D"/>
<!-- hair -->
<clipPath id="hairclip"><path d="${HAIR}"/></clipPath>
${tufts}<path d="${HAIR}" fill="#17110E"/><g clip-path="url(#hairclip)">${strands}</g>${fringe}
<path d="M366 520 L376 606 L390 606 L386 500 Z M714 520 L704 606 L690 606 L694 500 Z" fill="#2A1F1A" opacity="0.85"/>
<!-- glasses: smoky grey rectangles, three silver dots at each hinge, a violet glint -->
<g>
  <rect x="394" y="534" width="138" height="104" rx="14" fill="url(#lens)" stroke="#47464F" stroke-width="9" stroke-opacity="0.93"/>
  <rect x="548" y="534" width="138" height="104" rx="14" fill="url(#lens)" stroke="#47464F" stroke-width="9" stroke-opacity="0.93"/>
  <path d="M532 562 Q540 554 548 562" stroke="#47464F" stroke-width="8" fill="none"/>
  <path d="M394 554 L366 566 M686 554 L714 566" stroke="#47464F" stroke-width="8"/>
  ${[[404, 544], [412, 540], [412, 549], [676, 544], [668, 540], [668, 549]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#E6E6EE"/>`).join('')}
  <path d="M410 610 L450 540" stroke="#FFFFFF" stroke-width="6" opacity="${0.12 + 0.1 * glow}" stroke-linecap="round"/><path d="M562 610 L602 540" stroke="#FFFFFF" stroke-width="6" opacity="${0.12 + 0.1 * glow}" stroke-linecap="round"/>
  <polyline points="560,610 580,598 596,604 614,584 632,592 650,570 670,576" stroke="#26C281" stroke-width="3" fill="none" opacity="${0.55 * glow}"/>
  <polyline points="408,606 426,596 444,600 462,584 480,590 498,572 518,578" stroke="#B5A2FF" stroke-width="3" fill="none" opacity="${0.45 * glow}"/>
</g>
<!-- rim light from the violet halo -->
<path d="M376 560 C368 470 390 380 450 340" stroke="#B5A2FF" stroke-width="4" fill="none" opacity="0.5"/>
<path d="M704 560 C712 470 690 380 630 338" stroke="#FFD27A" stroke-width="3" fill="none" opacity="0.35"/>
</svg>`;
}
if (typeof module !== 'undefined') module.exports = { characterSVG };
