// ─────────────────────────────────────────────────────────
//  THE TEST CHAMBER'S MODE (?testchamber): docs/TEST-CHAMBER.md
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-23: "Can we create a test chamber where I can create any type of squad and create any type of enemy and level, and a room that has 3D and card battles, and maybe all
// sorts of energy cards unlocked".
// The room is map data (js/facilitymap.js TEST_CHAMBER_MAP), put in the map by js/facilitygrow.js only when the address carries ?testchamber. This file is the mode round it and its panel.
// Each piece elsewhere is a small hook guarded by testChamberOn(), beside the Flux test room's (js/fluxlab.js), whose pattern this follows:
//   NOTHING KEPT   no saved game is read or written, and nothing at all is written to storage (js/facilitysave.js facilitySaveLoad; js/facilityplay.js _fpNoStorage and _fp.saveReady): a
//                  player's own save is left exactly as it was. NEW GAME (the chip) starts the chamber again: the address keeps ?testchamber.
//   NO TUTORIAL    the power is on and the tutorial is over before it starts: no blackout, none of the Crystal's lines, no class picker, no cards screen.
//   THE START      the player in the chamber with a squad (at first a new game's kind of three, at the tutorial's follower level), every element's energy cards in stock, no enemy.
//                  The rest of the facility is a new game's; a stairwell in the Crystal Chamber's floor and the chamber's doorway join the two.
//   3D, CARDS      what the address gets (js/config.js enginePlan): over the web the plain game is the 3D view with card battles, so ?testchamber alone is that; from a file on disk,
//                  ?testchamber&engine=3d&battles=cards. The 3D view builds the room (view3d/gamemap.js VIEW3D_ROOMS).
//   THE PANEL      TEST CHAMBER (a chip at the top of the screen) opens it: THE SQUAD (three places: an element, a role, evolved or not, a level, the energy cards in its slots), YOUR CLASS,
//                  ENEMIES (a species, a class, an element, a level, how many; and CLEAR), ENERGY CARDS (the stock filled again).
// NOTHING HERE IS A RULE OF THE GAME, AND NO NUMBER IS NEW. A follower is made by the game's own maker (js/helpers.js spawnFollowerAtCrystal), levelled by its own levelling (js/levels.js),
// evolved into the form the game gives its element and role (js/evolution.js evolutionFor), its energy cards put in its slots as the game holds them (js/energy.js); a creature is made by
// the facility's own spawner (js/facilityspawn.js facilitySpawnCreature) from its species' own class (js/species.js), at the level asked. What the chamber's own numbers are (its size, how
// many cards in stock, how many enemies at a press and at once) is the agent's, for the owner to change (TEST_CHAMBER).

const TEST_CHAMBER = {
    flag: /[?&]testchamber\b/,
    room: "test_chamber",
    tag: "Test Chamber",               // the room's name on the room tag (js/facilitynet.js)
    look: "crystal_chamber",           // the room's style: the Crystal Chamber's (js/facilitystyleall.js FP_ROOM_STYLE)
    start: [8, 9],                     // the player's tile, from the room's top-left floor tile (js/facilitymap.js TEST_CHAMBER_MAP): the south half
    foes: [8, 3],                      // the enemies are put round this tile: the north half, in sight and out of reach
    stock: 9,                          // energy cards of every element in your stock (three followers of three slots)
    most: 6, cap: 12,                  // enemies made at one press; alive at once
    roles: ["brawler", "sniper", "camper"],
    classes: ["nymph", "worker", "scout", "striker", "tank", "boss"],
    // THE SQUAD ASKED FOR: three places, each { element (a real one, "none", or "" for nobody), role, evolved, level (null: the tutorial's follower level), cards (an evolved one's energy
    // cards of its own element in its slots, 0 to 3) }. At first a new game's kind of three. The panel changes it; nothing keeps it past the page.
    squad: [{ element: "electric", role: "brawler", evolved: false, level: null, cards: 3 }, { element: "core", role: "sniper", evolved: false, level: null, cards: 3 }, { element: "fire", role: "camper", evolved: false, level: null, cards: 3 }],
    enemy: { species: "ant", cls: "worker", element: "", level: null, n: 1 },   // what the enemy maker starts on (level null: the arena's lowest)
};

