// ─────────────────────────────────────────────────────────
//  THE MUTATOR'S HEALING SERUM, AND ITS LABORATORY (docs/MUTATOR.md, "The healing serum")
// ─────────────────────────────────────────────────────────
// ASKED (the brief): "The Mutator can craft healing serums that are splashed onto the ground. Each serum creates an area-of-effect healing zone. Eligible allies within the splash zone receive healing.
// Healing should be visually readable and clearly communicate which units are being affected." "The Mutator has a laboratory where serum becomes available over time. Serum replenishes at configurable 60-second
// intervals. Higher Mutator levels increase the amount of serum generated automatically. DNA can also be spent whenever the player crafts a serum. The automatic supply and DNA crafting systems should work
// together." "Do not assume that automatic production eliminates the DNA crafting cost or silently choose a final resource formula. Expose the relevant rules for balancing."
//   THE SERUM      an item of the pack (ITEMS.healing_serum: the Mutator's to use; anyone may carry it). Used (the pack, the SERUM pill beside the dial, or Q), it is SPLASHED on the ground where the Mutator stands:
//                  a green pool of SERUM.splash.radius tiles for SERUM.splash.frames. Every ALLY in it (a follower or a clone of yours) is healed SERUM.splash.pct of its max health every SERUM.splash.every
//                  frames: a green "+n" over it each time (js/combat.js healUnit) and a green ring under it while it is in the pool. Creatures are not healed; the player is not (three hits, not health).
//   THE LABORATORY the Experiment Lab's fume hood is the SERUM HOOD (a station, js/stations.js, the Mutator's): every SERUM.lab.every frames (60 s) it makes serum, base + perLevel × (the Mutator's level − 1)
//                  (fractions carry over), up to SERUM.lab.cap waiting. At the hood: COLLECT takes what is waiting into the pack; with nothing waiting, CRAFT makes one now for SERUM.craft.dna DNA (any
//                  splices). Both fill the same pack: the hood's free supply is slow, DNA buys more. Every number is a knob.
const SERUM = {
    item: "healing_serum",
    splash: { radius: 2.6, frames: 300, every: 30, pct: 0.06 },   // the pool: its radius (tiles), how long it lasts, how often it heals, and how much (a share of each ally's max health)
    lab: { every: 3600, base: 1, perLevel: 0.25, cap: 5 },        // the laboratory: how often it makes serum (frames), how much at level 1, how much more a level, how many it holds
    craft: { dna: 5 },                                            // crafting one at the hood (the brief's tentative "approximately five DNA")
};
let serumZones = [];                         // the pools on the floor: { x, y, t0, until, next }
const serumLab = { stock: 0, frac: 0, nextAt: 0 };
function _srFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _srSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#7dffb0", life: 120, vy: -0.22, size: 13 }); }
function _srMutator() { return typeof playerClassKey !== "undefined" && playerClassKey === "mutator"; }
function serumReset() { serumZones = []; serumLab.stock = 0; serumLab.frac = 0; serumLab.nextAt = _srFrame() + SERUM.lab.every; }

