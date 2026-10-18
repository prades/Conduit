// node design/ui-mocks/mix-selector.js <out.png> : numbered mock-ups of the bottom-left MIX SELECTOR (replaces the Crystal menu: pick which elements are in the mix new followers come out as, and hold the field orders on a second tab).
// Each concept is shown open on its MIX tab, with the COMMAND tab named beside it and the closed button. Needs playwright + chromium.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2] || '/tmp/mix-selector.png';
const EL = [['FIRE', '#ff4a1c', 1], ['ELECTRIC', '#ffe733', 1], ['ICE', '#99ddff', 1], ['FLUX', '#a64dff', 1], ['CORE', '#00ccaa', 0], ['TOXIC', '#66ff66', 1]];   // [name, colour, in the mix]
const W = [3, 1, 2, 2, 0, 2];
const gem = (c, s, on) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" style="opacity:${on ? 1 : 0.45}"><polygon points="10,1 18,8 10,19 2,8" fill="${c}"/><polygon points="10,1 18,8 10,8" fill="rgba(255,255,255,0.45)"/><polygon points="2,8 10,8 10,19" fill="rgba(0,0,0,0.25)"/></svg>`;
const SL = 'polygon(8% 0,100% 0,92% 100%,0 100%)';
const tab = (t, on, c) => `<span class="tab" style="background:${on ? c : '#0b1226'};color:${on ? '#05070f' : '#cfe0ff'};border-color:${c}">${t}</span>`;
const chip = (e, i, extra) => { const on = e[2]; return `<div class="chip" style="--c:${e[1]};${extra || ''}opacity:${e[0] === 'CORE' ? 0.9 : 1}"><div class="chipbg" style="background:${on ? `color-mix(in srgb, ${e[1]} 30%, #0b1226)` : '#0b1226'};outline:2px solid ${on ? e[1] : '#34405f'}"></div>${gem(e[1], 20, on)}<b style="color:${on ? '#fff' : '#7d8cb0'}">${e[0]}</b>${on ? `<i style="color:${e[1]}">&#10003;</i>` : ''}</div>`; };
const ABS = (s, st) => `<div style="position:absolute;${st}">${s}</div>`;
const closedBtn = (x, y) => ABS(`<div class="closed">${gem('#ffe733', 26, 1)}<span>MIX 5</span></div>`, `left:${x}px;top:${y}px`);

const C = [];
// 1 FAN: round gem keys on a quarter arc from the corner
C.push(['FAN', 'The six elements fan out from the corner on an arc as round keys, like a character-select fan. Tabs sit at the base.',
  `<svg width="420" height="330" style="position:absolute;left:0;top:0"><path d="M 30 290 m 202 0 a 202 202 0 0 0 -202 -202" fill="none" stroke="#34405f" stroke-width="1.5" stroke-dasharray="4 5" transform="translate(0 0) scale(1 1)"/>
  ${EL.map((e, i) => { const th = (6 + i * 15.5) * Math.PI / 180, R = 202, cx = 30 + R * Math.cos(th), cy = 290 - R * Math.sin(th), on = e[2];
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="27" fill="${on ? `color-mix(in srgb, ${e[1]} 40%, #0b1226)` : '#0b1226'}" stroke="${on ? e[1] : '#34405f'}" stroke-width="${on ? 3 : 2}"/><text x="${cx.toFixed(1)}" y="${(cy + 5).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-weight="900" font-style="italic" font-size="14" fill="${on ? '#fff' : '#7d8cb0'}">${e[0].slice(0, 3)}</text>${on ? `<circle cx="${(cx + 19).toFixed(1)}" cy="${(cy - 19).toFixed(1)}" r="7" fill="${e[1]}"/>` : ''}`; }).join('')}</svg>`
  + ABS(tab('COMMAND', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:10px;top:296px;display:flex;gap:4px') + closedBtn(10, 244)]);
// 2 HONEYCOMB: centre hex + six hex cells
C.push(['HONEYCOMB', 'Six hex cells round a centre hex: tap a cell to put it in or out of the mix. The centre switches the tab.',
  EL.map((e, i) => { const a = (i * 60 - 90) * Math.PI / 180, R = 84, cx = 150 + R * Math.cos(a), cy = 150 + R * Math.sin(a), on = e[2];
    return ABS(`<div class="hex" style="background:${on ? e[1] : '#0b1226'};--o:${on ? e[1] : '#34405f'}"><div class="hexin" style="background:${on ? `color-mix(in srgb, ${e[1]} 55%, #0b1226)` : '#0b1226'}">${gem(e[1], 22, on)}</div></div>`, `left:${cx - 38}px;top:${cy - 43}px`); }).join('')
  + ABS(`<div class="hex" style="background:#ffe733;--o:#ffe733"><div class="hexin" style="background:#14192e"><b style="font:italic 900 15px sans-serif;color:#ffe733">MIX</b></div></div>`, 'left:112px;top:107px')
  + ABS(tab('COMMAND', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:70px;top:296px;display:flex;gap:4px') + closedBtn(340, 250)]);
// 3 RAIL: a capsule rail you slide
C.push(['SLIDE RAIL', 'A low rail along the bottom: slide it sideways or tap a chip. Tabs at its left end, the rest of the elements slide in from the right.',
  ABS(`<div class="rail">${tab('COMMAND', 0, '#19e6c1')}${tab('MIX', 1, '#ffe733')}<div class="railin">${EL.map((e, i) => chip(e, i, 'position:relative;flex:none;')).join('')}</div></div>`, 'left:10px;top:235px;width:560px;overflow:hidden')
  + ABS('<div class="hint">&#8249; &nbsp; SLIDE &nbsp; &#8250;</div>', 'left:150px;top:290px') + closedBtn(10, 160)]);
// 4 DECK: card grid
C.push(['DECK', 'A small deck of cards, three by two, like a roster select screen: big icon, big italic name, a lit corner for in the mix.',
  ABS(tab('COMMAND', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:10px;top:92px;display:flex;gap:4px')
  + EL.map((e, i) => { const on = e[2], x = 10 + (i % 3) * 128, y = 128 + Math.floor(i / 3) * 84; return ABS(`<div class="card" style="--c:${e[1]};border-color:${on ? e[1] : '#34405f'};background:${on ? `linear-gradient(180deg,color-mix(in srgb,${e[1]} 32%,#0b1226),#0b1226)` : '#0b1226'}">${gem(e[1], 34, on)}<b style="color:${on ? '#fff' : '#7d8cb0'}">${e[0]}</b>${on ? `<s style="background:${e[1]}"></s>` : ''}</div>`, `left:${x}px;top:${y}px`); }).join('')
  + closedBtn(10, 40)]);
// 5 RATIO BAR
C.push(['MIX BAR', 'The mix as ONE bar cut in proportion: drag the dividers to say how many of each you want (3 fire to 1 electric...), tap a colour to drop it. Respawns follow the ratio.',
  ABS(tab('COMMAND', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:10px;top:150px;display:flex;gap:4px')
  + ABS(`<div class="bar">${EL.map((e, i) => W[i] ? `<div style="flex:${W[i]};background:${e[1]};color:#05070f"><b>${W[i]}</b></div>` : '').join('')}</div>`, 'left:10px;top:186px;width:380px')
  + ABS(`<div style="display:flex;gap:6px">${EL.map((e, i) => `<div class="mini" style="--c:${e[1]};border-color:${W[i] ? e[1] : '#34405f'};opacity:${W[i] ? 1 : 0.6}">${gem(e[1], 18, W[i])}<span>${W[i] ? W[i] : '+'}</span></div>`).join('')}</div>`, 'left:10px;top:236px')
  + ABS('<div class="hint" style="text-align:left">DRAG THE DIVIDERS · TAP A COLOUR TO DROP IT</div>', 'left:10px;top:290px') + closedBtn(10, 90)]);
// 6 TOWER
C.push(['TOWER', 'A tall slim column up the left edge: six chips stacked, a slide handle down the side, tabs on top. Very small footprint.',
  ABS(tab('CMD', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:10px;top:20px;display:flex;gap:4px')
  + EL.map((e, i) => ABS(chip(e, i, 'width:150px;'), `left:10px;top:${56 + i * 44}px`)).join('')
  + ABS('<div style="width:8px;height:260px;background:#0b1226;border:1px solid #34405f;border-radius:4px;position:relative"><div style="position:absolute;left:-3px;top:40px;width:14px;height:50px;background:#ffe733;border-radius:3px"></div></div>', 'left:170px;top:56px')
  + closedBtn(230, 270)]);
// 7 ARC GAUGE
C.push(['ARC GAUGE', 'A clean half-ring with six keys, like a dashboard gauge: lit keys are in the mix, the middle reads the mix name. Radial but flat, no bezel, no tilt.',
  `<svg width="420" height="330" style="position:absolute;left:0;top:0">${EL.map((e, i) => { const cx = 210, cy = 272, R1 = 168, R2 = 104, g = 0.025, a0 = Math.PI + i * Math.PI / 6 + g, a1 = Math.PI + (i + 1) * Math.PI / 6 - g, on = e[2];
    const P = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`, am = (a0 + a1) / 2;
    const d = `M ${P(R1, a0)} A ${R1} ${R1} 0 0 1 ${P(R1, a1)} L ${P(R2, a1)} A ${R2} ${R2} 0 0 0 ${P(R2, a0)} Z`;
    return `<path d="${d}" fill="${on ? e[1] : '#0b1226'}" stroke="${on ? '#fff' : '#34405f'}" stroke-width="${on ? 2.5 : 1.5}"/><text x="${(cx + 136 * Math.cos(am)).toFixed(1)}" y="${(cy + 136 * Math.sin(am) + 5).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-weight="900" font-style="italic" font-size="14" fill="${on ? '#05070f' : '#7d8cb0'}">${e[0].slice(0, 3)}</text>`; }).join('')}
    <text x="210" y="248" text-anchor="middle" font-family="sans-serif" font-weight="900" font-style="italic" font-size="30" fill="#fff">MIX</text><text x="210" y="270" text-anchor="middle" font-family="monospace" font-weight="700" font-size="13" fill="#8aa0c8">5 OF 6 IN</text></svg>`
  + ABS(tab('COMMAND', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:148px;top:292px;display:flex;gap:4px') + closedBtn(10, 280)]);
// 8 ORBIT
C.push(['GEM ORBIT', 'Our prism gem in the middle (it is the button, and it shows the mix) with the six elements orbiting it as chips on a ring. Tap one to toggle it.',
  `<svg width="420" height="330" style="position:absolute;left:0;top:0"><ellipse cx="170" cy="170" rx="132" ry="104" fill="none" stroke="#34405f" stroke-width="1.5" stroke-dasharray="4 5"/>
   ${EL.map((e, i) => { const a = (i * 60 - 90) * Math.PI / 180, o0 = [170 + 40 * Math.cos(a - 0.52), 170 + 40 * Math.sin(a - 0.52)], o1 = [170 + 40 * Math.cos(a + 0.52), 170 + 40 * Math.sin(a + 0.52)]; return `<polygon points="170,170 ${o0.join(',')} ${o1.join(',')}" fill="${e[2] ? e[1] : '#151b30'}" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>`; }).join('')}</svg>`
  + EL.map((e, i) => { const a = (i * 60 - 90) * Math.PI / 180; return ABS(chip(e, i, 'width:112px;'), `left:${170 + 132 * Math.cos(a) - 56}px;top:${170 + 104 * Math.sin(a) - 20}px`); }).join('')
  + ABS(tab('COMMAND', 0, '#19e6c1') + tab('MIX', 1, '#ffe733'), 'left:110px;top:300px;display:flex;gap:4px') + closedBtn(330, 270)]);

const card = (n, [name, note, inner]) => `<div class="cardx"><div class="n">${n + 1}</div><div class="nm">${name}</div><div class="stage"><div class="floor"></div>${inner}</div><div class="note">${note}</div></div>`;
const html = `<body style="margin:0;background:#070a14;color:#fff;font-family:'DejaVu Sans',sans-serif"><style>
 body{padding:24px;width:1940px} h1{font:italic 900 46px 'DejaVu Sans';color:#ffe733;margin:0 0 4px} .sub{font:700 18px monospace;color:#8aa0c8;margin-bottom:18px;max-width:1700px;line-height:1.4}
 .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
 .cardx{background:linear-gradient(180deg,#0f1730,#070a14);border:2px solid #1d2b55;padding:12px 16px 14px;position:relative}
 .n{position:absolute;top:4px;left:12px;font:italic 900 54px 'DejaVu Sans';color:#ffe733;z-index:5} .nm{font:italic 900 24px 'DejaVu Sans';text-align:right;margin-bottom:6px}
 .stage{position:relative;height:330px;background:#05080f;border:1px solid #1d2b55;overflow:hidden}
 .floor{position:absolute;inset:0;background:linear-gradient(135deg,transparent 48%,rgba(25,230,193,0.07) 49%,transparent 50%) 0 0/46px 26px,#070b16}
 .note{font:700 14px monospace;color:#8aa0c8;line-height:1.4;margin-top:8px;min-height:40px}
 .chip{position:relative;display:flex;align-items:center;gap:7px;width:128px;height:40px;padding:0 10px;clip-path:${SL}}
 .chipbg{position:absolute;inset:0;clip-path:${SL}} .chip>*:not(.chipbg){position:relative} .chip b{font:italic 900 15px sans-serif} .chip i{position:absolute;right:12px;font-style:normal;font-weight:900;font-size:16px}
 .tab{display:inline-block;font:italic 900 13px sans-serif;padding:6px 12px;border:2px solid;clip-path:${SL}}
 .closed{display:flex;align-items:center;gap:6px;background:#0b1226;border:2px solid #ffe733;padding:5px 12px 5px 8px;font:italic 900 14px sans-serif;color:#fff;clip-path:${SL}}
 .hex{width:76px;height:86px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);display:flex;align-items:center;justify-content:center;background:var(--o)} .hexin{width:70px;height:80px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);display:flex;align-items:center;justify-content:center}
 .rail{display:flex;align-items:center;gap:6px;background:rgba(11,18,38,0.9);padding:8px;border:2px solid #34405f} .railin{display:flex;gap:6px}
 .hint{font:700 13px monospace;color:#8aa0c8;letter-spacing:0.08em;text-align:center}
 .card{width:116px;height:76px;border:2px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;position:relative;clip-path:${SL}} .card b{font:italic 900 14px sans-serif;color:#fff} .card s{position:absolute;right:6px;top:6px;width:10px;height:10px}
 .bar{display:flex;height:40px;gap:3px;border:2px solid #34405f;padding:3px;background:#0b1226} .bar div{display:flex;align-items:center;justify-content:center;clip-path:${SL}} .bar b{font:italic 900 18px sans-serif}
 .mini{display:flex;align-items:center;gap:4px;padding:5px 7px;border:2px solid;background:#0b1226;clip-path:${SL}} .mini span{font:900 13px monospace;color:#fff}
 </style>
 <h1>MIX SELECTOR: EIGHT LOOKS</h1><div class="sub">THIS REPLACES THE CRYSTAL MENU: PICK WHICH ELEMENTS ARE IN THE MIX NEW FOLLOWERS COME OUT AS (AND RESPAWN AS). ONE TAB FOR THE MIX, ONE FOR THE FIELD ORDERS (HOLD / COME / SEL). EACH SHOWN OPEN ON THE MIX TAB WITH THE SIX ELEMENTS (CORE IS OUT OF THE MIX HERE). PICK A NUMBER.</div>
 <div class="grid">${C.map((c, i) => card(i, c)).join('')}</div></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1990, height: 1500 } }); await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, fullPage: true }); await b.close(); console.log('wrote', OUT);
})();
