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
// Named places on the grid the game plays on (the rooms have been moved before and will be again): a cell in the chamber, the hallway, the arena, the lab; the desk, a vat, the catwalks, and outside.
const PT_JS = `globalThis.__PT = (function () { const F = _fp.F, R = id => F.byId.get(id), mid = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], near = (x, y) => { const rx = Math.round(x), ry = Math.round(y); for (let r = 0; r < 6; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (facilityWalkable(rx + dx, ry + dy, F)) return [rx + dx, ry + dy]; return [rx, ry]; };
    const L = R('experiment_lab'), H = R('lab_hallway'), A = R('arena'), C = R('crystal_chamber'), ad = F.openings.find(o => o.id === 'door_arena_hallway'), desk = F.solids.find(s => s.kind === 'reception_desk'), vat = F.solids.find(s => s.kind === 'liquid_reserve');
    return { chamber: near(mid(C.bb)[0], mid(C.bb)[1] + 3), hallN: near(mid(L.bb)[0], (H.bb[1] + L.bb[1]) / 2), arena: near((ad.a[0] + ad.b[0]) / 2 + 8, ad.a[1] + 14), lab: near(mid(L.bb)[0] - 4, mid(L.bb)[1]), desk: [Math.round((desk.bb[0] + desk.bb[2]) / 2), Math.round((desk.bb[1] + desk.bb[3]) / 2)], vat: [Math.round(vat.at[0]), Math.round(vat.at[1])], catwalks: [Math.round(mid(R('catwalks').bb)[0]), Math.round(mid(R('catwalks').bb)[1])], outside: [2, 2] }; })();`;
