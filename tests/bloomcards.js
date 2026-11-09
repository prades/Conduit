// BLOOM'S NINE CARDS (build 2026-11-09a; docs/CONVERSION.md §2 "BLOOM's cards", docs/UNIVERSAL-AND-PLAYER-CARDS.md and docs/SERIES-2.md; the owner, 2026-11-09: "MEND's heal", "DEWBURST: big MEND",
// "Approve as drafted" (the auras), "SEED GUNNER: seedfall", "GROVE ENGINEER: relays (Recommended)", "HERBALIST: bites and pool (Recommended)"; every number the agent's, provisional until a playtest).
//   PACK 1        SAP VEIN (Unrefined: +25% to what its MEND heals), NECTAR HEART (Refined: +50%), DEWBURST (Precision: 15% a MEND to heal 3 times as much, with a burst of pink dew; BLOOM's status, the one ATTUNED
//                 CORE sets on a BLOOM follower). They fit only a BLOOM follower, whose every hit MENDs (js/elements.js elementMend: the most hurt of yours within 4 tiles, 2% of its maximum health).
//   SERIES 2      THORN BAND (+5% ATTACK), PETAL SIGIL (+7.5%), EVERBLOOM CROWN (+10%, and on each hit of a unit in its reach a 10% chance of a MEND from the one that hit): for BLOOM Mages (THORNWHIP).
//   PLAYER CARDS  SEED GUNNER (Gunslinger: every 5th round that hits plants a small SEEDFALL, 1 tile round, 2 s), GROVE ENGINEER (Technomancer: every online relay mends your followers within 3 tiles 1% every
//                 3 s), HERBALIST (Mutator: the clone's bites MEND; the serum's pool heals 50% more). The player's own strikes in their element MEND nothing by themselves.
//   DEALT         by no pack, shelf or shop until the purification module is installed and has run (js/cards.js equipBloomReady; the Side Quest's shop: tests/sidequest.js; the market's shelf: tests/market.js)
// js/cards.js (the rows, their words, equipIsBloom, equipBloomReady, equipDewburst, bloomMendMult, the aura's MEND in equipOnHit), js/elements.js elementMend, js/playercards.js (the three kits), js/serum.js.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function near(a, b, tol, m) { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected about ${b}, got ${a}`); }

// the nine: id, name, kind, match, rarity, pack, element (the Pack 1 cards' element is their match; the auras' their aura's; the roles' their kit's)
const NINE = [
    ['sap_vein', 'SAP VEIN', 'element', 'blossom', 'unrefined', 'pack1', 'blossom'],
    ['nectar_heart', 'NECTAR HEART', 'element', 'blossom', 'refined', 'pack1', 'blossom'],
    ['dewburst', 'DEWBURST', 'element', 'blossom', 'precision', 'pack1', 'blossom'],
    ['thorn_band', 'THORN BAND', 'class', 'sniper', 'refined', 'series2', 'blossom'],
    ['petal_sigil', 'PETAL SIGIL', 'class', 'sniper', 'precision', 'series2', 'blossom'],
    ['everbloom_crown', 'EVERBLOOM CROWN', 'class', 'sniper', 'prototype', 'series2', 'blossom'],
    ['seed_gunner', 'SEED GUNNER', 'player', 'gunslinger', 'prototype', 'series2', 'blossom'],
    ['grove_engineer', 'GROVE ENGINEER', 'player', 'technomancer', 'prototype', 'series2', 'blossom'],
    ['herbalist', 'HERBALIST', 'player', 'mutator', 'prototype', 'series2', 'blossom'],
];

