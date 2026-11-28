import math
exec(open('trace.py').read())
TILE=34.0   # photo px a tile
ANG=[0,60,90,120]
def snap(a):   # an edge's direction to the nearest of the allowed, as an angle mod 180
    a=a%180; return min(ANG+[180], key=lambda t: abs(a-t))%180
def line(p,q): a=math.degrees(math.atan2(q[1]-p[1],q[0]-p[0])); s=snap(a); m=((p[0]+q[0])/2,(p[1]+q[1])/2); return (m,s)
def meet(L1,L2):
    (m1,a1),(m2,a2)=L1,L2; d1=(math.cos(math.radians(a1)),math.sin(math.radians(a1))); d2=(math.cos(math.radians(a2)),math.sin(math.radians(a2)))
    den=d1[0]*d2[1]-d1[1]*d2[0]
    if abs(den)<1e-9: return None
    t=((m2[0]-m1[0])*d2[1]-(m2[1]-m1[1])*d2[0])/den; return (m1[0]+d1[0]*t, m1[1]+d1[1]*t)
def straighten(P, closed=True):
    n=len(P); E=[line(P[i],P[(i+1)%n]) for i in range(n if closed else n-1)]
    # merge neighbouring edges of the same direction into one (their middle the length-weighted middle)
    out=[]
    for i,(m,a) in enumerate(E):
        if out and out[-1][1]==a: pm,_=out[-1]; out[-1]=(((pm[0]+m[0])/2,(pm[1]+m[1])/2),a)
        else: out.append((m,a))
    if closed and len(out)>1 and out[0][1]==out[-1][1]: m0=out.pop(); out[0]=(((out[0][0][0]+m0[0][0])/2,(out[0][0][1]+m0[0][1])/2),out[0][1])
    V=[]
    if closed:
        for i in range(len(out)): v=meet(out[i-1],out[i]); V.append(v)
    else:
        V.append(P[0])
        for i in range(1,len(out)): V.append(meet(out[i-1],out[i]))
        V.append(P[-1])
    return V