let _tcSearch = null, _tcFlag = false;
// the address is read once (a page's address does not change without a reload); testChamberRefresh reads it again (the tests change it). Never with the Flux test room: one test room at a time.
function testChamberRefresh() {
    const s = typeof window !== "undefined" && window.location ? window.location.search || "" : "";
    _tcSearch = s; _tcFlag = TEST_CHAMBER.flag.test(s) && !/[?&]fluxlab\b/.test(s); return _tcFlag;
}
function testChamberOn() { return _tcSearch === null ? testChamberRefresh() : _tcFlag; }

// the room's look and name, with the flag only (without it nothing of the facility's tables changes)
function testChamberLook() {
    if (!testChamberOn()) return false;
    if (typeof FP_STYLE_ROOMS !== "undefined") FP_STYLE_ROOMS.add(TEST_CHAMBER.room);
    if (typeof FP_ROOM_STYLE !== "undefined" && !FP_ROOM_STYLE[TEST_CHAMBER.room] && FP_ROOM_STYLE[TEST_CHAMBER.look]) FP_ROOM_STYLE[TEST_CHAMBER.room] = FP_ROOM_STYLE[TEST_CHAMBER.look];
    if (typeof FP_ROOM_TAG !== "undefined") FP_ROOM_TAG[TEST_CHAMBER.room] = TEST_CHAMBER.tag;
    return true;
}
try { testChamberLook(); } catch (e) {}

// a tile of the room, from its top-left floor tile (the room's first corner is its top-left: js/facilitymap.js TEST_CHAMBER_MAP)
function testChamberTile(F, p) {
    const R = F && F.byId && F.byId.get(TEST_CHAMBER.room); if (!R || !R.poly || !R.poly.length) return null;
    return [R.poly[0][0] + 0.5 + p[0], R.poly[0][1] + 0.5 + p[1]];
}
function _tcF() { return typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F : null; }
function _tcElementOk(el) { return typeof energyElementOk === "function" ? energyElementOk(el) : typeof el === "string" && !!el && el !== "none"; }
function _tcLevel(v, dflt) { const cap = typeof LEVEL_CAP !== "undefined" ? LEVEL_CAP : 100, n = Math.round(Number(v)); return Number.isFinite(n) && v !== null && v !== "" ? Math.max(1, Math.min(cap, n)) : dflt; }
// the levels asked for when none is: the tutorial's follower level; the arena's lowest
function testChamberFollowerLevel() { return typeof TUT !== "undefined" && Number.isFinite(TUT.followerLevel) ? TUT.followerLevel : typeof LEVEL_START !== "undefined" ? LEVEL_START : 5; }
function testChamberEnemyLevel() { const st = typeof spawnStage === "function" ? spawnStage("arena") : null; return st && st.levels ? st.levels[0] : 1; }
// the form the game gives an element and a role (js/evolution.js evolutionFor), or null
function testChamberForm(element, role) { return _tcElementOk(element) && typeof evolutionFor === "function" ? evolutionFor({ isFollower: true, element, role }) : null; }

