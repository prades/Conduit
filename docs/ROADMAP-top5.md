# The Top Five — design and build plan

Five features, shipped one at a time in this order. Each lands as its own
commit with its own test suite and a full green run before it goes up.

| # | Feature | Why this order |
|---|---------|----------------|
| 1 | Element combos | Builds straight on the pylon network that was just reworked (support / disruption, waking). Adds the *blind* status the Tyrant fight reuses. |
| 2 | Overcharge | Small, self-contained, uses the nest gauge and the hold menu. |
| 3 | Night siege modifiers | Hooks into the night lifecycle; Static Storm leans on combos and haste. |
| 4 | Follower bonds | Needs a stable follower id — the biggest data-model change, kept away from the other four. |
| 5 | Brood Tyrant fight | The largest; reuses blind (1), overcharge pressure (2), sieges (3). |

All numbers below are starting values, kept as named constants so tuning is a
one-line change.

---

## 1. Element combos

**The rule.** Two *awake* support/disruption pylons of **different** elements
within link range (`getPylonRange()`, 3 tiles) form a **combo link**. The strip
along the link (1.5 tiles either side, same as a same-element pair) runs that
combo's effect. Each pylon takes part in at most **2** combo links (nearest
first), so a mixed cluster does not become a web.

**Strength.** `1 + 0.25 × (tierA + tierB) / 2` — combos get better as both
networks grow.

**The 15 combos.**

| Pair | Name | On enemies | On your side |
|------|------|------------|--------------|
| fire + ice | **STEAM** | **blind** 90f, 4 dmg/30f | — |
| fire + electric | **PLASMA** | 10 dmg/20f | haste ×1.25 |
| fire + flux | **FIRESTORM** | pull 0.12, 6 dmg/20f | — |
| fire + core | **FORGE** | 6 dmg/30f | shield +6/45f (cap 45) |
| fire + toxic | **NAPALM** | 14 dmg/24f, shred 0.5 | — |
| electric + ice | **CRYO-ARC** | stun 30f every 120f | haste ×1.25 |
| electric + flux | **MAGNETAR** | pull 0.14, 8 dmg/30f | — |
| electric + core | **OVERDRIVE** | — | haste ×1.4, shield +5/45f, ult +2/10f |
| electric + toxic | **CORROSIVE ARC** | 8 dmg/24f, shred 0.45 | — |
| ice + flux | **BLACK ICE** | pull 0.10, slow ×0.3 | — |
| ice + core | **GLACIER WALL** | slow ×0.45 | shield +8/45f (cap 60) |
| ice + toxic | **FROSTBITE** | slow ×0.5, 8 dmg/30f | — |
| flux + core | **BASTION** | pull 0.12 | shield +6/45f (cap 50) |
| flux + toxic | **MIASMA** | pull 0.10, 8 dmg/24f, shred 0.5 | — |
| core + toxic | **ANTIDOTE** | shred 0.5 | heal +2 HP/30f |

Damage and pulls scale by strength. Every effect uses machinery that already
exists (`applyDamage`, `applySlow`, `defenseShredded`, shields, haste,
`frozen`), plus one new status:

**Blind** — `actor.blinded = frames`. A blinded predator drops its target,
cannot start an attack, and wanders; it ticks down in `updateStatusEffects`.
Drawn as a small grey haze over the head. Reused by the Tyrant fight.

**Waking.** A combo link runs while *either* end is awake (same as pairs).
Support pylons still only wake for allies and disruption for enemies, so a
mixed combo wakes for both — the reason to mix.

**Discovery.** The first time a combo forms: banner `◆ COMBO DISCOVERED:
STEAM`. Discovered combos persist in `localStorage` (`conduit_combos`). The
codex gets a **COMBOS** page: 15 rows, undiscovered ones shown as `??? + ???`
with their element swatches hidden — a collection to complete.

**Drawing.** The link is a braided cable of the two element colours
(alternating dashes, animated while awake, dim while asleep) with the combo
name at the midpoint (`cachedText`). Cheap: one path per colour per link.

**Tests** (`tests/combo.js`): table has all 15 unordered pairs exactly once;
two awake different-element pylons form a link, same element do not; out of
range do not; asleep both ends → no effect; each effect class lands (damage,
blind, stun, pull, slow, shield, haste, heal); cap of 2 links per pylon;
discovery fires once and persists; codex lists 15.

---

## 2. Overcharge

**The verb.** Hold a nest you control → the **top** slot of the ring (free when
build mode is off) reads **OVERCHARGE**. It spends **40%** of the grid's
stored energy (all online nests in that grid, via `gridPay`), and for
**8 s (480f)** every pylon drawing on that grid is *surged*:

- turrets fire **3×** as often (`TURRET_FIRE_FRAMES / 3`) at full charged damage
- support/disruption pylons count **+1 network tier** (cap III → "IV" strength
  1.25× on top), and are forced awake for the duration
- surged pylons draw no extra power (the 40% *was* the price)

**Limits.** Needs ≥ 50% stored to fire; **60 s (3600f)** cooldown per grid,
shown on the gauge as a ring filling back up. A nest switched OFF cannot
overcharge.

**Feel.** A white pulse races along every cable from the nest to each pylon
(`drawPowerChain` flow forced to 1 with a travelling bright segment), the
gauge flashes, short screen shake, banner `⚡ OVERCHARGE — 8s`.