// ── the pool ──
// splash one where the Mutator stands (the pack's USE, the SERUM pill, Q): true when it was splashed
function serumSplash(x, y) {
    const f = _srFrame(); x = Number.isFinite(x) ? x : player.x; y = Number.isFinite(y) ? y : player.y;
    serumZones.push({ x, y, t0: f, until: f + SERUM.splash.frames, next: f });
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x, y, color: "#7dffb0", radius: 1.2, life: 26 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x, y, text: "SERUM", color: "#7dffb0", life: 50, vy: -0.03, size: 13 });
    if (typeof tutTally === "function") tutTally("serum");   // (the class's stage counts it: js/tutorial.js)
    return true;
}
// the allies a pool heals: your followers and clones, alive, standing in it
function serumAllies(z) {
    const out = [], R2 = SERUM.splash.radius * SERUM.splash.radius; if (typeof actors === "undefined") return out;
    for (const a of actors) { if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone) || a.returningToCrystal) continue; const dx = a.x - z.x, dy = a.y - z.y; if (dx * dx + dy * dy <= R2) out.push(a); }
    return out;
}
// the pack's USE (js/inventory.js): splash it (a consumable is used up only when it works)
function serumUse() {
    if (!_srMutator()) return { ok: false, why: "ONLY A MUTATOR CAN USE THE SERUM" };
    if (typeof facilityPlay !== "undefined" && !facilityPlay) return { ok: false, why: "NOT IN THE FACILITY" };
    serumSplash(player.x, player.y); return { ok: true, msg: "SERUM SPLASHED — ALLIES IN THE POOL ARE HEALED" };
}
// ── the laboratory ──
// how much it makes in one round, at the Mutator's level (the brief: "higher Mutator levels increase the amount of serum generated automatically")
function serumLabYield(level) { const L = Number.isFinite(level) ? level : (typeof mutatorLevel === "function" ? mutatorLevel() : 1); return SERUM.lab.base + SERUM.lab.perLevel * Math.max(0, L - 1); }
// each step (js/game.js): the pools heal; the laboratory makes serum while the player is a Mutator
function serumTick() {
    const f = _srFrame();
    if (serumZones.length) {
        for (const z of serumZones) {
            if (f < z.next) continue; z.next = f + SERUM.splash.every;
            for (const a of serumAllies(z)) { if (a.health >= a.maxHealth) { a._serumAt = f; continue; } if (typeof healUnit === "function") healUnit(a, a.maxHealth * SERUM.splash.pct, z); else a.health = Math.min(a.maxHealth, a.health + a.maxHealth * SERUM.splash.pct); a._serumAt = f; }
        }
        serumZones = serumZones.filter(z => f < z.until);
    }
    if (!_srMutator()) { serumLab.nextAt = Math.max(serumLab.nextAt, f + SERUM.lab.every); return; }   // (the lab is the Mutator's: it starts its round when the class is chosen)
    if (f >= serumLab.nextAt) {
        serumLab.nextAt = f + SERUM.lab.every;
        if (serumLab.stock < SERUM.lab.cap) { serumLab.frac += serumLabYield(); const add = Math.floor(serumLab.frac + 1e-9); serumLab.frac -= add; serumLab.stock = Math.min(SERUM.lab.cap, serumLab.stock + add); }
    }
}
// the SERUM HOOD (js/stations.js STATION_KINDS.serum_hood): what it would do now, and doing it
function serumHoodVerb() { return serumLab.stock > 0 ? "COLLECT " + serumLab.stock + " SERUM" + (serumLab.stock > 1 ? "S" : "") : "CRAFT A SERUM — " + SERUM.craft.dna + " DNA"; }
function serumHoodCan() {
    if (typeof invRoom === "function" && invRoom(SERUM.item) <= 0) return { ok: false, why: "YOUR PACK HOLDS NO MORE SERUM" };
    if (serumLab.stock > 0) return { ok: true };
    const have = typeof dnaTotal === "function" ? dnaTotal() : 0;
    if (have < SERUM.craft.dna) return { ok: false, why: "NONE READY (NEXT IN " + Math.max(0, Math.ceil((serumLab.nextAt - _srFrame()) / 60)) + " S) — CRAFTING TAKES " + SERUM.craft.dna + " DNA, YOU HAVE " + have };
    return { ok: true };
}
function serumHoodUse() {
    const can = serumHoodCan(); if (!can.ok) return { ok: false, why: can.why };
    if (serumLab.stock > 0) { const n = typeof invAdd === "function" ? invAdd(SERUM.item, serumLab.stock) : 0; serumLab.stock -= n; return { ok: true, msg: "+" + n + " SERUM" + (n > 1 ? "S" : "") + " FROM THE LAB" + (serumLab.stock ? " (" + serumLab.stock + " LEFT: NO ROOM)" : "") }; }
    if (typeof dnaSpend !== "function" || !dnaSpend(SERUM.craft.dna)) return { ok: false, why: "NEEDS " + SERUM.craft.dna + " DNA" };
    if (typeof invAdd === "function") invAdd(SERUM.item, 1);
    if (typeof mutatorGainXp === "function") mutatorGainXp(SERUM.craft.dna);   // (an experiment: the Mutator's level, js/mutator.js)
    return { ok: true, msg: "SERUM CRAFTED — " + SERUM.craft.dna + " DNA" };
}

