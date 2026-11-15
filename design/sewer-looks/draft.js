// SEWER LOOK DRAFTS (2026-11-15): one look drawn on the real game, photographed from fixed spots. Drafts only: nothing here is in the game.
//   node design/sewer-looks/draft.js <look.js> <name> [scale] [views]
// views: "o" an overview (zoomed out), "b" the north bank by Side Quest's passage, "a" the west bridge. Pictures go to $OUT (default: the system's temp folder, sewer-looks).
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs'), os = require('os');
const lookFile = process.argv[2], name = process.argv[3] || 'look', scale = +(process.argv[4] || 1), views = (process.argv[5] || 'ob').split('');
const OUT = process.env.OUT || path.join(os.tmpdir(), 'sewer-looks'); fs.mkdirSync(OUT, { recursive: true });
const GAME = 'file://' + path.join(__dirname, '..', '..', 'game.html') + '?dev';
const VIEWS = { a: { at: [-39.5, 112], zoom: 1 }, b: { at: [-30, 109], zoom: 1 }, o: { at: [-30, 111.5], zoom: 0.7 } };
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: scale });
  const logs = []; p.on('pageerror', e => logs.push('ERR ' + e)); p.on('console', m => { if (/floor|item|look/i.test(m.text())) logs.push(m.text()); });
  await p.goto(GAME); await p.waitForTimeout(3500);
  await p.addStyleTag({ content: 'body > *:not(canvas) { visibility: hidden !important; }' });   // (the page's own controls out of the picture)
  for (const f of [path.resolve(lookFile), path.join(__dirname, 'common.js')]) await p.evaluate(src => (0, eval)(src), fs.readFileSync(f, 'utf8'));
  await p.evaluate(() => { facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3;
    if (typeof playerClassKey !== 'undefined' && !playerClassKey) { playerClassKey = 'gunslinger'; if (typeof classPicker_off === 'function') classPicker_off(); }
    for (const id of Object.keys(_fp.relays)) relaySetOnline(id);   // (every room lit)
    SL.restyle(); SL.addItems(); });
  for (const v of views) {
    const V = VIEWS[v]; if (!V) continue;
    const place = V => { actors = actors.filter(a => !(a instanceof Predator)); player.x = player.targetX = player.visualX = V.at[0]; player.y = player.targetY = player.visualY = V.at[1]; player.fpPath = null;
      followers.forEach((f, i) => { f.x = f.visualX = V.at[0] - 1.2 + i * 0.9; f.y = f.visualY = V.at[1] - (i % 2 ? 0.7 : 1.4); f.fpPath = null; }); if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0; };
    await p.evaluate(V => { if (typeof setViewZoom === 'function') setViewZoom(V.zoom); gameState.running = true; }, V);
    await p.evaluate(`(${place.toString()})(${JSON.stringify(V)})`); await p.waitForTimeout(1800);
    await p.evaluate(`(${place.toString()})(${JSON.stringify(V)})`); await p.waitForTimeout(120);
    await p.evaluate(() => { gameState.running = false; }); await p.waitForTimeout(60);   // (still: the squad where it was put)
    await p.screenshot({ path: path.join(OUT, `${name}_${v}.png`) });
    await p.evaluate(() => { gameState.running = true; });
  }
  console.log(logs.slice(0, 12).join('\n') || `${name}: ${views.join(', ')} -> ${OUT}`);
  await b.close();
})();
