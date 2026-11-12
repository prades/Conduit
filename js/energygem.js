// AN ENERGY CARD'S 3D GEM OVER ITS ELEMENT'S WORLD (build 2026-11-12q; docs/ENERGY-CARDS.md §9; the owner, 2026-11-12: "Let's make those 3D gems and the backgrounds for the energy
// cards", then of three drafts (A plasma, B world, C radiant) "B world"; of the electric gem, "just a rock with some crystal coming out of it. And electricity, of course").
//   THE GEM     a real 3D model of the shape the owner locked in for build 2026-11-12n (design/cards/energy/gems3d.js), baked to img/cards/energy_<element>.png
//               (design/cards/energy/bake.js), hovering in the card's art (game.html "AN ENERGY CARD'S WORLD"). It replaces build 12n's SVG gems and their per-frame loops.
//   THE WORLD   a small scene of its element, painted here once per element and kept: a lava cave, a glacier under an aurora, a storm, the void over a warped grid, a reactor's
//               hex lattice, a dripping swamp, a garden under light. Its motes are a layer of their own that drifts (embers, bubbles and the reactor's sparks rise; snow, the storm's
//               sparks, stars and petals fall), and the storm's lightning is a layer that flickers. Only transform and opacity move. Painted on a card's first showing, its glows
//               without shadowBlur (the game's rule).
//   The agent's, provisional: the scenes' details, the motes' speeds, the hover.
const ENERGY_WORLD = {   // dir: which way its motes drift; secs: one tile's drift; bolts: a flickering lightning layer
    fire: { dir: "up", secs: 16 }, ice: { dir: "down", secs: 22 }, electric: { dir: "down", secs: 30, bolts: true }, flux: { dir: "down", secs: 40 },
    core: { dir: "up", secs: 18 }, toxic: { dir: "up", secs: 14 }, blossom: { dir: "down", secs: 20 },
};
const _EW_W = 450, _EW_H = 630, _ewCache = {};
const _EW_TAU = Math.PI * 2;
function _ewA(h, a) { const n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
function _ewRad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; }
function _ewLin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; }
// THE GLOWS are gradients and wider, fainter strokes under a shape, never shadowBlur (the game's rule, docs/EFFECTS.md §2: tests/effects.js), each about as far-reaching as the drafts' blur
function _ewRgb(c) { if (c[0] === "#") { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, 1]; } const v = c.slice(c.indexOf("(") + 1, -1).split(",").map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; }
function _ewC(v, k) { return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + (v[3] * k).toFixed(3) + ")"; }
function _ewDot(g, x, y, r, c, blur) {
    if (blur) {   // (a blur's halo: a bell round the dot, fainter the smaller the dot is against the blur)
        const v = _ewRgb(c), o = r + blur, sg = blur / 2, pk = Math.min(0.5, 2 * r * r / (blur * blur));
        g.fillStyle = _ewRad(g, x, y, 0, o, [[0, _ewC(v, pk)], [sg / o, _ewC(v, pk * 0.61)], [2 * sg / o, _ewC(v, pk * 0.14)], [1, _ewC(v, 0)]]); g.beginPath(); g.arc(x, y, o, 0, _EW_TAU); g.fill();
    }
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, _EW_TAU); g.fill();
}
function _ewGlowStroke(g, path, lw, col, glow, blur) {   // path(): begins and traces it; glow: the glow's colour; blur: about how far it reaches
    const v = _ewRgb(glow); g.save(); g.lineJoin = "round"; g.lineCap = "round";
    for (const [w, k] of [[blur * 1.5, 0.06], [blur * 0.85, 0.12], [blur * 0.35, 0.22]]) { g.strokeStyle = _ewC(v, k); g.lineWidth = lw + w; path(); g.stroke(); }
    g.strokeStyle = col; g.lineWidth = lw; path(); g.stroke(); g.restore();
}
// a mote drawn so its layer tiles top to bottom: again a tile's height away when it is near an edge
function _ewWrap(H, y, pad, draw) { draw(y); if (y < pad) draw(y + H); if (y > H - pad) draw(y - H); }
function _ewHex(g, W, H, s, c) { g.save(); g.strokeStyle = c; g.lineWidth = 1; const h = s * Math.sqrt(3) / 2; for (let row = -1; row * h < H + h; row++) for (let col = -1; col * s * 1.5 < W + s; col++) { const x = col * s * 1.5, y = row * h * 2 + (col % 2 ? h : 0); g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * _EW_TAU; g.lineTo(x + Math.cos(a) * s * 0.96, y + Math.sin(a) * s * 0.96); } g.closePath(); g.stroke(); } g.restore(); }
function _ewBolt(g, x0, y0, x1, y1, R, jag, w, c, fork) {
    const pts = [[x0, y0]], n = 12; for (let k = 1; k < n; k++) { const t = k / n; pts.push([x0 + (x1 - x0) * t + (R() - 0.5) * jag, y0 + (y1 - y0) * t + (R() - 0.5) * jag * 0.4]); } pts.push([x1, y1]);
    const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
    _ewGlowStroke(g, path, w * 3.2, _ewA(c, 0.35), _ewA(c, 0.35), 18); _ewGlowStroke(g, path, w, "#ffffff", c, 6);
    if (fork) for (let f = 0; f < fork; f++) { const p = pts[3 + Math.floor(R() * (n - 5))]; _ewBolt(g, p[0], p[1], p[0] + (R() - 0.5) * 90, p[1] + 40 + R() * 70, R, jag * 0.5, w * 0.6, c, 0); }
}
// each world draws its scene on S, its motes on M and (the storm) its lightning on B, in the order the approved drafts drew them, so they come out as the owner saw them
const _EW_PAINT = {
    fire(S, M, B, W, H, R) {
        S.fillStyle = _ewLin(S, 0, 0, 0, H, [[0, "#120201"], [0.45, "#2a0602"], [0.8, "#5a1204"], [1, "#a8300a"]]); S.fillRect(0, 0, W, H);
        S.fillStyle = _ewRad(S, W * 0.5, H * 1.02, 10, H * 0.7, [[0, "rgba(255,120,30,0.55)"], [1, "rgba(255,60,10,0)"]]); S.fillRect(0, 0, W, H);
        const rock = pts => { S.fillStyle = "#140504"; S.beginPath(); pts.forEach(([x, y], i) => i ? S.lineTo(x, y) : S.moveTo(x, y)); S.closePath(); S.fill(); };
        const L = [[0, 0]]; for (let y = 0; y <= H; y += 40) L.push([W * (0.06 + R() * 0.1 + (y > H * 0.6 ? 0.08 : 0)), y]); L.push([0, H]); rock(L);
        const Rr = [[W, 0]]; for (let y = 0; y <= H; y += 40) Rr.push([W * (0.94 - R() * 0.1 - (y > H * 0.6 ? 0.08 : 0)), y]); Rr.push([W, H]); rock(Rr);
        const F = [[0, H]]; for (let x = 0; x <= W; x += 30) F.push([x, H * (0.74 + R() * 0.06)]); F.push([W, H]); rock(F);
        const crack = pts => _ewGlowStroke(S, () => { S.beginPath(); pts.forEach(([x, y], i) => i ? S.lineTo(x, y) : S.moveTo(x, y)); }, 2, "#ff6a14", "#ff8a1e", 10);   // the lava in the cracks
        for (let k = 0; k < 9; k++) { let x = R() * W, y = H * (0.76 + R() * 0.2); const pts = [[x, y]]; for (let j = 0; j < 5; j++) { x += (R() - 0.5) * 60; y += (R() - 0.3) * 20; pts.push([x, y]); } crack(pts); }
        for (let k = 0; k < 6; k++) { const side = k % 2; let x = side ? W * (0.86 + R() * 0.1) : W * (0.02 + R() * 0.1), y = R() * H * 0.7; const pts = [[x, y]]; for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 24; y += 20 + R() * 20; pts.push([x, y]); } crack(pts); }
        for (let k = 0; k < 70; k++) { const y = R() * H, x = R() * W, r = 0.8 + R() * 2.2, c = _ewA(R() < 0.5 ? "#ffb347" : "#ff6a14", 0.5 + R() * 0.5); _ewWrap(H, y, 12, yy => _ewDot(M, x, yy, r, c, 8)); }   // the embers (all the way up: the draft kept them low, but a drifting layer must have no gap)
    },
    ice(S, M, B, W, H, R) {
        S.fillStyle = _ewLin(S, 0, 0, 0, H, [[0, "#020818"], [0.5, "#06203e"], [1, "#0e3e6a"]]); S.fillRect(0, 0, W, H);
        for (const [y0, a, c] of [[0.12, 0.5, "#4dffc3"], [0.2, 0.4, "#5ad8ff"], [0.07, 0.3, "#9a7aff"]]) { S.save(); S.globalCompositeOperation = "lighter"; S.lineJoin = "round"; for (const [w, k] of [[90, 0.015], [76, 0.03], [66, 0.05], [58, 0.07], [50, 0.08], [42, 0.11], [34, 0.11], [26, 1]]) { S.strokeStyle = _ewA(c, a * 0.5 * k); S.lineWidth = w; S.beginPath(); for (let x = -20; x <= W + 20; x += 10) { const y = H * y0 + Math.sin(x / W * 5.5 + y0 * 20) * 24 + Math.sin(x / W * 13) * 8; x === -20 ? S.moveTo(x, y) : S.lineTo(x, y); } S.stroke(); } S.restore(); }   // the aurora (a band of 26, its glow in wider, fainter ones)
        const shard = (x, y, w, h, up, a) => { S.fillStyle = _ewLin(S, x, y, x, y + (up ? -h : h), [[0, _ewA("#9fdcff", a)], [1, _ewA("#e8f8ff", a * 0.5)]]); S.beginPath(); S.moveTo(x - w / 2, y); S.lineTo(x + w * 0.1, y + (up ? -h : h)); S.lineTo(x + w / 2, y); S.closePath(); S.fill(); S.strokeStyle = _ewA("#e8f8ff", a * 0.7); S.lineWidth = 1; S.stroke(); };
        for (let k = 0; k < 14; k++) shard(R() * W, H * (0.92 + R() * 0.08), 20 + R() * 40, 60 + R() * 150, true, 0.28 + R() * 0.25);
        for (let k = 0; k < 8; k++) shard(R() < 0.5 ? R() * W * 0.18 : W * (0.82 + R() * 0.18), 0, 14 + R() * 20, 40 + R() * 90, false, 0.3);
        for (let k = 0; k < 90; k++) { const x = R() * W, y = R() * H, r = 0.6 + R() * 1.8, c = _ewA("#ffffff", 0.4 + R() * 0.6); _ewWrap(H, y, 8, yy => _ewDot(M, x, yy, r, c, 4)); }   // the snow
    },
    electric(S, M, B, W, H, R) {
        S.fillStyle = _ewLin(S, 0, 0, 0, H, [[0, "#0a0814"], [0.5, "#1a1630"], [1, "#2a2440"]]); S.fillRect(0, 0, W, H);
        for (let k = 0; k < 42; k++) { const x = R() * W, y = H * (0.02 + R() * 0.32), r = 30 + R() * 60; S.fillStyle = _ewRad(S, x, y, 0, r, [[0, "rgba(70,64,100,0.55)"], [1, "rgba(30,26,50,0)"]]); S.beginPath(); S.arc(x, y, r, 0, _EW_TAU); S.fill(); }   // the clouds
        _ewBolt(B, W * 0.15, H * 0.1, W * 0.28, H * 0.9, R, 70, 2.2, "#ffd400", 2); _ewBolt(B, W * 0.86, H * 0.08, W * 0.7, H * 0.75, R, 60, 1.8, "#ffd400", 1); _ewBolt(B, W * 0.6, 0, W * 0.94, H * 0.5, R, 40, 1.2, "#fff27a", 0);
        S.fillStyle = _ewRad(S, W * 0.5, H * 0.3, 0, W * 0.45, [[0, "rgba(255,212,0,0.25)"], [1, "rgba(255,212,0,0)"]]); S.fillRect(0, 0, W, H);
        for (let k = 0; k < 40; k++) { const x = R() * W, y = R() * H, r = 0.6 + R() * 1.6, c = _ewA("#fff27a", 0.4 + R() * 0.6); _ewWrap(H, y, 10, yy => _ewDot(M, x, yy, r, c, 6)); }   // the sparks
    },
    flux(S, M, B, W, H, R) {
        S.fillStyle = _ewRad(S, W * 0.5, H * 0.32, 0, H * 0.9, [[0, "#2a0a5a"], [0.5, "#12042a"], [1, "#04020a"]]); S.fillRect(0, 0, W, H);
        for (let k = 0; k < 5; k++) { const x = R() * W, y = R() * H * 0.7, r = 60 + R() * 120; S.fillStyle = _ewRad(S, x, y, 0, r, [[0, _ewA(R() < 0.5 ? "#9b4dff" : "#ff4dd2", 0.22)], [1, "rgba(0,0,0,0)"]]); S.fillRect(0, 0, W, H); }   // the nebula
        for (let k = 0; k < 160; k++) { const x = R() * W, y = R() * H, r = 0.4 + R() * 1.2, c = _ewA("#ffffff", 0.3 + R() * 0.7), b = R() < 0.1 ? 6 : 0; _ewWrap(H, y, 8, yy => _ewDot(M, x, yy, r, c, b)); }   // the stars
        S.save(); S.strokeStyle = "rgba(180,120,255,0.35)"; S.lineWidth = 1.2; const vx = W * 0.5, vy = H * 0.5;
        for (let k = -8; k <= 8; k++) { S.beginPath(); S.moveTo(vx, vy); S.quadraticCurveTo(vx + k * 30, H * 0.75, vx + k * 70, H); S.stroke(); }
        for (let j = 1; j < 9; j++) { const t = Math.pow(j / 9, 1.8), y = vy + (H - vy) * t; S.beginPath(); S.ellipse(vx, y + 10, W * 0.9 * t + 10, 18 * t, 0, Math.PI, 0, true); S.stroke(); }
        S.restore();
        for (let k = 0; k < 12; k++) { const x = R() * W, y = R() * H * 0.8, s = 6 + R() * 12, a = R() * _EW_TAU; S.save(); S.translate(x, y); S.rotate(a); for (const [q, c] of [[s + 9, _ewA("#9b4dff", 0.05)], [s + 5, _ewA("#9b4dff", 0.1)], [s + 2, _ewA("#9b4dff", 0.16)], [s, _ewA("#b48cff", 0.5)]]) { S.fillStyle = c; S.beginPath(); S.moveTo(0, -q); S.lineTo(q * 0.8, q * 0.6); S.lineTo(-q * 0.8, q * 0.6); S.closePath(); S.fill(); } S.restore(); }   // the shards, each with its glow
    },
    core(S, M, B, W, H, R) {
        S.fillStyle = _ewLin(S, 0, 0, 0, H, [[0, "#010a09"], [0.6, "#032a24"], [1, "#064a3e"]]); S.fillRect(0, 0, W, H);
        _ewHex(S, W, H, 28, "rgba(25,230,193,0.16)");
        for (let k = 0; k < 16; k++) { const s = 28, col = Math.floor(R() * W / (s * 1.5)), row = Math.floor(R() * H / (s * Math.sqrt(3))), x = col * s * 1.5, y = row * s * Math.sqrt(3) + (col % 2 ? s * Math.sqrt(3) / 2 : 0); const al = 0.12 + R() * 0.18; for (const [q, k] of [[s * 0.9 + 10, 0.12], [s * 0.9 + 5, 0.22], [s * 0.9, 1]]) { S.fillStyle = _ewA("#19e6c1", al * k); S.beginPath(); for (let j = 0; j < 6; j++) { const a = j / 6 * _EW_TAU; S.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } S.closePath(); S.fill(); } }   // (each lit, with its glow)
        for (const [r, a] of [[W * 0.3, 0.45], [W * 0.42, 0.28], [W * 0.56, 0.16]]) { S.save(); S.strokeStyle = _ewA("#7fffe0", a); S.lineWidth = 2; S.setLineDash([10, 8]); S.beginPath(); S.arc(W * 0.5, H * 0.3, r, 0, _EW_TAU); S.stroke(); S.restore(); }
        for (let k = 0; k < 5; k++) { const x = W * (0.1 + k * 0.2) + (R() - 0.5) * 30; S.fillStyle = _ewLin(S, 0, H, 0, H * 0.3, [[0, "rgba(25,230,193,0.28)"], [1, "rgba(25,230,193,0)"]]); S.fillRect(x - 12, H * 0.3, 24, H * 0.7); }
        S.fillStyle = _ewRad(S, W * 0.5, H * 0.3, 0, W * 0.4, [[0, "rgba(25,230,193,0.3)"], [1, "rgba(25,230,193,0)"]]); S.fillRect(0, 0, W, H);
        for (let k = 0; k < 34; k++) { const x = R() * W, y = R() * H, r = 0.7 + R() * 1.5, c = _ewA(R() < 0.6 ? "#7fffe0" : "#ffffff", 0.4 + R() * 0.5); _ewWrap(H, y, 10, yy => _ewDot(M, x, yy, r, c, 6)); }   // the reactor's sparks (new: the draft had none)
    },
    toxic(S, M, B, W, H, R) {
        S.fillStyle = _ewLin(S, 0, 0, 0, H, [[0, "#020902"], [0.55, "#0a2a0a"], [1, "#164a12"]]); S.fillRect(0, 0, W, H);
        for (const [y, a] of [[0.55, 0.18], [0.7, 0.24], [0.86, 0.3]]) { S.fillStyle = _ewRad(S, W * 0.5, H * y, 0, W * 0.9, [[0, _ewA("#5cff5c", a)], [1, "rgba(0,0,0,0)"]]); S.save(); S.scale(1, 0.35); S.fillRect(0, 0, W, H / 0.35); S.restore(); }   // the fog
        const gp = [[0, 0]]; for (let x = 0; x <= W; x += 18) { const d = R() < 0.25 ? 30 + R() * 70 : 6 + R() * 10; gp.push([x, d]); gp.push([x + 9, 4 + R() * 6]); } gp.push([W, 0]);   // the goo dripping from the top
        const goo = () => { S.beginPath(); gp.forEach(([x, y], i) => i ? S.lineTo(x, y) : S.moveTo(x, y)); S.closePath(); };
        S.save(); S.lineJoin = "round"; for (const [w, k] of [[16, 0.05], [9, 0.09], [4, 0.14]]) { S.strokeStyle = _ewA("#5cff5c", k); S.lineWidth = w; goo(); S.stroke(); } S.fillStyle = "#2bd02b"; S.globalAlpha = 0.55; goo(); S.fill(); S.restore();
        for (let k = 0; k < 34; k++) { const x = R() * W, y = R() * H, r = 2 + R() * 9; _ewWrap(H, y, r + 4, yy => { M.save(); M.strokeStyle = _ewA("#9dff6a", 0.55); M.lineWidth = 1.2; M.beginPath(); M.arc(x, yy, r, 0, _EW_TAU); M.stroke(); _ewDot(M, x - r * 0.35, yy - r * 0.35, r * 0.25, "rgba(230,255,220,0.8)"); M.restore(); }); }   // the bubbles (all the way up, as the embers)
    },
    blossom(S, M, B, W, H, R) {
        S.fillStyle = _ewLin(S, 0, 0, 0, H, [[0, "#14030c"], [0.55, "#3a0a26"], [1, "#6a1a44"]]); S.fillRect(0, 0, W, H);
        for (let k = 0; k < 4; k++) { S.save(); S.globalCompositeOperation = "lighter"; S.fillStyle = _ewLin(S, 0, 0, W * 0.4, H, [[0, "rgba(255,190,230,0.14)"], [1, "rgba(255,190,230,0)"]]); S.translate(W * (0.15 + k * 0.22), -20); S.rotate(-0.35); S.fillRect(0, 0, 26 + R() * 30, H * 1.2); S.restore(); }   // the light
        for (let k = 0; k < 26; k++) { const x = R() * W, y = R() * H, r = 8 + R() * 30; S.fillStyle = _ewRad(S, x, y, 0, r, [[0, _ewA(R() < 0.5 ? "#ff9ccc" : "#ffe0f0", 0.22)], [1, "rgba(255,150,200,0)"]]); S.beginPath(); S.arc(x, y, r, 0, _EW_TAU); S.fill(); }
        for (let k = 0; k < 24; k++) { const x = R() * W, y = R() * H, a = R() * _EW_TAU, s = 4 + R() * 7, c = _ewA(R() < 0.5 ? "#ff7ab8" : "#ffc6e2", 0.75); _ewWrap(H, y, s + 2, yy => { M.save(); M.translate(x, yy); M.rotate(a); M.fillStyle = c; M.beginPath(); M.ellipse(0, 0, s, s * 0.55, 0, 0, _EW_TAU); M.fill(); M.restore(); }); }   // the petals
    },
};
// an element's world, painted once: { scene, motes, bolts } as picture addresses; null where it cannot be painted (no canvas: a test's sandbox)
function energyWorld(el) {
    if (Object.prototype.hasOwnProperty.call(_ewCache, el)) return _ewCache[el];
    let out = null;
    try {
        const P = _EW_PAINT[el], cfg = ENERGY_WORLD[el]; if (!P || !cfg || typeof document === "undefined") return (_ewCache[el] = null);
        const mk = () => { const c = document.createElement("canvas"); c.width = _EW_W; c.height = _EW_H; return c; };
        const cs = mk(), cm = mk(), cb = cfg.bolts ? mk() : null, S = cs.getContext("2d"), M = cm.getContext("2d"), B = cb ? cb.getContext("2d") : null;
        if (!S || !M || typeof S.createLinearGradient !== "function" || typeof cs.toDataURL !== "function") return (_ewCache[el] = null);
        let s = 7; for (const ch of "world" + el) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;   // (the drafts' seed: the same scene)
        P(S, M, B || M, _EW_W, _EW_H, R);
        out = { scene: cs.toDataURL("image/jpeg", 0.88), motes: cm.toDataURL("image/png"), bolts: cb ? cb.toDataURL("image/png") : null };
    } catch (e) { out = null; }
    return (_ewCache[el] = out);
}
function _ewLayer(cls, url) { const i = document.createElement("i"); i.className = cls; if (url) i.style.backgroundImage = 'url("' + url + '")'; return i; }
// ─── public: an energy card's world and its gem, in its .cd-en (js/cardsui.js _cdSlab) ─────────
function energyGemInit(container, el) {
    if (!container || !ENERGY_WORLD[el]) return;   // (an elementless energy card is not dealt)
    container.innerHTML = ""; container.classList.add("ew");
    const w = energyWorld(el), cfg = ENERGY_WORLD[el];
    if (w) {   // its world, in .ew-w (the mask that fades it under the text)
        const wrap = _ewLayer("ew-w"); wrap.appendChild(_ewLayer("ew-bg", w.scene));
        if (w.bolts) wrap.appendChild(_ewLayer("ew-bo", w.bolts));
        const mo = _ewLayer("ew-mo " + cfg.dir, w.motes); mo.style.animationDuration = cfg.secs + "s"; wrap.appendChild(mo);
        container.appendChild(wrap);
    }
    const img = document.createElement("img"); img.className = "ew-gem"; img.alt = ""; img.setAttribute("aria-hidden", "true"); img.decoding = "async";
    img.src = typeof imgSrc === "function" ? imgSrc("img/cards/energy_" + el + ".png") : "img/cards/energy_" + el + ".png";
    container.appendChild(img);
}
