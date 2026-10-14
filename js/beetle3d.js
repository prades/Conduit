// ─────────────────────────────────────────────────────────
//  THE BEETLE, REBUILT — flat on the floor, and solid
// ─────────────────────────────────────────────────────────
// REPORTED: "I want to fix the way the beetles look; they aren't positioned
// correctly. Give them a rework cosmetically — a simple rotation so it looks
// flat as it walks, and make it look more 3D."
//
// The old beetle was the shared predator body: segments turned in the SCREEN
// plane by atan2(dirY, dirX) — a top-down sprite spun on the glass — and
// raised well above the point it stands on. On an isometric floor a beetle
// walking along world +x should point down-right at the floor's slant, and
// stand on its feet.
//
// This one is built in the beetle's own GROUND frame — f forward along its
// heading, s to its side, z up — and every point goes through the same
// projection the floor uses (iso: screen x = (wx − wy)·U, y = (wx + wy)·U/2).
// So it turns flat on the floor, foreshortened the way the tiles are. The
// shell is a dome: rings of the outline stacked up its height, darker below
// and lighter on top, an elytra seam down the middle and a gloss on the lit
// side; then the pronotum, the head and its horn. Six legs in a tripod gait,
// feet on the ground, a shadow under it all. The point (px, py) it is drawn
// at is where it stands.

const BEETLE_SHELL_RINGS = 5;     // stacked outlines up the shell (the dome)
const BEETLE_RING_PTS    = 18;    // points round each outline

