// XP FOR WORKING (js/levels.js: XP_WORK, awardWorkXp; hooks in js/mass.js).
//
// THE REPORTED CASE: "How much experience is granted for working? Can we sort
// that out right now as opposed to experience from attacking?" It was none.
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
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(4 * ZONE_LENGTH); player.x = 20; player.y = 2; gameState.nightNumber = 1;`);
    // A worker of this element, a fresh follower with no job and no one else about.
    const worker = (el, duty) => run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); chargedMass.length = 0; frame += 7;
        spawnFollowerAtCrystal('${el}'); const f = followers[0]; f.returningToCrystal = false; f.duty = ${duty === false ? 'null' : "'worker'"}; f.job = null; f.stance = 'follow'; f.x = 20; f.y = 2; f.moveSpeed = 0.05;
        f.xp = xpForLevel(5); f.level = 5; _applyFollowerLevel(f, true); globalThis.__w = f; return 1; })()`);
    const xp = () => run('__w.xp - xpForLevel(__w.level) + (xpForLevel(__w.level) - xpForLevel(5)) - 0') ;   // total XP earned past level 5's floor, see below
    const earned = () => run('__w._workXp || 0');
    const scale = () => run('workXpScale()');

    console.log('\nTHE RATES');
    check('THE ASK: working pays XP — at the kill formula\'s scale (the enemies\' level in your zone ÷ 5)', () => {
        const s1 = scale();
        run(`gameState.nightNumber = 9;`); const s2 = scale(); run(`gameState.nightNumber = 1;`);
        ok(s1 >= 1 && s2 > s1, 'scale ' + s1 + ' at night 1, ' + s2 + ' at night 9');
        same(run('XP_WORK.neutralise + "," + XP_WORK.haul + "," + XP_WORK.rearm + "," + XP_WORK.ice'), '30,50,80,40', 'the base values');
    });
    check('a unit that is not a follower on the crew earns nothing (clones, the dead, nobody)', () => {
        same(run('awardWorkXp(null, "haul") + awardWorkXp({}, "haul")'), 0, 'no unit');
        const r = run(`(function(){ const c = makeClone('ant', 'scout', 5, 2); const g = awardWorkXp(c, 'haul'); c.dead = true; return g; })()`);
        same(r, 0, 'a clone');
    });

    console.log('\nTHE JOBS');
    check('THE ASK (electric): neutralising a lump pays XP_WORK.neutralise', () => {
        worker('electric');
        const r = run(`(function(){ const m = { x: 20.3, y: 2, state: MASS_STATE.CHARGED, progress: 0.9999, carrier: null, value: 10, bob: 0, spin: 0 }; chargedMass.push(m);
            const before = __w._workXp || 0; followerWorkTick(__w); return { gain: (__w._workXp || 0) - before, state: m.state }; })()`);
        same(r.state, 'neutral', 'the lump'); same(r.gain, Math.round(30 * scale()), 'its XP');
    });
    check('THE ASK (flux): delivering a lump pays XP_WORK.haul — and the hover hauler\'s double shards do not double it', () => {
        worker('flux');
        const r = run(`(function(){ const before = __w._workXp || 0; chargedMass.push({ x: crystal.x, y: crystal.y, state: MASS_STATE.CARRIED, carrier: __w, value: 10, bob: 0, spin: 0 });
            __w.x = crystal.x; __w.y = crystal.y; updateChargedMass(); const a = (__w._workXp || 0) - before; __w.evolved = 'hauler';
            chargedMass.push({ x: crystal.x, y: crystal.y, state: MASS_STATE.CARRIED, carrier: __w, value: 10, bob: 0, spin: 0 }); updateChargedMass();
            return { plain: a, hauler: (__w._workXp || 0) - before - a }; })()`);
        same(r.plain, Math.round(50 * scale()), 'a plain delivery'); same(r.hauler, r.plain, 'the hauler\'s delivery');
    });
    check('THE ASK (core): putting a pylon back online pays XP_WORK.rearm', () => {
        worker('core');
        const r = run(`(function(){ const t = { x: 20.3, y: 2, pillar: true, destroyed: false, offline: true, pillarTeam: 'green', rearmProgress: 0.9999, health: 10, maxHealth: 20 }; world.push(t);
            const before = __w._workXp || 0; followerWorkTick(__w); world.splice(world.indexOf(t), 1); return { gain: (__w._workXp || 0) - before, back: !t.offline }; })()`);
        ok(r.back, 'the pylon did not come back online'); same(r.gain, Math.round(80 * scale()), 'its XP');
    });
    check('THE ASK (toxic): mending a clone pays per point of health put in', () => {
        worker('toxic');
        const r = run(`(function(){ const c = makeClone('ant', 'scout', 20.5, 2); c.health = c.maxHealth * 0.2; c.update = () => {};
            let healed = 0; for (let i = 0; i < 400; i++) { const h = c.health; frame++; followerWorkTick(__w); healed += c.health - h; __w.x = 20; __w.y = 2; }
            c.dead = true; return { healed, got: __w._workXp || 0, acc: __w._mendXpAcc || 0 }; })()`);
        ok(r.healed > 20 && r.got > 0, JSON.stringify(r));
        ok(Math.abs(r.got + r.acc - r.healed * run('XP_MEND_PER_HP') * scale()) < 1.5, 'XP vs health healed: ' + JSON.stringify(r));
    });
    check('THE ASK (ice): setting a block pays XP_WORK.ice, and an enemy held against it pays XP_WORK.iceHold every XP_ICE_HOLD_EVERY', () => {
        worker('ice');
        const r = run(`(function(){ const before = __w._workXp || 0; followerWorkTick(__w); const set = (__w._workXp || 0) - before;
            const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), __w.x + 1.2, __w.y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p);
            frame = Math.ceil((frame + 1) / XP_ICE_HOLD_EVERY) * XP_ICE_HOLD_EVERY; const b2 = __w._workXp || 0; iceBlockTick(); const held = (__w._workXp || 0) - b2;
            p.x = __w.x + 6; frame += XP_ICE_HOLD_EVERY; const b3 = __w._workXp || 0; iceBlockTick(); const none = (__w._workXp || 0) - b3; p.dead = true;
            return { set, held, none, blocked: !!__w.iceBlock }; })()`);
        ok(r.blocked, 'no block'); same(r.set, Math.round(40 * scale()), 'setting it'); same(r.held, Math.round(10 * scale()), 'an enemy against it'); same(r.none, 0, 'no enemy near');
    });

    console.log('\nWHAT IT LEADS TO');
    check('THE ASK: a worker levels up from working — and so can evolve, with no kills at all', () => {
        worker('electric');
        const r = run(`(function(){ __w.level = 19; __w.xp = xpForLevel(20) - 5; _applyFollowerLevel(__w, true);
            const m = { x: 20.3, y: 2, state: MASS_STATE.CHARGED, progress: 0.9999, carrier: null, value: 10, bob: 0, spin: 0 }; chargedMass.push(m);
            followerWorkTick(__w); return { lv: __w.level, evo: __w.evolved || null }; })()`);
        same(r.lv, 20, 'level'); same(r.evo, 'pod', 'its form');
    });
    check('a fighter on the line earns nothing for a job it is not doing', () => {
        worker('electric', false);
        const r = run(`(function(){ const m = { x: 20.3, y: 2, state: MASS_STATE.CHARGED, progress: 0.9999, carrier: null, value: 10, bob: 0, spin: 0 }; chargedMass.push(m);
            followerWorkTick(__w); return { xp: __w._workXp || 0, state: m.state }; })()`);
        same(r.xp, 0, 'XP'); same(r.state, 'charged', 'it neutralised a lump while not on the crew');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
