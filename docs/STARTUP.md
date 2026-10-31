# THE START

How the page starts, what the start screen does, which sheets it waits for, what it does when something goes wrong, and what was measured. The code is `js/init.js` (the sequence), `game.html` (the start screen `#startupOverlay`, the `<link rel="preload">` tags), `js/game.js` (`gameLoopStart`, the readout) and the four image loaders (`js/propsprites.js`, `js/hdsprites.js`, `js/evolution.js`). The tests are `tests/startup.js` and `tests/boot.js`.

## Why

REPORTED (an iPad): the game sometimes started at about 20 frames a second, and a refresh often fixed it.

That has **not been reproduced**, and nothing here was run on an iPad. What was measured is headless Chromium (software compositing, a server that behaves like GitHub Pages: gzip, ETag, `Cache-Control: max-age=600`), so absolute frame rates are not an iPad's. What it showed, and what the change is built on:

- The page used to start the clock at once, drawing flat sprites for the sheets that had not arrived, and then paid for each sheet in the middle of play. The first picture after the sheets came in cut about 460 small canvases and read their pixels back (3 slow `getImageData` calls); the first frame's callback ran 170 to 230 ms. With a returning player's evolved forms (0.8 to 2.7 MB a sheet) the worst frame of the first thirty averaged 160 ms (up to 270).
- The sheets were not asked for until the first picture had been drawn: the browser sends no request until the script that made it yields, and the first picture was drawn inside it. Image requests started 170 to 300 ms after they could have.
- Everything else that was looked at was ruled out as the cause: one `requestAnimationFrame` chain and no timers (the frames are the loop invocations, counted), no duplicate handlers, garbage collection under 1% of the profile, no single hot function (the largest was `drawImage` at 4.5%).
- What cannot be told from here: whether an iPad's slow start is this (first-use costs landing in play), the browser throwing away decoded sheets under memory pressure, a GPU read-back stall in `getImageData`, Low Power Mode (which caps the screen at 30 Hz), or the automatic LOW graphics setting being remembered from an earlier slow session (`conduit_fp_gfx`, js/propsprites.js; a refresh would then "fix" it). The readout below is how to tell.

## The sequence

The page puts a plain start screen up at once, and the sheets begin downloading with it. `js/init.js` then runs the stages in order; the screen names the one under way and lights a segment as each is done.

| # | stage | what runs |
|---|---|---|
| 1 | INITIALIZING | the page is checked (a canvas and a context), the guard against input goes up |
| 2 | PREPARING INITIAL GAME STATE | the facility is built and the saved game put back (`facilityPlayStart`): synchronous, as it always was |
| 3 | VALIDATING REQUIRED SYSTEMS | the facility, the player and the crystal, the loop and the canvas are there |
| 4 | RENDERING INITIAL FRAME | the first picture (flat where a sheet is missing). The scene says which sheets it wants by asking for them |
| 5 | LOADING REQUIRED ASSETS | waits for those sheets (and the ones the picture that follows wants, up to three pictures), then draws the pictures that put them in |
| 6 | STARTING GAMEPLAY | the clock starts, once; the screen goes |

The brief listed the assets first. The scene is what says which sheets the first picture wants, and a saved game's evolved forms differ from one player to the next, so the world comes first.

Nothing else changes: the world, the save restore, the tutorial and the clock are the same code, in the same order. In the test sandbox there are no real images, so there is nothing to wait for and the whole sequence has run before `init.js` ends (every suite relies on that).

## The start screen

`#startupOverlay` in `game.html`: plain DOM, first in the body, so it is what shows while the scripts load. It draws nothing on the canvas, and its one animation moves an opacity. It shows the stage's name, a count of the sheets while it waits (`SHEETS 7 / 12`, the real number), and one segment per stage. It is above every panel of the game (z-index 90000; the game's reach 10000) and under the crash panels (99999). It is not shown for the website's background (`?attract`).

**Input.** Until the game has started, one listener per kind of event on the `window`, in the capture phase, stops every pointer, touch, mouse and key event before any handler of the game sees it (`_suBlock`). Keys keep their browser meaning (reload, switching tabs). The screen's own buttons are let through. The listeners come off when the game starts.

**If nothing takes the page over** (`init.js` never arrived), the stylesheet's own timer shows `STILL LOADING. IF NOTHING HAPPENS: RELOAD` after 30 s. A file that did not arrive is the boot check's business (`game.html`: it reloads twice by itself, then says which file).

## The sheets

