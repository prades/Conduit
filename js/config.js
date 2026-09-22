// ============================================================
//  build ver. 0.0200  –  stat system + roles + personalities
// ============================================================

// ── GLOBAL ERROR DISPLAY ──────────────────────────────────
window.onerror = function(msg, src, line, col, err) {
    const e = document.createElement("div");
    Object.assign(e.style, {
        position:"fixed", top:"0", left:"0", right:"0",
        background:"rgba(0,0,0,0.9)", color:"#ff5555",
        font:"12px monospace", padding:"10px",
        zIndex:"99999", whiteSpace:"pre-wrap"
    });
    e.textContent = "CRASH\n\n" + msg + "\nLine:" + line +
        (err && err.stack ? "\n\n" + err.stack : "");
    document.body.appendChild(e);
};

// ── ELEMENTS ─────────────────────────────────────────────
const ELEMENTS = [
    { id:"fire",     label:"FIRE",     color:"#ff3300" },
    { id:"electric", label:"ELECTRIC", color:"#ffee33" },
    { id:"ice",      label:"ICE",      color:"#99ddff" },
    { id:"flux",     label:"FLUX",     color:"#9933ff" },
    { id:"core",     label:"CORE",     color:"#00ccaa" },
    { id:"toxic",    label:"TOXIC",    color:"#66ff66" }
];
// The two you begin with. Named once because four places used to spell the
// pair out, and the wave ladder is defined as "everything that is not one of
// these" — a fifth copy would decide which elements are earnable.
const STARTING_ELEMENTS = ["fire", "electric"];
let unlockedElements = new Set(STARTING_ELEMENTS);
// Elements earned by kills but not yet brought online at the Crystal.
let pendingElements = [];
// Every enemy killed this game. Cumulative and one-way — it is what earns
// elements, so it persists.
let lifetimeKills = 0;
// Set when the element pool changes, so the game can prompt the player that
// their modulation is stale. Cleared once they re-modulate.
let modulationDirty = false;

// ── PYLON LOOK ────────────────────────────────────────────
// One design for every pylon and every upgrade. There used to be six random
// bodies (spire, monolith, antenna, shrine, conduit); the sentinel fortress
// was the only one that read well at this scale, so it is now the whole set.
const PYLON_STYLE = "sentinel";
// Sentinel's palette, named once so the wall panelling can be trimmed to match
// rather than carrying its own separate greens.
const SENTINEL_FRONT_ACTIVE = "#1a2030";
const SENTINEL_FRONT_DORMANT= "#252830";
const SENTINEL_RIGHT_ACTIVE = "#0d1520";
const SENTINEL_RIGHT_DORMANT= "#181b20";
const SENTINEL_TOP_ACTIVE   = "#2a3545";
const SENTINEL_TOP_DORMANT  = "#343840";
const SENTINEL_FRONT_UPGRADED= "#0d1825";
const SENTINEL_RIGHT_UPGRADED= "#081018";
const SENTINEL_TOP_UPGRADED  = "#1a2535";
const SENTINEL_SLIT         = "#050508";
const SENTINEL_ACCENT       = "#7fb8dc";   // the cool steel highlight
const SENTINEL_ACCENT_DIM   = "#3d4d5e";

// ── GENERATOR PYLON ───────────────────────────────────────
// A neutral pylon: no elemental zone, no tier, no network. It does two things
// nothing else can — it is the only structure a nest will link to, and it
// mends the friendly pylons standing around it. Deliberately not in ELEMENTS:
// that list is what followers are made of and what the elemental network is
// tiered on, and a generator is neither.
const GENERATOR_ID    = "generator";
const GENERATOR_LABEL = "GENERATOR";
const GENERATOR_COLOR = "#cdd6e0";   // neutral steel, so it reads as no element
// What the pylon picker offers: the six elements plus the generator.
const PYLON_PICKER_TYPES = [...ELEMENTS, { id: GENERATOR_ID, label: GENERATOR_LABEL, color: GENERATOR_COLOR }];
// Healing: applied every GENERATOR_HEAL_INTERVAL frames to each linked pylon.
// 2 HP per 30 frames is 4 HP/s — worth building around, but well under what a
// single predator chewing on a pylon takes off it.
const GENERATOR_HEAL_INTERVAL = 30;
const GENERATOR_HEAL_AMOUNT   = 2;
let _genPylons = [];   // live generator pylons
let _genLinks  = [];   // [{ gen, pylon }] — generator → pylon it is mending

