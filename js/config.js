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
let unlockedElements = new Set(["fire", "electric"]);

// ── CANVAS / CTX ──────────────────────────────────────────
const canvas  = document.getElementById('cavernCanvas');
const ctx     = canvas.getContext('2d');
const hpBar   = document.getElementById('hp');
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
let _lastShardCount = -1;    // last shard count written to shardUI
let _lastZoneIndex  = -999;  // last zone index written to zoneInfo
let _zoneEl         = null;  // cached zoneInfo element (fetched once on first use)

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
    stunned: 0           // stun timer — movement + attack locked when > 0
};

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

// ── COMMAND / RADIAL STATE ────────────────────────────────
let commandMode = false;
let commandX = 0, commandY = 0;
let commandTarget = null;
let commandNestTarget = null;   // broken nest pod near long-press point
let nestConnectMode   = false;  // true while waiting for player to tap a pylon
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
let crystalModSlider = 0;          // 0.0 = all elements  →  1.0 = mono
let activeCrystalBuild = null;     // null | "ghostphage"

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
