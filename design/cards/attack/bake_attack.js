// THE ATTACK CARDS' PICTURES (docs/ATTACK-CARD-ART.md; the owner's brief, 2026-11-17). One card's art, 450 x 630 (the card's .cd-art, 225 x 315, at 2x).
// A Brawler card (the impact style): BRAWLER, below: the same 3-D model and camera, then the card's glass shattered from the blow and the card roughed up.
// A Mage card (the elemental style): the follower's OWN 3-D model (design/evolutions/forms*.js), posed mid-cast, under a tilted perspective camera (a Dutch angle),
// its body charged with its element, its element's world far behind it (js/energygem.js, the energy cards' worlds), and its element in the very front of the card as the focus.
//   node design/cards/attack/bake_attack.js <three-dir> <sample> <out.png> [--model]
//     <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js)
//     <sample>:    a key of SAMPLES below
//     --model:     the 3-D render alone on grey (to look at the pose and the camera)
// Its glows are gradients and blur: a picture baked once, not an effect drawn every frame (docs/EFFECTS.md's flat-colour rule is for those).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], SAMPLE = process.argv[3], OUT = process.argv[4], MODEL_ONLY = process.argv.includes('--model');
const ROOT = path.join(__dirname, '..', '..', '..'), EVO = path.join(ROOT, 'design', 'evolutions');
const files = ['forms-core.js'].concat(fs.readdirSync(EVO).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5))));
const formsSrc = files.map(f => fs.readFileSync(path.join(EVO, f), 'utf8')).join('\n');
const worldSrc = fs.readFileSync(path.join(ROOT, 'js', 'energygem.js'), 'utf8');

// THE SAMPLES. Each is a style sample of an existing attack (no card's name, stats or effect: those are not drawn here).
const SAMPLES = {
  // THE EMBER HOOD (fire Mage, evolved form 'embercowl', design No. 938: design/evolutions/bake.js JOBS) casting HEXFIRE: its "lighting up" (the sheet's second extra block,
  // columns 24-31: its hood swells, glows hot, its diamond and gems blaze; the owner, 2026-11-12: "he lights up and then a crater erupts lava"). The pose: the block's full
  // swell (sw 1.2) with its heat held at 0.35 (at the block's full heat, 1, the hood's faces glow one flat orange and its shape is lost at a card's size).
  // The front of the card is the crater erupting under the camera (the enemy's place): a lava jet, blobs and sparks near the lens, flames at its edge.
  embercowl_hexfire: {
    form: 938, color: '#ff3300', rim: '#ff6a3a', world: 'fire', seed: 938,
    pose: { t: 0.55, act: 0, v: { sw: 1.2, ball: 0, heat: 0.35 } },
    yaw: 0.3,                   // the model turned so its open front (+z), the diamond in its hollow, faces the camera
    cam: { pos: [2.2, 0.8, 9.0], look: [-0.3, 0.72, 0], fov: 33, roll: -0.27 },   // low, looking up at it a little; roll: the Dutch angle (radians; negative tilts the horizon up to the right)
  },
  // THE FROST MAW (ice Brawler, evolved form 'maw', design No. 934: design/evolutions/bake.js JOBS, forms10.js) biting with CHOMP: the bite's own frame (the sheet's second extra block,
  // its first column: "the bite is its first frame": the swollen body slamming forward over the enemy, the fangs down). The camera is the enemy: the jaws close on the lens,
  // and the card's glass shatters from that point (the brawler style: an impact, the screen shattered, the card roughed up). Its 3-D model sits ON the floor (sunk into it, as the game's).
  maw_chomp: {
    style: 'brawler', form: 934, color: '#7fd6ff', rim: '#99ddff', fx: '#99ddff', world: 'ice', seed: 934,
    pose: { t: 0.3, act: 0, v: { sw: 0.6, rot: 0.1, z: 0.45, y: 0.2, fang: 0.24 } },   // (between its sheet's last rearing frame and the bite's first (sw 0.55, rot 0.32): the mouth still facing the lens as the fangs come down; at the bite's own frame the mouth tips to the floor and hides)
    yaw: -0.2, impact: [0, 0.95, 1.9],   // impact: the point of the bite, in the world (the front of its open mouth, between the fangs): the glass breaks there
    lights: { hemi: [0x8aa8d0, 0x061426, 0.3], key: [0xe8f4ff, 0.6], low: [0x9fe8ff, 0, 0, 0.3, 3.0] },
    cam: { pos: [0.5, 0.4, 8.6], look: [0, 0.8, 0.5], fov: 36, roll: -0.22 },   // low, close, square to its mouth; a lighter tilt than the Mage's (about 12.6 degrees)
  },
  // ROUND 2 of the same (the owner, 2026-11-17, "Needs change": "Fewer, bigger cracks" and "Pieces flying out"; "Head-on, jaws bigger"; "Cleaner"): the camera head-on, closer and
  // lower, the open mouth and fangs filling the card; the glass in a few large slabs with its middle burst out toward the lens; less grit and fewer scratches.
  maw_chomp_r2: {
    style: 'brawler', form: 934, color: '#7fd6ff', rim: '#99ddff', fx: '#99ddff', world: 'ice', seed: 9342,
    pose: { t: 0.3, act: 0, v: { sw: 0.6, rot: 0.1, z: 0.45, y: 0.2, fang: 0.24 } },
    yaw: 0, hit: [0.5, 0.5], glass: 'slabs', powder: 0.35,
    clear: [[80, 305, 55], [305, 235, 55]],   // (its two fangs, on the picture: no flying piece lands on them)
    rough: { scuffs: 10, scrapes: 2, singles: 10, longs: 1, grain: 6, specks: 0.0015, edgeSpecks: 0.008, dust: 25, chips: 14 },
    lights: { hemi: [0x8aa8d0, 0x061426, 0.3], key: [0xe8f4ff, 0.6], low: [0x9fe8ff, 0, 0, 0.3, 3.0] },
    cam: { pos: [0.0, 0.25, 6.4], look: [0.12, 0.95, 0.6], fov: 40, roll: -0.22 },
  },
  // ROUND 3 (2026-11-17): the owner's round 2 choices kept; the Frost Maw is now design No. 947 (powder snow: the owner's redesign, docs/DECISION-LOG.md, build 2026-11-17k).
  // The camera back a little and up a little, turned a touch, so his snowy dome shows round his open mouth (head-on he read as an arch); the flying pieces clear glass, all round.
  maw_chomp_r3: {
    style: 'brawler', form: 947, color: '#7fd6ff', rim: '#99ddff', fx: '#99ddff', world: 'ice', seed: 9473,
    pose: { t: 0.3, act: 0, v: { sw: 0.6, rot: 0.1, z: 0.45, y: 0.2, fang: 0.24 } },
    yaw: -0.3, hit: [0.45, 0.51], glass: 'slabs', pieces: 'clear', powder: 0.35,
    clear: [[108, 300, 48], [285, 255, 46], [165, 240, 32], [225, 232, 30]],   // (its two fangs and the teeth between them, on the picture: no flying piece lands on them)
    rough: { scuffs: 10, scrapes: 2, singles: 10, longs: 1, grain: 6, specks: 0.0015, edgeSpecks: 0.008, dust: 25, chips: 14 },
    lights: { hemi: [0x8aa8d0, 0x061426, 0.3], key: [0xe8f4ff, 0.6], low: [0x9fe8ff, 0, 0, 0.3, 3.0] },
    cam: { pos: [-0.35, 0.7, 7.8], look: [-0.25, 0.85, 0.5], fov: 38, roll: -0.22 },   // (shifted so his mouth and fangs sit in the middle, clear of the frame's edge)
  },
  // THE HAMMER SLUG (core Technician, evolved form 'hammerslug', design No. 469: design/evolutions/bake.js JOBS, forms20.js _slugReal) in the Technician style (the owner, 2026-11-17:
  // "surrounded by a very intact ring of crystals while they raise their claws or whatever they have"). It has no claws: it rears its front up (his head, raised),
  // in its action pose (act 1: the lunge, its fin raised and its scutes flared), inside a whole ring of the game's crystals, the core energy card's reactor behind.
  hammerslug_ring: {
    style: 'tech', form: 469, color: '#00ccaa', rim: '#19e6c1', fx: '#19e6c1', world: 'core', seed: 469,
    pose: { t: 0.4, act: 1 }, yaw: 1.2, rear: 0.5, lift: 0.15,   // (turned side-on to the camera, its head to the right: its long tiled body, spiked spine and raised head all show)
    ring: { n: 12, r: 2.0, h: [0.3, 1.25], w: 0.14 },
    lights: { hemi: [0x8ad0c0, 0x02140f, 0.4], key: [0xf0fffa, 0.9], rim: 2.4, back: 1.4, low: [0x19e6c1, 0, 0, 0.4, 2.2] },
    cam: { pos: [1.3, 1.4, 7.6], look: [0.3, -0.25, 0], fov: 38, roll: -0.18 },   // (above the ring, looking down into it a little, so the whole ring shows round it, all above the name plate; rolled about 10 degrees)
  },
  // ROUND 2 (the owner, 2026-11-17: "He needs to have a pudding like body, and he needs to fold upwards"; "Only on the card"; his head is his own soft head, not a hammer):
  // the same card with his body and head as glossy jelly (P.pudding, above: this render only, the game's model unchanged) and his front half folding up at his middle
  // instead of the whole model tipped back. Everything else as round 1.
  hammerslug_ring_r2: {
    style: 'tech', form: 469, color: '#00ccaa', rim: '#19e6c1', fx: '#19e6c1', world: 'core', seed: 469,
    pose: { t: 0.4, act: 1 }, yaw: 1.75,   // (side-on to the camera, his front to the right, so the fold shows in profile)
    pudding: { top: 0x13a890, low: 0x1236b4, glow: 0x063d35, glowK: 0.45, plump: 1.18, wobble: 0.012, headThick: 4, z0: -0.2, fold: 1.4, arc: 0.95, yp: 0.28, headTip: 0.9 },
    ring: { n: 12, r: 2.0, h: [0.3, 1.25], w: 0.14 },
    lights: { hemi: [0x8ad0c0, 0x02140f, 0.4], key: [0xf0fffa, 0.9], rim: 2.4, back: 1.4, low: [0x19e6c1, 0, 0, 0.4, 2.2] },
    cam: { pos: [1.3, 1.5, 8.2], look: [0.35, 0.3, 0], fov: 38, roll: -0.18 },   // (back a little and aimed higher than round 1: his folded-up front fits under the top, and the scene sits lower on the card)
  },
  // ROUND 3 (the owner, 2026-11-17: "Forget about the pudding body, man. He looks fine other than that one picture where you gave him a iron hammer head"): his own look as the
  // game's model has it, the fold upwards kept (P.fold: the same bend as round 2), his head lit matte as living flesh in a lifted navy, not a dark metal slab. Else as rounds 1 and 2.
  hammerslug_ring_r3: {
    style: 'tech', form: 469, color: '#00ccaa', rim: '#19e6c1', fx: '#19e6c1', world: 'core', seed: 469,
    pose: { t: 0.4, act: 1 }, yaw: 1.75,
    fold: { z0: -0.2, fold: 1.4, arc: 0.95, yp: 0.22, headTip: 0.9, headTurn: -0.8, headColour: 0x0a1a48, headGlow: 0 },
    ring: { n: 12, r: 2.0, h: [0.3, 1.25], w: 0.14 },
    lights: { hemi: [0x8ad0c0, 0x02140f, 0.4], key: [0xf0fffa, 0.9], rim: 2.4, back: 1.4, low: [0x19e6c1, 0, 0, 0.4, 2.2] },
    cam: { pos: [1.3, 1.5, 8.2], look: [0.35, 0.3, 0], fov: 38, roll: -0.18 },
  },
  // ---------- FOLLOWERS, ROUND 1 (the owner, 2026-11-17: "Start with some followers"): each in its role's approved style, a style sample of its own existing second attack ----------
  // THE THUNDERHEAD (electric Mage, evolved form 'thunderhead', design No. 543: design/evolutions/bake.js JOBS, forms21.js _storm) casting STATIC VORTEX (docs/COMBAT.md: "a stationary
  // pull that bites"), in the Mage style as the Ember Hood's: charged with its element, the camera rolled, lightning in the very front. Its action pose (act 1: the arcs between its
  // crown spikes, its glow at full); the storm energy card's world behind (js/energygem.js 'electric'). STORM, below, paints it.
  thunderhead_vortex: {
    style: 'storm', form: 543, color: '#ffee33', rim: '#fff27a', fx: '#ffee33', world: 'electric', seed: 543,
    pose: { t: 0.55, act: 1 }, yaw: 0.7,
    lights: { hemi: [0x8a84b0, 0x0a0618, 0.45], key: [0xfff6d8, 0.9], rim: 2.4, back: 1.3, low: [0xffe040, 3, -1.6, 0.5, 3.2] },
    cam: { pos: [2.0, 0.6, 8.6], look: [-0.75, 0.75, 0], fov: 35, roll: -0.27 },
    vortex: { eye: [0.25, 0.53], rx: 0.4, squash: 0.36, arms: 4, inner: 0.35, bodyArcs: 4, edgeArcs: 20,
      lens: [{ w: 9, pts: [[-30, -20], [50, 90], [15, 190], [112, 334]] }, { w: 6, pts: [[-30, 520], [40, 450], [70, 400], [112, 334]] }] },   // (the nearest bolts: a huge one down the left edge into the whirl's eye, a smaller one across the foot)
  },
  // THE QUILLSTONE (fire Brawler, evolved form 'quillstone', design No. 927: design/evolutions/bake.js JOBS, forms15.js _porcupine) with EMBER SLASH (docs/COMBAT.md: a dash 4 tiles
  // in a line toward the nearest enemy and through it, a streak of fire behind it), in the Brawler style as the Frost Maw's round 3: it dives head-on at the lens (its everyday dive
  // pose, act 1: forward, nose down, its quills bristling), and the card's glass breaks where its nose strikes. The fire energy card's lava cave behind.
  quillstone_emberslash: {
    style: 'brawler', form: 927, color: '#ff3300', rim: '#ff6a3a', fx: '#ff7a2a', world: 'fire', seed: 927,
    pose: { t: 0.3, act: 1 }, yaw: 0, hit: [0.5, 0.52], glass: 'slabs', pieces: 'clear', powder: 0,
    flame: { from: [0.66, 0.5], to: [0.5, 0.64], width: 0.42, n: 90, quillFlames: 26 },
    tone: { sky: '#120201', hz: ['rgba(60,11,5,0)', 'rgba(90,20,6,0.85)', '#3c0b05'], hot: '255,200,120', halo: 'rgba(10,2,0,1)', chip: ['#3a2a26', '#1a0d0a', '#060202', 'rgba(255,90,20,0.35)'], vig: 'rgba(10,2,1,0.65)', foot: ['rgba(10,2,1,0)', 'rgba(10,2,1,0.7)'] },
    clear: [[225, 125, 100], [150, 215, 38], [305, 205, 42]],   // (its crown of quills and its two front spikes: no flying piece lands on them)
    rough: { scuffs: 10, scrapes: 2, singles: 10, longs: 1, grain: 6, specks: 0.0015, edgeSpecks: 0.008, dust: 25, chips: 14 },
    cam: { pos: [0.2, 0.55, 6.0], look: [0, 0.5, 0.3], fov: 42, roll: -0.22 },
  },
  // THE STONEPETAL (bloom Technician, evolved form 'coralcrab', design No. 923: design/evolutions/bake.js JOBS, forms38.js _coralTick) for STAKE RING, in the Technician style as the
  // Hammer Slug's round 3: inside a whole ring of the game's crystals in bloom's pink, raising what it has: it has no claws, so it rears (its action's rearing, its head lifted)
  // and raises its front pair of stake legs (P.raise: this render only; the game's model is not changed). The bloom energy card's garden behind.
  coralcrab_stakering: {
    style: 'tech', form: 923, color: '#ff7ab8', rim: '#ff9ccc', fx: '#ff7ab8', world: 'blossom', seed: 923,
    pose: { t: 1.124, act: 1 }, yaw: 0.9, raise: { seg: 40, stake: 150, fwd: 25 },
    ring: { n: 12, r: 1.35, h: [0.3, 1.0], w: 0.12, dim: [0.4, 0.2] },
    tone: { sky: '#14030c', hz: ['rgba(58,10,38,0)', 'rgba(80,16,52,0.85)', '#3a0a26'], halo: 'rgba(10,2,6,1)', white: '255,230,242', ringWhite: '#ffe6f2', star: '255,236,246', vig: 'rgba(10,2,6,0.6)', foot: ['rgba(12,3,8,0)', 'rgba(12,3,8,0.65)'], worldK: 0.8, ringGlow: [0.4, 0.15] },
    lights: { hemi: [0xd0a0b8, 0x1a0610, 0.45], key: [0xfff0f6, 1.0], rim: 2.4, back: 1.4, low: [0xff7ab8, 2.2, 0, 0.4, 2.2] },
    cam: { pos: [0.7, 1.15, 6.3], look: [-0.15, 0.2, 0], fov: 38, roll: -0.18 },
  },  // ROUND 2 (the owner, 2026-11-17: "The Stone Petal has his arms completely 180 degrees in the air, when in reality he should only be moving his shoulder ... Upper arm, and he has his
  // forearm still angled towards the ground"): each front leg lifts at its shoulder only (its short upper segment raised, up and a little out), bent at its knee (the elbow), the stake
  // (the forearm) still angled down toward the ground, its point hanging down. Everything else as round 1.
  coralcrab_stakering_r2: {
    style: 'tech', form: 923, color: '#ff7ab8', rim: '#ff9ccc', fx: '#ff7ab8', world: 'blossom', seed: 923,
    pose: { t: 1.124, act: 1 }, yaw: 0.9, raise: { seg: 75, stake: 22, fwd: 10, lighten: 0x12060c },
    ring: { n: 12, r: 1.35, h: [0.3, 1.0], w: 0.12, dim: [0.4, 0.2] },
    tone: { sky: '#14030c', hz: ['rgba(58,10,38,0)', 'rgba(80,16,52,0.85)', '#3a0a26'], halo: 'rgba(10,2,6,1)', white: '255,230,242', ringWhite: '#ffe6f2', star: '255,236,246', vig: 'rgba(10,2,6,0.6)', foot: ['rgba(12,3,8,0)', 'rgba(12,3,8,0.65)'], worldK: 0.8, ringGlow: [0.4, 0.15] },
    lights: { hemi: [0xd0a0b8, 0x1a0610, 0.45], key: [0xfff0f6, 1.0], rim: 2.4, back: 1.4, low: [0xff7ab8, 2.2, 0, 0.4, 2.2] },
    cam: { pos: [0.7, 1.15, 6.3], look: [-0.15, 0.2, 0], fov: 38, roll: -0.18 },
  },
  // ---------- FOLLOWERS, ROUND 2 (the owner, 2026-11-17: "Continue") ----------
  // THE VOIDSTAR (flux Mage, evolved form 'voidstar', design No. 946: design/evolutions/bake.js JOBS, forms24.js _starfish) casting MAELSTROM (docs/COMBAT.md; the owner, 2026-11-12: "a little
  // maelstrom AoE effect that throws like purple crystals everywhere"), in the Mage style as the Ember Hood's: its pose the reach as the swirl opens (the sheet's extra block, column 22:
  // lift 1, thrust 1: the arms that face the enemy lifted and thrust at it); charged with the void (VOID_MAGE, below); the swirl of crystals in the very front of the card, at the lens.
  voidstar_maelstrom: {
    style: 'void', form: 946, color: '#9933ff', rim: '#b366ff', fx: '#9933ff', world: 'flux', seed: 946,
    pose: { t: 0.55, act: 0, v: { lift: 1, thrust: 1 } }, yaw: 0.25,   // (its front, the arms that reach, turned to the lens: the enemy's place)
    lights: { hemi: [0x9a88c0, 0x0a0418, 0.5], key: [0xf4ecff, 1.0], rim: 2.6, back: 1.4, low: [0xb070ff, 4, -1.4, 0.5, 3.4] },
    cam: { pos: [1.4, 1.6, 6.6], look: [-0.5, 0.12, 1.2], fov: 42, roll: -0.27 },   // (above it and looking down past it to the floor in front, so its five arms and its orb read up on the right and the swirl fills the middle left; rolled as the Ember Hood's)
    swirl: { at: [-0.42, 0.06], r: 1.0, arms: 3, per: 7, thrown: 18, size: 0.17, nearBlur: 2.2,
      lens: [{ w: 5, pts: [[-20, 100], [30, 170], [60, 245]] }, { w: 3.5, pts: [[-20, 450], [40, 400], [90, 340]] }],   // (the nearest filaments: down the left edge into the eye, and up from the lower left; each ends at the eye) cast: [0.6, 0.27],   // (the swirl's middle on the floor where the ray through this point of the picture (-1..1) meets it; its radius, world units)
      near: [[-0.85, 0.75, 1.3, 0.16, 0.6], [0.9, 0.85, 1.5, 0.13, -0.4], [-0.95, -0.2, 1.2, 0.12, 2.2], [0.7, 0.2, 1.7, 0.08, 1.0], [-0.55, 0.95, 2.0, 0.07, -1.2]] },   // (the nearest crystals, flying past the lens: [x, y on the picture, distance, size, turn])
  },
  // THE IGLOO SKATER (ice Technician, evolved form 'igloo', design No. 857: design/evolutions/bake.js JOBS, forms31.js _iglooBricks) for SKATE CHARGE, in the Technician style as the Hammer
  // Slug's round 3: inside a whole ring of the game's crystals in ice's colour, raising what it has: it has no claws or arms, only its four diamonds (its skates) set under its box of
  // bricks, so it rears its front end up (P.rear: its body is fitted bricks, rigid, so the whole of it tips back), its front diamonds lifted off the ice, still pointing down.
  // The ice energy card's glacier under its aurora behind.
  igloo_skatecharge: {
    style: 'tech', form: 857, color: '#7fd6ff', rim: '#99ddff', fx: '#99ddff', world: 'ice', seed: 857,
    pose: { t: 0.4, act: 0 }, yaw: 1.05, rear: 0.5, lift: 0.12,   // (side-on, its front to the right: its back diamonds on the ice, its front end and front diamonds raised)
    ring: { n: 12, r: 1.6, h: [0.3, 1.1], w: 0.13, dim: [0.35, 0.15] },   // (dimmed as the Stonepetal's: ice's pale blue whites the crystals out otherwise)
    tone: { sky: '#020818', hz: ['rgba(12,42,74,0)', 'rgba(20,60,100,0.85)', '#0c2a4a'], halo: 'rgba(0,6,16,1)', white: '225,245,255', ringWhite: '#e0f4ff', star: '235,248,255', vig: 'rgba(0,4,12,0.6)', foot: ['rgba(2,8,18,0)', 'rgba(2,8,18,0.65)'], worldK: 0.6, ringGlow: [0.35, 0.15] },
    lights: { hemi: [0x8aa8d0, 0x061426, 0.45], key: [0xf0f8ff, 1.0], rim: 2.4, back: 1.4, low: [0x99ddff, 1.2, 0, 0.6, 1.8] },
    cam: { pos: [1.2, 1.5, 7.4], look: [-0.1, 0.05, 0], fov: 38, roll: -0.18 },   // (above the ring, rolled about 10 degrees, as the Hammer Slug's, the whole ring in the card)
  },
  // THE SEEPER (toxic Brawler, evolved form 'seeper', design No. 936: design/evolutions/bake.js JOBS, forms22.js _walker) with TOXIC STOMP (docs/COMBAT.md: "it stomps: every enemy within
  // 1.5 tiles"; it plays the Seeper's own leg stomp, goo thrown out of its caldera), in the Brawler style as the Frost Maw's round 3: TOXIC STOMP over ERUPTION, as the stomp comes down
  // head-on: its front foot slams down on the lens (the enemy's place), and the card's glass breaks where it lands. Its pose: the stomp block (its sheet's columns 16-23: v up, fwd,
  // lean, splat), between its leg raised highest and the slam. The toxic energy card's swamp behind.
  seeper_stomp: {
    style: 'brawler', form: 936, color: '#66ff66', rim: '#7dff6a', fx: '#66ff66', world: 'toxic', seed: 936,
    pose: { t: 0.3, act: 0, v: { up: 0.3, fwd: 0.42, lean: 0.02, splat: 0 } }, yaw: -0.8, hit: [0.456, 0.468], glass: 'slabs', pieces: 'clear', powder: 0,
    clear: [[120, 235, 55], [240, 120, 85], [260, 240, 55], [350, 220, 50], [150, 325, 40]],   // (its eye, its cone, its stomping leg, its shell's side and its front legs: no flying piece lands on them)   // (yaw: its stomping leg, which reaches forward and out at 45 degrees, aimed at the lens)
    lights: { hemi: [0x90c090, 0x041a06, 0.55], key: [0xf0fff0, 1.15], rim: 3.0, back: 1.5, low: [0x66ff66, 1.5, 0, 1.4, 1.6] },
    cam: { pos: [0.0, 0.3, 3.2], look: [-0.25, 0.36, 0.3], fov: 50, roll: -0.22 },
    goo: { from: [0.54, 0.15], n: 10, splash: 18, flash: 70 }, through: 36,   // (the stomp's goo (docs/COMBAT.md: "goo thrown out of its caldera"): drops flung up out of its caldera (from, on the picture) and a splash where the foot lands)
    tone: { sky: '#020902', hz: ['rgba(10,42,10,0)', 'rgba(16,64,14,0.85)', '#0a2a0a'], hot: '210,255,200', halo: 'rgba(0,8,0,1)', chip: ['#4a6a40', '#1a2a14', '#040a03', 'rgba(102,255,102,0.35)'], vig: 'rgba(0,6,0,0.65)', foot: ['rgba(1,8,1,0)', 'rgba(1,8,1,0.7)'], dim: 0.35, glow: 0.25, edge: [3, 0.8, '#9dff80'] },
    rough: { scuffs: 10, scrapes: 2, singles: 10, longs: 1, grain: 6, specks: 0.0015, edgeSpecks: 0.008, dust: 25, chips: 14 },   // (low on the floor where the foot will land, the enemy's place, looking up at it; rolled as the Frost Maw's)
  },
  // ---------- FOLLOWERS, ROUND 3 (2026-11-17: the owner of round 2, "I love those cards. Keep going.") ----------
  // THE RIMESTAR (ice Mage, evolved form 'rimestar', design No. 940: design/evolutions/bake.js JOBS, forms32.js _rimestar) casting ICICLE VOLLEY (docs/COMBAT.md: "three icicles in a fan at the
  // nearest enemy"; the owner, 2026-11-12: "it turns into a fan and it shoots crystals at the enemy"), in the Mage style as the Ember Hood's: its pose the fan's release (the sheet's second extra
  // block, column 30: the fan at full, a crystal at each blade's tip, three thrown; its haze lighter than the sheet's 0.52, so the blades read); charged with frost (ICE_MAGE, below); the game's
  // own icicles flying off the fan at the lens, in the very front of the card. The ice energy card's glacier behind.
  rimestar_volley: {
    style: 'ice', form: 940, color: '#7fd6ff', rim: '#99ddff', fx: '#7fd6ff', world: 'ice', seed: 940,
    pose: { t: 0.55, act: 0, v: { fan: 1, cry: 1, rot: 4.9, blur: 0.3, go: 0.5 } }, yaw: 0.45,
    lights: { hemi: [0x8aa8d0, 0x061426, 0.45], key: [0xf0f8ff, 1.0], rim: 2.4, back: 1.3, low: [0x9fe8ff, 2, -0.6, 1.6, 3.0] },
    cam: { pos: [2.2, 1.1, 7.8], look: [-0.8, 0.3, 0], fov: 38, roll: -0.27 },   // (it up on the right, the volley flying out to the left above the name plate; rolled as the Ember Hood's)
    volley: { icicles: [[0.05, 0.02, 2.1, 0.88, 0.3, -0.1], [-0.22, 0.58, 3.4, 0.85, 1.1, 0.1], [0.04, 0.33, 4.8, 0.8, 2.0, 0]],   // (each: [x, y on the picture, distance, size, roll, its turn in the fan])
      screen: [3.35, 1.5], near: [[-0.8, 0.8, 1.4, 0.35, 0.5, 0.15]], nearBlur: 3,   // (all flying left and a little down on the picture, and at the lens; one more at the lens, top left, out of focus)
      release: [-0.2, 1.1, 0.9], trail: 340, trailW: 18, dim: 0.5, floorDim: 0.45, glow: [0.5, 0.45], inner: 0.25, heartGlow: 0.1, burst: 0.5 },   // (the world, the floor and its own glow held down: a white follower on the snow)
  },
  // THE ELECTRO SKINK (electric Brawler, evolved form 'electroskink', design No. 905: design/evolutions/bake.js JOBS, forms36.js _electroSkink) with ZIGZAG DASH (docs/COMBAT.md: "it darts through the
  // nearest enemy within 4 tiles and on, a hop of 2.5 tiles at a time, 3 at most"), in the Brawler style as the Frost Maw's round 3 and the Seeper's: it dashes head-on at the lens, its action's
  // strike (act 1: reared, then lunging forward, its head thrust out), and the card's glass breaks where its snout hits. Its zigzag way behind it in lightning (ZIG_DASH). The storm behind.
  electroskink_zigzag: {
    style: 'brawler', form: 905, color: '#ffe033', rim: '#fff27a', fx: '#ffee33', world: 'electric', seed: 905,
    pose: { t: 1.24, act: 1 }, yaw: -0.25, hit: [0.4, 0.47], glass: 'slabs', pieces: 'clear', powder: 0, through: 56,   // (yaw: its head at the lens, its body and its bolt of a tail running back up to the right; through: its head punched through the glass)
    clear: [[185, 280, 90], [300, 250, 70], [360, 170, 60], [390, 280, 50]],   // (its head, its body, its tail and its hind legs: no flying piece lands on them)
    lights: { hemi: [0x8a84b0, 0x0a0618, 0.5], key: [0xfff6d8, 1.1], rim: 3.0, back: 1.5, low: [0xffe040, 1.5, 0, 0.6, 2.0] },
    cam: { pos: [0.0, 1.0, 4.3], look: [-0.6, -0.05, 0.6], fov: 42, roll: -0.22 },   // (a little above it, so its tail shows behind its body; rolled as the Frost Maw's)
    zig: { path: [[3.2, 0.05, -7], [-2.0, 0.05, -3.6], [0.2, 0.15, -0.6]], band: 22, w: 2.6, flash: 120, forks: 5, edgeArcs: 8 },   // (its last two hops, on the floor behind it)
    tone: { sky: '#0a0814', hz: ['rgba(26,22,48,0)', 'rgba(40,34,64,0.85)', '#1a1630'], hot: '255,250,200', halo: 'rgba(4,2,10,1)', chip: ['#5a5470', '#2a2638', '#08060e', 'rgba(255,238,51,0.35)'], vig: 'rgba(6,4,14,0.65)', foot: ['rgba(6,4,14,0)', 'rgba(6,4,14,0.7)'], dim: 0.35, glow: 0.3, edge: [3, 1.0, '#fff27a'] },
    rough: { scuffs: 10, scrapes: 2, singles: 10, longs: 1, grain: 6, specks: 0.0015, edgeSpecks: 0.008, dust: 25, chips: 14 },
  },
  // THE THERMITE BURROWER (fire Technician, evolved form 'thermite', design No. 855: design/evolutions/bake.js JOBS, forms31.js _thermiteBlack, the bear) for MAGMA VENT, in the Technician style as the
  // Hammer Slug's round 3 and the Igloo Skater's: inside a whole ring of the game's crystals in fire's colour, raising what it has: it is a bear-like tank animal on four clawed paws with a drill
  // for a snout, so it rears up as a bear does (P.rear: the whole model tipped back, its hind paws on the floor), its front paws lifted off it, still hanging down, its drill raised. Its action
  // pose (act 1: the drill turning, its tip white-hot, sparks off it). The fire energy card's lava cave behind.
  thermite_magmavent: {
    style: 'tech', form: 855, color: '#ff3300', rim: '#ff6a3a', fx: '#ff4a1a', world: 'fire', seed: 855,
    pose: { t: 1.2, act: 0.35 }, yaw: 1.0, rear: 0.8, lift: 0.15,   // (its action a third of the way in: the drill turning, its tip hot, not yet white; turned side-on, its drill to the right; reared about 46 degrees)
    ring: { n: 12, r: 1.35, h: [0.3, 1.0], w: 0.12, dim: [0.5, 0.35] },   // (dimmed as the Stonepetal's: under the white key light fire's red turned the crystals pale yellow)
    tone: { sky: '#120201', hz: ['rgba(60,11,5,0)', 'rgba(90,20,6,0.85)', '#3c0b05'], halo: 'rgba(10,2,0,1)', white: '255,225,190', ringWhite: '#ffe0c8', star: '255,236,210', vig: 'rgba(10,2,1,0.6)', foot: ['rgba(10,2,1,0)', 'rgba(10,2,1,0.65)'], worldK: 0.6, ringGlow: [0.5, 0.25],
      dim: 0.3, floorDim: 0.35, edge: [3, 0.9, '#ff8a4a'] },   // (the world and the glowing floor held down, a thin bright edge round its black body: a dark follower on a dark-red cave)
    lights: { hemi: [0x8a6a60, 0x1a0602, 0.45], key: [0xffeee0, 1.1], rim: 2.6, back: 1.4, low: [0xff5a14, 1.2, 0, 0.6, 2.0] },
    cam: { pos: [1.2, 1.75, 7.3], look: [-0.05, 0.0, 0], fov: 37, roll: -0.18 },   // (above the ring, rolled about 10 degrees, as the Hammer Slug's, the whole ring in the card)
  },
};

