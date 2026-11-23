# THE SEWER LOOK, VARIETY: the contact sheet (start-here.png): a row a spot, TODAY | 1 GRATING | 2 GRATING + CLUTTER, labelled.
#   python3 design/sewer-variety/sheet.py <dir with 0-*.png, 1-*.png, 2-*.png> <out.png>
import sys, os
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SPOTS4 = [('sd-central', 'The sewer dungeon: the central walkway (your framing)'), ('bridge', 'The main river and the steel bridge (from the north ledge)'), ('bank', 'The south ledge: the walkway along the river'), ('sd-west', 'The sewer dungeon: the west walkway')]
SPOTS = [('bridge', 'The main river and the steel bridge (from the north ledge)'), ('bank', 'The south ledge: the walkway along the river'),
         ('arch', 'The service bridge, the river mouth and the big barred arch'), ('wide', 'Wide: the river, both ledges, the bridge (zoomed out)'),
         ('sd-west', 'The sewer dungeon (?sewerdungeon): the west walkway'), ('sd-central', 'The sewer dungeon: the central walkway'),
         ('sd-ring', 'The sewer dungeon: the ring by the junction nest'), ('close', 'Close: the walkway\'s grating by the lamp on the north ledge (zoomed in as far as the game lets)')]
ROUND = os.environ.get('ROUND', '1')
SPOTS = SPOTS4 if os.environ.get('ROUND') == '4' else SPOTS
COLS = [('0', 'TODAY (main: 1 FAITHFUL, boards)'), ('1', '1  GRATING' + (' (revised)' if ROUND == '2' else '')), ('2', '2  GRATING + CLUTTER' + (' (revised)' if ROUND == '2' else ''))]
if ROUND == '4': COLS = [('0', 'BUILT TODAY (34e4bf20)'), ('4', 'ROUND 4: LONG GRATE PANELS')]
elif ROUND == '3': COLS = [('0', 'TODAY (main: 1 FAITHFUL, boards)'), ('3', 'ROUND 3: SMOOTH GRATING, CLEANER')]
W = 760 if ROUND not in ('3', '4') else 1140; H = int(W * 1640 / 2360); PAD = 16; LAB = 34; ROWL = 30
F = lambda s, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('-Bold' if b else '') + '.ttf', s)
TW = PAD + len(COLS) * (W + PAD); TH = 150 + LAB + len(SPOTS) * (ROWL + H + PAD) + 20
S = Image.new('RGB', (TW, TH), (14, 16, 18)); g = ImageDraw.Draw(S)
g.text((PAD, 16), 'THE SEWERS: GRATING WALKWAYS' + (', ROUND ' + ROUND if ROUND != '1' else ', LESS UNIFORM') + '. Drafts for the owner (pictures only; nothing in the game)', font=F(28), fill=(240, 236, 220))
notes2 = ['ROUND 2, from your mark-up of 2-sd-central: the walkway grating is now almost uniform: one kind, the same size, aligned, the bars the same way (about 1 in 15 rusted or patched).',
          'The flat dark slabs are dressed: the walls\' tops and the stubs of sunk walls are concrete coping like the walls (tone, grime, cracks, a lighter edge), and the channels\' sloped sides and the',
          'ledges\' sides are the walls\' stone. Everything else as round 1 (no wood; variety in the concrete, walls, stains, pipes; 2 adds the clutter). Headless Chromium (software WebGL); HUD hidden.']
notes3 = ['ROUND 3, from your notes on round 2 ("too dingy", "the tiles look on the grates ... checkered board", "smoother, less intrusive"): each walkway is one smooth run of fine',
          'grating along its length, low contrast, no frames or seams, no rusted or patched panels; a quiet concrete strip only on its long edges. The bridges\' grating is calmer. Brighter light and textures,',
          'grime, stains and moss cut to a light touch, fewer cracks, smoother concrete; the caps and stone sides of round 2 kept, lighter. No clutter. Headless Chromium (software WebGL); HUD hidden.']
notes4 = ['ROUND 4, from your mark-up of built-sd-central ("Should have long style grates"): each walkway is long grate panels, five tiles along it and the width of the walkway, set in the concrete',
          'with a thin border round each and a short concrete gap between them; the bars run across each panel (they show the panel\'s length and read as a grate from the camera); all alike, lined up.',
          'Everything else as built (brightness, cleanliness, the Sewers\' caps, the dungeon\'s solid dark). Headless Chromium (software WebGL); HUD hidden.']
notes = ['No wood: the walkways are steel bar grating in concrete frames (you see down through them to the dark and a trickle below); the bridges\' decks a see-through grating; the posts steel.',
         'Less uniform: grating panels of several kinds and sizes (long panels, mesh, rusted, a plate patch, a bar gone), concrete of mixed tones with cracks, puddles, damp and moss, rust streaks, brick in clusters, breaks in the chain.',
         '2 adds sparse low clutter by the walls (rubble, a drum, a steel crate, trash bags), pipe offshoots with valves, cables hanging along the back walls. The game\'s 3D view, headless Chromium (software WebGL); HUD hidden.']
for i, t in enumerate(notes4 if ROUND == '4' else notes3 if ROUND == '3' else notes2 if ROUND == '2' else notes): g.text((PAD, 60 + i * 28), t, font=F(18 if ROUND not in ('3', '4') else 17, False), fill=(200, 200, 190))
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
