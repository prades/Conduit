// ─────────────────────────────────────────────────────────
//  TRAP SYSTEM  (Feature 2)
//  Placeable circuit-board traps in BUILD mode.
//  Rendered as subtle PCB markings until triggered.
// ─────────────────────────────────────────────────────────

const TRAP_DEFS = [
    { id: "emp_mine",        label: "EMP Mine",          cost: 15, color: "#ffee33",
      desc:  "2-tile stun radius (3s), electric burst",
      trigger: "proximity", range: 1.5, oneUse: true },
    { id: "cap_overload",    label: "Cap. Overload",     cost: 20, color: "#ff8800",
      desc:  "Builds charge each enemy pass; fires at full",
      trigger: "charge",    range: 1.2, oneUse: false },
    { id: "signal_jammer",   label: "Signal Jammer",     cost: 25, color: "#9933ff",
      desc:  "Permanent disorient aura (2-tile radius)",
      trigger: "aura",      range: 2.0, oneUse: false },
    { id: "feedback_snare",  label: "Feedback Snare",    cost: 20, color: "#99ddff",
      desc:  "40% slow + 25% damage reflection",
      trigger: "proximity", range: 1.2, oneUse: false },
    { id: "corruption_node", label: "Corruption Node",   cost: 30, color: "#66ff66",
      desc:  "Strips enemy special ability on contact",
      trigger: "proximity", range: 1.5, oneUse: false },
];

let traps = [];  // { type, x, y, charge, alive, cooldown }

// Trap picker state
let trapPickerOpen   = false;
let trapPickerTarget = null;
let _selectedTrap    = "emp_mine";

// ── PLACEMENT ─────────────────────────────────────────────
function openTrapPicker(tile) {
    if (!tile) return;
    trapPickerOpen   = true;
    trapPickerTarget = tile;
}

function placeTrap(typeId, tile) {
    const def = TRAP_DEFS.find(d => d.id === typeId);
    if (!def || !tile) return;
    if (shardCount < def.cost) {
        floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
            text: "NEED " + def.cost + " SHARDS", color: "#f44", life: 90, vy: -0.2 });
        return;
    }
    shardCount -= def.cost;
    saveShards();
    // Remove any existing trap on this tile
    traps = traps.filter(t => !(t.x === tile.x && t.y === tile.y));
    traps.push({ type: typeId, x: tile.x, y: tile.y,
                 charge: 0, alive: true, cooldown: 0 });
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
        text: def.label.toUpperCase() + " PLACED", color: def.color, life: 90, vy: -0.2 });
    trapPickerOpen   = false;
    trapPickerTarget = null;
}

// ── UPDATE ────────────────────────────────────────────────
function updateTraps() {
    traps = traps.filter(t => t.alive);
    traps.forEach(trap => {
        if (trap.cooldown > 0) { trap.cooldown--; return; }
        const def = TRAP_DEFS.find(d => d.id === trap.type);
        if (!def) return;

        const nearby = actors.filter(a => {
            if (a.dead) return false;
            const isEnemy = (a.team === "red" || (a instanceof Predator && !a.isClone));
            return isEnemy && Math.hypot(a.x - trap.x, a.y - trap.y) <= def.range;
        });

        switch (trap.type) {
            case "emp_mine": {
                if (nearby.length === 0) break;
                actors.forEach(a => {
                    if (a.dead) return;
                    const isEnemy = (a.team === "red" || (a instanceof Predator && !a.isClone));
                    if (!isEnemy) return;
                    if (Math.hypot(a.x - trap.x, a.y - trap.y) <= 2.0) {
                        a.slowed     = 180;   // 3 seconds at 60fps
                        a.slowFactor = 0.0;   // full stun
                    }
                });
                if (typeof elementEffects !== "undefined")
                    elementEffects.push({ type:"impact", x:trap.x, y:trap.y,
                        color:"#ffee33", radius:1.8, life:60, element:"electric" });
                floatingTexts.push({ x:(trap.x-player.visualX-(trap.y-player.visualY))*TILE_W+canvas.width/2,
                    y:(trap.x-player.visualX+(trap.y-player.visualY))*TILE_H+canvas.height/2-40,
                    text:"EMP!", color:"#ffee33", life:60, vy:-0.3 });
                trap.alive = false;   // one-use
                break;
            }
            case "cap_overload": {
                // Accumulate charge from each enemy nearby
                trap.charge = (trap.charge || 0) + nearby.length * 0.025;
                if (trap.charge >= 1.0) {
                    // Discharge
                    actors.forEach(a => {
                        if (a.dead) return;
                        const isEnemy = (a.team === "red" || (a instanceof Predator && !a.isClone));
                        if (!isEnemy) return;
                        if (Math.hypot(a.x - trap.x, a.y - trap.y) <= 2.5)
                            applyDamage(a, 40, null, "electric");
                    });
                    if (typeof elementEffects !== "undefined")
                        elementEffects.push({ type:"impact", x:trap.x, y:trap.y,
                            color:"#ff8800", radius:2.2, life:60, element:"fire" });
                    floatingTexts.push({ x:(trap.x-player.visualX-(trap.y-player.visualY))*TILE_W+canvas.width/2,
                        y:(trap.x-player.visualX+(trap.y-player.visualY))*TILE_H+canvas.height/2-40,
                        text:"OVERLOAD!", color:"#ff8800", life:60, vy:-0.3 });
                    trap.charge  = 0;
                    trap.cooldown = 300;  // 5s recharge
                }
                break;
            }
            case "signal_jammer": {
                // Persistent aura — disorient enemies in range every 20 frames
                if (frame % 20 === 0) {
                    nearby.forEach(a => { a.disrupted = 60; });
                }
                break;
            }
            case "feedback_snare": {
                if (nearby.length === 0) break;
                nearby.forEach(a => {
                    a.slowed       = 30;
                    a.slowFactor   = 0.6;   // 40% speed (60% slow)
                    a.reflectDamage = true;
                    // Store reflect fraction for helpers.js
                    a._snareReflect = 0.25;
                });
                trap.cooldown = 60;
                break;
            }
            case "corruption_node": {
                if (nearby.length === 0) break;
                nearby.forEach(a => {
                    if (a.corrupted) return;
                    a.shielded     = false;
                    a.shieldAmount = 0;
                    if (a.perk) { a._corruptedPerk = a.perk; a.perk = null; }
                    a.corrupted    = true;
                    if (typeof elementEffects !== "undefined")
                        elementEffects.push({ type:"impact", x:a.x, y:a.y,
                            color:"#66ff66", radius:0.8, life:35, element:"toxic" });
                });
                floatingTexts.push({ x:(trap.x-player.visualX-(trap.y-player.visualY))*TILE_W+canvas.width/2,
                    y:(trap.x-player.visualX+(trap.y-player.visualY))*TILE_H+canvas.height/2-40,
                    text:"CORRUPT", color:"#66ff66", life:60, vy:-0.25 });
                trap.cooldown = 120;
                break;
            }
        }
    });
}