// ONE OF THE SQUAD, as asked, by the game's own maker, levelling, evolving and energy slots. Null for nobody (an empty place, or no maker).
function testChamberMember(spec, at) {
    if (!spec || spec.element === "" || spec.element === null || spec.element === undefined || typeof spawnFollowerAtCrystal !== "function") return null;
    const role = TEST_CHAMBER.roles.indexOf(spec.role) >= 0 ? spec.role : TEST_CHAMBER.roles[0], el = _tcElementOk(spec.element) ? spec.element : null;
    const n = followers.length; spawnFollowerAtCrystal(el || (typeof ENERGY_NONE !== "undefined" ? ENERGY_NONE : "none"), role);
    const f = followers.length > n ? followers[followers.length - 1] : null; if (!f) return null;
    f.role = role; f.level = _tcLevel(spec.level, testChamberFollowerLevel()); if (typeof xpForLevel === "function") f.xp = xpForLevel(f.level);
    if (typeof energyStart === "function") energyStart(f, el);   // (unevolved: its one card, which is its element; none, and it has no element)
    const d = spec.evolved && el ? testChamberForm(el, role) : null;
    if (d) {
        f.evolved = d.id; f._moltAt = -1e9; delete f._evoOnLevelUp;   // (out of the egg already: no molt to wait through)
        const k = Math.max(0, Math.min(typeof ENERGY !== "undefined" ? ENERGY.evolvedSlots : 3, Number.isFinite(spec.cards) ? Math.round(spec.cards) : 3));
        if (typeof energyEvolved === "function") { energyEvolved(f); f.energy = f.energy.map((x, i) => i < k ? el : null); }   // (its own element's cards in its first k slots: 1 its second attack, 2 its extra, 3 its Ultimate, js/energy.js)
    }
    if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(f, true); f.health = f.maxHealth;
    if (at) { f.x = at[0]; f.y = at[1]; } f.returningToCrystal = false; f._fpPath = null; f._fpGoalAt = null; f._fpStuck = 0;
    f._abMember = true; f._abReadyAt = 0;   // its chip ready at once: no squad-join wait in a test room (js/techabilities.js techAbilityTick)
    const S = typeof _fp !== "undefined" && _fp && _fp.tut ? _fp.tut.script : null; if (S && S.levelled && S.levelled.add) S.levelled.add(f);   // (the tutorial's director lifts no level here: js/tutorial.js tutLevelFollowers)
    f.testChamber = true; return f;
}
// the squad a game in the chamber starts with (js/facilityplay.js facilityPlayStart, in place of a new game's three): what was last asked for
function testChamberSquad() { const out = []; for (const spec of TEST_CHAMBER.squad.slice(0, typeof PARTY !== "undefined" ? PARTY.max : 3)) { const f = testChamberMember(spec, null); if (f) out.push(f); } return out; }
function _tcPlaceSquad(s) { let i = 0; for (const f of followers) { if (!f || !f.testChamber || f.dead) continue; f.x = f.targetX = s[0] - 1 + (i % 3); f.y = f.targetY = s[1] + 1 + Math.floor(i / 3); i++; } }

// the start (js/facilityplay.js facilityPlayStart, after the tutorial has begun and before the arena's creatures): the tutorial over, the player and the squad in the room, every element's
// cards in stock. False when not in the mode.
function testChamberStart(F) {
    if (!testChamberOn() || typeof _fp === "undefined" || !_fp || !F || !F.byId || !F.byId.has(TEST_CHAMBER.room)) return false;
    if (typeof facilityBlackoutSet === "function") facilityBlackoutSet(false);
    const S = _fp.tut && _fp.tut.script;
    if (S && typeof TUT_STEPS !== "undefined") { S.step = TUT_STEPS.length; S.doneAt = Math.max(1, typeof frame !== "undefined" ? frame : 1); }   // (over before it starts: no lines, no class picker, js/tutorial.js)
    const s = testChamberTile(F, TEST_CHAMBER.start);
    player.x = player.targetX = player.visualX = s[0]; player.y = player.targetY = player.visualY = s[1]; player.fpPath = null;
    _tcPlaceSquad(s);
    _fp.zoneRoom = TEST_CHAMBER.room;
    _fp.testChamber = { made: 0 };
    testChamberEnergy();
    return true;
}

// EVERY ELEMENT'S ENERGY CARDS IN YOUR STOCK (TEST_CHAMBER.stock of each, filled back up to it): put in a follower's slots on the roster as any card is. The number of elements filled.
function testChamberEnergy() {
    if (!testChamberOn() || typeof energyAdd !== "function" || typeof ELEMENTS === "undefined") return 0;
    let n = 0; for (const e of ELEMENTS) { if (!_tcElementOk(e.id)) continue; const short = TEST_CHAMBER.stock - energyCount(e.id); if (short > 0) energyAdd(e.id, short); n++; }
    if (typeof partyBarRender === "function") { try { partyBarRender(true); } catch (e) {} }
    return n;
}

