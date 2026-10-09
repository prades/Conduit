// ─────────────────────────────────────────────────────────
//  ELEMENTAL BREAKOUT — a siege night, and the element wheel made real
//
//  REPORTED: "Create new night time status 'elemental breakout': all predators
//  have new elemental flare just like the followers. Has the elemental wheel
//  of super effective attacks and elemental weaknesses been uploaded?"
//
//  The wheel (elements.js: two triangles, fire > flux > toxic > fire and
//  electric > core > ice > electric; 1.3x strong, 0.7x weak, ice does nothing
//  to core) existed, but it only ran through applyElementalDamage, and only
//  against a target that HAD an element — and predators did not (bosses
//  aside). So in practice it almost never fired. Now:
//   - applyDamage runs the wheel on every hit whose element is known (the
//     hit's, or the attacker's), against any target with an element.
//   - On an ELEMENTAL BREAKOUT night every predator is given an element
//     (BREAKOUT_ELEMENTS, at random), wears its flare — a ring and sparks in
//     its colour — and its hits can set that element's status on your units
//     (breakoutProc). When the night lifts, the elements go.
// ─────────────────────────────────────────────────────────

const BREAKOUT_ELEMENTS   = ["fire", "electric", "ice", "flux", "core", "toxic"];
const BREAKOUT_PROC_SHARE = 0.5;   // × the element's follower proc chance
const BREAKOUT_TICK       = 20;    // frames between element hand-outs

function breakoutOn() { return typeof siegeIs === "function" && siegeIs("breakout"); }
function _breakoutEligible(a) {
    return a instanceof Predator && !a.dead && a.team !== "green" && !a.isClone && !a.isMachine
        && !a.isGrub && !a.isTutorialFoe && !(a.isNeutralRecruit);
}

// Once a frame from the game loop: hand out elements during a breakout, take
// back the ones it handed out when it ends.
function breakoutTick() {
    if (typeof frame === "undefined" || frame % BREAKOUT_TICK !== 0) return 0;
    let n = 0;
    if (breakoutOn()) {
        for (const a of actors) {
            if (!_breakoutEligible(a) || a.element) continue;
            a.element = BREAKOUT_ELEMENTS[Math.floor(Math.random() * BREAKOUT_ELEMENTS.length)];
            a._breakout = true; n++;
        }
    } else {
        for (const a of actors) if (a._breakout) { a.element = null; a._breakout = false; }
    }
    return n;
}

// The wheel, for applyDamage: the multiplier of a hit of `el` on `target`.
function wheelMult(el, target) {
    if (!el || !target || !target.element || typeof getElementMultiplier !== "function") return 1;
    return getElementMultiplier(el, target.element);
}

// A breakout predator's hit on one of your units can set its element's status.
function breakoutProc(source, target) {
    if (!source || !source._breakout || !source.element || !target || target.team !== "green") return null;
    const el = source.element;
    const chance = (typeof ELEMENT_PROC_CHANCE !== "undefined" ? ELEMENT_PROC_CHANCE[el] || 0.2 : 0.2) * BREAKOUT_PROC_SHARE;
    if (Math.random() >= chance) return null;
    switch (el) {
        case "fire":     target.burning = Math.max(target.burning || 0, 120); target.burnDamage = Math.max(target.burnDamage || 0, (source.power || 10) * 0.05); break;
        case "ice":      if (typeof applySlow === "function") applySlow(target, 90, 0.5); break;
        case "electric": if (typeof applySlow === "function") applySlow(target, 24, 0.1); break;   // a jolt: stopped for a moment
        case "flux":     target.disoriented = Math.max(target.disoriented || 0, 60); break;
        case "toxic":    target.defenseShredded = Math.max(target.defenseShredded || 0, 120); target.defenseShredFactor = 0.7; break;
        case "core":     source.health = Math.min(source.maxHealth, source.health + source.maxHealth * 0.05); break;
    }
    return el;
}

// ── The flare: a ring at its feet and sparks circling it, in its colour ──
function drawBreakoutFlare(a, px, py) {
    if (!a.element || !a._breakout) return;
    const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
    if (!def) return;
    const f = typeof frame !== "undefined" ? frame : 0, col = def.color;
    const n = parseInt(col.slice(1), 16), rgb = `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
    const w = Math.max(18, (a.dimensions ? a.dimensions.width : 24) * 0.9);
    // Under its legs: a predator's body is drawn above its point (as the
    // tyrant's ring is placed, drawBroodLabel).
    const fy = py - (a.dimensions ? a.dimensions.height * 1.15 : 24);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = `rgba(${rgb},${0.55 + 0.25 * Math.sin(f * 0.15 + a.x)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, fy, w, w * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) {
        const ang = f * 0.08 + i * Math.PI / 2 + a.x, up = ((f * 0.02 + i * 0.25) % 1);
        const sx = px + Math.cos(ang) * w * 0.9, sy = fy + Math.sin(ang) * w * 0.4 - up * 26;
        ctx.fillStyle = `rgba(${rgb},${0.9 * (1 - up)})`; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
    ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillStyle = col;
    ctx.fillText(def.label, px, fy - (a.dimensions ? a.dimensions.height * 1.8 : 40) - 16);
    ctx.restore();
}
