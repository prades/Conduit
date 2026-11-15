// LOOK 5 · TILED SERVICE TUNNEL: glazed cream tiles over a green tiled dado, a coloured border, enamel signs over the passages, a quarry-tile floor with a border, globe lamps
(function () {
    const C = { tileL: "#d9d3c1", tileD: "#c9c3b1", grout: "#8f8a7b", dado: "#2f5d4c", dado2: "#2a5444", border: "#e9e1c9", band: "#b8573a", floor: "#6f6a5e", floor2: "#666256", fj: "rgba(40,36,30,0.75)", fb: "#2f5d4c", lamp: "#fff3cc", sign: "#1f4e8c" };
    const TW = 0.125, TH = 6;   // a wall tile: an eighth of a tile wide, 6 px high, laid like brick
    function tiles(f, z0, z1, a, b) {
        SL.band(f, z0, z1, C.grout);
        for (let z = z0, row = 0; z < z1 - 0.5; z += TH, row++) { const zt = Math.min(z1, z + TH - 1), off = row % 2 ? TW / 2 : 0;
            SL.each(f, TW, off, TW * 0.6, (s, k) => { const t = SL.rnd(k, row, 3); SL.rect(f, s - TW * 0.45, s + TW * 0.45, z + 0.5, zt, t < 0.25 ? b : a); }); }
    }
    window.SL_LOOK = {
        name: "Tiled service tunnel",
        cap: "#0b0c0c", capEdge: "rgba(240,230,200,0.4)", nearEdge: "rgba(240,230,200,0.5)",
        floor(g, x, y, nb) {
            const F = SL.fl, px = SL.px;
            F.cells(x, y, 0.5, 0.5, 0, (u0, v0, u1, v1, i, j) => { const t = SL.rnd(i, j, 2); g.fillStyle = t < 0.5 ? C.floor : C.floor2; g.fillRect(u0, v0, u1 - u0, v1 - v0); g.fillStyle = "rgba(255,250,235,0.05)"; g.fillRect(u0, v0, u1 - u0, 0.06); });
            F.grid(g, x, y, 0.5, 0, C.fj, 1.8 * px);
            for (const s of ["n", "s", "e", "w"]) if (nb[s] === "wall" || nb[s] === "water") {   // a border of green and cream, along walls and the river's edge
                const w = nb[s] === "water" ? 0.24 : 0.2; F.strip(g, s, w, C.border); F.strip(g, s, 0.07, C.fb, w - 0.1); F.side(g, s, w, "rgba(40,36,30,0.6)", 1.2 * px);
                if (nb[s] === "water") { F.strip(g, s, 0.06, "#e9e1c9"); F.side(g, s, 0.06, "rgba(40,36,30,0.6)", 1 * px); } }
        },
        wall(f, Hd) {
            const lit = f.lit;
            tiles(f, 0, 30, C.dado, C.dado2); SL.band(f, 30, 34, C.border); SL.hline(f, 34, "rgba(30,25,20,0.5)", 1); SL.hline(f, 30, "rgba(30,25,20,0.5)", 1);
            tiles(f, 34, 96, lit ? C.tileL : C.tileD, lit ? "#cfc9b6" : "#bfb9a8"); SL.band(f, 96, 101, C.band); SL.band(f, 101, 104, C.border); tiles(f, 104, Hd, lit ? C.tileL : C.tileD, lit ? "#cfc9b6" : "#bfb9a8");
            const gl = ctx.createLinearGradient(0, f.Y0 - 34, 0, f.Y0 - 96); gl.addColorStop(0, "rgba(255,255,255,0)"); gl.addColorStop(0.7, "rgba(255,255,255,0.08)"); gl.addColorStop(1, "rgba(255,255,255,0)"); SL.band(f, 34, 96, gl);   // the glaze's sheen
            const st = ctx.createLinearGradient(0, f.Y0, 0, f.Y0 - 60); st.addColorStop(0, "rgba(40,50,30,0.35)"); st.addColorStop(1, "rgba(40,50,30,0)"); SL.band(f, 0, 60, st);   // grime from the floor up
            SL.each(f, 4, 1.75, 0.3, s => SL.lamp(f, s, 84, C.lamp, 0.16, 10));   // globe lamps
            SL.each(f, 8, 3.75, 0.45, (s, k) => { const u = f.U(s), du = 0.4 / Math.max(0.1, f.len); SL.band(f, 50, 66, "#f2efe6", u - du, u + du); SL.band(f, 51.5, 64.5, C.sign, u - du * 0.94, u + du * 0.94); SL.text(f, s, 58, ["◄ OUTFALL", "SECTION 2", "PUMP ROOM ►", "SECTION 3"][((k % 4) + 4) % 4], 8, "#f2efe6"); });   // enamel signs
            SL.hline(f, 0, "rgba(0,0,0,0.5)", 2);
        },
        lintel(f, Hd, it) {
            SL.band(f, 100, Hd, C.tileD); tiles(f, 104, Hd, C.tileD, "#bfb9a8"); SL.band(f, 100, 104, C.dado); SL.hline(f, 100, "rgba(0,0,0,0.7)", 2);
            const names = { "-41.5": "PUMP ROOM", "-45.5": "NO ENTRY", "-33.5": "MAINTENANCE", "-22.5": "DANGER · COLLAPSE", "-48.5": "" }, n = names[String(it.x0)];
            if (n) { const s = (it.x0 + it.x1) / 2, du = Math.min(0.42, (0.13 + n.length * 0.03) / (it.x1 - it.x0)); SL.band(f, 106, 118, "#f2efe6", 0.5 - du, 0.5 + du); SL.band(f, 107, 117, n.startsWith("DANGER") || n === "NO ENTRY" ? "#a82b20" : C.sign, 0.5 - du * 0.96, 0.5 + du * 0.96); SL.text(f, s, 112, n, 7.5, "#f2efe6"); }
        },
        nearFace(f, h, z0) { tiles(f, z0, h - 4, C.dado, C.dado2); SL.band(f, h - 4, h, C.border); },
    };
})();
