// THE NETWORK PANEL AND THE SIGNAL RULE (js/nethud.js).
//
// REPORTED: "the network and battery supply up top needs a redesign, and make it change network status if the player is in a zone where the signal is
// weak. It should be a rule that the network strength weakens the further away from the batteries."
// The rule: full within BANK_FULL_RANGE of the nearest battery in a bank, one tier lower for every BANK_FALLOFF_STEP tiles beyond. The player's
// status is that rule at where they stand: STRONG / WEAK / NO SIGNAL (OFFLINE with no bank), and a change is said on the screen.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    run('zoneGenerated = () => true;');
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');

    // Six electric batteries in a row (a tier III bank), or none.
    const bank = (n) => run(`(function(){
        actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.isBattery = false; t.attackModeElement = null; } });
        shardCount = 9999; const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        const el = ELEMENTS.find(e => e.id === 'electric'), xs = [];
        for (let i = 0; i < ${n}; i++) { const t = T(home.x + 14 + i * 2, 3); _executeBuildInstant(el, t, 'battery'); xs.push(t.x); }
        _cacheAge = -999; for (let f = 0; f < 3; f++) render();
        return { tier: networkStrength.electric, last: xs.length ? Math.max(...xs) : 0, y: 3 };
    })()`);
    // The signal at a spot `d` tiles beyond the bank's last battery, in a line away from it.
    const at = (b, d) => run(`(function(){ const s = networkSignalAt(${b.last + d}, ${b.y}); return { state: s.state, local: s.local, bank: s.bank, dist: Math.round(s.dist) }; })()`);

    group('THE RULE: the network weakens with distance from the batteries');
    const b = bank(6);
    await check('fixture: six linked batteries are a tier III bank', () => same(b.tier, 3, 'bank tier'));
    await check('at the batteries, and within BANK_FULL_RANGE of them, it is STRONG at the full tier', () => {
        for (const d of [0, 3, run('BANK_FULL_RANGE')]) { const s = at(b, d); same(s.state, 'strong', 'state at ' + d); same(s.local, 3, 'tier at ' + d); }
    });
    await check('beyond it the tier falls one for every BANK_FALLOFF_STEP tiles, and the status is WEAK', () => {
        const F = run('BANK_FULL_RANGE'), S = run('BANK_FALLOFF_STEP');
        const s1 = at(b, F + 1), s2 = at(b, F + S + 1);
        same(s1.local, 2, 'one step out'); same(s1.state, 'weak', 'state one step out');
        same(s2.local, 1, 'two steps out'); same(s2.state, 'weak', 'state two steps out');
    });
    await check('past every step there is NO SIGNAL', () => { const s = at(b, run('BANK_FULL_RANGE + 2 * BANK_FALLOFF_STEP + 2')); same(s.local, 0, 'tier'); same(s.state, 'none', 'state'); });
    await check('it only ever weakens with distance (never a stronger signal further out)', () => {
        let prev = 99; for (let d = 0; d <= 30; d++) { const t = at(b, d).local; ok(t <= prev, 'the tier rose from ' + prev + ' to ' + t + ' at ' + d); prev = t; }
    });
    await check('with no bank at all the status is OFFLINE', () => { const e = bank(0); same(e.tier, 0, 'tier'); same(at(e, 0).state, 'offline', 'state'); });

    group('THE PLAYER SEES IT');
    const hud = (px) => run(`(function(){
        player.x = player.targetX = player.visualX = ${px}; player.y = player.targetY = player.visualY = ${b.y};
        _hudPw = null; const said = []; const keep = ctx.fillText; ctx.fillText = t => said.push(String(t));
        try { drawNetworkStatusHUD(); } finally { ctx.fillText = keep; }
        return said; })()`);
    await check('the panel says STRONG at the batteries, WEAK out in the zone, NO SIGNAL beyond', () => {
        bank(6);
        ok(hud(b.last).some(t => t === 'STRONG'), 'no STRONG at the batteries');
        ok(hud(b.last + 8).some(t => t === 'WEAK'), 'no WEAK eight tiles out');
        ok(hud(b.last + 30).some(t => t === 'NO SIGNAL'), 'no NO SIGNAL thirty tiles out');
    });
    await check('it still has the BATT and NESTS lines and an element row', () => {
        const said = hud(b.last);
        ok(said.some(t => /BATT /.test(t)) || run('powerStatus().batteries.count') === 0, 'no BATT line');
        ok(said.some(t => /^NESTS /.test(t)), 'no NESTS line'); ok(said.some(t => t === 'ELECTRIC'), 'no row for the electric network');
    });
    await check('a change is said once on the screen, not every frame', () => {
        const n = run(`(function(){ floatingTexts.length = 0; _sigSeen = 'strong'; _sigShown = 'strong'; _sigAt = -1e9; frame = 5000;
            const weak = { state: 'weak', local: 1, bank: 3 };
            networkSignalAnnounce(weak); networkSignalAnnounce(weak); networkSignalAnnounce(weak); networkSignalAnnounce(weak);
            return floatingTexts.map(f => f.text); })()`);
        same(n.length, 1, 'announcements: ' + JSON.stringify(n)); ok(/SIGNAL WEAK/.test(n[0]), 'wrong text: ' + n[0]);
        const back = run(`(function(){ floatingTexts.length = 0; frame = 5400; const s = { state: 'strong', local: 3, bank: 3 };
            networkSignalAnnounce(s); networkSignalAnnounce(s); return floatingTexts.map(f => f.text); })()`);
        ok(back.length === 1 && /RESTORED/.test(back[0]), 'no SIGNAL RESTORED: ' + JSON.stringify(back));
    });
    await check('walking along an edge does not flicker (one reading is not enough)', () => {
        const n = run(`(function(){ floatingTexts.length = 0; _sigSeen = 'strong'; _sigShown = 'strong'; _sigAt = -1e9; frame = 9000;
            networkSignalAnnounce({ state: 'weak', local: 2, bank: 3 }); networkSignalAnnounce({ state: 'strong', local: 3, bank: 3 }); networkSignalAnnounce({ state: 'weak', local: 2, bank: 3 });
            return floatingTexts.length; })()`);
        same(n, 0, 'announced on single readings');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
