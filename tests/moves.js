// THE MOVES TABLE (js/moves.js, docs/PLAYER-CLASSES.md stage 0): the signature moves moved out of an if/else chain on the form's id into a table. NOTHING about play changes:
// every form fires the function it always did, and a move chosen for a follower is used only if its form allows it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

// What the old chain in evolutionTick called, by form id (copied from it before it was replaced).
// (The THUNDERHEAD's is STATIC VORTEX since the owner's follower combat redesign, 2026-11-02: ARC VOLLEY stays with the Reaver. docs/FOLLOWER-COMBAT-REDESIGN.md)
const OLD = { bloom: 'petalBlaze', quillstone: 'quillBurst', reaver: 'arcVolley', thunderhead: 'staticVortex', serpent: 'singularityShot', voidstar: 'singularityShot',
    manta: 'staticRush', prism: 'staticRush', voltring: 'staticRush', staticorb: 'staticRush', halo: 'hexfire', embercowl: 'hexfire',
    rotshard: 'rottenDecoy', mimic: 'gravitySlam', caldera: 'eruption', seeper: 'eruption', maw: 'chomp' };
// (the ROTSHARD's first move is ROTTEN DECOY since build 2026-11-07ss: CORRODE SHOT is its everyday shot now, the design notes' primary; js/evolution.js corrodeTouch)

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    vm.runInContext('globalThis.__arm = (f, id) => { const d = evolvedDef(f); f.alt = id || (f.move && evoMoveAllowed(f, d, f.move) ? f.move : evoMoveIds(d)[0]); f._altLive = null; f._altWind = 1; };', context);   // (the alternate as a chosen mode, js/moves.js: __arm locks a follower on its alternate and fires it on the next evolutionTick)
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE TABLE');
    check('js/moves.js is loaded by game.html', () => ok(/js\/moves\.js\?v=/.test(rd('game.html')), 'no script tag'));
    check('every form with a move has it in the table (so every move has a row)', () => {
        for (const id of J('Object.keys(EVOLUTIONS).filter(k => EVOLUTIONS[k].move)')) { const n = J(`EVOLUTIONS[${JSON.stringify(id)}].move`); ok(J(`!!MOVE_BY_NAME[${JSON.stringify(n)}]`), id + ': no row for ' + n); }
    });
    check('the eight forms the design notes gave no second attack had BASH (build 2026-11-07ss) until each got its own (build 2026-11-09c, the owner\'s picks: tests/ninemoves.js); the retired Petal and Warden still have none and fire none; a follower that has not evolved has BASH', () => {
        same(J('Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].move).sort()').join(), 'petal,warden', 'forms without a move');
        for (const [id, mid] of [['blightspider', 'venom_bite'], ['gooproxy', 'phase_swap'], ['hammerslug', 'shell_guard'], ['hornshell', 'echo_pulse'], ['hovershell', 'shock_zap'], ['igloo', 'skate_charge'], ['jellyram', 'wobble_slam'], ['rimestar', 'icicle_volley']]) same(J(`evoMoveIds(EVOLUTIONS.${id})`).join(), mid, id + ' moves');
        for (const id of ['petal', 'warden']) { same(J(`evoMoveIds(EVOLUTIONS.${id})`).length, 0, id + ' moves'); same(run(`evoMoveOf({ evolved: '${id}', move: 'chomp' })`), null, id + ' given another form\'s move'); }
        same(J(`evoMoveIds(followerMoveDef({ isFollower: true }))`).join(), 'bash', 'before it evolves'); same(run(`followerMoveDef({ isFollower: true, isClone: true })`), null, 'a clone');
    });
    check('every row fires a real function', () => {
        for (const id of J('Object.keys(MOVES)')) same(J(`typeof MOVES[${JSON.stringify(id)}].fn`), 'function', id);
    });
    check('every move has an INFO row (js/unitinfo.js reads it by name)', () => { for (const id of J('Object.keys(MOVES)')) ok(J(`typeof MOVE_INFO[MOVES[${JSON.stringify(id)}].name]`) === 'function', id + ' has no MOVE_INFO'); });

    group('THE SAME MOVE AS BEFORE');
    check('each form\'s first move is the function the old chain called (and on its normal attack, the default since 2026-11-07, it fires none)', () => {
        for (const [id, fn] of Object.entries(OLD)) {
            same(run(`evoMoveOf({ evolved: ${JSON.stringify(id)} })`), null, id + ' on its normal attack');
            const got = run(`(function(){ const d = EVOLUTIONS[${JSON.stringify(id)}], m = MOVES[evoMoveIds(d)[0]]; return m && m.fn ? m.fn.toString() : null; })()`);
            ok(got && got.indexOf(fn + '(') >= 0, id + ': ' + got + ' is not ' + fn);
        }
    });
    check('REPORTED ("Remove the bubble shield from the followers and all relevant abilities"): the shield moves are out of the table, and a follower saved with one fires none', () => {
        same(J('["aegis_burst", "aegis_bloom"].filter(id => MOVES[id]).concat(["AEGIS BURST", "AEGIS BLOOM"].filter(n => MOVE_BY_NAME[n]))').join(), '', 'shield moves in the table');
        same(run(`evoMoveOf({ evolved: 'jellyram', move: 'aegis_burst' })`), null, 'a Jelly Ram saved with AEGIS BURST'); same(run(`evoMoveOf({ evolved: 'hornshell', move: 'aegis_bloom' })`), null, 'a Hornshell saved with AEGIS BLOOM');
    });
    check('THE ALTERNATE IS A CHOSEN MODE (the owner, 2026-11-07): on its normal attack evolutionTick fires no move; locked on one (followerAltSet), the move fires when its wind-up runs out, once; set back to NORMAL it is unlocked', () => {
        run(`gameState.running = true; followers.length = 0; spawnFollowerAtCrystal('fire'); globalThis.__f = followers[followers.length - 1]; __f.evolved = 'quillstone'; __f._moltAt = -1e9;
             globalThis.__fired = 0; globalThis.__keep = MOVES.quill_burst.fn; MOVES.quill_burst.fn = f => { __fired++; f._sigAt = frame; return true; }; evolutionTick();`);
        same(J('__fired'), 0, 'fired on its normal attack');
        same(J('[followerAltSet(__f, "quill_burst"), followerAltLocked(__f), followerAltSet(__f, "chomp"), __f.alt]').join(), 'true,true,false,quill_burst', 'locked on it (another form\'s move changes nothing)');
        run('__f._altWind = 1; evolutionTick();'); same(J('__fired'), 1, 'fired when its wind-up ran out'); same(J('__f._altWind'), 0, 'no wind-up left');
        same(J('[followerAltSet(__f, null), __f.alt, followerAltLocked(__f)]').join(), 'true,,false', 'back on its normal attack'); run('MOVES.quill_burst.fn = __keep;');
    });

    group('CHOOSING A MOVE');
    check('a move on the form\'s list can be given to a follower; one that is not on it is ignored', () => {
        run(`MOVES.__extra = { id: '__extra', name: 'EXTRA', fn: f => true }; EVOLUTIONS.quillstone.moves = ['quill_burst', '__extra'];`);
        same(run(`evoMoveOf({ evolved: 'quillstone', alt: '__extra' }).id`), '__extra', 'allowed move');
        same(run(`evoMoveOf({ evolved: 'quillstone', alt: 'chomp' })`), null, 'a move of another form');
        same(run(`evoMoveOf({ evolved: 'quillstone', alt: 'nonsense' })`), null, 'an unknown move');
        same(run(`evoMoveOf({ evolved: 'quillstone' })`), null, 'no choice: its normal attack');
    });
    check('a class-only move is open only to that class', () => {
        run(`MOVES.__extra.classes = ['engineer']; globalThis.playerClassId = () => 'commander';`);
        same(run(`evoMoveOf({ evolved: 'quillstone', alt: '__extra' })`), null, 'as commander');
        run(`globalThis.playerClassId = () => 'engineer';`); same(run(`evoMoveOf({ evolved: 'quillstone', alt: '__extra' }).id`), '__extra', 'as engineer');
        run(`delete MOVES.__extra; delete EVOLUTIONS.quillstone.moves; delete globalThis.playerClassId;`);
    });

    group('THE WIND-UP (the owner, 2026-11-07: "make it another stat ... it needs to be adjustable ... it\'s on the attack not the follower")');
    check('every move has a WIND-UP of its own (seconds), the old waits unchanged, and its function waits exactly that after firing', () => {
        const OLDWAIT = { petal_blaze: 360, quill_burst: 240, arc_volley: 300, singularity_shot: 330, static_rush: 300, hexfire: 330, corrode_shot: 320, gravity_slam: 330,
            eruption: 330, chomp: 300, pinball: 300, static_vortex: 330, magma_vent: 1200, rotten_decoy: 840, bash: 240, capacitor_discharge: 90, seedfall: 330, stake_ring: 240, sweet_scent: 300,
            zigzag_dash: 240, wobble_slam: 240, icicle_volley: 300, echo_pulse: 300, shell_guard: 360, phase_swap: 300, venom_bite: 300, shock_zap: 240, skate_charge: 270 };   // (the nine of build 2026-11-09c, provisional)   // (BASH and CAPACITOR DISCHARGE: build 2026-11-07ss; the second's is the time one charge takes; SEEDFALL, the THORNWHIP's: build 2026-11-08j, provisional; STAKE RING, STONEPETAL's, and SWEET SCENT, SUNDEW's: build 2026-11-08n, provisional)
        same(J('Object.keys(MOVES).sort()').join(), Object.keys(OLDWAIT).sort().join(), 'the moves');
        for (const id in OLDWAIT) {
            ok(J(`MOVES.${id}.windup > 0`), id + ' has no wind-up'); same(J(`moveWindupFrames('${id}')`), OLDWAIT[id], id + ' (frames)');
            const fn = id === 'capacitor_discharge' ? J('capacitorTick.toString()') : J(`(function(){ const m = /^f => ([A-Za-z]+)\\(f\\)$/.exec(MOVES.${id}.fn.toString()); return m ? globalThis[m[1]].toString() : ''; })()`);   // (a CAPACITOR DISCHARGE waits its wind-up for each charge, capacitorTick: the player releases it)
            ok(fn.indexOf('moveWindupFrames("' + id + '")') >= 0, id + '\'s function does not wait its wind-up');
        }
    });
    check('the INFO tab shows each move\'s WIND-UP', () => { for (const id of J('Object.keys(MOVES)')) ok(J(`MOVE_INFO[MOVES.${id}.name]().some(r => r[0] === 'WIND-UP')`), id); });

    console.log(failures ? `\n${failures} FAILED` : '\nall ok');
    process.exit(failures ? 1 : 0);
})();
