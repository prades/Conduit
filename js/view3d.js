// ─────────────────────────────────────────────────────────
//  THE 3D VIEW: the same game, drawn in 3D (docs/VIEW-3D.md)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-16, having picked the look (round 2's CRYSTAL LAB 3D, docs/STYLE-EVOLUTION.md) and tried it on a test page, asked "Can we build the full game up to this point?" and
// chose "The real game in 3D": the actual game drawn in that look, built area by area; its rules, squad, creatures, cards and saves as they are; behind a switch while it grows, the 2D game what
// players get until the owner says otherwise.
//
// THE SWITCH is ?engine=3d in the address (js/config.js VIEW3D_ON). Off: nothing here runs, and nothing of the 3D view is fetched. On:
//   - three.js (vendor/three.min.js) and the view (dist/view3d.js, made by tools/view3d.js from view3d/ and the models) are fetched in the start screen's last wait, and the view builds its rooms
//     there (js/init.js _suAssets -> view3dPrepare). A failure never stops the game: it is drawn in 2D as ever, and VIEW3D.error says why.
//   - Every drawn frame, as the frame is cleared (js/game.js clearFrame -> view3dBegin), the game asks whether the room you are in is one the view has built (view.covers). If it is, that frame's
//     world is the view's: the game's canvas is cleared to nothing (the view's own canvas lies under it), no floor tile, wall or prop is laid out in 2D, and the view draws them, with the bodies it
//     has models for (view3dBody: the cube, the eggs and the evolved forms, the ants), from the game's own state, after the step's logic (render -> view3dDraw).
//   - Everything else is the game's own drawing, over it: the bars and plates over everyone, the effects, the panels, and the facility's items it does not build (a pickup, a station's
//     ring, a spot: view3dKeeps). The view's camera is the game's own (the same angle, the same scale, on the player), so all of it lies where it always did. One thing moves: the view
//     stands a body where the game has the unit, which is half a tile down the screen from where the 2D drawing put its feet, so what is drawn over a unit goes down with it (view3dFeet).
//   - The floor's marks that are play (pools, fire, acid, auras, the long-press ring: js/game.js drawFloorTileMarks) are drawn by the game into a layer of the view's, which lays it on
//     its floor under all that stands there (view3dDraw).
//   - The attacks it draws in 3D (view3d/attacks.js: the Frost Maw's first, then the fire line's): each effect and shot it drew this frame is the view's, and the game leaves out its 2D drawing of it (view3dOwnsFx).
//   - In a room the view has not built, the frame is drawn in 2D exactly as with the switch off.
// The view itself, and what it does and does not draw yet, is view3d/gameview.js.

const VIEW3D = { on: typeof VIEW3D_ON !== "undefined" && VIEW3D_ON === true, state: "off", error: null, view: null, showing: false, shown: 0, turn: 0, zoom: 1, twist: 0 };
const VIEW3D_FILES = ["vendor/three.min.js", "dist/view3d.js"];

function _view3dLoad(src) {
    return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = () => ok(); s.onerror = () => no(new Error("did not load: " + src)); document.head.appendChild(s); });
}
function _view3dFail(e) {
    VIEW3D.state = "failed"; VIEW3D.error = String((e && e.message) || e); VIEW_TURN = 0; VIEW3D.twist = 0;
    if (VIEW3D.showing) { VIEW3D.showing = false; try { VIEW3D.view.show(false); } catch (x) { /* it is going anyway */ } }
    if (typeof console !== "undefined" && console.warn) console.warn("the 3D view is off: " + VIEW3D.error);
}
// Its own canvas, under the game's. (The game's canvas is an ordinary block of the page; one fixed in place with a layer below zero is painted under it and over the page's black.)
function _view3dCanvas() {
    const c = document.createElement("canvas"); c.id = "view3dCanvas";
    c.style.cssText = "position:fixed;left:0;top:0;z-index:-1;display:none;pointer-events:none;";
    canvas.parentNode.insertBefore(c, canvas); return c;
}
// The view's scripts fetched and its rooms built. A promise (the start screen waits for it), or null with the switch off. It always resolves.
function view3dPrepare() {
    if (!VIEW3D.on || VIEW3D.state !== "off" || typeof document === "undefined" || !document.createElement) return null;
    VIEW3D.state = "loading";
    const v = typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "";
    return _view3dLoad(VIEW3D_FILES[0]).then(() => _view3dLoad(VIEW3D_FILES[1] + v)).then(() => {
        if (typeof window.__view3d !== "function") throw new Error("dist/view3d.js did not bring the view");
        if (!_fp || !_fp.F) throw new Error("the facility is not built");
        VIEW3D.state = "building";
        VIEW3D.view = window.__view3d({ canvas: _view3dCanvas(), game: canvas });
        VIEW3D.state = "ready";
    }).catch(_view3dFail);
}
// Is this frame's world the 3D view's? Decided once a drawn frame (a step with no picture keeps the last answer).
function view3dBegin() {
    if (!VIEW3D.on || VIEW3D.state !== "ready") return false;
    if (typeof _simGhost !== "undefined" && _simGhost) return VIEW3D.showing;
    let want = false;
    if (facilityPlay && _fp && _fp.F && !(typeof attractOn === "function" && attractOn())) {   // (the website's background keeps the 2D picture)
        const r = facilityRoomAt(player.x, player.y, _fp.F); want = !!r && VIEW3D.view.covers(r.id);
    }
    if (want !== VIEW3D.showing) { VIEW3D.showing = want; try { VIEW3D.view.show(want); } catch (e) { _view3dFail(e); return false; } }
    VIEW_TURN = want ? VIEW3D.turn : 0;   // (the turn only while the view shows: the 2D game has one angle, js/config.js)
    return want;
}

