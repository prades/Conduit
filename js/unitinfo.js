// ─────────────────────────────────────────────────────────
//  UNIT INFO — the INFO tab on every card: a follower's (or a clone type's) attacks, jobs and stats
// ─────────────────────────────────────────────────────────
// REPORTED: "I would like an info tab for each of the followers and their different attacks and jobs", "on each card". Every card (the Command
// Center's roster cards, the phone roster, the Clone Bay's player cards) has an INFO button that opens this: ATTACKS, JOBS and STATS tabs.
// The numbers are the game's own constants (evolution.js, species.js, elements.js), read, not retyped, so the page cannot drift from play.
// The ultimates (js/elements.js FOLLOWER_ULTIMATES): each works within ULT_REACH tiles of the follower.
const ELEMENT_ULTIMATES = [
    { el: "fire",     name: "Volcanic Eruption", desc: "A column of fire on the biggest enemy in reach, then a burning crater" },
    { el: "electric", name: "EMP",               desc: "Strips every enemy shield in reach and speeds up your followers" },
    { el: "ice",      name: "Blizzard",          desc: "A field of snow that keeps freezing the enemies in it" },
    { el: "flux",     name: "Disorient",         desc: "The creatures in reach turn on each other" },
    { el: "core",     name: "Shield Grant",      desc: "A shield on every one of your followers" },
    { el: "toxic",    name: "Smoke Screen",      desc: "Smoke creeps out: the enemies in it lose their aim" },
];
const ROLE_INFO = {
    brawler: { label: "BRAWLER",    text: "Closes in and fights up close." },
    sniper:  { label: "MAGE",       text: "Fires from a distance." },
    camper:  { label: "TECHNICIAN", text: "Holds a post." },
};
const CLONE_SPECIAL = {
    scorpion: "STINGER", spider: "WEB SHOT", mantis: "AMBUSH", moth: "DUST",
};
const CLONE_SPECIAL_TEXT = {
    scorpion: "Fires its stinger tail from the rear.", spider: "Spits spinneret venom from the rear.", mantis: "Strikes with its raptorial forelegs at range.", moth: "Blows a cloud of wing-dust powder.",
};
const _uiSec = f => (f / 60) % 1 === 0 ? (f / 60) + " s" : (f / 60).toFixed(1) + " s";
const _uiX = n => n + "×";

