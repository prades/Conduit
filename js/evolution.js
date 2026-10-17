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
//   MOVES  BUNKER BLOOM, PETAL BLAZE: with an enemy within BLOOM_RADIUS, every
//          BLOOM_EVERY frames its petals fly open in a ring of fire that hits
//          everything round it (BLOOM_MULT × its power) and sets it burning.
//          REAVER, ARC VOLLEY: with an enemy within REAVER_RANGE, every
//          REAVER_EVERY frames it fans its blades and fires a charged arc
//          (REAVER_MULT × its power) that jumps to REAVER_CHAIN more enemies.
//          HAMMER SLUG (the CORE BRAWLER, design No. 467: a slug with a hammerhead and bobbles at its tips,
//          a uniform hexagon tile cover either side of a spiked spine, a small horn) replaced the Aegis Warden
//          for new evolutions and casts the same AEGIS BURST (the Aegis Warden stays defined, marked legacy,
//          for followers already evolved into it).
//          AEGIS WARDEN (the old core brawler, No. 57), AEGIS BURST: with an enemy
//          within WARDEN_RADIUS, every WARDEN_EVERY frames its shells fly out in
//          a blast (WARDEN_MULT × its power) that shoves enemies back and gives
//          it and every ally round it a shield (WARDEN_SHIELD of max health).
//          STORM MANTA (the electric brawler, No. 68), STATIC RUSH: with an
//          enemy within MANTA_RANGE, every MANTA_EVERY frames it dashes to it,
//          hits it (MANTA_MULT × its power) and shocks two more near it; all
//          are stunned for a moment.
//          VOID HAULER (the FLUX WORKER, once the hover hauler, now design No. 689: a flux follower on worker
//          duty, not a role), HEAVY HAUL: it hauls neutralised lumps
//          HAULER_SPEED× as fast, picks them up from HAULER_REACH× as far, and
//          each delivery pays HAULER_PAY× the shards (js/mass.js asks evoHaul).
//          DYNAMO POD (the ELECTRIC WORKER, No. 71: an electric follower on
//          worker duty), RAPID DISCHARGE: it bleeds the charge off mass lumps
//          POD_RATE× as fast and from POD_REACH× as far, and walks to them
//          POD_SPEED× as fast (js/mass.js asks evoNeutralise).
//          SERPENT (the flux sniper, design No. 15), SINGULARITY SHOT: with an
//          enemy within SERPENT_RANGE, every SERPENT_EVERY frames it rears up
//          and fires a gravity round (SERPENT_MULT × its power) that DRAGS every
//          enemy within SERPENT_PULL_R of the target in towards it and slows
//          them. A beetle, a boss or a machine is too heavy to drag
//          (vortexPullImmune) and takes the hit only.
//          CINDER HALO (the FIRE SNIPER, design No. 90, the ring drone), HEXFIRE:
//          with an enemy within HALO_RANGE, every HALO_EVERY frames it fires
//          SIX rounds at once from the six crystals of its ring, one at each of
//          the nearest enemies in turn (all six into one if it is alone), each
//          HALO_MULT × its power and setting its target burning.
//          ROTSHARD (the TOXIC SNIPER, design No. 101, the crystal half eaten by its pool),
//          CORRODE SHOT: with an enemy within ROT_RANGE, every ROT_EVERY frames it
//          fires one long shot (ROT_MULT × its power) that eats the target's armour
//          (it takes 1 / ROT_SHRED × damage for ROT_SHRED_FRAMES) and splashes
//          the same corrosion, at half strength, over whatever is within ROT_SPLASH_R.
//          RIFT MIMIC (the FLUX BRAWLER, design No. 114, the Ditto-style blob with big black shards),
//          GRAVITY SLAM: with an enemy within MIMIC_RADIUS, every MIMIC_EVERY frames it
//          flattens and slams its weight down: everything within MIMIC_RADIUS takes
//          MIMIC_MULT × its power, is shoved MIMIC_PUSH back (a beetle, a boss or a machine
//          is too heavy to move) and slowed by MIMIC_SLOW for MIMIC_SLOW_FRAMES.
//          HORNSHELL (the CORE MAGE, design No. 220: a black shell-jar on its side dragged along the ground by
//          fat, irregular tentacles, a shard horn at its mouth) does the same AEGIS BLOOM as the Petal Aegis
//          below, which it replaced (the Petal Aegis stays defined, marked legacy, for followers already evolved into it).
//          QUILLSTONE (the FIRE BRAWLER, design No. 354: a pitch-black cut gem that crawls on little hidden
//          feet, red shards growing out of it, its two front spikes black like the shell), replaced the Bunker
//          Bloom for new evolutions and does the same ring of fire, called QUILL BURST (the Bunker Bloom
//          stays defined, marked legacy, for followers already evolved into it).
//          PETAL AEGIS (the old CORE MAGE, design No. 120: a rosette of plate-petals round a
//          crystal; the role is called a mage to the player, its id is still "sniper"),
//          AEGIS BLOOM: with an enemy within PETAL_RANGE, every PETAL_EVERY frames its petals
//          fan open: a bolt of core energy (PETAL_MULT × its power) into the nearest enemy,
//          and a shield (PETAL_SHIELD of max health) on whichever ally within PETAL_ALLY_R
//          is hurt worst (itself included), if its shield is lower than that.
//          SEEPER (the TOXIC BRAWLER, design No. 578: a black volcano walking on four pins,
//          goo oozing from its eye and flanks; it replaced the Caldera), ERUPTION: with an enemy within CALDERA_RADIUS, every
//          CALDERA_EVERY frames it hunkers and the crater bursts: everything within
//          CALDERA_RADIUS takes CALDERA_MULT × its power in toxic goo and has its armour
//          eaten (it takes 1 / CALDERA_SHRED × damage for CALDERA_SHRED_FRAMES).
//          WORM VESSEL (the CORE WORKER, design No. 144: a solid black jar on its side with a
//          thick glowing worm looking out of it; a core follower on worker duty), REWIRE: it
//          re-arms a downed pylon VESSEL_RATE× as fast, from VESSEL_REACH× as far, and walks to
//          it VESSEL_SPEED× as fast (js/mass.js asks evoRepair).
//          FROST MAW (the ICE BRAWLER, design No. 156: a dome of frosted shell with a cave
//          for a mouth and two crystal fangs inside), CHOMP: with an enemy within MAW_RANGE,
//          every MAW_EVERY frames the fangs slam down: the nearest enemy takes MAW_MULT × its
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
const BLOOM_RADIUS = 1.8, BLOOM_EVERY = 360, BLOOM_MULT = 2.0, BLOOM_BURN = 180;
const REAVER_RANGE = 6, REAVER_EVERY = 300, REAVER_MULT = 2.5, REAVER_CHAIN = 2, REAVER_HOP = 2.5, REAVER_CHAIN_SHARE = 0.6;
const SERPENT_RANGE = 6.5, SERPENT_EVERY = 330, SERPENT_MULT = 2.2, SERPENT_PULL_R = 2.2, SERPENT_PULL = 0.75, SERPENT_SLOW = 0.5, SERPENT_SLOW_FRAMES = 90;
const WARDEN_RADIUS = 2.2, WARDEN_EVERY = 360, WARDEN_MULT = 1.8, WARDEN_PUSH = 0.6, WARDEN_ALLY_R = 3.5, WARDEN_SHIELD = 0.35;
const MANTA_RANGE = 4, MANTA_EVERY = 300, MANTA_MULT = 2.4, MANTA_CHAIN = 2, MANTA_HOP = 2.2, MANTA_CHAIN_SHARE = 0.6, MANTA_STUN = 45;
const HALO_RANGE = 7, HALO_EVERY = 330, HALO_ROUNDS = 6, HALO_MULT = 0.8, HALO_BURN = 150;
const ROT_RANGE = 7, ROT_EVERY = 320, ROT_MULT = 2.2, ROT_SHRED = 0.4, ROT_SHRED_FRAMES = 360, ROT_SPLASH_R = 1.6, ROT_SPLASH_SHRED = 0.6, ROT_SPLASH_FRAMES = 180;
const MIMIC_RADIUS = 2.2, MIMIC_EVERY = 330, MIMIC_MULT = 1.9, MIMIC_PUSH = 0.5, MIMIC_SLOW = 0.5, MIMIC_SLOW_FRAMES = 90;
const PETAL_RANGE = 6.5, PETAL_EVERY = 330, PETAL_MULT = 1.8, PETAL_SHIELD = 0.35, PETAL_ALLY_R = 7;
const CALDERA_RADIUS = 2.4, CALDERA_EVERY = 330, CALDERA_MULT = 1.8, CALDERA_SHRED = 0.5, CALDERA_SHRED_FRAMES = 240;
const VESSEL_RATE = 3, VESSEL_REACH = 2, VESSEL_SPEED = 1.4;
const MAW_RANGE = 1.8, MAW_EVERY = 300, MAW_MULT = 2.4, MAW_STUN = 75, MAW_SLOW_R = 1.6, MAW_SLOW = 0.5, MAW_SLOW_FRAMES = 120;
const HAULER_SPEED = 1.5, HAULER_REACH = 2, HAULER_PAY = 2;
const POD_RATE = 3, POD_REACH = 2, POD_SPEED = 1.4;
const EVO_ACT_FRAMES = 40;         // how long a signature move plays its action frames

