// DNA inventory — backed by localStorage so it survives everything
let floatingTexts = []; // { x, y, text, color, life, vy }

function saveGameState() {
    try { localStorage.setItem("tubecrawler_gamestate", JSON.stringify({
        nightNumber: gameState.nightNumber,
        totalWavesSurvived: gameState.totalWavesSurvived,
        highestZoneCleared: gameState.highestZoneCleared,
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

// The permanent-upgrade store died with the shop. Nothing writes it any more,
// but old browsers still hold the key, so clearing it stays reachable.
function clearPermUpgrades() {
    try { localStorage.removeItem("tubecrawler_permupgrades"); } catch(e) {}
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
            upgraded: !!t.upgraded,
            isGenerator: !!t.isGenerator
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

// ── DESTROYED NESTS ──
// Nests are floor tiles, not pillars, so savePylons() never covered them and
// world generation always rebuilds them at full health. Without this a nest the
// player destroyed came back on the next page load.
function saveNests() {
    const data = world
        .filter(t => t.nest && t.nestHealth <= 0)
        .map(t => ({ x: t.x, y: t.y }));
    try { localStorage.setItem("tubecrawler_nests", JSON.stringify(data)); } catch(e) {}
}
function loadNests() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_nests") || "null"); }
    catch(e) { return null; }
}
function clearNests() {
    try { localStorage.removeItem("tubecrawler_nests"); } catch(e) {}
}

function getAmmo() {
    try {
        const v = localStorage.getItem("tubecrawler_ammo");
        if (v === null) return PLAYER_AMMO_START;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? Math.max(0, Math.min(PLAYER_AMMO_MAX, n)) : PLAYER_AMMO_START;
    } catch (e) { return PLAYER_AMMO_START; }
}
function saveAmmo() {
    try { localStorage.setItem("tubecrawler_ammo", String(playerAmmo)); } catch (e) {}
}
function clearAmmo() {
    try { localStorage.removeItem("tubecrawler_ammo"); } catch (e) {}
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

// ── SESSION SNAPSHOT ──────────────────────────────────────
// Everything that made a refresh feel like a reset: where the player is, how
// hurt they are, which nests are linked to which pylons, how far they have
// explored, and the state of the panels and capture nodes. Paired with the
// saved world seed in js/rng.js, reloading resumes rather than restarts.
function saveSession() {
    try {
        const nests = world.filter(t => t.nest).map(t => ({
            x: t.x, y: t.y, h: t.nestHealth,
            // Connections are stored as coordinates; object references cannot
            // survive JSON, and the tiles are rebuilt fresh on load.
            cx: t.connectedPylon ? t.connectedPylon.x : null,
            cy: t.connectedPylon ? t.connectedPylon.y : null,
        }));
        const panels = world.filter(t => t.nodeType === "wall_panel").map(t => ({
            x: t.x, y: t.y, a: !!t.panelActivated,
            r: t.shardReward, n: t.panelTimesActivated || 0, d: !!t.isDecoy,
        }));
        const nodes = world.filter(t => t.capturable).map(t => ({
            x: t.x, y: t.y, c: !!t.captured, p: !!t.predatorOwned,
        }));
        // Recruits still standing. Anything converted or killed is absent, so
        // it will not be handed back on the next load.
        //
        // Two kinds, and both have to be saved. Segment-generated ones carry a
        // spawnKey and are re-created by generateSegment, so only the key is
        // needed. The ones nextWave() drops in between waves have NO spawnKey
        // and nothing regenerates them — they were simply lost on every
        // refresh, which is why the map came up empty after a wave.
        const liveRecruits = actors.filter(a => !a.dead && a.team === "red" && a.isNeutralRecruit);
        const npcs = liveRecruits
            .filter(a => a.spawnKey !== undefined)
            .map(a => a.spawnKey);
        const waveNpcs = liveRecruits
            .filter(a => a.spawnKey === undefined)
            .map(a => ({ x: +a.x.toFixed(2), y: +a.y.toFixed(2), h: Math.round(a.health) }));

        localStorage.setItem("tubecrawler_session", JSON.stringify({
            px: player.x, py: player.y,
            health: Math.round(health),
            lastGenX,
            explored: [...exploredZones],
            nests, panels, nodes, npcs, waveNpcs,
            mass: serialiseChargedMass(),
            cocoons: serialiseCocoons(),
        }));
    } catch (e) {}
}

function loadSession() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_session") || "null"); }
    catch (e) { return null; }
}

// The between-wave recruits, rebuilt in the shape nextWave() spawns them.
// Without this they vanished on every refresh and the map looked barren.
function restoreWaveRecruits(data) {
    if (!Array.isArray(data)) return;
    for (const d of data) {
        if (!d || !Number.isFinite(d.x) || !Number.isFinite(d.y)) continue;
        actors.push({
            type: "virus", element: null, x: d.x, y: d.y,
            team: "red", isNeutralRecruit: true,
            health: Math.max(1, d.h || 15), maxHealth: 15,
            moveSpeed: 0.018, power: 2,
            stats: null, personality: null, role: null,
            currentResonance: 0, currentWill: 0,
            walkCycle: 0, moveCooldown: 0,
            stance: "wander", isFollower: false, isHealing: false,
            hitFlash: 0, spawnProtection: 120, dead: false, convertFlash: 0,
        });
    }
}

// Kills earned and elements pending activation. Kept out of the session blob
// because they are game-long progress, not a snapshot of where you are —
// clearing a session must not cost the player their elements.
function saveProgress() {
    try {
        localStorage.setItem("tubecrawler_progress", JSON.stringify({
            kills: lifetimeKills, pending: pendingElements,
            // The modulation belongs here rather than in the session snapshot:
            // it is a standing choice about the colony, not where the player is
            // standing. Left out of the save it silently reset to "any" on every
            // refresh, which for a HUD control the player sets deliberately is
            // its own kind of broken.
            modulation: [...modulationMask],
        }));
    } catch (e) {}
}
function loadProgress() {
    try { return JSON.parse(localStorage.getItem("tubecrawler_progress") || "null"); }
    catch (e) { return null; }
}
function clearProgress() {
    try { localStorage.removeItem("tubecrawler_progress"); } catch (e) {}
}
function applyProgress(p) {
    if (!p) return;
    lifetimeKills = Number.isFinite(p.kills) ? Math.max(0, p.kills) : 0;
    pendingElements = Array.isArray(p.pending)
        ? p.pending.filter(e => typeof e === "string" && !unlockedElements.has(e))
        : [];
    // Only elements this save has actually brought online. An empty mask reads
    // as "any", which is the right answer both for a fresh save and for one
    // whose every saved element has since been relocked by a reset.
    modulationMask = new Set(
        (Array.isArray(p.modulation) ? p.modulation : [])
            .filter(e => typeof e === "string" && unlockedElements.has(e))
    );
}

function clearSession() {
    try { localStorage.removeItem("tubecrawler_session"); } catch (e) {}
}

// Applied after world generation and the pylon restore, so the tiles these
// refer to already exist.
function applySession(sess) {
    if (!sess) return;
    if (Number.isFinite(sess.px) && Number.isFinite(sess.py)) {
        player.x = player.targetX = player.visualX = sess.px;
        player.y = player.targetY = player.visualY = sess.py;
    }
    if (Number.isFinite(sess.health)) health = Math.max(1, Math.min(100, sess.health));
    if (Number.isFinite(sess.lastGenX)) lastGenX = Math.max(lastGenX, sess.lastGenX);
    if (Array.isArray(sess.explored)) exploredZones = new Set(sess.explored);

    const at = (x, y) => worldTileMap.get(`${x},${y}`);

    (sess.nests || []).forEach(n => {
        const t = at(n.x, n.y);
        if (!t || !t.nest) return;
        if (Number.isFinite(n.h)) t.nestHealth = n.h;
        if (n.cx !== null && n.cx !== undefined) {
            const pylon = at(n.cx, n.cy);
            if (pylon && pylon.pillar) { t.connectedPylon = pylon; pylon.nestConnection = t; }
        }
    });
    (sess.panels || []).forEach(p => {
        const t = at(p.x, p.y);
        if (!t || t.nodeType !== "wall_panel") return;
        t.panelActivated     = !!p.a;
        t.isDecoy            = !!p.d;
        if (Number.isFinite(p.r)) t.shardReward = p.r;
        t.panelTimesActivated = p.n || 0;
        t.siphonProgress      = 0;
    });
    (sess.nodes || []).forEach(n => {
        const t = at(n.x, n.y);
        if (!t || !t.capturable) return;
        t.captured      = !!n.c;
        t.predatorOwned = !!n.p;
    });
    restoreChargedMass(sess.mass);
    restoreWaveRecruits(sess.waveNpcs);
    // After the pylon restore, so a cocoon's anchors resolve to real tiles.
    restoreCocoons(sess.cocoons);

    // Force the 60-frame world caches to rebuild against the restored tiles.
    _cacheAge = -999;
}
