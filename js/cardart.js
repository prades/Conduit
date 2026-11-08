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
//   AN EQUIP CARD  its face wears its element's texture (an ELEMENT card), its class's (a CLASS card) or its species' (a SPECIES card, below), under a dark veil (game.html), with the element's CRYSTAL (an
//                 octahedron in its colour) or, on a class card, the CUBE floating over it (a Mage's aura: the cube in its element's colour). A Player card has no texture: none was designed.
//   A FOLLOWER    its backdrop is its element's texture with its class's laid over it in a paler shade of the element's colour (CARD_ART.tint of the way to white, at CARD_ART.tintAlpha), each cropped to a
//                 band of it (CARD_ART.band) so a wide card shows the part worth seeing. A brawler is a "hybrid" too. The egg carries it before the form does, so the backdrop stays through an evolution. A clone
//                 has none. An evolved form of a species carries its species' texture as a third layer (below).
// THE SPECIES (the following update's Part 2; every look approved by the owner on 2026-11-06, docs/UI-STYLE.md "Gate 2", docs/DECISION-LOG.md; drawn first in design/ui-mocks/part2-looks-art.js, and
// ported here unchanged: the same seeds give the same drawings). The owner: "make themes for the different species and give textures for the different species, and then icons for every different element
// and subclass and species". A species is a MATERIAL, not a hue (the element colours, BLOOM's pink, the class cyan and the Player gold are taken):
//   SPINE-LEGGED  CHITIN AMBER (the Crustacean's, renamed: build 2026-11-08h), a crab shell's bumpy crust, small and faint ("Bumpy shell crust", "Smaller texture", "The design needs to be fainter")
//   MOLLUSK       NACRE, a pearly sheen ("Mollusk: pearly sheen")
//   ELEMENTAL     PRISM WHITE, storm clouds ("puffy and stormy no repreating icons"); on a follower in its element's colour
//   DRONE         GUNMETAL, machined panels
//   JELLY         GEL ORCHID, membrane cells
//   A SPECIES CARD  wears its texture, faint, in its colour, and its colour for its frame, its crystal and its kind line (js/cardsui.js _cdKindCol), its emblem before its kind (CARD_ART_EMBLEMS below).
//   A FOLLOWER    of an evolved form with a species (js/cards.js EQUIP_FORM_SUBCLASS) carries that species' texture as a third layer over the element's and the class's, in the species' colour at
//                 CARD_ART.speciesAlpha, so the element and the class still lead: the crust at half its size (the drawing twice across the band), the others once at their own size (a broad texture laid
//                 twice across would show a seam). An egg has none until it evolves; a retired form has no species (js/cards.js), so none.
//   THE EMBLEMS   flat one-colour emblems after Super Smash Bros.' series symbols (the owner: "Just make it like Super Smash Bros."), our own drawings: one for each species, each element and each enemy race.
// HOW: each picture is a small standalone SVG used as a CSS background (a data: URL, made once and kept). It is set through a class this file writes into one <style> (#cardArtCss), each class setting one CSS
// variable: --tex (a texture or a backdrop), --gem (the crystal or the cube) or --emb (an emblem, with --emc its own colour). The page's CSS lays var(--tex) under its veils (game.html "THE 3D CARDS", "THE
// FOLLOWERS' BACKDROPS") and var(--emb) as a mask before the text (game.html "THE EMBLEMS"). The crystal and the cube are drawn flat, already turned (the same turns as the canvas's CSS ones), so a card is a
// handful of layers, not a dozen.
// Without a page (the test sandbox) the SVG is still made and the classes named; nothing is written.

