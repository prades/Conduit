// ─────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────
let health = 100;

async function loadConfig() {
    try {
        const presetRes = await fetch('./predator_presets.json');
        if (presetRes.ok) { PREDATOR_PRESETS = await presetRes.json(); rebuildPresetDropdown(); }
    } catch(e) { console.warn("No predator presets file"); }
    try {
        const res = await fetch('./data.json');
        if (res.ok) { const data = await res.json(); cfg = {...cfg, ...data}; }
    } catch(e) { console.log("Using default config"); }

    for (let i = -6; i < 0; i++) generateSegment(i);
    for (let i = 0; i < 80; i++) generateSegment(i);
    shardCount = getShards();
    unlockedElements = new Set(getUnlocks());
    const gs = loadGameState();
    if (gs) {
        gameState.nightNumber        = gs.nightNumber        || 1;
        gameState.totalWavesSurvived = gs.totalWavesSurvived || 0;
        gameState.highestZoneCleared = gs.highestZoneCleared || 0;
        activeDayZones               = gs.activeDayZones     || 3;
    }
    const pu = loadPermUpgrades();
    if (pu) {
        if (Array.isArray(pu.ids)) permUpgrades = new Set(pu.ids);
        pylonMaxHPBonus        = pu.pylonMaxHPBonus        || 0;
        pylonRangeBonus        = pu.pylonRangeBonus        || 0;
        pylonFireRateBonus     = pu.pylonFireRateBonus     || 0;
        followerPermPowerBonus = pu.followerPermPowerBonus || 0;
        followerPermHPBonus    = pu.followerPermHPBonus    || 0;
    }
    const savedPylons = loadPylons();
    if (savedPylons) {
        savedPylons.forEach(saved => {
            const tile = worldTileMap.get(`${saved.x},${saved.y}`);
            if (!tile) return;
            tile.pillar            = true;
            tile.pillarTeam        = saved.pillarTeam;
            tile.pillarCol         = saved.pillarCol;
            tile.health            = saved.health;
            tile.maxHealth         = saved.maxHealth;
            tile.destroyed         = saved.destroyed;
            tile.attackMode        = saved.attackMode;
            tile.waveMode          = saved.waveMode;
            tile.attackModeElement = saved.attackModeElement;
            tile.attackModeColor   = saved.attackModeColor;
            tile.seasoned          = saved.seasoned;
            tile.upgraded          = saved.upgraded;
        });
    }
    const savedF = loadFollowers();
    if (savedF.length > 0) {
        savedF.forEach(entry => spawnFollowerFromSave(entry));
    }
    loadCampBuildings();
    render();
}

initPreview();
loadConfig();
