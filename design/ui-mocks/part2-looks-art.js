// THE FOLLOWING UPDATE'S PART 2, GATE 2: the looks proposed for the owner's approval (docs/FOLLOWING-UPDATE.md Part 2; docs/UI-STYLE.md "Proposed for gate 2").
// PROPOSALS ONLY: nothing here is in the game. docs/ART-PROCESS.md: one piece first, so this draws one piece of each family (the CRUSTACEAN texture, one icon of each set, one race's row on the enemy card) and the
// rest waits for the owner's yes or correction. Drawn in the game's own way (js/cardart.js: a texture is an SVG drawing on the 300 x 420 card face, in currentColor).
// THE OWNER'S CORRECTIONS (2026-11-06; docs/DECISION-LOG.md). Round 1 (commit d1fb585): carapace plates and line icons. Round 2: the plates became a BUMPY SHELL CRUST drawn small ("I don't like
// crustaceans background", "Smaller texture", "Bumpy shell crust"). Round 3: the crust fainter ("The design needs to be fainter"), and the icons flat one-colour emblems in the manner of Super Smash Bros.'
// series symbols ("Just make it like Super Smash Bros."), our own drawings; a sticker set after Persona 5 was drawn between and set aside before it was committed.
// Loaded by design/ui-mocks/part2-looks.js into the real game page, and into a plain page for the pictures alone.
(function (root) {
    const R = v => Math.round(v * 10) / 10;
    let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const mix = (a, b, t) => typeof cardArtMix === "function" ? cardArtMix(a, b, t) : a;

    // THE CRUSTACEAN TEXTURE (round 2): a crab shell's knobbly crust. A faint shell tone over the whole face; on it, rounded knobs gathered in patches as a crab's shell carries them (thick in a patch,
    // sparse between), packed close and of three sizes (the big ones first, then the middle, then fine granules in the gaps). Each knob is a low dome lit from the top left by one shared gradient, with a dark
    // shadow where it rises from the shell. Small and faint (round 3), so it sits under a card's words and behind a follower without crowding them.
    function crustacean() {
        seed = 23;
        const W = 300, H = 420, knobs = [], H2 = v => Math.round(v * 2) / 2;
        const patches = []; for (let i = 0; i < 16; i++) patches.push({ x: -10 + rnd() * (W + 20), y: -10 + rnd() * (H + 20), s: 38 + rnd() * 34 });
        const near = (x, y) => patches.reduce((m, p) => Math.max(m, Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (2 * p.s * p.s))), 0);   // 1 at a patch's heart, toward 0 between
        const place = (n, tries, r0, r1, gap, floor) => {
            for (let t = 0, k = 0; t < tries && k < n; t++) {
                const x = rnd() * W, y = rnd() * H; if (rnd() > floor + (1 - floor) * near(x, y)) continue;
                const r = r0 + rnd() * (r1 - r0);
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
            if (q.r > 4.2) sock += '<circle cx="' + R(q.x + q.r * .16) + '" cy="' + R(q.y + q.r * .2) + '" r="' + H2(q.r * 1.06) + '"/>';   // where it rises from the shell
        });
        return '<defs><radialGradient id="cuP"><stop offset="0" stop-color="currentColor" stop-opacity=".09"/><stop offset=".7" stop-color="currentColor" stop-opacity=".04"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>'
            + '<radialGradient id="cuK" cx=".42" cy=".38" r=".66" fx=".34" fy=".28"><stop offset="0" stop-color="currentColor" stop-opacity=".46"/><stop offset=".5" stop-color="currentColor" stop-opacity=".28"/>'
            + '<stop offset=".88" stop-color="currentColor" stop-opacity=".13"/><stop offset="1" stop-color="currentColor" stop-opacity=".07"/></radialGradient></defs>'
            + '<g id="cuAll"><rect width="300" height="420" fill="currentColor" fill-opacity=".03"/>'
            + '<g fill="url(#cuP)">' + plate + "</g>"
            + '<g fill="#000" fill-opacity=".2">' + sock + "</g>"
            + '<g fill="url(#cuK)">' + body + "</g>"
            + '<g fill="currentColor" fill-opacity=".17">' + grain + "</g></g>";
    }

    // THE MOLLUSK TEXTURE (proposed after the crustacean's approval, 2026-11-06; the owner, of a first try with little spiral shells: "I'm not big on it", then "Mollusk: pearly sheen"): NACRE as the inside
    // of a shell. Broad soft bands of mother-of-pearl (pale pink, lilac, sky, mint, a little gold) flowing across the face, each with a paler core where the light catches, and fine wavy growth lines
    // running with them, the layers of the nacre. No shells drawn. Faint, as the crust is. The waves are quadratic curves continued with T, so each line is a few dozen bytes.
    function mollusk() {
        seed = 41;
        const W = 300, wave = (y0, amp, half, tilt) => {   // a gentle wave across the face, falling to the right
            let d = "M-30 " + R(y0) + "Q" + R(-30 + half / 2) + " " + R(y0 - amp + tilt * half / 2) + " " + R(-30 + half) + " " + R(y0 + tilt * half);
            for (let x = -30 + 2 * half; x <= W + 30 + half; x += half) d += "T" + R(x) + " " + R(y0 + tilt * (x + 30));
            return d;
        };
        let bands = "", cores = "", lines = "";
        const hues = ["url(#moA)", "url(#moB)", "url(#moC)"];
        for (let k = 0; k < 8; k++) {
            const y0 = -70 + k * 66 + (rnd() - .5) * 26, amp = 6 + rnd() * 16, half = 60 + rnd() * 70, w = 28 + rnd() * 30, d = wave(y0, amp, half, .18 + rnd() * .14);
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
    }
    // THE ELEMENTAL TEXTURE, round 3 (2026-11-06): storm clouds in high resolution. The owner, of round 2's soft clouds once built (build 2026-11-06d): "Ew elemental, storm cloud texture please hi res";
    // of this drawing: "Approve as drawn". (Round 1 was little crystal clusters: "New cloud texture is puffy and stormy no repreating icons". Round 2, banks of soft gradient puffs, approved as drawn and
    // then replaced by this; it is in git, commit e023e23.) Crisp cloud masses, no soft balls: each mass a silhouette (a solid body under a top edge of billows of their own sizes, a cauliflower edge with
    // fine billows riding the bigger ones, over a flat base), cel-shaded in flat tones: a thin light rim along its top edge, a lit band, a shaded body, a darker underside; a lower fold of billows inside
    // it shaded the same way, so the mass shows its folds as scalloped contours. Stormy: a far deck of heavy cloud behind, the masses overlapping before it, rain shafts under the darkest, a few fine
    // wisps. Flat fills only, so nothing bands. On a follower it takes its element's colour (the theme as written).
    function elemental() {
        seed = 61;
        const circ = (x, y, r) => "M" + R(x - r) + " " + R(y) + "a" + R(r) + " " + R(r) + " 0 1 0 " + R(2 * r) + " 0a" + R(r) + " " + R(r) + " 0 1 0 " + R(-2 * r) + " 0z";
        const poly = pts => { const a = pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), l = a > 0 ? pts.slice().reverse() : pts; return "M" + l.map(p => R(p[0]) + " " + R(p[1])).join("L") + "z"; };   // wound as the circles are, so the union has no holes
        let defs = "", out = "";
        const silhouette = (xl, xr, top, base, rk, fine) => {   // billows whose tops follow top(x), fine billows on the bigger ones, a solid body under them down past the base
            const b = [], s = [], body = [];
            for (let x = xl; x < xr;) { const h = top(x), r = Math.max(4.5, h * (rk + rnd() * 0.12)), y = base(x) - h + r + (rnd() - .5) * 2.5; b.push([x, y, r]); x += r * (0.55 + rnd() * 0.4); }
            b.forEach(([x, y, r]) => { if (r < 7 || rnd() > fine) return; for (let i = 0, n = 1 + (rnd() < .5 ? 1 : 0); i < n; i++) { const ang = (205 + rnd() * 130) * Math.PI / 180, q = 1.6 + rnd() * Math.min(4, r * 0.3); s.push([x + Math.cos(ang) * (r - q * 0.35), y + Math.sin(ang) * (r - q * 0.35), q]); } });
            for (let x = xl; x <= xr + 1; x += 10) body.push([x, base(x) - top(x) * 0.62]);
            body.push([xr, base(xr) + 12], [xl, base(xl) + 12]);
            return poly(body) + b.concat(s).map(c => circ(c[0], c[1], c[2])).join("");
        };
        const mass = (k, xl, xr, y0, hp, xp, wid, tilt, a, fold, rain, far) => {   // its flat base at y0 from xl to xr, its top a bell peaking hp above it at xp
            const base = x => y0 + tilt * (x - 150), top = x => 16 + hp * Math.exp(-Math.pow((x - xp) / wid, 2)) * (0.85 + 0.15 * Math.sin(x * 0.09 + k * 2));
            defs += '<path id="clS' + k + '" d="' + silhouette(xl, xr, top, base, far ? 0.2 : 0.26, fold ? 0.62 : 0.25) + '"/>'
                + '<clipPath id="clK' + k + '"><use href="#clS' + k + '" xlink:href="#clS' + k + '"/></clipPath>'
                + '<clipPath id="clB' + k + '"><rect x="-60" y="' + R(y0 - 400) + '" width="420" height="400" transform="rotate(' + R(Math.atan(tilt) * 180 / Math.PI) + ' 150 ' + R(y0) + ')"/></clipPath>';
            const u = (id, dx, dy, fill, op) => '<use href="#' + id + '" xlink:href="#' + id + '" x="' + dx + '" y="' + dy + '" fill="' + fill + '"' + (op ? ' fill-opacity="' + op + '"' : "") + "/>";
            const shade = id => (far ? "" : u(id, 0, 0, "#ffffff")) + u(id, 0.4, 1.3, "currentColor") + u(id, 0.7, 6, "#000", ".36");   // a rim, a lit band, the shaded rest
            let g = shade("clS" + k);
            if (fold) {   // the fold: a lower bank of billows across part of the mass
                const fl = xl + (xr - xl) * (0.08 + rnd() * 0.25), fr = xr - (xr - xl) * (0.08 + rnd() * 0.25), fc = (fl + fr) / 2, fw = (fr - fl) * 0.45;
                const ftop = x => 6 + hp * 0.5 * Math.exp(-Math.pow((x - fc) / fw, 2)), fbase = x => base(x) + 6;
                defs += '<path id="clF' + k + '" d="' + silhouette(fl, fr, ftop, fbase, 0.3, 0.6) + '"/>';
                g += shade("clF" + k);
            }
            g += u("clS" + k, 0, Math.round(hp * 0.42 + 15), "#000", ".38") + u("clS" + k, 0, Math.round(hp * 0.68 + 28), "#000", ".38");   // the underside, darker toward the base
            out += '<g clip-path="url(#clB' + k + ')"><g clip-path="url(#clK' + k + ')" opacity="' + a + '">' + g + "</g></g>";
            if (rain) { let s = ""; for (let i = 0; i < rain; i++) { const x = xl + 20 + rnd() * (xr - xl - 40), y = base(x) + 2 + rnd() * 5, L = 16 + rnd() * 30; s += "M" + R(x) + " " + R(y) + "l" + R(-L * 0.2) + " " + R(L); } out += '<path d="' + s + '" stroke="currentColor" stroke-opacity=".1" stroke-width=".7" stroke-linecap="round" fill="none"/>'; }
        };
        let wisps = "";
        for (let k = 0; k < 4; k++) { const y = 40 + rnd() * 360, x = -10 + rnd() * 200, L = 60 + rnd() * 80, b = (rnd() - .5) * 10; wisps += "M" + R(x) + " " + R(y) + "q" + R(L * 0.45) + " " + R(b - 12) + " " + R(L) + " " + R(b); }
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
    }
    // THE DRONE TEXTURE (proposed after the elemental's approval, 2026-11-06; the theme as written: "machined panels: seams, rivets and vent slats"). Plating split into panels of uneven sizes, so no
    // layout repeats: each panel lit along its top and left edges and shaded along its bottom and right, thin dark seams between them; rivets at the corners of the larger panels; vent slats in a few.
    // Faint, as the other textures are.
    function drone() {
        seed = 73;
        const panels = [];
        const split = (x, y, w, h, depth) => {
            const area = w * h;
            if (depth > 0 && (area > 9000 || (area > 3600 && rnd() < .55))) {
                if (w > h * (.8 + rnd() * .5)) { const c = Math.round(w * (.32 + rnd() * .36)); split(x, y, c, h, depth - 1); split(x + c, y, w - c, h, depth - 1); }
                else { const c = Math.round(h * (.32 + rnd() * .36)); split(x, y, w, c, depth - 1); split(x, y + c, w, h - c, depth - 1); }
            } else panels.push({ x, y, w, h });
        };
        split(0, 0, 300, 420, 7);
        let plates = "", lit = "", shade = "", rivets = "", slats = "", rims = "";
        const vented = panels.filter(p => p.w > 64 && p.h > 50).filter((p, i) => i % 2 === 0).slice(0, 4);   // four of the larger panels carry vents
        panels.forEach(p => {
            const g = 1.6, x0 = R(p.x + g), y0 = R(p.y + g), x1 = R(p.x + p.w - g), y1 = R(p.y + p.h - g);
            plates += "M" + x0 + " " + y0 + "H" + x1 + "V" + y1 + "H" + x0 + "Z";
            lit += "M" + x0 + " " + y1 + "V" + y0 + "H" + x1;
            shade += "M" + x1 + " " + y0 + "V" + y1 + "H" + x0;
            if (p.w > 44 && p.h > 44 && rnd() < .7) [[x0 + 5, y0 + 5], [x1 - 5, y0 + 5], [x1 - 5, y1 - 5], [x0 + 5, y1 - 5]].forEach(c => { rivets += '<circle cx="' + R(c[0]) + '" cy="' + R(c[1]) + '" r="1.3"/>'; });
            if (vented.indexOf(p) >= 0) {   // louvres: each a raised slat lit along its top, its shadow under it
                const n = 4 + Math.floor(rnd() * 4), L = Math.min(p.w * .55, 70), sx = p.x + (p.w - L) / 2, sy = p.y + p.h / 2 - (n - 1) * 3.5;
                for (let i = 0; i < n; i++) { const y = sy + i * 7; slats += "M" + R(sx) + " " + R(y) + "h" + R(L); rims += "M" + R(sx) + " " + R(y + 1.8) + "h" + R(L); }
            }
        });
        return '<g id="drAll"><path fill="currentColor" fill-opacity=".04" d="' + plates + '"/>'
            + '<path fill="none" stroke="currentColor" stroke-opacity=".26" stroke-width="1" d="' + lit + '"/>'
            + '<path fill="none" stroke="#000" stroke-opacity=".32" stroke-width="1" d="' + shade + '"/>'
            + '<g fill="currentColor" fill-opacity=".3">' + rivets + "</g>"
            + '<path fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1.2" stroke-linecap="round" d="' + rims + '"/>'
            + '<path fill="none" stroke="currentColor" stroke-opacity=".24" stroke-width="2.2" stroke-linecap="round" d="' + slats + '"/></g>';
    }
    // THE JELLY TEXTURE (proposed after the drone's approval, 2026-11-06; the theme as written: "soft membrane cells with nuclei, a gel's wobble"). A foam of soft cells packed against each other,
    // the big ones first and smaller ones in the gaps; each cell a wobbly closed curve (its membrane) with a soft gel fill, about half of them holding a nucleus of their own size and place. No cell
    // is drawn twice. Faint, as the other textures are.
    function jelly() {
        seed = 89;
        const W = 300, H = 420, cells = [];
        const place = (n, tries, r0, r1) => { for (let t = 0, k = 0; t < tries && k < n; t++) { const r = r0 + rnd() * (r1 - r0), x = -10 + rnd() * (W + 20), y = -10 + rnd() * (H + 20); if (cells.every(c => Math.hypot(c.x - x, c.y - y) > c.r + r + 1.4)) { cells.push({ x, y, r }); k++; } } };
        place(26, 1500, 20, 30); place(60, 4000, 12, 20); place(60, 4000, 6, 12);
        let body = "", nuclei = "";
        cells.forEach(c => {
            const n = 7, ph = rnd() * 6.283, amp = .05 + rnd() * .07, pts = [];
            for (let i = 0; i < n; i++) { const a = ph + i * 6.283 / n, rr = c.r * (1 + amp * Math.sin(3 * a + ph * 2) + (rnd() - .5) * .06); pts.push([c.x + rr * Math.cos(a), c.y + rr * Math.sin(a)]); }
            const mid = (p, q) => Math.round((p[0] + q[0]) / 2) + " " + Math.round((p[1] + q[1]) / 2);
            let d = "M" + mid(pts[n - 1], pts[0]);
            for (let i = 0; i < n; i++) d += "Q" + Math.round(pts[i][0]) + " " + Math.round(pts[i][1]) + " " + mid(pts[i], pts[(i + 1) % n]);
            body += '<path d="' + d + 'Z"/>';
            if (c.r > 9 && rnd() < .55) { const a = rnd() * 6.283, o = c.r * (.1 + rnd() * .25), nr = c.r * (.16 + rnd() * .1);
                nuclei += '<ellipse cx="' + Math.round(c.x + o * Math.cos(a)) + '" cy="' + Math.round(c.y + o * Math.sin(a)) + '" rx="' + R(nr * (1 + rnd() * .3)) + '" ry="' + R(nr) + '"/>'; }
        });
        return '<defs><radialGradient id="jeG" cx=".45" cy=".42" r=".62"><stop offset="0" stop-color="currentColor" stop-opacity=".1"/><stop offset=".7" stop-color="currentColor" stop-opacity=".05"/><stop offset="1" stop-color="currentColor" stop-opacity=".02"/></radialGradient></defs>'
            + '<g id="jeAll"><rect width="300" height="420" fill="currentColor" fill-opacity=".025"/>'
            + '<g fill="url(#jeG)" stroke="currentColor" stroke-opacity=".22" stroke-width="1.1">' + body + "</g>"
            + '<g fill="currentColor" fill-opacity=".16">' + nuclei + "</g></g>";
    }
    const TEX = { crustacean, mollusk, elemental, drone, jelly }, TEX_ID = { crustacean: "cuAll", mollusk: "moAll", elemental: "clAll", drone: "drAll", jelly: "jeAll" };   // a species' texture, and the id of its drawing (so a follower's band can lay it twice across)
    const TEX_HALF = { crustacean: true };
    const TEX_ELEMENT_COLOUR = { elemental: true };   // on a follower, laid in its element's colour (the theme as written), not the species' own   // laid at half size on a follower (the crust, "Smaller texture"); the others once, at their own size (a broad sheen laid twice across would show a seam)

    // THE THEMES (proposed, for the owner): a colour and a motif each. Element colours (fire, electric, ice, flux, core, toxic, BLOOM's pink) and the class cyan are taken, so a species is a MATERIAL, not a hue.
    // The other four stand as written (the owner, 2026-11-06: "They stand"); each is drawn after the crustacean is approved, one at a time.
    const THEMES = {
        crustacean: { col: "#e7ad78", name: "CHITIN AMBER", motif: "a crab shell's bumpy crust: rounded knobs packed close, fine granules between, drawn small" },
        mollusk:    { col: "#e3d6ff", name: "NACRE",        motif: "a pearly sheen: soft mother-of-pearl bands with fine growth lines, faint (the owner: \"Mollusk: pearly sheen\")" },
        elemental:  { col: "#f2f7ff", name: "PRISM WHITE",  motif: "storm clouds, puffy and stormy, no repeating motifs (the owner); on a follower it takes its element's colour" },
        drone:      { col: "#b6c4d6", name: "GUNMETAL",     motif: "machined panels: seams, rivets and vent slats" },
        jelly:      { col: "#e39cff", name: "GEL ORCHID",   motif: "soft membrane cells with nuclei, a gel's wobble" },
    };

    // THE ICONS (round 3, the owner: "I do not like the direction of the icons. Just make it like Super Smash Bros. Actually."): flat, one-colour emblems in the manner of that game's series symbols,
    // our own drawings (not its symbols). Each is one solid shape on a 32-unit square built from discs, wedges and bars, with its details cut out of it (the cuts are wound the other way, so the
    // ordinary nonzero fill leaves them open), drawn in the colour of the text beside it. A sticker set after Persona 5 (round 2) was drawn and set aside the same day, before it was committed.
    const area = pts => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);   // > 0: clockwise on the screen (y down)
    const poly = (pts, cw) => { const l = (area(pts) > 0) === cw ? pts : pts.slice().reverse(); return "M" + l.map(p => R(p[0]) + " " + R(p[1])).join("L") + "Z"; };
    const ell = (cx, cy, rx, ry, cw) => { const f = cw ? 1 : 0; return "M" + R(cx - rx) + " " + R(cy) + "A" + rx + " " + ry + " 0 1 " + f + " " + R(cx + rx) + " " + R(cy) + "A" + rx + " " + ry + " 0 1 " + f + " " + R(cx - rx) + " " + R(cy) + "Z"; };
    const disc = (cx, cy, r) => ell(cx, cy, r, r, true);
    const pie = (cx, cy, r, mid, half) => { const a = (mid + half) * Math.PI / 180, b = (mid - half) * Math.PI / 180; return "M" + R(cx) + " " + R(cy) + "L" + R(cx + r * Math.cos(a)) + " " + R(cy + r * Math.sin(a)) + "A" + r + " " + r + " 0 1 1 " + R(cx + r * Math.cos(b)) + " " + R(cy + r * Math.sin(b)) + "Z"; };   // a disc with a wedge open at `mid` degrees
    const bar = (pts, w) => { let d = ""; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L * w / 2, ny = (bx - ax) / L * w / 2; d += poly([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], true); if (i) d += disc(ax, ay, w / 2); } return d; };   // a bent limb, its knees rounded
    const mx = pts => pts.map(p => [32 - p[0], p[1]]), both = (pts, w) => bar(pts, w) + bar(mx(pts), w);
    const ICONS = {
        crustacean: { col: "#e7ad78", d: (() => {
            let d = ell(16, 19.6, 9, 6.2, true);                                                              // the shell
            d += both([[13.4, 14.6], [12.7, 11]], 1.6) + disc(12.5, 9.9, 1.9) + disc(19.5, 9.9, 1.9);            // the eyes on their stalks
            d += both([[10.2, 15.8], [7.4, 11.8]], 2.6) + pie(6.4, 8.4, 4.7, -112, 30) + pie(25.6, 8.4, 4.7, -68, 30);   // the arms and the open claws
            [[[8.2, 18.4], [3.8, 17], [2.2, 20.2]], [[8, 21.2], [3.8, 22.4], [2.8, 25.8]], [[10.4, 24.2], [7.2, 26.4], [6.8, 29.6]]].forEach(l => { d += both(l, 1.9); });   // the legs
            return d + "M10.6 19.4Q16 16.6 21.4 19.4Q16 14.6 10.6 19.4Z";                                       // cut: the arched ridge across the shell
        })() },
        mollusk: { col: "#e3d6ff", d: (() => {   // a snail's coiled shell: the coil, the flared lip with its mouth, a spiral groove
            let d = disc(14.5, 14.5, 11) + ell(23.2, 24.6, 6.6, 4.6, true);
            const k = (8.2 - 1.2) / (2.25 * 2 * Math.PI), w = 1.4, out = [], inn = [];
            for (let t = 0; t <= 2.25 * 2 * Math.PI + 1e-6; t += 0.18) { const r = 1.2 + k * t, a = t + 2.2; out.push([14.5 + (r + w / 2) * Math.cos(a), 14.5 + (r + w / 2) * Math.sin(a)]); inn.push([14.5 + Math.max(.2, r - w / 2) * Math.cos(a), 14.5 + Math.max(.2, r - w / 2) * Math.sin(a)]); }
            return d + poly(out.concat(inn.reverse()), false) + ell(24.6, 25.8, 2.8, 1.8, false);   // cut: the groove, and the shell's mouth
        })() },
        elemental: { col: "#f2f7ff", d: (() => {   // three crystal prisms from one root, each with its front edge cut
            const prism = (cx, by, hw, h, tip, ang) => { const c = Math.cos(ang * Math.PI / 180), sn = Math.sin(ang * Math.PI / 180), T = p => [cx + p[0] * c - p[1] * sn, by + p[0] * sn + p[1] * c];
                return poly([[0, -h - tip], [hw, -h], [hw, -hw * .6], [0, 0], [-hw, -hw * .6], [-hw, -h]].map(T), true) + poly([[-.45, -h + .6], [.45, -h + .6], [.45, -hw * .6 - 1.4], [-.45, -hw * .6 - 1.4]].map(T), false); };
            return prism(16, 29.5, 3.7, 19, 6, 0) + prism(12.6, 29, 2.9, 12.5, 4.6, -27) + prism(19.4, 29, 2.9, 12.5, 4.6, 27);
        })() },
        drone: { col: "#b6c4d6", d: (() => {   // a round body with a visor slot and its eye, two antennae, two feet
            let d = disc(16, 18.4, 9.6) + both([[12.6, 10.2], [9.6, 4]], 1.6) + disc(9.3, 3.6, 1.8) + disc(22.7, 3.6, 1.8) + both([[11.4, 26], [9.8, 30]], 2);
            return d + "M11.5 15.6A2.6 2.6 0 0 0 11.5 20.8L20.5 20.8A2.6 2.6 0 0 0 20.5 15.6Z" + disc(16, 18.2, 1.7);   // cut: the visor (the eye stays)
        })() },
        jelly: { col: "#e39cff", d: (() => {   // a jellyfish: the bell with a scalloped rim, four trailing tendrils, a sheen cut into the bell
            let d = "M4.5 16.5A11.5 11 0 0 1 27.5 16.5Q25.6 19.7 23.6 16.9Q21.6 19.9 19.6 16.9Q17.8 19.9 16 16.9Q14.2 19.9 12.4 16.9Q10.4 19.9 8.4 16.9Q6.4 19.7 4.5 16.5Z";
            d += both([[8.8, 17.4], [7.5, 21.4], [9.1, 25.4], [7.9, 29.6]], 1.7) + both([[13.2, 17.8], [12.3, 22.2], [13.8, 26.4], [12.9, 30.6]], 1.6);
            const band = []; for (let a = 200; a <= 252; a += 4) band.push([16 + 9.6 * Math.cos(a * Math.PI / 180), 16.5 + 9.6 * Math.sin(a * Math.PI / 180)]);
            for (let a = 252; a >= 200; a -= 4) band.push([16 + 8 * Math.cos(a * Math.PI / 180), 16.5 + 8 * Math.sin(a * Math.PI / 180)]);
            return d + poly(band, false);
        })() },
        toxic: { col: "#66ff66", d: (() => {   // bubbles: a big one, a middle one, two small, each big one with a glint cut into it
            const glint = (cx, cy, r0, r1) => { const p = []; for (let a = 196; a <= 256; a += 6) p.push([cx + r1 * Math.cos(a * Math.PI / 180), cy + r1 * Math.sin(a * Math.PI / 180)]); for (let a = 256; a >= 196; a -= 6) p.push([cx + r0 * Math.cos(a * Math.PI / 180), cy + r0 * Math.sin(a * Math.PI / 180)]); return poly(p, false); };
            return disc(12.5, 19, 8.5) + disc(23.5, 10.5, 5.2) + disc(25, 23.5, 3.2) + disc(7.6, 6.6, 2.2) + glint(12.5, 19, 4.6, 6.4) + glint(23.5, 10.5, 2.6, 3.8);
        })() },
        electric: { col: "#ffee33", d: poly([[13.5, 1.5], [22.5, 1.5], [17, 12.5], [24.5, 12.5], [10.5, 30.5], [14.5, 17.5], [7.5, 17.5]], true) },   // a bolt
        ice: { col: "#99ddff", d: (() => {   // a snowflake: six arms, each with a pair of twigs, round a small hexagon
            let d = poly([0, 1, 2, 3, 4, 5].map(i => [16 + 3.4 * Math.cos((i * 60 - 90) * Math.PI / 180), 16 + 3.4 * Math.sin((i * 60 - 90) * Math.PI / 180)]), true);
            for (let i = 0; i < 6; i++) { const a = (i * 60 - 90) * Math.PI / 180, b0 = [16 + 8 * Math.cos(a), 16 + 8 * Math.sin(a)];
                d += bar([[16 + 2 * Math.cos(a), 16 + 2 * Math.sin(a)], [16 + 13.6 * Math.cos(a), 16 + 13.6 * Math.sin(a)]], 2.4);
                [-1, 1].forEach(sg => { const b = a + sg * 0.8; d += bar([b0, [b0[0] + 4.6 * Math.cos(b), b0[1] + 4.6 * Math.sin(b)]], 2); }); }
            return d;
        })() },
        flux: { col: "#9933ff", d: (() => {   // a vortex: three arms swirling round an eye
            let d = disc(16, 16, 3.6);
            for (let k = 0; k < 3; k++) { const o = [], inn = [];
                for (let t = 0; t <= 1.0001; t += .08) { const a = (k * 120 + 165 * t) * Math.PI / 180, r = 4 + 10.5 * t, w = t < .4 ? 1.6 + 7 * t : 4.4 * (1 - t) / .6 + .4;
                    o.push([16 + r * Math.cos(a), 16 + r * Math.sin(a)]); inn.push([16 + (r - w) * Math.cos(a - .12), 16 + (r - w) * Math.sin(a - .12)]); }
                d += poly(o.concat(inn.reverse()), true); }
            return d + ell(16, 16, 1.6, 1.6, false);   // cut: the eye
        })() },
        core: { col: "#00ccaa", d: (() => {   // a hexagon cell: an outer hexagon, a ring cut out of it, a hexagon at its heart
            const hex = (r, cw) => poly([0, 1, 2, 3, 4, 5].map(i => [16 + r * Math.cos((i * 60 - 90) * Math.PI / 180), 16 + r * Math.sin((i * 60 - 90) * Math.PI / 180)]), cw);
            return hex(14, true) + hex(9.6, false) + hex(5.8, true);
        })() },
        fire: { col: "#ff3d14", d: "M16 30C9 30 6 25 6.5 20C7 15 10.5 12.5 11.5 8.5C13 11 13.5 12.5 13.5 14.5C15.5 11.5 16.5 7 15.5 2.5C20.5 5.5 25.5 11.5 25.5 19.5C25.5 25.5 21.5 30 16 30Z"
            + "M16 27C19 27 21 25 21 22.5C21 21 20.5 19.5 19 17.5C19 19 18.5 20 17.5 21C17.5 19.5 16.5 18 14.5 16C14 18.5 12 19.5 11.5 22C11 24.5 12.5 27 16 27Z" },   // cut: the heart of the flame
        beetle: { col: "#ff8a6a", d: (() => {   // a horned beetle: the shell split down its back, the line of the pronotum, six bent legs
            let d = ell(16, 19, 8.5, 10, true) + ell(16, 7.5, 4.2, 3.4, true) + poly([[15, 5], [16, .8], [17.6, 1.6], [17, 5.2]], true);
            [[[9.5, 13.5], [5.5, 11.5], [3.5, 8]], [[8.2, 18.5], [3.8, 19], [2, 22.5]], [[9, 24], [5.5, 27], [5, 30.5]]].forEach(l => { d += both(l, 1.7); });
            return d + poly([[10.2, 12.1], [21.8, 12.1], [21.8, 13], [10.2, 13]], false) + poly([[15.55, 13.8], [16.45, 13.8], [16.45, 28], [15.55, 28]], false);   // cuts: the pronotum's line, the split of the shell
        })() },
        scorpion: { col: "#ff8a6a", d: (() => {   // a scorpion: open pincers, eight short legs, the tail curling up to its sting
            let d = ell(16, 15, 4.6, 6, true) + both([[13.4, 11], [9.8, 8.6], [8.4, 7.4]], 2) + pie(7.5, 5.5, 3.4, -115, 28) + pie(24.5, 5.5, 3.4, -65, 28);
            [[[12, 13], [7.5, 12.5], [5.6, 14.6]], [[11.6, 15.4], [7, 16.2], [5.4, 18.6]], [[11.8, 17.6], [7.6, 19.6], [6.6, 22.2]], [[12.6, 19.6], [9.6, 23], [9.4, 25.6]]].forEach(l => { d += both(l, 1.4); });
            [[16, 22.5, 2.9], [16.6, 26, 2.7], [18.6, 28.8, 2.5], [21.8, 29.6, 2.3], [24.6, 27.6, 2.1], [25.6, 24.4, 1.9]].forEach(q => { d += disc(q[0], q[1], q[2]); });   // the tail's segments, overlapping into one curl
            return d + poly([[24.4, 23.6], [27.2, 22.6], [25.2, 19.4]], true);   // the sting
        })() },
        spider: { col: "#ff8a6a", d: (() => {   // a spider: the round abdomen with a mark cut in it, the head, eight long bent legs
            let d = ell(16, 20.5, 6.2, 7, true) + ell(16, 10, 4, 3.6, true);
            [[[13, 9], [8, 4.5], [4.5, 6.5]], [[12.6, 10.4], [6.5, 8.8], [2.6, 12.4]], [[12.6, 11.8], [6.8, 14.4], [3.2, 19.4]], [[13.2, 12.8], [8.6, 18.6], [6.4, 25]]].forEach(l => { d += both(l, 1.5); });
            return d + poly([[16, 17.4], [17.6, 20.2], [16, 23], [14.4, 20.2]], false);   // cut: the mark on its back
        })() },
        mantis: { col: "#ff8a6a", d: (() => {   // a mantis: the triangular head with its eyes, the long neck, the folded raptor arms, a banded abdomen, four legs
            let d = poly([[11.8, 3.2], [20.2, 3.2], [16, 8]], true) + disc(12, 3.6, 1.6) + disc(20, 3.6, 1.6) + bar([[16, 7.6], [16, 15.2]], 2.2) + ell(16, 22.6, 3.8, 7.6, true);
            d += both([[15, 10.6], [10.2, 7.6], [8.6, 13.6]], 1.9) + poly([[8.2, 13.2], [6.6, 12.4], [8.6, 11.4]], true) + poly([[23.8, 13.2], [25.4, 12.4], [23.4, 11.4]], true);   // the arms and their hooks
            [[[14.6, 15.6], [9.4, 18.8], [7.6, 24.6]], [[14.4, 18], [10, 23.6], [9.4, 30]]].forEach(l => { d += both(l, 1.3); });
            return d + poly([[13.2, 20.6], [18.8, 20.6], [18.8, 21.4], [13.2, 21.4]], false) + poly([[13.4, 24.6], [18.6, 24.6], [18.6, 25.4], [13.4, 25.4]], false);   // cuts: the abdomen's bands
        })() },
        moth: { col: "#ff8a6a", d: (() => {   // a moth: four spread wings with an eyespot cut in each upper one, the body, the head, two feelers
            let d = ell(16, 17, 1.8, 8.5, true) + disc(16, 7.6, 2);
            d += poly([[14.6, 10], [7.5, 4.5], [2, 6], [2.4, 13.5], [7, 17.5], [14.4, 15.6]], true) + poly([[17.4, 10], [24.5, 4.5], [30, 6], [29.6, 13.5], [25, 17.5], [17.6, 15.6]], true);
            d += poly([[14.4, 17], [8, 18.5], [4.5, 23.5], [7.5, 28], [12.5, 26.5], [14.8, 21]], true) + poly([[17.6, 17], [24, 18.5], [27.5, 23.5], [24.5, 28], [19.5, 26.5], [17.2, 21]], true);
            d += both([[15.2, 6.2], [13, 2.4], [10.2, 1.4]], 1.2);
            return d + ell(7, 10.5, 1.8, 1.8, false) + ell(25, 10.5, 1.8, 1.8, false);   // cuts: the eyespots
        })() },
        ant: { col: "#ff8a6a", d: (() => {
            let d = disc(16, 6.6, 3) + ell(16, 13, 2.3, 2.6, true) + ell(16, 22.6, 5, 6.5, true);                // head, waist, abdomen
            d += both([[14.6, 4.6], [12.2, 1.9], [9.8, 1.6]], 1.4);                                            // the feelers
            [[[14.2, 12], [9.5, 9.6], [7.4, 6.6]], [[14, 13.2], [8.6, 14], [5.6, 17.6]], [[14.4, 14.6], [10, 19.4], [8.6, 25]]].forEach(l => { d += both(l, 1.7); });   // the legs
            return d + poly([[12.2, 21.5], [19.8, 21.5], [19.8, 22.5], [12.2, 22.5]], false) + poly([[12.6, 25.2], [19.4, 25.2], [19.4, 26.2], [12.6, 26.2]], false);   // cut: the abdomen's bands
        })() },
    };
    // an icon as an SVG: `size` in px (or a CSS length); `col` overrides its colour (currentColor takes the colour of the text it sits in)
    const iconSvg = (key, size, col) => {
        const I = ICONS[key]; if (!I) return "";
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="' + size + '" height="' + size + '"><path d="' + I.d + '" fill="' + (col || I.col) + '"/></svg>';
    };

    // A follower's backdrop with the species layer (the third), as js/cardart.js cardArtMixSvg makes the first two; `mode` is how the third layer is laid.
    // "small" (rounds 2 and 3, the owner: "Smaller texture", "fainter"): the crust at half its size (the drawing twice across the band), in the species' colour at 38%. The first round's ways, kept for the record: "big" (zoomed in twice, the one first shown),
    // "full" (its own size at 80%), "white", "edge" (faded in from the right), "bottom" (from the bottom).
    function backdrop3(el, cls, sp, mode) {
        const W = 300, H = 175, band = (inner, top, extra) => '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 ' + top + " " + W + " " + H + '" preserveAspectRatio="xMidYMid slice"' + (extra || "") + ">" + inner + "</svg>";
        const elBand = band(cardArtTexture(el), CARD_ART.band[el] || 0), clsBand = band(cardArtTexture(cls), CARD_ART.band[cls] || 0, ' color="' + cardArtMix(cardArtElementColour(el), "#ffffff", CARD_ART.tint) + '" opacity="' + CARD_ART.tintAlpha + '"');
        if (!sp) return _caDoc(W, H, elBand + clsBand);
        const spTex = TEX[sp] ? TEX[sp]() : "", T = THEMES[sp], col = TEX_ELEMENT_COLOUR[sp] ? cardArtElementColour(el) : T.col;
        let third = "";
        if ((!mode || mode === "small") && TEX_HALF[sp]) third = '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 60 600 350" preserveAspectRatio="xMidYMid slice" color="' + col + '" opacity=".38">' + spTex + '<use href="#' + TEX_ID[sp] + '" x="300"/></svg>';   // half its size: the drawing twice across
        else if (!mode || mode === "small") third = band(spTex, 60, ' color="' + col + '" opacity=".38"');   // once, at its own size
        else if (mode === "full") third = band(spTex, 60, ' color="' + T.col + '" opacity=".8"');
        else if (mode === "white") third = band(spTex, 60, ' color="#ffffff" opacity=".55"');
        else if (mode === "edge") third = '<defs><linearGradient id="spFade" x1="0" y1="0" x2="1" y2="0"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="spMask"><rect width="300" height="175" fill="url(#spFade)"/></mask></defs><g mask="url(#spMask)">' + band(spTex, 60, ' color="' + T.col + '"') + "</g>";
        else if (mode === "bottom") third = '<defs><linearGradient id="spFadeB" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="spMaskB"><rect width="300" height="175" fill="url(#spFadeB)"/></mask></defs><g mask="url(#spMaskB)">' + band(spTex, 60, ' color="' + T.col + '"') + "</g>";
        else if (mode === "big") third = '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="40 40 150 88" preserveAspectRatio="xMidYMid slice" color="' + T.col + '" opacity=".75">' + spTex + "</svg>";
        return _caDoc(W, H, elBand + clsBand + third);
    }
    root.PART2 = { crustacean, mollusk, elemental, drone, jelly, TEX, THEMES, ICONS, iconSvg, backdrop3 };
})(typeof window !== "undefined" ? window : globalThis);
