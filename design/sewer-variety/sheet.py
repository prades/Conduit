# THE SEWER LOOK, VARIETY: the contact sheet (start-here.png): a row a spot, TODAY | 1 GRATING | 2 GRATING + CLUTTER, labelled.
#   python3 design/sewer-variety/sheet.py <dir with 0-*.png, 1-*.png, 2-*.png> <out.png>
import sys, os
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SPOTS = [('bridge', 'The main river and the steel bridge (from the north ledge)'), ('bank', 'The south ledge: the walkway along the river'),
         ('arch', 'The service bridge, the river mouth and the big barred arch'), ('wide', 'Wide: the river, both ledges, the bridge (zoomed out)'),
         ('sd-west', 'The sewer dungeon (?sewerdungeon): the west walkway'), ('sd-central', 'The sewer dungeon: the central walkway'),
         ('sd-ring', 'The sewer dungeon: the ring by the junction nest'), ('close', 'Close: the walkway\'s grating (the bank, zoomed in as far as the game lets)')]
COLS = [('0', 'TODAY (main: 1 FAITHFUL, boards)'), ('1', '1  GRATING'), ('2', '2  GRATING + CLUTTER')]
W = 760; H = int(W * 1640 / 2360); PAD = 16; LAB = 34; ROWL = 30
F = lambda s, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('-Bold' if b else '') + '.ttf', s)
TW = PAD + 3 * (W + PAD); TH = 150 + LAB + len(SPOTS) * (ROWL + H + PAD) + 20
S = Image.new('RGB', (TW, TH), (14, 16, 18)); g = ImageDraw.Draw(S)
g.text((PAD, 16), 'THE SEWERS: GRATING WALKWAYS, LESS UNIFORM. Drafts for the owner (pictures only; nothing in the game)', font=F(28), fill=(240, 236, 220))
notes = ['No wood: the walkways are steel bar grating in concrete frames (you see down through them to the dark and a trickle below); the bridges\' decks a see-through grating; the posts steel.',
         'Less uniform: grating panels of several kinds and sizes (long panels, mesh, rusted, a plate patch, a bar gone), concrete of mixed tones with cracks, puddles, damp and moss, rust streaks, brick in clusters, breaks in the chain.',
         '2 adds sparse low clutter by the walls (rubble, a drum, a steel crate, trash bags), pipe offshoots with valves, cables hanging along the back walls. The game\'s 3D view, headless Chromium (software WebGL); HUD hidden.']
for i, t in enumerate(notes): g.text((PAD, 60 + i * 28), t, font=F(18, False), fill=(200, 200, 190))
y = 150
for c, (k, t) in enumerate(COLS): g.text((PAD + c * (W + PAD), y + 4), t, font=F(24), fill=(255, 214, 120) if k != '0' else (160, 200, 210))
y += LAB
for name, title in SPOTS:
    g.text((PAD, y + 2), title, font=F(20, False), fill=(220, 220, 210)); y += ROWL
    for c, (k, t) in enumerate(COLS):
        p = os.path.join(D, k + '-' + name + '.png')
        if os.path.exists(p): S.paste(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS), (PAD + c * (W + PAD), y))
    y += H + PAD
S.save(OUT); print(OUT, S.size)
