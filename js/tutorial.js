// ─────────────────────────────────────────────────────────
//  TUTORIAL MODE
// ─────────────────────────────────────────────────────────
let tutorialMode  = false;
let tutorialStep  = 0;
let tutorialTimer = 0;
let tutEnemyKilled  = false;
let tutModeSwitched = false;
let tutHeldOpen     = false;   // player has opened the command ring at least once
let tutPracticeFoe  = null;    // the bug spawned for the circle-to-kill step

// A weak ant scout, spawned next to the player so the circle-to-kill lesson has
// something to practise on. Predators otherwise only exist in zone 1 and up,
// thirteen tiles or more from where the tutorial starts, so the step used to
// say "an enemy is nearby" when there was nothing on screen at all.
const TUT_FOE_SPECIES = 'ant';
const TUT_FOE_CLASS   = 'scout';

function tutSpawnPracticeFoe() {
    if (tutPracticeFoe && !tutPracticeFoe.dead) return tutPracticeFoe;
    if (typeof Predator === 'undefined' || typeof SPECIES === 'undefined') return null;
    const speciesDef = SPECIES[TUT_FOE_SPECIES];
    const classDef   = speciesDef && speciesDef[TUT_FOE_CLASS];
    if (!classDef) return null;

    // Stand it a few tiles off so it reads as "over there", not on top of you,
    // and keep it on a real floor tile so it is not stuck inside a wall.
    const spot = tutNearestTile(t => t.type === 'floor' && !t.pillar && !t.nest &&
                                     !t.nodeType && tutDist(t) > 2 && tutDist(t) < 4.5);
    const sx = spot ? spot.x : Math.round(player.visualX) + 3;
    const sy = spot ? spot.y : Math.round(player.visualY);

    const def = {
        width: classDef.width, height: classDef.height,
        moveSpeed: classDef.moveSpeed,
        // Softer than the real thing — this is a lesson, not a fight.
        health: Math.round(classDef.health * 0.5),
        power:  Math.round(classDef.power  * 0.5),
        color: speciesDef.color,
        reactionSpeed: classDef.reactionSpeed ?? 15,
        abdomenAttack: false, rangeDamage: 0, abdomenCooldown: 90,
    };
    const foe = new Predator(TUT_FOE_CLASS, def, sx, sy);
    foe.speciesName = TUT_FOE_SPECIES;
    foe.className   = TUT_FOE_CLASS;
    foe.dnaDrops    = classDef.dnaDrops;
    foe.shardDrop   = classDef.shardDrop;
    foe.isTutorialFoe = true;
    // No homeZone on purpose: the zone respawn bookkeeping must not treat this
    // one as a zone's wanderer and hold a slot open for it.
    foe.state = 'wander';
    if (typeof applySpeciesBody === 'function') applySpeciesBody(foe, TUT_FOE_SPECIES);
    foe.baseMoveSpeed = foe.moveSpeed;
    if (typeof initAbility === 'function') initAbility(foe);
    actors.push(foe);
    tutPracticeFoe = foe;
    return foe;
}

// Called from the render loop the frame an actor dies, before dead actors are
// swept out of actors[]. The step used to poll `actors.some(a => a.dead)`, but
// tutorialTick runs early in the frame and the sweep happens later in the SAME
// frame, so a follower kill was gone before the poll could ever see it.
function tutorialNoteKill(actor) {
    if (!tutorialMode || !actor) return;
    const step = TUTS[tutorialStep];
    if (!step || step.id !== 'circle') return;
    if (actor.isFollower || actor.team === 'green') return;
    if (actor.isNeutralRecruit) return;   // a recruit dying is not a kill won
    tutEnemyKilled = true;
}

