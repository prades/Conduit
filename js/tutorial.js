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
let tutFoes         = [];      // EVERY bug the tutorial has spawned, so it can count and clear them
let tutCircuitOpened = false;  // the connector's circuit has been opened at least once
let tutPylonKill     = false;  // a bug has been killed by a pylon's fire
let tutPylonFoeSpawns = 0;     // bugs sent at the pylons so far (capped, never endless)
let tutArmed         = false;  // the weapon has been armed from a bug's ring

// The tutorial NEVER spawns bugs endlessly. Each lesson that needs enemies gets
// a fixed number, and the lesson ends when they are dealt with — killed as part
// of the lesson, not respawned until the player happens to comply.
const TUT_SQUAD_FOES      = 2;   // one per order: SEL, then ALL
const TUT_ARM_FOES        = 1;   // the weapon lesson gets one bug
const TUT_PYLON_FOE_CAP   = 2;   // sent at the pylons; if both die some other way the step moves on

// A weak ant scout, spawned next to the player so the circle-to-kill lesson has
// something to practise on. Predators otherwise only exist in zone 1 and up,
// thirteen tiles or more from where the tutorial starts, so the step used to
// say "an enemy is nearby" when there was nothing on screen at all.
const TUT_FOE_SPECIES = 'ant';
const TUT_FOE_CLASS   = 'scout';

// opts.additional: spawn another even though one is alive (the squad lesson
// needs two). opts.near: stand it 1.2–2.2 tiles from this pylon, in its range.
function tutSpawnPracticeFoe(opts) {
    opts = opts || {};
    if (!opts.additional && tutPracticeFoe && !tutPracticeFoe.dead) return tutPracticeFoe;
    if (typeof Predator === 'undefined' || typeof SPECIES === 'undefined') return null;
    const speciesDef = SPECIES[TUT_FOE_SPECIES];
    const classDef   = speciesDef && speciesDef[TUT_FOE_CLASS];
    if (!classDef) return null;

    // Stand it a few tiles off so it reads as "over there", not on top of you,
    // and keep it on a real floor tile so it is not stuck inside a wall.
    const clear = t => !tutFoes.some(f => !f.dead && Math.hypot(f.x - t.x, f.y - t.y) < 1.2);
    const spot = opts.near
        ? tutNearestTile(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && clear(t) &&
                              Math.hypot(t.x - opts.near.x, t.y - opts.near.y) >= 1.2 &&
                              Math.hypot(t.x - opts.near.x, t.y - opts.near.y) <= 2.2)
        : tutNearestTile(t => t.type === 'floor' && !t.pillar && !t.nest &&
                              !t.nodeType && clear(t) && tutDist(t) > 2 && tutDist(t) < 4.5);
    const sx = spot ? spot.x : (opts.near ? opts.near.x + 1.5 : Math.round(player.visualX) + 3);
    const sy = spot ? spot.y : (opts.near ? opts.near.y : Math.round(player.visualY));

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
    tutFoes.push(foe);
    return foe;
}

function tutLiveFoes() { return tutFoes.filter(f => f && !f.dead); }


// ── SQUAD LESSON ──────────────────────────────────────────
// Teaching "only the FIRE ones" versus "everybody" needs a squad with more
// than one element in it. By this point the player has recruited exactly one
// follower, so the step lends them a second of a different element. Both are
// taken back when the tutorial closes — the game's rule is that followers are
// earned, and these are on loan for the lesson.
const TUT_SQUAD_ELEMENTS = ['fire', 'electric'];
let tutLoanedFollowers = [];
let tutOrderedSelected = false;   // issued an attack order with SQUAD: SEL
let tutOrderedAll      = false;   // ...and with SQUAD: ALL
let tutCrystalOpened   = false;   // the player has opened the Crystal menu
let tutPutToWork       = false;   // ...and put a follower on the work crew
let tutCloned          = false;   // ...and summoned a clone

