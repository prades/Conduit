// ─────────────────────────────────────────────────────────
//  THE TUTORIAL DIRECTOR — what to do, in order, and the first assault (docs/TUTORIAL.md, phase 6)
// ─────────────────────────────────────────────────────────
// A short list of objectives (TUT_STEPS) that teaches the loop the earlier phases built, WITHOUT CLASSES: find supplies in the dark, restore a relay (with the relay kit and two power cells: anyone can), RECRUIT a follower, POSITION
// followers, then DEFEND THE CRYSTAL against a first assault, in which followers fight, gain levels and EVOLVE. Only when that is finished are the classes given: the class picker opens, and once a class is chosen the cases for that
// class enter the facility (facilityClassItemsEnter) and the class's own STAGE follows (TUT_CLASS_STAGES: its gear at its station, then its loop). A step is done when its `done()` says so (a step already done when it comes up is skipped). Nothing here is a new system:
//   recruiting is recruitFollower (js/clone.js), positioning is the roster's HOLD (a.stance, js/commandcenter.js), levels and evolution are gainXp and evolutionTick (js/levels.js, js/evolution.js), the enemies are
//   ants (spawnCreature, js/clone.js), and they hunt the Crystal as every creature does when an alarm is up. The director only sets levels, spawns the assault and keeps the alarm on while it lasts.
// Levels: while the tutorial is being played, its followers (the three you start with and every recruit) are level TUT.followerLevel, and the assault's enemies are level TUT.enemyLevel, a little behind, so the assault is enough to take a follower
// to the evolution level. When the tutorial is finished that stops: a recruit comes at its own level (js/levels.js recruitLevel) and gains its levels from kills, and a game that is loaded is not lifted at all (its followers come back as they were saved).
// A crystal that is about to fall is saved: the enemies are called off, the Crystal is mended and the assault comes again (the tutorial is not a loss).

const TUT = {
    followerLevel: 9, enemyLevel: 8,
    countdown: 1200,                 // frames between the objective coming up and the first wave (20 s)
    waves: [                          // the assault: each wave is a list of [class, spawn x, spawn y] (tiles; the east end of the hallway, in rows with no floodlight in the way: the lab's ring comes round to the Crystal)
        { at: 0, who: [["scout", 44, 23], ["scout", 45, 24], ["scout", 46, 23], ["scout", 46, 24]] },
        { at: 1500, who: [["striker", 45, 23], ["striker", 46, 24], ["striker", 44, 24]] },
    ],
    mercy: 0.15,                     // below this share of its health the Crystal is saved (the enemies are called off and it is mended to `mend`)
    mend: 0.6,
    stragglers: 3600,                // frames after the last wave's arrival before the assault is over whatever is left (a wounded enemy runs; the rest of them are called off)
    reward: 400,                     // XP each living follower is paid for beating the assault (gainXp: the same levelling a kill gives; enough, with what the fighting earned, to evolve one)
    holdNeeded: 2,                   // followers posted (HOLD) near the Crystal for the POSITION objective
    holdRange: 9,
};

