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
    { id:"toxic",    label:"TOXIC",    color:"#66ff66" },
    { id:"void",     label:"VOID",     color:"#8800ff" }
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
const TILE_W = 60, TILE_H = 30, RENDER_DIST = 14;
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

// ── COMMAND / RADIAL STATE ────────────────────────────────
let commandMode = false;
let commandX = 0, commandY = 0;
let commandTarget = null;
let selectedRadialAction = null;

// ── DEV / PREVIEW ─────────────────────────────────────────
let devMode = false;
let previewCanvas, previewCtx, previewPredator, sliderContainer;

// ── PREDATOR PRESETS ──────────────────────────────────────
let PREDATOR_PRESETS = {};

// ── FOLLOWER UI LAYOUT ────────────────────────────────────
const FOLLOWER_UI = { x:20, yOffset:20, width:160, rowHeight:32, padding:6 };
