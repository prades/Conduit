// REEF'S TIP's two pictures (js/techabilities.js techReefTipShow; the owner's pick "C", 2026-11-12), made from the real game: an outcrop on the arena floor, an ant held at it and a hurt follower beside it;
// and a climb up the Catwalk Spur's west face (seen clear of the catwalks), the squad at its foot. Each is cut from a screenshot at twice the size (the tip shows them 300 x 136; the climb's wider cut is shrunk to fit).
//   node design/hud/reef_tip.js   ->  img/hud/reef_tip_outcrop.png, img/hud/reef_tip_climb.png   (then node tools/images.js, or the stamp, for their WebP copies and addresses)
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const path = require('path'), ROOT = path.join(__dirname, '..', '..'), W = 300, H = 136;
(async () => {
    const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
    const errs = []; page.on('pageerror', e => errs.push(String(e.message)));
    await page.goto('file://' + path.join(ROOT, 'game.html') + '?dev');
    await page.waitForFunction(() => typeof facilityPlayStart === 'function' && typeof techReefAt === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1200);
    const ev = (fn, arg) => page.evaluate(fn, arg);
    await ev(() => {
        unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3;
        if (typeof dialogueClear === 'function') dialogueClear(); classPickerOpen = false; techReefTipSeen = true;   // (no tip over its own pictures)
        window.__keep = new Set(); window.__calm = setInterval(() => { actors = actors.filter(a => a.isFollower || a.team === 'green' || __keep.has(a)); }, 40);
        const f = followers[0]; f.element = 'blossom'; f.role = 'camper'; f.evolved = 'coralcrab'; f.level = 12; _applyFollowerLevel(f, true); f._abReadyAt = 0;
        window.__put = (u, x, y) => { u.x = u.targetX = u.visualX = x; u.y = u.targetY = u.visualY = y; u._fpPath = null; u.fpPath = null; u.job = null; };
        window.__quiet = on => { if (on) { window.__tag = window.__tag || drawUnitTag; drawUnitTag = () => {}; floatingTexts.length = 0; } else if (window.__tag) drawUnitTag = window.__tag; };
        window.__css = (x, y) => { const q = _techScr(x, y), k = canvas.clientWidth / canvas.width; return { x: q.x * k, y: q.y * k }; };   // (a world point on the page, css px)
    });
    const cut = async (name, at, dy, k) => { const c = await ev(([x, y]) => __css(x, y), at), w = Math.round(W * (k || 1)), h = Math.round(H * (k || 1)); await page.screenshot({ path: path.join(ROOT, 'img', 'hud', name + '.png'), clip: { x: Math.round(c.x - w / 2), y: Math.round(c.y - h / 2 + dy), width: w, height: h } }); };
    // 1 · AN OUTCROP: a clear stretch of the arena's floor, the nearest such to its middle
    const spot = await ev(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms)), cs = partyRoomCells('arena'); let mx = 0, my = 0; cs.forEach(c => { mx += c[0]; my += c[1]; }); mx /= cs.length; my /= cs.length; let best = null;
        for (const c of cs) { let ok = true; for (let dx = -3; dx <= 3 && ok; dx++) for (let dy = -3; dy <= 3 && ok; dy++) if (!facilityStandOk(c[0] + dx, c[1] + dy)) ok = false; if (!ok) continue; const d = Math.hypot(c[0] - mx, c[1] - my); if (!best || d < best.d) best = { x: c[0], y: c[1], d }; }
        const t = followers.find(f => f.evolved === 'coralcrab'), mem = partyMembers().filter(q => q !== t), s = best;
        __put(player, s.x + 3.4, s.y + 3.4); __put(t, s.x - 1.3, s.y + 1.5); mem.forEach((m, i) => __put(m, s.x + 0.7 + i * 2.3, s.y + 0.9 + i * 2.6));   // (you off to the side: the camera's middle, out of the picture)
        t._abReadyAt = 0; await wait(300); techReefAt(t, { x: s.x, y: s.y });
        const ant = spawnCreature({ species: 'ant', className: 'worker', x: s.x - 1.1, y: s.y - 1.1, level: 1 }); __keep.add(ant); ant.update = () => {}; __put(ant, s.x - 0.85, s.y - 0.85);
        if (mem[0]) mem[0].health = Math.round(mem[0].maxHealth * 0.55);
        await wait(1500); const O = techReefs[techReefs.length - 1]; if (O) O.pressedAt = _techFrame(); __quiet(true); await wait(80);
        return { x: s.x, y: s.y };
    });
    await cut('reef_tip_outcrop', [spot.x, spot.y], -24);
    // 2 · A CLIMB up the Catwalk Spur's west face, the player beside its foot, the squad near
    const climb = await ev(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms)), t = followers.find(f => f.evolved === 'coralcrab'), mem = partyMembers().filter(q => q !== t);
        __quiet(false); for (const a of __keep) a.dead = true; __keep.clear(); techReset();
        __put(player, 42, 46); __put(t, 41.2, 44.6); mem.forEach((m, i) => __put(m, 40.6 + i * 0.9, 46.4 + i * 0.5)); await wait(300);
        t._abReadyAt = 0; const r = techReefClimbAt(t, { x: 47, y: 43 }); await wait(1600);
        const C = techClimbs[techClimbs.length - 1]; if (!C) return { ok: false, why: r.why };
        const m = _techClimbArt(C).mid; __put(player, m[0] - 0.6, m[1] + 1.6); await wait(500); __quiet(true); await wait(80);   // (beside its foot, not on it: a body on its foot goes over it; the climb at the screen's middle, clear of the HUD)
        return { ok: true, at: m, side: _techClimbArt(C).name };
    });
    if (!climb.ok) { console.log('no climb:', climb.why); await browser.close(); process.exit(1); }
    await cut('reef_tip_climb', climb.at, -34, 1.45);
    console.log('wrote img/hud/reef_tip_outcrop.png, img/hud/reef_tip_climb.png', errs.length ? 'PAGE ERRORS ' + JSON.stringify(errs.slice(0, 3)) : '');
    await browser.close();
})();
