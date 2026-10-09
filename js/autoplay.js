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
//      the alarm.
//   2. DAY → HACK. A team of AUTOPLAY_HACK_TEAM followers walks to the next
//      nest's hack spot and hacks it (followers can hack when ORDERED to:
//      `hackOrder`, read in game.js).
//   It NEVER moves your character — you stay free to go where you like.
//   3. ALWAYS → BUILD, one pylon per think, while the shards last:
//        a. a GENERATOR beside every nest you hold that has none,
//        b. a CONNECTOR beside the frontier nest, reaching toward the next zone,
//        c. THE BASE PLAN at each held nest (_autoGrowNetwork): two turrets,
//           a bank of batteries (tier III), an ULTRA TURRET square, a
//           FORMATION square (black hole / firewall / ice / toxic tower), and
//           a couple of support pylons if shards are spare. Then it stops.
//   4. ALWAYS → ULTIMATES. A follower with a full bar and an enemy within
//      AUTOPLAY_ULT_RANGE fires it (the duo ultimate if its partner can).
//   5. ALWAYS → WORK CREW. About a quarter of the squad works, so kills keep
//      turning into the shards the building needs; and by day, short of
//      shards, one follower drains wall panels no further out than the next zone.
//   6. WAVE CLEARED → NEXT WAVE, after a short pause to read the screen.
const AUTOPLAY_THINK        = 45;
const AUTOPLAY_HACK_TEAM    = 3;
const AUTOPLAY_ULT_RANGE    = 4;
const AUTOPLAY_BATTERIES    = 6;    // a bank of batteries for tier III (BATTERY_TIER_SIZES)
const AUTOPLAY_ACCESSORIES  = 2;    // support pylons per nest, once the plan is built …
const AUTOPLAY_SPARE        = 40;   // … and only while this many shards are left over
const AUTOPLAY_FORM_ORDER   = ["toxic", "ice", "flux", "fire"];   // formation element, when the network's forms nothing
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
        if (f.hackOrder || f.siphonOrder) { f.hackOrder = null; f.siphonOrder = null; if (f.job && f.job.type === "move") f.job = null; f.stance = "follow"; }
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
    // Centred on the alarm, not on you: autoplay never moves your character.
    const src = alertSource || player;
    const foes = actors.filter(a => isHostileTarget(a) && !a.isWanderer && Math.abs(a.x - src.x) < 12)
                       .sort((a, b) => Math.hypot(a.x - src.x, a.y - src.y) - Math.hypot(b.x - src.x, b.y - src.y));
    if (!foes.length) return;
    const free = followers.filter(f => !f.dead && f.duty !== "worker" && (!f.job || f._autoJob && f.job.type === "attack" && (!f.job.target || f.job.target.dead)));
    free.forEach((f, i) => { f.job = { type: "attack", target: foes[i % foes.length] }; f._autoJob = true; });
}

// A wall panel worth siphoning: not yet drained, in a zone you hold or the
// next one to take — a decoy there only starts the night that hacking its nest
// would have started anyway. Never further out. Nearest first.
function _autoSafePanel(nearX) {
    if (typeof _wallPanelCache === "undefined") return null;
    const front = typeof nextZoneToTake === "function" ? nextZoneToTake() : 1;
    let best = null, bd = Infinity;
    for (const t of _wallPanelCache) {
        if (t.panelActivated) continue;
        const z = typeof zoneOfTile === "function" ? zoneOfTile(t) : getZoneIndex(Math.floor(t.x));
        if (z > front) continue;
        const d = Math.abs(t.x - nearX);
        if (d < bd) { bd = d; best = t; }
    }
    return best;
}

// 2. DAY: the hack team to the next nest, and — short of shards — one runner
// to drain the nearest safe wall panel (followers can siphon when ORDERED to:
// siphonOrder, read in game.js). REPORTED: "it keeps teleporting me to the
// current zone" — autoplay used to steer YOUR character to every fight, nest
// and panel, every think, and a far target is a long lerp that reads as a jump.
// It never touches your character now; the squad goes, you go where you like.
function _autoHack() {
    const nest = _autoNextNest();
    _autoSiphon(nest);
    if (!nest) return;
    const spot = nestHackCentre(nest);
    let team = followers.filter(f => !f.dead && f.hackOrder === nest);
    if (team.length < AUTOPLAY_HACK_TEAM) {
        const pick = followers.filter(f => !f.dead && !f.hackOrder && !f.siphonOrder && f.duty !== "worker" && !f.returningToCrystal)
                              .sort((a, b) => (b.health / b.maxHealth) - (a.health / a.maxHealth))
                              .slice(0, AUTOPLAY_HACK_TEAM - team.length);
        pick.forEach(f => { f.hackOrder = nest; f.job = { type: "move", target: { x: spot.x, y: spot.y } }; f.stance = "hold"; });
    }
    // A move order drops when the follower is hurt; send it back to the spot.
    for (const f of followers) if (f.hackOrder === nest && !f.job) { f.job = { type: "move", target: { x: spot.x, y: spot.y } }; f.stance = "hold"; }
}

