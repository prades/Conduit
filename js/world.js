// ─────────────────────────────────────────────────────────
//  WORLD GENERATION
// ─────────────────────────────────────────────────────────
function generateSegment(startX) {
    const zoneIndex = Math.floor(startX / ZONE_LENGTH);
    const zoneCenter = zoneIndex * ZONE_LENGTH + Math.floor(ZONE_LENGTH / 2);
    for (let y=-2; y<=5; y++) {
        let type = (y===-2)?'wall_back':(y===5)?'wall_front':'floor';
        const isNest = type === 'floor' && y === -1 && startX === zoneCenter;
        const tile = {
            x:startX, y, type,
            pillar:(type==='floor'&&y>=3&&Math.random()<cfg.pillarSpawnRate),
            pillarTeam: Math.random()>0.6?"green":"red",
            pillarCol:null,
            destroyed:false, health:20, maxHealth:20,
            converting:false, pendingDestroy:false,
            pylonStyle:["sentinel","spire","monolith","antenna","shrine","conduit"][Math.floor(Math.random()*6)],
            upgraded:false, pulseTimer:0,
            reconstructing:false, reconstructProgress:0, workers:[],
            // Spawn nest — honeycomb hive structure at zone centre, y=2
            nest: isNest, nestHealth: isNest ? 200 : 0, nestMaxHealth: 200,
            nestZone: isNest ? zoneIndex : -1, nestPulse: 0,
            // Capturable node fields
            nodeType: null, capturable: false, captureProgress: 0,
            capturingFollowers: [], captured: false, territory: null
        };
        if (tile.pillarTeam==="green") tile.pillarCol="#0f8"; else tile.pillarCol="#e02020";
        world.push(tile);

        // ── WALL PANELS — back-row floor tiles (y=0) in forward zones ──
        const PANEL_ALARM_TYPES = ["proximity", "zone", "facility"];
        if (zoneIndex >= 1 && type === 'floor' && y === 0 && Math.random() < 0.18) {
            tile.nodeType    = 'wall_panel';
            tile.capturable  = false;
            tile.panelActivated = false;
            tile.isDecoy     = Math.random() < 0.40;
            tile.shardReward = 10 + Math.floor(Math.random() * 21);
            tile.alarmType   = PANEL_ALARM_TYPES[Math.floor(Math.random() * PANEL_ALARM_TYPES.length)];
            tile.panelFlicker = Math.random() * Math.PI * 2;
        }

        // NPC spawns
        if (zoneIndex>=0 && zoneIndex<activeDayZones && type==='floor' && y===3 && Math.random()<cfg.npcSpawnRate) {
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

    // ── CAPACITOR NODE — 1 per forward zone, at zone x-offset 3, y=2 ──
    const capNodeX = zoneIndex * ZONE_LENGTH + 3;
    if (zoneIndex >= 1 && startX === capNodeX) {
        const nodeTile = world.find(t => t.x === startX && t.y === 2 && t.type === 'floor' && !t.nest && !t.nodeType);
        if (nodeTile) {
            nodeTile.nodeType = 'capacitor_node';
            nodeTile.capturable = true;
            nodeTile.predatorOwned = true; // starts under predator control
        }
    }

    // ── SIGNAL TOWER — zones 4+, placed at zone centre, y=1 ──
    if (zoneIndex >= 4 && startX === zoneCenter) {
        const stTile = world.find(t => t.x === startX && t.y === 1 && t.type === 'floor' && !t.nest && !t.nodeType);
        if (stTile) {
            stTile.nodeType = 'signal_tower';
            stTile.capturable = true;
            stTile.predatorOwned = true; // starts under predator control
            signalTowers.push(stTile);
        }
    }
}