// How far from a nest a generator may be placed. Linking a broken nest is the
// generator's whole reason to exist on that side, so one built out of reach of
// every nest could never do the job — the placement is refused rather than
// letting the player spend the build cost on a dead structure. The same range gates
// the link itself, so anything you are allowed to build can always connect.
const GENERATOR_NEST_RANGE = 6;

// The nest a generator at (x, y) would serve, or null if none is in reach.
// Dead nests count: a broken nest is exactly the one you link.
function nestInGeneratorRange(x, y) {
    let best = null, bestD = GENERATOR_NEST_RANGE;
    for (const t of world) {
        if (!t.nest) continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d <= bestD) { bestD = d; best = t; }
    }
    return best;
}

// Whether a generator may be placed on this tile, and the nest it would serve.
function canPlaceGenerator(t) {
    if (!t) return { ok: false, nest: null };
    const nest = nestInGeneratorRange(t.x, t.y);
    return { ok: !!nest, nest };
}

// One refusal, so every path says the same thing.
function refuseGenerator() {
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
        text: "GENERATOR MUST BE WITHIN " + GENERATOR_NEST_RANGE + " TILES OF A NEST",
        color: "#f44", life: 120, vy: -0.2 });
}

// A generator is a pylon, so every pylon check still applies to it; this is
// only the "which kind" test.
function isGeneratorPylon(t) {
    return !!(t && t.pillar && !t.destroyed && t.health > 0 && t.isGenerator);
}

// The generator is neutral, so it is never behind an element unlock — it is
// available from the first pylon the player ever builds.
function isPylonTypeUnlocked(id) {
    return id === GENERATOR_ID || unlockedElements.has(id);
}

// ── CANVAS / CTX ──────────────────────────────────────────
const canvas  = document.getElementById('cavernCanvas');
const ctx     = canvas.getContext('2d');
const hpBar   = document.getElementById('hp');
const ultBar  = document.getElementById('ult');
const ultWrap = document.getElementById('ultWrap');
const ultLabel= document.getElementById('ultLabel');
const siphonBtn = document.getElementById('siphonBtn');
const shardUI = document.getElementById('shards');
const waveUI  = document.getElementById('waveInfo');

