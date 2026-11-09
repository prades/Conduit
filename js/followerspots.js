// ─────────────────────────────────────────────────────────
//  RECRUITMENT POSTS: a follower waits in its egg on its pad, as one type and one element, free, once
// ─────────────────────────────────────────────────────────
// ASKED: "put a few spots where the followers exist and will respawn there, and they'll have a fixed type and a fixed element." Then (the archive's Next Major Update Framework, the follow-up scope of 2026-10-31):
// "Each recruit post/location in the facility can yield its available follower only once. Mark the post as exhausted after successful recruitment and preserve that state through revisits, transitions, and save/load";
// "Make exhausted posts visibly distinguishable and explain that their recruit has already been claimed." The brief's price of ◆200 on a post was built and asked about; the owner's answer (2026-10-31): a post is FREE,
// once (the archive's Sanctuary page: "a free one-time post"); the roster's RECRUIT is the direct purchase at ◆200 (js/clone.js). FP_SPOT.price is kept at 0: a price set there would be asked for again, said on the pad
// and refused when short (the egg stays, nothing is taken, nothing is made), as it was.
// A post (the map's `followerSpots`, js/facilitymap.js) is a pad on the floor in its element's colour, with the follower on it as a grey egg and a label over it: its type (BRAWLER, MAGE, TECHNICIAN) and its element.
// Since build 2026-11-09s (energy cards: a recruit starts elementless) the follower is of NO ELEMENT: the pad is in its grey, the label its type alone (_fpSpotElement).
// Both are the post's, never the player's: there is nothing to choose, and the follower that joins is exactly that.
//   TAKE      walking up to the egg (FP_SPOT.take tiles) makes it a follower there and then (spawnFollowerAtCrystal with the post's element and type, put on the pad, no walk home to the Crystal first), and claims the
//             post, in one step; with the squad full, who makes room is asked first and the post is claimed once that is chosen (js/party.js partyPickOpen)
//   ONCE      a claimed post is EXHAUSTED: its pad goes dark and says CLAIMED; it never fills again. The other posts are each their own: one claimed changes nothing on the next (there is no limit on how many you claim).
//   SAVED     the claimed posts are part of the saved game (js/facilitysave.js), so a reload, leaving the room or the facility is not a way to claim one again (a save from before this rule, whose empty spots carried a refill
//             delay, reads those spots as claimed: the egg was taken)
// The egg is an ordinary neutral recruit (a grey egg: it does nothing, is nobody's target, and the walk-up-and-it-walks-home conversion is skipped for it, js/game.js). The quick RECRUIT of the roster (js/clone.js, RECRUIT_COST)
// is the paid way in, and is not limited.

const FP_SPOT = { take: 1.5, price: 0, near: 4, label: 8 };   // tiles to take it; shards it costs (0: free, the owner's decision of 2026-10-31); tiles the player must be off for an egg to be put back; tiles within which its label shows

