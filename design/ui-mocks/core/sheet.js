// DRAFT HARNESS: the review sheet for the owner (THE CORE: before and after in the game, how it is used, its reactions, the classes)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const fs = require('fs'), path = require('path');
const R = require('./render.js'), OUT = R.OUT;
const img = f => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, f)).toString('base64');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  // where its parts are on the calm render (the page itself, as render.js draws it)
  const p0 = await b.newPage({ viewport: { width: 400, height: 320 } });
  await p0.route('http://core.local/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(R.THREE_JS, 'utf8') }));
  await p0.route('http://core.local/fonts/**', r => r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(R.ROOT + new URL(r.request().url()).pathname) }));
  await p0.route('http://core.local/', r => r.fulfill({ contentType: 'text/html', body: R.page }));
  await p0.goto('http://core.local/'); await p0.evaluate(() => document.fonts.ready);
  const pts = await p0.evaluate(() => { CORE.set('calm'); CORE.render(); const P = CORE.points(), c = e => { const r = document.querySelector(e).getBoundingClientRect(), o = document.querySelector('#core').getBoundingClientRect(); return [r.left - o.left + r.width / 2, r.top - o.top + r.height / 2]; };
    return Object.assign(P, { cells: c('.cells'), count: c('.count b'), pack: c('#pack'), surgeLbl: c('#surge') }); });
  await p0.close();
  const K = 2;   // the big render is the 2x picture shown at 2x its box
  const off = (q, dx, dy) => [q[0] + dx, q[1] + dy];
  const marks = [['1', off(pts.guard, -40, -8), 'GUARD', 'Tap: your guard goes up (the shield swings beside its face, a dome round you). Tap again: down.'],
    ['2', off(pts.stun, -40, -4), 'STUN', 'Tap, then a creature: you swoop and stun it. The bolt then counts down its rest.'],
    ['3', off(pts.lid, -6, -2), 'PACK', 'Tap the lid: it flips open on your pack. The tag says how many kinds you carry.'],
    ['4', pts.arc, 'ARMY SURGE', 'The gold arc fills from your squad. Full: tap the cube.'],
    ['5', off(pts.siphon, 26, 0), 'SIPHON', 'Draw from your squad, on or off (the ⌁ of today\'s surge bar).'],
    ['6', off(pts.cells, -2, -30), 'YOUR BARS', 'The three, as now: green, then yellow, then red.'],
    ['7', off(pts.count, -64, -32), 'SHARDS', 'Your count. New shards fly into the lid.']];
  const S = [['calm', 'CALM', 'Looks toward the fight, blinks.'], ['hit', 'HIT', 'A bar breaks: it flinches, its screen flashes red.'], ['danger', 'LAST BAR', 'Angry red eyes, a cracked screen, sparks and smoke.'],
    ['heal', 'A BAR BACK', 'A bar comes back (or a repair kit): a green ring, happy eyes.'], ['shards', 'SHARDS IN', 'They fly into the lid; the count ticks up.'], ['ready', 'SURGE READY', 'Gold diamond eyes; the arc full: TAP — ARMY SURGE.'],
    ['surging', 'SURGING', 'Gold star eyes, a gold outline, the time left.'], ['guard', 'GUARD ON', 'The shield up, a dome round it, a set look.'], ['stun', 'STUN ARMED', 'Lightning eyes, leaning in: PICK A TARGET.'],
    ['rest', 'STUN RESTING', 'The bolt dark, its rest counting down.'], ['pack', 'PACK OPEN', 'The lid open, your items rising out; it looks up.'], ['ko', 'KNOCKED OUT', 'X eyes, it topples: REBOOT, back at the Crystal.']];
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #0b1020; color: #e6edf7; font-family: "DejaVu Sans", sans-serif; width: 2000px; }
    .pad { padding: 34px 40px; } h1 { margin: 0; font: italic 900 46px/1.1 "DejaVu Sans", sans-serif; letter-spacing: 0.02em; } h1 b { color: #19e6c1; }
    .sub { margin-top: 10px; font-size: 21px; color: #9fb2d8; max-width: 1800px; line-height: 1.4; }
    h2 { margin: 34px 0 14px; font: italic 900 28px/1 "DejaVu Sans", sans-serif; color: #ffe733; letter-spacing: 0.04em; }
    .ba { display: flex; gap: 20px; } .ba figure { margin: 0; width: 950px; } .ba img { width: 950px; display: block; border: 2px solid #2a3350; border-radius: 6px; } .ba figcaption { margin-top: 8px; font: italic 900 22px "DejaVu Sans"; color: #c8d6e8; }
    .use { display: flex; gap: 34px; align-items: flex-start; } .big { position: relative; width: ${340 * K}px; height: ${270 * K}px; background: radial-gradient(ellipse at 50% 45%, #232b40, #121725 70%); border: 2px solid #2a3350; border-radius: 8px; flex: none; }
    .big img { width: 100%; height: 100%; display: block; } .mk { position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; background: #ff3d7f; color: #fff; font: 900 20px/34px "DejaVu Sans"; text-align: center; box-shadow: 0 0 0 3px #0b1020, 0 0 12px #ff3d7f; }
    ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; font-size: 21px; line-height: 1.35; } ol li { display: grid; grid-template-columns: 44px 1fr; } ol li i { font-style: normal; width: 34px; height: 34px; border-radius: 50%; background: #ff3d7f; color: #fff; font: 900 20px/34px "DejaVu Sans"; text-align: center; } ol b { color: #fff; letter-spacing: 0.04em; }
    .face { margin-top: 18px; font-size: 21px; color: #9fb2d8; line-height: 1.4; }
    .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; } .tile { background: radial-gradient(ellipse at 50% 45%, #232b40, #121725 70%); border: 2px solid #2a3350; border-radius: 8px; padding: 0 0 10px; }
    .tile img { width: 100%; display: block; } .tile b { display: block; padding: 0 12px; font: italic 900 21px "DejaVu Sans"; color: #fff; letter-spacing: 0.04em; } .tile span { display: block; padding: 4px 12px 0; font-size: 16px; line-height: 1.3; color: #9fb2d8; }
    .cls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; } .notes { margin-top: 30px; font-size: 19px; line-height: 1.5; color: #9fb2d8; } .notes b { color: #e6edf7; }
  </style></head><body><div class="pad">
    <h1>THE CORE <b>·</b> your cube, tucked into the bottom right <span style="color:#9fb2d8;font-size:26px">(a draft)</span></h1>
    <div class="sub">The three circled parts in one: the shards, bars and surge bar from the top left, GUARD and STUN, and the PACK button. The cube is the game's own model (No. 814); its screen is now a face that shows how you are. Nothing in the game has changed yet.</div>
    <h2>IN THE GAME (an iPad's 1080 × 705)</h2>
    <div class="ba"><figure><img src="${img('game_before_1080.png')}"><figcaption>NOW</figcaption></figure><figure><img src="${img('game_after_1080_calm.png')}"><figcaption>WITH THE CORE: the top left is clear; the target dial stands above it; the dock slides in a narrower strip</figcaption></figure></div>
    <h2>HOW YOU USE IT</h2>
    <div class="use"><div class="big"><img src="${img('calm.png')}">${marks.map(m => `<div class="mk" style="left:${Math.round(m[1][0] * K)}px;top:${Math.round(m[1][1] * K)}px">${m[0]}</div>`).join('')}</div>
      <div><ol>${marks.map(m => `<li><i>${m[0]}</i><div><b>${m[2]}</b> · ${m[3]}</div></li>`).join('')}</ol><div class="face">Anywhere else it lets the tap through to the game. Its face reacts to what happens to you (below).</div></div></div>
    <h2>HOW IT REACTS</h2>
    <div class="grid">${S.map(s => `<div class="tile"><img src="${img(s[0] + '.png')}"><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
    <h2>YOUR CLASS</h2>
    <div class="cls"><div class="tile"><img src="${img('gun/calm.png')}"><b>GUNSLINGER</b><span>Its gun in its cables, amber trim.</span></div><div class="tile"><img src="${img('mech/calm.png')}"><b>TECHNOMANCER</b><span>Seated in its spider mech, cyan trim.</span></div><div class="tile"><img src="${img('coat/calm.png')}"><b>MUTATOR</b><span>Goggles and lab coat, purple trim.</span></div></div>
    <div class="notes"><b>Mine, provisional:</b> the faces, the colours, the sizes (the box is 340 × 270, about where the PACK button and the round buttons were), the dome, the lid as the PACK, and the narrower dock. The KIT and ammunition pills stay by the dial as now.</div>
  </div></body></html>`;
  const p = await b.newPage({ viewport: { width: 2000, height: 1000 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, 'core_sheet.png'), fullPage: true });
  console.log('ok', JSON.stringify(pts));
  await b.close();
})();