function tutSpawnPracticeFollowers() {
    if (typeof spawnFollowerFromSave !== 'function') return;
    for (const el of TUT_SQUAD_ELEMENTS) {
        const have = followers.filter(f => !f.dead && f.element === el).length;
        if (have > 0) continue;
        const before = followers.length;
        spawnFollowerFromSave({ element: el });
        const added = followers[followers.length - 1];
        if (followers.length > before && added) {
            added.isTutorialUnit = true;
            tutLoanedFollowers.push(added);
        }
    }
}

// Enough DNA and shards for one cheap clone, so the step can actually be
// finished. Loaned like the practice followers: the player has not earned it,
// but a tutorial that asks for something it does not provide simply stalls.
function tutGrantCloneMaterials() {
    if (typeof getDNA !== 'function' || typeof setDNA !== 'function') return;
    if (typeof CLONE_COSTS === 'undefined') return;
    const inv = getDNA();
    const key = 'ant_scout';                 // the cheapest thing on the list
    const need = (CLONE_COSTS.ant && CLONE_COSTS.ant.splicesNeeded) || 3;
    if ((inv[key] || 0) < need) { inv[key] = need; setDNA(inv); }
    if (typeof shardCount === 'number' && typeof cloneShardCost === 'function') {
        const cost = cloneShardCost('ant', 'scout');
        if (shardCount < cost) { shardCount = cost; if (typeof saveShards === 'function') saveShards(); }
    }
}

// Hand the loaned followers back. Spliced out rather than killed, so no death
// effects fire and no shards drop for units the player never earned.
function tutReturnPracticeFollowers() {
    for (const f of tutLoanedFollowers) {
        let i = actors.indexOf(f);    if (i >= 0) actors.splice(i, 1);
        i = followers.indexOf(f);     if (i >= 0) followers.splice(i, 1);
        const bucket = followerByElement[f.element];
        if (bucket) { i = bucket.indexOf(f); if (i >= 0) bucket.splice(i, 1); }
    }
    tutLoanedFollowers = [];
    if (typeof rebuildFollowerTable === 'function') rebuildFollowerTable();
}

// Called by issueAttackOnEnemies with the units that actually took the order.
// An order nobody answered taught nothing, so an empty pool does not count —
// which is the whole point of the lesson: in SEL mode, only the selected
// element answers.
function tutorialNoteAttackOrder(pool) {
    if (!tutorialMode) return;
    const step = TUTS[tutorialStep];
    if (!step || step.id !== 'squad') return;
    if (!pool || pool.length === 0) return;
    if (typeof squadMode !== 'undefined' && squadMode === 'all') tutOrderedAll = true;
    else                                                         tutOrderedSelected = true;
}

// The top buttons live in the DOM above the canvas, so the on-board highlight
// cannot reach them. A step that needs one declares wantsButton(), returning
// its element id, and that button pulses only while the call keeps returning
// it — so the pulse stops the moment the player complies instead of running
// for the whole step and turning into noise.
const TUT_HINTABLE_BUTTONS = ['btnBuild', 'btnSquad'];

function tutorialUiHints() {
    const step = tutorialMode ? TUTS[tutorialStep] : null;
    const want = (step && step.wantsButton && step.wantsButton()) || null;
    for (const id of TUT_HINTABLE_BUTTONS) {
        const btn = document.getElementById(id);
        if (btn && btn.classList) btn.classList.toggle('tut-wanted', id === want);
    }
}

// Called from the render loop the frame an actor dies, before dead actors are
// swept out of actors[]. The step used to poll `actors.some(a => a.dead)`, but
// tutorialTick runs early in the frame and the sweep happens later in the SAME
// frame, so a follower kill was gone before the poll could ever see it.
function tutorialNoteKill(actor) {
    if (!tutorialMode || !actor) return;
    const step = TUTS[tutorialStep];
    if (!step || (step.id !== 'circle' && step.id !== 'pylonkill')) return;
    if (actor.isFollower || actor.team === 'green') return;
    if (actor.isNeutralRecruit) return;   // a recruit dying is not a kill won
    if (step.id === 'circle') tutEnemyKilled = true;
    // Only a bug the PYLONS shot counts for the pylon lesson (the turret pass
    // in game.js marks what it fires at).
    if (step.id === 'pylonkill' && actor._shotByPylon) tutPylonKill = true;
}

