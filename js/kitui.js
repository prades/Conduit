// ─────────────────────────────────────────────────────────
//  THE KITS TAB: the cards, the ghost of a whole layout, SNAP TO NEST (js/kits.js is the layouts; js/buildmenu.js is the window)
// ─────────────────────────────────────────────────────────
// A kit card is a mini-map of the lane (the nest on the left, the front on the right), the kit's name, its piece count and price. Picking one makes it the tool in
// hand: the view zooms out as for any tool and a GHOST of the whole layout follows the pointer, every piece tinted (blue: already built, green: it can go, red:
// blocked, and why). Tap where its generator should go (touch: tap, tap again), or press SNAP TO NEST in the chip to build it at the held nest of the zone you are in.
// A kit placed over a smaller one only adds the difference.
const KIT_FAMILY_COLOUR = { power: "#ffd34d", defence: "#ff8a5c", control: "#a64dff", combined: "#19e6c1" };
const KIT_PIECE_COLOUR = { G: "#cdd6e0", C: "#ffd24a", B: "#ffd34d", T: "#ff8a5c", W: "#a64dff", S: "#19e6c1" };
let kitDir = 1;   // +1 builds toward the front; -1 mirrors it (the chip's MIRROR)

// The element a kit starts with: the one most of your squad is (as autoplay chooses), if the kit takes it; else the first it takes.
function kitDefaultElement(kit) {
    const ok = kitElements(kit); if (!ok.length) return null;
    const counts = {};
    if (typeof followers !== "undefined") for (const f of followers) if (!f.dead && ok.indexOf(f.element) >= 0) counts[f.element] = (counts[f.element] || 0) + 1;
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return ranked[0] || ok[0];
}
// The nest the plan answers to: the one in the zone of the tile pointed at (a generator must be within 6 of it).
function _kitNestAt(x) {
    const z = getZoneIndex(x);
    return (typeof world !== "undefined" ? world : []).find(t => t.nest && (z === 0 ? isHomePortal(t) : (!isHomePortal(t) && getZoneIndex(t.x) === z))) || null;
}
function kitToolPlan(tool, t) { const kit = kitById(tool.id); return kitPlan(kit, tool.elId, t.x, kitDir, _kitNestAt(t.x)); }

// canBuildAt for a kit tool: one answer for the ghost's label and the tap.
function kitToolVerdict(t, tool) {
    const plan = kitToolPlan(tool, t);
    if (plan.blocked) { const r = plan.pieces.find(p => p.state === "blocked"); return { ok: false, why: plan.blocked + " BLOCKED: " + r.why }; }
    if (!plan.free && !plan.pieces.some(p => p.mk2Missing)) return { ok: false, why: "ALREADY BUILT HERE" };
    if (shardCount < plan.cost) return { ok: false, why: "NEED ◆" + plan.cost };
    return { ok: true, why: "+" + plan.free + " PCS ◆" + plan.cost };
}
// The tap that builds it.
function kitToolPlace(t, tool) {
    const res = kitBuild(kitToolPlan(tool, t)), kit = kitById(tool.id);
    if (res.built) _bmSay(kit.name + ": " + res.built + " BUILT" + (res.short ? " · " + res.short + " ◆ SHORT" : ""), tool.colour || "#19e6c1");
    else if (res.blocked.length) _bmSay(kit.name + ": " + res.blocked[0], "#f66");
    if (typeof elementEffects !== "undefined") for (const r of kitToolPlan(tool, t).pieces) elementEffects.push({ type: "impact", x: r.x + 0.5, y: r.y + 0.5, color: tool.colour || "#0f8", radius: 0.35, life: 20 });
    return res.built > 0;
}
// MOVE THE KIT (reported: "let me move around the kit rather than putting it in some default spot"): the ghost follows the pointer, and these nudge it a tile at a time (the chip's arrows: along the lane
// and across it), which is how a touch screen, with no pointer to hover, places it exactly. BUILD HERE builds it where the ghost is (the second tap, as a button).
function kitNudge(dx, dy) {
    if (!buildTool || buildTool.kind !== "kit") return false;
    const base = buildGhost || { x: Math.round(player.x), y: Math.max(FLOOR_Y_MIN, Math.min(FLOOR_Y_MAX, Math.round(player.y))) }, t = getTile(base.x + dx, base.y + dy);
    if (!t) return false;
    buildGhost = { x: t.x, y: t.y }; _bmArmedKey = null; return true;
}
function kitBuildHere() {
    if (!buildTool || buildTool.kind !== "kit" || !buildGhost) { if (typeof _bmSay === "function") _bmSay("MOVE THE KIT FIRST: TAP THE GROUND OR USE THE ARROWS", "#8aa0c8"); return false; }
    const t = getTile(buildGhost.x, buildGhost.y); if (!t) return false;
    const v = kitToolVerdict(t, buildTool);
    if (!v.ok) { _bmSay(kitById(buildTool.id).name + ": " + v.why, "#f88"); return false; }
    return kitToolPlace(t, buildTool);
}
// SNAP TO NEST: at the held nest of the zone the player is in, wherever fits best (shifted or mirrored off a zone line or an obstacle).
function kitSnapBuild() {
    if (!buildTool || buildTool.kind !== "kit") return false;
    const kit = kitById(buildTool.id), z = getZoneIndex(Math.floor(player.x));
    const nest = _kitNestAt(Math.floor(player.x));
    if (!nest) { _bmSay("NO NEST IN THIS ZONE", "#f88"); return false; }
    const plan = kitFindPlacement(kit, buildTool.elId, nest);
    if (!plan) { _bmSay("NO ROOM FOR " + kit.name, "#f88"); return false; }
    if (plan.blocked) { const r = plan.pieces.find(p => p.state === "blocked"); _bmSay(kit.name + ": " + plan.blocked + " BLOCKED — " + r.why, "#f66"); return false; }
    if (!plan.free && !plan.pieces.some(p => p.mk2Missing)) { _bmSay(kit.name + " IS ALREADY BUILT HERE", "#8aa0c8"); return false; }
    const res = kitBuild(plan);
    _bmSay(kit.name + ": " + res.built + " BUILT" + (res.short ? " · " + res.short + " ◆ SHORT" : "") + (res.mk2Wait ? " · MK II WAITS FOR THE NETWORK" : ""), res.short ? "#f88" : (buildTool.colour || "#19e6c1"));
    return res.built > 0;
}