- **Wanted** (waited for): a sheet one of the first pictures asked for and did not have. A sheet the loaders create while those pictures are drawn is wanted from the start (the player and egg sheets, an evolved form and its ground layer); a sheet that already existed (the props) is wanted when a picture misses it. The loaders tell the start (`startupAsset` when they begin one, `startupWant` on a miss); a hit costs what it did.
- **Later** (never waited for): everything else the page loads at start (the props sheets the first picture does not show). They arrive as before and the readout counts them.
- **Preload.** The twelve props sheets are `<link rel="preload" as="image">` in the head, at the loader's own addresses (`img/props/<family>.png`, build stamp included), so they download alongside the scripts instead of once the world is built. Not the player's sheet (the website's background draws no player), the eggs or the evolved forms: which of them the first picture draws depends on the saved game, and the start asks for those itself.
- **No `decode()`.** `HTMLImageElement.decode()` before the first picture was measured and gave nothing: the picture after the wait is where the decoding and the slicing happen, behind the screen.
- **Time limit.** `STARTUP_ASSET_MS` (15 s) for the wanted sheets. A sheet that fails ends the wait at once.

## When something goes wrong

A stage that throws stops the sequence. The screen says **THE GAME COULD NOT START**, names the stage and the reason (the console has the error, with its stack), and offers:

- **RETRY**: the stage that failed, again. A sheet that did not load is asked for again under an address of its own (`&r=N`), so the browser does not answer from the failure. A try after a half-built world builds it again from a fresh state, so there is one of everything. Nothing retries by itself.
- **PLAY ANYWAY**: only when sheets did not arrive. Every sprite has a flat drawing to fall back on.
- **RELOAD**: the page again. The saved game is read again as it is.

No error is swallowed to make the screen go. A crash in a script, or in a continuation after the wait, still reaches the page's crash panel (`game.html` `_showError`).

## The clock

`gameLoopStart()` (`js/game.js`) is the only way the loop begins: it refuses a second call (counted in `_perf.denied`), clears the clock's history (`clockReset`: the first refresh owes one step, whatever the screen was up for) and calls `gameLoop`, which still schedules the next frame first. There is exactly one `requestAnimationFrame`, and it is the clock's. A tab that was hidden, or an iPad asleep, comes back as `dt > 1000`: no debt, one step, one picture (tested).

## The readout (Settings → PERFORMANCE)

Off by default, and costing nothing then (the gaps are not recorded). On, it adds:

```
START 812 ms   clock 1   pictures 3        when the clock began (from the page's start), clocks started (must be 1), pictures drawn before it
stages 3 / 118 / 0 / 187 / 342 / 4 ms      the time of each stage
SHEETS wanted 9/9  later 3/3               arrived / asked for; FAILED n if any
GAPS p50 33  p95 50  p99 67  max 83 ms (120)   the last 120 gaps between pictures
```

## What was measured

(Headless Chromium 1180x820, this container; **not an iPad**. Means over repeats, the frames after the clock began; "before" is `889c8cc`.)

Measured with `startup_probe` (not in the repo: a Playwright script that loads the real `game.html` in headless Chromium over a small static server that behaves like GitHub Pages, hooks the frame loop and the image loads from outside the game's files, and records the frames after the clock began). The two trees ran alternately, one after the other, so the machine's drift is shared. "Plain" is the container as it is; "slow" is Chromium's CPU throttled to 2x, 60 ms of latency and 15 Mbit/s. "Returning" is a save with three evolved followers (4.5 MB of sheets). Headless Chromium paints in software, so a frame is about 33 ms even when the game's own work is 11 ms: only the differences mean anything.

| | before | after |
|---|---|---|
| **PLAIN, NEW PLAYER** (6 runs each) | | |
| the clock starts, ms after the page began | 332 | 839 (the screen lifts at 856) |
| the first 30 frames: gap between pictures, mean / 95th / worst, ms | 46.0 / 66.7 / **269** | 36.8 / 52.8 / **72** |
| the first 30 frames: the frame's own callback, mean / worst, ms | 14.3 / 28.4 | 13.3 / 25.0 |
| small canvases cut after the clock began | **463** | **4** |
| slow `getImageData` calls after the clock began | 3.2 | 0 |
| frames over 50 ms in the first 3 s of play: count, total ms | 6.3, 559 | 6.3, 394 |
| a frame's callback once settled (seconds 3 to 5), ms | 11.7 | 11.3 |
| **PLAIN, RETURNING PLAYER** (6 runs each) | | |
| the clock starts, ms | 358 | 917 |
| the first 30 frames: gap, mean / 95th / worst | 49.8 / 152.8 / **239** | 37.5 / 52.8 / **61** |
| the first 30 frames: callback, mean / worst | 27.8 / **160.5** | 21.6 / **33.2** |
| canvases cut after the clock began | 460 | 4 |
| frames over 50 ms in the first 3 s: count, total ms | 6.3, 601 | 3.8, 213 |
| callback once settled | 17.9 | 18.1 |
| **SLOW, NEW PLAYER** (3 runs each) | | |
| the clock starts, ms | 1,287 | 3,522 |
| the first 30 frames: gap, mean / 95th / worst | 125.7 / 283 / 322 | 89.3 / 128 / 145 |
| the first 30 frames: callback, mean / worst | 54.9 / 255 | 34.6 / 57 |
| frames over 50 ms in the first 3 s: total ms | 1,980 | 1,069 |
| **SLOW, RETURNING PLAYER** (3 runs each) | | |
| the clock starts, ms | 1,249 | 5,770 |
| the first 30 frames: gap, mean / 95th / worst | 115.5 / 222 / 289 | 92.2 / 139 / 161 |
| the first 30 frames: callback, mean / worst | 54.6 / 216 | 55.8 / 96 |
| frames over 50 ms in the first 3 s: total ms | 1,645 | 1,166 |

What it says, and what it does not:

- **The first moments of play are steadier**: no 230 to 320 ms stall in the first frames, no canvases cut and no pixels read back while playing, and a returning player's worst early frame is a third of what it was. A frame once settled costs the same (11.3 against 11.7 ms; 18.1 against 17.9), so nothing was made slower.
- **It costs waiting.** The game is playable about half a second later here (the sheets and the pictures that put them in, done behind the start screen instead of in play), and on a slow link a good deal later: 3.5 s for a new player and 5.8 s for a returning one, most of it the sheets themselves (stage 5: 1.0 s and 3.3 s). Before, the game was on screen sooner and ran badly for several seconds (a returning player's 3 evolved sheets arrived in the middle of play).
- **A returning player on a slow link waits longest**, because the evolved forms (0.8 to 2.7 MB each) are only known once the world is built, so they cannot be preloaded with the page. Reading the save in the page's head and preloading the sheets it names would take that wait down by up to the time the page takes to reach its first picture (1.6 s on the slow link), at the price of tying the page to the sheets' names: not done.
- **The first picture is not free** (stage 4: 260 ms here, 730 ms on the slow link): the world is built, then drawn once with flat drawings, to find out what the scene wants. That is the same work the old start did inside its first frame.
- **The stages** (plain, new player, ms): INITIALIZING 0.5, PREPARING INITIAL GAME STATE 135, VALIDATING 0.2, RENDERING INITIAL FRAME 260, LOADING REQUIRED ASSETS 216, STARTING GAMEPLAY 17.

How the design was chosen (each was a run of the same probe, 3 to 5 runs a side, not kept in the repo):

- **Waiting for the sheets and drawing after them** is the whole effect. One picture after the last sheet is as good as three (canvases cut in play: 4 either way); ten were no better and cost 0.4 s.
- **`HTMLImageElement.decode()` before the picture** gave nothing (first 30 frames, mean gap 33.4 ms with it, 33.6 without), so it is not used.
- **Waiting for the sheets the first picture asked for**, not for all of them: a first picture asks for 6 to 10 of the 16 images the page loads at start (how many depends on how many of the preloaded sheets have arrived by then); the rest arrive later and are only counted.
- **Preloading the props sheets in the page's head** (the real code, with and without the tags, slow link, 3 runs each): the screen lifts at 3.5 s instead of 4.1 s for a new player and 5.9 s instead of 6.4 s for a returning one (about half a second: 13% and 7%), and it makes no difference on the plain link. An earlier trial that also preloaded the player's sheet made the start a quarter sooner, but that was an experiment with a different start; with the real code the player's sheet is not on the critical path, and the website's background never draws it. Preloading the starter eggs was slower still (they compete with the scripts and are useless to a returning player).
- **The 15 s limit** and the failure screens are by design, not by measurement.

## Testing it on an iPad

1. Settings → PERFORMANCE → ON. Reload the page (pull to refresh, or close the tab and open it again) ten times, on Wi-Fi, and a few times with the cache cleared (Settings → Safari → Clear History and Website Data).
2. On each load note: how long the start screen was up; the `START` line (ms), the `stages` line (which stage is long?), the `SHEETS` line (any FAILED, any wanted sheet late?), and after ten seconds `FPS`, `GAPS p95/p99/max`, `GFX`.
3. If a load runs at about 20 frames a second: write down the `GAPS` and `FPS` lines, the `GFX` line (LOW or HIGH), `frame ... = logic + draw + catch-up + browser`, and whether Low Power Mode was on. `browser` large with small `logic`/`draw` is the browser's painting, not the game. `GFX LOW` that you did not choose means a slow session was remembered: Settings → GRAPHICS sets it back.
4. Try it with the page hidden during the start (switch apps while the screen is up) and then come back: it should finish, and the game should start at its normal speed.
5. Try airplane mode before loading the page, and again with the cache cleared and the Wi-Fi turned off right after the page appears: the screen should end on THE GAME COULD NOT START with the files named, RETRY / PLAY ANYWAY / RELOAD.

## Not done, on purpose

- No change to the simulation, its speed, combat, AI or balance; the frame rate is not capped.
- No Web Workers, WebAssembly or WebGL; no change to the renderer.
- The draw path was profiled and has no single hot function; nothing in it was changed. (The dimmed pen's colour cache key, `_fpDimColour` in `js/facilitystyle.js`, is about 2% of a frame and the setter that calls it 3%: a candidate if an iPad profile points at the dark rooms.)
- A saved game that fails to apply (`facilitySaveApply` throws) is logged and the game goes on; the next autosave then writes the half-restored state over it. That is how it was, and it is not changed here.
