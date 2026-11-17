// THE SEWERS' NEW LOOK (build 2026-11-15g; docs/FACILITY.md, "The Sewers"). The owner, 2026-11-15, of six looks drawn on the game (design/sewer-looks/): "I like 1 but the floor tiles of 4".
// So the tunnel (all of the Sewers but the Nest, which keeps its look) has look 1's walls and look 4's floor (js/facilitysewers.js, THE TUNNEL'S REFIT). These checks:
//   THE WALLS    every plain wall piece of the tunnel drawn by the refit and none of the Nest's (the old look not run for them); each near wall piece under a section of its own (the wall cut clean) or
//                inside another wall's mass (the end of a wall: the alcove beside the outfall, the owner's circle of 2026-11-15, build 2026-11-15h), and no section on a far piece; each face hanging
//                as deep as nothing stands in front of it; a lintel over each of the five north passages' mouths, found from the room's outline; the passages' east jambs only their tops; lamps on
//                the far walls, none by a door or a light of the map's; every new piece drawn without an error
//   THE FLOOR    the tunnel's tiles checker plate on a base of their own, the plate's ticks shared every 6 tiles and the same as each tile's own; a hazard kerb on every side over the water and none
//                elsewhere; dark at a wall's foot; the Nest's floor as it was; no other room's touched; the marks' memory bounded; a mark of many short lines painted in one stroke
//   THE PAGE     game.html in Chromium: no errors, the refit drawn, and a frame's canvas calls at the north bank and the west bridge within 15% of the old walls' (graphics HIGH and LOW); over the
//                river's west end, where the owner circled a dark block, the water is drawn and no wall section is
const fs = require('fs'), vm = require('vm'), path = require('path'), os = require('os');
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// THE FACTS, worked out in the game's own scripts (a sandbox with a canvas that draws nothing)
const FACTS = `(function () {
    var F = _fp.F, C = FP_SEWER_REFIT, out = {};
    var own = function (w) { return _fpSewerOwnLook((w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, F); };
    var onSeg = function (p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; if (t < -1e-6 || t > 1 + 1e-6) return false; return Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]) < 1e-6; };
    var W = _fp.items.filter(function (i) { return i.fp === 'wall' && i.room === 'sewers' && i.kind === 'wall'; });
    var near = W.filter(function (w) { return !own(w) && w.out === 1 && !_fpSewerJamb(w, F); }), far = W.filter(function (w) { return !own(w) && w.out !== 1; }), jamb = W.filter(function (w) { return !own(w) && w.out === 1 && _fpSewerJamb(w, F); });
    out.pieces = { all: W.length, nest: W.filter(own).length, near: near.length, far: far.length, jamb: jamb.length };
    // the hook: true for every tunnel piece (the refit drew it), false for the Nest's; through _fpStyleWall the old look runs only for the Nest's
    var hook = { tunnelFalse: [], nestTrue: [], threw: [], oldForTunnel: 0, oldForNest: 0 }, rc = _fpRoomCols, calls = 0;
    _fpRoomCols = function () { calls++; return rc.apply(this, arguments); };
    try {
        W.forEach(function (w) { var r; try { r = _fpSewerRefitWall(w, FP_WALL_H); } catch (e) { hook.threw.push(String(e)); return; } if (own(w)) { if (r) hook.nestTrue.push(w.a); } else if (!r) hook.tunnelFalse.push(w.a);
            calls = 0; try { _fpStyleWall(w, FP_WALL_H); } catch (e) { hook.threw.push(String(e)); } if (own(w)) hook.oldForNest += calls ? 1 : 0; else hook.oldForTunnel += calls ? 1 : 0; });
    } finally { _fpRoomCols = rc; }
    out.hook = hook;
    // the near walls cut clean: each near piece under a section, no section on a far piece; the section's outer edge towards the camera
    var S = _fp.items.filter(function (i) { return i.fp === 'sewer' && i.what === 'section'; });
    out.sections = S.length;
    // what stands in front of a near wall: the walls' masses (a far wall's a tile behind it, a jamb's a tile towards the camera) and every room's floor; a near piece whose strip is inside one is covered
    var masses = [], nrm = function (w) { var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L; return nx + ny < 0 ? [-nx, -ny] : [nx, ny]; };
    F.walls.forEach(function (w) { if (w.room !== 'sewers' || w.kind !== 'wall') return; var s = _fpWallOut(w, w.a, w.b, F) === 1 ? (_fpSewerJamb(w, F) ? 1 : 0) : -1; if (!s) return; var n = nrm(w), mx = n[0] * s, my = n[1] * s;
        masses.push([Math.min(w.a[0], w.b[0], w.a[0] + mx, w.b[0] + mx), Math.min(w.a[1], w.b[1], w.a[1] + my, w.b[1] + my), Math.max(w.a[0], w.b[0], w.a[0] + mx, w.b[0] + mx), Math.max(w.a[1], w.b[1], w.a[1] + my, w.b[1] + my)]); });
    var blockedT = function (x, y) { return !!facilityRoomAt(x, y, F) || masses.some(function (r) { return x > r[0] + 1e-6 && x < r[2] - 1e-6 && y > r[1] + 1e-6 && y < r[3] - 1e-6; }); };
    var covered = function (w) { var n = nrm(w); return blockedT((w.a[0] + w.b[0]) / 2 + n[0] * 0.2, (w.a[1] + w.b[1]) / 2 + n[1] * 0.2); };
    var inAlcove = function (a, b) { return Math.abs(a[1] - 109.5) < 1e-6 && Math.abs(b[1] - 109.5) < 1e-6 && Math.min(a[0], b[0]) >= -49.5 - 1e-6 && Math.max(a[0], b[0]) <= -48.5 + 1e-6; };
    out.covered = near.filter(covered).length;
    out.alcove = { covered: near.filter(function (w) { return inAlcove(w.a, w.b) && covered(w); }).length, sections: S.filter(function (s) { return inAlcove(s.a, s.b); }).length };
    out.nearNoSection = near.filter(function (w) { var m = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2]; return !covered(w) && !S.some(function (s) { return onSeg(m, s.a, s.b); }); }).map(function (w) { return w.a; });
    out.sectionCovered = S.filter(function (s) { return [0.25, 0.75].some(function (u) { return blockedT(s.a[0] + (s.b[0] - s.a[0]) * u + (s.outer.a[0] - s.a[0]) * 0.45, s.a[1] + (s.b[1] - s.a[1]) * u + (s.outer.a[1] - s.a[1]) * 0.45); }); }).map(function (s) { return s.a; });
    // each face hangs as deep as nothing stands in front of it: clear all the way down (a point of it z deep shows where the floor is z / 2 TILE_H tiles towards the camera), and cut short only where something is
    var D = C.nearD, H2 = 2 * TILE_H; out.faceOver = []; out.faceShort = []; out.partial = 0;
    S.forEach(function (s) { var dep = s.dep || [D, D, D, D, D]; if (s.dep) out.partial++;
        [0.001, 0.25, 0.5, 0.75, 0.999].forEach(function (u, i) { var x = s.outer.a[0] + (s.outer.b[0] - s.outer.a[0]) * u, y = s.outer.a[1] + (s.outer.b[1] - s.outer.a[1]) * u, d = dep[i] / H2, clear = true;
            for (var t = 0.02; t < d - 0.03; t += 0.01) if (blockedT(x + t, y + t)) { clear = false; break; }
            if (!clear) out.faceOver.push([s.a, u, dep[i]]); else if (dep[i] < D - 1 && !blockedT(x + d + 0.03, y + d + 0.03)) out.faceShort.push([s.a, u, dep[i]]); }); });
    out.sectionOffNear = S.filter(function (s) { return [0.25, 0.75].some(function (t) { var p = [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]; return !near.some(function (w) { return onSeg(p, w.a, w.b); }); }); }).map(function (s) { return s.a; });
    out.sectionBadOuter = S.filter(function (s) { var ox = s.outer.a[0] - s.a[0], oy = s.outer.a[1] - s.a[1]; return !(Math.abs(Math.hypot(ox, oy) - C.nearT) < 1e-6 && ox + oy > 0 && Math.abs((s.outer.b[0] - s.b[0]) - ox) < 1e-9 && Math.abs((s.outer.b[1] - s.b[1]) - oy) < 1e-9 && Math.abs((s.b[0] - s.a[0]) * ox + (s.b[1] - s.a[1]) * oy) < 1e-9); }).map(function (s) { return s.a; });
    // THE GATES: a piece a bar, cut midway between the bars, each sorted by its own far end; the lock sorted just after the pieces it lies across; for a body on every tile along a gate (half a tile
    // wide on the screen, half a tile from the gate's line), every piece and the lock it overlaps on the screen sort before it in front of the gate and after it behind
    out.gates = []; var GI = _fp.items.filter(function (i) { return i.fp === 'sewer' && i.what === 'gate'; }), ids = [];
    GI.forEach(function (i) { if (ids.indexOf(i.id) < 0) ids.push(i.id); });
    ids.forEach(function (id) {
        var P = GI.filter(function (i) { return i.id === id && !i.lock; }).sort(function (p, q) { return p.u0 - q.u0; }), lock = GI.filter(function (i) { return i.id === id && i.lock; }), g = P[0], a = g.a, b = g.b, L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = _fpGateBars(L, !!g.boss);
        var at = function (u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }, sx = function (p) { return p[0] - p[1]; }, dep = function (u0, u1) { var p = at(u0), q = at(u1); return Math.max(p[0] + p[1], q[0] + q[1]) + 0.03; };
        var r = { id: id, pieces: P.length, n: n, locks: lock.length, gaps: 0, bars: 0, most: 0, depthOff: 0, lockOff: 0, wrong: [] };
        P.forEach(function (p, i) { if (i === 0 ? p.u0 !== 0 : Math.abs(p.u0 - P[i - 1].u1) > 1e-9) r.gaps++; if (Math.abs(p.depth - dep(p.u0, p.u1)) > 1e-9) r.depthOff++; var c = 0; for (var k = 1; k < n; k++) if (p.u0 < k / n && k / n < p.u1) c++; r.most = Math.max(r.most, c); });
        for (var k = 1; k < n; k++) if (P.filter(function (p) { return p.u0 < k / n - 1e-6 && k / n < p.u1 - 1e-6; }).length === 1) r.bars++;   // (each bar inside one piece, never on a cut)
        if (P[P.length - 1].u1 !== 1) r.gaps++;
        var lu = 0.25 / L, under = P.filter(function (p) { return p.u1 > 0.5 - lu && p.u0 < 0.5 + lu; }).map(function (p) { return p.depth; });
        if (lock.length !== 1 || Math.abs(lock[0].depth - (Math.max.apply(null, under) + 0.001)) > 1e-9) r.lockOff++;
        var nrm2 = nrm({ a: a, b: b }), parts = P.map(function (p) { return { lo: Math.min(sx(at(p.u0)), sx(at(p.u1))), hi: Math.max(sx(at(p.u0)), sx(at(p.u1))), d: p.depth, k: +p.u0.toFixed(3) }; });
        if (lock.length) parts.push({ lo: Math.min(sx(at(0.5 - lu)), sx(at(0.5 + lu))), hi: Math.max(sx(at(0.5 - lu)), sx(at(0.5 + lu))), d: lock[0].depth, k: 'lock' });
        for (var t = 0.5; t < L; t += 1) [1, -1].forEach(function (side) { var m = at(t / L), bx = m[0] + nrm2[0] * 0.5 * side, by = m[1] + nrm2[1] * 0.5 * side, c = bx - by, d = bx + by;
            parts.forEach(function (q) { if (q.hi > c - 0.45 && q.lo < c + 0.45 && (side > 0 ? q.d >= d : q.d <= d)) r.wrong.push([bx, by, side > 0 ? 'front' : 'behind', q.k]); }); });
        out.gates.push(r);
    });
    // the north passages: their mouths from the outline, a lintel over each, the east jambs' tops
    out.mouths = _fpSewerMouths(F, 'sewers').map(function (m) { return [m.x0, m.x1, m.y]; });
    out.lintels = _fp.items.filter(function (i) { return i.fp === 'sewer' && i.what === 'lintel'; }).map(function (i) { return [i.x0, i.x1, i.y0, !!i.span, i.bb.join()]; });
    out.jambs = _fpSewerMouths(F, 'sewers').map(function (m) { var L = 0; jamb.forEach(function (w) { if (Math.abs(w.a[0] - m.x1) < 1e-6) L += Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]); }); return [m.x1, +L.toFixed(3), +(m.y - m.top).toFixed(3)]; });
    // the lamps: on the far walls, none by a door or a light of the map's
    var busy = (F.decor || []).filter(function (d) { return d.room === 'sewers' && d.a && d.b && (d.kind === 'portal_door' || d.kind === 'wall_light' || d.kind === 'brood_hole'); });
    var L = _fp.items.filter(function (i) { return i.fp === 'sewer' && i.what === 'lamp'; });
    out.lamps = L.length; out.busy = busy.length;
    out.lampOffFar = L.filter(function (l) { return !far.some(function (w) { return onSeg([l.x, l.y], w.a, w.b); }); }).map(function (l) { return [l.x, l.y]; });
    out.lampByBusy = L.filter(function (l) { return busy.some(function (d) { var ax = d.a[0], ay = d.a[1], dx = d.b[0] - ax, dy = d.b[1] - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((l.x - ax) * dx + (l.y - ay) * dy) / L2)); return Math.hypot(ax + dx * t - l.x, ay + dy * t - l.y) < 0.9; }); }).map(function (l) { return [l.x, l.y]; });
    // every new piece drawn (through the game's own drawing of an item)
    out.drawErr = [];
    _fp.items.filter(function (i) { return i.fp === 'sewer' && /^(section|lintel|lamp)$/.test(i.what); }).forEach(function (it) { try { drawFacilityItem(it); } catch (e) { out.drawErr.push(it.what + ': ' + e); } });
    // THE FLOOR
    var water = _fpSewerWaterCells(F), E = _fp.wallEdges, tunnel = [], nest = [], decks = (F.decor || []).filter(function (d) { return d.kind === 'bridge_deck' && d.rect; }), onDeck = function (x, y) { return decks.some(function (d) { return x >= d.rect[0] && x <= d.rect[2] && y >= d.rect[1] && y <= d.rect[3]; }); }, deckCells = 0;
    _fp.floorOps.forEach(function (ops, k) { var c = k.split(',').map(Number), r = facilityRoomAt(c[0], c[1], F); if (!r || r.id !== 'sewers') return; if (onDeck(c[0], c[1])) { deckCells++; return; } (_fpSewerOwnLook(c[0], c[1], F) ? nest : tunnel).push([c[0], c[1], ops]); });   // (a bridge's deck: its grating over the water, not the plate)
    out.tunnelCells = tunnel.length; out.nestCells = nest.length; out.deckCells = deckCells;
    out.deckPlate = []; _fp.floorOps.forEach(function (ops, k) { var c = k.split(',').map(Number); if (onDeck(c[0], c[1]) && ops.some(function (o) { return o.t === 'M' || (o.t === 'P' && (o.c === C.kerb || o.c === C.hazard)); })) out.deckPlate.push(k); });
    var base = _fpRgba(C.floor, 1), f = { base: [], ticks: [], plates: [], kerb: [], kerbElse: [], hazard: [], foot: [], banks: 0, feet: 0 };
    tunnel.forEach(function (t) { var x = t[0], y = t[1], ops = t[2], T = _fpSewerTicks(x, y);
        if (!(ops[0].t === 'D' && ops[0].x && ops[0].c === base)) f.base.push([x, y]);
        if (ops.indexOf(T[0]) < 0 || ops.indexOf(T[1]) < 0) f.ticks.push([x, y]);
        if (!ops.some(function (o) { return o.t === 'P' && (o.c === C.floor || o.c === C.floor2); })) f.plates.push([x, y]);
        var sides = [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(function (d) { return water.has((x + d[0]) + ',' + (y + d[1])); }).length, kerbs = ops.filter(function (o) { return o.t === 'P' && o.c === C.kerb; }).length, haz = ops.filter(function (o) { return o.t === 'P' && o.c === C.hazard; }).length;
        if (sides) { f.banks++; if (kerbs !== sides) f.kerb.push([x, y, sides, kerbs]); if (!haz) f.hazard.push([x, y]); } else if (kerbs || haz) f.kerbElse.push([x, y]);
        ['N', 'W'].forEach(function (e) { if (!E.has(x + ',' + y + ',' + e)) return; f.feet++; if (!ops.some(function (o) { return o.t === 'P' && o.c === C.foot && (e === 'N' ? o.p[1] === -0.5 && o.p[5] === -0.4 : o.p[0] === -0.5 && o.p[2] === -0.4); })) f.foot.push([x, y, e]); });
    });
    out.floor = f;
    // the ticks: shared every 6 tiles, and the same as the tile's own grid (the ticks whose middle is on the tile, to a millionth of a tile)
    var mine = function (x, y) { var d = 0.025, st = 0.12, P = []; for (var a = Math.floor((x - 0.6) / st); a * st <= x + 0.6; a++) for (var b = Math.floor((y - 0.6) / st); b * st <= y + 0.6; b++) { var u = a * st - x + ((b % 2) ? 0.06 : 0), v = b * st - y, s = ((a + b) % 2) ? 1 : -1; P.push(u - d, v - d * s, u + d, v + d * s); } return P; };
    var mids = function (P) { var m = []; for (var j = 0; j < P.length; j += 4) { var u = (P[j] + P[j + 2]) / 2, v = (P[j + 1] + P[j + 3]) / 2; if (Math.abs(u) <= 0.55 && Math.abs(v) <= 0.55) m.push(u.toFixed(6) + ':' + v.toFixed(6) + ':' + (P[j + 3] > P[j + 1] ? 1 : -1)); } return m.sort().join(); };
    out.tickDiff = []; out.tickShare = [];
    tunnel.slice(0, 80).forEach(function (t) { var x = t[0], y = t[1]; if (mids(_fpSewerTicks(x, y)[0].p) !== mids(mine(x, y))) out.tickDiff.push([x, y]); if (_fpSewerTicks(x + 6, y) !== _fpSewerTicks(x, y) || _fpSewerTicks(x, y - 12) !== _fpSewerTicks(x, y)) out.tickShare.push([x, y]); });
    out.tickKeys = _fpRfTicks.size;
    // the Nest's floor as it was: the old base and marks, nothing of the plate
    var oldBase = _fpRgba(FP_ROOM_STYLE.sewers.fa, 1);
    out.nestOdd = nest.filter(function (t) { var ops = t[2]; return !(ops[0].t === 'D' && ops[0].c === oldBase) || ops.some(function (o) { return o.t === 'M' || (o.t === 'P' && (o.c === C.kerb || o.c === C.hazard || o.c === C.foot || o.c === C.floor || o.c === C.floor2)); }); }).map(function (t) { return [t[0], t[1]]; });
    // no other room's floor touched
    out.otherBaseAt = Object.keys(FP_ROOM_STYLE).filter(function (id) { return id !== 'sewers' && (FP_ROOM_STYLE[id].refit || _fpStyleFloorFor(id).baseAt !== undefined); });
    out.refitRooms = Object.keys(FP_ROOM_STYLE).filter(function (id) { return FP_ROOM_STYLE[id].refit; });
    // the marks' memory: the numbers the tunnel's marks hold (a mark shared by many tiles counted once), over and under the floor
    var seen = new Set(), nums = 0;
    [_fp.floorOps, _fp.underOps].forEach(function (map) { if (map) map.forEach(function (ops, k) { var c = k.split(',').map(Number), r = facilityRoomAt(c[0], c[1], F); if (!r || r.id !== 'sewers' || _fpSewerOwnLook(c[0], c[1], F)) return; ops.forEach(function (o) { if (seen.has(o)) return; seen.add(o); nums += o.p ? o.p.length : 0; }); }); });
    out.nums = nums;
    // a mark of many short lines: one stroke
    var calls = [], pen = { set strokeStyle(v) { calls.push('style ' + v); }, set lineWidth(v) { calls.push('width ' + v); }, set lineCap(v) { calls.push('cap ' + v); }, beginPath: function () { calls.push('begin'); }, moveTo: function () { calls.push('move'); }, lineTo: function () { calls.push('line'); }, stroke: function () { calls.push('stroke'); } };
    _fpPaintOps(pen, [{ t: 'M', c: '#123456', w: 2, cap: 'round', p: [0, 0, 0.1, 0.1, 0.2, 0.2, 0.3, 0.3] }], 100, 100, true, null);
    out.pen = calls.join();
    return out;
})()`;

