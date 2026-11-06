// node design/ui-mocks/part2-looks.js <out dir> [dsf] [mode] [species] [icons] : the following update's Part 2 gate-2 mockups, drawn in the REAL game page (game.html), today beside the proposal.
// PROPOSALS ONLY (docs/FOLLOWING-UPDATE.md Part 2; docs/ART-PROCESS.md, one piece first): the page is a copy with design/ui-mocks/part2-looks-art.js added, and four of the game's own functions wrapped in it
// (cardArtUnitClass, cardArtFaceClass, _cdKindCol, _cdStageFill) so a species' look shows where the game would show it. Nothing in js/ is changed. Needs playwright + chromium.
// species: whose texture is shown (crustacean, the default, and mollusk, both approved; elemental); icons: the emblems on the sheet, comma-separated keys of part2-looks-art.js ICONS (default crustacean,fire,ant).
// Writes: foe-today.png, foe-proposed.png (the enemy card, an ant locked), roster-today.png, roster-proposed.png (the Command Center's card in view: the species' first follower), card-today.png,
// card-proposed.png (the CARDS screen's featured card and its details: the species' card), icons.png (the emblems), texture.png (the species' texture alone),
// backdrop.png (a follower's backdrop alone, today's two layers beside the proposal's three, for the species' two followers).
// mode: how the species layer lies on a follower's backdrop (part2-looks-art.js backdrop3); "small" is the one proposed since round 2 (the crust at half its size, faint; the owner: "Smaller texture", "fainter"), "big" the first round's.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.resolve(process.argv[2] || '/tmp/part2'), DSF = +(process.argv[3] || 2), MODE = process.argv[4] || 'small';
const SPECIES = process.argv[5] || 'crustacean', ICON_KEYS = (process.argv[6] || 'crustacean,fire,ant').split(',');
// each species' card and two followers to show it on (a form of that subclass, js/cards.js EQUIP_FORM_SUBCLASS; its element and role)
const SHOW = {
    crustacean: { card: 'tide_shell',  forms: [['quillstone', 'fire', 'brawler', 'QUILLSTONE'], ['seeper', 'toxic', 'brawler', 'SEEPER']] },
    mollusk:    { card: 'nacre_pearl', forms: [['voidstar', 'flux', 'sniper', 'VOIDSTAR'], ['hammerslug', 'core', 'camper', 'HAMMER SLUG']] },
    elemental:  { card: 'focusing_prism', forms: [['maw', 'ice', 'brawler', 'FROST MAW'], ['thunderhead', 'electric', 'sniper', 'THUNDERHEAD']] },
}[SPECIES];
if (!SHOW) { console.error('no such species to show: ' + SPECIES); process.exit(1); }

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const dir = fs.mkdtempSync(path.join(OUT, 'pg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => '<script src="design/ui-mocks/part2-looks-art.js"></script></body>'));
    const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: DSF });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto('file://' + file); await page.waitForTimeout(2500);
    const shot = async (name, clip) => { await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, name), clip }); };
    const ev = async (fn, arg) => { const r = await page.evaluate(fn, arg); if (r && r.err) throw new Error(r.err); return r; };
    const box = sel => ev(s => { const e = document.querySelector(s); if (!e) return { err: 'not on the page: ' + s }; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 10), width: Math.min(1180, r.width + 20), height: Math.min(820, r.height + 20) }; }, sel);

    // THE SCENE: the facility, the tutorial done, no creature about; the squad's first two are the species' two followers
    const scene = await ev(FORMS => { try {
        if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart();
        gameState.running = true; crystalMenuOpen = false; classPickerOpen = false; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; playerClassKey = 'gunslinger';
        if (typeof facilityBlackoutSet === 'function') facilityBlackoutSet(false); alertActive = false; actors = actors.filter(a => !(a instanceof Predator)); dialogueClear();
        partyTick(); const sq = Array.prototype.slice.call(document.querySelectorAll('#squadBar .sb-slot')).map(e => e._unit).filter(Boolean);
        const set = (f, ev, el, role) => { f.element = el; f.role = role; f.evolved = ev; f._moltAt = -1e9; if (f.level < 10) f.level = 10; };
        FORMS.forEach((f, i) => { if (sq[i]) set(sq[i], f[0], f[1], f[2]); });
        partyBarRender(true); window.__sq = sq; return { n: sq.length };
    } catch (e) { return { err: String(e && e.stack || e) }; } }, SHOW.forms);

    // ── TODAY ──
    // the enemy card, an ant locked; then the world is held still for the pictures (gameState.running false: js/game.js gameLoop draws and does not step, so no turret or bite takes the ant)
    await ev(() => { try { const a = spawnCreature({ species: 'ant', className: 'scout', x: player.x + 3, y: player.y + 1, level: 3, state: 'idle' }); a.state = 'idle'; targetSet(a, true); for (let i = 0; i < 40; i++) { frame++; targetTick(); } mixToolRender(true); gameState.running = false; return {}; } catch (e) { return { err: String(e && e.stack || e) }; } });
    const foeClip = await box('.mt-foe'); await shot('foe-today.png', foeClip);
    // the enemy card: the race's icon by its name, and a row of what it is weak to and resists, from the game's own table (js/damage.js DMG_RACE)
    await ev(() => { try {
        const el = document.querySelector('.mt-foe'), foe = mixToolFoe(); if (!el || !foe) return { err: 'no enemy card' };
        const row = DMG_RACE[foe.speciesName] || { weak: [], resist: [] }, T = { slashing: 'SLASH', piercing: 'PIERCE', projectile: 'SHOT', crushing: 'CRUSH', earthquake: 'QUAKE', elemental: 'ELEM' };
        const chip = (t, w) => '<span style="display:inline-block;margin:0 2px 0 0;padding:0 3px;border-radius:3px;font:700 8.5px/13px monospace;letter-spacing:.02em;'
            + (w ? 'background:rgba(120,255,170,.16);color:#9dffc4;border:1px solid rgba(120,255,170,.5)' : 'background:rgba(160,170,200,.12);color:#a9b4cc;border:1px solid rgba(160,170,200,.38)') + '">' + T[t] + '</span>';
        const name = el.querySelector('.mt-foe-name'), txt = el.querySelector('.mt-foe-txt');
        if (name) name.innerHTML = '<span style="display:inline-block;vertical-align:-3px;margin-right:4px">' + PART2.iconSvg('ant', 16, 'currentColor') + '</span>' + name.innerHTML;
        const r = document.createElement('span'); r.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:2px 0;margin-top:3px';   // (a race with more entries wraps to a second line; the card grows upward, as a corner card does)
        r.innerHTML = '<b style="font:700 8.5px/13px monospace;color:#9dffc4;margin-right:3px">WEAK</b>' + row.weak.map(t => chip(t, true)).join('') + '<b style="font:700 8.5px/13px monospace;color:#a9b4cc;margin:0 3px 0 4px">RESISTS</b>' + row.resist.map(t => chip(t, false)).join('');
        const h0 = el.getBoundingClientRect().height; if (txt) txt.appendChild(r); const dh = el.getBoundingClientRect().height - h0; if (dh > 0) el.style.transform = 'translateY(' + (-dh) + 'px)';
        return {};
    } catch (e) { return { err: String(e && e.stack || e) }; } });
    await shot('foe-proposed.png', await box('.mt-foe'));
    await ev(() => { mixToolRender(true); return {}; });
    // the roster's card in view, the species' first follower
    await ev(() => { ccOpen(); ccFocusSet(window.__sq[0]); if (typeof ccRender === 'function') ccRender(true); return {}; });
    const rosterClip = await box('.cf-card');
    await shot('roster-today.png', rosterClip);
    await ev(() => { ccClose(); return {}; });
    // the CARDS screen's featured card, the species' card, and its details beside it (every card shown, as ?cards=all; out of the hand, so it is not lit gold)
    await ev(ID => { equipDevSet('all'); equipHand = equipHand.filter(id => id !== ID); cardsOpen(); _cdView = 'all'; cardsRender(true); const rail = document.querySelector('.cd-rail'); if (rail) _cdRailGo(rail, ID, false); return {}; }, SHOW.card);
    const cardWide = await box('.cd-stage');
    await shot('card-today.png', cardWide);
    await ev(() => { cardsClose(); return {}; });

    // ── THE PROPOSAL, wrapped in ──
    await ev(MODE => { try {
        window.__p2mode = MODE;
        const unitKeep = cardArtUnitClass, faceKeep = cardArtFaceClass, colKeep = _cdKindCol;
        // a follower of a species with a drawn texture: its backdrop gains the third layer, the species'
        cardArtUnitClass = function (f) {
            const base = unitKeep(f); if (!base) return base;
            const sp = typeof EQUIP_FORM_SUBCLASS !== 'undefined' && f.evolved ? EQUIP_FORM_SUBCLASS[f.evolved] : null; if (!sp || !PART2.TEX[sp]) return base;
            const el = f.element, cls = cardArtClassOfRole(f.role);
            return _caRule('cat-p2-' + el + '-' + cls + '-' + sp, '--tex', cardArtUrl('p2:' + el + ':' + cls + ':' + sp, () => PART2.backdrop3(el, cls, sp, window.__p2mode)));
        };
        // a species card (of a species with a drawn texture) wears its texture and colour
        const drawn = c => c && c.kind === 'subclass' && PART2.TEX[c.match];
        cardArtFaceClass = function (c) {
            if (drawn(c)) return _caRule('cat-p2-face-' + c.match, '--tex', cardArtUrl('p2:face:' + c.match, () => _caDoc(300, 420, '<g color="' + PART2.THEMES[c.match].col + '">' + PART2.TEX[c.match]() + '</g>')));
            return faceKeep(c);
        };
        _cdKindCol = function (c) { return drawn(c) ? PART2.THEMES[c.match].col : colKeep(c); };
        // its kind line carries the species' icon, on the card's face and in the details beside it (the stage is filled again as the rail settles, so the icon goes in each time it is filled)
        const stageKeep = _cdStageFill;
        _cdStageFill = function (stage, c) {
            stageKeep(stage, c);
            if (stage && drawn(c) && PART2.ICONS[c.match]) stage.querySelectorAll('.cd-kind, .cd-irow.kd .cd-iv').forEach(k => { k.innerHTML = '<span style="display:inline-block;vertical-align:-0.2em;margin-right:.3em;width:1.15em;height:1.15em">' + PART2.iconSvg(c.match, '100%', 'currentColor') + '</span>' + k.textContent; });
        };
        return {};
    } catch (e) { return { err: String(e && e.stack || e) }; } }, MODE);
    // the roster's card in view, with the species' icon on its subclass tag
    await ev(() => { ccOpen(); ccFocusSet(window.__sq[0]); if (typeof ccRender === 'function') ccRender(true);
        document.querySelectorAll('.cf-sc').forEach(t => { const k = t.textContent.trim().toLowerCase(); if (PART2.ICONS[k] && PART2.THEMES[k] && !t.querySelector('svg')) t.innerHTML = '<span style="display:inline-block;vertical-align:-2px;margin-right:4px">' + PART2.iconSvg(k, 14) + '</span>' + t.textContent; });
        return {}; });
    await shot('roster-proposed.png', rosterClip);
    await ev(() => { ccClose(); return {}; });
    // the featured card, the species' card, with the species' texture and colour, and its icon in the kind line
    await ev(ID => { cardsOpen(); _cdView = 'all'; cardsRender(true); const rail = document.querySelector('.cd-rail'); if (rail) { _cdSel = null; _cdRailGo(rail, ID, false); } return {}; }, SHOW.card);
    await shot('card-proposed.png', cardWide);
    await ev(() => { cardsClose(); equipDevSet(''); return {}; });

    // THE ICONS (one of each set) big and at the sizes they would be shown; THE TEXTURE alone at a card face's size
    const sheet = path.join(dir, 'icons.html');
    fs.writeFileSync(sheet, '<html><head><script src="file://' + ROOT + '/js/cardart.js"></script><script src="file://' + ROOT + '/design/ui-mocks/part2-looks-art.js"></script></head><body style="margin:0;background:#070b16;color:#cfe;font:12px monospace"><div id="o" style="display:flex;gap:34px;padding:18px 24px;align-items:flex-end"></div>'
        + '<script>const o=document.getElementById("o"),S=' + JSON.stringify(ICON_KEYS) + '.map(k=>[k,k.toUpperCase()+" · "+(PART2.THEMES[k]?"species":["fire","toxic","electric","ice","flux","core","bloom"].indexOf(k)>=0?"element":"enemy race"),PART2.ICONS[k].col]);for(const [k,n,c] of S){const d=document.createElement("div");d.style.cssText="display:flex;flex-direction:column;align-items:center;gap:10px";d.innerHTML="<div style=\\"color:"+c+"\\">"+PART2.iconSvg(k,96)+"</div><div style=\\"display:flex;gap:12px;align-items:center;color:"+c+"\\">"+PART2.iconSvg(k,32)+PART2.iconSvg(k,20)+PART2.iconSvg(k,14)+"</div><div>"+n+"</div>";o.appendChild(d);}</script></body></html>');
    await page.goto('file://' + sheet); await page.setViewportSize({ width: Math.max(600, 48 + ICON_KEYS.length * 176), height: 230 }); await shot('icons.png');
    const tex = path.join(dir, 'texture.html');
    fs.writeFileSync(tex, '<html><head><script src="file://' + ROOT + '/js/cardart.js"></script><script src="file://' + ROOT + '/design/ui-mocks/part2-looks-art.js"></script></head><body style="margin:0;background:#070b16"><div id="t" style="width:300px;height:420px;margin:10px;border-radius:12px;border:2px solid ' + '#e7ad78' + ';background-color:#0b1226"></div>'
        + '<script>const S="' + SPECIES + '";document.getElementById("t").style.borderColor=PART2.THEMES[S].col;document.getElementById("t").style.backgroundImage=\'url("data:image/svg+xml,\'+encodeURIComponent(_caDoc(300,420,\'<g color="\'+PART2.THEMES[S].col+\'">\'+PART2.TEX[S]()+\'</g>\'))+\'")\';</script></body></html>');
    await page.goto('file://' + tex); await page.setViewportSize({ width: 324, height: 444 }); await shot('texture.png');
    // THE BACKDROP alone (no creature, no veil): today's two layers (element, class) beside the proposal's three (the species' texture added), for the species' two followers
    const bd = path.join(dir, 'backdrop.html');
    fs.writeFileSync(bd, '<html><head><script src="file://' + ROOT + '/js/cardart.js"></script><script src="file://' + ROOT + '/design/ui-mocks/part2-looks-art.js"></script></head><body style="margin:0;background:#070b16;color:#cfe;font:11px monospace"><div id="g" style="display:grid;grid-template-columns:300px 300px;gap:14px 16px;padding:12px 16px"></div>'
        + '<script>const g=document.getElementById("g"),SP="' + SPECIES + '",F=' + JSON.stringify(SHOW.forms) + ';for(const [ev,el,role,who] of F){const cls=cardArtClassOfRole(role);for(const [svg,lab] of [[cardArtMixSvg(el,cls),"TODAY · "+el.toUpperCase()+" + "+cls.toUpperCase()],[PART2.backdrop3(el,cls,SP,"' + MODE + '"),"PROPOSED · + "+SP.toUpperCase()]]){'
        + 'const d=document.createElement("div"),p=document.createElement("div"),t=document.createElement("div");p.style.cssText="width:300px;height:175px;border-radius:8px;border:1px solid #2a3550;background-color:#0b1226;background-size:cover;background-repeat:no-repeat";'
        + 'p.style.backgroundImage=\'url("data:image/svg+xml,\'+encodeURIComponent(svg)+\'")\';t.style.marginTop="5px";t.textContent=who+" · "+lab;d.appendChild(p);d.appendChild(t);g.appendChild(d);}}</script></body></html>');
    await page.goto('file://' + bd); await page.setViewportSize({ width: 648, height: 434 }); await shot('backdrop.png');

    console.log(JSON.stringify({ scene, errors: errors.slice(0, 6) }));
    await browser.close(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
})().catch(e => { console.error(e); process.exit(1); });
