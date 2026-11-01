// ─────────────────────────────────────────────────────────
//  CARD ART — the equip cards' textures, crystals and cubes, and the followers' backdrops (docs/UI-STYLE.md "The 3D cards and the backdrops")
// ─────────────────────────────────────────────────────────
// ASKED (2026-11-01, the design canvas "Conduit 3D card concepts"): "a cooler looking card system that has actual cards that look 3D ... 3D looking object inside the card, and the card itself is kind of
// like tilted a little bit on an axis ... the text might be a raised hologram, but all the stuff from the concept should still show like the rarity chips and the slanted style, italicized, bold." Then, of the
// chosen board: "instead of just a solid sheen sort of background for each one, let's make a texture for each element ... in the background and have a gradient upon them and not be too vibrant, to just be real
// subtle"; then "change the ice texture a lot ... the ice texture should look more like the mage texture", "the electric texture should be switched with the technician texture" (and a new one designed for
// electric), "the backgrounds for the creature or the follower evolutions and followers in general have this background as well ... mixed. So we have the fire and the brawler background mixed together";
// and "Make an update to implement this style".
//
//   THE TEXTURES  one for each element: FIRE flames (crisp tongues in three rows, a smaller flame nested in each, embers), TOXIC bubbles, FLUX a vortex, CORE hexagons, ICE cut ice (the mage's facets made
//                 finer, light caught on some edges, glints, frost at the top), ELECTRIC forked lightning. One for each class (a follower's role): BRAWLER impact cracks, MAGE broad facets, TECHNICIAN
//                 circuit traces. The brawler's cracks and the electric lightning are designs of ours, not the owner's (the owner named the other seven). Each is a drawing on a 300 x 420 box (an equip card's
//                 face), seeded, so it is the same on every load.
//   AN EQUIP CARD  its face wears its element's texture (an ELEMENT card) or its class's (a CLASS card), under a dark veil (game.html), with the element's CRYSTAL (an octahedron in its colour) or, on a class
//                 card, the CUBE floating over it. A Universal or a Subclass card (only test cards so far) has no texture: none was designed.
//   A FOLLOWER    its backdrop is its element's texture with its class's laid over it in a paler shade of the element's colour (CARD_ART.tint of the way to white, at CARD_ART.tintAlpha), each cropped to a
//                 band of it (CARD_ART.band) so a wide card shows the part worth seeing. A brawler is a "hybrid" too. The egg carries it before the form does, so the backdrop stays through an evolution. A clone
//                 has none.
// HOW: each picture is a small standalone SVG used as a CSS background (a data: URL, made once and kept). It is set through a class this file writes into one <style> (#cardArtCss), each class setting one CSS
// variable: --tex (a texture or a backdrop) or --gem (the crystal or the cube). The page's CSS lays var(--tex) under its veils (game.html "THE 3D CARDS", "THE FOLLOWERS' BACKDROPS"). The crystal and the cube
// are drawn flat, already turned (the same turns as the canvas's CSS ones), so a card is a handful of layers, not a dozen.
// Without a page (the test sandbox) the SVG is still made and the classes named; nothing is written.

const CARD_ART = {
    w: 300, h: 420, bandH: 175,        // an equip card's face is drawn on w x h; a follower's backdrop is a w x bandH band of each texture
    classCol: "#8fe3ff",               // a CLASS card's colour (its frame, its texture and its cube), as js/cardsui.js _cdKindCol
    tint: 0.5, tintAlpha: 0.8,         // a follower's class texture: its element's colour taken this far to white, at this opacity
    roles: { brawler: "brawler", sniper: "mage", camper: "technician", hybrid: "brawler" },   // a follower's role (js/species.js) and its class texture
    // the band each texture shows on a wide card: its top, in the 300 x 420 drawing (the flames' feet and tips, the brawler's strike, the facets' middle)
    band: { fire: 118, toxic: 20, flux: 62, core: 0, ice: 0, electric: 40, brawler: 22, mage: 110, technician: 0 },
    gem: { ry: 32, rx: -14 }, cube: { ry: 38, rx: -26 },   // how the crystal and the cube are turned (degrees), as the canvas's CSS
    objScale: 0.75,                    // the crystal and the cube are drawn at the card's size against the canvas's (a 225 px card for its 300)
};
const CARD_ART_ELEMENTS = ["fire", "electric", "ice", "flux", "core", "toxic"];
const CARD_ART_CLASSES = ["brawler", "mage", "technician"];

