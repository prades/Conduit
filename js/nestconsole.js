// ─────────────────────────────────────────────────────────
//  THE ANT NEST'S TEST CONSOLE (docs/NEST.md, step C, build 2026-11-07nn): the boss reset, the test squad, the damage meter
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-07): "I want to use it to test the player and squad combinations and different moves against a boss ant that's huge"; the console's tools: "Damage meter, Boss reset, Squad builder";
// the squad builder: "Temporary test squad": any form, element and level for three test followers that exist only in the Nest and vanish when you leave; your real squad waits outside, untouched.
//   THE CONSOLE    a station in the Nest (STATION_KINDS.nest_console, js/stations.js; the prop `nest_console`, js/facilitymap.js): using it opens this panel (a DOM panel, #nestConsole).
//   BOSS RESET     THE ANT QUEEN at a level you pick (1 to 30), whole, asleep at her post; whatever was left of her and her brood is cleared (js/bosses.js: the encounter's `level`). The meter starts again.
//   TEST SQUAD     three slots, each any form (every element's Brawler, Mage and Technician, and every evolved form) at any level (1 to 30). SEND IN: your squad (the followers following you, not those holding a
//                  room) is set aside, untouched (out of the world; still in your save), and the three test followers come in beside you as your squad. They are never saved, never revived (one that falls is gone),
//                  and they vanish when you leave the Nest or END THE TEST; then your squad is back beside you as it was.
//   DAMAGE METER   what each of yours has dealt to the creatures of the Nest since the meter started (the queen's reset, or RESET), split by kind: P its primary (everyday hit or shot), A its alternate, S its special
//                  (a card attack or an Ultimate), and yours; with damage a second over the fight. Shown on the screen while you are in the Nest and it is on.
// Every number here (the levels' range, the default picks) is the agent's, provisional.
const NEST_CONSOLE = { room: "nest_area", boss: "nest", levels: [1, 30], picks: [["quillstone", 15], ["thunderhead", 15], ["hammerslug", 15]] };

function _ncState() {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.nestc) _fp.nestc = { level: null, picks: NEST_CONSOLE.picks.map(([form, level]) => ({ form, level })), stash: null, test: false, meter: { on: true, t0: 0, last: 0, rows: new Map() } };
    return _fp.nestc;
}
function _ncClamp(n) { const [a, b] = NEST_CONSOLE.levels; n = Math.round(Number(n)); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a; }
function _ncInNest(x, y) { return typeof partyRoomAt === "function" && partyRoomAt(x, y) === NEST_CONSOLE.room; }
function nestQueenLevel() { const S = typeof bossState === "function" ? bossState(NEST_CONSOLE.boss) : null, E = typeof bossEnc === "function" ? bossEnc(NEST_CONSOLE.boss) : null; return (S && S.level) || (E && E.level) || 1; }

// ── the forms a test follower can take: every element's three classes, and every evolved form (not the retired ones) ──
function nestForms() {
    const out = [], roleName = r => r === "sniper" ? "MAGE" : r === "camper" ? "TECHNICIAN" : "BRAWLER";
    for (const id of Object.keys(typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS : {})) { const d = EVOLUTIONS[id]; if (!d || d.legacy || !d.element || !d.role) continue; out.push({ id, element: d.element, role: d.role, evolved: id, name: d.name + " · " + String(d.element).toUpperCase() + " " + roleName(d.role) }); }
    for (const el of (typeof ELEMENTS !== "undefined" ? ELEMENTS : [])) for (const role of ["brawler", "sniper", "camper"]) out.push({ id: el.id + ":" + role, element: el.id, role, evolved: null, name: el.label + " " + roleName(role) + " (UNEVOLVED)" });
    return out;
}
function _ncForm(id) { return nestForms().find(f => f.id === id) || null; }