// A signature move, as rows ([label, value]) read off the constants.
const MOVE_INFO = {
    "PETAL BLAZE":     () => [["REACH", BLOOM_RADIUS + " tiles"], ["EVERY", _uiSec(BLOOM_EVERY)], ["DAMAGE", _uiX(BLOOM_MULT) + " power"], ["EFFECT", "A ring of fire hits everything around it and sets it burning for " + _uiSec(BLOOM_BURN)]],
    "QUILL BURST":     () => MOVE_INFO["PETAL BLAZE"](),
    "FIRE BOMBS":      () => [["REACH", FIRE_BARRAGE_RANGE + " tiles"], ["EVERY", _uiSec(FIRE_BARRAGE_EVERY)], ["BOMBS", "3, fanned"], ["EFFECT", "Three bombs lobbed at the nearest enemy: each lands, bounces up to " + (FIRE_BOUNCES - 1) + " times, splashes what it lands on and sets the ground burning for 10 to 15 seconds. The fire hurts everyone on it, your own side too."]],
    "ARC VOLLEY":      () => [["REACH", REAVER_RANGE + " tiles"], ["EVERY", _uiSec(REAVER_EVERY)], ["DAMAGE", _uiX(REAVER_MULT) + " power"], ["EFFECT", "A charged arc that jumps to " + REAVER_CHAIN + " more enemies"]],
    "SINGULARITY SHOT": () => [["REACH", SERPENT_RANGE + " tiles"], ["EVERY", _uiSec(SERPENT_EVERY)], ["DAMAGE", _uiX(SERPENT_MULT) + " power"], ["EFFECT", "Drags every enemy within " + SERPENT_PULL_R + " tiles of the target in and slows them (a beetle, a boss or a machine is too heavy to drag)"]],
    "AEGIS BURST":     () => [["REACH", WARDEN_RADIUS + " tiles"], ["EVERY", _uiSec(WARDEN_EVERY)], ["DAMAGE", _uiX(WARDEN_MULT) + " power"], ["EFFECT", "Shoves enemies back and shields itself and allies within " + WARDEN_ALLY_R + " tiles for " + Math.round(WARDEN_SHIELD * 100) + "% of max health"]],
    "STATIC RUSH":     () => [["REACH", MANTA_RANGE + " tiles"], ["EVERY", _uiSec(MANTA_EVERY)], ["DAMAGE", _uiX(MANTA_MULT) + " power"], ["EFFECT", "Dashes to the enemy, hits it and shocks " + MANTA_CHAIN + " more; all are stunned for " + _uiSec(MANTA_STUN)]],
    "HEXFIRE":         () => [["REACH", HALO_RANGE + " tiles"], ["EVERY", _uiSec(HALO_EVERY)], ["DAMAGE", HALO_ROUNDS + " rounds of " + _uiX(HALO_MULT) + " power"], ["EFFECT", "Six crystals fire at once, one at each of the nearest enemies in turn, setting them burning"]],
    "CORRODE SHOT":    () => [["REACH", ROT_RANGE + " tiles"], ["EVERY", _uiSec(ROT_EVERY)], ["DAMAGE", _uiX(ROT_MULT) + " power"], ["EFFECT", "Eats the target's armour for " + _uiSec(ROT_SHRED_FRAMES) + " and splashes the corrosion over " + ROT_SPLASH_R + " tiles"]],
    "GRAVITY SLAM":    () => [["REACH", MIMIC_RADIUS + " tiles"], ["EVERY", _uiSec(MIMIC_EVERY)], ["DAMAGE", _uiX(MIMIC_MULT) + " power"], ["EFFECT", "Flattens and slams: shoves enemies back and slows them for " + _uiSec(MIMIC_SLOW_FRAMES) + " (heavy ones are not moved)"]],
    "AEGIS BLOOM":     () => [["REACH", PETAL_RANGE + " tiles"], ["EVERY", _uiSec(PETAL_EVERY)], ["DAMAGE", _uiX(PETAL_MULT) + " power"], ["EFFECT", "A bolt of core energy at the nearest enemy, and a " + Math.round(PETAL_SHIELD * 100) + "% shield on the worst-hurt ally within " + PETAL_ALLY_R + " tiles"]],
    "ERUPTION":        () => [["REACH", CALDERA_RADIUS + " tiles"], ["EVERY", _uiSec(CALDERA_EVERY)], ["DAMAGE", _uiX(CALDERA_MULT) + " power"], ["EFFECT", "The crater bursts in toxic goo and eats the armour of everything it hits for " + _uiSec(CALDERA_SHRED_FRAMES)]],
    "CHOMP":           () => [["REACH", MAW_RANGE + " tiles"], ["EVERY", _uiSec(MAW_EVERY)], ["DAMAGE", _uiX(MAW_MULT) + " power"], ["EFFECT", "The fangs slam down: the target is frozen stiff for " + _uiSec(MAW_STUN) + " and everything within " + MAW_SLOW_R + " tiles of it is slowed"]],
};

const _uiLabel = id => { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === id) : null; return e ? e.label.toUpperCase() : String(id || "").toUpperCase(); };
const _uiColour = id => { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === id) : null; return e ? e.color : "#8aa0c8"; };