const TUT_STEPS = [
    { id: "supplies", title: "FIND SUPPLIES", text: () => "THE POWER IS OUT. TAKE THE GLOWING CASES: WALK OVER ONE. PRESS I FOR YOUR PACK.",
        hint: () => "AMMUNITION IS IN THE ARMORY (THE STEEL DOOR IN THE ARENA'S WEST WALL, OR THE STAIRS DOWN FROM THE OBSERVATION DECK) AND THE SECURITY ROOM; POWER CELLS IN THE LAB AND THE LOBBY.", done: () => tutTaken() >= 2 },
    { id: "relay", title: "RESTORE THE RELAY", text: () => "REPAIR THE CRYSTAL CHAMBER'S RELAY (ITS NORTH-EAST CORNER).",
        hint: () => "YOU NEED THE RELAY KIT (A CASE IN THE CHAMBER) AND 2 POWER CELLS. TAP THE RELAY AND STAY AT IT.", done: () => relayOnline("relay_chamber") },
    { id: "recruit", title: "RECRUIT A FOLLOWER", text: () => "WALK UP TO A FOLLOWER'S EGG, OR OPEN THE ROSTER (BOTTOM BAR) AND PRESS + RECRUIT: 30 SHARDS.",
        hint: () => "EGGS WAIT ON GLOWING PADS (THE COMPUTER LAB, THE SHOW ROOM, THE DECK, THE EXPERIMENT LAB, THE SECOND TELEPORT ROOM AND TWO IN THE ARENA): EACH ONE IS A BRAWLER, A MAGE OR A TECHNICIAN OF ONE ELEMENT, AND JOINS YOU AS EXACTLY THAT. EVERY ELEMENT IS ONLINE FROM THE START. YOU CANNOT CHANGE WHAT A FOLLOWER IS: EVOLVE IT TO MAKE IT BETTER. YOUR SQUAD HOLDS THREE: A NEW FOLLOWER ONLY FOLLOWS YOU WHILE IT HAS ROOM, OTHERWISE IT HOLDS THE ROOM IT IS IN.", done: () => followers.filter(f => f && !f.dead).length > _fp.tut.script.baseFollowers },
    { id: "position", title: "POST YOUR FOLLOWERS", text: () => "POST TWO FOLLOWERS NEAR THE CRYSTAL: SELECT THEM AND PRESS HOLD.",
        hint: () => "HOLD POSTS A FOLLOWER IN THE ROOM IT IS IN: IT PATROLS THE ROOM AND FIGHTS ANYTHING THAT COMES IN. COME CALLS IT BACK TO YOUR SQUAD (THREE AT A TIME).", done: () => tutHeld() >= TUT.holdNeeded },
    { id: "gun", title: "FIRE YOUR GUN", text: () => tutGunText(),
        hint: () => playerAttackMode ? "CLICK THE ROUND BUTTON AT THE TOP LEFT FOR A SHOT, OR HOLD IT TO KEEP FIRING. EACH SHOT COSTS A ROUND. TAP ANOTHER CREATURE TO SWITCH TARGETS." : "GET CLOSE TO THE ANT: YOUR GUN TAKES AIM BY ITSELF, AND A ROUND BUTTON WITH THE ANT'S PICTURE APPEARS AT THE TOP LEFT.", done: () => tutGunDone() },
    { id: "assault", title: "DEFEND THE CRYSTAL", text: () => tutAssaultText(), hint: () => "FOLLOWERS FIGHT AND GAIN LEVELS (LEVEL 10: EVOLUTION). YOU CAN SHOOT TOO: THE GUN LOCKS ON TO THE NEAREST ENEMY; CLICK THE ROUND BUTTON OR HOLD IT. THE SENTRIES HELP IF THEIR RELAY IS ON.", done: () => !!_fp.tut.script.assault && _fp.tut.script.assault.over },
    { id: "evolve", title: "EVOLVE A FOLLOWER", text: () => "A FOLLOWER EVOLVES AT LEVEL " + EVOLVE_LEVEL + ".", hint: () => "KEEP IT FIGHTING.", done: () => followers.some(f => f && f.evolved) },
];

// AFTER the tutorial, once a class is chosen: the class's own objective (earn its perk at its station). Classes are given only when the tutorial is finished. It is the first step of the class's stage (below).
const TUT_CLASS_STEP = { id: "perk", title: "GET YOUR GEAR", text: () => ({ gunslinger: "FIND THE MACHINE GUN: THE WEAPON LOCKER IN THE ARMORY (THE ARENA'S WEST DOOR, OR THE STAIRS FROM THE OBSERVATION DECK).", technomancer: "BUILD THE SPIDER MECH AT THE MECH BAY IN THE SHOW ROOM.", mutator: "WALK THROUGH TELEPORT ROOM 1 AND DOWN THE PASSAGE INTO THE EXPERIMENT LAB." }[playerClassKey] || ""),
    hint: () => ({ gunslinger: "WALK UP TO THE GLOWING LOCKER AND PRESS E (OR TAP IT). THE GUN IS BIG: YOU STAND TALL ON YOUR TENTACLES TO HOLD IT.", technomancer: "COLLECT 4 MECH LEGS (TELEPORT ROOM 1) AND THE CORE (SHOW ROOM), THEN STAND AT THE PAD AND PRESS E.", mutator: "THE LAB COAT AND SAFETY GOGGLES GO ON BY THEMSELVES WHEN YOU WALK IN, AND YOU KEEP THEM." }[playerClassKey] || ""), done: () => !!CLASS_SIGNATURE[playerClassKey] && classHas(CLASS_SIGNATURE[playerClassKey]) };

