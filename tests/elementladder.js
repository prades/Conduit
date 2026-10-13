// THE ELEMENT LADDER — earned in order, and the zones' predators in the same order.
//
// THE REPORTED CASE: "allow the player to unlock the different elements and the
// different tech for that element only once they acquire it. After every two
// waves they can unlock a new element, in this order: electric, flux, fire,
// core, toxic and ice. Every third zone the predators are the next element in
// that type chart. And make the elemental surges only one specific type at
// random."
// (The earning itself is pinned in tests/progression.js.)
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
    run(`gameState.running = true; tutorialMode = false; ensureWorldTo(300); render();`);

    console.log('\nA NEW GAME');
    check('THE ASK: you start with ELECTRIC only — and its tech only', () => {
        same(run('[...unlockedElements].join(",")'), 'electric', 'unlocked');
        same(run('isPylonTypeUnlocked("electric")'), true, 'electric pylons');
        for (const el of ['flux', 'fire', 'core', 'toxic', 'ice']) same(run(`isPylonTypeUnlocked("${el}")`), false, el + ' pylons');
    });
    check('…your followers are electric until you earn more', () => {
        const els = run(`(function(){ const out = new Set(); for (let i = 0; i < 30; i++) { const p = recruitElementPool(); out.add(p[Math.floor(Math.random() * p.length)]); } return [...out]; })()`);
        same(els.join(','), 'electric', 'the recruit pool');
    });
    check('…and the build window greys the locked elements', () => {
        const st = run(`buildMenuItems('turrets').map(i => i.elId + ':' + (buildItemState(i).why || 'ok'))`);
        ok(st.filter(s => !s.startsWith('electric')).every(s => /LOCKED/.test(s)), st.join(' '));
    });

    console.log('\nTHE ZONES');
    check('THE ASK: every third zone is the next element in the chart, round again after ice', () => {
        const got = run('[1,2,3,4,6,7,9,10,12,13,15,16,18,19,21,22].map(z => zoneElement(z)).join(",")');
        same(got, 'electric,electric,electric,flux,flux,fire,fire,core,core,toxic,toxic,ice,ice,electric,electric,flux', 'zone elements');
    });
    check('a predator spawned in a zone takes its element (and a clone does not)', () => {
        const r = run(`(function(){ const a = spawnPredatorForZone(5, { species: 'ant', className: 'scout' });
            const b = spawnPredatorForZone(8, { species: 'ant', className: 'scout' }); a.dead = b.dead = true;
            const c = makeClone('ant', 'scout', 5, 2); c.dead = true;
            return { a: a.element, b: b.element, c: c.element || null }; })()`);
        same(r.a, 'flux', 'zone 5'); same(r.b, 'fire', 'zone 8'); same(r.c, null, 'a clone');
    });
    check('the type chart runs on them: what beats their element hits harder', () => {
        const r = run(`(function(){ const p = spawnPredatorForZone(10, { species: 'ant', className: 'scout' });   // core
            p.maxHealth = p.health = 1e6; p.def = 0;
            const hit = el => { const f = { team: 'green', isFollower: true, element: el, level: p.level, x: p.x, y: p.y };
                const h = p.health; applyDamage(p, 100, f); return h - p.health; };
            const out = { strong: hit('electric'), plain: hit('fire') }; p.dead = true; return out; })()`);
        ok(r.strong > r.plain * 1.2, 'electric on a core predator ' + r.strong + ' vs fire ' + r.plain);
    });
    check('it wears its element: a ring, and its tag in its colour, naming it', () => {
        const r = run(`(function(){ const p = spawnPredatorForZone(5, { species: 'ant', className: 'scout' }); p.dead = true;
            return unitTypeLabel(p); })()`);
        ok(/^FLUX ANT SCOUT/.test(r), r);
        ok(/obj\.actor\._breakout \|\| obj\.actor\._zoneElement/.test(fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8')), 'no ring for a zone element');
    });

    console.log('\nTHE BREAKOUT NIGHT');
    check('THE ASK: an elemental breakout is ONE element, at random — every predator takes it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            const ps = [1, 5, 8, 11].map(z => spawnPredatorForZone(z, { species: 'ant', className: 'scout' }));
            siegeToday = 'breakout'; breakoutElement = null; frame = Math.ceil((frame + 1) / BREAKOUT_TICK) * BREAKOUT_TICK; breakoutTick();
            const during = ps.map(p => p.element);
            siegeToday = null; frame += BREAKOUT_TICK; breakoutTick();
            const after = ps.map(p => p.element), zones = ps.map(p => p._zoneElement);
            ps.forEach(p => { p.dead = true; }); return { during, after, zones }; })()`);
        same(new Set(r.during).size, 1, 'elements during the breakout: ' + r.during);
        same(JSON.stringify(r.after), JSON.stringify(r.zones), 'after the night they are their zones\' again');
    });
    check('…and a different night can roll a different one', () => {
        const seen = new Set(run(`(function(){ const out = []; for (let i = 0; i < 40; i++) {
            siegeToday = 'breakout'; breakoutElement = null; frame = Math.ceil((frame + 1) / BREAKOUT_TICK) * BREAKOUT_TICK; breakoutTick(); out.push(breakoutElement);
            siegeToday = null; frame += BREAKOUT_TICK; breakoutTick(); } return out; })()`));
        ok(seen.size > 1, 'always ' + [...seen]);
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
