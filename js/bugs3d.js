// ─────────────────────────────────────────────────────────
//  THE PREDATORS, REBUILT — every species on the floor, like the beetle
// ─────────────────────────────────────────────────────────
// REPORTED: "Make the predators on the map — the actual enemies — the new form
// of beetle, and create the upgraded ants and all the other predator species
// as well."
//
// The beetle (js/beetle3d.js) is built in its own GROUND frame — f forward
// along its heading, sd to its side, z up — and every point goes through the
// projection the floor uses. This file is the same idea as a kit, and the
// other five bodies built with it:
//
//   ANT       head, thorax, a waist node and a big banded gaster; elbowed
//             antennae and chomping mandibles; six legs in a tripod gait.
//             Tanks and bosses are soldiers — a bigger head and jaws.
//   SCORPION  low and flat: a carapace, plated back, eight legs, pincers that
//             snap, and a segmented tail arched over its back to the sting —
//             which strikes forward when it attacks.
//   SPIDER    a round abdomen held high with its mark on it, eight long legs
//             with high knees, a cluster of eyes, fangs and palps.
//   MANTIS    a long abdomen under folded wings, a raised neck, a triangular
//             head with big eyes, and the raptorial forelegs folded in prayer
//             — they shoot forward when it strikes. Four walking legs.
//   MOTH      it flies: the body hovers over its shadow, four wings beating
//             with eyespots on them, feathered antennae.
//
// Synthetic species (js/predator_randomizer.js) wear the body of the species
// they were modded from (bodyStyle). Every body stands on its point (px, py);
// drawBug3D returns how high it reaches so the bars go just over it.

// Reference width (its scout's) per body: s = 1 at that width.
const BUG_REF_WIDTH = { ant: 22, beetle: 26, scorpion: 30, spider: 22, mantis: 20, moth: 22 };
const BUG_RING_PTS  = 16;
// A dome of stacked outlines: [height fraction, outline scale]; the first is
// the underside (it shows below the widest ring from this camera).
const BUG_DOME      = [[-0.55, 0.83], [0, 1], [0.45, 0.89], [0.72, 0.69], [0.9, 0.44], [1, 0.16]];
const BUG_DOME_LITE = [[-0.5, 0.85], [0, 1], [0.6, 0.8], [0.92, 0.4]];

// Which rebuilt body an actor wears, or null (the old renderer draws it).
function bugBodyStyle(a) {
    if (!a || a.isMachine) return null;
    const sp = a.speciesName;
    if (BUG_REF_WIDTH[sp]) return sp;
    const syn = typeof SYNTHETIC_SPECIES !== "undefined" && SYNTHETIC_SPECIES ? SYNTHETIC_SPECIES[sp] : null;
    return syn && BUG_REF_WIDTH[syn.bodyStyle] ? syn.bodyStyle : null;
}

// Draw it; returns its height on screen in pixels (for the bars over it).
function drawBug3D(actor, px, py, g, style) {
    g = g || ctx;
    style = style || bugBodyStyle(actor);
    const ref = BUG_REF_WIDTH[style] || 22;
    const s = (actor.dimensions ? actor.dimensions.width : ref) / ref;
    if (style === "beetle" || !BUG_MODELS[style]) { drawBeetle3D(actor, px, py, g); return 25 * (actor.dimensions ? actor.dimensions.width : 26) / 26; }
    const F = _bugFrame(actor, px, py, s, style === "mantis" ? 0.06 : 0.16);
    g.save();
    if (actor.isNymph) g.globalAlpha = 0.38;
    if (actor.hitFlash > 0) g.globalAlpha *= 0.85;
    const m = BUG_MODELS[style](actor, g, F);
    _bugAuras(actor, g, F, m.ring);
    g.restore();
    return m.top * s;
}

