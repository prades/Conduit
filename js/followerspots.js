// ─────────────────────────────────────────────────────────
//  FOLLOWER SPOTS: a follower waits in its egg where it is, as one type and one element, and the spot fills again
// ─────────────────────────────────────────────────────────
// ASKED: "put a few spots where the followers exist and will respawn there, and they'll have a fixed type and a fixed element." Asked what "respawn" meant: "the spot refills after a delay".
// A spot (the map's `followerSpots`, js/facilitymap.js) is a pad on the floor in its element's colour, with the follower on it as a grey egg and a label over it: its type (BRAWLER, MAGE, TECHNICIAN) and its element.
// Both are the spot's, never the player's: there is nothing to choose, and the follower that joins is exactly that.
//   TAKE      walking up to the egg (FP_SPOT.take tiles) makes it a follower there and then (spawnFollowerAtCrystal with the spot's element and type, put on the spot, no walk home to the Crystal first)
//   REFILL    FP_SPOT.refill frames later (a minute and a half) the spot has another egg of the same type and element, once the player is not standing near it and the squad is under FP_SPOT.cap
//   SAVED     the delay still to run is part of the saved game (js/facilitysave.js), so reloading the page is not a way to fill every spot again at once
// The egg is an ordinary neutral recruit (a grey egg: it does nothing, is nobody's target, and the walk-up-and-it-walks-home conversion is skipped for it, js/game.js).

const FP_SPOT = { take: 1.5, refill: 5400, near: 4, cap: 12, label: 8 };   // tiles to take it; frames to fill again; tiles the player must be off; followers the squad may have for a spot to fill; tiles within which its label shows

function facilityFollowerSpotsStart(F) {
    if (!_fp || !_fp.items) return;
    _fp.items = _fp.items.filter(i => i.fp !== "spot"); _fp.spots = [];
    for (const p of (F.followerSpots || [])) {
        const s = { id: p.id, room: p.room, x: p.at[0], y: p.at[1], type: p.type, element: p.element, egg: null, readyAt: 0, arrive: undefined, taken: 0 };
        _fp.spots.push(s);
        _fp.items.push({ type: "fp", fp: "spot", id: p.id, room: p.room, x: s.x, y: s.y, depth: s.x + s.y - 0.25, base: facilityRoomHeight(p.room, F) * FP_ELEV_PX, seed: _fpHash(Math.round(s.x * 3), Math.round(s.y * 5)), spot: s });
    }
}
// the egg: a neutral recruit made as the world makes one (js/world.js), of the spot's type and element
function _fpSpotEgg(s) {
    const def = NPC_TYPES["virus"], personality = personalityForType(s.type), stats = applyPersonality(personality), role = assignRole(stats);
    return { type: "virus", element: s.element, x: s.x, y: s.y, team: "red", convertFlash: 0, isNeutralRecruit: true, health: stats.hp, maxHealth: stats.hp, moveSpeed: def.moveSpeed, power: stats.attack,
             stats, personality, role, currentResonance: 0, currentWill: stats.will, targetX: s.x, targetY: s.y, walkCycle: 0, moveCooldown: 0, stance: "follow", isFollower: false, isHealing: false,
             hitFlash: 0, spawnProtection: 0, dead: false, fpSpot: s.id };
}
function facilityFollowerSpotTake(s) {
    const egg = s.egg, k = egg ? actors.indexOf(egg) : -1; if (k >= 0) actors.splice(k, 1);
    s.egg = null; s.readyAt = _fpFrame() + FP_SPOT.refill; s.taken++;
    if (typeof spawnFollowerAtCrystal !== "function") return null;
    spawnFollowerAtCrystal(s.element, s.type);
    const f = followers[followers.length - 1]; if (!f) return null;
    f.x = s.x; f.y = s.y; f.returningToCrystal = false; f.convertFlash = 30; f.fromSpot = s.id;
    if (f.post) f.post = s.room; else f.stance = "follow";   // (the squad was full: it holds the room the egg was in, js/party.js)
    const def = ELEMENTS.find(e => e.id === s.element);
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: roleLabel(s.type) + " · " + (def ? def.label : String(s.element).toUpperCase()) + (f.post ? " HOLDS THE " + partyRoomName(f.post).toUpperCase() : " JOINED!"), color: def ? def.color : "#fff", life: 120, vy: -0.2, size: 14 });
    return f;
}
// each frame (from facilityTutorialTick)
function facilityFollowerSpotsTick() {
    const S = _fp && _fp.spots; if (!S || !S.length) return;
    const now = _fpFrame();
    for (const s of S) {
        if (s.egg) {
            if (s.egg.dead || !actors.includes(s.egg)) { s.egg = null; s.readyAt = now + FP_SPOT.refill; continue; }   // (it was taken or destroyed some other way: the spot fills again all the same)
            if (Math.hypot(player.x - s.x, player.y - s.y) < FP_SPOT.take) facilityFollowerSpotTake(s);
        } else if (now >= s.readyAt && Math.hypot(player.x - s.x, player.y - s.y) > FP_SPOT.near && followers.filter(f => f && !f.dead).length < FP_SPOT.cap) {
            s.egg = _fpSpotEgg(s); actors.push(s.egg); s.arrive = now;
        }
    }
}
// the saved game: the delay still to run on each spot that is empty
function followerSpotsSnapshot() {
    const out = {}, now = _fpFrame(); for (const s of ((_fp && _fp.spots) || [])) if (!s.egg) out[s.id] = Math.max(0, Math.round(s.readyAt - now));
    return out;
}
function followerSpotsApply(d) {
    if (!d || typeof d !== "object" || !_fp || !_fp.spots) return;
    const now = _fpFrame();
    for (const s of _fp.spots) if (Number.isFinite(d[s.id])) { if (s.egg) { const k = actors.indexOf(s.egg); if (k >= 0) actors.splice(k, 1); s.egg = null; } s.readyAt = now + Math.max(0, Math.min(FP_SPOT.refill, d[s.id])); }
}

