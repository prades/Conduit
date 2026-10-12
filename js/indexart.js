// ─────────────────────────────────────────────────────────
//  INDEX PICTURES  —  the game's own sprites, in the GAME INDEX
// ─────────────────────────────────────────────────────────
// REPORTED: "make the information more intuitive by showing pictures of the
// systems and elements."
//
// Every <canvas class="ix-art" data-art="..."> in the index is painted with
// the SAME drawing code the board uses — a turret is drawSentinelTower and
// drawPylonTurret, a black hole is drawFormationGround, a predator is drawNPC
// — standing on a floor tile, so what the index shows is what you will see.
// The draw functions paint into the global `ctx`, so for a picture `ctx` is
// pointed at the picture's canvas for the length of the call and put back.
//
// While the index is open the pictures on the open tab are redrawn about
// fifteen times a second, so the vortex turns and the arcs jump; closed, or on
// another tab, nothing is drawn.
//
// data-art is "<kind>" or "<kind>:<element or species>", e.g. "attack:fire",
// "battery:ice", "predator:ant", "blackhole".

const IX_ART_W = 132, IX_ART_H = 112;
let _ixFrame = 0;          // the pictures' own clock, so they move while the game is paused
let _ixLoop = null;

function _ixEl(id) { return (typeof ELEMENTS !== "undefined" && ELEMENTS.find(e => e.id === id)) || { id: "core", color: "#00ccaa", label: "CORE" }; }

// One isometric floor tile, top corner at (px, py) like the board's.
function _ixTile(px, py, tint) {
    ctx.fillStyle = tint || "#13202e";
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + TILE_W); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(90,170,255,0.18)"; ctx.lineWidth = 1; ctx.stroke();
}
// A floor tile scaled down to sit under a single structure.
function _ixPad(cx, cy, w, tint) {
    const h = w / 2;
    ctx.fillStyle = tint || "#13202e";
    ctx.beginPath(); ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w, cy); ctx.lineTo(cx, cy + h); ctx.lineTo(cx - w, cy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(90,170,255,0.22)"; ctx.lineWidth = 1; ctx.stroke();
}
// A 2x2 square of floor centred on (cx, cy) — the middle of the square, where
// an Ultra or a formation is drawn from — and the structure on it, scaled.
function _ixSquare(cx, cy, scale, tint, draw) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
    for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) _ixTile(cx + (dx - dy) * TILE_W, cy + (dx + dy) * TILE_H, tint);
    draw(cx, cy);
    ctx.restore();
}
// Draw something bigger, scaled about (x, y) — its foot.
function _ixZoom(x, y, k, draw) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); draw(); ctx.restore();
}
function _ixTower(px, base, active) {
    drawSentinelTower(px, base,
        active ? SENTINEL_FRONT_ACTIVE : SENTINEL_FRONT_DORMANT,
        active ? SENTINEL_RIGHT_ACTIVE : SENTINEL_RIGHT_DORMANT,
        active ? SENTINEL_TOP_ACTIVE : SENTINEL_TOP_DORMANT, active, SENTINEL_SLIT);
}
function _ixBadge(text, colour, x, y) {
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(0,0,0,0.6)"; const w = ctx.measureText(text).width + 8;
    ctx.fillRect(x - w / 2, y - 9, w, 12);
    ctx.fillStyle = colour; ctx.fillText(text, x, y);
}
function _ixFollower(el, px, py, extra) {
    const npc = Object.assign({
        type: "virus", element: el, x: 0, y: 0, team: "green", health: 100, maxHealth: 100,
        walkCycle: _ixFrame * 0.12, moveCooldown: 0, stance: "follow", isFollower: true, hitFlash: 0, dead: false,
        role: "brawler", dirX: 1, dirY: 0.4, currentResonance: 0, ultimateCharge: 0,
    }, extra || {});
    drawNPC(npc, px, py, ctx);
}
function _ixPredator(sp, cls, px, py, extra) {
    const S = SPECIES[sp] || SPECIES.ant;
    const def = (typeof getClassDef === "function" ? getClassDef(S, cls) : S[cls]) || S.scout;
    const a = new Predator(cls, Object.assign({}, def, { color: S.color }), 0, 0);
    a.team = "red"; a.speciesName = sp; a.className = cls; a.dirX = 1; a.dirY = 0.35; a.walkCycle = _ixFrame * 0.15;
    Object.assign(a, extra || {});
    drawNPC(a, px, py, ctx);
    return a;
}

