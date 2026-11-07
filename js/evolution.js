// ─────────────────────────────────────────────────────────
//  EVOLUTION — a follower sheds the egg
// ─────────────────────────────────────────────────────────
// REPORTED: "give the followers evolutions … the followers shed their egg
// form, lose their shell and their legs, and become little drones or
// sentinels." From the design sheet: "the Reaver and the Bunker Bloom fit the
// vibe — make the Bunker Bloom an evolution of the fire brawler and the Reaver
// an evolution of the electric sniper." Asked: automatically at a level; a
// stat boost and a signature move.
//
//   WHEN   (EVOLVE_LEVEL was 20; it is 10 now.) A follower of an element and role with a form that reaches EVOLVE_LEVEL evolves
//          on the spot. It MOLTS (EVO_MOLT frames): the egg shakes and
//          cracks, the glass bursts and its legs drop, and the machine rises
//          out of it. It keeps that form for good: through death, the respawn
//          queue and a reload, and its role is fixed (a role switch skips it).
//   RE-ROLLED  A follower re-rolled to another element comes back an egg (its level halved) and does NOT evolve on the spot: it
//          evolves, into its new element's form, on its next level-up (f._evoOnLevelUp; levels.js calls evoCheck on a level-up).
//   STATS  Health and power × EVOLVE_MULT, applied where a follower's stats
//          are derived (levels.js _applyFollowerLevel), so it survives every
//          level-up and recompute.
//   MOVES  BUNKER BLOOM, PETAL BLAZE: with an enemy within BLOOM_RADIUS, at each wind-up
//          (MOVES.petal_blaze.windup) its petals fly open in a ring of fire that hits
//          everything round it (BLOOM_MULT × its power) and sets it burning.
//          REAVER, ARC VOLLEY: with an enemy within REAVER_RANGE, at each wind-up
//          (MOVES.arc_volley.windup) it fans its blades and fires a charged arc
//          (REAVER_MULT × its power) that jumps to REAVER_CHAIN more enemies.
//          HAMMER SLUG (design No. 467: a slug with a hammerhead and bobbles at its tips, a uniform hexagon tile
//          cover either side of a spiked spine, a small horn) was the CORE BRAWLER, which replaced the Aegis Warden;
//          it is the CORE TECHNICIAN now (ASKED: "the old core brawler is going to be switched to the technician
//          class", then "Swap it"), and a follower already evolved into it is a technician with it (its role is
//          its form's). The core brawler's own new form is the JELLY RAM, below.
//          JELLY RAM (the CORE BRAWLER, design No. 860, the user's "CORE BRAWLER · JELLY RAM" sheet: a clear dome
//          with a big diamond in it under a black helmet band, a horn out of either side, a body of jelly trailing
//          tentacles; it hovers, and its action frames are the sheet's charge, a ram; ASKED: "do the Jelly Ram and
//          Ice Mage now"). Its sheet is blue; it is baked in the core element's teal, so it reads as core beside the
//          Crystal and its own card. REDONE from the user's pencil sketch (2026-11-01, design No. 881): "a hard
//          redesign of the jelly ram, [glass] head with bubble inside lit up blue white and a swirly collar that orbits
//          his neck"; the entry below says what it is now.
//          THE CORE FORMS HAVE NO MOVE NOW (REPORTED: "Remove the bubble shield from the followers and all relevant abilities. We'll add a new look and iron out ability information"):
//          AEGIS BURST (the Jelly Ram's, the Hammer Slug's, the old Aegis Warden's) and AEGIS BLOOM (the Hornshell's,
//          the old Petal Aegis's) put a shield on the followers round them, so they went with the followers' shield
//          (and the core element's RADIANT PULSE and SHIELD GRANT with them: js/elements.js). The forms keep their
//          looks and have no signature move until the new abilities are worked out.
//          RIMESTAR (the ICE MAGE, design No. 861, the user's sheet, which has no name: a white drone of three long
//          fins round a faceted blue diamond; it hovers) has NO signature move: there was none for an ice mage to
//          keep, and none was invented. An Ice Mage evolved into it still preserves specimens (js/specimen.js
//          counts an evolved form by its form's element and role).
//          THE TECHNICIANS' FORMS (ASKED: "add the new technician forms now"; the user's sheets, design Nos. 850-852):
//          GOO PROXY (the FLUX technician), THERMITE BURROWER (the FIRE technician) and IGLOO SKATER (the ICE
//          technician). The technician "helps traverse the battlefield and provides exploration tools to the user";
//          the tools are the user's own, to come ("I have already made these, but I will put them in later"), so
//          these forms have NO signature move (no `move`: js/moves.js gives them none and the INFO says so). They
//          fight as technicians do, with the evolved stats. Then the last two (the user's sheets, Nos. 870-871): BLIGHT
//          SPIDER (the TOXIC technician, its card: "BLIGHT SPIDER · TOXIC DEPLOY") and HOVER SHELL (the ELECTRIC
//          technician; the sheet has no name, so this one is its own words, "Hover Shell + 6-Leg Shuttle"; its
//          action frames were the sheet's separation, the shell lifting off the shuttle). No move either. Every
//          element and role has a form now. The HOVER SHELL was REDONE from the user's pencil sketch (2026-11-01,
//          design No. 882): a manta of a hover craft, no shuttle now; the entry below says what it is.
//          STORM MANTA (the electric brawler, No. 68), STATIC RUSH: with an
//          enemy within MANTA_RANGE, every wind-up (MOVES.static_rush.windup) it dashes to it,
//          hits it (MANTA_MULT × its power) and shocks two more near it; all
//          are stunned for a moment.
//          SERPENT (the flux sniper, design No. 15), SINGULARITY SHOT: with an
//          enemy within SERPENT_RANGE, every wind-up (MOVES.singularity_shot.windup) it rears up
//          and fires a gravity round (SERPENT_MULT × its power) that DRAGS every
//          enemy within SERPENT_PULL_R of the target in towards it and slows
//          them. A beetle, a boss or a machine is too heavy to drag
//          (vortexPullImmune) and takes the hit only.
//          CINDER HALO (the FIRE SNIPER, design No. 90, the ring drone), HEXFIRE:
//          with an enemy within HALO_RANGE, every wind-up (MOVES.hexfire.windup) it fires
//          SIX rounds at once from the six crystals of its ring, one at each of
//          the nearest enemies in turn (all six into one if it is alone), each
//          HALO_MULT × its power and setting its target burning.
//          ROTSHARD (the TOXIC SNIPER, design No. 101, the crystal half eaten by its pool),
//          CORRODE SHOT: with an enemy within ROT_RANGE, every wind-up (MOVES.corrode_shot.windup) it
//          fires one long shot (ROT_MULT × its power) that eats the target's armour
//          (it takes 1 / ROT_SHRED × damage for ROT_SHRED_FRAMES) and splashes
//          the same corrosion, at half strength, over whatever is within ROT_SPLASH_R.
//          RIFT MIMIC (the FLUX BRAWLER, design No. 114, the Ditto-style blob with big black shards),
//          GRAVITY SLAM: with an enemy within MIMIC_RADIUS, every wind-up (MOVES.gravity_slam.windup) it
//          flattens and slams its weight down: everything within MIMIC_RADIUS takes
//          MIMIC_MULT × its power, is shoved MIMIC_PUSH back (a beetle, a boss or a machine
//          is too heavy to move) and slowed by MIMIC_SLOW for MIMIC_SLOW_FRAMES.
//          HORNSHELL (the CORE MAGE, design No. 220: a black shell-jar on its side dragged along the ground by
//          fat, irregular tentacles, a shard horn at its mouth) replaced the Petal Aegis (No. 120, a rosette of
//          plate-petals round a crystal), which stays defined, marked legacy, for followers already evolved into it.
//          QUILLSTONE (the FIRE BRAWLER, design No. 354: a pitch-black cut gem that crawls on little hidden
//          feet, red shards growing out of it, its two front spikes black like the shell), replaced the Bunker
//          Bloom for new evolutions (the Bunker Bloom stays defined, marked legacy, for followers already evolved into it, with
//          its ring of fire, PETAL BLAZE). It cast the same ring under the name QUILL BURST until it was rebuilt (ASKED, in the
//          Notion design archive: a projectile with a 75% hit chance that improves up close; the numbers were chosen with the
//          user, 2026-10-30): with an enemy within QUILL_RANGE, every wind-up (MOVES.quill_burst.windup) it fires heated quills at the nearest.
//          The hit is a roll made as it fires, with no flight to dodge and no spread (a simple attack-resolution modifier, not
//          projectile physics): the chance is QUILL_CHANCE at the outer range and rises in a straight line to 100% within
//          QUILL_SURE tiles of the target. A hit deals QUILL_MULT × its power plus QUILL_BONUS (a fixed bonus: it does not grow
//          with the closeness) to the target and everything within QUILL_SPLASH of it, and burns nobody. A miss shows MISS and
//          the quills fly on past. The damage is still fire: the game has no damage categories yet.
//          SEEPER (the TOXIC BRAWLER, design No. 578: a black volcano walking on four pins,
//          goo oozing from its eye and flanks; it replaced the Caldera), ERUPTION: with an enemy within CALDERA_RADIUS, at each wind-up
//          (MOVES.eruption.windup) it hunkers and the crater bursts: everything within
//          CALDERA_RADIUS takes CALDERA_MULT × its power in toxic goo and has its armour
//          eaten (it takes 1 / CALDERA_SHRED × damage for CALDERA_SHRED_FRAMES).
//          FROST MAW (the ICE BRAWLER, design No. 156: a dome of frosted shell with a cave
//          for a mouth and two crystal fangs inside), CHOMP: with an enemy within MAW_RANGE,
//          every wind-up (MOVES.chomp.windup) the fangs slam down: the nearest enemy takes MAW_MULT × its
//          power in ice damage and is frozen stiff for MAW_STUN frames, and everything within
//          MAW_SLOW_R of it is slowed to MAW_SLOW for MAW_SLOW_FRAMES.
//          PRISM HOOD (the ELECTRIC BRAWLER, design No. 388: a hollow black pyramid whose front droops like a
//          hood over a diamond, black hex crystals on its coat that breathe, and three small gems hovering in a
//          triangle before the diamond; it bounces as it goes),
//          replaced the Storm Manta
//          for new evolutions and does the same STATIC RUSH (the Storm Manta stays defined, marked legacy,
//          for followers already evolved into it).
//   LOOK   Baked from the 3D design models (design/evolutions/) into sprite
//          sheets in img/evo/: 8 facings × 16 frames (8 idle, 8 action),
//          seen from the game's own iso angle.
//   GROUND A form's POOLS OF MATERIAL (the Rotshard's slurry, the Rift Mimic's skirt
//          of liquid) are baked to a second sheet (<id>_g.png) and painted ONTO THE
//          FLOOR, tile by tile (drawEvoGroundOnTile, called from the floor-tile
//          draw), clipped to each tile and so under every unit and whatever
//          stands on the tile. Drawn with the body in depth order, a pool wider
//          than its owner painted over the units beside it in a bundle.

