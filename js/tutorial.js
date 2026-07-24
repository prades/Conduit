// ─────────────────────────────────────────────────────────
//  TUTORIAL MODE
// ─────────────────────────────────────────────────────────
let tutorialMode  = false;
let tutorialStep  = 0;
let tutorialTimer = 0;
let tutEnemyKilled = false; // tracks if the circle-kill step is done

const TUTS = [
    {
        title: 'WELCOME TO CONDUIT',
        body:  'You are a viral entity on a living circuit board. Tap any floor tile to move.',
        icon:  '⬡',
        check: () => tutorialTimer > 210,   // auto-advance after ~3.5s
    },
    {
        title: 'RECRUIT A FOLLOWER',
        body:  'Walk up to the glowing entity ahead. Move close enough and it will join your team.',
        icon:  '☉',
        check: () => followers.length >= 1,
    },
    {
        title: 'HACK A PANEL',
        body:  'Move to the glowing wall panel and stand next to it. Hold your position — your signal will siphon through it.',
        icon:  '▣',
        check: () => world.some(t => t.nodeType === 'wall_panel' && t.panelActivated),
    },
    {
        title: 'CIRCLE TO KILL',
        body:  'An enemy bug is ahead. Draw a circle around it with your finger. Your follower will attack!',
        icon:  '◎',
        check: () => tutEnemyKilled,
    },
    {
        title: 'READY FOR BATTLE',
        body:  'You know the basics. The Crystal must survive the night. Good luck — tap below to begin.',
        icon:  '★',
        check: () => false,
    },
];

/* ── Start tutorial ── */
function startTutorial() {
    tutorialMode   = true;
    tutorialStep   = 0;
    tutorialTimer  = 0;
    tutEnemyKilled = false;

    // Full reset
    world = []; actors = []; followers = [];
    ELEMENTS.forEach(el => { followerByElement[el.id] = []; });
    projectiles = []; fragments = []; smoke = []; shards = [];
    if (typeof elementEffects     !== 'undefined') elementEffects     = [];
    if (typeof floatingTexts      !== 'undefined') floatingTexts      = [];
    if (typeof followerProjectiles!== 'undefined') followerProjectiles= [];
    if (typeof environmentalHazards!=='undefined') environmentalHazards=[];
    pendingPillarDestruction = []; respawnQueue = [];
    frame = 0; shake = 0; lastGenX = 0;
    latchedPillar = null; activePredator = null; predatorRespawnTimer = 0;
    if (typeof zonePredators    !== 'undefined') { zonePredators = {}; }
    if (typeof zoneRespawnTimers!== 'undefined') { zoneRespawnTimers = {}; }
    activeDayZones = 3; exploredZones = new Set();
    boughtItems.clear();
    nightKillCount = 0; nightEnemiesTarget = 0;
    if (typeof nightPredatorsRemaining !== 'undefined') nightPredatorsRemaining = 0;

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

    // Build a short fixed map — 18 segments
    for (let i = 0; i < 18; i++) tutBuildSegment(i);

    // Step 1 target: a neutral recruitable NPC at x=5
    actors.push(makeTutNPC(5, 3, true));

    // Step 3 target: a red bug enemy at x=14 that followers can kill
    actors.push(makeTutNPC(14, 2, false));

    document.getElementById('overlay').classList.remove('active');
    showTutorialUI();
    gameState.running = true;
    requestAnimationFrame(render);
}

/* ── Build tutorial NPC ── */
function makeTutNPC(x, y, isRecruit) {
    return {
        type: 'virus', element: 'fire',
        x, y,
        team: 'red', convertFlash: 0,
        isNeutralRecruit: isRecruit,
        health: isRecruit ? 15 : 10,
        maxHealth: isRecruit ? 15 : 10,
        moveSpeed: 0.006, power: 1,
        stats: null, personality: null, role: null,
        currentResonance: 0, currentWill: 10,
        walkCycle: 0, moveCooldown: 0,
        stance: 'wander', isFollower: false, isHealing: false,
        hitFlash: 0, spawnProtection: isRecruit ? 999 : 60,
        dead: false, convertFlash: 0,
        isTutorialEnemy: !isRecruit,
    };
}