// Each painter draws into the current ctx, a canvas IX_ART_W x IX_ART_H.
const IX_ART = {
    // Single structures are drawn 1.3x, standing on the bottom of the picture.
    pylon:     (W, H) => { const px = W / 2, b = H - 22; _ixPad(px, b, 34); _ixTower(px, b, false); },
    attack:    (W, H, el) => { const E = _ixEl(el || "fire"), px = W / 2, b = H - 22; _ixPad(px, b, 34); _ixTower(px, b, true);
                               drawPylonTurret({ x: 0, y: 0, _tAng: -0.5 + 0.4 * Math.sin(_ixFrame * 0.02) }, px, b - 54, E.color, false); },
    support:   (W, H, el) => { const E = _ixEl(el || "electric"), px = W / 2, b = H - 22; _ixPad(px, b, 34);
                               ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = E.color; ctx.lineWidth = 1.5;
                               ctx.beginPath(); ctx.ellipse(px, b - 2, TILE_W * 0.35, TILE_W * 0.175, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
                               drawWaveMonolith(px, b, E.color, false, 2, false); },
    disruption:(W, H, el) => IX_ART.support(W, H, el || "fire"),
    battery:   (W, H, el) => { const E = _ixEl(el || "electric"), px = W / 2, b = H - 22; _ixPad(px, b, 34);
                               const fill = 0.25 + 0.75 * ((_ixFrame % 240) / 240);
                               drawBatteryPylon(px, b, E.color, 2, 0.5, false, fill, true);
                               ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(px - 13, b - 51, 26, 5);
                               ctx.fillStyle = BATTERY_COLOR; ctx.fillRect(px - 12, b - 50, 24 * fill, 3); },
    generator: (W, H) => { const px = W / 2, b = H - 22; _ixPad(px, b, 34);
                           ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = "#cfe8ff"; ctx.setLineDash([3, 4]);
                           ctx.beginPath(); ctx.ellipse(px, b - 2, 56, 26, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
                           drawShieldGenerator(px, b, true, 0.5 + 0.5 * Math.sin(_ixFrame * 0.08)); },
    connector: (W, H) => { const px = W / 2, b = H - 22; _ixPad(px, b, 34); _ixTower(px, b, true);
                           const p = 0.5 + 0.5 * Math.sin(_ixFrame * 0.08);
                           ctx.fillStyle = CONNECTOR_COLOR; ctx.globalAlpha = 0.25 + p * 0.15; ctx.beginPath(); ctx.arc(px, b - 54, 11, 0, Math.PI * 2); ctx.fill();
                           ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(px, b - 54, 5, 0, Math.PI * 2); ctx.fill(); },
    mk2:       (W, H, el) => { IX_ART.attack(W, H, el || "electric"); _ixBadge("◆ MK II ×1.3", "#ffd34d", W / 2, 14); },
    ultra:     (W, H, el) => { const E = _ixEl(el || "electric");
                               const t = { x: 0, y: 0, attackFireTimer: (_ixFrame * 2) % (TURRET_FIRE_FRAMES + 30),
                                           _ultra: { tiles: [], front: null, el: E.id, col: E.color, cx: 0, cy: 0, x0: 0, y0: 0 } };
                               _ixSquare(W / 2, H - 34, 0.55, "#13202e", (cx, cy) => drawUltraTurret(t, cx, cy)); },
    blackhole: (W, H) => IX_ART._form(W, H, "blackhole", "flux"),
    firespin:  (W, H) => IX_ART._form(W, H, "firespin", "fire"),
    icegen:    (W, H) => IX_ART._form(W, H, "icegen", "ice"),
    toxtower:  (W, H) => IX_ART._form(W, H, "toxtower", "toxic"),
    _form:     (W, H, kind, el) => {
        const E = _ixEl(el), glow = 0.45 + 0.35 * Math.sin(_ixFrame * 0.05);
        const F = { kind, el: E.id, tiles: [], front: null, col: E.color, s: { glow, size: glow, spin: _ixFrame * 0.06, pulse: 0, t: _ixFrame }, wx: 0, wy: 0, x0: 0, y0: 0, caught: [] };
        _ixSquare(W / 2, H - (kind === "toxtower" || kind === "icegen" ? 26 : 40), 0.55, kind === "icegen" ? "#1a2c3c" : "#13202e", (cx, cy) => drawFormationGround(F, cx, cy));
    },
    follower:  (W, H, el) => { const px = W / 2, py = H - 20; _ixPad(px, py, 24); _ixFollower(el || "electric", px, py); },
    squad:     (W, H) => { ["fire", "electric", "toxic"].forEach((e, i) => { const px = 26 + i * 40, py = H - 16 - (i % 2) * 6; _ixPad(px, py, 16); _ixFollower(e, px, py); }); },
    clone:     (W, H) => { const px = W / 2, py = H - 20; _ixPad(px, py, 30, "#0f3a26");
                           ctx.save(); ctx.strokeStyle = "#22ff88"; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5;
                           ctx.beginPath(); ctx.ellipse(px, py, 22, 11, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
                           _ixPredator("beetle", "striker", px, py, { team: "green", isClone: true }); },
    predator:  (W, H, sp) => { const [s0, c0] = String(sp || "ant").split("."); const px = W / 2, py = H - 20; _ixPad(px, py, 30, "#25344a"); _ixPredator(s0, c0 || "striker", px, py); },
    machine:   (W, H, kind) => { const px = W / 2, py = H - 22; _ixPad(px, py, 32);
                                 drawMachine({ machineKind: kind || "sentry", dimensions: { width: 30 }, _anchorX: 1, _aim: 0.5 + 0.5 * Math.sin(_ixFrame * 0.02), _assemble: 0,
                                               hitFlash: 0, health: 100, maxHealth: 100, walkCycle: _ixFrame * 0.08, drained: 0 }, px, py, ctx); },
    thief:     (W, H) => { const px = W / 2, py = H - 20; _ixPad(px, py, 30, "#25344a");
                           const a = _ixPredator("ant", "scout", px, py, { raider: true });
                           if (typeof drawThiefTag === "function") drawThiefTag(a, px, py + TILE_H); },
    // A wall nest: a panel of back wall in the wall's own slant, the vortex in it.
    // (drawNestWallVortex centres on (px + TILE_W, py + TILE_H - NEST_WALL_H / 2).)
    nest:      (W, H, mode) => { const cx = W / 2, cy = H / 2 + 2, px = cx - TILE_W, py = cy - TILE_H + NEST_WALL_H / 2;
                                 const col = mode === "held" ? NEST_COLOUR_CONTROLLED : mode === "neutral" ? NEST_COLOUR_NEUTRAL : NEST_COLOUR_HOSTILE;
                                 ctx.save(); ctx.transform(WALL_UX, WALL_UY, 0, -1, cx, cy);
                                 ctx.fillStyle = "#171224"; ctx.fillRect(-46, -40, 92, 80);
                                 ctx.strokeStyle = "#3a2a44"; ctx.lineWidth = 1; ctx.strokeRect(-46, -40, 92, 80); ctx.restore();
                                 drawNestWallVortex(px, py, 26, col, mode === "neutral" ? 0 : _ixFrame * 0.05, mode === "neutral" ? 0 : (mode === "held" ? 0.4 : 0.7), 1); },
    portal:    (W, H) => { const cx = W / 2, cy = H / 2 + 6, px = cx - TILE_W, py = cy - TILE_H + NEST_WALL_H / 2;
                           _ixZoom(cx, cy, 0.7, () => { if (typeof drawHomePortal === "function") drawHomePortal(px, py); }); },
};

// Paint one canvas. False if it could not be drawn (the icon beside it stays).
const IX_ZOOMED = { pylon: 1.3, attack: 1.3, support: 1.3, disruption: 1.3, battery: 1.35, generator: 1.2, connector: 1.3, mk2: 1.3,
                    follower: 1.5, predator: 1.7, clone: 1.7, thief: 1.6, machine: 1.15 };
// Can the board's `ctx` be pointed elsewhere? Not if an old cached config.js
// declared it `const` (REPORTED on an iPad: "Attempted to assign to readonly
// property"). Then the pictures are skipped — the icons stay — and nothing throws.
let _ixSwapOK = null;
function _ixCanSwap() {
    if (_ixSwapOK === null) { try { const k = ctx; ctx = k; _ixSwapOK = true; } catch (e) { _ixSwapOK = false; } }
    return _ixSwapOK;
}
function paintIndexArt(cv) {
    if (!_ixCanSwap()) return false;
    if (!cv || !cv.getContext) return false;
    const [kind, arg] = String(cv.dataset ? cv.dataset.art : cv.getAttribute("data-art")).split(":");
    const fn = IX_ART[kind];
    if (!fn) return false;
    const g = cv.getContext("2d");
    if (!g) return false;
    if (cv.width !== IX_ART_W) { cv.width = IX_ART_W; cv.height = IX_ART_H; }
    const keepCtx = ctx, keepFrame = frame;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    let ok = true;
    try {
        ctx = g; frame = _ixFrame;
        // A formation in the index stands on no network: draw it as if it worked.
        const keepFB = typeof formationBlocker === "function" ? formationBlocker : null;
        if (keepFB) formationBlocker = () => null;
        try {
            g.save();
            const z = IX_ZOOMED[kind];
            if (z) _ixZoom(cv.width / 2, cv.height - 18, z, () => fn(cv.width, cv.height, arg));
            else fn(cv.width, cv.height, arg);
            g.restore();
        } finally { if (keepFB) formationBlocker = keepFB; }
    } catch (e) { ok = false; }
    finally {
        try { ctx = keepCtx; } catch (e) { _ixSwapOK = false; }
        try { frame = keepFrame; } catch (e) { /* frame is a let in config.js */ }
    }
    return ok;
}
// Paint every picture on the open tab of the index.
function paintVisibleIndexArt() {
    if (typeof document === "undefined" || !document.querySelectorAll) return 0;
    const sec = document.querySelector("#controlsMenu .cm-section.active");
    if (!sec) return 0;
    let n = 0;
    sec.querySelectorAll("canvas.ix-art").forEach(cv => { if (paintIndexArt(cv)) n++; });
    return n;
}
// While the index is open: ~15 redraws a second of the open tab only.
function indexArtTick() {
    const m = document.getElementById("controlsMenu");
    const open = m && m.style.display && m.style.display !== "none" && !m.classList.contains("minimized");
    if (!open) { _ixLoop = null; return; }
    _ixFrame += 4;
    paintVisibleIndexArt();
    _ixLoop = setTimeout(indexArtTick, 66);
}
function startIndexArt() {
    if (_ixLoop) return;
    paintVisibleIndexArt();
    _ixLoop = setTimeout(indexArtTick, 66);
}