const EVOLVE_LEVEL = 10;
const EVOLVE_MULT  = 1.25;
const EVO_MOLT     = 120;          // frames: shake, burst, rise
const EVO_SCALE    = 96 / 144;     // a sheet cell (144 px, 3.4 world units) drawn at game size
const BLOOM_RADIUS = 1.8, BLOOM_MULT = 2.0, BLOOM_BURN = 180;
const REAVER_RANGE = 6, REAVER_MULT = 2.5, REAVER_CHAIN = 2, REAVER_HOP = 2.5, REAVER_CHAIN_SHARE = 0.6;
const SERPENT_RANGE = 6.5, SERPENT_MULT = 2.2, SERPENT_PULL_R = 2.2, SERPENT_PULL = 0.75, SERPENT_SLOW = 0.5, SERPENT_SLOW_FRAMES = 90;
const MANTA_RANGE = 4, MANTA_MULT = 2.4, MANTA_CHAIN = 2, MANTA_HOP = 2.2, MANTA_CHAIN_SHARE = 0.6, MANTA_STUN = 45;   // SONIC ROLL (was STATIC RUSH: renamed, kept as it is)
// THE FOLLOWER COMBAT REDESIGN (the owner's brief, 2026-11-02; docs/FOLLOWER-COMBAT-REDESIGN.md). Every number below is PROVISIONAL (that doc's §11.2), to tune in play.
// HEXFIRE: a fire projectile at the nearest enemy in reach; where it lands, a stationary burning circle that hurts enemies only, never grows and never moves. One circle an Ember Hood: a new one takes its last one's place.
// MAGMA VENT (the Thermite Burrower's alternate; the owner, 2026-11-06: "Short and hot"; docs/NEXT-PHASE-ROADMAP.md §12.3): a small volcanic vent opened at the enemy it can see, bursting magma upward
// every MAGMA_TICK frames for MAGMA_LIFE frames: each burst bites the enemies within MAGMA_RADIUS tiles that can be seen from the vent, for MAGMA_BITE × its power; then its wind-up (MOVES.magma_vent.windup) before the next.
const MAGMA_RANGE = 6, MAGMA_RADIUS = 1.5, MAGMA_LIFE = 480, MAGMA_TICK = 60, MAGMA_BITE = 0.6;   // reach (tiles) [reading], the burst's reach, 8 s, a burst a second, 60%
const HALO_RANGE = 7, HALO_RADIUS = 1.2, HALO_LIFE = 240, HALO_TICK = 30, HALO_BITE = 0.25;   // its reach, the circle's radius (tiles) and life (frames), a bite every HALO_TICK frames of HALO_BITE × power
// PINBALL (the Static Orb's second move): it rolls into the nearest enemy, then on into the nearest one it has not hit within PIN_HOP of it, and on, while one is that near: each enemy once, no fixed count.
const PIN_RANGE = 4, PIN_HOP = 3, PIN_SPEED = 0.35, PIN_TOUCH = 0.7, PIN_MULT = 1.44, PIN_MAX_FRAMES = 600, PIN_MAX_DIST = 30;   // reach, the hop, its speed (tiles a frame), a collision within PIN_TOUCH, × power a collision, and the safety stops (frames, tiles rolled)
// CHAIN LIGHTNING (the Thunderhead's everyday shot): the Mages' shot, then on from the enemy it struck to the nearest one not yet struck within CHAIN_HOP, each jump CHAIN_SHARE of the last, until none is that near or a jump would do under CHAIN_MIN.
const CHAIN_HOP = 2.5, CHAIN_SHARE = 0.6, CHAIN_MIN = 1;
// STATIC VORTEX (the Thunderhead's move): a stationary storm at the nearest enemy in reach; enemies in it are pulled toward its middle and take electric damage until it runs out.
const VORTEX_RANGE = 7, VORTEX_RADIUS = 2.5, VORTEX_LIFE = 240, VORTEX_PULL = 0.06, VORTEX_TICK = 30, VORTEX_MULT = 0.2;   // reach, its radius and life, the pull (tiles a frame), a bite every VORTEX_TICK frames of VORTEX_MULT × power
const ROT_RANGE = 7, ROT_MULT = 2.2, ROT_SHRED = 0.4, ROT_SHRED_FRAMES = 360, ROT_SPLASH_R = 1.6, ROT_SPLASH_SHRED = 0.6, ROT_SPLASH_FRAMES = 180;
const MIMIC_RADIUS = 2.2, MIMIC_MULT = 1.9, MIMIC_PUSH = 0.5, MIMIC_SLOW = 0.5, MIMIC_SLOW_FRAMES = 90;
const CALDERA_RADIUS = 2.4, CALDERA_MULT = 1.8, CALDERA_SHRED = 0.5, CALDERA_SHRED_FRAMES = 240;
const MAW_RANGE = 1.8, MAW_MULT = 2.4, MAW_STUN = 75, MAW_SLOW_R = 1.6, MAW_SLOW = 0.5, MAW_SLOW_FRAMES = 120;
const EVO_ACT_FRAMES = 40;         // how long a signature move plays its action frames
// QUILL BURST (the redesign): EXACTLY five quills at once (approved), fanned forward, the middle one at the nearest enemy; each its own follower shot that stops at the first enemy it touches. The fan, reach, speed, damage and wait are PROVISIONAL.
const QUILL_RANGE = 4, QUILL_COUNT = 5, QUILL_FAN = 40, QUILL_MULT = 0.5, QUILL_SPEED = 0.18;   // its reach (tiles), the quills, the fan (degrees, edge to edge), × power a quill, its speed (the follower shots')

