# Makes design/sewer-kit/kit.js, the sewer kit's draft, from the built look (view3d/sewerdress.js) and the kit's two parts (block_walls.js, block_floor.js):
#   python3 design/sewer-kit/make.py        (from the repository's root)
# The kit's walls' part takes the place of FAITHFUL's two plain back-wall pipes; its floor part goes in before the floor tiles' pictures (it needs the grates' places). The function is renamed
# sewerDressKit and made the game's sewerDress at the file's end: served after the built script (design/sewer-variety/render.js, its variation this file's path) it takes the built one's place.
HEAD = """// THE SEWER KIT, A DRAFT (design/sewer-kit/kit.js; Proposed: pictures for the owner, nothing in the game). The owner, 2026-11-27: "I want to upgrade the sewer and make it look better with more
// textures and better equipment around the map, fully rendered objects and pipes that go along the walls, just stuff you'd find in a sewer." The built look (view3d/sewerdress.js, as approved)
// with its two plain back-wall pipes replaced by the kit (design/sewer-kit/block_walls.js: the services on every wall, the equipment on them, the stains, the tide line) and the kit's floor part
// added (design/sewer-kit/block_floor.js: access covers, service cabinets). MADE by design/sewer-kit/make.py from those three files: do not edit it, edit them. Served in memory by
// design/sewer-variety/render.js (its variation: this file's path) after the built script, it takes sewerDress's place. Nothing on disk in the game is changed by it.
"""
import sys
# the walls' patches (the owner, 2026-11-27, of draft 2: "Looks really good, I don't like the red brick... what can we do instead?"): python3 design/sewer-kit/make.py A|B|C writes
# design/sewer-kit/kit_<A|B|C>.js with the built look's brick (the plaster broken back to it, and the wall mostly of it) drawn instead as A concrete, B grey brick or C old tile; no letter: as built (red brick)
WALLS = {
  'A': '''  const brickIn = (g, clip, x0) => { g.save(); clip(); g.clip(); g.fillStyle = '#7b7a70'; g.fillRect(x0, 0, 128, 128);   // (A, CONCRETE: poured in boards, its aggregate, its form-tie holes with a rust tear under each)
    for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x0, r * 32 + 30, 128, 2); g.fillStyle = 'rgba(255,255,240,0.06)'; g.fillRect(x0, r * 32 + 32, 128, 2); }
    for (let i = 0; i < 420; i++) { g.fillStyle = hsh(i, x0, 61) < 0.5 ? 'rgba(40,40,34,0.35)' : 'rgba(200,198,180,0.3)'; g.fillRect(x0 + hsh(i, 1, 62 + x0) * 128, hsh(i, 2, 63 + x0) * 128, 1 + hsh(i, 3, 64) * 2, 1 + hsh(i, 4, 65) * 2); }
    for (const [tx, ty] of [[32, 14], [96, 14], [32, 78], [96, 78]]) { g.fillStyle = '#3a3a33'; g.beginPath(); g.arc(x0 + tx, ty, 2.8, 0, 6.3); g.fill(); g.fillStyle = 'rgba(96,52,24,0.38)'; g.fillRect(x0 + tx - 1, ty + 3, 2.4, 10 + hsh(tx, ty, 66) * 12); }
    grime(g, x0, 0, 128, 128, 160, 30 + x0); g.restore(); };
''',
  'B': '''  const brickIn = (g, clip, x0) => { g.save(); clip(); g.clip(); g.fillStyle = '#2c2d2b'; g.fillRect(x0, 0, 128, 128); const BK = ['#5d6064', '#53575b', '#676a6d', '#4d5155'];   // (B, GREY BRICK: engineering brick, blue grey)
    for (let r = 0; r < 11; r++) for (let k = 0; k < 7; k++) { g.fillStyle = pick(BK, hsh(r, k, 4 + x0)); g.fillRect(x0 + k * 24 + (r % 2) * 12 - 12 + 1, r * 12 + 1, 22, 10); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x0 + k * 24 + (r % 2) * 12 - 12 + 1, r * 12 + 1, 22, 2); }
    grime(g, x0, 0, 128, 128, 160, 30 + x0); g.restore(); };
''',
  'C': '''  const brickIn = (g, clip, x0) => { g.save(); clip(); g.clip(); g.fillStyle = '#4a4b42'; g.fillRect(x0, 0, 128, 128);   // (C, OLD TILE: cream glazed tiles, a dark green band, a few gone)
    for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) { const band = r === 5 || r === 6; if (hsh(r, k, 71 + x0) < 0.07) continue; g.fillStyle = band ? pick(['#3f6652', '#44705a', '#3a5e4c'], hsh(r, k, 72)) : pick(['#c4c2aa', '#bcbca4', '#cac6ae'], hsh(r, k, 73));
      g.fillRect(x0 + k * 16 + 1, r * 16 + 1, 14, 14); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0 + k * 16 + 1, r * 16 + 1, 14, 3); }
    grime(g, x0, 0, 128, 128, 200, 30 + x0); g.restore(); };
''' }
V = sys.argv[1] if len(sys.argv) > 1 else ''
src = open('view3d/sewerdress.js').read()
if V:
    i = src.index("  const brickIn = (g, clip, x0) =>"); j = src.index("\n", i) + 1
    src = src[:i] + WALLS[V] + src[j:]
W = open('design/sewer-kit/block_walls.js').read()
F = open('design/sewer-kit/block_floor.js').read()
a = src.index("  // rusty pipes along the back walls")
b = src.index("\n", src.index("  for (const list of back.values())")) + 1
src = src[:a] + W + src[b:]
m = "  // ── each floor tile's picture and its turn, from its own seed ──"
assert src.count(m) == 1
src = src.replace(m, F + m)
assert src.count("function sewerDress(w, lab) {") == 1
src = src.replace("function sewerDress(w, lab) {", "function sewerDressKit(w, lab) {")
out = 'design/sewer-kit/kit' + ('_' + V if V else '') + '.js'
open(out, 'w').write(HEAD + src + "\nsewerDress = sewerDressKit;\n")
print(out + ':', len(HEAD + src), 'characters')
