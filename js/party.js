// ─────────────────────────────────────────────────────────
//  THE SQUAD OF THREE, AND THE ROOMS THE REST HOLD
// ─────────────────────────────────────────────────────────
// ASKED: "you can only have three followers in your squad, and those three followers will show up their little roster little clip out [...] where we had the ammo or the armed information. That'll layout across the top of the
// little slider that has the different tools [...] whenever they're in a room, they can have the follower hold that position and the followers will patrol that room until they are called upon again. each follower in your roster
// will show what room it's holding and a new follower will not follow you unless you have room in your squad."
//   THE SQUAD      PARTY.max (three) followers FOLLOW the player. A follower is in the squad when it is yours, alive and has no post. The squad bar (below) is their three small roster cards.
//   A POST         f.post = a room's id. A posted follower stays in its room: it walks a slow round of the room's floor, resting at each stop, and fights what is in the room (js/npc.js); it does not follow you, does not come through a
//                  doorway after you, and does not count against the squad, so the squad has room for someone new. HOLD (the battle tool, the roster's stance) posts each unit it is given in the room THAT UNIT is in; COME (or FOLLOW
//                  ME in the roster) calls them back: each leaves its post and joins the squad if it has room (the rest stay posted: SQUAD FULL).
//   A NEW FOLLOWER one that is found, recruited, made again or back from the dead joins the squad if there is room; if there is none it is posted where it is (the Crystal Chamber for a recruit, the pad's room for an egg): it does not follow.
//   THE ROSTER     each follower's card says what room it holds (js/commandcenter.js, js/status.js).
const PARTY = { max: 3, patrol: 0.55, rest: [70, 200], hop: [2.5, 9], engage: 9, exileArm: 4000 };   // exileArm: ms an EXILE button stays armed for its second tap   // patrol: how fast it walks the round, a share of its speed; rest: frames it stands at a stop; hop: how far the next stop is (tiles); engage: how far from its room's edge a creature is still its business
function partyOn() { return typeof facilityPlay !== "undefined" && !!facilityPlay && !(typeof attractOn === "function" && attractOn()); }
// THE CORNERS (docs/UI-STYLE.md, "The HUD"): the facility on a tablet or a desktop has each part of the HUD that works together in one corner (game.html "THE CORNERS"; js/tutorial.js, js/targeting.js, js/squadfly.js). A phone (the line js/mixtool.js mixToolWide draws,
// 700 px) keeps the layout it has.
function hudCorners() { return partyOn() && (typeof innerWidth === "number" ? innerWidth > 700 : true); }

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

