# Attack card art

- **Status:** Designed. The Mage style approved on its first sample (2026-11-17, §4); nothing in the game yet. The Brawler style not drawn yet.
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
