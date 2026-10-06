// ─────────────────────────────────────────────────────────
//  AUTOPLAY — the squad plays the game by itself
// ─────────────────────────────────────────────────────────
// "Create a simple set of instructions for the followers to use to autoplay the
// game by themselves, including hacking the nests ... build pylon networks and
// extend the pylons from different conquered nests and increase the network
// tier ... make them use their ultimates, and bundle all of this into an
// autoplay feature button."
//
// The instructions, run in this order every AUTOPLAY_THINK frames:
//
//   1. NIGHT → FIGHT. While an alarm runs, the squad attacks the enemies near
//      the alarm, the player moves up behind them, and nothing else happens.
//   2. DAY → HACK. A team of AUTOPLAY_HACK_TEAM followers walks to the next
//      nest's hack spot and hacks it (followers can hack when ORDERED to:
//      `hackOrder`, read in game.js). The player waits a little behind.
//   3. ALWAYS → BUILD, one pylon per think, while the shards last:
//        a. a GENERATOR beside every nest you hold that has none,
//        b. a CONNECTOR beside the frontier nest, reaching toward the next zone,
//        c. a NETWORK of one element at each held nest, grown pylon by pylon
//           (linked, toward the next zone) to AUTOPLAY_NETWORK_SIZE — tier III
//           comes at 6. Two turrets for every support/disruption pylon.
//   4. ALWAYS → ULTIMATES. A follower with a full bar and an enemy within
//      AUTOPLAY_ULT_RANGE fires it (the duo ultimate if its partner can).
//   5. ALWAYS → WORK CREW. About a quarter of the squad works, so kills keep
//      turning into the shards the building needs; and by day, short of
//      shards, the player siphons wall panels in zones already taken.
//   6. WAVE CLEARED → NEXT WAVE, after a short pause to read the screen.
const AUTOPLAY_THINK        = 45;
const AUTOPLAY_HACK_TEAM    = 3;
const AUTOPLAY_ULT_RANGE    = 4;
const AUTOPLAY_NETWORK_SIZE = 7;
const AUTOPLAY_NET_RADIUS   = 9;    // tiles from its nest a network is counted and grown in
const AUTOPLAY_WORK_SHARE   = 0.25;
const AUTOPLAY_NEXT_WAVE_MS = 1500;
const AUTOPLAY_SHARD_LOW    = 40;   // below this, by day, the player siphons safe panels first
let autoplayOn = false;
let _autoWaveSince = 0;

const ICON_AUTO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="7" width="14" height="11" rx="3"/><rect x="11" y="3" width="2" height="4"/><circle cx="12" cy="3" r="1.6"/><circle cx="9.5" cy="12" r="1.6" fill="#000"/><circle cx="14.5" cy="12" r="1.6" fill="#000"/><rect x="2.5" y="10" width="2" height="5" rx="1"/><rect x="19.5" y="10" width="2" height="5" rx="1"/></svg>';

function updateAutoplayButton() {
    const b = typeof document !== "undefined" ? document.getElementById("btnAuto") : null;
    if (!b) return;
    if (typeof _setTopButton === "function")
        _setTopButton(b, ICON_AUTO, autoplayOn ? "ON" : "AUTO", "Autoplay: " + (autoplayOn ? "on" : "off"), autoplayOn);
}
function toggleAutoplay() {
    autoplayOn = !autoplayOn;
    if (!autoplayOn) _autoRelease();
    updateAutoplayButton();
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 90,
        text: autoplayOn ? "▶ AUTOPLAY ON — the squad takes over" : "AUTOPLAY OFF", color: "#7fd4ff", life: 120, vy: -0.2, size: 13 });
}
// Hand the squad back: no orders of autoplay's left standing.
function _autoRelease() {
    for (const f of followers) {
        if (f.hackOrder) { f.hackOrder = null; if (f.job && f.job.type === "move") f.job = null; f.stance = "follow"; }
        if (f._autoJob) { f._autoJob = false; if (f.job && (f.job.type === "move" || f.job.type === "attack")) f.job = null; f.stance = "follow"; }
    }
}

// ── 6. Runs every animation frame, even while paused, for the wave-clear screen.
function autoplayWatch() {
    if (!autoplayOn || typeof gameState === "undefined") return;
    if (gameState.phase === "waveComplete" && !gameState.running) {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (!_autoWaveSince) _autoWaveSince = now;
        else if (now - _autoWaveSince >= AUTOPLAY_NEXT_WAVE_MS) { _autoWaveSince = 0; nextWave(); }
    } else _autoWaveSince = 0;
}

// ── Runs inside the game loop.
function autoplayTick() {
    if (!autoplayOn) return;
    if (frame % 15 === 0) _autoUltimates();
    if (frame % AUTOPLAY_THINK !== 0) return;
    _autoWorkCrew();
    if (gameState.phase === "night" || alertActive) _autoFight();
    else _autoHack();
    _autoBuild();
}

