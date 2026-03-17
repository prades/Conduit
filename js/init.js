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
        activeDayZones               = gs.activeDayZones     || 3;
    }
    const savedF = loadFollowers();
    if (savedF.length > 0) {
        savedF.forEach(entry => spawnFollowerFromSave(entry));
    }
    render();
}

initPreview();
loadConfig();
