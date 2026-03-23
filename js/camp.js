// ─────────────────────────────────────────────────────────
//  HOME CAMP SYSTEM  (Feature 1)
//  A developed base area in the negative zones (x < 0),
//  behind the Crystal, with a circuit-board visual style.
// ─────────────────────────────────────────────────────────

const CAMP_BUILDINGS = [
    { id: "command_node",   label: "Command Node",   cost: 40,
      effect: "All followers +10% ATK + DEF",
      desc:   "Neural uplink enhances all unit combat stats." },
    { id: "dna_sequencer",  label: "DNA Sequencer",  cost: 50,
      effect: "+50% DNA drop rate from enemies",
      desc:   "Enhanced extraction doubles genetic material yield." },
    { id: "fabricator",     label: "Fabricator",     cost: 60,
      effect: "Enables element re-infusion on followers",
      desc:   "Reconfigure follower elemental core at the Crystal." },
    { id: "power_conduit",  label: "Power Conduit",  cost: 35,
      effect: "Passive +5 shards per wave",
      desc:   "Siphons ambient energy into usable crystal shards." },
    { id: "signal_relay",   label: "Signal Relay",   cost: 45,
      effect: "Pylon network range +2 tiles globally",
      desc:   "Boosts transmission distance across all pylons." },
    { id: "repair_station", label: "Repair Station", cost: 30,
      effect: "Auto-heals all followers to 80% HP each wave",
      desc:   "Rapid field maintenance keeps your squad ready." },
];

// Fixed tile positions — y=-1 puts them right against the back wall (y=-2)
const _CAMP_BLDG_TILES = {
    command_node:   { x: -2, y: -1 },
    power_conduit:  { x: -3, y: -1 },
    repair_station: { x: -4, y: -1 },
    signal_relay:   { x: -5, y: -1 },
    dna_sequencer:  { x: -6, y: -1 },
    fabricator:     { x: -7, y: -1 },
};

let campBuildings = new Set();
let campMenuOpen  = false;

// ── PERSISTENCE ───────────────────────────────────────────
function saveCampBuildings() {
    try { localStorage.setItem("tubecrawler_camp", JSON.stringify([...campBuildings])); } catch(e) {}
}
function loadCampBuildings() {
    try {
        const d = JSON.parse(localStorage.getItem("tubecrawler_camp") || "[]");
        campBuildings = new Set(d);
    } catch(e) { campBuildings = new Set(); }
}
function clearCampBuildings() {
    try { localStorage.removeItem("tubecrawler_camp"); } catch(e) {}
    campBuildings = new Set();
}

function isCampBuilt(id) { return campBuildings.has(id); }

function purchaseCampBuilding(id) {
    const def = CAMP_BUILDINGS.find(b => b.id === id);
    if (!def || campBuildings.has(id)) return;
    if (shardCount < def.cost) {
        floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
            text: "NEED " + def.cost + " SHARDS", color: "#f44", life: 90, vy: -0.2 });
        return;
    }
    shardCount -= def.cost;
    saveShards();
    campBuildings.add(id);
    saveCampBuildings();
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
        text: def.label.toUpperCase() + " BUILT", color: "#0f8", life: 120, vy: -0.2 });
}

// ── BUILDING EFFECT HOOKS ─────────────────────────────────

// Signal Relay — returns pylon connection range (tiles)
function getPylonRange() {
    return isCampBuilt("signal_relay") ? 3.5 : 2.5;
}

// Command Node — follower damage/defense multipliers
function getFollowerAttackMult() { return isCampBuilt("command_node") ? 1.10 : 1.0; }
function getFollowerDefMult()    { return isCampBuilt("command_node") ? 0.90 : 1.0; }

// Power Conduit — called from nextWave()
function applyPowerConduit() {
    if (!isCampBuilt("power_conduit")) return;
    shardCount += 5;
    saveShards();
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 60,
        text: "+5 SHARDS (Power Conduit)", color: "#ff0", life: 90, vy: -0.2 });
}

// Repair Station — called from nextWave() after followers spawn
function applyRepairStation() {
    if (!isCampBuilt("repair_station")) return;
    followers.forEach(f => {
        if (f.dead) return;
        f.health = Math.max(f.health, f.maxHealth * 0.8);
    });
}

// ── CAMP MENU PANEL (canvas-drawn) ───────────────────────
const _CAMP_PANEL = { w: 320, h: 370, pad: 12 };

function drawCampMenu() {
    if (!campMenuOpen) return;
    const pw = _CAMP_PANEL.w, ph = _CAMP_PANEL.h, pd = _CAMP_PANEL.pad;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const bx = cx - pw/2, by = cy - ph/2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Backdrop
    ctx.fillStyle   = "rgba(2,8,4,0.97)";
    ctx.strokeStyle = "#0f8";
    ctx.lineWidth   = 1.5;
    ctx.fillRect(bx, by, pw, ph);
    ctx.strokeRect(bx, by, pw, ph);

    // PCB corner accents
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy]) => {
        const ox = bx + (sx < 0 ? pd : pw - pd), oy = by + (sy < 0 ? pd : ph - pd);
        ctx.strokeStyle = "rgba(0,180,80,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox - sx * 12, oy);
        ctx.lineTo(ox, oy);
        ctx.lineTo(ox, oy - sy * 12);
        ctx.stroke();
    });

    // Title
    ctx.fillStyle  = "#0f8";
    ctx.font       = "bold 13px monospace";
    ctx.textAlign  = "center";
    ctx.fillText("◈ HOME CAMP BUILDINGS", cx, by + pd + 12);

    ctx.strokeStyle = "rgba(0,255,136,0.12)";
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(bx + pd, by + 34); ctx.lineTo(bx + pw - pd, by + 34); ctx.stroke();

    // Shards indicator
    ctx.fillStyle = "#ff0";
    ctx.font      = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("Shards: " + shardCount, bx + pw - pd, by + pd + 12);

    // Building rows
    const rowH = 48, rowStart = by + 38;
    CAMP_BUILDINGS.forEach((b, i) => {
        const ry      = rowStart + i * rowH;
        const built   = campBuildings.has(b.id);
        const canAfford = !built && shardCount >= b.cost;

        // Row bg
        ctx.fillStyle = built ? "rgba(0,55,22,0.75)" : "rgba(8,18,12,0.6)";
        ctx.fillRect(bx + pd, ry, pw - pd * 2, rowH - 4);

        if (built) {
            // Built indicator
            ctx.fillStyle = "#0f8";
            ctx.font      = "bold 10px monospace";
            ctx.textAlign = "right";
            ctx.fillText("◈ BUILT", bx + pw - pd - 4, ry + 15);
        } else {
            // Buy button
            const btnW = 66, btnH = 20;
            const btnX = bx + pw - pd - btnW;
            ctx.fillStyle   = canAfford ? "#0a2010" : "#100808";
            ctx.strokeStyle = canAfford ? "#0f8"    : "#443";
            ctx.lineWidth   = 1;
            ctx.fillRect(btnX, ry + 4, btnW, btnH);
            ctx.strokeRect(btnX, ry + 4, btnW, btnH);
            ctx.fillStyle  = canAfford ? "#0f8" : "#554";
            ctx.font       = "9px monospace";
            ctx.textAlign  = "center";
            ctx.fillText(b.cost + " SHARDS", btnX + btnW/2, ry + 17);
        }

        // Name
        ctx.fillStyle  = built ? "#88ffbb" : "#ccc";
        ctx.font       = "bold 11px monospace";
        ctx.textAlign  = "left";
        ctx.fillText(b.label, bx + pd + 4, ry + 15);

        // Effect
        ctx.fillStyle = "#666";
        ctx.font      = "9px monospace";
        ctx.fillText(b.effect, bx + pd + 4, ry + 28);

        // Desc (tiny)
        ctx.fillStyle = "#3a4";
        ctx.font      = "8px monospace";
        ctx.fillText(b.desc, bx + pd + 4, ry + 39);
    });

    // Close hint
    ctx.fillStyle = "#444";
    ctx.font      = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("tap outside to close", cx, by + ph - 6);

    ctx.restore();
}