// THE FOLLOWER COMBAT REDESIGN (the owner, 2026-11-02; docs/FOLLOWER-COMBAT-REDESIGN.md): `hit` names the Thermite Burrower's everyday hit, BURROW STRIKE (burrowStrikeTry); `shot` names a Mage form's everyday shot where it has a name of its own (the Ember Hood's FIREBALL, the
// Thunderhead's CHAIN LIGHTNING, which conducts on: evoShotOnHit). The Static Orb's moves are SONIC ROLL (STATIC RUSH renamed) and PINBALL; the Thunderhead's is STATIC VORTEX, ARC VOLLEY staying
// with the retired Reaver. The retired electric brawlers keep SONIC ROLL alone.
const EVOLUTIONS = {
    // LEGACY: the first fire brawler. New evolutions use the Quillstone; a follower already evolved into this keeps it.
    bloom:  { id: "bloom",  legacy: true, name: "BUNKER BLOOM", element: "fire",     role: "brawler", move: "PETAL BLAZE", moves: ["petal_blaze", "bomb_lob"], sheet: "img/evo/bloom.png",
              cell: 144, anchor: [72, 114.2], core: [72, 74.6] },
    // LEGACY: the first electric mage. New evolutions use the Thunderhead; a follower already evolved into this keeps it.
    reaver: { id: "reaver", legacy: true, name: "REAVER", element: "electric", role: "sniper",  move: "ARC VOLLEY",  sheet: "img/evo/reaver.png",
              cell: 144, anchor: [72, 114.2], core: [72, 58.4] },
    // The ELECTRIC MAGE ("sniper" in the code), design No. 541: a smooth cloud of dark gas over a flickering glow, a crown of black spikes,
    // four glowing spikes circling its base and gas fins that ripple. The glow flickers, so its sheet carries its own light.
    thunderhead: { id: "thunderhead", name: "THUNDERHEAD", element: "electric", role: "sniper", move: "STATIC VORTEX", shot: "CHAIN LIGHTNING", sheet: "img/evo/thunderhead.png",
              cell: 144, anchor: [72, 114.2], core: [72, 78.3], noGlow: true, color: "#ffee33" },
    // Its reactor is in its head, which moves with its facing: the sheet carries its own light.
    // LEGACY: the first flux mage. New evolutions use the Voidstar; a follower already evolved into this keeps it.
    serpent:{ id: "serpent", legacy: true, name: "SERPENT", element: "flux", role: "sniper", move: "SINGULARITY SHOT", sheet: "img/evo/serpent.png",
              cell: 144, anchor: [72, 114.2], core: [72, 61], noGlow: true, color: "#bb66ff" },
    // The FLUX ("void") MAGE, design No. 637: a dark spined starfish carrying a big orb of violet fluid with a diamond floating in it, held up by four thick claws. The diamond
    // turns and bubbles rise, so its sheet carries its own light.
    voidstar:{ id: "voidstar", name: "VOIDSTAR", element: "flux", role: "sniper", move: "SINGULARITY SHOT", sheet: "img/evo/voidstar.png",
              cell: 144, anchor: [72, 114.2], core: [72, 77], noGlow: true, color: "#bb66ff" },
    // LEGACY: the first core brawler. A follower already evolved into this keeps it. (The Hammer Slug that replaced it is the core technician now; the core brawler's form is the Jelly Ram.)
    warden: { id: "warden", legacy: true, name: "AEGIS WARDEN", element: "core",     role: "brawler", sheet: "img/evo/warden.png",
              cell: 144, anchor: [72, 114.2], core: [72, 59], noGlow: true, color: "#33e6c4" },
    // LEGACY: the first electric brawler. New evolutions use the Prism Hood; a follower already evolved into this keeps it.
    manta:  { id: "manta",  legacy: true, name: "STORM MANTA",  element: "electric", role: "brawler", move: "SONIC ROLL",  sheet: "img/evo/manta.png",
              cell: 144, anchor: [72, 114.2], core: [72, 57], noGlow: true, color: "#ffee33" },
    // The FIRE SNIPER: a ring of six crystals, one round from each. Its ring turns, so its sheet carries its own light.
    // LEGACY: the first fire mage, whose design went to the electric brawler (the Volt Ring). A follower already evolved into this keeps it.
    halo:   { id: "halo",   legacy: true, name: "CINDER HALO", element: "fire", role: "sniper", move: "HEXFIRE", moves: ["hexfire", "bomb_lob"], sheet: "img/evo/halo.png",
              cell: 144, anchor: [72, 114.2], core: [72, 53.7], noGlow: true, color: "#ff5a1f" },
    // The FIRE BRAWLER, design No. 354 (its separate antennae dropped, the two front spikes black like the shell): a pitch-black cut gem that crawls on
    // little hidden feet, red shards growing out of it. The quills sway, so its sheet carries its own light.
    quillstone:{ id: "quillstone", name: "QUILLSTONE", element: "fire", role: "brawler", move: "QUILL BURST", moves: ["quill_burst", "bomb_lob"], sheet: "img/evo/quillstone.png",
              cell: 144, anchor: [72, 114.2], core: [72, 85], noGlow: true, color: "#ff5a1f" },
    // The ICE BRAWLER: a dome with a cave mouth. Its rubble lies on the floor (the ground sheet), and the cave is its own light.
    maw:    { id: "maw",    name: "FROST MAW",    element: "ice",      role: "brawler", move: "CHOMP",        sheet: "img/evo/maw.png",
              cell: 144, anchor: [72, 114.2], core: [72, 93], noGlow: true, color: "#9fe8ff", ground: "img/evo/maw_g.png" },
    // The ELECTRIC BRAWLER, design No. 312: a black hollow pyramid hood over a diamond. The diamond turns, so its sheet carries its own light.
    // LEGACY: the first design of the electric brawler, which went to the fire mage (the Ember Hood). A follower already evolved into this keeps it.
    prism:  { id: "prism",  legacy: true, name: "PRISM HOOD", element: "electric", role: "brawler", move: "SONIC ROLL", sheet: "img/evo/prism.png",
              cell: 144, anchor: [72, 114.2], core: [72, 77], noGlow: true, color: "#ffee33" },
    // THE SWAP: the electric brawler and the fire mage traded designs ("I don't like the fire mage design, so we'll just have it there on the
    // electric as a placeholder"), each recoloured for its new element. Moves and roles stay with the slots.
    // LEGACY: the ring-drone placeholder. New evolutions use the Static Orb; a follower already evolved into this keeps it.
    voltring:{ id: "voltring", legacy: true, name: "VOLT RING", element: "electric", role: "brawler", move: "SONIC ROLL", sheet: "img/evo/voltring.png",
              cell: 144, anchor: [72, 114.2], core: [72, 53.7], noGlow: true, color: "#ffee33" },
    // The ELECTRIC BRAWLER, design No. 781 (darkened): a near-black ball with an exposed amber diamond core, a slim tread band, open shell plates and a
    // pair of long thick trapezoid brackets down its back, static arcing between them. The tread and core move, so its sheet carries its own light.
    staticorb:{ id: "staticorb", name: "STATIC ORB", element: "electric", role: "brawler", move: "SONIC ROLL", moves: ["static_rush", "pinball"], sheet: "img/evo/staticorb.png",
              cell: 144, anchor: [72, 114.2], core: [72, 80.1], noGlow: true, color: "#ffe033" },
    // The FIRE MAGE ("sniper" in the code): the hooded pyramid with the hovering gems (design No. 391), recoloured for fire. The gems turn, so its sheet carries its own light.
    embercowl:{ id: "embercowl", name: "EMBER HOOD", element: "fire", role: "sniper", move: "HEXFIRE", moves: ["hexfire", "bomb_lob"], shot: "FIREBALL", sheet: "img/evo/embercowl.png",
              cell: 144, anchor: [72, 114.2], core: [72, 77], noGlow: true, color: "#ff5a1f" },
    // The CORE TECHNICIAN ("camper" in the code; it was the core brawler: swapped), design No. 467: a hammerheaded slug, a uniform hexagon tile cover either side of a spiked spine, a small horn. The tiles ripple, so the sheet carries its own light.
    hammerslug:{ id: "hammerslug", name: "HAMMER SLUG", element: "core", role: "camper", sheet: "img/evo/hammerslug.png",
              cell: 144, anchor: [72, 114.2], core: [72, 99.5], noGlow: true, color: "#33e6c4" },
    // THE TECHNICIANS' FORMS ("camper" in the code), from the user's sheets. No signature move: the technician's job is the user's exploration tools, to come.
    // The FLUX TECHNICIAN, design No. 853 (the "GOO PROXY" sheet, then the user's review: "a frog face with diamond eye iris and one is way bigger than the other and
    // smaller ring", "thinner diamonds"): a head of violet goo in a small black spiked ring, two bulging eyes on top, one far bigger than the other, a thin diamond for
    // each iris with a slit of a pupil, a wide smile. It breathes and looks about, so the sheet carries its own light.
    gooproxy:{ id: "gooproxy", name: "GOO PROXY", element: "flux", role: "camper", sheet: "img/evo/gooproxy.png",
              cell: 144, anchor: [72, 114.2], core: [72, 85.1], noGlow: true, color: "#bb66ff" },
    // The FIRE TECHNICIAN, design No. 855 (the "THERMITE BU…" sheet, its name cut off on it, then the user's review: "a black body with red glowing accents",
    // "thick armored arms", "more like a bear/zoids style tank animal ... same silhouette", "no ears or any face"): a hunched black armoured digger with seams of
    // red light and a cone drill for a nose glowing red in its groove, on a bear's thick armoured legs with clawed paws. The drill turns, so the sheet carries its own light.
    thermite:{ id: "thermite", name: "THERMITE BURROWER", element: "fire", role: "camper", hit: "BURROW STRIKE", move: "MAGMA VENT", sheet: "img/evo/thermite.png",
              cell: 144, anchor: [72, 114.2], core: [72, 74.8], noGlow: true, color: "#ff5a1f" },
    // The TOXIC TECHNICIAN, design No. 873 (the user's card, "BLIGHT SPIDER · TOXIC DEPLOY", then the review: "smaller, thinner, finer legs, and ... lower to the
    // ground"): a glass tank of bubbling toxin with black bands and a black front cap with a lens, on a black chassis riding low on six fine spider legs. The toxin
    // bubbles and the legs trot, so the sheet carries its own light.
    blightspider:{ id: "blightspider", name: "BLIGHT SPIDER", element: "toxic", role: "camper", sheet: "img/evo/blightspider.png",
              cell: 144, anchor: [72, 114.2], core: [72, 79.6], noGlow: true, color: "#66ff66" },
    // The ELECTRIC TECHNICIAN, design No. 882 (the user's pencil sketch of 2026-11-01, "sleek redesign of the electric technician", then on No. 880: "the hover shell
    // should have wings trapezoidal and a manta ray like mouth open and long and straight", and on No. 882: "Yes to all"): a manta of a hover craft, a long low black
    // dome, square at its front; two long straight trapezoid wings out of its sides, flat and ribbed, their edges lit yellow from underneath; a manta's mouth open across
    // its whole front, a long straight slot with a jutting jaw and gill plates lit yellow inside; two tall launcher prongs on top. Its action frames fire the launcher:
    // an arc between the prongs and a ring of light out of its mouth. It was No. 877 (the "ELECTRIC TECHNICIAN · FINAL CONCEPT" sheet's horseshoe-crab shell over a
    // six-legged shuttle, whose action frames lifted the shell off). It glows, so the sheet carries its own light.
    hovershell:{ id: "hovershell", name: "HOVER SHELL", element: "electric", role: "camper", sheet: "img/evo/hovershell.png",
              cell: 144, anchor: [72, 114.2], core: [72, 91.1], noGlow: true, color: "#ffee33" },
    // The ICE TECHNICIAN, design No. 857 (the user's pencil sketch: "a rectangular igloo looking dude that has diamonds for legs, who skates around", then the review:
    // "only 4 legs", "fitted bricks on the body", "the diamonds are nested under the body", "bigger bricks 2 layers", "moves like a train cart, so that the smaller side is
    // front facing"): a long box of big fitted ice bricks, narrow end first, on four diamonds nested in sockets under it. It glides, so the sheet carries its own light.
    igloo:  { id: "igloo",  name: "IGLOO SKATER", element: "ice", role: "camper", sheet: "img/evo/igloo.png",
              cell: 144, anchor: [72, 114.2], core: [72, 89], noGlow: true, color: "#9fe8ff" },
    // The CORE BRAWLER, design No. 881 (the user's pencil sketch of 2026-11-01: "a hard redesign of the jelly ram, [glass] head with bubble inside lit up blue white and a
    // swirly collar that orbits his neck", then "The brawler looks good"): a faceted glass head, a dodecahedron with its edges picked out, a bubble inside it lit blue white
    // (small bubbles rise off it), a neck of jelly with a swirly collar of three wavy bands orbiting it, seven fat wavy tentacles, one curled up behind. It swims as No. 867
    // did (the user's review of the "JELLY RAM" sheet: "move with flicks from all of its tentacles like the jellyfish from SpongeBob"), every tentacle flicking back at once;
    // its action frames are the ram, head first, the bubble flaring. It was No. 867 (a clear dome with a big diamond under a black helmet band, a horn out of either side).
    // No signature move (AEGIS BURST went with the followers' shield). It is in core's teal, its bubble blue white. It swims, so the sheet carries its own light.
    jellyram:{ id: "jellyram", name: "JELLY RAM", element: "core", role: "brawler", sheet: "img/evo/jellyram.png",
              cell: 144, anchor: [72, 114.2], core: [72, 64.7], noGlow: true, color: "#33e6c4" },
    // The ICE MAGE ("sniper" in the code), design No. 861 (the user's sheet, which has no name): a white drone of three long fins round a faceted blue diamond, black
    // joints ringed with light, a dark disc with a glowing eye at its back. No signature move (there was none for an ice mage). The fins sway, so the sheet carries its own light.
    rimestar:{ id: "rimestar", name: "RIMESTAR", element: "ice", role: "sniper", sheet: "img/evo/rimestar.png",
              cell: 144, anchor: [72, 114.2], core: [72, 72.1], noGlow: true, color: "#9fe8ff" },
    // The CORE MAGE ("sniper" in the code), design No. 220: a black shell-jar dragged along the ground on its side by fat, irregular
    // tentacles, a shard horn at the mouth. The tentacles move, so its sheet carries its own light.
    hornshell:{ id: "hornshell", name: "HORNSHELL", element: "core", role: "sniper", sheet: "img/evo/hornshell.png",
              cell: 144, anchor: [72, 114.2], core: [72, 89.4], noGlow: true, color: "#33e6c4" },
    // The TOXIC BRAWLER: a matte black volcano on four feet. Its shell is black and its goo moves, so its sheet carries its own light.
    // LEGACY: the first toxic brawler. New evolutions use the Seeper; a follower already evolved into this keeps it.
    caldera:{ id: "caldera", legacy: true, name: "CALDERA", element: "toxic", role: "brawler", move: "ERUPTION", sheet: "img/evo/caldera.png",
              cell: 144, anchor: [72, 114.2], core: [72, 72], noGlow: true, color: "#66ff66" },
    // The TOXIC BRAWLER, design No. 578: a black faceted shell with a cone on its back, walking on four splayed pins, one oozing eye, small leaks high
    // on its flanks. The puddle it walks through lies on the floor (the ground sheet); the goo moves, so the sheet carries its own light.
    seeper: { id: "seeper", name: "SEEPER",      element: "toxic",    role: "brawler", move: "ERUPTION",     sheet: "img/evo/seeper.png",
              cell: 144, anchor: [72, 114.2], core: [72, 67.9], noGlow: true, color: "#66ff66", ground: "img/evo/seeper_g.png" },
    // The CORE MAGE ("sniper" in the code): a rosette of plate-petals. The crystal at its middle is the reactor, so it keeps the shared glow.
    // LEGACY: the first core mage. New evolutions use the Hornshell; a follower already evolved into this keeps it.
    petal:  { id: "petal",  legacy: true, name: "PETAL AEGIS",  element: "core",     role: "sniper",  sheet: "img/evo/petal.png",
              cell: 144, anchor: [72, 114.2], core: [72, 66.5], color: "#33e6c4" },
    // The FLUX BRAWLER: a lump of liquid on the ground. Its surface moves, so its sheet carries its own light.
    mimic:  { id: "mimic",  name: "RIFT MIMIC",   element: "flux",     role: "brawler", move: "GRAVITY SLAM", sheet: "img/evo/mimic.png",
              cell: 144, anchor: [72, 114.2], core: [72, 99], noGlow: true, color: "#bb66ff", ground: "img/evo/mimic_g.png" },
    // The TOXIC SNIPER: a crystal tilted in a pool that is eating it. The pool shifts, so its sheet carries its own light.
    rotshard:{ id: "rotshard", name: "ROTSHARD", element: "toxic", role: "sniper", move: "CORRODE SHOT", moves: ["corrode_shot", "rotten_decoy"], sheet: "img/evo/rotshard.png",
              cell: 144, anchor: [72, 114.2], core: [72, 68.3], noGlow: true, color: "#66ff66", ground: "img/evo/rotshard_g.png" },
};
// Which egg grows into which machine.
function evolutionFor(f) {
    if (!f || !f.isFollower) return null;
    const role = f.role === "hybrid" ? "brawler" : f.role;
    for (const k in EVOLUTIONS) { const d = EVOLUTIONS[k]; if (d.legacy || d.element !== f.element) continue; if (d.role === role) return d; }
    return null;
}
function evolvedDef(f) { return f && f.evolved ? EVOLUTIONS[f.evolved] || null : null; }

