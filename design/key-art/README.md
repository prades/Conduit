# CONDUIT key art: the movie poster (template)

The owner's poster (2026-11-10): "a Star Wars movie poster" of the game, kept as **the template for key art from here on**.
A copy for the web is in the Game Bible: `img/bible/key-art-poster.webp` (Art direction → Key art).

**Make it:** `bash design/key-art/make.sh` → `design/key-art/out/conduit-poster.png` (2400 × 3600). It takes a few minutes; `out/` is not committed.

## What is in it, back to front (all in `poster.js`)

| Layer | What | Where to change it |
|---|---|---|
| Sky | dusk gradient, stars; the eruption's glow | `// ── SKY` |
| The plume | the volcano's smoke, behind everything | `// ── THE PLUME` |
| Sky feature | a few followers blown up on plain highlights in their element colour (Jelly Ram, Ember Hood, Void Star); **the main character** large, top right | `// ── THE SKY FEATURE` (the `sky` list; `main_gun`) |
| Landscape | the giant snow-capped mountain (left), the volcano across the valley's water (right) with its lava; the power plant leaking toxic waste | `// ── MOUNTAINS` … `// ── THE POWER PLANT` |
| Middle ground | low-poly foothills lit by the eruption, joining the landscape to the street | `// ── THE CITY GROUND` |
| The HQ | the glass headquarters with the CONDUIT sign | `hq.js` (the model), `put('hq', …)` |
| Foreground | the street, the broken sewer, the giant mantis rising out of it, the fight (the two heroes from behind, Quillstone, Static Orb, Electro Skink, Blight Spider, Frost Maw, Thermite Burrower, Ember Hood's fireball) | `// ── THE STREET`, `// ── THE MANTIS`, `// ── THE BATTLE` |
| Type | tagline, CONDUIT, C.O.R.E. STRATEGY | `// ── TYPE` |

## The pieces

- **Followers and heroes** are the game's own 3D models (`design/evolutions/`), rendered large by `bake_hi.js`: a copy of
  `design/evolutions/bake.js` that renders one facing (`FACE`, 0–7, the game's rows) and one frame (`ACT=1`: mid-action) at any size.
  Facing 1 is the front; 0 turns right, 2 left, 6 shows the back.
- **The mantis, the HQ and the power plant** are models made for the poster (`mantis.js`, `hq.js`, `plant.js`, drawn by `r3d.js`).
  They are not in the game.
- **Placing a piece:** `put(name, x, y, scale, { flip, glow, blur, alpha })` puts its ground point at (x, y); `putLit` also washes it in its
  element colour. Element colours come from the game's form table (`js/evolution.js`).

## Made up for the poster (change freely)

The tagline ("THE SEWERS WERE ONLY THE BEGINNING."), the hexagon-and-crystal logo on the HQ (the repo has no logo file), and the three scene models.
