// ─────────────────────────────────────────────────────────
//  THE CONVERSION AT THE PURIFICATION MODULE (docs/CONVERSION.md, "The conversion apparatus"; build 2026-11-08i): a toxic follower becomes BLOOM
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-08): "the purification module within the sewers, after it's been installed by the player, is the place where if the player brings a toxic creature on their squad, or a
// toxic creature is holding the area, then the player can interact with the machine, and a new pop-up menu comes shows up, and each creature who can convert is in a roster view, and the player can
// scroll through and pick the one that they want to convert, and then another pop-up menu shows up and shows the stats, stat conversion, and the roster card of the new creature that would be converted
// into." Asked further, the owner chose: only the toxic followers THERE ("Only toxic ones there"); the stats do not change, shown side by side with what changes marked ("Same stats, show changes");
// built in stages ("Stages, menus first"): this first one converts an unevolved toxic follower, and an evolved one waits for its class's BLOOM form.
//   THE MACHINE   the purifier mount (STATION_KINDS.purifier_mount, js/stations.js) once the module is in and has run its cycle (the quest's installedAt and purifiedAt, js/quests.js: while the
//                 cycle runs, during the queen's fight, the mount says THE MODULE IS RUNNING as before; the agent's reading of "after it's been installed", confirmed by the owner 2026-11-08): its use opens this panel (#convPanel).
//   WHO           the toxic followers in your squad or holding the Sewers (js/party.js partyIsMember; a post is f.post). One that cannot convert yet is listed dimmed, saying why.
//   THE PREVIEW   its card now and as it would be (BLOOM's colour and backdrop), its numbers before and after (the same: a conversion keeps its level, XP, bond and stats), and what changes:
//                 its element, what its hits do (toxic's defense shred to BLOOM's MEND), its moves, its cards that come off, and the form it will evolve into.
//   CONVERT       two taps (it cannot be undone): its element becomes BLOOM (js/config.js ELEMENTS, id "blossom": "bloom" is the retired BUNKER BLOOM's form id); its toxic cards come off
//                 (js/cards.js equipValid, as when any card stops fitting); it is saved with its element (js/facilitysave.js).
// AN EVOLVED ONE (build 2026-11-08j): it takes its class's BLOOM form, where that is in the game: an evolved toxic Mage (the Rotshard) becomes the THORNWHIP, BLOOM's Mage (js/evolution.js
// EVOLUTIONS.shrub). Its stats stay as they are ("Same stats, show changes"); an alternate the new form does not have is let go (it goes back to its normal attack).
// An evolved toxic Brawler (the Seeper) becomes SUNDEW, BLOOM's Brawler (build 2026-11-08k).
// A toxic Technician converts too (build 2026-11-08m): BLOOM's Technician ability, REEF, is built; an evolved one (the Blight Spider) becomes STONEPETAL (the CORAL CRAB until build 2026-11-08n).
const CONVERT = { from: "toxic", to: "blossom", room: "sewers", arm: 180, col: "#8cff5a", bloom: "#ff7ab8",
    forms: { brawler: "SUNDEW", sniper: "THORNWHIP", camper: "STONEPETAL" } };   // (the class's BLOOM form: docs/CONVERSION.md §2; STONEPETAL was THE CORAL CRAB until build 2026-11-08n)

