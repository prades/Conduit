// ─────────────────────────────────────────────────────────
//  THE DEFAULT CHEST: found in the world, opened once, a booster pack and two items inside (docs/CHESTS.md; build 2026-11-12a)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-12: "Also would like to create a default chest that players can find booster packs and other miscellaneous items within"; its look, of three: "I like the sea chess" (the C chest,
// THE HEX CACHE: design/props/models/chest.js); then "Build it" on the agent's proposal (docs/CHESTS.md §5), so these rules are the agent's, provisional:
//   A CHEST is a prop of kind `chest` with a station of kind `chest` (js/facilitymap.js): walk up and tap it, or press E beside it (js/stations.js), any class, before a class too.
//   OPENING it once: its lid lifts off on its light (the sprite chest.open, CHESTS.openFrames), its BOOSTER PACK is opened free with the reveal you know (js/cards.js equipPackOpen, js/cardsui.js
//   cardsRevealFound: PACK 1, or SERIES 2 as well once it is open to you, an even chance), and its TWO ITEMS go into your pack with the words over your head. What you cannot carry (a full stack) stays
//   in it until you can: tap it again. Emptied, it stays open (chest.empty).
//   SAVED: the chests opened, and what is left in each (`chests`, js/facilitysave.js); a new game has every chest shut and full.
const CHESTS = {
    openFrames: 90,                                                                   // how long the lid hovers on its light before it settles: 1.5 s
    items: [["ammo_pack", 1], ["repair_kit", 1], ["sleeping_potion", 1], ["scrap_metal", 3], ["fuel_cell", 1], ["class", 1]],   // the two are drawn from these ("class": your class's own item)
    classItem: { gunslinger: "flare", technomancer: "power_cell", mutator: "mutagen_sample" },
    packs: ["pack1", "series2"],                                                      // of these, the ones open to you (js/cards.js equipPacksOpen), an even chance
};
let _ch = { opened: new Map(), anim: new Map() };   // opened: chest (prop) id -> what is left in it ([[item, n]]); anim: chest id -> the frame it was opened
function chestsReset() { _ch = { opened: new Map(), anim: new Map() }; }
function _chFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _chProp(sOrId) { const id = typeof sOrId === "string" ? sOrId : sOrId && (sOrId.prop || (sOrId.id || "").replace(/^st_/, "")); return id || null; }
function chestOpened(id) { return _ch.opened.has(id); }
function chestLeft(id) { return (_ch.opened.get(id) || []).map(e => e.slice()); }
function chestEmpty(id) { return _ch.opened.has(id) && !(_ch.opened.get(id) || []).length; }
// the sprite's state (js/propsprites.js): shut (null), opening, emptied
function chestSpriteState(id) { if (!_ch.opened.has(id)) return null; const t0 = _ch.anim.get(id); return t0 != null && _chFrame() - t0 < CHESTS.openFrames ? "open" : "empty"; }

// what is in one: its pack (one open to you) and two items, drawn when it is opened (rnd: a number in [0, 1), Math.random by default)
function chestRoll(rnd) {
    rnd = rnd || Math.random;
    const open = typeof equipPacksOpen === "function" ? equipPacksOpen().filter(p => CHESTS.packs.indexOf(p.id) >= 0) : [];
    const pack = open.length ? open[Math.floor(rnd() * open.length) % open.length] : null;
    const cls = typeof playerClassKey !== "undefined" ? playerClassKey : null, pool = CHESTS.items.map(e => e[0] === "class" ? (CHESTS.classItem[cls] ? [CHESTS.classItem[cls], e[1]] : null) : e.slice()).filter(Boolean);
    const items = []; for (let k = 0; k < 2 && pool.length; k++) items.push(pool.splice(Math.floor(rnd() * pool.length) % pool.length, 1)[0]);
    return { pack: pack ? pack.id : null, items };
}
// give what fits of `items` into the pack, the words over your head for each; returns what is left
function _chGive(items, at) {
    const left = []; let k = 0;
    for (const [id, n] of items) {
        const got = typeof invAdd === "function" ? invAdd(id, n) : 0, d = typeof itemDef === "function" ? itemDef(id) : null;
        if (got > 0 && typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: at[0], y: at[1] - 0.35 * (k++), text: "+" + got + " " + (d ? d.name : id), color: d && d.col || "#ffffff", life: 110, vy: -0.025 });
        if (got < n) left.push([id, n - got]);
    }
    if (left.length && typeof invSay === "function") invSay("YOUR PACK IS FULL OF THAT — IT STAYS IN THE CHEST", false);
    return left;
}
// OPEN a chest (its station's use): the first time, its pack (the reveal) and its items; after, whatever was left in it
function chestOpen(sOrId) {
    const id = _chProp(sOrId), s = id && typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F.solids.find(q => q.id === id) : null; if (!s) return { ok: false, why: "NO CHEST HERE" };
    const at = [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2];
    if (_ch.opened.has(id)) {
        const left = _ch.opened.get(id) || []; if (!left.length) return { ok: false, why: "EMPTY" };
        _ch.opened.set(id, _chGive(left, at)); _chSave(); return { ok: true, msg: "", quiet: true };
    }
    const roll = chestRoll(); _ch.anim.set(id, _chFrame());
    _ch.opened.set(id, _chGive(roll.items, at));
    let shown = false;
    if (roll.pack && typeof equipPackOpen === "function") {
        const pack = EQUIP_PACKS.find(p => p.id === roll.pack), ids = pack ? equipPackOpen(undefined, pack, true) : null;
        if (ids && typeof cardsRevealFound === "function") try { shown = cardsRevealFound(); } catch (e) { shown = false; }   // (the pack is dealt either way: its cards are in your collection)
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: at[0], y: at[1], text: roll.pack ? (shown ? "A BOOSTER PACK!" : "A BOOSTER PACK") : "THE CHEST IS OPEN", color: "#d9b8ff", life: 110, vy: -0.03 });
    _chSave(); return { ok: true, msg: "", quiet: true };
}
function _chSave() { if (typeof facilitySaveWrite === "function") try { facilitySaveWrite(); } catch (e) {} }

// ── THE STATION ──
STATION_KINDS.chest = { name: "CHEST", classes: null,
    verbFn: s => chestOpened(_chProp(s)) ? "TAKE WHAT IS LEFT" : "OPEN THE CHEST",
    doneFn: s => chestEmpty(_chProp(s)), doneWhy: "EMPTY",
    use: s => chestOpen(s) };

// ── SAVING ──
function chestsSnapshot() { return Array.from(_ch.opened, ([id, left]) => ({ id, left: (left || []).map(e => e.slice()) })); }
function chestsApply(list) {   // (a game saved before has none opened; a chest the map no longer has, or an item the game no longer has, is dropped)
    _ch = { opened: new Map(), anim: new Map() };
    for (const e of (Array.isArray(list) ? list : [])) {
        if (!e || typeof e.id !== "string" || !(_fp && _fp.F && _fp.F.solids.some(q => q.id === e.id && q.kind === "chest"))) continue;
        const left = (Array.isArray(e.left) ? e.left : []).filter(x => Array.isArray(x) && typeof x[0] === "string" && (typeof ITEMS === "undefined" || ITEMS[x[0]]) && x[1] > 0).map(x => [x[0], Math.floor(x[1])]);
        _ch.opened.set(e.id, left);
    }
}
