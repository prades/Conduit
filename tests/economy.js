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
        // Behaviour, not source. This grepped game.js for the zone check, which
        // has since moved into nestIsHackable() — the rule is unchanged and in
        // a better place, but the check could not tell the difference.
        const r = E.run(`(function(){
            const was = alertActive; alertActive = false;
            const home = { nest: true, nestZone: 0, nestHealth: 200 };
            const fwd  = { nest: true, nestZone: 2, nestHealth: 200 };
            const dead = { nest: true, nestZone: 2, nestHealth: 0 };
            const out = { home: nestIsHackable(home), fwd: nestIsHackable(fwd),
                          dead: nestIsHackable(dead) };
            alertActive = true;
            out.duringAlarm = nestIsHackable(fwd);
            alertActive = was;
            return out;
        })()`);
        same(r.home, false, 'the home zone nest can be hacked, raising an alarm at base');
        same(r.fwd, true, 'a forward nest can no longer be hacked at all');
        same(r.dead, false, 'a dead nest can still be hacked');
        same(r.duringAlarm, false, 'a nest can be hacked while an alarm is already running');
    });

    // ─────────────────────────────────────────────────────
    group('A TAKEN ZONE: its panels are neutralised too');

    // REPORTED: "even the panels of that zone cleared should be neutralised —
    // no setting off the alarm; yes hacking for shards, but less than the
    // normal amount."
    //
    // Driven through the real panel loop rather than read out of the source:
    // the player walks up, stands there for SIPHON_FRAMES, and what happens is
    // what happens.

    // Its OWN booted world. This group walks the player around, rewrites panel
    // state and empties _wallPanelCache; doing that in the shared one left a
    // later check with no panel in reach of the nest it was testing.
    const P = await ready();

    // Stand the player in front of a panel and run the siphon to completion.
    // Returns what the game did about it.
    const hack = (env, zone, { decoy, taken }) => env.run(`(function(){
        gameState.running = true;
        alertActive = false; alertType = null; alertSource = null; alertZone = null;
        floatingTexts.length = 0;
        shardCount = 0; playerAmmo = 0;
        // Put every zone's nest back up, then take this one's down if asked.
        world.forEach(t => { if (t.nest) t.nestHealth = t.nestMaxHealth || 200; });
        if (${!!taken}) world.forEach(t => {
            if (t.nest && t.nestZone === ${zone}) t.nestHealth = 0;
        });
        const p = world.find(t => t.nodeType === 'wall_panel'
                                  && getZoneIndex(Math.floor(t.x)) === ${zone});
        if (!p) return { missing: true };
        p.panelActivated = false; p.siphonProgress = 0;
        p.isDecoy = ${!!decoy};
        p.shardReward = 20;
        _wallPanelCache.length = 0; _wallPanelCache.push(p);
        player.x = p.x; player.y = p.y + 1;
        player.visualX = player.x; player.visualY = player.y;
        player.targetX = player.x; player.targetY = player.y;
        for (let i = 0; i < 200 && !p.panelActivated; i++) render();
        return {
            activated: !!p.panelActivated,
            shards: shardCount,
            alarm: !!alertActive,
            neutral: zoneIsNeutralised(${zone}),
            said: floatingTexts.map(t => t.text).join(' | '),
        };
    })()`);

    check('fixture: a panel in a live zone behaves as it always did', () => {
        const r = hack(P, 1, { decoy: false, taken: false });
        ok(!r.missing, 'no panel generated in zone 1 to test with');
        same(r.activated, true, 'the panel never finished siphoning');
        same(r.neutral, false, 'fixture: zone 1 should still be theirs');
        same(r.shards, 20, 'a live zone should pay the full reward');
        same(r.alarm, false, 'a plain panel should not raise anything');
    });

    check('THE ASK: a decoy in a taken zone does NOT raise the alarm', () => {
        const r = hack(P, 1, { decoy: true, taken: true });
        same(r.neutral, true, 'fixture: zone 1 should read as taken');
        same(r.activated, true, 'the panel never finished siphoning');
        same(r.alarm, false, 'hacking a panel in a taken zone raised the alarm');
    });

    check('...and the same decoy in a LIVE zone still does', () => {
        // Otherwise the check above passes because decoys stopped working.
        const r = hack(P, 1, { decoy: true, taken: false });
        same(r.neutral, false, 'fixture: zone 1 should still be theirs');
        same(r.alarm, true, 'a decoy in a live zone no longer raises the alarm');
    });

    check('THE ASK: it still pays shards, but fewer', () => {
        const live  = hack(P, 1, { decoy: false, taken: false });
        const taken = hack(P, 1, { decoy: false, taken: true });
        ok(taken.shards > 0, 'a taken zone pays nothing at all');
        ok(taken.shards < live.shards,
           `a taken zone pays ${taken.shards}, the same as the live ${live.shards}`);
        // And by the documented amount, read from the constant.
        const mult = Number(SRC.config.match(/const PANEL_NEUTRAL_SHARD_MULT = ([\d.]+)/)[1]);
        ok(mult > 0 && mult < 1, 'the multiplier should reduce the payout, got ' + mult);
        same(taken.shards, Math.max(1, Math.round(live.shards * mult)),
             'the reduced payout does not match PANEL_NEUTRAL_SHARD_MULT');
    });

    check('even a decoy pays, once its zone is taken', () => {
        // There is nobody left to raise, so the decoy is just a panel.
        const r = hack(P, 1, { decoy: true, taken: true });
        ok(r.shards > 0, 'a decoy in a taken zone pays nothing');
        same(r.alarm, false, 'and it must still not raise anything');
    });

    check('and it says why the payout is smaller', () => {
        const r = hack(P, 1, { decoy: false, taken: true });
        ok(/zone taken/i.test(r.said),
           'the payout does not tell the player the zone is taken: ' + r.said);
    });

    check('taking one zone does not neutralise the next', () => {
        const r = P.run(`(function(){
            world.forEach(t => { if (t.nest) t.nestHealth = t.nestMaxHealth || 200; });
            world.forEach(t => { if (t.nest && t.nestZone === 1) t.nestHealth = 0; });
            return { one: zoneIsNeutralised(1), two: zoneIsNeutralised(2),
                     home: zoneIsNeutralised(0) };
        })()`);
        same(r.one, true, 'the taken zone should read as taken');
        same(r.two, false, 'the next zone should not');
        same(r.home, false, 'home is not a zone you take');
    });

    check('a zone that never had a nest is NOT taken', () => {
        // zoneSpawnPoints says null for "there was nothing here" and [] for
        // "everything here is shut", and the spawn loop still produces from the
        // zone centre in the first case. Reading null as taken would neutralise
        // the panels of a zone that is still spawning.
        const r = P.run(`(function(){
            world.forEach(t => { if (t.nest) t.nestHealth = t.nestMaxHealth || 200; });
            // Strip zone 2's nests entirely, as if it had generated without one.
            const stripped = [];
            world.forEach(t => {
                if (t.nest && t.nestZone === 2) { t.nest = false; stripped.push(t); }
            });
            const out = { stripped: stripped.length,
                          mouths: zoneSpawnPoints(2),
                          taken: zoneIsNeutralised(2) };
            stripped.forEach(t => { t.nest = true; });   // put it back
            return out;
        })()`);
        ok(r.stripped > 0, 'fixture: zone 2 should have had a nest to strip');
        same(r.mouths, null, 'fixture: a zone with no nest should report null');
        same(r.taken, false, 'a zone that never had a nest was read as taken');
    });

    check('the decoy is never dropped in a zone that cannot raise it', () => {
        // resetPanels reshuffles to exactly one decoy map-wide. Putting it in a
        // taken zone would silently hand the player a free wave.
        const r = P.run(`(function(){
            world.forEach(t => { if (t.nest) t.nestHealth = t.nestMaxHealth || 200; });
            // Take every zone but the deepest one that has panels.
            const zones = [...new Set(world.filter(t => t.nodeType === 'wall_panel')
                                           .map(t => getZoneIndex(Math.floor(t.x))))].sort();
            const keep = zones[zones.length - 1];
            world.forEach(t => {
                if (t.nest && t.nestZone !== keep && t.nestZone > 0) t.nestHealth = 0;
            });
            const seen = {};
            for (let i = 0; i < 40; i++) {
                resetPanels();
                world.filter(t => t.isDecoy).forEach(t => {
                    seen[getZoneIndex(Math.floor(t.x))] = true;
                });
            }
            return { keep, zones, seen: Object.keys(seen).map(Number) };
        })()`);
        ok(r.zones.length > 1, 'fixture: needs panels in more than one zone');
        same(r.seen.join(','), String(r.keep),
             'a decoy was placed in a taken zone (' + r.seen.join(',') + ')');
    });

    check('a taken zone\'s panel looks taken, before you walk up to it', () => {
        // Behaviour the player cannot see until after the fact is a trap. The
        // panel is painted in the same blue as that zone's nest.
        const DRAW = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        const at = DRAW.indexOf("} else if (tile.nodeType === 'wall_panel')");
        ok(at > -1, 'the wall panel drawing could not be located');
        const body = DRAW.slice(at, at + 1400);
        ok(/zoneIsNeutralised/.test(body), 'the panel does not know whether its zone is taken');
        ok(/NEST_COLOUR_CONTROLLED/.test(body),
           'a taken zone\'s panel is not painted the colour of that zone');
    });

    check('the index says what a taken zone\'s panels do', () => {
        const at = HTML.indexOf('WALL PANEL');
        ok(at > -1, 'the index no longer documents wall panels');
        const page = HTML.slice(at, HTML.indexOf('WHO CAN BE ATTACKED', at));
        ok(/zone you have taken/i.test(page), 'it does not mention a taken zone at all');
        ok(/no panel can trip the alarm/i.test(page), 'nor that the alarm cannot be tripped');
        // The documented reduction has to match the constant.
        const mult = Number(SRC.config.match(/const PANEL_NEUTRAL_SHARD_MULT = ([\d.]+)/)[1]);
        const pct = Math.round(mult * 100) + '%';
        ok(page.indexOf('>' + pct + '<') > -1,
           'the index does not say ' + pct + ', which is what PANEL_NEUTRAL_SHARD_MULT pays');
    });

    group('HACKING A NEST: the floor says where');

    // REPORTED: "change the wording on the hold to hack nest feature — just
    // have a highlighted zone and have it say HACKING. Highlight the tiles
    // around the area where the hacking can take place."
    //
    // The old label read "[ HOLD to HACK NEST ]" and was wrong twice: there is
    // no hold anywhere in it — the hack is proximity, you walk in and wait —
    // and it named no place, so the spot had to be found by trial.
    //
    // Two duplications turned up underneath it: the progress bar divided by a
    // literal 180 while the tick counted to its own local NEST_HACK_FRAMES, and
    // the range was a bare 2.25 in both.

    check('THE WORDING: the misleading label is gone', () => {
        const code = SRC.game.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        ok(!/HOLD to HACK/.test(code), 'the HOLD label is still drawn');
        ok(!/HACKING NEST\.\.\./.test(code), 'the old progress caption is still there');
        ok(/fillText\("HACKING"/.test(code), 'the bar no longer says HACKING');
    });

    check('the progress bar and the tick agree on how long it takes', () => {
        const code = SRC.game.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        ok(/_hackProg \/ NEST_HACK_FRAMES/.test(code),
           'the bar still divides by its own number');
        ok(!/_hackProg \/ 180/.test(code), 'the literal 180 is still in the bar');
    });

    check('THE HIGHLIGHT: every lit tile really does hack', () => {
        // The whole point. A green tile that does nothing is worse than none.
        const r = E.run(`(function(){
            alertActive = false;
            const nest = world.find(t => t.nest && t.nestZone >= 1 && t.nestHealth > 0);
            if (!nest) throw new Error('fixture: no forward nest');
            const c = nestHackCentre(nest);
            const R = Math.ceil(NEST_HACK_RANGE);
            const lit = [];
            for (let y = c.y - R; y <= c.y + R; y++)
                for (let x = c.x - R; x <= c.x + R; x++) {
                    if (!canHackNestFrom(nest, x, y)) continue;
                    const t = getTile(x, y);
                    if (t && t.type === 'floor') lit.push([x, y]);
                }
            const worked = [];
            for (const [x, y] of lit) {
                nest.nestHackProgress = 0;
                // targetX/targetY too, or render() walks the player back to
                // wherever they were going and they are never in the zone.
                player.x = x; player.y = y;
                player.targetX = x; player.targetY = y;
                player.visualX = x; player.visualY = y;
                for (let f = 0; f < 10; f++) render();
                worked.push([x + ',' + y, nest.nestHackProgress]);
            }
            return { lit: lit.length, worked, dead: worked.filter(w => w[1] === 0) };
        })()`);
        ok(r.lit > 0, 'the highlight lit no tiles at all');
        same(r.dead.length, 0,
             'lit tiles that do NOT hack: ' + JSON.stringify(r.dead));
        // The half above proves the PREDICATE is right. This proves the DRAW
        // uses it — building the list here with canHackNestFrom passed happily
        // while the draw still lit tiles with the range test alone.
        const code = SRC.game.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        const at   = code.indexOf('function drawNestHackZone');
        const body = code.slice(at, code.indexOf('\nfunction ', at + 1));
        ok(at > -1 && body.length > 200, 'drawNestHackZone could not be located');
        ok(/canHackNestFrom\(nest, tx, ty\)/.test(body),
           'the highlight picks tiles by range alone, so it lights floor a panel will steal');
    });

    check('THE TRAP IT EXPOSED: a wall panel silently claims the siphon', () => {
        // The panel loop runs before the nest loop and sets the same "one thing
        // at a time" flag, so standing in a nest's range next to an un-hacked
        // panel hacks the PANEL and the nest never counts. Nothing said so.
        // The highlight now leaves those tiles dark rather than lying.
        const r = E.run(`(function(){
            const nest = world.find(t => t.nest && t.nestZone >= 1 && t.nestHealth > 0);
            const c = nestHackCentre(nest);
            // A panel planted right on a tile that is otherwise in range.
            const t = getTile(c.x, c.y);
            const wasType = t.nodeType, wasDone = t.panelActivated;
            t.nodeType = 'wall_panel'; t.panelActivated = false;
            const claimed = panelWouldClaimSiphon(c.x, c.y);
            const inRange = inNestHackRange(nest, c.x, c.y);
            const lit     = canHackNestFrom(nest, c.x, c.y);
            t.nodeType = wasType; t.panelActivated = wasDone;
            return { claimed, inRange, lit };
        })()`);
        same(r.inRange, true, 'fixture: the tile should be in range');
        same(r.claimed, true, 'fixture: the panel should claim that tile');
        same(r.lit, false, 'the highlight lights a tile a panel will steal');
    });

    check('an ACTIVATED panel does not steal it', () => {
        // Every panel in reach has to be spent, not just the one planted here:
        // the generated map already had a live panel one tile away, so the
        // first version of this check measured that one instead.
        const r = E.run(`(function(){
            const nest = world.find(t => t.nest && t.nestZone >= 1 && t.nestHealth > 0);
            const c = nestHackCentre(nest);
            const touched = [];
            for (const t of world) {
                if (t.nodeType !== 'wall_panel') continue;
                if ((c.x - t.x) ** 2 + (c.y - t.y) ** 2 >= PANEL_SIPHON_RANGE ** 2) continue;
                touched.push([t, t.panelActivated]);
            }
            const live  = touched.length;
            const before = canHackNestFrom(nest, c.x, c.y);
            for (const [t] of touched) t.panelActivated = true;
            const after = canHackNestFrom(nest, c.x, c.y);
            for (const [t, was] of touched) t.panelActivated = was;
            return { live, before, after };
        })()`);
        ok(r.live > 0, 'fixture: no panel was in reach of the hack centre to spend');
        same(r.before, false, 'fixture: a live panel should have been blocking it');
        same(r.after, true, 'a spent panel still blocks the nest hack');
    });

    check('the zone is not painted for a nest you cannot hack', () => {
        const ops = [];
        const r = E.run(`(function(){
            const nest = world.find(t => t.nest && t.nestZone >= 1 && t.nestHealth > 0);
            const c = nestHackCentre(nest);
            player.x = c.x; player.y = c.y; player.visualX = c.x; player.visualY = c.y;
            const out = {};
            alertActive = false; out.hackable = nestIsHackable(nest);
            alertActive = true;  out.duringAlarm = nestIsHackable(nest);
            alertActive = false;
            const hp = nest.nestHealth; nest.nestHealth = 0;
            out.dead = nestIsHackable(nest);
            nest.nestHealth = hp;
            const home = world.find(isHomePortal);
            out.home = home ? nestIsHackable(home) : 'no portal';
            return out;
        })()`);
        same(r.hackable, true, 'fixture: a live forward nest should be hackable');
        same(r.duringAlarm, false, 'the zone would show while an alarm is already running');
        same(r.dead, false, 'a dead nest still shows a hack zone');
        same(r.home, false, 'the home portal shows a hack zone');
    });

    check('the draw and the tick use the SAME range', () => {
        const code = SRC.game.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        ok(/inNestHackRange\(nest, player\.x, player\.y\)/.test(code),
           'the tick no longer uses the shared range test');
        ok(!/_nhdx\*_nhdx \+ _nhdy\*_nhdy < 2\.25/.test(code),
           'the bare 2.25 is still in the tick');
        const HELP = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8');
        same((HELP.match(/function inNestHackRange/g) || []).length, 1,
             'the range test is declared more than once');
    });

    // ─────────────────────────────────────────────────────
    group('the index says so');

    check('the index describes the hack zone, not a hold', () => {
        ok(!/HOLD to HACK/i.test(HTML), 'the index still tells the player to hold');
        ok(/green patch of floor/i.test(HTML), 'it does not describe the lit zone');
        ok(/no button and no hold/i.test(HTML), 'it does not say the hack is proximity');
        ok(/un-hacked wall panel/i.test(HTML),
           'it does not warn that a panel takes the siphon first');
    });

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
