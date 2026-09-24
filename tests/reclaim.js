// RECLAIM, and who may upgrade what.
//
// TWO REPORTED CASES: "I'm unable to reclaim pylons after the first level or
// really maybe even first round." And: "I should not be able to upgrade enemy
// pylons and make them my own."
//
// THE RECLAIM. Three separate defects, all of them silent, found by driving
// issueReconstruct against six different squads:
//
//   1. The crew was drawn from followerByElement[player.selectedElement] and
//      nowhere else, so RECLAIM depended on which element TAB was open. In the
//      first round that is invisible — you start on fire and your first
//      recruits are fire. After that the Crystal's modulation hands out
//      something else, the pool comes back empty, and RECLAIM does nothing for
//      the rest of the game.
//
//   2. `!a.job` excluded a follower holding a standing POSITION order. A post
//      is not a task and never finishes, so positioning your squad benched it
//      from reclaiming permanently — the same bug that used to stop a
//      positioned follower taking a work duty.
//
//   3. The worst one. A reclaim whose crew was killed left `reconstructing`
//      set with the progress frozen, and `if (pylon.reconstructing) return`
//      then refused every retry. One interrupted attempt and that pylon could
//      NEVER be reclaimed again. Losing the crew is the ordinary way a reclaim
//      ends, so this was reachable in the first fight of the first round.
//
// Every one of them returned without a word, which is why it read as a dead
// button rather than as a refusal.
//
// THE UPGRADE. _executeUpgrade set attackMode, attackModeElement and
// attackModeColor and never touched pillarTeam — and the attack-pylon and
// wave-pylon passes do not filter by team. So upgrading a converted pylon
// turned it into a working turret of yours that still counted as theirs, and
// it handed the pylon back without the RECLAIM it is supposed to cost. That
// reclaim is the whole counter to the infestation.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    commands: fs.readFileSync(path.join(ROOT, 'js/commands.js'), 'utf8'),
    draw:     fs.readFileSync(path.join(ROOT, 'js/draw.js'),     'utf8'),
};

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
    run(`gameState.running = true; gameState.phase = 'day'; gameState.nightNumber = 1; shardCount = 9999;`);
    run(`for (let i = 0; i < 3 * ZONE_LENGTH; i++) { try { generateSegment(i); } catch(e) {} }`);
    return { run, sandbox };
}

