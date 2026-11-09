// THE FORMS' EFFECT PIECES IN 3D (docs/EFFECTS.md, the 3-D flare pass; the owner chose "Modelled 3D pieces", 2026-11-09). Each piece is a model baked by design/effects/bake_fx.js to img/fx/<piece>.png:
// one column for each way it can fly round the floor (yaws; the first along the game's +x, then turning towards +y) and one row for each tilt (pitches, in radians: nose down to nose up), each a square cell
// at the forms' own pixels a unit, so it is drawn at their scale (EVO_SCALE). docs/ART-PROCESS.md: one piece first, and the old look stays until the owner approves the new one IN THE GAME:
//   approved   the pieces the owner approved in the game: shown to everyone. The rest show only on a preview (?fx=3d), so a piece can be looked at while the old look stays on for everyone.
const FX3D = {
    pieces: {
        // the QUILLSTONE's quill (QUILL BURST, QUILLSTORM): one of the red crystal shards on its back (design/evolutions/forms15.js), the model approved 2026-11-09 ("Yes, build it"); built in build 2026-11-09e
        quill: { sheet: "img/fx/quill.png", cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },
    },
    approved: [],
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
// draw it centred on the screen point (sx, sy); false when its sheet has not arrived (the caller draws the old look)
function fx3dDraw(g, piece, sx, sy, vx, vy, climb) {
    const P = FX3D.pieces[piece], img = P && _fx3dImg(piece); if (!img) return false;
    const kj = fx3dCell(piece, vx, vy, climb), C = P.cell, s = typeof EVO_SCALE === "number" ? EVO_SCALE : 96 / 144, d = C * s;
    const cell = typeof spriteCell === "function" ? spriteCell(img, kj[0] * C, kj[1] * C, C, C) : null;   // (its own small canvas: js/draw.js)
    if (cell) g.drawImage(cell, sx - d / 2, sy - d / 2, d, d); else g.drawImage(img, kj[0] * C, kj[1] * C, C, C, sx - d / 2, sy - d / 2, d, d);
    return true;
}