// ── The frame: heading, scale, and ground → screen ─────────
function _bugFrame(actor, px, py, s, lungeK) {
    const U = 12 * s;
    let fx = Number.isFinite(actor.dirX) ? actor.dirX : 1, fy = Number.isFinite(actor.dirY) ? actor.dirY : 0;
    const fl = Math.hypot(fx, fy);
    if (fl < 1e-6) { fx = 1; fy = 0; } else { fx /= fl; fy /= fl; }
    const lift = actor.leapLift || 0;
    const atk = actor.state === "attack" ? Math.sin(actor.attackAnim || 0) : 0;
    const lunge = atk * lungeK;
    const gx = px, gy = py - lift;
    const P = (f, sd, z) => {
        const wx = (f + lunge) * fx - sd * fy, wy = (f + lunge) * fy + sd * fx;
        return [gx + (wx - wy) * U, gy + (wx + wy) * U * 0.5 - z * s];
    };
    const isAlly = actor.team === "green" || actor.isClone;
    return {
        P, s, U, fx, fy, lift, atk, gx, gy,
        wc: actor.walkCycle || 0,
        moving: actor.state !== "attack" && actor.state !== "idle",
        t: (typeof frame !== "undefined" ? frame : 0) + (actor.animationPhase || 0) * 20,
        accent: isAlly ? "#33ff99" : (actor.color || "#cc44ff"),
        tint: actor.color || "#888888",
        leftLit: (-fy - fx) < 0,                      // its left (+sd) faces the light
        headBehind: (fx + fy) < 0,                    // facing up the screen
        nearSide: (fx - fy) >= 0 ? 1 : -1,            // the side whose legs are in front
    };
}

// ── Primitives ───────────────────────────────────────────
// An outline in the ground frame: centred f0 along the heading, half-length L,
// half-width W, at height z; `so` shifts it to one side, `fr` squashes the front.
function _bugRing(P, f0, L, W, z, so, fr) {
    const out = [], n = BUG_RING_PTS;
    for (let i = 0; i < n; i++) {
        const t = i / n * Math.PI * 2, c = Math.cos(t);
        out.push(P(f0 + L * (c > 0 && fr ? c * fr : c), (so || 0) + W * Math.sin(t), z));
    }
    return out;
}
function _bugPoly(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
}
function _bugLine(g, pts) {
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
}
// Chitin: dark, lighter toward the top, with a little of its species' colour.
const _bugShadeCache = new Map();
function _bugShade(tint, k) {
    const key = tint + "|" + k;
    let c = _bugShadeCache.get(key);
    if (c) return c;
    const n = parseInt(String(tint).slice(1, 7), 16) || 0x888888;
    const v = 9 + 40 * (k + 0.55) / 1.55, m = 0.16;
    const r = Math.round(v + ((n >> 16 & 255) - v) * m), gg = Math.round(v + ((n >> 8 & 255) - v) * m), b = Math.round(v + 3 + ((n & 255) - v) * m);
    c = `rgb(${r},${gg},${b})`;
    _bugShadeCache.set(key, c);
    return c;
}
// A body part: an ellipsoid of stacked outlines. o.rim strokes its widest ring
// in its accent; o.gloss puts a shine on the lit side; o.lite uses fewer rings.
function _bugBlob(g, F, f0, L, W, z0, rz, o) {
    o = o || {};
    const dome = o.lite ? BUG_DOME_LITE : BUG_DOME, so = o.so || 0;
    for (let i = 0; i < dome.length; i++) {
        const k = dome[i][0], sc = dome[i][1];
        g.fillStyle = o.color || _bugShade(F.tint, k);
        _bugPoly(g, _bugRing(F.P, f0, L * sc, W * sc, z0 + rz * k, so, o.fr)); g.fill();
        if (k === 0 && o.rim) {
            g.strokeStyle = F.accent; g.globalAlpha *= 0.6; g.lineWidth = Math.max(1, 1.2 * F.s);
            _bugPoly(g, _bugRing(F.P, f0, L, W, z0, so, o.fr)); g.stroke();
            g.globalAlpha /= 0.6;
        }
    }
    if (o.gloss) {
        g.fillStyle = "rgba(210,220,255,0.15)";
        _bugPoly(g, _bugRing(F.P, f0 + L * 0.1, L * 0.42, W * 0.22, z0 + rz * 0.93, so + (F.leftLit ? 1 : -1) * W * 0.32));
        g.fill();
    }
}
// Bands across a part (a gaster's segments), following its surface.
function _bugBands(g, F, f0, L, W, z0, rz, at) {
    g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = Math.max(0.8, 0.9 * F.s);
    g.beginPath();
    for (const fa of at) {
        const u = (fa - f0) / L, w = W * Math.sqrt(Math.max(0, 1 - u * u)) * 0.95, pts = [];
        for (let j = 0; j <= 6; j++) {
            const sd = -w + 2 * w * j / 6, q = 1 - u * u - (sd / W) * (sd / W);
            pts.push(F.P(fa, sd, z0 + rz * Math.sqrt(Math.max(0, q)) + 0.3));
        }
        _bugLine(g, pts);
    }
    g.stroke();
}
// One side's legs, one path: hip → knee → (ankle →) foot on the floor, in an
// alternating gait. Each leg: f (where on the body), hs/hz (hip), kf/ks/kz
// (knee), af/as/az (ankle, optional), tf/ts (foot).
function _bugLegs(g, F, side, legs, o) {
    const P = F.P;
    g.strokeStyle = o.color || "#141416"; g.lineCap = "round"; g.lineJoin = "round";
    g.lineWidth = Math.max(1, o.w * F.s);
    g.beginPath();
    for (let i = 0; i < legs.length; i++) {
        const L = legs[i];
        const a = F.wc * o.speed + ((i % 2 === 0) === (side > 0) ? 0 : Math.PI);
        const sw = F.moving ? Math.sin(a) : 0, up = F.moving ? Math.max(0, Math.cos(a)) * o.lift : 0;
        const pts = [P(L.f, side * L.hs, L.hz), P(L.f + L.kf + sw * o.stride * 0.5, side * L.ks, L.kz + up)];
        if (L.az !== undefined) pts.push(P(L.f + L.af + sw * o.stride * 0.85, side * L.as, L.az + up * 0.7));
        pts.push(P(L.f + L.tf + sw * o.stride, side * L.ts, up * 0.5));
        _bugLine(g, pts);
    }
    g.stroke();
}
// Its shadow on the floor (under a leap, still on the floor).
function _bugShadow(g, F, f0, L, W, alpha) {
    g.fillStyle = `rgba(0,0,0,${alpha || 0.35})`;
    _bugPoly(g, _bugRing(F.P, f0, L, W, 0).map(([x, y]) => [x, y + F.lift])); g.fill();
}
// Parts drawn back to front: a part further along the heading is nearer the
// viewer when it faces down the screen.
function _bugParts(F, parts) {
    const d = F.fx + F.fy;
    parts.sort((a, b) => a[0] * d - b[0] * d);
    for (const p of parts) p[1]();
}
function _bugEyes(g, F, pts, r) {
    g.fillStyle = F.accent;
    for (const e of pts) { g.beginPath(); g.arc(e[0], e[1], Math.max(0.8, r * F.s), 0, Math.PI * 2); g.fill(); }
}
// Elite ring and boss aura, round its footprint `ring` = [f0, L, W].
function _bugAuras(actor, g, F, ring) {
    if (actor.isElite && !actor.isNymph) {
        g.globalAlpha = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin((actor.animationPhase || 0) + (typeof frame !== "undefined" ? frame : 0) * 0.07));
        g.strokeStyle = actor.color || "#ff8800"; g.lineWidth = 2;
        _bugPoly(g, _bugRing(F.P, ring[0], ring[1] * 1.5, ring[2] * 1.6, 1)); g.stroke();
        g.globalAlpha = 1;
    }
    if ((actor.isBoss || actor.shieldAura) && (actor.team !== "green" || actor.isClone)) {
        const auraR = (actor.shieldAuraRadius || 5) * TILE_W * 0.5;
        g.globalAlpha = 0.12 + 0.08 * (0.5 + 0.5 * Math.sin((actor.shieldAuraPulse || 0) * 0.1));
        g.strokeStyle = "#aaddff"; g.lineWidth = 3;
        g.beginPath(); g.ellipse(F.gx, F.gy, auraR, auraR * 0.5, 0, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
    }
}