// Safe area inset at the bottom (for notch/home-bar devices)
let SAFE_BOTTOM = 0;
function resize() {
    // Use visualViewport dimensions when available (better mobile support)
    const vv = window.visualViewport;
    canvas.width  = vv ? Math.round(vv.width)  : window.innerWidth;
    canvas.height = vv ? Math.round(vv.height) : window.innerHeight;
    // Detect bottom safe-area via a temporary DOM element
    try {
        const _tmp = document.createElement('div');
        _tmp.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);width:1px;pointer-events:none;opacity:0';
        document.body.appendChild(_tmp);
        SAFE_BOTTOM = Math.max(0, parseInt(getComputedStyle(_tmp).height) || 0);
        document.body.removeChild(_tmp);
    } catch(e) { SAFE_BOTTOM = 0; }
}
window.addEventListener('resize', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize();

// ── CONFIG ────────────────────────────────────────────────
let cfg = {
    playerSpeed: 0.12,
    healthDecay: 0.025,
    pillarSpawnRate: 0.15,
    exhaustFrequency: 7,
    smokeColor: "rgba(160,160,160,0.4)",
    bobSpeed: 0.12,
    bobAmount: 5,
    tiltIntensity: 0.15,
    rotationSmoothing: 0.15
};
cfg.npcSpawnRate = 0.22;

// ── CONSTANTS ─────────────────────────────────────────────
const TILE_W = 60, TILE_H = 30, RENDER_DIST = 22;
const ZONE_LENGTH  = 15;
const LONG_HOLD_MS = 500;
const RADIAL_RADIUS = 60;
const FOLLOW_STOP  = 2.0;

// ── GAME STATE ────────────────────────────────────────────
let gameState = {
    phase: "day",       // "day" | "night" | "waveComplete" | "gameOver" | "shop"
    nightNumber: 1,
    totalWavesSurvived: 0,
    highestZoneCleared: 0,  // highest zone index the player has cleared a wave in
    running: true
};

let dayStats = { redSpawned: 0, redConverted: 0 };

// ── WORLD / ACTOR LISTS ───────────────────────────────────
let world      = [];
let worldTileMap = new Map(); // spatial hash: "x,y" → tile (O(1) lookup)
let actors     = [];
let followers  = [];
let followerByElement = {};
ELEMENTS.forEach(el => { followerByElement[el.id] = []; });

// ── WORLD SUBSET CACHES (refreshed every 60 frames) ──────
let _wPylons    = [];  // wave-mode pylons
let _aPylons    = [];  // attack-mode pylons
let _uPylons    = [];  // upgraded pylons
let _nestCache  = [];  // nest tiles
let _pillarCache= [];  // all live pillars
let _cacheAge   = -999;
let _wPylonPairs       = [];       // pre-computed connected pylon pairs (rebuilt with _wPylons)
let _pylonsWithPartner = new Set(); // pylons that have ≥1 connected partner (rebuilt with _wPylonPairs)
let _wallPanelMap      = null;     // worldX → wall_panel tile (rebuilt with _pillarCache)
let _wallPanelCache    = [];       // unactivated wall_panel tiles (rebuilt every 60 frames, spliced on activation)
let _capturableNodeCache = [];     // all capturable world tiles (rebuilt every 60 frames)
let _seasonBonusCache= {};  // seasoned-bonus multiplier per element (1.0 or 1.25)

// ── HUD CHANGE-DETECTION CACHE (avoids DOM style writes every frame) ──────────
let _lastHpInt      = -1;    // last integer hp written to hpBar
let _lastUltInt     = -1;    // last integer ultimate written to ultBar
let _lastUltState   = '';    // last ready/surging class written
let _lastSiphonOn   = null;  // last siphon state written to siphonBtn
let _lastShardCount = -1;    // last shard count written to shardUI
let _lastZoneIndex  = -999;  // last zone index written to zoneInfo
let _zoneEl         = null;  // cached zoneInfo element (fetched once on first use)
let _lastPadHudKey  = null;  // last value written to padHud (avoids DOM writes every frame)
let _padHudEl       = null;  // cached padHud element

// ── NETWORK RESONANCE STATE ─────────────────────────────────────────
// networkStrength[el]  : tier 0-3 based on largest connected same-element group
// networkIntegrity[el] : 0-100, accumulates while the network is active; resets on collapse
// _prevNetworkTiers[el]: used to detect tier-ups for notification
let networkStrength   = {};
let networkIntegrity  = {};
let _prevNetworkTiers = {};

// ── INTRUDER ALERT STATE ──────────────────────────────────
let alertActive = false;   // true while alarm is sounding
let alertTimer  = 0;       // frames remaining in current alarm
let alertType   = null;    // null | "proximity" | "zone" | "facility"
let alertSource = null;    // { x, y } where alarm was triggered
let alertZone   = null;    // zone index where the alarm was triggered
const ALERT_DURATION = 600; // 10 seconds at 60fps

// ── PYLON AGGRO ───────────────────────────────────────────
// Exposure needed before a predator stuck in a pylon zone turns on the pylon.
// Counted once every three frames, so 45 is about 2.2 seconds. A FLUX zone
// counts triple because it physically holds them in place — that is the one
// that made the game unplayable to sit and watch.
const PYLON_AGGRO_EXPOSURE  = 45;
const PYLON_AGGRO_TRAP_RATE = 3;
// Frames between bashes once it is in reach, and the distance at which it
// gives up rather than chasing a pylon across the map.
const PYLON_BASH_COOLDOWN   = 45;
const PYLON_AGGRO_GIVE_UP   = 9;

// ── TERRITORY / CIRCUIT HARVESTING ────────────────────────
let capturedNodes = []; // { type, x, y, benefit }
let signalTowers  = []; // tile refs: { x, y, active, zoneIndex } — enemy antenna structures

let projectiles = [], fragments = [], smoke = [], shards = [];
let followerProjectiles = []; // ranged attacks from snipers/specials
let pendingPillarDestruction = [];
let respawnQueue = [];
let frame = 0, shake = 0;
let activeEmpEffect = null; // { timer, maxTimer, zone } — EMP screen-darkening flash
let lastGenX  = 0;
let shardCount = 0; // loaded from localStorage on init
let activePredator = null;
let predatorRespawnTimer = 0;
let activeDayZones = 3;
let exploredZones  = new Set();

// ── CRYSTAL ───────────────────────────────────────────────
let crystal = { x:0, y:2, health:300, maxHealth:300, radius:0.8 };

// ── PLAYER ────────────────────────────────────────────────
let player = {
    x:2, y:1, visualX:2, visualY:1, targetX:2, targetY:1,
    rotY: Math.PI * 0.75, baseRot: Math.PI * 0.75,
    angryTimer: 0, selectedElement: "fire",
    siphonHold: 0,
    attackCooldown: 0,   // frames until next player shot
    invuln: 0            // damage-immune frames after a knockdown — control is never locked
};

// Frames of damage immunity after being put back at the Crystal. There is no
// stun any more: the player keeps control the whole time. The window only
// exists so a predator parked by the Crystal cannot chain-kill on respawn.
const PLAYER_RESPAWN_GRACE = 90;

// ── INPUT STATE ───────────────────────────────────────────
let isPressing    = false;
let pressX = 0, pressY = 0;
let pressStartTime = 0;
let longHoldFired = false;
let touchMoved    = false;   // FIX: was missing declaration
let pointerX = 0, pointerY = 0;
let dragDX = 0, dragDY = 0;
let gesturePoints = [];

// ── ULTIMATE DOUBLE-TAP STATE ─────────────────────────────
let _ultimateLastTapActor = null;   // follower actor tapped last
let _ultimateLastTapTime  = 0;      // performance.now() of last tap

// ── PLAYER WEAPON ─────────────────────────────────────────
// Shots used to fire on any tap, which meant brushing a predator while moving
// spent a shot at it. Firing is now gated behind an explicit attack mode the
// player turns on from the radial menu, and costs ammo.
let playerAttackMode = false;
let playerAmmo       = 0;
const PLAYER_AMMO_MAX   = 60;
const PLAYER_AMMO_START = 12;
// Rounds a hacked wall panel yields. The shop used to sell ammo; with it gone
// this is the only source, so it has to be enough to keep the weapon usable.
const PANEL_AMMO_REWARD = 8;
let _ATKCHIP = { x: 0, y: 0, w: 0, h: 0 };   // on-screen ammo chip, tap to disarm

// ── COMMAND / RADIAL STATE ────────────────────────────────
let commandMode = false;
let commandX = 0, commandY = 0;
let commandTarget = null;
let commandNestTarget = null;   // broken nest pod near long-press point
let commandEnemyTarget = null;  // predator under a long press, if any
let commandFollowerTarget = null;  // own follower under a long press, if any
let nestConnectMode   = false;  // true while waiting for player to tap a pylon
let nestConnectMisses = 0;      // consecutive stray taps; two in a row cancels
let pendingConnectNest = null;  // nest tile being connected
let selectedRadialAction = null;
let commandPendingTap    = false;  // true = menu open, waiting for button tap

// ── ELEMENT PICKER (canvas-drawn) ─────────────────────────
let elementPickerOpen   = false;
let elementPickerMode   = null;   // "build" | "upgrade"
let elementPickerTarget = null;

// ── INFO PANEL (canvas-drawn) ─────────────────────────────
let infoPanelOpen   = false;
let infoPanelTarget = null;
let infoPanelPage   = null;   // null = target readout | 'codex' | an element id

// ── DEV / PREVIEW ─────────────────────────────────────────
let devMode = false;
let previewCanvas, previewCtx, previewPredator, sliderContainer;

// ── PREDATOR PRESETS ──────────────────────────────────────
let PREDATOR_PRESETS = {};

// ── FOLLOWER UI LAYOUT ────────────────────────────────────
const FOLLOWER_UI = { x:20, yOffset:20, width:160, rowHeight:32, padding:6 };

// ── SQUAD / BUILD / GESTURE STATE ─────────────────────────
let squadMode    = "selected"; // "all" | "selected"
let buildMode    = false;
let holdLineX    = null;       // world X boundary; null = cleared
let uiTab        = "elements"; // "elements" | "units"
let selectedRole = null;       // "brawler"|"sniper"|"camper"|null
let followerPoolMinimized = false; // whether the follower pool panel is collapsed

// ── CRYSTAL MENU / BUILDS ─────────────────────────────────
let crystalMenuOpen  = false;
let crystalMenuTab   = "clones";   // "clones"|"builds"|"modulation"|"status"|"info"
let crystalCloneSort = "species";  // "species"|"combat"|"defense"|"hp"|"specials"
// Which elements new followers may come out as. A subset of the unlocked set —
// the whole set means "any", one element means every recruit is that element.
// This replaced a 0..1 slider that indexed into a generated list of element
// combinations: with exactly two elements unlocked (fire and electric, the
// starting pair) a slider value in the TRI band fell through to the BI branch
// with a negative offset, indexed combos[-1] and crashed on combo.map.
// A set of toggles has no such arithmetic to get wrong.
let modulationMask = new Set();

// ── PLAYER ULTIMATE ───────────────────────────────
// One bar, the character's own, filled by killing and spent on an ARMY SURGE:
// every unit you own healed, its WILL refilled, its own ultimate charged, and
// harder-hitting for the duration.
//
// This is NOT the same thing as FOLLOWER_ULTIMATES in js/elements.js, which are
// per-follower, charge individually and fire on a double-tap. That system keeps
// working exactly as it did; the surge charges all of them at once.
const PLAYER_ULT_MAX      = 100;
const ARMY_SURGE_FRAMES   = 600;   // ten seconds
const ARMY_SURGE_POWER    = 1.6;   // damage multiplier for the whole army
// The bar is SIPHONED from the squad, not earned from kills. Each follower
// sends a small wisp of static to the player every SIPHON_INTERVAL frames, and
// the charge is delivered when the wisp arrives — so the trickle you can see is
// the transfer itself rather than decoration over a counter.
//
// The rate therefore scales with how many followers you are fielding: ten of
// them fill the bar in about half a minute, three take a couple of minutes, and
// with none it does not fill at all.
// Only followers NEAR you are drawn from. 6 tiles: brawlers close to
// FOLLOW_STOP (2.0) and snipers hold at 4.0, so both count with slack for
// combat drift, while a camper anchored to a distant pylon and a worker off on
// a chore — neither of which follows you at all — do not.
const SIPHON_RANGE     = 6;
const SIPHON_INTERVAL  = 120;      // frames between one follower's wisps
const SIPHON_TRAVEL    = 34;       // frames a wisp takes to reach the player
const SIPHON_PER_WISP  = 0.7;      // charge one arriving wisp carries
const SIPHON_COLOUR    = "#ffee33";// electric — it is static, not element magic
let playerUltimate = 0;            // 0 .. PLAYER_ULT_MAX
let armySurgeTimer = 0;            // frames of surge left
let siphonEnabled  = true;         // the player can switch the draw off
let siphonWisps    = [];           // { ax, ay, t, seed } in flight
let _siphonInRange = 0;            // units the siphon can reach, for the HUD

// ── SETTINGS PANEL (canvas-drawn) ─────────────────────────
let settingsPanelOpen    = false;
let settingsResetConfirm = false;   // true = showing "ARE YOU SURE?" step

// ── PYLON BUILD CONFIRMATION ───────────────────────────────
let pylonConfirmOpen   = false;
let pylonConfirmEl     = null;    // element object to confirm
let pylonConfirmTarget = null;    // tile to build on

// ── CRYSTAL MODULATION ────────────────────────────────────
// Pair map: each modulator element unlocks a two-element pair
const MODULATOR_PAIRS = {
    fire:     ["fire",     "flux"],
    flux:     ["flux",     "toxic"],
    toxic:    ["toxic",    "fire"],
    electric: ["electric", "core"],
    core:     ["core",     "ice"],
    ice:      ["ice",      "electric"]
};
let ownedModulators    = [];   // [{ element }]  — collected from boss drops
let activeCrystalModulation = null; // null | { element, pair:[e1,e2] }
let groundItems        = [];   // [{ type, element, x, y }]  — world pickups

// ── HEALTH PADS ───────────────────────────────────────────
// Each pad: { charges: N }  — crafted via crystal menu, max 3 charges per pad
// Using a pad heals 30 HP and costs 1 charge; pad is removed when charges reach 0
const HEALTH_PAD_MAX_CHARGES = 3;
const HEALTH_PAD_HEAL        = 30;   // HP restored per charge
// What a pylon costs, everywhere. It was 10 in the slow build path and 40 in
// the instant one, with the radial gate and the element picker each holding
// their own copy of 40 — eight literals for one price.
const PYLON_BUILD_COST       = 10;
const HEALTH_PAD_CRAFT_COST  = 8;    // shards to craft one pad
let healthPads = [];   // [{ charges: N }]

function toggleSquad() {
    squadMode = (squadMode === "selected") ? "all" : "selected";
    const btn = document.getElementById("btnSquad");
    if (btn) { btn.textContent="SQUAD: "+(squadMode==="all"?"ALL":"SEL"); btn.classList.toggle("active",squadMode==="all"); }
}
function toggleBuild() {
    buildMode = !buildMode;
    const btn = document.getElementById("btnBuild");
    if (btn) { btn.textContent="BUILD: "+(buildMode?"ON":"OFF"); btn.classList.toggle("active",buildMode); }
}
function toggleControlsMenu() {
    const m = document.getElementById("controlsMenu");
    if (!m) return;
    const isHidden = !m.style.display || m.style.display === "none";
    if (isHidden) {
        m.style.display = "flex";
        m.style.flexDirection = "column";
        m.classList.remove("minimized");
        const minBtn = document.getElementById("cm-minimize");
        if (minBtn) minBtn.textContent = "─";
    } else {
        m.style.display = "none";
    }
}
function minimizeControlsMenu() {
    const m = document.getElementById("controlsMenu");
    if (!m) return;
    const minBtn = document.getElementById("cm-minimize");
    if (m.classList.contains("minimized")) {
        m.classList.remove("minimized");
        m.style.top = "50%";
        m.style.bottom = "";
        m.style.transform = "translate(-50%, -50%)";
        if (minBtn) minBtn.textContent = "─";
    } else {
        m.classList.add("minimized");
        if (minBtn) minBtn.textContent = "▣";
    }
}
