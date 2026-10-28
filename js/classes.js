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
        blurb: ["Punches with an arc gauntlet and throws electric arcs, charged from the powered rooms.", "Repairs relays and restores the facility's systems.", "Cannot use the Gunslinger's gear or the Mutator's samples."],
        rooms: ["experiment_lab", "teleport_room_1", "lab_passage"], startKit: [["power_cell", 1]], skills: ["repair", "tech"], weapon: "gauntlet" },
    mutator: { id: "mutator", name: "MUTATOR", colour: "#c06bff", tagline: "Biological samples, DNA and creature evolution.",
        blurb: ["Fights up close with a tentacle lash, beside one clone it grows from DNA.", "Works with samples, DNA and experimentation.", "Cannot use the Gunslinger's gear or the Technomancer's tech."],
        rooms: ["experiment_lab", "crystal_chamber"], startKit: [["mutagen_sample", 1]], skills: ["bio"], weapon: "lash" },
};
// weapon: the class's own weapon (js/weapons.js), put in its hand when the class is chosen (the Mutator's TENTACLE LASH: docs/MUTATOR.md). A class with none keeps the service gun.
const CLASS_ORDER = ["gunslinger", "technomancer", "mutator"];
// relay: how a relay is repaired (js/stations.js). A class with the `skill` repairs with `skillCells` power cells in `skillFrames`, and the classes named in `auto` start the repair by themselves when they stand at a broken relay with the cells and keep still;
// anyone else needs the `kit` (an item) and `kitCells` cells and takes `kitFrames`. The kit is the explicit rule that lets the other classes restore a relay at all: their cells are spent by the relay, not used by them.
// clone: who grows clones at the Clone Bay (js/clone.js). ASKED (the brief): the Mutator "uses DNA to create clones" and "normally has only one active primary clone". A class with the `skill` may clone, `max` at
// once, and with `primary` its clone is a PRIMARY clone: it does not come back by itself, and when it falls its body stays where it fell (js/mutator.js). With no `skill` every class may clone, up to MAX_CLONES,
// and the clones come back at the Crystal (the rule before the Mutator had the clones to itself).
const CLASS_RULES = { carryOthers: true, useOthers: false, relay: { skill: "repair", skillCells: 1, skillFrames: 100, auto: ["technomancer"], kit: "relay_kit", kitCells: 2, kitFrames: 300 },
    clone: { skill: "bio", max: 1, primary: true } };

