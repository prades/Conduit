// ─────────────────────────────────────────────────────────
//  THE ALARM, AND THE END (the facility; docs/TUTORIAL.md, "The arena's creatures", "The first assault")
// ─────────────────────────────────────────────────────────
// An ALARM is the state of a fight: while one is up the arena's creatures hunt instead of pottering about (js/facilityspawn.js, js/predator.js), the triangle at the top right shows (body.alarm-on, js/hudgems.js), and the
// tutorial's assault keeps it up until the assault is over (js/tutorial.js). alertActive, alertTimer, alertType and alertSource are its state (js/config.js); ALERT_DURATION is how long one lasts when nothing feeds it.
// THE END: the Crystal destroyed is the game over (showGameOver): the overlay says so, with the crystals you had, and NEW GAME starts the facility again (js/facilitysave.js facilityNewGame).
const ALARM_LABELS = { proximity: "PROXIMITY ALARM", facility: "FACILITY BREACH", assault: "ASSAULT" };
function alarmLabel(type) { return ALARM_LABELS[type] || "INTRUDER ALERT"; }
// raise the alarm at (sx, sy): the creatures within reach of it hunt (a "facility" alarm: every creature there is)
function triggerAlarm(type, sx, sy) {
    alertActive = true; alertTimer = ALERT_DURATION; alertType = type; alertSource = { x: sx, y: sy };
    for (const a of actors) {
        if (!(a instanceof Predator) || a.dead || a.team === "green") continue;
        if (type === "facility" || Math.hypot(a.x - sx, a.y - sy) < 6) { a.state = "hunt"; a.provoked = true; }
    }
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "⚠ " + alarmLabel(type) + " ⚠", color: "#ff2200", life: 180, vy: -0.25, size: 16 });
}
// the alarm is over: a creature nobody is fighting goes back to its round
function clearAlarm() {
    alertActive = false; alertType = null; alertSource = null;
    for (const a of actors) { if (!(a instanceof Predator) || a.dead || a.team === "green") continue; a.provoked = false; a.lastAttacker = null; a.state = "wander"; }
}
// the Crystal is destroyed: the game is over (the overlay, with the crystals you had; NEW GAME begins the facility again)
function showGameOver() {
    gameState.running = false;
    if (typeof document === "undefined") return;
    const overlay = document.getElementById("overlay"); if (!overlay) return;
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("ovr-title", "CRYSTAL DESTROYED"); const t = document.getElementById("ovr-title"); if (t) t.style.color = "#f22";
    set("ovr-sub", "The facility has gone dark."); set("ovr-shards", String(shardCount)); set("ovr-btn", "NEW GAME");
    const b = document.getElementById("ovr-btn"); if (b) b.onclick = () => { if (typeof facilityNewGame === "function") facilityNewGame(); };
    overlay.classList.add("active");
}