// THE SQUAD REPLACED, in a chamber that is running: a battle under way is ended first, the followers there are taken out of the game (not felled: nothing falls, nothing waits at the Crystal),
// and the ones asked for are made beside you. `list`: up to three places (TEST_CHAMBER.squad's shape). The followers made.
function testChamberSquadSet(list) {
    if (!testChamberOn() || typeof followers === "undefined" || typeof actors === "undefined") return [];
    if (typeof cardBattleActive === "function" && cardBattleActive() && typeof cardBattleEnd === "function") { try { cardBattleEnd(); } catch (e) {} }
    if (typeof cardBattleReset === "function") { try { cardBattleReset(); } catch (e) {} }
    const max = typeof PARTY !== "undefined" ? PARTY.max : 3; TEST_CHAMBER.squad = (list || []).slice(0, max).map(s => ({ element: s && s.element !== undefined && s.element !== null ? s.element : "", role: s && s.role, evolved: !!(s && s.evolved), level: s ? s.level : null, cards: s && Number.isFinite(s.cards) ? s.cards : 3 }));
    const old = followers.filter(f => f && f.isFollower === true && !f.isClone);
    for (let i = followers.length - 1; i >= 0; i--) if (old.indexOf(followers[i]) >= 0) followers.splice(i, 1);
    actors = actors.filter(a => old.indexOf(a) < 0);
    for (const a of actors) if (a && old.indexOf(a.currentTarget) >= 0) a.currentTarget = null;
    for (const f of old) { f.dead = true; f.health = 0; f.deathProcessed = true; }   // (whoever still holds one of them sees it gone)
    const out = testChamberSquad(); _tcPlaceSquad([player.x, player.y]);
    if (typeof rebuildFollowerTable === "function") { try { rebuildFollowerTable(); } catch (e) {} }
    if (typeof partyBarRender === "function") { try { partyBarRender(true); } catch (e) {} }
    return out;
}