// ── THE ANT ──────────────────────────────────────────────
const ANT_LEGS = [
    { f: 0.2,  hs: 0.13, hz: 6, kf: 0.2,   ks: 0.62, kz: 12, tf: 0.62,  ts: 0.92 },
    { f: 0.05, hs: 0.15, hz: 6, kf: 0,     ks: 0.7,  kz: 12, tf: 0.02,  ts: 1.02 },
    { f: -0.1, hs: 0.13, hz: 6, kf: -0.25, ks: 0.66, kz: 12, tf: -0.72, ts: 0.95 },
];
function _drawAnt3D(actor, g, F) {
    const P = F.P, s = F.s;
    const soldier = actor.className === "tank" || actor.className === "boss";
    const hsz = soldier ? 1.3 : 1;
    const hf = 0.36 + 0.22 * hsz, hL = 0.22 * hsz, hW = 0.25 * hsz, hz = 9, hr = 3.5 * hsz;
    _bugShadow(g, F, -0.35, 1.3, 0.6);
    _bugLegs(g, F, -F.nearSide, ANT_LEGS, { w: 1.6, speed: 0.9, stride: 0.36, lift: 4 });
    const chomp = (F.atk ? Math.sin(F.wc * 0.4 + (typeof frame !== "undefined" ? frame : 0) * 0.5) : Math.sin(F.wc * 0.1) * 0.3) * 0.08;
    const jaws = () => {
        g.strokeStyle = "#202024"; g.lineCap = "round"; g.lineWidth = Math.max(1, 1.6 * s * hsz);
        g.beginPath();
        for (const side of [-1, 1]) {
            _bugLine(g, [P(hf + hL * 0.8, side * 0.1 * hsz, 8), P(hf + hL + 0.14 * hsz, side * (0.2 * hsz - chomp), 7),
                         P(hf + hL + 0.3 * hsz, side * (0.05 + chomp * 0.5), 7)]);
        }
        g.stroke();
    };
    const head = () => {
        if (F.headBehind) jaws();
        _bugBlob(g, F, hf, hL, hW, hz, hr, { fr: 0.9 });
        if (!F.headBehind) jaws();
        _bugEyes(g, F, [P(hf + hL * 0.25, hW * 0.85, hz + hr * 0.4), P(hf + hL * 0.25, -hW * 0.85, hz + hr * 0.4)], 1.1 * hsz);
        // Elbowed antennae, feeling the air.
        g.strokeStyle = "#1c1c20"; g.lineWidth = Math.max(0.8, 1 * s);
        g.beginPath();
        for (const side of [-1, 1]) {
            const sway = Math.sin(F.t * 0.12 + side) * 2;
            _bugLine(g, [P(hf + hL * 0.6, side * 0.09, hz + hr * 0.6), P(hf + hL * 0.6 + 0.12, side * 0.34, 17 + sway),
                         P(hf + hL + 0.45, side * 0.3, 11 - sway)]);
        }
        g.stroke();
    };
    _bugParts(F, [
        [-0.92, () => { _bugBlob(g, F, -0.92, 0.55, 0.42, 8, 5.5, { rim: true, gloss: true }); _bugBands(g, F, -0.92, 0.55, 0.42, 8, 5.5, [-0.72, -1.02]); }],
        [-0.36, () => _bugBlob(g, F, -0.36, 0.1, 0.09, 7, 3, { lite: true })],
        [0.02,  () => _bugBlob(g, F, 0.02, 0.34, 0.2, 8, 3.5, { lite: true })],
        [hf,    head],
    ]);
    _bugLegs(g, F, F.nearSide, ANT_LEGS, { w: 1.6, speed: 0.9, stride: 0.36, lift: 4 });
    return { top: 22, ring: [-0.35, 1.3, 0.6] };
}