// ── THE RULE ───────────────────────────────────────────────
// Evolve it now if it is due. True when it did.
function evoCheck(f) {
    if (!f || f.dead || !f.isFollower || f.evolved || f.team !== "green" || !((f.level || 0) >= EVOLVE_LEVEL)) return false;
    const d = evolutionFor(f);
    if (!d) return false;
    f.evolved = d.id; delete f._evoOnLevelUp;
    f._moltAt = typeof frame !== "undefined" ? frame : 0;
    f._sigCd = 90;
    if (typeof _applyFollowerLevel === "function") _applyFollowerLevel(f, false);
    f.health = f.maxHealth;
    if (typeof floatingTexts !== "undefined")
        floatingTexts.push({ world: true, x: f.x, y: f.y, text: "◆ EVOLVED · " + d.name, color: d.element === "fire" ? "#ffb066" : d.element === "toxic" ? "#99ff88" : "#fff27a", life: 150, vy: -0.05, size: 13 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 4);
    return true;
}
// Once a step, from render(): evolve anyone due, and run the signature moves.
// ROTTEN DECOY (the Rotshard's second move, picked on its INFO; the owner, 2026-11-07: "Short lure", "A second move to pick"; docs/NEXT-PHASE-ROADMAP.md §12.3 item 11): a black crystal copy in a constant green
// mist, set on the floor DECOY_SET tiles from the nearest enemy the Rotshard can see (toward the Rotshard). For DECOY_LIFE frames, or until broken (its HP is DECOY_HP of the Rotshard's maximum), every enemy
// within DECOY_DRAW tiles goes for it (js/predator.js predatorPickPrey asks decoyLure); a boss does not. Its mist poisons the enemies within DECOY_MIST tiles. Ready again its wind-up (MOVES.rotten_decoy.windup) after it is set.
// The decoy is not an actor: it lives in rotDecoys, takes hits through applyDamage, and is drawn as an element effect; broken, its black shards keep the green haze a moment.
const DECOY_LIFE = 360, DECOY_HP = 0.5, DECOY_DRAW = 6, DECOY_MIST = 1.5, DECOY_SET = 2, DECOY_POISON = 60, DECOY_TICK = 30;
let rotDecoys = [];
function rottenDecoy(f) {
    const foes = _evoFoesSeen(f.x, f.y, ROT_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const t = foes[0], dx = f.x - t.x, dy = f.y - t.y, L = Math.hypot(dx, dy) || 1, k = Math.min(DECOY_SET, L * 0.5);
    let x = t.x + dx / L * k, y = t.y + dy / L * k;
    if (typeof facilityStandOk === "function" && !facilityStandOk(x, y)) { const c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(x, y) : null; if (c) { x = c[0]; y = c[1]; } }
    const f0 = typeof frame !== "undefined" ? frame : 0, hp = Math.max(1, (f.maxHealth || 20) * DECOY_HP);
    const d = { isDecoy: true, team: "green", x, y, health: hp, maxHealth: hp, by: f, until: f0 + DECOY_LIFE, dead: false, name: "ROTTEN DECOY" };
    rotDecoys.push(d);
    if (typeof spawnElementEffect === "function") spawnElementEffect({ type: "rotdecoy", x, y, on: d, life: DECOY_LIFE, maxLife: DECOY_LIFE, element: "toxic" });
    f._sigAt = f0; f._sigCd = moveWindupFrames("rotten_decoy");
    return true;
}
function decoyLure(p) {   // the decoy a creature goes for: the nearest standing one within DECOY_DRAW (a boss: none)
    if (!rotDecoys.length || !p || p.bossId || p.bossName) return null;
    let best = null, bd = DECOY_DRAW;
    for (const d of rotDecoys) { if (d.dead) continue; const dd = Math.hypot(d.x - p.x, d.y - p.y); if (dd <= bd) { bd = dd; best = d; } }
    return best;
}
function rotDecoyTick() {   // (each frame, from evolutionTick): time out, the mist, broken
    if (!rotDecoys.length) return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const d of rotDecoys) {
        if (!d.dead && f0 >= d.until) d.dead = true;
        if (d.dead) { if (!d._gone) { d._gone = true; if (d.goo) gooProxyBurst(d); else if (typeof spawnElementEffect === "function") spawnElementEffect({ type: "rotshards", x: d.x, y: d.y, life: 45, maxLife: 45, element: "toxic" }); } continue; }
        if (d.goo) continue;   // (a PROXY SWARM copy has no mist)
        if ((f0 - d.until) % DECOY_TICK === 0 && typeof actors !== "undefined") for (const a of actors) if (a && !a.dead && isHostileTarget(a) && Math.hypot(a.x - d.x, a.y - d.y) <= DECOY_MIST && typeof applyWeaken === "function") applyWeaken(a, DECOY_POISON);
    }
    rotDecoys = rotDecoys.filter(d => !d._gone);
}
// A PROXY SWARM copy (the Goo Proxy's Ultimate, js/elements.js FORM_ULTIMATES.gooproxy), broken or timed out: it bursts, d.bite (flux) to every enemy within ULT_PROXY.burst tiles
function gooProxyBurst(d) {
    const R = typeof ULT_PROXY !== "undefined" ? ULT_PROXY.burst : 1.5;
    if (typeof actors !== "undefined") for (const a of actors) if (a && !a.dead && isHostileTarget(a) && Math.hypot(a.x - d.x, a.y - d.y) <= R) applyDamage(a, d.bite || 0, d.by && !d.by.dead ? d.by : null, "flux", false, false, typeof DMG_HIT_SPECIAL !== "undefined" ? DMG_HIT_SPECIAL : null);
    if (typeof spawnElementEffect === "function") { spawnElementEffect({ type: "ring", x: d.x, y: d.y, radius: R, color: "#d9b0ff", life: 24, element: "flux" }); spawnElementEffect({ type: "impact", x: d.x, y: d.y, color: "#b66cf5", radius: 1, life: 18, element: "flux" }); }
}
function evolutionTick() {
    rotDecoyTick();
    if (typeof followers === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const f of followers) {
        if (!f || f.dead || f._flight) continue;   // (thrown by a Kinetic Launcher: nothing until it is down, js/techabilities.js)
        if (!f.evolved) { if (f0 % 30 === 0 && !f._evoOnLevelUp) evoCheck(f); continue; }   // (one re-rolled to another element waits for its next level-up)
        const d = evolvedDef(f); if (!d) continue;
        if (d.role && f.role !== d.role) f.role = d.role;   // its role is fixed
        if (f0 - (f._moltAt || -1e9) < EVO_MOLT) continue;   // still coming out of the egg
        if (f._pinball) continue;   // a PINBALL rolling: nothing else fires, and its wait starts when it stops (pinballStep)
        f._sigCd = (f._sigCd || 0) - 1;
        if (f._sigCd > 0) continue;
        if (f.retreatUntil > f0) continue;   // told to RETREAT (js/mixtool.js): no signature moves until it is over
        const mv = typeof evoMoveOf === "function" ? evoMoveOf(f, d) : null;   // js/moves.js: the move it fires (a form's default until it is given another)
        if (mv && mv.fn) mv.fn(f);
    }
}
function _evoFoes(x, y, r) {
    const near = typeof unitsNear === "function" ? unitsNear(x, r) : actors;
    return near.filter(a => a && !a.dead && typeof isHostileTarget === "function" && isHostileTarget(a) && Math.hypot(a.x - x, a.y - y) <= r);
}
// SIGHT FOR EVERY MOVE (Milestone Two; docs/COMBAT.md §8). A move that FLIES at an enemy (QUILL BURST, HEXFIRE) is aimed only at one the follower can see: a wall or a tall object would stop it
// (js/facility.js facilityShotStop). A move that STRIKES AT ONCE needs sight too (the owner, 2026-11-06: "Need sight"; nothing strikes through a wall or a tall object): it is used only on an enemy the
// follower can see, and what it reaches beyond that enemy (a chain's next jump, a splash, a pull, a slow, an area round the follower, a storm or a burning circle) is only what can be seen from where the
// strike comes. Cover does not stop such a strike: it does not travel. Sight passes over low objects (js/facilityplay.js facilitySeesFrom).
function _evoSees(x, y, a) { return typeof facilitySeesFrom !== "function" || facilitySeesFrom(x, y, a.x, a.y); }
function _evoSeen(f, foes) { return foes.filter(a => _evoSees(f.x, f.y, a)); }                         // (of these, the ones the follower sees)
function _evoFoesSeen(x, y, r) { return _evoFoes(x, y, r).filter(a => _evoSees(x, y, a)); }          // (the enemies within r of a point that can be seen from it)
// SONIC ROLL's dash puts the body where it ends: only along floor it could walk in a straight line (the walking test, as PINBALL rolls), so never through a wall nor over an object (stepping over: "Not yet")
function _evoDashOk(f, a) { if (typeof facilityLosFrom !== "function") return true; const dx = a.x - f.x, dy = a.y - f.y, L = Math.hypot(dx, dy) || 1, s = Math.max(0, L - 0.8); return facilityLosFrom(f.x, f.y, f.x + dx / L * s, f.y + dy / L * s); }
// PETAL BLAZE: a ring of fire from the opened petals. True when it fired.
function petalBlaze(f) {
    const foes = _evoFoesSeen(f.x, f.y, BLOOM_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * BLOOM_MULT, f, "fire", false, false, DMG_HIT_ALT);
        a.burning = Math.max(a.burning || 0, BLOOM_BURN); a.burnDamage = Math.max(a.burnDamage || 0, (f.power || 10) * 0.1);
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("petal_blaze");
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "fireShockwave", x: f.x, y: f.y, radius: BLOOM_RADIUS, life: 36, maxLife: 36 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#ff6622", radius: BLOOM_RADIUS * 0.7, life: 26 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: (evolvedDef(f) || {}).move || "PETAL BLAZE", color: "#ff8844", life: 50, vy: -0.06, size: 10 });
    return true;
}
// QUILL BURST (the Quillstone's; the owner's brief, 2026-11-02, docs/FOLLOWER-COMBAT-REDESIGN.md §2.2): QUILL_COUNT crystal quills launched AT ONCE in a forward fan, QUILL_FAN degrees edge to edge,
// the middle one at the nearest enemy in reach. Each is a follower shot of its own (js/clone.js spawnFollowerProjectile; moved and hit in js/game.js): it flies straight on for QUILL_RANGE
// tiles and stops at the FIRST enemy it touches, which takes it; it pierces nothing, and nothing explodes or splashes. A cluster can catch several quills; spread-out enemies few. Nothing
// is rolled. (It was one volley with a hit chance and a splash: superseded.) True when it fired.
function quillBurst(f) {
    const foes = _evoSeen(f, _evoFoes(f.x, f.y, QUILL_RANGE));
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const t = foes[0], f0 = typeof frame !== "undefined" ? frame : 0, a0 = Math.atan2(t.y - f.y, t.x - f.x), dmg = (f.power || 10) * QUILL_MULT;
    const gap = QUILL_COUNT > 1 ? (QUILL_FAN * Math.PI / 180) / (QUILL_COUNT - 1) : 0;
    if (typeof spawnFollowerProjectile === "function") for (let i = 0; i < QUILL_COUNT; i++) {
        const a = a0 + (i - (QUILL_COUNT - 1) / 2) * gap;   // (the middle one straight at the enemy)
        spawnFollowerProjectile(f, { x: f.x + Math.cos(a) * QUILL_RANGE, y: f.y + Math.sin(a) * QUILL_RANGE }, "#ff7a2e", dmg, 4, null, DMG_HIT_ALT, { speed: QUILL_SPEED, range: QUILL_RANGE, kind: "quill" });
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("quill_burst");
    if (f.dirX !== undefined) { f.dirX = Math.cos(a0); f.dirY = Math.sin(a0); }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "QUILL BURST", color: "#ff8844", life: 50, vy: -0.06, size: 10 });
    return true;
}
// ARC VOLLEY: a charged arc into the nearest enemy in range, jumping on. True when it fired.
function arcVolley(f) {
    const foes = _evoFoesSeen(f.x, f.y, REAVER_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const hits = [foes[0]], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(foes[0], (f.power || 10) * REAVER_MULT, f, "electric", false, false, DMG_HIT_ALT);
    let from = foes[0];
    for (let i = 0; i < REAVER_CHAIN; i++) {
        const next = _evoFoesSeen(from.x, from.y, REAVER_HOP).filter(a => !hits.includes(a))
            .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
        if (!next) break;
        applyDamage(next, (f.power || 10) * REAVER_MULT * REAVER_CHAIN_SHARE, f, "electric", false, false, DMG_HIT_ALT);
        hits.push(next); from = next;
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("arc_volley");
    f._arcPts = hits.map(a => ({ x: a.x, y: a.y })); f._arcUntil = f0 + 20;
    if (f.dirX !== undefined) { const dx = foes[0].x - f.x, dy = foes[0].y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") for (const a of hits) elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffee33", radius: 0.5, life: 18 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "ARC VOLLEY", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}

// SINGULARITY SHOT: a gravity round into the nearest enemy in range; whatever is
// round it is dragged in and slowed. True when it fired.
function singularityShot(f) {
    const foes = _evoFoesSeen(f.x, f.y, SERPENT_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * SERPENT_MULT, f, "flux", false, false, DMG_HIT_ALT);
    let pulled = 0;
    for (const a of _evoFoesSeen(tgt.x, tgt.y, SERPENT_PULL_R)) {
        if (typeof applySlow === "function") applySlow(a, SERPENT_SLOW_FRAMES, SERPENT_SLOW);
        if (a === tgt || (typeof vortexPullImmune === "function" && vortexPullImmune(a))) continue;
        const _px = a.x, _py = a.y; a.x += (tgt.x - a.x) * SERPENT_PULL; a.y += (tgt.y - a.y) * SERPENT_PULL; pulled++;
        if (typeof techShieldKeep === "function") techShieldKeep(a, _px, _py);   // (not through a Photonic Shield: js/techabilities.js)
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("singularity_shot");
    f._arcPts = [{ x: tgt.x, y: tgt.y }]; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcCol = [187, 102, 255];
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: SERPENT_PULL_R, color: "#bb66ff", life: 40 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#bb66ff", radius: 0.7, life: 24 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "SINGULARITY", color: "#cc88ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// HEXFIRE (the Ember Hood's, and the retired Cinder Halo's; the owner's brief, 2026-11-02, docs/FOLLOWER-COMBAT-REDESIGN.md §2.3): a fire projectile at the nearest enemy in reach. Where it
// lands (on the first enemy it touches, or where it was aimed when nothing was in the way) it leaves a STATIONARY BURNING CIRCLE: an element effect (js/elements.js updateElementEffects),
// HALO_RADIUS tiles across its middle, HALO_LIFE frames. Every enemy in it is bitten as it lands and every HALO_TICK frames after. It never grows and never moves, and it hurts enemies only
// (FIRE BOMBS' burning ground hurts everyone). The projectile itself does no damage: FIREBALL is the direct hit, HEXFIRE the area denial. A new circle takes the place of the same Ember
// Hood's last one (no stacking). (It was six instant rounds that set their targets burning: superseded.) True when it fired.
function hexfire(f) {
    const foes = _evoSeen(f, _evoFoes(f.x, f.y, HALO_RANGE));
    if (!foes.length || typeof spawnFollowerProjectile !== "function") return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const t = foes[0], f0 = typeof frame !== "undefined" ? frame : 0, dx = t.x - f.x, dy = t.y - f.y, L = Math.hypot(dx, dy) || 1;
    let landed = false;
    const land = (x, y) => { if (landed) return; landed = true; hexfireCircle(f, x, y); };   // (once: a shot can touch an enemy the frame it runs out)
    const p = spawnFollowerProjectile(f, t, "#ff5a1f", 0, 5, a => land(a.x, a.y), DMG_HIT_ALT, { range: L, kind: "hex" });
    if (p) p.onLand = () => land(p.x, p.y);
    f._sigAt = f0; f._sigCd = moveWindupFrames("hexfire");
    f.dirX = dx / L; f.dirY = dy / L;
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "HEXFIRE", color: "#ff8844", life: 50, vy: -0.06, size: 10 });
    return true;
}
function magmaVent(f) {
    const foes = _evoFoesSeen(f.x, f.y, MAGMA_RANGE);
    if (!foes.length || typeof elementEffects === "undefined") return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const t = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    for (let i = elementEffects.length - 1; i >= 0; i--) if (elementEffects[i].type === "magmavent" && elementEffects[i].by === f) elementEffects.splice(i, 1);   // (its last vent closes)
    const e = { type: "magmavent", x: t.x, y: t.y, radius: MAGMA_RADIUS, life: MAGMA_LIFE, maxLife: MAGMA_LIFE, by: f, bite: (f.power || 10) * MAGMA_BITE, element: "fire" };
    elementEffects.push(e); fieldBite(e, "fire");   // (the first burst as it opens)
    f._sigAt = f0; f._sigCd = moveWindupFrames("magma_vent"); const dx = t.x - f.x, dy = t.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L;
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "MAGMA VENT", color: "#ff7a2a", life: 50, vy: -0.06, size: 10 });
    return true;
}
// The circle where a HEXFIRE lands: the same Ember Hood's last circle goes, and every enemy in the new one is bitten at once. Returns the circle.
function hexfireCircle(f, x, y) {
    if (typeof elementEffects === "undefined") return null;
    for (let i = elementEffects.length - 1; i >= 0; i--) if (elementEffects[i].type === "hexfire" && elementEffects[i].by === f) elementEffects.splice(i, 1);
    const e = { type: "hexfire", x, y, radius: HALO_RADIUS, life: HALO_LIFE, maxLife: HALO_LIFE, by: f, bite: (f.power || 10) * HALO_BITE, element: "fire" };
    elementEffects.push(e);
    fieldBite(e, "fire");
    return e;
}
// A stationary field's bite (HEXFIRE's circle, STATIC VORTEX): every enemy inside it takes the field's bite from the follower that made it, through the damage system as that follower's move (DMG_HIT_ALT)
function fieldBite(e, el) {
    if (typeof actors === "undefined" || typeof isHostileTarget !== "function") return;
    const r2 = e.radius * e.radius;
    for (const a of actors) { if (!a || !isHostileTarget(a)) continue; const dx = a.x - e.x, dy = a.y - e.y; if (dx * dx + dy * dy <= r2 && _evoSees(e.x, e.y, a)) applyDamage(a, e.bite, e.by || null, el, false, false, DMG_HIT_ALT); }   // (only what can be seen from its middle: "Need sight")
}

// CORRODE SHOT: one long shot that eats the target's armour, splashing weaker corrosion round it. True when it fired.
function corrodeShot(f) {
    const foes = _evoFoesSeen(f.x, f.y, ROT_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * ROT_MULT, f, "toxic", false, false, DMG_HIT_ALT);
    tgt.defenseShredded = Math.max(tgt.defenseShredded || 0, ROT_SHRED_FRAMES); tgt.defenseShredFactor = Math.min(tgt.defenseShredFactor || 1, ROT_SHRED);
    for (const a of _evoFoesSeen(tgt.x, tgt.y, ROT_SPLASH_R)) {
        if (a === tgt) continue;
        a.defenseShredded = Math.max(a.defenseShredded || 0, ROT_SPLASH_FRAMES); a.defenseShredFactor = Math.min(a.defenseShredFactor || 1, ROT_SPLASH_SHRED);
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("corrode_shot");
    f._arcPts = [{ x: tgt.x, y: tgt.y }]; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcFan = false; f._arcCol = [120, 255, 110];
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: ROT_SPLASH_R, color: "#66ff66", life: 36 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#66ff66", radius: 0.6, life: 22 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "CORRODE", color: "#88ff88", life: 50, vy: -0.06, size: 10 });
    return true;
}

// CHOMP: the fangs slam down on the nearest enemy: ice damage and frozen stiff; those beside it are slowed. True when it fired.
function chomp(f) {
    const foes = _evoFoesSeen(f.x, f.y, MAW_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * MAW_MULT, f, "ice", false, false, DMG_HIT_ALT);
    tgt.hitStun = Math.max(tgt.hitStun || 0, MAW_STUN);
    if (typeof applyStun === "function") applyStun(tgt, MAW_STUN);   // (hitStun is read by nothing: the stun is real now, js/combat.js applyStun)
    for (const a of _evoFoesSeen(tgt.x, tgt.y, MAW_SLOW_R)) if (typeof applySlow === "function") applySlow(a, MAW_SLOW_FRAMES, MAW_SLOW);
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    f._sigAt = f0; f._sigCd = moveWindupFrames("chomp");
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: MAW_SLOW_R, color: "#9fe8ff", life: 36 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#cff4ff", radius: 0.7, life: 24 });
    }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "CHOMP", color: "#bdf0ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// ERUPTION: the crater bursts over everything close: toxic damage and eaten armour. True when it fired.
function eruption(f) {
    const foes = _evoFoesSeen(f.x, f.y, CALDERA_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * CALDERA_MULT, f, "toxic", false, false, DMG_HIT_ALT);
        a.defenseShredded = Math.max(a.defenseShredded || 0, CALDERA_SHRED_FRAMES); a.defenseShredFactor = Math.min(a.defenseShredFactor || 1, CALDERA_SHRED);
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("eruption");
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: f.x, y: f.y, radius: CALDERA_RADIUS, color: "#66ff66", life: 40 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#66ff66", radius: CALDERA_RADIUS * 0.6, life: 24 });
    }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "ERUPTION", color: "#88ff88", life: 50, vy: -0.06, size: 10 });
    return true;
}

