// THE FORMS' EFFECT PIECES IN 3D (docs/EFFECTS.md, the 3-D flare pass; the owner chose "Modelled 3D pieces", 2026-11-09). Each piece is a model baked by design/effects/bake_fx.js to img/fx/<piece>.png:
// one column for each way it can fly round the floor (yaws; the first along the game's +x, then turning towards +y) and one row for each tilt (pitches, in radians: nose down to nose up), each a square cell
// at the forms' own pixels a unit, so it is drawn at their scale (EVO_SCALE). docs/ART-PROCESS.md: one piece first, and the old look stays until the owner approves the new one IN THE GAME:
//   approved   the pieces the owner approved in the game: shown to everyone. The rest show only on a preview (?fx=3d), so a piece can be looked at while the old look stays on for everyone.
const FX3D = {
    pieces: {
        // the QUILLSTONE's quill (QUILL BURST, QUILLSTORM): one of the red crystal shards on its back (design/evolutions/forms15.js), the model approved 2026-11-09 ("Yes, build it"); built in build 2026-11-09e on the preview; approved in the game the same day, for everyone since 2026-11-09f
        quill: { sheet: "img/fx/quill.png", cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },
        // the RIMESTAR's icicle (ICICLE VOLLEY): one of the frost shards its cast throws (design/evolutions/forms32.js), made big, a slender six-sided spike of pale blue ice; the model approved 2026-11-09 ("Yes, build it"); built in build 2026-11-09g on the preview; approved in the game the same day, for everyone since 2026-11-09h
        icicle: { sheet: "img/fx/icicle.png", cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },
        // the ROTSHARD's black spike (ROTTEN DECOY, TOXIC PUDDLE; the CRYSTAL SPIKE TRIO card's cluster is the same): a spike of its old glassy-black shell (design/evolutions/forms5.js shellShard), its faces broken, chips at its
        // foot, a hairline of its green crystal light in a crack; the owner's pick ("Rotshard's black spike") and the model approved 2026-11-09 ("Yes, build it"); built in build 2026-11-09u on the preview; approved in the game the same day, for everyone since 2026-11-09v.
        // UPRIGHT: it stands on the floor; its columns are the ways it is turned (yaws), one row; ax, ay its foot in the cell and tipY its tip (design/effects/out/rotspike.json), so it is drawn foot on the floor, rising out of it
        rotspike: { sheet: "img/fx/rotspike.png", cell: 72, yaws: 8, pitches: [0], upright: true, ax: 36, ay: 53.716, tipY: 11.535 },
        // ROTTEN DECOY as a BLACK ROTSHARD (the owner, 2026-11-09: "Make the decoy a black Rotshard"; the model approved: "Yes, build it"): its design's "black crystal copy", the Rotshard's own model
        // (design/evolutions/forms5.js No. 101) all in black, no glow, the shell shard's thin green crack kept. A COPY: its columns are frames of the Rotshard's idle loop (`loop` game frames), drawn at the
        // forms' scale; built in build 2026-11-09x on the preview; approved in the game the same day, for everyone since 2026-11-09aa
        rotdecoy: { sheet: "img/fx/rotdecoy.png", cell: 144, yaws: 12, pitches: [0], upright: true, copy: true, loop: 236, ax: 72, ay: 102.81, tipY: 29.453 },
        // PINK THICKET's big seed (the THORNWHIP's Ultimate): its pink crystal (design/evolutions/forms39.js) cut as a seed, pointed at both ends, just the crystal ("Just a crystal": no stalk since 2026-11-09dd), no glow; the owner's pick of
        // three drafts, 2026-11-09 (circled: "its pink crystal, as a seed"); built in build 2026-11-09bb on the preview; approved in the game the same day, for everyone since 2026-11-09cc. It flies as the quill does
        bigseed: { sheet: "img/fx/bigseed.png", cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },
        // PROXY SWARM's goo copies (the GOO PROXY's Ultimate): the Goo Proxy's own model (design/evolutions/forms31.js No. 853, the frog), all of it in the violet goo of its head, the ring and its spikes too,
        // its diamond eyes kept, no glow under it; the owner's pick of three looks, 2026-11-09 ("A · all its violet goo"); built in build 2026-11-09ee on the preview; approved in the game the same day, for everyone since 2026-11-09ff. A COPY, as ROTTEN DECOY's: its columns are
        // frames of the frog's idle loop (`loop` game frames), drawn at the forms' scale
        goocopy: { sheet: "img/fx/goocopy.png", cell: 144, yaws: 12, pitches: [0], upright: true, copy: true, loop: 236, ax: 72, ay: 90.486, tipY: 46.472 },
    },
    approved: ["quill",    // the QUILLSTONE's quill: approved in the game 2026-11-09 ("Approve it for everyone"), live for everyone since build 2026-11-09f
               "icicle",   // the RIMESTAR's icicle: approved in the game 2026-11-09 ("Approve it for everyone"), live for everyone since build 2026-11-09h
               "rotdecoy",   // ROTTEN DECOY as a black Rotshard: approved in the game 2026-11-09 ("Approve the black decoy"), live for everyone since build 2026-11-09aa
               "bigseed",   // PINK THICKET's big seed as the Thornwhip's pink crystal: approved in the game 2026-11-09 ("Approve it for everyone"), live for everyone since build 2026-11-09cc
               "goocopy"],   // PROXY SWARM's goo copies, the Goo Proxy in its violet goo: approved in the game 2026-11-09 ("Approve it for everyone"), live for everyone since build 2026-11-09ff
    // (the ROTSHARD's black spike was approved in the game on 2026-11-09 and taken back the same day: "it still looks like trash. I don't like the green aura": on the preview again, its aura gone, build 2026-11-09w)
};
let _fx3dPrev = null;
function fx3dPreview() { try { return typeof location !== "undefined" && /[?&]fx=3d\b/.test(location.search || ""); } catch (e) { return false; } }
// is this piece drawn in 3D? (approved, or the preview is on)
function fx3dOn(piece) {
    if (!FX3D.pieces[piece]) return false;
    if (FX3D.approved.indexOf(piece) >= 0) return true;
    if (_fx3dPrev === null) _fx3dPrev = fx3dPreview();
    return _fx3dPrev;
}
// its sheet, asked for the first time it is wanted (null until it has arrived: the old look is drawn meanwhile)
function _fx3dImg(piece) {
    const P = FX3D.pieces[piece]; if (!P) return null;
    if (P._img !== undefined) { const e = P._img; return e && e.complete && e.naturalWidth ? e : null; }
    P._img = null;
    if (typeof Image === "undefined") return null;
    const im = new Image();
    im.onload = () => { P._img = im; };
    im.src = P.sheet + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    P._img = im;
    return null;
}
// has its sheet arrived? (until it has, the caller draws the old look)
function fx3dReady(piece) { return !!_fx3dImg(piece); }
// which cell: the column of the way it flies on the floor (vx, vy: the game's own axes), the row of the tilt nearest its climb (radians, nose up > 0)
function fx3dCell(piece, vx, vy, climb) {
    const P = FX3D.pieces[piece]; if (!P) return null;
    const step = 2 * Math.PI / P.yaws, k = ((Math.round(Math.atan2(vy, vx) / step) % P.yaws) + P.yaws) % P.yaws;
    let j = 0; for (let i = 1; i < P.pitches.length; i++) if (Math.abs(P.pitches[i] - (climb || 0)) < Math.abs(P.pitches[j] - (climb || 0))) j = i;
    return [k, j];
}
// A STANDING piece (FX3D.pieces[piece].upright): its foot on the floor at the screen point (sx, sy), turned to its column k (any whole number: it wraps), hpx tall on the screen, risen `rise` (0..1) out of the floor:
// while it rises only the part above the floor is drawn (no clip: the cell is cut where the floor meets it). False when its sheet has not arrived (the caller draws the old look).
function fx3dDrawUpright(g, piece, sx, sy, k, hpx, rise) {
    const P = FX3D.pieces[piece], img = P && P.upright && _fx3dImg(piece); if (!img) return false;
    const C = P.cell, col = ((Math.floor(k) % P.yaws) + P.yaws) % P.yaws, H0 = P.ay - P.tipY, sc = hpx / H0, r = Math.max(0, Math.min(1, rise === undefined ? 1 : rise));
    if (r <= 0 || !(sc > 0)) return true;
    const cell = typeof spriteCell === "function" ? spriteCell(img, col * C, 0, C, C) : null, D = (1 - r) * H0;   // (D: how far its foot is still under the floor, in the cell's pixels)
    const rows = r >= 1 ? C : Math.max(1, Math.min(C, P.ay - D)), dx = sx - P.ax * sc, dy = sy + D * sc - P.ay * sc;   // (risen whole, its foot and the chips round it are drawn too)
    if (cell) g.drawImage(cell, 0, 0, C, rows, dx, dy, C * sc, rows * sc); else g.drawImage(img, col * C, 0, C, rows, dx, dy, C * sc, rows * sc);
    return true;
}
// draw it centred on the screen point (sx, sy); false when its sheet has not arrived (the caller draws the old look)
function fx3dDraw(g, piece, sx, sy, vx, vy, climb) {
    const P = FX3D.pieces[piece], img = P && _fx3dImg(piece); if (!img) return false;
    const kj = fx3dCell(piece, vx, vy, climb), C = P.cell, s = typeof EVO_SCALE === "number" ? EVO_SCALE : 96 / 144, d = C * s;
    const cell = typeof spriteCell === "function" ? spriteCell(img, kj[0] * C, kj[1] * C, C, C) : null;   // (its own small canvas: js/draw.js)
    if (cell) g.drawImage(cell, sx - d / 2, sy - d / 2, d, d); else g.drawImage(img, kj[0] * C, kj[1] * C, C, C, sx - d / 2, sy - d / 2, d, d);
    return true;
}