// ── BOSS RESET ──
function nestQueenReset(level) {
    if (typeof bossState !== "function") return false;
    const S = bossState(NEST_CONSOLE.boss), q = S && S.unit; if (!S) return false;
    const gone = a => a && (a === q || a.bossWave === NEST_CONSOLE.boss);
    for (const a of (typeof actors !== "undefined" ? actors : [])) if (gone(a)) { a.dead = true; a.deathProcessed = true; a._xpGiven = true; }   // (cleared, not killed: nothing paid, no death processed)
    if (typeof actors !== "undefined") actors = actors.filter(a => !gone(a));
    if (typeof bossShots !== "undefined" && q) bossShots = bossShots.filter(s => s.by !== q);
    S.level = _ncClamp(level === undefined ? nestQueenLevel() : level); S.state = "idle"; S.outcome = null; S.unit = null; S.cast = null;
    const ok = bossArm(NEST_CONSOLE.boss);
    nestMeterReset();
    if (ok && typeof bossSay === "function") bossSay("◈ THE ANT QUEEN · LEVEL " + S.level + " · WHOLE, ASLEEP AT HER POST", "#9dffb6");
    return ok;
}

// ── THE TEST SQUAD ──
function _ncTake(f) {   // out of the world's lists (not killed: nothing about it changes)
    if (typeof actors !== "undefined") { const i = actors.indexOf(f); if (i >= 0) actors.splice(i, 1); }
    if (typeof followers !== "undefined") { const i = followers.indexOf(f); if (i >= 0) followers.splice(i, 1); }
    const L = typeof followerByElement !== "undefined" ? followerByElement[f.element] : null; if (L) { const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); }
    if (typeof selectedUnits !== "undefined" && selectedUnits.delete) selectedUnits.delete(f);
}
function _ncPut(f) {   // back into the world's lists, beside you
    if (typeof actors !== "undefined" && actors.indexOf(f) < 0) actors.push(f);
    if (typeof followers !== "undefined" && followers.indexOf(f) < 0) followers.push(f);
    if (typeof followerByElement !== "undefined") { if (!followerByElement[f.element]) followerByElement[f.element] = []; if (followerByElement[f.element].indexOf(f) < 0) followerByElement[f.element].push(f); }
    f.returningToCrystal = false; f.job = null; f.attackOrder = null; f._fpPath = null;
    if (typeof _pBeside === "function") _pBeside(f); else { f.x = player.x + (Math.random() - 0.5); f.y = player.y + (Math.random() - 0.5); }
}
// the followers set aside while a test squad is in (js/facilitysave.js saves them as they are)
function nestStashed() { const S = typeof _fp !== "undefined" && _fp && _fp.nestc; return S && Array.isArray(S.stash) ? S.stash.slice() : []; }
function nestTestActive() { const S = typeof _fp !== "undefined" && _fp && _fp.nestc; return !!(S && S.test); }
function nestTestSendIn() {
    const S = _ncState(); if (!S) return { ok: false, why: "NO GAME" };
    if (!_ncInNest(player.x, player.y)) return { ok: false, why: "ONLY IN THE ANT NEST" };
    if (S.test) _ncDismissTests();
    if (!S.stash) { S.stash = (typeof partyMembers === "function" ? partyMembers() : []).filter(f => !f.nestTest); for (const f of S.stash) _ncTake(f); }
    const made = [];
    S.picks.forEach((pk, i) => {
        const F = _ncForm(pk.form); if (!F || typeof spawnFollowerAtCrystal !== "function") return;
        spawnFollowerAtCrystal(F.element); const f = followers[followers.length - 1]; if (!f || f.nestTest || made.indexOf(f) >= 0) return;
        f.nestTest = true; f.returningToCrystal = false; f.role = F.role; f.evolved = F.evolved; f.noEvolve = !F.evolved; f._moltAt = -1e9; f.alt = null; f.post = null; f.job = null; f.stance = "follow"; f.spawnProtection = 0;
        f.level = _ncClamp(pk.level); f.xp = 0; if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(f, true); f.health = f.maxHealth;
        if (typeof _pBeside === "function") _pBeside(f); else { f.x = player.x + (i - 1) * 0.8; f.y = player.y + 0.7; }
        made.push(f);
    });
    S.test = made.length > 0;
    if (typeof partyTick === "function") partyTick();
    nestMeterReset();
    return { ok: S.test, msg: "THE TEST SQUAD IS IN · YOUR SQUAD WAITS OUTSIDE", why: "NO TEST FOLLOWER COULD COME IN" };
}
function _ncDismissTests() {
    const tests = (typeof actors !== "undefined" ? actors : []).filter(a => a && a.nestTest).concat((typeof followers !== "undefined" ? followers : []).filter(a => a && a.nestTest));
    for (const f of tests) { if (typeof equipClear === "function" && f.cards) equipClear(f); f.dead = true; f.deathProcessed = true; _ncTake(f); }
    if (typeof respawnQueue !== "undefined") for (let i = respawnQueue.length - 1; i >= 0; i--) if (respawnQueue[i] && respawnQueue[i].nestTest) respawnQueue.splice(i, 1);
}
// END THE TEST (or leave the Nest): the test followers vanish; your squad is back beside you, as it was
function nestTestEnd(why) {
    const S = _fp && _fp.nestc; if (!S || (!S.test && !S.stash)) return false;
    _ncDismissTests();
    if (Array.isArray(S.stash)) for (const f of S.stash) if (f && !f.dead) _ncPut(f);
    S.stash = null; S.test = false;
    if (typeof partyTick === "function") partyTick();
    if (typeof bossSay === "function") bossSay(why === "left" ? "THE TEST SQUAD STAYS BELOW · YOUR SQUAD IS BACK" : "TEST OVER · YOUR SQUAD IS BACK", "#9dffb6");
    return true;
}

