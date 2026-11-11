# The battle look (the JRPG feel)

- **Status:** The battle view, the floor's writing, no names and the fading objects (build `2026-11-11h`), and the numbers with the roster's answer (`2026-11-11i`), are **implemented and verified by tests** (the owner: "build it"); not playtested. The attack frames are **designed**, not drafted.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-11
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-11l`
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
   - While the battle view is on, an object standing in front of you, one of your squad or a creature is not drawn; a faint outline of it shows on the floor. Every other object stays as it is, and the walls stay (they never fade, an earlier decision). *(For the big objects and the walls, **superseded** by item 14: in a fight they go flat whether they hide anyone or not.)*
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
      - **The Electro Skink's tile goes with its swirl** (the owner, 2026-11-11: "Whenever it attacks the little green square tile, highlight should match where it is at attacking the enemy"; build `2026-11-11l`). While it swirls round an enemy (`COMBAT.md` §7.4) its green tile is lit round the enemy's tile, not at its own feet (where its body is not drawn), a little wider (0.52 of a tile, the usual 0.42) so the enemy's red tile shows inside it; when the swirl ends it is back at its feet. Only the Skink's tile moves. Implemented and tested (`tests/skinkswirl.js`); not playtested.
    - **No names in a fight** (the owner: "We're getting somewhere. Now I want to make it to where the character names are not visible. It converts down to a element tag, if there is one, and a level that appears next to the health bar."). Each fighter's name plate and its status chip ("Lv 7 FIRE TECHNICIAN", ATTACKING) are not drawn. Next to its floor bar: its element's tag, the energy cards' symbol in the element's colour, if it has an element; and its level (LV7).
    - An experiment, drafted (§10).
11. **A hit's number flies to the bar and knocks it down** (the owner, on a sketch over the draft: "cool little animation here. Whenever you hit a character or an enemy, the number pops out of them and then smashes the ground where the HP bar is to knock it down").
    - The number pops up and out of whoever was hit, then arcs down and lands on that fighter's floor bar.
    - The bar keeps its length until the number lands; then it drops.
    - The agent's, provisional: the piece lost flashes white, breaks off and falls away; the number lands with a squash and a small ring on the floor, and the bar shakes; about a third of a second from the hit to the landing (pop 7 frames, falling to frame 20).
    - **Gone soon after it lands** (the owner: "I like it, but the numbers disappear sooner"): it fades out within 8 frames of landing (it lay there over half a second in the first draft).
    - **The extra lands second** (the owner: "Make extra damage from an effective attack (weak) or any bonus elemental damage show up after the initial drop and the health bar only reacts to the display animation"):
      - A hit's number is cut in two. First, the hit without its bonuses: resistances still lower it as now.
      - The bonuses come second: a weakness's extra on the physical part, an elemental advantage on the elemental part, and the Opportunity cards' share. When the first lands, the bonus, **+N in gold**, hops up from the bar and slams down onto it.
      - **The bar moves only as each number lands**: twice for a hit with a bonus.
      - The colour and the hop's timing are the agent's, provisional. The draft found the bonus by working the hit out again with no bonus; the build should have `dmgApply` (js/damage.js) give both.
    - **Less jumping, more fitting into place** (the owner: "The numbers should do less jumping more fitting into place"):
      - A number rises only a few pixels as it appears, then glides, eased, to the point on the bar where the health is cut, turning to lie flat along the bar as it arrives. It fits there with no squash or bounce.
      - A follower's number lies flat on the floor at its feet.
      - The bonus (+N) slides along the bar to its own cut.
      - The bar's shake on a landing is smaller.
      - Timings the agent's: appearing 5 frames, gliding to frame 18, gone 8 frames after.
      - Two numbers that appear on the same frame overlap; the build should set them apart.
    - **Knocked off the way the blow was going** (the owner: "the hit that is given to each other knocks the number off into the direction in which the momentum is going. That way the numbers stay separate and readable. They go back to the health bar, and then the other numbers for when the follower gets hit just disappear"):
      - A hit's number is first knocked off its target in the blow's direction, from the attacker through the target, so the two sides' numbers part.
      - A creature's number then glides back into its bar's cut and lies flat there, as above. A bonus slides along the bar after it.
      - A follower's number just goes, fading where the knock left it. Its card on the roster answers then: the shake, the −N out of the card, the bar moving.
      - Timings the agent's: the knock 8 frames, about 38 px; back to the bar by frame 20.
    - **Your followers' health is on the roster, not the floor** (the owner: "remove the followers' health bars from the floor and just make it to where the on-screen roster will highlight and shake the follower card and health bar when activity occurs").
      - Only the creatures keep a floor bar, with its level and element tag. Your followers keep their lit tile.
      - A follower's number smashes the floor at its feet.
      - When it lands, the follower's card on the roster lights up in its element's colour and shakes. The card's health bar and its numbers move then, not before.
      - The agent's, provisional: "activity" is a hit landing on it (a heal, or its own attacks, could be added); the shake about a quarter of a second.
      - **What happens to a follower flies out of its card too** (the owner: "have the damage and the other numbers like healing whenever that happens next to the roster, mini roster, and have it fly out whatever it is, the numbers, like negative, whatever. And super effective, weak, stuff like that").
        - Its damage (−N, as the hit lands), its healing (+N in green) and the effectiveness words (WEAK!, a small pale resist) pop out of the card's right side, fly out a little and fade.
        - Several at once stack upward.
        - The agent's, provisional: the words as the game says them (WEAK!, not "SUPER EFFECTIVE"); WEAK! following the number; about three quarters of a second.
    - Drafted (§10).
12. **No DEFEATED** (the owner: "We're removing the defeated text"). The word over a unit that falls is taken out, in every fight, at once: build `2026-11-11g` (`COMBAT.defeatText` 0; `COMBAT.md` §1). The boss's "IS DEFEATED" banner and the Nest console's state are other words, and stay.
13. **Earlier, superseded: the element's word on a background.**
    - The owner first asked: "Instead of electric resist, use color coated, element symbol behind it or animated texture background gradient". Drafted as A (the number over its element's symbol) and B (the number on a plasma badge).
    - The owner's answer to those: "It should say resist / weak. Just have a rectangular texture behind it that has the element of the opposition attack." So the word stays, as WEAK or RESIST without the element's name, and the element of the attack that hit is the texture of a rectangle behind it. That texture is the energy cards' moving plasma in the element's colour.
    - A and B are **superseded**. So is the rectangle that followed (drafted as the energy cards' plasma in a rectangle); the owner: "No, not necessarily a rectangle, like a irregular ball of plasma or texture that represents each element."
    - Then the balls were drafted with each element's details (fire's flames, electric's arcs and so on). The owner: "No just make it a irregular blur that only slightly gives character." So: a soft, irregular blur in the element's colours behind the word, its edge moving a little in the element's way (fire licking up, electric buzzing, ice a touch angular, toxic wobbling, core breathing, flux turning, BLOOM faintly petalled), with no drawn details. The detailed balls are **superseded**, and then the blur too, by the words on the floor (10).
14. **Objects and walls in a fight: flat only in front of the fight.** Build `2026-11-11l` had every big object and every wall flat in a fight (the owner, after build 11k: "hide things like the truck and the oil tanks ... the poison purple tanks, and the walls ... and just make them like solid ground with a little bit of transparentness of the object still visible"). Playtesting build 11p, the owner: "if I'm in combat and I'm in front of an object and everything that's happening is also in front of that object, it shouldn't be transparent." Since build `2026-11-11r`:
    - **An object, big or small, fades only while it stands in front of someone in the fight** (nearer the camera, its picture over theirs): item 5's rule, for every object. It fades to the ghost with the floor under it and its outline round it, as a whole.
    - **A wall piece does the same**, piece by piece, over the same frames: plain walls, the cave's rock, glass, railings, door frames, posts and what hangs on a wall. Behind the fight, a wall is itself.
    - **They all still count**: they stop shots, hide what is behind them and block the way, as always.
    - The agent's, provisional: the same ghost strength as item 5 (30%, between the 25% and 45% drafted); walls with no outline.

## 3. Must-have requirements

- [x] The battle view (build `2026-11-11h`).
  - When a creature engages you or your squad, the camera eases in; the edges of the picture soften (blurred a little); it eases out after the fight.
  - The HUD (bars, dial, buttons, squad cards, panels) does not zoom and stays where it is.
  - A tap still lands on what is under the finger.
- [x] While the battle view is on, an object in front of a fighter fades (a ghost, its tile outlined on the floor: §2, 9), and it still counts (build `2026-11-11h`).
- [x] The floor in a fight (§2, 10): each fighter's tile lit; a creature's bar on the floor with its level and its element's tag; WEAK! and STUNNED written on the floor; RESIST floating off; no names over the units (build `2026-11-11h`).
- [x] The numbers are bigger, in the face of the hit's damage type; statuses in the status face; each knocked off the way the blow went, then into its bar's cut; a follower's card answering on the roster (§2, 11; build `2026-11-11i`).
- [ ] Each form's attacks have their own baked frames, form by form.

## 4. Non-goals

- Turn-based battles; any change to combat's rules or numbers.
- Phones (not supported).
- A new look for the banners (the messages at the centre of the screen).

## 5. Chosen by the agent, provisional (to be shown as drafts first)

**The battle view**
- **Strength and timing:** **1.25×** (approved as drafted), easing in over 0.4 s and out over 0.6 s (provisional).
- **Done as one copy of the finished world picture, scaled.** The copy is made after the world and its overlays and before the floating words and the HUD. So nothing that draws the world changes, and the words are drawn sharp at their zoomed place.
- **When it counts as engaged:** a creature within 7 tiles of you, in sight, that is attacking you or one of your squad, or that you or your squad have hit in the last 2 s. It counts as over 3 s after there is none. As built, also the creature your squad is ordered at; a sleeping one never counts; a knockout eases the view out at once.
- **The edges:** a soft blur over the outer part of the picture with a little darkening. On GRAPHICS: LOW (and so on older iPads) only the darkening, which costs one fill a frame.

**The numbers and fonts**
- **Size:** about **twice as big** (28 px), with a small pop as each appears, and up about a second (today 0.6 s).
- **Who leads:** the numbers. A status word sits a line above them. WEAK is written on the floor and shakes, RESIST floats off small and pale, STUNNED is on the floor (§2, 10). The physical type's word (SLASHING WEAK!) is only a little bigger than today, until it is decided whether it goes the same way.
- **No pile-ups:** words that would overlap stack upward, the newest moving up a line until it is clear.
- **Fonts:** free-licensed (SIL Open Font License), shipped with the game (nothing loaded from elsewhere), and cut down to the letters and digits the game shows.
- **As built** (`2026-11-11i`): the new numbers and words are drawn only in the battle view; out of a fight they are as before. The size is 1.8× (as drafted), not twice.
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
- **The network panel and the Crystal's ring** (top right) are drawn with the world today. Under the zoom they slide off the edge and blur, so they must be drawn after the zoom (seen in the drafts). Built so: they and the Ant Nest's meter wait for after the zoom.
- **No floor is drawn under an object.** A faded object needs its floor drawn, or a dark hole shows (seen in the draft). Built so: a next tile's floor, in the room's light.
- **Writing on the floor needs the floor drawn first.** Today the floor's tiles are sorted in among the units. A marking on the floor is either painted over by a tile in front of it or painted over a unit's feet.
  - The draft drew the whole floor first, then the markings, then everything standing. That is right on one level, like the arena.
  - Where a deck stands over a floor, the build must keep the levels apart (seen in the draft). Built so: only the tiles on your own level go first.
- **Words near the edge of the fight end up under the HUD:** the zoom pushes them outward (in the drafts, DEFEATED under the STUN button).
- A fight at the edge of the screen: the zoom centres on you, as the camera does, so a far creature may leave the picture. The drafts should show whether to centre between you and the fight instead. Built: centred on you.

## 8. Acceptance criteria

**Step 2, the battle view** (build `2026-11-11h`; each checked by `tests/battlelook.js`):
- A creature within 7 tiles, in sight, going for you or yours (or hit by you or yours in the last 2 s, or the one your squad is ordered at) brings the view in over 0.4 s to 1.25×; none for 3 s takes it out over 0.6 s. A sleeper, a clone, one of yours, one too far or out of sight does not. The dialogue box, `?attract` and a knockout take it out.
- The HUD does not zoom; the network panel and the Nest's meter are drawn after the zoom. A tap where something shows means that thing (a creature, a follower, a tile, the Crystal, every picker).
- On HIGH the edges are blurred and darkened; on LOW only darkened.
- The floor on your level is drawn first; written on it: the lit tiles, a creature's bar with LV and its element's tag (none for a follower), STUNNED, WEAK! shaking. No names or small bars over the units. RESIST small and pale, drifting off.
- An object in front of a fighter fades to its ghost over 0.2 s, its floor drawn and its tile outlined, and comes back the same way; it still stops a shot.
- A step with no picture leaves the game as a drawn one does (`tests/ghost.js`).

**Step 3, the numbers** (build `2026-11-11i`; `tests/battlelook.js`):
- In a fight a hit's number is 1.8× today's size, in its damage type's face (a hit with no type: the status face).
- It is knocked off the way the blow went. A creature's is back in its bar's cut by frame 20, lying flat; the bar drops only as it lands. A bonus lands second, in gold, and the bar drops again.
- A follower's is gone after the knock. As it lands, its card lights and shakes, its health moves, and the −N flies out of the card; a heal's +N and WEAK! fly out too.
- The other words on the world are in the status face and kept apart.
- A big object fades whole, outlined round it, with a floor under every tile.

## 9. Steps

1. **Drafts:**
   - the battle view (stills from the real game: today, the view on HIGH, the view on LOW);
   - a sheet of candidate faces, three for each of the seven;
   - one form's new attack frames (a filmstrip).
2. The battle view, built: build `2026-11-11h`, with the floor's writing, no names and the fading objects. How it is built (js/battleview.js, `BATTLE_VIEW`):
   - **The zoom** is one copy of the finished world picture (the world pass and its overlays), scaled about the middle, made in js/game.js `render` just before the floating words (`battleViewPost`). Nothing that draws the world changes. What is drawn after it and sits on the world goes through `bvZoomPt` (the floating words, the lock-on and the dial's brackets, a follower's pick point, a creature's and the Crystal's tap point); every picker that works the world out from a tap takes it back through `bvUnzoom` first, once.
   - **The edges** on HIGH: the picture shrunk to a quarter, then a fourteenth, and scaled back up (a blur with no canvas filter, for older iPads), kept towards the edges by a mask; then a darkening ring. On LOW the ring alone. The ring and the mask are drawn once a screen size.
   - **The floor first**: js/game.js `drawDepthOf` sorts the floor tiles on your level before everything (`battleFloorFirst`); the floor's writing goes between (`battleViewDecals`, from js/facilityplay.js `facilityDrawItems`). The floor's face is Titan One (`BV_FLOOR_FACE`).
   - **The objects**: js/propsprites.js `_psBlit` notes where an object's picture went; one nearer the camera whose picture overlaps a fighter's fades (js/facilityplay.js `drawFacilityItem` asks `battleFadeProp`).
   - **No names**: js/draw.js asks `battleHidesUnitHud` (from halfway in). The words: js/drops.js asks `battleWordRole`.
   - **A step with no picture** keeps the view's state (`_bv`) as a drawn one does; what only the drawing keeps is apart (`_bvDraw`, listed in `tests/ghost.js`), with each object's picture, fade and floor level kept beside it, not written on it.
   - **Build `2026-11-11l`: flat in a fight**, then **build `2026-11-11r`: only in front of the fight.** Every object is in `battleViewDecals`'s hide set only when `battleHides` says it stands in front of someone (11l counted a big one, 4 tiles or more, all fight). A wall and what belongs to it (`BV_WALLISH`) is in `_bvDraw.wallHide` when `_bvWallHides` finds it in front of someone (its two ends, at the foot and at the wall's height, projected as the floor is: `_bvWallRect`), and `battleFadeWall` fades it in and out over `BATTLE_VIEW.fade` frames as an object (11l drew every wall faint with the view's ease). **A ghost of many tiles is drawn whole**: its picture once a frame, unclipped, by the first of its tiles drawn (js/propsprites.js `facilitySpriteDraw(it, whole)`, asked through `battleDrawsWhole`). Drawn tile by tile, each tile's column overlapped the next and the ghost stacked back up to nearly solid (seen on the real page: build 11i's truck hardly faded).
   - **Build `2026-11-11i`'s fix to the objects**: an object fades as a whole (all the tiles of one solid share its id: js/facilityplay.js `_fpPropItems`), when any of its tiles hides a fighter, found once a frame (`battleViewDecals`, `_bvDraw.hideIds`). Each tile notes its own column of the picture (js/propsprites.js `_psBlit`), and a one-tile object its whole picture. The outline is drawn round the object, not between its tiles. An inner tile's floor is the nearest floor (`_bvFloorKey`).
3. The numbers and their faces, built: build `2026-11-11i` (js/battleview.js, `BATTLE_VIEW.num`):
   - **The tag**: js/helpers.js `applyDamage` hands each number to `battleNumberTag`, with whom it hit, the face of its damage type (`_bvKindOf`), the blow's way on the screen, and its bonus. The bonus comes from js/damage.js `dmgApply`, which now gives the share of the hit with no weakness, advantage or Opportunity in it (`dmgBaseShare`; resistances stay in it). The tags are kept beside the words (`_bvDraw.hits`), not on them. Heals (js/combat.js `healUnit`) and the weakness words (js/damage.js `_dmgWords`) over a follower are tagged too (`battleWordTag`).
   - **The flight** (`battleDrawNumber`, from js/drops.js `drawFloatingTexts`) is drawn after the zoom, at the zoomed place. A part lands at the end of its glide (a creature's) or its knock (a follower's); `battleBarHealth` adds the parts not yet landed to a unit's health, for its floor bar and its card.
   - **The roster**: `battleCardsTick` (each frame, after the numbers: js/drops.js `drawFloatingTexts`, so a card answers on the frame its number lands; build `2026-11-11j`) lights and shakes a card whose follower was just hit and moves its health (js/party.js `partySlotHealth`, also used by the roster's own refresh every 6 frames). The light is the class `sb-hit` (game.html), on the card's background: the card's own shadow is cut off by its clip-path and covered by its slanted background, so build `2026-11-11i`'s glow hardly showed. It comes on at once and fades out over 0.3 s. `battleDrawRoster` draws the words beside the cards.
   - **Outlined texts** are made once and stamped (`_bvText`), as js/draw.js `cachedText` does, once their face has loaded.
   - **Out of a fight** nothing changes: the numbers are drawn as before.
4. The attack frames, form by form.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| `node tests/battlelook.js` (19 checks: when it engages and its timing, the dialogue box, `?attract`, a knockout, a new game; the zoom's maths and its copy on HIGH and LOW; the HUD held back; taps through the zoom and every picker; the floor first on your level only; the floor's writing; no names; the words; the objects' fade and floor, and a shot still stopped; the faces and their licences; the real page in Chromium: the copy, the edges, a fight) | Pass | build `2026-11-11h` |
| `node tests/ghost.js` (a step with no picture keeps the game as a drawn one) | Pass | build `2026-11-11h`, with `_bvDraw` listed as drawing-only |
| The nearest suites (38: facilityplay, facility, targets, weapon, movement, hud, bottomui, plate, combat, techabilities, fluxmove, fluxlab, mutator, specimen, perf, cover, attract, dialogue, playercombat and others) | Pass | build `2026-11-11h`; ghost.js failed there (the drawing's notes were kept on the game's objects) until `_bvDraw` was split off, then passed |
| The full run (`node tests/run.js`, 110 suites) | Pass | build `2026-11-11h` (commit `184416a`) |
| The real page: one arena moment before the view, on HIGH and on LOW | Looked at (screenshots) | build `2026-11-11h`; they showed the semi truck fading in patches (fixed in `2026-11-11i`) |
| `node tests/battlelook.js`, step 3 (7 more checks: a big object fading whole, outlined round it; what is noted of a picture; the faces; the bonus share; a number's tag and the view coming on at once; a creature's flight, its bar and its bonus; a follower's number and its card; the heal and WEAK! out of the card; the other words kept apart; on the real page the seven faces loading and a number landing) | Pass | build `2026-11-11i` |
| The nearest suites (35: damage, combat, party, squadui, followercombat, ghost, perf, targets, hud, serum, moves, cards, energycards and others) | Pass | build `2026-11-11i` |
| The full run (`node tests/run.js`, 110 suites) | Pass | build `2026-11-11i` (commit `828e88e`) |
| The real page, frame by frame: a crushing hit on an ant (13 knocked off and back into the bar, +2 second); a bite on a follower (its card, the −N) | Looked at (filmstrips) | build `2026-11-11i`: the card's light hardly showed (fixed in `2026-11-11j`) |
| The full run (`node tests/run.js`, 110 suites) | Pass | build `2026-11-11j` |
| `node tests/battlelook.js`, flat in a fight (3 more checks: the big objects flat whether they hide anyone or not, the small ones not; a big ghost drawn whole once a frame at the ghost's strength, tile by tile out of a fight; every wall faint in a fight and still stopping a shot; on the real page the truck beside a fight see-through) | Pass | build `2026-11-11l` |
| The real page: the tanks and the truck in a fight, before and now | Looked at (screenshots) | build `2026-11-11l`; a draft first (build 11i's whole-object fade found not see-through there) |
| The full run (`node tests/run.js`, 110 suites) | 108 pass, 2 fail, then pass | build `2026-11-11l`: facilityplay's source check expected `facilitySpriteDraw(it)` (widened to the new second argument; passes); techabilities' real-browser throw, the known flake under a full run's load, passes alone |

The drafts (2026-11-11) were made in the real game in a test browser. The look was added there for the pictures only, with no change to the game's files:
- a sheet of three candidate faces for each of the seven, against today's 14 px monospace;
- one moment of a fight in the arena drawn three ways: today, the battle view on HIGH (1.25×, soft blurred edges) and on LOW (1.25×, darkened edges only), with the numbers in one set of the candidates;
- the fade: a floodlight standing in front of a fight, today and in the battle view. It is gone, a faint outline of its tile left, and the floor under it stamped from the next tile for the picture.
- the element's word: WEAK! and RESIST on a rectangle of each element's moving plasma (a sheet of the seven, animated), and the same in the fight. Then on each element's own ball, the seven of them animated and in the fight: fire's licking flames and embers, electric's jagged crackle and arcs, ice's faceted crystal and glints, toxic's wobbling goo, bubbles and a drip, core's breathing orb with a turning hexagon and a ring going out, flux's swirl, BLOOM's five petals and pollen. Then, as the owner corrected it, a soft irregular blur of the element's colours (drawn small and scaled up: the scaling is the blur, no canvas filter), the seven animated and in the fight.
- the floor (2026-11-11): each fighter's tile lit (green yours, red theirs) with a long health bar on the floor before it; WEAK! written on the floor in red, shaking; STUNNED in yellow on the floor while the stun lasts; RESIST small and pale, floating off; one face (Titan One) for the floor's writing. A still in the battle view and a short clip.
- no names in the fight: the plates gone; by each floor bar its level and, if it has one, its element's tag. Drawn two ways, flat on the floor like the bar, and standing upright at the bar's end.
- the floor's words facing you: STUNNED and WEAK! level across the screen, squashed to the floor's slant (a still and a clip; "Ugly"). Then three side by side (A along the tile, B halfway, C standing); A kept.
- a hit's number flying to the bar: out of whoever was hit, up and over, down onto its floor bar with a squash and a ring; the bar dropping only then, the lost piece breaking off (a still and a clip). Then gone within 8 frames of landing; then the extra landing second (a crushing BASH on an ant: 23, then +1 in gold hopping up from the bar and down). Then the followers' health on the roster: no floor bars for them; a bite's number landing at the Fire Technician's feet, its card lighting up and shaking. The draft's fight made one on one, the other followers held back, so each number reads alone (the owner: "make the test have less projectiles"). Then the numbers gliding into place: no hop, lying flat along the bar at its cut. Then the roster's pops: a bite's −2, WEAK! and a heal's +5 flying out of the Fire Technician's card. Then the knock: the technician's hits knocked off to the right and back into the ant's bar, the ant's bites knocked off to the left and gone. The column-C faces in the fight; a hidden object as a ghost at 25% and at 45%.

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