// PERKS: what a class earns at its stations (js/stations.js). The game asks classStat(name, base) for a number, as docs/PLAYER-CLASSES.md plans: each owned perk may multiply (mul) or add to it.
//   cls        the class that can earn it    name / desc   what the pack shows     stat   { statName: { mul | add } }
const CLASS_PERKS = {
    machinegun: { id: "machinegun", cls: "gunslinger", name: "MACHINE GUN", desc: "A big machine gun in your tentacles: it fires four times as fast (each round hits a little softer). It is a weapon you can put away and take out again: the Armory's terminal equips it (js/weapons.js).", stat: {} },
    cctv:      { id: "cctv", cls: "gunslinger", name: "CCTV SWEEPS", desc: "The Security Room's cameras mark every enemy in the facility for 25 seconds.", stat: {} },
    mech:      { id: "mech", cls: "technomancer", name: "SPIDER MECH", desc: "A four-legged spider mech you built in the show room: you ride it, 40% faster, and its headlamps light 30% further.", stat: { playerSpeed: { mul: 1.4 }, lampReach: { mul: 1.3 } } },
    tuned:     { id: "tuned", cls: "technomancer", name: "TUNED LAMP", desc: "Your monitor lamp reaches 25% further and an overcharge lasts 50% longer.", stat: { lampReach: { mul: 1.25 }, boostFrames: { mul: 1.5 } } },
    labcoat:   { id: "labcoat", cls: "mutator", name: "LAB COAT AND GOGGLES", desc: "You put them on in the experiment lab and keep them for good: a mutagen sample raises a follower two levels, not one.", stat: { mutagenLevels: { add: 1 } } },
    sequenced: { id: "sequenced", cls: "mutator", name: "SEQUENCED SAMPLES", desc: "A sequenced sample raises a follower one level more again.", stat: { mutagenLevels: { add: 1 } } },
};
// The perks earned this run are all kept (classPerks), but each counts only while its class is the player's: a Technomancer's spider mech is not under a Gunslinger (classes switch: below).
let classPerks = new Set();
function classStat(name, base) {
    let v = base;
    for (const id of classPerks) { const p = CLASS_PERKS[id], s = p && p.cls === playerClassKey && p.stat && p.stat[name]; if (!s) continue; if (s.mul) v *= s.mul; if (s.add) v += s.add; }
    return v;
}
function classHas(perk) { const p = CLASS_PERKS[perk]; return classPerks.has(perk) && (!p || p.cls === playerClassKey); }   // the class you are has it
function classOwns(perk) { return classPerks.has(perk); }   // its class earned it this run, whatever you are now (the mech bay stays built)
// the gear each class is known by (drawn on the player: js/playergear.js), and the perk that is it
const CLASS_SIGNATURE = { gunslinger: "machinegun", technomancer: "mech", mutator: "labcoat" };
// a class's rank: 1 to start, one more for each of its perks earned (the tutorial has one perk to earn at a time per class: docs/TUTORIAL.md)
function classRankOf(cls) { let n = 1; for (const id of classPerks) if (CLASS_PERKS[id] && CLASS_PERKS[id].cls === cls) n++; return n; }
function classRank() { return classRankOf(playerClassKey); }
function classPerkList() { return Array.from(classPerks).map(id => CLASS_PERKS[id]).filter(p => p && p.cls === playerClassKey); }
function classGrant(perk) { const p = CLASS_PERKS[perk]; if (!p || p.cls !== playerClassKey || classPerks.has(perk)) return false; classPerks.add(perk); return true; }

let playerClassKey = null;
// js/moves.js (docs/PLAYER-CLASSES.md, stage 0) asks the class through a function, `playerClassId()`: a move with `classes` is open only to those. The class is held in playerClassKey.
function playerClassId() { return playerClassKey; }
function playerClass() { return playerClassKey ? CLASSES[playerClassKey] || null : null; }

// SWITCHING CLASS. ASKED: "make a way for the player to be able to switch classes whenever they want to. But their progression in it will be that the current progression of that class, and the progression
// saves throughout until the crystal is destroyed." The class is chosen after the tutorial and can be switched at any time after (the pack's SWITCH CLASS: the picker, then a confirmation), for nothing. What a
// class has earned is its own and waits for it while you are another:
//   its PERKS, and so its rank, count only while it is the class (classHas, classStat above);
//   its STAGE (its objectives after the tutorial, js/tutorial.js) is put away as far as it got, counts and all, and taken out again when you come back to it (tutClassStash, tutClassResume);
//   the WEAPON it last held is put back in hand (classWeapon); its START KIT is given once, the first time you are it (classSeen); its supply cases arrive then too;
//   the Mutator's CLONE waits for it: taken out of the fight, upgrades and all, and put back beside you the next time you are the Mutator (js/mutator.js mutatorCloneStash, mutatorCloneReturn).
// All of it is part of the run: the save keeps it (js/facilitysave.js), and a destroyed Crystal (NEW GAME) begins it all again.
let classSeen = new Set();       // the classes you have been this run (each one's kit and cases came the first time)
let classWeapon = {};            // the weapon each class last had in hand
let classWaitingClone = null;    // the Mutator's clone while you are another class (its record, the shape of js/facilitysave.js cloneRosterSnapshot's)
function classReset() { classSeen = new Set(); classWeapon = {}; classWaitingClone = null; classConfirm = null; classPickerMode = "first"; }
// be a class: the first time (after the tutorial), or a switch. Returns false when it is no class, or the one you are.
function classSet(id) {
    if (!CLASSES[id] || id === playerClassKey) return false;
    const was = playerClassKey;
    if (was) _classLeave(was);
    playerClassKey = id;
    const first = !classSeen.has(id); classSeen.add(id);
    if (first && typeof invAdd === "function") for (const [item, n] of CLASSES[id].startKit) invAdd(item, n);   // (once: switching back and forth is not a way to fill the pack)
    if (typeof tutClassResume === "function") tutClassResume(id);   // its stage, where it was (or not begun)
    if (typeof weaponEquip === "function") weaponEquip(_classWeaponFor(id));   // the weapon it last had (its own the first time: the Mutator's lash, the Technomancer's gauntlet), or the service gun
    if (id === "mutator" && classWaitingClone && typeof mutatorCloneReturn === "function") { mutatorCloneReturn(classWaitingClone); classWaitingClone = null; }   // its clone, back beside you
    return true;
}
function _classLeave(was) {
    if (typeof mutatorCancel === "function") mutatorCancel();   // (a strike wound up is let go)
    if (typeof playerWeapon !== "undefined") classWeapon[was] = playerWeapon;
    if (typeof tutClassStash === "function") tutClassStash(was);
    if (was === "mutator" && typeof mutatorCloneStash === "function") { const rec = mutatorCloneStash(); if (rec) classWaitingClone = rec; }
}
// what the class takes up: the weapon it last held, else its own, else the one in hand if it may hold it (the first class keeps what you had), else the service gun
function _classWeaponFor(id) {
    const now = typeof playerWeapon !== "undefined" ? playerWeapon : null;
    for (const w of [classWeapon[id], CLASSES[id].weapon, now]) if (w && typeof weaponHas === "function" && weaponHas(w)) return w;
    return "service";
}
// the class a thing is reserved for ([] or none = every class)
function classAllows(classes, id) { return !classes || !classes.length || classes.includes(id || playerClassKey) || (CLASS_RULES.useOthers && !!(id || playerClassKey)); }
function classCanCarry(classes) { return CLASS_RULES.carryOthers || classAllows(classes); }
function className(id) { return CLASSES[id] ? CLASSES[id].name : String(id).toUpperCase(); }
function classColour(id) { return CLASSES[id] ? CLASSES[id].colour : "#8aa0c8"; }

