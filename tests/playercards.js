// THE PLAYER CARDS: the rules and the Gunslinger's six roles (the following update's Part 1a, build 2026-11-02h; docs/UNIVERSAL-AND-PLAYER-CARDS.md section 2, "The 18 kits", approved by the owner 2026-11-02:
// "Approve as drafted"; docs/FOLLOWING-UPDATE.md Part 1). js/cards.js (the table, the words, the slots' rules), js/playercards.js (the kits), js/input.js (the gun's round), js/weapons.js (the laser, the guns' rate),
// js/technomancer.js (the jump's bolt), js/cardsui.js and game.html (a role asleep on the roster).
//   THE SIX       INCENDIARY GUNNER (fire, BURN), BLIGHT SHOOTER (toxic, WEAKNESS), ARC SLINGER (electric, a jump of 60% within 2.6 tiles), CRYO MARKSMAN (ice, SLOW; a FREEZE of 1.25 s on a creature already slowed, once in
//                 5 s; the guns 20% slower), RIFT RUNNER (flux, a PULL toward you; never a beetle or a boss), BREACH GUNNER (core, KNOCK BACK). Prototype, Series 2's (found before kept), not dealt until all 18 are in.
//   THE RULES     a role goes in only while you are its class; one role of a class at a time; after a switch of class it sleeps in its slot, greyed, doing nothing, and wakes when you switch back; kept through a save
//   THE KITS      on every round that hits, from any gun (the service gun, the machine gun, the laser's beam): the role's element for the triangle only (the hit stays physical: no elemental share), the status with
//                 Pack 1's Precision numbers on every hit (refreshed, never stacked)
// Part 1b (build 2026-11-02i): THE TECHNOMANCER'S SIX (the punch and the arc, the sentries, the relays, the lamp, SWAP, the shield). Part 1c (build 2026-11-02j): THE MUTATOR'S SIX (the lash and the clone's bites in
// the role's element; the clone's bites' statuses; the serum's pool; the free return and the clone preserved; SPLICER's last kill; CORE SHAPER's health and pace).
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
function near(a, b, tol, m) { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected about ${b}, got ${a}`); }

// the approved six (UNIVERSAL-AND-PLAYER-CARDS.md, the Gunslinger's table): id, name, element
const SIX = [['incendiary_gunner', 'INCENDIARY GUNNER', 'fire'], ['blight_shooter', 'BLIGHT SHOOTER', 'toxic'], ['arc_slinger', 'ARC SLINGER', 'electric'],
             ['cryo_marksman', 'CRYO MARKSMAN', 'ice'], ['rift_runner', 'RIFT RUNNER', 'flux'], ['breach_gunner', 'BREACH GUNNER', 'core']];

async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) { /* the page's own boot check says */ } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; globalThis.__sentries = _fp.items.filter(i => i.fp === 'prop' && i.kind === 'sentry'); _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries: they would shoot the creatures; FORGEMASTER's check puts one back)
        if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};
        // staged in the lower half of the Crystal Chamber, as tests/technomancer.js: open floor all round
        globalThis.__home = () => { player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 0; };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isNeutralRecruit); for (const f of followers) { f.x = crystal.x - 30; f.y = crystal.y; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; }
            respawnQueue.length = 0; floatingTexts.length = 0; followerProjectiles.length = 0; elementEffects.length = 0; _tc.fx.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; __home(); };
        globalThis.__class = id => { invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); if (id) classSet(id); };
        // a Gunslinger with the service gun, the selector on ICE (so a round's element is seen to be the role's), and these roles found for the run, the first worn
        globalThis.__gs = (...ids) => { __clear(); __class('gunslinger'); equipReset(); for (const id of ids) equipFound.push(id); if (ids[0]) equipPlayerPut(0, ids[0]); playerAmmo = 99; player.selectedElement = 'ice'; return equipPlayer.slice(); };
        globalThis.__creature = (sp, cl, dx, dy) => { const p = spawnCreature({ species: sp, className: cl, level: 3, x: player.x + dx, y: player.y + dy, state: 'hunt' }); p.provoked = true; p.element = null; p.spawnProtection = 0; p.update = () => {}; p.health = p.maxHealth = 1e6; return p; };
        globalThis.__dummy = (dx, dy) => __creature('ant', 'scout', dx, dy);
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        // fire at a creature and step the game until the round has landed (the round flies at 0.18 tiles a frame): the health it took, the round (its element and damage), and the frames it flew
        globalThis.__shoot = foe => { player.attackCooldown = 0; const h = foe.health, n0 = followerProjectiles.length, fired = firePlayerShot(foe); const p = followerProjectiles.length > n0 ? followerProjectiles[followerProjectiles.length - 1] : null, cd = player.attackCooldown;
            let k = 0; while (p && followerProjectiles.indexOf(p) >= 0 && k < 120) { render(); k++; }
            return { fired, lost: h - foe.health, el: p ? p.element : null, dmg: p ? p.damage : null, onHit: !!(p && p.onHit), frames: k, cd }; };
        globalThis.__said = w => floatingTexts.some(t => t.text === w);
        // a Technomancer with the gauntlet, these roles found for the run, the first worn
        globalThis.__tm = (...ids) => { __clear(); __class('technomancer'); equipReset(); for (const id of ids) equipFound.push(id); if (ids[0]) equipPlayerPut(0, ids[0]); technoCharge = 6; return equipPlayer.slice(); };
        // a punch that lands on a creature in reach: the health it took (the two beats: a wind-up, then the hit)
        globalThis.__punch = foe => { player.attackCooldown = 0; const h = foe.health; firePlayerShot(foe); let k = 0; while (h - foe.health < 0.001 && k < 90) { render(); k++; } return h - foe.health; };
        // the first relay and its box's spot
        globalThis.__relay = () => { const R = _fp.F.relays[0], p = facilityRelayAt(R.id); return { relay: R.id, x: p.x, y: p.y }; };   // (a relay is a node on a wall since build 2026-11-07qq: where it stands is the floor by its node)
        // a Mutator with the lash, these roles found for the run, the first worn
        globalThis.__mx = (...ids) => { __clear(); __class('mutator'); equipReset(); for (const id of ids) equipFound.push(id); if (ids[0]) equipPlayerPut(0, ids[0]); return equipPlayer.slice(); };
        // the Mutator's own clone (its primary clone, as the Clone Bay makes it: js/mutator.js mutatorCloneMade), an ant scout beside you
        globalThis.__mclone = () => { const c = makeClone('ant', 'scout', player.x + 1, player.y, 'hunt'); c.primary = true; c.upgrades = {}; c.invested = 0; cloneApplyUpgrades(c); c.health = c.maxHealth; c.attackCooldown = 0; return c; };
        // a creature (that does not move) a tile from the clone: in its bite's reach
        globalThis.__byClone = (c, dy) => { const e = __dummy(0, 0); e.x = c.x + 1; e.y = c.y + (dy || 0); return e; };`);
    return { run, J, store: sb.localStorage };
}