// ── DRAW ─────────────────────────────────────────────────
function drawTraps() {
    if (traps.length === 0) return;
    traps.forEach(trap => {
        if (!trap.alive) return;
        const def = TRAP_DEFS.find(d => d.id === trap.type);
        if (!def) return;

        const spx = (trap.x - player.visualX - (trap.y - player.visualY)) * TILE_W + canvas.width/2;
        const spy = (trap.x - player.visualX + (trap.y - player.visualY)) * TILE_H + canvas.height/2;
        const tcx = spx;
        const tcy = spy + TILE_H * 0.5;

        const isActive = trap.cooldown === 0;
        const pulse    = 0.5 + 0.5 * Math.sin((frame || 0) * 0.12 + trap.x * 1.3);
        const col      = def.color;

        ctx.save();

        // ── PCB marking — cross-hair ──
        ctx.globalAlpha = isActive ? (0.35 + 0.2 * pulse) : 0.12;
        ctx.strokeStyle = col;
        ctx.lineWidth   = 0.9;
        ctx.beginPath(); ctx.moveTo(tcx - 9, tcy); ctx.lineTo(tcx + 9, tcy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tcx, tcy - 7); ctx.lineTo(tcx, tcy + 7); ctx.stroke();
        // Circle
        ctx.beginPath(); ctx.arc(tcx, tcy, 5.5, 0, Math.PI * 2); ctx.stroke();
        // Corner ticks (PCB footprint look)
        const tk = 3;
        [[9,0],[0,7],[-9,0],[0,-7]].forEach(([dx,dy]) => {
            ctx.beginPath();
            ctx.arc(tcx + dx, tcy + dy, 1.3, 0, Math.PI * 2); ctx.fill();
        });

        // Charge bar (cap overload only)
        if (trap.type === "cap_overload" && isActive) {
            const chg = Math.min(1, trap.charge || 0);
            ctx.globalAlpha = 0.75;
            ctx.fillStyle   = "#111";
            ctx.fillRect(tcx - 11, tcy - 13, 22, 3);
            ctx.fillStyle   = col;
            ctx.fillRect(tcx - 11, tcy - 13, Math.round(22 * chg), 3);
        }

        // Glow when active
        if (isActive) {
            ctx.globalAlpha = 0.12 * pulse;
            ctx.shadowColor = col;
            ctx.shadowBlur  = 6;
            ctx.fillStyle   = col;
            ctx.beginPath(); ctx.arc(tcx, tcy, 5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur  = 0;
        }

        // Type label (visible in build mode only)
        if (buildMode) {
            ctx.globalAlpha = 0.65;
            ctx.fillStyle   = col;
            ctx.font        = "7px monospace";
            ctx.textAlign   = "center";
            const short = { emp_mine:"EMP", cap_overload:"CAP",
                            signal_jammer:"JAM", feedback_snare:"SNR", corruption_node:"COR" };
            ctx.fillText(short[trap.type] || "TRP", tcx, tcy - 11);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    });
}

// ── TRAP PICKER PANEL (canvas-drawn) ──────────────────────
const _TRAP_PANEL = { w: 270, h: 310, pad: 10 };

function drawTrapPicker() {
    if (!trapPickerOpen) return;
    const pw = _TRAP_PANEL.w, ph = _TRAP_PANEL.h, pd = _TRAP_PANEL.pad;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const bx = cx - pw/2, by = cy - ph/2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle   = "rgba(2,5,3,0.97)";
    ctx.strokeStyle = "#0f8";
    ctx.lineWidth   = 1.5;
    ctx.fillRect(bx, by, pw, ph);
    ctx.strokeRect(bx, by, pw, ph);

    ctx.fillStyle  = "#0f8";
    ctx.font       = "bold 12px monospace";
    ctx.textAlign  = "center";
    ctx.fillText("◈ PLACE TRAP", cx, by + pd + 11);

    ctx.strokeStyle = "rgba(0,255,136,0.12)";
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(bx + pd, by + 30); ctx.lineTo(bx + pw - pd, by + 30); ctx.stroke();

    const rowH = 44, rowStart = by + 36;
    TRAP_DEFS.forEach((def, i) => {
        const ry  = rowStart + i * rowH;
        const sel = _selectedTrap === def.id;

        ctx.fillStyle   = sel ? "rgba(0,45,18,0.9)" : "rgba(6,14,9,0.7)";
        ctx.strokeStyle = sel ? def.color : "rgba(0,70,35,0.5)";
        ctx.lineWidth   = sel ? 1.2 : 0.8;
        ctx.fillRect(bx + pd, ry, pw - pd*2, rowH - 4);
        ctx.strokeRect(bx + pd, ry, pw - pd*2, rowH - 4);

        // Color dot
        ctx.fillStyle = def.color;
        ctx.beginPath(); ctx.arc(bx + pd + 10, ry + (rowH-4)/2, 4, 0, Math.PI*2); ctx.fill();

        // Name + cost
        ctx.fillStyle  = sel ? "#fff" : "#ccc";
        ctx.font       = "bold 10px monospace";
        ctx.textAlign  = "left";
        ctx.fillText(def.label, bx + pd + 22, ry + 14);

        ctx.fillStyle  = shardCount >= def.cost ? "#ff0" : "#844";
        ctx.font       = "9px monospace";
        ctx.textAlign  = "right";
        ctx.fillText(def.cost + "S", bx + pw - pd - 4, ry + 14);

        // Desc
        ctx.fillStyle  = "#566";
        ctx.font       = "8px monospace";
        ctx.textAlign  = "left";
        ctx.fillText(def.desc, bx + pd + 22, ry + 26);
    });

    // PLACE / CANCEL buttons
    const btnY = by + ph - 30;
    const btnW = (pw - pd*3) / 2;

    ctx.fillStyle   = "rgba(0,35,16,0.9)";
    ctx.strokeStyle = "#0f8";
    ctx.lineWidth   = 1;
    ctx.fillRect(bx + pd, btnY, btnW, 22);
    ctx.strokeRect(bx + pd, btnY, btnW, 22);
    ctx.fillStyle  = "#0f8";
    ctx.font       = "10px monospace";
    ctx.textAlign  = "center";
    ctx.fillText("PLACE", bx + pd + btnW/2, btnY + 14);

    const cxBtn = bx + pd + btnW + pd;
    ctx.fillStyle   = "rgba(18,2,2,0.9)";
    ctx.strokeStyle = "#f44";
    ctx.fillRect(cxBtn, btnY, btnW, 22);
    ctx.strokeRect(cxBtn, btnY, btnW, 22);
    ctx.fillStyle  = "#f44";
    ctx.fillText("CANCEL", cxBtn + btnW/2, btnY + 14);

    ctx.restore();
}

function handleTrapPickerTap(tx, ty) {
    if (!trapPickerOpen) return false;
    const pw = _TRAP_PANEL.w, ph = _TRAP_PANEL.h, pd = _TRAP_PANEL.pad;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const bx = cx - pw/2, by = cy - ph/2;

    // Outside → close
    if (tx < bx || tx > bx + pw || ty < by || ty > by + ph) {
        trapPickerOpen = false; trapPickerTarget = null; return true;
    }

    // Row selection
    const rowH = 44, rowStart = by + 36;
    TRAP_DEFS.forEach((def, i) => {
        const ry = rowStart + i * rowH;
        if (tx >= bx + pd && tx <= bx + pw - pd && ty >= ry && ty <= ry + rowH - 4)
            _selectedTrap = def.id;
    });

    // Buttons
    const btnY = by + ph - 30;
    const btnW = (pw - pd*3) / 2;
    if (ty >= btnY && ty <= btnY + 22) {
        if (tx >= bx + pd && tx <= bx + pd + btnW) {
            // Place
            placeTrap(_selectedTrap, trapPickerTarget);
        } else {
            // Cancel
            trapPickerOpen = false; trapPickerTarget = null;
        }
    }

    return true;
}