/* ── Fixed map: floor tiles + one wall_panel at x=9 ── */
function tutBuildSegment(startX) {
    for (let y = -2; y <= 5; y++) {
        const type = (y === -2) ? 'wall_back' : (y === 5) ? 'wall_front' : 'floor';
        const tile = {
            x: startX, y, type,
            h: (type === 'wall_back') ? 34 : 45,
            pillar: false, pillarTeam: 'red', pillarCol: '#f22',
            destroyed: false, health: 20, maxHealth: 20,
            converting: false, pendingDestroy: false,
            upgraded: false, pulseTimer: 0,
            reconstructing: false, reconstructProgress: 0, workers: [],
            // capturable node fields
            nodeType: null, capturable: false, captureProgress: 0,
            panelActivated: false, siphonProgress: 0,
        };

        // Place a wall_panel at x=9 on the wall_back tile
        if (startX === 9 && type === 'wall_back') {
            tile.nodeType       = 'wall_panel';
            tile.capturable     = false;
            tile.panelActivated = false;
            tile.siphonProgress = 0;
        }

        world.push(tile);
    }
    lastGenX = startX;
}

/* ── Tutorial tick ── */
function tutorialTick() {
    if (!tutorialMode) return;
    tutorialTimer++;

    // Track if the tutorial enemy bug gets killed
    if (!tutEnemyKilled) {
        tutEnemyKilled = actors.some(a => a.isTutorialEnemy && a.dead);
    }

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

/* ── Tutorial UI ── */
function showTutorialUI() {
    let panel = document.getElementById('tutPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'tutPanel';
        Object.assign(panel.style, {
            position:     'fixed',
            bottom:       '80px',
            left:         '50%',
            transform:    'translateX(-50%)',
            zIndex:       '5000',
            background:   'rgba(0,0,0,0.92)',
            border:       '1px solid #0f8',
            borderRadius: '5px',
            padding:      '14px 22px 12px',
            minWidth:     '280px',
            maxWidth:     '400px',
            fontFamily:   'monospace',
            color:        '#0f8',
            boxShadow:    '0 0 28px rgba(0,255,136,0.18)',
            textAlign:    'center',
            touchAction:  'manipulation',
        });

        const exitBtn = document.createElement('button');
        exitBtn.id = 'tutExitBtn';
        exitBtn.textContent = 'START GAME';
        Object.assign(exitBtn.style, {
            display:       'none',
            marginTop:     '12px',
            padding:       '9px 22px',
            background:    '#0a1f14',
            border:        '2px solid #0f8',
            color:         '#0f8',
            fontFamily:    'monospace',
            fontSize:      '13px',
            letterSpacing: '2px',
            cursor:        'pointer',
            borderRadius:  '4px',
            touchAction:   'manipulation',
        });
        exitBtn.onmouseover = () => { exitBtn.style.background = '#0f8'; exitBtn.style.color = '#000'; };
        exitBtn.onmouseout  = () => { exitBtn.style.background = '#0a1f14'; exitBtn.style.color = '#0f8'; };
        exitBtn.onclick = exitTutorial;

        panel.innerHTML = `
          <div id="tutIcon"  style="font-size:1.5rem;margin-bottom:5px;line-height:1"></div>
          <div id="tutTitle" style="font-size:0.8rem;font-weight:bold;letter-spacing:3px;margin-bottom:7px"></div>
          <div id="tutBody"  style="font-size:0.7rem;color:#aee;line-height:1.55;letter-spacing:0.4px"></div>
          <div id="tutProg"  style="font-size:0.55rem;color:#2a6040;margin-top:9px;letter-spacing:1px"></div>
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
    document.getElementById('tutIcon') .textContent = step.icon  || '⬡';
    document.getElementById('tutTitle').textContent = step.title || '';
    document.getElementById('tutBody') .textContent = step.body  || '';
    document.getElementById('tutProg') .textContent = `STEP ${tutorialStep + 1} / ${TUTS.length}`;
    const exitBtn = document.getElementById('tutExitBtn');
    if (exitBtn) exitBtn.style.display = tutorialStep >= TUTS.length - 1 ? 'inline-block' : 'none';
}

/* ── Exit tutorial → fresh game ── */
function exitTutorial() {
    tutorialMode = false;
    const panel = document.getElementById('tutPanel');
    if (panel) panel.style.display = 'none';
    restartGame();
}
