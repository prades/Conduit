import math, json
R=6.0; S=15  # tiles per cell radius, px per tile
def centre(q,y): return (1.5*R*q, math.sqrt(3)*R*y)   # flat-top: columns 1.5R apart, rows sqrt3 R (y in half rows for odd columns)
CELLS={ (0,0):'1', (0,1):'8', (0,2):'7', (1,0.5):'2', (2,0):'2', (3,0.5):'3', (4,0):'4', (4,1):'5', (4,2):'5',
        (1,1.5):'6', (1,2.5):'6', (2,1):'6', (2,2):'6', (3,1.5):'6', (3,2.5):'6' }
NAME={'1':('1 · CRYSTAL CHAMBER','#2ec7b0'),'2':('2 · SERVER ROOM','#6f8cff'),'3':('3 · blocked','#3a3f4a'),'4':('4 · WAREHOUSE','#c9893f'),
      '5':('5 · STAIRS UP to the new floor','#ffb347'),'6':('6 · MAIN HALLWAY','#9aa6b2'),'7':('7 · TO THE OBSERVATION DECK','#a477ff'),'8':('8 · STAIRS DOWN to the Experiment Lab','#7fd4ff')}
DOORS={frozenset('18'),frozenset('12'),frozenset('26'),frozenset('87'),frozenset('45'),frozenset('56')}   # open between these; every other shared side a wall
def corners(c): return [(c[0]+R*math.cos(math.radians(60*i)), c[1]+R*math.sin(math.radians(60*i))) for i in range(6)]
def key(p): return (round(p[0],2),round(p[1],2))
edges={}
used=set()
for cell,a in CELLS.items():
    P=corners(centre(*cell))
    for i in range(6):
        e=tuple(sorted([key(P[i]),key(P[(i+1)%6])])); edges.setdefault(e,[]).append(a)
want26=set()
Pa=corners(centre(1,1.5)); Pb=corners(centre(1,0.5))
for i in range(6):
    for j in range(6):
        e1=tuple(sorted([key(Pa[i]),key(Pa[(i+1)%6])])); e2=tuple(sorted([key(Pb[j]),key(Pb[(j+1)%6])]))
        if e1==e2: want26.add(e1)
xs=[p[0] for c in CELLS for p in corners(centre(*c))]; ys=[p[1] for c in CELLS for p in corners(centre(*c))]
ox,oy=-min(xs)+2,-min(ys)+2; W=(max(xs)-min(xs)+4)*S; H=(max(ys)-min(ys)+6)*S
T=lambda p:((p[0]+ox)*S,(p[1]+oy)*S)
o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}"><rect width="100%" height="100%" fill="#0b1226"/>']
for cell,a in CELLS.items():
    pts=' '.join('%.1f,%.1f'%T(p) for p in corners(centre(*cell))); col=NAME[a][1]
    o.append(f'<polygon points="{pts}" fill="{col}" fill-opacity="{0.9 if a=="3" else 0.3}" stroke="none"/>')
# the lounge: a strip along the hallway's top wall (the top edges of 6's upper cells)
for cell in [(2,1)]:
    c=centre(*cell); P=corners(c); a,b=P[4],P[5]
    o.append(f'<polygon points="{"%.1f,%.1f"%T(a)} {"%.1f,%.1f"%T(b)} {"%.1f,%.1f"%T((b[0],b[1]+2.2))} {"%.1f,%.1f"%T((a[0],a[1]+2.2))}" fill="#ff8fc8" fill-opacity="0.55"/>')
    m=T(((a[0]+b[0])/2,a[1]+1.4)); o.append(f'<text x="{m[0]:.0f}" y="{m[1]:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="15" text-anchor="middle">LOUNGE</text>')
for e,owners in edges.items():
    a,b=T(e[0]),T(e[1])
    if len(owners)==1: o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#e9f2f4" stroke-width="6" stroke-linecap="round"/>'); continue
    p,q=owners
    if p==q: continue
    pair=frozenset(p+q); first=pair in DOORS and pair not in used and not (pair==frozenset('26') and e not in want26)
    if first: used.add(pair)
    if first:   # a doorway: the middle third open (one to a pair of rooms)
        m1=(a[0]+(b[0]-a[0])/3,a[1]+(b[1]-a[1])/3); m2=(a[0]+2*(b[0]-a[0])/3,a[1]+2*(b[1]-a[1])/3)
        for s,t in [(a,m1),(m2,b)]: o.append(f'<line x1="{s[0]:.1f}" y1="{s[1]:.1f}" x2="{t[0]:.1f}" y2="{t[1]:.1f}" stroke="#e9f2f4" stroke-width="5" stroke-linecap="round"/>')
        o.append(f'<line x1="{m1[0]:.1f}" y1="{m1[1]:.1f}" x2="{m2[0]:.1f}" y2="{m2[1]:.1f}" stroke="#ffe733" stroke-width="3" stroke-dasharray="6 5"/>')
    else: o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#e9f2f4" stroke-width="5" stroke-linecap="round"/>')
done=set()
for cell,a in CELLS.items():
    if a in done: continue
    cs=[centre(*c) for c,b in CELLS.items() if b==a]; m=T((sum(p[0] for p in cs)/len(cs),sum(p[1] for p in cs)/len(cs)))
    if a=='6': m=(m[0],m[1]+20)
    n=NAME[a][0].split(' · ')
    o.append(f'<text x="{m[0]:.0f}" y="{m[1]-6:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="14" text-anchor="middle">{n[0]} · {n[1].split(" to ")[0]}</text>')
    if ' to ' in n[1]: o.append(f'<text x="{m[0]:.0f}" y="{m[1]+14:.0f}" fill="#fff" font-family="DejaVu Sans" font-size="13" text-anchor="middle">to {n[1].split(" to ")[1]}</text>')
    done.add(a)
# stairs hatching in 8 and 5
for a in '85':
    cs=[centre(*c) for c,b in CELLS.items() if b==a][:1]
    for c in cs:
        for i in range(5): y=c[1]+1.2+i*0.7; s=T((c[0]-2.4,y)); t=T((c[0]+2.4,y)); o.append(f'<line x1="{s[0]:.0f}" y1="{s[1]:.0f}" x2="{t[0]:.0f}" y2="{t[1]:.0f}" stroke="#fff" stroke-width="2.5"/>')
area={a:round(sum(1 for b in CELLS.values() if b==a)*2.598*R*R) for a in set(CELLS.values())}
o.append(f'<text x="{W/2:.0f}" y="{H-14:.0f}" fill="#8fa3c4" font-family="DejaVu Sans" font-size="14" text-anchor="middle">Draft 2 · a hexagon cell is {R:.0f} tiles across its corners (about {round(2.598*R*R)} floor tiles) · yellow dashes: doorways · white: walls</text>')
o.append('</svg>'); open('plan2.svg','w').write('\n'.join(o)); print(W,H, area)
