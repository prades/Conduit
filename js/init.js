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

    // Seed and session first: the seed decides the terrain, and the session
    // says which recruits are still standing, both of which generateSegment reads.
    initWorldSeed();
    const session = loadSession();
    restoredNpcKeys = (session && Array.isArray(session.npcs)) ? new Set(session.npcs) : null;

    for (let i = CAMP_MIN_X; i < 0; i++) generateSegment(i);
    for (let i = 0; i < WORLD_OPENING_COLUMNS; i++) generateSegment(i);
    // Out to wherever the saved game had already dug. BEFORE the pylon, nest
    // and session restores below, because every one of them looks its tile up
    // in worldTileMap and silently skips what is not there — which is how a
    // refresh used to lose the later zones along with everything built in them.
    if (session) ensureWorldTo(session.lastGenX);
    shardCount = getShards();
    playerAmmo = getAmmo();
    unlockedElements = new Set(getUnlocks());
    // After unlockedElements, because applyProgress drops any pending element
    // that has already been activated.
    applyProgress(loadProgress());
    const gs = loadGameState();
    if (gs) {
        gameState.nightNumber        = gs.nightNumber        || 1;
        gameState.totalWavesSurvived = gs.totalWavesSurvived || 0;
        gameState.highestZoneCleared = gs.highestZoneCleared || 0;
        activeDayZones               = gs.activeDayZones     || 3;
    }
    // Purge the shop era's permanent-upgrade store. Every bonus it held is gone,
    // so the key is dead weight in a returning player's browser.
    clearPermUpgrades();
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
            tile.isGenerator       = !!saved.isGenerator;
            tile.isConnector       = !!saved.isConnector;
            tile.circuitOn         = saved.circuitOn !== false;
        });
    }
    // Nests always generate at full health, so the ones already taken are
    // re-killed here. See applyNests in save.js — one rule, one place.
    applyNests(loadNests());
    // After the pylon and nest restores, so nest links can resolve to real tiles.
    applySession(session);

    const savedF = loadFollowers();
    if (savedF.length > 0) {
        savedF.forEach(entry => spawnFollowerFromSave(entry));
    }
    loadCampBuildings();
    renderPylonIndex();     // fill the GAME INDEX pylon page from the codex
    renderWorkCrewIndex();  // and the fighters/workers page from js/mass.js
    renderCloneCostIndex(); // and the clone prices from js/species.js
    // THE OBJECTIVE LINE, last, once everything it reads has been restored.
    //
    // REPORTED: "whenever I refresh the game, it forgets what wave I'm on and
    // resets it to the beginning." It did not forget — nightNumber comes back
    // out of tubecrawler_gamestate — but nothing ever refreshed the banner, so
    // it sat on the placeholder written into game.html, "WAVE 1 — clear panels
    // for shards", until an alarm or a wave clear happened to rewrite it. The
    // player reads the banner, so the game had reset as far as they could tell.
    updateObjectiveUI();
    render();
}

initPreview();
loadConfig();
