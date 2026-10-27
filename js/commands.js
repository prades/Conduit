// ─────────────────────────────────────────────────────────
//  THE LONG-PRESS RING'S ORDERS, AND THE INFO PANEL
// ─────────────────────────────────────────────────────────
// A press and hold opens a ring (js/input.js handleLongHold; js/draw.js drawRadialMenu draws it and sets selectedRadialAction as the finger crosses a button), and executeCommand does the thing when the press
// ends. On a FOLLOWER or a CLONE: ROSTER CARD (the Command Center with its card in view, js/commandcenter.js ccShowUnit) and RE-ROLL (made again at the Crystal, js/helpers.js startFollowerReroll); on a
// CREATURE: ATTACK / STOW (the gun, js/gunfire.js) and INFO; on the ground: POSITION (the command pool holds that tile) and INFO (the INFO panel on the tile, js/infodex.js).

// POSITION: the command pool (js/helpers.js getCommandPool) holds the tile
function issueMoveCommand(tile) {
    getCommandPool().forEach(a => { a.job={ type:"move", target:tile }; a.stance="hold"; });
}

// ── INFO PANEL (js/infodex.js draws it) ──
function openInfoPanel(targetTile, subject) {
    infoPanelTarget = targetTile;
    infoPanelSubject = subject || null;   // the follower or enemy that was pressed
    infoPanelOpen   = true;
    infoPanelPage   = null;      // always open on the target readout
}
function closeInfoPanel() {
    infoPanelOpen   = false;
    infoPanelTarget = null;
    infoPanelPage   = null;
    infoPanelSubject = null;
}

// ── COMMAND EXECUTION ─────────────────────────────────────
// Cycle the role of every follower in the command pool: brawler → mage ("sniper") → technician ("camper"). An evolved follower's role is its
// form's (js/evolution.js): it is skipped. The phone menu's SWITCH ROLES and the roster's squad orders use it. Returns how many it changed.
function cycleCommandPoolRoles() {
    const roles=["brawler","sniper","camper"];
    const pool=getCommandPool().filter(a=>!a.dead);
    let n=0;
    pool.forEach(f=>{ if (f.evolved) return; const i=roles.indexOf(f.role); f.role=roles[(i+1)%roles.length]; n++; });
    if (pool.length>0)
        floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,
            text:"→ "+roleLabel((pool.find(f=>!f.evolved)||pool[0]).role),color:"#0f8",life:90,vy:-0.2});
    return n;
}
function executeCommand() {
    commandMode=false; commandPendingTap=false;
    if (!selectedRadialAction) return;
    if (selectedRadialAction==="noop") { selectedRadialAction=null; return; }
    // a unit's order needs no tile under the press: a follower or a creature can be pressed where there is none
    const isUnitCmd = selectedRadialAction==="roster_card" || selectedRadialAction==="reroll_follower" || selectedRadialAction==="attack_mode" || selectedRadialAction==="stow_weapon"
                      || (selectedRadialAction==="info" && (commandEnemyTarget||commandFollowerTarget)) || /_body$/.test(selectedRadialAction);   // (a body's orders need no tile)
    if (!commandTarget && !isUnitCmd) { commandMode=false; selectedRadialAction=null; return; }

    switch(selectedRadialAction) {
        // ── DOWN, on the ground: POSITION ──
        case "position": {
            if (commandTarget) issueMoveCommand(commandTarget);
            break;
        }
        // ── RIGHT: INFO ──
        case "info": {
            openInfoPanel(commandTarget, { follower: commandFollowerTarget, enemy: commandEnemyTarget });
            break;
        }
        // ── RIGHT on your follower or clone: its card in the roster (its INFO tab is on the card) ──
        case "roster_card": {
            if (commandFollowerTarget && typeof ccShowUnit === "function") ccShowUnit(commandFollowerTarget);
            break;
        }
        // ── ARM / STOW ──
        case "attack_mode": {
            setPlayerAttackMode(true);
            // Fire straight away at whatever was long-pressed, so arming is one
            // gesture rather than two, and lock on to it: click it as often as you like, or hold (js/gunfire.js).
            if (commandEnemyTarget && !commandEnemyTarget.dead) { if (typeof gunLock === "function") gunLock(commandEnemyTarget); firePlayerShot(commandEnemyTarget); }
            break;
        }
        case "stow_weapon": {
            setPlayerAttackMode(false);
            break;
        }
        case "reroll_follower": {
            if (commandFollowerTarget) startFollowerReroll(commandFollowerTarget);
            break;
        }
        // ── A FALLEN CLONE'S BODY (js/mutator.js): UP = SALVAGE DNA; any other body order goes to the body's handler ──
        case "salvage_body": {
            if (commandBodyTarget && typeof cloneSalvage === "function") cloneSalvage(commandBodyTarget);
            break;
        }
        default: {
            if (/_body$/.test(selectedRadialAction) && commandBodyTarget && typeof cloneBodyAct === "function") cloneBodyAct(commandBodyTarget, selectedRadialAction.replace(/_body$/, ""));
            break;
        }
    }
    commandBodyTarget = null;
    commandMode=false; commandTarget=null;
}