// ── small helpers ──
let _caSeed = 1;
function _caRnd() { _caSeed = (_caSeed * 1103515245 + 12345) & 0x7fffffff; return _caSeed / 0x7fffffff; }
const _caR = v => Math.round(v * 10) / 10;
const _caPts = pts => pts.map(p => _caR(p[0]) + "," + _caR(p[1])).join(" ");
function _caHex(c) { const s = String(c || "#8fe3ff").replace("#", ""), f = s.length === 3 ? s.split("").map(x => x + x).join("") : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16) || 0); }
function cardArtMix(a, b, t) { const A = _caHex(a), B = _caHex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); }
function cardArtElementColour(el) { const d = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === el) : null; return d ? d.color : ({ fire: "#ff3300", electric: "#ffee33", ice: "#99ddff", flux: "#9933ff", core: "#00ccaa", toxic: "#66ff66" })[el] || "#8fe3ff"; }

// ── THE TEXTURES: each the inside of a 300 x 420 drawing (its own <defs> with ids no other texture uses, so any two can share a document) ──
// one flame tongue: a round foot at (cx, by), a pointed tip h above it that leans by `lean`
function _caFlame(cx, by, h, w, lean) {
    const P = (x, y) => _caR(x) + " " + _caR(y);
    return "M" + P(cx, by) + " C" + P(cx - w * .62, by) + " " + P(cx - w * .52, by - h * .44) + " " + P(cx - w * .12 + lean * .4, by - h * .7)
        + " C" + P(cx + lean * .2, by - h * .84) + " " + P(cx + lean * .75, by - h * .9) + " " + P(cx + lean, by - h)
        + " C" + P(cx + w * .2 + lean * .5, by - h * .72) + " " + P(cx + w * .62, by - h * .42) + " " + P(cx + w * .5, by - h * .16)
        + " C" + P(cx + w * .42, by) + " " + P(cx + w * .16, by) + " " + P(cx, by) + "Z";
}
function _caBolt(x0, y0, x1, y1, n, jit) {
    const pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    for (let i = 1; i < n; i++) { const t = i / n, j = (_caRnd() - .5) * 2 * jit; pts.push([x0 + dx * t + nx * j, y0 + dy * t + ny * j]); }
    pts.push([x1, y1]); return pts;
}
const _CA_TEX = {
    // FIRE: crisp tongues (no blur) in three rows, tall red at the back, orange, short gold in front, each with a smaller one in the next colour nested in its foot; embers with short trails
    fire() {
        _caSeed = 11;
        const row = (n, by, hMin, hMax, wMin, wMax, x0, x1) => { const out = []; for (let i = 0; i < n; i++) { const cx = x0 + (x1 - x0) * (i + .5) / n + (_caRnd() - .5) * 16, h = hMin + _caRnd() * (hMax - hMin), w = wMin + _caRnd() * (wMax - wMin), lean = (_caRnd() - .5) * w * .9; out.push([cx, by + (_caRnd() - .5) * 14, h, w, lean]); } return out; };
        const draw = (rows, k) => rows.map(t => '<path d="' + _caFlame(t[0], t[1], t[2] * k, t[3] * k, t[4] * k) + '"/>').join("");
        const back = row(6, 336, 165, 215, 96, 120, -20, 320), mid = row(5, 326, 120, 160, 78, 98, 0, 300), front = row(5, 318, 80, 110, 58, 74, 20, 280);
        let emb = "";
        for (let i = 0; i < 16; i++) { const x = 24 + _caRnd() * 252, y = 26 + _caRnd() * 170, rr = .8 + _caRnd() * 1.3, o = _caR(.25 + _caRnd() * .45), tl = 2 + _caRnd() * 3; emb += '<circle cx="' + _caR(x) + '" cy="' + _caR(y) + '" r="' + _caR(rr) + '" fill-opacity="' + o + '"/><line x1="' + _caR(x) + '" y1="' + _caR(y + rr) + '" x2="' + _caR(x - tl * .3) + '" y2="' + _caR(y + rr + tl) + '" stroke-opacity="' + _caR(o * .35) + '"/>'; }
        return "<defs>" + [["fgR", "#ff3300"], ["fgO", "#ff7a1f"], ["fgY", "#ffc24a"], ["fgW", "#fff0b0"]].map(([id, c]) => '<linearGradient id="' + id + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + c + '" stop-opacity=".34"/><stop offset=".55" stop-color="' + c + '" stop-opacity=".22"/><stop offset="1" stop-color="' + c + '" stop-opacity=".05"/></linearGradient>').join("")
            + '<radialGradient id="fgG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff5a1f" stop-opacity=".2"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient></defs>'
            + '<ellipse cx="150" cy="300" rx="220" ry="150" fill="url(#fgG)"/>'
            + '<g fill="url(#fgR)" stroke="#ff6a3d" stroke-opacity=".38" stroke-width=".8">' + draw(back, 1) + '</g><g fill="url(#fgO)">' + draw(back, .6) + "</g>"
            + '<g fill="url(#fgO)" stroke="#ff9a4a" stroke-opacity=".36" stroke-width=".8">' + draw(mid, 1) + '</g><g fill="url(#fgY)">' + draw(mid, .58) + "</g>"
            + '<g fill="url(#fgY)" stroke="#ffd27a" stroke-opacity=".32" stroke-width=".7">' + draw(front, 1) + '</g><g fill="url(#fgW)">' + draw(front, .52) + "</g>"
            + '<g fill="#ffd9a0" stroke="#ffb066" stroke-width=".7" stroke-linecap="round">' + emb + "</g>";
    },
    // TOXIC: bubbles, each with a highlight
    toxic() {
        const B = [[97.8, 226.1, 16.3], [194.8, 221.1, 23.8], [258, 48.3, 21.5], [74.5, 93.5, 24], [35.3, 165.9, 23.9], [38.7, 276, 5.6], [230.5, 301.7, 22.6], [180.7, 208.5, 6.2], [252, 46.2, 8.9], [58, 30.3, 20.3], [212.1, 348, 18.6], [237.3, 302.2, 20.5], [108.1, 77.1, 5.7], [119.6, 133.8, 17.5], [101.4, 352.3, 20], [72.1, 195.6, 15.6]];
        return '<g fill="#66ff66" fill-opacity=".045" stroke="#66ff66" stroke-opacity=".26" stroke-width="1.2">' + B.map(b => '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '"/>').join("") + "</g>"
            + '<g fill="#e1ffe1" fill-opacity=".38">' + B.map(b => '<circle cx="' + _caR(b[0] - b[2] * .38) + '" cy="' + _caR(b[1] - b[2] * .4) + '" r="' + _caR(Math.max(1.2, b[2] * .18)) + '"/>').join("") + "</g>";
    },
    // FLUX: a vortex, three spiral arms round the crystal (and three thin ones turned against them), in a violet haze
    flux() {
        const arms = []; for (let a = 0; a < 3; a++) { const pts = []; for (let i = 0; i <= 56; i++) { const t = i / 56, ang = a * 2.0944 + t * 2.3 * 6.2832, r = 8 + 152 * Math.pow(t, 1.15); pts.push(_caR(150 + r * Math.cos(ang)) + " " + _caR(150 + r * Math.sin(ang) * .92)); } arms.push("M" + pts.join(" L")); }
        const P = arms.map((d, i) => '<path id="caVa' + i + '" d="' + d + '"/>').join("");
        const haze = [[50, .2], [160, .14], [280, .18]].map(([deg, o]) => { const a0 = (deg - 25 - 16) * Math.PI / 180, a1 = (deg + 25 - 16) * Math.PI / 180, R = 120; return '<path d="M' + _caR(150 + R * Math.cos(a0)) + " " + _caR(176 + R * Math.sin(a0)) + " A" + R + " " + R + " 0 0 1 " + _caR(150 + R * Math.cos(a1)) + " " + _caR(176 + R * Math.sin(a1)) + '" stroke-opacity="' + o + '"/>'; }).join("");
        return '<defs><radialGradient id="fxh"><stop offset="0" stop-color="#46197a" stop-opacity=".42"/><stop offset="1" stop-color="#46197a" stop-opacity="0"/></radialGradient><filter id="fxb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>'
            + '<circle cx="150" cy="150" r="170" fill="url(#fxh)"/><g fill="none" stroke="#9933ff" stroke-width="58" stroke-linecap="round" filter="url(#fxb)">' + haze + "</g>"
            + '<g fill="none" stroke="#be78ff" stroke-opacity=".26" stroke-width="2.4" stroke-linecap="round" transform="translate(150 150) rotate(-18) scale(1 .9) translate(-150 -150)">' + P + "</g>"
            + '<g fill="none" stroke="#be78ff" stroke-opacity=".14" stroke-width="1.2" stroke-linecap="round" transform="translate(150 150) rotate(42) scale(1 .9) translate(-150 -150)">' + [0, 1, 2].map(i => '<use href="#caVa' + i + '" xlink:href="#caVa' + i + '"/>').join("") + "</g>";
    },
    // CORE: hexagons, a few of them filled
    core() {
        const hx = "28,12.1 21,24.2 7,24.2 0,12.1 7,0 21,0";
        return '<defs><pattern id="hexp" width="42" height="24.2" patternUnits="userSpaceOnUse"><g fill="none" stroke="#00ccaa" stroke-opacity=".22" stroke-width="1"><polygon points="' + hx + '"/><polygon points="49,24.2 42,36.4 28,36.4 21,24.2 28,12.1 42,12.1"/><polygon points="49,0 42,12.1 28,12.1 21,0 28,-12.1 42,-12.1"/></g></pattern></defs>'
            + '<rect width="300" height="420" fill="url(#hexp)"/><g fill="#00ccaa" fill-opacity=".09" stroke="#00ccaa" stroke-opacity=".32" stroke-width="1">' + [[84, 48], [210, 97], [42, 218], [231, 266], [147, 12]].map(p => '<polygon points="' + hx + '" transform="translate(' + p[0] + " " + p[1] + ')"/>').join("") + "</g>";
    },
    // ICE: cut ice: a jittered lattice (slanted, so the shards run on a diagonal) cut into triangles of pale ice, light caught on some edges, glints at a few corners, frost along the top
    ice() {
        _caSeed = 23;
        const C = 6, R = 9, W = 300, H = 420, P = [];
        for (let j = 0; j <= R; j++) { const row = []; for (let i = 0; i <= C; i++) {
            const ex = i === 0 || i === C, ey = j === 0 || j === R;
            let x = i * W / C + (ex ? 0 : (_caRnd() - .5) * W / C * .78), y = j * H / R + (ey ? 0 : (_caRnd() - .5) * H / R * .78);
            if (!ex && !ey) x += (j - R / 2) * 7;
            if (ex && !ey) y += (_caRnd() - .5) * H / R * .5; if (ey && !ex) x += (_caRnd() - .5) * W / C * .5;
            row.push([Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y))]); } P.push(row); }
        const OP = [.015, .03, .03, .045, .05, .06, .08, .1, .13];
        let tri = "", hi = "", gl = "";
        for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
            const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i], T = _caRnd() < .5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
            T.forEach(t => { const top = 1 - Math.min(1, (t[0][1] + t[1][1] + t[2][1]) / 3 / H) * .5; tri += '<polygon points="' + _caPts(t) + '" fill-opacity="' + _caR(OP[Math.floor(_caRnd() * OP.length)] * top * 100) / 100 + '"/>'; });
            if (_caRnd() < .3) { const e = _caRnd() < .5 ? [a, c] : [b, d], s = .15 + _caRnd() * .2, f = .6 + _caRnd() * .3; hi += '<line x1="' + _caR(e[0][0] + (e[1][0] - e[0][0]) * s) + '" y1="' + _caR(e[0][1] + (e[1][1] - e[0][1]) * s) + '" x2="' + _caR(e[0][0] + (e[1][0] - e[0][0]) * f) + '" y2="' + _caR(e[0][1] + (e[1][1] - e[0][1]) * f) + '" stroke-opacity="' + _caR(.25 + _caRnd() * .3) + '"/>'; }
        }
        [[2, 1, 1], [4, 2, .8], [1, 4, .7], [5, 5, .9], [3, 3, .6]].forEach(([i, j, k]) => { const p = P[j][i]; gl += '<path transform="translate(' + _caR(p[0]) + " " + _caR(p[1]) + ") scale(" + k + ')" d="M0 -8L1.2 -1.2L8 0L1.2 1.2L0 8L-1.2 1.2L-8 0L-1.2 -1.2Z"/>'; });
        return '<defs><linearGradient id="ifr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f8ff" stop-opacity=".09"/><stop offset=".32" stop-color="#e8f8ff" stop-opacity="0"/></linearGradient></defs>'
            + '<g fill="#99ddff" stroke="#d8f3ff" stroke-opacity=".13" stroke-width=".6" stroke-linejoin="round">' + tri + "</g>"
            + '<g stroke="#ffffff" stroke-width=".9" stroke-linecap="round">' + hi + "</g>"
            + '<rect width="300" height="420" fill="url(#ifr)"/><g fill="#f0fbff" fill-opacity=".55">' + gl + "</g>";
    },
    // ELECTRIC: forked lightning, a wide soft glow under a thin bright core, sparks
    electric() {
        _caSeed = 37;
        const A = _caBolt(34, 22, 212, 262, 11, 15), B = _caBolt(278, 46, 118, 242, 9, 13), C = _caBolt(158, 10, 198, 120, 6, 8);
        const br = [_caBolt(A[4][0], A[4][1], A[4][0] - 58, A[4][1] + 46, 4, 7), _caBolt(A[7][0], A[7][1], A[7][0] + 52, A[7][1] + 34, 4, 7), _caBolt(B[3][0], B[3][1], B[3][0] + 36, B[3][1] + 58, 4, 7), _caBolt(B[6][0], B[6][1], B[6][0] - 44, B[6][1] + 20, 3, 6)];
        const main = [A, B, C].map(p => '<polyline points="' + _caPts(p) + '"/>').join(""), side = br.map(p => '<polyline points="' + _caPts(p) + '"/>').join("");
        let sp = "";
        for (let i = 0; i < 10; i++) { const x = _caR(30 + _caRnd() * 240), y = _caR(20 + _caRnd() * 240), rr = _caR(.8 + _caRnd() * 1); sp += '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" opacity="' + _caR(.3 + _caRnd() * .45) + '"/>'; }
        return '<defs><radialGradient id="egz"><stop offset="0" stop-color="#ffee33" stop-opacity=".12"/><stop offset="1" stop-color="#ffee33" stop-opacity="0"/></radialGradient>'
            + '<filter id="eb5" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter><filter id="eb1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>'
            + '<circle cx="150" cy="140" r="160" fill="url(#egz)"/><g fill="none" stroke-linejoin="round" stroke-linecap="round">'
            + '<g stroke="#ffee33" stroke-width="7" opacity=".16" filter="url(#eb5)">' + main + side + "</g>"
            + '<g stroke="#ffee33" stroke-width="2.4" opacity=".32" filter="url(#eb1)">' + main + '</g><g stroke="#ffee33" stroke-width="1.4" opacity=".26" filter="url(#eb1)">' + side + "</g>"
            + '<g stroke="#fff8c4" stroke-width="1" opacity=".62">' + main + '</g><g stroke="#fff8c4" stroke-width=".7" opacity=".5">' + side + "</g></g>"
            + '<g fill="#fff3a0">' + sp + "</g>";
    },
    // BRAWLER (a class: drawn in currentColor): a strike point, cracks radiating from it with side branches, broken rings round it, chips
    brawler() {
        _caSeed = 53;
        const P = [78, 104], N = 9, cracks = [];
        for (let k = 0; k < N; k++) {
            let a = (k / N) * Math.PI * 2 + (_caRnd() - .5) * .5, x = P[0], y = P[1]; const pts = [[x, y]];
            for (let i = 0; i < 10; i++) { const L = 16 + _caRnd() * 30; a += (_caRnd() - .5) * .55; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]); if (x < -12 || x > 312 || y < -12 || y > 432) break; }
            cracks.push(pts);
        }
        let main = "", inner = "", br = "", rings = "", chips = "";
        cracks.forEach(pts => { main += '<polyline points="' + _caPts(pts) + '"/>'; inner += '<polyline points="' + _caPts(pts.slice(0, 3)) + '"/>'; });
        cracks.forEach((pts, k) => { const i0 = 2 + (k % 3); if (k % 2 || pts.length < i0 + 2) return; let [x, y] = pts[i0]; let a = Math.atan2(pts[i0 + 1][1] - pts[i0][1], pts[i0 + 1][0] - pts[i0][0]) + (k % 4 ? .75 : -.75); const b = [[x, y]]; for (let i = 0; i < 3; i++) { const L = 10 + _caRnd() * 18; a += (_caRnd() - .5) * .5; x += Math.cos(a) * L; y += Math.sin(a) * L; b.push([x, y]); } br += '<polyline points="' + _caPts(b) + '"/>'; });
        [[36, .3], [76, .22]].forEach(([R, op]) => { const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, rr = R * (1 + (_caRnd() - .5) * .3); pts.push([P[0] + Math.cos(a) * rr, P[1] + Math.sin(a) * rr]); } [[0, 6], [7, 12], [13, 18]].forEach(([s, e]) => { rings += '<polyline points="' + _caPts(pts.slice(s, e)) + '" opacity="' + op + '"/>'; }); });
        for (let i = 0; i < 6; i++) { const a = _caRnd() * Math.PI * 2, d = 16 + _caRnd() * 36, cx = P[0] + Math.cos(a) * d, cy = P[1] + Math.sin(a) * d, sz = 4 + _caRnd() * 7; chips += '<polygon points="' + _caPts([[cx, cy], [cx + sz, cy + sz * .4], [cx + sz * .3, cy + sz]]) + '"/>'; }
        return '<defs><filter id="bb4" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter></defs>'
            + '<circle cx="' + P[0] + '" cy="' + P[1] + '" r="9" fill="currentColor" opacity=".35" filter="url(#bb4)"/>'
            + '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round"><g stroke-width="1.1" opacity=".34">' + main + '</g><g stroke-width="2" opacity=".5">' + inner + '</g><g stroke-width=".8" opacity=".28">' + br + '</g><g stroke-width=".9">' + rings + "</g></g>"
            + '<g fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-opacity=".3" stroke-width=".6">' + chips + "</g>";
    },
    // MAGE (a class): broad facets of cut glass
    mage() {
        const F = [["0,0 150,0 60,120", .05], ["150,0 300,0 300,110", .08], ["150,0 300,110 60,120", .035], ["0,0 60,120 0,200", .07], ["0,200 60,120 180,210", .05], ["60,120 300,110 180,210", .09], ["300,110 300,260 180,210", .06], ["0,200 180,210 90,330", .04], ["180,210 300,260 240,340", .07], ["0,200 90,330 0,420", .06], ["90,330 240,340 150,420", .05], ["240,340 300,260 300,420", .08], ["90,330 180,210 240,340", .03], ["0,420 150,420 90,330", .07], ["150,420 300,420 240,340", .04]];
        return '<g fill="currentColor" stroke="currentColor" stroke-opacity=".16" stroke-width=".8">' + F.map(f => '<polygon points="' + f[0] + '" fill-opacity="' + f[1] + '"/>').join("") + "</g>";
    },
    // TECHNICIAN (a class): circuit traces with pads and a chip, a 72 px cell tiled, every other cell mirrored
    technician() {
        const cell = '<g id="caTr" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M6 10h20l8 8v18h30"/><path d="M8 62h22v-12h30"/><path d="M66 6v14l-6 6h-16"/><path d="M14 24v10l6 6v10"/>'
            + '<g fill="currentColor" stroke="none"><circle cx="6" cy="10" r="2.2"/><circle cx="64" cy="36" r="2.2"/><circle cx="8" cy="62" r="2.2"/><circle cx="60" cy="50" r="2.2"/><circle cx="66" cy="6" r="2.2"/><circle cx="44" cy="26" r="2.2"/><circle cx="14" cy="24" r="2.2"/><circle cx="20" cy="50" r="2.2"/><circle cx="52" cy="12" r="1.5"/></g>'
            + '<rect x="42" y="56" width="14" height="9" fill="currentColor" fill-opacity=".28"/></g>';
        let tiles = "";
        for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) tiles += (i + j) % 2 ? '<use href="#caTr" xlink:href="#caTr" transform="translate(' + (i * 72 + 72) + " " + (j * 72) + ') scale(-1 1)"/>' : '<use href="#caTr" xlink:href="#caTr" x="' + (i * 72) + '" y="' + (j * 72) + '"/>';
        return "<defs>" + cell + '</defs><g opacity=".38">' + tiles + "</g>";
    },
};
const _caTexMemo = {};
function cardArtTexture(key) { if (!_CA_TEX[key]) return ""; if (_caTexMemo[key] === undefined) _caTexMemo[key] = _CA_TEX[key](); return _caTexMemo[key]; }
function _caDoc(w, h, inner) { return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none">' + inner + "</svg>"; }
// AN EQUIP CARD's face: an element's texture, or a class's in the class colour (300 x 420)
function cardArtFaceSvg(key) {
    if (!_CA_TEX[key]) return "";
    return _caDoc(CARD_ART.w, CARD_ART.h, CARD_ART_CLASSES.indexOf(key) >= 0 ? '<g color="' + CARD_ART.classCol + '">' + cardArtTexture(key) + "</g>" : cardArtTexture(key));
}
// A FOLLOWER's backdrop: its element's band, then its class's band over it in the paler shade (300 x 175)
function cardArtMixSvg(el, cls) {
    if (!_CA_TEX[el] || !_CA_TEX[cls]) return "";
    const W = CARD_ART.w, H = CARD_ART.bandH, band = (k, extra) => '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 ' + (CARD_ART.band[k] || 0) + " " + W + " " + H + '" preserveAspectRatio="xMidYMid slice"' + (extra || "") + ">" + cardArtTexture(k) + "</svg>";
    return _caDoc(W, H, band(el) + band(cls, ' color="' + cardArtMix(cardArtElementColour(el), "#ffffff", CARD_ART.tint) + '" opacity="' + CARD_ART.tintAlpha + '"'));
}

// ── THE CRYSTAL AND THE CUBE: turned as the canvas's CSS turns them (rotateY, then rotateX), drawn flat, only the faces that look at you ──
function _caTurn(v, ry, rx) {
    const a = ry * Math.PI / 180, b = rx * Math.PI / 180, x1 = v[0] * Math.cos(a) + v[2] * Math.sin(a), z1 = -v[0] * Math.sin(a) + v[2] * Math.cos(a), y1 = v[1];
    return [x1, y1 * Math.cos(b) - z1 * Math.sin(b), y1 * Math.sin(b) + z1 * Math.cos(b)];   // (the browser's rotateY and rotateX: +z comes toward you, +y is down)
}
// faces: [[v...], paint] in 3D; returns the SVG with the faces that face you, painted, inside a box round them
function _caSolid(faces, ry, rx, defs, extra) {
    const out = [], all = [];
    faces.forEach(([vs, paint]) => {
        const P = vs.map(v => _caTurn(v, ry, rx)), c = [0, 1, 2].map(i => P.reduce((s, p) => s + p[i], 0) / P.length);
        const u = [0, 1, 2].map(i => P[1][i] - P[0][i]), w = [0, 1, 2].map(i => P[2][i] - P[0][i]);
        let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        if (n[0] * c[0] + n[1] * c[1] + n[2] * c[2] < 0) n = n.map(x => -x);   // (outward, from the middle)
        P.forEach(p => all.push(p));
        if (n[2] > 1e-6) out.push({ pts: P, z: c[2], paint });
    });
    out.sort((a, b) => a.z - b.z);
    // a box round it with its middle (the solid's centre) at the middle, drawn at CARD_ART.objScale (the card's size against the canvas's): so it sits where it is put
    const hw = Math.max(...all.map(p => Math.abs(p[0]))) + 3, hh = Math.max(...all.map(p => Math.abs(p[1]))) + 3, k = CARD_ART.objScale;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + _caR(2 * hw * k) + '" height="' + _caR(2 * hh * k) + '" viewBox="' + _caR(-hw) + " " + _caR(-hh) + " " + _caR(2 * hw) + " " + _caR(2 * hh) + '">' + "<defs>" + defs + "</defs>"
        + out.map(f => '<polygon points="' + _caPts(f.pts) + '" ' + f.paint + (extra || "") + "/>").join("") + "</svg>";
}
const _caGrad = (id, a, b, x2, y2) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 === undefined ? 0 : x2) + '" y2="' + (y2 === undefined ? 1 : y2) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
// THE CRYSTAL: an octahedron, a square of 56 round its middle and points 39 above and below it (the canvas's), lit from above and the front
function cardArtGemSvg(col) {
    const E = 28, H = 39, T = [0, -H, 0], B = [0, H, 0], Q = [[-E, 0, E], [E, 0, E], [E, 0, -E], [-E, 0, -E]], k = (t) => cardArtMix(col, "#000000", t), l = (t) => cardArtMix(col, "#ffffff", t);
    const defs = '<linearGradient id="g0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="' + l(.3) + '"/><stop offset="1" stop-color="' + col + '"/></linearGradient>'
        + _caGrad("g1", l(.3), k(.3)) + _caGrad("g3", col, k(.6)) + _caGrad("h0", col, k(.65)) + _caGrad("h1", k(.3), k(.8)) + _caGrad("h3", k(.4), k(.75));
    const up = ['fill="url(#g0)"', 'fill="url(#g1)"', 'fill="' + k(.55) + '"', 'fill="url(#g3)"'], dn = ['fill="url(#h0)"', 'fill="url(#h1)"', 'fill="' + k(.75) + '"', 'fill="url(#h3)"'];
    const faces = [];
    for (let i = 0; i < 4; i++) { faces.push([[T, Q[i], Q[(i + 1) % 4]], up[i]]); faces.push([[B, Q[(i + 1) % 4], Q[i]], dn[i]]); }
    return _caSolid(faces, CARD_ART.gem.ry, CARD_ART.gem.rx, defs, ' fill-opacity=".94" stroke="#ffffff" stroke-opacity=".18" stroke-width=".6" stroke-linejoin="round"');
}
// THE CUBE (a class card's): 60 a side, its top, its front and its left (the canvas's showed two faces and the glow; this shows the third it was missing)
function cardArtCubeSvg(col) {
    const s = 30, k = (t) => cardArtMix(col, "#000000", t), l = (t) => cardArtMix(col, "#ffffff", t);
    const defs = '<linearGradient id="c0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".62"/><stop offset="1" stop-color="' + col + '" stop-opacity=".66"/></linearGradient>'
        + _caGrad("c1", k(.45), k(.75), 1, 1) + _caGrad("c2", "#ffffff", l(.2), 1, 1);
    const faces = [[[[-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]], 'fill="url(#c0)"'], [[[-s, -s, -s], [-s, -s, s], [-s, s, s], [-s, s, -s]], 'fill="url(#c1)"'], [[[-s, -s, -s], [s, -s, -s], [s, -s, s], [-s, -s, s]], 'fill="url(#c2)"']];
    return _caSolid(faces, CARD_ART.cube.ry, CARD_ART.cube.rx, defs, ' stroke="#ffffff" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"');
}

