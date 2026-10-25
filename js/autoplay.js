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
//   3. ALWAYS → BUILD, one pylon per think, while the shards last, from the LAYOUT KITS (js/kits.js, docs/LAYOUT-KITS.md). Each held nest gets
//      the kits its place calls for, one after the other, and then it stops: a REAR zone (far behind the front) a PICKET then an OUTPOST, a MID zone an
//      OUTPOST then a STRONGPOINT, the FRONT zone (the farthest you hold) up to an ULTRA NEAR and a formation TRAP, and a DEEP front zone (zone 3 on) a
//      FULL KIT. Nothing is built that no kit asks for: no loose pylons. The kits build no batteries: autoplay boots the POWER UNIT in the zone's wall and upgrades it to the tier the
//      ladder needs (js/wallunit.js: the same functions as the unit's panel), before the guns: the unit is the zone's generator. MK II comes last, on shards to spare.
//   4. ALWAYS → ULTIMATES. A follower with a full bar and an enemy within
//      AUTOPLAY_ULT_RANGE fires it (the duo ultimate if its partner can).
//   5. ALWAYS → WORK CREW. About a quarter of the squad works, so kills keep
//      turning into the shards the building needs; and by day, short of
//      shards, one follower drains wall panels no further out than the next zone.
//   6. WAVE CLEARED → NEXT WAVE, after a short pause to read the screen.
//   7. ALWAYS → UNLOCK. An earned element unlock is spent at once on the ladder's next element (js/wavedata.js); it used to sit
//      pending for ever, because the choosing happens on the Crystal's ELEMENTS tab, which autoplay never opens.
const AUTOPLAY_THINK        = 45;
const AUTOPLAY_HACK_TEAM    = 3;
const AUTOPLAY_ULT_RANGE    = 4;
const AUTOPLAY_SPARE        = 40;   // MK II only while this many shards are left over
const AUTOPLAY_FORM_ORDER   = ["toxic", "ice", "flux", "fire"];   // formation element, when the network's forms nothing
// THE LADDER: the kits (js/kits.js ids) a zone gets, in order, by where it is. A kit already built (all its pieces there) is passed; the next one adds only the difference.
const AUTOPLAY_LADDER = {
    rear:  ["picket", "outpost"],
    mid:   ["outpost", "strongpoint"],
    front: ["outpost", "strongpoint", "ultranear", "trap"],
    deep:  ["outpost", "strongpoint", "fullkit", "bastion"],   // (bastion only if no formation element can take the full kit)
};
const AUTOPLAY_DEEP_ZONE = 3;       // the front zone from here on is "deep"
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
    _autoUnlock();
    _autoWorkCrew();
    if (gameState.phase === "night" || alertActive) _autoFight();
    else _autoHack();
    _autoBuild();
}