// THE CLASS'S STAGE (the brief: "Each class should have its own tutorial stage after the initial tutorial"): once a class is chosen, a few objectives that teach what it does with what the game already has. The first is its
// gear (TUT_CLASS_STEP); the rest are its loop. A step is done when its `done()` says so, and one already done when it comes up is passed, as in the tutorial. What the class does is COUNTED from the moment the
// stage begins: tutTally (the class's own code says when a strike lands, an arc is thrown, a serum is splashed...), and the kills and relays online from what they were then (S.ck0, S.cr0). A step with `stray`
// puts the gun lesson's training creature in view while it is up (TUT_STRAY: a big grazing ant near the player, replaced if it dies, taken away after, paying nothing). The plate counts "n/N".
const TUT_STRAY = { level: 3, health: 400, size: 2.2, near: [4, 7], respawns: 6 };   // (TUT_GUN's stray; `respawns` a step)
const TUT_CLASS_STAGES = {
    gunslinger: [TUT_CLASS_STEP,
        { id: "cctv", title: "SWEEP THE CAMERAS", text: () => "RUN A CCTV SWEEP AT THE SECURITY ROOM'S CONSOLE: EVERY ENEMY IS MARKED FOR 25 SECONDS.",
            hint: () => "WALK UP TO THE CONSOLE AND PRESS E (OR TAP IT). IT CAN BE RUN AGAIN A MINUTE LATER.", done: () => classHas("cctv") },
        { id: "flare", title: "LIGHT A FLARE", text: () => "LIGHT A FLARE: OPEN YOUR PACK (I) AND USE ONE.",
            hint: () => "IT LIGHTS THE GROUND FOR HALF A MINUTE, POWER OR NOT. MORE ARE IN THE ARMORY.", done: () => tutCount("flare") >= 1 },
        { id: "hunt", title: "HUNT IN THE ARENA", text: () => "DEFEAT 3 CREATURES: " + Math.min(3, tutClassKills()) + "/3. YOUR SQUAD FIGHTS WITH YOU.",
            hint: () => "A KILL PAYS SHARDS, DNA AND SCRAP: THE ARMORY'S TERMINAL MAKES SCRAP INTO ROUNDS.", done: () => tutClassKills() >= 3 } ],
    technomancer: [TUT_CLASS_STEP,
        { id: "relay", title: "RESTORE ANOTHER RELAY", text: () => "REPAIR A BROKEN RELAY: STAND AT IT WITH A POWER CELL AND THE REPAIR STARTS BY ITSELF.",
            hint: () => "A POWERED ROOM CHARGES YOUR GAUNTLET; EACH RELAY ONLINE MAKES YOUR ARC STRONGER.",
            done: () => tutClassRelays() >= 1 || tutRelaysOnline() >= tutRelaysAll() },
        { id: "punch", title: "CHARGE YOUR GAUNTLET", stray: true, text: () => "PUNCH THE STRAY ANT: " + Math.min(3, tutCount("gauntlet")) + "/3. EVERY PUNCH THAT LANDS STORES A CHARGE.",
            hint: () => "TAP IT: YOUR GAUNTLET LOCKS ON. CLICK THE ROUND BUTTON TO PUNCH, OR HOLD IT.", done: () => tutCount("gauntlet") >= 3 },
        { id: "arc", title: "THROW THE ARC", stray: true, text: () => "STEP AWAY FROM IT AND THROW THE ARC: " + Math.min(2, tutCount("arc")) + "/2. OUT OF REACH, A CHARGE THROWS AN ELECTRIC ARC.",
            hint: () => "IT JUMPS TO CREATURES NEARBY. AN ARC ON A CREATURE REARING BACK (BITE) STOPS THE BITE.", done: () => tutCount("arc") >= 2 } ],
    mutator: [TUT_CLASS_STEP,
        { id: "clone", title: "GROW YOUR CLONE", text: () => "OPEN THE CLONE BAY (CLONES ON THE DOCK) AND GROW A CLONE FROM THE DNA YOUR KILLS DROPPED.",
            hint: () => "ONE AT A TIME, AND IT DOES NOT COME BACK BY ITSELF. NO DNA? KILLS DROP IT (THE ARENA).",
            done: () => tutCount("clone") >= 1 || (typeof mutatorClone === "function" && !!mutatorClone()) },
        { id: "upgrade", title: "UPGRADE YOUR CLONE", text: () => "WITH YOUR CLONE OUT, THE CLONE BAY SELLS ITS UPGRADES: BUY ONE.",
            hint: () => "ARMOR, SERRATED ARMS, POUNCE OR REACH, FOR ANY DNA. THEY ARE LOST IF IT FALLS.", done: () => tutCount("upgrade") >= 1 },
        { id: "lash", title: "FIGHT BESIDE IT", stray: true, text: () => "LASH THE STRAY ANT: " + Math.min(3, tutCount("lash")) + "/3. YOUR CLONE FIGHTS IT TOO.",
            hint: () => "TAP IT: YOUR LASH LOCKS ON. CLICK THE ROUND BUTTON TO STRIKE, OR HOLD IT.", done: () => tutCount("lash") >= 3 },
        { id: "serum", title: "SPLASH A SERUM", text: () => "TAKE A SERUM FROM THE SERUM HOOD (THE EXPERIMENT LAB) AND SPLASH IT: Q OR THE PILL.",
            hint: () => "ITS POOL HEALS ALLIES IN IT. THE HOOD MAKES ONE A MINUTE, OR CRAFTS ONE FOR DNA.", done: () => tutCount("serum") >= 1 } ],
};
function tutClassStage() { return typeof playerClassKey !== "undefined" && playerClassKey ? TUT_CLASS_STAGES[playerClassKey] || null : null; }
// the class's code says what the player did (counted only once the tutorial is over and a class is chosen)
function tutTally(key, n) { const S = _fp && _fp.tut && _fp.tut.script; if (!S || S.step < TUT_STEPS.length || typeof playerClassKey === "undefined" || !playerClassKey) return; S.tally = S.tally || {}; S.tally[key] = (S.tally[key] || 0) + (n || 1); }
function tutCount(key) { const S = _fp && _fp.tut && _fp.tut.script; return S && S.tally ? S.tally[key] || 0 : 0; }
function tutRelaysOnline() { const R = _fp && _fp.relays; return R ? Object.keys(R).filter(id => R[id] && R[id].online).length : 0; }
function tutRelaysAll() { return _fp && _fp.relays ? Object.keys(_fp.relays).length : 0; }
function tutClassKills() { const S = _fp.tut.script; return S.ck0 === undefined ? 0 : Math.max(0, lifetimeKills - S.ck0); }
function tutClassRelays() { const S = _fp.tut.script; return S.cr0 === undefined ? 0 : Math.max(0, tutRelaysOnline() - S.cr0); }
// the step that is up: S.cstep, and past any that are done (the plate asks this; the director moves S.cstep)
function tutClassCurrent() { const st = tutClassStage(), S = _fp && _fp.tut && _fp.tut.script; if (!st || !S) return -1; let i = S.cstep | 0; while (i < st.length && st[i].done()) i++; return i; }
// each frame once the tutorial is over and a class is chosen: the stage begins (its counts start), a step that is done is passed (and said), the training creature comes and goes
function tutClassTick() {
    const S = _fp.tut.script, st = tutClassStage(); if (!st || !S.doneAt) return;
    if (S.ck0 === undefined) { S.ck0 = lifetimeKills; S.cr0 = tutRelaysOnline(); S.tally = S.tally || {}; S.cstep = S.cstep | 0; }
    while (S.cstep < st.length && st[S.cstep].done()) { const d = st[S.cstep]; S.cstep++; _tutSay("c:" + playerClassKey + ":" + d.id, "◈ " + d.title + " — DONE" + (S.cstep < st.length ? "   NEXT: " + st[S.cstep].title : ""), classColour(playerClassKey)); }   // (said once for each class: classes switch)
    if (S.cstep >= st.length) _tutSay("c:" + playerClassKey + ":stage", "◈ " + className(playerClassKey) + " STAGE COMPLETE — YOUR CLASS IS YOURS", "#9dffb6");
    tutStrayTick(st[S.cstep] || null);
}
// SWITCHING CLASS (js/classes.js): the stage is the class's. The one you leave is put away as far as it got (the step, what it counted, and the kills and relays it has had, not when it began, so the
// time spent as another class does not count for it); the one you come to is taken out where it was, or begins when you first are it.
function tutClassStash(cls) {
    const S = _fp && _fp.tut && _fp.tut.script; if (!S || !cls) return;
    S.cstages = S.cstages || {};
    S.cstages[cls] = { cstep: S.cstep | 0, tally: S.tally || {}, kills: S.ck0 === undefined ? null : Math.max(0, lifetimeKills - S.ck0), relays: S.cr0 === undefined ? null : Math.max(0, tutRelaysOnline() - S.cr0) };
}
function tutClassResume(cls) {
    const S = _fp && _fp.tut && _fp.tut.script; if (!S) return;
    const r = S.cstages && S.cstages[cls];
    if (!r) { S.cstep = 0; S.tally = {}; S.ck0 = undefined; S.cr0 = undefined; return; }   // (its stage begins when it does: tutClassTick)
    S.cstep = Math.max(0, r.cstep | 0); S.tally = r.tally && typeof r.tally === "object" ? r.tally : {};
    S.ck0 = Number.isFinite(r.kills) ? lifetimeKills - r.kills : undefined; S.cr0 = Number.isFinite(r.relays) ? tutRelaysOnline() - r.relays : undefined;
}
// how far a class's stage has got: [done, of] (the picker's cards); the class you are is read live, another from what was put away
function tutClassProgress(cls) {
    const st = TUT_CLASS_STAGES[cls], S = _fp && _fp.tut && _fp.tut.script; if (!st || !S) return null;
    if (cls === playerClassKey) return [Math.min(st.length, Math.max(S.cstep | 0, tutClassCurrent())), st.length];
    const r = S.cstages && S.cstages[cls]; return [r ? Math.min(st.length, r.cstep | 0) : 0, st.length];
}
// the training creature, for a step that wants one: near the player in the room they are in (else the gun lesson's spot in the main hallway), up to TUT_STRAY.respawns times a step
function tutClassStray() { return actors.find(a => a && a.classStray && !a.dead) || null; }
function tutStrayTick(step) {
    const S = _fp.tut.script, s = tutClassStray();
    if (!step || !step.stray) { if (s) { s.dead = true; s._xpGiven = true; s.deathProcessed = true; } return; }   // (the lesson is over: the stray goes, and pays nothing)
    if (S.cstrayFor !== step.id) { S.cstrayFor = step.id; S.cstrays = 0; }
    if (s || S.cstrays >= TUT_STRAY.respawns) return;
    const spot = (typeof facilitySpotNear === "function" ? facilitySpotNear(player.visualX, player.visualY, TUT_STRAY.near[0], TUT_STRAY.near[1]) : null) || (typeof facilitySpotIn === "function" ? facilitySpotIn(TUT_GUN.room, player.visualX, player.visualY, TUT_GUN.near[0], TUT_GUN.near[1]) : null);
    if (!spot) return;
    let p = null; try { p = spawnCreature({ species: "ant", className: "scout", x: spot[0], y: spot[1], level: TUT_STRAY.level, state: "wander" }); } catch (e) { p = null; }
    if (!p) return;
    p.maxHealth = p.health = TUT_STRAY.health; if (p.dimensions) { p.dimensions.width = Math.round(p.dimensions.width * TUT_STRAY.size); p.dimensions.height = Math.round(p.dimensions.height * TUT_STRAY.size); }
    p.classStray = true; S.cstrays++; _tutSay("cstray:" + step.id + S.cstrays, "A BIG STRAY ANT WANDERS IN: YOUR TRAINING TARGET.", classColour(playerClassKey));
}

