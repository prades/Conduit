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

// Fixed tile positions — all along the back wall (y=0) for wall-mounted look
const _CAMP_BLDG_TILES = {
    command_node:   { x: -2, y: 0 },
    power_conduit:  { x: -3, y: 0 },
    repair_station: { x: -4, y: 0 },
    signal_relay:   { x: -5, y: 0 },
    dna_sequencer:  { x: -6, y: 0 },
    fabricator:     { x: -7, y: 0 },
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
    return isCampBuilt("signal_relay") ? 7.0 : 5.0;
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

// ── HOME NODE — central camp hub structure ─────────────────
// Drawn over tile x=-1, y=2 (between crystal and camp buildings).
// Tapping it opens the camp building menu.
const HOME_NODE_TILE = { x: -1, y: 2 };

function drawHomeNode(tcx, tcy, amb) {
    const pulse = 0.6 + 0.4 * Math.sin((frame || 0) * 0.06);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ── Base platform ──
    const bw = 20, bh = 5;
    ctx.fillStyle   = `rgba(0,${(50*amb)|0},${(22*amb)|0},0.95)`;
    ctx.strokeStyle = `rgba(0,${(200*amb)|0},${(90*amb)|0},0.8)`;
    ctx.lineWidth   = 1.2;
    ctx.fillRect(tcx - bw, tcy - bh, bw * 2, bh);
    ctx.strokeRect(tcx - bw, tcy - bh, bw * 2, bh);

    // Base corner vias
    [[tcx - bw + 4, tcy - bh + 2], [tcx + bw - 4, tcy - bh + 2]].forEach(([vx, vy]) => {
        ctx.fillStyle   = `rgba(200,140,30,${0.7 * amb})`;
        ctx.beginPath(); ctx.arc(vx, vy, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(0,200,80,${0.5 * amb})`;
        ctx.lineWidth   = 0.7;
        ctx.beginPath(); ctx.arc(vx, vy, 3.5, 0, Math.PI * 2); ctx.stroke();
    });

    // ── Column body ──
    const colW = 14, colH = 42;
    const colTop = tcy - bh - colH;
    ctx.fillStyle   = `rgba(2,${(20*amb)|0},${(10*amb)|0},0.97)`;
    ctx.strokeStyle = `rgba(0,${(160*amb)|0},${(65*amb)|0},0.7)`;
    ctx.lineWidth   = 1;
    ctx.fillRect(tcx - colW / 2, colTop, colW, colH);
    ctx.strokeRect(tcx - colW / 2, colTop, colW, colH);

    // PCB traces on column
    ctx.strokeStyle = `rgba(0,${(180*amb)|0},${(70*amb)|0},0.35)`;
    ctx.lineWidth   = 0.7;
    [10, 22, 33].forEach(yOff => {
        ctx.beginPath();
        ctx.moveTo(tcx - colW / 2 + 2, colTop + yOff);
        ctx.lineTo(tcx + colW / 2 - 2, colTop + yOff);
        ctx.stroke();
    });
    // Vertical centre trace
    ctx.beginPath();
    ctx.moveTo(tcx, colTop + 4);
    ctx.lineTo(tcx, colTop + colH - 6);
    ctx.stroke();

    // ── Glowing orb at top ──
    ctx.shadowColor = "#00ff80";
    ctx.shadowBlur  = (10 + 8 * pulse) * amb;
    ctx.fillStyle   = `rgba(0,${(255*amb*pulse)|0},${(128*amb*pulse)|0},0.9)`;
    ctx.beginPath(); ctx.arc(tcx, colTop, 5 + pulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur  = 0;

    // Orb ring
    ctx.strokeStyle = `rgba(0,255,128,${0.5 * amb * pulse})`;
    ctx.lineWidth   = 0.8;
    ctx.beginPath(); ctx.arc(tcx, colTop, 9, 0, Math.PI * 2); ctx.stroke();

    // ── Labels ──
    ctx.fillStyle = `rgba(0,255,128,${0.9 * amb * pulse})`;
    ctx.font      = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("HOME", tcx, colTop - 12);

    ctx.fillStyle = `rgba(0,180,80,${0.45 * amb})`;
    ctx.font      = "7px monospace";
    ctx.fillText("[ tap ]", tcx, colTop - 3);

    ctx.restore();
}

// ── CAMP FLOOR DRAWING (circuit-board PCB style) ──────────
// Called instead of the regular floor draw for tiles with x < 0.
function drawCampFloor(obj, px, py, amb) {
    const txi = Math.round(obj.x);
    const tyi = Math.round(obj.y);
    const tcx = px;          // isometric tile top-vertex x
    const tcy = py + TILE_H; // tile center y (middle of diamond)

    // ── Board fill — deep PCB green-black ──
    const bR = (5  * amb) | 0;
    const bG = (16 * amb) | 0;
    const bB = (9  * amb) | 0;
    ctx.fillStyle = `rgb(${bR},${bG},${bB})`;
    ctx.beginPath();
    ctx.moveTo(px,          py);
    ctx.lineTo(px + TILE_W, py + TILE_H);
    ctx.lineTo(px,          py + TILE_W);
    ctx.lineTo(px - TILE_W, py + TILE_H);
    ctx.closePath();
    ctx.fill();

    // ── Bevel (darker green edges) ──
    ctx.strokeStyle = `rgba(0,50,20,${0.6 * amb})`;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px - TILE_W + 1, py + TILE_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px + TILE_W - 1, py + TILE_H); ctx.stroke();
    ctx.strokeStyle = `rgba(0,0,0,${0.4 * amb})`;
    ctx.beginPath(); ctx.moveTo(px - TILE_W + 1, py + TILE_H); ctx.lineTo(px, py + TILE_W - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + TILE_W - 1, py + TILE_H); ctx.lineTo(px, py + TILE_W - 1); ctx.stroke();

    ctx.save();

    // ── Green trace lines ──
    ctx.lineWidth = 0.8;
    // NW→SE trace (world x-axis)
    ctx.globalAlpha = 0.30 * amb;
    ctx.strokeStyle = "#00dc50";
    ctx.beginPath(); ctx.moveTo(tcx - 30, tcy - 15); ctx.lineTo(tcx + 30, tcy + 15); ctx.stroke();
    // NE→SW trace (world y-axis)
    ctx.globalAlpha = 0.25 * amb;
    ctx.strokeStyle = "#00a040";
    ctx.beginPath(); ctx.moveTo(tcx + 30, tcy - 15); ctx.lineTo(tcx - 30, tcy + 15); ctx.stroke();

    // Junction stub (horizontal T-off at center)
    ctx.globalAlpha = 0.18 * amb;
    ctx.strokeStyle = "#00cc44";
    ctx.lineWidth   = 0.6;
    ctx.beginPath(); ctx.moveTo(tcx, tcy - 8); ctx.lineTo(tcx, tcy + 8); ctx.stroke();

    // ── Copper via pad at center ──
    const viaPhase = 0.5 + 0.5 * Math.sin((frame || 0) * 0.04 + txi * 1.7 + tyi * 0.9);
    ctx.globalAlpha = 0.4 * amb * viaPhase;
    ctx.fillStyle   = "#c88c1e";
    ctx.beginPath(); ctx.arc(tcx, tcy, 2.8, 0, Math.PI * 2); ctx.fill();

    // Via ring glow
    ctx.globalAlpha = 0.22 * amb * viaPhase;
    ctx.strokeStyle = "#00ff50";
    ctx.lineWidth   = 0.7;
    ctx.beginPath(); ctx.arc(tcx, tcy, 5.5, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();

    // ── Camp building 3D asset on this tile ──
    const _campBldgHere = CAMP_BUILDINGS.find(b => {
        const t = _CAMP_BLDG_TILES[b.id];
        return t && t.x === txi && t.y === tyi;
    });
    if (_campBldgHere) _drawCampBuilding3D(_campBldgHere, tcx, tcy, amb);

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
    ctx.globalAlpha = (built ? 1.0 : 0.32) * amb;

    switch (bldg.id) {
        case 'command_node':   _campCmdNode(tcx, tcy, pulse, built);    break;
        case 'dna_sequencer':  _campDnaSeq(tcx, tcy, pulse, built);     break;
        case 'fabricator':     _campFabricator(tcx, tcy, pulse, built); break;
        case 'power_conduit':  _campPowerCon(tcx, tcy, pulse, built);   break;
        case 'signal_relay':   _campSigRelay(tcx, tcy, pulse, built);   break;
        case 'repair_station': _campRepair(tcx, tcy, pulse, built);     break;
    }

    // Label above structure
    ctx.globalAlpha = (built ? 0.9 : 0.45) * amb;
    ctx.fillStyle   = built ? '#00ff80' : '#00aa44';
    ctx.font        = 'bold 7px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText(bldg.label.split(' ')[0].toUpperCase(), tcx, tcy - 48);
    if (!built) {
        ctx.globalAlpha = 0.38 * amb;
        ctx.fillStyle   = '#007733';
        ctx.font        = '7px monospace';
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

// ── Command Node: neural server rack ──────────────────────────
function _campCmdNode(cx, cy, pulse, built) {
    const g = built ? pulse : 0.6;
    // Base slab
    _cBox(cx, cy, 10, 4, '#002a10', '#001808', '#001e0c', `rgba(0,180,80,${0.6*g})`);
    // Cabinet body
    _cBox(cx, cy - 4, 8, 28,
        `rgba(0,${(80*g)|0},${(35*g)|0},0.95)`,
        '#001208', '#001c0a', `rgba(0,200,80,${0.6*g})`);
    // Screen rows (on right/front face)
    for (let i = 0; i < 4; i++) {
        const sy = cy - 10 - i * 6;
        ctx.fillStyle = built
            ? `rgba(0,${(200 + 55*Math.sin((frame||0)*0.12+i))|0},100,0.7)`
            : 'rgba(0,60,28,0.5)';
        ctx.fillRect(cx - 5, sy, 10, 2);
    }
    // Antenna spire
    ctx.strokeStyle = `rgba(0,${(220*g)|0},${(100*g)|0},0.8)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy - 46); ctx.stroke();
    if (built) {
        ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 7 * pulse;
        ctx.fillStyle = `rgba(0,255,128,${0.9*pulse})`;
        ctx.beginPath(); ctx.arc(cx, cy - 46, 2.5 + pulse * 0.5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = 'rgba(0,80,36,0.6)';
        ctx.beginPath(); ctx.arc(cx, cy - 46, 2, 0, Math.PI*2); ctx.fill();
    }
    // Copper corner vias on base
    [cx - 8, cx + 8].forEach(vx => {
        ctx.fillStyle = `rgba(190,140,30,${0.6*g})`;
        ctx.beginPath(); ctx.arc(vx, cy - 2, 1.8, 0, Math.PI*2); ctx.fill();
    });
}

// ── DNA Sequencer: spiral helix tube ────────────────────────
function _campDnaSeq(cx, cy, pulse, built) {
    const g = built ? pulse : 0.6;
    _cBox(cx, cy, 9, 3, '#002a12', '#001808', '#001c0c', `rgba(0,180,80,${0.5*g})`);
    // Cylinder body
    ctx.fillStyle = `rgba(0,${(45*g)|0},${(20*g)|0},0.92)`;
    ctx.fillRect(cx - 7, cy - 3 - 26, 14, 26);
    ctx.strokeStyle = `rgba(0,${(150*g)|0},${(65*g)|0},0.65)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 7, cy - 3); ctx.lineTo(cx - 7, cy - 29); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 7, cy - 3); ctx.lineTo(cx + 7, cy - 29); ctx.stroke();
    // Bottom ellipse
    ctx.fillStyle = `rgba(0,${(35*g)|0},${(16*g)|0},0.9)`;
    ctx.beginPath(); ctx.ellipse(cx, cy - 3, 7, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(0,${(140*g)|0},${(60*g)|0},0.6)`;
    ctx.lineWidth = 0.7; ctx.stroke();
    // DNA helix strands
    for (let i = 0; i < 4; i++) {
        const t2 = ((frame||0) * 0.04 + i * 0.75) % (Math.PI * 2);
        const fy = cy - 8 - i * 5;
        const x1 = cx + Math.cos(t2) * 5.5;
        const x2 = cx + Math.cos(t2 + Math.PI) * 5.5;
        ctx.strokeStyle = `rgba(0,${(210+30*Math.sin(t2))|0},100,${0.6*g})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(cx - 5.5, fy);
        ctx.bezierCurveTo(x1, fy - 2, x2, fy - 3, cx + 5.5, fy - 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 5.5, fy);
        ctx.bezierCurveTo(x2, fy - 2, x1, fy - 3, cx - 5.5, fy - 5); ctx.stroke();
    }
    // Top cap ellipse
    ctx.fillStyle = built
        ? `rgba(0,${(255*pulse)|0},${(120*pulse)|0},0.85)`
        : 'rgba(0,100,45,0.6)';
    if (built) { ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 8 * pulse; }
    ctx.beginPath(); ctx.ellipse(cx, cy - 29, 7, 3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = `rgba(0,${(180*g)|0},${(80*g)|0},0.7)`;
    ctx.lineWidth = 0.7; ctx.stroke();
    ctx.shadowBlur = 0;
}

// ── Fabricator: workbench with articulated arm ───────────────
function _campFabricator(cx, cy, pulse, built) {
    const g = built ? pulse : 0.6;
    // Wide base
    _cBox(cx, cy, 13, 5, '#002010', '#001206', '#001808', `rgba(0,160,70,${0.5*g})`);
    // Work surface
    _cBox(cx, cy - 5, 11, 8,
        `rgba(0,${(58*g)|0},${(25*g)|0},0.9)`,
        '#001006', '#001606', `rgba(0,180,70,${0.55*g})`);
    // Arm vertical post
    ctx.strokeStyle = `rgba(0,${(180*g)|0},${(80*g)|0},0.85)`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 5, cy - 13); ctx.lineTo(cx + 5, cy - 34); ctx.stroke();
    // Arm horizontal beam
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx + 5, cy - 34); ctx.lineTo(cx - 5, cy - 34); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy - 34); ctx.lineTo(cx - 5, cy - 27); ctx.stroke();
    // Tool head (copper)
    ctx.fillStyle = `rgba(190,140,30,${0.75*g})`;
    ctx.beginPath(); ctx.arc(cx - 5, cy - 25, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(0,${(180*g)|0},${(80*g)|0},0.55)`;
    ctx.lineWidth = 0.7; ctx.stroke();
    // Elemental crystal on work surface (only when built)
    if (built) {
        ctx.shadowColor = '#00ccff'; ctx.shadowBlur = 6 * pulse;
        ctx.fillStyle = `rgba(0,${(200*pulse)|0},${(255*pulse)|0},0.85)`;
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - 13); ctx.lineTo(cx, cy - 18);
        ctx.lineTo(cx + 3, cy - 13); ctx.lineTo(cx, cy - 8);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ── Power Conduit: capacitor fin tower ──────────────────────
function _campPowerCon(cx, cy, pulse, built) {
    const g = built ? pulse : 0.6;
    _cBox(cx, cy, 7, 4, '#002a10', '#001808', '#001e0c', `rgba(0,180,80,${0.5*g})`);
    // Central core column
    _cBox(cx, cy - 4, 4, 30,
        `rgba(0,${(100*g)|0},${(45*g)|0},0.95)`,
        '#001a08', '#002010', `rgba(0,220,90,${0.6*g})`);
    // Capacitor fins (3 pairs)
    [[cy - 10, 10], [cy - 18, 12], [cy - 26, 9]].forEach(([fy, fw]) => {
        ctx.fillStyle = `rgba(0,${(55*g)|0},${(25*g)|0},0.85)`;
        ctx.strokeStyle = `rgba(0,${(160*g)|0},${(70*g)|0},${0.6*g})`;
        ctx.lineWidth = 0.8;
        // Left fin
        ctx.beginPath();
        ctx.moveTo(cx - 4, fy);      ctx.lineTo(cx - 4 - fw, fy - fw * 0.35);
        ctx.lineTo(cx - 4 - fw, fy - 4 - fw * 0.35); ctx.lineTo(cx - 4, fy - 4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Right fin
        ctx.beginPath();
        ctx.moveTo(cx + 4, fy);      ctx.lineTo(cx + 4 + fw, fy - fw * 0.35);
        ctx.lineTo(cx + 4 + fw, fy - 4 - fw * 0.35); ctx.lineTo(cx + 4, fy - 4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    // Energy core at top
    if (built) {
        ctx.shadowColor = '#ffee00'; ctx.shadowBlur = 10 * pulse;
        ctx.fillStyle = `rgba(255,${(200*pulse)|0},0,${0.9*pulse})`;
        ctx.beginPath(); ctx.arc(cx, cy - 34, 3 + pulse * 0.8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        // Arc sparks
        ctx.strokeStyle = `rgba(255,${(220*pulse)|0},0,${0.55*pulse})`;
        ctx.lineWidth = 0.9;
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 34);
            ctx.lineTo(cx + side * 5, cy - 27);
            ctx.lineTo(cx + side * 11, cy - 18);
            ctx.stroke();
        });
    } else {
        ctx.fillStyle = 'rgba(80,60,0,0.55)';
        ctx.beginPath(); ctx.arc(cx, cy - 34, 2, 0, Math.PI*2); ctx.fill();
    }
}

// ── Signal Relay: dish antenna on mast ──────────────────────
function _campSigRelay(cx, cy, pulse, built) {
    const g = built ? pulse : 0.6;
    _cBox(cx, cy, 7, 4, '#002212', '#001408', '#001c0c', `rgba(0,160,80,${0.5*g})`);
    // Mast
    ctx.strokeStyle = `rgba(0,${(160*g)|0},${(72*g)|0},0.85)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy - 28); ctx.stroke();
    // Dish (arc pointing up-left, facing back wall)
    ctx.fillStyle = `rgba(0,${(50*g)|0},${(22*g)|0},0.9)`;
    ctx.strokeStyle = `rgba(0,${(200*g)|0},${(88*g)|0},0.75)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 12, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.lineTo(cx, cy - 28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Dish inner face (lighter)
    ctx.fillStyle = `rgba(0,${(75*g)|0},${(38*g)|0},0.7)`;
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 9, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.lineTo(cx, cy - 28);
    ctx.closePath(); ctx.fill();
    // Focal point
    ctx.fillStyle = `rgba(0,${(255*g)|0},${(128*g)|0},${0.85*g})`;
    ctx.beginPath(); ctx.arc(cx, cy - 28, 2, 0, Math.PI*2); ctx.fill();
    // Signal rings (animated, only when built)
    if (built) {
        ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 5 * pulse;
        for (let r = 1; r <= 3; r++) {
            const rp = (((frame||0) * 0.025 + r * 0.38) % 1.0);
            ctx.save();
            ctx.globalAlpha = (1 - rp) * 0.45 * pulse;
            ctx.strokeStyle = '#00ff80';
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(cx, cy - 28, r * 7 * rp + 3, 0, Math.PI*2); ctx.stroke();
            ctx.restore();
        }
        ctx.shadowBlur = 0;
    }
}

// ── Repair Station: medical pod ──────────────────────────────
function _campRepair(cx, cy, pulse, built) {
    const g = built ? pulse : 0.6;
    _cBox(cx, cy, 10, 4, '#002215', '#001410', '#001c12', `rgba(0,160,100,${0.5*g})`);
    // Pod body
    _cBox(cx, cy - 4, 9, 22,
        `rgba(0,${(55*g)|0},${(30*g)|0},0.92)`,
        '#001008', '#001c10', `rgba(0,180,90,${0.55*g})`);
    // Dome top cap (ellipse)
    ctx.fillStyle = `rgba(0,${(78*g)|0},${(45*g)|0},0.88)`;
    ctx.strokeStyle = `rgba(0,${(200*g)|0},${(110*g)|0},${0.55*g})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(cx, cy - 26, 9, 4, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // Medical cross (front face of pod)
    const crossA = built ? 0.9 * pulse : 0.35;
    ctx.fillStyle = `rgba(0,${(255*g)|0},${(140*g)|0},${crossA})`;
    if (built) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 7 * pulse; }
    ctx.fillRect(cx - 2, cy - 22, 4, 10); // vertical
    ctx.fillRect(cx - 5, cy - 19, 10, 4); // horizontal
    ctx.shadowBlur = 0;
    // Healing beam + orb when built
    if (built) {
        ctx.strokeStyle = `rgba(0,255,160,${0.4*pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 44); ctx.stroke();
        ctx.shadowColor = '#00ffaa'; ctx.shadowBlur = 8 * pulse;
        ctx.fillStyle = `rgba(0,255,160,${0.75*pulse})`;
        ctx.beginPath(); ctx.arc(cx, cy - 44, 2.5 + pulse * 0.5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    }
}