// ---------- A BRAWLER'S PICTURE (the impact style): the follower's world behind it, the follower, the blow coming at the lens, and then the card itself HIT: its glass
// shattered from the point of impact (cracks radiating out, rings of cracks round it, the shards knocked out of line, the middle crushed and a few pieces knocked out),
// and the card roughed up (scratches, scuffs, grit, chipped edges, dust). Run in the page (its source is put there with toString), after the 3-D renders.
function BRAWLER(o) {
  const { W, H, R, cv, model, floorCv, hzAt, slope, up, info, P } = o, PI = Math.PI, TAU = 2 * PI;
  const FX = P.fx, rgb = (h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)])(FX), fxa = a => 'rgba(' + rgb.join(',') + ',' + a + ')';
  const out = cv(), g = out.getContext('2d');
  const rad = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (G, x, y, r, stops) => { G.fillStyle = rad(G, x, y, r, stops); G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const HIT = P.impact ? o.mouthAt.slice() : [P.hit[0] * W, P.hit[1] * H];   // the point of impact on the glass (where the bite lands: at its mouth, in front of the fangs)
  // the world's tones (followers round 1: P.tone for a Brawler in another world than the ice; the defaults are the Frost Maw's, unchanged)
  const TN = Object.assign({ sky: '#020818', hz: ['rgba(12,42,74,0)', 'rgba(20,60,100,0.85)', '#0c2a4a'], hot: '220,245,255', halo: 'rgba(0,6,16,1)', chip: ['#f4fcff', '#a8dcf6', '#3a7cb0', 'rgba(20,70,120,0.45)'],
    vig: 'rgba(0,4,12,0.65)', foot: ['rgba(2,8,18,0)', 'rgba(2,8,18,0.7)'] }, P.tone || {});
  // 1. FAR: its element's world (the ice energy card's glacier under an aurora: js/energygem.js, with that card's own seed), tilted with the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.fillStyle = TN.sky; g.fillRect(0, 0, W, H);
  // (the world's glacier and aurora fill the sky from the card's top down to the horizon: drawn wider than it is tall, as the tilted sky needs the width; its blur hides the stretch)
  { const hz = hzAt(W / 2), top = -(hz + 60), hh = hz + 110, kx = 1.7;
    g.save(); g.translate(W / 2, hz); g.rotate(slope); g.filter = 'blur(2px)'; g.drawImage(ws, -225 * kx, top, 450 * kx, hh); g.filter = 'none';
    g.globalAlpha = 0.5; g.drawImage(wm, -225 * kx, top, 450 * kx, hh); g.restore(); g.globalAlpha = 1; }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -120, 0, 30); lg.addColorStop(0, TN.hz[0]); lg.addColorStop(0.8, TN.hz[1]); lg.addColorStop(1, TN.hz[2]);
  g.fillStyle = lg; g.fillRect(-W, -120, 2 * W, 150); g.restore();
  if (TN.dim) { g.fillStyle = 'rgba(0,0,0,' + TN.dim + ')'; g.fillRect(0, 0, W, H); }   // (followers round 2: the world dimmed behind a dark follower, so it stands out)
  // 2. THE FLOOR (3-D), a cold line of light along the horizon (so the tilt reads)
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[26, 0.12], [8, 0.25], [2, 0.6]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, fxa(0)); lb.addColorStop(0.5, h < 4 ? 'rgba(' + TN.hot + ',' + a + ')' : fxa(a)); lb.addColorStop(1, fxa(0)); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  // 3. THE FOLLOWER: a cold glow round its silhouette (its element), then its own render, darkened a touch at its foot so the snow shell stands off the floor
  const mask = (blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(model, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalAlpha = 0.85; g.drawImage(mask(14, TN.halo), 0, 6); g.restore();   // (a dark halo behind it: its outline reads against the bright aurora and floor)
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = TN.glow == null ? 0.5 : TN.glow; g.drawImage(mask(18, FX), 0, 0); g.restore();
  if (TN.edge) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = TN.edge[1]; g.drawImage(mask(TN.edge[0], TN.edge[2]), 0, 0); g.restore(); }   // (followers round 2: a thin bright edge round a dark follower's silhouette, so its shape reads through the cracks)
  g.drawImage(model, 0, 0);
  // 4. THE BITE AT THE LENS: a burst of powder and ice chips thrown out of its mouth at the camera, a cold flash where the fangs strike
  g.save(); g.globalCompositeOperation = 'lighter';
  const PW = P.powder == null ? 1 : P.powder;   // (round 2: less, so its open mouth stays clear)
  blob(g, HIT[0], HIT[1], 160, [[0, 'rgba(230,250,255,' + 0.3 * PW + ')'], [0.25, fxa(0.16 * PW)], [1, fxa(0)]]);
  for (let i = 0; i < 26; i++) { const a = R() * TAU, d = 20 + R() * 120; blob(g, HIT[0] + Math.cos(a) * d, HIT[1] + Math.sin(a) * d * 0.8, 18 + R() * 40, [[0, 'rgba(230,245,255,' + 0.16 * PW + ')'], [1, 'rgba(200,235,255,0)']]); }   // (the powder)
  g.restore();
  if (P.flame) FLAME_DASH({ g, W, H, R, cv, model, HIT, up, P, PI, TAU });
  if (P.goo) GOO_SPLASH({ g, W, H, R, cv, model, HIT, up, P, PI, TAU });
  if (P.zig) ZIG_DASH({ g, W, H, R, cv, model, HIT, up, P, PI, TAU, pr: o.pr });   // (followers round 3, ZIGZAG DASH: its way behind it a zigzag of lightning, arcs off it, the strike's bolts at the lens)   // (followers round 2, TOXIC STOMP: goo flung out of its caldera, a splash of it where the foot lands)   // (followers round 1, EMBER SLASH: its dash's streak of fire behind it, its quills burning, flames bursting at the strike)
  const chip = (G, x, y, r, ang, alpha) => {   // a faceted chip of ice: a lit face and a shaded one, a white edge
    const n = 4 + Math.floor(R() * 3), pts = []; for (let i = 0; i < n; i++) { const a = ang + i / n * TAU + (R() - 0.5) * 0.6, rr = r * (0.55 + R() * 0.6) * (i % 2 ? 1 : 1.6); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75]); }
    G.save(); G.globalAlpha = alpha; G.beginPath(); pts.forEach(([px, py], i) => i ? G.lineTo(px, py) : G.moveTo(px, py)); G.closePath();
    G.fillStyle = rad(G, x - r * 0.3, y - r * 0.3, r * 1.8, [[0, TN.chip[0]], [0.5, TN.chip[1]], [1, TN.chip[2]]]); G.fill(); G.strokeStyle = 'rgba(255,255,255,0.9)'; G.lineWidth = 1; G.stroke();
    G.beginPath(); G.moveTo(x, y); G.lineTo(pts[0][0], pts[0][1]); G.lineTo(pts[1][0], pts[1][1]); G.closePath(); G.fillStyle = TN.chip[3]; G.fill(); G.restore(); };
  const chips = cv(), cg = chips.getContext('2d');
  for (let i = 0; i < 18; i++) { const a = R() * TAU, d = 40 + Math.pow(R(), 0.8) * 200, x = HIT[0] + Math.cos(a) * d, y = HIT[1] + Math.sin(a) * d * 0.9; if (y > H * 0.66) continue; chip(cg, x, y, 2.5 + R() * 6 * (d / 200), a, 0.9); }
  g.drawImage(chips, 0, 0);
  { const big = cv(), bg = big.getContext('2d'); [[W * 0.08, H * 0.12, 20], [W * 0.92, H * 0.2, 16], [W * 0.86, H * 0.05, 11], [W * 0.15, H * 0.42, 12]].forEach(([x, y, r]) => chip(bg, x, y, r, R() * TAU, 0.85));
    g.save(); g.filter = 'blur(4px)'; g.drawImage(big, 0, 0); g.restore(); }   // (the nearest chips, flying past the lens, out of focus)
  // 5. THE GRADE before the hit: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(g, W * 0.5, H * 0.42, H * 0.78, [[0.45, 'rgba(0,0,0,0)'], [1, TN.vig]]); g.fillRect(0, 0, W, H);
  lg = g.createLinearGradient(0, H * 0.62, 0, H); lg.addColorStop(0, TN.foot[0]); lg.addColorStop(1, TN.foot[1]); g.fillStyle = lg; g.fillRect(0, H * 0.62, W, H * 0.38); g.restore();

  // ---------- 6. THE GLASS SHATTERED ----------
  // The crack pattern: lines radiating from the point of impact (jagged), crossed by rings of cracks round it; each cell between them is a shard. Cells merge where a ring's crack
  // is missing (real glass does not break into a perfect web). The inner shards are knocked further out of line and turned more; a few of the second ring are knocked out.
  const snap = cv(); snap.getContext('2d').drawImage(out, 0, 0);
  const SLABS = P.glass === 'slabs', RU = Object.assign({ scuffs: 22, scrapes: 7, singles: 40, longs: 3, grain: 14, specks: 0.006, edgeSpecks: 0.03, dust: 60, chips: 26 }, P.rough || {});   // (round 2's glass and its cleaner finish; the defaults are round 1's)
  const fade = y => y > H * 0.7 ? 0.45 : 1;   // (lighter over the name plate)
  if (SLABS) SHATTER_SLABS({ g, W, H, R, cv, clear: P.clear || [], clearGlass: P.pieces === 'clear', info, snap, HIT, blob, fxa, fade, PI, TAU }); else {
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const NR = P.cracks || 13, RINGS = [0, 22, 52, 96, 160, 250, 380, 1100];
  const angs = []; for (let i = 0; i < NR; i++) angs.push((i + (R() - 0.5) * 0.7) / NR * TAU); angs.sort((a, b) => a - b);
  const V = angs.map((a, i) => RINGS.map((r, k) => { if (k === 0) return HIT.slice(); const aa = a + (R() - 0.5) * 0.12 * (k < 3 ? 1.5 : 1), rr = r * (0.85 + R() * 0.3); return [HIT[0] + Math.cos(aa) * rr, HIT[1] + Math.sin(aa) * rr]; }));
  const ringOn = angs.map(() => RINGS.map((r, k) => k === 0 || k === RINGS.length - 1 || R() < (k < 3 ? 0.9 : k < 5 ? 0.7 : 0.45)));   // (is the ring's crack there between line i and i+1)
  const ringMid = angs.map((a, i) => RINGS.map((r, k) => { const p = V[i][k], q = V[(i + 1) % NR][k]; const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], dx = m[0] - HIT[0], dy = m[1] - HIT[1], L = Math.hypot(dx, dy) || 1, b = (R() - 0.3) * 0.18 * r; return [m[0] + dx / L * b, m[1] + dy / L * b]; }));
  const shards = [];
  for (let i = 0; i < NR; i++) { const j = (i + 1) % NR; let k0 = 0;
    for (let k = 1; k < RINGS.length; k++) { if (!ringOn[i][k]) continue;
      const poly = []; for (let q = k0; q <= k; q++) poly.push(V[i][q]); poly.push(ringMid[i][k]); for (let q = k; q >= k0; q--) poly.push(V[j][q]); if (k0 > 0) poly.push(ringMid[i][k0]);
      shards.push({ poly, k0, k, i }); k0 = k; } }
  // the dark behind the glass (what shows in the gaps and the holes)
  g.fillStyle = '#01040a'; g.fillRect(0, 0, W, H);
  const holes = [];
  { const cand = shards.filter(s => s.k0 >= 1 && s.k0 <= 3 && s.k <= 4 && Math.max(...s.poly.map(p => p[1])) < H * 0.6 && A(...s.poly.reduce((a, p) => [a[0] + p[0] / s.poly.length, a[1] + p[1] / s.poly.length], [0, 0])) <= 20);   // (one cluster of pieces knocked out, off the follower: one hole, not two, which would read as eyes)
    if (cand.length) { const c0 = cand[Math.floor(R() * cand.length)]; c0.out = true; cand.forEach(s => { if (s !== c0 && (s.i === (c0.i + 1) % NR) && R() < 0.7) s.out = true; }); } }
  shards.forEach(s => {
    const c = s.poly.reduce((a, p) => [a[0] + p[0] / s.poly.length, a[1] + p[1] / s.poly.length], [0, 0]), dx = c[0] - HIT[0], dy = c[1] - HIT[1], L = Math.hypot(dx, dy) || 1;
    const f = Math.pow(Math.max(0, 1 - s.k0 / 6), 1.6);   // (how hard this shard was hit: the nearer the middle, the harder)
    const onIt = A(c[0], c[1]) > 20;   // (over the follower: never knocked out, so it reads)
    if (s.out) { holes.push(s); return; }   // (knocked out)
    s.on = onIt;
    const calm = onIt ? 0.6 : 1, push = (1.2 + 6 * f) * (0.5 + R()) * calm, side = (R() - 0.5) * 4 * f * calm, rot = (R() - 0.5) * 0.06 * f * calm;
    s.d = [dx / L * push - dy / L * side, dy / L * push + dx / L * side]; s.rot = rot; s.c = c;
    g.save(); g.beginPath(); s.poly.forEach(([x, y], q) => { const X = x + s.d[0], Y = y + s.d[1]; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.clip();
    g.translate(c[0] + s.d[0], c[1] + s.d[1]); g.rotate(rot); g.translate(-c[0], -c[1]); g.drawImage(snap, 0, 0); g.restore();
    // each shard catches the light a little differently (a sheen across it), so the pieces read as glass
    g.save(); g.beginPath(); s.poly.forEach(([x, y], q) => { const X = x + s.d[0], Y = y + s.d[1]; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.clip();
    const a = R() * TAU, sh = g.createLinearGradient(c[0] - Math.cos(a) * 80, c[1] - Math.sin(a) * 80, c[0] + Math.cos(a) * 80, c[1] + Math.sin(a) * 80);
    const st = 0.03 + 0.09 * R() * (0.4 + f); sh.addColorStop(0, 'rgba(220,245,255,0)'); sh.addColorStop(0.5, 'rgba(220,245,255,' + st + ')'); sh.addColorStop(1, 'rgba(220,245,255,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = sh; g.fillRect(0, 0, W, H); g.restore();
  });
  // the crack lines: each shard's edge as a bevel (a dark line, a bright edge where the glass's thickness catches the light), heavier near the middle and thinner going out
  shards.forEach(s => { if (!s.d) return; const f = Math.max(0, 1 - s.k0 / 6);
    const path = (ox, oy) => { g.beginPath(); s.poly.forEach(([x, y], q) => { const X = x + s.d[0] + ox, Y = y + s.d[1] + oy; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
    g.save(); g.lineJoin = 'round'; const al = fade(s.c[1]) * (s.on ? 0.75 : 1);
    g.strokeStyle = 'rgba(0,4,12,' + (0.75 * al) + ')'; g.lineWidth = 1.4 + 1.6 * f; path(0, 0); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(200,240,255,' + ((0.35 + 0.4 * f) * al) + ')'; g.lineWidth = 0.9; path(-0.7, -0.7); g.stroke();
    g.restore(); });
  // the holes: pieces knocked out, black behind, their broken edge glinting
  holes.forEach(s => { g.save(); g.beginPath(); s.poly.forEach(([x, y], q) => q ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = '#010309'; g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(220,248,255,0.8)'; g.lineWidth = 1.2; g.stroke(); g.restore(); });
  // the middle crushed: a white star of fine fractures and powdered glass right at the point of impact, with a cold flash
  g.save(); g.globalCompositeOperation = 'lighter';
  blob(g, HIT[0], HIT[1], 34, [[0, 'rgba(255,255,255,0.7)'], [0.3, 'rgba(210,245,255,0.25)'], [1, fxa(0)]]);
  for (let i = 0; i < 90; i++) { const a = R() * TAU, r0 = R() * 8, r1 = r0 + 5 + Math.pow(R(), 1.5) * 36; g.strokeStyle = 'rgba(235,250,255,' + (0.25 + R() * 0.5) + ')'; g.lineWidth = 0.5 + R() * 0.8;
    g.beginPath(); g.moveTo(HIT[0] + Math.cos(a) * r0, HIT[1] + Math.sin(a) * r0); g.lineTo(HIT[0] + Math.cos(a + (R() - 0.5) * 0.2) * r1, HIT[1] + Math.sin(a + (R() - 0.5) * 0.2) * r1); g.stroke(); }
  for (let i = 0; i < 120; i++) { const a = R() * TAU, d = Math.pow(R(), 2) * 60; g.fillStyle = 'rgba(240,252,255,' + (0.3 + R() * 0.6) + ')'; g.fillRect(HIT[0] + Math.cos(a) * d, HIT[1] + Math.sin(a) * d, 1 + R() * 1.5, 1 + R() * 1.5); }
  g.restore();
  // hairline cracks branching off the main ones, out toward the edges
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const s = shards[Math.floor(R() * shards.length)]; if (!s.d || s.k0 < 2) continue; const p = s.poly[Math.floor(R() * s.poly.length)];
    let x = p[0] + s.d[0], y = p[1] + s.d[1], a = Math.atan2(y - HIT[1], x - HIT[0]) + (R() - 0.5) * 1.6; const pts = [[x, y]]; for (let q = 0; q < 4; q++) { a += (R() - 0.5) * 0.6; x += Math.cos(a) * (6 + R() * 14); y += Math.sin(a) * (6 + R() * 14); pts.push([x, y]); }
    const al = fade(y); g.strokeStyle = 'rgba(0,4,12,' + (0.5 * al) + ')'; g.lineWidth = 0.9; g.beginPath(); pts.forEach(([X, Y], q) => q ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.stroke();
    g.strokeStyle = 'rgba(210,240,255,' + (0.3 * al) + ')'; g.lineWidth = 0.5; g.beginPath(); pts.forEach(([X, Y], q) => q ? g.lineTo(X - 0.6, Y - 0.6) : g.moveTo(X - 0.6, Y - 0.6)); g.stroke(); }
  g.restore();
  // a few glints: bright points where the broken edges catch the light
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) { const s = shards[Math.floor(R() * shards.length)]; if (!s.d || s.k0 > 4) continue; const p = s.poly[Math.floor(R() * s.poly.length)], x = p[0] + s.d[0], y = p[1] + s.d[1]; if (y > H * 0.7) continue;
    blob(g, x, y, 7 + R() * 7, [[0, 'rgba(255,255,255,0.85)'], [0.3, 'rgba(200,240,255,0.3)'], [1, 'rgba(200,240,255,0)']]);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.7; const L = 8 + R() * 10; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L * 0.6); g.lineTo(x, y + L * 0.6); g.stroke(); }
  g.restore();
  info.shards = shards.length; info.holes = holes.length;
  }
  if (P.through) { g.save(); g.beginPath(); g.arc(HIT[0], HIT[1], P.through, 0, TAU); g.clip(); g.drawImage(model, 0, 0); g.restore(); }   // (followers round 2: its foot punched through the glass: in the hole where the glass came out, the follower itself, unbroken)

  // ---------- 7. ROUGHED UP: scratches, scuffs, grit, dust, chipped edges ----------
  // scuffs: rubbed patches (lighter, soft) and grime (darker, soft), mostly toward the edges and corners
  g.save();
  for (let i = 0; i < RU.scuffs; i++) { const edge = R() < 0.7, x = edge ? (R() < 0.5 ? R() * W * 0.25 : W - R() * W * 0.25) : R() * W, y = R() * H, r = 20 + R() * 60, light = R() < 0.55;
    g.save(); g.translate(x, y); g.rotate(R() * PI); g.scale(1, 0.3 + R() * 0.5); blob(g, 0, 0, r, light ? [[0, 'rgba(200,220,235,0.1)'], [1, 'rgba(200,220,235,0)']] : [[0, 'rgba(10,8,6,0.28)'], [1, 'rgba(10,8,6,0)']]); g.restore(); }
  g.restore();
  // scratches: fine bright lines, some alone, some in parallel bunches (a scrape), a few long ones across the card
  const scratch = (x, y, a, L, w, al) => { const bend = (R() - 0.5) * L * 0.15, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
    const gr = g.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, 'rgba(230,240,250,0)'); gr.addColorStop(0.2, 'rgba(230,240,250,' + al + ')'); gr.addColorStop(0.75, 'rgba(230,240,250,' + al * 0.7 + ')'); gr.addColorStop(1, 'rgba(230,240,250,0)');
    g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,' + al * 0.5 + ')'; g.lineWidth = w * 0.8; g.beginPath(); g.moveTo(x + 0.8, y + 0.8); g.quadraticCurveTo(mx + 0.8, my + 0.8, ex + 0.8, ey + 0.8); g.stroke(); };
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < RU.scrapes; i++) { const x = R() * W, y = R() * H, a = -0.4 + (R() - 0.5) * 1.2, n = 3 + Math.floor(R() * 5); for (let q = 0; q < n; q++) scratch(x + q * 2.2 + R(), y + q * 3 + R() * 2, a + (R() - 0.5) * 0.04, 30 + R() * 70, 0.6 + R() * 0.5, 0.26 + R() * 0.24); }
  for (let i = 0; i < RU.singles; i++) scratch(R() * W, R() * H, R() * TAU, 6 + R() * 30, 0.5 + R() * 0.6, 0.15 + R() * 0.25);
  for (let i = 0; i < RU.longs; i++) scratch(R() * W * 0.3, R() * H, -0.3 + (R() - 0.5) * 0.5, 200 + R() * 200, 0.8, 0.22);
  g.restore();
  // grit: a fine speckle of dark and light specks all over, thicker at the edges
  { const id = g.getImageData(0, 0, W, H), d = id.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = Math.min(x, y, W - 1 - x, H - 1 - y), edge = e < 30 ? 1 - e / 30 : 0, n = R(), i4 = (y * W + x) * 4, j = (R() - 0.5) * RU.grain;   // (a light grain over everything)
      d[i4] += j; d[i4 + 1] += j; d[i4 + 2] += j;
      if (n < RU.specks + RU.edgeSpecks * edge) { const v = R() < 0.6 ? -70 - R() * 60 : 60 + R() * 60; d[i4] += v; d[i4 + 1] += v; d[i4 + 2] += v; } }
    g.putImageData(id, 0, 0); }
  // dust: soft motes in the air and a haze of grit settled along the bottom and in the corners
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < RU.dust; i++) { const x = R() * W, y = R() * H, r = 0.6 + Math.pow(R(), 3) * 3; blob(g, x, y, r * 2.5, [[0, 'rgba(220,235,250,' + (0.25 + R() * 0.35) + ')'], [1, 'rgba(220,235,250,0)']]); }
  g.restore();
  // chipped edges: bites knocked out of the card's edge (the dark card stock showing, a pale broken rim), more at the corners
  g.save();
  const chipEdge = (x, y, nx, ny, r) => { const tx = -ny, ty = nx, pts = [[x - tx * r, y - ty * r]]; const n = 4 + Math.floor(R() * 3);
    for (let q = 1; q < n; q++) { const t = q / n, dep = r * (0.4 + R() * 0.7) * Math.sin(t * PI); pts.push([x + tx * r * (2 * t - 1) + nx * -dep + (R() - 0.5) * 2, y + ty * r * (2 * t - 1) + ny * -dep]); } pts.push([x + tx * r, y + ty * r]);
    pts.push([x + tx * r + nx * 4, y + ty * r + ny * 4]); pts.push([x - tx * r + nx * 4, y - ty * r + ny * 4]);
    g.beginPath(); pts.forEach(([X, Y], q) => q ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.closePath(); g.fillStyle = '#05070c'; g.fill();
    g.strokeStyle = 'rgba(190,215,235,0.55)'; g.lineWidth = 0.9; g.beginPath(); pts.slice(0, n + 1).forEach(([X, Y], q) => q ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.stroke(); };
  for (let i = 0; i < RU.chips; i++) { const side = Math.floor(R() * 4), t = R() < 0.4 ? (R() < 0.5 ? R() * 0.12 : 1 - R() * 0.12) : R(), r = 2 + Math.pow(R(), 2) * 9;
    if (side === 0) chipEdge(t * W, 0, 0, -1, r); else if (side === 1) chipEdge(t * W, H, 0, 1, r); else if (side === 2) chipEdge(0, t * H, -1, 0, r); else chipEdge(W, t * H, 1, 0, r); }
  // the corners worn: rounded off and rubbed pale
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) blob(g, cx, cy, 28 + R() * 14, [[0, 'rgba(200,215,230,0.22)'], [1, 'rgba(200,215,230,0)']]);
  g.restore();
  info.hit = HIT.map(Math.round);
  return { png: out.toDataURL('image/png'), info };
}

// ROUND 2's GLASS (the owner, 2026-11-17: "Fewer, bigger cracks" and "Pieces flying out"): a few bold breaks from the point of impact that split the card into large slabs, the
// middle knocked clean out, and those pieces (and a few more) bursting toward the viewer: bigger as they come nearer, turned, each carrying its own bit of the picture, with the
// glass's thickness at its edge. The gaps they left are dark, their broken rims glinting.
function SHATTER_SLABS(o) {
  const { g, W, H, R, cv, clear, snap, HIT, blob, fxa, fade, PI, TAU } = o;
  const NR = 7, RAD = [0, 46, 120, 215, 330, 500, 1100];   // (radii along each break; rings of cracks only at 46 (the hole's rim), sometimes at 120 or 215, and the edge)
  const angs = []; for (let i = 0; i < NR; i++) angs.push((i + (R() - 0.5) * 0.55) / NR * TAU + 0.35); angs.sort((a, b) => a - b);
  const V = angs.map(a => RAD.map((r, k) => { if (k === 0) return HIT.slice(); const aa = a + (R() - 0.5) * (k === 1 ? 0.25 : 0.1), rr = r * (0.88 + R() * 0.24); return [HIT[0] + Math.cos(aa) * rr, HIT[1] + Math.sin(aa) * rr]; }));
  const ringOn = angs.map(() => RAD.map((r, k) => k === 1 || k === RAD.length - 1 || ((k === 2 || k === 3) && R() < 0.3)));
  const mid = angs.map((a, i) => RAD.map((r, k) => { const p = V[i][k], q = V[(i + 1) % NR][k], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], dx = m[0] - HIT[0], dy = m[1] - HIT[1], L = Math.hypot(dx, dy) || 1, b = (R() - 0.2) * 0.22 * r; return [m[0] + dx / L * b, m[1] + dy / L * b]; }));
  const shards = [];
  for (let i = 0; i < NR; i++) { const j = (i + 1) % NR; let k0 = 0;
    for (let k = 1; k < RAD.length; k++) { if (!ringOn[i][k]) continue;
      const poly = []; for (let q = k0; q <= k; q++) poly.push(V[i][q]); poly.push(mid[i][k]); for (let q = k; q >= k0; q--) poly.push(V[j][q]); if (k0 > 0) poly.push(mid[i][k0]);
      const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]); shards.push({ poly, k0, k, i, c }); k0 = k; } }
  // which go: every piece of the middle (inside the hole's rim), and one or two of the slabs round it whose middle is dark (the cave or the sky: the Maw's shell stays in place)
  const lum = (x, y) => { const d = snap.getContext('2d').getImageData(Math.max(0, Math.min(W - 1, x | 0)), Math.max(0, Math.min(H - 1, y | 0)), 1, 1).data; return 0.3 * d[0] + 0.59 * d[1] + 0.11 * d[2]; };
  shards.forEach(s => { if (s.k0 === 0) s.out = true; });
  const cand = shards.filter(s => s.k0 === 1 && s.k === 2 && s.c[1] < H * 0.62 && lum(s.c[0], s.c[1]) < 90 && (!o.clearGlass || s.poly.every(([x, y]) => clear.every(([cx, cy, cr]) => Math.hypot(x - cx, y - cy) > cr))));   // (round 3: not over its fangs and teeth)
  for (let n = 0; n < 1 && cand.length; n++) cand.splice(Math.floor(R() * cand.length), 1)[0].out = true;
  const path = (G, poly, d, ox, oy) => { G.beginPath(); poly.forEach(([x, y], q) => { const X = x + d[0] + (ox || 0), Y = y + d[1] + (oy || 0); q ? G.lineTo(X, Y) : G.moveTo(X, Y); }); G.closePath(); };
  // behind the glass: dark, a cold light leaking round the hole
  g.fillStyle = '#01040a'; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; blob(g, HIT[0], HIT[1], 120, [[0, fxa(0.22)], [1, fxa(0)]]); g.restore();
  // the slabs that stay: nudged out of line a little and turned a hair, each with its own sheen
  shards.forEach(s => { if (s.out) return; const dx = s.c[0] - HIT[0], dy = s.c[1] - HIT[1], L = Math.hypot(dx, dy) || 1, push = (s.k0 === 1 ? 4 : 2) + R() * 2.5, side = (R() - 0.5) * 3;
    s.d = [dx / L * push - dy / L * side, dy / L * push + dx / L * side]; const rot = (R() - 0.5) * (s.k0 === 1 ? 0.02 : 0.01);
    g.save(); path(g, s.poly, s.d); g.clip(); g.translate(s.c[0] + s.d[0], s.c[1] + s.d[1]); g.rotate(rot); g.translate(-s.c[0], -s.c[1]); g.drawImage(snap, 0, 0); g.restore();
    g.save(); path(g, s.poly, s.d); g.clip(); const a = R() * TAU, sh = g.createLinearGradient(s.c[0] - Math.cos(a) * 140, s.c[1] - Math.sin(a) * 140, s.c[0] + Math.cos(a) * 140, s.c[1] + Math.sin(a) * 140);
    sh.addColorStop(0, 'rgba(220,245,255,0)'); sh.addColorStop(0.5, 'rgba(220,245,255,' + (0.04 + 0.06 * R()) + ')'); sh.addColorStop(1, 'rgba(220,245,255,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = sh; g.fillRect(0, 0, W, H); g.restore(); });
  // the bold breaks: a dark gap, the glass's thick edge catching the light on one side
  shards.forEach(s => { if (!s.d) return; const al = fade(s.c[1]);
    g.save(); g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,3,10,' + (0.85 * al) + ')'; g.lineWidth = 3.2; path(g, s.poly, s.d); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(190,235,255,' + (0.55 * al) + ')'; g.lineWidth = 1.5; path(g, s.poly, s.d, -1.1, -1.1); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,' + (0.35 * al) + ')'; g.lineWidth = 0.6; path(g, s.poly, s.d, -1.6, -1.6); g.stroke(); g.restore(); });
  // the gaps' rims: the broken edge of the glass round where the pieces came out, glinting, a few short fractures running off it
  shards.forEach(s => { if (!s.out) return; const rim = s.k0 === 0 ? s.poly.filter(p => p !== HIT && !(p[0] === HIT[0] && p[1] === HIT[1])) : s.poly;   // (the middle's pieces: only their outer edge is the hole's rim)
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(210,245,255,0.75)'; g.lineWidth = 1.4; g.beginPath(); rim.forEach(([x, y], q) => q ? g.lineTo(x, y) : g.moveTo(x, y)); if (s.k0) g.closePath(); g.stroke(); g.restore(); });
  g.save(); g.lineCap = 'round';
  for (let n = 0; n < 26; n++) { const a = R() * TAU, r0 = 44 + R() * 8, r1 = r0 + 8 + R() * 26, x0 = HIT[0] + Math.cos(a) * r0, y0 = HIT[1] + Math.sin(a) * r0, x1 = HIT[0] + Math.cos(a + (R() - 0.5) * 0.15) * r1, y1 = HIT[1] + Math.sin(a + (R() - 0.5) * 0.15) * r1;
    g.strokeStyle = 'rgba(0,3,10,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = 'rgba(210,240,255,0.45)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x0 - 0.6, y0 - 0.6); g.lineTo(x1 - 0.6, y1 - 0.6); g.stroke(); }
  g.restore();
  // THE PIECES FLYING OUT: each piece that went, and the middle broken in two more, thrown out from the hit toward the lens: further out and bigger the nearer they come,
  // turned and tipped (a skew), the glass's thickness drawn as a pale edge behind its face, its face carrying its bit of the picture under a bright sheen, its rim white.
  if (o.clearGlass) CLEAR_PIECES(); else {
  const pieces = []; shards.forEach(s => { if (!s.out) return;
    pieces.push(s.poly); });
  const fly = [];
  pieces.forEach(poly => { const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]); let dx = c[0] - HIT[0], dy = c[1] - HIT[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const near = fly.length / pieces.length * 0.8 + R() * 0.2; fly.push({ poly, c, dx, dy, dist: 40 + near * 250 + L * 0.4, sc: 1.3 + near * 1.6, rot: (R() - 0.5) * 1.2, skew: (R() - 0.5) * 0.5, near }); });   // (spread from near the hole to past the lens)
  fly.sort((a, b) => a.near - b.near);   // (the nearest drawn last)
  fly.forEach(f => {
    const pc = cv(), pg = pc.getContext('2d'); pg.save(); path(pg, f.poly, [0, 0]); pg.clip(); pg.drawImage(snap, 0, 0); pg.restore();
    let X, Y, ok = false; for (let t = 0; t < 60; t++) {   // (where it lands: along its way out, nudged off the follower's fangs (clear: [x, y, r] on the picture) so they stay in sight)
      const a = Math.atan2(f.dy, f.dx) + (t ? (R() - 0.5) * 1.4 : 0), d = f.dist * (t ? 0.7 + R() * 0.6 : 1); X = f.c[0] + Math.cos(a) * d; Y = f.c[1] + Math.sin(a) * d * 0.9;
      const sz = 22 * f.sc; if (Y + sz * 0.5 < H * 0.6 && clear.every(([cx, cy, cr]) => Math.hypot(X - cx, Y - cy) > cr + sz)) { ok = true; break; } }   // (and none over the name plate)
    if (!ok) return;   // (nowhere clear for it: left out)
    const put = (G, fn) => { G.save(); G.translate(X, Y); G.rotate(f.rot); G.transform(1, 0, f.skew, 1, 0, 0); G.scale(f.sc, f.sc); G.translate(-f.c[0], -f.c[1]); fn(G); G.restore(); };
    const lay = cv(), lg = lay.getContext('2d');
    put(lg, G => { G.fillStyle = 'rgba(70,140,180,0.9)'; path(G, f.poly, [2.5, 3.5]); G.fill(); G.strokeStyle = 'rgba(200,240,255,0.7)'; G.lineWidth = 1 / f.sc; G.stroke(); });   // (its thickness)
    put(lg, G => { G.globalAlpha = 0.6; G.drawImage(pc, 0, 0); G.globalAlpha = 1; G.save(); path(G, f.poly, [0, 0]); G.clip();
      const sh = G.createLinearGradient(f.c[0] - 60, f.c[1] - 60, f.c[0] + 60, f.c[1] + 60); sh.addColorStop(0, 'rgba(230,250,255,0.3)'); sh.addColorStop(0.45, 'rgba(200,240,255,0.04)'); sh.addColorStop(1, 'rgba(200,240,255,0.14)');
      G.fillStyle = sh; G.fillRect(0, 0, W, H); G.strokeStyle = 'rgba(255,255,255,0.35)'; G.lineWidth = 5 / f.sc; path(G, f.poly, [0, 0]); G.stroke(); G.restore(); G.strokeStyle = 'rgba(255,255,255,0.95)'; G.lineWidth = 1.4 / f.sc; path(G, f.poly, [0, 0]); G.stroke(); });   // (a clear face: the world behind shows through it, its rim bright inside and out)
    g.save(); g.globalAlpha = 0.6; g.filter = 'blur(6px)'; g.drawImage(lay, 0, 0); g.restore();   // (a soft shadow-glow round it, for depth)
    g.save(); if (f.near > 0.75) g.filter = 'blur(' + (1.5 + (f.near - 0.75) * 10) + 'px)'; g.drawImage(lay, 0, 0); g.restore();   // (the nearest out of focus)
  });
  }
  // ROUND 3's PIECES (clear glass): each piece that went (the middle's broken in two), thrown out all round the hit (up, down and to the sides), bigger the nearer they come.
  // Each is CLEAR: what lies behind it on the card seen through it, shifted and a little magnified (refraction) and faintly tinted; a bright streak of reflection across it;
  // its thickness as a pale band along one side with a bright line; a white rim with a hair of colour split at its edge; a faint shadow behind. The nearest out of focus.
  function CLEAR_PIECES() {
    const pieces = []; shards.forEach(s => { if (!s.out) return; if (s.k0 === 0) { const p = s.poly, m = Math.floor(p.length / 2); pieces.push(p.slice(0, m + 1), p.slice(m).concat([p[0]])); } else pieces.push(s.poly); });   // (the middle's each broken in two; a piece with nowhere clear to land is left out)
    const n = pieces.length, ord = pieces.map((p, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
    const fly = [];
    ord.forEach((pi, q) => { const poly = pieces[pi], c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]), near = R();
      fly.push({ poly, c, ang: (q + 0.5) / n * TAU + (R() - 0.5) * 0.4, dist: 100 + near * 190, sc: 1.3 + near * 1.5, rot: (R() - 0.5) * 1.4, skew: (R() - 0.5) * 0.5, near }); });   // (their ways out spread evenly round the hit)
    fly.sort((a, b) => a.near - b.near);
    const back = cv(); back.getContext('2d').drawImage(g.canvas, 0, 0);   // (the card as it is now, cracked: what is seen through each piece)
    let placed = 0;
    fly.forEach(f => {
      let X, Y, ok = false; for (let t = 0; t < 90; t++) { const a = f.ang + (t ? (R() - 0.5) * 0.9 : 0), d = Math.max(95, f.dist * (t ? 0.55 + R() * 0.9 : 1));   // (flown well clear of its mouth)
        X = HIT[0] + Math.cos(a) * d; Y = HIT[1] + Math.sin(a) * d * 0.9;
        const sz = 20 * f.sc, plate = Y + sz * 0.5 < H * 0.56 || X < 50 || X > W - 50;   // (the name kept clear: below its top only down the card's two sides)
        if (plate && X > -10 && X < W + 10 && Y > -10 && clear.every(([cx, cy, cr]) => Math.hypot(X - cx, Y - cy) > cr + sz)) { ok = true; break; } }
      if (!ok) return; placed++;
      const tf = G => { G.translate(X, Y); G.rotate(f.rot); G.transform(1, 0, f.skew, 1, 0, 0); G.scale(f.sc, f.sc); G.translate(-f.c[0], -f.c[1]); };
      const shape = (G, ox, oy) => { G.save(); G.translate(ox || 0, oy || 0); tf(G); path(G, f.poly, [0, 0]); G.restore(); };   // (the path stays after restore, in screen space)
      const lay = cv(), L = lay.getContext('2d'), th = [2 + f.sc * 1.6, 3 + f.sc * 2];
      shape(L, th[0], th[1]); L.fillStyle = 'rgba(110,180,220,0.42)'; L.fill(); L.strokeStyle = 'rgba(210,245,255,0.7)'; L.lineWidth = 1; L.stroke();   // its thickness
      shape(L); L.save(); L.clip(); L.clearRect(0, 0, W, H);
      const rx = (R() - 0.5) * 14, ry = (R() - 0.5) * 14; L.translate(X, Y); L.scale(1.1, 1.1); L.translate(-X + rx, -Y + ry); L.drawImage(back, 0, 0); L.setTransform(1, 0, 0, 1, 0, 0);   // the card behind, refracted
      L.fillStyle = 'rgba(170,225,255,0.13)'; L.fillRect(0, 0, W, H);   // its tint
      const sa = -0.8 + (R() - 0.5) * 0.6, sw = 18 * f.sc, so = (R() - 0.5) * 14 * f.sc, sx = X + Math.cos(sa + PI / 2) * so, sy = Y + Math.sin(sa + PI / 2) * so;   // a streak of reflection across it
      const st = L.createLinearGradient(sx - Math.cos(sa + PI / 2) * sw, sy - Math.sin(sa + PI / 2) * sw, sx + Math.cos(sa + PI / 2) * sw, sy + Math.sin(sa + PI / 2) * sw);
      st.addColorStop(0, 'rgba(255,255,255,0)'); st.addColorStop(0.45, 'rgba(255,255,255,0.32)'); st.addColorStop(0.55, 'rgba(255,255,255,0.4)'); st.addColorStop(1, 'rgba(255,255,255,0)'); L.fillStyle = st; L.fillRect(0, 0, W, H);
      shape(L); L.strokeStyle = 'rgba(220,250,255,0.35)'; L.lineWidth = 6; L.stroke(); L.restore();   // (a glow inside its edge)
      shape(L, 1, 0.5); L.strokeStyle = 'rgba(255,140,150,0.35)'; L.lineWidth = 1; L.stroke(); shape(L, -1, -0.5); L.strokeStyle = 'rgba(120,230,255,0.45)'; L.stroke();   // (a hair of colour split at its rim)
      shape(L); L.strokeStyle = 'rgba(255,255,255,0.95)'; L.lineWidth = 1.4; L.stroke();
      g.save(); g.filter = 'blur(5px)'; shape(g, 5, 8); g.fillStyle = 'rgba(0,4,14,0.35)'; g.fill(); g.restore();   // (a faint shadow behind, to lift it off the card)
      g.save(); if (f.near > 0.72) g.filter = 'blur(' + (1 + (f.near - 0.72) * 9) + 'px)'; g.drawImage(lay, 0, 0); g.restore(); });
    o.info.pieces = placed;
  }
  // splinters: small bright slivers of glass thrown out with them
  g.save();
  for (let n = 0; n < 14; n++) { const a = R() * TAU, d = 40 + Math.pow(R(), 0.7) * 230, x = HIT[0] + Math.cos(a) * d, y = HIT[1] + Math.sin(a) * d, L = 4 + R() * 12 * (d / 150), w = 1.5 + R() * 3;
    g.save(); g.translate(x, y); g.rotate(a + (R() - 0.5) * 1.5); g.beginPath(); g.moveTo(-L, 0); g.lineTo(0, -w); g.lineTo(L * 0.7, 0); g.lineTo(0, w * 0.6); g.closePath();
    g.fillStyle = 'rgba(200,240,255,0.55)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 0.7; g.stroke(); g.restore(); }
  g.restore();
  // the hit's cold flash, small, at the heart of the hole
  g.save(); g.globalCompositeOperation = 'lighter'; blob(g, HIT[0], HIT[1], 40, [[0, 'rgba(255,255,255,0.55)'], [0.4, fxa(0.2)], [1, fxa(0)]]); g.restore();
}

// ---------- A TECHNICIAN'S PICTURE (the ring style: the owner, 2026-11-17, "surrounded by a very intact ring of crystals while they raise their claws or whatever they have"):
// its element's world behind, the floor, the follower rearing inside a WHOLE ring of crystals (in the 3-D render), the ring's light on the floor and rising off it. Clean: no cracks,
// no grit (those are the Brawlers'). Run in the page (its source is put there with toString), after the 3-D renders.
function TECH(o) {
  const { W, H, R, cv, model, ringCv, bodyCv, floorCv, pr, hzAt, slope, up, info, P, ringTips } = o, PI = Math.PI, TAU = 2 * PI;
  const rgb = (h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)])(P.fx), fxa = a => 'rgba(' + rgb.join(',') + ',' + a + ')';
  const out = cv(), g = out.getContext('2d');
  // the world's tones (followers round 1: P.tone for a Technician in another world than the core; the defaults are the Hammer Slug's, unchanged)
  const TN = Object.assign({ sky: '#010a09', hz: ['rgba(4,38,31,0)', 'rgba(6,60,50,0.85)', '#04261f'], halo: 'rgba(0,8,6,1)', white: '220,255,248', ringWhite: '#d8fff6', star: '230,255,250', vig: 'rgba(0,8,6,0.6)', foot: ['rgba(1,10,9,0)', 'rgba(1,10,9,0.65)'],
    worldK: 0.6, ringGlow: [0.55, 0.35] }, P.tone || {});
  const rad = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (G, x, y, r, stops) => { G.fillStyle = rad(G, x, y, r, stops); G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const mask = (src, blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(src, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  // 1. FAR: the core energy card's reactor (its hex lattice and rings: js/energygem.js, with that card's own seed), tilted with the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.fillStyle = TN.sky; g.fillRect(0, 0, W, H);
  { const hz = hzAt(W / 2), top = -(hz + 60), hh = hz + 110, kx = 1.6;
    g.save(); g.translate(W / 2, hz); g.rotate(slope); g.filter = 'blur(1.5px)'; g.drawImage(ws, -225 * kx, top, 450 * kx, hh); g.filter = 'none';
    g.globalAlpha = TN.worldK; g.drawImage(wm, -225 * kx, top, 450 * kx, hh); g.restore(); g.globalAlpha = 1; }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -110, 0, 30); lg.addColorStop(0, TN.hz[0]); lg.addColorStop(0.8, TN.hz[1]); lg.addColorStop(1, TN.hz[2]);
  g.fillStyle = lg; g.fillRect(-W, -110, 2 * W, 140); g.restore();
  if (TN.dim) { g.fillStyle = 'rgba(0,0,0,' + TN.dim + ')'; g.fillRect(0, 0, W, H); }   // (followers round 3: the world dimmed behind a dark follower, as the Seeper's)
  // 2. THE FLOOR (3-D), a line of the reactor's light along the horizon, and the ring's light on the floor: a glowing circle where the crystals stand, soft light pooled inside it
  if (TN.floorDim) { const fl = cv(), fc = fl.getContext('2d'); fc.drawImage(floorCv, 0, 0); fc.globalCompositeOperation = 'source-atop'; fc.fillStyle = 'rgba(0,0,0,' + TN.floorDim + ')'; fc.fillRect(0, 0, W, H); g.drawImage(fl, 0, 0); } else
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[24, 0.1], [7, 0.22], [2, 0.5]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, fxa(0)); lb.addColorStop(0.5, fxa(a)); lb.addColorStop(1, fxa(0)); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  const circ = (r, y) => { const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU; pts.push(pr([Math.sin(a) * r, y || 0.01, Math.cos(a) * r])); } return pts; };
  const line = (pts, w, col, blur) => { g.save(); g.globalCompositeOperation = 'lighter'; if (blur) g.filter = 'blur(' + blur + 'px)'; g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore(); };
  { const pool = circ(P.ring.r); g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(14px)'; g.fillStyle = fxa(0.16); g.beginPath(); pool.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); g.restore();
    line(pool, 14, fxa(0.25), 8); line(pool, 3, fxa(0.7), 1); line(pool, 1, 'rgba(' + TN.white + ',0.8)');
    const inner = circ(P.ring.r * 0.72); g.save(); g.setLineDash([10, 9]); line(inner, 1.5, fxa(0.45)); g.restore(); }   // (an inner dashed ring, as the reactor's own)
  // 3. THE FOLLOWER AND ITS RING: a dark halo behind them so they stand off the floor, the follower's teal glow, the 3-D render (the ring in it, whole), the ring's glow
  g.save(); g.globalAlpha = 0.75; g.drawImage(mask(bodyCv, 12, TN.halo), 0, 5); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45; g.drawImage(mask(bodyCv, 16, P.fx), 0, 0); g.restore();
  if (TN.edge) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = TN.edge[1]; g.drawImage(mask(bodyCv, TN.edge[0], TN.edge[2]), 0, 0); g.restore(); }   // (followers round 3: a thin bright edge round a dark follower, as the Seeper's)
  g.drawImage(model, 0, 0);
  if (P.pudding) {   // (the jelly's soft glow from within: a light inside his body, strongest at its middle, kept inside his outline)
    const ig = cv(), ic = ig.getContext('2d'); ic.drawImage(mask(bodyCv, 10, '#6fffe6'), 0, 0); ic.globalCompositeOperation = 'destination-in'; ic.drawImage(mask(bodyCv, 0, '#000'), 0, 0);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.28; g.drawImage(ig, 0, 0); g.restore(); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = TN.ringGlow[0]; g.drawImage(mask(ringCv, 12, P.fx), 0, 0); g.globalAlpha = TN.ringGlow[1]; g.drawImage(mask(ringCv, 3, TN.ringWhite), 0, 0); g.restore();
  // light rising off each crystal's point (the world's up), and a bright star at the tallest points
  g.save(); g.globalCompositeOperation = 'lighter';
  ringTips.forEach(([x, y]) => { const L = 50 + R() * 70, ex = x + up[0] * L, ey = y + up[1] * L, gr = g.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, fxa(0.35)); gr.addColorStop(1, fxa(0));
    g.strokeStyle = gr; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke(); blob(g, x, y, 9, [[0, 'rgba(' + TN.star + ',0.7)'], [0.4, fxa(0.3)], [1, fxa(0)]]); });
  // motes of the reactor's light rising inside the ring
  for (let i = 0; i < 40; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * P.ring.r * 0.95, p = pr([Math.sin(a) * rr, 0.1 + R() * 1.6, Math.cos(a) * rr]); blob(g, p[0], p[1], 1.5 + R() * 2.5, [[0, 'rgba(' + TN.white + ',0.9)'], [0.4, fxa(0.5)], [1, fxa(0)]]); }
  g.restore();
  // 4. THE GRADE: a vignette, darker at the foot (the name plate reads over it). Clean: the ring is whole and the card is unmarked.
  g.save(); g.fillStyle = rad(g, W * 0.5, H * 0.42, H * 0.78, [[0.5, 'rgba(0,0,0,0)'], [1, TN.vig]]); g.fillRect(0, 0, W, H);
  lg = g.createLinearGradient(0, H * 0.62, 0, H); lg.addColorStop(0, TN.foot[0]); lg.addColorStop(1, TN.foot[1]); g.fillStyle = lg; g.fillRect(0, H * 0.62, W, H * 0.38); g.restore();
  return { png: out.toDataURL('image/png'), info };
}

// ---------- AN ELECTRIC MAGE'S PICTURE (the Mage style, as approved on the Ember Hood, carried to the storm: followers round 1, 2026-11-17): the storm energy card's world behind,
// tilted with the horizon; the follower CHARGED (its silhouette glowing yellow, lit from within, arcs crawling over it and off its edges); and in the very front of the card, the
// focus, its STATIC VORTEX: a whirl of lightning at the lens (the enemy's place), its arms of bolts spiralling in to a white-hot eye, big forks crossing the nearest plane.
// Run in the page (its source is put there with toString), after the 3-D renders.
function STORM_MAGE(o) {
  const { W, H, R, cv, model, floorCv, hzAt, slope, up, info, P, heart } = o, PI = Math.PI, TAU = 2 * PI;
  const out = cv(), g = out.getContext('2d');
  const rad = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (G, x, y, r, stops) => { G.fillStyle = rad(G, x, y, r, stops); G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const Y = a => 'rgba(255,238,51,' + a + ')', Yw = a => 'rgba(255,250,200,' + a + ')';   // (electric's colour, js/config.js ELEMENTS, and its white-hot core)
  const V = P.vortex || {};
  // a jagged bolt along a path: each point pushed off its line at random, finer and finer (midpoint displacement)
  const jag = (pts, amp, depth) => { let p = pts; for (let d = 0; d < depth; d++) { const q = [p[0]]; for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], L = Math.hypot(x1 - x0, y1 - y0) || 1, k = (R() - 0.5) * amp * L / 60;
    q.push([(x0 + x1) / 2 - (y1 - y0) / L * k, (y0 + y1) / 2 + (x1 - x0) / L * k], [x1, y1]); } p = q; amp *= 0.62; } return p; };
  const stroke = (G, pts, w, col) => { G.strokeStyle = col; G.lineWidth = w; G.lineJoin = 'round'; G.lineCap = 'round'; G.beginPath(); pts.forEach(([x, y], i) => i ? G.lineTo(x, y) : G.moveTo(x, y)); G.stroke(); };
  // a bolt drawn as light: a wide soft glow, a yellow body, a white-hot core
  const bolt = (G, pts, w, a) => { G.save(); G.globalCompositeOperation = 'lighter'; G.filter = 'blur(' + (3 + w * 2.5) + 'px)'; stroke(G, pts, w * 5, Y(0.22 * a)); G.filter = 'blur(' + (1 + w * 0.6) + 'px)'; stroke(G, pts, w * 2, Y(0.7 * a)); G.filter = 'none'; stroke(G, pts, Math.max(0.6, w * 0.7), Yw(a)); G.restore(); };
  const fork = (G, pts, w, a, n, len) => { for (let f = 0; f < n; f++) { const i = 2 + Math.floor(R() * (pts.length - 4)), p = pts[i], q = pts[Math.min(pts.length - 1, i + 2)], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + (R() < 0.5 ? -1 : 1) * (0.4 + R() * 0.7), L = len * (0.5 + R() * 0.7);
    bolt(G, jag([p, [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]], 26, 4), w * 0.55, a * 0.85); } };
  // 1. FAR: the storm energy card's world (its clouds and lightning: js/energygem.js, with that card's own seed), tilted with the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.fillStyle = '#0a0814'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.filter = 'blur(2px)'; const k = 1.55; g.drawImage(ws, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.filter = 'none';
  g.globalAlpha = 0.75; g.drawImage(wm, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.restore(); g.globalAlpha = 1;
  // the haze along the horizon, and the storm's glow beyond it
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -150, 0, 40); lg.addColorStop(0, 'rgba(26,22,48,0)'); lg.addColorStop(0.75, 'rgba(40,34,64,0.85)'); lg.addColorStop(1, '#1a1630');
  g.fillStyle = lg; g.fillRect(-W, -150, 2 * W, 190); g.restore();
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = V.cool || 'rgba(70,50,170,0.7)'; g.fillRect(0, 0, W, H); g.restore();   // (the storm's sky cooled toward violet, so the yellow of its lightning stands out)
  // 2. THE FLOOR (3-D), a line of the storm's light along the horizon (so the tilt reads), a glow round the follower
  { const fl = cv(), fc = fl.getContext('2d'); fc.drawImage(floorCv, 0, 0); fc.globalCompositeOperation = 'source-atop'; fc.fillStyle = V.floorDim || 'rgba(12,10,26,0.5)'; fc.fillRect(0, 0, W, H); g.drawImage(fl, 0, 0); }   // (the wet slate darkened under the storm, so the lightning is the light)
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[30, 0.1], [10, 0.22], [2.5, 0.6]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, Y(0)); lb.addColorStop(0.5, h < 4 ? Yw(a) : Y(a)); lb.addColorStop(1, Y(0)); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, heart[0], heart[1], 240, [[0, Y(0.16)], [0.45, Y(0.05)], [1, Y(0)]]); g.fillRect(0, 0, W, H); g.restore();
  // 3. THE FOLLOWER, CHARGED: its silhouette glowing (wide and tight), arcs crawling off its edges, its own render, then lit from within (a yellow light inside its outline,
  //    strongest at its heart) with fine arcs running over its body, and sparks thrown off it
  const mask = (blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(model, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.85; g.drawImage(mask(22, '#ffd400'), 0, 0); g.globalAlpha = 0.7; g.drawImage(mask(6, '#fff27a'), 0, 0); g.restore();
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const edges = []; for (let y = 2; y < H - 2; y += 2) for (let x = 2; x < W - 2; x += 2) { if (A(x, y) > 120 && (A(x - 3, y) < 40 || A(x + 3, y) < 40 || A(x, y - 3) < 40 || A(x, y + 3) < 40)) edges.push([x, y]); }
  const inside = []; for (let y = 2; y < H - 2; y += 4) for (let x = 2; x < W - 2; x += 4) if (A(x, y) > 200) inside.push([x, y]);
  const halo = cv(), hg = halo.getContext('2d');
  for (let i = 0; i < (V.edgeArcs || 22); i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const dx = e[0] - heart[0], dy = e[1] - heart[1], L = Math.hypot(dx, dy) || 1, len = 18 + R() * 46, a = Math.atan2(dy, dx) + (R() - 0.5) * 0.9;
    bolt(hg, jag([e, [e[0] + Math.cos(a) * len, e[1] + Math.sin(a) * len]], 30, 3), 0.9 + R() * 0.8, 0.8); }
  g.drawImage(halo, 0, 0);
  g.drawImage(model, 0, 0);
  { const ig = cv(), ic = ig.getContext('2d'); ic.fillStyle = rad(ic, heart[0], heart[1] + 20, 110, [[0, 'rgba(255,240,140,0.8)'], [0.4, 'rgba(255,220,40,0.4)'], [1, 'rgba(255,200,0,0.05)']]); ic.fillRect(0, 0, W, H);
    for (let i = 0; i < (V.bodyArcs || 7); i++) { const a = inside[Math.floor(R() * inside.length)], b = inside[Math.floor(R() * inside.length)]; if (!a || !b || Math.hypot(a[0] - b[0], a[1] - b[1]) < 50) { i -= 0.5; continue; } bolt(ic, jag([a, b], 40, 4), 0.8 + R() * 0.6, 0.9); }
    ic.globalCompositeOperation = 'destination-in'; ic.drawImage(model, 0, 0);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = V.inner == null ? 0.75 : V.inner; g.drawImage(ig, 0, 0); g.restore(); }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 36; i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 8 + R() * 70, x = e[0] + (e[0] - heart[0]) / 120 * d + (R() - 0.5) * 20, y = e[1] + (e[1] - heart[1]) / 120 * d + (R() - 0.5) * 20; blob(g, x, y, 1.2 + R() * 2.4, [[0, Yw(1)], [0.4, Y(0.8)], [1, Y(0)]]); }
  g.restore();
  // 4. NEAR: STATIC VORTEX at the lens. Its eye (where the pull bites) low on the left; arms of lightning spiralling in to it, on a ring lying on the floor (so it tilts with the
  //    world), big enough that its near arms sweep across the very front of the card; a bolt from the Thunderhead down into it (the cast); forks off every arm; sparks pulled in.
  const E = [W * (V.eye ? V.eye[0] : 0.3), H * (V.eye ? V.eye[1] : 0.68)], RX = W * (V.rx || 0.62), RY = RX * (V.squash || 0.42), ang0 = slope;
  const onRing = (t, r) => { const a = t, x = Math.cos(a) * r * RX, y = Math.sin(a) * r * RY; return [E[0] + x * Math.cos(ang0) - y * Math.sin(ang0), E[1] + x * Math.sin(ang0) + y * Math.cos(ang0)]; };
  const vx = cv(), vg = vx.getContext('2d');
  // the whirl's glow: a dim disc of light, brightest at its eye
  vg.save(); vg.globalCompositeOperation = 'lighter'; vg.translate(E[0], E[1]); vg.rotate(ang0); vg.scale(1, RY / RX); blob(vg, 0, 0, RX * 0.9, [[0, Yw(0.4)], [0.12, Y(0.18)], [0.5, Y(0.04)], [1, Y(0)]]); vg.restore();
  const arms = V.arms || 4;
  for (let a = 0; a < arms; a++) { const t0 = a / arms * TAU + R() * 0.4, turns = 1.15 + R() * 0.3, pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, r = Math.pow(1 - u, 1.25) * 1.08, t = t0 + u * turns * TAU; pts.push(onRing(t, Math.max(0.015, r))); }
    vg.save(); vg.globalCompositeOperation = 'lighter'; vg.filter = 'blur(7px)'; stroke(vg, pts, 14, Y(0.16)); vg.filter = 'none'; vg.restore();   // (the whirl's arm as a soft band of light, so the spiral reads under its crackle)
    const J = jag(pts, V.armJag || 18, 3), w = 2.4 + R() * 1.2;
    bolt(vg, J, w, 1); fork(vg, J, w, 1, 2, 50); }
  // the inner whorl: tight bright arcs round the eye
  for (let i = 0; i < 7; i++) { const t0 = R() * TAU, pts = []; for (let k = 0; k <= 8; k++) pts.push(onRing(t0 + k / 8 * 2.2, 0.06 + 0.12 * R() + k * 0.004)); bolt(vg, jag(pts, 20, 2), 1.2, 0.9); }
  vg.save(); vg.globalCompositeOperation = 'lighter'; blob(vg, E[0], E[1], 36, [[0, 'rgba(255,255,245,1)'], [0.3, Yw(0.7)], [1, Y(0)]]); blob(vg, E[0], E[1], 14, [[0, 'rgba(255,255,255,1)'], [1, Yw(0)]]); vg.restore();
  // the cast: a bolt from the follower's crown down into the eye
  { const c0 = [heart[0] + (V.castFrom ? V.castFrom[0] : 0), heart[1] + (V.castFrom ? V.castFrom[1] : -40)]; const J = jag([c0, [(c0[0] + E[0]) / 2 + 30, (c0[1] + E[1]) / 2 - 10], E], 60, 4); bolt(vg, J, 2.2, 0.9); fork(vg, J, 2, 0.8, 2, 50); }
  // sparks pulled in along the whirl
  vg.save(); vg.globalCompositeOperation = 'lighter'; vg.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const r = 0.15 + R() * 1.0, t = R() * TAU, p = onRing(t, r), q = onRing(t - 0.12 - 0.1 * R(), r * 1.08), sg = vg.createLinearGradient(p[0], p[1], q[0], q[1]); sg.addColorStop(0, Yw(1)); sg.addColorStop(1, Y(0)); vg.strokeStyle = sg; vg.lineWidth = 0.8 + R() * 1.6; vg.beginPath(); vg.moveTo(p[0], p[1]); vg.lineTo(q[0], q[1]); vg.stroke(); }
  vg.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(10px)'; g.globalAlpha = 0.3; g.drawImage(vx, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.drawImage(vx, 0, 0); g.restore();
  // the nearest plane: two huge forks right at the lens, across the foot and up the left edge, out of focus, with crisp cores
  { const nr = cv(), ng = nr.getContext('2d');
    (V.lens || [[[-20, H * 0.98], [W * 0.18, H * 0.82], [W * 0.42, H * 0.86], [W * 0.62, H * 0.76]], [[-10, H * 0.25], [W * 0.08, H * 0.42], [W * 0.04, H * 0.58], [W * 0.16, H * 0.7]]]).forEach(path => { const w = path.w || 5, J = jag(path.pts || path, 46, 4); bolt(ng, J, w, 1); fork(ng, J, w * 0.8, 1, 2, 80 + w * 6); });
    g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(3px)'; g.drawImage(nr, 0, 0); g.filter = 'blur(1px)'; g.globalAlpha = 0.6; g.drawImage(nr, 0, 0); g.restore(); }
  // bokeh: a few soft sparks right at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H * 0.6, r = 10 + R() * 22; blob(g, x, y, r, [[0, Y(0.16)], [0.75, Y(0.11)], [1, Y(0)]]); }
  g.restore();
  // 5. THE GRADE: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(g, W * 0.55, H * 0.4, H * 0.75, [[0.5, 'rgba(0,0,0,0)'], [1, 'rgba(6,4,14,0.6)']]); g.fillRect(0, 0, W, H);
  lg = g.createLinearGradient(0, H * 0.7, 0, H); lg.addColorStop(0, 'rgba(6,4,14,0)'); lg.addColorStop(1, 'rgba(6,4,14,' + (V.foot == null ? 0.45 : V.foot) + ')'); g.fillStyle = lg; g.fillRect(0, H * 0.7, W, H * 0.3); g.restore();
  return { png: out.toDataURL('image/png'), info: Object.assign({ eye: E.map(Math.round) }, info) };
}