function handleCampMenuTap(tx, ty) {
    if (!campMenuOpen) return false;
    const pw = _CAMP_PANEL.w, ph = _CAMP_PANEL.h, pd = _CAMP_PANEL.pad;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const bx = cx - pw/2, by = cy - ph/2;

    // Outside → close
    if (tx < bx || tx > bx + pw || ty < by || ty > by + ph) {
        campMenuOpen = false;
        return true;
    }

    // Buy buttons
    const rowH = 48, rowStart = by + 38;
    const btnW = 66, btnH = 20;
    CAMP_BUILDINGS.forEach((b, i) => {
        if (campBuildings.has(b.id)) return;
        const ry   = rowStart + i * rowH;
        const btnX = bx + pw - pd - btnW;
        if (tx >= btnX && tx <= btnX + btnW && ty >= ry + 4 && ty <= ry + 4 + btnH) {
            purchaseCampBuilding(b.id);
        }
    });

    return true;
}

// ── SHOP BUTTON (canvas-drawn, bottom-left above camp) ────
const _SHOPBTN = { x: 22, y: 0, r: 20 };

function drawShopButton() {
    if (alertActive || gameState.phase === "night" || gameState.phase === "waveComplete" || gameState.phase === "gameOver") return;
    _SHOPBTN.y = canvas.height - 104 - (SAFE_BOTTOM || 0);
    const { x, y, r } = _SHOPBTN;
    const pulse = 0.65 + 0.35 * Math.sin((frame || 0) * 0.07);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle   = "rgba(0,12,30,0.88)";
    ctx.strokeStyle = `rgba(80,180,255,${0.4 + 0.2 * pulse})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Shard icon — diamond shape
    ctx.strokeStyle = `rgba(80,180,255,${0.6 * pulse})`;
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y - 8); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 6, y);
    ctx.closePath(); ctx.stroke();

    ctx.fillStyle  = `rgba(100,200,255,${0.75 * pulse})`;
    ctx.font       = "bold 8px monospace";
    ctx.textAlign  = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("SHOP", x, y + r + 10);
    ctx.textBaseline = "alphabetic";

    ctx.restore();
}

// ── CAMP BUTTON (canvas-drawn, bottom-left) ───────────────
const _CAMPBTN = { x: 22, y: 0, r: 20 };

function drawCampButton() {
    _CAMPBTN.y = canvas.height - 58 - (SAFE_BOTTOM || 0);
    const { x, y, r } = _CAMPBTN;
    const pulse = 0.65 + 0.35 * Math.sin((frame || 0) * 0.05);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle   = campMenuOpen ? "rgba(0,180,70,0.25)" : "rgba(0,25,12,0.88)";
    ctx.strokeStyle = campMenuOpen ? "#0f8" : `rgba(0,220,100,${0.4 + 0.2 * pulse})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // PCB icon — small grid lines inside circle
    ctx.strokeStyle = campMenuOpen ? "#0f8" : `rgba(0,180,80,${0.55 * pulse})`;
    ctx.lineWidth   = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 8, y - 4); ctx.lineTo(x + 8, y - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, y + 4); ctx.lineTo(x + 8, y + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, y - 8); ctx.lineTo(x - 4, y + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 4, y - 8); ctx.lineTo(x + 4, y + 8); ctx.stroke();

    // Label
    ctx.fillStyle  = campMenuOpen ? "#0f8" : `rgba(0,200,80,${0.75 * pulse})`;
    ctx.font       = "bold 8px monospace";
    ctx.textAlign  = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("CAMP", x, y + r + 10);
    ctx.textBaseline = "alphabetic";

    ctx.restore();
}

// ── SETTINGS BUTTON (canvas-drawn, bottom-left above shop) ──
const _SETTINGSBTN = { x: 22, y: 0, r: 20 };

function drawSettingsButton() {
    _SETTINGSBTN.y = canvas.height - 150 - (SAFE_BOTTOM || 0);
    const { x, y, r } = _SETTINGSBTN;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle   = settingsPanelOpen ? "rgba(80,80,80,0.25)" : "rgba(15,15,15,0.88)";
    ctx.strokeStyle = settingsPanelOpen ? "#aaa" : "rgba(100,100,100,0.5)";
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Gear icon
    ctx.fillStyle    = settingsPanelOpen ? "#ccc" : "rgba(140,140,140,0.8)";
    ctx.font         = "14px monospace";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚙", x, y);

    // Label
    ctx.fillStyle    = settingsPanelOpen ? "#ccc" : "rgba(120,120,120,0.7)";
    ctx.font         = "bold 8px monospace";
    ctx.textBaseline = "bottom";
    ctx.fillText("SET", x, y + r + 10);
    ctx.textBaseline = "alphabetic";

    ctx.restore();
}

