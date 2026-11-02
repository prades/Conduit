// THE 3D CARDS AND THE FOLLOWERS' BACKDROPS (js/cardart.js, js/cardsui.js _cdSlab, js/commandcenter.js, js/party.js, js/squadfly.js, js/unitinfo.js, js/radialmenu.js, game.html "THE 3D CARDS").
// ASKED (the owner, 2026-11-01, on the design canvas "Conduit 3D card concepts"): "a cooler looking card system that has actual cards that look 3D ... the card itself is kind of like tilted a little bit on an axis ... the text
// might be a raised hologram, but all the stuff from the concept should still show like the rarity chips and the slanted style, italicized, bold"; a subtle texture for each element under a gradient; "change the ice texture a
// lot ... more like the mage texture", "the electric texture should be switched with the technician texture"; "the backgrounds for the creature or the follower evolutions and followers in general have this background as
// well ... mixed. So we have the fire and the brawler background mixed together"; then "Make an update to implement this style".
// The sandbox checks the tables and the pictures (every element and class has a texture, ids that never clash in a mix, the class textures in currentColor so a tint reaches them, the same drawing on every load, the
// crystal's four faces and the cube's three), and which class each card and each follower gets. Chromium checks the real page: the cards' parts and states, a tilt with no 3D edge to go wrong, buttons a tap reaches,
// every picture an image the browser can draw, and the backdrop on each follower card (the roster's strip, the card in view, the squad's slots, the card on the fly, the INFO, a phone's roster).
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

