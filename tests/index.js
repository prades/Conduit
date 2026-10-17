// THE GAME INDEX, ITS PICTURES AND THE ICONS — "rewrite the information to be
// as relevant as possible, giving rough information on the different systems.
// Make the information more intuitive by showing pictures of the systems and
// elements. Make more icons for all the elements and different pylons."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('game.html');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

const menu = HTML.slice(HTML.indexOf('<div id="controlsMenu">'), HTML.indexOf('<!-- OVERLAY'));

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');

    group('ICONS');

    await check('THE ASK: an icon for every element', () => {
        const missing = run('ELEMENTS.filter(e => !ICONS[ELEMENT_ICON[e.id]]).map(e => e.id)');
        ok(missing.length === 0, 'no icon for ' + missing.join(', '));
    });
    await check('THE ASK: an icon for every kind of pylon, and for each structure four of them make', () => {
        const kinds = run('PYLON_KINDS.filter(k => !ICONS[PYLON_KIND_ICON[k.id]]).map(k => k.id)');
        ok(kinds.length === 0, 'no icon for ' + kinds.join(', '));
        const forms = run('Object.values(FORM_KINDS).filter(k => !ICONS[FORMATION_ICON[k]])');
        ok(forms.length === 0, 'no icon for ' + forms.join(', '));
        for (const id of ['pylon', 'ultra', 'mk2', 'battery', 'generator', 'connector']) ok(run(`!!ICONS[${JSON.stringify(id)}]`), 'no ' + id + ' icon');
    });
    await check('and for the systems the index explains', () => {
        for (const id of ['nest', 'crystal', 'shard', 'power', 'tier', 'follower', 'clone', 'predator', 'machine', 'thief', 'night', 'wheel', 'worker', 'zone'])
            ok(run(`!!ICONS[${JSON.stringify(id)}]`), 'no ' + id + ' icon');
    });
    await check('an icon is an SVG in the colour it is given; an unknown one is nothing', () => {
        const s = run('iconSVG("fire", "#123456", 20)');
        ok(/^<svg[^>]*viewBox="0 0 24 24"/.test(s) && /#123456/.test(s) && /width="20"/.test(s), s.slice(0, 120));
        ok(run('iconSVG("no-such-icon", "#fff")') === '', 'an unknown id drew something');
    });
    await check('every icon is well-formed: balanced tags, nothing but drawing', () => {
        const ids = run('ICON_IDS');
        for (const id of ids) {
            const s = run(`iconSVG(${JSON.stringify(id)}, "#0f8", 16)`);
            ok(!/<script|on\w+=/i.test(s), id + ' carries script');
            const opens = (s.match(/<(path|g|rect|circle|ellipse|svg)\b[^>]*[^/]>/g) || []).length;
            const closes = (s.match(/<\/(path|g|rect|circle|ellipse|svg)>/g) || []).length;
            ok(opens === closes, id + ': ' + opens + ' open tags, ' + closes + ' closed');
        }
    });
    await check('on the canvas an icon is rasterised once and stamped; until then the old marker draws', () => {
        // No Image in the test page: iconCanvas answers null and drawIcon false,
        // so every caller keeps its fallback.
        ok(run('iconCanvas("fire", "#ff3300", 16)') === null && run('drawIcon(ctx, "fire", "#ff3300", 0, 0, 16)') === false, 'no fallback');
        const UI = rd('js/ui.js'), G = rd('js/game.js');
        ok(/drawIcon\(ctx, ELEMENT_ICON\[el\.id\] \|\| el\.id, el\.color/.test(UI), 'the element panel does not use the icons');
        ok(/PYLON_KIND_ICON\[c\.it\.k\.id\]/.test(UI) && /drawIcon\(ctx, _icon, color/.test(UI), 'the build picker does not use the icons');
        ok(/drawIcon\(ctx, ELEMENT_ICON\[el\] \|\| el, elDef\.color/.test(rd('js/nethud.js')), 'the network panel does not use the icons');
    });

    group('PICTURES');

    const arts = [...new Set([...menu.matchAll(/data-art="([^"]+)"/g)].map(m => m[1]))];
    await check('THE ASK: the index shows pictures — of the pylons, the structures, the elements and the enemies', () => {
        for (const a of ['attack:fire', 'support:electric', 'disruption:flux', 'battery:electric', 'generator', 'connector', 'mk2:electric', 'pylon',
                         'ultra:electric', 'blackhole', 'firespin', 'icegen', 'toxtower', 'predator:ant', 'machine:sentry', 'machine:strider', 'thief', 'nest', 'nest:held', 'portal'])
            ok(arts.includes(a), 'no picture of ' + a);
        for (const e of ['fire', 'electric', 'ice', 'flux', 'core', 'toxic']) ok(arts.includes('follower:' + e), 'no picture of a ' + e + ' follower');
    });
    await check('every picture in the index has a painter', () => {
        const bad = arts.filter(a => !run(`typeof IX_ART[${JSON.stringify(a.split(':')[0])}] === "function"`));
        ok(bad.length === 0, 'no painter for ' + bad.join(', '));
    });
    await check('every picture paints with the board\'s own draw code, without throwing', () => {
        const bad = run(`(function(){ const bad = [];
            for (const a of ${JSON.stringify(arts)}) {
                const cv = { dataset: { art: a }, width: 0, height: 0, getContext: () => ctx.canvas.getContext ? ctx.canvas.getContext('2d') : null };
                const g = document.createElement('canvas').getContext('2d');
                cv.getContext = () => g;
                if (!paintIndexArt(cv)) bad.push(a);
            }
            return bad; })()`);
        ok(bad.length === 0, 'failed to paint: ' + bad.join(', '));
    });
    await check('painting a picture puts the board\'s context and clock back', () => {
        const r = run(`(function(){ const keep = ctx, f = frame;
            const g = document.createElement('canvas').getContext('2d');
            paintIndexArt({ dataset: { art: 'blackhole' }, width: 0, height: 0, getContext: () => g });
            const fb = formationBlocker;
            paintIndexArt({ dataset: { art: 'nope' }, width: 0, height: 0, getContext: () => g });
            return { ctx: ctx === keep, frame: frame === f, fb: typeof fb === 'function' && fb === formationBlocker }; })()`);
        ok(r.ctx && r.frame && r.fb, JSON.stringify(r));
    });
    await check('a picture of a formation is drawn as if it worked (no tier needed in the index)', () => {
        ok(/formationBlocker = \(\) => null/.test(rd('js/indexart.js')), 'the index would show NEEDS TIER II over every formation');
    });
    await check('the pictures only move while the index is open, and only the open tab\'s', () => {
        const A = rd('js/indexart.js');
        ok(/\.cm-section\.active/.test(A) && /canvas\.ix-art/.test(A), 'it paints every tab');
        ok(/if \(!open\) \{ _ixLoop = null; return; \}/.test(A), 'it keeps painting with the index closed');
        ok(/startIndexArt\(\)/.test(rd('js/config.js')), 'opening the index does not start them');
    });

    group('THE INDEX');

    const tabs = [...menu.matchAll(/<button class="cm-tab[^"]*" data-tab="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)].map(m => ({ id: m[1], label: m[2].replace(/<[^>]+>/g, '').trim() }));
    await check('THE ASK: one tab per system, each with its icon', () => {
        ok(JSON.stringify(tabs.map(t => t.label)) === JSON.stringify(['START', 'CONTROLS', 'ELEMENTS', 'PYLONS', 'POWER', 'SQUAD', 'ENEMIES', 'WORLD']), JSON.stringify(tabs));
        for (const t of tabs) ok(new RegExp('id="' + t.id + '" class="cm-section').test(menu), 'no section for ' + t.id);
        const btns = [...menu.matchAll(/<button class="cm-tab[\s\S]*?<\/button>/g)].map(m => m[0]);
        ok(btns.every(b => /class="ix-i" data-icon=/.test(b)), 'a tab has no icon');
    });
    await check('it opens on a START page that says how a run goes', () => {
        ok(/id="cmStart" class="cm-section active"/.test(menu), 'it does not open on START');
        const st = menu.slice(menu.indexOf('id="cmStart"'), menu.indexOf('id="cmControls"'));
        ok((st.match(/class="ix-step"/g) || []).length === 6, 'not six steps');
        for (const w of ['Gather a squad', 'Earn shards', 'Build pylons', 'Power them', 'Take the next zone', 'Survive the night']) ok(st.includes(w), 'no step: ' + w);
    });
    await check('every tab leads with a short overview; the full reference is folded underneath', () => {
        for (const t of tabs) {
            const i = menu.indexOf('id="' + t.id + '"'), sec = menu.slice(i, menu.indexOf('<div id=', i + 10) > -1 ? menu.indexOf('\n    <!-- ── ', i) : undefined);
            ok(/class="ix-lede"/.test(sec), t.label + ' has no overview');
        }
        ok((menu.match(/<details class="cm-more">/g) || []).length >= 15, 'the reference is not folded');
    });
    await check('every icon slot names an icon that exists', () => {
        const ids = [...new Set([...menu.matchAll(/data-icon="([^"]+)"/g)].map(m => m[1]))];
        const bad = ids.filter(id => !run(`!!ICONS[${JSON.stringify(id)}]`));
        ok(bad.length === 0, 'no such icon: ' + bad.join(', '));
    });
    await check('stale entries are gone: no Ghostphage build, no zone-count armaments, no nest links that redirect spawns', () => {
        ok(!/Ghostphage/.test(menu), 'the Ghostphage build is still listed');
        ok(!/Elite Vanguard|Apex Unit|Strike Force/.test(menu), 'the zone-control armaments are still listed');
        ok(!/redirect enemy spawns/.test(menu), 'nest links still claim to redirect spawns');
        ok(!/Network integrity builds <span class="cm-stat">faster<\/span> when player is near the Crystal/.test(menu), 'the Crystal integrity bonus is still listed');
    });
    await check('the element cards give each element\'s role, its wheel, its pylon and its squad', () => {
        const el = menu.slice(menu.indexOf('id="cmElements"'), menu.indexOf('id="cmPylons"'));
        ok((el.match(/class="ix-el"/g) || []).length === 6, 'not six element cards');
        for (const w of ['Beats', 'weak to', 'Pylon', 'Squad', 'SUPPORT', 'DISRUPTION']) ok(el.includes(w), 'no "' + w + '"');
        // The wheel as the game has it (breakout.js): fire > flux > toxic > fire, electric > core > ice > electric.
        const fire = el.slice(el.indexOf('data-art="follower:fire"'), el.indexOf('data-art="follower:electric"'));
        ok(/Beats<\/b> <i[^>]*data-icon="flux"/.test(fire) && /weak to<\/b> <i[^>]*data-icon="toxic"/.test(fire), 'fire\'s matchups are wrong');
        // And every card against the rule the game plays by.
        for (const e of ['fire', 'electric', 'ice', 'flux', 'core', 'toxic']) {
            const i = el.indexOf('data-art="follower:' + e + '"'), card = el.slice(i, el.indexOf('</div></div>', i));
            const beats = (card.match(/Beats<\/b> <i[^>]*data-icon="(\w+)"/) || [])[1], weak = (card.match(/weak to<\/b> <i[^>]*data-icon="(\w+)"/) || [])[1];
            ok(run(`wheelMult(${JSON.stringify(e)}, { element: ${JSON.stringify(beats)} })`) > 1, e + ' does not beat ' + beats + ' in the game');
            ok(run(`wheelMult(${JSON.stringify(weak)}, { element: ${JSON.stringify(e)} })`) > 1, weak + ' does not beat ' + e + ' in the game');
        }
    });
    await check('the power page shows the chain as pictures: nest, generator, battery, pylon', () => {
        const pw = menu.slice(menu.indexOf('id="cmPower"'), menu.indexOf('id="cmFollowers"'));
        const order = ['nest:held', 'generator', 'battery:electric', 'attack:electric'].map(a => pw.indexOf('data-art="' + a + '"'));
        ok(order.every(i => i > -1) && order.every((v, i) => i === 0 || v > order[i - 1]), 'the chain is not pictured in order: ' + order);
    });
    await check('reference rows flow as text (they were flex rows that broke sentences into columns)', () => {
        ok(/#controlsMenu \.ctrl-row, #controlsMenu \.cm-build-row \{ display: flow-root;/.test(HTML), 'rows are still flex');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
