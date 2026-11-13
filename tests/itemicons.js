// THE ITEMS IN 3D AND THE PACK'S GLOSSY TILES (build 2026-11-13u; js/inventory.js invDrawIcon, _ivTile; design/props/models/_items.js, itemicons.js, pickups.js; docs/TUTORIAL.md, "The items in 3D").
// ASKED (the owner, 2026-11-13): "I want to redo the items in the game make them have 3-D looking assets"; shown the AMMO PACK, one piece first: "Also change that item menu to the borders on those on
// the grid aren't so big maybe make them translucent glossy buttons".
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

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`canvas.width = 1280; canvas.height = 860; innerWidth = 1100;
        // a pen that only remembers: what is drawn, the fill at each fill, the line's width at each stroke (gradients are kept as their stops)
        globalThis.__pen = () => { const rec = { draws: [], fills: [], strokes: [], rects: [] }, st = {}; let fill = null;
            const grad = () => { const g = { stops: [], addColorStop(o, c) { this.stops.push(c); } }; return g; };
            const p = new Proxy(st, { get(t, k) { if (k === '__rec') return rec; if (k in t) return t[k];
                if (k === 'createLinearGradient' || k === 'createRadialGradient') return grad; if (k === 'measureText') return () => ({ width: 10 });
                if (k === 'drawImage') return (...a) => rec.draws.push(a.slice(1).map(v => Math.round(v * 100) / 100));
                if (k === 'fill') return () => rec.fills.push(typeof t.fillStyle === 'string' ? t.fillStyle : 'gradient:' + ((t.fillStyle && t.fillStyle.stops) || []).join('|'));
                if (k === 'fillRect') return () => rec.rects.push(typeof t.fillStyle === 'string' ? t.fillStyle : 'gradient');
                if (k === 'stroke') return () => rec.strokes.push(t.lineWidth == null ? 1 : t.lineWidth);
                return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
            return p; };
        globalThis.__sheet = on => { _psImgs.itemicons = on ? { complete: true, naturalWidth: PROP_ATLAS.itemicons.sheet[0], naturalHeight: PROP_ATLAS.itemicons.sheet[1] } : null; };`);

    group('THE ITEMS IN 3D');
    check('every item of the PACK has its 3D icon on the itemicons sheet and its model on the floor\'s pickups sheet, from one list of models (design/props/models/_items.js, in ITEM_ORDER); the sheet is preloaded', () => {
        const r = J(`(function(){ const o = {}; o.order = ITEM_ORDER.join(); o.icons = ITEM_ORDER.filter(id => !(PROP_ATLAS.itemicons && PROP_ATLAS.itemicons.cells[id])).join(); o.floor = ITEM_ORDER.filter(id => !(PROP_ATLAS.pickups && PROP_ATLAS.pickups.cells[id])).join();
            o.extra = Object.keys(PROP_ATLAS.itemicons.cells).filter(id => !ITEMS[id]).join(); o.small = Object.entries(PROP_ATLAS.itemicons.cells).filter(([k, c]) => Math.max(c.w, c.h) < 200).map(([k]) => k).join(); return o; })()`);
        same(r.icons, '', 'items with no 3D icon'); same(r.floor, '', 'items with no model on the floor'); same(r.extra, '', 'icons of no item'); same(r.small, '', 'icons baked smaller than 200 px on their larger side');
        const m = rd('design/props/models/_items.js').match(/const ITEM_3D_IDS = \[([^\]]+)\]/); ok(m, 'the models\' list');
        same(m[1].replace(/[\s"]/g, ''), r.order, 'the models\' list (ITEM_3D_IDS) is not the PACK\'s order (ITEM_ORDER): a new item needs its model');
        ok(/rel="preload" as="image" href="img\/props\/itemicons\.(webp|png)\?/.test(rd('game.html')), 'the sheet is not preloaded');
        ok(/PROPS\.itemicons = \{ variants: ITEM_3D_IDS\.slice\(\),[^]*fit: 250/.test(rd('design/props/models/itemicons.js')) && /PROPS\.pickups = \{ variants: ITEM_3D_IDS\.slice\(\)/.test(rd('design/props/models/pickups.js')), 'the two families from the one list');
        ok(/if \(def\.fit\)/.test(rd('design/props/bake_props.js')), 'the baker frames an icon family');
    });
    check('an item is drawn as its 3D icon once the sheet has arrived (its cell, its larger side INV_ICON_FIT of the box, in the middle), as its flat drawing before; a never-found item\'s silhouette follows the sheet', () => {
        const r = J(`(function(){ const o = {}, keep = ctx; try {
            __sheet(true); ctx = __pen(); invDrawIcon('ammo_pack', 100, 200, 80); o.d3 = ctx.__rec.draws.slice(); const c = PROP_ATLAS.itemicons.cells.ammo_pack; o.cell = [c.x, c.y, c.w, c.h];
            __sheet(false); ctx = __pen(); invDrawIcon('ammo_pack', 100, 200, 80); o.flat = ctx.__rec.draws.length + ',' + (ctx.__rec.fills.length + ctx.__rec.rects.length > 0);
            o.sil0 = !!_ivSilhouette('rock', 77); o.k0 = Object.keys(_ivSil).filter(k => k.indexOf('rock@77') === 0).join(); __sheet(true); _ivSilhouette('rock', 77); o.k1 = Object.keys(_ivSil).filter(k => k.indexOf('rock@77') === 0).sort().join();
            } finally { ctx = keep; __sheet(false); } o.fit = INV_ICON_FIT; return o; })()`);
        same(r.d3.length, 1, 'drawn from the sheet'); same(r.d3[0].slice(0, 4).join(), r.cell.join(), 'the item\'s own cell');
        const [, , , , dx, dy, dw, dh] = r.d3[0];   // (the source's x, y, w, h, then where it lands) ok(Math.abs(Math.max(dw, dh) - 80 * r.fit) < 0.02, 'its larger side: ' + Math.max(dw, dh)); ok(Math.abs(dx + dw / 2 - 100) < 0.02 && Math.abs(dy + dh / 2 - 200) < 0.02, 'in the middle of the box');
        same(r.flat, '0,true', 'before the sheet: the flat drawing'); same(r.k0, 'rock@77', 'the silhouette before the sheet'); same(r.k1, 'rock@77,rock@77/3d', 'the silhouette once the sheet has arrived');
    });
    check('a rock from the drilled rubble lies on the floor as its model once the pickups sheet has arrived, with no icon floating over it (the flat lump and the icon before)', () => {
        const r = J(`(function(){ const o = {}, keepImg = _psImgs.pickups, keepBlit = _psBlit, keepIcon = invDrawIcon, blits = [], icons = []; facilityPlay = true; facilityTutorialStart(_fp.F);
            try { _psBlit = function (fam, name) { blits.push(fam + '/' + name); return null; }; invDrawIcon = function (id) { icons.push(id); };
                const it = _fpPickupItem({ id: 'test_rock', room: 'arena', at: [33, 50.5], items: [['rock', 1]] }); it.rock = true;
                _psImgs.pickups = { complete: true, naturalWidth: PROP_ATLAS.pickups.sheet[0], naturalHeight: PROP_ATLAS.pickups.sheet[1] }; _fpDrawPickup(it); o.with = blits.join() + '|' + icons.join();
                blits.length = 0; icons.length = 0; _psImgs.pickups = null; _fpDrawPickup(it); o.without = blits.join() + '|' + icons.join();
            } finally { _psImgs.pickups = keepImg; _psBlit = keepBlit; invDrawIcon = keepIcon; } return o; })()`);
        same(r.with, 'pickups/rock|', 'with the sheet'); same(r.without, '|rock', 'before the sheet (the flat lump, its icon over it)');
    });

    group('THE PACK\'S TILES: TRANSLUCENT GLOSSY BUTTONS');
    check('a tile is see-through glass tinted with its item\'s colour, its edge a hairline (the chosen one a fine line in a soft glow, no frame wider than 5 px); no black name bar, no corner of colour', () => {
        const r = J(`(function(){ const o = {}, keep = ctx; try { invAdd('ammo_pack', 2); invAdd('flare', 1); _invSel = 'ammo_pack'; __sheet(true);
            const cell = id => ({ id, x: 100, y: 100, w: 180, h: 160 });
            ctx = __pen(); _ivTile(cell('flare'), 0); o.off = ctx.__rec;
            ctx = __pen(); _ivTile(cell('ammo_pack'), 0); o.on = ctx.__rec;
            ctx = __pen(); _ivTile(cell('rock'), 0); o.unknown = ctx.__rec;
            } finally { ctx = keep; __sheet(false); } return o; })()`);
        for (const k of ['off', 'on', 'unknown']) {
            const R = r[k]; ok(R.fills.length > 0, k + ': no glass');
            const body = R.fills[0]; ok(/^rgba\(/.test(body) && +body.split(',')[3].replace(')', '') < 0.5, k + ': the body is not see-through: ' + body);
            ok(!R.rects.includes('#04070f'), k + ': the black name bar is back');
            ok(Math.max(...R.strokes) <= 5, k + ': a frame wider than 5 px: ' + R.strokes.join());
        }
        ok(Math.max(...r.off.strokes) <= 1, 'an unchosen tile\'s edge is more than a hairline: ' + r.off.strokes.join());
        ok(r.on.strokes.includes(1.5) && r.on.strokes.includes(5), 'the chosen tile: a fine line in a soft glow: ' + r.on.strokes.join());
        ok(r.off.fills.some(f => /^gradient:rgba\(255,255,255,0\.15\)/.test(f)), 'no sheen over a tile: ' + r.off.fills.join(' ; '));
        same(r.off.draws.length, 1, 'the item drawn as its 3D icon in its tile');
        const src = rd('js/inventory.js'), tile = src.slice(src.indexOf('function _ivTile('), src.indexOf('function _ivStage('));
        ok(!/a corner of its colour/.test(tile) && !/lineWidth = 9/.test(tile), 'the old corner and 9 px glow are still in the tile');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
