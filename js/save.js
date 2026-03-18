// DNA inventory — backed by localStorage so it survives everything
let floatingTexts = []; // { x, y, text, color, life, vy }

function saveGameState() {
    try { localStorage.setItem("tubecrawler_gamestate", JSON.stringify({
        nightNumber: gameState.nightNumber,
        totalWavesSurvived: gameState.totalWavesSurvived,
        activeDayZones: activeDayZones
    })); } catch(e) {}
}
function loadGameState() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_gamestate") || "null"); }
    catch(e) { return null; }
}
function clearGameState() {
    try { localStorage.removeItem("tubecrawler_gamestate"); } catch(e) {}
}

function savePylons() {
    const data = world
        .filter(t => t.pillar)
        .map(t => ({
            x: t.x, y: t.y,
            pillarTeam: t.pillarTeam, pillarCol: t.pillarCol,
            health: t.health, maxHealth: t.maxHealth,
            destroyed: t.destroyed,
            attackMode: !!t.attackMode, waveMode: !!t.waveMode,
            attackModeElement: t.attackModeElement || null,
            attackModeColor: t.attackModeColor || null,
            seasoned: t.seasoned || 0,
            upgraded: !!t.upgraded
        }));
    try { localStorage.setItem("tubecrawler_pylons", JSON.stringify(data)); } catch(e) {}
}
function loadPylons() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_pylons") || "null"); }
    catch(e) { return null; }
}
function clearPylons() {
    try { localStorage.removeItem("tubecrawler_pylons"); } catch(e) {}
}

function getShards() {
    try { return parseInt(localStorage.getItem("tubecrawler_shards") || "0"); }
    catch(e) { return 0; }
}
function saveShards() {
    try { localStorage.setItem("tubecrawler_shards", String(shardCount)); }
    catch(e) {}
}
function clearShards() {
    try { localStorage.removeItem("tubecrawler_shards"); }
    catch(e) {}
}

function loadFollowers() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_followers") || "[]"); }
    catch(e) { return []; }
}
function clearFollowers() {
    try { localStorage.removeItem("tubecrawler_followers"); }
    catch(e) {}
}

function getUnlocks() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_unlocks") || '["fire","electric"]'); }
    catch(e) { return ["fire","electric"]; }
}
function saveUnlocks() {
    try { localStorage.setItem("tubecrawler_unlocks", JSON.stringify([...unlockedElements])); }
    catch(e) {}
}
function clearUnlocks() {
    try { localStorage.removeItem("tubecrawler_unlocks"); }
    catch(e) {}
}

function getDNA() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_dna") || "{}"); }
    catch(e) { return {}; }
}
function setDNA(obj) {
    try { localStorage.setItem("tubecrawler_dna", JSON.stringify(obj)); }
    catch(e) {}
}
function addDNA(key, amount) {
    const inv = getDNA();
    inv[key] = (inv[key] || 0) + amount;
    setDNA(inv);
}
function deductDNA(key, amount) {
    const inv = getDNA();
    inv[key] = Math.max(0, (inv[key] || 0) - amount);
    setDNA(inv);
}
function clearDNA() {
    try { localStorage.removeItem("tubecrawler_dna"); }
    catch(e) {}
}