// ── HOME NODE — central camp hub structure ─────────────────
// Drawn over tile x=-1, y=2 (between crystal and camp buildings).
// Tapping it opens the camp building menu.
const HOME_NODE_TILE = { x: -1, y: 2 };

function drawHomeNode(tcx, tcy, amb) {
    const f       = frame || 0;
    const pulse   = 0.6 + 0.4 * Math.sin(f * 0.06);
    // Janky flicker — occasional stutter/glitch
    const flicker = (Math.sin(f * 0.31) > 0.82) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 1.7)) : 1.0;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ── Base slab (wide, asymmetric — like salvaged deck plating) ──
    ctx.fillStyle   = `rgba(${(30*amb)|0},${(28*amb)|0},${(26*amb)|0},0.97)`;
    ctx.strokeStyle = `rgba(${(90*amb)|0},${(75*amb)|0},${(50*amb)|0},0.7)`;
    ctx.lineWidth   = 1.2;
    ctx.fillRect(tcx - 22, tcy - 5, 44, 5);
    ctx.strokeRect(tcx - 22, tcy - 5, 44, 5);
    // Bolt detail — left & right
    [[tcx - 19, tcy - 2.5], [tcx + 19, tcy - 2.5]].forEach(([bx, by]) => {
        ctx.fillStyle = `rgba(${(100*amb)|0},${(85*amb)|0},${(55*amb)|0},0.9)`;
        ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${(55*amb)|0},${(45*amb)|0},${(25*amb)|0},0.8)`;
        ctx.lineWidth = 0.5;
        // Cross-slot on bolt head
        ctx.beginPath(); ctx.moveTo(bx - 1.2, by); ctx.lineTo(bx + 1.2, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by - 1.2); ctx.lineTo(bx, by + 1.2); ctx.stroke();
    });
    // Off-center patch panel (welded on, right side)
    ctx.fillStyle   = `rgba(${(55*amb)|0},${(35*amb)|0},${(18*amb)|0},0.85)`;
    ctx.strokeStyle = `rgba(${(85*amb)|0},${(55*amb)|0},${(25*amb)|0},0.6)`;
    ctx.lineWidth   = 0.7;
    ctx.fillRect(tcx + 10, tcy - 4, 8, 4);
    ctx.strokeRect(tcx + 10, tcy - 4, 8, 4);

    // ── Main column (dark gunmetal, rough) ──
    const colW   = 14, colH = 44;
    const colTop = tcy - 5 - colH;
    ctx.fillStyle   = `rgba(${(24*amb)|0},${(26*amb)|0},${(30*amb)|0},0.97)`;
    ctx.strokeStyle = `rgba(${(55*amb)|0},${(60*amb)|0},${(70*amb)|0},0.55)`;
    ctx.lineWidth   = 1;
    ctx.fillRect(tcx - colW / 2, colTop, colW, colH);
    ctx.strokeRect(tcx - colW / 2, colTop, colW, colH);

    // ── Left salvage panel (oxidized rust) ──
    ctx.fillStyle   = `rgba(${(60*amb)|0},${(28*amb)|0},${(10*amb)|0},0.9)`;
    ctx.strokeStyle = `rgba(${(95*amb)|0},${(48*amb)|0},${(18*amb)|0},0.65)`;
    ctx.lineWidth   = 0.6;
    ctx.fillRect(tcx - colW / 2, colTop + 6, 5, 20);
    ctx.strokeRect(tcx - colW / 2, colTop + 6, 5, 20);

    // ── Right grey panel (mismatched) ──
    ctx.fillStyle   = `rgba(${(38*amb)|0},${(40*amb)|0},${(46*amb)|0},0.95)`;
    ctx.strokeStyle = `rgba(${(65*amb)|0},${(70*amb)|0},${(80*amb)|0},0.5)`;
    ctx.lineWidth   = 0.6;
    ctx.fillRect(tcx + 2, colTop + 14, 5, 24);
    ctx.strokeRect(tcx + 2, colTop + 14, 5, 24);

    // ── Warning hazard stripes (diagonal yellow/black band) ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(tcx - colW / 2, colTop + 26, colW, 14);
    ctx.clip();
    ctx.lineWidth = 2.8;
    for (let i = -3; i <= 6; i++) {
        ctx.strokeStyle = (i % 2 === 0)
            ? `rgba(${(195*amb)|0},${(145*amb)|0},0,0.38)`
            : `rgba(${(10*amb)|0},${(10*amb)|0},${(10*amb)|0},0.35)`;
        ctx.beginPath();
        ctx.moveTo(tcx - colW / 2 + i * 4,     colTop + 26);
        ctx.lineTo(tcx - colW / 2 + i * 4 + 14, colTop + 40);
        ctx.stroke();
    }
    ctx.restore();

    // ── Vent slots at top of column ──
    [colTop + 4, colTop + 8].forEach(vy => {
        ctx.fillStyle   = `rgba(0,0,0,0.75)`;
        ctx.strokeStyle = `rgba(${(65*amb)|0},${(65*amb)|0},${(65*amb)|0},0.45)`;
        ctx.lineWidth   = 0.5;
        ctx.fillRect(tcx - 5, vy, 10, 2);
        ctx.strokeRect(tcx - 5, vy, 10, 2);
    });

    // ── Exposed wire bundle (right side, sagging) ──
    [
        [`rgba(0,${(195*amb)|0},${(255*amb)|0},0.65)`, 0,   0],
        [`rgba(${(255*amb)|0},${(120*amb)|0},0,0.6)`,  0.8, 1.5],
        [`rgba(${(215*amb)|0},0,${(215*amb)|0},0.5)`, -0.5, 3],
    ].forEach(([wc, ox, dx]) => {
        ctx.strokeStyle = wc;
        ctx.lineWidth   = 0.85;
        ctx.beginPath();
        ctx.moveTo(tcx + colW / 2 + ox, colTop + 3);
        ctx.bezierCurveTo(
            tcx + colW / 2 + dx + 4, colTop + 14,
            tcx + colW / 2 + dx + 2, colTop + 28,
            tcx + colW / 2 + dx + 5, colTop + 42
        );
        ctx.stroke();
    });

    // ── Status lights (blinking, amber + red) ──
    const l1 = Math.sin(f * 0.09) > 0;
    const l2 = Math.sin(f * 0.14 + 1.8) > 0.25;
    ctx.shadowColor = l1 ? '#ff8800' : 'transparent';
    ctx.shadowBlur  = l1 ? 5 * amb : 0;
    ctx.fillStyle   = l1
        ? `rgba(${(255*amb)|0},${(140*amb)|0},0,${0.95*amb})`
        : `rgba(${(55*amb)|0},${(28*amb)|0},0,0.8)`;
    ctx.beginPath(); ctx.arc(tcx - 5, colTop + 33, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.shadowColor = l2 ? '#ff2200' : 'transparent';
    ctx.shadowBlur  = l2 ? 5 * amb : 0;
    ctx.fillStyle   = l2
        ? `rgba(${(255*amb)|0},${(38*amb)|0},${(18*amb)|0},${0.95*amb})`
        : `rgba(${(52*amb)|0},${(10*amb)|0},${(8*amb)|0},0.8)`;
    ctx.beginPath(); ctx.arc(tcx - 5, colTop + 39, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // ── Makeshift mounting bracket (asymmetric, crooked) ──
    ctx.strokeStyle = `rgba(${(75*amb)|0},${(78*amb)|0},${(85*amb)|0},0.85)`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(tcx - 2, colTop); ctx.lineTo(tcx - 2, colTop - 8); ctx.stroke();
    ctx.lineWidth   = 1.2;
    ctx.beginPath(); ctx.moveTo(tcx + 3, colTop); ctx.lineTo(tcx + 2, colTop - 11); ctx.stroke();
    ctx.lineWidth   = 1.0;
    ctx.beginPath(); ctx.moveTo(tcx - 2, colTop - 8); ctx.lineTo(tcx + 2, colTop - 11); ctx.stroke();

    // ── Energy emitter — janky off-centre orb (amber, flickering) ──
    const ex = tcx + 2, ey = colTop - 13;
    ctx.shadowColor = '#ffaa22';
    ctx.shadowBlur  = (9 + 7 * pulse) * amb * flicker;
    ctx.fillStyle   = `rgba(${(255 * amb * pulse * flicker)|0},${(135 * amb * pulse * flicker)|0},${(18 * amb * pulse * flicker)|0},0.95)`;
    ctx.beginPath(); ctx.arc(ex, ey, 4.5 + pulse * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur  = 0;

    // Outer ring (slightly elliptical — imperfect mount)
    ctx.strokeStyle = `rgba(${(255 * amb * pulse)|0},${(115 * amb * pulse)|0},0,${0.4 * pulse})`;
    ctx.lineWidth   = 0.9;
    ctx.beginPath(); ctx.ellipse(ex, ey, 9, 8, 0.15, 0, Math.PI * 2); ctx.stroke();

    // ── Stenciled label (rough, amber-tinted) ──
    ctx.fillStyle = `rgba(${(215 * amb * pulse * flicker)|0},${(145 * amb * pulse * flicker)|0},${(18 * amb * pulse * flicker)|0},0.88)`;
    ctx.font      = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("HOME", tcx, ey - 11);

    ctx.fillStyle = `rgba(${(115*amb)|0},${(95*amb)|0},${(45*amb)|0},0.5)`;
    ctx.font      = "7px monospace";
    ctx.fillText("[ tap ]", tcx, ey - 2);

    ctx.restore();
}

// ── CAMP FLOOR DRAWING (circuit-board PCB style) ──────────
// Called instead of the regular floor draw for tiles with x < 0.
function drawCampFloor(obj, px, py, amb) {
    const txi = Math.round(obj.x);
    const tyi = Math.round(obj.y);
    const tcx = px;          // isometric tile top-vertex x
    const tcy = py + TILE_H; // tile center y (middle of diamond)

    const isNight = gameState && gameState.phase === "night";
    const pdist   = Math.sqrt((obj.x - player.visualX) ** 2 + (obj.y - player.visualY) ** 2);
    const glo     = Math.max(0, 1.0 - pdist / 5);

    // ── Tile fill — same steel-blue/teal geometry as regular floor ──
    let tR, tG, tB;
    if (isNight) {
        tR = (22 * amb + 38 * glo) | 0;
        tG = (14 * amb + 10 * glo) | 0;
        tB = (16 * amb +  6 * glo) | 0;
    } else {
        tR = (16 * amb +  8 * glo) | 0;
        tG = (26 * amb + 20 * glo) | 0;
        tB = (42 * amb + 52 * glo) | 0;
    }
    ctx.fillStyle = `rgb(${tR},${tG},${tB})`;
    ctx.beginPath();
    ctx.moveTo(px,          py);
    ctx.lineTo(px + TILE_W, py + TILE_H);
    ctx.lineTo(px,          py + TILE_W);
    ctx.lineTo(px - TILE_W, py + TILE_H);
    ctx.closePath();
    ctx.fill();

    // ── Steel panel bevel — matching regular floor edges ──
    ctx.strokeStyle = isNight ? `rgba(80,45,30,${0.5 * amb})` : `rgba(80,130,180,${0.55 * amb})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px - TILE_W + 1, py + TILE_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px + TILE_W - 1, py + TILE_H); ctx.stroke();
    ctx.strokeStyle = `rgba(0,0,0,${0.35 * amb})`;
    ctx.beginPath(); ctx.moveTo(px - TILE_W + 1, py + TILE_H); ctx.lineTo(px, py + TILE_W - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + TILE_W - 1, py + TILE_H); ctx.lineTo(px, py + TILE_W - 1); ctx.stroke();

    // ── Camp building 3D asset on this tile ──
    const _campBldgHere = CAMP_BUILDINGS.find(b => {
        const t = _CAMP_BLDG_TILES[b.id];
        return t && t.x === txi && t.y === tyi;
    });
    if (_campBldgHere) _drawCampBuilding3D(_campBldgHere, tcx, tcy + TILE_H, amb);

    // ── Home node structure ──
    if (txi === HOME_NODE_TILE.x && tyi === HOME_NODE_TILE.y) {
        drawHomeNode(tcx, tcy, amb);
    }
}

