// ─────────────────────────────────────────────────────────
//  THE SQUAD OF THREE, AND THE ROOMS THE REST HOLD (the facility; the classic game is as it was)
// ─────────────────────────────────────────────────────────
// ASKED: "you can only have three followers in your squad, and those three followers will show up their little roster little clip out [...] where we had the ammo or the armed information. That'll layout across the top of the
// little slider that has the different tools [...] whenever they're in a room, they can have the follower hold that position and the followers will patrol that room until they are called upon again. each follower in your roster
// will show what room it's holding and a new follower will not follow you unless you have room in your squad."
//   THE SQUAD      PARTY.max (three) followers FOLLOW the player. A follower is in the squad when it is yours, alive, on the line (not the work crew) and has no post. The squad bar (below) is their three small roster cards.
//   A POST         f.post = a room's id. A posted follower stays in its room: it walks a slow round of the room's floor, resting at each stop, and fights what is in the room (js/npc.js); it does not follow you, does not come through a
//                  doorway after you, and does not count against the squad, so the squad has room for someone new. HOLD (the battle tool, the roster's stance) posts each unit it is given in the room THAT UNIT is in; COME (or FOLLOW
//                  ME in the roster) calls them back: each leaves its post and joins the squad if it has room (the rest stay posted: SQUAD FULL).
//   A NEW FOLLOWER one that is found, recruited, made again or back from the dead joins the squad if there is room; if there is none it is posted where it is (the Crystal Chamber for a recruit, the pad's room for an egg): it does not follow.
//   THE ROSTER     each follower's card says what room it holds (js/commandcenter.js, js/status.js).
const PARTY = { max: 3, patrol: 0.55, rest: [70, 200], hop: [2.5, 9], engage: 9 };   // patrol: how fast it walks the round, a share of its speed; rest: frames it stands at a stop; hop: how far the next stop is (tiles); engage: how far from its room's edge a creature is still its business
function partyOn() { return typeof facilityPlay !== "undefined" && !!facilityPlay && !(typeof attractOn === "function" && attractOn()); }

// ── rooms ──
function partyRoomAt(x, y) { const r = typeof _fp !== "undefined" && _fp && _fp.F ? facilityRoomAt(x, y, _fp.F) : null; return r ? r.id : null; }
// the room a follower is in: the one it stands in, else the one of the nearest floor cell, else the Crystal's
function partyRoomOf(f) {
    let id = partyRoomAt(f.x, f.y);
    if (!id && typeof _fp !== "undefined" && _fp && _fp.cellsP) { const c = _fpNearestCell(f.x, f.y); if (c) id = partyRoomAt(c[0], c[1]); }
    return id || (typeof crystal !== "undefined" && crystal ? partyRoomAt(crystal.x, crystal.y) : null);
}
function partyRoomName(id) { return typeof facilityRoomName === "function" ? facilityRoomName(id) : String(id || "").replace(/_/g, " "); }
// the floor cells of a room (the planning copy's: clear of the walls), made once
function partyRoomCells(id) {
    if (typeof _fp === "undefined" || !_fp || !_fp.cellsP) return [];
    if (!_fp.roomCells) { _fp.roomCells = new Map(); for (const c of _fp.cellsP.values()) { const rid = partyRoomAt(c[0], c[1]); if (!rid) continue; if (!_fp.roomCells.has(rid)) _fp.roomCells.set(rid, []); _fp.roomCells.get(rid).push(c); } }
    return _fp.roomCells.get(id) || [];
}

// ── who is in the squad ──
function partyIsMember(f) { return !!f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !f.post && f.duty !== "worker" && !f.returningToCrystal; }
function partyMembers() { return typeof followers === "undefined" ? [] : followers.filter(partyIsMember); }
function partyPosted() { return typeof followers === "undefined" ? [] : followers.filter(f => f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !!f.post); }
function partyFull(except) { return partyMembers().filter(m => m !== except).length >= PARTY.max; }
function _partySay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: 100, vy: -0.25, size: 12 }); }