// ---------- A FLUX MAGE'S PICTURE (the Mage style, as approved on the Ember Hood, carried to the void: followers round 2, 2026-11-17): the flux energy card's world (the void over its
// warped grid) behind, tilted with the horizon; the follower CHARGED with the void (its silhouette glowing violet, a light inside its outline, fine violet filaments crawling off its
// edges and over it); and in the very front of the card, the focus, its MAELSTROM: a swirl of violet light on the floor at the lens round a dark eye, the game's crystals turning in
// it and thrown out all round (3-D, in swirlCv), and the nearest crystals flying past the lens, out of focus (nearCv). Run in the page (its source is put there with toString).
function VOID_MAGE(o) {
  const { W, H, R, cv, model, floorCv, swirlCv, nearCv, pr, hzAt, slope, up, info, P, heart, swirlC } = o, PI = Math.PI, TAU = 2 * PI;
  const out = cv(), g = out.getContext('2d');
  const rad = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (G, x, y, r, stops) => { G.fillStyle = rad(G, x, y, r, stops); G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const V = a => 'rgba(153,51,255,' + a + ')', Vl = a => 'rgba(190,130,255,' + a + ')', Vw = a => 'rgba(241,227,255,' + a + ')';   // (flux's colour, js/config.js ELEMENTS; a lighter violet; its white-hot core)
  const jag = (pts, amp, depth) => { let p = pts; for (let d = 0; d < depth; d++) { const q = [p[0]]; for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], L = Math.hypot(x1 - x0, y1 - y0) || 1, k = (R() - 0.5) * amp * L / 60;
    q.push([(x0 + x1) / 2 - (y1 - y0) / L * k, (y0 + y1) / 2 + (x1 - x0) / L * k], [x1, y1]); } p = q; amp *= 0.62; } return p; };
  const stroke = (G, pts, w, col) => { G.strokeStyle = col; G.lineWidth = w; G.lineJoin = 'round'; G.lineCap = 'round'; G.beginPath(); pts.forEach(([x, y], i) => i ? G.lineTo(x, y) : G.moveTo(x, y)); G.stroke(); };
  const fil = (G, pts, w, a) => { G.save(); G.globalCompositeOperation = 'lighter'; G.filter = 'blur(' + (2 + w * 2) + 'px)'; stroke(G, pts, w * 4, V(0.3 * a)); G.filter = 'blur(1px)'; stroke(G, pts, w * 1.8, Vl(0.7 * a)); G.filter = 'none'; stroke(G, pts, Math.max(0.5, w * 0.6), Vw(a)); G.restore(); };   // (a filament of the void's energy)
  const S = P.swirl;
  // 1. FAR: the flux energy card's world (the void, its nebula and stars over its warped grid: js/energygem.js, with that card's own seed), tilted with the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.fillStyle = '#06030e'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.filter = 'blur(1.5px)'; const k = 1.55; g.drawImage(ws, -225 * k, -630 * 0.62 * k, 450 * k, 630 * k); g.filter = 'none';
  g.globalAlpha = 0.85; g.drawImage(wm, -225 * k, -630 * 0.62 * k, 450 * k, 630 * k); g.restore(); g.globalAlpha = 1;
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -130, 0, 30); lg.addColorStop(0, 'rgba(40,12,80,0)'); lg.addColorStop(0.8, 'rgba(46,14,90,0.8)'); lg.addColorStop(1, '#14062a');
  g.fillStyle = lg; g.fillRect(-W, -130, 2 * W, 160); g.restore();
  // 2. THE FLOOR (3-D), a line of violet light along the horizon (so the tilt reads), a glow round the follower
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[28, 0.12], [9, 0.25], [2.5, 0.6]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, V(0)); lb.addColorStop(0.5, h < 4 ? Vw(a) : V(a)); lb.addColorStop(1, V(0)); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, heart[0], heart[1], 230, [[0, V(0.2)], [0.45, V(0.07)], [1, V(0)]]); g.fillRect(0, 0, W, H); g.restore();
  // 3. THE FOLLOWER, CHARGED: a dark halo (so its near-black body stands off the floor), its silhouette glowing violet (wide and tight), filaments crawling off its edges, its own
  //    render, then lit from within (a violet light inside its outline, strongest at its orb) with fine filaments running over it, and motes thrown off it
  const mask = (src, blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(src, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalAlpha = 0.7; g.drawImage(mask(model, 10, 'rgba(4,1,10,1)'), 0, 4); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(mask(model, 20, '#8a2be2'), 0, 0); g.globalAlpha = 0.75; g.drawImage(mask(model, 5, '#c08cff'), 0, 0); g.restore();
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const edges = []; for (let y = 2; y < H - 2; y += 2) for (let x = 2; x < W - 2; x += 2) { if (A(x, y) > 120 && (A(x - 3, y) < 40 || A(x + 3, y) < 40 || A(x, y - 3) < 40 || A(x, y + 3) < 40)) edges.push([x, y]); }
  const inside = []; for (let y = 2; y < H - 2; y += 4) for (let x = 2; x < W - 2; x += 4) if (A(x, y) > 200) inside.push([x, y]);
  { const hl = cv(), hg = hl.getContext('2d');
    for (let i = 0; i < 26; i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const dx = e[0] - heart[0], dy = e[1] - heart[1], len = 14 + R() * 38, a = Math.atan2(dy, dx) + (R() - 0.5) * 1.0;
      fil(hg, jag([e, [e[0] + Math.cos(a) * len, e[1] + Math.sin(a) * len]], 26, 3), 0.8 + R() * 0.6, 0.85); }
    g.drawImage(hl, 0, 0); }
  g.drawImage(model, 0, 0);
  { const ig = cv(), ic = ig.getContext('2d'); ic.fillStyle = rad(ic, heart[0], heart[1], 150, [[0, 'rgba(220,170,255,0.7)'], [0.35, 'rgba(160,70,255,0.4)'], [1, 'rgba(120,40,220,0.12)']]); ic.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { const a = inside[Math.floor(R() * inside.length)], b = inside[Math.floor(R() * inside.length)]; if (!a || !b || Math.hypot(a[0] - b[0], a[1] - b[1]) < 40) { i -= 0.5; continue; } fil(ic, jag([a, b], 34, 4), 0.7 + R() * 0.5, 0.9); }
    ic.globalCompositeOperation = 'destination-in'; ic.drawImage(model, 0, 0);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.drawImage(ig, 0, 0); g.restore(); }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 8 + R() * 60, x = e[0] + up[0] * d + (R() - 0.5) * 24, y = e[1] + up[1] * d + (R() - 0.5) * 12; blob(g, x, y, 1.2 + R() * 2.2, [[0, Vw(1)], [0.4, Vl(0.8)], [1, V(0)]]); }
  g.restore();
  // 4. NEAR: MAELSTROM at the lens. On the floor round its middle, a swirl of violet light (bands spiralling in to a dark eye, lying on the floor so it tilts with the world), filaments
  //    along its arms; the game's crystals turning in it and thrown out all round (3-D), their glow; a filament from the Voidstar's reaching arm into it (the cast).
  const E = pr(swirlC), on = (t, r) => pr([swirlC[0] + Math.cos(t) * r * S.r * 1.5, 0.02, swirlC[2] + Math.sin(t) * r * S.r * 1.5]);
  const vx = cv(), vg = vx.getContext('2d');
  { const rim = []; for (let i = 0; i <= 48; i++) rim.push(on(i / 48 * TAU, 1)); vg.save(); vg.globalCompositeOperation = 'lighter'; vg.filter = 'blur(18px)'; vg.fillStyle = V(0.22); vg.beginPath(); rim.forEach(([x, y], i) => i ? vg.lineTo(x, y) : vg.moveTo(x, y)); vg.fill(); vg.restore(); }
  for (let a = 0; a < 4; a++) { const t0 = a / 4 * TAU + R() * 0.4, turns = 1.1 + R() * 0.3, pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, r = Math.pow(1 - u, 1.2) * 1.05, t = t0 - u * turns * TAU; pts.push(on(t, Math.max(0.02, r))); }
    vg.save(); vg.globalCompositeOperation = 'lighter'; vg.filter = 'blur(6px)'; stroke(vg, pts, 16, V(0.22)); vg.filter = 'blur(2px)'; stroke(vg, pts, 5, Vl(0.35)); vg.restore();
    fil(vg, jag(pts, 12, 3), 1.6 + R(), 0.9); }
  vg.save(); vg.globalCompositeOperation = 'lighter'; blob(vg, E[0], E[1], 46, [[0, Vw(0.5)], [0.35, Vl(0.45)], [1, V(0)]]); vg.restore();
  vg.save(); vg.fillStyle = rad(vg, E[0], E[1], 14, [[0, 'rgba(6,0,14,0.95)'], [0.7, 'rgba(20,4,40,0.8)'], [1, 'rgba(20,4,40,0)']]); vg.translate(E[0], E[1]); vg.scale(1, 0.55); vg.translate(-E[0], -E[1]); vg.beginPath(); vg.arc(E[0], E[1], 14, 0, TAU); vg.fill(); vg.restore();   // (the void at its eye)
  { const c0 = S.cast ? [S.cast[0] * W, S.cast[1] * H] : [heart[0] - 30, heart[1] + 10]; fil(vg, jag([c0, [(c0[0] + E[0]) / 2, (c0[1] + E[1]) / 2 - 20], E], 50, 4), 1.8, 0.8); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(8px)'; g.globalAlpha = 0.4; g.drawImage(vx, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.drawImage(vx, 0, 0); g.restore();
  // the crystals: their violet glow, then the crystals themselves; streaks of light behind the thrown ones would be motion (left out: the swirl turns, it is not a shot)
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(mask(swirlCv, 10, '#9933ff'), 0, 0); g.restore();
  const deep = (src, col) => { const c = cv(), m = c.getContext('2d'); m.drawImage(src, 0, 0); m.globalCompositeOperation = 'multiply'; m.fillStyle = col; m.fillRect(0, 0, W, H); m.globalCompositeOperation = 'destination-in'; m.drawImage(src, 0, 0); return c; };   // (the crystals' faces deepened toward violet: the key light whitens them)
  g.drawImage(deep(swirlCv, S.tint || '#c090ff'), 0, 0);
  // motes pulled in along the swirl
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < 70; i++) { const r = 0.15 + R() * 1.0, t = R() * TAU, p = on(t, r), q = on(t + 0.14 + 0.1 * R(), r * 1.06), sg = g.createLinearGradient(p[0], p[1], q[0], q[1]); sg.addColorStop(0, Vw(1)); sg.addColorStop(1, V(0)); g.strokeStyle = sg; g.lineWidth = 0.8 + R() * 1.4; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
  g.restore();
  // the nearest plane: big crystals flying past the lens, out of focus, with their glow
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(14px)'; g.globalAlpha = 0.9; g.drawImage(mask(nearCv, 0, '#9933ff'), 0, 0); g.restore();
  g.save(); g.filter = 'blur(' + (S.nearBlur || 4) + 'px)'; g.drawImage(deep(nearCv, S.tint || '#c090ff'), 0, 0); g.restore();
  // the nearest filaments: big ones at the lens curling in from the card's edge to the eye, out of focus, with crisp cores (as the Thunderhead's bolts)
  { const nr = cv(), ng = nr.getContext('2d');
    (S.lens || []).forEach(L => { const J = jag(L.pts.concat([E]), 40, 4); fil(ng, J, L.w, 1); for (let f = 0; f < 2; f++) { const i = 2 + Math.floor(R() * (J.length - 4)), p = J[i], an = R() * TAU, len = 40 + R() * 50; fil(ng, jag([p, [p[0] + Math.cos(an) * len, p[1] + Math.sin(an) * len]], 26, 3), L.w * 0.5, 0.8); } });
    g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(3px)'; g.drawImage(nr, 0, 0); g.filter = 'blur(1px)'; g.globalAlpha = 0.6; g.drawImage(nr, 0, 0); g.restore(); }
  // bokeh: a few soft violet motes right at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H * 0.6, r = 10 + R() * 22; blob(g, x, y, r, [[0, Vl(0.14)], [0.75, V(0.1)], [1, V(0)]]); }
  g.restore();
  // 5. THE GRADE: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(g, W * 0.5, H * 0.42, H * 0.75, [[0.5, 'rgba(0,0,0,0)'], [1, 'rgba(6,2,14,0.6)']]); g.fillRect(0, 0, W, H);
  lg = g.createLinearGradient(0, H * 0.66, 0, H); lg.addColorStop(0, 'rgba(6,2,14,0)'); lg.addColorStop(1, 'rgba(6,2,14,0.55)'); g.fillStyle = lg; g.fillRect(0, H * 0.66, W, H * 0.34); g.restore();
  return { png: out.toDataURL('image/png'), info: Object.assign({ eye: E.map(Math.round) }, info) };
}

// ---------- AN ICE MAGE'S PICTURE (the Mage style, as approved on the Ember Hood, carried to the ice: followers round 3, 2026-11-17): the ice energy card's world (its glacier under the
// aurora) behind, tilted with the horizon; the follower CHARGED with frost (its silhouette glowing ice-blue, a cold light inside its outline strongest at its diamond, branching frost
// creeping off its edges, glints on it); and in the very front of the card, the focus, its ICICLE VOLLEY: the game's own icicles (3-D, in iceCv) flying off its fan at the lens, a trail of
// frost behind each, a burst of frost where they left the fan, and ice dust and shards right at the lens, out of focus. Run in the page (its source is put there with toString).
function ICE_MAGE(o) {
  const { W, H, R, cv, model, floorCv, iceCv, iceNearCv, pr, hzAt, slope, up, info, P, heart, iceTips } = o, PI = Math.PI, TAU = 2 * PI;
  const out = cv(), g = out.getContext('2d');
  const rad = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (G, x, y, r, stops) => { G.fillStyle = rad(G, x, y, r, stops); G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const I = a => 'rgba(127,214,255,' + a + ')', Il = a => 'rgba(190,236,255,' + a + ')', Iw = a => 'rgba(240,250,255,' + a + ')';   // (ice's colour, js/config.js ELEMENTS; a paler blue; its white)
  const stroke = (G, pts, w, col) => { G.strokeStyle = col; G.lineWidth = w; G.lineJoin = 'round'; G.lineCap = 'round'; G.beginPath(); pts.forEach(([x, y], i) => i ? G.lineTo(x, y) : G.moveTo(x, y)); G.stroke(); };
  const mask = (src, blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(src, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  // frost: a crystal's branching growth from a point along a way, side branches at 60 degrees, finer as it goes (drawn as light)
  const frost = (G, x, y, a, L, w, al, depth) => { const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    G.save(); G.globalCompositeOperation = 'lighter'; G.filter = 'blur(' + (1 + w) + 'px)'; stroke(G, [[x, y], [ex, ey]], w * 3, I(0.35 * al)); G.filter = 'none'; stroke(G, [[x, y], [ex, ey]], Math.max(0.5, w * 0.7), Iw(0.9 * al)); G.restore();
    if (depth > 0) { const n = 2 + Math.floor(R() * 2); for (let k = 1; k <= n; k++) { const t = k / (n + 1) + (R() - 0.5) * 0.1, bx = x + (ex - x) * t, by = y + (ey - y) * t, s = R() < 0.5 ? -1 : 1;
      frost(G, bx, by, a + s * PI / 3, L * (0.45 - 0.25 * t) * (0.7 + R() * 0.5), w * 0.65, al * 0.9, depth - 1); } } };
  const glint = (G, x, y, r, al) => { G.save(); G.globalCompositeOperation = 'lighter'; blob(G, x, y, r * 0.6, [[0, Iw(al)], [0.4, Il(0.4 * al)], [1, I(0)]]);
    for (const [dx, dy, k] of [[1, 0, 1], [0, 1, 1], [0.7, 0.7, 0.45], [0.7, -0.7, 0.45]]) { const gr = G.createLinearGradient(x - dx * r * k, y - dy * r * k, x + dx * r * k, y + dy * r * k); gr.addColorStop(0, Iw(0)); gr.addColorStop(0.5, Iw(al)); gr.addColorStop(1, Iw(0));
      G.strokeStyle = gr; G.lineWidth = 1.1; G.beginPath(); G.moveTo(x - dx * r * k, y - dy * r * k); G.lineTo(x + dx * r * k, y + dy * r * k); G.stroke(); } G.restore(); };
  const V = P.volley;
  // 1. FAR: the ice energy card's world (its glacier under the aurora: js/energygem.js, with that card's own seed), tilted with the horizon, softened, a little dimmed so the white follower reads
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.fillStyle = '#020818'; g.fillRect(0, 0, W, H);
  { const hz = hzAt(W / 2), top = -(hz + 60), hh = hz + 110, kx = 1.7;
    g.save(); g.translate(W / 2, hz); g.rotate(slope); g.filter = 'blur(2px)'; g.drawImage(ws, -225 * kx, top, 450 * kx, hh); g.filter = 'none';
    g.globalAlpha = 0.6; g.drawImage(wm, -225 * kx, top, 450 * kx, hh); g.restore(); g.globalAlpha = 1; }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -120, 0, 30); lg.addColorStop(0, 'rgba(12,42,74,0)'); lg.addColorStop(0.8, 'rgba(20,60,100,0.85)'); lg.addColorStop(1, '#0c2a4a');
  g.fillStyle = lg; g.fillRect(-W, -120, 2 * W, 150); g.restore();
  if (V.dim) { g.fillStyle = 'rgba(1,4,14,' + V.dim + ')'; g.fillRect(0, 0, W, H); }
  // 2. THE FLOOR (3-D, darkened under the volley so the ice is the light), a cold line of light along the horizon (so the tilt reads), a glow round the follower
  { const fl = cv(), fc = fl.getContext('2d'); fc.drawImage(floorCv, 0, 0); fc.globalCompositeOperation = 'source-atop'; fc.fillStyle = 'rgba(2,8,22,' + (V.floorDim || 0) + ')'; fc.fillRect(0, 0, W, H); g.drawImage(fl, 0, 0); }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[28, 0.1], [9, 0.22], [2.5, 0.55]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, I(0)); lb.addColorStop(0.5, h < 4 ? Iw(a) : I(a)); lb.addColorStop(1, I(0)); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, heart[0], heart[1], 230, [[0, I(V.heartGlow == null ? 0.2 : V.heartGlow)], [0.45, I(0.07)], [1, I(0)]]); g.fillRect(0, 0, W, H); g.restore();
  // 3. THE FOLLOWER, CHARGED: a dark halo (its white fins stand off the snow), its silhouette glowing ice-blue (wide and tight), frost creeping off its edges, its own render, then a cold light
  //    inside its outline (strongest at its diamond), fine frost over it, glints at its tips, motes of frost rising off it
  g.save(); g.globalAlpha = 0.75; g.drawImage(mask(model, 12, 'rgba(0,4,14,1)'), 0, 5); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = V.glow ? V.glow[0] : 0.85; g.drawImage(mask(model, 20, '#3aa8ff'), 0, 0); g.globalAlpha = V.glow ? V.glow[1] : 0.7; g.drawImage(mask(model, 5, '#bfeaff'), 0, 0); g.restore();
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const edges = []; for (let y = 2; y < H - 2; y += 2) for (let x = 2; x < W - 2; x += 2) { if (A(x, y) > 120 && (A(x - 3, y) < 40 || A(x + 3, y) < 40 || A(x, y - 3) < 40 || A(x, y + 3) < 40)) edges.push([x, y]); }
  const inside = []; for (let y = 2; y < H - 2; y += 4) for (let x = 2; x < W - 2; x += 4) if (A(x, y) > 200) inside.push([x, y]);
  { const hl = cv(), hg = hl.getContext('2d');
    for (let i = 0; i < (V.edgeFrost || 18); i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const a = Math.atan2(e[1] - heart[1], e[0] - heart[0]) + (R() - 0.5) * 0.8; frost(hg, e[0], e[1], a, 14 + R() * 26, 1.3, 0.85, 2); }
    g.drawImage(hl, 0, 0); }
  g.drawImage(model, 0, 0);
  { const ig = cv(), ic = ig.getContext('2d'); ic.fillStyle = rad(ic, heart[0], heart[1], 150, [[0, 'rgba(225,245,255,0.7)'], [0.35, 'rgba(120,200,255,0.35)'], [1, 'rgba(80,160,255,0.08)']]); ic.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) { const p = inside[Math.floor(R() * inside.length)]; if (!p) continue; frost(ic, p[0], p[1], R() * TAU, 10 + R() * 18, 0.9, 0.8, 1); }
    ic.globalCompositeOperation = 'destination-in'; ic.drawImage(model, 0, 0);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = V.inner == null ? 0.5 : V.inner; g.drawImage(ig, 0, 0); g.restore(); }
  for (let i = 0; i < 10; i++) { const e = edges[Math.floor(R() * edges.length)]; if (e) glint(g, e[0], e[1], 7 + R() * 9, 0.85); }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 8 + R() * 60, x = e[0] + up[0] * d + (R() - 0.5) * 24, y = e[1] + up[1] * d + (R() - 0.5) * 12; blob(g, x, y, 1.2 + R() * 2.2, [[0, Iw(1)], [0.4, Il(0.8)], [1, I(0)]]); }
  g.restore();
  // 4. NEAR: ICICLE VOLLEY at the lens. A burst of frost where they left the fan; a trail of frost and powder behind each icicle, back toward the fan; the icicles' cold glow; the icicles
  //    themselves (the game's own, 3-D); ice dust and splinters around them; the nearest out of focus.
  const F0 = V.release ? pr(V.release) : heart;
  g.save(); g.globalCompositeOperation = 'lighter'; const BU = V.burst == null ? 1 : V.burst; blob(g, F0[0], F0[1], 90, [[0, Iw(0.5 * BU)], [0.3, Il(0.25 * BU)], [1, I(0)]]);
  for (let i = 0; i < 20; i++) { const a = R() * TAU, d = 10 + R() * 60; blob(g, F0[0] + Math.cos(a) * d, F0[1] + Math.sin(a) * d * 0.8, 14 + R() * 26, [[0, Iw(0.12)], [1, Il(0)]]); }
  g.restore();
  iceTips.forEach(([tip, tail, k]) => {   // (the trail: from the icicle's tail back along its way toward the fan, a widening band of frost, streaks in it, flakes shed)
    const dx = tail[0] - tip[0], dy = tail[1] - tip[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, len = Math.min(V.trail || 260, Math.hypot(F0[0] - tail[0], F0[1] - tail[1]) * 1.1), nx = -uy, ny = ux, wd = (V.trailW || 18) * k;
    const tr = cv(), tg = tr.getContext('2d'), e = [tail[0] + ux * len, tail[1] + uy * len];
    tg.globalCompositeOperation = 'lighter';
    const band = tg.createLinearGradient(tail[0], tail[1], e[0], e[1]); band.addColorStop(0, Iw(0.55)); band.addColorStop(0.25, Il(0.3)); band.addColorStop(1, I(0)); tg.fillStyle = band;
    tg.beginPath(); tg.moveTo(tail[0] + nx * wd * 0.35, tail[1] + ny * wd * 0.35); tg.lineTo(e[0] + nx * wd, e[1] + ny * wd); tg.lineTo(e[0] - nx * wd, e[1] - ny * wd); tg.lineTo(tail[0] - nx * wd * 0.35, tail[1] - ny * wd * 0.35); tg.closePath(); tg.fill();
    for (let s = 0; s < 7; s++) { const o2 = (R() - 0.5) * wd * 1.2, l2 = len * (0.3 + R() * 0.7), gr = tg.createLinearGradient(tail[0], tail[1], tail[0] + ux * l2, tail[1] + uy * l2); gr.addColorStop(0, Iw(0.7)); gr.addColorStop(1, Iw(0)); tg.strokeStyle = gr; tg.lineWidth = 0.8 + R() * 1.4 * k;
      tg.beginPath(); tg.moveTo(tail[0] + nx * o2 * 0.3, tail[1] + ny * o2 * 0.3); tg.lineTo(tail[0] + ux * l2 + nx * o2, tail[1] + uy * l2 + ny * o2); tg.stroke(); }
    for (let s = 0; s < 22; s++) { const t = Math.pow(R(), 0.7), x = tail[0] + ux * len * t + nx * (R() - 0.5) * wd * 2 * t, y = tail[1] + uy * len * t + ny * (R() - 0.5) * wd * 2 * t; blob(tg, x, y, (1 + R() * 2.5) * k, [[0, Iw(0.9)], [0.4, Il(0.5)], [1, I(0)]]); }
    g.save(); g.filter = 'blur(' + (1.5 + 2 * k) + 'px)'; g.drawImage(tr, 0, 0); g.filter = 'blur(0.5px)'; g.globalAlpha = 0.6; g.drawImage(tr, 0, 0); g.restore(); });
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(mask(iceCv, 12, '#5ab8ff'), 0, 0); g.globalAlpha = 0.5; g.drawImage(mask(iceCv, 3, '#e8f8ff'), 0, 0); g.restore();
  g.drawImage(iceCv, 0, 0);
  iceTips.forEach(([tip, tail, k]) => glint(g, tip[0], tip[1], 12 + 10 * k, 0.95));   // (a glint at each icicle's point)
  // ice dust and splinters thrown with them
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const q = iceTips[Math.floor(R() * iceTips.length)]; if (!q) continue; const [tip, tail, k] = q, a = Math.atan2(tip[1] - tail[1], tip[0] - tail[0]) + (R() - 0.5) * 1.2, d = R() * 120 * k, x = (tip[0] + tail[0]) / 2 + Math.cos(a) * d + (R() - 0.5) * 30, y = (tip[1] + tail[1]) / 2 + Math.sin(a) * d + (R() - 0.5) * 30, L = 3 + R() * 10 * k;
    const sg = g.createLinearGradient(x, y, x - Math.cos(a) * L, y - Math.sin(a) * L); sg.addColorStop(0, Iw(0.95)); sg.addColorStop(1, I(0)); g.strokeStyle = sg; g.lineWidth = 0.8 + R() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a) * L, y - Math.sin(a) * L); g.stroke(); }
  g.restore();
  // the nearest plane: icicles and shards of ice right at the lens, out of focus, with their glow
  if (iceNearCv) { g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(14px)'; g.globalAlpha = 0.8; g.drawImage(mask(iceNearCv, 0, '#5ab8ff'), 0, 0); g.restore();
    g.save(); g.filter = 'blur(' + (V.nearBlur || 4) + 'px)'; g.drawImage(iceNearCv, 0, 0); g.restore(); }
  // bokeh: soft flakes of frost right at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const x = R() * W, y = R() * H * 0.62, r = 8 + R() * 22; blob(g, x, y, r, [[0, Il(0.16)], [0.75, I(0.1)], [1, I(0)]]); }
  g.restore();
  // 5. THE GRADE: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(g, W * 0.5, H * 0.42, H * 0.75, [[0.5, 'rgba(0,0,0,0)'], [1, 'rgba(1,6,16,0.6)']]); g.fillRect(0, 0, W, H);
  lg = g.createLinearGradient(0, H * 0.66, 0, H); lg.addColorStop(0, 'rgba(1,6,16,0)'); lg.addColorStop(1, 'rgba(1,6,16,0.55)'); g.fillStyle = lg; g.fillRect(0, H * 0.66, W, H * 0.34); g.restore();
  return { png: out.toDataURL('image/png'), info: Object.assign({ release: F0.map(Math.round) }, info) };
}

