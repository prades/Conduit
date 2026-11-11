# The battle look (the JRPG feel)

- **Status:** **Designed** (the direction approved 2026-11-11, from options). The first drafts (the faces, the battle view) are shown to the owner; nothing built.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-11
- **Branch/build context:** `claude/start-game-project-HSh7Z`, after build `2026-11-11f`
- **Related docs:** `COMBAT.md` (combat readability: the numbers, the bite in two beats), `EFFECTS.md` (the forms' effect pieces; the budget for effects), `UI-STYLE.md` (fonts), `ART-PROCESS.md` (drafts first), `PLAYER-COMBAT.md`

## 1. Intent

The owner, 2026-11-11: "Can we make it where the combat is more like a JRPG, and each attack has like sort of an animation, I guess, and whenever a move is whenever we get into a battle or something, it like zooms in and kind of blurs out the edges a little bit, and the numbers are a little bit bigger, and then like the different effects are displayed in different fonts that represent the different types of damage and stuns and stuff."

What it is today:
- **No camera zoom.** The world is drawn at one scale, and about 26 places work out a screen position from it by hand.
- **The numbers.** A hit's number is 14 px (13 px over your own units), coloured by the attacker's element, and lasts 0.6 s (js/helpers.js `applyDamage`). Every floating word, statuses included, is plain `bold monospace` (js/drops.js `drawFloatingTexts`).
- **No webfonts ship** (`UI-STYLE.md`).
- **The attacks.**
  - An evolved form has one block of 8 action frames per facing, baked from its 3-D model (design/evolutions/bake.js). It plays in about 0.3 s for every attack, its plain hit and its second attack alike (js/evolution.js `_evoFrame`). SUNDEW alone has a third block, CONSUME.
  - Unevolved followers and creatures are drawn with a lunge of a few pixels, and a creature rears back before a bite.

## 2. Approved design (2026-11-11, chosen from options)

1. **Real-time stays.** Fights keep their rules (you move, your squad fights as now). Only the look and feel become a JRPG battle's. Turn-based battles and "dramatic beats" (a freeze or slow motion on big moves) were offered and not chosen.
2. **The battle view comes on when a creature engages** you or your squad: the camera eases in and the edges soften. It eases back out a few seconds after the last one is down or gone. The other offers were "when you lock a target" and "big moves only".
3. **Fonts: one face for each damage type, and one for statuses.**
   - The six damage types: slashing, piercing, projectile, crushing, earthquake, elemental.
   - The statuses: STUNNED, BURN, POISON and the rest.
   - Not chosen: three families (physical, elemental, statuses), or a face per element.
4. **The attacks: new attack frames per form**, baked from each form's 3-D model as SUNDEW's CONSUME block was, form by form. Not chosen: motion on today's sprites, or motion first and frames later.
5. **Objects that hide a fighter fade out** (the owner: "let's make it to where the objects become invisible in that battle phase"; then chosen from options).
   - While the battle view is on, an object standing in front of you, one of your squad or a creature is not drawn; a faint outline of it shows on the floor. Every other object stays as it is, and the walls stay (they never fade, an earlier decision).
   - Not chosen: all objects but the fight's own; every object.
   - **They still count:** cover, sight, walking and FLUX MOVE work as always. Chosen over "fully invisible" and over taking them out of the fight.
6. **The battle view's strength as drafted** (approved 2026-11-11): 1.25×; on HIGH the edges blurred and darkened, on LOW darkened only.
7. **The faces: column C of the sheet** (the owner, 2026-11-11: "I like dont c", read as "font C"; to be confirmed on the picture). Slashing **Bangers**; piercing **Barlow Condensed Black Italic**; projectile **Chakra Petch Bold Italic**; crushing **Titan One**; earthquake **Rubik Dirt** (150 KB, the heaviest); elemental **Cinzel Decorative Black**; statuses **Pixelify Sans Bold**.
8. **The attack frames: the Brawlers first** (the owner: "brawlers first").
9. **A faded object is more visible** than the first draft's faint outline (the owner: "stronger visibility on hidden objects").
10. **The words on the floor** (the owner, 2026-11-11, replacing the element's word on a background: "Let's forget the little background effect and let's experiment with writing a standardized text on the tiles near the combat, and like highlight the tile to show a bigger style health bar when in combat to make things perhaps more readable. The player's health bar stays where it is, and the stunned and resist the stunned should show up on the floor, but the resist should float off like it's nothing, and the weak should be written on the ground and like shake."):
    - **WEAK** is written on the ground by the creature hit, and shakes.
    - **STUNNED** is written on the floor by the stunned creature, while the stun lasts.
    - **RESIST** floats off like it is nothing: small, pale, drifting up and away.
    - **One standard face** for the floor's writing.
    - **The floor's words run along the tile**, written on the ground: STUNNED and WEAK!.
      - A turn to face the player (the owner's sketch: "oriented with the user's eyes as well") was drafted level across the screen, squashed to the floor's slant. The owner: "Ugly".
      - Three more ways were then drafted: A along the tile, B halfway, C standing like a sign. The owner: "Revert where stunned is on the ground". So A, as before; the turned versions are **superseded**.
      - STUNNED stays the word. A STUN with a bar of the time left, drafted from the sketch, is not wanted.
    - **In a fight, each fighter's tile is lit**, with a bigger health bar on the floor in front of it, in place of the small bars over the units. Your own bars stay where they are, at the top.
    - **No names in a fight** (the owner: "We're getting somewhere. Now I want to make it to where the character names are not visible. It converts down to a element tag, if there is one, and a level that appears next to the health bar."). Each fighter's name plate and its status chip ("Lv 7 FIRE TECHNICIAN", ATTACKING) are not drawn. Next to its floor bar: its element's tag, the energy cards' symbol in the element's colour, if it has an element; and its level (LV7).
    - An experiment, drafted (§10).
11. **No DEFEATED** (the owner: "We're removing the defeated text"). The word over a unit that falls is taken out, in every fight, at once: build `2026-11-11g` (`COMBAT.defeatText` 0; `COMBAT.md` §1). The boss's "IS DEFEATED" banner and the Nest console's state are other words, and stay.
12. **Earlier, superseded: the element's word on a background.**
    - The owner first asked: "Instead of electric resist, use color coated, element symbol behind it or animated texture background gradient". Drafted as A (the number over its element's symbol) and B (the number on a plasma badge).
    - The owner's answer to those: "It should say resist / weak. Just have a rectangular texture behind it that has the element of the opposition attack." So the word stays, as WEAK or RESIST without the element's name, and the element of the attack that hit is the texture of a rectangle behind it. That texture is the energy cards' moving plasma in the element's colour.
    - A and B are **superseded**. So is the rectangle that followed (drafted as the energy cards' plasma in a rectangle); the owner: "No, not necessarily a rectangle, like a irregular ball of plasma or texture that represents each element."
    - Then the balls were drafted with each element's details (fire's flames, electric's arcs and so on). The owner: "No just make it a irregular blur that only slightly gives character." So: a soft, irregular blur in the element's colours behind the word, its edge moving a little in the element's way (fire licking up, electric buzzing, ice a touch angular, toxic wobbling, core breathing, flux turning, BLOOM faintly petalled), with no drawn details. The detailed balls are **superseded**, and then the blur too, by the words on the floor (10).

## 3. Must-have requirements

- [ ] The battle view.
  - When a creature engages you or your squad, the camera eases in; the edges of the picture soften (blurred a little); it eases out after the fight.
  - The HUD (bars, dial, buttons, squad cards, panels) does not zoom and stays where it is.
  - A tap still lands on what is under the finger.
- [ ] While the battle view is on, an object in front of a fighter fades to a faint outline on the floor, and it still counts.
- [ ] The numbers are bigger, in the face of the hit's damage type; statuses in the status face.
- [ ] Each form's attacks have their own baked frames, form by form.

## 4. Non-goals

- Turn-based battles; any change to combat's rules or numbers.
- Phones (not supported).
- A new look for the banners (the messages at the centre of the screen).

## 5. Chosen by the agent, provisional (to be shown as drafts first)

**The battle view**
- **Strength and timing:** **1.25×** (approved as drafted), easing in over 0.4 s and out over 0.6 s (provisional).
- **Done as one copy of the finished world picture, scaled.** The copy is made after the world and its overlays and before the floating words and the HUD. So nothing that draws the world changes, and the words are drawn sharp at their zoomed place.
- **When it counts as engaged:** a creature within 7 tiles of you, in sight, that is attacking you or one of your squad, or that you or your squad have hit in the last 2 s. It counts as over 3 s after there is none.
- **The edges:** a soft blur over the outer part of the picture with a little darkening. On GRAPHICS: LOW (and so on older iPads) only the darkening, which costs one fill a frame.

**The numbers and fonts**
- **Size:** about **twice as big** (28 px), with a small pop as each appears, and up about a second (today 0.6 s).
- **Who leads:** the numbers. A status word sits a line above them. WEAK is written on the floor and shakes, RESIST floats off small and pale, STUNNED is on the floor (§2, 10). The physical type's word (SLASHING WEAK!) is only a little bigger than today, until it is decided whether it goes the same way.
- **No pile-ups:** words that would overlap stack upward, the newest moving up a line until it is clear.
- **Fonts:** free-licensed (SIL Open Font License), shipped with the game (nothing loaded from elsewhere), and cut down to the letters and digits the game shows.
- **Which face a number takes:**
  - The type of the hit's attack: a follower's from its form, anyone else's from the hit.
  - A hit with no type (a burn's or a poison's tick, a pool, a reflected hit, a card's echo) takes the status face.
  - A weakness or resistance word takes its part's face (SLASHING WEAK! in slashing's, FIRE RESIST in elemental's).

**The objects that fade:**
- **"In front of a fighter":** drawn after the fighter, nearer the camera, with its picture overlapping the fighter's.
- It fades out over 0.2 s and comes back the same way.
- **How it shows:** its tile's edges on the floor in a pale line, more visible than the first draft's (the owner); how much more is drafted.

**The attack frames:** for each form, a block for each of its moves (its attack, its second attack, its Ultimate where it has one), with a wind-up, the strike and the recovery, played slower than today's 0.3 s so it reads. One form is drafted first.

## 6. Affected systems

| Area | Where |
|---|---|
| The draw order and the zoom of the world picture | js/game.js `render` |
| The floating words: their faces, their sizes, their place under the zoom | js/drops.js |
| A hit's number and its type | js/helpers.js `applyDamage`, js/damage.js |
| The status words | js/combat.js, js/cards.js, js/elements.js and others |
| World taps through the zoom | js/input.js |
| The fonts and their licences | game.html; tools/bundle.js and the boot check |
| The attack frames | design/evolutions/bake.js, crop_sheets.js, js/evopack.js, js/evolution.js `_evoFrame` |
| Performance on old iPads | tests/perf.js; the budget for effects, `EFFECTS.md` |
| The light setting | GRAPHICS: LOW |

## 7. Edge cases

- A knockout, the dialogue box, the tutorial's scripted moments and the Toxic Queen's ambush: the view eases out, or stays out.
- Panels open over the game: the HUD is unchanged.
- `?attract` (the website's background): no battle view.
- Dark rooms.
- **The network panel and the Crystal's ring** (top right) are drawn with the world today. Under the zoom they slide off the edge and blur, so they must be drawn after the zoom (seen in the drafts).
- **No floor is drawn under an object.** A faded object needs its floor drawn, or a dark hole shows (seen in the draft).
- **Writing on the floor needs the floor drawn first.** Today the floor's tiles are sorted in among the units. A marking on the floor is either painted over by a tile in front of it or painted over a unit's feet.
  - The draft drew the whole floor first, then the markings, then everything standing. That is right on one level, like the arena.
  - Where a deck stands over a floor, the build must keep the levels apart (seen in the draft).
- **Words near the edge of the fight end up under the HUD:** the zoom pushes them outward (in the drafts, DEFEATED under the STUN button).
- A fight at the edge of the screen: the zoom centres on you, as the camera does, so a far creature may leave the picture. The drafts should show whether to centre between you and the fight instead.

## 8. Acceptance criteria

Written per step once the drafts are approved.

## 9. Steps

1. **Drafts:**
   - the battle view (stills from the real game: today, the view on HIGH, the view on LOW);
   - a sheet of candidate faces, three for each of the seven;
   - one form's new attack frames (a filmstrip).
2. The battle view, built.
3. The numbers and their faces, built.
4. The attack frames, form by form.

## 10. Verification record

Nothing built yet. The drafts (2026-11-11) were made in the real game in a test browser. The look was added there for the pictures only, with no change to the game's files:
- a sheet of three candidate faces for each of the seven, against today's 14 px monospace;
- one moment of a fight in the arena drawn three ways: today, the battle view on HIGH (1.25×, soft blurred edges) and on LOW (1.25×, darkened edges only), with the numbers in one set of the candidates;
- the fade: a floodlight standing in front of a fight, today and in the battle view. It is gone, a faint outline of its tile left, and the floor under it stamped from the next tile for the picture.
- the element's word: WEAK! and RESIST on a rectangle of each element's moving plasma (a sheet of the seven, animated), and the same in the fight. Then on each element's own ball, the seven of them animated and in the fight: fire's licking flames and embers, electric's jagged crackle and arcs, ice's faceted crystal and glints, toxic's wobbling goo, bubbles and a drip, core's breathing orb with a turning hexagon and a ring going out, flux's swirl, BLOOM's five petals and pollen. Then, as the owner corrected it, a soft irregular blur of the element's colours (drawn small and scaled up: the scaling is the blur, no canvas filter), the seven animated and in the fight.
- the floor (2026-11-11): each fighter's tile lit (green yours, red theirs) with a long health bar on the floor before it; WEAK! written on the floor in red, shaking; STUNNED in yellow on the floor while the stun lasts; RESIST small and pale, floating off; one face (Titan One) for the floor's writing. A still in the battle view and a short clip.
- no names in the fight: the plates gone; by each floor bar its level and, if it has one, its element's tag. Drawn two ways, flat on the floor like the bar, and standing upright at the bar's end.
- the floor's words facing you: STUNNED and WEAK! level across the screen, squashed to the floor's slant (a still and a clip; "Ugly"). Then three side by side (A along the tile, B halfway, C standing); A kept. The column-C faces in the fight; a hidden object as a ghost at 25% and at 45%.

## 11. Open questions

1. That "font C" is the right reading (the picture with the faces in the fight).
2. Which Brawler's attack frames come first.
3. Whether creatures and unevolved followers get attack frames too.
4. One richer attack block per form, or one block per move (the attack, the second attack, the Ultimate).
5. How strongly a faded object shows (a draft: a ghost at 25% or 45%, over a bright outline of its tile).
6. Whether the physical types' words (SLASHING WEAK!) change too, and how. The element's blur carries an element, and a physical type has none.
7. The level and element tag by the floor bar: flat on the floor, or standing upright (a draft of each).

## 12. History

- 2026-11-11: the owner's request.
- The same day, four choices from options: real-time with a JRPG look; the view when a creature engages; a face per damage type and one for statuses; new attack frames per form.
- Then the first drafts. The owner added objects becoming invisible in the battle phase, and chose from options: only those that hide a fighter, still counting, with a faint outline. The zoom was approved as drafted.
- Decision record: `DECISION-LOG.md`, "The battle look".
