// ─────────────────────────────────────────────────────────
//  SETTINGS (a canvas panel), and where a tap on a canvas panel goes
// ─────────────────────────────────────────────────────────
// SETTINGS is the dock's (js/toolbox.js dockSettings) and the phone menu's (js/radialmenu.js): GRAPHICS (high / low: js/config.js toggleGfxLow), PERFORMANCE (the readout: js/game.js), NEW GAME (the saved facility is
// thrown away, after asking: js/facilitysave.js facilityNewGame) and CLOSE. One layout for the drawing and the tap handler, so they cannot drift apart; the rows are slab buttons (js/uikit.js).
// handleOverlayPanelTap is where a tap goes first while a canvas panel is open (js/input.js): the class picker (js/classes.js), the Armory's terminal (js/weapons.js), the pack (js/inventory.js), the INFO panel (js/infodex.js), then this one.
function handleOverlayPanelTap(tx, ty) {
    if (typeof classPickerOpen !== "undefined" && classPickerOpen) return _handleClassPickerTap(tx, ty);
    if (typeof armoryPanelOpen !== "undefined" && armoryPanelOpen) return _handleArmoryTap(tx, ty);
    if (typeof invPanelOpen !== "undefined" && invPanelOpen) return _handleInvPanelTap(tx, ty);
    if (infoPanelOpen)     return _handleInfoPanelTap(tx, ty);
    if (settingsPanelOpen) return _handleSettingsPanelTap(tx, ty);
    return false;
}

const _SP_ROW_H = 60, _SP_ROW_GAP = 12, _SP_HEAD = 84, _SP_PAD = 26;
function _spLayout() {
    const rows = settingsResetConfirm
        ? [{ id: "yes", label: "YES — NEW GAME", sub: "the saved facility is thrown away", col: UI_RED, on: true }, { id: "cancel", label: "CANCEL", col: UI_TEAL }]
        : [{ id: "gfx", label: "GRAPHICS: " + (gfxLow ? "LOW" : "HIGH"), col: UI_GOLD, on: gfxLow },
           { id: "perf", label: "PERFORMANCE: " + (perfReadout ? "ON" : "OFF"), col: UI_ICE, on: perfReadout },
           { id: "reset", label: "NEW GAME", sub: "starts the facility again", col: UI_RED },
           { id: "close", label: "CLOSE", col: "#6a7aa0" }];
    const w = Math.min(canvas.width - 24, 460), h = _SP_HEAD + rows.length * (_SP_ROW_H + _SP_ROW_GAP) + _SP_PAD - _SP_ROW_GAP + 8;
    const x = Math.round((canvas.width - w) / 2), top = uiTopSafe(), y = Math.max(top, Math.round((top + uiBottomSafe() - h) / 2));
    rows.forEach((r, i) => { r.x = x + _SP_PAD; r.w = w - _SP_PAD * 2; r.y = y + _SP_HEAD + i * (_SP_ROW_H + _SP_ROW_GAP); r.h = _SP_ROW_H; });
    return { x, y, w, h, rows, title: settingsResetConfirm ? "START AGAIN?" : "SETTINGS" };
}
function drawSettingsPanel() {
    if (!settingsPanelOpen) return;
    const L = _spLayout();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiBackdrop(0.72);
    uiPanel(L.x, L.y, L.w, L.h, settingsResetConfirm ? UI_RED : UI_TEAL, L.title, 34);
    for (const r of L.rows) uiButton(r, r.label, r.col, !!r.on, 24, r.sub);
    ctx.restore();
}
function _handleSettingsPanelTap(tx, ty) {
    if (!settingsPanelOpen) return false;
    const L = _spLayout();
    if (tx < L.x || tx > L.x + L.w || ty < L.y || ty > L.y + L.h) { settingsPanelOpen = false; settingsResetConfirm = false; return true; }   // a tap outside closes it
    const hit = L.rows.find(r => tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty < r.y + r.h);
    if (!hit) return true;   // (every tap on the panel is the panel's)
    switch (hit.id) {
        case "gfx":    toggleGfxLow(); break;
        case "perf":   togglePerfReadout(); break;
        case "reset":  settingsResetConfirm = true; break;
        case "close":  settingsPanelOpen = false; settingsResetConfirm = false; break;
        case "yes":    settingsPanelOpen = false; settingsResetConfirm = false; if (typeof facilityNewGame === "function") facilityNewGame(); break;
        case "cancel": settingsResetConfirm = false; break;
    }
    return true;
}

// A PHONE has no dock (js/toolbox.js dockHasMenus): a small round button at the right edge opens the panel (js/input.js takes the tap).
const _SETTINGSBTN = { x: 0, y: 0, r: 20 };
function drawSettingsButton() {
    _SETTINGSBTN.x = canvas.width - 22;
    _SETTINGSBTN.y = canvas.height - 150 - (SAFE_BOTTOM || 0);
    const { x, y, r } = _SETTINGSBTN;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = settingsPanelOpen ? "rgba(80,80,80,0.25)" : "rgba(15,15,15,0.88)";
    ctx.strokeStyle = settingsPanelOpen ? "#aaa" : "rgba(100,100,100,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = settingsPanelOpen ? "#ccc" : "rgba(140,140,140,0.8)";
    ctx.font = "14px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("\u2699", x, y);
    ctx.fillStyle = settingsPanelOpen ? "#ccc" : "rgba(120,120,120,0.7)";
    ctx.font = "bold 8px monospace"; ctx.textBaseline = "bottom";
    ctx.fillText("SET", x, y + r + 10);
    ctx.restore();
}
