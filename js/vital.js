// ─────────────────────────────────────────────────────────
//  THE VITAL ITEMS: a Vital Fleck, Prism or Core gives a follower back the hp stat its deaths have cost it, for good (docs/FOLLOWER-PROGRESSION.md)
// ─────────────────────────────────────────────────────────
// ASKED (the archive's Next Major Update Framework, the follow-up scope of 2026-10-31): "a consumable item family that restores a follower's permanently lost base HP stat. This system is separate from the card/booster
// system"; the Vital Fleck +5 (common), the Vital Prism +10 (uncommon; the standard strength), the Vital Core +20 (rare); "permanently increases the selected follower's base/max HP stat by its item's amount. It is not
// just current-health healing and must persist across death/return, area changes, and save/load"; "a one-time consumable: successful use removes exactly one item and applies the restoration exactly once. Block use
// on invalid targets"; "they do not automatically resurrect a follower whose HP stat has reached zero or bypass the Ice Mage/body-preservation and Resurrection Zone mechanics."
// THE HP STAT is a follower's base hp (js/levels.js: its level, its evolved form and its cards scale it into its maximum health, every time, from the base). Every death takes 1 off it (js/game.js, the death sweep);
// at 0 the follower falls for good and only an Ice Mage's capsule, used at the Crystal, brings it back (js/specimen.js). Its BORN hp (followerHp0) is what its personality gave it (applyPersonality), or, bred, the hp it
// was born with (js/breeding.js, f.hp0). A Vital item puts back what deaths took, up to the born hp: a follower that has lost nothing is not a target and the item is kept (the archive's wording is restoration;
// raising a follower past what it was born with is open: docs/OPEN-QUESTIONS.md). The gain goes through the one path (js/levels.js _applyFollowerLevel), so the maximum health rises at once and the current health
// with it, as on a level-up, and a reload, a respawn or a restored body (which are made from the base) keep it with nothing added twice.
// THE TARGET: the one follower picked in the roster (js/commandcenter.js ccSelectionList), else the nearest living follower within VITAL.range tiles of you (the mutagen sample's rule, js/inventory.js); never a clone,
// never one that is dead, waiting to come back, lying as a body or sealed in a capsule: those are not in the roster's living list, and this never touches the respawn queue, the bodies or the capsules.
const VITAL = { range: 8, items: { vital_fleck: { n: 5, rarity: "COMMON" }, vital_prism: { n: 10, rarity: "UNCOMMON" }, vital_core: { n: 20, rarity: "RARE" } } };

// a follower's BORN hp stat: what the Vital items restore to
function followerHp0(a) {
    if (!a) return 1;
    if (Number.isFinite(a.hp0)) return a.hp0;
    if (a.personality && typeof applyPersonality === "function") return applyPersonality(a.personality).hp;
    return (a.base && a.base.hp) || (a.stats && a.stats.hp) || 1;
}
// what deaths have cost it so far (0 for a whole one)
function followerHpLost(a) { const b = a && a.base && Number.isFinite(a.base.hp) ? a.base.hp : followerHp0(a); return Math.max(0, Math.round((followerHp0(a) - b) * 1000) / 1000); }
function vitalName(a) { return ((typeof unitTypeLabel === "function" ? unitTypeLabel(a) : (a.name || a.speciesName || "FOLLOWER")) + "").toUpperCase(); }
function vitalNum(v) { return String(Math.round(v * 10) / 10); }   // (a bred follower's base is kept to three places: the screens say one)
// the follower an item would go to: the one picked in the roster, else the nearest within range; { f } or { why }
function vitalTarget() {
    if (typeof followers === "undefined") return { why: "NO FOLLOWERS HERE" };
    const live = f => f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !f.returningToCrystal && f.base;
    const sel = typeof ccSelectionList === "function" ? ccSelectionList().filter(live) : [];
    if (sel.length === 1) return { f: sel[0], picked: true };
    if (sel.length > 1) return { why: "PICK ONE FOLLOWER IN THE ROSTER, NOT " + sel.length };
    let best = null, bd = VITAL.range;
    for (const f of followers) { if (!live(f)) continue; const d = Math.hypot(f.x - player.visualX, f.y - player.visualY); if (d < bd) { bd = d; best = f; } }
    return best ? { f: best } : { why: "NO FOLLOWER WITHIN " + VITAL.range + " TILES: STAND BY ONE, OR PICK ONE IN THE ROSTER" };
}
// can this item be used now, and on whom? { ok, f, n } or { ok: false, why }
function vitalCan(id) {
    const it = VITAL.items[id]; if (!it) return { ok: false, why: "NOT A VITAL ITEM" };
    const t = vitalTarget(); if (!t.f) return { ok: false, why: t.why };
    const lost = followerHpLost(t.f); if (!(lost > 0)) return { ok: false, why: vitalName(t.f) + " HAS LOST NO HP STAT: IT IS WHOLE (" + vitalNum(t.f.base.hp) + ")" };
    return { ok: true, f: t.f, n: Math.min(it.n, lost), lost };
}
// the pack's USE (js/inventory.js ITEMS[...].use): the stat put back, once, through the one path; the item is used up by the pack only when this says ok
function vitalUse(id) {
    const c = vitalCan(id); if (!c.ok) return { ok: false, why: c.why };
    const f = c.f, hp0 = followerHp0(f), before = f.base.hp;
    f.base.hp = Math.round(Math.min(hp0, before + c.n) * 1000) / 1000;
    if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(f, false);
    const whole = f.base.hp >= hp0;
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#ffb3c6", radius: 1.2, life: 30 });
    return { ok: true, msg: "+" + vitalNum(f.base.hp - before) + " HP STAT · " + vitalName(f) + " " + vitalNum(f.base.hp) + " / " + vitalNum(hp0) + (whole ? " · WHOLE AGAIN" : ""), f };
}
// the INSPECT page's lines (js/inventory.js)
function vitalStats(id) {
    const it = VITAL.items[id]; if (!it) return [];
    return ["EFFECT  +" + it.n + " HP STAT, FOR GOOD, UP TO WHAT IT WAS BORN WITH", "ON  THE FOLLOWER PICKED IN THE ROSTER, OR THE NEAREST WITHIN " + VITAL.range + " TILES", "RARITY  " + it.rarity + " · HIDDEN IN THE FACILITY, A FEW IN ALL", "NEVER  A FALLEN FOLLOWER: AN ICE MAGE AND THE CRYSTAL BRING THOSE BACK"];
}
