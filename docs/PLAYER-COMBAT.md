# The player's part in a fight

- **Status:** Designed (2026-11-11); nothing built yet. Step 1 (the bars come back, the repair kit) is next, then step 2 (GUARD, STUN DIVE).
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-11
- **Branch/build context:** `claude/start-game-project-HSh7Z`, after build `2026-11-11d`
- **Related docs:** `COMBAT.md` (the player's three hits, the bite), `PLAYER-CLASSES.md`, `UNIVERSAL-AND-PLAYER-CARDS.md` (Player cards), `TECHNICIANS.md` (the Photonic Shield, which also stops shots)

## 1. Intent

The owner, 2026-11-11: "I feel like the 3-hit rule is a bit harsh, and I feel like there's no room for compatibility there with just 3 bars. I feel like it would be cool maybe to have the player use items to recharge the bars, but at the same time maybe it would be better if they had more of a role within the combat, and they could block shots for the followers, or swoop in to stun the target. But I don't want to make it too easy."

What it is today (js/config.js `PLAYER_HITS`, js/helpers.js `hurtPlayer`): any hit takes one of three bars, however hard; nothing refills them but a knockout, which sends you back to the Crystal at 5% of its power (at its reserve, the run ends). Chip damage from one fight carries into the next.

## 2. Approved design (2026-11-11, chosen from options)

Offered three directions (A the bars come back; B A plus a part for the player in a fight; C no health, the player a monitor of the battlefield), the owner chose **"B built on A"**. Then, of the details:

1. **The bars come back, slowly**: after **10 seconds** with no creature near you and no hit, **one bar every 8 seconds** (chosen "Slow" over medium and fast).
2. **A repair item** refills one bar, and can be used mid-fight. It comes from **both**: creatures sometimes drop one, and some lie at spots around the facility, coming back a while after they are taken.
3. **GUARD is a stance**: tap GUARD by the dial and you hold up a guard: creature shots aimed at followers near you hit you instead, **a bar each, one a second at most**; you move at **half speed** while guarding; tap again to drop it (chosen over guarding one follower and over automatic body-blocking).
4. **STUN DIVE is a chip, then a tap**: tap STUN by the dial, then a creature a few tiles away: you swoop to it and it is stunned for a moment so the squad can pile on; then the chip rests (as the technicians' abilities work; chosen over a double tap).
5. **The knockout stays**: three bars gone is still back to the Crystal. Protecting the squad costs bars, so it does not make the game easy.

## 3. Must-have requirements

**Step 1: the bars come back, and the repair kit**
- [ ] Out of danger (no creature near you, no hit) for 10 s, a bar comes back every 8 s until all three are back; any hit, or a creature coming near, stops it and starts the 10 s again.
- [ ] The repair kit: a pack item, used from the pack, from a pill by the dial and with a key; it gives one bar back; refused when your bars are full.
- [ ] Creatures sometimes drop one when killed; some lie at spots in the facility and come back a while after they are taken.

**Step 2: GUARD and STUN DIVE**
- [ ] GUARD by the dial, a stance on and off: while it is on, a creature's shot that would hit a follower near you hits you instead (one bar, then the usual grace); you move at half speed.
- [ ] STUN by the dial, then a creature in reach and in sight: you swoop beside it and it is stunned for a moment; then the chip rests.

## 4. Non-goals

- The player has no hit points: bars stay a count of hits.
- No change to the followers' health, the creatures, or the knockout's cost.
- More bars from cards or classes (a later step, once the bars come back: the room to grow the owner asked for).
- Phones (not supported).

## 5. Chosen by the agent, provisional (the owner's to change)

These are written when each step is built, marked provisional: the repair kit's name and look, how often creatures drop one, where the spots are and how long they take to come back, the pill and the key; GUARD's reach round you; STUN DIVE's reach, how long the stun lasts, how long the chip rests, and whether the swoop protects you.

## 6. Affected systems

The player's bars (js/config.js, js/helpers.js `hurtPlayer`, the HUD), the danger test (js/facilityplay.js `facilityEnemyNear`), the pack (js/inventory.js `ITEMS`), drops (js/drops.js), the map's pickups (js/facilitymap.js), the props (a ground model, design/props/models/pickups.js), the dial's chips (js/targeting.js), creature shots (js/predator.js, `targetsGreen`; the shield's stop, js/techabilities.js `techShieldStopsShot`), the stun (js/combat.js `applyStun`), the save (what kits you carry; the spots).

## 7. Edge cases

- A knockout fills the bars as now; the refill never goes past three.
- The tutorial, the Toxic Queen's scripted knockout and the cards that touch the bars (LAST STAND, GLASS CANNON) keep working.
- `?attract` (the website's background) has no player.

## 8. Acceptance criteria

Written per step, with its tests.

## 9. Implementation notes

None yet.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing built yet | Not run | |

## 11. Open questions

1. More bars, or a faster refill, from cards and classes (later).
2. Whether a boss (THE ANT QUEEN, the Toxic Queen) can be stunned by the dive, and for how long.

## 12. History

- 2026-11-11: the owner's question; directions A, B and C offered; "B built on A" chosen; the four details chosen from options (guard stance; chip then tap; both sources; slow refill). Decision record: `DECISION-LOG.md`, "The player's part in a fight".
