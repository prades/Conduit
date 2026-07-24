// ─────────────────────────────────────────────────────────
//  TUTORIAL MODE
// ─────────────────────────────────────────────────────────
let tutorialMode  = false;
let tutorialStep  = 0;
let tutorialTimer = 0;
let tutEnemyKilled  = false;
let tutModeSwitched = false;

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
        body:  'An enemy bug is nearby. Draw a circle around it with your finger. Your followers will attack!',
        icon:  '◎',
        check: () => tutEnemyKilled,
    },
    {
        title: 'UPGRADE A PYLON',
        body:  'Tap a pylon to open the command menu, then select UPGRADE. Pick an element — a follower will sacrifice themselves to power it up as a turret.',
        icon:  '△',
        check: () => world.some(t => t.pillar && (t.attackMode || t.waveMode)),
    },
    {
        title: 'SWITCH PYLON MODE',
        body:  'Tap the active pylon and select SWITCH MODE. Toggle between ATTACK MODE (fires at enemies) and WAVE MODE (links with nearby pylons to boost your network).',
        icon:  '⇌',
        check: () => tutModeSwitched,
    },
    {
        title: 'READY FOR BATTLE',
        body:  'You know the basics. The Crystal must survive the night. Good luck!',
        icon:  '★',
        check: () => false,
    },
];

/* ── Start tutorial ── */
function startTutorial() {
    tutorialMode    = true;
    tutorialStep    = 0;
    tutorialTimer   = 0;
    tutEnemyKilled  = false;
    tutModeSwitched = false;

    showTutorialUI();
}

/* ── Tutorial tick ── */
function tutorialTick() {
    if (!tutorialMode) return;
    tutorialTimer++;

    // Track enemy kill during circle-kill step (step index 3)
    if (!tutEnemyKilled && tutorialStep === 3) {
        tutEnemyKilled = actors.some(a => a.dead && !a.isFollower && a.team === 'red');
    }
    // Track pylon mode switch during switch-mode step (step index 5)
    // A pylon that has waveMode means the player toggled away from the default attackMode
    if (!tutModeSwitched && tutorialStep === 5) {
        tutModeSwitched = world.some(t => t.pillar && t.waveMode);
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
        exitBtn.textContent = 'CLOSE TUTORIAL';
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

/* ── Exit tutorial ── */
function exitTutorial() {
    tutorialMode = false;
    const panel = document.getElementById('tutPanel');
    if (panel) panel.style.display = 'none';
}
