// THE BALANCE PAGE (build 2026-11-13q; the owner, 2026-11-13: "There's so much shit in the game Bible regarding ultimates and abilities because of all the changelog stuff.
// Can you simplify that for me? We're trying to make it to where we can balance everything because I can't keep track of all this stuff by myself"): `node tools/balance.js`
// writes balance.html, one row per evolved form with everything that matters to balance and nothing of its history: its stats at level 20 (identical base stats for every
// form, so the forms compare), its everyday attack's type and status, each alternate move, its ability and its Ultimate, as the game's own INFO card says them
// (followerInfo, js/unitinfo.js: read from the code, so the page cannot drift), and the measured damage per second from design/balance-trial.json (the trial,
// tools/balance-trial.js, which takes minutes and is not part of the test run: its table says which build it was run on).
// `node tools/balance.js --check` exits 1 when balance.html is not what the code makes now (tests/balance.js). node tools/stamp.js runs it for every build.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const { scriptOrder, makeBrowserSandbox } = require(path.join(ROOT, 'tests/domstub.js'));
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STD = '{ hp: 20, defense: 10, attack: 14, speed: 12, specialAttack: 14, accuracy: 10, will: 24, resonance: 0 }';   // (the trial's: the same base for every form)

async function collect() {
    process.on('unhandledRejection', () => {});
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const J = s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', context));
    vm.runInContext('unlockedElements = new Set(ELEMENTS.map(e => e.id));', context);
    return J(`(function(){
        const ROLE = { brawler: 'BRAWLER', sniper: 'MAGE', camper: 'TECHNICIAN' }, EL_ORDER = ELEMENTS.map(e => e.id), out = { build: BUILD_VERSION, forms: [] };
        const ids = Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy && EVOLUTIONS[k].role);
        ids.sort((a, b) => EL_ORDER.indexOf(EVOLUTIONS[a].element) - EL_ORDER.indexOf(EVOLUTIONS[b].element) || ['brawler', 'sniper', 'camper'].indexOf(EVOLUTIONS[a].role) - ['brawler', 'sniper', 'camper'].indexOf(EVOLUTIONS[b].role));
        for (const id of ids) {
            const d = EVOLUTIONS[id];
            spawnFollowerAtCrystal(d.element); const f = followers[followers.length - 1];
            f.role = d.role; f.evolved = id; f.base = ${STD}; f.level = 20; _applyFollowerLevel(f, true); f.currentWill = 100; f.ultimateCharge = 0; f.energy = [d.element, d.element, d.element];
            const info = followerInfo(f), t = (typeof DMG_FORM !== 'undefined' && DMG_FORM[id]) || {};
            const rows = [], nm = d.shot || d.hit || null, si = nm && typeof SHOT_INFO !== 'undefined' && SHOT_INFO[nm] ? SHOT_INFO[nm]() : null;
            rows.push({ h: 'EVERYDAY · ' + (nm || (d.role === 'sniper' ? 'SHOT' : d.role === 'camper' ? 'PLAIN HIT (a technician fights only what comes to it)' : 'PLAIN HIT')), note: '', rows: (si || []).concat(d.role === 'sniper' && !si ? [['DAMAGE', MAGE_SHOT_MULT + '× special attack, a wind-up of ' + (MAGE_SHOT_WINDUP / 60).toFixed(2) + ' s, then every ' + (MAGE_SHOT_REST / 60).toFixed(2) + ' s']] : []) });
            for (const a of info.attacks) { if (/^ATTACK STYLE/.test(a.h) || a.choices || (si && /^MAIN ATTACK/.test(a.h))) continue; rows.push({ h: a.h, note: a.note || '', rows: a.rows || [] }); }
            out.forms.push({ id, name: d.name, element: d.element, role: ROLE[d.role] || d.role, hp: Math.round(f.maxHealth), def: Math.round(f.stats.defense), atk: Math.round(f.stats.attack), sp: Math.round(f.stats.specialAttack), spd: Math.round(f.moveSpeed * 1000) / 1000,
                mainType: t.main || null, altType: t.alt || null, extraType: t.extra || null, status: (typeof PRIMARY_STATUS !== 'undefined' && PRIMARY_STATUS[id]) || null, attacks: rows });
            followers.splice(followers.indexOf(f), 1); actors = actors.filter(a => a !== f);
        }
        out.statusChance = PRIMARY_STATUS_CHANCE; out.blindMiss = BLIND_MISS; out.power = ENERGY.power.slice();
        return out; })()`);
}