// THE ENEMIES of the chamber alive now
function testChamberEnemies() { return typeof actors === "undefined" ? [] : actors.filter(a => a && a.testChamberFoe && !a.dead); }
// the classes a species has, of the game's six (js/species.js; a worker where it has a scout: js/clone.js getClassDef)
function testChamberClasses(species) { const def = typeof SPECIES !== "undefined" ? SPECIES[species] : null; return def ? TEST_CHAMBER.classes.filter(c => (def[c] && def[c].width) || (c === "worker" && def.scout && def.scout.width)) : []; }
function testChamberSpecies() { return typeof SPECIES === "undefined" ? [] : Object.keys(SPECIES).filter(k => testChamberClasses(k).length > 0); }
// free tiles of the room, nearest the enemies' spot first: on its floor, with nobody on them or beside them
function _tcSpots(F, n) {
    const at = testChamberTile(F, TEST_CHAMBER.foes), out = []; if (!at || typeof _fp === "undefined" || !_fp.cellsP) return out;
    const cells = []; for (const kv of _fp.cellsP) { const c = kv[1], r = facilityRoomAt(c[0], c[1], F); if (r && r.id === TEST_CHAMBER.room) cells.push(c); }
    cells.sort((p, q) => Math.hypot(p[0] - at[0], p[1] - at[1]) - Math.hypot(q[0] - at[0], q[1] - at[1]));
    const busy = [[player.x, player.y, 3]].concat(actors.filter(a => a && !a.dead && a !== player && Number.isFinite(a.x)).map(a => [a.x, a.y, 1.2]));
    for (const c of cells) { if (out.length >= n) break; if (busy.every(b => Math.hypot(b[0] - c[0], b[1] - c[1]) >= b[2])) { out.push(c); busy.push([c[0], c[1], 1.2]); } }
    return out;
}
// ENEMIES MADE, as asked: { species, cls, element ("" for none), level, n }. Each is the facility's own creature of that species and class at that level (js/facilityspawn.js
// facilitySpawnCreature), of the chamber: it wanders in it, calm until provoked, and never leaves. At most TEST_CHAMBER.most at a press and TEST_CHAMBER.cap alive. The creatures made.
function testChamberEnemy(spec) {
    const F = _tcF(), out = []; if (!testChamberOn() || !F || !spec || typeof facilitySpawnCreature !== "function") return out;
    const species = spec.species, cls = spec.cls; if (testChamberClasses(species).indexOf(cls) < 0) return out;
    const lv = _tcLevel(spec.level, testChamberEnemyLevel()), el = _tcElementOk(spec.element) ? spec.element : null;
    const want = Math.max(0, Math.min(TEST_CHAMBER.most, Math.round(Number(spec.n)) || 1, TEST_CHAMBER.cap - testChamberEnemies().length));
    for (const at of _tcSpots(F, want)) {
        const c = facilitySpawnCreature(species, at, { room: TEST_CHAMBER.room, species: [species], classes: { [cls]: 1 }, levels: [lv, lv], element: el });
        if (c) { c.testChamberFoe = true; out.push(c); }
    }
    if (_fp.testChamber) _fp.testChamber.made += out.length;
    return out;
}
// EVERY ENEMY OF THE CHAMBER GONE (a battle under way ended first): not killed, so nothing is paid and nothing dropped. How many went.
function testChamberClear() {
    if (!testChamberOn() || typeof actors === "undefined") return 0;
    if (typeof cardBattleActive === "function" && cardBattleActive() && typeof cardBattleEnd === "function") { try { cardBattleEnd(); } catch (e) {} }
    const gone = testChamberEnemies(); for (const a of gone) { a.dead = true; a.deathProcessed = true; a._xpGiven = true; }
    actors = actors.filter(a => gone.indexOf(a) < 0);
    for (const a of actors) if (a && gone.indexOf(a.currentTarget) >= 0) a.currentTarget = null;
    return gone.length;
}
// YOUR CLASS, by the game's own choosing (js/classes.js classSet): its kit comes with it as in the game. Its own gear that the game hands out elsewhere (the Gunslinger's gun from the
// Armory's locker, a Mutator's serum from the hood) is still fetched there: up the chamber's stairs.
// The Crystal's words for the class's stage are not said here (they are the tutorial's, about fetching that gear): marked said, as a loaded game's are (js/tutorial.js _tutSay).
function testChamberClass(id) {
    if (!testChamberOn() || typeof classSet !== "function" || typeof CLASSES === "undefined" || !CLASSES[id]) return false;
    const S = typeof _fp !== "undefined" && _fp && _fp.tut ? _fp.tut.script : null;
    if (S && S.said && typeof TUT_CLASS_STAGES !== "undefined") for (const st of TUT_CLASS_STAGES[id] || []) { S.said["cstep:" + id + ":" + st.id] = true; S.said["c:" + id + ":" + st.id] = true; S.said["cstray:" + st.id + "1"] = true; }
    classSet(id); return playerClassKey === id;
}