// ── THE DATA: { title, sub, color, attacks: [section], jobs: [section], stats: [section] }, a section = { h, rows: [[k, v]], note } ──
function followerInfo(a) {
    const ev = typeof evolvedDef === "function" ? evolvedDef(a) : null, role = a.role === "hybrid" ? "brawler" : a.role, r = ROLE_INFO[role] || ROLE_INFO.brawler;
    const ps = typeof PLAY_STYLES !== "undefined" ? (PLAY_STYLES.find(p => p.id === a.playStyle) || PLAY_STYLES[1]) : null;
    const title = typeof unitTypeLabel === "function" ? unitTypeLabel(a) : _uiLabel(a.element) + " " + r.label;
    const out = { kind: "follower", unit: a, title, sub: _uiLabel(a.element) + " · LV " + (a.level || 1) + (ev ? " · EVOLVED" : ""), color: _uiColour(a.element), attacks: [], jobs: [], stats: [] };
    // ATTACKS
    out.attacks.push({ h: "ATTACK STYLE · " + r.label, note: r.text, rows: ps ? [["PLAY STYLE", ps.label + " (" + ps.blurb.toLowerCase() + ")"], ["ENGAGE REACH", _uiX(ps.reach) + " its usual"]] : [] });
    if (ev && MOVE_INFO[ev.move]) {
        const cur = typeof evoMoveOf === "function" ? evoMoveOf(a, ev) : null, mv = cur && MOVE_INFO[cur.name] ? cur : { name: ev.move }, ids = typeof evoMoveIds === "function" ? evoMoveIds(ev).filter(id => typeof evoMoveAllowed !== "function" || evoMoveAllowed(a, ev, id)) : [];
        out.attacks.push({ h: "SIGNATURE · " + mv.name, note: ev.name, rows: MOVE_INFO[mv.name]() });
        // MORE THAN ONE MOVE: pick which it uses (js/moves.js; saved with the follower)
        if (ids.length > 1) out.attacks.push({ h: "MOVE", note: "This form can use more than one move. Pick one:", choices: ids.map(id => ({ id, label: MOVES[id].name, on: cur ? cur.id === id : false })), unit: a });
    }
    else if (ev) out.attacks.push({ h: "SIGNATURE", note: "The " + ev.name + " has no signature move yet.", rows: [] });   // (the technicians' forms: their tools are to come)
    else {
        const f = typeof evolutionFor === "function" ? evolutionFor(a) : null;
        out.attacks.push({ h: "SIGNATURE", note: f ? "Evolves at level " + EVOLVE_LEVEL + " into the " + f.name + " (and gets ×" + EVOLVE_MULT + " health and power)" + (f.move ? ", with the move " + f.move + ":" : ". It has no signature move yet.") : "No form for this element and role yet.", rows: f && MOVE_INFO[f.move] ? MOVE_INFO[f.move]() : [] });
    }
    const u = ELEMENT_ULTIMATES.find(x => x.el === a.element);
    if (u) out.attacks.push({ h: "ULTIMATE · " + u.name.toUpperCase(), note: u.desc + ". Double-tap the follower when it is fully charged.", rows: typeof a.ultimateCharge === "number" ? [["CHARGE", Math.round(Math.min(100, a.ultimateCharge)) + "%"]] : [] });
    // JOBS: the squad, or a room it holds (js/party.js)
    out.jobs.push({ h: "RIGHT NOW", rows: [["STANCE", a.post && typeof partyRoomName === "function" ? "HOLDING THE " + partyRoomName(a.post).toUpperCase() : typeof partyIsMember === "function" && partyIsMember(a) ? "IN THE SQUAD, FOLLOWING YOU" : a.stance === "hold" || (a.job && a.job.type === "move") ? "HOLDING A POST" : "FOLLOWING YOU"]] });
    // STATS
    out.stats.push({ h: "VITALS", rows: [["LEVEL", String(a.level || 1)], ["HEALTH", Math.max(0, Math.round(a.health || 0)) + " / " + Math.round(a.maxHealth || 0)], ["POWER", String(Math.round(a.power || 0))], ["SPEED", ((a.moveSpeed || 0) * 1000).toFixed(0)]] });
    if (a.stats) out.stats.push({ h: "BASE STATS" + (a.personality ? " · " + String(a.personality).toUpperCase() : ""), rows: Object.keys(a.stats).filter(k => k !== "resonance").map(k => [k.replace(/([A-Z])/g, " $1").toUpperCase(), String(a.stats[k])]) });
    const tr = [], add = (tab, key, label) => { const t = tab && key && tab[key]; if (t) tr.push([label, t.name + " — " + t.description]); };
    if (typeof COMBAT_TRAITS !== "undefined") { add(COMBAT_TRAITS, a.combatTrait, "COMBAT"); add(NATURAL_TRAITS, a.naturalTrait, "NATURE"); add(PERKS, a.perk, "PERK"); }
    if (tr.length) out.stats.push({ h: "TRAITS", rows: tr });
    return out;
}

