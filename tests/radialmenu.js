// THE PHONE'S RADIAL MENU (js/radialmenu.js).
//
// REPORTED: "for mobile it should be a left radial menu with squad analytics and roster and commands." One hub on the left edge fans out
// SQUAD / ROSTER / ORDERS / BUILD / AUTO. These checks run the REAL game scripts and read the REAL followers[]: the numbers are the live
// squad's, and every command is the existing game action (so the menu and the rest of the game cannot disagree).
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
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(2 * ZONE_LENGTH); player.x = 20; player.y = 2;`);
    // A known squad: 2 electric (one evolved mage, one plain brawler working), 1 flux evolved, 1 core brawler.
    run(`followers.length = 0; actors = actors.filter(a => !a.isFollower);
        const mk = (el, role, evo, lv, hp, duty) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.level = lv; f.health = f.maxHealth * hp; if (evo) { f.evolved = evo; f._moltAt = -1e9; } if (duty) f.duty = 'worker'; return f; };
        mk('electric', 'sniper', 'thunderhead', 15, 0.5); mk('electric', 'brawler', null, 3, 1, true); mk('flux', 'brawler', 'mimic', 11, 1); mk('core', 'brawler', null, 6, 0.25);`);

    check('the script is in the build, after the build menu, and the phone css shows the hub and hides the top buttons', () => {
        const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/js\/radialmenu\.js/.test(html), 'not loaded by the game');
        ok(html.indexOf('<script src="js/radialmenu.js') > html.indexOf('<script src="js/buildmenu.js'), 'it loads before the build menu');
        ok(/@media \(max-width: 700px\)[^}]*#topToggles \{ display: none !important/.test(html), 'the top buttons are not hidden on a phone');
        ok(/#radialRoot \{ display: none; \}/.test(html), 'the menu is not hidden on a desktop');
    });
    check('SQUAD: the live counts, working, evolved and average level', () => {
        const st = run('radialSquadStats("all")');
        same(st.total, 4, 'units'); same(st.working, 1, 'working'); same(st.evolved, 2, 'evolved'); same(st.avgLevel, Math.round((15 + 3 + 11 + 6) / 4), 'avg level');
        same(st.byElement.electric.n, 2, 'electric'); same(st.byElement.flux.n, 1, 'flux'); same(st.byElement.core.n, 1, 'core');
        ok(Math.abs(st.byElement.electric.hp - 0.75) < 1e-9, 'electric avg health ' + st.byElement.electric.hp);
        ok(Math.abs(st.byElement.core.hp - 0.25) < 1e-9, 'core health');
        same(st.roles.mage, 1, 'mage'); same(st.roles.brawler, 2, 'brawlers (the worker counts as a worker)'); same(st.roles.worker, 1, 'worker');
    });
    check('SQUAD filters: workers only / fighters only', () => {
        same(run('radialSquadStats("work").total'), 1, 'workers'); same(run('radialSquadStats("fight").total'), 3, 'fighters');
        same(run('radialSquadStats("work").byElement.electric.n'), 1, 'the working electric');
    });
    check('the dead are not counted', () => {
        const n = run(`(function(){ const f = followers.find(x => x.element === 'core'); f.dead = true; const t = radialSquadStats('all').total; f.dead = false; return t; })()`);
        same(n, 3, 'with one dead');
    });
    check('ROSTER: one row per follower, evolved first then by level, with the form\'s name', () => {
        const rows = run('radialRosterRows().map(r => [r.name, r.level, r.evolved, r.working])');
        same(rows.length, 4, 'rows'); same(rows[0][0], 'THUNDERHEAD', 'the highest evolved first'); same(rows[1][0], 'RIFT MIMIC', 'then the next evolved');
        ok(rows[0][2] && rows[1][2] && !rows[2][2] && !rows[3][2], 'evolved ones first'); same(rows[2][1] >= rows[3][1], true, 'then by level');
        same(rows.find(r => r[3]) !== undefined, true, 'the working one is flagged');
    });
    check('ORDERS: who: all elements / the selected element, and a role filter, set the real game state', () => {
        run('radialSetScope(true)'); same(run('squadMode'), 'all', 'all'); same(run('getCommandPool().length'), 4, 'the whole squad is the pool');
        run('radialSelectElement("electric")'); same(run('squadMode'), 'selected', 'selected'); same(run('selectedRole'), null, 'role cleared'); same(run('getCommandPool().length'), 2, 'the electric ones');
        run('radialSetRole("sniper")'); same(run('selectedRole'), 'sniper', 'role set'); same(run('getCommandPool().length'), 1, 'only the electric mage');
        run('radialSetRole("sniper")'); same(run('selectedRole'), null, 'tapping it again clears it');
    });
    check('ORDERS: SWITCH ROLES cycles the pool\'s roles and skips an evolved follower', () => {
        run('radialSelectElement("electric")');
        const r = run(`(function(){ const e = followers.filter(f => f.element === 'electric'); const before = e.map(f => f.role); const n = cycleCommandPoolRoles(); return { n, evolved: e[0].role, plain: e[1].role, was: before }; })()`);
        same(r.n, 1, 'one changed'); same(r.evolved, 'sniper', 'the evolved mage keeps its role'); same(r.plain, 'sniper', 'the brawler → mage (the next role)');
        run(`followers.filter(f => f.element === 'electric' && !f.evolved).forEach(f => f.role = 'brawler')`);
    });
    check('ORDERS: ALL TO WORK / ALL TO FIGHT use the real duty rules (only workable elements go)', () => {
        run('radialSetScope(true)');
        const w = run('radialSetAllWork(true)');
        same(run(`followers.filter(f => f.duty === 'worker').map(f => f.element).sort().join(',')`), 'core,electric,electric,flux', 'every follower here is an electric, flux or core one, so all can work');
        ok(w >= 3, 'it reports how many went: ' + w);
        run(`spawnFollowerAtCrystal('fire'); const fx = followers[followers.length - 1]; fx.returningToCrystal = false; radialSetAllWork(true);`);
        same(run(`followers.find(f => f.element === 'fire').duty === 'worker'`), false, 'a fire follower has no work job, so it stays on the line');
        run(`followers.splice(followers.findIndex(f => f.element === 'fire'), 1)`);
        const b = run('radialSetAllWork(false)'); same(run(`followers.filter(f => f.duty === 'worker').length`), 0, 'all back on the line'); ok(b >= 3, 'and says how many');
    });
    check('the hub and the petals: BUILD and AUTO run the real toggles, SQUAD / ROSTER / ORDERS open panels', () => {
        const r = run(`(function(){ let b = 0, a = 0; const tb = toggleBuild, ta = toggleAutoplay; toggleBuild = () => { b++; }; toggleAutoplay = () => { a++; };
            radialPick('build'); radialPick('auto'); toggleBuild = tb; toggleAutoplay = ta;
            radialOpen = true; radialPick('squad'); const p1 = radialPanel; radialPick('roster'); const p2 = radialPanel; radialPick('orders'); const p3 = radialPanel; radialPick('orders'); const p4 = radialPanel; return { b, a, p1, p2, p3, p4 }; })()`);
        same(r.b, 1, 'build toggled'); same(r.a, 1, 'autoplay toggled'); same(r.p1, 'squad', 'squad'); same(r.p2, 'roster', 'roster'); same(r.p3, 'orders', 'orders'); same(r.p4, null, 'tapping the open one closes it');
        run('radialToggle(false)');
    });
    check('the five petals are the five the player asked for, in order', () => {
        same(run('RADIAL_PETALS.map(p => p.id).join(",")'), 'squad,roster,orders,build,auto', 'petals');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
