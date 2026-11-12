// Bakes evolved-follower sprite sheets from the 3D design models.
// node design/evolutions/bake.js <three-dir> img/evo
// <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js).
// forms-core.js is the model code from designs.html (the design sheet).
// Each sheet: 8 rows (facings, game angle k*45°: +x, +x+y, +y, ...), 16
// columns (8 idle frames, then 8 action frames). Orthographic camera at the
// game's 2:1 iso angle; world +x (game x) projects down-right, +z (game y)
// down-left. Writes <id>.png and <id>.json (cell size and the ground anchor).
// THEN CROP IT (build 2026-11-09r): node design/evolutions/crop_sheets.js (each cell cut to its picture and packed; js/evopack.js updated). The game draws a full sheet
// too, but tests/perf.js asks for every form's sheet cropped.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], OUT = process.argv[3];
const core = fs.readFileSync(path.join(__dirname, 'forms-core.js'), 'utf8');
// forms2.js (helpers + Nos. 33-52), forms3.js (sentinels, robots, drones, Nos. 53-72) and forms4.js (ancient relics, Nos. 73-92), forms5.js (the corroded crystal, Nos. 93-103), forms6.js (the flux brawler, Nos. 104-115), forms7.js (the core mage, Nos. 116-125), forms8.js (the toxic brawler, Nos. 126-141), forms9.js (the core worker, Nos. 142-144), forms10.js (the ice maw, Nos. 145-157), forms11-13.js (the ammonite in its jar, Nos. 158-222), forms14.js (cloaks and pyramids, Nos. 223-331), forms15.js (the rock porcupine, Nos. 332-361) register FORMS2[no].
const f2src = fs.readFileSync(path.join(__dirname, 'forms2.js'), 'utf8'), f3src = fs.readFileSync(path.join(__dirname, 'forms3.js'), 'utf8'), f4src = fs.readFileSync(path.join(__dirname, 'forms4.js'), 'utf8'), f5src = fs.readFileSync(path.join(__dirname, 'forms5.js'), 'utf8'), f6src = fs.readFileSync(path.join(__dirname, 'forms6.js'), 'utf8'), f7src = fs.readFileSync(path.join(__dirname, 'forms7.js'), 'utf8'), f8src = fs.readFileSync(path.join(__dirname, 'forms8.js'), 'utf8'), f9src = fs.readFileSync(path.join(__dirname, 'forms9.js'), 'utf8'), f10src = fs.readFileSync(path.join(__dirname, 'forms10.js'), 'utf8'), f11src = fs.readFileSync(path.join(__dirname, 'forms11.js'), 'utf8'), f12src = fs.readFileSync(path.join(__dirname, 'forms12.js'), 'utf8'), f13src = fs.readFileSync(path.join(__dirname, 'forms13.js'), 'utf8'), f14src = fs.readFileSync(path.join(__dirname, 'forms14.js'), 'utf8'), f15src = fs.readFileSync(path.join(__dirname, 'forms15.js'), 'utf8'), f16src = fs.readFileSync(path.join(__dirname, 'forms16.js'), 'utf8'), f17src = fs.readFileSync(path.join(__dirname, 'forms17.js'), 'utf8'), f18src = fs.readFileSync(path.join(__dirname, 'forms18.js'), 'utf8'), f19src = fs.readFileSync(path.join(__dirname, 'forms19.js'), 'utf8'), f20src = fs.readFileSync(path.join(__dirname, 'forms20.js'), 'utf8'), f21src = fs.readFileSync(path.join(__dirname, 'forms21.js'), 'utf8'), f22src = fs.readFileSync(path.join(__dirname, 'forms22.js'), 'utf8'), f23src = fs.readFileSync(path.join(__dirname, 'forms23.js'), 'utf8'), f24src = fs.readFileSync(path.join(__dirname, 'forms24.js'), 'utf8'), f25src = fs.readFileSync(path.join(__dirname, 'forms25.js'), 'utf8'), f26src = fs.readFileSync(path.join(__dirname, 'forms26.js'), 'utf8'), f27src = fs.readFileSync(path.join(__dirname, 'forms27.js'), 'utf8'), f28src = fs.readFileSync(path.join(__dirname, 'forms28.js'), 'utf8'), f29src = fs.readFileSync(path.join(__dirname, 'forms29.js'), 'utf8'), f30src = fs.readFileSync(path.join(__dirname, 'forms30.js'), 'utf8'), f31src = fs.readFileSync(path.join(__dirname, 'forms31.js'), 'utf8'), f32src = fs.readFileSync(path.join(__dirname, 'forms32.js'), 'utf8'), f33src = fs.readFileSync(path.join(__dirname, 'forms33.js'), 'utf8'), f34src = fs.readFileSync(path.join(__dirname, 'forms34.js'), 'utf8'), f36src = fs.readFileSync(path.join(__dirname, 'forms36.js'), 'utf8'), f37src = fs.readFileSync(path.join(__dirname, 'forms37.js'), 'utf8'), f38src = fs.readFileSync(path.join(__dirname, 'forms38.js'), 'utf8'), f39src = fs.readFileSync(path.join(__dirname, 'forms39.js'), 'utf8'), f40src = fs.readFileSync(path.join(__dirname, 'forms40.js'), 'utf8'), f41src = fs.readFileSync(path.join(__dirname, 'forms41.js'), 'utf8');
const JOBS = [
  // No. 923 (forms38.js), the game sprite of No. 914: the CORAL CRAB (its name for now), BLOOM's Technician (approved 2026-11-08; sent to the game: "Coral crab into the game next").
  // Its idle is its walk (it steps on alternate pairs of its stake legs, its crystals glowing); its action rears and drives its head down (its crushing bite).
  // Bake it alone: node design/evolutions/bake.js <three> img/evo coralcrab 192 2.2667
  { id: 'coralcrab', form: 923, color: '#ff7ab8', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 922 (forms37.js), the game sprite of No. 911: SUNDEW, BLOOM's Brawler (approved 2026-11-08: "911, and make CONSUME his Ultimate"; sent to the game: "SUNDEW into the game").
  // Since build 2026-11-08n its sprite is No. 925, No. 924's NECTAR STING (the owner: "Bake it"): its action is the sting, its stem arching over to stab with the blade-leaf. Before it, No. 922's slash.
  // Its idle is its walk (its roots writhing); its action the blade-leaf's sting. `consume`: a third block of 8 frames, CONSUME (update's third argument, seconds since it swallowed):
  // four as its petals snap shut and its stem withers to the floor (the game plays them backward as it opens), then four of the bud throbbing, one throb, looped while it digests.
  // Bake it alone: node design/evolutions/bake.js <three> img/evo sundew 192 2.2667 (a 192 px cell, as the Electro Skink's and the THORNWHIP's)
  { id: 'sundew', form: 925, color: '#ff7ab8', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true, consume: [0.04, 0.12, 0.2, 0.5, 1.2, 1.4273, 1.6545, 1.8818] },
  // No. 921 (forms39.js), the game sprite of No. 920: the THORNWHIP (a working name), BLOOM's Mage, from the owner's pencil sketch and reviews (approved 2026-11-08: "Shrub into the game").
  // Its idle is its walk, a shuffle (it rocks side to side), its thorny black vines held out; its action is SEED SHOT: the vines rear round a glowing seed and whip out together.
  // Bake it alone in a 256 px cell with half 3.0222 (the same pixels a unit as the 144 px sheets, room for the whip at the other Mages' height): node design/evolutions/bake.js <three> img/evo shrub 256 3.0222
  { id: 'shrub', form: 921, color: '#ff7ab8', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 905 (forms36.js), the game sprite of No. 904: the ELECTRO SKINK, the new electric brawler (the owner's whiteboard sketch, reviewed through Nos. 900-904; "Okay, that's good. Send it.").
  // Its idle is its walk, an eel's fast slither with its legs paddling; its action is the rear and lunge; the tail's yellow glow and bolt are its own light.
  // (bigger since 2026-11-08: bake it alone in a 192 px cell with half 2.267, the same pixels a unit as the 144 px sheets: node design/evolutions/bake.js <three> img/evo electroskink 192 2.2667)
  { id: 'electroskink', form: 905, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 926 (forms40.js): the ELECTRO SKINK's SWIRL (draft; the owner, 2026-11-11). Idle block = the ring spinning (idleAct 2), action block = the bodies curling into it (no pulse).
  { id: 'skinkswirl', form: 926, color: '#ffe033', idleAct: 2, action: [0, 1.0], pulse: false, glowNormal: true },
  // Nos. 928-933 (forms41.js): six drafts of the Thunderhead's STATIC VORTEX as a tornado (2026-11-11). Round, so the idle block (8 frames) is the loop; bake in a 256 px cell: node design/evolutions/bake.js <three> <out> tornadoA,tornadoB,tornadoC,tornadoD,tornadoE,tornadoF 256 3.0222
  { id: 'tornadoA', form: 928, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.0 },
  { id: 'tornadoB', form: 929, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.0 },
  { id: 'tornadoC', form: 930, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.0 },
  { id: 'tornadoD', form: 931, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.0 },
  { id: 'tornadoE', form: 932, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.0 },
  { id: 'tornadoF', form: 933, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.0 },
  // THE STATIC VORTEX (the owner chose design C of the six, 2026-11-11: "C"): the dark storm funnel, form 930, the game's sheet for the Thunderhead's second attack (js/evolution.js staticVortexDraw): bake it alone:
  //   node design/evolutions/bake.js <three> img/evo staticvortex 256 3.0222   then node design/evolutions/crop_sheets.js
  { id: 'staticvortex', form: 930, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: false, unpremul: true, lookY: 2.5, single: true },
  // Nos. 880-882 (forms34.js), the user's pencil sketch (2026-11-01): the HOVER SHELL made sleek (one low hull, two tall prongs; its action fires the launcher) and the JELLY RAM
  // redone (a faceted glass head with a bubble lit blue white inside, a swirly collar orbiting its neck, seven fat tentacles, one curled; it swims and rams). The Jelly Ram was
  // approved ("The brawler looks good") and replaces the game's sheet of its name; the form it replaces bakes as jellyram_867, to compare.
  { id: 'hovershell_sleek', form: 880, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 882, the user's ask on No. 880 ("wings trapezoidal and a manta ray like mouth open and long and straight"): the dome with long straight trapezoid wings and an open
  // manta mouth. Approved ("Yes to all"): it is the game's hovershell; this id bakes the same form, as it was reviewed.
  { id: 'hovershell_manta', form: 882, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'jellyram_glass', form: 881, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'jellyram_867', form: 867, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // Nos. 870-871 (forms33.js), the last two technicians from the user's sheets: the BLIGHT SPIDER, toxic (it trots, its toxin bubbling; its action puffs toxin from the lens), and
  // the HOVER SHELL, electric (it hovers, shut; its action is the sheet's separation: the shell lifts, the shuttle's legs unfold, then it shuts).
  { id: 'blightspider', form: 873, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (No. 873, approved on the user's review: fine legs, lower to the ground)
  { id: 'blightspider_old', form: 870, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the first Blight Spider, before the review)
  // No. 873, the Blight Spider on fine legs, lower to the ground (the user's ask on 870): a candidate until approved.
  { id: 'blightspider_low', form: 873, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'hovershell', form: 882, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (No. 882, the sketch's manta, approved: "Yes to all"; it was No. 877, approved on the user's review: little trapezoid wings, angled gently down)
  { id: 'hovershell_877', form: 877, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the Hover Shell No. 882 replaced, to compare)
  { id: 'hovershell_old', form: 871, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the first Hover Shell, before the review)
  // No. 874, the Hover Shell with a star shuttle's trapezoid wings angled down (the user's ask on 871): a candidate until approved.
  { id: 'hovershell_wings', form: 874, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 875, the shuttle wings short and stubby, still crisp trapezoids; No. 876, no wings at all (the user's "no trapezoid wings", read both ways): candidates until one is approved.
  { id: 'hovershell_stub', form: 875, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'hovershell_bare', form: 876, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 877, the little trapezoids made even and angled gently down (the user: "I want the trapezoid wings, but I want them angled downward. Just make it subtle"): a candidate until approved.
  { id: 'hovershell_tilt', form: 877, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // Nos. 860-861 (forms32.js), from the user's sheets: the JELLY RAM, the core brawler (it hovers, its tentacles sway; its action is the charge: back, then a ram with a burst), in the
  // core element's teal (jellyram_blue: in the sheet's own blue, to compare); the RIMESTAR, the ice mage (it hovers, its fins sway; its action spins them a third of a turn and throws frost).
  { id: 'jellyram', form: 935, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true, blocks: [[0.05, 0.25, 0.55, 0.85, 1, 0.8, 0.45, 0.1].map(l => ({ lash: l, act: 0 }))] },   // (No. 935 since 2026-11-11: No. 881 with its everyday hit a tentacle lash: the sheet's extra block, columns 16-23; the owner: "Tentacle lash". Bake it in the 144 px cell as ever)   // (No. 881, the user's sketch of 2026-11-01: the glass head; it was No. 867, approved on the user's review: it swims like a jellyfish, seven fat wavy tentacles)
  { id: 'jellyram_old', form: 860, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the first Jelly Ram, before the review)
  { id: 'jellyram_blue', form: 860, color: '#2f6bff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 862, the Jelly Ram swimming, a little bigger (the user's ask on 860): a candidate until approved.
  { id: 'jellyram_swim', form: 862, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // Nos. 863-865, the swimming Jelly Ram with three tentacle shapes to choose from (the user: "I don't like tentacles shape"): candidates.
  { id: 'jellyram_goo', form: 863, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'jellyram_taper', form: 864, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'jellyram_string', form: 865, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 866, the strings, fewer and thicker (the user's pick of 865): a candidate until approved.
  { id: 'jellyram_strings7', form: 866, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 867, the seven strings fatter (the user's ask on 866): a candidate until approved.
  { id: 'jellyram_fat', form: 867, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'rimestar', form: 940, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true, blocks: [[{ spread: 0.1, ball: 0 }, { spread: 0.3, ball: 0.15 }, { spread: 0.55, ball: 0.4 }, { spread: 0.8, ball: 0.65 }, { spread: 1, ball: 0.9 }, { spread: 1, ball: 1 }, { spread: 0.6, ball: 0 }, { spread: 0.2, ball: 0 }].map(f => Object.assign(f, { act: 0 })),
    [{ fan: 0.15, cry: 0.1, rot: 0, blur: 0 }, { fan: 0.4, cry: 0.3, rot: 0.4, blur: 0.05 }, { fan: 0.7, cry: 0.55, rot: 0.95, blur: 0.14 }, { fan: 0.9, cry: 0.8, rot: 1.7, blur: 0.26 }, { fan: 1, cry: 1, rot: 2.6, blur: 0.4 }, { fan: 1, cry: 1, rot: 3.7, blur: 0.5 }, { fan: 1, cry: 1, rot: 4.9, blur: 0.52, go: 0.5 }, { fan: 0.7, cry: 0.7, rot: 5.6, blur: 0.2, go: 1 }].map(f => Object.assign(f, { act: 0 }))] },   // (the second extra block, columns 24-31: ICICLE VOLLEY's fan over its wind-up (0-5), the icicles leaving (6), the fan closing (7); the owner: "it turns into a fan and it shoots crystals at the enemy", i.e. a spinning office fan: the first draft, a folding fan, was superseded)   // (No. 939, forms32.js, since 2026-11-12: No. 861 with its everyday shot's flare: the sheet's extra block, columns 16-23: fins spreading and a ball of frost forming over the wind-up (0-5), gone as it is shot (6), settling (7); the owner: "Fins flare")
  // Nos. 851-853 (forms31.js), the technicians' forms from the user's sheets: the flux GOO PROXY as a frog (No. 853, which replaced No. 850 on the user's review: it breathes and
  // looks about; its action puffs the head and pops the eyes), the fire THERMITE BURROWER (it walks on the spot, the drill turning; its action spins the drill white-hot) and the
  // ice IGLOO SKATER (it glides; its action is a spin with a ring of frost).
  { id: 'gooproxy', form: 853, color: '#9933ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'gooproxy_old', form: 850, color: '#9933ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the first Goo Proxy, before the review)
  { id: 'thermite', form: 855, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (No. 855, approved on the user's review: the bear-like black tank animal)
  { id: 'thermite_old', form: 851, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the first Thermite Burrower, before the review)
  // No. 854, the Thermite Burrower in black with red accents (the user's ask on 851): a candidate until approved.
  { id: 'thermite_black', form: 854, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 855 is the game's Thermite Burrower now (above); thermite_bear bakes the same, for comparison.
  { id: 'thermite_bear', form: 855, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  { id: 'igloo', form: 857, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (No. 857, approved on the user's review: fitted bricks, four nested diamonds, runs like a train cart)
  { id: 'igloo_old', form: 852, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },   // (the first Igloo Skater, before the review)
  // No. 856, the Igloo Skater of fitted bricks on four nested diamonds (the user's ask on 852): a candidate until approved.
  { id: 'igloo_bricks', form: 856, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // No. 857, the same turned to run like a train cart, its narrow end first (the user's ask on 856): a candidate until approved.
  { id: 'igloo_cart', form: 857, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true, glowNormal: true },
  // Nos. 831-836, the clear glass egg on six dark metal leg sets: candidates.
  { id: 'lg_insect', form: 831, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'lg_strut', form: 832, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'lg_spider', form: 833, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'lg_piston', form: 834, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'lg_scythe', form: 835, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'lg_crab', form: 836, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  // Nos. 821-826, the follower egg with a CLEAR GLASS body again (the shell egg's legs and collar, the element crystal inside): candidates.
  { id: 'eg_clear',   form: 821, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'eg_facet',   form: 822, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'eg_ribbed',  form: 823, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'eg_half',    form: 824, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'eg_fluid',   form: 825, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'eg_capsule', form: 826, color: '#ff5522', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'eg_clear_ice', form: 821, color: '#99ddff', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'player', form: 814, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  { id: 'player_angry', form: 815, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  // Nos. 840-843, the player with its class gear (js/playergear.js): the Gunslinger's machine gun (carried low, and raised to fire), the Technomancer's spider mech, the Mutator's lab coat.
  { id: 'player_gun', form: 840, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  { id: 'player_gun_aim', form: 841, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  { id: 'player_laser', form: 844, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  { id: 'player_laser_aim', form: 845, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  { id: 'player_mech', form: 842, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  { id: 'player_coat', form: 843, color: '#19e6c1', idleAct: 0, action: [0, 1.0], rim: '#8d95a8' },
  // The follower egg as shipped: the clear glass body (No. 821) on the dark metal scythe legs (No. 835).
  { id: 'egg_fire', form: 835, color: '#ff3300', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'egg_electric', form: 835, color: '#ffee33', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'egg_ice', form: 835, color: '#99ddff', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'egg_flux', form: 835, color: '#9933ff', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'egg_core', form: 835, color: '#00ccaa', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  { id: 'egg_toxic', form: 835, color: '#66ff66', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  // BLOOM's egg (build 2026-11-08i): a toxic follower converted at the purification module (js/conversion.js) is BLOOM; unevolved, it is this egg in BLOOM's pink. Cropped as the others (js/hdsprites.js HD_BOX.egg).
  { id: 'egg_blossom', form: 835, color: '#ff7ab8', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  // The same egg before it has an element: the wild recruit you have not converted yet (grey crystal).
  { id: 'egg_neutral', form: 835, color: '#b4bcc8', idleAct: 0, action: [0, 1.0], brightCrystal: true },
  // Nos. 801-803, the follower egg candidates (element colour here: fire); Nos. 811-813, the player candidates (circuit teal).
  { id: 'egg_pod', form: 801, color: '#ff5522', idleAct: 0, action: [0, 1.0] },
  { id: 'egg_shell', form: 802, color: '#ff5522', idleAct: 0, action: [0, 1.0] },
  { id: 'egg_lantern', form: 803, color: '#ff5522', idleAct: 0, action: [0, 1.0] },
  { id: 'pl_runner', form: 811, color: '#19e6c1', idleAct: 0, action: [0, 1.0] },
  { id: 'pl_hover', form: 812, color: '#19e6c1', idleAct: 0, action: [0, 1.0] },
  { id: 'pl_mech', form: 813, color: '#19e6c1', idleAct: 0, action: [0, 1.0] },
  // No. 791 (the game sprite of 781, darkened), the electric brawler: a near-black ball with an exposed amber diamond core, one slim tread band, open shell plates, and a pair of long thick trapezoid brackets running down its back; static arcs between them. Its action frames spin the tread, flare the core and arc the static, up and back.
  { id: 'staticorb', form: 791, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true, keepSprites: true, glowNormal: true },
  // No. 640 (the game sprite of 637), the flux ("void") mage: the dark spined starfish carrying an orb of violet fluid with a diamond in it; the diamond turns and bubbles rise. Its action frames flare the orb, up and back.
  { id: 'voidstar', form: 943, color: '#9933ff', idleAct: 0, action: [0, 1.0], pulse: true, keepSprites: true, glowNormal: true,
    blocks: [[{ lift: 0.15, thrust: 0 }, { lift: 0.35, thrust: 0 }, { lift: 0.6, thrust: 0 }, { lift: 0.8, thrust: 0 }, { lift: 0.95, thrust: 0 }, { lift: 1, thrust: 0 }, { lift: 1, thrust: 1 }, { lift: 0.4, thrust: 0.3 }].map(f => Object.assign(f, { act: 0 }))] },   // (No. 943, forms24.js, since 2026-11-12: No. 640 with the arms that face the enemy lifting and reaching over MAELSTROM's wind-up (columns 16-21), thrust as the swirl opens (22), lowering (23); the owner: "Lifts his front arms up towards the enemy")
  // The electric and fire designs swapped. The ring drone (No. 90, the old fire mage) now stands in for the electric brawler, in electric yellow: a placeholder.
  { id: 'voltring', form: 90, color: '#ffee33', idleAct: 0.1, action: [0.6, 1.0] },
  // The hooded pyramid with the hovering gems (No. 391, the old electric brawler) is now the fire mage, in fire red.
  { id: 'embercowl', form: 938, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, rim: '#ff6a3a', blocks: [[{ sw: 0.1, ball: 0 }, { sw: 0.3, ball: 0.15 }, { sw: 0.55, ball: 0.4 }, { sw: 0.8, ball: 0.65 }, { sw: 1, ball: 0.9 }, { sw: 1, ball: 1 }, { sw: 0.6, ball: 0 }, { sw: 0.2, ball: 0 }].map(f => Object.assign(f, { act: 0 })),
    [{ sw: 0.15, ball: 0, heat: 0.1 }, { sw: 0.35, ball: 0, heat: 0.3 }, { sw: 0.6, ball: 0, heat: 0.5 }, { sw: 0.85, ball: 0, heat: 0.7 }, { sw: 1.05, ball: 0, heat: 0.9 }, { sw: 1.2, ball: 0, heat: 1 }, { sw: 0.9, ball: 0, heat: 0.6 }, { sw: 0.4, ball: 0, heat: 0.25 }].map(f => Object.assign(f, { act: 0 }))] },   // (the second extra block, columns 24-31: HEXFIRE's lighting up over its wind-up (0-5), then letting go as the crater erupts (6, 7); the owner, 2026-11-12: "he lights up and then a crater erupts lava")   // (No. 938, forms17.js, since 2026-11-12: No. 391 with its everyday FIREBALL's flare: the sheet's extra block, columns 16-23: swelling and a fireball forming over the wind-up (0-5), gone as it is shot (6), settling (7); the owner: "Hood flare")   // (warm rim light: the hood reads as ember-black, not navy)
  // No. 579 (the game sprite of 578), the toxic brawler: a black faceted shell with a cone on its back on four splayed pins, one oozing eye, small leaks high on its flanks; the puddle it walks through is its ground sheet. Its action frames burst goo from the crater, up and back.
  { id: 'seeper', form: 936, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true, blocks: [[{ up: 0.1, fwd: 0.05, lean: -0.04, splat: 0 }, { up: 0.35, fwd: 0.1, lean: -0.1, splat: 0 }, { up: 0.6, fwd: 0.15, lean: -0.16, splat: 0 }, { up: 0.7, fwd: 0.25, lean: -0.18, splat: 0 }, { up: 0, fwd: 0.5, lean: 0.14, splat: 1 }, { up: 0, fwd: 0.5, lean: 0.1, splat: 0.7 }, { up: 0, fwd: 0.3, lean: 0.04, splat: 0.35 }, { up: 0, fwd: 0.1, lean: 0, splat: 0.1 }].map(f => Object.assign(f, { act: 0 }))] },   // (No. 936, forms22.js, since 2026-11-11: No. 579 with its everyday hit a leg stomp: the sheet's extra block, columns 16-23; the owner: "Leg stomp")
  // No. 543 (the game sprite of 541), the electric mage: a smooth cloud of dark gas over a flickering glow, a crown of black spikes, four glowing spikes circling its base, gas fins that ripple.
  // One turn of the beat: the cloud swings rather than turns, and the four identical glowing spikes advance a quarter-turn a loop, so it closes; its action frames spark arcs between the crown spikes.
  { id: 'thunderhead', form: 543, color: '#ffee33', idleAct: 0, action: [0, 1.0], pulse: true, keepSprites: true, glowNormal: true },
  { id: 'reaver', form: 'reaver', color: '#ffee33', idleAct: 0.3, action: [0.8, 1.0] },
  { id: 'bloom',  form: 'bunker', color: '#ff3300', idleAct: 0.2, action: [0.5, 1.0] },
  // The serpent's loop is one beat of 2.2 rad/s (period 2*PI/2.2); its action rears the head.
  { id: 'serpent', form: 's15', color: '#9933ff', idleAct: 0, action: [0.6, 1.0], period: 2 * Math.PI / 2.2 },
  // Design Nos. 57, 58, 68, 71 and 90 (numeric form = FORMS2[no]).
  { id: 'warden', form: 57, color: '#00ccaa', idleAct: 0.2, action: [0.62, 1.0] },
  // No. 701 (the game sprite of 689), the flux ("void") worker: a tall black saucer on jagged-forearm bug legs, violet rim lights chasing round it; its action frames (hauling) speed the lights and crouch it, up and back.
  { id: 'hauler', form: 701, color: '#9933ff', idleAct: 0, action: [0, 1.0], pulse: true },
  { id: 'manta',  form: 68, color: '#ffee33', idleAct: 0.2, action: [0.55, 1.0] },
  { id: 'pod',    form: 71, color: '#ffee33', idleAct: 0.2, action: [0.55, 1.0] },
  { id: 'halo',   form: 90, color: '#ff3300', idleAct: 0.1, action: [0.6, 1.0] },
  // No. 101, the toxic sniper: the pool's shift loops over the idle period; its action is the recoil of a shot.
  // No. 469 (the game sprite of 467), the core technician (it was the core brawler): a hammerheaded slug with a uniform hexagon tile cover either side of a spiked spine; its action frames lunge and flare the tiles, up and back.
  { id: 'hammerslug', form: 469, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 391 (the game sprite of 388), the electric brawler: the hood with black hex crystals that breathe, three hovering gems in a triangle before the diamond; it bounces.
  // No. 361, the fire brawler: a pitch-black cut gem with red shards, the two front spikes black; its action frames hunch it and bristle the quills, up and back.
  // No. 927 (forms15.js; draft 2026-11-11), the QUILLSTONE with its own attacks: the action block (cols 8-15) is its everyday hit's dive; then three extra blocks (job.blocks, 8 frames each, values handed to update(t, act, value)):
  //   16-23 QUILL BURST: it turns its back to the enemy (turn 0 to 1), the quills leave (fly) and shrink to nothing (q);   24-31 it turns back with no quills (turn 1 to 0), then they grow back (q 0 to 1);   32-39 standing with no quills (the idle loop).
  // Bake it alone in a 192 px cell (the dive needs room): node design/evolutions/bake.js <three> img/evo quillstone 192 2.2667   (it was 144 px, form 361, before: its sheet is bigger now, the same pixels a unit)
  { id: 'quillstone', form: 927, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, blocks: [
    [{ turn: 0.12, q: 1 }, { turn: 0.4, q: 1 }, { turn: 0.8, q: 1 }, { turn: 1, q: 1, act: 0.5 }, { turn: 1, q: 0.9, fly: 0.6, act: 0.5 }, { turn: 1, q: 0.5, fly: 1.3 }, { turn: 1, q: 0.1, fly: 2.0 }, { turn: 1, q: 0, fly: 2.6 }],
    [{ turn: 0.85, q: 0 }, { turn: 0.6, q: 0 }, { turn: 0.3, q: 0 }, { turn: 0, q: 0 }, { turn: 0, q: 0.2 }, { turn: 0, q: 0.5 }, { turn: 0, q: 0.8 }, { turn: 0, q: 1 }],
    [0, 1, 2, 3, 4, 5, 6, 7].map(() => ({ turn: 0, q: 0 }))] },
  // No. 314 (a game-ready No. 312), the electric brawler: a black hollow pyramid hood drooping over the top half of an octahedron diamond; its action frames bow the hood and flare the diamond.
  { id: 'prism', form: 391, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 220, the core mage: a black shell-jar dragged on its side by fat irregular tentacles, a shard horn at its mouth; the horn drops to aim in its action frames.
  { id: 'hornshell', form: 942, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true,
    blocks: [[{ pull: 0.1, ring: 0 }, { pull: 0.3, ring: 0 }, { pull: 0.55, ring: 0 }, { pull: 0.8, ring: 0 }, { pull: 1, ring: 0 }, { pull: 1, ring: 0 }, { pull: 1, ring: 0.2 }, { pull: 0.5, ring: 0.42 }].map(f => Object.assign(f, { act: 0 })),
      [{ pull: 0.15, goo: 0 }, { pull: 0.4, goo: 0.2 }, { pull: 0.7, goo: 0.45 }, { pull: 0.95, goo: 0.7 }, { pull: 1, goo: 0.9 }, { pull: 1, goo: 1 }, { pull: 0.6, goo: 0 }, { pull: 0.2, goo: 0 }].map(f => Object.assign(f, { act: 0 }))] },   // (the second extra block, columns 24-31, No. 942: the everyday shot's goo ring growing as the arms are drawn in (0-5), the ring gone as it is shot (6), the arms coming out (7); the owner: "a 3D ring of water looking substance. It's glowing blue goo that shoots at the enemy")   // (No. 941, forms13.js, since 2026-11-12: No. 220 pulling its tentacles into the jar over ECHO PULSE's wind-up (columns 16-21), a ring of water on release (22), settling (23); the owner: "he pulls his arms inside and by doing that it creates a water ring")
  // No. 156, the ice brawler: a dome with a cave mouth; the rubble is its ground layer; its action frames are the bite (the fangs swing down), up and back.
  { id: 'maw', form: 934, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true, blocks: [
    [{ sw: 0.05, rot: -0.1, z: 0, y: 0.05, fang: 0.06 }, { sw: 0.18, rot: -0.25, z: 0.05, y: 0.15, fang: 0.08 }, { sw: 0.32, rot: -0.4, z: 0.08, y: 0.28, fang: 0.1 }, { sw: 0.45, rot: -0.5, z: 0.1, y: 0.4, fang: 0.11 },
     { sw: 0.55, rot: -0.58, z: 0.1, y: 0.5, fang: 0.12 }, { sw: 0.62, rot: -0.62, z: 0.1, y: 0.58, fang: 0.12 }, { sw: 0.65, rot: -0.64, z: 0.1, y: 0.62, fang: 0.12 }, { sw: 0.65, rot: -0.64, z: 0.1, y: 0.62, fang: 0.12 }],
    [{ sw: 0.55, rot: 0.32, z: 0.5, y: 0.05, fang: 0.24 }, { sw: 0.52, rot: 0.34, z: 0.55, y: 0.02, fang: 0.25 }, { sw: 0.44, rot: 0.3, z: 0.5, y: 0, fang: 0.23 }, { sw: 0.34, rot: 0.24, z: 0.4, y: 0, fang: 0.18 },
     { sw: 0.24, rot: 0.16, z: 0.3, y: 0, fang: 0.12 }, { sw: 0.14, rot: 0.1, z: 0.18, y: 0, fang: 0.06 }, { sw: 0.06, rot: 0.04, z: 0.07, y: 0, fang: 0.02 }, { sw: 0, rot: 0, z: 0, y: 0, fang: 0.0 }]] },   // (the extra blocks: CHOMP, rearing up and slamming down: forms10.js)   // (No. 934, forms10.js, since 2026-11-11: No. 156 with its everyday hit a lunge-bite: the body thrown forward; the owner)
  // No. 144, the core worker: a black jar with a thick glowing worm; its action frames push the worm out further (held while it works).
  { id: 'vessel', form: 144, color: '#00ccaa', idleAct: 0, action: [0.7, 1.0] },
  // No. 140, the toxic brawler: a matte black turtle-volcano; its action frames are the eruption (it hunkers, the goo bursts up), up and back down.
  { id: 'caldera', form: 140, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 120, the core mage (the role id is 'sniper'): its action frames are a pulse: the flower tilts forward and the petals fan open towards what it faces, then it settles.
  { id: 'petal', form: 120, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 114, the flux brawler: a Ditto-style blob with big black shards; its action frames are the slam (it flattens and spreads).
  { id: 'mimic', form: 937, color: '#9933ff', idleAct: 0, action: [0.55, 1.0], blocks: [[
    { up: 0.4, tilt: 0.3, grow: 1 }, { up: 0.9, tilt: 1, grow: 1 }, { up: 1, tilt: 1, grow: 0 }, { up: 0, tilt: 0, grow: 0 }, { up: 0, tilt: 0, grow: 0 }, { up: 0, tilt: 0, grow: 0.3 }, { up: 0, tilt: 0, grow: 0.65 }, { up: 0, tilt: 0, grow: 1 }].map(f => Object.assign(f, { act: 0 }))] },   // (No. 937, forms6.js, since 2026-11-11: No. 114 with its everyday hit a SHARD SHOT: the sheet's extra block, columns 16-23: the big shard rises and tips at the enemy (0-1), is shot off (2), gone (3-4), grows back (5-7); the owner)
  { id: 'rotshard', form: 944, color: '#14c040', idleAct: 0, action: [0.5, 1.0],
    blocks: [[{ split: 0.15, go: 0 }, { split: 0.35, go: 0 }, { split: 0.55, go: 0 }, { split: 0.75, go: 0 }, { split: 0.92, go: 0 }, { split: 1, go: 0 }, { split: 1, go: 0.45 }, { split: 0, go: 0 }].map(f => Object.assign(f, { act: 0 }))] },   // (No. 944, forms5.js, since 2026-11-12: No. 101 with a second black crystal growing out of the pool over ROTTEN DECOY's wind-up (columns 16-21), breaking free (22) and gone (23); the owner: "the crystal splits")
].filter(j => !process.argv[4] || process.argv[4].split(',').includes(j.id));
// optional 5th and 6th arguments: the cell in px and half the view in world units (the class gear is wider than the cube: 186 and 2.2 keep the pixels per unit the same as the 144 / 1.7 of the rest)
const CELL = +process.argv[5] || 144, HALF = +process.argv[6] || 1.7, LOOK_Y = 1.15;

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__bake = async function (jobs, CELL, HALF, LOOK_Y) {
  ${core}
  ${f2src}
  ${f3src}
  ${f4src}
  ${f5src}
  ${f6src}
  ${f7src}
  ${f8src}
  ${f9src}
  ${f10src}
  ${f11src}
  ${f12src}
  ${f13src}
  ${f14src}
  ${f15src}
  ${f16src}
  ${f17src}
  ${f18src}
  ${f19src}
  ${f20src}
  ${f21src}
  ${f22src}
  ${f23src}
  ${f24src}
  ${f25src}
  ${f26src}
  ${f27src}
  ${f28src}
  ${f29src}
  ${f30src}
  ${f31src}
  ${f32src}
  ${f33src}
  ${f34src}
  ${f36src}
  ${f37src}
  ${f38src}
  ${f39src}
  ${f40src}
  ${f41src}
  const out = {};
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(CELL * 2, CELL * 2, false);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  // The shop's lights, for reflections.
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  // No overhead light: seen from above at 30 degrees, every top face would mirror it white.
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const sheetCv = document.createElement('canvas'); sheetCv.width = CELL * 16; sheetCv.height = CELL * 8; const sg = sheetCv.getContext('2d');
  // A form's pools of material are tagged userData.ground. They are baked to a sheet of their own (<id>_g.png), which the
  // game paints onto the floor tile by tile, under every unit; the other sheet has the body only.
  const sheetG = document.createElement('canvas'); sheetG.width = CELL * 16; sheetG.height = CELL * 8; const sgG = sheetG.getContext('2d');
  const isGround = o => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.ground) return true; return false; };
  for (const job of jobs) {
    const NCOL = job.blocks ? 16 + 8 * job.blocks.length : job.consume ? 24 : 16; if (sheetCv.width !== CELL * NCOL) { sheetCv.width = CELL * NCOL; sheetG.width = CELL * NCOL; }   // (24 columns with a CONSUME block)
    sg.clearRect(0, 0, sheetCv.width, sheetCv.height); sgG.clearRect(0, 0, sheetG.width, sheetG.height);
    EL = { color: job.color }; setElementColour(job.color); if (typeof job.form === 'number' && !job.brightCrystal) { M.crystal.color.multiplyScalar(0.5); M.crystal.emissive.multiplyScalar(0.8); }
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    // Rim light from the side and low: from behind-above it sits exactly where an upward face mirrors
    // this fixed camera, and every top face blows out white.
    const rim = new T.DirectionalLight(job.rim ? new T.Color(job.rim) : 0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(job.rim ? new T.Color(job.rim) : 0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const B = (typeof job.form === 'number' ? FORMS2 : FORMS)[job.form].build(); scene.add(B.g);
    // Glow sprites on a transparent sheet are left to the game (it draws its own glow at the reactor).
    B.g.traverse(o => { if ((o.isSprite && !job.keepSprites) || o.material === M.rotWash) o.visible = false; });
    // A form made of gas and light (job.glowNormal): the sheet is transparent, where additive light would vanish, so its glows are painted with ordinary blending.
    if (job.glowNormal) B.g.traverse(o => { const ms = o.material ? [].concat(o.material) : []; ms.forEach(m => { if (m.blending === T.AdditiveBlending) { m.blending = T.NormalBlending; if (!m.map && o.isMesh) m.map = glowTex; m.needsUpdate = true; } }); });   // (the pool's wide glow is for the mock sheets)
    const gMeshes = [], bMeshes = []; B.g.traverse(o => { if (o.isMesh && o.visible) (isGround(o) ? gMeshes : bMeshes).push(o); });
    const cam = new T.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 100);
    // 2:1 iso: on the (1, h, 1) diagonal, a ground step along x or z projects as (±1, 0.5) when sin(elevation) = 0.5.
    const D = 10;
    const elev = Math.asin(0.5);
    const LY = job.lookY || LOOK_Y;   // (job.lookY: aim higher, so the ground sits lower in the cell and a tall form fits: the tornadoes)
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, LY + D * Math.sin(elev), D * Math.cos(elev) * Math.SQRT1_2);
    cam.lookAt(0, LY, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const g0 = new T.Vector3(0, 0, 0).project(cam);
    const anchor = { x: (g0.x * 0.5 + 0.5) * CELL, y: (1 - (g0.y * 0.5 + 0.5)) * CELL };
    const cp = new T.Vector3(0, B.core, 0).project(cam);
    const coreAt = { x: (cp.x * 0.5 + 0.5) * CELL, y: (1 - (cp.y * 0.5 + 0.5)) * CELL };
    const P = job.period || 2 * PI / 1.6;
    for (let k = 0; k < 8; k++) {
      const th = k * PI / 4, fx = Math.cos(th), fz = Math.sin(th);
      B.g.rotation.y = Math.atan2(fx, fz);
      for (let f = 0; f < NCOL; f++) {
        if (job.single && (k > 0 || f > 7)) continue;   // (job.single: a round form that is drawn from one row and one block: only those cells are baked, the rest of the grid left empty, so the sheet is small: the tornado)
        const idle = f < 8, i = f % 8, blk = f >= 16 && job.blocks ? job.blocks[Math.floor(f / 8) - 2][i] : null, cons = f >= 16 && job.consume ? job.consume[i] : null;
        const t = blk ? (blk.t != null ? blk.t : i * P / 8) : cons != null ? (i < 4 ? i * 0.1 : (i - 4) * P / 4) : idle ? i * P / 8 : 1.0 + i * 0.06;   // (the CONSUME block: its hold frames loop the idle's breath over four)
        const act = blk ? (blk.act != null ? blk.act : job.idleAct) : cons != null ? 0 : idle ? job.idleAct : job.pulse ? Math.sin(PI * (i + 0.5) / 8) : job.action[0] + (job.action[1] - job.action[0]) * (i + 0.5) / 8;   // pulse: up and back down, so the move ends where it began
        if (blk) B.update(t, act, blk); else if (cons != null) B.update(t, act, cons); else B.update(t, act);
        if (!gMeshes.length) { renderer.render(scene, cam); sg.drawImage(renderer.domElement, f * CELL, k * CELL, CELL, CELL); }
        else {
          gMeshes.forEach(m => m.visible = false); renderer.render(scene, cam); sg.drawImage(renderer.domElement, f * CELL, k * CELL, CELL, CELL);   // the body
          bMeshes.forEach(m => m.visible = false); gMeshes.forEach(m => m.visible = true); renderer.render(scene, cam); sgG.drawImage(renderer.domElement, f * CELL, k * CELL, CELL, CELL);   // the ground
          bMeshes.forEach(m => m.visible = true);
        }
      }
    }
    if (job.unpremul) { const W = sheetCv.width, H = sheetCv.height, im = sg.getImageData(0, 0, W, H), d = im.data;   // (a see-through pixel comes out of the renderer as colour x alpha: put its colour back, so a pale glass funnel is pale, not grey)
      for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (a > 0 && a < 255) { const k = 255 / a; d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k); } }
      sg.putImageData(im, 0, 0); }
    out[job.id] = { png: sheetCv.toDataURL('image/png'), ground: gMeshes.length ? sheetG.toDataURL('image/png') : null, meta: Object.assign({ cell: CELL, rows: 8, cols: NCOL, idle: 8, action: 8 }, job.consume ? { consume: 8 } : {}, job.blocks ? { blocks: job.blocks.length } : {}, { anchor, core: coreAt, unitsPerCell: HALF * 2 }) };
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
  return out;
};
</script></body></html>`;

(async () => {
  const OLD_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';   // (the browser the sheets were first baked with; any Chromium Playwright has will do when it is not there)
  const b = await chromium.launch(Object.assign(fs.existsSync(OLD_CHROME) ? { executablePath: OLD_CHROME } : {}, { args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] }));
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://bake.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://bake.local/');
  const res = await p.evaluate(([jobs, C, H, L]) => window.__bake(jobs, C, H, L), [JOBS, CELL, HALF, LOOK_Y]);
  fs.mkdirSync(OUT, { recursive: true });
  for (const [id, r] of Object.entries(res)) {
    fs.writeFileSync(path.join(OUT, id + '.png'), Buffer.from(r.png.split(',')[1], 'base64'));
    if (r.ground) fs.writeFileSync(path.join(OUT, id + '_g.png'), Buffer.from(r.ground.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(r.meta));
    console.log(id, JSON.stringify(r.meta), fs.statSync(path.join(OUT, id + '.png')).size, 'bytes');
  }
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  await b.close();
})();
