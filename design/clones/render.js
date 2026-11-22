// THE CLONES IN 3D: the pictures (design/clones/drafts.js; Proposed, drafts for the owner, nothing in the game). After design/insects/render.js (claude/menacing-insects).
//   node design/clones/render.js <out dir> [scenes, comma-separated: marks, beetle, scorpion, spider, mantis, moth, rolypoly; default all]
// The game's own page in headless Chromium (software WebGL), ?dev&cards&engine=3d, a card battle in the Crystal Chamber with the player, three followers and the Mutator's
// clone against three creatures, at the battle's own camera; then close views by a camera of this script's. dist/view3d.js is served with drafts.js put inside it and
// its ant() opened to every species drafts.js builds and to clones (PATCHES); the file on disk is not changed. A scene changes the battle's creatures' and the clone's
// species in place (their species, class, size and colour: what the view and the 2D drawing read), so one battle serves every scene.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2], WANT = (process.argv[3] || 'marks,mantis,beetle,scorpion,spider,moth,rolypoly').split(',');
const SPECIES_MARK = process.env.MARK || 'A';   // the clone's mark on the species' pictures
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const MARK = '/* design/style-evolution/live/floor.js */';
const PATCHES = [
  ["GM.bugStyle(a) !== 'ant' || !ANT_W[a.className] || a.isNymph || a.isClone || a.team === 'green')", "!window.__CD.ok(a) || a.isNymph)"],
  ["const w = a.dimensions && a.dimensions.width > 0 ? a.dimensions.width : ANT_W[a.className], size = Math.round(50 * w / ANT_W[a.className]) / 100, accent = a.color || ANT_COLOUR,", "const w = window.__CD.w(a), size = window.__CD.size(a), accent = window.__CD.accent(a),"],
];
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'game.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (u === '/dist/view3d.js') { let s = fs.readFileSync(f, 'utf8'); const i = s.indexOf(MARK); if (i < 0) throw new Error('no ' + MARK);
    s = s.slice(0, i) + '\n' + fs.readFileSync(path.join(__dirname, 'drafts.js'), 'utf8') + '\n' + s.slice(i);
    for (const [a, b] of PATCHES) { if (s.split(a).length !== 2) throw new Error('patch not found once: ' + a.slice(0, 60)); s = s.replace(a, b); }
    r.writeHead(200, { 'content-type': MIME['.js'] }); r.end(s); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&cards&engine=3d&sharp=2`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed'), null, { timeout: 240000 });
  const info = await p.evaluate(() => { try {
    facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    window.requestAnimationFrame = function () { return 0; }; gfxLow = false; _fp.gfxSaved = 'high'; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear();
    try { classChoose('mutator', true); } catch (e) {} classPickerOpen = false;
    const put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
    actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0;
    const cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; put(c0[0], c0[1]);
    const mk = (ev, dx, dy) => { const D = EVOLUTIONS[ev]; spawnFollowerAtCrystal(D.element); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + dx; f.y = player.y + dy;
      f.element = D.element; f.role = D.role; f.evolved = ev; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f); f.health = f.maxHealth = 1e6; return f; };
    const fs3 = [mk('maw', 0.4, 0.8), mk('embercowl', 0.9, -0.3), mk('thunderhead', 0.2, -0.9)];
    // THE MUTATOR'S CLONE: grown as the Clone Bay grows it (js/clone.js makeClone), its primary clone (js/mutator.js), a member of the squad (js/party.js partyClone)
    const cl = makeClone('ant', 'scout', player.x + 1.0, player.y + 0.4, 'wander', { level: 8, xp: 0 }); cl.primary = true; cl.upgrades = {}; cl.invested = 0; cl.health = cl.maxHealth = 1e6; cl.moveSpeed = cl.baseMoveSpeed = 0;
    partyTick();
    const foe = (cls, x, y) => { const e = spawnCreature({ species: 'ant', className: cls }), q = _fpNearestCellOpen(x, y); e.x = q[0]; e.y = q[1]; e.health = e.maxHealth = 1e6; e.provoked = false; e.state = 'wander'; e.moveSpeed = e.baseMoveSpeed = 0; return e; };
    const foes = [foe('scout', player.x + 3, player.y + 0.2), foe('scout', player.x + 3.4, player.y + 1.4), foe('tank', player.x + 3.3, player.y - 1.1)];
    const keep = () => { for (const a of foes) { a.health = a.maxHealth; a.state = 'wander'; a.dirX = -1; a.dirY = 0; a.attackAnim = 0; } for (const f of fs3) f.health = f.maxHealth; cl.health = cl.maxHealth; cl.state = 'wander'; cl.dirX = 1; cl.dirY = 0; player.health = player.maxHealth; };
    const tick = n => { for (let i = 0; i < n; i++) { keep(); render(); } };
    tick(4); const chose = cardBattleChoose(foes[0]); tick(140);
    window.__S = { foes, fs3, cl, tick, keep };
    return { ok: true, chose, phase: cardBattlePhase(), n: cardBattleFoes().length, clone: !!partyClone(), inSquad: typeof _cbSquadNow === 'function' ? _cbSquadNow().indexOf(cl) >= 0 : null, view: VIEW3D.state, err: VIEW3D.error };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } });
  console.log('setup', JSON.stringify(info));
  if (!info.ok) { console.log(errs.slice(0, 5).join('\n')); await b.close(); srv.close(); process.exit(1); }
  // a scene: the battle's three creatures and the clone made the species and classes asked (in place), the clone's mark set
  const scene = (sp, foeCls, cloneCls, mark) => p.evaluate(([sp, foeCls, cloneCls, mark]) => { window.__CD.mark = mark; window.__CD.off = false;
    const set = (a, cls) => { const D = getClassDef(SPECIES[sp], cls); a.speciesName = sp; a.className = cls; a.dimensions.width = D.width; a.dimensions.height = D.height; if (!a.isClone) a.color = SPECIES[sp].color; else a.color = SPECIES[sp].color; };
    __S.foes.forEach((a, i) => set(a, foeCls[i])); set(__S.cl, cloneCls); if (typeof unitSetNick === 'function') unitSetNick(__S.cl, sp === 'mantis' && cloneCls === 'tank' ? 'Emotional Support 💚' : null);
    __S.tick(20); if (typeof dialogueClear === 'function') dialogueClear(); if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0; __S.tick(2); return VIEW3D.view.stats ? { bodies: VIEW3D.view.stats.bodies } : {}; }, [sp, foeCls, cloneCls, mark]);
  const battle = async (file, twoD) => { await p.evaluate(t => { window.__CD.off = !!t; __S.tick(8); if (typeof dialogueClear === 'function') dialogueClear(); if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0; __S.tick(2); }, !!twoD); await p.screenshot({ path: path.join(OUT, file) }); await p.evaluate(() => { window.__CD.off = false; __S.tick(2); }); };
  // the close camera (the insects' render's): a camera of our own on the view's own drawing, the 2D canvas and the HUD hidden, only the bodies asked shown
  const closeMode = on => p.evaluate(on => { const cv0 = document.getElementById('view3dCanvas');
    for (const el of document.querySelectorAll('body *')) if (el !== cv0 && !el.contains(cv0)) { if (on) { el.dataset.vis = el.style.visibility; el.style.visibility = 'hidden'; } else el.style.visibility = el.dataset.vis || ''; }
    if (!window.__cam) { const V = VIEW3D.view, sc = V.core.scene; window.__cam = new THREE.PerspectiveCamera(30, cv0.clientWidth / cv0.clientHeight, 0.05, 200);
      window.__mine = []; window.__solo = keep => sc.traverse(o => { if (o.userData && o.userData.body) { if (o.userData._was === undefined) o.userData._was = o.visible; o.visible = keep ? keep.includes(o) : o.userData._was; } });
      window.__aim = (c, ry, dist, hgt, yaw, look) => { const T = THREE, cam = __cam, fx = Math.cos(ry), fz = -Math.sin(ry), a = Math.atan2(fz, fx) + yaw;
        cam.aspect = cv0.clientWidth / cv0.clientHeight; cam.updateProjectionMatrix(); cam.position.set(c.x + Math.cos(a) * dist, c.y + hgt, c.z + Math.sin(a) * dist);
        cam.lookAt(new T.Vector3(c.x, c.y + look, c.z)); cam.updateMatrixWorld(); V.core.aimLight(c.x, c.z, 14); V.core.draw(cam); }; }
    if (!on) { __solo(null); for (const h of __mine) h.visible = false; } }, on);
  // bodies of our own, built as the view builds an ant's (view3d/core.js antBody: the poses, the toon look, the ink), stood side by side on the battle's floor and looked at
  //   list: [species, class, clone?, pose (5 stand, 4 bite, 0..3 walk), dz]; at: where (the first creature's place)
  const close = (file, list, cam) => p.evaluate(([list, cam]) => { const V = VIEW3D.view, T = THREE; for (const h of __mine) h.visible = false; __solo([]);
    const a0 = __S.foes[0], base = new T.Vector3(a0.x - 0.6, 0, a0.y); let y0 = 0; V.core.scene.traverse(o => { if (o.userData && o.userData.body && o.userData._was && Math.hypot(o.position.x - a0.x, o.position.z - a0.y) < 0.6) y0 = o.position.y; }); base.y = y0;
    for (const [sp, cls, clone, pose, dz, dx, ry] of list) { const acc = sp + '|' + SPECIES[sp].color + '|' + (clone ? window.__CD.mark : ''), w = (window.__CD.W[sp] || { scout: 22, striker: 28, tank: 36 })[cls];
      const B = V.core.antBody(cls, { size: 0.5, zk: 2, stand: true, accent: sp === 'ant' && !clone ? SPECIES.ant.color : acc }); B.holder.visible = true; B.holder.userData.body = false; __mine.push(B.holder);
      B.poses.forEach((g, i) => g.visible = i === pose); B.holder.position.set(base.x + (dx || 0) - Math.sin(cam[2]) * dz, base.y, base.z + Math.cos(cam[2]) * dz); B.holder.rotation.y = ry || 0; B.holder.updateMatrixWorld(true); }
    __aim(base, 0, cam[0], cam[1], cam[2], cam[3]); }, [list, cam]).then(() => p.$('#view3dCanvas')).then(el => el.screenshot({ path: path.join(OUT, file) }));
  const say = s => console.log(s), window_noop = async () => {};

  // ── 1. HOW A CLONE SHOWS IT IS YOURS: an ant scout clone (the Stalker D) beside an enemy ant scout, each mark ──
  if (WANT.includes('marks')) for (const m of ['A', 'B', 'C']) {
    await scene('ant', ['scout', 'scout', 'tank'], 'scout', m); if (!process.env.PAIRS) await battle('mark' + m + '-battle.png');
    await closeMode(true);
    await close('mark' + m + '-pair.png', [['ant', 'scout', false, 5, 0.36], ['ant', 'scout', true, 5, -0.36]], [2.3, 1.0, 0.62, 0.12]);
    if (!process.env.PAIRS) await close('mark' + m + '-top.png', [['ant', 'scout', false, 5, 0.36], ['ant', 'scout', true, 5, -0.36]], [2.4, 2.0, 0.0, 0.0]);
    await closeMode(false); say('mark ' + m);
  }
  // ── 2. THE SPECIES: three of it against yours, and a clone of it in your squad; close views ──
  const SP = { mantis: { foes: ['scout', 'striker', 'tank'], clone: 'tank' }, beetle: { foes: ['scout', 'scout', 'tank'], clone: 'scout' }, scorpion: { foes: ['scout', 'scout', 'tank'], clone: 'scout' },
    spider: { foes: ['scout', 'scout', 'tank'], clone: 'scout' }, moth: { foes: ['scout', 'scout', 'tank'], clone: 'scout' }, rolypoly: { foes: ['scout', 'scout', 'tank'], clone: 'scout' } };
  for (const sp of Object.keys(SP)) { if (!WANT.includes(sp)) continue; const S = SP[sp];
    await p.evaluate(m => { window.__CD.mark = m; }, SPECIES_MARK); if (!process.env.PAIRS) { await scene(sp, S.foes, S.clone, SPECIES_MARK); await battle(sp + '-battle.png'); await battle(sp + '-battle2d.png', true); }
    await closeMode(true);
    const big = sp === 'scorpion' ? 1.15 : 1;
    await close(sp + '-pair.png', [[sp, 'scout', false, 5, 0.42 * big], [sp, 'scout', true, 5, -0.42 * big]], [2.6 * big, 1.05 * big, 0.62, 0.15]);
    if (!process.env.PAIRS) await close(sp + '-scout.png', [[sp, 'scout', false, 5, 0]], [1.55 * big, 0.6, 0.75, 0.13]);
    if (!process.env.PAIRS) await close(sp + '-bite.png', [[sp, 'scout', false, 4, 0]], [1.55 * big, 0.6, 0.75, 0.13]);
    if (!process.env.PAIRS) await close(sp + '-side.png', [[sp, 'scout', false, 1, 0]], [1.5 * big, 0.32, 1.57, 0.13]);
    await close(sp + '-tank.png', [[sp, 'tank', false, 5, 0.6 * big], [sp, 'tank', true, 5, -0.6 * big]], [3.4 * big, 1.4 * big, 0.62, 0.2]);
    await closeMode(false); say('species ' + sp);
  }
  // triangles in one body (one pose: the view shows one at a time), as built (before the view merges its still parts)
  const tri = await p.evaluate(() => { const count = g => { let n = 0; g.traverse(o => { if (o.isMesh && o.geometry) { const gg = o.geometry; n += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return Math.round(n); };
    const out = {}, K = window.__antKit; for (const sp of ['ant', 'beetle', 'scorpion', 'spider', 'mantis', 'moth', 'rolypoly']) for (const cls of ['scout', 'tank']) for (const mk of ['', 'B']) {
      const g = K.build({ cls, size: 0.5, zk: 2, walk: 0, stand: true, accent: sp + '|' + SPECIES[sp].color + '|' + mk }); out[sp + ':' + cls + (mk ? '+ring' : '')] = count(g); }
    return out; });
  console.log('triangles', JSON.stringify(tri));
  // the cost of a frame of the battle (headless Chromium with software WebGL: nothing of an iPad), the clone and creatures in 3D, then left to the 2D
  const cost = {};
  for (const [sp, fc] of [['ant', ['scout', 'scout', 'tank']], ['mantis', ['scout', 'striker', 'tank']], ['scorpion', ['scout', 'scout', 'tank']]]) { await scene(sp, fc, sp === 'mantis' ? 'tank' : 'scout', 'A');
    cost[sp] = await p.evaluate(() => { const r = {}; for (const [k, off] of [['in3d', false], ['left2d', true]]) { window.__CD.off = off; __S.tick(4); let ms = 0, n = 12; const t0 = performance.now(); for (let i = 0; i < n; i++) { __S.tick(1); ms += VIEW3D.view.stats.ms; } const st = VIEW3D.view.stats;
      r[k] = { frameMs: +((performance.now() - t0) / n).toFixed(0), viewMs: +(ms / n).toFixed(1), draws: st.draws, tris: st.tris, bodies: st.bodies }; } window.__CD.off = false; return r; }); }
  console.log('cost', JSON.stringify(cost));
  console.log('errors', JSON.stringify(errs.slice(0, 8)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