// The weapon was armed (called by setPlayerAttackMode).
function tutorialNoteArm() {
    if (!tutorialMode) return;
    const step = TUTS[tutorialStep];
    if (step && step.id === 'arm') tutArmed = true;
}

// The connector's circuit was switched (called by toggleConnectorCircuit).
function tutorialNoteCircuit(c) {
    if (!tutorialMode || !c) return;
    const step = TUTS[tutorialStep];
    if (step && step.id === 'circuit' && c.circuitOn === false) tutCircuitOpened = true;
}

// A turret that is actually firing-capable: an element pylon in attack mode
// with power reaching it.
function tutPoweredTurret() {
    return tutNearestPylon(t => t.attackMode && !t.isGenerator && !t.isConnector && t.powered);
}
// A pylon the player can turn into a relay without losing a working turret.
function tutPlainPylon(extra) {
    const ok = t => !t.isGenerator && !t.isConnector && typeof canPlaceGenerator === 'function' &&
                    canPlaceGenerator(t).ok && (!extra || extra(t));
    return tutNearestPylon(t => ok(t) && !t.attackMode && !t.waveMode) || tutNearestPylon(ok);
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
        // Who answers an attack order is decided by the SQUAD button, and it is
        // the difference between committing one element and committing
        // everything. Taught right after the circle gesture, while that is
        // still fresh, and before a follower gets spent on a pylon upgrade.
        id:    'squad',
        title: 'WHO ANSWERS THE CALL',
        body:  'SQUAD: SEL sends only the element picked in the ELEM list — pick FIRE and only your fire units go. SQUAD: ALL sends everyone. Circle the marked bug once on SEL, then tap the flashing SQUAD button and circle it again on ALL.',
        icon:  '⑂',
        // Two bugs, once: one for each order. They are NOT respawned — the lesson
        // ends when both orders have been given or both bugs are dead.
        enter: () => {
            tutSpawnPracticeFollowers();
            for (let i = 0; i < TUT_SQUAD_FOES; i++) tutSpawnPracticeFoe({ additional: i > 0 });
        },
        // Flash whichever mode has not been demonstrated yet.
        wantsButton: () => {
            if (typeof squadMode === 'undefined') return null;
            if (squadMode === 'all' ? tutOrderedAll : tutOrderedSelected) return 'btnSquad';
            return null;
        },
        target: () => tutNearestActor(a => a.isTutorialFoe) ||
                      tutNearestActor(a => a.team === 'red' && !a.isNeutralRecruit),
        check: () => (tutOrderedSelected && tutOrderedAll) ||
                     (tutFoes.length >= TUT_SQUAD_FOES && tutLiveFoes().length === 0),
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
        // The weapon is armed ONLY from a bug's ring, and nothing had ever said
        // so: one bug, and the step ends the moment the weapon is armed.
        id:    'arm',
        title: 'ARM YOUR WEAPON',
        body:  'Press and HOLD the marked bug: its ring offers ATTACK, which arms your weapon and fires at once. Shots cost ammo; hacking wall panels refills it. Followers do the real fighting \u2014 this is for finishing a bug off.',
        icon:  '\u2316',
        enter: () => {
            if (typeof playerAmmo === 'number' && typeof PLAYER_AMMO_START === 'number' && playerAmmo < PLAYER_AMMO_START) playerAmmo = PLAYER_AMMO_START;
            if (tutFoes.length === 0 || tutLiveFoes().length === 0) tutSpawnPracticeFoe({ additional: true });
        },
        target: () => tutNearestActor(a => a.isTutorialFoe) || tutNearestActor(a => a.team === 'red' && !a.isNeutralRecruit),
        check: () => tutArmed || (tutFoes.length > 0 && tutLiveFoes().length === 0),
    },
    {
        id:    'upgrade',
        title: 'UPGRADE A PYLON',
        body:  'UPGRADE only shows in build mode. Tap the flashing BUILD button so it reads BUILD: ON, then press and hold the marked pylon and pick UPGRADE at the top of the ring. Choose an element — a follower sacrifices themselves to power it up as a turret.',
        icon:  '△',
        // Flash BUILD until it is on; once it is, the request is answered and
        // the ring's UPGRADE button is where the player should be looking.
        wantsButton: () => (typeof buildMode !== 'undefined' && !buildMode) ? 'btnBuild' : null,
        target: () => tutNearestPylon(t => !t.attackMode && !t.waveMode),
        check: () => world.some(t => t.pillar && (t.attackMode || t.waveMode)),
    },
    {
        id:    'switch',
        title: 'SWITCH PYLON MODE',
        body:  'Turn BUILD back off, then press and hold the marked pylon and pick SWITCH from the left of the ring. That toggles ATTACK MODE (fires at enemies) and WAVE MODE (links with nearby pylons to boost your network).',
        icon:  '⇌',
        // This step asks for the opposite: flash BUILD while it is still on.
        wantsButton: () => (typeof buildMode !== 'undefined' && buildMode) ? 'btnBuild' : null,
        // The upgraded pylon, or any pylon if that one got smashed mid-step —
        // better to point somewhere useful than at nothing.
        target: () => tutNearestPylon(t => t.attackMode || t.waveMode) || tutNearestPylon(),
        check: () => tutModeSwitched,
    },
    {
        // The Crystal is where modulation and recruiting live, and nothing had
        // ever told the player it opens. It is a TAP, not a hold — the hold
        // ring is for things on the floor.
        id:    'crystal',
        title: 'OPEN THE CRYSTAL',
        body:  'Tap the Crystal to open it. Inside are MODULATION (what your followers are made of), RECRUIT and CRAFT. The green portal on zone 0\'s back wall opens the same menu, so you can reach it from either end of home.',
        icon:  '\u25c8',
        target: () => (typeof crystal !== 'undefined' && crystal) ? crystal : null,
        check: () => tutCrystalOpened,
    },
    {
        // Clones are the one thing in the game that turns a kill into a unit.
        // The clone bay lives on the HUD — the turning DNA button, top right —
        // so this step marks THAT, not anything on the floor.
        id:    'clone',
        title: 'SUMMON A CLONE',
        hud:   'dna',
        body:  'Tap the turning DNA button (top right) to open the CLONES bay. Killing a predator drops its DNA; spend enough of one species plus shards and it fights for YOU, with ' + CLONE_HEALTH_MULT + 'x the health and ' + CLONE_POWER_MULT + 'x the power. A green bar over the head means it is yours.',
        icon:  '\u2687',
        // Enough DNA and shards to actually do it — a step the player cannot
        // finish is worse than no step at all.
        enter: () => tutGrantCloneMaterials(),
        target: () => ({ hud: 'dna' }),   // a HUD button, marked by drawTutorialHighlight
        check: () => tutCloned,
    },
    {
        // A generator is an UPGRADE choice, not a building of its own, and the
        // placement rule is the whole reason it needs explaining: it has to be
        // near a NEST. The green portal at home counts as one, which is why
        // this step can be finished without leaving zone 0.
        id:    'generator',
        title: 'BUILD A GENERATOR',
        body:  'Turn BUILD on, press and hold the marked pylon, pick UPGRADE and choose GENERATOR. It can only go within ' + GENERATOR_NEST_RANGE + ' tiles of a NEST — the green portal at home counts, so there is a spot right here.',
        icon:  '\u2699',
        wantsButton: () => (typeof buildMode !== 'undefined' && !buildMode) ? 'btnBuild' : null,
        // A pylon that could actually take one, so the marker never points at a
        // tile the game would refuse.
        target: () => tutPlainPylon(),
        check: () => world.some(t => t.pillar && t.isGenerator && !t.destroyed),
    },
    {
        // What the generator is FOR. No action to perform — it is already true
        // the moment the generator exists — so it reads and moves on.
        id:    'aura',
        title: 'THE HEALING AURA',
        body:  'A generator links itself to nearby pylons — nothing to connect. Each linked pylon mends your followers, your clones and YOU standing near it; the faint ring is its reach. Rate and reach both scale with that pylon\'s NETWORK TIER.',
        icon:  '\u271a',
        target: () => tutNearestPylon(t => t.isGenerator) || tutNearestPylon(),
        check: () => tutorialTimer > 300,   // ~5s to read it
    },
    {
        // What the power IS. Read-only: the batteries are already there.
        id:    'power',
        title: 'NESTS ARE BATTERIES',
        body:  'Turrets and waves run on power. Each nest you have neutralised is a battery, and the percentage above it shows what is left: the bar empties as pylons draw on it. A generator draws from the nearest one.',
        icon:  '\u26a1',
        target: () => (typeof homePortalTile === 'function' && homePortalTile()) ||
                      tutNearestTile(t => t.nest) ||
                      ((typeof crystal !== 'undefined' && crystal) ? crystal : null),
        check: () => tutorialTimer > 420,   // ~7s to read it
    },
    {
        // The new relay. Same placement rule as the generator, a very different
        // reach: it is what carries power out to the far zones.
        id:    'connector',
        title: 'BUILD A CONNECTOR PYLON',
        body:  'A CONNECTOR is a long-range relay. With BUILD on, hold a plain pylon, pick UPGRADE then CONNECTOR (within ' + GENERATOR_NEST_RANGE + ' tiles of a nest). It powers EVERY pylon within ' + CONNECTOR_RANGE + ' tiles, so one can light a far-off zone.',
        icon:  '\u2301',
        wantsButton: () => (typeof buildMode !== 'undefined' && !buildMode) ? 'btnBuild' : null,
        target: () => tutPlainPylon(),
        check: () => world.some(t => t.pillar && t.isConnector && !t.destroyed),
    },
    {
        // The switch. Latched on the OPEN, and finished when it is closed again,
        // so the connector is left feeding power for the next step.
        id:    'circuit',
        title: 'THE CIRCUIT SWITCH',
        body:  'Press and hold your connector: the left button says OPEN CIRCUIT. Open it and every pylon it feeds goes dark at once. Then CLOSE CIRCUIT to bring the whole group back. Use it to power up a group for a fight and cut it off while you rest.',
        icon:  '\u23fb',
        target: () => tutNearestPylon(t => t.isConnector) || tutNearestPylon(),
        check: () => tutCircuitOpened &&
                     world.some(t => t.pillar && t.isConnector && !t.destroyed && t.circuitOn !== false),
    },
    {
        // The goal of all of it. A bug is sent to the first powered turret, and
        // the step ends when the PYLONS kill it.
        id:    'pylonkill',
        title: 'KILL WITH YOUR PYLONS',
        body:  'Pylons fight for you. An ATTACK pylon shoots enemies near it, paying from a nest through a generator or closed connector. Keep one element turret and let the bug sent to it die to your pylons. Need a pylon? BUILD costs ' + PYLON_BUILD_COST + ' shards.',
        icon:  '\u2694',
        // Sends a bug to the turret \u2014 a fixed number, never endless.
        tick: () => {
            if (tutPylonFoeSpawns >= TUT_PYLON_FOE_CAP) return;
            if (tutLiveFoes().some(f => f._tutPylonFoe)) return;
            const turret = tutPoweredTurret();
            if (!turret) return;
            const foe = tutSpawnPracticeFoe({ near: turret, additional: true });
            if (foe) { foe._tutPylonFoe = true; tutPylonFoeSpawns++; }
        },
        // No turret yet? Point at a pylon that could become one, and flash BUILD.
        wantsButton: () => (!tutPoweredTurret() && typeof buildMode !== 'undefined' && !buildMode) ? 'btnBuild' : null,
        target: () => tutNearestActor(a => a._tutPylonFoe) || tutPoweredTurret() ||
                      tutNearestPylon(t => !t.isGenerator && !t.isConnector && !t.attackMode && !t.waveMode) ||
                      tutNearestPylon(),
        check: () => tutPylonKill ||
                     (tutPylonFoeSpawns >= TUT_PYLON_FOE_CAP && !tutLiveFoes().some(f => f._tutPylonFoe)),
    },
    {
        // Six elements, six jobs. Worth a step because nothing else in the game
        // says a follower can be taken off the line at all.
        id:    'work',
        title: 'PUT SOMEONE TO WORK',
        body:  'Press and hold one of your followers and pick TO WORK. Each element has its own job: ELECTRIC and FLUX turn kills into shards, CORE rebuilds broken pylons, FIRE burns back infestation, TOXIC repels, ICE freezes into a block.',
        icon:  '\u2692',
        enter: () => tutSpawnPracticeFollowers(),
        // Falls back to the Crystal when there is no follower to point at —
        // that is where the next one comes from, and every step has to mark
        // something or the panel talks about a board the player cannot find.
        target: () => tutNearestActor(a => a.isFollower && !a.dead && a.duty !== 'worker')
                   || ((typeof crystal !== 'undefined' && crystal) ? crystal : null),
        check: () => tutPutToWork,
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
    tutOrderedSelected = false;
    tutOrderedAll      = false;
    tutCrystalOpened   = false;
    tutPutToWork       = false;
    tutCloned          = false;
    tutPracticeFoe  = null;
    tutFoes            = [];
    tutCircuitOpened   = false;
    tutPylonKill       = false;
    tutPylonFoeSpawns  = 0;
    tutArmed           = false;
    tutLoanedFollowers = [];
    // Enough shards to build everything the lessons ask for, however the run
    // has gone: a step that needs shards the player does not have just stalls.
    if (typeof shardCount === 'number' && typeof STARTING_SHARDS === 'number' && shardCount < STARTING_SHARDS) {
        shardCount = STARTING_SHARDS;
        if (typeof saveShards === 'function') saveShards();
    }
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

    // Let a step set itself up the first time it runs, and keep itself topped
    // up after that.
    if (step && step.enter && _tutEnteredStep !== tutorialStep) {
        _tutEnteredStep = tutorialStep;
        step.enter();
    }
    if (step && step.tick) step.tick();

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
    // The Crystal menu is a MOMENT, not a state: the player opens it, reads it
    // and closes it again, and polling check() might never land on a frame
    // where it happens to be open. Latched here, the same way the hold is.
    if (!tutCrystalOpened && id === 'crystal') {
        tutCrystalOpened = (typeof crystalMenuOpen !== 'undefined' && crystalMenuOpen);
    }
    // Duty is a state, but latch it too: taking the follower straight back off
    // the crew should not un-complete the step.
    if (!tutPutToWork && id === 'work') {
        tutPutToWork = followers.some(f => f && !f.dead && f.duty === 'worker');
    }
    // Latched, not polled: a clone summoned and then killed would otherwise
    // un-complete a step the player has already finished. Polling for a LIVE
    // actor is safe — nothing sweeps the living away mid-frame, which is the
    // hazard that made the kill step a notification instead of a poll.
    if (!tutCloned && id === 'clone') {
        tutCloned = actors.some(a => a && a.isClone && !a.dead);
    }

    tutorialUiHints();

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
    // A step about a HUD button marks the button itself, in screen space.
    if (t.hud === 'dna' && typeof _BLOB !== 'undefined') {
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.11);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = `rgba(0,255,136,${0.4 + pulse * 0.5})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(_BLOB.x, _BLOB.y, _BLOB.r + 6 + pulse * 6, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        return;
    }

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
    for (const f of tutFoes) if (f && !f.dead) f.dead = true;
    if (tutPracticeFoe && !tutPracticeFoe.dead) tutPracticeFoe.dead = true;
    tutPracticeFoe = null;
    tutFoes = [];
    tutReturnPracticeFollowers();
    // Stop the BUILD button pulsing along with everything else.
    tutorialUiHints();
    const panel = document.getElementById('tutPanel');
    if (panel) panel.style.display = 'none';
}
