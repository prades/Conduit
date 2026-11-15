// LOOK 4 · PIPEWORKS: steel wall plates with rivets, three pipe runs along the walls (the toxic line, water, steam) with flanges, brackets and handwheels, a cable tray,
// hazard chevrons at the foot, checker-plate floor in bolted plates, fluorescent tubes
(function () {
    const C = { plateL: "#4a5862", plateD: "#3e4b54", seam: "rgba(10,16,20,0.75)", rivet: "rgba(190,210,220,0.55)", rib: "#56656f", floor: "#3f474c", floor2: "#444d53", tube: "#e4f7ff" };
    function chevrons(f, z0, z1) { SL.band(f, z0, z1, "#1a1a17"); SL.each(f, 0.25, 0, 0.2, s => { const u0 = f.U(s), u1 = f.U(s + 0.125), u2 = f.U(s + 0.25); SL.quad([f.P(u0, z0), f.P(u1, z0), f.P(u2, z1), f.P(f.U(s + 0.125), z1)], "#e0b31f"); }); SL.hline(f, z1, "rgba(0,0,0,0.6)", 1.4); }
    window.SL_LOOK = {
        name: "Pipeworks (steel and pipe runs)",
        cap: "#090b0c", capEdge: "rgba(160,200,220,0.35)", nearEdge: "rgba(160,200,220,0.45)",
        floor(g, x, y, nb) {
            const F = SL.fl, px = SL.px;
            F.cells(x, y, 2, 1, 0.5, (u0, v0, u1, v1, i, j) => { g.fillStyle = SL.rnd(i, j, 4) < 0.5 ? C.floor : C.floor2; g.fillRect(u0, v0, u1 - u0, v1 - v0); });   // bolted plates, two tiles by one, staggered
            g.lineWidth = 2.2 * px; g.lineCap = "round";
            for (let a = Math.floor((x - 0.6) / 0.12); a * 0.12 <= x + 0.6; a++) for (let b = Math.floor((y - 0.6) / 0.12); b * 0.12 <= y + 0.6; b++) { const u = a * 0.12 - x + ((b % 2) ? 0.06 : 0), v = b * 0.12 - y, d = 0.025, o = ((a + b) % 2) ? 1 : -1;
                g.strokeStyle = "rgba(15,20,24,0.55)"; g.beginPath(); g.moveTo(u - d, v - d * o); g.lineTo(u + d, v + d * o); g.stroke(); g.strokeStyle = "rgba(200,215,225,0.16)"; g.beginPath(); g.moveTo(u - d, v - d * o - 0.01); g.lineTo(u + d, v + d * o - 0.01); g.stroke(); }   // the checker plate's raised ticks
            g.lineCap = "butt";
            F.cells(x, y, 2, 1, 0.5, (u0, v0, u1, v1) => { g.strokeStyle = "rgba(8,10,12,0.9)"; g.lineWidth = 2 * px; g.strokeRect(u0, v0, u1 - u0, v1 - v0); for (const [bu, bv] of [[u0 + 0.06, v0 + 0.06], [u1 - 0.06, v0 + 0.06], [u1 - 0.06, v1 - 0.06], [u0 + 0.06, v1 - 0.06]]) F.dot(g, bu, bv, 0.018, "rgba(190,205,215,0.55)"); });
            for (const s of ["n", "s", "e", "w"]) if (nb[s] === "water") { const w = 0.18; F.strip(g, s, w, "#151515"); g.save(); g.beginPath(); if (s === "s") g.rect(-0.6, 0.5 - w, 1.2, w); else if (s === "n") g.rect(-0.6, -0.5, 1.2, w); else if (s === "w") g.rect(-0.5, -0.6, w, 1.2); else g.rect(0.5 - w, -0.6, w, 1.2); g.clip();
                g.strokeStyle = "#e0b31f"; g.lineWidth = 0.08; for (let k = -1.4; k < 1.4; k += 0.22) { g.beginPath(); g.moveTo(k + ((x + y) % 2) * 0.11, -0.7); g.lineTo(k + 0.7 + ((x + y) % 2) * 0.11, 0.7); g.stroke(); } g.restore(); F.side(g, s, w, "rgba(0,0,0,0.7)", 1.6 * px); }
            for (const s of ["n", "w"]) if (nb[s] === "wall") { F.strip(g, s, 0.1, "#1b2024"); }
        },
        wall(f, Hd) {
            const pl = f.lit ? C.plateL : C.plateD;
            SL.band(f, 0, Hd, pl); chevrons(f, 0, 14);
            SL.joints(f, 1, 0.5, u => { SL.vline(f, u, 14, Hd, C.seam, 1.8); });
            SL.each(f, 1, 0.5, 0.06, s => { for (let z = 22; z < Hd - 4; z += 12) { for (const d of [-0.035, 0.035]) { const p = f.P(f.U(s + d), z); ctx.fillStyle = C.rivet; ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2); } } });
            for (const z of [36, 112]) { SL.band(f, z - 2, z + 2, C.rib); SL.hline(f, z + 2, "rgba(220,235,245,0.25)", 1); SL.hline(f, z - 2, "rgba(0,0,0,0.5)", 1); }
            SL.pipe(f, 54, 7.5, "#2c6b38", "#5fae6b", "#173f20", 2, "#235a2e");        // the toxic line (green)
            SL.pipe(f, 75, 5, "#5d6a72", "#9fb1bb", "#323b41", 2, "#4d5960");          // water (grey)
            SL.pipe(f, 90, 3.5, "#8a3a30", "#c86a5a", "#4f1e18", 3, "#6e2d25");        // steam (red)
            SL.each(f, 2, 1.25, 0.08, s => { const u = f.U(s), du = 0.035 / Math.max(0.1, f.len); SL.band(f, 44, 96, "#2a3238", u - du, u + du); SL.vline(f, u - du, 44, 96, "rgba(200,220,230,0.25)", 1); });   // the brackets the runs hang on
            SL.each(f, 6, 3.25, 0.2, s => { const p = f.P(f.U(s), 54 + 15); ctx.strokeStyle = "#c33"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(p[0], p[1], 9, 4.5, 0, 0, 6.2832); ctx.stroke(); SL.line([p[0] - 8, p[1]], [p[0] + 8, p[1]], "#c33", 1.6); SL.line([p[0], p[1] - 4], [p[0], p[1] + 4], "#c33", 1.6); SL.line(f.P(f.U(s), 54), p, "#555", 2); });   // handwheels
            SL.band(f, 100, 106, "#1d2328"); SL.each(f, 0.5, 0, 0.02, s => SL.vline(f, f.U(s), 100, 106, "rgba(150,170,180,0.4)", 1)); for (const [z, c] of [[102, "#d23"], [103.5, "#27c"], [105, "#dc2"]]) SL.hline(f, z, c, 1);   // the cable tray
            SL.each(f, 4, 1.75, 0.25, s => { const u = f.U(s), du = 0.2 / Math.max(0.1, f.len); SL.band(f, 117, 121, "#1d2226", u - du, u + du); SL.band(f, 113.5, 117, C.tube, u - du * 0.9, u + du * 0.9);
                const p = f.P(u, 112); const rg = ctx.createRadialGradient(p[0], p[1], 2, p[0], p[1], 60); rg.addColorStop(0, "rgba(220,245,255,0.28)"); rg.addColorStop(1, "rgba(220,245,255,0)"); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p[0], p[1], 60, 0, 6.2832); ctx.fill(); });   // fluorescent tubes
            SL.hline(f, 0, "rgba(0,0,0,0.6)", 2);
        },
        lintel(f, Hd) {   // an I-beam: two flanges and the web, rivets, a hazard band under it
            SL.band(f, 102, Hd, "#2e373e"); SL.band(f, Hd - 5, Hd, "#4b5862"); SL.band(f, 102, 107, "#4b5862"); SL.hline(f, Hd - 5, "rgba(0,0,0,0.6)", 1); SL.hline(f, 107, "rgba(0,0,0,0.6)", 1);
            SL.each(f, 0.25, 0.125, 0.02, s => { const p = f.P(f.U(s), 112); ctx.fillStyle = C.rivet; ctx.fillRect(p[0] - 1.2, p[1] - 1.2, 2.4, 2.4); });
            chevrons(f, 96, 102);
        },
        nearFace(f, h, z0) { SL.band(f, z0, h, C.plateD); SL.joints(f, 1, 0.5, u => SL.vline(f, u, z0, h, C.seam, 1.6)); SL.band(f, h - 8, h, "#1a1a17"); SL.each(f, 0.25, 0, 0.2, s => { const u0 = f.U(s), u1 = f.U(s + 0.125), u2 = f.U(s + 0.25); SL.quad([f.P(u0, h - 8), f.P(u1, h - 8), f.P(u2, h), f.P(f.U(s + 0.125), h)], "#e0b31f"); }); },
    };
})();
