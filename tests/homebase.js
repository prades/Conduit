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
        ok(/healing aura/i.test(HTML), 'nor the generator aura');
        ok(/network tier/i.test(HTML), 'nor that the tier multiplies it');
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

    check('a taken nest still offers CONNECT — only the destroy half went', () => {
        // The other nest order has to survive, or this removed too much.
        const r = leftButton(0, false);
        ok(r.labels.includes('CONNECT'), 'CONNECT is gone too: ' + r.labels);
        same(r.action, 'connect_nest', 'the left button does not connect');
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
    group('THE PORTAL CAN CONNECT: long hold the nest that says CRYSTAL');

    // REPORTED: "when you long hold on the nest at the home base, which says
    // crystal, you should be able to connect to a generator from that spot."
    //
    // CONNECT was offered only on a nest whose health had run out — a nest you
    // had TAKEN. The portal is never taken, it has always been yours, so the
    // order was simply never offered on it. And its long-press target was
    // excluded from the nest scan entirely (a radius around it would turn every
    // press in the base into a CONNECT), so there was nothing to offer it on.

    // Long hold at a screen point, then read what the radial's LEFT button says.
    const holdAt = (where) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { if (t.nest) { t.connectedPylon = null; } if (t.pillar) { t.nestConnection = null; } });
        buildMode = false; commandMode = false; nestConnectMode = false; pendingConnectNest = null;
        commandTarget = null; commandFollowerTarget = null; commandEnemyTarget = null;
        commandNestTarget = null; selectedRadialAction = null;
        const home = world.find(t => isHomePortal(t));
        player.x = home.x; player.y = 3;
        player.visualX = player.x; player.visualY = player.y;
        player.targetX = player.x; player.targetY = player.y;
        const p = homePortalScreenPos();
        const pt = ${where === 'on' ? '{ x: p.x, y: p.y }'
                    : where === 'beside' ? '{ x: p.x + 3 * TILE_W, y: p.y + 3 * TILE_H }'
                    : '{ x: p.x, y: p.y }'};
        handleLongHold(pt.x, pt.y);
        commandX = pt.x; commandY = pt.y;
        commandMode = true; dragDX = -RADIAL_RADIUS; dragDY = 0;         // held LEFT
        const labels = [];
        const orig = ctx.fillText.bind(ctx);
        ctx.fillText = (t, ...a) => { labels.push(String(t)); return orig(t, ...a); };
        drawRadialMenu();
        ctx.fillText = orig;
        return { target: commandNestTarget === home ? 'home'
                        : (commandNestTarget ? 'nest ' + commandNestTarget.nestZone : 'none'),
                 action: selectedRadialAction,
                 labels: labels.filter(t => /^[A-Z]{3,}$/.test(t)) };
    })()`);

    check('THE ASK: a long hold ON the portal offers CONNECT', () => {
        const r = holdAt('on');
        same(r.target, 'home', 'the press did not pick the home portal: ' + r.target);
        ok(r.labels.includes('CONNECT'), 'the radial does not offer CONNECT: ' + r.labels);
        same(r.action, 'connect_nest', 'and the left button is not wired to it');
    });

    check('...even with a pylon standing right beside it', () => {
        // The press snaps its target to any pylon within two tiles. A base is
        // built right at the portal, and with a pylon there the left button became
        // that pylon's SWITCH and CONNECT never came up.
        E.run(`(function(){
            const home = world.find(t => isHomePortal(t));
            const t = world.find(x => x.x === home.x && x.y === 0 && x.type === 'floor' && !x.nest);
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20,
                               maxHealth: 20, attackMode: true, attackModeElement: 'fire' });
            _cacheAge = -999;
        })()`);
        const r = holdAt('on');
        E.run(`world.forEach(t => { if (t.pillar && t.y === 0) t.pillar = false; })`);
        same(r.target, 'home', 'a neighbouring pylon took the press: ' + r.target);
        ok(r.labels.includes('CONNECT'), 'CONNECT was not offered beside a pylon: ' + r.labels);
    });

    check('a long hold NEAR the portal, but not on it, is left alone', () => {
        // The portal is picked by where the press lands, not by a radius: a base
        // is built right there, and every press within a few tiles of it turning
        // into a CONNECT would take SWITCH away from the whole home area.
        const r = holdAt('beside');
        ok(r.target !== 'home', 'a press three tiles away still picked the portal');
        ok(!r.labels.includes('CONNECT'), 'CONNECT is offered away from the portal: ' + r.labels);
    });

    // Run the order and tap a generator at `dist` tiles from home.
    const linkGen = (dist) => E.run(`(function(){
        const home = world.find(t => isHomePortal(t));
        holdAt_reset();
        function holdAt_reset() { world.forEach(t => { if (t.pillar) { t.pillar = false; t.isGenerator = false; t.nestConnection = null; } }); home.connectedPylon = null; }
        const cands = world.filter(t => t.type === 'floor' && t.y >= 0 && t.y <= 4 && !t.nest && !t.nodeType);
        cands.sort((a, b) => Math.abs(Math.hypot(a.x - home.x, a.y - home.y) - ${dist})
                           - Math.abs(Math.hypot(b.x - home.x, b.y - home.y) - ${dist}));
        const gen = cands[0];
        Object.assign(gen, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20,
                             maxHealth: 20, isGenerator: true, attackMode: true });
        _cacheAge = -999; render();
        floatingTexts.length = 0;
        commandNestTarget = home; selectedRadialAction = 'connect_nest';
        commandMode = true; executeCommand();
        const entered = !!nestConnectMode && pendingConnectNest === home;
        // Tap the generator where it is DRAWN, from the projection.
        const gx = (gen.x - player.visualX - (gen.y - player.visualY)) * TILE_W + canvas.width / 2;
        const gy = (gen.x - player.visualX + (gen.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
        const consumed = handleNestConnectTap(gx, gy - 30);
        return { entered, consumed,
                 linked: gen.nestConnection === home && home.connectedPylon === gen,
                 said: floatingTexts.map(t => t.text), stillPending: !!nestConnectMode,
                 d: Math.round(Math.hypot(gen.x - home.x, gen.y - home.y) * 10) / 10 };
    })()`);

    check('THE ASK: the order takes a generator beside home, and says HOME CONNECTED', () => {
        holdAt('on');
        const r = linkGen(3);
        same(r.entered, true, 'CONNECT did not start a link');
        same(r.linked, true, 'the generator was not linked to the home portal');
        ok(r.said.some(t => /HOME CONNECTED/.test(t)), 'it does not say what was connected: ' + r.said);
        ok(!r.said.some(t => /ZONE CONTROLLED/.test(t)), 'it called the portal a controlled zone');
    });

    check('a generator out of the portal\'s reach is refused, as for any nest', () => {
        holdAt('on');
        const r = linkGen(30);
        same(r.linked, false, 'a generator ' + r.d + ' tiles away was linked to home');
        ok(r.said.some(t => /TOO FAR/.test(t)), 'it did not say why: ' + r.said);
    });

    check('a taken nest still offers CONNECT, and a hostile one still does not', () => {
        // The shared test must not have widened or narrowed the existing rule.
        const r = E.run(`(function(){
            const n = world.find(t => t.nest && t.nestZone === 1);
            n.connectedPylon = null;
            n.nestHealth = n.nestMaxHealth || 200; const hostile = nestCanConnect(n);
            n.nestHealth = 0;                        const taken = nestCanConnect(n);
            n.connectedPylon = { destroyed: false }; const linked = nestCanConnect(n);
            n.connectedPylon = { destroyed: true };  const relink = nestCanConnect(n);
            n.connectedPylon = null;
            return { hostile, taken, linked, relink };
        })()`);
        same(r.hostile, false, 'a nest still spawning offers CONNECT');
        same(r.taken, true, 'a taken nest no longer offers CONNECT');
        same(r.linked, false, 'an already-linked nest offers it again');
        same(r.relink, true, 'a nest whose generator was destroyed cannot be re-linked');
    });

    check('the portal stops offering it once linked, and offers it again if the generator falls', () => {
        const r = E.run(`(function(){
            const home = world.find(t => isHomePortal(t));
            home.connectedPylon = { destroyed: false };   const live = nestCanConnect(home);
            home.connectedPylon = { destroyed: true };    const dead = nestCanConnect(home);
            home.connectedPylon = null;                   const none = nestCanConnect(home);
            return { live, dead, none };
        })()`);
        same(r.none, true, 'the portal does not offer CONNECT at all');
        same(r.live, false, 'and keeps offering it while linked');
        same(r.dead, true, 'a destroyed generator cannot be replaced');
    });

    // ─────────────────────────────────────────────────────
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
            const site = { x: 9, y: 3, mass: 0, incoming: 7 };
            p._nestSite = site;
            nestSites.push(site);
            onPredatorDeath(p);
            const lumps = chargedMass.map(m => ({ v: m.value, s: m.state }));
            nestSites.length = 0;
            return { lumps, incoming: site.incoming, carrying: p.nestMass || 0 };
        })()`);
        const values = r.lumps.map(l => l.v).sort((a, b) => a - b);
        same(values.join(','), '7,10', 'expected its own 10 and the 7 it carried, got ' + values);
        ok(r.lumps.every(l => l.s === 'charged'), 'a lump came back in the wrong state: ' + JSON.stringify(r.lumps));
        same(r.incoming, 0, 'the site still counts the dead predator as on its way');
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
