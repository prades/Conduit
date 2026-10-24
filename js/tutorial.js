// ─────────────────────────────────────────────────────────
//  THE TUTORIAL DIRECTOR — what to do, in order, and the first assault (docs/TUTORIAL.md, phase 6)
// ─────────────────────────────────────────────────────────
// A short list of objectives (TUT_STEPS) that teaches the loop the earlier phases built: find supplies in the dark, earn your class's perk at its station, restore a relay, RECRUIT a follower, POSITION followers, then DEFEND THE
// CRYSTAL against a first assault, in which followers fight, gain levels and EVOLVE. A step is done when its `done()` says so (a step that is already done when it comes up is skipped). Nothing here is a new system:
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
        hint: () => ({ gunslinger: "YOUR GEAR IS IN THE ARMORY (UNDER THE DECK) AND THE SECURITY ROOM.", technomancer: "CELLS ARE IN THE LABS AND TELEPORT ROOM 1.", mutator: "SAMPLES ARE IN THE LAB, AND ONE BY THE CRYSTAL." }[playerClassKey] || ""), done: () => tutTaken() >= 2 },
    { id: "station", title: "EARN YOUR PERK", text: () => ({ gunslinger: "USE THE WEAPON LOCKER IN THE ARMORY.", technomancer: "USE THE TUNING CONSOLE IN TELEPORT ROOM 1.", mutator: "TAKE A SAMPLE TO THE SEQUENCER IN THE LAB." }[playerClassKey] || "CHOOSE A CLASS."),
        hint: () => "WALK UP TO THE GLOWING STATION AND PRESS E (OR TAP IT).", done: () => classRank() > 1 },
    { id: "relay", title: "RESTORE THE RELAY", text: () => "REPAIR THE CRYSTAL CHAMBER'S RELAY (ITS NORTH-EAST CORNER).",
        hint: () => playerClassKey === "technomancer" ? "YOU REPAIR IT BY YOURSELF: STAND AT IT WITH A POWER CELL." : "YOU NEED THE RELAY KIT (A CASE IN THE CHAMBER) AND 2 POWER CELLS. TAP THE RELAY.", done: () => relayOnline("relay_chamber") },
    { id: "recruit", title: "RECRUIT A FOLLOWER", text: () => "OPEN THE ROSTER (BOTTOM BAR) AND PRESS + RECRUIT: 30 SHARDS.",
        hint: () => "A RECRUIT ARRIVES AT THE CRYSTAL AND FOLLOWS YOU.", done: () => followers.filter(f => f && !f.dead).length > _fp.tut.script.baseFollowers },
    { id: "position", title: "POST YOUR FOLLOWERS", text: () => "POST TWO FOLLOWERS NEAR THE CRYSTAL: SELECT THEM AND PRESS HOLD.",
        hint: () => "HOLD STANDS A FOLLOWER WHERE IT IS. COME CALLS IT BACK. THEY FIGHT ANYTHING THAT COMES.", done: () => tutHeld() >= TUT.holdNeeded },
    { id: "assault", title: "DEFEND THE CRYSTAL", text: () => tutAssaultText(), hint: () => "FOLLOWERS FIGHT AND GAIN LEVELS. AT LEVEL 10 A FOLLOWER EVOLVES. THE SENTRIES HELP IF THEIR RELAY IS ON.", done: () => !!_fp.tut.script.assault && _fp.tut.script.assault.over },
    { id: "evolve", title: "EVOLVE A FOLLOWER", text: () => "A FOLLOWER EVOLVES AT LEVEL " + EVOLVE_LEVEL + ".", hint: () => ({ mutator: "FEED IT MUTAGEN SAMPLES FROM YOUR PACK.", gunslinger: "KEEP IT FIGHTING.", technomancer: "KEEP IT FIGHTING." }[playerClassKey] || ""), done: () => followers.some(f => f && f.evolved) },
];

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
    const S = _fp && _fp.tut && _fp.tut.script; if (!S || !playerClassKey) return;
    tutLevelFollowers();
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
    if (S.step >= TUT_STEPS.length && !S.doneAt) { S.doneAt = frame; _tutSay("complete", "◈ TUTORIAL COMPLETE", "#9dffb6"); }
}
// the number of enemies spawned before the wave that is due (waves spawn in order, once)
function tutSpawnedBefore(A) { let n = 0; for (let i = 0; i < A.wave; i++) n += TUT.waves[i].who.length; return n; }

// the objective plate: top left, under the FACILITY · EXIT tab
function facilityDrawObjective() {
    const S = _fp && _fp.tut && _fp.tut.script; if (!S || !playerClassKey || typeof uiSlab !== "function" || (typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof invPanelOpen !== "undefined" && invPanelOpen)) return;
    const W = canvas.width, done = S.step >= TUT_STEPS.length, st = TUT_STEPS[Math.min(S.step, TUT_STEPS.length - 1)], w = Math.min(W - 24, 350), x = 12, y = 158, col = done ? "#9dffb6" : playerClass().colour;
    const body = done ? "YOU RESTORED POWER, RAISED AN ARMY AND HELD THE CRYSTAL." : st.text(), hint = done ? "" : st.hint(), chars = Math.max(18, Math.floor((w - 28) / 8)), lines = codexWrap(body, chars).slice(0, 3), hl = hint ? codexWrap(hint, chars).slice(0, 3) : [];
    const h = 44 + lines.length * 17 + (hl.length ? hl.length * 15 + 8 : 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); uiSlab(x, y, w, h, col, false, "#0b1226");
    uiTextFit(done ? "TUTORIAL COMPLETE" : "OBJECTIVE " + (S.step + 1) + "/" + TUT_STEPS.length + "  ·  " + st.title, x + 16, y + 20, 15, col, "left", w - 30);
    let yy = y + 42; for (const l of lines) { uiCaptionFit(l, x + 16, yy, "#e8f0ff", "left", 12, w - 28); yy += 17; }
    if (hl.length) { yy += 4; for (const l of hl) { uiCaptionFit(l, x + 16, yy, "#8aa0c8", "left", 11, w - 28); yy += 15; } }
    ctx.restore();
}