function _autoSiphon(nest) {
    // A drained panel releases its runner.
    for (const f of followers) if (f.siphonOrder && (f.siphonOrder.panelActivated || f.dead)) {
        f.siphonOrder = null; if (f.job && f.job.type === "move") f.job = null; f.stance = "follow";
    }
    if (shardCount >= AUTOPLAY_SHARD_LOW) return;
    const near = nest ? nest.x : (typeof homePortalTile === "function" && homePortalTile() ? homePortalTile().x : player.x);
    const panel = _autoSafePanel(near);
    if (!panel) return;
    let runner = followers.find(f => !f.dead && f.siphonOrder);
    if (!runner) runner = followers.find(f => !f.dead && !f.hackOrder && f.duty !== "worker" && !f.returningToCrystal);
    if (!runner) return;
    runner.siphonOrder = panel;
    if (!runner.job || runner.job.type !== "move" || runner.job.target.x !== panel.x)
        { runner.job = { type: "move", target: { x: panel.x, y: panel.y + 1 } }; runner.stance = "hold"; }
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
// ── THE BASE PLAN at each held nest ──────────────────────
// REPORTED: "reimagine the autoplay mode to reinforce building batteries and
// ultra pylons when applicable, also create a fair number of other
// accessories but not spammy." One build per think, in this order, and a
// nest is FINISHED when its plan is — about seventeen structures, not a
// carpet of pylons:
//   1. two ATTACK TURRETS — the first two corners of the ULTRA square, so it
//      has guns from the start;
//   2. a BANK of AUTOPLAY_BATTERIES batteries of the network element — tier III;
//   3. the other two corners: the four turrets fuse into an ULTRA TURRET;
//   4. a square of four WAVE PYLONS of a formation element (flux, fire, ice
//      or toxic — the network element if it is one) — a black hole, spinning
//      firewall, ice generator or toxic tower;
//   5. ACCESSORIES: AUTOPLAY_ACCESSORIES support pylons (electric haste, or
//      core shields), only while shards stay above AUTOPLAY_SPARE.
// The two squares are claimed up front (nest._autoPlan) and kept clear of
// everything else; the ultra takes the back rows so the front lane stays open.
function _autoNear(nest) {
    return (typeof _pillarCache !== "undefined" ? _pillarCache : []).filter(t => t.pillarTeam === "green" && !t.destroyed
        && Math.hypot(t.x - nest.x, t.y - nest.y) <= AUTOPLAY_NET_RADIUS);
}
function _autoSquareTiles(sq) {
    return [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => _autoTile(sq.x0 + dx, sq.y0 + dy));
}
// Is this tile already what the square wants?
function _autoTileIs(t, el, kind) {
    if (!t || !t.pillar || t.destroyed || t.pillarTeam !== "green" || t.attackModeElement !== el) return false;
    return kind === "attack" ? !!t.attackMode && !t.isBattery : !!t.waveMode;
}
// The best free 2x2 at this nest: every tile free, linked to what is already
// there (so it is powered), rows `rows` preferred, leaning toward the next zone.
function _autoFindSquare(nest, next, rows, reserved) {
    const near = _autoNear(nest), anchors = near.length ? near : [nest];
    const R = getPylonRange() - 0.15, dirX = next && next.x > nest.x ? 1 : 0;
    let best = null, bs = -Infinity;
    for (const y0 of [rows, rows === 0 ? 2 : 0, 1]) for (let dx = -4; dx <= 8; dx++) {
        const sq = { x0: nest.x + dx, y0 }, tiles = _autoSquareTiles(sq);
        if (!tiles.every(t => _autoFree(t) && !reserved.has(t.x + "," + t.y))) continue;
        if (tiles.some(t => Math.hypot(t.x - nest.x, t.y - nest.y) > AUTOPLAY_NET_RADIUS)) continue;
        if (!tiles.some(t => anchors.some(a => Math.hypot(a.x - t.x, a.y - t.y) <= R))) continue;
        const s = (y0 === rows ? 10 : y0 === 1 ? 0 : 5) + dx * dirX * 0.4 - Math.abs(dx) * (1 - dirX) * 0.4;
        if (s > bs) { bs = s; best = sq; }
    }
    return best;
}
// Build the next tile of the planned square, up to `upTo` of its four.
function _autoSquareStep(nest, next, key, elId, kind, upTo, rows, reserved) {
    const plan = nest._autoPlan || (nest._autoPlan = {});
    let sq = plan[key];
    // A square something else has taken a tile of is given up for another.
    if (sq && !_autoSquareTiles(sq).every(t => t && (_autoFree(t) || _autoTileIs(t, elId, kind)))) sq = null;
    if (!sq) { sq = _autoFindSquare(nest, next, rows, reserved); plan[key] = sq; if (!sq) return false; }
    const tiles = _autoSquareTiles(sq);
    tiles.forEach(t => reserved.add(t.x + "," + t.y));
    if (tiles.filter(t => _autoTileIs(t, elId, kind)).length >= upTo) return false;
    const t = tiles.find(t => _autoFree(t));
    if (!t) return false;
    _executeBuildInstant(ELEMENTS.find(e => e.id === elId), t, kind);
    return true;
}
// One pylon linked to `anchors`, not crowding them, off the reserved squares.
function _autoPlaceLinked(nest, next, elId, kind, anchors, reserved) {
    const R = getPylonRange() - 0.15, dirX = next && next.x > nest.x ? 1 : 0;
    let best = null, bs = -Infinity;
    for (let dx = -4; dx <= 9; dx++) for (let y = 0; y <= 3; y++) {
        const t = _autoTile(nest.x + dx, y);
        if (!_autoFree(t) || reserved.has(t.x + "," + t.y) || Math.hypot(t.x - nest.x, t.y - nest.y) > AUTOPLAY_NET_RADIUS) continue;
        let link = false, crowd = false;
        for (const a of anchors) { const d = Math.hypot(a.x - t.x, a.y - t.y); if (d <= R) link = true; if (d < 1.9) crowd = true; }
        if (!link || crowd) continue;
        const s = dx * dirX * 0.6 - Math.abs(y - 2) * 0.3 - Math.abs(dx) * (1 - dirX) * 0.3;
        if (s > bs) { bs = s; best = t; }
    }
    if (!best) return false;
    _executeBuildInstant(ELEMENTS.find(e => e.id === elId), best, kind);
    return true;
}
// The element for the formation square: the network element if it forms
// something, else the first unlocked one that does.
function _autoFormationElement(elId) {
    const forms = typeof FORM_KINDS !== "undefined" ? Object.keys(FORM_KINDS) : [];
    if (forms.includes(elId)) return elId;
    return AUTOPLAY_FORM_ORDER.find(e => forms.includes(e) && unlockedElements.has(e)) || null;
}
function _autoGrowNetwork(nest, next) {
    const elId = _autoNetworkElement(nest);
    if (!ELEMENTS.find(e => e.id === elId)) return false;
    const reserved = new Set();
    // 1. Two guns: the first corners of the ultra square (back rows).
    if (_autoSquareStep(nest, next, "ultra", elId, "attack", 2, 0, reserved)) return true;
    // Claim the formation square early too, so the batteries leave it free.
    const fel = _autoFormationElement(elId);
    if (fel) { const plan = nest._autoPlan; if (!plan.form || !_autoSquareTiles(plan.form).every(t => t && (_autoFree(t) || _autoTileIs(t, fel, waveRole(fel))))) plan.form = _autoFindSquare(nest, next, 2, reserved); if (plan.form) _autoSquareTiles(plan.form).forEach(t => reserved.add(t.x + "," + t.y)); }
    // 2. The battery bank, each one linked to the last.
    const near = _autoNear(nest);
    const bats = near.filter(t => t.isBattery && t.attackModeElement === elId);
    if (bats.length < AUTOPLAY_BATTERIES) return _autoPlaceLinked(nest, next, elId, "battery", bats.length ? bats : near.length ? near : [nest], reserved);
    // 3. The rest of the ultra square.
    if (_autoSquareStep(nest, next, "ultra", elId, "attack", 4, 0, reserved)) return true;
    // 4. The formation square.
    if (fel && _autoSquareStep(nest, next, "form", fel, waveRole(fel), 4, 2, reserved)) return true;
    // 5. A few accessories, only with shards to spare.
    if (shardCount < PYLON_BUILD_COST + AUTOPLAY_SPARE) return false;
    const sup = ["electric", "core"].find(e => unlockedElements.has(e));
    if (!sup) return false;
    const have = near.filter(t => t.waveMode && t.attackModeElement === sup && !(t._wform || t._wformOf)).length;
    if (have >= AUTOPLAY_ACCESSORIES) return false;
    return _autoPlaceLinked(nest, next, sup, "support", near.length ? near : [nest], reserved);
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
    const live = followers.filter(f => !f.dead && !f.hackOrder && !f.siphonOrder);
    const want = Math.floor(live.length * AUTOPLAY_WORK_SHARE);
    let have = live.filter(f => f.duty === "worker").length;
    for (const f of live) {
        if (have >= want) break;
        if (f.duty === "worker" || (typeof canWorkMass === "function" && !canWorkMass(f))) continue;
        if (setFollowerDuty(f, "worker", true)) have++;
    }
}