**Tests** (`tests/overcharge.js`): the radial offers it only on a held power
source with build mode off; spends exactly 40%; refuses under 50%, when OFF,
on cooldown; turret fire rate triples during and returns after; wave tier +1
during; cooldown persists across the surge; the input release-tap mirror.

---

## 3. Night siege modifiers

**When.** From **night 3** on, each night rolls one modifier when the alarm
starts the night (`triggerAlarm`, inside the `phase !== "night"` block), never
the same as last night. Cleared at the wave reset to day (`nextWave`). Saved in
the session `fight` block so a refresh keeps it.

| Modifier | Effect |
|----------|--------|
| **BLACKOUT** | Nests regenerate nothing (`nestEnergyTick` skips regen). Overcharge is the counterplay you cannot afford. |
| **SWARM TIDE** | Spawns roll nymphs 70% of the time, at half HP, and the per-zone cap is +2. |
| **HUNTER'S MOON** | Every predator spawned hunts pylons (`huntsPylons = true`); pylon HP +25% for the night so it is a fight, not a wipe. |
| **STATIC STORM** | Electric everything ×2 for **both** sides: electric haste and combo haste doubled, electric damage ×2 including predators' electric hits, turrets of electric element fire 2×. |

**Announce.** At the start of the night a centred banner with the modifier's
name and one line of what it does; a small tag under the wave banner for the
rest of the night (`waveUI` gets ` · BLACKOUT`).

**Tests** (`tests/siege.js`): no modifier before night 3; one per night from
3; never repeats back to back; each modifier's effect is on during the night
and off after `nextWave`; saved and restored.

---

## 4. Follower bonds

**Identity.** Every follower gets a stable `uid` (`++followerSerial`) in all
four constructors (spawn, crystal arrival, respawn, save restore); carried
through `respawnQueue` and the wave-transition save. Re-rolling keeps the uid
but **breaks the bond** — they are a new person.

**Forming.** Each follower tracks time fought *beside* each squadmate: every
30 frames, if it is in combat (attacked or attacking within the last 120f)
and another unbonded follower within **2.5 tiles** also is, that pair gains
1 point. At **40 points** (≈ 20 s of fighting side by side) they bond:
banner `♥ BLAZE & VOLT BONDED` (names from element + uid). Max one partner
each.

**While together** (within 3 tiles): **+15% damage**, **−10% damage taken**
(hooks in `applyDamage` next to the existing follower multipliers), and a
thin link line drawn between them in the overlay pass.

**Revenge.** If one dies, the survivor goes into **RAGE** for **10 s**:
+50% damage, +30% speed, red tint, then the bond is gone (the dead one
respawns unbonded).

**Duo ultimate.** If both partners have a full ultimate bar and are within
3 tiles, the double-tap fires a **duo ultimate** instead — both elements'
ultimates at 1.3× power, centred between them, banner `DUO: FIRE × ICE`.
Both bars empty.

**Saved** across waves and refresh (uid, partner uid, bond points).

**Tests** (`tests/bonds.js`): uids unique and survive respawn/save; points
accrue only in combat and in range; bond forms at threshold, one partner max;
bonuses apply only within range; rage on partner death and expiry; re-roll
breaks the bond; duo ultimate fires only with both bars full and close.

---

## 5. The Brood Tyrant fight

**Phases** by health:

| Phase | HP | Behaviour |
|-------|----|-----------|
| **I — BROODMOTHER** | 100–66% | Current behaviour plus a summon every 12 s: 3 nymphs in a ring (respecting the predator budget). |
| **II — BURROW** | 66–33% | Every 15 s it **burrows** for 3 s (untargetable, invisible but for a moving dirt mound), then erupts under your nearest pylon: 120 damage to the pylon, knockback and 30 damage to units within 1.5 tiles. |
| **III — ENRAGED** | < 33% | +40% speed, attacks 2× as often, summons every 8 s, red aura. |

**Weak point.** The Tyrant's carapace takes **50% damage**. While a
**disruption pylon is awake within 3 tiles of it**, the carapace cracks: it
takes **150%**, drawn as glowing cracks and a `▼ EXPOSED` tag. The fight is
about dragging it into your disruption net, or building one where it burrows.

**Untargetable.** New `untargetable` flag honoured by `isHostileTarget`,
followers' target scans, turrets, pylon effects and `applyDamage`.

**Health bar.** A boss bar at the top of the screen while it is alive and on
screen: name, phase pips, EXPOSED state.

**Trophy.** On death it drops **TYRANT HEART** — permanent (localStorage):
unlocks the **Brood Pylon**: a disruption pylon of any element that also
**blinds** (combo-style) — or, simpler for v1, a permanent **+1 to the link
range** of every pylon. v1 ships the range bonus; the Brood Pylon is a
follow-up.

**Tests** (`tests/tyrant.js`): phase changes at the thresholds; summons honour
the budget; burrow makes it untargetable to every targeting path and it
resurfaces at a pylon; carapace 0.5× / exposed 1.5× with an awake disruption
pylon in range; enrage numbers; trophy drops once and persists; boss bar.

---

## Cross-cutting

- **Performance:** every per-frame loop is over the cached pylon/link lists
  (rebuilt every 60f), never `world`; overlay drawing uses `cachedText` and no
  `shadowBlur`.
- **Docs:** each feature updates the in-game index (`game.html`) and codex.
- **Process:** per feature — write tests with the change, revert-check them
  (the test must fail with the feature removed), browser screenshot, full
  suite green, then commit and push.
