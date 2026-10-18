// THE FOLLOWER NAME PLATE (js/levels.js drawUnitTag, js/draw.js drawPlate): ASKED: "color coded for their elements, and a little icon next to their name:
// a brawler emblem, a mage emblem and a technician emblem."
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
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`globalThis.__calls = []; globalThis.__draw = drawPlate; drawPlate = function (text, col, x, y, chip, role) { __calls.push({ text, col, chip: !!chip, role: role || null }); return true; };
         globalThis.__tag = (u) => { __calls.length = 0; drawUnitTag(u, 100, 100, ctx); return __calls.slice(); };`);

    group('THE PLATE');
    check('a follower\'s plate is in its element\'s colour and carries its role\'s emblem', () => {
        for (const [el, role, emb] of [['fire', 'brawler', 'brawler'], ['ice', 'sniper', 'sniper'], ['electric', 'camper', 'camper'], ['toxic', 'hybrid', 'brawler']]) {
            const c = J(`__tag({ level: 4, team: 'green', isFollower: true, element: '${el}', role: '${role}' })`)[0];
            same(c.col, run(`ELEMENTS.find(e => e.id === '${el}').color`), el + ' colour'); same(c.role, emb, el + ' emblem');
        }
    });
    check('a clone has the element colour but no role emblem; an enemy keeps its own colours and no emblem', () => {
        const c = J(`__tag({ level: 4, team: 'green', isClone: true, element: 'flux', speciesName: 'ant', className: 'scout' })`)[0];
        same(c.col, run(`ELEMENTS.find(e => e.id === 'flux').color`), 'clone colour'); same(c.role, null, 'a clone has no role');
        const e = J(`__tag({ level: 4, team: 'red', element: 'fire', speciesName: 'ant', className: 'scout' })`)[0];
        same(e.role, null, 'an enemy has an emblem');
    });
    check('a squad member\'s plate still shows its letter', () => {
        run(`followers.length = 0; spawnFollowerAtCrystal('fire'); spawnFollowerAtCrystal('ice'); squadMake(followers.slice(0, 2));`);
        const c = J(`__tag(followers[0])`)[0]; ok(/^A · /.test(c.text), 'text: ' + c.text);
    });
    check('QUIET: the plain FOLLOWING chip is not drawn; any other status still gets its chip', () => {
        const base = "{ level: 4, team: 'green', isFollower: true, element: 'fire', role: 'brawler', x: 5, y: 2, health: 10, maxHealth: 10, job: ";
        const plain = J(`__tag(Object.assign(${base}null }, { stance: 'follow' }))`); ok(!plain.some(c => c.chip && c.text === 'FOLLOWING'), 'the usual state still has a chip');
        const post = J(`__tag(Object.assign(${base}{ type: 'move', target: { x: 5, y: 2 } } }, { stance: 'hold' }))`); ok(post.some(c => c.chip), 'a post has no chip: ' + JSON.stringify(post));
    });
    check('every emblem draws, makes its own cached plate, and widens it to fit', () => {
        run('drawPlate = __draw; _plateCache.clear();');
        const w = r => { const e = run(`cachedPlate('Lv 3 FIRE BRAWLER', '#ff4a1c', false, ${r ? JSON.stringify(r) : 'null'})`); return e ? e.w : null; };
        const none = w(null); for (const r of ['brawler', 'sniper', 'camper']) ok(w(r) > none, r + ' plate is not wider');
        same(run(`_plateCache.size`), 4, 'one cached plate each');
        ok(/_drawRoleEmblem/.test(rd('js/draw.js')), 'no emblem drawing');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
