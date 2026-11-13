// DRAFT HARNESS (for the owner; not built): ten designs for the fight's panel at the bottom left (the attack card: the creature's card, its ATTACK bar, the INFO, RUN, COME and ALL tabs, and ROSTER
// risen over it), drawn over the real page at an iPad's size with the real creature, its art and numbers. Each design is a css layer over the page as it is in build 2026-11-13a (body.dN), so what
// works today (a press on the card attacks, the four tabs) works the same in every one. The owner, 2026-11-13: "I definitely love where they're at, but I don't love the overall design of the little
// left side screen. So can we make 10 design options for it, and we'll choose one?"
//   0  NOW         build 2026-11-13a as it is
//   1  HOLO GLASS  a frosted see-through panel, flat; the tabs glass pills standing free at its right
//   2  VERSUS      a fighting game's slab: speed lines, the creature bursting out of its top, a huge name; the tabs slanted chips
//   3  UPRIGHT     a tall trading card, the art over the numbers; the tabs fanned behind its right like a hand of cards
//   4  BRACKETS    no box: a scope's corner brackets round the creature, the numbers on a small plate; the tabs round icon buttons
//   5  RPG WINDOW  a rounded blue game window with a white edge; the tabs a command list with a cursor
//   6  SCOPE DISC  the creature in a round lens, ATTACK under it; the tabs round buttons in an arc round the lens
//   7  BANNER      a low, wide strip: the creature in a hexagon, the numbers, ATTACK a block at its end; the tabs along its top
//   8  TABS ON TOP the tabs stand up behind the card's top edge, as ALL, HOLD and COME do on the calm command card
//   9  TERMINAL    a lab monitor's readout: scanlines, teal mono text; the tabs keycaps
//  10  CRYSTAL     a faceted crystal-cut panel in the creature's colour; the tabs a honeycomb of hexagons
// node design/ui-mocks/foe-panel/draft.js [--out=dir] [WxH]   The repo's files are read, never written. Needs playwright and ImageMagick (the sheet).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve((process.argv.find(x => x.startsWith('--out=')) || '--out=/tmp/foe-panel').slice(6));
const [VW, VH] = (process.argv.find(x => /^\d+x\d+$/.test(x)) || '1180x820').split('x').map(Number);

const P = n => 'body.corners.d' + n + ' #mixTool';
const NAMES = ['NOW', 'HOLO GLASS', 'VERSUS', 'UPRIGHT CARD', 'SCOPE BRACKETS', 'RPG WINDOW', 'SCOPE DISC', 'WIDE BANNER', 'TABS ON TOP', 'LAB TERMINAL', 'CRYSTAL'];
// a tab, shown whole beside the card (no tuck, no peek)
const free = (n, w, h) => `${P(n)} :is(.mt-fa.all, .mt-fa.run, .mt-fa.come, .mt-fa.info) { animation: none; translate: none; transform: none; width: ${w}px; height: ${h}px; padding: 0; justify-content: center; z-index: 5; }
  ${P(n)} .mt-fa b { width: auto; }`;
