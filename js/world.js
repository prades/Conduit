// ─────────────────────────────────────────────────────────
//  WORLD GENERATION
// ─────────────────────────────────────────────────────────
function generateSegment(startX) {
    for (let y=-2; y<=5; y++) {
        let type = (y===-2)?'wall_back':(y===5)?'wall_front':'floor';
        // Wall height in screen pixels — 2×TILE_H gives one isometric unit of height
        const wallH = (type === 'wall_back') ? TILE_H * 3 : TILE_H * 3;
        const tile = {
            x:startX, y, type,
            h: (type === 'floor') ? 0 : wallH,
            // floor props
            pillar:(type==='floor'&&y>=3&&Math.random()<cfg.pillarSpawnRate),
            pillarTeam: Math.random()>0.6?"green":"red",
            pillarCol:null,
            destroyed:false, health:20, maxHealth:20,
            converting:false, pendingDestroy:false,
            upgraded:false, pulseTimer:0,
            reconstructing:false, reconstructProgress:0, workers:[],
            // wall props — hazard slot for spikes, fire jets, etc.
            wallProps: (type !== 'floor') ? { hazard:null, hazardType:null, hazardColor:null, hazardTimer:0 } : null
        };
        if (tile.pillarTeam==="green") tile.pillarCol="#0f8"; else tile.pillarCol="#f22";
        world.push(tile);

        // NPC spawns
        const zoneIndex=Math.floor(startX/ZONE_LENGTH);
        if (zoneIndex<activeDayZones && type==='floor' && y===3 && Math.random()<cfg.npcSpawnRate) {
            const typeKeys=["virus","lobster","turtle"];
            const npcType=typeKeys[Math.floor(Math.random()*typeKeys.length)];
            const def=NPC_TYPES[npcType];
            const ELEMENT_POOL=[...unlockedElements];
            const element=ELEMENT_POOL[Math.floor(Math.random()*ELEMENT_POOL.length)];
            const personality = PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
            const stats       = applyPersonality(personality);
            const role        = assignRole(stats);
            const npc={
                type:"virus", element, x:startX, y,
                team:"red", convertFlash:0, isNeutralRecruit:true,
                health: stats.hp, maxHealth: stats.hp,
                moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
                power: stats.attack,
                stats, personality, role,
                currentResonance: 0,
                currentWill: stats.will,
                targetX:startX, targetY:y,
                walkCycle:0, moveCooldown:0,
                stance:"follow", isFollower:false, isHealing:false,
                hitFlash:0, spawnProtection:180, dead:false,
                combatTrait:  Object.keys(COMBAT_TRAITS)[Math.floor(Math.random()*2)],
                naturalTrait: Object.keys(NATURAL_TRAITS)[Math.floor(Math.random()*2)],
                perk:         Object.keys(PERKS)[Math.floor(Math.random()*2)]
            };
            actors.push(npc);
            dayStats.redSpawned++;
        }
    }
    lastGenX=startX;
}
