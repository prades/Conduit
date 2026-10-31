// node design/bible/pictures.js [rooms] [ui] [map] [cards] [creatures] [forms] [poster] : makes the game bible's pictures (bible.html) from the game itself, into img/bible as WebP.
// With no argument it makes them all. Needs playwright + chromium, and ImageMagick's `convert` (for the WebP).
//   rooms      each room of the facility, powered and lit, the HUD hidden, the squad beside you (1400x900): img/bible/rooms/<id>.webp
//   ui         the screens at an iPad's size (1180x820: the HUD, a member's card, the Command Center, the SQUADS window, the class picker, the pack, the inspection map, the ? guide)
//              and a phone's (390x844: the HUD, the radial menu's ROSTER): img/bible/ui/<id>.webp
//   map        the inspection map alone (img/bible/ui/map.webp), for when the other screens are to be left as they are (`ui` makes it too)
//   cards      the CARDS screen at an iPad's width, tall enough to show it whole (shards, the hand, a booster pack's cards with a duplicate among them, the market's shelf), from seeded packs and a seeded shelf: img/bible/ui/cards_sheet.webp
//   creatures  every creature the game draws itself (the player, the egg in each element, six species in six classes), by design/roster-poster/portraits.js, trimmed
//   forms      the 18 evolved forms, cut from their sheets in img/evo (row 0, a three-quarter view; the ground layer under the four that have one), trimmed
//   poster     the evolution roster poster, by design/roster-poster/poster.js
// The graphics are held at HIGH (the slow-device check would turn them LOW in a headless browser), and a follower is never placed off the floor.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..'), OUT = path.join(ROOT, 'img/bible'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bible-pics-'));
const EXE = process.env.CHROMIUM_PATH || undefined;
const want = process.argv.slice(2), on = k => !want.length || want.includes(k);
const webp = (src, dst, q, extra) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); execFileSync('convert', [src].concat(extra || [], ['-quality', String(q), dst])); };

