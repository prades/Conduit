// THE CLONES TAB GIVES DUTIES, the way the follower rows do.
//
// THE REPORTED CASE: "Unable to give clones duties in the little hud menu.
// Please make it accessible like it is for followers."
//
// Holding an element row in the HUD index opens TO WORK / TO LINE for that
// whole group; the CLONES tab was "not a duty group" and a hold there did
// nothing. Now a clone row is its species: hold it, and the same menu orders
// every clone of that species to its job (CLONE_JOBS) or back to the line.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; 
         actors = actors.filter(a => !a.isClone);
         makeClone('ant', 'scout', crystal.x + 3, 2); makeClone('ant', 'striker', crystal.x + 4, 2);
         makeClone('beetle', 'scout', crystal.x + 5, 2);
         uiTab = 'clones'; followerPoolMinimized = false;`);
    // Where a row is, by the panel's own arithmetic.
    const rowXY = i => run(`(function(){ const n = actors.filter(a => a.isClone && !a.dead).length;
        const rh = Math.floor(_UI_CONTENT_H / Math.min(n, 6));
        return { x: _UI_X + 20, y: _panelY() + _UI_TAB_H + ${i} * rh + rh / 2 }; })()`);
    // Press the menu's TO WORK (0) or TO LINE (1) button.
    const press = which => run(`(function(){ drawFollowerDutyMenu(); const m = followerDutyMenu, b = m._btn;
        const x = ${which} === 0 ? m.x + 6 + b.bw / 2 : m.x + 12 + b.bw * 1.5;
        return handleFollowerDutyMenuTap(x, b.by + _DUTY_BTN_H / 2); })()`);
    const workers = sp => run(`actors.filter(a => a.isClone && !a.dead && a.speciesName === '${sp}' && a.duty === 'worker').length`);

    console.log('\nTHE CLONES TAB');
    check('THE ASK: holding a clone row opens the duty menu', () => {
        const p = rowXY(0);
        ok(run(`openFollowerDutyMenu(${p.x}, ${p.y})`), 'the hold was not taken as a duty menu');
        same(run('followerDutyMenu.group.kind'), 'clones', 'menu group');
        same(run('followerDutyMenu.group.id'), 'ant', 'the row stands for its species');
        same(run('dutyGroupMembers(followerDutyMenu.group).length'), 2, 'ant clones in the group');
    });
    check('THE ASK: TO WORK puts every clone of that species on its job', () => {
        ok(press(0), 'the tap was not the menu\'s');
        same(workers('ant'), 2, 'ant clones working');
        same(workers('beetle'), 0, 'and the beetle, another species, was left alone');
        ok(run(`actors.filter(a => a.isClone && a.speciesName === 'ant').every(a => a.cloneWork)`), 'no work state was set up');
    });
    check('TO LINE brings them back', () => {
        const p = rowXY(0);
        run(`openFollowerDutyMenu(${p.x}, ${p.y})`);
        press(1);
        same(workers('ant'), 0, 'ant clones still working');
    });
    check('a species with no job yet says so and changes nothing', () => {
        run(`actors.filter(a => a.isClone).forEach(a => { a.dead = true; }); actors = actors.filter(a => !a.isClone);
             makeClone('mantis', 'scout', crystal.x + 3, 2);`);
        const hasJob = run(`!!CLONE_JOBS.mantis`);
        if (hasJob) { console.log('         (mantis has a job now — skipped)'); return; }
        const p = rowXY(0);
        run(`openFollowerDutyMenu(${p.x}, ${p.y})`);
        const n0 = run('floatingTexts.length');
        press(0);
        same(workers('mantis'), 0, 'mantis clones working');
        ok(run(`floatingTexts.slice(${n0}).some(t => /NO JOB YET/.test(t.text))`), 'it did not say why');
    });
    check('the element rows still work as before', () => {
        run(`uiTab = 'elements'; unlockedElements = new Set(ELEMENTS.map(e => e.id));`);
        const y = run(`_panelY() + _UI_TAB_H + ELEMENTS.findIndex(e => e.id === 'toxic') * _UI_ROW_H + 5`);
        ok(run(`openFollowerDutyMenu(_UI_X + 20, ${y})`), 'an element row no longer opens the menu');
        same(run('followerDutyMenu.group.kind'), 'element', 'menu group');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