// ---------- EMBER SLASH'S FIRE on a Brawler card (followers round 1, the Quillstone): the dash's streak of fire behind it (docs/COMBAT.md: "A streak of fire follows it"), coming
// from far back down the line it ran, hidden where its body is; its quills burning, flames streaming back off its top edges; and the strike's burst of flame and embers at the lens.
// Called by BRAWLER after the follower is drawn, before the glass breaks (the fire is in the picture the glass breaks over).
function FLAME_DASH(o) {
  const { g, W, H, R, cv, model, HIT, up, P, PI, TAU } = o, F = P.flame;
  const FIRE = [[0, 'rgba(255,240,190,1)'], [0.25, 'rgba(255,170,50,0.95)'], [0.6, 'rgba(255,70,10,0.7)'], [1, 'rgba(200,20,0,0)']];
  const tongue = (G, x, y, len, wid, ang, bend, alpha) => { G.save(); G.translate(x, y); G.rotate(ang); G.globalAlpha = alpha;
    const gr = G.createLinearGradient(0, 0, 0, -len); FIRE.forEach(([q, c]) => gr.addColorStop(q, c)); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-wid, 0); G.bezierCurveTo(-wid * 1.1, -len * 0.35, bend * 0.5 - wid * 0.4, -len * 0.7, bend, -len);
    G.bezierCurveTo(bend * 0.5 + wid * 0.4, -len * 0.7, wid * 1.1, -len * 0.35, wid, 0); G.quadraticCurveTo(0, wid * 0.8, -wid, 0); G.fill(); G.restore(); };
  const blob = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); G.fillStyle = gr; G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  // 1. the streak: from the vanishing point behind it (F.from, on the picture) out past its sides, widening toward the lens, its flames streaming back along it
  const tr = cv(), tg = tr.getContext('2d'); tg.globalCompositeOperation = 'lighter';
  const V0 = [F.from[0] * W, F.from[1] * H], C = [F.to[0] * W, F.to[1] * H];
  for (let k = 0; k < (F.n || 160); k++) { const t = Math.pow(R(), 0.8), x = V0[0] + (C[0] - V0[0]) * t, y = V0[1] + (C[1] - V0[1]) * t, half = 6 + t * F.width * W, s = (R() - 0.5) * 2 * half, ang = Math.atan2(V0[1] - C[1], V0[0] - C[0]) + PI / 2;
    tongue(tg, x + Math.cos(ang - PI / 2) * 0 + (R() - 0.5) * half * 0.3 + s * Math.cos(ang), y + s * Math.sin(ang) * 0.35, (30 + R() * 90) * (0.4 + t), (5 + R() * 12) * (0.5 + t), ang + (R() - 0.5) * 0.4, (R() - 0.5) * 20, 0.12 + R() * 0.2); }
  { const id = tg.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < W * H; i++) { const a = md[i * 4 + 3]; if (a) d[i * 4 + 3] = d[i * 4 + 3] * (1 - a / 255); } tg.putImageData(id, 0, 0); }   // (hidden where its body is: the streak is behind it)
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(8px)'; g.globalAlpha = 0.7; g.drawImage(tr, 0, 0); g.filter = 'blur(1px)'; g.globalAlpha = 1; g.drawImage(tr, 0, 0); g.restore();
  // 2. its quills burning: flames rooted on the top of its silhouette, streaming back (up the picture: it is rushing at the lens)
  const edges = []; for (let x = 2; x < W - 2; x += 3) { for (let y = 0; y < H; y++) if (A(x, y) > 128) { edges.push([x, y]); break; } }
  const upAng = Math.atan2(up[0], -up[1]);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < (F.quillFlames || 60); k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; tongue(g, e[0], e[1] + 5, 14 + R() * 34, 3 + R() * 5, upAng + (R() - 0.5) * 0.5, (R() - 0.5) * 14, 0.35 + R() * 0.4); }
  for (let k = 0; k < 40; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 10 + R() * 80; blob(g, e[0] + (R() - 0.5) * 30, e[1] - d, 1.5 + R() * 2.5, [[0, 'rgba(255,230,160,1)'], [0.4, 'rgba(255,120,30,0.8)'], [1, 'rgba(255,60,10,0)']]); }
  g.restore();
  // 3. the strike: a flash of flame where its nose hits, embers and sparks thrown out at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  blob(g, HIT[0], HIT[1], 120, [[0, 'rgba(255,230,170,0.55)'], [0.3, 'rgba(255,120,30,0.3)'], [1, 'rgba(255,60,10,0)']]);
  for (let k = 0; k < 24; k++) { const a = R() * TAU; tongue(g, HIT[0] + Math.cos(a) * 10, HIT[1] + Math.sin(a) * 10, 30 + R() * 60, 6 + R() * 10, a + PI / 2, (R() - 0.5) * 20, 0.18 + R() * 0.2); }
  g.lineCap = 'round';
  for (let k = 0; k < 70; k++) { const a = R() * TAU, d = 30 + Math.pow(R(), 0.7) * 230, L = 6 + R() * 26, x = HIT[0] + Math.cos(a) * d, y = HIT[1] + Math.sin(a) * d; if (y > H * 0.72) continue;
    const sg = g.createLinearGradient(x, y, x - Math.cos(a) * L, y - Math.sin(a) * L); sg.addColorStop(0, 'rgba(255,248,215,1)'); sg.addColorStop(0.3, 'rgba(255,170,50,0.85)'); sg.addColorStop(1, 'rgba(255,60,10,0)'); g.strokeStyle = sg; g.lineWidth = 0.8 + R() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a) * L, y - Math.sin(a) * L); g.stroke(); }
  g.restore();
}