// the pad and its label (js/facilityplay.js drawFacilityItem)
function _fpDrawSpot(it) {
    const s = it.spot, f = _fpFrame(), def = ELEMENTS.find(e => e.id === s.element), col = def ? def.color : "#9fe8ff", full = !!s.egg, pul = 0.7 + 0.3 * Math.sin(f * 0.07 + it.seed);
    const c = _fpP(it.x, it.y, 0), rx = 0.82 * TILE_W * 1.4142, ry = 0.82 * TILE_H * 1.4142;
    _fpDisc(it.x, it.y, 0, 0.95, "rgba(10,18,30,0.8)", null);   // the pad: a dark disc
    ctx.lineWidth = 3; ctx.strokeStyle = _fpRgba(col, full ? 0.55 + 0.35 * pul : 0.22); ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, 6.2832); ctx.stroke();   // a ring in its element's colour
    if (full) { _fpGlow(c[0], c[1] - 10, 42, col, 0.26 * pul); ctx.lineWidth = 1.5; ctx.strokeStyle = _fpRgba(col, 0.5); ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * 0.6, ry * 0.6, 0, 0, 6.2832); ctx.stroke(); }
    else {   // empty: an arc round the ring that fills as the next egg comes
        const k = Math.max(0, Math.min(1, 1 - (s.readyAt - f) / FP_SPOT.refill)); ctx.lineWidth = 3; ctx.strokeStyle = _fpRgba(col, 0.7); ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, -1.5708, -1.5708 + 6.2832 * k); ctx.stroke();
    }
    if (full && Math.hypot(it.x - player.visualX, it.y - player.visualY) < FP_SPOT.label) {   // what it is
        const p = _fpP(it.x, it.y, 92), text = roleLabel(s.type) + " · " + (def ? def.label : String(s.element).toUpperCase());
        ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(4,8,16,0.9)"; ctx.strokeText(text, p[0], p[1]); ctx.fillStyle = col; ctx.fillText(text, p[0], p[1]);
    }
}
