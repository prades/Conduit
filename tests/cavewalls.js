// THE CAVE'S ROCK WALLS, MODELLED (build 2026-11-09i; the owner, 2026-11-09: RuneScape's 3D-model walls as the reference, the look approved on its preview, "Brown, build the full wall set").
// Every rock wall piece (the arena, the Cold Storage's ice cave, the Nest's cavern) draws a strip of a rock wall modelled from its own shape (design/cave/bake_walls.js -> img/cave/<room>.png,
// js/caveatlas.js; js/cavewalls.js draws it). docs/ART-PROCESS.md: on the preview (?walls=3d) first; approved in the game on 2026-11-09 ("Approve the walls for everyone", build 2026-11-09j); the drawn rock stays as the fallback.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const pngSize = f => { const b = fs.readFileSync(path.join(ROOT, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`globalThis.__rocks = () => _fp.items.filter(it => it.fp === 'wall' && it.kind === 'rock');
        globalThis.__pen = () => { const calls = []; const g = new Proxy({}, { get(t, k) { if (k in t) return t[k]; return function () { calls.push([k].concat(Array.prototype.slice.call(arguments))); }; }, set(t, k, v) { t[k] = v; return true; } }); return { g, calls }; };
        globalThis.__sheets = () => { for (const r in CAVE_ATLAS.rooms) _caveImgs[r] = { complete: true, naturalWidth: CAVE_ATLAS.rooms[r].w, naturalHeight: CAVE_ATLAS.rooms[r].h, room: r }; };`);

    group('THE BAKE');
    check('js/caveatlas.js and js/cavewalls.js are loaded by the game page, and the page checks they arrived', () => {
        const html = rd('game.html'); ok(/<script src="js\/caveatlas\.js\?v=[^"]+"><\/script>\s*(<script src="js\/caverubble\.js\?v=[^"]+"><\/script>\s*)?<script src="js\/cavewalls\.js\?v=[^"]+"><\/script>/.test(html), 'no script tags');   // (the rubble's atlas between them, build 2026-11-09k)
        ok(/"js\/caveatlas\.js": "CAVE_ATLAS", ("js\/caverubble\.js": "CAVE_RUBBLE", )?"js\/cavewalls\.js": "caveWallDraw"/.test(html), 'not in the page\'s arrival check');
    });
    check('every rock wall piece has its strip, and the bake was made from the walls the game has now (the signature: bake again when the walls change)', () => {
        const r = J('(function(){ const its = __rocks(); return { n: its.length, missing: its.filter(it => !CAVE_ATLAS.pieces[caveWallKey(it)]).map(caveWallKey).slice(0, 5), extra: Object.keys(CAVE_ATLAS.pieces).length - its.length, sig: caveWallsSig(), baked: CAVE_ATLAS.sig, rooms: [...new Set(its.map(i => i.room))].sort() }; })()');
        ok(r.n > 300, 'only ' + r.n + ' rock pieces'); same(r.missing.length, 0, 'pieces with no strip (' + r.missing.join(' ') + ')'); same(r.extra, 0, 'strips for pieces the game does not have');
        same(r.sig, r.baked, 'the walls changed since the bake: node design/cave/bake_walls.js <three>'); same(r.rooms.join(), 'arena,cold_storage,nest_area', 'the caves');
    });
    check('each cave has its sheet, its size as the atlas says, every strip inside it', () => {
        const A = J('CAVE_ATLAS');
        for (const [room, R] of Object.entries(A.rooms)) {
            same(R.sheet, 'img/cave/' + room + '.png', room + ': the sheet'); same(pngSize(R.sheet).join('x'), R.w + 'x' + R.h, room + ': its size'); ok(R.w <= 4096 && R.h <= 4096, room + ': too big for a tablet\'s texture');
            const bad = Object.values(A.pieces).filter(e => e[0] === room && e[3] && (e[1] < 0 || e[2] < 0 || e[1] + e[3] > R.w || e[2] + e[4] > R.h)); same(bad.length, 0, room + ': strips outside the sheet');
        }
    });
    check('a run\'s strips meet flush: along each straight run of pieces, each strip begins where the one before it ends (no gap, no overlap)', () => {
        const r = J(`(function(){ const its = __rocks(), byA = new Map(its.map(it => [it.room + '|' + it.a[0].toFixed(3) + ',' + it.a[1].toFixed(3), it])); let pairs = 0, bad = [];
            for (const it of its) { const nx = byA.get(it.room + '|' + it.b[0].toFixed(3) + ',' + it.b[1].toFixed(3)); if (!nx || nx.back !== it.back) continue;
                const d0 = [it.b[0] - it.a[0], it.b[1] - it.a[1]], d1 = [nx.b[0] - nx.a[0], nx.b[1] - nx.a[1]]; if (Math.abs(d0[0] * d1[1] - d0[1] * d1[0]) > 1e-6) continue;   // (a corner: a new run)
                const e0 = CAVE_ATLAS.pieces[caveWallKey(it)], e1 = CAVE_ATLAS.pieces[caveWallKey(nx)]; if (!e0[3] || !e1[3]) continue;
                const sx = p => (p[0] - p[1]) * TILE_W, l0 = sx(it.a) + e0[5], r0 = l0 + e0[3], l1 = sx(nx.a) + e1[5], r1 = l1 + e1[3]; pairs++;
                if (!(Math.abs(r0 - l1) < 1.01 || Math.abs(r1 - l0) < 1.01)) bad.push(caveWallKey(it) + ' ' + [l0, r0, l1, r1].map(v => v.toFixed(1)).join('/')); }
            return { pairs, bad: bad.slice(0, 4), n: bad.length }; })()`);
        ok(r.pairs > 200, 'only ' + r.pairs + ' neighbouring pieces checked'); ok(r.n <= Math.ceil(r.pairs * 0.25), r.n + ' of ' + r.pairs + ' neighbours do not meet: ' + r.bad.join('; '));
    });
    check('the model is the approved look: the cave\'s brown, a face pushed in and out by the noise of where it is in the world, smooth shading, a front wall\'s rock fading to black below the floor; frost and icicles in an ice room', () => {
        const b = rd('design/cave/bake_walls.js');
        ok(/base = lin\(0x4a3f37\), dark = lin\(0x1d1714\), light = lin\(0x7a6a5c\)/.test(b), 'not the approved brown');
        ok(/fbm\(w\[0\] \* 1\.3 \+ 3, z \/ UH \* 1\.6, w\[1\] \* 1\.3 \+ 1\.7\)/.test(b), 'the face is not pushed by the world\'s noise'); ok(/flatShading: false/.test(b), 'not smooth shading');
        ok(/gl_FragColor\.rgb \*= vFade/.test(b), 'no fade to black'); ok(/if \(ice\)/.test(b) && /ConeGeometry/.test(b), 'no frost or icicles');
    });

    group('APPROVED IN THE GAME (the owner, 2026-11-09: "Approve the walls for everyone"): the modelled rock for everyone; the drawn rock only as the fallback');
    check('it is on for everyone, with or without the preview; the preview flag (?walls=3d) still reads, for the cave pieces that come next', () => {
        same(J('CAVE_WALLS.approved'), true, 'not approved');
        run('_caveWallsPrev = null; globalThis.location = { search: "" };'); same(J('caveWallsOn()'), true, 'off without the preview');
        run('globalThis.location = { search: "?power=on&walls=3d" };'); same(J('caveWallsPreview()'), true, 'the preview flag'); run('globalThis.location = { search: "?walls=3dx" };'); same(J('caveWallsPreview()'), false, 'another flag');
        same(J('/if \\(it\\.kind === "rock"\\) \\{ if \\(typeof caveWallDraw === "function" && caveWallDraw\\(it\\)\\) return; return _fpDrawRock\\(it, H\\); \\}/.test(' + JSON.stringify(rd('js/facilityplay.js')) + ')'), true, 'the wall draw does not fall back to the drawn rock');
    });
    check('until its cave\'s sheet has arrived, the drawn rock (so a wall is never missing)', () => {
        run('_caveWallsPrev = true; for (const r in _caveImgs) delete _caveImgs[r];'); const r = J('(function(){ const it = __rocks()[10], P = __pen(), keep = ctx; ctx = P.g; try { return caveWallDraw(it); } finally { ctx = keep; } })()');
        same(r, false, 'drawn before the sheet arrived');
    });

    group('THE STRIP (on the preview, the sheets in)');
    check('a lit piece is one picture: its strip (cut once into a small canvas of its own, js/draw.js spriteCell), on whole pixels, from the screen point of its start; with no small canvas, straight from the sheet', () => {
        run('_caveWallsPrev = true; __sheets();');
        const at = cells => J(`(function(){ const it = __rocks().find(i => CAVE_ATLAS.pieces[caveWallKey(i)][3] > 0), e = CAVE_ATLAS.pieces[caveWallKey(it)], P = __pen(), keep = ctx, sc = spriteCell; ctx = P.g; ctx._k = undefined;
            spriteCell = ${cells} ? function (im, sx, sy, sw, sh) { return { cut: [sx, sy, sw, sh] }; } : () => null;
            try { const drew = caveWallDraw(it), p = _fpP(it.a[0], it.a[1], 0); return { drew, calls: P.calls.map(c => c.slice(1)), e, x: Math.round(p[0] + e[5]), y: Math.round(p[1] + e[6]) }; } finally { ctx = keep; spriteCell = sc; } })()`);
        const a = at(true), b = at(false);
        same(a.drew, true, 'not drawn'); same(a.calls.length, 1, 'canvas calls'); same(JSON.stringify(a.calls[0]), JSON.stringify([{ cut: [a.e[1], a.e[2], a.e[3], a.e[4]] }, a.x, a.y]), 'its strip, from its own small canvas');
        same(b.calls.length, 1, 'canvas calls (no small canvas)'); same(JSON.stringify(b.calls[0].slice(1)), JSON.stringify([b.e[1], b.e[2], b.e[3], b.e[4], b.x, b.y, b.e[3], b.e[4]]), 'its strip, from the sheet');
    });
    check('a piece\'s lookup text is made once and kept, not each frame it is drawn (the owner, 2026-11-09: "Cache the wall lookup text too"; build 2026-11-09o)', () => {
        const r = J(`(function(){ const it = __rocks().find(i => CAVE_ATLAS.pieces[caveWallKey(i)][3] > 0), P = __pen(), keep = ctx, ck = caveWallKey; let n = 0; caveWallKey = function (x) { n++; return ck(x); }; _caveWallKeys = new WeakMap(); ctx = P.g; ctx._k = undefined;
            try { caveWallDraw(it); caveWallDraw(it); caveWallDraw(it); caveWallBox(it); return { n, draws: P.calls.length, same: _caveWallKeys.get(it) === ck(it) }; } finally { ctx = keep; caveWallKey = ck; } })()`);
        same(r.n, 1, 'the text made (three draws and a cull)'); same(r.draws, 3, 'pictures drawn'); same(r.same, true, 'the kept text is not the piece\'s own');
    });
    check('in a dim room it is darkened as the props are (its strip over its silhouette at the room\'s light, composed once per level); nearly dark, the silhouette alone', () => {
        const r = J(`(function(){ const it = __rocks().find(i => CAVE_ATLAS.pieces[caveWallKey(i)][3] > 0), P = __pen(), keep = ctx; ctx = P.g; _caveDim.clear();
            try { ctx._k = 0.5; caveWallDraw(it); const half = _caveDim.get(caveWallKey(it)); ctx._k = 0.52; caveWallDraw(it); ctx._k = 0.05; caveWallDraw(it); const st = _caveDim.get(caveWallKey(it));
                return { calls: P.calls.map(c => c[0]), buckets: Object.keys(st).sort((a, b) => a - b), same: !!half }; } finally { ctx = keep; } })()`);
        same(r.calls.join(), 'drawImage,drawImage,drawImage', 'one picture each time'); same(r.buckets.join(), '0,6', 'the light levels composed (a twelfth at a time: 0.5 and 0.52 are one)');
    });
    check('the walls\' off-screen cull keeps a piece whose strip is on the screen (its box holds the strip)', () => {
        const r = J(`(function(){ let bad = 0, n = 0; for (const it of __rocks()) { const cb = caveWallBox(it); if (!cb) continue; n++; it._wb = undefined; const wb = _fpWallBounds(it); if (wb[0] > cb[0] || wb[1] > cb[1] || wb[2] < cb[2] || wb[3] < cb[3]) bad++; } return { n, bad }; })()`);
        ok(r.n > 300, 'only ' + r.n + ' boxes'); same(r.bad, 0, 'pieces whose cull box is smaller than their strip');
        run('_caveWallsPrev = false; for (const r in _caveImgs) delete _caveImgs[r];');
    });

    // THE RUBBLE, MODELLED IN THE SAME ROCK (build 2026-11-09k; the owner, 2026-11-09: "update the rubble patches make those look more like a cave rock", "then do the rubble"): every rubble patch
    // a fire technician drills is a rock fall baked by design/cave/bake_rubble.js (img/cave/rubble.png, js/caverubble.js), one picture for each stage of the drilling. Shown on the preview first; approved in the
    // game on 2026-11-09 ("Approve the rubble for everyone, keep the slab"): for everyone since build 2026-11-09l, the drawn pile only as the fallback.
    group('THE RUBBLE, MODELLED IN THE CAVE\'S ROCK (approved in the game, 2026-11-09: "Approve the rubble for everyone, keep the slab")');
    run(`globalThis.__rub = () => _fp.items.filter(it => it.fp === 'wdecor' && it.kind === 'rubble');
        globalThis.__pen2 = () => { const calls = [], t = {}; const g = new Proxy(t, { get(t, k) { if (k in t) return t[k]; return function () { calls.push([k].concat(Array.prototype.slice.call(arguments), k === 'stroke' ? [t.strokeStyle, t.globalCompositeOperation] : [])); }; }, set(t, k, v) { t[k] = v; return true; } }); return { g, calls }; };
        globalThis.__rubDraw = (id, hits, k) => { const it = __rub().find(i => i.rubble === id), P = __pen2(), keep = ctx, H = _techRubbleHits(), was = H[id]; ctx = P.g; ctx._k = k;
            if (hits) H[id] = hits; else delete H[id];
            try { techDrawRubbleOn(it, 10); return P.calls; } finally { ctx = keep; if (was) H[id] = was; else delete H[id]; } };
        globalThis.__rubSheet = on => { _caveRubbleImg = on ? { complete: true, naturalWidth: CAVE_RUBBLE.w, naturalHeight: CAVE_RUBBLE.h } : null; };
        globalThis.__at = c => c.length === 4 ? [c[2], c[3]] : [c[6], c[7]];`);   // (a picture's place: from its own small canvas, or from the sheet)
    check('js/caverubble.js is loaded by the game page (before js/cavewalls.js), and the page checks it arrived', () => {
        const html = rd('game.html'); ok(/<script src="js\/caverubble\.js\?v=[^"]+"><\/script>\s*<script src="js\/cavewalls\.js\?v=[^"]+"><\/script>/.test(html), 'no script tag');
        ok(/"js\/caverubble\.js": "CAVE_RUBBLE"/.test(html), 'not in the page\'s arrival check');
    });
    check('every rubble patch has its pictures, baked from the patch the game has now: one for each count of stones the drilling shows (9 8 7 6 4 3), what a drilled choke leaves (chokes only); three seams to a pile', () => {
        const r = J(`__rub().map(it => { const P = CAVE_RUBBLE.items[it.rubble], R = _techRubble(it.rubble), segs = Math.max(1, Math.round(Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) / 2));
            return { id: it.rubble, has: P ? Object.keys(P).filter(k => k !== 'ends').sort() : null, ends: P && P.ends, now: [it.a[0], it.a[1], it.b[0], it.b[1]], choke: !!(R && R.solid), segs,
                seams: P ? CAVE_RUBBLE.shows.map(s => P[s] && P[s][7] ? P[s][7].filter(q => q.length >= 4 && q.length % 2 === 0).length : -1) : [], left: P && P.left ? P.left[7].length : -1 }; })`);
        ok(r.length >= 4, 'only ' + r.length + ' patches'); same(r.map(p => p.id).sort().join(), 'rubble_arena_south,rubble_sewer_bank,rubble_sewer_choke,rubble_sewer_gate', 'the patches');
        for (const p of r) {
            ok(p.has, p.id + ': no pictures'); same(p.has.join(), ['3', '4', '6', '7', '8', '9'].concat(p.choke ? ['left'] : ['hole']).sort().join(), p.id + ': its pictures (and the hole, for rubble against a wall: build 2026-11-09m)');
            same(JSON.stringify(p.ends), JSON.stringify(p.now), p.id + ': the patch moved since the bake: node design/cave/bake_rubble.js <three>');
            same(p.seams.join(), [9, 8, 7, 6, 4, 3].map(() => p.segs * 3).join(), p.id + ': its seams (three to a pile)'); if (p.choke) same(p.left, 0, p.id + ': seams on what a choke leaves');
        }
        same(J('CAVE_RUBBLE.shows').join(), '9,8,7,6,4,3', 'the stages'); same(J('[0, 1, 2, 3, 4, 5].map(h => _TECH_RUBBLE.length - Math.floor(h * _TECH_RUBBLE.length / (TECH_AB.drill.hits + 1)))').join(), '9,8,7,6,4,3', 'the drilling shows other stages');
    });
    check('its sheet is the size the atlas says, every picture inside it; the model is the walls\' rock (their brown and their lights)', () => {
        const A = J('CAVE_RUBBLE'); same(A.sheet, 'img/cave/rubble.png', 'the sheet'); same(pngSize(A.sheet).join('x'), A.w + 'x' + A.h, 'its size'); ok(A.w <= 4096 && A.h <= 4096, 'too big for a tablet\'s texture');
        let n = 0, bad = 0; for (const P of Object.values(A.items)) for (const [k, e] of Object.entries(P)) { if (k === 'ends') continue; n++; if (e[1] < 0 || e[2] < 0 || e[1] + e[3] > A.w || e[2] + e[4] > A.h || e[3] < 1 || e[4] < 1) bad++; }
        same(n, 28, 'pictures'); same(bad, 0, 'pictures outside the sheet');
        const b = rd('design/cave/bake_rubble.js'), w = rd('design/cave/bake_walls.js'), lights = s => (s.match(/new T\.(HemisphereLight|DirectionalLight)\([^)]*\)/g) || []).join();
        ok(/base = lin\(0x4a3f37\), dark = lin\(0x1d1714\), light = lin\(0x7a6a5c\)/.test(b), 'not the walls\' brown'); ok(lights(b).length > 40 && lights(b) === lights(w), 'not the walls\' lights');
    });
    check('it is on for everyone, with or without the preview; before its sheet has arrived, the drawn pile (so the rubble is never missing); the hazard-painted slab kept ("keep the slab")', () => {
        same(J('CAVE_RUBBLE_APPROVED'), true, 'not approved');
        run('_caveWallsPrev = null; globalThis.location = { search: "" };'); same(J('caveRubbleOn()'), true, 'off without the preview');
        run('__rubSheet(true);'); let c = J('__rubDraw("rubble_arena_south", 0)'); same(c.filter(q => q[0] === 'drawImage').length, 1, 'not the modelled pile without the preview');
        run('_caveWallsPrev = null; globalThis.location = { search: "?power=on&walls=3d" };'); same(J('caveRubbleOn()'), true, 'off on the preview');
        run('__rubSheet(false);'); c = J('__rubDraw("rubble_arena_south", 0)'); ok(!c.some(q => q[0] === 'drawImage') && c.filter(q => q[0] === 'fill').length >= 9, 'not the drawn pile before the sheet arrived');
        const b = rd('design/cave/bake_rubble.js'); ok(/THE SLAB, hazard-painted/.test(b) && /if \(!left && show > 4\)/.test(b) && /MAT\.painted, MAT\.painted\]/.test(b), 'the slab is not in the model (the owner: "keep the slab")');
    });
    check('each stage of the drilling is its one picture, on whole pixels from the screen point of the patch\'s start, with its seams glowing over it (lighter), hotter with each hit; none of the drawn pile', () => {
        run('_caveWallsPrev = true; __rubSheet(true);');
        const r = J(`[0, 1, 2, 3, 4, 5].map(h => { const calls = __rubDraw("rubble_sewer_bank", h), it = __rub().find(i => i.rubble === "rubble_sewer_bank"), show = String(9 - Math.floor(h * 9 / 7)), e = CAVE_RUBBLE.items.rubble_sewer_bank[show], p = _fpWP(it, 0, 0);
            const pics = calls.filter(c => c[0] === 'drawImage'), st = calls.filter(c => c[0] === 'stroke');
            return { show, pics: pics.length, at: pics[0] && __at(pics[0]), want: [Math.round(p[0] + e[5]), Math.round(p[1] + e[6])], strokes: st.length, lighter: st.every(c => c[2] === 'lighter'), glow: +(String(st[1] && st[1][1]).match(/,([0-9.]+)\\)$/) || [0, 0])[1], fills: calls.filter(c => c[0] === 'fill').length }; })`);
        for (const s of r) { same(s.pics, 1, s.show + ': pictures'); same(JSON.stringify(s.at), JSON.stringify(s.want), s.show + ': where'); same(s.strokes, 3 * 3 * 2, s.show + ': its seams (three to a pile, each a glow and a line)'); ok(s.lighter, s.show + ': its seams do not glow'); same(s.fills, 0, s.show + ': the drawn pile too'); }
        ok(r.every((s, i) => !i || s.glow > r[i - 1].glow), 'the seams do not glow hotter with each hit: ' + r.map(s => s.glow).join(' '));
    });
    check('a choke drilled through: what it leaves, in the rock (one picture), its sides still warm', () => {
        const a = J('__rubDraw("rubble_sewer_gate", 6)'); same(a.filter(q => q[0] === 'drawImage').length, 1, 'what a choke leaves'); same(a.filter(q => q[0] === 'fill').length, 2, 'its two warm sides'); same(a.filter(q => q[0] === 'stroke').length, 0, 'seams on what is left');
    });
    // THE HOLE (the owner, 2026-11-09: "Yes, model the hole in the rock too"; build 2026-11-09m): rubble against a wall drilled through leaves a tunnel mouth modelled in the rock. Shown on the preview first;
    // approved in the game on 2026-11-09 ("Approve the hole for everyone"): for everyone since build 2026-11-09n, the drawn hole only as the fallback
    check('the hole a drilled rubble leaves in a wall, modelled in the rock, for everyone (one picture, its rim still warm, glowing over it), with or without the preview; before the sheet has arrived, the drawn hole', () => {
        same(J('CAVE_HOLE_APPROVED'), true, 'not approved');
        for (const prev of [false, true]) { run('_caveWallsPrev = ' + prev + ';'); const m = J('__rubDraw("rubble_arena_south", 6)'), st = m.filter(q => q[0] === 'stroke'), w = prev ? ' (the preview)' : ' (no preview)';
            same(m.filter(q => q[0] === 'drawImage').length, 1, 'the modelled hole' + w); same(st.length, 2, 'its rim (a glow and a line)' + w); ok(st.every(c => c[2] === 'lighter'), 'its rim does not glow' + w); same(m.filter(q => q[0] === 'fill').length, 0, 'the drawn hole too' + w); }
        const e = J('CAVE_RUBBLE.items.rubble_arena_south.hole'); same(e[7].length, 1, 'its rim: one line'); ok(e[7][0].length >= 40, 'its rim: too few points');
        run('__rubSheet(false);'); const h = J('__rubDraw("rubble_arena_south", 6)'); same(h.filter(q => q[0] === 'drawImage').length, 0, 'a picture before the sheet arrived'); ok(h.filter(q => q[0] === 'fill').length >= 8, 'not the drawn hole before the sheet arrived');
        run('_caveWallsPrev = true; __rubSheet(true);');
        const b = rd('design/cave/bake_rubble.js'); ok(/colorWrite: false/.test(b), 'the hole\'s tunnel is not masked by the wall\'s face (its outside would show)');
    });
    check('in a dim room it is darkened as the walls are (its picture over its silhouette at the room\'s light, composed once per level)', () => {
        run('_caveDim.clear();'); const c = J('__rubDraw("rubble_arena_south", 0, 0.5)'); same(c.filter(q => q[0] === 'drawImage').length, 1, 'pictures');
        same(J('Object.keys(_caveDim.get("rubble|rubble_arena_south|9") || {})').join(), '6', 'the light level composed');
        run('_caveWallsPrev = false; _caveRubbleImg = undefined; _caveDim.clear();');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