// ── drawing ──
// the pool, painted on each floor tile it covers (js/game.js calls this as a floor tile is drawn, like burning ground): a translucent green pool, brighter at its heart, with a few bubbles, fading at the end
function drawSerumOnTile(tx, ty, px, py) {
    if (!serumZones.length) return;
    const f = _srFrame(), R = SERUM.splash.radius;
    for (const z of serumZones) {
        if (Math.abs(z.x - tx) > R + 1 || Math.abs(z.y - ty) > R + 1) continue;
        const life = Math.min(1, (z.until - f) / 60, (f - z.t0 + 1) / 8), zx = (z.x - player.visualX - (z.y - player.visualY)) * TILE_W + canvas.width / 2, zy = (z.x - player.visualX + (z.y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(z.x, z.y) : 0);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
        ctx.translate(zx, zy); ctx.scale(1, TILE_H / TILE_W);
        const rr = R * TILE_W * Math.SQRT2, g = ctx.createRadialGradient(0, 0, rr * 0.1, 0, 0, rr);
        g.addColorStop(0, "rgba(125,255,176," + (0.42 * life).toFixed(3) + ")"); g.addColorStop(0.8, "rgba(60,220,130," + (0.26 * life).toFixed(3) + ")"); g.addColorStop(1, "rgba(60,220,130,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // bubbles on this tile, rising and popping
        const seed = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        if (Math.hypot(tx - z.x, ty - z.y) < R) for (let k = 0; k < 2; k++) { const ph = ((f + seed % 97 + k * 41) % 60) / 60, bx = px + (((seed >> (k * 3)) % 9) - 4) * 4, by = py + TILE_H - ph * 10; ctx.globalAlpha = 0.55 * life * (1 - ph); ctx.strokeStyle = "#c9ffdc"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, 1.5 + ph * 2, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    }
}
// over the scene: a green ring under every ally a pool is healing (the brief: "clearly communicate which units are being affected")
function drawSerumOverlay() {
    if (typeof ctx === "undefined" || typeof actors === "undefined" || !serumZones.length) return;
    const f = _srFrame();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of actors) {
        if (!a || a.dead || !(f - (a._serumAt === undefined ? -1e9 : a._serumAt) <= SERUM.splash.every + 2)) continue;
        const sx = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width / 2, sy = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(a.x, a.y) : 0);
        const pul = 0.6 + 0.4 * Math.sin(f * 0.2);
        ctx.save(); ctx.translate(sx, sy + TILE_H * 0.6); ctx.scale(1, 0.45); ctx.globalAlpha = 0.7 * pul; ctx.strokeStyle = "#7dffb0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        ctx.globalAlpha = 0.85; ctx.fillStyle = "#7dffb0"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText("+", sx + 18, sy - 40 - (f % 30));
    }
    ctx.restore();
}
// ── THE SERUM PILL: beside the weapon's, for the Mutator: how many serums, and a tap splashes one ──
let _SERUMCHIP = { x: 0, y: 0, w: 0, h: 0 };
function drawSerumChip(x, y, alpha) {
    _SERUMCHIP.w = 0; if (!_srMutator() || typeof ctx === "undefined") return;
    const n = typeof invCount === "function" ? invCount(SERUM.item) : 0, txt = "SERUM " + n, hh = 22, col = n > 0 ? "#7dffb0" : "#6d8a7a";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha || 1; ctx.font = typeof uiMono === "function" ? uiMono(13) : "bold 13px monospace";
    const w = 24 + ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(6,18,12,0.65)"; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y - hh / 2, w, hh, 11); else ctx.rect(x, y - hh / 2, w, hh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 11, y + 2, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 9.5, y - 7, 3, 6);   // a small vial
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + 20, y + 1);
    ctx.restore();
    _SERUMCHIP = { x: x - 4, y: y - hh / 2 - 4, w: w + 8, h: hh + 8 };
}
// a tap on the pill (js/input.js): true when it was the pill's
function serumChipTap(ex, ey) {
    const c = _SERUMCHIP; if (!c.w || ex < c.x || ex > c.x + c.w || ey < c.y || ey > c.y + c.h) return false;
    if (typeof invUse === "function" && typeof invCount === "function" && invCount(SERUM.item) > 0) invUse(SERUM.item); else _srSay("NO SERUM: COLLECT OR CRAFT IT AT THE SERUM HOOD (THE EXPERIMENT LAB)", "#ff9c8a");
    return true;
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && (e.key === "q" || e.key === "Q") && _srMutator() && typeof facilityPlay !== "undefined" && facilityPlay && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || "")) && typeof invCount === "function" && invCount(SERUM.item) > 0) invUse(SERUM.item); }); } catch (e) { /* no page (the test sandbox) */ }

// ── saving (js/facilitysave.js): what the lab holds and how far through its round it is ──
function serumSnapshot() { return { stock: serumLab.stock, frac: Math.round(serumLab.frac * 1000) / 1000, left: Math.max(0, serumLab.nextAt - _srFrame()) }; }
function serumApply(d) {
    serumReset(); if (!d || typeof d !== "object") return;
    serumLab.stock = Math.max(0, Math.min(SERUM.lab.cap, d.stock | 0)); serumLab.frac = Math.max(0, Math.min(0.999, +d.frac || 0)); serumLab.nextAt = _srFrame() + Math.max(1, Math.min(SERUM.lab.every, d.left | 0 || SERUM.lab.every));
}
