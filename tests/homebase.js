// THE HOME PORTAL, and the generator's HEALING AURA.
//
// REPORTED: "the first zone's nest should be inactive. Make it like a green
// looking portal and make it the central crystal menu. And make it to where
// the pylons connected to the generator emit a healing aura that is multiplied
// by the element's network tier."
//
// THE PORTAL. Zone 0's nest was never a nest. The spawn loop starts at zone 1,
// so it produced nothing, and the nest hack explicitly skips zone 0, so it
// raised no alarm. It was an inert hive structure sitting on the one tile the
// player is safe on, drawn identically to the six that are trying to kill them
// — and zoneSpawnPoints(0) still answered that it was a mouth, so anything
// that ever counted zones from zero would have poured predators out of the
// player's own doorway.
//
// THE AURA. A generator kept its linked pylons repaired and did nothing for
// the squad standing around them. Now each linked pylon mends whoever is near
// it, with the rate AND the reach multiplied by that pylon's network tier.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox, configNums } = require('./domstub.js');

const SRC = {
    game:    fs.readFileSync(path.join(ROOT, 'js/game.js'),    'utf8'),
    input:   fs.readFileSync(path.join(ROOT, 'js/input.js'),   'utf8'),
    clone:   fs.readFileSync(path.join(ROOT, 'js/clone.js'),   'utf8'),
    helpers: fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8'),
};
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
const A = configNums(['GEN_AURA_INTERVAL', 'GEN_AURA_HEAL',
                      'GEN_AURA_RADIUS', 'GEN_AURA_PER_TIER']);

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

async function ready() {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896', tubecrawler_shards: '9999' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');
    return { run, sandbox };
}