function drawBeetle3D(actor, px, py, g) {
    g = g || ctx;
    const dim = actor.dimensions || { width: 26, height: 12 };
    const s = dim.width / 26;                        // 1 for a scout
    const U = 12 * s;                                // pixels per ground unit, along the floor's axes
    // Its heading on the floor (0 is a real component: walking straight along
    // world y is dirX = 0 — not "missing").
    let fx = Number.isFinite(actor.dirX) ? actor.dirX : 1, fy = Number.isFinite(actor.dirY) ? actor.dirY : 0;
    const fl = Math.hypot(fx, fy);
    if (fl < 1e-6) { fx = 1; fy = 0; } else { fx /= fl; fy /= fl; }
    // Leap (a scout's escape) lifts it bodily; the attack lunge rocks it forward.
    const lift = actor.leapLift || 0;
    const lunge = actor.state === "attack" ? Math.sin(actor.attackAnim || 0) * 0.18 : 0;
    const gx = px, gy = py - lift;
    // Ground frame → screen. f forward, sd to its left, z up (pixels × s).
    const P = (f, sd, z) => {
        const wx = (f + lunge) * fx - sd * fy, wy = (f + lunge) * fy + sd * fx;
        return [gx + (wx - wy) * U, gy + (wx + wy) * U * 0.5 - z * s];
    };
    const wc = actor.walkCycle || 0;
    const moving = actor.state !== "attack" && actor.state !== "idle";
    const isAlly = actor.team === "green" || actor.isClone;
    const accent = isAlly ? "#33ff99" : (actor.color || "#cc44ff");
    // Light from the upper left of the screen: which side of the body faces it.
    // Its left side (+sd) projects to screen direction (-fy - fx, ...); lit if
    // that points left/up.
    const leftLit = (-fy - fx) < 0 ? 1 : 0;

    g.save();
    if (actor.isNymph) g.globalAlpha = 0.38;
    if (actor.hitFlash > 0) g.globalAlpha *= 0.85;

    // ── Shadow on the floor ──
    g.fillStyle = "rgba(0,0,0,0.35)";
    _beetlePoly(g, _beetleRing(P, 0, 1.25, 0.8, lift > 0 ? 0 : 0).map(([x, y]) => [x, y + lift]));
    g.fill();

    // ── Depth: what is behind the body is drawn before it ──
    // A ground vector's screen-y is (wx + wy)/2: positive comes toward you.
    const headBehind = (fx + fy) < 0;                  // facing up the screen
    const nearSide = (fx - fy) >= 0 ? 1 : -1;          // the side whose legs are in front

    // ── Legs: three pairs, a tripod gait; feet on the floor ──
    const legs = (side) => {
        g.strokeStyle = "#151515"; g.lineCap = "round"; g.lineJoin = "round";
        g.lineWidth = Math.max(1.4, 2.2 * s);
        g.beginPath();
        [0.6, 0.0, -0.6].forEach((f0, i) => {
            const phase = (i % 2 === 0) === (side > 0) ? 0 : Math.PI;   // tripod
            const sw = moving ? Math.sin(wc * 0.9 + phase) : 0;
            const up = moving ? Math.max(0, Math.cos(wc * 0.9 + phase)) * 4 : 0;
            const [hx, hy] = P(f0, side * 0.66, 4);
            const [kx, ky] = P(f0 + sw * 0.18 + (i - 1) * -0.15, side * 1.1, 9 + up);
            const [tx, ty] = P(f0 + sw * 0.32 + (i - 1) * -0.35, side * 1.38, up * 0.5);
            g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(tx, ty);
        });
        g.stroke();
    };
    legs(-nearSide);                                   // the far side's, behind the body

    const shellF0 = -0.25, shellLen = 1.05, shellW = 0.72;
    const zLow = 5, zHigh = 15;
    const prF = shellF0 + shellLen + 0.18, hdF = prF + 0.42;
    const charge = actor.state === "attack" ? Math.sin(actor.attackAnim || 0) : 0;
    const head = () => {
        // Pronotum (the plate behind the head), then the head.
        g.fillStyle = "#1a1a1e";
        _beetlePoly(g, _beetleRing(P, prF, 0.32, 0.5, 8)); g.fill();
        g.fillStyle = "#2a2a30";
        _beetlePoly(g, _beetleRing(P, prF, 0.26, 0.42, 11)); g.fill();
        g.fillStyle = "#101012";
        _beetlePoly(g, _beetleRing(P, hdF, 0.2, 0.28, 8)); g.fill();
        // The horn, curving up and forward; the mandibles either side.
        g.strokeStyle = "#2b2b31"; g.lineWidth = Math.max(1.6, 2.6 * s);
        g.beginPath();
        const h0 = P(hdF + 0.1, 0, 10), h1 = P(hdF + 0.45 + charge * 0.15, 0, 16), h2 = P(hdF + 0.62 + charge * 0.2, 0, 22);
        g.moveTo(h0[0], h0[1]); g.quadraticCurveTo(h1[0], h1[1], h2[0], h2[1]); g.stroke();
        g.lineWidth = Math.max(1, 1.4 * s); g.beginPath();
        for (const side of [-1, 1]) {
            const m0 = P(hdF + 0.12, side * 0.16, 6), m1 = P(hdF + 0.38, side * (0.12 - charge * 0.05), 5);
            g.moveTo(m0[0], m0[1]); g.lineTo(m1[0], m1[1]);
        }
        g.stroke();
        // Eyes, in its colour.
        g.fillStyle = accent;
        for (const side of [-1, 1]) { const e = P(hdF + 0.08, side * 0.2, 10); g.beginPath(); g.arc(e[0], e[1], Math.max(1, 1.3 * s), 0, Math.PI * 2); g.fill(); }
    };
    if (headBehind) head();

    // ── The shell: a dome of stacked outlines ──
    for (let r = 0; r < BEETLE_SHELL_RINGS; r++) {
        const k = r / (BEETLE_SHELL_RINGS - 1);
        const z = zLow + (zHigh - zLow) * Math.sin(k * Math.PI / 2);
        const shrink = 1 - 0.38 * k * k;
        const v = Math.round(10 + 34 * k);            // darker below, lighter on top
        g.fillStyle = `rgb(${v},${v},${v + 4})`;
        _beetlePoly(g, _beetleRing(P, shellF0, shellLen * shrink, shellW * shrink, z));
        g.fill();
        if (r === 0) {
            // The rim at its base, in its colour (team, or species) — drawn
            // before the dome so the dome hides its far half.
            g.strokeStyle = accent; g.globalAlpha *= 0.6; g.lineWidth = Math.max(1, 1.3 * s);
            _beetlePoly(g, _beetleRing(P, shellF0, shellLen, shellW, zLow)); g.stroke();
            g.globalAlpha /= 0.6;
        }
    }
    // The elytra seam, over the crown of the dome from front to back.
    g.strokeStyle = "rgba(0,0,0,0.7)"; g.lineWidth = Math.max(1, 1.1 * s);
    g.beginPath();
    for (let i = 0; i <= 10; i++) {
        const u = 0.62 - 1.55 * i / 10;                // from near the front to the tail
        const h = zLow + (zHigh - zLow) * Math.sqrt(Math.max(0, 1 - u * u)) + 0.4;
        const q = P(shellF0 + shellLen * u, 0, h);
        if (i === 0) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]);
    }
    g.stroke();
    // Gloss on the lit half.
    g.fillStyle = "rgba(210,220,255,0.16)";
    _beetlePoly(g, _beetleRing(P, shellF0 + 0.1, shellLen * 0.45, shellW * 0.22, zHigh + 0.5, leftLit ? 0.32 : -0.32));
    g.fill();

    if (!headBehind) head();
    legs(nearSide);                                    // the near side's, in front

    // ── Elite: a ring round it; a boss: its aura ──
    if (actor.isElite && !actor.isNymph) {
        g.globalAlpha = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin((actor.animationPhase || 0) + (frame || 0) * 0.07));
        g.strokeStyle = actor.color || "#ff8800"; g.lineWidth = 2;
        _beetlePoly(g, _beetleRing(P, -0.1, 1.9, 1.35, 1)); g.stroke();
        g.globalAlpha = 1;
    }
    if ((actor.isBoss || actor.shieldAura) && (actor.team !== "green" || actor.isClone)) {
        const auraR = (actor.shieldAuraRadius || 5) * TILE_W * 0.5;
        g.globalAlpha = 0.12 + 0.08 * (0.5 + 0.5 * Math.sin((actor.shieldAuraPulse || 0) * 0.1));
        g.strokeStyle = "#aaddff"; g.lineWidth = 3;
        g.beginPath(); g.ellipse(gx, gy, auraR, auraR * 0.5, 0, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
    }
    g.restore();
}

// An outline in the ground frame: an ellipse centred f0 along the heading,
// half-length L forward, half-width W to the sides, at height z (offset `so`
// to one side, for the gloss).
function _beetleRing(P, f0, L, W, z, so) {
    const out = [];
    for (let i = 0; i < BEETLE_RING_PTS; i++) {
        const t = i / BEETLE_RING_PTS * Math.PI * 2;
        // A beetle is blunt at the front and rounder behind: squash the front.
        const c = Math.cos(t), sn = Math.sin(t);
        const f = f0 + L * (c > 0 ? c * 0.85 : c);
        out.push(P(f, (so || 0) + W * sn, z));
    }
    return out;
}
function _beetlePoly(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
}
