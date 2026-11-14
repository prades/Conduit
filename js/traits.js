// ─────────────────────────────────────────────────────────
//  TRAIT / PERK TABLES
// ─────────────────────────────────────────────────────────
// THE TRAITS ARE GONE (build 2026-11-14f; the owner, 2026-11-14, after the agent's rundown of the four: "Remove all four"). Every follower drew one combat trait and one natural trait at random when it was
// made, shown only on its INFO: BERSERKER (its hits x 1.5 under 30% health), OPPORTUNISTIC (it went for the lowest-health enemy within 6 tiles, not the nearest), EMPATHETIC (a quarter nearer the player in the
// formation) and LONE WOLF (1.2 tiles farther out). No follower has one now: none is drawn, a saved one is dropped on load, and what asked a trait (js/npc.js, js/helpers.js, js/formation.js) finds nothing: every
// follower goes for the nearest enemy, hits alike at any health, and stands in its formation place. The tables stay, empty, for a redesign (a low-health boost and a target-the-weakest choice were the two worth
// bringing back as something chosen or earned).
const COMBAT_TRAITS = {};
const NATURAL_TRAITS = {};
// THE PERKS ARE GONE (build 2026-11-14e; the owner, 2026-11-14, asking how an Electro Skink was healing: "can we get rid of those perks? And maybe we can redesign those at a later time, but I forgot about
// those"). Every follower drew one of two at random when it was made, shown only on its INFO: IRON WILL (damage taken x 0.75) and SIPHON (healed 10% of each plain hit's damage). No follower has one now:
// none is drawn, a saved one is dropped on load, and the hooks that asked a perk (js/helpers.js applyDamage, js/combat.js, js/npc.js) find nothing. The table stays, empty, for the redesign.
const PERKS = {};
