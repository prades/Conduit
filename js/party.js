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
//   A NEW FOLLOWER one that is found, recruited or made again joins the squad if there is room; if there is none it is posted where it is (the Crystal Chamber for a recruit, the pad's room for an egg): it does not follow.
//   THE FALLEN     one back from the dead waits at the Crystal, holding the Crystal Chamber, until you come there (build 2026-11-12o: partyFallenBack, below).
//   THE PLACES     outside the facility each domain and the Ant Nest is ONE place to hold, not a room each (build 2026-11-12o: PARTY_PLACES, below); f.post is that place's id.
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
// THE PLACES TO HOLD OUTSIDE THE FACILITY (build 2026-11-12o; the owner, 2026-11-12: "one checkpoint per domain and the nest", "checkpoint is just another place where you can have followers hold it that aren't a part
// of your squad so like if you take the nest, you can just have followers down there roaming even though they'll die typically if they're not strong enough"; then "The whole Nest is one", "2, like most rooms"): each domain
// and the Ant Nest is one place, its rooms together. A follower posted there holds all of it: it roams every room of it (partyPickStop) and fights what it meets in any (js/npc.js), and the place's count and cap are
// one (two). The electrical domain is one now; the volcanic layer and the crystalline area will be one each when they are built.
const PARTY_PLACES = [{ id: "nest", name: "Ant Nest", match: /^nest_/ }, { id: "electrical", name: "Electrical Domain", match: /^elec_/ }];
function partyPlaceDef(id) { for (const p of PARTY_PLACES) if (p.id === id) return p; return null; }
// the place a room belongs to: its domain's or the Nest's, else the room itself
function partyPlaceOf(room) { if (!room) return room; for (const p of PARTY_PLACES) if (p.match.test(room)) return p.id; return room; }
function partyRoomName(id) { const pl = partyPlaceDef(id); if (pl) return pl.name; return typeof facilityRoomName === "function" ? facilityRoomName(id) : String(id || "").replace(/_/g, " "); }
// the floor cells of a room, or of a place (all its rooms'), (the planning copy's: clear of the walls), made once
function partyRoomCells(id) {
    if (typeof _fp === "undefined" || !_fp || !_fp.cellsP) return [];
    if (!_fp.roomCells) {
        _fp.roomCells = new Map(); const add = (k, c) => { if (!_fp.roomCells.has(k)) _fp.roomCells.set(k, []); _fp.roomCells.get(k).push(c); };
        for (const c of _fp.cellsP.values()) { const rid = partyRoomAt(c[0], c[1]); if (!rid) continue; add(rid, c); const pid = partyPlaceOf(rid); if (pid !== rid) add(pid, c); }
    }
    return _fp.roomCells.get(id) || [];
}