// ── THE CLASSES ON THE PAGE ──
// data: URLs, made once each
const _caUrls = {};
function cardArtUrl(key, make) { if (_caUrls[key] === undefined) { const svg = make(); _caUrls[key] = svg ? "data:image/svg+xml," + encodeURIComponent(svg) : ""; } return _caUrls[key]; }
// one rule per class in #cardArtCss, written the first time the class is asked for
let _caSheet = null; const _caRules = {};
function _caRule(cls, prop, url) {
    if (!url) return "";
    if (_caRules[cls]) return cls;
    _caRules[cls] = true;
    try {
        if (typeof document === "undefined" || !document.createElement || !document.head || typeof document.head.appendChild !== "function") return cls;
        if (!_caSheet) { _caSheet = document.getElementById && document.getElementById("cardArtCss"); if (!_caSheet) { _caSheet = document.createElement("style"); _caSheet.id = "cardArtCss"; document.head.appendChild(_caSheet); } }
        _caSheet.appendChild(document.createTextNode("." + cls + "{" + prop + ':url("' + url + '")}\n'));
    } catch (e) { /* a picture must never take a screen down */ }
    return cls;
}
// a follower's role, as a class texture (null for none)
function cardArtClassOfRole(role) { return CARD_ART.roles[role] || null; }
// the class that gives an equip card's face its texture: "" for a card with none (a Universal or a Subclass card)
function cardArtFaceClass(c) {
    if (!c) return "";
    const key = c.kind === "element" && CARD_ART_ELEMENTS.indexOf(c.match) >= 0 ? c.match : c.kind === "class" ? cardArtClassOfRole(c.match) : null;
    return key ? _caRule("cat-c-" + key, "--tex", cardArtUrl("c:" + key, () => cardArtFaceSvg(key))) : "";
}
// the class that gives a follower its backdrop: "" for a clone or anything not a follower with an element and a role
function cardArtUnitClass(f) {
    if (!f || f.isClone || f.isFollower !== true) return "";
    const el = CARD_ART_ELEMENTS.indexOf(f.element) >= 0 ? f.element : null, cls = cardArtClassOfRole(f.role);
    return el && cls ? _caRule("cat-f-" + el + "-" + cls, "--tex", cardArtUrl("f:" + el + ":" + cls, () => cardArtMixSvg(el, cls))) : "";
}
// the class of an equip card's floating object: the cube on a CLASS card, else the crystal, in the card's colour
function cardArtObjectClass(c, col) {
    const cube = !!(c && c.kind === "class"), h = _caHex(col).map(v => v.toString(16).padStart(2, "0")).join(""), hex = "#" + h;
    return cube ? _caRule("cac-" + h, "--gem", cardArtUrl("cube:" + h, () => cardArtCubeSvg(hex))) : _caRule("cag-" + h, "--gem", cardArtUrl("gem:" + h, () => cardArtGemSvg(hex)));
}
// THE CARD ITEMS (ASKED 2026-11-01: "give 3D item looks instead of crystal for the first packs designs ... the item itself needs to be a 3D object that hovers out of the picture of the card itself"; the owner's
// pick: the game-model look, modelled in 3D and lit like the followers and props). Each is a model baked by design/cards/bake_items.js to img/cards/<card id>.png. docs/ART-PROCESS.md: ONE piece first, and the
// crystal stays until the owner approves the look. So each item is approved on its own:
//   ids        every card whose item is baked (its model in design/cards/models, its picture in img/cards)
//   approved   the ones the owner approved: shown to everyone. The rest show only on a preview (?cardart=items), so the next piece can be looked at while the approved ones stay on.
const CARD_ITEMS = { ids: ["ember_plating"], approved: ["ember_plating"] };   // EMBER PLATING approved 2026-11-01 ("The ember plating looks good"), live since build 2026-11-01j
function cardArtItemsPreview() { try { return typeof location !== "undefined" && /[?&]cardart=items\b/.test(location.search || ""); } catch (e) { return false; } }
// the picture of a card's item, or "" (none baked, or not approved and no preview)
function cardArtItemUrl(c) {
    if (!c || CARD_ITEMS.ids.indexOf(c.id) < 0 || !(CARD_ITEMS.approved.indexOf(c.id) >= 0 || cardArtItemsPreview())) return "";
    return "img/cards/" + c.id + ".png?v=" + (typeof BUILD_VERSION !== "undefined" ? BUILD_VERSION : "");
}
// put `cls` on `el` in place of whatever art class it wore under `slot` (one per slot; "" takes it off); cheap when nothing changed, so a card updated in place every redraw can call it
function cardArtMark(el, cls, slot) {
    if (!el || !el.classList) return;
    const k = "_ca" + (slot || "tex"), old = el[k] || "";
    if (old === (cls || "")) return;
    if (old) el.classList.remove(old);
    if (cls) el.classList.add(cls);
    el[k] = cls || "";
}