// ── the real page, for the roster (a role asleep is greyed) ──
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    playerClassKey = null; classSet('gunslinger'); equipPlayer = [null, null]; out.put = equipPlayerPut(0, 'incendiary_gunner');
    selectedUnits.clear(); ccOpen('roster'); await wait(300); click($('#ccGrid .cc-ytile')); await wait(120);
    var slot = function(n){ return $$('#ccSide .cc-dd').filter(function(d){ return d.querySelector('.cc-dd-k').textContent.indexOf('YOUR SLOT ' + n) === 0; })[0]; };
    var look = function(){ var ms = $$('#ccFocus .cf-pslot .cd-mini'), m = ms[0], zzEl = $('#ccFocus .cf-pzz'); return { asleep: !!m && m.classList.contains('asleep'), zz: $$('#ccFocus .cf-pzz').map(function(e){ return e.textContent; }).join(), filter: m ? getComputedStyle(m).filter : '',
        k: slot(1) ? slot(1).querySelector('.cc-dd-k').textContent : null, v: slot(1) ? slot(1).querySelector('.cc-dd-v').textContent : null, note: $$('#ccSide .cc-note').map(function(e){ return e.textContent; }).join('|'), label: m ? m.getAttribute('aria-label') : '',
        level: ms.length === 2 ? Math.abs(ms[0].getBoundingClientRect().top - ms[1].getBoundingClientRect().top) : -1, under: !!(zzEl && m) && zzEl.getBoundingClientRect().top >= m.getBoundingClientRect().bottom - 1,
        fits: slot(1) ? slot(1).scrollHeight <= slot(1).clientHeight + 1 : false }; };
    out.awake = look();
    classSet('technomancer'); ccRender(); await wait(150); out.asleep = look();
    click(slot(2)); await wait(80);
    out.list2 = $$('#cardPick .cp-tile').filter(function(b){ return /GUNNER|SHOOTER|SLINGER|MARKSMAN|RUNNER/.test(b.querySelector('.cp-nm').textContent); }).map(function(b){ return [b.querySelector('.cp-nm').textContent, b.disabled, (b.querySelector('.cp-st') || {}).textContent || '']; }); out.list2all = $$('#cardPick .cp-tile').map(function(b){ return b.querySelector('.cp-nm').textContent + (b.disabled ? ':off' : ''); }); cardPickClose();   // (the card picker since build 2026-11-07oo; only what fits since pp)
    classSet('gunslinger'); ccRender(); await wait(150); out.back = look();
    ccClose(); await wait(60);
    // GRAVITY ENGINEER's SWAP on a squad member's card (the corners layout: a tap on the member's card on the squad stack opens its card beside it)
    shardCount = 2500; for (var i = followers.length; i < 2; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) followers[k].returningToCrystal = false;
    classSet('technomancer'); equipPlayer = [null, null]; out.gput = equipPlayerPut(0, 'gravity_engineer'); selectedUnits.clear(); partyTick(); await wait(80);
    var s0 = $$('#squadBar .sb-slot')[0], m0 = s0 ? s0._unit : null; if (m0) { m0.post = null; m0.x = player.x + 0.6; m0.y = player.y; }   // (beside you, on your stretch of floor)
    click(s0); await wait(80); partyFlyRender(true); await wait(40);
    var row = $('#squadFly .sf-swaprow'), sb = function(){ return $('#squadFly .sf-swap'); }, sw = function(){ return ($('#squadFly .sf-swapw') || {}).textContent; };
    out.swap = { member: !!m0, shown: !!row && getComputedStyle(row).display !== 'none', text: sw(), disabled: !!(sb() && sb().disabled) };
    var p0 = [player.x, player.y], q0 = m0 ? [m0.x, m0.y] : [0, 0]; click(sb());
    out.swap.moved = !!m0 && player.x === q0[0] && player.y === q0[1] && m0.x === p0[0] && m0.y === p0[1];   // (read at once, as the tap made it: in the frames after, the member walks to its place in the formation, build 2026-11-10b)
    await wait(60); partyFlyRender(true); await wait(40);
    out.swap.after = sw(); out.swap.offAfter = !!(sb() && sb().disabled);
    equipPlayerPut(0, null); partyFlyRender(true); await wait(40); out.swap.hidden = !!row && getComputedStyle(row).display === 'none';
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__pc'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function page(w, h, query) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + (query || '')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__pc">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const A = await boot('');
    const { run, J } = A;

    group('THE GUNSLINGER\'S SIX (their names, themes and kits approved: "Approve as drafted")');
    await check('six PLAYER cards for the Gunslinger, one per element, each PROTOTYPE and Series 2\'s: INCENDIARY GUNNER, BLIGHT SHOOTER, ARC SLINGER, CRYO MARKSMAN, RIFT RUNNER, BREACH GUNNER', () => {
        const r = J(`EQUIP_PLAYER_CARDS.filter(row => row[2] === 'gunslinger' && row[3] !== 'blossom').map(row => { const c = EQUIP_CARDS[row[0]]; return [c.id, c.name, c.kind, c.match, c.kit.el, c.rarity, c.pack].join(); })`);
        same(r.length, 6, 'the Gunslinger\'s roles'); SIX.forEach(([id, name, el], i) => same(r[i], [id, name, 'player', 'gunslinger', el, 'prototype', 'series2'].join(), name));
        same(J(`Object.values(EQUIP_CARDS).filter(c => c.kind === 'player').length`), 21, 'Player cards in the game (the Gunslinger\'s, the Technomancer\'s and the Mutator\'s six, and BLOOM\'s three since build 2026-11-09a: tests/bloomcards.js; the two test cards are behind ?cards)');
    });
    await check('every number is one the game already has, or the approved new ones: the jump is the Technomancer arc\'s (2.6 tiles, 60%), the freeze the Frost Maw\'s stun (75 frames = 1.25 s), not again for 5 s (new), the guns 20% slower (new), the pull Pack 1\'s knockback (0.22) reversed; the statuses Pack 1\'s Precision cards\'', () => {
        const r = J(`({ jump: EQUIP_CARDS.arc_slinger.kit.jump, arc: [TECHNO.arc.chainRange, TECHNO.arc.chainPct], freeze: EQUIP_CARDS.cryo_marksman.kit.freeze, maw: MAW_STUN, slower: EQUIP_CARDS.cryo_marksman.kit.slower,
            pull: EQUIP_CARDS.rift_runner.kit.pull, push: EQUIP_CARDS.repulsor_pulse.proc.push, status: EQUIP_PLAYER_CARDS.map(r => [r[0], !!EQUIP_CARDS[r[0]].kit.status]), att: _EQUIP_ATTUNED })`);
        same([r.jump.radius, r.jump.share].join(), r.arc.join(), 'the jump against the arc\'s'); same(r.freeze.frames, r.maw, 'the freeze against the Frost Maw\'s stun'); same(r.freeze.again, 300, 'once in 5 s');
        same(r.slower, 0.2, 'the guns\' rate'); same(r.pull, r.push, 'the pull against Pack 1\'s knockback');
        same(r.status.filter(s => s[1]).map(s => s[0]).join(), 'incendiary_gunner,blight_shooter,cryo_marksman,breach_gunner', 'the roles that set their element\'s status (ARC SLINGER and RIFT RUNNER set none: their kits say so)');
        same([r.att.fire, r.att.toxic, r.att.ice, r.att.core].join(), 'cinderbrand,mireblight,rime_snare,repulsor_pulse', 'whose numbers');
    });
    await check('their words are made from their numbers; the kind line reads PLAYER · GUNSLINGER · FIRE (a test card still PLAYER); Pack 1\'s words are as they were', () => {
        const r = J(`({ t: EQUIP_PLAYER_CARDS.slice(0, 6).map(r => EQUIP_CARDS[r[0]].text), k: EQUIP_PLAYER_CARDS.slice(0, 6).map(r => equipKindLabel(EQUIP_CARDS[r[0]])), test: equipKindLabel({ kind: 'player', match: null }),
            p1: ['cinderbrand', 'mireblight', 'static_lock', 'rime_snare', 'siphon_field', 'repulsor_pulse'].map(id => EQUIP_CARDS[id].text) })`);
        same(r.t[0], 'YOUR ROUNDS ARE FIRE · EVERY HIT TO BURN: 3 DAMAGE A SECOND FOR 3 SECONDS', 'INCENDIARY GUNNER');
        same(r.t[1], 'YOUR ROUNDS ARE TOXIC · EVERY HIT TO POISON: IT HITS 40% WEAKER FOR 4 SECONDS', 'BLIGHT SHOOTER');
        same(r.t[2], 'YOUR ROUNDS ARE ELECTRIC · EACH SHOT JUMPS TO ONE MORE ENEMY WITHIN 2.6 TILES FOR 60%', 'ARC SLINGER');
        same(r.t[3], 'YOUR ROUNDS ARE ICE · EVERY HIT TO SLOW BY 25% FOR 2 SECONDS · A HIT ON AN ENEMY ALREADY SLOWED FREEZES IT FOR 1.25 SECONDS, ONCE IN 5 SECONDS · YOUR GUNS FIRE 20% SLOWER', 'CRYO MARKSMAN');
        same(r.t[4], 'YOUR ROUNDS ARE FLUX · EVERY HIT PULLS THE TARGET TOWARD YOU (NOT A BEETLE OR A BOSS)', 'RIFT RUNNER');
        same(r.t[5], 'YOUR ROUNDS ARE CORE · EVERY HIT TO KNOCK THE TARGET BACK', 'BREACH GUNNER');
        same(r.k.join('|'), 'PLAYER · GUNSLINGER · FIRE|PLAYER · GUNSLINGER · TOXIC|PLAYER · GUNSLINGER · ELECTRIC|PLAYER · GUNSLINGER · ICE|PLAYER · GUNSLINGER · FLUX|PLAYER · GUNSLINGER · CORE', 'the kind lines'); same(r.test, 'PLAYER', 'a test card');
        same(r.p1.join('|'), ['15% PER HIT TO BURN: 3 DAMAGE A SECOND FOR 3 SECONDS', '15% PER HIT TO POISON: IT HITS 40% WEAKER FOR 4 SECONDS', '10% PER HIT TO GLITCH: ITS WIND-UPS FAIL FOR 0.5 SECONDS', '20% PER HIT TO SLOW BY 25% FOR 2 SECONDS',
            '15% PER HIT TO HEAL 10% OF THE DAMAGE DEALT', '15% PER HIT TO KNOCK THE TARGET BACK'].join('|'), 'Pack 1\'s Precision words');
    });
    await check('where they come from: they are Series 2\'s, so found before they are kept (no outright ◆1,000 unlock); Series 2 deals them at Prototype since the following update\'s Part 1d ("All 18 together": its pool is 63, the 18 among them; 2,000 seeded packs deal every one of them, none before the purification; the market\'s shelf can offer one once Series 2 is open); found, ◆1,000 keeps one for good; Side Quest sells the toxic three (tests/sidequest.js); ?cards=all has every Player card to hand', () => {
        const r = J(`(function(){ __gs(); const keepQD = questDone; shardCount = 5000; const o = {};
            questDone = id => false; o.locked = [equipPackRoll(1, EQUIP_PACK2), equipShelfPool().filter(c => c.kind === 'player').length];   // (before the purification: no roll, none on the shelf)
            questDone = id => id === 'purify';
            o.pool = equipPackPool(EQUIP_PACK2).length; o.poolPlayer = equipPackPool(EQUIP_PACK2).filter(c => c.kind === 'player').length; const dealt = new Set(); let shelf = 0;
            for (let s = 1; s <= 2000; s++) for (const id of (equipPackRoll(s, EQUIP_PACK2) || [])) if (EQUIP_CARDS[id].kind === 'player') dealt.add(id);
            for (let s = 1; s <= 300; s++) for (const id of equipShelfDeal(s)) if (EQUIP_CARDS[id].kind === 'player') shelf++;
            o.dealt = dealt.size; o.shelf = shelf; o.why = equipUnlockWhyNot('incendiary_gunner'); equipFound.push('incendiary_gunner'); o.whyFound = equipUnlockWhyNot('incendiary_gunner'); o.unlock = equipUnlock('incendiary_gunner'); o.owned = equipOwns('incendiary_gunner'); o.shards = shardCount;
            questDone = keepQD; equipDevSet('all'); o.all = EQUIP_PLAYER_CARDS.filter(r => equipInHand(r[0])).length + '/' + EQUIP_PLAYER_CARDS.length; equipDevSet(''); return o; })()`);
        same(JSON.stringify(r.locked), '[null,0]', 'before the purification: a roll, or a Player card on the shelf');
        same(r.pool, 67, 'Series 2\'s pool (and the 4 card attacks since builds 2026-11-06q and r)'); same(r.poolPlayer, 18, 'Player cards in its pool'); same(r.dealt, 18, 'Player cards ever dealt in 2,000 packs'); ok(r.shelf > 0, 'no Player card on 300 shelves');
        same(r.why, 'FIND IT IN A PACK FIRST', 'an outright unlock'); same(r.whyFound, null, 'the unlock once found'); same(r.unlock, true, 'kept for good'); same(r.owned, true, 'owned'); same(r.shards, 4000, 'the shards after');
        same(r.all, '21/21', 'every Player card in the hand with ?cards=all');
    });

    group('THE RULES: it needs its class; one role of a class at a time; it sleeps after a switch of class');
    await check('a role goes in only while you are its class: before a class, as a Technomancer or a Mutator it says FOR THE GUNSLINGER and will not go in; as a Gunslinger it does; a follower is told FOR THE PLAYER', () => {
        const r = J(`(function(){ __gs(); equipFound.push('incendiary_gunner'); const o = {}; const why = () => equipPlayerWhyNot('incendiary_gunner', 0);
            playerClassKey = null; o.none = [why(), equipPlayerPut(0, 'incendiary_gunner')]; __class('technomancer'); o.tech = [why(), equipPlayerPut(0, 'incendiary_gunner')]; __class('mutator'); o.mut = [why(), equipPlayerPut(0, 'incendiary_gunner')];
            __class('gunslinger'); o.gs = [why(), equipPlayerPut(0, 'incendiary_gunner'), equipPlayer[0]]; o.follower = equipFit({ isFollower: true, element: 'fire', role: 'brawler' }, EQUIP_CARDS.incendiary_gunner); return o; })()`);
        same(r.none.join('|'), 'FOR THE GUNSLINGER|false', 'with no class'); same(r.tech.join('|'), 'FOR THE GUNSLINGER|false', 'a Technomancer'); same(r.mut.join('|'), 'FOR THE GUNSLINGER|false', 'a Mutator');
        same(r.gs.join('|'), '|true|incendiary_gunner', 'a Gunslinger'); same(r.follower, 'FOR THE PLAYER', 'a follower');
    });
    await check('one at a time: a second Gunslinger role is refused in the other slot (ONE GUNSLINGER ROLE AT A TIME), the same card twice too; another role takes the first one\'s own slot; only one role is ever awake', () => {
        const r = J(`(function(){ __gs('incendiary_gunner', 'blight_shooter'); const o = {}; o.second = [equipPlayerWhyNot('blight_shooter', 1), equipPlayerPut(1, 'blight_shooter')]; o.twice = equipPlayerWhyNot('incendiary_gunner', 1);
            o.swap = [equipPlayerWhyNot('blight_shooter', 0), equipPlayerPut(0, 'blight_shooter'), equipPlayer.join(), equipPlayerRole().id]; return o; })()`);
        same(r.second.join('|'), 'ONE GUNSLINGER ROLE AT A TIME|false', 'a second role'); same(r.twice, 'ALREADY IN THE OTHER SLOT', 'the same card twice');
        same(r.swap.join('|'), '|true|blight_shooter,|blight_shooter', 'a role in place of another');
    });
    await check('the test cards (no class) still go anywhere, with a role or each other, and are no role', () => {
        const r = J(`(function(){ equipDevSet('on'); __gs('incendiary_gunner', 'test_player_a', 'test_player_b'); const o = {}; o.withRole = [equipPlayerPut(1, 'test_player_a'), equipPlayer.join(), equipPlayerRole().id, equipPlayerAwake('test_player_a')];
            equipPlayer = [null, null]; __class('mutator'); o.both = [equipPlayerPut(0, 'test_player_a'), equipPlayerPut(1, 'test_player_b'), equipPlayer.join(), equipPlayerRole()]; equipDevSet(''); return o; })()`);
        same(r.withRole.join('|'), 'true|incendiary_gunner,test_player_a|incendiary_gunner|true', 'beside a role'); same(r.both.slice(0, 3).join('|'), 'true|true|test_player_a,test_player_b', 'two test cards, any class'); same(r.both[3], null, 'a test card is a role');
    });
    await check('a switch of class puts the role to sleep: it stays in its slot through the card tick, is not awake, and the gun\'s rounds are the selector\'s again with nothing on them; switching back wakes it', () => {
        const r = J(`(function(){ __gs('blight_shooter'); const o = {}; o.on = [equipPlayerRole().id, equipPlayerAwake('blight_shooter')];
            classSet('technomancer'); equipTick(true); weaponEquip('service'); o.asleep = [equipPlayer.join(), equipPlayerAwake('blight_shooter'), equipPlayerRole(), playerGunRole()];
            const e = __dummy(3, 0), s = __shoot(e); o.shot = [s.fired, s.el, s.onHit, e.toxicWeakened || 0];
            classSet('gunslinger'); equipTick(true); weaponEquip('service'); o.back = [equipPlayer.join(), equipPlayerAwake('blight_shooter'), equipPlayerRole().id]; const e2 = __dummy(3, 1), s2 = __shoot(e2); o.shot2 = [s2.el, e2.toxicWeakened > 0]; return o; })()`);
        same(r.on.join('|'), 'blight_shooter|true', 'worn and awake'); same(r.asleep.join('|'), 'blight_shooter,|false||', 'after the switch: kept, asleep, no role');
        same(r.shot.join('|'), 'true|ice|false|0', 'a round while asleep (the selector\'s ice, no kit, nothing on the creature)'); same(r.back.join('|'), 'blight_shooter,|true|blight_shooter', 'switched back'); same(r.shot2.join('|'), 'toxic|true', 'a round once awake');
    });
    await check('a role for each of two classes (two slots, three classes): each wakes with its class, the other sleeps; as the third class both sleep (a stand-in Technomancer role, for this check only)', () => {
        const r = J(`(function(){ EQUIP_CARDS.__tech_role = { id: '__tech_role', name: 'STAND-IN', kind: 'player', match: 'technomancer', rarity: 'prototype', kit: { el: 'electric' }, text: '' };
            __gs('incendiary_gunner', '__tech_role'); const o = {}; classSet('technomancer'); o.put = [equipPlayerWhyNot('__tech_role', 1), equipPlayerPut(1, '__tech_role')]; equipTick(true);
            o.tech = [equipPlayer.join(), equipPlayerRole().id, equipPlayerAwake('incendiary_gunner'), equipPlayerAwake('__tech_role')]; classSet('gunslinger'); equipTick(true); o.gs = [equipPlayerRole().id, equipPlayerAwake('__tech_role')];
            classSet('mutator'); equipTick(true); o.mut = [equipPlayer.join(), equipPlayerRole()]; delete EQUIP_CARDS.__tech_role; equipPlayer = [null, null]; return o; })()`);
        same(r.put.join('|'), '|true', 'the Technomancer\'s role beside the sleeping Gunslinger\'s'); same(r.tech.join('|'), 'incendiary_gunner,__tech_role|__tech_role|false|true', 'as a Technomancer');
        same(r.gs.join('|'), 'incendiary_gunner|false', 'as a Gunslinger'); same(r.mut.join('|'), 'incendiary_gunner,__tech_role|', 'as a Mutator');
    });
    await check('the slots keep what they may whatever the class, and drop the rest: a role out of the hand and not found goes on the tick; a load keeps a role asleep, keeps the first of two roles of one class, drops what is not a Player card or not a card', () => {
        const r = J(`(function(){ __gs('incendiary_gunner'); const o = {}; equipFound = []; equipTick(true); o.gone = equipPlayer.join();
            playerClassKey = 'mutator'; const ap = d => { equipSaveApply(d); return equipPlayer.join(); };
            o.asleep = ap({ hand: [], found: ['incendiary_gunner'], player: ['incendiary_gunner', null] }); o.two = ap({ hand: [], found: ['incendiary_gunner', 'blight_shooter'], player: ['incendiary_gunner', 'blight_shooter'] });
            o.bad = ap({ hand: [], found: ['incendiary_gunner', 'cinderbrand'], player: ['cinderbrand', 'nope'] }); o.junk = ap({ hand: [], found: [], player: 'x' }); o.notFound = ap({ hand: [], found: [], player: ['incendiary_gunner', null] }); return o; })()`);
        same(r.gone, ',', 'a role no longer found'); same(r.asleep, 'incendiary_gunner,', 'a role asleep on a load'); same(r.two, 'incendiary_gunner,', 'two roles of one class'); same(r.bad, ',', 'a Pack 1 card, an unknown id'); same(r.junk, ',', 'a slot list that is not one'); same(r.notFound, ',', 'a role not in the run');
    });
    await check('a game saved with a role asleep comes back with it asleep in its slot, and it wakes when you switch back', async () => {
        const store = {}, S = await boot('', store);
        S.run(`__gs('incendiary_gunner'); classSet('mutator'); facilitySaveWrite();`);
        const saved = JSON.parse(store.conduit_fp_save || 'null'); ok(saved && saved.cards, 'no save was written'); same(saved.cards.player.join(), 'incendiary_gunner,', 'the slots in the save'); same(saved.cls, 'mutator', 'the class in the save');
        const B = await boot('', store), r = B.J(`(function(){ const o = { cls: playerClassKey, slots: equipPlayer.join(), awake: equipPlayerAwake('incendiary_gunner'), role: equipPlayerRole() }; classSet('gunslinger'); o.after = [equipPlayerAwake('incendiary_gunner'), equipPlayerRole() && equipPlayerRole().id]; return o; })()`);
        same(r.cls, 'mutator', 'the class'); same(r.slots, 'incendiary_gunner,', 'the slots'); same(r.awake, false, 'awake as a Mutator'); same(r.role, null, 'a role as a Mutator'); same(r.after.join('|'), 'true|incendiary_gunner', 'a Gunslinger again');
    });

    group('THE KITS: on every round that hits (the real game loop: the round flies and lands)');
    await check('no role: a round is the selector\'s element and sets nothing, as before', () => {
        const r = J(`(function(){ __gs(); const e = __dummy(3, 0), s = __shoot(e); return [s.fired, s.el, s.onHit, s.lost > 0, e.burning || 0, e.toxicWeakened || 0, e.slowed || 0, e.stunned || 0, e.kbVX || 0]; })()`);
        same(r.join('|'), 'true|ice|false|true|0|0|0|0|0', 'a plain round');
    });
    await check('rule 2, the triangle only: INCENDIARY GUNNER\'s round is fire whatever the selector, ×' + '1.3 on a flux creature (fire beats flux), and on a creature with no element it takes exactly what a plain round takes (no elemental share is added: the hit stays Projectile)', () => {
        const r = J(`(function(){ __gs(); const a = __dummy(3, 0), sa = __shoot(a); a.dead = true; actors = actors.filter(x => x !== a);
            __gs('incendiary_gunner'); const b = __dummy(3, 0), sb = __shoot(b); b.dead = true; actors = actors.filter(x => x !== b);
            const c = __dummy(3, 0); c.element = 'flux'; const sc = __shoot(c); return { plain: sa.lost, role: sb.lost, flux: sc.lost, el: [sb.el, sc.el], mult: getElementMultiplier('fire', 'flux') }; })()`);
        same(r.el.join(), 'fire,fire', 'the rounds\' element'); near(r.role, r.plain, 1e-9, 'a role\'s round on a creature with no element against a plain one'); near(r.flux / r.role, r.mult, 1e-9, 'the triangle on a flux creature'); same(r.mult, 1.3, 'fire on flux');
    });
    await check('INCENDIARY GUNNER: every round that hits sets BURN (3 a second for 3 s: 1 a tick, 180 frames); a second round refreshes it, never stacks', () => {
        const r = J(`(function(){ __gs('incendiary_gunner'); const e = __dummy(3, 0); __shoot(e); const o = { a: [e.burning, e.burnDamage, __said('BURN')] }; __frames(30); __shoot(e); o.b = [e.burning, e.burnDamage]; return o; })()`);
        same(r.a.join('|'), '180|1|true', 'after one round'); same(r.b.join('|'), '180|1', 'after a second (refreshed, not stacked)');
    });
    await check('BLIGHT SHOOTER: every round that hits WEAKENS (the game\'s POISON: its bite 40% weaker for 4 s)', () => {
        const r = J(`(function(){ __gs('blight_shooter'); const e = __dummy(3, 0), s = __shoot(e); return [s.el, e.toxicWeakened, e.toxicWeakenFactor, __said('POISON')]; })()`);
        same(r.join('|'), 'toxic|240|0.6|true', 'the weakness');
    });
    await check('BREACH GUNNER: every round that hits KNOCKS the creature BACK, away from where it was fired (Pack 1\'s push, 0.22: about 0.8 tiles)', () => {
        const r = J(`(function(){ __gs('breach_gunner'); const e = __dummy(3, 0), d0 = Math.hypot(e.x - player.x, e.y - player.y), s = __shoot(e); const kb = Math.hypot(e.kbVX, e.kbVY), away = e.kbVX * (e.x - player.x) + e.kbVY * (e.y - player.y) > 0;
            __frames(40); return [s.el, Math.round(kb * 1000) / 1000, away, Math.round((Math.hypot(e.x - player.x, e.y - player.y) - d0) * 100) / 100]; })()`);
        same(r.slice(0, 3).join('|'), 'core|0.22|true', 'the push'); near(r[3], 0.79, 0.06, 'how far it went');
    });
    await check('RIFT RUNNER: every round that hits PULLS the creature toward you (the knockback reversed, 0.22); a beetle and a boss are never pulled; nothing else is set (no siphon)', () => {
        const r = J(`(function(){ __gs('rift_runner'); const e = __dummy(3, 0), d0 = Math.hypot(e.x - player.x, e.y - player.y), s = __shoot(e); const toward = e.kbVX * (player.x - e.x) + e.kbVY * (player.y - e.y) > 0, kb = Math.hypot(e.kbVX, e.kbVY);
            __frames(40); const o = { a: [s.el, Math.round(kb * 1000) / 1000, toward, e.burning || 0, e.toxicWeakened || 0, e.slowed || 0], moved: Math.round((d0 - Math.hypot(e.x - player.x, e.y - player.y)) * 100) / 100 };
            const b = __creature('beetle', 'worker', 3, 1); __shoot(b); o.beetle = [b.kbVX || 0, b.kbVY || 0]; const q = __dummy(3, -1); q.isBoss = true; __shoot(q); o.boss = [q.kbVX || 0, q.kbVY || 0]; return o; })()`);
        same(r.a.join('|'), 'flux|0.22|true|0|0|0', 'the pull, and nothing else'); near(r.moved, 0.79, 0.06, 'how far it came'); same(r.beetle.join(), '0,0', 'a beetle pulled'); same(r.boss.join(), '0,0', 'a boss pulled');
    });
    await check('CRYO MARKSMAN: every round SLOWS (25% for 2 s); a round on a creature ALREADY slowed FREEZES it (a stun of 75 frames, FROZEN), and not again for 5 s; after that the next round on a slowed creature freezes it again', () => {
        const r = J(`(function(){ __gs('cryo_marksman'); const e = __dummy(3, 0), o = {}; const s1 = __shoot(e); o.first = [s1.el, e.slowed, e.slowFactor, e.stunned || 0];
            const s2 = __shoot(e); o.second = [e.stunned, __said('FROZEN'), e.slowed]; const at = frame; __frames(80); o.thawed = e.stunned || 0; floatingTexts.length = 0; __shoot(e); o.third = [e.slowed > 0, e.stunned || 0, __said('FROZEN')];
            __frames(Math.max(0, at + 300 - frame)); __shoot(e); __shoot(e); o.again = [e.stunned > 0, __said('FROZEN')]; return o; })()`);
        same(r.first.join('|'), 'ice|120|0.75|0', 'a first round: slowed, not frozen'); same(r.second.join('|'), '75|true|120', 'a round on the slowed creature: frozen'); same(r.thawed, 0, 'the stun ran out');
        same(r.third.join('|'), 'true|0|false', 'within 5 s: slowed, not frozen again'); same(r.again.join('|'), 'true|true', '5 s after the freeze');
    });
    await check('CRYO MARKSMAN fires every gun 20% slower (its rate × 0.8: the wait between shots ÷ 0.8): the service gun 45 → 56 frames, the machine gun 11 → 14, the laser 28 → 35; a shot rests that long; with no role, as before', () => {
        const r = J(`(function(){ __gs(); classGrant('machinegun'); weaponOwned.laser = true; const ids = ['service', 'machinegun', 'laser']; const o = { before: ids.map(id => weaponCooldown(id)) };
            equipFound.push('cryo_marksman'); equipPlayerPut(0, 'cryo_marksman'); o.after = ids.map(id => weaponCooldown(id)); const e = __dummy(3, 0); o.rest = __shoot(e).cd; equipPlayerPut(0, null); o.off = ids.map(id => weaponCooldown(id)); return o; })()`);
        same(r.before.join(), '45,11,28', 'the waits before'); same(r.after.join(), '56,14,35', 'the waits with CRYO MARKSMAN'); same(r.rest, 56, 'the rest after a shot'); same(r.off.join(), '45,11,28', 'the card off');
    });
    await check('ARC SLINGER: each shot jumps on to the nearest other creature within 2.6 tiles of the first, for 60% of the round\'s damage (Projectile, electric); one jump a shot (no chain); none out of reach; the arc\'s bolt is drawn from creature to creature', () => {
        const r = J(`(function(){ __gs('arc_slinger'); const e1 = __dummy(3, 0), e2 = __dummy(3, 2), e3 = __dummy(3, -2.7), e4 = __dummy(3, 4.2);
            const H = [e1, e2, e3, e4].map(a => a.health), s = __shoot(e1), lost = [e1, e2, e3, e4].map((a, i) => H[i] - a.health); const bolt = _tc.fx.filter(z => z.low).map(z => z.pts.map(p => p.map(v => Math.round(v * 10) / 10)));
            const o = { el: s.el, dmg: s.dmg, lost, bolt, want: [[Math.round(e1.x * 10) / 10, Math.round(e1.y * 10) / 10], [Math.round(e2.x * 10) / 10, Math.round(e2.y * 10) / 10]] };
            e2.dead = true; actors = actors.filter(a => a !== e2); const h3 = e3.health; __shoot(e1); o.out = h3 - e3.health; return o; })()`);
        same(r.el, 'electric', 'the round'); ok(r.lost[0] > 0, 'the first took nothing'); near(r.lost[1] / r.lost[0], 0.6, 1e-9, 'the jump against the hit');
        same(r.lost[2], 0, 'a creature 2.7 tiles away'); same(r.lost[3], 0, 'a second jump (to the creature 2.2 tiles beyond the one jumped to)');
        same(r.bolt.length, 1, 'the bolts drawn'); same(JSON.stringify(r.bolt[0]), JSON.stringify(r.want), 'the bolt from the first creature to the second'); same(r.out, 0, 'no creature in reach: a jump to one out of it');
    });
    await check('ARC SLINGER never jumps to one of yours: with only a unit of your team within reach of the first creature, the shot jumps nowhere', () => {
        const r = J(`(function(){ __gs('arc_slinger'); const e1 = __dummy(3, 0), g = __dummy(3, 1); g.team = 'green'; const hg = g.health; __shoot(e1); return [hg - g.health, _tc.fx.filter(z => z.low).length]; })()`);
        same(r.join('|'), '0|0', 'what your unit took, and the bolts drawn');
    });
    await check('a role works on every gun (rule 1): the machine gun\'s rounds and the laser\'s beam; on the laser the creature aimed at and the one the beam goes through both burn; ARC SLINGER\'s laser shot jumps to a creature the beam missed, not to one it went through', () => {
        const r = J(`(function(){ __gs('incendiary_gunner'); classGrant('machinegun'); weaponEquip('machinegun'); const m = __dummy(3, 0), sm = __shoot(m); const o = { mg: [playerWeapon, sm.el, m.burning] };
            __gs('incendiary_gunner'); weaponOwned.laser = true; weaponEquip('laser'); laserCharge = 12; const a = __dummy(3, 0), b = __dummy(5, 0), c = __dummy(3, 2); player.attackCooldown = 0; firePlayerShot(a); o.laser = [a.burning, b.burning, c.burning || 0];
            __gs('arc_slinger'); weaponOwned.laser = true; weaponEquip('laser'); laserCharge = 12; const p = __dummy(3, 0), q = __dummy(4.5, 0), s = __dummy(3, 2); const H = [p, q, s].map(x => x.health); player.attackCooldown = 0; firePlayerShot(p);
            const L = [p, q, s].map((x, i) => H[i] - x.health); o.arc = [L[1] / L[0], L[2] / L[0]]; return o; })()`);
        same(r.mg.join('|'), 'machinegun|fire|180', 'the machine gun'); same(r.laser.join('|'), '180|180|0', 'the laser: aimed, behind, beside');
        near(r.arc[0], 0.6, 1e-9, 'the creature the beam went through (its pierce, 60%, and no jump)'); near(r.arc[1], 0.6, 1e-9, 'the creature beside (the jump, 60%)');
    });
    await check('a round that kills sets nothing on the dead; nothing throws', () => {
        const r = J(`(function(){ __gs('incendiary_gunner'); const e = __dummy(3, 0); e.health = 1; const s = __shoot(e); return [s.fired, e.dead === true || e.health <= 0, e.burning || 0]; })()`);
        same(r.join('|'), 'true|true|0', 'a killing round');
    });

    group('THE TECHNOMANCER\'S SIX (Part 1b, build 2026-11-02i)');
    const TECH = [['forgemaster', 'FORGEMASTER', 'fire'], ['smog_engineer', 'SMOG ENGINEER', 'toxic'], ['arc_warden', 'ARC WARDEN', 'electric'], ['cryo_tech', 'CRYO TECH', 'ice'], ['gravity_engineer', 'GRAVITY ENGINEER', 'flux'], ['bulwark_engineer', 'BULWARK ENGINEER', 'core']];
    await check('six PLAYER cards for the Technomancer, one per element, PROTOTYPE and Series 2\'s; their numbers are the game\'s own (the relays\' area the sleeping potion\'s, the lamp\'s beat the grid\'s, the swap\'s wait and the shield the core technician\'s; repairs at half the time); their words made from them', () => {
        const r = J(`({ rows: EQUIP_PLAYER_CARDS.slice(6, 12).map(row => { const c = EQUIP_CARDS[row[0]]; return [c.id, c.name, c.kind, c.match, c.kit.el, c.rarity, c.pack].join(); }), texts: EQUIP_PLAYER_CARDS.slice(6, 12).map(row => EQUIP_CARDS[row[0]].text),
            nums: [EQUIP_CARDS.smog_engineer.kit.relays.radius, EQUIP_CARDS.cryo_tech.kit.relays.radius, POTION.radius, EQUIP_CARDS.arc_warden.kit.lamp.every, TECHNO.charge.gridEvery, EQUIP_CARDS.gravity_engineer.kit.swap.every, TECH_AB.shield.cooldown,
                EQUIP_CARDS.bulwark_engineer.kit.shield.width, TECH_AB.shield.width, EQUIP_CARDS.bulwark_engineer.kit.shield.frames, TECH_AB.shield.life, EQUIP_CARDS.forgemaster.kit.repair], kinds: EQUIP_PLAYER_CARDS.slice(6, 12).map(row => equipKindLabel(EQUIP_CARDS[row[0]])) })`);
        same(r.rows.length, 6, 'the roles'); TECH.forEach(([id, name, el], i) => same(r.rows[i], [id, name, 'player', 'technomancer', el, 'prototype', 'series2'].join(), name));
        const n = r.nums; same([n[0], n[1]].join(), [n[2], n[2]].join(), 'the relays\' area against the potion\'s'); same(n[3], n[4], 'the lamp\'s beat against the grid\'s'); same(n[5], n[6], 'the swap\'s wait against the technicians\''); same(n[7] + ',' + n[9], n[8] + ',' + n[10], 'the shield against the core technician\'s'); same(n[11], 0.5, 'the repairs');
        same(r.texts[0], 'YOUR PUNCH AND ARC ARE FIRE · EVERY SENTRY HIT TO BURN: 3 DAMAGE A SECOND FOR 3 SECONDS · YOUR REPAIRS ARE TWICE AS FAST', 'FORGEMASTER');
        same(r.texts[1], 'YOUR PUNCH AND ARC ARE TOXIC · ENEMIES WITHIN 3 TILES OF AN ONLINE RELAY, WHILE THEY STAY, TO POISON: IT HITS 40% WEAKER FOR 4 SECONDS', 'SMOG ENGINEER');
        same(r.texts[2], 'YOUR PUNCH AND ARC ARE ELECTRIC · WHILE YOUR LAMP IS OVERCHARGED, EVERY 2 SECONDS: YOUR ARC\'S ZAP ON EVERY ENEMY IN ITS LIGHT, AND GLITCH: ITS WIND-UPS FAIL FOR 0.5 SECONDS', 'ARC WARDEN');
        same(r.texts[3], 'YOUR PUNCH AND ARC ARE ICE · ENEMIES WITHIN 3 TILES OF AN ONLINE RELAY, WHILE THEY STAY, TO SLOW BY 25% FOR 2 SECONDS', 'CRYO TECH');
        same(r.texts[4], 'YOUR PUNCH AND ARC ARE FLUX · SWAP: TRADE PLACES WITH A SQUAD MEMBER FROM ITS CARD, ONCE IN 60 SECONDS', 'GRAVITY ENGINEER');
        same(r.texts[5], 'YOUR PUNCH AND ARC ARE CORE · A POWER CELL ALSO RAISES A PHOTONIC SHIELD IN FRONT OF YOU: 3 TILES WIDE, 20 SECONDS', 'BULWARK ENGINEER');
        same(r.kinds[0], 'PLAYER · TECHNOMANCER · FIRE', 'a kind line');
    });
    await check('rule 2 for the Technomancer: with FORGEMASTER the punch and the arc are fire, for the triangle only: ×1.3 on a flux creature (fire beats flux; electric does nothing to flux), and on a creature with no element the same as without a role', () => {
        const r = J(`(function(){ const o = {}; const arc = (role, flux) => { __tm(role); const e = __dummy(5, 0); if (flux) e.element = 'flux'; const h = e.health; technoArc(e); const d = h - e.health; e.dead = true; actors = actors.filter(x => x !== e); return d; };
            const punch = (role, flux) => { __tm(role); const e = __dummy(1, 0); if (flux) e.element = 'flux'; const d = __punch(e); e.dead = true; actors = actors.filter(x => x !== e); return d; };
            o.arc = [arc(null, true), arc('forgemaster', true), arc(null, false), arc('forgemaster', false)]; o.punch = [punch(null, true), punch('forgemaster', true), punch(null, false), punch('forgemaster', false)];
            o.el = (__tm('forgemaster'), [playerHitElement('arc', 'electric'), playerHitElement('punch', 'electric'), playerHitElement('gun', 'ice')]); o.m = [getElementMultiplier('fire', 'flux'), getElementMultiplier('electric', 'flux')]; return o; })()`);
        same(r.el.join(), 'fire,fire,ice', 'the elements'); same(r.m.join(), '1.3,1', 'the triangle');
        ok(r.arc[0] > 0 && r.punch[0] > 0, 'a hit took nothing: ' + JSON.stringify(r)); near(r.arc[1] / r.arc[0], 1.3, 1e-6, 'the arc on a flux creature'); near(r.punch[1] / r.punch[0], 1.3, 1e-6, 'the punch on a flux creature');
        near(r.arc[3], r.arc[2], 1e-6, 'the arc on a creature with no element'); near(r.punch[3], r.punch[2], 1e-6, 'the punch on a creature with no element');
    });
    await check('FORGEMASTER: the sentries\' rounds BURN (a sentry fires, its round lands: 3 a second for 3 s); your repairs take half the time (a sentry 600 → 300 frames; no relay is repaired since build 2026-11-07qq); with no role, as before', () => {
        const r = J(`(function(){ const o = {}; const shoot = role => { __tm(role); const it = __sentries[0]; _fp.items.push(it); it.cd = 0; it.broken = false; it.hp = it.maxHp || 500; const e = __creature('ant', 'scout', 0, 0); const dd = [[-3, 0], [3, 0], [0, 3], [0, -3], [2, 2], [-2, 2], [2, -2], [-2, -2]].find(d => facilityStandOk(it.x + d[0], it.y + d[1]) && facilityShotClear(it.x, it.y, it.x + d[0], it.y + d[1])); e.x = it.x + dd[0]; e.y = it.y + dd[1]; e.team = 'red';   // (where it has a clear shot: a turret fires only so, since build 2026-11-06h)
                const n0 = followerProjectiles.length; facilitySentryTick(); const p = followerProjectiles[n0] || null; let k = 0; while (p && followerProjectiles.indexOf(p) >= 0 && k < 90) { render(); k++; }
                const res = [!!p, !!(p && p.onHit), e.burning || 0]; _fp.items = _fp.items.filter(x => x !== it); e.dead = true; actors = actors.filter(x => x !== e); return res; };
            o.with = shoot('forgemaster'); o.without = shoot(null);
            __tm('forgemaster'); o.times = [STATION_KINDS.sentry_repair.build, playerRepairShare()]; __tm(null); o.before = [STATION_KINDS.sentry_repair.build, playerRepairShare()]; return o; })()`);
        same(r.with.join(), 'true,true,180', 'a sentry\'s round with FORGEMASTER (fired, carries the burn, the creature burns)'); same(r.without.join(), 'true,false,0', 'with no role');
        same(r.times.join(), '300,0.5', 'the repairs with FORGEMASTER'); same(r.before.join(), '600,1', 'the repairs with no role');
    });
    await check('SMOG ENGINEER and CRYO TECH: an online relay WEAKENS / SLOWS every creature within 3 tiles of it on the card tick (40% for 4 s; 25% for 2 s), not one 3.5 tiles off, and nothing while the relay is down', () => {
        const r = J(`(function(){ const o = {}; const s = __relay(); const at = (dx) => { const e = __dummy(0, 0); e.x = s.x + dx; e.y = s.y; return e; };
            for (const [role, key] of [['smog_engineer', 'smog'], ['cryo_tech', 'cryo']]) {
                __tm(role); _fp.relays[s.relay].online = true; const a = at(2.5), b = at(3.5); equipTick(true); o[key] = [a.toxicWeakened || 0, a.toxicWeakenFactor || 0, a.slowed || 0, a.slowFactor || 0, b.toxicWeakened || 0, b.slowed || 0];
                _fp.relays[s.relay].online = false; const c = at(1); equipTick(true); o[key + 'Down'] = [c.toxicWeakened || 0, c.slowed || 0]; for (const e of [a, b, c]) { e.dead = true; } actors = actors.filter(x => !x.dead); }
            return o; })()`);
        same(r.smog.join(), '240,0.6,0,0,0,0', 'SMOG ENGINEER: near, and 3.5 tiles off'); same(r.cryo.join(), '0,0,120,0.75,0,0', 'CRYO TECH: near, and 3.5 tiles off');
        same(r.smogDown.join() + '|' + r.cryoDown.join(), '0,0|0,0', 'with the relay down');
    });
    await check('ARC WARDEN: while the lamp is overcharged, on the card tick every creature in its light (within 6.96 tiles: 4.8 × 1.45) and in sight takes the arc\'s zap and GLITCHES, one 8 tiles off nothing; again only after 120 frames; nothing once the overcharge is over; drawn as the arc\'s bolt from your hand', () => {
        const r = J(`(function(){ __tm('arc_warden'); const o = {}; const a = __dummy(3, 0), b = __dummy(8, 0), H = () => [a.health, b.health]; facilityLampBoost(3600); o.reach = Math.round(facilityLampReach() * 100) / 100;
            let h = H(); equipTick(true); o.first = [h[0] - a.health, h[1] - b.health, a.glitched || 0, b.glitched || 0, _tc.fx.filter(z => !z.low).length]; o.dmg = technoArcDamage();
            h = H(); equipTick(true); o.again = h[0] - a.health; frame += 120; h = H(); equipTick(true); o.later = h[0] - a.health;
            _fp.tut.boostUntil = 0; frame += 120; h = H(); equipTick(true); o.off = h[0] - a.health; return o; })()`);
        same(r.reach, 6.96, 'the overcharged lamp\'s reach'); ok(r.first[0] > 0, 'the creature in the light took nothing'); same(r.first[1], 0, 'the creature out of the light'); same(r.first[2] + ',' + r.first[3], '30,0', 'the glitch (0.5 s), on the near one only');
        ok(r.first[4] >= 1, 'no bolt drawn from your hand'); same(r.again, 0, 'a second zap within 120 frames'); ok(r.later > 0, 'no zap 120 frames later'); same(r.off, 0, 'a zap with the overcharge over');
    });
    await check('GRAVITY ENGINEER: SWAP trades places with a squad member on your stretch of floor; then not again for 60 s (it says when); never with one not in the squad, nor across a doorway into another part of the map; nothing without the role', () => {
        const r = J(`(function(){ const o = {}; __tm('gravity_engineer'); spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.post = null; f.stance = 'follow'; f.x = player.x + 2; f.y = player.y; f.health = f.maxHealth;
            const p0 = [player.x, player.y], f0 = [f.x, f.y]; o.state = playerSwapState(); o.why0 = playerSwapWhyNot(f); o.swap = playerSwap(f); o.after = [player.x === f0[0] && player.y === f0[1], f.x === p0[0] && f.y === p0[1]]; o.again = playerSwapWhyNot(f);
            const g = { x: player.x + 1, y: player.y, team: 'green', isFollower: true, post: 'arena', dead: false }; o.notSquad = (_pc.swapAt = 0, playerSwapWhyNot(g));
            const pc = _pcComp(player.x, player.y); let far = null; for (const key of Array.from(_fp.cellsP.keys())) { const [x, y] = String(key).split(',').map(Number); if (_pcComp(x, y) !== pc) { far = [x, y]; break; } }
            const fx = [f.x, f.y]; if (far) { f.x = far[0]; f.y = far[1]; } o.far = far ? playerSwapWhyNot(f) : 'NO OTHER PART'; f.x = fx[0]; f.y = fx[1];
            equipPlayerPut(0, null); o.none = [playerSwapState(), playerSwapWhyNot(f)]; return o; })()`);
        same(JSON.stringify(r.state), JSON.stringify({ ready: true, left: 0 }), 'ready at first'); same(r.why0, null, 'why not'); same(r.swap.ok, true, 'the swap'); same(r.after.join(), 'true,true', 'places traded');
        same(r.again, 'SWAP READY IN 60 S', 'again at once'); same(r.notSquad, 'SQUAD MEMBERS ONLY', 'one holding a room'); same(r.far, 'NOT ON YOUR STRETCH OF FLOOR', 'across a doorway'); same(r.none[0], null, 'its state with no role'); same(r.none[1], 'NO GRAVITY ENGINEER WORN', 'why not with no role');
    });
    await check('BULWARK ENGINEER: a POWER CELL also raises a Photonic Shield for 20 s, between you and the creature you have locked (or, with none, the way you face), 3 tiles out at most and no wider than 3; with no role the cell only overcharges the lamp', () => {
        const r = J(`(function(){ const o = {}; const cell = () => { invAdd('power_cell', 1); return itemDef('power_cell').use(); };
            __tm('bulwark_engineer'); techShields.length = 0; const e = __dummy(5, 0); playerLockTarget = e; const u = cell(); const W = techShields[0];
            o.locked = [u.msg, techShields.length, W ? W.until - W.t0 : 0, W ? Math.round(((W.x - player.x) * (e.x - player.x) + (W.y - player.y) * (e.y - player.y)) / Math.hypot(e.x - player.x, e.y - player.y) * 100) / 100 : -1, W ? Math.round((W.u1 - W.u0) * 100) / 100 : -1, W ? W.by : 'none'];
            playerLockTarget = null; e.dead = true; actors = actors.filter(x => x !== e); techShields.length = 0; player._hdRow = 0; const u2 = cell(); const W2 = techShields[0]; o.ahead = [techShields.length, W2 ? Math.round(Math.hypot(W2.x - player.x, W2.y - player.y) * 100) / 100 : -1, W2 ? Math.sign(W2.x - player.x) : 0];
            __tm(null); techShields.length = 0; const u3 = cell(); o.none = [u3.msg, techShields.length]; return o; })()`);
        same(r.locked[0], 'LAMP OVERCHARGED · PHOTONIC SHIELD UP', 'the cell\'s words'); same(r.locked[1], 1, 'shields up'); same(r.locked[2], 1200, 'its life'); ok(r.locked[3] > 0.5 && r.locked[3] <= 3.01, 'not between you and the creature, 3 tiles out at most: ' + r.locked[3]);
        ok(r.locked[4] > 0 && r.locked[4] <= 3.01, 'its width: ' + r.locked[4]); same(r.locked[5], null, 'it is nobody\'s to hold');
        ok(r.ahead[0] === 1 || r.ahead[0] === 0, 'shields with no lock: ' + r.ahead[0]); if (r.ahead[0] === 1) ok(r.ahead[1] >= 0.99 && r.ahead[1] <= 3.01 && r.ahead[2] === 1, 'not ahead (facing east): ' + JSON.stringify(r.ahead));
        same(r.none.join(), 'LAMP OVERCHARGED,0', 'with no role');
    });

    group('THE MUTATOR\'S SIX (Part 1c, build 2026-11-02j)');
    const MUT = [['ash_surgeon', 'ASH SURGEON', 'fire'], ['plague_doctor', 'PLAGUE DOCTOR', 'toxic'], ['spark_geneticist', 'SPARK GENETICIST', 'electric'], ['cryo_geneticist', 'CRYO GENETICIST', 'ice'], ['splicer', 'SPLICER', 'flux'], ['core_shaper', 'CORE SHAPER', 'core']];
    await check('six PLAYER cards for the Mutator, one per element, PROTOTYPE and Series 2\'s; their numbers are the game\'s own (CORE SHAPER\'s +50% health is two ranks of ARMOR PLATING; its 20% slower is new, approved); their words made from them', () => {
        const r = J(`({ rows: EQUIP_PLAYER_CARDS.slice(12, 18).map(row => { const c = EQUIP_CARDS[row[0]]; return [c.id, c.name, c.kind, c.match, c.kit.el, c.rarity, c.pack].join(); }), texts: EQUIP_PLAYER_CARDS.slice(12, 18).map(row => EQUIP_CARDS[row[0]].text),
            tank: EQUIP_CARDS.core_shaper.kit.tank, armor: CLONE_UPGRADES.armor.stat.health.mul, kinds: EQUIP_PLAYER_CARDS.slice(12, 18).map(row => equipKindLabel(EQUIP_CARDS[row[0]])) })`);
        same(r.rows.length, 6, 'the roles'); MUT.forEach(([id, name, el], i) => same(r.rows[i], [id, name, 'player', 'mutator', el, 'prototype', 'series2'].join(), name));
        same(r.tank.health, r.armor * 2, 'CORE SHAPER\'s health against two ranks of ARMOR'); same(r.tank.slower, 0.2, 'its pace');
        same(r.texts[0], "YOUR LASH AND YOUR CLONE'S BITES ARE FIRE · ENEMIES IN YOUR SERUM'S POOL, ON EVERY HEAL BEAT, TO BURN: 3 DAMAGE A SECOND FOR 3 SECONDS", 'ASH SURGEON');
        same(r.texts[1], "YOUR LASH AND YOUR CLONE'S BITES ARE TOXIC · EVERY BITE OF YOUR CLONE TO POISON: IT HITS 40% WEAKER FOR 4 SECONDS · ENEMIES IN YOUR SERUM'S POOL, ON EVERY HEAL BEAT, TO POISON: IT HITS 40% WEAKER FOR 4 SECONDS", 'PLAGUE DOCTOR');
        same(r.texts[2], "YOUR LASH AND YOUR CLONE'S BITES ARE ELECTRIC · EVERY BITE OF YOUR CLONE TO GLITCH: ITS WIND-UPS FAIL FOR 0.5 SECONDS", 'SPARK GENETICIST');
        same(r.texts[3], "YOUR LASH AND YOUR CLONE'S BITES ARE ICE · A FALLEN FOLLOWER COMES BACK AT NO COST TO THE CRYSTAL · IF YOUR CLONE FALLS, IT IS PRESERVED AT ONCE (NO ICE MAGE), ITS UPGRADES KEPT", 'CRYO GENETICIST');
        same(r.texts[4], "YOUR LASH IS FLUX · YOUR CLONE'S BITES TAKE THE ELEMENT OF THE LAST ENEMY IT KILLED, AND THAT ELEMENT'S STATUS, UNTIL ITS NEXT KILL", 'SPLICER');
        same(r.texts[5], "YOUR LASH AND YOUR CLONE'S BITES ARE CORE · EVERY BITE OF YOUR CLONE TO KNOCK THE TARGET BACK · YOUR CLONE HAS 50% MORE HEALTH AND MOVES 20% SLOWER", 'CORE SHAPER');
        same(r.kinds.join('|'), 'PLAYER · MUTATOR · FIRE|PLAYER · MUTATOR · TOXIC|PLAYER · MUTATOR · ELECTRIC|PLAYER · MUTATOR · ICE|PLAYER · MUTATOR · FLUX|PLAYER · MUTATOR · CORE', 'the kind lines');
    });
    await check('rule 2 for the Mutator: with ASH SURGEON the lash and the clone\'s bite are fire, for the triangle only: ×1.3 on a flux creature, and on a creature with no element the same as without a role; the bite stays Piercing, all physical; with no role, or from a clone not the Mutator\'s own, as before (no element)', () => {
        const r = J(`(function(){ const o = {}; const bite = (role, flux) => { __mx(role); const c = __mclone(), e = __byClone(c); if (flux) e.element = 'flux'; const h = e.health; c.bite(e); const d = h - e.health; e.dead = true; actors = actors.filter(x => x !== e); return d; };
            const lash = (role, flux) => { __mx(role); const e = __dummy(1, 0); if (flux) e.element = 'flux'; const d = __punch(e); e.dead = true; actors = actors.filter(x => x !== e); return d; };
            o.bite = [bite(null, true), bite('ash_surgeon', true), bite(null, false), bite('ash_surgeon', false)]; o.lash = [lash(null, true), lash('ash_surgeon', true), lash(null, false), lash('ash_surgeon', false)];
            __mx('ash_surgeon'); const c = __mclone(), h = dmgBiteHit(c); o.hit = [h.type, h.element, h.player, playerHitElement('lash', null), dmgAbilityHit(c) === DMG_HIT_CLONE]; o.notMine = dmgBiteHit({ isClone: true }) === DMG_HIT_CLONE;
            __mx(); const c0 = __mclone(); o.none = dmgBiteHit(c0) === DMG_HIT_CLONE; return o; })()`);
        same(r.hit.join(), 'piercing,fire,true,fire,true', 'the bite\'s hit, the lash\'s element, the clone\'s special (no element)'); same(r.none, true, 'the bite with no role'); same(r.notMine, true, 'a clone that is not the Mutator\'s own');
        ok(r.bite[0] > 0 && r.lash[0] > 0, 'a hit took nothing: ' + JSON.stringify(r)); near(r.bite[1] / r.bite[0], 1.3, 1e-6, 'the bite on a flux creature'); near(r.lash[1] / r.lash[0], 1.3, 1e-6, 'the lash on a flux creature');
        near(r.bite[3], r.bite[2], 1e-6, 'the bite on a creature with no element'); near(r.lash[3], r.lash[2], 1e-6, 'the lash on a creature with no element');
    });
    await check('the clone\'s bites: PLAGUE DOCTOR\'s WEAKEN (40% for 4 s), SPARK GENETICIST\'s GLITCH (0.5 s), CORE SHAPER\'s KNOCK the creature BACK, away from the clone (0.22); ASH SURGEON\'s and CRYO GENETICIST\'s set nothing (their element only); no role, nothing; a bite that kills sets nothing', () => {
        const r = J(`(function(){ const o = {}; const bite = role => { __mx(role); const c = __mclone(), e = __byClone(c), h = e.health; c.bite(e); const away = (e.kbVX || 0) * (e.x - c.x) + (e.kbVY || 0) * (e.y - c.y) > 0;
                return [h - e.health > 0, e.toxicWeakened || 0, e.glitched || 0, Math.round(Math.hypot(e.kbVX || 0, e.kbVY || 0) * 1000) / 1000, away, e.burning || 0, e.slowed || 0].join(); };
            for (const role of [null, 'plague_doctor', 'spark_geneticist', 'core_shaper', 'ash_surgeon', 'cryo_geneticist']) o[role || 'none'] = bite(role);
            __mx('plague_doctor'); const c = __mclone(), k = __byClone(c); k.health = 1; c.bite(k); o.kill = [k.dead === true, k.toxicWeakened || 0].join(); return o; })()`);
        same(r.none, 'true,0,0,0,false,0,0', 'no role'); same(r.plague_doctor, 'true,240,0,0,false,0,0', 'PLAGUE DOCTOR'); same(r.spark_geneticist, 'true,0,30,0,false,0,0', 'SPARK GENETICIST');
        same(r.core_shaper, 'true,0,0,0.22,true,0,0', 'CORE SHAPER'); same(r.ash_surgeon, 'true,0,0,0,false,0,0', 'ASH SURGEON'); same(r.cryo_geneticist, 'true,0,0,0,false,0,0', 'CRYO GENETICIST'); same(r.kill, 'true,0', 'a killing bite');
    });
    await check('in the real game loop: the clone, left to fight a creature by itself, bites it, and with PLAGUE DOCTOR the creature it bit is WEAKENED; its POUNCE\'s bite as it lands is a bite too', () => {
        const r = J(`(function(){ __mx('plague_doctor'); const c = __mclone(), e = __dummy(2.1, 0); let k = 0; const h = e.health; for (; k < 300 && h - e.health < 1; k++) render(); const o = { frames: k, bit: h - e.health > 0, weak: e.toxicWeakened || 0 };
            __mx('plague_doctor'); const p = __mclone(), t = __dummy(5, 0); p.pounce = { phase: 'air', t: MUTATOR.pounce.air - 1, fx: p.x, fy: p.y, tx: t.x - 1, ty: t.y, target: t }; const h2 = t.health; clonePounceTick(p); o.pounce = [h2 - t.health > 0, t.toxicWeakened || 0].join(); return o; })()`);
        same(r.bit, true, 'the clone never bit (' + r.frames + ' frames)'); ok(r.weak >= 235, 'the creature it bit is not weakened: ' + r.weak); same(r.pounce, 'true,240', 'the pounce\'s bite');
    });
    await check('ASH SURGEON and PLAGUE DOCTOR: on every heal beat of the serum\'s pool (half a second) every creature in it BURNS / is WEAKENED, renewed on each beat; one 3 tiles off takes nothing (the pool is 2.6); the pool still heals your follower; with no role it only heals', () => {
        const r = J(`(function(){ const o = {}; const pool = role => { __mx(role); serumZones = []; spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = player.x - 1; f.y = player.y; f.health = f.maxHealth * 0.5; const h0 = f.health;
                const a = __dummy(1.5, 0), b = __dummy(3, 0.2); serumSplash(player.x, player.y); serumTick(); const first = [a.burning || 0, a.toxicWeakened || 0, b.burning || 0, b.toxicWeakened || 0]; __frames(30);
                const res = { first: first.join(), renewed: [a.burning || 0, a.toxicWeakened || 0], healed: f.health > h0 }; for (const e of [a, b]) e.dead = true; actors = actors.filter(x => !x.dead); serumZones = []; return res; };
            o.ash = pool('ash_surgeon'); o.plague = pool('plague_doctor'); o.none = pool(null); return o; })()`);
        same(r.ash.first, '180,0,0,0', 'ASH SURGEON\'s first beat (in the pool, and 3 tiles off)'); ok(r.ash.renewed[0] >= 175, 'the burn was not renewed on the next beat: ' + r.ash.renewed[0]);
        same(r.plague.first, '0,240,0,0', 'PLAGUE DOCTOR\'s first beat'); ok(r.plague.renewed[1] >= 235, 'the weakness was not renewed on the next beat: ' + r.plague.renewed[1]);
        same(r.none.first, '0,0,0,0', 'no role'); same([r.ash.healed, r.plague.healed, r.none.healed].join(), 'true,true,true', 'the pool healed your follower');
    });
    await check('CRYO GENETICIST: a fallen follower comes back at no cost to the Crystal (with the Crystal under its 10% reserve it does not wait, and nothing is drawn); with no role it waits for power, as before', () => {
        const r = J(`(function(){ const o = {}; const dn = _fp.tut.script.doneAt, cm = crystal.maxHealth, ch = crystal.health; _fp.tut.script.doneAt = 3;
            const fall = role => { __mx(role); respawnQueue.length = 0; spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; const uid = f.uid;
                crystal.maxHealth = 300; crystal.health = 20; _crystalDrawnAt = -1e9; f.dead = true; f.health = 0; let k = 0; for (; k < 400 && !followers.some(x => x.uid === uid && !x.dead); k++) render();
                return [followers.some(x => x.uid === uid && !x.dead), !!(respawnQueue[0] && respawnQueue[0].waitPower), _crystalDrawnAt === -1e9, playerReviveFree()].join(); };
            o.cryo = fall('cryo_geneticist'); o.none = fall(null); _fp.tut.script.doneAt = dn; crystal.maxHealth = cm; crystal.health = ch; respawnQueue.length = 0; return o; })()`);
        same(r.cryo, 'true,false,true,true', 'with CRYO GENETICIST (back; not waiting; nothing drawn; free)'); same(r.none, 'false,true,true,false', 'with no role (it waits at the reserve; nothing drawn)');
    });
    await check('CRYO GENETICIST: your clone, when it falls, is preserved at once with no Ice Mage: its body is a capsule with its upgrades kept, taken by walking over it; with no role its body lies as before, its upgrades lost', () => {
        const r = J(`(function(){ const o = {}; const fall = role => { __mx(role); const c = __mclone(); c.upgrades = { armor: 2 }; cloneApplyUpgrades(c); floatingTexts.length = 0; c.health = 0; c.dead = true; render();
                const b = cloneBodies[cloneBodies.length - 1]; return { b, info: b ? [b.frozen === true, JSON.stringify(b.upgrades)].join() : null, said: floatingTexts.map(t => t.text).join(' | ') }; };
            const a = fall('cryo_geneticist'); o.cryo = [a.info, /PRESERVED AT ONCE, ITS 2 UPGRADES KEPT/.test(a.said), /UPGRADES ARE LOST/.test(a.said)].join('|');
            player.x = player.targetX = player.visualX = a.b.x; player.y = player.targetY = player.visualY = a.b.y; player.fpPath = null; render(); o.taken = [specimenCarried.length, specimenCarried.length ? JSON.stringify(specimenCarried[0].upgrades) : null, cloneBodies.length].join('|');
            specimenReset(); const n = fall(null); o.none = [n.info, /UPGRADES ARE LOST/.test(n.said)].join('|'); cloneBodies = []; return o; })()`);
        same(r.cryo, 'true,{"armor":2}|true|false', 'with CRYO GENETICIST (a capsule, its upgrades; what is said)'); same(r.taken, '1|{"armor":2}|0', 'the capsule taken by walking over it');
        same(r.none, 'false,{"armor":2}|true', 'with no role');
    });
    await check('SPLICER: the clone\'s bites take the element of the last creature it killed, with that element\'s status (a toxic ant: POISON), until its next kill; before any such kill, none; a creature with no element leaves it as it was; the lash is flux; with another role awake a kill gives nothing', () => {
        const r = J(`(function(){ const o = {}; __mx('splicer'); const c = __mclone(); o.before = [dmgBiteHit(c) === DMG_HIT_CLONE, playerCloneElement(c), playerHitElement('lash', null)];
            const e0 = __byClone(c); c.bite(e0); o.before.push(e0.toxicWeakened || 0, e0.glitched || 0); o.before = o.before.join(); e0.dead = true; actors = actors.filter(x => x !== e0);
            const t = __byClone(c); t.element = 'toxic'; t.health = 1; floatingTexts.length = 0; c.bite(t); render(); o.kill = [t.dead === true, c._pcSplice, floatingTexts.some(x => x.text === 'SPLICED: TOXIC')].join();
            const e1 = __byClone(c); c.bite(e1); const h = dmgBiteHit(c); o.after = [h.type, h.element, h.player, e1.toxicWeakened || 0].join(); e1.dead = true; actors = actors.filter(x => x !== e1);
            const p = __byClone(c); p.health = 1; c.bite(p); render(); o.plain = [p.dead === true, c._pcSplice].join();
            const f = __byClone(c); f.element = 'fire'; f.health = 1; c.bite(f); render(); o.fire = c._pcSplice;
            __mx('plague_doctor'); const c2 = __mclone(), t2 = __byClone(c2); t2.element = 'toxic'; t2.health = 1; c2.bite(t2); render(); o.other = [t2.dead === true, c2._pcSplice || null].join(); return o; })()`);
        same(r.before, 'true,,flux,0,0', 'before any kill (no element, nothing set; the lash flux)');
        same(r.kill, 'true,toxic,true', 'a toxic ant killed'); same(r.after, 'piercing,toxic,true,240', 'its next bite: toxic, and the weakness');
        same(r.plain, 'true,toxic', 'a creature with no element killed'); same(r.fire, 'fire', 'the next kill with an element'); same(r.other, 'true,', 'a kill with PLAGUE DOCTOR awake');
    });
    await check('CORE SHAPER: the clone has 50% more health (added as two more ranks of ARMOR: with two bought, ×1.5 becomes ×2), its share of health kept (wearing it heals nothing), and moves 20% slower (a slow on it still slows it); taken off, both as before', () => {
        const r = J(`(function(){ const o = {}; __mx(); equipFound.push('core_shaper'); const c = __mclone(); equipTick(true); const base = c.maxHealth, sp = c.baseMoveSpeed; c.health = base / 2; c.state = 'hunt';
            equipPlayerPut(0, 'core_shaper'); equipTick(true); tickSlowSpeed(c); o.on = [c.maxHealth / base, c.health / c.maxHealth, c.moveSpeed / sp, c.paceMult];
            applySlow(c, 60, 0.75); tickSlowSpeed(c); o.slowed = c.moveSpeed / sp; c.slowed = 0; tickSlowSpeed(c);
            equipPlayerPut(0, null); equipTick(true); tickSlowSpeed(c); o.off = [c.maxHealth === base, c.health / c.maxHealth, c.moveSpeed / sp, c.paceMult === undefined];
            c.upgrades = { armor: 2 }; cloneApplyUpgrades(c); const a2 = c.maxHealth; equipPlayerPut(0, 'core_shaper'); equipTick(true); o.armor = [a2 / base, c.maxHealth / base]; return o; })()`);
        near(r.on[0], 1.5, 0.02, 'its health worn'); near(r.on[1], 0.5, 1e-9, 'its share of health worn'); near(r.on[2], 0.8, 1e-9, 'its pace worn'); same(r.on[3], 0.8, 'its pace');
        near(r.slowed, 0.6, 1e-9, 'slowed by 25% on top'); same(r.off[0], true, 'its health taken off'); near(r.off[1], 0.5, 1e-9, 'its share taken off'); near(r.off[2], 1, 1e-9, 'its pace taken off'); same(r.off[3], true, 'no pace left on it');
        near(r.armor[0], 1.5, 0.02, 'two ranks of ARMOR'); near(r.armor[1], 2, 0.02, 'two ranks of ARMOR and CORE SHAPER');
    });
    await check('a Mutator role asleep (you are another class) does nothing: the pool sets nothing, a follower\'s return is paid, a fallen clone is not preserved', () => {
        const r = J(`(function(){ __mx('plague_doctor'); classSet('gunslinger'); equipTick(true); serumZones = []; const a = __dummy(1, 0); serumSplash(player.x, player.y); serumTick();
            const o = [equipPlayer.join(), equipPlayerAwake('plague_doctor'), playerMutRole(), a.toxicWeakened || 0, playerReviveFree(), playerClonePreserved()].join(); serumZones = [];
            __mx('cryo_geneticist'); classSet('technomancer'); const o2 = [playerReviveFree(), playerClonePreserved()].join(); return [o, o2]; })()`);
        same(r[0], 'plague_doctor,,false,,0,false,false', 'PLAGUE DOCTOR asleep'); same(r[1], 'false,false', 'CRYO GENETICIST asleep');
    });

    group('THE ROSTER, IN THE REAL PAGE: a role asleep is greyed, marked ASLEEP, and says when it wakes');
    const PAGE = page(1180, 820, '?cards=all');
    await check('as a Gunslinger INCENDIARY GUNNER is lit on YOUR SLOT 1; as a Technomancer it is greyed (grayscale), ASLEEP on the card and in the slot, the note says it wakes when you are a Gunslinger, and the other slot\'s picker shows no Gunslinger role (since build 2026-11-07pp a card that does not fit is not shown: the Technomancer\'s six are there); back as a Gunslinger it is lit', () => {
        const P = PAGE;
        if (P === null) { console.log('       (no Chromium here: skipped)'); return; }
        ok(P, 'the page did not report'); ok(!P.err, P.err); same(P.put, true, 'put in');
        same([P.awake.asleep, P.awake.zz, P.awake.k, P.awake.v].join('|'), 'false||YOUR SLOT 1|INCENDIARY GUNNER', 'awake');
        same([P.asleep.asleep, P.asleep.zz, P.asleep.k, P.asleep.v].join('|'), 'true|ASLEEP|YOUR SLOT 1 · ASLEEP|INCENDIARY GUNNER', 'asleep'); ok(/grayscale\(1\)/.test(P.asleep.filter), 'greyed: ' + P.asleep.filter);
        ok(P.asleep.level <= 1, 'the two slots\' cards are not level while one sleeps: ' + P.asleep.level); same(P.asleep.under, true, 'ASLEEP is not under the card'); same(P.asleep.fits, true, 'the slot\'s drop-down overflows while its card sleeps');
        ok(/INCENDIARY GUNNER IS ASLEEP: IT WAKES WHEN YOU ARE A GUNSLINGER AGAIN/.test(P.asleep.note), 'the note: ' + P.asleep.note); ok(/ASLEEP$/.test(P.asleep.label), 'its label: ' + P.asleep.label);
        same(P.list2.length, 0, 'a Gunslinger role is shown in the other slot\'s picker: ' + JSON.stringify(P.list2));
        for (const n of ['FORGEMASTER', 'SMOG ENGINEER', 'ARC WARDEN', 'CRYO TECH', 'GRAVITY ENGINEER', 'BULWARK ENGINEER']) ok(P.list2all.includes(n), n + ' is not in the other slot\'s picker: ' + P.list2all.join('|'));
        ok(P.list2all.every(n => n === 'EMPTY:off' || !/:off$/.test(n)), 'a card in the picker is off: ' + P.list2all.join('|'));
        same([P.back.asleep, P.back.zz, P.back.k, P.back.v].join('|'), 'false||YOUR SLOT 1|INCENDIARY GUNNER', 'awake again');
    });
    await check('GRAVITY ENGINEER\'s SWAP, in the real page: a row on the squad member\'s card while the role is awake, saying what it does; a tap trades places with the member; then it is off and says when it is ready; without the role the row is gone', () => {
        const P = PAGE; if (P === null) { console.log('       (no Chromium here: skipped)'); return; }
        ok(P && !P.err, 'the page: ' + (P && P.err)); same(P.gput, true, 'put in'); ok(P.swap, 'no swap probe'); same(P.swap.member, true, 'a squad member to tap');
        same([P.swap.shown, P.swap.text, P.swap.disabled].join('|'), 'true|YOU TAKE ITS PLACE, IT TAKES YOURS|false', 'the row before'); same(P.swap.moved, true, 'places traded');
        same([P.swap.after, P.swap.offAfter].join('|'), 'SWAP READY IN 60 S|true', 'the row after'); same(P.swap.hidden, true, 'the row without the role');
    });

    console.log(failures ? `\n${failures} failure(s)` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