// ── THE PANEL ──────────────────────────────────────────────
// Plain controls for a finger (the page's own selects open the iPad's own pickers). It asks the functions above for everything; it holds no state of the game's.
let _tcEls = null;
const _TC_CSS = "#testChamberChip{display:none;position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:45;font:italic 900 13px var(--neo-font,monospace);letter-spacing:.06em;color:#bff6ea;background:rgba(7,13,31,.9);border:2px solid #19e6c1;padding:8px 16px;cursor:pointer}" +
    "body.facility-play #testChamberChip{display:block}body.cb-on #testChamberChip,body.panel-open #testChamberChip{display:none}" +   // (not over a battle's own banner: js/cardbattle.js marks the page cb-on)
   
    "#testChamberPanel{display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:90;width:min(760px,94vw);max-height:88vh;overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;padding:14px 16px 16px;background:rgba(7,13,31,.96);border:2px solid #19e6c1;color:#e8f4ff;font:700 13px var(--neo-font,monospace);letter-spacing:.04em;text-transform:uppercase}" +
    "#testChamberPanel.open{display:block}#testChamberPanel h2{margin:0 0 4px;font:italic 900 20px var(--neo-font,monospace);color:#19e6c1}#testChamberPanel h3{margin:14px 0 6px;font:italic 900 14px var(--neo-font,monospace);color:#ffe733;border-top:1px solid rgba(25,230,193,.35);padding-top:10px}" +
    "#testChamberPanel p{margin:2px 0 6px;font-weight:500;font-size:11px;color:#9fb6c9;text-transform:none;letter-spacing:0}" +
    "#testChamberPanel .tc-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}#testChamberPanel .tc-n{width:18px;color:#19e6c1}" +
    "#testChamberPanel select,#testChamberPanel input[type=number],#testChamberPanel button{font:700 13px var(--neo-font,monospace);text-transform:uppercase;min-height:40px;box-sizing:border-box;color:#e8f4ff;background:#0f1b33;border:1px solid #3c5a7a;border-radius:0;padding:4px 8px}" +
    "#testChamberPanel input[type=number]{width:64px;text-align:center}#testChamberPanel button{cursor:pointer;min-width:40px}#testChamberPanel button.go{background:#0c3b34;border:2px solid #19e6c1;color:#bff6ea;padding:4px 14px}#testChamberPanel button.warn{border-color:#c8553d;color:#ffb3a0}#testChamberPanel button.on{background:#19e6c1;color:#06131f}" +
    "#testChamberPanel label{display:inline-flex;align-items:center;gap:4px;min-height:40px;margin-right:8px}#testChamberPanel .tc-l{margin-left:6px;color:#9fb6c9}#testChamberPanel input[type=checkbox]{width:22px;height:22px}#testChamberPanel .tc-form{color:#ffe733;min-width:150px}#testChamberPanel .tc-say{color:#9dffb6;min-height:16px;font-size:12px}" +
    "#testChamberPanel .tc-x{position:absolute;right:10px;top:8px}";
