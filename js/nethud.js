// ─────────────────────────────────────────────────────────
//  THE NETWORK PANEL — signal where you stand, the battery supply, and each element's tier
// ─────────────────────────────────────────────────────────
// REPORTED: "the network and battery supply up top needs a redesign, and make it change network status if the player is in a zone where the signal is
// weak. It should be a rule that the network strength weakens the further away from the batteries."
//
// THE RULE (it was already how a PYLON reads its network, networkTierAt in game.js; now it is the player's too): a network's strength is full within
// BANK_FULL_RANGE tiles of the nearest battery in its bank, and one tier lower for every BANK_FALLOFF_STEP tiles beyond (config.js).
// networkSignalAt(x, y) applies it to a spot, and the panel reads it for the player:
//   STRONG     where you stand the network is at the tier it was built to
//   WEAK       you are far enough out that it has fallen a tier or more (the panel says which tier you have here, and how far the batteries are)
//   NO SIGNAL  you are past the reach of every bank
//   OFFLINE    no bank yet (link 2 batteries of one element)
// A change is said once on the screen ("SIGNAL WEAK", "NO SIGNAL", "SIGNAL RESTORED").
//
// The panel (right side, under the HUD plates, with no box): a dial (the signal as segments round the outside, the battery charge as a ring inside, the tier you have in the middle), the state,
// the BATT line (charge, and which way it is flowing), where you stand, the NESTS line (what the nests hold, and how many pylons are drawing or dark) and one row per networked element with
// three pips: the outline is the tier the bank was built to, the fill is the tier you have where you stand.
const SIGNAL_STATES = {
    strong:  { label: "STRONG",    col: "#19e6c1" },
    weak:    { label: "WEAK",      col: "#ffe733" },
    none:    { label: "NO SIGNAL", col: "#ff4a1c" },
    offline: { label: "OFFLINE",   col: "#6a7aa0" },
};
const NET_TIER_ROMAN = ["", "I", "II", "III"];
const NET_EFFECT_DESC = {
    fire:     ["", "burn", "heavy burn", "ignite spread"],
    electric: ["", "resonance+", "res+ult boost", "max resonance"],
    ice:      ["", "slow", "heavy slow", "deep freeze"],
    flux:     ["", "pull", "chain pull", "vortex dmg"],
    core:     ["", "shield", "fast shield", "regen shield"],
    toxic:    ["", "corrode", "shred+", "plague cloud"],
};

// The network as it reaches (x, y). { state, bank (best tier built), local (best tier here), el (the element that is best here), dist (tiles to the
// nearest battery in any bank), tiers { element: tier here } }.
function networkSignalAt(x, y) {
    let bank = 0, local = 0, el = null;
    const tiers = {};
    for (const e of ELEMENTS) {
        const b = networkStrength[e.id] || 0;
        if (!b) continue;
        bank = Math.max(bank, b);
        const l = networkTierAt(e.id, x, y);
        tiers[e.id] = l;
        if (l > local) { local = l; el = e.id; }
    }
    let dist = Infinity;
    for (const bk of _batteryBanks) for (const m of bk.members) { const d = Math.hypot(m.x - x, m.y - y); if (d < dist) dist = d; }
    const state = bank === 0 ? "offline" : local === 0 ? "none" : local < bank ? "weak" : "strong";
    return { state, bank, local, el, dist, tiers };
}

// What the player is told when the state changes: only after two readings agree (the player walking along an edge does not flicker), and not
// more than once every few seconds.
let _sigSeen = "offline", _sigShown = "offline", _sigAt = -Infinity;
function networkSignalAnnounce(sig) {
    if (sig.state === _sigSeen) {
        if (sig.state !== _sigShown && (frame || 0) - _sigAt >= 120) {
            const was = _sigShown; _sigShown = sig.state; _sigAt = frame || 0;
            let text = null, color = SIGNAL_STATES[sig.state].col;
            if (sig.state === "weak") text = "◈ SIGNAL WEAK — TIER " + NET_TIER_ROMAN[sig.local] + " HERE, " + NET_TIER_ROMAN[sig.bank] + " AT THE BATTERIES";
            else if (sig.state === "none") text = "◈ NO SIGNAL — OUT OF BATTERY RANGE";
            else if (sig.state === "strong" && (was === "weak" || was === "none")) text = "◈ SIGNAL RESTORED";
            if (text && typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 110, text, color, life: 150, vy: -0.2, size: 13 });
        }
    } else _sigSeen = sig.state;
}

