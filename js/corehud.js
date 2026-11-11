// ─────────────────────────────────────────────────────────
//  THE CORE — your cube, tucked into the bottom-right corner (the corners layout: a tablet or a desktop)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-11, circling the shards, the bars and the surge bar (top left), GUARD and STUN (the round buttons by the dial) and the PACK button: "Find a way to combine these 3 elements
// into a player model 3d emotive/reactive interactive for showing player damage/ shard count / player class interact abilities", then "Make it tucked down at the bottom, right"; of the drafts
// (design/ui-mocks/core): "I like the drafts you created for the HUD player. Information interactive menu." (docs/UI-STYLE.md, "The HUD", THE CORE; built in build 2026-11-11t)
//   THE CUBE    the game's own cube, baked at the HUD's angle (design/hud/bake-core.js: img/hud/core_<look>.png, js/coreframes.js), plain or in its class's gear (js/playergear.js playerGear), its lid
//               shut, peeking or open. It bobs, and leans, jolts, trembles or topples as you fare. Its SCREEN IS A FACE, drawn here (the faces below).
//   GUARD, STUN two hex emblems held out on two of its cables. A tap is the old round buttons' (js/playercombat.js playerGuardToggle, playerDiveArm). GUARD on: raised beside its face, a dome round
//               it. STUN armed: lit and crackling, PICK A TARGET; resting: dark, its rest swept round, the seconds.
//   THE LID     the PACK: a tap opens it (js/inventory.js invToggle), as does the tag PACK n (the kinds carried); open while the pack is.
//   THE ARC     gold, behind it: ARMY SURGE (js/helpers.js playerUltimate), filled from the left over the top, its words over it (ULTIMATE n%, NO SQUAD IN RANGE, SIPHON OFF, TAP — ARMY SURGE,
//               SURGE n S). Full, a tap on the cube fires it (fireArmySurge). The siphon ⌁ at its end (toggleSiphon).
//   THE SLAB    under it: your three bars (all green; yellow at two; red at one, as the old bar) and your shards (the count with the gold crystals, js/hudgems.js; a gain pops +n).
// THE FACES (the agent's, provisional): calm (it looks toward the fight, blinks), HIT (a bar lost: > <, a red flash, a jolt), LAST BAR (red angry eyes, a cracked screen, sparks, smoke),
// A BAR BACK (^ ^, a green ring), SHARDS IN (^ ^, they fly into the lid, a hop), SURGE READY (gold diamonds), SURGING (gold stars), GUARD (a set look), STUN ARMED (lightning eyes, leaning in),
// PACK OPEN (it looks up at its lid), KNOCKED OUT (X eyes, it topples, REBOOT), a tap on its face (it smiles). Nothing here changes a rule of play: every tap is what the old buttons did.
// The old parts stay in the page, hidden while THE CORE is on (body.core-on: game.html), so a phone keeps them; the dial stands above it (js/targeting.js) and the dock is narrower.
// Build 2026-11-11u, the owner's playtest: "When I click on the new menu, it moves the character across the map, and the buttons feel a little too small, and it's the new little box should include the ammo and
// the equipped item with it". Two pads take a tap (never the map's: js/input.js listens on the game's canvas, under it): all of its box but the empty strip at its left above the pills, where the dialogue's
// box may reach (js/dialogue.js); GUARD, STUN, the PACK tag and the siphon are bigger, and the surge's words take a tap
// as its face does; THE PILL ROW (the ammunition with the weapon in hand, the serum, the potion, the kits, POISONED: js/targeting.js) is in its box, over the slab. While the ring is up (a long press) it dims
// and lets taps through to the ring.
// Build 2026-11-11v, THE CREATURE'S SLAB: the round dial (the locked creature; a tap shoots it) folded into it. Of three drafts (design/ui-mocks/core-target) the owner circled the slab and drew it down
// under the cube, then: "This should be in a fixed position. It shouldn't move up whenever the predator lock on pill button shows up." So its box is 356 tall for good, the cube in the raised place, and
// while a creature is locked its slab stands under the cube, over the pills and your slab: its picture in a round socket, its name and level, its health, INFO, the trigger. A tap on it shoots (holding
// keeps firing, as the dial did: js/targeting.js targetFireHold), the cube looks down at it, and each shot runs from the cube into it.
const CORE_HUD = { hit: 40, heal: 70, shards: 70, ko: 150, boop: 36, lid: 16, lidOpen: 10, blinkEvery: 250, blinkFor: 8, bob: 2.5,   // (frames and pixels: the agent's, provisional)
    emblem: 1.3, stunDown: 12, pills: [10, 285],   // GUARD and STUN 1.3 times the baked size, STUN 12 px lower (clear of GUARD's word); the pill row's left end and middle in its 340 x 356 box (game.html)
    foe: { x0: 34, y: 236, r: 22 }, shot: 9,       // the creature's slab: its left edge and middle in the box, half its height (game.html .core-foe); a shot's beam lasts this many frames
    strip: 56, padTop: 210,                        // the pads: the box but the strip this wide at its left, down to the pill row's top (its buttons start 62 px in)
    cols: { none: "#19e6c1", gunslinger: "#ffb347", technomancer: "#31e8ff", mutator: "#c06bff" } };
let _core = null, _coreWas = null;
// what only the drawing keeps (a step with no picture fills none of it: tests/ghost.js IGNORE): its canvas and pen, the pixel ratio, the face's picture and which face it shows, the emblems' and the
// dome's pictures, the crackle round STUN, and the face being chosen (_corePick)
const _coreDrawn = { cv: null, g: null, dpr: 1, faceCv: null, fg: null, faceKey: "", emb: {}, dome: null, crackleAt: -1, crackle: null,
    F: { eye: "dash", col: "#00ff88", lx: 0, ly: 0, flash: null, glitch: false, crack: false, static: false, text: null, phase: 0 } };
