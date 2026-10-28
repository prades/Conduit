// node design/roster-poster/portraits.js <out-dir> : renders every creature the game draws itself (the player, the follower egg in each element, the six predator species in
// every class) with the GAME'S OWN drawing code into <out-dir>/<id>.png (transparent, 360x360), for the roster sheet (roster-all.js). Needs playwright + chromium.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../..'), OUT = process.argv[2] || '/tmp/portraits';
const SIZE = 360;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/game.html'); await p.waitForTimeout(2500);
  // the player's and the egg's 3D sheets load on first use: ask for them and wait, or the first picture would be the flat fallback
  await p.evaluate(() => { ['player', 'player_angry'].concat(['fire', 'electric', 'ice', 'flux', 'core', 'toxic'].map(e => 'egg_' + e)).forEach(k => _hdImg(k)); }); await p.waitForTimeout(1500);
  const ids = await p.evaluate(() => {
    window.__portraits = {};
    tutorialMode = false; gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
    // one scratch canvas: the game's draw functions paint into the global ctx, so ctx is pointed at it for the length of each picture (as the index pictures do)
    const cv = document.createElement('canvas'); cv.width = cv.height = 360; const g = cv.getContext('2d'), keep = ctx;
    const shot = (id, scale, draw) => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 360, 360); g.setTransform(scale, 0, 0, scale, 180, 250);
      const bars = [_drawPredatorBars, drawHealthBar, drawUnitTag, drawAbilityCharge, drawPredatorDebug];
      _drawPredatorBars = () => {}; drawHealthBar = () => {}; drawUnitTag = () => {}; drawAbilityCharge = () => {}; drawPredatorDebug = () => {};
      ctx = g; try { draw(); } catch (e) { window.__err = (window.__err || '') + id + ': ' + e.message + ' '; } finally { ctx = keep; [_drawPredatorBars, drawHealthBar, drawUnitTag, drawAbilityCharge, drawPredatorDebug] = bars; }
      window.__portraits[id] = cv.toDataURL('image/png');
    };
    const ids = [];
    // the player: the black cube with its green visor
    player.angryTimer = 0; shot('player', 3.2, () => { const p = { x: 0, y: 0 }; for (let i = 0; i < 2; i++) drawPlayer(p); }); ids.push('player');
    // the follower egg, in each element
    for (const el of ['fire', 'electric', 'ice', 'flux', 'core', 'toxic']) {
      spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = 'brawler'; f.level = 5; f.health = f.maxHealth; f.dirX = 0.7; f.dirY = 0.7; f.walkCycle = 3; f.element = el; f.evolved = null; f.isFollower = true;
      shot('egg_' + el, 3.4, () => drawNPC(f, 0, 0, ctx)); ids.push('egg_' + el);
    }
    // predators: every species, every class
    for (const sp of Object.keys(SPECIES)) for (const cls of ['nymph', 'worker', 'scout', 'striker', 'tank', 'boss']) {
      const S = SPECIES[sp], def = (typeof getClassDef === 'function' ? getClassDef(S, cls) : S[cls]) || S.scout;
      const a = new Predator(cls, Object.assign({}, def, { color: S.color }), 0, 0); a.team = 'red'; a.speciesName = sp; a.className = cls; a.dirX = 0.8; a.dirY = 0.6; a.walkCycle = 2; a.state = 'wander';
      const k = cls === 'boss' ? 1.9 : cls === 'tank' ? 2.6 : cls === 'nymph' ? 4.2 : 3.4;
      shot(sp + '_' + cls, k, () => drawNPC(a, 0, 0, ctx)); ids.push(sp + '_' + cls);
    }
    // what the sheet says about each (read from the game's own tables)
    const meta = { species: {}, forms: Object.values(EVOLUTIONS).map(e => ({ id: e.id, name: e.name, element: e.element, role: e.duty === 'worker' ? 'worker' : e.role === 'sniper' ? 'mage' : e.role, move: e.move, legacy: !!e.legacy })), machines: {} };
    for (const sp of Object.keys(SPECIES)) { meta.species[sp] = { color: SPECIES[sp].color, rank: SPECIES[sp].rank, classes: {} }; for (const cls of ['nymph', 'worker', 'scout', 'striker', 'tank', 'boss']) { const d = SPECIES[sp][cls]; meta.species[sp].classes[cls] = { hp: d.health, power: d.power, special: !!d.abdomenAttack, range: d.rangeDamage || 0 }; } }
    window.__meta = meta;
    return ids;
  });
  const data = await p.evaluate(() => window.__portraits), err = await p.evaluate(() => window.__err || '');
  for (const id of ids) fs.writeFileSync(path.join(OUT, id + '.png'), Buffer.from(data[id].split(',')[1], 'base64'));
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(await p.evaluate(() => window.__meta)));
  console.log(ids.length + ' portraits', err ? 'ERRORS: ' + err : '', errs.slice(0, 3)); await b.close();
})();
