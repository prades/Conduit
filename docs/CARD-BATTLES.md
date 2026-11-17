# Card battles (turn-based, one card a turn)

- **Status:** **Designed in direction** (the owner's rules below, 2026-11-17); the battle screen's look is at the mockup stage; **nothing is built.**
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
None yet: mockups first (§2.8).

## 10. Verification record
None: nothing is built.

## 11. Open questions
1. ~~**The battle screen's look**~~ *(answered 2026-11-17: **SQUAD ROWS**, §2.9)*.
2. ~~**The player's part in a battle**~~ *(answered 2026-11-17: commands only, §2.10)*.
3. ~~**Ultimates**~~ *(answered 2026-11-17: charged by the meter, §2.11; it fills from hits landed and taken, §2.14)*.
4. ~~**Targets**~~ *(answered 2026-11-17: drag the card onto the enemy, §2.17)*. Still open: playing a move with no single target.
5. ~~**Leaving a battle**~~ *(answered 2026-11-17: a RUN card, §2.12; the enemies get a last hit, §2.16)*.
6. **The numbers:** *(answered in part 2026-11-17: all attacks show, §2.18; recharge from today's wait times, §2.19, at 2 s a turn, §2.21)*. Still open: damage in a turn-based fight (today's numbers as they are, or rescaled), and how a fraction of a turn rounds.
7. ~~**Enemies' turns**~~ *(answered 2026-11-17: one by one, a surprise, §2.15)*. Their order: fastest first (§2.20).
9. ~~**A follower that goes down**~~ *(answered 2026-11-17: out until the battle ends, §2.22)*.
10. **The end of a battle:** ~~the whole squad down~~ *(answered 2026-11-17: as the game does now, §2.23)*. Still open: what you get for winning (XP as now, anything else).
8. ~~**The 2D game or the 3D one first**~~ *(answered 2026-11-17: in the 3D game, behind a switch, §2.24)*.

## 12. History
- 2026-11-11: "Real-time stays" (`BATTLE-LOOK.md`); turn-based battles offered and not chosen then.
- 2026-11-16: the look and combat's direction 1 kept real time, slowed and signalled (`STYLE-EVOLUTION.md`).
- 2026-11-17: the owner's card battles (this page): turn-based fights replace real time in battles.
