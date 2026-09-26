// EARLY-GAME DIFFICULTY: what a kill pays, and how often the alarm goes off.
//
// REPORTED: "I need to make the game a little easier in the beginning. The
// amount of shards you get from the little charge particle that drops from the
// predators — returning that to the crystal should grant more shards. And the
// tripping of the alarm should happen less frequently."
//
// Both measured before changing anything.
//
// THE PAYOUT. A kill's charged mass is the ONLY shard a predator gives — there
// is no separate drop — and MASS_VALUE_SCALE was 0.35, so 0.35 was the whole
// payout. Across the species table that made a lump worth 1 to 11 shards, and
// the enemies you meet first, ants and beetles, paid 1 to 5. A pylon costs 10.
// So an early player ran the two-job chain — an ELECTRIC worker to bleed the
// charge and a FLUX worker to haul it home, both off the line — for one or two
// shards. At 1.0 the lump is worth what the predator was worth and the chain
// is the cost rather than a discount on top of it.
//
// THE ALARM. Two things trip it: hacking a nest, which the player chooses, and
// a DECOY wall panel, which they cannot see coming. Decoys were 0.40 per panel
// — measured at 28% and 5.4 decoys across the first four zones. And every
// alarm RAISES THE WAVE NUMBER, so a new player farming panels for shards
// escalated themselves several waves before doing anything else.
//
// The opening was also far harsher than the rest of the game: after any alarm,
// resetPanels() reshuffles to exactly ONE decoy in the whole world. 0.08 brings
// the first pass in line with that.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox, configNums } = require('./domstub.js');