O=straighten(OUT)
# A WALL SHORTER THAN A TILE (a kink the straightening leaves, as at the Crystal Chamber's top-left corner) is taken out: its two neighbours meet instead
def unkink(V, tile):
    changed=True
    while changed and len(V)>4:
        changed=False
        for i in range(len(V)):
            a,b=V[i],V[(i+1)%len(V)]
            if math.hypot(b[0]-a[0],b[1]-a[1])<tile:
                p0,p3=V[i-1],V[(i+2)%len(V)]
                d1=(a[0]-p0[0],a[1]-p0[1]); d2=(p3[0]-b[0],p3[1]-b[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
                if abs(den)<1e-9: continue
                t=((b[0]-p0[0])*d2[1]-(b[1]-p0[1])*d2[0])/den; q=(p0[0]+d1[0]*t,p0[1]+d1[1]*t)
                V=[v for k,v in enumerate(V) if k not in (i,(i+1)%len(V))]; V.insert(i if i<len(V) else len(V), q); changed=True; break
    return V
O=unkink(O, TILE*2.0)
Wl=[straighten(W,False) for W in WALLS]
xs=[p[0] for p in O]; ys=[p[1] for p in O]; x0,y0=min(xs),min(ys)
T=lambda p:((p[0]-x0)/TILE, (p[1]-y0)/TILE)   # to tiles
Ot=[T(p) for p in O]; Wt=[[T(p) for p in W] for W in Wl]
area=0.5*abs(sum(Ot[i][0]*Ot[(i+1)%len(Ot)][1]-Ot[(i+1)%len(Ot)][0]*Ot[i][1] for i in range(len(Ot))))
print('outline corners', len(Ot), 'size %.1f x %.1f tiles, floor about %d tiles' % (max(p[0] for p in Ot), max(p[1] for p in Ot), area))
import json; json.dump({'outline':Ot,'walls':Wt},open('draft-5-sharpen.json','w'))
S=22
W=(max(p[0] for p in Ot)+4)*S; H=(max(p[1] for p in Ot)+5)*S; o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}"><rect width="100%" height="100%" fill="#0b1226"/>']
TT=lambda p:((p[0]+2)*S,(p[1]+2)*S)
for gx in range(0,int(W/S)+1): o.append(f'<line x1="{gx*S}" y1="0" x2="{gx*S}" y2="{H}" stroke="#141d35"/>')
for gy in range(0,int(H/S)+1): o.append(f'<line x1="0" y1="{gy*S}" x2="{W}" y2="{gy*S}" stroke="#141d35"/>')
o.append('<polygon points="%s" fill="#3a4458" stroke="#e9f2f4" stroke-width="6" stroke-linejoin="round"/>' % ' '.join('%.1f,%.1f'%TT(p) for p in Ot))
LAB={ '1 · CRYSTAL CHAMBER':(260,470,'#2ec7b0'), '2 · SERVER ROOM':(700,470,'#6f8cff'), '3 · blocked off':(1150,600,'#5a6274'), '4 · WAREHOUSE':(1470,420,'#c9893f'), '5 · STAIRS UP · to the new floor':(1500,980,'#ffb347'),
      '6 · MAIN HALLWAY':(950,1110,'#9aa6b2'), '7 · OBSERVATION DECK · the entrance':(270,1200,'#a477ff'), '8 · HALLWAY · stairs down to the Experiment Lab':(290,690,'#7fd4ff') }
for k,(x,y,c) in LAB.items():
    p=TT(T((x,y))); parts=k.split(' · ',1); num,rest=parts[0],parts[1] if len(parts)>1 else ''; sub=rest.split(' · ',1)
    o.append(f'<circle cx="{p[0]:.0f}" cy="{p[1]:.0f}" r="20" fill="{c}" stroke="#0b1226" stroke-width="3"/><text x="{p[0]:.0f}" y="{p[1]+7:.0f}" fill="#0b1226" font-family="DejaVu Sans" font-weight="bold" font-size="20" text-anchor="middle">{num}</text>')
    o.append(f'<text x="{p[0]:.0f}" y="{p[1]+40:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="14" text-anchor="middle">{sub[0]}</text>')
    if len(sub)>1: o.append(f'<text x="{p[0]:.0f}" y="{p[1]+56:.0f}" fill="#fff" font-family="DejaVu Sans" font-size="12" text-anchor="middle">{sub[1]}</text>')
for Wp in Wt: o.append('<polyline points="%s" fill="none" stroke="#e9f2f4" stroke-width="6" stroke-linejoin="round"/>' % ' '.join('%.1f,%.1f'%TT(p) for p in Wp))
# the lounge along the top wall of the hallway: the straight stretch of the Server Room / hallway wall
w2=Wt[1]; a,b=w2[0],w2[1]; pa,pb=TT(a),TT(b); yy=min(pa[1],pb[1]); pa=(pa[0],yy); pb=(pb[0],yy)
o.append(f'<polygon points="{pa[0]:.0f},{pa[1]:.0f} {pb[0]:.0f},{pb[1]:.0f} {pb[0]:.0f},{pb[1]+2.4*S:.0f} {pa[0]:.0f},{pa[1]+2.4*S:.0f}" fill="#ff8fc8" fill-opacity="0.5"/><text x="{(pa[0]+pb[0])/2:.0f}" y="{pa[1]+1.6*S:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="14" text-anchor="middle">LOUNGE</text>')
for (a,b) in [((385+0,850+k*35),(530,850+k*35)) for k in range(6)]:   # the owner's stair strokes, straightened
    p,q=TT(T(a)),TT(T(b)); o.append(f'<line x1="{p[0]:.0f}" y1="{p[1]:.0f}" x2="{q[0]:.0f}" y2="{q[1]:.0f}" stroke="#fff" stroke-width="3"/>')
o.append(f'<text x="{W/2:.0f}" y="{H-12:.0f}" fill="#8fa3c4" font-family="DejaVu Sans" font-size="14" text-anchor="middle">Your map, sharpened · walls flat, 60°, upright or 120° · one square = one tile · about {int(area)} floor tiles in all</text>')
o.append('</svg>'); open('draft-5-sharpen.svg','w').write('\n'.join(o)); print(int(W),int(H))