const CARD_ART = {
    w: 300, h: 420, bandH: 175,        // an equip card's face is drawn on w x h; a follower's backdrop is a w x bandH band of each texture
    classCol: "#8fe3ff",               // a CLASS card's colour (its frame, its texture and its cube), as js/cardsui.js _cdKindCol
    tint: 0.5, tintAlpha: 0.8,         // a follower's class texture: its element's colour taken this far to white, at this opacity
    roles: { brawler: "brawler", sniper: "mage", camper: "technician", hybrid: "brawler" },   // a follower's role (js/species.js) and its class texture
    // the band each texture shows on a wide card: its top, in the 300 x 420 drawing (the flames' feet and tips, the brawler's strike, the facets' middle; a species' from 60, as approved)
    band: { fire: 118, toxic: 20, flux: 62, core: 0, ice: 0, electric: 40, brawler: 22, mage: 110, technician: 0, spinelegged: 60, mollusk: 60, elemental: 60, drone: 60, jelly: 60 },
    gem: { ry: 32, rx: -14 }, cube: { ry: 38, rx: -26 },   // how the crystal and the cube are turned (degrees), as the canvas's CSS
    objScale: 0.75,                    // the crystal and the cube are drawn at the card's size against the canvas's (a 225 px card for its 300)
    // THE SPECIES (approved 2026-11-06): each one's colour (CHITIN AMBER, NACRE, PRISM WHITE, GUNMETAL, GEL ORCHID), and how its texture lies on a follower
    species: { spinelegged: "#e7ad78", mollusk: "#e3d6ff", elemental: "#f2f7ff", drone: "#b6c4d6", jelly: "#e39cff" },
    speciesAlpha: 0.38,                      // a follower's species layer, at this opacity over its element's and its class's
    speciesHalf: { spinelegged: "cuAll" },    // laid at half its size: this drawing (its id) twice across the band
    speciesInElement: { elemental: true },   // laid in the follower's element's colour, not the species' own
};
const CARD_ART_ELEMENTS = ["fire", "electric", "ice", "flux", "core", "toxic"];
const CARD_ART_CLASSES = ["brawler", "mage", "technician"];
const CARD_ART_SPECIES = ["spinelegged", "mollusk", "elemental", "drone", "jelly"];   // js/cards.js EQUIP_SUBCLASSES
const CARD_ART_RACES = ["ant", "beetle", "scorpion", "spider", "mantis", "moth"];      // the enemy races (js/damage.js DMG_RACE)

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
    // ── THE SPECIES (approved 2026-11-06; each drawn in currentColor, faint, its whole drawing in one group with an id, so a follower's band can lay it twice across) ──
    // SPINE-LEGGED (the Crustacean's texture, renamed): a crab shell's knobbly crust. A faint shell tone; rounded knobs gathered in patches (thick in a patch, sparse between), packed close and of three sizes (the big ones, the middle ones,
    // fine granules in the gaps), each a low dome lit from the top left by one shared gradient, with a dark shadow where it rises from the shell
    spinelegged() {
        _caSeed = 23;
        const W = 300, H = 420, knobs = [], H2 = v => Math.round(v * 2) / 2;
        const patches = []; for (let i = 0; i < 16; i++) patches.push({ x: -10 + _caRnd() * (W + 20), y: -10 + _caRnd() * (H + 20), s: 38 + _caRnd() * 34 });
        const near = (x, y) => patches.reduce((m, p) => Math.max(m, Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (2 * p.s * p.s))), 0);   // 1 at a patch's heart, toward 0 between
        const place = (n, tries, r0, r1, gap, floor) => {
            for (let t = 0, k = 0; t < tries && k < n; t++) {
                const x = _caRnd() * W, y = _caRnd() * H; if (_caRnd() > floor + (1 - floor) * near(x, y)) continue;
                const r = r0 + _caRnd() * (r1 - r0);
                if (knobs.every(q => Math.hypot(q.x - x, q.y - y) > q.r + r + gap)) { knobs.push({ x, y, r }); k++; }
            }
        };
        place(70, 3000, 5.6, 8.6, 1.1, .12);    // the big knobs, in the patches
        place(210, 9000, 3.2, 5.2, .9, .2);     // the middle ones
        const big = knobs.length;
        place(150, 9000, 1.3, 2.3, .7, .35);    // fine granules in the gaps
        let plate = "", sock = "", body = "", grain = "";
        patches.forEach(p => { plate += '<circle cx="' + Math.round(p.x) + '" cy="' + Math.round(p.y) + '" r="' + Math.round(p.s * 1.15) + '"/>'; });
        knobs.forEach((q, i) => {
            const c = '<circle cx="' + Math.round(q.x) + '" cy="' + Math.round(q.y) + '" r="' + H2(q.r) + '"/>';
            if (i < big) body += c; else grain += c;
            if (q.r > 4.2) sock += '<circle cx="' + _caR(q.x + q.r * .16) + '" cy="' + _caR(q.y + q.r * .2) + '" r="' + H2(q.r * 1.06) + '"/>';   // where it rises from the shell
        });
        return '<defs><radialGradient id="cuP"><stop offset="0" stop-color="currentColor" stop-opacity=".09"/><stop offset=".7" stop-color="currentColor" stop-opacity=".04"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>'
            + '<radialGradient id="cuK" cx=".42" cy=".38" r=".66" fx=".34" fy=".28"><stop offset="0" stop-color="currentColor" stop-opacity=".46"/><stop offset=".5" stop-color="currentColor" stop-opacity=".28"/>'
            + '<stop offset=".88" stop-color="currentColor" stop-opacity=".13"/><stop offset="1" stop-color="currentColor" stop-opacity=".07"/></radialGradient></defs>'
            + '<g id="cuAll"><rect width="300" height="420" fill="currentColor" fill-opacity=".03"/>'
            + '<g fill="url(#cuP)">' + plate + "</g>"
            + '<g fill="#000" fill-opacity=".2">' + sock + "</g>"
            + '<g fill="url(#cuK)">' + body + "</g>"
            + '<g fill="currentColor" fill-opacity=".17">' + grain + "</g></g>";
    },
    // MOLLUSK: NACRE, the inside of a shell. Broad soft bands of mother-of-pearl (pale pink, lilac, sky, mint, a little gold) flowing across the face, each with a paler core where the light catches, and
    // fine wavy growth lines running with them (the nacre's layers); two soft glows of lustre. No shells drawn. The waves are quadratic curves continued with T.
    mollusk() {
        _caSeed = 41;
        const W = 300, wave = (y0, amp, half, tilt) => {   // a gentle wave across the face, falling to the right
            let d = "M-30 " + _caR(y0) + "Q" + _caR(-30 + half / 2) + " " + _caR(y0 - amp + tilt * half / 2) + " " + _caR(-30 + half) + " " + _caR(y0 + tilt * half);
            for (let x = -30 + 2 * half; x <= W + 30 + half; x += half) d += "T" + _caR(x) + " " + _caR(y0 + tilt * (x + 30));
            return d;
        };
        let bands = "", cores = "", lines = "";
        const hues = ["url(#moA)", "url(#moB)", "url(#moC)"];
        for (let k = 0; k < 8; k++) {
            const y0 = -70 + k * 66 + (_caRnd() - .5) * 26, amp = 6 + _caRnd() * 16, half = 60 + _caRnd() * 70, w = 28 + _caRnd() * 30, d = wave(y0, amp, half, .18 + _caRnd() * .14);
            bands += '<path d="' + d + '" stroke="' + hues[k % 3] + '" stroke-width="' + Math.round(w) + '"/>';
            cores += '<path d="' + d + '" stroke-width="' + Math.round(w * .18) + '"/>';
        }
        for (let y = -96, k = 0; y < 430; y += 12.5, k++) lines += '<path d="' + wave(y, 4 + (k % 3), 64 + (k % 4) * 6, .24) + '"/>';
        return '<defs><linearGradient id="moA" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="420"><stop offset="0" stop-color="#ffc6e6"/><stop offset=".5" stop-color="#d9c8ff"/><stop offset="1" stop-color="#c4e6ff"/></linearGradient>'
            + '<linearGradient id="moB" gradientUnits="userSpaceOnUse" x1="300" y1="0" x2="0" y2="420"><stop offset="0" stop-color="#c4e6ff"/><stop offset=".5" stop-color="#c9ffe4"/><stop offset="1" stop-color="#fff1c2"/></linearGradient>'
            + '<linearGradient id="moC" gradientUnits="userSpaceOnUse" x1="0" y1="420" x2="300" y2="0"><stop offset="0" stop-color="#fff1c2"/><stop offset=".5" stop-color="#ffc6e6"/><stop offset="1" stop-color="#d9c8ff"/></linearGradient>'
            + '<radialGradient id="moL"><stop offset="0" stop-color="#ffffff" stop-opacity=".07"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>'
            + '<g id="moAll"><rect width="300" height="420" fill="currentColor" fill-opacity=".035"/>'
            + '<g fill="none" stroke-opacity=".13" stroke-linecap="round">' + bands + "</g>"
            + '<g fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-linecap="round">' + cores + "</g>"
            + '<g fill="url(#moL)"><ellipse cx="96" cy="120" rx="120" ry="90"/><ellipse cx="220" cy="318" rx="110" ry="84"/></g>'
            + '<g fill="none" stroke="currentColor" stroke-opacity=".1" stroke-width=".55">' + lines + "</g></g>";
    },
    // ELEMENTAL: storm clouds, in high resolution (round 3: the owner, of the soft clouds built in 2026-11-06d, "Ew elemental, storm cloud texture please hi res"; this drawing "Approve as drawn",
    // 2026-11-06). Crisp cloud masses, no soft balls: each mass a silhouette (a solid body under a top edge of billows of their own sizes, a cauliflower edge with fine billows riding the bigger ones,
    // over a flat base), cel-shaded in flat tones: a thin light rim along its top edge, a lit band, a shaded body, a darker underside; a lower fold of billows inside it shaded the same way, so the
    // mass shows its folds as scalloped contours. Stormy: a far deck of heavy cloud behind, the masses overlapping before it, rain shafts under the darkest, a few fine wisps. Flat fills only, so
    // nothing bands. A mass's shading lays its own silhouette again, shifted (a <use> of it); no motif is repeated across the face.
    elemental() {
        _caSeed = 61;
        const circ = (x, y, r) => "M" + _caR(x - r) + " " + _caR(y) + "a" + _caR(r) + " " + _caR(r) + " 0 1 0 " + _caR(2 * r) + " 0a" + _caR(r) + " " + _caR(r) + " 0 1 0 " + _caR(-2 * r) + " 0z";
        // a polygon wound the way the circles are (counterclockwise on the screen), so the union has no holes
        const poly = pts => { const a = pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), l = a > 0 ? pts.slice().reverse() : pts; return "M" + l.map(p => _caR(p[0]) + " " + _caR(p[1])).join("L") + "z"; };
        let defs = "", out = "";
        // a silhouette: billows (radius about rk of the height) whose tops follow top(x) over [xl, xr], fine billows on the bigger ones, and a solid body under them down past the base
        const silhouette = (xl, xr, top, base, rk, fine) => {
            const b = [], s = [], body = [];
            for (let x = xl; x < xr;) { const h = top(x), r = Math.max(4.5, h * (rk + _caRnd() * 0.12)), y = base(x) - h + r + (_caRnd() - .5) * 2.5; b.push([x, y, r]); x += r * (0.55 + _caRnd() * 0.4); }
            b.forEach(([x, y, r]) => { if (r < 7 || _caRnd() > fine) return; for (let i = 0, n = 1 + (_caRnd() < .5 ? 1 : 0); i < n; i++) { const ang = (205 + _caRnd() * 130) * Math.PI / 180, q = 1.6 + _caRnd() * Math.min(4, r * 0.3); s.push([x + Math.cos(ang) * (r - q * 0.35), y + Math.sin(ang) * (r - q * 0.35), q]); } });
            for (let x = xl; x <= xr + 1; x += 10) body.push([x, base(x) - top(x) * 0.62]);   // the body: under the billows' middles, down past the base
            body.push([xr, base(xr) + 12], [xl, base(xl) + 12]);
            return poly(body) + b.concat(s).map(c => circ(c[0], c[1], c[2])).join("");
        };
        // a mass: its flat base at y0 (tilted) from xl to xr, its top a bell peaking hp above the base at xp (width wid); `a` its opacity; a fold, rain shafts under it, or (far) a plainer one
        const mass = (k, xl, xr, y0, hp, xp, wid, tilt, a, fold, rain, far) => {
            const base = x => y0 + tilt * (x - 150), top = x => 16 + hp * Math.exp(-Math.pow((x - xp) / wid, 2)) * (0.85 + 0.15 * Math.sin(x * 0.09 + k * 2));
            defs += '<path id="clS' + k + '" d="' + silhouette(xl, xr, top, base, far ? 0.2 : 0.26, fold ? 0.62 : 0.25) + '"/>'
                + '<clipPath id="clK' + k + '"><use href="#clS' + k + '" xlink:href="#clS' + k + '"/></clipPath>'
                + '<clipPath id="clB' + k + '"><rect x="-60" y="' + _caR(y0 - 400) + '" width="420" height="400" transform="rotate(' + _caR(Math.atan(tilt) * 180 / Math.PI) + ' 150 ' + _caR(y0) + ')"/></clipPath>';
            const u = (id, dx, dy, fill, op) => '<use href="#' + id + '" xlink:href="#' + id + '" x="' + dx + '" y="' + dy + '" fill="' + fill + '"' + (op ? ' fill-opacity="' + op + '"' : "") + "/>";
            const shade = id => (far ? "" : u(id, 0, 0, "#ffffff")) + u(id, 0.4, 1.3, "currentColor") + u(id, 0.7, 6, "#000", ".36");   // a rim, a lit band, the shaded rest
            let g = shade("clS" + k);
            if (fold) {   // the fold: a lower bank of billows across part of the mass
                const fl = xl + (xr - xl) * (0.08 + _caRnd() * 0.25), fr = xr - (xr - xl) * (0.08 + _caRnd() * 0.25), fc = (fl + fr) / 2, fw = (fr - fl) * 0.45;
                const ftop = x => 6 + hp * 0.5 * Math.exp(-Math.pow((x - fc) / fw, 2)), fbase = x => base(x) + 6;
                defs += '<path id="clF' + k + '" d="' + silhouette(fl, fr, ftop, fbase, 0.3, 0.6) + '"/>';
                g += shade("clF" + k);
            }
            g += u("clS" + k, 0, Math.round(hp * 0.42 + 15), "#000", ".38") + u("clS" + k, 0, Math.round(hp * 0.68 + 28), "#000", ".38");   // the underside, darker toward the base
            out += '<g clip-path="url(#clB' + k + ')"><g clip-path="url(#clK' + k + ')" opacity="' + a + '">' + g + "</g></g>";
            if (rain) { let s = ""; for (let i = 0; i < rain; i++) { const x = xl + 20 + _caRnd() * (xr - xl - 40), y = base(x) + 2 + _caRnd() * 5, L = 16 + _caRnd() * 30; s += "M" + _caR(x) + " " + _caR(y) + "l" + _caR(-L * 0.2) + " " + _caR(L); } out += '<path d="' + s + '" stroke="currentColor" stroke-opacity=".1" stroke-width=".7" stroke-linecap="round" fill="none"/>'; }
        };
        let wisps = "";   // fine strands of cloud between the masses
        for (let k = 0; k < 4; k++) { const y = 40 + _caRnd() * 360, x = -10 + _caRnd() * 200, L = 60 + _caRnd() * 80, b = (_caRnd() - .5) * 10; wisps += "M" + _caR(x) + " " + _caR(y) + "q" + _caR(L * 0.45) + " " + _caR(b - 12) + " " + _caR(L) + " " + _caR(b); }
        // back to front: the far deck (heavy, plainer), then the masses, each lower one overlapping the one above it
        mass(0, -40, 340, 150, 110, 210, 110, -0.03, ".07", false, 0, true);
        mass(1, -40, 340, 330, 100, 70, 100, 0.03, ".07", false, 0, true);
        mass(2, -40, 230, 82, 56, 70, 70, -0.04, ".14", true, 0);
        mass(3, 110, 340, 136, 90, 255, 55, 0.03, ".17", true, 8);
        mass(4, -40, 190, 210, 62, 50, 65, 0.05, ".19", true, 0);
        mass(5, 70, 340, 268, 84, 210, 75, -0.03, ".21", true, 9);
        mass(6, -40, 240, 346, 68, 100, 85, 0.02, ".22", true, 0);
        mass(7, 150, 340, 405, 60, 265, 60, -0.05, ".2", true, 0);
        mass(8, -40, 150, 452, 50, 40, 60, 0, ".18", true, 0);
        return "<defs>" + defs + '</defs><g id="clAll"><path d="' + wisps + '" stroke="currentColor" stroke-opacity=".08" stroke-width="1.1" stroke-linecap="round" fill="none"/>' + out + "</g>";
    },
    // DRONE: machined panels. Plating split into panels of uneven sizes, so no layout repeats: each lit along its top and left edges and shaded along its bottom and right, thin dark seams between;
    // rivets at the corners of the larger panels; louvred vents in four of them
    drone() {
        _caSeed = 73;
        const panels = [];
        const split = (x, y, w, h, depth) => {
            const area = w * h;
            if (depth > 0 && (area > 9000 || (area > 3600 && _caRnd() < .55))) {
                if (w > h * (.8 + _caRnd() * .5)) { const c = Math.round(w * (.32 + _caRnd() * .36)); split(x, y, c, h, depth - 1); split(x + c, y, w - c, h, depth - 1); }
                else { const c = Math.round(h * (.32 + _caRnd() * .36)); split(x, y, w, c, depth - 1); split(x, y + c, w, h - c, depth - 1); }
            } else panels.push({ x, y, w, h });
        };
        split(0, 0, 300, 420, 7);
        let plates = "", lit = "", shade = "", rivets = "", slats = "", rims = "";
        const vented = panels.filter(p => p.w > 64 && p.h > 50).filter((p, i) => i % 2 === 0).slice(0, 4);   // four of the larger panels carry vents
        panels.forEach(p => {
            const g = 1.6, x0 = _caR(p.x + g), y0 = _caR(p.y + g), x1 = _caR(p.x + p.w - g), y1 = _caR(p.y + p.h - g);
            plates += "M" + x0 + " " + y0 + "H" + x1 + "V" + y1 + "H" + x0 + "Z";
            lit += "M" + x0 + " " + y1 + "V" + y0 + "H" + x1;
            shade += "M" + x1 + " " + y0 + "V" + y1 + "H" + x0;
            if (p.w > 44 && p.h > 44 && _caRnd() < .7) [[x0 + 5, y0 + 5], [x1 - 5, y0 + 5], [x1 - 5, y1 - 5], [x0 + 5, y1 - 5]].forEach(c => { rivets += '<circle cx="' + _caR(c[0]) + '" cy="' + _caR(c[1]) + '" r="1.3"/>'; });
            if (vented.indexOf(p) >= 0) {   // louvres: each a raised slat lit along its top, its shadow under it
                const n = 4 + Math.floor(_caRnd() * 4), L = Math.min(p.w * .55, 70), sx = p.x + (p.w - L) / 2, sy = p.y + p.h / 2 - (n - 1) * 3.5;
                for (let i = 0; i < n; i++) { const y = sy + i * 7; slats += "M" + _caR(sx) + " " + _caR(y) + "h" + _caR(L); rims += "M" + _caR(sx) + " " + _caR(y + 1.8) + "h" + _caR(L); }
            }
        });
        return '<g id="drAll"><path fill="currentColor" fill-opacity=".04" d="' + plates + '"/>'
            + '<path fill="none" stroke="currentColor" stroke-opacity=".26" stroke-width="1" d="' + lit + '"/>'
            + '<path fill="none" stroke="#000" stroke-opacity=".32" stroke-width="1" d="' + shade + '"/>'
            + '<g fill="currentColor" fill-opacity=".3">' + rivets + "</g>"
            + '<path fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1.2" stroke-linecap="round" d="' + rims + '"/>'
            + '<path fill="none" stroke="currentColor" stroke-opacity=".24" stroke-width="2.2" stroke-linecap="round" d="' + slats + '"/></g>';
    },
    // JELLY: membrane cells. A foam of soft cells packed against each other, the big ones first and smaller ones in the gaps; each a wobbly closed curve (its membrane) with a soft gel fill, about
    // half holding a nucleus of their own size and place. No cell is drawn twice.
    jelly() {
        _caSeed = 89;
        const W = 300, H = 420, cells = [];
        const place = (n, tries, r0, r1) => { for (let t = 0, k = 0; t < tries && k < n; t++) { const r = r0 + _caRnd() * (r1 - r0), x = -10 + _caRnd() * (W + 20), y = -10 + _caRnd() * (H + 20); if (cells.every(c => Math.hypot(c.x - x, c.y - y) > c.r + r + 1.4)) { cells.push({ x, y, r }); k++; } } };
        place(26, 1500, 20, 30); place(60, 4000, 12, 20); place(60, 4000, 6, 12);
        let body = "", nuclei = "";
        cells.forEach(c => {
            const n = 7, ph = _caRnd() * 6.283, amp = .05 + _caRnd() * .07, pts = [];
            for (let i = 0; i < n; i++) { const a = ph + i * 6.283 / n, rr = c.r * (1 + amp * Math.sin(3 * a + ph * 2) + (_caRnd() - .5) * .06); pts.push([c.x + rr * Math.cos(a), c.y + rr * Math.sin(a)]); }
            const mid = (p, q) => Math.round((p[0] + q[0]) / 2) + " " + Math.round((p[1] + q[1]) / 2);
            let d = "M" + mid(pts[n - 1], pts[0]);
            for (let i = 0; i < n; i++) d += "Q" + Math.round(pts[i][0]) + " " + Math.round(pts[i][1]) + " " + mid(pts[i], pts[(i + 1) % n]);
            body += '<path d="' + d + 'Z"/>';
            if (c.r > 9 && _caRnd() < .55) { const a = _caRnd() * 6.283, o = c.r * (.1 + _caRnd() * .25), nr = c.r * (.16 + _caRnd() * .1);
                nuclei += '<ellipse cx="' + Math.round(c.x + o * Math.cos(a)) + '" cy="' + Math.round(c.y + o * Math.sin(a)) + '" rx="' + _caR(nr * (1 + _caRnd() * .3)) + '" ry="' + _caR(nr) + '"/>'; }
        });
        return '<defs><radialGradient id="jeG" cx=".45" cy=".42" r=".62"><stop offset="0" stop-color="currentColor" stop-opacity=".1"/><stop offset=".7" stop-color="currentColor" stop-opacity=".05"/><stop offset="1" stop-color="currentColor" stop-opacity=".02"/></radialGradient></defs>'
            + '<g id="jeAll"><rect width="300" height="420" fill="currentColor" fill-opacity=".025"/>'
            + '<g fill="url(#jeG)" stroke="currentColor" stroke-opacity=".22" stroke-width="1.1">' + body + "</g>"
            + '<g fill="currentColor" fill-opacity=".16">' + nuclei + "</g></g>";
    },
};
const _caTexMemo = {};
function cardArtTexture(key) { if (!_CA_TEX[key]) return ""; if (_caTexMemo[key] === undefined) _caTexMemo[key] = _CA_TEX[key](); return _caTexMemo[key]; }
function _caDoc(w, h, inner) { return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none">' + inner + "</svg>"; }
// AN EQUIP CARD's face: an element's texture, or a class's in the class colour, or a species' in its own colour (300 x 420)
function cardArtFaceSvg(key) {
    if (!_CA_TEX[key]) return "";
    const col = CARD_ART_CLASSES.indexOf(key) >= 0 ? CARD_ART.classCol : CARD_ART.species[key] || null;
    return _caDoc(CARD_ART.w, CARD_ART.h, col ? '<g color="' + col + '">' + cardArtTexture(key) + "</g>" : cardArtTexture(key));
}
// A FOLLOWER's backdrop: its element's band, then its class's band over it in the paler shade (300 x 175); with `sp`, its species' texture over both (the third layer: CARD_ART.speciesAlpha,
// in the species' colour or, for the storm clouds, the element's; the crust at half its size, its drawing twice across)
function cardArtMixSvg(el, cls, sp) {
    if (!_CA_TEX[el] || !_CA_TEX[cls]) return "";
    const W = CARD_ART.w, H = CARD_ART.bandH, band = (k, extra) => '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 ' + (CARD_ART.band[k] || 0) + " " + W + " " + H + '" preserveAspectRatio="xMidYMid slice"' + (extra || "") + ">" + cardArtTexture(k) + "</svg>";
    let third = "";
    if (sp && _CA_TEX[sp] && CARD_ART.species[sp]) {
        const a = ' color="' + (CARD_ART.speciesInElement[sp] ? cardArtElementColour(el) : CARD_ART.species[sp]) + '" opacity="' + CARD_ART.speciesAlpha + '"', id = CARD_ART.speciesHalf[sp];
        third = id ? '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 ' + (CARD_ART.band[sp] || 0) + " " + 2 * W + " " + 2 * H + '" preserveAspectRatio="xMidYMid slice"' + a + ">" + cardArtTexture(sp) + '<use href="#' + id + '" xlink:href="#' + id + '" x="' + W + '"/></svg>'
                   : band(sp, a);
    }
    return _caDoc(W, H, band(el) + band(cls, ' color="' + cardArtMix(cardArtElementColour(el), "#ffffff", CARD_ART.tint) + '" opacity="' + CARD_ART.tintAlpha + '"') + third);
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

// ── THE EMBLEMS (approved 2026-11-06): flat, one-colour emblems in the manner of Super Smash Bros.' series symbols (the owner's reference), our own drawings, not that game's symbols. Each is one solid shape
// on a 32-unit square built from discs, wedges and bars, its details cut out of it (each cut wound the other way, so the ordinary nonzero fill leaves it open). On the page an emblem takes the colour of the
// text beside it (a mask, game.html "THE EMBLEMS"), or its own colour (col) where the approved mockups showed it so: the roster's subclass tag.
const _caArea = pts => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);   // > 0: clockwise on the screen (y down)
const _caPoly = (pts, cw) => { const l = (_caArea(pts) > 0) === cw ? pts : pts.slice().reverse(); return "M" + l.map(p => _caR(p[0]) + " " + _caR(p[1])).join("L") + "Z"; };
const _caEll = (cx, cy, rx, ry, cw) => { const f = cw ? 1 : 0; return "M" + _caR(cx - rx) + " " + _caR(cy) + "A" + rx + " " + ry + " 0 1 " + f + " " + _caR(cx + rx) + " " + _caR(cy) + "A" + rx + " " + ry + " 0 1 " + f + " " + _caR(cx - rx) + " " + _caR(cy) + "Z"; };
const _caDisc = (cx, cy, r) => _caEll(cx, cy, r, r, true);
const _caPie = (cx, cy, r, mid, half) => { const a = (mid + half) * Math.PI / 180, b = (mid - half) * Math.PI / 180; return "M" + _caR(cx) + " " + _caR(cy) + "L" + _caR(cx + r * Math.cos(a)) + " " + _caR(cy + r * Math.sin(a)) + "A" + r + " " + r + " 0 1 1 " + _caR(cx + r * Math.cos(b)) + " " + _caR(cy + r * Math.sin(b)) + "Z"; };   // a disc with a wedge open at `mid` degrees
const _caBar = (pts, w) => { let d = ""; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L * w / 2, ny = (bx - ax) / L * w / 2; d += _caPoly([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], true); if (i) d += _caDisc(ax, ay, w / 2); } return d; };   // a bent limb, its knees rounded
const _caMx = pts => pts.map(p => [32 - p[0], p[1]]), _caBoth = (pts, w) => _caBar(pts, w) + _caBar(_caMx(pts), w);   // a limb and its mirror
const CARD_ART_EMBLEMS = {
    // THE SPECIES, each in its colour
    spinelegged: { col: "#e7ad78", d() {   // (the Crustacean's emblem, renamed) a crab: open claws on raised arms, eyes on stalks, three legs a side, an arched ridge cut across the shell
        let d = _caEll(16, 19.6, 9, 6.2, true);                                                                   // the shell
        d += _caBoth([[13.4, 14.6], [12.7, 11]], 1.6) + _caDisc(12.5, 9.9, 1.9) + _caDisc(19.5, 9.9, 1.9);       // the eyes on their stalks
        d += _caBoth([[10.2, 15.8], [7.4, 11.8]], 2.6) + _caPie(6.4, 8.4, 4.7, -112, 30) + _caPie(25.6, 8.4, 4.7, -68, 30);   // the arms and the open claws
        [[[8.2, 18.4], [3.8, 17], [2.2, 20.2]], [[8, 21.2], [3.8, 22.4], [2.8, 25.8]], [[10.4, 24.2], [7.2, 26.4], [6.8, 29.6]]].forEach(l => { d += _caBoth(l, 1.9); });   // the legs
        return d + "M10.6 19.4Q16 16.6 21.4 19.4Q16 14.6 10.6 19.4Z";                                            // cut: the arched ridge across the shell
    } },
    mollusk: { col: "#e3d6ff", d() {   // a snail's coiled shell: the coil, the flared lip with its mouth, a spiral groove
        const d = _caDisc(14.5, 14.5, 11) + _caEll(23.2, 24.6, 6.6, 4.6, true);
        const k = (8.2 - 1.2) / (2.25 * 2 * Math.PI), w = 1.4, out = [], inn = [];
        for (let t = 0; t <= 2.25 * 2 * Math.PI + 1e-6; t += 0.18) { const r = 1.2 + k * t, a = t + 2.2; out.push([14.5 + (r + w / 2) * Math.cos(a), 14.5 + (r + w / 2) * Math.sin(a)]); inn.push([14.5 + Math.max(.2, r - w / 2) * Math.cos(a), 14.5 + Math.max(.2, r - w / 2) * Math.sin(a)]); }
        return d + _caPoly(out.concat(inn.reverse()), false) + _caEll(24.6, 25.8, 2.8, 1.8, false);             // cut: the groove, and the shell's mouth
    } },
    elemental: { col: "#f2f7ff", d() {   // three crystal prisms from one root, each with its front edge cut
        const prism = (cx, by, hw, h, tip, ang) => { const c = Math.cos(ang * Math.PI / 180), sn = Math.sin(ang * Math.PI / 180), T = p => [cx + p[0] * c - p[1] * sn, by + p[0] * sn + p[1] * c];
            return _caPoly([[0, -h - tip], [hw, -h], [hw, -hw * .6], [0, 0], [-hw, -hw * .6], [-hw, -h]].map(T), true) + _caPoly([[-.45, -h + .6], [.45, -h + .6], [.45, -hw * .6 - 1.4], [-.45, -hw * .6 - 1.4]].map(T), false); };
        return prism(16, 29.5, 3.7, 19, 6, 0) + prism(12.6, 29, 2.9, 12.5, 4.6, -27) + prism(19.4, 29, 2.9, 12.5, 4.6, 27);
    } },
    drone: { col: "#b6c4d6", d() {   // a round body with a visor slot and its eye, two antennae, two feet
        const d = _caDisc(16, 18.4, 9.6) + _caBoth([[12.6, 10.2], [9.6, 4]], 1.6) + _caDisc(9.3, 3.6, 1.8) + _caDisc(22.7, 3.6, 1.8) + _caBoth([[11.4, 26], [9.8, 30]], 2);
        return d + "M11.5 15.6A2.6 2.6 0 0 0 11.5 20.8L20.5 20.8A2.6 2.6 0 0 0 20.5 15.6Z" + _caDisc(16, 18.2, 1.7);   // cut: the visor (the eye stays)
    } },
    jelly: { col: "#e39cff", d() {   // a jellyfish: the bell with a scalloped rim, four trailing tendrils, a sheen cut into the bell
        let d = "M4.5 16.5A11.5 11 0 0 1 27.5 16.5Q25.6 19.7 23.6 16.9Q21.6 19.9 19.6 16.9Q17.8 19.9 16 16.9Q14.2 19.9 12.4 16.9Q10.4 19.9 8.4 16.9Q6.4 19.7 4.5 16.5Z";
        d += _caBoth([[8.8, 17.4], [7.5, 21.4], [9.1, 25.4], [7.9, 29.6]], 1.7) + _caBoth([[13.2, 17.8], [12.3, 22.2], [13.8, 26.4], [12.9, 30.6]], 1.6);
        const band = []; for (let a = 200; a <= 252; a += 4) band.push([16 + 9.6 * Math.cos(a * Math.PI / 180), 16.5 + 9.6 * Math.sin(a * Math.PI / 180)]);
        for (let a = 252; a >= 200; a -= 4) band.push([16 + 8 * Math.cos(a * Math.PI / 180), 16.5 + 8 * Math.sin(a * Math.PI / 180)]);
        return d + _caPoly(band, false);
    } },
    // THE ELEMENTS, each in its colour (drawn and approved; where they show is not chosen yet: docs/OPEN-QUESTIONS.md)
    fire: { col: "#ff3d14", d() {   // a flame, its heart cut out
        return "M16 30C9 30 6 25 6.5 20C7 15 10.5 12.5 11.5 8.5C13 11 13.5 12.5 13.5 14.5C15.5 11.5 16.5 7 15.5 2.5C20.5 5.5 25.5 11.5 25.5 19.5C25.5 25.5 21.5 30 16 30Z"
            + "M16 27C19 27 21 25 21 22.5C21 21 20.5 19.5 19 17.5C19 19 18.5 20 17.5 21C17.5 19.5 16.5 18 14.5 16C14 18.5 12 19.5 11.5 22C11 24.5 12.5 27 16 27Z";
    } },
    toxic: { col: "#66ff66", d() {   // bubbles: a big one, a middle one, two small, each of the two big ones with a glint cut into it
        const glint = (cx, cy, r0, r1) => { const p = []; for (let a = 196; a <= 256; a += 6) p.push([cx + r1 * Math.cos(a * Math.PI / 180), cy + r1 * Math.sin(a * Math.PI / 180)]); for (let a = 256; a >= 196; a -= 6) p.push([cx + r0 * Math.cos(a * Math.PI / 180), cy + r0 * Math.sin(a * Math.PI / 180)]); return _caPoly(p, false); };
        return _caDisc(12.5, 19, 8.5) + _caDisc(23.5, 10.5, 5.2) + _caDisc(25, 23.5, 3.2) + _caDisc(7.6, 6.6, 2.2) + glint(12.5, 19, 4.6, 6.4) + glint(23.5, 10.5, 2.6, 3.8);
    } },
    electric: { col: "#ffee33", d() { return _caPoly([[13.5, 1.5], [22.5, 1.5], [17, 12.5], [24.5, 12.5], [10.5, 30.5], [14.5, 17.5], [7.5, 17.5]], true); } },   // a bolt
    ice: { col: "#99ddff", d() {   // a snowflake: six arms, each with a pair of twigs, round a small hexagon
        let d = _caPoly([0, 1, 2, 3, 4, 5].map(i => [16 + 3.4 * Math.cos((i * 60 - 90) * Math.PI / 180), 16 + 3.4 * Math.sin((i * 60 - 90) * Math.PI / 180)]), true);
        for (let i = 0; i < 6; i++) { const a = (i * 60 - 90) * Math.PI / 180, b0 = [16 + 8 * Math.cos(a), 16 + 8 * Math.sin(a)];
            d += _caBar([[16 + 2 * Math.cos(a), 16 + 2 * Math.sin(a)], [16 + 13.6 * Math.cos(a), 16 + 13.6 * Math.sin(a)]], 2.4);
            [-1, 1].forEach(sg => { const b = a + sg * 0.8; d += _caBar([b0, [b0[0] + 4.6 * Math.cos(b), b0[1] + 4.6 * Math.sin(b)]], 2); }); }
        return d;
    } },
    flux: { col: "#9933ff", d() {   // a vortex: three arms swirling round an eye
        let d = _caDisc(16, 16, 3.6);
        for (let k = 0; k < 3; k++) { const o = [], inn = [];
            for (let t = 0; t <= 1.0001; t += .08) { const a = (k * 120 + 165 * t) * Math.PI / 180, r = 4 + 10.5 * t, w = t < .4 ? 1.6 + 7 * t : 4.4 * (1 - t) / .6 + .4;
                o.push([16 + r * Math.cos(a), 16 + r * Math.sin(a)]); inn.push([16 + (r - w) * Math.cos(a - .12), 16 + (r - w) * Math.sin(a - .12)]); }
            d += _caPoly(o.concat(inn.reverse()), true); }
        return d + _caEll(16, 16, 1.6, 1.6, false);   // cut: the eye
    } },
    core: { col: "#00ccaa", d() {   // a hexagon cell: an outer hexagon, a ring cut out of it, a hexagon at its heart
        const hex = (r, cw) => _caPoly([0, 1, 2, 3, 4, 5].map(i => [16 + r * Math.cos((i * 60 - 90) * Math.PI / 180), 16 + r * Math.sin((i * 60 - 90) * Math.PI / 180)]), cw);
        return hex(14, true) + hex(9.6, false) + hex(5.8, true);
    } },
    // THE ENEMY RACES, in the enemy colour
    ant: { col: "#ff8a6a", d() {   // head, waist and banded abdomen, bent legs, feelers
        let d = _caDisc(16, 6.6, 3) + _caEll(16, 13, 2.3, 2.6, true) + _caEll(16, 22.6, 5, 6.5, true);          // head, waist, abdomen
        d += _caBoth([[14.6, 4.6], [12.2, 1.9], [9.8, 1.6]], 1.4);                                                // the feelers
        [[[14.2, 12], [9.5, 9.6], [7.4, 6.6]], [[14, 13.2], [8.6, 14], [5.6, 17.6]], [[14.4, 14.6], [10, 19.4], [8.6, 25]]].forEach(l => { d += _caBoth(l, 1.7); });   // the legs
        return d + _caPoly([[12.2, 21.5], [19.8, 21.5], [19.8, 22.5], [12.2, 22.5]], false) + _caPoly([[12.6, 25.2], [19.4, 25.2], [19.4, 26.2], [12.6, 26.2]], false);   // cut: the abdomen's bands
    } },
    beetle: { col: "#ff8a6a", d() {   // a horned beetle: the shell split down its back, the line of the pronotum, six bent legs
        let d = _caEll(16, 19, 8.5, 10, true) + _caEll(16, 7.5, 4.2, 3.4, true) + _caPoly([[15, 5], [16, .8], [17.6, 1.6], [17, 5.2]], true);
        [[[9.5, 13.5], [5.5, 11.5], [3.5, 8]], [[8.2, 18.5], [3.8, 19], [2, 22.5]], [[9, 24], [5.5, 27], [5, 30.5]]].forEach(l => { d += _caBoth(l, 1.7); });
        return d + _caPoly([[10.2, 12.1], [21.8, 12.1], [21.8, 13], [10.2, 13]], false) + _caPoly([[15.55, 13.8], [16.45, 13.8], [16.45, 28], [15.55, 28]], false);   // cuts: the pronotum's line, the split of the shell
    } },
    scorpion: { col: "#ff8a6a", d() {   // open pincers, eight short legs, the tail curling up to its sting
        let d = _caEll(16, 15, 4.6, 6, true) + _caBoth([[13.4, 11], [9.8, 8.6], [8.4, 7.4]], 2) + _caPie(7.5, 5.5, 3.4, -115, 28) + _caPie(24.5, 5.5, 3.4, -65, 28);
        [[[12, 13], [7.5, 12.5], [5.6, 14.6]], [[11.6, 15.4], [7, 16.2], [5.4, 18.6]], [[11.8, 17.6], [7.6, 19.6], [6.6, 22.2]], [[12.6, 19.6], [9.6, 23], [9.4, 25.6]]].forEach(l => { d += _caBoth(l, 1.4); });
        [[16, 22.5, 2.9], [16.6, 26, 2.7], [18.6, 28.8, 2.5], [21.8, 29.6, 2.3], [24.6, 27.6, 2.1], [25.6, 24.4, 1.9]].forEach(q => { d += _caDisc(q[0], q[1], q[2]); });   // the tail's segments, overlapping into one curl
        return d + _caPoly([[24.4, 23.6], [27.2, 22.6], [25.2, 19.4]], true);                                     // the sting
    } },
    spider: { col: "#ff8a6a", d() {   // the round abdomen with a mark cut in it, the head, eight long bent legs
        let d = _caEll(16, 20.5, 6.2, 7, true) + _caEll(16, 10, 4, 3.6, true);
        [[[13, 9], [8, 4.5], [4.5, 6.5]], [[12.6, 10.4], [6.5, 8.8], [2.6, 12.4]], [[12.6, 11.8], [6.8, 14.4], [3.2, 19.4]], [[13.2, 12.8], [8.6, 18.6], [6.4, 25]]].forEach(l => { d += _caBoth(l, 1.5); });
        return d + _caPoly([[16, 17.4], [17.6, 20.2], [16, 23], [14.4, 20.2]], false);                            // cut: the mark on its back
    } },
    mantis: { col: "#ff8a6a", d() {   // the triangular head with its eyes, the long neck, the folded raptor arms with hooks, a banded abdomen, four legs
        let d = _caPoly([[11.8, 3.2], [20.2, 3.2], [16, 8]], true) + _caDisc(12, 3.6, 1.6) + _caDisc(20, 3.6, 1.6) + _caBar([[16, 7.6], [16, 15.2]], 2.2) + _caEll(16, 22.6, 3.8, 7.6, true);
        d += _caBoth([[15, 10.6], [10.2, 7.6], [8.6, 13.6]], 1.9) + _caPoly([[8.2, 13.2], [6.6, 12.4], [8.6, 11.4]], true) + _caPoly([[23.8, 13.2], [25.4, 12.4], [23.4, 11.4]], true);   // the arms and their hooks
        [[[14.6, 15.6], [9.4, 18.8], [7.6, 24.6]], [[14.4, 18], [10, 23.6], [9.4, 30]]].forEach(l => { d += _caBoth(l, 1.3); });
        return d + _caPoly([[13.2, 20.6], [18.8, 20.6], [18.8, 21.4], [13.2, 21.4]], false) + _caPoly([[13.4, 24.6], [18.6, 24.6], [18.6, 25.4], [13.4, 25.4]], false);   // cuts: the abdomen's bands
    } },
    moth: { col: "#ff8a6a", d() {   // four spread wings with an eyespot cut in each upper one, the body, the head, two feelers
        let d = _caEll(16, 17, 1.8, 8.5, true) + _caDisc(16, 7.6, 2);
        d += _caPoly([[14.6, 10], [7.5, 4.5], [2, 6], [2.4, 13.5], [7, 17.5], [14.4, 15.6]], true) + _caPoly([[17.4, 10], [24.5, 4.5], [30, 6], [29.6, 13.5], [25, 17.5], [17.6, 15.6]], true);
        d += _caPoly([[14.4, 17], [8, 18.5], [4.5, 23.5], [7.5, 28], [12.5, 26.5], [14.8, 21]], true) + _caPoly([[17.6, 17], [24, 18.5], [27.5, 23.5], [24.5, 28], [19.5, 26.5], [17.2, 21]], true);
        d += _caBoth([[15.2, 6.2], [13, 2.4], [10.2, 1.4]], 1.2);
        return d + _caEll(7, 10.5, 1.8, 1.8, false) + _caEll(25, 10.5, 1.8, 1.8, false);                          // cuts: the eyespots
    } },
};
const _caEmbMemo = {};
function cardArtEmblemPath(key) { const E = CARD_ART_EMBLEMS[key]; if (!E) return ""; if (_caEmbMemo[key] === undefined) _caEmbMemo[key] = E.d(); return _caEmbMemo[key]; }
// an emblem as a 32 x 32 picture, in `col` or its own colour
function cardArtEmblemSvg(key, col) { const d = cardArtEmblemPath(key); return d ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><path d="' + d + '" fill="' + (col || CARD_ART_EMBLEMS[key].col) + '"/></svg>' : ""; }

// ── THE CLASSES ON THE PAGE ──
// data: URLs, made once each
const _caUrls = {};
function cardArtUrl(key, make) { if (_caUrls[key] === undefined) { const svg = make(); _caUrls[key] = svg ? "data:image/svg+xml," + encodeURIComponent(svg) : ""; } return _caUrls[key]; }
// one rule per class in #cardArtCss, written the first time the class is asked for (`extra`: more declarations in it)
let _caSheet = null; const _caRules = {};
function _caRule(cls, prop, url, extra) {
    if (!url) return "";
    if (_caRules[cls]) return cls;
    _caRules[cls] = true;
    try {
        if (typeof document === "undefined" || !document.createElement || !document.head || typeof document.head.appendChild !== "function") return cls;
        if (!_caSheet) { _caSheet = document.getElementById && document.getElementById("cardArtCss"); if (!_caSheet) { _caSheet = document.createElement("style"); _caSheet.id = "cardArtCss"; document.head.appendChild(_caSheet); } }
        _caSheet.appendChild(document.createTextNode("." + cls + "{" + prop + ':url("' + url + '")' + (extra ? ";" + extra : "") + "}\n"));
    } catch (e) { /* a picture must never take a screen down */ }
    return cls;
}
// a follower's role, as a class texture (null for none)
function cardArtClassOfRole(role) { return CARD_ART.roles[role] || null; }
// a species' colour (a species card's frame, texture, crystal and kind line), or null
function cardArtSpeciesColour(sp) { return CARD_ART.species[sp] || null; }
// a follower's species, for its look: an evolved form's (js/cards.js equipSubclassOf); null for an egg, a retired form (which has none) or a clone
function cardArtSpeciesOf(f) { const s = f && !f.isClone && typeof equipSubclassOf === "function" ? equipSubclassOf(f) : null; return s && CARD_ART.species[s] ? s : null; }
// the class that gives an equip card's face its texture: "" for a card with none (a Player card)
function cardArtFaceClass(c) {
    if (!c) return "";
    const key = c.kind === "element" && CARD_ART_ELEMENTS.indexOf(c.match) >= 0 ? c.match : c.kind === "class" ? cardArtClassOfRole(c.match) : c.kind === "subclass" && CARD_ART.species[c.match] ? c.match : c.kind === "form" && CARD_ART_ELEMENTS.indexOf(c.el) >= 0 ? c.el : null;   // (a card attack: its form's element)
    return key ? _caRule("cat-c-" + key, "--tex", cardArtUrl("c:" + key, () => cardArtFaceSvg(key))) : "";
}
// the class that gives a follower its backdrop: "" for a clone or anything not a follower with an element and a role; an evolved form of a species has its species' layer too (cat-f-<el>-<class>-<species>)
function cardArtUnitClass(f) {
    if (!f || f.isClone || f.isFollower !== true) return "";
    const el = CARD_ART_ELEMENTS.indexOf(f.element) >= 0 ? f.element : null, cls = cardArtClassOfRole(f.role);
    if (!el || !cls) return "";
    const sp = cardArtSpeciesOf(f);
    return sp ? _caRule("cat-f-" + el + "-" + cls + "-" + sp, "--tex", cardArtUrl("f:" + el + ":" + cls + ":" + sp, () => cardArtMixSvg(el, cls, sp)))
              : _caRule("cat-f-" + el + "-" + cls, "--tex", cardArtUrl("f:" + el + ":" + cls, () => cardArtMixSvg(el, cls)));
}
// THE EMBLEMS ON THE PAGE: an emblem's class (cae-<key>) sets --emb (its picture, laid as a mask so it takes the colour of the text it sits in) and --emc (its own colour); game.html "THE EMBLEMS"
// draws it before the text. "" for none.
function cardArtEmblemClass(key) { const E = CARD_ART_EMBLEMS[key]; return E ? _caRule("cae-" + key, "--emb", cardArtUrl("e:" + key, () => cardArtEmblemSvg(key)), "--emc:" + E.col) : ""; }
// the emblem before a card's kind line (on its face, its hologram's shadow and its details): a species card's species'; "" for the rest (where the element emblems go is not chosen yet)
function cardArtKindEmblemClass(c) { return c && c.kind === "subclass" && CARD_ART.species[c.match] ? cardArtEmblemClass(c.match) : ""; }
// an enemy's race emblem (the enemy card, before its name): its race's (js/damage.js DMG_RACE), "" for a creature of none
function cardArtRaceEmblemClass(a) { const r = a && a.speciesName; return r && CARD_ART_RACES.indexOf(r) >= 0 ? cardArtEmblemClass(r) : ""; }
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
const CARD_ITEMS = {
    ids: ["ember_plating", "furnace_heart", "cinderbrand", "venom_gland", "corrosive_reservoir", "mireblight", "charged_wiring", "arc_capacitor", "static_lock",   // all eighteen of Pack 1, by element (fire, toxic,
          "frost_lining", "permafrost_shell", "rime_snare", "flux_cell", "vortex_core", "siphon_field", "impact_studs", "bedrock_matrix", "repulsor_pulse",    // electric, ice, flux, core), each Unrefined to Precision
          "kindling_band",    // the first class-card item (docs/FOLLOWING-UPDATE.md Part 3, gate 3; build 2026-11-07j), approved 2026-11-07 ("Approve it")
          "spore_band", "ionic_band", "chill_band", "phase_band", "lodestone_band",   // the other bands (build 2026-11-07k), the same family: approved 2026-11-07 ("Approve all five")
          "hearth_sigil", "miasma_sigil", "voltaic_sigil", "glacial_sigil", "warp_sigil", "keystone_sigil",   // the sigils (build 2026-11-07l, design/cards/models/_sigil.js): approved 2026-11-07 ("Approve all six")
          "inferno_crown", "pestilence_crown", "tempest_crown", "winter_crown", "eclipse_crown", "monolith_crown",   // the crowns (build 2026-11-07m, design/cards/models/_crown.js): approved 2026-11-07 ("Approve all six")
          // (the Brawler's PRESSURE SPUR, FAULTLINE TALON and RUPTURE FANG have no item: the owner, 2026-11-07, "No, just skip these items"; they keep the cube)
          "chitin_scale",    // the first Series 2 item (build 2026-11-07o; docs/SERIES-2.md, one piece first): approved 2026-11-07 ("Approve it")
          "barnacle_bracer", "pincer_clamp", "tide_shell",   // the Crustacean's other three (build 2026-11-07p, design/cards/models/_crust.js): approved 2026-11-07 ("Approve all three")
          "mantle_gel", "nacre_pearl", "siphon_slime", "regrowth_sac",   // the Mollusk's four (build 2026-11-07q, design/cards/models/_mollusk.js): approved 2026-11-07 ("Approve all four")
          "raw_shard", "focusing_prism", "attuned_core", "storm_heart",   // the Elemental's four (build 2026-11-07r, design/cards/models/_elemental.js): approved 2026-11-07 ("Approve all four")
          "servo_oil", "gyro_stabilizer", "hunter_optics", "overclock_chip",   // the Drone's four (build 2026-11-07s, design/cards/models/_drone.js): approved 2026-11-07 ("Approve all four")
          "gel_membrane", "stinger_tendril", "nematocyst", "amorphous_body",   // the Jelly's four (build 2026-11-07t, design/cards/models/_jelly.js): approved 2026-11-07 ("Approve all four")
          "spare_parts_kit", "capacitor_bank", "field_multitool", "double_cell"],   // the Technician's four (build 2026-11-07u, design/cards/models/_tech.js): approved 2026-11-07 ("Approve all four")
    // approved: all eighteen of Pack 1. EMBER PLATING 2026-11-01 ("The ember plating looks good"), live since build 2026-11-01j; the other seventeen 2026-11-01 ("Yes push the card art for everyone"), live since build 2026-11-01n
    approved: ["ember_plating", "furnace_heart", "cinderbrand", "venom_gland", "corrosive_reservoir", "mireblight", "charged_wiring", "arc_capacitor", "static_lock",
               "frost_lining", "permafrost_shell", "rime_snare", "flux_cell", "vortex_core", "siphon_field", "impact_studs", "bedrock_matrix", "repulsor_pulse",
               "kindling_band",    // KINDLING BAND: the owner, 2026-11-07, "Approve it" (live for everyone since build 2026-11-07k)
               "spore_band", "ionic_band", "chill_band", "phase_band", "lodestone_band",   // the other five: "Approve all five" (live since build 2026-11-07l)
               "hearth_sigil", "miasma_sigil", "voltaic_sigil", "glacial_sigil", "warp_sigil", "keystone_sigil",   // the sigils: "Approve all six" (live since build 2026-11-07m)
               "inferno_crown", "pestilence_crown", "tempest_crown", "winter_crown", "eclipse_crown", "monolith_crown",   // the crowns: "Approve all six" (live since build 2026-11-07n)
               "chitin_scale",    // CHITIN SCALE: "Approve it" (live since build 2026-11-07p)
               "barnacle_bracer", "pincer_clamp", "tide_shell",   // the Crustacean's other three: "Approve all three" (live since build 2026-11-07q)
               "mantle_gel", "nacre_pearl", "siphon_slime", "regrowth_sac",   // the Mollusk's four: "Approve all four" (live since build 2026-11-07r)
               "raw_shard", "focusing_prism", "attuned_core", "storm_heart",   // the Elemental's four: "Approve all four" (live since build 2026-11-07s)
               "servo_oil", "gyro_stabilizer", "hunter_optics", "overclock_chip",   // the Drone's four: "Approve all four" (live since build 2026-11-07t)
               "gel_membrane", "stinger_tendril", "nematocyst", "amorphous_body",   // the Jelly's four: "Approve all four" (live since build 2026-11-07u)
               "spare_parts_kit", "capacitor_bank", "field_multitool", "double_cell"],   // the Technician's four: "Approve all four" (live since build 2026-11-07v). Every built card has its item now, bar the Brawler's three (skipped)
};
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
