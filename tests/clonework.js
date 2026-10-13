// CLONES — REPORTED: "Clones disappear after refresh. Make way for clone work
// abilities. We can plan them out one by one."
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

async function boot(store) {
    const ctx = vm.createContext(makeBrowserSandbox(store));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');
    return run;
}

(async () => {
    const store = { tubecrawler_seed: '305419896' };
    const run = await boot(store);
    ok(run('world.length') > 100, 'fixture: the world did not generate');

    group('THEY SURVIVE A REFRESH');

    await check('THE ASK: a clone you have is still there after a refresh — where it was, as hurt as it was', async () => {
        run(`(function(){
            const a = makeClone('beetle', 'striker', crystal.x + 5, 2); a.health = Math.round(a.maxHealth * 0.4);
            const b = makeClone('ant', 'scout', crystal.x + 3, 3);
            respawnQueue.push({ isClone: true, speciesName: 'mantis', className: 'tank', timer: 600, totalTimer: 1200 });
            saveSession(); })()`);
        const run2 = await boot(store);
        const r = run2(`(function(){ const cs = actors.filter(a => a.isClone && a.team === 'green' && !a.dead);
            const q = respawnQueue.filter(e => e.isClone);
            const be = cs.find(c => c.speciesName === 'beetle');
            return { n: cs.length, species: cs.map(c => c.speciesName + '.' + c.className).sort(), hp: be ? be.health / be.maxHealth : null,
                     at: be ? [Math.round(be.x - crystal.x), Math.round(be.y)] : null, power: be ? be.power : 0,
                     queue: q.map(e => e.speciesName + ':' + e.timer) }; })()`);
        ok(r.n === 2, 'clones after the refresh: ' + JSON.stringify(r));
        ok(JSON.stringify(r.species) === JSON.stringify(['ant.scout', 'beetle.striker']), JSON.stringify(r.species));
        ok(Math.abs(r.hp - 0.4) < 0.02, 'its health came back as ' + r.hp);
        ok(JSON.stringify(r.at) === '[5,2]', 'it came back at ' + JSON.stringify(r.at));
        // (boot runs one frame, so its countdown has moved on by one)
        ok(r.queue.length === 1 && /^mantis:(599|600)$/.test(r.queue[0]), 'the clone on its way back was lost: ' + JSON.stringify(r.queue));
        ok(r.power > 0, 'it came back without its power');
    });
    await check('they come back as real clones (makeClone: the multipliers, ours, green)', () => {
        ok(/const k = makeClone\(c\.sp, c\.cl \|\| "scout", x, y\);/.test(rd('js/save.js')), 'not built by makeClone');
    });

    group('CLONE WORK — THE FRAMEWORK');

    await check('THE ASK: a clone can be put to work — long-press it: TO WORK, TO LINE, or NO JOB YET', () => {
        const D = rd('js/draw.js'), I = rd('js/input.js');
        ok(/"TO LINE" : job \? "TO WORK" : "NO JOB YET"/.test(D), 'the clone ring has no work button');
        ok(/if \(_f\.isClone\) selectedRadialAction = "clone_duty"/.test(I), 'the tap does not reach it');
        ok(/case "clone_duty":/.test(rd('js/commands.js')), 'the button does nothing');
        ok(run(`(function(){ const c = actors.find(a => a.isClone); return _pickableAllies().includes(c); })()`), 'a clone cannot be long-pressed');
    });
    await check('with no job for its species it says so and stays a fighter', () => {
        const r = run(`(function(){ for (const k in CLONE_JOBS) delete CLONE_JOBS[k];
            const c = actors.find(a => a.isClone && !a.dead); const ok = toggleCloneDuty(c); return { ok, duty: c.duty || null }; })()`);
        ok(!r.ok && r.duty === null, JSON.stringify(r));
    });
    await check('a job is one entry in CLONE_JOBS: it runs while working and the clone\'s own AI waits', () => {
        const r = run(`(function(){
            let ticks = 0;
            CLONE_JOBS.ant = { label: 'TEST', note: 'a test job', tick(c) { ticks++; c.cloneWork.n = (c.cloneWork.n || 0) + 1; return true; } };
            const c = actors.find(a => a.isClone && a.speciesName === 'ant' && !a.dead);
            const on = toggleCloneDuty(c); const x0 = c.x;
            for (let i = 0; i < 10; i++) updateNPC(c);
            const label = cloneDutyLabel(c);
            toggleCloneDuty(c);
            for (let i = 0; i < 5; i++) updateNPC(c);
            delete CLONE_JOBS.ant;
            return { on, ticks, label, duty: c.duty || null }; })()`);
        ok(r.on && r.ticks === 10, 'the job did not run each frame: ' + JSON.stringify(r));
        ok(r.label === 'WORKER: TEST', r.label);
        ok(r.duty === null, 'TO LINE did not stop it');
    });
    await check('the duty survives a refresh', async () => {
        run(`(function(){ CLONE_JOBS.beetle = { label: 'T', note: '', tick() { return false; } };
            const c = actors.find(a => a.isClone && a.speciesName === 'beetle' && !a.dead); toggleCloneDuty(c); saveSession(); })()`);
        const saved = JSON.parse(store.tubecrawler_session).clones.find(c => c.sp === 'beetle');
        ok(saved && saved.duty === 'worker', 'the save does not carry the duty: ' + JSON.stringify(saved));
        // A fresh game with the job defined, restoring that save.
        const run2 = await boot(store);
        const d = run2(`(function(){ CLONE_JOBS.beetle = { label: 'T', note: '', tick() { return false; } };
            for (const a of actors) if (a.isClone) a.dead = true;
            restoreClones(JSON.parse(localStorage.getItem('tubecrawler_session')).clones, []);
            const c = actors.find(a => a.isClone && a.speciesName === 'beetle' && !a.dead); return c ? c.duty : 'none'; })()`);
        ok(d === 'worker', 'duty after refresh: ' + d);
    });

    group('BEETLE: HAULER');

    await check('THE ASK: a beetle clone at work carries several neutralised lumps at once and pays them in at the Crystal', async () => {
        const runB = await boot({ tubecrawler_seed: '305419896' });
        const r = runB(`(function(){
            actors.length = 0; chargedMass.length = 0;
            const b = makeClone('beetle', 'striker', crystal.x + 6, 2);
            const lumps = [0, 1, 2, 3].map(i => { const m = spawnChargedMass(crystal.x + 7 + i * 0.6, 2 + (i % 2), 10); m.state = MASS_STATE.NEUTRAL; return m; });
            const job = toggleCloneDuty(b);
            const s0 = shardCount; let most = 0;
            for (let f = 0; f < 3000 && chargedMass.length; f++) {
                gameState.running = true; crystal.health = crystal.maxHealth;
                updateNPC(b); updateChargedMass();
                most = Math.max(most, chargedMass.filter(m => m.carrier === b).length);
            }
            return { job, label: cloneDutyLabel(b), most, left: chargedMass.length, paid: shardCount - s0, load: BEETLE_HAUL_LOAD }; })()`);
        ok(r.job && r.label === 'WORKER: HAUL', JSON.stringify(r));
        ok(r.most === r.load, 'it never carried a full load of ' + r.load + ': ' + JSON.stringify(r));
        ok(r.left === 0 && r.paid === 40, 'not all of it was paid in: ' + JSON.stringify(r));
    });
    await check('killed on the way, it drops what it carries where it fell', async () => {
        const runB = await boot({ tubecrawler_seed: '305419896' });
        const r = runB(`(function(){
            actors.length = 0; chargedMass.length = 0;
            const b = makeClone('beetle', 'striker', crystal.x + 9, 2);
            for (let i = 0; i < 2; i++) { const m = spawnChargedMass(crystal.x + 9.2, 2, 10); m.state = MASS_STATE.NEUTRAL; }
            toggleCloneDuty(b);
            for (let f = 0; f < 20; f++) { updateNPC(b); updateChargedMass(); }
            const held = chargedMass.filter(m => m.carrier === b).length;
            b.dead = true; updateChargedMass();
            return { held, dropped: chargedMass.filter(m => m.state === MASS_STATE.NEUTRAL && !m.carrier).length }; })()`);
        ok(r.held === 2 && r.dropped === 2, JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