// THE CAMERA, turned a quarter at a time and zoomed (the owner, 2026-11-17, of the demo: "I could rotate the camera and zoom in zoom out"; asked how: "90° steps"). Only while the view shows:
// the 2D game has one angle and one scale. VIEW3D.turn 0 to 3 (js/config.js VIEW_TURN is it while the view shows: everything the game lays out on the screen goes through it, so the 2D over the
// picture lines up in each of the four views); VIEW3D.zoom how near (1 the game's own), its camera and the world's 2D drawing scaled about the screen's middle together; VIEW3D.twist (radians)
// how far a swiping finger has the camera round from its quarter turn (0 the rest of the time: the controls below).
const VIEW3D_CAM = { zoomMin: 0.6, zoomMax: 1.8, zoomStep: 1.2, swipeStart: 22, swipeDeg: 0.25, settle: 20, flick: 0.5 };   // (the agent's, provisional: px, degrees a px, degrees, px a ms)
function view3dZoom() { return VIEW3D.showing ? VIEW3D.zoom : 1; }
// n quarter turns (to the right, the world clockwise; less than 0, to the left)
function view3dTurnBy(n) { const q = Math.round(n); if (!VIEW3D.showing || !q) return false; VIEW3D.turn = ((VIEW3D.turn + q) % 4 + 4) % 4; VIEW_TURN = VIEW3D.turn; return true; }
function view3dZoomTo(z) { if (!VIEW3D.showing || !Number.isFinite(z)) return false; VIEW3D.zoom = Math.max(VIEW3D_CAM.zoomMin, Math.min(VIEW3D_CAM.zoomMax, z)); return true; }
function view3dZoomBy(steps) { return view3dZoomTo(VIEW3D.zoom * Math.pow(VIEW3D_CAM.zoomStep, steps)); }
// is the camera swinging round to a new quarter turn? The 2D over the picture lines up only at a quarter turn, so meanwhile it is not drawn
function view3dSwinging() { return VIEW3D.showing && !!VIEW3D.view && typeof VIEW3D.view.swinging === "function" && VIEW3D.view.swinging(); }
// THE ZOOM ON THE WORLD'S DRAWING: a context's transforms taken as within the zoom (a part that sets its own, setTransform(1, 0, 0, 1, 0, 0), as many do, is drawn zoomed too), and back
function _view3dZoomOn(g, k) {
    const own = n => Object.prototype.hasOwnProperty.call(g, n) ? g[n] : undefined, set = g.setTransform, cx = canvas.width / 2, cy = canvas.height / 2, ox = cx * (1 - k), oy = cy * (1 - k);
    g.__v3z = { set: own("setTransform"), reset: own("resetTransform") };
    g.setTransform = function (a, b, c, d, e, f) { if (a && typeof a === "object") { b = a.b; c = a.c; d = a.d; e = a.e; f = a.f; a = a.a; } return set.call(this, a * k, b * k, c * k, d * k, e * k + ox, f * k + oy); };
    g.resetTransform = function () { return set.call(this, k, 0, 0, k, ox, oy); };
    g.setTransform(1, 0, 0, 1, 0, 0);
}
function _view3dZoomOff(g) {
    const o = g.__v3z; if (!o) return; delete g.__v3z;
    if (o.set) g.setTransform = o.set; else delete g.setTransform;
    if (o.reset) g.resetTransform = o.reset; else delete g.resetTransform;
    g.setTransform(1, 0, 0, 1, 0, 0);
}
let _view3dZoomed = null;
// the world's drawing begins (js/game.js render, after the frame is cleared): zoomed, if the camera is
function view3dWorldBegin() { const k = view3dZoom(); if (k === 1 || _view3dZoomed) return; _view3dZoomed = ctx; _view3dZoomOn(ctx, k); }
// the world's drawing done (before the panels): the zoom off, the 2D over the picture wiped while the camera swings round; true while the view shows (then the network panel, which the
// world's drawing held back so that it is neither zoomed nor wiped, is drawn now)
function view3dWorldEnd() {
    if (_view3dZoomed) { _view3dZoomOff(_view3dZoomed); _view3dZoomed = null; }
    if (!VIEW3D.showing) return false;
    if (view3dSwinging()) ctx.clearRect(0, 0, canvas.width, canvas.height);
    return true;
}
function view3dShowing() { return VIEW3D.showing; }
// A PROP'S STATE has been set (js/propsprites.js facilityPropStateSet; the sewer kit: docs/SEWER-PROPS.md §10): the view shows that state's model. Before the view is made there is nothing to tell: it reads each prop's state as it builds
function view3dPropState(id, state) { return !!VIEW3D.view && typeof VIEW3D.view.propState === "function" && VIEW3D.view.propState(id, state); }
// The frame's 3D picture, from the game as this step left it. tiles: the floor's tiles on the screen (js/game.js visibleTilesForDraw), whose marks go on the view's floor.
function view3dDraw(tiles) {
    if (!VIEW3D.showing) return;
    try { VIEW3D.view.draw(g => _view3dFloorMarks(g, tiles || visibleTilesForDraw())); VIEW3D.shown++; } catch (e) { _view3dFail(e); }
}
// The floor's marks on those tiles, as js/game.js draws them on its own floor (drawFloorTileMarks), drawn into the view's layer g: the game's drawing context is g meanwhile.
function _view3dFloorMarks(g, tiles) {
    const keep = ctx; ctx = g;
    try {
        tiles = tiles.slice().sort((a, b) => isoDepth(a.x, a.y) - isoDepth(b.x, b.y));   // (back to front, as the game's own list draws them, in the view's turn)
        const k = view3dZoom(); if (k !== 1) _view3dZoomOn(g, k);   // (the layer zoomed as the camera is)
        for (const t of tiles) {
            if (t.deck) continue;   // (a bridge's grating over water: none in the rooms the view has built)
            const px = isoSX(t.x, t.y) + canvas.width / 2, py = isoSY(t.x, t.y) + canvas.height / 2 - facilityLiftRel(t.x, t.y);
            drawFloorTileMarks(t, px, py, true);
        }
    } finally { ctx = keep; _view3dZoomOff(g); }
}
// How far down the screen a unit's body is in the 3D view from where the 2D drawing puts its feet (px): the view stands it where the game has it, the middle of its tile; the 2D drawing put
// its feet at the tile's top corner. What the game draws over a unit (its bars, its plate, the marks round it) goes down with it.
function view3dFeet() { return VIEW3D.showing ? TILE_H : 0; }
// Is this facility item (js/facilityplay.js _fp.items) still the game's to draw while the 3D view shows? One the view does not build, in a room it has built.
function view3dKeeps(it) { return VIEW3D.showing && VIEW3D.view.keeps(it); }
// Does the 3D view draw this one's body this frame (the player, a follower, a creature)? Then the 2D drawing leaves the body out and draws only what stands over it.
function view3dBody(a) { return VIEW3D.showing && VIEW3D.view.has(a); }
// How far over its feet its body's top is on the screen (px), for the bars over it.
function view3dTop(a) { return VIEW3D.view.top(a); }
// THE ATTACKS IN 3D (view3d/attacks.js; docs/VIEW-3D.md stage 5, the Frost Maw's three first): does this frame's 3D picture draw this effect of the game's (an elementEffects entry, an actor's
// icicleAttack)? Then the game leaves out its 2D drawing of it (js/elements.js drawElementEffects, js/draw.js). Asked only after the view has drawn the frame; an effect whose 3D drawing failed
// is not the view's, so the game draws it in 2D as ever.
// k: a unit's own thing the view draws for it, by kind ("fireOrbit": the Quillstone's three orbiting fireballs, js/draw.js), the unit given as o. A shot in flight (followerProjectiles) is asked as an effect is.
function view3dOwnsFx(o, k) { return VIEW3D.showing && !!o && !!VIEW3D.view && typeof VIEW3D.view.owns === "function" && VIEW3D.view.owns(o, k); }