// ── THE SCORPION ─────────────────────────────────────────
const SCORPION_LEGS = [
    { f: 0.42,  hs: 0.3,  hz: 4, kf: 0.15,  ks: 0.78, kz: 10, tf: 0.42,  ts: 1.05 },
    { f: 0.24,  hs: 0.33, hz: 4, kf: 0.03,  ks: 0.85, kz: 10, tf: 0.12,  ts: 1.15 },
    { f: 0.04,  hs: 0.33, hz: 4, kf: -0.08, ks: 0.85, kz: 10, tf: -0.2,  ts: 1.15 },
    { f: -0.16, hs: 0.3,  hz: 4, kf: -0.2,  ks: 0.78, kz: 10, tf: -0.55, ts: 1.05 },
];
const SCORPION_TAIL = [[0.28, 0.35], [0.28, 0.95], [0.28, 1.55], [0.28, 2.15], [0.24, 2.7]];   // [length, angle up from backward]
function _drawScorpion3D(actor, g, F) {
    const P = F.P, s = F.s;
    _bugShadow(g, F, -0.3, 1.4, 0.75);
    _bugLegs(g, F, -F.nearSide, SCORPION_LEGS, { w: 1.5, speed: 1.0, stride: 0.26, lift: 3 });
    // The tail, from the back of the plates, up and over; it strikes forward.
    const strike = Math.max(0, F.atk), sway = Math.sin(F.t * 0.05) * 0.08;
    let tf = -0.88, tz = 0.5;
    const pts = [[tf, tz]];
    SCORPION_TAIL.forEach(([len, th], i) => {
        const a = th + sway * i * 0.4 + strike * i * 0.16;
        tf -= Math.cos(a) * len; tz += Math.sin(a) * len;
        pts.push([tf, tz]);
    });
    const lastA = SCORPION_TAIL[4][1] + strike * 0.64 + 0.5;
    const tail = (from) => {
        g.lineCap = "round";
        for (let i = Math.max(0, from); i < pts.length - 1; i++) {
            const a = P(pts[i][0], 0, pts[i][1] * 12), b = P(pts[i + 1][0], 0, pts[i + 1][1] * 12);
            g.strokeStyle = "#151518"; g.lineWidth = Math.max(1.6, (5.4 - i * 0.55) * s);
            g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
            g.strokeStyle = _bugShade(F.tint, 0.9); g.lineWidth = Math.max(0.6, 1.1 * s);
            g.beginPath(); g.moveTo(a[0], a[1] - 1.2 * s); g.lineTo(b[0], b[1] - 1.2 * s); g.stroke();
        }
        // The vesicle and its sting, in its colour.
        const e = pts[pts.length - 1], v = P(e[0], 0, e[1] * 12);
        g.fillStyle = "#1b1b1f"; g.beginPath(); g.ellipse(v[0], v[1], 2.8 * s, 2.2 * s, 0, 0, Math.PI * 2); g.fill();
        const st = P(e[0] + Math.cos(lastA) * -0.22, 0, (e[1] + Math.sin(lastA) * 0.22) * 12);
        g.strokeStyle = F.accent; g.lineWidth = Math.max(1, 1.4 * s);
        g.beginPath(); g.moveTo(v[0], v[1]); g.lineTo(st[0], st[1]); g.stroke();
    };
    // Pincers: arm, a claw on the end, its fingers snapping.
    const open = F.atk ? Math.abs(Math.sin((actor.attackAnim || 0) * 2)) : 0.35 + 0.25 * Math.sin(F.t * 0.06);
    const pincers = () => {
        for (const side of [F.headBehind ? 1 : -1, F.headBehind ? -1 : 1]) {
            g.strokeStyle = "#151518"; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = Math.max(1.2, 2.2 * s);
            g.beginPath(); _bugLine(g, [P(0.55, side * 0.26, 5), P(0.82, side * 0.6, 7), P(1.05, side * 0.5, 6)]); g.stroke();
            _bugBlob(g, F, 1.18, 0.2, 0.13, 6, 3, { lite: true, so: side * 0.46 });
            g.lineWidth = Math.max(1, 1.4 * s); g.strokeStyle = "#202024";
            g.beginPath();
            _bugLine(g, [P(1.3, side * 0.44, 6), P(1.5, side * 0.41, 6)]);
            _bugLine(g, [P(1.28, side * 0.5, 6), P(1.48, side * (0.5 + open * 0.08), 6)]);
            g.stroke();
        }
    };
    const back = () => {
        [[0.0, 0.44], [-0.25, 0.46], [-0.5, 0.42], [-0.74, 0.34]].sort((a, b) => (a[0] - b[0]) * (F.fx + F.fy))
            .forEach(([f, w], i) => _bugBlob(g, F, f, 0.17, w, 5, 3.2, { lite: true, rim: f === -0.25 }));
    };
    const carapace = () => {
        _bugBlob(g, F, 0.32, 0.36, 0.36, 5, 3, { fr: 0.8, gloss: true });
        _bugEyes(g, F, [P(0.45, 0.07, 8.2), P(0.45, -0.07, 8.2)], 1);
    };
    // The tail is behind it when it faces you: what rises over its back is
    // drawn again after the body, so the body never hides it.
    if (!F.headBehind) tail(0);
    _bugParts(F, [[-0.4, back], [0.32, carapace], [1.1, pincers]]);
    if (F.headBehind) tail(0); else tail(2);
    _bugLegs(g, F, F.nearSide, SCORPION_LEGS, { w: 1.5, speed: 1.0, stride: 0.26, lift: 3 });
    return { top: 30, ring: [-0.35, 1.5, 0.85] };
}