// Every member has a slot (0 to max - 1) that it keeps while it is in the squad, so the three cards on the squad bar do not shuffle. A member that finds no free slot (the squad is full: it is new, or the squad was made over-full some other way)
// is posted where it stands. `say`: tell the player about each one posted that way.
function partySync(say) {
    if (!partyOn()) return;
    const mem = partyMembers(), used = new Set();
    if (typeof followers !== "undefined") for (const f of followers) if (f && f.partySlot !== undefined && !partyIsMember(f)) f.partySlot = undefined;
    for (const f of mem) { if (Number.isInteger(f.partySlot) && f.partySlot >= 0 && f.partySlot < PARTY.max && !used.has(f.partySlot)) used.add(f.partySlot); else f.partySlot = undefined; }
    for (const f of mem) {
        if (f.partySlot !== undefined) continue;
        let k = 0; while (used.has(k)) k++;
        if (k < PARTY.max) { f.partySlot = k; used.add(k); continue; }
        const room = partyRoomOf(f); if (room) { partyPost(f, room, true); if (say) _partySay("SQUAD FULL · HOLDING THE " + partyRoomName(room).toUpperCase(), "#ffe733"); }
    }
}
// the squad in card order
function partyOrdered() { partySync(false); return partyMembers().filter(f => f.partySlot !== undefined).sort((a, b) => a.partySlot - b.partySlot); }

// A follower has just become one of yours (spawned, found, loaded, made again, back from the dead, back on the line): the squad takes it if it has room, else it is posted where it is.
function partyAdmit(f) { if (partyOn() && f) partySync(true); }

// ── posts ──
// `quiet`: no message (the caller says it)
function partyPost(f, room, quiet) {
    if (!f || f.dead || f.isClone || !f.isFollower) return false;
    room = room || partyRoomOf(f); if (!room) return false;
    f.post = room; f.stance = "hold"; f.job = null; f.attackOrder = null; f._patrol = null; f._nearestEnemy = null; f._enemyCacheFrame = 0; f.partySlot = undefined; f._fpPath = null;
    if (!quiet) _partySay("HOLDING · " + partyRoomName(room).toUpperCase(), "#8fe3ff");
    return true;
}
// back to the squad, if it has room (it stays posted when it has none)
function partyCall(f, quiet) {
    if (!f || f.dead || f.isClone) return false;
    if (!f.post) return true;
    if (partyFull(f)) { if (!quiet) _partySay("SQUAD FULL · " + PARTY.max + " OF " + PARTY.max, "#ff8a6a"); return false; }
    f.post = null; f.stance = "follow"; f.job = null; f._patrol = null; f._fpPath = null; f._nearestEnemy = null; f._enemyCacheFrame = 0; partySync(false);
    return true;
}
// HOLD and FOLLOW ME for the facility (js/commandcenter.js ccApplyStance): HOLD posts each follower in the room it is in, FOLLOW calls it back to the squad. A clone has no post: it holds where it stands, as ever. Returns how many it did it for.
function partyApplyStance(units, stance) {
    let n = 0, refused = 0; const rooms = new Set(), clones = [];
    for (const a of units) {
        if (!a || a.dead) continue;
        if (a.isClone || !a.isFollower) { clones.push(a); continue; }
        if (stance === "hold") { if (a.duty === "worker") continue; const room = partyRoomOf(a); if (partyPost(a, room, true)) { n++; rooms.add(room); } }
        else if (stance === "follow") { if (partyCall(a, true)) n++; else refused++; }
    }
    if (clones.length) n += _ccApplyStanceUnits(clones, stance);
    if (stance === "hold" && rooms.size) _partySay("HOLD · " + (n > 1 ? n + " · " : "") + (rooms.size === 1 ? partyRoomName([...rooms][0]).toUpperCase() : rooms.size + " ROOMS"), "#8fe3ff");
    else if (stance === "follow") { if (refused) _partySay("SQUAD FULL · " + PARTY.max + " OF " + PARTY.max + (n ? " · " + n + " CALLED" : ""), "#ff8a6a"); else if (n) _partySay("COME · " + n + " IN THE SQUAD", "#19e6c1"); }
    if (typeof partyBarRender === "function") partyBarRender(true);   // (the cards follow the order at once, not at the next tick)
    return n;
}

