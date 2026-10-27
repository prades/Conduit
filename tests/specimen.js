// THE ICE MAGE'S SPECIMEN RECOVERY, AND THE RESURRECTION ZONE (docs/SPECIMENS.md; js/specimen.js, js/mutator.js, js/game.js, js/inventory.js, js/facilitysave.js).
// ASKED (the brief): "1. A friendly creature dies and leaves a recoverable body. 2. The player approaches the body and holds the interaction input. 3. The player selects the recovery/revive interaction. 4. The Ice
// Mage freezes and preserves the fallen specimen. 5. The main character handles the specimen's containment capsule and transports it to the Resurrection Zone. 6. The capsule can then be used at the
// Resurrection Zone to restore the specimen." "Do not make the Ice Mage carry it." "Preserve the distinction between recovering a body and completing its resurrection."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; floatingTexts.length = 0;
            mutatorReset(); specimenReset(); invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; };
        globalThis.__fol = (el, type, dx, dy) => { spawnFollowerAtCrystal(el, type); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + (dx || 0); f.y = player.y + (dy || 0); return f; };
        globalThis.__fall = (f, forGood) => { if (forGood) f.base.hp = 1; const foe = { x: f.x + 1, y: f.y, team: 'red' }; for (let i = 0; i < 20 && !f.dead; i++) applyDamage(f, f.maxHealth, foe); render(); render(); return cloneBodies.find(b => b.actor === f) || null; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`);

    group('1. A FRIENDLY CREATURE DIES AND LEAVES A RECOVERABLE BODY');
    check('a follower that falls FOR GOOD (its HP stat has run out) leaves its body, with what it was; one that falls and comes back at the Crystal leaves none', () => {
        const r = J(`(function(){ __clear(); const a = __fol('fire', 'brawler', 1.5, 0); const back = __fall(a, false); const queued = respawnQueue.length; const b = __fol('electric', 'sniper', 2, 1); b.level = 12; const lv = b.level; const body = __fall(b, true);
            return { back: !!back, queued, body: !!body, kind: body && body.kind, rec: body && [body.rec.element, body.rec.role, body.rec.level], lv, said: floatingTexts.map(t => t.text).join('|') }; })()`);
        same(r.back, false, 'a follower that comes back left a body'); same(r.queued, 1, 'it was not queued to come back'); same(r.body, true, 'no body'); same(r.kind, 'follower', 'its kind');
        same(r.rec.join(), 'electric,sniper,' + r.lv, 'its record'); ok(/FALLEN FOR GOOD/.test(r.said), 'nobody said: ' + r.said);
    });
    check('the Mutator\'s clone leaves its body too (js/mutator.js), and a body is drawn where it fell, a follower\'s as the follower it was', () => {
        const r = J(`(function(){ __clear(); const f = __fol('core', 'brawler', 1, 0); const b = __fall(f, true); let err = null; try { drawCloneBody(b, 400, 300); } catch (e) { err = e.message; } return { err, list: (() => { const l = []; cloneBodiesDrawItems(l); return l.length; })() }; })()`);
        same(r.err, null, 'drawing a follower\'s body threw'); same(r.list, 1, 'it is not in the draw list');
    });

    group('2 AND 3. THE PLAYER APPROACHES IT, HOLDS, AND PICKS THE RECOVERY');
    check('the body\'s ring: PRESERVE (on the right) when an Ice Mage is near, PRESERVE · NO ICE MAGE when none is; a follower\'s body has no SALVAGE (that is a clone\'s DNA)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); const none = mutatorBodyRing(b); const m = __fol('ice', 'sniper', -2, 1); const some = mutatorBodyRing(b);
            return { none: none.right && none.right.label, some: some.right && some.right.label, act: some.right && some.right.act, up: !!some.up, mage: specimenIsMage(m), notMage: specimenIsMage(__fol('ice', 'brawler', 3, 3)) }; })()`);
        ok(/NO ICE MAGE/.test(r.none), 'without one: ' + r.none); same(r.some, 'PRESERVE', 'with one'); same(r.act, 'preserve_body', 'its order'); same(r.up, false, 'a follower\'s body offers SALVAGE');
        same(r.mage, true, 'an ice mage is not an Ice Mage'); same(r.notMage, false, 'an ice brawler is an Ice Mage');
    });
    check('a long press on the body opens that ring (it wins over the ground), and PRESERVE without an Ice Mage says what is needed and does nothing', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); const p = _bodyPickPoint(b); handleLongHold(p.x, p.y); const pressed = commandBodyTarget === b; commandMode = false;
            floatingTexts.length = 0; commandBodyTarget = b; selectedRadialAction = 'preserve_body'; executeCommand(); return { pressed, said: floatingTexts.map(t => t.text).join('|'), frozen: !!b.frozen, pres: !!_pres }; })()`);
        same(r.pressed, true, 'the long press did not pick the body'); ok(/ICE MAGE IS NEEDED/.test(r.said), 'nothing said: ' + r.said); same(r.frozen, false, 'it froze'); same(r.pres, false, 'a preservation began');
    });
    check('from further off, PRESERVE walks the player to the body first; there it begins', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); __fol('ice', 'sniper', 0, 2); player.x = player.visualX = b.x - 5; player.fpPath = null;
            const first = cloneBodyAct(b, 'preserve'); const walking = !!(player.fpPath && player.fpPath.length); __frames(120); return { first, walking, began: !!_pres, near: cloneBodyNear(b) }; })()`);
        same(r.first, null, 'it began from afar'); same(r.walking, true, 'the player did not walk'); same(r.near, true, 'the player did not get there'); same(r.began, true, 'it did not begin on arrival');
    });

    group('4. THE ICE MAGE FREEZES AND PRESERVES IT (and does not carry it)');
    check('the Ice Mage walks to the body and works at it (PRESERVING, a beam, a ring filling) for SPECIMEN.freeze.frames; then the body is a containment capsule on the floor, and the mage goes back to the squad', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); const m = __fol('ice', 'sniper', -4, 2); cloneBodyAct(b, 'preserve');
            let cast = null, err = null; for (let i = 0; i < 900 && !b.frozen; i++) { render(); if (_pres && _pres.phase === 'cast' && cast === null) { cast = frame; try { drawSpecimenOverlay(); } catch (e) { err = e.message; } } }
            return { frozen: !!b.frozen, cast: cast !== null, dist: Math.hypot(m.x - b.x, m.y - b.y), took: b.frozenAt - cast, frames: SPECIMEN.freeze.frames, job: m.job ? m.job.specimen === true : false, err, onMage: Object.keys(m).filter(k => /capsule|specimen/i.test(k)).length, pack: invCount('specimen_capsule'), bodies: cloneBodies.length }; })()`);
        same(r.cast, true, 'it never worked at it'); same(r.frozen, true, 'it was not preserved'); ok(r.dist <= 3.1, 'the mage was ' + r.dist.toFixed(2) + ' tiles off'); ok(Math.abs(r.took - r.frames) <= 2, 'it took ' + r.took + ' frames');
        same(r.job, false, 'the mage still has the job'); same(r.err, null, 'the beam threw'); same(r.onMage, 0, 'the Ice Mage is carrying it'); same(r.pack, 0, 'it went into the pack by itself'); same(r.bodies, 1, 'the capsule is not on the floor');
    });
    check('if the Ice Mage falls while it works, the body is not preserved (and can be preserved later)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); const m = __fol('ice', 'sniper', 0.5, 1); cloneBodyAct(b, 'preserve'); let n = 0; while (!(_pres && _pres.phase === 'cast') && n < 300) { render(); n++; }
            __fall(m, false); __frames(3); const o = { frozen: !!b.frozen, pres: !!_pres, said: floatingTexts.map(t => t.text).join('|') }; const m2 = __fol('ice', 'sniper', 0.5, 1); o.again = cloneBodyAct(b, 'preserve'); return o; })()`);
        same(r.frozen, false, 'it was preserved anyway'); same(r.pres, false, 'the preservation carried on'); ok(/ICE MAGE IS GONE/.test(r.said), 'nobody said: ' + r.said); same(r.again, true, 'it could not be preserved later');
    });

    group('5. THE MAIN CHARACTER TAKES THE CAPSULE AND CARRIES IT');
    check('the player takes the capsule by walking over it: the pack has a SPECIMEN CAPSULE (it holds the specimen), the floor does not; with no room in the pack it stays', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); b.frozen = true; player.x = b.x - 3; player.fpPath = null; render(); const before = [invCount('specimen_capsule'), cloneBodies.length];
            player.x = player.visualX = b.x; player.y = player.visualY = b.y; render(); const after = [invCount('specimen_capsule'), cloneBodies.length, specimenCarried.length, specimenCarried[0] && specimenCarried[0].kind];
            const f2 = __fol('core', 'brawler', 0.2, 0.2); const b2 = __fall(f2, true); b2.frozen = true; playerInv.specimen_capsule = ITEMS.specimen_capsule.stack; player.x = player.visualX = b2.x; player.y = player.visualY = b2.y; render(); render();
            return { before, after, full: cloneBodies.includes(b2), said: floatingTexts.map(t => t.text).join('|') }; })()`);
        same(r.before.join(), '0,1', 'before'); same(r.after.join(), '1,0,1,follower', 'after walking over it'); same(r.full, true, 'it was taken with no room'); ok(/NO ROOM/.test(r.said), 'nobody said: ' + r.said);
    });
    check('RECOVERING IS NOT RESURRECTING: away from the Resurrection Zone, carrying it or using it restores nothing and says where to take it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); b.frozen = true; player.x = player.visualX = b.x; player.y = player.visualY = b.y; render(); player.x = player.visualX = crystal.x - 2; player.y = player.visualY = crystal.y + 6; __frames(30);
            const n0 = followers.length; const use = invUse('specimen_capsule'); return { inZone: specimenInZone(), use: use.ok, why: use.why, followers: followers.length - n0, still: specimenCarried.length }; })()`);
        same(r.inZone, false, 'fixture: in the zone'); same(r.use, false, 'it was used'); ok(/RESURRECTION ZONE/.test(r.why), 'it says: ' + r.why); same(r.followers, 0, 'it came back anyway'); same(r.still, 1, 'the capsule went');
    });

    group('6. AT THE RESURRECTION ZONE (THE CRYSTAL) THE CAPSULE RESTORES THE SPECIMEN, AS IT WAS');
    check('with a capsule in the pack the zone shows round the Crystal; standing in it, the plate (a tap) restores a FOLLOWER with its record, and the capsule is spent', () => {
        const r = J(`(function(){ __clear(); const f = __fol('toxic', 'sniper', 1, 0); f.level = 14; f.evolved = 'rotshard'; const rec = followerRecord(f); const b = __fall(f, true); b.frozen = true; player.x = player.visualX = b.x; player.y = player.visualY = b.y; render();
            player.x = player.visualX = crystal.x + 1; player.y = player.visualY = crystal.y + 1; render(); const said = []; const keep = uiButton; uiButton = function (r, label) { said.push(String(label)); return keep.apply(this, arguments); }; try { drawSpecimenOverlay(); } finally { uiButton = keep; }
            const p = _spPlate(); const n0 = followers.length; handleInput(p.x + p.w / 2, p.y + p.h / 2); const back = followers[followers.length - 1];
            return { inZone: specimenInZone(), plate: said.join('|'), came: followers.length - n0, back: back && [back.element, back.role, back.level, back.evolved], want: [rec.element, rec.role, rec.level, rec.evolved], pack: invCount('specimen_capsule'), left: specimenCarried.length }; })()`);
        same(r.inZone, true, 'fixture: not in the zone'); ok(/RESTORE: ROTSHARD/.test(r.plate), 'the plate: ' + r.plate); same(r.came, 1, 'nobody came back'); same(JSON.stringify(r.back), JSON.stringify(r.want), 'it came back otherwise'); same(r.pack, 0, 'the capsule was not spent'); same(r.left, 0, 'the specimen is still carried');
    });
    check('a CLONE specimen comes back as the Mutator\'s clone again, with its level, upgrades and what it cost; with a clone already out it is refused and the capsule is kept', () => {
        const r = J(`(function(){ __clear(); classSet('mutator'); dnaApply({ ant_scout: 99, beetle_scout: 60 }); shardCount = 999; executeClone(getCloneOptions().find(o => o.key === 'ant_scout')); const c = mutatorClone(); cloneUpgradeBuy('armor'); cloneUpgradeBuy('leap'); c.level = 9; _applyPredLevel(c, true);
            const want = [c.level, JSON.stringify(c.upgrades), c.invested]; c.x = player.x + 1; c.y = player.y; for (let i = 0; i < 20 && !c.dead; i++) applyDamage(c, c.maxHealth, { x: c.x + 1, y: c.y, team: 'red' }); __frames(2); const b = cloneBodies[0]; b.frozen = true;
            player.x = player.visualX = b.x; player.y = player.visualY = b.y; render(); executeClone(getCloneOptions().find(o => o.key === 'ant_scout')); player.x = player.visualX = crystal.x + 1; player.y = player.visualY = crystal.y + 1; render();
            const refused = specimenRestore(); const kept = specimenCarried.length; dismissOldestClone(); __frames(2); const back = specimenRestore();
            return { refused: refused === null, kept, said: floatingTexts.map(t => t.text).join('|'), back: back ? [back.level, JSON.stringify(back.upgrades), back.invested, back.primary] : null, want, pack: invCount('specimen_capsule') }; })()`);
        same(r.refused, true, 'it came back beside another clone'); same(r.kept, 1, 'the capsule was spent when refused'); ok(/ONE CLONE AT A TIME/.test(r.said), 'nobody said why: ' + r.said);
        same(JSON.stringify(r.back && r.back.slice(0, 3)), JSON.stringify(r.want), 'it came back otherwise'); same(r.back && r.back[3], true, 'it is not the Mutator\'s clone'); same(r.pack, 0, 'the capsule was not spent');
    });
    check('the body is ONE thing: a preserved body cannot be salvaged; a salvaged one is gone, so nothing is left to preserve', () => {
        const r = J(`(function(){ __clear(); classSet('mutator'); dnaApply({ ant_scout: 99 }); shardCount = 999; executeClone(getCloneOptions().find(o => o.key === 'ant_scout')); const c = mutatorClone(); c.x = player.x + 1; c.y = player.y; for (let i = 0; i < 20 && !c.dead; i++) applyDamage(c, c.maxHealth, { x: c.x + 1, y: c.y, team: 'red' }); __frames(2);
            const b = cloneBodies[0]; b.frozen = true; const d0 = getDNA().ant_scout; const s = cloneSalvage(b); const o = { salvaged: s, dna: getDNA().ant_scout - d0, still: cloneBodies.includes(b), ring: [!!mutatorBodyRing(b).up, !!mutatorBodyRing(b).right] };
            b.frozen = false; cloneSalvage(b); __fol('ice', 'sniper', 0, 1); o.preserve = cloneBodyAct(b, 'preserve'); return o; })()`);
        same(r.salvaged, 0, 'a capsule was salvaged'); same(r.dna, 0, 'DNA came back from a capsule'); same(r.still, true, 'the capsule went'); same(r.ring.join(), 'false,false', 'a capsule\'s ring has orders'); same(r.preserve, false, 'a salvaged body was preserved');
    });

    group('THE SAVE');
    check('a capsule in the pack and a capsule on the floor are kept by the save (the pack\'s count is the capsules\'), and come back after a reload', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 1, 0); const b = __fall(f, true); b.frozen = true; player.x = player.visualX = b.x; player.y = player.visualY = b.y; render(); const g = __fol('core', 'sniper', 4, 0); const b2 = __fall(g, true); b2.frozen = true;
            const d = JSON.parse(JSON.stringify(facilitySaveCollect())); mutatorReset(); specimenReset(); invReset(); playerInv = d.inv; cloneBodiesApply(d.bodies); specimenApply(d.capsules);
            return { carried: specimenCarried.length, kind: specimenCarried[0] && specimenCarried[0].kind, pack: invCount('specimen_capsule'), floor: cloneBodies.filter(x => x.frozen && x.kind === 'follower').length, rec: cloneBodies[0] && cloneBodies[0].rec.element }; })()`);
        same(r.carried, 1, 'the carried capsule'); same(r.kind, 'follower', 'what it holds'); same(r.pack, 1, 'the pack\'s count'); same(r.floor, 1, 'the capsule on the floor'); same(r.rec, 'core', 'the floor capsule\'s specimen');
    });
    check('the capsule is data (ITEMS): any class carries and uses it; the Resurrection Zone is the Crystal (the game\'s existing resurrection), not a new place on the map', () => {
        const r = J(`(function(){ const d = ITEMS.specimen_capsule; return { item: !!d, classes: d.classes, order: ITEM_ORDER.includes('specimen_capsule'), zone: SPECIMEN.zone.radius > 0 }; })()`);
        same(r.item, true, 'no item'); same(r.classes, null, 'it is reserved for a class'); same(r.order, true, 'not in the pack\'s order'); same(r.zone, true, 'no zone');
        ok(/function specimenInZone\(\) \{ return typeof crystal/.test(rd('js/specimen.js')), 'the zone is not the Crystal\'s');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
