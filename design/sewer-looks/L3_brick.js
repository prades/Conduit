// LOOK 3 · VICTORIAN BRICK: red brick in courses over a stone plinth, a stone string course, brick arches with stone voussoirs over the passages, a herringbone brick floor, a granite kerb, gas-style lamps
(function () {
    const C = { brickL: "#874a33", brickD: "#753f2b", brick2: "#6c3826", mortar: "#3b2a22", stoneL: "#8b867b", stoneD: "#7a756b", stoneJ: "rgba(40,36,30,0.7)", pave: "#4f2e24", pave2: "#4a2b21", paveJ: "rgba(28,18,14,0.85)", granite: "#7d7a72", lamp: "#ffcf6a" };
    const CH = 7;   // a course's height (px)
    function bricks(f, z0, z1, lit) {   // brick courses between two heights, running bond; each brick a quarter of a tile
        SL.band(f, z0, z1, C.mortar);
        for (let z = z0, row = 0; z < z1 - 0.5; z += CH, row++) {
            const zt = Math.min(z1, z + CH - 1.2), off = row % 2 ? 0.125 : 0;
            SL.each(f, 0.25, off, 0.13, (s, k) => { const t = SL.rnd(k, row, 7), col = t < 0.33 ? C.brick2 : (lit ? C.brickL : C.brickD); SL.rect(f, s - 0.117, s + 0.117, z + 0.6, zt, col); if (t > 0.85) SL.rect(f, s - 0.117, s + 0.117, zt - 1.6, zt, "rgba(255,210,170,0.10)"); });
        }
    }
    function stone(f, z0, z1, lit, len) { SL.band(f, z0, z1, lit ? C.stoneL : C.stoneD); SL.joints(f, len || 0.5, 0.25, u => SL.vline(f, u, z0, z1, C.stoneJ, 1.4)); SL.hline(f, z1, "rgba(255,245,225,0.35)", 1.2); SL.hline(f, z0, "rgba(20,15,10,0.6)", 1.4); }
    window.SL_LOOK = {
        name: "Victorian brick",
        cap: "#0d0a09", capEdge: "rgba(230,200,170,0.32)", nearEdge: "rgba(230,200,170,0.45)",
        floor(g, x, y, nb) {
            const F = SL.fl, px = SL.px; g.fillStyle = "#2c1d17"; g.fillRect(-0.6, -0.6, 1.2, 1.2);
            // herringbone: bricks 0.25 by 0.125, in pairs at right angles, set in a 0.25 grid
            const S = 0.25, j0 = Math.floor((y - 0.7) / S), j1 = Math.floor((y + 0.7) / S), i0 = Math.floor((x - 0.7) / S), i1 = Math.floor((x + 0.7) / S);
            for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const u = i * S - x, v = j * S - y, t = SL.rnd(i, j, 9), col = t < 0.4 ? C.pave2 : C.pave, m = 0.012;
                g.fillStyle = col; if ((i + j) % 2 === 0) { g.fillRect(u + m, v + m, S - 2 * m, S / 2 - 2 * m); g.fillStyle = t < 0.7 ? C.pave : C.pave2; g.fillRect(u + m, v + S / 2 + m, S - 2 * m, S / 2 - 2 * m); }
                else { g.fillRect(u + m, v + m, S / 2 - 2 * m, S - 2 * m); g.fillStyle = t < 0.7 ? C.pave : C.pave2; g.fillRect(u + S / 2 + m, v + m, S / 2 - 2 * m, S - 2 * m); } }
            for (const s of ["n", "w"]) if (nb[s] === "wall") { F.strip(g, s, 0.16, "#45403a"); F.side(g, s, 0.16, "rgba(15,10,8,0.7)", 1.4 * px); }   // a stone gutter by the wall
            for (const s of ["n", "s", "e", "w"]) if (nb[s] === "water") { F.strip(g, s, 0.22, C.granite); F.side(g, s, 0.22, "rgba(15,12,10,0.8)", 1.6 * px); F.side(g, s, 0.04, "rgba(255,250,235,0.4)", 1 * px);
                g.strokeStyle = "rgba(40,36,30,0.75)"; g.lineWidth = 1.2 * px; for (let k = Math.ceil(x - 0.6); k <= x + 0.6; k++) { const u = k - x + 0.25; g.beginPath(); if (s === "s" || s === "n") { const a = s === "s" ? 0.28 : -0.5; g.moveTo(u, a); g.lineTo(u, a + 0.22); } g.stroke(); } }
        },
        wall(f, Hd) {
            stone(f, 0, 20, f.lit, 0.5); bricks(f, 20, 84, f.lit); stone(f, 84, 90, f.lit, 1); bricks(f, 90, Hd, f.lit);
            const gr = ctx.createLinearGradient(0, f.Y0 - Hd, 0, f.Y0 - Hd + 30); gr.addColorStop(0, "rgba(10,6,4,0.55)"); gr.addColorStop(1, "rgba(10,6,4,0)"); SL.band(f, Hd - 30, Hd, gr);   // soot under the cut
            const g2 = ctx.createLinearGradient(0, f.Y0, 0, f.Y0 - 40); g2.addColorStop(0, "rgba(20,30,18,0.55)"); g2.addColorStop(1, "rgba(20,30,18,0)"); SL.band(f, 20, 44, g2);   // damp above the plinth
            SL.each(f, 4, 1.75, 0.5, s => { const u = f.U(s), du = 0.07 / Math.max(0.1, f.len); SL.band(f, 52, 76, "#151110", u - du, u + du); SL.lamp(f, s, 66, C.lamp, 0.1, 14); SL.band(f, 76, 80, "#2a2420", u - du * 1.6, u + du * 1.6); });   // gas-style lamps on brackets
        },
        lintel(f, Hd) {   // a brick arch: the brick face above a shallow curve, stone voussoirs round it and a keystone
            const zs = 74, rise = 26, Z = u => zs + rise * (1 - (2 * u - 1) ** 2);
            ctx.save(); ctx.beginPath(); const p0 = f.P(-0.01, Hd); ctx.moveTo(p0[0], p0[1]); const p1 = f.P(1.01, Hd); ctx.lineTo(p1[0], p1[1]); for (let k = 40; k >= 0; k--) { const u = k / 40, p = f.P(u, Z(u)); ctx.lineTo(p[0], p[1]); } ctx.closePath(); ctx.clip();
            bricks(f, 70, Hd, false); ctx.restore();
            for (let k = 0; k < 40; k++) { const u0 = k / 40, u1 = (k + 1) / 40, a = f.P(u0, Z(u0)), b = f.P(u1, Z(u1)), c = f.P(u1, Z(u1) + 12), d = f.P(u0, Z(u0) + 12); SL.quad([a, b, c, d], k % 4 < 2 ? C.stoneD : C.stoneL); }
            for (let k = 0; k <= 40; k += 2) { const u = k / 40, a = f.P(u, Z(u)), b = f.P(u, Z(u) + 12); SL.line(a, b, C.stoneJ, 1.2); }
            { const u = 0.5, du = 0.03, a = f.P(u - du, Z(u) - 1), b = f.P(u + du, Z(u) - 1), c = f.P(u + du * 1.3, Z(u) + 13), d = f.P(u - du * 1.3, Z(u) + 13); SL.quad([a, b, c, d], C.stoneL); }   // the keystone
            ctx.strokeStyle = "rgba(15,10,8,0.8)"; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40, p = f.P(u, Z(u)); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
        },
        nearFace(f, h, z0) { bricks(f, z0, h - 6, false); stone(f, h - 6, h, false, 0.5); },
    };
})();
