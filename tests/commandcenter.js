// THE COMMAND CENTER (js/commandcenter.js): the tablet / desktop roster that replaced the old ELEM / UNITS / CLONES index.
//
// REPORTED: "make the iPad and browser version have a menu at the bottom that has all the different menus and rosters and all that. It can take up
// the screen when accessing the roster and command center. I want the player to be able to select their creatures by clicking their card and
// changing their attack and play style. This replaces the current index."
// These run the REAL game scripts with the facility up and the real followers: the selection is the real command pool, each order is the real game
// action (HOLD posts a follower in the room it is in and COME calls it back: js/party.js), and a play style changes how far a unit goes after an
// enemy. (The ZONES page, the DUTY setting and the work crew were the strip game's: gone with it. ccOpen() / ccToggleOpen() take no argument: the
// overlay has one page, the roster, which a tablet or desktop shows as the carousel: tests/carousel.js.)
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
    ok(run('facilityPlay === true'), 'fixture: the page did not boot the facility');
    run(`gameState.running = true; facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1180;`);
    // A known roster: electric mage (evolved), electric brawler, flux brawler, core mage. The squad holds three; the fourth (the core mage) holds the room it is in.
    const squad = () => run(`followers.length = 0; actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); for (const k in followerByElement) followerByElement[k].length = 0; ccClearSelection(); squadMode = 'all';
        const mk = (el, role, evo, lv) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.level = lv; f.x = player.x; f.y = player.y; if (!f.post) { f.job = null; f.stance = 'follow'; } f.playStyle = undefined; if (evo) { f.evolved = evo; f._moltAt = -1e9; } return f; };
        globalThis.__a = mk('electric', 'sniper', 'thunderhead', 15); globalThis.__b = mk('electric', 'brawler', null, 3); globalThis.__c = mk('flux', 'brawler', null, 11); globalThis.__d = mk('core', 'sniper', null, 6); partySync(false); 4;`);
    squad();
    same(run('partyMembers().length'), 3, 'fixture: the squad of three'); same(run('!!__d.post'), true, 'fixture: the fourth holds a room');

    console.log('\nTHE PAGE');
    check('the script is loaded, before the phone menu that shares its functions; the dock has ONE roster button, and it takes no argument', () => {
        ok(/js\/commandcenter\.js/.test(html), 'not loaded'); ok(html.indexOf('<script src="js/commandcenter.js') < html.indexOf('<script src="js/radialmenu.js'), 'loads after the phone menu');
        ok(/id="btnRoster"[^>]*onclick="ccToggleOpen\(\)"/.test(html), 'the roster button is not in the dock, or still asks for a tab');
        ok(!/id="btnCommand"/.test(html) && !/id="btnAnalytics"/.test(html), 'the dock still has separate COMMAND / SQUAD buttons (they are one menu now)');
        ok(/#ccRoot \{ display: none; position: fixed;[^}]*bottom: var\(--vv-bottom/.test(html), 'the overlay is not anchored to the visible area');
        const cc = fs.readFileSync(path.join(ROOT, 'js/commandcenter.js'), 'utf8');
        ok(/function ccOpen\(\) \{/.test(cc) && /function ccToggleOpen\(\) \{ if \(ccOpenTab\) ccClose\(\); else ccOpen\(\); \}/.test(cc), 'ccOpen / ccToggleOpen take a tab');
        ok(!/"zones"|ccZones|analytics/.test(cc.replace(/\/\/[^\n]*/g, '')), 'a ZONES page is back');
    });
    check('the old canvas index is gone with ui.js: nothing draws or taps ELEM / UNITS / CLONES', () => {
        const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8'), input = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(!/drawFollowerElementUI|drawFollowerDutyMenu/.test(game), 'the old index is still drawn');
        ok(!/handleFollowerDutyMenuTap|handleFollowerUIClick/.test(input), 'the old index still takes taps');
        ok(!fs.existsSync(path.join(ROOT, 'js/ui.js')) && !/js\/ui\.js/.test(html), 'ui.js is back');
    });

    console.log('\nSELECTING BY CARD');
    check('THE ASK: clicking a card selects the unit, clicking it again lets it go', () => {
        same(run('ccToggle(__b)'), true, 'selected'); same(run('selectedUnits.has(__b)'), true, 'in the set'); same(run('ccToggle(__b)'), false, 'let go'); same(run('selectedUnits.size'), 0, 'empty');
    });
    check('the roster rows list every follower (and the card knows its element, role, level, selection, play style and whether it holds a room)', () => {
        const rows = run('ccUnits({}).map(ccRow).map(r => [r.element, r.role, r.level, r.selected, r.holding, r.playStyle, r.name])');
        same(rows.length, 4, 'rows'); same(rows.find(r => r[0] === 'core')[4], true, 'the one holding a room'); same(rows.filter(r => r[4]).length, 1, 'only that one holds');
        same(rows[0][5], 'balanced', 'the play style with none set'); same(rows[0][6], 'THUNDERHEAD', 'an evolved form\'s name');
        run('ccToggle(__a)'); same(run('ccUnits({}).map(ccRow).filter(r => r.selected).length'), 1, 'one selected'); run('ccClearSelection()');
    });
    check('the roster filters: by element, by role, by who is in the squad, by kind', () => {
        same(run('ccUnits({ element: "electric" }).length'), 2, 'electric'); same(run('ccUnits({ role: "brawler" }).length'), 2, 'brawlers');
        same(run('ccUnits({ squad: "in" }).length'), 3, 'in the squad'); same(run('ccUnits({ squad: "out" }).length'), 1, 'holding a room');
        same(run('ccUnits({ kind: "clone" }).length'), 0, 'clones'); same(run('ccUnits({ kind: "follower" }).length'), 4, 'followers');
        same(run('typeof ccUnits({ duty: "worker" }) === "object" && ccUnits({ duty: "worker" }).length'), 4, 'a DUTY filter still narrows (nobody works)');
    });
    check('THE SELECTION IS THE COMMAND POOL: world orders go to exactly the selected cards', () => {
        run('squadMode = "all"; ccSetSelection([__b, __c])');
        same(run('getCommandPool().length'), 2, 'the pool is the selection'); same(run('getCommandPool().every(f => f === __b || f === __c)'), true, 'the right ones');
        run('issueMoveCommand({ x: player.x + 3, y: player.y })');
        same(run('[__a, __b, __c, __d].map(f => !!(f.job && f.job.type === "move")).join(",")'), 'false,true,true,false', 'only the selected got the move order');
        run('ccClearSelection(); [__a, __b, __c].forEach(f => { f.job = null; f.stance = "follow"; })'); same(run('getCommandPool().length'), 3, 'with nobody selected it is the squad again (the follower holding a room is left out)');
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
    // A brawler standing on the player (so following does not move it) and one provoked creature `d` tiles away, frozen where it is put.
    const brawlerMoves = (style, d) => run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); const f = __b; f.x = player.x; f.y = player.y; f.role = 'brawler'; f.playStyle = ${style ? "'" + style + "'" : 'undefined'}; f.job = null; f.stance = 'follow'; f.post = null; f.dead = false; f.attackOrder = null; f.retreatUntil = 0;
        player.visualX = player.x; player.visualY = player.y;
        const p = spawnCreature({ species: 'ant', className: 'scout', x: player.x + ${d}, y: player.y, level: 3, state: 'hunt' }); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {};
        f._enemyCacheFrame = 0; frame += 8; const x0 = f.x, y0 = f.y; updateRTSNPC(f); const moved = Math.abs(f.x - x0) + Math.abs(f.y - y0); p.dead = true; actors.splice(actors.indexOf(p), 1); return moved > 1e-6; })()`);
    check('THE BEHAVIOUR: an enemy 8 tiles out: balanced ignores it, aggressive goes for it', () => {
        same(brawlerMoves(null, 8), false, 'balanced at 8'); same(brawlerMoves('aggressive', 8), true, 'aggressive at 8');
    });
    check('THE BEHAVIOUR: an enemy 4.5 tiles out: balanced engages, defensive does not', () => {
        same(brawlerMoves(null, 4.5), true, 'balanced at 4.5'); same(brawlerMoves('defensive', 4.5), false, 'defensive at 4.5');
        same(brawlerMoves('defensive', 3), true, 'defensive still fights what comes close');
    });
    check('the play style is saved with the follower: in the facility\'s save, in the respawn queue and on the way back', () => {
        run('__c.playStyle = "defensive"');
        const snap = run('JSON.stringify(followerRosterSnapshot())'); ok(/"playStyle":"defensive"/.test(snap), 'not in the roster save');
        const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8'), save = fs.readFileSync(path.join(ROOT, 'js/facilitysave.js'), 'utf8');
        ok(/respawnQueue\.push\(\{[\s\S]{0,1500}playStyle: a\.playStyle \|\| undefined, move: a\.move \|\| undefined \}\);/.test(game) && /if \(entry\.playStyle\) npc\.playStyle = entry\.playStyle;/.test(game), 'a respawn loses it');
        ok(/if \(entry\.playStyle\) npc\.playStyle = entry\.playStyle;/.test(save), 'a reload loses it'); run('__c.playStyle = undefined');
    });

    console.log('\nSTANCE (HOLD posts a follower in its room, COME calls it back)');
    check('HOLD posts the unit in the room it is in (out of the squad, out of the selection); FOLLOW ME / COME brings it back into the squad', () => {
        run('ccSetSelection([__b])'); same(run('ccApplyStance([__b], "hold")'), 1, 'held');
        same(run('__b.post + "," + __b.stance + "," + partyIsMember(__b) + "," + selectedUnits.has(__b)'), run('partyRoomOf(__b)') + ',hold,false,false', 'posted in its room, out of the squad and the selection');
        same(run('ccSelectionSummary([__b]).stance'), 'hold', 'the summary says HOLD');
        same(run('ccApplyStance([__b], "follow")'), 1, 'released'); same(run('__b.post + "," + __b.stance + "," + partyIsMember(__b)'), 'null,follow,true', 'following again, in the squad');
    });
    check('a clone has no post: HOLD stands it where it is, FOLLOW lets it go', () => {
        const r = run(`(function(){ const c = makeClone('ant', 'scout', player.x + 1, player.y); const n1 = ccApplyStance([c], 'hold'); const h = [c.stance, c.job && c.job.type, c.post]; const n2 = ccApplyStance([c], 'follow'); const f = [c.stance, c.job]; c.dead = true; actors.splice(actors.indexOf(c), 1); return { n1, h, n2, f }; })()`);
        same(r.n1, 1, 'held'); same(r.h.join(), 'hold,move,', 'a standing post, no room'); same(r.n2, 1, 'released'); same(r.f.join(), 'follow,', 'following');
    });
    check('the selection summary says what the whole selection has in common, or "mixed"', () => {
        run('ccSetSelection([__b, __c]); __b.role = "brawler"; __c.role = "brawler"; __b.playStyle = "aggressive"; __c.playStyle = "aggressive"');
        let S = run('ccSelectionSummary()'); same(S.role, 'brawler', 'role'); same(S.playStyle, 'aggressive', 'style'); same(S.count, 2, 'count'); same(S.stance, 'follow', 'stance');
        run('__c.playStyle = "defensive"; ccSetSelection([__a, __b, __c])'); S = run('ccSelectionSummary()'); same(S.playStyle, 'mixed', 'mixed styles'); same(S.lockedRole, 1, 'one evolved form keeps its role');
        same(run('ccSelectionSummary([__a, __b]).followers + "," + ccSelectionSummary([__a, __b]).clones'), '2,0', 'of a given list');
        run('ccClearSelection(); __b.playStyle = undefined; __c.playStyle = undefined');
    });
    check('RE-ROLL sends the selected followers back to the crystal (and out of the selection)', () => {
        run('ccSetSelection([__c])'); same(run('ccApplyReroll([__c])'), 1, 're-rolled'); same(run('__c.returningToCrystal'), true, 'walking home'); same(run('selectedUnits.size'), 0, 'out of the selection');
    });
    check('THE REPORTED CASE: the ring is centred on the unit\'s feet, not a tile-height below it (it was off centre)', () => {
        run('ccSetSelection([__a]); __a.x = player.x + 1; __a.y = player.y + 1; player.visualX = player.x; player.visualY = player.y;');
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
    check('THE ASK: RECRUIT is in the roster (the Command Center\'s + RECRUIT, the carousel\'s strip tile, the phone roster) and nowhere else: not the dock, not the Crystal', () => {
        ok(!/id="btnRecruit"/.test(html), 'the dock still has a recruit button');
        const cc = fs.readFileSync(path.join(ROOT, 'js/commandcenter.js'), 'utf8'), rm = fs.readFileSync(path.join(ROOT, 'js/radialmenu.js'), 'utf8'), cl = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
        ok(/id = "ccRecruit"[\s\S]{0,200}recruitDo\(\)/.test(cc), 'the Command Center has no recruit button'); ok(/rec\.style\.display = ccOpenTab === "roster" && !car/.test(cc), 'it shows on other pages, or in the carousel (whose RECRUIT is the strip\'s tile)');
        ok(/"cc-card cc-rtile"[\s\S]{0,400}recruitDo\(\)/.test(cc), 'the carousel\'s strip has no RECRUIT tile');
        ok(/RECRUIT \\u25c6[\s\S]{0,200}recruitDo\(\)/.test(rm), 'the phone roster has no recruit button');
        ok(!/id:"recruit"/.test(cl) && !/_drawRecruitTab/.test(cl) && !/_recruitBtnBounds/.test(cl), 'the Crystal still has a RECRUIT tab');
        same(run('typeof CTABS'), 'undefined', 'the Crystal has no tabs');
    });
    check('a recruit costs RECRUIT_COST shards and a follower comes out at the Crystal', () => {
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0; shardCount = 100; floatingTexts.length = 0;');
        same(run('recruitFollower()'), true, 'recruited'); same(run('shardCount'), 100 - run('RECRUIT_COST'), 'the price'); same(run('followers.filter(f => !f.dead).length'), 1, 'a new follower');
        ok(run('followers[0].x !== undefined && Math.hypot(followers[0].x - crystal.x, followers[0].y - crystal.y) < 4'), 'it did not come out at the Crystal');
        ok(run('floatingTexts.some(t => /RECRUITED/.test(t.text))'), 'no confirmation');
    });
    check('a recruit is a draw, as a follower found in the world is: its type (brawler, mage or technician: an even draw) and its element (an even draw of the six, all online from the start) come with it, the toast says what came out, and the player has no say in either', () => {
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0; shardCount = 100000; floatingTexts.length = 0;');
        same(run('unlockedElements.size'), 6, 'every element is online from the start');
        const r = JSON.parse(run(`JSON.stringify((function(){ const roles = {}, els = {}, pairs = {}; for (let i = 0; i < 240; i++) { recruitFollower(); const f = followers[followers.length - 1]; roles[f.role] = (roles[f.role] || 0) + 1; els[f.element] = (els[f.element] || 0) + 1; pairs[f.role + '/' + f.element] = 1; }
            const f = followers[followers.length - 1]; const ok = FOLLOWER_TYPES[f.role] && assignRole(f.stats) === f.role && FOLLOWER_TYPES[f.role].personalities.indexOf(f.personality) >= 0; return { roles, els, pairs: Object.keys(pairs).length, ok, toast: floatingTexts.filter(t => /RECRUITED/.test(t.text)).slice(-1)[0].text, squad: partyMembers().length, posted: partyPosted().length }; })())`));
        for (const k of ['brawler', 'sniper', 'camper']) ok(r.roles[k] > 50, k + ' came out ' + (r.roles[k] || 0) + ' times in 240: ' + JSON.stringify(r.roles)); same(Object.keys(r.roles).length, 3, 'a role that is not one of the three: ' + JSON.stringify(r.roles));
        for (const k of ['fire', 'electric', 'ice', 'flux', 'core', 'toxic']) ok(r.els[k] > 20, k + ' came out ' + (r.els[k] || 0) + ' times: ' + JSON.stringify(r.els)); same(Object.keys(r.els).length, 6, 'an element that is not one of the six: ' + JSON.stringify(r.els)); same(r.pairs, 18, 'not every type came with every element');
        same(r.ok, true, 'a follower\'s role is not the one its personality gives'); ok(/(BRAWLER|MAGE|TECHNICIAN) \u00b7 (FIRE|ELECTRIC|ICE|FLUX|CORE|TOXIC) RECRUITED!/.test(r.toast), 'the toast does not say what came out: ' + r.toast);
        same(r.squad, 3, 'the squad took three'); same(r.posted, 237, 'the rest hold the room they came out in');
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0;');
    });
    check('a scripted recruit can ask for a type and an element; nothing in the UI does: there is no recruit chooser and no element mix', () => {
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0; shardCount = 500;');
        run('recruitFollower("camper", "ice"); recruitFollower("sniper", "ice"); recruitFollower("brawler", "flux");');
        same(run('followers.filter(f => f.element === "ice" && f.role === "camper").length'), 1, 'a technician made of ice'); same(run('followers.filter(f => f.element === "ice" && f.role === "sniper").length'), 1, 'a mage made of ice');
        ok(run('followers.length === 3 && followers[2].role === "brawler" && followers[2].element === "flux"'), 'the asked-for brawler of flux');
        for (const f of ['js/commandcenter.js', 'js/radialmenu.js', 'js/clone.js']) ok(!/recruitCrystal|recruitChoice|modulationToggle|modulationMask|modulationWeight/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), f + ' still has a recruit chooser or an element mix');
        ok(!fs.existsSync(path.join(ROOT, 'js/recruitcrystal.js')), 'the recruit crystal file is still there'); ok(!/recruitcrystal/.test(html), 'game.html still loads it');
    });
    check('short of the price it refuses, says so, and spends nothing', () => {
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0; shardCount = 5; floatingTexts.length = 0;');
        same(run('recruitFollower()'), false, 'refused'); same(run('shardCount'), 5, 'spent'); same(run('followers.length'), 0, 'a follower appeared'); ok(run('floatingTexts.some(t => /NEED/.test(t.text))'), 'no reason said');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
