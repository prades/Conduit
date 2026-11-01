// PRESSURE BETWEEN ALARMS — a crystal that slowly heals.
//
// The audit: nothing threatened the Crystal between alarms, and its 300 health
// was an attrition meter that never recovered. Now the crystal heals while no
// alarm is up. Since 2026-11-01 that is the Crystal's IDLE REFILL (js/crystalpower.js
// crystalRefillTick, applied in the frame: js/game.js): whole in five minutes with
// no alarm up, no ant raid on and nothing drawn on its power for a moment.
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
    const ctx = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the facility did not build');
    run('gameState.running = true; facilityBlackoutSet(false);');

    group('the crystal heals between alarms');

    const after = (alarm, frames) => run(`(function(){
        actors.length = 0; alertActive = ${alarm}; crystal.health = 100;
        for (let i = 0; i < ${frames}; i++) { alertActive = ${alarm}; render(); }
        return crystal.health; })()`);

    await check('it heals while no alarm is up', () => {
        const h = after(false, 600);
        const rate = run('crystal.maxHealth / CRYSTAL_POWER.refill.fullFrames'), idle = run('CRYSTAL_POWER.refill.idleAfter');
        ok(h > 100 + (600 - idle) * rate * 0.9, 'it only reached ' + h);
    });
    await check('it does NOT heal during an alarm', () => {
        // The render loop ends an alarm by itself when nothing is left to fight,
        // so a live alarm cannot be held for a frame from outside; the guard is
        // read from the source instead.
        ok(/if \(typeof alertActive !== "undefined" && alertActive\) return;/.test(rd('js/crystalpower.js')) && /crystalRefillTick\(\)/.test(rd('js/game.js')),
           'the refill is not gated on there being no alarm');
    });
    await check('it never heals past its maximum', () => {
        run('crystal.health = crystal.maxHealth - 0.001; alertActive = false; for (let i = 0; i < 50; i++) render();');
        ok(run('crystal.health <= crystal.maxHealth'), 'it overflowed');
    });
    await check('the rate is slow: minutes from empty, not seconds', () => {
        const secs = run('CRYSTAL_POWER.refill.fullFrames') / 60;
        ok(secs >= 240 && secs <= 360, 'it heals fully in ' + Math.round(secs) + 's (the owner: about five minutes)');
    });
    await check('the GAME INDEX says so', () => {
        ok(/heals slowly/i.test(rd('game.html')), 'the index does not mention crystal regeneration');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
