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
    group('THE HEALING AURA: tier is the multiplier');

    // One scene, rebuilt per tier: a generator, a pylon linked to it, a hurt
    // follower standing on the pylon and another just outside tier-1 reach.
    const aura = (tier, extra) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        const t = world.find(x => x.type === 'floor' && !x.pillar && !x.nest && !x.nodeType && x.x > 2);
        t.pillar = true; t.pillarTeam = 'green'; t.destroyed = false;
        t.health = 20; t.maxHealth = 20;
        t.attackMode = true; t.attackModeElement = 'fire';
        const g = world.find(x => x.type === 'floor' && !x.pillar && !x.nest && !x.nodeType && x.x > t.x + 1);
        g.pillar = true; g.pillarTeam = 'green'; g.destroyed = false;
        g.health = 20; g.maxHealth = 20; g.isGenerator = true; g.attackMode = true;
        _genLinks = [{ gen: g, pylon: t }];
        networkStrength['fire'] = ${tier};
        const mk = dx => { const a = { x: t.x + dx, y: t.y, team: 'green', isFollower: true,
                                       dead: false, health: 10, maxHealth: 100, moveSpeed: 0 };
                           actors.push(a); followers.push(a); return a; };
        const near = mk(0), edge = mk(2.1);
        const foe = { x: t.x, y: t.y, team: 'red', dead: false, health: 10, maxHealth: 100 };
        actors.push(foe);
        health = 50; player.x = t.x; player.y = t.y;
        ${extra || ''}
        const b = { near: near.health, edge: edge.health, foe: foe.health, player: health };
        for (let f = 0; f < GEN_AURA_INTERVAL * 10; f++) { frame++; generatorAuraTick(); }
        return { tier: ${tier},
                 near: +(near.health - b.near).toFixed(2),
                 edge: +(edge.health - b.edge).toFixed(2),
                 foe:  +(foe.health  - b.foe).toFixed(2),
                 player: +(health - b.player).toFixed(2) };
    })()`);

    check('THE ASK: a linked pylon heals the squad standing near it', () => {
        const r = aura(1);
        ok(r.near > 0, 'a follower on a linked pylon was not healed');
    });

    check('and the rate is multiplied by the network tier', () => {
        const t1 = aura(1), t2 = aura(2), t3 = aura(3);
        ok(t2.near > t1.near, `tier II healed ${t2.near}, no more than tier I's ${t1.near}`);
        ok(t3.near > t2.near, `tier III healed ${t3.near}, no more than tier II's ${t2.near}`);
        // Exactly proportional, not merely increasing.
        same(+(t2.near / t1.near).toFixed(2), 2, 'tier II should heal twice tier I');
        same(+(t3.near / t1.near).toFixed(2), 3, 'tier III should heal three times tier I');
    });

    check('and so is the REACH', () => {
        // The follower 2.1 tiles out is beyond tier I's radius and inside
        // tier II's — the aura grows, it does not just intensify.
        const t1 = aura(1), t2 = aura(2);
        same(t1.edge, 0, 'tier I reached a follower it should not have');
        ok(t2.edge > 0, 'tier II did not reach any further than tier I');
        ok(A.GEN_AURA_PER_TIER > 0, 'the radius no longer grows with tier at all');
    });

    check('an unnetworked linked pylon still mends, at the floor', () => {
        // Tier 0 is "not networked", and multiplying by it would make a linked
        // pylon worth nothing at all.
        const t0 = aura(0), t1 = aura(1);
        ok(t0.near > 0, 'a linked pylon with no network healed nothing');
        same(t0.near, t1.near, 'tier 0 should mend at the tier-1 floor');
    });

    check('it heals YOURS only — not the enemy standing on the same tile', () => {
        const r = aura(3);
        same(r.foe, 0, 'the aura healed a red unit');
    });

    check('and it heals the player, who is not in actors[]', () => {
        const r = aura(2);
        ok(r.player > 0, 'the player standing on a linked pylon was not healed');
    });

    check('THE WIRING: the frame actually calls it', () => {
        // Every other check calls generatorAuraTick() directly, so the aura
        // could be disconnected from the loop and they would all still pass.
        //
        // Three attempts to prove this by behaviour all failed to bite, and it
        // is worth saying why rather than quietly settling: a pre-existing
        // pillar heal and the pylon zone effects already mend a follower near a
        // green pylon (+12 on the tile, +24 two tiles out), so "did it gain
        // health" answers yes either way; and driving the same world twice to
        // subtract the difference does not work either, because the second run
        // starts from a world the first one has already moved on.
        //
        // So this is a source check, and says so. It proves the call is in
        // render(); the behaviour is proved by everything above it.
        const at = SRC.game.indexOf('function render()');
        ok(at > -1, 'render() could not be located');
        const call = SRC.game.indexOf('generatorAuraTick();', at);
        ok(call > -1, 'generatorAuraTick() is never called from the frame');
    });

    check('a pylon NOT linked to a generator emits nothing', () => {
        // The aura is what the generator buys. Without that it is just a free
        // heal on every pylon.
        const r = E.run(`(function(){
            actors.length = 0; followers.length = 0;
            _genLinks = [];
            const t = world.find(x => x.pillar && x.pillarTeam === 'green') || {};
            const a = { x: t.x, y: t.y, team: 'green', isFollower: true, dead: false,
                        health: 10, maxHealth: 100, moveSpeed: 0 };
            actors.push(a); followers.push(a);
            networkStrength['fire'] = 3;
            for (let f = 0; f < GEN_AURA_INTERVAL * 10; f++) { frame++; generatorAuraTick(); }
            return a.health - 10;
        })()`);
        same(r, 0, 'an unlinked pylon healed by ' + r);
    });

    check('a dead generator stops the aura', () => {
        const r = aura(3, 'g.health = 0; g.destroyed = true;');
        same(r.near, 0, 'a destroyed generator still powered the aura');
    });

    check('so does losing the pylon itself', () => {
        const r = aura(3, 't.health = 0;');
        same(r.near, 0, 'a dead pylon still emitted an aura');
    });

    check('an enemy-held pylon does not heal your squad', () => {
        const r = aura(3, "t.pillarTeam = 'red';");
        same(r.near, 0, 'a converted pylon still mended your side');
    });

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

    check('the reach is drawn from the same numbers it heals by', () => {
        // A ring that disagreed with the radius would be worse than no ring.
        ok(/GEN_AURA_RADIUS \+ GEN_AURA_PER_TIER \* \(tier - 1\)/.test(SRC.game),
           'the drawn reach is not computed from the aura constants');
        same((SRC.game.match(/GEN_AURA_RADIUS \+ GEN_AURA_PER_TIER \* \(tier - 1\)/g) || []).length, 2,
             'the heal and the ring should use the same expression, once each');
    });

    // ─────────────────────────────────────────────────────
    group('the index says so');

    check('the portal and the aura are documented', () => {
        ok(/HOME PORTAL/i.test(HTML), 'the index does not mention the home portal');
        ok(/healing aura/i.test(HTML), 'nor the generator aura');
        ok(/network tier/i.test(HTML), 'nor that the tier multiplies it');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
