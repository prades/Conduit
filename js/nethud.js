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
// The panel (right side, under the HUD plates): the state, a segmented signal meter, the BATT line (charge, and which way it is flowing), the NESTS
// line (what the nests hold, and how many pylons are drawing or dark), and one row per networked element with three pips: the outline is the tier
// the bank was built to, the fill is the tier you have where you stand.
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

let _hudPw = null, _hudPwAt = -Infinity, _hudSig = null;
function drawNetworkStatusHUD() {
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
    // The grid line shows from the first pylon, before any network has formed —
    // it is the thing the player is now budgeting, so it cannot wait for a
    // resonance tier to appear first.
    if (activeEls.length === 0 && pw.drawing === 0 && !(pw.batteries && pw.batteries.count)) return;

    const narrow = canvas.width < 600;
    const bs = pw.batteries || { count: 0 };
    const W = narrow ? Math.min(canvas.width - 16, 260) : 300, PAD = 16;
    const ROW_H = narrow ? 0 : 46, HEAD = 44, METER = 50, LINE = 44;
    const rows = narrow ? 0 : activeEls.length;
    const hint = Math.max(0, ...activeEls.map(e => networkStrength[e.id] || 0)) < 3;
    const H = HEAD + METER + (bs.count > 0 ? LINE : 0) + LINE + rows * ROW_H + (hint && !narrow ? 30 : 8);
    const X = canvas.width - W - 10, Y = narrow ? uiTopSafe() : uiTopSafe();
    const S = SIGNAL_STATES[sig.state];

    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiPanel(X, Y, W, H, S.col);

    // Header: the name, and the state where you stand
    uiText("NETWORK", X + PAD + 6, Y + HEAD / 2 + 2, 22, "#fff", "left", false);
    ctx.font = uiFont(22); const titleW = ctx.measureText("NETWORK").width;
    uiTextFit(S.label, X + W - PAD, Y + HEAD / 2 + 2, 22, S.col, "right", W - PAD * 2 - 6 - titleW - 14);

    // The signal meter: eight slanted segments, lit by how much of the network reaches you
    const segs = 8, lit = sig.bank > 0 ? Math.round(segs * sig.local / sig.bank) : 0;
    const mx = X + PAD + 4, my = Y + HEAD + 4, mw = W - PAD * 2 - 4, sw = Math.floor((mw - (segs - 1) * 4) / segs);
    for (let i = 0; i < segs; i++) {
        const x = mx + i * (sw + 4), on = i < lit;
        ctx.beginPath(); ctx.moveTo(x + 5, my); ctx.lineTo(x + sw, my); ctx.lineTo(x + sw - 5, my + 16); ctx.lineTo(x, my + 16); ctx.closePath();
        ctx.fillStyle = on ? S.col : "#0c1224"; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = on ? S.col : "#2c3656"; ctx.stroke();
    }
    const where = sig.state === "offline" ? "LINK 2 BATTERIES OF ONE ELEMENT"
                : sig.state === "none" ? "OUT OF RANGE · " + Math.round(sig.dist) + " TILES FROM THE BATTERIES"
                : sig.state === "weak" ? "TIER " + NET_TIER_ROMAN[sig.local] + " HERE · " + Math.round(sig.dist) + " TILES OUT"
                : "TIER " + NET_TIER_ROMAN[sig.local] + " HERE" + (sig.dist <= BANK_FULL_RANGE ? " · AT THE BATTERIES" : "");
    uiCaptionFit(where, X + PAD + 4, my + 30, sig.state === "strong" ? "#8aa0c8" : S.col, "left", 12, W - PAD * 2);
    let y = Y + HEAD + METER;

    // THE BATTERIES: what they hold and which way it is flowing — the power
    // the pylons actually run on (power.js).
    if (bs.count > 0) {
        uiText("\u26a1 BATT " + bs.stored + " / " + bs.cap, X + PAD + 4, y + 12, 17, BATTERY_COLOR, "left", false);
        const net = bs.rateIn - bs.rateOut;
        uiCaption((net >= 0 ? "▲ " : "▼ ") + Math.abs(net).toFixed(1) + "/s", X + W - PAD, y + 12, net >= 0.05 ? "#9fe8c0" : net <= -0.05 ? "#ff9a66" : "#6b7487", "right", 13);
        ctx.fillStyle = "#05070f"; ctx.fillRect(X + PAD + 4, y + 26, W - PAD * 2 - 4, 8);
        ctx.fillStyle = BATTERY_COLOR; ctx.fillRect(X + PAD + 4, y + 26, (W - PAD * 2 - 4) * (bs.cap ? bs.stored / bs.cap : 0), 8);
        ctx.strokeStyle = "#5a4a1a"; ctx.lineWidth = 1.5; ctx.strokeRect(X + PAD + 4, y + 26, W - PAD * 2 - 4, 8);
        y += LINE;
    }
    // The nests: what is left in them. Red the moment a pylon has gone dark, which is the only state the player has to act on.
    const tot = pw.pools.reduce((a, p) => a + p.energy, 0), cap = pw.pools.reduce((a, p) => a + p.max, 0), ok = pw.dark === 0;
    uiText("NESTS " + tot + " / " + cap, X + PAD + 4, y + 12, 17, ok ? "#8fd" : "#ff5522", "left", false);
    uiCaption(ok ? pw.drawing + " DRAWING" : pw.dark + " UNPOWERED", X + W - PAD, y + 12, ok ? "#6a7aa0" : "#ff5522", "right", 13);
    ctx.fillStyle = "#05070f"; ctx.fillRect(X + PAD + 4, y + 26, W - PAD * 2 - 4, 8);
    ctx.fillStyle = ok ? "#5fe0c8" : "#ff5522"; ctx.fillRect(X + PAD + 4, y + 26, (W - PAD * 2 - 4) * (cap ? tot / cap : 0), 8);
    ctx.strokeStyle = "#2c3656"; ctx.lineWidth = 1.5; ctx.strokeRect(X + PAD + 4, y + 26, W - PAD * 2 - 4, 8);
    y += LINE;

    // One row per networked element: its name and effect, and three pips (outline: the tier built, fill: the tier you have here)
    activeEls.forEach((elDef, i) => {
        if (narrow) return;
        const el = elDef.id, tier = networkStrength[el] || 0, here = (sig.tiers[el] !== undefined ? sig.tiers[el] : tier);
        const ry = y + i * ROW_H;
        // The element's icon (js/icons.js); a stripe until it has loaded.
        if (!(typeof drawIcon === "function" && drawIcon(ctx, ELEMENT_ICON[el] || el, elDef.color, X + PAD + 12, ry + 21, 22))) { ctx.fillStyle = elDef.color; ctx.fillRect(X + PAD, ry + 6, 5, ROW_H - 14); }
        // A network with a tier but nothing lit is built but DARK — say so, or
        // the tier reads as a promise the pylons are not keeping.
        const dark = !(_netLit[el] > 0);
        uiText(elDef.label.toUpperCase(), X + PAD + 32, ry + 15, 18, elDef.color, "left", false);
        uiCaptionFit(dark ? "NO POWER — CHARGE" : (here > 0 ? (NET_EFFECT_DESC[el] || [])[here] || "" : "no signal here"), X + PAD + 32, ry + 34, dark ? "#ff7755" : here < tier ? "#ffe733" : "#8aa0c8", "left", 12, W - PAD * 2 - 106);
        for (let p = 0; p < 3; p++) {
            const px = X + W - PAD - 3 * 22 + p * 22, py = ry + 8;
            ctx.beginPath(); ctx.moveTo(px + 4, py); ctx.lineTo(px + 18, py); ctx.lineTo(px + 14, py + 22); ctx.lineTo(px, py + 22); ctx.closePath();
            if (p < here) { ctx.fillStyle = elDef.color; ctx.fill(); }
            ctx.lineWidth = 2; ctx.strokeStyle = p < tier ? elDef.color : "#2c3656"; ctx.stroke();
        }
    });
    y += rows * ROW_H;
    // Hint when any tier < 3 (nudge player to extend)
    if (hint && !narrow) {
        const maxTier = Math.max(0, ...activeEls.map(e => networkStrength[e.id] || 0)), needed = maxTier === 0 ? 2 : maxTier === 1 ? 4 : 6;
        uiCaptionFit(`Link batteries → Tier ${NET_TIER_ROMAN[maxTier + 1]} (need ${needed})`, X + W / 2, y + 10, "#6a7aa0", "center", 12, W - PAD * 2);
    }
    ctx.restore();
}
