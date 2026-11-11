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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    return null;
}
// THE REAL PAGE (a tablet): three squad members, one an unevolved follower; their Ultimate meters, a tap on a full one; a Static Orb on CAPACITOR DISCHARGE and its chip
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    shardCount = 5000; for (var i = followers.length; i < 3; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) followers[k].returningToCrystal = false;
    var so = followers[0], eg = followers[1], fh = followers[2]; so.evolved = 'staticorb'; so.element = 'electric'; so.role = 'brawler'; energyFill(so); eg.evolved = undefined; energyStart(eg, 'fire'); fh.evolved = 'hammerslug'; fh.element = 'core'; fh.role = 'camper'; energyFill(fh);
    partyAdd([so, eg, fh]); partyTick(); partyBarRender(true); await wait(80);
    var card = function(f){ return $$('#squadBar .sb-slot').filter(function(s){ return s._unit === f; })[0]; };
    var meter = function(f){ var b = card(f).querySelector('.sb-ult'); return { hidden: b.hidden, full: b.classList.contains('full'), l: b.querySelector('.sb-ultl').textContent, n: b.querySelector('.sb-ultn').textContent, w: b.querySelector('u').style.width, h: Math.round(b.getBoundingClientRect().height) }; };
    eg.ultimateCharge = 40; so.ultimateCharge = 40; fh.ultimateCharge = 100; partyBarRender(true); await wait(40);
    out.egg = meter(eg); out.half = meter(so); out.full = meter(fh); out.cardH = Math.round(card(fh).getBoundingClientRect().height);
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
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; if (evo) energyFill(f); f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__dmg = p => 1e6 - p.health;`);

    group('1. BASH (the eight forms the design notes give none, and every follower before it evolves)');
    await check('BASH is the second attack of a follower that has not evolved; every form has its own (the eight forms and the Electro Skink had BASH as a stand-in until build 2026-11-09c: tests/ninemoves.js); a clone has none', () => {
        const r = J(`Object.values(EVOLUTIONS).filter(e => !e.legacy).map(e => e.id + ':' + evoMoveIds(e).join('/'))`);
        for (const [id, mid] of [['jellyram', 'wobble_slam'], ['rimestar', 'icicle_volley'], ['hornshell', 'echo_pulse'], ['hammerslug', 'shell_guard'], ['gooproxy', 'phase_swap'], ['blightspider', 'venom_bite'], ['hovershell', 'shock_zap'], ['igloo', 'skate_charge'], ['electroskink', 'zigzag_dash']]) ok(r.indexOf(id + ':' + mid) >= 0, id + ': ' + r.join(' '));
        same(r.filter(x => /bash/.test(x)).length, 0, 'forms with BASH'); same(r.filter(x => /:$/.test(x)).length, 0, 'forms with no second attack');
        same(J(`evoMoveIds(followerMoveDef({ isFollower: true })).join()`), 'bash', 'before it evolves'); same(J(`followerMoveDef({ isFollower: true, isClone: true })`), null, 'a clone');
    });
    await check('BASH rams the nearest enemy it can see within 1.8 tiles: it steps in, 1.5 × its attack (Crushing, its hit kind), the enemy pushed and stunned half a second; one farther is not touched; it waits its time after (2 s since build 2026-11-10a: a Brawler\'s cooldown, a Mage\'s or a Technician\'s wind-up)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('core', 'brawler'), a = __foe(f.x + 1.5, f.y), far = __foe(f.x + 1.5 + 2, f.y + 1.5); let hit = null; const keep = applyDamage;   // (an unevolved Brawler: BASH is its second attack since build 2026-11-09c)
            globalThis.applyDamage = function (t, amt, src, el, rf, fx, kind) { if (src === f && t === a) hit = { amt, el: el || null, kind: kind === DMG_HIT_BASH }; return keep.apply(this, arguments); };
            try { followerAltSet(f, 'bash'); f._altWind = 1; frame++; evolutionTick(); } finally { globalThis.applyDamage = keep; }
            return { hit, power: f.power, dist: Math.hypot(a.x - f.x, a.y - f.y), push: Math.hypot(a.kbVX || 0, a.kbVY || 0), stun: a.stunned, far: __dmg(far), cd: f._sigCd, live: !!f._altLive }; })()`);
        ok(r.hit && Math.abs(r.hit.amt - r.power * 1.5) < 1e-6 && r.hit.el === null && r.hit.kind, 'the hit: ' + JSON.stringify(r));
        ok(Math.abs(r.dist - 0.8) < 0.05 || r.dist < 1, 'it did not step in: ' + r.dist); ok(Math.abs(r.push - 0.28) < 1e-6, 'the push: ' + r.push); same(r.stun, 30, 'the stun'); same(r.far, 0, 'the far enemy'); same(r.cd, 120, 'its wait (frames; half the old 240 since build 2026-11-10a)');
    });
    await check('THE TIMING BY CLASS (build 2026-11-10a; the owner: "the brawlers have a cooldown time and the mages have wind-up time and not vice versa", "Wind-up" for Technicians, "half as slow"): a Brawler locked on BASH rams the moment an enemy is in reach, with no wind-up, and then cools down 2 s once its effect is over, free to move; a Mage or a Technician winds up 2 s standing still first', () => {
        const r = J(`(function(){ __clear(); const o = {}, b = __fol('core', 'brawler'), a = __foe(b.x + 1.5, b.y); b._evoOnLevelUp = true; followerAltSet(b, 'bash');   /* (at level 20 it would evolve, every 30 frames, into a form whose second attack is not BASH: held off) */
            const x0 = b.x; frame++; evolutionTick(); o.brawler = { wind: b._altWind, hit: __dmg(a) > 0, live: !!b._altLive };
            elementEffects.length = 0; followerProjectiles.length = 0; frame++; evolutionTick(); o.cool = (b._altReadyAt || 0) - frame; o.coolRooted = b._altWind > 0;   // (its effect over: the sandbox does not age effects, so the test ends it)
            const hp = a.health; for (let i = 0; i < o.cool - 1; i++) { frame++; evolutionTick(); } o.inCool = a.health === hp; frame++; evolutionTick(); o.after = a.health < hp;
            for (const role of ['sniper', 'camper']) { __clear(); const f = __fol('core', role), e = __foe(f.x + 1.5, f.y); followerAltSet(f, 'bash'); frame++; evolutionTick(); o[role] = { wind: f._altWind, hit: __dmg(e) > 0, rooted: f._altWind > 0 }; }
            o.time = moveWindupFrames('bash'); __clear(); return o; })()`);
        same(JSON.stringify(r.brawler), JSON.stringify({ wind: 0, hit: true, live: true }), 'a Brawler did not ram at once, or wound up');
        same(r.cool, r.time, 'its cooldown once the effect was over'); same(r.coolRooted, false, 'rooted in its cooldown');
        same(r.inCool, true, 'it rammed again in its cooldown'); same(r.after, true, 'it did not ram again when its cooldown was over');
        for (const role of ['sniper', 'camper']) same(JSON.stringify(r[role]), JSON.stringify({ wind: r.time, hit: false, rooted: true }), role + ' did not wind up first, standing still');
        same(r.time, 120, 'BASH\'s time (frames; half the old 240)');
    });
    await check('a follower before it evolves fights with BASH when it is chosen: the move runs from its own tick, and its INFO, the HUD card and the Command Center offer it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler'), a = __foe(f.x + 1.2, f.y); followerAltSet(f, 'bash'); f._altWind = 1; frame++; evolutionTick();
            const info = followerInfo(f).attacks.filter(s => /^ALTERNATE/.test(s.h)).map(s => s.h); const cc = ccMoveChoices([f]);
            return { hit: __dmg(a) > 0, alt: f.alt, info, cc: cc && cc.list.map(m => m.id).join() }; })()`);
        same(r.hit, true, 'it did not bash'); same(r.alt, 'bash', 'its mode'); same(r.info.join(), 'ALTERNATE · BASH · LOCKED ON', 'its INFO'); same(r.cc, 'normal,bash,both:bash', 'the Command Center\'s ATTACK');
    });
    await check('a Mage locked on BASH walks in to use it (a close move), where on its normal attack it keeps its distance', () => {
        const r = J(`(function(){ __clear(); const f = __fol('ice', 'sniper'); f.stance = undefined; const a = __foe(f.x + 5, f.y); a.update = () => {};   // (an unevolved Mage: BASH is its second attack since build 2026-11-09c)
            const d0 = Math.hypot(a.x - f.x, a.y - f.y); for (let i = 0; i < 60; i++) { frame++; updateNPC(f); } const dNormal = Math.hypot(a.x - f.x, a.y - f.y);
            followerAltSet(f, 'bash'); for (let i = 0; i < 240 && Math.hypot(a.x - f.x, a.y - f.y) > 1.6; i++) { frame++; updateNPC(f); } const dBash = Math.hypot(a.x - f.x, a.y - f.y);
            return { d0, dNormal, dBash, reach: followerAltCloseReach(f) }; })()`);
        ok(r.dNormal > 3, 'on its normal attack it closed in: ' + JSON.stringify(r)); ok(r.dBash < 1.6, 'on BASH it kept away: ' + JSON.stringify(r)); same(r.reach, 1.8, 'its close reach');
    });

    group('1b. STAKE RING (STONEPETAL\'s own second attack, build 2026-11-08n: the owner\'s pick, in place of BASH)');
    await check('STONEPETAL\'s second attack is STAKE RING: every enemy it can see within 1.8 tiles takes 1.2 × its attack (its form\'s alternate: Piercing) and is pushed out from it; one farther is not touched; spikes rise round it; it waits its time after (2 s since build 2026-11-10a)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'camper', 'coralcrab'), a = __foe(f.x + 1.2, f.y), b = __foe(f.x - 0.8, f.y + 0.9), far = __foe(f.x + 3, f.y + 1); const hits = []; const keep = applyDamage;
            globalThis.applyDamage = function (t, amt, src, el, rf, fx, kind) { if (src === f) hits.push({ who: t === a ? 'a' : t === b ? 'b' : 'x', amt, alt: kind === DMG_HIT_ALT }); return keep.apply(this, arguments); };
            try { followerAltSet(f, 'stake_ring'); f._altWind = 1; frame++; evolutionTick(); } finally { globalThis.applyDamage = keep; }
            const out = (p) => (p.kbVX || 0) * (p.x - f.x) + (p.kbVY || 0) * (p.y - f.y) > 0;
            return { moves: evoMoveIds(EVOLUTIONS.coralcrab).join(), name: EVOLUTIONS.coralcrab.move, hits, power: f.power, out: [out(a), out(b)], far: __dmg(far), cd: f._sigCd, spikes: techSpikes.length, type: DMG_FORM.coralcrab.alt, reach: moveReach('stake_ring') }; })()`);
        same(r.moves, 'stake_ring', 'its moves'); same(r.name, 'STAKE RING', 'its move\'s name'); same(r.type, 'piercing', 'its type'); same(r.reach, 1.8, 'its reach');
        same(r.hits.map(h => h.who).sort().join(), 'a,b', 'who it hit'); ok(r.hits.every(h => Math.abs(h.amt - r.power * 1.2) < 1e-6 && h.alt), 'the hits: ' + JSON.stringify(r.hits));
        same(r.out.join(), 'true,true', 'pushed out from it'); same(r.far, 0, 'the far enemy'); same(r.cd, 120, 'its wait (frames; half the old 240 since build 2026-11-10a)'); ok(r.spikes >= 6, 'the spikes: ' + r.spikes);
    });
    await check('with no enemy in its reach when its wind-up ends, STAKE RING does not fire (ready again)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'camper', 'coralcrab'), far = __foe(f.x + 4, f.y); followerAltSet(f, 'stake_ring'); f._altWind = 1; frame++; evolutionTick(); return { far: __dmg(far), live: !!f._altLive }; })()`);
        same(r.far, 0, 'an enemy 4 tiles off'); same(r.live, false, 'it fired');
    });

    group('1c. SUNDEW\'s kit (build 2026-11-08n, the owner\'s): NECTAR STING fills its stockpile; SWEET SCENT puffs a lure, or heals when the stockpile is full');
    await check('its form: NECTAR STING its everyday hit (Piercing), SWEET SCENT its second attack in place of BASH; INFO names both', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'), info = followerInfo(f).attacks.map(s => s.h);
            return { hit: EVOLUTIONS.sundew.hit, moves: evoMoveIds(EVOLUTIONS.sundew).join(), main: DMG_FORM.sundew.main, info, reach: moveReach('sweet_scent'), windup: moveWindupFrames('sweet_scent') }; })()`);
        same(r.hit, 'NECTAR STING', 'its hit'); same(r.moves, 'sweet_scent', 'its second attack'); same(r.main, 'piercing', 'its hit\'s type'); same(r.reach, 5, 'the scent\'s reach'); same(r.windup, 150, 'its wind-up (frames; half the old 300 since build 2026-11-10a)');
        ok(r.info.some(h => h === 'MAIN ATTACK · NECTAR STING'), 'INFO: ' + r.info.join(' | ')); ok(r.info.some(h => /SWEET SCENT/.test(h)), 'INFO: ' + r.info.join(' | '));
    });
    await check('each NECTAR STING adds a quarter to its stockpile, up to full (four); another form\'s hit adds none; locked on SWEET SCENT it makes no sting, so nothing is added', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'), g = __fol('core', 'brawler', 'jellyram'), a = __foe(f.x + 0.8, f.y), steps = [];
            for (let i = 0; i < 5; i++) { f.attackCooldown = 0; followerAttack(f, a); steps.push(f._nectar); }
            g.attackCooldown = 0; followerAttack(g, a); const other = g._nectar || 0;
            f._nectar = 0; followerAltSet(f, 'sweet_scent'); f.attackCooldown = 0; followerAttack(f, a); return { steps, other, locked: f._nectar }; })()`);
        same(r.steps.join(), '25,50,75,100,100', 'the stockpile, sting by sting'); same(r.other, 0, 'another form'); same(r.locked, 0, 'locked on SWEET SCENT');
    });
    await check('SWEET SCENT, its stockpile not full: the puff, and every enemy it can see within 5 tiles goes for SUNDEW for 4 s (not a boss; not one farther); then they are let go', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'), mate = __fol('fire', 'brawler'), a = __foe(f.x + 3, f.y), boss = __foe(f.x - 2, f.y + 1), far = __foe(f.x + 7, f.y); boss.bossId = 'test';
            mate.x = a.x + 0.6; mate.y = a.y; f._nectar = 50; followerAltSet(f, 'sweet_scent'); f._altWind = 1; frame++; evolutionTick();
            const o = { fired: f._sigCd === moveWindupFrames('sweet_scent'), lured: scentLure(a) === f, boss: scentLure(boss), far: scentLure(far), prey: predatorPickPrey(a) === f, stock: f._nectar };
            frame += SCENT_FRAMES; o.after = scentLure(a); return o; })()`);
        same(r.fired, true, 'it fired'); same(r.lured, true, 'the enemy 3 tiles off'); same(r.prey, true, 'it goes for SUNDEW (not the follower beside it)'); same(r.boss, null, 'a boss'); same(r.far, null, 'an enemy 7 tiles off');
        same(r.stock, 50, 'the stockpile (a puff spends none)'); same(r.after, null, 'still lured after 4 s');
    });
    await check('SWEET SCENT, its stockpile full: it heals itself and your followers within 3 tiles 20% of their maximum health (one farther not), and the stockpile empties; no lure', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'), near = __fol('fire', 'brawler'), far = __fol('ice', 'brawler'), a = __foe(f.x + 3, f.y);
            near.x = f.x + 2; near.y = f.y; far.x = f.x - 4.5; far.y = f.y; for (const u of [f, near, far]) u.health = u.maxHealth * 0.5;
            const h0 = [f.health, near.health, far.health]; f._nectar = 100; followerAltSet(f, 'sweet_scent'); f._altWind = 1; frame++; evolutionTick();
            return { gain: [f.health - h0[0], near.health - h0[1], far.health - h0[2]], max: [f.maxHealth, near.maxHealth], stock: f._nectar, lured: scentLure(a) }; })()`);
        ok(Math.abs(r.gain[0] - r.max[0] * 0.2) < 1e-6, 'SUNDEW healed: ' + r.gain[0]); ok(Math.abs(r.gain[1] - r.max[1] * 0.2) < 1e-6, 'the follower 2 tiles off healed: ' + r.gain[1]); same(r.gain[2], 0, 'the follower 4.5 tiles off');
        same(r.stock, 0, 'the stockpile after'); same(r.lured, null, 'a lure with the heal');
    });
    await check('nothing in its reach and the stockpile not full: SWEET SCENT does not fire (ready again)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'); f._nectar = 25; followerAltSet(f, 'sweet_scent'); f._altWind = 1; frame++; evolutionTick(); return { live: !!f._altLive, stock: f._nectar }; })()`);
        same(r.live, false, 'it fired'); same(r.stock, 25, 'the stockpile');
    });

    group('2. CAPACITOR DISCHARGE (the Static Orb; PINBALL superseded)');
    await check('its moves are SONIC ROLL and CAPACITOR DISCHARGE; PINBALL is not open to it now', () => {
        same(J('evoMoveIds(EVOLUTIONS.staticorb).join()'), 'static_rush,capacitor_discharge', 'its moves');
        same(J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); return followerAltSet(f, 'pinball'); })()`), false, 'PINBALL set');
    });
    await check('locked on it, it stands still storing a charge every 0.75 s (1.5 s until build 2026-11-10a halved it), enemies near or not, up to 4; full, it may move; RETREAT stops the charging and frees it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); followerAltSet(f, 'capacitor_discharge'); const out = { r0: capacitorRooted(f) };
            const x0 = f.x, y0 = f.y; player.x = f.x + 6; player.y = f.y; for (let i = 0; i < 44; i++) { frame++; evolutionTick(); updateNPC(f); } out.at89 = f._cap || 0; frame++; evolutionTick(); out.at90 = f._cap;
            out.still = Math.hypot(f.x - x0, f.y - y0) < 1e-9;
            for (let i = 0; i < 400; i++) { frame++; evolutionTick(); } out.full = f._cap; out.r1 = capacitorRooted(f);
            followerAltSet(f, 'capacitor_discharge'); f._cap = 1; f.retreatUntil = frame + 100; out.rRetreat = capacitorRooted(f); for (let i = 0; i < 200; i++) capacitorTick(f); out.retreatCap = f._cap;
            return out; })()`);
        same(r.r0, true, 'rooted while charging'); same(r.at89, 0, 'a charge before 0.75 s'); same(r.at90, 1, 'the first charge at 0.75 s'); same(r.still, true, 'it moved while charging');
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
    await check('followerUltFire: only when full; one that finds nothing keeps its charge; the double-tap uses it; no DUO (a bond is for breeding since build 2026-11-09b); an unevolved follower and a flagged form fire nothing', () => {
        const r = J(`(function(){ __clear(); const f = __fol('core', 'camper', 'hammerslug'); const u = followerUltimate(f), keep = u.execute; let ran = 0; u.execute = a => { ran++; a.ultimateCharge = 0; };
            f.ultimateCharge = 99; const half = followerUltFire(f); f.ultimateCharge = 100; const full = followerUltFire(f); u.execute = () => {}; f.ultimateCharge = 100; const nothing = followerUltFire(f); u.execute = keep;
            const egg = __fol('fire', 'brawler', null), sk = __fol('electric', 'brawler', 'electroskink'); egg.ultimateCharge = sk.ultimateCharge = 100;
            return { half, full, ran, nothing, kept: f.ultimateCharge, egg: followerUltFire(egg), sk: followerUltFire(sk), eggKept: egg.ultimateCharge }; })()`);
        same(r.half, false, 'not full'); same(r.full, true, 'full'); same(r.ran, 1, 'its Ultimate ran'); same(r.nothing, false, 'nothing to act on'); same(r.kept, 100, 'its charge');
        ok(/followerUltFire\(_tappedFollower\)/.test(rd('js/input.js')), 'the double-tap does not use it'); ok(!/tryDuoUltimate/.test(rd('js/elements.js') + rd('js/bonds.js')), 'the duo is still there');
        same(r.egg + ',' + r.sk, 'false,false', 'an unevolved follower and the Electro Skink (flagged) fire nothing');
    });
    await check('the bar over a follower is 40 × 5 (it was 28 × 3), with a light edge; full, it glows and a ▲ stands beside it', () => {
        const D = rd('js/draw.js'); ok(/const _ux = px - 20, _uy = py - 84, _uw = 40, _uh = 5/.test(D), 'its size'); ok(/if \(_ucFull\) \{ const a0 = drawCtx\.globalAlpha;[^\n]*fillRect\(_ux - 3, _uy - 3/.test(D), 'its glow'); ok(/fillText\("▲", px \+ 27, py - 78\)/.test(D), 'its ▲');
    });
    const T = measure(1180, 820);
    if (T === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the probe ran (a tablet)', () => { ok(T, 'the probe produced nothing'); same(T.err, undefined, 'the probe threw'); });
        if (T && !T.err) {
            await check('THE SQUAD CARD\'S ULTIMATE METER: ULT and the charge in it, in its element\'s colour; full, gold, taller, ULTIMATE ▲ and TAP; none for a follower before it evolves (it has no Ultimate since build 2026-11-09b)', () => {
                same([T.egg.hidden, T.egg.h].join(), 'true,0', 'a meter for a follower before it evolves');   // (this probe expected one until 2026-11-10: in this container it had been skipped, finding no browser, so it never met the rule)
                same(JSON.stringify(T.half), JSON.stringify({ hidden: false, full: false, l: 'ULT', n: '40%', w: '40%', h: 8 }), 'not full');
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
