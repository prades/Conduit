// THE INFO TAB ON EVERY CARD (js/unitinfo.js).
//
// REPORTED: "I would like an info tab for each of the followers and their different attacks and jobs", "on each card". Every roster card and every Clone
// Bay card has an INFO button: ATTACKS / JOBS / STATS, read off the game's own constants. The data builders run against the real scripts; the overlay and
// the buttons are driven in the real browser (no browser: it says so and passes).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
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

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); followers.length = 0;
         globalThis.__mk = (el, role, lv, evo, duty) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.role = role; f.level = lv; f.evolved = evo || null; f.duty = duty || null; return f; };`);
    const sec = (info, tab, h) => info[tab].find(s => s.h.indexOf(h) === 0);
    const rowOf = (s, k) => (s.rows.find(r => r[0] === k) || [])[1];

    console.log('\nTHE DATA');
    check('an evolved follower: its attack style, its signature move read off the constants, and its element ultimate', () => {
        const i = JSON.parse(run(`JSON.stringify(followerInfo(__mk('electric', 'sniper', 14, 'thunderhead')))`));
        ok(/ATTACK STYLE · MAGE/.test(i.attacks[0].h), 'style ' + i.attacks[0].h); const m = sec(i, 'attacks', 'SIGNATURE');
        same(m.h, 'SIGNATURE · ARC VOLLEY', 'move'); same(rowOf(m, 'REACH'), run('REAVER_RANGE') + ' tiles', 'reach'); same(rowOf(m, 'DAMAGE'), run('REAVER_MULT') + '× power', 'damage'); same(rowOf(m, 'EVERY'), run('REAVER_EVERY / 60') + ' s', 'every');
        ok(sec(i, 'attacks', 'ULTIMATE · OVERLOAD'), 'no ultimate');
    });
    check('an unevolved follower says what it evolves into, at what level, and what that form does', () => {
        const i = JSON.parse(run(`JSON.stringify(followerInfo(__mk('fire', 'brawler', 3)))`)), m = sec(i, 'attacks', 'SIGNATURE');
        ok(/Evolves at level 10 into the QUILLSTONE/.test(m.note), m.note); ok(m.rows.length >= 3, 'no move rows');
    });
    check('jobs: an electric follower can neutralise / hack, a fire one has no job', () => {
        const e = JSON.parse(run(`JSON.stringify(followerInfo(__mk('electric', 'brawler', 3)))`)), f = JSON.parse(run(`JSON.stringify(followerInfo(__mk('fire', 'brawler', 3)))`));
        ok(sec(e, 'jobs', 'WORK · NEUTRALISE / HACK'), 'no electric job'); ok(/hacks wall panels/.test(sec(e, 'jobs', 'WORK').note), 'no mention of the panels');
        same(sec(f, 'jobs', 'WORK').h, 'WORK', 'fire has a job'); ok(/fights only/.test(sec(f, 'jobs', 'WORK').note), 'fire note');
    });
    check('a worker form shows its job bonus (the Worm Vessel re-arms 3x as fast)', () => {
        const i = JSON.parse(run(`JSON.stringify(followerInfo(__mk('core', 'brawler', 12, 'vessel', 'worker')))`)), b = sec(i, 'jobs', 'JOB BONUS');
        ok(b && /REWIRE/.test(b.h), 'no bonus'); same(rowOf(b, 'RE-ARMS'), run('VESSEL_RATE') + '× as fast', 'rate'); same(sec(i, 'jobs', 'RIGHT NOW').rows[0][1], 'WORKING', 'duty');
    });
    check('EVERY form in the game has its move described (a new evolution cannot ship without an info entry)', () => {
        const miss = JSON.parse(run(`JSON.stringify(Object.values(EVOLUTIONS).filter(e => !(typeof MOVE_INFO[e.move] === 'function' || typeof WORKER_MOVE_INFO[e.move] === 'function')).map(e => e.id + ':' + e.move))`));
        same(miss.length, 0, 'forms without an info entry: ' + miss.join(', '));
    });
    check('every element that can work has its job described, and the list matches the game (mass.js)', () => {
        const w = JSON.parse(run(`JSON.stringify(workerElements().filter(e => !WORK_INFO[e]))`)); same(w.length, 0, 'workers with no info: ' + w);
        same(run('Object.keys(WORK_INFO).sort().join()'), run('workerElements().slice().sort().join()'), 'the info lists a job the game does not have');
        same(run('ELEMENTS.every(e => ELEMENT_ULTIMATES.some(u => u.el === e.id))'), true, 'an element without an ultimate');
    });
    check('stats: vitals, base stats with the personality, traits with their descriptions', () => {
        const i = JSON.parse(run(`JSON.stringify(followerInfo(__mk('ice', 'brawler', 5)))`)); ok(sec(i, 'stats', 'VITALS') && sec(i, 'stats', 'BASE STATS') && sec(i, 'stats', 'TRAITS'), 'sections ' + i.stats.map(s => s.h));
    });
    check('a clone type: a scorpion striker has the stinger (its damage and rate), an ant scout has no special', () => {
        const s = JSON.parse(run(`JSON.stringify(cloneTypeInfo('scorpion', 'striker'))`)), a = JSON.parse(run(`JSON.stringify(cloneTypeInfo('ant', 'scout'))`));
        const sp = sec(s, 'attacks', 'SPECIAL'); same(sp.h, 'SPECIAL · STINGER', 'special'); same(rowOf(sp, 'DAMAGE'), String(run("SPECIES.scorpion.striker.rangeDamage")), 'damage'); same(sec(a, 'attacks', 'SPECIAL').h, 'SPECIAL', 'ant special');
    });
    check('a clone type: its job is the game\'s (ant BUILD, beetle HAUL, spider WEB); the rest say no job yet', () => {
        for (const [sp, lab] of [['ant', 'BUILD'], ['beetle', 'HAUL'], ['spider', 'WEB']]) same(sec(JSON.parse(run(`JSON.stringify(cloneTypeInfo('${sp}', 'tank'))`)), 'jobs', 'WORK').h, 'WORK · ' + lab, sp);
        ok(/No job yet/.test(sec(JSON.parse(run(`JSON.stringify(cloneTypeInfo('moth', 'tank'))`)), 'jobs', 'WORK').note), 'moth');
    });

    console.log('\nTHE CARDS (real browser)');
    check('the buttons are wired on the roster card, the phone roster card and the Clone Bay card (source)', () => {
        ok(/cc-info[\s\S]{0,200}unitInfoOpen\(r\.unit\)/.test(rd('js/commandcenter.js')), 'Command Center'); ok(/"INFO"[\s\S]{0,260}unitInfoOpen\(r\.f\)/.test(rd('js/radialmenu.js')), 'phone roster');
        ok(/"INFO", UI_ICE[\s\S]{0,300}_ix = ix/.test(rd('js/clone.js')) && /unitInfoOpenType\(opt\.speciesName, opt\.className\)/.test(rd('js/clone.js')), 'Clone Bay');
    });
    const bin = findChromium();
    if (!bin) console.log('  (no Chromium here: skipped)');
    else {
        const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
          var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
          tutorialMode = false; gameState.running = true; shardCount = 900; unlockedElements = new Set(ELEMENTS.map(function(e){ return e.id; })); followers.length = 0;
          ['electric', 'fire', 'core'].forEach(function(el){ spawnFollowerAtCrystal(el); followers[followers.length - 1].returningToCrystal = false; });
          ccOpen('roster'); await wait(400);
          var btns = document.querySelectorAll('#ccGrid .cc-card .cc-info'); out.cards = document.querySelectorAll('#ccGrid .cc-card').length; out.infos = btns.length;
          var sel0 = selectedUnits.size; btns[0].click(); await wait(100);
          out.open = !!document.getElementById('unitInfo'); out.selectedByInfo = selectedUnits.size !== sel0;
          out.tabs = Array.prototype.map.call(document.querySelectorAll('#unitInfo .ui-tab'), function(t){ return t.textContent; });
          out.title = document.querySelector('#unitInfo .ui-title').textContent; out.secs = document.querySelectorAll('#unitInfo .ui-sec').length;
          document.querySelector('#unitInfo .ui-tab[data-tab="jobs"]').click(); out.jobsH = document.querySelector('#unitInfo .ui-h').textContent;
          document.querySelector('#unitInfo .ui-tab[data-tab="stats"]').click(); out.statsH = document.querySelector('#unitInfo .ui-h').textContent;
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); out.closedByEsc = !document.getElementById('unitInfo');
          btns[1].click(); await wait(50); document.getElementById('unitInfo').click(); out.closedByOutside = !document.getElementById('unitInfo');
          btns[1].click(); await wait(50); document.querySelector('#unitInfo .ui-close').click(); out.closedByX = !document.getElementById('unitInfo'); out.reopenTab = (btns[2].click(), document.querySelector('#unitInfo .ui-tab.on').textContent); unitInfoClose();
          ccClose();
          // the Clone Bay card
          var inv = {}; ['ant','beetle','mantis','scorpion','spider','moth'].forEach(function(s){ ['scout','striker','tank'].forEach(function(c){ inv[s + '_' + c] = 99; }); }); setDNA(inv);
          cloneMenuOpen = true; crystalCloneSort = 'species'; _crystalScrollX = 0; render(); render();
          var o = window._cloneTabOpts.find(function(o){ return typeof o._ix === 'number'; }); out.cloneInfoBtn = !!o;
          handleCloneMenuTap(o._ix + 4, o._iy + 4); out.cloneOpen = !!document.getElementById('unitInfo'); out.cloneTitle = document.querySelector('#unitInfo .ui-title').textContent; out.cloneSpawned = actors.filter(function(a){ return a.isClone; }).length;
          var pre = document.createElement('pre'); pre.id = '__ui'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
        }, 1500); });</script></body>`;
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-')), file = path.join(dir, 'game.html');
        fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
        let dom = '';
        try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,760', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
        const m = dom.match(/<pre id="__ui">([\s\S]*?)<\/pre>/), r = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('THE ASK: every roster card has an INFO button, and it opens the info without selecting the card', () => { ok(r.cards >= 3, 'cards ' + r.cards); same(r.infos, r.cards, 'a card has no INFO'); same(r.open, true, 'did not open'); same(r.selectedByInfo, false, 'it selected the card'); });
            check('it has ATTACKS, JOBS and STATS tabs, the unit\'s name, and switches between them', () => { same(r.tabs.join(), 'ATTACKS,JOBS,STATS', 'tabs'); ok(r.title.length > 3, 'title'); ok(r.secs >= 3, 'sections ' + r.secs); ok(/WORK/.test(r.jobsH) || /RIGHT NOW/.test(r.jobsH), 'jobs tab ' + r.jobsH); ok(/VITALS/.test(r.statsH), 'stats tab ' + r.statsH); });
            check('Escape, a tap outside and the X close it; it always opens on ATTACKS', () => { same(r.closedByEsc, true, 'esc'); same(r.closedByOutside, true, 'outside'); same(r.closedByX, true, 'x'); same(r.reopenTab, 'ATTACKS', 'tab'); });
            check('a Clone Bay card has an INFO button that opens that clone type\'s info and does not spawn it', () => { same(r.cloneInfoBtn, true, 'button'); same(r.cloneOpen, true, 'open'); ok(/CLONE|ANT|BEETLE|SPIDER|SCORPION|MANTIS|MOTH/.test(r.cloneTitle), r.cloneTitle); same(r.cloneSpawned, 0, 'it spawned a clone'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
