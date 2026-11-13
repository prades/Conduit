// THE MUTATOR'S CLONE IN THE SQUAD (js/party.js partyClone / partyUnits / _partyCloneCard, js/squadfly.js, js/mixtool.js mixToolWho, js/commands.js cycleCommandPoolRoles, js/facilityportals.js _pCarries,
// js/levels.js awardKillXp, js/facilitysave.js, js/radialmenu.js).
// ASKED (2026-11-01): "The active clone needs to become a full member of the player's squad. Add the clone to the squad roster on the main game page. Display the clone alongside other squad members in the quick-draw
// tabs. Allow the player to select the clone individually. Allow the clone to participate in squad-wide commands. Include the clone in attack selections and other applicable group actions. Ensure clone selection,
// targeting, and squad state remain synchronized. Preserve existing clone behavior and abilities."
// Two bugs found on the way, each with its test: SWITCH ROLES gave the clone a role (and a "sniper" clone left its own fight for the followers' plain swing), and a clone that had had no order was left behind at every doorway.
// The logic runs in the sandbox; the bar, a tap on the clone's card, its card on the fly and a phone's row in the real browser (no Chromium: it says so and passes).
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page: three followers and the Mutator's clone; the bar's cards, a tap on the clone's card, its card on the fly, ALL, and (a phone) the row on the screen.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #squadFly, #squadFly * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); if (el.closest && el.closest('#squadBar') && document.querySelector('#squadBar .sb-slot.peek')) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };   // (a card on the strip: the first tap lights it, the second opens it since build 2026-11-13j; this taps through to the open card, as the checks below were written for: tests/party.js has the two taps' own check)
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; if (typeof classPickerOpen !== 'undefined') classPickerOpen = false;
    actors = actors.filter(function(a){ return !a.isFollower && !a.isClone; }); followers.length = 0; for (var k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all';
    shardCount = 2000; recruitFollower('brawler', 'fire'); recruitFollower('sniper', 'ice'); recruitFollower('camper', 'electric'); followers.forEach(function(f){ f.returningToCrystal = false; });
    partyTick(); await wait(30);
    out.before = { slots: $$('#squadBar .sb-slot').length, clone: !!$('#squadBar .sb-clone') };
    var c = makeClone('ant', 'striker', player.x + 1.5, player.y, 'wander'); mutatorCloneMade(c, { needed: 4 }); c.health = Math.round(c.maxHealth * 0.7);
    partyTick(); await wait(40);
    var card = $('#squadBar .sb-clone'), wide = innerWidth > 700, vw = innerWidth;
    var rects = $$('#squadBar .sb-slot').map(function(e){ var r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; });
    out.with = { slots: $$('#squadBar .sb-slot').length, last: card ? $$('#squadBar .sb-slot').indexOf(card) : -1, name: card ? card.querySelector('.sb-name').textContent : null, sub: card ? card.querySelector('.sb-sub').textContent : null,
                 hpn: card ? card.querySelector('.sb-hpn').textContent : null, col: card ? card.style.getPropertyValue('--c').trim() : null, tag: card ? getComputedStyle(card.querySelector('.sb-ctag')).display : null,
                 rects: rects, vw: vw, who: mixToolWho(), thumb: card ? (function(){ var cv = card.querySelector('.sb-thumb'), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data, n = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; })() : 0 };
    // a tap on the clone's card picks it alone: the orders go to it, its card opens beside the stack (a tablet), and ALL lets it go
    click(card); await wait(60); if (typeof mixToolRender === 'function') mixToolRender(true); await wait(30);
    out.tap = { sel: Array.from(selectedUnits).map(function(u){ return unitTypeLabel(u); }), cls: card.classList.contains('sel'), pool: getCommandPool().map(function(u){ return unitTypeLabel(u); }), who: mixToolWho(),
                fly: !!$('#squadFly.on'), flyName: $('#squadFly .sf-name') ? $('#squadFly .sf-name').textContent : null, flySub: $('#squadFly .sf-sub') ? $('#squadFly .sf-sub').textContent : null,
                tags: $$('#squadFly .sf-tags span').map(function(e){ return e.textContent; }).join(','), dismiss: $('#squadFly .sf-dismiss') ? getComputedStyle($('#squadFly .sf-dismiss')).display : null };
    click(card); await wait(30); out.untap = { sel: selectedUnits.size, fly: !!$('#squadFly.on') };
    // it falls: its card goes, the bar is three again
    c.dead = true; partyTick(); await wait(30); out.gone = { slots: $$('#squadBar .sb-slot').length, clone: !!$('#squadBar .sb-clone') };
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__cs'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = e.stdout || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cs">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    run(`globalThis.__fresh = (n) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all';
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.x = player.x + 0.5 + i * 0.4; f.y = player.y + 0.6; }
            partySync(false); };
        globalThis.__clone = () => { const c = makeClone('ant', 'striker', player.x + 1.2, player.y + 0.3, 'wander'); mutatorCloneMade(c, { needed: 2 }); return c; };
        globalThis.__foe = (x, y) => { const a = spawnCreature({ species: 'ant', className: 'scout' }); a.x = x; a.y = y; a.team = 'red'; a.dead = false; a.level = 3; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.health = a.maxHealth = 1e7; return a; };`);

    group('THE CLONE STANDS WITH THE SQUAD');
    check('with no clone the squad\'s units are its members; the Mutator\'s clone joins them as a unit of its own, after the three, and takes none of their places (the squad is still full at three, a fourth recruit still holds a room)', () => {
        const r = J(`(function(){ __fresh(3); const o = { none: partyClone() === null, units0: partyUnits().length }; const c = __clone(); o.is = partyClone() === c; o.units = partyUnits().map(u => u === c ? 'CLONE' : 'F').join();
            o.member = partyIsMember(c); o.has = partySquadHas(c); o.full = partyFull(); shardCount = 1000; recruitFollower(); partySync(false); o.fourth = followers[followers.length - 1].post || null; o.members = partyMembers().length; o.who = mixToolWho(); return o; })()`);
        same(r.none, true, 'a clone with none'); same(r.units0, 3, 'units with no clone'); same(r.is, true, 'partyClone is not the Mutator\'s clone'); same(r.units, 'F,F,F,CLONE', 'the units in card order');
        same(r.member, false, 'the clone counts as a follower member'); same(r.has, true, 'the squad does not have the clone'); same(r.full, true, 'the squad of three'); ok(r.fourth, 'a fourth recruit joined the squad'); same(r.members, 3, 'members');
        same(r.who, '4 FOLLOWING', 'the battle tool\'s count');
    });
    check('the clone picked alone (a tap on its card selects it): the orders go to it and to nobody else, RETREAT pulls it back, the enemy card\'s ATTACK sends it', () => {
        const r = J(`(function(){ __fresh(3); const c = __clone(); const foe = __foe(player.x + 3, player.y); selectedUnits.clear(); ccToggle(c); const o = { pool: getCommandPool().map(u => u === c ? 'CLONE' : 'F').join(), who: mixToolWho() };
            mixToolRetreat(); o.retreat = c.retreatUntil > frame; o.othersRetreat = followers.some(f => f.retreatUntil > frame);
            mixToolAttack(foe); o.attack = !!(c.attackOrder && c.attackOrder.target === foe); o.othersAttack = followers.some(f => f.attackOrder); return o; })()`);
        same(r.pool, 'CLONE', 'the pool'); same(r.who, 'ANT CLONE', 'the tool names it'); same(r.retreat, true, 'RETREAT did not reach it'); same(r.othersRetreat, false, 'RETREAT reached the others');
        same(r.attack, true, 'ATTACK did not send it'); same(r.othersAttack, false, 'ATTACK sent the others');
    });
    check('ALL (nobody picked): HOLD, COME and the enemy card\'s ATTACK reach the clone with the squad', () => {
        const r = J(`(function(){ const hc = partyRoomCells('lab_hallway'), H = hc[Math.floor(hc.length / 2)]; player.x = player.targetX = player.visualX = H[0]; player.y = player.targetY = player.visualY = H[1];   // (the hallway holds three: the Crystal Chamber two)
            __fresh(3); const c = __clone(); const foe = __foe(player.x + 3, player.y); selectedUnits.clear(); mixToolScope('all'); const o = { pool: getCommandPool().map(u => u === c ? 'CLONE' : 'F').join() };
            mixToolOrder('hold'); o.hold = c.stance; o.posted = partyPosted().length; mixToolOrder('follow'); o.come = c.stance; o.back = partyMembers().length;
            mixToolAttack(foe); o.attack = !!(c.attackOrder && c.attackOrder.target === foe); o.squadAttack = partyMembers().every(f => f.attackOrder && f.attackOrder.target === foe); return o; })()`);
        same(r.pool, 'F,F,F,CLONE', 'the pool'); same(r.hold, 'hold', 'HOLD'); same(r.posted, 3, 'the followers hold their room'); same(r.come, 'follow', 'COME'); same(r.back, 3, 'the squad came back');
        same(r.attack, true, 'ATTACK did not send the clone'); same(r.squadAttack, true, 'ATTACK did not send the squad');
    });
    group('TWO BUGS, FOUND ON THE WAY');
    check('SWITCH ROLES leaves the clone alone: it has no role and fights as its species (a "sniper" clone left its own fight for the followers\' plain swing, docs/MUTATOR.md 1)', () => {
        const r = J(`(function(){ __fresh(1); const c = __clone(); const f = followers[0]; selectedUnits.clear(); ccToggle(c); ccToggle(f); const was = f.role; cycleCommandPoolRoles(); cycleCommandPoolRoles(); return { clone: c.role === undefined ? 'none' : c.role, changed: f.role !== was || f.evolved }; })()`);
        same(r.clone, 'none', 'the clone was given a role'); same(r.changed, true, 'the follower\'s role did not change');
    });
    check('a clone that has had no order comes through a doorway with the squad (it has no stance: it is following; it used to be left behind at every doorway)', () => {
        const r = J(`(function(){ __fresh(0); const c = __clone(); delete c.stance; const o = { noStance: _pCarries(c) }; c.stance = 'hold'; o.hold = _pCarries(c); c.stance = 'follow'; o.follow = _pCarries(c); return o; })()`);
        same(r.noStance, true, 'a clone with no stance is not carried'); same(r.hold, false, 'a holding clone is carried'); same(r.follow, true, 'a following clone is not carried');
    });
    group('ITS SHARE, ITS PLACE');
    check('the squad\'s kill XP reaches the clone wherever it is (a kill by the player, the clone far off), as it reaches a member', () => {
        const r = J(`(function(){ __fresh(1); const c = __clone(); const f = followers[0]; const foe = __foe(player.x + 2, player.y); c.x = player.x + XP_SHARE_RANGE + 8; f.x = player.x + XP_SHARE_RANGE + 8;
            const cx = c.xp, fx = f.xp; foe.lastAttacker = player; foe.dead = true; awardKillXp(foe); return { clone: c.xp > cx, member: f.xp > fx }; })()`);
        same(r.member, true, 'the member got nothing (the fixture)'); same(r.clone, true, 'the clone got nothing');
    });
    check('a loaded game puts the clone beside the player with the squad, not at the Crystal', () => {
        const r = J(`(function(){ __fresh(1); __clone(); const d = JSON.parse(JSON.stringify(facilitySaveCollect())); actors = actors.filter(a => !a.isClone); mutatorReset();
            const at = d.at; facilitySaveApply(d); const c = mutatorClone(); return { back: !!c, d: c ? Math.hypot(c.x - player.x, c.y - player.y) : -1, crystal: c ? Math.hypot(c.x - crystal.x, c.y - crystal.y) : -1 }; })()`);
        same(r.back, true, 'the clone did not come back'); ok(r.d >= 0 && r.d < 1.5, 'the clone is ' + r.d.toFixed(2) + ' tiles from the player');
    });
    check('the phone\'s SQUAD petal lists the clone after the squad\'s three (the Mutator\'s colour, its picture the creature)', () => {
        const src = rd('js/radialmenu.js');
        ok(/_radialCard\(_radialCloneRow\(c\)\)/.test(src), 'the SQUAD petal has no card for the clone'); ok(/partyCloneThumb\(cv, r\.f\)/.test(src), 'its picture'); ok(/r\.clone && typeof PARTY_CLONE_COL/.test(src), 'its colour');
        const r = J(`(function(){ __fresh(2); const c = __clone(); const row = _radialCloneRow(c); return { name: row.name, clone: row.clone, hp: row.hp > 0 }; })()`);
        same(r.name, 'ANT CLONE', 'the row\'s name'); same(r.clone, true, 'the row is not marked a clone'); same(r.hp, true, 'its health');
    });

    for (const [w, h] of [[1180, 820], [390, 844], [600, 900]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        group(w + 'x' + h + ' (the real page)');
        check(w + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const wide = w > 700;
        check(w + ': the bar has the squad\'s three cards and, while the Mutator\'s clone lives, its card after them (its name, LV and how it is, its health with the numbers, its picture drawn, the Mutator\'s purple' + (wide ? ', a CLONE tag' : '') + '); every card on the screen, none over another', () => {
            same(r.before.slots, 3, 'cards with no clone'); same(r.before.clone, false, 'a clone card with no clone');
            same(r.with.slots, 4, 'cards with the clone'); same(r.with.last, 3, 'the clone\'s card is not after the three'); same(r.with.name, 'ANT CLONE', 'its name'); ok(/^LV \d+ · FOLLOWING$/.test(r.with.sub), 'its line: ' + r.with.sub);
            ok(/^\d+\/\d+$/.test(r.with.hpn), 'its health numbers: ' + r.with.hpn); same(r.with.col, '#c06bff', 'its colour'); same(r.with.tag, wide ? 'block' : 'none', 'the CLONE tag'); ok(r.with.thumb > 30, 'its picture is empty (' + r.with.thumb + ' px)');
            same(r.with.who, '4 FOLLOWING', 'the battle tool');
            for (const q of r.with.rects) ok(q[0] >= 0 && q[2] <= r.with.vw + 1, 'a card off the screen: ' + q + ' of ' + r.with.vw);
            for (let i = 0; i < r.with.rects.length; i++) for (let j = i + 1; j < r.with.rects.length; j++) { const a = r.with.rects[i], b = r.with.rects[j]; ok(!(a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1), 'cards ' + i + ' and ' + j + ' overlap'); }
        });
        check(w + ': a tap on the clone\'s card picks it alone (the card lit, the orders to it' + (wide ? ', its card on the fly: the creature, THE MUTATOR\'S CLONE, FOLLOWING · CLONE · SQUAD, no DISMISS' : '') + '); a second tap lets it go; when it falls its card goes', () => {
            same(r.tap.sel.join(), 'ANT CLONE', 'the selection'); same(r.tap.cls, true, 'the card is not lit'); same(r.tap.pool.join(), 'ANT CLONE', 'the orders'); same(r.tap.who, 'ANT CLONE', 'the tool');
            if (wide) { same(r.tap.fly, true, 'no card on the fly'); same(r.tap.flyName, 'ANT CLONE', 'its name'); ok(/ANT STRIKER · LV \d+ · THE MUTATOR'S CLONE/.test(r.tap.flySub), 'its line: ' + r.tap.flySub); same(r.tap.tags, 'FOLLOWING,CLONE,SQUAD', 'its tags'); same(r.tap.dismiss, 'none', 'DISMISS on a clone'); }
            same(r.untap.sel, 0, 'a second tap did not let it go'); same(r.gone.slots, 3, 'the bar after it fell'); same(r.gone.clone, false, 'its card stayed');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
