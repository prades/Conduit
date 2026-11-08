// THE FOLLOWING UPDATE'S PART 2 (build 2026-11-06d; docs/FOLLOWING-UPDATE.md Part 2, docs/UI-STYLE.md "Gate 2"): the species' looks, the emblems and the enemy card's row, as the owner approved them on 2026-11-06.
// ASKED: "We also need to make themes for the different species and give textures for the different species, and then icons for every different element and subclass and species." Each look was drawn first as a
// mockup in the real game page (design/ui-mocks/part2-looks-art.js) and approved one at a time; then "Start the Part 2 build".
//   THE TEXTURES   each species' texture is drawn, is the approved drawing byte for byte, faint, repeats no motif, and is the same on every load; the storm clouds are the high-resolution
//                  drawing of build 2026-11-06e (the owner: "Ew elemental, storm cloud texture please hi res", then "Approve as drawn"): crisp masses in flat fills, no soft gradient to blur or band
//   A SPECIES CARD wears its texture in its colour, its colour for its frame, chip, crystal and kind line, and its emblem before its kind (its face, its hologram's shadow, its details)
//   A FOLLOWER     an evolved form of a species carries its texture as a third layer at 38% over its element's and its class's: the crust at half its size, the others once, the storm clouds in the
//                  follower's element colour; an egg, a retired form and a clone none
//   THE EMBLEMS    seventeen (five species, six elements, six enemy races), each the approved drawing and colour; the roster's subclass tag carries the species' emblem in its colour; the element emblems are
//                  drawn and approved, and shown nowhere yet (where they go is not chosen: docs/OPEN-QUESTIONS.md)
//   THE ENEMY CARD the race's emblem before its name; under its numbers WEAK and RESISTS, read here from docs/COMBAT.md §7.3's own table, in the approved short words; a boss uses its race's
// The sandbox checks the tables, the pictures and the HTML; Chromium the real page on a tablet and a phone: each species card on the CARDS stage, a follower of each species on the roster and the squad bar,
// the enemy card for each race and a boss, every new picture loading.
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
async function check(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
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

const SPECIES = ['spinelegged', 'mollusk', 'elemental', 'drone', 'jelly'];   // (spinelegged: the Crustacean, renamed in build 2026-11-08h)
const COLOURS = { spinelegged: '#e7ad78', mollusk: '#e3d6ff', elemental: '#f2f7ff', drone: '#b6c4d6', jelly: '#e39cff' };   // CHITIN AMBER, NACRE, PRISM WHITE, GUNMETAL, GEL ORCHID (docs/UI-STYLE.md)
const RACES = ['ant', 'beetle', 'scorpion', 'spider', 'mantis', 'moth'];
const SHORT = { slashing: 'SLASH', piercing: 'PIERCE', projectile: 'SHOT', crushing: 'CRUSH', earthquake: 'QUAKE', elemental: 'ELEM' };   // approved: "Short words"
const CARDS = { spinelegged: 'tide_shell', mollusk: 'nacre_pearl', elemental: 'focusing_prism', drone: 'overclock_chip', jelly: 'gel_membrane' };   // the cards the mockups showed
const FORMS = [['quillstone', 'fire', 'brawler'], ['voidstar', 'flux', 'sniper'], ['maw', 'ice', 'brawler'], ['rimestar', 'ice', 'sniper'], ['jellyram', 'core', 'brawler']];   // a form of each species
const rgb = h => 'rgb(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';

// docs/COMBAT.md §7.3, the race table itself: { ant: { weak: [...], resist: [...] }, ... } in the damage system's words
function combatTable() {
    const doc = rd('docs/COMBAT.md'), sec = doc.split(/^### 7\.3 /m)[1].split(/^### /m)[0], out = {};
    for (const line of sec.split('\n')) {
        const m = line.match(/^\|\s*([A-Za-z]+)\s*\|([^|]*)\|([^|]*)\|\s*$/); if (!m || m[1] === 'Race') continue;
        const words = s => s.replace(/✦/g, '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
        out[m[1].toLowerCase()] = { weak: words(m[2]), resist: words(m[3]) };
    }
    return out;
}

// The real page in the facility (?cards=all): five followers, one evolved form of each species; the roster's card in view and the squad bar; each species card on the CARDS stage; the enemy card for each race and a boss.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var cls = function(el){ return el ? el.className : null; };
  var emb = function(el){ if (!el) return null; var b = getComputedStyle(el, '::before'); return { mask: ((b.webkitMaskImage || '') + (b.maskImage || '')).indexOf('data:image/svg+xml') >= 0, w: parseFloat(b.width) || 0, h: parseFloat(b.height) || 0, bg: b.backgroundColor, col: getComputedStyle(el).color }; };
  var load = function(url){ return new Promise(function(res){ var im = new Image(); im.onload = function(){ res([im.naturalWidth, im.naturalHeight]); }; im.onerror = function(){ res(null); }; im.src = url; }); };
  var FORMS = ${JSON.stringify(FORMS)}, CARDS = ${JSON.stringify(CARDS)}, RACES = ${JSON.stringify(RACES)};
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false; facilityBlackoutSet(false); if (typeof dialogueClear === 'function') dialogueClear();
    actors = actors.filter(function(a){ return !(a instanceof Predator); });
    shardCount = 5000; for (var i = followers.length; i < 5; i++) recruitFollower(); partyTick(); await wait(60);
    followers.slice(0, 5).forEach(function(f, i){ var m = FORMS[i]; f.evolved = m[0]; f.element = m[1]; f.role = m[2]; f.level = 12; _applyFollowerLevel(f, true); });
    partyTick(); partyBarRender(true); await wait(60);
    out.wide = innerWidth > 700;
    // THE SQUAD BAR: each member's backdrop, with its species
    out.bar = $$('#squadBar .sb-slot').filter(function(el){ return el._unit && el._unit.isFollower && !el._unit.isClone; }).map(function(el){ return { cls: cls(el), ev: el._unit.evolved, el: el._unit.element, role: el._unit.role }; });
    // THE ROSTER: a tablet's card in view for each follower (its subclass tag with the emblem, its backdrop); an egg and a retired form; a phone's roster cards
    ccOpen('roster'); await wait(250); out.car = !!ccCarousel(); out.roster = [];
    if (out.car) {
      for (var k = 0; k < 5; k++) { var f = followers[k]; _ccFocus = f; ccRender(); await wait(40); var sc = $('#ccFocus .cf-sc'), cf = $('#ccFocus .cf-card');
        out.roster.push({ ev: f.evolved, el: f.element, role: f.role, tag: cls(sc), text: sc && sc.textContent, shown: !!sc && getComputedStyle(sc).display !== 'none', emb: emb(sc), card: cls(cf), bg: !!cf && getComputedStyle(cf, '::before').backgroundImage.indexOf('data:image/svg+xml') >= 0 }); }
      var g = followers[0], ev0 = g.evolved; _ccFocus = g;
      g.evolved = undefined; ccRender(); await wait(40); out.egg = { card: cls($('#ccFocus .cf-card')), tag: cls($('#ccFocus .cf-sc')), shown: getComputedStyle($('#ccFocus .cf-sc')).display !== 'none' };
      g.evolved = 'bloom'; ccRender(); await wait(40); out.retired = { card: cls($('#ccFocus .cf-card')), tag: cls($('#ccFocus .cf-sc')), shown: getComputedStyle($('#ccFocus .cf-sc')).display !== 'none' };
      g.evolved = ev0; ccRender(); await wait(30);
    }
    ccClose(); await wait(30);
    if (!out.wide && typeof radialToggle === 'function') { radialToggle(true); radialPick('roster'); await wait(80); out.radial = $$('#radialPanel .rp-card:not(.rp-open)').map(function(el){ return (Array.prototype.slice.call(el.classList).filter(function(c){ return /^cat-f-/.test(c); })[0]) || ''; }); radialToggle(false); await wait(30); }
    // THE CARDS: each species card on the stage (its texture, colour, crystal, chip, emblem on its kind line, shadow and details; its mini card on the rail); an element card and a class card for contrast
    cardsOpen(); _cdView = 'all'; cardsRender(true); await wait(250); out.cards = []; out.others = [];
    var stageOf = async function(id){ var rail = $('#cardsRoot .cd-rail'); if (!rail) return null; _cdSel = null; _cdRailGo(rail, id, false); await wait(90); return $('#cardsRoot .cd-stage'); };
    for (var sp in CARDS) { var st = await stageOf(CARDS[sp]); if (!st) continue; var card = st.querySelector('.cd-card');
      out.cards.push({ sp: sp, id: CARDS[sp], name: (st.querySelector('.cd-name') || {}).textContent, col: card.style.getPropertyValue('--c'), tex: cls(st.querySelector('.cd-tex')), gem: cls(st.querySelector('.cd-gem')), chip: st.querySelector('.cd-face > .cd-chip').style.getPropertyValue('--c'),
        kind: cls(st.querySelector('.cd-kind')), gk: cls(st.querySelector('.cd-gk')), iv: cls(st.querySelector('.cd-irow.kd .cd-iv')), kindText: st.querySelector('.cd-kind').textContent, embKind: emb(st.querySelector('.cd-kind')), embGk: emb(st.querySelector('.cd-gk')), embIv: emb(st.querySelector('.cd-irow.kd .cd-iv')),
        mini: cls(document.querySelector('#cardsRoot .cd-mini[data-id="' + CARDS[sp] + '"] .cd-mtex')), texBg: getComputedStyle(st.querySelector('.cd-tex')).backgroundImage.indexOf('data:image/svg+xml') >= 0 }); }
    var other = Object.values(equipCards()).filter(function(c){ return c.kind === 'element'; })[0], cc = Object.values(equipCards()).filter(function(c){ return c.kind === 'class' && !c.aura; })[0], pc = Object.values(equipCards()).filter(function(c){ return c.kind === 'player'; })[0];
    for (var oc of [other, cc, pc]) { if (!oc) continue; var so = await stageOf(oc.id); if (!so) continue; out.others.push({ kind: oc.kind, k: cls(so.querySelector('.cd-kind')), gk: cls(so.querySelector('.cd-gk')), iv: cls(so.querySelector('.cd-irow.kd .cd-iv')), before: getComputedStyle(so.querySelector('.cd-kind'), '::before').content }); }
    cardsClose(); await wait(40);
    // THE ENEMY CARD: a creature of each race locked, then a boss (an ant, named)
    out.foes = []; var foeAt = async function(race, cl, boss){
      var a = spawnCreature({ species: race, className: cl, x: player.x + 2.5, y: player.y + 1, level: 3, state: 'idle' }); if (!a) return { race: race, err: 'no creature' };
      a.team = 'red'; a.health = a.maxHealth = 1e7; a.provoked = false; a.state = 'idle'; if (boss) a.bossName = boss;
      targetSet(a, true); mixToolRender(true); await wait(40);
      var cd = $('#mixTool .mt-foe'), nm = $('#mixTool .mt-foe-name'), row = $('#mixTool .mt-foe-dmg'), r = cd ? cd.getBoundingClientRect() : null, rr = row ? row.getBoundingClientRect() : null, w0 = $('#mixTool .mt-foe-dmg i.wk'), r0 = $('#mixTool .mt-foe-dmg i.rs');
      var o = { race: race, boss: !!boss, name: nm && nm.textContent, cls: cls(nm), emb: emb(nm), wk: $$('#mixTool .mt-foe-dmg i.wk').map(function(t){ return t.textContent; }), rs: $$('#mixTool .mt-foe-dmg i.rs').map(function(t){ return t.textContent; }), labels: $$('#mixTool .mt-foe-dmg b').map(function(t){ return t.textContent; }),
        rowIn: !!(r && rr) && rr.left >= r.left - 1 && rr.right <= r.right + 1 && rr.bottom <= r.bottom + 1, under: !!rr && !!$('#mixTool .mt-foe-num') && rr.top >= $('#mixTool .mt-foe-num').getBoundingClientRect().bottom - 1, onScreen: !!r && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        wkCol: w0 ? getComputedStyle(w0).color : null, rsCol: r0 ? getComputedStyle(r0).color : null, lines: rr ? Math.round(rr.height / 15) : 0 };
      a.dead = true; targetDrop(); mixToolRender(true); await wait(20); return o; };
    for (var ri = 0; ri < RACES.length; ri++) out.foes.push(await foeAt(RACES[ri], 'scout'));
    out.foes.push(await foeAt('ant', 'boss', 'THE TOXIC QUEEN'));
    // THE PICTURES: each species card face, a backdrop of each species, each emblem; the rules on the page
    var urls = [];
    ['spinelegged', 'mollusk', 'elemental', 'drone', 'jelly'].forEach(function(k){ urls.push(['c:' + k, cardArtUrl('c:' + k, function(){ return cardArtFaceSvg(k); })]); });
    FORMS.forEach(function(m){ var sp = EQUIP_FORM_SUBCLASS[m[0]], c = cardArtClassOfRole(m[2]); urls.push(['f:' + m[1] + ':' + c + ':' + sp, cardArtUrl('f:' + m[1] + ':' + c + ':' + sp, function(){ return cardArtMixSvg(m[1], c, sp); })]); });
    Object.keys(CARD_ART_EMBLEMS).forEach(function(k){ urls.push(['e:' + k, cardArtUrl('e:' + k, function(){ return cardArtEmblemSvg(k); })]); });
    out.images = []; for (var u = 0; u < urls.length; u++) out.images.push([urls[u][0], await load(urls[u][1])]);
    out.css = ($('#cardArtCss') || { textContent: '' }).textContent;
    out.errs = (window.__errs || []).slice(0, 4);
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__sa'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/"><script>window.__errs = []; window.addEventListener("error", function(e){ window.__errs.push(String(e.message)); });</script>').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=40000', '--dump-dom', 'file://' + file + '?cards=all'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__sa">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // the approved drawings, beside the game's own, to compare (the mockups' file: design/ui-mocks/part2-looks-art.js)
    try { vm.runInContext(rd('design/ui-mocks/part2-looks-art.js'), context, { filename: 'part2-looks-art.js' }); } catch (e) { console.log('  (the approved drawings did not load: ' + e.message + ')'); }
    run('globalThis.__P2 = typeof PART2 !== "undefined" ? PART2 : (typeof window !== "undefined" && window.PART2) || null;');
    // (the approved drawings name the Spine-legged's look by its old name, crustacean: build 2026-11-08h renamed the subclass in the game, not its drawings)
    run('if (globalThis.__P2) { const P = __P2, K = { spinelegged: "crustacean" }; for (const g of ["TEX", "THEMES", "ICONS"]) for (const k in K) if (P[g] && P[g][K[k]] && !P[g][k]) P[g][k] = P[g][K[k]]; const b3 = P.backdrop3; P.backdrop3 = (el, cls, sp, mode) => b3(el, cls, K[sp] || sp, mode); }');

    group('THE TEXTURES: one for each species, as approved');
    await check('the five species of the game (js/cards.js EQUIP_SUBCLASSES) each have a colour and a texture: CHITIN AMBER, NACRE, PRISM WHITE, GUNMETAL, GEL ORCHID (docs/UI-STYLE.md)', () => {
        same(J('CARD_ART_SPECIES').join(), J('EQUIP_SUBCLASSES.map(s => s.id)').join(), 'the species');
        same(JSON.stringify(J('CARD_ART.species')), JSON.stringify(COLOURS), 'the colours');
        for (const sp of SPECIES) { const t = J(`cardArtTexture(${JSON.stringify(sp)})`); ok(t.length > 3000, sp + ' has no drawing'); ok(/currentColor/.test(t), sp + ' is not in currentColor (its card\'s or its follower\'s colour would not reach it)'); ok(new RegExp('^(<defs>.*</defs>)?<g id="\\w+All">').test(t), sp + ' is not one group a band can lay again'); }
    });
    await check('each texture is the approved drawing, byte for byte (design/ui-mocks/part2-looks-art.js), and the same colour as approved', () => {
        ok(J('!!__P2'), 'the approved drawings are not loaded');
        for (const sp of SPECIES) { same(J(`cardArtTexture(${JSON.stringify(sp)}) === __P2.TEX[${JSON.stringify(sp)}]()`), true, sp + ' is not the approved drawing'); same(J(`__P2.THEMES[${JSON.stringify(sp)}].col`), COLOURS[sp], sp + '\'s approved colour'); }
    });
    await check('each draws what was approved: the crust\'s knobs, middle ones and granules; the nacre\'s eight bands and its growth lines; the storm\'s puffs, bases, dark masses and wisps; the drone\'s panels, rivets and vents; the jelly\'s cells and nuclei', () => {
        const t = sp => J(`cardArtTexture(${JSON.stringify(sp)})`), n = (s, re) => (s.match(re) || []).length;
        const cu = t('spinelegged'); ok(n(cu, /<circle/g) >= 500 && /url\(#cuK\)/.test(cu), 'the crust: ' + n(cu, /<circle/g) + ' circles');
        const mo = t('mollusk'); same(n(mo, /stroke="url\(#mo[ABC]\)"/g), 8, 'the nacre\'s bands'); ok(n(mo, /<path/g) >= 50, 'the nacre\'s growth lines');
        const el = t('elemental'); same(n(el, /<path id="clS\d+"/g), 9, 'the storm\'s masses'); same(n(el, /<path id="clF\d+"/g), 7, 'the folds inside them'); same(n(el, /<clipPath id="clB\d+"/g), 9, 'their flat bases');
        ok(n(el, / 0 1 0 /g) / 2 >= 500, 'the billows: ' + n(el, / 0 1 0 /g) / 2); same(n(el, /fill="#ffffff"/g), 14, 'the light rims along the near masses\' and folds\' tops'); same(n(el, /stroke-opacity="\.1"/g), 2, 'the rain shafts');
        const dr = t('drone'), plates = (dr.match(/ d="([^"]*)"/) || [])[1] || ''; ok(n(plates, /Z/g) >= 30, 'the drone\'s panels: ' + n(plates, /Z/g)); ok(n(dr, /<circle/g) >= 40, 'the drone\'s rivets'); ok(/stroke-width="2\.2"/.test(dr), 'the drone\'s vents');
        const je = t('jelly'); ok(n(je, /<path d="M/g) >= 100, 'the jelly\'s cells: ' + n(je, /<path d="M/g)); ok(n(je, /<ellipse/g) >= 30, 'the jelly\'s nuclei');
    });
    await check('faint (the owner: "The design needs to be fainter"): nothing in a species texture is drawn above half opacity', () => {
        for (const sp of SPECIES) { const vals = [...J(`cardArtTexture(${JSON.stringify(sp)})`).matchAll(/(?:fill-|stroke-|stop-)?opacity="([\d.]+)"/g)].map(m => +m[1]); ok(vals.length, sp + ' has no opacities'); ok(Math.max(...vals) <= 0.5, sp + ' is drawn at ' + Math.max(...vals)); }
    });
    await check('no motif repeated (the owner, of the clouds: "no repreating icons"): no species texture tiles a pattern or lays a drawing again across the face; only the storm clouds lay anything twice, each mass its own outline shifted for its shading', () => {
        for (const sp of SPECIES) { const t = J(`cardArtTexture(${JSON.stringify(sp)})`); ok(!/<pattern/.test(t), sp + ' tiles a pattern'); if (sp !== 'elemental') ok(!/<use/.test(t), sp + ' lays a drawing twice'); }
        const refs = (J('cardArtTexture("elemental")').match(/<use href="#[^"]+"/g) || []).map(u => u.slice(12, -1)); ok(refs.length > 20, 'the storm\'s shading');
        for (const r of refs) ok(/^cl[SF]\d+$/.test(r), 'the storm clouds lay ' + r + ' again, not a mass\'s own outline');
    });
    await check('in high resolution (the owner: "Ew elemental, storm cloud texture please hi res"; build 2026-11-06e): the storm clouds are crisp shapes in flat fills, with no soft gradient to blur or band', () => {
        ok(!/Gradient|<filter|blur/.test(J('cardArtTexture("elemental")')), 'a soft gradient or a blur in the storm clouds');
    });

    group('A SPECIES CARD (js/cardart.js cardArtFaceClass, js/cardsui.js _cdKindCol, _cdSlab, _cdInfo)');
    await check('its face is its texture on the 300 x 420 box in its colour, as the approved card; every species card of the game wears its species\'', () => {
        for (const sp of SPECIES) same(J(`cardArtFaceSvg(${JSON.stringify(sp)}) === _caDoc(300, 420, '<g color="' + __P2.THEMES[${JSON.stringify(sp)}].col + '">' + __P2.TEX[${JSON.stringify(sp)}]() + '</g>')`), true, sp + '\'s face is not the approved one');
        const cards = J('Object.values(EQUIP_CARDS).filter(c => c.kind === "subclass").map(c => [c.id, c.match, cardArtFaceClass(c)])'); ok(cards.length >= 20, 'species cards: ' + cards.length);
        for (const [id, sp, cl] of cards) same(cl, 'cat-c-' + sp, id);
    });
    await check('its colour is its species\' for its frame, its chip, its crystal and its kind line (the class cyan before); the class cards keep the cyan, a Player card its gold, an element card its element\'s', () => {
        for (const [id, sp, col, gem] of J('Object.values(EQUIP_CARDS).filter(c => c.kind === "subclass").map(c => [c.id, c.match, _cdKindCol(c), cardArtObjectClass(c, _cdKindCol(c))])')) { same(col, COLOURS[sp], id + '\'s colour'); same(gem, 'cag-' + COLOURS[sp].slice(1), id + '\'s crystal'); }
        same(J('_cdKindCol(Object.values(EQUIP_CARDS).find(c => c.kind === "class" && !c.aura))'), '#8fe3ff', 'a class card'); same(J('_cdKindCol({ kind: "player" })'), '#ffe733', 'a Player card'); same(J('_cdKindCol({ kind: "element", match: "fire" })'), J('ELEMENTS.find(e => e.id === "fire").color'), 'an element card');
    });
    await check('its emblem goes before its kind, in the kind line\'s colour: on its face, on its hologram\'s shadow (so the shadow stays under it) and in its details; an element, a class or a Player card has none (where the element emblems go is not chosen yet)', () => {
        for (const [id, sp, cl] of J('Object.values(EQUIP_CARDS).filter(c => c.kind === "subclass").map(c => [c.id, c.match, cardArtKindEmblemClass(c)])')) same(cl, 'cae-' + sp, id);
        for (const k of ['element', 'class', 'player']) same(J(`Object.values(EQUIP_CARDS).filter(c => c.kind === ${JSON.stringify(k)}).map(cardArtKindEmblemClass).filter(Boolean).length`), 0, 'a ' + k + ' card');
        const ui = rd('js/cardsui.js'); ok(/cardArtMark\(gk, emb, "emb"\); cardArtMark\(kd, emb, "emb"\)/.test(ui), '_cdSlab: the kind line and its shadow'); ok(/cardArtMark\(kd\.lastChild, emb, "emb"\)/.test(ui), '_cdInfo: the details');
    });

    group('A FOLLOWER\'S BACKDROP: the species\' layer (js/cardart.js cardArtUnitClass, cardArtMixSvg)');
    await check('an evolved form of a species carries its species\' layer (cat-f-<element>-<class>-<species>), for each of the eighteen forms; an egg, a retired form and a clone do not', () => {
        for (const [ev, sp] of Object.entries(J('EQUIP_FORM_SUBCLASS'))) same(J(`cardArtUnitClass({ isFollower: true, element: "fire", role: "brawler", evolved: ${JSON.stringify(ev)} })`), 'cat-f-fire-brawler-' + sp, ev);
        same(J('cardArtUnitClass({ isFollower: true, element: "ice", role: "sniper" })'), 'cat-f-ice-mage', 'an egg');
        same(J('cardArtUnitClass({ isFollower: true, element: "ice", role: "sniper", evolved: "bloom" })'), 'cat-f-ice-mage', 'a retired form (it has no species, js/cards.js)');
        same(J('cardArtUnitClass({ isFollower: true, isClone: true, element: "ice", role: "sniper", evolved: "maw" })'), '', 'a clone');
        same(J('[cardArtSpeciesOf({ evolved: "maw" }), cardArtSpeciesOf({ evolved: "bloom" }), cardArtSpeciesOf({}), cardArtSpeciesOf(null)].join()'), 'elemental,,,', 'cardArtSpeciesOf');
    });
    await check('the layer is as approved: over the element\'s and the class\'s (unchanged under it), at 38% in the species\' colour (the storm clouds in the follower\'s element colour), the crust at half its size (its drawing twice across), the others once at their own size', () => {
        same(J('CARD_ART.speciesAlpha'), 0.38, 'the layer\'s opacity');
        for (const [el, cls] of [['fire', 'brawler'], ['ice', 'mage'], ['core', 'technician']]) for (const sp of SPECIES) {
            const x = J(`cardArtMixSvg(${JSON.stringify(el)}, ${JSON.stringify(cls)}, ${JSON.stringify(sp)})`), two = J(`cardArtMixSvg(${JSON.stringify(el)}, ${JSON.stringify(cls)})`), col = sp === 'elemental' ? J(`cardArtElementColour(${JSON.stringify(el)})`) : COLOURS[sp];
            ok(x.indexOf(two.slice(0, -6)) === 0, el + ' ' + cls + ' ' + sp + ': the element and class layers changed');
            ok(x.indexOf(' color="' + col + '" opacity="0.38">') > 0, el + ' ' + cls + ' ' + sp + ': not in ' + col + ' at 38%');
            if (sp === 'spinelegged') ok(/viewBox="0 60 600 350"[^>]*>/.test(x) && x.indexOf('<use href="#cuAll" xlink:href="#cuAll" x="300"/>') > 0, 'the crust is not at half its size');
            else ok(/viewBox="0 60 300 175" preserveAspectRatio="xMidYMid slice" color=/.test(x) && !/<use href="#(moAll|clAll|drAll|jeAll)"/.test(x), sp + ' is not laid once at its own size');
        }
    });
    await check('every backdrop with a species is the approved one (design/ui-mocks/part2-looks-art.js backdrop3, "small"), for each element, class and species (90), bar 0.38 written for .38 and an xlink:href beside the href', () => {
        const bad = J(`(function(){ const out = []; for (const el of CARD_ART_ELEMENTS) for (const cls of CARD_ART_CLASSES) for (const sp of CARD_ART_SPECIES) {
            const col = sp === 'elemental' ? cardArtElementColour(el) : __P2.THEMES[sp].col, want = __P2.backdrop3(el, cls, sp, 'small').split('color="' + col + '" opacity=".38">').join('color="' + col + '" opacity="0.38">').replace(/<use href="#(\\w+)" x="300"/, '<use href="#$1" xlink:href="#$1" x="300"');
            if (cardArtMixSvg(el, cls, sp) !== want) out.push(el + ' ' + cls + ' ' + sp); } return out; })()`);
        same(bad.join(', '), '', 'not as approved');
    });

    group('THE EMBLEMS (js/cardart.js CARD_ART_EMBLEMS)');
    await check('eighteen: the five species\', the seven elements\' and the six enemy races\' (js/damage.js DMG_RACE), each the approved drawing in its approved colour; BLOOM\'s (build 2026-11-08i) is provisional, in its pink', () => {
        same(J('Object.keys(CARD_ART_EMBLEMS).sort().join()'), J('CARD_ART_SPECIES.concat(CARD_ART_ELEMENTS, CARD_ART_RACES).sort().join()'), 'the emblems'); same(J('Object.keys(CARD_ART_EMBLEMS)').length, 18, 'how many'); same(J('CARD_ART_EMBLEMS.blossom.col'), '#ff7ab8', 'BLOOM\'s colour');
        same(J('CARD_ART_RACES.slice().sort().join()'), J('Object.keys(DMG_RACE).sort().join()'), 'the races'); same(J('CARD_ART_ELEMENTS.slice().sort().join()'), J('ELEMENTS.map(e => e.id).sort().join()'), 'the elements');
        for (const k of J('Object.keys(CARD_ART_EMBLEMS)').filter(k => k !== 'blossom')) { same(J(`cardArtEmblemPath(${JSON.stringify(k)}) === __P2.ICONS[${JSON.stringify(k)}].d`), true, k + ' is not the approved drawing'); same(J(`CARD_ART_EMBLEMS[${JSON.stringify(k)}].col`), J(`__P2.ICONS[${JSON.stringify(k)}].col`), k + '\'s colour'); }
        for (const sp of SPECIES) same(J(`CARD_ART_EMBLEMS[${JSON.stringify(sp)}].col`), COLOURS[sp], sp + ' is not in its species\' colour'); for (const r of RACES) same(J(`CARD_ART_EMBLEMS[${JSON.stringify(r)}].col`), '#ff8a6a', r + ' is not in the enemy colour');
    });
    await check('each is one flat shape on a 32-unit square: one path, every number of it inside the square, in one colour (its cut-outs are wound against it, so the ordinary fill leaves them open)', () => {
        for (const k of J('Object.keys(CARD_ART_EMBLEMS)')) {
            const s = J(`cardArtEmblemSvg(${JSON.stringify(k)})`), nums = (J(`cardArtEmblemPath(${JSON.stringify(k)})`).match(/-?[\d.]+/g) || []).map(Number);
            ok(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 32 32" width="32" height="32"><path d="[^"]+" fill="#[0-9a-f]{6}"\/><\/svg>$/.test(s), k + ': ' + s.slice(0, 120)); ok(nums.length > 6 && Math.min(...nums) >= 0 && Math.max(...nums) <= 32, k + ' goes outside its square');
            same(J(`cardArtEmblemSvg(${JSON.stringify(k)}, "#123456").indexOf('fill="#123456"') > 0`), true, k + ' in another colour');
        }
        same(J('cardArtEmblemSvg("nothing") + cardArtEmblemPath("nothing")'), '', 'an emblem that is not');
    });
    await check('on the page an emblem is a class (cae-<key>) that sets its picture (--emb) and its own colour (--emc); the page\'s CSS lays the picture as a mask before the text, in the text\'s colour, and sizes it for the roster\'s tag (in the species\' colour) and the enemy card\'s name', () => {
        same(J('[cardArtEmblemClass("spinelegged"), cardArtEmblemClass("ant"), cardArtEmblemClass("fire"), cardArtEmblemClass("nothing")].join()'), 'cae-spinelegged,cae-ant,cae-fire,', 'the classes');
        same(J('[cardArtRaceEmblemClass({ speciesName: "moth" }), cardArtRaceEmblemClass({ speciesName: "crustacean" }), cardArtRaceEmblemClass({}), cardArtRaceEmblemClass(null)].join()'), 'cae-moth,,,', 'a creature\'s');
        const html = rd('game.html');
        ok(/:is\(\[class\^="cae-"\], \[class\*=" cae-"\]\)::before \{[^}]*background-color: currentColor;[^}]*-webkit-mask: var\(--emb\) center \/ contain no-repeat; mask: var\(--emb\) center \/ contain no-repeat;/.test(html), 'the emblem rule');
        ok(/#ccRoot\.carousel \.cf-sc::before \{[^}]*width: 14px;[^}]*background-color: var\(--emc, currentColor\)/.test(html), 'the roster tag\'s emblem'); ok(/#mixTool \.mt-foe-name::before \{ width: 16px; height: 16px;/.test(html), 'the enemy card\'s emblem');
        ok(/cardArtMark\(E\.sc, sc \? cardArtEmblemClass\(equipSubclassOf\(f\)\) : "", "emb"\)/.test(rd('js/commandcenter.js')), 'js/commandcenter.js: the roster\'s subclass tag');
    });

    group('THE ENEMY CARD\'S ROW (js/mixtool.js mixToolFoeRow, mixToolFoeHTML)');
    const table = combatTable();
    await check('docs/COMBAT.md §7.3\'s table is read: the six races, each weak to some types and resisting some, and the game\'s table (js/damage.js DMG_RACE) is the same', () => {
        same(Object.keys(table).sort().join(), RACES.slice().sort().join(), 'the races in the document'); for (const r of RACES) { ok(table[r].weak.length && table[r].resist.length, r + '\'s row'); same(JSON.stringify(J(`DMG_RACE.${r}`)), JSON.stringify(table[r]), r + ': the game and the document differ'); }
    });
    await check('each race\'s row is WEAK and its types in green chips, then RESISTS and its types in grey ones, as §7.3 has them and in the approved short words (SLASH, PIERCE, SHOT, CRUSH, QUAKE, ELEM)', () => {
        same(JSON.stringify(J('DMG_SHORT')), JSON.stringify(SHORT), 'the short words');
        for (const r of RACES) {
            const h = J(`(function(){ const a = spawnCreature({ species: ${JSON.stringify(r)}, className: "scout" }); const s = mixToolFoeRow(a); if (a) a.dead = true; return s; })()`);
            same(h, '<span class="mt-foe-dmg"><b class="wk">WEAK</b>' + table[r].weak.map(t => '<i class="wk">' + SHORT[t] + '</i>').join('') + '<b class="rs">RESISTS</b>' + table[r].resist.map(t => '<i class="rs">' + SHORT[t] + '</i>').join('') + '</span>', r);
        }
        same(J('mixToolFoeRow({ speciesName: "nothing" }) + mixToolFoeRow(null)'), '', 'a creature of no race');
    });
    await check('the card carries its race\'s emblem on its name and the row under its numbers, in its text column; a boss (the Toxic Queen, an ant: js/bosses.js) carries the ant\'s, as §7.3 says ("a boss uses its race\'s row")', () => {
        for (const [r, cl, boss] of RACES.map(r => [r, 'scout', null]).concat([['ant', 'boss', 'THE TOXIC QUEEN']])) {
            const h = J(`(function(){ const a = spawnCreature({ species: ${JSON.stringify(r)}, className: ${JSON.stringify(cl)} }); a.health = a.maxHealth = 50; ${boss ? 'a.bossName = ' + JSON.stringify(boss) + ';' : ''} const s = mixToolFoeHTML(a, [], false); a.dead = true; return s; })()`);
            ok(h.indexOf('<b class="mt-foe-name cae-' + r + '">' + (boss || (r.toUpperCase() + ' SCOUT')) + '</b>') > 0, r + (boss ? ' (the boss)' : '') + ': the name ' + (h.match(/<b class="mt-foe-name[^<]*<\/b>/) || [])[0]);
            ok(/<em class="mt-foe-num"><\/em><span class="mt-foe-dmg">.*<\/span><\/span><span class="mt-foe-go">/.test(h), r + ': the row is not under the numbers, in the text column');
            ok(h.indexOf('<i class="wk">' + SHORT[table[r].weak[0]] + '</i>') > 0, r + ': not its row');
        }
    });

    const bin = findChromium();
    for (const [w, h, label] of [[1180, 820, 'a tablet (1180 x 820)'], [390, 740, 'a phone (390 x 740)']]) {
        group('IN CHROMIUM: ' + label);
        if (!bin) { console.log('  skip (no Chromium)'); continue; }
        const T = measure(w, h);
        await check('it ran', () => { ok(T, 'no result'); ok(!T.err, T.err); same((T.errs || []).length, 0, 'page errors: ' + JSON.stringify(T.errs)); });
        if (!T || T.err) continue;
        await check('every new picture is one the browser can draw: the five species card faces (300 x 420), a backdrop of each species (300 x 175), the seventeen emblems (32 x 32); the emblems\' rules set their picture and their colour', () => {
            same(T.images.length, 5 + 5 + 18, 'pictures');
            for (const [k, s] of T.images) { ok(s && s[0] > 0, k + ' did not load'); same(s.join('x'), /^c:/.test(k) ? '300x420' : /^f:/.test(k) ? '300x175' : '32x32', k); }
            for (const sp of SPECIES) ok(new RegExp('\\.cae-' + sp + '\\{--emb:url\\("data:image/svg\\+xml,[^"]+"\\);--emc:' + COLOURS[sp] + '\\}').test(T.css), 'the rule for ' + sp + '\'s emblem');
        });
        await check('each species card on the CARDS stage wears its texture, its colour on its frame, its chip and its crystal, and its emblem before its kind on its face, its shadow and its details, in the kind line\'s colour; its mini card on the rail wears its texture; an element, a class and a Player card show no emblem', () => {
            same(T.cards.map(c => c.sp).join(), SPECIES.join(), 'the species cards shown');
            for (const c of T.cards) {
                same(c.tex, 'cd-tex cat-c-' + c.sp, c.id + '\'s texture'); ok(c.texBg, c.id + '\'s texture is not drawn'); same(c.col, COLOURS[c.sp], c.id + '\'s colour'); same(c.chip, COLOURS[c.sp], c.id + '\'s chip'); same(c.gem, 'cd-gem cag-' + COLOURS[c.sp].slice(1), c.id + '\'s crystal');
                same(c.kind, 'cd-kind cae-' + c.sp, c.id + '\'s kind line'); same(c.gk, 'cd-gk cae-' + c.sp, c.id + '\'s shadow'); same(c.iv, 'cd-iv cae-' + c.sp, c.id + '\'s details'); same(c.kindText, 'SUBCLASS · ' + (c.sp === 'spinelegged' ? 'SPINE-LEGGED' : c.sp.toUpperCase()), c.id + '\'s kind (the emblem adds no words)');
                for (const [where, e] of [['face', c.embKind], ['shadow', c.embGk], ['details', c.embIv]]) { ok(e && e.mask && e.w > 6 && e.h > 6, c.id + ': no emblem on its ' + where + ' ' + JSON.stringify(e)); same(e.bg, e.col, c.id + ': the emblem on its ' + where + ' is not in its text\'s colour'); }
                same(c.embKind.col, rgb(COLOURS[c.sp]), c.id + '\'s kind line is not in its colour'); same(c.mini, 'cd-mtex cat-c-' + c.sp, c.id + '\'s mini card');
            }
            same(T.others.map(o => o.kind).join(), 'element,class,player', 'the other cards shown'); for (const o of T.others) { same([o.k, o.gk, o.iv].join('|'), 'cd-kind|cd-gk|cd-iv', 'a ' + o.kind + ' card has an emblem'); same(o.before, 'none', 'a ' + o.kind + ' card\'s kind line draws something before it'); }
        });
        await check('each follower of a species wears its species\' layer on the squad bar' + (w > 900 ? ', and on the roster\'s card in view its subclass tag carries its emblem in the species\' colour; an egg and a retired form have neither' : '; a phone\'s roster cards wear it too'), () => {
            ok(T.bar.length >= 3, 'squad slots: ' + T.bar.length);
            for (const s of T.bar) { const f = FORMS.find(m => m[0] === s.ev); ok(f, 'a squad member of no form: ' + s.ev); ok((' ' + s.cls + ' ').indexOf(' cat-f-' + s.el + '-' + J(`cardArtClassOfRole(${JSON.stringify(s.role)})`) + '-' + J(`EQUIP_FORM_SUBCLASS[${JSON.stringify(s.ev)}]`) + ' ') >= 0, 'a squad slot: ' + s.cls); }
            if (w > 900) {
                same(T.car, true, 'the roster is not the carousel'); same(T.roster.length, 5, 'the followers in view');
                for (const r of T.roster) {
                    const sp = J(`EQUIP_FORM_SUBCLASS[${JSON.stringify(r.ev)}]`), cl = J(`cardArtClassOfRole(${JSON.stringify(r.role)})`);
                    same(r.tag, 'cf-sc cae-' + sp, r.ev + '\'s tag'); same(r.text, sp === 'spinelegged' ? 'SPINE-LEGGED' : sp.toUpperCase(), r.ev + '\'s tag\'s word'); same(r.shown, true, r.ev + '\'s tag is hidden');
                    ok(r.emb && r.emb.mask && Math.round(r.emb.w) === 14 && Math.round(r.emb.h) === 14, r.ev + '\'s emblem: ' + JSON.stringify(r.emb)); same(r.emb.bg, rgb(COLOURS[sp]), r.ev + '\'s emblem is not in its species\' colour');
                    ok((' ' + r.card + ' ').indexOf(' cat-f-' + r.el + '-' + cl + '-' + sp + ' ') >= 0 && r.bg, r.ev + '\'s card in view: ' + r.card);
                }
                same(T.egg.shown, false, 'an egg has a tag'); ok(!/cae-/.test(T.egg.tag || '') || !T.egg.shown, 'an egg\'s tag has an emblem'); ok(/cat-f-\w+-\w+(\s|$)/.test(T.egg.card) && !/cat-f-\w+-\w+-\w+/.test(T.egg.card), 'an egg\'s backdrop: ' + T.egg.card);
                same(T.retired.shown, false, 'a retired form has a tag'); ok(!/cat-f-\w+-\w+-\w+/.test(T.retired.card), 'a retired form has a species\' layer: ' + T.retired.card);
            } else if (T.radial) { ok(T.radial.length >= 5, 'a phone\'s roster cards: ' + T.radial.length); for (const sp of SPECIES) ok(T.radial.some(a => new RegExp('-' + sp + '$').test(a)), 'no phone roster card wears ' + sp + '\'s layer: ' + T.radial.join(' ')); }
        });
        await check('the enemy card for each race carries the race\'s emblem before its name, in the name\'s colour, and under its numbers WEAK and RESISTS with the race\'s types from §7.3 (green and grey), inside the card and on the screen; a boss carries the ant\'s', () => {
            same(T.foes.length, 7, 'the cards shown');
            for (const f of T.foes) {
                ok(!f.err, f.race + ': ' + f.err); same(f.cls, 'mt-foe-name cae-' + f.race, f.race + '\'s name'); ok(f.emb && f.emb.mask && Math.round(f.emb.w) === 16, f.race + '\'s emblem: ' + JSON.stringify(f.emb)); same(f.emb.bg, f.emb.col, f.race + '\'s emblem is not in its name\'s colour');
                if (f.boss) same(f.name, 'THE TOXIC QUEEN', 'the boss\'s name');
                same(f.labels.join(), 'WEAK,RESISTS', f.race + '\'s labels'); same(f.wk.join(), table[f.race].weak.map(t => SHORT[t]).join(), f.race + ' is weak to'); same(f.rs.join(), table[f.race].resist.map(t => SHORT[t]).join(), f.race + ' resists');
                same(f.wkCol, 'rgb(157, 255, 196)', f.race + '\'s WEAK chips are not green'); same(f.rsCol, 'rgb(169, 180, 204)', f.race + '\'s RESISTS chips are not grey');
                same(f.rowIn, true, f.race + '\'s row runs out of its card'); same(f.under, true, f.race + '\'s row is not under its numbers'); same(f.onScreen, true, f.race + '\'s card is off the screen');
            }
        });
    }

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