// ── the class picker: the screen that follows the tutorial (js/tutorial.js opens it when the last objective is done), and SWITCH CLASS (the pack's button: js/inventory.js) ──
// ASKED: "whenever you're selecting a class, make it to where there's a confirmation": a card's SELECT asks first (BECOME A ...? CONFIRM / BACK), the first time and at every switch. The first time the picker
// cannot be closed (the class comes first); a switch can be called off (CLOSE, a tap outside, or Escape). A card says where its class is: CURRENT, its rank and objectives if you have been it, or what it starts with.
let classPickerOpen = false, classPickerMode = "first", classConfirm = null;
function classPickerOpenNow() { classPickerOpen = true; classPickerMode = "first"; classConfirm = null; }
function classSwitchOpen() { if (!playerClassKey) return false; classPickerOpen = true; classPickerMode = "switch"; classConfirm = null; return true; }
function classPickerClose() { if (classPickerMode !== "switch") return false; classPickerOpen = false; classConfirm = null; return true; }
// how far a class's own stage got: [done, of] (js/tutorial.js), or null when it has none
function classStageOf(cls) { return typeof tutClassProgress === "function" ? tutClassProgress(cls) : null; }
function _cpLayout() {
    const W = canvas.width, H = canvas.height, wide = W >= 760, top = typeof uiTopSafe === "function" ? uiTopSafe() : 8, bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8;
    const pw = Math.min(W - 16, wide ? 960 : 440), px = Math.round((W - pw) / 2), ph = Math.max(360, Math.min(bottom - top, wide ? 470 : 760)), py = Math.max(4, Math.min(top, H - ph - 4)), gut = 22;
    const L = { px, py, pw, ph, wide, cards: [], close: classPickerMode === "switch" ? { x: px + pw - gut - 110, y: py + 12, w: 110, h: 36 } : null }, n = CLASS_ORDER.length, gap = 12;
    const cw = wide ? Math.floor((pw - gut * 2 - gap * (n - 1)) / n) : pw - gut * 2, ch = wide ? ph - 130 : Math.floor((ph - 96 - gut) / n - gap);
    CLASS_ORDER.forEach((id, i) => { const c = { id, x: px + gut + (wide ? i * (cw + gap) : 0), y: py + 78 + (wide ? 0 : i * (ch + gap)), w: cw, h: ch }; c.select = { x: c.x + c.w - 112, y: c.y + c.h - 48, w: 100, h: 36 }; L.cards.push(c); });
    // the confirmation: a box over the middle, CONFIRM and BACK
    const bw = Math.min(pw - 40, 460), bh = 210, bx = Math.round((W - bw) / 2), by = Math.round(Math.max(py + 40, Math.min(py + ph - bh - 20, (H - bh) / 2))), hw = Math.floor((bw - 64) / 2);
    L.confirm = { x: bx, y: by, w: bw, h: bh, yes: { x: bx + 24, y: by + bh - 64, w: hw, h: 44 }, no: { x: bx + 40 + hw, y: by + bh - 64, w: hw, h: 44 } };
    return L;
}
function drawClassPicker() {
    if (!classPickerOpen) return;
    const L = _cpLayout(), sw = classPickerMode === "switch";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); uiBackdrop(0.78); uiPanel(L.px, L.py, L.pw, L.ph, UI_TEAL);
    if (sw) { uiTextFit("SWITCH CLASS", L.px + 26, L.py + 36, 28, UI_TEAL, "left", L.pw - 180); uiCaptionFit("EACH CLASS KEEPS ITS OWN PROGRESS: ITS PERKS, ITS OBJECTIVES, ITS GEAR. SWITCH BACK ANY TIME.", L.px + L.pw / 2, L.py + 62, "#8aa0c8", "center", 13, L.pw - 40); uiButton(L.close, "CLOSE", UI_RED, false, 15); }
    else { uiTextFit("TUTORIAL COMPLETE — CHOOSE YOUR CLASS", L.px + L.pw / 2, L.py + 36, 28, UI_TEAL, "center", L.pw - 60); uiCaptionFit("WHAT YOU ARE DECIDES WHAT YOU CAN USE. THE SUPPLIES FOR YOUR CLASS ARRIVE ONCE YOU CHOOSE.", L.px + L.pw / 2, L.py + 62, "#8aa0c8", "center", 13, L.pw - 40); }
    for (const c of L.cards) {
        const k = CLASSES[c.id], cur = c.id === playerClassKey, been = classSeen.has(c.id); uiSlab(c.x, c.y, c.w, c.h, k.colour, false, cur ? "#1a2a58" : "#0d1530");   // (the class you are: a lighter card, marked CURRENT)
        const small = c.h < 150, cx = c.x + 16, tw = c.w - 32;
        uiTextFit(k.name, cx, c.y + 28, small ? 20 : 24, k.colour, "left", tw - (cur ? 90 : 0)); uiCaptionFit(k.tagline, cx, c.y + 54, "#c8d4f0", "left", 12, tw);
        if (cur) uiCaption("CURRENT", c.x + c.w - 16, c.y + 24, k.colour, "right", 12);
        if (!small) { let y = c.y + 86; for (const line of k.blurb) { for (const l of uiWrap(line, Math.max(16, Math.floor(tw / 8)))) { if (y > c.y + c.h - 78) break; uiCaptionFit(l, cx, y, "#9fb0d6", "left", 12, tw); y += 16; } y += 4; } }
        if (been) {   // where it got to: its rank, its objectives
            const st = classStageOf(c.id); uiCaption("YOUR PROGRESS", cx, c.y + c.h - 54, "#6d7fa6", "left", 11);
            uiCaptionFit("RANK " + classRankOf(c.id) + (st ? "  ·  " + st[0] + "/" + st[1] + " OBJECTIVES" : ""), cx, c.y + c.h - 30, k.colour, "left", 13, cur ? c.w - 32 : c.w - 150);   // (the class you are has no SELECT beside it)
        } else {
            uiCaption("YOU START WITH", cx, c.y + c.h - 54, "#6d7fa6", "left", 11);
            k.startKit.forEach(([id, n], i) => { if (typeof invDrawIcon === "function") invDrawIcon(id, cx + 22 + i * 56, c.y + c.h - 30, 36, 0); uiText("×" + n, cx + 40 + i * 56, c.y + c.h - 20, 13, k.colour, "left"); });
        }
        if (!cur) uiButton(c.select, "SELECT", k.colour, false, 15);
    }
    if (classConfirm && CLASSES[classConfirm]) {   // the confirmation, over the cards
        const k = CLASSES[classConfirm], B = L.confirm, been = classSeen.has(classConfirm), st = classStageOf(classConfirm), cx = B.x + B.w / 2, wrap = Math.max(20, Math.floor((B.w - 48) / 7.6));
        uiBackdrop(0.55); uiSlab(B.x, B.y, B.w, B.h, k.colour, false, "#0b1226");   // (the cards dimmed behind it)
        uiTextFit((sw ? "SWITCH TO " : "BECOME A ") + k.name + "?", cx, B.y + 40, 24, k.colour, "center", B.w - 40);
        const line1 = been ? "IT PICKS UP WHERE IT LEFT OFF: RANK " + classRankOf(classConfirm) + (st ? ", " + st[0] + "/" + st[1] + " OBJECTIVES" : "") + "." : "YOU START WITH " + k.startKit.map(([id, n]) => n + " " + (typeof itemDef === "function" ? itemDef(id).name : id)).join(", ") + ". ITS SUPPLIES ARRIVE IN THE FACILITY.";
        const line2 = sw ? "YOUR " + className(playerClassKey) + " PROGRESS IS KEPT FOR WHEN YOU SWITCH BACK." : "YOU CAN SWITCH CLASS LATER, FROM YOUR PACK.";
        let y = B.y + 76; for (const l of uiWrap(line1, wrap)) { uiCaptionFit(l, cx, y, "#c8d4f0", "center", 13, B.w - 40); y += 18; }
        for (const l of uiWrap(line2, wrap)) { uiCaptionFit(l, cx, y, "#8aa0c8", "center", 12, B.w - 40); y += 17; }
        uiButton(B.yes, "CONFIRM", k.colour, true, 16); uiButton(B.no, "BACK", "#8aa0c8", false, 16);
    }
    ctx.restore();
}
function _handleClassPickerTap(tx, ty) {
    if (!classPickerOpen) return false;
    const L = _cpLayout(), inR = r => !!r && tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h;
    if (classConfirm) {   // the confirmation is up: CONFIRM, BACK, or a tap anywhere else is BACK
        if (inR(L.confirm.yes)) { const id = classConfirm; classConfirm = null; classChoose(id); return true; }
        if (inR(L.confirm.no) || !inR(L.confirm)) classConfirm = null;
        return true;
    }
    if (inR(L.close)) { classPickerClose(); return true; }
    for (const c of L.cards) if (inR(c) && c.id !== playerClassKey) { classConfirm = c.id; return true; }   // (a tap on a card is its SELECT: it asks first)
    if (classPickerMode === "switch" && (tx < L.px || tx > L.px + L.pw || ty < L.py || ty > L.py + L.ph)) classPickerClose();   // (a switch is called off by a tap outside; the first choice is not)
    return true;   // (absorbs every tap while it is up)
}
// the choice (after the confirmation): be the class, close the picker, say so
function classChoose(id, quiet) {
    const was = playerClassKey, first = !classSeen.has(id);
    if (!classSet(id)) return false;
    classPickerOpen = false; classConfirm = null;
    if (typeof facilityClassItemsEnter === "function") facilityClassItemsEnter(id);   // the class's cases enter the facility (js/facilitytutorial.js: once; one that is there, or was taken, is not put back)
    const msg = !was ? CLASSES[id].name + " — PRESS I FOR YOUR PACK" : CLASSES[id].name + (first ? " — A NEW CLASS: ITS KIT IS IN YOUR PACK" : " — RANK " + classRank() + ", AS YOU LEFT IT");
    if (!quiet && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text: msg, color: CLASSES[id].colour, life: 220, vy: -0.05, size: 15 });
    return true;
}
// Escape: off the confirmation, then out of a switch (the first choice stays up)
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (!e || e.key !== "Escape" || !classPickerOpen) return; if (classConfirm) classConfirm = null; else classPickerClose(); }); } catch (e) { /* no page (the test sandbox) */ }
