// THE GAME'S MAP, FOR THE 3D VIEW (view3d/gamemap.js; docs/VIEW-3D.md). The rooms as the running game has them, in the records the 3D room builders take
// (design/style-evolution/round2/chamber.js, design/style-evolution/live/floor.js): a room's tiles, walls, doors, wall fittings, floor marks, and every prop with the model
// variant the game picks for it. Run in the game's own page, in two places:
//   the game's 3D view (dist/view3d.js, made by tools/view3d.js): the map is read from the game as it stands when the view is built
//   the exporter (design/style-evolution/round2/export.js): the same code, run in a headless game, writes the test page's snapshot (design/style-evolution/live/lab.json)
// It reads the game's own names through VIEW3D_GAME, made in the page's outermost scope: inside the view's bundle some of those names mean other things.

const VIEW3D_GAME = (0, eval)(`({
  get fp() { return typeof _fp !== "undefined" ? _fp : null; }, get player() { return player; }, get actors() { return actors; }, get crystal() { return crystal; }, get frame() { return typeof frame !== "undefined" ? frame : 0; },
  get canvas() { return canvas; }, get TILE_W() { return TILE_W; }, get TILE_H() { return TILE_H; }, get wallH() { return FP_WALL_H; }, get wallT() { return typeof FP_WALL_T !== "undefined" ? FP_WALL_T : 1; },
  get pal() { return typeof FP_PAL !== "undefined" ? FP_PAL : null; }, get tank() { return typeof FP_TANK !== "undefined" ? FP_TANK : null; }, get roomStyle() { return typeof FP_ROOM_STYLE !== "undefined" ? FP_ROOM_STYLE : {}; },
  get antColour() { return typeof SPECIES !== "undefined" && SPECIES.ant ? SPECIES.ant.color : null; }, get species() { return typeof SPECIES !== "undefined" ? SPECIES : {}; },
  get psFamily() { return PS_FAMILY; }, psHash(s) { return _psHash(s); }, psResolve(fam, kind, dims, st, seed) { return _psResolve(fam, kind, dims, st, seed); },
  roomAt(x, y, F) { return facilityRoomAt(x, y, F); }, wallOut(w, F) { return _fpWallOut(w, w.a, w.b, F); }, heightAt(x, y, F) { return typeof facilityHeightAt === "function" ? facilityHeightAt(x, y, F) : 0; },
  get elevPx() { return typeof FP_ELEV_PX !== "undefined" ? FP_ELEV_PX : 0; }, roomHeight(id, F) { return typeof facilityRoomHeight === "function" ? facilityRoomHeight(id, F) : 0; }, liftPx(x, y) { return typeof facilityLiftPx === "function" ? facilityLiftPx(x, y) : 0; }, get camLift() { return typeof _fpCam !== "undefined" ? _fpCam : 0; },
  evolvedDef(f) { return typeof evolvedDef === "function" ? evolvedDef(f) : null; }, evoFrame(f, d, f0) { return _evoFrame(f, d, f0); }, eggSheet(f) { return typeof hdEggSheet === "function" ? hdEggSheet(f) : null; },
  playerState() { return typeof hdPlayerState === "function" ? hdPlayerState() : { row: 1, walking: false, f0: 0 }; }, playerGear(w) { return typeof playerGearSheet === "function" ? playerGearSheet(w) : null; },
  gearFacing(r) { return typeof playerGearFacing === "function" ? playerGearFacing(r) : r; },
  bugStyle(a) { return typeof bugBodyStyle === "function" ? bugBodyStyle(a) : null; }, walking(a) { return typeof creatureWalking === "function" ? creatureWalking(a) : false; }, isCreature(a) { return typeof Predator !== "undefined" && a instanceof Predator; },
  get EVO_MOLT() { return typeof EVO_MOLT !== "undefined" ? EVO_MOLT : 120; }, get EVO_SCALE() { return typeof EVO_SCALE !== "undefined" ? EVO_SCALE : 96 / 144; },
  get HD_UNIT() { return typeof HD_PX_PER_UNIT !== "undefined" ? HD_PX_PER_UNIT : 144 / 3.4; }, get HD_PLAYER() { return typeof HD_PLAYER_SCALE !== "undefined" ? HD_PLAYER_SCALE : 0.82; }, get HD_EGG() { return typeof HD_EGG_SCALE !== "undefined" ? HD_EGG_SCALE : 1; },
  burrowDepth(f) { return typeof burrowerDepth === "function" ? burrowerDepth(f) : null; }, swirling(f) { return typeof skinkSwirling === "function" && skinkSwirling(f); },
  visible(x, y) { return typeof visibleForDraw === "function" ? visibleForDraw(x, y) : true; }, shows(a) { return typeof facilityShowsActor === "function" ? facilityShowsActor(a) : true; },
  roomLight(id) { return typeof _fpRoomLight === "function" ? _fpRoomLight(id) : 1; }, tileLight(x, y, id) { return typeof _fpTileLight === "function" ? _fpTileLight(x, y, id) : 1; },
  get lit() { return typeof _fpLit === "function" ? _fpLit() : 1; }, get viewTurn() { return typeof VIEW3D !== "undefined" && VIEW3D.showing ? VIEW3D.turn : 0; }, get viewZoom() { return typeof VIEW3D !== "undefined" && VIEW3D.showing ? VIEW3D.zoom : 1; }, get viewTwist() { return typeof VIEW3D !== "undefined" && VIEW3D.showing ? (VIEW3D.twist || 0) : 0; }, get blackout() { return typeof facilityBlackout === "function" ? facilityBlackout() : false; }, get darkAmt() { return typeof _fpDarkAmt === "function" ? _fpDarkAmt() : (typeof FP_DARK !== "undefined" ? FP_DARK : 0.82); },
  get battleFighters() { return typeof cardBattleFighters === "function" ? cardBattleFighters() : null; },   // CARD BATTLES: everyone in the battle, for the view to keep in sight (view3d/gameview.js seeThrough)
  get battleCam() { return typeof cardBattleCam === "function" ? cardBattleCam() : null; },   // CARD BATTLES (js/cardbattle.js): the battle's camera, or null
  get lightOn() { return typeof _fp !== "undefined" && !!_fp && !!_fp.light; },
  // the sewers (js/facilitysewers.js): their water's colours as the 2D has them, the toxic green clearing as the purification runs; the Nest's state; its eggs, junk and rim where the
  // 2D puts them; the dam's pools
  sewerCol(h) { return typeof _fpSwCol === "function" ? _fpSwCol(h) : h; }, sewerTone(a, b) { return typeof _fpSwRgba === "function" ? _fpSwRgba(a, b, 1) : "rgb(" + a.join() + ")"; }, nestTone(f) { return typeof _fpNestTone === "function" ? _fpNestTone(f) : null; },
  sewerItems(F) { return typeof facilitySewerItems === "function" ? facilitySewerItems(F) : []; }, get damPools() { return typeof FP_DAM_POOLS !== "undefined" ? [...FP_DAM_POOLS] : []; },
  flightLift(a) { return a && a._flight && typeof techFlightLift === "function" ? techFlightLift(a) : 0; },
  // THE ATTACKS IN 3D (view3d/attacks.js): the effects the game is drawing, LOW graphics, and the Frost Maw's own measures (CHOMP's frames, the bite's slowing reach)
  get fx() { return typeof elementEffects !== "undefined" ? elementEffects : null; }, get gfxLow() { return typeof gfxLow !== "undefined" && !!gfxLow; },
  get mawChomp() { return typeof MAW_CHOMP !== "undefined" ? MAW_CHOMP : { snap: 16, total: 32 }; }, get mawSlowR() { return typeof MAW_SLOW_R !== "undefined" ? MAW_SLOW_R : 1.6; },
  // the fire line's (view3d/attacks_fire.js): the shots in flight (QUILL BURST's and QUILLSTORM's quills, the Ember Hood's FIREBALL), and the measures its looks follow (read once: the game's own constants)
  get shots() { return typeof followerProjectiles !== "undefined" ? followerProjectiles : null; },
  get fireMeasures() { const v = (n, d) => { try { const x = (0, eval)(n); return x === undefined ? d : x; } catch (e) { return d; } };
    return { emberDash: v("EMBER_DASH", 10), emberBand: v("EMBER_BAND", 0.8), quillAnim: v("QUILL_ANIM_FRAMES", 95), quillFire: v("QUILL_FIRE", 12), quillArc: v("QUILL_ARC", 16), meteor: v("ULT_METEOR", null), meteorCool: v("METEOR_COOL", 156),
      haloR: v("HALO_RADIUS", 1.2), magmaR: v("MAGMA_RADIUS", 1.5), faultTrace: v("TECH_AB", null) ? TECH_AB.fault.trace : 90 }; }
})`);

