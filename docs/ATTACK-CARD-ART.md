# Attack card art

- **Status:** Designed. The Mage style approved on its first sample (2026-11-17, §4); nothing in the game yet. The Brawler style: its first sample drawn (the Frost Maw biting with CHOMP, `design/cards/attack/drafts/round1/maw_chomp.png`, 2026-11-17), waiting for the owner.
- **Owner:** User (creative direction); agent (drafts, rendering, baking).
- **Last updated:** 2026-11-17
- **Branch/build context:** written on `claude/card-artist`, at main's build `2026-11-15i`.
- **Agent:** `.claude/agents/card-artist.md` (the card illustrator every session uses for attack card pictures; it reads this page first).
- **Related:** `ART-PROCESS.md` (one piece first), `UI-STYLE.md` (the card's look), `ENERGY-CARDS.md` (the element worlds), `NEXT-PHASE-ROADMAP.md` §12.5 (card-granted attacks), `COMBAT.md`.

## 1. Intent
The owner, 2026-11-17: "we're about to have to create a whole bunch of different cards that represent attacks. So I wanted to go ahead and create an agent that could create some cool looking attack cards that would involve dynamic shots of elementals using their attacks where they look elementally charged, kind of, and I want the horizon to be slanted, like the camera angle's kind of slanted, and I also want like shocks or fire in the front of the card as focus. And then for like the brawlers, you know, they would have like impact looking cards that have shattered screens and maybe make them look roughed up."

## 2. The brief (the owner's)
- **Elemental cards:** a dynamic shot of the follower using its attack; the follower **elementally charged**; **the horizon slanted** (a tilted camera); **shocks or fire in the front of the card as the focus**.
- **Brawler cards:** **impact**: a **shattered screen**, the card **roughed up**.

## 3. Fixed and open
**Fixed (the agent's reading of the brief and the project's rules, not new design):**
- The follower in a card is its own 3-D model (`design/evolutions/`), posed mid-attack, never redrawn.
- The picture fills the card's art area, 225 × 315 CSS px (5:7), baked at 2× (450 × 630); the name plate over its bottom must read.
- Element colours as the game's (`js/config.js` `ELEMENTS`).
- No card's name, stats or effect is invented for a picture.

**Open, for the owner:**
- **Technicians:** not in the brief, and not given the elemental style (§4). Which style, decided later.
- **Which cards, and how many:** roadmap §12.5 keeps the count and the elements open (six cards, or two per element, were both mentioned). Not to be assumed.

## 4. Decisions
*(Each decision about the look goes here: the date, the owner's words, what was chosen and what was passed over, and what is the agent's.)*

- **2026-11-17, "elementals" are the Mages.** Asked which followers get the charged, tilted-camera style, the owner chose **"Mages only"**. Passed over: Mages and Technicians. Brawlers keep the impact style; the Technicians' style is open.
- **2026-11-17, the first piece is the Ember Hood (fire).** Asked which single card to draw first to check the style, the owner chose **"Ember Hood (fire)"**: the fire Mage casting, its hood blazing, flames in the front of the card. Passed over: Thunderhead (shocks), a Brawler impact, one of each. It is a style sample of an existing attack, not a new card.
- **2026-11-17, the Mage style is approved.** Of the first sample (the Ember Hood casting HEXFIRE: `design/cards/attack/drafts/round1/embercowl_hexfire.png`, made by `design/cards/attack/bake_attack.js`; the camera rolled about 15.5°, the hood glowing, a plume of fire bursting in front on the left, sparks and lava drops past the lens, the fire energy card's lava cave behind), the owner: **"You've absolutely got it with the cards"**. The agent's, provisional, carried with it: the hood's heat held at 0.35 of its cast pose (at full heat its faces go one flat orange), the camera's roll, the plume on the left. Still open: the picture's weight (504 KB as a PNG, about 275 KB as the game's lossless WebP; a lighter format needs a change to the picture tool) and the attack card's own frame.
- **2026-11-17, the Brawler sample is the Frost Maw.** Asked which Brawler to draw first in the impact style, the owner chose **"Frost Maw"** (the ice Brawler; its CHOMP bite: the cracks can come from its jaws snapping at the viewer). Passed over: the Hammer Slug, the Quillstone, not yet.
- **2026-11-17, card pictures in a lighter format.** Told the Ember Hood picture is 504 KB (about 275 KB as the game's lossless WebP) and that many such cards could slow older iPads, the owner chose **"Lighter format"**: the picture tool (`tools/images.js`) is to save attack card art in a lighter, lossy format (about 55 KB a card at a quality that looks the same to the eye). Passed over: keep the lossless format; decide later. **Not built yet:** it goes in with the first attack card that goes into the game (the tool change, its test in `tests/images.js`, and the quality the agent picks, provisional).
- **2026-11-17, the Brawler sample drawn (the agent's, provisional; not yet seen by the owner).** The Frost Maw biting with CHOMP: `design/cards/attack/drafts/round1/maw_chomp.png` (in the frame: `maw_chomp_inframe.png`), made by `design/cards/attack/bake_attack.js maw_chomp` (its `BRAWLER` part). Its own 3-D model (No. 934) sitting in the floor as in the game, swollen with its mouth wide at the lens, the fangs coming down: a pose between its sheet's last rearing frame and the bite's first (at the bite's own frame the mouth tips to the floor and hides); a low camera rolled about 12.6 degrees; the ice energy card's glacier and aurora behind. Then the card's glass shattered from the bite point in front of its mouth (13 cracks radiating out, rings of cracks round them, the shards pushed out of line and turned, harder near the middle, the middle crushed white, one cluster of pieces knocked out, never over the follower), and the card roughed up (scratches and scrapes, scuffs, a grain of grit, dust, chipped edges, worn corners). 695 KB as a PNG (its grain does not compress), about 45 KB in the lighter lossy format.