// THE GUN LESSON: a stray ant (level 3, plenty of health, grazing) is put in view; the objective is to shoot it three times with the player's own gun. The player is given the training rounds, and the ant is taken away when the lesson is done.
const TUT_GUN = { shots: 3, rounds: 8, level: 3, health: 400, respawns: 4, room: "lab_hallway", near: [6, 14], size: 2.2 };   // (it wanders in the main hallway, and is big: easy to see and to hit)
function tutStray() { return actors.find(a => a && a.tutStray && !a.dead) || null; }
function tutGunShots() { const S = _fp.tut.script; return Math.max(0, playerShotsFired - (S.gunBase === undefined ? playerShotsFired : S.gunBase)); }
function tutGunDone() { const S = _fp.tut.script; if (S.gunBase === undefined) { S.gunBase = playerShotsFired; S.strays = 0; } return tutGunShots() >= TUT_GUN.shots; }
function tutGunText() {
    const n = tutGunShots(), left = TUT_GUN.shots - n, st = tutStray();
    if (!st) return "A BIG STRAY ANT IS COMING INTO THE MAIN HALLWAY\u2026";
    return (playerAttackMode ? "YOUR GUN HAS TAKEN AIM. SHOOT THE STRAY ANT" : "GO CLOSE TO THE BIG STRAY ANT IN THE MAIN HALLWAY") + ": " + n + "/" + TUT_GUN.shots + " SHOTS.";
}
function tutGunTick() {
    const S = _fp.tut.script, st = TUT_STEPS[S.step];
    if (st && st.id === "gun") {
        if (S.gunBase === undefined) tutGunDone();
        if (playerAmmo < TUT_GUN.rounds) playerAmmo = TUT_GUN.rounds;   // (the training rounds)
        if (!tutStray() && S.strays < TUT_GUN.respawns) {
            const spot = typeof facilitySpotIn === "function" ? facilitySpotIn(TUT_GUN.room, player.visualX, player.visualY, TUT_GUN.near[0], TUT_GUN.near[1]) : null;
            if (spot) { let p = null; try { p = spawnCreature({ species: "ant", className: "scout", x: spot[0], y: spot[1], level: TUT_GUN.level, state: "wander" }); } catch (e) { p = null; }
                if (p) { p.maxHealth = p.health = TUT_GUN.health; if (p.dimensions) { p.dimensions.width = Math.round(p.dimensions.width * TUT_GUN.size); p.dimensions.height = Math.round(p.dimensions.height * TUT_GUN.size); } p.tutStray = true; S.strays++; _tutSay("stray" + S.strays, "A BIG STRAY ANT WANDERS INTO THE MAIN HALLWAY. THIS IS YOUR TARGET.", "#ffb347"); } }
        }
    } else if (S.gunBase !== undefined) { const s = tutStray(); if (s) { s.dead = true; s._xpGiven = true; } }   // (the lesson is over: the stray goes)
}
function tutTaken() { return _fp.items.filter(i => i.fp === "pickup" && i.taken).length; }
function tutHeld() { let n = 0; for (const f of followers) if (f && !f.dead && f.stance === "hold" && Math.hypot(f.x - crystal.x, f.y - crystal.y) <= TUT.holdRange) n++; return n; }
function tutAssaultText() {
    const A = _fp.tut.script.assault, now = frame;
    if (!A) return "";
    if (now < A.t0) return "ENEMIES INBOUND IN " + Math.ceil((A.t0 - now) / 60) + ". TAKE YOUR POSTS.";
    const alive = tutEnemies().length; return alive ? "ENEMIES: " + alive + " LEFT. DON'T LET THEM REACH THE CRYSTAL." : "THE WAVE IS DOWN. HOLD.";
}
function tutEnemies() { return actors.filter(a => a && a.tutAssault && !a.dead); }

