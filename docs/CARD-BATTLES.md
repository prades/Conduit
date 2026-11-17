# Card battles (turn-based, one card a turn)

- **Status:** **Designed** (the owner's rules, §2.1 to §2.27, 2026-11-17); the battle screen chosen (SQUAD ROWS, a mockup). **Steps 1 and 2 implemented** behind `?cards` with `?engine=3d`: a battle starts and looks like one (`2026-11-17d`), and the battle screen, SQUAD ROWS, shows every member's cards (`2026-11-17e`) (§9); verified by `tests/cardbattle.js` and in a browser; not playtested. **The cards are not played yet and there are no turns** (step 3).
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-17
- **Branch/build context:** `claude/friendly-thompson-w581x0`, on main's build `2026-11-17c` (the game going 3D behind `?engine=3d`)
- **Related docs:** `DECISION-LOG.md` ("Card battles"), `BATTLE-LOOK.md` (the battle view that zooms and blurs: built in 2D), `STYLE-EVOLUTION.md` (the look and combat rounds; round 1's COMMAND MENU, CARDS and BATTLE STAGE), `VIEW-3D.md` (the game in 3D), `COMBAT.md`, `FOLLOWER-COMBAT-REDESIGN.md` (each form's moves), `PLAYER-COMBAT.md` (the player's part), `ENERGY-CARDS.md` and `UNIVERSAL-AND-PLAYER-CARDS.md` (the game's other cards, which are not attacks)

## 1. Intent
The owner, 2026-11-17: "So right now we're redesigning the game in a 3D world, but still to be solved is how to downgrade the speed of the game to where it feels like you can make choices more and have more of impact in the fights rather than the autopilot or the auto attack features. So what I'm thinking is a card combat system and a turn-based combat system where your whole team attacks, but only one. You get to choose which attack out of the team that goes. With the cards, so they charge up in the same sort of fashion, but they show up as cards at the bottom. And whenever you initiate a fight, like it kind of zones in that on that screen, and everything else kind of gets blurred out, and other creatures that pass by do not engage in the battle. They'll simply walk past. In the background. But whenever you initiate a fight, it becomes sort of a turn-based feel. And instead of just one enemy, sometimes it could be multiple enemies. But you always have your squad at your disposal. And the cards of attacks will show up, and the player can choose which one would be most beneficial in the scenario."

The experience: fights slow down into deliberate choices. Every turn you read the situation and pick the one move from your whole squad that matters most.

## 2. Approved design (the owner's, 2026-11-17)
1. **Fights are turn-based** (replacing "Real-time stays", 2026-11-11, and the real-time part of the look-and-combat direction, 2026-11-16: `DECISION-LOG.md`). Exploring stays real time.
2. **A turn: one card, then the enemies.** You pick **one card** from the attacks your squad has ready; that follower does it. Then **each enemy takes its turn.** Repeat. (Of three offered: "One card, then enemies act".)
3. **The cards are your squad's attacks**, shown **as cards along the bottom** of the battle screen.
4. **They charge by turns.** An attack card, once used, needs a number of turns to be ready again. **A basic attack card is always ready** (each follower has its own, §2.25), so there is always something to play. (Of three offered: "By turns".)
5. **Starting a battle:** **you start it by choosing an enemy, or an enemy starts it** by attacking you or your squad. (Of two offered: "You start it, or they do".)
6. **The battle screen zooms in on the fight and blurs everything else.** Creatures **not in the battle do not join it: they walk past in the background.**
7. **Several enemies** can be in one battle. **Your whole squad is always there.**
8. **The first step: pictures of the battle screen** (mockups to choose from) before anything is built. (Of three offered: "Pictures of the battle screen".)
9. **The battle screen: SQUAD ROWS** (the owner, of six mockups in `design/battle/round1/`: "2"). The bottom band is split into **one column per follower**, each headed by its portrait, name, element colour and health, with **that follower's cards under it** (ready ones lit, recharging ones dimmed with their turns to go); ~~the **basic attack** is its own always-ready card at the far left~~ (superseded by §2.25: each follower's column has its own basic attack card). **A "their turn next" list** at the top right gives each enemy's health and its next move (target and damage), and each enemy shows its next move over it in the scene too. Picking a card, then tapping an enemy, chooses the target (`2-pick.jpg`). The mockup's wording, numbers, ant move names and the basic attack's owner are the mockup maker's, not decisions.

