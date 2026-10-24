// ─────────────────────────────────────────────────────────
//  THE PLAYER CLASSES — the first rows of the registry planned in docs/PLAYER-CLASSES.md (docs/TUTORIAL.md, phases 3 and 4)
// ─────────────────────────────────────────────────────────
// The tutorial has three classes. They are data: the class picker, the pack window's "requires" chips and every restriction are generated from this table, so a fourth class is one more row.
//   id / name / colour / tagline   what the picker and the pack show
//   rooms                          the facility rooms the class's gear is found in (the tutorial's pickups; docs/TUTORIAL.md)
//   startKit                       [[item id, how many], ...] the player carries on the first day
//   skills                         what the class can do that the others cannot (the tutorial's design rules read these, never the class's name)
// Restrictions are configurable in CLASS_RULES: any class may CARRY another class's gear, but may not USE it (a flare in a Mutator's pack is a flare they cannot light). A rule, not an accident: change the rule, not the items.
const CLASSES = {
    gunslinger: { id: "gunslinger", name: "GUNSLINGER", colour: "#ffb347", tagline: "Weapons, ammunition and tactical gear.",
        blurb: ["Finds weapons, ammunition and tactical equipment.", "Fights from the Security Room and the Armory.", "Cannot use the Technomancer's tech or the Mutator's samples."],
        rooms: ["armory", "security_room"], startKit: [["flare", 1]], skills: ["tactical"] },
    technomancer: { id: "technomancer", name: "TECHNOMANCER", colour: "#31e8ff", tagline: "Electrical infrastructure and technology.",
        blurb: ["Repairs relays and restores the facility's systems.", "Finds power cells and parts in the labs.", "Cannot use the Gunslinger's gear or the Mutator's samples."],
        rooms: ["experiment_lab", "teleport_room_1", "lab_passage"], startKit: [["power_cell", 1]], skills: ["repair", "tech"] },
    mutator: { id: "mutator", name: "MUTATOR", colour: "#c06bff", tagline: "Biological samples, DNA and creature evolution.",
        blurb: ["Works with samples, DNA and experimentation.", "Feeds samples to followers to push their evolution.", "Cannot use the Gunslinger's gear or the Technomancer's tech."],
        rooms: ["experiment_lab", "crystal_chamber"], startKit: [["mutagen_sample", 1]], skills: ["bio"] },
};
const CLASS_ORDER = ["gunslinger", "technomancer", "mutator"];
// relay: how a relay is repaired (js/stations.js). A class with the `skill` repairs with `skillCells` power cells in `skillFrames`, and the classes named in `auto` start the repair by themselves when they stand at a broken relay with the cells and keep still;
// anyone else needs the `kit` (an item) and `kitCells` cells and takes `kitFrames`. The kit is the explicit rule that lets the other classes restore a relay at all: their cells are spent by the relay, not used by them.
const CLASS_RULES = { carryOthers: true, useOthers: false, relay: { skill: "repair", skillCells: 1, skillFrames: 100, auto: ["technomancer"], kit: "relay_kit", kitCells: 2, kitFrames: 300 } };

// PERKS: what a class earns at its stations (js/stations.js). The game asks classStat(name, base) for a number, as docs/PLAYER-CLASSES.md plans: each owned perk may multiply (mul) or add to it.
//   cls        the class that can earn it    name / desc   what the pack shows     stat   { statName: { mul | add } }
const CLASS_PERKS = {
    rifle:     { id: "rifle", cls: "gunslinger", name: "SERVICE RIFLE", desc: "Your shots hit 60% harder and come 25% faster.", stat: { shotDamage: { mul: 1.6 }, shotCooldown: { mul: 0.75 } } },
    cctv:      { id: "cctv", cls: "gunslinger", name: "CCTV SWEEPS", desc: "The Security Room's cameras mark every enemy in the facility for 25 seconds.", stat: {} },
    tuned:     { id: "tuned", cls: "technomancer", name: "TUNED LAMP", desc: "Your monitor lamp reaches 25% further and an overcharge lasts 50% longer.", stat: { lampReach: { mul: 1.25 }, boostFrames: { mul: 1.5 } } },
    sequenced: { id: "sequenced", cls: "mutator", name: "SEQUENCED SAMPLES", desc: "A mutagen sample raises a follower two levels, not one.", stat: { mutagenLevels: { add: 1 } } },
};
let classPerks = new Set();
function classStat(name, base) {
    let v = base;
    for (const id of classPerks) { const p = CLASS_PERKS[id], s = p && p.stat && p.stat[name]; if (!s) continue; if (s.mul) v *= s.mul; if (s.add) v += s.add; }
    return v;
}
function classHas(perk) { return classPerks.has(perk); }
// a class's rank: 1 to start, one more for each of its perks earned (the tutorial has one perk to earn at a time per class: docs/TUTORIAL.md)
function classRank() { let n = 1; for (const id of classPerks) if (CLASS_PERKS[id] && CLASS_PERKS[id].cls === playerClassId) n++; return n; }
function classPerkList() { return Array.from(classPerks).map(id => CLASS_PERKS[id]).filter(p => p && p.cls === playerClassId); }
function classGrant(perk) { const p = CLASS_PERKS[perk]; if (!p || p.cls !== playerClassId || classPerks.has(perk)) return false; classPerks.add(perk); return true; }

