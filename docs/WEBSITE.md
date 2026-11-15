# The website (Dragonlord home page)

- **Status:** Research done; redesign **Proposed** (no direction chosen yet). The live page is `index.html` as it was before this redesign.
- **Owner:** User (creative direction); agent (research, drafts, implementation).
- **Last updated:** 2026-11-15
- **Branch/build context:** `claude/friendly-thompson-w581x0`, at main's build `2026-11-15c`.
- **Agent:** `.claude/agents/web-designer.md` (the web designer every session uses for the website; it reads this page first).
- **Related:** `UI-STYLE.md` (the game's look, which the site borrows), `STARTUP.md`, `js/attract.js` (the live backdrop).

## 1. Intent
The owner, 2026-11-15: "Let's start fresh ... we're gonna use the backdrop that we have ... that runs the game and shows the followers, but I want it to just have a different look altogether." Earlier examples "were not good"; the owner asked for "more research and sub-agents regarding web design".

## 2. Fixed (the owner's)
- **The background stays the live game** in attract mode (`play.html?attract`, `js/attract.js`): the facility with followers wandering, in an iframe that takes no taps.
- **The content stays:** the name Dragonlord, and links to Conduit (`play.html`), the Game Bible (`bible.html`), ROM Lab (`romlab/index.html`) and GitHub.
- **Everything else about the look is open**, to be chosen from drafts.

## 3. Research findings (2026-11-15; three research agents, summarised)
Limits: the session's network blocked the design galleries (Awwwards, Typewolf, Godly and the example sites), so the examples come from search results and the agents' own knowledge, not pages loaded live.

**Content over a live game**
1. The game is the hero: content takes 15–30% of the first screen, in the edges and corners (a title block lower-left, a list along one edge, small readouts in the corners); the middle, where the followers wander, stays clear.
2. Frame it as an instrument, not a web page: thin corner brackets, a hairline inset, small status readouts ("FACILITY FEED · LIVE"), so the game reads as a monitored feed. References: Igloo Inc (Awwwards Site of the Year 2024: a live crystalline scene, small HUD labels in the corners), Messenger (the UI shares the game's language), Lusion ("type anchors the layout, then recedes").
3. Vignettes and gradients, not boxes. A panel, where one is needed, is small.
4. One dominant call to action: PLAY, the only saturated fill. The rest quiet: an indexed list (01 CONDUIT, 02 GAME BIBLE, 03 ROM LAB, 04 GITHUB) or text links.
5. Say it is live (a LIVE dot or caption); let the game breathe (the interface may fade back when idle).

**Looking premium, not generic**
- Fonts: avoid Orbitron, Audiowide, Michroma, Courier as body text, Inter alone. Strong pairings: **Chakra Petch** (display, bold italic; its cut corners echo the game's slab buttons) + **IBM Plex Sans** + **IBM Plex Mono** (labels only); Unbounded + Archivo; Space Grotesk + JetBrains Mono; Archivo (widths) alone; Oxanium + Plex Sans.
- Two type voices: one display face big, one small mono for labels (11–13 px, tracked 0.1–0.2 em, uppercase); a large jump in size between them, little in the middle.
- Layout: asymmetric, left-anchored, oversized type, index rows; not a centred hero over three rounded cards, not a bento grid, not glass on every panel.
- Tells of a generic or AI-made site to avoid: gradient text, emoji logos, three rounded cards in a row, pill tags, everything centred, glow on everything, a border round every box, the same fade on everything, buzzword copy.
- One accent (the game's teal `#19e6c1`) on under 5% of the page; hairlines over boxes; chamfered or sharp corners; real data (the build number) over decoration.
- Motion: one entrance sequence (200–500 ms, ease-out, a 40–60 ms stagger); small hover nudges; the game already moves, so the page stays calm. No scroll-jacking, glitch or typewriter text, custom cursors, looping borders. A reduced-motion mode.

**Readability and the iPad**
- Contrast must hold at the brightest frame of the game (WCAG 1.4.3: 4.5:1, 3:1 large). A text-shadow alone does not meet it.
- Recipes: a static gradient mask over the scene (free per frame); a local dark scrim behind a text block; a small frosted panel only where needed, with a solid fallback.
- Do not put blur or large shadows on large areas, animate filters or blend modes, use scroll-linked effects or `background-attachment: fixed`, or scatter `will-change`.
- Use `100svh`; a visible `:focus-visible`; a skip link; keep the iframe `pointer-events: none`, `inert`, `aria-hidden`, `tabIndex=-1`.
- A still poster image first, cross-faded to the live game when it is ready.

## 4. Problems in the current page (found 2026-11-15)
1. **The game never pauses**, and with `gameState.running` false it still draws every frame (js/game.js `gameLoop`). Needs a pause/resume message in `js/attract.js`.
2. **HUD pieces show through**: the network panel and the ammunition pill are drawn on the canvas, so the attract CSS that hides the page's elements does not hide them (seen in a screenshot of the page).
3. **No poster**: a gradient only until the game is ready (or for 45 s on a failure).
4. **The logo's glow, blend mode and endless float** recomposite over the live iframe every frame.
5. `#bg.ready iframe { opacity: 0.9 }` keeps the iframe a blended layer for good.
6. The reduced-motion choice is read once only.

## 5. Decisions
None yet. Drafts first; the owner chooses.

## 6. Open questions
- Which direction (drafts to come).
- Whether the session's network may reach the design galleries for a second, deeper round of research (needs the owner's approval).
