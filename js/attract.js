// ─────────────────────────────────────────────────────────
//  THE ATTRACT SCREEN: the facility on its own, dim and quiet, as the website's background
// ─────────────────────────────────────────────────────────
// ASKED: "in the main website it loads in the map for conduit and it keeps it all dark or dimly lit and has the evolved followers every now and again just rummaging through and searching the abandoned halls"
// index.html fixes game.html?attract behind its page, in an iframe that takes no clicks. ?attract is the facility with nobody playing it:
//   NOTHING KEPT   nothing is read from or written to storage (a visitor's own save is left exactly as it was); there is no tutorial, no class picker, no creature and no default squad
//   DIM            no blackout, but every room is at ATTRACT.lit.base, the room the camera is in a little brighter, a room with a searcher in it brighter than the rest; a failing lamp stutters now and then
//   THE CAMERA     is the player, hidden: it glides from room to room, and follows a searcher once it has come into view (and stays where it is while one leaves)
//   THE SEARCHERS  an EVOLVED follower (any of the twelve forms, at level 10) walks in from out of sight, goes through a few rooms, stops in each (turning on the spot, longer beside a desk or a crate,
//                  as if going through it) and then walks out of sight and is gone. Now and again, never more than ATTRACT.cap at once; each carries a small pool of light on the floor round it.
//   DRAWN          LOW graphics, the interface hidden, the picture at about 30 frames a second while the game steps at 60, and no bigger than about ATTRACT.pixels however big the screen
//   THE PAGE       is told when it is showing (postMessage {conduit: "attract-ready"}) so it can fade the picture in
// The pieces are small hooks elsewhere, each guarded by attractOn(): js/facilityplay.js (start, storage, chips), js/facilitysave.js (the mode, no save), js/facilitytutorial.js (the tick, the dark),
// js/facilitystyle.js (the room light), js/game.js (the hidden player, the frame pace), js/buildmenu.js (the canvas interface), js/evolution.js (a searcher fades), game.html (the page's CSS).

const ATTRACT = {
    lit: { base: 0.03, here: 0.16, crowd: 0.12 },    // how lit a room is (0 to 1): every room, the room the camera is in, a room with a searcher in it
    dark: 0.94,                                    // how much an unlit thing loses (FP_DARK is 0.82)
    first: 150, gap: [1500, 3300], cap: 2, again: 0.35,   // frames before the first searcher; frames from one searcher's arrival to the next one's; at most this many at once; the chance of a second while one is still about
    stops: [3, 5], pause: [150, 420], look: [45, 110],    // rooms it goes through; frames it stands at each (longer beside a prop); frames between turns of its head
    hurry: 2.4, stuck: 1800, fade: 60,             // its speed coming in and going out, as many times its walk; frames before a waypoint it cannot reach is dropped; frames to fade out
    cam: { ease: 0.012, max: 0.05, hold: [700, 1300] },   // the camera: how fast it closes on a goal, its top speed (tiles a frame), frames it stays in a room with nobody to follow
    glow: { r: 3.6, k: 0.7 },                     // the pool of light under a searcher
    ready: 90, pixels: 1280 * 720, zoom: 1.6,      // frames before the page is told; the picture is drawn at about this many pixels, scaled up by up to this much
};

let _atSearch = null, _atFlag = false, _at = null, _atDrawAt = 0;
function attractOn() {
    const s = typeof window !== "undefined" && window.location ? window.location.search || "" : "";
    if (s !== _atSearch) { _atSearch = s; _atFlag = /[?&]attract\b/.test(s); }
    return _atFlag;
}
// the page's rules apply from the first paint, before the game has built anything
try { if (attractOn() && typeof document !== "undefined" && document.documentElement) document.documentElement.classList.add("attract"); } catch (e) {}

function _atInt(r) { return Math.round(r[0] + Math.random() * (r[1] - r[0])); }
function _atPick(a) { return a[Math.floor(Math.random() * a.length)]; }
// the frame pace (js/game.js gameLoop): a frame comes at most every 30 ms; the steps in between are not lost, they are run at the next frame
function attractSkip(now) { if (!attractOn()) return false; if (now - _atDrawAt < 30) return true; _atDrawAt = now; return false; }

