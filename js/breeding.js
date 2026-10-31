// ─────────────────────────────────────────────────────────
//  BREEDING: a bonded pair raises an offspring, better than a recruit (docs/FOLLOWER-PROGRESSION.md)
// ─────────────────────────────────────────────────────────
// ASKED (the archive's Next Major Update Framework, the follow-up scope of 2026-10-31): "Sanctuary breeding costs exactly 50 shards per offspring"; "a deterministic, testable behind-the-scenes quality advantage for bred
// offspring compared with ordinary purchased recruits ... derived from parent stats and/or a defined upbringing/breeding bonus, not arbitrary unexplained stat inflation"; "Keep the offspring within the game's stat limits
// and preserve species/class rules, inherited identity, save/load, and existing stat-calculation behavior. Do not double-apply inherited bonuses when stats are recalculated."; "Avoid guaranteeing that every individual
// stat is higher unless that is explicitly chosen"; "Prevent ... duplicate charges when a player repeats an interaction or reloads. Insufficient currency must not ... create an offspring."
// WHO: two followers that have BONDED (js/bonds.js: they fought side by side) are a pair; a clone never. Neither parent is used up or changed.
// WHERE: the roster (the Command Center's settings column for the creature in view, js/commandcenter.js; the phone's card, js/radialmenu.js): BREED WITH <its partner> ◆50, two taps (the first arms it, the second
// pays, as RE-ROLL and EXILE are), so a double tap makes one offspring and pays once. The offspring comes out at the Crystal as a recruit does; with the squad full, who makes room is asked first and nothing is paid
// until that is chosen (js/party.js partyPickOpen, as the quick recruit's). The archive's Sanctuary room, its keeper and the breeding wait are NOT built: this is the first, modest version (docs/OPEN-QUESTIONS.md).
// WHAT COMES OUT: the LEAD parent's type and element (the higher level; a tie: the one in view), a personality of that type (so its role is the type's, as a recruit's is: js/species.js), at the recruit's level, unbonded,
// with no cards, and a BASE of its own. Everything else the game derives from the base (js/levels.js _applyFollowerLevel: the level, the evolved form, the cards), so the advantage is applied exactly once, at birth, and
// never again on a level-up, a reload, a respawn or a restored body. For each stat in BREED.stats:
//     base[s] = min( BREED.cap × own[s],  max( own[s], (A[s] + B[s]) / 2 ) × BREED.upbringing × (1 + v) )
//   own[s]    what its own personality gives a recruit (applyPersonality): the floor, so an offspring is never under a recruit of its personality
//   A[s] B[s] the parents' bases (for hp their BORN hp, followerHp0: deaths wear a parent's own hp down, not its line's)
//   v         a draw in [−BREED.variation, +BREED.variation] for each stat (controlled variation; a test injects the draw and gets the same offspring every time)
//   kept to three places, as the equip cards keep a stat they move (a +5% on 10 is 10.5, not 10 or 11); the levelled stats the game plays with are whole numbers as before (levelledStats rounds)
//   so an offspring is, on average, BREED.upbringing above a recruit of its personality on every stat in the list, at least 1.0185 × (the worst draw), and never past BREED.cap × it however many generations breed.
// PROVENANCE: f.bred = { gen, parents: [uid, uid] } and f.hp0 (its born hp stat, what the Vital items restore to: js/vital.js), saved with the follower (js/facilitysave.js followerRecord), kept through a respawn
// (js/game.js) and a preserved body (js/specimen.js); a RE-ROLL makes someone new and clears both (js/helpers.js).
const BREED = { price: 50, upbringing: 1.05, variation: 0.03, cap: 2, stats: ["hp", "attack", "defense", "specialAttack", "accuracy", "will"] };

let _breedArmed = null;   // the follower whose BREED button is armed (uid), and when (ms): the second tap within BREED_ARM ms breeds
const BREED_ARM = 4000;
function _brSay(text, good) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: good ? "#ff7ab8" : "#ff8a6a", life: good ? 150 : 100, vy: -0.25, size: good ? 14 : 12 }); }
function _brNow() { return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now(); }

