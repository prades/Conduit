# The website (Dragonlord home page)

- **Status:** CONSOLE chosen (2026-11-15) and **Implemented** in `index.html` (build `2026-11-15e`); verified by tests/attract.js and tests/bible.js and screenshots at iPad, desktop and phone sizes; not checked on a real iPad.
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

**Round 2 (2026-11-15, with gallery and example hosts allowed; LOADED = read from the real page or its code)**
- Loaded: messenger.abeto.co, lusion.co, bruno-simon.com, www.supergiantgames.com (their HTML, CSS and JS), Typewolf and Fonts In Use pages, the Google Fonts API. Still blocked or not reached: www.igloo.inc, awwwards.com, blog.lusion.co, tympanus.net (a bot check), godly.website.
- **Measured rules** (from Lusion, Messenger, Bruno Simon, Supergiant):
  1. Edge padding `max(5vw, 40px)` left/right, `clamp(30px, 4vw, 50px)` top/bottom; every overlay piece snaps to it.
  2. Two type sizes: labels 13–14 px (mono, uppercase, 500, tracked 0.1–0.125 em) and display 48 px and up (tracked −0.01 to −0.02 em); one intro line up to 34 px at most between them.
  3. At most one oversized element (96–112 px), flush to an edge.
  4. The middle half of the width and the middle 60% of the height free of text.
  5. Colours from the game's own palette; the accent only on PLAY and a LIVE mark (under 5%).
  6. Icon controls (pause, sound) 44–56 px in one column on an edge.
  7. PLAY the only filled button, 56 px tall or more, a chamfered slab; the other links mono text rows.
  8. Panels at most `min(360px, 100% - 40px)` wide; hover moves 4 px at most, no glow.
  9. Corner brackets: four 16–24 px L shapes in 1 px hairlines at 40–60% opacity, at the padding inset; no other borders.
  10. Into the content: a static gradient to navy over the last 25–35% of the first screen, then flat navy; a −4° skew allowed on labels.
- Messenger draws its whole UI in the game's palette (its body is empty: the text is WebGL); Lusion: "Fewer typefaces. Fewer colours. Fewer UI ideas competing for attention"; Supergiant keeps the hero art clean and puts the store buttons just below it; Bruno Simon greets with one small card, then gets out of the way.
- **Fonts, checked against the Google Fonts API:** Chakra Petch 300–700 with italics (no 800/900); Archivo 100–900 with italics and a width axis to 125 (Black Italic at width 125 is the closest free match to the game's italic 900); Saira the same with widths 50–125; Big Shoulders Display 100–900, no italics; Unbounded 200–900, no italics; Bricolage Grotesque 200–800 with an optical-size axis. Avoid: Michroma, Orbitron, Exo 2 (clichés, confirmed), Oxanium (now Halo's menu face).
- **Five type systems:** A Bulkhead (Big Shoulders Display 800 + Space Grotesk + JetBrains Mono: industrial signage); B Field Station (Unbounded 700 + Archivo + IBM Plex Mono: a calm modern studio); C Lab Notebook (Bricolage Grotesque + Space Mono: editorial, personal); D Console (Chakra Petch italic + IBM Plex Sans + Plex Mono: the facility's console); E Slab Voice (Archivo Black Italic width 125 + Archivo + Tomorrow: the game's own voice, the lightest download).

## 4. Problems in the current page (found 2026-11-15)
1. **The game never pauses**, and with `gameState.running` false it still draws every frame (js/game.js `gameLoop`). Needs a pause/resume message in `js/attract.js`.
2. ~~**HUD pieces show through**~~ (fixed in build `2026-11-15d`: in attract mode the network panel and the target UI draw nothing): the network panel and the ammunition pill are drawn on the canvas, so the attract CSS that hides the page's elements does not hide them (seen in a screenshot of the page).
3. **No poster**: a gradient only until the game is ready (or for 45 s on a failure).
4. **The logo's glow, blend mode and endless float** recomposite over the live iframe every frame.
5. `#bg.ready iframe { opacity: 0.9 }` keeps the iframe a blended layer for good.
6. The reduced-motion choice is read once only.

## 5. Decisions
- **2026-11-15: CONSOLE** (the owner, of the six round-1 drafts in `design/web/round1/`: "Number 1"). The home page is the facility's monitoring console over the live game: four hairline corner brackets; small mono readouts (FACILITY FEED · LIVE, the Conduit build and today's date) at the top; DRAGONLORD in Chakra Petch bold italic at the lower left with the tagline over it; the one filled button, PLAY, a chamfered teal slab, with Conduit's line beside it; GAME BIBLE, ROM LAB and GITHUB a numbered mono index at the lower right; below the first screen, a static fade into flat navy with a row for each project and the bio. Type system D (Chakra Petch + IBM Plex Sans + IBM Plex Mono). Built into `index.html` in build `2026-11-15e`; the build numbers marked `data-build` are kept current by `tools/stamp.js`.
  - The agent's, provisional: on a phone the name scales with the width (`clamp(36px, 12.5vw, 64px)`); the measured rule that keeps the middle of the screen free is bent on a landscape screen, where the name reaches into the bottom of that band (as in the draft the owner chose).
- The other five drafts are kept in `design/web/round1/` as history.

## 6. Open questions
- On a phone, two of the game's round phone buttons show faintly through the background at the right edge (the game's phone layout is the owner's to change; phones are not a target).
- Next engineering steps from §4: a still poster before the game is ready; pausing the game when it cannot be seen (needs a message in js/attract.js).
- Which direction (drafts to come).
- ~~Whether the network may reach the design galleries~~ (approved 2026-11-15: twenty hosts added to the environment; round 2 above).