// where to stand for each room (tiles): its middle, or the floor nearest to it
const ROOMS = {
  crystal_chamber: [13.5, 19], computer_lab: [30, 15.5], security_room: [44, 16.5], show_room: [51.5, 22], main_hallway: [40, 23.5], experiment_lab: [29.5, 29.5],
  teleport_room_1: [13, 32], teleport_room_2: [52, 36], stair_room: [46, 35], observation_deck: [13, 43.5], arena: [33.5, 50], arena_culvert: [41, 44], arena_grates: [43.5, 51.5],
  catwalks: [53, 51.5], armory: [77.5, 52], cold_storage: [-34, 36.5], sewers_west: [-44, 111.5], sewers_mid: [-30, 111.5], sewers_east: [-14, 111.5], sewers_cistern: [-4, 110],
};
// the game, opened and powered: graphics HIGH, the blackout over, every relay online, five followers, and a helper that finds the floor nearest to a spot
async function openGame(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } }), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/game.html'); await p.waitForTimeout(2500);
  await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(200);
    gameState.running = true; crystalMenuOpen = false; _fp.gfxSaved = 'high'; gfxLow = false; if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    facilityBlackoutSet(false); for (const r of _fp.F.relays) { try { _fp.relays[r.id].online = true; for (const room of r.powers) facilityPower(room, true); } catch (e) {} }
    shardCount = 240; for (let i = followers.length; i < 5; i++) recruitFollower(); partyTick(); await wait(100);
    window.__near = (x, y) => { const F = _fp.F; if (facilityWalkable(x, y, F)) return [x, y]; for (let d = 0.5; d < 8; d += 0.5) for (let t = 0; t < 16; t++) { const qx = x + Math.cos(t * Math.PI / 8) * d, qy = y + Math.sin(t * Math.PI / 8) * d; if (facilityWalkable(qx, qy, F)) return [qx, qy]; } return [x, y]; };
    window.__stand = (x0, y0) => { const [x, y] = __near(x0, y0); floatingTexts.length = 0; _fp.portalCool = frame + 1e6; player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null;
      partyMembers().forEach((f, i) => { const q = __near(x + 1 + (i % 2), y + 0.6 + i * 0.5); f.x = f.targetX = f.visualX = q[0]; f.y = f.targetY = f.visualY = q[1]; f.fpPath = null; }); return (facilityRoomAt(x, y, _fp.F) || {}).id; };
  });
  return { p, errs };
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  if (on('rooms')) {
    const { p, errs } = await openGame(b, 1400, 900);
    await p.evaluate(() => { const st = document.createElement('style'); st.textContent = 'body > *:not(canvas):not(#gameCanvas) { visibility: hidden !important; }'; document.head.appendChild(st);
      window.drawFacilityNetworkHUD = () => {}; window.facilityDrawObjective = () => {}; window._tgAmmoDraw = () => {}; actors = actors.filter(a => !(a instanceof Predator)); });
    for (const [k, at] of Object.entries(ROOMS)) {
      const room = await p.evaluate(a => __stand(a[0], a[1]), at); await p.waitForTimeout(1100);
      const f = path.join(TMP, k + '.png'); await p.screenshot({ path: f }); webp(f, path.join(OUT, 'rooms', k + '.webp'), 78); console.log('rooms/' + k, room);
    }
    if (errs.length) console.log('page errors', errs.slice(0, 3)); await p.close();
  }
  const shot = async (p, k) => { await p.waitForTimeout(700); const f = path.join(TMP, k + '.png'); await p.screenshot({ path: f }); webp(f, path.join(OUT, 'ui', k + '.webp'), 80); console.log('ui/' + k); };
  if (on('ui')) {
    // the squad by the arena's tanks, a beetle tank locked (it stands still); the squad's XP spread along the way to evolving (the first is in its last level), so the bars have something to show
    const scene = p => p.evaluate(() => { __stand(30, 50); actors = actors.filter(a => !(a instanceof Predator));
      const at = (f, L, k) => { f.evolved = undefined; f.level = L; f.xp = xpForLevel(L) + k * (xpForLevel(L + 1) - xpForLevel(L)); _applyFollowerLevel(f, true); }; partyOrdered().forEach((f, i) => at(f, [9, 7, 5][i] || 7, [0.7, 0.45, 0.1][i] || 0.3)); partyPosted().forEach(f => at(f, 8, 0.4)); const e = spawnCreature({ species: 'beetle', className: 'tank' }), q = __near(player.x + 4, player.y - 1);
      e.x = q[0]; e.y = q[1]; e.state = 'wander'; e.provoked = false; e.moveSpeed = 0; e.baseMoveSpeed = 0; targetSet(e, true); floatingTexts.length = 0; selectedUnits.clear(); partyTick(); mixToolRender(true); });
    let { p } = await openGame(b, 1180, 820); await scene(p);
    await shot(p, 'hud_ipad');
    await p.evaluate(() => { document.querySelectorAll('#squadBar .sb-slot')[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); partyTick(); }); await shot(p, 'hud_card');
    await p.evaluate(() => { selectedUnits.clear(); partyTick(); ccOpen('roster'); }); await p.waitForTimeout(300);
    await p.evaluate(() => { const held = partyPosted()[0]; if (held) _ccFocus = held; ccRender(); }); await shot(p, 'command_center');
    await p.evaluate(() => { ccSquadsOpen = true; ccRender(); }); await shot(p, 'squads_window');
    await p.evaluate(() => { ccSquadsOpen = false; ccClose(); }); await p.waitForTimeout(200);
    await p.evaluate(() => { classPickerOpenNow(); }); await shot(p, 'class_picker');
    await p.evaluate(() => { classPickerOpen = false; invOpen(); }); await shot(p, 'pack');
    await p.evaluate(() => { invPanelOpen = false; facilityInspectToggle(); }); await shot(p, 'map');
    await p.evaluate(() => { facilityInspectToggle(); toggleControlsMenu(); }); await shot(p, 'guide');
    await p.close();
    ({ p } = await openGame(b, 390, 844)); await scene(p);
    await shot(p, 'phone_hud');
    await p.evaluate(() => { radialToggle(true); radialPick('roster'); }); await shot(p, 'phone_roster');
    await p.close();
  }
  if (want.includes('map')) {   // asked for by name only: with no argument the `ui` group has made it
    const { p, errs } = await openGame(b, 1180, 820);
    await p.evaluate(() => { facilityInspectToggle(); }); await shot(p, 'map');
    if (errs.length) console.log('page errors', errs.slice(0, 3)); await p.close();
  }
  if (on('cards')) {
    const { p, errs } = await openGame(b, 1180, 1500);
    await p.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      shardCount = 5000; equipFound = []; equipHand = []; equipCredits = 0; equipPackLast = null;
      for (let seed = 1; seed < 30 && !(equipPackLast && equipPackLast.dupes.length); seed++) equipPackOpen(seed);   // packs until one has a duplicate: the same cards each time
      equipFound.slice(0, 1).forEach(id => { equipUnlock(id); equipHandAdd(id); });                                  // one card kept for good, and in the hand
      equipShelfDeal(3); cardsOpen(); await wait(400);
    });
    await p.waitForTimeout(500); const f = path.join(TMP, 'cards_sheet.png'); await p.screenshot({ path: f }); webp(f, path.join(OUT, 'ui', 'cards_sheet.webp'), 80); console.log('ui/cards_sheet');
    if (errs.length) console.log('page errors', errs.slice(0, 3)); await p.close();
  }
  await b.close();
  if (on('creatures')) {
    const dir = path.join(TMP, 'portraits');
    execFileSync('node', [path.join(ROOT, 'design/roster-poster/portraits.js'), dir], { stdio: 'inherit' });
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.png'))) webp(path.join(dir, f), path.join(OUT, 'creatures', f.replace('.png', '.webp')), 88, ['-trim', '+repage', '-resize', '220x220>']);
    console.log('creatures: ' + fs.readdirSync(dir).filter(f => f.endsWith('.png')).length);
  }
  if (on('forms')) {
    const vm = require('vm'), ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/evolution.js'), 'utf8') + ';this.__E = EVOLUTIONS;', ctx);
    const ids = Object.values(ctx.__E).filter(e => !e.legacy).map(e => e.id);
    for (const id of ids) {
      const sheet = path.join(ROOT, 'img/evo', id + '.png'), ground = path.join(ROOT, 'img/evo', id + '_g.png'), cell = path.join(TMP, 'form_' + id + '.png');
      if (fs.existsSync(ground)) execFileSync('convert', [ground, '-crop', '144x144+0+0', '+repage', '(', sheet, '-crop', '144x144+0+0', '+repage', ')', '-composite', cell]);
      else execFileSync('convert', [sheet, '-crop', '144x144+0+0', '+repage', cell]);
      webp(cell, path.join(OUT, 'forms', id + '.webp'), 88, ['-trim', '+repage', '-resize', '220x220>']);
    }
    console.log('forms: ' + ids.length);
  }
  if (on('poster')) {
    const f = path.join(TMP, 'poster.png'); execFileSync('node', [path.join(ROOT, 'design/roster-poster/poster.js'), f], { stdio: 'inherit' });
    webp(f, path.join(OUT, 'poster.webp'), 82, ['-resize', '1800x']); console.log('poster');
  }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
})();
