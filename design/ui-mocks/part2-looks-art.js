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

    // THE THEMES (proposed, for the owner): a colour and a motif each. Element colours (fire, electric, ice, flux, core, toxic, BLOOM's pink) and the class cyan are taken, so a species is a MATERIAL, not a hue.
    // The other four stand as written (the owner, 2026-11-06: "They stand"); each is drawn after the crustacean is approved, one at a time.
    const THEMES = {
        crustacean: { col: "#e7ad78", name: "CHITIN AMBER", motif: "a crab shell's bumpy crust: rounded knobs packed close, fine granules between, drawn small" },
        mollusk:    { col: "#e3d6ff", name: "NACRE",        motif: "spiral whorls and growth lines (a shell's), with a mother-of-pearl sheen" },
        elemental:  { col: "#f2f7ff", name: "PRISM WHITE",  motif: "crystal growth: clustered prisms and rising motes; on a follower it takes its element's colour" },
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
        fire: { col: "#ff3d14", d: "M16 30C9 30 6 25 6.5 20C7 15 10.5 12.5 11.5 8.5C13 11 13.5 12.5 13.5 14.5C15.5 11.5 16.5 7 15.5 2.5C20.5 5.5 25.5 11.5 25.5 19.5C25.5 25.5 21.5 30 16 30Z"
            + "M16 27C19 27 21 25 21 22.5C21 21 20.5 19.5 19 17.5C19 19 18.5 20 17.5 21C17.5 19.5 16.5 18 14.5 16C14 18.5 12 19.5 11.5 22C11 24.5 12.5 27 16 27Z" },   // cut: the heart of the flame
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
        const spTex = sp === "crustacean" ? crustacean() : "", T = THEMES[sp];
        let third = "";
        if (!mode || mode === "small") third = '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 60 600 350" preserveAspectRatio="xMidYMid slice" color="' + T.col + '" opacity=".38">' + spTex + '<use href="#cuAll" x="300"/></svg>';   // half its size: the drawing twice across
        else if (mode === "full") third = band(spTex, 60, ' color="' + T.col + '" opacity=".8"');
        else if (mode === "white") third = band(spTex, 60, ' color="#ffffff" opacity=".55"');
        else if (mode === "edge") third = '<defs><linearGradient id="spFade" x1="0" y1="0" x2="1" y2="0"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="spMask"><rect width="300" height="175" fill="url(#spFade)"/></mask></defs><g mask="url(#spMask)">' + band(spTex, 60, ' color="' + T.col + '"') + "</g>";
        else if (mode === "bottom") third = '<defs><linearGradient id="spFadeB" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="spMaskB"><rect width="300" height="175" fill="url(#spFadeB)"/></mask></defs><g mask="url(#spMaskB)">' + band(spTex, 60, ' color="' + T.col + '"') + "</g>";
        else if (mode === "big") third = '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="40 40 150 88" preserveAspectRatio="xMidYMid slice" color="' + T.col + '" opacity=".75">' + spTex + "</svg>";
        return _caDoc(W, H, elBand + clsBand + third);
    }
    root.PART2 = { crustacean, THEMES, ICONS, iconSvg, backdrop3 };
})(typeof window !== "undefined" ? window : globalThis);