function _tcOpt(v, label, sel) { return '<option value="' + v + '"' + (sel ? " selected" : "") + ">" + label + "</option>"; }
function _tcElements() { return typeof ELEMENTS === "undefined" ? [] : ELEMENTS.filter(e => _tcElementOk(e.id)); }
function _tcRoleLabel(r) { return typeof roleLabel === "function" ? roleLabel(r) : String(r).toUpperCase(); }
function _tcSquadRow(i, s) {
    const lv = s.level === null || s.level === undefined ? testChamberFollowerLevel() : s.level;
    return '<div class="tc-row" data-squad="' + i + '"><span class="tc-n">' + (i + 1) + "</span>" +
        '<select data-k="element">' + _tcOpt("", "NOBODY", s.element === "") + _tcOpt("none", "NO ELEMENT", s.element === "none") + _tcElements().map(e => _tcOpt(e.id, e.label || e.id, s.element === e.id)).join("") + "</select>" +
        '<select data-k="role">' + TEST_CHAMBER.roles.map(r => _tcOpt(r, _tcRoleLabel(r), s.role === r)).join("") + "</select>" +
        '<label><input type="checkbox" data-k="evolved"' + (s.evolved ? " checked" : "") + "> EVOLVED</label>" +
        '<span class="tc-l">LV</span><button data-step="-1">−</button><input type="number" data-k="level" min="1" max="' + (typeof LEVEL_CAP !== "undefined" ? LEVEL_CAP : 100) + '" value="' + lv + '"><button data-step="1">+</button>' +
        '<span class="tc-l">CARDS</span><select data-k="cards">' + [0, 1, 2, 3].map(n => _tcOpt(n, n, (Number.isFinite(s.cards) ? s.cards : 3) === n)).join("") + "</select>" +
        '<span class="tc-form"></span></div>';
}
function _tcHtml() {
    const E = TEST_CHAMBER.enemy, sp = testChamberSpecies(), elv = E.level === null || E.level === undefined ? testChamberEnemyLevel() : E.level;
    return '<button class="tc-x" data-act="close">CLOSE</button><h2>TEST CHAMBER</h2><p>Nothing here is saved, and your own saved game is not touched. NEW GAME starts the chamber again.</p>' +
        "<h3>THE SQUAD</h3><p>Up to three. An unevolved follower's element is its energy card; with one, it evolves by itself at level " + (typeof EVOLVE_LEVEL !== "undefined" ? EVOLVE_LEVEL : 8) + ". CARDS: an evolved follower's energy cards of its own element (1 its second attack, 2 its extra attack, 3 its Ultimate).</p>" +
        TEST_CHAMBER.squad.concat([{ element: "", role: "brawler", evolved: false, level: null, cards: 3 }, { element: "", role: "brawler", evolved: false, level: null, cards: 3 }, { element: "", role: "brawler", evolved: false, level: null, cards: 3 }]).slice(0, 3).map((s, i) => _tcSquadRow(i, s)).join("") +
        '<div class="tc-row"><button class="go" data-act="squad">MAKE THIS SQUAD</button><span class="tc-say" data-say="squad"></span></div>' +
        "<h3>YOUR CLASS</h3>" + '<div class="tc-row" data-classes>' + (typeof CLASSES !== "undefined" ? Object.keys(CLASSES).map(k => '<button data-class="' + k + '">' + (typeof className === "function" ? className(k) : k) + "</button>").join("") : "") + "</div>" +
        "<p>Its own gear is still fetched where the game hands it out (the Gunslinger's gun at the Armory's locker, a serum at the hood): up the chamber's stairs.</p>" +
        "<h3>ENEMIES</h3><p>They come in at the far end, calm until you choose one. Only ants have a 3D body yet: another species is drawn flat over the picture.</p>" +
        '<div class="tc-row" data-enemy><select data-k="species">' + sp.map(k => _tcOpt(k, k, E.species === k)).join("") + '</select><select data-k="cls"></select>' +
        '<select data-k="element">' + _tcOpt("", "NO ELEMENT", !E.element) + _tcElements().map(e => _tcOpt(e.id, e.label || e.id, E.element === e.id)).join("") + "</select>" +
        '<span class="tc-l">LV</span><button data-step="-1">−</button><input type="number" data-k="level" min="1" max="' + (typeof LEVEL_CAP !== "undefined" ? LEVEL_CAP : 100) + '" value="' + elv + '"><button data-step="1">+</button>' +
        '<span class="tc-l">×</span><select data-k="n">' + Array.from({ length: TEST_CHAMBER.most }, (_, i) => _tcOpt(i + 1, i + 1, E.n === i + 1)).join("") + "</select></div>" +
        '<div class="tc-row"><button class="go" data-act="enemy">ADD ENEMIES</button><button class="warn" data-act="clear">CLEAR ENEMIES</button><span class="tc-say" data-say="enemy"></span></div>' +
        "<h3>ENERGY CARDS</h3><p>" + TEST_CHAMBER.stock + " of every element are in your stock: put them in a follower's slots on the roster, as any card.</p>" +
        '<div class="tc-row"><button class="go" data-act="energy">FILL THE STOCK AGAIN</button><span class="tc-say" data-say="energy"></span></div>';
}
function _tcRead(row) { const o = {}; row.querySelectorAll("[data-k]").forEach(el => { o[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value; }); return o; }
function _tcSay(k, text) { const el = _tcEls && _tcEls.panel.querySelector('[data-say="' + k + '"]'); if (el) el.textContent = text; }
// what the panel shows of what is asked: each place's form by name, an unevolved one's controls that mean nothing greyed, the enemy's classes its species has, your class lit, the enemies alive
function _tcSync() {
    if (!_tcEls) return; const P = _tcEls.panel;
    P.querySelectorAll("[data-squad]").forEach(row => {
        const s = _tcRead(row), real = _tcElementOk(s.element), form = s.evolved && real ? testChamberForm(s.element, s.role) : null, ev = row.querySelector('[data-k="evolved"]'), cards = row.querySelector('[data-k="cards"]');
        ev.disabled = !real; if (!real) ev.checked = false; cards.disabled = !(ev.checked && real);
        row.querySelector(".tc-form").textContent = s.element === "" ? "" : form ? form.name : real && s.evolved ? "NO FORM" : "UNEVOLVED";
    });
    const er = P.querySelector("[data-enemy]"); if (er) { const sp = er.querySelector('[data-k="species"]').value, c = er.querySelector('[data-k="cls"]'), was = c.value || TEST_CHAMBER.enemy.cls, list = testChamberClasses(sp); c.innerHTML = list.map(k => _tcOpt(k, k, k === was)).join(""); }
    P.querySelectorAll("[data-class]").forEach(b => b.classList.toggle("on", typeof playerClassKey !== "undefined" && b.dataset.class === playerClassKey));
    _tcSay("enemy", "IN THE ROOM: " + testChamberEnemies().length + " OF " + TEST_CHAMBER.cap);
}
function _tcClick(ev) {
    const t = ev.target && ev.target.closest ? ev.target.closest("button") : null; if (!t || !_tcEls) return; const P = _tcEls.panel;
    if (t.dataset.step) { const inp = t.parentNode.querySelector('[data-k="level"]'); inp.value = _tcLevel(Number(inp.value) + Number(t.dataset.step), 1); }
    else if (t.dataset.class) testChamberClass(t.dataset.class);
    else if (t.dataset.act === "close") return testChamberPanel(false);
    else if (t.dataset.act === "squad") { const list = []; P.querySelectorAll("[data-squad]").forEach(row => { const s = _tcRead(row); list.push({ element: s.element, role: s.role, evolved: !!s.evolved, level: _tcLevel(s.level, testChamberFollowerLevel()), cards: Number(s.cards) }); }); const made = testChamberSquadSet(list); _tcSay("squad", made.length + " MADE: " + made.map(f => (f.evolved && typeof EVOLUTIONS !== "undefined" && EVOLUTIONS[f.evolved] ? EVOLUTIONS[f.evolved].name : "UNEVOLVED") + " LV " + f.level).join(", ")); }
    else if (t.dataset.act === "enemy") { const s = _tcRead(P.querySelector("[data-enemy]")); TEST_CHAMBER.enemy = { species: s.species, cls: s.cls, element: s.element, level: _tcLevel(s.level, testChamberEnemyLevel()), n: Number(s.n) || 1 }; const made = testChamberEnemy(TEST_CHAMBER.enemy); _tcSync(); _tcSay("enemy", (made.length ? made.length + " ADDED" : "NONE ADDED (THE ROOM IS FULL)") + " · IN THE ROOM: " + testChamberEnemies().length + " OF " + TEST_CHAMBER.cap); return; }
    else if (t.dataset.act === "clear") { const n = testChamberClear(); _tcSync(); _tcSay("enemy", n + " CLEARED"); return; }
    else if (t.dataset.act === "energy") _tcSay("energy", testChamberEnergy() + " ELEMENTS FILLED TO " + TEST_CHAMBER.stock);
    _tcSync();
}
// the chip and the panel, made once, as this file loads (the page's body is there: the scripts are at its end); nothing without the flag
function testChamberChip() {
    if (!testChamberOn() || _tcEls || typeof document === "undefined" || !document.createElement || !document.body) return false;
    const st = document.createElement("style"); st.id = "testChamberStyle"; st.textContent = _TC_CSS; (document.head || document.body).appendChild(st);
    const chip = document.createElement("button"); chip.id = "testChamberChip"; chip.textContent = "TEST CHAMBER";
    const panel = document.createElement("div"); panel.id = "testChamberPanel";
    _tcEls = { chip, panel };
    chip.addEventListener("click", ev => { ev.stopPropagation(); testChamberPanel(!panel.classList.contains("open")); });
    panel.addEventListener("click", ev => { ev.stopPropagation(); _tcClick(ev); });
    panel.addEventListener("change", ev => { ev.stopPropagation(); _tcSync(); });
    for (const k of ["pointerdown", "pointerup", "pointermove", "touchstart", "touchend", "touchmove", "mousedown", "mouseup", "wheel", "keydown", "keyup"]) { panel.addEventListener(k, ev => ev.stopPropagation()); chip.addEventListener(k, ev => ev.stopPropagation()); }   // (a touch on the panel is not a tap on the floor under it)
    document.body.appendChild(chip); document.body.appendChild(panel);
    return true;
}
function testChamberPanel(open) {
    if (!_tcEls) return false; const P = _tcEls.panel;
    if (open) { P.innerHTML = _tcHtml(); P.classList.add("open"); _tcSync(); } else P.classList.remove("open");
    return P.classList.contains("open");
}
try { testChamberChip(); } catch (e) { /* no page (the test sandbox) */ }
