// ─────────────────────────────────────────────────────────
//  THE FACILITY'S 3D PROPS (docs/TUTORIAL.md, "3D props")
// ─────────────────────────────────────────────────────────
// The sentry turrets, the potted plants, the arena's missile truck and liquid tanks, the lab's tank and the catwalk bridges are modelled in 3D (design/props/models/*.js) and baked to sprite sheets
// (design/props/bake_props.js -> img/props/<family>.png, with where everything is in js/propatlas.js) in the game's own iso projection and scale: one world unit of the model is one tile, so a sprite is simply
// placed with the model's origin (the middle of its footprint, on the floor) at the prop's centre. This file draws them; a prop whose sheet has not arrived is drawn the old, flat way (nothing is ever missing).
//   (every other kind of prop is a sprite too: see PS_FAMILY for the sheets and the variant names.)
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
    const im = document.createElement("img"); im.onload = () => { _psImgs[fam] = im; };   // (decoded off the main thread, so the first frame that draws it does not stall)
    im.decoding = "async";
    im.src = "img/props/" + fam + ".png" + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    _psImgs[fam] = im; return null;
}
// the whole sheet in the dark navy, same alpha (built once)
function _psSil(fam, img) {
    if (_psSils[fam]) return _psSils[fam];
    try { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = PS.dark; g.fillRect(0, 0, c.width, c.height); return (_psSils[fam] = c); } catch (e) { return (_psSils[fam] = img); }
}
// A SLOW DEVICE: if the game keeps running under 28 frames a second (three readings in a row, a second and a half apart, once it has settled), the graphics go to LOW for the session (no contact shadows,
// no soft glows: the settings window's GRAPHICS switch does the same by hand). It never goes back by itself, so it cannot flicker between the two.
function facilityPerfTick() {
    if (typeof gfxLow === "undefined" || gfxLow || typeof _perf === "undefined" || !_fp) return;
    const f = typeof frame !== "undefined" ? frame : 0; if (f < 420 || f % 90 !== 0) return;
    _fp.slow = (_fp.slow || 0) + (_perf.fps > 0 && _perf.fps < 28 ? 1 : -(_fp.slow || 0));
    if (_fp.slow >= 3) { gfxLow = true; if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text: "SLOW DEVICE \u2014 GRAPHICS SET TO LOW", color: "#ffb347", life: 240, vy: -0.04, size: 14 }); }
}
// start loading every sheet (the facility opens: so a prop is never seen in its flat drawing for a moment before its sprite arrives)
function facilityPropsPreload() { if (typeof PROP_ATLAS !== "undefined") for (const fam of Object.keys(PROP_ATLAS)) _psImg(fam); }
function _psCell(fam, name) { const A = typeof PROP_ATLAS !== "undefined" ? PROP_ATLAS[fam] : null; return A && A.cells[name] ? A.cells[name] : null; }
// ONE CELL'S SLICE of a big sprite: the pixels of the sprite that lie in the column of one tile (the diamond on the floor and the same lifted as high as the sprite goes), cut once and kept, so a multi-cell prop is drawn
// with plain drawImage of small canvases and no clip per cell per frame (a clip and its restore were a fifth of the frame). ox, oy: where the cell is from the prop's centre, in tiles. Returns { cv, sil, dx, dy } (the
// canvas, its dark silhouette when it was first needed, and where its top-left is from the cell's ground point) or null when nothing of the sprite is in that column.
const _psSlices = new Map();
function _psSlice(fam, name, ox, oy, img, c) {
    const key = fam + "|" + name + "|" + ox + "|" + oy; let sl = _psSlices.get(key); if (sl !== undefined) return sl;
    if (_psSlices.size > 900) _psSlices.clear();   // (a bound on the memory: they are cut again when needed)
    sl = null;
    try {
        const cx = c.ax + (ox - oy) * TILE_W, cy = c.ay + (ox + oy) * TILE_H, H = c.ay + 6;   // the cell's ground point in the sprite's own pixels, and how high the column goes
        const x0 = Math.max(0, Math.floor(cx - TILE_W)), x1 = Math.min(c.w, Math.ceil(cx + TILE_W)), y0 = Math.max(0, Math.floor(cy - TILE_H - H)), y1 = Math.min(c.h, Math.ceil(cy + TILE_H));
        if (x1 > x0 && y1 > y0) {
            const cv = document.createElement("canvas"); cv.width = x1 - x0; cv.height = y1 - y0; const g = cv.getContext("2d");
            g.beginPath(); g.moveTo(cx - TILE_W - x0, cy - y0); g.lineTo(cx - TILE_W - x0, cy - H - y0); g.lineTo(cx - x0, cy - TILE_H - H - y0); g.lineTo(cx + TILE_W - x0, cy - H - y0); g.lineTo(cx + TILE_W - x0, cy - y0); g.lineTo(cx - x0, cy + TILE_H - y0); g.closePath(); g.clip();
            g.drawImage(img, c.x + x0, c.y + y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
            // cut to what is in it
            const d = g.getImageData(0, 0, cv.width, cv.height).data; let a0 = cv.width, b0 = cv.height, a1 = -1, b1 = -1;
            for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 6) { if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y; }
            if (a1 >= 0) { const w = a1 - a0 + 1, h = b1 - b0 + 1, o = document.createElement("canvas"); o.width = w; o.height = h; o.getContext("2d").drawImage(cv, a0, b0, w, h, 0, 0, w, h); sl = { cv: o, sil: null, dx: x0 + a0 - cx, dy: y0 + b0 - cy }; }
        }
    } catch (e) { sl = null; }
    _psSlices.set(key, sl); return sl;
}
function _psSliceSil(sl) {
    if (sl.sil) return sl.sil;
    try { const c = document.createElement("canvas"); c.width = sl.cv.width; c.height = sl.cv.height; const g = c.getContext("2d"); g.drawImage(sl.cv, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = PS.dark; g.fillRect(0, 0, c.width, c.height); return (sl.sil = c); } catch (e) { return (sl.sil = sl.cv); }
}
// THE LIGHT: a prop in a dim room is its dark silhouette with the lit sprite over it at the room's light level k (the dimmed pen's factor, ctx._k). Drawing both every frame doubles the work of every prop in the dark
// (which is most of them), so: nearly dark (k < 0.1) is the silhouette alone, and between it is composed once per light level (k rounded to a twelfth) into a small canvas that is then drawn as one image.
const PS_DIM_STEPS = 12;
function _psDimmed(cv, src, sx, sy, sw, sh, sil, bucket, store) {   // store: the object that keeps this canvas's dimmed versions by bucket
    let d = store[bucket]; if (d) return d;
    try { const c = document.createElement("canvas"); c.width = sw; c.height = sh; const g = c.getContext("2d"); g.drawImage(sil, sx, sy, sw, sh, 0, 0, sw, sh); g.globalAlpha = bucket / PS_DIM_STEPS; g.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh); d = store[bucket] = c; } catch (e) { d = store[bucket] = null; }
    return d;
}
// draw one sprite with the model's origin at world (x, y) on the current item's floor; `clip` (a cell's x, y) draws only that tile's column of it. Returns the sprite's top-left on screen, or null (not drawn).
function _psBlit(fam, name, x, y, clip) {
    const img = _psImg(fam), c = _psCell(fam, name); if (!img || !c) return null;
    const k = ctx._k === undefined ? 1 : ctx._k, bucket = k < 0.1 ? 0 : Math.min(PS_DIM_STEPS, Math.round(k * PS_DIM_STEPS));
    if (clip) {
        const sl = _psSlice(fam, name, Math.round((clip[0] - x) * 100) / 100, Math.round((clip[1] - y) * 100) / 100, img, c), g = _fpP(clip[0], clip[1], 0);
        if (sl) {
            const px = g[0] + sl.dx, py = g[1] + sl.dy;
            if (bucket >= PS_DIM_STEPS) ctx.drawImage(sl.cv, px, py);
            else if (bucket === 0) ctx.drawImage(_psSliceSil(sl), px, py);
            else { sl.dim = sl.dim || {}; const d = _psDimmed(sl.cv, sl.cv, 0, 0, sl.cv.width, sl.cv.height, _psSliceSil(sl), bucket, sl.dim); ctx.drawImage(d || sl.cv, px, py); }
        }
        const p = _fpP(x, y, 0); return [p[0] - c.ax, p[1] - c.ay, c];
    }
    const p = _fpP(x, y, 0), dx = p[0] - c.ax, dy = p[1] - c.ay;
    if (bucket >= PS_DIM_STEPS) ctx.drawImage(img, c.x, c.y, c.w, c.h, dx, dy, c.w, c.h);
    else if (bucket === 0) ctx.drawImage(_psSil(fam, img), c.x, c.y, c.w, c.h, dx, dy, c.w, c.h);
    else { c.dim = c.dim || {}; const d = _psDimmed(null, img, c.x, c.y, c.w, c.h, _psSil(fam, img), bucket, c.dim); if (d) ctx.drawImage(d, dx, dy); else ctx.drawImage(img, c.x, c.y, c.w, c.h, dx, dy, c.w, c.h); }
    return [dx, dy, c];
}
// where a prop is: its centre (a circle's middle, else the middle of its box)
function _psCentre(id) {
    if (!_fp._psc) { _fp._psc = new Map(); for (const s of _fp.F.solids) _fp._psc.set(s.id, s.shape === "circle" ? [s.at[0], s.at[1]] : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2]); }
    return _fp._psc.get(id) || null;
}