// The zone plate's box on the page (the HUD is page elements over the canvas), or null.
function _netZoneRect() {
    try { const e = document.getElementById("zoneInfo"); if (!e) return null; const r = e.getBoundingClientRect(); return r.height > 0 && isFinite(r.bottom) && r.bottom < canvas.height * 0.5 ? r : null; } catch (err) { return null; }
}
let _netPanelRect = null;   // where the panel was last drawn (for the tap)
let _hudPw = null, _hudPwAt = -Infinity, _hudSig = null;
// BOXLESS (reported: "I don't think the network really needs a box ... a layout that's boxless, and make one or two of the status bars radial, not all, and keep the Smash Bros neo-futuristic vibe"):
// no panel behind it. Text carries a dark outline instead so it reads over the floor; one DIAL carries two readings as rings (the signal, as 24 slanted segments round the outside; the battery
// charge as a smooth gold ring inside it, a tier numeral in the middle); the nests stay a thin straight bar and each element a row of pips, so only the dial is radial.
function _netText(text, x, y, size, col, align, mono) {
    ctx.save(); ctx.font = mono ? uiMono(size) : uiFont(size); ctx.textAlign = align || "left"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, size * 0.3); ctx.strokeStyle = "rgba(4,6,14,0.92)"; ctx.strokeText(text, x, y);
    ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.restore();
}
// The same, shrunk until it fits maxW.
function _netTextFit(text, x, y, size, col, align, maxW, mono) {
    ctx.save(); ctx.font = mono ? uiMono(size) : uiFont(size); const w = ctx.measureText(text).width; ctx.restore();
    _netText(text, x, y, w > maxW ? Math.max(9, Math.floor(size * maxW / w)) : size, col, align, mono);
}
// The dial: outer ring = signal (24 slanted segments, lit by how much of the network reaches you), inner ring = battery charge, middle = the tier you have here.
function _netDial(cx, cy, sig, bs, S) {
    const TAU = Math.PI * 2, top = -Math.PI / 2, R1 = 40, R2 = 28, SEGS = 24, seg = TAU * R1 / SEGS;
    // a soft dark pool behind it, so the rings read over any floor (a glow, not a box)
    const g = ctx.createRadialGradient(cx, cy, R2 * 0.4, cx, cy, R1 + 18); g.addColorStop(0, "rgba(4,6,14,0.62)"); g.addColorStop(0.75, "rgba(4,6,14,0.38)"); g.addColorStop(1, "rgba(4,6,14,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R1 + 18, 0, TAU); ctx.fill();
    ctx.save(); ctx.lineCap = "butt";
    // the signal: a dashed track, then the same dashes lit round to the fraction that reaches you
    ctx.lineWidth = 9; ctx.setLineDash([seg * 0.78, seg * 0.22]);
    ctx.strokeStyle = "rgba(14,22,46,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, R1, top, top + TAU); ctx.stroke();
    const frac = sig.bank > 0 ? sig.local / sig.bank : 0, lit = Math.round(SEGS * frac);
    if (lit > 0) { ctx.strokeStyle = S.col; ctx.beginPath(); ctx.arc(cx, cy, R1, top, top + lit * TAU / SEGS); ctx.stroke(); }
    ctx.setLineDash([]);
    // the battery: a smooth ring inside it
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(14,22,46,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, R2, 0, TAU); ctx.stroke();
    const bf = bs.count > 0 && bs.cap ? Math.max(0, Math.min(1, bs.stored / bs.cap)) : 0;
    if (bf > 0) { ctx.strokeStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(cx, cy, R2, top, top + bf * TAU); ctx.stroke(); }
    // two thin guide rings: the dial's edge and the inside of the battery ring
    ctx.lineWidth = 1.5; ctx.strokeStyle = S.col; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, R1 + 6.5, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, R2 - 5, 0, TAU); ctx.stroke();
    ctx.restore();
    _netText(sig.local > 0 ? NET_TIER_ROMAN[sig.local] : "\u2013", cx, cy + 1, 22, sig.local > 0 ? "#fff" : S.col, "center");
}
function drawNetworkStatusHUD() {
    _netPanelRect = null;
    if (typeof facilityPlay !== "undefined" && facilityPlay && typeof drawFacilityNetworkHUD === "function") { drawFacilityNetworkHUD(); return; }   // the facility's own grid (js/facilitynet.js)
    if (typeof placingHidesUi === "function" && placingHidesUi()) return;
    const activeEls = ELEMENTS.filter(e => (networkStrength[e.id] || 0) > 0);
    // The readout is worked out a few times a second, not every frame: it
    // walks every pylon and battery, and numbers that change 60 times a
    // second cannot be read anyway.
    if (!_hudPw || frame - _hudPwAt >= 10 || frame < _hudPwAt) {
        _hudPw = powerStatus(); _hudPwAt = frame;
        _hudSig = networkSignalAt(player.x, player.y); networkSignalAnnounce(_hudSig);
    }
    const pw = _hudPw, sig = _hudSig;
    // (Always shown, even with nothing built: a tap on it is the way into the power build.)

    const narrow = canvas.width < 600;
    const bs = pw.batteries || { count: 0 };
    const W = narrow ? Math.min(canvas.width - 16, 230) : 236, IW = W - 8;
    const DIAL = 104, WHERE = 20, NEST = 30, ROW_H = 30;
    const rows = narrow ? 0 : activeEls.length;
    const darkRows = narrow ? 0 : activeEls.filter(e => !(_netLit[e.id] > 0)).length;
    const H = DIAL + WHERE + NEST + rows * ROW_H + darkRows * 12 + 22;
    // Docked to the zone plate: hanging from its bottom edge, right edges together (it falls back to the HUD's bottom if the plate is not there).
    const zr = narrow ? null : _netZoneRect();   // on a phone the zone plate sits above the bars, so the panel hangs from the whole HUD instead
    const X = zr ? Math.max(8, Math.round(zr.right - W)) : canvas.width - W - 10, Y = zr ? Math.round(zr.bottom - 2) : uiTopSafe();
    const S = SIGNAL_STATES[sig.state], mx = X + 4, right = X + W - 4;

    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // The dial on the right; the name, the state and the battery on its left.
    const dcx = right - 52, dcy = Y + DIAL / 2, lw = dcx - 52 - mx;
    _netDial(dcx, dcy, sig, bs, S);
    _netText("NETWORK", mx, Y + 16, 15, "#cfe0ff", "left");
    ctx.save(); ctx.fillStyle = S.col; ctx.beginPath(); ctx.moveTo(mx + 6, Y + 28); ctx.lineTo(mx + Math.min(lw, 118), Y + 28); ctx.lineTo(mx + Math.min(lw, 118) - 5, Y + 31); ctx.lineTo(mx + 1, Y + 31); ctx.closePath(); ctx.fill(); ctx.restore();   // the slanted accent under the name, in the state's colour
    _netTextFit(S.label, mx, Y + 51, 26, S.col, "left", lw);
    // THE BATTERIES: what they hold and which way it is flowing: the power the pylons actually run on (power.js). The gold ring is the same charge.
    if (bs.count > 0) {
        const net = bs.rateIn - bs.rateOut;
        _netTextFit("\u26a1 BATT " + bs.stored + " / " + bs.cap, mx, Y + 76, 13, "#ffd34d", "left", lw, true);
        _netText((net >= 0 ? "\u25b2 " : "\u25bc ") + Math.abs(net).toFixed(1) + "/s", mx, Y + 92, 12, net >= 0.05 ? "#9fe8c0" : net <= -0.05 ? "#ff9a66" : "#8a93a8", "left", true);
    }
    // where you stand
    const where = sig.state === "offline" ? "TAP HERE TO BOOT THE POWER UNIT"
                : sig.state === "none" ? "OUT OF RANGE \u00b7 " + Math.round(sig.dist) + " TILES OUT"
                : sig.state === "weak" ? "TIER " + NET_TIER_ROMAN[sig.local] + " HERE \u00b7 " + Math.round(sig.dist) + " TILES OUT"
                : "TIER " + NET_TIER_ROMAN[sig.local] + " HERE" + (sig.dist <= BANK_FULL_RANGE ? " \u00b7 AT THE BATTERIES" : "");
    let y = Y + DIAL;
    _netTextFit(where, mx, y + 8, 12, sig.state === "strong" ? "#a9bddf" : S.col, "left", IW, true);
    y += WHERE;

    // THE NESTS: what is left in them, a thin straight bar under the line. Red the moment a pylon has gone dark, which is the only state the player has to act on.
    const tot = pw.pools.reduce((a, p) => a + p.energy, 0), cap = pw.pools.reduce((a, p) => a + p.max, 0), ok = pw.dark === 0;
    _netText("NESTS " + tot + " / " + cap, mx, y + 8, 13, "#fff", "left", true);
    _netText(ok ? pw.drawing + " DRAWING" : pw.dark + " UNPOWERED", right, y + 8, 12, ok ? "#a9bddf" : "#ff9a66", "right", true);
    { const nf = cap ? Math.max(0, Math.min(1, tot / cap)) : 0, col = ok ? "#5fe0c8" : "#ff5522", by = y + 19, bw = IW;
      ctx.beginPath(); ctx.moveTo(mx + 4, by); ctx.lineTo(mx + bw, by); ctx.lineTo(mx + bw - 3, by + 5); ctx.lineTo(mx, by + 5); ctx.closePath(); ctx.fillStyle = "rgba(4,6,14,0.7)"; ctx.fill();
      if (nf > 0) { const w = bw * nf; ctx.beginPath(); ctx.moveTo(mx + 4, by); ctx.lineTo(mx + w, by); ctx.lineTo(mx + w - 3, by + 5); ctx.lineTo(mx, by + 5); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
      ctx.lineWidth = 1; ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(mx + 4, by); ctx.lineTo(mx + bw, by); ctx.lineTo(mx + bw - 3, by + 5); ctx.lineTo(mx, by + 5); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    y += NEST;

    // One row per networked element: its icon and name, and three pips (outline: the tier built, fill: the tier you have here)
    activeEls.forEach((elDef) => {
        if (narrow) return;
        const el = elDef.id, tier = networkStrength[el] || 0, here = (sig.tiers[el] !== undefined ? sig.tiers[el] : tier);
        // A network with a tier but nothing lit is built but DARK: say so, or
        // the tier reads as a promise the pylons are not keeping.
        const dark = !(_netLit[el] > 0), ry = y;
        // The element's icon (js/icons.js); a stripe until it has loaded.
        if (!(typeof drawIcon === "function" && drawIcon(ctx, ELEMENT_ICON[el] || el, elDef.color, mx + 10, ry + 15, 18))) { ctx.fillStyle = elDef.color; ctx.fillRect(mx, ry + 6, 4, ROW_H - 12); }
        _netText(elDef.label.toUpperCase(), mx + 28, ry + 14, 15, elDef.color, "left");
        for (let p = 0; p < 3; p++) {
            const px = right - 3 * 17 + p * 17, py = ry + 6;
            ctx.beginPath(); ctx.moveTo(px + 3, py); ctx.lineTo(px + 14, py); ctx.lineTo(px + 11, py + 17); ctx.lineTo(px, py + 17); ctx.closePath();
            ctx.fillStyle = "rgba(4,6,14,0.6)"; ctx.fill();
            if (p < here) { ctx.fillStyle = elDef.color; ctx.fill(); }
            ctx.lineWidth = 1.5; ctx.strokeStyle = p < tier ? elDef.color : "#3a4668"; ctx.stroke();
        }
        y += ROW_H;
        if (dark) { _netText("NO POWER \u2014 CHARGE", mx + 28, y + 2, 11, "#ff7755", "left", true); y += 12; }
    });
    // The way in: a tap on the panel opens the power build (and puts it away again).
    const _open = typeof wallUnitIsOpen === "function" ? wallUnitIsOpen() : (typeof buildMenuOpen !== "undefined" && buildMenuOpen && buildMenuSimple);
    _netTextFit(_open ? "\u25b8 TAP TO CLOSE THE POWER UNIT" : "\u25b8 TAP FOR THE POWER UNIT", X + W / 2, Y + H - 10, 11, _open ? UI_TEAL : "#a9bddf", "center", IW, true);
    _netPanelRect = { x: X, y: Y, w: W, h: H };
    ctx.restore();
}
// Is a point on the network panel? (input.js: a tap on it opens the power build.)
function netPanelHit(x, y) { const r = _netPanelRect; return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
