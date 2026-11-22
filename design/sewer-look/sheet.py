# THE SEWER LOOK: the contact sheet (start-here.png): a row a spot, today | 1 FAITHFUL | 2 IN OUR LOOK, labelled; the painting on top.
#   python3 design/sewer-look/sheet.py <dir with 0-*.png, 1-*.png, 2-*.png and reference.jpg> <out.png>
import sys, os
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SPOTS = [('bridge', 'The main river and the steel bridge (from the north ledge)'), ('bank', 'The south ledge: the walkway along the river'),
         ('arch', 'The service bridge, the river mouth and the big barred arch (the Nest)'), ('wide', 'Wide: the river, both ledges, the bridge (zoomed out)')]
COLS = [('0', 'TODAY (main, the floor put back)'), ('1', '1  FAITHFUL'), ('2', '2  IN OUR LOOK')]
W = 760; H = int(W * 1640 / 2360); PAD = 16; LAB = 34; ROWL = 30
F = lambda s, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('-Bold' if b else '') + '.ttf', s)
ref = Image.open(os.path.join(D, 'reference.jpg')).convert('RGB'); rw = W * 2; rh = int(ref.height * rw / ref.width); ref = ref.resize((rw, rh), Image.LANCZOS)
TW = PAD + 3 * (W + PAD); TH = 70 + rh + PAD + LAB + len(SPOTS) * (ROWL + H + PAD) + 40
S = Image.new('RGB', (TW, TH), (14, 16, 18)); g = ImageDraw.Draw(S)
g.text((PAD, 16), 'THE SEWER LOOK: drafts for the owner (pictures only; nothing in the game)', font=F(28), fill=(240, 236, 220))
S.paste(ref, (PAD, 66)); g.text((PAD + rw + PAD, 70), 'Your painting (reference.jpg)', font=F(22), fill=(230, 220, 190))
notes = ['Each row: the same spot of the game\'s Sewers,', 'in the 3D view (?engine=3d), the game\'s own camera.', '', 'TODAY: the 3D sewers as built (2026-11-17i).', '1 FAITHFUL: as near the painting\'s mood as our', '   3D look goes: dark, warm lamp pools, timber', '   boardwalks, stone, rust, murky olive water.', '2 IN OUR LOOK: the same materials and props in', '   CRYSTAL LAB 3D\'s flat colours, lighter.', '', 'Headless Chromium, software WebGL.', 'The HUD is hidden in these pictures.']
for i, t in enumerate(notes): g.text((PAD + rw + PAD, 110 + i * 28), t, font=F(19, False), fill=(200, 200, 190))
y = 66 + rh + PAD
for c, (k, t) in enumerate(COLS): g.text((PAD + c * (W + PAD), y + 4), t, font=F(24), fill=(255, 214, 120) if k != '0' else (160, 200, 210))
y += LAB
for name, title in SPOTS:
    g.text((PAD, y + 2), title, font=F(20, False), fill=(220, 220, 210)); y += ROWL
    for c, (k, t) in enumerate(COLS):
        p = os.path.join(D, k + '-' + name + '.png')
        if os.path.exists(p): S.paste(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS), (PAD + c * (W + PAD), y))
    y += H + PAD
S.save(OUT); print(OUT, S.size)
