// ─────────────────────────────────────────────────────────
//  THE ICE MAGE'S SPECIMEN RECOVERY, AND THE RESURRECTION ZONE (docs/SPECIMENS.md)
// ─────────────────────────────────────────────────────────
// ASKED (the brief, "Ice Mage Follower and Specimen Recovery"): "A special Ice Mage follower can preserve fallen allied creatures for resurrection. 1. A friendly creature dies and leaves a recoverable body.
// 2. The player approaches the body and holds the interaction input. 3. The player selects the recovery/revive interaction. 4. The Ice Mage freezes and preserves the fallen specimen. 5. The main character
// handles the specimen's containment capsule and transports it to the Resurrection Zone. 6. The capsule can then be used at the Resurrection Zone to restore the specimen."
// "The main character handles the capsule; do not make the Ice Mage carry it." "Preserve the distinction between recovering a body and completing its resurrection." "Do not invent additional recovery
// rules or penalties without approval."
//   THE BODIES       the Mutator's clone leaves one when it falls (js/mutator.js cloneFallen); so does a FOLLOWER THAT FALLS FOR GOOD (its HP stat ran out: js/game.js would otherwise lose it). A follower that
//                    falls and comes back at the Crystal, as followers do, leaves none: it needs nothing.
//   PRESERVE         the body's long-press ring (js/draw.js), RIGHT. The player must be near it (they walk there first). The nearest ICE MAGE (a follower of yours: ice, a mage; the show room's egg is one)
//                    within SPECIMEN.mage.range walks to the body and freezes it (a beam of ice, a ring filling round the body: SPECIMEN.freeze.frames). With none, the ring says so and nothing happens.
//   THE CAPSULE      the frozen body is a containment capsule on the floor. The PLAYER picks it up (walking over it, as with a supply case) and it goes in the pack (ITEMS.specimen_capsule). The Ice Mage only freezes.
//   THE RESURRECTION ZONE   the Crystal, where the fallen have always come back (js/game.js's respawn queue). With a capsule in the pack its ring lights up; standing in it, the plate (tap it, or E) restores
//                    the specimen AS IT WAS: the clone with its level, upgrades and what it cost (as the Mutator's clone again), the follower with its record. Carrying the capsule restores nothing.
// Every number is a knob (SPECIMEN): none is a decision.
const SPECIMEN = {
    mage:    { element: "ice", role: "sniper", range: 14 },   // who freezes a body: a follower of yours of this element and role (an ICE MAGE), within `range` tiles of it
    freeze:  { frames: 120, near: 2.0, replan: 30 },          // the freezing: how long the Ice Mage works at it (frames), how near the body it stands to do it, how often its walk there is set again
    capsule: { item: "specimen_capsule", pick: 0.9 },          // the containment capsule: the item it is in the pack, how near the player walks to take it
    zone:    { radius: 2.6 },                                  // the RESURRECTION ZONE: within this many tiles of the Crystal
};

let specimenCarried = [];   // the capsules in the pack, in the order they were taken (each the specimen it holds: { kind, sp, cls, level, xp, upgrades, invested } or { kind: "follower", rec })
let _pres = null;           // the preservation under way: { body, mage, phase: "walk" | "cast", t, setAt }
function _spFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _spSay(text, col, big) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#aeeaff", life: big ? 200 : 120, vy: -0.2, size: big ? 15 : 13 }); }
function specimenReset() { specimenCarried = []; _pres = null; }

