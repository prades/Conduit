// THE FOLLOWING UPDATE'S PART 2, GATE 2: the looks proposed for the owner's approval (docs/FOLLOWING-UPDATE.md Part 2; docs/UI-STYLE.md "The subclass themes, textures and icons").
// PROPOSALS ONLY: nothing here is in the game. docs/ART-PROCESS.md: one piece first, so this draws one piece of each family (the CRUSTACEAN texture, one icon of each set, one race's row on the enemy card) and the
// rest waits for the owner's yes or correction. Drawn in the game's own way (js/cardart.js: a texture is an SVG drawing on the 300 x 420 card face; the dock's icons are 24-unit line drawings, stroke 2.2, round).
// Loaded by design/ui-mocks/part2-looks.js into the real game page, and into a plain page for the pictures alone.
(function (root) {
    const R = v => Math.round(v * 10) / 10;
    let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    // THE CRUSTACEAN TEXTURE (proposed): overlapping carapace plates, as a lobster's tail or the armour of the crustacean forms (QUILLSTONE's faceted shell, SEEPER's plates): rows of arched plates, staggered like
    // bricks, each lit along its ridge and fading toward its lower edge where the next row tucks under it; a few facet cuts from the ridge (QUILLSTONE's faceting) and a sprinkle of pores. Drawn in currentColor.
    function crustacean() {
        seed = 71;
        const W = 300, rowH = 46, arch = 9;
        let plates = "", ridges = "", facets = "", pores = "", glints = "";
        for (let j = -1; j < 10; j++) {
            const y = 6 + j * rowH, off = j % 2 ? -64 : -8;
            for (let x = off; x < W + 8;) {
                const w = 112 + rnd() * 44, x0 = x, x1 = Math.min(x + w, x + w), cx = (x0 + x1) / 2, hw = (x1 - x0) / 2;
                const top = t => y - arch * (1 - Math.pow((t - cx) / hw, 2)), bot = t => y + rowH + 7 - arch * 0.55 * (1 - Math.pow((t - cx) / hw, 2));
                const T = [], B = []; for (let i = 0; i <= 12; i++) { const t = x0 + (x1 - x0) * i / 12; T.push([t, top(t)]); B.push([t, bot(t)]); }
                plates += '<path d="M' + T.map(p => R(p[0]) + " " + R(p[1])).join(" L") + " L" + B.slice().reverse().map(p => R(p[0]) + " " + R(p[1])).join(" L") + ' Z"/>';
                ridges += '<polyline points="' + T.slice(1, 12).map(p => R(p[0]) + "," + R(p[1] + 3.2)).join(" ") + '"/>';
                for (let k = 0; k < 2; k++) { const t = x0 + hw * (0.45 + k * 1.1) + (rnd() - .5) * 14, y0 = top(t) + 3, d = (k ? 1 : -1) * (6 + rnd() * 5), L = 12 + rnd() * 9; facets += '<line x1="' + R(t) + '" y1="' + R(y0) + '" x2="' + R(t + d) + '" y2="' + R(y0 + L) + '"/>'; }
                for (let k = 0; k < 4; k++) { const t = x0 + 14 + rnd() * (x1 - x0 - 28), yy = (top(t) + bot(t)) / 2 + (rnd() - .5) * 10; pores += '<circle cx="' + R(t) + '" cy="' + R(yy) + '" r="' + R(.7 + rnd() * .6) + '"/>'; }
                if (rnd() < .35) { const t = cx + (rnd() - .5) * hw, yy = top(t) + 3; glints += '<line x1="' + R(t - 7) + '" y1="' + R(yy) + '" x2="' + R(t + 7) + '" y2="' + R(yy) + '"/>'; }
                x = x1 + 2.5;
            }
        }
        return '<defs><linearGradient id="crG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".24"/><stop offset=".5" stop-color="currentColor" stop-opacity=".09"/><stop offset="1" stop-color="currentColor" stop-opacity=".02"/></linearGradient></defs>'
            + '<g fill="url(#crG)" stroke="currentColor" stroke-opacity=".32" stroke-width=".9" stroke-linejoin="round">' + plates + "</g>"
            + '<g fill="none" stroke="currentColor" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + ridges + "</g>"
            + '<g stroke="currentColor" stroke-opacity=".3" stroke-width=".9" stroke-linecap="round">' + facets + "</g>"
            + '<g fill="currentColor" fill-opacity=".4">' + pores + "</g>"
            + '<g stroke="#ffffff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round">' + glints + "</g>";
    }

    // THE THEMES (proposed, for the owner): a colour and a motif each. Element colours (fire, electric, ice, flux, core, toxic, BLOOM's pink) and the class cyan are taken, so a species is a MATERIAL, not a hue.
    const THEMES = {
        crustacean: { col: "#e7ad78", name: "CHITIN AMBER", motif: "overlapping carapace plates, faceted" },
        mollusk:    { col: "#e3d6ff", name: "NACRE",        motif: "spiral whorls and growth lines (a shell's), with a mother-of-pearl sheen" },
        elemental:  { col: "#f2f7ff", name: "PRISM WHITE",  motif: "crystal growth: clustered prisms and rising motes; on a follower it takes its element's colour" },
        drone:      { col: "#b6c4d6", name: "GUNMETAL",     motif: "machined panels: seams, rivets and vent slats" },
        jelly:      { col: "#e39cff", name: "GEL ORCHID",   motif: "soft membrane cells with nuclei, a gel's wobble" },
    };

    // ICONS (proposed): the dock's line style (24 units, stroke 2.2, round caps and joins, currentColor). One of each set, as the first pieces.
    const ICONS = {
        crustacean: '<path d="M6.5 15.6c0-2.6 2.5-4.3 5.5-4.3s5.5 1.7 5.5 4.3-2.5 3.9-5.5 3.9-5.5-1.3-5.5-3.9z"/><path d="M7.7 12.5 5.6 9.7M16.3 12.5l2.1-2.8"/><path d="M5.6 9.7C3.6 9.3 2.7 7.4 3.2 5.6c.9.9 2 1.2 3.1 1 .3-1.2 1.1-2 2.2-2.4.4 2.3-.6 4.7-2.9 5.5zM18.4 9.7c2-.4 2.9-2.3 2.4-4.1-.9.9-2 1.2-3.1 1-.3-1.2-1.1-2-2.2-2.4-.4 2.3.6 4.7 2.9 5.5z"/><path d="M10.7 11.4V9.8M13.3 11.4V9.8"/><path d="M6.8 16.7 3.7 17.9M7.4 18.5l-2.5 2M17.2 16.7l3.1 1.2M16.6 18.5l2.5 2"/>',
        fire: '<path d="M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3.6 2.8-5.5 3.9-8.8.9 1.6 1.9 2.5 3 2.9-.2-2.5.8-4.7 2.6-5.9-.3 3 1.6 4.8 2.8 6.6 1.1 1.6 1.7 3.2 1.7 5.2 0 3.5-2.6 6.2-6.5 6.2z"/><path d="M12 21c-1.8 0-3-1.3-3-3 0-1.9 1.6-2.7 2.2-4.4.7 1.2 1.6 1.4 2.1 2.9.2.5.2.9.2 1.5 0 1.7-1.2 3-1.5 3z"/>',
        ant: '<circle cx="12" cy="5.6" r="2.1"/><ellipse cx="12" cy="11" rx="1.9" ry="2.4"/><ellipse cx="12" cy="17.6" rx="3.2" ry="3.7"/><path d="M10.6 4.2L8.4 1.9M13.4 4.2l2.2-2.3"/><path d="M10.2 10.1L6 8.2M13.8 10.1L18 8.2M10.1 11.9L5.6 12.4M13.9 11.9l4.5.5M10.4 13.2l-3.6 3.5M13.6 13.2l3.6 3.5"/>',
    };
    const iconSvg = (key, size, col, sw) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="' + (col || "currentColor") + '" stroke-width="' + (sw || 2.2) + '" stroke-linecap="round" stroke-linejoin="round">' + ICONS[key] + "</svg>";

    // A follower's backdrop with the species layer (the third), as js/cardart.js cardArtMixSvg makes the first two; `mode` is how the third layer is laid
    function backdrop3(el, cls, sp, mode) {
        const W = 300, H = 175, band = (inner, top, extra) => '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="0 ' + top + " " + W + " " + H + '" preserveAspectRatio="xMidYMid slice"' + (extra || "") + ">" + inner + "</svg>";
        const elBand = band(cardArtTexture(el), CARD_ART.band[el] || 0), clsBand = band(cardArtTexture(cls), CARD_ART.band[cls] || 0, ' color="' + cardArtMix(cardArtElementColour(el), "#ffffff", CARD_ART.tint) + '" opacity="' + CARD_ART.tintAlpha + '"');
        if (!sp) return _caDoc(W, H, elBand + clsBand);
        const spTex = sp === "crustacean" ? crustacean() : "", T = THEMES[sp];
        let third = "";
        if (mode === "full") third = band(spTex, 60, ' color="' + T.col + '" opacity=".8"');
        else if (mode === "white") third = band(spTex, 60, ' color="#ffffff" opacity=".55"');
        else if (mode === "edge") third = '<defs><linearGradient id="spFade" x1="0" y1="0" x2="1" y2="0"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="spMask"><rect width="300" height="175" fill="url(#spFade)"/></mask></defs><g mask="url(#spMask)">' + band(spTex, 60, ' color="' + T.col + '"') + "</g>";
        else if (mode === "bottom") third = '<defs><linearGradient id="spFadeB" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="spMaskB"><rect width="300" height="175" fill="url(#spFadeB)"/></mask></defs><g mask="url(#spMaskB)">' + band(spTex, 60, ' color="' + T.col + '"') + "</g>";
        else if (mode === "big") third = '<svg x="0" y="0" width="' + W + '" height="' + H + '" viewBox="40 40 150 88" preserveAspectRatio="xMidYMid slice" color="' + T.col + '" opacity=".75">' + spTex + "</svg>";
        return _caDoc(W, H, elBand + clsBand + third);
    }
    root.PART2 = { crustacean, THEMES, ICONS, iconSvg, backdrop3 };
})(typeof window !== "undefined" ? window : globalThis);
