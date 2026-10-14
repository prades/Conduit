// ─────────────────────────────────────────────────────────
//  EVOLUTION — a follower sheds the egg
// ─────────────────────────────────────────────────────────
// REPORTED: "give the followers evolutions … the followers shed their egg
// form, lose their shell and their legs, and become little drones or
// sentinels." From the design sheet: "the Reaver and the Bunker Bloom fit the
// vibe — make the Bunker Bloom an evolution of the fire brawler and the Reaver
// an evolution of the electric sniper." Asked: automatically at a level; a
// stat boost and a signature move.
//
//   WHEN   A FIRE BRAWLER or ELECTRIC SNIPER that reaches EVOLVE_LEVEL evolves
//          on the spot. It MOLTS (EVO_MOLT frames): the egg shakes and
//          cracks, the glass bursts and its legs drop, and the machine rises
//          out of it. It keeps that form for good: through death, the respawn
//          queue and a reload, and its role is fixed (a role switch skips it).
//   STATS  Health and power × EVOLVE_MULT, applied where a follower's stats
//          are derived (levels.js _applyFollowerLevel), so it survives every
//          level-up and recompute.
//   MOVES  BUNKER BLOOM, PETAL BLAZE: with an enemy within BLOOM_RADIUS, every
//          BLOOM_EVERY frames its petals fly open in a ring of fire that hits
//          everything round it (BLOOM_MULT × its power) and sets it burning.
//          REAVER, ARC VOLLEY: with an enemy within REAVER_RANGE, every
//          REAVER_EVERY frames it fans its blades and fires a charged arc
//          (REAVER_MULT × its power) that jumps to REAVER_CHAIN more enemies.
//          SERPENT (the flux sniper, design No. 15), SINGULARITY SHOT: with an
//          enemy within SERPENT_RANGE, every SERPENT_EVERY frames it rears up
//          and fires a gravity round (SERPENT_MULT × its power) that DRAGS every
//          enemy within SERPENT_PULL_R of the target in towards it and slows
//          them. A beetle, a boss or a machine is too heavy to drag
//          (vortexPullImmune) and takes the hit only.
//   LOOK   Baked from the 3D design models (design/evolutions/) into sprite
//          sheets in img/evo/: 8 facings × 16 frames (8 idle, 8 action),
//          seen from the game's own iso angle.

const EVOLVE_LEVEL = 20;
const EVOLVE_MULT  = 1.25;
const EVO_MOLT     = 120;          // frames: shake, burst, rise
const EVO_SCALE    = 96 / 144;     // a sheet cell (144 px, 3.4 world units) drawn at game size
const BLOOM_RADIUS = 1.8, BLOOM_EVERY = 360, BLOOM_MULT = 2.0, BLOOM_BURN = 180;
const REAVER_RANGE = 6, REAVER_EVERY = 300, REAVER_MULT = 2.5, REAVER_CHAIN = 2, REAVER_HOP = 2.5, REAVER_CHAIN_SHARE = 0.6;
const SERPENT_RANGE = 6.5, SERPENT_EVERY = 330, SERPENT_MULT = 2.2, SERPENT_PULL_R = 2.2, SERPENT_PULL = 0.75, SERPENT_SLOW = 0.5, SERPENT_SLOW_FRAMES = 90;
const EVO_ACT_FRAMES = 40;         // how long a signature move plays its action frames

const EVOLUTIONS = {
    bloom:  { id: "bloom",  name: "BUNKER BLOOM", element: "fire",     role: "brawler", move: "PETAL BLAZE", sheet: "img/evo/bloom.png",
              cell: 144, anchor: [72, 114.2], core: [72, 74.6] },
    reaver: { id: "reaver", name: "REAVER",       element: "electric", role: "sniper",  move: "ARC VOLLEY",  sheet: "img/evo/reaver.png",
              cell: 144, anchor: [72, 114.2], core: [72, 58.4] },
    // Its reactor is in its head, which moves with its facing: the sheet carries its own light.
    serpent:{ id: "serpent",name: "SERPENT",      element: "flux",     role: "sniper",  move: "SINGULARITY SHOT", sheet: "img/evo/serpent.png",
              cell: 144, anchor: [72, 114.2], core: [72, 61], noGlow: true, color: "#bb66ff" },
};
// Which egg grows into which machine.
function evolutionFor(f) {
    if (!f || !f.isFollower) return null;
    const role = f.role === "hybrid" ? "brawler" : f.role;
    for (const k in EVOLUTIONS) { const d = EVOLUTIONS[k]; if (d.element === f.element && d.role === role) return d; }
    return null;
}
function evolvedDef(f) { return f && f.evolved ? EVOLUTIONS[f.evolved] || null : null; }