// ── CAMP BUILDING 3-D ASSETS ────────────────────────────────
// Draws an isometric 3D structure for each camp building.
// Ghost (not yet bought): dim wireframe silhouette + cost label.
// Built: full glowing asset.

function _drawCampBuilding3D(bldg, tcx, tcy, amb) {
    const built = campBuildings.has(bldg.id);
    const pulse = 0.6 + 0.4 * Math.sin((frame || 0) * 0.07 + tcx * 0.01);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Ghost: reduce amb so structure is dim but still readable; built: full
    const a = built ? amb : amb * 0.55;

    switch (bldg.id) {
        case 'command_node':   _campCmdNode(tcx, tcy, a, pulse, built);    break;
        case 'dna_sequencer':  _campDnaSeq(tcx, tcy, a, pulse, built);     break;
        case 'fabricator':     _campFabricator(tcx, tcy, a, pulse, built); break;
        case 'power_conduit':  _campPowerCon(tcx, tcy, a, pulse, built);   break;
        case 'signal_relay':   _campSigRelay(tcx, tcy, a, pulse, built);   break;
        case 'repair_station': _campRepair(tcx, tcy, a, pulse, built);     break;
    }

    // Label above structure
    ctx.fillStyle = built
        ? `rgba(220,170,40,${0.95*amb})`
        : `rgba(140,115,50,${0.65*amb})`;
    ctx.font      = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bldg.label.split(' ')[0].toUpperCase(), tcx, tcy - 48);
    if (!built) {
        ctx.fillStyle = `rgba(110,95,42,${0.55*amb})`;
        ctx.font      = '7px monospace';
        ctx.fillText(bldg.cost + 'S', tcx, tcy - 39);
    }
    ctx.restore();
}

