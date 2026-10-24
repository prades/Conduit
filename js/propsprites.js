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

// ── which sheet a kind of prop is on, and which variant of it a given prop is ──
// The sheets (design/props/models/<family>.js): office (the desks, consoles, server racks), lounge (the sofas, tables, vending machines...), lab (benches, the fume hood, test chambers, the generator...), tech (teleporters,
// relays, the charger, the mech bay, lockers, cabinets, display cases, the telescope), cargo (crates, barrels, floodlights, barriers, the supply case), plant, sentry, truck, tank, bridge.
// A variant is named  kind[.WxH|.rNN][.on|.off][.sN]  : the size of the prop in tiles (WxH along x and y; rNN a round prop's radius in hundredths), its state (a relay or the charger: online or not), and a look (s0, s1...:
// a prop picks one by its id, so a row of crates is not a row of the same crate). The most specific variant that exists is used: a kind with one model for every size is just `kind`.
const PS_FAMILY = {
    reception_desk: "office", computer_desk: "office", desk: "office", console: "office", server_rack: "office",
    couch: "lounge", table: "lounge", beanbag: "lounge", pingpong: "lounge", vending: "lounge", cooler: "lounge", bin: "lounge", chair: "lounge",
    lab_bench: "lab", fume_hood: "lab", test_chamber: "lab", cart: "lab", generator: "lab", toolbox: "lab", speaker: "lab", spool: "lab",
    teleporter: "tech", charger: "tech", relay: "tech", mech_bay: "tech", locker: "tech", cabinet: "tech", display_case: "tech", telescope: "tech",
    crate: "cargo", crate_stack: "cargo", barrel: "cargo", floodlight: "cargo", barrier: "cargo",
    plant: "plant", sentry: "sentry", semi_truck: "truck", liquid_reserve: "tank", tank: "tank", bridge: "bridge",
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
function _psHash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function _psSolid(id) {
    if (!_fp._pss) { _fp._pss = new Map(); for (const s of _fp.F.solids) { const w = s.shape === "circle" ? 0 : Math.round(s.bb[2] - s.bb[0]), l = s.shape === "circle" ? 0 : Math.round(s.bb[3] - s.bb[1]); _fp._pss.set(s.id, { c: s.shape === "circle" ? [s.at[0], s.at[1]] : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2], dims: s.shape === "circle" ? "r" + Math.round(s.r * 100) : w + "x" + l, multi: s.shape === "circle" || w > 1 || l > 1 }); } }
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
function _psShadow(it) { const st = _psShadowStamp(); if (!st) return; const p = _fpP(it.x, it.y, 0), a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * 0.9; ctx.drawImage(st, p[0] - 66, p[1] - 33, 132, 66); ctx.globalAlpha = a0; }

// draw one cell of a prop from its sprite (the start of the prop drawing, js/facilityplay.js _fpDrawProp): true when it drew it (the floor under it first: a solid tile is not drawn by itself), false to let the flat drawing do it
function facilitySpriteDraw(it) {
    const k = it.kind, fam = PS_FAMILY[k]; if (!fam) return false;
    if (k === "bridge") return !!_psBlit("bridge", it.variant, it.x, it.y);
    if (!_psImg(fam)) return false;
    const f = typeof frame !== "undefined" ? frame : 0, S = _psSolid(it.id), seed = _psHash(String(it.id));
    if (!it.spriteOnly) { _fpFloorUnder(it); _psShadow(it); }   // (a rim cell is ordinary floor, drawn already)
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