const EVOLUTIONS = {
    // LEGACY: the first fire brawler. New evolutions use the Quillstone; a follower already evolved into this keeps it.
    bloom:  { id: "bloom",  legacy: true, name: "BUNKER BLOOM", element: "fire",     role: "brawler", move: "PETAL BLAZE", sheet: "img/evo/bloom.png",
              cell: 144, anchor: [72, 114.2], core: [72, 74.6] },
    // LEGACY: the first electric mage. New evolutions use the Thunderhead; a follower already evolved into this keeps it.
    reaver: { id: "reaver", legacy: true, name: "REAVER", element: "electric", role: "sniper",  move: "ARC VOLLEY",  sheet: "img/evo/reaver.png",
              cell: 144, anchor: [72, 114.2], core: [72, 58.4] },
    // The ELECTRIC MAGE ("sniper" in the code), design No. 541: a smooth cloud of dark gas over a flickering glow, a crown of black spikes,
    // four glowing spikes circling its base and gas fins that ripple. The glow flickers, so its sheet carries its own light.
    thunderhead: { id: "thunderhead", name: "THUNDERHEAD", element: "electric", role: "sniper", move: "ARC VOLLEY", sheet: "img/evo/thunderhead.png",
              cell: 144, anchor: [72, 114.2], core: [72, 78.3], noGlow: true, color: "#ffee33" },
    // Its reactor is in its head, which moves with its facing: the sheet carries its own light.
    // LEGACY: the first flux mage. New evolutions use the Voidstar; a follower already evolved into this keeps it.
    serpent:{ id: "serpent", legacy: true, name: "SERPENT", element: "flux", role: "sniper", move: "SINGULARITY SHOT", sheet: "img/evo/serpent.png",
              cell: 144, anchor: [72, 114.2], core: [72, 61], noGlow: true, color: "#bb66ff" },
    // The FLUX ("void") MAGE, design No. 637: a dark spined starfish carrying a big orb of violet fluid with a diamond floating in it, held up by four thick claws. The diamond
    // turns and bubbles rise, so its sheet carries its own light.
    voidstar:{ id: "voidstar", name: "VOIDSTAR", element: "flux", role: "sniper", move: "SINGULARITY SHOT", sheet: "img/evo/voidstar.png",
              cell: 144, anchor: [72, 114.2], core: [72, 77], noGlow: true, color: "#bb66ff" },
    // LEGACY: the first core brawler. New evolutions use the Hammer Slug; a follower already evolved into this keeps it.
    warden: { id: "warden", legacy: true, name: "AEGIS WARDEN", element: "core",     role: "brawler", move: "AEGIS BURST",  sheet: "img/evo/warden.png",
              cell: 144, anchor: [72, 114.2], core: [72, 59], noGlow: true, color: "#33e6c4" },
    // LEGACY: the first electric brawler. New evolutions use the Prism Hood; a follower already evolved into this keeps it.
    manta:  { id: "manta",  legacy: true, name: "STORM MANTA",  element: "electric", role: "brawler", move: "STATIC RUSH",  sheet: "img/evo/manta.png",
              cell: 144, anchor: [72, 114.2], core: [72, 57], noGlow: true, color: "#ffee33" },
    // The FIRE SNIPER: a ring of six crystals, one round from each. Its ring turns, so its sheet carries its own light.
    // LEGACY: the first fire mage, whose design went to the electric brawler (the Volt Ring). A follower already evolved into this keeps it.
    halo:   { id: "halo",   legacy: true, name: "CINDER HALO", element: "fire", role: "sniper", move: "HEXFIRE", sheet: "img/evo/halo.png",
              cell: 144, anchor: [72, 114.2], core: [72, 53.7], noGlow: true, color: "#ff5a1f" },
    // The FIRE BRAWLER, design No. 354 (its separate antennae dropped, the two front spikes black like the shell): a pitch-black cut gem that crawls on
    // little hidden feet, red shards growing out of it. The quills sway, so its sheet carries its own light.
    quillstone:{ id: "quillstone", name: "QUILLSTONE", element: "fire", role: "brawler", move: "QUILL BURST", sheet: "img/evo/quillstone.png",
              cell: 144, anchor: [72, 114.2], core: [72, 85], noGlow: true, color: "#ff5a1f" },
    // The ICE BRAWLER: a dome with a cave mouth. Its rubble lies on the floor (the ground sheet), and the cave is its own light.
    maw:    { id: "maw",    name: "FROST MAW",    element: "ice",      role: "brawler", move: "CHOMP",        sheet: "img/evo/maw.png",
              cell: 144, anchor: [72, 114.2], core: [72, 93], noGlow: true, color: "#9fe8ff", ground: "img/evo/maw_g.png" },
    // The ELECTRIC BRAWLER, design No. 312: a black hollow pyramid hood over a diamond. The diamond turns, so its sheet carries its own light.
    // LEGACY: the first design of the electric brawler, which went to the fire mage (the Ember Hood). A follower already evolved into this keeps it.
    prism:  { id: "prism",  legacy: true, name: "PRISM HOOD", element: "electric", role: "brawler", move: "STATIC RUSH", sheet: "img/evo/prism.png",
              cell: 144, anchor: [72, 114.2], core: [72, 77], noGlow: true, color: "#ffee33" },
    // THE SWAP: the electric brawler and the fire mage traded designs ("I don't like the fire mage design, so we'll just have it there on the
    // electric as a placeholder"), each recoloured for its new element. Moves and roles stay with the slots.
    // The ELECTRIC BRAWLER, for now the ring drone (design No. 90) in electric yellow, a PLACEHOLDER. Its ring turns, so its sheet carries its own light.
    voltring:{ id: "voltring", name: "VOLT RING", element: "electric", role: "brawler", move: "STATIC RUSH", sheet: "img/evo/voltring.png",
              cell: 144, anchor: [72, 114.2], core: [72, 53.7], noGlow: true, color: "#ffee33" },
    // The FIRE MAGE ("sniper" in the code): the hooded pyramid with the hovering gems (design No. 391), recoloured for fire. The gems turn, so its sheet carries its own light.
    embercowl:{ id: "embercowl", name: "EMBER HOOD", element: "fire", role: "sniper", move: "HEXFIRE", sheet: "img/evo/embercowl.png",
              cell: 144, anchor: [72, 114.2], core: [72, 77], noGlow: true, color: "#ff5a1f" },
    // The CORE BRAWLER, design No. 467: a hammerheaded slug, a uniform hexagon tile cover either side of a spiked spine, a small horn. The tiles ripple, so the sheet carries its own light.
    hammerslug:{ id: "hammerslug", name: "HAMMER SLUG", element: "core", role: "brawler", move: "AEGIS BURST", sheet: "img/evo/hammerslug.png",
              cell: 144, anchor: [72, 114.2], core: [72, 99.5], noGlow: true, color: "#33e6c4" },
    // The CORE MAGE ("sniper" in the code), design No. 220: a black shell-jar dragged along the ground on its side by fat, irregular
    // tentacles, a shard horn at the mouth. The tentacles move, so its sheet carries its own light.
    hornshell:{ id: "hornshell", name: "HORNSHELL", element: "core", role: "sniper", move: "AEGIS BLOOM", sheet: "img/evo/hornshell.png",
              cell: 144, anchor: [72, 114.2], core: [72, 89.4], noGlow: true, color: "#33e6c4" },
    // The CORE WORKER (the pylon re-armer): a worker is a duty, so it comes from a core follower on worker duty. The worm moves, so the sheet carries its own light.
    vessel: { id: "vessel", name: "WORM VESSEL", element: "core",     duty: "worker",  move: "REWIRE",       sheet: "img/evo/vessel.png",
              cell: 144, anchor: [72, 114.2], core: [72, 52.6], noGlow: true, color: "#33e6c4" },
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
    petal:  { id: "petal",  legacy: true, name: "PETAL AEGIS",  element: "core",     role: "sniper",  move: "AEGIS BLOOM",  sheet: "img/evo/petal.png",
              cell: 144, anchor: [72, 114.2], core: [72, 66.5], color: "#33e6c4" },
    // The FLUX BRAWLER: a lump of liquid on the ground (a flux worker is the Hover Hauler instead: a worker is a duty). Its surface moves, so its sheet carries its own light.
    mimic:  { id: "mimic",  name: "RIFT MIMIC",   element: "flux",     role: "brawler", move: "GRAVITY SLAM", sheet: "img/evo/mimic.png",
              cell: 144, anchor: [72, 114.2], core: [72, 99], noGlow: true, color: "#bb66ff", ground: "img/evo/mimic_g.png" },
    // The TOXIC SNIPER: a crystal tilted in a pool that is eating it. The pool shifts, so its sheet carries its own light.
    rotshard:{ id: "rotshard", name: "ROTSHARD", element: "toxic", role: "sniper", move: "CORRODE SHOT", sheet: "img/evo/rotshard.png",
              cell: 144, anchor: [72, 114.2], core: [72, 68.3], noGlow: true, color: "#66ff66", ground: "img/evo/rotshard_g.png" },
    // The electric WORKER (the neutraliser): a worker is a duty, so it comes from an electric follower on worker duty.
    pod:    { id: "pod",    name: "DYNAMO POD",   element: "electric", duty: "worker",  move: "RAPID DISCHARGE", sheet: "img/evo/pod.png",
              cell: 144, anchor: [72, 114.2], core: [72, 58], noGlow: true, color: "#ffee33" },
    // The flux ("void") WORKER: no role of its own (a worker is a duty); it comes from a flux follower on worker duty. Design No. 689: a deep black
    // saucer on jagged-forearm bug legs, violet lights chasing round its rim (it was a hovering tank; the id stays "hauler", so saved followers keep it).
    hauler: { id: "hauler", name: "VOID HAULER", element: "flux",     duty: "worker",  move: "HEAVY HAUL",   sheet: "img/evo/hauler.png",
              cell: 144, anchor: [72, 114.2], core: [72, 84.8], noGlow: true, color: "#bb66ff" },
};
// Which egg grows into which machine.
function evolutionFor(f) {
    if (!f || !f.isFollower) return null;
    const role = f.role === "hybrid" ? "brawler" : f.role;
    // A follower on worker duty can only evolve into a worker form (and the other way round).
    const worker = f.duty === "worker";
    for (const k in EVOLUTIONS) { const d = EVOLUTIONS[k]; if (d.legacy || d.element !== f.element) continue; if (worker ? d.duty === "worker" : d.role === role) return d; }
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
        floatingTexts.push({ x: f.x, y: f.y - 1.4, text: "◆ EVOLVED · " + d.name, color: d.element === "fire" ? "#ffb066" : d.element === "toxic" ? "#99ff88" : "#fff27a", life: 150, vy: -0.05, size: 13 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 4);
    return true;
}
// Once a step, from render(): evolve anyone due, and run the signature moves.
function evolutionTick() {
    if (typeof followers === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const f of followers) {
        if (!f || f.dead) continue;
        if (!f.evolved) { if (f0 % 30 === 0 && !f._evoOnLevelUp) evoCheck(f); continue; }   // (one re-rolled to another element waits for its next level-up)
        const d = evolvedDef(f); if (!d) continue;
        if (d.role && f.role !== d.role) f.role = d.role;   // its role is fixed
        if (f0 - (f._moltAt || -1e9) < EVO_MOLT) continue;   // still coming out of the egg
        f._sigCd = (f._sigCd || 0) - 1;
        if (f._sigCd > 0) continue;
        if (d.id === "bloom" || d.id === "quillstone") petalBlaze(f); else if (d.id === "reaver" || d.id === "thunderhead") arcVolley(f); else if (d.id === "serpent" || d.id === "voidstar") singularityShot(f);
        else if (d.id === "warden" || d.id === "hammerslug") aegisBurst(f); else if (d.id === "manta" || d.id === "prism" || d.id === "voltring") staticRush(f); else if (d.id === "halo" || d.id === "embercowl") hexfire(f); else if (d.id === "rotshard") corrodeShot(f); else if (d.id === "mimic") gravitySlam(f); else if (d.id === "petal" || d.id === "hornshell") aegisBloom(f); else if (d.id === "caldera" || d.id === "seeper") eruption(f); else if (d.id === "maw") chomp(f);
    }
}
function _evoFoes(x, y, r) {
    const near = typeof unitsNear === "function" ? unitsNear(x, r) : actors;
    return near.filter(a => a && !a.dead && typeof isHostileTarget === "function" && isHostileTarget(a) && Math.hypot(a.x - x, a.y - y) <= r);
}
// PETAL BLAZE: a ring of fire from the opened petals. True when it fired.
function petalBlaze(f) {
    const foes = _evoFoes(f.x, f.y, BLOOM_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * BLOOM_MULT, f, "fire");
        a.burning = Math.max(a.burning || 0, BLOOM_BURN); a.burnDamage = Math.max(a.burnDamage || 0, (f.power || 10) * 0.1);
    }
    f._sigAt = f0; f._sigCd = BLOOM_EVERY;
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "fireShockwave", x: f.x, y: f.y, radius: BLOOM_RADIUS, life: 36, maxLife: 36 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#ff6622", radius: BLOOM_RADIUS * 0.7, life: 26 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: (evolvedDef(f) || {}).move || "PETAL BLAZE", color: "#ff8844", life: 50, vy: -0.06, size: 10 });
    return true;
}
// ARC VOLLEY: a charged arc into the nearest enemy in range, jumping on. True when it fired.
function arcVolley(f) {
    const foes = _evoFoes(f.x, f.y, REAVER_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const hits = [foes[0]], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(foes[0], (f.power || 10) * REAVER_MULT, f, "electric");
    let from = foes[0];
    for (let i = 0; i < REAVER_CHAIN; i++) {
        const next = _evoFoes(from.x, from.y, REAVER_HOP).filter(a => !hits.includes(a))
            .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
        if (!next) break;
        applyDamage(next, (f.power || 10) * REAVER_MULT * REAVER_CHAIN_SHARE, f, "electric");
        hits.push(next); from = next;
    }
    f._sigAt = f0; f._sigCd = REAVER_EVERY;
    f._arcPts = hits.map(a => ({ x: a.x, y: a.y })); f._arcUntil = f0 + 20;
    if (f.dirX !== undefined) { const dx = foes[0].x - f.x, dy = foes[0].y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") for (const a of hits) elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffee33", radius: 0.5, life: 18 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "ARC VOLLEY", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}

// SINGULARITY SHOT: a gravity round into the nearest enemy in range; whatever is
// round it is dragged in and slowed. True when it fired.
function singularityShot(f) {
    const foes = _evoFoes(f.x, f.y, SERPENT_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * SERPENT_MULT, f, "flux");
    let pulled = 0;
    for (const a of _evoFoes(tgt.x, tgt.y, SERPENT_PULL_R)) {
        if (typeof applySlow === "function") applySlow(a, SERPENT_SLOW_FRAMES, SERPENT_SLOW);
        if (a === tgt || (typeof vortexPullImmune === "function" && vortexPullImmune(a))) continue;
        a.x += (tgt.x - a.x) * SERPENT_PULL; a.y += (tgt.y - a.y) * SERPENT_PULL; pulled++;
    }
    f._sigAt = f0; f._sigCd = SERPENT_EVERY;
    f._arcPts = [{ x: tgt.x, y: tgt.y }]; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcCol = [187, 102, 255];
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: SERPENT_PULL_R, color: "#bb66ff", life: 40 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#bb66ff", radius: 0.7, life: 24 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "SINGULARITY", color: "#cc88ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// HEXFIRE: six rounds at once, shared out among the nearest enemies in range (one by one, round the list).
// True when it fired.
function hexfire(f) {
    const foes = _evoFoes(f.x, f.y, HALO_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const f0 = typeof frame !== "undefined" ? frame : 0, dmg = (f.power || 10) * HALO_MULT, pts = [];
    for (let i = 0; i < HALO_ROUNDS; i++) {
        const live = foes.filter(a => !a.dead);
        if (!live.length) break;
        const a = live[i % live.length];
        applyDamage(a, dmg, f, "fire");
        if (!a.dead) { a.burning = Math.max(a.burning || 0, HALO_BURN); a.burnDamage = Math.max(a.burnDamage || 0, (f.power || 10) * 0.08); }
        pts.push({ x: a.x, y: a.y, hex: i });
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ff6622", radius: 0.45, life: 18 });
    }
    f._sigAt = f0; f._sigCd = HALO_EVERY;
    f._arcPts = pts; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcFan = true; f._arcCol = [255, 110, 34];
    { const dx = foes[0].x - f.x, dy = foes[0].y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "HEXFIRE", color: "#ff8844", life: 50, vy: -0.06, size: 10 });
    return true;
}

// CORRODE SHOT: one long shot that eats the target's armour, splashing weaker corrosion round it. True when it fired.
function corrodeShot(f) {
    const foes = _evoFoes(f.x, f.y, ROT_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * ROT_MULT, f, "toxic");
    tgt.defenseShredded = Math.max(tgt.defenseShredded || 0, ROT_SHRED_FRAMES); tgt.defenseShredFactor = Math.min(tgt.defenseShredFactor || 1, ROT_SHRED);
    for (const a of _evoFoes(tgt.x, tgt.y, ROT_SPLASH_R)) {
        if (a === tgt) continue;
        a.defenseShredded = Math.max(a.defenseShredded || 0, ROT_SPLASH_FRAMES); a.defenseShredFactor = Math.min(a.defenseShredFactor || 1, ROT_SPLASH_SHRED);
    }
    f._sigAt = f0; f._sigCd = ROT_EVERY;
    f._arcPts = [{ x: tgt.x, y: tgt.y }]; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcFan = false; f._arcCol = [120, 255, 110];
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: ROT_SPLASH_R, color: "#66ff66", life: 36 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#66ff66", radius: 0.6, life: 22 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "CORRODE", color: "#88ff88", life: 50, vy: -0.06, size: 10 });
    return true;
}

// AEGIS BLOOM: a bolt into the nearest enemy in range, and a shield on the worst-hurt ally. True when it fired.
function aegisBloom(f) {
    const foes = _evoFoes(f.x, f.y, PETAL_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * PETAL_MULT, f, "core");
    // the ally to cover: lowest health fraction, itself included, whose shield is below what this gives
    let best = null, bestFrac = 2;
    const near = typeof unitsNear === "function" ? unitsNear(f.x, PETAL_ALLY_R) : actors;
    for (const a of near) {
        if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone) || Math.hypot(a.x - f.x, a.y - f.y) > PETAL_ALLY_R) continue;
        const cap = Math.round((a.maxHealth || 0) * PETAL_SHIELD), have = a.shielded ? (a.shieldAmount || 0) : 0;
        if (cap <= have) continue;
        const frac = (a.health || 0) / Math.max(1, a.maxHealth || 1);
        if (frac < bestFrac) { best = a; bestFrac = frac; }
    }
    if (best) {
        const cap = Math.round((best.maxHealth || 0) * PETAL_SHIELD);
        best.shielded = true; best.shieldAmount = cap; best._shieldMax = Math.max(best._shieldMax || 0, cap);
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: best.x, y: best.y, radius: 0.9, color: "#33e6c4", life: 36 });
    }
    f._sigAt = f0; f._sigCd = PETAL_EVERY;
    f._arcPts = [{ x: tgt.x, y: tgt.y }]; f._arcUntil = f0 + 20; f._arcStraight = true; f._arcFan = false; f._arcCol = [51, 230, 196];
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#33e6c4", radius: 0.6, life: 22 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "AEGIS BLOOM", color: "#66ffe0", life: 50, vy: -0.06, size: 10 });
    return true;
}