// GRAVITY SLAM: flatten and slam, hitting, shoving and slowing everything close. True when it fired.
function gravitySlam(f) {
    const foes = _evoFoesSeen(f.x, f.y, MIMIC_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * MIMIC_MULT, f, "flux", false, false, DMG_HIT_ALT);
        if (typeof applySlow === "function") applySlow(a, MIMIC_SLOW_FRAMES, MIMIC_SLOW);
        if (typeof vortexPullImmune === "function" && vortexPullImmune(a)) continue;
        const dx = a.x - f.x, dy = a.y - f.y, L = Math.hypot(dx, dy) || 1, _px = a.x, _py = a.y;
        a.x += dx / L * MIMIC_PUSH; a.y += dy / L * MIMIC_PUSH;
        if (typeof techShieldKeep === "function") techShieldKeep(a, _px, _py);   // (not through a Photonic Shield: js/techabilities.js)
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("gravity_slam");
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: f.x, y: f.y, radius: MIMIC_RADIUS, color: "#bb66ff", life: 40 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#bb66ff", radius: MIMIC_RADIUS * 0.6, life: 24 });
    }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "GRAVITY SLAM", color: "#cc88ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// SONIC ROLL (it was STATIC RUSH: the owner, 2026-11-02, "STATIC RUSH" is the SONIC ROLL that "already exists"; renamed, and kept as it is): dash to the nearest enemy in range, hit it,