10. **The player (the cube) commands only:** it has no cards and no actions of its own in a battle; you play the squad's cards. (Of three offered: "Commands only", not its own cards, not a free action each turn.)
11. **Ultimates are charged by the Ultimate meter**, as now: a follower's Ultimate card becomes playable when its meter is full, and empties when played. (Of two offered: "Charged by the meter", not a card with a long recharge.) *How the meter fills in a turn-based battle is open (§11).*
12. **A RUN card is always available:** playing it uses your turn and leaves the battle. (Of three offered: "A RUN card", not no escape, not walking away.) *Its cost, if any, is open (§11).*

13. ~~**The basic attack: you pick the follower.**~~ *(Superseded the same day by §2.25: each follower has its own basic attack card.)*
14. **The Ultimate meter fills from hits landed and taken**, as in real time now. (Of three offered: "From hits landed and taken", not a bit every turn, not from the cards played.)
15. **The enemies' turns: one by one, a surprise.** After your card each enemy acts in turn, one after another; **their next moves are not shown ahead of time** (of three offered: "One by one, a surprise", not shown first, not all at once). *This changes the chosen screen (§2.9): its "their turn next" list keeps each enemy's health but not its next move, and no move is written over the enemies before they act. A hint short of the move (e.g. whom it will go for) is the owner's to add or not.*
16. **RUN's cost: the enemies get a last hit.** You escape, but each enemy in the battle attacks once as you leave. (Of three offered: "Enemies get a last hit", not free but not from bosses, not completely free.)

17. **Targets: drag the card onto the enemy.** You choose a card's target by dragging the card onto the enemy it should hit (the owner's own answer: "Dragging the card to the enemy", of "tap the card, then the enemy" and "the card picks"). A basic attack card is dragged onto its target like any other card (§2.25). *How a move with no single target (one that hits every enemy or shields the squad) is played — dropped anywhere in the battle, or onto the squad — is the agent's suggestion, open.*
18. **Every attack shows:** all of the squad's attacks are on screen at all times, ready or recharging (as in SQUAD ROWS); none is dealt or hidden. (Of two offered: "All of the squad's attacks", not a hand of a few.)
19. **Recharge turns come from today's wait times:** each move's wait or wind-up in seconds today becomes a number of turns, by one rule, so stronger moves still take longer; the owner can then change any card. (Of three offered: "From today's wait times", not set one by one, not the same for all.) *The rule's ratio (e.g. 2 seconds a turn) is a number for the owner to approve.*
20. **The enemies act fastest first**, by the speed each creature already has. (Of three offered: "Fastest first", not a fixed order, not random.)

21. **One turn is worth 2 seconds of today's wait times** (the ratio of §2.19: a move that waits 4 s recharges in 2 turns). (Of three offered: "2 seconds = 1 turn", not 1 s, not 3 s.) *How a fraction is rounded (a 3 s move: 1 turn or 2) is the agent's to propose.*
22. **A follower that goes down is out until the battle ends:** its column greys out and its cards cannot be played; afterwards it comes back as a fallen follower does now. (Of two offered: "Out until the battle ends", not a REVIVE card.)
23. **The whole squad down: as the game does now:** the battle ends and the followers fall as they do today (back at the Crystal, waiting for you); no new penalty. (Of two offered: "As the game does now", not the cube knocked out too.)
24. **The first playable version is built in the 3D game, behind a switch** (`?engine=3d` with a card-battle switch on; the normal game untouched until the owner says otherwise). (Of three offered: "In the 3D game, behind a switch", not the 3D test page, not the 2D game.)