// ── THE RULE ───────────────────────────────────────────────
// Evolve it now if it is due. True when it did.
function evoCheck(f) {
    if (!f || f.dead || !f.isFollower || f.evolved || f.team !== "green" || !((f.level || 0) >= EVOLVE_LEVEL)) return false;
    const d = evolutionFor(f);
    if (!d) return false;
    f.evolved = d.id;
    f._moltAt = typeof frame !== "undefined" ? frame : 0;
    f._sigCd = 90;
    if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(f, false);
    f.health = f.maxHealth;
    if (typeof floatingTexts !== "undefined")
        floatingTexts.push({ x: f.x, y: f.y - 1.4, text: "◆ EVOLVED · " + d.name, color: d.element === "fire" ? "#ffb066" : "#fff27a", life: 150, vy: -0.05, size: 13 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 4);
    return true;
}
// Once a step, from render(): evolve anyone due, and run the signature moves.
function evolutionTick() {
    if (typeof followers === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const f of followers) {
        if (!f || f.dead) continue;
        if (!f.evolved) { if (f0 % 30 === 0) evoCheck(f); continue; }
        const d = evolvedDef(f); if (!d) continue;
        if (f.role !== d.role) f.role = d.role;   // its role is fixed
        if (f0 - (f._moltAt || -1e9) < EVO_MOLT) continue;   // still coming out of the egg
        f._sigCd = (f._sigCd || 0) - 1;
        if (f._sigCd > 0) continue;
        if (d.id === "bloom") petalBlaze(f); else if (d.id === "reaver") arcVolley(f); else if (d.id === "serpent") singularityShot(f);
    }
}
function _evoFoes(x, y, r) {
    const near = typeof unitsNear === "function" ? unitsNear(x, r) : actors;
    return near.filter(a => a && !a.dead && typeof isHostileTarget === "function" && isHostileTarget(a) && Math.hypot(a.x - x, a.y - y) <= r);
}
// PETAL BLAZE: a ring of fire from the opened petals. True when it fired.
function petalBlaze(f) {
    const foes = _evoFoes(f.x, f.y, BLOOM_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * BLOOM_MULT, f, "fire");
        a.burning = Math.max(a.burning || 0, BLOOM_BURN); a.burnDamage = Math.max(a.burnDamage || 0, (f.power || 10) * 0.1);
    }
    f._sigAt = f0; f._sigCd = BLOOM_EVERY;
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "fireShockwave", x: f.x, y: f.y, radius: BLOOM_RADIUS, life: 36, maxLife: 36 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#ff6622", radius: BLOOM_RADIUS * 0.7, life: 26 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "PETAL BLAZE", color: "#ff8844", life: 50, vy: -0.06, size: 10 });
    return true;
}
// ARC VOLLEY: a charged arc into the nearest enemy in range, jumping on. True when it fired.
function arcVolley(f) {
    const foes = _evoFoes(f.x, f.y, REAVER_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const hits = [foes[0]], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(foes[0], (f.power || 10) * REAVER_MULT, f, "electric");
    let from = foes[0];
    for (let i = 0; i < REAVER_CHAIN; i++) {
        const next = _evoFoes(from.x, from.y, REAVER_HOP).filter(a => !hits.includes(a))
            .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
        if (!next) break;
        applyDamage(next, (f.power || 10) * REAVER_MULT * REAVER_CHAIN_SHARE, f, "electric");
        hits.push(next); from = next;
    }
    f._sigAt = f0; f._sigCd = REAVER_EVERY;
    f._arcPts = hits.map(a => ({ x: a.x, y: a.y })); f._arcUntil = f0 + 20;
    if (f.dirX !== undefined) { const dx = foes[0].x - f.x, dy = foes[0].y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") for (const a of hits) elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffee33", radius: 0.5, life: 18 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "ARC VOLLEY", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}

// SINGULARITY SHOT: a gravity round into the nearest enemy in range; whatever is
// round it is dragged in and slowed. True when it fired.
function singularityShot(f) {
    const foes = _evoFoes(f.x, f.y, SERPENT_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * SERPENT_MULT, f, "flux");
    let pulled = 0;
    for (const a of _evoFoes(tgt.x, tgt.y, SERPENT_PULL_R)) {
        if (typeof applySlow === "function") applySlow(a, SERPENT_SLOW_FRAMES, SERPENT_SLOW);
        if (a === tgt || (typeof vortexPullImmune === "function" && vortexPullImmune(a))) continue;
        a.x += (tgt.x - a.x) * SERPENT_PULL; a.y += (tgt.y - a.y) * SERPENT_PULL; pulled++;
    }
    f._sigAt = f0; f._sigCd = SERPENT_EVERY;
    f._arcPts = [{ x: tgt.x, y: tgt.y }]; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcCol = [187, 102, 255];
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: SERPENT_PULL_R, color: "#bb66ff", life: 40 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#bb66ff", radius: 0.7, life: 24 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "SINGULARITY", color: "#cc88ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// ── THE LOOK ───────────────────────────────────────────────
function _evoImg(d) {
    if (d._img !== undefined) return d._img && d._img.complete && d._img.naturalWidth ? d._img : null;
    d._img = null;
    if (typeof Image === "undefined") return null;
    const im = new Image();
    im.onload = () => { d._img = im; };
    im.src = d.sheet + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    d._img = im;
    return null;
}
function _evoFacing(f) {
    const a = Math.atan2(f.dirY || 0, f.dirX === undefined ? 1 : f.dirX);
    return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}
// Draw it, if it is an evolved follower out of (or coming out of) the egg.
// False: draw the egg as usual (before it has cracked open, or if the sheet
// has not loaded).
function drawEvolvedFollower(f, px, py, g) {
    const d = evolvedDef(f); if (!d) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0, m = f0 - (f._moltAt === undefined ? -1e9 : f._moltAt);
    if (m < EVO_MOLT * 0.3) return false;                 // still the egg, shaking (the overlay cracks it)
    const img = _evoImg(d); if (!img) return false;
    const u = Math.min(1, (m - EVO_MOLT * 0.3) / (EVO_MOLT * 0.7));   // rising out of the burst
    const rise = m < EVO_MOLT ? 1 - Math.pow(1 - u, 3) : 1;
    const col = d.element === "fire" ? "#ff5a1f" : d.element === "flux" ? "#bb66ff" : "#ffee33";
    g.save();
    // its shadow
    g.fillStyle = "rgba(0,0,0,0.4)"; g.beginPath(); g.ellipse(px, py, 22 * rise, 9 * rise, 0, 0, Math.PI * 2); g.fill();
    // the frame: action while it fights or has just used its move, else idle
    const sigK = f._sigAt !== undefined ? (f0 - f._sigAt) / EVO_ACT_FRAMES : 9;
    let col_ = Math.floor(f0 / 7) % 8;
    if (sigK >= 0 && sigK < 1) col_ = 8 + Math.min(7, Math.floor(sigK * 8));
    else if (f.state === "attack") col_ = 8 + Math.min(7, Math.floor(((f.attackAnim || 0) / Math.PI) * 8));
    const row = _evoFacing(f), C = d.cell, s = EVO_SCALE * (0.6 + 0.4 * rise);
    g.globalAlpha *= rise;
    g.drawImage(img, col_ * C, row * C, C, C, px - d.anchor[0] * s, py - d.anchor[1] * s, C * s, C * s);
    // the reactor's glow (not the serpent's: its reactor sits in its head, which turns with it)
    if (d.noGlow) { g.restore(); return true; }
    const cx = px + (d.core[0] - d.anchor[0]) * s, cy = py + (d.core[1] - d.anchor[1]) * s;
    const pulse = 0.55 + 0.25 * Math.sin(f0 * 0.12) + (sigK >= 0 && sigK < 1 ? 0.6 * (1 - sigK) : 0);
    g.globalCompositeOperation = "lighter";
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 16);
    gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = Math.min(1, 0.5 * pulse * rise); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
    g.restore();
    return true;
}
// Drawn over the follower: the egg cracking and bursting, and the Reaver's arcs.
function drawEvolvedOverlay(f, px, py, g) {
    const d = evolvedDef(f); if (!d) return;
    const f0 = typeof frame !== "undefined" ? frame : 0, m = f0 - (f._moltAt === undefined ? -1e9 : f._moltAt);
    g.save();
    if (m >= 0 && m < EVO_MOLT * 0.3) {          // cracks spreading over the glass
        const k = m / (EVO_MOLT * 0.3), n = Math.ceil(k * 6);
        const C = [[-3, -55, 2, -46, -1, -40], [6, -50, 3, -43, 7, -36], [-8, -44, -4, -38, -7, -31], [0, -57, 4, -52, 2, -47], [8, -42, 5, -36], [-5, -50, -9, -45]];
        g.strokeStyle = `rgba(255,255,255,${0.9 * k})`; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i < n; i++) { const c = C[i]; g.moveTo(px + c[0], py + c[1]); for (let j = 2; j < c.length; j += 2) g.lineTo(px + c[j], py + c[j + 1]); }
        g.stroke();
    } else if (m >= EVO_MOLT * 0.3 && m < EVO_MOLT) {   // the glass bursting and the legs falling
        const t = (m - EVO_MOLT * 0.3) / 60;
        for (let i = 0; i < 14; i++) {
            const a = i * 2.39996, v = 40 + (i % 5) * 14, x = px + Math.cos(a) * v * t, y = py - 42 + Math.sin(a) * v * 0.5 * t - 40 * t + 90 * t * t;
            const al = Math.max(0, 1 - t); if (al <= 0) continue;
            g.fillStyle = `rgba(210,232,255,${0.55 * al})`; g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 2.5, y + 2); g.lineTo(x - 2, y + 1.5); g.closePath(); g.fill();
        }
        g.strokeStyle = `rgba(8,8,8,${Math.max(0, 1 - t * 1.5)})`; g.lineWidth = 3; g.lineCap = "round"; g.beginPath();
        for (const [sx, ex] of [[-7, -16], [7, 16], [0, 2]]) { g.moveTo(px + sx, py - 28 + t * 30); g.lineTo(px + ex, py - 4 + t * 34); }
        g.stroke();
        if (t < 0.6) { g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - t / 0.6)})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(px, py - 40, 8 + t * 60, (8 + t * 60) * 0.45, 0, 0, Math.PI * 2); g.stroke(); }
    }
    // the Reaver's arc, from its reactor along the targets it hit
    if (f._arcUntil > f0 && f._arcPts && f._arcPts.length && typeof player !== "undefined") {
        const scr = p => [(p.x - player.visualX - (p.y - player.visualY)) * TILE_W + canvas.width / 2,
                          (p.x - player.visualX + (p.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - 26];
        const s = EVO_SCALE; let [x0, y0] = [px + (d.core[0] - d.anchor[0]) * s, py + (d.core[1] - d.anchor[1]) * s];
        const al = (f._arcUntil - f0) / 20;
        g.lineCap = "round"; g.lineJoin = "round";
        const RGB = f._arcCol || [255, 238, 51], jag = f._arcStraight ? 0 : 12;
        for (const p of f._arcPts) {
            const [x1, y1] = scr(p);
            for (const [w, c] of [[4, `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${0.35 * al})`], [1.6, `rgba(255,255,235,${al})`]]) {
                g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0);
                for (let k = 1; k < 6; k++) { const q = k / 6; g.lineTo(x0 + (x1 - x0) * q + (Math.random() - 0.5) * jag, y0 + (y1 - y0) * q + (Math.random() - 0.5) * jag); }
                g.lineTo(x1, y1); g.stroke();
            }
            x0 = x1; y0 = y1;
        }
    }
    g.restore();
}
