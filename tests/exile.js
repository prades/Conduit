// EXILE (js/party.js partyExile, partyExileTap; the buttons in js/commandcenter.js, js/radialmenu.js).
// ASKED: "I need to be able to get rid of followers and exile them in room for other followers that I might find or come across." Chosen with the user: EXILE, the word everywhere (what the forced cases called
// "retire" too), and nothing back. ASKED, then: "it would not be on the home screen side HUD roster. I think it would be in the main roster with all the creatures in the separate window."
//   THE ACT       a follower exiled leaves your roster for good: no body, no coming back, out of the save; its squad slot or its room's place is free; nothing is given back
//   THE ASK       its button asks first: the first tap arms it (TAP AGAIN TO EXILE), the second within PARTY.exileArm does it; the arm lapses; one follower's armed button never exiles another
//   THE BUTTONS   in the roster: the Command Center (the carousel's row for the one in view; the side panel for those selected), the phone's ROSTER cards; not on the squad's own cards (a squad
//                 member's card on the fly beside the HUD's stack, the phone's SQUAD): in the real page
//   THE WORD      the forced cases say EXILE (a full squad with no room free, the arena over six)
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
// The real page: five followers (three in the squad, two holding rooms), then each button: tap once (it asks), tap again (it is gone).
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    shardCount = 1000; for (var i = followers.length; i < 5; i++) recruitFollower(); partyTick(); await wait(50);
    var count = function(){ return followers.filter(function(f){ return !f.dead; }).length; }, wide = typeof hudCorners === 'function' && hudCorners();
    out.wide = wide; out.start = count(); out.squad = partyMembers().length;
    if (wide) {
      // THE CAROUSEL'S ROW: the one in view
      var held = partyPosted()[0]; selectedUnits.clear(); ccOpen('roster'); await wait(300); _ccFocus = held; ccRender(); await wait(60);
      var b = $('#ccSide .cc-exile'); out.ccLabel0 = b ? b.textContent : null; click(b); await wait(60);
      b = $('#ccSide .cc-exile'); out.ccLabel1 = b ? b.textContent : null; out.ccStill = !held.dead; click(b); await wait(60);
      out.ccGone = [held.dead === true, held.exiled === true, count(), _ccFocus !== held]; ccClose(); await wait(30);
      // A SQUAD MEMBER'S CARD ON THE FLY (beside the HUD's stack): no EXILE there, it is the roster's
      var m = partyOrdered()[0]; selectedUnits.clear(); ccToggle(m); partyFlyRender(true); await wait(60);
      out.fly = { on: !!$('#squadFly.on'), exile: !!$('#squadFly .sf-exile, #squadFly [data-act=exile]'), btns: $$('#squadFly .sf-btn').map(function(b){ return b.textContent; }), said: /EXILE/.test(($('#squadFly') || {}).textContent || '') };
      selectedUnits.clear(); partyTick();
    } else {
      // THE PHONE'S SQUAD: its cards have no EXILE (it is the roster's)
      radialToggle(true); radialPick('squad'); await wait(80); out.phoneSquad = { cards: $$('#radialPanel .rp-card:not(.rp-open)').length, exile: $$('#radialPanel .rp-exile').length };
      // THE PHONE'S ROSTER: every card has EXILE
      radialPick('roster'); await wait(80); out.phoneRoster = { cards: $$('#radialPanel .rp-card').length, exile: $$('#radialPanel .rp-card .rp-exile').length };
      var card = $$('#radialPanel .rp-card')[0], f0 = radialRosterRows()[0].f, e0 = card ? card.querySelector('.rp-exile') : null; out.phoneLabel0 = e0 ? e0.textContent : null; click(e0); await wait(60);
      card = $$('#radialPanel .rp-card')[0]; e0 = card ? card.querySelector('.rp-exile') : null; out.phoneLabel1 = e0 ? e0.textContent : null; out.phoneStill = !f0.dead; click(e0); await wait(60);
      out.phoneGone = [f0.dead === true, f0.exiled === true, count()]; radialToggle(false); await wait(30);
      // THE SIDE PANEL: two selected, one button for both
      var two = followers.filter(function(f){ return !f.dead; }).slice(0, 2); selectedUnits.clear(); two.forEach(function(f){ selectedUnits.add(f); }); ccOpen('roster'); await wait(300); ccRender(); await wait(60);
      var s = $('#ccSide .cc-exile'); out.sideLabel0 = s ? s.querySelector('.cc-bl').textContent : null; click(s); await wait(60);
      s = $('#ccSide .cc-exile'); out.sideLabel1 = s ? s.querySelector('.cc-bl').textContent : null; click(s); await wait(60);
      out.sideGone = [two.every(function(f){ return f.dead && f.exiled; }), count()]; ccClose(); await wait(30);
    }
    out.saved = (facilitySaveCollect().followers || []).length; out.alive = count();
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__ex'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ex-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ex">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;
        globalThis.__clock = 0; performance.now = () => __clock;   // (the arm's window is in ms: the test moves the clock)
        globalThis.__fresh = (n) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); floatingTexts.length = 0;
            shardCount = 5000; for (let i = 0; i < n; i++) recruitFollower(); partyTick(); for (const f of followers) { f.returningToCrystal = false; f.spawnProtection = 1e9; } partySync(false); return followers.slice(); };
        globalThis.__sweep = () => { for (let i = 0; i < 3; i++) render(); };`);

    group('THE ACT AND THE ASK');
    check('a follower\'s EXILE asks first: the first tap arms it and lets nobody go; the second, within PARTY.exileArm, exiles it: it leaves the roster for good (no body, out of the save), its squad slot is free, nothing is given back, and it says so', () => {
        const r = J(`(function(){ const fs = __fresh(3), f = partyOrdered()[0], o = {}, sh = shardCount; __clock = 1000;
            o.first = partyExileTap([f]); o.armed = partyExileArmed([f]); o.still = !f.dead && partyMembers().length; __clock += 1500; floatingTexts.length = 0;
            o.second = partyExileTap([f]); o.flags = [f.exiled === true, f.sacrificed === true, f.dead === true]; o.squad = partyMembers().length; o.said = floatingTexts.map(t => t.text).join('|'); o.shards = shardCount - sh;
            __sweep(); o.gone = !followers.includes(f); o.saved = (facilitySaveCollect().followers || []).length; o.armedAfter = partyExileArmed([f]); return o; })()`);
        same(r.first, 'armed', 'the first tap'); same(r.armed, true, 'not armed'); same(r.still, 3, 'the first tap let it go');
        same(r.second, 'exiled', 'the second tap'); same(r.flags.join(), 'true,true,true', 'exiled'); same(r.squad, 2, 'its squad slot'); ok(/ IS EXILED/.test(r.said), 'said ' + r.said); same(r.shards, 0, 'something was given back');
        same(r.gone, true, 'still among the followers'); same(r.saved, 2, 'still in the save'); same(r.armedAfter, false, 'still armed');
    });
    check('the arm lapses after PARTY.exileArm (the next tap arms it again); a button armed for one follower never exiles another; a list armed is exiled together', () => {
        const r = J(`(function(){ const fs = __fresh(3), a = partyOrdered()[0], b = partyOrdered()[1], c = partyOrdered()[2], o = {}; __clock = 5000;
            partyExileTap([a]); __clock += PARTY.exileArm + 1; o.lapsed = [partyExileArmed([a]), partyExileTap([a]), a.dead === true];
            o.other = [partyExileTap([b]), a.dead === true, b.dead === true];   // (a is armed from the tap above: a tap on b's button arms b, and lets a's lapse)
            partyExileTap([b, c]); o.two = [partyExileArmed([c, b]), partyExileArmed([b]), partyExileTap([c, b]), b.dead === true, c.dead === true, a.dead === true]; return o; })()`);
        same(r.lapsed.join(), 'false,armed,false', 'the arm did not lapse'); same(r.other.join(), 'armed,false,false', 'another follower\'s tap'); same(r.two.join(), 'true,false,exiled,true,true,false', 'two together');
    });
    check('a follower holding a room, exiled, frees its place in that room (room for someone new)', () => {
        const r = J(`(function(){ const fs = __fresh(4), f = partyPosted()[0], o = {}; __clock = 9000; o.room = f && f.post; o.before = partyRoomCount(o.room); partyExileTap([f]); partyExileTap([f]); o.after = partyRoomCount(o.room); return o; })()`);
        ok(r.room, 'nobody holds a room'); same(r.after, r.before - 1, 'its place in ' + r.room);
    });

    group('THE WORD');
    check('the word is EXILE everywhere: the full squad\'s question (EXILE ... ?, EXILED · NO ROOM HAS A PLACE), the arena over six (... IS EXILED), the function; nothing says RETIRE', () => {
        const P = rd('js/party.js'); ok(!/RETIRE/.test(P) && !/partyRetire/.test(P) && /function partyExile\(/.test(P), 'party.js still says RETIRE');
        ok(/EXILE ' \+ esc\(_ppName\(A\.pick\)\) \+ '\?/.test(P) && /EXILED · NO ROOM HAS A PLACE/.test(P) && /THE ARENA IS FULL · " \+ nm \+ " IS EXILED/.test(P), 'the forced cases do not say EXILE');
        for (const f of ['js/commandcenter.js', 'js/radialmenu.js', 'js/squadfly.js']) ok(!/RETIRE/.test(rd(f)), f + ' says RETIRE');
        ok(/TAP AGAIN TO EXILE/.test(rd('js/commandcenter.js')) && /TAP AGAIN TO EXILE/.test(rd('js/radialmenu.js')), 'a button does not ask');
        ok(!/data-act="exile"|partyExile/.test(rd('js/squadfly.js')), 'the squad\'s card on the fly has EXILE (it is the roster\'s)');
    });

    group('THE BUTTONS, IN THE REAL PAGE');
    const W = measure(1280, 860), N = measure(420, 860);
    check('the instrument ran (a wide screen and a phone)', () => { ok(W && !W.err, 'wide: ' + JSON.stringify(W)); ok(N && !N.err, 'phone: ' + JSON.stringify(N)); });
    if (W && !W.err) {
        check('on a wide screen: the Command Center\'s row for the one in view has EXILE; one tap asks, the second exiles it and the next one comes into view; a squad member\'s card on the fly (beside the HUD\'s stack) has no EXILE: INDEX and DISMISS FROM SQUAD', () => {
            same(W.wide, true, 'not the corners layout'); same(W.start, 5, 'followers to start');
            same(W.ccLabel0 && W.ccLabel0.replace(/\s+/g, ' ').trim(), 'EXILE', 'the row\'s button'); same(W.ccLabel1 && W.ccLabel1.replace(/\s+/g, ' ').trim(), 'TAP AGAIN TO EXILE', 'the row\'s button asks'); same(W.ccStill, true, 'the first tap exiled it');
            same(W.ccGone.join(), 'true,true,4,true', 'the row\'s exile');
            same(W.fly.on, true, 'no card on the fly'); same(W.fly.exile, false, 'EXILE on the card on the fly'); same(W.fly.said, false, 'the card on the fly says EXILE');
            same(W.fly.btns.length, 2, 'the card\'s buttons'); ok(/^INDEX/.test(W.fly.btns[0]) && /^DISMISS FROM SQUAD/.test(W.fly.btns[1]), 'the card\'s buttons: ' + W.fly.btns);
            same(W.saved, W.alive, 'the save keeps the exiled');
        });
    }
    if (N && !N.err) {
        check('on a phone: each card in the ROSTER has EXILE (one tap asks, the second exiles it), the SQUAD\'s cards have none; in the side panel, two selected: one button for both', () => {
            same(N.wide, false, 'not a phone'); same(N.phoneSquad.cards, N.squad, 'the SQUAD\'s cards'); same(N.phoneSquad.exile, 0, 'EXILE on the SQUAD\'s cards'); same(N.phoneRoster.cards, N.start, 'the ROSTER\'s cards'); same(N.phoneRoster.exile, N.start, 'a ROSTER card without EXILE');
            same(N.phoneLabel0, 'EXILE', 'the card\'s button'); same(N.phoneLabel1, 'TAP AGAIN TO EXILE', 'the card asks'); same(N.phoneStill, true, 'the first tap exiled it'); same(N.phoneGone.join(), 'true,true,4', 'the card\'s exile');
            same(N.sideLabel0, 'EXILE 2', 'the side panel\'s button'); same(N.sideLabel1, 'TAP AGAIN TO EXILE 2', 'it asks'); same(N.sideGone.join(), 'true,2', 'both exiled'); same(N.saved, N.alive, 'the save keeps the exiled');
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