// ── ROOM CAPACITY (the Level 1 update; docs/TECHNICIANS.md "Rooms and recruitment") ──
// ASKED: "Category 1 rooms: two followers. Main Hallway Level 2: three followers. Arena Level 2: six followers. These room capacities are separate from the three active squad slots", then the Main Hallway and the Arena are "automatically
// a level 2 just because of the amount of space in these areas", and every other room is Category 1. A room's count is the followers holding it (posted), the ones on their way back from the dead included (they keep their place); the
// squad is not counted. Every way of posting a follower goes through partyPlace: the room it means if that room has a place, else the nearest room with one that it can walk to. The arena takes one more and moves its weakest out.
const PARTY_ROOM_CAP = { lab_hallway: 3, arena: 6 }, PARTY_ROOM_CAP_ELSE = 2;
function partyRoomCap(id) { return PARTY_ROOM_CAP[id] || PARTY_ROOM_CAP_ELSE; }
function partyRoomCount(id, except) {
    let n = 0; for (const f of partyPosted()) if (f.post === id && f !== except) n++;
    if (typeof respawnQueue !== "undefined") for (const e of respawnQueue) if (e && !e.isClone && e.post === id) n++;   // (one on its way back from the dead keeps its place)
    return n;
}
function partyRoomFree(id, except) { return !!id && partyRoomCount(id, except) < partyRoomCap(id); }
// the nearest room with a place that a follower at (x, y) can walk to (not one on another stretch of floor: the catwalks, the nest area, an interior it is not in); `not`: a room left out. null when every one is full.
function partyVacancy(x, y, except, not) {
    if (typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    const comp = typeof _pComp === "function" ? _pComp(x, y) : undefined; let best = null, bd = Infinity;
    for (const r of _fp.F.rooms) {
        if (r.id === not || !partyRoomFree(r.id, except)) continue;
        let d = Infinity; for (const c of partyRoomCells(r.id)) { if (comp !== undefined && _pComp(c[0], c[1]) !== comp) continue; const q = (c[0] - x) ** 2 + (c[1] - y) ** 2; if (q < d) d = q; }
        if (d < bd) { bd = d; best = r.id; }
    }
    return best;
}
// post `f` in `room` if it has a place, else in the nearest room that has one: the room it went to, or null when every room it can walk to is full. The arena takes one more and then moves its weakest out (partyArenaOverflow).
function partyPlace(f, room, quiet) {
    if (!f) return null;
    room = room || partyRoomOf(f);
    if (room && (room === "arena" || partyRoomFree(room, f))) { if (!partyPost(f, room, quiet)) return null; if (room === "arena") partyArenaOverflow(); return f.post || null; }
    const v = partyVacancy(f.x, f.y, f, room); if (!v || !partyPost(f, v, true)) return null;
    if (!quiet) _partySay("THE " + partyRoomName(room).toUpperCase() + " IS FULL · HOLDING THE " + partyRoomName(v).toUpperCase(), "#ffe733");
    return v;
}
// THE ARENA OVER ITS SIX. ASKED: "When the Arena exceeds its permitted follower population, automatically remove the weakest eligible follower according to the game's existing strength or ranking data", then "Roster order", and the one
// removed goes to a "free room, else retired": the weakest of the followers holding it by the roster's order (one not evolved before one that is, then the lowest level, then the lowest power) holds the nearest room with a place, or
// is EXILED when no room has one (it was "retired": the word is EXILE everywhere now, see EXILE below). It says so.
function partyWeakest(list) { return list.slice().sort((a, b) => ((a.evolved ? 1 : 0) - (b.evolved ? 1 : 0)) || ((a.level || 1) - (b.level || 1)) || ((a.power || 0) - (b.power || 0)))[0] || null; }
function partyArenaOverflow() {
    for (let guard = 0; guard < 12 && partyRoomCount("arena") > partyRoomCap("arena"); guard++) {
        const w = partyWeakest(partyPosted().filter(f => f.post === "arena")); if (!w) return;
        const v = partyVacancy(w.x, w.y, w, "arena"), nm = typeof unitTypeLabel === "function" ? unitTypeLabel(w) : "FOLLOWER";
        if (v && partyPost(w, v, true)) _partySay("THE ARENA IS FULL · " + nm + " MOVES TO THE " + partyRoomName(v).toUpperCase(), "#ffe733", true);
        else { partyExile(w, true); _partySay("THE ARENA IS FULL · " + nm + " IS EXILED", "#ff8a6a", true); }
    }
}
// EXILE: it leaves your roster for good (any follower, from its EXILE button in the roster, after a confirm; a follower replaced when no room has a place, after a confirm; the arena's weakest when no room has one). Not a death: no body,
// no partner's rage, no coming back, nothing back; the frame's sweep skips one marked `sacrificed` (js/game.js) and the save leaves it out. Its place, a squad slot or a room's, is free for someone new.
function partyExile(f, quiet) {
    if (!_partyFollower(f)) return false;
    if (typeof breakBond === "function") breakBond(f);
    f.post = null; f.partySlot = undefined; f.exiled = true; f.sacrificed = true; f.dead = true; if (_sfLast === f) _sfLast = null;
    if (typeof equipClear === "function") equipClear(f);   // its equip cards go back at once (js/cards.js: a card is a type you own, so this only empties the slots)
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#8aa0c8", radius: 0.7, life: 26 });   // (a puff where it stood)
    _partyDone([f]); if (!quiet) _partySay((typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER") + " IS EXILED", "#8aa0c8", true);
    partySync(false); return true;
}
// THE EXILE BUTTON (ASKED: "I need to be able to get rid of followers and exile them in room for other followers that I might find or come across"; chosen with the user: EXILE, the word everywhere, and nothing back): in the
// Command Center's side panel (the followers selected), on each of the phone roster's cards and on a squad member's card on the fly. It asks first: the first tap arms it (the button says TAP AGAIN TO EXILE), a second
// tap on the same button within PARTY.exileArm ms exiles; anything else lets it lapse. The same list armed and tapped again, so a button for one follower never exiles another.
let _pxArmed = null;   // { list, until }
function _pxNow() { return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now(); }
function partyExileArmed(list) { const A = _pxArmed; if (!A || _pxNow() > A.until || !list || list.length !== A.list.length) return false; return list.every(f => A.list.includes(f)); }
function partyExileTap(list) {
    list = (list || []).filter(_partyFollower); if (!list.length) { _pxArmed = null; return false; }
    if (!partyExileArmed(list)) { _pxArmed = { list: list.slice(), until: _pxNow() + PARTY.exileArm }; return "armed"; }
    _pxArmed = null; for (const f of list) partyExile(f, list.length > 1);
    if (list.length > 1) _partySay(list.length + " FOLLOWERS EXILED", "#8aa0c8", true);
    partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true);
    return "exiled";
}

// ── who is in the squad ──
function partyIsMember(f) { return !!f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !f.post && !f.returningToCrystal; }
function partyMembers() { return typeof followers === "undefined" ? [] : followers.filter(partyIsMember); }
function partyPosted() { return typeof followers === "undefined" ? [] : followers.filter(f => f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !!f.post); }
// the followers holding a room, the one held last first (COME calls them back in that order)
function partyHeld() { return partyPosted().sort((a, b) => (b.postAt || 0) - (a.postAt || 0)); }
function partyFull(except) { return partyMembers().filter(m => m !== except).length >= PARTY.max; }
function _partySay(text, col, big) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: big ? 150 : 100, vy: -0.25, size: big ? 16 : 12 }); }   // (big: a refusal the player must not miss)

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
        const room = partyRoomOf(f); if (!room) continue;
        const at = partyPlace(f, room, true);
        if (at) { if (say) _partySay("SQUAD FULL · HOLDING THE " + partyRoomName(at).toUpperCase(), "#ffe733"); }
        else { partyPost(f, room, true); if (say) _partySay("SQUAD FULL · EVERY ROOM IS FULL · HOLDING THE " + partyRoomName(room).toUpperCase(), "#ff8a6a"); }   // (every room it can walk to is full: rare, and said)
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
    f.post = room; f.postAt = typeof frame !== "undefined" ? frame : 0; f.stance = "hold"; f.job = null; f.attackOrder = null; f._patrol = null; f._nearestEnemy = null; f._enemyCacheFrame = 0; f.partySlot = undefined; f._fpPath = null;
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
// HOLD and COME for the facility (js/commandcenter.js ccApplyStance; the battle tool's buttons, js/mixtool.js): HOLD posts each follower in the room it is in, COME calls it back to the squad. A clone has no post: it holds where it stands, as ever.
// Returns how many it did it for.
// REPORTED: "I click hold with just one of my followers, which is fine. He starts holding that position. But then [...] I click come, it doesn't come. It still holds." COME reached only the squad (the followers holding rooms were left out of
// the pool unless they were selected), and nothing said so; now COME with nobody selected reaches them too (js/mixtool.js mixToolComePool), the one held last first, and it says who came back, or why one did not (SQUAD FULL). COME also ends an
// attack order (the enemy card's). The followers HOLD posts leave the selection (they have left the squad bar: a selection nobody can see steers the next orders; see _partyDone).
function partyApplyStance(units, stance) {
    let n = 0; const rooms = new Set(), clones = [], posted = [], called = [], kept = [], full = [], nm = f => typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER";
    for (const a of units) {
        if (!a || a.dead) continue;
        if (a.isClone || !a.isFollower) { clones.push(a); continue; }
        if (stance === "hold") { const room = partyRoomOf(a); if (!room) continue; if (room !== "arena" && !partyRoomFree(room, a)) { full.push(room); continue; } if (partyPlace(a, room, true)) { n++; rooms.add(a.post); posted.push(a); } }   // (a full room takes nobody else: the arena takes one more and moves its weakest out)
        else if (stance === "follow") {
            a.attackOrder = null; a._shieldHold = null; if (a.job && a.job.type === "move") a.job = null;   // (COME ends an attack order, and a core technician's hold behind its shield: js/techabilities.js)
            const was = !!a.post;
            if (partyCall(a, true)) { n++; if (was) called.push(a); } else kept.push(a);
        }
    }
    if (clones.length) n += _ccApplyStanceUnits(clones, stance);
    if (stance === "hold" && rooms.size) { _partyDone(posted); _partySay("HOLD · " + (n > 1 ? n + " · " : "") + (rooms.size === 1 ? partyRoomName([...rooms][0]).toUpperCase() : rooms.size + " ROOMS"), "#8fe3ff"); }
    if (stance === "hold" && full.length) _partySay("THE " + partyRoomName(full[0]).toUpperCase() + " IS FULL · " + partyRoomCap(full[0]) + " OF " + partyRoomCap(full[0]) + (full.length > 1 ? " · " + full.length + " KEEP FOLLOWING" : " · IT KEEPS FOLLOWING"), "#ff8a6a", true);
    else if (stance === "follow") {
        const who = list => list.length === 1 ? nm(list[0]) : list.length + " FOLLOWERS";
        if (kept.length) _partySay("SQUAD FULL · " + PARTY.max + " OF " + PARTY.max + " · " + who(kept) + (kept.length === 1 ? " KEEPS" : " KEEP") + " HOLDING" + (called.length ? " · " + who(called) + " CAME" : ""), "#ff8a6a", true);
        else if (called.length) _partySay("COME · " + who(called) + (called.length === 1 ? " IS" : " ARE") + " BACK IN THE SQUAD", "#19e6c1", true);
        else if (n) _partySay("COME · " + n + " IN THE SQUAD", "#19e6c1");
    }
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
let _sbEls = null, _sbxEls = null, _sfLast = null, _sfAway = false;   // _sfLast: the member whose card was tapped last (js/squadfly.js opens that one's card); _sfAway: the card was put away by a press elsewhere, the member still picked
function partyBarEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("squadBar") : null; }
function partyBoxEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("ccSquadBox") : null; }
// three slot cards in `root`, built once (they are updated in place afterwards); `onClick` takes a tap on any of them
function partySlotsBuild(root, onClick) {
    root.textContent = ""; const slots = [];
    for (let i = 0; i < PARTY.max; i++) {
        const el = document.createElement("div"); el.className = "sb-slot empty"; el.setAttribute("data-slot", String(i));
        el.innerHTML = '<canvas class="sb-thumb" width="52" height="52"></canvas><span class="sb-no"></span><span class="sb-txt"><b class="sb-name"></b><span class="sb-row"><i class="sb-sub"></i><button class="sb-x" aria-label="Remove from the squad">\u2715 REMOVE</button></span><span class="sb-hp"><u></u></span></span><button class="sb-info" aria-label="Info">i</button><button class="sb-ab" aria-label="Ability"></button><span class="sb-open">+ OPEN SLOT</span>';   // (sb-ab: a technician's ability, js/techabilities.js)
        const no = el.querySelector(".sb-no"); if (no) no.textContent = String(i + 1);   // (the number and the ✕ REMOVE are the Command Center carousel's: js/commandcenter.js; game.html hides them on the bar)
        root.appendChild(el); slots.push(el);
    }
    root.addEventListener("click", onClick);
    return { root, slots };
}
function partyBarBuild(root) { if (!_sbEls || _sbEls.root !== root) _sbEls = partySlotsBuild(root, partyBarClick); return _sbEls; }
function _partyTapped(ev) {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return null;
    const slot = t.closest(".sb-slot"); if (!slot) return null;
    return { f: slot._unit, info: !!t.closest(".sb-info"), x: !!t.closest(".sb-x"), ab: !!t.closest(".sb-ab"), call: slot._call || null };
}
function partyBarClick(ev) {
    const hit = _partyTapped(ev); if (!hit) return;
    const f = hit.f;
    if (hit.info) { if (f && typeof unitInfoOpen === "function") unitInfoOpen(f); return; }
    // A TECHNICIAN'S ABILITY (js/techabilities.js): its chip aims it (again: calls the aim off); while one is aimed, a tap on a squad card picks that follower for it
    if (f && hit.ab && typeof techChipTap === "function") { techChipTap(f); partyBarRender(true); return; }
    if (f && typeof techAimActive === "function" && techAimActive() && typeof techAimPickFollower === "function" && techAimPickFollower(f)) { partyBarRender(true); return; }
    if (!f) { if (hit.call) { partyAdd([hit.call]); if (typeof mixToolRender === "function") mixToolRender(true); } else if (typeof ccShowCandidates === "function") ccShowCandidates(); else if (typeof ccOpen === "function") ccOpen("roster"); return; }   // an open slot: the one follower that holds a room comes back; else the roster, showing the followers that could fill it
    if (typeof ccToggle === "function" && ccToggle(f)) { _sfLast = f; _sfAway = false; }   // (the card that opens beside the stack is the last one tapped, even after it was put away: js/squadfly.js)
    partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true);
}
function _sbSet(el, prop, v) { if (el[prop] !== v) el[prop] = v; }
// each slot shows the follower in that card slot of the squad (partySlot), or is open
// An OPEN slot says what a tap on it does: with exactly one follower holding a room it is "+ CALL <that one>" and a tap brings it back (REPORTED: after HOLD, "whenever I click on that follower [...] it doesn't come"); with none or several it is "+ OPEN SLOT" and a
// tap lists the followers that could fill it (js/commandcenter.js ccShowCandidates): one must not be picked for you when there is a choice.
// `lit`: which member's card is lit (the bar's is the selection; the carousel's squad row lights the creature in view)
function partySlotsUpdate(E, lit) {
    const mem = partyOrdered(), held = partyPosted(), one = held.length === 1 ? held[0] : null;
    for (let i = 0; i < PARTY.max; i++) {
        const el = E.slots[i], f = mem.find(m => m.partySlot === i) || null;
        if (el._unit !== f) { el._unit = f; el.classList.toggle("empty", !f); el._thumbKey = null; }
        if (!f) { el._call = one; el.classList.remove("sel"); el.classList.toggle("call", !!one); const op = el.querySelector(".sb-open"); if (op) _sbSet(op, "textContent", one ? "+ CALL " + (typeof unitTypeLabel === "function" ? unitTypeLabel(one) : "FOLLOWER") : "+ OPEN SLOT"); continue; }
        el._call = null; el.classList.remove("call");
        const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, col = def ? def.color : "#19e6c1", st = typeof unitStatus === "function" ? unitStatus(f) : null;
        if (el._col !== col) { el._col = col; if (el.style && typeof el.style.setProperty === "function") el.style.setProperty("--c", col); }
        el.classList.toggle("sel", lit ? !!lit(f) : typeof selectedUnits !== "undefined" && selectedUnits.has(f));
        { const cs = !lit && typeof techChipState === "function" ? techChipState(f) : null, ab = el.querySelector(".sb-ab");   // a technician's ability chip: on the bar only (not the Command Center's squad box)
          el.classList.toggle("has-ab", !!cs); if (ab) { _sbSet(ab, "textContent", cs ? cs.text : ""); _sbSet(ab, "className", "sb-ab" + (cs ? " " + cs.cls : "")); } }
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
    if (typeof document !== "undefined" && document.body && document.body.classList) { document.body.classList.toggle("squad-bar", on); document.body.classList.toggle("corners", hudCorners()); }   // (a phone moves the battle tool up for the bar; a tablet or a desktop puts every group of the HUD in its corner: game.html)
    if (!on) { if (typeof partyFlyRender === "function") partyFlyRender(); return; }
    partySlotsUpdate(partyBarBuild(root));
    if (typeof partyFlyRender === "function") partyFlyRender();
}
// THE SQUAD BOX (the Command Center's roster, the facility): a tap on a card selects that follower (the side panel then offers REMOVE FROM SQUAD); the i is its INFO; an open slot lists the followers that could fill it (the roster's NOT IN SQUAD)
// In the carousel (js/commandcenter.js ccCarousel) a tap on a member's card puts that member in view, and its ✕ REMOVE takes it out of the squad (it holds the room it is in); on a phone the card picks the follower, as it does on the bar.
function partyBoxClick(ev) {
    const hit = _partyTapped(ev); if (!hit) return;
    if (!hit.f) { if (hit.call) partyAdd([hit.call]); else if (typeof ccShowCandidates === "function") ccShowCandidates(); return; }   // an open slot: the one follower that holds a room comes back; else the roster shows the followers that could fill it
    if (hit.x) { partyRemove([hit.f]); if (typeof ccRender === "function") ccRender(); return; }
    if (hit.info) { if (typeof unitInfoOpen === "function") unitInfoOpen(hit.f); return; }
    if (typeof ccCarousel === "function" && ccCarousel() && typeof ccFocusSet === "function") { ccFocusSet(hit.f); return; }
    if (typeof ccToggle === "function") ccToggle(hit.f);
    if (typeof ccRender === "function") ccRender();
}
function partyBoxRender() {
    const root = partyBoxEl(); if (!root || !partyOn()) return;
    if (!_sbxEls || _sbxEls.root !== root) _sbxEls = partySlotsBuild(root, partyBoxClick);
    partySlotsUpdate(_sbxEls, typeof ccCarousel === "function" && ccCarousel() && typeof ccFocusUnit === "function" ? (f => f === ccFocusUnit()) : null);
}
// each few frames (js/game.js render): the squad is kept to three, the arena to its six, and the bar follows
function partyTick() { partySync(false); if (partyOn()) partyArenaOverflow(); partyBarRender(false); }

// ── THE SQUAD IS FULL: WHO MAKES ROOM (the Level 1 update) ──
// ASKED: "When recruiting a follower requires replacing an existing follower, let the player select which follower to replace", then the one replaced "has option to go to a vacancy in the rooms but if not confirm retirement".
// A recruit (+ RECRUIT) or an egg taken while the squad is full asks first (#partyPick): one of the three makes room (it holds the nearest room with a place; when no room has one, it is exiled, after a confirm) and the new one takes its
// card; or nobody does, and the new one holds a room. Nothing is paid and no egg is taken until the choice is made, and while the question is up no other recruit starts (one at a time).
let _ppAsk = null;   // { who, at, go, cancel, stage: "pick" | "exile", pick, busy }
function partyPickBusy() { return !!_ppAsk; }
function partyPickOpen(who, at, go, cancel) {
    if (_ppAsk) return false;
    _ppAsk = { who: String(who || "A NEW FOLLOWER"), at: at || [player.x, player.y], go, cancel, stage: "pick", pick: null, busy: false };
    _ppRender(); return true;
}
function _ppEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("partyPick") : null; }
function _ppName(f) { return typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER"; }
function _ppRender() {
    const root = _ppEl(); if (typeof document !== "undefined" && document.body && document.body.classList) document.body.classList.toggle("party-pick", !!_ppAsk);
    if (!root || !_ppAsk) return;
    const A = _ppAsk, esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    let h = "";
    if (A.stage === "exile") {
        h = '<b class="pp-t">EXILE ' + esc(_ppName(A.pick)) + '?</b><i class="pp-s">NO ROOM HAS A PLACE FOR IT</i>'
          + '<div class="pp-list"><button class="pp-b pp-bad" data-act="exile">EXILE ' + esc(_ppName(A.pick)) + '<small>IT LEAVES YOUR ROSTER FOR GOOD</small></button><button class="pp-b" data-act="back">BACK<small>PICK ANOTHER</small></button></div>';
    } else {
        h = '<b class="pp-t">SQUAD FULL · ' + PARTY.max + ' OF ' + PARTY.max + '</b><i class="pp-s">' + esc(A.who) + ' JOINS · WHO MAKES ROOM?</i><div class="pp-list">';
        partyOrdered().forEach((m, i) => { const v = partyVacancy(m.x, m.y, m, null); h += '<button class="pp-b" data-pick="' + i + '">' + esc(_ppName(m)) + ' · LV ' + (m.level || 1) + '<small>' + (v ? "HOLDS THE " + esc(partyRoomName(v).toUpperCase()) : "EXILED · NO ROOM HAS A PLACE") + '</small></button>'; });
        const nv = partyVacancy(A.at[0], A.at[1], null, null);
        h += '<button class="pp-b" data-act="nobody"' + (nv ? "" : " disabled") + '>NOBODY<small>' + (nv ? esc(A.who) + " HOLDS THE " + esc(partyRoomName(nv).toUpperCase()) : "NO ROOM HAS A PLACE") + '</small></button>'
          + '</div><button class="pp-x" data-act="cancel">CANCEL</button>';
    }
    root.innerHTML = '<div class="pp-card">' + h + '</div>';
    if (!root._ppWired) { root._ppWired = true; root.addEventListener("click", _ppClick); }
}
function _ppClose() { _ppAsk = null; _ppRender(); const root = _ppEl(); if (root) root.innerHTML = ""; }
function _ppDone() { const go = _ppAsk && _ppAsk.go; _ppClose(); if (typeof go === "function") go(); partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true); }
// the choice (a button, or the tests): "nobody", a squad member, "exile" (the confirm), "back", "cancel"
function partyPickChoose(choice) {
    const A = _ppAsk; if (!A || A.busy) return false;
    if (choice === "cancel") { const c = A.cancel; _ppClose(); if (typeof c === "function") c(); return true; }
    if (choice === "back") { A.stage = "pick"; A.pick = null; _ppRender(); return true; }
    if (choice === "nobody") { if (!partyVacancy(A.at[0], A.at[1], null, null)) return false; A.busy = true; _ppDone(); return true; }
    if (choice === "exile") { if (A.stage !== "exile" || !A.pick) return false; A.busy = true; partyExile(A.pick); _ppDone(); return true; }
    const m = choice; if (!partyIsMember(m)) return false;
    const v = partyVacancy(m.x, m.y, m, null);
    if (!v) { A.stage = "exile"; A.pick = m; _ppRender(); return true; }   // no room has a place: exiling it is asked first
    A.busy = true; partyPost(m, v, true); _partySay(_ppName(m) + " HOLDS THE " + partyRoomName(v).toUpperCase(), "#8fe3ff"); _ppDone();
    return true;
}
function _ppClick(ev) {
    const t = ev && ev.target && ev.target.closest ? ev.target.closest("[data-act],[data-pick]") : null; if (!t || t.disabled) return;
    const pick = t.getAttribute("data-pick"), act = t.getAttribute("data-act");
    if (pick !== null && pick !== undefined && pick !== "") { const m = partyOrdered()[+pick]; if (m) partyPickChoose(m); }
    else if (act) partyPickChoose(act);
}