// `loaded`: a saved game's followers are already here (js/facilityplay.js), and they are left as they were saved: the tutorial's progress is not back yet, so nothing says whether it is over
function facilityDirectorStart(loaded) {
    if (!_fp || !_fp.tut) return;
    _fp.tut.script = { step: 0, baseFollowers: followers.length, assault: null, doneAt: 0, said: {}, kills: 0, levelled: new Set(loaded ? followers : []) };
    tutLevelFollowers();
}
// the tutorial's followers come in at TUT.followerLevel (the first three, and each recruit as it arrives), for as long as the tutorial lasts
function tutLevelFollowers() {
    const S = _fp.tut.script; if (S.step >= TUT_STEPS.length) return;   // the tutorial is over (the objective plate's own test of it): nothing is lifted any more
    for (const f of followers) {
        if (!f || f.dead || !Number.isFinite(f.level) || S.levelled.has(f) || f.evolved) continue;
        S.levelled.add(f); if (f.level < TUT.followerLevel) { f.level = TUT.followerLevel; f.xp = xpForLevel(TUT.followerLevel); if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(f, true); }
    }
}
function tutAssaultStart() {
    const S = _fp.tut.script; S.assault = { t0: frame + TUT.countdown, wave: 0, over: false, tries: (S.assault ? S.assault.tries : 0) + 1, spawned: 0 };
}
function tutSpawnWave(w) {
    for (const [cls, x, y] of TUT.waves[w].who) {
        let p = null; try { p = spawnCreature({ species: "ant", className: cls, x, y, level: TUT.enemyLevel, state: "hunt" }); } catch (e) { p = null; }
        if (!p) continue;
        p.tutAssault = true; _fp.tut.script.assault.spawned++;
    }
}
// the assault's reward: XP to every living follower (js/levels.js gainXp; a follower that reaches the evolution level evolves in evolutionTick as it always does)
function tutReward() { for (const f of followers) if (f && !f.dead) gainXp(f, TUT.reward); }
function tutCallOff() { for (const a of tutEnemies()) { a.dead = true; a._xpGiven = true; } }
function _tutSay(key, text, col) { const S = _fp.tut.script; if (S.said[key]) return; S.said[key] = true; if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text, color: col || "#ffe733", life: 300, vy: -0.04, size: 14 }); }