// ── who it is ──
function specimenName(b) {
    if (!b) return "SPECIMEN";
    if (b.kind === "follower") { const r = b.rec || {}; return r.evolved && typeof EVOLUTIONS !== "undefined" && EVOLUTIONS[r.evolved] ? EVOLUTIONS[r.evolved].name : String(r.element || "").toUpperCase() + " " + (typeof roleLabel === "function" ? roleLabel(r.role) : String(r.role || "").toUpperCase()); }
    return String(b.sp || "").toUpperCase() + " " + String(b.cls || "").toUpperCase() + " CLONE";
}
// an ICE MAGE: a live follower of yours of the element and role (an evolved form counts by its form's: EVOLUTIONS[id].element and .role)
function specimenIsMage(f) {
    if (!f || f.dead || f.team !== "green" || f.isFollower !== true || f.isClone || f.returningToCrystal) return false;
    const evo = f.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[f.evolved] : null, el = evo && evo.element ? evo.element : f.element, role = evo && evo.role ? evo.role : f.role;
    return el === SPECIMEN.mage.element && role === SPECIMEN.mage.role;
}
// the nearest Ice Mage within range of a body, or null
function specimenMage(b) {
    let best = null, bd = SPECIMEN.mage.range; if (!b || typeof followers === "undefined") return null;
    for (const f of followers) { if (!specimenIsMage(f)) continue; const d = Math.hypot(f.x - b.x, f.y - b.y); if (d <= bd) { bd = d; best = f; } }
    return best;
}

// ── a follower that falls for good leaves its body (js/game.js, the death sweep: its HP stat has run out) ──
function specimenFollowerFell(a) {
    if (!a || typeof cloneBodies === "undefined") return null;
    const rec = typeof followerRecord === "function" ? followerRecord(a) : { element: a.element, role: a.role, level: a.level };
    delete rec.cards; if (typeof equipClear === "function") equipClear(a);   // it fell for good: its equip cards are back, and the body, preserved and restored later, has empty slots (js/cards.js)
    const b = { id: ++_bodyN, kind: "follower", rec, actor: a, x: a.x, y: a.y, dirX: a.dirX || 1, dirY: a.dirY || 0, t0: _spFrame(), level: a.level };
    cloneBodies.push(b);
    _spSay(specimenName(b) + " HAS FALLEN FOR GOOD — AN ICE MAGE CAN PRESERVE ITS BODY", "#aeeaff", true);
    return b;
}

// ── the ring (js/mutator.js mutatorBodyRing asks): PRESERVE on the right; a frozen body is a capsule, with no orders (it is taken by walking over it) ──
function cloneBodyRingMore(b, ring) {
    if (b.kind === "follower") { ring.up = null; ring.caption = specimenName(b) + " · FALLEN FOR GOOD · LV " + (b.level || "?"); }
    if (b.frozen) { ring.up = null; ring.right = null; ring.caption = "SPECIMEN CAPSULE · " + specimenName(b) + " · WALK OVER IT TO TAKE IT"; return ring; }
    const m = specimenMage(b);
    ring.right = { label: m ? "PRESERVE" : "PRESERVE · NO ICE MAGE", act: "preserve_body" };
    return ring;
}
// a body's order (js/commands.js; js/mutator.js mutatorBodiesTick when the player arrives at it)
function cloneBodyAct(b, act) {
    if (act !== "preserve" || !b || !cloneBodies.includes(b)) return false;
    if (b.frozen) { _spSay("IT IS PRESERVED — WALK OVER THE CAPSULE TO TAKE IT"); return false; }
    if (_pres && _pres.body === b) return true;
    if (!cloneBodyNear(b)) { cloneBodyWalk(b, "preserve"); return null; }   // "the player approaches the body"
    const m = specimenMage(b);
    if (!m) { _spSay("AN ICE MAGE IS NEEDED TO PRESERVE IT: A FOLLOWER OF ICE THAT IS A MAGE, WITHIN " + SPECIMEN.mage.range + " TILES", "#ff9c8a", true); return false; }
    _pres = { body: b, mage: m, phase: "walk", t: 0, setAt: -1e9 };
    _spSay("THE ICE MAGE IS COMING TO PRESERVE THE " + specimenName(b), "#aeeaff");
    return true;
}
// stop a preservation: the Ice Mage lets go of its job (back to following, or to the room it holds)
function _presStop(say) {
    const P = _pres; _pres = null; if (!P) return;
    if (P.mage && P.mage.job && P.mage.job.specimen) P.mage.job = null;
    if (say) _spSay(say, "#ff9c8a");
}