// CHOMP: the fangs slam down on the nearest enemy: ice damage and frozen stiff; those beside it are slowed. True when it fired.
function chomp(f) {
    const foes = _evoFoes(f.x, f.y, MAW_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    applyDamage(tgt, (f.power || 10) * MAW_MULT, f, "ice");
    tgt.hitStun = Math.max(tgt.hitStun || 0, MAW_STUN);
    for (const a of _evoFoes(tgt.x, tgt.y, MAW_SLOW_R)) if (typeof applySlow === "function") applySlow(a, MAW_SLOW_FRAMES, MAW_SLOW);
    { const dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    f._sigAt = f0; f._sigCd = MAW_EVERY;
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: tgt.x, y: tgt.y, radius: MAW_SLOW_R, color: "#9fe8ff", life: 36 });
        elementEffects.push({ type: "impact", x: tgt.x, y: tgt.y, color: "#cff4ff", radius: 0.7, life: 24 });
    }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "CHOMP", color: "#bdf0ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// ERUPTION: the crater bursts over everything close: toxic damage and eaten armour. True when it fired.
function eruption(f) {
    const foes = _evoFoes(f.x, f.y, CALDERA_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * CALDERA_MULT, f, "toxic");
        a.defenseShredded = Math.max(a.defenseShredded || 0, CALDERA_SHRED_FRAMES); a.defenseShredFactor = Math.min(a.defenseShredFactor || 1, CALDERA_SHRED);
    }
    f._sigAt = f0; f._sigCd = CALDERA_EVERY;
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: f.x, y: f.y, radius: CALDERA_RADIUS, color: "#66ff66", life: 40 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#66ff66", radius: CALDERA_RADIUS * 0.6, life: 24 });
    }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "ERUPTION", color: "#88ff88", life: 50, vy: -0.06, size: 10 });
    return true;
}

