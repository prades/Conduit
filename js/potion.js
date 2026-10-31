// ─────────────────────────────────────────────────────────
//  THE SLEEPING POTION (docs/SEWER-QUEST.md, "Side Quest and the Sleeping Potion")
// ─────────────────────────────────────────────────────────
// ASKED (the Game Design Archive, 2026-10-31: "Design update — Side Quest and Sleeping Potion", "Sleeping potion — targeting and universal throw input", "Sleeping potion: interrupt behavior"): "Add a dedicated Sleeping
// Potion item/index card. The original potion is sold by Side Quest for 100 shards. The potion is a consumable that is equipped and activated through a universal equipped-item trigger/button available to every
// class [...] Reuse or adapt the existing Mutator serum's floor-throw interaction as the model [...] The original sleeping potion has a large area of effect. It puts all eligible characters in the area to sleep,
// including the player's followers, but never the player character. The player's crafted/reverse-engineered version targets enemies only [...] throwing the sleeping potion can interrupt any attack [...] For the
// Toxic Queen, the potion also applies the planned sleep effect (target duration approximately 5 seconds) [...] Sewer boss special case: using the potion on the sewer boss enables the player to buy another potion
// for 50 shards [...] If the player loses the potion and needs a replacement, Side Quest charges 100 shards [...] The lab-produced copy has one-fourth the effectiveness."
//   THE ITEMS      ITEMS.sleeping_potion (the original) and ITEMS.sleeping_potion_copy (js/inventory.js): tools of the pack whose button EQUIPS them (potionUse). One kind is equipped at a time; equipped, the POTION
//                  pill stands beside the ammunition for every class (drawPotionChip, js/targeting.js) and the key POTION.key is the same: either THROWS it (potionThrow). That is the serum's own model (js/serum.js:
//                  the pack's USE, the pill, Q), with a throw instead of a splash at the feet.
//   THE THROW      it flies POTION.flight frames and shatters where it lands: at your feet, as the serum does, or at the creature your dial has locked (js/targeting.js targetCurrent) when that is within POTION.reach
//                  tiles in the same room (a lob over the console). Where it shatters, everyone eligible within POTION.radius SLEEPS (js/combat.js applySleep: POTION.sleep frames; the attack it was in is cancelled and nothing of it lands later;
//                  a boss's projectile timers are reset, js/bosses.js bossOnSleep): the ORIGINAL takes enemies and your followers and clones, never you; the COPY enemies only, for POTION.copyFactor of the sleep
//                  (the archive's "one-fourth effectiveness", read as the sleep's length: the archive asks for the measure to be defined; this is the implementer's reading).
//   THE ECONOMY    Side Quest sells the original (js/sidequest.js → potionBuy) for POTION.price; once a potion has put a BOSS to sleep (the Sewers' queen) the next one is POTION.bossPrice (`discount`, spent by that
//                  purchase); otherwise a replacement is the full price (the archive's "lost potion" rule: the game tracks it, he need not see it). The archive's older "50 coins after a use in combat" is NOT built:
//                  it conflicts with the 50-shard rule and the game has no coins; the design is to resolve it (docs/OPEN-QUESTIONS.md). The lab COPIES the original at the analysis bench (js/quests.js) for
//                  POTION.copyPrice; the original stays in the pack. One original at a time (its stack), two copies.
//   PROVISIONAL    every number but the three prices and the queen's five seconds: the radius, the reach, the flight, a sleep of the same length on every creature, the copy's quarter, that damage does not wake a
//                  sleeper (your followers must be able to hold a sleeping queen: the archive leaves "resistance" open).
const POTION = {
    original: "sleeping_potion", copy: "sleeping_potion_copy",
    price: 100, bossPrice: 50, copyPrice: 100,   // the archive's: ◆100 from Side Quest; ◆50 for the next once it has been used on the Sewers' boss; ◆100 at the Experiment Lab for a copy
    sleep: 300, copyFactor: 0.25,                // the archive's "about 5 seconds" on the queen (PROVISIONAL for every other creature); the copy's "one-fourth effectiveness" as one-fourth of the sleep
    radius: 3, reach: 4, flight: 20,             // PROVISIONAL: "a large area of effect"; the toss reaches a locked creature this far; frames in the air
    key: "t",                                    // the universal key (the serum's is Q, the stations' E, the pack's I)
};
let potionFlights = [], potionSplashes = [];
let _POTIONCHIP = { x: 0, y: 0, w: 0, h: 0 };
function _ptFrame() { return typeof frame !== "undefined" ? frame : 0; }
function potionState() {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.potion) _fp.potion = { equipped: null, bought: 0, copies: 0, thrown: 0, bossUses: 0, discount: false };
    return _fp.potion;
}
function potionReset() { potionFlights = []; potionSplashes = []; if (typeof _fp !== "undefined" && _fp) _fp.potion = null; }
function potionIsPotion(id) { return id === POTION.original || id === POTION.copy; }
// the potion in hand: the equipped kind while the pack holds one, else nothing (thrown or gone, it is no longer in hand)
function potionEquipped() { const S = potionState(); if (!S) return null; if (S.equipped && !(typeof invHas === "function" && invHas(S.equipped))) S.equipped = null; return S.equipped; }
function potionEquip(id) { const S = potionState(); if (!S || !potionIsPotion(id) || !(typeof invHas === "function" && invHas(id))) return false; S.equipped = id; return true; }
function potionUnequip() { const S = potionState(); if (S) S.equipped = null; }
// the pack's button (js/inventory.js ITEMS[...].use): EQUIP it, or put it away. A tool: the pack keeps it; the throw takes it
function potionUse(id) {
    if (!potionIsPotion(id)) return { ok: false, why: "NOT A POTION" };
    if (typeof facilityPlay !== "undefined" && !facilityPlay) return { ok: false, why: "NOT IN THE FACILITY" };
    const name = typeof itemDef === "function" && itemDef(id) ? itemDef(id).name : "POTION";
    if (potionEquipped() === id) { potionUnequip(); return { ok: true, msg: name + " PUT AWAY" }; }
    if (!potionEquip(id)) return { ok: false, why: "NONE IN THE PACK" };
    return { ok: true, msg: name + " EQUIPPED — THE POTION PILL, OR " + POTION.key.toUpperCase() + ", THROWS IT" };
}
function potionVerb(id) { return potionEquipped() === id ? "UNEQUIP" : "EQUIP"; }
// ── the economy ──
function potionPrice() { const S = potionState(); return S && S.discount ? POTION.bossPrice : POTION.price; }
// Side Quest's shop (js/sidequest.js): one original at today's price
function potionBuyCan() {
    const S = potionState(); if (!S) return { ok: false, why: "NO GAME" };
    const price = potionPrice(), have = typeof shardCount === "number" ? shardCount : 0;
    if (typeof invRoom === "function" && invRoom(POTION.original) < 1) return { ok: false, why: "YOU HAVE ONE · THROW IT BEFORE YOU BUY ANOTHER" };
    if (have < price) return { ok: false, why: "NEED ◆" + (price - have) + " MORE FOR THE POTION (◆" + price + ")" };
    return { ok: true, price };
}
function potionBuy() {
    const can = potionBuyCan(); if (!can.ok) return can;
    const S = potionState(), price = can.price, was = S.discount;
    shardCount -= price; invAdd(POTION.original, 1); S.bought++; S.discount = false;
    if (!potionEquipped()) potionEquip(POTION.original);
    return { ok: true, price, msg: "SLEEPING POTION — ◆" + price + (was ? " (HALF: IT PUT THE QUEEN TO SLEEP)" : "") + ". " + (potionEquipped() === POTION.original ? "EQUIPPED: THE POTION PILL, OR " + POTION.key.toUpperCase() + ", THROWS IT" : "IN YOUR PACK") };
}
// the Experiment Lab's copy (the analysis bench, js/quests.js questBenchUse): ◆copyPrice with the original in the pack; the original stays. Side Quest never suggested it
function potionCopyWanted() { return typeof invHas === "function" && invHas(POTION.original); }
function potionCopyVerb() { return "COPY THE SLEEPING POTION ◆" + POTION.copyPrice; }
function potionCopyCan() {
    if (!potionCopyWanted()) return { ok: false, why: "IT WANTS SIDE QUEST'S SLEEPING POTION TO COPY" };
    const have = typeof shardCount === "number" ? shardCount : 0; if (have < POTION.copyPrice) return { ok: false, why: "NEED ◆" + (POTION.copyPrice - have) + " MORE TO COPY THE POTION" };
    if (typeof invRoom === "function" && invRoom(POTION.copy) < 1) return { ok: false, why: "YOUR PACK HOLDS NO MORE COPIES" };
    return { ok: true };
}
function potionCopyUse() {
    const can = potionCopyCan(); if (!can.ok) return can;
    shardCount -= POTION.copyPrice; invAdd(POTION.copy, 1); const S = potionState(); if (S) S.copies++;
    return { ok: true, msg: "THE LAB COPIES THE POTION — A QUARTER OF ITS SLEEP, AND IT SPARES YOUR OWN. THE ORIGINAL IS STILL YOURS" };
}
// ── the throw ──
function potionCanThrow() {
    const id = potionEquipped(); if (!id) return { ok: false, why: "NO POTION EQUIPPED (THE PACK: EQUIP IT)" };
    if (typeof facilityPlay !== "undefined" && !facilityPlay) return { ok: false, why: "NOT IN THE FACILITY" };
    return { ok: true, id };
}
// the pill, the key: the equipped potion flies to where it will shatter: a locked creature within reach and in sight, else your feet
function potionThrow() {
    const can = potionCanThrow(); if (!can.ok) { if (typeof invSay === "function") invSay(can.why, false); return can; }
    const id = can.id, f = _ptFrame(); let lx = player.x, ly = player.y;
    const t = typeof targetCurrent === "function" ? targetCurrent() : null;
    if (t && Number.isFinite(t.x) && Math.hypot(t.x - player.x, t.y - player.y) <= POTION.reach && (typeof partyRoomAt !== "function" || partyRoomAt(t.x, t.y) === partyRoomAt(player.x, player.y))) { lx = t.x; ly = t.y; }   // (a lob: over a console or the sump's edge, in the same room; no line along the floor is needed)
    invRemove(id, 1); const S = potionState(); if (S) S.thrown++;
    potionFlights.push({ id, x0: player.x, y0: player.y, x1: lx, y1: ly, t0: f, until: f + POTION.flight });
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2 + 2, y: canvas.height / 2 - 92, text: "POTION THROWN", color: "#bcd0ff", life: 40, vy: -0.08, size: 11 });
    if (typeof tutTally === "function") tutTally("potion");
    return { ok: true, id, at: [lx, ly] };
}
// a potion shatters: everyone eligible within the radius sleeps. The original takes your followers and clones too (never you); the copy enemies only, for a quarter of the sleep. A boss put to sleep by it (the Sewers' queen)
// makes the next potion cheaper (the archive's 50-shard rule). Returns the units put to sleep
function potionSplash(id, x, y) {
    const orig = id === POTION.original, frames = orig ? POTION.sleep : Math.max(1, Math.round(POTION.sleep * POTION.copyFactor)), R = POTION.radius, hit = [];
    if (typeof actors !== "undefined") for (const a of actors) {
        if (!a || a.dead || a.untargetable || !Number.isFinite(a.x) || Math.hypot(a.x - x, a.y - y) > R) continue;
        if (typeof isNeutralBystander === "function" && isNeutralBystander(a)) continue;   // (a recruit on its way to the Crystal is nobody's)
        if (a.team === "green" && (!orig || !(a.isFollower || a.isClone))) continue;
        if (typeof applySleep !== "function" || !applySleep(a, frames)) continue;
        hit.push(a);
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "SLEEP", color: "#bcd0ff", life: 45, vy: -0.04, size: 12 });
    }
    const S = potionState(); if (S && hit.some(a => a.bossId)) { S.bossUses++; S.discount = true; }
    potionSplashes.push({ x, y, t0: _ptFrame(), until: _ptFrame() + 40, orig });
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x, y, color: "#bcd0ff", radius: 1.0, life: 24 });
    return hit;
}
// each frame (js/facilitytutorial.js facilityTutorialTick): the potions in the air land
function potionTick() {
    if (!potionFlights.length && !potionSplashes.length) return;
    const f = _ptFrame();
    for (const p of potionFlights) if (f >= p.until) potionSplash(p.id, p.x1, p.y1);
    potionFlights = potionFlights.filter(p => f < p.until); potionSplashes = potionSplashes.filter(s => f < s.until);
}
// ── drawing (js/game.js, after the serum's overlay): a potion in the air on its arc with its shadow, the mist where one shattered, and the marks over everyone asleep ──
function _ptScr(x, y, z) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (z || 0) - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)]; }
function drawPotionOverlay() {
    if (typeof ctx === "undefined" || typeof canvas === "undefined" || !canvas || typeof player === "undefined" || typeof actors === "undefined") return;
    const f = _ptFrame(), sleepers = actors.filter(a => a && !a.dead && a.asleep > 0);
    if (!potionFlights.length && !potionSplashes.length && !sleepers.length) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const p of potionFlights) {
        const t = Math.max(0, Math.min(1, (f - p.t0) / Math.max(1, p.until - p.t0))), x = p.x0 + (p.x1 - p.x0) * t, y = p.y0 + (p.y1 - p.y0) * t, z = 30 * (1 - t) + 70 * 4 * t * (1 - t), col = p.id === POTION.copy ? "#dbe3ff" : "#bcd0ff";
        const [gx, gy] = _ptScr(x, y, 0), [sx, sy] = _ptScr(x, y, z);
        ctx.globalAlpha = 0.3; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(gx, gy, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.25; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.95; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy + 1, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#2a3350"; ctx.fillRect(sx - 1.5, sy - 7, 3, 4);
    }
    for (const s of potionSplashes) {
        const k = Math.max(0, Math.min(1, (f - s.t0) / Math.max(1, s.until - s.t0))), [cx, cy] = _ptScr(s.x, s.y, 0), R = POTION.radius * TILE_W * Math.SQRT2 * (0.3 + 0.7 * k);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, TILE_H / TILE_W); ctx.globalAlpha = 0.5 * (1 - k); ctx.strokeStyle = s.orig ? "#bcd0ff" : "#dbe3ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.14 * (1 - k); ctx.fillStyle = "#bcd0ff"; ctx.fill(); ctx.restore();
    }
    if (typeof cachedText === "function") for (const a of sleepers) {   // z z z, drifting up over the sleeper
        const [sx, sy] = _ptScr(a.x, a.y, 0);
        for (let i = 0; i < 3; i++) { const u = ((f * 0.012) + i / 3) % 1; cachedText("z", "bold " + (10 + i * 2) + "px monospace", "#bcd0ff", sx + 12 + i * 7 + Math.sin((f + i * 25) * 0.08) * 3, sy - 112 - u * 26); }
    }
    ctx.restore();
}
// ── THE POTION PILL: beside the ammunition (and the Mutator's serum pill), for every class, while a potion is equipped: which, how many, and a tap throws it ──
function drawPotionChip(x, y, alpha) {
    _POTIONCHIP.w = 0; const id = potionEquipped(); if (!id || typeof ctx === "undefined") return 0;
    const d = typeof itemDef === "function" ? itemDef(id) : null, n = typeof invCount === "function" ? invCount(id) : 0, txt = (id === POTION.copy ? "COPY" : "POTION") + (n > 1 ? " " + n : ""), hh = 22, col = d ? d.col : "#bcd0ff";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha || 1; ctx.font = typeof uiMono === "function" ? uiMono(13) : "bold 13px monospace";
    const w = 24 + ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(10,14,30,0.65)"; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y - hh / 2, w, hh, 11); else ctx.rect(x, y - hh / 2, w, hh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 11, y + 2.5, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 9.5, y - 7, 3, 5);   // a small round flask
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + 20, y + 1);
    ctx.restore();
    _POTIONCHIP = { x: x - 4, y: y - hh / 2 - 4, w: w + 8, h: hh + 8 };
    return w + 8;
}
// a tap on the pill (js/input.js): true when it was the pill's
function potionChipTap(ex, ey) {
    const c = _POTIONCHIP; if (!c.w || ex < c.x || ex > c.x + c.w || ey < c.y || ey > c.y + c.h) return false;
    potionThrow(); return true;
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && !e.repeat && (e.key === POTION.key || e.key === POTION.key.toUpperCase()) && typeof facilityPlay !== "undefined" && facilityPlay && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || "")) && potionEquipped()) potionThrow(); }); } catch (e) { /* no page (the test sandbox) */ }

// ── saving (js/facilitysave.js): which potion is in hand, and the economy's record ──
function potionSnapshot() { const S = potionState(); return S ? { eq: S.equipped, bought: S.bought, copies: S.copies, thrown: S.thrown, boss: S.bossUses, disc: S.discount ? 1 : 0 } : null; }
function potionApply(d) {
    potionReset(); const S = potionState(); if (!S || !d || typeof d !== "object") return false;
    S.equipped = potionIsPotion(d.eq) ? d.eq : null; S.bought = Math.max(0, d.bought | 0); S.copies = Math.max(0, d.copies | 0); S.thrown = Math.max(0, d.thrown | 0); S.bossUses = Math.max(0, d.boss | 0); S.discount = !!d.disc;
    potionEquipped();   // (a potion no longer in the pack is not in hand)
    return true;
}
