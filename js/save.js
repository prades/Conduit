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
            isGenerator: !!t.isGenerator,
            isConnector: !!t.isConnector,
            circuitOn: t.circuitOn !== false
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
// Put the saved kills back. World generation always rebuilds a nest at full
// health, so this is what makes a zone you took stay taken. It used to be
// written out inline in init.js, with a second copy of the same three lines in
// the test that covers it — so the test could agree with itself while the game
// did something else.
function applyNests(saved) {
    if (!Array.isArray(saved)) return 0;
    let n = 0;
    for (const s of saved) {
        if (!s) continue;
        const tile = worldTileMap.get(`${s.x},${s.y}`);
        if (tile && tile.nest) { tile.nestHealth = 0; n++; }
    }
    return n;
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
    try {
        const raw = localStorage.getItem("tubecrawler_shards");
        // Never saved: a brand-new play, which starts with the grant. A saved
        // "0" is a real zero and is left alone.
        if (raw === null || raw === undefined) return STARTING_SHARDS;
        const n = parseInt(raw);
        return Number.isFinite(n) ? n : 0;
    }
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
    try {
        const raw = localStorage.getItem("tubecrawler_unlocks");
        return raw ? JSON.parse(raw) : [...STARTING_ELEMENTS];
    }
    catch(e) { return [...STARTING_ELEMENTS]; }
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

        // THE FIGHT IN PROGRESS, read through typeof every time.
        //
        // saveSession's whole body sits in one try/catch, so a single missing
        // global here does not cost you this field — it costs you the entire
        // session, silently, forever. Nothing on the page would say so.
        const _fight = {
            phase:  (typeof gameState !== "undefined" && gameState) ? gameState.phase : "day",
            kills:  typeof nightKillCount          === "number" ? nightKillCount          : 0,
            target: typeof nightEnemiesTarget      === "number" ? nightEnemiesTarget      : 0,
            remaining: typeof nightPredatorsRemaining === "number" ? nightPredatorsRemaining : 0,
            alertActive: typeof alertActive !== "undefined" && !!alertActive,
            alertTimer: typeof alertTimer === "number" ? alertTimer : 0,
            alertType:  typeof alertType  === "string" ? alertType  : null,
            alertZone:  typeof alertZone  === "number" ? alertZone  : null,
            alertSource: (typeof alertSource !== "undefined" && alertSource
                          && Number.isFinite(alertSource.x))
                ? { x: alertSource.x, y: alertSource.y } : null,
        };

        localStorage.setItem("tubecrawler_session", JSON.stringify({
            px: player.x, py: player.y,
            health: Math.round(health),
            // The bar is a session thing, like health. The surge TIMER is not
            // saved on purpose: a ten-second buff resuming hours later would be
            // a stranger outcome than letting it lapse.
            ult: Math.round(playerUltimate),
            // The switch is a standing preference, so it belongs with the rest
            // of the session rather than resetting to on every refresh.
            siphon: !!siphonEnabled,
            lastGenX,
            explored: [...exploredZones],
            nests, panels, nodes, npcs, waveNpcs,
            mass: serialiseChargedMass(),
            nestStock: world.filter(t => t.nest && t.massStock > 0).map(t => ({ x: t.x, y: t.y, m: t.massStock })),
            // Without this a refresh during a wave put the player back in
            // "day" with the alarm gone and the kill count at zero — the wave
            // NUMBER survived in tubecrawler_gamestate, but the wave itself
            // started over, which is what "it resets to the beginning" meant.
            fight: _fight,
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
    // Clamped on the way in: a hand-edited or older save must not leave the bar
    // reading as permanently charged, nor above what the meter can draw.
    if (Number.isFinite(sess.ult)) {
        playerUltimate = Math.max(0, Math.min(PLAYER_ULT_MAX, sess.ult));
    }
    // Only a real boolean flips it: anything else leaves the siphon on, which
    // is the state a player who has never touched the switch expects.
    if (typeof sess.siphon === "boolean") siphonEnabled = sess.siphon;
    // Not an assignment: the ground has to exist before anything is restored
    // onto it. Setting the marker alone left the later zones unbuilt, and every
    // pylon and taken nest out there was dropped on the way back in.
    // Deliberately no fallback that just moves the marker. That line WAS the
    // bug, and a marker standing over ground nobody built is worse than a
    // frontier that never moved.
    if (typeof ensureWorldTo === "function") ensureWorldTo(sess.lastGenX);
    if (Array.isArray(sess.explored)) exploredZones = new Set(sess.explored);

    // Back into the fight you were in. A save written before this existed has
    // no `fight` block at all, so the player simply resumes in day phase as
    // they used to rather than being dropped into a half-restored alarm.
    const f = sess.fight;
    if (f && typeof f === "object") {
        // Guarded, not assumed. applySession runs in one try-less block, so a
        // missing global here would abort every restore that follows it — the
        // position, the nest links, the panels — and leave the player with a
        // half-loaded game rather than one missing feature.
        if (typeof gameState !== "undefined" && gameState
            && (f.phase === "day" || f.phase === "night" || f.phase === "waveComplete")) {
            gameState.phase = f.phase;
        }
        if (Number.isFinite(f.kills))     nightKillCount          = Math.max(0, f.kills);
        if (Number.isFinite(f.target))    nightEnemiesTarget      = Math.max(0, f.target);
        if (Number.isFinite(f.remaining)) nightPredatorsRemaining = Math.max(0, f.remaining);
        // The alarm only comes back if it had time left on it. A zero or
        // negative timer is an alarm that was about to expire anyway, and
        // restoring one of those leaves a siren nothing will ever turn off.
        if (f.alertActive && Number.isFinite(f.alertTimer) && f.alertTimer > 0) {
            alertActive = true;
            alertTimer  = f.alertTimer;
            alertType   = f.alertType || "zone";
            alertZone   = Number.isFinite(f.alertZone) ? f.alertZone : null;
            alertSource = (f.alertSource && Number.isFinite(f.alertSource.x))
                ? { x: f.alertSource.x, y: f.alertSource.y } : null;
        }
    }

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
    // (Floor nests and cocoons are gone from the game; an older save's
    // `cocoons` and `nestSites` fields are simply not read.)
    // What the predators have paid into each wall nest so far.
    if (Array.isArray(sess.nestStock)) {
        for (const n of sess.nestStock) {
            const t = n && typeof getTile === "function" ? getTile(n.x, n.y) : null;
            if (t && t.nest && Number.isFinite(n.m)) t.massStock = Math.max(0, n.m);
        }
    }

    // Force the 60-frame world caches to rebuild against the restored tiles.
    _cacheAge = -999;
}