// ── THE DAMAGE METER ──
function nestMeterReset() { const S = _ncState(); if (!S) return; S.meter.rows = new Map(); S.meter.t0 = 0; S.meter.last = 0; }
// a hit that landed (js/helpers.js applyDamage): `dealt` is the health it took. One of yours on a creature of the Nest is counted, by who and by kind.
function nestMeterHit(target, dealt, source, hit) {
    if (!(dealt > 0) || !source || !target || target.team === "green" || typeof _fp === "undefined" || !_fp || (_fp.nestc && !_fp.nestc.meter.on)) return;
    const who = source === player || source.isPlayer ? player : (source.team === "green" && (source.isFollower || source.isClone) ? source : null); if (!who) return;
    if (!_ncInNest(target.x, target.y)) return;
    const M = _ncState().meter, f = typeof frame !== "undefined" ? frame : 0;   // (on from the start: the console need not have been opened)
    let r = M.rows.get(who);
    if (!r) { r = { who, total: 0, P: 0, A: 0, S: 0, Y: 0, O: 0 }; M.rows.set(who, r); }
    const k = who === player ? "Y" : hit && hit.which === "alt" ? "A" : hit && hit.which === "special" ? "S" : hit && hit.which === "main" ? "P" : "O";
    r[k] += dealt; r.total += dealt;
    if (!M.t0) M.t0 = f; M.last = f;
}
function _ncName(u) {
    if (u === player) return "YOU";
    const d = u.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[u.evolved] : null;
    return (d ? d.name : (String(u.element || "").toUpperCase() + " " + (u.role === "sniper" ? "MAGE" : u.role === "camper" ? "TECH" : "BRAWLER"))) + (u.nestTest ? " ·T" : "");
}
// the meter's lines, the longest total first: { name, total, dps, P, A, S, Y, secs }
function nestMeterRows() {
    const S = _fp && _fp.nestc; if (!S) return [];
    const M = S.meter, f = typeof frame !== "undefined" ? frame : 0, secs = M.t0 ? Math.max(1, (f - M.t0) / 60) : 0;
    return Array.from(M.rows.values()).sort((a, b) => b.total - a.total).map(r => ({ name: _ncName(r.who), total: Math.round(r.total), dps: secs ? Math.round(r.total / secs * 10) / 10 : 0, P: Math.round(r.P), A: Math.round(r.A), S: Math.round(r.S), Y: Math.round(r.Y), secs }));
}
// on the screen, while you are in the Nest and it is on: under the network panel, top right
function nestMeterDraw() {
    if (typeof ctx === "undefined" || typeof canvas === "undefined" || !canvas || typeof _fp === "undefined" || !_fp || (_fp.nestc && !_fp.nestc.meter.on) || typeof player === "undefined") return;
    if (!_ncInNest(player.x, player.y)) return;
    const rows = nestMeterRows(), W = canvas.width, x = W - 300, y0 = 192, lh = 17, n = Math.min(6, rows.length);
    const secs = rows.length ? rows[0].secs : 0, all = rows.reduce((s, r) => s + r.total, 0), q = typeof bossUnit === "function" ? bossUnit(NEST_CONSOLE.boss) : null;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(5,8,18,0.78)"; ctx.fillRect(x, y0, 288, 30 + Math.max(1, n) * lh); ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y0 + 0.5, 287, 29 + Math.max(1, n) * lh);
    ctx.font = "bold 12px monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#ffb347";
    ctx.fillText("DAMAGE · " + Math.floor(secs / 60) + ":" + String(Math.floor(secs % 60)).padStart(2, "0") + " · " + (secs ? Math.round(all / secs) : 0) + "/S" + (q ? " · QUEEN " + Math.round(Math.max(0, q.health) / q.maxHealth * 100) + "%" : ""), x + 8, y0 + 12);
    ctx.font = "11px monospace";
    if (!rows.length) { ctx.fillStyle = "#8aa0c8"; ctx.fillText("NOTHING DEALT YET", x + 8, y0 + 30); }
    for (let i = 0; i < n; i++) {
        const r = rows[i], y = y0 + 30 + i * lh;
        ctx.fillStyle = "#ffffff"; ctx.textAlign = "left"; ctx.fillText(r.name.slice(0, 18), x + 8, y);
        ctx.fillStyle = "#ffe733"; ctx.textAlign = "right"; ctx.fillText(String(r.total), x + 160, y); ctx.fillText(r.dps + "/S", x + 206, y);
        ctx.fillStyle = "#8fe3ff"; ctx.fillText(r.Y ? "" : "P" + r.P + " A" + r.A + (r.S ? " S" + r.S : ""), x + 284, y);
    }
    ctx.restore();
}

