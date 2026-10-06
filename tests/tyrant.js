// THE BROOD TYRANT FIGHT — docs/ROADMAP-top5.md §5.
//
// Three phases by health (hatch → burrow → enrage), a carapace that only an
// awake disruption pylon cracks open, a boss bar, and a trophy that lasts.
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

    // A fresh tyrant in the middle of its zone, at `hpFrac` of its health.
    const tyrant = (hpFrac) => run(`(function(){
        actors.length = 0; followers.length = 0; floatingTexts.length = 0; _wPylons = [];
        const [x0, x1] = _zoneSpan(GRUB_ZONE);
        const b = evolveGrub({ x: (x0 + x1) / 2, y: 2 });
        b.health = b.maxHealth * ${hpFrac}; b.spawnProtection = 0;
        globalThis.__t = b; return { hp: b.health, max: b.maxHealth, x: b.x };
    })()`);

    group('THE PHASES');

    await check('I above 66%, II above 33%, III below', () => {
        const r = run(`[1, 0.67, 0.65, 0.34, 0.32, 0.01].map(f => tyrantPhase({ health: f, maxHealth: 1 }))`);
        ok(JSON.stringify(r) === '[1,1,2,2,3,3]', JSON.stringify(r));
    });
    await check('THE ASK: crossing a threshold announces the new phase', () => {
        tyrant(0.6);
        const r = run(`(function(){ __t._burrowCd = 9999; broodTick(__t); return { ph: __t._phase, said: floatingTexts.map(t => t.text) }; })()`);
        ok(r.ph === 2 && r.said.some(t => /BURROWS/.test(t)), JSON.stringify(r));
    });
    await check('III: enraged — faster, and its melee comes round twice as fast', () => {
        tyrant(0.3);
        const r = run(`(function(){ const s0 = __t.moveSpeed; __t._burrowCd = 9999; broodTick(__t);
            __t.attackCooldown = 45; broodTick(__t);
            return { ph: __t._phase, speed: __t.moveSpeed / s0, cd: __t.attackCooldown, said: floatingTexts.map(t => t.text) }; })()`);
        ok(r.ph === 3 && Math.abs(r.speed - run('TYRANT_ENRAGE_SPEED')) < 1e-9, JSON.stringify(r));
        ok(r.cd <= run('TYRANT_ENRAGE_COOLDOWN'), 'cooldown ' + r.cd);
        ok(r.said.some(t => /ENRAGED/.test(t)), 'not announced');
    });
    await check('it hatches faster as the fight goes on', () => {
        const f = run('TYRANT_BROOD_FRAMES');
        ok(f[1] > f[2] && f[2] > f[3], JSON.stringify(f));
    });

    group('THE BURROW');

    await check('THE ASK: phase II burrows — untargetable by every path', () => {
        tyrant(0.6);
        const r = run(`(function(){ __t._phase = 2; __t._burrowCd = 1; const took = broodTick(__t);
            const h0 = __t.health; applyDamage(__t, 500, null);
            return { took, under: __t.untargetable, hostile: isHostileTarget(__t), lost: h0 - __t.health }; })()`);
        ok(r.took && r.under && !r.hostile && r.lost === 0, JSON.stringify(r));
        ok(/let bd2=actor\.hackOrder \? 2\.25 : 20\.25;[\s\S]{0,80}isHostileTarget\(a\)/.test(rd('js/npc.js')), 'followers on guard still target it');
        ok(/!a\.isClone && !a\.dead && !a\.untargetable/.test(rd('js/npc.js')), 'brawlers still chase it');
    });
    await check('and comes up under your nearest pylon in its zone, hurting it and everything of yours around it', () => {
        tyrant(0.6);
        const r = run(`(function(){
            const t = world.find(o => o.type === 'floor' && o.y === 2 && Math.abs(o.x - (__t.x + 3)) < 0.5 && !o.nest && !o.nodeType);
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 500, maxHealth: 500 });
            _pillarCache = [t];
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = t.x + 0.5; f.y = t.y; f.health = f.maxHealth = 500;
            __t._phase = 2; __t._burrowCd = 1;
            for (let i = 0; i < TYRANT_BURROW_FRAMES + 2; i++) { f.x = t.x + 0.5; f.y = t.y; broodTick(__t); }
            return { at: Math.hypot(__t.x - t.x, __t.y - t.y), pylon: 500 - t.health, unit: 500 - f.health, under: __t.untargetable };
        })()`);
        ok(r.at < 0.3, 'it came up ' + r.at + ' tiles from the pylon');
        ok(r.pylon === run('TYRANT_ERUPT_PYLON'), 'pylon took ' + r.pylon);
        ok(r.unit > 0, 'the follower beside it was not hurt');
        ok(r.under === false, 'still underground');
    });
    await check('phase I never burrows', () => {
        tyrant(0.9);
        const r = run(`(function(){ __t._burrowCd = 1; for (let i = 0; i < 5; i++) broodTick(__t); return !!__t.untargetable; })()`);
        ok(r === false, 'it burrowed in phase I');
    });

    group('THE CARAPACE');

    await check('THE ASK: it takes half damage — and 1.5× with a disruption pylon awake beside it', () => {
        tyrant(0.9);
        const r = run(`(function(){ __t._burrowCd = 9999;
            const hit = () => { __t.health = __t.maxHealth * 0.9; const h0 = __t.health; applyDamage(__t, 100, null); return h0 - __t.health; };
            broodTick(__t); const shut = hit();
            _wPylons = [{ x: __t.x + 1, y: __t.y, attackModeElement: 'fire', waveAwake: true }];
            broodTick(__t); const open = hit();
            _wPylons[0].waveAwake = false; broodTick(__t); const asleep = hit();
            _wPylons = [{ x: __t.x + 1, y: __t.y, attackModeElement: 'core', waveAwake: true }]; broodTick(__t); const support = hit();
            _wPylons = [];
            return { shut, open, asleep, support }; })()`);
        ok(Math.abs(r.shut - 100 * run('TYRANT_CARAPACE')) < 1e-6, 'carapace: ' + r.shut);
        ok(Math.abs(r.open - 100 * run('TYRANT_EXPOSED')) < 1e-6, 'exposed: ' + r.open);
        ok(Math.abs(r.asleep - r.shut) < 1e-6, 'an asleep pylon cracked it');
        ok(Math.abs(r.support - r.shut) < 1e-6, 'a support pylon cracked it');
    });

    group('THE BAR AND THE TROPHY');

    await check('a boss bar is drawn while it is near', () => {
        tyrant(0.5);
        const r = run(`(function(){ player.x = __t.x; const said = []; const keep = ctx.fillText; ctx.fillText = (t) => said.push(String(t));
            try { drawTyrantBar(); } finally { ctx.fillText = keep; } return said; })()`);
        ok(r.some(t => /BROOD TYRANT/.test(t)), JSON.stringify(r));
    });
    await check('THE ASK: killing it drops the TYRANT HEART — every pylon link reaches a tile further, for good', () => {
        const r = run(`(function(){ tyrantHeart = false; localStorage.removeItem(TYRANT_HEART_KEY); const before = getPylonRange();
            onTyrantDeath(__t); return { before, after: getPylonRange(), kept: localStorage.getItem(TYRANT_HEART_KEY), said: floatingTexts.map(t => t.text) }; })()`);
        ok(Math.abs(r.after - r.before - run('TYRANT_HEART_RANGE')) < 1e-9, JSON.stringify(r));
        ok(r.kept === '1', 'not kept');
        ok(r.said.some(t => /TYRANT HEART/.test(t)), 'not announced');
        ok(/if \(a\.isBrood && typeof onTyrantDeath === "function"\) onTyrantDeath\(a\);/.test(rd('js/game.js')), 'the death sweep does not call it');
        run(`tyrantHeart = false; localStorage.removeItem(TYRANT_HEART_KEY);`);
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
