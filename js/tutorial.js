// ─────────────────────────────────────────────────────────
//  TUTORIAL MODE
// ─────────────────────────────────────────────────────────
let tutorialMode   = false;
let tutorialStep   = 0;
let tutorialTimer  = 0;   // frames since step started
let tutorialShard  = null; // the tutorial shard object

const TUTS = [
    {
        title: 'WELCOME TO CONDUIT',
        body:  'You are a viral entity drifting through a living circuit board. Tap any floor tile to move.',
        icon:  '⬡',
        check: () => tutorialTimer > 180,   // auto-advance after 3 s
    },
    {
        title: 'MOVE',
        body:  'Explore the board. Navigate toward the glowing shard to the right.',
        icon:  '→',
        check: () => player.x > 5,
    },
    {
        title: 'COLLECT A SHARD',
        body:  'Move over the glowing yellow shard to collect it. Shards power upgrades.',
        icon:  '◆',
        check: () => shardCount >= 1,
    },
    {
        title: 'CONVERT AN ENEMY',
        body:  'Hold your finger (or click and hold) on the RED enemy nearby to siphon-convert it to your team.',
        icon:  '☉',
        check: () => followers.length >= 1,
    },
    {
        title: 'CAPTURE A PILLAR',
        body:  'Tap a RED pillar to attack it. Converted pillars anchor your territory and heal your forces.',
        icon:  '▲',
        check: () => world.some(t => t.pillar && !t.destroyed && t.pillarTeam === 'green'),
    },
    {
        title: 'READY FOR BATTLE',
        body:  'Night approaches. Enemies will swarm your Crystal. Defend it! Tap the button below to begin.',
        icon:  '★',
        check: () => false,  // manual exit only
    },
];

/* ── Start tutorial ── */
function startTutorial() {
    tutorialMode  = true;
    tutorialStep  = 0;
    tutorialTimer = 0;
    tutorialShard = null;

    // Full world / actor reset (same as restartGame but no spawnHazards)
    world = []; actors = []; followers = [];
    ELEMENTS.forEach(el => { followerByElement[el.id] = []; });
    projectiles = []; fragments = []; smoke = []; shards = [];
    elementEffects = []; floatingTexts = []; followerProjectiles = [];
    environmentalHazards = [];
    pendingPillarDestruction = []; respawnQueue = [];
    frame = 0; shake = 0; lastGenX = 0;
    latchedPillar = null; activePredator = null; predatorRespawnTimer = 0;
    zonePredators = {}; zoneRespawnTimers = {};
    activeDayZones = 3; exploredZones = new Set();
    boughtItems.clear();
    nightKillCount = 0; nightEnemiesTarget = 0; nightPredatorsRemaining = 0;

    // Keep player's shard count so they don't lose progress
    shardCount = getShards();

    crystal = { x: 0, y: 2, health: 300, maxHealth: 300, radius: 0.8 };
    player  = {
        x: 2, y: 1, visualX: 2, visualY: 1, targetX: 2, targetY: 1,
        rotY: Math.PI * 0.75, baseRot: Math.PI * 0.75,
        angryTimer: 0, selectedElement: 'fire', siphonHold: 0
    };
    gameState = { phase: 'day', nightNumber: 1, totalWavesSurvived: 0, running: true };
    dayStats  = { redSpawned: 0, redConverted: 0 };
    unlockedElements = new Set(['fire', 'electric']);

    // Build a compact fixed map — 12 segments
    for (let i = 0; i < 12; i++) tutorialGenerateSegment(i);

    // Spawn a single red NPC at a known location
    const tutorialNPC = {
        type: 'virus', element: 'fire',
        x: 8, y: 3,
        team: 'red', convertFlash: 0, isNeutralRecruit: true,
        health: 15, maxHealth: 15,
        moveSpeed: 0.008, power: 2,
        stats: null, personality: null, role: null,
        currentResonance: 0, currentWill: 20,
        walkCycle: 0, moveCooldown: 0,
        stance: 'wander', isFollower: false, isHealing: false,
        hitFlash: 0, spawnProtection: 300, dead: false
    };
    actors.push(tutorialNPC);

    // Spawn a tutorial shard
    tutorialShard = { x: 6.5, y: 2, pulse: 0, collected: false };
    shards.push(tutorialShard);

    document.getElementById('overlay').classList.remove('active');
    showTutorialUI();
    gameState.running = true;
    requestAnimationFrame(render);
}