// shock two more; all stunned. Its id stays static_rush (a follower's saved choice). True when it fired.
function staticRush(f) {
    const foes = _evoFoesSeen(f.x, f.y, MANTA_RANGE).filter(a => _evoDashOk(f, a));
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    const from = { x: f.x, y: f.y }, dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1, stop = Math.max(0, L - 0.8);
    f.x += dx / L * stop; f.y += dy / L * stop; f.dirX = dx / L; f.dirY = dy / L;
    const hits = [tgt];
    applyDamage(tgt, (f.power || 10) * MANTA_MULT, f, "electric", false, false, DMG_HIT_ALT); tgt.hitStun = Math.max(tgt.hitStun || 0, MANTA_STUN); if (typeof applyStun === "function") applyStun(tgt, MANTA_STUN);
    let last = tgt;
    for (let i = 0; i < MANTA_CHAIN; i++) {
        const next = _evoFoesSeen(last.x, last.y, MANTA_HOP).filter(a => !hits.includes(a))
            .sort((a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y))[0];
        if (!next) break;
        applyDamage(next, (f.power || 10) * MANTA_MULT * MANTA_CHAIN_SHARE, f, "electric", false, false, DMG_HIT_ALT); next.hitStun = Math.max(next.hitStun || 0, MANTA_STUN); if (typeof applyStun === "function") applyStun(next, MANTA_STUN);
        hits.push(next); last = next;
    }
    f._sigAt = f0; f._sigCd = moveWindupFrames("static_rush");
    f._arcPts = hits.map(a => ({ x: a.x, y: a.y })); f._arcUntil = f0 + 20; f._arcStraight = false; f._arcCol = [255, 238, 51];
    if (typeof elementEffects !== "undefined") for (const a of hits) elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffee33", radius: 0.5, life: 18 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "SONIC ROLL", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}

// PINBALL (the Static Orb's second move, picked on its INFO tab; the owner's brief, 2026-11-02, docs/FOLLOWER-COMBAT-REDESIGN.md §2.5): an automatic ricochet. It rolls into the nearest
// enemy in reach; on each collision it picks the nearest enemy it has NOT hit this time within PIN_HOP of where it is and rolls into that; it goes on while one is that near. No fixed count:
// each enemy is hit at most once a PINBALL, so it always ends, and it ends cleanly (it also stops at a wall, after PIN_MAX_FRAMES or PIN_MAX_DIST tiles rolled, when it falls, is thrown or
// is told to RETREAT). It ROLLS between them: it is moved PIN_SPEED tiles a frame (pinballStep, from js/npc.js updateNPC), never put there, so it goes no farther than the floor lets it and
// only at what it can see. SONIC ROLL is the one direct dash; PINBALL the chain of collisions. True when it set off.
function _pinSees(f, a) { return typeof facilityLosFrom !== "function" || facilityLosFrom(f.x, f.y, a.x, a.y); }
function _pinNext(f, r, hit) {   // the nearest enemy it has not hit, within r of where it is, that it can see
    let best = null, bd = Infinity;
    for (const a of _evoFoes(f.x, f.y, r)) { if (hit.indexOf(a) >= 0 || !_pinSees(f, a)) continue; const d = Math.hypot(a.x - f.x, a.y - f.y); if (d < bd) { bd = d; best = a; } }
    return best;
}
function pinball(f) {
    if (f._pinball) return false;
    const t = _pinNext(f, PIN_RANGE, []);
    if (!t) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    f._pinball = { t, hit: [], t0: f0, run: 0 };
    f._sigAt = f0; f._sigCd = moveWindupFrames("pinball");   // (and again when it stops: its wait counts from the end of a roll)
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "PINBALL", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}
// a frame of the roll (js/npc.js updateNPC, before the unit's own moves): true while it rolls (nothing else moves it this frame), false once it has stopped
function pinballStep(f) {
    const P = f._pinball; if (!P) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    const stop = () => { f._pinball = null; f._sigCd = moveWindupFrames("pinball"); return false; };
    if (f.dead || f._flight || f.returningToCrystal || f.retreatUntil > f0 || f0 - P.t0 > PIN_MAX_FRAMES || P.run >= PIN_MAX_DIST) return stop();
    if (!P.t || P.t.dead || !isHostileTarget(P.t)) { P.t = _pinNext(f, P.hit.length ? PIN_HOP : PIN_RANGE, P.hit); if (!P.t) return stop(); }   // (it was killed before it got there: the next one from here)
    const t = P.t, dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1e-6;
    if (d <= PIN_TOUCH) {   // THE COLLISION
        applyDamage(t, (f.power || 10) * PIN_MULT, f, "electric", false, false, DMG_HIT_ALT);
        P.hit.push(t); f._sigAt = f0;
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#ffee33", radius: 0.5 + Math.min(4, P.hit.length) * 0.1, life: 18 });   // (brighter with every collision)
        if (typeof shake !== "undefined") shake = Math.max(shake || 0, 1.5);
        P.t = _pinNext(f, PIN_HOP, P.hit);
        return P.t ? true : stop();
    }
    const step = Math.min(PIN_SPEED, PIN_MAX_DIST - P.run, Math.max(0.02, d - PIN_TOUCH * 0.5)), nx = f.x + dx / d * step, ny = f.y + dy / d * step;
    if ((typeof facilityStandOk === "function" && !facilityStandOk(nx, ny)) || (typeof facilityLosFrom === "function" && !facilityLosFrom(f.x, f.y, nx, ny))) return stop();   // a wall: it stops there
    f.x = nx; f.y = ny; f.dirX = dx / d; f.dirY = dy / d; P.run += step;
    return true;
}

// under the floor (BURROW STRIKE's travel: js/combat.js; FAULTLINE's: js/techabilities.js): its dive and its mound. 0 above, rising to 1 while it dives; 1 under the floor; null when it is not burrowing
function burrowerDepth(f) {
    const f0 = typeof frame !== "undefined" ? frame : 0, B = f && (f._burrow || f._fault);
    if (!B) return null;
    if (B.phase === "dive") return Math.max(0, Math.min(1, (f0 - B.t0) / Math.max(1, B.dive || BURROW_DIVE)));
    return 1;
}

// CHAIN LIGHTNING (the Thunderhead's everyday shot; the owner, 2026-11-02, "Its everyday shot"; docs/FOLLOWER-COMBAT-REDESIGN.md §2.6): the Mages' shot (js/npc.js), and from the enemy it strikes the
// electricity conducts on, jump by jump, to the nearest enemy not yet struck within CHAIN_HOP of the last; each jump does CHAIN_SHARE of the one before. Distance decides it: a close cluster
// carries it far, a gap wider than CHAIN_HOP breaks it. No fixed cap: it ends when no enemy is near enough or a jump would do under CHAIN_MIN (each enemy once, so it always ends).
// `dmg` is the shot's. Returns the number of jumps.
function chainLightning(f, first, dmg) {
    if (!first) return 0;
    const hit = [first], pts = [{ x: first.x, y: first.y }];
    let from = first, d = dmg * CHAIN_SHARE;
    while (d >= CHAIN_MIN) {
        let next = null, bd = Infinity;
        for (const a of _evoFoesSeen(from.x, from.y, CHAIN_HOP)) { if (hit.indexOf(a) >= 0) continue; const k = Math.hypot(a.x - from.x, a.y - from.y); if (k < bd) { bd = k; next = a; } }
        if (!next) break;
        applyDamage(next, d, f, null, false, false, DMG_HIT_SHOT);   // (as the shot: the Mages' shot's type and stat)
        hit.push(next); pts.push({ x: next.x, y: next.y }); from = next; d *= CHAIN_SHARE;
    }
    if (pts.length > 1 && typeof elementEffects !== "undefined") elementEffects.push({ type: "chainBolt", pts, color: "#ffee33", life: 18, maxLife: 18 });
    return hit.length - 1;
}
// The everyday shot's own effect (js/npc.js, the Mages' shot): the Thunderhead's CHAIN LIGHTNING conducts on from the enemy it strikes; any other form's shot (the Ember Hood's FIREBALL too) is the plain shot
function evoShotOnHit(f, dmg) { const d = f && f.evolved ? evolvedDef(f) : null; return d && d.shot === "CHAIN LIGHTNING" ? (a => chainLightning(f, a, dmg)) : null; }

// STATIC VORTEX (the Thunderhead's move; the owner's brief, 2026-11-02, docs/FOLLOWER-COMBAT-REDESIGN.md §2.6): a STATIONARY electrical storm on the nearest enemy in reach. It does not travel.
// Every enemy in it is pulled toward its middle, VORTEX_PULL tiles a frame (not a beetle or a boss: vortexPullImmune), and takes electric damage every VORTEX_TICK frames, until it runs out after
// VORTEX_LIFE frames. The pull is a knock's own step (js/combat.js updateStatusEffects: kbVX/kbVY), so it goes no farther than the walls and a Photonic Shield let it. An element effect
// (js/elements.js updateElementEffects). It gathers them; CHAIN LIGHTNING conducts through the cluster it makes. True when it fired.
function staticVortex(f) {
    const foes = _evoFoesSeen(f.x, f.y, VORTEX_RANGE);
    if (!foes.length || typeof elementEffects === "undefined") return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const t = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    elementEffects.push({ type: "staticVortex", x: t.x, y: t.y, radius: VORTEX_RADIUS, life: VORTEX_LIFE, maxLife: VORTEX_LIFE, by: f, bite: (f.power || 10) * VORTEX_MULT, element: "electric" });
    f._sigAt = f0; f._sigCd = moveWindupFrames("static_vortex");
    f._arcPts = [{ x: t.x, y: t.y }]; f._arcUntil = f0 + 20; f._arcStraight = false; f._arcFan = false; f._arcCol = [255, 238, 51];   // (a bolt to where it is cast)
    { const dx = t.x - f.x, dy = t.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "STATIC VORTEX", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}
// a frame of a STATIC VORTEX (js/elements.js updateElementEffects): the pull, and the bite every VORTEX_TICK frames
function staticVortexTick(e) {
    if (typeof actors === "undefined" || typeof isHostileTarget !== "function") return;
    const R = e.radius, age = e.maxLife - e.life;
    for (const a of actors) {
        if (!a || !isHostileTarget(a)) continue;
        const dx = e.x - a.x, dy = e.y - a.y, d = Math.hypot(dx, dy);
        if (d > R || !_evoSees(e.x, e.y, a)) continue;   // (not through a wall or a tall object: "Need sight")
        if (d > 0.3 && !(typeof vortexPullImmune === "function" && vortexPullImmune(a))) {
            const v = Math.min(VORTEX_PULL, d - 0.3);   // (in toward the middle, never past it)
            if (Math.hypot(a.kbVX || 0, a.kbVY || 0) < v) { a.kbVX = dx / d * v; a.kbVY = dy / d * v; }   // (a stronger knock is left as it is)
        }
    }
    if (age > 0 && age % VORTEX_TICK === 0 && e.life > 0) fieldBite(e, "electric");
}
// ── THE LOOK ───────────────────────────────────────────────
function _evoImg(d) {
    if (d._img !== undefined) { const e = d._img; if (e && e.complete && e.naturalWidth) return e; if (e && typeof startupWant === "function") startupWant(e); return null; }   // (a sheet that has not arrived: the start screen is told: js/init.js)
    d._img = null;
    if (typeof Image === "undefined") return null;
    const im = new Image();
    im.onload = () => { d._img = im; };
    im.src = d.sheet + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    d._img = im; if (typeof startupAsset === "function") startupAsset(im, "evo/" + d.id);
    return null;
}
function _evoGroundImg(d) {
    if (!d.ground) return null;
    if (d._gimg !== undefined) { const e = d._gimg; if (e && e.complete && e.naturalWidth) return e; if (e && typeof startupWant === "function") startupWant(e); return null; }
    d._gimg = null;
    if (typeof Image === "undefined") return null;
    const im = new Image();
    im.onload = () => { d._gimg = im; };
    im.src = d.ground + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    d._gimg = im; if (typeof startupAsset === "function") startupAsset(im, "evo/" + d.id + "-ground");
    return null;
}
// Which frame of its sheets it is on, how big, and how far out of the egg: the body and its ground layer share this.
function _evoFrame(f, d, f0) {
    const m = f0 - (f._moltAt === undefined ? -1e9 : f._moltAt);
    const u = Math.min(1, (m - EVO_MOLT * 0.3) / (EVO_MOLT * 0.7));
    const rise = m < EVO_MOLT ? 1 - Math.pow(1 - u, 3) : 1;
    const sigK = f._sigAt !== undefined ? (f0 - f._sigAt) / EVO_ACT_FRAMES : 9;
    let col = Math.floor(f0 / 7) % 8;
    if (sigK >= 0 && sigK < 1) col = 8 + Math.min(7, Math.floor(sigK * 8));
    else if (f.state === "attack") col = 8 + Math.min(7, Math.floor(((f.attackAnim || 0) / Math.PI) * 8));
    return { m, rise, sigK, col, row: _evoFacing(f), s: EVO_SCALE * (0.6 + 0.4 * rise) };
}
function _evoFacing(f) {
    const a = Math.atan2(f.dirY || 0, f.dirX === undefined ? 1 : f.dirX);
    return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}
// Draw it, if it is an evolved follower out of (or coming out of) the egg.
// False: draw the egg as usual (before it has cracked open, or if the sheet
// has not loaded).
// UNDER THE FLOOR (BURROW STRIKE, FAULTLINE: burrowerDepth): while it dives it sinks into the floor (what goes below the floor is not drawn) as a mound rises; under it only the mound shows
function drawEvolvedFollower(f, px, py, g) {
    const dep = typeof burrowerDepth === "function" ? burrowerDepth(f) : null;
    if (dep === null) return _drawEvolvedBody(f, px, py, g);
    if (dep >= 1) { _drawBurrowMound(f, px, py, g, 1); return true; }
    g.save(); g.beginPath(); g.rect(px - 90, py - 230, 180, 232); g.clip(); g.translate(0, dep * 36);
    let drawn = false; try { drawn = _drawEvolvedBody(f, px, py, g); } finally { g.restore(); }
    _drawBurrowMound(f, px, py, g, dep);
    return drawn;
}
// a mound of dark earth with glowing cracks and embers, `k` of its full size (a frame's few strokes; nothing made)
function _drawBurrowMound(f, px, py, g, k) {
    const f0 = typeof frame !== "undefined" ? frame : 0, w = (20 + Math.sin(f0 * 0.4 + f.x * 3) * 2.5) * (0.35 + 0.65 * k), cy = py + 2;
    g.save();
    g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(px, cy + 2, w * 1.2, w * 0.45, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#3a2a1c"; g.beginPath(); g.ellipse(px, cy, w, w * 0.5, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#5a4326"; g.beginPath(); g.ellipse(px - w * 0.15, cy - w * 0.08, w * 0.6, w * 0.28, 0, Math.PI, 0); g.fill();
    g.strokeStyle = "rgba(255,110,40," + (0.55 + 0.35 * Math.sin(f0 * 0.3)) + ")"; g.lineWidth = 1.5; g.beginPath();
    g.moveTo(px - w * 0.5, cy - 2); g.lineTo(px - w * 0.15, cy - w * 0.3); g.lineTo(px + w * 0.1, cy - w * 0.12);
    g.moveTo(px + w * 0.2, cy - w * 0.36); g.lineTo(px + w * 0.5, cy - 3);
    g.stroke();
    g.fillStyle = "#ff9a4a";
    for (let i = 0; i < 3; i++) { const a = f0 * 0.22 + i * 2.1, ex = px + Math.cos(a) * w * 0.7, ey = cy - 6 - Math.abs(Math.sin(f0 * 0.2 + i)) * 9 * k; g.beginPath(); g.arc(ex, ey, 1.8, 0, Math.PI * 2); g.fill(); }
    g.restore();
}
function _drawEvolvedBody(f, px, py, g) {
    const d = evolvedDef(f); if (!d) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0, m = f0 - (f._moltAt === undefined ? -1e9 : f._moltAt);
    if (m < EVO_MOLT * 0.3) return false;                 // still the egg, shaking (the overlay cracks it)
    const img = _evoImg(d); if (!img) return false;
    const col = d.color || (d.element === "fire" ? "#ff5a1f" : d.element === "flux" ? "#bb66ff" : "#ffee33");
    const fr = _evoFrame(f, d, f0), rise = fr.rise, sigK = fr.sigK, s = fr.s;
    g.save();
    if (f._fade !== undefined) g.globalAlpha *= f._fade;   // (a searcher in the website's background fades out as it goes: js/attract.js)
    // its shadow (a form with a pool of its own stands in that: see GROUND above)
    if (!d.ground) { g.fillStyle = "rgba(0,0,0,0.4)"; g.beginPath(); g.ellipse(px, py, 22 * rise, 9 * rise, 0, 0, Math.PI * 2); g.fill(); }
    const C = d.cell;
    g.globalAlpha *= rise;
    g.drawImage(img, fr.col * C, fr.row * C, C, C, px - d.anchor[0] * s, py - d.anchor[1] * s, C * s, C * s);
    // the reactor's glow (not the serpent's: its reactor sits in its head, which turns with it)
    if (d.noGlow) { g.restore(); return true; }
    const cx = px + (d.core[0] - d.anchor[0]) * s, cy = py + (d.core[1] - d.anchor[1]) * s;
    const pulse = 0.55 + 0.25 * Math.sin(f0 * 0.12) + (sigK >= 0 && sigK < 1 ? 0.6 * (1 - sigK) : 0);
    g.globalCompositeOperation = "lighter";
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 16);
    gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = Math.min(1, 0.5 * pulse * rise); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
    g.restore();
    return true;
}
// ── THE GROUND PASS ────────────────────────────────────────
// Once a frame, before the floor is drawn: who has a ground layer to paint.
let _evoGround = [];
function evoGroundBegin() {
    _evoGround = [];
    if (typeof followers === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const f of followers) {
        if (!f || f.dead || !f.evolved) continue;
        const d = evolvedDef(f); if (!d || !d.ground) continue;
        if (f0 - (f._moltAt === undefined ? -1e9 : f._moltAt) < EVO_MOLT * 0.3) continue;   // still the egg
        _evoGround.push(f);
    }
}
// Called as the floor tile at (tx, ty), whose top corner is at (px, py), is drawn: paint this tile's share of every
// pool near it, clipped to the tile.
function drawEvoGroundOnTile(tx, ty, px, py, g) {
    if (!_evoGround.length || typeof player === "undefined") return;
    g = g || ctx;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const f of _evoGround) {
        if (Math.abs(f.x - tx - 0.5) > 1.4 || Math.abs(f.y - ty - 0.5) > 1.4) continue;
        const d = evolvedDef(f), img = d && _evoGroundImg(d); if (!img || !_evoImg(d)) continue;
        const fr = _evoFrame(f, d, f0), C = d.cell, s = fr.s;
        const fx = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width / 2, fy = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height / 2;
        g.save();
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + TILE_W, py + TILE_H); g.lineTo(px, py + 2 * TILE_H); g.lineTo(px - TILE_W, py + TILE_H); g.closePath(); g.clip();
        g.globalAlpha *= fr.rise;
        g.drawImage(img, fr.col * C, fr.row * C, C, C, fx - d.anchor[0] * s, fy - d.anchor[1] * s, C * s, C * s);
        g.restore();
    }
}