let playerClassId = null;
function playerClass() { return playerClassId ? CLASSES[playerClassId] || null : null; }
// choose the class (once per run): the start kit goes in the pack
function classSet(id) {
    if (!CLASSES[id] || playerClassId) return false;
    playerClassId = id;
    if (typeof invAdd === "function") for (const [item, n] of CLASSES[id].startKit) invAdd(item, n);
    return true;
}
// the class a thing is reserved for ([] or none = every class)
function classAllows(classes, id) { return !classes || !classes.length || classes.includes(id || playerClassId) || (CLASS_RULES.useOthers && !!(id || playerClassId)); }
function classCanCarry(classes) { return CLASS_RULES.carryOthers || classAllows(classes); }
function className(id) { return CLASSES[id] ? CLASSES[id].name : String(id).toUpperCase(); }
function classColour(id) { return CLASSES[id] ? CLASSES[id].colour : "#8aa0c8"; }

// ── the class picker: the first screen of the tutorial ──
let classPickerOpen = false;
function classPickerOpenNow() { classPickerOpen = true; }
function _cpLayout() {
    const W = canvas.width, H = canvas.height, wide = W >= 760, top = typeof uiTopSafe === "function" ? uiTopSafe() : 8, bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8;
    const pw = Math.min(W - 16, wide ? 960 : 440), px = Math.round((W - pw) / 2), ph = Math.max(360, Math.min(bottom - top, wide ? 470 : 760)), py = Math.max(4, Math.min(top, H - ph - 4)), gut = 22;
    const L = { px, py, pw, ph, wide, cards: [] }, n = CLASS_ORDER.length, gap = 12;
    const cw = wide ? Math.floor((pw - gut * 2 - gap * (n - 1)) / n) : pw - gut * 2, ch = wide ? ph - 130 : Math.floor((ph - 96 - gut) / n - gap);
    CLASS_ORDER.forEach((id, i) => L.cards.push({ id, x: px + gut + (wide ? i * (cw + gap) : 0), y: py + 78 + (wide ? 0 : i * (ch + gap)), w: cw, h: ch }));
    return L;
}
function drawClassPicker() {
    if (!classPickerOpen) return;
    const L = _cpLayout();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); uiBackdrop(0.78); uiPanel(L.px, L.py, L.pw, L.ph, UI_TEAL);
    uiTextFit("CHOOSE YOUR CLASS", L.px + L.pw / 2, L.py + 36, 30, UI_TEAL, "center", L.pw - 60); uiCaptionFit("THE FACILITY IS IN A BLACKOUT. WHAT YOU ARE DECIDES WHAT YOU CAN USE.", L.px + L.pw / 2, L.py + 62, "#8aa0c8", "center", 13, L.pw - 40);
    for (const c of L.cards) {
        const k = CLASSES[c.id]; uiSlab(c.x, c.y, c.w, c.h, k.colour, false, "#0d1530");
        const small = c.h < 150, cx = c.x + 16, tw = c.w - 32;
        uiTextFit(k.name, cx, c.y + 28, small ? 20 : 24, k.colour, "left", tw); uiCaptionFit(k.tagline, cx, c.y + 54, "#c8d4f0", "left", 12, tw);
        if (!small) { let y = c.y + 86; for (const line of k.blurb) { for (const l of codexWrap(line, Math.max(16, Math.floor(tw / 8)))) { if (y > c.y + c.h - 78) break; uiCaptionFit(l, cx, y, "#9fb0d6", "left", 12, tw); y += 16; } y += 4; } }
        uiCaption("YOU START WITH", cx, c.y + c.h - 54, "#6d7fa6", "left", 11);
        k.startKit.forEach(([id, n], i) => { if (typeof invDrawIcon === "function") invDrawIcon(id, cx + 22 + i * 56, c.y + c.h - 30, 36, 0); uiText("×" + n, cx + 40 + i * 56, c.y + c.h - 20, 13, k.colour, "left"); });
        uiButton({ x: c.x + c.w - 112, y: c.y + c.h - 48, w: 100, h: 36 }, "SELECT", k.colour, false, 15);
    }
    ctx.restore();
}
function _handleClassPickerTap(tx, ty) {
    if (!classPickerOpen) return false;
    const L = _cpLayout();
    for (const c of L.cards) if (tx >= c.x && tx <= c.x + c.w && ty >= c.y && ty <= c.y + c.h) { classChoose(c.id); return true; }
    return true;   // (absorbs every tap: the class is chosen first)
}
// the choice: set the class, close the picker, say so
function classChoose(id) {
    if (!classSet(id)) return false;
    classPickerOpen = false;
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text: CLASSES[id].name + " — PRESS I FOR YOUR PACK", color: CLASSES[id].colour, life: 220, vy: -0.05, size: 15 });
    return true;
}