// each frame
function facilityDirectorTick() {
    const S = _fp && _fp.tut && _fp.tut.script; if (!S) return;
    tutLevelFollowers(); tutGunTick();
    while (S.step < TUT_STEPS.length && TUT_STEPS[S.step].id !== "assault" && TUT_STEPS[S.step].done()) S.step++;
    const st = TUT_STEPS[S.step];
    if (st && st.id === "assault") {
        if (!S.assault) tutAssaultStart();
        const A = S.assault;
        if (!A.over) {
            if (frame >= A.t0 + (TUT.waves[A.wave] ? TUT.waves[A.wave].at : 0) && A.wave < TUT.waves.length && A.spawned === tutSpawnedBefore(A)) { tutSpawnWave(A.wave); A.wave++; _tutSay("wave" + A.wave, A.wave === 1 ? "⚠ THEY ARE COMING DOWN THE HALLWAY" : "⚠ A SECOND WAVE: STRIKERS", "#ff6a4a"); }
            const alive = tutEnemies().length;
            if (A.wave > 0 || alive) { alertActive = true; alertTimer = ALERT_DURATION; }
            const lastAt = A.t0 + TUT.waves[TUT.waves.length - 1].at;
            if (A.wave >= TUT.waves.length && (alive === 0 || frame > lastAt + TUT.stragglers)) { const routed = alive; tutCallOff(); A.over = true; alertActive = false; alertTimer = 0; tutReward(); _tutSay("won", routed ? "◈ THE REST FLED. THE ASSAULT IS BEATEN" : "◈ THE ASSAULT IS BEATEN", "#9dffb6"); }
            else if (crystal.maxHealth && crystal.health / crystal.maxHealth < TUT.mercy && alive) {
                tutCallOff(); crystal.health = Math.round(crystal.maxHealth * TUT.mend); alertActive = false; alertTimer = 0; S.assault = null; tutAssaultStart();
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text: "THE CRYSTAL HELD. THEY ARE REGROUPING.", color: "#ffb347", life: 240, vy: -0.05, size: 15 });
            }
        }
        if (A.over) S.step++;
    } else if (st && st.id === "evolve") { /* waits for an evolution */ }
    if (S.step >= TUT_STEPS.length && !S.doneAt) {   // the tutorial is finished: now, and only now, the classes are given
        S.doneAt = frame; _tutSay("complete", "◈ TUTORIAL COMPLETE", "#9dffb6");
        if (!playerClassKey && typeof classPickerOpenNow === "function" && !classPickerOpen) classPickerOpenNow();   // (the first choice: it cannot be closed, and it asks before it is made)
    }
    if (S.doneAt && playerClassKey) tutClassTick();   // then the class's own stage
}
// the number of enemies spawned before the wave that is due (waves spawn in order, once)
function tutSpawnedBefore(A) { let n = 0; for (let i = 0; i < A.wave; i++) n += TUT.waves[i].who.length; return n; }

