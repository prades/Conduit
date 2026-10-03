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
//   - A PLAIN pylon costs nothing. It still stands, still holds territory,
//     still takes the healing aura. Only the two ABILITIES draw, so going on
//     the grid is a choice the player makes rather than a tax on building.
//   - HOME always supplies. The home portal is zone 0's nest and was never
//     theirs; without it a new game could not run the pylon it starts with.
//   - Everything else must be TAKEN and then LINKED. A nest still pouring
//     predators out of the wall is not yours to draw on, and one you have taken
//     but not wired in is not on the grid yet.
//   - DEEPER PAYS MORE, so the grid grows by going forward rather than by
//     building more at home.
//   - A pylon out of generator reach is dark however full the grid is. The
//     generator is what carries it.
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
const C = configNums(['POWER_HOME_SUPPLY', 'POWER_PER_NEST', 'POWER_ZONE_BONUS',
                      'POWER_DRAW_ATTACK', 'POWER_DRAW_WAVE']);

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

    // A board built from scratch each time: a generator, N turrets in a row
    // beside it, and whatever nest state the scenario wants. Returns the grid's
    // own answer plus which pylons ended up lit.
    //
    // `plan` is a string of letters, one per tile going out from the generator:
    //   G generator   A attack pylon   W wave pylon   P plain pylon   . nothing
    const board = (plan, nests) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => {
            t.pillar = false; t.destroyed = false; t.attackMode = false; t.waveMode = false;
            t.isGenerator = false; t.connectedPylon = null; t.nestConnection = null;
            t.powered = undefined; t.pillarTeam = 'green';
            if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; }
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
            // A generator built in game carries attackMode = true — both
            // _executeBuildInstant and _executeUpgrade set it. The fixture has
            // to carry it too, or "a generator draws nothing" is proved by the
            // generator having no mode rather than by the rule that exempts it.
            if (c === 'G') { t.isGenerator = true; t.attackMode = true; }
            if (c === 'A') t.attackMode = true;
            if (c === 'W') { t.waveMode = true; t.attackModeElement = 'fire'; }
            made.push(t);
        });
        // Nest state: [{ zone, taken, linkedToIndex }]
        ${JSON.stringify(nests || [])}.forEach(n => {
            const nest = world.find(t => t.nest && t.nestZone === n.zone);
            if (!nest) return;
            if (n.taken) nest.nestHealth = 0;
            if (n.linkTo !== undefined && n.linkTo !== null) {
                const gen = made[n.linkTo];
                if (gen) { nest.connectedPylon = gen; gen.nestConnection = nest; }
            }
        });
        _cacheAge = -999;
        render();
        const s = powerStatus();
        return {
            supply: s.supply, demand: s.demand, spare: s.spare, shed: s.shed, short: s.short,
            lit: made.map(t => t ? !!t.powered : null),
            firing: _aPylons.length, waving: _wPylons.length,
            litX: made.filter(t => t && t.powered && (t.attackMode || t.waveMode)).map(t => t.x),
            genX: (made.find(t => t && t.isGenerator) || {}).x,
            darkX: made.filter(t => t && t.powered === false).map(t => t.x),
        };
    })()`);

    // ─────────────────────────────────────────────────────
    group('SUPPLY: which nests pay, and how much');

    check('THE OPENING: home supplies from the first frame', () => {
        // Without this a new game could not run the pylon it is given, and the
        // whole feature would read as "everything is broken now".
        const r = board('.');
        same(r.supply, C.POWER_HOME_SUPPLY, 'the home portal is not feeding the grid');
        same(r.demand, 0, 'an empty board should draw nothing');
    });

    check('a nest still spawning pays NOTHING, linked or not', () => {
        // It is not yours to draw on while it is still pouring predators out.
        const a = board('GA', [{ zone: 1, taken: false }]);
        const b = board('GA', [{ zone: 1, taken: false, linkTo: 0 }]);
        same(a.supply, C.POWER_HOME_SUPPLY, 'a hostile nest fed the grid');
        same(b.supply, C.POWER_HOME_SUPPLY, 'a hostile nest fed the grid once linked');
    });

    check('a nest TAKEN but not linked pays nothing either', () => {
        // Taking the zone is half of it. The link is the act that wires it in,
        // and it is the one the player has to go and perform.
        const r = board('GA', [{ zone: 1, taken: true }]);
        same(r.supply, C.POWER_HOME_SUPPLY, 'an unlinked nest fed the grid');
    });

    check('THE ASK: taken AND linked, it feeds the generator', () => {
        const r = board('GA', [{ zone: 1, taken: true, linkTo: 0 }]);
        const expected = C.POWER_HOME_SUPPLY
                       + C.POWER_PER_NEST * (1 + C.POWER_ZONE_BONUS * 1);
        same(r.supply, expected, 'a linked nest is not feeding the grid');
    });

    check('and a deeper zone pays more, so going forward is the way to grow', () => {
        const one = board('GA', [{ zone: 1, taken: true, linkTo: 0 }]);
        const two = board('GA', [{ zone: 2, taken: true, linkTo: 0 }]);
        ok(two.supply > one.supply,
           `zone 2 paid ${two.supply - C.POWER_HOME_SUPPLY}, zone 1 paid ${one.supply - C.POWER_HOME_SUPPLY}`);
        same(two.supply - C.POWER_HOME_SUPPLY,
             C.POWER_PER_NEST * (1 + C.POWER_ZONE_BONUS * 2),
             'the zone multiplier does not match POWER_ZONE_BONUS');
    });

    check('two linked nests both pay', () => {
        const r = board('GA', [{ zone: 1, taken: true, linkTo: 0 },
                               { zone: 2, taken: true, linkTo: 0 }]);
        const expected = C.POWER_HOME_SUPPLY
                       + C.POWER_PER_NEST * (1 + C.POWER_ZONE_BONUS * 1)
                       + C.POWER_PER_NEST * (1 + C.POWER_ZONE_BONUS * 2);
        same(r.supply, expected, 'the grid does not add its nests up');
    });

    check('a nest linked to something that is not a generator pays nothing', () => {
        // The link is to a GENERATOR. Wiring a nest to an ordinary pylon is not
        // a grid, and allowing it would make the generator pointless.
        const r = board('AA', [{ zone: 1, taken: true, linkTo: 0 }]);
        same(r.supply, C.POWER_HOME_SUPPLY, 'a plain pylon acted as a generator');
    });

    // ─────────────────────────────────────────────────────
    group('DEMAND: what actually costs anything');

    check('a plain pylon is free, and a generator is free', () => {
        // Charging for the generator would make the first one you build a step
        // backwards, which is the opposite of what it is for.
        same(board('G').demand, 0, 'a generator draws power');
        same(board('P').demand, 0, 'a plain pylon draws power');
        same(board('GPPP').demand, 0, 'plain pylons draw power');
    });

    check('THE ASK: firing draws, and the wave functions draw more', () => {
        same(board('GA').demand, C.POWER_DRAW_ATTACK, 'a turret draws the wrong amount');
        same(board('GW').demand, C.POWER_DRAW_WAVE, 'a wave pylon draws the wrong amount');
        ok(C.POWER_DRAW_WAVE > C.POWER_DRAW_ATTACK,
           'the networked, tiered, area ability should cost more than a turret');
    });

    check("an enemy pylon is not yours to run", () => {
        const r = E.run(`(function(){
            world.forEach(t => { t.pillar = false; t.isGenerator = false; });
            const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x > 1 && !t.nest)
                             .sort((a,b) => a.x - b.x);
            Object.assign(row[0], { pillar: true, destroyed: false, pillarTeam: 'red',
                                    health: 20, maxHealth: 20, attackMode: true,
                                    attackModeElement: 'fire' });
            return pylonPowerDraw(row[0]);
        })()`);
        same(r, 0, 'a converted pylon draws from your grid');
    });

    // ─────────────────────────────────────────────────────
    group('ROUTING: the generator is what carries it');

    check('THE ASK: a turret with no generator stays dark, however full the grid', () => {
        const r = board('A', [{ zone: 1, taken: true }, { zone: 2, taken: true }]);
        same(r.lit[0], false, 'a turret with nothing carrying power to it was lit');
        same(r.firing, 0, 'and it was still counted as a firing pylon');
    });

    check('put a generator beside it and it lights up', () => {
        const r = board('GA');
        same(r.lit[1], true, 'a turret beside a generator is still dark');
        same(r.firing, 1, 'it is not counted as a firing pylon');
        same(r.short, false, 'the grid reported a shortfall it does not have');
    });

    check("a turret out past the generator's reach is dark", () => {
        // The grid reaches exactly as far as a generator's link does — the same
        // range the healing aura and the network links already use.
        const far = E.run('getPylonRange()');
        ok(far > 0 && far < 12, 'fixture: the pylon range looks wrong: ' + far);
        const r = board('GA' + '.'.repeat(Math.ceil(far) + 2) + 'A');
        same(r.lit[1], true, 'the near turret should be fed');
        same(r.lit[r.lit.length - 1], false,
             "a turret beyond the generator's reach was fed anyway");
    });

    // ─────────────────────────────────────────────────────
    group('BROWNOUT: when there is not enough to go round');

    // The generator sits in the MIDDLE of its turrets, so every one of them is
    // inside its reach. A row with the generator at one end puts the far turret
    // out of range, and then "it went dark" says nothing about the budget — the
    // first version of these checks passed for that reason rather than this one.
    const crowd = (n, nests) => {
        const left = Math.floor(n / 2), right = n - left;
        return board('A'.repeat(left) + 'G' + 'A'.repeat(right), nests);
    };

    check('THE ASK: demand past supply puts pylons out', () => {
        // Home carries POWER_HOME_SUPPLY. Ask for one turret more than that.
        const n = Math.floor(C.POWER_HOME_SUPPLY / C.POWER_DRAW_ATTACK) + 1;
        const r = crowd(n);
        same(r.demand, n * C.POWER_DRAW_ATTACK, 'the demand does not add up');
        ok(r.demand > r.supply, 'fixture: this board should be oversubscribed');
        same(r.short, true, 'the grid did not report a shortfall');
        same(r.shed, 1, 'exactly one turret should have gone dark, got ' + r.shed);
        same(r.firing, n - 1, 'the wrong number of turrets are still firing');
    });

    check('and the ones nearest the generator are the ones that keep it', () => {
        // Shedding has to be legible. The base around your generator staying
        // lit while the outliers go dark is a rule a player can see; a random
        // pylon going dark is not.
        const n = Math.floor(C.POWER_HOME_SUPPLY / C.POWER_DRAW_ATTACK) + 1;
        const r = crowd(n);
        same(r.darkX.length, 1, 'fixture: expected exactly one dark pylon');
        const genX = r.genX;
        const far = Math.abs(r.darkX[0] - genX);
        ok(r.litX.every(x => Math.abs(x - genX) <= far),
           `the furthest turret should be the one to go dark: lit ${r.litX}, dark ${r.darkX}, gen ${genX}`);
    });

    check('the same board always sheds the same pylon', () => {
        // A grid that flickered between two equally placed pylons would be
        // unreadable, and would make the whole system feel broken.
        const n = Math.floor(C.POWER_HOME_SUPPLY / C.POWER_DRAW_ATTACK) + 2;
        const seen = new Set();
        for (let i = 0; i < 6; i++) seen.add(crowd(n).darkX.join(','));
        same(seen.size, 1, 'the grid shed a different set each time: ' + [...seen].join(' | '));
    });

    check('THE PAYOFF: linking a nest lights the dark one back up', () => {
        // The whole loop in one check — this is the thing the player does.
        const n = Math.floor(C.POWER_HOME_SUPPLY / C.POWER_DRAW_ATTACK) + 1;
        const before = crowd(n);
        const after  = crowd(n, [{ zone: 1, taken: true, linkTo: Math.floor(n / 2) }]);
        same(before.shed, 1, 'fixture: one turret should start dark');
        same(after.shed, 0, 'linking a nest did not bring the dark turret back');
        same(after.firing, n, 'not every turret is firing again');
    });

    check('a dark pylon is out of BOTH ability lists, so it cannot act', () => {
        // The flag is not decoration: the firing loop and the wave loop both
        // run off these lists.
        const r = board('A');                 // no generator at all
        same(r.firing, 0, 'a dark turret is still in the attack list');
        const w = board('W');
        same(w.waving, 0, 'a dark wave pylon is still in the wave list');
    });

    check('the lists are filtered on the flag, not on the mode alone', () => {
        const wLine = SRC.game.match(/_wPylons\s*=\s*_pillarCache\.filter\(([^;]*)\);/);
        const aLine = SRC.game.match(/_aPylons\s*=\s*_pillarCache\.filter\(([^;]*)\);/);
        ok(wLine && /t\.powered/.test(wLine[1]), 'the wave list ignores the grid');
        ok(aLine && /t\.powered/.test(aLine[1]), 'the attack list ignores the grid');
        // ...and the grid has to be worked out BEFORE them, or they read a flag
        // left over from the previous rebuild.
        const at = SRC.game.indexOf('recomputePower()');
        ok(at > -1, 'the grid is never recomputed');
        // Against the ASSIGNMENTS. `_wPylons` is mentioned earlier in the file
        // by rebuildPylonPairs, so matching the bare name compared the wrong
        // two places and passed whatever the order was.
        const wAt = SRC.game.indexOf('_wPylons     = _pillarCache.filter');
        const aAt = SRC.game.indexOf('_aPylons     = _pillarCache.filter');
        ok(wAt > -1 && aAt > -1, 'the ability lists could not be located');
        ok(at < wAt && at < aAt, 'the grid is computed after the lists that use it');
    });

    // ─────────────────────────────────────────────────────
    group('the player can see it');

    check('the readout and the rule cannot disagree', () => {
        const n = Math.floor(C.POWER_HOME_SUPPLY / C.POWER_DRAW_ATTACK) + 1;
        const r = board('G' + 'A'.repeat(n));
        same(r.spare, r.supply - r.demand, 'the spare figure is not supply minus demand');
        same(r.short, r.shed > 0, 'the shortfall flag does not match the dark pylons');
    });

    check('an unpowered pylon is drawn dark, with no range ring', () => {
        // A ring says "this ground is covered". An unpowered turret covers
        // nothing, so drawing one would be a lie the player acts on.
        const at = SRC.game.indexOf('const _dark = obj.powered === false');
        ok(at > -1, 'the drawing does not know whether the pylon has power');
        const body = SRC.game.slice(at, at + 2000);
        ok(/POWER_DEAD_COLOUR/.test(body), 'a dark pylon keeps its lit colour');
        ok(/obj\.attackMode && !_dark/.test(body), 'a dark turret still draws its range ring');
        ok(/obj\.waveMode && !_dark/.test(body), 'a dark wave pylon still draws its glow');
    });

    check('the HUD shows the budget before any network exists', () => {
        // The grid is the thing being budgeted from the first pylon, so the
        // readout cannot wait for a resonance tier to appear first.
        const at = SRC.game.indexOf('function drawNetworkStatusHUD');
        const body = SRC.game.slice(at, at + 2200);
        ok(/powerStatus\(\)/.test(body), 'the panel does not read the grid');
        ok(/activeEls\.length === 0 && pw\.demand === 0/.test(body),
           'the panel still hides itself whenever no element network has formed');
        ok(/UNPOWERED/.test(body), 'it never says anything is unpowered');
    });

    check('the GAME INDEX teaches the chain, with the real numbers', () => {
        const at = HTML.indexOf('POWER GRID');
        ok(at > -1, 'the index never explains the power grid');
        const page = HTML.slice(at, at + 3000);
        for (const word of ['nest', 'generator', 'pylon']) {
            ok(new RegExp(word, 'i').test(page), 'the index does not mention the ' + word);
        }
        // The documented numbers have to be the ones the game uses.
        for (const [name, val] of Object.entries(C)) {
            ok(page.indexOf('>' + val + '<') > -1,
               'the index does not show ' + val + ', which is what ' + name + ' is');
        }
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
