// LOOK 6 · OVERGROWN: the Nest's growth has crept down the tunnel: dark concrete crusted with amber resin from the foot, glowing fungus, slime runs from the top,
// cracked slabs with glowing moss in the joints; no lamps, the fungus is the light
(function () {
    const C = { faceL: "#3a403a", faceD: "#333832", resin: "#7a4e22", resin2: "#a8692c", slime: "#4f8a32", glow: "#8dff4a", floor: "#2d322d", floor2: "#292e29" };
    function resinFoot(f, Hd) {   // a wavy crust of resin from the floor up, thicker in places, with lit blisters
        const n = 10, pts = []; for (let k = 0; k <= n; k++) { const u = k / n, s = f.S(u), hgt = 10 + 14 * (0.5 + 0.5 * Math.sin(s * 3.1 + 1.3)) * (0.6 + 0.4 * Math.sin(s * 7.7)) + 8 * Math.max(0, Math.sin(s * 1.3)); pts.push([u, Math.max(4, hgt)]); }
        ctx.fillStyle = C.resin; ctx.beginPath(); let p = f.P(-0.02, 0); ctx.moveTo(p[0], p[1]); for (const [u, z] of pts) { p = f.P(u, z); ctx.lineTo(p[0], p[1]); } p = f.P(1.02, 0); ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = C.resin2; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach(([u, z], i) => { const q = f.P(u, z); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke();
        SL.each(f, 0.3, 0.1, 0.06, (s, k) => { const z = 5 + 10 * SL.rnd(k, 1, 4), p = f.P(f.U(s), z); ctx.fillStyle = C.resin2; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3 + 2 * SL.rnd(k, 2, 4), 2.2, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = "rgba(255,220,150,0.5)"; ctx.fillRect(p[0] - 1, p[1] - 1.5, 1.4, 1); });
    }
    function fungus(f, s, z, k) { const p = f.P(f.U(s), z), rg = ctx.createRadialGradient(p[0], p[1], 1, p[0], p[1], 26); rg.addColorStop(0, "rgba(141,255,74,0.45)"); rg.addColorStop(1, "rgba(141,255,74,0)"); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p[0], p[1], 26, 0, 6.2832); ctx.fill();
        for (let i = 0; i < 6; i++) { const a = SL.rnd(k, i, 11) * 6.28, r = 2 + 6 * SL.rnd(k, i, 12); ctx.fillStyle = i % 2 ? C.glow : "#d8ffb0"; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r * 0.6, 1.4 + 1.6 * SL.rnd(k, i, 13), 0, 6.2832); ctx.fill(); } }
    window.SL_LOOK = {
        name: "Overgrown (the Nest spreading)",
        cap: "#080a08", capEdge: "rgba(140,200,110,0.3)", nearEdge: "rgba(140,200,110,0.4)",
        floor(g, x, y, nb) {
            const F = SL.fl, px = SL.px;
            F.cells(x, y, 1, 1, 0.37, (u0, v0, u1, v1, i, j) => { const t = SL.rnd(i, j, 6); g.fillStyle = t < 0.5 ? C.floor : C.floor2; g.fillRect(u0, v0, u1 - u0, v1 - v0);
                if (t > 0.72) { g.strokeStyle = "rgba(8,10,8,0.8)"; g.lineWidth = 1.4 * px; g.beginPath(); g.moveTo(u0 + 0.2, v0 + 0.1); g.lineTo(u0 + 0.45, v0 + 0.45); g.lineTo(u0 + 0.4, v0 + 0.8); g.stroke(); } });   // slabs a tile each, some cracked
            F.cells(x, y, 1, 1, 0.37, (u0, v0, u1, v1) => { g.strokeStyle = "rgba(6,8,6,0.85)"; g.lineWidth = 2.2 * px; g.strokeRect(u0, v0, u1 - u0, v1 - v0); });   // dark joints
            g.save(); g.globalCompositeOperation = "lighter";
            F.cells(x, y, 1, 1, 0.37, (u0, v0, u1, v1, i, j) => { for (let e = 0; e < 4; e++) { if (SL.rnd(i, j, 50 + e) < 0.62) continue; const a = 0.15 + 0.5 * SL.rnd(i, j, 60 + e), b = Math.min(1, a + 0.15 + 0.3 * SL.rnd(i, j, 70 + e));   // moss in some joints, a stretch here and there
                const P = e === 0 ? [[u0 + (u1 - u0) * a, v0], [u0 + (u1 - u0) * b, v0]] : e === 1 ? [[u1, v0 + (v1 - v0) * a], [u1, v0 + (v1 - v0) * b]] : e === 2 ? [[u0 + (u1 - u0) * a, v1], [u0 + (u1 - u0) * b, v1]] : [[u0, v0 + (v1 - v0) * a], [u0, v0 + (v1 - v0) * b]];
                g.strokeStyle = "rgba(90,200,50,0.10)"; g.lineWidth = 8 * px; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]); g.stroke();
                g.strokeStyle = "rgba(141,255,74,0.30)"; g.lineWidth = 1.8 * px; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]); g.stroke(); } });
            g.restore();
            for (let k = 0; k < 3; k++) if (SL.rnd(x, y, 80 + k) > 0.6) { const u = SL.rnd(x, y, 90 + k) - 0.5, v = SL.rnd(x, y, 95 + k) - 0.5; F.dot(g, u, v, 0.05 + 0.04 * SL.rnd(x, y, k), "rgba(70,120,45,0.55)"); F.dot(g, u + 0.03, v - 0.02, 0.025, "rgba(141,255,74,0.35)"); }   // moss clumps
            if (SL.rnd(x, y, 30) > 0.8) { g.fillStyle = "rgba(60,110,40,0.55)"; g.beginPath(); g.ellipse(SL.rnd(x, y, 31) * 0.5 - 0.25, SL.rnd(x, y, 32) * 0.5 - 0.25, 0.22, 0.14, 0.4, 0, 6.2832); g.fill(); }   // a slick of slime
            for (const s of ["n", "w"]) if (nb[s] === "wall") { F.strip(g, s, 0.14, "#5e3d1c"); F.side(g, s, 0.14, "rgba(168,105,44,0.6)", 1.4 * px); }   // the resin reaching out from the wall's foot
            for (const s of ["n", "s", "e", "w"]) if (nb[s] === "water") { F.strip(g, s, 0.12, "#3f6b2b"); F.side(g, s, 0.12, "rgba(141,255,74,0.35)", 1.4 * px); }   // a slimy lip
        },
        wall(f, Hd) {
            SL.band(f, 0, Hd, f.lit ? C.faceL : C.faceD);
            SL.joints(f, 2, 0, u => SL.vline(f, u, 0, Hd, "rgba(10,12,10,0.6)", 1.4)); SL.hline(f, 64, "rgba(10,12,10,0.6)", 1.2);
            SL.each(f, 1.3, 0.4, 0.05, (s, k) => { const u = f.U(s), z1 = Hd - 2, len = 24 + 50 * SL.rnd(k, 3, 8); const a = f.P(u, z1), b = f.P(u, z1 - len); ctx.strokeStyle = "rgba(79,138,50,0.7)"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.fillStyle = "#6fb94a"; ctx.beginPath(); ctx.ellipse(b[0], b[1] + 2, 2, 3, 0, 0, 6.2832); ctx.fill(); });   // slime runs from the top
            SL.each(f, 1.7, 0.9, 0.06, (s, k) => { const u = f.U(s), z = 70 + 30 * SL.rnd(k, 5, 8); const p0 = f.P(u, z); ctx.strokeStyle = "rgba(8,10,8,0.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p0[0] + 5, p0[1] + 9); ctx.lineTo(p0[0] + 2, p0[1] + 18); ctx.stroke(); });   // cracks
            resinFoot(f, Hd);
            SL.each(f, 2.6, 1.1, 0.3, (s, k) => fungus(f, s, 30 + 50 * SL.rnd(k, 9, 2), k));   // glowing fungus
            SL.hline(f, 0, "rgba(0,0,0,0.6)", 2);
        },
        lintel(f, Hd) {
            SL.band(f, 102, Hd, C.faceD); SL.hline(f, 102, "rgba(0,0,0,0.8)", 2.5);
            for (let k = 0; k < 9; k++) { const u = (k + 0.5) / 9, len = 8 + 20 * SL.rnd(k, f.s0, 5), a = f.P(u, 102), b = f.P(u, 102 - len); ctx.strokeStyle = k % 3 ? "rgba(122,78,34,0.9)" : "rgba(79,138,50,0.8)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.fillStyle = k % 3 ? C.resin2 : "#6fb94a"; ctx.beginPath(); ctx.arc(b[0], b[1] + 1, 2.2, 0, 6.2832); ctx.fill(); }   // resin and slime hanging from it
        },
        nearFace(f, h, z0) { SL.band(f, z0, h, C.faceD); SL.band(f, h - 7, h, "#5e3d1c"); SL.hline(f, h - 7, "rgba(168,105,44,0.6)", 1.2); },
    };
})();