// ── helpers ──
const _autoTile = (x, y) => (typeof worldTileMap !== "undefined" ? worldTileMap.get(x + "," + y) : null);
function _autoFree(t) {
    return !!t && t.type === "floor" && !t.pillar && !t.nest && !t.nodeType && !t.capturable && t.y >= 0 && t.y <= 3;
}
function _autoMovePlayer(x, y) {
    player.targetX = x; player.targetY = Math.max(0, Math.min(3, y));
}
function _autoNextNest() {
    const z = typeof nextZoneToTake === "function" ? nextZoneToTake() : 1;
    return (typeof _nestCache !== "undefined" ? _nestCache : []).find(n => n.nestZone === z && nestIsHackable(n)) || null;
}
function _autoHeldNests() {
    return (typeof _nestCache !== "undefined" ? _nestCache : []).filter(n => nestIsPowerSource(n)).sort((a, b) => a.x - b.x);
}

// 1. NIGHT: everyone on the enemies near the alarm.
function _autoFight() {
    for (const f of followers) if (f.hackOrder) { f.hackOrder = null; if (f.job && f.job.type === "move") f.job = null; f.stance = "follow"; }
    const src = alertSource || player;
    _autoMovePlayer(src.x - 2, 2);
    const foes = actors.filter(a => isHostileTarget(a) && !a.isWanderer && Math.abs(a.x - src.x) < 12)
                       .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    if (!foes.length) return;
    const free = followers.filter(f => !f.dead && f.duty !== "worker" && (!f.job || f._autoJob && f.job.type === "attack" && (!f.job.target || f.job.target.dead)));
    free.forEach((f, i) => { f.job = { type: "attack", target: foes[i % foes.length] }; f._autoJob = true; });
}

// A wall panel worth siphoning: not yet drained, in a zone you hold or the
// next one to take — a decoy there only starts the night that hacking its nest
// would have started anyway. Never further out. Nearest first.
function _autoSafePanel() {
    if (typeof _wallPanelCache === "undefined") return null;
    const front = typeof nextZoneToTake === "function" ? nextZoneToTake() : 1;
    let best = null, bd = Infinity;
    for (const t of _wallPanelCache) {
        if (t.panelActivated) continue;
        const z = typeof zoneOfTile === "function" ? zoneOfTile(t) : getZoneIndex(Math.floor(t.x));
        if (z > front) continue;
        const d = Math.abs(t.x - player.x);
        if (d < bd) { bd = d; best = t; }
    }
    return best;
}

// 2. DAY: the hack team to the next nest. Short of shards, the player first
// siphons a safe wall panel — the building runs on them.
function _autoHack() {
    const nest = _autoNextNest();
    const panel = shardCount < AUTOPLAY_SHARD_LOW ? _autoSafePanel() : null;
    if (!nest) { const home = typeof homePortalTile === "function" ? homePortalTile() : null;
                 if (panel) _autoMovePlayer(panel.x, panel.y + 1); else if (home) _autoMovePlayer(home.x, 2); return; }
    const spot = nestHackCentre(nest);
    if (panel) { player.targetX = panel.x; player.targetY = panel.y + 1; }
    else _autoMovePlayer(spot.x - 2, 2);
    let team = followers.filter(f => !f.dead && f.hackOrder === nest);
    if (team.length < AUTOPLAY_HACK_TEAM) {
        const pick = followers.filter(f => !f.dead && !f.hackOrder && f.duty !== "worker" && !f.returningToCrystal)
                              .sort((a, b) => (b.health / b.maxHealth) - (a.health / a.maxHealth))
                              .slice(0, AUTOPLAY_HACK_TEAM - team.length);
        pick.forEach(f => { f.hackOrder = nest; f.job = { type: "move", target: { x: spot.x, y: spot.y } }; f.stance = "hold"; });
    }
    // A move order drops when the follower is hurt; send it back to the spot.
    for (const f of followers) if (f.hackOrder === nest && !f.job) { f.job = { type: "move", target: { x: spot.x, y: spot.y } }; f.stance = "hold"; }
}

