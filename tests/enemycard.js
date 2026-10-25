// THE ENEMY CARD (js/mixtool.js, js/targeting.js, js/npc.js): in the facility the battle tool at the bottom left has no ELEMENTS tab (every element is online from the first frame), and when a creature is near a small
// card for it pops up there: tap it and the units the tool is set to (WHO: ALL, one element, or the selected roster cards) go for THAT creature.
// ASKED: "remove the elements dial from the little UI in the bottom left, and [...] whenever you get near an enemy, a little index pops up in that little corner as well, and you can have your followers attack that
// creature if you tap it, and depending on what creatures you have selected or what followers you have selected, they'll attack it."
// The logic runs in the sandbox, the real DOM in the real browser (no Chromium: it says so and passes).
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

// The real page, in the facility: no tabs, a creature comes near, the card pops up once, its bar follows its health, a tap sends the squad.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; actors = actors.filter(function(a){ return !(a instanceof Predator); }); mixToolRender(true); await wait(30);
    var wide = innerWidth > 700; out.wide = wide; out.facility = facilityPlay;
    out.noFoe = { card: !!$('#mixTool .mt-foe'), slotEmpty: !!$('#mixTool .mt-foe-slot') && $('#mixTool .mt-foe-slot').children.length === 0 };
    out.tabs = { tabs: $$('#mixTool .mt-tab').length, comb: !!$('#mixTool .mt-comb'), hex: $$('#mixTool .mt-hex').length, title: $('#mixTool .mt-title') ? $('#mixTool .mt-title').textContent : null, x: $('#mixTool .mt-x') ? getComputedStyle($('#mixTool .mt-x')).display : null, pod: $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').textContent : null };
    if (!wide) { click($('#mixTool .mt-pod')); await wait(30); out.tabs.openTitle = $('#mixTool .mt-title') ? $('#mixTool .mt-title').textContent : null; out.tabs.openX = $('#mixTool .mt-x') ? getComputedStyle($('#mixTool .mt-x')).display : null; }   // (a phone: open from here on, closed once to see the card with it shut)
    out.who = $$('#mixTool .mt-who [data-scope]').map(function(c){ return c.getAttribute('data-scope'); }).join();
    out.scopeAll = !!$('#mixTool .mt-who .mt-chip.on[data-scope=all]');
    // the Crystal's flag on a wide screen is just put down (it used to show the ELEMENTS tab)
    if (wide) { crystalMenuOpen = true; mixToolRender(false); await wait(30); out.flag = { flag: crystalMenuOpen, comb: !!$('#mixTool .mt-comb'), panel: !!$('#mixTool .mt-panel') }; }
    // a squad, and a creature near the player in plain sight
    followers.length = 0; for (var k in followerByElement) followerByElement[k].length = 0;
    ['fire', 'ice', 'toxic'].forEach(function(el, i){ spawnFollowerAtCrystal(el); var f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'follow'; f.x = player.x - 1 - i * 0.3; f.y = player.y; });
    var offs = [[2, 1], [-2, 3]], open = null; _fp.cellsP.forEach(function(c){ if (!open && offs.every(function(d){ return _fpLos(c[0], c[1], c[0] + d[0], c[1] + d[1]); })) open = c; });
    player.x = player.visualX = open[0]; player.y = player.visualY = open[1];
    followers.forEach(function(f, i){ f.x = player.x - 0.5 - i * 0.3; f.y = player.y; });
    squadMode = 'all'; mixToolRender(true); await wait(30);
    spawnPredatorForZone(1, { species: 'beetle', className: 'tank' }); var foe = actors[actors.length - 1]; foe.x = player.visualX + 2; foe.y = player.visualY + 1; foe.team = 'red'; foe.dead = false; foe.level = 4; foe.element = 'fire'; foe.maxHealth = 100; foe.health = 100; foe.state = 'wander'; foe.provoked = false; window.__foe = foe;
    standDown = false; frame = Math.ceil((frame + 1) / TARGET.every) * TARGET.every; targetTick(); mixToolRender(false); await wait(30);
    var card = $('#mixTool .mt-foe'), r = card ? card.getBoundingClientRect() : null, pn = $('#mixTool .mt-panel') ? $('#mixTool .mt-panel').getBoundingClientRect() : null, pod = $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').getBoundingClientRect() : null, dock = document.getElementById('topToggles'), dr = dock ? dock.getBoundingClientRect() : null;
    out.card = card ? { text: card.textContent, name: $('#mixTool .mt-foe-name').textContent, sub: $('#mixTool .mt-foe-sub').textContent, num: $('#mixTool .mt-foe-num').textContent, go: $('#mixTool .mt-foe-go').textContent, pop: card.classList.contains('pop'), img: !!$('#mixTool .mt-foe-pic img') && $('#mixTool .mt-foe-pic img').src.indexOf('data:image/png') === 0, w: Math.round(r.width), h: Math.round(r.height), hp: $('#mixTool .mt-foe-hp u').style.width, col: card.style.getPropertyValue('--c') } : null;
    out.place = r ? { aboveControls: pn ? r.bottom <= pn.top + 1 : false, onScreen: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, dock: !!(dr && dr.width && r.right > dr.left && r.left < dr.right && r.bottom > dr.top && r.top < dr.bottom) } : null;
    if (!wide) { click($('#mixTool [data-act=close]')); await wait(30); var c2 = $('#mixTool .mt-foe'), r2 = c2 ? c2.getBoundingClientRect() : null, pod2 = $('#mixTool .mt-pod').getBoundingClientRect(); out.closedCard = { panel: !!$('#mixTool .mt-panel'), card: !!c2, abovePod: !!r2 && r2.bottom <= pod2.top + 1, onScreen: !!r2 && r2.left >= 0 && r2.top >= 0 && r2.right <= innerWidth }; click($('#mixTool .mt-pod')); await wait(30); }
    out.locked = targetCurrent() === foe;
    // re-rendering (a tap on WHO) does not make it pop up again; its health bar follows the creature without a rebuild
    var same0 = card; mixToolRender(true); await wait(30); out.stable = { same: $('#mixTool .mt-foe') !== same0 ? 'rebuilt' : 'kept', pop: $('#mixTool .mt-foe').classList.contains('pop') };
    var keep = $('#mixTool .mt-foe'); foe.health = 40; mixToolRender(false); await wait(30); out.hurt = { kept: $('#mixTool .mt-foe') === keep, hp: $('#mixTool .mt-foe-hp u').style.width, cls: $('#mixTool .mt-foe-hp u').className, num: $('#mixTool .mt-foe-num').textContent };
    foe.health = 15; mixToolRender(false); await wait(30); out.low = { hp: $('#mixTool .mt-foe-hp u').style.width, cls: $('#mixTool .mt-foe-hp u').className }; foe.health = 100; mixToolRender(false);
    // the scope names who goes
    click($('#mixTool [data-scope=ice]')); await wait(30); out.ice = { go: $('#mixTool .mt-foe-go').textContent, who: $('#mixTool .mt-who .mt-chip.on') ? $('#mixTool .mt-who .mt-chip.on').getAttribute('data-scope') : null };
    click($('#mixTool [data-scope=all]')); await wait(30);
    // a tap on the card sends them
    click($('#mixTool .mt-foe')); await wait(30);
    out.sent = { ordered: followers.filter(function(f){ return f.attackOrder && f.attackOrder.target === foe; }).length, go: $('#mixTool .mt-foe-go').textContent, going: $('#mixTool .mt-foe').classList.contains('going'), texts: floatingTexts.slice(-3).map(function(t){ return t.text; }) };
    // RETREAT takes it back
    click($('#mixTool [data-act=retreat]')); await wait(30); out.retreat = { ordered: followers.filter(function(f){ return f.attackOrder; }).length, go: $('#mixTool .mt-foe-go').textContent };
    // the creature dies: the card goes
    foe.dead = true; targetTick(); frame += TARGET.every; targetTick(); mixToolRender(false); await wait(30); out.gone = { card: !!$('#mixTool .mt-foe'), slotEmpty: $('#mixTool .mt-foe-slot').children.length === 0 };
    // the classic game has no card and keeps its tabs
    facilityPlay = false; mixToolRender(true); await wait(30); out.classic = { card: !!$('#mixTool .mt-foe'), tabs: $$('#mixTool .mt-tab').map(function(t){ return t.textContent; }).join() }; facilityPlay = true;
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__ec'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ec-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ec">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); squadMode = "selected"; facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    const MODE_AT_START = run('squadMode'), ELEMENT_IDS = J('ELEMENTS.map(e => e.id)');
    // the fixtures: the player at a spot with a clear view, creatures that cannot move (so they stay where they are put) and cannot die, a squad
    run(`globalThis.__open = (() => { const offs = [[2, 1], [-2, 3], [5, 0], [0, 6], [4, 4], [7, 1], [10, 1], [3, 12]]; for (const c of _fp.cellsP.values()) if (offs.every(d => _fpLos(c[0], c[1], c[0] + d[0], c[1] + d[1]) && facilityWalkable(c[0] + d[0], c[1] + d[1], _fp.F))) return c; return null; })();
        globalThis.__mk = (dx, dy, o) => { spawnPredatorForZone(1, { species: 'ant', className: 'scout' }); const a = actors[actors.length - 1]; a.x = player.visualX + dx; a.y = player.visualY + dy; a.team = 'red'; a.dead = false; a.level = 3; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.health = a.maxHealth = 1e7; a.state = (o && o.calm) ? 'wander' : 'hunt'; a.provoked = !(o && o.calm); return a; };
        globalThis.__fresh = (roles) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; battleFocus = null; squadMode = 'all'; selectedUnits.clear(); floatingTexts.length = 0; followerProjectiles.length = 0;
            player.x = player.targetX = player.visualX = __open[0]; player.y = player.targetY = player.visualY = __open[1]; targetDrop(); standDown = false; _ixSubject = null;
            (roles || ['brawler']).forEach((r, i) => { spawnFollowerAtCrystal(['fire', 'ice', 'toxic', 'electric', 'core', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = r; f.x = player.x - 1 - i * 0.2; f.y = player.y; f.stance = 'follow'; f.health = f.maxHealth = 1e7; f.spawnProtection = 1e9; f.currentWill = 1e5; f.attackCooldown = 0; });   // (nothing the creatures do hurts the squad: these checks are about where it goes)
            return followers; };
        globalThis.__tick = () => { frame = Math.ceil((frame + 1) / TARGET.every) * TARGET.every; targetTick(); };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`);
    ok(run('!!__open'), 'no open spot in the facility to test in');

    group('THE TOOL IN THE FACILITY: no ELEMENTS tab');
    check('in the facility the tool is the battle controls only: no tab row, no honeycomb, no ELEMENTS; WHO has ALL and the six elements, then RETREAT, HOLD and COME; on a phone a title and a close button, and a BATTLE pod', () => {
        run('facilityPlay = true; innerWidth = 1100; crystalMenuOpen = false; _mtTab = "elements";');   // (a stored ELEMENTS preference is ignored here)
        const w = run('mixToolHTML()'); ok(!/data-tab/.test(w) && !/mt-tab/.test(w) && !/mt-comb|mt-hex|ELEMENTS/.test(w), 'a tab or the honeycomb: ' + w.slice(0, 160)); ok(!/mt-tabs|mt-x/.test(w), 'a tab row on a wide screen');
        same((w.match(/data-scope="/g) || []).length, 7, 'WHO chips (ALL and six elements)'); ok(/data-act="retreat"/.test(w) && /data-order="hold"/.test(w) && /data-order="follow"/.test(w), 'the controls');
        run('innerWidth = 500; crystalMenuOpen = true;'); const n = run('mixToolHTML()'); ok(/class="mt-title">BATTLE</.test(n) && /data-act="close"/.test(n) && !/data-tab|mt-comb/.test(n), 'phone: ' + n.slice(0, 200)); ok(/<span>BATTLE<\/span>/.test(n), 'the pod says BATTLE (it said CRYSTAL 6)');
        run('crystalMenuOpen = false; innerWidth = 1100;');
        same(run('mixToolTabNow()'), 'battle', 'the tab in force');
    });
    check('the classic game keeps its tabs: the ELEMENTS tab (the honeycomb, a gold UNLOCK cell for an earned element) is where its elements are brought online', () => {
        run('facilityPlay = false; innerWidth = 1100; crystalMenuOpen = false; _mtTab = "battle"; unlockedElements = new Set(["fire", "electric", "ice"]);');
        const b = run('mixToolHTML()'); ok(/data-tab="battle"/.test(b) && /data-tab="elements"/.test(b), 'the tabs'); same(run('mixToolTabNow()'), 'battle', 'tab');
        run('_mtTab = "elements";'); const e = run('mixToolHTML()'); ok(/mt-comb/.test(e) && /UNLOCK|LOCKED/.test(e), 'the honeycomb'); same(run('mixToolTabNow()'), 'elements', 'tab');
        run('_mtTab = "battle"; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlay = true;');
    });
    check('the facility starts with the tool\'s orders going to EVERYONE (the old default was whichever element came first)', () => {
        ok(/squadMode = "all";/.test(rd('js/facilityplay.js').slice(rd('js/facilityplay.js').indexOf('unlockedElements = new Set(ELEMENTS.map(e => e.id))'), rd('js/facilityplay.js').indexOf('unlockedElements = new Set(ELEMENTS.map(e => e.id))') + 900)), 'facilityPlayStart does not set it');
        same(MODE_AT_START, 'all', 'squadMode after the facility starts');
    });

    group('THE CARD\'S CREATURE (js/targeting.js)');
    check('the card is for the creature the gun is locked on, or with the gun put away the nearest one in range and in sight, and it does not jump about: it keeps its creature while that one is near and in sight, and a tap on another creature makes that one the card\'s at once', () => {
        const r = J(`(function(){ const o = {}; __fresh(['brawler']); const keep = actors.slice();
            o.none = [targetIndexSubject()];
            const far = __mk(7, 1, { calm: true }), mid = __mk(4, 4, { calm: true }); frame = 1600; __tick();
            o.first = [targetIndexSubject() === mid, targetCurrent() === mid, targetIndexId(mid) > 0 && targetIndexId(mid) === targetIndexId(mid) && targetIndexId(mid) !== targetIndexId(far)];
            targetStand(); setPlayerAttackMode(false); __tick(); o.stowed = [targetCurrent(), targetIndexSubject() === mid, standDown];
            const near = __mk(2.2, 1, { calm: true }); __tick(); o.stays = [targetIndexSubject() === mid, targetCurrent()];   // (a nearer one does not take the card from the creature it has)
            mid.x = player.visualX + 30; __tick(); o.leaves = targetIndexSubject() === near;   // (it left: the nearest in range)
            targetSet(far, true); o.tapped = [targetIndexSubject() === far, targetCurrent() === far];
            far.dead = true; o.deadNow = targetIndexSubject(); __tick(); o.afterDead = targetIndexSubject() === near;
            near.dead = true; mid.dead = true; __tick(); o.empty = targetIndexSubject();
            const w = __mk(2, 1, { calm: true }); const real = _fpLos; _fpLos = () => false; _ixSubject = null; __tick(); o.blocked = targetIndexSubject(); _fpLos = real; __tick(); o.seen = targetIndexSubject() === w;
            facilityPlay = false; o.classic = targetIndexSubject(); facilityPlay = true;
            for (const a of actors) if (a instanceof Predator) a.dead = true; actors.length = 0; for (const a of keep) actors.push(a); targetDrop(); standDown = false; _ixSubject = null; return o; })()`);
        same(r.none[0], null, 'a card with nobody near'); same(r.first.join(), 'true,true,true', 'the nearest in range is the card\'s and the gun\'s, and each creature has its own id'); same(r.stowed.join(), ',true,true', 'with the gun put away the card is still for the nearest');
        same(r.stays.join(), 'true,', 'a nearer creature took the card from the one it had'); same(r.leaves, true, 'the card does not move to the nearest when its creature leaves'); same(r.tapped.join(), 'true,true', 'a tap on another creature'); same(r.deadNow, null, 'a dead creature stays on the card');
        same(r.afterDead, true, 'the next one after the card\'s creature dies'); same(r.empty, null, 'no creature: no card'); same(r.blocked, null, 'a creature behind a wall is on the card'); same(r.seen, true, 'a creature in sight is not'); same(r.classic, null, 'the classic game has a card');
    });
    check('what the card says: name, level, class, element, health, bite (and a creature\'s picture as a data URL, made once per kind)', () => {
        const r = J(`(function(){ __fresh(['brawler']); const a = __mk(3, 1, { calm: true }); a.level = 5; a.element = 'ice'; a.maxHealth = 80; a.health = 20; a.power = 7.25; const c = targetCardInfo(a), u = targetPortraitURL(a), u2 = targetPortraitURL(a); const out = { c, u: typeof u, u2: u === u2 }; a.dead = true; return out; })()`);
        ok(/ANT/.test(r.c.name) && /ICE/.test(r.c.name), 'name ' + r.c.name); same(r.c.title, 'ANT SCOUT', 'the card\'s title (the kind: the element is under it)'); same(r.c.level, 5, 'level'); same(r.c.cls, 'SCOUT', 'class'); same(r.c.element, 'ICE', 'element'); same(r.c.hp, 20, 'hp'); same(r.c.max, 80, 'max'); same(r.c.frac, 0.25, 'fraction'); same(r.c.bite, 7.3, 'bite (one decimal)'); ok(/^#[0-9a-f]{6}$/i.test(r.c.col) || /^#/.test(r.c.col), 'colour ' + r.c.col);
        same(r.u, 'string', 'a picture URL'); same(r.u2, true, 'the same picture the second time');
    });

    group('THE ORDER (js/mixtool.js mixToolAttack)');
    check('the card\'s HTML: the kind, level · element, the health bar and the strip that says who goes (EVERYONE / an element / SELECTED), ATTACKING once they are sent, NO ONE TO SEND with nobody; it pops up only when it is new', () => {
        const r = J(`(function(){ const fs = __fresh(['brawler', 'brawler', 'sniper']); const foe = __mk(3, 1, { calm: true }); foe.level = 4; foe.element = 'fire'; const out = {};
            out.all = mixToolFoeHTML(foe, mixToolAttackPool(), true); out.again = mixToolFoeHTML(foe, mixToolAttackPool(), false);
            squadMode = 'selected'; player.selectedElement = 'ice'; out.ice = mixToolFoeHTML(foe, mixToolAttackPool(), false);
            ccSetSelection([fs[0], fs[2]]); out.sel = mixToolFoeHTML(foe, mixToolAttackPool(), false); ccClearSelection(); squadMode = 'all';
            mixToolAttack(foe); out.going = mixToolFoeHTML(foe, mixToolAttackPool(), false);
            followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; out.none = mixToolFoeHTML(foe, mixToolAttackPool(), false); foe.dead = true; return out; })()`);
        ok(/data-act="attack"/.test(r.all) && />ANT SCOUT</.test(r.all) && /LV 4 · FIRE</.test(r.all) && /mt-foe-hp/.test(r.all), 'the card ' + r.all.slice(0, 300)); ok(/ATTACK · EVERYONE 3/.test(r.all), 'everyone: ' + (r.all.match(/mt-foe-go">([^<]*)/) || [])[1]); ok(/class="mt-foe pop"/.test(r.all) && !/pop/.test(r.again.replace('mt-foe-pic', '')), 'pop only when new');
        ok(/ATTACK · ICE 1/.test(r.ice), 'an element: ' + (r.ice.match(/mt-foe-go">([^<]*)/) || [])[1]); ok(/ATTACK · SELECTED 2/.test(r.sel), 'selected: ' + (r.sel.match(/mt-foe-go">([^<]*)/) || [])[1]);
        ok(/ATTACKING · 3 OF 3/.test(r.going) && /mt-foe going/.test(r.going), 'going: ' + (r.going.match(/mt-foe-go">([^<]*)/) || [])[1]); ok(/NO ONE TO SEND/.test(r.none) && /mt-foe idle/.test(r.none), 'nobody');
    });
    check('a tap sends the units the tool is set to at that creature: ALL, one element (WHO), or the selected roster cards (which win); not the work crew; each is put on follow with no hold and no retreat, and told ATTACKING; a creature nobody can be sent at says so', () => {
        const r = J(`(function(){ const fs = __fresh(['brawler', 'brawler', 'sniper', 'camper']); const foe = __mk(6, 1, { calm: true }), out = {}; fs[3].duty = 'worker'; fs[1].job = { type: 'move', target: { x: 1, y: 1 } }; fs[1].stance = 'hold'; fs[2].retreatUntil = frame + 100;
            floatingTexts.length = 0; out.n = mixToolAttack(foe); out.text = floatingTexts[floatingTexts.length - 1].text;
            out.who = fs.map(f => !!(f.attackOrder && f.attackOrder.target === foe)).join(); out.until = fs[0].attackOrder.until - frame; out.fix = [fs[1].stance, fs[1].job, fs[2].retreatUntil, fs[0]._nearestEnemy === foe]; out.status = fs.map(f => unitStatus(f).text).join(); out.ordered = mixToolOrdered(foe);
            for (const f of fs) f.attackOrder = null; squadMode = 'selected'; player.selectedElement = 'toxic'; out.element = mixToolAttack(foe) + ':' + fs.map(f => !!f.attackOrder).join();
            for (const f of fs) f.attackOrder = null; ccSetSelection([fs[0], fs[1]]); out.selected = mixToolAttack(foe) + ':' + fs.map(f => !!f.attackOrder).join(); ccClearSelection(); for (const f of fs) f.attackOrder = null;
            ccSetSelection([fs[3]]); floatingTexts.length = 0; out.crewOnly = mixToolAttack(foe) + ':' + floatingTexts.map(t => t.text).join(); ccClearSelection(); squadMode = 'all';
            floatingTexts.length = 0; foe.dead = true; out.dead = mixToolAttack(foe) + ':' + floatingTexts.map(t => t.text).join(); out.noFoe = mixToolAttack(null) + ':' + floatingTexts.map(t => t.text).join(); return out; })()`);
        same(r.n, 3, 'sent'); ok(/^ATTACK · 3 AT .*ANT/.test(r.text), 'said: ' + r.text); same(r.who, 'true,true,true,false', 'the work crew is not sent'); same(r.until, 1800, 'thirty seconds'); same(r.fix.join(), 'follow,,0,true', 'stance, the hold, the retreat, the target at once');
        same(r.status, 'ATTACKING,ATTACKING,ATTACKING,FOLLOWING'.replace('FOLLOWING', r.status.split(',')[3]), 'the status over their heads'); ok(/^ATTACKING,ATTACKING,ATTACKING,/.test(r.status), 'status ' + r.status); same(r.ordered, 3, 'mixToolOrdered');
        same(r.element, '1:false,false,true,false', 'only the toxic follower, as WHO says'); same(r.selected, '2:true,true,false,false', 'the selected cards win'); ok(/^0:/.test(r.crewOnly) && /NOBODY TO SEND/.test(r.crewOnly), 'a selection of only the work crew: ' + r.crewOnly);
        ok(/^0:.*NOTHING TO ATTACK/.test(r.dead), 'a dead creature: ' + r.dead); ok(/^0:.*NOTHING TO ATTACK/.test(r.noFoe), 'no creature: ' + r.noFoe);
    });
    check('RETREAT, HOLD and COME each end an attack order (so does a stance order from the roster), and RETREAT keeps them out of the fight', () => {
        const r = J(`(function(){ const fs = __fresh(['brawler', 'brawler']); const foe = __mk(5, 1, { calm: true }), out = {}; const send = () => { for (const f of fs) f.attackOrder = null; mixToolAttack(foe); return fs.map(f => !!f.attackOrder).join(); };
            out.sent = send(); mixToolRetreat(); out.retreat = [fs.map(f => !!f.attackOrder).join(), fs[0].retreatUntil > frame];
            send(); mixToolOrder('hold'); out.hold = [fs.map(f => !!f.attackOrder).join(), fs[0].stance]; send(); mixToolOrder('follow'); out.come = [fs.map(f => !!f.attackOrder).join(), fs[0].stance];
            send(); ccApplyStance([fs[0]], 'hold'); out.roster = fs.map(f => !!f.attackOrder).join(); foe.dead = true; return out; })()`);
        same(r.sent, 'true,true', 'sent'); same(r.retreat.join(), 'false,false,true', 'RETREAT'); same(r.hold.join(), 'false,false,hold', 'HOLD'); same(r.come.join(), 'false,false,follow', 'COME'); same(r.roster, 'false,true', 'a stance order from the roster ends it for that unit');
    });

    group('A KNOCKBACK IN THE FACILITY STAYS IN THE FACILITY (js/combat.js)');
    check('a creature pushed back by a follower (a core follower\'s BASH, a flux pull) is moved by the push and no further than the walls let it: it stays on the floor, and is not thrown to y = 3 as the strip\'s corridor clamp did; the classic game keeps its four rows', () => {
        const r = J(`(function(){ __fresh(['brawler']); const a = __mk(3, 0, { calm: true }), out = {}; actors = actors.filter(x => x === a || x.isFollower || !(x instanceof Predator)); const y0 = a.y, x0 = a.x;
            a.kbVX = 0.3; a.kbVY = 0.2; const walk = () => facilityWalkable(a.x, a.y, _fp.F); updateStatusEffects(); out.moved = [a.x > x0, a.y > y0 - 0.001, walk()]; for (let i = 0; i < 30; i++) updateStatusEffects(); out.settled = [walk(), Math.abs(a.y - y0) < 4, a.kbVX === 0 && a.kbVY === 0];
            // into a wall: it stops where it was (the wall is as far as a push goes), still on the floor
            a.x = x0; a.y = y0; let wallDir = null; for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let k = 0; while (k < 30 && facilityWalkable(a.x + d[0] * k, a.y + d[1] * k, _fp.F)) k++; if (k < 30) { wallDir = d; break; } }
            a.kbVX = wallDir[0] * 2; a.kbVY = wallDir[1] * 2; for (let i = 0; i < 30; i++) updateStatusEffects(); out.wall = [walk(), Math.hypot(a.x - x0, a.y - y0) < 31]; out.noCorridor = a.y > 3.5;
            facilityPlay = false; a.x = 10; a.y = 8; a.kbVX = 0.2; a.kbVY = 0.2; updateStatusEffects(); out.classic = a.y; facilityPlay = true; a.dead = true; return out; })()`);
        same(r.moved.join(), 'true,true,true', 'a push moves it, on the floor'); same(r.settled.join(), 'true,true,true', 'it ends on the floor, near where it was, and the push dies away'); same(r.wall.join(), 'true,true', 'a push into a wall'); same(r.noCorridor, true, 'it was thrown to the strip\'s corridor'); same(r.classic, 3, 'the classic game keeps its corridor (y at most 3)');
        ok(/facilityConstrain\(actor, _kx, _ky\)/.test(rd('js/combat.js')), 'combat.js');
    });

    group('THE SQUAD GOES (js/npc.js)');
    const frames = n => run('__frames(' + n + ')');
    check('a unit NOT sent ignores a calm creature (its old rule), and one that IS sent goes for it from far beyond the usual reach, and fights it', () => {
        run('__fresh(["brawler"]); globalThis.__calm = __mk(14, 1, { calm: true });'); frames(40); same(run('followers[0]._nearestEnemy'), null, 'an unsent unit sees a calm creature');
        const d0 = run('Math.hypot(followers[0].x - __calm.x, followers[0].y - __calm.y)'); run('mixToolAttack(__calm);'); frames(60); const d1 = run('Math.hypot(followers[0].x - __calm.x, followers[0].y - __calm.y)'); same(run('followers[0]._nearestEnemy === __calm'), true, 'the sent unit does not target it'); ok(d1 < d0 - 1, 'it does not go: ' + d0 + ' -> ' + d1);
        frames(700); ok(run('__calm.health < __calm.maxHealth'), 'it never hit the creature'); ok(run('Math.hypot(followers[0].x - __calm.x, followers[0].y - __calm.y)') < 2.5, 'it is not at the creature');
    });
    check('a sent unit goes for ITS creature whatever is nearer (a hunting creature right beside it is left alone while the order stands), and goes back to ordinary fighting when the order ends', () => {
        run('__fresh(["brawler"]); globalThis.__near = __mk(2.5, 0.2); globalThis.__target = __mk(12, 1, { calm: true });'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'fixture: the nearer one is the usual choice');
        run('mixToolAttack(__target);'); frames(30); same(run('followers[0]._nearestEnemy === __target'), true, 'the order does not win over the nearer one');
        run('__target.dead = true;'); frames(30); same(run('followers[0].attackOrder'), null, 'the order outlives the creature'); same(run('followers[0]._nearestEnemy === __near'), true, 'it does not go back to the nearest after the creature dies');
    });
    check('a MAGE sent at a creature goes to its firing distance and fires; a TECHNICIAN (which holds a post) goes and fights it', () => {
        run('__fresh(["sniper"]); globalThis.__t = __mk(11, 1, { calm: true }); mixToolAttack(__t);'); frames(700); const dm = run('Math.hypot(followers[0].x - __t.x, followers[0].y - __t.y)'); ok(dm < 5.5 && dm > 2, 'a mage stands ' + dm + ' tiles off'); ok(run('__t.health < __t.maxHealth || followerProjectiles.length > 0'), 'the mage did not fire');
        run('__fresh(["camper"]); globalThis.__t2 = __mk(9, 1, { calm: true }); mixToolAttack(__t2);'); frames(500); ok(run('Math.hypot(followers[0].x - __t2.x, followers[0].y - __t2.y)') < 2.2, 'the technician did not go'); ok(run('__t2.health < __t2.maxHealth'), 'the technician did not fight it');
        run('__fresh(["camper"]); globalThis.__t3 = __mk(9, 1, { calm: true });'); frames(200); ok(run('Math.hypot(followers[0].x - __t3.x, followers[0].y - __t3.y)') > 5, 'an unsent technician left its post');
    });
    check('the order ends when the time is up, when the creature is further from the player than the leash, when the creature is dead or it is told to RETREAT; and an order on a unit that is healing waits for it', () => {
        run('__fresh(["brawler"]); globalThis.__e = __mk(8, 1, { calm: true }); mixToolAttack(__e);'); frames(5); ok(run('!!followers[0].attackOrder'), 'fixture');
        run('frame += BATTLE_ATTACK_FRAMES + 5;'); frames(3); same(run('followers[0].attackOrder'), null, 'it outlived the time');
        run('mixToolAttack(__e);'); frames(3); run('__e.x = player.x + BATTLE_ATTACK_LEASH + 4;'); frames(3); same(run('followers[0].attackOrder'), null, 'it outlived the leash');
        run('__e.x = player.x + 8; mixToolAttack(__e);'); frames(3); run('mixToolRetreat();'); frames(3); same(run('followers[0].attackOrder'), null, 'RETREAT'); same(run('followers[0]._nearestEnemy'), null, 'RETREAT: it still sees it');
        run('__e.dead = true;');
    });
    check('the pieces are where the rest of the game looks for them: npc.js reads the order before the usual choice, a stance order clears it, RETREAT clears it, the status says ATTACKING', () => {
        const npc = rd('js/npc.js'); ok(/function attackOrderTarget\(actor\)/.test(npc) && /const _ord = attackOrderTarget\(actor\);/.test(npc), 'npc.js'); ok(/\* _reach\) \{/.test(npc) && /const _reach = _ord \? 1e3/.test(npc), 'the reach'); ok(/BATTLE_ATTACK_FRAMES/.test(rd('js/config.js')) && /BATTLE_ATTACK_LEASH/.test(rd('js/config.js')), 'config');
        ok(/a\.attackOrder = null; a\.job = \{ type: "move"/.test(rd('js/commandcenter.js')) && /a\.attackOrder = null; if \(a\.job && a\.job\.type === "move"\)/.test(rd('js/commandcenter.js')), 'ccApplyStance'); ok(/a\.attackOrder = null;/.test(rd('js/mixtool.js')), 'mixtool');
        ok(/_st\("ATTACKING", "fight"\)/.test(rd('js/status.js')), 'status'); ok(/data-act=attack/.test(rd('js/mixtool.js')) && /mixToolSlots/.test(rd('js/mixtool.js')), 'the click and the kept slot'); ok(/\.mt-foe\b/.test(rd('game.html')) && /@keyframes mt-pop/.test(rd('game.html')), 'the card\'s style');
    });

    group('THE CARD (real browser)');
    for (const [w, h] of [[1180, 820], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); same(r.facility, true, 'the facility'); });
        if (!r || r.err) continue;
        const wide = w > 700;
        check(w + ': the facility\'s tool has no ELEMENTS tab or honeycomb and no tab row; WHO has ALL (lit) and six elements; ' + (wide ? 'the Crystal\'s flag is just put down' : 'a phone has a BATTLE pod, a title and a close button'), () => {
            same(r.tabs.tabs, 0, 'tabs'); same(r.tabs.comb, false, 'the honeycomb'); same(r.tabs.hex, 0, 'cells'); same(r.who, ['all'].concat(ELEMENT_IDS).join(), 'WHO'); same(r.scopeAll, true, 'ALL is not the one lit at the start');
            if (wide) { same(r.tabs.title, null, 'a title on a wide screen'); same(r.flag.flag, false, 'the flag stays up'); same(r.flag.comb, false, 'the flag showed the honeycomb'); same(r.flag.panel, true, 'the tool closed'); }
            else { ok(/BATTLE/.test(r.tabs.pod), 'pod ' + r.tabs.pod); same(r.tabs.openTitle, 'BATTLE', 'title'); ok(r.tabs.openX !== 'none', 'close button'); }
        });
        check(w + ': with nobody near there is no card; a creature comes near and the card pops up (once) with its picture, name, level \u00b7 class \u00b7 element, health and the strip "ATTACK \u00b7 EVERYONE 3"; it is above the controls' + (wide ? '' : ' (and above the pod, with the tool closed: a phone sees it without opening anything)') + ', on the screen and clear of the dock', () => {
            same(r.noFoe.card, false, 'a card with nobody near'); same(r.noFoe.slotEmpty, true, 'the slot is not empty'); ok(r.card, 'no card'); same(r.locked, true, 'the gun is not locked on it'); same(r.card.name, 'BEETLE TANK', 'name'); same(r.card.sub, 'LV 4 · FIRE', 'sub');
            ok(/^HP 100\/100/.test(r.card.num), 'num ' + r.card.num); same(r.card.hp, '100%', 'bar'); same(r.card.img, true, 'picture'); same(r.card.pop, true, 'it did not pop up'); same(r.card.go, 'ATTACK · EVERYONE 3', 'strip');
            same(r.place.aboveControls, true, 'above the controls'); same(r.place.onScreen, true, 'off the screen'); same(r.place.dock, false, 'on the dock');
            if (!wide) { same(r.closedCard.panel, false, 'the tool did not close'); same(r.closedCard.card, true, 'the card goes when the tool is shut'); same(r.closedCard.abovePod, true, 'the card is not above the pod'); same(r.closedCard.onScreen, true, 'the card is off the screen'); } ok(r.card.w <= 230 && r.card.w >= 150 && r.card.h >= 60 && r.card.h <= 110, 'size ' + r.card.w + 'x' + r.card.h);
        });
        check(w + ': it is kept, not rebuilt: it does not pop up again when the tool re-renders, and its health bar and numbers (and colour: green, yellow, red) follow the creature', () => {
            same(r.stable.pop, false, 'popped up again'); same(r.hurt.kept, true, 'the card was rebuilt for a health change'); same(r.hurt.hp, '40%', 'bar'); same(r.hurt.cls, 'mid', 'yellow'); ok(/^HP 40\/100/.test(r.hurt.num), 'num ' + r.hurt.num); same(r.low.hp, '15%', 'low bar'); same(r.low.cls, 'low', 'red');
        });
        check(w + ': the strip names who goes (WHO: an element), a tap sends the squad (ATTACKING · 3 OF 3, a message, the orders are on the units), RETREAT takes it back, the creature dying takes the card away, and the classic game has none and keeps its tabs', () => {
            same(r.ice.go, 'ATTACK · ICE 1', 'WHO'); same(r.ice.who, 'ice', 'the lit chip'); same(r.sent.ordered, 3, 'ordered'); same(r.sent.go, 'ATTACKING · 3 OF 3', 'strip'); same(r.sent.going, true, 'class'); ok(r.sent.texts.some(t => /^ATTACK · 3 AT /.test(t)), 'message ' + r.sent.texts);
            same(r.retreat.ordered, 0, 'RETREAT'); ok(/^ATTACK/.test(r.retreat.go), 'strip after RETREAT ' + r.retreat.go); same(r.gone.card, false, 'the card stays after the creature dies'); same(r.gone.slotEmpty, true, 'the slot'); same(r.classic.card, false, 'a card in the classic game'); ok(/BATTLE,.*ELEMENTS/.test(r.classic.tabs), 'classic tabs ' + r.classic.tabs);
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
