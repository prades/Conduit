// BUILT in build 2026-11-13q: js/bugs3d.js draws the ant this way now (the owner, of this draft: "Very right direction"); this file is kept as the
// draft that was approved, and loads over the game only on a draft page.
// THE ANT, A LITTLE EDGIER: a draft for the owner (2026-11-13; it was not in the game). The owner: "what can be done to make the ants look better?
// I kind of want to make them look a little bit more edgy, but not too much", the forceps (mandibles) in mind.
// Loaded over the game's own drawing (js/bugs3d.js) by a draft page, it replaces BUG_MODELS.ant; everything else is the game's kit.
// The agent's proposal (one piece, for a yes or a correction):
//   THE JAWS     curved blades instead of two thin lines, about 40% longer (a soldier's, the tank's and the queen's, longest),
//                a tooth on each inner edge, the tips sharpened lighter; they rest almost closed and open wide, then snap, on a bite.
//   THE HEAD     a heart-shaped head (a notch at the back, two lobes, the front narrower; stronger on a soldier), a brow ridge
//                over slanted eyes in the species' colour (angry, not glowing).
//   THE GASTER   a short point on its tip. (Spines on the thorax and the waist were tried: at the game's size they read as stray lines.)
//   UNCHANGED    the colours, the sizes, the body, the legs and the walk, the gaster's bands and rim, the shadow, what an ant does.
(function () {
    const N = 24, TS = [];
    for (let i = 0; i < N; i++) TS.push(i / N * Math.PI * 2);
    // the head's outline (k scales the radius at angle t; t = 0 straight ahead): narrower in front, two lobes behind, a notch between
    const headK = (lobe, notch) => TS.map(t => {
        const c = Math.cos(t), a = Math.abs(Math.atan2(Math.sin(t), c));
        let r = 1;
        if (c > 0) r *= 1 - 0.14 * c;
        r += lobe * Math.exp(-((a - 2.3) ** 2) / 0.12);
        r -= notch * Math.exp(-((a - Math.PI) ** 2) / 0.05);
        return r;
    });
    const HEAD_K = headK(0.1, 0.16), HEAD_K_SOLDIER = headK(0.18, 0.26);
    function ring(P, f0, L, W, z, K) {
        const out = [];
        for (let i = 0; i < N; i++) { const k = K[i]; out.push(P(f0 + L * Math.cos(TS[i]) * k, W * Math.sin(TS[i]) * k, z)); }
        return out;
    }
    function headBlob(g, F, f0, L, W, z0, rz, K) {
        for (const [k, sc] of BUG_DOME) { g.fillStyle = _bugShade(F.tint, k); _bugPoly(g, ring(F.P, f0, L * sc, W * sc, z0 + rz * k, K)); g.fill(); }
    }
    // a filled spike from two base points to a tip, its upper edge caught by the light
    function spike(g, F, b1, b2, tip, col) {
        const P = F.P, a = P(...b1), b = P(...b2), c = P(...tip);
        g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.lineTo(b[0], b[1]); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(190,180,215,0.18)'; g.lineWidth = Math.max(0.5, 0.5 * F.s); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke();
    }
    const TIP = '#a59cb2';
    function _drawAntEdgy(actor, g, F) {
        const P = F.P, s = F.s;
        const soldier = actor.className === 'tank' || actor.className === 'boss';
        const hsz = soldier ? 1.3 : 1, ml = { worker: 0.9, scout: 1.05, striker: 1.15, tank: 1.3, boss: 1.35 }[actor.className] || 1;
        const hf = 0.36 + 0.22 * hsz, hL = 0.22 * hsz, hW = 0.25 * hsz, hz = 9, hr = 3.5 * hsz;
        const fr = typeof frame !== 'undefined' ? frame : 0;
        _bugShadow(g, F, -0.35, 1.3, 0.6);
        _bugLegs(g, F, -F.nearSide, ANT_LEGS, { w: 1.6, speed: 0.9, stride: 0.36, lift: 4 });
        // the jaws: open is how far apart; at rest the tips just cross, on a bite they open wide and snap
        const open = F.atk ? (0.5 + 0.5 * Math.sin(fr * 0.5 + F.wc * 0.4)) * 0.16 : 0.006 * Math.sin(F.t * 0.05);
        const jaws = () => {
            const z = 7.4;
            for (const side of [-1, 1]) {
                const b = [hf + hL * 0.7, side * 0.12 * hsz], c1 = [hf + hL + 0.12 * ml, side * (0.23 * hsz + open)], c2 = [hf + hL + 0.38 * ml, side * (0.21 * hsz + open)], t = [hf + hL + 0.47 * ml, side * (0.035 + open * 1.1)];
                const at = u => { const v = 1 - u, A = v * v * v, B = 3 * v * v * u, C = 3 * v * u * u, D = u * u * u; return [A * b[0] + B * c1[0] + C * c2[0] + D * t[0], A * b[1] + B * c1[1] + C * c2[1] + D * t[1]]; };
                const outer = [], inner = [], tipOuter = [], tipInner = [];
                for (let i = 0; i <= 10; i++) {
                    const u = i / 10, p = at(u), q = at(Math.min(1, u + 0.01)), r0 = at(Math.max(0, u - 0.01));
                    let nx = -(q[1] - r0[1]), ny = q[0] - r0[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
                    if (ny * side < 0) { nx = -nx; ny = -ny; }                       // the outward side (away from the middle)
                    const w = 0.16 * hsz * Math.pow(1 - u, 0.8) * (u < 0.15 ? 0.7 + 2 * u : 1);
                    const o = [p[0] + nx * w * 0.5, p[1] + ny * w * 0.5], n = [p[0] - nx * w * 0.5, p[1] - ny * w * 0.5];
                    outer.push(P(o[0], o[1], z)); inner.push(P(n[0], n[1], z));
                    if (u >= 0.6) { tipOuter.push(P(o[0], o[1], z)); tipInner.push(P(n[0], n[1], z)); }
                    if (i === 5) inner.push(P(n[0] - nx * 0.08 * ml + 0.03 * ml, n[1] - ny * 0.08 * ml, z));   // one tooth, pointing in
                }
                const blade = outer.concat(inner.slice().reverse());
                g.fillStyle = _bugShade(F.tint, 0.35); _bugPoly(g, blade); g.fill();
                g.fillStyle = TIP; _bugPoly(g, tipOuter.concat(tipInner.reverse())); g.fill();
                g.strokeStyle = 'rgba(205,195,230,0.3)'; g.lineWidth = Math.max(0.5, 0.6 * s); g.beginPath(); _bugLine(g, outer.slice(2, 8)); g.stroke();
            }
        };
        const head = () => {
            if (F.headBehind) jaws();
            headBlob(g, F, hf, hL, hW, hz, hr, soldier ? HEAD_K_SOLDIER : HEAD_K);
            if (!F.headBehind) jaws();
            // the brow ridge, then the slanted eyes (their front ends lower and further in)
            g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineCap = 'round'; g.lineWidth = Math.max(0.8, 1.1 * s * hsz);
            g.beginPath();
            for (const side of [-1, 1]) _bugLine(g, [P(hf - hL * 0.05, side * hW * 0.9, hz + hr * 0.72), P(hf + hL * 0.55, side * hW * 0.3, hz + hr * 0.62)]);
            g.stroke();
            g.strokeStyle = F.accent; g.lineWidth = Math.max(1, 1.5 * s * hsz);
            g.beginPath();
            for (const side of [-1, 1]) _bugLine(g, [P(hf + hL * 0.05, side * hW * 0.86, hz + hr * 0.5), P(hf + hL * 0.45, side * hW * 0.6, hz + hr * 0.36)]);
            g.stroke();
            // elbowed antennae, as before
            g.strokeStyle = '#1c1c20'; g.lineWidth = Math.max(0.8, 1 * s);
            g.beginPath();
            for (const side of [-1, 1]) {
                const sway = Math.sin(F.t * 0.12 + side) * 2;
                _bugLine(g, [P(hf + hL * 0.6, side * 0.09, hz + hr * 0.6), P(hf + hL * 0.6 + 0.12, side * 0.34, 17 + sway), P(hf + hL + 0.45, side * 0.3, 11 - sway)]);
            }
            g.stroke();
        };
        const dark = _bugShade(F.tint, 0.4);
        _bugParts(F, [
            [-1.6, () => spike(g, F, [-1.38, 0.1, 8.4], [-1.38, -0.1, 8.4], [-1.64, 0, 7.6], dark)],   // the gaster's point
            [-0.92, () => { _bugBlob(g, F, -0.92, 0.55, 0.42, 8, 5.5, { rim: true, gloss: true }); _bugBands(g, F, -0.92, 0.55, 0.42, 8, 5.5, [-0.72, -1.02]); }],
            [-0.36, () => _bugBlob(g, F, -0.36, 0.1, 0.09, 7, 3, { lite: true })],
            [0.02,  () => _bugBlob(g, F, 0.02, 0.34, 0.2, 8, 3.5, { lite: true })],
            [hf, head],
        ]);
        _bugLegs(g, F, F.nearSide, ANT_LEGS, { w: 1.6, speed: 0.9, stride: 0.36, lift: 4 });
        return { top: 22, ring: [-0.35, 1.3, 0.6] };
    }
    BUG_MODELS.ant = _drawAntEdgy;
})();