// ── helpers ──
// Spend an earned unlock on the ladder's next element (the one it was earned for): autoplay does not open the Crystal.
function _autoUnlock() {
    if (typeof pendingElements === "undefined" || pendingElements.length === 0 || typeof activatePendingElement !== "function") return;
    activatePendingElement(pendingElements[0]);
}
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
    const free = followers.filter(f => !f.dead && !f.post && f.duty !== "worker" && (!f.job || f._autoJob && f.job.type === "attack" && (!f.job.target || f.job.target.dead)));   // (not a follower holding a room: js/party.js)
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
    // The frontier first (it is where the fighting is), then back toward home.
    for (const nest of held.slice().reverse()) if (_autoGrowNetwork(nest, next, held)) return;
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
// ── THE KIT LADDER at each held nest ──────────────────────
// Where a nest stands in your line decides its ladder: the frontier (the farthest nest held) is the front (deep from zone AUTOPLAY_DEEP_ZONE), the one before
// it the mid, the rest the rear.
function _autoZoneClass(nest, held) {
    const i = held.indexOf(nest), frontier = held[held.length - 1];
    if (nest === frontier) return (nest.nestZone || 0) >= AUTOPLAY_DEEP_ZONE ? "deep" : "front";
    return i === held.length - 2 ? "mid" : "rear";
}
// The element a zone's kits are built in: the network element, or the formation element if the ladder has a formation in it (a formation needs a bank of its own element).
function _autoZoneElement(nest, cls) {
    const net = _autoNetworkElement(nest);
    if (!AUTOPLAY_LADDER[cls].some(id => kitById(id).needs === "form")) return net;
    return _autoFormationElement(net) || net;
}
// The element for a formation: the network element if it forms something, else the first unlocked one that does.
function _autoFormationElement(elId) {
    const forms = typeof FORM_KINDS !== "undefined" ? Object.keys(FORM_KINDS) : [];
    if (forms.includes(elId)) return elId;
    return AUTOPLAY_FORM_ORDER.find(e => forms.includes(e) && unlockedElements.has(e)) || null;
}
// The zone's power unit (js/wallunit.js): booted in the zone's element and upgraded to the tier the ladder asks for, once the zone has a nest of yours to draw on. It is the first thing built. true: it did a step; false: it must wait for shards; null: nothing to do.
function _autoPowerUnit(nest, el, need) {
    if (typeof wallUnitTier !== "function") return null;
    const zone = getZoneIndex(nest.x);
    if (!unitNest(zone)) return null;                              // no nest of yours here to draw on yet
    const have = wallUnitTier(zone), cur = wallUnitElement(zone);
    if (have === 0) return shardCount < wallUnitCost(zone) ? false : wallUnitBoot(zone, el);
    if (cur !== el && unlockedElements.has(el)) return shardCount < WALL_UNIT_RECONFIGURE_COST() ? false : wallUnitReconfigure(zone, el);
    if (have < need) return shardCount < wallUnitCost(zone) ? false : wallUnitUpgrade(zone);
    return null;
}
// Build the next piece of the first kit on the nest's ladder that is not finished. Remembers which (nest._autoKit) for the ZONES tab.
function _autoGrowNetwork(nest, next, held) {
    const cls = _autoZoneClass(nest, held || _autoHeldNests()), el = _autoZoneElement(nest, cls);
    if (!ELEMENTS.find(e => e.id === el)) return false;
    let done = true;
    // ONE layout for the whole ladder, so every kit lands on the same tiles as the one before it and only adds the difference.
    const kits = AUTOPLAY_LADDER[cls].map(kitById).filter(k => k && kitElementOk(k, el));
    const pos = kitFindPlacementFor(kits, el, nest);
    if (!pos) return false;
    const unit = _autoPowerUnit(nest, el, Math.max(1, ...kits.map(k => k.target.tier)));
    if (unit !== null) return unit;
    for (const kit of kits) {
        const id = kit.id, plan = kitPlan(kit, el, pos.x0, pos.dir, nest);
        nest._autoKit = { id, el, cls, have: plan.have, total: kitPieceCount(kit), blocked: plan.blocked };
        if (plan.blocked) continue;               // something is in the way: pass over this kit
        if (!plan.free) continue;                  // finished
        done = false;
        if (kitBuildNext(plan)) return true;
        return false;                              // the next piece cannot go (shards): wait, do not skip ahead
    }
    // The ladder is built. MK II (commands.js): one pylon at a time, on its tier I network, still only with shards to spare.
    if (typeof mk2Blocker === "function" && shardCount >= MK2_COST + AUTOPLAY_SPARE) {
        const near = (typeof _pillarCache !== "undefined" ? _pillarCache : []).filter(t => t.pillarTeam === "green" && !t.destroyed && getZoneIndex(t.x) === getZoneIndex(nest.x));
        const up = near.find(t => mk2Eligible(t) && !mk2Blocker(t));
        if (up) return upgradeToMk2(up);
    }
    return false;
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