// A clone TYPE (a species and class), from a Clone Bay card: what the clone does, its job, its numbers and its price.
function cloneTypeInfo(species, cls) {
    const S = SPECIES[species], d = (typeof getClassDef === "function" ? getClassDef(S, cls) : S[cls]) || S.scout;
    const special = d.abdomenAttack || (d.rangeDamage && d.rangeDamage > 0);
    const out = { kind: "clone", title: species.toUpperCase() + " " + cls.toUpperCase(), sub: "CLONE · " + (typeof CLONE_COSTS !== "undefined" && CLONE_COSTS[species] ? CLONE_COSTS[species].splicesNeeded + " SPLICES · " + cloneShardCost(species, cls) + " SHARDS" : ""), color: S.color, species, cls, attacks: [], jobs: [], stats: [] };
    const P = typeof CLONE_POWER_MULT === "number" ? CLONE_POWER_MULT : 1, H = typeof CLONE_HEALTH_MULT === "number" ? CLONE_HEALTH_MULT : 1;   // (a clone's numbers are its species' times these, at level 5: js/config.js)
    out.attacks.push({ h: "BITE", note: "Fights up close, as its species does: it rears back (the ring over it), then bites.", rows: [["POWER", String(Math.round(d.power * P))], ["REACTS IN", d.reactionSpeed + " frames when hit"]] });
    out.attacks.push(special ? { h: "SPECIAL · " + (CLONE_SPECIAL[species] || "SPECIAL"), note: CLONE_SPECIAL_TEXT[species] || "A ranged attack from the rear.", rows: [["DAMAGE", String(Math.round(d.rangeDamage * P))], ["EVERY", _uiSec(d.abdomenCooldown)], ["NOTE", "It will not turn when hit from behind"]] }
                              : { h: "SPECIAL", note: "None: a " + cls + " has no ranged attack" + (species === "ant" || species === "beetle" ? " (an " + species + " never does)." : " (the striker and tank do)."), rows: [] });
    out.jobs.push({ h: "RIGHT NOW", note: "A clone fights beside you: it follows, and holds where it is told to.", rows: [] });
    out.stats.push({ h: "VITALS", rows: [["HEALTH", String(Math.round(d.health * H))], ["POWER", String(Math.round(d.power * P))], ["SPEED", String(Math.round(d.moveSpeed * 1000))], ["SIZE", d.width + " × " + d.height]] });
    if (typeof cloneCap === "function") out.stats.push({ h: "LIMITS", rows: [["CLONES AT ONCE", String(cloneCap())], ["WHO GROWS IT", typeof cloneWho === "function" && cloneWho() ? cloneWho() : "ANY CLASS"], ["COST", cloneShardCost(species, cls) + " shards and " + (CLONE_COSTS[species] ? CLONE_COSTS[species].splicesNeeded : "?") + " splices"]] });
    return out;
}
// A live clone: its type's info, with its own health.
function cloneInfo(a) { const o = cloneTypeInfo(a.speciesName, a.className || "scout"); o.unit = a; o.stats[0].rows[0] = ["HEALTH", Math.max(0, Math.round(a.health || 0)) + " / " + Math.round(a.maxHealth || 0)]; return o; }
function unitInfo(a) { return a && a.isClone ? cloneInfo(a) : followerInfo(a); }

