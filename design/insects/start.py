# The start-here picture: the Ant Scout and THE ANT QUEEN up close, today's look beside the variations (design/insects; pictures go to the scratchpad).
#   python3 design/insects/start.py <raw dir> <out.png> <title> 0-current:TODAY D:"D  earthy" E:"E  our colours" ...
import sys
from PIL import Image, ImageDraw, ImageFont
raw, out, title = sys.argv[1:4]; items = [a.split(':', 1) for a in sys.argv[4:]]
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
W, pad, lab = 1100, 24, 56; cols = len(items)
rows = []
for key in ['battle', 'scout', 'queen']:
    ims = [Image.open('%s/%s-%s.png' % (raw, k, key)).convert('RGB') for k, _ in items]
    rows.append([i.resize((W, round(i.height * W / i.width)), Image.LANCZOS) for i in ims])
h = rows[0][0].height
im = Image.new('RGB', (pad * (cols + 1) + W * cols, 80 + len(rows) * (h + lab + pad)), (14, 22, 28)); d = ImageDraw.Draw(im)
d.text((pad, 20), title, fill=(240, 240, 240), font=F)
y = 80
for r, ims in enumerate(rows):
    for c in range(cols):
        x = pad + c * (W + pad); d.text((x, y + 8), items[c][1] + ('  ·  ' + ['battle camera', 'Ant Scout, close', 'THE ANT QUEEN, close'][r]), fill=(160, 200, 210) if c == 0 else (255, 196, 120), font=F); im.paste(ims[c], (x, y + lab))
    y += h + lab + pad
im.save(out); print(out, im.size)
