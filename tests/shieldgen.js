// THE SHIELD GENERATOR — "replace the generator with shield generator ... a
// little bit thicker of a pylon ... a giant light coloured orb ... it starts
// creating shields for all the followers, and the shields take 100% of damage
// whenever the shield is active ... until the shield breaks and then the
// enemies are attacking their health directly."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');

    // A shield generator by home, a follower `d` tiles from it, `ticks` charges.
    const field = (d, ticks, extra) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.attackModeElement = null; } if (t.nest) t.nestEnergy = undefined; });
        shardCount = 999; const home = world.find(t => isHomePortal(t));
        const g = world.find(o => o.type === 'floor' && o.x === home.x + 1 && o.y === 2 && !o.nest && !o.nodeType);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g); _cacheAge = -999; render();
        spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
        f.x = g.x + ${d}; f.y = g.y; f.shielded = false; f.shieldAmount = 0; f._shieldMax = 0; f._shieldHitAt = undefined;
        const foe = { x: g.x + ${d}, y: g.y + 0.2, team: 'red', dead: false, health: 100, maxHealth: 100 }; actors.push(foe);
        ${extra || ''}
        const e0 = nestEnergy(home);
        for (let i = 0; i < ${ticks}; i++) { frame = (Math.floor(frame / SHIELD_GEN_INTERVAL) + 1) * SHIELD_GEN_INTERVAL; f.x = g.x + ${d}; f.y = g.y; shieldFieldTick(); }
        globalThis.__f = f; globalThis.__g = g;
        return { sh: f.shielded ? f.shieldAmount : 0, cap: Math.max(SHIELD_GEN_MIN, Math.round(f.maxHealth * SHIELD_GEN_SHARE)), foe: !!foe.shielded, spent: e0 - nestEnergy(home) };
    })()`);

    group('THE FIELD');

    await check('THE ASK: it builds a shield on a follower near it, up to its cap', () => {
        const one = field(1, 1), full = field(1, 60);
        ok(one.sh === run('SHIELD_GEN_RATE'), 'one charge gave ' + one.sh);
        ok(full.sh === full.cap, `charged to ${full.sh}, cap ${full.cap}`);
    });
    await check('not out of reach, not on an enemy', () => {
        const r = field(run('SHIELD_GEN_RANGE') + 1, 20);
        ok(r.sh === 0, 'shielded out of reach: ' + r.sh);
        ok(!field(1, 20).foe, 'an enemy got a shield');
    });
    await check('switched off, or with no nest feeding it, it builds nothing', () => {
        ok(field(1, 20, 'g.circuitOn = false;').sh === 0, 'an OFF shield generator still shields');
        ok(field(1, 20, "world.filter(t => t.nest).forEach(n => { n.powerOff = true; });").sh === 0, 'a shield generator with no nest power still shields');
        run("world.filter(t => t.nest).forEach(n => { n.powerOff = false; });");
    });
    await check('each point of shield costs a little nest power', () => {
        const r = field(1, 4);
        ok(r.spent > 0, 'it cost nothing');
    });

    group('THE SHIELD');

    await check('THE ASK: while it holds, a hit takes NOTHING off health', () => {
        field(1, 60);
        const r = run(`(function(){ const h0 = __f.health, s0 = __f.shieldAmount; applyDamage(__f, 5, { team: 'red' });
            return { health: h0 - __f.health, shield: s0 - __f.shieldAmount }; })()`);
        ok(r.health === 0 && r.shield === 5, JSON.stringify(r));
    });
    await check('THE ASK: once it breaks, they take damage directly', () => {
        field(1, 60);
        const r = run(`(function(){ __f.health = __f.maxHealth = 1000; applyDamage(__f, 999, { team: 'red' }); const broke = !__f.shielded;
            const h0 = __f.health; applyDamage(__f, 10, { team: 'red' }); return { broke, lost: h0 - __f.health }; })()`);
        ok(r.broke && r.lost > 0, JSON.stringify(r));
    });
    await check('after a hit it waits before charging again', () => {
        field(1, 60);
        const r = run(`(function(){ applyDamage(__f, 999, { team: 'red' });
            frame = (Math.floor(frame / SHIELD_GEN_INTERVAL) + 1) * SHIELD_GEN_INTERVAL; shieldFieldTick(); const soon = __f.shielded ? __f.shieldAmount : 0;
            frame += SHIELD_GEN_DELAY + SHIELD_GEN_INTERVAL; frame = Math.floor(frame / SHIELD_GEN_INTERVAL) * SHIELD_GEN_INTERVAL; shieldFieldTick();
            return { soon, later: __f.shielded ? __f.shieldAmount : 0 }; })()`);
        ok(r.soon === 0 && r.later > 0, JSON.stringify(r));
    });

    group('THE LOOK');

    await check('THE ASK: a thicker body and a big pale orb; called SHIELD GENERATOR', () => {
        ok(run('GENERATOR_LABEL') === 'SHIELD GENERATOR', run('GENERATOR_LABEL'));
        ok(/else if \(obj\.isGenerator && !obj\.destroyed\) \{[\s\S]{0,140}drawShieldGenerator\(/.test(rd('js/game.js')), 'the generator is still drawn as a tower');
        const r = run(`(function(){ const calls = { arcs: 0, maxR: 0 }; const keep = ctx.arc; ctx.arc = (x, y, r) => { calls.arcs++; calls.maxR = Math.max(calls.maxR, r); };
            try { drawShieldGenerator(300, 300, true, 0.5); } finally { ctx.arc = keep; } return calls; })()`);
        ok(r.maxR >= 11, 'the orb is not big: radius ' + r.maxR);
    });
    await check('a shielded follower shows it: a bubble and a blue bar', () => {
        field(1, 60);
        const r = run(`(function(){ let ell = 0, blue = 0; const keepE = ctx.ellipse, keepF = ctx.fillRect;
            ctx.ellipse = () => { ell++; }; ctx.fillRect = function () { if (ctx.fillStyle === '#3af' || ctx.fillStyle === '#33aaff') blue++; };
            try { _drawFollowerShield(__f, 300, 300, ctx); } finally { ctx.ellipse = keepE; ctx.fillRect = keepF; } return { ell, blue }; })()`);
        ok(r.ell >= 1 && r.blue >= 1, JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
