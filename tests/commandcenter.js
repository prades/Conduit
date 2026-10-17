// THE COMMAND CENTER (js/commandcenter.js): the tablet / desktop menu that replaces the old ELEM / UNITS / CLONES index.
//
// REPORTED: "make the iPad and browser version have a menu at the bottom that has all the different menus and rosters and all that. It can take up
// the screen when accessing the roster and command center. I want the player to be able to select their creatures by clicking their card and
// changing their attack and play style. This replaces the current index."
// These run the REAL game scripts and the real followers: the selection is the real command pool, each order is the real game action, and a play
// style changes how far a unit goes after an enemy.
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
    const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(2 * ZONE_LENGTH); player.x = 20; player.y = 2;`);
    // A known squad: electric mage (evolved), electric brawler, flux brawler, core mage (plain, on the work crew).
    const squad = () => run(`followers.length = 0; actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); ccClearSelection();
        const mk = (el, role, evo, lv, duty) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.level = lv; f.x = 20; f.y = 2; f.job = null; f.stance = 'follow'; f.playStyle = undefined; if (evo) { f.evolved = evo; f._moltAt = -1e9; } if (duty) f.duty = 'worker'; return f; };
        globalThis.__a = mk('electric', 'sniper', 'thunderhead', 15); globalThis.__b = mk('electric', 'brawler', null, 3); globalThis.__c = mk('flux', 'brawler', null, 11); globalThis.__d = mk('core', 'sniper', null, 6, true); 4;`);
    squad();

    console.log('\nTHE PAGE');
    check('the script is loaded, before the phone menu that shares its functions; the dock has ONE roster button', () => {
        ok(/js\/commandcenter\.js/.test(html), 'not loaded'); ok(html.indexOf('<script src="js/commandcenter.js') < html.indexOf('<script src="js/radialmenu.js'), 'loads after the phone menu');
        ok(/id="btnRoster"[^>]*ccToggleOpen\('roster'\)/.test(html), 'the roster button is not in the dock');
        ok(!/id="btnCommand"/.test(html) && !/id="btnAnalytics"/.test(html), 'the dock still has separate COMMAND / SQUAD buttons (they are one menu now)');
        ok(/#ccRoot \{ display: none; position: fixed;[^}]*bottom: var\(--vv-bottom/.test(html), 'the overlay is not anchored to the visible area');
    });
    check('THE ASK: the old canvas index is REPLACED: not drawn and not tapped (call sites gate on indexReplaced)', () => {
        const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8'), input = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(/if \(!\(typeof indexReplaced === "function" && indexReplaced\(\)\)\) drawFollowerElementUI\(\);/.test(game), 'the old index is still drawn');
        ok(/if \(!\(typeof indexReplaced === "function" && indexReplaced\(\)\)\) drawFollowerDutyMenu\(\);/.test(game), 'the old duty menu is still drawn');
        ok(/if \(!\(typeof indexReplaced === "function" && indexReplaced\(\)\)\) \{[^}]*handleFollowerDutyMenuTap[\s\S]{0,200}handleFollowerUIClick/.test(input), 'the old index still takes taps');
        same(run('indexReplaced()'), true, 'indexReplaced');
    });

    console.log('\nSELECTING BY CARD');
    check('THE ASK: clicking a card selects the unit, clicking it again lets it go', () => {
        same(run('ccToggle(__b)'), true, 'selected'); same(run('selectedUnits.has(__b)'), true, 'in the set'); same(run('ccToggle(__b)'), false, 'let go'); same(run('selectedUnits.size'), 0, 'empty');
    });
    check('the roster rows list every follower (and the card knows its element, role, level, selection)', () => {
        const rows = run('ccUnits({}).map(ccRow).map(r => [r.element, r.role, r.level, r.selected, r.working])');
        same(rows.length, 4, 'rows'); same(rows.find(r => r[0] === 'core')[4], true, 'the working one');
        run('ccToggle(__a)'); same(run('ccUnits({}).map(ccRow).filter(r => r.selected).length'), 1, 'one selected'); run('ccClearSelection()');
    });
    check('the roster filters: by element, by role, by duty', () => {
        same(run('ccUnits({ element: "electric" }).length'), 2, 'electric'); same(run('ccUnits({ role: "brawler" }).length'), 2, 'brawlers (the worker is not a fighter)');
        same(run('ccUnits({ duty: "worker" }).length'), 1, 'workers'); same(run('ccUnits({ duty: "fighter" }).length'), 3, 'fighters');
    });
    check('THE SELECTION IS THE COMMAND POOL: world orders go to exactly the selected cards', () => {
        run('squadMode = "all"; ccSetSelection([__b, __c])');
        same(run('getCommandPool().length'), 2, 'the pool is the selection'); same(run('getCommandPool().every(f => f === __b || f === __c)'), true, 'the right ones');
        run('issueMoveCommand({ x: 25, y: 2 })');
        same(run('[__a, __b, __c, __d].map(f => !!(f.job && f.job.type === "move")).join(",")'), 'false,true,true,false', 'only the selected got the move order');
        run('ccClearSelection(); [__a, __b, __c, __d].forEach(f => { f.job = null; f.stance = "follow"; })'); same(run('getCommandPool().length'), 4, 'with nobody selected it is the usual pool again');
    });
    check('a unit that dies leaves the selection (and the pool)', () => {
        run('ccSetSelection([__b, __c]); __c.dead = true; ccPrune()');
        same(run('selectedUnits.size'), 1, 'pruned'); same(run('getCommandPool().length'), 1, 'pool'); run('__c.dead = false; ccClearSelection()');
    });

    console.log('\nATTACK STYLE (the role)');
    check('THE ASK: a selection changes its attack style: brawler → mage', () => {
        const n = run('ccApplyRole([__b, __c], "sniper")'); same(n, 2, 'changed'); same(run('__b.role + "," + __c.role'), 'sniper,sniper', 'roles');
        run('ccApplyRole([__b, __c], "brawler")');
    });
    check('an evolved form keeps its role, and a clone has none', () => {
        same(run('ccApplyRole([__a], "brawler")'), 0, 'the Thunderhead stays a mage'); same(run('__a.role'), 'sniper', 'still a mage');
        same(run('ccApplyRole([{ isClone: true, role: undefined }], "sniper")'), 0, 'a clone');
    });
    check('nonsense styles change nothing', () => { same(run('ccApplyRole([__b], "wizard")'), 0, 'role'); same(run('ccApplyPlayStyle([__b], "reckless")'), 0, 'play style'); });

    console.log('\nPLAY STYLE (how far a unit goes after an enemy)');
    check('THE ASK: a selection changes its play style, and it is remembered', () => {
        same(run('ccApplyPlayStyle([__b, __c], "aggressive")'), 2, 'changed'); same(run('__b.playStyle + "," + __c.playStyle'), 'aggressive,aggressive', 'styles');
        same(run('playReach(__b)'), run('PLAY_STYLES.find(p => p.id === "aggressive").reach'), 'reach'); same(run('playReach(__a)'), 1, 'no style = the usual reach');
        run('ccApplyPlayStyle([__b, __c], "balanced")');
    });
    // A brawler standing at x=20 with the player on top of it (so following does not move it) and one provoked enemy `d` tiles away.
    const brawlerMoves = (style, d) => run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); const f = __b; f.x = 20; f.y = 2; f.role = 'brawler'; f.playStyle = ${style ? "'" + style + "'" : 'undefined'}; f.job = null; f.stance = 'follow'; f.duty = null; f.dead = false;
        player.x = 20; player.y = 2; player.visualX = 20; player.visualY = 2;
        const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 20 + ${d}, 2); p.team = 'red'; p.provoked = true; p.state = 'hunt'; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p);
        f._enemyCacheFrame = 0; frame += 8; const x0 = f.x; updateRTSNPC(f); const moved = Math.abs(f.x - x0) + Math.abs(f.y - 2); p.dead = true; return moved > 1e-6; })()`);
    check('THE BEHAVIOUR: an enemy 8 tiles out: balanced ignores it, aggressive goes for it', () => {
        same(brawlerMoves(null, 8), false, 'balanced at 8'); same(brawlerMoves('aggressive', 8), true, 'aggressive at 8');
    });
    check('THE BEHAVIOUR: an enemy 4.5 tiles out: balanced engages, defensive does not', () => {
        same(brawlerMoves(null, 4.5), true, 'balanced at 4.5'); same(brawlerMoves('defensive', 4.5), false, 'defensive at 4.5');
        same(brawlerMoves('defensive', 3), true, 'defensive still fights what comes close');
    });
    check('the play style is saved with the follower: in the roster save and in the respawn queue', () => {
        run('__c.playStyle = "defensive"');
        const snap = run('JSON.stringify(followerRosterSnapshot())'); ok(/"playStyle":"defensive"/.test(snap), 'not in the roster save');
        const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8'), waves = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
        ok(/playStyle: a\.playStyle \|\| undefined \}\);/.test(game) && /if \(entry\.playStyle\) npc\.playStyle = entry\.playStyle;/.test(game), 'a respawn loses it');
        ok(/if \(entry\.playStyle\) npc\.playStyle = entry\.playStyle;/.test(waves), 'a reload loses it'); run('__c.playStyle = undefined');
    });

    console.log('\nSTANCE AND DUTY');
    check('HOLD HERE stands each unit where it is; FOLLOW ME lets them go back to following', () => {
        run('__b.x = 22; __b.y = 3'); same(run('ccApplyStance([__b], "hold")'), 1, 'held'); same(run('__b.stance + "," + __b.job.type + "," + __b.job.target.x + "," + __b.job.target.y'), 'hold,move,22,3', 'a post where it stands');
        same(run('ccApplyStance([__b], "follow")'), 1, 'released'); same(run('__b.stance + "," + __b.job'), 'follow,null', 'following again');
    });
    check('DUTY uses the real rules: followers of a working element go to the crew, others stay on the line', () => {
        same(run('ccApplyDuty([__b, __c], "worker")'), 2, 'electric and flux can work'); same(run('__b.duty + "," + __c.duty'), 'worker,worker', 'on the crew');
        same(run('ccApplyDuty([__b, __c], "fighter")'), 2, 'back'); same(run('__b.duty'), 'fighter', 'on the line');
        run(`spawnFollowerAtCrystal('fire'); globalThis.__f = followers[followers.length - 1]; __f.returningToCrystal = false;`); same(run('ccApplyDuty([__f], "worker")'), 0, 'fire has no work job'); same(run('__f.duty !== "worker"'), true, 'still a fighter');
        run('followers.splice(followers.indexOf(__f), 1); actors.splice(actors.indexOf(__f), 1)');
    });
    check('the selection summary says what the whole selection has in common, or "mixed"', () => {
        run('ccSetSelection([__b, __c]); __b.role = "brawler"; __c.role = "brawler"; __b.playStyle = "aggressive"; __c.playStyle = "aggressive"');
        let S = run('ccSelectionSummary()'); same(S.role, 'brawler', 'role'); same(S.playStyle, 'aggressive', 'style'); same(S.count, 2, 'count');
        run('__c.playStyle = "defensive"; ccSetSelection([__a, __b, __c])'); S = run('ccSelectionSummary()'); same(S.playStyle, 'mixed', 'mixed styles'); same(S.lockedRole, 1, 'one evolved form keeps its role');
        run('ccClearSelection(); __b.playStyle = undefined; __c.playStyle = undefined');
    });
    check('RE-ROLL sends the selected followers back to the crystal (and out of the selection)', () => {
        run('ccSetSelection([__c])'); same(run('ccApplyReroll([__c])'), 1, 're-rolled'); same(run('__c.returningToCrystal'), true, 'walking home'); same(run('selectedUnits.size'), 0, 'out of the selection');
    });
    check('THE REPORTED CASE: the ring is centred on the unit\'s feet, not a tile-height below it (it was off centre)', () => {
        run('ccSetSelection([__a]); __a.x = 21; __a.y = 3; player.visualX = 20; player.visualY = 2;');
        const r = run(`(function(){ const hits = []; const keep = ctx.ellipse; ctx.ellipse = (x, y, rx, ry) => hits.push([x, y, rx, ry]);
            try { drawSelectedUnitRings(); } finally { ctx.ellipse = keep; }
            const px = (__a.x - player.visualX - (__a.y - player.visualY)) * TILE_W + canvas.width / 2, py = (__a.x - player.visualX + (__a.y - player.visualY)) * TILE_H + canvas.height / 2;
            return { hits, px, py, off: ccGroundOffset(__a), evolved: !!__a.evolved, tileH: TILE_H }; })()`);
        ok(r.hits.length >= 2, 'no ring drawn'); same(Math.round(r.hits[0][0]), Math.round(r.px), 'x'); same(Math.round(r.hits[0][1]), Math.round(r.py + r.off), 'y');
        ok(r.off < r.tileH / 4, 'the ring is ' + r.off + 'px below the draw point (a tile is ' + r.tileH + ')');
        same(run('[ccGroundOffset({ evolved: "x" }), ccGroundOffset({ isClone: true }), ccGroundOffset({})].every(o => o >= 0 && o < TILE_H / 4)'), true, 'offsets');
    });
    check('drawing the rings is safe with a selection (and a dead unit in it)', () => { run('ccSetSelection([__a, __b]); __b.dead = true; drawSelectedUnitRings(); __b.dead = false; ccClearSelection()'); });

    console.log('\nTHE QUICK RECRUIT');
    // REPORTED: "I would really like a button near the command center or roster, so if the roster is looking slim the user can create a recruit rapidly."
    check('THE ASK: RECRUIT is in the roster (the Command Center, shown on its roster tab only; the phone roster) and nowhere else: not the dock, not the Crystal', () => {
        ok(!/id="btnRecruit"/.test(html), 'the dock still has a recruit button');
        const cc = fs.readFileSync(path.join(ROOT, 'js/commandcenter.js'), 'utf8'), rm = fs.readFileSync(path.join(ROOT, 'js/radialmenu.js'), 'utf8'), cl = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
        ok(/id = "ccRecruit"[\s\S]{0,200}recruitPickerOpen\(\)/.test(cc), 'the Command Center has no recruit button'); ok(/rec\.style\.display = ccOpenTab === "roster"/.test(cc), 'it shows on other tabs');
        ok(/RECRUIT \\u25c6[\s\S]{0,200}recruitPickerOpen\(\)/.test(rm), 'the phone roster has no recruit button');
        ok(!/id:"recruit"/.test(cl) && !/_drawRecruitTab/.test(cl) && !/_recruitBtnBounds/.test(cl), 'the Crystal still has a RECRUIT tab');
        same(run('CTABS.map(t => t.id).join()'), 'modulation,info', 'the Crystal tabs');
    });
    check('a recruit costs RECRUIT_COST shards and a follower comes out at the Crystal', () => {
        run('followers.length = 0; shardCount = 100; floatingTexts.length = 0;');
        same(run('recruitFollower()'), true, 'recruited'); same(run('shardCount'), 100 - run('RECRUIT_COST'), 'the price'); same(run('followers.filter(f => !f.dead).length'), 1, 'a new follower');
        ok(run('floatingTexts.some(t => /RECRUITED/.test(t.text))'), 'no confirmation');
    });
    check('it comes out as an element of the current mix (ELEMENT MIX), not any unlocked one', () => {
        run('modulationMask = new Set(["ice"]); followers.length = 0; shardCount = 1000;');
        for (let i = 0; i < 8; i++) run('recruitFollower()');
        same(run('followers.filter(f => f.element === "ice").length'), 8, 'every recruit is ice'); run('modulationMask = new Set();');
    });
    check('THE ASK: a picked element is the element that comes out (a locked one falls back to the mix)', () => {
        run('modulationMask = new Set(); followers.length = 0; shardCount = 500;');
        run('recruitFollower("ice"); recruitFollower("ice"); recruitFollower("flux");');
        same(run('followers.filter(f => f.element === "ice").length'), 2, 'ice'); same(run('followers.filter(f => f.element === "flux").length'), 1, 'flux');
        run('unlockedElements.delete("toxic"); followers.length = 0; recruitFollower("toxic");'); ok(run('followers.length === 1 && followers[0].element !== "toxic"'), 'a locked element was recruited'); run('unlockedElements.add("toxic");');
    });
    check('short of the price it refuses, says so, and spends nothing', () => {
        run('followers.length = 0; shardCount = 5; floatingTexts.length = 0;');
        same(run('recruitFollower()'), false, 'refused'); same(run('shardCount'), 5, 'spent'); same(run('followers.length'), 0, 'a follower appeared'); ok(run('floatingTexts.some(t => /NEED/.test(t.text))'), 'no reason said');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