function facilityFollowerSpotsStart(F) {
    if (!_fp || !_fp.items) return;
    _fp.items = _fp.items.filter(i => i.fp !== "spot"); _fp.spots = [];
    for (const p of (F.followerSpots || [])) {
        const s = { id: p.id, room: p.room, x: p.at[0], y: p.at[1], type: p.type, element: p.element, egg: null, used: false, arrive: undefined, taken: 0 };
        _fp.spots.push(s);
        _fp.items.push({ type: "fp", fp: "spot", id: p.id, room: p.room, x: s.x, y: s.y, depth: s.x + s.y - 0.25, base: facilityRoomHeight(p.room, F) * FP_ELEV_PX, seed: _fpHash(Math.round(s.x * 3), Math.round(s.y * 5)), spot: s });
    }
}
// ITS ELEMENT: a recruit starts elementless (docs/ENERGY-CARDS.md rule 12, build 2026-11-09s): the egg on the pad is the clear, unlit crystal and the follower that joins has no element until you give it an
// energy card. The post's own element in the map (js/facilitymap.js `followerSpots`) is kept, unused while that rule holds.
function _fpSpotElement(s) { return typeof ENERGY_NONE !== "undefined" ? ENERGY_NONE : s.element; }
// the egg: a neutral recruit made as the world makes one (js/world.js), of the post's type and element
function _fpSpotEgg(s) {
    const def = NPC_TYPES["virus"], personality = personalityForType(s.type), stats = applyPersonality(personality), role = assignRole(stats);
    return { type: "virus", element: _fpSpotElement(s), x: s.x, y: s.y, team: "red", convertFlash: 0, isNeutralRecruit: true, health: stats.hp, maxHealth: stats.hp, moveSpeed: def.moveSpeed, power: stats.attack,
             stats, personality, role, currentResonance: 0, currentWill: stats.will, targetX: s.x, targetY: s.y, walkCycle: 0, moveCooldown: 0, stance: "follow", isFollower: false, isHealing: false,
             hitFlash: 0, spawnProtection: 0, dead: false, fpSpot: s.id };
}
function _fpSpotLabel(s) { const el = _fpSpotElement(s), def = ELEMENTS.find(e => e.id === el); return def && def.none ? roleLabel(s.type) : roleLabel(s.type) + " · " + (def ? def.label.toUpperCase() : String(el).toUpperCase()); }   // (no element: its role alone)
function _fpSpotSay(text, good) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: good ? "#9dffb6" : "#ff8a6a", life: 110, vy: -0.2, size: 13 }); }
// can this post be claimed now? { ok } or { ok: false, why }
function facilityFollowerSpotCan(s) {
    if (!s) return { ok: false, why: "NO POST" };
    if (s.used) return { ok: false, why: "THIS POST'S RECRUIT HAS BEEN CLAIMED" };
    if (!s.egg) return { ok: false, why: "NOTHING WAITS HERE YET" };
    const have = typeof shardCount === "number" ? shardCount : 0;
    if (FP_SPOT.price > 0 && have < FP_SPOT.price) return { ok: false, why: "NEED ◆" + FP_SPOT.price + " FOR THIS POST · YOU HAVE ◆" + have };
    return { ok: true };
}
// the claim, in one step: the egg becomes the follower, the price (if any) is taken, the post is exhausted. Returns the follower, or null when nothing was claimed (nothing taken then).
function facilityFollowerSpotTake(s) {
    const can = facilityFollowerSpotCan(s); if (!can.ok) { if (!s || !s.said) _fpSpotSay(can.why); if (s) s.said = true; return null; }
    if (typeof spawnFollowerAtCrystal !== "function") return null;
    const egg = s.egg, k = egg ? actors.indexOf(egg) : -1; if (k >= 0) actors.splice(k, 1);
    s.egg = null; s.used = true; s.taken++; shardCount -= FP_SPOT.price;
    spawnFollowerAtCrystal(_fpSpotElement(s), s.type);
    const f = followers[followers.length - 1]; if (!f) return null;
    f.x = s.x; f.y = s.y; f.returningToCrystal = false; f.convertFlash = 30; f.fromSpot = s.id;
    if (f.post) { if (typeof partyPlace === "function") partyPlace(f, s.room, true); else f.post = s.room; } else f.stance = "follow";   // (the squad was full: it holds the room the egg was in, or the nearest with a place: js/party.js)
    const def = ELEMENTS.find(e => e.id === f.element);
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: _fpSpotLabel(s) + (f.post ? " HOLDS THE " + partyRoomName(f.post).toUpperCase() : " JOINED!") + (def && def.none ? " · NO ELEMENT YET" : "") + (FP_SPOT.price > 0 ? " · ◆" + FP_SPOT.price : ""), color: def ? def.color : "#fff", life: 120, vy: -0.2, size: 14 });
    return f;
}
// each frame (from facilityTutorialTick)
function facilityFollowerSpotsTick() {
    const S = _fp && _fp.spots; if (!S || !S.length) return;
    for (const s of S) {
        if (s.egg && (s.egg.dead || !actors.includes(s.egg))) s.egg = null;   // (gone some other way: unclaimed, it is put back below)
        const near = Math.hypot(player.x - s.x, player.y - s.y);
        if (s.used) continue;
        if (s.egg) {
            if (near < FP_SPOT.take) {
                if (!facilityFollowerSpotCan(s).ok) { if (!s.said) { facilityFollowerSpotTake(s); } }   // (short of the price: it says so once, nothing is taken, the egg stays; said again after walking away and back)
                // the squad full: asked first who makes room (js/party.js partyPickOpen); the egg is taken once that is chosen, and asked again only after walking away and back
                else if (typeof partyFull === "function" && typeof partyOn === "function" && partyOn() && partyFull() && typeof partyPickOpen === "function") {
                    if (!s.asked && !partyPickBusy()) { s.asked = true; partyPickOpen(_fpSpotLabel(s) + (FP_SPOT.price > 0 ? " · ◆" + FP_SPOT.price : ""), [s.x, s.y], () => { if (s.egg && !s.used) facilityFollowerSpotTake(s); }, null); }
                } else facilityFollowerSpotTake(s);
            } else if (near > FP_SPOT.take + 1) { s.asked = false; s.said = false; }
        } else if (near > FP_SPOT.near) { s.egg = _fpSpotEgg(s); actors.push(s.egg); s.arrive = _fpFrame(); }
    }
}
// the saved game: the posts claimed (an older save's refill delays, kept for empty spots, read as claimed)
function followerSpotsSnapshot() {
    const out = {}; for (const s of ((_fp && _fp.spots) || [])) if (s.used) out[s.id] = 1;
    return out;
}
function followerSpotsApply(d) {
    if (!d || typeof d !== "object" || !_fp || !_fp.spots) return;
    for (const s of _fp.spots) if (d[s.id] !== undefined && d[s.id] !== null && d[s.id] !== false) { if (s.egg) { const k = actors.indexOf(s.egg); if (k >= 0) actors.splice(k, 1); s.egg = null; } s.used = true; }
}

