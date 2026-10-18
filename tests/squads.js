// ROSTER SQUADS (js/squads.js): up to three followers grouped in the roster, saved with the follower, selectable in one tap, and what a tier 2 piece of gear will reach.
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
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id));
        globalThis.__fresh = n => { followers.length = 0; actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); selectedUnits.clear(); floatingTexts.length = 0;
            const els = ['fire', 'ice', 'electric', 'flux', 'core', 'toxic', 'fire']; for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(els[i % els.length]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = 6 + i; f.y = 1; } };`);

    group('MAKING AND CHANGING A SQUAD');
    check('js/squads.js is loaded by game.html', () => ok(/js\/squads\.js\?v=/.test(rd('game.html')), 'no script tag'));
    check('MAKE SQUAD turns up to 3 followers into SQUAD A, then B for the next', () => {
        run('__fresh(6);'); same(run('squadMake(followers.slice(0, 3))'), 'A', 'first squad'); same(run('squadMake(followers.slice(3, 5))'), 'B', 'second squad');
        same(J('squadsLive().map(s => s.id + s.members.length).join(",")'), 'A3,B2', 'live squads'); same(J('followers.map(f => f.squadId || "-").join("")'), 'AAABB-', 'who is where');
    });
    check('more than 3 is refused and nobody joins; so is an empty selection', () => {
        run('__fresh(5);'); same(run('squadMake(followers.slice(0, 4))'), null, 'four'); same(J('followers.every(f => !f.squadId)'), true, 'someone joined');
        same(run('squadMake([])'), null, 'nobody'); ok(J('floatingTexts.length') >= 2, 'it did not say why');
    });
    check('clones, enemies and the dead cannot be in a squad', () => {
        run('__fresh(3); followers[2].dead = true; globalThis.__cl = { isClone: true, isFollower: false, team: "green", dead: false };');
        same(run('squadMake([followers[0], __cl, followers[2]])'), 'A', 'made'); same(J('squadsLive()[0].members.length'), 1, 'only the live follower');
        same(J('__cl.squadId === undefined'), true, 'clone got a squad');
    });
    check('a unit is in one squad at a time: making a new one moves it out of the old', () => {
        run('__fresh(4); squadMake(followers.slice(0, 3));'); same(run('squadMake([followers[0]])'), 'B', 'new squad'); same(J('squadsLive().map(s => s.id + s.members.length).join(",")'), 'A2,B1', 'moved');
    });
    check('ADD TO a squad respects the limit of 3', () => {
        run('__fresh(5); squadMake(followers.slice(0, 2));'); same(run('squadAssign("A", [followers[2]])'), 1, 'one joined'); same(run('squadAssign("A", [followers[3]])'), -1, 'a fourth is refused');
        same(J('squadMembers("A").length'), 3, 'size'); same(J('followers[3].squadId === undefined'), true, 'the refused one joined anyway');
    });
    check('LEAVE and DISBAND', () => {
        run('__fresh(3); squadMake(followers);'); same(run('squadLeave([followers[1]])'), 1, 'left'); same(J('squadMembers("A").length'), 2, 'size'); same(run('squadDisband("A")'), 2, 'disbanded'); same(J('squadsLive().length'), 0, 'squads left');
    });
    check('a dead member leaves it (and an emptied squad frees its letter)', () => {
        run('__fresh(3); squadMake(followers); followers[0].dead = true;'); same(J('squadMembers("A").length'), 2, 'members'); run('followers.forEach(f => f.dead = true);'); same(J('squadsLive().length'), 0, 'live'); same(run('squadFreeId()'), 'A', 'free letter');
    });
    check('six squads at most, then it says so', () => {
        run('__fresh(7); for (let i = 0; i < 6; i++) squadMake([followers[i]]);'); same(J('squadsLive().length'), 6, 'six'); same(run('squadMake([followers[6]])'), null, 'a seventh');
    });

    group('SELECTING AND THE GEAR REACH');
    check('SELECT a squad selects exactly its members (the roster selection is what orders go to)', () => {
        run('__fresh(4); squadMake(followers.slice(0, 3)); squadSelect("A");'); same(J('ccSelectionList().length'), 3, 'selected'); same(J('ccSelectionList().every(f => f.squadId === "A")'), true, 'members only');
    });
    check('squadReach: a member reaches its squad-mates, a unit in no squad only itself', () => {
        run('__fresh(4); squadMake(followers.slice(0, 3));'); same(J('squadReach(followers[1]).length'), 3, 'squad'); same(J('squadReach(followers[3]).length'), 1, 'alone'); same(run('squadReach(followers[3])[0] === followers[3]'), true, 'a lone unit reaches itself');
    });

    group('SAVED WITH THE FOLLOWER');
    check('the roster snapshot carries the squad and a restored follower gets it back', () => {
        run('__fresh(3); squadMake(followers.slice(0, 2)); globalThis.__snap = followerRosterSnapshot();');
        same(J('__snap.map(e => e.squadId || "-").join("")'), 'AA-', 'snapshot'); run('followers.length = 0; actors = actors.filter(a => !a.isFollower); __snap.forEach(e => spawnFollowerFromSave(e));');
        same(J('followers.map(f => f.squadId || "-").sort().join("")'), '-AA', 'restored');
    });

    group('THE ROSTER');
    check('the Command Center draws the strip, MAKE SQUAD, and the squad tag on a card', () => {
        const src = rd('js/commandcenter.js'); ok(/_ccDrawSquads\(sqBox\)/.test(src), 'no strip'); ok(/MAKE SQUAD/.test(src), 'no MAKE SQUAD'); ok(/"SQ " \+ r\.squad/.test(src), 'no card tag');
    });
    check('the strip lists each squad with SELECT and DISBAND, and the hint when there are none', () => {
        // the test DOM is inert (appendChild does nothing), so the strip is drawn onto a recording element
        run(`globalThis.__mk = _ccEl; globalThis.__rec = (cls, text) => ({ className: cls || '', textContent: text || '', children: [], style: { setProperty() {} }, classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, appendChild(c) { this.children.push(c); return c; } });
             _ccEl = (t, c, x) => __rec(c, x); __fresh(3); squadMake(followers.slice(0, 2)); globalThis.__box = __rec('cc-squads'); _ccDrawSquads(__box);`);
        same(J('__box.children.length'), 1, 'one chip'); same(J('__box.children[0].children.length'), 4, 'badge, members, SELECT, DISBAND');
        same(J('__box.children[0].children[0].textContent'), 'A', 'the letter');
        run('squadDisband("A"); __box = __rec("cc-squads"); _ccDrawSquads(__box);'); same(J('__box.children.length'), 1, 'hint'); same(J('__box.children[0].className'), 'cc-sq-hint', 'the hint');
        run('_ccEl = __mk;');
    });
    check('the name plate over a squad member carries its letter and colour', () => {
        const src = rd('js/levels.js'); ok(/squadColour\(sq\)/.test(src) && src.indexOf('sq + " \\u00b7 "') >= 0, 'plate not tinted');
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall ok');
    process.exit(failures ? 1 : 0);
})();