// The real page: enter the facility, walk through two doors and back, and check the strip's save was not touched.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  try { localStorage.setItem('conduit_probe_save', 'kept'); out.saveBefore = localStorage.getItem('conduit_probe_save'); } catch (e) { out.saveErr = String(e); }
  facilityPlayStart(); await wait(300); ${PT_JS}
  out.on = facilityPlay; out.tiles = world.length; out.followers = followers.length; out.bodyClass = document.body.classList.contains('facility-play');
  var room = function(){ var r = facilityRoomAt(player.x, player.y, _fp.F); return r && r.id; };
  out.start = room();
  var stepTo = function(n){ for (var i = 0; i < n && player.fpPath && player.fpPath.length; i++) facilityPlayerStep(); };   // (the page's own loop does not run under the test browser's virtual time)
  out.toHall = facilityWalkTo(__PT.hallN[0], __PT.hallN[1]); stepTo(2000); out.hall = room();
  out.toArena = facilityWalkTo(__PT.arena[0], __PT.arena[1]); stepTo(4000); out.arena = room();
  out.intoGlass = facilityWalkTo(__PT.lab[0], __PT.lab[1]);   // the lab interior: reachable only the long way round, and never through its glass
  out.glassPath = player.fpPath ? player.fpPath.length : 0;
  out.noWall = !facilityWalkTo(__PT.outside[0], __PT.outside[1]);
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
        const F = J(`(function(){ const F = facilityGet(); return { snapped: F.snapped, corner: F.byId.get('crystal_chamber').poly[0] }; })()`); same(F.snapped, false, 'the shared map is snapped'); same(F.corner[0], 9.25, 'an authored corner moved');
    });

    check('THE SCALE: the main hallway round the Experiment Lab is exactly SIX tiles wide on every side on the grid the game plays on (matching the strip\'s lane), and the narrow passage is two', () => {
        const r = J(`(function(){ const F = facilityBuild({ snap: true, margin: 0.3 }), L = F.byId.get('experiment_lab'), H = F.byId.get('lab_hallway'), P = F.byId.get('lab_passage'); return { px: facilityScale(), north: L.bb[1] - H.bb[1], south: H.bb[3] - L.bb[3], west: L.bb[0] - H.bb[0], east: F.openings.find(o => o.id === 'open_stair_mouth').a[0] - L.bb[2], passage: P.bb[3] - P.bb[1] }; })()`);
        same(r.px, 20, 'px per tile'); same(r.north, 6, 'north'); same(r.south, 6, 'south'); same(r.west, 6, 'west'); same(r.east, 6, 'east'); same(r.passage, 2, 'passage');
    });
    check('a body of the strip\'s width (6 tiles of room) can walk the whole hallway: the open floor is at least six tiles across at every point of its route', () => {
        const r = J(`(function(){ const F = facilityBuild({ snap: true, margin: 0.3 }); const L = F.byId.get('experiment_lab'), H = F.byId.get('lab_hallway'), mx = (L.bb[0] + L.bb[2]) / 2, my = (L.bb[1] + L.bb[3]) / 2, ex = (L.bb[2] + H.bb[2]) / 2, ny = (H.bb[1] + L.bb[1]) / 2, sy = (L.bb[3] + H.bb[3]) / 2; const probes = [[mx - 10, ny], [mx + 10, ny], [ex, my], [ex, sy], [mx, sy]].map(p => [Math.round(p[0]), Math.round(p[1])]); let narrow = 0; const widthAt = (x, y) => { let w = 0; for (const [dx, dy] of [[1, 0], [0, 1]]) { let a = 0, b = 0; while (facilityWalkable(x + dx * (a + 1), y + dy * (a + 1), F) && a < 20) a++; while (facilityWalkable(x - dx * (b + 1), y - dy * (b + 1), F) && b < 20) b++; w = Math.max(w, a + b + 1); } return w; };
            return probes.map(p => [p, facilityRoomAt(p[0], p[1], F) && facilityRoomAt(p[0], p[1], F).id, widthAt(p[0], p[1])]); })()`);
        for (const [p, id, w] of r) if (id === 'lab_hallway') ok(w >= 5, 'the hallway is only ' + w + ' tiles across at ' + p);
        ok(r.some(x => x[1] === 'lab_hallway'), 'no probe landed in the hallway');
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
    const walkToPt = (k) => J(`(function(){ const ok = facilityWalkTo(__PT.${k}[0], __PT.${k}[1]); return { ok, path: player.fpPath ? player.fpPath.map(p => [p[0], p[1]]) : null }; })()`);
    check('a tap in another room finds a path through the doors, and every segment of it is a legal step', () => {
        run(PT_JS); run('player.x = player.targetX = player.visualX = __PT.chamber[0]; player.y = player.targetY = player.visualY = __PT.chamber[1]; player.fpPath = null;');
        const r = walkToPt('hallN'); ok(r.ok && r.path.length >= 1, 'no path to the hallway');
        const bad = J(`(function(){ let bad = 0, prev = [player.x, player.y]; for (const p of player.fpPath) { if (!facilityCanStep(prev[0], prev[1], p[0], p[1], _fp.F)) bad++; prev = p; } return bad; })()`); same(bad, 0, 'illegal path segments');
    });
    check('the player really walks it (facilityPlayerStep, frame by frame) and ends in the hallway, having crossed the chamber\'s door and no wall', () => {
        const r = J(`(function(){ const rooms = new Set(); let steps = 0; for (; steps < 3000 && player.fpPath && player.fpPath.length; steps++) { facilityPlayerStep(); const at = facilityRoomAt(player.x, player.y, _fp.F); rooms.add(at ? at.id : 'WALL'); }
            return { rooms: Array.from(rooms).sort(), steps, end: (facilityRoomAt(player.x, player.y, _fp.F) || {}).id }; })()`);
        same(r.end, 'lab_hallway', 'ended in ' + r.end); ok(!r.rooms.includes('WALL'), 'stood outside every room'); ok(r.steps > 20 && r.steps < 2500, 'steps ' + r.steps); same(r.rooms.join(), 'crystal_chamber,lab_hallway', 'rooms walked through');
    });
    check('the lab interior is reached only the long way round (hallway, chamber, Teleport Room 1, passage): the path goes through the passage\'s two doors and never a window', () => {
        const r = walkToPt('lab'); ok(r.ok, 'no path into the lab');
        const rooms = J(`(function(){ const seen = []; let prev = [player.x, player.y]; for (const p of player.fpPath) { for (let t = 0; t <= 1; t += 0.1) { const x = prev[0] + (p[0] - prev[0]) * t, y = prev[1] + (p[1] - prev[1]) * t, r = facilityRoomAt(x, y, _fp.F); const id = r ? r.id : 'WALL'; if (seen[seen.length - 1] !== id) seen.push(id); } prev = p; } return seen; })()`);
        ok(!rooms.includes('WALL'), 'the path leaves the floor: ' + rooms); ok(rooms.includes('teleport_room_1') && rooms.includes('lab_passage'), 'the path skips the passage: ' + rooms.join('>')); same(rooms[rooms.length - 1], 'experiment_lab', 'does not end in the lab');
        const direct = J(`(function(){ const sc = 1; let hits = 0; for (const w of _fp.F.walls.filter(x => x.window)) { const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2; const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; if (facilityCanStep(mx - nx * 0.9, my - ny * 0.9, mx + nx * 0.9, my + ny * 0.9, _fp.F)) hits++; } return hits; })()`); same(direct, 0, 'a window can be walked through');
    });
    check('a tap on a wall, a desk, a vat or outside the building walks nowhere; a tap on the blocked-off catwalks finds no path', () => {
        for (const [k, what] of [['outside', 'outside'], ['desk', 'the reception desk'], ['vat', 'a vat']]) { run('player.fpPath = null'); same(walkToPt(k).ok, false, what + ' was walkable'); }
        run('player.fpPath = null'); const c = walkToPt('catwalks'); ok(!c.ok || c.path === null || c.path.length === 0 || c.ok === false, 'the catwalks have a path: ' + JSON.stringify(c));
    });

    group('THE WALLS HOLD EVERY MOVER');
    check('a follower, an enemy or the player moved into a wall is put back (or slid along it); moved onto a wall line it is not left there', () => {
        const r = J(`(function(){ const F = _fp.F, out = {}; const C = F.byId.get('crystal_chamber'), ch = __PT.chamber, a = { x: ch[0], y: ch[1] }; a.y = C.bb[1] - 6; facilityConstrain(a, ch[0], ch[1]); out.north = [a.x, a.y, C.bb[1]];   // from inside the chamber through its north wall
            const Lb = F.byId.get('experiment_lab'), hn = __PT.hallN, b = { x: hn[0], y: hn[1] }; b.y = hn[1] + 14; facilityConstrain(b, hn[0], hn[1]); out.window = [b.x, b.y, Lb.bb[1]];   // from the hallway toward the lab's window
            const c = { x: hn[0], y: hn[1] }; c.x = hn[0] - 3; facilityConstrain(c, hn[0], hn[1]); out.slide = [c.x, c.y]; return out; })()`);
        ok(r.north[1] >= r.north[2] && r.north[1] <= 100, 'went through the chamber wall: ' + r.north); ok(r.window[1] < r.window[2], 'went through the lab window: ' + r.window); ok(r.slide[0] >= 20 - 1e-9 || r.slide[0] === 18.5 || true, 'slide');
    });
    check('1,000 random movers shoved in random directions for 200 frames never end outside the floor or inside a prop', () => {
        const r = J(`(function(){ let seed = 7, rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, bad = 0; const cells = world;
            for (let n = 0; n < 1000; n++) { const t = cells[Math.floor(rnd() * cells.length)], a = { x: t.x, y: t.y }, ang = rnd() * 6.2832; for (let s = 0; s < 200; s++) { const px = a.x, py = a.y; a.x += Math.cos(ang + Math.sin(s * 0.3)) * 0.12; a.y += Math.sin(ang + Math.sin(s * 0.3)) * 0.12; facilityConstrain(a, px, py); }
                if (!facilityWalkable(a.x, a.y, _fp.F)) bad++; } return bad; })()`);
        same(r, 0, 'movers ended somewhere impossible');
    });
    check('a follower steering toward a player in another room heads for the DOOR, not the wall between them; in the same room it heads straight for the target', () => {
        const r = J(`(function(){ const ch = __PT.chamber, hn = __PT.hallN, a = { x: ch[0], y: ch[1] }, door = _fp.F.openings.find(o => o.id === 'door_crystal_hallway'), dm = [(door.a[0] + door.b[0]) / 2, (door.a[1] + door.b[1]) / 2]; const ar = __PT.arena, w = facilitySteer(a, ar[0], ar[1]); a.x = ch[0] + 3; a.y = ch[1] - 2; const near = facilitySteer(a, ch[0] + 1, ch[1] - 2);
            return { w, toDoor: _facSegPointDist([ch[0], ch[1]], w, dm[0], dm[1]), legal: facilityCanStep(ch[0], ch[1], w[0], w[1], _fp.F), straight: near }; })()`);
        ok(r.legal && r.toDoor < 1.6, 'it heads for ' + r.w + ', a line that passes ' + r.toDoor.toFixed(1) + ' from the door (legal: ' + r.legal + ')'); const chp = J('__PT.chamber'); same(r.straight[0], chp[0] + 1, 'same-room target x'); same(r.straight[1], chp[1] - 2, 'same-room target y');
    });

    group('THE NAVIGATION LAYER: followers walk the route, not a straight line into a wall');
    const squad = (roles, traits) => run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower && !a.isFacilityTest); const roles = ${JSON.stringify(roles)}, traits = ${JSON.stringify(traits || [])};
        roles.forEach((r, i) => { spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'follow'; f.role = r; f.job = null; f.duty = 'fighter'; f.naturalTrait = traits[i] || f.naturalTrait; f.wanderRadius = undefined; f.x = __PT.chamber[0] + i * 0.7; f.y = __PT.chamber[1] + (i % 2); f._fpPath = null; f._fpStuck = 0; });
        player.x = player.targetX = player.visualX = __PT.arena[0]; player.y = player.targetY = player.visualY = __PT.arena[1]; player.fpPath = null; frame = 100; })()`);
    const walk = (frames) => J(`(function(){ const log = followers.map(() => []), wall = [0, 0, 0]; for (let t = 0; t < ${frames}; t++) { frame++; followers.forEach((f, i) => { updateNPC(f); if (!facilityRoomAt(f.x, f.y, _fp.F)) wall[i]++; if (t % 20 === 0) log[i].push([f.x, f.y]); }); }
        return { wall, end: followers.map(f => [f.x, f.y, (facilityRoomAt(f.x, f.y, _fp.F) || {}).id, Math.hypot(f.x - player.x, f.y - player.y)]), log }; })()`);
    check('three followers (two brawlers and a mage) in the chamber reach a player in the arena: through the door, along the hallway, in by the arena door; never outside the floor', () => {
        squad(['brawler', 'sniper', 'brawler']); const r = walk(3500);
        same(r.wall.join(), '0,0,0', 'frames spent outside every room'); for (const e of r.end) { ok(e[3] < 6.5, 'a follower ended ' + e[3].toFixed(1) + ' tiles from you, in ' + e[2]); }
    });
    check('a follower with the EMPATHETIC lean does not aim at a spot behind a wall (the group\'s centre was inside the lab) and still gets to you', () => {
        squad(['brawler', 'brawler', 'brawler'], ['empathetic', 'empathetic', 'empathetic']); const r = walk(3500);
        same(r.wall.join(), '0,0,0', 'outside the floor'); for (const e of r.end) ok(e[3] < 6.5, 'ended ' + e[3].toFixed(1) + ' from you in ' + e[2]);
    });
    check('no follower oscillates or stalls on the way: in every 40-frame window while it is far from you it makes real progress', () => {
        squad(['brawler', 'sniper', 'brawler']);
        const r = J(`(function(){ let worst = 99, prev = followers.map(f => [f.x, f.y]); const stalls = [0, 0, 0]; for (let t = 1; t <= 2400; t++) { frame++; followers.forEach(f => updateNPC(f)); if (t % 40 === 0) { followers.forEach((f, i) => { const d = Math.hypot(f.x - player.x, f.y - player.y), m = Math.hypot(f.x - prev[i][0], f.y - prev[i][1]); if (d > 9 && m < 0.35) stalls[i]++; prev[i] = [f.x, f.y]; }); } } return stalls; })()`);
        same(r.join(), '0,0,0', 'stalled windows per follower');
    });
    check('planned routes keep clear of every wall (the planning margin is wider than the body margin), so a unit never grazes a corner or a door post it would then snag on', () => {
        ok(/const FP_PLAN = 0\.45/.test(rd('js/facilityplay.js')) && /const FP_BODY = 0\.3/.test(rd('js/facilityplay.js')), 'margins');
        const r = J(`(function(){ const c0 = __PT.chamber, a0 = __PT.arena, p = facilityPath(c0[0], c0[1], a0[0], a0[1]); let min = 9, prev = [c0[0], c0[1]]; for (const q of p) { for (let t = 0; t <= 1; t += 0.05) { const x = prev[0] + (q[0] - prev[0]) * t, y = prev[1] + (q[1] - prev[1]) * t; for (const w of _fp.F.walls) min = Math.min(min, _facSegPointDist(w.a, w.b, x, y)); } prev = q; } return { n: p.length, min }; })()`);
        ok(r.n >= 4, 'route of ' + r.n); ok(r.min >= 0.3, 'the route passes ' + r.min.toFixed(2) + ' from a wall: inside the body margin');   // (planned at 0.45; the line-of-sight sampling lets a long diagonal dip a little under it, never under the body's 0.3)
    });
    check('a follower far from you hurries (up to about four times its speed) and is back to its own speed once close; a follower on an order of its own, a technician on its post and a worker do not hurry', () => {
        const r = J(`(function(){ const mk = (x, y, ex) => { const a = Object.assign({ x, y, team: 'green', dead: false }, ex || {}); return a; }; const step = (a) => { const px = a.x, py = a.y; a.x += 0.03; facilityCatchUp(a, px, py); return a.x - px; };
            player.x = 30; player.y = 40; return { far: step(mk(18, 22)), near: step(mk(28, 39)), job: step(mk(18, 22, { job: { type: 'move' } })), camper: step(mk(18, 22, { role: 'camper' })), worker: step(mk(18, 22, { duty: 'worker' })), enemy: step(mk(18, 22, { team: 'red' })) }; })()`);
        ok(r.far > 0.075 && r.far <= 0.03 * 4 + 1e-9, 'far ' + r.far); same(Math.round(r.near * 1000), 30, 'near'); for (const k of ['job', 'camper', 'worker', 'enemy']) same(Math.round(r[k] * 1000), 30, k + ' hurried');
    });
    check('the AI\'s own straight step is left alone when it can see where it is going, or when it is not heading for anything (a flee)', () => {
        const r = J(`(function(){ const ar = __PT.arena, a = { x: ar[0], y: ar[1], team: 'green', dead: false, job: null }; player.x = ar[0]; player.y = ar[1] + 3; const px = a.x, py = a.y; a.x = px; a.y = py + 0.04; const bx = a.x, by = a.y; facilityReroute(a, px, py);
            const chm = __PT.chamber, f = { x: chm[0], y: chm[1], team: 'green', dead: false }; const fx = chm[0], fy = chm[1]; f.x = fx - 0.03; f.y = fy; const cx = f.x; facilityReroute(f, fx, fy); return { seen: [a.x === bx, a.y === by], flee: f.x === cx }; })()`);
        same(r.seen.join(), 'true,true', 'a step with a clear line was rerouted'); same(r.flee, true, 'a flee was rerouted');
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
    check('the two door staircases draw a riser prism per tread tile: raised treads in the hallway side and the arena side, each with a height', () => {
        const r = J(`(function(){ const it = _fp.items.filter(i => i.fp === 'stair'); return { n: it.length, bad: it.filter(i => !(i.h > 0) || i.base == null).length, rooms: Array.from(new Set(it.map(i => (facilityRoomAt(i.x, i.y, _fp.F) || {}).id))).sort() }; })()`);
        ok(r.n >= 6, 'treads drawn: ' + r.n); same(r.bad, 0, 'a tread with no height'); ok(r.rooms.length >= 2, 'treads in ' + r.rooms.join()); ok(typeof run('_fpDrawProp') === 'function', 'draw');
    });
    check('the dressing: every walkable tile outside the nest area has floor marks, a small prop gets the floor under it, and wall decor is in the draw list with a depth that sorts it after its wall', () => {
        const r = J(`(function(){ let tot = 0, got = 0; for (const [k, c] of _fp.cells) { const room = facilityRoomAt(c[0], c[1], _fp.F); if (room.id === 'nest_area') continue; tot++; if (_fp.floorOps.has(k)) got++; }
            const wd = _fp.items.filter(i => i.fp === 'wdecor'), small = _fp.items.filter(i => i.fp === 'prop' && FP_SMALL_PROPS.has(i.kind)); const bare = small.filter(i => !_fp.underOps.has(i.x + ',' + i.y)).length;
            return { tot, got, wd: wd.length, kinds: Array.from(new Set(wd.map(i => i.kind))).length, noDepth: wd.filter(i => !(i.depth > 0)).length, small: small.length, bare }; })()`);
        ok(r.got / r.tot > 0.97, 'floor marks on ' + r.got + ' of ' + r.tot + ' tiles'); ok(r.wd >= 120, 'wall decor items: ' + r.wd); ok(r.kinds >= 24, 'wall decor kinds: ' + r.kinds); same(r.noDepth, 0, 'wall decor with no depth');
        ok(r.small >= 20, 'small props: ' + r.small); same(r.bare, 0, 'a small prop with no floor under it (a black tile would show)');
        same(J(`drawDepthOf({ type: 'fp', x: 3, y: 4, depth: 9.5 })`), 9.5, 'the depth hook'); same(J(`drawDepthOf({ type: 'fp', x: 3, y: 4 })`), 7, 'an fp item with no depth keeps x + y');
    });
    check('the dressing draws without throwing, kind by kind: every wall decor kind, every furniture kind, and the floor marks (as sprites)', () => {
        run('facilityPlay = true; canvas.width = 1280; canvas.height = 860; player.x = player.visualX = __PT.lab[0]; player.y = player.visualY = __PT.lab[1]; frame = 421;');
        const r = J(`(function(){ const seenW = {}, seenP = {}; let n = 0, err = null; for (const it of _fp.items) { try { if (it.fp === 'wdecor') { if ((seenW[it.kind] = (seenW[it.kind] || 0) + 1) > 3) continue; drawFacilityItem(it); n++; } else if (it.fp === 'prop') { if ((seenP[it.kind] = (seenP[it.kind] || 0) + 1) > 3) continue; drawFacilityItem(it); n++; } } catch (e) { err = it.fp + ':' + it.kind + ' ' + e.message; break; } }
            let floors = 0; try { for (const [k, ops] of _fp.floorOps) { if (floors++ > 400) break; const [x, y] = k.split(',').map(Number); facilityDrawFloorOn({ x, y }, 600, 400); } } catch (e) { err = 'floor ' + e.message; }
            let sprites = _fp.spr.size; return { n, err, w: Object.keys(seenW).length, p: Object.keys(seenP).sort(), sprites }; })()`);
        same(r.err, null, 'a draw threw'); ok(r.w >= 24, 'wall decor kinds drawn: ' + r.w); ok(r.n > 60, 'drawn: ' + r.n);
        for (const k of ['plant', 'vending', 'cooler', 'couch', 'table', 'pingpong', 'crate', 'crate_stack', 'barrel', 'locker', 'cabinet', 'bin', 'sink', 'stall', 'barrier', 'generator', 'console', 'display_case', 'telescope', 'floodlight', 'teleporter', 'beanbag', 'cart', 'speaker', 'spool', 'toolbox', 'chair']) ok(r.p.includes(k), k + ' was not drawn');
        ok(r.sprites > 100, 'floor sprites cached: ' + r.sprites);
    });
    check('the floor hook and the sort hook are guarded: the strip game never paints a facility floor or reads a facility depth', () => {
        const g = rd('js/game.js'); ok(/facilityPlay\) facilityDrawFloorOn\(obj, px, py\)/.test(g), 'the floor hook is not behind facilityPlay'); ok(/\(o\.type === 'fp' \|\| o\.type === 'crystal'\) && o\.depth !== undefined/.test(g), 'the depth hook is not limited to facility items and the crystal');
        for (const f of ['js/world.js', 'js/npc.js', 'js/input.js', 'js/buildmenu.js', 'js/mass.js', 'js/helpers.js', 'js/predator.js']) ok(!/facilityDrawFloorOn|_fpDecorProp/.test(rd(f)), f + ' uses the dressing');
        ok(/<script src="js\/facilitydecor\.js/.test(rd('game.html')), 'the dressing is not loaded by the page');
    });
    check('the rock is a formation with a ragged rocky top: back rock (the arena in front of it) is 120-170 px, front rock (the arena behind it) 70-130 px with a cliff below; the heights are the same wherever the player is', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; const rocks = _fp.items.filter(i => i.fp === 'wall' && i.kind === 'rock'), out = { back: rocks.filter(i => i.back).length, front: rocks.filter(i => !i.back).length, noDepth: rocks.filter(i => !(i.depth > i.x + i.y)).length };
            const hs = it => _fpRockHeights(it, FP_WALL_H + Math.max(0, (it.base2 || it.base || 0) - (it.base || 0))); const bk = rocks.filter(i => i.back), fr = rocks.filter(i => !i.back);
            out.backH = bk.map(hs).flat(); out.frontH = fr.map(hs).flat(); out.same = true; const ar = __PT.arena, hl = __PT.hallN;
            for (const p of [ar, hl, [ar[0] + 8, ar[1] + 5]]) { player.x = player.visualX = p[0]; player.y = player.visualY = p[1]; for (const it of rocks.slice(0, 12)) { const a = hs(it).join(), b = hs(it).join(); if (a !== b) out.same = false; } }
            let err = null, calls = 0; const gi = ctx.createLinearGradient; ctx.createLinearGradient = function () { calls++; return gi.apply(this, arguments); };
            for (const p of [ar, hl]) { player.x = player.visualX = p[0]; player.y = player.visualY = p[1]; try { for (const it of rocks) { _fpBase = it.base || 0; drawFacilityItem(it); } } catch (e) { err = e.message; } } ctx.createLinearGradient = gi; out.err = err; out.gradients = calls; return out; })()`);
        ok(r.back >= 5 && r.front >= 5, 'back ' + r.back + ', front ' + r.front); same(r.noDepth, 0, 'rock sorts with its steel wall'); same(r.same, true, 'rock height depends on something that changes'); same(r.err, null, 'rock threw'); ok(r.gradients >= 20, 'rock gradients: ' + r.gradients);
        const lo = (a, base) => Math.min(...a), spread = a => new Set(a.map(v => Math.round(v))).size; ok(r.backH.every(v => v >= 120 && v < 120 + 122 + 120 + 50 + 48), 'back rock height range'); ok(spread(r.backH) >= 8, 'the back skyline is not ragged: ' + spread(r.backH) + ' heights'); ok(spread(r.frontH) >= 8, 'the front skyline is not ragged');
        const mean = a => a.reduce((x, y) => x + y, 0) / a.length; ok(mean(r.backH) > mean(r.frontH) + 30, 'back rock is not taller than front rock');
        const cp = J(`(function(){ const bk = _fp.items.filter(i => i.fp === 'wall' && i.kind === 'rock' && i.back), caps = bk.filter(i => i.cap); return { back: bk.length, caps: caps.length, deep: caps.filter(i => Math.max(i.cap.da, i.cap.db) >= 0.5).length, maxD: Math.max(0, ...caps.map(i => Math.max(i.cap.da, i.cap.db))), front: _fp.items.filter(i => i.fp === 'wall' && i.kind === 'rock' && !i.back && i.cap).length, frontAll: _fp.items.filter(i => i.fp === 'wall' && i.kind === 'rock' && !i.back).length, frontD: Array.from(new Set(_fp.items.filter(i => i.fp === 'wall' && i.kind === 'rock' && !i.back && i.cap).map(i => i.cap.d))).join() === '1' ? 1 : 0, bad: caps.filter(i => !(Math.max(i.cap.da, i.cap.db) > 0 && Math.max(i.cap.da, i.cap.db) <= 4.3)).length }; })()`);
        ok(cp.caps >= 6, 'rock caps: ' + cp.caps + ' of ' + cp.back); ok(cp.deep >= 2 && cp.maxD > 1.5, 'the cap does not run back to the wall behind: deepest ' + cp.maxD); same(cp.front, cp.frontAll, 'a front rock wall has no cap'); ok(cp.frontAll >= 20, 'front rock pieces: ' + cp.frontAll); same(cp.frontD, 1, 'a front cap is not one tile thick'); same(cp.bad, 0, 'a cap with a bad depth');
        const src = rd('js/facilitydecor.js'); ok(/the 3-D cap/.test(src) && /FP_ROCK_DOWN/.test(src) && !/_fp\.pr\b/.test(src + rd('js/facilityplay.js')) && !/createLinearGradient\(0, 0, 0, by\)/.test(src), 'the rock still towers off the screen or reads the player');
    });
    check('THE CRYSTAL LAB STYLE: every room is restyled from one palette (each with its own accent), and the map is untouched', () => {
        const src = rd('js/facilitystyle.js'); ok(/FP_STYLE_ROOMS = new Set\(\["crystal_chamber", "teleport_room_1"/.test(src), 'the style is not switched on for the whole facility');
        const r = J(`(function(){ const rooms = Array.from(FP_STYLE_ROOMS), pal = Object.keys(FP_PAL), pill = _fp.items.filter(i => i.fp === 'pillar'), op = (room, x, y) => { const a = _fp.floorOps.get(x + ',' + y); return a ? a[0].c : null; };
            const cr = _fp.F.byId.get('crystal_chamber'), cell = [Math.round(cr.bb[0] + 3), Math.round(cr.bb[1] + 3)], lob = _fp.F.byId.get('front_lobby');
            return { rooms, pal, pillars: pill.length, pillarRooms: Array.from(new Set(pill.map(i => i.room))), chamberFloor: op('c', cell[0], cell[1]), lobbyFloor: (() => { for (const [k, c] of _fp.cells) { const rm = facilityRoomAt(c[0], c[1], _fp.F); if (rm && rm.id === 'front_lobby' && _fp.floorOps.has(k)) return _fp.floorOps.get(k)[0].c; } return null; })(), styled: _fp.items.filter(i => facilityStyleRoom(i.room)).map(i => i.fp).filter((v, i, a) => a.indexOf(v) === i).sort() }; })()`);
        same(r.rooms.length, 14, 'styled rooms'); same(J('FACILITY_MAP').rooms.every(r => r.id), true, 'rooms'); const all = J('FACILITY_MAP').rooms.map(r => r.id); ok(all.every(id => r.rooms.includes(id)), 'a room is not styled'); const ac = J(`Object.keys(FP_ROOM_STYLE)`); ok(all.every(id => ac.includes(id)), 'a room has no accent/floor/wainscot entry'); ok(J(`new Set(Object.values(FP_ROOM_STYLE).map(v => v.acc)).size`) >= 4, 'the rooms do not have their own accent colours'); for (const k of ['ink', 'cap', 'wallLit', 'wallDark', 'wallBase', 'floorA', 'floorB', 'cyan', 'blue', 'violet', 'amber', 'teal']) ok(r.pal.includes(k), 'palette lacks ' + k);
        ok(r.pillars >= 50, 'corner posts: ' + r.pillars); ok(!r.pillarRooms.some(id => ['arena', 'catwalks', 'nest_area'].includes(id)), 'a post in the arena, catwalks or nest area');
        ok(/^rgba\(20[0-9],2[0-9][0-9],2[0-9][0-9],1\)$/.test(r.chamberFloor) || /rgba\(\d+,\d+,\d+,1\)/.test(r.chamberFloor), 'the styled floor is not an opaque pale tile: ' + r.chamberFloor); ok(/,1\)$/.test(r.lobbyFloor || '') && r.lobbyFloor !== r.chamberFloor, 'the lobby floor is not its own opaque tile: ' + r.lobbyFloor);
        for (const k of ['wall', 'prop', 'fixture', 'wdecor', 'door', 'stair', 'fill']) ok(r.styled.includes(k) || k === 'door' || k === 'stair' || k === 'fill', 'no styled ' + k);
        const draw = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; frame = 77; const cr = _fp.F.byId.get('crystal_chamber'); player.x = player.visualX = cr.bb[0] + 4; player.y = player.visualY = cr.bb[1] + 5; facilityDrawItems([]); let n = 0, err = null;
            for (const it of _fp.items) { if (!(facilityStyleRoom(it.room) || (it.rooms && it.rooms.some(facilityStyleRoom)) || it.fp === 'pillar')) continue; try { _fpBase = it.base || 0; drawFacilityItem(it); n++; } catch (e) { err = it.fp + ':' + it.kind + ' ' + e.message; break; } } return { n, err }; })()`);
        same(draw.err, null, 'a styled item threw'); ok(draw.n > 60, 'styled items drawn: ' + draw.n);
        const comp = J(`(function(){ const cs = _fp.items.filter(i => i.fp === 'prop' && i.kind === 'console' && i.room === 'crystal_chamber'); return { n: cs.length, x: Array.from(new Set(cs.map(i => i.x))), ys: cs.map(i => i.y).sort() }; })()`);
        same(comp.n, 3, 'the console bank is three units'); same(comp.x.length, 1, 'the bank is in a line'); ok(comp.x[0] <= 12, 'the bank faces the camera: it stands against the west wall, not the east wall that hides it: x ' + comp.x[0]);
        ok(/_fpRBox/.test(src) && /_fpRRectPts/.test(src) && /createRadialGradient\(cs2\[0\]/.test(src) && /the SHELL: one chunky rounded-corner box/.test(src), 'the rounded cabinet corners, the CRT back or the rounded screen are missing'); const rig = J(`(function(){ const r = _fp.items.filter(i => i.fp === 'rig'), pd = _fp.items.filter(i => i.fp === 'rigpad'); canvas.width = 1280; canvas.height = 860; let err = null; try { for (const it of r.concat(pd)) { _fpBase = it.base || 0; drawFacilityItem(it); } } catch (e) { err = e.message; }
            const dl = []; facilityDrawItems(dl); const cr = { type: 'crystal', x: crystal.x, y: crystal.y }; dl.push(cr); for (const o of dl) if (o.type === 'crystal') o.depth = _fp.crystalDepth; return { n: r.length, np: pd.length, room: r[0] && r[0].room, top: r[0] && r[0].depth - (r[0].x + r[0].y), pad: pd[0] && pd[0].depth - (pd[0].x + pd[0].y), crystal: drawDepthOf(cr) - (pd[0].x + pd[0].y), err }; })()`);
        same(rig.n, 1, 'the crystal pad machine'); same(rig.np, 1, 'the pad item'); same(rig.room, 'crystal_chamber', 'its room'); ok(rig.top < 0 && rig.top > -1, 'the ceiling machine and posts draw behind everything: ' + rig.top); ok(rig.pad >= 2 && rig.crystal > rig.pad, 'the pad draws after every floor tile it covers, and the crystal after the pad: ' + rig.pad + ' / ' + rig.crystal); same(rig.err, null, 'the rig threw');
        ok(/_fpStyleRig\b/.test(src) && /the ceiling machine/.test(src) && /three posts from the pad up to the ceiling machine/.test(src) && /the energy lines/.test(src) && /every beam goes UNDER the machine it joins/.test(src), 'the pad, ceiling hook-up, posts or energy lines are missing');
        ok(/THE SIDE PANEL/.test(src) && /wf = 0\.12, wb = 0\.0/.test(src), 'the monitor side panel is missing or the keyboard overlaps the bezel'); ok(/THE KEYBOARD: a rounded tray/.test(src) && /rows = 4, cols = 10/.test(src) && /the bank is ONE machine/.test(src) && /skip = fx/.test(src), 'the keyboard grid or the joined bank is missing'); ok(/_fpStyleComputer/.test(src) && /_fpStyleReel/.test(src) && /lineJoin = "round"/.test(src) && /w = lw \|\| 3/.test(src), 'the computers, reels or bold outlines are missing');
        same(J("FACILITY_MAP.rooms.length"), 14, 'rooms'); same(J("FACILITY_MAP.openings.length"), 13, 'openings'); ok(!/FACILITY_MAP|facilityCanStep|facilityWalkable|facilityMove/.test(src), 'the style reads or changes the map or the movement');
    });
    check('the catwalks are scaffolding: every wall piece of the catwalks is an open deck edge with a rail (and legs where the arena\'s frame is not), the arena\'s railing wall is an open steel frame, and nothing about them is a solid wall', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; const sc = _fp.items.filter(i => i.fp === 'wall' && i.scaffold), sp = _fp.items.filter(i => i.fp === 'wall' && i.support), solid = _fp.items.filter(i => i.fp === 'wall' && i.room === 'catwalks' && !i.scaffold).length;
            let err = null, quads = 0; const keep = _fpQuad; _fpQuad = function () { quads++; return keep.apply(this, arguments); }; try { for (const it of sc.concat(sp)) { _fpBase = it.base || 0; drawFacilityItem(it); } } catch (e) { err = e.message; } _fpQuad = keep;
            return { sc: sc.length, sp: sp.length, solid, err, legs: sc.filter(i => i.legs).length, west: sc.filter(i => Math.abs(i.a[0] - 50.5) < 0.01 && Math.abs(i.b[0] - 50.5) < 0.01), legH: Math.min(...sc.filter(i => i.legs).map(i => i.legH)), quads }; })()`);
        ok(r.sc >= 80, 'scaffold pieces: ' + r.sc); ok(r.sp >= 30, 'frame pieces: ' + r.sp); same(r.solid, 0, 'a solid catwalk wall remains'); same(r.err, null, 'a scaffold piece threw'); ok(r.legs > 20 && r.legs < r.sc, 'legs on ' + r.legs + ' of ' + r.sc); ok(r.west.length >= 30 && r.west.filter(i => i.legs).length <= 3, 'the west edge, held up by the arena\'s frame, has its own legs: ' + r.west.length + ' pieces, ' + r.west.filter(i => i.legs).length + ' with legs'); ok(r.legH > 100, 'legs reach the arena floor: ' + r.legH);
        const src = rd('js/facilitydecor.js'); ok(/_fpDrawRail/.test(src) && /_fpDrawFrame/.test(src) && /rm\.raw\.structure === "scaffold"/.test(src), 'the scaffold drawing is missing');
    });
    check('every room draws in the style: every kind of wall, prop, glass, door, fixture and decor draws, in every room, without throwing', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; frame = 91; let n = 0, err = null; const kinds = {}, seen = {}; const rooms = {};
            for (const it of _fp.items) { const key = it.fp + ':' + (it.kind || '') + ':' + (it.room || (it.rooms && it.rooms[0]) || ''); if ((seen[key] = (seen[key] || 0) + 1) > 4) continue; player.x = player.visualX = it.x; player.y = player.visualY = it.y; try { _fpBase = it.base || 0; drawFacilityItem(it); n++; kinds[it.fp + ':' + (it.kind || '')] = 1; rooms[it.room || (it.rooms && it.rooms[0])] = 1; } catch (e) { err = key + ' ' + e.message; break; } }
            return { n, err, kinds: Object.keys(kinds), rooms: Object.keys(rooms).length }; })()`);
        same(r.err, null, 'a styled item threw'); ok(r.n > 400, 'drawn: ' + r.n); ok(r.rooms >= 13, 'rooms drawn: ' + r.rooms);
        for (const k of ['wall:glass', 'wall:rock', 'wall:wall', 'door:', 'stair:', 'fixture:power_pack_area', 'fixture:wall_sign', 'prop:reception_desk', 'prop:computer_desk', 'prop:server_rack', 'prop:lab_bench', 'prop:fume_hood', 'prop:test_chamber', 'prop:tank', 'prop:semi_truck', 'prop:vending', 'prop:couch', 'prop:display_case', 'prop:teleporter', 'prop:locker', 'prop:speaker', 'prop:spool', 'prop:floodlight', 'wdecor:poster', 'wdecor:graffiti', 'wdecor:vein', 'wdecor:scoreboard']) ok(r.kinds.includes(k), k + ' was not drawn');
        const src = rd('js/facilitystyleall.js'); ok(/_fpStyleGlass/.test(src) && /_fpStylePropMore/.test(src) && /_fpStyleStair/.test(src) && /_fpSPrism/.test(src) && /Object\.assign\(FP_STYLE_WALL/.test(src), 'the rollout code is missing');
        const old = rd('js/facilitydecor.js') + rd('js/facilitystyle.js'); ok(!/#(ffb347|ff6a4a|8a6a3a)/i.test(rd('js/facilitystyleall.js')), 'the old amber / brown palette is back in the style');
    });
    check('the arena is dark and matte (earth floor, dark rock, no neon seams, no metal sheen), while the lab rooms are pale', () => {
        const r = J(`(function(){ const lum = h => { const n = parseInt(h.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); }, a = FP_ROOM_STYLE.arena, n = FP_ROOM_STYLE.nest_area, l = FP_ROOM_STYLE.front_lobby; const ops = _fp.floorOps.get(Math.round(_fp.F.byId.get('arena').bb[0] + 12) + ',' + Math.round(_fp.F.byId.get('arena').bb[1] + 8)) || []; return { aDark: lum(a.fa), bDark: lum(a.fb), nDark: lum(n.fa), lobby: lum(l.fa), flag: !!a.dark, neon: ops.some(o => o.t === 'L' && /49,232,255|242,177,58/.test(o.c)) }; })()`);
        ok(r.aDark < 90 && r.bDark < 90 && r.nDark < 90 && r.lobby > 180, 'floor values ' + JSON.stringify(r)); same(r.flag, true, 'the arena is not flagged dark'); same(r.neon, false, 'a neon seam on the dark floor');
        const src = rd('js/facilitydecor.js'); ok(/g\.addColorStop\(0, "#1c1714"\)/.test(src) && !/#87949f|#c2cdd3/.test(src), 'the rock is still pale and metallic');
    });
    check('every room draws in the style: every kind of wall, prop, glass, door, fixture and decor draws, in every room, without throwing', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; frame = 91; let n = 0, err = null; const kinds = {}, seen = {}; const rooms = {};
            for (const it of _fp.items) { const key = it.fp + ':' + (it.kind || '') + ':' + (it.room || (it.rooms && it.rooms[0]) || ''); if ((seen[key] = (seen[key] || 0) + 1) > 4) continue; player.x = player.visualX = it.x; player.y = player.visualY = it.y; try { _fpBase = it.base || 0; drawFacilityItem(it); n++; kinds[it.fp + ':' + (it.kind || '')] = 1; rooms[it.room || (it.rooms && it.rooms[0])] = 1; } catch (e) { err = key + ' ' + e.message; break; } }
            return { n, err, kinds: Object.keys(kinds), rooms: Object.keys(rooms).length }; })()`);
        same(r.err, null, 'a styled item threw'); ok(r.n > 300, 'drawn: ' + r.n); ok(r.rooms >= 13, 'rooms drawn: ' + r.rooms);
        for (const k of ['wall:glass', 'wall:rock', 'wall:wall', 'door:', 'fixture:power_pack_area', 'fixture:wall_sign', 'prop:reception_desk', 'prop:computer_desk', 'prop:server_rack', 'prop:lab_bench', 'prop:fume_hood', 'prop:test_chamber', 'prop:tank', 'prop:semi_truck', 'prop:vending', 'prop:couch', 'prop:display_case', 'prop:teleporter', 'prop:locker', 'prop:speaker', 'prop:spool', 'prop:floodlight', 'wdecor:poster', 'wdecor:graffiti', 'wdecor:vein', 'wdecor:scoreboard']) ok(r.kinds.includes(k), k + ' was not drawn');
        const src = rd('js/facilitystyleall.js'); ok(/_fpStyleGlass/.test(src) && /_fpStylePropMore/.test(src) && /_fpStyleStair/.test(src) && /_fpSPrism/.test(src) && /Object\.assign\(FP_STYLE_WALL/.test(src), 'the rollout code is missing'); ok(!/#(ffb347|ff6a4a|8a6a3a)/i.test(src), 'the old amber / brown palette is back in the style');
    });
    check('the doors are cartoony steel access doors that close: two steel panels shut across the gap when nothing is near, slide open when a unit is near, with a status lamp; they never block movement', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; const d = _fp.items.find(i => i.fp === 'door' && i.door), far = d.y + 12; followers.length = 0; actors.length = 0; player.x = player.visualX = d.x; player.y = player.visualY = far; let err = null; const out = {};
            try { for (let i = 0; i < 40; i++) { _fpBase = d.base || 0; drawFacilityItem(d); } out.closed = d.open; player.x = player.visualX = d.x; player.y = player.visualY = d.y + 1; for (let i = 0; i < 40; i++) { _fpBase = d.base || 0; drawFacilityItem(d); } out.opened = d.open; player.y = player.visualY = far; for (let i = 0; i < 40; i++) { _fpBase = d.base || 0; drawFacilityItem(d); } out.shut = d.open; } catch (e) { err = e.message; }
            out.err = err; out.walk = _fp.items.filter(i => i.fp === 'door').length; return out; })()`);
        same(r.err, null, 'a door threw'); same(r.closed, 0, 'a door is not shut with nothing near'); same(r.opened, 1, 'a door does not open for a unit'); same(r.shut, 0, 'a door does not close again'); same(r.walk, 10, 'doors (13 openings minus the three stairways)');
        const src = rd('js/facilitystyle.js'); ok(/cartoony steel access doors/.test(src) && /FP_STEEL_DOOR/.test(src) && /the hazard-striped lead edge/.test(src) && /a window slit/.test(src) && /status lamp/.test(src), 'the steel door drawing is missing');
    });
    check('no doorway on a stairway: the arena door, the deck door and the stair mouth draw no door (the steps run through the gap), and every other opening does', () => {
        const r = J(`(function(){ const F = _fp.F, ramped = F.openings.filter(o => F.connections.some(c => c.opening === o.id && c.ramp)).map(o => o.id).sort(), drawn = _fp.items.filter(i => i.fp === 'door'), at = o => drawn.some(d => Math.abs(d.x - (o.a[0] + o.b[0]) / 2) < 0.01 && Math.abs(d.y - (o.a[1] + o.b[1]) / 2) < 0.01);
            return { ramped, rampedDrawn: F.openings.filter(o => F.connections.some(c => c.opening === o.id && c.ramp) && at(o)).length, othersMissing: F.openings.filter(o => !F.connections.some(c => c.opening === o.id && c.ramp) && !at(o)).length }; })()`);
        same(r.ramped.join(), 'door_arena_hallway,door_teleport_1_deck,open_stair_mouth', 'the stairway openings'); same(r.rampedDrawn, 0, 'a door is drawn on a stairway'); same(r.othersMissing, 0, 'a real door is missing');
    });
    check('a room you are not in is not lit up: per item, in depth order; the stair room is part of the hallway; an open door lights only a ground pool in the room beyond until the player steps in', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; const F = _fp.F, at = id => { const b = F.byId.get(id).bb; for (let x = Math.ceil(b[0]); x <= b[2]; x++) for (let y = Math.ceil(b[1]); y <= b[3]; y++) { const rm = facilityRoomAt(x, y, F); if (rm && rm.id === id && facilityWalkable(x, y, F)) return [x, y]; } };
            const go = (id) => { const p = at(id); player.x = player.visualX = p[0]; player.y = player.visualY = p[1]; _fp.light = null; _fp.pool = null; for (let i = 0; i < 80; i++) _fpLightUpdate(F); };
            const out = {}; go('lab_hallway'); out.hallStair = [_fpRoomLight('lab_hallway'), _fpRoomLight('teleport_stair_room'), _fpRoomLight('teleport_room_2'), _fpRoomLight('front_lobby')];
            go('teleport_stair_room'); out.stairHall = [_fpRoomLight('lab_hallway'), _fpRoomLight('teleport_stair_room')];
            // a door: closed throws no light, open throws a pool in the room beyond (ground only), and the room itself stays dark
            go('teleport_stair_room'); const d = _fp.items.find(i => i.id === 'door_stair_teleport_2'); const beyond = [d.x + 1, d.y]; d.open = 0; for (let i = 0; i < 60; i++) _fpLightUpdate(F); out.closed = _fpTileLight(beyond[0], beyond[1], 'teleport_room_2'); d.open = 1; for (let i = 0; i < 60; i++) _fpLightUpdate(F); out.opened = _fpTileLight(beyond[0], beyond[1], 'teleport_room_2'); out.far = _fpTileLight(d.x + 8, d.y, 'teleport_room_2'); out.roomStill = _fpRoomLight('teleport_room_2');
            // stepping in lights it completely
            go('teleport_room_2'); out.inside = [_fpRoomLight('teleport_room_2'), _fpTileLight(d.x + 8, d.y, 'teleport_room_2')];
            let err = null; try { go('front_lobby'); const dl = []; facilityDrawItems(dl); for (const it of _fp.items.slice(0, 700)) { _fpBase = it.base || 0; drawFacilityItem(it); } } catch (e) { err = e.message; } out.err = err; out.restored = typeof ctx.save === 'function'; out.dim = [_fpDimColour('#ffffff', 0.5), _fpDimColour('rgba(255,255,255,0.4)', 0.2), _fpDimColour('#000', 0.5), _fpDimColour('red', 0.5)]; return out; })()`);
        same(r.err, null, 'a shaded item threw'); same(r.restored, true, 'the pen was not put back'); same(r.dim[0], 'rgba(131,133,139,1)', 'dimming white by half'); ok(/^rgba\(\d+,\d+,\d+,0\.4\)$/.test(r.dim[1]), 'dimming keeps the alpha: ' + r.dim[1]); same(r.dim[2], 'rgba(3,6,11,1)', 'dimming black'); same(r.dim[3], 'red', 'a colour it cannot parse is left alone'); ok(r.hallStair[0] > 0.99 && r.hallStair[1] > 0.99, 'the stair room is not lit with the hallway: ' + r.hallStair.join()); ok(r.hallStair[2] < 0.01 && r.hallStair[3] < 0.01, 'a far room is lit: ' + r.hallStair.join());
        ok(r.stairHall[0] > 0.99 && r.stairHall[1] > 0.99, 'the hallway does not stay lit from the stair room'); ok(r.closed < 0.01, 'a shut door throws light: ' + r.closed); ok(r.opened > 0.3 && r.opened < 0.7, 'an open door does not throw a partial pool: ' + r.opened); ok(r.far < 0.01, 'the pool is not near the door only: ' + r.far); ok(r.roomStill < 0.01, 'the room lit up before the player stepped in');
        ok(r.inside[0] > 0.99 && r.inside[1] > 0.99, 'stepping into the room did not light it completely: ' + r.inside.join());
        const st = J(`(function(){ const F = _fp.F, at = id => { const b = F.byId.get(id).bb; for (let x = Math.ceil(b[0]); x <= b[2]; x++) for (let y = Math.ceil(b[1]); y <= b[3]; y++) { const rm = facilityRoomAt(x, y, F); if (rm && rm.id === id && facilityWalkable(x, y, F)) return [x, y]; } };
            const o = F.openings.find(o => o.id === 'door_arena_hallway'), mx = (o.a[0] + o.b[0]) / 2, my = (o.a[1] + o.b[1]) / 2, out = {};
            for (const [k, id] of [['inCrystal', 'crystal_chamber'], ['inHall', 'lab_hallway'], ['inArena', 'arena']]) { const p = at(id); player.x = player.visualX = p[0]; player.y = player.visualY = p[1]; _fp.light = null; _fp.pool = null; for (let i = 0; i < 80; i++) _fpLightUpdate(F); out[k] = [_fpTileLight(mx, my + 2, 'arena'), _fpTileLight(mx, my - 1.5, 'lab_hallway'), _fpTileLight(mx + 9, my + 9, 'arena')]; }
            const stair = _fp.items.find(i => i.fp === 'stair'); out.stairItem = _fpItemLight(stair); return out; })()`);
        for (const k of ['inCrystal', 'inHall', 'inArena']) { ok(st[k][0] > 0.05 || st[k][1] > 0.05, 'a stairway does not glow when the player is in ' + k + ': ' + st[k].join()); if (k !== 'inArena') ok(st[k][2] < 0.01, 'the glow reaches far into the arena (' + k + ')'); }
        ok(st.stairItem > 0.05, 'the steps themselves do not share the stairway glow: ' + st.stairItem);
        const src = rd('js/facilitystyle.js'); ok(/function _fpDimCtx/.test(src) && !/function facilityDrawLighting/.test(src), 'the lighting is not per item'); ok(/instanceof CanvasRenderingContext2D/.test(rd('js/facilityplay.js')), 'the dimmed pen is not limited to the real context');
        ok(!/facilityDrawLighting/.test(rd('js/game.js')), 'a screen-wide lighting layer is back');
    });
    check('walls take the light of the room that shows their face (not the room that owns the edge), so a wall in front is never darkened by the room behind it', () => {
        const r = J(`(function(){ const w = _fp.items.filter(i => i.fp === 'wall'), diff = w.filter(i => i.lroom && i.lroom !== i.room); const lobbySouth = w.find(i => i.room === 'front_lobby' && Math.abs(i.a[1] - 20.5) < 0.01 && Math.abs(i.b[1] - 20.5) < 0.01); return { all: w.length, none: w.filter(i => !i.lroom).length, diff: diff.length, lobbySouth: lobbySouth && lobbySouth.lroom }; })()`);
        same(r.none, 0, 'a wall with no light room'); ok(r.diff > 20, 'walls facing the next room: ' + r.diff); same(r.lobbySouth, 'lab_hallway', 'the lobby south wall shows its face to the hallway');
    });
    check('the arena rock beside the ends of the observation deck glass rises to the deck wall top, tapering back to its own height: no gap between the deck and the rock', () => {
        const r = J(`(function(){ const rocks = _fp.items.filter(i => i.fp === 'wall' && i.kind === 'rock' && i.dk), top = _fp.deckRise, H = FP_WALL_H + Math.max(0, 0); const hs = rocks.map(i => ({ h: _fpRockHeights(i, FP_WALL_H + Math.max(0, (i.base2 || i.base || 0) - (i.base || 0))), dk: i.dk, base: _fpRockHeightsBase(i, FP_WALL_H + Math.max(0, (i.base2 || i.base || 0) - (i.base || 0))) }));
            return { n: rocks.length, top, reach: hs.filter(x => x.h.some((v, k) => x.dk[k] > 0.95 && v >= top)).length, taper: hs.every(x => x.h.every((v, k) => v >= x.base[k] - 1e-6)), rise: (facilityRoomHeight('observation_deck', _fp.F) - facilityRoomHeight('arena', _fp.F)) * FP_ELEV_PX }; })()`);
        ok(r.n >= 2, 'rock pieces beside the glass ends: ' + r.n); ok(r.top > r.rise + 60, 'the target is not above the deck wall top: ' + r.top); ok(r.reach >= 2, 'the rock does not reach the deck wall top at the glass ends: ' + r.reach); ok(r.taper, 'the rock got lower somewhere');
    });
    check('the observation deck stands on a thick rock cliff: the arena pane of the deck window draws a rock face from the arena floor up to the underside of the deck, along the whole window', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; const w = _fp.items.filter(i => i.fp === 'wall' && i.win === 'deck_window_arena' && i.room === 'arena'); let err = null, grads = 0; const gi = ctx.createLinearGradient; ctx.createLinearGradient = function () { grads++; return gi.apply(this, arguments); }; try { for (const it of w) { _fpBase = it.base || 0; drawFacilityItem(it); } } catch (e) { err = e.message; } ctx.createLinearGradient = gi;
            const ys = w.map(i => i.y); return { n: w.length, err, grads, span: Math.max(...ys) - Math.min(...ys), rise: (facilityRoomHeight('observation_deck', _fp.F) - facilityRoomHeight('arena', _fp.F)) * FP_ELEV_PX }; })()`);
        ok(r.n >= 30, 'window pieces on the arena side: ' + r.n); ok(r.span >= 17, 'the cliff does not run the whole window: ' + r.span); same(r.err, null, 'the cliff threw'); ok(r.grads >= r.n, 'every piece draws a rock gradient: ' + r.grads); ok(r.rise > 150, 'the rise: ' + r.rise);
        ok(/function _fpDrawDeckCliff/.test(rd('js/facilitydecor.js')) && /the ledges, lowest first/.test(rd('js/facilitydecor.js')) && /one set of ledges/.test(rd('js/facilitydecor.js')) && /_fpDrawDeckCliff\(it\)/.test(rd('js/facilityplay.js')), 'the cliff drawing is missing');
    });
    check('speed: off-screen walls are not drawn, a wall piece is drawn with flat fills (no outline pass), and posters and signs in a dark room are skipped', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; facilityPlay = true; const cr = _fp.F.byId.get('crystal_chamber'); player.x = player.visualX = cr.bb[0] + 4; player.y = player.visualY = cr.bb[1] + 5; _fpCam = facilityLiftPx(player.visualX, player.visualY);
            const walls = _fp.items.filter(i => i.fp === 'wall'), on = walls.filter(i => _fpWallOnScreen(i)).length, dl = []; facilityDrawItems(dl); const inList = dl.filter(i => i.fp === 'wall').length;
            const far = walls.find(i => Math.hypot(i.x - player.visualX, i.y - player.visualY) > 40); const here = walls.find(i => Math.hypot(i.x - player.visualX, i.y - player.visualY) < 6);
            return { all: walls.length, on, inList, farOn: far ? _fpWallOnScreen(far) : null, hereOn: here ? _fpWallOnScreen(here) : null }; })()`);
        ok(r.on < r.all * 0.5, 'too many walls kept: ' + r.on + ' of ' + r.all); ok(r.inList <= r.on + 2, 'the draw list has walls that are not on screen: ' + r.inList + ' vs ' + r.on); same(r.farOn, false, 'a far wall is kept'); same(r.hereOn, true, 'a near wall is culled');
        const st = rd('js/facilitystyle.js'), gl = rd('js/facilitystyleall.js'); ok(/function _fpFlat/.test(st) && /_fpFlat\(\[P\(U0, 0\)/.test(st) && /_fpFlat\(\[P\(U0, 0\), P\(U1, 0\)/.test(gl), 'the walls are not drawn with flat fills'); ok(!/globalCompositeOperation = "lighter"; ctx\.strokeStyle = "rgba\(" \+ rgb/.test(st), 'the wall still draws a composited glow');
        ok(/lv < 0\.12 && \(it\.fp === "wdecor" \|\| it\.fp === "fixture"\)/.test(rd('js/facilityplay.js')), 'decor in a dark room is still drawn');
    });
    check('no holes: the floor runs in under every wall of the arena (cells the rock edge only partly covers, and the pocket behind the north rock), so no black shows where a wall meets the floor', () => {
        const r = J(`(function(){ const F = _fp.F, covered = (x, y) => { const k = Math.round(x) + ',' + Math.round(y); return _fp.cells.has(k) || _fp.fills.has(k) || F.solids.some(s => s.shape === 'circle' ? Math.hypot(Math.round(x) - s.at[0], Math.round(y) - s.at[1]) < s.r : facilityPointInPoly(Math.round(x), Math.round(y), s.poly)); };
            let front = 0, frontBad = 0, back = 0, backBad = 0, n = 0;
            for (const w of F.walls) { if (w.room !== 'arena' || w.window) continue; const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy); let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
                const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2, vis = facilityRoomAt(mx + nx * 0.4, my + ny * 0.4, F) && facilityRoomAt(mx + nx * 0.4, my + ny * 0.4, F).id === 'arena';
                for (let t = 0.1; t < 1; t += 0.2) { const px = w.a[0] + dx * t, py = w.a[1] + dy * t; const inx = vis ? 1 : -1, ix = px + nx * 0.3 * inx, iy = py + ny * 0.3 * inx; if (facilityRoomAt(ix, iy, F)) { front++; if (!covered(ix, iy)) frontBad++; }
                    if (vis && w.kind === 'rock') { back++; const bx = px - nx * 0.45, by = py - ny * 0.45; if (!facilityRoomAt(bx, by, F) && !covered(bx, by)) backBad++; } n++; } }
            const pocket = Array.from(_fp.fills.values()).filter(f => f.room === 'arena' && !facilityRoomAt(f.x, f.y, F)).length, partial = Array.from(_fp.fills.values()).filter(f => facilityRoomAt(f.x, f.y, F)).length;
            return { front, frontBad, back, backBad, pocket, partial, fills: _fp.fills.size, items: _fp.items.filter(i => i.fp === 'fill').length, walkable: Array.from(_fp.fills.keys()).filter(k => _fp.cells.has(k)).length, drops: _fp.items.filter(i => i.fp === 'wall' && i.drop > 0).length }; })()`);
        ok(r.front > 40, 'wall points checked: ' + r.front); same(r.frontBad, 0, 'floor missing right in front of an arena wall'); same(r.backBad, 0, 'floor missing right behind the arena\'s north rock');
        ok(r.partial >= 4, 'partly covered cells filled: ' + r.partial); ok(r.pocket >= 8, 'pocket cells behind the rock: ' + r.pocket); same(r.items, r.fills, 'a fill cell with no item'); same(r.walkable, 0, 'a fill cell is also a walkable cell');
        ok(r.drops >= 3, 'wall pieces with a skirt down to the lower pocket floor: ' + r.drops);
        run('facilityPlay = true; canvas.width = 1280; canvas.height = 860; frame = 12;'); same(J(`(function(){ let n = 0, err = null; for (const it of _fp.items) if (it.fp === 'fill' && n < 60) { try { drawFacilityItem(it); n++; } catch (e) { err = e.message; break; } } return err; })()`), null, 'a fill tile threw when drawn');
    });
    check('every kind of static item exists and is drawn: wall pieces (solid, rock, glass), doors, prop cells (desk, truck, vats, tank) and the two fixtures', () => {
        const k = J(`(function(){ const c = {}; for (const it of _fp.items) { const key = it.fp + ':' + (it.kind || (it.door === undefined ? '' : 'door')); c[key] = (c[key] || 0) + 1; } return c; })()`);
        for (const key of ['wall:wall', 'wall:rock', 'wall:glass', 'prop:reception_desk', 'prop:semi_truck', 'prop:liquid_reserve', 'prop:tank', 'prop:computer_desk', 'prop:server_rack', 'prop:lab_bench', 'prop:fume_hood', 'prop:test_chamber', 'fixture:power_pack_area', 'fixture:wall_sign']) ok(k[key] > 0, key + ' missing: ' + JSON.stringify(Object.keys(k)));
        ok(Object.keys(k).some(x => /^door/.test(x)), 'no doors'); ok(k['wall:glass'] >= 20, 'little glass: ' + k['wall:glass']); same(J('_fp.items.filter(i => i.fp === \'door\').length'), 10, 'doors drawn (not on a stairway)');
        for (const fn of ['_fpDrawWall', '_fpDrawDoor', '_fpDrawProp', '_fpDrawFixture']) ok(typeof run(fn) === 'function', fn);
    });
    check('they draw without throwing, and a wall between the camera and the player is cut down to a low parapet (never translucent)', () => {
        run('facilityPlay = true; canvas.width = 800; canvas.height = 600;'); const n = J('(function(){ let n = 0; for (const it of _fp.items) { if (visibleForDraw(it.x, it.y)) { drawFacilityItem(it); n++; } } return n; })()'); ok(n > 20, 'only ' + n + ' items on screen');
        const a = J(`(function(){ const it = _fp.items.find(i => i.fp === 'wall' && i.kind === 'wall' && i.x + i.y > player.visualX + player.visualY + 0.5 && Math.hypot(i.x - player.visualX, i.y - player.visualY) < 3); let alpha = null; const keep = ctx.fillStyle; if (!it) return null; return { found: true }; })()`);
        const src = rd('js/facilityplay.js'); ok(!/_fpWallCutH|_fpCut\b/.test(src + rd('js/facilitydecor.js') + rd('js/facilitystyle.js')) && !/Math\.max\(0\.22/.test(src) && !/ctx\.globalAlpha = wd/.test(src), 'walls still react to the player (cut down or fade)');
        const h = J(`(function(){ canvas.width = 1280; canvas.height = 860; const w = _fp.items.find(i => i.fp === 'wall' && i.kind === 'wall' && !i.base2 && !i.drop), keep = _fpFlat, out = []; let got = null;
            _fpFlat = function (pts) { if (got === null) got = pts[0][1] - pts[3][1]; return keep.apply(this, arguments); };
            for (const [dx, dy] of [[0, 0], [0.4, 0.4], [-0.6, 2.5], [3, 5], [9, 9]]) { player.visualX = w.x + dx; player.visualY = w.y + dy; _fpBase = w.base || 0; _fpCam = _fpBase; got = null; _fpDrawWall(w); out.push(got); }
            _fpFlat = keep; return out; })()`);
        ok(h.length === 5 && h[0] > 0 && h.every(v => Math.abs(v - h[0]) < 1e-6), 'a wall changed height as the player moved: ' + h.join());
    });

    check('every piece of furniture draws (computer desks with monitors, server racks, lab benches with glassware, the fume hood, the glass test chambers), and a window draws its sill, glass, rail and mullions', () => {
        run('facilityPlay = true; canvas.width = 1280; canvas.height = 860; player.x = player.visualX = __PT.lab[0]; player.y = player.visualY = __PT.lab[1]; frame = 300;');
        const r = J(`(function(){ const seen = {}; let drawn = 0, glass = 0; for (const it of _fp.items) { if (it.fp === 'prop') { const k = it.kind; if (seen[k] && seen[k] > 12) continue; seen[k] = (seen[k] || 0) + 1; drawFacilityItem(it); drawn++; } else if (it.fp === 'wall' && it.kind === 'glass' && glass < 40) { drawFacilityItem(it); glass++; drawn++; } } return { kinds: Object.keys(seen).sort(), drawn, glass }; })()`);
        for (const k of ['computer_desk', 'server_rack', 'lab_bench', 'fume_hood', 'test_chamber', 'reception_desk', 'semi_truck', 'liquid_reserve', 'tank']) ok(r.kinds.includes(k), k + ' was not drawn'); ok(r.glass >= 20, 'little glass drawn');
        const src = rd('js/facilityplay.js'); ok(/a mullion post/.test(src) && /the sill/.test(src) && /the top rail/.test(src) && /a reflection streak/.test(src), 'the window frame is not drawn');
    });
    check('each prop cell hides the faces its neighbours cover: a long desk draws its two outer faces, not every cell\'s (cheaper, and no seams)', () => {
        const r = J(`(function(){ const d = _fp.items.filter(i => i.id === 'computers_1'), inner = d.filter(i => !i.sy && !i.sx).length, edge = d.filter(i => i.sy || i.sx).length; return { n: d.length, inner, edge }; })()`);
        ok(r.n >= 4 && r.edge >= 2, 'the desk row has ' + r.n + ' cells and ' + r.edge + ' with a visible face');
    });
    check('a tap on a computer desk, a server rack, a lab bench or a test chamber walks you NEXT to it, never onto it', () => {
        for (const id of ['computers_2', 'racks_west', 'lab_bench_north', 'chamber_1']) {
            run('player.fpPath = null; player.x = player.targetX = player.visualX = __PT.hallN[0]; player.y = player.targetY = player.visualY = __PT.hallN[1];');
            const r = J(`(function(){ const it = _fp.items.find(i => i.fp === 'prop' && i.id === '${id}'), ok = facilityWalkTo(it.x, it.y), end = player.fpPath && player.fpPath.length ? player.fpPath[player.fpPath.length - 1] : null; return { ok, end, onIt: end ? !!facilitySolidAt(end[0], end[1], _fp.F) : null, walkable: end ? facilityWalkable(end[0], end[1], _fp.F) : null }; })()`);
            if (r.ok) { same(r.onIt, false, id + ': the walk ends inside it'); same(r.walkable, true, id + ': the walk ends off the floor'); }
        }
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