const _coreS = { foe: null, shot: false, hp: 3, mx: 3, shards: 0, ult: 0, ready: false, surging: false, surgeS: 0, siphon: true, stalled: false, guard: false, armed: false, rest: 0, restS: 0, pack: false, packN: 0, look: "plain", cls: "none", fight: false };
function coreOn() { return typeof hudCorners === "function" && hudCorners() && typeof CORE_FRAMES !== "undefined"; }
// the top of THE CORE on the screen (CSS pixels), or null when it is not shown (js/targeting.js: the dial stands above it)
function coreTop() { return _core && _coreWas && _core.topY > 0 ? _core.topY : null; }
// a knockout (js/game.js): it topples, then reboots
function coreKnocked() { if (_core) _coreReact("ko"); }
// THE PILL ROW's place in its box (js/targeting.js _tgAmmoIcon draws it there, on the game's canvas under it): its left end, its middle and how far right it may run (screen pixels); false while THE CORE is
// hidden (a panel, the roster: the pills hide with it); null when it is not shown at all (a phone: the pills stay by the dial)
function corePills() { if (!_core || !_coreWas || !(_core.pills.x > 0)) return null; return _core.topY > 0 ? _core.pills : false; }
// THE CREATURE'S SLAB on the screen (js/targeting.js: no dial while THE CORE is on; the INFO card opens to its left): its left edge, its middle and half its height; false while THE CORE is hidden;
// null when it is not shown at all (a phone: the dial)
function coreFoe() { const Q = corePills(); return Q ? _core.foeAt : Q; }

