// HOLD, THEN COME (js/party.js partyApplyStance, js/mixtool.js mixToolComePool, js/helpers.js getCommandPool; the facility).
// REPORTED: "whenever I have a squad and they're following me around, I click on one of the followers in my little open menu that's permanent on the screen, and I click hold with just one of my followers, which is fine. He starts holding
// that position. But then whenever I click on that follower, or whenever I have it selected and I click come, it doesn't come. It still holds. Fix that."
// The cause: HOLD takes the follower out of the squad (its card on the bar becomes an open slot) and COME reached only the squad: a follower holding a room was left out of the pool unless it was selected, and nothing said so. A tap on its old slot
// (it then opened the roster and let go of the selection) left COME nothing to bring back.
// The logic runs in the sandbox, the bar, the tool's buttons and the taps in the real browser (no Chromium: it says so and passes).
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

// The real page, in the facility: the squad of three on the bar, the tool's HOLD and COME, taps on the bar's cards and open slots.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #ccRoot, #ccRoot * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var slots = function(){ return $$('#squadBar .sb-slot'); };
  var bar = function(){ return slots().map(function(e){ return e.classList.contains('empty') ? '[' + e.querySelector('.sb-open').textContent + ']' : e.querySelector('.sb-name').textContent; }); };
  var said = function(){ return floatingTexts.slice(-2).map(function(t){ return t.text; }).join(' / '); };
  var order = async function(id){ click($('#mixTool [data-order=' + id + ']')); await wait(80); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = !mixToolWide(); mixToolRender(true); partyTick(); await wait(80);
    var F = partyOrdered()[0], G = partyOrdered()[1], nm = function(f){ return unitTypeLabel(f); };
    out.start = { squad: partyMembers().length, bar: bar(), F: nm(F) };
    // THE REPORTED FLOW: a card on the bar, HOLD in the tool; it holds, it leaves the squad (and the selection); its slot says who it would call back; COME with nothing selected brings it back, into the same card
    click(slots()[0]); await wait(60); out.selected = { sel: selectedUnits.size, lit: slots()[0].classList.contains('sel') };
    await order('hold'); floatingTexts.length = 0;
    out.held = { post: F.post || null, stance: F.stance, member: partyIsMember(F), sel: selectedUnits.size, bar: bar(), call: slots()[0].classList.contains('call'), others: partyMembers().length, label: slots()[0].querySelector('.sb-open').textContent, callText: 'CALL ' + nm(F) };
    await order('follow');
    out.come = { post: F.post || null, stance: F.stance, member: partyIsMember(F), slot: F.partySlot, bar: bar(), said: said(), size: floatingTexts.length ? floatingTexts[floatingTexts.length - 1].size : 0, call: slots()[0].classList.contains('call') };
    // the same, and then a tap on the follower's OLD SLOT: it comes back (one follower holds a room: it is not a choice), the roster does not open
    click(slots()[0]); await wait(60); await order('hold'); var shot = bar().join('|'); click(slots()[0]); await wait(80);
    out.slotTap = { before: shot, member: partyIsMember(F), slot: F.partySlot, tab: ccOpenTab, sel: selectedUnits.size, bar: bar() };
    // two held (select two on the bar): their slots are a choice, not a call: a tap opens the roster on the ones that could fill it; COME brings both back
    click(slots()[0]); click(slots()[1]); await wait(60); await order('hold');
    out.two = { held: partyPosted().length, bar: bar(), calls: slots().filter(function(e){ return e.classList.contains('call'); }).length, sel: selectedUnits.size };
    click($$('#squadBar .sb-slot.empty')[0]); await wait(120); out.twoTap = { tab: ccOpenTab, filter: ccFilter.squad, sel: selectedUnits.size, members: partyMembers().length }; ccClose(); await wait(40);
    await order('follow'); out.twoCome = { held: partyPosted().length, members: partyMembers().length, said: said(), slots: partyOrdered().map(function(f){ return f.partySlot; }).join() };
    // HOLD with nobody selected posts the whole squad, and COME with nobody selected brings the whole squad back
    selectedUnits.clear(); await order('hold'); out.all = { held: partyPosted().length, members: partyMembers().length, bar: bar() }; await order('follow'); out.allBack = { held: partyPosted().length, members: partyMembers().length };
    // THE SQUAD FULL: one holds, a recruit takes the free slot; COME says so (large), and the follower keeps holding; with it selected the same; a slot freed (another removed) and it comes
    click(slots()[0]); await wait(60); await order('hold'); shardCount = 900; recruitFollower(); partyTick(); await wait(60); floatingTexts.length = 0;
    out.full0 = { members: partyMembers().length, held: partyPosted().length, F: !!F.post };
    await order('follow'); var big = floatingTexts[floatingTexts.length - 1];
    out.fullCome = { held: !!F.post, member: partyIsMember(F), said: said(), size: big ? big.size : 0, members: partyMembers().length };
    selectedUnits.clear(); selectedUnits.add(F); ccRender && 0; await order('follow'); out.fullSel = { held: !!F.post, said: said(), sel: selectedUnits.size };
    // a slot freed (another member taken out): with F selected, COME brings F (the selection wins); with nobody selected it would be the one held last: the one just taken out
    selectedUnits.clear(); var R = partyOrdered()[2]; partyRemove([R]); await wait(40); selectedUnits.clear(); selectedUnits.add(F);
    await order('follow'); out.freeCome = { Fin: partyIsMember(F), Rheld: !!R.post, held: partyPosted().length, members: partyMembers().length, said: said() };
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__hc'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hc-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__hc">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');   // (the page boots the facility: the start returns early; only the tutorial's blackout is lifted)
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = (n) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all'; selectedRole = null; floatingTexts.length = 0; frame = 1000; player.x = player.targetX = player.visualX = __cell('crystal_chamber')[0]; player.y = player.targetY = player.visualY = __cell('crystal_chamber')[1];
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e7; f.currentWill = 1e5; f.x = player.x + 0.5 + i * 0.2; f.y = player.y + 0.5; } partyTick(); return followers.slice(); };
        globalThis.__say = () => floatingTexts.map(t => t.text).join(' | ');`);

    group('HOLD, THEN COME (the facility)');
    check('HOLD with one selected posts it (out of the squad AND the selection, so the orders go back to the squad); COME with nobody selected brings it back, says who came, and the squad\'s cards do not move', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}, F = fs[1]; const slot = F.partySlot; selectedUnits.add(F); mixToolOrder('hold'); o.hold = [F.post, F.stance, partyIsMember(F), selectedUnits.size, getCommandPool().length, partyMembers().length];
            frame += 600; floatingTexts.length = 0; o.come = [mixToolOrder('follow'), partyIsMember(F), F.partySlot === slot, !!F.post, F.stance, __say(), floatingTexts.map(t => t.size).join()]; return o; })()`);
        same(r.hold[0], 'crystal_chamber', 'its room'); same(r.hold[1], 'hold', 'stance'); same(r.hold[2], false, 'in the squad'); same(r.hold[3], 0, 'still selected after HOLD'); same(r.hold[4], 2, 'the orders reach the squad'); same(r.hold[5], 2, 'the squad');
        ok(r.come[0] >= 1, 'COME did not call it: ' + r.come[0]); same(r.come[1], true, 'it is back in the squad'); same(r.come[2], true, 'the same card'); same(r.come[3], false, 'it still holds'); same(r.come[4], 'follow', 'stance'); ok(/COME · .* IS BACK IN THE SQUAD/.test(r.come[5]), 'said ' + r.come[5]); same(r.come[6], '16', 'the message is not large');
    });
    check('COME calls back the follower held LAST first: with two held and one slot free the newer comes and the other keeps holding (SQUAD FULL, said large); with room for both, both come; the squad\'s own members are left as they were', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}, A = fs[0], B = fs[1], C = fs[2]; selectedUnits.add(A); mixToolOrder('hold'); frame += 300; selectedUnits.clear(); selectedUnits.add(B); mixToolOrder('hold'); o.held = partyHeld().map(f => f === B ? 'B' : f === A ? 'A' : '?').join(); o.members = partyMembers().length; o.order = partyHeld()[0] === B;
            partyCall(C, true); const D = (() => { spawnFollowerAtCrystal('flux'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e7; return f; })(); partySync(false); o.afterD = [partyMembers().length, !!D.post];
            floatingTexts.length = 0; o.one = [mixToolOrder('follow'), partyIsMember(B), !!A.post, __say(), floatingTexts.map(t => t.size).join()]; return o; })()`);
        same(r.held, 'B,A', 'newest first'); same(r.members, 1, 'the squad'); same(r.order, true, 'the newest is first');
        same(r.afterD[0], 2, 'the squad with the new follower'); same(r.one[1], true, 'the one held last came'); same(r.one[2], true, 'the older one kept holding'); ok(/SQUAD FULL · 3 OF 3 · .* KEEPS HOLDING · .* CAME/.test(r.one[3]), 'said ' + r.one[3]); same(r.one[4].split(',').pop(), '16', 'the refusal is not large');
        const r2 = J(`(function(){ const fs = __fresh(3), o = {}; selectedUnits.add(fs[0]); selectedUnits.add(fs[1]); mixToolOrder('hold'); selectedUnits.clear(); floatingTexts.length = 0; const m = partyMembers()[0], slot = m.partySlot; o.n = mixToolOrder('follow'); o.back = [partyMembers().length, partyPosted().length, m.partySlot === slot, __say()]; return o; })()`);
        same(r2.back[0], 3, 'both come when there is room'); same(r2.back[1], 0, 'still holding'); same(r2.back[2], true, 'the member that stayed kept its card'); ok(/COME · 2 FOLLOWERS ARE BACK IN THE SQUAD/.test(r2.back[3]), 'said ' + r2.back[3]);
    });
    check('COME with the squad full: a follower holding a room keeps holding and the player is told (SQUAD FULL, large, and who keeps holding), selected or not; free a slot and it comes', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}, F = fs[0]; selectedUnits.add(F); mixToolOrder('hold'); spawnFollowerAtCrystal('flux'); const N = followers[followers.length - 1]; N.returningToCrystal = false; N.spawnProtection = 1e9; N.health = N.maxHealth = 1e7; partySync(false);
            o.full = [partyMembers().length, partyIsMember(N), !!F.post]; floatingTexts.length = 0; mixToolOrder('follow'); o.none = [!!F.post, __say(), floatingTexts.map(t => t.size).join()];
            selectedUnits.add(F); floatingTexts.length = 0; mixToolOrder('follow'); o.sel = [!!F.post, __say()]; partyRemove([N]); selectedUnits.clear(); mixToolOrder('follow'); o.free = [partyIsMember(F), !!N.post]; return o; })()`);
        same(r.full.join(), '3,true,true', 'the squad is full and F holds'); same(r.none[0], true, 'COME called it into a full squad'); ok(/SQUAD FULL · 3 OF 3 · .* KEEPS HOLDING/.test(r.none[1]), 'said ' + r.none[1]); same(r.none[2], '16', 'not large'); same(r.sel[0], true, 'selected: COME called it into a full squad'); ok(/SQUAD FULL/.test(r.sel[1]), 'said ' + r.sel[1]); same(r.free.join(), 'true,true', 'a slot freed: it comes');
    });
    check('COME honours the WHO row (a phone\'s: the corners layout has none and reaches everyone) for the followers holding rooms (an element, a role) and the selection (the selected ones only, held or not); it ends the squad\'s attack orders; with nobody at all it says so; the pool the other orders use still leaves the held out', () => {
        const r = J(`(function(){ innerWidth = 500; const fs = __fresh(4), o = {}, held = fs.filter(f => f.post)[0]; const ms = fs.filter(f => !f.post); selectedUnits.add(ms[0]); selectedUnits.add(ms[1]); mixToolOrder('hold'); selectedUnits.clear(); const A = ms[0], B = ms[1];
            squadMode = 'selected'; selectedRole = null; player.selectedElement = A.element; o.elA = A.element; o.elB = B.element; o.poolEl = mixToolComePool().map(f => f.element).join(); player.selectedElement = B.element; o.poolB = mixToolComePool().map(f => f.element).join(); mixToolOrder('follow'); o.el = [partyIsMember(B), !!A.post, !!held.post];
            squadMode = 'all'; selectedUnits.add(A); o.sel = mixToolComePool().length; selectedUnits.clear(); o.defaultPool = getCommandPool().some(f => !!f.post); o.withHeld = getCommandPool(true).some(f => !!f.post);
            const fol = partyMembers()[0]; fol.attackOrder = { target: {}, until: frame + 1000 }; mixToolOrder('follow'); o.attack = fol.attackOrder === null;
            squadMode = 'selected'; player.selectedElement = A.element; innerWidth = 900; o.cornersPool = mixToolComePool().length; o.cornersAll = getCommandPool(true).length; o.cornersTarget = mixToolTarget(); squadMode = 'all'; innerWidth = 500;   // (the corners layout has no WHO row: an element left over from a phone is not heard)
            followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; floatingTexts.length = 0; mixToolOrder('follow'); o.nobody = __say(); innerWidth = 900; return o; })()`);
        same(r.cornersPool, r.cornersAll, 'the corners layout: COME reaches everyone, whatever element a phone left set'); ok(/^EVERYONE/.test(r.cornersTarget), 'the corners layout says EVERYONE: ' + r.cornersTarget);
        same(r.poolEl, r.elA, 'the pool of the first element'); same(r.poolB, r.elB, 'the pool of the second element'); same(r.el[0], true, 'the element\'s held follower came'); same(r.el[1], true, 'another element\'s kept holding'); same(r.sel, 1, 'the selection wins'); same(r.defaultPool, false, 'the default pool has a follower holding a room'); same(r.withHeld, true, 'COME\'s pool leaves them out'); same(r.attack, true, 'COME did not end the attack order'); ok(/NOBODY TO ORDER/.test(r.nobody), 'said ' + r.nobody);
    });
    check('the bar says what an open slot does: with ONE follower holding a room it is "+ CALL <that one>" (a tap on it brings it back, no roster); with none or several it is "+ OPEN SLOT" (a tap lists who could fill it); the code ties the label, the class and the tap together', () => {
        const p = rd('js/party.js'); ok(/held\.length === 1 \? held\[0\] : null/.test(p) && /"\+ CALL " \+/.test(p) && /"\+ OPEN SLOT"/.test(p), 'the label'); ok(/if \(hit\.call\) \{ partyAdd\(\[hit\.call\]\)/.test(p), 'the bar\'s tap'); ok(/if \(hit\.call\) partyAdd\(\[hit\.call\]\); else if/.test(p), 'the box\'s tap');
        ok(/\.sb-slot\.empty\.call/.test(rd('game.html')), 'the css'); ok(/pool: \(\) => mixToolComePool\(\)/.test(rd('js/mixtool.js')) && /o && o\.pool \? o\.pool\(\) : mixToolPool\(\)/.test(rd('js/mixtool.js')), 'COME\'s pool is not wired'); ok(/function getCommandPool\(withHeld\)/.test(rd('js/helpers.js')), 'getCommandPool(withHeld)');
    });

    group('THE REPORTED FLOW (real browser)');
    for (const [w, h] of [[1180, 820], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        check(w + ': a card on the bar, HOLD in the tool: it holds, leaves the squad and the selection, and its slot says "+ CALL <it>" (lit); COME with nobody selected brings it back into the same card and says so, large', () => {
            same(r.start.squad, 3, 'the squad'); same(r.selected.sel, 1, 'selected'); same(r.selected.lit, true, 'the card is not lit'); same(r.held.post !== null, true, 'it does not hold'); same(r.held.stance, 'hold', 'stance'); same(r.held.member, false, 'still in the squad'); same(r.held.sel, 0, 'still selected after HOLD'); same(r.held.others, 2, 'the others');
            same(r.held.bar[0], '[+ CALL ' + r.start.F + ']', 'the slot says who it would call'); same(r.held.call, true, 'the slot is not lit as a call'); same(r.come.member, true, 'COME did not bring it back'); same(r.come.post, null, 'it still holds'); same(r.come.slot, 0, 'the same card'); same(r.come.bar[0], r.start.F, 'the bar'); ok(/COME · .* IS BACK IN THE SQUAD/.test(r.come.said), 'said ' + r.come.said); same(r.come.size, 16, 'large'); same(r.come.call, false, 'the slot is still a call');
        });
        check(w + ': a tap on the held follower\'s old slot (while ONE holds a room) brings it back into that card without opening the roster; with TWO holding, their slots are "+ OPEN SLOT" (not a call) and a tap lists who could fill them (the roster on NOT IN SQUAD, nothing selected); COME brings both back', () => {
            same(r.slotTap.before.split('|')[0], '[+ CALL ' + r.start.F + ']', 'the slot before the tap'); same(r.slotTap.member, true, 'the tap did not bring it back'); same(r.slotTap.slot, 0, 'its card'); same(r.slotTap.tab, null, 'the roster opened'); same(r.slotTap.bar[0], r.start.F, 'the bar');
            same(r.two.held, 2, 'two held'); same(r.two.bar.slice(0, 2).join(), '[+ OPEN SLOT],[+ OPEN SLOT]', 'the slots of two held'); same(r.two.calls, 0, 'a call with two held'); same(r.twoTap.tab, 'roster', 'the roster did not open'); same(r.twoTap.filter, 'out', 'the list'); same(r.twoTap.sel, 0, 'its selection');
            same(r.twoCome.held, 0, 'COME left one holding'); same(r.twoCome.members, 3, 'the squad'); same(r.twoCome.slots, '0,1,2', 'the cards'); ok(/BACK IN THE SQUAD/.test(r.twoCome.said), 'said ' + r.twoCome.said);
        });
        check(w + ': HOLD and COME with nobody selected take the whole squad out and back; with the squad full COME leaves the follower holding and says so in large type, selected or not; with a slot free it comes', () => {
            same(r.all.held, 3, 'the whole squad held'); same(r.all.members, 0, 'the squad'); same(r.all.bar.join(), '[+ OPEN SLOT],[+ OPEN SLOT],[+ OPEN SLOT]', 'the bar'); same(r.allBack.held, 0, 'COME brought them back'); same(r.allBack.members, 3, 'the squad');
            same(r.full0.members, 3, 'the squad is full'); same(r.full0.F, true, 'F holds'); same(r.fullCome.held, true, 'COME called it into a full squad'); ok(/SQUAD FULL · 3 OF 3 · .* KEEPS HOLDING/.test(r.fullCome.said), 'said ' + r.fullCome.said); same(r.fullCome.size, 16, 'large'); same(r.fullSel.held, true, 'selected: COME called it into a full squad'); ok(/SQUAD FULL/.test(r.fullSel.said), 'said ' + r.fullSel.said);
            same(r.freeCome.Fin, true, 'a slot freed: it did not come'); same(r.freeCome.Rheld, true, 'the one taken out was brought back too'); ok(/BACK IN THE SQUAD/.test(r.freeCome.said), 'said ' + r.freeCome.said);
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
