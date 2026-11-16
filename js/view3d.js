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
//   - In a room the view has not built, the frame is drawn in 2D exactly as with the switch off.
// The view itself, and what it does and does not draw yet, is view3d/gameview.js.

const VIEW3D = { on: typeof VIEW3D_ON !== "undefined" && VIEW3D_ON === true, state: "off", error: null, view: null, showing: false, shown: 0 };
const VIEW3D_FILES = ["vendor/three.min.js", "dist/view3d.js"];

function _view3dLoad(src) {
    return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = () => ok(); s.onerror = () => no(new Error("did not load: " + src)); document.head.appendChild(s); });
}
function _view3dFail(e) {
    VIEW3D.state = "failed"; VIEW3D.error = String((e && e.message) || e);
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
    return want;
}
function view3dShowing() { return VIEW3D.showing; }
// The frame's 3D picture, from the game as this step left it. tiles: the floor's tiles on the screen (js/game.js visibleTilesForDraw), whose marks go on the view's floor.
function view3dDraw(tiles) {
    if (!VIEW3D.showing) return;
    try { VIEW3D.view.draw(g => _view3dFloorMarks(g, tiles || visibleTilesForDraw())); VIEW3D.shown++; } catch (e) { _view3dFail(e); }
}
// The floor's marks on those tiles, as js/game.js draws them on its own floor (drawFloorTileMarks), drawn into the view's layer g: the game's drawing context is g meanwhile.
function _view3dFloorMarks(g, tiles) {
    const keep = ctx; ctx = g;
    try {
        tiles = tiles.slice().sort((a, b) => a.x + a.y - b.x - b.y);   // (back to front, as the game's own list draws them)
        for (const t of tiles) {
            if (t.deck) continue;   // (a bridge's grating over water: none in the rooms the view has built)
            const px = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width / 2, py = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height / 2 - facilityLiftRel(t.x, t.y);
            drawFloorTileMarks(t, px, py, true);
        }
    } finally { ctx = keep; }
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
