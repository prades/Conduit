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
const PERKS = {
    iron_will: {
        name:"Iron Will", description:"Takes reduced damage",
        modifyIncomingDamage(a, dmg) { return dmg * 0.75; }
    },
    siphon: {
        name:"Siphon", description:"Heals when dealing damage",
        onDealDamage(a, amount) { a.health = Math.min(a.maxHealth, a.health + amount*0.1); }
    }
};