// GRAVITY SLAM: flatten and slam, hitting, shoving and slowing everything close. True when it fired.
function gravitySlam(f) {
    const foes = _evoFoes(f.x, f.y, MIMIC_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * MIMIC_MULT, f, "flux");
        if (typeof applySlow === "function") applySlow(a, MIMIC_SLOW_FRAMES, MIMIC_SLOW);
        if (typeof vortexPullImmune === "function" && vortexPullImmune(a)) continue;
        const dx = a.x - f.x, dy = a.y - f.y, L = Math.hypot(dx, dy) || 1;
        a.x += dx / L * MIMIC_PUSH; a.y += dy / L * MIMIC_PUSH;
    }
    f._sigAt = f0; f._sigCd = MIMIC_EVERY;
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: f.x, y: f.y, radius: MIMIC_RADIUS, color: "#bb66ff", life: 40 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#bb66ff", radius: MIMIC_RADIUS * 0.6, life: 24 });
    }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "GRAVITY SLAM", color: "#cc88ff", life: 50, vy: -0.06, size: 10 });
    return true;
}

// AEGIS BURST: a blast of its shells, shoving enemies back, shielding it and its allies. True when it fired.
function aegisBurst(f) {
    const foes = _evoFoes(f.x, f.y, WARDEN_RADIUS);
    if (!foes.length) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of foes) {
        applyDamage(a, (f.power || 10) * WARDEN_MULT, f, "core");
        const dx = a.x - f.x, dy = a.y - f.y, L = Math.hypot(dx, dy) || 1;
        if (!(typeof vortexPullImmune === "function" && vortexPullImmune(a))) { a.x += dx / L * WARDEN_PUSH; a.y += dy / L * WARDEN_PUSH; }
    }
    const near = typeof unitsNear === "function" ? unitsNear(f.x, WARDEN_ALLY_R) : actors;
    for (const a of near) {
        if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone) || Math.hypot(a.x - f.x, a.y - f.y) > WARDEN_ALLY_R) continue;
        const cap = Math.round((a.maxHealth || 0) * WARDEN_SHIELD), have = a.shielded ? (a.shieldAmount || 0) : 0;
        if (cap > have) { a.shielded = true; a.shieldAmount = cap; a._shieldMax = Math.max(a._shieldMax || 0, cap); }
    }
    f._sigAt = f0; f._sigCd = WARDEN_EVERY;
    if (typeof elementEffects !== "undefined") {
        elementEffects.push({ type: "ring", x: f.x, y: f.y, radius: WARDEN_RADIUS, color: "#33e6c4", life: 40 });
        elementEffects.push({ type: "impact", x: f.x, y: f.y, color: "#33e6c4", radius: WARDEN_RADIUS * 0.6, life: 24 });
    }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "AEGIS BURST", color: "#66ffe0", life: 50, vy: -0.06, size: 10 });
    return true;
}
// STATIC RUSH: dash to the nearest enemy in range, hit it, shock two more; all stunned. True when it fired.
function staticRush(f) {
    const foes = _evoFoes(f.x, f.y, MANTA_RANGE);
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const tgt = foes[0], f0 = typeof frame !== "undefined" ? frame : 0;
    const from = { x: f.x, y: f.y }, dx = tgt.x - f.x, dy = tgt.y - f.y, L = Math.hypot(dx, dy) || 1, stop = Math.max(0, L - 0.8);
    f.x += dx / L * stop; f.y += dy / L * stop; f.dirX = dx / L; f.dirY = dy / L;
    const hits = [tgt];
    applyDamage(tgt, (f.power || 10) * MANTA_MULT, f, "electric"); tgt.hitStun = Math.max(tgt.hitStun || 0, MANTA_STUN);
    let last = tgt;
    for (let i = 0; i < MANTA_CHAIN; i++) {
        const next = _evoFoes(last.x, last.y, MANTA_HOP).filter(a => !hits.includes(a))
            .sort((a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y))[0];
        if (!next) break;
        applyDamage(next, (f.power || 10) * MANTA_MULT * MANTA_CHAIN_SHARE, f, "electric"); next.hitStun = Math.max(next.hitStun || 0, MANTA_STUN);
        hits.push(next); last = next;
    }
    f._sigAt = f0; f._sigCd = MANTA_EVERY;
    f._arcPts = hits.map(a => ({ x: a.x, y: a.y })); f._arcUntil = f0 + 20; f._arcStraight = false; f._arcCol = [255, 238, 51];
    if (typeof elementEffects !== "undefined") for (const a of hits) elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffee33", radius: 0.5, life: 18 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "STATIC RUSH", color: "#fff27a", life: 50, vy: -0.06, size: 10 });
    return true;
}
// REWIRE: how fast and far the worm vessel puts a downed pylon back online (js/mass.js asks). null if it is not one.
function evoRepair(f) {
    if (!f || f.evolved !== "vessel") return null;
    return { rate: VESSEL_RATE, reach: VESSEL_REACH, speed: VESSEL_SPEED };
}
// RAPID DISCHARGE: how fast and far the dynamo pod neutralises (js/mass.js asks). null if it is not one.
function evoNeutralise(f) {
    if (!f || f.evolved !== "pod") return null;
    return { rate: POD_RATE, reach: POD_REACH, speed: POD_SPEED };
}
// HEAVY HAUL: what the hover hauler's hauling is worth (js/mass.js asks). null if it is not one.
function evoHaul(f) {
    if (!f || f.evolved !== "hauler") return null;
    return { speed: HAULER_SPEED, reach: HAULER_REACH, pay: HAULER_PAY };
}