// ── THE CAMERA'S CONTROLS (the 3D view only): four round buttons under QUESTS (turn left, turn right, zoom out, zoom in); on an iPad one finger swiped sideways turns (the room goes round
// with it, and settles on a quarter turn) and two fingers pinched zoom; on a computer a drag sideways turns as a swipe does, the wheel zooms, [ and ] turn, - and = zoom.
// The buttons' places and sizes are the agent's.
const _V3BTN = { r: 17, y0: 80, y: 80, xs: [28, 70, 122, 164], acts: [() => view3dTurnBy(-1), () => view3dTurnBy(1), () => view3dZoomBy(-1), () => view3dZoomBy(1)], shown: false };
// a panel up over the world (the clone bay, Settings, the INFO panel, the pack, the armoury, the class picker, the quest box: js/game.js keeps _lastPanelOpen each frame): the buttons are not
// drawn over it (nor take its taps), and two fingers, the wheel and the keys leave the camera alone
function _v3panelUp() { return (typeof _lastPanelOpen !== "undefined" && _lastPanelOpen) || (typeof infoPanelOpen !== "undefined" && infoPanelOpen) || (typeof settingsPanelOpen !== "undefined" && settingsPanelOpen); }
function view3dDrawButtons() {
    _V3BTN.shown = false;
    if (!VIEW3D.showing || _v3panelUp()) return;
    // under QUESTS; while the dialogue's box hangs there (js/dialogue.js, drawn just before: _dlgBox), under the box
    const B = typeof _dlgBox !== "undefined" ? _dlgBox : null, R = _V3BTN.r, Y = _V3BTN.y0;
    _V3BTN.y = B && B.w > 0 && B.x < _V3BTN.xs[_V3BTN.xs.length - 1] + R && B.y < Y + R && B.y + B.h > Y - R ? Math.round(B.y + B.h) + 8 + R : Y;
    _V3BTN.shown = true; const { r, y, xs } = _V3BTN, sw = view3dSwinging();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round";
    xs.forEach((x, i) => {
        ctx.fillStyle = "rgba(10,16,24,0.82)"; ctx.strokeStyle = "rgba(64,224,208,0.65)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = ctx.fillStyle = sw && i < 2 ? "rgba(64,224,208,0.45)" : "#c8fff4"; ctx.lineWidth = 2.2;
        if (i < 2) {   // a turn: three quarters of a circle and its arrowhead, the way it turns
            const s = i ? 1 : -1, a0 = s > 0 ? -2.4 : -0.74, a1 = s > 0 ? 1.0 : 2.14, rr = 8, ae = s > 0 ? a1 : a0;
            ctx.beginPath(); ctx.arc(x, y, rr, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
            const hx = x + Math.cos(ae) * rr, hy = y + Math.sin(ae) * rr, tx = -Math.sin(ae) * s, ty = Math.cos(ae) * s;   // (the arrowhead along the arc's way)
            ctx.beginPath(); ctx.moveTo(hx + tx * 5, hy + ty * 5); ctx.lineTo(hx - ty * 4 - tx * 1, hy + tx * 4 - ty * 1); ctx.lineTo(hx + ty * 4 - tx * 1, hy - tx * 4 - ty * 1); ctx.closePath(); ctx.fill();
        } else { ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); if (i === 3) { ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); } ctx.stroke(); }   // (- and +)
    });
    ctx.restore();
}
// a tap (js/input.js, on the finger's lift): one of the buttons? Then it acts, and the tap is its own
function view3dButtonTap(x, y) {
    if (!_V3BTN.shown || !VIEW3D.showing) return false;
    for (let i = 0; i < _V3BTN.xs.length; i++) if (Math.hypot(x - _V3BTN.xs[i], y - _V3BTN.y) <= _V3BTN.r + 6) { _V3BTN.acts[i](); return true; }
    return false;
}
function _v3gestureTarget() { return VIEW3D.showing && !(typeof techAimActive === "function" && techAimActive()) && !_v3panelUp(); }
// ONE FINGER SWIPED SIDEWAYS TURNS THE ROOM (the owner, 2026-11-17: "let's just do it where it's one finger will allow you to rotate the camera. And you swipe it"; before, two fingers twisted it,
// and before that only past 40 degrees of twist: "It won't allow me to use my fingers to rotate the screen"). On a press the game left plain (not on a creature or its card's buttons, the gun's
// shot, the dialogue's box, an aim, a ring: js/input.js), once the finger has gone VIEW3D_CAM.swipeStart px more sideways than up or down (the game's own drag: a tap stays a tap), the room goes
// round with it (VIEW3D.twist), VIEW3D_CAM.swipeDeg degrees a px, the floor in front the way the finger goes; let go, it settles on a quarter turn: the next one the way it went once
// VIEW3D_CAM.settle degrees past one, or one on if it was flicked (faster than VIEW3D_CAM.flick px a ms at the end), else back.
const _v3swipe = { id: null, x0: 0, y0: 0, on: false, x: 0, t: 0, v: 0 };
function _v3plainPress() {
    return typeof isPressing !== "undefined" && isPressing && !longHoldFired && !commandMode && !commandPendingTap
        && !(typeof _gunPressed !== "undefined" && _gunPressed) && !(typeof _targetPressed !== "undefined" && _targetPressed) && !(typeof _dlgPressed !== "undefined" && _dlgPressed)
        && !(typeof _techAimPressed !== "undefined" && _techAimPressed) && !(typeof _cloneDrag !== "undefined" && _cloneDrag);
}
// the finger down (before the game has it: x, y on the screen, t the event's time in ms), as it moves (true: the move is the swipe's), and off (true: the lift is the swipe's; flick false: a
// cancel, or a second finger, settles it without one)
function _v3swipeDown(id, x, y, t) { const S = _v3swipe; S.id = id; S.x0 = S.x = x; S.y0 = y; S.t = t; S.v = 0; S.on = false; }
function _v3swipeMove(id, x, y, t) {
    const S = _v3swipe; if (id !== S.id) return false;
    const dt = t - S.t; if (dt > 0) S.v = 0.5 * S.v + 0.5 * (x - S.x) / dt; S.x = x; S.t = t;   // (its speed sideways, px a ms, lately)
    if (!S.on) {
        const dx = x - S.x0, dy = y - S.y0;
        if (Math.abs(dx) < VIEW3D_CAM.swipeStart || Math.abs(dx) <= Math.abs(dy) || !_v3gestureTarget() || !_v3plainPress()) return false;
        S.on = true; S.x0 = x; _v3takePress(); return true;   // (the room goes round from here: no jump)
    }
    VIEW3D.twist = -(x - S.x0) * VIEW3D_CAM.swipeDeg * Math.PI / 180;   // (to the right, the floor in front goes right: the world anticlockwise, as a turn to the left)
    return true;
}
function _v3swipeUp(id, t, flick) {
    const S = _v3swipe; if (id !== S.id) return false; S.id = null; if (!S.on) return false; S.on = false;
    const q = VIEW3D.twist / (Math.PI / 2), c = 1 - VIEW3D_CAM.settle / 90; let k = q >= 0 ? Math.floor(q + c) : -Math.floor(c - q);
    if (!k && flick !== false && t - S.t < 80 && Math.abs(S.v) >= VIEW3D_CAM.flick) k = S.v > 0 ? -1 : 1;   // (flicked: one on, its way)
    VIEW3D.twist = 0; if (k) view3dTurnBy(k); return true;
}
// two fingers on the picture pinch to zoom, and only that (a, b: their places on the screen)
const _v3touch = { ptrs: new Map(), on: false, d0: 0, z0: 1, ids: new Set() };
function _v3twoStart(a, b) { const G = _v3touch; G.d0 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; G.z0 = VIEW3D.zoom; }
function _v3twoMove(a, b) { const G = _v3touch; view3dZoomTo(G.z0 * Math.hypot(b[0] - a[0], b[1] - a[1]) / G.d0); }
// the first finger's press is the gesture's now: no hold, no tap, no shot held, no lock, no box tapped (js/input.js; its lift will not reach the game); a ring its hold opened (or one
// waiting for its tap) closes with nothing done, as the game's own reset closes it (js/facilityplay.js)
function _v3takePress() {
    if (typeof isPressing !== "undefined") { isPressing = false; touchMoved = true; }
    if (typeof _gunPressed !== "undefined" && _gunPressed) { _gunPressed = false; if (typeof gunRelease === "function") gunRelease(); }
    if (typeof _targetPressed !== "undefined") _targetPressed = false;
    if (typeof _dlgPressed !== "undefined") _dlgPressed = false;
    if (typeof commandMode !== "undefined" && (commandMode || commandPendingTap)) {
        commandMode = false; commandPendingTap = false; commandTarget = null; selectedRadialAction = null; commandEnemyTarget = null; commandFollowerTarget = null; commandBodyTarget = null;
        if (typeof commandTechTarget !== "undefined") commandTechTarget = null;
    }
}
if (VIEW3D.on && typeof canvas !== "undefined" && canvas && canvas.addEventListener) {
    const at = e => [e.clientX, e.clientY], G = _v3touch, S = _v3swipe, pair = () => [...G.ptrs.values()].slice(0, 2);
    canvas.addEventListener("pointerdown", e => {
        if (e.isPrimary) { G.ptrs.clear(); G.ids.clear(); G.on = false; }   // (a first finger: none other is down, whatever was kept of one whose lift never came)
        G.ptrs.set(e.pointerId, at(e));
        if (G.ptrs.size === 1) _v3swipeDown(e.pointerId, e.clientX, e.clientY, e.timeStamp);
        if (G.ptrs.size === 2 && !G.on && _v3gestureTarget()) {
            if (S.id !== null) _v3swipeUp(S.id, e.timeStamp, false);   // (a swipe under way settles)
            G.on = true; G.ids = new Set(G.ptrs.keys()); _v3twoStart(...pair()); _v3takePress();
            e.stopImmediatePropagation(); e.preventDefault();
        } else if (G.on) { G.ids.add(e.pointerId); if (G.ptrs.size === 2) _v3twoStart(...pair()); e.stopImmediatePropagation(); e.preventDefault(); }   // (a finger back on: a new pair, from here)
    }, { capture: true });
    canvas.addEventListener("pointermove", e => {
        if (!G.ptrs.has(e.pointerId)) return; G.ptrs.set(e.pointerId, at(e));
        if (!G.on) { if (_v3swipeMove(e.pointerId, e.clientX, e.clientY, e.timeStamp)) e.stopImmediatePropagation(); return; }   // (the swipe's moves are not the game's)
        if (!G.ids.has(e.pointerId)) return; e.stopImmediatePropagation();
        if (G.ptrs.size >= 2) _v3twoMove(...pair());
    }, { capture: true });
    const lift = e => {
        const was = G.ids.has(e.pointerId); G.ptrs.delete(e.pointerId);
        if (_v3swipeUp(e.pointerId, e.timeStamp, e.type === "pointerup")) e.stopImmediatePropagation();   // (the swipe's lift: the room settles, and the game has no tap)
        if (was) {
            G.ids.delete(e.pointerId); e.stopImmediatePropagation(); if (typeof isPressing !== "undefined") isPressing = false;
            if (G.ptrs.size >= 2) _v3twoStart(...pair());   // (a third finger's pair: no jump)
        }
        if (!G.ids.size) G.on = false;
    };
    canvas.addEventListener("pointerup", lift, { capture: true });
    canvas.addEventListener("pointercancel", lift, { capture: true });
    canvas.addEventListener("wheel", e => { if (!_v3gestureTarget() || (typeof cloneMenuOpen !== "undefined" && cloneMenuOpen)) return; e.preventDefault(); view3dZoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    window.addEventListener("keydown", e => {
        const tg = e.target && e.target.tagName; if (tg === "INPUT" || tg === "TEXTAREA" || e.metaKey || e.ctrlKey || !_v3gestureTarget()) return;
        if (e.key === "[") view3dTurnBy(-1); else if (e.key === "]") view3dTurnBy(1); else if (e.key === "-") view3dZoomBy(-1); else if (e.key === "=" || e.key === "+") view3dZoomBy(1); else return;
        e.preventDefault();
    });
}