const CSS = [
// 1 HOLO GLASS
`${P(1)} .mt-foe-slab { transform: none; border: 1px solid rgba(170,255,240,0.7); border-radius: 16px; background: linear-gradient(160deg, rgba(120,200,255,0.16), rgba(10,20,40,0.42)); -webkit-backdrop-filter: blur(10px) saturate(1.3); backdrop-filter: blur(10px) saturate(1.3); box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset, 0 10px 30px rgba(0,0,0,0.45), 0 0 26px -6px var(--c); }
 ${P(1)} .mt-foe-slab::after { border-radius: 16px; background: linear-gradient(165deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 30%, transparent 31%); box-shadow: none; }
 ${P(1)} .mt-foe.at-left .mt-foe-txt { background: rgba(5,10,24,0.35); border-left: 1px solid rgba(170,255,240,0.5); border-radius: 10px; }
 ${P(1)} .mt-foe-atk { border-radius: 0 0 16px 16px; border-top: 1px solid rgba(255,255,255,0.45); background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,90,40,0.38)); }
 ${free(1, 82, 36)}
 ${P(1)} .mt-fa::before { border-radius: 18px; border-width: 1px; background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 50%, color-mix(in srgb, var(--c) 30%, transparent)); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: 0 6px 14px rgba(0,0,0,0.4), 0 0 12px -4px var(--c); }
 ${P(1)} .mt-fa b { flex-direction: row; gap: 5px; } ${P(1)} .mt-fa b::before { width: 16px !important; height: 16px !important; }
 ${P(1)} .mt-fa.info { left: calc(100% + 8px); top: 4px; } ${P(1)} .mt-fa.run { left: calc(100% + 8px); top: 46px; } ${P(1)} .mt-fa.come { left: calc(100% + 8px); top: 88px; } ${P(1)} .mt-fa.all { left: calc(100% + 8px); top: 130px; }
 ${P(1)} .mt-fa.all.on { color: #05070f; } ${P(1)} .mt-cmd-roster::before { border-radius: 14px; }`,
// 2 VERSUS
`${P(2)} .mt-foe-slab { transform: none; overflow: visible; border: 0; clip-path: none; background: none; box-shadow: none; }
 ${P(2)} .mt-foe-slab::before { content: ""; position: absolute; inset: 0; z-index: 0; transform: skewX(-10deg); border: 3px solid var(--c); background: repeating-linear-gradient(115deg, transparent 0 14px, rgba(255,255,255,0.05) 14px 16px), linear-gradient(110deg, color-mix(in srgb, var(--c) 55%, #05070f) 0%, #12060a 55%, #05070f); box-shadow: 6px 6px 0 #05070f, 0 0 22px -4px var(--c); }
 ${P(2)} .mt-foe-slab::after { transform: skewX(-10deg); }
 ${P(2)} .mt-foe.at-left .mt-foe-pic { background: none; z-index: 1; } ${P(2)} .mt-foe.at-left .mt-foe-pic.full img { left: -34px; top: -78px; width: 250px; height: 250px; filter: drop-shadow(0 0 10px var(--c)) drop-shadow(4px 6px 0 #05070f); }
 ${P(2)} .mt-foe.at-left .mt-foe-txt { background: none; border: 0; z-index: 2; } ${P(2)} .mt-foe.at-left .mt-foe-name { font-size: 19px; line-height: 0.95; text-transform: uppercase; -webkit-text-stroke: 1px #05070f; text-shadow: 3px 3px 0 var(--c); }
 ${P(2)} .mt-foe-atk { transform: skewX(-10deg); background: linear-gradient(180deg, #ffe07a, #ff3a10); border-top: 3px solid #fff; } ${P(2)} .mt-foe-atk b { color: #05070f; text-shadow: none; font-size: 24px; transform: skewX(10deg); } ${P(2)} .mt-foe-atk b::after { content: "!"; }
 ${free(2, 76, 34)}
 ${P(2)} .mt-fa::before { border-radius: 0; transform: skewX(-14deg); border-width: 2px; background: linear-gradient(180deg, color-mix(in srgb, var(--c) 70%, #fff), var(--c) 60%, color-mix(in srgb, var(--c) 60%, #05070f)); box-shadow: 4px 4px 0 #05070f; }
 ${P(2)} .mt-fa { color: #05070f; text-shadow: none; } ${P(2)} .mt-fa.run { color: #fff; } ${P(2)} .mt-fa b { flex-direction: row; gap: 4px; font-size: 11px; } ${P(2)} .mt-fa b::before { width: 15px !important; height: 15px !important; }
 ${P(2)} .mt-fa.info { left: calc(100% + 14px); top: 6px; } ${P(2)} .mt-fa.run { left: calc(100% + 8px); top: 46px; } ${P(2)} .mt-fa.come { left: calc(100% + 2px); top: 86px; } ${P(2)} .mt-fa.all { left: calc(100% - 4px); top: 126px; }
 ${P(2)} .mt-fa.info b i { color: #05070f; text-shadow: none; font-size: 13px; }`,
// 3 UPRIGHT CARD
`${P(3)} .mt-foe-slot { width: 176px; } ${P(3)} .mt-foe.at-left { padding-left: 6px; }
 ${P(3)} .mt-foe-slab { display: block; height: 238px; transform: rotate(-3deg); transform-origin: 50% 100%; border-radius: 12px; border-width: 3px; }
 ${P(3)} .mt-foe.at-left .mt-foe-pic { inset: 0 0 auto 0; height: 118px; border-bottom: 2px solid var(--c); } ${P(3)} .mt-foe.at-left .mt-foe-pic.full img { left: -10px; top: -46px; width: 190px; height: 190px; }
 ${P(3)} .mt-foe.at-left .mt-foe-sub { bottom: 4px; width: auto; }
 ${P(3)} .mt-foe.at-left .mt-foe-txt { position: absolute; left: 0; right: 0; top: 120px; margin: 0; padding: 6px 9px; border-left: 0; background: rgba(5,7,15,0.75); gap: 2px; } ${P(3)} .mt-foe.at-left .mt-foe-name { -webkit-line-clamp: 1; font-size: 13px; }
 ${P(3)} .mt-foe.at-left .mt-foe-dmg { display: none; } ${P(3)} .mt-foe-atk { border-radius: 0 0 10px 10px; }
 ${P(3)} :is(.mt-fa.all, .mt-fa.run, .mt-fa.come, .mt-fa.info) { animation: none; width: 96px; height: 50px; transform-origin: 0 100%; z-index: 1; justify-content: flex-end; }
 ${P(3)} .mt-fa::before { border-radius: 10px; } ${P(3)} .mt-fa b { width: 44px; }
 ${P(3)} .mt-fa.info { left: 112px; top: 14px; transform: rotate(-8deg); } ${P(3)} .mt-fa.run { left: 118px; top: 68px; transform: rotate(-2deg); } ${P(3)} .mt-fa.come { left: 118px; top: 122px; transform: rotate(3deg); } ${P(3)} .mt-fa.all { left: 112px; top: 176px; transform: rotate(8deg); }
 ${P(3)}.foe .mt-cmd-roster { bottom: calc(var(--cn-tool) + 76px); width: 240px; }`,
// 4 SCOPE BRACKETS
`${P(4)} .mt-foe-slab { transform: none; border: 0; background: none; box-shadow: none; overflow: visible; }
 ${P(4)} .mt-foe-slab::after { inset: -2px; background: linear-gradient(var(--c), var(--c)) 0 0 / 22px 3px, linear-gradient(var(--c), var(--c)) 0 0 / 3px 22px, linear-gradient(var(--c), var(--c)) 100% 0 / 22px 3px, linear-gradient(var(--c), var(--c)) 100% 0 / 3px 22px, linear-gradient(var(--c), var(--c)) 0 100% / 22px 3px, linear-gradient(var(--c), var(--c)) 0 100% / 3px 22px, linear-gradient(var(--c), var(--c)) 100% 100% / 22px 3px, linear-gradient(var(--c), var(--c)) 100% 100% / 3px 22px; background-repeat: no-repeat; box-shadow: none; filter: drop-shadow(0 0 6px var(--c)); }
 ${P(4)} .mt-foe.at-left .mt-foe-pic { background: radial-gradient(120px 110px at 30% 55%, color-mix(in srgb, var(--c) 30%, transparent), transparent 70%); }
 ${P(4)} .mt-foe.at-left .mt-foe-txt { background: rgba(5,7,15,0.62); border-left: 2px solid var(--c); margin: 8px 8px 46px 0; }
 ${P(4)} .mt-foe-atk { left: 10px; right: 10px; bottom: 4px; height: 32px; border: 2px solid #ff7a3a; border-radius: 4px; background: rgba(255,74,28,0.25); }
 ${free(4, 46, 46)}
 ${P(4)} .mt-fa::before { border-radius: 50%; border-width: 2px; background: radial-gradient(circle at 40% 30%, color-mix(in srgb, var(--c) 45%, #fff) 0, color-mix(in srgb, var(--c) 40%, #05070f) 70%); }
 ${P(4)} .mt-fa b { font-size: 0; gap: 0; } ${P(4)} .mt-fa b::before { width: 22px !important; height: 22px !important; } ${P(4)} .mt-fa.info b i { font-size: 22px; }
 ${P(4)} .mt-fa::after { content: attr(aria-label); opacity: 1; inset: auto; left: 52px; top: 50%; translate: 0 -50%; font: italic 900 9px var(--neo-font); content: ""; }
 ${P(4)} .mt-fa.info { left: calc(100% + 10px); top: -4px; } ${P(4)} .mt-fa.run { left: calc(100% + 10px); top: 46px; } ${P(4)} .mt-fa.come { left: calc(100% + 10px); top: 96px; } ${P(4)} .mt-fa.all { left: calc(100% + 10px); top: 146px; }`,
// 5 RPG WINDOW
`${P(5)} .mt-foe-slab { transform: none; border: 3px solid #eef3ff; border-radius: 10px; background: linear-gradient(180deg, #2a46b8 0%, #14246e 60%, #0b1548 100%); box-shadow: 0 0 0 2px #05070f, 0 8px 20px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.25); }
 ${P(5)} .mt-foe-slab::after { display: none; } ${P(5)} .mt-foe.at-left .mt-foe-pic { background: none; }
 ${P(5)} .mt-foe.at-left .mt-foe-txt { background: none; border: 0; } ${P(5)} .mt-foe.at-left .mt-foe-name { font-style: normal; text-shadow: 2px 2px 0 #05070f; }
 ${P(5)} .mt-foe.at-left :is(.mt-foe-num, .mt-foe-bite) i { color: #aee0ff; } ${P(5)} .mt-foe.at-left :is(.mt-foe-num, .mt-foe-bite) b { font-style: normal; text-shadow: 2px 2px 0 #05070f; }
 ${P(5)} .mt-foe-atk { left: 6px; right: 6px; bottom: 6px; height: 32px; border: 2px solid #eef3ff; border-radius: 6px; background: linear-gradient(180deg, #ffe07a, #ff8a2a); } ${P(5)} .mt-foe-atk b { color: #05070f; text-shadow: none; font-style: normal; } ${P(5)} .mt-foe-atk b::before { display: none; } ${P(5)} .mt-foe-atk b::after { content: "\\25C0"; font-size: 13px; }
 ${P(5)} .mt-foe-acts { left: calc(100% + 6px); right: auto; width: 92px; top: 0; bottom: auto; height: 172px; border: 3px solid #eef3ff; border-radius: 10px; background: linear-gradient(180deg, #2a46b8, #0b1548); box-shadow: 0 0 0 2px #05070f, 0 8px 20px rgba(0,0,0,0.5); pointer-events: auto; }
 ${P(5)} :is(.mt-fa.all, .mt-fa.run, .mt-fa.come, .mt-fa.info) { animation: none; translate: none; transform: none; left: 6px; width: 74px; height: 36px; justify-content: flex-start; padding-left: 16px; z-index: 5; }
 ${P(5)} .mt-fa::before { display: none; } ${P(5)} .mt-fa b { flex-direction: row; width: auto; gap: 0; font: 900 14px var(--neo-font); font-style: normal; color: #fff; text-shadow: 2px 2px 0 #05070f; } ${P(5)} .mt-fa b::before { display: none; } ${P(5)} .mt-fa.info b i { display: none; }
 ${P(5)} .mt-fa.info { top: 8px; } ${P(5)} .mt-fa.run { top: 46px; } ${P(5)} .mt-fa.come { top: 84px; } ${P(5)} .mt-fa.all { top: 122px; }
 ${P(5)} .mt-fa.info::after { content: "\\25B6"; opacity: 1; inset: auto; left: 0; top: 10px; font: 900 13px var(--neo-font); color: #fff; animation: none; box-shadow: none; }
 ${P(5)} .mt-fa.all.on b { color: #ffe07a; } ${P(5)} .mt-fa.run.going b { color: #ff9a7a; }`,
// 6 SCOPE DISC
`${P(6)} .mt-foe-slab { transform: none; border: 0; background: none; box-shadow: none; overflow: visible; grid-template-columns: 136px 1fr; }
 ${P(6)} .mt-foe-slab::after { display: none; }
 ${P(6)} .mt-foe.at-left .mt-foe-pic { inset: auto; left: 2px; top: 0; width: 132px; height: 132px; border-radius: 50%; border: 4px solid var(--c); overflow: hidden; background: radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--c) 50%, #0b1226), #05070f 75%); box-shadow: 0 0 0 3px #05070f, 0 0 20px -2px var(--c), inset 0 0 18px rgba(0,0,0,0.8); }
 ${P(6)} .mt-foe.at-left .mt-foe-pic.full img { left: -44px; top: -50px; width: 220px; height: 220px; }
 ${P(6)} .mt-foe.at-left .mt-foe-sub { left: 0; right: 0; bottom: 6px; width: auto; justify-content: center; padding: 0; }
 ${P(6)} .mt-foe.at-left .mt-foe-txt { grid-column: 2; background: rgba(5,7,15,0.72); border: 1px solid color-mix(in srgb, var(--c) 60%, transparent); border-radius: 10px; margin: 4px 0 50px 4px; }
 ${P(6)} .mt-foe-atk { left: 4px; right: auto; width: 230px; bottom: 2px; height: 40px; border: 3px solid #ffe0c8; border-radius: 22px; background: linear-gradient(180deg, #ffe07a, #ff8a2a 45%, #ff3a10); } ${P(6)} .mt-foe-atk b { color: #05070f; text-shadow: none; }
 ${free(6, 44, 44)}
 ${P(6)} .mt-fa::before { border-radius: 50%; border-width: 2px; } ${P(6)} .mt-fa b { font-size: 7.5px; gap: 0; } ${P(6)} .mt-fa b::before { width: 18px !important; height: 18px !important; } ${P(6)} .mt-fa.info b i { font-size: 16px; }
 ${P(6)} .mt-fa.info { left: calc(100% + 2px); top: -6px; } ${P(6)} .mt-fa.run { left: calc(100% + 16px); top: 40px; } ${P(6)} .mt-fa.come { left: calc(100% + 16px); top: 88px; } ${P(6)} .mt-fa.all { left: calc(100% + 2px); top: 134px; }`,
// 7 WIDE BANNER
`${P(7)} .mt-foe.at-left { min-height: 0; padding-top: 40px; } ${P(7)} .mt-foe-slot { width: 330px; }
 ${P(7)} .mt-foe-slab { transform: none; height: 128px; grid-template-columns: 112px 1fr 92px; clip-path: polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px)); border-width: 2px; }
 ${P(7)} .mt-foe-slab::after { background: linear-gradient(180deg, rgba(255,255,255,0.14), transparent 40%); box-shadow: none; }
 ${P(7)} .mt-foe.at-left .mt-foe-pic { inset: 8px auto 8px 8px; width: 98px; clip-path: polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%); background: radial-gradient(circle, color-mix(in srgb, var(--c) 60%, #0b1226), #05070f 80%); }
 ${P(7)} .mt-foe.at-left .mt-foe-pic.full img { left: -40px; top: -40px; width: 180px; height: 180px; } ${P(7)} .mt-foe.at-left .mt-foe-sub { bottom: 2px; left: 6px; width: auto; padding: 0; }
 ${P(7)} .mt-foe.at-left .mt-foe-txt { grid-column: 2; background: none; border: 0; margin: 6px 4px; } ${P(7)} .mt-foe.at-left .mt-foe-name { -webkit-line-clamp: 1; }
 ${P(7)} .mt-foe-atk { left: auto; right: 0; top: 0; bottom: 0; width: 92px; height: auto; border-top: 0; border-left: 3px solid #ffe0c8; background: linear-gradient(180deg, #ffe07a, #ff8a2a 45%, #ff3a10); }
 ${P(7)} .mt-foe-atk b { flex-direction: column; gap: 4px; color: #05070f; text-shadow: none; font-size: 17px; } ${P(7)} .mt-foe-atk b::before { width: 34px !important; height: 34px !important; }
 ${free(7, 76, 34)}
 ${P(7)} .mt-fa::before { border-radius: 8px 8px 0 0; border-bottom: 0; } ${P(7)} .mt-fa b { flex-direction: row; gap: 4px; } ${P(7)} .mt-fa b::before { width: 15px !important; height: 15px !important; }
 ${P(7)} .mt-fa { top: 8px; z-index: 1; } ${P(7)} .mt-fa.info { left: 4px; } ${P(7)} .mt-fa.run { left: 84px; } ${P(7)} .mt-fa.come { left: 164px; } ${P(7)} .mt-fa.all { left: 244px; }
 ${P(7)}.foe .mt-cmd-roster { bottom: calc(var(--cn-tool) - 2px); }`,
// 8 TABS ON TOP
`${P(8)} .mt-foe.at-left { padding-top: 0; }
 ${P(8)} .mt-foe-slab { transform: rotate(-1.5deg); border-radius: 6px; border-width: 3px; }
 ${P(8)} :is(.mt-fa.all, .mt-fa.run, .mt-fa.come, .mt-fa.info) { animation: mt-fa-bob 1.8s ease-in-out infinite; translate: none; width: 54px; height: 62px; top: -46px; padding: 0 0 18px; align-items: center; justify-content: center; z-index: 1; }
 @keyframes mt-fa-bob { 50% { translate: 0 -3px; } }
 ${P(8)} .mt-fa::before { border-radius: 8px 8px 4px 4px; } ${P(8)} .mt-fa b { width: auto; font-size: 9px; } ${P(8)} .mt-fa b::before { width: 18px !important; height: 18px !important; } ${P(8)} .mt-fa.info b i { font-size: 18px; }
 ${P(8)} .mt-fa.info { left: 6px; transform: rotate(-7deg); animation-delay: 0s; } ${P(8)} .mt-fa.run { left: 64px; transform: rotate(-3deg); animation-delay: -0.4s; } ${P(8)} .mt-fa.come { left: 122px; transform: rotate(2deg); animation-delay: -0.8s; } ${P(8)} .mt-fa.all { left: 180px; transform: rotate(6deg); animation-delay: -1.2s; }
 ${P(8)}.foe .mt-cmd-roster { bottom: calc(var(--cn-tool) + 58px); }`,
// 9 LAB TERMINAL
`${P(9)} .mt-foe-slab { transform: none; border: 1px solid #19e6c1; border-radius: 4px; background: repeating-linear-gradient(0deg, rgba(25,230,193,0.06) 0 1px, transparent 1px 3px), radial-gradient(ellipse at 40% 50%, #06302a, #010b09 80%); box-shadow: 0 0 0 3px #031512, 0 0 0 4px rgba(25,230,193,0.5), 0 0 24px -4px #19e6c1; }
 ${P(9)} .mt-foe-slab::after { background: linear-gradient(180deg, rgba(160,255,230,0.1), transparent 30%); box-shadow: inset 0 0 30px rgba(0,0,0,0.8); }
 ${P(9)} .mt-foe.at-left .mt-foe-pic { background: none; } ${P(9)} .mt-foe.at-left .mt-foe-pic img { filter: grayscale(1) sepia(1) hue-rotate(120deg) saturate(2.4) brightness(1.05) drop-shadow(0 0 6px #19e6c1) !important; opacity: 0.92; }
 ${P(9)} .mt-foe.at-left .mt-foe-txt { background: rgba(1,14,12,0.7); border-left: 1px dashed #19e6c1; }
 ${P(9)} .mt-foe.at-left .mt-foe-txt, ${P(9)} .mt-foe.at-left .mt-foe-txt * { font-family: "DejaVu Sans Mono", monospace !important; font-style: normal !important; color: #7dffe0 !important; text-shadow: 0 0 6px rgba(25,230,193,0.7) !important; }
 ${P(9)} .mt-foe.at-left .mt-foe-name { font-size: 11.5px; } ${P(9)} .mt-foe.at-left .mt-foe-name::before { content: "> "; }
 ${P(9)} .mt-foe.at-left .mt-foe-hp u { background: #19e6c1 !important; box-shadow: 0 0 6px #19e6c1; }
 ${P(9)} .mt-foe-atk { background: #19e6c1; border-top: 1px solid #b8fff4; } ${P(9)} .mt-foe-atk b { font-family: "DejaVu Sans Mono", monospace; font-style: normal; color: #031512; text-shadow: none; font-size: 18px; } ${P(9)} .mt-foe-atk b::before { display: none; }
 ${P(9)} .mt-foe-atk b::after { content: "_"; animation: tblink 1s steps(1) infinite; } @keyframes tblink { 50% { opacity: 0; } }
 ${free(9, 66, 36)}
 ${P(9)} .mt-fa::before { border-radius: 4px; border: 1px solid #19e6c1; background: linear-gradient(180deg, #0a3a32, #031512); box-shadow: 0 3px 0 #010b09, 0 0 10px -3px #19e6c1; }
 ${P(9)} .mt-fa b { font-family: "DejaVu Sans Mono", monospace; font-style: normal; color: #7dffe0; font-size: 10px; flex-direction: row; gap: 0; } ${P(9)} .mt-fa b::before { display: none; } ${P(9)} .mt-fa.info b i { display: none; }
 ${P(9)} .mt-fa b::after { content: ""; } ${P(9)} .mt-fa.info b { } ${P(9)} .mt-fa.run b, ${P(9)} .mt-fa.run.going b { color: #ff9a7a; } ${P(9)} .mt-fa.all.on::before { background: #19e6c1; } ${P(9)} .mt-fa.all.on b { color: #031512; }
 ${P(9)} .mt-fa.info { left: calc(100% + 8px); top: 4px; } ${P(9)} .mt-fa.run { left: calc(100% + 8px); top: 46px; } ${P(9)} .mt-fa.come { left: calc(100% + 8px); top: 88px; } ${P(9)} .mt-fa.all { left: calc(100% + 8px); top: 130px; }`,
// 10 CRYSTAL
`${P(10)} .mt-foe-stage { filter: drop-shadow(0 0 2px var(--c)) drop-shadow(0 0 12px color-mix(in srgb, var(--c) 60%, transparent)) drop-shadow(4px 6px 0 #05070f); }
 ${P(10)} .mt-foe-slab { transform: none; border: 0; box-shadow: none; clip-path: polygon(10% 0, 90% 0, 100% 14%, 100% 86%, 90% 100%, 10% 100%, 0 86%, 0 14%);
   background: conic-gradient(from 210deg at 35% 45%, color-mix(in srgb, var(--c) 45%, #05070f), #0b1226 25%, color-mix(in srgb, var(--c) 25%, #05070f) 45%, #0f1730 70%, color-mix(in srgb, var(--c) 45%, #05070f)); }
 ${P(10)} .mt-foe-slab::after { background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 22%), linear-gradient(225deg, transparent 70%, rgba(255,255,255,0.12) 71%, transparent 85%), linear-gradient(0deg, rgba(255,90,28,0.35), transparent 40%); box-shadow: none; }
 ${P(10)} .mt-foe.at-left .mt-foe-txt { background: rgba(5,7,15,0.6); border-left: 0; clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px); }
 ${free(10, 50, 44)}
 ${P(10)} .mt-fa::before { border: 0; border-radius: 0; clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); background: linear-gradient(160deg, color-mix(in srgb, var(--c) 70%, #fff), var(--c) 40%, color-mix(in srgb, var(--c) 45%, #05070f)); }
 ${P(10)} .mt-fa { color: #05070f; text-shadow: none; filter: drop-shadow(0 0 5px var(--c)); } ${P(10)} .mt-fa.run { color: #fff; } ${P(10)} .mt-fa b { font-size: 7.5px; gap: 0; } ${P(10)} .mt-fa b::before { width: 16px !important; height: 16px !important; } ${P(10)} .mt-fa.info b i { font-size: 15px; color: #05070f; text-shadow: none; }
 ${P(10)} .mt-fa.info { left: calc(100% + 6px); top: 6px; } ${P(10)} .mt-fa.run { left: calc(100% + 46px); top: 30px; } ${P(10)} .mt-fa.come { left: calc(100% + 6px); top: 54px; } ${P(10)} .mt-fa.all { left: calc(100% + 46px); top: 78px; }`,
].join('\n');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/game.html'; const f = path.join(ROOT, p);
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } const ext = path.extname(f); r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }[ext] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
  const port = srv.address().port, b = await chromium.launch(), pg = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
  pg.on('pageerror', e => console.log('page error:', e.message));
  await pg.goto('http://localhost:' + port + '/game.html?dev'); await pg.waitForTimeout(2500);
  await pg.evaluate(async () => { const wt = ms => new Promise(r => setTimeout(r, ms));
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wt(400); gameState.running = true; facilityBlackoutSet(false);
    const e = spawnCreature({ species: 'beetle', className: 'tank' }); e.x = player.x + 3; e.y = player.y + 1; e.moveSpeed = 0; e.baseMoveSpeed = 0; e.health = Math.round(e.maxHealth * 0.72);
    targetSet(e, true); mixToolRender(true); await wt(700); });
  await pg.addStyleTag({ content: CSS });
  const files = [];
  for (let n = 0; n <= 10; n++) {
    await pg.evaluate(n => { for (let i = 1; i <= 10; i++) document.body.classList.toggle('d' + i, i === n); }, n); await pg.waitForTimeout(500);
    const f = path.join(OUT, String(n).padStart(2, '0') + '.png');
    await pg.screenshot({ path: f, clip: { x: 0, y: VH - 400, width: 560, height: 400 } }); files.push(f);
  }
  await b.close(); srv.close();
  // the sheet: each with its number and name over it, two to a row
  const lab = files.map((f, n) => { const o = f.replace(/\.png$/, '-l.png'); execFileSync('convert', ['-background', '#070b16', '-fill', '#ffcc44', '-font', 'DejaVu-Sans-Bold', '-pointsize', '40', 'label:' + (n ? n + '  ' : '') + NAMES[n], f, '-gravity', 'west', '-append', o]); return o; });
  execFileSync('montage', ['-label', '', ...lab.slice(1), '-tile', '2x', '-geometry', '+12+12', '-background', '#070b16', path.join(OUT, 'sheet.png')]);
  console.log('wrote', files.length, 'drafts and the sheet to', OUT);
})();
