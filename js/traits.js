// ─────────────────────────────────────────────────────────
//  TRAIT / PERK TABLES
// ─────────────────────────────────────────────────────────
const COMBAT_TRAITS = {
    berserker: {
        name:"Berserker", description:"Gains damage when low health",
        onUpdate(a) { a.damageMultiplier = a.health < a.maxHealth*0.3 ? 1.5 : 1; }
    },
    opportunistic: {
        name:"Opportunistic", description:"Targets lowest health enemy",
        onTargetSelect(a, enemies) { return enemies.sort((x,y)=>x.health-y.health)[0]; }
    }
};
const NATURAL_TRAITS = {
    empathetic: { name:"Empathetic", description:"Prefers staying near allies",
        onUpdate(a) { a.preferGroup = true; } },
    lone_wolf:  { name:"Lone Wolf",  description:"Moves further from player when idle",
        onIdle(a)   { a.wanderRadius = 4; } }
};
// THE PERKS ARE GONE (build 2026-11-14e; the owner, 2026-11-14, asking how an Electro Skink was healing: "can we get rid of those perks? And maybe we can redesign those at a later time, but I forgot about
// those"). Every follower drew one of two at random when it was made, shown only on its INFO: IRON WILL (damage taken x 0.75) and SIPHON (healed 10% of each plain hit's damage). No follower has one now:
// none is drawn, a saved one is dropped on load, and the hooks that asked a perk (js/helpers.js applyDamage, js/combat.js, js/npc.js) find nothing. The table stays, empty, for the redesign.
const PERKS = {};
