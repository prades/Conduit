// FLUX MOVE, THE FLUX TECHNICIAN'S OBJECT TOOL (js/fluxmove.js, js/facilityplay.js facilitySolidMove, js/techabilities.js; docs/FLUX-MOVEMENT.md; the roadmap's Milestone One, docs/NEXT-PHASE-ROADMAP.md §2)
// ASKED (the roadmap, the owner's): "select an object, reposition it within its movement allowance, and rotate it [...] Up to 2 tiles from the object's original position [...] Measured from the original position for that
// move [...] No chaining [...] Entire object footprint must fit [...] Occupied tiles: Invalid [...] Actor collision: Invalid [...] Cancellation: Restore original position"; "Invalid placement must never partially
// move or corrupt an object"; "Enemy pathfinding must recognize the updated environment after an object is moved"; "Save/load behavior does not corrupt object positions"; "Multiple uses of Flux do not accumulate
// movement range". The owner, 2026-11-06: "Retire it now" (Telegrab), "Test room + arena" (here: the arena's crates, barrels and barriers; the test room is a later build), "60 s cooldown", "Prompt buttons",
// "FLUX MOVE", "Square" (diagonals count as one step). The defaults the first build follows (FLUX-MOVEMENT.md §11): a move never cuts the walkable floor in two; it is kept with the save.
// The rules and the transaction run in the sandbox, checked against the map built afresh (the floor's paint, the cells, the stretches of floor, the draw pieces); the chip, the grid, the prompt's buttons and the keys
// in the real page, on a tablet and a phone (no Chromium: it says so and passes).
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
// The real page: a flux technician's chip, a tap on a barrier, its grid, a tap on a tile, ⟳ ROTATE, ✓ PLACE; then a barrel by the keys (R does nothing for it, Enter places it); Escape calls an aim off.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, step = function(n){ for (var i = 0; i < n; i++) render(); };
  canvas.setPointerCapture = function(){};
  var tapAt = function(x, y){ var r = canvas.getBoundingClientRect(); var ev = function(t){ canvas.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: r.left + x * r.width / canvas.width, clientY: r.top + y * r.height / canvas.height, pointerId: 7, isPrimary: true, pointerType: 'touch' })); }; ev('pointerdown'); ev('pointerup'); };
  var key = function(k){ window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); };
  var shown = function(q){ var e = document.querySelector('#techAim ' + q); return !!e && getComputedStyle(e).display !== 'none'; };
  var px = function(x, y){ var d = canvas.getContext('2d').getImageData(Math.round(x), Math.round(y), 1, 1).data; return [d[0], d[1], d[2]]; };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart();
    gameState.running = true; crystalMenuOpen = false; if (typeof facilityBlackoutSet === 'function') facilityBlackoutSet(false); actors = actors.filter(function(a){ return !(a instanceof Predator); }); selectedUnits.clear();
    if (typeof dialogueClear === 'function') dialogueClear();
    var bar = fluxObject('barrier_1'), H = fluxHere(bar);
    player.x = player.targetX = player.visualX = H.x0 + 1; player.y = player.targetY = player.visualY = H.y0 + 3; player.fpPath = null;
    followers.forEach(function(f, i){ if (i === 0) f.element = 'flux'; f.role = 'camper'; f.evolved = undefined; f.x = player.x - 1 + i * 0.5; f.y = player.y + 1; });
    step(3); partyTick(); followers.forEach(function(f){ f._abReadyAt = frame; }); step(2); partyTick(); followers.forEach(function(f){ f._abReadyAt = frame; }); step(2);
    var chip = document.querySelector('#squadBar .sb-slot.has-ab .sb-ab'); out.chip = chip ? chip.textContent : null;
    chip.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(2);
    out.first = { need: techAimNeed(), prompt: techAimPrompt(), rotate: shown('.ta-r'), place: shown('.ta-p') };
    var s0 = _techScr(H.x0, H.y0); tapAt(s0.x, s0.y + TILE_H - 20); step(2);
    out.picked = { id: techAim && techAim.flux && techAim.flux.s ? techAim.flux.s.id : null, need: techAimNeed(), rotate: shown('.ta-r'), place: shown('.ta-p') };
    var t1 = _techScr(H.x0 + 1, H.y0 + 1); tapAt(t1.x, t1.y + TILE_H); step(1);
    document.querySelector('#techAim .ta-r').click(); step(2);
    var c1 = _techScr(H.x0 + 1, H.y0 + 1), g = px(c1.x, c1.y + TILE_H + 2); out.gridPixel = g;
    out.preview = { at: techAim.flux.at, turn: techAim.flux.turn, prompt: techAimPrompt() };
    document.querySelector('#techAim .ta-p').click(); step(2);
    var H2 = fluxHere(bar); out.placed = { aim: !!techAim, at: [H2.x0, H2.y0, H2.w, H2.h], turned: bar.flux.turned, chip: chip.textContent };
    // the keys: a barrel, R (it does not turn), a tile, Enter
    var bl = fluxObject('barrel_5'), BH = fluxHere(bl); player.x = player.targetX = player.visualX = BH.x0 - 3; player.y = player.targetY = player.visualY = BH.y0 + 2; player.fpPath = null;
    followers.forEach(function(f){ f.x = player.x - 1; f.y = player.y + 1; f._abReadyAt = frame; }); step(3);
    chip.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1);
    var b0 = _techScr(BH.x0, BH.y0); tapAt(b0.x, b0.y + TILE_H - 20); step(1);
    out.barrel = { id: techAim && techAim.flux && techAim.flux.s ? techAim.flux.s.id : null, rotate: shown('.ta-r'), place: shown('.ta-p') };
    if (typeof dialogueClear === 'function') dialogueClear();   // (a line of dialogue up takes Enter: js/dialogue.js; a player taps it away first)
    key('r'); out.barrel.turn = techAim.flux.turn;
    var to = null; techAim.flux.grid[0].forEach(function(c, k){ if (!to && c.ok && !fluxBodyOn(c.cells)) to = k.split(',').map(Number); });
    var tp = _techScr(to[0], to[1]); tapAt(tp.x, tp.y + TILE_H); step(1); key('Enter'); step(1);
    var BH2 = fluxHere(bl); out.barrel.moved = BH2.x0 === to[0] && BH2.y0 === to[1]; out.barrel.aim = !!techAim;
    // Escape: an aim called off leaves everything as it was
    var c4 = fluxObject('crate_4'), CH = fluxHere(c4); followers[0]._abReadyAt = frame; chip.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1); techFluxPick(c4); techFluxTile(CH.x0 - 1, CH.y0); key('Escape'); step(1);
    var CH2 = fluxHere(c4); out.escape = { aim: !!techAim, same: CH2.x0 === CH.x0 && CH2.y0 === CH.y0, ready: techReadyIn(followers[0]) };
    // the prompt bar inside the screen with its three buttons
    techChipTap(followers[0]); techFluxPick(bar); techFluxTile(H2.x0, H2.y0 - 1); step(1);
    var rb = document.getElementById('techAim').getBoundingClientRect(); out.bar = { left: Math.round(rb.left), right: Math.round(rb.right), vw: innerWidth, buttons: ['.ta-r', '.ta-p', '.ta-x'].map(function(q){ var e = document.querySelector('#techAim ' + q).getBoundingClientRect(); return e.width > 0 && e.right <= innerWidth && e.left >= 0; }) };
    techAimCancel(true);
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__fx'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__fx">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

