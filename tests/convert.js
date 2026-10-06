// CONVERT, AND BUILD BY KIND FIRST.
//
// THE ASK: "change the switch option for the pylons to convert. And then have
// either wave or attack turret option for whatever the user would be able to
// switch into. And ... when the user is building pylons, the first option they
// have to choose is whether they want an attack pylon, a wave pylon, or
// connector or generator. And then they get to choose the element if it applies."
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

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    // Each scene in its own scope, so its consts do not collide with the next.
    const scene = body => { const i = body.lastIndexOf('\n'); const last = body.slice(i + 1).trim(); return run(`(function(){ ${body.slice(0, i + 1)} return ${last}; })()`); };
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');

    // A clean row: row[0] an empty floor tile, row[1] a fire turret of yours,
    // row[2] a plain dormant pylon. Helpers tap the picker by label.
    run(`globalThis.__fresh = function(){
        closeElementPicker(); pylonConfirmOpen = false; pylonConfirmKind = null;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.waveTripped = false; t.chosenKind = null; t.chosenElement = null; });
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
        const base = { pillar: true, destroyed: false, pillarTeam: 'green', health: 500, maxHealth: 500 };
        Object.assign(row[1], base, { attackMode: true, attackModeElement: 'fire', attackModeColor: '#f50' });
        Object.assign(row[2], base);
        shardCount = 999; floatingTexts.length = 0;
        globalThis.__row = row; return row;
    };
    globalThis.__labels = () => _epLayout().cells.map(c => c.it.kind === 'type' ? c.it.k.label : c.it.el.label.toUpperCase());
    globalThis.__tap = (label) => {
        const c = _epLayout().cells.find(c => (c.it.kind === 'type' ? c.it.k.label : c.it.el.label.toUpperCase()) === label);
        if (!c) throw new Error('no cell ' + label + ' in ' + __labels().join(','));
        return _handleElementPickerTap(c.x + c.w / 2, c.y + c.h / 2);
    };`);

    group('BUILD: KIND FIRST, THEN ELEMENT');

    await check('THE ASK: the first choice is attack, wave, connector or generator', () => {
        const r = run(`__fresh(); openElementPicker('build', __row[0]); __labels()`);
        ok(JSON.stringify(r) === JSON.stringify(['ATTACK TURRET', 'WAVE PYLON', 'CONNECTOR', 'GENERATOR']), JSON.stringify(r));
    });
    await check('attack or wave then asks for the element', () => {
        const r = run(`__fresh(); openElementPicker('build', __row[0]); __tap('WAVE PYLON');
            ({ stage: elementPickerStage, kind: elementPickerKind, labels: __labels(), open: elementPickerOpen })`);
        ok(r.open && r.stage === 'element' && r.kind === 'wave', JSON.stringify(r));
        ok(r.labels.includes('FIRE') && !r.labels.includes('GENERATOR'), 'the element step should list only elements: ' + r.labels);
    });
    await check('a wave build makes a wave pylon, not a turret', () => {
        const r = run(`__fresh(); unlockedElements.add('fire'); openElementPicker('build', __row[0]); __tap('WAVE PYLON'); __tap('FIRE');
            const ok1 = pylonConfirmOpen && pylonConfirmKind === 'wave';
            _executeBuildInstant(pylonConfirmEl, pylonConfirmTarget, pylonConfirmKind);
            ({ ok1, wave: __row[0].waveMode, attack: __row[0].attackMode, el: __row[0].attackModeElement })`);
        ok(r.ok1, 'the confirm dialog did not carry the kind');
        ok(r.wave && !r.attack && r.el === 'fire', JSON.stringify(r));
    });
    await check('an attack build makes a turret', () => {
        const r = run(`__fresh(); unlockedElements.add('fire'); openElementPicker('build', __row[0]); __tap('ATTACK TURRET'); __tap('FIRE');
            _executeBuildInstant(pylonConfirmEl, pylonConfirmTarget, pylonConfirmKind);
            ({ wave: __row[0].waveMode, attack: __row[0].attackMode })`);
        ok(r.attack && !r.wave, JSON.stringify(r));
    });
    await check('connector and generator skip the element step', () => {
        const r = scene(`__fresh();
            const near = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && canPlaceGenerator(t).ok);
            openElementPicker('build', near); __tap('GENERATOR');
            ({ picker: elementPickerOpen, confirm: pylonConfirmOpen, el: pylonConfirmEl && pylonConfirmEl.id, gen: GENERATOR_ID })`);
        ok(!r.picker && r.confirm && r.el === r.gen, JSON.stringify(r));
    });
    await check('BACK returns to the kind step', () => {
        const r = run(`__fresh(); openElementPicker('build', __row[0]); __tap('ATTACK TURRET');
            const L = _epLayout(); _handleElementPickerTap(L.back.x + 4, L.back.y + 4);
            ({ stage: elementPickerStage, open: elementPickerOpen })`);
        ok(r.open && r.stage === 'type', JSON.stringify(r));
    });

    group('UPGRADE: the same two steps');

    await check('upgrading a dormant pylon as a wave pylon makes one once the follower merges', () => {
        const r = scene(`__fresh(); const p = __row[2]; unlockedElements.add('fire');
            openElementPicker('upgrade', p); __tap('WAVE PYLON'); __tap('FIRE');
            ({ kind: p.chosenKind, el: p.chosenElement })`);
        ok(r.kind === 'wave' && r.el === 'fire', JSON.stringify(r));
        // Both merge paths in npc.js honour the kind.
        const NPC = rd('js/npc.js');
        ok((NPC.match(/p\.chosenKind === "wave"\) \{ p\.waveMode = true; p\.attackMode = false; \}/g) || []).length === 2,
           'both merge paths should turn a wave choice into a wave pylon');
    });
    await check('upgrading an active pylon applies the kind at once', () => {
        const r = scene(`__fresh(); const p = __row[1]; unlockedElements.add('ice');
            openElementPicker('upgrade', p); __tap('WAVE PYLON'); __tap('ICE');
            ({ wave: p.waveMode, attack: p.attackMode, el: p.attackModeElement })`);
        ok(r.wave && !r.attack && r.el === 'ice', JSON.stringify(r));
    });

    group('CONVERT');

    await check('THE ASK: the left ring button on your pylon is CONVERT', () => {
        const DRAW = rd('js/draw.js'), INPUT = rd('js/input.js');
        ok(/leftLabel = "CONVERT"; leftAction = "convert_pylon"/.test(DRAW), 'draw.js does not label it CONVERT');
        ok(/selectedRadialAction = "convert_pylon"/.test(INPUT), 'the release-tap hit test does not mirror it');
        const r = run(`__fresh(); commandTarget = __row[1]; selectedRadialAction = 'convert_pylon'; executeCommand();
            ({ open: elementPickerOpen, mode: elementPickerMode })`);
        ok(r.open && r.mode === 'convert', JSON.stringify(r));
    });
    await check('it offers only attack and wave, with the current one marked', () => {
        const r = run(`__fresh(); openElementPicker('convert', __row[1]);
            ({ labels: __labels(), cur: _epKindState(PYLON_KINDS[0]).why, other: _epKindState(PYLON_KINDS[1]).ok })`);
        ok(JSON.stringify(r.labels) === JSON.stringify(['ATTACK TURRET', 'WAVE PYLON']), JSON.stringify(r.labels));
        ok(r.cur === 'CURRENT' && r.other, JSON.stringify(r));
    });
    await check('converting keeps the element and needs no element step', () => {
        const r = scene(`__fresh(); const p = __row[1]; openElementPicker('convert', p); __tap('WAVE PYLON');
            const a = { open: elementPickerOpen, wave: p.waveMode, attack: p.attackMode, el: p.attackModeElement };
            openElementPicker('convert', p); __tap('ATTACK TURRET');
            Object.assign(a, { back: p.attackMode && !p.waveMode }); a`);
        ok(!r.open && r.wave && !r.attack && r.el === 'fire', JSON.stringify(r));
        ok(r.back, 'it should convert back to a turret too');
    });
    await check('tapping the current kind does nothing', () => {
        const r = scene(`__fresh(); const p = __row[1]; openElementPicker('convert', p); __tap('ATTACK TURRET');
            ({ open: elementPickerOpen, attack: p.attackMode })`);
        ok(r.open && r.attack, JSON.stringify(r));
    });
    await check('relays and enemy pylons are not offered CONVERT', () => {
        const r = scene(`__fresh(); const p = __row[1];
            p.isGenerator = true; commandTarget = p; selectedRadialAction = 'convert_pylon'; executeCommand();
            const a = elementPickerOpen; closeElementPicker();
            p.isGenerator = false; p.pillarTeam = 'red'; executeCommand();
            ({ relay: a, red: elementPickerOpen })`);
        ok(!r.relay && !r.red, JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} failing` : '\nall passing');
    process.exitCode = failures ? 1 : 0;
})();