function convertReady() { const Q = typeof questState === "function" ? questState("purify") : null; return !!(Q && Q.installedAt && Q.purifiedAt); }   // (installed, and its cycle run: the water clean; until then the quest says the module is running)
function _cvOurs(f) { return !!f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green"; }
// the toxic followers there: in the squad (it comes with you), or holding the Sewers
function convertHere() {
    if (typeof followers === "undefined") return [];
    return followers.filter(f => _cvOurs(f) && f.element === CONVERT.from && ((typeof partyIsMember === "function" && partyIsMember(f)) || f.post === CONVERT.room));
}
function _cvRole(f) { return typeof equipRoleOf === "function" ? equipRoleOf(f) : (f && f.role) || null; }
// the BLOOM form its class takes (js/evolution.js evolutionFor, for it as a BLOOM follower), or null: not in the game yet (every class has its BLOOM form since build 2026-11-08m: THORNWHIP, SUNDEW, the coral crab)
function convertBloomForm(f) { return f && typeof evolutionFor === "function" ? evolutionFor(Object.assign({}, f, { element: CONVERT.to })) : null; }
// why it cannot convert now (null: it can)
function convertWhyNot(f) {
    if (!_cvOurs(f)) return "NOT ONE OF YOURS";
    if (f.element !== CONVERT.from) return "ONLY A TOXIC FOLLOWER CONVERTS";
    if (!convertReady()) return "THE PURIFICATION MODULE IS NOT READY: INSTALL IT AND LET IT RUN";
    if (f.evolved && !convertBloomForm(f)) return "ITS BLOOM FORM IS NOT READY";   // (an evolved Mage becomes the THORNWHIP: build 2026-11-08j)
    return null;
}
function convertCan() {
    if (!convertReady()) return { ok: false, why: "THE PURIFICATION MODULE IS NOT READY: INSTALL IT AND LET IT RUN" };
    return convertHere().length ? { ok: true } : { ok: false, why: "BRING A TOXIC FOLLOWER: IN YOUR SQUAD, OR HOLDING THE SEWERS" };
}
function convertVerb() { return "CONVERT A TOXIC FOLLOWER INTO BLOOM"; }

// what it would be: a copy with its new element (and, evolved, its class's BLOOM form), for the preview's card and words (nothing about the follower itself changes)
function convertPreview(f) {
    const g = Object.assign({}, f, { element: CONVERT.to, cards: f.cards ? f.cards.slice() : f.cards, energy: !f.evolved && Array.isArray(f.energy) ? f.energy.map(x => x === CONVERT.from ? CONVERT.to : x) : f.energy });   // (its energy cards as the conversion leaves them: convertApply)
    if (f.evolved) { const d = convertBloomForm(f); if (d) g.evolved = d.id; }
    return g;
}
// its cards that would come off (they stop fitting: a toxic element card, a toxic aura)
function convertCardsOff(f) {
    if (!f || !f.cards || typeof equipCard !== "function" || typeof equipFit !== "function") return [];
    const g = convertPreview(f);
    return f.cards.filter(id => { const c = id && equipCard(id); return c && equipFit(g, c); }).map(id => equipCard(id).name || id);
}

// CONVERT: its element becomes BLOOM; its level, XP, bond and stats stay; the cards that stop fitting come off
function convertApply(f) {
    const why = convertWhyNot(f); if (why) return { ok: false, why };
    const off = convertCardsOff(f), name = typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER";
    const form = f.evolved ? convertBloomForm(f) : null;   // (evolved: its class's BLOOM form, there or convertWhyNot would have said)
    f.element = CONVERT.to; f.convertedFrom = CONVERT.from; f.convertedAt = typeof frame !== "undefined" ? frame : 0;
    // ITS ENERGY CARD (docs/ENERGY-CARDS.md rule 13, "Convert its card"; js/energy.js): the toxic card in an unevolved one's slot becomes a BLOOM one, so it is BLOOM (saved so, and it evolves into a BLOOM form).
    // An evolved one's toxic cards stay toxic (the owner, 2026-11-09: "Only an egg's card"): on a BLOOM form they are another element's, and its second attack and Ultimate lock until it holds BLOOM cards
    if (!f.evolved && Array.isArray(f.energy)) f.energy = f.energy.map(x => x === CONVERT.from ? CONVERT.to : x);
    if (form) {
        f.evolved = form.id;   // (its stats stay as they are: no level is applied again)
        if (f.alt && !(typeof evoMoveAllowed === "function" && evoMoveAllowed(f, form, f.alt))) { f.alt = null; f._altWind = 0; f._altLive = null; }   // (an alternate the new form does not have: back to its normal attack)
    }
    if (typeof rebuildFollowerTable === "function") rebuildFollowerTable();   // (the followers by element, js/helpers.js: rebuilt only when the count changes, and a conversion does not change it)
    if (typeof equipValid === "function") equipValid(f);
    if (typeof partyBarRender === "function") partyBarRender(true);
    if (typeof facilitySaveWrite === "function") facilitySaveWrite();   // (saved now, not in a few seconds: it cannot be undone)
    const now = typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "BLOOM FOLLOWER";
    const locked = f.evolved && typeof energyAltOpen === "function" && !energyAltOpen(f);   // (its toxic energy cards stay toxic: js/energy.js)
    return { ok: true, msg: name + " IS NOW A " + now + (off.length ? " · " + off.join(", ") + " CAME OFF" : "") + (locked ? " · ITS ATTACKS WAIT FOR BLOOM ENERGY CARDS" : ""), off };
}

// ── THE PANEL (the station's use: js/stations.js) ──
const _cv = { view: "list", pick: null, armUntil: 0 };
function convertIsOpen() { const el = typeof document !== "undefined" ? document.getElementById("convPanel") : null; return !!(el && el.classList && el.classList.contains("open")); }
function convertOpen() {
    if (typeof document === "undefined" || !document.body) return { ok: false, why: "NO SCREEN" };
    let root = document.getElementById("convPanel");
    if (!root) {
        root = document.createElement("div"); root.id = "convPanel"; root.setAttribute("aria-label", "The purification module: conversion"); document.body.appendChild(root);
        root.addEventListener("click", e => { const b = e.target && e.target.closest ? e.target.closest("[data-act]") : null; if (b) { e.stopPropagation(); _cvAct(b.getAttribute("data-act"), b); } });
    }
    _cv.view = "list"; _cv.pick = null; _cv.armUntil = 0;
    root.classList.add("open"); _cvRender();
    return { ok: true, msg: "", quiet: true };
}
function convertClose() { const root = typeof document !== "undefined" ? document.getElementById("convPanel") : null; if (root && root.classList) root.classList.remove("open"); _cv.pick = null; _cv.armUntil = 0; }
// each frame (js/facilitytutorial.js): it closes when you leave the Sewers; the preview goes back to the list if its follower has gone (fallen, left the squad, converted)
function convertTick() {
    if (!convertIsOpen()) return;
    const inRoom = typeof partyRoomAt === "function" && typeof player !== "undefined" ? partyRoomAt(player.x, player.y) === CONVERT.room : true;
    if (!inRoom || !convertReady()) { convertClose(); return; }
    if (_cv.view === "preview" && (!_cv.pick || convertHere().indexOf(_cv.pick) < 0)) { _cv.view = "list"; _cv.pick = null; _cvRender(); }
    else if (_cv.armUntil && typeof frame !== "undefined" && frame > _cv.armUntil) { _cv.armUntil = 0; _cvRender(); }
    else if (_cv.pending && _cv.units && _cv.units.every(_cvImgReady)) { const root = document.getElementById("convPanel"); if (root) _cvDraw(root, _cv.units); }
}
function _cvAct(act, el) {
    if (act === "close") { convertClose(); return; }
    if (act === "back") { _cv.view = "list"; _cv.pick = null; _cv.armUntil = 0; _cvRender(); return; }
    if (act === "pick") {
        const f = convertHere()[Number(el && el.getAttribute("data-i"))]; if (!f) { _cvRender(); return; }
        const why = convertWhyNot(f); if (why) { if (typeof invSay === "function") invSay(why, false); return; }
        _cv.view = "preview"; _cv.pick = f; _cv.armUntil = 0; _cvRender(); return;
    }
    if (act === "convert") {
        const f = _cv.pick, now = typeof frame !== "undefined" ? frame : 0; if (!f) return;
        if (!_cv.armUntil || now > _cv.armUntil) { _cv.armUntil = now + CONVERT.arm; _cvRender(); return; }   // (the first tap arms it: it cannot be undone)
        const r = convertApply(f); _cv.armUntil = 0;
        if (typeof invSay === "function") invSay(r.ok ? r.msg : r.why, !!r.ok);
        _cv.view = "list"; _cv.pick = null; _cvRender();
    }
}
const _cvEsc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function _cvElLabel(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.label : String(id || "").toUpperCase(); }
function _cvElCol(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.color : "#8aa0c8"; }
function _cvWhere(f) { return f.post === CONVERT.room ? "HOLDING THE SEWERS" : "IN YOUR SQUAD"; }
// a follower's card: its picture on its backdrop, its name, level and element; the picture is drawn after the markup is in (data-draw)
function _cvUnitHTML(f, i, opts) {
    const o = opts || {}, col = _cvElCol(f.element), why = o.why || "";
    const tag = o.button ? "button" : "div", act = o.button ? ' data-act="pick" data-i="' + i + '"' : "";
    return "<" + tag + ' class="cv-unit' + (why ? " off" : "") + '" style="--c:' + col + '"' + act + ' data-draw="' + (o.draw || "") + '"><canvas width="128" height="128"></canvas>' +
        '<div class="cv-n">' + _cvEsc(typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER") + "</div>" +
        '<div class="cv-m">LV ' + (f.level || 1) + " · " + _cvEsc(_cvElLabel(f.element)) + (o.where ? " · " + o.where : "") + "</div>" +
        (why ? '<div class="cv-why">' + _cvEsc(why) + "</div>" : "") + "</" + tag + ">";
}
// draw each card's picture and lay its backdrop (js/commandcenter.js _ccThumb; js/cardart.js cardArtUnitClass)
function _cvImgReady(u) { const d = u && u.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[u.evolved] : null; return !d || !!(d._img && d._img.complete && d._img.naturalWidth); }
function _cvDraw(root, units) {
    _cv.units = units; _cv.pending = units.some(u => !_cvImgReady(u));   // (an evolved form's sheet still loading: convertTick draws them again once it has)
    const cards = root.querySelectorAll ? root.querySelectorAll(".cv-unit") : [];
    cards.forEach((el, k) => {
        const u = units[k]; if (!u) return;
        const cv = el.querySelector && el.querySelector("canvas");
        if (cv && typeof _ccThumb === "function") { try { _ccThumb(cv, u); } catch (e) {} }
        if (typeof cardArtMark === "function" && typeof cardArtUnitClass === "function") { try { cardArtMark(el, cardArtUnitClass(u)); } catch (e) {} }
    });
}
// its moves: unevolved, a plain hit, or a Mage's shot (no element move nor Ultimate since build 2026-11-09b); evolved, its form's own shot or hit and its alternates, and its Ultimate (an element's special is no longer
// fired by a follower: js/combat.js)
function _cvMoves(f) {
    const U = typeof followerUltimate === "function" ? followerUltimate(f) : null, UL = !U && typeof followerUltLocked === "function" && followerUltLocked(f) ? FORM_ULTIMATES[f.evolved] : null;
    const lock = f.evolved && typeof energyAltOpen === "function" && !energyAltOpen(f) ? " (LOCKED)" : "";   // (its energy cards: an evolved one's attacks locked until it holds its element's, js/energy.js)
    const d = f.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[f.evolved] : null, list = [];
    if (d) { if (d.shot || d.hit) list.push(String(d.shot || d.hit).toUpperCase()); if (typeof evoMoveIds === "function") evoMoveIds(d).forEach(id => list.push(MOVES[id].name + lock)); }
    else list.push(f.role === "sniper" ? "MAGE SHOT" : "PLAIN HIT");   // (a Mage shoots, evolved or not: js/npc.js)
    if (U && U.name) list.push("ULTIMATE " + String(U.name).toUpperCase());
    else if (UL && UL.name) list.push("ULTIMATE " + String(UL.name).toUpperCase() + " (LOCKED)");
    return list.length ? list.join(" · ") : "NONE YET";
}
// a Technician's ability, now and after (build 2026-11-08m: TOXIC PODS to REEF); null for a Brawler or a Mage
function _cvAbility(f) { const a = typeof techAbilityOf === "function" ? techAbilityOf(f) : null, b = a && typeof TECH_ABILITIES !== "undefined" ? TECH_ABILITIES[CONVERT.to] : null; return a && b ? [a.name, b.name] : null; }
function _cvFormName(u) { const d = u && u.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[u.evolved] : null; return d ? d.name : "—"; }
function _cvProc(el) { const A = typeof _IP_ATTACKS !== "undefined" ? _IP_ATTACKS[el] : null; return A && A.proc ? String(A.proc).toUpperCase() : "—"; }
function _cvRender() {
    const root = typeof document !== "undefined" ? document.getElementById("convPanel") : null; if (!root) return;
    const head = '<div class="cv-head"><span>PURIFICATION MODULE · CONVERSION</span><button data-act="close" class="cv-x" aria-label="Close">✕</button></div>';
    if (_cv.view === "preview" && _cv.pick) {
        const f = _cv.pick, g = convertPreview(f), off = convertCardsOff(f), armed = _cv.armUntil && typeof frame !== "undefined" && frame <= _cv.armUntil;
        const rows = typeof _ccFocusStats === "function" ? _ccFocusStats(f).filter(r => r[0] !== "EVOLVES") : [];
        const ch = (k, a, b) => '<tr class="ch"><td>' + k + "</td><td class=\"v\">" + _cvEsc(a) + "</td><td class=\"v\">" + _cvEsc(b) + "</td></tr>";
        const role = _cvRole(f), form = CONVERT.forms[role] || "ITS CLASS'S BLOOM FORM";
        root.innerHTML = '<div class="cv-card">' + head +
            '<div class="cv-sub">CONVERT IT INTO BLOOM? ITS LEVEL, XP, BOND AND STATS STAY THE SAME. IT CANNOT BE UNDONE.</div>' +
            '<div class="cv-pair">' + _cvUnitHTML(f, 0, { where: "NOW" }) + '<div class="cv-arrow" aria-hidden="true">▸</div>' + _cvUnitHTML(g, 1, { where: "AFTER" }) + "</div>" +
            '<table class="cv-stats"><tr><th></th><th class="v">NOW</th><th class="v">AFTER</th></tr>' +
            rows.map(r => "<tr><td>" + r[0] + '</td><td class="v">' + _cvEsc(r[2]) + '</td><td class="v">' + _cvEsc(r[2]) + "</td></tr>").join("") +
            ch("ELEMENT", _cvElLabel(f.element), _cvElLabel(CONVERT.to)) +
            ch("ITS HITS", _cvProc(f.element), "MEND: HEALS THE MOST HURT ALLY WITHIN 4 TILES BY 2% OF ITS MAXIMUM HEALTH") +
            ch("MOVES", _cvMoves(f), _cvMoves(g)) +
            (_cvAbility(f) ? ch("ABILITY", _cvAbility(f)[0], _cvAbility(f)[1]) : "") +
            (f.evolved ? ch("FORM", _cvFormName(f), _cvFormName(g))
                       : ch("EVOLVES INTO", typeof evolutionFor === "function" && evolutionFor(f) ? evolutionFor(f).name : "—", typeof evolutionFor === "function" && evolutionFor(g) ? evolutionFor(g).name : form + " (NOT IN THE GAME YET: IT WAITS AT ITS LEVEL)")) +
            (off.length ? ch("CARDS", off.join(", "), "THEY COME OFF, BACK TO YOUR HAND") : "") +
            "</table>" +
            '<div class="cv-row"><button data-act="back">BACK</button><button data-act="convert" class="cv-go' + (armed ? " armed" : "") + '">' + (armed ? "TAP AGAIN TO CONVERT" : "CONVERT INTO BLOOM") + "</button></div></div>";
        _cvDraw(root, [f, g]);
        return;
    }
    const here = convertHere(), can = convertCan();
    root.innerHTML = '<div class="cv-card">' + head +
        '<div class="cv-sub">THE MODULE FILTERS THE TOXIN OUT: A TOXIC FOLLOWER BECOMES <b style="color:' + CONVERT.bloom + '">BLOOM</b>. THE TOXIC FOLLOWERS HERE, IN YOUR SQUAD OR HOLDING THE SEWERS: PICK ONE.</div>' +
        (here.length ? '<div class="cv-strip">' + here.map((f, i) => _cvUnitHTML(f, i, { button: true, where: _cvWhere(f), why: convertWhyNot(f) })).join("") + "</div>"
                     : '<div class="cv-note">' + _cvEsc(can.why || "NO TOXIC FOLLOWER IS HERE") + "</div>") +
        '<div class="cv-note">AN EVOLVED BRAWLER BECOMES ' + CONVERT.forms.brawler + ', AN EVOLVED MAGE ' + CONVERT.forms.sniper + ', AN EVOLVED TECHNICIAN ' + CONVERT.forms.camper + '.</div></div>';
    _cvDraw(root, here);
}