// ── THE LOOK ───────────────────────────────────────────────
function _evoImg(d) {
    if (d._img !== undefined) return d._img && d._img.complete && d._img.naturalWidth ? d._img : null;
    d._img = null;
    if (typeof Image === "undefined") return null;
    const im = new Image();
    im.onload = () => { d._img = im; };
    im.src = d.sheet + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    d._img = im;
    return null;
}
function _evoGroundImg(d) {
    if (!d.ground) return null;
    if (d._gimg !== undefined) return d._gimg && d._gimg.complete && d._gimg.naturalWidth ? d._gimg : null;
    d._gimg = null;
    if (typeof Image === "undefined") return null;
    const im = new Image();
    im.onload = () => { d._gimg = im; };
    im.src = d.ground + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    d._gimg = im;
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
function drawEvolvedFollower(f, px, py, g) {
    const d = evolvedDef(f); if (!d) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0, m = f0 - (f._moltAt === undefined ? -1e9 : f._moltAt);
    if (m < EVO_MOLT * 0.3) return false;                 // still the egg, shaking (the overlay cracks it)
    const img = _evoImg(d); if (!img) return false;
    const col = d.color || (d.element === "fire" ? "#ff5a1f" : d.element === "flux" ? "#bb66ff" : "#ffee33");
    const fr = _evoFrame(f, d, f0), rise = fr.rise, sigK = fr.sigK, s = fr.s;
    g.save();
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
