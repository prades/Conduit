# Changelog

What changed, build by build, newest first. Each entry names its commit (`git log`); the full account of a change is in that commit's message, in the revision section of the design document it names, and in the game bible (bible.html), which quotes the code's own numbers. A build is stamped on game.html (`?v=`), js/config.js (`BUILD_VERSION`) and bible.html; the letter after the date is the build of that day.

## 2026-11-02

- **f · Build C: breeding draws the element and the class; Side Quest drawn as the void walker** (the owner's design of 2026-11-02, NEXT-UPDATE.md Build C, CONVERSION.md and SEWER-QUEST.md; the owner, in a prompt: "Push d and e to main", "Build C first"; on the branch only; commit named in git log).
  - **Main:** builds d and e and the following update's draft (commit 55309c0) went to main at the owner's word.
  - **An offspring's element** is an even toss between its two parents' current elements (js/breeding.js `breedElement`).
  - **Its class** is an even draw among the three, Brawler, Mage and Technician, whatever its parents are (`breedClass`). Its personality is then one of that class's, picked at the Crystal as a recruit's is.
  - **The draws are seedable:** `breedMake(f, rnd)` takes every draw from one source, in the order element, class, then the stats' variations.
  - **The lead parent no longer decides** (`breedLead` and `breedType` are gone). The price, the roster's two taps, the formula and the provenance are unchanged.
  - **The cap meets more offspring:** a child of another class than its parents can inherit a mean past twice its own number, and that stat is then the cap (two Brawlers' cautious Mage: ATK 16). The formula is as before.
  - **Side Quest is drawn as the void walker,** the old flux worker's form, from `img/evo/hauler.png`, in place of the small saucer drawn in code (js/sidequest.js):
    - in the world, standing on his platform, turned toward you, at the evolved followers' scale and idle beat, over his shadow, with his glow and plate in his colour;
    - in the dialogue box, the same sheet facing you (a reading: the design named only his sprite);
    - his station's ring now sorts under his feet, so it no longer films over his body;
    - the sheet is asked for when he appears; until it arrives, his shadow and plate stand alone.
  - **The in-game guide** says the new breeding rule and calls him the void walker on the north ledge's platform. Its sentence on the Vital items, removed on 2026-11-01, is gone.
  - **Tests:**
    - tests/followerprog.js:
      - the draws as pure functions;
      - 600 seeded offspring of a fire Brawler and an ice Mage: half and half by element, nothing else, a third of each class, and the same seed giving the same sequence;
      - "better raised" measured where the cap cannot bind, and exact where it always binds;
      - "the act" with the parent in view two levels up, so the lead no longer decides.
    - tests/sidequest.js: his look in the world and the dialogue box, with the sheet in and not in.
  - **The full run:** all 86 suites passed, first time (the frame budgets in tests/perf.js included).
  - **Written up:** docs/FOLLOWER-PROGRESSION.md, docs/CONVERSION.md, docs/SEWER-QUEST.md, docs/NEXT-UPDATE.md, docs/FOLLOWING-UPDATE.md, docs/OPEN-QUESTIONS.md (§1o, the readings), docs/DECISION-LOG.md, docs/UI-STYLE.md, docs/TUTORIAL.md, docs/UNIVERSAL-AND-PLAYER-CARDS.md, the Bible.
  - Not playtested.

- **e · The aura's ring on the floor, off the walls** (the owner, in a prompt: "It shouldn't show up on the walls either"; on the branch only; commit named in git log).
  - **The ring is drawn on the floor of the Mage's room:**
    - It is drawn tile by tile in the floor's own pass (js/cards.js `equipAuraOnTile`, called by js/game.js beside the Frost Patch's).
    - Each floor tile of the room that the ring crosses draws its piece, cut to the tile.
    - The walls, props and units in front of it cover it, so it shows on no wall and in no other room.
    - Build d clipped an overlay ring to the room's outline, which still crossed the room's front walls.
  - **The glints** stay with the world's overlays, beside their units (js/cards.js `equipAuraDraw`).
  - **Tests:** tests/classcards.js checks three things:
    - a tile the ring crosses draws its piece, cut to the tile, and a tile it does not cross draws nothing;
    - a ring tile in the next room draws nothing;
    - the overlay draws only the glints, and the floor pass calls the ring's drawing.

  - **The full run:** 85 of 86 suites passed. The 86th, tests/carousel.js, failed its known check at 1180 px ("a name is cut": its recruits have random names, and a long one is cut; docs/OPEN-QUESTIONS.md §4). It passed when run alone. It touches nothing this build changed.
  - **Written up:** docs/UI-STYLE.md, docs/UNIVERSAL-AND-PLAYER-CARDS.md, docs/OPEN-QUESTIONS.md, docs/TUTORIAL.md, docs/DECISION-LOG.md, the Bible.
  - Not playtested.

- **d · The owner's answers on Build B: the CROWN's chance 10%; an aura stays in its room** (the owner, in a prompt: "Push to main", "Raise to 10%", "It shouldn't be displayed or affected in other rooms", "Both count"; on the branch only; commit named in git log).
  - **Main:** Build B (`c`, commit 2fc7518) went to main at the owner's word.
  - **A CROWN's status chance** is 10% (it was the first guess, 5%). The cards' words say so.
  - **An aura stays in its Mage's room:** a follower or the clone within 4 tiles but through a wall, in another room, gets nothing.
    - js/cards.js `_equipAuraTick` asks js/facility.js `facilityRoomAt`.
    - Two units outside every room count as one space.
    - The cards now read "WITHIN 4 TILES IN ITS ROOM".
  - **The ring is cut to the Mage's room** (its floor's outline), so it is no longer drawn over the corridor or the next room. Inside its room it still draws over the room's front wall blocks, as any overlay does.
  - **Two different auras of one element on one Mage both count**, as built (confirmed).
  - **Tests:**
    - tests/classcards.js puts every unit in one room (a spot in the arena) and checks the 10%.
    - Two checks are new: a wall stops an aura (a follower and the clone in the next room get nothing), and the ring is clipped to its room's outline.
    - The Bible's numbers follow. The full run: all 86 suites passed.
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md, docs/UI-STYLE.md, docs/TUTORIAL.md, docs/NEXT-UPDATE.md, docs/OPEN-QUESTIONS.md §1m, docs/DECISION-LOG.md, the Bible.
  - Not playtested.