// ── THE SPIDER ───────────────────────────────────────────
const SPIDER_LEGS = [
    { f: 0.34, hs: 0.2,  hz: 9, kf: 0.45,  ks: 0.85, kz: 20, af: 0.95,  as: 1.15, az: 7, tf: 1.1,   ts: 1.25 },
    { f: 0.24, hs: 0.24, hz: 9, kf: 0.18,  ks: 1.05, kz: 21, af: 0.38,  as: 1.45, az: 7, tf: 0.42,  ts: 1.6 },
    { f: 0.12, hs: 0.24, hz: 9, kf: -0.18, ks: 1.05, kz: 21, af: -0.38, as: 1.45, az: 7, tf: -0.42, ts: 1.6 },
    { f: 0.02, hs: 0.2,  hz: 9, kf: -0.45, ks: 0.88, kz: 20, af: -0.95, as: 1.15, az: 7, tf: -1.15, ts: 1.3 },
];
function _drawSpider3D(actor, g, F) {
    const P = F.P, s = F.s;
    _bugShadow(g, F, -0.2, 1.2, 0.9);
    const LO = { w: 1.5, speed: 0.7, stride: 0.3, lift: 5, color: "#121214" };
    _bugLegs(g, F, -F.nearSide, SPIDER_LEGS, LO);
    const abdomen = () => {
        _bugBlob(g, F, -0.62, 0.52, 0.46, 13, 8, { rim: true, gloss: true });
        // Its mark, in its colour, on the top.
        g.fillStyle = F.accent; g.globalAlpha *= 0.8;
        _bugPoly(g, [P(-0.42, 0, 19.6), P(-0.58, 0.09, 20.6), P(-0.62, 0, 20.4), P(-0.66, 0.09, 20.6), P(-0.84, 0, 19.4), P(-0.66, -0.09, 20.6), P(-0.62, 0, 20.4), P(-0.58, -0.09, 20.6)]);
        g.fill(); g.globalAlpha /= 0.8;
        g.fillStyle = "#18181c";
        for (const side of [-1, 1]) { const q = P(-1.12, side * 0.05, 11); g.beginPath(); g.arc(q[0], q[1], Math.max(0.8, 1.2 * s), 0, Math.PI * 2); g.fill(); }
    };
    const bite = F.atk ? Math.max(0, F.atk) : 0;
    const front = () => {
        const mouth = () => {
            g.strokeStyle = "#1c1c20"; g.lineCap = "round"; g.lineJoin = "round";
            g.lineWidth = Math.max(1, 1.4 * s); g.beginPath();
            for (const side of [-1, 1]) _bugLine(g, [P(0.42, side * 0.14, 9), P(0.62, side * 0.24, 11), P(0.72, side * 0.2, 4)]);
            g.stroke();
            g.lineWidth = Math.max(1.2, 2.4 * s); g.beginPath();
            for (const side of [-1, 1]) _bugLine(g, [P(0.45, side * 0.06, 10), P(0.56 + bite * 0.08, side * (0.05 + bite * 0.06), 5), P(0.54 + bite * 0.1, side * 0.01, 2)]);
            g.stroke();
        };
        if (F.headBehind) mouth();
        _bugBlob(g, F, 0.2, 0.3, 0.28, 10, 4.5, { fr: 0.85, gloss: true });
        if (!F.headBehind) mouth();
        _bugEyes(g, F, [P(0.44, 0.06, 14), P(0.44, -0.06, 14)], 1.3);
        _bugEyes(g, F, [P(0.38, 0.14, 15.5), P(0.38, -0.14, 15.5), P(0.32, 0.08, 16.5), P(0.32, -0.08, 16.5)], 0.75);
    };
    _bugParts(F, [[-0.62, abdomen], [0.2, front]]);
    _bugLegs(g, F, F.nearSide, SPIDER_LEGS, LO);
    return { top: 30, ring: [-0.2, 1.3, 1.0] };
}

