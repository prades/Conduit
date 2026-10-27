// THE PLAYER AND THE FOLLOWER EGG IN 3D (js/hdsprites.js, img/hd/): the sheets exist at the size the code reads, the player turns to the way it moves and walks while it moves,
// the egg is the element's sheet (and not for an evolved follower, a clone or an enemy), and with no sheet loaded the old flat drawing still runs.
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

(async () => {
    group('THE SHEETS');
    const NAMES = ['player', 'player_angry', 'egg_fire', 'egg_electric', 'egg_ice', 'egg_flux', 'egg_core', 'egg_toxic', 'egg_neutral'];
    for (const n of NAMES) check(n + '.png is a 16 x 8 sheet of cropped cells (HD_BOX), a fraction of the 10 MB the full cells decode to', () => {
        const b = fs.readFileSync(path.join(ROOT, 'img/hd/' + n + '.png')), box = n.indexOf('egg') === 0 ? { cw: 62, ch: 85 } : { cw: 92, ch: 105 };
        same(b.slice(1, 4).toString(), 'PNG', 'signature'); same(b.readUInt32BE(16), box.cw * 16, 'width'); same(b.readUInt32BE(20), box.ch * 8, 'height'); ok(b.readUInt32BE(16) * b.readUInt32BE(20) * 4 < 6e6, "decoded size over 6 MB");
    });
    check('game.html loads js/hdsprites.js', () => ok(/js\/hdsprites\.js\?v=/.test(rd('game.html')), 'no script tag'));

    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('FACING AND FRAME');
    check('the rows: row 1 faces the camera, 0 is +x, 4 is -x, 6 is -y', () => {
        same(J('hdRow(1, 1)'), 1, '(1,1)'); same(J('hdRow(1, 0)'), 0, '(1,0)'); same(J('hdRow(-1, 0)'), 4, '(-1,0)'); same(J('hdRow(0, -1)'), 6, '(0,-1)'); same(J('hdRow(-1, -1)'), 5, '(-1,-1)');
    });
    check('standing uses the idle half of the sheet (0..7), walking the other (8..15)', () => {
        for (let f = 0; f < 120; f++) { const a = J(`hdCol(false, ${f})`), b = J(`hdCol(true, ${f})`); ok(a >= 0 && a < 8, 'idle col ' + a); ok(b >= 8 && b < 16, 'walk col ' + b); }
        ok(new Set(Array.from({ length: 64 }, (_, f) => J(`hdCol(true, ${f})`))).size === 8, 'a walk should show all eight frames');
    });

    // a sheet "arrives": every image reads as loaded, and each draw is recorded
    run(`globalThis.__draws = []; globalThis.__img = k => ({ k, complete: true, naturalWidth: 2304 });
        _hdImg = k => __img(k);
        ctx.drawImage = (im, ...a) => __draws.push([im.k, ...a]);
        gameState.running = true; `);

    group('THE PLAYER');
    check('with the sheet, drawPlayer draws one cell of it, and it is the player sheet (the angry one when it is angry)', () => {
        run('__draws.length = 0; player.angryTimer = 0; drawPlayer({ x: 300, y: 300 });');
        const d = J('__draws'); same(d.length, 1, 'draws'); same(d[0][0], 'player', 'sheet'); same(d[0][3], 92, 'cell w');
        run('__draws.length = 0; player.angryTimer = 10; drawPlayer({ x: 300, y: 300 });'); same(J('__draws[0][0]'), 'player_angry', 'angry sheet');
    });
    check('it turns to the way it moves (row), and stands facing the camera before it has moved', () => {
        run('delete player._hdRow; delete player._hdAt; delete player._hdMoveAt; player.angryTimer = 0; player.visualX = 10; player.visualY = 10; frame = 100; __draws.length = 0; drawPlayer({ x: 300, y: 300 });');
        same(J('__draws[0][2] / 105'), 1, 'row at rest');
        run('frame = 101; player.visualX = 9.8; player.visualY = 10; __draws.length = 0; drawPlayer({ x: 300, y: 300 });'); same(J('__draws[0][2] / 105'), 4, 'row moving -x');
        run('frame = 102; player.visualX = 9.6; player.visualY = 9.8; __draws.length = 0; drawPlayer({ x: 300, y: 300 });'); same(J('__draws[0][2] / 105'), 5, 'row moving -x -y');
        ok(J('__draws[0][1] / 92') >= 8, 'a moving player plays the walk frames');
    });
    check('it stops walking a few frames after it stops, and keeps its facing', () => {
        run('frame = 120; __draws.length = 0; drawPlayer({ x: 300, y: 300 });');
        ok(J('__draws[0][1] / 92') < 8, 'still walking after it stopped'); same(J('__draws[0][2] / 105'), 5, 'facing kept');
    });
    check('its vent still smokes (the puff comes from the cube, not from the old flat vent)', () => {
        run('smoke.length = 0; for (let f = 200; f < 260; f++) { frame = f; drawPlayer({ x: 300, y: 300 }); }');
        const n = J('smoke.length'); ok(n > 0, 'no smoke'); const s = J('smoke[0]'); ok(Math.abs(s.x - 300) < 60 && s.y < 300 && s.y > 200, 'puff at ' + s.x + ',' + s.y);
    });
    check('with no sheet loaded, the flat cube is drawn as before', () => {
        run('globalThis.__keepImg = _hdImg; _hdImg = () => null; __draws.length = 0; drawPlayer({ x: 300, y: 300 });');
        same(J('__draws.length'), 0, 'sprite drawn without a sheet'); run('_hdImg = __keepImg;');
    });

    group('THE EGG');
    const egg = (el, extra) => `(function(){ spawnFollowerAtCrystal(${JSON.stringify(el)}); const f = followers[followers.length - 1]; f.returningToCrystal = false; ${extra || ''} return f; })()`;
    check('a follower egg draws its element\'s sheet', () => {
        for (const el of ['fire', 'electric', 'ice', 'flux', 'core', 'toxic']) {
            run(`followers.length = 0; globalThis.__f = ${egg(el)}; __draws.length = 0; drawNPC(__f, 200, 200, ctx);`);
            ok(J('__draws.map(d => d[0])').indexOf('egg_' + el) >= 0, el + ': ' + J('__draws.map(d => d[0])'));
        }
    });
    check('its row follows the way it faces and it walks while its walk cycle runs', () => {
        run(`followers.length = 0; globalThis.__f = ${egg('fire', 'f.dirX = -1; f.dirY = 0; f.walkCycle = 1;')}; frame = 500; __draws.length = 0; drawNPC(__f, 200, 200, ctx);`);
        same(J('__draws.find(d => d[0] === "egg_fire")[2] / 85'), 4, 'row facing -x');
        run('__f.walkCycle += 0.3; frame = 501; __draws.length = 0; drawNPC(__f, 200, 200, ctx);'); ok(J('__draws.find(d => d[0] === "egg_fire")[1] / 62') >= 8, 'not walking while its walk cycle moves');
        run('frame = 540; __draws.length = 0; drawNPC(__f, 200, 200, ctx);'); ok(J('__draws.find(d => d[0] === "egg_fire")[1] / 62') < 8, 'still walking after it stood');
    });
    check('a wild recruit that is not yet a follower is the same egg with a grey crystal (egg_neutral), and stops being one when it is converted', () => {
        run(`globalThis.__w = { isNeutralRecruit: true, isFollower: false, team: 'red', element: null, x: 5, y: 5, dirX: 1, dirY: 1 }; __draws.length = 0;`);
        same(J('hdEggSheet(__w)'), 'egg_neutral', 'sheet'); same(run('drawHdEgg(__w, 200, 200, ctx)'), true, 'drawn'); ok(J('__draws.map(d => d[0])').indexOf('egg_neutral') >= 0, 'not the neutral sheet');
        run('__w.isFollower = true; __w.element = "ice";'); same(J('hdEggSheet(__w)'), 'egg_ice', 'converted: its element\'s egg');
        run('__w.isFollower = false; __w.isNeutralRecruit = false; __w.element = null;'); same(J('hdEggSheet(__w)'), null, 'an enemy virus');
        run('__w.isNeutralRecruit = true; __w.evolved = "bloom";'); same(J('hdEggSheet(__w)'), null, 'evolved');
    });
    check('a wild recruit drawn through the game\'s own draw call uses it too', () => {
        run(`followers.length = 0; globalThis.__n = Object.assign(Object.create(Object.getPrototypeOf((spawnFollowerAtCrystal('fire'), followers[0]))), followers[0]); __n.isFollower = false; __n.isNeutralRecruit = true; __n.team = 'red'; __n.element = null; followers.length = 0; __draws.length = 0; drawNPC(__n, 200, 200, ctx);`);
        ok(J('__draws.map(d => d[0])').indexOf('egg_neutral') >= 0, 'the wild recruit is still the old flat figure: ' + J('__draws.map(d => d[0])'));
    });
    check('an evolved follower, a clone and an enemy virus are not drawn as the egg', () => {
        run(`followers.length = 0; globalThis.__f = ${egg('fire', 'f.evolved = "bloom";')}; __draws.length = 0;`); same(J('drawHdEgg(__f, 200, 200, ctx)'), false, 'evolved');
        run(`__f.evolved = undefined; __f.isClone = true;`); same(J('drawHdEgg(__f, 200, 200, ctx)'), false, 'clone');
        run(`__f.isClone = false; __f.isFollower = false;`); same(J('drawHdEgg(__f, 200, 200, ctx)'), false, 'enemy');
    });
    check('with no sheet loaded the old glass egg is still drawn', () => {
        run(`followers.length = 0; globalThis.__f = ${egg('fire')}; globalThis.__keepImg = _hdImg; _hdImg = () => null; __draws.length = 0;`);
        same(J('drawHdEgg(__f, 200, 200, ctx)'), false, 'drew without a sheet'); run('drawNPC(__f, 200, 200, ctx); _hdImg = __keepImg;');
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall ok');
    process.exit(failures ? 1 : 0);
})();
