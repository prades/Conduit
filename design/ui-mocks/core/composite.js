// DRAFT HARNESS: the real page (this branch) at an iPad's size in the arena, BEFORE (as it is) and AFTER (the three corners' parts hidden: the shards, bars and surge at the top
// left, GUARD and STUN, the PACK button; THE CORE in the bottom-right corner, from out/<state>.png). The repo's files are read, never written.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve((process.argv.find(x => x.startsWith('--out=')) || '--out=/tmp/core-draft').slice(6));
const [VW, VH] = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '1080x705').split('x').map(Number), STATE = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'calm';
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'core-')), file = path.join(dir, 'game.html');
  fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">'));
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await p.goto('file://' + file + '?dev'); await p.waitForTimeout(2500);
  await p.evaluate(async () => {
    facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
    gfxLow = false; await document.fonts.ready; shardCount = 5859;
    const put = (u, x, y) => { u.x = x; u.y = y; if (u.targetX !== undefined) { u.targetX = x; u.targetY = y; } };
    player.x = player.targetX = player.visualX = 27.6; player.y = player.targetY = player.visualY = 49.2; player.fpPath = null; player.invuln = 1e9;
    actors = actors.filter(a => !(a instanceof Predator));
    const fol = (typeof partyMembers === 'function' ? partyMembers() : followers).filter(f => f && !f.dead);
    fol.forEach((f, i) => { put(f, 26.6 + i * 0.9, 48.0 + (i % 2) * 0.5); f.update = () => {}; f.returningToCrystal = false; });
    const A = _fp.F.byId.get('arena').bb, ant = spawnCreature({ species: 'ant', className: 'worker', x: (A[0] + A[2]) / 2, y: (A[1] + A[3]) / 2, level: 7 });
    put(ant, 29.4, 47.3); ant.update = () => {}; ant.element = 'fire'; ant.maxHealth = 120; ant.health = 80; ant.provoked = true;
    for (let i = 0; i < 40; i++) render();
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, 'game_before_' + VW + '.png') });
  const box = await p.evaluate((img) => {
    const css = document.createElement('style'); css.textContent = '#shards, #ui, #ultWrap, #btnPack { display: none !important; } body.corners { --pk-w: 320px; }'; document.head.appendChild(css);
    if (typeof drawPlayerCombatChips === 'function') window.drawPlayerCombatChips = function () {};
    // the dial (the locked creature, the gun's FIRE) stands above THE CORE, not over its arc
    const oldA = window._tgAnchor; window._tgAnchor = function () { const a = oldA(); if (a && a.corner) { const top = innerHeight - 4 - 270 - 10; if (a.y + a.R > top) { const d = a.y + a.R - top; a.y -= d; a.top -= d; } } return a; };
    for (let i = 0; i < 6; i++) render();
    const el = document.createElement('img'); el.src = img; el.style.cssText = 'position:fixed; right:6px; bottom:4px; width:340px; height:270px; z-index:13; pointer-events:none'; document.body.appendChild(el);
    const roster = [...document.querySelectorAll('button, div')].find(e => /^\s*ROSTER\s*$/.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    let dock = roster; for (let i = 0; i < 4 && dock && dock.parentElement; i++) { if (dock.parentElement.getBoundingClientRect().width > 400) { dock = dock.parentElement; break; } dock = dock.parentElement; }
    const r = dock ? dock.getBoundingClientRect() : null; return { dock: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null, dockId: dock ? dock.id || dock.className : null };
  }, 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, STATE + '.png')).toString('base64'));
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, 'game_after_' + VW + '_' + STATE + '.png') });
  console.log(JSON.stringify({ box, errs: errs.slice(0, 4) }));
  await b.close(); fs.rmSync(dir, { recursive: true, force: true });
})();