async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    sb.console = Object.assign({}, console, { error: (...a) => { if (!/the cards screen could not open/.test(String(a[0]))) console.error(...a); } });
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) { /* the page's own boot check says */ } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; canvas.width = 1280; canvas.height = 860; if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};
        _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries: they would shoot the creatures)
        // THE FOLLOWERS' SIDE (as tests/classcards.js): a spot whose 13 × 13 tiles round it are all one room, a follower of a form there wearing up to two cards, an enemy that does not die
        globalThis.__fresh = () => { actors = actors.filter(a => !a.isFollower && !(a instanceof Predator) && !a.isClone); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); equipReset(); floatingTexts.length = 0; elementEffects.length = 0; };
        globalThis.__P = (function(){ const F = _fp.F; for (const r of F.rooms) for (let x = Math.ceil(r.bb[0]); x <= r.bb[2]; x++) for (let y = Math.ceil(r.bb[1]); y <= r.bb[3]; y++) { let ok = true;
            for (let dx = -6.5; dx <= 6.5 && ok; dx += 0.5) for (let dy = -6.5; dy <= 6.5 && ok; dy += 0.5) if (facilityRoomAt(x + dx, y + dy, F) !== r) ok = false; if (ok) return [x, y, r.id]; } return null; })();
        globalThis.__at = (u, x, y) => { u.x = __P[0] + x; u.y = __P[1] + y; return u; };
        globalThis.__wear = (form, cards, x, y) => { const E = EVOLUTIONS[form]; spawnFollowerAtCrystal(E.element, E.role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.role = E.role; f.evolved = form; f.element = E.element;
            initFollowerLevel(f, { level: 10 }); __at(f, x, y); const cs = (Array.isArray(cards) ? cards : [cards]).filter(Boolean); if (cs.length) { for (const c of cs) if (equipFound.indexOf(c) < 0) equipFound.push(c); f.cards = [cs[0], cs[1] || null]; equipRefresh(f); } f.health = f.maxHealth; return f; };
        // a follower at half health (the one a MEND finds: the most hurt), and the share of its maximum health a deed gave it
        globalThis.__hurt = (form, x, y) => { const f = __wear(form, null, x, y); f.update = () => {}; f.health = f.maxHealth * 0.5; return f; };
        globalThis.__mend = (f, fn) => { const h = f.health; fn(); return Math.round((f.health - h) / f.maxHealth * 1e6) / 1e6; };
        globalThis.__clone = (x, y) => { const c = makeClone('ant', 'scout', __P[0] + x, __P[1] + y); c.health = c.maxHealth; return c; };
        globalThis.__foe = (species, x, y) => { const p = spawnCreature({ species, className: 'tank', x: __P[0] + x, y: __P[1] + y, level: 5, state: 'wander' }); p.fpCreature = true; p.homeRoom = 'arena'; p.spawnProtection = 0; p.health = p.maxHealth = 50000; p.element = null; p.reflectDamage = false; p.update = () => {}; return p; };
        // THE PLAYER'S SIDE (as tests/playercards.js): staged in the lower half of the Crystal Chamber, open floor all round; a class with these roles found for the run, the first worn
        globalThis.__home = () => { player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 0; };
        globalThis.__clear = () => { __fresh(); respawnQueue.length = 0; followerProjectiles.length = 0; _tc.fx.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; __home(); };
        globalThis.__class = id => { invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); if (id) classSet(id); };
        globalThis.__role = (cls, ...ids) => { __clear(); __class(cls); equipReset(); for (const id of ids) if (id) equipFound.push(id); if (ids[0]) equipPlayerPut(0, ids[0]); playerAmmo = 99; technoCharge = 6; player.selectedElement = 'ice'; return equipPlayer.slice(); };
        globalThis.__dummy = (dx, dy) => { const p = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: player.x + dx, y: player.y + dy, state: 'hunt' }); p.provoked = true; p.element = null; p.spawnProtection = 0; p.update = () => {}; p.health = p.maxHealth = 1e6; return p; };
        // a follower of yours at half health that stays where it is put (level 10, and already lifted by the tutorial, whose director would bring a new one in at its level with its health full)
        globalThis.__ally = (x, y) => { spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.update = () => {}; initFollowerLevel(f, { level: 10 });
            if (_fp.tut && _fp.tut.script && _fp.tut.script.levelled) _fp.tut.script.levelled.add(f); f.x = x; f.y = y; f.health = f.maxHealth * 0.5; return f; };
        globalThis.__share = f => Math.round((f.health / f.maxHealth - 0.5) * 1e6) / 1e6;   // (what it gained since it was put at half health)
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        globalThis.__said = w => floatingTexts.some(t => t.text === w);
        // fire at a creature and step the game until the round has landed; a punch, an arc or a lash that lands (the health it took)
        globalThis.__shoot = foe => { player.attackCooldown = 0; const h = foe.health, n0 = followerProjectiles.length; firePlayerShot(foe); const p = followerProjectiles.length > n0 ? followerProjectiles[followerProjectiles.length - 1] : null;
            let k = 0; while (p && followerProjectiles.indexOf(p) >= 0 && k < 120) { render(); k++; } return h - foe.health; };
        globalThis.__strike = foe => { player.attackCooldown = 0; const h = foe.health; firePlayerShot(foe); let k = 0; while (h - foe.health < 0.001 && k < 90) { render(); k++; } return h - foe.health; };
        globalThis.__mclone = () => { const c = makeClone('ant', 'scout', player.x + 1, player.y, 'hunt'); c.primary = true; c.upgrades = {}; c.invested = 0; cloneApplyUpgrades(c); c.health = c.maxHealth; c.attackCooldown = 0; return c; };
        globalThis.__byClone = c => { const e = __dummy(0, 0); e.x = c.x + 1; e.y = c.y; return e; };
        globalThis.__gone = (...es) => { for (const e of es) if (e) e.dead = true; actors = actors.filter(x => !x.dead); };`);
    return { run, J };
}

(async () => {
    const { J } = await boot('');
    // the module installed and its cycle run, for every check but the dealing's own (which sets it both ways)
    J(`(function(){ const Q = questState('purify'); Q.installedAt = 1; Q.purifiedAt = 2; return true; })()`);

    group('THE NINE (the owner, 2026-11-09; their numbers the agent\'s, provisional)');
    await check('Pack 1\'s SAP VEIN (Unrefined), NECTAR HEART (Refined) and DEWBURST (Precision), for BLOOM followers; Series 2\'s THORN BAND (Refined), PETAL SIGIL (Precision) and EVERBLOOM CROWN (Prototype), for BLOOM Mages; the PLAYER cards SEED GUNNER, GROVE ENGINEER and HERBALIST (Prototype), one for each class', () => {
        const r = J(`${JSON.stringify(NINE.map(n => n[0]))}.map(id => { const c = EQUIP_CARDS[id]; return c ? [c.id, c.name, c.kind, c.match, c.rarity, c.pack, c.kind === 'element' ? c.match : c.aura ? c.aura.el : c.kit ? c.kit.el : null].join() : id + ': none'; })`);
        NINE.forEach((n, i) => same(r[i], n.join(), n[1]));
    });
    await check('their numbers: +25% and +50% to what MEND heals; DEWBURST 15% a hit, 3 times as much; the auras +5%, +7.5% and +10% ATTACK, EVERBLOOM CROWN 10% a hit to MEND; SEED GUNNER every 5th hit, 1 tile, 120 frames, 0.2 of the gun; GROVE ENGINEER 3 tiles, 1%, every 180 frames; HERBALIST\'s bites MEND, the pool +50%', () => {
        const r = J(`({ sap: EQUIP_CARDS.sap_vein.bonus, nectar: EQUIP_CARDS.nectar_heart.bonus, dew: EQUIP_CARDS.dewburst.proc, band: EQUIP_CARDS.thorn_band.aura, sigil: EQUIP_CARDS.petal_sigil.aura, crown: EQUIP_CARDS.everbloom_crown.aura,
            seed: EQUIP_CARDS.seed_gunner.kit.seedfall, grove: EQUIP_CARDS.grove_engineer.kit.grove, herb: [EQUIP_CARDS.herbalist.kit.biteMend, EQUIP_CARDS.herbalist.kit.poolHeal], mend: ELEMENT_MEND, att: _EQUIP_ATTUNED.blossom })`);
        same(JSON.stringify(r.sap), '{"mend":0.25}', 'SAP VEIN'); same(JSON.stringify(r.nectar), '{"mend":0.5}', 'NECTAR HEART'); same([r.dew.kind, r.dew.chance, r.dew.mult].join(), 'dewburst,0.15,3', 'DEWBURST');
        same([r.band.attack, r.band.status || 0, r.band.el].join(), '0.05,0,blossom', 'THORN BAND'); same([r.sigil.attack, r.sigil.status || 0, r.sigil.el].join(), '0.075,0,blossom', 'PETAL SIGIL'); same([r.crown.attack, r.crown.status, r.crown.el].join(), '0.1,0.1,blossom', 'EVERBLOOM CROWN');
        same([r.seed.every, r.seed.radius, r.seed.frames, r.seed.bite].join(), '5,1,120,0.2', 'SEED GUNNER'); same([r.grove.radius, r.grove.share, r.grove.every].join(), '3,0.01,180', 'GROVE ENGINEER'); same(r.herb.join(), 'true,0.5', 'HERBALIST');
        same([r.mend.radius, r.mend.share].join(), '4,0.02', 'BLOOM\'s MEND (as before)'); same(r.att, 'dewburst', 'BLOOM\'s status for ATTUNED CORE');
    });
    await check('their words are made from their numbers, and their kind lines name BLOOM', () => {
        const r = J(`${JSON.stringify(NINE.map(n => n[0]))}.map(id => [EQUIP_CARDS[id].text, equipKindLabel(EQUIP_CARDS[id])])`);
        const W = [
            ['+25% TO WHAT ITS MEND HEALS', 'ELEMENT · BLOOM'], ['+50% TO WHAT ITS MEND HEALS', 'ELEMENT · BLOOM'], ['15% PER HIT TO DEWBURST: ITS MEND HEALS 3 TIMES AS MUCH', 'ELEMENT · BLOOM'],
            ['AURA: +5% ATTACK TO EVERY FOLLOWER WITHIN 4 TILES IN ITS ROOM, AND THE CLONE', 'CLASS · BLOOM MAGE'], ['AURA: +7.5% ATTACK TO EVERY FOLLOWER WITHIN 4 TILES IN ITS ROOM, AND THE CLONE', 'CLASS · BLOOM MAGE'],
            ['AURA: +10% ATTACK TO EVERY FOLLOWER WITHIN 4 TILES IN ITS ROOM, AND THE CLONE · EACH OF THEIR HITS: 10% TO MEND', 'CLASS · BLOOM MAGE'],
            ['YOUR ROUNDS ARE BLOOM · EVERY 5TH SHOT THAT HITS PLANTS A SMALL SEEDFALL WHERE IT HITS, 1 TILE ROUND FOR 2 SECONDS: ENEMIES IN IT BITTEN, YOUR FOLLOWERS IN IT MENDED', 'PLAYER · GUNSLINGER · BLOOM'],
            ['YOUR PUNCH AND ARC ARE BLOOM · EVERY ONLINE RELAY MENDS YOUR FOLLOWERS WITHIN 3 TILES OF IT 1% OF THEIR HEALTH EVERY 3 SECONDS', 'PLAYER · TECHNOMANCER · BLOOM'],
            ["YOUR LASH AND YOUR CLONE'S BITES ARE BLOOM · EVERY BITE OF YOUR CLONE MENDS: THE MOST HURT FOLLOWER WITHIN 4 TILES OF IT HEALS · YOUR SERUM'S POOL HEALS 50% MORE", 'PLAYER · MUTATOR · BLOOM'],
        ];
        W.forEach((w, i) => { same(r[i][0], w[0], NINE[i][1] + '\'s words'); same(r[i][1], w[1], NINE[i][1] + '\'s kind line'); });
    });
    await check('they fit: Pack 1\'s three on a BLOOM follower of any class (THORNWHIP, SUNDEW, STONEPETAL), not on a fire or a toxic one; the auras on a BLOOM Mage (THORNWHIP), not on a fire Mage (EMBER COWL) nor on a BLOOM Brawler; a fire Mage\'s aura not on THORNWHIP', () => {
        const r = J(`(function(){ __fresh(); const th = __wear('shrub', null, 0, 0), su = __wear('sundew', null, 1, 0), st = __wear('coralcrab', null, 2, 0), ec = __wear('embercowl', null, 3, 0), ro = __wear('rotshard', null, 4, 0), C = EQUIP_CARDS;
            return { p1: [th, su, st, ec, ro].map(f => ['sap_vein', 'nectar_heart', 'dewburst'].map(id => equipFit(f, C[id]) || 'fits').join('/')), au: [th, ec, su].map(f => ['thorn_band', 'petal_sigil', 'everbloom_crown'].map(id => equipFit(f, C[id]) || 'fits').join('/')),
                fire: equipFit(th, C.kindling_band) || 'fits' }; })()`);
        same(r.p1.slice(0, 3).join('|'), 'fits/fits/fits|fits/fits/fits|fits/fits/fits', 'on THORNWHIP, SUNDEW, STONEPETAL');
        same(r.p1[3], 'FOR BLOOM FOLLOWERS/FOR BLOOM FOLLOWERS/FOR BLOOM FOLLOWERS', 'on EMBER COWL (fire)'); same(r.p1[4], 'FOR BLOOM FOLLOWERS/FOR BLOOM FOLLOWERS/FOR BLOOM FOLLOWERS', 'on ROTSHARD (toxic)');
        same(r.au[0], 'fits/fits/fits', 'the auras on THORNWHIP'); ok(/BLOOM MAGES/.test(r.au[1]) && !/fits/.test(r.au[1]), 'the auras on EMBER COWL: ' + r.au[1]); ok(!/fits/.test(r.au[2]), 'the auras on SUNDEW: ' + r.au[2]);
        ok(/FIRE MAGES/.test(r.fire), 'KINDLING BAND on THORNWHIP: ' + r.fire);
    });

    group('BLOOM\'S MEND, MADE BIGGER (Pack 1: "MEND\'s heal", "DEWBURST: big MEND")');
    await check('a BLOOM follower\'s hit heals the most hurt of yours within 4 tiles 2% of its maximum health; with SAP VEIN 2.5%, NECTAR HEART 3%, both 3.5%', () => {
        const r = J(`(function(){ const hit = cards => { __fresh(); const b = __wear('sundew', cards, 0, 0), h = __hurt('maw', 1, 0), t = __foe('ant', 0.6, 0.4); equipTick(true); return __mend(h, () => applyDamage(t, 10, b, null, false, false, DMG_HIT_MAIN)); };
            return { none: hit(null), sap: hit('sap_vein'), nectar: hit('nectar_heart'), both: hit(['sap_vein', 'nectar_heart']), thorn: (function(){ __fresh(); const b = __wear('shrub', 'nectar_heart', 0, 0), h = __hurt('maw', 1, 0), t = __foe('ant', 0.6, 0.4); return __mend(h, () => applyDamage(t, 10, b, null, false, false, DMG_HIT_MAIN)); })() }; })()`);
        near(r.none, 0.02, 1e-6, 'no card'); near(r.sap, 0.025, 1e-6, 'SAP VEIN'); near(r.nectar, 0.03, 1e-6, 'NECTAR HEART'); near(r.both, 0.035, 1e-6, 'both'); near(r.thorn, 0.03, 1e-6, 'NECTAR HEART on a THORNWHIP');
    });
    await check('DEWBURST: on a roll under 15% the MEND heals 3 times as much (6%) with a burst of pink dew on the one it healed; over it, 2% and no dew; it rolls in the MEND only, not again as a status on the hit; with NECTAR HEART, 9%', () => {
        const r = J(`(function(){ const keep = Math.random; try { const hit = (cards, roll) => { __fresh(); const b = __wear('sundew', cards, 0, 0), h = __hurt('maw', 1, 0), t = __foe('ant', 0.6, 0.4); equipTick(true); Math.random = () => roll;
                const got = __mend(h, () => applyDamage(t, 10, b, null, false, false, DMG_HIT_MAIN)); Math.random = keep; return [got, elementEffects.some(e => e.type === 'impact' && e.color === '#ffd3e8' && Math.hypot(e.x - h.x, e.y - h.y) < 0.01)]; };
            return { win: hit('dewburst', 0.149), lose: hit('dewburst', 0.151), nectar: hit(['dewburst', 'nectar_heart'], 0.149) }; } finally { Math.random = keep; } })()`);
        near(r.win[0], 0.06, 1e-6, 'a winning roll'); same(r.win[1], true, 'the dew on a winning roll'); near(r.lose[0], 0.02, 1e-6, 'a losing roll'); same(r.lose[1], false, 'dew on a losing roll'); near(r.nectar[0], 0.09, 1e-6, 'with NECTAR HEART');
    });
    await check('ATTUNED CORE on a THORNWHIP (an Elemental): its 12% roll sets BLOOM\'s status, DEWBURST, a MEND 3 times as big (6%) on top of the hit\'s own (2%); over it, the hit\'s own only', () => {
        const r = J(`(function(){ const keep = Math.random; try { const o = {}; const one = roll => { __fresh(); const m = __wear('shrub', 'attuned_core', 0, 0), h = __hurt('maw', 1, 0), t = __foe('ant', 0.6, 0.4); o.fit = equipFit(m, EQUIP_CARDS.attuned_core); equipTick(true); Math.random = () => roll;
                const got = __mend(h, () => applyDamage(t, 10, m, null, false, false, DMG_HIT_MAIN)); Math.random = keep; return got; };
            o.win = one(0.119); o.lose = one(0.121); return o; } finally { Math.random = keep; } })()`);
        same(r.fit, null, 'ATTUNED CORE on THORNWHIP'); near(r.win, 0.08, 1e-6, 'a winning roll'); near(r.lose, 0.02, 1e-6, 'a losing roll');
    });

    group('EVERBLOOM CROWN (BLOOM\'s Prototype aura: "Approve as drafted"; its extra a MEND)');
    await check('a follower in its reach, of any element, MENDs on a winning roll (10%): the most hurt of yours within 4 tiles of it 2%; not on a losing roll; one out of its reach never; the clone in its reach does; under THORN BAND or PETAL SIGIL never (their ATTACK only)', () => {
        const r = J(`(function(){ const keep = Math.random; try { const one = (card, roll, who) => { __fresh(); __wear('shrub', card, 0, 0); const far = who === 'far', a = who === 'clone' ? __clone(1, 1) : __wear('maw', null, far ? 6 : 2, 0), h = __hurt('maw', far ? 6.5 : 2.5, 1), t = __foe('ant', a.x - __P[0] + 0.5, a.y - __P[1]); equipTick(true);
                Math.random = () => roll; const got = __mend(h, () => applyDamage(t, 10, a, null, false, false, who === 'clone' ? DMG_HIT_CLONE : DMG_HIT_MAIN)); Math.random = keep; return [got, !!a._aura]; };
            return { win: one('everbloom_crown', 0.099), lose: one('everbloom_crown', 0.101), far: one('everbloom_crown', 0.05, 'far'), clone: one('everbloom_crown', 0.099, 'clone'), band: one('thorn_band', 0.05), sigil: one('petal_sigil', 0.05) }; } finally { Math.random = keep; } })()`);
        same(r.win.join(), '0.02,true', 'a winning roll (the hit is a fire Brawler\'s: no MEND of its own)'); same(r.lose.join(), '0,true', 'a losing roll'); same(r.far.join(), '0,false', 'out of its reach');
        same(r.clone.join(), '0.02,true', 'the clone in its reach'); same(r.band.join(), '0,true', 'under THORN BAND'); same(r.sigil.join(), '0,true', 'under PETAL SIGIL');
    });

    group('BLOOM\'S THREE ROLES (Player cards: "SEED GUNNER: seedfall", "GROVE ENGINEER: relays", "HERBALIST: bites and pool")');
    await check('SEED GUNNER: every 5th round that hits plants a small SEEDFALL where it hit (1 tile round, 120 frames, its bite 0.2 of the gun\'s damage; SEEDFALL said), the 10th a second; the 4 before none; with no role none', () => {
        const r = J(`(function(){ const plant = role => { __role('gunslinger', role); _pc.seedHits = 0; const e = __dummy(3, 0), seen = []; let hits = 0;
                for (let i = 0; i < 10; i++) { if (__shoot(e) > 0) hits++; for (const z of elementEffects) if (z.type === 'seedfall' && seen.indexOf(z) < 0) { seen.push(z); z.__at = i + 1; } }
                const z = seen[0], res = { hits, at: seen.map(q => q.__at), said: __said('SEEDFALL'), first: z ? [Math.round(Math.hypot(z.x - e.x, z.y - e.y) * 100) / 100, z.radius, z.maxLife, Math.round(z.bite / weaponDamage() * 1000) / 1000, z.element, !!(z.by && z.by.isPlayer)] : null };
                __gone(e); elementEffects.length = 0; return res; };
            return { role: plant('seed_gunner'), none: plant(null) }; })()`);
        same(r.role.hits, 10, 'the rounds that hit'); same(r.role.at.join(), '5,10', 'the shots that planted one'); same(r.role.said, true, 'SEEDFALL said');
        same(r.role.first.join(), '0,1,120,0.2,blossom,true', 'the SEEDFALL (where, how big, how long, its bite, its element, yours)'); same(r.none.hits, 10, 'the rounds that hit with no role'); same(r.none.at.length, 0, 'a SEEDFALL with no role');
    });
    await check('SEED GUNNER\'s SEEDFALL is THORNWHIP\'s, smaller: on its beats an enemy in it is bitten and a hurt follower in it mended', () => {
        const r = J(`(function(){ __role('gunslinger', 'seed_gunner'); _pc.seedHits = 4; const e = __dummy(3, 0), f = __ally(e.x + 0.4, e.y + 0.3); __shoot(e); const z = elementEffects.find(q => q.type === 'seedfall'), h0 = e.health, m0 = __share(f);
            __frames(65); const res = { planted: !!z, bit: h0 - e.health, mended: Math.round((__share(f) - m0) * 1e6) / 1e6 }; __gone(e); elementEffects.length = 0; return res; })()`);
        same(r.planted, true, 'no SEEDFALL on the 5th hit'); ok(r.bit > 0, 'the enemy in it was not bitten'); ok(r.mended >= 0.01, 'the follower in it was not mended: ' + r.mended);
    });
    await check('GROVE ENGINEER: on the card tick every ONLINE relay mends your followers within 3 tiles of it 1% of their maximum health, again only 180 frames later; one 3.5 tiles off nothing; nothing while the relay is down; nothing with the role off', () => {
        const r = J(`(function(){ const o = {}; __role('technomancer', 'grove_engineer'); _pc.groveAt = 0; for (const id in _fp.relays) _fp.relays[id].online = false;
            const R = _fp.F.relays[0], s = facilityRelayAt(R.id); _fp.relays[R.id].online = true; const a = __ally(s.x + 2.5, s.y), b = __ally(s.x + 3.5, s.y);
            equipTick(true); o.first = [__share(a), __share(b)]; equipTick(true); o.again = __share(a); frame += 180; equipTick(true); o.later = __share(a);
            _fp.relays[R.id].online = false; frame += 180; equipTick(true); o.down = __share(a); _fp.relays[R.id].online = true; equipPlayerPut(0, null); frame += 180; equipTick(true); o.off = __share(a);
            _fp.relays[R.id].online = false; return o; })()`);
        same(r.first.join(), '0.01,0', 'the first tick (3 tiles off: 2.5; 3.5)'); same(r.again, 0.01, 'at once again'); same(r.later, 0.02, '180 frames later'); same(r.down, 0.02, 'with the relay down'); same(r.off, 0.02, 'with the role off');
    });
    await check('HERBALIST: every bite of your clone MENDs (the most hurt follower within 4 tiles of it heals 2%); the serum\'s pool heals 1.5 times as much (9% a beat, not 6%); with no role, a bite mends nothing and the pool heals as before', () => {
        const r = J(`(function(){ const o = {}; const bite = role => { __role('mutator', role); const c = __mclone(), e = __byClone(c), f = __ally(c.x - 1, c.y + 0.5), h = e.health; c.bite(e); const res = [h - e.health > 0, __share(f)]; __gone(e, c); return res; };
            const pool = role => { __role('mutator', role); serumZones = []; const f = __ally(player.x - 1, player.y); serumSplash(player.x, player.y); serumTick(); const got = __share(f); serumZones = []; return got; };
            o.herb = bite('herbalist'); o.none = bite(null); o.pool = [pool('herbalist'), pool(null)]; __role('mutator', 'herbalist'); o.mult = [playerSerumHealMult()]; equipPlayerPut(0, null); o.mult.push(playerSerumHealMult()); return o; })()`);
        same(r.herb.join(), 'true,0.02', 'a bite with HERBALIST (it bit, the follower mended)'); same(r.none.join(), 'true,0', 'a bite with no role');
        near(r.pool[0], 0.09, 1e-6, 'the pool\'s beat with HERBALIST'); near(r.pool[1], 0.06, 1e-6, 'the pool\'s beat with no role'); same(r.mult.join(), '1.5,1', 'the pool\'s multiple');
    });
    await check('the player\'s own strikes in a BLOOM role\'s element MEND nothing by themselves: GROVE ENGINEER\'s punch and arc, HERBALIST\'s lash, SEED GUNNER\'s rounds (what a role mends is what its kit says)', () => {
        const r = J(`(function(){ const o = {}; const go = (cls, role, dx, fn) => { __role(cls, role); _pc.groveAt = 1e9; _pc.seedHits = 1; const f = __ally(player.x - 1, player.y + 0.5), e = __dummy(dx, 0), lost = fn(e); const res = [lost > 0, __share(f)]; __gone(e); _pc.groveAt = 0; return res; };
            o.punch = go('technomancer', 'grove_engineer', 1, __strike); o.arc = go('technomancer', 'grove_engineer', 4, __strike); o.lash = go('mutator', 'herbalist', 1, __strike); o.round = go('gunslinger', 'seed_gunner', 3, __shoot); return o; })()`);
        same(r.punch.join(), 'true,0', 'the punch'); same(r.arc.join(), 'true,0', 'the arc'); same(r.lash.join(), 'true,0', 'the lash'); same(r.round.join(), 'true,0', 'a round');
    });

    group('DEALT ONLY ONCE THE PURIFICATION MODULE HAS RUN');
    await check('the nine are the only BLOOM cards; no pack deals one before the module is installed and has run (installed, still running: none); after, Pack 1 deals its three and Series 2 its six', () => {
        const r = J(`(function(){ const Q = questState('purify'), keep = [Q.installedAt, Q.purifiedAt], o = {};
            o.bloom = Object.values(equipCards()).filter(c => !c.test && equipIsBloom(c)).map(c => c.id).sort();
            const pools = () => EQUIP_PACKS.map(p => equipPackPool(p).filter(c => equipIsBloom(c)).map(c => c.id).sort().join()), ready = () => o.bloom.filter(id => equipBloomReady(EQUIP_CARDS[id])).length;
            Q.installedAt = 0; Q.purifiedAt = 0; o.before = [pools(), ready()]; Q.installedAt = 1; o.running = [pools(), ready()]; Q.purifiedAt = 2; o.after = [pools(), ready()];
            o.others = Object.values(equipCards()).filter(c => !c.test && !equipIsBloom(c)).every(c => equipBloomReady(c));
            Q.installedAt = keep[0]; Q.purifiedAt = keep[1]; return o; })()`);
        same(r.bloom.join(), 'dewburst,everbloom_crown,grove_engineer,herbalist,nectar_heart,petal_sigil,sap_vein,seed_gunner,thorn_band', 'the BLOOM cards');
        same(JSON.stringify(r.before), JSON.stringify([['', ''], 0]), 'before the module'); same(JSON.stringify(r.running), JSON.stringify([['', ''], 0]), 'installed, still running');
        same(r.after[0][0], 'dewburst,nectar_heart,sap_vein', 'Pack 1 after'); same(r.after[0][1], 'everbloom_crown,grove_engineer,herbalist,petal_sigil,seed_gunner,thorn_band', 'Series 2 after'); same(r.after[1], 9, 'ready after');
        same(r.others, true, 'every other card dealt as before');
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