// The real page in the facility: six followers of six element and class mixes (three in the squad, two evolved), the roster, the squad's slots, the card on the fly, the INFO; then the CARDS screen with every card (?cards=all).
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var art = function(el){ return el ? (Array.prototype.slice.call(el.classList).filter(function(c){ return /^ca[tgc]-/.test(c); }).join(' ')) : null; };
  var tex = function(el){ return el ? getComputedStyle(el).getPropertyValue('--tex').trim().slice(0, 30) : ''; };
  var want = function(f){ return 'cat-f-' + f.element + '-' + ({ brawler: 'brawler', sniper: 'mage', camper: 'technician', hybrid: 'brawler' })[f.role]; };
  var hit = function(el){ var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
  var load = function(url){ return new Promise(function(res){ var im = new Image(); im.onload = function(){ res([im.naturalWidth, im.naturalHeight]); }; im.onerror = function(){ res(null); }; im.src = url; }); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false; facilityBlackoutSet(false); if (typeof dialogueClear === 'function') dialogueClear();
    shardCount = 5000; for (var i = followers.length; i < 6; i++) recruitFollower(); partyTick(); await wait(60);
    var mixes = [['fire', 'brawler', 'quillstone'], ['ice', 'sniper', null], ['core', 'camper', 'hammerslug'], ['toxic', 'hybrid', null], ['flux', 'sniper', null], ['electric', 'camper', 'hovershell']];
    followers.slice(0, 6).forEach(function(f, i){ var m = mixes[i]; f.element = m[0]; f.role = m[1]; f.evolved = m[2] || undefined; if (m[2]) f.level = 12; _applyFollowerLevel(f, true); });
    partyTick(); partyBarRender(true); await wait(60);
    out.size = { w: innerWidth, corners: hudCorners() };
    // THE SQUAD'S SLOTS on the bar: each member's mix, an open slot none
    out.bar = $$('#squadBar .sb-slot').map(function(el){ return { art: art(el), want: el._unit ? want(el._unit) : '', open: el.classList.contains('empty'), tex: tex(el) }; });
    // THE CARD ON THE FLY (a tablet's corners)
    if (hudCorners()) { $$('#squadBar .sb-slot')[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); partyTick(); partyBarRender(true); await wait(60); var fc = $('#squadFly .sf-card'); out.fly = { art: art(fc), want: _sfEls && _sfEls.subject ? want(_sfEls.subject) : '', tex: tex(fc) }; }
    selectedUnits.clear(); partyTick();
    // THE ROSTER: the strip (or a phone's grid), the card in view, the squad box; a re-roll to another element swaps the backdrop
    ccOpen('roster'); await wait(250); var car = ccCarousel(); if (car) { _ccFocus = followers[2]; } ccRender(); await wait(60);
    out.roster = { car: car, cards: $$('#ccGrid .cc-card:not(.cc-rtile)').map(function(el){ return { art: art(el), want: el._unit ? want(el._unit) : '', before: car ? getComputedStyle(el, '::before').backgroundImage.indexOf('data:image/svg+xml') >= 0 : getComputedStyle(el).backgroundImage.indexOf('data:image/svg+xml') >= 0 }; }),
      box: $$('#ccSquadBox .sb-slot').map(function(el){ return { art: art(el), want: el._unit ? want(el._unit) : '' }; }) };
    if (car) { var cf = $('#ccFocus .cf-card'), ca = $('#ccFocus .cf-art'); out.focus = { art: art(cf), want: want(followers[2]), cardBg: getComputedStyle(cf, '::before').backgroundImage.indexOf('data:image/svg+xml') >= 0, artBg: getComputedStyle(ca).backgroundImage.indexOf('data:image/svg+xml') >= 0 }; }
    var f0 = followers[0]; f0.element = 'toxic'; ccRender(); await wait(60); var c0 = $$('#ccGrid .cc-card').filter(function(el){ return el._unit === f0; })[0];
    out.reroll = { art: art(c0), want: want(f0), wasGone: !!c0 && !c0.classList.contains('cat-f-fire-brawler') }; f0.element = 'fire'; ccRender(); await wait(30);
    ccClose(); await wait(30);
    // THE INFO: a follower's picture on its backdrop; a clone's has none
    unitInfoOpen(followers[1]); await wait(60); var ua = $('#unitInfo .ui-art'); out.info = { art: art(ua), want: want(followers[1]), framed: getComputedStyle(ua).borderTopWidth, bg: getComputedStyle(ua).backgroundImage.indexOf('data:image/svg+xml') >= 0 }; unitInfoClose();
    // A PHONE's roster (its radial menu's cards)
    if (!hudCorners() && typeof radialToggle === 'function') { radialToggle(true); radialPick('roster'); await wait(80); out.radial = $$('#radialPanel .rp-card:not(.rp-open)').slice(0, 6).map(function(el){ return art(el); }); radialToggle(false); }
    // THE CARDS SCREEN (?cards=all: every card, the test cards with them, all in the hand); a pack's cards (found) and the market's shelf are on it too
    equipFound = []; equipCredits = 0; equipPackLast = null; for (var s = 1; s < 30 && !(equipPackLast && equipPackLast.dupes.length); s++) equipPackOpen(s); equipShelfDeal(3); cardsOpen(); await wait(300);
    // the cards on the sheet (build l): the CARDS menu's stage, shown for one card of each kind picked on the rail; the SHOP's (the last pack under its box, the shelf); a pack's reveal
    var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
    var measureCards = function(sel){ return $$(sel || '#cardsRoot .cd-card:not(.cd-empty)').map(measureCard); }, pickMini = async function(n){ var m = $$('#cardsRoot .cd-rail .cd-mini').filter(function(x){ return x.querySelector('.cd-mn').textContent === n; })[0]; if (m) { click(m); await wait(60); } return !!m; };
    var measureCard = function(el){
      var nm = el.querySelector('.cd-name'), c = Object.values(equipCards()).filter(function(x){ return nm && x.name === nm.textContent; })[0], face = el.querySelector('.cd-art > .cd-slab > .cd-face'), t = el.querySelector('.cd-tex'), g = el.querySelector('.cd-gem'), chip = el.querySelector('.cd-face > .cd-chip'), ar = el.querySelector('.cd-art').getBoundingClientRect(), cr = chip ? chip.getBoundingClientRect() : null;
      return { name: nm && nm.textContent, kind: c ? c.kind : null, match: c ? c.match : null, aura: c && c.aura ? c.aura.el : null, face: !!face, parts: ['.cd-tex', '.cd-frame', '.cd-top .cd-rar', '.cd-glow', '.cd-shadow', '.cd-gem', '.cd-holo.ghost', '.cd-holo:not(.ghost)', '.cd-emit.l', '.cd-emit.r', '.cd-back'].filter(function(s){ return !el.querySelector(s); }),
        names: el.querySelectorAll('.cd-name').length, kinds: el.querySelectorAll('.cd-kind').length, texts: el.querySelectorAll('.cd-text').length, chips: el.querySelectorAll('.cd-chip').length, ghost: (el.querySelector('.cd-holo.ghost .cd-gn') || {}).textContent, ghostHidden: (el.querySelector('.cd-holo.ghost') || { getAttribute: function(){ return null; } }).getAttribute('aria-hidden'),
        tex: art(t), gem: art(g), state: (el.querySelector('.cd-state') || {}).textContent || '', cls: el.className, chipAt: cr ? [Math.round((cr.left + cr.width / 2 - ar.left) / ar.width * 100), Math.round((cr.top + cr.height / 2 - ar.top) / ar.height * 100)] : null,
        btns: Array.prototype.slice.call(el.closest('.cd-stage') ? document.querySelectorAll('#cardsRoot .cd-info .cd-btn') : el.querySelectorAll(':scope > .cd-btn')).map(function(b){ b.scrollIntoView({ block: 'center' }); return hit(b); }) };   // (the collection's card on its stage has its buttons beside it, with its labels)
    };
    out.cards = measureCards();   // the stage's card as the sheet opens (the rarest first: a Crystalline CLASS card)
    var picks = ['TEST · PLAYER A', 'TEST · CRUSTACEAN', 'EMBER PLATING', 'KINDLING BAND']; out.picked = [];   // a PLAYER, a SUBCLASS, an ELEMENT card and a Mage's AURA (a class card), each on the stage
    for (var pi = 0; pi < picks.length; pi++) { if (await pickMini(picks[pi])) { out.picked.push(picks[pi]); out.cards = out.cards.concat(measureCards()); } }
    var sl = $('#cardsRoot .cd-slab'), sa = $('#cardsRoot .cd-art');
    out.tilt = { transform: getComputedStyle(sl).transform.slice(0, 9), style: getComputedStyle(sl).transformStyle, perspective: getComputedStyle(sa).perspective, sides: $$('#cardsRoot .cd-side').length };
    var body = $('#cardsRoot .cd-body'); out.overflow = { sw: body.scrollWidth, cw: body.clientWidth };
    click($$('#cardsRoot .cd-tab').filter(function(b){ return b.textContent.indexOf('SHOP') === 0; })[0]); await wait(200);
    out.shopCards = measureCards().length; out.cards = out.cards.concat(measureCards()); body = $('#cardsRoot .cd-body'); out.overflowShop = { sw: body.scrollWidth, cw: body.clientWidth };
    _cdReveal = { pack: equipPackLast.pack, ids: equipPackLast.ids.slice(), fresh: equipPackLast.fresh.slice() }; cardsRender(true); await wait(200);   // a pack's reveal: its cards are cards too
    var rc = measureCards('#cardsRoot .cr-overlay .cd-card'); out.revealCards = rc.length; out.cards = out.cards.concat(rc); _cdReveal = null; cardsRender(true); await wait(60);
    // every picture is one the browser can draw (the nine card faces, the eighteen backdrops, the crystal in each colour and the cube)
    var urls = []; ['fire', 'electric', 'ice', 'flux', 'core', 'toxic', 'brawler', 'mage', 'technician'].forEach(function(k){ urls.push(['c:' + k, cardArtUrl('c:' + k, function(){ return cardArtFaceSvg(k); })]); });
    ['fire', 'electric', 'ice', 'flux', 'core', 'toxic'].forEach(function(e){ ['brawler', 'mage', 'technician'].forEach(function(c){ urls.push(['f:' + e + ':' + c, cardArtUrl('f:' + e + ':' + c, function(){ return cardArtMixSvg(e, c); })]); }); urls.push(['gem:' + e, 'data:image/svg+xml,' + encodeURIComponent(cardArtGemSvg(cardArtElementColour(e)))]); });
    urls.push(['cube', 'data:image/svg+xml,' + encodeURIComponent(cardArtCubeSvg('#8fe3ff'))]);
    out.css = { sheet: !!$('#cardArtCss'), rules: ($('#cardArtCss') || { textContent: '' }).textContent.split('\\n').filter(Boolean).length };   // (by now the roster and the CARDS screen have asked for theirs)
    out.images = []; for (var u = 0; u < urls.length; u++) out.images.push([urls[u][0], await load(urls[u][1])]);
    out.errs = (window.__errs || []).slice(0, 4);
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__ca'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/"><script>window.__errs = []; window.addEventListener("error", function(e){ window.__errs.push(String(e.message)); });</script>').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=40000', '--dump-dom', 'file://' + file + '?cards=all'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000 }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ca">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE TEXTURES: one for each element and each class, drawn the same on every load');
    await check('every element of the game has a texture, and every class (a follower\'s role) has one: brawler impact cracks, mage facets, technician circuit traces', () => {
        same(J('CARD_ART_ELEMENTS.slice().sort().join()'), J('ELEMENTS.map(e => e.id).sort().join()'), 'the elements');
        same(J('CARD_ART_CLASSES.join()'), 'brawler,mage,technician', 'the classes');
        for (const k of J('CARD_ART_ELEMENTS.concat(CARD_ART_CLASSES)')) ok(J(`cardArtTexture(${JSON.stringify(k)}).length`) > 300, k + ' has no drawing');
        same(J('[cardArtClassOfRole("brawler"), cardArtClassOfRole("sniper"), cardArtClassOfRole("camper"), cardArtClassOfRole("hybrid"), cardArtClassOfRole("boss")].join()'), 'brawler,mage,technician,brawler,', 'a role\'s class (sniper is the MAGE, camper the TECHNICIAN, a hybrid a brawler)');
        for (const r of J('FOLLOWER_TYPE_ORDER')) ok(J(`cardArtClassOfRole(${JSON.stringify(r)})`), 'the follower type ' + r + ' has no class texture');
    });
    await check('the textures the owner named are what they draw: fire flames (paths with the flame gradients), toxic bubbles (circles), flux a vortex (spiral paths), core hexagons (a hex pattern), ice cut ice (many triangles with glints), electric lightning (polylines), and the classes', () => {
        const t = k => J(`cardArtTexture(${JSON.stringify(k)})`);
        ok(/url\(#fgR\)/.test(t('fire')) && (t('fire').match(/<path d="M/g) || []).length >= 30, 'fire is not flames');
        ok((t('toxic').match(/<circle/g) || []).length >= 30, 'toxic is not bubbles');
        ok(/id="caVa0"/.test(t('flux')) && /<use href="#caVa1"/.test(t('flux')), 'flux is not a vortex');
        ok(/<pattern id="hexp"/.test(t('core')), 'core is not hexagons');
        ok((t('ice').match(/<polygon/g) || []).length >= 100 && /M0 -8L1\.2/.test(t('ice')), 'ice is not cut ice with glints');
        ok((t('electric').match(/<polyline/g) || []).length >= 7, 'electric is not lightning');
        ok((t('brawler').match(/<polyline/g) || []).length >= 9 && /filter="url\(#bb4\)"/.test(t('brawler')), 'the brawler is not an impact');
        ok((t('mage').match(/<polygon/g) || []).length === 15, 'the mage is not facets');
        ok((t('technician').match(/<use href="#caTr"/g) || []).length === 30, 'the technician is not circuit traces');
    });
    await check('the class textures are drawn in currentColor only, so a follower\'s tint (or a class card\'s colour) reaches every line of them', () => {
        for (const k of ['brawler', 'mage', 'technician']) { const t = J(`cardArtTexture(${JSON.stringify(k)})`); ok(/currentColor/.test(t), k + ' has no currentColor'); ok(!/#[0-9a-f]{3,6}\b/i.test(t.replace(/href="#\w+"|url\(#\w+\)/g, '')), k + ' has a colour of its own: ' + (t.match(/#[0-9a-f]{3,6}\b/i) || [])[0]); }
    });
    await check('no two textures use the same id, so any element\'s and any class\'s share a document (a follower\'s backdrop) without one taking the other\'s gradient or pattern', () => {
        const seen = {};
        for (const k of J('CARD_ART_ELEMENTS.concat(CARD_ART_CLASSES)')) for (const m of J(`cardArtTexture(${JSON.stringify(k)})`).match(/id="[^"]+"/g) || []) { ok(!seen[m] || seen[m] === k, m + ' is in ' + seen[m] + ' and ' + k); seen[m] = k; }
        ok(Object.keys(seen).length >= 15, 'too few ids: ' + Object.keys(seen).length);
    });
    await check('the same drawing on every load: the seeded textures come out the same when drawn again', () => {
        const a = J('CARD_ART_ELEMENTS.concat(CARD_ART_CLASSES).map(cardArtTexture)');
        run('for (const k in _caTexMemo) delete _caTexMemo[k];');
        same(J('CARD_ART_ELEMENTS.concat(CARD_ART_CLASSES).map(cardArtTexture)').join('|'), a.join('|'), 'a second drawing');
    });

    group('THE PICTURES: an equip card\'s face, a follower\'s backdrop, the crystal and the cube');
    await check('an equip card\'s face is its texture on the 300 x 420 box (a class card\'s in the class colour); a follower\'s backdrop is a 300 x 175 band of its element\'s texture with its class\'s over it, in the element\'s colour taken half way to white, at 80%', () => {
        const f = J('cardArtFaceSvg("fire")'), m = J('cardArtFaceSvg("mage")'), x = J('cardArtMixSvg("ice", "brawler")');
        ok(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* width="300" height="420" viewBox="0 0 300 420"/.test(f), 'the face box: ' + f.slice(0, 160));
        ok(m.indexOf('<g color="' + J('CARD_ART.classCol') + '">') > 0, 'a class card\'s texture is not in the class colour');
        ok(/width="300" height="175" viewBox="0 0 300 175"/.test(x), 'the backdrop band: ' + x.slice(0, 200));
        ok(x.indexOf('viewBox="0 ' + J('CARD_ART.band.ice') + ' 300 175"') > 0 && x.indexOf('viewBox="0 ' + J('CARD_ART.band.brawler') + ' 300 175"') > 0, 'each layer is not cropped to its band');
        const tint = J('cardArtMix(cardArtElementColour("ice"), "#ffffff", CARD_ART.tint)');
        ok(x.indexOf('color="' + tint + '" opacity="' + J('CARD_ART.tintAlpha') + '"') > 0, 'the class layer is not ' + tint + ' at ' + J('CARD_ART.tintAlpha'));
        same(J('[CARD_ART.tint, CARD_ART.tintAlpha]').join(), '0.5,0.8', 'the tint');
        same(J('cardArtMixSvg("ice", "nothing")'), '', 'a mix with no class'); same(J('cardArtFaceSvg("plasma")'), '', 'a face with no texture');
    });
    await check('the crystal is an octahedron with four faces toward you, the cube three (its top, its front and its left), each drawn at three quarters of the canvas\'s size round its middle', () => {
        const g = J('cardArtGemSvg("#ff3300")'), c = J('cardArtCubeSvg("#8fe3ff")');
        same((g.match(/<polygon/g) || []).length, 4, 'the crystal\'s faces'); same((c.match(/<polygon/g) || []).length, 3, 'the cube\'s faces');
        for (const s of [g, c]) { const m = s.match(/width="([\d.]+)" height="([\d.]+)" viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/); ok(m, 'no box'); ok(Math.abs(+m[3] + +m[5] / 2) < 0.2 && Math.abs(+m[4] + +m[6] / 2) < 0.2, 'not round its middle: ' + m[0]); ok(Math.abs(+m[1] - +m[5] * 0.75) < 0.2 && Math.abs(+m[2] - +m[6] * 0.75) < 0.2, 'not at three quarters: ' + m[0]); }
        same(J('CARD_ART.objScale'), 0.75, 'the scale');
    });

    group('WHO WEARS WHAT: the classes on the page');
    await check('an ELEMENT card wears its element\'s texture and the crystal in its colour; a CLASS card its class\'s texture and the cube (a Mage\'s aura, the cube in its element\'s colour); a Player or a Subclass card no texture (none was designed), the crystal in its colour', () => {
        same(J('cardArtFaceClass({ kind: "element", match: "fire" })'), 'cat-c-fire', 'an element card');
        same(J('cardArtFaceClass({ kind: "class", match: "sniper" })'), 'cat-c-mage', 'a mage card'); same(J('cardArtFaceClass({ kind: "class", match: "camper" })'), 'cat-c-technician', 'a technician card'); same(J('cardArtFaceClass({ kind: "class", match: "brawler" })'), 'cat-c-brawler', 'a brawler card');
        same(J('cardArtFaceClass({ kind: "player" })'), '', 'a Player card'); same(J('cardArtFaceClass({ kind: "subclass", match: "drone" })'), '', 'a subclass card'); same(J('cardArtFaceClass(null)'), '', 'no card');
        same(J('cardArtObjectClass({ kind: "class" }, "#8fe3ff")'), 'cac-8fe3ff', 'a class card\'s cube'); same(J('cardArtFaceClass(EQUIP_CARDS.winter_crown) + "|" + cardArtObjectClass(EQUIP_CARDS.winter_crown, _cdKindCol(EQUIP_CARDS.winter_crown)) + "|" + _cdKindCol(EQUIP_CARDS.pressure_spur) + "|" + _cdKindCol({ kind: "player" })'), 'cat-c-mage|cac-99ddff|#8fe3ff|#ffe733', 'an ice aura (the Mage\'s texture, the cube in ice), an opportunity card (cyan), a Player card (gold)'); same(J('cardArtObjectClass({ kind: "element" }, "#ff3300")'), 'cag-ff3300', 'an element card\'s crystal');
        for (const c of J('Object.values(EQUIP_CARDS).map(c => [c.id, c.kind, c.match])')) if (c[1] === 'element' || c[1] === 'class') ok(J(`cardArtFaceClass(EQUIP_CARDS[${JSON.stringify(c[0])}])`), c[0] + ' has no texture');
    });
    await check('a follower wears its element\'s texture under its class\'s (a hybrid a brawler\'s); a clone, something that is not a follower, or one with no element or role, none', () => {
        same(J('cardArtUnitClass({ isFollower: true, element: "fire", role: "brawler" })'), 'cat-f-fire-brawler', 'a fire brawler');
        same(J('cardArtUnitClass({ isFollower: true, element: "ice", role: "sniper" })'), 'cat-f-ice-mage', 'an ice mage');
        same(J('cardArtUnitClass({ isFollower: true, element: "core", role: "camper" })'), 'cat-f-core-technician', 'a core technician');
        same(J('cardArtUnitClass({ isFollower: true, element: "toxic", role: "hybrid" })'), 'cat-f-toxic-brawler', 'a hybrid');
        same(J('cardArtUnitClass({ isFollower: true, isClone: true, element: "ice", role: "sniper" })'), '', 'a clone'); same(J('cardArtUnitClass({ element: "ice", role: "sniper" })'), '', 'not a follower');
        same(J('cardArtUnitClass({ isFollower: true, element: "plasma", role: "sniper" })'), '', 'no such element'); same(J('cardArtUnitClass({ isFollower: true, element: "ice" })'), '', 'no role');
        for (const e of J('CARD_ART_ELEMENTS')) for (const r of ['brawler', 'sniper', 'camper']) ok(J(`cardArtUnitClass({ isFollower: true, element: ${JSON.stringify(e)}, role: ${JSON.stringify(r)} })`), e + ' ' + r);
    });
    await check('a card updated in place swaps its art class only when it changes (the old one off, the new one on), one per slot, and "" takes it off', () => {
        run(`globalThis.__el = { _log: [], classList: { add(c) { __el._log.push('+' + c); }, remove(c) { __el._log.push('-' + c); } } };
            cardArtMark(__el, 'cat-f-fire-brawler'); cardArtMark(__el, 'cat-f-fire-brawler'); cardArtMark(__el, 'cag-ff3300', 'gem'); cardArtMark(__el, 'cat-f-ice-mage'); cardArtMark(__el, '');`);
        same(J('__el._log').join(' '), '+cat-f-fire-brawler +cag-ff3300 -cat-f-fire-brawler +cat-f-ice-mage -cat-f-ice-mage', 'the swaps');
        run('cardArtMark(null, "x"); cardArtMark({}, "x");');   // (nothing to mark: no error)
    });
    await check('the data: URLs are made once each and carry the SVG escaped (a quote in one would end the CSS url())', () => {
        const u = J('cardArtUrl("c:fire", () => cardArtFaceSvg("fire"))');
        ok(u.indexOf('data:image/svg+xml,') === 0 && u.indexOf('"') < 0 && u.indexOf('%3Csvg') > 0, 'the url: ' + u.slice(0, 60));
        same(J('cardArtUrl("c:fire", () => "")'), u, 'made again');
    });

    group('THE CARD ITEMS (js/cardart.js CARD_ITEMS; design/cards: each card\'s own 3D object in place of the crystal; EMBER PLATING approved in build 2026-11-01j, Pack 1\'s other seventeen baked in build k and approved in build n: "Yes push the card art for everyone")');
    await check('each item is approved on its own, and all of Pack 1\'s eighteen are: each shows its baked picture without any flag; a baked piece not approved would show only with ?cardart=items (none is waiting now); a card with none baked keeps its crystal, flag or not (docs/ART-PROCESS.md)', () => {
        const url = id => 'img/cards/' + id + '.png?v=' + J('BUILD_VERSION'), ids = J('CARD_ITEMS.ids');
        same(J('CARD_ITEMS.approved.slice().sort().join()'), ids.slice().sort().join(), 'what is approved: all eighteen'); ok(J('CARD_ITEMS.approved.every(function(id){ return CARD_ITEMS.ids.indexOf(id) >= 0; })'), 'an approved item that is not baked');
        same(J('CARD_ITEMS.ids.slice().sort().join()'), J('Object.values(EQUIP_CARDS).filter(function(c){ return c.pack === "pack1"; }).map(function(c){ return c.id; }).sort().join()'), 'the baked items are Pack 1\'s eighteen');
        same(J('CARD_ITEMS.ids.filter(function(id){ return CARD_ITEMS.approved.indexOf(id) < 0; })').length, 0, 'on preview');
        same(JSON.stringify(J(JSON.stringify(ids) + '.map(function(id){ return cardArtItemUrl(EQUIP_CARDS[id]); })')), JSON.stringify(ids.map(url)), 'without a flag: every approved piece');
        same(J('cardArtItemUrl(EQUIP_CARDS.tide_shell)'), '', 'a Series 2 card (none baked yet)');
        run("CARD_ITEMS.approved = CARD_ITEMS.approved.filter(function(id){ return id !== 'venom_gland'; })");   // (the preview's rule, with one piece taken off the approved list for the moment)
        same(J('cardArtItemUrl(EQUIP_CARDS.venom_gland)'), '', 'a piece not approved shows without the flag');
        run("location.search = '?cardart=items'");
        same(J('[cardArtItemUrl(EQUIP_CARDS.venom_gland), cardArtItemUrl(EQUIP_CARDS.ember_plating), cardArtItemUrl(EQUIP_CARDS.tide_shell)]').join('|'), url('venom_gland') + '|' + url('ember_plating') + '|', 'with the flag: the piece not approved, the approved ones still on, an unbaked card still its crystal');
        run("location.search = ''; CARD_ITEMS.approved.push('venom_gland')");
    });
    await check('every item on the list has its model (design/cards/models/<id>.js, registering ITEMS.<id>) and its baked picture (img/cards/<id>.png, a PNG), and is a real card', () => {
        for (const id of J('CARD_ITEMS.ids')) {
            ok(J('!!EQUIP_CARDS[' + JSON.stringify(id) + ']'), id + ' is not a card'); const model = path.join(ROOT, 'design', 'cards', 'models', id + '.js'), png = path.join(ROOT, 'img', 'cards', id + '.png');
            ok(fs.existsSync(model) && new RegExp('ITEMS\\.' + id + ' = ').test(fs.readFileSync(model, 'utf8')), id + ': no model'); ok(fs.existsSync(png) && fs.readFileSync(png).slice(1, 4).toString() === 'PNG', id + ': no picture');
        }
    });
    await check('on a card the item takes the crystal\'s place, stands in front of the tilted card and rises past its top, hovering; on the collection\'s stage it is blown up', () => {
        const html = rd('game.html'), ui = rd('js/cardsui.js');
        ok(/#cardsRoot \.cd-card\.itemed \.cd-gem \{ display: none; \}/.test(html), 'the crystal stays under the item'); ok(/#cardsRoot \.cd-item \{[^}]*top: -16px[^}]*animation: cdHover/.test(html), 'the item does not rise past the top (16 px since build l: it was too big), hovering');
        ok(/#cardsRoot \.cd-stage \.cd-item \{[^}]*cdBlowItem/.test(html), 'the stage does not blow it up'); ok(/cardArtItemUrl\(c\)/.test(ui) && /"cd-item"/.test(ui), 'the card does not ask for its item');
    });

    group('THE PAGE');
    await check('game.html loads js/cardart.js after js/cards.js and before the screens that use it, the boot check knows it, and the cards\' CSS has the tilt, the texture under a veil, the hologram and its shadow, and the backdrops on every follower card', () => {
        const html = rd('game.html'), order = scriptOrder();
        ok(order.indexOf('js/cardart.js') > order.indexOf('js/cards.js') && order.indexOf('js/cardart.js') < order.indexOf('js/cardsui.js') && order.indexOf('js/cardart.js') < order.indexOf('js/commandcenter.js') && order.indexOf('js/cardart.js') < order.indexOf('js/party.js'), 'the order');
        ok(/"js\/cardart\.js": "CARD_ART"/.test(html), 'the boot check');
        ok(/#cardsRoot \.cd-slab \{[^}]*transform: rotateX\(6deg\) rotateY\(-16deg\)/.test(html), 'the tilt'); ok(!/#cardsRoot \.cd-side/.test(html), 'a 3D edge is back (Chrome draws it wrong under the list\'s scrolling)');
        ok(/#cardsRoot \.cd-tex \{[^}]*linear-gradient\(180deg[^}]*var\(--tex, none\)/.test(html), 'the texture under its veil'); ok(/#cardsRoot \.cd-holo\.ghost \{[^}]*blur/.test(html), 'the hologram\'s shadow');
        for (const sel of ['#ccRoot .cc-card {', '#ccRoot.carousel #ccGrid .cc-card::before', '#ccRoot.carousel .cf-card::before', '#ccRoot.carousel .cf-art {', ':is(#squadBar, #ccSquadBox) .sb-slot {', '#ccRoot.carousel #ccSquadBox .sb-slot::before', 'body.corners #squadBar .sb-slot::before', '#squadFly .sf-card::before', '#radialPanel .rp-card {'])
            ok(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^}]*var\\(--tex, none\\)').test(html), sel + ' has no backdrop');
        ok(/#unitInfo \.ui-art\[class\*="cat-f-"\] \{[^}]*var\(--tex\)/.test(html), 'the INFO\'s picture has no backdrop');
    });

    const bin = findChromium();
    for (const [w, h, label] of [[1180, 820, 'a tablet (1180 x 820)'], [390, 740, 'a phone (390 x 740)']]) {
        group('IN CHROMIUM: ' + label);
        if (!bin) { console.log('  skip (no Chromium)'); continue; }
        const T = measure(w, h);
        await check('it ran', () => { ok(T, 'no result'); ok(!T.err, T.err); same((T.errs || []).length, 0, 'page errors: ' + JSON.stringify(T.errs)); });
        if (!T || T.err) continue;
        await check('every picture is one the browser can draw: the nine card faces (300 x 420), the eighteen backdrops (300 x 175), the crystal in six colours and the cube', () => {
            same(T.images.length, 34, 'pictures'); for (const [k, s] of T.images) { ok(s && s[0] > 0 && s[1] > 0, k + ' did not load'); if (/^c:/.test(k)) same(s.join('x'), '300x420', k); if (/^f:/.test(k)) same(s.join('x'), '300x175', k); }
            ok(T.css.sheet && T.css.rules >= 10, 'the page has no art classes: ' + JSON.stringify(T.css));
        });
        await check('THE CARDS (the stage\'s, for a card of each kind; the SHOP\'s; a pack\'s reveal): each a tilted slab (a 3D transform under a perspective, one flat layer, no 3D edge) with its back, its face (the texture, the frame, the rarity, the chip, the crystal and its glow and shadow, the hologram and its shadow, the emitters); one name, kind and text each; the shadow\'s copy hidden from a reader', () => {
            same(T.picked.join('|'), 'TEST · PLAYER A|TEST · CRUSTACEAN|EMBER PLATING|KINDLING BAND', 'the cards picked on the rail'); ok(T.shopCards >= 4, 'the SHOP\'s cards: ' + T.shopCards); same(T.revealCards, 4, 'the reveal\'s cards'); ok(T.cards.length >= 12, 'cards: ' + T.cards.length);
            same(T.tilt.transform, 'matrix3d(', 'the tilt'); same(T.tilt.style, 'flat', 'one layer'); ok(T.tilt.perspective !== 'none', 'no perspective'); same(T.tilt.sides, 0, '3D edges');
            for (const c of T.cards) { ok(c.face, c.name + ' has no face'); same(c.parts.join(), '', c.name + ' lacks'); same([c.names, c.kinds, c.texts, c.chips].join(), '1,1,1,1', c.name + '\'s name, kind, text and chip'); same(c.ghost, c.name, c.name + '\'s shadow'); same(c.ghostHidden, 'true', c.name + '\'s shadow is read out'); }
        });
        await check('an element card wears its element\'s texture and the crystal, a class card its class\'s and the cube (an aura\'s in its element\'s colour), a Player or a Subclass card no texture and the crystal', () => {
            const role = { brawler: 'brawler', sniper: 'mage', camper: 'technician' };
            for (const c of T.cards) {
                if (c.kind === 'element') { same(c.tex, 'cat-c-' + c.match, c.name); ok(/^cag-/.test(c.gem), c.name + ' has no crystal: ' + c.gem); }
                else if (c.kind === 'class') { same(c.tex, 'cat-c-' + role[c.match], c.name); same(c.gem, 'cac-' + (c.aura ? { fire: 'ff3300', electric: 'ffee33', ice: '99ddff', flux: '9933ff', core: '00ccaa', toxic: '66ff66' }[c.aura] : '8fe3ff'), c.name + '\'s cube'); }
                else { same(c.tex, '', c.name + ' (' + c.kind + ') has a texture'); ok(/^cag-/.test(c.gem), c.name + ' has no crystal'); }
            }
            ok(T.cards.some(c => c.kind === 'element') && T.cards.some(c => c.kind === 'class' && !c.aura) && T.cards.some(c => c.aura) && T.cards.some(c => c.kind === 'player'), 'not every kind was shown');
        });
        await check('its state is written along its top (IN YOUR HAND, FOUND THIS RUN, LOCKED, or nothing), the rarity chip stands on its right edge (the right fifth of the card, its upper half), and its buttons are under it (beside it, for the collection\'s card on its stage) where a tap reaches them', () => {
            const st = { hand: 'IN YOUR HAND', found: 'FOUND THIS RUN', locked: 'LOCKED' };
            for (const c of T.cards) {
                const k = Object.keys(st).find(s => (' ' + c.cls + ' ').indexOf(' ' + s + ' ') >= 0); same(c.state, k ? st[k] : '', c.name + ' (' + c.cls + ')');
                ok(c.chipAt && c.chipAt[0] >= 80 && c.chipAt[0] <= 106 && c.chipAt[1] > 5 && c.chipAt[1] < 50, c.name + '\'s chip is at ' + JSON.stringify(c.chipAt) + ' (% of the card)');
                for (const b of c.btns) ok(b, c.name + ': a button a tap does not reach');
            }
            ok(T.cards.some(c => c.btns.length), 'no buttons were checked'); ok(T.overflow.sw <= T.overflow.cw + 1, 'the sheet scrolls sideways: ' + JSON.stringify(T.overflow)); ok(T.overflowShop.sw <= T.overflowShop.cw + 1, 'the SHOP scrolls sideways: ' + JSON.stringify(T.overflowShop));
        });
        await check('THE FOLLOWERS: each squad slot wears its member\'s backdrop (an open slot none), with a texture in it', () => {
            ok(T.bar.length === 3, 'slots: ' + T.bar.length);
            for (const s of T.bar) { same(s.art, s.open ? '' : s.want, 'a slot'); if (!s.open) ok(/^url\("data:image\/svg/.test(s.tex), 'its --tex: ' + s.tex); }
            ok(T.bar.some(s => !s.open), 'no member');
        });
        await check('the roster\'s cards (' + (w > 900 ? 'the carousel\'s strip' : 'a phone\'s grid') + ') and its squad box wear each follower\'s backdrop' + (w > 900 ? '; the card in view behind its numbers and in its picture\'s frame' : '') + '; a re-roll to another element swaps it', () => {
            ok(T.roster.cards.length >= 6, 'cards: ' + T.roster.cards.length);
            for (const c of T.roster.cards) { same(c.art, c.want, 'a roster card'); ok(c.before, 'a roster card\'s background has no texture'); }
            for (const s of T.roster.box) same(s.art, s.want, 'a squad box slot');
            if (T.focus) { same(T.focus.art, T.focus.want, 'the card in view'); ok(T.focus.cardBg && T.focus.artBg, 'the card in view: ' + JSON.stringify(T.focus)); }
            same(T.reroll.art, T.reroll.want, 'after the re-roll'); ok(T.reroll.wasGone, 'the old backdrop stayed on');
        });
        await check('the INFO\'s picture is framed on its backdrop' + (T.fly ? '; the card on the fly wears its member\'s' : '') + (T.radial ? '; a phone\'s roster cards wear theirs' : ''), () => {
            same(T.info.art, T.info.want, 'the INFO'); ok(T.info.bg && T.info.framed === '2px', 'the INFO picture: ' + JSON.stringify(T.info));
            if (T.fly) { same(T.fly.art, T.fly.want, 'the card on the fly'); ok(/^url\("data:image\/svg/.test(T.fly.tex), 'its --tex: ' + T.fly.tex); }
            if (T.radial) { ok(T.radial.length >= 3, 'a phone\'s roster cards: ' + T.radial.length); for (const a of T.radial) ok(/^cat-f-\w+-(brawler|mage|technician)$/.test(a), 'a phone roster card: ' + a); }
        });
    }

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