// the objective plate: top left, under the NEW GAME chip. The tutorial's seven steps; then (once a class is chosen) the class's own; then a closing line.
// ON A PHONE it is a MAILBOX (ASKED: "in the mobile version [...] make it to where the recent task is in a little mailbox thing with a little exclamation point if there's a new objective"): the plate is folded away into a small envelope where it
// would be, with a gold "!" on it while the objective is one the player has not opened yet. A tap on the envelope unfolds the plate (the objective and its hint); a tap on the plate folds it away again; a new objective (or the closing line)
// puts the "!" back. A phone is a screen 700 px wide or less (the line js/mixtool.js mixToolWide draws, where the bottom-left tool is a chip and the menus a hub): the plate would cover a third of the picture. On anything else it is the plate, as it was, and takes no taps.
let _fpObjBottom = 0;   // where the objective plate ends on screen (0: not drawn): the enemy index card (js/targeting.js) goes under it
const OBJ_BOX = { w: 54, h: 46, fold: 0.16, shake: 50 };   // the mailbox's size; how much of the unfolding each drawn frame does; how long (frames) it rattles when a new objective comes
const _objHit = { x: 0, y: 0, w: 0, h: 0 };                // where a tap is the objective's now (w 0: nowhere)
const _objBox = { x: 0, y: 0, w: 0, h: 0 };                // where the plate is drawn now (the tests read it: the corners layout puts it under the network panel at the top right)
let _objPressed = false;                                   // the press began on it (js/input.js)
function objectiveCompact() { return typeof innerWidth === "number" && innerWidth <= 700; }
function _objOn(ex, ey) { const r = _objHit; return r.w > 0 && ex >= r.x && ex <= r.x + r.w && ey >= r.y && ey <= r.y + r.h; }
function objectivePress(ex, ey) { if (!_objOn(ex, ey)) return false; _objPressed = true; return true; }
function objectiveRelease(ex, ey) { if (_objOn(ex, ey)) objectiveToggle(); }
function objectiveToggle(open) { const S = _fp && _fp.tut && _fp.tut.script; if (S) S.objOpen = open === undefined ? !S.objOpen : !!open; }
// is there an objective the player has not opened (a phone's mailbox shows "!")?
function objectiveUnread() { const S = _fp && _fp.tut && _fp.tut.script; return !!S && objectiveCompact() && !!S.objKey && S.objSeen !== S.objKey; }
// a small envelope centred on (cx, cy), rattling by `tilt` radians
function _objEnvelope(cx, cy, col, tilt, fresh) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.lineJoin = "round"; ctx.lineWidth = 2; ctx.strokeStyle = col;
    ctx.fillStyle = fresh ? "rgba(255,231,51,0.2)" : "rgba(255,255,255,0.07)"; ctx.fillRect(-13, -9, 26, 18); ctx.strokeRect(-13, -9, 26, 18);   // the paper
    ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(0, 2); ctx.lineTo(12, -8); ctx.stroke();                                                      // the flap
    ctx.restore();
}
// the gold "!" a new objective puts on the mailbox, breathing
function _objBang(bx, by, f) {
    const k = 1 + 0.12 * Math.sin(f * 0.12), r = 10 * k;
    ctx.save(); ctx.fillStyle = "rgba(255,231,51,0.22)"; ctx.beginPath(); ctx.arc(bx, by, r + 5, 0, 6.2832); ctx.fill();   // (the glow is a second, wider, fainter disc: this game uses no shadowBlur)
    ctx.fillStyle = UI_GOLD; ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.2832); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = UI_INK; ctx.stroke();
    ctx.fillStyle = UI_INK; ctx.font = "bold " + Math.round(14 * k) + "px " + UI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", bx, by + 1); ctx.restore();
}
function facilityDrawObjective() {
    _fpObjBottom = 0; _objHit.w = 0; _objBox.w = 0;
    const S = _fp && _fp.tut && _fp.tut.script; if (!S || typeof uiSlab !== "function" || (typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof invPanelOpen !== "undefined" && invPanelOpen)) return;
    // THE CORNERS (js/party.js hudCorners; a tablet or a desktop): the plate is the place's, under the network panel at the top right (the room tag, the network, the objective: what is going on where you are); elsewhere it is top left, under the FACILITY · EXIT tab
    const W = canvas.width, tutDone = S.step >= TUT_STEPS.length, pc = playerClass(), corner = typeof hudCorners === "function" && hudCorners(), zr = corner && typeof _netZoneRect === "function" ? _netZoneRect() : null, f = typeof frame !== "undefined" ? frame : 0;
    const w = Math.min(W - 24, corner ? 304 : 350), x = corner ? Math.max(12, Math.round((zr ? zr.right : W - 18) - w)) : 12, y = corner ? (typeof _fnBottom === "number" && _fnBottom > 0 ? _fnBottom + 10 : (zr ? Math.round(zr.bottom) + 140 : 190)) : 158;
    let key, title, body, hint = "", col = pc ? pc.colour : UI_TEAL;
    if (!tutDone) { const st = TUT_STEPS[S.step]; key = "t" + S.step; title = "OBJECTIVE " + (S.step + 1) + "/" + TUT_STEPS.length + "  ·  " + st.title; body = st.text(); hint = st.hint(); }
    else if (!pc) return;
    else if (tutClassCurrent() >= 0 && tutClassCurrent() < tutClassStage().length) { const st = tutClassStage(), i = tutClassCurrent(), c = st[i]; key = c.id === "perk" ? "perk" : "c:" + c.id; title = pc.name + "  ·  " + (i + 1) + "/" + st.length + "  ·  " + c.title; body = c.text(); hint = c.hint(); }   // the class's stage
    else { key = "done"; title = pc.name + "  ·  RANK " + classRank(); body = "YOU RESTORED POWER, RAISED AN ARMY AND HELD THE CRYSTAL. YOUR CLASS IS YOURS."; col = "#9dffb6"; }
    const mail = objectiveCompact(), chars = Math.max(18, Math.floor((w - 28) / 8)), lines = uiWrap(body, chars).slice(0, 3), hl = hint ? uiWrap(hint, chars).slice(0, 3) : [], h = 44 + lines.length * 17 + (hl.length ? hl.length * 15 + 8 : 0);
    // a phone: the plate is folded into the mailbox until it is opened, and unfolds out of it (S.objK: 0 folded .. 1 open); an objective that is open is read
    if (S.objKey !== key) { S.objKey = key; S.objNewAt = f; }
    if (mail) { if (S.objOpen) S.objSeen = key; S.objK = Math.max(0, Math.min(1, (S.objK || 0) + (S.objOpen ? OBJ_BOX.fold : -OBJ_BOX.fold))); } else S.objK = 1;
    const k = S.objK, e = k * k * (3 - 2 * k), pw = mail ? OBJ_BOX.w + (w - OBJ_BOX.w) * e : w, ph = mail ? OBJ_BOX.h + (h - OBJ_BOX.h) * e : h, unread = mail && S.objSeen !== key;
    _fpObjBottom = y + ph; _objBox.x = x; _objBox.y = y; _objBox.w = pw; _objBox.h = ph;
    if (mail) { _objHit.x = x - 4; _objHit.y = y - 4; _objHit.w = pw + 8; _objHit.h = ph + 8; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); uiSlab(x, y, pw, ph, col, false, "#0b1226");
    if (mail && e < 1) {   // the mailbox: an envelope (it rattles when a new objective has just come), and the "!" while it is not read
        const age = f - (S.objNewAt || 0), tilt = unread && age >= 0 && age < OBJ_BOX.shake ? Math.sin(age * 0.9) * 0.22 * (1 - age / OBJ_BOX.shake) : 0;
        ctx.globalAlpha = 1 - e; _objEnvelope(x + pw / 2, y + ph / 2 + 1, col, tilt, unread); ctx.globalAlpha = 1;
        if (unread) _objBang(x + pw - 4, y + 5, f);
    }
    if (!mail || e > 0.04) {   // the plate's writing (as it unfolds the slab uncovers it)
        if (mail && e < 1) { ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip(); }
        uiTextFit(title, x + 16, y + 20, 15, col, "left", w - 30 - (mail ? 24 : 0));
        let yy = y + 42; for (const l of lines) { uiCaptionFit(l, x + 16, yy, "#e8f0ff", "left", 12, w - 28); yy += 17; }
        if (hl.length) { yy += 4; for (const l of hl) { uiCaptionFit(l, x + 16, yy, "#8aa0c8", "left", 11, w - 28); yy += 15; } }
        if (mail) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + w - 36, y + 25); ctx.lineTo(x + w - 20, y + 25); ctx.lineTo(x + w - 28, y + 15); ctx.closePath(); ctx.fill(); }   // (the little arrow that says a tap folds it away)
    }
    ctx.restore();
}