// ── which sheet a kind of prop is on, and which variant of it a given prop is ──
// The sheets (design/props/models/<family>.js): office (the desks, consoles, server racks), lounge (the sofas, tables, vending machines...), lab (benches, the fume hood, test chambers, the generator...), tech (teleporters,
// relays, the charger, the mech bay, lockers, cabinets, display cases, the telescope), cargo (crates, barrels, floodlights, barriers, the supply case), power (the arena's big generator), plant, sentry, truck, tank, bridge.
// A variant is named  kind[.WxH|.rNN][.on|.off][.sN]  : the size of the prop in tiles (WxH along x and y; rNN a round prop's radius in hundredths), its state (a relay or the charger: online or not), and a look (s0, s1...:
// a prop picks one by its id, so a row of crates is not a row of the same crate). The most specific variant that exists is used: a kind with one model for every size is just `kind`.
const PS_FAMILY = {
    reception_desk: "office", computer_desk: "office", desk: "office", console: "office", server_rack: "office",
    couch: "lounge", table: "lounge", beanbag: "lounge", pingpong: "lounge", vending: "lounge", cooler: "lounge", bin: "lounge", chair: "lounge",
    lab_bench: "lab", fume_hood: "lab", test_chamber: "lab", cart: "lab", generator: "lab", toolbox: "lab", speaker: "lab", spool: "lab",
    teleporter: "tech", charger: "tech", relay: "tech", mech_bay: "tech", locker: "tech", cabinet: "tech", display_case: "tech", telescope: "tech",
    crate: "cargo", crate_stack: "cargo", barrel: "cargo", floodlight: "cargo", barrier: "cargo",
    main_generator: "power", plant: "plant", sentry: "sentry", semi_truck: "truck", liquid_reserve: "tank", tank: "tank", bridge: "bridge",
};
const _psIndex = {};
function _psNames(fam) {   // the variants of a sheet, parsed: { kind: [{ name, dims, state, style }] }
    if (_psIndex[fam]) return _psIndex[fam];
    const out = {}, A = typeof PROP_ATLAS !== "undefined" ? PROP_ATLAS[fam] : null;
    if (A) for (const name of Object.keys(A.cells)) {
        const t = name.split("."), e = { name, dims: null, state: null, style: null }; for (const x of t.slice(1)) { if (/^(\d+x\d+|r\d+)$/.test(x)) e.dims = x; else if (x === "on" || x === "off") e.state = x; else if (/^s\d+$/.test(x)) e.style = +x.slice(1); }
        (out[t[0]] = out[t[0]] || []).push(e);
    }
    return (_psIndex[fam] = out);
}
function _psResolve(fam, kind, dims, state, seed) {
    let c = _psNames(fam)[kind]; if (!c || !c.length) return null;
    const pick = (list, key, want) => { const exact = list.filter(e => e[key] === want); return exact.length ? exact : list.filter(e => e[key] === null).length ? list.filter(e => e[key] === null) : list; };
    c = pick(c, "dims", dims); c = pick(c, "state", state);
    const styled = c.filter(e => e.style !== null).sort((a, b) => a.style - b.style); return styled.length ? styled[seed % styled.length].name : c[0].name;
}
// is a cell of a multi-cell prop on its outline (where a shadow is seen)
function _psEdgeCell(S, it) { if (S.round) return Math.hypot(it.x - S.c[0], it.y - S.c[1]) > S.round - 1.1; const b = S.bb; return it.x - 0.5 <= b[0] + 0.01 || it.x + 0.5 >= b[2] - 0.01 || it.y - 0.5 <= b[1] + 0.01 || it.y + 0.5 >= b[3] - 0.01; }
function _psHash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function _psSolid(id) {
    if (!_fp._pss) { _fp._pss = new Map(); for (const s of _fp.F.solids) { const w = s.shape === "circle" ? 0 : Math.round(s.bb[2] - s.bb[0]), l = s.shape === "circle" ? 0 : Math.round(s.bb[3] - s.bb[1]); _fp._pss.set(s.id, { c: s.shape === "circle" ? [s.at[0], s.at[1]] : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2], dims: s.shape === "circle" ? "r" + Math.round(s.r * 100) : w + "x" + l, multi: s.shape === "circle" || w > 1 || l > 1, bb: s.bb, round: s.shape === "circle" ? s.r : 0 }); } }
    return _fp._pss.get(id) || null;
}

