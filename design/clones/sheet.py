# The clones' contact sheets (design/clones; pictures go to the scratchpad, not the repo).
#   python3 design/clones/sheet.py <raw dir> <out dir>   ->  start-here.png, marks.png, <species>.png
import sys, os
from PIL import Image, ImageDraw, ImageFont
raw, out = sys.argv[1:3]
def font(n):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
F1, F2, F3 = font(44), font(28), font(24)
BG, WHITE, CAP, SUB = (14, 22, 28), (240, 240, 240), (255, 196, 120), (160, 200, 210)
def im(name, w):
    p = os.path.join(raw, name)
    if not os.path.exists(p): return None
    i = Image.open(p).convert('RGB'); return i.resize((w, round(i.height * w / i.width)), Image.LANCZOS)
def sheet(title, notes, rows, W, fn):
    """rows: list of [(file, caption)]; each row's pictures W wide"""
    pad, lab = 24, 46
    cols = max(len(r) for r in rows)
    cells = [[(im(f, W), c) for f, c in r] for r in rows]
    H = 40 + 60 + len(notes) * 34 + 20 + sum(lab + max((i.height for i, _ in r if i), default=0) + pad for r in cells)
    S = Image.new('RGB', (pad + cols * (W + pad), H), BG); d = ImageDraw.Draw(S)
    d.text((pad, 28), title, fill=WHITE, font=F1); y = 100
    for n in notes: d.text((pad, y), n, fill=SUB, font=F3); y += 34
    y += 20
    for r in cells:
        h = max((i.height for i, _ in r if i), default=0)
        for k, (i, c) in enumerate(r):
            x = pad + k * (W + pad); d.text((x, y + 8), c, fill=CAP, font=F2)
            if i: S.paste(i, (x, y + lab))
            else: d.text((x, y + lab + 20), '(missing)', fill=(255, 80, 80), font=F2)
        y += lab + h + pad
    S.save(os.path.join(out, fn)); print(os.path.join(out, fn), S.size)

NAMES = {'mantis': 'THE MANTIS', 'beetle': 'THE BEETLE', 'scorpion': 'THE SCORPION', 'spider': 'THE SPIDER', 'moth': 'THE MOTH', 'rolypoly': 'THE ROLY-POLY'}
MARKS = {'A': 'A  TEAL EYES + TEAL STRIPE', 'B': 'B  TEAL RING AT ITS FEET', 'C': 'C  TEAL-TINTED ARMOUR'}
mark = os.environ.get('MARK', 'A')
sheet('QUESTION 1: HOW A CLONE SHOWS IT IS YOURS (3D view, drafts)',
      ['An ant scout clone (the approved Stalker D body) beside an enemy ant scout. Every option gives the clone teal eyes, as the 2D game gives a clone its team colour in its eyes.',
       'Top row: the real card-battle camera (the enemies upper left, with red brackets and bars; your clone the ant on its own at upper right, by the Frost Maw). Then close up: ENEMY on the left, CLONE on the right.'],
      [[('mark%s-battle.png' % m, MARKS[m] + '  ·  battle camera') for m in 'ABC'],
       [('mark%s-pair.png' % m, MARKS[m] + '  ·  close: enemy | clone') for m in 'ABC'],
       [('mark%s-top.png' % m, MARKS[m] + '  ·  from above') for m in 'ABC']], 1100, 'marks.png')
for sp, nm in NAMES.items():
    extra = ' (its tank clone: the "Emotional Support" gift)' if sp == 'mantis' else ''
    sheet(nm + ' IN 3D: A FIRST BODY (draft), AS AN ENEMY AND AS YOUR CLONE (mark ' + mark + ')',
          ['The real card-battle camera: three of this species (upper left, red brackets) against your squad; your clone of it is the one on its own at upper right.' + extra,
           'Close pictures: ENEMY on the left, CLONE on the right. Poses are only those the view already asks of a creature: walking, its bite, standing.'],
          [[(sp + '-battle.png', 'DRAFT 3D  ·  battle camera'), (sp + '-bite.png', 'its bite (the attack pose)')],
           [(sp + '-pair.png', 'scouts, close: enemy | clone'), (sp + '-tank.png', 'tanks, close: enemy | clone')],
           [(sp + '-scout.png', 'enemy scout, standing'), (sp + '-side.png', 'from the side, walking')]], 1100, sp + '.png')
sheet('THE CLONES IN 3D: START HERE (drafts for the owner, nothing in the game)',
      ['Q1 (top): three ways for a clone to show it is yours, on an ant scout clone beside an enemy ant scout (close: enemy left, clone right).',
       'Q2 (below): a first 3D body for each species that can be cloned and has none, enemy left and your clone right (mark ' + mark + '). Per-species sheets have more.'],
      [[('mark%s-pair.png' % m, MARKS[m]) for m in 'ABC'],
       [('mantis-tank.png', 'MANTIS (tanks: the gift)'), ('beetle-pair.png', 'BEETLE'), ('scorpion-pair.png', 'SCORPION')],
       [('spider-pair.png', 'SPIDER'), ('moth-pair.png', 'MOTH'), ('rolypoly-pair.png', 'ROLY-POLY (approved look B)')],
       [('markA-battle.png', 'battle camera, mark A'), ('mantis-battle.png', 'battle camera, mantises'), ('rolypoly-battle.png', 'battle camera, roly-polies')]], 900, 'start-here.png')