// a game that was left comes back: each follower that held a room is put in it (the rest were put beside the player)
function partyPlacePosted() {
    for (const f of partyPosted()) { const cells = partyRoomCells(f.post); if (!cells.length) continue; const c = cells[Math.floor(Math.random() * cells.length)]; f.x = c[0]; f.y = c[1]; f._patrol = null; f._fpPath = null; }
}

// ── the round of a posted follower (js/npc.js calls it when there is nothing in the room to fight) ──
function partyPickStop(a) {
    const cells = partyRoomCells(a.post); if (!cells.length) return null;
    const near = cells.filter(c => { const d = Math.hypot(c[0] - a.x, c[1] - a.y); return d >= PARTY.hop[0] && d <= PARTY.hop[1]; }), pool = near.length ? near : cells, c = pool[Math.floor(Math.random() * pool.length)];
    return { x: c[0], y: c[1], wait: 0, age: 0 };
}
function partyPatrol(a) {
    if (!a.post) return;
    const here = partyRoomAt(a.x, a.y);
    if (here !== a.post) {   // not in its room (it was put somewhere else, pushed out, or has come back from the dead): back to it, round the walls
        const cells = partyRoomCells(a.post); if (!cells.length) return;
        if (!a._patrol || a._patrol.back !== true) { let best = null, bd = 1e9; for (const c of cells) { const d = (c[0] - a.x) ** 2 + (c[1] - a.y) ** 2; if (d < bd) { bd = d; best = c; } } a._patrol = { x: best[0], y: best[1], wait: 0, age: 0, back: true }; }
        const dx = a._patrol.x - a.x, dy = a._patrol.y - a.y, d = Math.hypot(dx, dy); if (d > 0.3) _walkStep(a, dx, dy, d); else a._patrol = null;
        return;
    }
    let p = a._patrol;
    if (p && p.back) p = a._patrol = null;
    if (p && p.wait > 0) { if (--p.wait <= 0) a._patrol = null; return; }   // resting at a stop; then on to the next
    if (!p) p = a._patrol = partyPickStop(a);
    if (!p) return;
    const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
    if (d < 0.45 || ++p.age > 900) { p.wait = PARTY.rest[0] + Math.floor(Math.random() * (PARTY.rest[1] - PARTY.rest[0])); return; }
    _walkStep(a, dx, dy, d, PARTY.patrol);
}

