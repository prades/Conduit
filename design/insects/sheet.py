# Contact sheet: today's look beside a variation, row by row (design/insects; pictures go to the scratchpad, not the repo).
#   python3 design/insects/sheet.py <raw dir> <variation letter> <title> <out.png>
import sys, os
from PIL import Image, ImageDraw, ImageFont
raw, v, title, out = sys.argv[1:5]
rows = [('battle', 'At the battle camera (the real battle view, lab floor)'), ('scout', 'Ant Scout, close 3/4'), ('side', 'Ant Scout, from the side'), ('tank', 'Ant Tank (a soldier), close'), ('queen', 'THE ANT QUEEN, close')]
W = 1100; pad = 24; head = 90; lab = 44
def font(n):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
F1, F2 = font(40), font(26)
cells = []
for key, cap in rows:
    a, b = os.path.join(raw, '0-current-%s.png' % key), os.path.join(raw, '%s-%s.png' % (v, key))
    if not (os.path.exists(a) and os.path.exists(b)): continue
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    h = round(ia.height * W / ia.width); cells.append((cap, ia.resize((W, h), Image.LANCZOS), ib.resize((W, h), Image.LANCZOS)))
H = head + sum(lab + c[1].height + pad for c in cells) + pad
im = Image.new('RGB', (pad * 3 + W * 2, H), (14, 22, 28)); d = ImageDraw.Draw(im)
d.text((pad, 24), title, fill=(240, 240, 240), font=F1)
y = head
for cap, ia, ib in cells:
    d.text((pad, y + 8), 'TODAY  ·  ' + cap, fill=(160, 200, 210), font=F2); d.text((pad * 2 + W, y + 8), 'DRAFT ' + v + '  ·  ' + cap, fill=(255, 196, 120), font=F2)
    y += lab; im.paste(ia, (pad, y)); im.paste(ib, (pad * 2 + W, y)); y += ia.height + pad
im.save(out); print(out, im.size)
