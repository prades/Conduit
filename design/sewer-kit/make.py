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
src = open('view3d/sewerdress.js').read()
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
open('design/sewer-kit/kit.js', 'w').write(HEAD + src + "\nsewerDress = sewerDressKit;\n")
print('design/sewer-kit/kit.js:', len(HEAD + src), 'characters')
