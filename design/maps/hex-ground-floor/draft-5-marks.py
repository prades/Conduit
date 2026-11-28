# Draft 3 sharpened, the owner's second markup (2026-11-28): the wall east of 3 mirrors the wall west of it; the Warehouse's east nook filled out;
# the 2|6 wall moved down with the Lounge north of it; the stairs hallway (8) made tighter by a blocked-off wedge between it and the Main Hallway.
import json, math
k=1/math.sqrt(3)   # across per step down, for a 60 or 120 degree wall
d=json.load(open('draft-5-sharpen.json')); V=[tuple(p) for p in d['outline']]
# 3: the east side mirrors the west side about the notch's middle
cx=(V[7][0]+V[8][0])/2; m=lambda p:(2*cx-p[0],p[1])
V[9]=m(V[6]); V[10]=m(V[5]); V[11]=(2*cx-V[4][0],0.0); V[12]=(V[12][0],0.0)
# 4: the nook on the Warehouse's east side filled: one corner where the 60 degree wall from 13 meets the 120 degree wall up from 16
a,b=V[13],V[16]; y=(b[1]+a[1]-(a[0]-b[0])/k)/2; ware=(a[0]+(y-a[1])*k, y)
# 8 and 6: the diagonal wall from the opening by the Server Room, at 60 degrees, down to the lounge wall
A=(11.60,11.18); YL=19.71; J=(A[0]+(YL-A[1])*k, YL); LEND=(30.43,YL)
P1=(A[0]+(15.18-A[1])*k, 15.18)                      # where the blocked wedge starts on the diagonal
v23,v24=V[23],V[24]
# the wedge's east side, from J at 120 degrees down to the outline's edge 24-23 (a 60 degree edge)
yR=(J[0]+J[1]*k - v24[0] + v24[1]*k)/(2*k); R=(J[0]-(yR-J[1])*k, yR)
# its west side parallels the hallway's outer wall; its south side runs at 60 degrees up from 24
yQ=(P1[0]+P1[1]*k - v24[0] + v24[1]*k)/(2*k); Q=(P1[0]-(yQ-P1[1])*k, yQ)
O=V[:14]+[ware]+V[16:24]+[R,J,P1,Q]+V[24:]
WALLS=[[A,P1],[J,LEND]]
area=0.5*abs(sum(O[i][0]*O[(i+1)%len(O)][1]-O[(i+1)%len(O)][0]*O[i][1] for i in range(len(O))))
for i in range(len(O)):   # every wall's angle, to check
    p,q=O[i],O[(i+1)%len(O)]; ang=math.degrees(math.atan2(q[1]-p[1],q[0]-p[0]))%180
    if min(abs(ang-t) for t in (0,60,90,120,180))>1.5: print('off-angle edge',i,'%.1f'%ang)
print('corners',len(O),'size %.1f x %.1f tiles, floor about %d tiles'%(max(p[0] for p in O),max(p[1] for p in O),area))
json.dump({'outline':O,'walls':WALLS},open('draft-5-chosen.json','w'))
S=22; W=54*S; H=(33.7+5)*S
TT=lambda p:((p[0]+2)*S,(p[1]+2)*S)
o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}"><rect width="100%" height="100%" fill="#0b1226"/>']
for gx in range(0,int(W/S)+1): o.append(f'<line x1="{gx*S}" y1="0" x2="{gx*S}" y2="{H}" stroke="#141d35"/>')
for gy in range(0,int(H/S)+1): o.append(f'<line x1="0" y1="{gy*S}" x2="{W}" y2="{gy*S}" stroke="#141d35"/>')
o.append('<polygon points="%s" fill="#3a4458" stroke="#e9f2f4" stroke-width="6" stroke-linejoin="round"/>'%' '.join('%.1f,%.1f'%TT(p) for p in O))
# the Lounge: north of the lounge wall, from the diagonal to the wall's end, about 3.7 tiles deep (provisional)
lx0=P1[0]+3.2; ly0=16.0
pa,pb=TT((lx0,ly0)),TT((LEND[0]-0.4,YL))
o.append(f'<rect x="{pa[0]:.0f}" y="{pa[1]:.0f}" width="{pb[0]-pa[0]:.0f}" height="{pb[1]-pa[1]:.0f}" fill="#ff8fc8" fill-opacity="0.5"/><text x="{(pa[0]+pb[0])/2:.0f}" y="{(pa[1]+pb[1])/2+5:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="14" text-anchor="middle">LOUNGE</text>')
for Wp in WALLS: o.append('<polyline points="%s" fill="none" stroke="#e9f2f4" stroke-width="6" stroke-linecap="round"/>'%' '.join('%.1f,%.1f'%TT(p) for p in Wp))
# the stairs down in 8: treads across the tighter hallway, from its outer wall to the blocked wedge
o0,o1=V[27],V[28]
for i in range(6):
    y=16.9+i*1.0; xl=o1[0]-(y-o1[1])*k+0.7; xr=P1[0]-(y-P1[1])*k-0.7
    p,q=TT((xl,y)),TT((xr,y)); o.append(f'<line x1="{p[0]:.0f}" y1="{p[1]:.0f}" x2="{q[0]:.0f}" y2="{q[1]:.0f}" stroke="#fff" stroke-width="3"/>')
LAB=[('1','CRYSTAL CHAMBER','',(5.1,5.6),'#2ec7b0'),('2','SERVER ROOM','',(18.1,5.6),'#6f8cff'),('3','blocked off','',(31.4,9.4),'#5a6274'),
     ('4','WAREHOUSE','',(41.2,5.0),'#c9893f'),('5','STAIRS UP','to the new floor',(41.5,20.6),'#ffb347'),('6','MAIN HALLWAY','',(25.4,24.4),'#9aa6b2'),
     ('7','OBSERVATION DECK','the entrance',(5.4,27.0),'#a477ff'),('8','HALLWAY','stairs down to|the Experiment Lab',(7.4,11.0),'#7fd4ff')]
for num,name,sub,pt,c in LAB:
    p=TT(pt)
    o.append(f'<circle cx="{p[0]:.0f}" cy="{p[1]:.0f}" r="20" fill="{c}" stroke="#0b1226" stroke-width="3"/><text x="{p[0]:.0f}" y="{p[1]+7:.0f}" fill="#0b1226" font-family="DejaVu Sans" font-weight="bold" font-size="20" text-anchor="middle">{num}</text>')
    o.append(f'<text x="{p[0]:.0f}" y="{p[1]+40:.0f}" fill="#fff" font-family="DejaVu Sans" font-weight="bold" font-size="14" text-anchor="middle">{name}</text>')
    for j,line in enumerate(sub.split('|') if sub else []): o.append(f'<text x="{p[0]:.0f}" y="{p[1]+56+j*14:.0f}" fill="#fff" font-family="DejaVu Sans" font-size="12" text-anchor="middle">{line}</text>')
o.append(f'<text x="{W/2:.0f}" y="{H-12:.0f}" fill="#8fa3c4" font-family="DejaVu Sans" font-size="14" text-anchor="middle">Your map, sharpened, with your marks · walls flat, 60°, upright or 120° · one square = one tile · about {int(area)} floor tiles</text>')
o.append('</svg>'); open('draft-5-chosen.svg','w').write('\n'.join(o)); print(int(W),int(H))