25. **Every follower has its own basic attack card**, in its own column, like its other attacks (the owner: "The basic attack should just be like another card ... obviously every creature has it, so it would be there"). It is always ready, so every follower always has a card to play. There is no shared squad card and no choosing which follower does it. *(This replaces §2.13 and the mockup's single BASIC ATTACK card at the far left of SQUAD ROWS, §2.9.)*

26. **Entering a battle, the camera shifts its angle** (the owner: "whenever you enter a battle, like maybe the camera shifts its angle"), as well as zooming in (§2.6), so a battle is framed apart from exploring; leaving it, the camera returns. *The angle itself (e.g. lower and more side-on, the squad on one side and the enemies on the other) is to be shown in the first playable step for the owner's choice. This is a battle-only move: it does not undo the owner's answer for exploring on the 3D test page (2026-11-16: the camera stays near the player and the player turns it, `STYLE-EVOLUTION.md` §6.6).*

27. **Choosing an enemy that is far away:** the player moves towards it, the screen goes **black**, and the player is **teleported right in front of the creature, in the battle screen** (the owner: "If the player selects an enemy that's far away, the player should move towards it, and the game should black screen and teleport the player right in front of the creature in the new battle screen"). The squad comes with the player (§2.7). A near enemy, or one that attacks you, starts the battle where you stand, with no black screen (§2.5, §2.6, §2.26). *What counts as far, how long the walk and the black last, and how close in front of the creature the squad lands are numbers for the first playable step, for the owner to judge.*

## 3. Must-have requirements
- Choosing a card is the player's only required decision each turn; it must be quick to read on an iPad (big cards, one tap).
- Every card shows whose it is, what it does, and whether it is ready (and if not, in how many turns).
- The battle screen shows every unit in the battle, its health, and whose turn it is.
- A battle always ends (all enemies down, or the squad down, or leaving: §11).

## 4. Non-goals (for now)
- Changing exploration (real time), the facility, recruiting, breeding, the energy and equip cards' own rules.
- New numbers: every number is the owner's to approve (§11).

## 5. Optional / future ideas (not approved)
- Combos (two followers' cards played in sequence), a deck to build, card upgrades from the game's equip cards.

## 6. Dependencies and affected systems
- **The fight's rules** (`COMBAT.md`, `npc.js`, `elements.js`, `evolution.js`): followers and creatures attack on their own today; in a battle they wait for turns.
- **Each form's moves** (`FOLLOWER-COMBAT-REDESIGN.md`, `moves`): everyday attack, second attack(s), Ultimate become cards; today's wind-ups and wait times become turns.
- **The Ultimate meter** (`elements.js` `followerUltimate`), **the squad bar's Ultimate tab** and **the attack card's panel** (`mixtool.js`, `party.js`): replaced or reshaped in a battle.
- **The battle view** (`battleview.js`; `BATTLE-LOOK.md`): the zoom and blur exist in 2D; the 3D view (`VIEW-3D.md`) has a battle camera on its test page.
- **The player's own part** (`PLAYER-COMBAT.md`: the gun, GUARD, STUN DIVE, the repair kit): open (§11).
- **Saves:** a battle in progress is not saved yet (open).

## 7. Edge cases and failure behavior (to settle in design)
- A creature that is not in the battle wanders into it; a creature that joins mid-battle (it should not: §2.6).
- A follower that is down: its cards greyed out.
- No enemy left mid-turn; the squad wiped out; the player leaving the battle area.

## 8. Acceptance criteria (for when it is built)
- Starting a battle (either way) zooms and blurs; others walk past and never act in it.
- Each turn exactly one card is played, then every enemy in the battle acts once.
- A used card shows its turns to recharge and comes back after them; the basic attack is always playable.
- The battle ends correctly in every case of §7.

## 9. Implementation notes
**Step 1, built in `2026-11-17d`: how a battle starts and how it looks** (the owner: "Build it"). `js/cardbattle.js`. **No cards and no turns yet:** inside a battle the fight is still the real-time one until steps 2 and 3 replace it.
- **The switch:** `?cards` with `?engine=3d`, and only while the 3D view is drawing the room (`view3dShowing`). Off: nothing happens, and the game is as it was.
- **Starting** (§2.5): a tap on a creature (`js/targeting.js` `targetPress` asks `cardBattleTap` first) or a creature's hit on you or yours (`js/helpers.js` `applyDamage` tells `cardBattleHit`). The battle takes that creature and those within `CARD_BATTLE.group` (3.5) tiles of it, at most `most` (4).
- **A far enemy** (§2.27): farther than `far` (6 tiles): you walk towards it (`facilityWalkTo`) for `walk` (36) frames, the screen goes black (`blackIn` 14 frames, held `blackHold` 8; a page element, `#cbBlack`), and in the black you land `land` (2.2) tiles in front of it, at the first spot round it that is open floor in its room and in its sight; your squad round you; then the black lifts (`blackOut` 22).
- **The camera** (§2.26, §2.6): `cardBattleCam` (eased over `easeIn` 40 / `easeOut` 36 frames) reaches the 3D view through its bridge (`view3d/gamemap.js` `battleCam`); `view3d/gameview.js` `place` eases the camera to the middle of the fight, down to `pitch` 17° (the game's own is 30°), turned `yaw` 0.6 radians to the side, `zoom` 1.55 nearer. Off the game's own camera the 2D drawn over the picture waits (bars, labels, floor marks), as while the camera swings (`swinging`).
- **The edges** (§2.6): `cardBattlePost` blurs (HIGH) and darkens the 3D picture's edges, made as the battle view makes its own (`js/battleview.js` `_bvCv`, `_bvRing`), from the 3D view's canvas. The 2D battle view stands aside during a card battle.
- **Walking past** (§2.6): a creature not in the battle picks no prey among you and yours (`js/predator.js` `predatorPreyOk` asks `cardBattleBars`), and stops going for you as the battle starts; your squad (`js/npc.js`) and your gun's own pick (`targetNearest`) go only for the creatures in it (`cardBattleMayTarget`).
- **Ending:** every creature in it down or gone; your squad all down (§2.23: their fall as now); you `leave` (14) tiles from it; or **RUN**, step 1's stand-in: a button at the right (`#cbRun`). The enemies' last hit (§2.16) comes with the turns. For `calm` (240 frames, 4 s) after a battle the creatures that were in it start nothing and go for nobody (else their real-time blows started a new battle at once).
- **Every number above is the agent's, provisional**, for the owner to judge on the iPad (§11.11).

**Step 2, built in `2026-11-17e`: the battle screen, SQUAD ROWS** (the owner: "2", of carrying on with card battles or the 3D rooms; the 3D rooms are another session's). `js/cardbattle.js` `cardBattleScreen`, `cardBattleCards`; its look in `game.html` ("CARD BATTLES, the battle screen"). **The cards show; they are not played yet** (dragging one onto an enemy and the turns are step 3).
- **Up while a battle is on** (not during the walk or the black): `body.cb-on`. The rest of the HUD at the bottom and the right is out of its way (the squad strip, the orders and the enemy card, THE CORE, the PACK and CARDS, the dock, the room's tag; the network panel waits). The quest box and the dialogue at the top left stay.
- **The enemy list, top right:** each creature in the battle, its name and health (not its next move, §2.15); **RUN** under it (it was a button at the right in step 1).
- **The band along the bottom:** a column for each member of the squad (and the Mutator's clone), in its element's colour: its picture, name, level, health; then **its cards**:
  - **BASIC ATTACK** (§2.25), always ready: named after its everyday attack where the form has one (a Mage's shot: FIREBALL, CHAIN LIGHTNING; the Thermite Burrower's BURROW STRIKE), with that attack's effect line (`SHOT_INFO`); otherwise "BASIC ATTACK", "Its everyday hit."
  - **Each second attack it may use** (`evoMoveIds`, `evoMoveAllowed`: BASH before it evolves), its effect line (`MOVE_INFO`), **RECHARGE n TURNS** (its wait time, `MOVES[id].windup`, at `turnSec` 2 s a turn, a part of a turn counted whole: the agent's, open), and **READY** or, while it cools down in today's real-time fight, the turns left.
  - **Its Ultimate** (§2.11), its effect line (its INFO card's), a gold meter with the charge, **READY** when full.
  - A member that is down: its column greyed, no cards (§2.22).
- **Refreshed** 4 times a second (`every` 15 frames), rebuilt only when what it shows has changed.
- **Upright** (an iPad held tall): the band is taller and a column's cards stack.
- **Seen in a real browser** (1180 × 820 and 820 × 1180) with the Jelly Ram, Stonepetal and Rimestar against three ants. **Two things seen, not changed:** a one-time tip (REEF IS READY) can open over the battle; the members' pictures came out as plain discs in that browser (the forms' pictures did not load there), to be checked on the iPad.

## 10. Verification record
- **Step 1 (`2026-11-17d`):** `tests/cardbattle.js` (9 checks, the game's logic in the sandbox): off without the switch or the 3D view; a near creature starts it where you stand, with the creatures round it (at most four); a far one walks, goes black, lands you and your squad in front of it in its room and in its sight, then eases the camera in, lower and nearer; a hit starts one; outsiders go for nobody of yours, your squad and gun only for those in it; RUN ends it and its creatures stay calm for a while; it ends when its creatures are down; the pieces are wired. **Seen in a real browser** (headless Chromium with software WebGL, at 1180 × 820): the walk, the black, the landing in sight of three ants in the Server Room, the battle camera with blurred edges, RUN, and the camera easing back. **Not playtested; not seen on an iPad.**
- **Step 2 (`2026-11-17e`):** `tests/cardbattle.js` (12 checks now): each member's own cards (the Jelly Ram's BASIC ATTACK, WOBBLE SLAM and JELLY SHIELDS, the Rimestar's with ICICLE VOLLEY and WHITEOUT at 40%, an egg's BASH), the recharge from the wait time, a second attack cooling 2.5 s showing 2 turns, a Mage's named shot as its basic card; the screen up in a battle and down after. **Seen in a real browser** at both iPad sizes. **Not playtested; not seen on an iPad.**

## 11. Open questions
1. ~~**The battle screen's look**~~ *(answered 2026-11-17: **SQUAD ROWS**, §2.9)*.
2. ~~**The player's part in a battle**~~ *(answered 2026-11-17: commands only, §2.10)*.
3. ~~**Ultimates**~~ *(answered 2026-11-17: charged by the meter, §2.11; it fills from hits landed and taken, §2.14)*.
4. ~~**Targets**~~ *(answered 2026-11-17: drag the card onto the enemy, §2.17)*. Still open: playing a move with no single target.
5. ~~**Leaving a battle**~~ *(answered 2026-11-17: a RUN card, §2.12; the enemies get a last hit, §2.16)*.
6. **The numbers:** *(answered in part 2026-11-17: all attacks show, §2.18; recharge from today's wait times, §2.19, at 2 s a turn, §2.21)*. Still open: damage in a turn-based fight (today's numbers as they are, or rescaled), and how a fraction of a turn rounds.
7. ~~**Enemies' turns**~~ *(answered 2026-11-17: one by one, a surprise, §2.15)*. Their order: fastest first (§2.20).
9. ~~**A follower that goes down**~~ *(answered 2026-11-17: out until the battle ends, §2.22)*.
11. **The battle camera's angle** (§2.26) and **the black screen's numbers** (§2.27: what is far, the walk, the black, the landing): shown in the first playable step.
10. **The end of a battle:** ~~the whole squad down~~ *(answered 2026-11-17: as the game does now, §2.23)*. Still open: what you get for winning (XP as now, anything else).
8. ~~**The 2D game or the 3D one first**~~ *(answered 2026-11-17: in the 3D game, behind a switch, §2.24)*.

## 12. History
- 2026-11-11: "Real-time stays" (`BATTLE-LOOK.md`); turn-based battles offered and not chosen then.
- 2026-11-16: the look and combat's direction 1 kept real time, slowed and signalled (`STYLE-EVOLUTION.md`).
- 2026-11-17: the owner's card battles (this page): turn-based fights replace real time in battles.
