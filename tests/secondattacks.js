// SECOND ATTACKS FOR EVERY FOLLOWER, AND THE ULTIMATES ON THE SQUAD CARDS (build 2026-11-07ss; js/moves.js, js/evolution.js, js/elements.js followerUltFire, js/party.js, js/draw.js).
// ASKED: "inherit second attacks on all the followers and have more visible ultimate bar on followers and access to use them", "Inherit from the design notes"; then the owner's answers: the eight forms the design
// notes give no second attack get "BASH for now"; "Apply both" (the Static Orb's CAPACITOR DISCHARGE in PINBALL's place, the Rotshard's CORRODE SHOT as its everyday shot); "Squad cards + world" for the Ultimates.
//   BASH         a short ram into the nearest enemy it can see: 1.5 × its attack, Crushing, pushed a tile, stunned half a second; every follower before it evolves has it too; a Mage locked on it walks in
//   CAPACITOR    the Static Orb stands still storing charges (one a 1.5 s, up to 4, enemies near or not), then may move; the player releases them into an enemy within 2 tiles: 1 + the charges enemies in a chain,
//                each 0.5 × its attack × the charges; RETREAT stops the charging; a switch loses them; its squad card's chip shows them and releases them
//   ULTIMATES    one way to fire one (followerUltFire): full or nothing, the duo first; the squad card's meter (ULT and the charge; full: ULTIMATE ▲, TAP, gold) fires it; the bar over a follower is bigger
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

