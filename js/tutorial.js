// ─────────────────────────────────────────────────────────
//  THE TUTORIAL DIRECTOR — what to do, in order, and the first assault (docs/TUTORIAL.md, phase 6)
// ─────────────────────────────────────────────────────────
// A short list of objectives (TUT_STEPS) that teaches the loop the earlier phases built, WITHOUT CLASSES: find supplies in the dark, restore a relay (with the relay kit and two power cells: anyone can), RECRUIT a follower, POSITION
// followers, then DEFEND THE CRYSTAL against a first assault, in which followers fight, gain levels and EVOLVE. Only when that is finished are the classes given: the class picker opens, and once a class is chosen the cases for that
// class enter the facility (facilityClassItemsEnter) and a last objective sends the player to the class's station for its perk. A step is done when its `done()` says so (a step already done when it comes up is skipped). Nothing here is a new system:
//   recruiting is recruitFollower (js/clone.js), positioning is the roster's HOLD (a.stance, js/commandcenter.js), levels and evolution are gainXp and evolutionTick (js/levels.js, js/evolution.js), the enemies are the
//   strip game's ants (spawnPredatorForZone), and they hunt the Crystal as they always do when an alarm is up. The director only sets levels, spawns the assault and keeps the alarm on while it lasts.
// Levels: the tutorial's followers (the three you start with and every recruit) are level TUT.followerLevel, and the assault's enemies are level TUT.enemyLevel, a little behind, so the assault is enough to take a follower to the evolution level.
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

// AFTER the tutorial, once a class is chosen: the class's own objective (earn its perk at its station). Classes are given only when the tutorial is finished.
const TUT_CLASS_STEP = { id: "perk", title: "GET YOUR GEAR", text: () => ({ gunslinger: "FIND THE MACHINE GUN: THE WEAPON LOCKER IN THE ARMORY (THE ARENA'S WEST DOOR, OR THE STAIRS FROM THE OBSERVATION DECK).", technomancer: "BUILD THE SPIDER MECH AT THE MECH BAY IN THE SHOW ROOM.", mutator: "WALK THROUGH TELEPORT ROOM 1 AND DOWN THE PASSAGE INTO THE EXPERIMENT LAB." }[playerClassKey] || ""),
    hint: () => ({ gunslinger: "WALK UP TO THE GLOWING LOCKER AND PRESS E (OR TAP IT). THE GUN IS BIG: YOU STAND TALL ON YOUR TENTACLES TO HOLD IT.", technomancer: "COLLECT 4 MECH LEGS (TELEPORT ROOM 1) AND THE CORE (SHOW ROOM), THEN STAND AT THE PAD AND PRESS E.", mutator: "THE LAB COAT AND SAFETY GOGGLES GO ON BY THEMSELVES WHEN YOU WALK IN, AND YOU KEEP THEM." }[playerClassKey] || ""), done: () => !!CLASS_SIGNATURE[playerClassKey] && classHas(CLASS_SIGNATURE[playerClassKey]) };

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
            if (spot) { let p = null; try { p = spawnPredatorForZone(1, { species: "ant", className: "scout" }); } catch (e) { p = null; }
                if (p) { p.x = spot[0]; p.y = spot[1]; p.level = TUT_GUN.level; if (typeof _applyPredLevel === "function") _applyPredLevel(p, true); p.maxHealth = p.health = TUT_GUN.health; if (p.dimensions) { p.dimensions.width = Math.round(p.dimensions.width * TUT_GUN.size); p.dimensions.height = Math.round(p.dimensions.height * TUT_GUN.size); } p.state = "wander"; p.tutStray = true; S.strays++; _tutSay("stray" + S.strays, "A BIG STRAY ANT WANDERS INTO THE MAIN HALLWAY. THIS IS YOUR TARGET.", "#ffb347"); } }
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

function facilityDirectorStart() {
    if (!_fp || !_fp.tut) return;
    _fp.tut.script = { step: 0, baseFollowers: followers.length, assault: null, doneAt: 0, said: {}, kills: 0, levelled: new Set() };
    tutLevelFollowers();
}
// the tutorial's followers come in at TUT.followerLevel (the first three, and each recruit as it arrives)
function tutLevelFollowers() {
    const S = _fp.tut.script;
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
        let p = null; try { p = spawnPredatorForZone(1, { species: "ant", className: cls }); } catch (e) { p = null; }
        if (!p) continue;
        p.x = x; p.y = y; p.level = TUT.enemyLevel; if (typeof _applyPredLevel === "function") _applyPredLevel(p, true);
        p.state = "hunt"; p.tutAssault = true; p.isWanderer = false; _fp.tut.script.assault.spawned++;
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
            for (const a of tutEnemies()) if (a.state === "retreat") { a.state = "hunt"; a.isRetreating = false; }   // (they press on: a wounded one that crept off would never end the assault)
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
        if (!playerClassKey && typeof classPickerOpen !== "undefined") classPickerOpen = true;
    }
}
// the number of enemies spawned before the wave that is due (waves spawn in order, once)
function tutSpawnedBefore(A) { let n = 0; for (let i = 0; i < A.wave; i++) n += TUT.waves[i].who.length; return n; }

// the objective plate: top left, under the FACILITY · EXIT tab. The tutorial's seven steps; then (once a class is chosen) the class's own; then a closing line.
let _fpObjBottom = 0;   // where the objective plate ends on screen (0: not drawn): the enemy index card (js/targeting.js) goes under it
function facilityDrawObjective() {
    _fpObjBottom = 0;
    const S = _fp && _fp.tut && _fp.tut.script; if (!S || typeof uiSlab !== "function" || (typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof invPanelOpen !== "undefined" && invPanelOpen)) return;
    const W = canvas.width, tutDone = S.step >= TUT_STEPS.length, pc = playerClass(), w = Math.min(W - 24, 350), x = 12, y = 158;
    let title, body, hint = "", col = pc ? pc.colour : UI_TEAL;
    if (!tutDone) { const st = TUT_STEPS[S.step]; title = "OBJECTIVE " + (S.step + 1) + "/" + TUT_STEPS.length + "  ·  " + st.title; body = st.text(); hint = st.hint(); }
    else if (!pc) return;
    else if (!TUT_CLASS_STEP.done()) { title = pc.name + "  ·  " + TUT_CLASS_STEP.title; body = TUT_CLASS_STEP.text(); hint = TUT_CLASS_STEP.hint(); }
    else { title = pc.name + "  ·  RANK " + classRank(); body = "YOU RESTORED POWER, RAISED AN ARMY AND HELD THE CRYSTAL. YOUR CLASS IS YOURS."; col = "#9dffb6"; }
    const chars = Math.max(18, Math.floor((w - 28) / 8)), lines = codexWrap(body, chars).slice(0, 3), hl = hint ? codexWrap(hint, chars).slice(0, 3) : [], h = 44 + lines.length * 17 + (hl.length ? hl.length * 15 + 8 : 0);
    _fpObjBottom = y + h;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); uiSlab(x, y, w, h, col, false, "#0b1226");
    uiTextFit(title, x + 16, y + 20, 15, col, "left", w - 30);
    let yy = y + 42; for (const l of lines) { uiCaptionFit(l, x + 16, yy, "#e8f0ff", "left", 12, w - 28); yy += 17; }
    if (hl.length) { yy += 4; for (const l of hl) { uiCaptionFit(l, x + 16, yy, "#8aa0c8", "left", 11, w - 28); yy += 15; } }
    ctx.restore();
}
