// LOOK 1 · FACILITY, REFINED: the facility's own panels and green light strip, done cleanly (closest to today)
(function () {
    const C = { wain: "#161c1b", faceD: "#2c3533", faceL: "#35403d", seam: "rgba(6,12,12,0.65)", seamLit: "rgba(150,190,175,0.18)", acc: "#46d62e", floor: "#283130", floor2: "#2b3533", joint: "rgba(5,9,9,0.85)" };
    window.SL_LOOK = {
        name: "Facility, refined",
        capEdge: "rgba(120,220,140,0.35)", nearEdge: "rgba(120,220,140,0.45)",
        floor(g, x, y, nb) {
            const F = SL.fl, px = SL.px;
            F.cells(x, y, 2, 2, 0, (u0, v0, u1, v1, i, j) => { const t = SL.rnd(i, j, 3); g.fillStyle = t < 0.5 ? C.floor : C.floor2; g.fillRect(u0, v0, u1 - u0, v1 - v0);
                g.fillStyle = "rgba(255,255,255,0.035)"; g.fillRect(u0, v0, u1 - u0, (v1 - v0) * 0.5); });   // big panels, two tones, a soft sheen
            F.grid(g, x, y, 2, 0, C.joint, 2.2 * px);                                   // the panel seams
            F.grid(g, x, y, 2, 0.03, "rgba(160,200,190,0.10)", 1 * px);                 // their lit lip
            for (const s of ["n", "w"]) if (nb[s] === "wall" && ((x + y) % 3 === 0)) { const a = -0.5 + 0.08; g.fillStyle = "#0b0f0f"; if (s === "n") g.fillRect(-0.32, a, 0.64, 0.16); else g.fillRect(a, -0.32, 0.16, 0.64);
                g.strokeStyle = "rgba(140,170,160,0.35)"; g.lineWidth = 1 * px; for (let k = -0.26; k <= 0.27; k += 0.08) { g.beginPath(); if (s === "n") { g.moveTo(k, a + 0.02); g.lineTo(k, a + 0.14); } else { g.moveTo(a + 0.02, k); g.lineTo(a + 0.14, k); } g.stroke(); } }   // a drain slot by the wall
            for (const s of ["n", "s", "e", "w"]) if (nb[s] === "water") {   // the river's edge: a hazard kerb
                F.strip(g, s, 0.16, "#141716"); const w = 0.16; g.save(); g.beginPath(); if (s === "s") g.rect(-0.6, 0.5 - w, 1.2, w); else if (s === "n") g.rect(-0.6, -0.5, 1.2, w); else if (s === "w") g.rect(-0.5, -0.6, w, 1.2); else g.rect(0.5 - w, -0.6, w, 1.2); g.clip();
                g.strokeStyle = "#e0b31f"; g.lineWidth = 0.07; for (let k = -1.2; k < 1.2; k += 0.2) { g.beginPath(); g.moveTo(k + (x + y) % 2 * 0.1, -0.7); g.lineTo(k + 0.7 + (x + y) % 2 * 0.1, 0.7); g.stroke(); } g.restore();
                F.side(g, s, 0.16, "rgba(0,0,0,0.6)", 1.5 * px); }
        },
        wall(f, Hd) {
            const face = f.lit ? C.faceL : C.faceD;
            SL.band(f, 0, 24, C.wain); SL.band(f, 24, Hd, face);
            SL.joints(f, 1, 0.5, u => { SL.vline(f, u, 30, Hd - 10, C.seam, 1.6); SL.vline(f, u + 0.03, 30, Hd - 10, C.seamLit, 1); });   // a panel a tile wide
            SL.hline(f, 78, C.seam, 1.4); SL.hline(f, 79.5, C.seamLit, 1);
            SL.band(f, Hd - 10, Hd, "#202826");                                         // the cap band
            SL.pipe(f, 98, 3.2, "#3e4a48", "#6f817c", "#1f2726", 2, "#28312f");         // a conduit along the wall
            SL.hline(f, 26, SL.rgba(C.acc, 0.22), 6); SL.hline(f, 26, C.acc, 1.8);     // the light strip
            SL.hline(f, 0, "rgba(0,0,0,0.6)", 2); SL.hline(f, Hd - 10, "rgba(0,0,0,0.5)", 1.2);
            SL.each(f, 4, 1.75, 0.9, s => SL.lamp(f, s, 62, "#d8f6ff", 0.3, 6));       // a bulkhead light every four tiles
        },
        lintel(f, Hd) {
            SL.band(f, 104, Hd, C.faceD); SL.band(f, Hd - 10, Hd, "#202826"); SL.hline(f, 104, "rgba(0,0,0,0.75)", 2.5);
            SL.hline(f, 107, SL.rgba(C.acc, 0.22), 6); SL.hline(f, 107, C.acc, 1.6);
            SL.joints(f, 1, 0.5, u => SL.vline(f, u, 104, Hd - 10, C.seam, 1.4));
        },
        nearFace(f, h, z0) { SL.band(f, z0, h, C.faceD); SL.hline(f, h - 6, SL.rgba(C.acc, 0.5), 1.4); SL.joints(f, 1, 0.5, u => SL.vline(f, u, z0, h - 8, C.seam, 1.2)); },
    };
})();
