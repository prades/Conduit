// ─────────────────────────────────────────────────────────
//  THE FACILITY'S 3D PROPS (docs/TUTORIAL.md, "3D props")
// ─────────────────────────────────────────────────────────
// The sentry turrets, the potted plants, the arena's missile truck and liquid tanks, the lab's tank and the catwalk bridges are modelled in 3D (design/props/models/*.js) and baked to sprite sheets
// (design/props/bake_props.js -> img/props/<family>.png, with where everything is in js/propatlas.js) in the game's own iso projection and scale: one world unit of the model is one tile, so a sprite is simply
// placed with the model's origin (the middle of its footprint, on the floor) at the prop's centre. This file draws them; a prop whose sheet has not arrived is drawn the old, flat way (nothing is ever missing).
//   plant        one tile. Healthy (p0..p3, by the prop's seed) or dead and brown (d0, d1: the old rule, a third of them).
//   sentry       one tile. 16 variants a00..a15 for where the head aims (the old `aim`, rounded to 22.5 degrees); the status lamp (cyan when fed, a blinking red when not) and the muzzle flash are painted on its marks.
//   truck, tank  big. The prop is a set of one-tile CELLS (the items the game sorts by depth); each cell draws the whole sprite clipped to its own tile's column, so a unit walking round them goes in front of the
//                parts that are behind it and behind the parts in front. The round tanks add the cells round the rim that the circle only grazes, so its edge is not cut square.
//   bridge       a footbridge from each tank's top to the catwalks' deck: `bridges` in js/facilitymap.js, drawn as a row of one-tile pieces (mid, with a tank-end and a deck-end) at the deck's height.
// The light: a prop in the dark is dimmed by drawing its silhouette in the dark navy the flat drawing fades to, and the lit sprite over it at the room's light level (as the dimmed pen does for colours).
const PS = { dark: "#060b16", aimSteps: 16 };
const _psImgs = {}, _psSils = {};
function _psImg(fam) {
    if (_psImgs[fam] !== undefined) { const e = _psImgs[fam]; return e && e.complete && e.naturalWidth ? e : null; }
    _psImgs[fam] = null;
    if (typeof document === "undefined" || !document.createElement || typeof PROP_ATLAS === "undefined" || !PROP_ATLAS[fam]) return null;
    const im = document.createElement("img"); im.onload = () => { _psImgs[fam] = im; };
    im.src = "img/props/" + fam + ".png" + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    _psImgs[fam] = im; return null;
}
// the whole sheet in the dark navy, same alpha (built once)
function _psSil(fam, img) {
    if (_psSils[fam]) return _psSils[fam];
    try { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = PS.dark; g.fillRect(0, 0, c.width, c.height); return (_psSils[fam] = c); } catch (e) { return (_psSils[fam] = img); }
}
function _psCell(fam, name) { const A = typeof PROP_ATLAS !== "undefined" ? PROP_ATLAS[fam] : null; return A && A.cells[name] ? A.cells[name] : null; }
// draw one sprite with the model's origin at world (x, y) on the current item's floor; `clip` (a cell's x, y) cuts it to that tile's column. Returns the sprite's top-left on screen, or null (not drawn).
function _psBlit(fam, name, x, y, clip) {
    const img = _psImg(fam), c = _psCell(fam, name); if (!img || !c) return null;
    const p = _fpP(x, y, 0), dx = p[0] - c.ax, dy = p[1] - c.ay, k = ctx._k === undefined ? 1 : ctx._k;
    ctx.save();
    if (clip) {   // the tile's column: its diamond on the floor, and the same lifted as high as the sprite goes
        const H = c.ay + 6, X = clip[0], Y = clip[1], P = (u, v, z) => _fpP(X + u, Y + v, z), w0 = P(-0.5, 0.5, 0), w1 = P(-0.5, 0.5, H), n1 = P(-0.5, -0.5, H), e1 = P(0.5, -0.5, H), e0 = P(0.5, -0.5, 0), s0 = P(0.5, 0.5, 0);
        ctx.beginPath(); ctx.moveTo(w0[0], w0[1]); ctx.lineTo(w1[0], w1[1]); ctx.lineTo(n1[0], n1[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e0[0], e0[1]); ctx.lineTo(s0[0], s0[1]); ctx.closePath(); ctx.clip();
    }
    if (k < 0.98) { ctx.drawImage(_psSil(fam, img), c.x, c.y, c.w, c.h, dx, dy, c.w, c.h); ctx.globalAlpha = Math.max(0, k); }
    ctx.drawImage(img, c.x, c.y, c.w, c.h, dx, dy, c.w, c.h);
    ctx.restore();
    return [dx, dy, c];
}
// where a prop is: its centre (a circle's middle, else the middle of its box)
function _psCentre(id) {
    if (!_fp._psc) { _fp._psc = new Map(); for (const s of _fp.F.solids) _fp._psc.set(s.id, s.shape === "circle" ? [s.at[0], s.at[1]] : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2]); }
    return _fp._psc.get(id) || null;
}