// ── THE MANTIS ───────────────────────────────────────────
const MANTIS_LEGS = [
    { f: 0.12,  hs: 0.12, hz: 10, kf: 0.2,  ks: 0.62, kz: 19, tf: 0.55,  ts: 0.85 },
    { f: -0.04, hs: 0.12, hz: 10, kf: -0.3, ks: 0.68, kz: 19, tf: -0.95, ts: 0.9 },
];
function _drawMantis3D(actor, g, F) {
    const P = F.P, s = F.s, ht = 25;
    _bugShadow(g, F, -0.4, 1.4, 0.6);
    const LO = { w: 1.3, speed: 0.8, stride: 0.28, lift: 4 };
    _bugLegs(g, F, -F.nearSide, MANTIS_LEGS, LO);
    // The raptorial forelegs: folded in prayer, or shot forward in the strike.
    const k = Math.max(0, F.atk);
    const lerp = (a, b) => a + (b - a) * k;
    const foreleg = (side) => {
        const sh = P(0.55, side * 0.1, 21);
        const el = P(lerp(0.82, 1.0), side * lerp(0.2, 0.18), lerp(12, 22));
        const tp = P(lerp(0.7, 1.55), side * lerp(0.16, 0.1), lerp(22, 16));
        g.strokeStyle = "#141417"; g.lineCap = "round"; g.lineJoin = "round";
        g.lineWidth = Math.max(1.2, 2.4 * s); g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(el[0], el[1]); g.stroke();
        g.lineWidth = Math.max(1, 1.6 * s); g.beginPath(); g.moveTo(el[0], el[1]); g.lineTo(tp[0], tp[1]); g.stroke();
        // Spines along the femur.
        g.lineWidth = Math.max(0.6, 0.8 * s); g.beginPath();
        for (let i = 1; i <= 3; i++) {
            const u = i / 4, x = sh[0] + (el[0] - sh[0]) * u, y = sh[1] + (el[1] - sh[1]) * u;
            g.moveTo(x, y); g.lineTo(x + (tp[0] - el[0]) * 0.12, y + (tp[1] - el[1]) * 0.12);
        }
        g.stroke();
    };
    const neck = () => {
        const a = P(0.12, 0, 13), b = P(0.62, 0, ht - 1);
        g.strokeStyle = "#141416"; g.lineCap = "round"; g.lineWidth = Math.max(1.6, 3.4 * s);
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        g.strokeStyle = _bugShade(F.tint, 0.9); g.lineWidth = Math.max(0.6, 1 * s);
        g.beginPath(); g.moveTo(a[0], a[1] - 1.2 * s); g.lineTo(b[0], b[1] - 1.2 * s); g.stroke();
    };
    const head = () => {
        g.fillStyle = "#18181b";
        _bugPoly(g, [P(0.62, 0, ht + 5), P(0.7, 0.24, ht + 3), P(0.88, 0, ht - 4), P(0.7, -0.24, ht + 3)]); g.fill();
        g.strokeStyle = _bugShade(F.tint, 0.7); g.lineWidth = Math.max(0.6, 0.8 * s); g.stroke();
        _bugEyes(g, F, [P(0.7, 0.24, ht + 3), P(0.7, -0.24, ht + 3)], 1.8);
        g.strokeStyle = "#1c1c20"; g.lineWidth = Math.max(0.7, 0.9 * s); g.beginPath();
        for (const side of [-1, 1]) {
            const sway = Math.sin(F.t * 0.09 + side * 1.3) * 2;
            _bugLine(g, [P(0.7, side * 0.06, ht + 4), P(0.88, side * 0.2, ht + 12 + sway), P(1.08, side * 0.34, ht + 15 - sway)]);
        }
        g.stroke();
    };
    const fore = () => {
        foreleg(-F.nearSide);
        if (F.headBehind) { head(); neck(); } else { neck(); head(); }
        foreleg(F.nearSide);
    };
    const back = () => {
        _bugBlob(g, F, -1.25, 0.25, 0.15, 13, 2.8, { lite: true });
        _bugBlob(g, F, -0.72, 0.6, 0.22, 11, 3.5, { rim: true });
        _bugBands(g, F, -0.72, 0.6, 0.22, 11, 3.5, [-0.4, -0.7, -1.0]);
        // Folded wings over the abdomen.
        g.fillStyle = _bugShade(F.tint, 0.3); g.globalAlpha *= 0.85;
        for (const side of [-1, 1]) { _bugPoly(g, [P(-0.05, 0, 15), P(-0.55, side * 0.24, 15), P(-1.2, side * 0.08, 14.5), P(-1.3, 0, 14.5)]); g.fill(); }
        g.globalAlpha /= 0.85;
        g.strokeStyle = F.accent; g.globalAlpha *= 0.4; g.lineWidth = Math.max(0.6, 0.8 * s);
        g.beginPath(); _bugLine(g, [P(-0.05, 0, 15.2), P(-1.3, 0, 14.7)]); g.stroke();
        g.globalAlpha /= 0.4;
    };
    _bugParts(F, [
        [-0.8, back],
        [0.05, () => _bugBlob(g, F, 0.05, 0.18, 0.14, 11, 3, { lite: true })],
        [0.7, fore],
    ]);
    _bugLegs(g, F, F.nearSide, MANTIS_LEGS, LO);
    return { top: 42, ring: [-0.4, 1.4, 0.6] };
}

