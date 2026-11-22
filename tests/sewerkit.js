// THE SEWER DUNGEON'S KIT (build 2026-11-17bp; docs/SEWER-PROPS.md §10; design/props/models/_sewer.js, sewer.js, sewerfinds.js; js/propsprites.js PS_FAMILY, facilityPropState;
// view3d/gamemap.js, design/style-evolution/round2/chamber.js, view3d/core.js, view3d/gameview.js propState; js/view3d.js view3dPropState).
// ASKED (the owner, 2026-11-21, of the props and key items approved one by one that day): "Let's go ahead and create the framework so that my sewer AI can build this in 3D."
// So the approved pieces are the game's own models, on two sheets of their own; a prop of the map with one of the kit's kinds is drawn like any other, in the 2D game and in the 3D view;
// and a prop with states is drawn in the one the game last set, in both. Nothing of the kit is in the map yet: the dungeon's builder puts it there.
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
// the game's page in a real browser (software WebGL), as tests/view3d.js runs it: a copy with `pre` before init.js (the map is made, the game not begun) and `post` at the end; its result is a hidden block
function realPage(query, post, pre) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    const html = rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => '<script>' + post + '</script></body>').replace(/<script src="js\/init\.js/, () => '<script>' + pre + '</script><script src="js/init.js');
    fs.writeFileSync(file, html); let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + '?' + query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 480000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__sk"[^>]*>([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : { none: true };
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // the kit's own list, read as the bakers read it: the shared file and the two families, with nothing built (no model is made until a variant is asked for)
    const kit = vm.createContext({}); vm.runInContext('const PROPS = {};\n' + rd('design/props/models/_sewer.js') + '\n' + rd('design/props/models/sewer.js') + '\n' + rd('design/props/models/sewerfinds.js') + '\nthis.__K = { kit: SEWER_KIT, props: PROPS.sewer.variants, finds: PROPS.sewerfinds.variants };', kit);
    const K = JSON.parse(JSON.stringify(kit.__K)), kinds = []; for (const [k, d] of Object.entries(K.kit.props)) { kinds.push(k); if (d.turned) kinds.push(k + '_turned'); }

    group('THE KIT: THE GAME\'S OWN MODELS, ON TWO SHEETS');
    check('nine props and six key items, as approved: each prop\'s footprint and its states (the first, how it is found); an energy card for each of the seven elements, in the element\'s own colour, and one unknown', () => {
        same(Object.keys(K.kit.props).join(), 'drain_valve,sluice_gate,sluice_switch,floor_drain,subway_door,shortcut_door,rubble_heap,secret_door,loose_slab', 'the props');
        same(Object.entries(K.kit.props).map(([k, d]) => d.foot.join('x') + ':' + (d.states || []).join('/')).join(), '1x1:shut/open,2x1:open/shut,1x1:up/thrown,1x1:,2x1:locked/open,2x1:far/near/open,2x1:whole/cleared,2x1:hidden/open,2x1:', 'their footprints and states');
        same(K.kit.finds.join(), 'subway_key,module_canister,module_membranes,module_pump,battery_pack,energy_card', 'the key items');
        const r = J(`ELEMENTS.filter(e => !e.none).map(e => e.id + e.color).join()`); same(K.kit.elements.map(e => e + K.kit.colours[e]).join(), r, 'the elements and their colours are not the game\'s (js/config.js ELEMENTS)');
        ok(!/dead_ant|shed_chitin|egg_cluster|bridge_box/.test(rd('design/props/models/_sewer.js') + rd('design/sewer-props/models.js').replace(/\/\/[^\n]*/g, '')), 'a rejected piece is in the kit');
    });
    check('every variant the kit makes is on its sheet, and nothing else is: the sheets are baked from the kit as it stands (33 of the props, 13 of the key items), none touching its canvas\'s edge', () => {
        const r = J(`({ sewer: Object.keys(PROP_ATLAS.sewer.cells), finds: Object.keys(PROP_ATLAS.sewerfinds.cells), edge: Object.entries(PROP_ATLAS.sewer.cells).concat(Object.entries(PROP_ATLAS.sewerfinds.cells)).filter(([k, c]) => c.edge).map(([k]) => k) })`);
        same(r.sewer.join(), K.props.join(), 'the props\' sheet (bake it: node design/props/bake_props.js <three-dir> sewer,sewerfinds)'); same(r.finds.join(), K.finds.join(), 'the key items\' sheet'); same(r.sewer.length + ',' + r.finds.length, '33,13', 'how many'); same(r.edge.join(), '', 'cut at the edge');
        ok(fs.existsSync(path.join(ROOT, 'img/props/sewer.png')) && fs.existsSync(path.join(ROOT, 'img/props/sewerfinds.png')), 'the two pictures');
    });
    check('the key items are not on the PACK\'s two sheets (they are items of nothing yet), and the PACK\'s list of models is as it was', () => {
        const r = J(`({ icons: Object.keys(PROP_ATLAS.itemicons.cells), floor: Object.keys(PROP_ATLAS.pickups.cells) })`);
        for (const f of K.kit.finds) ok(r.icons.indexOf(f) < 0 && r.floor.indexOf(f) < 0, f + ' is on the PACK\'s sheets'); ok(!/subway_key|battery_pack|module_|energy_card/.test(rd('design/props/models/_items.js')), 'it is in ITEM_3D_IDS');
    });

    group('ITS KINDS: A PROP OF THE MAP IS DRAWN LIKE ANY OTHER');
    check('each of the kit\'s kinds, and the turned kind of a one-tile prop that faces a way, is on the sewer sheet; no prop of the map has one yet, with the dungeon\'s rooms or without (today\'s game is as it was)', () => {
        const r = J(`({ fam: ${JSON.stringify(kinds)}.map(k => PS_FAMILY[k]).join(), used: FACILITY_MAP.props.filter(p => PS_FAMILY[p.kind] === 'sewer').map(p => p.id).join(), dungeon: (typeof SEWER_DUNGEON_MAP !== 'undefined' ? SEWER_DUNGEON_MAP.props : []).filter(p => PS_FAMILY[p.kind] === 'sewer').length,
            old: ['rubble', 'valve', 'pump', 'gate', 'boss_gate', 'door'].map(k => PS_FAMILY[k] || '-').join() })`);
        same(r.fam, kinds.map(() => 'sewer').join(), 'the kinds\' sheet'); same(kinds.length, 11, 'how many kinds'); same(r.used, '', 'props of the map with a kit kind'); same(r.old, '-,-,-,-,-,-', 'today\'s Sewers\' own kinds are drawn as they were');
    });
    check('the variant the game picks: with no state, the kind\'s first (how it is found); with one, that one; a two-tile prop by its own size, turned when it lies along y; the turned kind of a one-tile prop', () => {
        const r = J(`[_psResolve('sewer', 'drain_valve', '1x1', null, 5), _psResolve('sewer', 'drain_valve', '1x1', 'open', 5), _psResolve('sewer', 'drain_valve_turned', '1x1', null, 5), _psResolve('sewer', 'sluice_gate', '2x1', null, 5),
            _psResolve('sewer', 'sluice_gate', '1x2', 'shut', 5), _psResolve('sewer', 'shortcut_door', '1x2', 'near', 5), _psResolve('sewer', 'loose_slab', '1x2', null, 5), _psResolve('sewer', 'floor_drain', '1x1', null, 5), _psResolve('sewer', 'secret_door', '2x1', null, 9)]`);
        same(r.join(), 'drain_valve.shut,drain_valve.open,drain_valve_turned.shut,sluice_gate.2x1.open,sluice_gate.1x2.shut,shortcut_door.1x2.near,loose_slab.1x2,floor_drain,secret_door.2x1.hidden', 'the variants picked');
    });
    check('the states the game had before are read as before: a chest shut, open, empty; a junction and a charger on or off; a crate\'s looks are not states', () => {
        const r = J(`[_psResolve('chest', 'chest', '1x1', null, 3), _psResolve('chest', 'chest', '1x1', 'open', 3), _psResolve('chest', 'chest', '1x1', 'empty', 3), _psResolve('tech', 'junction', '2x2', 'on', 3), _psResolve('tech', 'junction', '2x2', 'off', 3),
            _psResolve('tech', 'charger', '1x1', 'off', 3), _psStates('cargo', 'crate', '1x1').join('|'), _psStates('chest', 'chest', '1x1').join('|')]`);
        same(r.join(), 'chest,chest.open,chest.empty,junction.2x2.on,junction.2x2.off,charger.off,,open|empty', 'the old sheets\' variants');
    });

    group('A PROP\'S STATE: SET BY THE GAME, DRAWN IN IT');
    // (three props of the kit in the facility as it stands, and a spy on what is drawn and on what the 3D view is told)
    run(`if (typeof facilityPlay === 'undefined' || !facilityPlay) facilityPlayStart();
        for (const [id, kind, bb] of [['t_valve', 'drain_valve', [0, 0, 1, 1]], ['t_gate', 'sluice_gate', [2, 0, 3, 2]], ['t_slab', 'loose_slab', [5, 0, 7, 1]]]) _fp.F.solids.push({ id, kind, room: 'sewers', shape: 'rect', bb });
        _fp._pss = null; _fp.propState = null; _psImgs.sewer = { complete: true, naturalWidth: PROP_ATLAS.sewer.sheet[0], naturalHeight: PROP_ATLAS.sewer.sheet[1] };
        globalThis.__drawn = []; globalThis.__told = []; _psBlit = function (fam, name) { __drawn.push(fam + ':' + name); return [0, 0, { marks: {} }]; }; view3dPropState = function (id, st) { __told.push(id + ':' + st); return true; };
        globalThis.__draw = (id, kind) => { __drawn.length = 0; facilitySpriteDraw({ id, kind, x: 0.5, y: 0.5, spriteOnly: true }); return __drawn.join(); };`);
    check('a prop has its kind\'s states, in its sheet\'s order (a gate lying along y, its turned variants\'); one with none, and a prop that is not the kit\'s, has none', () => {
        same(J(`[facilityPropStates('t_valve').join('/'), facilityPropStates('t_gate').join('/'), facilityPropStates('t_slab').join('/'), facilityPropStates('nobody').join('/'), facilityPropStates((_fp.F.solids.find(s => s.kind === 'crate') || {}).id).join('/')]`).join(), 'shut/open,open/shut,,,', 'the states');
    });
    check('given none it is as it is found; given one it is drawn in it; given null, as found again; a state its kind has not, a prop with no states and a prop that is not there are refused and nothing changes', () => {
        const r = J(`(function(){ const o = {}; o.found = [facilityPropState('t_valve'), __draw('t_valve', 'drain_valve'), __draw('t_gate', 'sluice_gate'), __draw('t_slab', 'loose_slab')];
            o.set = [facilityPropStateSet('t_valve', 'open'), facilityPropState('t_valve'), __draw('t_valve', 'drain_valve'), facilityPropStateSet('t_gate', 'shut'), __draw('t_gate', 'sluice_gate')];
            o.bad = [facilityPropStateSet('t_valve', 'thrown'), facilityPropStateSet('t_slab', 'open'), facilityPropStateSet('nobody', 'open'), facilityPropState('t_valve'), __draw('t_valve', 'drain_valve')];
            o.back = [facilityPropStateSet('t_valve', null), facilityPropState('t_valve'), __draw('t_valve', 'drain_valve')]; o.told = __told.join(); return o; })()`);
        same(r.found.join(), ',sewer:drain_valve.shut,sewer:sluice_gate.1x2.open,sewer:loose_slab.2x1', 'as found'); same(r.set.join(), 'true,open,sewer:drain_valve.open,true,sewer:sluice_gate.1x2.shut', 'a state set');
        same(r.bad.join(), 'false,false,false,open,sewer:drain_valve.open', 'what is refused'); same(r.back.join(), 'true,,sewer:drain_valve.shut', 'as found again');
        same(r.told, 't_valve:open,t_gate:shut,t_valve:shut', 'what the 3D view is told (the state itself; for null, the kind\'s first)');
    });
    check('it is the look only and it is not saved: no solid is opened to walking by it, and the save holds nothing of it', () => {
        const r = J(`(function(){ facilityPropStateSet('t_gate', 'open'); return [!!_fp.F.solids.find(s => s.id === 't_gate').open, typeof facilitySaveSnapshot === 'function' ? /propState|t_gate/.test(JSON.stringify(facilitySaveSnapshot() || {})) : false]; })()`);
        same(r.join(), 'false,false', 'opened to walking, or saved');
    });

    group('THE 3D VIEW');
    check('the kit is in the view\'s script, and the view is given every state of a kit prop: the map\'s reader lists them, the room\'s builder makes each under one holder, the core merges each, the view shows the one asked for', () => {
        const d = rd('dist/view3d.js'); ok(/SEWER3D/.test(d) && /PROPS\.sewer\s*=/.test(d) && /PROPS\.sewerfinds\s*=/.test(d), 'the kit is not in dist/view3d.js (node tools/view3d.js)');
        ok(/o\.states = sts\.map\(st => \[st, G\.psResolve\(fam, s\.kind, dims, st, seed\)\]\)/.test(rd('view3d/gamemap.js')) && /psStates\(fam, kind, dims\)/.test(rd('view3d/gamemap.js')), 'view3d/gamemap.js');
        ok(/if \(s\.states\) \{[^]*Bs\.g\.userData\.dynamic = true; Bs\.g\.visible = st === s\.state;[^]*states: by \}; continue; \}/.test(rd('design/style-evolution/round2/chamber.js')), 'chamber.js');
        ok(/if \(p\.states\) for \(const k of Object\.keys\(p\.states\)\) \{ const sg = p\.states\[k\], v = sg\.visible; sg\.visible = true; mergeStill\(sg\); sg\.visible = v; \}/.test(rd('view3d/core.js')), 'view3d/core.js');
        ok(/propState\(id, st\) \{ const p = world\.props && world\.props\[id\];/.test(rd('view3d/gameview.js')) && /function view3dPropState\(id, state\) \{ return !!VIEW3D\.view/.test(rd('js/view3d.js')), 'gameview.js, js/view3d.js');
    });
    const r3 = realPage('engine=3d&power=on', `window.__errs = []; window.addEventListener('error', function (e) { window.__errs.push(String(e.message)); });
(function wait(n) {
  var ready = typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed');
  if (!ready && n < 1200) return setTimeout(function () { wait(n + 1); }, 100);
  var out = { state: VIEW3D.state, error: VIEW3D.error };
  try { var W = VIEW3D.view, shown = function (id) { var p = W.props(id); return p ? Object.keys(p).filter(function (k) { return p[k]; }).join('/') : null; };
    out.found = [shown('t_valve'), shown('t_gate'), shown('t_door'), shown('t_slab')]; out.all = Object.keys(W.props('t_door') || {}).join('/');
    out.set = [facilityPropStateSet('t_valve', 'open'), shown('t_valve'), facilityPropStateSet('t_door', 'near'), shown('t_door'), facilityPropStateSet('t_door', 'open'), shown('t_door'), facilityPropStateSet('t_gate', null), shown('t_gate')];
    out.bad = [W.propState('t_valve', 'thrown'), W.propState('nobody', 'open'), W.propState('t_slab', 'open'), shown('t_valve')];
    for (var i = 0; i < 6; i++) render(); out.drew = true;
  } catch (e) { out.threw = String(e && e.stack || e).slice(0, 600); }
  out.errs = window.__errs.slice(0, 6); var pre = document.createElement('pre'); pre.id = '__sk'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
})(0);`, `for (const [id, kind, rect] of [['t_valve', 'drain_valve', [380, 880, 400, 900]], ['t_gate', 'sluice_gate', [540, 880, 580, 900]], ['t_door', 'shortcut_door', [660, 862, 700, 882]], ['t_slab', 'loose_slab', [840, 888, 880, 908]]]) FACILITY_MAP.props.push({ id, room: 'sewers', shape: 'rect', rect, status: 'placed', kind });`);
    check('in a real browser, four props of the kit put in the Sewers: the view builds each, a prop with states in the one it is found in, every state\'s model made; a state set by the game is the one shown, and only that one; a state its kind has not, and a prop with none, are refused', () => {
        if (r3 === null) { console.log('       (no Chromium here: not run)'); return; }
        ok(!r3.none, 'the page left no result'); same(r3.threw || '', '', 'it threw'); same((r3.errs || []).join(), '', 'page errors'); same(r3.state, 'ready', 'the view');
        same(r3.found.join(), 'shut,open,far,', 'as found (a prop with no states has no holder of them)'); same(r3.all, 'far/near/open', 'every state\'s model is made');
        same(r3.set.join(), 'true,open,true,near,true,open,true,open', 'a state set'); same(r3.bad.join(), 'false,false,false,open', 'what is refused'); same(r3.drew, true, 'it drew after');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