// Every step points at the one thing on the map it is talking about, so the
// panel's words and the board agree. drawTutorialHighlight() flashes it and
// stops the moment the step's check() passes and the step moves on.
//
// Steps carry an `id` because tutorialTick used to watch for progress by step
// *index*; inserting a step silently re-pointed those watchers at the wrong
// one.
const TUTS = [
    {
        id:    'move',
        title: 'WELCOME TO CONDUIT',
        body:  'You are a viral entity on a living circuit board. Tap the marked floor tile to move there.',
        icon:  '⬡',
        // Somewhere clear to walk to, so the first instruction has a destination.
        target: () => tutNearestTile(t => t.type === 'floor' && !t.pillar && !t.nest &&
                                          !t.nodeType && tutDist(t) > 2.5 && tutDist(t) < 6),
        check: () => tutorialTimer > 210,   // auto-advance after ~3.5s
    },
    {
        id:    'recruit',
        title: 'RECRUIT A FOLLOWER',
        body:  'Walk up to the marked entity. Move close enough and it will join your team.',
        icon:  '☉',
        target: () => tutNearestActor(a => a.isNeutralRecruit && a.team === 'red'),
        check: () => followers.length >= 1,
    },
    {
        id:    'panel',
        title: 'HACK A PANEL',
        body:  'Move to the marked wall panel and stand next to it. Hold your position — your signal will siphon through it.',
        icon:  '▣',
        target: () => tutNearestTile(t => t.nodeType === 'wall_panel' && !t.panelActivated),
        check: () => world.some(t => t.nodeType === 'wall_panel' && t.panelActivated),
    },
    {
        id:    'circle',
        title: 'CIRCLE TO KILL',
        body:  'A hostile bug is marked. Draw a circle around it with your finger — that is how you order an attack. Your followers will move in.',
        icon:  '◎',
        // Bring the lesson to the player rather than hoping one wandered close.
        enter: () => tutSpawnPracticeFoe(),
        target: () => (tutPracticeFoe && !tutPracticeFoe.dead) ? tutPracticeFoe
                    : tutNearestActor(a => a.team === 'red' && !a.isNeutralRecruit),
        check: () => tutEnemyKilled,
    },
    {
        // The reported gap: the old text said "tap a pylon", but a tap moves
        // you. The command ring is a half-second PRESS AND HOLD, and it is
        // worth a step of its own before anything asks the player to use it.
        id:    'hold',
        title: 'PRESS AND HOLD',
        body:  'Commands live in a ring, not a tap. Press and HOLD on the marked pylon for half a second — a ring of buttons opens around your finger. Try it now.',
        icon:  '◉',
        target: () => tutNearestPylon(),
        check: () => tutHeldOpen,
    },
    {
        id:    'upgrade',
        title: 'UPGRADE A PYLON',
        body:  'UPGRADE only shows in build mode. Tap BUILD at the top so it reads BUILD: ON, then press and hold the marked pylon and pick UPGRADE at the top of the ring. Choose an element — a follower sacrifices themselves to power it up as a turret.',
        icon:  '△',
        target: () => tutNearestPylon(t => !t.attackMode && !t.waveMode),
        check: () => world.some(t => t.pillar && (t.attackMode || t.waveMode)),
    },
    {
        id:    'switch',
        title: 'SWITCH PYLON MODE',
        body:  'Turn BUILD back off, then press and hold the marked pylon and pick SWITCH from the left of the ring. That toggles ATTACK MODE (fires at enemies) and WAVE MODE (links with nearby pylons to boost your network).',
        icon:  '⇌',
        // The upgraded pylon, or any pylon if that one got smashed mid-step —
        // better to point somewhere useful than at nothing.
        target: () => tutNearestPylon(t => t.attackMode || t.waveMode) || tutNearestPylon(),
        check: () => tutModeSwitched,
    },
    {
        id:    'ready',
        title: 'READY FOR BATTLE',
        body:  'You know the basics. Remember: tap to move, circle to attack, press and hold for commands. The Crystal must survive the night. Good luck!',
        icon:  '★',
        target: () => (typeof crystal !== 'undefined' && crystal) ? crystal : null,
        check: () => false,
    },
];

/* ── Target finders ─────────────────────────────────────────
   Each returns something with world x/y, or null. They scan the whole world,
   so tutorialTick caches the result rather than calling them per frame. */
function tutDist(o) {
    return Math.hypot(o.x - player.visualX, o.y - player.visualY);
}
function tutNearestTile(pred) {
    let best = null, bestD = Infinity;
    for (const t of world) {
        if (!pred(t)) continue;
        const d = tutDist(t);
        if (d < bestD) { bestD = d; best = t; }
    }
    return best;
}
function tutNearestActor(pred) {
    let best = null, bestD = Infinity;
    for (const a of actors) {
        if (a.dead || !pred(a)) continue;
        const d = tutDist(a);
        if (d < bestD) { bestD = d; best = a; }
    }
    return best;
}
function tutNearestPylon(extra) {
    return tutNearestTile(t => t.pillar && !t.destroyed && t.health > 0 &&
                               (!extra || extra(t)));
}

/* ── The thing the current step is pointing at ──
   Refreshed on a step change and every TUT_RESCAN frames, because a target can
   die, be hacked, or be walked away from. */
const TUT_RESCAN = 20;
let _tutTarget = null, _tutTargetStep = -1, _tutTargetFrame = -TUT_RESCAN;
let _tutEnteredStep = -1;   // which step has already run its enter() hook