// Drawn over the follower: the egg cracking and bursting, and the Reaver's arcs.
function drawEvolvedOverlay(f, px, py, g) {
    const d = evolvedDef(f); if (!d) return;
    const f0 = typeof frame !== "undefined" ? frame : 0, m = f0 - (f._moltAt === undefined ? -1e9 : f._moltAt);
    g.save();
    if (m >= 0 && m < EVO_MOLT * 0.3) {          // cracks spreading over the glass
        const k = m / (EVO_MOLT * 0.3), n = Math.ceil(k * 6);
        const C = [[-3, -55, 2, -46, -1, -40], [6, -50, 3, -43, 7, -36], [-8, -44, -4, -38, -7, -31], [0, -57, 4, -52, 2, -47], [8, -42, 5, -36], [-5, -50, -9, -45]];
        g.strokeStyle = `rgba(255,255,255,${0.9 * k})`; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i < n; i++) { const c = C[i]; g.moveTo(px + c[0], py + c[1]); for (let j = 2; j < c.length; j += 2) g.lineTo(px + c[j], py + c[j + 1]); }
        g.stroke();
    } else if (m >= EVO_MOLT * 0.3 && m < EVO_MOLT) {   // the glass bursting and the legs falling
        const t = (m - EVO_MOLT * 0.3) / 60;
        for (let i = 0; i < 14; i++) {
            const a = i * 2.39996, v = 40 + (i % 5) * 14, x = px + Math.cos(a) * v * t, y = py - 42 + Math.sin(a) * v * 0.5 * t - 40 * t + 90 * t * t;
            const al = Math.max(0, 1 - t); if (al <= 0) continue;
            g.fillStyle = `rgba(210,232,255,${0.55 * al})`; g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 2.5, y + 2); g.lineTo(x - 2, y + 1.5); g.closePath(); g.fill();
        }
        g.strokeStyle = `rgba(8,8,8,${Math.max(0, 1 - t * 1.5)})`; g.lineWidth = 3; g.lineCap = "round"; g.beginPath();
        for (const [sx, ex] of [[-7, -16], [7, 16], [0, 2]]) { g.moveTo(px + sx, py - 28 + t * 30); g.lineTo(px + ex, py - 4 + t * 34); }
        g.stroke();
        if (t < 0.6) { g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - t / 0.6)})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(px, py - 40, 8 + t * 60, (8 + t * 60) * 0.45, 0, 0, Math.PI * 2); g.stroke(); }
    }
    // the Reaver's arc, from its reactor along the targets it hit
    if (f._arcUntil > f0 && f._arcPts && f._arcPts.length && typeof player !== "undefined") {
        const scr = p => [(p.x - player.visualX - (p.y - player.visualY)) * TILE_W + canvas.width / 2,
                          (p.x - player.visualX + (p.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - 26];
        const s = EVO_SCALE; let [x0, y0] = [px + (d.core[0] - d.anchor[0]) * s, py + (d.core[1] - d.anchor[1]) * s];
        const al = (f._arcUntil - f0) / 20;
        g.lineCap = "round"; g.lineJoin = "round";
        const RGB = f._arcCol || [255, 238, 51], jag = f._arcStraight ? 0 : 12;
        for (const p of f._arcPts) {
            const [x1, y1] = scr(p);
            for (const [w, c] of [[4, `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${0.35 * al})`], [1.6, `rgba(255,255,235,${al})`]]) {
                g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0);
                for (let k = 1; k < 6; k++) { const q = k / 6; g.lineTo(x0 + (x1 - x0) * q + (Math.random() - 0.5) * jag, y0 + (y1 - y0) * q + (Math.random() - 0.5) * jag); }
                g.lineTo(x1, y1); g.stroke();
            }
            if (!f._arcFan) { x0 = x1; y0 = y1; }   // a fan: every round leaves the reactor, none from the last target
        }
    }
    g.restore();
}