// ── THE SQUAD BAR: the three, as small roster cards over the dock, where the ammunition chip was ──
// One card for each slot, kept (updated in place: a tap is never lost to a redraw): the unit's picture, its name, `LV 9 · FOLLOWING`, its health. TAP a card to select that follower (the rings under it, WHO says SEL 1, and the enemy card's strip says
// SELECTED 1: "depending on what followers you have selected"); the i is its INFO; an open slot opens the roster, to call a follower back from its room or to recruit.
// The same three cards are the SQUAD BOX at the top of the Command Center's roster (js/commandcenter.js): the squad at a glance, without a trip to another menu. partySlotsBuild / partySlotsUpdate draw either.
let _sbEls = null, _sbxEls = null;
function partyBarEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("squadBar") : null; }
function partyBoxEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("ccSquadBox") : null; }
// three slot cards in `root`, built once (they are updated in place afterwards); `onClick` takes a tap on any of them
function partySlotsBuild(root, onClick) {
    root.textContent = ""; const slots = [];
    for (let i = 0; i < PARTY.max; i++) {
        const el = document.createElement("div"); el.className = "sb-slot empty"; el.setAttribute("data-slot", String(i));
        el.innerHTML = '<canvas class="sb-thumb" width="52" height="52"></canvas><span class="sb-txt"><b class="sb-name"></b><i class="sb-sub"></i><span class="sb-hp"><u></u></span></span><button class="sb-info" aria-label="Info">i</button><span class="sb-open">+ OPEN SLOT</span>';
        root.appendChild(el); slots.push(el);
    }
    root.addEventListener("click", onClick);
    return { root, slots };
}
function partyBarBuild(root) { if (!_sbEls || _sbEls.root !== root) _sbEls = partySlotsBuild(root, partyBarClick); return _sbEls; }
function _partyTapped(ev) {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return null;
    const slot = t.closest(".sb-slot"); if (!slot) return null;
    return { f: slot._unit, info: !!t.closest(".sb-info") };
}
function partyBarClick(ev) {
    const hit = _partyTapped(ev); if (!hit) return;
    const f = hit.f;
    if (hit.info) { if (f && typeof unitInfoOpen === "function") unitInfoOpen(f); return; }
    if (!f) { if (typeof ccOpen === "function") ccOpen("roster"); return; }   // an open slot: the roster
    if (typeof ccToggle === "function") ccToggle(f);
    partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true);
}
function _sbSet(el, prop, v) { if (el[prop] !== v) el[prop] = v; }
// each slot shows the follower in that card slot of the squad (partySlot), or is open
function partySlotsUpdate(E) {
    const mem = partyOrdered();
    for (let i = 0; i < PARTY.max; i++) {
        const el = E.slots[i], f = mem.find(m => m.partySlot === i) || null;
        if (el._unit !== f) { el._unit = f; el.classList.toggle("empty", !f); el._thumbKey = null; }
        if (!f) continue;
        const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, col = def ? def.color : "#19e6c1", st = typeof unitStatus === "function" ? unitStatus(f) : null;
        if (el._col !== col) { el._col = col; if (el.style && typeof el.style.setProperty === "function") el.style.setProperty("--c", col); }
        el.classList.toggle("sel", typeof selectedUnits !== "undefined" && selectedUnits.has(f));
        const name = typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER", sub = "LV " + (f.level || 1) + (st ? " · " + st.text : "");
        const nm = el.querySelector(".sb-name"), sb = el.querySelector(".sb-sub"), hp = el.querySelector(".sb-hp u");
        _sbSet(nm, "textContent", name); _sbSet(sb, "textContent", sub); if (st) sb.style.color = st.col;
        const frac = Math.max(0, Math.min(1, (f.health || 0) / (f.maxHealth || 1))), w = Math.round(frac * 100) + "%", cls = frac > 0.5 ? "" : frac > 0.25 ? "mid" : "low";
        if (hp.style.width !== w) hp.style.width = w; if (hp.className !== cls) hp.className = cls;
        const key = f.evolved + "|" + f.element; if (el._thumbKey !== key && typeof _ccThumb === "function") { el._thumbKey = key; el._thumbDone = false; _ccThumb(el.querySelector(".sb-thumb"), f); }
        if (!el._thumbDone && f.evolved && typeof EVOLUTIONS !== "undefined" && typeof _ccThumb === "function") { const d = EVOLUTIONS[f.evolved]; if (d && d._img && d._img.complete) { el._thumbDone = true; _ccThumb(el.querySelector(".sb-thumb"), f); } }   // (an evolved form's picture may still have been loading)
    }
}
function partyBarRender(force) {
    const root = partyBarEl(); if (!root) return;
    const on = partyOn(); if (root.classList) root.classList.toggle("on", on);
    if (typeof document !== "undefined" && document.body && document.body.classList) document.body.classList.toggle("squad-bar", on);   // (a phone moves the battle tool up for it: game.html)
    if (!on) return;
    partySlotsUpdate(partyBarBuild(root));
}
// THE SQUAD BOX (the Command Center's roster, the facility): a tap on a card selects that follower (the side panel then offers REMOVE FROM SQUAD); the i is its INFO; an open slot says how to fill it, and does nothing
function partyBoxClick(ev) {
    const hit = _partyTapped(ev); if (!hit || !hit.f) return;
    if (hit.info) { if (typeof unitInfoOpen === "function") unitInfoOpen(hit.f); return; }
    if (typeof ccToggle === "function") ccToggle(hit.f);
    if (typeof ccRender === "function") ccRender();
}
function partyBoxRender() {
    const root = partyBoxEl(); if (!root || !partyOn()) return;
    if (!_sbxEls || _sbxEls.root !== root) _sbxEls = partySlotsBuild(root, partyBoxClick);
    partySlotsUpdate(_sbxEls);
}
// each few frames (js/game.js render): the squad is kept to three, and its bar follows it
function partyTick() { partySync(false); partyBarRender(false); }

