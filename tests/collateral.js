// COLLATERAL — a predator's specials and shots hurt the equipment in the way.
//
// THE REPORTED CASE: "when predators aren't directly attacking the equipment
// like the batteries and the turrets and stuff make sure that whenever they
// use their special attacks like their charge in or their bombs or whenever a
// projectile is shot at a follower but hits the equipment that it does damage
// to the equipment."
//
// Before: the area specials and the rounds only ever looked for UNITS (and the
// player), so a turret standing in a beetle's charge, or between a spider and
// the follower it shot at, took nothing. Now (helpers.js, hurtEquipment…):
//   CARAPACE SLAM, MANDIBLE FRENZY, BLADE FLURRY, BLINDING DUST hit your
//   pylons in their radius (at EQUIP_HIT_MULT, the share a BASH does), and an
//   enemy round that passes over a pylon hits it instead and stops.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; shardCount = 3000; unlockedElements = new Set(ELEMENTS.map(e => e.id));
         ensureWorldTo(60); player.x = player.targetX = player.visualX = 22; player.y = player.targetY = player.visualY = 1.5; render();`);

    // A fresh turret (or battery) of yours at (x, y), at full health.
    const PYLON = (x, y, kind) => `(function(){ const t = getTile(${x}, ${y}); t.pillar = false; t.destroyed = false; t.pendingDestroy = false;
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === 'fire'), t, '${kind || 'attack'}');
        _cacheAge = -999; render(); return t; })()`;
    // A hostile predator of a species at (x, y), its own AI off, with a set power.
    const MOB = (sp, x, y, extra) => `(function(){ const p = spawnPredatorForZone(1, { species: '${sp}', className: 'scout' });
        p.update = () => {}; p.isWanderer = false; p.x = ${x}; p.y = ${y}; p.power = 20; p.maxHealth = p.health = 1e6; ${extra || ''} return p; })()`;
    const hp = (x, y) => run(`getTile(${x}, ${y}).health`);

    console.log('\nTHE SPECIALS');
    check('THE ASK: a beetle\'s CARAPACE SLAM through a turret damages it — once per charge', () => {
        run(PYLON(20, 1));
        const h0 = hp(20, 1);
        run(`(function(){ const b = ${MOB('beetle', 18.5, 1)}; b.abilityKey = 'CARAPACE_SLAM';
            b.dirX = 1; b.dirY = 0; const def = ABILITY_DEFS.CARAPACE_SLAM;
            _abStartActive(b, def); b.slamDX = def.distance / def.duration; b.slamDY = 0;   // straight at it
            for (let i = 0; i < def.duration; i++) _abRunActive(b, def); })()`);
        const hit = h0 - hp(20, 1), want = run('20 * ABILITY_DEFS.CARAPACE_SLAM.dmg * EQUIP_HIT_MULT');
        ok(Math.abs(hit - want) < 1e-6, 'the turret lost ' + hit + ', one slam is ' + want);
    });
    check('THE ASK: a MANDIBLE FRENZY beside a battery chews it every strike', () => {
        run(PYLON(24, 2, 'battery'));
        const h0 = hp(24, 2);
        run(`(function(){ const a = ${MOB('ant', 23.4, 2)}; a.abilityKey = 'MANDIBLE_FRENZY'; const def = ABILITY_DEFS.MANDIBLE_FRENZY;
            a.abilityHits = 0; for (let i = 1; i <= def.interval * 3; i++) { a.abilityTimer = i; _abRunActive(a, def); } })()`);
        const hit = h0 - hp(24, 2), want = 3 * run('20 * ABILITY_DEFS.MANDIBLE_FRENZY.dmg * EQUIP_HIT_MULT');
        ok(Math.abs(hit - want) < 1e-6, 'the battery lost ' + hit + ' over three strikes, expected ' + want);
    });
    check('a moth\'s BLINDING DUST corrodes what stands in it', () => {
        run(PYLON(28, 1));
        const h0 = hp(28, 1);
        run(`(function(){ const m = ${MOB('moth', 27, 1.5)}; m.abilityKey = 'BLINDING_DUST'; const def = ABILITY_DEFS.BLINDING_DUST;
            m.abilityTimer = def.dotEvery; _abRunActive(m, def); })()`);
        ok(hp(28, 1) < h0, 'dust did nothing to the turret');
    });
    check('a CLONE\'s special does not hurt your own equipment', () => {
        run(PYLON(32, 1));
        const h0 = hp(32, 1);
        run(`(function(){ const c = ${MOB('ant', 31.4, 1, 'p.isClone = true; p.team = "green";')}; c.abilityKey = 'MANDIBLE_FRENZY'; const def = ABILITY_DEFS.MANDIBLE_FRENZY;
            for (let i = 1; i <= def.interval * 2; i++) { c.abilityTimer = i; _abRunActive(c, def); } })()`);
        same(hp(32, 1), h0, 'a clone\'s frenzy damaged a pylon');
    });
    check('worn to nothing, the equipment is destroyed as a bashed one is', () => {
        run(`getTile(20, 1).health = 1;`);
        run(`(function(){ const b = ${MOB('beetle', 18.5, 1)}; b.abilityKey = 'CARAPACE_SLAM'; const def = ABILITY_DEFS.CARAPACE_SLAM;
            _abStartActive(b, def); b.slamDX = def.distance / def.duration; b.slamDY = 0;
            for (let i = 0; i < def.duration; i++) _abRunActive(b, def); for (let i = 0; i < 3; i++) render(); })()`);
        ok(run('getTile(20, 1).destroyed || !getTile(20, 1).pillar'), 'still standing at 0 HP');
    });

    console.log('\nTHE SHOTS');
    // A round fired along row y from x0 toward a follower at x1.
    const SHOT = (x0, x1, y, greens) => `(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1];
        f.returningToCrystal = false; f.x = ${x1}; f.y = ${y}; f.moveSpeed = 0; f.maxHealth = f.health = 1000;
        const src = { x: ${x0}, y: ${y}, stats: { specialAttack: 12 } };
        spawnFollowerProjectile(src, f, '#88ff44', 12, 4, null);
        ${greens ? 'followerProjectiles[followerProjectiles.length - 1].targetsGreen = true;' : ''}
        const pr = followerProjectiles[followerProjectiles.length - 1];
        // Did THIS round hit the follower? (A floor hazard or a passing
        // predator may nick it over 90 frames; that is not what is asked.)
        let shotHit = false; const keep = applyDamage;
        applyDamage = function (t, amt, source) { if (t === f && source === src) shotHit = true; return keep.apply(this, arguments); };
        try { for (let i = 0; i < 90; i++) { gameState.running = true; f.x = ${x1}; f.y = ${y}; render(); } }
        finally { applyDamage = keep; }
        return { follower: shotHit ? 0 : 1000, flying: followerProjectiles.includes(pr) }; })()`;
    check('THE ASK: a round shot at a follower that passes over a turret hits the turret — and stops there', () => {
        run(PYLON(40, 2));
        const h0 = hp(40, 2);
        const r = run(SHOT(37, 43, 2, true));
        same(h0 - hp(40, 2), 12, 'turret damage');
        same(r.follower, 1000, 'the follower behind it was hit as well');
    });
    check('…with nothing in the way, the follower is hit as before', () => {
        const r = run(SHOT(46, 50, 1, true));
        ok(r.follower < 1000, 'the follower was not hit');
    });
    check('…and YOUR rounds fly over your own equipment', () => {
        run(PYLON(54, 2));
        const h0 = hp(54, 2);
        run(`(function(){ const p = ${MOB('ant', 57, 2)};
            spawnFollowerProjectile({ x: 51, y: 2, stats: {} }, p, '#f80', 12, 4, null);
            for (let i = 0; i < 60; i++) { gameState.running = true; render(); } })()`);
        same(hp(54, 2), h0, 'a friendly round hit a pylon');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