// ── start: from facilityPlayStart, once the world and its props are built ──
function attractStart(F) {
    const comp = _fpComps(), skip = new Set((F.interiors || []).map(i => i.id)), byRoom = new Map(), cells = [];
    const home = _fpNearestCell(crystal.x, crystal.y), main = home ? comp.get(home[0] + "," + home[1]) : null;
    for (const [k, c] of _fp.cellsP) {
        if (comp.get(k) !== main) continue;   // (only the stretch of floor the Crystal is on: every spot it picks can be walked to)
        const r = facilityRoomAt(c[0], c[1], F); if (!r || skip.has(r.id)) continue;
        cells.push(c); let a = byRoom.get(r.id); if (!a) byRoom.set(r.id, a = []); a.push(c);
    }
    for (const [id, a] of byRoom) if (a.length < 8) { for (const c of a) cells.splice(cells.indexOf(c), 1); byRoom.delete(id); }   // (a closet is no place to search)
    // the spots beside a prop that it goes to: a walkable tile a step from its edge, facing it
    const spots = [];
    for (const s of (F.solids || [])) {
        if (!s.bb || !byRoom.has(s.room) || s.bb[2] - s.bb[0] < 0.6 || s.bb[3] - s.bb[1] < 0.6) continue;
        const fx = (s.bb[0] + s.bb[2]) / 2, fy = (s.bb[1] + s.bb[3]) / 2;
        for (const c of byRoom.get(s.room)) { const d = Math.hypot(Math.max(s.bb[0] - c[0], 0, c[0] - s.bb[2]), Math.max(s.bb[1] - c[1], 0, c[1] - s.bb[3])); if (d >= 0.9 && d <= 1.8) spots.push({ x: c[0], y: c[1], fx, fy, room: s.room }); }
    }
    if (spots.length > 900) for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; } spots.length = Math.min(spots.length, 900);
    _at = { F, cells, byRoom, spots, cam: { x: crystal.x + 2, y: crystal.y + 1 }, idle: null, idleAt: 0, crowd: [], rooms: new Set(), last: null, f0: frame, ready: false,
            forms: Object.values(EVOLUTIONS).filter(d => !d.legacy && d.role), next: frame + ATTRACT.first, spawned: 0, searched: 0, gone: 0 };   // (the last three are counts, for the tests)
    _atSweep(); gfxLow = true; smoke.length = 0; fragments.length = 0;
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth, vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (typeof setViewZoom === "function") setViewZoom(Math.max(1, Math.min(ATTRACT.zoom, Math.sqrt(vw * vh / ATTRACT.pixels))));
    if (document.body) document.body.classList.add("attract");
    player.x = player.targetX = player.visualX = _at.cam.x; player.y = player.targetY = player.visualY = _at.cam.y;
    return _at;
}

// the strip game's stray creature, and any the zones spawn: the halls are abandoned, and a creature would draw the searchers into a fight
function _atSweep() { for (let i = actors.length - 1; i >= 0; i--) if (actors[i].team !== "green") actors.splice(i, 1); }

// is a spot out of the picture (given the camera)? A margin of a tile or two.
function _atOff(x, y, cam) {
    const dx = x - cam.x, dy = y - cam.y;
    return Math.abs((dx - dy) * TILE_W) > canvas.width / 2 + 90 || Math.abs((dx + dy) * TILE_H) > canvas.height / 2 + 150;
}
// a main-floor tile between r0 and r1 from (x, y) that `ok` allows, else null
function _atCell(x, y, r0, r1, ok) {
    const cs = _at.cells;
    for (let i = 0; i < 300; i++) { const c = cs[Math.floor(Math.random() * cs.length)], d = Math.hypot(c[0] - x, c[1] - y); if (d >= r0 && d <= r1 && (!ok || ok(c))) return { x: c[0], y: c[1], room: null }; }
    return null;
}
// a stop for a searcher: beside a prop (most of the time) or a spot of a room, between r0 and r1 from (x, y)
function _atStop(x, y, r0, r1, notRoom) {
    const T = _at;
    if (Math.random() < 0.65) {
        for (let i = 0; i < 80; i++) { const s = T.spots[Math.floor(Math.random() * T.spots.length)]; if (!s || s.room === notRoom) continue; const d = Math.hypot(s.x - x, s.y - y); if (d >= r0 && d <= r1) return { x: s.x, y: s.y, fx: s.fx, fy: s.fy, room: s.room, prop: true }; }
    }
    const c = _atCell(x, y, r0, r1, c => { const r = facilityRoomAt(c[0], c[1], T.F); return r && r.id !== notRoom; });
    if (c) { const r = facilityRoomAt(c.x, c.y, T.F); c.room = r && r.id; }
    return c;
}

