// THE POWER GRID — nests feed generators feed pylons.
//
// THE ASK: "make it to where the nests provide power to the generator, and the
// generator feeds the pylons to do all those sorts of different abilities, like
// the firing and the wave functions. So it's kind of like a resource management
// game."
//
// The chain already half existed and did nothing with itself. A nest could be
// LINKED to a generator — the CONNECT order — and the link bought a vague
// proximity bonus to crystal charge and a cosmetic beam. Pylons fired for free.
//
// Now the link is the economy. What is load-bearing about the design, and so
// what these checks hold:
//
// A nest is a BATTERY with a life level, not a tap. What is load-bearing:
//
//   - A PLAIN pylon costs nothing, and so does a generator — it carries the
//     power rather than spending it. Only the two abilities draw.
//   - ATTACK pays PER SHOT. A turret with nothing in range costs nothing at
//     all, which is what makes it the cheap one.
//   - WAVE pays PER FRAME for as long as it is on, near a fight or not. The
//     only ways to stop paying are to switch it back or cut the generator.
//   - A pool can EMPTY, and then the things drawing on it go dark until it
//     creeps back up. Finite means a reserve you nurse, not one you destroy.
//   - HOME has its own reserve, so a new game runs before anything is taken.
//   - A nest must be TAKEN before it is a source at all, and LINKED to a
//     generator before anything can reach it.
//   - DEEPER NESTS ARE BIGGER BATTERIES, so pushing forward still grows it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox, configNums } = require('./domstub.js');

const SRC = {
    power:  fs.readFileSync(path.join(ROOT, 'js/power.js'),  'utf8'),
    game:   fs.readFileSync(path.join(ROOT, 'js/game.js'),   'utf8'),
    config: fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'),
};
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// Every number read out of config.js rather than restated, so retuning the
// economy moves these checks with it instead of breaking them.
const C = configNums(['NEST_ENERGY_BASE', 'NEST_ENERGY_ZONE', 'NEST_ENERGY_REGEN',
                      'NEST_ENERGY_HOME', 'POWER_SHOT_COST', 'POWER_WAVE_DRAIN', 'POWER_RESTART_LEVEL']);

async function boot() {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');
    return { run };
}

