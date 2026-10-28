// THE TECHNICIANS' ABILITIES and the electric technician's KINETIC LAUNCHER (js/techabilities.js; docs/TECHNICIANS.md).
// ASKED: "Implement the complete Level 1 update [...] The HUD must use the same underlying ability logic as world interactions", then, for the electric technician: "the kinetic launcher should do a set amount of damage to the follower, but
// a more proportionate damage to the enemy. It should also have the map exploration mode as a secondary feature that is permanent, and you need to have some sort of check for a spot where it can be deployed [...] have a little
// notification or highlighted area near the catwalk [...] and have it be clickable, and the player can engage with the electric technician, and he can set up the kinetic launcher."
// The logic runs in the sandbox (stepping the frames the game would); the chip, the prompt and the taps in the real browser (no Chromium: it says so and passes).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page: an electric technician in the squad, its chip, the prompt, a throw by taps on the canvas, a launcher site's label and a tap on it.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, step = function(n){ for (var i = 0; i < n; i++) render(); };
  canvas.setPointerCapture = function(){};   // (a synthetic pointer is not a real one: capturing it throws)
  var tapAt = function(x, y){ var r = canvas.getBoundingClientRect(), cx = r.left + x * r.width / canvas.width, cy = r.top + y * r.height / canvas.height, o = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 7, isPrimary: true };
      canvas.dispatchEvent(new PointerEvent('pointerdown', o)); canvas.dispatchEvent(new PointerEvent('pointerup', o)); };
  var rect = function(e){ if (!e) return null; var b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; selectedUnits.clear();
    var t = followers[0]; t.element = 'electric'; t.role = 'camper'; t.evolved = undefined; step(12); partyTick();
    var chip = $('#squadBar .sb-slot.has-ab .sb-ab');
    out.chip0 = chip ? [chip.textContent, chip.className, $$cards()] : null;
    function $$cards(){ return Array.prototype.slice.call(document.querySelectorAll('#squadBar .sb-slot.has-ab')).length; }
    t._abReadyAt = frame; step(7); partyTick();
    out.chip1 = chip ? chip.textContent : null;
    // an enemy in sight that stands still and does not fight back
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); var e = spawnCreature({ species: 'ant', className: 'tank' }); e.x = player.x + 3.5; e.y = player.y + 1; e.update = function(){}; e.health = e.maxHealth = 5000; e.reflectDamage = 0;
    var g = followers[1]; g.health = g.maxHealth = 400; g.spawnProtection = 0;   // (a big one: no hit takes more than a third of a follower's health, which would cap the set amount)
    var hp0 = g.health; step(2);
    chip.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(2);
    out.aim = { on: document.body.classList.contains('tech-aiming'), shown: getComputedStyle($('#techAim')).display, prompt: $('#techAim .ta-t').textContent, chip: chip.textContent, box: rect($('#techAim')) };
    var q = followerPickPoint(g); tapAt(q.x, q.y); step(2);
    out.aim2 = $('#techAim .ta-t').textContent;
    var ex = (e.x - player.visualX - (e.y - player.visualY)) * TILE_W + canvas.width/2, ey = (e.x - player.visualX + (e.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H - facilityLiftRel(e.x, e.y) - 55;
    tapAt(ex, ey); step(1);
    out.issued = { aiming: document.body.classList.contains('tech-aiming'), going: !!(g._launchLoad || g._flight) };
    for (var i = 0; i < 600 && (g._launchLoad || g._flight); i++) step(1);
    var lost = Math.round(hp0 - g.health); partyTick();   // (measured as it lands: it mends a little as it goes on)
    out.combat = { foeLost: Math.round(5000 - e.health), followerLost: lost, cooldown: Math.ceil(techReadyIn(t) / 60), chip: chip.textContent };   // (the flight's frames have run off it)
    // THE SITE: near it, its label; a tap on the label and the technician sets a launcher up
    e.dead = true; var s = _fp.F.launchSites[0]; player.x = player.targetX = player.visualX = s.at[0] - 2; player.y = player.targetY = player.visualY = s.at[1] + 1; player.fpPath = null;
    for (var k = 0; k < followers.length; k++) { followers[k].x = player.x + 0.4 * k; followers[k].y = player.y + 1; followers[k].attackOrder = null; }
    step(3);
    var L = _techLabels[s.id]; out.label = !!L;
    if (L) tapAt(L.x + L.w / 2, L.y + L.h / 2); step(1);
    out.setup0 = !!t._siteWork;
    for (var j = 0; j < 1600 && !techLauncherAt(s.id); j++) step(1);
    out.installed = techLauncherAt(s.id); out.saved = facilitySaveCollect().launchers;
    step(2); L = _techLabels[s.id]; if (L) tapAt(L.x + L.w / 2, L.y + L.h / 2); step(1);
    out.preview = { mode: techAim && techAim.mode, prompt: $('#techAim .ta-t').textContent };
    techAimCancel(true);
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__ta'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ta-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 150000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ta">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = (els) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); floatingTexts.length = 0; techAim = null;
            player.x = player.targetX = player.visualX = __cell('arena')[0]; player.y = player.targetY = player.visualY = __cell('arena')[1];
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 400; f.currentWill = 1e5; f.x = player.x + 0.5 + i * 0.3; f.y = player.y + 0.5; f.role = i === 0 ? 'camper' : 'brawler'; });
            partyTick(); techAbilityTick(); return followers.slice(); };
        globalThis.__step = (n) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); for (const f of followers.slice()) if (!f.dead) updateNPC(f); } };
        globalThis.__foe = (x, y) => { const e = spawnCreature({ species: 'ant', className: 'tank' }); e.x = x; e.y = y; e.update = () => {}; e.health = e.maxHealth = 5000; e.provoked = true; return e; };`);

    group('ONE TABLE, ONE WAY IN (js/techabilities.js)');
    check('a technician (any element\'s, egg or evolved) has its element\'s ability; so far only the electric one is built, the KINETIC LAUNCHER; nobody else has one', () => {
        const r = J(`(function(){ const fs = __fresh(['electric', 'fire']); const o = {};
            o.built = Object.keys(TECH_ABILITIES).join(); o.tech = (techAbilityOf(fs[0]) || {}).id; o.brawler = techAbilityOf(fs[1]);
            fs[0].evolved = 'hovershell'; o.evolved = (techAbilityOf(fs[0]) || {}).id; fs[0].evolved = undefined;
            fs[1].role = 'camper'; o.fireTech = techAbilityOf(fs[1]); fs[1].role = 'brawler'; return o; })()`);
        same(r.built, 'electric', 'the abilities built'); same(r.tech, 'kinetic_launcher', 'the electric technician'); same(r.evolved, 'kinetic_launcher', 'as a Hover Shell'); same(r.brawler, null, 'a brawler'); same(r.fireTech, null, 'a fire technician (not built yet)');
    });
    check('the first wait: a technician that joins the squad waits 60 s ("the 60-second initial squad wait"), and again after leaving and coming back; one not in the squad cannot use it', () => {
        const r = J(`(function(){ const fs = __fresh(['electric']), t = fs[0], o = {}; o.wait = techReadyIn(t); o.can = techAbilityCan(t).why;
            t._abReadyAt = frame; o.ready = techAbilityCan(t).ok;
            partyPost(t, partyRoomOf(t), true); techAbilityTick(); o.posted = techAbilityCan(t).why;
            partyCall(t, true); techAbilityTick(); o.back = Math.round(techReadyIn(t) / 60); return o; })()`);
        same(r.wait, 3600, 'the first wait (frames)'); ok(/READY IN 60 S/.test(r.can), 'it can be used at once: ' + r.can); same(r.ready, true, 'after the wait'); same(r.posted, 'NOT IN THE SQUAD', 'a posted technician'); same(r.back, 60, 'back in the squad: the wait again');
    });

    group('THE KINETIC LAUNCHER: COMBAT');
    check('a throw: the follower runs to the technician and is thrown in an arc at the enemy; the enemy takes 3× its power (through the game\'s damage, armour and element and all), the follower a set 10, it lands beside the enemy and fights it; the technician gets the XP of a kill of it, once; the cooldown is 60 s from the throw', () => {
        const r = J(`(function(){ const fs = __fresh(['electric', 'core']), t = fs[0], g = fs[1]; t._abReadyAt = frame; const e = __foe(t.x + 3, t.y + 0.4);
            const ref = __foe(t.x + 3.2, t.y + 0.8); applyDamage(ref, g.power * TECH_AB.launch.powerMult, g); const want = Math.round(5000 - ref.health); ref.dead = true; actors.splice(actors.indexOf(ref), 1);
            g.spawnProtection = 0; const hp0 = g.health, xp0 = t.xp || 0, o = {}; o.use = techAbilityUse(t, { follower: g, enemy: e });
            let flew = false, peak = 0; for (let i = 0; i < 400 && (g._launchLoad || g._flight || !flew); i++) { __step(1); if (g._flight) { flew = true; peak = Math.max(peak, techFlightLift(g)); } }
            o.flew = flew; o.peak = Math.round(peak); o.foeLost = Math.round(5000 - e.health); o.want = want; o.followerLost = Math.round(hp0 - g.health); o.near = Math.hypot(g.x - e.x, g.y - e.y) < 1.7; o.order = !!(g.attackOrder && g.attackOrder.target === e);
            o.xp = (t.xp || 0) - xp0; o.killXp = killXp(e); o.cool = techReadyIn(t); o.chip = techChipState(t).text; o.busy = !!t._abBusy; return o; })()`);
        same(r.use.ok, true, 'issued: ' + JSON.stringify(r.use)); same(r.flew, true, 'it never flew'); ok(r.peak > 40, 'no arc: ' + r.peak);
        same(r.foeLost, r.want, 'the enemy\'s damage is not 3× the follower\'s power through applyDamage'); same(r.followerLost, 10, 'the follower\'s set damage'); same(r.near, true, 'it did not land beside the enemy'); same(r.order, true, 'it does not fight the enemy it was thrown at');
        same(r.xp, r.killXp, 'the technician\'s XP'); ok(r.cool > 3500 && r.cool <= 3600, 'the cooldown ' + r.cool); same(r.chip, '⚡ 60 S', 'the chip'); same(r.busy, false, 'still busy');
    });
    check('a throw that cannot be: at the technician itself, at an enemy it cannot see, during the cooldown; a throw called off (the enemy died first) costs no cooldown and gives no XP', () => {
        const r = J(`(function(){ const fs = __fresh(['electric', 'core']), t = fs[0], g = fs[1]; t._abReadyAt = frame; const o = {};
            const e = __foe(t.x + 3, t.y + 0.4); o.self = techAbilityUse(t, { follower: t, enemy: e }).why;
            const hid = __foe(__cell('lab_hallway')[0], __cell('lab_hallway')[1]); o.hidden = techAbilityUse(t, { follower: g, enemy: hid }).why;
            g.x = t.x + 6; g.y = t.y; const xp0 = t.xp || 0; o.use = techAbilityUse(t, { follower: g, enemy: e }).ok; e.dead = true; __step(30);
            o.off = { load: !!g._launchLoad, flight: !!g._flight, cool: techReadyIn(t), busy: !!t._abBusy, xp: (t.xp || 0) - xp0 };
            t._abReadyAt = frame + 100; o.cooling = techAbilityUse(t, { follower: g, enemy: hid }).why; return o; })()`);
        same(r.self, 'IT CANNOT THROW ITSELF', 'itself'); same(r.hidden, 'THE TECHNICIAN CANNOT SEE IT', 'behind a wall'); same(r.use, true, 'the throw');
        same(r.off.load || r.off.flight, false, 'still going after the enemy died'); same(r.off.cool, 0, 'a called-off throw cost a cooldown'); same(r.off.busy, false, 'still busy'); same(r.off.xp, 0, 'XP for nothing');
        ok(/READY IN 2 S/.test(r.cooling), 'during the cooldown: ' + r.cooling);
    });

    group('THE KINETIC LAUNCHER: EXPLORATION (a launcher site, the Arena Catwalk, the broken section)');
    check('the map has a launcher site in the arena that reaches the catwalks: the launcher\'s spot and the landing under the broken section on the arena floor, the landing and the broken section on the catwalks, all on tiles a body can stand on; nobody walks from one to the other', () => {
        const r = J(`(function(){ const s = _fp.F.launchSites[0], at = (p) => partyRoomAt(p[0], p[1]); return { n: _fp.F.launchSites.length, id: s.id, rooms: [at(s.at), at(s.dropTo), at(s.land), at(s.drop)], stand: [s.at, s.dropTo, s.land, s.drop].every(p => facilityStandOk(p[0], p[1])),
            up: facilityPath(s.at[0], s.at[1], s.land[0], s.land[1]) === null, down: facilityPath(s.land[0], s.land[1], s.at[0], s.at[1]) === null, errs: facilityValidate(_fp.F).errors.filter(x => /launcher site/.test(x)) }; })()`);
        same(r.n, 1, 'sites'); same(r.id, 'site_arena_catwalk', 'the site'); same(r.rooms.join(), 'arena,arena,catwalks,catwalks', 'where its points are'); same(r.stand, true, 'a point a body cannot stand on'); same(r.up, true, 'a walk up'); same(r.down, true, 'a walk down'); same(r.errs.length, 0, 'the validator: ' + r.errs);
    });
    check('setting a launcher up: it takes an electric technician in the squad, which walks to the site and works there; then the launcher is there for good (saved, and put back from a save), its XP given once; a second one is refused', () => {
        const r = J(`(function(){ const o = {}, s = _fp.F.launchSites[0]; _fp.launchers = new Set();
            let fs = __fresh(['core', 'fire']); o.none = techSiteSetup(s).why;
            fs = __fresh(['electric', 'core']); const t = fs[0]; t.x = s.at[0] - 4; t.y = s.at[1]; const xp0 = t.xp || 0; o.use = techSiteSetup(s).ok; o.busyChip = techChipState(t).text;
            for (let i = 0; i < 1500 && !techLauncherAt(s.id); i++) __step(1);
            o.installed = techLauncherAt(s.id); o.xp = (t.xp || 0) - xp0; o.saved = facilitySaveCollect().launchers; o.again = techSiteSetup(s).why;
            techLaunchersApply([]); o.cleared = techLauncherAt(s.id); techLaunchersApply(['site_arena_catwalk', 'nowhere']); o.applied = techLaunchersSnapshot(); return o; })()`);
        same(r.none, 'SETTING IT UP NEEDS AN ELECTRIC TECHNICIAN IN YOUR SQUAD', 'no electric technician'); same(r.use, true, 'the set-up'); same(r.busyChip, '⚡ SETTING UP', 'the chip while it works');
        same(r.installed, true, 'not set up'); same(r.xp, 100, 'its XP'); same(r.saved.join(), 'site_arena_catwalk', 'the save'); same(r.again, 'A LAUNCHER IS ALREADY HERE', 'a second one');
        same(r.cleared, false, 'a save without it'); same(r.applied.join(), 'site_arena_catwalk', 'a save with it (and an unknown site left out)');
    });
    check('the launcher sends a follower up: it runs to the launcher and is thrown in an arc up onto the catwalks, where it holds them; called back (COME), it walks to the broken section and drops through into the arena, one way, and follows again; one posted up there that is not (back from the dead) is let go of the post', () => {
        const r = J(`(function(){ const o = {}, s = _fp.F.launchSites[0]; techLaunchersApply(['site_arena_catwalk']); const fs = __fresh(['electric', 'core']), g = fs[1];
            player.x = player.targetX = player.visualX = s.at[0] - 2; player.y = player.targetY = player.visualY = s.at[1] + 1; g.x = player.x + 0.5; g.y = player.y + 0.5;
            o.use = techSiteLaunch(s, g).ok; let up = 0; for (let i = 0; i < 900 && (g._launchLoad || g._flight || !up); i++) { __step(1); if (g._flight) up = Math.max(up, techFlightLift(g)); }
            o.peak = Math.round(up); o.post = g.post; o.room = partyRoomAt(g.x, g.y); o.again = techSiteLaunch(s, g).why;
            partyCall(g, true); let dropped = false; for (let i = 0; i < 2400 && !(dropped && !g._flight); i++) { __step(1); if (g._flight && g._flight.kind === 'drop') dropped = true; }
            o.dropped = dropped; o.down = partyRoomAt(g.x, g.y); o.sameFloor = _pComp(g.x, g.y) === _pComp(player.x, player.y);
            partyPost(g, 'catwalks', true); g.x = player.x; g.y = player.y; _techDropScan(); o.stale = g.post; return o; })()`);
        same(r.use, true, 'the launch'); ok(r.peak > 100, 'the arc up is not drawn high: ' + r.peak); same(r.post, 'catwalks', 'it does not hold the catwalks'); same(r.room, 'catwalks', 'where it came down'); same(r.again, 'IT IS UP THERE ALREADY', 'sent up again');
        same(r.dropped, true, 'it never dropped through the broken section'); same(r.down, 'arena', 'where it came down'); same(r.sameFloor, true, 'not back on the player\'s floor');
        same(r.stale, null, 'a post up there it cannot walk to');
    });

    group('THE AIM AND THE CODE THAT CARRIES IT');
    check('the chip aims (a follower, then an enemy); a tap on the chip again, ✕ or Escape calls it off; while it aims, a tap on a squad card picks that follower', () => {
        const r = J(`(function(){ const fs = __fresh(['electric', 'core']), t = fs[0], g = fs[1], o = {}; t._abReadyAt = frame; const e = __foe(t.x + 3, t.y + 0.4);
            o.start = techChipTap(t); o.need0 = techAimNeed(); o.chip = techChipState(t).text; o.prompt0 = techAimPrompt();
            o.pick = techAimPickFollower(g); o.need1 = techAimNeed(); o.prompt1 = techAimPrompt();
            techChipTap(t); o.off = techAimActive();
            techChipTap(t); techAimPickFollower(g); techAimPickEnemy(e); o.thrown = !!(g._launchLoad || g._flight) && !techAimActive(); return o; })()`);
        same(r.start, true, 'aimed'); same(r.need0, 'follower', 'first'); same(r.chip, '✕ AIMING', 'the chip'); ok(/TAP A FOLLOWER TO THROW/.test(r.prompt0), r.prompt0);
        same(r.need1, 'enemy', 'then'); ok(/TAP AN ENEMY TO THROW CORE /.test(r.prompt1), r.prompt1); same(r.off, false, 'the chip again did not call it off'); same(r.thrown, true, 'the third aim did not throw');
        const P = rd('js/party.js'), T = rd('js/techabilities.js');
        ok(/hit\.ab && typeof techChipTap === "function"\) \{ techChipTap\(f\)/.test(P) && /techAimActive\(\) && typeof techAimPickFollower === "function" && techAimPickFollower\(f\)/.test(P), 'the squad card does not route to the aim');
        ok(/e\.key === "Escape" && techAim\) techAimCancel\(\)/.test(T), 'Escape');
    });
    check('the code carries it the same way everywhere: the canvas press goes to the aim first; a site takes a tap; a flyer is moved by its flight alone, never jostled, never firing a move; the routing knows its walks; the ring\'s far taps do nothing; a slow tap on an open ring is still its tap; a held key does not repeat', () => {
        const I = rd('js/input.js'), G = rd('js/game.js'), N = rd('js/npc.js'), E = rd('js/evolution.js'), FP = rd('js/facilityplay.js');
        ok(/_techAimPressed = false; if \(typeof techAimActive === "function" && techAimActive\(\)\) \{ _techAimPressed = true; isPressing = false; return; \}/.test(I), 'the press');
        ok(/if \(_techAimPressed\) \{ _techAimPressed = false;[^\n]*techAimTap\(_ax, _ay\)/.test(I), 'the release'); ok(/techSiteTap\(ex, ey\)\) return;/.test(I), 'a site\'s tap');
        ok(I.indexOf('_techAimPressed = false; if (typeof techAimActive') < I.indexOf('if (commandPendingTap) return;'), 'the aim is not before the ring');
        ok(/if \(relDist > 18 && relDist <= _ringReach\)/.test(I), 'far taps on the ring'); ok(/&&!_targetPressed&&!commandPendingTap\)/.test(G), 'a slow tap on an open ring');
        ok(/if \(actor\._flight && typeof techFlightStep === "function" && techFlightStep\(actor\)\) return;/.test(N), 'the flight in updateNPC'); ok(/techStepOverride\(actor\)\) return;/.test(N), 'the walks');
        ok(/if \(_a\._flight \|\| _b\._flight\) continue;/.test(G), 'the separation'); ok(/if \(!f \|\| f\.dead \|\| f\._flight\) continue;/.test(E), 'a move from the air'); ok(/if \(a\._fpWalkGoal\) gs\.push\(a\._fpWalkGoal\);/.test(FP), 'the routing');
        ok(/techFlightLift\(obj\.actor\)/.test(G) && /techDrawItems\(drawList\)/.test(G) && /techDrawOverlay\(\)/.test(G) && /techAbilityTick\(\)/.test(G), 'the game loop');
        for (const [f, k] of [['js/serum.js', 'q'], ['js/stations.js', 'e'], ['js/specimen.js', 'e']]) ok(new RegExp('e && !e\\.repeat && \\(e\\.key === "' + k + '"').test(rd(f)), f + ' repeats a held key');
        ok(!/shadowBlur/.test(rd('js/techabilities.js')), 'shadowBlur');
    });

    group('THE CHIP, THE PROMPT AND THE TAPS (real browser)');
    const r = measure(1180, 820);
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('1180x820: the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (r && !r.err) {
            check('the electric technician\'s card has the chip, waiting 60 s at first, then LAUNCH; the other cards have none', () => {
                ok(r.chip0 && /⚡ 60 S/.test(r.chip0[0]) && /wait/.test(r.chip0[1]), 'the chip at first: ' + JSON.stringify(r.chip0)); same(r.chip0[2], 1, 'cards with a chip'); same(r.chip1, '⚡ LAUNCH', 'ready');
            });
            check('a tap on the chip puts up the prompt (what to tap, and ✕ CALL OFF); a tap on a follower and then on the enemy, on the canvas, throws it: the enemy is hit, the follower takes its set 10, the cooldown is 60 s', () => {
                same(r.aim.on, true, 'aiming'); same(r.aim.shown, 'flex', 'the prompt'); ok(/TAP A FOLLOWER TO THROW/.test(r.aim.prompt), r.aim.prompt); same(r.aim.chip, '✕ AIMING', 'the chip');
                ok(/TAP AN ENEMY/.test(r.aim2), 'after the follower: ' + r.aim2); same(r.issued.aiming, false, 'still aiming'); same(r.issued.going, true, 'no throw');
                ok(r.combat.foeLost > 0, 'the enemy was not hit'); same(r.combat.followerLost, 10, 'the follower\'s damage'); same(r.combat.cooldown, 60, 'the cooldown'); same(r.combat.chip, '⚡ 60 S', 'the chip');
            });
            check('near the launcher site its label shows; a tap on it sends the technician to set a launcher up, there for good and saved; a tap on it then aims the launcher (a follower to send up to the Arena Catwalk)', () => {
                same(r.label, true, 'no label near the site'); same(r.setup0, true, 'the tap did not start the set-up'); same(r.installed, true, 'not set up'); same((r.saved || []).join(), 'site_arena_catwalk', 'the save');
                same(r.preview.mode, 'site', 'the launcher\'s aim'); ok(/SEND UP TO THE ARENA CATWALK/.test(r.preview.prompt), r.preview.prompt);
            });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