(async () => {
    const R = await ready();

    // One world, reset per scenario. `setup` builds the squad, `after` runs
    // once the reclaim has been issued. check() is synchronous and drops a
    // returned promise, so nothing here may be async.
    const scene = (setup, after) => R.run(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        floatingTexts.length = 0;
        buildMode = false; commandTarget = null; selectedRadialAction = null;
        elementPickerOpen = false; elementPickerMode = null; elementPickerTarget = null;
        const t = world.find(x => x.type === 'floor' && !x.pillar && !x.nest && !x.nodeType);
        t.pillar = true; t.pillarTeam = 'red'; t.pillarCol = '#f34';
        t.health = 20; t.maxHealth = 20; t.destroyed = false;
        t.reconstructing = false; t.reconstructProgress = 0; t.workers = [];
        t.attackMode = false; t.waveMode = false; t.attackModeElement = null;
        t.pendingUpgrade = false; t.chosenElement = null;
        player.x = t.x; player.y = t.y - 1;
        player.selectedElement = 'fire';
        _cacheAge = -999;
        ${setup}
        ${after || 'issueReconstruct(t);'}
        return {
            reconstructing: !!t.reconstructing,
            crew: (t.workers || []).filter(a => a && !a.dead).length,
            said: floatingTexts.map(f => f.text),
            team: t.pillarTeam,
            attackMode: !!t.attackMode,
            element: t.attackModeElement,
            pending: !!t.pendingUpgrade,
            chosen: t.chosenElement,
            picker: !!elementPickerOpen,
            onJob: followers.filter(a => a.job && a.job.type === 'reconstruct').length,
        };
    })()`);
    const squad = (el, n) => `for (let i = 0; i < ${n || 3}; i++) spawnFollowerAtCrystal('${el}');`;

    // ─────────────────────────────────────────────────────
    group('RECLAIM: who gets sent');

    check('the first round works — squad matches the element tab', () => {
        // The case that always worked, and the reason this went unnoticed.
        const r = scene(squad('fire'));
        same(r.reconstructing, true, 'it should start');
        ok(r.crew > 0, 'and pledge a crew');
    });

    check('THE REPORTED CASE: the squad is ICE and the tab still says FIRE', () => {
        // After the first round the Crystal's modulation decides the element,
        // so this is the NORMAL state, not an edge case.
        const r = scene(squad('ice'));
        same(r.reconstructing, true, 'it should still reclaim with a mismatched squad');
        ok(r.crew > 0, 'a crew should have been pledged, got ' + r.crew);
        same(r.onJob, r.crew, 'the crew should actually be on the job');
    });

    check('no element on the map matches the tab at all', () => {
        const r = scene(squad('toxic', 2) + squad('core', 2));
        same(r.reconstructing, true, 'it should reclaim with whoever is free');
        ok(r.crew > 0, 'got no crew');
    });

    check('the matching element is still PREFERRED when there is one', () => {
        // Falling back to anyone must not stop it using the right follower
        // first — the tab is what the player is looking at.
        const r = R.run(`(function(){
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            player.selectedElement = 'fire';
            spawnFollowerAtCrystal('ice');
            spawnFollowerAtCrystal('fire');
            spawnFollowerAtCrystal('ice');
            const crew = reclaimCrew();
            return { n: crew.length, elements: crew.map(a => a.element) };
        })()`);
        same(r.n, 1, 'it should take the one matching follower, not everyone');
        same(r.elements.join(','), 'fire', 'and it should be the fire one');
    });

    check('a follower on a standing POSITION order can still be sent', () => {
        const r = scene(squad('fire') +
            `followers.forEach(f => { f.job = { type: 'move', target: { x: 1, y: 1 } }; f.stance = 'hold'; });`);
        same(r.reconstructing, true, 'a positioned squad should still reclaim');
        ok(r.crew > 0, 'got no crew');
        same(r.onJob, r.crew, 'the post should have been released for the job');
    });

    check('but a follower mid-TASK is left to finish it', () => {
        // A real task completes on its own; cancelling a build would leave a
        // pylon constructing with no builder.
        const r = scene(squad('fire') +
            `followers.forEach(f => { f.job = { type: 'build_pylon', target: { x: 1, y: 1 } }; });`);
        same(r.reconstructing, false, 'it should not conscript a busy builder');
        ok(r.said.some(s => /NO FOLLOWER FREE/.test(s)), 'and should say why: ' + JSON.stringify(r.said));
    });

    check('a dead squad is refused, out loud', () => {
        const r = scene(squad('fire') + `followers.forEach(f => { f.dead = true; });`);
        same(r.reconstructing, false, 'corpses cannot reclaim anything');
        same(r.crew, 0, 'nor be pledged as a crew');
        ok(r.said.length > 0, 'it must not fail silently');
    });

    check('and a corpse is never picked while a live follower exists', () => {
        // The all-dead case above is caught by an earlier guard, so it passes
        // even with the `!a.dead` filter removed. A MIXED squad is what proves
        // the crew selection itself skips corpses — a pledged corpse looks like
        // a reclaim in progress and never walks anywhere.
        const r = R.run(`(function(){
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            player.selectedElement = 'fire';
            for (let i = 0; i < 4; i++) spawnFollowerAtCrystal('fire');
            followers[0].dead = true; followers[2].dead = true;
            const crew = reclaimCrew();
            return { n: crew.length, corpses: crew.filter(a => a.dead).length };
        })()`);
        same(r.corpses, 0, 'the crew included ' + r.corpses + ' corpse(s)');
        same(r.n, 2, 'it should have taken the two live followers');
    });

    check('NEVER SILENT: every refusal says something', () => {
        // The whole reason this read as a broken button.
        for (const [label, setup] of [
            ['no followers at all', ''],
            ['all dead',   squad('fire') + `followers.forEach(f => { f.dead = true; });`],
            ['all busy',   squad('fire') + `followers.forEach(f => { f.job = { type: 'merge_pylon' }; });`],
        ]) {
            const r = scene(setup);
            same(r.reconstructing, false, label + ': fixture should have refused');
            ok(r.said.length > 0, label + ': refused with no message');
        }
    });

    // ─────────────────────────────────────────────────────
    group('RECLAIM: the crew can die without locking the pylon');

    check('THE TRAP: a wiped-out crew does not block the retry', () => {
        const r = scene(squad('fire', 2),
            `issueReconstruct(t);
             const started = t.reconstructing;
             followers.forEach(f => { f.dead = true; });
             for (let f = 0; f < 30; f++) render();
             // A fresh squad arrives and the player tries again.
             followers.length = 0;
             ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
             ${squad('fire')}
             floatingTexts.length = 0;
             issueReconstruct(t);
             if (!started) throw new Error('fixture: the first attempt never started');`);
        same(r.reconstructing, true, 'the retry was refused — the pylon is locked for good');
        ok(r.crew > 0, 'the retry pledged no crew, got ' + r.crew);
        same(r.onJob, r.crew, 'and the fresh squad should be on the job');
    });

    check('a reclaim genuinely under way is NOT restarted', () => {
        // The early return has to keep doing its job, or every press would
        // reset the progress to zero and it could never finish.
        // ONE follower, stood on the pylon. Each one adds 0.01 a frame, so a
        // crew of three finishes in ~34 frames — the first version of this
        // check sampled at frame 40 with three and read progress 0 because the
        // reclaim had already COMPLETED and reset it. One takes ~100 frames, so
        // frame 40 is genuinely mid-job.
        const r = scene(squad('fire', 1),
            `issueReconstruct(t);
             followers.forEach(f => { f.x = t.x; f.y = t.y; });
             // A SPARE, recruited after the crew was picked and left free.
             // Without it the only follower is already on the reconstruct job,
             // so reclaimCrew() comes back empty and the progress survives a
             // second press by accident rather than because of the guard.
             spawnFollowerAtCrystal('fire');
             for (let f = 0; f < 40; f++) render();
             const mid = t.reconstructProgress;
             if (!(mid > 0)) throw new Error('fixture: no progress was made, mid=' + mid);
             if (t.pillarTeam !== 'red') throw new Error('fixture: it finished early, nothing to restart');
             if (!reclaimCrew().length) throw new Error('fixture: the spare is not free, so nothing could reset it');
             issueReconstruct(t);
             if (t.reconstructProgress < mid) throw new Error('progress was reset: ' + mid + ' -> ' + t.reconstructProgress);`);
        same(r.reconstructing, true, 'it should still be running');
    });

    check('END TO END: a reclaimed pylon actually changes hands', () => {
        // The point of the whole feature, and nothing else here asserts it.
        const r = scene(squad('fire'),
            `issueReconstruct(t);
             followers.forEach(f => { f.x = t.x; f.y = t.y; });
             for (let f = 0; f < 200; f++) render();`);
        same(r.team, 'green', 'the pylon should be yours again');
    });

    check('a live crew is kept, not replaced, on a second press', () => {
        const r = scene(squad('fire'),
            `issueReconstruct(t);
             const first = t.workers.slice();
             issueReconstruct(t);
             const same_ = t.workers.length === first.length
                        && t.workers.every((w, i) => w === first[i]);
             if (!same_) throw new Error('the crew was swapped out mid-job');`);
        same(r.reconstructing, true, 'still running');
    });

    check('a CORE worker rebuild is left alone', () => {
        // _workRepair sets reconstructing without populating workers, so the
        // stall-clear must not treat it as an abandoned reclaim.
        const r = R.run(`(function(){
            const t = world.find(x => x.pillar && x.pillarTeam === 'red') || {};
            t.reconstructing = true; t.reconstructProgress = 0.4; t.workers = undefined;
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            spawnFollowerAtCrystal('fire');
            issueReconstruct(t);
            return { reconstructing: !!t.reconstructing, progress: t.reconstructProgress };
        })()`);
        same(r.reconstructing, true, 'a core rebuild should not be cancelled');
        same(r.progress, 0.4, 'nor have its progress reset');
    });

    // ─────────────────────────────────────────────────────
    group('UPGRADE: an enemy pylon is not yours to improve');

    check('THE REPORTED CASE: upgrading a red pylon is refused', () => {
        const r = scene(squad('fire'),
            `const fire = ELEMENTS.find(e => e.id === 'fire');
             _executeUpgrade(fire, t);`);
        same(r.team, 'red', 'it must stay theirs');
        same(r.attackMode, false, 'it must not become a turret of yours');
        same(r.element, null, 'nor take your element');
        same(r.pending, false, 'nor queue an upgrade');
        same(r.chosen, null, 'nor remember a chosen element');
        ok(r.said.some(s => /RECLAIM IT FIRST/.test(s)), 'and it should say why: ' + JSON.stringify(r.said));
    });

    check('the element picker never even opens on one', () => {
        const r = scene(squad('fire'),
            `buildMode = true; commandTarget = t;
             selectedRadialAction = 'build_upgrade';
             executeCommand();`);
        same(r.picker, false, 'the player should not be asked to choose an element');
        same(r.team, 'red', 'and nothing should have changed hands');
        ok(r.said.some(s => /RECLAIM IT FIRST/.test(s)), 'with a refusal: ' + JSON.stringify(r.said));
    });

    check('a pylon of YOURS still upgrades normally', () => {
        // So this cannot pass by refusing everything.
        const r = scene(squad('fire'),
            `t.pillarTeam = 'green'; t.pillarCol = '#0f8';
             const fire = ELEMENTS.find(e => e.id === 'fire');
             _executeUpgrade(fire, t);`);
        same(r.team, 'green', 'it should still be yours');
        same(r.pending, true, 'the upgrade should have been queued');
        same(r.chosen, 'fire', 'with the element you picked');
    });

    check('and an already-upgraded pylon of yours still swaps element', () => {
        const r = scene(squad('fire'),
            `t.pillarTeam = 'green'; t.attackMode = true; t.attackModeElement = 'core';
             const ice = ELEMENTS.find(e => e.id === 'ice');
             _executeUpgrade(ice, t);`);
        same(r.element, 'ice', 'the element should have been swapped');
        same(r.team, 'green', 'and it is still yours');
    });

    check('the predicate is one function, and the menu uses it', () => {
        const r = R.run(`(function(){
            return { green: canUpgradePylon({ pillar: true, pillarTeam: 'green' }),
                     red:   canUpgradePylon({ pillar: true, pillarTeam: 'red' }),
                     dead:  canUpgradePylon({ pillar: true, pillarTeam: 'green', destroyed: true }),
                     notAPylon: canUpgradePylon({ pillarTeam: 'green' }),
                     nothing:   canUpgradePylon(null) };
        })()`);
        same(r.green, true, 'your own pylon');
        same(r.red, false, 'an enemy pylon');
        same(r.dead, false, 'a destroyed one');
        same(r.notAPylon, false, 'a bare tile');
        same(r.nothing, false, 'nothing at all');
        // Drawn from the same predicate, so the button cannot offer what the
        // action refuses. Both halves are asserted: the LABEL, and the gate on
        // the action itself. Checking only that the identifier appears passed
        // when the label branch was removed and left the button reading
        // "UPGRADE" on an enemy pylon.
        ok(/canUpgradePylon\(commandTarget\)/.test(SRC.draw),
           'the radial does not consult canUpgradePylon');
        ok(/!canUp \? "NOT YOURS"/.test(SRC.draw),
           'the button still reads UPGRADE on a pylon that is not yours');
        ok(/tHov && canUp\) selectedRadialAction="build_upgrade"/.test(SRC.draw),
           'the button is labelled but the action is not gated');
    });

    check('the refusal is at the ACTION as well as the button', () => {
        // Hiding it in the menu is not enough — anything else that calls
        // _executeUpgrade would otherwise still hand the pylon over.
        const at = SRC.commands.indexOf('function _executeUpgrade');
        const end = SRC.commands.indexOf('\nfunction ', at + 1);
        const body = SRC.commands.slice(at, end === -1 ? undefined : end);
        ok(body.length > 200, 'the _executeUpgrade body could not be located');
        ok(/canUpgradePylon\(pylon\)/.test(body), 'the action itself does not check ownership');
    });

    // ─────────────────────────────────────────────────────
    group('the index says so');

    check('RECLAIM is documented as the only way back', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/RECLAIM/.test(HTML), 'the index does not mention RECLAIM');
        ok(/not yours to upgrade|cannot be upgraded|NOT YOURS/i.test(HTML),
           'the index does not say an enemy pylon cannot be upgraded');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