const SRC = {
    mass:  fs.readFileSync(path.join(ROOT, 'js/mass.js'),  'utf8'),
    drops: fs.readFileSync(path.join(ROOT, 'js/drops.js'), 'utf8'),
    world: fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8'),
    waves: fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8'),
    game:  fs.readFileSync(path.join(ROOT, 'js/game.js'),  'utf8'),
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

const C = configNums(['PANEL_DECOY_CHANCE', 'PANEL_SHARD_MIN', 'PANEL_SHARD_MAX']);
const SCALE = Number(SRC.mass.match(/const MASS_VALUE_SCALE\s*=\s*([\d.]+)/)[1]);

async function ready(seed) {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: seed || '305419896' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    return { run, sandbox };
}

(async () => {
    const E = await ready();

    // ─────────────────────────────────────────────────────
    group('THE PAYOUT: a hauled lump is worth having');

    check('a kill\'s mass is the ONLY shard it gives', () => {
        // The load-bearing fact. If a predator also dropped shards directly,
        // raising the scale to full value would be paying twice.
        const at = SRC.drops.indexOf('function onPredatorDeath');
        const end = SRC.drops.indexOf('\nfunction ', at + 1);
        const body = SRC.drops.slice(at, end === -1 ? undefined : end);
        ok(body.length > 200, 'onPredatorDeath could not be located');
        ok(/spawnChargedMass\(/.test(body), 'the death drop no longer spawns charged mass');
        ok(!/shardCount\s*\+=/.test(body), 'a predator now ALSO drops shards directly — the '
           + 'scale would be paying twice');
    });

    check('THE ASK: the lump pays more than it used to', () => {
        ok(SCALE > 0.35, `MASS_VALUE_SCALE is ${SCALE}, no better than the 0.35 that was reported`);
    });

    check('a lump is worth what the predator was worth', () => {
        same(SCALE, 1, `the scale is ${SCALE}; the chain is meant to be the cost, not a discount`);
    });

    check('the early species now pay for a pylon in a kill or two', () => {
        // Concretely, against the species table and the real pylon price.
        const r = E.run(`(function(){
            const val = (s, c) => Math.max(1, Math.round((SPECIES[s][c].shardDrop || 5) * MASS_VALUE_SCALE));
            return { antScout: val('ant','scout'), antTank: val('ant','tank'),
                     beetleStriker: val('beetle','striker'),
                     pylon: PYLON_BUILD_COST };
        })()`);
        ok(r.antTank >= r.pylon * 0.7,
           `an ant tank pays ${r.antTank} against a ${r.pylon}-shard pylon`);
        ok(r.beetleStriker >= r.pylon * 0.7,
           `a beetle striker pays ${r.beetleStriker} against a ${r.pylon}-shard pylon`);
        ok(r.antScout >= 2, `the weakest thing you meet pays ${r.antScout}`);
    });

    check('the payout runs through the one named constant', () => {
        ok(/MASS_VALUE_SCALE/.test(SRC.drops), 'the drop does not use the constant');
        same((SRC.mass.match(/const MASS_VALUE_SCALE/g) || []).length, 1,
             'the scale is declared more than once');
    });

    check('nothing pays out zero', () => {
        // The floor matters: a nymph at a low scale would otherwise round to 0
        // and the lump would be litter.
        const r = E.run(`(function(){
            const worst = [];
            for (const s of Object.keys(SPECIES))
                for (const c of ['nymph','scout','striker','tank'])
                    if (SPECIES[s][c])
                        worst.push(Math.max(1, Math.round((SPECIES[s][c].shardDrop||5) * MASS_VALUE_SCALE)));
            return Math.min(...worst);
        })()`);
        ok(r >= 1, 'the cheapest lump is worth ' + r);
    });

    // ─────────────────────────────────────────────────────
    group('THE ALARM: decoys are rarer');

    check('THE ASK: a panel is far less likely to be a decoy', () => {
        ok(C.PANEL_DECOY_CHANCE < 0.40,
           `the decoy chance is ${C.PANEL_DECOY_CHANCE}, no better than the 0.40 reported`);
        ok(C.PANEL_DECOY_CHANCE > 0,
           'a decoy chance of zero removes the mechanic rather than easing it');
    });

    check('generation reads the constant rather than a literal', () => {
        ok(/isDecoy\s*=\s*rnd\(\)\s*<\s*PANEL_DECOY_CHANCE/.test(SRC.world),
           'world.js still hardcodes the decoy odds');
        ok(!/rnd\(\)\s*<\s*0\.40/.test(SRC.world), 'the old 0.40 literal is still there');
    });

    check('measured across five worlds, the opening is much quieter', () => {
        // The number the player actually experiences: decoys waiting in the
        // first four zones.
        const counts = [];
        for (const seed of ['305419896', '11111111', '22222222', '33333333', '44444444']) {
            const r = E.run(`(function(){
                worldSeed = Number(${JSON.stringify(seed)});
                world.length = 0; worldTileMap.clear();
                _wallPanelCache.length = 0; _cacheAge = -999;
                for (let i = 0; i < 4 * ZONE_LENGTH; i++) { try { generateSegment(i); } catch(e) {} }
                const panels = world.filter(t => t.nodeType === 'wall_panel');
                return { panels: panels.length, decoys: panels.filter(t => t.isDecoy).length };
            })()`);
            counts.push(r);
        }
        const panels = counts.reduce((a, b) => a + b.panels, 0);
        const decoys = counts.reduce((a, b) => a + b.decoys, 0);
        ok(panels > 40, 'fixture: too few panels generated to judge — ' + panels);
        const rate = decoys / panels;
        ok(rate < 0.18, `decoys are still ${Math.round(rate*100)}% of panels across ${panels}`);
        const perWorld = decoys / counts.length;
        ok(perWorld < 3, `still ${perWorld.toFixed(1)} decoys waiting in the first four zones`);
    });

    check('the opening now matches the rest of the game', () => {
        // resetPanels reshuffles to exactly ONE decoy map-wide after every
        // alarm. Generation used to be five times harsher than that, which is
        // why the beginning specifically felt hard.
        const at = SRC.waves.indexOf('function resetPanels');
        const body = SRC.waves.slice(at, SRC.waves.indexOf('\n}', at));
        ok(/isDecoy\s*=\s*true/.test(body), 'resetPanels no longer assigns a decoy');
        same((body.match(/isDecoy\s*=\s*true/g) || []).length, 1,
             'resetPanels should assign exactly one');
        // A generated world should be in the same ballpark, not five times it.
        const r = E.run(`(function(){
            worldSeed = 305419896;
            world.length = 0; worldTileMap.clear();
            _wallPanelCache.length = 0; _cacheAge = -999;
            for (let i = 0; i < 4 * ZONE_LENGTH; i++) { try { generateSegment(i); } catch(e) {} }
            const panels = world.filter(t => t.nodeType === 'wall_panel');
            return { panels: panels.length, decoys: panels.filter(t => t.isDecoy).length };
        })()`);
        ok(r.decoys <= 4, `a fresh world starts with ${r.decoys} decoys against the steady state of 1`);
    });

    check('an alarm still raises the wave, which is why frequency mattered', () => {
        const at = SRC.waves.indexOf('function triggerAlarm');
        const body = SRC.waves.slice(at, at + 900);
        ok(/gameState\.nightNumber\+\+/.test(body),
           'the alarm no longer escalates — this check is out of date, not the code');
    });

    check('hacking a nest still trips one — that choice is untouched', () => {
        // Only the accident got rarer. The deliberate trip is a decision the
        // player makes and is worth keeping.
        ok(/triggerAlarm\("zone", nest\.x, nest\.y\)/.test(SRC.game),
           'the nest hack no longer raises an alarm');
    });

    check('zone 0 is still safe', () => {
        ok(/nest\.nestZone === 0/.test(SRC.game), 'the home zone no longer suppresses alarms');
    });

    // ─────────────────────────────────────────────────────
    group('the index says so');

    check('the documented decoy odds match the constant', () => {
        const pct = Math.round(C.PANEL_DECOY_CHANCE * 100);
        ok(new RegExp('Decoy Panel \\(' + pct + '%\\)').test(HTML),
           `the index does not say decoys are ${pct}%`);
        ok(new RegExp('Reward Panel \\(' + (100 - pct) + '%\\)').test(HTML),
           `nor that reward panels are ${100 - pct}%`);
        ok(!/Decoy Panel \(40%\)/.test(HTML), 'the old 40% is still documented');
    });

    check('and the documented panel reward matches generation', () => {
        // It said "5-15 shards" while generation had always produced 10-30 —
        // nothing held the two together until the range was named.
        ok(new RegExp(C.PANEL_SHARD_MIN + '–' + C.PANEL_SHARD_MAX + ' shards').test(HTML),
           `the index does not say ${C.PANEL_SHARD_MIN}-${C.PANEL_SHARD_MAX} shards`);
        ok(!/5–15 shards/.test(HTML), 'the old 5-15 range is still documented');
        ok(/PANEL_SHARD_MIN/.test(SRC.world), 'world.js does not read the named range');
    });

    check('a generated panel actually pays inside that range', () => {
        const r = E.run(`(function(){
            worldSeed = 305419896;
            world.length = 0; worldTileMap.clear();
            _wallPanelCache.length = 0; _cacheAge = -999;
            for (let i = 0; i < 6 * ZONE_LENGTH; i++) { try { generateSegment(i); } catch(e) {} }
            const rewards = world.filter(t => t.nodeType === 'wall_panel').map(t => t.shardReward);
            return { n: rewards.length, min: Math.min(...rewards), max: Math.max(...rewards) };
        })()`);
        ok(r.n > 10, 'fixture: too few panels to judge — ' + r.n);
        ok(r.min >= C.PANEL_SHARD_MIN, `a panel paid ${r.min}, under the documented floor`);
        ok(r.max <= C.PANEL_SHARD_MAX, `a panel paid ${r.max}, over the documented ceiling`);
    });

    check('the work crew page states the payout from the constant', () => {
        const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
        ok(/MASS_VALUE_SCALE/.test(CODEX), 'the page does not read the scale');
        // At full value the old wording ("a fraction ... the trip is the
        // price") is simply wrong, so the page has to say something different.
        ok(/the full amount/.test(CODEX) || SCALE < 1,
           'the page still describes the payout as a cut taken off the top');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