// a soft contact shadow on the floor under every cell of a prop (a pre-rendered stamp: the sprites carry no ground shadow), drawn between the floor and the sprite
let _psShadowC = null;
function _psShadowStamp() {
    if (_psShadowC !== null) return _psShadowC || null;
    try { const c = document.createElement("canvas"); c.width = 128; c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 32, 4, 64, 32, 64); gr.addColorStop(0, "rgba(4,8,18,0.5)"); gr.addColorStop(0.55, "rgba(4,8,18,0.28)"); gr.addColorStop(1, "rgba(4,8,18,0)");
        g.save(); g.translate(0, 32); g.scale(1, 0.5); g.translate(0, -32); g.fillStyle = gr; g.fillRect(0, -32, 128, 128); g.restore(); _psShadowC = c; } catch (e) { _psShadowC = false; }
    return _psShadowC || null;
}
function _psShadow(it) { if (typeof gfxLow !== "undefined" && gfxLow) return; /* (LOW graphics: no contact shadows) */ const st = _psShadowStamp(); if (!st) return; const p = _fpP(it.x, it.y, 0), a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * 0.9; ctx.drawImage(st, p[0] - 66, p[1] - 33, 132, 66); ctx.globalAlpha = a0; }

// draw one cell of a prop from its sprite (the start of the prop drawing, js/facilityplay.js _fpDrawProp): true when it drew it (the floor under it first: a solid tile is not drawn by itself), false to let the flat drawing do it
function facilitySpriteDraw(it) {
    const k = it.kind, fam = PS_FAMILY[k]; if (!fam) return false;
    if (k === "bridge") return !!_psBlit("bridge", it.variant, it.x, it.y);
    if (!_psImg(fam)) return false;
    const f = typeof frame !== "undefined" ? frame : 0, S = _psSolid(it.id), seed = _psHash(String(it.id));
    if (!it.spriteOnly) { _fpFloorUnder(it); if (!S || !S.multi || _psEdgeCell(S, it)) _psShadow(it); }   // (the shadow only on the cells at the prop's edge: the others are under the sprite)   // (a rim cell is ordinary floor, drawn already)
    if (k === "plant") { const dead = seed % 3 === 0; return !!_psBlit("plant", dead ? "d" + (seed % 2) : "p" + (seed % 4), it.x, it.y); }
    if (k === "sentry") {
        const on = typeof facilityFeedOn === "function" && facilityFeedOn(it.id), step = ((Math.round((it.aim || 0) / (Math.PI * 2 / PS.aimSteps)) % PS.aimSteps) + PS.aimSteps) % PS.aimSteps;
        const r = _psBlit("sentry", "a" + String(step).padStart(2, "0"), it.x, it.y); if (!r) return false;
        const c = r[2], lamp = c.marks && c.marks.lamp, mz = c.marks && c.marks.muzzle;
        if (lamp) { const lx = r[0] + lamp[0], ly = r[1] + lamp[1]; ctx.fillStyle = on ? "#31e8ff" : ((Math.floor(f / 30) + seed) % 3 ? "#3a1410" : "#ff4a3a"); ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, 6.2832); ctx.fill(); if (on && typeof _fpGlow === "function") _fpGlow(lx, ly, 22, "#31e8ff", 0.16); }
        if (mz && it.flash > 0 && typeof _fpGlow === "function") _fpGlow(r[0] + mz[0], r[1] + mz[1], 28, "#7ff2ff", 0.8);
        return true;
    }
    if (!S) return false;
    if (k === "semi_truck") return !!_psBlit("truck", "truck", S.c[0], S.c[1], [it.x, it.y]);
    if (k === "liquid_reserve" || k === "tank") return !!_psBlit("tank", k === "tank" ? "lab" : "reserve", S.c[0], S.c[1], [it.x, it.y]);
    const state = k === "relay" ? (typeof relayOnline === "function" && relayOnline(it.id) ? "on" : "off") : k === "charger" ? (typeof facilityFeedOn === "function" && facilityFeedOn(it.id) ? "on" : "off") : null;
    const name = _psResolve(fam, k, S.dims, state, seed); if (!name) return false;
    return !!_psBlit(fam, name, S.c[0], S.c[1], S.multi ? [it.x, it.y] : null);
}
// the supply case on the floor (js/facilitytutorial.js _fpDrawPickup): its sprite, if it has arrived; false for the flat box
function facilityCaseSprite(it) { const fam = "cargo"; if (!_psImg(fam)) return false; const name = _psResolve(fam, "case", null, null, _psHash(String(it.id))); return !!(name && _psBlit(fam, name, it.x, it.y)); }
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