// ── a searcher ──
function _atLoaded(d) { return !!(d._img && d._img.complete && d._img.naturalWidth); }
function _atForm() {
    const T = _at, have = T.forms.filter(d => _atLoaded(d) && d !== T.last);
    // the sheets come over the network, one at a time as they are wanted: none is shown until it is here (the egg would be drawn instead)
    if (!T.forms.some(d => d._img && !d._img.complete)) { const miss = T.forms.filter(d => d._img === undefined); if (miss.length) _evoImg(_atPick(miss)); }
    return have.length ? _atPick(have) : (T.forms.find(_atLoaded) || null);
}
function attractSpawn() {
    const T = _at, d = _atForm(); if (!d) return false;
    const w0 = _atStop(T.cam.x, T.cam.y, 2.5, 9, null) || _atCell(T.cam.x, T.cam.y, 2.5, 9); if (!w0) return false;
    // where it comes in from: out of the picture, and not far to walk (the route is worked out, so it is not the long way round)
    let s0 = null, best = 1e9;
    for (let i = 0; i < 16 && best > 34; i++) {
        const c = _atCell(w0.x, w0.y, 12, 30, c => _atOff(c[0], c[1], T.cam)); if (!c) continue;
        const p = facilityPath(c.x, c.y, w0.x, w0.y); if (!p) continue;
        let len = 0, px = c.x, py = c.y; for (const q of p) { len += Math.hypot(q[0] - px, q[1] - py); px = q[0]; py = q[1]; }
        if (len < best) { best = len; s0 = c; }
    }
    if (!s0) return false;
    spawnFollowerAtCrystal(d.element, d.role === "sniper" ? "sniper" : "brawler");
    const f = followers[followers.length - 1]; if (!f) return false;
    f.evolved = d.id; f.role = d.role; f.level = typeof EVOLVE_LEVEL === "number" ? EVOLVE_LEVEL : 10; if (typeof xpForLevel === "function") f.xp = xpForLevel(f.level);
    _applyFollowerLevel(f, true); f._moltAt = -1e9; f._sigCd = 1e9; f._fade = 1;
    f.x = s0.x; f.y = s0.y; f.returningToCrystal = false; f.stance = "hold"; f.dirX = w0.x - s0.x; f.dirY = w0.y - s0.y;
    const route = [w0]; let at = w0, n = _atInt(ATTRACT.stops) - 1;
    for (let i = 0; i < n; i++) { const p = _atStop(at.x, at.y, 6, 26, at.room); if (!p) break; route.push(p); at = p; }
    const w = { f, route, i: 0, mode: "go", t: frame, until: 0, lookAt: 0, base: f.moveSpeed, seen: false, form: d.id };
    T.crowd.push(w); T.last = d; T.spawned++; _atSpeed(w);
    return true;
}
function _atSpeed(w) { const f = w.f, v = w.base * (w.mode === "leave" || w.i === 0 ? ATTRACT.hurry : 1); f.baseMoveSpeed = f.moveSpeed = v; }
function _atGo(w, wp) { w.f.job = { type: "move", target: wp, route: null }; w.f.stance = "hold"; w.t = frame; _atSpeed(w); }
function _atTurn(f, x, y, jitter) { const a = Math.atan2(y - f.y, x - f.x) + (Math.random() - 0.5) * jitter; f.dirX = Math.cos(a); f.dirY = Math.sin(a); }
function _atRemove(w) {
    const T = _at, f = w.f; f.job = null;
    for (const list of [actors, followers]) { const k = list.indexOf(f); if (k >= 0) list.splice(k, 1); }
    f.isFollower = false; f.dead = true; rebuildFollowerTable();   // (out of every list first: a follower that died would go on the respawn queue)
    const k = T.crowd.indexOf(w); if (k >= 0) T.crowd.splice(k, 1); T.gone++;
}
function _atStep(w) {
    const T = _at, f = w.f, now = frame;
    if (f.dead || !followers.includes(f)) { const k = T.crowd.indexOf(w); if (k >= 0) T.crowd.splice(k, 1); return; }
    if (w.mode === "go") {
        const wp = w.route[w.i]; if (!f.job || f.job.target !== wp) _atGo(w, wp);
        if (Math.hypot(wp.x - f.x, wp.y - f.y) < 0.7 || now - w.t > ATTRACT.stuck) {
            w.seen = true; T.searched++; w.mode = "search"; w.until = now + _atInt(ATTRACT.pause) * (wp.prop ? 1.4 : 0.6); w.lookAt = now; f.job = { type: "move", target: { x: f.x, y: f.y }, route: null };
            if (wp.prop) _atTurn(f, wp.fx, wp.fy, 0.3);
        }
    } else if (w.mode === "search") {
        const wp = w.route[w.i];
        if (now >= w.lookAt) { w.lookAt = now + _atInt(ATTRACT.look); if (wp.prop && Math.random() < 0.6) _atTurn(f, wp.fx, wp.fy, 1.2); else { const a = Math.random() * 6.2832; f.dirX = Math.cos(a); f.dirY = Math.sin(a); } }
        if (now >= w.until) {
            w.i++;
            if (w.i < w.route.length) { w.mode = "go"; w.t = now; }
            else { const out = _atCell(f.x, f.y, 14, 40, c => _atOff(c[0], c[1], T.cam)) || _atCell(f.x, f.y, 14, 60); if (!out) { _atRemove(w); return; } w.route.push(out); w.mode = "leave"; _atGo(w, out); }   // (and out of sight: it is gone when it is)
        }
    } else {   // leave: out of the picture and it is gone; if it gets to its goal still in sight, it fades
        const out = w.route[w.route.length - 1];
        if (w.fading) { f._fade = Math.max(0, 1 - (now - w.fading) / ATTRACT.fade); if (f._fade <= 0) _atRemove(w); return; }
        if (_atOff(f.x, f.y, T.cam)) _atRemove(w);
        else if (Math.hypot(out.x - f.x, out.y - f.y) < 0.9 || now - w.t > ATTRACT.stuck) { w.fading = now; f.job = { type: "move", target: { x: f.x, y: f.y }, route: null }; }
    }
}