// the lab's ground floor: the eight rooms on the Crystal Chamber's level (the test page's, and the game's 3D view's first, docs/VIEW-3D.md stage 1)
const VIEW3D_LAB = ['crystal_chamber', 'teleport_room_1', 'front_lobby', 'security_room', 'show_room', 'lab_hallway', 'lounge', 'lab_passage'];
// the rooms the game's 3D view builds: the lab's ground floor and its other floors, up and down its stairs (stage 2: the Experiment Lab, the Stair Room, Teleport Room 2, the Observation Deck),
// and the arena with its catwalks and spur, its rock in the look the owner shaped (docs/VIEW-3D.md stage 2; a draft behind ?draft=arena until build 2026-11-17e)
const VIEW3D_ROOMS = VIEW3D_LAB.concat(['experiment_lab', 'teleport_stair_room', 'teleport_room_2', 'observation_deck', 'arena', 'catwalks', 'catwalk_spur', 'cold_storage', 'cold_tunnel', 'cold_annex', 'sewers']);

// a room in full. lab: with what a floor of many rooms needs besides (a round prop's radius, a window's name, the room's label). live: a tile carries its height if it has one, in the
// game's px ([x, y, h]: a floor off the ground floor's level, a staircase's tread), and the room its floor's (base)
function view3dRoomRecord(F, R, lab, live) {
  const G = VIEW3D_GAME, room = F.rooms.find(r => r.id === R);
  const strip = o => JSON.parse(JSON.stringify(o, (k, v) => k === 'raw' || k === 'note' ? undefined : v));
  const solid = s => {   // a prop, with the family and the variant of its model the game draws it from (js/propsprites.js)
    const circle = s.shape === 'circle', c = circle ? [s.at[0], s.at[1]] : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2];
    const fam = G.psFamily[s.kind] || null, seed = G.psHash(String(s.id)), dims = circle ? 'r' + Math.round(s.r * 100) : Math.round(s.bb[2] - s.bb[0]) + 'x' + Math.round(s.bb[3] - s.bb[1]);
    let variant = null;
    if (s.kind === 'plant') variant = seed % 3 === 0 ? 'd' + (seed % 2) : 'p' + (seed % 4);
    else if (s.kind === 'sentry') variant = 'a00';
    else if (fam) variant = G.psResolve(fam, s.kind, dims, s.kind === 'relay' || s.kind === 'charger' ? 'on' : null, seed);
    const o = { id: s.id, kind: s.kind, room: s.room, bb: s.bb, c, fam, variant, cover: !!s.cover, low: !!s.low }; if (lab && circle) o.r = s.r; if (s.poly && /^(river|pool|gate|boss_gate)$/.test(s.kind)) o.poly = s.poly.map(q => q.slice()); return o;   // (the lab floor's: a round prop's radius, for where one can walk)
  };
  const cells = []; for (let x = Math.floor(room.bb[0]); x <= Math.ceil(room.bb[2]); x++) for (let y = Math.floor(room.bb[1]); y <= Math.ceil(room.bb[3]); y++) { const r = G.roomAt(x, y, F); if (!r || r.id !== R) continue; const h = live ? G.heightAt(x, y, F) * G.elevPx : 0; cells.push(h ? [x, y, h] : [x, y]); }
  const walls = F.walls.filter(w => w.room === R).map(w => { const o = { a: w.a, b: w.b, kind: w.kind, out: G.wallOut(w, F) }; if (lab && w.window) { o.window = w.window; if (w.divider) o.divider = true; } return o; });   // (out: +1 a near wall, the room behind the face the camera sees; -1 a far wall; window: glass, or with divider a thin solid wall)
  const doors = (F.openings || []).filter(o => o.rooms && o.rooms.includes(R)).map(o => ({ id: o.id, a: o.a, b: o.b, to: o.rooms.find(x => x !== R), door: o.door }));
  const obj = (room.objects || []).find(o => o.type === 'objective');
  const rec = { id: R, poly: room.poly, bb: room.bb, cells, walls, doors, crystal: obj ? obj.at : null,
    fixtures: (F.fixtures || []).filter(f => f.room === R).map(strip), decor: (F.decor || []).filter(d => d.room === R).map(strip), floor: (F.floors || []).find(f => f.room === R) || null,
    solids: F.solids.filter(s => s.room === R).map(solid), style: G.roomStyle[R] || null };
  if (lab) rec.label = room.label || R; if (live) rec.base = G.roomHeight(R, F) * G.elevPx;
  if (live && (rec.solids.some(s => s.kind === 'river' || s.kind === 'pool') || rec.decor.some(d => d.kind === 'egg_cluster' || d.kind === 'junk'))) {   // (the Nest's eggs, the dam's junk and its rim, where the 2D puts them: js/facilitysewers.js)
    rec.nest = G.sewerItems(F).filter(it => it.room === R && (it.what === 'egg' || it.what === 'junk' || it.what === 'rim')).map(it => ({ what: it.what, x: it.x, y: it.y, s: it.s, seed: it.seed, u: it.u, w: it.w, half: it.half }));
    rec.dam = G.damPools.filter(id => rec.solids.some(s => s.id === id)); }
  if (live && room.raw && room.raw.structure) rec.structure = room.raw.structure; return rec;   // (structure: 'scaffold', the catwalks and the spur, steel decks: their edges stay steel)
}
// the map the builders take: the Crystal Chamber (the pictures' room), and with `ids` those rooms as one floor (`lab`) with the openings between them.
// live: for the game's own view. The Crystal stands where the game stands it (the middle of its tile: the pictures and the test page have it where the map's note is, half a tile off), and
// an opening the game hangs no door in (a stairway, a way left open, a mouth in the rock: js/facilityplay.js) has none here either.
function view3dMap(F, ids, live) {
  const G = VIEW3D_GAME, out = { chamber: view3dRoomRecord(F, 'crystal_chamber', false), wallH: G.wallH, wallT: G.wallT, pal: G.pal, tile: [G.TILE_W, G.TILE_H], antColour: G.antColour, tank: G.tank };
  if (ids) out.lab = { rooms: ids.map(id => view3dRoomRecord(F, id, true, live)), openings: (F.openings || []).filter(o => o.rooms && o.rooms.some(x => ids.includes(x))).map(o => ({ id: o.id, a: o.a, b: o.b, rooms: o.rooms, door: o.door || null, open: !!o.open })) };
  if (live) { const at = [G.crystal.x, G.crystal.y]; out.chamber.crystal = at; out.live = true;
    if (out.lab) { for (const r of out.lab.rooms) if (r.id === 'crystal_chamber') r.crystal = at;
      for (const o of out.lab.openings) { const src = F.openings.find(q => q.id === o.id); if (!src || src.cave || src.open || (F.connections || []).some(c => c.opening === o.id && c.ramp)) o.door = null; } } }
  return out;
}