// ── each frame (js/facilitytutorial.js): a test squad ends when you leave the Nest ──
function nestConsoleTick() {
    const S = typeof _fp !== "undefined" && _fp && _fp.nestc; if (!S || typeof player === "undefined") return;
    if ((S.test || S.stash) && !_ncInNest(player.x, player.y)) nestTestEnd("left");
    if (nestConsoleIsOpen() && !_ncInNest(player.x, player.y)) nestConsoleClose();
}

// ── THE PANEL (the station's use: js/stations.js) ──
function nestConsoleIsOpen() { const el = typeof document !== "undefined" ? document.getElementById("nestConsole") : null; return !!(el && el.classList && el.classList.contains("open")); }
function nestConsoleOpen() {
    if (typeof document === "undefined" || !document.body || !_ncState()) return false;
    let root = document.getElementById("nestConsole");
    if (!root) {
        root = document.createElement("div"); root.id = "nestConsole"; root.setAttribute("aria-label", "The Ant Nest's test console"); document.body.appendChild(root);
        root.addEventListener("click", e => { const b = e.target && e.target.closest ? e.target.closest("[data-act]") : null; if (b) { e.stopPropagation(); _ncAct(b.getAttribute("data-act"), b); } });
        root.addEventListener("change", e => { const t = e.target; if (!t || !t.getAttribute) return; const i = Number(t.getAttribute("data-i")), S = _ncState(); if (!S || !S.picks[i]) return; if (t.getAttribute("data-k") === "form") S.picks[i].form = t.value; else S.picks[i].level = _ncClamp(t.value); });
    }
    root.classList.add("open"); _ncRender(); return true;
}
function nestConsoleClose() { const root = typeof document !== "undefined" ? document.getElementById("nestConsole") : null; if (root && root.classList) root.classList.remove("open"); }
function _ncAct(act) {
    const S = _ncState(); if (!S) return;
    if (act === "close") { nestConsoleClose(); return; }
    if (act === "lvl-") S.level = _ncClamp((S.level || nestQueenLevel()) - 1);
    else if (act === "lvl--") S.level = _ncClamp((S.level || nestQueenLevel()) - 5);
    else if (act === "lvl+") S.level = _ncClamp((S.level || nestQueenLevel()) + 1);
    else if (act === "lvl++") S.level = _ncClamp((S.level || nestQueenLevel()) + 5);
    else if (act === "reset") nestQueenReset(S.level || nestQueenLevel());
    else if (act === "send") { const r = nestTestSendIn(); if (typeof invSay === "function") invSay(r.ok ? r.msg : r.why, !!r.ok); }
    else if (act === "end") nestTestEnd("end");
    else if (act === "meter") S.meter.on = !S.meter.on;
    else if (act === "mreset") nestMeterReset();
    _ncRender();
}
function _ncRender() {
    const root = typeof document !== "undefined" ? document.getElementById("nestConsole") : null, S = _ncState(); if (!root || !S) return;
    const B = typeof bossState === "function" ? bossState(NEST_CONSOLE.boss) : null, q = typeof bossUnit === "function" ? bossUnit(NEST_CONSOLE.boss) : null, L = S.level || nestQueenLevel();
    const st = !B ? "—" : q ? (q.bossAsleep ? "ASLEEP" : "AWAKE") + " · LEVEL " + q.level + " · HP " + Math.ceil(Math.max(0, q.health)) + "/" + q.maxHealth : B.state === "resolved" ? "DEFEATED" : "NOT HERE";
    const forms = nestForms(), lvOpts = v => { let s = ""; for (let n = NEST_CONSOLE.levels[0]; n <= NEST_CONSOLE.levels[1]; n++) s += "<option value=\"" + n + "\"" + (n === v ? " selected" : "") + ">LV " + n + "</option>"; return s; };
    const slot = (pk, i) => "<div class=\"nc-slot\"><b>" + (i + 1) + "</b><select data-i=\"" + i + "\" data-k=\"form\">" + forms.map(f => "<option value=\"" + f.id + "\"" + (f.id === pk.form ? " selected" : "") + ">" + f.name + "</option>").join("") + "</select><select data-i=\"" + i + "\" data-k=\"level\">" + lvOpts(pk.level) + "</select></div>";
    const rows = nestMeterRows();
    root.innerHTML =
        "<div class=\"nc-card\"><div class=\"nc-head\"><span>ANT NEST · TEST CONSOLE</span><button data-act=\"close\" class=\"nc-x\" aria-label=\"Close\">✕</button></div>" +
        "<div class=\"nc-sec\"><div class=\"nc-t\">THE ANT QUEEN <i>" + st + "</i></div><div class=\"nc-row\"><button data-act=\"lvl--\">−5</button><button data-act=\"lvl-\">−1</button><span class=\"nc-lv\">LEVEL " + L + "</span><button data-act=\"lvl+\">+1</button><button data-act=\"lvl++\">+5</button><button data-act=\"reset\" class=\"nc-go\">RESET THE QUEEN</button></div><div class=\"nc-note\">Whole, asleep at her post, at the level shown; her brood cleared; the meter starts again.</div></div>" +
        "<div class=\"nc-sec\"><div class=\"nc-t\">TEST SQUAD <i>" + (S.test ? "IN THE NEST" : "NOT SENT") + "</i></div>" + S.picks.map(slot).join("") +
        "<div class=\"nc-row\"><button data-act=\"send\" class=\"nc-go\">" + (S.test ? "SEND IN AGAIN" : "SEND IN THE TEST SQUAD") + "</button>" + (S.test ? "<button data-act=\"end\">END THE TEST · YOUR SQUAD BACK</button>" : "") + "</div><div class=\"nc-note\">Your squad waits outside, untouched, while the test squad is in; it is back when you leave the Nest or end the test. Test followers are never saved and never revived.</div></div>" +
        "<div class=\"nc-sec\"><div class=\"nc-t\">DAMAGE METER <i>" + (S.meter.on ? "ON" : "OFF") + "</i></div><div class=\"nc-row\"><button data-act=\"meter\">" + (S.meter.on ? "TURN OFF" : "TURN ON") + "</button><button data-act=\"mreset\">RESET</button></div>" +
        (rows.length ? "<table class=\"nc-m\"><tr><th></th><th>TOTAL</th><th>/S</th><th>P</th><th>A</th><th>S</th></tr>" + rows.map(r => "<tr><td>" + r.name + "</td><td>" + r.total + "</td><td>" + r.dps + "</td><td>" + (r.Y ? "—" : r.P) + "</td><td>" + (r.Y ? "—" : r.A) + "</td><td>" + (r.Y ? "—" : r.S) + "</td></tr>").join("") + "</table>" : "<div class=\"nc-note\">Nothing dealt yet.</div>") +
        "<div class=\"nc-note\">P its primary (everyday hit or shot) · A its alternate · S its special (a card attack or an Ultimate).</div></div></div>";
}