// ── ADD, REMOVE, SWAP, DISBAND: the squad's buttons (the Command Center's side panel and SQUADS window, js/commandcenter.js; the phone's roster, js/radialmenu.js) ──
// ASKED: "when you click the creature on the roster, it should show on the side add to party or add to squad [...] And here you can disband them." A follower is in the squad or it holds a room: ADD calls the followers that hold a room back into the
// squad while it has room, REMOVE posts them in the rooms they are in, SWAP does both at once (the card keeps its slot), DISBAND removes the whole squad. Each says what it did, and the bars follow at once.
function _partyFollower(f) { return !!f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green"; }
function partyAdd(units) {
    const list = (units || []).filter(f => _partyFollower(f) && !partyIsMember(f)); if (!list.length) return 0;
    let n = 0, refused = 0; for (const f of list) { if (partyCall(f, true)) n++; else refused++; }
    if (n) _partySay("ADDED TO THE SQUAD · " + partyMembers().length + " OF " + PARTY.max, "#19e6c1");
    if (refused) _partySay("SQUAD FULL · " + PARTY.max + " OF " + PARTY.max, "#ff8a6a");
    partyBarRender(true); return n;
}
function partyRemove(units) {
    const list = (units || []).filter(partyIsMember); let n = 0; const rooms = new Set();
    for (const f of list) { const room = partyRoomOf(f); if (partyPost(f, room, true)) { n++; rooms.add(room); } }
    if (n) _partySay("REMOVED FROM THE SQUAD · " + (rooms.size === 1 ? "HOLDING THE " + partyRoomName([...rooms][0]).toUpperCase() : n + " HOLD THEIR ROOMS"), "#8fe3ff");
    partyBarRender(true); return n;
}
// `out` is in the squad and goes to hold the room it is in; `inn` holds a room and takes its card
function partySwap(out, inn) {
    if (!partyIsMember(out) || !_partyFollower(inn) || partyIsMember(inn)) return false;
    if (!partyPost(out, partyRoomOf(out), true)) return false;
    if (!partyCall(inn, true)) { out.post = null; out.stance = "follow"; out._patrol = null; partySync(false); return false; }   // (cannot happen: a slot has just been freed)
    _partySay("SWAPPED IN · " + (typeof unitTypeLabel === "function" ? unitTypeLabel(inn) : "FOLLOWER"), "#19e6c1"); partyBarRender(true); return true;
}
function partyDisband() {
    const mem = partyMembers(); if (!mem.length) return 0;
    let n = 0; const rooms = new Set(); for (const f of mem) { const room = partyRoomOf(f); if (partyPost(f, room, true)) { n++; rooms.add(room); } }
    _partySay("SQUAD DISBANDED · " + n + " HOLD " + (rooms.size === 1 ? "THE " + partyRoomName([...rooms][0]).toUpperCase() : rooms.size + " ROOMS"), "#ffe733");
    partyBarRender(true); return n;
}