// ── ROOM CAPACITY (the Level 1 update; docs/TECHNICIANS.md "Rooms and recruitment") ──
// ASKED: "Category 1 rooms: two followers. Main Hallway Level 2: three followers. Arena Level 2: six followers. These room capacities are separate from the three active squad slots", then the Main Hallway and the Arena are "automatically
// a level 2 just because of the amount of space in these areas", and every other room is Category 1. A room's count is the followers holding it (posted), the ones on their way back from the dead included (they keep their place); the
// squad is not counted. Every way of posting a follower goes through partyPlace: the room it means if that room has a place, else the nearest room with one that it can walk to. The arena takes one more and moves its weakest out.
// THE CRYSTAL CHAMBER has no cap (build 2026-11-12o; the owner, 2026-11-12: "the crystal chamber, which has no limit now"): the fallen wait there. A place (the Nest, a domain) has one cap for all its rooms.
const PARTY_ROOM_CAP = { lab_hallway: 3, arena: 6, crystal_chamber: Infinity }, PARTY_ROOM_CAP_ELSE = 2;
function partyRoomCap(id) { return PARTY_ROOM_CAP[partyPlaceOf(id)] || PARTY_ROOM_CAP_ELSE; }
function partyRoomCount(id, except) {
    const p = partyPlaceOf(id); let n = 0; for (const f of partyPosted()) if (f.post === p && f !== except) n++;   // (one on its way back from the dead has let its place go since build 2026-11-12o)
    return n;
}
function partyRoomFree(id, except) { return !!id && partyRoomCount(id, except) < partyRoomCap(id); }
// the nearest room with a place that a follower at (x, y) can walk to (not one on another stretch of floor: the catwalks, the nest area, an interior it is not in); `not`: a room left out. null when every one is full.
function partyVacancy(x, y, except, not) {
    if (typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    const comp = typeof _pComp === "function" ? _pComp(x, y) : undefined; let best = null, bd = Infinity;
    for (const r of _fp.F.rooms) {
        if ((not && partyPlaceOf(r.id) === partyPlaceOf(not)) || !partyRoomFree(r.id, except)) continue;
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
    if (typeof energyReturnAll === "function") energyReturnAll(f);   // and its ENERGY CARDS come back to your stock (js/energy.js; the owner, 2026-11-09: "They come back to you")
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
// THE MUTATOR'S CLONE IN THE SQUAD. ASKED (2026-11-01): "The active clone needs to become a full member of the player's squad [...] Display the clone alongside other squad members [...] Allow the player to select the
// clone individually [...] participate in squad-wide commands [...] Include the clone in attack selections and other applicable group actions." It is not a follower (no element, role, cards or room to hold) and it does
// not take one of the three places: it stands with the squad as a card of its own after theirs (_partyCloneCard), a tap on it picks it alone, the orders reach it as they reach the squad (js/helpers.js getCommandPool:
// RETREAT, HOLD, COME, ALL, the enemy card's ATTACK), it shares the squad's kill XP (js/levels.js awardKillXp) and comes through a doorway with it (js/facilityportals.js _pCarries). Its own life is the Mutator's
// (js/mutator.js): grown at the Clone Bay, upgraded with DNA, it does not come back when it falls.
const PARTY_CLONE_COL = "#c06bff";   // the Mutator's colour (js/classes.js)
function partyClone() { if (!partyOn() || typeof mutatorClone !== "function") return null; const c = mutatorClone(); return c && !c.dead && c.team === "green" ? c : null; }
// the squad and the clone, in card order (the cards, the counts the battle tool says)
function partyUnits() { const c = partyClone(); return c ? partyOrdered().concat([c]) : partyOrdered(); }
function partySquadHas(u) { return !!u && (partyIsMember(u) || u === partyClone()); }
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
    room = partyPlaceOf(room || partyRoomOf(f)); if (!room) return false;   // (a room of the Nest or a domain: that place)
    f.post = room; f.postAt = typeof frame !== "undefined" ? frame : 0; f.stance = "hold"; f.job = null; f.attackOrder = null; f._patrol = null; f._nearestEnemy = null; f._enemyCacheFrame = 0; f.partySlot = undefined; f._fpPath = null;
    if (!quiet) _partySay("HOLDING · " + partyRoomName(room).toUpperCase(), "#8fe3ff");
    return true;
}
// back to the squad, if it has room (it stays posted when it has none)
function partyCall(f, quiet) {
    if (!f || f.dead || f.isClone) return false;
    if (!f.post) return true;
    if (f.fell && !partyAtCrystal()) { if (!quiet) _partySay(_partyName(f) + " WAITS AT THE CRYSTAL · GO BACK FOR IT", "#ff8a6a", true); return false; }   // (fallen: only you, at the Crystal, take it back: build 2026-11-12o)
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
    let n = 0; const rooms = new Set(), clones = [], posted = [], called = [], kept = [], full = [], waiting = [], nm = _partyName;
    for (const a of units) {
        if (!a || a.dead) continue;
        if (a.isClone || !a.isFollower) { clones.push(a); continue; }
        if (stance === "hold") { const room = partyRoomOf(a); if (!room) continue; if (room !== "arena" && !partyRoomFree(room, a)) { full.push(partyPlaceOf(room)); continue; } if (partyPlace(a, room, true)) { n++; rooms.add(a.post); posted.push(a); } }   // (a full room takes nobody else: the arena takes one more and moves its weakest out)
        else if (stance === "follow") {
            a.attackOrder = null; a._shieldHold = null; if (a.job && a.job.type === "move") a.job = null;   // (COME ends an attack order, and a core technician's hold behind its shield: js/techabilities.js)
            const was = !!a.post;
            if (a.fell && !partyAtCrystal()) { waiting.push(a); continue; }   // (fallen: it waits at the Crystal for you, build 2026-11-12o)
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
        if (waiting.length) _partySay((waiting.length === 1 ? nm(waiting[0]) + " WAITS" : waiting.length + " WAIT") + " AT THE CRYSTAL · GO BACK FOR " + (waiting.length === 1 ? "IT" : "THEM"), "#ff8a6a", true);
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
    let cells = partyRoomCells(a.post); if (!cells.length) return null;
    if (partyPlaceDef(a.post) && typeof _pComp === "function") { const k = _pComp(a.x, a.y), mine = cells.filter(c => _pComp(c[0], c[1]) === k); if (mine.length) cells = mine; }   // (a place of several rooms: the floor it can walk to, not a shelf it cannot climb to)
    const near = cells.filter(c => { const d = Math.hypot(c[0] - a.x, c[1] - a.y); return d >= PARTY.hop[0] && d <= PARTY.hop[1]; }), pool = near.length ? near : cells, c = pool[Math.floor(Math.random() * pool.length)];
    return { x: c[0], y: c[1], wait: 0, age: 0 };
}
function partyPatrol(a) {
    if (!a.post) return;
    const here = partyPlaceOf(partyRoomAt(a.x, a.y));
    if (here !== a.post) {   // not in its room (or its place: the Nest, a domain) (it was put somewhere else, pushed out, or has come back from the dead): back to it, round the walls
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
// One card for each slot, kept (updated in place: a tap is never lost to a redraw): the unit's picture, its name, `LV 9 · FOLLOWING`, its health as a mini bar with HP and the numbers in it (12/20; green, yellow under half, red under a quarter:
// the owner, 2026-11-01, "a better way to keep track of the followers' lives") and, thin under it, its XP (how far it is through its level; the title says how far it is from evolving). TAP a card to select that follower (the rings under it, WHO says SEL 1, and the enemy card's strip says
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
        el.innerHTML = '<canvas class="sb-thumb" width="52" height="52"></canvas><span class="sb-no"></span><span class="sb-txt"><b class="sb-name"></b><span class="sb-row"><i class="sb-sub"></i><button class="sb-x" aria-label="Remove from the squad">\u2715 REMOVE</button></span><span class="sb-hp"><u></u><i class="sb-hpl">HP</i><em class="sb-hpn"></em></span><span class="sb-xp"><u></u></span><button class="sb-ult" aria-label="Ultimate" hidden><u></u><i class="sb-ultl">ULT</i><em class="sb-ultn"></em></button></span><button class="sb-info" aria-label="Info">i</button><button class="sb-ab" aria-label="Ability"></button><button class="sb-ab2" aria-label="Second ability"></button><span class="sb-open">+ OPEN SLOT</span><button class="sb-ultball" type="button" aria-label="Ultimate" tabindex="-1"></button>';   // (sb-ab: a technician's ability; sb-ab2: the Thermite Burrower's second, FAULTLINE: js/techabilities.js)
        const no = el.querySelector(".sb-no"); if (no) no.textContent = String(i + 1);   // (the number and the ✕ REMOVE are the Command Center carousel's: js/commandcenter.js; game.html hides them on the bar)
        root.appendChild(el); slots.push(el);
    }
    root.addEventListener("click", onClick);
    return { root, slots };
}
function partyBarBuild(root) {
    if (!_sbEls || _sbEls.root !== root) {
        _sbEls = partySlotsBuild(root, partyBarClick);
        // THE STRIP'S TAB (build 2026-11-12g; the owner: "have it to where the player can slide them all back in to the side and lock it into a smaller tab"): at the end of the cards, ◂ slides them in; tucked, the
        // small tab says how many are in it, ▸ slides them out. It stays as left (partyStripTucked, kept in the browser). Shown only in the corners layout (game.html).
        const tab = document.createElement("button"); tab.className = "sb-tuck"; tab.type = "button"; tab.innerHTML = "<i>◂</i><b></b>"; root.appendChild(tab); _sbEls.tuck = tab;
    }
    return _sbEls;
}
let _sbTuck = null;
function partyStripTucked() { if (_sbTuck === null) { try { _sbTuck = typeof localStorage !== "undefined" && localStorage.getItem("conduit_fp_squadtuck") === "1"; } catch (e) { _sbTuck = false; } } return !!_sbTuck; }
function partyStripTuck(on) {
    const was = partyStripTucked();
    _sbTuck = on === undefined ? !was : !!on;
    if (was && !_sbTuck && typeof document !== "undefined" && document.body && document.body.classList) { document.body.classList.add("sb-untuck"); setTimeout(() => { try { document.body.classList.remove("sb-untuck"); } catch (e) {} }, 400); }   // (sliding out: the cards clip while they grow)
    try { if (typeof localStorage !== "undefined") localStorage.setItem("conduit_fp_squadtuck", _sbTuck ? "1" : "0"); } catch (e) {}
    partyBarRender(true); return _sbTuck;
}
function _partyTapped(ev) {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return null;
    const slot = t.closest(".sb-slot"); if (!slot) return null;
    return { f: slot._unit, info: !!t.closest(".sb-info"), x: !!t.closest(".sb-x"), ab: !!t.closest(".sb-ab"), ab2: !!t.closest(".sb-ab2"), ult: !!t.closest(".sb-ult, .sb-ultball"), call: slot._call || null };
}
function partyBarClick(ev) {
    if (ev.target && ev.target.closest && ev.target.closest(".sb-tuck")) { partyStripTuck(); return; }   // the strip's tab: in, or out again
    const hit = _partyTapped(ev); if (!hit) return;
    const f = hit.f;
    if (hit.info) { if (f && typeof unitInfoOpen === "function") unitInfoOpen(f); return; }
    // A TECHNICIAN'S ABILITY (js/techabilities.js): its chip aims it (again: calls the aim off); while one is aimed, a tap on a squad card picks that follower for it
    if (f && hit.ab2 && typeof techChip2Tap === "function") { techChip2Tap(f); partyBarRender(true); return; }   // (the Thermite Burrower's second chip: FAULTLINE)
    if (f && hit.ab) {   // the chip: a technician's ability, else a CAPACITOR DISCHARGE's release (js/evolution.js altChipTap)
        if (!(typeof techChipState === "function" && techChipState(f)) && typeof altChipState === "function" && altChipState(f)) altChipTap(f); else if (typeof techChipTap === "function") techChipTap(f);
        partyBarRender(true); return;
    }
    // ITS ULTIMATE (build 2026-11-07ss; the owner: "more visible ultimate bar on followers and access to use them"): the meter on its card, full, fires it (js/elements.js followerUltFire); not full, a tap is a tap on the card
    if (f && hit.ult && f.ultimateCharge >= 100 && typeof followerUltFire === "function") {
        if (!followerUltFire(f) && typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "NOTHING TO HIT", color: "#ffe733", life: 60, vy: -0.05, size: 10 });
        partyBarRender(true); return;
    }
    if (f && typeof techAimActive === "function" && techAimActive() && typeof techAimPickFollower === "function" && techAimPickFollower(f)) { partyBarRender(true); return; }
    if (!f) { if (hit.call) { partyAdd([hit.call]); if (typeof mixToolRender === "function") mixToolRender(true); } else if (typeof ccShowCandidates === "function") ccShowCandidates(); else if (typeof ccOpen === "function") ccOpen("roster"); return; }   // an open slot: the one follower that holds a room comes back; else the roster, showing the followers that could fill it
    if (typeof ccToggle === "function" && ccToggle(f)) { _sfLast = f; _sfAway = false; }   // (the card that opens beside the stack is the last one tapped, even after it was put away: js/squadfly.js)
    partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true);
}
function _sbSet(el, prop, v) { if (el[prop] !== v) el[prop] = v; }
// a card's XP bar: its length is how far the unit is through its level, it breathes in the last level before an evolution, and it flashes a moment when XP came in. The card's title says it in words.
function _partyXpBar(el, f) {
    const bar = el.querySelector(".sb-xp"), u = bar ? bar.querySelector("u") : null, p = typeof xpProgress === "function" ? xpProgress(f) : null; if (!bar || !u) return;
    if (!p) { _sbSet(bar, "hidden", true); return; }
    _sbSet(bar, "hidden", false);
    const w = Math.round(p.frac * 100) + "%"; if (u.style.width !== w) u.style.width = w;
    el.classList.toggle("evo-soon", !!(p.evo && p.evo.levels <= 1 && !p.max));
    if (el._xpSeen !== undefined && p.xp > el._xpSeen && el._xpUnit === f) { el.classList.add("xp-gain"); el._xpGain = Date.now() + 900; }
    el._xpSeen = p.xp; el._xpUnit = f; if (el._xpGain && Date.now() > el._xpGain) { el._xpGain = 0; el.classList.remove("xp-gain"); }
    _sbSet(el, "title", "LV " + p.level + " · XP " + xpText(p) + (p.evo ? " · " + xpEvoText(p) : f.evolved ? " · EVOLVED" : ""));
}
// a card's ULTIMATE (build 2026-11-07ss): a meter under the XP in its element's colour, ULT and the charge in it; full, gold and glowing, ULTIMATE ▲ and TAP: a tap fires it (partyBarClick). None for one with no Ultimate.
function _partyUltBar(el, f) {
    const bar = el.querySelector(".sb-ult"); if (!bar) return;
    const u = typeof followerUltimate === "function" ? followerUltimate(f) : null;
    if (!u || typeof f.ultimateCharge !== "number") { _sbSet(bar, "hidden", true); return; }
    _sbSet(bar, "hidden", false);
    const pct = Math.max(0, Math.min(100, Math.round(f.ultimateCharge))), full = pct >= 100, fill = bar.querySelector("u"), w = pct + "%";
    if (fill && fill.style.width !== w) fill.style.width = w;
    if (bar.classList.contains("full") !== full) bar.classList.toggle("full", full);
    const l = bar.querySelector(".sb-ultl"), n = bar.querySelector(".sb-ultn");
    if (l) _sbSet(l, "textContent", full ? "ULTIMATE \u25b2" : "ULT"); if (n) _sbSet(n, "textContent", full ? "TAP" : pct + "%");
    _sbSet(bar, "title", "ULTIMATE · " + String(u.name || "").toUpperCase() + (full ? " · TAP TO FIRE" : " · " + pct + "%"));
}
// THE ULTIMATE'S TAB (build 2026-11-12v; the owner: "the ultimates for the followers show up as little balls or tabs on the roster ... their own icon ... pop up dynamically whenever they have
// the ultimate"; then: only when ready, on each follower's card, bold flat symbols; then "behind the tile cards and ... elongated shapes that house the icons"). On the strip (the corners layout) a tall
// tab in the follower's element colour, ringed in gold, with its Ultimate's own symbol, rises from behind its card out of the top edge when the charge is full; a tap fires it (partyBarClick, as the meter's TAP did) and it sinks back. The thin meter is not shown there (game.html).
// The symbols are 24 × 24 line drawings in the ink's colour (currentColor), one per form with an Ultimate (FORM_ULTIMATES, js/elements.js); ULT_ICON_ANY for one not listed.
const ULT_ICON_ANY = '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" fill="currentColor"/>';
const ULT_ICONS = {
    embercowl:    '<path d="M3 21h18l-5.5-8.5h-7z" fill="currentColor"/><path d="M12 10V3M8.5 9.5 6 5.5M15.5 9.5 18 5.5"/>',   // VOLCANIC ERUPTION: a volcano spouting
    staticorb:    '<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.5z" fill="currentColor"/><path d="M2 8h3M1.5 12H4M2 16h3"/>',   // OVERDRIVE: a bolt at a rush
    maw:          '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>',   // ABSOLUTE ZERO: a snowflake
    shrub:        '<path d="M12 22v-9M12 16 7 11M12 14l5-5"/><circle cx="7" cy="8" r="3.4" fill="currentColor"/><circle cx="17" cy="6.5" r="3.4" fill="currentColor"/><circle cx="12" cy="5" r="3" fill="currentColor"/><path d="M9.5 18.5 7.5 19M14.5 17l2 .5"/>',   // PINK THICKET: a thorny bush
    sundew:       '<path d="M12 22c0-6-1-9-5-13M12 22c0-6 1-9 5-13M12 22V7"/><circle cx="6" cy="7.5" r="2.2" fill="currentColor"/><circle cx="18" cy="7.5" r="2.2" fill="currentColor"/><circle cx="12" cy="4.5" r="2.2" fill="currentColor"/>',   // CONSUME: a sundew's sticky tendrils
    coralcrab:    '<path d="M8.5 22V10h7v12" fill="currentColor"/><path d="M8.5 10 6 5M6 5 4 3M6 5h-3M15.5 10 18 5M18 5l2-2M18 5h3M12 10V3"/>',   // REEF PILLAR: a pillar of coral
    seeper:       '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 1 1-4-4 6 6 0 1 1-6 6 8 8 0 0 0 8 8"/><path d="M19 15.5c1 1.6 1.5 2.6 1.5 3.3a1.5 1.5 0 0 1-3 0c0-.7.5-1.7 1.5-3.3z" fill="currentColor"/>',   // TOXIC UNDERTOW: a whirlpool and a drip
    mimic:        '<path d="M12 2l2.2 5L12 9 9.8 7zM22 12l-5 2.2L15 12l2-2.2zM12 22l-2.2-5L12 15l2.2 2zM2 12l5-2.2L9 12l-2 2.2z" fill="currentColor"/><path d="M17 4.5a9 9 0 0 1 2.5 2.5M19.5 17a9 9 0 0 1-2.5 2.5M7 19.5A9 9 0 0 1 4.5 17M4.5 7A9 9 0 0 1 7 4.5"/>',   // SHARD VORTEX: shards turning
    jellyram:     '<path d="M12 2.5 4 5.5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10v-6z" fill="currentColor"/>',   // JELLY SHIELDS: a shield
    thermite:     '<path d="M2 15h20"/><path d="M4 15l3-4 2 5 3-7 2.5 6L17 10l3 5" fill="currentColor"/><path d="M7 19l1-2M13 20l-1-3M18 19l-1-2"/>',   // FAULTLINE: the ground cracking
    rotshard:     '<ellipse cx="12" cy="17.5" rx="9.5" ry="3.8" fill="currentColor"/><circle cx="9" cy="10" r="2.2"/><circle cx="15" cy="7" r="1.6"/><circle cx="12.5" cy="11.5" r="1"/>',   // TOXIC PUDDLE: a puddle bubbling
    quillstone:   '<circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5M4.6 4.6l3.5 3.5M15.9 15.9l3.5 3.5M19.4 4.6l-3.5 3.5M8.1 15.9l-3.5 3.5"/>',   // QUILLSTORM: quills flying out
    thunderhead:  '<path d="M6.5 14a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.5 6 4 4 0 0 1 18 14z" fill="currentColor"/><path d="M12.5 13.5 9.5 18h4l-2 4.5"/>',   // THUNDERSTORM: a cloud and its bolt
    voidstar:     '<circle cx="12" cy="12" r="4.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="10.5" ry="4" transform="rotate(-25 12 12)"/>',   // EVENT HORIZON: a black hole and its ring
    rimestar:     '<path d="M2 8h11a3 3 0 1 0-3-3M2 13h16a3 3 0 1 1-3 3M2 18h7"/><circle cx="20" cy="6" r="1.3" fill="currentColor"/><circle cx="13" cy="20" r="1.3" fill="currentColor"/><circle cx="21" cy="21" r="1" fill="currentColor"/>',   // WHITEOUT: a blizzard's gusts
    blightspider: '<path d="M5 5l7 7-7 7M19 5l-7 7 7 7M5 5h14M5 19h14"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="5" cy="5" r="2" fill="currentColor"/><circle cx="19" cy="5" r="2" fill="currentColor"/><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="19" cy="19" r="2" fill="currentColor"/>',   // CONTAMINATION NETWORK: a web of linked nodes
    hammerslug:   '<path d="M7 2.5h10v5H7z" fill="currentColor"/><path d="M12 7.5V14M2 20c3-3 6-4 10-4s7 1 10 4M5.5 22.5c2-1.6 4-2.2 6.5-2.2s4.5.6 6.5 2.2"/>',   // SHOCKWAVE SLAM: a hammer and the ground's rings
    igloo:        '<ellipse cx="12" cy="16" rx="10" ry="5" fill="currentColor"/><path d="M5 9c3-3 7-3.5 11-1.5M8 5.5c3-1.5 6-1.5 9 0"/>',   // ICE RINK: a slick of ice, the slide over it
    gooproxy:     '<circle cx="8" cy="8" r="3.4" fill="currentColor"/><circle cx="16.5" cy="7" r="2.6" fill="currentColor"/><circle cx="6.5" cy="16.5" r="2.6" fill="currentColor"/><circle cx="15" cy="15.5" r="4" fill="currentColor"/><circle cx="21" cy="12" r="1.4" fill="currentColor"/>',   // PROXY SWARM: a swarm of blobs
    hornshell:    '<path d="M2 18c3 0 4-2 6-2s3 2 6 2 4-2 6-2M3 12.5C5 6 11 3 16 5c3 1.3 4 4.5 2 6.5-1.8 1.8-4.5.7-4.5-1.5 0-1.5 1.3-2 2-1.5"/>',   // WAVE MAKER: a wave curling
    hovershell:   '<path d="M3 20C8 14 14 8 21 3"/><path d="M3 12c5 0 11-3 14-9M8 21c5-2 9-7 13-9" stroke-opacity="0.6"/>',   // DRIFT SLASH: slashes in a sweep
    electroskink: '<path d="M4 4h6v6H4zM14 14h6v6h-6z"/><path d="M10 7h7v7M14 17H7v-7"/><path d="M13.5 8.5 11 12h3l-2.5 3.5" stroke-width="1.8"/>'   // LIGHTNING CIRCUIT: a circuit with a spark
};
function ultIconSvg(formId) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ULT_ICONS[formId] || ULT_ICON_ANY) + '</svg>'; }
function _partyUltBall(el, f) {
    const ball = el._sbBall || (el._sbBall = el.querySelector(".sb-ultball")); if (!ball) return;
    const u = f && typeof followerUltimate === "function" ? followerUltimate(f) : null, up = !!(u && f.ultimateCharge >= 100);
    if (u && ball._form !== f.evolved) { ball._form = f.evolved; ball.innerHTML = ultIconSvg(f.evolved); }
    if (ball.classList.contains("up") !== up) ball.classList.toggle("up", up);
    _sbSet(ball, "title", u ? "ULTIMATE · " + String(u.name || "").toUpperCase() + (up ? " · TAP TO FIRE" : "") : "");
    _sbSet(ball, "tabIndex", up ? 0 : -1);
}
// each slot shows the follower in that card slot of the squad (partySlot), or is open
// An OPEN slot says what a tap on it does: with exactly one follower holding a room it is "+ CALL <that one>" and a tap brings it back (REPORTED: after HOLD, "whenever I click on that follower [...] it doesn't come"); with none or several it is "+ OPEN SLOT" and a
// tap lists the followers that could fill it (js/commandcenter.js ccShowCandidates): one must not be picked for you when there is a choice.
// `lit`: which member's card is lit (the bar's is the selection; the carousel's squad row lights the creature in view)
function partySlotsUpdate(E, lit) {
    const mem = partyOrdered(), held = partyPosted(), one = held.length === 1 ? held[0] : null;
    for (let i = 0; i < PARTY.max; i++) {
        const el = E.slots[i], f = mem.find(m => m.partySlot === i) || null;
        if (el._unit !== f) { if (f && !el._unit && E.joinable) { el.classList.add("sb-join"); el._joinAt = Date.now(); } el._unit = f; el.classList.toggle("empty", !f); el._thumbKey = null; }   // (a member who joins: the strip grows to take its card, build 2026-11-12g)
        if (el._joinAt && Date.now() - el._joinAt > 700) { el._joinAt = 0; el.classList.remove("sb-join"); }
        if (typeof cardArtUnitClass === "function") cardArtMark(el, f ? cardArtUnitClass(f) : "");   // a member's backdrop: its element's texture under its class's (js/cardart.js); an open slot has none
        if (!f) { _partyUltBall(el, null); el._call = one; el.classList.remove("sel"); el.classList.toggle("call", !!one); const op = el.querySelector(".sb-open"); if (op) _sbSet(op, "textContent", one ? "+ CALL " + (typeof unitTypeLabel === "function" ? unitTypeLabel(one) : "FOLLOWER") : "+ OPEN SLOT"); continue; }
        el._call = null; el.classList.remove("call");
        const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, col = def ? def.color : "#19e6c1", st = typeof unitStatus === "function" ? unitStatus(f) : null;
        if (el._col !== col) { el._col = col; if (el.style && typeof el.style.setProperty === "function") el.style.setProperty("--c", col); }
        el.classList.toggle("sel", lit ? !!lit(f) : typeof selectedUnits !== "undefined" && selectedUnits.has(f));
        { const cs = lit ? null : (typeof techChipState === "function" && techChipState(f)) || (typeof altChipState === "function" && altChipState(f)) || null, ab = el.querySelector(".sb-ab");   // a technician's ability chip (or a CAPACITOR DISCHARGE's: js/evolution.js altChipState): on the bar only (not the Command Center's squad box)
          el.classList.toggle("has-ab", !!cs); if (ab) { _sbSet(ab, "textContent", cs ? cs.text : ""); _sbSet(ab, "className", "sb-ab" + (cs ? " " + cs.cls : "")); _sbSet(ab, "title", cs && cs.title ? cs.title : ""); }
          const cs2 = !lit && typeof techChip2State === "function" ? techChip2State(f) : null, ab2 = el.querySelector(".sb-ab2");   // the Thermite Burrower's second chip (FAULTLINE), above the first
          el.classList.toggle("has-ab2", !!cs2); if (ab2) { _sbSet(ab2, "textContent", cs2 ? cs2.text : ""); _sbSet(ab2, "className", "sb-ab2" + (cs2 ? " " + cs2.cls : "")); } }
        const name = typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER", sub = "LV " + (f.level || 1) + (st ? " · " + st.text : "");
        const nm = el.querySelector(".sb-name"), sb = el.querySelector(".sb-sub");
        _sbSet(nm, "textContent", name); _sbSet(sb, "textContent", sub); if (st) sb.style.color = st.col;
        partySlotHealth(el, f);   // its health: the bar and the numbers in it
        _partyXpBar(el, f); _partyUltBar(el, f); _partyUltBall(el, f);
        const key = f.evolved + "|" + f.element; if (el._thumbKey !== key && typeof _ccThumb === "function") { el._thumbKey = key; el._thumbDone = false; _ccThumb(el.querySelector(".sb-thumb"), f); }
        if (!el._thumbDone && f.evolved && typeof EVOLUTIONS !== "undefined" && typeof _ccThumb === "function") { const d = EVOLUTIONS[f.evolved]; if (d && d._img && d._img.complete) { el._thumbDone = true; _ccThumb(el.querySelector(".sb-thumb"), f); } }   // (an evolved form's picture may still have been loading)
    }
}
// a member's health on its card: the bar and the numbers in it. In a fight a hit takes its share only as its number lands (js/battleview.js battleBarHealth; each frame, battleCardsTick)
function partySlotHealth(el, f) {
    const now = typeof battleBarHealth === "function" ? battleBarHealth(f) : (f.health || 0), hp = el._sbHpU || (el._sbHpU = el.querySelector(".sb-hp u")), hpn = el._sbHpN || (el._sbHpN = el.querySelector(".sb-hpn"));
    const frac = Math.max(0, Math.min(1, now / (f.maxHealth || 1))), w = Math.round(frac * 100) + "%", cls = frac > 0.5 ? "" : frac > 0.25 ? "mid" : "low";
    if (hp) { if (hp.style.width !== w) hp.style.width = w; if (hp.className !== cls) hp.className = cls; }
    if (hpn) _sbSet(hpn, "textContent", Math.max(0, Math.round(now)) + "/" + Math.max(1, Math.round(f.maxHealth || 1)));
}
function partyBarRender(force) {
    const root = partyBarEl(); if (!root) return;
    const on = partyOn(); if (root.classList) root.classList.toggle("on", on);
    if (typeof document !== "undefined" && document.body && document.body.classList) { document.body.classList.toggle("squad-bar", on); document.body.classList.toggle("corners", hudCorners()); }   // (a phone moves the battle tool up for the bar; a tablet or a desktop puts every group of the HUD in its corner: game.html)
    if (!on) { if (typeof partyFlyRender === "function") partyFlyRender(); return; }
    const E = partyBarBuild(root); partySlotsUpdate(E); _partyCloneCard(E); E.joinable = true;
    _partyStripTab(E);
    if (typeof partyFlyRender === "function") partyFlyRender();
}
// the strip's tab (the corners layout): slid in, the cards go and the tab says how many are in it (game.html body.squad-tucked)
function _partyStripTab(E) {
    const tucked = partyStripTucked(), b = typeof document !== "undefined" && document.body && document.body.classList ? document.body.classList : null;
    if (b && b.contains("squad-tucked") !== tucked) b.toggle("squad-tucked", tucked);
    const tab = E.tuck; if (!tab) return;
    const n = E.slots.filter(el => el._unit || (el.classList && el.classList.contains && el.classList.contains("call"))).length + (E.clone ? 1 : 0), i = tab.querySelector("i"), c = tab.querySelector("b");
    if (i) _sbSet(i, "textContent", tucked ? "▸" : "◂"); if (c) _sbSet(c, "textContent", String(n));
    _sbSet(tab, "title", tucked ? "Slide the squad out" : "Slide the squad in"); if (tab.setAttribute) tab.setAttribute("aria-label", tucked ? "Slide the squad out (" + n + ")" : "Slide the squad in");
}
// THE CLONE'S CARD on the bar, after the squad's three: made while the Mutator's clone is alive and taken away when it is not (the bar's own three are always three). The same card as a member's (the picture, the
// name, LV and how it is, its health with the numbers, its XP), in the Mutator's purple, its picture the creature itself; no ability chip and no REMOVE (it is not a follower: it is released at the Clone Bay).
// A tap picks it alone (js/party.js partyBarClick, as for a member), its i is its INFO (the creature's index, js/unitinfo.js cloneInfo).
function _partyCloneCard(E) {
    const c = partyClone(), body = typeof document !== "undefined" && document.body ? document.body : null;
    if (body && body.classList) body.classList.toggle("has-clone", !!c);   // (a phone makes room for it: game.html)
    if (!c) { if (E.clone) { if (E.clone.parentNode) E.clone.parentNode.removeChild(E.clone); E.clone = null; } return; }
    if (!E.clone || E.clone.parentNode !== E.root) {
        const el = document.createElement("div"); el.className = "sb-slot sb-clone"; el.setAttribute("data-slot", "clone");
        el.innerHTML = '<canvas class="sb-thumb" width="52" height="52"></canvas><span class="sb-txt"><b class="sb-name"></b><span class="sb-row"><i class="sb-sub"></i></span><span class="sb-hp"><u></u><i class="sb-hpl">HP</i><em class="sb-hpn"></em></span><span class="sb-xp"><u></u></span></span><button class="sb-info" aria-label="Info">i</button><span class="sb-ctag">CLONE</span>';
        if (el.style && typeof el.style.setProperty === "function") el.style.setProperty("--c", PARTY_CLONE_COL);
        if (E.joinable && el.classList) el.classList.add("sb-join");   // (it joins the strip as a member does)
        E.root.appendChild(el); E.clone = el;
    }
    const el = E.clone, st = typeof unitStatus === "function" ? unitStatus(c) : null;
    if (el._unit !== c) { el._unit = c; el._thumbKey = null; }
    el.classList.toggle("sel", typeof selectedUnits !== "undefined" && selectedUnits.has(c));
    const nm = el.querySelector(".sb-name"), sb = el.querySelector(".sb-sub"), hp = el.querySelector(".sb-hp u"), hpn = el.querySelector(".sb-hpn");
    _sbSet(nm, "textContent", typeof unitTypeLabel === "function" ? unitTypeLabel(c) : "CLONE");
    _sbSet(sb, "textContent", "LV " + (c.level || 1) + " · " + (st ? st.text : "FOLLOWING")); if (st && sb.style) sb.style.color = st.col;
    const frac = Math.max(0, Math.min(1, (c.health || 0) / (c.maxHealth || 1))), w = Math.round(frac * 100) + "%", cls = frac > 0.5 ? "" : frac > 0.25 ? "mid" : "low";
    if (hp && hp.style.width !== w) hp.style.width = w; if (hp && hp.className !== cls) hp.className = cls;
    if (hpn) _sbSet(hpn, "textContent", Math.max(0, Math.round(c.health || 0)) + "/" + Math.max(1, Math.round(c.maxHealth || 1)));
    _partyXpBar(el, c);
    const key = c.speciesName + "|" + c.className;
    if (el._thumbKey !== key) { el._thumbKey = key; partyCloneThumb(el.querySelector(".sb-thumb"), c); }
}
// the clone's picture on a small canvas: the creature itself (js/clone.js drawCloneArt), not a coloured blob
function partyCloneThumb(cv, c) {
    const g = cv && cv.getContext ? cv.getContext("2d") : null; if (!g || !c) return;
    g.clearRect(0, 0, cv.width, cv.height);
    if (typeof drawCloneArt === "function") drawCloneArt(g, { key: c.speciesName + "_" + (c.className || "scout"), speciesName: c.speciesName, className: c.className || "scout", ready: true }, cv.width / 2, cv.height * 0.66, cv.width / 64);
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
function partyTick() { partySync(false); if (partyOn()) { partyArenaOverflow(); partyFallenTick(); } partyBarRender(false); }

// ── THE FALLEN (build 2026-11-12o; the owner, 2026-11-12: "whenever a follower dies, whether it's in the squad or whether it's holding an area in the facility or otherwise, it's returned to the crystal ... When a
// follower is respawned at the crystal, it stays at the crystal. When the player returns to the crystal, they may join the squad automatically and they may continue on from there, but the other followers who were not
// in the squad must stay in the ... crystal chamber"; then, asked, COME does not reach them: "No: walk back to the Crystal") ──
// A follower back from the dead (js/game.js, the respawn queue) holds the Crystal Chamber and is marked `fell`: "squad" (it fell from the squad) or "held" (it fell holding a place, or anywhere else). Nothing calls it from
// afar while it is marked: not COME, not the roster's ADD TO SQUAD or a swap (partyCall, partyApplyStance, partyAdd, partySwap). When you come into the Crystal Chamber the mark is lifted: the ones that fell from the
// squad rejoin it while it has room; the rest hold the Crystal Chamber as any follower holds a room. The mark is saved (js/facilitysave.js).
function _partyName(f) { return typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER"; }
function partyCrystalRoom() { return typeof crystal !== "undefined" && crystal ? partyRoomAt(crystal.x, crystal.y) || "crystal_chamber" : "crystal_chamber"; }
function partyAtCrystal() { return typeof player !== "undefined" && !!player && partyRoomAt(player.x, player.y) === partyCrystalRoom(); }
// the respawn queue's follower is in the world: it waits at the Crystal. False outside the facility (the squad takes it as before).
function partyFallenBack(f, entry) {
    if (!partyOn() || !f || f.isClone || !f.isFollower) return false;
    f.post = partyCrystalRoom(); f.postAt = typeof frame !== "undefined" ? frame : 0; f.stance = "hold"; f.partySlot = undefined; f.job = null; f._patrol = null; f._fpPath = null;
    f.fell = entry && entry.fell === "squad" ? "squad" : "held";
    const paid = entry && entry.paid > 0 ? Math.round(entry.paid * 100) : 0;
    _partySay(_partyName(f) + " IS BACK AT THE CRYSTAL" + (paid ? " · CRYSTAL \u2212" + paid + "%" : ""), "#ffb36b", true);
    return true;
}
// each tick: you are in the Crystal Chamber, so the fallen are yours to take again
function partyFallenTick() {
    if (typeof followers === "undefined" || !partyAtCrystal()) return;
    let back = null;
    for (const f of followers) {
        if (!_partyFollower(f) || !f.fell) continue;
        const was = f.fell; f.fell = null;
        if (was === "squad" && partyCall(f, true)) (back || (back = [])).push(f);
    }
    if (back) { _partySay((back.length === 1 ? _partyName(back[0]) + " REJOINS" : back.length + " REJOIN") + " THE SQUAD", "#19e6c1", true); partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true); }
}

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
    let n = 0, refused = 0; const joined = [], waiting = []; for (const f of list) { if (f.fell && !partyAtCrystal()) { waiting.push(f); continue; } if (partyCall(f, true)) { n++; joined.push(f); } else refused++; } _partyDone(joined);
    if (n) _partySay("ADDED TO THE SQUAD · " + partyMembers().length + " OF " + PARTY.max, "#19e6c1");
    if (refused) _partySay("SQUAD FULL · " + PARTY.max + " OF " + PARTY.max, "#ff8a6a");
    if (waiting.length) _partySay((waiting.length === 1 ? _partyName(waiting[0]) + " WAITS" : waiting.length + " WAIT") + " AT THE CRYSTAL · GO BACK FOR " + (waiting.length === 1 ? "IT" : "THEM"), "#ff8a6a", true);   // (fallen: build 2026-11-12o)
    partyBarRender(true); return n;
}
function partyRemove(units) {
    const list = (units || []).filter(partyIsMember); let n = 0; const rooms = new Set(), done = [];
    let none = 0; for (const f of list) { const at = partyPlace(f, partyRoomOf(f), true); if (at) { n++; rooms.add(at); done.push(f); } else none++; } _partyDone(done);
    if (n) _partySay("REMOVED FROM THE SQUAD · " + (rooms.size === 1 ? "HOLDING THE " + partyRoomName([...rooms][0]).toUpperCase() : n + " HOLD THEIR ROOMS"), "#8fe3ff");
    if (none) _partySay("EVERY ROOM IS FULL · " + (none === 1 ? "IT STAYS" : none + " STAY") + " IN THE SQUAD", "#ff8a6a", true);
    partyBarRender(true); return n;
}
// `out` is in the squad and goes to hold a room; `inn` holds a room and takes its card. A SWAP IS ONE FOR ONE (REPORTED, 2026-11-12: "It's not allowing me to switch my squad inside the Ant arena ... because for a split
// second the Ant arena would be 3 squad members or followers full, even though I'm adopting one to my squad. So make sure that doesn't happen"): no room's cap is counted with both of them in it. `out` holds the room it is
// in when that is the place `inn` leaves or has a place of its own; else the place `inn` leaves, wherever it is (its count does not change, even in a place already over its cap: an older save's); else the nearest room
// with a place. A swap that cannot be made says why.
function partySwap(out, inn) {
    if (!partyIsMember(out) || !_partyFollower(inn) || partyIsMember(inn)) return false;
    if (inn.fell && !partyAtCrystal()) { _partySay(_partyName(inn) + " WAITS AT THE CRYSTAL · GO BACK FOR IT", "#ff8a6a", true); return false; }   // (fallen: build 2026-11-12o)
    const mine = partyRoomOf(out), theirs = inn.post ? partyPlaceOf(inn.post) : null;
    const to = mine && (partyPlaceOf(mine) === theirs || mine === "arena" || partyRoomFree(mine, out)) ? mine : theirs || partyVacancy(out.x, out.y, out, null);
    if (!to) { _partySay("EVERY ROOM IS FULL · " + _partyName(out) + " STAYS IN THE SQUAD", "#ff8a6a", true); return false; }   // (only when the one coming in holds no room: it is on its way)
    if (!partyPost(out, to, true)) return false;
    if (!partyCall(inn, true)) { out.post = null; out.stance = "follow"; out._patrol = null; partySync(false); return false; }   // (cannot happen: a slot has just been freed)
    _partyDone([out, inn]); _partySay("SWAPPED IN · " + (typeof unitTypeLabel === "function" ? unitTypeLabel(inn) : "FOLLOWER"), "#19e6c1"); partyBarRender(true); return true;
}
function partyDisband() {
    const mem = partyMembers(); if (!mem.length) return 0;
    let n = 0; const rooms = new Set(); for (const f of mem) { const at = partyPlace(f, partyRoomOf(f), true); if (at) { n++; rooms.add(at); } } _partyDone(mem);
    _partySay("SQUAD DISBANDED · " + n + " HOLD " + (rooms.size === 1 ? "THE " + partyRoomName([...rooms][0]).toUpperCase() : rooms.size + " ROOMS"), "#ffe733");
    partyBarRender(true); return n;
}
