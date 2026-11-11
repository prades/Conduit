// ── THE ELECTRO SKINK'S SWIRL · No. 926 (draft, 2026-11-11) ───────────────────────────────────────────────────────────────────────────────────────────
// The owner, 2026-11-11, on the Electro Skink's everyday hit: "what would be cool is if he like swirls around the enemy in a vortex really fast and then pops back
// to natural form." Looks only (the Skink itself stays where it is; the vortex is drawn round the enemy), one hit, Slashing, one enemy (the chain lightning is dropped).
// The body of a single Skink is too short to ring an enemy, so the vortex is THREE copies of it, spaced evenly round a ring, each head leading, tails trailing, the
// legs tucked and the glow up: the way a fast spin is drawn. It is the model of No. 905 (forms36.js, o.swirl) and nothing else.
//   idle block (8 frames): the ring spinning steadily; its loop is a third of a turn, since the copies are a third of a turn apart (play it fast);
//   action block (8 frames): the bodies curling from straight into the ring (play it backward to release them, then the Skink pops back to its own sheet).
// Bake it alone: node design/evolutions/bake.js <three> img/evo skinkswirl 192 2.2667   (job: idleAct 2 = the steady ring; the action runs act 0 to 1, no pulse)
fx(926, "The ELECTRO SKINK's SWIRL: three copies of No. 905's body in a fast ring (its vortex round an enemy).", () => {
  const g = G(), parts = [0, 1, 2].map(i => _electroSkink(Object.assign({}, _sk0, { S: 2.8, swirl: { i, n: 3, R: 0.55, cover: 0.97, rise: 0.05 } })));
  parts.forEach(p => g.add(p.g));
  return { g, core: parts[0].core, update(t, act) { parts.forEach(p => p.update(t, act)); } };
});
