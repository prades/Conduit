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
                      'NEST_ENERGY_HOME', 'POWER_SHOT_COST', 'POWER_WAVE_DRAIN']);

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

    // A board built from scratch each time. `plan` is one letter per tile going
    // along the row: G generator, A attack pylon, W wave pylon, P plain, . gap.
    // `nests` says which zones are taken and what is linked to which index.
    // `frames` runs the real loop afterwards so the spending actually happens.
    const board = (plan, nests, frames, extra) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => {
            t.pillar = false; t.destroyed = false; t.attackMode = false; t.waveMode = false;
            t.isGenerator = false; t.connectedPylon = null; t.nestConnection = null;
            t.powered = undefined; t.powerSource = null; t.pillarTeam = 'green';
            t.attackFireTimer = 0;
            if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; }
        });
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x > 1 && !t.nest
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

    check('a drained pool puts its wave pylon out, and it comes back by itself', () => {
        // The pool creeps back up, so a flat grid is something to nurse rather
        // than something the player has to go and re-set by hand.
        const flat = board('GW', [{ zone: 1, taken: true, linkTo: 0, energy: 0 }], 2);
        same(flat.lit[1], false, 'a wave pylon on a flat battery is still lit');
        const rested = board('GW', [{ zone: 1, taken: true, linkTo: 0, energy: 0 }], 2,
                             'world.forEach(t => { if (t.nest && t.nestZone === 1) t.nestEnergy = 40; });');
        same(rested.lit[1], true, 'it did not come back once the battery had something in it');
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
    group('the player can see it');

    check('the nest draws its own life level', () => {
        const at = SRC.game.indexOf('THE LIFE LEVEL');
        ok(at > -1, 'the nest does not show how much is left in it');
        const body = SRC.game.slice(at, at + 900);
        ok(/nestEnergy\(obj\)/.test(body), 'the bar is not drawn from the real level');
        ok(/nestEnergyMax\(obj\)/.test(body), 'nor scaled by the real capacity');
        ok(/#ff5522/.test(body), 'it never warns that a battery is nearly out');
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

    check('the GAME INDEX teaches it, with the real numbers', () => {
        const at = HTML.indexOf('POWER GRID');
        ok(at > -1, 'the index never explains the power grid');
        const page = HTML.slice(at, at + 3600);
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