// ── each step (js/game.js) ──
function specimenTick() {
    if (typeof cloneBodies === "undefined") return;
    const f = _spFrame(), P = _pres;
    // THE FREEZING: the Ice Mage walks to the body, then works at it; it stops if the mage or the body is gone
    if (P) {
        const b = P.body, m = P.mage;
        if (!cloneBodies.includes(b) || b.frozen) _presStop(null);
        else if (!m || m.dead || !specimenIsMage(m)) _presStop("THE ICE MAGE IS GONE — THE BODY WAS NOT PRESERVED");
        else {
            const d = Math.hypot(m.x - b.x, m.y - b.y);
            if (P.phase === "walk") {
                if (d <= SPECIMEN.freeze.near) { P.phase = "cast"; P.t = 0; m.job = { type: "move", target: { x: m.x, y: m.y }, specimen: true }; }
                else if (f - P.setAt >= SPECIMEN.freeze.replan || !m.job || !m.job.specimen) { P.setAt = f; const k = Math.max(0, d - SPECIMEN.freeze.near * 0.6) / (d || 1); m.job = { type: "move", target: { x: m.x + (b.x - m.x) * k, y: m.y + (b.y - m.y) * k }, specimen: true }; }
            } else {
                if (d > SPECIMEN.freeze.near + 1) { P.phase = "walk"; P.setAt = -1e9; }   // (pushed off it, or it went to fight: it comes back to it)
                else if (++P.t >= SPECIMEN.freeze.frames) {
                    b.frozen = true; b.frozenAt = f; _presStop(null);
                    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: b.x, y: b.y, color: "#aeeaff", radius: 1.0, life: 30 });
                    _spSay("PRESERVED — TAKE THE CAPSULE TO THE RESURRECTION ZONE: THE CRYSTAL", "#aeeaff", true);
                }
            }
        }
    }
    // THE CAPSULE: the player takes it by walking over it (the Ice Mage never does)
    for (const b of cloneBodies) {
        if (!b.frozen || Math.hypot(b.x - player.x, b.y - player.y) > SPECIMEN.capsule.pick) continue;
        if (typeof invRoom === "function" && invRoom(SPECIMEN.capsule.item) <= 0) { if (!b._fullSaid || f - b._fullSaid > 240) { b._fullSaid = f; _spSay("NO ROOM IN YOUR PACK FOR ANOTHER CAPSULE", "#ff9c8a"); } continue; }
        if (typeof invAdd === "function") invAdd(SPECIMEN.capsule.item, 1);
        specimenCarried.push(_spRecord(b)); cloneBodies = cloneBodies.filter(x => x !== b);
        _spSay("SPECIMEN CAPSULE TAKEN: " + specimenName(b) + " — TO THE RESURRECTION ZONE (THE CRYSTAL)", "#aeeaff", true);
        break;
    }
}
// what a capsule holds: the body's specimen, as it was
function _spRecord(b) { return b.kind === "follower" ? { kind: "follower", rec: b.rec, level: b.level } : { kind: "clone", sp: b.sp, cls: b.cls, level: b.level, xp: b.xp, upgrades: Object.assign({}, b.upgrades || {}), invested: b.invested || 0 }; }