function findChromium() {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    return null;
}
// THE REAL PAGE (a tablet): three squad members, one an unevolved follower; their Ultimate meters, a tap on a full one; a Static Orb on CAPACITOR DISCHARGE and its chip
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    shardCount = 5000; for (var i = followers.length; i < 3; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) followers[k].returningToCrystal = false;
    var so = followers[0], eg = followers[1], fh = followers[2]; so.evolved = 'staticorb'; so.element = 'electric'; so.role = 'brawler'; eg.evolved = undefined; eg.element = 'fire'; fh.evolved = 'hammerslug'; fh.element = 'core'; fh.role = 'camper';
    partyAdd([so, eg, fh]); partyTick(); partyBarRender(true); await wait(80);
    var card = function(f){ return $$('#squadBar .sb-slot').filter(function(s){ return s._unit === f; })[0]; };
    var meter = function(f){ var b = card(f).querySelector('.sb-ult'); return { hidden: b.hidden, full: b.classList.contains('full'), l: b.querySelector('.sb-ultl').textContent, n: b.querySelector('.sb-ultn').textContent, w: b.querySelector('u').style.width, h: Math.round(b.getBoundingClientRect().height) }; };
    eg.ultimateCharge = 40; fh.ultimateCharge = 100; partyBarRender(true); await wait(40);
    out.egg = meter(eg); out.full = meter(fh); out.cardH = Math.round(card(fh).getBoundingClientRect().height);
    // a tap on the full meter fires its Ultimate (its execute stubbed: the fire path is what is checked); a tap on one not full is a tap on the card (it selects)
    var u = followerUltimate(fh), keep = u.execute, ran = 0; u.execute = function(a){ ran++; a.ultimateCharge = 0; };
    click(card(fh).querySelector('.sb-ult')); await wait(40); out.fired = { ran: ran, charge: fh.ultimateCharge, after: meter(fh) }; u.execute = keep;
    selectedUnits.clear(); click(card(eg).querySelector('.sb-ult')); await wait(40); out.notFull = { sel: selectedUnits.has(eg), charge: eg.ultimateCharge };
    // THE STATIC ORB ON CAPACITOR DISCHARGE: its chip shows the charges; with an enemy close a tap releases them
    followerAltSet(so, 'capacitor_discharge'); so._cap = 3; partyBarRender(true); await wait(40);
    var ab = card(so).querySelector('.sb-ab'); out.chip = { text: ab.textContent, shown: card(so).classList.contains('has-ab'), title: ab.title };
    var S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), so.x + 1.2, so.y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = function(){}; actors.push(p); frame++;
    click(ab); await wait(40); out.release = { cap: so._cap, hurt: p.health < 1e6 }; p.dead = true;
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__sa'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = e.stdout || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__sa">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0;
        (function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
            for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
            globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__dmg = p => 1e6 - p.health;`);

    group('1. BASH (the eight forms the design notes give none, and every follower before it evolves)');
    await check('the eight forms have BASH as their second attack, and a follower that has not evolved has it; the others keep their own; a clone has none', () => {
        const r = J(`Object.values(EVOLUTIONS).filter(e => !e.legacy).map(e => e.id + ':' + evoMoveIds(e).join('/'))`);
        for (const id of ['jellyram', 'rimestar', 'hornshell', 'hammerslug', 'gooproxy', 'blightspider', 'hovershell', 'igloo']) ok(r.indexOf(id + ':bash') >= 0, id + ': ' + r.join(' '));
        same(r.filter(x => /bash/.test(x)).length, 8, 'forms with BASH'); same(r.filter(x => /:$/.test(x)).length, 0, 'forms with no second attack');
        same(J(`evoMoveIds(followerMoveDef({ isFollower: true })).join()`), 'bash', 'before it evolves'); same(J(`followerMoveDef({ isFollower: true, isClone: true })`), null, 'a clone');
    });
    await check('BASH rams the nearest enemy it can see within 1.8 tiles: it steps in, 1.5 × its attack (Crushing, its hit kind), the enemy pushed and stunned half a second; one farther is not touched; it waits its 4 s wind-up after', () => {
        const r = J(`(function(){ __clear(); const f = __fol('core', 'brawler', 'jellyram'), a = __foe(f.x + 1.5, f.y), far = __foe(f.x + 1.5 + 2, f.y + 1.5); let hit = null; const keep = applyDamage;
            globalThis.applyDamage = function (t, amt, src, el, rf, fx, kind) { if (src === f && t === a) hit = { amt, el: el || null, kind: kind === DMG_HIT_BASH }; return keep.apply(this, arguments); };
            try { followerAltSet(f, 'bash'); f._altWind = 1; frame++; evolutionTick(); } finally { globalThis.applyDamage = keep; }
            return { hit, power: f.power, dist: Math.hypot(a.x - f.x, a.y - f.y), push: Math.hypot(a.kbVX || 0, a.kbVY || 0), stun: a.stunned, far: __dmg(far), cd: f._sigCd, live: !!f._altLive }; })()`);
        ok(r.hit && Math.abs(r.hit.amt - r.power * 1.5) < 1e-6 && r.hit.el === null && r.hit.kind, 'the hit: ' + JSON.stringify(r));
        ok(Math.abs(r.dist - 0.8) < 0.05 || r.dist < 1, 'it did not step in: ' + r.dist); ok(Math.abs(r.push - 0.28) < 1e-6, 'the push: ' + r.push); same(r.stun, 30, 'the stun'); same(r.far, 0, 'the far enemy'); same(r.cd, 240, 'its wait (frames)');
    });
    await check('a follower before it evolves fights with BASH when it is chosen: the move runs from its own tick, and its INFO, the HUD card and the Command Center offer it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler'), a = __foe(f.x + 1.2, f.y); followerAltSet(f, 'bash'); f._altWind = 1; frame++; evolutionTick();
            const info = followerInfo(f).attacks.filter(s => /^ALTERNATE/.test(s.h)).map(s => s.h); const cc = ccMoveChoices([f]);
            return { hit: __dmg(a) > 0, alt: f.alt, info, cc: cc && cc.list.map(m => m.id).join() }; })()`);
        same(r.hit, true, 'it did not bash'); same(r.alt, 'bash', 'its mode'); same(r.info.join(), 'ALTERNATE · BASH · LOCKED ON', 'its INFO'); same(r.cc, 'normal,bash', 'the Command Center\'s ATTACK');
    });
    await check('a Mage locked on BASH walks in to use it (a close move), where on its normal attack it keeps its distance', () => {
        const r = J(`(function(){ __clear(); const f = __fol('ice', 'sniper', 'rimestar'); f.stance = undefined; const a = __foe(f.x + 5, f.y); a.update = () => {};
            const d0 = Math.hypot(a.x - f.x, a.y - f.y); for (let i = 0; i < 60; i++) { frame++; updateNPC(f); } const dNormal = Math.hypot(a.x - f.x, a.y - f.y);
            followerAltSet(f, 'bash'); for (let i = 0; i < 240 && Math.hypot(a.x - f.x, a.y - f.y) > 1.6; i++) { frame++; updateNPC(f); } const dBash = Math.hypot(a.x - f.x, a.y - f.y);
            return { d0, dNormal, dBash, reach: followerAltCloseReach(f) }; })()`);
        ok(r.dNormal > 3, 'on its normal attack it closed in: ' + JSON.stringify(r)); ok(r.dBash < 1.6, 'on BASH it kept away: ' + JSON.stringify(r)); same(r.reach, 1.8, 'its close reach');
    });

    group('2. CAPACITOR DISCHARGE (the Static Orb; PINBALL superseded)');
    await check('its moves are SONIC ROLL and CAPACITOR DISCHARGE; PINBALL is not open to it now', () => {
        same(J('evoMoveIds(EVOLUTIONS.staticorb).join()'), 'static_rush,capacitor_discharge', 'its moves');
        same(J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); return followerAltSet(f, 'pinball'); })()`), false, 'PINBALL set');
    });
    await check('locked on it, it stands still storing a charge every 1.5 s, enemies near or not, up to 4; full, it may move; RETREAT stops the charging and frees it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); followerAltSet(f, 'capacitor_discharge'); const out = { r0: capacitorRooted(f) };
            const x0 = f.x, y0 = f.y; player.x = f.x + 6; player.y = f.y; for (let i = 0; i < 89; i++) { frame++; evolutionTick(); updateNPC(f); } out.at89 = f._cap || 0; frame++; evolutionTick(); out.at90 = f._cap;
            out.still = Math.hypot(f.x - x0, f.y - y0) < 1e-9;
            for (let i = 0; i < 400; i++) { frame++; evolutionTick(); } out.full = f._cap; out.r1 = capacitorRooted(f);
            followerAltSet(f, 'capacitor_discharge'); f._cap = 1; f.retreatUntil = frame + 100; out.rRetreat = capacitorRooted(f); for (let i = 0; i < 200; i++) capacitorTick(f); out.retreatCap = f._cap;
            return out; })()`);
        same(r.r0, true, 'rooted while charging'); same(r.at89, 0, 'a charge before 1.5 s'); same(r.at90, 1, 'the first charge at 1.5 s'); same(r.still, true, 'it moved while charging');
        same(r.full, 4, 'the most it stores'); same(r.r1, false, 'rooted when full'); same(r.rRetreat, false, 'rooted while retreating'); same(r.retreatCap, 1, 'charged while retreating');
    });
    await check('the player releases them (never itself): with an enemy within 2 tiles it chains to 1 + the charges enemies, each 0.5 × its attack × the charges (electric), and the charges are spent; no enemy close, nothing happens and it says so', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); followerAltSet(f, 'capacitor_discharge'); f._cap = 2;
            const a = __foe(f.x + 1.5, f.y), b = __foe(f.x + 3.5, f.y), c = __foe(f.x + 5.5, f.y), d = __foe(f.x + 7.5, f.y); const out = {};
            for (let i = 0; i < 30; i++) { frame++; evolutionTick(); } out.auto = [a, b, c, d].map(__dmg).join();   // (it never fires on its own)
            frame++; out.fired = altChipTap(f); out.hits = [a, b, c, d].map(p => Math.round(__dmg(p) * 1000) / 1000); out.expect = Math.round(f.power * 0.5 * 2 * 1000) / 1000; out.cap = f._cap;
            const g = __fol('electric', 'brawler', 'staticorb'); followerAltSet(g, 'capacitor_discharge'); g.x = __C[0] - 20; g._cap = 3; floatingTexts.length = 0; out.far = [altChipTap(g), g._cap, floatingTexts.map(t => t.text).join()];
            return out; })()`);
        same(r.auto, '0,0,0,0', 'it fired on its own'); same(r.fired, true, 'the release');
        ok(r.hits[0] > 0 && r.hits[1] > 0 && r.hits[2] > 0 && r.hits[3] === 0, 'the chain (3 with 2 charges): ' + r.hits); same(r.cap, 0, 'the charges spent');
        same(r.far.join('|'), 'false|3|NO ENEMY CLOSE', 'no enemy close');
    });
    await check('a switch of attack loses the charges; its squad card\'s chip shows them, lit once one is stored', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); followerAltSet(f, 'capacitor_discharge'); const s0 = altChipState(f); f._cap = 3; const s3 = altChipState(f);
            followerAltSet(f, null); const lost = f._cap, s = altChipState(f); return { s0, s3, lost, s }; })()`);
        same(r.s0.text, '⚡ 0/4', 'empty'); same(r.s0.cls, 'wait', 'empty, dark'); same(r.s3.text, '⚡ 3/4', 'three'); same(r.s3.cls, '', 'three, lit'); same(r.lost, 0, 'the charges kept'); same(r.s, null, 'a chip off it');
    });

    group('3. THE ULTIMATES: fired from the squad card, and a bigger bar');
    await check('followerUltFire: only when full; a bonded pair both full and close fire the duo first; one that finds nothing keeps its charge; the double-tap uses it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('core', 'camper', 'hammerslug'); const u = followerUltimate(f), keep = u.execute; let ran = 0; u.execute = a => { ran++; a.ultimateCharge = 0; };
            f.ultimateCharge = 99; const half = followerUltFire(f); f.ultimateCharge = 100; const full = followerUltFire(f); u.execute = () => {}; f.ultimateCharge = 100; const nothing = followerUltFire(f); u.execute = keep;
            return { half, full, ran, nothing, kept: f.ultimateCharge }; })()`);
        same(r.half, false, 'not full'); same(r.full, true, 'full'); same(r.ran, 1, 'its Ultimate ran'); same(r.nothing, false, 'nothing to act on'); same(r.kept, 100, 'its charge');
        ok(/followerUltFire\(_tappedFollower\)/.test(rd('js/input.js')), 'the double-tap does not use it'); ok(/function followerUltFire[\s\S]{0,200}tryDuoUltimate\(f\)/.test(rd('js/elements.js')), 'the duo is not tried first');
    });
    await check('the bar over a follower is 40 × 5 (it was 28 × 3), with a light edge; full, it glows and a ▲ stands beside it', () => {
        const D = rd('js/draw.js'); ok(/const _ux = px - 20, _uy = py - 84, _uw = 40, _uh = 5/.test(D), 'its size'); ok(/if \(_ucFull\) \{ const a0 = drawCtx\.globalAlpha;[^\n]*fillRect\(_ux - 3, _uy - 3/.test(D), 'its glow'); ok(/fillText\("▲", px \+ 27, py - 78\)/.test(D), 'its ▲');
    });
    const T = measure(1180, 820);
    if (T === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the probe ran (a tablet)', () => { ok(T, 'the probe produced nothing'); same(T.err, undefined, 'the probe threw'); });
        if (T && !T.err) {
            await check('THE SQUAD CARD\'S ULTIMATE METER: ULT and the charge in it, in its element\'s colour; full, gold, taller, ULTIMATE ▲ and TAP', () => {
                same(JSON.stringify(T.egg), JSON.stringify({ hidden: false, full: false, l: 'ULT', n: '40%', w: '40%', h: 8 }), 'not full');
                same(JSON.stringify(T.full), JSON.stringify({ hidden: false, full: true, l: 'ULTIMATE ▲', n: 'TAP', w: '100%', h: 11 }), 'full'); same(T.cardH, 64, 'the card\'s height');
            });
            await check('a tap on the full meter fires the Ultimate and the meter empties; a tap on one not full is a tap on the card (it picks the follower)', () => {
                same(T.fired.ran, 1, 'its Ultimate ran'); same(T.fired.charge, 0, 'its charge'); same(T.fired.after.full, false, 'the meter after'); same(T.notFull.sel, true, 'the card was not picked'); same(T.notFull.charge, 40, 'the charge');
            });
            await check('THE STATIC ORB\'S CHIP on its squad card: ⚡ and the charges; a tap with an enemy close releases them', () => {
                same(T.chip.text, '⚡ 3/4', 'its chip'); same(T.chip.shown, true, 'the chip shown'); same(T.chip.title, 'CAPACITOR DISCHARGE · TAP TO RELEASE', 'its title');
                same(T.release.cap, 0, 'the charges'); same(T.release.hurt, true, 'the enemy');
            });
        }
    }
    console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
})();