function measured() { try { return JSON.parse(rd('design/balance-trial.json')); } catch (e) { return null; } }

function render(D, M) {
    const num = (x, d) => x === null || x === undefined ? '–' : (Math.round(x * Math.pow(10, d || 1)) / Math.pow(10, d || 1)).toString();
    const el = f => '<span class="el el-' + f.element + '">' + esc(f.element) + '</span>';
    let h = '';
    h += '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Conduit Balance</title>\n<style>\n' +
        ':root { --bg:#fff; --fg:#14181f; --mut:#5b6573; --line:#d5dae2; --head:#eef1f5; --acc:#0b6bd3; }\n@media (prefers-color-scheme: dark) { :root { --bg:#10141a; --fg:#e6eaf0; --mut:#98a2b3; --line:#2a3340; --head:#19212b; --acc:#6db3ff; } }\n' +
        'body { background:var(--bg); color:var(--fg); font:15px/1.45 -apple-system, system-ui, sans-serif; margin:0; padding:16px; }\nh1 { font-size:22px; margin:0 0 4px; } h2 { font-size:17px; margin:28px 0 8px; }\np, li { max-width:70ch; } .mut { color:var(--mut); }\n' +
        '.tw { overflow-x:auto; border:1px solid var(--line); border-radius:8px; } table { border-collapse:collapse; width:100%; min-width:760px; } th, td { padding:7px 9px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }\n' +
        'th { background:var(--head); position:sticky; top:0; cursor:pointer; white-space:nowrap; } td.n, th.n { text-align:right; font-variant-numeric:tabular-nums; } tr:last-child td { border-bottom:0; }\n' +
        '.flag { color:#c2410c; } @media (prefers-color-scheme: dark) { .flag { color:#ffa366; } } h3 { font-size:15px; margin:18px 0 6px; }\n.el { display:inline-block; padding:1px 7px; border-radius:99px; font-size:12px; background:var(--head); border:1px solid var(--line); } .tag { font-size:12px; color:var(--mut); }\n' +
        'details { margin:2px 0; } summary { cursor:pointer; color:var(--acc); } .rows { margin:4px 0 6px 12px; } .rows div { margin:1px 0; } .k { color:var(--mut); font-size:12px; margin-right:6px; }\n</style></head><body>\n';
    h += '<h1>Conduit balance</h1>\n<p class="mut">Written against build <b>' + esc(D.build) + '</b>. Made by <code>node tools/balance.js</code> from the code, so it cannot drift; nothing here is history (that is <code>docs/CHANGELOG.md</code> and the Bible). Tap a column heading to sort.</p>\n';
    h += '<p>Every form below is level 20 with the same base stats, so the numbers compare forms and not luck. Power is its ATK; the Mage&#39;s shot reads SP.ATK. Each holds <b>three energy cards of its own element</b>: every attack open, and the elemental part of its hits at its most (' + D.power.map(x => Math.round(x * 100) + '%').join(' / ') + ' with none, one, two and three). ' +
        'A primary attack carries its status on ' + Math.round(D.statusChance * 100) + '% of its hits; a blinded creature misses ' + Math.round(D.blindMiss * 100) + '% of its hits.</p>\n';

    // table 1: the forms and their stats and the everyday attack
    h += '<h2>1. The forms: stats, everyday attack, status</h2>\n<div class="tw"><table class="sortable"><thead><tr><th>Form</th><th>Element</th><th>Role</th><th class="n">HP</th><th class="n">DEF</th><th class="n">ATK</th><th class="n">SP.ATK</th><th>Everyday type</th><th>Alternate type</th><th>Extra type</th><th>Status on a hit</th></tr></thead><tbody>\n';
    for (const f of D.forms) h += '<tr><td><b>' + esc(f.name) + '</b></td><td>' + el(f) + '</td><td>' + esc(f.role) + '</td><td class="n">' + f.hp + '</td><td class="n">' + f.def + '</td><td class="n">' + f.atk + '</td><td class="n">' + f.sp + '</td><td>' + esc(f.mainType || '–') + '</td><td>' + esc(f.altType || '–') + '</td><td>' + esc(f.extraType || '–') + '</td><td>' + esc(f.status || (f.role === 'TECHNICIAN' ? 'none (no everyday attack)' : '–')) + '</td></tr>\n';
    h += '</tbody></table></div>\n';

    // THE BALANCE SYSTEM (build 2026-11-13u; the owner, 2026-11-13: "I accept the points and the role bands as the system"): everything a form does, in one currency, POINTS a second:
    //   1 damage = 1; 1 HP healed, blocked or added to an ally's hit = 1; an enemy's damage held off = what that enemy would have dealt (the trial's `denied` enemy-seconds x foeDps:
    //   stunned, glitched or lured 1, blinded BLIND_MISS, poisoned 1 - its factor, slowed 0.25: the greatest, never added up).
    // A form's SCORE is its best mode's. A role's TARGET is the middle score of its forms (so nothing moves on day one), and its BAND is BAND of it either way. A form outside its band,
    // and an alternate scoring under BAND_ALT of its form's everyday attack, are flagged.
    const BAND = 0.25, BAND_ALT = 0.75, SLOW_W = 0.25;
    const modeName = m => m === 'main' ? 'everyday attack' : m.replace(/_/g, ' ');
    if (M && M.forms) {
        const fd = M.foeDps || 0, byId = {}; for (const f of D.forms) byId[f.id] = f;
        const sup = m => fd * (m.denied || 0) / 20, pts = m => m.dmg + m.heal + m.assist + sup(m);   // (SUPPORT: the statuses it distributes, the owner, 2026-11-14; the damage a guard or a decoy takes is shown and not added: the lure already counts those enemies)
        const forms = M.forms.filter(r => byId[r.id]).map(r => { const modes = r.modes.map(m => Object.assign({ pts: pts(m) }, m)), best = modes.reduce((a, b) => b.pts > a.pts ? b : a, modes[0]), main = modes.find(m => m.mode === 'main'); return { id: r.id, name: r.name, role: byId[r.id].role, modes, best, main }; });
        const target = {}; for (const role of ['BRAWLER', 'MAGE', 'TECHNICIAN']) { const v = forms.filter(f => f.role === role).map(f => f.best.pts).sort((a, b) => a - b); target[role] = v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : 0; }
        const verdict = f => { const t = target[f.role]; return !t ? '–' : f.best.pts > t * (1 + BAND) ? 'ABOVE' : f.best.pts < t * (1 - BAND) ? 'BELOW' : 'in band'; };
        h += '<h2>2. The score: points a second, and the role bands</h2>\n<p>Everything a form does is counted in one currency. <b>1 damage = 1 point. 1 HP healed or added to an ally&#39;s hit = 1 point.</b> <b>Support is the statuses a form puts on enemies</b>, each worth the damage that enemy would have dealt meanwhile: one enemy deals about <b>' + num(fd) + '</b> a second here, so a second of an enemy <b>stunned, glitched or lured to a decoy</b> is worth all of that, <b>lured onto the follower itself</b> half of it (its hits are moved, not stopped: provisional), <b>blinded</b> ' + Math.round(D.blindMiss * 100) + '%, <b>poisoned</b> 40%, <b>slowed</b> ' + Math.round(SLOW_W * 100) + '% (provisional). An enemy under several counts once, at the strongest. The damage a guard or a decoy takes is shown below but not added again.</p>\n' +
            '<p>A form&#39;s <b>score</b> is its best mode. Each role&#39;s <b>target</b> is the middle score of its forms today, and its <b>band</b> is ' + Math.round(BAND * 100) + '% either way: ' + ['BRAWLER', 'MAGE', 'TECHNICIAN'].map(r => '<b>' + r.charAt(0) + r.slice(1).toLowerCase() + '</b> ' + num(target[r] * (1 - BAND)) + ' to ' + num(target[r] * (1 + BAND)) + ' (target ' + num(target[r]) + ')').join('; ') + '. The targets are yours to set; these only describe the game as it is.</p>\n';
        h += '<div class="tw"><table class="sortable"><thead><tr><th>Form</th><th>Role</th><th class="n">Score</th><th>Best mode</th><th class="n">of it, support</th><th class="n">Everyday</th><th class="n">Target</th><th>Verdict</th></tr></thead><tbody>\n';
        for (const f of forms) { const v = verdict(f); h += '<tr><td><b>' + esc(f.name) + '</b></td><td>' + esc(f.role) + '</td><td class="n">' + num(f.best.pts) + '</td><td>' + esc(modeName(f.best.mode)) + '</td><td class="n">' + num(sup(f.best)) + '</td><td class="n">' + num(f.main ? f.main.pts : null) + '</td><td class="n">' + num(target[f.role]) + '</td><td>' + (v === 'in band' ? v : '<b class="flag">' + v + '</b>') + '</td></tr>\n'; }
        h += '</tbody></table></div>\n';
        const above = forms.filter(f => verdict(f) === 'ABOVE').sort((a, b) => b.best.pts / target[b.role] - a.best.pts / target[a.role]), below = forms.filter(f => verdict(f) === 'BELOW').sort((a, b) => a.best.pts / target[a.role] - b.best.pts / target[b.role]);
        const weakAlt = []; for (const f of forms) if (f.main && f.main.pts > 0) for (const m of f.modes) if (m.mode !== 'main' && m.pts < f.main.pts * BAND_ALT) weakAlt.push({ f, m });
        h += '<h3>Flagged</h3>\n<ul>' + above.map(f => '<li><b>' + esc(f.name) + '</b> is <b>above</b> its band: ' + num(f.best.pts) + ' on its ' + esc(modeName(f.best.mode)) + ', ' + num(f.best.pts / target[f.role], 1) + '× the ' + esc(f.role.toLowerCase()) + ' target.</li>').join('') +
            below.map(f => '<li><b>' + esc(f.name) + '</b> is <b>below</b> its band: ' + num(f.best.pts) + ' at best (' + esc(modeName(f.best.mode)) + '), ' + Math.round(f.best.pts / target[f.role] * 100) + '% of the ' + esc(f.role.toLowerCase()) + ' target.</li>').join('') +
            weakAlt.map(x => '<li><b>' + esc(x.f.name) + '</b>&#39;s ' + esc(modeName(x.m.mode)) + ' scores ' + num(x.m.pts) + ', under its everyday attack&#39;s ' + num(x.f.main.pts) + '.</li>').join('') + (above.length + below.length + weakAlt.length ? '' : '<li>Nothing.</li>') + '</ul>\n';
        h += '<h2>3. Measured: what each mode did against three enemies</h2>\n<p class="mut">The trial (<code>tools/balance-trial.js</code>) fights each form for 20 seconds against three standing 1,000,000-HP ants, once on its everyday attack and once on each alternate. It was run on build <b>' + esc(M.build) + '</b>; run it again after a change (it takes several minutes), then <code>node tools/balance.js</code>. ' +
            'A heal is HP restored to a wounded ally. The status columns are <b>enemy-seconds</b>: how long enemies spent under each (the most possible is 60 for three enemies over 20 seconds). <b>Support</b> is those seconds turned into points as section 2 says.</p>\n';
        const ST = [['stun', 'Stunned'], ['glitch', 'Glitched'], ['blind', 'Blinded'], ['poison', 'Poisoned'], ['slow', 'Slowed'], ['lure', 'Lured to a decoy'], ['lureSelf', 'Lured onto itself']];
        h += '<div class="tw"><table class="sortable"><thead><tr><th>Form</th><th>Mode</th><th class="n">Points /s</th><th class="n">Damage /s</th><th class="n">Healing /s</th><th class="n">Assist /s</th><th class="n">Support /s</th>' + ST.map(x => '<th class="n">' + x[1] + '</th>').join('') + '<th class="n">Guard or decoy took /s</th></tr></thead><tbody>\n';
        for (const f of forms) for (const m of f.modes) h += '<tr><td><b>' + esc(f.name) + '</b></td><td>' + esc(modeName(m.mode)) + '</td><td class="n">' + num(m.pts) + '</td><td class="n">' + num(m.dmg) + '</td><td class="n">' + num(m.heal) + '</td><td class="n">' + num(m.assist) + '</td><td class="n">' + num(sup(m)) + '</td>' + ST.map(x => '<td class="n">' + num((m.st || {})[x[0]] || 0, 0) + '</td>').join('') + '<td class="n">' + num(m.block) + '</td></tr>\n';
        h += '</tbody></table></div>\n';
    } else h += '<h2>2. The score</h2>\n<p class="mut">No trial results yet (<code>design/balance-trial.json</code>): run <code>node tools/balance-trial.js</code>.</p>\n';

    // THE COVERAGE GRID (the owner, 2026-11-13: "you can have like a fire piercing damage or a flux crushing damage just every single thing at your disposal if you try to get it"): for each element and
    // each of the four types, the forms whose everyday attack or alternate is declared that type (DMG_FORM, js/damage.js). An empty cell is a pairing the player cannot get yet.
    { const TYPES = ['slashing', 'piercing', 'crushing', 'elemental'], els = []; for (const f of D.forms) if (els.indexOf(f.element) < 0) els.push(f.element);
      let empty = 0, rows = '';
      for (const e of els) { rows += '<tr><td>' + el({ element: e }) + '</td>'; for (const t of TYPES) { const who = []; for (const f of D.forms) if (f.element === e) { if (f.mainType === t) who.push(f.name + ' (everyday)'); if (f.altType === t) who.push(f.name + ' (alternate)'); if (f.extraType === t) who.push(f.name + ' (extra)'); } if (!who.length) empty++; rows += '<td>' + (who.length ? esc(who.join(', ')) : '<b class="flag">EMPTY</b>') + '</td>'; } rows += '</tr>\n'; }
      h += '<h2>4. The coverage grid: every element with every damage type</h2>\n<p>The rule: for each element and each of the four types, some form of that element has an attack of that type, so the player can bring it if they try. <b>' + (els.length * TYPES.length - empty) + ' of ' + (els.length * TYPES.length) + '</b> are filled' + (empty ? '; the empty ones are waiting for an attack to be designed' : '') + '. (The type shown is the attack&#39;s declared type; a move that deals no damage does not really fill its cell.)</p>\n' +
          '<div class="tw"><table><thead><tr><th>Element</th>' + TYPES.map(t => '<th>' + t.charAt(0).toUpperCase() + t.slice(1) + '</th>').join('') + '</tr></thead><tbody>\n' + rows + '</tbody></table></div>\n'; }

    // table 3: what each form does, as the game's INFO card says it
    h += '<h2>5. What each form does (the INFO card, in the game&#39;s own words)</h2>\n<p class="mut">Everyday attack, alternate moves, ability and Ultimate. Tap a form to open it.</p>\n<div class="tw"><table><thead><tr><th>Form</th><th>Attacks, abilities and Ultimate</th></tr></thead><tbody>\n';
    for (const f of D.forms) {
        h += '<tr><td><b>' + esc(f.name) + '</b><br><span class="tag">' + esc(f.element) + ' · ' + esc(f.role.toLowerCase()) + '</span></td><td>';
        for (const a of f.attacks) {
            h += '<details><summary>' + esc(a.h.replace(/^EVERYDAY · /, 'Everyday: ').replace(/^ALTERNATE · /, 'Alternate: ').replace(/^ULTIMATE · /, 'Ultimate: ').replace(/^ABILITY · /, 'Ability: ')) + '</summary><div class="rows">';
            if (a.note && a.note !== f.name) h += '<div class="mut">' + esc(a.note) + '</div>';
            for (const r of a.rows) if (r[0] !== 'CHARGE') h += '<div><span class="k">' + esc(r[0]) + '</span>' + esc(r[1]) + '</div>';
            h += '</div></details>';
        }
        h += '</td></tr>\n';
    }
    h += '</tbody></table></div>\n';
    h += '<script>\n(function(){ document.querySelectorAll("table.sortable").forEach(function(t){ var th=t.tHead.rows[0].cells; for (let i=0;i<th.length;i++) th[i].addEventListener("click", function(){ var b=t.tBodies[0], rows=Array.prototype.slice.call(b.rows), dir=th[i].dataset.d==="1"?-1:1; th[i].dataset.d=dir===1?"1":"-1";' +
        ' rows.sort(function(a,c){ var x=a.cells[i].textContent.trim(), y=c.cells[i].textContent.trim(), nx=parseFloat(x), ny=parseFloat(y); if(!isNaN(nx)&&!isNaN(ny)) return (nx-ny)*dir; return x.localeCompare(y)*dir; }); rows.forEach(function(r){ b.appendChild(r); }); }); }); })();\n</script>\n</body></html>\n';
    return h;
}

async function make() { const D = await collect(); return render(D, measured()); }
module.exports = { make };
if (require.main === module) {
    make().then(html => {
        const file = path.join(ROOT, 'balance.html');
        if (process.argv.includes('--check')) { let cur = ''; try { cur = fs.readFileSync(file, 'utf8'); } catch (e) {} if (cur !== html) { console.error('balance.html is not what the code makes now: run node tools/balance.js'); process.exit(1); } console.log('balance.html is up to date'); return; }
        fs.writeFileSync(file, html); console.log('balance.html written (' + html.length + ' bytes)');
    });
}