// ── THE RESURRECTION ZONE: the Crystal ──
function specimenInZone() { return typeof crystal !== "undefined" && crystal && Math.hypot(player.x - crystal.x, player.y - crystal.y) <= SPECIMEN.zone.radius; }
function specimenReady() { return specimenCarried.length > 0 && specimenInZone(); }
// use the first capsule here: the specimen comes back at the Crystal as it was. Returns the unit, or null (and says why).
function specimenRestore() {
    if (!specimenCarried.length) { _spSay("NO SPECIMEN CAPSULE IN YOUR PACK", "#ff9c8a"); return null; }
    if (!specimenInZone()) { _spSay("TAKE IT TO THE RESURRECTION ZONE: THE CRYSTAL", "#ff9c8a"); return null; }
    const s = specimenCarried[0]; let u = null;
    if (s.kind === "clone") {
        if (typeof cloneLiveCount === "function" && typeof cloneCap === "function" && cloneLiveCount() >= cloneCap()) { _spSay("ONE CLONE AT A TIME — RELEASE YOURS FIRST (THE CAPSULE IS KEPT)", "#ff9c8a", true); return null; }
        u = typeof makeClone === "function" ? makeClone(s.sp, s.cls, crystal.x + 0.8, crystal.y + 0.8, "hunt", { level: s.level, xp: s.xp }) : null;
        if (u && typeof mutatorCloneRestore === "function") mutatorCloneRestore(u, { pr: 1, up: s.upgrades, inv: s.invested });
    } else if (s.kind === "follower" && typeof spawnFollowerFromSave === "function") {
        u = spawnFollowerFromSave(s.rec); u.returningToCrystal = false; u.health = u.maxHealth;
    }
    if (!u) return null;
    specimenCarried.shift(); if (typeof invRemove === "function") invRemove(SPECIMEN.capsule.item, 1);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: crystal.x, y: crystal.y, color: "#aeeaff", radius: 1.6, life: 40 });
    _spSay("THE SPECIMEN IS RESTORED: " + (s.kind === "follower" ? specimenName({ kind: "follower", rec: s.rec }) : specimenName(s)), "#9dffb6", true);
    return u;
}
// the pack's USE of a capsule (js/inventory.js)
function specimenUseItem() { const u = specimenRestore(); return u ? { ok: true, msg: "RESTORED" } : { ok: false, why: specimenCarried.length ? (specimenInZone() ? "IT COULD NOT COME BACK NOW" : "TAKE IT TO THE RESURRECTION ZONE: THE CRYSTAL") : "NO SPECIMEN IN IT" }; }