// ── ADD, REMOVE, SWAP, DISBAND: the squad's buttons (the Command Center's side panel and its YOUR SQUAD window, js/commandcenter.js; the phone's roster and SQUAD petal, js/radialmenu.js) ──
// ASKED: "when you click the creature on the roster, it should show on the side add to party or add to squad [...] And here you can disband them." A follower is in the squad or it holds a room: ADD calls the followers that hold a room back into the
// squad while it has room, REMOVE posts them in the rooms they are in, SWAP does both at once (the card keeps its slot), DISBAND removes the whole squad. Each says what it did, and the bars follow at once.
function _partyFollower(f) { return !!f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green"; }
// The followers a button has dealt with LEAVE THE SELECTION (REPORTED: "whenever I try to add a different follower to the squad, it ends up adding the same follower that was previously on the squad back": the one just removed stayed selected, the next tap
// was added to it, and ADD 1 TO SQUAD took the first of the two). The panel moves on to whoever is tapped next, and the orders in the world go to the squad again, not to a follower that has just been taken out of it.
function _partyDone(list) { if (typeof selectedUnits !== "undefined") for (const f of list) selectedUnits.delete(f); }
function partyAdd(units) {
    const list = (units || []).filter(f => _partyFollower(f) && !partyIsMember(f)); if (!list.length) return 0;
    let n = 0, refused = 0; const joined = []; for (const f of list) { if (partyCall(f, true)) { n++; joined.push(f); } else refused++; } _partyDone(joined);
    if (n) _partySay("ADDED TO THE SQUAD · " + partyMembers().length + " OF " + PARTY.max, "#19e6c1");
    if (refused) _partySay("SQUAD FULL · " + PARTY.max + " OF " + PARTY.max, "#ff8a6a");
    partyBarRender(true); return n;
}
function partyRemove(units) {
    const list = (units || []).filter(partyIsMember); let n = 0; const rooms = new Set(), done = [];
    let none = 0; for (const f of list) { const at = partyPlace(f, partyRoomOf(f), true); if (at) { n++; rooms.add(at); done.push(f); } else none++; } _partyDone(done);
    if (n) _partySay("REMOVED FROM THE SQUAD · " + (rooms.size === 1 ? "HOLDING THE " + partyRoomName([...rooms][0]).toUpperCase() : n + " HOLD THEIR ROOMS"), "#8fe3ff");
    if (none) _partySay("EVERY ROOM IS FULL · " + (none === 1 ? "IT STAYS" : none + " STAY") + " IN THE SQUAD", "#ff8a6a", true);
    partyBarRender(true); return n;
}
// `out` is in the squad and goes to hold the room it is in; `inn` holds a room and takes its card
function partySwap(out, inn) {
    if (!partyIsMember(out) || !_partyFollower(inn) || partyIsMember(inn)) return false;
    const mine = partyRoomOf(out), theirs = inn.post, to = partyRoomFree(mine, out) || mine === "arena" ? mine : theirs && partyRoomCount(theirs, inn) < partyRoomCap(theirs) ? theirs : partyVacancy(out.x, out.y, out, null);   // (its own room, else the one the follower coming in leaves, else the nearest with a place)
    if (!to || !partyPost(out, to, true)) return false;
    if (!partyCall(inn, true)) { out.post = null; out.stance = "follow"; out._patrol = null; partySync(false); return false; }   // (cannot happen: a slot has just been freed)
    _partyDone([out, inn]); _partySay("SWAPPED IN · " + (typeof unitTypeLabel === "function" ? unitTypeLabel(inn) : "FOLLOWER"), "#19e6c1"); partyBarRender(true); return true;
}
function partyDisband() {
    const mem = partyMembers(); if (!mem.length) return 0;
    let n = 0; const rooms = new Set(); for (const f of mem) { const at = partyPlace(f, partyRoomOf(f), true); if (at) { n++; rooms.add(at); } } _partyDone(mem);
    _partySay("SQUAD DISBANDED · " + n + " HOLD " + (rooms.size === 1 ? "THE " + partyRoomName([...rooms][0]).toUpperCase() : rooms.size + " ROOMS"), "#ffe733");
    partyBarRender(true); return n;
}