// the pad and its label (js/facilityplay.js drawFacilityItem): lit and ringed with an egg on it, dark and CLAIMED once it is exhausted
function _fpDrawSpot(it) {
    const s = it.spot, f = _fpFrame(), el = _fpSpotElement(s), def = ELEMENTS.find(e => e.id === el), col = def ? def.color : "#9fe8ff", full = !!s.egg && !s.used, pul = 0.7 + 0.3 * Math.sin(f * 0.07 + it.seed);
    const c = _fpP(it.x, it.y, 0), rx = 0.82 * TILE_W * 1.4142, ry = 0.82 * TILE_H * 1.4142;
    _fpDisc(it.x, it.y, 0, 0.95, s.used ? "rgba(6,9,14,0.85)" : "rgba(10,18,30,0.8)", null);   // the pad: a dark disc
    ctx.lineWidth = 3; ctx.strokeStyle = _fpRgba(col, full ? 0.55 + 0.35 * pul : s.used ? 0.14 : 0.22); ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, 6.2832); ctx.stroke();   // a ring in its element's colour
    if (full) { _fpGlow(c[0], c[1] - 10, 42, col, 0.26 * pul); ctx.lineWidth = 1.5; ctx.strokeStyle = _fpRgba(col, 0.5); ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * 0.6, ry * 0.6, 0, 0, 6.2832); ctx.stroke(); }
    else if (s.used) { ctx.lineWidth = 2; ctx.strokeStyle = "rgba(120,130,150,0.35)"; ctx.beginPath(); ctx.moveTo(c[0] - rx * 0.3, c[1] - ry * 0.3); ctx.lineTo(c[0] + rx * 0.3, c[1] + ry * 0.3); ctx.moveTo(c[0] + rx * 0.3, c[1] - ry * 0.3); ctx.lineTo(c[0] - rx * 0.3, c[1] + ry * 0.3); ctx.stroke(); }   // claimed: a cross on the dark pad
    if ((full || s.used) && Math.hypot(it.x - player.visualX, it.y - player.visualY) < FP_SPOT.label) {   // what it is, and what it costs (if anything), or that it is claimed
        const p = _fpP(it.x, it.y, 92), text = s.used ? "CLAIMED" : _fpSpotLabel(s), have = typeof shardCount === "number" ? shardCount : 0, short = !s.used && FP_SPOT.price > 0 && have < FP_SPOT.price;
        ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(4,8,16,0.9)";
        ctx.strokeText(text, p[0], p[1]); ctx.fillStyle = s.used ? "rgba(150,160,180,0.8)" : col; ctx.fillText(text, p[0], p[1]);
        const sub = s.used ? "ITS RECRUIT IS YOURS ALREADY" : FP_SPOT.price > 0 ? "◆" + FP_SPOT.price + (short ? " · YOU HAVE ◆" + have : " · WALK UP TO IT") : "FREE · ONCE · WALK UP TO IT";
        ctx.font = "bold 9px monospace"; ctx.strokeText(sub, p[0], p[1] + 13); ctx.fillStyle = s.used ? "rgba(150,160,180,0.7)" : short ? "#ff8a6a" : "#ffe733"; ctx.fillText(sub, p[0], p[1] + 13);
    }
}
