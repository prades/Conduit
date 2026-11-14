// ─────────────────────────────────────────────────────────
//  VOLTWYRM, THE DIVING BEETLE LARVA — the electric breed's boss, its drawing (docs/ELECTRIC-BREED.md §5; build 2026-11-14e)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-13: look "A for the larva"; 2026-11-14: "The larva boss should be big", then "Build it". Its rules are js/bosses.js's (the row `circuitry`, THE ANT QUEEN's kinds of move);
// here it is drawn from its baked sheet (img/props/larva.png, from design/props/models/larva.js: eight facings, four walk frames, its jaws wide, its jaws snapped shut, its seams charged), in the
// creatures' place: js/bugs3d.js drawBug3D hands it over. What it is doing chooses the picture (larvaCell): SICKLE SNAP's warning opens its jaws, the snap shuts them a moment, SHOCK RING's warning
// flashes its seams, faster as the ring comes; else it walks (or lies still, asleep or fighting).
const LARVA = {
    width: 156,   // the width it is drawn at its baked size: its species' block (26, js/species.js) times its encounter's size (6, js/bosses.js), about twice THE ANT QUEEN's length on the floor
    res: 1,       // the sheet is at the game's own size (it is big on the screen already; its enemy card shows it smaller)
    gait: 0.3,    // walk frames per stride (js/predator.js walkCycle): a big, slow paddle (the agent's, provisional)
    frames: 4,    // walk frames in the sheet
    shut: 14,     // frames its jaws stay shut after a SICKLE SNAP
};
function isLarva(a) { return !!a && a.speciesName === "larva"; }
// its sheet has arrived (a portrait's cache keys on it, js/targeting.js: a stand-in is drawn before)
function larvaArtReady(a) { return !isLarva(a) || (typeof _psImg === "function" && !!_psImg("larva")); }
// the sheet's cell for its heading (in eighths, as the sheet is baked) and what it is doing
function larvaCell(a) {
    let fx = Number.isFinite(a.dirX) ? a.dirX : 1, fy = Number.isFinite(a.dirY) ? a.dirY : 0;
    if (Math.abs(fx) + Math.abs(fy) < 1e-6) { fx = 1; fy = 0; }
    const d = ((Math.round(Math.atan2(fy, fx) / (Math.PI / 4)) % 8) + 8) % 8, f = typeof frame !== "undefined" ? frame : 0;
    const S = a.bossId && typeof _fp !== "undefined" && _fp && _fp.bosses ? _fp.bosses[a.bossId] : null, c = S && S.unit === a ? S.cast : null;
    if (c && !a.dead) {
        if (c.kind === "crush") return "o" + d;   // SICKLE SNAP's warning: its jaws wide, their edges bright
        if (c.kind === "stomp") { const k = (f - c.t0) / Math.max(1, c.until - c.t0), every = k > 0.66 ? 3 : k > 0.33 ? 6 : 10; return Math.floor(Math.max(0, f - c.t0) / every) % 2 ? "w" + d + "_0" : "z" + d; }   // SHOCK RING's: its seams flash
    }
    if (S && S.unit === a && S.snapAt && f >= S.snapAt && f - S.snapAt < LARVA.shut) return "s" + d;   // the snap: its jaws shut
    const moving = a.state !== "attack" && a.state !== "idle" && !a.dead && !a.bossAsleep;
    const w = moving ? ((Math.floor((a.walkCycle || 0) * LARVA.gait / (Math.PI * 2) * LARVA.frames) % LARVA.frames) + LARVA.frames) % LARVA.frames : 0;
    return "w" + d + "_" + w;
}
// Draw it at its ground point (px, py); returns its height on screen in pixels (for the bars over it), or null when the sheet has not arrived (the caller draws a stand-in).
function drawLarva(a, px, py, g) {
    g = g || ctx;
    if (typeof _psImg !== "function" || typeof PROP_ATLAS === "undefined" || !PROP_ATLAS.larva) return null;
    const img = _psImg("larva"), c = PROP_ATLAS.larva.cells[larvaCell(a)];
    if (!img || !c) return null;
    const w = a.dimensions ? a.dimensions.width : LARVA.width, k = w / LARVA.width / LARVA.res;
    g.save();
    if (a.hitFlash > 0) g.globalAlpha *= 0.85;
    g.drawImage(img, c.x, c.y, c.w, c.h, px - c.ax * k, py - c.ay * k, c.w * k, c.h * k);
    g.restore();
    return c.ay * k;
}