(async () => {
    const E = await ready();

    // ─────────────────────────────────────────────────────
    group('THE HOME PORTAL: zone 0 is a doorway, not a hive');

    check('there is exactly one, and it is zone 0\'s', () => {
        const r = E.run(`(function(){
            const portals = world.filter(isHomePortal);
            const hives   = world.filter(t => t.nest && !t._infestNest && !isHomePortal(t));
            return { n: portals.length, zones: portals.map(t => t.nestZone),
                     at: portals.map(t => [t.x, t.y]), hives: hives.length };
        })()`);
        same(r.n, 1, 'expected one home portal, got ' + r.n);
        same(r.zones[0], 0, 'the portal should be zone 0\'s nest');
        ok(r.hives >= 3, 'fixture: the other zones should still have hives, got ' + r.hives);
    });

    check('an infestation-grown nest is never mistaken for it', () => {
        // A grown nest carries a zone index too, and a nest grown in zone 0
        // would otherwise read as the doorway and become unattackable.
        const r = E.run(`(function(){
            return { grown: isHomePortal({ nest: true, nestZone: 0, _infestNest: true }),
                     real:  isHomePortal({ nest: true, nestZone: 0 }),
                     other: isHomePortal({ nest: true, nestZone: 2 }),
                     notANest: isHomePortal({ nestZone: 0 }),
                     nothing: isHomePortal(null) };
        })()`);
        same(r.grown, false, 'a grown nest in zone 0 must still be a target');
        same(r.real, true, 'the generated zone 0 nest is the portal');
        same(r.other, false, 'zone 2\'s nest is a hive');
        same(r.notANest, false, 'a bare tile is not the portal');
        same(r.nothing, false, 'nothing is not the portal');
    });

    check('THE ASK: tapping it opens the Crystal menu', () => {
        const r = E.run(`(function(){
            const p = world.find(isHomePortal);
            player.x = p.x; player.y = p.y + 2;
            player.visualX = player.x; player.visualY = player.y;
            render();
            const pos = homePortalScreenPos();
            crystalMenuOpen = false;
            handleInput(pos.x, pos.y);
            const onIt = crystalMenuOpen;
            crystalMenuOpen = false;
            handleInput(pos.x + 400, pos.y + 300);
            const wellAway = crystalMenuOpen;
            crystalMenuOpen = false;
            return { onIt, wellAway };
        })()`);
        same(r.onIt, true, 'a tap on the portal did not open the Crystal');
        same(r.wellAway, false, 'a tap far from it opened the Crystal anyway');
    });

    check('it is NOT a spawn mouth', () => {
        // zoneSpawnPoints(0) used to answer that it was one. The spawn loop
        // starts at zone 1 so nothing came of it, but the answer was wrong and
        // the next caller to count from zero would have found out the hard way.
        const r = E.run(`(function(){
            const z0 = zoneSpawnPoints(0);
            const z1 = zoneSpawnPoints(1);
            return { z0: z0 === null ? 'null' : z0.length,
                     z1: z1 === null ? 'null' : z1.length };
        })()`);
        same(r.z0, 'null', 'zone 0 still offers ' + r.z0 + ' spawn mouth(s)');
        ok(r.z1 === 'null' || r.z1 > 0, 'fixture: zone 1 should still have mouths, got ' + r.z1);
    });

    check('the squad cannot be ordered to destroy it', () => {
        const r = E.run(`(function(){
            const p = world.find(isHomePortal);
            player.x = p.x; player.y = p.y + 2;
            player.visualX = player.x; player.visualY = player.y;
            render();
            commandNestTarget = null;
            // A long hold right on it.
            const px = (p.x - player.visualX - (p.y - player.visualY)) * TILE_W + canvas.width/2;
            const py = (p.x - player.visualX + (p.y - player.visualY)) * TILE_H + canvas.height/2;
            handleLongHold(px, py);
            const picked = commandNestTarget;
            commandMode = false; commandNestTarget = null; commandTarget = null;
            return { picked: picked ? (isHomePortal(picked) ? 'THE PORTAL' : 'a hive') : 'nothing' };
        })()`);
        ok(r.picked !== 'THE PORTAL', 'a long hold selected the portal as a nest target');
    });

    check('a real hive can still be picked, so this is not a blanket block', () => {
        const r = E.run(`(function(){
            const h = world.find(t => t.nest && !t._infestNest && !isHomePortal(t) && t.nestHealth > 0);
            if (!h) throw new Error('fixture: no hive to pick');
            player.x = h.x; player.y = h.y + 2;
            player.visualX = player.x; player.visualY = player.y;
            render();
            commandNestTarget = null;
            const px = (h.x - player.visualX - (h.y - player.visualY)) * TILE_W + canvas.width/2;
            const py = (h.x - player.visualX + (h.y - player.visualY)) * TILE_H + canvas.height/2;
            handleLongHold(px, py);
            const got = commandNestTarget;
            commandMode = false; commandNestTarget = null; commandTarget = null;
            return !!got;
        })()`);
        same(r, true, 'a long hold on an ordinary hive no longer selects it');
    });

    check('it is drawn as a portal, not as a honeycomb', () => {
        ok(/isHomePortal\(obj\)/.test(SRC.game), 'the draw pass does not branch on the portal');
        ok(/drawHomePortal\(px, py\)/.test(SRC.game), 'it does not call the portal drawing');
        const DRAW = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok(/function drawHomePortal/.test(DRAW), 'there is no portal drawing');
        ok(/PORTAL_COLOUR = "#2bff9b"/.test(DRAW), 'the portal is not green');
    });

    check('one predicate, consulted by the draw, the input and the spawner', () => {
        same((SRC.helpers.match(/function isHomePortal/g) || []).length, 1,
             'the predicate is declared more than once');
        for (const [name, src] of [['game.js', SRC.game], ['input.js', SRC.input],
                                   ['clone.js', SRC.clone]]) {
            ok(/isHomePortal/.test(src), name + ' does not consult the predicate');
        }
    });

    // ─────────────────────────────────────────────────────
    group('THE NETWORK TIER');

    // The healing aura these checks guarded is gone: the generator became the
    // SHIELD GENERATOR, and its field is tested in tests/shieldgen.js.
    check('the tier is read from one place', () => {
        ok(/function pylonNetworkTier/.test(SRC.game), 'there is no single tier reader');
        same((SRC.game.match(/function pylonNetworkTier/g) || []).length, 1,
             'the tier reader is declared more than once');
        const r = E.run(`(function(){
            networkStrength['fire'] = 2;
            return { withEl: pylonNetworkTier({ attackModeElement: 'fire' }),
                     noEl:   pylonNetworkTier({ }),
                     none:   pylonNetworkTier(null) };
        })()`);
        same(r.withEl, 2, 'the tier is not read from networkStrength');
        same(r.noEl, 0, 'a pylon with no element should be tier 0');
        same(r.none, 0, 'nothing should be tier 0');
    });

    // ─────────────────────────────────────────────────────
    group('CHARGED MASS survives the round turning over');

    // The source checks in tests/mass.js prove the clear has moved. This proves
    // the lumps are actually still there afterwards, through a real nextWave().

    check('THE REPORTED CASE: lumps are still on the floor next round', () => {
        const r = E.run(`(function(){
            chargedMass.length = 0; actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            spawnChargedMass(5, 2, 7);
            spawnChargedMass(6, 2, 4);
            spawnChargedMass(7, 2, 9);
            const before = { n: chargedMass.length, value: massCounts().value };
            nextWave();
            return { before, after: { n: chargedMass.length, value: massCounts().value } };
        })()`);
        same(r.before.n, 3, 'fixture: three lumps should have been dropped');
        same(r.after.n, r.before.n, 'the wave swept the floor: ' + JSON.stringify(r));
        same(r.after.value, r.before.value, 'the lumps lost their value across the wave');
    });

    check('and a lump that was mid-haul is dropped, not stranded', () => {
        // followers[] is rebuilt from the save, so the carrier stops existing.
        const r = E.run(`(function(){
            chargedMass.length = 0; actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            spawnChargedMass(5, 2, 7);
            spawnFollowerAtCrystal('flux');
            const hauler = followers[0], m = chargedMass[0];
            m.state = MASS_STATE.CARRIED; m.carrier = hauler; hauler.carryingMass = m;
            nextWave();
            return { n: chargedMass.length,
                     carried: chargedMass.filter(x => x.state === MASS_STATE.CARRIED).length,
                     stranded: chargedMass.filter(x => !!x.carrier).length,
                     collectable: chargedMass.filter(x => !x.carrier
                        && (x.state === MASS_STATE.NEUTRAL || x.state === MASS_STATE.CHARGED)).length };
        })()`);
        same(r.n, 1, 'the lump vanished with its carrier');
        same(r.carried, 0, 'it is still marked as being carried by a follower that is gone');
        same(r.stranded, 0, 'it still points at a carrier that no longer exists');
        same(r.collectable, 1, 'it cannot be picked up again');
    });

    // ─────────────────────────────────────────────────────
    group('the index says so');

    check('the portal and the aura are documented', () => {
        ok(/HOME PORTAL/i.test(HTML), 'the index does not mention the home portal');
        ok(/shield generator/i.test(HTML), 'nor the shield generator');
        ok(/network tier/i.test(HTML), 'nor the network tier');
    });

    // ─────────────────────────────────────────────────────
    group('NO DESTROY ORDER: a nest is hacked, not bashed down');

    // REPORTED: "remove the destroy nest option because it's only going to do
    // hacking in it."
    //
    // DESTROY sent up to five idle followers to walk to a live nest and hit it
    // until it died. A zone's nest now goes out when the zone's wave is cleared,
    // which starts with the player hacking it — so a second way to kill it, by
    // hand, was both redundant and a way round the fight the hack starts.

    // What the left button of the radial offers when the press is near `nest`.
    const leftButton = (health, linked) => E.run(`(function(){
        buildMode = false; commandMode = true;
        commandTarget = null; commandFollowerTarget = null; commandEnemyTarget = null;
        const n = world.find(t => t.nest && t.nestZone === 1);
        n.nestHealth = ${health};
        n.connectedPylon = ${linked ? 'world.find(t => t.pillar) || {destroyed:false}' : 'null'};
        commandNestTarget = n;
        commandX = 300; commandY = 300;
        dragDX = -RADIAL_RADIUS; dragDY = 0;       // held to the LEFT
        const labels = [];
        const orig = ctx.fillText.bind(ctx);
        ctx.fillText = (t, ...a) => { labels.push(String(t)); return orig(t, ...a); };
        drawRadialMenu();
        ctx.fillText = orig;
        const action = selectedRadialAction;
        commandMode = false; commandNestTarget = null;
        return { action, labels: labels.filter(t => /^[A-Z]{3,}$/.test(t)) };
    })()`);

    check('THE ASK: a LIVE nest no longer offers DESTROY', () => {
        const r = leftButton(200, false);
        ok(!r.labels.includes('DESTROY'), 'the radial still offers DESTROY: ' + r.labels);
        ok(r.action !== 'destroy_nest', 'and it still maps the left button to it');
    });

    check('a taken nest offers no CONNECT any more — it links by itself', () => {
        const r = leftButton(0, false);
        ok(!r.labels.includes('CONNECT'), 'the radial still offers CONNECT: ' + r.labels);
        ok(r.action !== 'connect_nest', 'and it still maps the left button to it');
    });

    check('the order is gone from every layer, not just the button', () => {
        // The button, the release-tap hit test that mirrors it, the command, and
        // the job that did the bashing. Any one left behind is a way back in.
        const code = f => fs.readFileSync(path.join(ROOT, f), 'utf8')
            .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        for (const f of ['js/draw.js', 'js/input.js', 'js/commands.js', 'js/npc.js']) {
            ok(!/destroy_nest/.test(code(f)), f + ' still handles destroy_nest');
        }
        ok(!/"DESTROY"/.test(code('js/draw.js')), 'the DESTROY label survives');
    });

    check('and a stale job of that type does nothing', () => {
        // A follower carrying one from an older session must not go and bash a
        // nest the player can no longer order anyone at.
        const r = E.run(`(function(){
            const n = world.find(t => t.nest && t.nestZone === 1);
            n.nestHealth = 200;
            actors.length = 0; followers.length = 0;
            spawnFollowerAtCrystal('core');
            const f = followers[followers.length - 1];
            f.x = n.x; f.y = n.y + 0.4; f.job = { type: 'destroy_nest', target: n };
            for (let i = 0; i < 200; i++) { try { updateNPC(f); } catch (e) {} }
            return n.nestHealth;
        })()`);
        same(r, 200, 'a follower with a stale destroy order still damaged the nest');
    });

    check('the index no longer teaches it', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(!/LEFT radial command to assign followers to attack it/.test(HTML),
           'the index still tells the player to order followers at a nest');
        ok(!/permanently removes the spawn point/.test(HTML), 'nor that a long press removes it');
        ok(/Hack, don.t destroy|hack it/i.test(HTML), 'it does not say a nest is hacked instead');
    });

    // ─────────────────────────────────────────────────────
    group('NESTS LINK THEMSELVES: no CONNECT button');

    // REPORTED: "get rid of the connect to nest option and just automatically
    // connect whenever there is a connector or a pylon near it."
    //
    // Put a relay (generator or connector) `dist` tiles from `nestSel`, then let
    // the grid run: autoLinkRelays() inside recomputePower does the rest.
    const autoLink = (nestSel, dist, kind, opts) => E.run(`(function(){
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.isGenerator = false; t.isConnector = false; t.nestConnection = null; }
                             if (t.nest) t.connectedPylon = null; });
        const nest = ${nestSel};
        ${opts && opts.hostile ? 'nest.nestHealth = nest.nestMaxHealth || 200;' : "if (!isHomePortal(nest)) nest.nestHealth = 0;"}
        const cands = world.filter(t => t.type === 'floor' && t.y >= 0 && t.y <= 4 && !t.nest && !t.nodeType);
        cands.sort((a, b) => Math.abs(Math.hypot(a.x - nest.x, a.y - nest.y) - ${dist})
                           - Math.abs(Math.hypot(b.x - nest.x, b.y - nest.y) - ${dist}));
        const r = cands[0];
        Object.assign(r, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20, maxHealth: 20,
                           ${kind === 'connector' ? "isConnector: true, circuitOn: true" : "isGenerator: true"}, attackMode: true });
        floatingTexts.length = 0;
        _cacheAge = -999; render();
        return { linked: r.nestConnection === nest, back: nest.connectedPylon === r,
                 said: floatingTexts.map(t => t.text), d: Math.round(Math.hypot(r.x - nest.x, r.y - nest.y) * 10) / 10 };
    })()`);
    const HOME = 'world.find(t => isHomePortal(t))';
    const ZONE1 = 'world.find(t => t.nest && t.nestZone === 1)';

    check('THE ASK: a generator built beside home links to the CRYSTAL nest by itself', () => {
        const r = autoLink(HOME, 3, 'generator');
        ok(r.linked && r.back, 'it did not link both ways (' + r.d + ' tiles away)');
        ok(r.said.some(t => /LINKED TO NEST/.test(t)), 'nothing said it linked');
    });
    check('THE ASK: a connector next to a neutralised nest links to it by itself', () => {
        const r = autoLink(ZONE1, 3, 'connector');
        ok(r.linked && r.back, 'the connector did not link (' + r.d + ' tiles away)');
    });
    check('a relay out of reach of every nest links to nothing', () => {
        const r = autoLink(ZONE1, 9, 'generator');
        ok(!r.linked, 'it linked across ' + r.d + ' tiles');
    });
    check('a nest still spawning is not linked', () => {
        const r = autoLink(ZONE1, 3, 'generator', { hostile: true });
        ok(!r.linked, 'a hostile nest took a link');
    });
    check('CONNECT is gone from every layer', () => {
        const code = f => fs.readFileSync(path.join(ROOT, f), 'utf8')
            .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        for (const f of ['js/draw.js', 'js/input.js', 'js/commands.js', 'js/game.js', 'js/config.js'])
            ok(!/connect_nest|nestConnectMode|handleNestConnectTap|nestCanConnect/.test(code(f)), f + ' still has the manual link');
    });

    group('NEST MASS: a predator that dies carrying it gives it back');

    // The real death path, not the helper it calls: onPredatorDeath is what runs
    // when a carrier is killed, and a stockpile that vanished there would let a
    // predator take a lump out of play just by dying with it in its arms.
    check('THE REAL DEATH: a killed carrier drops its lump AND its own, both charged', () => {
        const r = E.run(`(function(){
            chargedMass.length = 0;
            const S = SPECIES['ant'];
            const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 12, 2);
            p.team = 'red'; p.speciesName = 'ant'; p.className = 'scout';
            p.shardDrop = 10;
            p.nestMass = 7;
            p._nestTarget = world.find(t => t.nest && !isHomePortal(t)) || null;
            onPredatorDeath(p);
            const lumps = chargedMass.map(m => ({ v: m.value, s: m.state }));
            return { lumps, target: p._nestTarget, carrying: p.nestMass || 0 };
        })()`);
        const values = r.lumps.map(l => l.v).sort((a, b) => a - b);
        same(values.join(','), '7,10', 'expected its own 10 and the 7 it carried, got ' + values);
        ok(r.lumps.every(l => l.s === 'charged'), 'a lump came back in the wrong state: ' + JSON.stringify(r.lumps));
        same(r.target, null, 'it still has a nest it is carrying to');
        same(r.carrying, 0, 'and it is still carrying');
    });

    check('a predator carrying nothing leaves just its own lump, as before', () => {
        const r = E.run(`(function(){
            chargedMass.length = 0;
            const S = SPECIES['ant'];
            const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 12, 2);
            p.team = 'red'; p.speciesName = 'ant'; p.className = 'scout'; p.shardDrop = 10;
            onPredatorDeath(p);
            return chargedMass.map(m => m.value);
        })()`);
        same(r.join(','), '10', 'a normal death changed: ' + r);
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
