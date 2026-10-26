// THE PHONE'S RADIAL MENU (js/radialmenu.js).
//
// REPORTED: "for mobile it should be a left radial menu with squad analytics and roster and commands." One hub on the left edge fans out
// SQUAD / ROSTER / ORDERS (the BUILD and AUTO petals, the work switches and the squad analytics were the strip game's and went with it).
// These checks run the REAL game scripts with the facility up and read the REAL followers[]: the numbers are the live squad's, and every
// command is the existing game action (so the menu and the rest of the game cannot disagree). The orders reach the squad of three
// (js/party.js): a follower holding a room is left out of the pool.
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
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    ok(run('facilityPlay === true'), 'fixture: the page did not boot the facility');
    // A phone: the menu is the phone's, and the orders' element picker only counts there (js/helpers.js getCommandPool: the corners layout has none).
    run(`gameState.running = true; facilityBlackoutSet(false); innerWidth = 500; canvas.width = 500; canvas.height = 800;`);
    // A known roster: 2 electric (one evolved mage, one plain brawler), 1 flux evolved mage, 1 core brawler. The squad holds three; the fourth holds the room it is in.
    run(`followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0;
        const mk = (el, role, evo, lv, hp) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.level = lv; f.health = f.maxHealth * hp; if (evo) { f.evolved = evo; f._moltAt = -1e9; } return f; };
        mk('electric', 'sniper', 'thunderhead', 15, 0.5); mk('electric', 'brawler', null, 3, 1); mk('flux', 'sniper', 'voidstar', 11, 1); mk('core', 'brawler', null, 6, 0.25); partySync(false);`);
    same(run('partyMembers().length'), 3, 'fixture: the squad of three'); same(run('partyPosted().length'), 1, 'fixture: the fourth holds a room');

    check('the script is in the build, after the Command Center and the squad whose functions it shares, and the phone css shows the hub and hides the dock', () => {
        const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/js\/radialmenu\.js/.test(html), 'not loaded by the game');
        ok(html.indexOf('<script src="js/radialmenu.js') > html.indexOf('<script src="js/commandcenter.js') && html.indexOf('<script src="js/radialmenu.js') > html.indexOf('<script src="js/party.js'), 'it loads before the files it shares functions with');
        ok(/@media \(max-width: 700px\)[^}]*#topToggles \{ display: none !important/.test(html), 'the dock is not hidden on a phone');
        ok(/#radialRoot \{ display: none; \}/.test(html), 'the menu is not hidden on a desktop');
    });
    check('SQUAD: the live counts, evolved and average level, by element and by role', () => {
        const st = run('radialSquadStats()');
        same(st.total, 4, 'units'); same(st.evolved, 2, 'evolved'); same(st.avgLevel, Math.round((15 + 3 + 11 + 6) / 4), 'avg level');
        same(st.byElement.electric.n, 2, 'electric'); same(st.byElement.flux.n, 1, 'flux'); same(st.byElement.core.n, 1, 'core');
        ok(Math.abs(st.byElement.electric.hp - 0.75) < 1e-9, 'electric avg health ' + st.byElement.electric.hp);
        ok(Math.abs(st.byElement.core.hp - 0.25) < 1e-9, 'core health');
        same(st.roles.mage, 2, 'mages'); same(st.roles.brawler, 2, 'brawlers'); same(st.roles.technician, 0, 'technicians');
        same(st.roles.worker, undefined, 'a worker count: nobody works');
    });
    check('the dead are not counted, nor a clone', () => {
        const n = run(`(function(){ const f = followers.find(x => x.element === 'core'); f.dead = true; const t = radialSquadStats().total; f.dead = false; return t; })()`);
        same(n, 3, 'with one dead');
        const c = run(`(function(){ const c = makeClone('ant', 'scout', crystal.x, crystal.y); const t = radialSquadStats().total; c.dead = true; actors.splice(actors.indexOf(c), 1); return t; })()`);
        same(c, 4, 'with a clone out');
    });
    check('ROSTER: one row per follower, evolved first then by level, with the form\'s name, its level, health and role', () => {
        const rows = run('radialRosterRows().map(r => [r.name, r.level, r.evolved, r.role, r.hp])');
        same(rows.length, 4, 'rows'); same(rows[0][0], 'THUNDERHEAD', 'the highest evolved first'); same(rows[1][0], 'VOIDSTAR', 'then the next evolved');
        ok(rows[0][2] && rows[1][2] && !rows[2][2] && !rows[3][2], 'evolved ones first'); same(rows[2][1] >= rows[3][1], true, 'then by level');
        same(rows[0][3], 'mage', 'the role as the player sees it'); ok(Math.abs(rows[0][4] - 0.5) < 1e-9, 'its health');
        same(run('radialRosterRows().some(r => "working" in r)'), false, 'a working flag: nobody works');
    });
    check('ORDERS: who: all elements / the selected element, and a role filter, set the real game state; the pool is the squad (a follower holding a room is left out)', () => {
        run('selectedUnits.clear(); radialSetScope(true)'); same(run('squadMode'), 'all', 'all'); same(run('getCommandPool().length'), 3, 'the squad is the pool');
        same(run('getCommandPool().some(f => f.post)'), false, 'the posted follower is in the pool');
        run('radialSelectElement("electric")'); same(run('squadMode'), 'selected', 'selected'); same(run('selectedRole'), null, 'role cleared');
        same(run('getCommandPool().length'), run('partyMembers().filter(f => f.element === "electric").length'), 'the electric ones of the squad');
        run('radialSetRole("sniper")'); same(run('selectedRole'), 'sniper', 'role set'); same(run('getCommandPool().length'), run('partyMembers().filter(f => f.role === "sniper").length'), 'the mages of the squad');
        run('radialSetRole("sniper")'); same(run('selectedRole'), null, 'tapping it again clears it');
    });
    check('ORDERS: SWITCH ROLES cycles the pool\'s roles and skips an evolved follower', () => {
        run('radialSelectElement("electric")');
        const r = run(`(function(){ const e = partyMembers().filter(f => f.element === 'electric'); const before = e.map(f => f.role); const n = cycleCommandPoolRoles(); return { n, evolved: e.find(f => f.evolved).role, plain: e.find(f => !f.evolved).role, was: before, inSquad: e.length }; })()`);
        same(r.inSquad, 2, 'fixture: both electric ones are in the squad'); same(r.n, 1, 'one changed'); same(r.evolved, 'sniper', 'the evolved mage keeps its role'); same(r.plain, 'sniper', 'the brawler → mage (the next role)');
        run(`followers.filter(f => f.element === 'electric' && !f.evolved).forEach(f => f.role = 'brawler'); radialSetScope(true);`);
    });
    check('the hub and the petals: SQUAD / ROSTER / ORDERS open panels, the open one closes again, and closing the hub forgets the panel', () => {
        const r = run(`(function(){ radialToggle(true); radialPick('squad'); const p1 = radialPanel; radialPick('roster'); const p2 = radialPanel; radialPick('orders'); const p3 = radialPanel; radialPick('orders'); const p4 = radialPanel;
            radialPick('squad'); radialToggle(false); return { p1, p2, p3, p4, open: radialOpen, after: radialPanel }; })()`);
        same(r.p1, 'squad', 'squad'); same(r.p2, 'roster', 'roster'); same(r.p3, 'orders', 'orders'); same(r.p4, null, 'tapping the open one closes it'); same(r.open, false, 'closed'); same(r.after, null, 'the panel is forgotten');
    });
    check('the three petals are SQUAD, ROSTER and ORDERS, in order (no BUILD, no AUTO: the facility has neither)', () => {
        same(run('RADIAL_PETALS.map(p => p.id).join(",")'), 'squad,roster,orders', 'petals');
        same(run('typeof toggleBuild === "undefined" && typeof toggleAutoplay === "undefined"'), true, 'build mode or autoplay is back');
    });
    check('the ROSTER card and the SQUAD petal are the squad\'s: a RECRUIT button, ADD TO / REMOVE FROM SQUAD, INFO, DISBAND (source)', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/radialmenu.js'), 'utf8');
        ok(/"\+ RECRUIT \\u25c6" \+ cost\)[\s\S]{0,200}recruitDo\(\)/.test(src), 'no recruit button');
        ok(/inSq \? "REMOVE FROM SQUAD" : free \? "ADD TO SQUAD" : "SQUAD FULL"/.test(src) && /if \(inSq\) partyRemove\(\[r\.f\]\); else partyAdd\(\[r\.f\]\)/.test(src), 'the squad buttons are not the squad\'s own actions');
        ok(/"INFO"\)[\s\S]{0,120}unitInfoOpen\(r\.f\)/.test(src), 'no INFO on the card');
        ok(/"DISBAND SQUAD"\)[\s\S]{0,200}partyDisband\(\)/.test(src), 'no DISBAND');
        const code = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');   // (the header says what went: the code must not have it)
        ok(!/ALL TO WORK|radialSetAllWork|\.duty\b/.test(code), 'the work switches are back');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
