// ─────────────────────────────────────────────────────────
//  WORLD GENERATION
// ─────────────────────────────────────────────────────────
function generateSegment(startX) {
    // One deterministic stream per segment — see js/rng.js.
    const rnd = segmentRng(startX);
    const zoneIndex = Math.floor(startX / ZONE_LENGTH);
    const zoneCenter = zoneIndex * ZONE_LENGTH + Math.floor(ZONE_LENGTH / 2);
    for (let y=-2; y<=5; y++) {
        let type = (y===-2)?'wall_back':(y===5)?'wall_front':'floor';
        const isNest = type === 'floor' && y === -1 && startX === zoneCenter;
        const tile = {
            x:startX, y, type,
            pillar:(type==='floor'&&y>=3&&rnd()<cfg.pillarSpawnRate&&startX>=0),
            pillarTeam: rnd()>0.6?"green":"red",
            pillarCol:null,
            destroyed:false, health:20, maxHealth:20,
            converting:false, pendingDestroy:false,
            // Every pylon is a sentinel now. The rnd() draw stays because the
            // stream is positional: dropping it would shift every later draw in
            // this segment and rebuild a different world under every save.
            pylonStyle:(rnd(), PYLON_STYLE),
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
        worldTileMap.set(`${tile.x},${tile.y}`, tile);

        // ── WALL PANELS — back-row floor tiles (y=0) in forward zones ──
        const PANEL_ALARM_TYPES = ["proximity", "zone", "facility"];
        if (zoneIndex >= 1 && type === 'floor' && y === 0 && rnd() < 0.18) {
            tile.nodeType    = 'wall_panel';
            tile.capturable  = false;
            tile.panelActivated = false;
            tile.isDecoy     = rnd() < PANEL_DECOY_CHANCE;
            tile.shardReward = PANEL_SHARD_MIN
                             + Math.floor(rnd() * (PANEL_SHARD_MAX - PANEL_SHARD_MIN + 1));
            tile.alarmType   = PANEL_ALARM_TYPES[Math.floor(rnd() * PANEL_ALARM_TYPES.length)];
            tile.panelFlicker = rnd() * Math.PI * 2;
        }

        // NPC spawns
        if (zoneIndex>=0 && zoneIndex<activeDayZones && type==='floor' && y===3 && rnd()<cfg.npcSpawnRate) {
            const typeKeys=["virus","lobster","turtle"];
            const npcType=typeKeys[Math.floor(rnd()*typeKeys.length)];
            const def=NPC_TYPES[npcType];
            const ELEMENT_POOL=[...unlockedElements];
            const element=ELEMENT_POOL[Math.floor(rnd()*ELEMENT_POOL.length)];
            const personality = PERSONALITY_KEYS[Math.floor(rnd() * PERSONALITY_KEYS.length)];
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
                combatTrait:  Object.keys(COMBAT_TRAITS)[Math.floor(rnd()*2)],
                naturalTrait: Object.keys(NATURAL_TRAITS)[Math.floor(rnd()*2)],
                perk:         Object.keys(PERKS)[Math.floor(rnd()*2)],
                // Stable identity across reloads — at most one recruit per
                // segment, so its x is enough to name it.
                spawnKey: startX
            };
            // The object is built either way so the stream stays aligned; only
            // the push is skipped for a recruit already converted or killed.
            if (!restoredNpcKeys || restoredNpcKeys.has(startX)) {
                actors.push(npc);
                dayStats.redSpawned++;
            }
        }
    }
    lastGenX=startX;

    // ── NO HOLE IN THE FLOOR ──────────────────────────────────────────────
    // Every forward zone used to get a CAPACITOR NODE at zone x-offset 3, y=2:
    // a vortex in the middle of the walkable strip, open by default, that
    // predators came up out of. It was a second mouth, and it was on the ground
    // where the player walks.
    //
    // REPORTED: "I want the portals on the wall to be the nests. I don't want
    // the holes on the ground or the floor any more." So a zone has exactly one
    // mouth now — the nest in its back wall — and the floor is floor.

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

// ─────────────────────────────────────────────────────────
//  THE FRONTIER
// ─────────────────────────────────────────────────────────
// lastGenX is how far the tunnel has been BUILT. generateSegment is the only
// thing that builds a column, and it is what moves the marker — so the two can
// only be told apart by code that sets the marker without building anything.
//
// REPORTED: "sometimes when I refresh the game, the later zones do not appear."
//
// That is exactly what happened. Boot generates columns 0..79. Clearing a wave
// extends the tunnel by ZONE_LENGTH and pushes lastGenX out with it, so a few
// waves in it stands at 109. On the next load the session restore did
//
//     lastGenX = Math.max(lastGenX, sess.lastGenX)
//
// which moved the marker to 109 over ground that stopped at 79. Nothing ever
// filled the gap: the only other generator appends PAST lastGenX
// (`if (player.x > lastGenX - 10) generateSegment(lastGenX + 1)`) and never
// behind it. Measured: thirty columns missing, and with them eight saved pylons
// and a nest the player had already taken, because the restores look their
// tiles up in worldTileMap and silently skip the ones that are not there.
//
// So the marker is not settable any more. You ask for ground, and you get it.
function ensureWorldTo(x) {
    if (!Number.isFinite(x)) return 0;
    let built = 0;
    // Bounded so a corrupt save cannot hang the boot on a 10-million-column
    // loop. Far past anything the game itself can reach.
    const limit = lastGenX + ZONE_LENGTH * 400;
    while (lastGenX < x && lastGenX < limit) { generateSegment(lastGenX + 1); built++; }
    return built;
}
