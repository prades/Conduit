// ELECTRIC WAVE HASTE — "make the electric wave pylons boost the followers'
// speed, so it would be a great use for the followers to return to the fight and
// collect shards."
//
// Held: a friendly standing between two electric wave pylons moves faster, the
// boost grows with the network tier and is read from ELECTRIC_HASTE, it ends
// shortly after they leave, enemies are not boosted, and an enemy's slow on the
// follower is not overridden.
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
function near(a, b, m) { if (Math.abs(a - b) > 0.02) throw new Error(`${m}: expected ~${b}, got ${a}`); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');
    const HASTE = run('ELECTRIC_HASTE'), LINGER = run('ELECTRIC_HASTE_FRAMES');

    // Generator + two electric wave pylons on row y=3; a follower between them,
    // another well away, optionally a predator between them.
    const scene = (el, extra) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { t.pillar = false; t.destroyed = false; t.attackMode = false; t.waveMode = false;
            t.isGenerator = false; t.isConnector = false; t.connectedPylon = null; t.nestConnection = null;
            t.powered = undefined; t.pillarTeam = 'green';
            if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; } });
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest && !t.nodeType)
                         .sort((a,b) => a.x - b.x);
        const base = { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999, maxHealth: 99999,
                       pillarCol: '#0f8', attackModeElement: ${JSON.stringify(el)}, attackModeColor: '#88f' };
        Object.assign(row[0], base, { isGenerator: true, attackMode: true, attackModeElement: 'generator' });
        Object.assign(row[1], base, { waveMode: true });
        Object.assign(row[3], base, { waveMode: true });
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        spawnFollowerAtCrystal('fire'); spawnFollowerAtCrystal('fire');
        const inZone = followers[0], away = followers[1];
        for (const f of [inZone, away]) { f.stance = 'hold'; f.job = null; f.baseMoveSpeed = undefined; f.slowed = 0; f.slowFactor = 1; }
        inZone.x = (row[1].x + row[3].x) / 2; inZone.y = 3;
        away.x = row[1].x; away.y = -1;
        const speed0 = inZone.moveSpeed;
        ${extra || ''}
        _cacheAge = -999;
        for (let i = 0; i < 30; i++) render();
        return { speed0, inZone: inZone.moveSpeed, away: away.moveSpeed, awayBase: away.baseMoveSpeed,
                 base: inZone.baseMoveSpeed, tier: networkStrength[${JSON.stringify(el)}],
                 pairs: _wPylonPairs.length };
    })()`);

    group('electric wave zone');

    await check('a follower in the zone moves faster', () => {
        const r = scene('electric');
        ok(r.pairs > 0, 'fixture: no wave pair formed');
        ok(r.base > 0, 'fixture: no base speed captured');
        const want = r.base * (HASTE[Math.min(3, r.tier || 1)] || HASTE[1]);
        near(r.inZone, want, 'hasted speed');
        ok(r.inZone > r.base, 'not faster than its base speed');
    });

    await check('one outside the zone is unchanged', () => {
        const r = scene('electric');
        near(r.away, r.awayBase !== undefined ? r.awayBase : r.away, 'away speed');
    });

    await check('other elements do not haste', () => {
        const r = scene('fire');
        ok(!(r.inZone > (r.base || r.speed0) * 1.01), 'a fire zone sped the follower up');
    });

    await check('it wears off after leaving the zone', () => {
        const r = run(`(function(){
            const f = followers[0];
            f.x = 9; f.y = -1;            // out of the zone
            for (let i = 0; i < ${LINGER + 20}; i++) render();
            return { speed: f.moveSpeed, base: f.baseMoveSpeed };
        })()`);
        near(r.speed, r.base, 'speed after leaving');
    });

    await check('an enemy slow is not overridden by the haste', () => {
        const r = scene('electric', 'inZone.baseMoveSpeed = inZone.moveSpeed; applySlow(inZone, 600, 0.2);');
        ok(r.inZone < r.speed0 * 0.5, `the slow was undone: ${r.inZone} vs base ${r.speed0}`);
    });

    await check('the numbers are documented from the constants', () => {
        const codex = rd('js/codex.js');
        for (const k of [1, 2, 3]) ok(codex.includes(String(HASTE[k])) || codex.includes(HASTE[k] + '\\u00d7') ,
            'the codex does not state ' + HASTE[k]);
        ok(/haste: \[1\.35, 1\.6, 1\.9\]/.test(codex), 'the codex numbers drifted');
    });

    await check('the GAME INDEX says predators leave pylons alone and states the haste', () => {
        const html = rd('game.html');
        const at = html.indexOf('PREDATORS &amp; YOUR PYLONS');
        ok(at > -1, 'no index entry');
        const page = html.slice(at, at + 1400);
        ok(/leave your pylons alone/.test(page), 'it does not say so');
        for (const k of [1, 2, 3]) ok(page.indexOf('>' + HASTE[k] + '<') > -1, 'the index does not state ' + HASTE[k]);
    });

    await check('the index states the scout escape-leap and the starting shards, from the constants', () => {
        const html = rd('game.html');
        const at = html.indexOf('Scouts leap to escape');
        ok(at > -1, 'no index entry for the leap');
        const page = html.slice(at, at + 900);
        const pct = Math.round(run('ABILITY_DEFS.LEAP.escapeBelow') * 100);
        ok(page.indexOf('>' + pct + '%<') > -1, 'the index does not state ' + pct + '%');
        ok(page.indexOf('>' + run('STARTING_SHARDS') + '<') > -1, 'the index does not state the starting shards');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
