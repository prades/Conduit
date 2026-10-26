// THE SQUAD OF THREE AND THE ROOMS THE REST HOLD (js/party.js, js/npc.js, js/commandcenter.js, js/targeting.js), and the ammunition as a small icon.
// ASKED: "move the information where it says ammo or armed up where the old little index UI shows up for the predators [...] make it subtle, like an icon with ammo and have a number on it, and now make it to where you can only
// have three followers in your squad, and those three followers will show up their little roster little clip out [...] where we had the ammo or the armed information. That'll layout across the top of the little slider that has
// the different tools [...] whenever they're in a room, they can have the follower hold that position and the followers will patrol that room until they are called upon again. each follower in your roster will show what room it's holding
// and a new follower will not follow you unless you have room in your squad."
// The logic runs in the sandbox, the bar and the roster in the real browser (no Chromium: it says so and passes).
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

// The real page, in the facility: the three cards over the dock, HOLD, the open slots, a recruit, a tap on a card, the roster saying the room.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; partyTick(); await wait(30);
    var wide = innerWidth > 700; out.wide = wide;
    var bar = $('#squadBar'), dock = document.getElementById('topToggles'), tool = $('#mixTool .mt-panel');
    var names = function(){ return $$('#squadBar .sb-slot').map(function(e){ return e.classList.contains('empty') ? '-' : e.querySelector('.sb-name').textContent; }); };
    out.start = { on: bar.classList.contains('on'), slots: $$('#squadBar .sb-slot').length, names: names(), subs: $$('#squadBar .sb-slot .sb-sub').map(function(e){ return e.textContent; }), hp: $$('#squadBar .sb-hp u').map(function(e){ return e.style.width; }), thumbs: $$('#squadBar .sb-thumb').length, info: $$('#squadBar .sb-info').length };
    var br = bar.getBoundingClientRect(), dr = dock.getBoundingClientRect(), tr = tool ? tool.getBoundingClientRect() : null;
    var pod = $('#mixTool .mt-pod'), pr = pod ? pod.getBoundingClientRect() : null;
    out.place = { aboveDock: dr.width > 0 ? br.bottom <= dr.top + 1 : true, overPod: !!pr && pr.width > 0 && br.left < pr.right && br.right > pr.left && br.top < pr.bottom && br.bottom > pr.top, dockShown: dr.width > 0, onScreen: br.left >= 0 && br.right <= innerWidth && br.top >= 0, centred: Math.abs((br.left + br.right) / 2 - innerWidth / 2) < 3, stacked: wide && !!tr && br.bottom <= tr.top + 1 && br.left >= 0 && br.left <= 20 && br.height > br.width / 2, overTool: !!tr && wide && br.left < tr.right && br.right > tr.left && br.top < tr.bottom && br.bottom > tr.top, w: Math.round(br.width), h: Math.round(br.height), noChip: !document.querySelector('#squadBar canvas') ? 'none' : 'canvas' };
    // a tap on a card selects that follower
    selectedUnits.clear(); var s0 = $$('#squadBar .sb-slot')[0]; click(s0); await wait(30);
    out.tap = { sel: selectedUnits.size, cls: s0.classList.contains('sel'), who: $('#mixTool .mt-lab') ? $('#mixTool .mt-lab').textContent : null, to: $('#mixTool .mt-to b') ? $('#mixTool .mt-to b').textContent : null, name: s0.querySelector('.sb-name').textContent, fly: !!$('#squadFly.on') }; click(s0); await wait(30); out.tap.after = [selectedUnits.size, s0.classList.contains('sel'), $('#mixTool .mt-to b') ? $('#mixTool .mt-to b').textContent : null, !!$('#squadFly.on')];
    // HOLD: all three posted where the player is; the bar's cards are open slots
    squadMode = 'all'; if (!wide) { crystalMenuOpen = true; } mixToolRender(true); await wait(30);
    var room = partyRoomAt(player.x, player.y); click($('#mixTool [data-order=hold]')); await wait(60);
    out.hold = { names: names(), posted: partyPosted().length, rooms: partyPosted().map(function(f){ return f.post; }).join(), room: room, open: $$('#squadBar .sb-slot.empty .sb-open').map(function(e){ return getComputedStyle(e).display; }).join(), text: floatingTexts.slice(-2).map(function(t){ return t.text; }) };
    // an open slot opens the roster
    click($$('#squadBar .sb-slot')[1]); await wait(60); out.openSlot = { roster: ccOpenTab }; ccClose(); await wait(30);
    // a recruit fills a slot, the fourth is posted
    shardCount = 500; recruitFollower(); recruitFollower(); recruitFollower(); recruitFollower(); partyTick(); await wait(60);
    out.recruit = { names: names(), members: partyMembers().length, posted: partyPosted().length, fourth: followers[followers.length - 1].post || null };
    // the roster says which room each follower holds
    ccOpen('roster'); await wait(600);
    var cards = $$('#ccGrid .cc-card').map(function(c){ return { st: c.querySelector('.cc-status') ? c.querySelector('.cc-status').textContent : '', tags: Array.prototype.slice.call(c.querySelectorAll('.cc-tag')).map(function(t){ return t.textContent; }).join(',') }; });
    out.roster = { cards: cards, summary: $('#ccSummary') ? $('#ccSummary').textContent : '', stance: null };
    ccClose(); await wait(30);
    // the classic game has no bar
    facilityPlay = false; partyBarRender(true); await wait(30); out.classic = { on: bar.classList.contains('on'), shown: getComputedStyle(bar).display }; facilityPlay = true; partyBarRender(true);
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__pt'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pt-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__pt">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    // fixtures: a floor cell in a named room, a creature that stays where it is put, a clean squad of the given size in the Crystal Chamber
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__mk = (x, y, o) => { spawnPredatorForZone(1, { species: 'ant', className: 'scout' }); const a = actors[actors.length - 1]; a.x = x; a.y = y; a.team = 'red'; a.dead = false; a.level = 3; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.health = a.maxHealth = 1e7; a.state = (o && o.calm) ? 'wander' : 'hunt'; a.provoked = !(o && o.calm); return a; };
        globalThis.__fresh = (n, el) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all'; floatingTexts.length = 0; player.x = player.targetX = player.visualX = __cell('crystal_chamber')[0]; player.y = player.targetY = player.visualY = __cell('crystal_chamber')[1];
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e7; f.currentWill = 1e5; f.x = player.x + 0.5 + i * 0.2; f.y = player.y + 0.5; } return followers.slice(); };
        globalThis.__near = (room, x, y, lo, hi) => { const cs = partyRoomCells(room).filter(c => { const d = Math.hypot(c[0] - x, c[1] - y); return d >= lo && d <= hi; }); return cs[0]; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        globalThis.__room = f => partyRoomAt(f.x, f.y);`);

    group('THE SQUAD OF THREE');
    check('the facility starts with the squad of three, in slots 0, 1 and 2, and nobody holding a room; the classic game and the website\'s background have no squad rule', () => {
        const r = J(`(function(){ const o = {}; o.on = partyOn(); o.n = followers.length; o.mem = partyMembers().length; o.slots = partyOrdered().map(f => f.partySlot).join(); o.posted = partyPosted().length; facilityPlay = false; o.classic = partyOn(); facilityPlay = true; return o; })()`);
        same(r.on, true, 'partyOn in the facility'); same(r.n, 3, 'the start squad'); same(r.mem, 3, 'in the squad'); same(r.slots, '0,1,2', 'slots'); same(r.posted, 0, 'posted'); same(r.classic, false, 'partyOn in the classic game');
        ok(/attractOn\(\)/.test(rd('js/party.js').split('function partyOn')[1].split('\n')[0]), 'the background is not under the rule');
        same(run('PARTY.max'), 3, 'PARTY.max');
    });
    check('a fourth follower does not follow: it is posted in the room it is in (the Crystal Chamber for a recruit) and says so; the squad is still the first three, and the posted one walks that room\'s round instead of coming to you', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; floatingTexts.length = 0; spawnFollowerAtCrystal('ice'); const f4 = followers[followers.length - 1]; o.n = followers.length; o.mem = partyMembers().length; o.post = f4.post; o.stance = f4.stance; o.slot = f4.partySlot; o.said = floatingTexts.map(t => t.text).join('|');
            o.keep = fs.map(f => f.partySlot).join(); player.x = __cell('lab_hallway')[0]; player.y = __cell('lab_hallway')[1]; __frames(900); o.away = Math.hypot(f4.x - player.x, f4.y - player.y) > 10; o.room = __room(f4); return o; })()`);
        same(r.n, 4, 'followers'); same(r.mem, 3, 'in the squad'); same(r.post, 'crystal_chamber', 'the room it holds'); same(r.stance, 'hold', 'stance'); same(r.slot, undefined, 'it has no slot'); ok(/SQUAD FULL/.test(r.said) && /CRYSTAL CHAMBER/.test(r.said), 'it said: ' + r.said); same(r.keep, '0,1,2', 'the first three kept their slots');
        same(r.away, true, 'a posted follower came after the player'); same(r.room, 'crystal_chamber', 'it left its room');
    });
    check('a slot a member leaves (it dies, goes on the work crew) is free for the next one, which takes that slot; and a squad made over-full some other way is cut to three at the next tick (the newest are posted)', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; fs[1].dead = true; partySync(false); o.free = partyOrdered().map(f => f.partySlot).join(); spawnFollowerAtCrystal('flux'); const n = followers[followers.length - 1]; o.took = n.partySlot; o.post = n.post || null;
            fs[0].duty = 'worker'; partySync(false); o.worker = partyMembers().length; o.slots = partyOrdered().map(f => f.partySlot).join();
            const more = __fresh(3); const extra = { type: 'virus', element: 'fire', x: 1, y: 1, team: 'green', isFollower: true, dead: false, health: 5, maxHealth: 5, stance: 'follow', role: 'brawler', level: 1 }; actors.push(extra); followers.push(extra); partyTick(); o.over = [partyMembers().length, extra.post || null, extra.stance];
            return o; })()`);
        same(r.free, '0,2', 'the dead one\'s slot is free'); same(r.took, 1, 'the new follower takes the slot that was free'); same(r.post, null, 'it is not posted'); same(r.worker, 2, 'the work crew is not in the squad (the dead one and the worker are not in it)'); ok(/^1,/.test(r.slots) || /1/.test(r.slots), 'slots ' + r.slots);
        same(r.over[0], 3, 'the squad is cut to three'); same(typeof r.over[1], 'string', 'the extra one is posted'); same(r.over[2], 'hold', 'stance');
    });
    check('the battle tool\'s orders and the enemy card reach the SQUAD (ALL means the squad, not the followers holding rooms); select a posted follower in the roster and it is ordered too', () => {
        const r = J(`(function(){ const fs = __fresh(4), o = {}; const posted = fs.find(f => f.post); o.pool = getCommandPool().length; o.has = getCommandPool().includes(posted); selectedUnits.add(posted); o.sel = getCommandPool().length + ':' + getCommandPool().includes(posted); selectedUnits.clear();
            innerWidth = 500; squadMode = 'selected'; player.selectedElement = posted.element; o.el = getCommandPool().includes(posted); o.target = mixToolTarget(); innerWidth = 900; o.corners = [getCommandPool().includes(posted), mixToolTarget()]; squadMode = 'all'; return o; })()`);   // (the WHO row is a phone's: the corners layout has none, and says EVERYONE)
        same(r.pool, 3, 'ALL is the squad'); same(r.has, false, 'ALL includes a follower holding a room'); same(r.sel, '1:true', 'a selected posted follower is the pool'); same(r.el, false, 'an element chip reaches a posted follower'); ok(/^FIRE|^ELECTRIC|^CORE|^ICE|^TOXIC|^FLUX/.test(r.target), 'target ' + r.target); same(r.corners.join(), 'false,EVERYONE 3', 'the corners layout: an element left set reaches no posted follower, and the strip says EVERYONE');
    });

    group('ROOMS (HOLD posts a follower in the room it stands in; COME calls it back)');
    check('HOLD posts each follower in the room IT is in (two rooms, two posts), takes it out of the squad and says where; the stance is hold, with no job; a clone has no post', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const h = __cell('lab_hallway'), c = __cell('crystal_chamber'); fs[0].x = h[0]; fs[0].y = h[1]; fs[1].x = c[0]; fs[1].y = c[1]; fs[2].x = h[0] + 1; fs[2].y = h[1]; fs[1].job = { type: 'move', target: { x: 1, y: 1 } }; floatingTexts.length = 0;
            o.n = ccApplyStance(fs, 'hold'); o.posts = fs.map(f => f.post).join(); o.mem = partyMembers().length; o.stances = fs.map(f => f.stance + ':' + !!f.job).join(); o.said = floatingTexts.map(t => t.text).join('|');
            const clone = { isClone: true, isFollower: false, team: 'green', x: 3, y: 3, x0: 0, dead: false, stance: 'follow' }; o.clone = [ccApplyStance([clone], 'hold'), clone.post || null, clone.stance]; return o; })()`);
        same(r.n, 3, 'ordered'); same(r.posts, 'lab_hallway,crystal_chamber,lab_hallway', 'each follower holds the room it stood in'); same(r.mem, 0, 'out of the squad'); same(r.stances, 'hold:false,hold:false,hold:false', 'stance and job'); ok(/HOLD/.test(r.said) && /2 ROOMS/.test(r.said), 'said ' + r.said);
        same(r.clone[0], 1, 'a clone held'); same(r.clone[1], null, 'a clone was posted'); same(r.clone[2], 'hold', 'a clone\'s stance');
    });
    check('COME calls a posted follower back into the squad while it has room; with the squad full it stays posted and the player is told; with room for some, as many as fit come', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; ccApplyStance(fs, 'hold'); o.mem0 = partyMembers().length; floatingTexts.length = 0;
            o.one = [ccApplyStance([fs[0]], 'follow'), !fs[0].post, fs[0].stance, fs[0].partySlot !== undefined, partyMembers().length];
            o.two = ccApplyStance([fs[1], fs[2]], 'follow') + ':' + partyMembers().length; o.said = floatingTexts.map(t => t.text).join('|');
            const g = __fresh(4); const p4 = g.find(f => f.post); floatingTexts.length = 0; o.full = [ccApplyStance([p4], 'follow'), !!p4.post, partyMembers().length, floatingTexts.map(t => t.text).join('|')];
            ccApplyStance([g[0], g[1]], 'hold'); o.room = [ccApplyStance([p4, g[0], g[1]], 'follow'), !!p4.post, !!g[0].post, !!g[1].post, partyMembers().length]; return o; })()`);
        same(r.mem0, 0, 'everyone posted'); same(r.one.join(), '1,true,follow,true,1', 'one called'); same(r.two, '2:3', 'two more'); ok(/COME/.test(r.said), 'said ' + r.said);
        same(r.full[0], 0, 'a call with the squad full'); same(r.full[1], true, 'it stayed posted'); same(r.full[2], 3, 'the squad'); ok(/SQUAD FULL/.test(r.full[3]), 'said ' + r.full[3]); same(r.room.join(), '2,false,false,true,3', 'two slots, three called: two come (in order) and the last stays posted; the squad is full again');
    });
    check('a posted follower walks its room\'s round: over a long while it moves about the room (not just stands), never leaves it, and rests at its stops; it does not come after the player, and is not carried through a doorway, caught up or put in the player\'s route', () => {
        const r = J(`(function(){ const fs = __fresh(1), o = {}, f = fs[0]; const h = __cell('lab_hallway'); f.x = h[0]; f.y = h[1]; ccApplyStance([f], 'hold'); player.x = __cell('crystal_chamber')[0]; player.y = __cell('crystal_chamber')[1];
            let out = 0, moved = 0, px = f.x, py = f.y, maxd = 0, rests = 0, last = null; for (let i = 0; i < 3000; i++) { render(); if (__room(f) !== 'lab_hallway') out++; moved += Math.hypot(f.x - px, f.y - py); px = f.x; py = f.y; maxd = Math.max(maxd, Math.hypot(f.x - h[0], f.y - h[1])); if (f._patrol && f._patrol.wait > 0 && last !== f._patrol) { rests++; last = f._patrol; } }
            o.out = out; o.moved = moved > 6; o.maxd = maxd > 3; o.rests = rests > 2; o.dist = Math.hypot(f.x - player.x, f.y - player.y) > 8;
            o.carries = _pCarries(f); const bx = f.x, by = f.y; facilityCatchUp(f, bx, by); o.catchUp = f.x === bx && f.y === by; o.goals = _fpGoals(f).includes(player) || _fpGoals(f).includes(crystal); return o; })()`);
        same(r.out, 0, 'frames spent outside its room'); same(r.moved, true, 'it never moved'); same(r.maxd, true, 'it did not go round the room'); same(r.rests, true, 'it never rested at a stop'); same(r.dist, true, 'it went to the player'); same(r.carries, false, 'carried through a doorway'); same(r.catchUp, true, 'caught up'); same(r.goals, false, 'the player or the Crystal is what it walks to');
    });
    check('a posted follower fights the creatures IN its room (it goes for one that is hunting, and ignores one in the next room) and goes back to its round afterwards; a follower put outside its room walks back to it', () => {
        const r = J(`(function(){ const fs = __fresh(1), o = {}, f = fs[0]; f.role = 'brawler'; const h = __cell('lab_hallway', 0.3), c = __cell('crystal_chamber'); f.x = h[0]; f.y = h[1]; ccApplyStance([f], 'hold'); player.x = c[0]; player.y = c[1];
            const q = __near('lab_hallway', h[0], h[1], 3.5, 5), e = __mk(q[0], q[1]); __frames(400); o.near = Math.hypot(f.x - e.x, f.y - e.y) < 2.5; o.hit = e.health < e.maxHealth; o.targets = f._nearestEnemy === e; e.dead = true; __frames(40); o.after = f._nearestEnemy === null || f._nearestEnemy.dead;
            const far = __mk(c[0], c[1]); __frames(300); o.ignored = f._nearestEnemy !== far && Math.hypot(f.x - far.x, f.y - far.y) > 5; far.dead = true;
            f.x = c[0] + 1; f.y = c[1]; __frames(1200); o.back = __room(f); return o; })()`);
        same(r.near, true, 'it did not go to the creature in its room'); same(r.hit, true, 'it did not fight it'); same(r.targets, true, 'its target'); same(r.after, true, 'it still has a target'); same(r.ignored, true, 'it went after a creature in another room'); same(r.back, 'lab_hallway', 'it did not walk back to its room');
    });
    check('a posted follower sent at a creature from the enemy card goes (out of its room if it must) and goes back to its round after; RETREAT leaves it alone (it is not in the fight)', () => {
        const r = J(`(function(){ const fs = __fresh(1), o = {}, f = fs[0]; const h = __cell('lab_hallway', 0.3), c = __cell('crystal_chamber'); f.x = h[0]; f.y = h[1]; ccApplyStance([f], 'hold'); player.x = h[0]; player.y = h[1];
            const e = __mk(c[0], c[1], { calm: true }); selectedUnits.add(f); o.sent = mixToolAttack(e); o.stays = [f.post, f.stance]; __frames(900); o.went = Math.hypot(f.x - e.x, f.y - e.y) < 3 || e.health < e.maxHealth; e.dead = true; __frames(1500); o.back = [__room(f), f.post, f.attackOrder];
            selectedUnits.clear(); o.retreat = mixToolRetreat(); return o; })()`);
        same(r.sent, 1, 'sent'); same(r.stays.join(), 'lab_hallway,hold', 'the order took its post'); same(r.went, true, 'it did not go'); same(r.back.join(), 'lab_hallway,lab_hallway,', 'it did not go back to its room and its round'); same(r.retreat, 0, 'RETREAT took a follower holding a room');
    });
    check('what the roster says: a posted follower\'s status is HOLDING with the room it holds (HOLDING · MAIN HALLWAY on its card), a squad member\'s is FOLLOWING; INFO says the room; the tutorial counts posted followers near the Crystal', () => {
        const r = J(`(function(){ const fs = __fresh(2), o = {}; ccApplyStance([fs[0]], 'hold'); const a = unitStatus(fs[0]), b = unitStatus(fs[1]); o.a = [a.text, a.room]; o.b = [b.text, b.room || null]; o.info = JSON.stringify(unitInfo(fs[0]).jobs).indexOf('HOLDING THE CRYSTAL CHAMBER') >= 0;
            const c = ccRow(fs[0]); o.row = [c.holding, c.status.room]; fs[0].x = crystal.x; fs[0].y = crystal.y; o.held = tutHeld(); return o; })()`);
        same(r.a.join(), 'HOLDING,CRYSTAL CHAMBER', 'status'); same(r.b.join(), 'FOLLOWING,', 'a squad member'); same(r.info, true, 'INFO'); same(r.row.join(), 'true,CRYSTAL CHAMBER', 'the roster row'); same(r.held, 1, 'the tutorial\'s POSITION objective counts a posted follower');
        const cc = rd('js/commandcenter.js'); ok(/r\.status\.room \? " \\u00b7 " \+ r\.status\.room/.test(cc) && /want\.push\("POST"\)/.test(cc), 'the card does not show the room');
    });

    group('NEW FOLLOWERS (a recruit, an egg, a follower made again, one back from the dead)');
    check('a recruit with room joins the squad; with the squad full it holds the Crystal Chamber; an egg taken with the squad full holds the room the egg was in (and says so); with room it follows', () => {
        const r = J(`(function(){ const fs = __fresh(2), o = {}; shardCount = 500; recruitFollower('brawler', 'fire'); o.join = [partyMembers().length, partyPosted().length]; recruitFollower('brawler', 'ice'); o.full = [partyMembers().length, partyPosted().length, followers[followers.length - 1].post];
            const s = _fp.spots[0]; const g = __fresh(3); s.egg = _fpSpotEgg(s); actors.push(s.egg); floatingTexts.length = 0; const f = facilityFollowerSpotTake(s); o.egg = [f.post, s.room, f.stance, floatingTexts.map(t => t.text).join('|')];
            const g2 = __fresh(2); const s2 = _fp.spots[1]; s2.egg = _fpSpotEgg(s2); actors.push(s2.egg); const f2 = facilityFollowerSpotTake(s2); o.eggRoom = [f2.post || null, f2.stance, partyMembers().length]; return o; })()`);
        same(r.join.join(), '3,0', 'a recruit with room'); same(r.full.join(), '3,1,crystal_chamber', 'a recruit with the squad full'); same(r.egg[0], r.egg[1], 'the egg holds ITS room'); same(r.egg[2], 'hold', 'stance'); ok(/HOLDS THE/.test(r.egg[3]), 'said ' + r.egg[3]); same(r.eggRoom.join(), ',follow,3', 'an egg with room follows');
    });
    check('a unit put back on the line from the work crew joins the squad if it has room and holds its room if not; a follower made again (RE-ROLL) leaves the squad and is admitted again when it is back', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const w = fs[0]; w.duty = 'worker'; spawnFollowerAtCrystal('ice'); const n = followers[followers.length - 1]; o.n = [partyMembers().length, n.post || null]; setFollowerDuty(w, 'fighter', true); o.back = [!!w.post, w.stance, partyMembers().length];
            const g = __fresh(2); const f = g[0]; startFollowerReroll(f, true); o.gone = [followers.includes(f), partyMembers().length]; f.x = crystal.x + 0.2; f.y = crystal.y; for (let i = 0; i < 200 && !followers.includes(f); i++) render(); o.again = [followers.includes(f), partyMembers().length, f.post || null]; return o; })()`);
        same(r.n.join(), '3,', 'the new follower took the slot the work crew left'); same(r.back[0], true, 'back on the line with the squad full: posted'); same(r.back[1], 'hold', 'stance'); same(r.gone.join(), 'false,1', 'a re-roll leaves the squad'); same(r.again.join(), 'true,2,', 'it is back and in the squad');
    });
    check('a game is saved with the rooms its followers hold and loaded with them (each in its room again); more than three saved followers with no room come back three following and the rest holding the Crystal Chamber; a follower that dies holding a room is made again holding it', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const h = __cell('lab_hallway'); fs[0].x = h[0]; fs[0].y = h[1]; ccApplyStance([fs[0]], 'hold'); const snap = followerRosterSnapshot(); o.snap = snap.map(e => e.post || null).join();
            __fresh(0); for (const e of snap) spawnFollowerFromSave(e); o.load = [partyMembers().length, partyPosted().length, partyPosted().map(f => f.post).join()]; partyPlacePosted(); o.at = partyPosted().map(f => __room(f)).join();
            __fresh(0); const old = snap.concat(snap.map(e => Object.assign({}, e, { post: undefined }))); for (const e of old) spawnFollowerFromSave(Object.assign({}, e, { post: e === snap[0] ? e.post : undefined })); o.many = [followers.length, partyMembers().length, partyPosted().length]; return o; })()`);
        same(r.snap, 'lab_hallway,,', 'saved'); same(r.load.join(), '2,1,lab_hallway', 'loaded'); same(r.at, 'lab_hallway', 'put in its room'); ok(r.many[0] === 6 && r.many[1] === 3 && r.many[2] === 3, 'a crowded save: ' + r.many.join());
        const g = rd('js/game.js'); ok(/post: a\.post \|\| undefined, playStyle: a\.playStyle/.test(g) && /if \(entry\.post\) \{ npc\.post = entry\.post; npc\.stance = "hold"; \}/.test(g), 'a dead follower\'s respawn does not keep its post');
    });

    group('THE AMMUNITION: a small icon with the count (js/targeting.js)');
    check('the facility draws no chip at the bottom: the ammunition is a faint pill with a cartridge and the round count at the round button\'s place (under its name with a creature locked, in its place with none), amber while armed, red when empty, and a tap on it stows the gun; the classic game keeps its chip', () => {
        const r = J(`(function(){ const o = {}; __fresh(1); const calls = []; const keepB = uiButton; uiButton = function (r, t) { calls.push(t); return keepB.apply(this, arguments); };
            const dr = () => { try { drawAmmoChip(); return null; } catch (e) { return e.message; } }; o.chip = [dr(), calls.length]; facilityPlay = false; calls.length = 0; o.classicChip = [dr(), calls.length]; facilityPlay = true; uiButton = keepB;
            o.hud = weaponHud(); o.hud2 = typeof weaponHud().kind + ':' + weaponHud().n;
            playerAttackMode = false; _ATKCHIP.w = 0; let err = null; try { drawTargetUI(); } catch (e) { err = e.message; } o.idle = [err, _ATKCHIP.w];
            innerWidth = 500; playerAttackMode = true; err = null; try { drawTargetUI(); } catch (e) { err = e.message; } o.armed = [err, _ATKCHIP.w > 20, _ATKCHIP.h > 20, _ATKCHIP.x < 100, _ATKCHIP.y > 100]; innerWidth = 900; err = null; try { drawTargetUI(); } catch (e) { err = e.message; } o.armedCorner = [err, _ATKCHIP.w > 20, _ATKCHIP.h > 20, _ATKCHIP.x > canvas.width / 2, _ATKCHIP.y > canvas.height / 2]; playerAmmo = 0; err = null; try { drawTargetUI(); } catch (e) { err = e.message; } o.dry = [err, weaponHud().dry]; playerAmmo = 12; playerAttackMode = false; return o; })()`);
        same(r.chip.join(), ',0', 'the bottom chip is drawn in the facility'); same(r.classicChip[1], 1, 'the classic game has lost its chip'); same(r.hud.kind, 'ammo', 'hud kind'); ok(r.hud.n >= 0, 'hud n');
        same(r.idle.join(), ',0', 'the tap area with the gun away'); same(r.armed.join(), ',true,true,true,true', 'the tap area while armed (a phone: top left, by the round button)'); same(r.armedCorner.join(), ',true,true,true,true', 'the tap area while armed (the corners layout: bottom right, by the dial)'); same(r.dry[0], null, 'drawing it empty');
        const t = rd('js/targeting.js'); ok(/function _tgAmmoIcon/.test(t) && /_tgCartridge/.test(t) && /_tgFuelCell/.test(t) && !/CLICK OR HOLD/.test(t), 'the icon is missing, or the old caption is back'); ok(/if \(typeof facilityPlay !== "undefined" && facilityPlay\) return;/.test(rd('js/ui.js')), 'ui.js still draws the chip in the facility');
    });

    group('THE SQUAD BAR AND THE ROSTER (real browser)');
    for (const [w, h] of [[1180, 820], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const wide = w > 700;
        check(w + ': three small roster cards (name, LV · FOLLOWING, health, picture, INFO): ' + (wide ? 'stacked at the bottom left over the battle tool (the corners layout)' : 'across the top of the dock, centred') + ', on the screen' + (wide ? '' : ', clear of the battle tool') + '; the bar is where the ammunition chip was', () => {
            same(r.start.on, true, 'the bar is not on'); same(r.start.slots, 3, 'slots'); ok(r.start.names.every(n => n !== '-' && n.length > 4), 'names ' + r.start.names); ok(r.start.subs.every(s => /^LV 9 · FOLLOWING$/.test(s)), 'subs ' + r.start.subs); ok(r.start.hp.every(x => x === '100%'), 'hp ' + r.start.hp); same(r.start.thumbs, 3, 'pictures'); same(r.start.info, 3, 'info buttons');
            same(r.place.aboveDock, true, 'over the dock'); same(r.place.overPod, false, 'the bar is over the BATTLE chip'); same(r.place.dockShown, wide, 'the dock'); same(r.place.onScreen, true, 'on the screen'); if (wide) { same(r.place.stacked, true, 'the corners layout: the three cards are stacked at the bottom left, over the battle tool'); ok(r.place.w >= 200 && r.place.w <= 260 && r.place.h >= 150 && r.place.h <= 240, 'stack size ' + r.place.w + 'x' + r.place.h); } else { same(r.place.centred, true, 'centred'); ok(r.place.w >= 300 && r.place.h >= 28 && r.place.h <= 80, 'size ' + r.place.w + 'x' + r.place.h); } same(r.place.overTool, false, 'over the battle tool');   // (a phone's cards have no picture: shorter)   // (a phone's cards have no picture: shorter)
        });
        check(w + ': a tap on a card selects that follower (a ring under it, the tool says who: ORDERS TO the member; a phone: SEL 1) and a second tap lets it go; HOLD posts the squad where the player is (the bar shows three open slots, a message says the room); a tap on an open slot opens the roster', () => {
            same(r.tap.sel, 1, 'selected'); same(r.tap.cls, true, 'the card is not marked'); if (wide) { ok(r.tap.to && r.tap.to !== '3 FOLLOWING' && r.tap.name.length > 4, 'the tool names the picked member: ' + r.tap.to); same(r.tap.fly, true, 'the member\'s card does not open beside the stack'); same(r.tap.after.join(), '0,false,3 FOLLOWING,false', 'a second tap: ALL, and the card goes'); } else same(r.tap.after.slice(0, 2).join(), '0,false', 'a second tap');
            same(r.hold.names.join(), '-,-,-', 'the bar after HOLD'); same(r.hold.posted, 3, 'posted'); ok(r.hold.rooms.split(',').every(x => x === r.hold.room), 'rooms ' + r.hold.rooms + ' vs ' + r.hold.room); ok(r.hold.open.split(',').every(x => x === 'block'), 'open slots ' + r.hold.open); ok(r.hold.text.some(t => /^HOLD/.test(t)), 'said ' + r.hold.text);
            same(r.openSlot.roster, 'roster', 'an open slot does not open the roster');
        });
        check(w + ': recruiting fills the open slots (three in the squad, the fourth holds the Crystal Chamber); the roster\'s cards say HOLDING · the room and carry a POST tag, the squad\'s say FOLLOWING; its summary counts the squad; the classic game has no bar', () => {
            same(r.recruit.members, 3, 'the squad'); same(r.recruit.posted, 4, 'posted (the three held, and the fourth recruit)'); same(r.recruit.fourth, 'crystal_chamber', 'the fourth recruit'); same(r.recruit.names.filter(n => n !== '-').length, 3, 'the bar');
            const posted = r.roster.cards.filter(c => /^HOLDING · /.test(c.st)); same(posted.length, 4, 'cards that say the room'); ok(posted.every(c => /POST/.test(c.tags)), 'a POST tag'); ok(r.roster.cards.filter(c => /^FOLLOWING/.test(c.st)).length === 3, 'FOLLOWING cards'); ok(/^SQUAD 3\/3 · 4 POSTED/.test(r.roster.summary), 'summary ' + r.roster.summary);
            same(r.classic.on, false, 'the bar is on in the classic game'); same(r.classic.shown, 'none', 'shown in the classic game');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