// ── Isometric box helper (2:1 ratio matching TILE_W/TILE_H=2) ──
// Base at (cx, cy) going up h px. hw = half screen-width.
function _cBox(cx, cy, hw, h, cTop, cLeft, cRight, cEdge) {
    const t = hw * 0.5; // iso-depth tilt
    ctx.lineWidth = 0.7;
    ctx.fillStyle = cRight;
    ctx.beginPath();
    ctx.moveTo(cx, cy);          ctx.lineTo(cx + hw, cy - t);
    ctx.lineTo(cx + hw, cy - t - h); ctx.lineTo(cx, cy - h);
    ctx.closePath(); ctx.fill();
    if (cEdge) { ctx.strokeStyle = cEdge; ctx.stroke(); }

    ctx.fillStyle = cLeft;
    ctx.beginPath();
    ctx.moveTo(cx, cy);          ctx.lineTo(cx - hw, cy - t);
    ctx.lineTo(cx - hw, cy - t - h); ctx.lineTo(cx, cy - h);
    ctx.closePath(); ctx.fill();
    if (cEdge) { ctx.strokeStyle = cEdge; ctx.stroke(); }

    ctx.fillStyle = cTop;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);           ctx.lineTo(cx + hw, cy - h - t);
    ctx.lineTo(cx, cy - h - hw);      ctx.lineTo(cx - hw, cy - h - t);
    ctx.closePath(); ctx.fill();
    if (cEdge) { ctx.strokeStyle = cEdge; ctx.stroke(); }
}

// ── Shared gunmetal palette ──────────────────────────────────
// All buildings use the same dark gunmetal colour set; only glow accents differ.
function _gmTop(a)  { return `rgb(${(42*a)|0},${(44*a)|0},${(51*a)|0})`; }
function _gmLeft(a) { return `rgb(${(34*a)|0},${(36*a)|0},${(42*a)|0})`; }
function _gmRight(a){ return `rgb(${(26*a)|0},${(28*a)|0},${(33*a)|0})`; }
function _gmEdge(a) { return `rgba(${(58*a)|0},${(62*a)|0},${(72*a)|0},0.7)`; }
// Shared rivet helper
function _rivet(x, y, a) {
    ctx.fillStyle = `rgba(${(78*a)|0},${(73*a)|0},${(58*a)|0},0.95)`;
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(${(50*a)|0},${(46*a)|0},${(35*a)|0},0.8)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x-1.3,y); ctx.lineTo(x+1.3,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y-1.3); ctx.lineTo(x,y+1.3); ctx.stroke();
}
// Hazard stripe clip helper — fills diagonal stripes inside the current path
function _hazardStripes(a) {
    ctx.lineWidth = 3.2;
    for (let i = -4; i <= 8; i++) {
        ctx.strokeStyle = (i%2===0)
            ? `rgba(${(178*a)|0},${(134*a)|0},0,0.32)`
            : `rgba(8,8,8,0.26)`;
        ctx.beginPath(); ctx.moveTo(-30+i*6, 40); ctx.lineTo(40+i*6, -40); ctx.stroke();
    }
}

