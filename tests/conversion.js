// THE CONVERSION AT THE PURIFICATION MODULE, AND BLOOM (docs/CONVERSION.md; build 2026-11-08i). `node tests/conversion.js`
// ASKED (the owner, 2026-11-08): "the purification module within the sewers, after it's been installed by the player, is the place where if the player brings a toxic creature on their squad, or a toxic
// creature is holding the area, then the player can interact with the machine, and a new pop-up menu comes shows up, and each creature who can convert is in a roster view, and the player can scroll through
// and pick the one that they want to convert, and then another pop-up menu shows up and shows the stats, stat conversion, and the roster card of the new creature that would be converted into." Chosen:
// "Only toxic ones there", "Same stats, show changes", "Stages, menus first".
//   BLOOM          the seventh element (js/config.js ELEMENTS, id "blossom"): pink, ×1 both ways, MEND on every hit; never found (a recruit, an egg, a creature), only converted.
//   THE MACHINE    the purifier mount once the module is in: no build, no cost; its use opens the panel with a toxic follower in the squad or holding the Sewers.
//   WHO            the toxic followers there; an evolved one (its BLOOM form) and a Technician (BLOOM's ability) cannot convert yet, and say so.
//   CONVERT        the element becomes BLOOM; level, XP, bond and stats stay; toxic cards come off; saved, and loaded back.
//   THE POP-UPS    (the real page) the roster strip, then the preview: both cards, the numbers side by side, what changes; two taps convert.
const fs = require('fs');
const vm = require('vm');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// THE REAL PAGE: the module installed, a toxic Brawler in the squad and a toxic Blight Spider holding the Sewers, the player at the module; the panel opened by the station's use, a card tapped, CONVERT tapped twice
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false;
    var st = _fp.stations.find(function(s){ return s.id === 'st_purifier'; }), at = facilityApproachTile(st.bb, STATION_RANGE - 0.3);
    player.x = player.targetX = player.visualX = at[0]; player.y = player.targetY = player.visualY = at[1]; player.fpPath = null;
    actors = actors.filter(function(a){ return !(a instanceof Predator) && !a.isFollower; }); followers.length = 0; for (var k in followerByElement) followerByElement[k].length = 0;
    var mk = function(el, role, evo){ spawnFollowerAtCrystal(el, role); var f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.role = role; f.x = player.x - 0.6; f.y = player.y; if (evo) { f.evolved = evo; energyFill(f); } return f; };
    var b = mk('toxic', 'brawler'), sp = mk('toxic', 'camper', 'blightspider'); partyTick(); partyPost(sp, 'sewers', true);
    questState('purify').installedAt = 1; questState('purify').purifiedAt = 2;
    out.room = partyRoomAt(player.x, player.y); out.verb = STATION_KINDS.purifier_mount.verbFn(st); out.name = STATION_KINDS.purifier_mount.name;
    out.use = stationUse(st); await wait(60); out.pending0 = _cv.pending; for (var k2 = 0; k2 < 60 && _cv.pending; k2++) { await wait(250); convertTick(); } out.pending = _cv.pending;   // (the Blight Spider's sheet loads, and its card is drawn again. The game's tick does that; it is called here too: in this headless page's virtual time the frames sometimes stop for the whole wait (seen: the frame count still, both pictures loaded), and nothing would draw it. Build 2026-11-09o)
    out.open = !!$('#convPanel.open'); out.cards = $$('#convPanel .cv-strip .cv-unit').map(function(e){ return [e.querySelector('.cv-n').textContent, (e.querySelector('.cv-why') || {}).textContent || '', e.classList.contains('off')]; });
    out.drawn = $$('#convPanel .cv-unit canvas').length; out.stripScrolls = getComputedStyle($('#convPanel .cv-strip')).overflowX;
    click($$('#convPanel .cv-strip .cv-unit').filter(function(e){ return !e.classList.contains('off'); })[0]); await wait(60);
    out.pair = $$('#convPanel .cv-pair .cv-unit .cv-n').map(function(e){ return e.textContent; });
    out.rows = $$('#convPanel table.cv-stats tr').map(function(tr){ return Array.prototype.slice.call(tr.children).map(function(td){ return td.textContent; }).join('|'); });
    out.changed = $$('#convPanel table.cv-stats tr.ch td:first-child').map(function(e){ return e.textContent; });
    var go = $('#convPanel button.cv-go'); out.goText = go && go.textContent; click(go); await wait(60);
    out.armedText = $('#convPanel button.cv-go').textContent; out.stillToxic = b.element; click($('#convPanel button.cv-go')); await wait(60);
    out.after = { element: b.element, label: unitTypeLabel(b), from: b.convertedFrom, level: b.level }; out.backToList = $$('#convPanel .cv-strip .cv-unit').length;
    out.overflow = document.documentElement.scrollWidth > innerWidth + 1;
  } catch (e) { out.error = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__cv'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); }); </script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = e.stdout || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cv">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`Math.random = (function(){ let s = 20261108; return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
        facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__st = () => _fp.stations.find(s => s.id === 'st_purifier');
        globalThis.__atModule = () => { const st = __st(), at = facilityApproachTile(st.bb, STATION_RANGE - 0.3); player.x = player.targetX = player.visualX = at[0]; player.y = player.targetY = player.visualY = at[1]; player.fpPath = null; return st; };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; if (typeof respawnQueue !== 'undefined') respawnQueue.length = 0; };
        globalThis.__mk = (el, role, evo) => { spawnFollowerAtCrystal(el, role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.role = role; f.x = player.x - 0.6; f.y = player.y; if (evo) { f.evolved = evo; energyFill(f); } return f; };
        globalThis.__quest = (installed) => { const Q = questState('purify'); Q.installedAt = installed ? 1 : 0; Q.purifiedAt = installed ? 2 : 0; };`);

    group('BLOOM, THE SEVENTH ELEMENT (js/config.js ELEMENTS: id "blossom", "bloom" being the retired BUNKER BLOOM\'s form)');
    check('it is in the list, named BLOOM, blossom pink, and marked as made only by conversion; the elements found (every random pick\'s pool) are the six without it', () => {
        const e = J('ELEMENTS.find(x => x.id === "blossom")');
        same(e && e.label, 'BLOOM', 'its name'); same(e.color, '#ff7ab8', 'its colour'); same(e.converted, true, 'conversion only');
        same(J('elementsFound().join()'), 'fire,electric,ice,flux,core,toxic', 'the elements found'); same(J('[...unlockedElements].sort().join()'), 'core,electric,fire,flux,ice,toxic', 'the pool of random picks');
        ok(J('EVOLUTIONS.bloom && EVOLUTIONS.bloom.legacy'), 'the retired BUNKER BLOOM keeps its id');
    });
    check('never found: 300 followers made with no element named, and 300 creatures\' elements drawn, are never BLOOM', () => {
        const r = J(`(function(){ __clear(); let n = 0; for (let i = 0; i < 300; i++) { spawnFollowerAtCrystal(); const f = followers[followers.length - 1]; if (f.element === 'blossom') n++; } const fs = followers.length; __clear();
            let m = 0; for (let i = 0; i < 300; i++) { const pool = [...unlockedElements]; if (pool[Math.floor(Math.random() * pool.length)] === 'blossom') m++; } return { n, fs, m }; })()`);
        same(r.n, 0, 'BLOOM followers'); same(r.fs, 300, 'followers made'); same(r.m, 0, 'BLOOM creatures');
    });
    check('outside the two triangles: ×1 against every element, and every element ×1 against it', () => {
        const r = J(`ELEMENTS.map(e => [getElementMultiplier('blossom', e.id), getElementMultiplier(e.id, 'blossom')])`);
        ok(r.every(p => p[0] === 1 && p[1] === 1), JSON.stringify(r));
    });
    check('an unevolved BLOOM follower is named by its element\'s name (BLOOM TECHNICIAN, not BLOSSOM); it has no element move (its hit is plain) and no Ultimate; under level 10 it does not evolve', () => {
        const r = J(`(function(){ __clear(); const f = __mk('blossom', 'camper'); f.level = 5; f.xp = 0; return { label: unitTypeLabel(f), ult: followerUltimate(f), evolved: evoCheck(f), still: f.evolved || null, moves: _IP_ATTACKS.blossom }; })()`);
        same(r.label, 'BLOOM TECHNICIAN', 'its name'); same(r.ult, null, 'its Ultimate'); same(r.evolved, false, 'it evolved'); same(r.still, null, 'its form'); same(r.moves.proc, 'mend', 'what its hits do');
    });
    check('a BLOOM Mage evolves at its level into the THORNWHIP, BLOOM\'s Mage (build 2026-11-08j): its name, its shot SEED SHOT and its alternate SEEDFALL, and its Ultimate PINK THICKET; a BLOOM Brawler into SUNDEW (build 2026-11-08k); a BLOOM Technician into the CORAL CRAB (build 2026-11-08m)', () => {
        const r = J(`(function(){ __clear(); const m = __mk('blossom', 'sniper'), b = __mk('blossom', 'brawler'), t = __mk('blossom', 'camper'); for (const f of [m, b, t]) { f.level = 12; f.xp = 0; }
            const did = [m, b, t].map(evoCheck); energyFill(m); return { did, forms: [m, b, t].map(f => f.evolved || null), label: unitTypeLabel(m), shot: EVOLUTIONS.shrub.shot, moves: evoMoveIds(EVOLUTIONS.shrub), ult: followerUltimate(m), lean: dmgLean(m), sub: equipSubclassOf(m) }; })()`);
        same(r.did.join(), 'true,true,true', 'who evolved'); same(r.forms.join(), 'shrub,sundew,coralcrab', 'their forms'); same(r.label, 'THORNWHIP', 'its name'); same(r.shot, 'SEED SHOT', 'its shot');
        same(r.moves.join(), 'seedfall', 'its alternate'); same(r.ult && r.ult.name, 'Pink Thicket', 'its Ultimate (PINK THICKET since build 2026-11-08l; open with BLOOM energy cards in its slots since build 2026-11-09s)'); same(r.lean, 2, 'its lean (Elemental, and an Elemental shot)'); same(r.sub, 'elemental', 'its subclass');
    });
    check('MEND: a BLOOM follower\'s hit heals the most hurt of yours within 4 tiles (the lowest share of health) by 2% of its max; one 5 tiles off, or at full health, is passed over; it counts itself', () => {
        const r = J(`(function(){ __clear(); __put0 = 0; const b = __mk('blossom', 'brawler'), near = __mk('fire', 'brawler'), far = __mk('ice', 'brawler'), full = __mk('core', 'brawler'); partyTick();
            b.x = 500; b.y = 500; near.x = 502; near.y = 500; far.x = 505.5; far.y = 500; full.x = 501; full.y = 500;
            for (const u of [b, near, far, full]) u.health = u.maxHealth; near.health = near.maxHealth * 0.5; far.health = far.maxHealth * 0.2;
            const foe = new Predator('beetle', 503, 500, 'fire'); foe.team = 'red'; foe.health = foe.maxHealth = 1e6; actors.push(foe);
            const h0 = near.health; applyDamage(foe, 10, b, 'blossom'); const healed = near.health - h0, farUntouched = far.health === far.maxHealth * 0.2, fullStays = full.health === full.maxHealth;
            near.health = near.maxHealth; b.health = b.maxHealth * 0.4; const s0 = b.health; applyDamage(foe, 10, b, 'blossom'); const self = b.health - s0;
            const nb = __mk('fire', 'brawler'); nb.x = 500; nb.y = 500; near.health = near.maxHealth * 0.5; const n0 = near.health; applyDamage(foe, 10, nb, 'fire'); const notBloom = near.health - n0;
            return { healed, want: near.maxHealth * 0.02, farUntouched, fullStays, self, selfWant: b.maxHealth * 0.02, notBloom }; })()`);
        ok(Math.abs(r.healed - r.want) < 0.01, 'healed ' + r.healed + ', want ' + r.want); same(r.farUntouched, true, 'the one 5.5 tiles off'); same(r.fullStays, true, 'the one at full health');
        ok(Math.abs(r.self - r.selfWant) < 0.01, 'itself: ' + r.self); same(r.notBloom, 0, 'a fire follower\'s hit');
    });

    group('THE MACHINE: the purifier mount, once the module is in');
    check('before the install: the install as it was (a build of 600 frames that takes the module); after it: the PURIFICATION MODULE, no build, no cost, its verb CONVERT', () => {
        const r = J(`(function(){ __quest(false); const K = STATION_KINDS.purifier_mount, st = __st(); const a = { name: K.name, build: K.build, cost: JSON.stringify(K.cost), verb: K.verbFn(st) };
            __quest(true); const b = { name: K.name, build: K.build, cost: JSON.stringify(K.cost), verb: K.verbFn(st) }; return { a, b }; })()`);
        same(r.a.name, 'PURIFIER MOUNT', 'its name before'); same(r.a.build, 600, 'the install\'s build'); same(r.a.cost, '[["purification_module",1]]', 'its cost'); same(r.a.verb, 'INSTALL THE PURIFICATION MODULE', 'its verb before');
        same(r.b.name, 'PURIFICATION MODULE', 'its name after'); same(r.b.build, 0, 'a build after'); same(r.b.cost, '[]', 'a cost after'); same(r.b.verb, 'CONVERT A TOXIC FOLLOWER INTO BLOOM', 'its verb after');
    });
    check('with no toxic follower there it says what to bring; a toxic follower in the squad, or one holding the Sewers, lets you use it; one holding another room does not count', () => {
        const r = J(`(function(){ __quest(true); const st = __atModule(); __clear(); partyTick(); const none = stationCan(st);
            const f = __mk('fire', 'brawler'); partyTick(); const fire = stationCan(st);
            const t = __mk('toxic', 'brawler'); partyTick(); const squad = stationCan(st), sq = partyIsMember(t);
            partyPost(t, 'arena', true); const elsewhere = stationCan(st), el = convertHere().length;
            partyPost(t, 'sewers', true); const holding = stationCan(st), hd = convertHere().length;
            return { none, fire, squad, sq, elsewhere, el, holding, hd }; })()`);
        same(r.none.ok, false, 'nobody'); same(r.none.why, 'BRING A TOXIC FOLLOWER: IN YOUR SQUAD, OR HOLDING THE SEWERS', 'what it says'); same(r.fire.ok, false, 'a fire follower');
        same(r.sq, true, 'in the squad'); same(r.squad.ok, true, 'a toxic follower in the squad'); same(r.elsewhere.ok, false, 'holding the arena'); same(r.el, 0, 'listed from the arena');
        same(r.holding.ok, true, 'holding the Sewers'); same(r.hd, 1, 'listed holding the Sewers');
    });
    check('while the module\'s cycle runs (installed, the water not clean yet: the queen\'s fight) the mount says THE MODULE IS RUNNING as before, and converts nobody', () => {
        const r = J(`(function(){ __quest(true); const Q = questState('purify'); Q.purifiedAt = 0; Q.cycleLeft = 600; const K = STATION_KINDS.purifier_mount, st = __atModule(); __clear(); const t = __mk('toxic', 'brawler'); partyTick();
            const o = { verb: K.verbFn(st), name: K.name, can: stationCan(st), apply: convertApply(t).ok, el: t.element }; Q.cycleLeft = 0; return o; })()`);
        same(r.verb, 'THE MODULE IS RUNNING', 'its verb'); same(r.name, 'PURIFIER MOUNT', 'its name'); same(r.can.ok, false, 'usable'); same(r.apply, false, 'converted'); same(r.el, 'toxic', 'its element');
    });
    check('before the install it converts nobody, even with a toxic follower there', () => {
        const r = J(`(function(){ __quest(false); __clear(); const t = __mk('toxic', 'brawler'); partyTick(); return { can: convertCan(), why: convertWhyNot(t), apply: convertApply(t), el: t.element }; })()`);
        same(r.can.ok, false, 'can'); same(r.why, 'THE PURIFICATION MODULE IS NOT READY: INSTALL IT AND LET IT RUN', 'why'); same(r.apply.ok, false, 'converted'); same(r.el, 'toxic', 'its element');
    });

    group('WHO: the toxic followers there; who cannot convert yet says why');
    check('an unevolved toxic Brawler, Mage and Technician can, and an evolved one (its BLOOM form in the game since builds 2026-11-08j, k and m); another element is not listed', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const br = __mk('toxic', 'brawler'), mg = __mk('toxic', 'sniper'), ev = __mk('toxic', 'brawler', 'seeper'), te = __mk('toxic', 'camper'), fi = __mk('fire', 'brawler');
            partyTick(); for (const f of [br, mg, ev, te, fi]) if (!partyIsMember(f)) partyPost(f, 'sewers', true);
            return { listed: convertHere().map(f => f.element + ':' + f.role + ':' + (f.evolved || '')), why: [br, mg, ev, te].map(convertWhyNot) }; })()`);
        same(r.listed.length, 4, 'listed: ' + r.listed.join()); ok(r.listed.every(s => s.indexOf('toxic') === 0), 'only toxic ones');
        same(JSON.stringify(r.why), JSON.stringify([null, null, null, null]), 'why (a Technician too, since build 2026-11-08m: REEF is built)');
    });

    check('an evolved toxic Mage (the Rotshard) can: its class\'s BLOOM form, the THORNWHIP, is in the game (build 2026-11-08j); so can an evolved toxic Brawler (the Seeper): SUNDEW (build 2026-11-08k)', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const m = __mk('toxic', 'sniper', 'rotshard'), b = __mk('toxic', 'brawler', 'seeper'); partyTick();
            return { why: [m, b].map(convertWhyNot), form: [m, b].map(f => (convertBloomForm(f) || {}).id || null) }; })()`);
        same(JSON.stringify(r.why), JSON.stringify([null, null]), 'why'); same(r.form.join(), 'shrub,sundew', 'their BLOOM forms');
    });
    group('CONVERT: the element becomes BLOOM; the rest stays; toxic cards come off; saved and loaded back');
    check('an evolved toxic Brawler (the Seeper) converts into SUNDEW (build 2026-11-08k): BLOOM, its form SUNDEW, its stats and health as they were, ERUPTION let go (SUNDEW has BASH); the preview shows the form and the moves before and after', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const m = __mk('toxic', 'brawler', 'seeper'); m.level = 12; _applyFollowerLevel(m, true); m.alt = 'eruption'; partyTick();
            const st = JSON.stringify(m.stats), hp = [m.health, m.maxHealth], g = convertPreview(m), mv = [_cvMoves(m), _cvMoves(g)], fm = [_cvFormName(m), _cvFormName(g)], res = convertApply(m);
            return { mv, fm, ok: res.ok, msg: res.msg, el: m.element, evo: m.evolved, alt: m.alt || null, same: JSON.stringify(m.stats) === st, hp: [m.health, m.maxHealth], hp0: hp, label: unitTypeLabel(m) }; })()`);
        same(r.fm.join('|'), 'SEEPER|SUNDEW', 'the FORM row'); same(r.mv[1], 'NECTAR STING · SWEET SCENT (LOCKED) · ULTIMATE CONSUME (LOCKED)', 'its moves after (NECTAR STING and SWEET SCENT since build 2026-11-08n; its Ultimate CONSUME)');
        ok(r.ok, 'it did not convert: ' + r.msg); same(r.el, 'blossom', 'its element'); same(r.evo, 'sundew', 'its form'); same(r.alt, null, 'its alternate (ERUPTION is not SUNDEW\'s)');
        ok(r.same, 'its stats changed'); same(r.hp.join(), r.hp0.join(), 'its health'); same(r.label, 'SUNDEW', 'its name');
    });
    check('an evolved toxic Mage converts into the THORNWHIP (build 2026-11-08j): BLOOM, its form the shrub, its stats and health as they were, its ROTTEN DECOY let go (the shrub has SEEDFALL); the preview shows the form and the moves before and after; saved and loaded as the shrub', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const m = __mk('toxic', 'sniper', 'rotshard'); m.level = 12; _applyFollowerLevel(m, true); m.alt = 'rotten_decoy'; partyTick();
            const st = JSON.stringify(m.stats), hp = [m.health, m.maxHealth], g = convertPreview(m), mv = [_cvMoves(m), _cvMoves(g)], fm = [_cvFormName(m), _cvFormName(g)], res = convertApply(m);
            const rec = followerRecord(m); __clear(); spawnFollowerFromSave(rec); const back = followers[followers.length - 1];
            return { preview: g.evolved, mv, fm, ok: res.ok, msg: res.msg, el: m.element, evo: m.evolved, alt: m.alt || null, same: JSON.stringify(m.stats) === st, hp: [m.health, m.maxHealth], hp0: hp, label: unitTypeLabel(m), back: [back.element, back.evolved, back.convertedFrom] }; })()`);
        same(r.preview, 'shrub', 'the preview\'s form'); same(r.fm.join('|'), 'ROTSHARD|THORNWHIP', 'the FORM row');
        same(r.mv.join('|'), 'CORRODE SHOT · ROTTEN DECOY · ULTIMATE TOXIC PUDDLE|SEED SHOT · SEEDFALL (LOCKED) · ULTIMATE PINK THICKET (LOCKED)', 'the MOVES row (its shot, its alternate, its Ultimate)');
        ok(r.ok, 'it did not convert: ' + r.msg); same(r.el, 'blossom', 'its element'); same(r.evo, 'shrub', 'its form'); same(r.alt, null, 'its alternate (ROTTEN DECOY is not the shrub\'s)');
        ok(r.same, 'its stats changed'); same(r.hp.join(), r.hp0.join(), 'its health'); same(r.label, 'THORNWHIP', 'its name'); ok(/IS NOW A THORNWHIP/.test(r.msg), 'the words: ' + r.msg);
        same(r.back.join(), 'blossom,shrub,toxic', 'saved and loaded back');
    });
    check('an evolved toxic Technician (the Blight Spider) converts into the CORAL CRAB (build 2026-11-08m): BLOOM, its form the coral crab, its ability REEF in place of TOXIC PODS (the preview\'s ABILITY row), its Ultimate REEF PILLAR; saved and loaded as the coral crab', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const t = __mk('toxic', 'camper', 'blightspider'); t.level = 12; _applyFollowerLevel(t, true); partyTick();
            const st = JSON.stringify(t.stats), g = convertPreview(t), ab = _cvAbility(t), mv = [_cvMoves(t), _cvMoves(g)], fm = [_cvFormName(t), _cvFormName(g)], res = convertApply(t);
            const rec = followerRecord(t); __clear(); spawnFollowerFromSave(rec); const back = followers[followers.length - 1];
            return { preview: g.evolved, ab, mv, fm, ok: res.ok, msg: res.msg, el: t.element, evo: t.evolved, now: (techAbilityOf(t) || {}).id, ult: (FORM_ULTIMATES[t.evolved] || {}).name, ultLocked: followerUltLocked(t), same: JSON.stringify(t.stats) === st, label: unitTypeLabel(t), back: [back.element, back.evolved, back.convertedFrom], brawler: _cvAbility(__mk('toxic', 'brawler')) }; })()`);
        same(r.preview, 'coralcrab', 'the preview\'s form'); same(r.fm.join('|'), 'BLIGHT SPIDER|STONEPETAL', 'the FORM row (STONEPETAL: the coral crab\'s name since build 2026-11-08n)'); same((r.ab || []).join('|'), 'TOXIC PODS|REEF', 'the ABILITY row'); same(r.brawler, null, 'an ABILITY row for a Brawler');
        ok(/ULTIMATE REEF PILLAR \(LOCKED\)$/.test(r.mv[1]), 'its moves after (locked: its toxic energy cards stay toxic, the owner, 2026-11-09: "Only an egg\'s card"): ' + r.mv[1]);
        ok(r.ok, 'it did not convert: ' + r.msg); same(r.el, 'blossom', 'its element'); same(r.evo, 'coralcrab', 'its form'); same(r.now, 'reef', 'its ability'); same(r.ult, 'Reef Pillar', 'its Ultimate'); same(r.ultLocked, true, 'its Ultimate locked until it holds BLOOM energy cards (its toxic ones stay toxic: the owner, 2026-11-09, "Only an egg\'s card")');
        ok(r.same, 'its stats changed'); same(r.label, 'STONEPETAL', 'its name'); same(r.back.join(), 'blossom,coralcrab,toxic', 'saved and loaded back');
    });
    check('its element is BLOOM, and it remembers it was toxic; its level, XP, stats, health and bond are as they were; it is named BLOOM BRAWLER', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const f = __mk('toxic', 'brawler'), mate = __mk('fire', 'mage'); partyTick(); f.level = 7; f.xp = 33; f.partnerUid = mate.uid = mate.uid || 'm1';
            const was = JSON.stringify({ level: f.level, xp: f.xp, stats: f.stats, hp: f.health, max: f.maxHealth, partner: f.partnerUid, role: f.role });
            const res = convertApply(f); const now = JSON.stringify({ level: f.level, xp: f.xp, stats: f.stats, hp: f.health, max: f.maxHealth, partner: f.partnerUid, role: f.role });
            return { res, el: f.element, from: f.convertedFrom, same: was === now, label: unitTypeLabel(f), again: convertWhyNot(f), table: [followerByElement.toxic.indexOf(f) >= 0, (followerByElement.blossom || []).indexOf(f) >= 0] }; })()`);
        same(r.res.ok, true, 'converted: ' + (r.res.why || '')); same(r.el, 'blossom', 'its element'); same(r.from, 'toxic', 'what it was'); same(r.same, true, 'its level, XP, stats, health, bond');
        same(r.label, 'BLOOM BRAWLER', 'its name'); same(r.again, 'ONLY A TOXIC FOLLOWER CONVERTS', 'a second conversion'); same(r.table.join(), 'false,true', 'the followers by element (toxic, BLOOM)');
    });
    check('a toxic element card it wore comes off (it stops fitting); a class card stays; the preview names the toxic one before it happens', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const f = __mk('toxic', 'brawler'); partyTick();
            equipFound = ['mireblight', 'impact_test']; f.cards = ['mireblight', 'impact_test']; equipRefresh(f); const kept0 = equipValid(f), worn0 = (f.cards || []).join();
            const named = convertCardsOff(f); convertApply(f); return { kept0, worn0, named, worn: (f.cards || []).join() }; })()`);
        same(r.kept0, 0, 'cards taken off before'); same(r.worn0, 'mireblight,impact_test', 'worn before'); same(r.named.join(), 'MIREBLIGHT', 'the preview\'s cards that come off');
        same(r.worn, ',impact_test', 'worn after (slot 1 empty, the class card IMPACT TEST in slot 2)');
    });
    check('saved and loaded back: a BLOOM follower stays BLOOM and remembers it was toxic; an old save\'s follower (no record of a conversion) loads unchanged', () => {
        const r = J(`(function(){ __quest(true); __atModule(); __clear(); const f = __mk('toxic', 'brawler'); partyTick(); convertApply(f);
            const rec = followerRecord(f), old = followerRecord(__mk('toxic', 'sniper')); delete old.conv; __clear();
            spawnFollowerFromSave(rec); const g = followers[followers.length - 1]; spawnFollowerFromSave(old); const h = followers[followers.length - 1];
            return { rec: [rec.element, rec.conv && rec.conv.from], g: [g.element, g.convertedFrom], h: [h.element, h.convertedFrom || null] }; })()`);
        same(r.rec.join(), 'blossom,toxic', 'the record'); same(r.g.join(), 'blossom,toxic', 'loaded'); same(r.h.join(), 'toxic,', 'an old save\'s follower');
    });
    check('the Ant Nest\'s test console offers BLOOM\'s evolved Mage (the THORNWHIP, build 2026-11-08j) and its unevolved Brawler and Mage, not its Technician (no ability yet)', () => {
        const r = J(`nestForms().filter(f => f.element === 'blossom').map(f => f.role + (String(f.id).indexOf(':') < 0 ? ':' + f.id : ''))`);
        same(r.join(), 'sniper:shrub,brawler:sundew,camper:coralcrab,brawler,sniper,camper', 'BLOOM\'s forms there');   // (SUNDEW since build 2026-11-08k; the coral crab and the unevolved Technician since 2026-11-08m)
    });
    check('the card art: a BLOOM follower\'s backdrop has its texture, and BLOOM has an emblem (approved 2026-11-08)', () => {
        const r = J(`(function(){ return { cls: cardArtUnitClass({ isFollower: true, element: 'blossom', role: 'brawler' }), tex: cardArtTexture('blossom').length, emb: !!CARD_ART_EMBLEMS.blossom }; })()`);
        ok(/blossom/.test(r.cls), 'its class: ' + r.cls); ok(r.tex > 300, 'its texture: ' + r.tex); same(r.emb, true, 'its emblem');
    });

    group('THE POP-UPS (the real page): the roster strip, then the preview; two taps convert');
    for (const [w, h, name] of [[1180, 820, 'a tablet'], [390, 740, 'a phone']]) {
        const R = measure(w, h);
        if (R === null) { console.log('  skip (no Chromium): ' + name); continue; }
        check(name + ': the station\'s use opens it; the strip lists the toxic ones there, the Blight Spider too (it converts into the coral crab since build 2026-11-08m); a tap on the Brawler shows NOW and AFTER, the numbers, and the changes; CONVERT arms, then converts', () => {
            ok(R && !R.error, 'the page: ' + (R && R.error));
            same(R.room, 'sewers', 'the player\'s room'); same(R.name, 'PURIFICATION MODULE', 'the station\'s name'); same(R.verb, 'CONVERT A TOXIC FOLLOWER INTO BLOOM', 'its verb'); same(R.open, true, 'the panel open');
            same(R.cards.length, 2, 'cards: ' + JSON.stringify(R.cards)); ok(R.cards.some(c => c[0] === 'TOXIC BRAWLER' && !c[2]), 'the Brawler'); ok(R.cards.some(c => c[0] === 'BLIGHT SPIDER' && !c[2]), 'the Blight Spider, not dimmed');
            same(R.drawn, 2, 'pictures'); same(R.stripScrolls, 'auto', 'the strip scrolls');
            same(R.pair.join(), 'TOXIC BRAWLER,BLOOM BRAWLER', 'now and after'); same(R.changed.join(), 'ELEMENT,ITS HITS,MOVES,EVOLVES INTO', 'what changes');
            ok(R.rows.some(r => /^HEALTH\|(\d+ \/ \d+)\|\1$/.test(r)), 'health side by side: ' + R.rows.join(' ; ')); ok(R.rows.some(r => /^ELEMENT\|TOXIC\|BLOOM$/.test(r)), 'the element row');
            ok(R.rows.indexOf('MOVES|PLAIN HIT|PLAIN HIT') >= 0, 'the moves row (an unevolved follower\'s plain hit, before and after; no element move nor Ultimate since build 2026-11-09b): ' + R.rows.filter(x => /^MOVES/.test(x)).join());
            same(R.pending, false, 'the evolved form\'s picture drawn once its sheet loaded (pending at first: ' + R.pending0 + ')');
            same(R.goText, 'CONVERT INTO BLOOM', 'the button'); same(R.armedText, 'TAP AGAIN TO CONVERT', 'armed'); same(R.stillToxic, 'toxic', 'after one tap');
            same(R.after.element, 'blossom', 'after two'); same(R.after.label, 'BLOOM BRAWLER', 'its name'); same(R.after.from, 'toxic', 'what it was'); same(R.backToList, 1, 'the list after (the Blight Spider)');
            same(R.overflow, false, 'the page scrolls sideways');
        });
    }

    console.log(failures ? '\n' + failures + ' FAILING' : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
