// ─────────────────────────────────────────────────────────
//  THE ARC'S ZAP AND ITS BOLT: what two Player cards still use of the Technomancer's arc (docs/TECHNOMANCER.md)
// ─────────────────────────────────────────────────────────
// THE ARC GAUNTLET IS GONE (build 2026-11-17at; the owner, 2026-11-20: "I want to remove the Technomancer's arc shot and melee. No melee unless it's the gunslinger."): the punch, the arc thrown at range,
// the gauntlet's charges and the grid that filled them. The Technomancer has no weapon of its own now (js/weapons.js); its mech, its lamp and its Player cards are as they were.
// What stays here is what the PLAYER CARDS use (js/playercards.js; nothing of theirs was asked to change):
//   THE ZAP     ARC WARDEN: while your lamp is overcharged, every creature in its light takes this (_tcZap): electric damage (technoArcDamage: the arc's number as it was, more with every relay online), and
//               a creature it hits while REARING BACK TO BITE (the telegraph, docs/COMBAT.md) loses the bite: it rests TECHNO.arc.stagger frames before it can rear back again (INTERRUPTED over it).
//   THE BOLT    the look of it (technoBolt, drawTechnoFx): ARC WARDEN's zap from your hand, and ARC SLINGER's jump from one creature to the next (a Gunslinger's card).
const TECHNO = {
    // the zap: its damage is `base` × `mult` (the gauntlet's punch and the arc's share of it, as they were: 14 × 1.3), the share more it hits for each relay online, how long a bite it cuts short keeps
    // the creature from rearing back again (frames; 0: it cuts nothing), how long a bolt is drawn (frames)
    arc: { base: 14, mult: 1.3, perRelay: 0.1, stagger: 30, fx: 16 },
};
const _tc = { fx: [] };   // fx: the bolts being drawn
function _tcFrame() { return typeof frame !== "undefined" ? frame : 0; }
function technoReset() { _tc.fx = []; }

// the relays online (js/stations.js), and what they add to the zap
function technoRelays() { const R = typeof _fp !== "undefined" && _fp && _fp.relays; if (!R) return 0; let n = 0; for (const id of Object.keys(R)) if (R[id] && R[id].online) n++; return n; }
function technoArcDamage() { return Math.round(TECHNO.arc.base * TECHNO.arc.mult * (1 + TECHNO.arc.perRelay * technoRelays()) * 10) / 10; }

// a bolt from `a` to `b` (the ARC SLINGER's jump, from a creature; ARC WARDEN's zap, from your hand: js/playercards.js)
function technoBolt(a, b, hand) { if (!a || !b) return; const f = _tcFrame(); _tc.fx.push({ t0: f, pts: [[a.x, a.y], [b.x, b.y]], seed: (f * 7919 + 17 + _tc.fx.length * 31) % 1000, low: !hand }); }
// one creature zapped: the damage, and a bite being wound up is cut short. A Technomancer's role (a Player card) makes it its element, for the triangle only (js/playercards.js playerHitElement)
function _tcZap(a, dmg) {
    const el = typeof playerHitElement === "function" ? playerHitElement("arc", "electric") : "electric", hit = typeof dmgArcHit === "function" ? dmgArcHit(el) : DMG_HIT_ARC;
    const src = { x: player.x, y: player.y, team: "green", element: el, isPlayer: true };
    if (typeof applyElementalDamage === "function") applyElementalDamage(a, dmg, src, el, hit); else applyDamage(a, dmg, src, el, false, false, hit);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#7ff2ff", radius: 0.6, life: 14 });
    if (!a.dead && TECHNO.arc.stagger > 0 && a.attackWindup > 0) {
        a.attackWindup = 0; a.biteTarget = null; a.attackAnim = 0; a.attackCooldown = Math.max(a.attackCooldown || 0, TECHNO.arc.stagger);
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "INTERRUPTED", color: "#7ff2ff", size: 12, life: 46, vy: -0.03 });
    }
}

// ── each step (js/game.js): the bolts fade ──
function technoTick() { if (_tc.fx.length) { const f = _tcFrame(); _tc.fx = _tc.fx.filter(z => f - z.t0 < TECHNO.arc.fx); } }

// ── drawing: the bolts, over the scene (js/game.js): a jagged bolt from point to point, flickering, fading ──
function _tcHash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return ((n >>> 0) % 1000) / 1000; }
function drawTechnoFx() {
    if (!_tc.fx.length || typeof ctx === "undefined" || typeof canvas === "undefined" || typeof _mxScr !== "function") return;
    const f = _tcFrame();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const z of _tc.fx) {
        const age = f - z.t0, k = Math.max(0, 1 - age / TECHNO.arc.fx), flick = Math.floor(f / 2);
        const P = z.pts.map((p, i) => { const s = _mxScr(p[0], p[1]); return [s[0], s[1] - (i === 0 && !z.low ? 46 : 30)]; });
        for (let i = 0; i + 1 < P.length; i++) {
            const [x0, y0] = P[i], [x1, y1] = P[i + 1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = Math.max(3, Math.min(9, Math.round(L / 22)));
            const path = [[x0, y0]]; for (let j = 1; j < n; j++) { const t = j / n, off = (_tcHash(z.seed * 131 + i * 17 + j * 7 + flick * 3) - 0.5) * Math.min(26, L * 0.22); path.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off]); } path.push([x1, y1]);
            const line = () => { ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]); for (let j = 1; j < path.length; j++) ctx.lineTo(path[j][0], path[j][1]); ctx.stroke(); };
            ctx.globalAlpha = 0.5 * k; ctx.strokeStyle = "#31e8ff"; ctx.lineWidth = 9 * k + 2; line();
            ctx.globalAlpha = k; ctx.strokeStyle = "#eaffff"; ctx.lineWidth = 2.5 * k + 1; line();
            if (age < 6) { ctx.globalAlpha = 1 - age / 6; ctx.fillStyle = "#eaffff"; ctx.beginPath(); ctx.arc(x1, y1, 5 + age * 2.5, 0, Math.PI * 2); ctx.fill(); }
        }
    }
    ctx.restore();
}
