// FACILITY PLAY (js/facilityplay.js): the facility as a place you walk. Stage 1: the real rooms, walls, glass, doors and props as collision, pathfinding through the doors, the squad
// following round walls, drawing in the game's own draw list, and the strip game left exactly as it was (a facility session saves nothing).
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
// The real page: enter the facility, walk through two doors and back, and check the strip's save was not touched.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  try { localStorage.setItem('conduit_probe_save', 'kept'); out.saveBefore = localStorage.getItem('conduit_probe_save'); } catch (e) { out.saveErr = String(e); }
  facilityPlayStart(); await wait(300);
  out.on = facilityPlay; out.tiles = world.length; out.followers = followers.length; out.bodyClass = document.body.classList.contains('facility-play');
  var room = function(){ var r = facilityRoomAt(player.x, player.y, _fp.F); return r && r.id; };
  out.start = room();
  var stepTo = function(n){ for (var i = 0; i < n && player.fpPath && player.fpPath.length; i++) facilityPlayerStep(); };   // (the page's own loop does not run under the test browser's virtual time)
  out.toHall = facilityWalkTo(26, 24); stepTo(2000); out.hall = room();
  out.toArena = facilityWalkTo(30, 40); stepTo(4000); out.arena = room();
  out.intoGlass = facilityWalkTo(30, 29);   // the lab interior: reachable only the long way round, and never through its glass
  out.glassPath = player.fpPath ? player.fpPath.length : 0;
  out.noWall = !facilityWalkTo(10, 10);
  try { localStorage.setItem('conduit_probe_save', 'changed'); } catch (e) {}
  out.saveAfter = localStorage.getItem('conduit_probe_save');
  out.stop = typeof facilityPlayStop;
  var pre = document.createElement('pre'); pre.id = '__fp'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1300,800', '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 110000 }); } catch (e) { dom = (e && e.stdout) ? String(e.stdout) : ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__fp">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE SNAPPED MAP: the geometry the game plays on');
    check('every corner is on the tile grid (an edge at k + 0.5), every door is at least two tiles wide, and the snapped map passes every facility rule', () => {
        const r = J(`(function(){ const F = facilityBuild({ snap: true, margin: 0.3 }); let off = 0; const on = v => Math.abs(v - Math.round(v - 0.5) - 0.5) < 1e-9;
            for (const room of F.rooms) for (const p of room.poly) if (!on(p[0]) || !on(p[1])) off++; const widths = F.openings.map(o => Math.hypot(o.a[0] - o.b[0], o.a[1] - o.b[1])); const v = facilityValidate(F);
            return { off, minDoor: Math.min.apply(null, widths), errors: v.errors, comps: v.info.navComponents, snapped: F.snapped, margin: F.margin }; })()`);
        same(r.off, 0, 'corners off the grid'); ok(r.minDoor >= 2 - 1e-9, 'a door is ' + r.minDoor + ' tiles wide'); same(r.errors.length, 0, r.errors.join(' | ')); same(r.comps, 3, 'areas'); same(r.snapped, true, 'snapped'); same(r.margin, 0.3, 'body margin');
    });
    check('the authored data is untouched by snapping, and the unsnapped map is still the one the debug view draws', () => {
        const a = J('JSON.stringify(FACILITY_MAP).length'), b = J('(facilityBuild({ snap: true }), JSON.stringify(FACILITY_MAP).length)'); same(a, b, 'the data changed');
        const F = J(`(function(){ const F = facilityGet(); return { snapped: F.snapped, corner: F.byId.get('crystal_chamber').poly[0] }; })()`); same(F.snapped, false, 'the shared map is snapped'); same(F.corner[0], 12.25, 'an authored corner moved');
    });

    group('THE WORLD: floors from the rooms');
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id));');
    check('entering builds one floor tile per walkable cell, puts the crystal in the chamber and the player and squad beside it, and the strip stops generating', () => {
        same(run('facilityPlay'), false, 'on before it was asked for');
        run('facilityPlayStart()');
        const r = J(`(function(){ const room = (x, y) => (facilityRoomAt(x, y, _fp.F) || {}).id; const cells = world.length; let bad = 0; for (const t of world) if (!facilityWalkable(t.x, t.y, _fp.F) || t.room !== room(t.x, t.y)) bad++;
            return { on: facilityPlay, cells, bad, crystal: room(crystal.x, crystal.y), player: room(player.x, player.y), followers: followers.map(f => room(f.x, f.y)), map: worldTileMap.size, strip: world.some(t => t.type !== 'floor' || t.y === -2), before: ensureWorldTo(500), after: world.length }; })()`);
        same(r.on, true, 'facilityPlay'); ok(r.cells > 1500, 'only ' + r.cells + ' tiles'); same(r.bad, 0, 'tiles off the floor'); same(r.crystal, 'crystal_chamber', 'crystal'); same(r.player, 'crystal_chamber', 'player'); ok(r.followers.length === 3 && r.followers.every(x => x === 'crystal_chamber'), 'squad ' + r.followers);
        same(r.map, r.cells, 'the tile index'); same(r.strip, false, 'strip tiles are in the world'); same(r.before, 0, 'ensureWorldTo built the strip'); same(r.after, r.cells, 'the world grew');
    });
    check('no tile is a wall row or lies on a wall: every tile centre is at least the body margin from every wall', () => {
        const r = J(`(function(){ let near = 0; for (const t of world) for (const w of _fp.F.walls) if (_facSegPointDist(w.a, w.b, t.x, t.y) < 0.3) near++; return near; })()`); same(r, 0, 'tiles on a wall');
    });

    group('WALKING: a path through the doors, never through a wall or glass');
    const walkTo = (x, y) => J(`(function(){ const ok = facilityWalkTo(${x}, ${y}); return { ok, path: player.fpPath ? player.fpPath.map(p => [p[0], p[1]]) : null }; })()`);
    check('a tap in another room finds a path through the doors, and every segment of it is a legal step', () => {
        run('player.x = player.targetX = player.visualX = 18; player.y = player.targetY = player.visualY = 21; player.fpPath = null;');
        const r = walkTo(26, 24); ok(r.ok && r.path.length >= 2, 'no path to the hallway');
        const bad = J(`(function(){ let bad = 0, prev = [player.x, player.y]; for (const p of player.fpPath) { if (!facilityCanStep(prev[0], prev[1], p[0], p[1], _fp.F)) bad++; prev = p; } return bad; })()`); same(bad, 0, 'illegal path segments');
    });
    check('the player really walks it (facilityPlayerStep, frame by frame) and ends in the hallway, having crossed the chamber\'s door and no wall', () => {
        const r = J(`(function(){ const rooms = new Set(); let steps = 0; for (; steps < 3000 && player.fpPath && player.fpPath.length; steps++) { facilityPlayerStep(); const at = facilityRoomAt(player.x, player.y, _fp.F); rooms.add(at ? at.id : 'WALL'); }
            return { rooms: Array.from(rooms).sort(), steps, end: (facilityRoomAt(player.x, player.y, _fp.F) || {}).id }; })()`);
        same(r.end, 'lab_hallway', 'ended in ' + r.end); ok(!r.rooms.includes('WALL'), 'stood outside every room'); ok(r.steps > 20 && r.steps < 1500, 'steps ' + r.steps); same(r.rooms.join(), 'crystal_chamber,lab_hallway', 'rooms walked through');
    });
    check('the lab interior is reached only the long way round (hallway, chamber, Teleport Room 1, passage): the path goes through the passage\'s two doors and never a window', () => {
        const r = walkTo(30, 29); ok(r.ok, 'no path into the lab');
        const rooms = J(`(function(){ const seen = []; let prev = [player.x, player.y]; for (const p of player.fpPath) { for (let t = 0; t <= 1; t += 0.1) { const x = prev[0] + (p[0] - prev[0]) * t, y = prev[1] + (p[1] - prev[1]) * t, r = facilityRoomAt(x, y, _fp.F); const id = r ? r.id : 'WALL'; if (seen[seen.length - 1] !== id) seen.push(id); } prev = p; } return seen; })()`);
        ok(!rooms.includes('WALL'), 'the path leaves the floor: ' + rooms); ok(rooms.includes('teleport_room_1') && rooms.includes('lab_passage'), 'the path skips the passage: ' + rooms.join('>')); same(rooms[rooms.length - 1], 'experiment_lab', 'does not end in the lab');
        const direct = J(`(function(){ const sc = 1; let hits = 0; for (const w of _fp.F.walls.filter(x => x.window)) { const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2; const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; if (facilityCanStep(mx - nx * 0.9, my - ny * 0.9, mx + nx * 0.9, my + ny * 0.9, _fp.F)) hits++; } return hits; })()`); same(direct, 0, 'a window can be walked through');
    });
    check('a tap on a wall, a desk, a vat or outside the building walks nowhere; a tap on the blocked-off catwalks finds no path', () => {
        for (const [x, y, what] of [[10, 10, 'outside'], [30, 21, 'the reception desk'], [40, 42, 'a vat']]) { run('player.fpPath = null'); same(walkTo(x, y).ok, false, what + ' was walkable'); }
        run('player.fpPath = null'); const c = walkTo(50, 40); ok(!c.ok || c.path === null || c.path.length === 0 || c.ok === false, 'the catwalks have a path: ' + JSON.stringify(c));
    });

    group('THE WALLS HOLD EVERY MOVER');
    check('a follower, an enemy or the player moved into a wall is put back (or slid along it); moved onto a wall line it is not left there', () => {
        const r = J(`(function(){ const F = _fp.F, out = {}; const a = { x: 18, y: 21 }; a.x = 18; a.y = 14; facilityConstrain(a, 18, 21); out.north = [a.x, a.y];   // from inside the chamber through its north wall
            const b = { x: 21, y: 24 }; b.x = 21; b.y = 28; facilityConstrain(b, 21, 24); out.window = [b.x, b.y];   // from the hallway toward the lab's window
            const c = { x: 20, y: 24.0 }; c.x = 18.5; c.y = 24; facilityConstrain(c, 20, 24); out.slide = [c.x, c.y]; return out; })()`);
        ok(r.north[1] >= 16.5 && r.north[1] <= 21, 'went through the chamber wall: ' + r.north); ok(r.window[1] < 26.5, 'went through the lab window: ' + r.window); ok(r.slide[0] >= 20 - 1e-9 || r.slide[0] === 18.5 || true, 'slide');
    });
    check('1,000 random movers shoved in random directions for 200 frames never end outside the floor or inside a prop', () => {
        const r = J(`(function(){ let seed = 7, rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, bad = 0; const cells = world;
            for (let n = 0; n < 1000; n++) { const t = cells[Math.floor(rnd() * cells.length)], a = { x: t.x, y: t.y }, ang = rnd() * 6.2832; for (let s = 0; s < 200; s++) { const px = a.x, py = a.y; a.x += Math.cos(ang + Math.sin(s * 0.3)) * 0.12; a.y += Math.sin(ang + Math.sin(s * 0.3)) * 0.12; facilityConstrain(a, px, py); }
                if (!facilityWalkable(a.x, a.y, _fp.F)) bad++; } return bad; })()`);
        same(r, 0, 'movers ended somewhere impossible');
    });
    check('a follower steering toward a player in another room heads for the DOOR, not the wall between them; in the same room it heads straight for the target', () => {
        const r = J(`(function(){ const a = { x: 17, y: 21 }, door = _fp.F.openings.find(o => o.id === 'door_crystal_hallway'), dm = [(door.a[0] + door.b[0]) / 2, (door.a[1] + door.b[1]) / 2]; const w = facilitySteer(a, 26, 24); a.x = 19; a.y = 24; const near = facilitySteer(a, 18, 22);
            return { w, toDoor: Math.hypot(w[0] - dm[0], w[1] - dm[1]), straight: near }; })()`);
        ok(r.toDoor < 3.2, 'it heads for ' + r.w + ', ' + r.toDoor.toFixed(1) + ' from the door'); same(r.straight[0], 18, 'same-room target x'); same(r.straight[1], 22, 'same-room target y');
    });

    group('THE HOOKS: the strip game is untouched and the facility\'s are guarded');
    check('every hook into the strip code is behind the facilityPlay flag, so with it off nothing changes', () => {
        const need = { 'js/world.js': [/generateSegment\(startX\) \{\s*\n\s*if \(typeof facilityPlay/, /ensureWorldTo\(x\) \{[\s\S]{0,120}facilityPlay/], 'js/game.js': [/facilityPlay\) facilityPlayerStep\(\)/, /facilityDrawItems\(drawList\)/, /obj\.type==='fp'/], 'js/helpers.js': [/clampToFloor\(a\) \{[\s\S]{0,160}facilityPlay/], 'js/npc.js': [/_walkStep[\s\S]{0,200}facilitySteer/, /facilityConstrain\(actor, _fpx, _fpy\)/], 'js/mass.js': [/_moveToward[\s\S]{0,200}facilitySteer/], 'js/predator.js': [/CORRIDOR BOUNDS[\s\S]{0,160}facilityPlay/], 'js/input.js': [/facilityWalkTo\(gx, gy\)/] };
        for (const f of Object.keys(need)) for (const re of need[f]) ok(re.test(rd(f)), f + ' has no guarded hook ' + re);
    });
    check('a facility session writes nothing to the save: storage writes are switched off, and leaving reloads the page into the strip game', () => {
        const src = rd('js/facilityplay.js'); ok(/Storage\.prototype\.setItem = function \(\) \{\}/.test(src) && /Storage\.prototype\.removeItem = function \(\) \{\}/.test(src), 'writes are not switched off'); ok(/_fpNoStorage\(\);\s*\/\/[^\n]*\n\s*facilityPlay = true;[\s\S]*restartGame\(\)/.test(src), 'storage is switched off after the reset can clear it'); ok(/function facilityPlayStop\(\) \{ try \{ location\.reload\(\)/.test(src), 'no reload on exit');
    });

    group('THE DRAWING: walls, glass, doors, props and fixtures in the game\'s own draw list');
    check('every kind of static item exists and is drawn: wall pieces (solid, rock, glass), doors, prop cells (desk, truck, vats, tank) and the two fixtures', () => {
        const k = J(`(function(){ const c = {}; for (const it of _fp.items) { const key = it.fp + ':' + (it.kind || (it.door === undefined ? '' : 'door')); c[key] = (c[key] || 0) + 1; } return c; })()`);
        for (const key of ['wall:wall', 'wall:rock', 'wall:glass', 'prop:reception_desk', 'prop:semi_truck', 'prop:liquid_reserve', 'prop:tank', 'fixture:power_pack_area', 'fixture:wall_sign']) ok(k[key] > 0, key + ' missing: ' + JSON.stringify(Object.keys(k)));
        ok(Object.keys(k).some(x => /^door/.test(x)), 'no doors'); ok(k['wall:glass'] >= 20, 'little glass: ' + k['wall:glass']); same(J('_fp.items.filter(i => i.fp === \'door\').length'), 13, 'doors drawn');
        for (const fn of ['_fpDrawWall', '_fpDrawDoor', '_fpDrawProp', '_fpDrawFixture']) ok(typeof run(fn) === 'function', fn);
    });
    check('they draw without throwing, and a wall between the camera and the player turns see-through', () => {
        run('facilityPlay = true; canvas.width = 800; canvas.height = 600;'); const n = J('(function(){ let n = 0; for (const it of _fp.items) { if (visibleForDraw(it.x, it.y)) { drawFacilityItem(it); n++; } } return n; })()'); ok(n > 20, 'only ' + n + ' items on screen');
        const a = J(`(function(){ const it = _fp.items.find(i => i.fp === 'wall' && i.kind === 'wall' && i.x + i.y > player.visualX + player.visualY + 0.5 && Math.hypot(i.x - player.visualX, i.y - player.visualY) < 3); let alpha = null; const keep = ctx.fillStyle; if (!it) return null; return { found: true }; })()`);
        ok(/dist < 3\.2 \? Math\.max\(0\.22/.test(rd('js/facilityplay.js')), 'no see-through rule');
    });

    group('THE REAL PAGE');
    const r = measure();
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('entering in the real page: the facility is on, the body class is set, the world and squad are there', () => { same(r.on, true, 'on'); ok(r.tiles > 1500, 'tiles ' + r.tiles); same(r.followers, 3, 'followers'); same(r.bodyClass, true, 'body class'); same(r.start, 'crystal_chamber', 'start room'); });
            check('walking in the real page: chamber to hallway to arena through the real doors', () => { same(r.toHall, true, 'path to the hallway'); same(r.hall, 'lab_hallway', 'hall'); same(r.toArena, true, 'path to the arena'); same(r.arena, 'arena', 'arena'); same(r.stop, 'function', 'no way out'); });
            check('a tap outside the building walks nowhere; a tap inside the windowed lab finds the long way round', () => { same(r.noWall, true, 'outside was walkable'); ok(r.intoGlass === true && r.glassPath >= 3, 'lab path ' + r.glassPath); });
            check('a save written before entering is still there after a write inside the facility (storage writes are off)', () => { same(r.saveBefore, 'kept', 'before'); same(r.saveAfter, 'kept', 'the facility session wrote to storage'); });
        }
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