// ---------- TOXIC STOMP'S GOO on a Brawler card (followers round 2, the Seeper; docs/COMBAT.md: the stomp "with goo thrown out of its caldera"): glossy drops of toxic goo flung up out
// of its caldera and arcing over, a splash of it bursting where its foot lands (at the lens), a green glow there. Called by BRAWLER before the glass breaks (in the picture it breaks over).
function GOO_SPLASH(o) {
  const { g, W, H, R, HIT, up, P, PI, TAU } = o, Q = P.goo;
  const drop = (x, y, r, ang, stretch, a) => { g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = a;   // (a drop: a teardrop along its flight, dark green at its tail, bright at its head, a white glint)
    const gr = g.createLinearGradient(-r * stretch, 0, r, 0); gr.addColorStop(0, 'rgba(20,90,20,0)'); gr.addColorStop(0.5, 'rgba(60,200,50,0.9)'); gr.addColorStop(0.85, '#8dff70'); gr.addColorStop(1, '#d8ffc8'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-r * stretch, 0); g.quadraticCurveTo(-r * 0.2, -r, r * 0.4, -r * 0.95); g.arc(r * 0.4, 0, r * 0.95, -PI / 2, PI / 2); g.quadraticCurveTo(-r * 0.2, r, -r * stretch, 0); g.fill();
    g.fillStyle = 'rgba(240,255,235,0.9)'; g.beginPath(); g.arc(r * 0.6, -r * 0.35, r * 0.22, 0, TAU); g.fill(); g.restore(); };
  const blob = (x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const md = o.model.getContext('2d').getImageData(0, 0, W, H).data, onIt = (x, y) => x >= 0 && y >= 0 && x < W && y < H && md[((y | 0) * W + (x | 0)) * 4 + 3] > 20;   // (no drop lands on its body: it must read)
  const drop0 = drop; const dropOff = (x, y, ...r) => { if (!onIt(x, y)) drop0(x, y, ...r); };
  const upA = Math.atan2(up[1], up[0]);
  // 1. out of its caldera: drops flung up and over, on arcs falling away to the sides
  const C = [Q.from[0] * W, Q.from[1] * H];
  g.save(); g.globalCompositeOperation = 'lighter'; blob(C[0], C[1], 50, [[0, 'rgba(140,255,120,0.35)'], [1, 'rgba(60,200,50,0)']]); g.restore();
  for (let i = 0; i < Q.n; i++) { const a = upA + (R() - 0.5) * 2.2, sp = 30 + R() * 150, x = C[0] + Math.cos(a) * sp, y = C[1] + Math.sin(a) * sp * 0.7 + sp * sp * 0.002; if (y < 4) continue; dropOff(x, y, 2 + R() * 4.5, a + PI + (R() - 0.5) * 0.4, 2 + R() * 2.5, 0.9); }
  // 2. where the foot lands: a burst of green light, a crown of goo splashing out all round, drops flung at the lens
  g.save(); g.globalCompositeOperation = 'lighter'; blob(HIT[0], HIT[1], Q.flash || 130, [[0, 'rgba(200,255,180,0.45)'], [0.3, 'rgba(102,255,102,0.25)'], [1, 'rgba(60,200,50,0)']]); g.restore();
  for (let i = 0; i < Q.splash; i++) { const a = R() * TAU, d = 20 + Math.pow(R(), 0.8) * 150, x = HIT[0] + Math.cos(a) * d, y = HIT[1] + Math.sin(a) * d * 0.8; if (y > H * 0.7) continue; dropOff(x, y, 3 + R() * 6 * (d / 150 + 0.4), a, 2.5 + R() * 3, 0.95); }
}

// ---------- ZIGZAG DASH'S LIGHTNING on a Brawler card (followers round 3, the Electro Skink; docs/COMBAT.md: "it darts through the nearest enemy ... a hop of 2.5 tiles at a time, 3 at most"): the dash's
// way behind it as a zigzag of lightning along the floor (its hops, from far back to it: P.zig.path, world points), hidden where its body is; arcs crawling off its edges; and the strike's
// flash at the lens, short bolts and sparks thrown out from it. Called by BRAWLER after the follower is drawn, before the glass breaks (in the picture the glass breaks over).
function ZIG_DASH(o) {
  const { g, W, H, R, cv, model, HIT, P, PI, TAU, pr } = o, Z = P.zig;
  const Y = a => 'rgba(255,238,51,' + a + ')', Yw = a => 'rgba(255,250,200,' + a + ')';   // (electric's colour, js/config.js ELEMENTS, and its white-hot core)
  const jag = (pts, amp, depth) => { let p = pts; for (let d = 0; d < depth; d++) { const q = [p[0]]; for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], L = Math.hypot(x1 - x0, y1 - y0) || 1, k = (R() - 0.5) * amp * L / 60;
    q.push([(x0 + x1) / 2 - (y1 - y0) / L * k, (y0 + y1) / 2 + (x1 - x0) / L * k], [x1, y1]); } p = q; amp *= 0.62; } return p; };
  const stroke = (G, pts, w, col) => { G.strokeStyle = col; G.lineWidth = w; G.lineJoin = 'round'; G.lineCap = 'round'; G.beginPath(); pts.forEach(([x, y], i) => i ? G.lineTo(x, y) : G.moveTo(x, y)); G.stroke(); };
  const bolt = (G, pts, w, a) => { G.save(); G.globalCompositeOperation = 'lighter'; G.filter = 'blur(' + (3 + w * 2.5) + 'px)'; stroke(G, pts, w * 5, Y(0.22 * a)); G.filter = 'blur(' + (1 + w * 0.6) + 'px)'; stroke(G, pts, w * 2, Y(0.7 * a)); G.filter = 'none'; stroke(G, pts, Math.max(0.6, w * 0.7), Yw(a)); G.restore(); };
  const blob = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); G.fillStyle = gr; G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  // 1. the way it dashed: its hops as straight runs with sharp turns (a zigzag), a wide band of light along the floor under a bolt, two thinner bolts beside it, hidden where its body is
  const way = Z.path.map(pr), tr = cv(), tg = tr.getContext('2d');
  { const band = []; way.forEach(p => band.push(p)); tg.save(); tg.globalCompositeOperation = 'lighter'; tg.filter = 'blur(10px)';
    for (let i = 1; i < band.length; i++) { const t = i / (band.length - 1); stroke(tg, [band[i - 1], band[i]], (Z.band || 30) * (0.35 + 0.65 * t), Y(0.18 + 0.2 * t)); } tg.restore(); }
  for (let i = 1; i < way.length; i++) { const t = i / (way.length - 1), w = (Z.w || 3) * (0.4 + 0.6 * t); bolt(tg, jag([way[i - 1], way[i]], 30, 4), w, 0.7 + 0.3 * t);
    for (let k = 0; k < 2; k++) { const off = (k ? 1 : -1) * (6 + 10 * t); bolt(tg, jag([[way[i - 1][0], way[i - 1][1] + off], [way[i][0], way[i][1] + off]], 40, 4), w * 0.4, 0.5); } }
  { const id = tg.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < W * H; i++) { const a = md[i * 4 + 3]; if (a) d[i * 4 + 3] = d[i * 4 + 3] * (1 - a / 255); } tg.putImageData(id, 0, 0); }   // (behind it)
  g.drawImage(tr, 0, 0);
  // 2. arcs crawling off its edges, out from its middle
  const edges = []; for (let y = 2; y < H - 2; y += 2) for (let x = 2; x < W - 2; x += 2) { if (A(x, y) > 120 && (A(x - 3, y) < 40 || A(x + 3, y) < 40 || A(x, y - 3) < 40 || A(x, y + 3) < 40)) edges.push([x, y]); }
  const mid = edges.reduce((a, p) => [a[0] + p[0] / edges.length, a[1] + p[1] / edges.length], [0, 0]);
  for (let i = 0; i < (Z.edgeArcs || 16); i++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const a = Math.atan2(e[1] - mid[1], e[0] - mid[0]) + (R() - 0.5) * 0.9, len = 14 + R() * 36; bolt(g, jag([e, [e[0] + Math.cos(a) * len, e[1] + Math.sin(a) * len]], 30, 3), 0.8 + R() * 0.6, 0.8); }
  // 3. the strike: a flash where its snout hits, short forked bolts thrown out from it, sparks at the lens
  g.save(); g.globalCompositeOperation = 'lighter'; blob(g, HIT[0], HIT[1], Z.flash || 120, [[0, Yw(0.6)], [0.3, Y(0.3)], [1, Y(0)]]); g.restore();
  for (let k = 0; k < (Z.forks || 7); k++) { const a = R() * TAU, L = 50 + R() * 90, e = [HIT[0] + Math.cos(a) * L, HIT[1] + Math.sin(a) * L * 0.85]; if (e[1] > H * 0.68) continue; bolt(g, jag([HIT, e], 40, 4), 1.2 + R() * 1.2, 0.85); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let k = 0; k < 60; k++) { const a = R() * TAU, d = 30 + Math.pow(R(), 0.7) * 220, L = 6 + R() * 22, x = HIT[0] + Math.cos(a) * d, y = HIT[1] + Math.sin(a) * d; if (y > H * 0.7) continue;
    const sg = g.createLinearGradient(x, y, x - Math.cos(a) * L, y - Math.sin(a) * L); sg.addColorStop(0, Yw(1)); sg.addColorStop(0.3, Y(0.85)); sg.addColorStop(1, Y(0)); g.strokeStyle = sg; g.lineWidth = 0.8 + R() * 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a) * L, y - Math.sin(a) * L); g.stroke(); }
  g.restore();
}

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
${worldSrc}
${BRAWLER.toString()}
${SHATTER_SLABS.toString()}
${TECH.toString()}
${STORM_MAGE.toString()}
${FLAME_DASH.toString()}
${GOO_SPLASH.toString()}
${VOID_MAGE.toString()}
${ICE_MAGE.toString()}
${ZIG_DASH.toString()}
window.__card = async function (P, W, H, modelOnly) {
  ${formsSrc}
  {   // (a block of its own: the forms' code above declares names of its own, mask among them)
  const SS = 2;   // rendered at twice the size and drawn down, for clean edges
  let seed = P.seed || 1; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   // (a fixed seed: the same picture on every bake)
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; };
  // ---------- THE 3-D SCENE: the follower's own model and the floor it hovers over, under a perspective camera ----------
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  // the forms' baker's environment (design/evolutions/bake.js: "the shop's lights", for reflections), with the lava's warm light under it
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const ICE = P.world === 'ice';   // (the ice world: cold light everywhere; the fire world's lava below is the Mage sample's)
  const CORE = P.world === 'core';   // (the core world: the reactor's teal light)
  const STORM = P.world === 'electric', GARDEN = P.world === 'blossom';   // (followers round 1: the storm's yellow light; the garden's pink)
  const VOID = P.world === 'flux', SWAMP = P.world === 'toxic';   // (followers round 2: the void's violet; the swamp's green)
  soft(14, 6, 0, -6, 3, SWAMP ? 0x1a5a10 : VOID ? 0x2a0a5a : STORM ? 0x4a4010 : GARDEN ? 0x5a1a3a : CORE ? 0x0a5a4a : ICE ? 0x1a4a70 : 0x8a2a08, 0, PI / 2);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  EL = { color: P.color }; setElementColour(P.color); M.crystal.color.multiplyScalar(0.5); M.crystal.emissive.multiplyScalar(0.8);   // (as the forms' baker sets a numbered form's crystal)
  const scene = new T.Scene(); scene.environment = env;
  const Lt = Object.assign(ICE ? { hemi: [0x8aa8d0, 0x061426, 0.45], key: [0xe8f4ff, 1.1], rim: 2.6, back: 1.4, low: [0x9fe8ff, 6, -0.6, 0.3, 3.0] } : { hemi: [0x8a6a60, 0x1a0602, 0.35], key: [0xffe6d0, 0.8], rim: 2.2, back: 1.2, low: [0xff5a14, 12, -2.4, 0.4, 3.2] }, P.lights || {});
  scene.add(new T.HemisphereLight(Lt.hemi[0], Lt.hemi[1], Lt.hemi[2]));
  const key = new T.DirectionalLight(Lt.key[0], Lt.key[1]); key.position.set(3, 6, 4); scene.add(key);
  const rim = new T.DirectionalLight(new T.Color(P.rim), Lt.rim); rim.position.set(-5, 1.6, -1); scene.add(rim);
  const back = new T.DirectionalLight(new T.Color(P.rim), Lt.back); back.position.set(3, 1, -5); scene.add(back);
  const lava = new T.PointLight(Lt.low[0], Lt.low[1], 10, 2); lava.position.set(Lt.low[2], Lt.low[3], Lt.low[4]); scene.add(lava);   // the fire sample: the eruption in front of it, lighting it from below; the ice sample: the impact's cold flash in front of its mouth
  const B = FORMS2[P.form].build(); scene.add(B.g); B.g.rotation.y = P.yaw;
  // (its glow sprites are kept: the diamond's blaze is the model's own; the game's sheets leave them to the game, design/evolutions/bake.js)
  B.update(P.pose.t, P.pose.act, P.pose.v);
  if (P.pudding || P.fold) {   // THE CARD-ONLY PUDDING BODY AND FOLD (the owner, 2026-11-17, of the Hammer Slug card: "He needs to have a pudding like body, and he needs to fold upwards"; "Only on the card":
    // the game's model is not changed, only this render of it). His body and his head (the wide lobe at its front: his own head, soft like the rest of him, not a hammer) turn to one
    // glossy, soft, plump jelly in his colours (the teal glow of his tiles over his deep blue, the blue of his sole underneath); his hex tiles, sole and keel are smoothed away into it;
    // his back spikes and eye-stalks stay as they are. Then the body FOLDS UP at its middle: everything ahead of the bend point curls up along an arc (the front half lifting, as a
    // slug rears), the back half staying on the floor; the spikes and his head ride the curl, turned with it.
    // (P.fold, round 3: the owner, "Forget about the pudding body": the FOLD alone, on his own look (his tiles, colours and spikes as the game's model has them); only his head is
    // lit matte, as living flesh, never a dark metal slab: "He looks fine other than that one picture where you gave him a iron hammer head")
    const JELLY = !!P.pudding, Q = P.pudding || P.fold, PL = JELLY ? Q.plump * 1.15 : 1, bb = B.g.children[0], tube = bb.children[0];
    const jelly = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, emissive: new T.Color(Q.glow), emissiveIntensity: Q.glowK, reflectivity: 0.6 }); jelly.envMapIntensity = 0.7;
    const tint = (geo, toB) => { const pa = geo.attributes.position, na = geo.attributes.normal, col = new Float32Array(pa.count * 3), top = new T.Color(Q.top), low = new T.Color(Q.low), c = new T.Color(), n = new T.Vector3();
      for (let i = 0; i < pa.count; i++) { n.set(na.getX(i), na.getY(i), na.getZ(i)); if (toB) n.applyMatrix3(toB).normalize(); const k = Math.max(0, Math.min(1, 0.5 + 0.8 * n.y)); c.copy(low).lerp(top, k).convertSRGBToLinear(); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new T.BufferAttribute(col, 3)); };
    const head = bb.children.find(c => c.isGroup && c.children.some(k => k.isMesh && k.geometry.type === 'BufferGeometry'));
    let keel = null;
    if (JELLY) {
    // the soft body: plumper, its skin rippled a little (a set pudding's wobble)
    tube.scale.x *= Q.plump; tube.scale.y *= Q.plump * 1.15; tube.updateMatrix();
    { const geo = tube.geometry; geo.computeVertexNormals(); const pa = geo.attributes.position, na = geo.attributes.normal;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), w = Q.wobble * (Math.sin(z * 9 + x * 4) * 0.6 + Math.sin(z * 4.3 - y * 6 + 1) * 0.4); pa.setXYZ(i, x + na.getX(i) * w, y + na.getY(i) * w, z + na.getZ(i) * w); } }
    // his head: the same jelly, thicker (a soft lobe, not a flat bar)
    if (head) { head.scale.y *= Q.headThick; head.traverse(m => { if (m.isMesh && m.geometry.type === 'BufferGeometry') { m.geometry = m.geometry.clone(); m.geometry.computeVertexNormals(); tint(m.geometry); m.material = jelly; }
      else if (m.isMesh) m.scale.y /= Q.headThick; }); }   // (the round beads at its two ends stay his: glossy black, like eyes, and round)
    bb.children.forEach(c => { if (c.isGroup && c.children.length === 1 && c.children[0].isMesh && c.children[0].geometry.type === 'CylinderGeometry') c.visible = false; });   // (the hex tiles: smoothed away)
    bb.children.forEach(c => { if (c.isMesh && (c.geometry.type === 'CylinderGeometry' || c.geometry.type === 'BoxGeometry')) c.visible = false; });   // (the sole and the keel: inside the jelly now)
    tube.material = jelly;
    } else {
      // his head as living flesh: its own shape, in a deep navy lifted from the near-black of the model's head and matte (no sheen, no reflections), so it lights like a creature's
      // head, not a dark slab of metal; the round beads at its ends stay glossy black (they read as eyes)
      if (head) head.traverse(m => { if (m.isMesh && m.geometry.type === 'BufferGeometry') { const fm = new T.MeshStandardMaterial({ color: new T.Color(Q.headColour), emissive: new T.Color(Q.headGlow || 0), roughness: 0.95, metalness: 0, side: T.DoubleSide }); fm.envMapIntensity = 0; m.material = fm; } });
      // his sole (a flat disc under him) kept under the back half only: the folded-up front's underside is his body's own belly
      const foot = bb.children.find(c => c.isMesh && c.geometry.type === 'CylinderGeometry'); if (foot) { const back = foot.position.z - foot.scale.z, half = (Q.z0 - back) / 2; foot.position.z = back + half; foot.scale.z = half; }
      // his keel (a thin ridge down his back), cut finer along its length so it can bend with him
      keel = bb.children.find(c => c.isMesh && c.geometry.type === 'BoxGeometry'); if (keel) { const pr0 = keel.geometry.parameters; keel.geometry = new T.BoxGeometry(pr0.width, pr0.height, pr0.depth, 1, 1, 40); }
    }
    // THE FOLD: a bend of constant curvature starting at z0 (in the body's own space: +z is his front), turning up to Q.fold radians, then straight on
    const z0 = Q.z0, kc = Q.fold / Q.arc, rho = 1 / kc, sMax = Q.arc;
    const yp = Q.yp || 0;   // (the bend's middle line, about the body's own middle height: rho must be more than any point's distance from it, or the top would fold through itself)
    const bend = (y, z) => { const sA = z - z0; if (sA <= 0) return [y, z, 0]; const d = y - yp, s2 = Math.min(sA, sMax), th = kc * s2, ez = z0 + (rho - d) * Math.sin(th), ey = yp + rho - (rho - d) * Math.cos(th), rest = sA - s2;
      return [ey + Math.sin(th) * rest, ez + Math.cos(th) * rest, th]; };
    // his head set on the front end of his body (in the model it hangs low at the front, at the sole's height: on a body folded up it would end up on the belly side of the fold)
    if (head) { let zm = -9; const pa0 = tube.geometry.attributes.position; tube.updateMatrix(); const v0 = new T.Vector3(); for (let i = 0; i < pa0.count; i++) { v0.set(pa0.getX(i), pa0.getY(i), pa0.getZ(i)).applyMatrix4(tube.matrix); zm = Math.max(zm, v0.z); }
      head.position.set(0, (Q.yp || 0) / PL, zm - (Q.headIn || 0.12)); if (Q.headTurn) head.rotateY(Q.headTurn); }   // (headTurn, round 3: his head turned on his neck toward the camera, so its width shows, not its end)
    for (const msh of [tube].concat(keel ? [keel] : [])) { const tube = msh; tube.updateMatrix(); const geo = tube.geometry, pa = geo.attributes.position, Mt = tube.matrix, Mi = new T.Matrix4().copy(Mt).invert(), v = new T.Vector3();
      for (let i = 0; i < pa.count; i++) { v.set(pa.getX(i), pa.getY(i), pa.getZ(i)).applyMatrix4(Mt); const [y2, z2] = bend(v.y, v.z); v.y = y2; v.z = z2; v.applyMatrix4(Mi); pa.setXYZ(i, v.x, v.y, v.z); }
      pa.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); if (JELLY) tint(geo, new T.Matrix3().getNormalMatrix(Mt)); tube.frustumCulled = false; }
    bb.children.forEach(c => { if (c === tube || c === keel || !c.visible || (c.isLight && JELLY) || (!JELLY && c.isMesh && c.geometry.type === 'CylinderGeometry')) return; c.position.y *= PL; const [y2, z2, th] = bend(c.position.y, c.position.z); c.position.y = y2; c.position.z = z2;   // (sat on the plumper body, then carried by the fold)
      if (c.isLight) return;   // (round 3: his own glow light carried inside the fold with him, as in the model it sits inside his body; round 2 left it where it was)
      c.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -(c === head ? Math.max(0, th - (Q.headTip || 0)) : th))); });   // (his head tipped forward again off the top of the fold, looking out)
  }
  if (P.raise) {   // RAISING ITS FRONT LEGS (followers round 1, the Stonepetal: "while they raise their claws or whatever they have"; it has stake legs, no claws): this render only, the game's
    // model is not changed. Each front leg (the meshes hung straight on the model's scaled group, forward of its middle: its short segment, its knee and its stake) is raised as an
    // arm: the segment turned up about its hip (seg degrees), then the stake turned about its knee (stake degrees), up and out, and tipped forward (fwd degrees), its point held high.
    const Q = P.raise, bb = B.g.children[0], v = new T.Vector3(), PIo = PI / 180;
    const about = (p, M) => new T.Matrix4().makeTranslation(p.x, p.y, p.z).multiply(M).multiply(new T.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
    const meshes = bb.children.filter(m => m.isMesh), mid = m => { if (m.geometry.type === 'SphereGeometry') return m.position.clone(); const pa = m.geometry.attributes.position, c = new T.Vector3(); for (let i = 0; i < pa.count; i++) c.add(v.fromBufferAttribute(pa, i)); return c.divideScalar(pa.count); };
    const move = (m, M) => { if (m.geometry.type === 'SphereGeometry') { m.position.applyMatrix4(M); return; } const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(M); pa.setXYZ(i, v.x, v.y, v.z); }
      pa.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); m.frustumCulled = false; };
    [-1, 1].forEach(s => { const mine = meshes.filter(m => { const c = mid(m); return c.z > (Q.minZ || 0) && Math.sign(c.x) === s; });
      const segM = mine.find(m => m.geometry.type !== 'SphereGeometry' && m.geometry.attributes.position.count <= 60), knee = mine.find(m => m.geometry.type === 'SphereGeometry'), stake = mine.find(m => m !== segM && m !== knee);
      if (!segM || !knee || !stake) return;
      const pa0 = segM.geometry.attributes.position, hip = new T.Vector3(); for (let i = 0; i < 10; i++) hip.add(v.fromBufferAttribute(pa0, i)); hip.divideScalar(10);
      const M1 = about(hip, new T.Matrix4().makeRotationZ(s * Q.seg * PIo)); [segM, knee, stake].forEach(m => move(m, M1));
      const M2 = about(knee.position.clone(), new T.Matrix4().makeRotationX(-Q.fwd * PIo).multiply(new T.Matrix4().makeRotationZ(s * (Q.stake - Q.seg) * PIo))); move(stake, M2); });
    if (Q.lighten) { const lm = new Map(); meshes.forEach(m => { if (!lm.has(m.material)) { const c = m.material.clone(); if (c.emissive) c.emissive.add(new T.Color(Q.lighten)); lm.set(m.material, c); } m.material = lm.get(m.material); }); }   // (round 2: all four legs lifted a touch against the dark plum, a faint glow of their own; their own copy of the material, the body untouched)
  }
  if (P.rear) { B.g.rotation.order = 'YXZ'; B.g.rotation.x = -P.rear; B.g.position.y = P.lift || 0; }   // (a Technician rearing its front up: the whole model tipped back about its middle, its tail sunk into the floor)
  // THE RING OF CRYSTALS (a Technician card, the owner, 2026-11-17: "surrounded by a very intact ring of crystals"): the game's own crystal (hexCrystal: a six-sided prism with
  // pointed ends, the element's colour, its edges white) set all round the follower on the floor, every one whole; tall at the back and sides, short at the front so the follower shows over them.
  const ringG = new T.Group(), ringTips = []; if (P.ring) { const Q = P.ring, cdir = Math.atan2(P.cam.pos[0], P.cam.pos[2]);
    for (let i = 0; i < Q.n; i++) { const a = (i + 0.5) / Q.n * 2 * PI + cdir, f = 0.5 + 0.5 * Math.cos(a - cdir), cr = Q.r * (0.97 + 0.06 * R());   // (f: 1 in front, toward the camera, 0 behind)
      const put = (h, r, da, lean, dr) => { const c = hexCrystal(r, h, r * 1.8); const aa = a + da, x = Math.sin(aa) * (cr + dr), z = Math.cos(aa) * (cr + dr); c.position.set(x, h * 0.42, z);
        c.rotation.order = 'YXZ'; c.rotation.y = aa; c.rotation.x = lean; c.rotation.z = (R() - 0.5) * 0.12; ringG.add(c); ringTips.push([x + Math.sin(aa) * Math.sin(lean) * (h * 0.5 + r * 1.8), h * 0.42 + Math.cos(lean) * (h * 0.5 + r * 1.8), z + Math.cos(aa) * Math.sin(lean) * (h * 0.5 + r * 1.8)]); };
      const h = Q.h[1] - (Q.h[1] - Q.h[0]) * Math.pow(f, 0.7) * (0.85 + 0.3 * R());
      put(h, Q.w * (0.9 + 0.2 * R()), 0, 0.12 + R() * 0.12, 0);   // the main crystal of this place in the ring, leaning a little outward
      put(h * (0.45 + 0.2 * R()), Q.w * 0.6, (R() < 0.5 ? -1 : 1) * 0.09, 0.35 + R() * 0.2, 0.08);   // and a smaller one at its foot, leaning further
    } scene.add(ringG);
    const cm = M.crystal.clone(), em = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }); ringG.traverse(m => { if (m.isLineSegments) m.material = em; else if (m.isMesh) m.material = cm; }); }   // (its own materials, so the follower can be drawn depth-only over it)
  if (P.ring && P.ring.dim) ringG.traverse(m => { if (m.isMesh && !m.material.userData.dimmed) { m.material.userData.dimmed = true; m.material.color.multiplyScalar(P.ring.dim[0]); m.material.emissive.multiplyScalar(P.ring.dim[1]); } });   // (followers round 1: a light element colour, bloom's pink, whites out the crystals; dimmed once, they share one material)
  // MAELSTROM'S SWIRL (followers round 2, the Voidstar; js/elements.js "maelstrom": three spiral arms of crystals turning, crystals thrown out all round on arcs, a dark crystal at its middle):
  // the game's diamond crystals (a four-sided bipyramid, flat-shaded, white edges) in flux's violets, in 3-D, set after the camera (their place is found through it). Built only for P.swirl.
  const swirlG = new T.Group(), nearG = new T.Group(); let swirlC = null;
  const gemOf = (sz, col, emi) => { const geo = new T.OctahedronGeometry(1, 0); geo.scale(sz * 0.55, sz, sz * 0.55); const m = new T.Mesh(geo, new T.MeshPhysicalMaterial({ color: col, emissive: emi, roughness: 0.3, metalness: 0, clearcoat: 0.4, flatShading: true })); m.material.envMapIntensity = 0.5;
    m.add(new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0xf1e3ff, transparent: true, opacity: 0.55 }))); return m; };
  // THE FLOOR: dark lava crust split by glowing cracks, far into the haze (so the tilted horizon is a real one), and the hot glow under the follower
  const ft = cv(1024, 1024), fg = ft.getContext('2d'), fe = cv(1024, 1024), fge = fe.getContext('2d');
  const crack = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  if (CORE) {   // THE CORE FLOOR: dark teal plates in a hex lattice (the reactor's), their seams faintly lit
    fg.fillStyle = '#06201c'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 300; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 40; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '14,52,46' : '2,12,10') + ',' + (0.25 + R() * 0.35) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    const s6 = 64, h6 = s6 * Math.sqrt(3) / 2; for (let row = -1; row * h6 * 2 < 1100; row++) for (let col = -1; col * s6 * 1.5 < 1100; col++) { const x = col * s6 * 1.5, y = row * h6 * 2 + (col % 2 ? h6 : 0), pts = []; for (let k = 0; k <= 6; k++) pts.push([x + Math.cos(k / 6 * 2 * PI) * s6 * 0.97, y + Math.sin(k / 6 * 2 * PI) * s6 * 0.97]);
      crack(fg, pts, 4, '#020a08'); crack(fge, pts, 1.5, 'rgba(25,230,193,' + (0.12 + 0.18 * R()) + ')'); }
  } else if (STORM) {   // THE STORM FLOOR: dark wet slate under the storm clouds, scorched lines where the lightning ran catching a faint yellow light
    fg.fillStyle = '#100e1a'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 420; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 44; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '42,38,64' : '6,5,12') + ',' + (0.25 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    for (let k = 0; k < 26; k++) { let x = R() * 1024, y = R() * 1024, a = R() * 2 * PI; const pts = [[x, y]]; for (let j = 0; j < 10; j++) { a += (R() - 0.5) * 1.9; x += Math.cos(a) * 26; y += Math.sin(a) * 26; pts.push([x, y]); }
      const w = 1 + R() * 2.5; crack(fg, pts, w + 3, '#050409'); crack(fge, pts, w + 6, 'rgba(255,220,40,0.12)'); crack(fge, pts, w, 'rgba(255,230,90,0.45)'); }
  } else if (VOID) {   // THE VOID FLOOR: near-black violet glass, a warped grid faintly lit (the flux energy card's own grid, under the stars)
    fg.fillStyle = '#0c0618'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 360; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 44; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '40,20,72' : '4,2,10') + ',' + (0.25 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    for (let k = 0; k <= 8; k++) { const q = k * 128; crack(fge, [[q, 0], [q + 20, 512], [q, 1024]], 2, 'rgba(180,120,255,0.3)'); crack(fge, [[0, q], [512, q - 20], [1024, q]], 2, 'rgba(180,120,255,0.3)'); }
    for (let k = 0; k < 40; k++) { const x = R() * 1024, y = R() * 1024; fge.fillStyle = 'rgba(220,190,255,' + (0.3 + R() * 0.5) + ')'; fge.beginPath(); fge.arc(x, y, 1 + R() * 2, 0, 2 * PI); fge.fill(); }
  } else if (SWAMP) {   // THE SWAMP FLOOR: black-green mud, pools of toxic ooze glowing green, rings of scum round them (the toxic energy card's swamp)
    fg.fillStyle = '#0a160a'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 420; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 44; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '28,52,24' : '3,8,3') + ',' + (0.25 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    for (let k = 0; k < 26; k++) { const x = R() * 1024, y = R() * 1024, r = 14 + R() * 50, sq = 0.5 + R() * 0.5;
      for (const [G2, c] of [[fg, '#0e3a0c'], [fge, 'rgba(102,255,102,' + (0.14 + R() * 0.16) + ')']]) { G2.fillStyle = c; G2.beginPath(); G2.ellipse(x, y, r, r * sq, R() * PI, 0, 2 * PI); G2.fill(); }
      fge.strokeStyle = 'rgba(160,255,120,0.35)'; fge.lineWidth = 2; fge.beginPath(); fge.ellipse(x, y, r * 1.08, r * sq * 1.08, 0, 0, 2 * PI); fge.stroke(); }
  } else if (GARDEN) {   // THE GARDEN FLOOR: dark plum earth and moss under the garden's light, fallen petals glowing faintly pink
    fg.fillStyle = '#1a0812'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 420; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 44; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '62,22,44' : '10,3,8') + ',' + (0.25 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    for (let k = 0; k < 160; k++) { const x = R() * 1024, y = R() * 1024, s2 = 4 + R() * 7, a = R() * 2 * PI; for (const [G2, c] of [[fg, 'rgba(255,150,200,0.5)'], [fge, 'rgba(255,122,184,' + (0.12 + R() * 0.25) + ')']]) { G2.save(); G2.translate(x, y); G2.rotate(a); G2.fillStyle = c; G2.beginPath(); G2.ellipse(0, 0, s2, s2 * 0.55, 0, 0, 2 * PI); G2.fill(); G2.restore(); } }
  } else if (ICE) {   // THE ICE FLOOR: packed snow and blue ice, frost cracks catching a faint cold light, far into the haze
    fg.fillStyle = '#121f33'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 500; k++) { const x = R() * 1024, y = R() * 1024, r = 8 + R() * 46; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '70,100,140' : '14,30,52') + ',' + (0.25 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    for (let k = 0; k < 30; k++) { let x = R() * 1024, y = R() * 1024, a = R() * 2 * PI; const pts = [[x, y]]; for (let j = 0; j < 8; j++) { a += (R() - 0.5) * 1.6; x += Math.cos(a) * 30; y += Math.sin(a) * 30; pts.push([x, y]); }
      const w = 1 + R() * 3; crack(fg, pts, w + 3, '#0a1626'); crack(fge, pts, w, 'rgba(120,200,255,0.35)'); }
  } else {
  fg.fillStyle = '#1a0805'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 400; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 40; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '40,16,10' : '10,4,3') + ',' + (0.3 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
  for (let k = 0; k < 34; k++) { let x = R() * 1024, y = R() * 1024, a = R() * 2 * PI; const pts = [[x, y]]; for (let j = 0; j < 9; j++) { a += (R() - 0.5) * 1.3; x += Math.cos(a) * 34; y += Math.sin(a) * 34; pts.push([x, y]); }
    const w = 2 + R() * 5; crack(fg, pts, w + 4, '#080202'); crack(fge, pts, w + 10, 'rgba(255,60,10,0.25)'); crack(fge, pts, w, '#ff6a1a'); crack(fge, pts, w * 0.4, '#ffd27a'); }
  }
  const tx = t => { const x = new T.CanvasTexture(t); x.encoding = T.sRGBEncoding; x.wrapS = x.wrapT = T.RepeatWrapping; x.repeat.set(6, 6); x.anisotropy = 8; return x; };
  const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ map: tx(ft), emissiveMap: tx(fe), emissive: new T.Color(0xffffff), emissiveIntensity: 1.3, roughness: (ICE || STORM || VOID || SWAMP) ? 0.55 : 0.85, metalness: 0.1 }));
  floor.rotation.x = -PI / 2; scene.add(floor);
  const pool = cv(256, 256), pg = pool.getContext('2d'); const pgr = pg.createRadialGradient(128, 128, 0, 128, 128, 128); if (ICE) { pgr.addColorStop(0, 'rgba(150,220,255,0.5)'); pgr.addColorStop(0.4, 'rgba(90,170,255,0.2)'); pgr.addColorStop(1, 'rgba(60,140,255,0)'); } else { pgr.addColorStop(0, 'rgba(255,120,40,0.9)'); pgr.addColorStop(0.4, 'rgba(255,60,10,0.4)'); pgr.addColorStop(1, 'rgba(255,40,0,0)'); } pg.fillStyle = pgr; pg.fillRect(0, 0, 256, 256);
  if (STORM || GARDEN || VOID || SWAMP) { pg.clearRect(0, 0, 256, 256); const g2 = pg.createRadialGradient(128, 128, 0, 128, 128, 128); const cc = STORM ? '255,230,80' : VOID ? '170,100,255' : SWAMP ? '102,255,102' : '255,122,184'; g2.addColorStop(0, 'rgba(' + cc + ',0.45)'); g2.addColorStop(0.5, 'rgba(' + cc + ',0.14)'); g2.addColorStop(1, 'rgba(' + cc + ',0)'); pg.fillStyle = g2; pg.fillRect(0, 0, 256, 256); }
  if (CORE) { pg.clearRect(0, 0, 256, 256); const g2 = pg.createRadialGradient(128, 128, 0, 128, 128, 128); g2.addColorStop(0, 'rgba(60,240,205,0.45)'); g2.addColorStop(0.5, 'rgba(25,200,170,0.15)'); g2.addColorStop(1, 'rgba(25,200,170,0)'); pg.fillStyle = g2; pg.fillRect(0, 0, 256, 256); }
  const glowUnder = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(pool), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  glowUnder.rotation.x = -PI / 2; glowUnder.position.y = 0.02; scene.add(glowUnder);
  const HAZE = SWAMP ? '#0a2a0a' : VOID ? '#14062a' : STORM ? '#1a1630' : GARDEN ? '#3a0a26' : CORE ? '#04261f' : ICE ? '#0c2a4a' : '#3c0b05'; scene.fog = new T.Fog(new T.Color(HAZE), 5, 26);
  const cam = new T.PerspectiveCamera(P.cam.fov, W / H, 0.05, 80);
  cam.position.set(...P.cam.pos); cam.lookAt(new T.Vector3(...P.cam.look)); cam.rotateZ(P.cam.roll); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  if (P.swirl) { const Q = P.swirl, COLS = [[0x3a1290, 0x14043a], [0x6a28d8, 0x22085a], [0x9a5cf0, 0x30106e]];   // (the game's three violets, deepened: under the scene's white key light the game's own whiten out)
    const ray = (nx, ny) => new T.Vector3(nx, ny, 0.5).unproject(cam).sub(cam.position).normalize();
    { const d = ray(Q.at[0], Q.at[1]), t = -cam.position.y / d.y; swirlC = cam.position.clone().addScaledVector(d, t); }
    for (let arm = 0; arm < Q.arms; arm++) for (let j = 0; j < Q.per; j++) {   // (the arms turning in it, growing outward)
      const an = arm * 2 * PI / Q.arms + j * 0.62, rd = Q.r * (0.12 + 0.13 * j), C = COLS[(arm + j) % 3], m = gemOf(Q.size * (0.7 + 0.12 * j), C[0], C[1]);
      m.position.set(swirlC.x + Math.cos(an) * rd, 0.12 + 0.05 * j, swirlC.z + Math.sin(an) * rd); m.rotation.set(0.5 + R() * 0.4, -an, an + 1.2); swirlG.add(m); }
    for (let i = 0; i < Q.thrown; i++) {   // (crystals thrown out all round, each on its arc: further out, higher, then falling)
      const an = i * 2.4 + R() * 0.6, u = 0.15 + 0.85 * R(), dist = Q.r * (0.3 + 1.6 * u), h = 0.15 + Math.sin(PI * Math.min(1, u * 1.1)) * 1.1, C = COLS[i % 3], m = gemOf(Q.size * (1.2 - 0.5 * u), C[0], C[1]);
      m.position.set(swirlC.x + Math.cos(an) * dist, h, swirlC.z + Math.sin(an) * dist); m.rotation.set(R() * PI, R() * PI, R() * PI); swirlG.add(m); }
    { const m = gemOf(Q.size * 1.6, 0x2a0f55, 0x12042a); m.position.set(swirlC.x, 0.18, swirlC.z); m.rotation.set(0, 0.4, 0); swirlG.add(m); }   // (its middle: the dark crystal)
    (Q.near || []).forEach(([nx, ny, d, sz, rot], i) => { const C = COLS[(i + 1) % 3], m = gemOf(sz, C[0], C[1]); m.position.copy(cam.position).addScaledVector(ray(nx, ny), d); m.rotation.set(rot, rot * 1.7, rot * 0.6); nearG.add(m); });
    swirlG.visible = nearG.visible = false; scene.add(swirlG); scene.add(nearG); }
  // ICICLE VOLLEY'S ICICLES (followers round 3, the Rimestar): the game's own icicle (design/effects/bake_fx.js 'icicle', approved 2026-11-09: a slender six-sided spike of pale blue ice, long-pointed
  // in front, a short faceted point behind, a little uneven, glossy flat-shaded facets, a cold glow from within), each set where a ray through the picture meets its distance, pointing on along
  // its way from the fan (where they left it) toward the lens. Built only for P.volley.
  const iceG = new T.Group(), iceNearG = new T.Group(), iceAxes = [];
  if (P.volley) { const Q = P.volley; B.g.updateMatrixWorld(true);
    const rel = Q.release ? new T.Vector3(...Q.release) : B.g.localToWorld(new T.Vector3(0, B.core, 0.4)); Q.release = [rel.x, rel.y, rel.z];
    const ray = (nx, ny) => new T.Vector3(nx, ny, 0.5).unproject(cam).sub(cam.position).normalize();
    const ice = new T.MeshStandardMaterial({ color: new T.Color(0x7cc8f2).convertSRGBToLinear(), emissive: new T.Color(0x1f6fc4).multiplyScalar(0.45), roughness: 0.3, metalness: 0.05, flatShading: true }); ice.envMapIntensity = 0.55;
    const icicle = (len, r, back, sd) => { const front = len - back, mk = (h, tip, sd2) => { const geo = new T.ConeGeometry(r, h, 6, 1), q = geo.attributes.position;
        for (let v = 0; v < q.count; v++) { const x = q.getX(v), y = q.getY(v), z = q.getZ(v), n = _hz(Math.round(x * 400) + sd2, Math.round(y * 400), Math.round(z * 400)); q.setXYZ(v, x * (0.8 + 0.4 * n), y, z * (0.8 + 0.4 * (1 - n))); }
        geo.translate(0, h / 2, 0); geo.computeVertexNormals(); const m = new T.Mesh(geo, ice); if (!tip) m.rotation.z = PI; return m; };
      const sp = new T.Group(); sp.add(mk(front, true, sd)); sp.add(mk(back, false, sd + 7)); return { sp, front, back }; };   // (its point along +y, its widest at the origin)
    const place = (grp, list, near) => list.forEach(([nx, ny, d, sc, roll, aim], i) => { const ic = icicle(0.95 * sc, 0.085 * sc, 0.15 * sc, 3 + i * 11 + (near ? 50 : 0)), pos = cam.position.clone().addScaledVector(ray(nx, ny), d);
      let dir = pos.clone().sub(rel).normalize(); if (aim && !Q.screen) dir.lerp(cam.position.clone().sub(pos).normalize(), aim).normalize();   // (along its way from the fan; aim: turned a little more toward the lens)
      if (Q.screen) { const e = cam.matrixWorld.elements, rx = new T.Vector3(e[0], e[1], e[2]), uy = new T.Vector3(e[4], e[5], e[6]), bz = new T.Vector3(e[8], e[9], e[10]), a = Q.screen[0] + (aim || 0);   // (screen: its way set on the picture (an angle, 0 to the right, up positive) and how far it comes at the lens; aim: its own turn in the fan)
        dir = rx.multiplyScalar(Math.cos(a)).add(uy.multiplyScalar(Math.sin(a))).add(bz.multiplyScalar(Q.screen[1])).normalize(); }
      if (Q.flat) { const fw = new T.Vector3(); cam.getWorldDirection(fw); dir.addScaledVector(fw, -dir.dot(fw) * Q.flat).normalize(); }   // (flat: turned more across the picture, so its long point shows, not its end)
      ic.sp.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); ic.sp.rotateY(roll || 0); ic.sp.position.copy(pos); grp.add(ic.sp);
      if (!near) iceAxes.push([pos.clone().addScaledVector(dir, ic.front), pos.clone().addScaledVector(dir, -ic.back), sc]); });
    place(iceG, Q.icicles, false); place(iceNearG, Q.near || [], true);
    iceG.visible = iceNearG.visible = false; scene.add(iceG); scene.add(iceNearG); }
  const grab = () => { renderer.render(scene, cam); const c = cv(); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(renderer.domElement, 0, 0, W, H); return c; };
  B.g.visible = false; ringG.visible = false; const floorCv = grab();
  B.g.visible = true; ringG.visible = true; glowUnder.visible = false;
  if (P.style === 'brawler' || P.style === 'tech') { floor.material.colorWrite = false; floor.renderOrder = -1; } else floor.visible = false;   // (a Brawler sits ON the floor, sunk into it: the floor hides what is under it (its cave's lower half) but is not drawn)
  const model = grab();
  let swirlCv = null, nearCv = null; if (P.swirl) {   // (the swirl where it shows: the follower drawn depth-only, hiding what is behind it; then the nearest crystals alone)
    const cw = []; B.g.traverse(m => { if (m.material) [].concat(m.material).forEach(x => { cw.push([x, x.colorWrite]); x.colorWrite = false; }); });
    swirlG.visible = true; swirlCv = grab(); swirlG.visible = false; B.g.visible = false; nearG.visible = true; nearCv = grab(); nearG.visible = false; B.g.visible = true; cw.forEach(([x, v]) => { x.colorWrite = v; }); }
  let iceCv = null, iceNearCv = null; if (P.volley) { B.g.visible = false; iceG.visible = true; iceCv = grab(); iceG.visible = false; if ((P.volley.near || []).length) { iceNearG.visible = true; iceNearCv = grab(); iceNearG.visible = false; } B.g.visible = true; }   // (the icicles alone: they fly in front of it)
  let ringCv = null, bodyCv = null; if (P.ring) {   // (the ring where it shows (the follower drawn depth-only, hiding what is behind it) and the follower alone, for their glows)
    const cw = []; B.g.traverse(m => { if (m.material) [].concat(m.material).forEach(x => { cw.push([x, x.colorWrite]); x.colorWrite = false; }); });
    ringCv = grab(); cw.forEach(([x, v]) => { x.colorWrite = v; }); ringG.visible = false; bodyCv = grab(); ringG.visible = true; }
  // where things land on the picture: the heart (its diamond), its foot, the horizon (eye-level points far off, projected)
  const pr = v => { const p = new T.Vector3(...v).project(cam); return [(p.x * 0.5 + 0.5) * W, (1 - (p.y * 0.5 + 0.5)) * H]; };
  const heart = pr([0, B.core, 0]), foot = pr([0, 0, 0]);
  const fw = new T.Vector3(); cam.getWorldDirection(fw); fw.y = 0; fw.normalize(); const sideV = new T.Vector3(-fw.z, 0, fw.x), cp = cam.position;
  const far = s => pr([cp.x + (fw.x + sideV.x * s) * 500, cp.y, cp.z + (fw.z + sideV.z * s) * 500]);
  const hA = far(-0.6), hB = far(0.6), slope = Math.atan2(hB[1] - hA[1], hB[0] - hA[0]);
  const hzAt = x => hA[1] + (x - hA[0]) * Math.tan(slope);   // the horizon's height at x
  const up = [Math.sin(slope), -Math.cos(slope)];   // the world's up, on the picture (square to the horizon)
  const info = { heart: heart.map(Math.round), foot: foot.map(Math.round), horizonDeg: +(slope * 180 / PI).toFixed(1), horizonMid: Math.round(hzAt(W / 2)) };
  if (modelOnly) { const c = cv(), g = c.getContext('2d'); g.fillStyle = '#5a5f68'; g.fillRect(0, 0, W, H); g.drawImage(floorCv, 0, 0); g.drawImage(model, 0, 0); return { png: c.toDataURL('image/png'), info }; }
  if (P.style === 'tech') return TECH({ W, H, R, cv, model, ringCv, bodyCv, floorCv, pr, hzAt, slope, up, info, P, B, heart, ringTips: ringTips.map(pr) });
  if (P.style === 'ice') { const k0 = Math.max(...iceAxes.map(q => q[2])); return ICE_MAGE({ W, H, R, cv, model, floorCv, iceCv, iceNearCv, pr, hzAt, slope, up, info, P, B, heart, iceTips: iceAxes.map(([a, b, sc]) => [pr([a.x, a.y, a.z]), pr([b.x, b.y, b.z]), sc / k0]) }); }
  if (P.style === 'void') return VOID_MAGE({ W, H, R, cv, model, floorCv, swirlCv, nearCv, pr, hzAt, slope, up, info, P, B, heart, swirlC: [swirlC.x, swirlC.y, swirlC.z] });
  if (P.style === 'storm') return STORM_MAGE({ W, H, R, cv, model, floorCv, pr, hzAt, slope, up, info, P, B, heart });
  if (P.style === 'brawler') return BRAWLER({ W, H, R, cv, model, floorCv, pr, hzAt, slope, up, info, P, B, mouthAt: P.impact ? pr(P.impact) : heart });

  // ---------- THE PICTURE, back to front ----------
  const out = cv(), g = out.getContext('2d');
  const rad = (x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const blob = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); G.fillStyle = gr; G.beginPath(); G.arc(x, y, r, 0, 2 * PI); G.fill(); };
  // 1. FAR: its element's world (the fire energy card's lava cave: js/energygem.js, painted with that card's own seed), tilted with the horizon, its floor line on the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.filter = 'blur(2.5px)'; const k = 1.55; g.drawImage(ws, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.filter = 'none';
  g.globalAlpha = 0.6; g.drawImage(wm, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.restore(); g.globalAlpha = 1;
  // the haze along the horizon (the floor's fog, into the cave), and the glow of the lava beyond it
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -160, 0, 40); lg.addColorStop(0, 'rgba(60,11,5,0)'); lg.addColorStop(0.75, 'rgba(90,20,6,0.85)'); lg.addColorStop(1, HAZE);
  g.fillStyle = lg; g.fillRect(-W, -160, 2 * W, 200); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(0, 0, W * 0.9, [[0, 'rgba(255,90,20,0.35)'], [1, 'rgba(255,60,10,0)']]); g.scale(1, 0.25); g.fillRect(-W, -W, 2 * W, 2 * W); g.restore();
  // 2. THE FLOOR (3-D), the far lava's glow along the horizon (so the tilt reads), and a heat glow round the follower
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[34, 0.16], [12, 0.3], [3, 0.7]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, 'rgba(255,90,20,0)'); lb.addColorStop(0.5, 'rgba(255,' + (h < 5 ? 190 : 110) + ',' + (h < 5 ? 90 : 30) + ',' + a + ')'); lb.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(heart[0], heart[1], 230, [[0, 'rgba(255,110,30,0.55)'], [0.45, 'rgba(255,60,10,0.22)'], [1, 'rgba(255,40,0,0)']]); g.fillRect(0, 0, W, H); g.restore();
  // 3. THE FOLLOWER, CHARGED: its own silhouette glowing round it (wide and tight), flames licking up off its edges, its own render, its hollow and diamond blazing, embers rising off it
  const mask = (blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(model, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(mask(22, '#ff3a08'), 0, 0); g.globalAlpha = 0.8; g.drawImage(mask(7, '#ff8a2a'), 0, 0); g.restore();
  // the flames off its edges: tongues rooted on the top of its silhouette, leaning up the world's up
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const edges = []; for (let x = 2; x < W - 2; x += 3) { for (let y = 0; y < H; y++) if (A(x, y) > 128) { edges.push([x, y]); break; } }
  const tongue = (G, x, y, len, wid, ang, bend, cols, alpha) => {   // a flame: a teardrop from its root (x, y) along ang, bending at its tip
    G.save(); G.translate(x, y); G.rotate(ang); G.globalAlpha = alpha;
    const gr = G.createLinearGradient(0, 0, 0, -len); cols.forEach(([o, c]) => gr.addColorStop(o, c)); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-wid, 0); G.bezierCurveTo(-wid * 1.1, -len * 0.35, bend * 0.5 - wid * 0.4, -len * 0.7, bend, -len);
    G.bezierCurveTo(bend * 0.5 + wid * 0.4, -len * 0.7, wid * 1.1, -len * 0.35, wid, 0); G.quadraticCurveTo(0, wid * 0.8, -wid, 0); G.fill(); G.restore(); };
  const FIRE = [[0, 'rgba(255,240,190,1)'], [0.25, 'rgba(255,170,50,0.95)'], [0.6, 'rgba(255,70,10,0.7)'], [1, 'rgba(200,20,0,0)']];
  const upAng = Math.atan2(up[0], -up[1]);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 70; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; tongue(g, e[0], e[1] + 4, 14 + R() * 30, 3 + R() * 5, upAng + (R() - 0.5) * 0.5, (R() - 0.5) * 14, FIRE, 0.35 + R() * 0.4); }
  g.restore();
  g.drawImage(model, 0, 0);
  g.save(); g.globalCompositeOperation = 'lighter'; blob(g, heart[0], heart[1], 70, [[0, 'rgba(255,230,160,0.55)'], [0.35, 'rgba(255,120,30,0.3)'], [1, 'rgba(255,60,10,0)']]); blob(g, heart[0], heart[1], 26, [[0, 'rgba(255,250,225,0.8)'], [1, 'rgba(255,200,120,0)']]);   // (the diamond blazing)

  for (let k = 0; k < 40; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 10 + R() * 90, x = e[0] + up[0] * d + (R() - 0.5) * 30, y = e[1] + up[1] * d + (R() - 0.5) * 10; blob(g, x, y, 1.5 + R() * 3, [[0, 'rgba(255,230,160,1)'], [0.4, 'rgba(255,120,30,0.8)'], [1, 'rgba(255,60,10,0)']]); }
  g.restore();
  // 4. NEAR: the crater erupting under the camera (HEXFIRE's crater opens where its enemy stands: here, at the lens). A fountain of lava bursts up the left, its spray arcing over
  //    toward the lens, sparks flying out of it; the crater's broken lip across the foot; flames at the very front, out of focus.
  const perp = [-up[1], up[0]];   // (across the world's up, on the picture: to the right)
  const at = (o, a, b) => [o[0] + up[0] * a + perp[0] * b, o[1] + up[1] * a + perp[1] * b];   // a point a along the world's up and b across from o
  const F0 = [W * 0.3, H * 0.84], FL = 470;   // the fountain's foot (behind the lip) and its height
  const fc = t => { const c = at(F0, FL * t, -18 * t * t + 10 * Math.sin(t * 7)); return c; };   // its middle line, leaning a little left as it rises
  const fw2 = t => 20 + 30 * t + 30 * Math.pow(t, 4);   // its half width: flaring at its top
  const lavaGrad = (G, x0, y0, x1, y1) => { const gr = G.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(150,20,0,0)'); gr.addColorStop(0.18, 'rgba(210,40,4,0.9)'); gr.addColorStop(0.38, '#ff7a14'); gr.addColorStop(0.5, '#ffe6a0'); gr.addColorStop(0.62, '#ff9a24'); gr.addColorStop(0.82, 'rgba(210,40,4,0.9)'); gr.addColorStop(1, 'rgba(150,20,0,0)'); return gr; };
  const drop = (G, x, y, ang, r, stretch) => { G.save(); G.translate(x, y); G.rotate(ang);
    const gr = G.createLinearGradient(-r * stretch, 0, r, 0); gr.addColorStop(0, 'rgba(200,30,0,0)'); gr.addColorStop(0.55, 'rgba(255,110,20,0.9)'); gr.addColorStop(0.85, '#ffd27a'); gr.addColorStop(1, '#fff4d0'); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-r * stretch, 0); G.quadraticCurveTo(-r * 0.2, -r, r * 0.6, -r * 0.92); G.arc(r * 0.4, 0, r * 0.95, -PI / 2, PI / 2); G.quadraticCurveTo(-r * 0.2, r, -r * stretch, 0); G.fill();
    G.fillStyle = 'rgba(255,255,240,0.9)'; G.beginPath(); G.arc(r * 0.6, -r * 0.35, r * 0.22, 0, 2 * PI); G.fill(); G.restore(); };
  const fount = cv(), fo = fount.getContext('2d');
  // the plume: flames stacked up its middle line, rooted all the way up it and leaning with it (stacked light: white-hot where they crowd, at its heart and its foot)
  fo.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 230; k++) { const t = Math.pow(R(), 1.25) * 0.9, c = fc(t), w = fw2(t), p0 = at(c, 0, (R() - 0.5) * 1.5 * w), L = (50 + R() * 110) * (0.7 + 0.6 * t), wd = (8 + R() * 16) * (0.8 + 0.8 * t);
    tongue(fo, p0[0], p0[1], L, wd, upAng + (R() - 0.5) * 0.35, (R() - 0.5) * 30, FIRE, 0.11 + R() * 0.17); }
  fo.globalCompositeOperation = 'source-over';
  // the burst at its top and the drops flung out of it: arcs up and over, each drop stretched along its flight with a hot head and a glint
  const top = fc(0.86); const drops = [];
  for (let k = 0; k < 46; k++) { const a = Math.atan2(up[1], up[0]) + (R() - 0.35) * 2.4, sp = 40 + R() * 300, x = top[0] + Math.cos(a) * sp * (0.4 + R() * 0.6) + (R() - 0.5) * 30, y = top[1] + Math.sin(a) * sp * 0.5 + sp * sp * 0.0011 * R();
    const r = 2.5 + Math.pow(R(), 2) * 9; drops.push([x, y, a + 0.3 * R(), r, 2.5 + R() * 4]); }
  drops.forEach(d => drop(fo, ...d));
  for (let k = 0; k < 18; k++) { const a = Math.atan2(up[1], up[0]) + (R() - 0.5) * 1.2, d = R() * 50, p0 = [top[0] + Math.cos(a) * d, top[1] + Math.sin(a) * d]; blob(fo, p0[0], p0[1], 16 + R() * 22, [[0, 'rgba(255,240,190,0.95)'], [0.4, 'rgba(255,150,40,0.8)'], [1, 'rgba(220,40,4,0)']]); }   // (the burst's crown)
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(16px)'; g.drawImage(fount, 0, 0); g.filter = 'blur(5px)'; g.globalAlpha = 0.7; g.drawImage(fount, 0, 0); g.restore();   // (its heat: a wide glow and a near one)
  g.save(); g.filter = 'blur(0.6px)'; g.drawImage(fount, 0, 0); g.restore();
  // sparks: thin bright streaks thrown out of it, up and to the right, some across the follower
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let k = 0; k < 110; k++) { const t0 = 0.15 + R() * 0.75, s0 = fc(t0), a = Math.atan2(up[1], up[0]) + 0.25 + R() * 1.25, d = 20 + Math.pow(R(), 0.7) * 420, L = 6 + R() * 30;
    const x = s0[0] + Math.cos(a) * d, y = s0[1] + Math.sin(a) * d, ex = x - Math.cos(a) * L, ey = y - Math.sin(a) * L, lgS = g.createLinearGradient(x, y, ex, ey);
    lgS.addColorStop(0, 'rgba(255,248,215,1)'); lgS.addColorStop(0.3, 'rgba(255,170,50,0.85)'); lgS.addColorStop(1, 'rgba(255,60,10,0)'); g.strokeStyle = lgS; g.lineWidth = 0.8 + R() * 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke(); }
  g.restore();
  // the crater's lip: broken dark rock across the foot, tilted with the horizon, its edge glowing where the lava lights it, so the fountain bursts from behind it
  const lip = []; { let x = -20; while (x < W + 30) { const base = hzAt(x) + 170 + 26 * Math.sin(x * 0.011 + 1), y = base + (R() - 0.5) * 22 - (R() < 0.25 ? 18 * R() : 0); lip.push([x, y]); x += 8 + R() * 22; } }
  g.save(); g.beginPath(); g.moveTo(-20, H + 20); lip.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 30, H + 20); g.closePath();
  const lyl = Math.min(...lip.map(q => q[1])); let lr = g.createLinearGradient(0, lyl, 0, H); lr.addColorStop(0, '#3a1208'); lr.addColorStop(0.18, '#160604'); lr.addColorStop(1, '#060202'); g.fillStyle = lr; g.fill();
  g.clip(); for (let k = 0; k < 40; k++) { const q = lip[Math.floor(R() * lip.length)], x = q[0], y = q[1] + 10 + R() * 120; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 60, y + 20 + R() * 50); g.stroke(); }   // (its cracks and facets)
  g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(F0[0], F0[1], 260, [[0, 'rgba(255,90,20,0.5)'], [1, 'rgba(255,60,10,0)']]); g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  const lipPath = () => { g.beginPath(); lip.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  g.restore();
  // its top face lit by the lava: a band under the edge, brightest near the fountain, and the edge itself catching the light there
  g.save(); g.beginPath(); g.moveTo(-20, H + 20); lip.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 30, H + 20); g.closePath(); g.clip();
  for (let i = 1; i < lip.length; i++) { const [x0, y0] = lip[i - 1], [x1, y1] = lip[i], dF = Math.hypot((x0 + x1) / 2 - F0[0], (y0 + y1) / 2 - F0[1]), k = Math.max(0.12, 1 - dF / 300);
    const th = 8 + 10 * R(); g.fillStyle = 'rgba(' + Math.round(120 + 110 * k) + ',' + Math.round(30 + 40 * k) + ',8,' + (0.25 + 0.5 * k) + ')'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1 - 2, y1 + th); g.lineTo(x0 + 2, y0 + th * (0.6 + 0.4 * R())); g.closePath(); g.fill(); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  for (let i = 1; i < lip.length; i++) { const [x0, y0] = lip[i - 1], [x1, y1] = lip[i], dF = Math.hypot((x0 + x1) / 2 - F0[0], (y0 + y1) / 2 - F0[1]), k = Math.max(0, 1 - dF / 260);
    if (k <= 0) continue; g.strokeStyle = 'rgba(255,170,70,' + (0.7 * k) + ')'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
  // flames at the lens: big soft tongues rising off the lip at the front left and right, out of focus (the nearest plane)
  const near = cv(), ng = near.getContext('2d'); ng.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 34; k++) { const x = -30 + Math.pow(R(), 1.4) * W * 0.5, y = H + 10 - R() * 60; tongue(ng, x, y, 80 + R() * 190 * (1 - x / W), 12 + R() * 22, upAng + (R() - 0.5) * 0.45, (R() - 0.5) * 50, FIRE, 0.22 + R() * 0.3); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(2.5px)'; g.drawImage(near, 0, 0); g.filter = 'none'; g.restore();
  // drops right at the lens: big, soft, flying past the top corners
  { const lens = cv(), lg2 = lens.getContext('2d'); [[W * 0.78, H * 0.1, 0.5, 15], [W * 0.95, H * 0.24, 0.9, 11], [W * 0.06, H * 0.05, -2.2, 13], [W * 0.62, H * 0.03, 0.2, 8]].forEach(([x, y, a, r]) => drop(lg2, x, y, a, r, 5));
    g.save(); g.filter = 'blur(5px)'; g.globalCompositeOperation = 'lighter'; g.drawImage(lens, 0, 0); g.filter = 'blur(2px)'; g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.8; g.drawImage(lens, 0, 0); g.restore(); }
  // bokeh: a few soft embers right at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 8; k++) { const x = R() * W, y = R() * H * 0.55, r = 10 + R() * 24; blob(g, x, y, r, [[0, 'rgba(255,170,70,0.18)'], [0.75, 'rgba(255,110,30,0.13)'], [1, 'rgba(255,80,20,0)']]); }
  g.restore();
  // 5. THE GRADE: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(W * 0.55, H * 0.4, H * 0.75, [[0.5, 'rgba(0,0,0,0)'], [1, 'rgba(10,2,1,0.6)']]); g.fillRect(0, 0, W, H); g.restore();
  return { png: out.toDataURL('image/png'), info };
  }
};
</script></body></html>`;

(async () => {
  const P = SAMPLES[SAMPLE] && JSON.parse(JSON.stringify(SAMPLES[SAMPLE]));
  if (P && process.env.CARD_TRY) { const o = JSON.parse(process.env.CARD_TRY); for (const k in o) P[k] = (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) ? Object.assign(P[k] || {}, o[k]) : o[k]; }   // (CARD_TRY: a JSON of settings to try in place of the sample's, for looking; never the baked card's)
  if (!THREE_DIR || !P || !OUT) { console.error('usage: node design/cards/attack/bake_attack.js <three-dir> <' + Object.keys(SAMPLES).join('|') + '> <out.png> [--model]'); process.exit(1); }
  const W = 450, H = 630;
  if (process.env.CARD_PAGE) fs.writeFileSync(process.env.CARD_PAGE, page);   // (CARD_PAGE: write the page out, to look for a slip in it)
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://card.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://card.local/');
  const res = await p.evaluate(([P, W, H, m]) => window.__card(P, W, H, m), [P, W, H, MODEL_ONLY]);
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log('wrote ' + OUT + ' (' + W + ' x ' + H + ', ' + fs.statSync(OUT).size + ' bytes)  ' + JSON.stringify(res.info));
  await b.close();
})();