// the small props: called by the furniture drawing (js/facilitydecor.js) once the floor under it is down; true when it drew the prop
function facilityPropSpriteDraw(it) {
    const k = it.kind, f = typeof frame !== "undefined" ? frame : 0, seed = it.seed || 0;
    if (k === "plant") { const dead = seed % 3 === 0; return !!_psBlit("plant", dead ? "d" + (seed % 2) : "p" + (seed % 4), it.x, it.y); }
    if (k === "sentry") {
        const on = typeof facilityFeedOn === "function" && facilityFeedOn(it.id), step = ((Math.round((it.aim || 0) / (Math.PI * 2 / PS.aimSteps)) % PS.aimSteps) + PS.aimSteps) % PS.aimSteps;
        const r = _psBlit("sentry", "a" + String(step).padStart(2, "0"), it.x, it.y); if (!r) return false;
        const c = r[2], lamp = c.marks && c.marks.lamp, mz = c.marks && c.marks.muzzle;
        if (lamp) { const lx = r[0] + lamp[0], ly = r[1] + lamp[1]; ctx.fillStyle = on ? "#31e8ff" : ((Math.floor(f / 30) + seed) % 3 ? "#3a1410" : "#ff4a3a"); ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, 6.2832); ctx.fill(); if (on && typeof _fpGlow === "function") _fpGlow(lx, ly, 22, "#31e8ff", 0.16); }
        if (mz && it.flash > 0 && typeof _fpGlow === "function") _fpGlow(r[0] + mz[0], r[1] + mz[1], 28, "#7ff2ff", 0.8);
        return true;
    }
    return false;
}
// the big props and the bridges (the start of the prop drawing, js/facilityplay.js _fpDrawProp): true when it drew the cell
function facilityBigSpriteDraw(it) {
    const k = it.kind;
    if ((k === "semi_truck" || k === "liquid_reserve" || k === "tank") && !it.spriteOnly && _psImg(k === "semi_truck" ? "truck" : "tank")) _fpFloorUnder(it);   // the floor under each of its solid cells (a solid tile is not drawn; a rim cell's floor is the ordinary floor), then the sprite over it
    if (k === "semi_truck") { const c = _psCentre(it.id); return !!(c && _psBlit("truck", "truck", c[0], c[1], [it.x, it.y])); }
    if (k === "liquid_reserve" || k === "tank") { const c = _psCentre(it.id); return !!(c && _psBlit("tank", k === "tank" ? "lab" : "reserve", c[0], c[1], [it.x, it.y])); }
    if (k === "bridge") return !!_psBlit("bridge", it.variant, it.x, it.y);
    return false;
}
// is this one of the sprite-only cells (a tank's rim) that is nothing without its sprite?
function facilitySpriteOnly(it) { return !!it.spriteOnly; }

// the cells round a round tank's rim that its circle only grazes, so the sprite is not cut off square where the cells stop (not solid: the prop's own cells are)
function _psRimItems(F, items) {
    const out = [];
    for (const s of F.solids) {
        if (s.shape !== "circle" || (s.kind !== "liquid_reserve" && s.kind !== "tank")) continue;
        const have = new Set(items.filter(i => i.fp === "prop" && i.id === s.id).map(i => i.x + "," + i.y)), R = s.r + 0.9;
        for (let x = Math.floor(s.at[0] - R); x <= Math.ceil(s.at[0] + R); x++) for (let y = Math.floor(s.at[1] - R); y <= Math.ceil(s.at[1] + R); y++) {
            if (have.has(x + "," + y) || Math.hypot(x - s.at[0], y - s.at[1]) > R) continue;
            out.push({ type: "fp", fp: "prop", room: s.room, base: facilityLiftPx(x, y), x, y, kind: s.kind, id: s.id, spriteOnly: true, depth: x + y, seed: 0 });
        }
    }
    return out;
}
// the bridges: from each named tank's east edge to the catwalks' west edge at the tank's y, a row of pieces at the arena floor's height (the sprite carries the deck's height)
function _psBridgeItems(F) {
    const out = [];
    for (const b of (F.bridges || [])) {
        const t = F.solids.find(s => s.id === b.from), cw = F.byId.get(b.to); if (!t || !cw) continue;
        const y = Math.round(t.at[1] * 2) / 2, x0 = t.at[0] + t.r - 0.35, x1 = cw.bb[0] + 0.5, n = Math.max(2, Math.round(x1 - x0));
        for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; out.push({ type: "fp", fp: "prop", room: "arena", base: facilityLiftPx(x, y), x, y, kind: "bridge", variant: i === 0 ? "tank" : i === n - 1 ? "deck" : "mid", id: b.id, depth: x + y + 0.01, seed: i }); }
    }
    return out;
}