function tutorialTarget() {
    if (!tutorialMode) return null;
    const step = TUTS[tutorialStep];
    if (!step || !step.target) return null;
    const stale = _tutTargetStep !== tutorialStep ||
                  tutorialTimer - _tutTargetFrame >= TUT_RESCAN ||
                  (_tutTarget && _tutTarget.dead);
    if (stale) {
        _tutTarget = step.target() || null;
        _tutTargetStep = tutorialStep;
        _tutTargetFrame = tutorialTimer;
    }
    return _tutTarget;
}

/* ── Start tutorial ── */
function startTutorial() {
    tutorialMode    = true;
    tutorialStep    = 0;
    tutorialTimer   = 0;
    tutEnemyKilled  = false;
    tutModeSwitched = false;
    tutHeldOpen     = false;
    tutPracticeFoe  = null;
    _tutTarget      = null; _tutTargetStep = -1;
    _tutEnteredStep = -1;

    showTutorialUI();
}

/* ── Tutorial tick ── */
function tutorialTick() {
    if (!tutorialMode) return;
    tutorialTimer++;

    const step = TUTS[tutorialStep];
    const id = step && step.id;

    // Let a step set itself up the first time it runs.
    if (step && step.enter && _tutEnteredStep !== tutorialStep) {
        _tutEnteredStep = tutorialStep;
        step.enter();
    }

    // Watch by step id, not index — inserting a step used to re-point these at
    // whatever landed on the old number.
    //
    // The kill is reported by tutorialNoteKill() from the render loop, not
    // polled here: tutorialTick runs early in the frame and dead actors are
    // swept out of actors[] later in that same frame, so polling for a corpse
    // could never see a follower kill and the step hung forever.
    //
    // A pylon in waveMode means the player toggled away from the default attackMode.
    if (!tutModeSwitched && id === 'switch') {
        tutModeSwitched = world.some(t => t.pillar && t.waveMode);
    }
    // The command ring is open — the hold worked. commandPendingTap covers a
    // release straight after the hold, which leaves the ring up awaiting a tap.
    if (!tutHeldOpen && id === 'hold') {
        tutHeldOpen = (typeof commandMode !== 'undefined' && commandMode) ||
                      (typeof commandPendingTap !== 'undefined' && commandPendingTap);
    }

    if (step && step.check && step.check()) {
        tutorialStep++;
        tutorialTimer = 0;
        // Drop the finished step's target so nothing keeps flashing on it.
        _tutTarget = null; _tutTargetStep = -1;
        if (tutorialStep >= TUTS.length) {
            exitTutorial();
            return;
        }
        updateTutorialUI();
    }
}

/* ── Highlight ──
   A pulsing ring on the ground under the current step's subject, plus a
   bouncing chevron above it so it reads even when something is standing on the
   tile. World-space, so it draws with the world and not up with the interface.
   Nothing is drawn once the step is satisfied, because the step has moved on
   and the target went with it. */
function drawTutorialHighlight() {
    if (!tutorialMode) return;
    const t = tutorialTarget();
    if (!t) return;

    // Same projection as drawHoldLine: py is the tile's back corner, so the
    // visual centre of the tile is one TILE_H further down.
    const wx = t.x, wy = t.y;
    const sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width  / 2;
    const sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;

    // Off-screen targets cost nothing to skip and would otherwise draw a ring
    // clamped to the edge.
    if (sx < -80 || sx > canvas.width + 80 || sy < -80 || sy > canvas.height + 80) return;

    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.11);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Two ground rings, the outer one sweeping outward as it fades.
    ctx.strokeStyle = `rgba(0,255,136,${0.35 + pulse * 0.5})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy, TILE_W * 0.78, TILE_H * 0.78, 0, 0, Math.PI * 2);
    ctx.stroke();

    const sweep = 0.78 + pulse * 0.5;
    ctx.strokeStyle = `rgba(0,255,136,${0.45 * (1 - pulse)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, TILE_W * sweep, TILE_H * sweep, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Chevron above, bobbing, pointing down at the subject.
    const bob = Math.sin(frame * 0.13) * 4;
    const tipY = sy - 46 + bob;
    ctx.fillStyle = `rgba(0,255,136,${0.65 + pulse * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(sx, tipY + 12);
    ctx.lineTo(sx - 9, tipY);
    ctx.lineTo(sx + 9, tipY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
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
    // Stop the flashing with the panel — a highlight left on the board after
    // the tutorial closes has nothing explaining it.
    _tutTarget = null; _tutTargetStep = -1;
    _tutEnteredStep = -1;
    // A practice bug left alive after the tutorial closes is just a loose
    // predator in the safe zone, so it leaves with the lesson.
    if (tutPracticeFoe && !tutPracticeFoe.dead) tutPracticeFoe.dead = true;
    tutPracticeFoe = null;
    const panel = document.getElementById('tutPanel');
    if (panel) panel.style.display = 'none';
}