// ── the camera ──
function _atRoomSpot(id) {
    const a = _at.byRoom.get(id); let sx = 0, sy = 0; for (const c of a) { sx += c[0]; sy += c[1]; }
    sx /= a.length; sy /= a.length; let best = a[0], bd = 1e9; for (const c of a) { const d = Math.hypot(c[0] - sx, c[1] - sy); if (d < bd) { bd = d; best = c; } }
    return { x: best[0], y: best[1] };
}
function _atCamera() {
    const T = _at, c = T.cam, now = frame, lead = T.crowd.find(w => w.seen && w.mode !== "leave");
    let goal;
    if (lead) { goal = lead.f; T.idle = null; }
    else if (T.crowd.some(w => !w.seen)) goal = c;   // (one is on its way in to where the camera is looking: it stays put until it is there)
    else {
        if (!T.idle || now >= T.idleAt) {
            const rooms = [...T.byRoom.keys()].filter(id => { const g = _atRoomSpot(id), d = Math.hypot(g.x - c.x, g.y - c.y); return d >= 6 && d <= 34; });
            T.idle = rooms.length ? _atRoomSpot(_atPick(rooms)) : { x: c.x, y: c.y }; T.idleAt = now + _atInt(ATTRACT.cam.hold);
        }
        goal = T.idle;
    }
    const dx = goal.x - c.x, dy = goal.y - c.y, d = Math.hypot(dx, dy);
    if (d > 0.01) { const s = Math.min(ATTRACT.cam.max, d * ATTRACT.cam.ease); c.x += dx / d * s; c.y += dy / d * s; }
    player.x = player.targetX = c.x; player.y = player.targetY = c.y; player.fpPath = null;
}

// each frame (from facilityTutorialTick)
function attractTick() {
    const T = _at; if (!T) return;
    const now = frame;
    floatingTexts.length = 0;   // (no message is shown over the picture)
    if (now % 30 === 0) _atSweep();
    if (now >= T.next) {
        if (T.crowd.length === 0 || (T.crowd.length < ATTRACT.cap && Math.random() < ATTRACT.again)) { if (attractSpawn()) T.next = now + _atInt(ATTRACT.gap); else T.next = now + 45; }
        else T.next = now + 300;
    }
    for (const w of T.crowd.slice()) _atStep(w);
    T.rooms.clear(); for (const w of T.crowd) { const r = facilityRoomAt(w.f.x, w.f.y, T.F); if (r) T.rooms.add(_fpLightKey(r.id)); }
    _atCamera();
    if (!T.ready && now - T.f0 > ATTRACT.ready) { T.ready = true; try { if (window.parent && window.parent !== window) window.parent.postMessage({ conduit: "attract-ready" }, "*"); } catch (e) {} }
}

// ── the light (js/facilitystyle.js _fpLightUpdate) ──
function _atHash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; }
// how lit a room is: its level, and (in some rooms) a lamp that is failing
function attractRoomLight(k, here) {
    const T = _at; if (!T) return 0;
    let v = k === here ? ATTRACT.lit.here : T.rooms.has(k) ? ATTRACT.lit.crowd : ATTRACT.lit.base;
    const h = _atHash(k);
    if (h % 3 === 0) { const t = frame, n = Math.sin(t * 0.11 + h) * Math.sin(t * 0.037 + h * 2.1); v *= n > 0.9 ? 0.3 : 0.85 + 0.15 * Math.sin(t * 0.02 + h); }
    return v;
}
// a pool of light on the floor round each searcher
function attractPools(pools) {
    const T = _at; if (!T) return;
    for (const w of T.crowd) { const f = w.f, r = facilityRoomAt(f.x, f.y, T.F); if (r) pools.push({ x: f.x, y: f.y, s: f._fade === undefined ? 1 : f._fade, rooms: [_fpLightKey(r.id)], r: ATTRACT.glow.r, k: ATTRACT.glow.k }); }
}