- **c · Build B: the class card families; Series 2 reshaped; the Universal kind retired** (the owner's design of 2026-11-02, UNIVERSAL-AND-PLAYER-CARDS.md section 2 and NEXT-UPDATE.md Build B; the owner, in a prompt: "Push b to main", "Start Build B"; on the branch only; commit named in git log).
  - **Main:** build b (commit e43e599) went to main at the owner's word.
  - **Mage auras (18):** each element's BAND (Refined, +5%), SIGIL (Precision, +7.5%) and CROWN (Prototype, +10%).
    - A Mage of the element wears one. Every follower within 4 tiles of it, of any element and class, the Mage and the Mutator's clone included, gets that much more ATK.
    - A CROWN also gives each of their hits a 5% chance (a first guess) of the element's own status.
    - Different auras add up; the same card counts once, even from two Mages.
    - Who is in reach is worked out every 30 frames; enemies never get one.
  - **The look** (for the owner's approval): a faint, thin dashed ring in the element's colour turns slowly round the Mage at its reach, and a tiny glint of that colour shows beside each unit in it.
  - **Brawler opportunity cards (3):** PRESSURE SPUR +20%, FAULTLINE TALON +30%, RUPTURE FANG +40% for each weakness a hit exploits, added up. The four kinds: an element match-up, a race weak to the hit's physical type, a race weak to Elemental, a stunned or sleeping target.
  - **The Technician's family:** Series 2's four cooldown cards, unchanged.
  - **Series 2 deals 45:** the 20 species cards, the Technician's 4 and the 21 new ones. Its price and odds stay.
    - Its eight Brawler and Mage class cards are cut, and Cleave and Chain with them (their code stays, worn by no card).
  - **The clean-up:**
    - A collection drops its cut cards in the same write that keeps ◆1,000 owed for each (◆8,000 at most).
    - The refund is paid into the next run's shards, at once if one is in play, with a line on the screen, once.
    - A run's hand, its cards found, the market's shelf and every slot drop the cut cards as they load.
  - **The Universal kind is retired:** the player's two slots take Player cards only (PLAYER CARDS ONLY), so they stay empty until the Player cards come. The two test cards that were Universal are Player cards.
  - **On the CARDS screen:** an aura's kind reads CLASS · FIRE MAGE and its cube is in its element's colour; a Player card is gold; sorting by element puts a Mage's auras after its other cards.
  - **Readings for the owner to confirm** (docs/OPEN-QUESTIONS.md §1m):
    - the same aura is the same card;
    - two opportunity cards add;
    - the CROWN's status uses Pack 1's Precision numbers;
    - the clone's whole hit grows;
    - the ring is drawn over the floor and the units;
    - the refund shows a line.
  - **Files and tests:**
    - js/cards.js: the cards, who wears them, the aura tick and its drawing, the opportunity share, the clean-up and the refund.
    - js/damage.js: the openings. js/helpers.js: the clone's aura, and who reaches the on-hit effects. js/game.js: the drawing's call.
    - js/cardsui.js, js/cardart.js and js/commandcenter.js: words and colours.
    - New: tests/classcards.js (30 checks). Updated: cards, series2, series2abilities, packs, crystalline, cardart, bible, squadfly and market (the retired Universal test card). tests/run.js registers the new suite (86 suites).
    - Full runs: the second passed all 86 suites. The first had 83 of 86:
      - tests/squadfly.js wore the retired Universal test card, so it was fixed to wear the first card that fits;
      - tests/packs.js's two-tap unlock on the stage failed once (it passed alone twice and in the second run);
      - tests/sewerquest.js's FRANTIC "let go" check failed once (it passed alone and in the second run).
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md (status, must-haves, acceptance, implementation notes, verification), docs/SERIES-2.md, docs/NEXT-UPDATE.md, docs/OPEN-QUESTIONS.md §1m, docs/DECISION-LOG.md, docs/TUTORIAL.md, docs/UI-STYLE.md ("The Mage auras in the world"), and the Bible (the class card families, the counts).
  - Not playtested.

- **b · The hit words beside the creature; the owner's answers on Build A** (the owner, in a prompt: "Push to main", "Move beside the creature", "Keep the ticks", "Approve all 21"; on the branch only; commit named in git log).
  - **Main:** Build A (`a`, commit 2583f5a) went to main at the owner's word.
  - **The hit words** (SLASHING WEAK!, FIRE RESIST) now sit beside the creature: to its right at its body's height, the physical part's word over the elemental part's, clear of its name plate. They drift up slowly (about 18 px in their 40 frames).
    - js/damage.js `_dmgWords`.
    - js/drops.js: a world text can be offset sideways in pixels (`dx`), as it could be upward (`dy`).
  - **BLINDING DUST** keeps its small toxic ticks; COMBAT.md §7.8's enemy table, which said "no damage", is corrected.
  - **The 21 new card names** for Build B are approved as drafted (UNIVERSAL-AND-PLAYER-CARDS.md).
  - **Tests:** tests/damage.js checks the words' place.
    - The full run: 84 of 85 suites passed.
    - The 85th, tests/carousel.js, failed one check at 1180 px ("a name is cut"). Its recruits get random names, and a long one is cut. It passed both full runs of build a and two of three re-runs alone. It touches nothing this build changed (docs/OPEN-QUESTIONS.md §4).
  - **Written up:** docs/COMBAT.md §7.8 and §7.10, docs/OPEN-QUESTIONS.md, docs/NEXT-UPDATE.md, docs/DECISION-LOG.md, docs/UNIVERSAL-AND-PLAYER-CARDS.md.
- **a · The damage system: six damage types, weaknesses and resistances, every follower hit part physical and part elemental** (the owner's design of 2026-11-02, approved in prompts, docs/COMBAT.md §7; docs/NEXT-UPDATE.md Build A, "Damage first"; on the branch only; commit named in git log).
  - **Six types:** Slashing, Piercing, Projectile, Crushing, Earthquake, Elemental. Every attack in the game says which it is (COMBAT.md §7.10 lists them): a follower's by its form (§7.4), a creature's by its race (§7.8), yours and the turrets' by the weapon (§7.8).
  - **Weak ×1.3, resists ×0.7:**
    - each creature race by its row (§7.3), a boss by its race's;
    - each follower by its subclass (§7.8), the clone by its race;
    - an egg, the player, the turrets and the Crystal have no row.
  - **A follower's hit is part physical, part elemental:** its number × (½ ATK + ½ SP.ATK). An Elemental attack takes ¼ and ¾, and its physical quarter has no type.
    - The physical part meets the row by its type.
    - The elemental part meets the row's Elemental and the element triangle.
    - Ice on core: the elemental part does nothing, the physical part lands (it did nothing at all).
  - **Enemies' hits** are all physical; the toxic brood's and the Queen's are half and half. **Your hits** are all of their type.
  - **Stats:** evolving raises SP.ATK by 1.25 too, and each evolved form leans its stats 10% a step (§7.7). Nothing new is saved.
  - **The retune:** each attack's number is scaled so a follower at its class's average stats does what it did before, its form's lean included.
  - **On screen, a word per part:** SLASHING WEAK! in gold, FIRE RESIST in blue, ICE IMMUNE. They stack over the hit's number, one set per target every 12 frames. A hit that says nothing (a tick, a card's echo) keeps the old WEAK! and RESIST.
  - **Measured before and after** (COMBAT.md §7.10, tests/measure_damage.js):
    - Class damage holds: Brawler 475 → 477, Mage 254 → 259, Technician 159 → 168 (the race chart favours their Crushing and Piercing).
    - A Mage now swings with the race (moth +27%, scorpion +18%, spider −17%, ant −22%).
    - Of §1's six fights, four end the same. The fire Technician (a drone, weak to the beetle's Crushing) falls 1.9 s sooner. The flux Mage (a mollusk, resisting the moth's Crushing) lasts 3.7 s longer.
    - The measuring harness was made leak-free first (§7.10).
  - **Readings for the owner to confirm** (docs/OPEN-QUESTIONS.md): BLINDING DUST's ticks were kept; an egg Mage's shot is Projectile; a player's elemental weapon keeps the triangle on the whole hit; the words' place on screen.
  - **Files and tests:**
    - New: js/damage.js, tests/damage.js (25 checks), tests/measure_damage.js (a measurement, run by hand).
    - Tests updated:
      - evolution, techabilities, crystalline, packs, technomancer (the punch is Crushing, the arc Elemental) and techlevel1 (the drill) work their references out by the new rules;
      - abtest, facing and weapon load js/damage.js into their hand-built sandboxes;
      - ultimate's check that `applyElementalDamage` still funnels into `applyDamage` allows the hit argument.
    - The full run (85 suites) passes.
    - Written up: docs/COMBAT.md §7 (§7.10 new), docs/NEXT-UPDATE.md, docs/OPEN-QUESTIONS.md, and the Bible (the damage types, the punch, evolving).
    - The INFO and the game index say evolving raises special attack too.

## 2026-11-01

- **n · Pack 1's eighteen card items for everyone** (the owner: "Yes push the card art for everyone"; commit named in git log).
  - The seventeen items baked in build k are approved (js/cardart.js `CARD_ITEMS.approved` lists all eighteen): every Pack 1 card shows its own 3D item, without the preview flag, in the collection, the shop, the market, a pack's reveal and the roster's card lists.
  - Series 2's 32 cards and the six Crystalline cards keep their crystal or cube until their own items are made. The preview flag (`?cardart=items`) still works for any piece baked later.
  - Tests updated: cardart (all eighteen approved and shown without the flag; the preview rule kept). Written up: docs/UI-STYLE.md "The card items", docs/OPEN-QUESTIONS.md §1k (answered), the Bible (and its card pictures).
- **m · The card items smaller, clear of the sort bar** (the owner, of Pack 1's eighteen items in the new collection: "They're a little bit too big. They're blocking the buttons above it for sorting"; commit named in git log).
  - Each item is 140 × 176 (it was 168 × 212) and rises 16 px past its card's top edge (it was 48); on the collection's stage it is blown up to 1.06 (it was 1.2), with a softer pop on arrival.
  - The stage has 14 px of room above it, and the SHOW / SORT BY bar is drawn over a card's art: no item reaches the bar, through its arrival and its hover (all eighteen measured at 1180 × 820 and 1024 × 768).
  - The seventeen new items are still on preview (`?cardart=items`) until approved. Tests updated: cards (the item clears the bar), cardart. Written up: docs/UI-STYLE.md "The card items".
- **l · The CARDS screen in two menus, the cards taken into the run lit gold, YOU on the roster, a pack's reveal** (the owner: "the items in the shop are in a new menu on the card menu called shop", "the player may view all the cards that are in the game with the same scroll mechanics", a pack's cards "in a straight row with the rarest card ... illuminated from the back", then "the hand part should be out of the picture ... an illuminated background that is yellow, matching the purchased button color scheme ... a new player icon and player card in the roster"; commit named in git log).
  - **Two menus** (js/cardsui.js `_cdTabs`): CARDS, the collection; SHOP, the booster packs and the market. The rows of big cards for the hand and the cards found are gone: those cards are on the collection's rail.
  - **The collection** shows OWNED (kept for good and found this run) or ALL (every card in the game, each unlockable from the stage). Nothing is beside its stage: a first draft's notch of the hand and the bordered panel with the player's slots were taken out at the owner's word.
  - **A card taken into the run is lit gold from behind** (the buttons' gold, `#ffe733`): on its mini card, on the stage, and its buttons. Found cards are marked teal now.
  - **YOU on the roster** (js/commandcenter.js): the strip's first tile is the player; in view, the player's card (its hits, its two cards) with YOUR SLOT 1 and YOUR SLOT 2 beside it (Universal cards only).
  - **A pack opened** (`_cdRevealBox`): an overlay the sheet shows through; the pack drops in and bursts, its cards rise out of it one by one into a straight row that fills the screen, each tagged NEW or DUPLICATE, and the rarest is lit from behind. CONTINUE, a tap or Escape closes it.
  - Tests updated: cards (the two menus, the gold, YOU), packs (the reveal), market, cardart. Written up: docs/UI-STYLE.md, docs/TUTORIAL.md, docs/OPEN-QUESTIONS.md §1l (one open question: no real card fits the player yet), the Bible (three new pictures).
- **k · Pack 1's other seventeen card items, on preview** (the owner: "we'll design the 3D items for the next 17 pack 1 cards right now"; commit named in git log).
  - Each of Pack 1's cards now has its own 3D item, modelled in the look of the approved EMBER PLATING and baked like it (design/cards/models, img/cards): from FURNACE HEART and CINDERBRAND to STATIC LOCK, PERMAFROST SHELL, VORTEX CORE and REPULSOR PULSE. They are listed in docs/UI-STYLE.md "The card items".
  - They show only with `?cardart=items` until the owner approves each (js/cardart.js `CARD_ITEMS.ids` lists all eighteen, `approved` only Ember); everyone else still sees the crystal (docs/ART-PROCESS.md).
  - The owner kept Series 2's price and odds and the eight Lustrous drafts (4e904ee).
  - Tests updated: cardart (the eighteen baked and each with its model and picture; the seventeen on preview only). Written up: docs/UI-STYLE.md, docs/OPEN-QUESTIONS.md §1k, the Bible.
- **j · Series 2 on sale: 32 cards, the Prototype rarity, ◆150 by 50 / 30 / 15 / 5; EMBER PLATING's item live** (the owner: "The ember plating looks good. Series 2. Pick a price and set the odds for the pack and make it to where another rarity is unlocked", then "Prototype unlocks"; c531fe2).
  - **Series 2's cards** (js/cards.js `EQUIP_SERIES2`): four for each of the eight identities (the five species, the three classes), Unrefined to **Prototype**, the fourth tier, which this pack is the first to deal. Unrefined +8% to a stat, Refined +14%, Precision two stats at +10% or a status on a hit (ATTUNED CORE sets its wearer's own element's status), Prototype an ability.
  - **The eight Prototype abilities**: Shell block, Regrowth, Nova, Overclock, Absorb, Cleave, Chain, Double charge. Hooks: js/helpers.js `applyDamage` (a hit about to land on a follower), js/techabilities.js `techCooldown` (the second charge). A Nova, Cleave or Chain strike is an echo that sets off no card.
  - **The pack** (`EQUIP_PACK2`): ◆150 for 4 cards, odds 50 / 30 / 15 / 5, one slot Precision or higher; about one pack in three holds a Prototype (36%). It opens after the purification. Before that its box is on the sheet with the button off, and its cards are not on the market's shelf.
  - All the numbers, price and odds are PICKED (first settings); no one has played them yet. Lustrous, the fifth tier, is a later update (drafted in docs/SERIES-2.md).
  - **EMBER PLATING's 3D item is live**: shown on its card without the preview flag. Each item is now approved on its own (js/cardart.js `CARD_ITEMS.approved`), so the next piece can be previewed with `?cardart=items` while Ember stays on.
  - **Fixed on the way**: the market's shelf could sell Series 2 cards before the pack opened (now `equipPacksOpen`); a jelly card's refusal read "FOR JELLYS" (now JELLIES).
  - New suite: tests/series2abilities.js. Tests updated: series2 (the real pack and cards), cards (56 real cards; the rail's order worked out from the registry), packs, market, crystalline, cardart. Written up: docs/SERIES-2.md (BUILT), docs/OPEN-QUESTIONS.md §1j, docs/UI-STYLE.md, the Bible (the Series 2 cards and pack).
- **i · The collection as a featured card over a rail of mini cards, the first 3D card item, the Series 2 draft** (the owner's asks of 2026-11-01; 2407397).
  - **The collection** (js/cardsui.js): the player slides through a rail of mini cards, and the one in the middle is shown at the top. Shown there, it changes form (it grows out of the mini card), its picture is blown up and its rarity meter lights up segment by segment. Its parts are labelled beside it (name, kind, rarity with a large meter, effect, state, its buttons).
  - **Sorting**: by rarity or by element. A tap, ◀ ▶, the wheel and the arrow keys step through.
  - **EMBER PLATING** is the first card item: a 3D armour plate with ember-hot seams, rising out of its card and hovering, in place of the crystal. It is modelled and baked like the props (design/cards, new; img/cards/ember_plating.png). Per docs/ART-PROCESS.md it shows only with `?cardart=items` until the owner approves the look.
  - **Series 2**: a draft of its 40 items (the eight identities × Unrefined to Lustrous; stats low, abilities high) in docs/SERIES-2.md, PROPOSED. None is in the game.
  - **Fixed on the way**: the rail centres its mini cards correctly, and a finger takes over the rail at once after a tap or a key.
  - Tests updated: cards (the rail and the stage, with a slide, sorting and the labels), crystalline, cardart (the item preview, its model and picture). Written up: docs/UI-STYLE.md, the Bible, docs/SERIES-2.md (new).
- **h · The playtest patch: the Crystal's power, the turrets, the ant raids, whole revivals** (the owner's playtest of build g and their answers; commit named in git log). **The Crystal's power** is its health: a turret's shot 0.1%, a follower's revival 3%, yours 5%; at or below a 10% reserve nothing is paid (a follower waits, your third hit ends the run); idle it refills whole in five minutes; a tap on the network meter (its outer ring is the charge) buys +75% for ◆50 (js/crystalpower.js, new). **The turrets** (the three sentries) run on the Crystal alone, take a raider's bites (500 health), break, and are repaired by standing at one for ten seconds, free; their wear is saved; a turret aims only at what its shot can hit (the hallway one had been firing through the wall at the Experiment Lab's waiting recruit, which with paid shots drained the Crystal). Measured, fourteen raids with nobody defending: the hallway turret alone kills a raid without a tank; most raids with a tank wreck it and the Crystal Chamber's two finish the raid; the Crystal was never bitten. **Ant raids** every three minutes once the Sewers are found: three ants of the arena, turrets first, then the Crystal, while you are away too (js/antraids.js, new). **Followers revive whole**: no HP stat and no XP lost at a death; the **Vital items are removed** (js/vital.js, its items and cases); the Ice Mage's preservation serves the clone. Also: the combat step 3 tiles; ants pay 8 / 9 / 14 / 22 (about 11 a kill); Series 2 unlocks after the purification; the queen's death thins the brood; after the purification the brood loses its toxic element. New suite: tests/antraids.js. Written up: docs/OPEN-QUESTIONS.md (§1h, and a correction: the sentries were working turrets), docs/FACILITY.md, docs/SEWER-QUEST.md, docs/FOLLOWER-PROGRESSION.md, docs/SPECIMENS.md, docs/TUTORIAL.md, the Bible.
- **g · The Nest, the ants, the opened-up Sewers, the clone in the squad, where a tap may send you** (the phase brief "Stability, Nest Implementation, Ant Population & Sewer Expansion"; 360640b, with dafbf18, and after its full run 98812da and 42c69c0). **The Nest**: the Sewers' east end rebuilt as the Toxic Ant Queen's colony (the owner: "Only one queen in sewers for now"): a wide flat trash dam over the water with the console and her post, a reservoir under a big barred arch with its stream, a moat round the dam behind a low spill lip, the waterfall over the east edge (the owner's sketch: "Make a waterfall and another big sewer gate tunnel entrance"), eggs, junk, resin and brood holes; its infestation (infested, stirred, calmed, cleared) read from her encounter and the purification; the zone tag reads The Nest, and you note it the first time. **The ants**: js/population.js, races and spawn tables in stages; the arena is ants only, up out of the overflow grates; the Sewers' brood is the Nest's, up out of its brood holes; the queen's infantry comes from her table (four every 30 s above half her health, none once frantic, unchanged). **The Sewers opened up**: the south ledge three tiles deep, a service bridge for a loop, Side Quest on a lit maintenance platform off the north ledge (was hidden in the south passage); the three sample routes unchanged. **The clone** is a squad member: its own card, picked alone, every order, the squad's XP; it no longer stays behind at a doorway or a load, and SWITCH ROLES leaves it alone. **Movement**: a tap outside the room you are in (and a little way through its doors) is ignored with a ✕; the combat step, as the owner shaped it: no limit with no enemy near, a run stops when it runs into one, then five tiles a tap (Settings → COMBAT STEP). New suites: tests/clonesquad.js, tests/movement.js, tests/population.js. Written up: docs/SEWER-QUEST.md, docs/FACILITY.md, docs/OPEN-QUESTIONS.md (§1g, with the Series 2 unlock reported unchanged), docs/MUTATOR.md, docs/TUTORIAL.md, docs/UI-STYLE.md, the Bible. **Found by the full run, fixed after it:** the calm queen was stirred again by the player standing beside her, the very frame the water cleared (js/predator.js: a calm boss is provoked only by a hit, as documented); three flaky checks in tests/sewerquest.js made deterministic (one of them, a stray pickup of the vial, was in build f too).
- **f · The Hover Shell as a manta** (e9792dc), the owner's yes ("Yes to all") to No. 882 from build e: a long low black dome, square at its front; two long straight trapezoid wings, flat and ribbed, their edges lit yellow from underneath; a manta's mouth open across its whole front, a long straight slot with a jutting jaw and gill plates lit yellow inside; the two launcher prongs on top. It hovers, banking; its action frames fire the launcher, an arc between the prongs and a ring of light out of its mouth. It has no shuttle, so the old separation is gone. Pictures made again: the Bible's Hover Shell card, its roster poster and docs/images/roster-poster.png. Main also took build e.
- **e · The Jelly Ram redone from the owner's pencil sketch** (085798f). The core brawler's head is a faceted glass dodecahedron with a bubble inside lit blue white, small bubbles rising off it; a swirly collar of three wavy bands orbits its neck of jelly; seven fat wavy tentacles, one curled up behind (design No. 881, design/evolutions/forms34.js). It swims as before, every tentacle flicking back at once, and its action frames ram head first. The owner: "The brawler looks good". The Hover Shell from the same sketch is a candidate only: No. 880, then No. 882 on the owner's correction ("wings trapezoidal and a manta ray like mouth open and long and straight"), a manta with long straight trapezoid wings and an open mouth across its front. The game keeps No. 877 until the owner says yes (docs/ART-PROCESS.md). Pictures made again: the Bible's Jelly Ram card, its roster poster and docs/images/roster-poster.png.
- **d · The 3D cards and the follower backdrops** (c4a2299; the owner's pick from the design canvas "Conduit 3D card concepts"). The CARDS screen's cards are tilted 3D slabs: the card's texture under a dark veil, the element's crystal or a class card's cube floating over it, the name and text a raised hologram, the rarity chip on the right edge, the state along the top, the buttons flat under the card. Every element and class has a subtle texture (fire flames, toxic bubbles, flux a vortex, core hexagons, ice cut ice, electric lightning; brawler impact cracks, mage facets, technician circuit traces), and every follower card wears its element's texture under its class's (the roster, the squad's slots, the card on the fly, the INFO, a phone's roster). New: js/cardart.js, tests/cardart.js. Written up: docs/UI-STYLE.md "The 3D cards and the backdrops".
- **c · The dialogue box, the Crystal gives the tutorial, the quest box** (0290c55; a test fix in 50c2797). RPG-style text: whoever is talking pops up at the bottom with their picture and their words, typed out; the Crystal gives the blackout words, every tutorial step as it comes up and the class's stage; the player notes the quest line; Side Quest talks through it at his station, his choice buttons in the box. The objective plate (and the phone's mailbox) is hidden, its record kept; QUESTS on the dock (a gold "!" for a new objective; a round button on a phone) opens the quest box with the objective now and the steps done and to come. New: js/dialogue.js, js/questbox.js, tests/dialogue.js. Written up: docs/TUTORIAL.md "The Crystal speaks", docs/UI-STYLE.md "The dialogue box and the quest box", docs/SEWER-QUEST.md.
- **b · HP mini bars on every follower card, and the squad card's equip slots** (d230911). The squad bar's cards, the Command Center's squad box and the roster strip carry the member's health as a bar with HP and the numbers in it (amber under half, red under a quarter) over the thin XP bar; the member's card beside the squad stack has CARD 1 / CARD 2, the roster's equip slots, listing the hand. Written up: docs/TUTORIAL.md (the HUD: the member's card), docs/UI-STYLE.md (The HUD; The roster).
- **a · The purification module costs ◆300** (469022b), by the owner's word (the brief had ◆800). Written up: docs/SEWER-QUEST.md, docs/OPEN-QUESTIONS.md.
- **The launcher's ride costs nothing** (744a98d), by the owner's answer. docs/OPEN-QUESTIONS.md.

## 2026-10-31

- **j · The collapsed tunnel redone** (2ea9f57): a wide broken-off floor behind a six-tile choke, and three ways to the water sample, each on its own: a flux technician's Telegrab; the electric technician's launcher carrying the player over the choke (ride up, take the vial, jump down to the ledge); a fire technician drilling the choke from the ledge. Written up: docs/SEWER-QUEST.md, docs/TECHNICIANS.md ("The ride"), docs/FACILITY.md.
- **A squad carried through a doorway lands on the arrival tile's own stretch of floor** (f133a59, be2c906): never behind a gate; a follower found sealed in a small pocket is put beside the player. docs/FACILITY.md.
- **h · The recruitment posts are free, once** (f44b941), the owner's answer; the roster's + RECRUIT is the ◆200 purchase. docs/FOLLOWER-PROGRESSION.md, docs/OPEN-QUESTIONS.md.
- **g · Follower progression** (2e3d5d7): the eight recruitment posts claimed once each; breeding a bonded pair's offspring for ◆50 with a better base (deterministic, under a cap); the Vital Fleck, Prism and Core (+5 / +10 / +20 of the hp stat that deaths took); five hidden cases. New: js/breeding.js, js/vital.js, tests/followerprog.js. docs/FOLLOWER-PROGRESSION.md (new).
- **f · The archive's latest decisions built** (b371c5b): the Toxic Queen rooted at the console with her bombs, her spit and her brood, frantic at half her health; Side Quest, the drone in the side passage, his talk and his promise; the Sleeping Potion (the original, and the lab's copy at a quarter). New: js/sidequest.js, js/potion.js. docs/SEWER-QUEST.md ("Side Quest and the Sleeping Potion", the queen's rules), docs/OPEN-QUESTIONS.md.
- **The enemy card names a boss** (5f813c1): the queen's card reads her name, not ANT BOSS.
- **d · The archive read** (3fceb99): the Toxic Ant Queen guards the console and backs off in distress, the brood thins after the purification, Series 2 is Booster Pack 2 (unlocked once the first boss encounter is resolved; its cards still awaited), the analysis bench moved to the Experiment Lab's west cabinet. docs/SEWER-QUEST.md, docs/OPEN-QUESTIONS.md.
- **c · The Sewers' purification** (2262ce8): the water-sample puzzle, the quest's states (js/quests.js), the toxic brood and its samples, the analysis bench and the module, the boss gate, the mount and the cycle, the boss framework (js/bosses.js: calmed alive, or defeated), Series 2's plumbing. docs/SEWER-QUEST.md (new), docs/TECHNICIANS.md, docs/FACILITY.md.
- **The start** (3363944): a start screen, a staged start that waits for the sheets the first picture wants, and a clock that begins once. docs/STARTUP.md (new).
- **Kills pay double XP** (889c8cc), the owner's choice for the pace of evolution: a recruit evolves in about 21 kills by the squad. docs/TUTORIAL.md ("Followers show their XP"), docs/TECHNICIANS.md.
- **Followers show their XP** (f298498): a bar in the world, on the squad's cards, the member's card, the roster and the INFO, with how far each is from evolving. docs/TUTORIAL.md.
- **Three fixes** (ffed4b4): the tutorial's level lift stops with the tutorial, creatures no longer bleed when idle, the MAP is an inspection map only. docs/TUTORIAL.md, docs/COMBAT.md, docs/FACILITY.md.

## 2026-10-30

- **The game bible reflects what was installed** (83c625b): subclasses, equip cards, the Crystalline cards, Pack 1, the market, the statuses. bible.html.

Earlier builds are in the commit log and in the revision sections of the documents in this folder.
