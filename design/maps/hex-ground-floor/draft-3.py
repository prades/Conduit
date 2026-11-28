import math
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
R3=math.sqrt(3)
def hexa(cx,cy,a,b):   # a stretched flat-top hexagon: half-width a to its side corners, half-height b; its slanted walls at 60 degrees
    d=b/R3; return Polygon([(cx-a,cy),(cx-a+d,cy-b),(cx+a-d,cy-b),(cx+a,cy),(cx+a-d,cy+b),(cx-a+d,cy+b)])
ROOMS={
 '1':('CRYSTAL CHAMBER','#2ec7b0',hexa(6,6.5,6,4.6)),
 '2':('SERVER ROOM','#6f8cff',hexa(19.5,6.2,9.5,5.6)),
 '4':('WAREHOUSE','#c9893f',hexa(41,5,6.2,4.4)),
 '6':('MAIN HALLWAY','#9aa6b2',hexa(29.5,23.5,17.5,8.8)),
 '7':('TO THE OBSERVATION DECK','#a477ff',hexa(5.8,28,5.6,4.3)),
}
JOINTS={   # the straight, square joints: a corridor each
 '8':('STAIRS DOWN · to the Experiment Lab','#7fd4ff',box(3.4,10.5,8.4,24.2)),
 '5':('STAIRS UP · to the new floor','#ffb347',box(39.2,9.0,43.8,15.0)),
 'd26':(None,None,box(24.5,11.2,28.2,15.2)),   # the doorway from the Server Room to the hallway
}
allp=unary_union([v[2] for v in ROOMS.values()]+[v[2] for v in JOINTS.values()])
area=allp.area; minx,miny,maxx,maxy=allp.bounds
S=21; ox,oy=2-minx,2-miny; W=(maxx-minx+4)*S; H=(maxy-miny+5)*S
T=lambda x,y:((x+ox)*S,(y+oy)*S)
def path(poly): return ' '.join('%.1f,%.1f'%T(x,y) for x,y in list(poly.exterior.coords)[:-1])
o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}"><rect width="100%" height="100%" fill="#0b1226"/>']
for gx in range(int(W/S)+1): o.append(f'<line x1="{gx*S}" y1="0" x2="{gx*S}" y2="{H}" stroke="#141d35"/>')
for gy in range(int(H/S)+1): o.append(f'<line x1="0" y1="{gy*S}" x2="{W}" y2="{gy*S}" stroke="#141d35"/>')
polys=[allp] if allp.geom_type=='Polygon' else list(allp.geoms)
for P in polys: o.append(f'<polygon points="{path(P)}" fill="#3a4458"/>')
for k,(n,c,P) in list(ROOMS.items())+list(JOINTS.items()):
    if not n: continue
    o.append(f'<polygon points="{path(P)}" fill="{c}" fill-opacity="0.22"/>')
for P in polys: o.append(f'<polygon points="{path(P)}" fill="none" stroke="#e9f2f4" stroke-width="6" stroke-linejoin="round"/>')
# stairs hatching across each joint, and the lounge along the hallway's top wall
for k in '85':
    x0,y0,x1,y1=JOINTS[k][2].bounds
    yy=y0+1.2
    while yy<y1-0.6: a,b=T(x0+0.4,yy),T(x1-0.4,yy); o.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="#fff" stroke-width="2.5"/>'); yy+=0.9
hy=23.5-8.8; a,b=T(17.2,hy),T(24.4,hy+2.2)
o.append(f'<rect x="{a[0]:.0f}" y="{a[1]:.0f}" width="{b[0]-a[0]:.0f}" height="{b[1]-a[1]:.0f}" fill="#ff8fc8" fill-opacity="0.6"/><text x="{(a[0]+b[0])/2:.0f}" y="{(a[1]+b[1])/2+5:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="14" text-anchor="middle">LOUNGE</text>')
LAB={'1':(6,5.2),'2':(19.5,5),'4':(41,4),'6':(31,25),'7':(5.8,28.4),'8':(5.9,17),'5':(41.5,12)}
for k,(x,y) in LAB.items():
    n=(ROOMS.get(k) or JOINTS.get(k))[0]; p=T(x,y); parts=n.split(' · ')
    o.append(f'<text x="{p[0]:.0f}" y="{p[1]:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="15" text-anchor="middle">{k} · {parts[0]}</text>')
    if len(parts)>1: o.append(f'<text x="{p[0]:.0f}" y="{p[1]+16:.0f}" fill="#fff" font-family="DejaVu Sans" font-size="12" text-anchor="middle">{parts[1]}</text>')
o.append(f'<text x="{W/2:.0f}" y="{H-12:.0f}" fill="#8fa3c4" font-family="DejaVu Sans" font-size="14" text-anchor="middle">Draft 3 · stretched hexagon rooms, square stair corridors · one square = one tile · about {int(area)} floor tiles</text>')
o.append('</svg>'); open('plan4.svg','w').write('\n'.join(o)); print(int(W),int(H),int(area), allp.geom_type)