// 3. BUILD: one thing per think.
function _autoBuild() {
    if (shardCount < PYLON_BUILD_COST) return;
    const held = _autoHeldNests();
    const next = _autoNextNest();
    const frontier = held[held.length - 1];
    for (const nest of held) {
        if (_autoEnsureRelay(nest, GENERATOR_ID, isGeneratorPylon, 0)) return;
        if (nest === frontier && next && _autoEnsureRelay(nest, CONNECTOR_ID, isConnectorPylon, 1)) return;
        if (_autoGrowNetwork(nest, next)) return;
    }
}
// A relay of this kind within reach of the nest, or build one. `ahead` pushes
// the connector toward the next zone.
function _autoEnsureRelay(nest, id, isKind, ahead) {
    const have = (typeof _pillarCache !== "undefined" ? _pillarCache : []).some(t => isKind(t) && t.pillarTeam === "green"
        && Math.hypot(t.x - nest.x, t.y - nest.y) <= GENERATOR_NEST_RANGE);
    if (have) return false;
    const el = PYLON_PICKER_TYPES.find(e => e.id === id);
    let best = null, bs = -Infinity;
    for (let dx = -3; dx <= 5; dx++) for (let y = 1; y <= 3; y++) {
        const t = _autoTile(nest.x + dx, y);
        if (!_autoFree(t) || !canPlaceGenerator(t).ok) continue;
        const s = (ahead ? dx : -Math.abs(dx - 1)) - Math.abs(y - 2) * 0.5;
        if (s > bs) { bs = s; best = t; }
    }
    if (!best) return false;
    _executeBuildInstant(el, best, null);
    return true;
}
// The element a held nest's network is built in: the one the squad has most
// of (it is also what the hack team and fighters lean on), fixed once chosen.
function _autoNetworkElement(nest) {
    if (nest._autoEl && unlockedElements.has(nest._autoEl)) return nest._autoEl;
    const counts = {};
    for (const f of followers) if (!f.dead && unlockedElements.has(f.element)) counts[f.element] = (counts[f.element] || 0) + 1;
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    nest._autoEl = ranked[0] || [...unlockedElements][0] || "fire";
    return nest._autoEl;
}
function _autoGrowNetwork(nest, next) {
    const elId = _autoNetworkElement(nest);
    const el = ELEMENTS.find(e => e.id === elId);
    if (!el) return false;
    // One radius for counting the network and for placing in it, or pylons
    // placed at the far end stop being counted and it never stops growing.
    const near = (typeof _pillarCache !== "undefined" ? _pillarCache : []).filter(t => t.pillarTeam === "green" && !t.destroyed
        && Math.hypot(t.x - nest.x, t.y - nest.y) <= AUTOPLAY_NET_RADIUS);
    const mine = near.filter(t => t.attackModeElement === elId && !isRelayPylon(t));
    if (mine.length >= AUTOPLAY_NETWORK_SIZE) return false;
    // Linked to the cluster (within link range of one of ours or a relay
    // here), not crowding it, and leaning toward the next zone.
    const anchors = near.length ? near : [nest];
    const R = getPylonRange() - 0.15, dirX = next && next.x > nest.x ? 1 : 0;
    let best = null, bs = -Infinity;
    for (let dx = -4; dx <= 9; dx++) for (let y = 0; y <= 3; y++) {
        const t = _autoTile(nest.x + dx, y);
        if (!_autoFree(t) || Math.hypot(t.x - nest.x, t.y - nest.y) > AUTOPLAY_NET_RADIUS) continue;
        let link = false, crowd = false;
        for (const a of anchors) { const d = Math.hypot(a.x - t.x, a.y - t.y); if (d <= R) link = true; if (d < 1.9) crowd = true; }
        if (!link || crowd) continue;
        const s = dx * dirX * 0.6 - Math.abs(y - 2) * 0.3 - Math.abs(dx) * (1 - dirX) * 0.3;
        if (s > bs) { bs = s; best = t; }
    }
    if (!best) return false;
    // Two turrets for every support/disruption pylon.
    const kind = mine.length % 3 === 2 ? waveRole(elId) : "attack";
    _executeBuildInstant(el, best, kind);
    return true;
}

// 4. ULTIMATES.
function _autoUltimates() {
    const r2 = AUTOPLAY_ULT_RANGE * AUTOPLAY_ULT_RANGE;
    for (const f of followers) {
        if (f.dead || !(f.ultimateCharge >= 100)) continue;
        if (!actors.some(a => isHostileTarget(a) && (a.x - f.x) ** 2 + (a.y - f.y) ** 2 <= r2)) continue;
        if (typeof tryDuoUltimate === "function" && tryDuoUltimate(f)) continue;
        const u = FOLLOWER_ULTIMATES[f.element];
        if (u) u.execute(f);
    }
}

// 5. WORK CREW: keep about a quarter of the squad turning kills into shards.
function _autoWorkCrew() {
    if (typeof setFollowerDuty !== "function") return;
    const live = followers.filter(f => !f.dead && !f.hackOrder);
    const want = Math.floor(live.length * AUTOPLAY_WORK_SHARE);
    let have = live.filter(f => f.duty === "worker").length;
    for (const f of live) {
        if (have >= want) break;
        if (f.duty === "worker" || (typeof canWorkMass === "function" && !canWorkMass(f))) continue;
        if (setFollowerDuty(f, "worker", true)) have++;
    }
}
