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
    { id: "evolve", title: "EVOLVE A FOLLOWER", text: () => "A FOLLOWER EVOLVES AT LEVEL " + EVOLVE_LEVEL + ".", hint: () => "KEEP IT FIGHTING. THE BAR UNDER ITS HEALTH IS ITS XP.", done: () => followers.some(f => f && f.evolved) },
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
    const cur = st[S.cstep]; if (cur) _tutSay("cstep:" + playerClassKey + ":" + cur.id, [cur.text(), cur.hint()]);   // the Crystal gives the step as it comes up (its words, then its hint)
    tutStrayTick(cur || null);
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
// the Crystal says a thing once (S.said is saved: a loaded game is not told again), through the dialogue box (js/dialogue.js): a step's words as one page and its hint as the next. (col was the floating text's colour; the box is the Crystal's.)
function _tutSay(key, text, col) { const S = _fp.tut.script; if (S.said[key]) return false; S.said[key] = true; if (typeof dialogueSay === "function") dialogueSay("crystal", text, { key: "tut:" + key }); return true; }
// true the first time only, for a thing said or shown once a game (the quest line's notes keep their record here too: js/quests.js)
function tutSaidOnce(key) { const S = _fp && _fp.tut && _fp.tut.script; if (!S) return false; S.said = S.said || {}; if (S.said[key]) return false; S.said[key] = true; return true; }

// each frame
function facilityDirectorTick() {
    const S = _fp && _fp.tut && _fp.tut.script; if (!S) return;
    tutLevelFollowers(); tutGunTick();
    while (S.step < TUT_STEPS.length && TUT_STEPS[S.step].id !== "assault" && TUT_STEPS[S.step].done()) S.step++;
    const st = TUT_STEPS[S.step];
    if (st && !(S.step === 0 && _fp.tut.blackout && !_fp.tut.said)) _tutSay("step:" + st.id, [st.text(), st.hint()]);   // the Crystal gives the step as it comes up (the first one after its blackout words: js/facilitytutorial.js)
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
                if (typeof dialogueSay === "function") dialogueSay("crystal", "THE CRYSTAL HELD. THEY ARE REGROUPING.");
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

// THE OBJECTIVE, KEPT BUT NOT DRAWN (the owner, 2026-11-01: "still have the objective thing, but hide it. Make a little quest box on the menu"): the tutorial's seven steps; then (once a class is chosen) the class's own; then
// a closing line; a quest under way (js/quests.js) between the tutorial and the class's stage. objectiveCurrent says which it is now ({ key, title, body, hint, col }); the QUEST BOX shows it (js/questbox.js: QUESTS on the dock,
// a round button on a phone), and the Crystal says each as it comes up (facilityDirectorTick, through js/dialogue.js). The plate it used to be (top left; under the network panel in THE CORNERS; a mailbox on a phone, 2026-10)
// is gone: facilityDrawObjective keeps its name (js/facilitytutorial.js calls it each frame) and keeps only the record: which objective is up (S.objKey, S.objNewAt) and whether it has been opened (S.objSeen: the quest box
// reads it; the "!" on the QUESTS button while it has not been). Nothing of this is saved: a loaded game's objective is new again.
let _fpObjBottom = 0;   // where the objective plate ended on screen; 0 now that it is not drawn (the round button, js/targeting.js, keeps its old default under it)
function objectiveCurrent() {
    const S = _fp && _fp.tut && _fp.tut.script; if (!S) return null;
    const tutDone = S.step >= TUT_STEPS.length, pc = playerClass(), col = pc ? pc.colour : UI_TEAL;
    const q = tutDone && typeof questObjective === "function" ? questObjective() : null;   // a quest under way (the Sewer purification, js/quests.js): after the tutorial, before the class's stage
    if (!tutDone) { const st = TUT_STEPS[S.step]; return { key: "t" + S.step, title: "OBJECTIVE " + (S.step + 1) + "/" + TUT_STEPS.length + "  ·  " + st.title, body: st.text(), hint: st.hint(), col }; }
    if (q) return { key: "q:" + q.key, title: q.title, body: q.body, hint: q.hint || "", col: q.col || col };
    if (!pc) return null;
    if (tutClassCurrent() >= 0 && tutClassCurrent() < tutClassStage().length) { const st = tutClassStage(), i = tutClassCurrent(), c = st[i]; return { key: c.id === "perk" ? "perk" : "c:" + c.id, title: pc.name + "  ·  " + (i + 1) + "/" + st.length + "  ·  " + c.title, body: c.text(), hint: c.hint(), col }; }   // the class's stage
    return { key: "done", title: pc.name + "  ·  RANK " + classRank(), body: "YOU RESTORED POWER, RAISED AN ARMY AND HELD THE CRYSTAL. YOUR CLASS IS YOURS.", hint: "", col: "#9dffb6" };
}
// is the objective one the player has not opened the quest box on? (the "!" on the QUESTS button: js/questbox.js)
function objectiveUnread() { const S = _fp && _fp.tut && _fp.tut.script; return !!S && !!S.objKey && S.objSeen !== S.objKey; }
// each frame (js/facilitytutorial.js facilityDrawOverlay): the record only; nothing is drawn
function facilityDrawObjective() {
    _fpObjBottom = 0;
    const S = _fp && _fp.tut && _fp.tut.script; if (!S) return;
    const o = objectiveCurrent(); if (!o) return;
    if (S.objKey !== o.key) { S.objKey = o.key; S.objNewAt = typeof frame !== "undefined" ? frame : 0; }
}