// ── Command Node: salvaged comms terminal ─────────────────────
function _campCmdNode(cx, cy, a, pulse, built) {
    const f = frame || 0;
    // Base slab
    _cBox(cx, cy, 11, 4, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Cabinet body
    _cBox(cx, cy-4, 9, 28, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Hazard stripes on right face (bottom band)
    ctx.save();
    ctx.translate(cx, cy-4);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(9,-4.5); ctx.lineTo(9,-4.5-10); ctx.lineTo(0,-10); ctx.closePath(); ctx.clip();
    _hazardStripes(a); ctx.restore();
    // Rivets on cabinet right face corners
    _rivet(cx+2,cy-6,a); _rivet(cx+2,cy-30,a); _rivet(cx+8,cy-8,a); _rivet(cx+8,cy-28,a);
    // Screen panel: 4 scan-line rows
    for (let i = 0; i < 4; i++) {
        const sy = cy - 14 - i*4;
        const lit = built && Math.sin(f*0.13+i*1.4) > -0.3;
        ctx.fillStyle = lit
            ? `rgba(${(18*a)|0},${(170+60*Math.sin(f*0.13+i))|0},${(255*a)|0},0.9)`
            : `rgba(${(12*a)|0},${(15*a)|0},${(22*a)|0},0.85)`;
        ctx.fillRect(cx+1, sy, 7, 2);
    }
    ctx.strokeStyle=`rgba(${(65*a)|0},${(70*a)|0},${(88*a)|0},0.65)`; ctx.lineWidth=0.6;
    ctx.strokeRect(cx+1,cy-30,7,18);
    // Antenna mast (slightly off-centre)
    ctx.strokeStyle=`rgba(${(68*a)|0},${(68*a)|0},${(78*a)|0},0.9)`; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(cx-1,cy-32); ctx.lineTo(cx+1,cy-46); ctx.stroke();
    ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(cx-5,cy-38); ctx.lineTo(cx+4,cy-40); ctx.stroke(); // cross-strut
    // Antenna tip light
    if (built) { ctx.shadowColor='#ffaa22'; ctx.shadowBlur=7*pulse; }
    ctx.fillStyle = built
        ? `rgba(${(255*pulse)|0},${(148*a*pulse)|0},${(18*a*pulse)|0},0.95)`
        : `rgba(${(52*a)|0},${(36*a)|0},${(10*a)|0},0.8)`;
    ctx.beginPath(); ctx.arc(cx+1,cy-46,2.2+pulse*0.4,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // Status LEDs on left face
    const l1=Math.sin(f*0.10)>0, l2=Math.sin(f*0.17+1.5)>0.2;
    ctx.fillStyle=l1&&built?`rgba(255,${(138*pulse)|0},0,0.95)`:`rgba(${(40*a)|0},${(20*a)|0},0,0.7)`;
    ctx.beginPath(); ctx.arc(cx-5,cy-12,1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=l2&&built?`rgba(0,${(195*pulse)|0},${(255*pulse)|0},0.95)`:`rgba(0,${(18*a)|0},${(30*a)|0},0.7)`;
    ctx.beginPath(); ctx.arc(cx-5,cy-19,1.8,0,Math.PI*2); ctx.fill();
    // Dangling cable off top-left
    ctx.strokeStyle=`rgba(0,${(175*a)|0},${(255*a)|0},0.52)`; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.moveTo(cx-8,cy-32); ctx.bezierCurveTo(cx-13,cy-24,cx-14,cy-13,cx-11,cy-7); ctx.stroke();
}

// ── DNA Sequencer: bio-extraction vat ───────────────────────
function _campDnaSeq(cx, cy, a, pulse, built) {
    const f = frame || 0;
    // Flanged base
    _cBox(cx, cy, 10, 3, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Cylinder body (rect + ellipse caps)
    ctx.fillStyle=_gmRight(a);
    ctx.fillRect(cx-7,cy-3-26,14,26);
    ctx.strokeStyle=_gmEdge(a); ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(cx-7,cy-3); ctx.lineTo(cx-7,cy-29); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+7,cy-3); ctx.lineTo(cx+7,cy-29); ctx.stroke();
    // Strap bands (3 horizontal rings)
    [cy-10, cy-17, cy-24].forEach(by => {
        ctx.fillStyle=`rgba(${(55*a)|0},${(52*a)|0},${(40*a)|0},0.9)`;
        ctx.fillRect(cx-7,by,14,2);
        ctx.strokeStyle=`rgba(${(80*a)|0},${(76*a)|0},${(58*a)|0},0.8)`; ctx.lineWidth=0.6;
        ctx.strokeRect(cx-7,by,14,2);
    });
    // Bottom ellipse rim
    ctx.fillStyle=`rgb(${(36*a)|0},${(38*a)|0},${(45*a)|0})`;
    ctx.beginPath(); ctx.ellipse(cx,cy-3,7,3,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=_gmEdge(a); ctx.lineWidth=0.7; ctx.stroke();
    // Pressure gauge on front
    ctx.fillStyle=`rgba(${(16*a)|0},${(16*a)|0},${(20*a)|0},0.9)`;
    ctx.strokeStyle=`rgba(${(62*a)|0},${(66*a)|0},${(80*a)|0},0.8)`; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.arc(cx,cy-15,4,0,Math.PI*2); ctx.fill(); ctx.stroke();
    const needle = built ? -Math.PI*0.5+pulse*0.85 : -Math.PI*0.8;
    ctx.strokeStyle=built?`rgba(${(255*a*pulse)|0},${(155*a*pulse)|0},0,0.9)`:`rgba(${(58*a)|0},${(56*a)|0},${(42*a)|0},0.7)`;
    ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(cx,cy-15); ctx.lineTo(cx+Math.cos(needle)*3.2,cy-15+Math.sin(needle)*3.2); ctx.stroke();
    // Vent pipes (asymmetric: left short elbow, right tall)
    ctx.strokeStyle=`rgba(${(55*a)|0},${(52*a)|0},${(40*a)|0},0.9)`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx-9,cy-8); ctx.lineTo(cx-12,cy-8); ctx.lineTo(cx-12,cy-18); ctx.stroke();
    ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(cx+9,cy-10); ctx.lineTo(cx+13,cy-10); ctx.lineTo(cx+13,cy-26); ctx.stroke();
    ctx.fillStyle=`rgb(${(44*a)|0},${(42*a)|0},${(32*a)|0})`;
    ctx.fillRect(cx-14,cy-20,4,2); ctx.fillRect(cx+11,cy-28,5,2);
    // Top cap with glow
    if (built) { ctx.shadowColor='#cc44ff'; ctx.shadowBlur=8*pulse; }
    ctx.fillStyle = built
        ? `rgba(${(175*pulse)|0},${(55*a*pulse)|0},${(255*pulse)|0},0.95)`
        : `rgb(${(34*a)|0},${(36*a)|0},${(44*a)|0})`;
    ctx.beginPath(); ctx.ellipse(cx,cy-29,7,3,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=_gmEdge(a); ctx.lineWidth=0.8; ctx.stroke();
    ctx.shadowBlur=0;
    // Vent tip glow (built)
    if (built) {
        ctx.shadowColor='#cc44ff'; ctx.shadowBlur=4*pulse;
        ctx.fillStyle=`rgba(${(145*pulse)|0},${(38*pulse)|0},${(215*pulse)|0},0.7)`;
        ctx.beginPath(); ctx.arc(cx+13,cy-27,1.5,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
    }
}

// ── Fabricator: salvage fabrication station ──────────────────
function _campFabricator(cx, cy, a, pulse, built) {
    const f = frame || 0;
    // Wide base
    _cBox(cx, cy, 13, 4, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Workbench surface (slightly warm-tinted top)
    _cBox(cx, cy-4, 11, 6,
        `rgb(${(46*a)|0},${(43*a)|0},${(38*a)|0})`,
        _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Hazard stripes on bench top face
    ctx.save();
    ctx.translate(cx, cy-10);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(11,-5.5); ctx.lineTo(0,-11); ctx.lineTo(-11,-5.5); ctx.closePath(); ctx.clip();
    _hazardStripes(a); ctx.restore();
    // Parts bin on left side of surface
    ctx.fillStyle=_gmRight(a); ctx.strokeStyle=_gmEdge(a); ctx.lineWidth=0.6;
    ctx.fillRect(cx-10,cy-12,5,4); ctx.strokeRect(cx-10,cy-12,5,4);
    // Crane arm — vertical post (right, welded pipe look)
    ctx.strokeStyle=`rgba(${(62*a)|0},${(62*a)|0},${(74*a)|0},0.9)`; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(cx+7,cy-10); ctx.lineTo(cx+7,cy-34); ctx.stroke();
    // Elbow joint knuckle
    ctx.fillStyle=`rgba(${(56*a)|0},${(53*a)|0},${(40*a)|0},0.95)`;
    ctx.beginPath(); ctx.arc(cx+7,cy-34,2.6,0,Math.PI*2); ctx.fill();
    // Horizontal beam (slightly angled — janky)
    ctx.strokeStyle=`rgba(${(60*a)|0},${(60*a)|0},${(72*a)|0},0.9)`; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(cx+7,cy-34); ctx.lineTo(cx-6,cy-32); ctx.stroke();
    // End-effector (tool head)
    ctx.fillStyle=`rgba(${(70*a)|0},${(66*a)|0},${(52*a)|0},0.97)`;
    ctx.strokeStyle=`rgba(${(92*a)|0},${(86*a)|0},${(65*a)|0},0.8)`; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.arc(cx-6,cy-32,3.5,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Arc sparks (built)
    if (built) {
        ctx.shadowColor='#00ccff'; ctx.shadowBlur=9*pulse;
        ctx.strokeStyle=`rgba(0,${(195*pulse)|0},${(255*pulse)|0},0.9)`; ctx.lineWidth=0.9;
        const sp=f*0.2;
        ctx.beginPath(); ctx.moveTo(cx-6,cy-32); ctx.lineTo(cx-6+Math.cos(sp)*5.5,cy-32+Math.sin(sp)*3.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-6,cy-32); ctx.lineTo(cx-6+Math.cos(sp+2.2)*4.5,cy-32+Math.sin(sp+2.2)*3); ctx.stroke();
        ctx.shadowBlur=0;
    }
    // Two power cables off the back-right
    ctx.strokeStyle=`rgba(${(255*a)|0},${(118*a)|0},0,0.48)`; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.moveTo(cx+6,cy-10); ctx.bezierCurveTo(cx+10,cy-4,cx+12,cy,cx+10,cy+3); ctx.stroke();
    ctx.strokeStyle=`rgba(0,${(175*a)|0},${(255*a)|0},0.48)`; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.moveTo(cx+8,cy-10); ctx.bezierCurveTo(cx+13,cy-5,cx+14,cy,cx+12,cy+3); ctx.stroke();
    _rivet(cx+2,cy-6,a); _rivet(cx-2,cy-8,a);
}

// ── Power Conduit: jury-rigged converter tower ───────────────
function _campPowerCon(cx, cy, a, pulse, built) {
    const f = frame || 0;
    // Base
    _cBox(cx, cy, 8, 4, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Converter body (squat box)
    _cBox(cx, cy-4, 6, 16, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Hazard stripes on right face
    ctx.save();
    ctx.translate(cx, cy-4);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(6,-3); ctx.lineTo(6,-3-16); ctx.lineTo(0,-16); ctx.closePath(); ctx.clip();
    _hazardStripes(a); ctx.restore();
    // Three output tubes (different heights — janky salvage)
    [[-5,22],[-1,28],[4,18]].forEach(([ox,th]) => {
        ctx.strokeStyle=_gmEdge(a); ctx.lineWidth=2.3;
        ctx.beginPath(); ctx.moveTo(cx+ox,cy-20); ctx.lineTo(cx+ox,cy-20-th); ctx.stroke();
        // Ring collar
        ctx.strokeStyle=`rgba(${(78*a)|0},${(74*a)|0},${(56*a)|0},0.8)`; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(cx+ox-2,cy-20-th+4); ctx.lineTo(cx+ox+2,cy-20-th+4); ctx.stroke();
        // Tube cap plate
        ctx.fillStyle=`rgb(${(44*a)|0},${(42*a)|0},${(32*a)|0})`;
        ctx.fillRect(cx+ox-2,cy-20-th-1,4,2);
        if (built) {
            ctx.shadowColor='#ffdd00'; ctx.shadowBlur=5*pulse;
            ctx.fillStyle=`rgba(${(255*pulse)|0},${(212*pulse)|0},0,0.85)`;
            ctx.beginPath(); ctx.arc(cx+ox,cy-20-th-1,1.6+pulse*0.5,0,Math.PI*2); ctx.fill();
            ctx.shadowBlur=0;
        }
    });
    // Voltage arc between tallest tubes (built)
    if (built) {
        const arc1=Math.sin(f*0.24)*3.5, arc2=Math.cos(f*0.24)*2;
        ctx.shadowColor='#ffdd00'; ctx.shadowBlur=6*pulse;
        ctx.strokeStyle=`rgba(${(255*pulse)|0},${(218*pulse)|0},${(28*pulse)|0},0.88)`; ctx.lineWidth=0.85;
        ctx.beginPath(); ctx.moveTo(cx-1,cy-48); ctx.lineTo(cx-1+arc1,cy-42); ctx.lineTo(cx+4,cy-38); ctx.stroke();
        ctx.shadowBlur=0;
    }
    // Thick cable bundle off base-right
    ctx.strokeStyle=`rgba(${(76*a)|0},${(72*a)|0},${(56*a)|0},0.8)`; ctx.lineWidth=3.2;
    ctx.beginPath(); ctx.moveTo(cx+5,cy-5); ctx.bezierCurveTo(cx+9,cy,cx+10,cy+3,cx+8,cy+4); ctx.stroke();
    _rivet(cx-3,cy-8,a); _rivet(cx-3,cy-16,a);
}

// ── Signal Relay: makeshift dish antenna ─────────────────────
function _campSigRelay(cx, cy, a, pulse, built) {
    const f = frame || 0;
    // Base
    _cBox(cx, cy, 7, 4, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Mast — two mismatched sections (thicker at bottom)
    ctx.strokeStyle=_gmEdge(a); ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(cx,cy-4); ctx.lineTo(cx,cy-18); ctx.stroke();
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx,cy-18); ctx.lineTo(cx-1,cy-30); ctx.stroke();
    // Collar joint
    ctx.fillStyle=`rgb(${(50*a)|0},${(48*a)|0},${(38*a)|0})`;
    ctx.strokeStyle=`rgba(${(75*a)|0},${(72*a)|0},${(55*a)|0},0.8)`; ctx.lineWidth=0.6;
    ctx.fillRect(cx-2,cy-20,4,3); ctx.strokeRect(cx-2,cy-20,4,3);
    // Dish body (slightly asymmetric — dented one side)
    ctx.fillStyle=_gmRight(a);
    ctx.strokeStyle=`rgba(${(60*a)|0},${(64*a)|0},${(75*a)|0},0.8)`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(cx-1,cy-30,12,Math.PI*0.08,Math.PI*0.92,false); ctx.lineTo(cx-1,cy-30); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Dish inner face
    ctx.fillStyle=_gmLeft(a);
    ctx.beginPath(); ctx.arc(cx-1,cy-30,9,Math.PI*0.13,Math.PI*0.87,false); ctx.lineTo(cx-1,cy-30); ctx.closePath(); ctx.fill();
    // Dent scratch marks
    ctx.strokeStyle=`rgba(${(52*a)|0},${(56*a)|0},${(68*a)|0},0.65)`; ctx.lineWidth=0.6;
    ctx.beginPath(); ctx.moveTo(cx+4,cy-22); ctx.lineTo(cx+8,cy-26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+6,cy-24); ctx.lineTo(cx+10,cy-28); ctx.stroke();
    // Focal receiver stub
    if (built) { ctx.shadowColor='#00ff88'; ctx.shadowBlur=5*pulse; }
    ctx.fillStyle = built
        ? `rgba(0,${(238*pulse)|0},${(125*pulse)|0},0.95)`
        : `rgb(${(46*a)|0},${(44*a)|0},${(34*a)|0})`;
    ctx.beginPath(); ctx.arc(cx-1,cy-30,2.6+pulse*0.4,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // Signal rings (built)
    if (built) {
        for (let r=1; r<=3; r++) {
            const rp=(((f)*0.025+r*0.38)%1.0);
            ctx.save(); ctx.globalAlpha=(1-rp)*0.45*pulse;
            ctx.strokeStyle='#00ff88'; ctx.lineWidth=0.9;
            ctx.beginPath(); ctx.arc(cx-1,cy-30,r*7*rp+3,0,Math.PI*2); ctx.stroke();
            ctx.restore();
        }
    }
    // Guy-wires (tension cables to base)
    ctx.strokeStyle=`rgba(${(54*a)|0},${(52*a)|0},${(40*a)|0},0.65)`; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(cx-1,cy-20); ctx.lineTo(cx-8,cy-7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-1,cy-20); ctx.lineTo(cx+7,cy-7); ctx.stroke();
}

// ── Repair Station: field first-aid cabinet ──────────────────
function _campRepair(cx, cy, a, pulse, built) {
    const f = frame || 0;
    // Base
    _cBox(cx, cy, 10, 4, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Cabinet body
    _cBox(cx, cy-4, 9, 24, _gmTop(a), _gmLeft(a), _gmRight(a), _gmEdge(a));
    // Door panel inset (right face centre)
    ctx.fillStyle=`rgba(${(30*a)|0},${(32*a)|0},${(40*a)|0},0.95)`;
    ctx.strokeStyle=`rgba(${(62*a)|0},${(66*a)|0},${(80*a)|0},0.7)`; ctx.lineWidth=0.7;
    ctx.fillRect(cx+1,cy-8,7,16); ctx.strokeRect(cx+1,cy-8,7,16);
    // Red cross on door
    if (built) { ctx.shadowColor='#ff4444'; ctx.shadowBlur=6*pulse; }
    ctx.strokeStyle = built
        ? `rgba(${(205*pulse)|0},${(38*a)|0},${(38*a)|0},${0.9*pulse})`
        : `rgba(${(80*a)|0},${(22*a)|0},${(22*a)|0},0.7)`;
    ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(cx+4.5,cy-6); ctx.lineTo(cx+4.5,cy+4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+1.5,cy-1); ctx.lineTo(cx+7.5,cy-1); ctx.stroke();
    ctx.shadowBlur=0;
    // Cabinet rivets
    _rivet(cx+2,cy-6,a); _rivet(cx+2,cy+6,a); _rivet(cx+8,cy-6,a); _rivet(cx+8,cy+6,a);
    // Wall-mount brackets on top (two tabs)
    ctx.fillStyle=`rgb(${(50*a)|0},${(48*a)|0},${(38*a)|0})`;
    ctx.strokeStyle=`rgba(${(74*a)|0},${(70*a)|0},${(54*a)|0},0.8)`; ctx.lineWidth=0.6;
    ctx.fillRect(cx-8,cy-28,6,3); ctx.strokeRect(cx-8,cy-28,6,3);
    ctx.fillRect(cx+2,cy-28,6,3); ctx.strokeRect(cx+2,cy-28,6,3);
    // Power cable down left side
    ctx.strokeStyle=`rgba(${(255*a)|0},${(112*a)|0},0,0.48)`; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.moveTo(cx-8,cy-10); ctx.bezierCurveTo(cx-12,cy-5,cx-13,cy,cx-11,cy+3); ctx.stroke();
    // Healing beam (built)
    if (built) {
        ctx.strokeStyle=`rgba(${(255*pulse)|0},${(175*pulse)|0},${(55*pulse)|0},${0.38*pulse})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(cx,cy-28); ctx.lineTo(cx,cy-43); ctx.stroke();
        ctx.shadowColor='#ffcc44'; ctx.shadowBlur=8*pulse;
        ctx.fillStyle=`rgba(${(255*pulse)|0},${(195*pulse)|0},${(75*pulse)|0},0.9)`;
        ctx.beginPath(); ctx.arc(cx,cy-43,2.2+pulse*0.5,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
    }
    // Status light (amber blink)
    const lOn=Math.sin(f*0.11)>0;
    ctx.fillStyle=lOn&&built?`rgba(${(255*pulse)|0},${(138*pulse)|0},0,0.95)`:`rgba(${(40*a)|0},${(20*a)|0},0,0.7)`;
    ctx.beginPath(); ctx.arc(cx-6,cy-17,1.8,0,Math.PI*2); ctx.fill();
}

