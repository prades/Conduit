// LOOK 2 · STORM DRAIN: raw poured concrete, formwork panels and tie holes, a stained waterline, saw-cut slabs, amber sodium lamps
(function () {
    const C = { faceL: "#77756c", faceD: "#66645c", foot: "#4b4c45", joint: "rgba(30,30,26,0.55)", tie: "rgba(25,25,22,0.75)", floor: "#5d5c55", floor2: "#57564f", slabJ: "rgba(22,22,19,0.9)", amber: "#ffb347", paint: "#e6d27a" };
    window.SL_LOOK = {
        name: "Storm drain (poured concrete)",
        cap: "#0d0d0c", capEdge: "rgba(210,200,170,0.35)", nearEdge: "rgba(220,210,180,0.5)",
        floor(g, x, y, nb) {
            const F = SL.fl, px = SL.px;
            F.cells(x, y, 3, 3, 0, (u0, v0, u1, v1, i, j) => { const t = SL.rnd(i, j, 5); g.fillStyle = SL.mix(C.floor, C.floor2, t); g.fillRect(u0, v0, u1 - u0, v1 - v0); });
            for (let k = 0; k < 14; k++) { const r = SL.rnd(x, y, k + 20), q = SL.rnd(x, y, k + 40); F.dot(g, r - 0.5, q - 0.5, 0.008 + 0.01 * SL.rnd(x, y, k), k % 3 ? "rgba(30,30,26,0.35)" : "rgba(200,195,180,0.25)"); }   // the aggregate
            F.grid(g, x, y, 3, 0, C.slabJ, 2.4 * px); F.grid(g, x, y, 3, 0.025, "rgba(220,215,200,0.12)", 1 * px);   // saw-cut joints
            for (const s of ["n", "w"]) if (nb[s] === "wall") { F.strip(g, s, 0.2, "#26261f"); F.side(g, s, 0.2, "rgba(210,205,190,0.35)", 1.2 * px);   // the gutter at the wall's foot, a grating every other tile
                if ((x + y) % 2 === 0) { g.save(); g.beginPath(); if (s === "n") g.rect(-0.3, -0.5, 0.6, 0.2); else g.rect(-0.5, -0.3, 0.2, 0.6); g.clip(); g.fillStyle = "#14140f"; g.fillRect(-0.6, -0.6, 1.2, 1.2); F.grid(g, x, y, 0.07, 0, "rgba(150,150,135,0.6)", 1.2 * px, s === "n" ? "x" : "y"); g.restore(); } }
            for (const s of ["n", "s", "e", "w"]) if (nb[s] === "water") { F.strip(g, s, 0.2, "#86847a"); F.side(g, s, 0.2, "rgba(20,20,16,0.7)", 1.6 * px); F.side(g, s, 0.05, "rgba(250,245,225,0.35)", 1 * px); F.side(g, s, 0.13, C.paint, 2.2 * px); }   // a thick kerb, a painted line on it
        },
        wall(f, Hd) {
            SL.band(f, 0, Hd, f.lit ? C.faceL : C.faceD);
            const gr = ctx.createLinearGradient(0, f.Y0, 0, f.Y0 - 46); gr.addColorStop(0, "rgba(35,40,28,0.75)"); gr.addColorStop(1, "rgba(35,40,28,0)"); SL.band(f, 0, 46, gr);   // the stained waterline
            SL.band(f, 0, 9, C.foot); SL.hline(f, 9, "rgba(230,225,205,0.35)", 1);              // the haunch at the foot
            SL.joints(f, 2, 0, u => { SL.vline(f, u, 9, Hd, C.joint, 1.6); SL.vline(f, u + 0.03, 9, Hd, "rgba(230,225,205,0.12)", 1); });   // formwork panels
            SL.hline(f, 62, C.joint, 1.4); SL.hline(f, 63.5, "rgba(230,225,205,0.12)", 1);
            SL.each(f, 1, 0.5, 0.05, s => { for (const z of [24, 48, 82, 106]) { const p = f.P(f.U(s), z); ctx.fillStyle = C.tie; ctx.beginPath(); ctx.ellipse(p[0], p[1], 2, 1.8, 0, 0, 6.2832); ctx.fill(); } });   // tie holes
            SL.each(f, 6, 2.25, 0.6, (s, k) => SL.text(f, s, 36, "S-" + String(((k % 9) + 9) % 9 + 1).padStart(2, "0"), 11, "rgba(230,210,120,0.75)"));   // section stencils
            SL.each(f, 5, 0.75, 0.9, s => { SL.lamp(f, s, 84, C.amber, 0.22, 7); });   // amber sodium lamps
            SL.hline(f, 0, "rgba(0,0,0,0.6)", 2);
        },
        lintel(f, Hd) {
            SL.band(f, 100, Hd, C.faceD); SL.hline(f, 100, "rgba(0,0,0,0.8)", 2.5); SL.hline(f, 103, "rgba(230,225,205,0.22)", 1);
            SL.joints(f, 2, 0, u => SL.vline(f, u, 100, Hd, C.joint, 1.4));
        },
        nearFace(f, h, z0) { SL.band(f, z0, h, C.faceD); SL.joints(f, 2, 0, u => SL.vline(f, u, z0, h, C.joint, 1.4)); SL.hline(f, h - 30, C.joint, 1.2); },
    };
})();
