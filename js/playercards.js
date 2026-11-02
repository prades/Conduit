// ─────────────────────────────────────────────────────────
//  THE PLAYER CARDS' KITS: what a role does while it is awake (docs/UNIVERSAL-AND-PLAYER-CARDS.md section 2, "The 18 kits"; approved by the owner 2026-11-02, "Approve as drafted")
// ─────────────────────────────────────────────────────────
// A Player card (js/cards.js EQUIP_PLAYER_CARDS: its numbers and its words) is a ROLE for one of the player's classes. It is AWAKE while it is in one of the player's two slots and the player is its class (js/cards.js
// equipPlayerRole); after a switch of class it sleeps in its slot and does nothing here. The rules for all eighteen (approved 2026-11-02):
//   1. A ROLE WORKS ON ITS CLASS'S OWN ATTACKS: the Gunslinger's rounds, from any gun (the service gun, the machine gun, the laser rifle); the Technomancer's punch and arc; the Mutator's lash, clone and serum.
//   2. THE HIT'S ELEMENT (docs/COMBAT.md §7.9; the owner: "The role's element"): those hits take the role's element, for the element triangle only. No SP.ATK and no elemental share are added: they stay physical,
//      as they were (a gun's round is Projectile: js/damage.js DMG_HIT_GUN, whose triangle falls on the whole hit).
//   3. A STATUS a kit sets lands on EVERY hit, with Pack 1's Precision numbers (js/cards.js equipElementStatus): a status refreshes and never stacks, so every hit keeps it up without adding more.
// BUILT (the following update's Part 1a, build 2026-11-02h): the rules and THE GUNSLINGER'S SIX, on every round that hits (js/input.js firePlayerShot: the round, as it lands; js/weapons.js fireLaserShot: the beam, on the
// creature aimed at and on each it goes through). The Technomancer's six and the Mutator's six come in Parts 1b and 1c; until then their roles do nothing here.
//   INCENDIARY GUNNER  fire rounds that BURN                BLIGHT SHOOTER   toxic rounds that WEAKEN (the game's POISON)        BREACH GUNNER  core rounds that KNOCK BACK
//   ARC SLINGER        electric rounds: each shot jumps on to the nearest other creature within kit.jump.radius tiles of the first, for kit.jump.share of its damage (the Technomancer arc's jump); one jump a shot,
//                      never to a creature the shot already hit (the laser's beam goes through some), and the jump sets nothing off
//   CRYO MARKSMAN      ice rounds that SLOW; a round that hits a creature ALREADY slowed (before this round: by anything) FREEZES it, a stun of kit.freeze.frames as the Frost Maw's bite, and that creature is not frozen
//                      again for kit.freeze.again frames; and the guns fire kit.slower slower (js/weapons.js weaponCooldown)
//   RIFT RUNNER        flux rounds that PULL the creature hit toward you: the knockback reversed (kit.pull); a beetle or a boss is never pulled (js/helpers.js vortexPullImmune), as by every pull
function _pcFrame() { return typeof frame !== "undefined" ? frame : 0; }
// the role awake now (its card), or null
function playerRole() { return typeof equipPlayerRole === "function" ? equipPlayerRole() : null; }
// the Gunslinger's role, when it is the role awake: what a gun's round is (rule 1); null otherwise
function playerGunRole() { const r = playerRole(); return r && r.match === "gunslinger" && r.kit ? r : null; }
// the share of the guns' rate of fire a role takes off (CRYO MARKSMAN), for the weapon `id` (the one in hand when none is named): 0 for none, and for a weapon that is not a gun
function playerGunSlower(id) {
    const r = playerGunRole(); if (!r || !(r.kit.slower > 0)) return 0;
    const w = typeof weaponDef === "function" ? weaponDef(id) : null;
    return w && (w.kind === "ammo" || w.kind === "fuel") ? Math.min(0.9, r.kit.slower) : 0;
}
// A ROUND OF THE GUNSLINGER'S HAS HIT `t` (after its damage): `role` is the role awake when it was fired, `src` the round's source (where it was fired from; its element is the role's). The freeze is asked first, so a
// creature is frozen by a round only when it was slowed before that round; then the status; then the pull. (A creature the round killed takes none of them.)
function playerRoundHit(role, t, src) {
    const k = role && role.kit; if (!k || !t || t.dead) return false;
    if (k.freeze && t.slowed > 0 && _pcFrame() >= (t._pcFreezeNext || 0) && typeof applyStun === "function") {
        applyStun(t, k.freeze.frames); t._pcFreezeNext = _pcFrame() + k.freeze.again;
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text: "FROZEN", color: "#bdf0ff", size: 11, life: 46, vy: -0.03 });
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#cff4ff", radius: 0.6, life: 20 });
    }
    if (k.status && typeof equipElementStatus === "function") equipElementStatus(src, t, k.el);
    if (k.pull > 0 && typeof applyKnockback === "function" && typeof player !== "undefined" && player && !(typeof vortexPullImmune === "function" && vortexPullImmune(t)))
        applyKnockback(t, { x: 2 * t.x - player.x, y: 2 * t.y - player.y }, k.pull);   // (a push away from the point beyond it: toward you)
    return true;
}
// ARC SLINGER: the shot that hit `from` jumps on to the nearest other creature within the kit's reach of it, for its share of `dmg` (the shot's damage), the round's own kind of hit (Projectile, the role's element). `skip`:
// the creatures the shot already hit. The creature it jumped to, or null.
function playerRoundJump(role, from, src, dmg, skip) {
    const j = role && role.kit && role.kit.jump; if (!j || !from || !(dmg > 0) || typeof actors === "undefined") return null;
    let best = null, bd = j.radius;
    for (const a of actors) {
        if (!a || a === from || a.dead || (skip && skip.indexOf(a) >= 0) || (typeof isHostileTarget === "function" && !isHostileTarget(a))) continue;
        const d = Math.hypot(a.x - from.x, a.y - from.y); if (d <= bd) { bd = d; best = a; }
    }
    if (!best) return null;
    if (typeof applyDamage === "function") applyDamage(best, dmg * j.share, src, null, false, false, typeof DMG_HIT_GUN !== "undefined" ? DMG_HIT_GUN : null);
    if (typeof technoBolt === "function") technoBolt(from, best);   // (the arc's look: js/technomancer.js)
    return best;
}