// ── THE OVERLAY ──
function unitInfoClose() { const r = document.getElementById("unitInfo"); if (r && r.parentNode) r.parentNode.removeChild(r); }
function _uiEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _uiRenderSections(body, secs) {
    body.textContent = "";
    for (const s of secs) {
        const sec = _uiEl("div", "ui-sec"); sec.appendChild(_uiEl("div", "ui-h", s.h));
        if (s.note) sec.appendChild(_uiEl("div", "ui-note", s.note));
        if (s.choices) { const row = _uiEl("div", "ui-choices"); for (const c of s.choices) { const b = _uiEl("button", "ui-choice" + (c.on ? " on" : ""), c.label); b.addEventListener("click", ev => { ev.stopPropagation(); if (s.unit) { s.unit.move = c.id; s.unit._sigCd = Math.min(s.unit._sigCd || 0, 60); } if (typeof unitInfoOpen === "function") unitInfoOpen(s.unit, "attacks"); }); row.appendChild(b); } sec.appendChild(row); }
        for (const r of s.rows || []) { const row = _uiEl("div", "ui-row"); row.appendChild(_uiEl("span", "ui-k", r[0])); row.appendChild(_uiEl("span", "ui-v", r[1])); sec.appendChild(row); }
        body.appendChild(sec);
    }
}
// info: from followerInfo / cloneInfo / cloneTypeInfo. `tab`: which tab to open on.
function unitInfoShow(info, tab) {
    unitInfoClose();
    const root = _uiEl("div", "ui-over"); root.id = "unitInfo"; root.addEventListener("click", () => unitInfoClose());
    const card = _uiEl("div", "ui-card"); card.style.setProperty("--c", info.color); card.addEventListener("click", e => e.stopPropagation());
    const head = _uiEl("div", "ui-head");
    const cv = _uiEl("canvas", "ui-art"); cv.width = 96; cv.height = 96; head.appendChild(cv);
    const ht = _uiEl("div", "ui-ht"); ht.appendChild(_uiEl("div", "ui-title", info.title)); ht.appendChild(_uiEl("div", "ui-sub", info.sub)); head.appendChild(ht);
    const x = _uiEl("button", "ui-close", "✕"); x.addEventListener("click", () => unitInfoClose()); head.appendChild(x); card.appendChild(head);
    const tabs = _uiEl("div", "ui-tabs"), body = _uiEl("div", "ui-body");
    const show = id => { tabs.querySelectorAll(".ui-tab").forEach(t => t.classList.toggle("on", t.getAttribute("data-tab") === id)); _uiRenderSections(body, info[id]); };
    [["attacks", "ATTACKS"], ["jobs", "JOBS"], ["stats", "STATS"]].forEach(t => { const b = _uiEl("button", "ui-tab", t[1]); b.setAttribute("data-tab", t[0]); b.addEventListener("click", () => show(t[0])); tabs.appendChild(b); });
    card.appendChild(tabs); card.appendChild(body); root.appendChild(card); document.body.appendChild(root);
    show(tab || "attacks");
    // the picture
    try {
        const g = cv.getContext("2d");
        if (info.kind === "clone" && typeof drawCloneArt === "function") drawCloneArt(g, { key: info.species + "_" + info.cls, speciesName: info.species, className: info.cls, ready: true }, 48, 74, 1.5);
        else if (info.unit && typeof _ccThumb === "function") { const t = _uiEl("canvas"); t.width = 72; t.height = 72; _ccThumb(t, info.unit); g.drawImage(t, 0, 0, 96, 96); }
    } catch (e) { /* a picture must never take the info down */ }
    return root;
}
function unitInfoOpen(unit, tab) { return unit ? unitInfoShow(unitInfo(unit), tab) : null; }
function unitInfoOpenType(species, cls, tab) { return unitInfoShow(cloneTypeInfo(species, cls), tab); }
window.addEventListener("keydown", e => { if (e && e.key === "Escape") unitInfoClose(); });