// ── the card ──
function drawKitCell(c, sel) {
    const k = kitById(c.it.id), col = c.it.colour, N = kitPieceCount(k);
    uiSlab(c.x, c.y, c.w, c.h, sel ? "#ffffff" : col, sel, sel ? null : "#101830");
    // the mini-map: 10 columns x 4 rows, the nest on the left
    const ts = Math.max(5, Math.floor((c.w - 18) / 10)), mx = c.x + (c.w - ts * 10) / 2, my = c.y + 6;
    ctx.fillStyle = "rgba(255,255,255," + (sel ? 0.15 : 0.05) + ")"; ctx.fillRect(mx - 1, my - 1, ts * 10 + 2, ts * 4 + 2);
    for (const p of kitPieces(k)) { ctx.fillStyle = sel ? UI_INK : KIT_PIECE_COLOUR[p.c]; ctx.fillRect(mx + p.dx * ts + 0.5, my + p.dy * ts + 0.5, ts - 1.5, ts - 1.5); }
    uiTextFit(k.name, c.x + c.w / 2, c.y + 6 + ts * 4 + 15, 14, sel ? UI_INK : "#fff", "center", c.w - 8);
    uiCaptionFit(N + " PCS · ◆" + kitCost(k), c.x + c.w / 2, c.y + c.h - 11, sel ? UI_INK : shardCount < kitCost(k) ? "#ff7a6a" : UI_GOLD, "center", 11, c.w - 6);
}

// ── the ghost: every piece of the layout on the ground ──
function drawKitGhost() {
    const t = getTile(buildGhost.x, buildGhost.y); if (!t) return;
    const plan = kitToolPlan(buildTool, t), v = kitToolVerdict(t, buildTool), pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.15);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const _fs = Math.round(10 / (typeof viewZoom !== "undefined" ? viewZoom : 1));
    ctx.font = "bold " + _fs + "px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const r of plan.pieces) {
        if (!r.tile) continue;
        const col = r.state === "have" ? "80,170,255" : r.state === "blocked" ? "255,60,60" : "0,255,136", fs = buildTileToScreen(r.tile), fy = fs.top;
        ctx.fillStyle = "rgba(" + col + "," + (0.16 + 0.12 * pulse) + ")"; ctx.strokeStyle = "rgba(" + col + ",0.9)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fs.x, fy); ctx.lineTo(fs.x + TILE_W, fy + TILE_H); ctx.lineTo(fs.x, fy + 2 * TILE_H); ctx.lineTo(fs.x - TILE_W, fy + TILE_H); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = r.state === "blocked" ? "#ff8a8a" : "#fff"; ctx.fillText(r.piece.c, fs.x, fy + TILE_H);
    }
    // the summary under the generator's tile
    const g = plan.pieces.find(p => p.piece.c === "G");
    if (g && g.tile) {
        const s = buildTileToScreen(g.tile), py = s.top, armed = _bmPointerType !== "mouse" && _bmArmedKey === t.x + "," + t.y;
        const label = (armed && v.ok ? "TAP AGAIN: " : "") + (kitById(buildTool.id).name + " · " + v.why);
        ctx.fillStyle = "rgba(0,0,0,0.75)"; const w = ctx.measureText(label).width + 12; ctx.fillRect(s.x - w / 2, py + 2 * TILE_H + 6, w, _fs * 1.6);
        ctx.fillStyle = v.ok ? "#fff" : "#f88"; ctx.fillText(label, s.x, py + 2 * TILE_H + 6 + _fs * 0.8);
    }
    ctx.restore();
}