// THE REAL PAGE: at the north bank and the west bridge, graphics HIGH and LOW; one frame with the refit, one with the old walls (the refit's items taken out), counted in canvas calls. The counter is
// put on the canvas before the game's scripts load: the dimmed pen keeps the canvas's own calls as they are when it is made (js/facilityplay.js), and a counter put on after would miss them all
const COUNTER = `<script>window.__n = { c: 0, on: false }; (function () { var P = CanvasRenderingContext2D.prototype; ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'clearRect'].forEach(function (m) { var o = P[m]; P[m] = function () { if (window.__n.on) window.__n.c++; return o.apply(this, arguments); }; }); })();</script>`;
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(function(){
  var out = { spots: [] };
  try {
    facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
    for (const id of Object.keys(_fp.relays || {})) relaySetOnline(id);
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); _bossTestEntry = function(){}; bossReset(); battleViewReset();
    const n = window.__n, R = FP_ROOM_STYLE.sewers, mine = _fp.items.filter(function(i){ return i.fp === 'sewer' && /^(section|lintel|lamp)$/.test(i.what); });
    const drawn = { wall: 0, section: 0, lintel: 0, lamp: 0 }, rw = window._fpSewerRefitWall, sd = window.facilitySewerDraw;
    window._fpSewerRefitWall = function (it, Hd) { const r = rw(it, Hd); if (r) drawn.wall++; return r; };
    window.facilitySewerDraw = function (it) { if (drawn[it.what] !== undefined) drawn[it.what]++; return sd(it); };
    const one = function () { n.c = 0; n.on = true; frame++; try { render(); } finally { n.on = false; } return n.c; };
    [['north bank', -30, 109], ['west bridge', -39.5, 112]].forEach(function (s) {
      [false, true].forEach(function (low) {
        gfxLow = low; player.x = player.targetX = player.visualX = s[1]; player.y = player.targetY = player.visualY = s[2]; player.fpPath = null;
        for (let i = 0; i < 40; i++) { frame++; render(); }
        for (const k in drawn) drawn[k] = 0; const nNew = one(), d = Object.assign({}, drawn);
        R.refit = false; _fp.items = _fp.items.filter(function(i){ return mine.indexOf(i) < 0; });
        for (let i = 0; i < 3; i++) { frame++; render(); }
        for (const k in drawn) drawn[k] = 0; const nOld = one(), dOld = Object.assign({}, drawn);
        R.refit = true; for (const it of mine) _fp.items.push(it);
        out.spots.push({ name: s[0], low: low, nNew: nNew, nOld: nOld, drawn: d, drawnOld: dOld });
      });
    });
    window._fpSewerRefitWall = rw; window.facilitySewerDraw = sd;
    // THE OWNER'S CIRCLE (2026-11-15, "I see this error"): a dark block over the river's west end, by the outfall. Three points of the river there: the water paints them, no wall section may
    gfxLow = false; player.x = player.targetX = player.visualX = -39.5; player.y = player.targetY = player.visualY = 112; player.fpPath = null;
    for (let i = 0; i < 40; i++) { frame++; render(); }
    const G = canvas.getContext('2d'), probe = [[-48.0, 110.9], [-47.6, 111.3], [-47.3, 111.6]], paints = { water: 0, section: 0, at: [] };
    window.facilitySewerDraw = function (it) {
      if (it.what !== 'water' && it.what !== 'section') return sd(it);
      const T = G.getTransform(), pts = probe.map(function (q) { const p = _fpP(q[0], q[1], 0), d = T.transformPoint(new DOMPoint(p[0], p[1])); return [Math.round(d.x), Math.round(d.y)]; });
      const read = function () { return pts.map(function (q) { return q[0] >= 0 && q[1] >= 0 && q[0] < canvas.width && q[1] < canvas.height ? Array.from(G.getImageData(q[0], q[1], 1, 1).data).join() : 'off'; }); };
      const b0 = read(), r = sd(it), b1 = read();
      if (b0.some(function (v, i) { return v !== b1[i] && v !== 'off'; })) { paints[it.what]++; if (it.what === 'section') paints.at.push(it.a); }
      out.probeOn = pts.every(function (q) { return q[0] >= 0 && q[1] >= 0 && q[0] < canvas.width && q[1] < canvas.height; });
      return r; };
    frame++; render(); window.facilitySewerDraw = sd; out.probe = paints;
    // THE GATES (the owner, 2026-11-15: "Fix the gate"): the wide gate was one item sorted by its east end, so the player in front of its west part was drawn behind its bars. A body's pixels: the
    // gate's pieces drawn before it and after it that paint them. In front, all before; behind (a follower on Side Quest's platform), all after
    const dp = window.drawPlayer, dn = window.drawNPC, body = function (who, x, y) {
      if (who === player) { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; }
      else { who.x = who.visualX = x; who.y = who.visualY = y; who.fpPath = null; player.x = player.targetX = player.visualX = x + 1; player.y = player.targetY = player.visualY = y + 2.5; player.fpPath = null; }
      for (let i = 0; i < 30; i++) { frame++; render(); }
      let box = null, drawn = false; const res = { before: 0, after: 0, ids: [] };
      const mark = function (o) { const T = G.getTransform(); box = []; for (let dx = -9; dx <= 9; dx += 6) for (let dy = -36; dy <= -6; dy += 6) { const d = T.transformPoint(new DOMPoint(o.x + dx, o.y + dy)); box.push([Math.round(d.x), Math.round(d.y)]); } };
      window.drawPlayer = function (o) { if (who === player) { if (!box) mark(o); drawn = true; } return dp.apply(this, arguments); };
      window.drawNPC = function (a, px, py) { if (a === who) { if (!box) mark({ x: px, y: py }); drawn = true; } return dn.apply(this, arguments); };
      const pin = function () { if (who !== player) { who.x = who.visualX = x; who.y = who.visualY = y; who.fpPath = null; } };   // (a follower's own step pulls it back towards the squad's places: held where it is put)
      pin(); frame++; render(); drawn = false;   // (the first frame finds where the body is on the screen)
      const read = function () { return box.map(function (q) { return Array.from(G.getImageData(q[0], q[1], 1, 1).data).join(); }); };
      window.facilitySewerDraw = function (it) { if (it.what !== 'gate' || !box) return sd(it); const b0 = read(), r = sd(it), b1 = read(); if (b0.some(function (v, i) { return v !== b1[i]; })) { res[drawn ? 'after' : 'before']++; if (res.ids.indexOf(it.id) < 0) res.ids.push(it.id); } return r; };
      pin(); frame++; render(); window.drawPlayer = dp; window.drawNPC = dn; window.facilitySewerDraw = sd; res.seen = !!box; res.at = who === player ? [player.x, player.y] : [who.x, who.y]; return res;
    };
    out.gateFront = body(player, -32, 108);
    const fol = (typeof followers !== 'undefined' && followers || []).filter(function (f) { return !f.dead; })[0];
    out.gateBehind = fol ? body(fol, -31, 107) : null;
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__sl'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function realPage() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, () => '<head><base href="file://' + ROOT + '/">' + COUNTER).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1366,892', '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__sl">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    let X = null; try { X = JSON.parse(vm.runInContext('JSON.stringify(' + FACTS + ')', context)); } catch (e) { X = { err: String(e && e.stack || e) }; }
    if (process.env.VERBOSE) console.log(JSON.stringify(X));

    group('THE WIRING: the Sewers\' tunnel refitted (FP_ROOM_STYLE.sewers.refit), the walls through _fpStyleWall, the floor through _fpStyleFloorFor, the pieces through the Sewers\' items');
    check('the facts were worked out', () => ok(X && !X.err, 'it threw: ' + (X && X.err)));
    check('only the Sewers are refitted; the hooks are in place', () => {
        same(JSON.stringify(X.refitRooms), '["sewers"]', 'the rooms refitted');
        ok(/function _fpStyleWall\(it, Hd\) \{\s*if \(_fpRoomStyle\(it\.room\)\.refit && typeof _fpSewerRefitWall === "function" && _fpSewerRefitWall\(it, Hd\)\) return;/.test(rd('js/facilitystyle.js')), 'the wall hook (js/facilitystyle.js _fpStyleWall)');
        ok(/return R\.refit && typeof _fpSewerRefitStyle === "function" \? _fpSewerRefitStyle\(S, id\) : S;/.test(rd('js/facilitystyleall.js')), 'the floor hook (js/facilitystyleall.js _fpStyleFloorFor)');
        const SW = rd('js/facilitysewers.js');
        ok(/if \(typeof _fpSewerRefitItems === "function"\) for \(const it of _fpSewerRefitItems\(F\)\) items\.push\(it\);/.test(SW), 'the pieces (facilitySewerItems)');
        ok(/else if \(it\.what === "section"\) _fpSewerSection\(it\); else if \(it\.what === "lintel"\) _fpSewerLintel\(it\); else if \(it\.what === "lamp"\) _fpSewerLamp\(it\);/.test(SW), 'their drawing (facilitySewerDraw)');
    });

    group('THE WALLS: look 1\'s in the tunnel, the Nest\'s as they were');
    check('the Sewers\' plain wall pieces: ' + (X.pieces ? X.pieces.all + ' (' + X.pieces.nest + ' in the Nest, ' + X.pieces.far + ' far, ' + X.pieces.near + ' near, ' + X.pieces.jamb + ' the passages\' east jambs)' : '?'), () => {
        ok(X.pieces.nest > 10 && X.pieces.far > 50 && X.pieces.near > 30 && X.pieces.jamb > 10, 'the pieces: ' + JSON.stringify(X.pieces));
    });
    check('every tunnel piece is drawn by the refit and none of the Nest\'s; through _fpStyleWall the old look runs for the Nest\'s pieces only', () => {
        same(X.hook.threw.length, 0, 'errors: ' + X.hook.threw.slice(0, 2).join(' | '));
        same(X.hook.tunnelFalse.length, 0, 'tunnel pieces left to the old look, at ' + JSON.stringify(X.hook.tunnelFalse.slice(0, 4)));
        same(X.hook.nestTrue.length, 0, 'Nest pieces drawn by the refit, at ' + JSON.stringify(X.hook.nestTrue.slice(0, 4)));
        same(X.hook.oldForTunnel, 0, 'tunnel pieces the old look also ran for');
        same(X.hook.oldForNest, X.pieces.nest, 'Nest pieces the old look ran for');
    });
    check('the near walls cut clean: ' + X.sections + ' sections, a tile each; every near piece under one or inside another wall\'s mass (' + X.covered + ' half tiles: the ends of walls), none on anything else, each\'s outer edge FP_SEWER_REFIT.nearT towards the camera', () => {
        ok(X.sections * 2 + X.covered >= X.pieces.near, 'sections: ' + X.sections + ' and ' + X.covered + ' covered for ' + X.pieces.near + ' half-tile pieces');
        same(X.nearNoSection.length, 0, 'near pieces with no section and not covered, at ' + JSON.stringify(X.nearNoSection.slice(0, 4)));
        same(X.sectionOffNear.length, 0, 'sections not on a near piece, at ' + JSON.stringify(X.sectionOffNear.slice(0, 4)));
        same(X.sectionCovered.length, 0, 'sections inside another wall\'s mass, at ' + JSON.stringify(X.sectionCovered.slice(0, 4)));
        same(X.sectionBadOuter.length, 0, 'sections whose outer edge is not nearT towards the camera, at ' + JSON.stringify(X.sectionBadOuter.slice(0, 4)));
    });
    check('the owner\'s circle (2026-11-15): the south side of the alcove beside the outfall is the west wall\'s end, inside its mass, so it has no section (it hung a dark block over the river)', () => {
        same(X.alcove.covered, 2, 'the alcove\'s two half-tile pieces at y 109.5 covered');
        same(X.alcove.sections, 0, 'sections there');
    });
    check('each section\'s face hangs as deep as nothing stands in front of it (' + X.partial + ' cut short where a floor or a wall\'s mass is in front): never over one, never short of one', () => {
        ok(X.partial >= 2, 'faces cut short: ' + X.partial + ' (the corners of the subway passage and the Nest have them)');
        same(X.faceOver.length, 0, 'faces hanging where something is in front of them (section, along, px): ' + JSON.stringify(X.faceOver.slice(0, 3)));
        same(X.faceShort.length, 0, 'faces cut short with nothing in front (section, along, px): ' + JSON.stringify(X.faceShort.slice(0, 3)));
    });
    check('the five north passages\' mouths found from the room\'s outline, a lintel over each (spanning, its box the mouth\'s), and each east jamb only its top, all the way up', () => {
        same(JSON.stringify(X.mouths), JSON.stringify([[-48.5, -46.5, 107.5], [-45.5, -43.5, 107.5], [-41.5, -35.5, 107.5], [-33.5, -28.5, 107.5], [-22.5, -16.5, 107.5]]), 'the mouths (x0, x1, y)');
        same(JSON.stringify(X.lintels), JSON.stringify(X.mouths.map(m => [m[0], m[1], m[2], true, [m[0], m[2] - 1, m[1], m[2] + 1].join()])), 'the lintels');
        for (const j of X.jambs) same(j[1], j[2], 'the jamb at x ' + j[0] + ': its length drawn as a top');
    });
    check('the gates (2026-11-15, "Fix the gate"): ' + X.gates.map(g => g.id + ' in ' + g.pieces + ' pieces').join(', ') + ', two bars a piece (a post with the bars beside it at each end), cut between the bars, each sorted by its own far end; the lock just after the pieces under it; on every tile along them a body in front sorts after every piece it overlaps, a body behind before', () => {
        same(X.gates.length, 2, 'gates');
        for (const g of X.gates) {
            same(g.gaps, 0, g.id + ': gaps or overlaps between pieces'); same(g.bars, g.n - 1, g.id + ': bars each inside one piece, none on a cut'); ok(g.most <= 2 && g.pieces >= g.n / 2, g.id + ': ' + g.pieces + ' pieces for ' + g.n + ' bars, at most ' + g.most + ' bars a piece');
            same(g.depthOff, 0, g.id + ': pieces not sorted by their own far end'); same(g.locks, 1, g.id + ': locks'); same(g.lockOff, 0, g.id + ': the lock not just after the pieces under it');
            same(g.wrong.length, 0, g.id + ': bodies sorted the wrong side of a piece (x, y, where, piece): ' + JSON.stringify(g.wrong.slice(0, 3)));
        }
    });
    check('a lamp every few tiles on the far walls (' + X.lamps + '), none off a far wall or within 0.9 of a door, a light or a brood hole of the map\'s (' + X.busy + ')', () => {
        ok(X.lamps >= 5, 'lamps: ' + X.lamps);
        same(X.lampOffFar.length, 0, 'lamps off a far wall, at ' + JSON.stringify(X.lampOffFar.slice(0, 4)));
        same(X.lampByBusy.length, 0, 'lamps by a door or a light, at ' + JSON.stringify(X.lampByBusy.slice(0, 4)));
    });
    check('every section, lintel and lamp drawn through the game\'s drawing of an item without an error', () => same(X.drawErr.length, 0, 'errors: ' + X.drawErr.slice(0, 2).join(' | ')));

    group('THE FLOOR: look 4\'s checker plate in the tunnel, the Nest\'s as it was');
    check('the tunnel\'s ' + X.tunnelCells + ' tiles: the plate\'s own base (opaque), its two tones of plate, its ticks', () => {
        ok(X.tunnelCells > 200, 'tiles: ' + X.tunnelCells);
        same(X.floor.base.length, 0, 'tiles without the plate\'s opaque base, at ' + JSON.stringify(X.floor.base.slice(0, 4)));
        same(X.floor.plates.length, 0, 'tiles without a plate, at ' + JSON.stringify(X.floor.plates.slice(0, 4)));
        same(X.floor.ticks.length, 0, 'tiles without the shared ticks, at ' + JSON.stringify(X.floor.ticks.slice(0, 4)));
    });
    check('the ticks are shared every 6 tiles (' + X.tickKeys + ' pairs in all) and are the tile\'s own grid', () => {
        ok(X.tickKeys >= 1 && X.tickKeys <= 36, 'pairs of tick marks: ' + X.tickKeys);
        same(X.tickShare.length, 0, 'tiles 6 apart not sharing, at ' + JSON.stringify(X.tickShare.slice(0, 4)));
        same(X.tickDiff.length, 0, 'tiles whose shared ticks are not their own grid, at ' + JSON.stringify(X.tickDiff.slice(0, 4)));
    });
    check('a hazard kerb on every side over the water (' + X.floor.banks + ' tiles on the bank) and on no other tile; dark at a wall\'s foot (' + X.floor.feet + ' edges)', () => {
        ok(X.floor.banks > 40 && X.floor.feet > 40, 'bank tiles, wall feet: ' + X.floor.banks + ', ' + X.floor.feet);
        same(X.floor.kerb.length, 0, 'tiles whose kerbs are not one a side over the water (x, y, sides, kerbs): ' + JSON.stringify(X.floor.kerb.slice(0, 4)));
        same(X.floor.hazard.length, 0, 'bank tiles without the stripes, at ' + JSON.stringify(X.floor.hazard.slice(0, 4)));
        same(X.floor.kerbElse.length, 0, 'kerbs away from the water, at ' + JSON.stringify(X.floor.kerbElse.slice(0, 4)));
        same(X.floor.foot.length, 0, 'wall feet without the dark (x, y, edge): ' + JSON.stringify(X.floor.foot.slice(0, 4)));
    });
    check('the bridges\' decks (' + X.deckCells + ' tiles) their grating, with no plate and no kerb', () => {
        ok(X.deckCells >= 6, 'deck tiles: ' + X.deckCells);
        same(X.deckPlate.length, 0, 'deck tiles with the plate or a kerb: ' + X.deckPlate.slice(0, 4).join(' '));
    });
    check('the Nest\'s ' + X.nestCells + ' tiles as they were (the old base and marks, nothing of the plate); no other room\'s floor touched', () => {
        ok(X.nestCells > 50, 'Nest tiles: ' + X.nestCells);
        same(X.nestOdd.length, 0, 'Nest tiles changed, at ' + JSON.stringify(X.nestOdd.slice(0, 4)));
        same(X.otherBaseAt.length, 0, 'other rooms with a base of their own per tile: ' + X.otherBaseAt.join());
    });
    check('the tunnel\'s marks hold ' + X.nums + ' numbers, under 150,000 (one set of ticks a tile held 439,156)', () => ok(X.nums > 20000 && X.nums < 150000, 'numbers: ' + X.nums));
    check('a mark of many short lines is painted as one stroke (its cap put back after)', () => same(X.pen, 'style #123456,width 2,cap round,begin,move,line,move,line,stroke,cap butt', 'the pen\'s calls'));

    group('THE REAL PAGE (game.html in Chromium, 1366 by 892)');
    const real = realPage(); if (process.env.VERBOSE) console.log(JSON.stringify(real));
    if (real === null) { console.log('  (no Chromium on this machine: the real page is not checked)'); }
    else {
        check('the page ran', () => { ok(real, 'the page did not report'); ok(!real.err, 'it threw: ' + real.err); same((real.errs || []).length, 0, 'errors on the page: ' + JSON.stringify(real.errs)); });
        if (real && !real.err) {
            for (const s of real.spots) check(s.name + ', graphics ' + (s.low ? 'LOW' : 'HIGH') + ': the refit drawn (' + s.drawn.wall + ' wall pieces, ' + s.drawn.section + ' sections, ' + s.drawn.lintel + ' lintels, ' + s.drawn.lamp + ' lamps); a frame ' + s.nNew + ' canvas calls, the old walls\' ' + s.nOld, () => {
                ok(s.drawn.wall > 20, 'wall pieces drawn by the refit: ' + s.drawn.wall);
                same(s.drawnOld.wall + s.drawnOld.section + s.drawnOld.lintel + s.drawnOld.lamp, 0, 'the refit drawn with it turned off');
                ok(s.nNew <= s.nOld * 1.15, 'canvas calls a frame, refit and old: ' + s.nNew + ', ' + s.nOld);
            });
            check('the owner\'s circle (2026-11-15): over the river\'s west end, by the outfall, the water is drawn and no wall section is (it was a dark block: a section hung below the end of the west wall)', () => {
                ok(real.probe && real.probeOn, 'the probe points are not on the screen: ' + JSON.stringify(real.probe));
                ok(real.probe.water > 0, 'the water did not paint the probe points (the probe is not over the river)');
                same(real.probe.section, 0, 'sections painted over the river there, at ' + JSON.stringify(real.probe.at));
            });
            check('the gate (2026-11-15, "Fix the gate"): the player in front of the wide gate\'s west part is drawn over its bars (' + JSON.stringify(real.gateFront) + '); a follower behind it, on Side Quest\'s platform, under them (' + JSON.stringify(real.gateBehind) + ')', () => {
                ok(real.gateFront && real.gateFront.before > 0, 'the gate is not behind the player there (the probe is not over the gate): ' + JSON.stringify(real.gateFront));
                same(real.gateFront.after, 0, 'gate pieces drawn over the player in front of the gate');
                ok(real.gateBehind && real.gateBehind.after > 0, 'the gate is not over the follower behind it: ' + JSON.stringify(real.gateBehind));
                same(real.gateBehind.before, 0, 'gate pieces drawn under the follower behind the gate');
            });
            check('at the north bank a lintel and a section are on the screen; lamps somewhere', () => {
                const nb = real.spots.filter(s => s.name === 'north bank'); ok(nb.length && nb.every(s => s.drawn.lintel > 0 && s.drawn.section > 0), 'the north bank: ' + JSON.stringify(nb.map(s => s.drawn)));
                ok(real.spots.some(s => s.drawn.lamp > 0), 'no lamp drawn at either spot');
            });
        }
    }

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