/* ── Fixed map generator (no random NPCs, guaranteed pillar) ── */
function tutorialGenerateSegment(startX) {
    for (let y = -2; y <= 5; y++) {
        let type = (y === -2) ? 'wall_back' : (y === 5) ? 'wall_front' : 'floor';
        const addPillar = (type === 'floor' && y >= 3 && startX === 10 && y === 3);
        const tile = {
            x: startX, y, type,
            h: (type === 'wall_back') ? 34 : 45,
            pillar: addPillar,
            pillarTeam: 'red',
            pillarCol: '#f22',
            destroyed: false, health: 20, maxHealth: 20,
            converting: false, pendingDestroy: false,
            upgraded: false, pulseTimer: 0,
            reconstructing: false, reconstructProgress: 0, workers: []
        };
        world.push(tile);
    }
    lastGenX = startX;
}

/* ── Tutorial tick (called from render loop when tutorialMode) ── */
function tutorialTick() {
    if (!tutorialMode) return;
    tutorialTimer++;

    // Pulse the tutorial shard manually (shards array entry)
    if (tutorialShard && !tutorialShard.collected) {
        tutorialShard.pulse = (tutorialShard.pulse || 0) + 0.06;
    }

    // Step advancement check
    const step = TUTS[tutorialStep];
    if (step && step.check && step.check()) {
        tutorialStep++;
        tutorialTimer = 0;
        if (tutorialStep >= TUTS.length) {
            exitTutorial();
            return;
        }
        updateTutorialUI();
    }
}

/* ── Block health decay and night in tutorial ── */
function isTutorialMode() { return tutorialMode; }

/* ── Build the tutorial DOM panel ── */
function showTutorialUI() {
    let panel = document.getElementById('tutPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'tutPanel';
        Object.assign(panel.style, {
            position:     'fixed',
            bottom:       '24px',
            left:         '50%',
            transform:    'translateX(-50%)',
            zIndex:       '5000',
            background:   'rgba(0,0,0,0.88)',
            border:       '1px solid #0f8',
            borderRadius: '4px',
            padding:      '14px 20px',
            minWidth:     '300px',
            maxWidth:     '420px',
            fontFamily:   'monospace',
            color:        '#0f8',
            boxShadow:    '0 0 24px rgba(0,255,136,0.2)',
            textAlign:    'center',
        });

        const exitBtn = document.createElement('button');
        exitBtn.id = 'tutExitBtn';
        exitBtn.textContent = 'EXIT TUTORIAL';
        Object.assign(exitBtn.style, {
            display:      'none',
            marginTop:    '12px',
            padding:      '8px 20px',
            background:   '#0a1f14',
            border:       '2px solid #0f8',
            color:        '#0f8',
            fontFamily:   'monospace',
            fontSize:     '13px',
            letterSpacing:'2px',
            cursor:       'pointer',
            borderRadius: '3px',
        });
        exitBtn.onmouseover = () => { exitBtn.style.background = '#0f8'; exitBtn.style.color = '#000'; };
        exitBtn.onmouseout  = () => { exitBtn.style.background = '#0a1f14'; exitBtn.style.color = '#0f8'; };
        exitBtn.onclick = exitTutorial;

        panel.innerHTML = `
          <div id="tutIcon"  style="font-size:1.6rem;margin-bottom:6px"></div>
          <div id="tutTitle" style="font-size:0.85rem;font-weight:bold;letter-spacing:3px;margin-bottom:6px"></div>
          <div id="tutBody"  style="font-size:0.72rem;color:#aee;line-height:1.5;letter-spacing:0.5px"></div>
          <div id="tutProg"  style="font-size:0.58rem;color:#3a5040;margin-top:8px;letter-spacing:1px"></div>
        `;
        panel.appendChild(exitBtn);
        document.body.appendChild(panel);
    }

    panel.style.display = 'block';
    updateTutorialUI();
}

function updateTutorialUI() {
    const step = TUTS[Math.min(tutorialStep, TUTS.length - 1)];
    if (!step) return;
    const icon  = document.getElementById('tutIcon');
    const title = document.getElementById('tutTitle');
    const body  = document.getElementById('tutBody');
    const prog  = document.getElementById('tutProg');
    const exit  = document.getElementById('tutExitBtn');

    if (icon)  icon.textContent  = step.icon  || '⬡';
    if (title) title.textContent = step.title || '';
    if (body)  body.textContent  = step.body  || '';
    if (prog)  prog.textContent  = `STEP ${tutorialStep + 1} / ${TUTS.length}`;

    // Show exit button on the last step
    if (exit) exit.style.display = tutorialStep >= TUTS.length - 1 ? 'inline-block' : 'none';
}

/* ── Exit tutorial → normal game ── */
function exitTutorial() {
    tutorialMode = false;
    const panel = document.getElementById('tutPanel');
    if (panel) panel.style.display = 'none';

    // Transition into a fresh normal game
    restartGame();
}
