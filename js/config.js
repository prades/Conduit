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

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
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

let projectiles = [], fragments = [], smoke = [], shards = [];
let followerProjectiles = []; // ranged attacks from snipers/specials
let pendingPillarDestruction = [];
let respawnQueue = [];
let frame = 0, shake = 0;
let lastGenX  = 0;
let shardCount = 0; // loaded from localStorage on init
let latchedPillar = null;
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
    siphonHold: 0
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

// ── CRYSTAL MENU / BUILDS ─────────────────────────────────
let crystalMenuOpen  = false;
let crystalMenuTab   = "clones";   // "clones"|"builds"|"modulation"|"status"|"info"
let crystalCloneSort = "species";  // "species"|"combat"|"defense"|"hp"|"specials"
let crystalModSlider = 0;          // 0.0 = all elements  →  1.0 = mono
let activeCrystalBuild = null;     // null | "ghostphage"

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
    if (m) m.style.display = (m.style.display==="none"||!m.style.display) ? "block" : "none";
}
