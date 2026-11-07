// THE FLUX TEST ROOM (?fluxlab): js/facilitymap.js FLUX_LAB_MAP (the room), js/facilitygrow.js (put in the map only with the flag), js/fluxlab.js (the mode); docs/FLUX-MOVEMENT.md §9.1, Build 2
// ASKED (the owner, 2026-11-06: "Test room + arena"; the roadmap, docs/NEXT-PHASE-ROADMAP.md §3.5): "Create a neutral test room containing: One-tile movable object. Two-tile movable object. Rotatable object.
// Immovable object. Object that blocks movement. Object that provides cover. Multiple enemy actors. A narrow passage. An objective behind an obstruction." The object that gives cover came with Milestone Two
// (build 2026-11-06h): the room's crates, barrel, barriers, desk and consoles (tests/cover.js). What is a reading (the layout, the squad, the creatures, no join wait, nothing kept): docs/OPEN-QUESTIONS.md §1w.
// Without the flag nothing of the game changes; with it the room is in the map, the game starts in it, and nothing is read from or written to storage. FLUX MOVE's rules are its own (tests/fluxmove.js): here they are
// played out on the room's layout. The real page on a tablet and a phone (no Chromium: it says so and passes).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// THE REAL PAGE at game.html?fluxlab, with a player's own save already in storage (written before the page's scripts run): the start, storage untouched, the chip, then FLUX MOVE through the chip on the pocket's
// barrier and the pack walked to and taken.
const MINE = JSON.stringify({ v: 1, mine: 'a player\'s own save', followers: [] });
const HEAD = `<head><base href="file://${ROOT}/"><script>try { localStorage.clear(); localStorage.setItem('conduit_fp_save', ${JSON.stringify(MINE)}); } catch (e) {}</script>`;
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, step = function(n){ for (var i = 0; i < n; i++) render(); };
  canvas.setPointerCapture = function(){};
  var tapAt = function(x, y){ var r = canvas.getBoundingClientRect(); var ev = function(t){ canvas.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: r.left + x * r.width / canvas.width, clientY: r.top + y * r.height / canvas.height, pointerId: 1, isPrimary: true, pointerType: 'touch' })); }; ev('pointerdown'); ev('pointerup'); };
  var shown = function(q){ var e = document.querySelector('#techAim ' + q); return !!e && getComputedStyle(e).display !== 'none'; };
  try {
    gameState.running = true; if (typeof dialogueClear === 'function') dialogueClear(); step(3);
    var F = _fp.F, T = function(p){ return fluxLabTile(F, p); }, R = facilityRoomAt(player.x, player.y, F);
    out.start = { lab: fluxLabOn(), room: R && R.id, squad: followers.map(function(f){ return f.element + ':' + f.role; }).join(), tag: (document.getElementById('zoneInfo') || {}).textContent || '', newGame: !!document.getElementById('facilityNewChip'),
                  creatures: actors.filter(function(a){ return a.fpCreature && a.homeRoom === 'flux_lab' && !a.dead; }).length, picker: !!classPickerOpen, saveReady: !!_fp.saveReady };
    // storage: the player's own save as it was; no key can be written, none removed
    var w1 = null; try { localStorage.setItem('conduit_fp_save', 'x'); localStorage.setItem('conduit_fp_probe', 'y'); localStorage.removeItem('conduit_fp_save'); } catch (e) { w1 = String(e); }
    facilitySaveWrite(); window.dispatchEvent(new Event('pagehide'));
    // NEW GAME's question (answered no: nothing happens)
    var asked = null, conf = window.confirm; window.confirm = function(m){ asked = m; return false; }; var ng = document.getElementById('facilityNewChip'); if (ng) ng.click(); window.confirm = conf; out.newGameAsk = asked;
    out.store = { save: localStorage.getItem('conduit_fp_save'), probe: localStorage.getItem('conduit_fp_probe'), keys: Object.keys(localStorage).sort().join(), err: w1 };
    // the chip, ready at once
    partyTick(); step(2); var chip = document.querySelector('#squadBar .sb-slot.has-ab .sb-ab'); out.chip = chip ? chip.textContent : null; out.ready = techReadyIn(followers[0]);
    // FLUX MOVE through the chip: the pocket's barrier, a place out of its mouth, PLACE
    var b1 = fluxObject('lab_barrier_1'), H = fluxHere(b1), at = T([16, 3]);
    player.x = player.targetX = player.visualX = at[0]; player.y = player.targetY = player.visualY = at[1]; player.fpPath = null;
    followers.forEach(function(f){ f.x = at[0] - 1; f.y = at[1] + 1; }); step(3);
    chip.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(2);
    var s0 = _techScr(H.x0, H.y0 + 1); tapAt(s0.x, s0.y + TILE_H - 20); step(2);
    out.picked = { id: techAim && techAim.flux && techAim.flux.s ? techAim.flux.s.id : null, rotate: shown('.ta-r'), place: shown('.ta-p') };
    var to = null; techAim.flux.grid[0].forEach(function(c, k){ var p = k.split(',').map(Number); if (!to && c.ok && !fluxBodyOn(c.cells) && p[0] < H.x0) to = p; });
    var tp = _techScr(to[0], to[1]); tapAt(tp.x, tp.y + TILE_H); step(1);
    document.querySelector('#techAim .ta-p').click(); step(2);
    var H2 = fluxHere(b1), comp = function(p){ var t = T(p); return _fpComps().get(t[0] + ',' + t[1]); };
    out.moved = { from: [H.x0, H.y0], to: [H2.x0, H2.y0], aim: !!techAim, open: comp([19, 2]) === comp([16, 3]), chip: chip.textContent };
    // the pack walked to and taken
    var pk = T([19, 2]), n0 = invCount('ammo_pack'); player.fpPath = facilityPath(player.x, player.y, pk[0], pk[1]); out.route = !!player.fpPath;
    for (var i = 0; i < 400 && invCount('ammo_pack') === n0; i++) step(1);
    out.pack = invCount('ammo_pack') - n0;
    // the prompt bar inside the screen (a phone)
    techChipTap(followers[0]); var rb = document.getElementById('techAim').getBoundingClientRect(); out.bar = { left: Math.round(rb.left), right: Math.round(rb.right), vw: innerWidth }; techAimCancel(true);
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__fl'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, () => HEAD).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=' + w + ',' + h, '--virtual-time-budget=30000', '--dump-dom', 'file://' + file + '?fluxlab'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__fl">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    const context = vm.createContext(sb);
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // (a spy on the start's cards screen and on every write to storage, put up before the page's start-up runs: js/init.js starts the facility)
    const SPY = `globalThis.__opened = []; { const o = cardsOpen; cardsOpen = function (a) { __opened.push(JSON.stringify(a || {})); return o.apply(this, arguments); }; const e = equipRunStart; equipRunStart = function () { __opened.push('run start'); return e.apply(this, arguments); }; }
         globalThis.__writes = []; { const L = localStorage, set = L.setItem, rm = L.removeItem; L.setItem = function (k, v) { __writes.push('set ' + k); return set.call(L, k, v); }; L.removeItem = function (k) { __writes.push('remove ' + k); return rm.call(L, k); }; }`;
    for (const rel of scriptOrder()) { if (rel === 'js/init.js') run(SPY); try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    run(`globalThis.__lt = p => fluxLabTile(_fp.F, p); globalThis.__comp = p => { const t = __lt(p); return _fpComps().get(t[0] + ',' + t[1]); };
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__room = (x, y) => { const r = facilityRoomAt(x, y, _fp.F); return r ? r.id : null; };`);
    return { run, J, store: sb.localStorage };
}
const ARENA9 = 'barrel_5,barrel_6,barrel_7,barrier_1,barrier_2,crate_4,crate_5,crate_6,crate_stack_3' + ',sewer_pump_1,sewer_pump_2,sewer_pump_3,sewer_valve_1,sewer_valve_2,sewer_valve_3,sewer_valve_4';   // the arena's nine and the Sewers' machinery (builds 2026-11-07b and d)
const ROOMS17 = 'arena,armory,catwalks,cold_storage,crystal_chamber,experiment_lab,front_lobby,lab_hallway,lab_passage,nest_area,observation_deck,security_room,sewers,show_room,teleport_room_1,teleport_room_2,teleport_stair_room';

(async () => {
    group('WITHOUT THE FLAG: THE GAME AS IT WAS');
    {
        const { J } = await boot('');
        check('without ?fluxlab nothing changes: the map\'s 17 rooms, 12 doorways and 164 props, no test room and no stairwell to it; the arena\'s nine objects and the Sewers\' machinery are the only ones that move; the facility\'s tables are as they were; a new game starts as it always did (the three followers, the Crystal Chamber, the tutorial at its first step, the save on)', () => {
            const r = J(`(function(){ const M = FACILITY_MAP; return { rooms: M.rooms.map(r => r.id).sort().join(), portals: M.portals.length, props: M.props.length, flag: !!M._fluxLab, lab: fluxLabOn(), stair: M.decor.some(d => d.id === 'crystal_lab_stairwell'),
                moves: fluxObjects().map(s => s.id).sort().join(), styled: FP_STYLE_ROOMS.size, tag: 'flux_lab' in FP_ROOM_TAG, look: 'flux_lab' in FP_ROOM_STYLE, squad: followers.map(f => f.element).sort().join(),
                room: __room(player.x, player.y), step: _fp.tut.script.step, save: !!_fp.saveReady, mode: !!_fp.fluxLab, spy: (render(), facilitySaveWrite(), __opened.concat(__writes).join()) }; })()`);
            same(r.rooms, ROOMS17, 'the rooms'); same(r.portals, 12, 'the doorways');   // (12 since build 2026-11-07bb: the drain pipe's two ends) same(r.props, 164, 'the props'); same(r.flag || r.lab || r.stair || r.mode, false, 'something of the test room is there');
            same(r.moves, ARENA9, 'what moves'); same(r.styled, 17, 'the styled rooms'); same(r.tag || r.look, false, 'the room\'s look or name is in the tables');
            same(r.squad, 'core,electric,fire', 'the squad'); same(r.room, 'crystal_chamber', 'the start'); same(r.step, 0, 'the tutorial'); same(r.save, true, 'the save');
            ok(/^run start(,set conduit_fp_save)+$/.test(r.spy), 'the spies on the start\'s cards screen and on storage (used below) do not see a new game\'s: ' + r.spy);
        });
    }

    const store = {};
    {   // a player's own save, from a game played without the flag: the test room must neither read it nor write over it
        const A = await boot('', store); A.run('for (let i = 0; i < 30; i++) render(); facilitySaveWrite();');
    }
    const saved = store.conduit_fp_save, before = JSON.stringify(store);
    const { run, J } = await boot('?fluxlab', store);

    group('THE ROOM (?fluxlab)');
    check('it is an INTERIOR under the Crystal Chamber, in a part of the map of its own out of sight of every room, at the arena\'s level; one pair of doorways joins the two (stairs up in an alcove of its north wall, a stairwell down in the Crystal Chamber\'s floor), each drawn; the map has no errors, and every room of the game is still there', () => {
        const r = J(`(function(){ const M = FACILITY_MAP, F = facilityBuild({ snap: true, margin: 0.4 }), v = facilityValidate(F), A = F.byId.get('flux_lab'), R = M.rooms.find(r => r.id === 'flux_lab');
            const pb = q => { let a = 1e9, b = -1e9, s = 1e9, t = -1e9; for (const [x, y] of q.poly) { a = Math.min(a, x - y); b = Math.max(b, x - y); s = Math.min(s, x + y); t = Math.max(t, x + y); } return [a, b, s, t]; }, B0 = pb(A);
            let gap = 1e9; for (const q of F.rooms) { if (q.id === 'flux_lab') continue; const B = pb(q); gap = Math.min(gap, Math.max(Math.max(0, B[0] - B0[1], B0[0] - B[1]) * 60, Math.max(0, B[2] - B0[3], B0[2] - B[3]) * 30)); }
            const P = F.portals.filter(p => /lab_crystal|crystal_lab/.test(p.id)).map(p => [p.id, p.room, p.to, p.kind, !!p.well].join(':')).sort(), up = M.portals.find(p => p.id === 'portal_crystal_lab'), well = M.decor.find(d => d.id === 'crystal_lab_stairwell'), door = M.decor.find(d => d.id === 'lab_crystal_door');
            return { errors: v.errors, rooms: M.rooms.map(r => r.id).filter(id => id !== 'flux_lab').sort().join(), interior: JSON.stringify(M.interiors.find(i => i.id === 'flux_lab')), level: R.level, isInt: R.interior, gap, P,
                conn: F.connections.filter(c => c.rooms.includes('flux_lab')).map(c => c.rooms.join('/') + ':' + c.portal), reach: facilityReachable('crystal_chamber', 'flux_lab', F, false), openings: F.openings.filter(o => (o.rooms || []).includes('flux_lab')).length,
                well: !!well && JSON.stringify(well.rect) === JSON.stringify(up.rect) && well.kind === 'stairwell', door: !!door && door.kind === 'portal_door' && door.up === true }; })()`);
        same(r.errors.length, 0, 'the map\'s errors: ' + r.errors.join(' | ')); same(r.rooms, ROOMS17, 'the other rooms'); same(r.isInt && r.level, -1, 'an interior at the arena\'s level');
        ok(/"under":"crystal_chamber"/.test(r.interior), 'not under the Crystal Chamber: ' + r.interior); ok(r.gap > 900, 'only ' + Math.round(r.gap) + ' px of screen from another room');
        same(r.P.join(), 'portal_crystal_lab:crystal_chamber:portal_lab_crystal:stairs_down:true,portal_lab_crystal:flux_lab:portal_crystal_lab:stairs_up:false', 'the doorways'); same(r.conn.join(), 'crystal_chamber/flux_lab:portal_crystal_lab', 'the connection');
        same(r.reach, true, 'it cannot be reached from the Crystal Chamber'); same(r.openings, 0, 'it has a door onto another room'); same(r.well, true, 'the stairwell is not drawn at its doorway'); same(r.door, true, 'the stairs up are not drawn at its doorway');
    });
    check('the roadmap\'s room: one-tile movable objects (two crates, a barrel), two-tile ones that turn (two barriers), and immovable ones (a generator on the open floor, the divider\'s two consoles and desk: picked, each says it does not move); each a whole-tile box, 2 tiles a move', () => {
        const r = J(`(function(){ const o = {}, mine = fluxObjects().filter(s => s.room === 'flux_lab'); o.moves = mine.map(s => s.id + ':' + fluxHere(s).w + 'x' + fluxHere(s).h + (fluxCanTurn(s) ? 'T' : '')).sort().join(); o.range = [...new Set(mine.map(s => s.flux.range))].join();
            o.all = fluxObjects().map(s => s.id).filter(id => !/^lab_/.test(id)).sort().join(); o.still = _fp.F.solids.filter(s => s.room === 'flux_lab' && !s.flux).map(s => s.id + ':' + s.kind).sort().join();
            techChipTap(followers[0]); o.picked = []; for (const id of ['lab_generator', 'lab_console_1', 'lab_desk']) { floatingTexts.length = 0; techFluxPick(_fp.F.solids.find(s => s.id === id)); o.picked.push(!(techAim && techAim.flux && techAim.flux.s) && floatingTexts.some(t => /DOES NOT MOVE/.test(t.text))); }
            techAimCancel(true); return o; })()`);
        same(r.moves, 'lab_barrel_1:1x1,lab_barrier_1:1x2T,lab_barrier_2:2x1T,lab_crate_1:1x1,lab_crate_2:1x1', 'what moves in the room'); same(r.range, '2', 'the reach'); same(r.all, ARENA9, 'the arena\'s objects');
        same(r.still, 'lab_console_1:console,lab_console_2:console,lab_desk:computer_desk,lab_generator:generator', 'what does not move'); same(r.picked.join(), 'true,true,true', 'an immovable object picked');
    });
    check('THE NARROW PASSAGE: the divider (immovable) runs across the room with ONE tile open at its west end and three at its east end, so the two halves are one stretch of floor two ways round', () => {
        const r = J(`(function(){ const o = {}, F = _fp.F, at = p => { const t = __lt(p); return facilitySolidAt(t[0], t[1], F); }, walk = p => { const t = __lt(p); return _fp.cellsP.has(t[0] + ',' + t[1]); };
            o.divider = [1,2,3,4,5,6,7,8,9,10,11,12,13,14].every(x => { const s = at([x, 6]); return s && !s.flux && s.room === 'flux_lab'; }); o.passage = walk([0, 6]) && !walk([-1, 6]); o.wide = [15, 16, 17].map(x => walk([x, 6])).join(); o.wall = walk([18, 6]);
            o.one = __comp([4, 3]) === __comp([4, 10]); return o; })()`);
        same(r.divider, true, 'the divider'); same(r.passage, true, 'the narrow passage (one tile, at the west wall)'); same(r.wide, 'true,true,true', 'the way round'); same(r.wall, false, 'the way round is wider than three'); same(r.one, true, 'the halves are not joined');
    });
    check('THE OBJECTIVE BEHIND AN OBSTRUCTION: an ammunition pack in a pocket of the east wall whose mouth the barrier fills: at the start the pocket is a stretch of floor of its own, no route reaches it, and the pack is out of reach from every tile the player can stand on', () => {
        const r = J(`(function(){ const o = {}, pk = _fp.items.find(i => i.fp === 'pickup' && i.id === 'pk_lab_objective'), t = __lt([19, 2]), H = fluxHere(fluxObject('lab_barrier_1'));
            o.pack = pk ? pk.items.map(x => x.join(':')).join() + '@' + Math.round(pk.x) + ',' + Math.round(pk.y) : null; o.at = t.join(); o.mouth = H.x0 + ',' + H.y0 + ' ' + H.w + 'x' + H.h; o.mouthAt = __lt([18, 2]).join();
            o.sealed = __comp([19, 2]) !== __comp([16, 2]); o.route = facilityPath(player.x, player.y, t[0], t[1]); const here = __comp([4, 3]); let near = 1e9;
            for (const [k, c] of _fp.cellsP) if (_fpComps().get(k) === here) near = Math.min(near, Math.hypot(c[0] - pk.x, c[1] - pk.y)); o.near = near; o.R = FP_PICK_R; return o; })()`);
        same(r.pack, 'ammo_pack:1@' + r.at, 'the pack'); same(r.mouth, r.mouthAt + ' 1x2', 'the barrier in the pocket\'s mouth'); same(r.sealed, true, 'the pocket is open'); same(r.route, null, 'a route reaches the pack');
        ok(r.near > r.R, 'the pack can be taken from ' + r.near.toFixed(2) + ' tiles (' + r.R + ')');
    });

    group('THE MODE: NO TUTORIAL, NOTHING KEPT');
    check('the start: the tutorial is over before it starts (no blackout, none of the Crystal\'s lines, no class picker, no cards screen); the player in the room by its doorway, not in it; the squad a flux technician at a new game\'s level, in the room, its chip ready at once (no squad-join wait); the room\'s look and name', () => {
        const r = J(`(function(){ const o = {}, f = followers[0], p = facilityPortal('portal_lab_crystal'); o.room = __room(player.x, player.y); o.inDoor = facilityPortalAt(player.x, player.y) ? 1 : 0; o.toDoor = Math.hypot(player.x - p.x, player.y - p.y);
            o.squad = followers.map(f => f.element + ':' + f.role + ':' + f.level + ':' + __room(f.x, f.y)).join(); o.lv = TUT.followerLevel; partyTick(); techAbilityTick(); o.can = techAbilityCan(f).ok; o.ready = techReadyIn(f);
            o.tut = _fp.tut.script.step === TUT_STEPS.length && _fp.tut.script.doneAt > 0; o.dark = facilityBlackout(); for (let i = 0; i < 180; i++) render();
            o.after = { line: !!_dlgCur, picker: !!classPickerOpen, cards: __opened.length > 0, cls: playerClassKey || null };
            o.styled = FP_STYLE_ROOMS.has('flux_lab'); o.tag = facilityRoomName('flux_lab'); o.look = _fpRoomStyle('flux_lab') === _fpRoomStyle('teleport_room_1'); return o; })()`);
        same(r.room, 'flux_lab', 'the player\'s room'); same(r.inDoor, 0, 'the player starts in the doorway'); ok(r.toDoor < 5, 'the player is ' + r.toDoor.toFixed(1) + ' tiles from the doorway');
        same(r.squad, 'flux:camper:' + r.lv + ':flux_lab', 'the squad'); same(r.can, true, 'the chip is not usable'); same(r.ready, 0, 'the chip waits');
        same(r.tut, true, 'the tutorial runs'); same(r.dark, false, 'the blackout'); same(JSON.stringify(r.after), JSON.stringify({ line: false, picker: false, cards: false, cls: null }), 'what opened at the start');
        same(r.styled && r.look, true, 'the room\'s look'); same(r.tag, 'Flux Test Room', 'the room\'s name');
    });
    check('NOTHING IS KEPT: a player\'s own save in storage is not read (the squad is not the saved one) nor written over: after a minute of play and a save asked for, storage is exactly as it was; the save is off', () => {
        ok(saved && /"followers":\[\{/.test(saved), 'no save was made to start from');
        const r = J(`(function(){ const o = { ready: !!_fp.saveReady, load: facilitySaveLoad(), squad: followers.map(f => f.element).join() }; for (let i = 0; i < 3600; i++) render(); o.wrote = facilitySaveWrite(); facilitySaveTick(); o.writes = __writes.slice(); return o; })()`);
        same(r.ready, false, 'the save is on'); same(r.load, null, 'the save was read'); same(r.squad, 'flux', 'the squad (the saved one was three)'); same(r.wrote, false, 'the save was written');
        same(r.writes.join(), '', 'storage was written to'); same(store.conduit_fp_save, saved, 'the save changed'); same(JSON.stringify(store), before, 'storage changed');
        ok(/fluxLabOn\(\)/.test(rd('js/facilityplay.js').match(/const ok = k => [^\n]*/)[0]), 'the storage filter does not refuse the test room\'s writes');
        ok(/u\.searchParams\.delete\("classic"\); u\.searchParams\.delete\("facilityplay"\);/.test(rd('js/facilitysave.js')) && !/searchParams\.delete\("fluxlab"\)/.test(rd('js/facilitysave.js')), 'NEW GAME drops the flag');
    });
    check('ITS CREATURES: three ants of the room (of its own spawner, not the arena\'s), calm, that wander in it and never leave it (a minute of play)', () => {
        const r = J(`(function(){ const o = {}, mine = () => actors.filter(a => a.fpCreature && a.homeRoom === 'flux_lab' && !a.dead); o.n = mine().length; o.what = [...new Set(mine().map(a => a.speciesName + ':' + a.level))].join(); o.cls = mine().every(a => a.className === 'worker' || a.className === 'scout');
            o.state = mine().map(a => a.state).join(); o.arena = facilityCreatures('arena').some(a => a.homeRoom === 'flux_lab'); const p0 = mine().map(a => [a.x, a.y]);
            __put(...__lt([4, 1])); followers.forEach(f => { f.stance = 'hold'; f.x = player.x; f.y = player.y; });
            for (let i = 0; i < 3600; i++) { render(); if (i % 60 === 0 && mine().some(a => __room(a.x, a.y) !== 'flux_lab')) { o.left = frame; break; } }
            o.moved = mine().some((a, i) => p0[i] && Math.hypot(a.x - p0[i][0], a.y - p0[i][1]) > 1); o.alive = mine().length; return o; })()`);
        same(r.n, 3, 'the creatures'); same(r.what, 'ant:2', 'what they are'); same(r.cls, true, 'their classes'); same(r.state, 'wander,wander,wander', 'calm'); same(r.arena, false, 'the arena\'s spawner counts them');
        same(r.left, undefined, 'one left the room'); same(r.moved, true, 'they do not wander');
    });

    group('FLUX MOVE IN THE ROOM');
    check('the crate set in the narrow passage (the floor stays one stretch: the way round is open), and a route from the far side then goes round by the wide way; the barrier set in the wide way (one tile of it left); the barrel that would shut that last tile is refused: IT WOULD SHUT A WAY THROUGH', () => {
        const r = J(`(function(){ const o = {}, T = __lt, mv = (id, p, t) => { const s = fluxObject(id), q = T(p); const m = fluxMoveTo(s, q[0], q[1], !!t); return m.ok || m.why; };
            followers.forEach(f => { f.x = T([4, 1])[0]; f.y = T([4, 1])[1]; }); actors.filter(a => a.fpCreature && a.homeRoom === 'flux_lab').forEach(a => { a.dead = true; });
            o.crate = mv('lab_crate_2', [0, 6]); o.one = __comp([4, 3]) === __comp([4, 10]); const a = T([2, 10]), b = T([2, 3]), rt = facilityPath(a[0], a[1], b[0], b[1]);
            o.round = !!rt && rt.some(w => w[0] >= T([15, 6])[0] - 0.5 && Math.abs(w[1] - T([0, 6])[1]) < 1.5) && !rt.some(w => Math.abs(w[0] - T([0, 6])[0]) < 0.6 && Math.abs(w[1] - T([0, 6])[1]) < 0.6);
            o.barrier = mv('lab_barrier_2', [15, 6]); o.still = __comp([4, 3]) === __comp([4, 10]); o.barrel = mv('lab_barrel_1', [17, 6]); o.barrel2 = mv('lab_barrel_1', [17, 5]); o.same = fluxHere(fluxObject('lab_barrel_1')).x0 === T([17, 4])[0];
            return o; })()`);
        same(r.crate, true, 'the crate into the narrow passage'); same(r.one, true, 'the floor was cut in two'); same(r.round, true, 'the route from the far side does not go round by the wide way');
        same(r.barrier, true, 'the barrier into the wide way'); same(r.still, true, 'the floor was cut in two'); same(r.barrel, 'IT WOULD SHUT A WAY THROUGH', 'the barrel that shuts the last tile'); same(r.barrel2, 'IT WOULD SHUT A WAY THROUGH', 'the barrel in front of it');
        same(r.same, true, 'a refused barrel moved');
    });
    check('the pocket\'s barrier moved out of its mouth (turned): the pocket joins the room\'s floor, a route reaches the pack, and walking to it takes it', () => {
        const r = J(`(function(){ const o = {}, b = fluxObject('lab_barrier_1'), H = fluxHere(b), t = __lt([16, 1]); __put(...__lt([15, 3]));
            const m = fluxMoveTo(b, t[0], t[1], true); o.move = m.ok || m.why; const H2 = fluxHere(b); o.now = H2.w + 'x' + H2.h + '@' + (H2.x0 - H.x0) + ',' + (H2.y0 - H.y0); o.open = __comp([19, 2]) === __comp([16, 3]);
            const pk = __lt([19, 2]), n0 = invCount('ammo_pack'); player.fpPath = facilityPath(player.x, player.y, pk[0], pk[1]); o.route = !!player.fpPath;
            for (let i = 0; i < 400 && invCount('ammo_pack') === n0; i++) render(); o.pack = invCount('ammo_pack') - n0; o.taken = !!_fp.items.find(i => i.id === 'pk_lab_objective').taken; return o; })()`);
        same(r.move, true, 'the barrier moved'); same(r.now, '2x1@-2,-1', 'where it is'); same(r.open, true, 'the pocket is shut'); same(r.route, true, 'no route to the pack'); same(r.pack, 1, 'the pack taken'); same(r.taken, true, 'the pickup');
    });
    check('the doorway: stepping into it takes the player up to the Crystal Chamber (the technician with them), and the stairwell there brings them back down into the room', () => {
        const r = J(`(function(){ const o = {}, go = id => { const p = facilityPortal(id); _fp.portalCool = 0; facilityPortalStart(p); for (let i = 0; i < 240 && facilityPortalBusy(); i++) render(); };
            __put(...__lt([3, 2])); followers.forEach(f => { f.stance = 'follow'; f.post = null; f.x = player.x + 0.5; f.y = player.y + 0.5; }); for (let i = 0; i < 5; i++) render();
            go('portal_lab_crystal'); o.up = __room(player.x, player.y); o.squad = followers.map(f => __room(f.x, f.y)).join();
            go('portal_crystal_lab'); o.down = __room(player.x, player.y); return o; })()`);
        same(r.up, 'crystal_chamber', 'the doorway up'); same(r.squad, 'crystal_chamber', 'the technician'); same(r.down, 'flux_lab', 'the stairwell down');
    });
    check('the words: FLUX MOVE\'s INFO names the test room\'s objects with the arena\'s (and the arena\'s alone without the flag)', () => {
        const r = J(`(function(){ const f = followers[0], I = techAbilityInfo(f); const row = (I.rows || []).find(x => x[0] === 'OBJECTS'); return row ? row[1] : null; })()`);
        same(r, 'the arena\'s and the test room\'s loose crates, barrels and barriers', 'the INFO row'); ok(/: "the arena's loose crates, barrels and barriers"\]/.test(rd('js/techabilities.js')), 'the row without the flag');
    });

    group('THE REAL PAGE (?fluxlab)');
    for (const [w, h, name] of [[1180, 820, 'a tablet'], [390, 844, 'a phone']]) {
        const m = measure(w, h);
        if (m === null) { check('the real page on ' + name + ': no Chromium here (not run)', () => {}); continue; }
        check('on ' + name + ' (' + w + ' × ' + h + '): it starts in the room with no errors, the tag says Flux Test Room, NEW GAME is there, the squad a flux technician whose chip reads ✦ MOVE and is ready; the three ants; no tutorial; a player\'s own save neither read nor written over, and no key written or removed; NEW GAME asks to start the test room again and says the save is not touched', () => {
            ok(m, 'no result from the page'); same(m.err, undefined, 'the page threw: ' + m.err); same((m.errs || []).length, 0, 'errors: ' + (m.errs || []).join(' | '));
            same(m.start.lab && m.start.room, 'flux_lab', 'the start'); same(m.start.squad, 'flux:camper', 'the squad'); ok(/Flux Test Room/.test(m.start.tag), 'the tag: ' + m.start.tag); same(m.start.newGame, true, 'NEW GAME');
            same(m.start.creatures, 3, 'the creatures'); same(m.start.picker || m.start.saveReady, false, 'the class picker or the save');
            same(m.store.save, MINE, 'the player\'s own save'); same(m.store.probe, null, 'a key was written'); same(m.store.keys, 'conduit_fp_save', 'the keys in storage');
            same(m.chip, '✦ MOVE', 'the chip'); same(m.ready, 0, 'the chip waits'); same(m.newGameAsk, 'Start the test room again? (Your own saved game is not touched.)', 'NEW GAME\'s question');
        });
        check('on ' + name + ': FLUX MOVE through the chip in the room: the pocket\'s barrier picked by a tap (⟳ ROTATE and ✓ PLACE shown), a tile tapped, ✓ PLACE: it moves, the pocket opens, the wait begins; the pack walked to and taken; the prompt bar inside the screen', () => {
            ok(m && !m.err, 'the page: ' + (m && m.err));
            same(m.picked.id, 'lab_barrier_1', 'what was picked'); same(m.picked.rotate && m.picked.place, true, 'the buttons');
            ok(m.moved.to[0] < m.moved.from[0], 'the barrier did not move out of the mouth: ' + JSON.stringify(m.moved)); same(m.moved.aim, false, 'the aim stays up'); same(m.moved.open, true, 'the pocket is shut'); ok(/S$/.test(m.moved.chip), 'the chip after: ' + m.moved.chip);
            same(m.route, true, 'no route to the pack'); same(m.pack, 1, 'the pack');
            ok(m.bar.left >= 0 && m.bar.right <= m.bar.vw, 'the prompt bar is off the screen: ' + JSON.stringify(m.bar));
        });
    }

    console.log(failures ? '\n' + failures + ' failing' : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
