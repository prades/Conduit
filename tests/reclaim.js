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

    // ─────────────────────────────────────────────────────
    group('BUILD MODE: the ground wins the press');

    // REPORTED: "when build mode is on, it needs to prioritise the pylons when
    // the user clicks on a tile that's occupied by multiple objects like
    // followers."
    //
    // A pylon's drawn body and a follower standing on it share the same screen
    // space — the follower is picked 55px above its tile, the pylon rises 75px
    // off that same tile — so a press meant for the pylon landed on the
    // follower. drawRadialMenu returns early on a follower target, so the ring
    // came back offering TO WORK and the BUILD/UPGRADE button the player opened
    // the menu for was never drawn at all.
    //
    // The same collision had already been worked around once, for nest linking.

    // Stand `n` followers on a green pylon and press at `dy` from its base.
    // Reports what the press picked and what the ring then offered, with the
    // drag held UP where BUILD/UPGRADE lives.
    const press = (build, dy, n, dx) => R.run(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        buildMode = ${build ? 'true' : 'false'};
        commandMode = false; commandPendingTap = false;
        commandTarget = null; commandFollowerTarget = null; commandEnemyTarget = null;
        selectedRadialAction = null;
        elementPickerOpen = false; elementPickerMode = null; elementPickerTarget = null;
        shardCount = 999;
        // A clean board. Earlier scenes leave their pylons standing, and
        // findPylonAtScreen answers with the CLOSEST one — so without this the
        // press was being judged against a pylon from a previous check.
        world.forEach(x => { x.pillar = false; x.destroyed = false; });
        const t = world.find(x => x.type === 'floor' && x.y === 3 && x.x > 2
                                  && !x.pillar && !x.nest && !x.nodeType);
        t.pillar = true; t.destroyed = false; t.pillarTeam = 'green';
        t.pillarCol = '#0f8'; t.health = 20; t.maxHealth = 20; t.upgraded = false;
        player.x = t.x; player.y = t.y + 1;
        player.visualX = player.x; player.visualY = player.y;
        _cacheAge = -999;
        for (let i = 0; i < ${n}; i++) {
            const f = { x: t.x + (i % 3 - 1) * 0.3, y: t.y + (i < 3 ? 0 : 0.3),
                        type: 'virus', team: 'green', isFollower: true, dead: false,
                        element: 'core', role: 'brawler', duty: 'fighter',
                        health: 40, maxHealth: 40, moveSpeed: 0.03, walkCycle: 0,
                        currentWill: 5, stats: { will: 5, combat: 5, defense: 5, health: 40 } };
            actors.push(f); followers.push(f);
        }
        // Aimed from the projection, NOT from any picking helper — using the
        // function under test to choose the press point would make the test
        // follow the bug wherever it went.
        const px = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width/2;
        const py = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height/2;
        const base = py + TILE_H;
        // A unit target left over from the press before. The build-mode branch
        // returns before the follower/enemy picking runs, so without this the
        // clearing it does would never be exercised — and a stale follower is
        // enough to hijack the ring, because drawRadialMenu checks it first and
        // returns before the build button is drawn.
        commandFollowerTarget = followers[0] || null;
        commandEnemyTarget = null;
        handleLongHold(px + (${dx || 0}), base + (${dy}));
        // Captured HERE, not after the order runs: executeCommand hands the
        // target to the element picker and clears it, so a snapshot taken at
        // the end reports null however well the press landed.
        const picked = {
            pickedPylon: commandTarget === t,
            pickedFollower: !!commandFollowerTarget,
            sameTile: !!(commandTarget && commandTarget.x === t.x && commandTarget.y === t.y),
        };
        dragDY = -RADIAL_RADIUS; dragDX = 0;
        drawRadialMenu();
        const action = selectedRadialAction;
        executeCommand();
        return Object.assign(picked, {
            action,
            picker: !!elementPickerOpen, pickerMode: elementPickerMode || null,
            pickerOnPylon: elementPickerTarget === t,
        });
    })()`);

    check('fixture: with nobody on it, build mode reaches the pylon', () => {
        const r = press(true, -35, 0);
        same(r.pickedPylon, true, 'an empty pylon could not be pressed');
        same(r.action, 'build_upgrade', 'the ring did not offer the build button');
    });

    check('THE REPORTED CASE: a follower on the pylon no longer steals it', () => {
        const r = press(true, -35, 1);
        same(r.pickedFollower, false, 'the follower took the press');
        same(r.pickedPylon, true, 'the pylon did not get it');
        same(r.action, 'build_upgrade', 'the ring offered ' + r.action + ', not the build button');
    });

    check('and a whole squad standing on it does not either', () => {
        const r = press(true, -35, 6);
        same(r.pickedFollower, false, 'six followers took the press');
        same(r.pickedPylon, true, 'the pylon did not get it');
    });

    check('the press reaches the UPGRADE through to the element picker', () => {
        // The ring offering the button is not the same as the order arriving.
        const r = press(true, -35, 6);
        same(r.picker, true, 'the element picker never opened');
        same(r.pickerMode, 'upgrade', 'it opened to ' + r.pickerMode + ' rather than upgrade');
        same(r.pickerOnPylon, true, 'it opened on something other than that pylon');
    });

    check('the pylon wins anywhere on its BODY, not just one spot', () => {
        // A point-and-radius test missed the top of the pylon by a few pixels,
        // which is exactly where a finger reaching past a follower lands.
        for (const dy of [-70, -55, -35, -15, 0]) {
            const r = press(true, dy, 2);
            same(r.pickedPylon, true, 'the pylon lost the press at base' + dy);
            same(r.pickedFollower, false, 'a follower took the press at base' + dy);
        }
    });

    check('including its base corners, where the body flares widest', () => {
        // A point-and-radius test is the wrong SHAPE for a tall body: at the
        // sides its vertical reach shrinks, so the bottom corners of the pylon
        // — which is where the base is drawn and where a press naturally lands
        // — fall outside the circle while being plainly on the pylon.
        for (const [dx, dy] of [[26, 6], [-26, 6], [26, -72], [-26, -72]]) {
            const r = press(true, dy, 2, dx);
            same(r.pickedPylon, true,
                 `the pylon lost a press on its body at (${dx}, base${dy})`);
        }
    });

    check('but the tile ABOVE it is still reachable, or you cannot build behind one', () => {
        // The two-tile pylon snap is skipped in build mode on purpose, so that
        // the empty ground around a pylon stays targetable. Grabbing the pylon
        // from too far up would undo that.
        const r = press(true, -95, 2);
        same(r.pickedPylon, false, 'the pylon grabbed a press well above its head');
        same(r.sameTile, false, 'it still resolved to the pylon\'s own tile');
        same(r.action, 'build_upgrade', 'the ring should still offer BUILD on bare ground');
    });

    check('with build mode OFF, followers are commanded as before', () => {
        // The fix must not cost the player the duty menu. Build mode is the
        // mode that says "this press is about the ground".
        const r = press(false, -55, 1);
        same(r.pickedFollower, true, 'a follower standing on a pylon can no longer be ordered');
        same(r.action, 'toggle_duty', 'the ring offered ' + r.action + ' rather than the duty button');
    });

    check('the double-tap scan does not eat the button press', () => {
        // It swallows ANY tap within 40px of a follower and runs ahead of the
        // radial menu's own handling, so the tap confirming BUILD was eaten
        // whenever a follower stood near the button.
        const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        const at = INPUT.indexOf('ULTIMATE DOUBLE-TAP DETECTION');
        ok(at > -1, 'the double-tap scan could not be located');
        const guard = INPUT.slice(at, INPUT.indexOf('let _tappedFollower', at));
        for (const cond of ['!commandMode', '!commandPendingTap', '!buildMode']) {
            ok(guard.indexOf(cond) > -1, 'the scan still runs with ' + cond.slice(1) + ' set');
        }
    });

    check('build mode picks no unit at all, so the ring cannot be hijacked', () => {
        // drawRadialMenu returns early on BOTH a follower and an enemy target,
        // before the build button is ever drawn.
        const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        const at = INPUT.indexOf('BUILD MODE: THE GROUND WINS');
        ok(at > -1, 'the build-mode branch could not be located');
        const body = INPUT.slice(at, INPUT.indexOf('\n}', at));
        ok(/commandFollowerTarget = null/.test(body), 'a follower can still take a build press');
        ok(/commandEnemyTarget\s*= null/.test(body), 'an enemy can still take a build press');
        ok(/findPylonAtScreen/.test(body), 'the pylon under the press is not consulted');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