// ── THE MOTH ─────────────────────────────────────────────
// Wing outlines from the hinge: [f, reach out from the body].
const MOTH_FOREWING = [[0.25, 0], [0.15, 0.6], [0, 1.35], [-0.25, 1.6], [-0.45, 1.25], [-0.35, 0.6], [-0.15, 0]];
const MOTH_HINDWING = [[-0.1, 0], [-0.3, 0.55], [-0.55, 1.05], [-0.85, 0.95], [-0.8, 0.5], [-0.45, 0]];
function _drawMoth3D(actor, g, F) {
    const P = F.P, s = F.s;
    const h = 22 + Math.sin(F.t * 0.08) * 3;                 // it hovers
    const phi = Math.sin(F.t * 0.35) * 0.75;                 // its wingbeat
    const cp = Math.cos(phi), sp = Math.sin(phi);
    const W = (f, r, side) => P(f, side * (0.08 + r * cp), h + r * 12 * sp);
    _bugShadow(g, F, -0.15, 0.9, 0.9, 0.22);
    const wings = (side) => {
        g.fillStyle = "rgba(22,16,9,0.88)";
        _bugPoly(g, MOTH_HINDWING.map(([f, r]) => W(f, r, side))); g.fill();
        g.fillStyle = "rgba(30,22,12,0.93)";
        _bugPoly(g, MOTH_FOREWING.map(([f, r]) => W(f, r, side))); g.fill();
        g.strokeStyle = "rgba(70,52,28,0.5)"; g.lineWidth = Math.max(0.6, 0.7 * s);
        g.beginPath(); _bugLine(g, [W(0.1, 0, side), W(-0.25, 1.6, side)]); _bugLine(g, [W(-0.2, 0, side), W(-0.85, 0.95, side)]); g.stroke();
        // Its eyespot, in its colour.
        const e = W(-0.15, 1.05, side);
        g.fillStyle = F.accent; g.globalAlpha *= 0.75;
        g.beginPath(); g.ellipse(e[0], e[1], 2.6 * s, 1.8 * s, 0, 0, Math.PI * 2); g.fill();
        g.globalAlpha /= 0.75;
        g.fillStyle = "#0c0c0e"; g.beginPath(); g.arc(e[0], e[1], Math.max(0.6, 1 * s), 0, Math.PI * 2); g.fill();
    };
    const body = () => {
        // Its legs dangle under it.
        g.strokeStyle = "#141416"; g.lineCap = "round"; g.lineWidth = Math.max(0.7, 0.9 * s); g.beginPath();
        for (const side of [-1, 1]) for (const f of [0.14, 0.04, -0.06]) _bugLine(g, [P(f, side * 0.1, h - 3), P(f + 0.06, side * 0.22, h - 10)]);
        g.stroke();
        _bugBlob(g, F, -0.42, 0.4, 0.17, h - 1, 4, { rim: true });
        _bugBands(g, F, -0.42, 0.4, 0.17, h - 1, 4, [-0.25, -0.45, -0.65]);
        _bugBlob(g, F, 0.06, 0.22, 0.2, h, 5, { gloss: true });
        _bugBlob(g, F, 0.32, 0.12, 0.14, h, 3.5, { lite: true });
        _bugEyes(g, F, [P(0.38, 0.11, h + 1), P(0.38, -0.11, h + 1)], 1.4);
        // Feathered antennae.
        g.strokeStyle = "#2a2218"; g.lineWidth = Math.max(0.6, 0.8 * s); g.beginPath();
        for (const side of [-1, 1]) {
            const a = P(0.38, side * 0.05, h + 3), b = P(0.72, side * 0.32, h + 12);
            g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
            for (let i = 1; i <= 4; i++) {
                const u = i / 5, f = 0.38 + 0.34 * u, sd = 0.05 + 0.27 * u, z = h + 3 + 9 * u;
                const c = P(f, side * sd, z), d = P(f - 0.1, side * (sd + 0.08), z - 1.5);
                g.moveTo(c[0], c[1]); g.lineTo(d[0], d[1]);
            }
        }
        g.stroke();
    };
    wings(-F.nearSide);
    body();
    wings(F.nearSide);
    return { top: 40, ring: [-0.15, 0.9, 0.9] };
}

const BUG_MODELS = { ant: _drawAnt3D, scorpion: _drawScorpion3D, spider: _drawSpider3D, mantis: _drawMantis3D, moth: _drawMoth3D };