function _coreEl(tag, cls, text, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
function _coreBuild() {
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    const root = _coreEl("div", "", null, document.body); root.id = "coreHud";
    const cv = _coreEl("canvas", "core-cv", null, root), slab = _coreEl("div", "core-slab", null, root), cells = _coreEl("div", "core-cells", null, slab);
    const cellEls = [0, 1, 2].map(() => _coreEl("i", "", null, cells)), count = _coreEl("div", "core-count", null, slab), gem = _coreEl("span", "core-gem", null, count);
    if (typeof SHARD_ICON_SVG === "string") gem.innerHTML = SHARD_ICON_SVG.replace('id="shardGemsSvg"', "");
    const num = _coreEl("b", "", "0", count), plus = _coreEl("em", "", "", count);
    const hit = (cls, label, fn) => { const b = _coreEl("button", "core-hit " + cls, null, root); b.type = "button"; b.setAttribute("aria-label", label); b.addEventListener("click", e => { e.stopPropagation(); fn(); }); return b; };
    const els = { cells: cellEls, num, plus,
        hitGuard: hit("core-hg", "GUARD", () => { if (typeof playerGuardToggle === "function") playerGuardToggle(); }),
        hitStun: hit("core-hs", "STUN", () => { if (typeof playerDiveArm === "function") playerDiveArm(); }),
        hitLid: hit("core-hl", "PACK", _corePackTap),
        hitFace: hit("core-hf", "ARMY SURGE", _coreSurgeTap),
        lg: _coreEl("div", "core-lbl", "GUARD", root), ls: _coreEl("div", "core-lbl", "STUN", root),
        pack: hit("core-pack", "PACK", _corePackTap), surge: hit("core-surge", "ARMY SURGE", _coreSurgeTap),
        siphon: hit("core-siphon", "SIPHON", () => { if (typeof toggleSiphon === "function") toggleSiphon(); }) };
    _coreEl("span", "", "PACK", els.pack); els.packN = _coreEl("b", "", "0", els.pack); els.siphon.textContent = "⌁";
    const padA = _coreEl("div", "core-pad core-pad-a", null, root), padB = _coreEl("div", "core-pad core-pad-b", null, root); padA.style.left = CORE_HUD.strip + "px"; padB.style.top = CORE_HUD.padTop + "px";
    // the creature's slab: a press on it is the trigger's (a tap shoots, holding keeps firing; the finger's lift lets go wherever it is: the press is held by it), and its INFO
    const foe = _coreEl("button", "core-hit core-foe", null, root); foe.type = "button"; foe.setAttribute("aria-label", "FIRE");
    _coreEl("span", "core-foe-slab", null, foe); const sock = _coreEl("span", "core-foe-sock", null, foe), pic = _coreEl("img", "", null, sock); pic.alt = "";
    const frow = _coreEl("span", "core-foe-row", null, foe), fname = _coreEl("b", "", "", frow), flv = _coreEl("i", "", "", frow), fhp = _coreEl("span", "core-foe-hp", null, foe), fbar = _coreEl("i", "", null, fhp);
    _coreEl("span", "core-foe-trig", null, foe).innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="8"/><path d="M20 3v10M20 27v10M3 20h10M27 20h10"/></svg>';
    const fdmg = _coreEl("em", "core-foe-dmg", "", foe), finfo = hit("core-foe-info", "INFO", () => { if (typeof infoOpen !== "undefined") infoOpen = !infoOpen; }); finfo.textContent = "i";
    if (foe.addEventListener) {
        foe.addEventListener("pointerdown", e => { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); try { foe.setPointerCapture(e.pointerId); } catch (x) {} if (typeof targetFireHold === "function") targetFireHold(); });
        const up = e => { e.stopPropagation(); if (typeof gunRelease === "function") gunRelease(); }; foe.addEventListener("pointerup", up); foe.addEventListener("pointercancel", up);
        foe.addEventListener("click", e => e.stopPropagation());
    }
    Object.assign(els, { foe, pic, fname, flv, fbar, fdmg, finfo });
    if (root.addEventListener) root.addEventListener("click", _corePillTap);   // (a tap on a pad: its buttons' taps stop at them)
    _coreDrawn.cv = cv; _coreDrawn.g = cv.getContext ? cv.getContext("2d") : null;
    _core = { root, els, look: null, art: null, img: null, imgs: {}, stunP: null, pills: { x: 0, y: 0, maxX: 0 }, foeAt: { x0: 0, y: 0, r: CORE_HUD.foe.r }, bodyCls: null, foeId: null, foeHp: -1, dmg: 0, dmgAt: -1e9, foeTxt: {},
        hp: -1, shards: -1, topY: 0, packAt: 0, quiet: 0, lostAt: -1e9, gainAt: -1e9, react: null, reactAt: 0, plusN: 0, plusAt: -1e9, lost: 0, gain: 0, blinkAt: 0, txt: {}, place: "" };
}
// a tap on its face or on the surge's words: ARMY SURGE when it is full (js/helpers.js fireArmySurge), else it smiles
function _coreSurgeTap() { if (typeof playerUltimateReady === "function" && playerUltimateReady() && typeof fireArmySurge === "function") fireArmySurge(); else _coreReact("boop"); }
// a tap on it that is not one of its buttons (the slab, the cube's sides, the arc, the space round them: its pads) is never the map's. The pill row is drawn under it, on the game's canvas (js/targeting.js), so a tap
// on a pill is asked of the pills here, as js/input.js asks them on the canvas: the serum, the potion, the kit, and the ammunition while the gun is armed (a tap puts it away)
function _corePillTap(e) {
    if (!e || (typeof gameState !== "undefined" && gameState && !gameState.running)) return;
    const p = typeof toCanvas === "function" ? toCanvas(e.clientX, e.clientY) : [e.clientX, e.clientY], x = p[0], y = p[1];
    if (typeof serumChipTap === "function" && serumChipTap(x, y)) return;
    if (typeof potionChipTap === "function" && potionChipTap(x, y)) return;
    if (typeof kitChipTap === "function" && kitChipTap(x, y)) return;
    const A = typeof _ATKCHIP !== "undefined" ? _ATKCHIP : null;
    if (A && A.w > 0 && typeof playerAttackMode !== "undefined" && playerAttackMode && x >= A.x && x <= A.x + A.w && y >= A.y && y <= A.y + A.h) {
        if (typeof targetStand === "function") targetStand();   // (the gun stays put away while creatures are about: js/targeting.js)
        if (typeof setPlayerAttackMode === "function") setPlayerAttackMode(false);
    }
}
// a tap on the lid or the tag: the lid flips open, then the pack (js/inventory.js invToggle) a moment later, so the open lid is seen before the pack covers the screen
function _corePackTap() { if (!_core) { if (typeof invToggle === "function") invToggle(); return; } if (_core.packAt) return; _coreReact("lid"); _core.packAt = (typeof frame !== "undefined" ? frame : 0) + CORE_HUD.lidOpen; }
function _coreReact(kind) {
    if (!_core) return; const f = typeof frame !== "undefined" ? frame : 0, cur = _core.react;
    if (cur === "ko" && kind !== "ko" && f - _core.reactAt < CORE_HUD.ko) return;   // (a knockout plays out)
    _core.react = kind; _core.reactAt = f;
}
function _coreSet(el, k, v) { if (el && el[k] !== v) el[k] = v; }
function _coreCls(el, v) { if (el && el.className !== v) el.className = v; }
// the game's state, read once a step into _coreS (no allocation)
function _coreRead(S) {
    const mx = typeof PLAYER_HITS === "number" ? PLAYER_HITS : 3;
    S.mx = mx; S.hp = typeof health === "number" ? Math.max(0, Math.min(mx, Math.round(health))) : mx; S.shards = typeof shardCount === "number" ? shardCount : 0;
    const um = typeof PLAYER_ULT_MAX === "number" ? PLAYER_ULT_MAX : 100; S.ult = typeof playerUltimate === "number" ? Math.max(0, Math.min(1, playerUltimate / um)) : 0;
    S.surging = typeof armySurgeTimer === "number" && armySurgeTimer > 0; S.surgeS = S.surging ? Math.ceil(armySurgeTimer / 60) : 0;
    S.ready = !S.surging && typeof playerUltimateReady === "function" && playerUltimateReady();
    S.siphon = typeof siphonEnabled === "undefined" || !!siphonEnabled; S.stalled = S.siphon && typeof _siphonInRange === "number" && _siphonInRange === 0;
    S.guard = typeof playerGuardOn !== "undefined" && !!playerGuardOn; S.armed = typeof playerDiveArmed !== "undefined" && !!playerDiveArmed;
    const f = typeof frame !== "undefined" ? frame : 0, left = typeof _pcDiveReady === "number" ? Math.max(0, _pcDiveReady - f) : 0, D = typeof PLAYER_COMBAT !== "undefined" ? PLAYER_COMBAT.dive : null;
    S.rest = left > 0 && !(typeof _pcDive !== "undefined" && _pcDive) && D ? Math.min(1, left / (D.frames + D.rest)) : 0; S.restS = Math.ceil(left / 60);
    S.pack = typeof invPanelOpen !== "undefined" && !!invPanelOpen;
    let n = 0; if (typeof playerInv !== "undefined" && playerInv) for (const id in playerInv) if (playerInv[id] > 0) n++; S.packN = n;
    const gear = typeof playerGear === "function" ? playerGear() : null; S.look = gear && typeof CORE_FRAMES !== "undefined" && CORE_FRAMES.variants[gear] ? gear : "plain";
    S.cls = typeof playerClassKey !== "undefined" && playerClassKey && CORE_HUD.cols[playerClassKey] ? playerClassKey : "none";
    S.fight = typeof battleViewOn === "function" && battleViewOn();
    S.foe = typeof targetOn === "function" && targetOn() && typeof targetCurrent === "function" ? targetCurrent() : null;   // (the creature the gun is locked on: its slab)
    S.shot = !!S.foe && typeof player !== "undefined" && player && player.gunShotAt !== undefined && f - player.gunShotAt >= 0 && f - player.gunShotAt < CORE_HUD.shot;
    return S;
}
// each step (js/game.js render, with the HUD's other parts): the state, the reactions, the page's words; the drawing on a step with a picture
function coreTick() {
    const on = coreOn();
    const turned = on !== _coreWas;
    if (turned) { _coreWas = on; if (typeof document !== "undefined" && document.body && document.body.classList) document.body.classList.toggle("core-on", on); }
    if (!on) return;
    if (!_core) _coreBuild(); if (!_core) return;
    const S = _coreRead(_coreS), f = typeof frame !== "undefined" ? frame : 0, E = _core.els;
    if (turned) _core.quiet = f + 45;   // (it has just come on: a save's shards arriving, a new game; no reaction to them)
    if (f < _core.quiet) { _core.hp = S.hp; _core.shards = S.shards; }
    // what happened: a bar lost or back (a knockout is told by js/game.js: coreKnocked), shards in
    if (_core.hp >= 0 && S.hp !== _core.hp) {
        if (S.hp < _core.hp) { _core.lost = _core.hp; _core.lostAt = f; _coreReact("hit"); }
        else if (_core.react !== "ko") { _core.gain = S.hp; _core.gainAt = f; _coreReact("heal"); }
    }
    if (_core.shards >= 0 && S.shards > _core.shards) { _core.plusN = (f - _core.plusAt < CORE_HUD.shards ? _core.plusN : 0) + (S.shards - _core.shards); _core.plusAt = f; if (!_core.react || _core.react === "boop") _coreReact("shards"); }
    _core.hp = S.hp; _core.shards = S.shards;
    if (_core.packAt && f >= _core.packAt) { _core.packAt = 0; if (typeof invToggle === "function") invToggle(); }
    const R = _core.react, rt = f - _core.reactAt, len = R ? CORE_HUD[R] || 40 : 0;
    if (R && rt >= len) _core.react = null;
    if (_core.lost && f - _core.lostAt >= CORE_HUD.hit) _core.lost = 0; if (_core.gain && f - _core.gainAt >= CORE_HUD.heal) _core.gain = 0;   // (a bar's mark lasts its own time, whatever reaction comes next)
    // the page's words (written only when they change)
    if (_core.look !== S.look || !_core.art) _coreLook(S.look);
    const col = CORE_HUD.cols[S.cls];
    if (_core.txt.col !== col) { _core.txt.col = col; if (_core.root.style.setProperty) _core.root.style.setProperty("--c", col); }
    for (let i = 0; i < 3; i++) { const n = i + 1; _coreCls(E.cells[i], (n <= S.hp ? (S.hp >= S.mx ? "g" : S.hp === S.mx - 1 ? "y" : "r") : "") + (_core.lost === n ? " lost" : "") + (_core.gain === n ? " gain" : "")); }
    const shardTxt = String(S.shards).replace(/\B(?=(\d{3})+(?!\d))/g, ","); _coreSet(E.num, "textContent", shardTxt);
    const plusOn = f - _core.plusAt < CORE_HUD.shards; _coreSet(E.plus, "textContent", plusOn ? "+" + _core.plusN : "");
    _coreSet(E.packN, "textContent", String(S.packN)); _coreCls(E.pack, "core-hit core-pack" + (S.pack ? " open" : ""));
    const surgeTxt = S.surging ? "SURGE " + S.surgeS + " S" : S.ready ? "TAP — ARMY SURGE" : !S.siphon ? "SIPHON OFF · " + Math.round(S.ult * 100) + "%" : S.stalled ? "NO SQUAD IN RANGE · " + Math.round(S.ult * 100) + "%" : "ULTIMATE " + Math.round(S.ult * 100) + "%";
    _coreSet(E.surge, "textContent", surgeTxt); _coreCls(E.surge, "core-hit core-surge" + (S.ready ? " ready" : S.surging ? " surging" : ""));
    _coreCls(E.siphon, "core-hit core-siphon" + (S.siphon ? "" : " off"));
    _coreSet(E.lg, "textContent", S.guard ? "GUARD ON" : "GUARD"); _coreCls(E.lg, "core-lbl" + (S.guard ? " on" : ""));
    _coreSet(E.ls, "textContent", S.rest > 0 ? S.restS + " S" : S.armed ? "PICK A TARGET" : "STUN"); _coreCls(E.ls, "core-lbl core-lst" + (S.armed ? " on" : S.rest > 0 ? " rest" : ""));
    _coreFoeTick(S, f);
    const ring = typeof commandMode !== "undefined" && !!commandMode;   // (the ring is up: it dims and lets taps through to it, game.html)
    const state = (S.hp <= 1 ? " low" : "") + (S.ready ? " ready" : "") + (S.surging ? " surging" : "") + (_core.react === "ko" ? " ko" : "") + (ring ? " ring" : "") + (S.foe ? " foe" : "") + (S.shot ? " shot" : "");
    if (_core.txt.state !== state) { _core.txt.state = state; _core.root.className = state.trim(); }
    _corePlace(S);
    // where it is on the screen, for the dial above it and the pill row in it: read twice a second, not every frame, and at once when the page's classes change (a panel opening hides it)
    const bc = typeof document !== "undefined" && document.body ? document.body.className : "";
    if (f % 30 === 0 || !(_core.topY > 0) || bc !== _core.bodyCls) { _core.bodyCls = bc;
        const r = _core.root.getBoundingClientRect ? _core.root.getBoundingClientRect() : null; _core.topY = r && r.height > 0 ? r.top : 0;
        if (_core.topY > 0) { const Q = _core.pills; Q.x = r.left + CORE_HUD.pills[0]; Q.y = r.top + CORE_HUD.pills[1]; Q.maxX = r.left + r.width - 4; _core.foeAt.x0 = r.left + CORE_HUD.foe.x0; _core.foeAt.y = r.top + CORE_HUD.foe.y; } }
    if (typeof _simGhost !== "undefined" && _simGhost) return;   // (a step with no picture: nothing is drawn)
    if (_core.react || S.armed || S.hp <= 1 || S.ready || S.surging || S.shot || f % 2 === 0) _coreDraw(S, f);
}
// THE CREATURE'S SLAB, each step: shown while one is locked; its name, level, colour and picture when the creature changes; its health; the damage a shot did (the number, a moment)
function _coreFoeTick(S, f) {
    const E = _core.els, a = S.foe; if (!E.foe) return;
    if (!a) { _core.foeId = null; _core.foeHp = -1; return; }
    if (_core.foeId !== a) {
        _core.foeId = a; _core.foeHp = a.health; _core.dmgAt = -1e9;
        const info = typeof targetCardInfo === "function" ? targetCardInfo(a) : null, url = typeof targetPortraitURL === "function" ? targetPortraitURL(a) : "";
        _coreSet(E.fname, "textContent", info ? info.title : String(a.speciesName || "").toUpperCase()); _coreSet(E.flv, "textContent", info && info.level !== null ? "LV " + info.level : "");
        if (E.foe.style.setProperty) E.foe.style.setProperty("--fc", info ? info.col : "#ff8a6a"); if (url && E.pic.src !== url) E.pic.src = url;
    }
    if (a.health < _core.foeHp) { _core.dmg = (f - _core.dmgAt < 40 ? _core.dmg : 0) + Math.round(_core.foeHp - a.health); _core.dmgAt = f; }
    _core.foeHp = a.health;
    const k = Math.max(0, Math.min(1, Math.max(0, a.health) / Math.max(1, a.maxHealth || a.health || 1))), w = Math.round(k * 1000) / 10 + "%";
    if (_core.foeTxt.w !== w) { _core.foeTxt.w = w; E.fbar.style.width = w; _coreCls(E.fbar, k > 0.5 ? "" : k > 0.25 ? "y" : "r"); }
    _coreSet(E.fdmg, "textContent", f - _core.dmgAt < 40 && _core.dmg > 0 ? String(_core.dmg) : "");
}
// the look (the plain cube or the class's gear): its sheet and points
function _coreLook(look) {
    const V = CORE_FRAMES.variants[look] || CORE_FRAMES.variants.plain; _core.look = look; _core.art = V; _core.place = ""; _coreDrawn.emb = {}; _coreDrawn.dome = null;
    const F0 = V.frames[0]; _core.stunP = [F0.stun[0], F0.stun[1] + CORE_HUD.stunDown];   // (STUN, a little lower than baked: clear of GUARD's word now they are bigger)
    if (!_core.imgs[look] && typeof Image === "function") { const im = new Image(); im.decoding = "async"; im.src = typeof imgSrc === "function" ? imgSrc(V.sheet) : V.sheet; _core.imgs[look] = im; }
    _core.img = _core.imgs[look] || null;
}
// the buttons and words round it, from its points (once per look, and when GUARD goes up or down)
function _corePlace(S) {
    const P = _core.art.frames[0], key = _core.look + (S.guard ? "|g" : ""); if (_core.place === key) return; _core.place = key;
    const E = _core.els, r = P.emblemR * CORE_HUD.emblem, St = _core.stunP, put = (el, x, y, w, h) => { el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px"; if (w) { el.style.width = Math.round(w) + "px"; el.style.height = Math.round(h) + "px"; } };
    const G = S.guard ? P.guardUp : P.guard, gs = S.guard ? 1.25 : 1;
    put(E.hitGuard, G[0] - r * gs - 10, G[1] - r * gs - 10, 2 * r * gs + 20, 2 * r * gs + 20); put(E.hitStun, St[0] - r - 10, St[1] - r - 10, 2 * r + 20, 2 * r + 20);
    put(E.lg, G[0], S.guard ? G[1] - r * gs - 24 : G[1] + r + 5); put(E.ls, St[0], St[1] + r + 5);
    const q = P.face, x0 = Math.min(q[0][0], q[2][0]), x1 = q[1][0], y0 = Math.min(q[0][1], q[1][1]), y1 = q[2][1];
    put(E.hitFace, x0 - 6, y0 - 4, x1 - x0 + 12, y1 - y0 + 12); put(E.hitLid, x0 - 6, P.lid[1] - 34, x1 - x0 + 18, Math.max(30, y0 - (P.lid[1] - 34) - 4));
    put(E.pack, q[1][0] - 14, P.top[1] - 38); put(E.surge, P.arcC[0], P.arcC[1] - P.arcR - 8);
    const a = P.arcFrom - P.arcSpan, sz = 40; put(E.siphon, P.arcC[0] + Math.cos(a) * P.arcR - sz / 2, P.arcC[1] - Math.sin(a) * P.arcR - sz / 2, sz, sz);
}

// ── THE DRAWING ──
function _coreSize() {
    const D = _coreDrawn, dpr = Math.min(2, (typeof devicePixelRatio === "number" && devicePixelRatio) || 1), W = CORE_FRAMES.box[0], H = CORE_FRAMES.box[1];
    if (D.dpr !== dpr || D.cv.width !== Math.round(W * dpr)) { D.dpr = dpr; D.cv.width = Math.round(W * dpr); D.cv.height = Math.round(H * dpr); D.emb = {}; D.dome = null; }
}
// THE FACE: a picture of the screen (512 x 320), drawn again only when it changes, then laid on the screen's corners
function _coreEye(g, kind, x, y, side, col) {
    g.fillStyle = col; g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round";
    const rr = (x0, y0, w, h, r) => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r); g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath(); g.fill(); };
    switch (kind) {
        case "dash": rr(x - 58, y - 15, 116, 30, 14); break;
        case "blink": rr(x - 58, y - 4, 116, 8, 4); break;
        case "happy": g.lineWidth = 24; g.beginPath(); g.moveTo(x - 50, y + 20); g.lineTo(x, y - 22); g.lineTo(x + 50, y + 20); g.stroke(); break;
        case "squeeze": g.lineWidth = 22; g.beginPath(); if (side < 0) { g.moveTo(x - 40, y - 30); g.lineTo(x + 34, y); g.lineTo(x - 40, y + 30); } else { g.moveTo(x + 40, y - 30); g.lineTo(x - 34, y); g.lineTo(x + 40, y + 30); } g.stroke(); break;
        case "angry": g.save(); g.translate(x, y); g.rotate(-side * 0.38); rr(-56, -14, 112, 28, 12); g.restore(); break;
        case "set": rr(x - 54, y - 6, 108, 22, 10); g.lineWidth = 14; g.beginPath(); g.moveTo(x - side * 56, y - 40); g.lineTo(x + side * 50, y - 20); g.stroke(); break;
        case "diamond": g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x + 34, y); g.lineTo(x, y + 40); g.lineTo(x - 34, y); g.closePath(); g.fill(); break;
        case "star": g.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, r = i % 2 ? 13 : 46; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); break;
        case "bolt": g.lineWidth = 15; g.beginPath(); g.moveTo(x - 58, y - 10); g.lineTo(x - 18, y + 14); g.lineTo(x + 14, y - 14); g.lineTo(x + 58, y + 10); g.stroke(); break;
        case "x": g.lineWidth = 20; g.beginPath(); g.moveTo(x - 32, y - 32); g.lineTo(x + 32, y + 32); g.moveTo(x + 32, y - 32); g.lineTo(x - 32, y + 32); g.stroke(); break;
        case "up": g.lineWidth = 16; g.beginPath(); g.arc(x, y, 28, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, y - 6, 9, 0, Math.PI * 2); g.fill(); break;
    }
}
function _coreFace(F) {
    const D = _coreDrawn; if (!D.faceCv) { D.faceCv = document.createElement("canvas"); D.faceCv.width = 512; D.faceCv.height = 320; D.fg = D.faceCv.getContext("2d"); }
    const g = D.fg, w = 512, h = 320; g.clearRect(0, 0, w, h);
    if (F.flash) { g.fillStyle = F.flash; g.fillRect(0, 0, w, h); }
    if (F.static) { let k = 5 + F.phase; for (let i = 0; i < 700; i++) { k = (k * 9301 + 49297) % 233280; g.fillStyle = "rgba(200,210,230," + (0.08 + (k % 5) * 0.03) + ")"; g.fillRect(k % w, (k * 7) % h, 3, 2); } }
    g.globalAlpha = 0.1; g.fillStyle = F.col; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2); g.globalAlpha = 1;
    for (const side of [-1, 1]) { const x = w / 2 + side * 120 + F.lx * 46 + (F.glitch && side > 0 ? 18 : 0), y = h * 0.5 + F.ly * 34;   // (its glow is soft copies, larger and fainter, under it: no shadowBlur, which the game never uses)
        for (const [s, a] of [[1.45, 0.12], [1.22, 0.22], [1, 1]]) { g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s); _coreEye(g, F.eye, 0, 0, side, F.col); g.restore(); } }
    if (F.glitch) { g.globalAlpha = 0.55; g.drawImage(D.faceCv, 0, 120, w, 40, 26, 120, w, 40); g.drawImage(D.faceCv, 0, 200, w, 22, -22, 200, w, 22); g.globalAlpha = 1; }
    if (F.crack) { g.save(); g.beginPath(); g.moveTo(30, 18); g.lineTo(150, 110); g.lineTo(196, 96); g.lineTo(290, 190); g.lineTo(350, 182); g.lineTo(490, 306);
        g.moveTo(196, 96); g.lineTo(226, 30); g.moveTo(290, 190); g.lineTo(262, 290); g.moveTo(150, 110); g.lineTo(96, 170);
        g.strokeStyle = "rgba(235,245,255,0.25)"; g.lineWidth = 10; g.stroke(); g.strokeStyle = "rgba(235,245,255,0.92)"; g.lineWidth = 4; g.stroke(); g.restore(); }
    if (F.text) { g.save(); g.font = "italic 900 44px sans-serif"; g.textAlign = "center"; g.globalAlpha = 0.3; g.lineWidth = 10; g.strokeStyle = F.col; g.strokeText(F.text, w / 2, h - 34); g.globalAlpha = 1; g.fillStyle = F.col; g.fillText(F.text, w / 2, h - 34); g.restore(); }
}
// which face, from the reaction (first) and the state (in this order): knocked out, hit, surging, surge ready, stun armed, guard, last bar, a bar back, shards in, a tap, pack open, calm
function _corePick(S, f) {
    const F = _coreDrawn.F, R = _core.react, rt = f - _core.reactAt;
    F.eye = "dash"; F.col = "#00ff88"; F.lx = S.fight ? -0.6 : Math.sin(f * 0.011) * 0.35; F.ly = 0.05; F.flash = null; F.glitch = false; F.crack = false; F.static = false; F.text = null; F.phase = 0;
    if (R === "ko") { F.eye = "x"; F.col = "#ff6a6a"; F.static = true; F.phase = (f >> 2) & 7; F.lx = 0; if (rt > CORE_HUD.ko * 0.5) F.text = "REBOOT"; }
    else if (R === "hit") { F.eye = "squeeze"; F.col = "#ff4b4b"; F.flash = "rgba(255,40,40," + (0.32 * (1 - rt / CORE_HUD.hit)).toFixed(2) + ")"; F.glitch = rt < 18; F.lx = 0; }
    else if (S.surging) { F.eye = "star"; F.col = "#fff3a0"; F.flash = "rgba(255,214,60,0.22)"; F.lx = 0; }
    else if (S.ready) { F.eye = "diamond"; F.col = "#ffe733"; F.lx = 0; }
    else if (S.armed) { F.eye = "bolt"; F.col = "#ffe14d"; F.lx = -0.7; }
    else if (S.guard) { F.eye = "set"; F.col = "#7dffa8"; F.lx = -0.5; }
    else if (S.hp <= 1) { F.eye = "angry"; F.col = "#ff2a2a"; F.crack = true; }
    else if (R === "heal") { F.eye = "happy"; F.col = "#7dffa8"; F.lx = 0; }
    else if (R === "shards" || R === "boop") { F.eye = "happy"; F.lx = R === "shards" ? -0.45 : 0; F.ly = R === "shards" ? -0.35 : 0; }
    else if (S.pack || R === "lid") { F.eye = "up"; F.lx = 0; F.ly = -0.85; }
    else if (S.foe) { F.lx = 0; F.ly = 0.8; if (S.shot) { F.eye = "set"; F.flash = "rgba(255,240,200,0.16)"; } }   // (the creature's slab under it: it looks down at it, and sets its look to shoot)
    if (F.eye === "dash" && f % CORE_HUD.blinkEvery < CORE_HUD.blinkFor) F.eye = "blink";
    return F;
}
// an emblem (GUARD or STUN) drawn once into its own picture for each of its looks
function _coreEmblem(kind, mode, r) {
    const key = kind + mode, D = _coreDrawn; if (D.emb[key]) return D.emb[key];
    const d = D.dpr, pad = 14, S = Math.ceil((r + pad) * 2 * d), c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"); g.scale(d, d); g.translate(r + pad, r + pad);
    const col = mode === "rest" ? "#5d6475" : kind === "guard" ? (mode === "lit" ? "#b6ffd0" : "#7dffa8") : (mode === "lit" ? "#fff3a0" : "#ffe14d");
    if (mode === "lit") { const gr = g.createRadialGradient(0, 0, r * 0.4, 0, 0, r + pad); gr.addColorStop(0, kind === "guard" ? "rgba(125,255,168,0.45)" : "rgba(255,225,77,0.5)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r + pad, 0, Math.PI * 2); g.fill(); }
    const hex = rad => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.closePath(); };
    hex(r); const body = g.createLinearGradient(0, -r, 0, r); body.addColorStop(0, "#1b2236"); body.addColorStop(1, "#070a12"); g.fillStyle = body; g.fill();
    g.lineWidth = 3.2; g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.beginPath();
    if (kind === "guard") { const s = r * 0.62; g.moveTo(0, -0.95 * s); g.lineTo(0.78 * s, -0.62 * s); g.lineTo(0.68 * s, 0.25 * s); g.lineTo(0, 1.0 * s); g.lineTo(-0.68 * s, 0.25 * s); g.lineTo(-0.78 * s, -0.62 * s); }
    else { const s = r * 0.66; g.moveTo(0.22 * s, -1.0 * s); g.lineTo(-0.52 * s, 0.08 * s); g.lineTo(-0.06 * s, 0.08 * s); g.lineTo(-0.24 * s, 1.0 * s); g.lineTo(0.52 * s, -0.1 * s); g.lineTo(0.06 * s, -0.1 * s); }
    g.closePath(); g.fill();
    return (D.emb[key] = { c, half: r + pad });
}
// the guard's dome: a ring of hexes, once
function _coreDome(R) {
    const D = _coreDrawn; if (D.dome) return D.dome;
    const d = D.dpr, S = Math.ceil((R + 6) * 2 * d), c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"); g.scale(d, d); g.translate(R + 6, R + 6);
    const gr = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R); gr.addColorStop(0, "rgba(125,255,168,0)"); gr.addColorStop(1, "rgba(125,255,168,0.22)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.clip(); g.strokeStyle = "rgba(160,255,190,0.35)"; g.lineWidth = 1.2; const s = R / 4;
    for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) { const x = col * s * 1.5, y = row * s * Math.sqrt(3) + (col & 1 ? s * Math.sqrt(3) / 2 : 0); g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(x + Math.cos(a) * s * 0.92, y + Math.sin(a) * s * 0.92); } g.closePath(); g.stroke(); }
    g.restore(); g.strokeStyle = "rgba(160,255,190,0.7)"; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R - 1, 0, Math.PI * 2); g.stroke();
    return (D.dome = { c, half: R + 6 });
}
function _coreDraw(S, f) {
    const DR = _coreDrawn, g = DR.g; if (!g) return; _coreSize();
    const d = DR.dpr, A = _core.art, R = _core.react, rt = f - _core.reactAt, W = CORE_FRAMES.box[0], H = CORE_FRAMES.box[1];
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, DR.cv.width, DR.cv.height); g.setTransform(d, 0, 0, d, 0, 0);
    const fi = S.pack || (R === "lid" && rt >= 4) ? 2 : R === "lid" || (R === "shards" && rt < CORE_HUD.shards * 0.6) ? 1 : 0, P = A.frames[fi], P0 = A.frames[0], C = P.centre;
    // the body's lean, jolt, tremble, hop and topple (about its centre), and its bob
    let rot = 0, dx = 0, dy = Math.sin(f * 0.05) * CORE_HUD.bob;
    if (R === "hit") { const k = 1 - rt / CORE_HUD.hit; rot += 0.12 * k; dx -= 8 * k; }
    if (S.hp <= 1 && R !== "ko") { rot += 0.05 + Math.sin(f * 0.9) * 0.012; dx += Math.sin(f * 1.7) * 1.2; }
    if (S.armed) { rot -= 0.06; dx -= 4; }
    if (R === "shards") dy -= 9 * Math.sin(Math.PI * Math.min(1, rt / 20));
    if (R === "ko") { const k = Math.min(1, rt / 18), back = rt > CORE_HUD.ko * 0.7 ? Math.min(1, (rt - CORE_HUD.ko * 0.7) / 24) : 0, m = k * (1 - back); rot += 0.95 * m; dy += 34 * m; dx += 12 * m; }
    // glows behind: gold (surge), red (the last bar)
    const glow = (col, r, a) => { const gr = g.createRadialGradient(C[0], C[1], 8, C[0], C[1], r); gr.addColorStop(0, col.replace("A", a)); gr.addColorStop(1, col.replace("A", 0)); g.fillStyle = gr; g.fillRect(C[0] - r, C[1] - r, r * 2, r * 2); };
    if (S.surging) glow("rgba(255,200,60,A)", 130, 0.45); else if (S.ready) glow("rgba(255,200,60,A)", 115, 0.22 + 0.08 * Math.sin(f * 0.15));
    if (S.hp <= 1 && R !== "ko") glow("rgba(255,40,30,A)", 110, 0.22 + 0.1 * Math.sin(f * 0.2));
    // ARMY SURGE's arc (behind the cube)
    const ac = P0.arcC, ar = P0.arcR, a0 = -P0.arcFrom, span = P0.arcSpan, wide = S.ready || S.surging;
    g.lineCap = "round"; g.lineWidth = 7; g.strokeStyle = "rgba(26,29,41,0.92)"; g.beginPath(); g.arc(ac[0], ac[1], ar, a0, a0 + span); g.stroke();
    const fill = S.surging ? Math.max(0.02, (typeof armySurgeTimer === "number" && typeof ARMY_SURGE_FRAMES === "number" ? armySurgeTimer / ARMY_SURGE_FRAMES : 1)) : S.ult;
    if (fill > 0.005) {
        g.lineWidth = wide ? 22 : 16; g.strokeStyle = wide ? "rgba(255,157,0,0.3)" : "rgba(255,157,0,0.13)"; g.beginPath(); g.arc(ac[0], ac[1], ar, a0, a0 + span * fill); g.stroke();
        g.lineWidth = wide ? 10 : 7; g.strokeStyle = S.surging ? "#ffe680" : "#ffb800"; g.beginPath(); g.arc(ac[0], ac[1], ar, a0, a0 + span * fill); g.stroke();
    }
    if (S.ready) { g.strokeStyle = "#ffe98a"; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = a0 + span * ((i * 0.137 + f * 0.004) % 1), r0 = ar + 6 + ((f + i * 13) % 20) * 0.6; g.beginPath(); g.moveTo(ac[0] + Math.cos(a) * r0, ac[1] + Math.sin(a) * r0); g.lineTo(ac[0] + Math.cos(a) * (r0 + 6), ac[1] + Math.sin(a) * (r0 + 6)); g.stroke(); } }
    // the cables to GUARD and STUN (from its left flank, behind the cube)
    const r = P0.emblemR * CORE_HUD.emblem, St = _core.stunP, Gp = S.guard ? P0.guardUp : P0.guard, cable = (s, e, sag) => { g.beginPath(); g.moveTo(s[0] + dx, s[1] + dy); g.quadraticCurveTo((s[0] + e[0]) / 2 - 6, (s[1] + e[1]) / 2 + sag, e[0], e[1]); g.lineWidth = 6; g.strokeStyle = "#040506"; g.stroke(); g.lineWidth = 1.4; g.strokeStyle = "rgba(120,140,170,0.35)"; g.stroke(); };
    cable(P0.guardSock, [Gp[0] + r * 0.6, Gp[1] + r * 0.3], S.guard ? 4 : 20); cable(P0.stunSock, [St[0] + r * 0.6, St[1]], 14);
    // a shot: it runs from under the cube down into the creature's slab (the slab is over this canvas: the beam goes in under its edge)
    if (S.shot) { const x = P.bottom[0] + dx, y0 = P.bottom[1] + dy - 6, y1 = CORE_HUD.foe.y - 8, k = Math.max(0, 1 - (f - player.gunShotAt) / CORE_HUD.shot);
        g.lineCap = "round"; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.lineWidth = 11; g.strokeStyle = "rgba(255,170,90," + (0.4 * k).toFixed(2) + ")"; g.stroke(); g.lineWidth = 3; g.strokeStyle = "rgba(255,243,200," + k.toFixed(2) + ")"; g.stroke(); }
    // the cube, then its face on its screen
    g.save(); g.translate(C[0] + dx, C[1] + dy); g.rotate(rot); g.translate(-C[0], -C[1]);
    const im = _core.img; if (im && im.complete && im.naturalWidth) g.drawImage(im, fi * A.cw, 0, A.cw, A.ch, A.ox / CORE_FRAMES.dpr, A.oy / CORE_FRAMES.dpr, A.cw / CORE_FRAMES.dpr, A.ch / CORE_FRAMES.dpr);
    const F = _corePick(S, f), fk = F.eye + F.col + F.lx.toFixed(2) + F.ly + (F.flash || "") + F.glitch + F.crack + F.static + F.phase + (F.text || "");
    if (fk !== DR.faceKey) { DR.faceKey = fk; _coreFace(F); }
    const q = P.face; g.save(); g.transform((q[1][0] - q[0][0]) / 512, (q[1][1] - q[0][1]) / 512, (q[2][0] - q[0][0]) / 320, (q[2][1] - q[0][1]) / 320, q[0][0], q[0][1]); g.drawImage(DR.faceCv, 0, 0); g.restore();
    g.restore();
    // GUARD and STUN
    const em = (kind, mode, p, s) => { const E = _coreEmblem(kind, mode, r), h = E.half * s; g.drawImage(E.c, p[0] - h, p[1] - h, h * 2, h * 2); };
    em("guard", S.guard ? "lit" : "", Gp, S.guard ? 1.25 : 1);
    em("stun", S.rest > 0 ? "rest" : S.armed ? "lit" : "", St, S.armed ? 1.12 : 1);
    if (S.rest > 0) { g.fillStyle = "rgba(0,0,0,0.6)"; g.beginPath(); g.moveTo(St[0], St[1]); g.arc(St[0], St[1], r * 0.96, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.rest); g.closePath(); g.fill(); }
    if (S.armed) { if (f - DR.crackleAt >= 4) { DR.crackleAt = f; DR.crackle = []; let k = f * 7 + 3; const rnd = () => (k = (k * 9301 + 49297) % 233280) / 233280; for (let n = 0; n < 6; n++) { const a = rnd() * Math.PI * 2, pts = []; let x = St[0] + Math.cos(a) * r * 1.05, y = St[1] + Math.sin(a) * r * 1.05; for (let i = 0; i < 4; i++) { pts.push(x, y); x += Math.cos(a) * 6 + (rnd() - 0.5) * 9; y += Math.sin(a) * 6 + (rnd() - 0.5) * 9; } DR.crackle.push(pts); } }
        g.strokeStyle = "#fff7b0"; g.lineWidth = 1.6; for (const p of DR.crackle) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); } }
    // what happens round it: shards into the lid, a green ring, sparks and smoke, the guard's dome
    if (R === "shards") { const t = rt / CORE_HUD.shards, sx = 18, sy = C[1] - 10, ex = P.lid[0], ey = P.lid[1] + 6, mx = (sx + ex) / 2 - 10, my = Math.min(sy, ey) - 60;
        for (let i = 0; i < 5; i++) { const k = t * 1.6 - i * 0.12; if (k <= 0 || k >= 1) continue; const u = 1 - k, x = u * u * sx + 2 * u * k * mx + k * k * ex, y = u * u * sy + 2 * u * k * my + k * k * ey, s = 5 + (i % 2) * 2;
            g.save(); g.translate(x, y); g.rotate(f * 0.15 + i); g.fillStyle = "#ffd23a"; g.beginPath(); g.moveTo(0, -s * 1.5); g.lineTo(s, 0); g.lineTo(0, s * 1.5); g.lineTo(-s, 0); g.closePath(); g.fill(); g.fillStyle = "rgba(255,248,200,0.8)"; g.beginPath(); g.moveTo(0, -s * 1.5); g.lineTo(s * 0.4, -s * 0.2); g.lineTo(-s * 0.3, 0); g.closePath(); g.fill(); g.restore(); } }
    if (R === "heal") { const t = rt / CORE_HUD.heal; g.strokeStyle = "rgba(125,255,168," + (0.8 * (1 - t)).toFixed(2) + ")"; g.lineWidth = 3; g.beginPath(); g.ellipse(C[0], C[1] + 30 - 60 * t, 70 + 20 * t, 18 + 5 * t, 0, 0, Math.PI * 2); g.stroke(); }
    if ((S.hp <= 1 || R === "hit") && R !== "ko") { const v = P.vent; g.strokeStyle = "#fff0a0"; g.lineWidth = 1.6; let k = (f >> 1) * 13 + 7; const rnd = () => (k = (k * 9301 + 49297) % 233280) / 233280;
        for (let i = 0; i < (S.hp <= 1 ? 6 : 4); i++) { const a = rnd() * Math.PI * 2, r0 = 6 + rnd() * 12; g.beginPath(); g.moveTo(v[0] + dx + Math.cos(a) * r0, v[1] + dy + Math.sin(a) * r0); g.lineTo(v[0] + dx + Math.cos(a) * (r0 + 7), v[1] + dy + Math.sin(a) * (r0 + 7)); g.stroke(); }
        if (S.hp <= 1) for (let i = 0; i < 4; i++) { const t = ((f * 0.012 + i * 0.25) % 1); g.fillStyle = "rgba(91,96,112," + (0.42 * (1 - t)).toFixed(2) + ")"; g.beginPath(); g.arc(v[0] + dx + 6 + t * 26, v[1] + dy - 6 - t * 40, 6 + t * 12, 0, Math.PI * 2); g.fill(); } }
    if (S.guard) { const D = _coreDome(Math.round(Math.max(W, H) * 0.3)), h = D.half; g.globalAlpha = 0.85; g.drawImage(D.c, C[0] - h, C[1] - h, h * 2, h * 2); g.globalAlpha = 1; }
}
