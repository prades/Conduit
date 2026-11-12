// ─────────────────────────────────────────────────────────
//  CODE CARDS: a code typed on the Cards sheet gives a gift, once a save; and a NAME a creature can carry
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-12: "Go ahead and make a code card feature for my game."). Of the agent's questions: the code is REDEEMED (typed in), on the pack/card screen (the shop tab of the Cards sheet, js/cardsui.js),
// once per save ("Once per save"). What a code gives, for now: "a lvl 20 mantis clone that's integrated with the mutator clones" (of the three: "Tank"); the message "Emotional Support 💚", it joins the squad;
// "The code is "Kylie" or "frommatt" and the creatures name is emotional support, add a naming system".
// What the agent read, PROVISIONAL (the owner's answer to "who may redeem it, and with a clone out" was the message above, not a rule):
//   * Either code gives the one gift, once a save: the second code then says it was used. Case and spaces do not matter.
//   * Any class may redeem it (a gift is not growing a clone); it is the Mutator's PRIMARY clone when the class is the Mutator (the rule js/clone.js cloneAllowed gives), else a clone like any other.
//   * With a clone already out (the cap, js/clone.js cloneCap: one for the Mutator's rule) the code is NOT used up: it says to dismiss the clone first. Likewise before a run has started.
//   * It appears at the Crystal, level 20, at full health, as a clone made by makeClone (the same thing the Clone Bay builds), no splices or shards paid, no experience credited to the Mutator.
// THE NAME (the naming system): any unit may carry `nick`, a short name (unitSetNick: trimmed, 24 characters at most, no control characters); unitTypeLabel (js/levels.js) gives it everywhere a unit's name is
// shown instead of its kind ("MANTIS CLONE"); a clone's save record, its body and its place in the respawn queue keep it. No screen lets a player rename a creature yet: only a code names one.

const REDEEM_CODES = { kylie: "emotional_support", frommatt: "emotional_support" };   // (typed codes, lower case, to the gift each gives)
const REDEEM_GIFTS = {
    emotional_support: { species: "mantis", cls: "tank", level: 20, nick: "Emotional Support 💚", say: "EMOTIONAL SUPPORT 💚 JOINS YOUR SQUAD" },
};
const REDEEM_NAME_MAX = 24;
let redeemedGifts = new Set();   // the gifts this save has had (not the codes: either code gives the one gift)

function redeemReset() { redeemedGifts = new Set(); }
function redeemSave() { return [...redeemedGifts]; }
function redeemApply(list) { redeemedGifts = new Set(Array.isArray(list) ? list.filter(id => typeof id === "string" && REDEEM_GIFTS[id]) : []); }
function redeemNorm(code) { return String(code == null ? "" : code).trim().toLowerCase(); }

// a unit's name: true if it was set (a string with something in it, cleaned); an empty or non-string name takes the name away
function unitSetNick(u, name) {
    if (!u || typeof u !== "object") return false;
    if (typeof name !== "string") { delete u.nick; return false; }
    const n = name.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, REDEEM_NAME_MAX).trim();
    if (!n) { delete u.nick; return false; }
    u.nick = n; return true;
}

// Try a typed code. { ok, say, why }: ok with `say` (what the player is told), or not with `why` (and the code not used up unless it was unknown or already used)
function redeemTry(code) {
    const id = REDEEM_CODES[redeemNorm(code)];
    if (!redeemNorm(code)) return { ok: false, why: "TYPE A CODE FIRST" };
    if (!id) return { ok: false, why: "THAT IS NOT A CODE" };
    const g = REDEEM_GIFTS[id];
    if (redeemedGifts.has(id)) return { ok: false, why: "THIS CODE'S GIFT IS ALREADY YOURS ON THIS SAVE" };
    if (typeof gameState === "undefined" || !gameState.running || typeof crystal === "undefined" || typeof makeClone !== "function") return { ok: false, why: "START A RUN FIRST: THE GIFT COMES TO THE CRYSTAL" };
    if (typeof cloneLiveCount === "function" && typeof cloneCap === "function" && cloneLiveCount() >= cloneCap()) return { ok: false, why: "ONE CLONE AT A TIME: DISMISS YOURS FIRST, THEN TYPE THE CODE AGAIN" };
    const k = makeClone(g.species, g.cls, crystal.x, crystal.y, "wander", { level: g.level, xp: 0 });
    if (!k) return { ok: false, why: "THE GIFT COULD NOT BE MADE" };
    unitSetNick(k, g.nick);
    const al = typeof cloneAllowed === "function" ? cloneAllowed() : { ok: true, primary: false };
    if (al.primary && typeof mutatorCloneMade === "function") { k.primary = true; k.upgrades = {}; k.invested = 0; if (typeof cloneApplyUpgrades === "function") cloneApplyUpgrades(k); }   // (the Mutator's one clone, as the bay grows it, but no splices went into it and no level is gained)
    k.health = k.maxHealth;
    redeemedGifts.add(id);
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2, text: g.say, color: (typeof SPECIES !== "undefined" && SPECIES[g.species] ? SPECIES[g.species].color : "#44dd55"), life: 150, vy: -0.4, size: 15 });
    if (typeof facilitySaveWrite === "function") try { facilitySaveWrite(); } catch (e) {}   // (kept at once: a gift not saved would be given twice)
    return { ok: true, say: g.say, unit: k };
}