// the partner it would breed with: its bond partner, alive and a follower
function breedPartner(f) {
    if (!f || f.isFollower !== true || f.isClone || f.dead || typeof bondPartner !== "function") return null;
    const p = bondPartner(f); return p && !p.dead && p.isFollower === true && !p.isClone ? p : null;
}
// can it breed now? { ok, partner } or { ok: false, why }
function breedCan(f) {
    if (!f || f.isFollower !== true || f.isClone || f.dead) return { ok: false, why: "ONLY A FOLLOWER BREEDS" };
    const p = breedPartner(f); if (!p) return { ok: false, why: "NO BOND YET: TWO FOLLOWERS BOND FIGHTING SIDE BY SIDE" };
    if (f.returningToCrystal || p.returningToCrystal) return { ok: false, why: "NOT WHILE ONE OF THEM IS BEING MADE AGAIN" };
    if (typeof partyPickBusy === "function" && partyPickBusy()) return { ok: false, why: "ANSWER THE QUESTION FIRST" };
    if ((typeof shardCount === "number" ? shardCount : 0) < BREED.price) return { ok: false, why: "NEED ◆" + BREED.price + " TO BREED" };
    return { ok: true, partner: p };
}
function breedLead(a, b) { return (b.level || 1) > (a.level || 1) ? b : a; }
// the type the offspring is made as: the lead's type (a hybrid fights as a brawler; an evolved form's role is its form's)
function breedType(lead) { return typeof FOLLOWER_TYPES !== "undefined" && FOLLOWER_TYPES[lead.role] ? lead.role : "brawler"; }
// a parent's base as the line carries it: its base, with its BORN hp in place of what deaths have worn it down to
function breedParentBase(a) {
    const b = Object.assign({}, a.base || a.stats || {});
    if (typeof followerHp0 === "function") b.hp = Math.max(b.hp || 0, followerHp0(a));
    return b;
}
// the offspring's base from its own personality's numbers and its parents' (pure: no world, no randomness but `rnd`, a function giving [0, 1))
function breedBase(own, A, B, rnd) {
    const draw = typeof rnd === "function" ? rnd : Math.random, out = Object.assign({}, own);
    for (const s of BREED.stats) {
        const o = Number(own[s]) || 0; if (!(o > 0)) continue;
        const a = Number.isFinite(A && A[s]) ? A[s] : o, b = Number.isFinite(B && B[s]) ? B[s] : o;
        const v = (draw() * 2 - 1) * BREED.variation;
        const raw = Math.max(o, (a + b) / 2) * BREED.upbringing * (1 + v);
        out[s] = Math.round(Math.min(BREED.cap * o, Math.max(o, raw)) * 1000) / 1000;
    }
    out.resonance = 0;
    return out;
}
// the paid act, in one step: the parents checked, the offspring made at the Crystal, the price taken (nothing is taken when nothing is made). Returns the offspring or null (and says why).
function breedMake(f, rnd) {
    const can = breedCan(f); if (!can.ok) { _brSay(can.why); return null; }
    const p = can.partner, lead = breedLead(f, p), type = breedType(lead), element = lead.element;
    if (typeof spawnFollowerAtCrystal !== "function" || typeof followers === "undefined") return null;
    const n0 = followers.length; spawnFollowerAtCrystal(element, type);
    const c = followers[followers.length - 1]; if (!c || followers.length === n0) { _brSay("NOTHING CAME OF IT"); return null; }
    shardCount -= BREED.price;
    const own = typeof applyPersonality === "function" ? applyPersonality(c.personality) : Object.assign({}, c.base);
    c.base = breedBase(own, breedParentBase(f), breedParentBase(p), rnd);
    c.hp0 = c.base.hp;
    c.bred = { gen: Math.max(f.bred && f.bred.gen || 0, p.bred && p.bred.gen || 0) + 1, parents: [typeof followerUid === "function" ? followerUid(f) : f.uid || 0, typeof followerUid === "function" ? followerUid(p) : p.uid || 0] };
    if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(c, true);   // its numbers from its base, once (every later recalculation starts from the same base)
    const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === element) : null;
    _brSay("♥ AN OFFSPRING: " + (typeof roleLabel === "function" ? roleLabel(type) : type.toUpperCase()) + " · " + (def ? def.label.toUpperCase() : String(element).toUpperCase()) + " · GEN " + c.bred.gen + " · ◆" + BREED.price, true);
    return c;
}
// the button's act: with the squad full, who makes room is asked first (nothing paid until it is chosen); else the offspring is made now. Returns true when something was started.
function breedStart(f) {
    const can = breedCan(f); if (!can.ok) { _brSay(can.why); return false; }
    const after = () => { if (typeof ccRender === "function") ccRender(); if (typeof radialRender === "function") radialRender(); };
    if (typeof partyOn === "function" && partyOn() && typeof partyFull === "function" && partyFull() && typeof partyPickOpen === "function") {
        return partyPickOpen("AN OFFSPRING", [crystal.x, crystal.y], () => { breedMake(f); after(); }, null);
    }
    const c = breedMake(f); after(); return !!c;
}
// the two taps: the first arms (for BREED_ARM ms), the second breeds. Returns "armed", "bred" or "refused".
function breedArmed(f) { return !!f && !!_breedArmed && _breedArmed.uid === (f.uid || 0) && _brNow() - _breedArmed.at < BREED_ARM; }
function breedTap(f) {
    const can = breedCan(f); if (!can.ok) { _brSay(can.why); _breedArmed = null; return "refused"; }
    if (!breedArmed(f)) { _breedArmed = { uid: f.uid || 0, at: _brNow() }; return "armed"; }
    _breedArmed = null; return breedStart(f) ? "bred" : "refused";
}
function breedDisarm() { _breedArmed = null; }
// the button's words for the roster: what it says and whether it is on
function breedLabel(f) {
    const p = breedPartner(f); if (!p) return { text: "BREED", sub: "BONDS FIRST: FIGHT SIDE BY SIDE", on: false };
    const nm = typeof unitTypeLabel === "function" ? unitTypeLabel(p) : "ITS PARTNER";
    if (breedArmed(f)) return { text: "TAP AGAIN: BREED ◆" + BREED.price, sub: "WITH " + nm + " · AN OFFSPRING AT THE CRYSTAL", on: true };
    const can = breedCan(f); return { text: "BREED WITH " + nm + " ◆" + BREED.price, sub: can.ok ? "AN OFFSPRING, BETTER RAISED · TWO TAPS" : can.why, on: can.ok };
}