async function boot(store) {
    const context = vm.createContext(makeBrowserSandbox(store || {}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    // helpers: a squad with a flux technician; the map checked against a fresh build of it; a place in an object's grid
    run(`globalThis.__fresh = (els) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear();
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = 'camper'; f.x = player.x + 0.5 * i; f.y = player.y + 0.6; });
            partyTick(); techAbilityTick(); followers.forEach(f => { f._abReadyAt = frame; }); return followers.slice(); };
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__ok = (s, turn) => { const e = [...fluxGrid(s, !!turn)].find(([k, c]) => c.ok && !fluxBodyOn(c.cells)); return e ? e[0].split(',').map(Number) : null; };
        globalThis.__ant = (x, y) => { const e = spawnCreature({ species: 'ant', className: 'scout' }); e.x = x; e.y = y; e.update = () => {}; e.health = e.maxHealth = 5000; return e; };
        globalThis.__audit = () => {   // the map as moved, against the map built afresh from it: the floor's paint, the cells, the world's tiles, the draw pieces, the stretches of floor, the bucket index
            const o = {}, F = _fp.F, P = _fp.P, incF = new Map(_fp.floorOps), incU = new Map(_fp.underOps), spr = _fp.spr, fills = _fp.fills;
            const full = _fpFloorBuild(F), fullU = _fp.underOps; let d = 0; for (const k of new Set([...incF.keys(), ...full.keys()])) if (JSON.stringify(incF.get(k)) !== JSON.stringify(full.get(k))) d++; for (const k of new Set([...incU.keys(), ...fullU.keys()])) if (JSON.stringify(incU.get(k)) !== JSON.stringify(fullU.get(k))) d++;
            _fp.floorOps = incF; _fp.underOps = incU; _fp.spr = spr; _fp.fills = fills; o.paint = d;
            let bad = 0; const B = F.bounds; for (let x = Math.floor(B.minX); x <= Math.ceil(B.maxX); x++) for (let y = Math.floor(B.minY); y <= Math.ceil(B.maxY); y++) { const k = x + ',' + y, w = facilityWalkable(x, y, F); if (w !== _fp.cells.has(k)) bad++; if ((w && facilityWalkable(x, y, P)) !== _fp.cellsP.has(k)) bad++; }
            o.cells = bad; o.world = world.length === _fp.cells.size && world.every(t => _fp.cells.has(t.x + ',' + t.y) && worldTileMap.get(t.x + ',' + t.y) === t);
            const now = _fp.items.filter(i => i.fp === 'prop' && !i.spriteOnly && i.kind !== 'bridge').map(i => i.id + '@' + i.x + ',' + i.y + (i.sx ? 'X' : '') + (i.sy ? 'Y' : '') + (i.top ? 'T' : '') + (i.lf ? 'L' : '')).sort().join('|');
            const fresh = []; for (const s of F.solids) for (const it of _fpPropItems(s)) fresh.push(it.id + '@' + it.x + ',' + it.y + (it.sx ? 'X' : '') + (it.sy ? 'Y' : '') + (it.top ? 'T' : '') + (it.lf ? 'L' : '')); o.items = now === fresh.sort().join('|');
            const inc = _fp.comp ? new Map(_fp.comp) : null; _fp.comp = null; const lab = _fpComps(); let same = !!inc && inc.size === lab.size; const m = new Map(), back = new Map();
            if (same) for (const [k, v] of lab) { const w = inc.get(k); if (w === undefined || (m.has(v) && m.get(v) !== w) || (back.has(w) && back.get(w) !== v)) { same = false; break; } m.set(v, w); back.set(w, v); }
            o.stretches = same; o.ix = fluxObjects().every(s => { const H = fluxHere(s); return fluxCellsOf(H.x0, H.y0, H.w, H.h).every(k => { const [x, y] = k.split(',').map(Number); return facilitySolidAt(x, y, F) === s && facilitySolidAt(x, y, P) === P.solids.find(q => q.id === s.id); }); });
            return o; };`);
    return { run, J };
}

(async () => {
    const { run, J } = await boot();

    group('WHAT MOVES');
    check('the arena\'s loose crates (and its crate stack), barrels and barriers, the sewer\'s pumps and valves, and the hazard containers (build 2026-11-09yy), and nothing else: each a whole-tile box, 2 tiles a move; the barriers turn (they are two tiles long), the one-tile ones have nothing to turn; a floodlight, the truck and a tank say they do not move', () => {
        const r = J(`(function(){ const o = {}; o.ids = fluxObjects().map(s => s.id).sort(); o.all = _fp.F.solids.filter(s => s.flux).length; o.rooms = [...new Set(fluxObjects().map(s => s.room))];
            o.range = [...new Set(fluxObjects().map(s => s.flux.range))]; o.turn = fluxObjects().filter(s => fluxCanTurn(s)).map(s => s.id).sort(); o.sizes = fluxObjects().map(s => { const H = fluxHere(s); return H.w + 'x' + H.h; }).sort().join();
            __fresh(['flux']); techChipTap(followers[0]); const why = []; for (const id of ['floodlight_1', 'arena_truck', 'arena_structure_01']) { floatingTexts.length = 0; techFluxPick(_fp.F.solids.find(s => s.id === id)); why.push(techAim.flux.s === null && floatingTexts.some(t => /DOES NOT MOVE/.test(t.text))); }
            o.refused = why; techAimCancel(true); return o; })()`);
        same(r.ids.join(), 'barrel_5,barrel_6,barrel_7,barrier_1,barrier_2,crate_4,crate_5,crate_6,crate_stack_3,hazard_c1,hazard_x1,hazard_x2,sewer_pump_1,sewer_pump_2,sewer_pump_3,sewer_valve_1,sewer_valve_2,sewer_valve_3,sewer_valve_4', 'the objects (the hazard containers since build 2026-11-09yy: js/hazards.js)'); same(r.all, 19, 'others have a flux field (and the sewer pumps and valves since builds 2026-11-07b and c, the hazard containers since 2026-11-09yy)'); same(r.rooms.join(), 'arena,sewers', 'the rooms (the arena, and the sewer pumps since build 2026-11-07b)');
        same(r.range.join(), '2', 'the reach'); same(r.turn.join(), 'barrier_1,barrier_2,sewer_pump_1,sewer_pump_2,sewer_pump_3', 'what turns (the barriers, and the sewer pumps since build 2026-11-07b)'); same(r.sizes, '1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x1,1x2,2x1,2x1,2x1,2x1', 'the sizes'); same(r.refused.join(), 'true,true,true', 'an immovable object picked, or not said so');
    });

    group('THE REACH: 2 TILES, A SQUARE, FROM WHERE IT STANDS');
    check('a one-tile object reaches a 5 x 5 square round it (a diagonal two away is in reach; three along a line is not); a barrier\'s reach is 6 x 5; every tile of a place must be in it', () => {
        const r = J(`(function(){ const o = {}, c = fluxObject('crate_stack_3'), H = fluxHere(c), b = fluxObject('barrier_2'), B = fluxHere(b); o.region = [fluxRegion(c).size, fluxRegion(b).size];
            o.diag = fluxCheck(c, H.x0 - 2, H.y0 - 2, false, { bodies: false }).why || 'ok'; o.three = fluxCheck(c, H.x0 - 3, H.y0, false, { bodies: false }).why;
            o.barFar = fluxCheck(b, B.x0 + 2, B.y0, false, { bodies: false }).why || 'ok'; o.barOut = fluxCheck(b, B.x0 + 3, B.y0, false, { bodies: false }).why; return o; })()`);
        same(r.region.join(), '25,30', 'the reach\'s tiles'); same(r.diag, 'ok', 'a diagonal two away'); same(r.three, 'TOO FAR · 2 TILES AT MOST', 'three away');
        same(r.barFar, 'ok', 'the barrier two along'); same(r.barOut, 'TOO FAR · 2 TILES AT MOST', 'the barrier\'s far tile out of reach');
    });
    check('each move is measured from where the object stands when it starts: two moves of 2 take a crate 4 from where it was built, one move never more than 2 (no chaining), and the reach moves with it', () => {
        const r = J(`(function(){ const o = {}, c = fluxObject('crate_4'), H0 = fluxHere(c); __put(H0.x0 + 6, H0.y0 - 6);
            o.far = fluxCheck(c, H0.x0 - 4, H0.y0, false, { bodies: false }).why; const a = fluxMoveTo(c, H0.x0 - 2, H0.y0, false); const b2 = fluxMoveTo(c, H0.x0 - 4, H0.y0, false);
            const H = fluxHere(c); o.moves = [a.ok, b2.ok, H.x0 - H0.x0]; o.regionMoved = fluxRegion(c).has((H.x0 - 2) + ',' + H.y0) && !fluxRegion(c).has(H0.x0 + ',' + H0.y0);
            fluxMoveTo(c, H0.x0 - 2, H0.y0, false); fluxMoveTo(c, H0.x0, H0.y0, false); o.home = JSON.stringify(fluxHere(c)) === JSON.stringify(H0); return o; })()`);
        same(r.far, 'TOO FAR · 2 TILES AT MOST', 'four in one move'); same(r.moves.join(), 'true,true,-4', 'two moves of two'); same(r.regionMoved, true, 'the reach did not move with it'); same(r.home, true, 'it did not come back');
    });

    group('WHERE IT CAN GO: THE WHOLE FOOTPRINT, FLOOR OF ITS ROOM, THE KEPT SPOTS');
    check('a place is refused, and nothing changes, when any tile of it is: another object\'s, not floor, another room, a stair, a doorway or the spot in front of it, a launcher site, an item on the floor; the place it stands now is no move', () => {
        const r = J(`(function(){ const o = {}, b = fluxObject('barrier_1'), c = fluxObject('crate_5'), C = fluxHere(c), F = _fp.F; const was = JSON.stringify([fluxHere(b), fluxHere(c)]);
            o.onObject = fluxCheck(c, C.x0 - 1, C.y0, false, { bodies: false }).why;   // (crate_4 stands there)
            o.here = fluxCheck(c, C.x0, C.y0, false, { bodies: false }).why;
            o.room = fluxCheck(b, 20, 36, false, { reach: false, bodies: false }).why; o.stair = fluxCheck(b, 19, 40, false, { reach: false, bodies: false }).why;
            const pt = _fp.portals.find(p => p.room === 'arena'), pc = facilityRectCells(pt.rect)[0].split(',').map(Number); o.door = fluxCheck(c, pc[0], pc[1], false, { reach: false, bodies: false }).why; o.doorFront = fluxCheck(c, pt.ax, pt.ay, false, { reach: false, bodies: false }).why;
            const site = F.launchSites.find(s => s.room === 'arena'); o.site = site ? fluxCheck(c, Math.round(site.at[0]), Math.round(site.at[1]), false, { reach: false, bodies: false }).why : 'no arena site';
            const it = _fp.items.find(i => i.fp === 'pickup' && !i.taken && partyRoomAt(i.x, i.y) === 'arena'); o.item = it ? fluxCheck(c, Math.round(it.x), Math.round(it.y), false, { reach: false, bodies: false }).why : 'no arena item';
            o.unchanged = JSON.stringify([fluxHere(b), fluxHere(c)]) === was; return o; })()`);
        same(r.onObject, 'SOMETHING STANDS THERE', 'on another object'); same(r.here, 'IT IS THERE NOW', 'where it stands'); same(r.room, 'NOT IN ITS ROOM', 'another room'); same(r.stair, 'NOT ON A STAIR', 'the arena door\'s stairs');
        same(r.door, 'NOT IN A DOORWAY', 'a doorway\'s floor'); same(r.doorFront, 'NOT IN FRONT OF A DOORWAY', 'the spot in front of a doorway'); same(r.site, 'NOT ON A LAUNCHER SITE', 'a launcher site'); same(r.item, 'NOT ON AN ITEM', 'an item'); same(r.unchanged, true, 'an object moved');
    });
    check('a barrier\'s two tiles go together: its second tile on a wall or another object refuses the place; turned (along y), its new footprint is checked whole; turned in place it may stand on its own old tiles', () => {
        const r = J(`(function(){ const o = {}, b = fluxObject('barrier_2'), B = fluxHere(b), F = _fp.F;
            o.turnInPlace = fluxCheck(b, B.x0, B.y0, true, { bodies: false }); o.turnInPlace = [o.turnInPlace.ok, o.turnInPlace.w, o.turnInPlace.h, o.turnInPlace.turned];
            const cr = fluxObject('crate_stack_3'), CS = fluxHere(cr); const saved = fluxHere(b); fluxMoveTo(b, CS.x0 - 1, CS.y0 + 1, false, { reach: false, bodies: false, quiet: true });   // (the barrier beside the crate stack: its second tile...)
            o.second = fluxCheck(b, CS.x0 - 1, CS.y0, false, { bodies: false }).why;   // ...would land on the stack
            o.turned = fluxCheck(b, CS.x0, CS.y0 - 1, true, { bodies: false }).why;   // turned, its second tile on the stack
            fluxMoveTo(b, saved.x0, saved.y0, false, { reach: false, bodies: false, quiet: true }); o.back = JSON.stringify(fluxHere(b)) === JSON.stringify(saved); return o; })()`);
        same(r.turnInPlace.join(), 'true,1,2,true', 'turned in place'); same(r.second, 'SOMETHING STANDS THERE', 'the second tile on an object'); same(r.turned, 'SOMETHING STANDS THERE', 'turned onto an object'); same(r.back, true, 'the barrier did not go back');
    });

    group('BODIES');
    check('nothing goes under a body: a creature, a follower or the player on any tile refuses the place (the player: YOU ARE STANDING THERE), shown and at the moment it is placed; a body beside it does not', () => {
        const r = J(`(function(){ const o = {}, c = fluxObject('crate_6'), C = fluxHere(c), to = [C.x0 - 2, C.y0 + 1]; __put(C.x0 + 6, C.y0 - 6); const fs = __fresh(['flux']);
            const e = __ant(to[0] + 0.3, to[1] - 0.2); o.ant = fluxCheck(c, to[0], to[1], false).why; e.x = to[0] + 1.0; e.y = to[1]; o.beside = fluxCheck(c, to[0], to[1], false).why || 'ok'; e.dead = true;
            fs[0].x = to[0]; fs[0].y = to[1]; o.follower = fluxCheck(c, to[0], to[1], false).why; fs[0].x = player.x; fs[0].y = player.y;
            __put(to[0] - 0.2, to[1] + 0.3); o.player = fluxCheck(c, to[0], to[1], false).why; __put(C.x0 + 6, C.y0 - 6);
            techChipTap(fs[0]); techFluxPick(c); techFluxTile(to[0], to[1]); const e2 = __ant(to[0], to[1]); o.atPlace = techFluxPlace(); o.aimUp = techAimActive(); o.still = JSON.stringify(fluxHere(c)) === JSON.stringify(C); o.ready = techReadyIn(fs[0]); e2.dead = true; techAimCancel(true);
            return o; })()`);
        same(r.ant, 'SOMEONE IS STANDING THERE', 'a creature'); same(r.beside, 'ok', 'a creature beside it'); same(r.follower, 'SOMEONE IS STANDING THERE', 'a follower'); same(r.player, 'YOU ARE STANDING THERE', 'the player');
        same([r.atPlace, r.aimUp, r.still, r.ready].join(), 'true,true,true,0', 'a body that came while it was shown: refused, the aim up, the crate unmoved, no wait');
    });

    group('THE FLOOR IS NEVER CUT IN TWO');
    check('a barrier turned across the Sewers\' two-tile north ledge would cut it in two: refused; a place that cuts nothing is allowed. Checked against the map itself: each refused place does cut a stretch of floor in two when it is made, each allowed one does not (a barrier carried there for the test, its room set to the Sewers\')', () => {
        const r = J(`(function(){ const o = { refused: 0, allowed: 0, wrong: [] }, b = fluxObject('barrier_1'), p = _fp.P.solids.find(q => q.id === 'barrier_1'), home = fluxHere(b), room0 = b.room; b.room = p.room = 'sewers';
            const cells = partyRoomCells('sewers'); const tried = []; const cm0 = _fpComps(); const stretches = () => { _fp.comp = null; return new Set(_fpComps().values()).size; }; const n0 = new Set(cm0.values()).size;
            for (const [x, y] of cells) { for (const turn of [false, true]) { const c = fluxCheck(b, x, y, turn, { reach: false, bodies: false }); if (c.ok) tried.push([x, y, turn, true]); else if (c.why === 'IT WOULD SHUT A WAY THROUGH') tried.push([x, y, turn, false]); } }
            const cut = tried.filter(t => !t[3]), fine = tried.filter(t => t[3]); o.cutCount = cut.length; o.fineCount = fine.length;
            for (const t of cut.slice(0, 3).concat(fine.filter((f, i) => i % 97 === 0).slice(0, 3))) {
                const was = fluxHere(b), wasT = b.flux.turned, sz = fluxSize(b, t[2]); facilitySolidMove('barrier_1', t[0], t[1], sz.w, sz.h, t[2] ? !b.flux.turned : b.flux.turned); const n = stretches();
                if (t[3] ? n > n0 : n <= n0) o.wrong.push(t.join() + ':' + n0 + '>' + n); if (t[3]) o.allowed++; else o.refused++;
                const sz2 = { w: was.w, h: was.h }; facilitySolidMove('barrier_1', was.x0, was.y0, sz2.w, sz2.h, wasT); stretches(); }
            b.room = p.room = room0; const back = fluxHere(b); o.home = back.x0 === home.x0 && back.y0 === home.y0 && back.w === home.w; return o; })()`);
        ok(r.cutCount > 0, 'no place on the ledge cuts it'); ok(r.fineCount > 0, 'no allowed place'); same(r.refused, Math.min(3, r.cutCount), 'the refused places tried'); same(r.wrong.length, 0, 'the check and the map disagree: ' + r.wrong.join(' ')); same(r.home, true, 'the barrier did not come home');
    });

    group('ONE TRANSACTION IN THE MAP');
    check('after a move the map is as if built afresh: the floor\'s paint (the tile it left painted as floor, the tile it covers under it), the walkable cells and the world\'s tiles, the draw pieces, the stretches of floor (relabelled only where they changed), the bucket index; it walks where it stood and not where it stands', () => {
        const r = J(`(function(){ const o = {}, c = fluxObject('barrel_6'), C = fluxHere(c); __put(C.x0 - 6, C.y0 + 3); _fpComps(); const to = __ok(c); const m = fluxMoveTo(c, to[0], to[1], false);
            o.move = m.ok; o.walk = [facilityWalkable(C.x0, C.y0, _fp.F), facilityWalkable(to[0], to[1], _fp.F)]; o.audit = __audit(); return o; })()`);
        same(r.move, true, 'moved'); same(r.walk.join(), 'true,false', 'where it stood is floor, where it stands is not'); same(JSON.stringify(r.audit), JSON.stringify({ paint: 0, cells: 0, world: true, items: true, stretches: true, ix: true }), 'the map');
    });
    check('the routes: a creature walking through where the object goes plans again round it; the player\'s walk is planned again (to beside it, when its end is under it); units are never put inside it', () => {
        const r = J(`(function(){ const o = {}, c = fluxObject('barrier_2'), C = fluxHere(c); __put(C.x0 - 5, C.y0 + 4);
            const open = (x, y) => _fp.cellsP.has(x + ',' + y), to = [...fluxGrid(c, false)].filter(([k, q]) => q.ok).map(([k]) => k.split(',').map(Number)).find(([x, y]) => [-3, -2, -1, 2, 3, 4].every(d => open(x + d, y)) && open(x, y - 1) && open(x + 1, y - 1) && open(x, y + 1) && open(x + 1, y + 1));
            const e = __ant(to[0] - 3, to[1]); e._fpPath = facilityPath(e.x, e.y, to[0] + 4, to[1]); o.routeBefore = !!e._fpPath && e._fpPath.length === 1;
            facilityWalkTo(to[0], to[1]); o.walking = !!player.fpPath;
            const m = fluxMoveTo(c, to[0], to[1], false); o.move = m.ok; o.dropped = e._fpPath === null;
            const p2 = facilityPath(e.x, e.y, to[0] + 4, to[1]); o.round = !!p2 && p2.every((q, i) => i === 0 || facilitySolidAt(q[0], q[1], _fp.F) !== c) && (function(){ for (let i = 1; i < p2.length; i++) if (!facilityCanStep(p2[i - 1][0], p2[i - 1][1], p2[i][0], p2[i][1], _fp.F)) return false; return true; })();
            const end = player.fpPath && player.fpPath[player.fpPath.length - 1]; o.playerEnd = !!end && facilitySolidAt(end[0], end[1], _fp.F) !== c && Math.hypot(end[0] - to[0], end[1] - to[1]) < 2;
            for (let i = 0; i < 200; i++) { frame++; facilityPlayerStep(); } o.playerOut = facilitySolidAt(player.x, player.y, _fp.F) !== c; e.dead = true; return o; })()`);
        same(r.routeBefore, true, 'fixture: a straight route through the place'); same(r.walking, true, 'fixture: the walk'); same(r.move, true, 'moved'); same(r.dropped, true, 'the route in flight was kept');
        same(r.round, true, 'the new route goes through it'); same(r.playerEnd, true, 'the player\'s walk still ends under it'); same(r.playerOut, true, 'the player walked into it');
    });
    check('repeated use: twelve moves of the arena\'s objects one after another (barriers turned too) leave the map as if built afresh each time, and as many stretches of floor as before (no room or door shut)', () => {
        const r = J(`(function(){ const o = { moves: 0, bad: [] }; __put(30, 60); let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
            const n0 = (function(){ _fp.comp = null; return new Set(_fpComps().values()).size; })();
            for (let i = 0; i < 12; i++) { const s = fluxObjects()[Math.floor(rnd() * 9)], turn = fluxCanTurn(s) && rnd() < 0.5, opts = [...fluxGrid(s, turn)].filter(([k, c]) => c.ok && !fluxBodyOn(c.cells)); if (!opts.length) continue;
                const [x, y] = opts[Math.floor(rnd() * opts.length)][0].split(',').map(Number); if (fluxMoveTo(s, x, y, turn).ok) o.moves++; const a = __audit(); if (a.paint || a.cells || !a.world || !a.items || !a.stretches || !a.ix) o.bad.push(i + ':' + JSON.stringify(a)); }
            o.stretches = [n0, new Set(_fpComps().values()).size]; return o; })()`);
        ok(r.moves >= 10, 'too few moves: ' + r.moves); same(r.bad.length, 0, 'the map after a move: ' + r.bad.join(' ')); same(r.stretches[1], r.stretches[0], 'the stretches of floor');
    });

    group('THE ABILITY: THE AIM, CANCELLING, THE WAIT');
    check('an aim called off at any step (✕ CALL OFF, the chip again) leaves the object where it was and costs no wait; a place refused by ✓ PLACE leaves the aim up; the place is shown again after ⟳ ROTATE (a barrier) and the grid of each turn is its own', () => {
        const r = J(`(function(){ const o = {}, b = fluxObject('barrier_2'), B = fluxHere(b); __put(B.x0 + 1, B.y0 + 4); const t = __fresh(['flux'])[0];
            techChipTap(t); techAimCancel(true); techChipTap(t); techFluxPick(b); techChipTap(t); o.chipAgain = techAimActive();
            techChipTap(t); techFluxPick(b); techFluxTile(B.x0, B.y0 - 1); techAimCancel(); o.cancel = [JSON.stringify(fluxHere(b)) === JSON.stringify(B), techReadyIn(t)];
            techChipTap(t); techFluxPick(b); const bad = [B.x0, B.y0]; const c0 = fluxCheck(b, bad[0], bad[1], false); techFluxTile(bad[0], bad[1]); o.badPlace = [c0.ok, techFluxPlace(), techAimActive(), techReadyIn(t)];
            o.turn = [techFluxRotate(), techAim.flux.turn, !!techAim.flux.grid[1], techAim.flux.grid[0] !== techAim.flux.grid[1]]; techAimCancel(true);
            techChipTap(t); techFluxPick(fluxObject('crate_4')); o.crateTurn = [techFluxRotate(), techAim.flux.turn]; techAimCancel(true); return o; })()`);
        same(r.chipAgain, false, 'the chip again did not call it off'); same(r.cancel.join(), 'true,0', 'cancelled');
        ok(r.badPlace[0] === false, 'fixture: a bad place (' + r.badPlace + ')'); same(r.badPlace.slice(1).join(), 'true,true,0', 'a refused place');
        same(r.turn.join(), 'true,true,true,true', 'the turn'); same(r.crateTurn.join(), 'false,false', 'a crate turned');
    });
    check('the wait: 60 s from when it is placed, set through the cooldown path (techCooldown: the cards\' share and DOUBLE CHARGE apply, tried in tests/series2.js and tests/series2abilities.js); a technician still waiting cannot use it', () => {
        const r = J(`(function(){ const o = {}, t = __fresh(['flux'])[0]; o.cd = TECH_AB.flux.cooldown; o.can = techAbilityCan(t).ok; t._abReadyAt = frame + 600; o.waiting = techAbilityCan(t).why; t._abReadyAt = frame;
            o.path = /techFluxMoveAt[\\s\\S]*?techCooldown\\(tech, TECH_AB\\.flux\\.cooldown\\)/.test(techFluxMoveAt.toString()); return o; })()`);
        same(r.cd, 3600, 'the cooldown'); same(r.can, true, 'ready'); same(r.waiting, 'MOVE READY IN 10 S', 'waiting'); same(r.path, true, 'the cooldown does not go through techCooldown');
    });

    group('THE SAVE');
    {
        const store = {}; const A = await boot(store);
        A.run(`_fp.saveReady = true; fluxMoveTo(fluxObject('barrier_1'), 31, 48, true, { reach: false, bodies: false }); fluxMoveTo(fluxObject('crate_4'), 47, 56, false, { reach: false, bodies: false }); fluxMoveTo(fluxObject('crate_5'), 48, 57, false, { reach: false, bodies: false }); __put(31, 48.4); facilitySaveWrite();`);
        const saved = JSON.parse(store.conduit_fp_save);
        const keep = JSON.stringify(saved.moved);
        saved.moved.push({ id: 'floodlight_1', x: 1, y: 1, t: 0 }, { id: 'crate_6', x: 'a', y: 2 }, { id: 'barrel_5', x: 2, y: 2, t: 0 }, null, 7);
        store.conduit_fp_save = JSON.stringify(saved);
        const B = await boot(store);
        const r = B.J(`({ b1: fluxHere(fluxObject('barrier_1')), t: fluxObject('barrier_1').flux.turned, c4: fluxHere(fluxObject('crate_4')), c5: fluxHere(fluxObject('crate_5')), b5: fluxHere(fluxObject('barrel_5')), c6: fluxHere(fluxObject('crate_6')),
            moved: JSON.stringify(_fp.moved), walk: [facilityWalkable(31, 48, _fp.F), facilityWalkable(30, 47, _fp.F)], playerOut: facilitySolidAt(player.x, player.y, _fp.F) === null, audit: __audit() })`);
        const old = {}; const s2 = JSON.parse(store.conduit_fp_save); delete s2.moved; old.conduit_fp_save = JSON.stringify(s2); const C = await boot(old);
        const r2 = C.J(`({ moved: _fp.moved.length, b1: fluxHere(fluxObject('barrier_1')) })`);
        check('each moved object\'s place and turn is saved (the save\'s `moved`) and put back when the game loads, before the player\'s spot (one saved standing where an object now is goes to the start); an entry that cannot go where it was saved, or is not an object that moves, changes nothing; a game saved before FLUX MOVE moves nothing', () => {
            same(keep, JSON.stringify([{ id: 'barrier_1', x: 31, y: 48, t: 1 }, { id: 'crate_4', x: 47, y: 56, t: 0 }, { id: 'crate_5', x: 48, y: 57, t: 0 }]), 'what was saved');
            same([r.b1.x0, r.b1.y0, r.b1.w, r.b1.h, r.t].join(), '31,48,1,2,true', 'the barrier, turned'); same([r.c4.x0, r.c4.y0, r.c5.x0, r.c5.y0].join(), '47,56,48,57', 'the crates (one into the other\'s old place)');
            same([r.b5.x0, r.b5.y0, r.c6.x0, r.c6.y0].join(), '49,43,49,58', 'the bad entries moved something'); same(r.moved, keep, 'the moves kept');
            same(r.walk.join(), 'false,true', 'the floor after the load'); same(r.playerOut, true, 'the player put inside the barrier'); same(JSON.stringify(r.audit), JSON.stringify({ paint: 0, cells: 0, world: true, items: true, stretches: true, ix: true }), 'the map after the load');
            same(r2.moved, 0, 'an old save moved something'); same([r2.b1.x0, r2.b1.y0, r2.b1.w].join(), '30,47,2', 'an old save\'s barrier');
        });
    }

    group('THE TURNED BARRIER, AND TELEGRAB GONE');
    check('the barrier has a sprite for each way round (barrier, barrier.1x2: the same model with x and z swapped, the same size); a turned barrier draws it', () => {
        const r = J(`(function(){ const A = PROP_ATLAS.cargo.cells, a = A['barrier'], b = A['barrier.1x2']; return { both: !!a && !!b, size: !!a && !!b && a.w === b.w && a.h === b.h, r21: _psResolve('cargo', 'barrier', '2x1', null, 0), r12: _psResolve('cargo', 'barrier', '1x2', null, 0) }; })()`);
        same(r.both && r.size, true, 'the two sprites'); same(r.r21 + ',' + r.r12, 'barrier,barrier.1x2', 'the sprite chosen for each way round');
        ok(/'barrier', 'barrier\.1x2'/.test(rd('design/props/models/cargo.js')), 'the model\'s variants');
    });
    check('Telegrab is gone: no grab numbers, no item aim, no flying items, no puzzle route; the flux technician\'s INFO describes FLUX MOVE', () => {
        const r = J(`(function(){ const t = __fresh(['flux'])[0], I = techAbilityInfo(t); return { grab: typeof TECH_AB.grab, fns: ['techGrabAt', 'techItemAtScreen', '_techGrabTick', 'techAimPickItem'].map(n => typeof globalThis[n]), grabs: typeof techGrabs, route: PUZZLES.sewer_sample.solutions.map(s => s.id).join(), info: [I.h, I.rows.map(x => x[0]).join()] }; })()`);
        same(r.grab, 'undefined', 'TECH_AB.grab'); same(r.fns.join(), 'undefined,undefined,undefined,undefined', 'its functions'); same(r.grabs, 'undefined', 'techGrabs'); same(r.route, 'ride,drill,ice', 'the puzzle\'s routes (no grab; the ice bridge since build 2026-11-07bb)');
        same(r.info.join('|'), 'ABILITY · FLUX MOVE|REACH,OBJECTS,IT MAY NOT,COOLDOWN,FIRST WAIT,READY', 'the INFO');
        ok(!/telegrab|techGrab/i.test(rd('js/techabilities.js').replace(/\/\/.*$/gm, '')), 'Telegrab in js/techabilities.js\'s code');
    });

    group('IN THE REAL PAGE (tablet and phone)');
    for (const [w, h] of [[1180, 820], [390, 844]]) {
        const b = measure(w, h);
        if (b === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(b, 'the probe produced nothing'); same(b.err, undefined, 'the probe threw: ' + (b && b.err)); });
        if (!b || b.err) continue;
        check(w + 'x' + h + ': the chip (✦ MOVE); the first prompt has no buttons; a tap on the barrier picks it and shows ⟳ ROTATE and ✓ PLACE; the grid is drawn in violet; a tile, ⟳ ROTATE, ✓ PLACE: the barrier is there, turned, and the chip waits', () => {
            same(b.chip, '✦ MOVE', 'the chip'); same([b.first.need, b.first.rotate, b.first.place].join(), 'object,false,false', 'the first step'); ok(/^FLUX MOVE · TAP AN OBJECT/.test(b.first.prompt), b.first.prompt);
            same([b.picked.id, b.picked.need, b.picked.rotate, b.picked.place].join(), 'barrier_1,place,true,true', 'the barrier picked');
            ok(b.gridPixel[0] > 70 && b.gridPixel[2] > 90 && b.gridPixel[2] >= b.gridPixel[1], 'the grid\'s violet: ' + b.gridPixel);
            same([b.preview.turn, /✓ PLACE IT$/.test(b.preview.prompt)].join(), 'true,true', 'the preview: ' + b.preview.prompt);
            same([b.placed.aim, b.placed.at.join(' '), b.placed.turned, b.placed.chip].join(), 'false,31 48 1 2,true,✦ 60 S', 'placed');
        });
        check(w + 'x' + h + ': by the keys: a barrel has no ⟳ ROTATE and R does not turn it; Enter places it; Escape calls an aim off and nothing moves', () => {
            same([b.barrel.id, b.barrel.rotate, b.barrel.place, b.barrel.turn].join(), 'barrel_5,false,true,false', 'the barrel'); same([b.barrel.moved, b.barrel.aim].join(), 'true,false', 'Enter');
            same([b.escape.aim, b.escape.same, b.escape.ready].join(), 'false,true,0', 'Escape');
        });
        check(w + 'x' + h + ': the prompt bar and its three buttons fit in the screen', () => {
            ok(b.bar.left >= 0 && b.bar.right <= b.bar.vw, 'the bar: ' + JSON.stringify(b.bar)); same(b.bar.buttons.join(), 'true,true,true', 'the buttons');
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