// ── drawing: a frozen body is a capsule; the Ice Mage's beam while it works; the zone's ring and its plate ──
function _spScr(x, y) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)]; }
// the capsule over a frozen body (js/mutator.js drawCloneBody calls this after the body)
function drawSpecimenCapsule(b, px, py) {
    const f = _spFrame(), w = 46, h = 64, x = px - w / 2, y = py - h + 8, pul = 0.6 + 0.4 * Math.sin(f * 0.07 + b.id);
    ctx.save();
    ctx.globalAlpha = 0.42; ctx.fillStyle = "#bfeaff"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 14); else ctx.rect(x, y, w, h); ctx.fill();   // the ice and the glass
    ctx.globalAlpha = 0.85; ctx.strokeStyle = "#e9f8ff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 0.35 * pul; ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 8, y + 8, 5, h - 16);   // a glint
    ctx.globalAlpha = 1; ctx.fillStyle = "#5d6b80"; ctx.fillRect(x - 3, y - 4, w + 6, 8); ctx.fillRect(x - 3, y + h - 4, w + 6, 8);   // the caps
    ctx.fillStyle = "#aeeaff"; ctx.fillRect(x + w / 2 - 5, y - 2, 10, 3);
    ctx.restore();
}
function drawSpecimenOverlay() {
    if (typeof ctx === "undefined" || typeof canvas === "undefined") return;
    const f = _spFrame();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the Ice Mage's beam and the ring filling round the body
    const P = _pres;
    if (P && P.body && P.mage) {
        const [bx, by] = _spScr(P.body.x, P.body.y), [mx, my] = _spScr(P.mage.x, P.mage.y), k = P.phase === "cast" ? Math.min(1, P.t / SPECIMEN.freeze.frames) : 0;
        if (P.phase === "cast") {
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(f * 0.5); ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(mx, my - 40); ctx.lineTo(bx, by - 12); ctx.stroke();
            ctx.globalAlpha = 1; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
            for (let i = 0; i < 4; i++) { const t = ((f * 0.04 + i / 4) % 1), sx = mx + (bx - mx) * t, sy = my - 40 + (by - 12 - (my - 40)) * t; ctx.fillStyle = "#e9f8ff"; ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.globalAlpha = 0.9; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(10,20,40,0.8)"; ctx.beginPath(); ctx.arc(bx, by - 30, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "#aeeaff"; ctx.beginPath(); ctx.arc(bx, by - 30, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
        ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#e9f8ff"; ctx.fillText(P.phase === "cast" ? "PRESERVING" : "ICE MAGE COMING", bx, by - 60);
    }
    // the RESURRECTION ZONE, while a capsule is carried: a ring round the Crystal; and the plate when the player stands in it
    if (specimenCarried.length && typeof crystal !== "undefined" && crystal) {
        const [cx, cy] = _spScr(crystal.x, crystal.y), pul = 0.6 + 0.4 * Math.sin(f * 0.06);
        ctx.save(); ctx.translate(cx, cy + TILE_H); ctx.scale(1, TILE_H / TILE_W);
        ctx.globalAlpha = 0.25 + 0.2 * pul; ctx.strokeStyle = "#aeeaff"; ctx.lineWidth = 6; ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.arc(0, 0, SPECIMEN.zone.radius * TILE_W * Math.SQRT2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);   // (a circle of that many tiles on the iso floor)
        ctx.restore();
        ctx.globalAlpha = 0.9; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#aeeaff"; ctx.fillText("RESURRECTION ZONE", cx, cy + TILE_H + SPECIMEN.zone.radius * TILE_H + 22);
        ctx.globalAlpha = 1;
        if (specimenInZone() && typeof uiButton === "function") { const r = _spPlate(); uiButton(r, "RESTORE: " + (specimenCarried[0].kind === "follower" ? specimenName({ kind: "follower", rec: specimenCarried[0].rec }) : specimenName(specimenCarried[0])), "#aeeaff", false, 15, "TAP OR PRESS E · " + specimenCarried.length + " CAPSULE" + (specimenCarried.length > 1 ? "S" : "")); }
    }
    ctx.restore();
}
function _spPlate() { const W = canvas.width, H = canvas.height; return { x: Math.round(W / 2 - 200), y: Math.round(H / 2 + 140), w: 400, h: 56 }; }
// a tap (js/input.js): on the plate, in the zone, restores; true when it was the plate's
function specimenTap(ex, ey) {
    if (!specimenReady()) return false;
    const r = _spPlate(); if (ex < r.x || ex > r.x + r.w || ey < r.y || ey > r.y + r.h) return false;
    specimenRestore(); return true;
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && !e.repeat && (e.key === "e" || e.key === "E") && typeof facilityPlay !== "undefined" && facilityPlay && specimenReady() && !(typeof _fp !== "undefined" && _fp && _fp.stationNear) && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) specimenRestore(); }); } catch (e) { /* no page (the test sandbox) */ }

// ── saving (js/facilitysave.js) ──
function specimenSnapshot() { return specimenCarried.map(s => Object.assign({}, s)); }
function specimenApply(list) {
    specimenCarried = Array.isArray(list) ? list.filter(s => s && (s.kind === "follower" ? s.rec : typeof SPECIES !== "undefined" && SPECIES[s.sp])).map(s => Object.assign({}, s)) : [];
    if (typeof playerInv !== "undefined") { if (specimenCarried.length) playerInv[SPECIMEN.capsule.item] = specimenCarried.length; else delete playerInv[SPECIMEN.capsule.item]; }   // (the pack's count is the capsules')
    return specimenCarried.length;
}
