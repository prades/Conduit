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
    // THE ELEMENTAL TEXTURE (round 2, 2026-11-06; the owner, of a first try with little crystal clusters: "New cloud texture is puffy and stormy no repreating icons"): storm clouds. Banks of
    // billowing puffs piled on flat cloud bases, a back row dimmer than the front, a soft dark band under each base, a few broad wisps swirling through, two faint glows lit inside the cloud. No motif
    // is repeated: every puff has its own size and place. Faint, as the crust and the sheen are. On a follower it takes its element's colour (the theme as written).
    function elemental() {
        seed = 61;
        const W = 300;
        let back = "", front = "", bases = "", dark = "", wisps = "";
        for (let b = 0, y0 = 22; y0 < 450; b++, y0 += 40 + rnd() * 36) {   // banks at uneven heights, each a little tilted
            const near = rnd() < .55, tilt = (rnd() - .5) * .12, puffs = [];
            for (let x = -40 + rnd() * 24; x < W + 40;) {
                const r = (near ? 11 : 15) + rnd() * (near ? 19 : 24), by = y0 + tilt * (x - 150);
                puffs.push('<circle cx="' + Math.round(x) + '" cy="' + Math.round(by - r * .5 + (rnd() - .5) * 8) + '" r="' + Math.round(r) + '"/>');
                x += r * (.45 + rnd() * .35);   // puffs overlap, so a bank reads as one billow, not a row of balls
            }
            if (near) front += puffs.join(""); else back += puffs.join("");
            bases += '<rect x="-20" y="' + Math.round(y0 - 8) + '" width="340" height="30" transform="rotate(' + R(Math.atan(tilt) * 180 / Math.PI) + ' 150 ' + Math.round(y0) + ')"/>';
        }
        for (let k = 0; k < 5; k++) dark += '<ellipse cx="' + Math.round(rnd() * W) + '" cy="' + Math.round(rnd() * 420) + '" rx="' + Math.round(60 + rnd() * 60) + '" ry="' + Math.round(30 + rnd() * 26) + '"/>';
        const sweep = (y0, amp, half, tilt) => { let d = "M-40 " + R(y0) + "Q" + R(-40 + half / 2) + " " + R(y0 - amp) + " " + R(-40 + half) + " " + R(y0 + tilt * half); for (let x = -40 + 2 * half; x <= W + 40 + half; x += half) d += "T" + R(x) + " " + R(y0 + tilt * (x + 40)); return d; };
        for (let k = 0; k < 4; k++) wisps += '<path d="' + sweep(40 + k * 110 + (rnd() - .5) * 30, 14 + rnd() * 12, 90 + rnd() * 50, -.12 + rnd() * .1) + '" stroke-width="' + Math.round(16 + rnd() * 14) + '"/>';
        return '<defs><radialGradient id="clF" cx=".45" cy=".42" r=".6" fx=".4" fy=".26"><stop offset="0" stop-color="currentColor" stop-opacity=".18"/><stop offset=".5" stop-color="currentColor" stop-opacity=".085"/><stop offset=".78" stop-color="currentColor" stop-opacity=".02"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>'
            + '<radialGradient id="clB" cx=".45" cy=".42" r=".6" fx=".4" fy=".28"><stop offset="0" stop-color="currentColor" stop-opacity=".1"/><stop offset=".6" stop-color="currentColor" stop-opacity=".04"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>'
            + '<linearGradient id="clS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".35" stop-color="#000" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>'
            + '<radialGradient id="clD"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
            + '<radialGradient id="clL"><stop offset="0" stop-color="#ffffff" stop-opacity=".07"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>'
            + '<g id="clAll"><g fill="url(#clB)">' + back + '</g><g fill="url(#clD)">' + dark + '</g><g fill="url(#clS)">' + bases + '</g><g fill="url(#clF)">' + front + "</g>"
            + '<g fill="url(#clL)"><ellipse cx="78" cy="150" rx="70" ry="46"/><ellipse cx="228" cy="318" rx="64" ry="42"/></g>'
            + '<g fill="none" stroke="currentColor" stroke-opacity=".04" stroke-linecap="round">' + wisps + "</g></g>";
    }
    const TEX = { crustacean, mollusk, elemental }, TEX_ID = { crustacean: "cuAll", mollusk: "moAll", elemental: "clAll" };   // a species' texture, and the id of its drawing (so a follower's band can lay it twice across)
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
    root.PART2 = { crustacean, mollusk, elemental, TEX, THEMES, ICONS, iconSvg, backdrop3 };
})(typeof window !== "undefined" ? window : globalThis);