(async () => {
    const E = await boot();
    // Read from the running game: it is defined from GENERATOR_NEST_RANGE, which
    // a literal-only reader cannot see.
    const HOME_REACH = E.run('HOME_POWER_REACH');

    // A board built from scratch each time. `plan` is one letter per tile going
    // along the row: G generator, A attack pylon, W wave pylon, P plain, . gap.
    // `nests` says which zones are taken and what is linked to which index.
    // `frames` runs the real loop afterwards so the spending actually happens.
    const board = (plan, nests, frames, extra) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => {
            t.pillar = false; t.destroyed = false; t.attackMode = false; t.waveMode = false;
            t.isGenerator = false; t.connectedPylon = null; t.nestConnection = null; t.waveTripped = false;
            t.powered = undefined; t.powerSource = null; t.pillarTeam = 'green';
            t.attackFireTimer = 0;
            if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; }
        });
        // Starts at x=4: the home portal is at (7,-1) and only feeds generators
        // within HOME_POWER_REACH of it, so the row has to begin inside that.
        // At x=2 the first generator was 6.4 away and drew on nothing.
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest
                                      && !t.nodeType).sort((a,b) => a.x - b.x);
        const made = [];
        ${JSON.stringify(plan)}.split('').forEach((c, i) => {
            const t = row[i];
            if (!t || c === '.') { made.push(null); return; }
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green',
                               health: 20, maxHealth: 20, pillarCol: '#0f8',
                               attackModeElement: 'fire', attackModeColor: '#f50',
                               attackPower: 12, attackRange: 2.5 });
            // A generator built in game carries attackMode = true; the fixture
            // has to as well, or "a generator spends nothing" would be proved
            // by it having no mode rather than by the rule that exempts it.
            if (c === 'G') { t.isGenerator = true; t.attackMode = true; }
            if (c === 'A') t.attackMode = true;
            if (c === 'W') t.waveMode = true;
            made.push(t);
        });
        ${JSON.stringify(nests || [])}.forEach(n => {
            const nest = world.find(t => t.nest && t.nestZone === n.zone);
            if (!nest) return;
            if (n.taken) nest.nestHealth = 0;
            if (n.energy !== undefined) nest.nestEnergy = n.energy;
            if (n.linkTo !== undefined && n.linkTo !== null) {
                const gen = made[n.linkTo];
                if (gen) { nest.connectedPylon = gen; gen.nestConnection = nest; }
            }
        });
        ${extra || ''}
        _cacheAge = -999;
        for (let i = 0; i < ${frames === undefined ? 1 : frames}; i++) render();
        const home = world.find(t => isHomePortal(t));
        const src  = made.find(t => t && t.powerSource) || null;
        return {
            lit: made.map(t => t ? !!t.powered : null),
            homeEnergy: Math.round(nestEnergy(home) * 10) / 10,
            homeMax: nestEnergyMax(home),
            srcEnergy: src ? Math.round(nestEnergy(src.powerSource) * 10) / 10 : null,
            srcIsHome: !!(src && src.powerSource === home),
            firing: _aPylons.length, waving: _wPylons.length,
            status: powerStatus(),
        };
    })()`);

    const zoneNest = (zone) => E.run(`(function(){
        const n = world.find(t => t.nest && t.nestZone === ${zone});
        return n ? { zone: n.nestZone, max: nestEnergyMax(n) } : null;
    })()`);

    // ─────────────────────────────────────────────────────
    group('THE BATTERIES: a nest holds a finite level');

    check('a nest is a pool with a capacity, and deeper holds more', () => {
        const one = zoneNest(1), two = zoneNest(2);
        ok(one && two, 'fixture: zones 1 and 2 should both have nests');
        same(one.max, C.NEST_ENERGY_BASE * (1 + C.NEST_ENERGY_ZONE * 1),
             'a zone 1 nest holds the wrong amount');
        ok(two.max > one.max, `zone 2 holds ${two.max}, zone 1 holds ${one.max}`);
    });

    check('home has its own reserve, so a new game has something to run on', () => {
        const r = board('.');
        same(r.homeMax, C.NEST_ENERGY_HOME, 'the home portal holds the wrong amount');
        same(r.homeEnergy, C.NEST_ENERGY_HOME, 'it does not start full');
    });

    check('a nest still spawning is not a source at all', () => {
        const r = E.run(`(function(){
            const n = world.find(t => t.nest && t.nestZone === 1);
            n.nestHealth = n.nestMaxHealth || 200;
            return { source: nestIsPowerSource(n), energy: nestEnergy(n) };
        })()`);
        same(r.source, false, 'a hostile nest counts as a power source');
        same(r.energy, 0, 'and it handed out energy');
    });

    // ─────────────────────────────────────────────────────
    group('THE CHAIN: pylon → generator → nest');

    check('a turret with no generator is dark, however full the batteries', () => {
        const r = board('A', [{ zone: 1, taken: true }]);
        same(r.lit[0], false, 'a turret with nothing carrying power to it was lit');
        same(r.firing, 0, 'and it was still counted as a firing pylon');
    });

    check('a generator beside it lights it, off the home reserve', () => {
        const r = board('GA');
        same(r.lit[1], true, 'a turret beside a generator is still dark');
        same(r.srcIsHome, true, 'an unlinked generator should fall back to home');
        same(r.firing, 1, 'it is not counted as a firing pylon');
    });

    check('linking a nest switches the generator onto THAT battery', () => {
        const r = board('GA', [{ zone: 1, taken: true, linkTo: 0 }]);
        same(r.srcIsHome, false, 'the generator is still drawing on home');
        same(r.srcEnergy, zoneNest(1).max, 'it is not drawing on the linked nest');
    });

    check("a turret past the generator's reach is dark", () => {
        const far = E.run('getPylonRange()');
        const r = board('GA' + '.'.repeat(Math.ceil(far) + 2) + 'A');
        same(r.lit[1], true, 'the near turret should be fed');
        same(r.lit[r.lit.length - 1], false, "a turret beyond reach was fed anyway");
    });

    // ─────────────────────────────────────────────────────
    group('EVERY NEUTRALISED NEST can be drawn on');

    // "Make sure the player can draw power from all the nests that have been
    // neutralised." Linking picks WHICH nest; it is no longer required for any
    // of them to work.
    const nearNest = (taken, offX) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.isGenerator = false; t.isConnector = false;
            t.connectedPylon = null; t.nestConnection = null; if (t.nest) t.nestEnergy = undefined; });
        const nest = world.find(t => t.nest && t.nestZone === 2);
        nest.nestHealth = ${taken ? 0 : 200};
        const tile = world.find(t => t.type === 'floor' && t.y === 1 && Math.abs(t.x - (nest.x + ${offX})) < 0.5 && !t.nest && !t.nodeType);
        Object.assign(tile, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20, maxHealth: 20,
                              isGenerator: true, attackMode: true, attackModeElement: 'generator' });
        _cacheAge = -999; render();
        const src = generatorSource(tile);
        return { src: src === nest, none: src === null, dist: Math.hypot(tile.x - nest.x, tile.y - nest.y),
                 home: !!(src && isHomePortal(src)) };
    })()`);

    check('an UNLINKED generator beside a neutralised nest draws on it', () => {
        const r = nearNest(true, 1);
        ok(r.src, 'the neutralised nest in reach was ignored (home: ' + r.home + ')');
    });

    check('a nest still alive is not a source', () => {
        const r = nearNest(false, 1);
        ok(!r.src, 'a live nest was drawn on');
    });

    check('a generator out of reach of the nest draws nothing from it', () => {
        const r = nearNest(true, 8);
        ok(r.dist > E.run('GENERATOR_NEST_RANGE'), 'fixture: the generator is not out of reach (' + r.dist + ')');
        ok(!r.src, 'drew on a nest out of reach');
    });

    group('THE HOME RESERVE does not reach across the map');

    // REPORTED: "the power level from the crystal should not shoot across the
    // map. From the crystal it should just only hit the generators that are
    // nearby it."
    //
    // The fallback to the home portal was unconditional, so a generator on the
    // far side of the map with nothing linked drew on the home reserve — and the
    // wiring drew a beam from the Crystal all the way out to it.

    // A generator and one turret beside it, placed at an exact distance from the
    // home portal along the floor, with nothing linked to anything.
    const atDistance = (dist, link) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false;
                             t.isGenerator = false; t.connectedPylon = null; t.nestConnection = null;
                             t.powered = undefined; t.powerSource = null; t.powerGen = null;
                             if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; } });
        const home = world.find(t => isHomePortal(t));
        // The floor tile whose distance from home is closest to what was asked.
        const cands = world.filter(t => t.type === 'floor' && t.y >= 0 && t.y <= 4 && !t.nest && !t.nodeType);
        cands.sort((a, b) => Math.abs(Math.hypot(a.x - home.x, a.y - home.y) - ${dist})
                           - Math.abs(Math.hypot(b.x - home.x, b.y - home.y) - ${dist}));
        const gen = cands[0];
        const turret = cands.find(t => t !== gen && Math.hypot(t.x - gen.x, t.y - gen.y) <= 1.5
                                       && Math.hypot(t.x - gen.x, t.y - gen.y) > 0.5);
        Object.assign(gen, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20,
                             maxHealth: 20, isGenerator: true, attackMode: true });
        Object.assign(turret, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20,
                                maxHealth: 20, attackMode: true, attackModeElement: 'fire',
                                attackPower: 12, attackRange: 2.5 });
        ${link ? `const n = world.find(t => t.nest && t.nestZone === 1); n.nestHealth = 0;
                  n.connectedPylon = gen; gen.nestConnection = n;` : ''}
        _cacheAge = -999; render();
        return { d: Math.round(Math.hypot(gen.x - home.x, gen.y - home.y) * 100) / 100,
                 src: gen ? (generatorSource(gen) === home ? 'home'
                             : generatorSource(gen) ? 'nest' : 'none') : null,
                 turretLit: !!turret.powered, reach: HOME_POWER_REACH };
    })()`);

    check('THE ASK: a generator beside home draws on the home reserve', () => {
        const r = atDistance(3, false);
        same(r.src, 'home', 'a generator ' + r.d + ' tiles from home got nothing');
        same(r.turretLit, true, 'and its turret is dark');
    });

    check('THE ASK: a generator across the map does NOT', () => {
        const r = atDistance(40, false);
        ok(r.d > r.reach + 10, 'fixture: it should be well past the reach, was ' + r.d);
        same(r.src, 'none', 'a generator ' + r.d + ' tiles from home still drew on it');
        same(r.turretLit, false, 'and its turret was lit off a reserve it cannot reach');
    });

    check('the edge is exactly HOME_POWER_REACH', () => {
        const inside  = atDistance(HOME_REACH - 0.6, false);
        const outside = atDistance(HOME_REACH + 1.2, false);
        ok(inside.d <= inside.reach,   `fixture: ${inside.d} should be inside ${inside.reach}`);
        ok(outside.d > outside.reach,  `fixture: ${outside.d} should be outside ${outside.reach}`);
        same(inside.src, 'home', 'a generator just inside the reach got nothing');
        same(outside.src, 'none', 'a generator just outside the reach still drew');
    });

    check('a far generator can still be wired to a nest of its own', () => {
        // The home reserve is not the only supply. Out in a zone, the generator
        // draws on the nest linked to it — which is the whole point of going.
        const r = atDistance(40, true);
        same(r.src, 'nest', 'a far generator with a nest linked drew from ' + r.src);
        same(r.turretLit, true, 'and its turret should be lit');
    });

    check('the wiring does not draw a beam from home to a generator it is not feeding', () => {
        // The wire and the supply used to be two copies of the rule, and the
        // wiring one fell back to home for EVERYTHING. Counted at the draw: a
        // far generator should have its turret wire and nothing running back to
        // home; a near one should have both.
        // Drive it through the real draw, and count only the leg that STARTS AT
        // THE HOME PORTAL. Counting wires overall measured nothing: a far
        // generator still draws its turret leg, so the totals differ either way.
        const fromHome = (dist) => {
            atDistance(dist, false);
            return E.run(`(function(){
                const real = _drawPowerWire; let legs = 0;
                const home = world.find(t => isHomePortal(t));
                // The camera has to be AT HOME. The wiring skips a wire whose two
                // ends are both off screen, so with the camera anywhere else a beam
                // from the Crystal to a far generator is culled whether or not the
                // rule that would draw it is broken — which is how the first
                // version of this passed against the very bug it was written for.
                player.x = home.x; player.y = 3;
                player.visualX = player.x; player.visualY = player.y;
                player.targetX = player.x; player.targetY = player.y;
                const hx = (home.x - player.visualX - (home.y - player.visualY)) * TILE_W + canvas.width / 2;
                const hy = (home.x - player.visualX + (home.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
                _drawPowerWire = function (ax, ay) {
                    if (Math.abs(ax - hx) < 1.5 && Math.abs(ay - (hy - 55)) < 1.5) legs++;
                    return real.apply(this, arguments);
                };
                // Wave mode is a constant draw, so the legs are lit and drawn.
                world.forEach(t => { if (t.pillar && !t.isGenerator) { t.attackMode = false; t.waveMode = true; } });
                try { for (let i = 0; i < 3; i++) render(); } finally { _drawPowerWire = real; }
                return legs;
            })()`);
        };
        const near = fromHome(3), far = fromHome(40);
        ok(near > 0, 'fixture: a generator beside home should be wired to it, saw ' + near + ' legs');
        same(far, 0, 'a far generator still had a wire running to it from the Crystal (' + far + ' legs)');
    });

    group('ATTACK MODE: it pays per shot');

    // A turret fires every 90 frames. With a target in range, 200 frames is two
    // rounds; with none it is none.
    const withFoe = `
        const foe = new Predator('scout', Object.assign({}, SPECIES['ant'].scout,
                                 { color: SPECIES['ant'].color }), row[1].x, row[1].y);
        foe.team = 'red'; foe.speciesName = 'ant'; foe.className = 'scout';
        foe.health = 99999; foe.maxHealth = 99999;
        actors.push(foe);`;

    check('THE ASK: an idle turret costs NOTHING', () => {
        const r = board('GA', null, 200);
        same(r.homeEnergy, C.NEST_ENERGY_HOME,
             'a turret with nothing to shoot at still drained the battery');
    });

    check('THE ASK: a firing turret pays for each round', () => {
        // Measured as the DIFFERENCE between the same board with and without
        // something to shoot at, on a battery that starts BELOW its cap.
        //
        // Both of those matter. Comparing one run against its own starting
        // level measures the spend minus whatever regen put back; and starting
        // at the cap makes regen put back a different amount in each run — the
        // idle one is pinned at full while the firing one has room to recover
        // into — so the difference came out at 2.7 rather than the 8 it spent.
        const start = { zone: 1, taken: true, linkTo: 0, energy: 40 };
        const idle   = board('GA', [start], 200);
        const firing = board('GA', [start], 200, withFoe);
        ok(idle.srcEnergy < zoneNest(1).max,
           'fixture: the battery must stay under its cap or regen is not equal in both runs');
        const spent = idle.srcEnergy - firing.srcEnergy;
        ok(spent >= C.POWER_SHOT_COST,
           `200 frames of firing cost ${spent}, less than one round at ${C.POWER_SHOT_COST}`);
        // A turret fires every 90 frames, so 200 frames is two rounds.
        same(Math.round(spent), C.POWER_SHOT_COST * 2,
             `it cost ${spent}, which is not the two rounds it had time to fire`);
    });

    check('and a turret on a flat battery does not fire at all', () => {
        // Not a weak shot for half price — a round is paid for in full or not
        // fired, or "what it spends is what it hits with" stops being true.
        //
        // Two frames only, with the fire timer wound to the moment before a
        // shot: long enough to attempt one, too short for regen to put anything
        // back into the pool and quietly pay for it.
        const r = board('GA', [{ zone: 1, taken: true, linkTo: 0, energy: 0 }], 2,
                        withFoe + ' made[1].attackFireTimer = 89;');
        ok(r.srcEnergy < C.POWER_SHOT_COST,
           `fixture: the battery should be too flat to pay, had ${r.srcEnergy}`);
        same(r.lit[1], false, 'a turret on a flat battery is still lit');
    });

    check('a round is paid for IN FULL or not fired', () => {
        // The distinguishing case is a battery with SOMETHING in it but not
        // enough — a flat one refuses either way, so it cannot tell a full-price
        // rule from a take-what-is-there one. A part-paid round would have to
        // do part damage, and "what it spends is what it hits with" would stop
        // being true.
        const part = C.POWER_SHOT_COST - 1;
        const r = board('GA', [{ zone: 1, taken: true, linkTo: 0, energy: part }], 2,
                        withFoe + ' made[1].attackFireTimer = 89;');
        ok(r.srcEnergy >= part,
           `it took ${(part - r.srcEnergy).toFixed(2)} out of a battery that could not afford a round`);
        same(r.lit[1], false, 'the turret counted as powered on a battery it could not draw from');
    });

    // ─────────────────────────────────────────────────────
    group('WAVE MODE: it pays constantly');

    check('THE ASK: a wave pylon drains with nothing happening at all', () => {
        const r = board('GW', null, 120);
        ok(r.homeEnergy < C.NEST_ENERGY_HOME,
           'a wave pylon with no enemies near it drained nothing');
    });

    check('and it costs far more than an idle turret', () => {
        const idle = board('GA', null, 120);
        const wave = board('GW', null, 120);
        ok(wave.homeEnergy < idle.homeEnergy,
           `wave left ${wave.homeEnergy}, an idle turret left ${idle.homeEnergy}`);
        same(idle.homeEnergy, C.NEST_ENERGY_HOME, 'the idle turret should have spent nothing');
    });

    check('switching it back to attack mode stops the drain', () => {
        // One of the two ways to stop paying.
        const on  = board('GW', null, 120);
        const off = board('GW', null, 120, 'made[1].waveMode = false; made[1].attackMode = true;');
        ok(off.homeEnergy > on.homeEnergy,
           `switching back left ${off.homeEnergy}, leaving it on left ${on.homeEnergy}`);
        same(off.homeEnergy, C.NEST_ENERGY_HOME, 'it kept draining after the switch');
    });

    check('cutting it off from the generator stops it too', () => {
        // The other way. No generator in reach means nothing to draw along.
        const r = board('W', null, 120);
        same(r.homeEnergy, C.NEST_ENERGY_HOME, 'it drained a battery it was not connected to');
        same(r.lit[0], false, 'and it was lit anyway');
    });

    check('THE ASK: a wave pylon SHUTS OFF when its pool runs out, and stays off', () => {
        const flat = board('GW', [{ zone: 1, taken: true, linkTo: 0, energy: 0 }], 2);
        same(flat.lit[1], false, 'a wave pylon on a flat battery is still lit');
        same(E.run(`world.find(t => t.pillar && t.waveMode).waveTripped`), true, 'it was not marked as shut off');
        same(flat.waving, 0, 'a shut-off wave pylon is still counted as a wave pylon');
        const tick = n => E.run(`(function(){ for (let i = 0; i < ${n}; i++) render();
            const w = world.find(t => t.pillar && t.waveMode);
            return { lit: !!w.powered, tripped: w.waveTripped, waving: _wPylons.length }; })()`);
        // A trickle is not enough: below the restart level it stays OFF.
        const nest = f => E.run(`(function(){ const n = world.find(t => t.nest && t.nestZone === 1);
            n.nestEnergy = nestEnergyMax(n) * ${f}; return n.nestEnergy; })()`);
        nest(C.POWER_RESTART_LEVEL * 0.5);
        const low = tick(130);
        same(low.lit, false, 'it limped back on with the pool barely above empty');
        same(low.tripped, true, 'it forgot it had shut off');
        // At the restart level it comes back online.
        nest(C.POWER_RESTART_LEVEL + 0.05);
        const back = tick(130);
        same(back.lit, true, 'it did not come back once the pool had refilled to the restart level');
        same(back.tripped, false, 'it is still marked shut off');
    });

    check('a tripped wave pylon does not drain a nest that is refilling', () => {
        board('GW', [{ zone: 1, taken: true, linkTo: 0, energy: 0 }], 2);
        E.run(`(function(){ const n = world.find(t => t.nest && t.nestZone === 1); n.nestEnergy = 5; })()`);
        const after = E.run(`(function(){ const n = world.find(t => t.nest && t.nestZone === 1);
            for (let i = 0; i < 300; i++) render(); return n.nestEnergy; })()`);
        ok(after > 5, 'a shut-off wave pylon kept draining the pool, it is ' + after);
    });

    check('switching back to attack clears the shut-off flag', () => {
        ok(/pylon\.waveTripped = false/.test(fs.readFileSync(path.join(ROOT, 'js/commands.js'), 'utf8')),
           'a fresh mode switch does not reset it');
    });

    check('the numbers are tuned so a wave pylon lasts minutes, not seconds', () => {
        const wavePerSec = C.POWER_WAVE_DRAIN * 60, regenPerSec = C.NEST_ENERGY_REGEN * 60;
        ok(wavePerSec > regenPerSec, 'a wave pylon should out-spend regeneration, or it would never drain');
        const zone1 = C.NEST_ENERGY_BASE * (1 + C.NEST_ENERGY_ZONE);
        const seconds = zone1 / (wavePerSec - regenPerSec);
        ok(seconds >= 180, 'a zone-1 nest runs one wave pylon dry in only ' + Math.round(seconds) + 's');
    });

    check('the pools really do regenerate', () => {
        const a = board('GA', [{ zone: 1, taken: true, linkTo: 0, energy: 10 }], 2);
        const b = board('GA', [{ zone: 1, taken: true, linkTo: 0, energy: 10 }], 120);
        ok(b.srcEnergy > a.srcEnergy, `after 120 frames it was ${b.srcEnergy}, after 2 it was ${a.srcEnergy}`);
        ok(b.srcEnergy <= zoneNest(1).max, 'it regenerated past its own capacity');
    });

    // ─────────────────────────────────────────────────────
    group('what costs nothing');

    check('a plain pylon and a generator both spend nothing', () => {
        same(board('GPPP', null, 120).homeEnergy, C.NEST_ENERGY_HOME,
             'plain pylons or the generator drained the battery');
    });

    check('an enemy pylon is not yours to run', () => {
        const r = E.run(`(function(){
            const t = world.find(x => x.type === 'floor' && x.y === 3 && !x.nest);
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red',
                               health: 20, maxHealth: 20, attackMode: true });
            return needsPower(t);
        })()`);
        same(r, false, 'a converted pylon draws on your batteries');
    });

    // ─────────────────────────────────────────────────────
    group('THE WIRING: you can see the power moving');

    // REPORTED: "I can't read it. Make it more visually obvious when the
    // power's being drawn, with the little pulses in the wiring."
    //
    // The chain was a 1.4px grey dashed line at 18-40% alpha with one 2px dot
    // on it, and it was the SAME line whether the pylon was pulling hard or
    // doing nothing at all. There was no way to look at a base and see what was
    // costing you.
    //
    // The load-bearing property is that the wire follows the ACTUAL draw, so
    // these drive the real loop and read the flow the drawing is handed.

    // Peak and average flow on a pylon's wire over `frames`.
    const wire = (kind, withFoe, frames) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false;
                             t.isGenerator = false; t.connectedPylon = null;
                             t.nestConnection = null; t.powerFlow = 0;
                             if (t.nest) t.nestEnergy = undefined; });
        const row = world.filter(t => t.type === 'floor' && t.y === 2 && t.x > 2
                                      && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
        const gen = row[0];
        Object.assign(gen, { pillar: true, destroyed: false, pillarTeam: 'green',
                             health: 20, maxHealth: 20, isGenerator: true, attackMode: true });
        const t = row[1];
        Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20,
                           maxHealth: 20, pillarCol: '#0f8', attackModeElement: 'fire',
                           attackModeColor: '#f50', attackPower: 12, attackRange: 2.5,
                           attackMode: ${JSON.stringify(kind)} === 'attack',
                           waveMode: ${JSON.stringify(kind)} === 'wave' });
        ${withFoe ? `
        const foe = new Predator('scout', Object.assign({}, SPECIES['ant'].scout,
                                 { color: SPECIES['ant'].color }), t.x, t.y);
        foe.team = 'red'; foe.speciesName = 'ant'; foe.className = 'scout';
        foe.health = 99999; foe.maxHealth = 99999; actors.push(foe);` : ''}
        _cacheAge = -999;
        let peak = 0, sum = 0;
        for (let i = 0; i < ${frames}; i++) {
            render();
            const f = powerFlowOf(t);
            if (f > peak) peak = f;
            sum += f;
        }
        return { peak: Math.round(peak * 100) / 100,
                 avg: Math.round(sum / ${frames} * 100) / 100,
                 powered: !!t.powered, gen: t.powerGen === gen };
    })()`);

    check('THE ASK: an IDLE turret\'s wire is silent — it costs you nothing', () => {
        const r = wire('attack', false, 300);
        same(r.powered, true, 'fixture: it should be connected and able to fire');
        same(r.peak, 0, 'an idle turret lit its wire anyway');
    });

    check('THE ASK: a FIRING turret pulses its wire on every round', () => {
        const r = wire('attack', true, 300);
        ok(r.peak > 0.9, `a firing turret only reached ${r.peak} on its wire`);
        // And it FADES between rounds, or a turret that stopped shooting would
        // go on looking busy.
        ok(r.avg < r.peak, `it never faded: peak ${r.peak}, average ${r.avg}`);
        ok(r.avg > 0.1, `it faded so fast the wire reads as dead: average ${r.avg}`);
    });

    check('a turret that is shooting a predator is what turns it on the pylon', () => {
        const r = E.run(`(function(){
            actors.length = 0; followers.length = 0;
            world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.powerFlow = 0; });
            const row = world.filter(t => t.type === 'floor' && t.y === 2 && t.x > 2 && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
            const gen = row[0];
            Object.assign(gen, { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999, maxHealth: 99999, isGenerator: true, attackMode: true });
            const t = row[1];
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999, maxHealth: 99999,
                               attackMode: true, attackModeElement: 'fire', attackPower: 12, attackRange: 2.5 });
            const quiet = new Predator('scout', Object.assign({}, SPECIES['ant'].scout, { color: SPECIES['ant'].color }), t.x + 2.2, t.y);
            quiet.team = 'red'; quiet.health = 99999; quiet.maxHealth = 99999; actors.push(quiet);
            _cacheAge = -999;
            for (let i = 0; i < 200; i++) render();
            return { aggro: quiet.pylonAggro === t };
        })()`);
        ok(r.aggro, 'a predator being shot by a turret never turned on it');
    });

    check('and a turret that STOPS firing goes quiet again', () => {
        // The fade is what makes the wire a live readout rather than a latch.
        // Without it the first round a turret ever fires leaves its line lit
        // for the rest of the game, and the player can no longer tell what is
        // costing them anything.
        const r = E.run(`(function(){
            actors.length = 0; followers.length = 0;
            world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false;
                                 t.isGenerator = false; t.powerFlow = 0;
                                 if (t.nest) t.nestEnergy = undefined; });
            const row = world.filter(t => t.type === 'floor' && t.y === 2 && t.x > 2
                                          && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
            const gen = row[0];
            Object.assign(gen, { pillar: true, destroyed: false, pillarTeam: 'green',
                                 health: 20, maxHealth: 20, isGenerator: true, attackMode: true });
            const t = row[1];
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999,
                               maxHealth: 99999, attackMode: true, attackModeElement: 'fire',
                               attackPower: 12, attackRange: 2.5 });
            const foe = new Predator('scout', Object.assign({}, SPECIES['ant'].scout,
                                     { color: SPECIES['ant'].color }), t.x, t.y);
            foe.team = 'red'; foe.speciesName = 'ant'; foe.className = 'scout';
            foe.health = 99999; foe.maxHealth = 99999; actors.push(foe);
            _cacheAge = -999;
            // The PEAK over the fight, not the value at the end of it: the
            // last frame of the window lands at an arbitrary point in the fade
            // between rounds, so a single read says nothing about whether the
            // wire ever lit.
            let whileFighting = 0;
            for (let i = 0; i < 200; i++) {
                render();
                const f = powerFlowOf(t);
                if (f > whileFighting) whileFighting = f;
            }
            foe.dead = true; actors.length = 0;       // the fight ends
            for (let i = 0; i < 200; i++) render();
            return { whileFighting: Math.round(whileFighting * 100) / 100,
                     after: Math.round(powerFlowOf(t) * 100) / 100 };
        })()`);
        ok(r.whileFighting > 0.2, `fixture: it should have been lit while fighting, was ${r.whileFighting}`);
        same(r.after, 0, `it is still drawing ${r.after} with nothing left to shoot`);
    });

    check('THE ASK: wave mode holds its wire full, because it never stops', () => {
        const r = wire('wave', false, 300);
        same(r.peak, 1, 'wave mode did not light its wire');
        same(r.avg, 1, `wave mode's draw flickers: average ${r.avg}`);
    });

    check('and the three states are plainly different from each other', () => {
        // The whole point. If two of them look the same the wiring says nothing.
        const idle = wire('attack', false, 300).avg;
        const fire = wire('attack', true, 300).avg;
        const wave = wire('wave', false, 300).avg;
        ok(idle < fire && fire < wave,
           `idle ${idle}, firing ${fire}, wave ${wave} — these do not separate`);
        ok(fire - idle > 0.1 && wave - fire > 0.1,
           `the gaps are too small to see: ${idle} / ${fire} / ${wave}`);
    });

    check('a dark pylon gets no wire at all', () => {
        const r = board('A', null, 2);          // no generator anywhere
        same(r.lit[0], false, 'fixture: it should be dark');
        const f = E.run('(function(){ const t = world.find(x => x.pillar && x.attackMode); ' +
                        'return t ? powerFlowOf(t) : null; })()');
        same(f, 0, 'a pylon with nothing reaching it still drew a live wire');
    });

    check('the wire is drawn along the chain the grid actually routes', () => {
        // pylon → generator → nest, and both ends remembered rather than worked
        // out again at draw time, which would be a second copy of the routing.
        const r = wire('wave', false, 2);
        same(r.gen, true, 'the pylon does not remember the generator feeding it');
        const at = SRC.game.indexOf('function drawPowerChain');
        ok(at > -1, 'the chain is never drawn');
        const body = SRC.game.slice(at, SRC.game.indexOf('\nfunction ', at + 10));
        ok(/t\.powerGen/.test(body), 'it does not follow the recorded generator');
        ok(/relaySource\(gen\)/.test(body), 'it does not ask the one source rule for the nest');
        ok(/powerFlowOf\(t\)/.test(body), 'the wire does not follow the actual draw');
    });

    check('the charges run from the SOURCE toward the thing spending', () => {
        // A wire whose pulses run the wrong way says the pylon is feeding the
        // nest. The two calls have to be (from, to) in that order.
        const at = SRC.game.indexOf('function drawPowerChain');
        const body = SRC.game.slice(at, SRC.game.indexOf('\nfunction ', at + 10));
        const gxFirst = /_drawPowerWire\(gx, gy - \d+, px, py - \d+/.test(body);
        const nxFirst = /_drawPowerWire\(nx, ny - \d+, gx, gy - \d+/.test(body);
        ok(gxFirst, 'the generator → pylon wire runs the wrong way');
        ok(nxFirst, 'the nest → generator wire runs the wrong way');
        // ...and the bead walks the line from the first point to the second.
        const wireAt = SRC.game.indexOf('function _drawPowerWire');
        const wireBody = SRC.game.slice(wireAt, SRC.game.indexOf('\n}', wireAt));
        ok(/ax \+ \(bx - ax\) \* t/.test(wireBody), 'the charges do not travel A to B');
    });

    check('a busier wire carries more charges and more light', () => {
        const at = SRC.game.indexOf('function _drawPowerWire');
        const body = SRC.game.slice(at, SRC.game.indexOf('\n}\n', at));
        ok(/POWER_BEADS \* flow/.test(body), 'the number of charges ignores the draw');
        ok(/flow \* 0\.\d+/.test(body), 'the brightness ignores the draw');
        ok(/flow > 0\.\d+/.test(body), 'a wire with no draw is drawn the same as a live one');
    });

    group('the player can see it');

    check('the nest draws its own life level', () => {
        const DRAW = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        const at = DRAW.indexOf('function drawNestGauge');
        ok(at > -1, 'the nest does not show how much is left in it');
        const body = DRAW.slice(at, at + 1800);
        ok(/nestEnergy\(nest\)/.test(body), 'the bar is not drawn from the real level');
        ok(/nestEnergyMax\(nest\)/.test(body), 'nor scaled by the real capacity');
        ok(/#ff5522/.test(body), 'it never warns that a battery is nearly out');
        ok(/drawNestGauge\(obj/.test(SRC.game), 'a neutralised nest does not draw the gauge');
        ok(/drawNestGauge\(/.test(DRAW.slice(DRAW.indexOf('function drawHomePortal'))), 'the home portal does not draw it');
    });

    check('THE ASK: a percentage over a bar that empties as the nest is drawn down', () => {
        const draw = (zone, energy) => E.run(`(function(){
            const nest = world.find(t => t.nest && t.nestZone === ${zone});
            nest.nestHealth = 0; nest.nestEnergy = ${energy};
            const texts = [], bars = [];
            const ft = ctx.fillText, fr = ctx.fillRect;
            ctx.fillText = (t) => { texts.push(String(t)); };
            ctx.fillRect = (x, y, w, h) => { bars.push(w); };
            try { drawNestGauge(nest, 100, 100, '#fff'); } finally { ctx.fillText = ft; ctx.fillRect = fr; }
            return { texts, bars, max: nestEnergyMax(nest) };
        })()`);
        const max = zoneNest(1).max;
        const full = draw(1, max), half = draw(1, max / 2), low = draw(1, max * 0.1), empty = draw(1, 0);
        same(full.texts[0], '100%', 'full nest');
        same(half.texts[0], '50%', 'half nest');
        same(low.texts[0], '10%', 'nearly-empty nest');
        same(empty.texts[0], 'EMPTY', 'empty nest');
        // bars[0] is the backing, bars[1] the fill: the fill shrinks with the level.
        ok(full.bars[1] > half.bars[1] && half.bars[1] > low.bars[1] && low.bars[1] > empty.bars[1],
           'the bar does not shrink with the level: ' + [full, half, low, empty].map(r => r.bars[1]));
        same(empty.bars[1], 0, 'an empty nest still shows a filled bar');
    });

    check('an unpowered pylon is drawn dark, with no range ring', () => {
        const at = SRC.game.indexOf('const _dark = obj.powered === false');
        ok(at > -1, 'the drawing does not know whether the pylon has power');
        const body = SRC.game.slice(at, at + 2000);
        ok(/POWER_DEAD_COLOUR/.test(body), 'a dark pylon keeps its lit colour');
        ok(/obj\.attackMode && !_dark/.test(body), 'a dark turret still draws its range ring');
    });

    check('the readout and the rule cannot disagree', () => {
        const r = board('GA', null, 2);
        same(r.status.drawing, 1, 'the readout does not count the drawing pylons');
        same(r.status.dark, 0, 'it reports something dark that is not');
        const flat = board('GA', [{ zone: 1, taken: true, linkTo: 0, energy: 0 }], 2);
        same(flat.status.dark, 1, 'it does not report the dark pylon');
    });

    check('the index says every neutralised nest can be drawn on, and shows the gauge', () => {
        const at = HTML.indexOf('Every nest you have neutralised');
        ok(at > -1, 'the index does not say any neutralised nest can be drawn on');
        const page = HTML.slice(at, at + 900);
        ok(page.indexOf('>' + E.run('GENERATOR_NEST_RANGE') + '<') > -1, 'it does not state the reach');
        ok(/percentage/.test(page) && /EMPTY/.test(page), 'it does not describe the gauge');
    });

    check('the index says the home reserve is local, and how to connect to it', () => {
        const at = HTML.indexOf('POWER GRID');
        const page = HTML.slice(at, at + 5200);
        ok(/only the generators standing near it/i.test(page),
           'the index does not say the home reserve only reaches nearby generators');
        ok(!/falls back to when no nest is linked/i.test(page),
           'the index still says a generator falls back to home with no limit');
        const reach = Number(E.run('HOME_POWER_REACH'));
        ok(page.indexOf('>' + reach + '<') > -1, 'the index does not state the ' + reach + '-tile reach');
        ok(/Long-press the CRYSTAL nest/i.test(page), 'it does not say how to connect to the portal');
    });

    check('the GAME INDEX teaches it, with the real numbers', () => {
        const at = HTML.indexOf('POWER GRID');
        ok(at > -1, 'the index never explains the power grid');
        const page = HTML.slice(at, at + 6000);
        for (const word of ['nest', 'generator', 'per shot', 'wave']) {
            ok(new RegExp(word, 'i').test(page), 'the index does not mention "' + word + '"');
        }
        for (const [name, val] of Object.entries(C)) {
            // The per-frame rates are documented per second, which is the unit
            // the player experiences; the rest are shown as they are.
            const perSec = Math.round(val * 60 * 10) / 10;
            ok(page.indexOf('>' + val + '<') > -1 || page.indexOf('>' + perSec + '<') > -1,
               'the index shows neither ' + val + ' nor ' + perSec + ' for ' + name);
        }
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
