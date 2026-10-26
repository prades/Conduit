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
const OLD = { bloom: 'petalBlaze', quillstone: 'petalBlaze', reaver: 'arcVolley', thunderhead: 'arcVolley', serpent: 'singularityShot', voidstar: 'singularityShot',
    warden: 'aegisBurst', hammerslug: 'aegisBurst', manta: 'staticRush', prism: 'staticRush', voltring: 'staticRush', staticorb: 'staticRush', halo: 'hexfire', embercowl: 'hexfire',
    rotshard: 'corrodeShot', mimic: 'gravitySlam', petal: 'aegisBloom', hornshell: 'aegisBloom', caldera: 'eruption', seeper: 'eruption', maw: 'chomp' };

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE TABLE');
    check('js/moves.js is loaded by game.html', () => ok(/js\/moves\.js\?v=/.test(rd('game.html')), 'no script tag'));
    check('every form has its move in the table (so every move has a row)', () => {
        for (const id of J('Object.keys(EVOLUTIONS)')) { const n = J(`EVOLUTIONS[${JSON.stringify(id)}].move`); ok(J(`!!MOVE_BY_NAME[${JSON.stringify(n)}]`), id + ': no row for ' + n); }
    });
    check('every row fires a real function', () => {
        for (const id of J('Object.keys(MOVES)')) same(J(`typeof MOVES[${JSON.stringify(id)}].fn`), 'function', id);
    });
    check('every move has an INFO row (js/unitinfo.js reads it by name)', () => { for (const id of J('Object.keys(MOVES)')) ok(J(`typeof MOVE_INFO[MOVES[${JSON.stringify(id)}].name]`) === 'function', id + ' has no MOVE_INFO'); });

    group('THE SAME MOVE AS BEFORE');
    check('each form\'s default move is the function the old chain called', () => {
        for (const [id, fn] of Object.entries(OLD)) {
            const got = run(`(function(){ const d = EVOLUTIONS[${JSON.stringify(id)}], m = evoMoveOf({ evolved: ${JSON.stringify(id)} }, d); return m && m.fn ? m.fn.toString() : null; })()`);
            ok(got && got.indexOf(fn + '(') >= 0, id + ': ' + got + ' is not ' + fn);
        }
    });
    check('evolutionTick fires the form\'s move, once its cooldown is up', () => {
        run(`gameState.running = true; followers.length = 0; spawnFollowerAtCrystal('fire'); globalThis.__f = followers[followers.length - 1]; __f.evolved = 'quillstone'; __f._moltAt = -1e9; __f._sigCd = 0;
             globalThis.__fired = 0; globalThis.__keep = MOVES.quill_burst.fn; MOVES.quill_burst.fn = f => { __fired++; f._sigCd = 100; return true; }; evolutionTick();`);
        same(J('__fired'), 1, 'fired'); run('evolutionTick();'); same(J('__fired'), 1, 'fired again with its cooldown up'); run('MOVES.quill_burst.fn = __keep;');
    });

    group('CHOOSING A MOVE');
    check('a move on the form\'s list can be given to a follower; one that is not on it is ignored', () => {
        run(`MOVES.__extra = { id: '__extra', name: 'EXTRA', fn: f => true }; EVOLUTIONS.quillstone.moves = ['quill_burst', '__extra'];`);
        same(run(`evoMoveOf({ evolved: 'quillstone', move: '__extra' }).id`), '__extra', 'allowed move');
        same(run(`evoMoveOf({ evolved: 'quillstone', move: 'chomp' }).id`), 'quill_burst', 'a move of another form');
        same(run(`evoMoveOf({ evolved: 'quillstone', move: 'nonsense' }).id`), 'quill_burst', 'an unknown move');
        same(run(`evoMoveOf({ evolved: 'quillstone' }).id`), 'quill_burst', 'no choice: the default (first)');
    });
    check('a class-only move is open only to that class', () => {
        run(`MOVES.__extra.classes = ['engineer']; globalThis.playerClassId = () => 'commander';`);
        same(run(`evoMoveOf({ evolved: 'quillstone', move: '__extra' }).id`), 'quill_burst', 'as commander');
        run(`globalThis.playerClassId = () => 'engineer';`); same(run(`evoMoveOf({ evolved: 'quillstone', move: '__extra' }).id`), '__extra', 'as engineer');
        run(`delete MOVES.__extra; delete EVOLUTIONS.quillstone.moves; delete globalThis.playerClassId;`);
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall ok');
    process.exit(failures ? 1 : 0);
})();
