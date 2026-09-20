// Headless screenshot of a representative Conduit frame — floor and actors —
// so visual changes can be checked without a browser.
//
// Needs a canvas implementation, which the game itself does not:
//     npm install @napi-rs/canvas
//     node tests/render/screenshot.js
// Deliberately NOT wired into tests/run.js, so the main suite stays
// dependency-free.

// Full-pipeline look: floor, actors, contact shadows, dynamic light, bloom.
const fs=require('fs'), vm=require('vm'), path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const ROOT=path.resolve(__dirname,'..','..'), W=980,H=520;
const real=createCanvas(W,H);
const stubEl=()=>({style:{},classList:{add(){},remove(){},contains:()=>false,toggle(){}},textContent:'',innerHTML:'',appendChild(){},removeChild(){},remove(){},addEventListener(){},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:W,height:H}),querySelector:()=>stubEl(),querySelectorAll:()=>[]});
const sb={console,Math,JSON,Date,Object,Array,String,Number,Boolean,Map,Set,WeakMap,Symbol,Promise,RegExp,Error,TypeError,Proxy,Reflect,Float32Array,Uint8ClampedArray,Int32Array,isNaN,isFinite,parseInt,parseFloat,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,performance:{now:()=>0},navigator:{hardwareConcurrency:8,userAgent:'node'},localStorage:{_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=v}},getComputedStyle:()=>({height:'0px'}),document:{getElementById:id=>id==='cavernCanvas'?real:stubEl(),createElement:t=>t==='canvas'?createCanvas(8,8):stubEl(),addEventListener(){},body:stubEl(),documentElement:stubEl(),querySelector:()=>stubEl(),querySelectorAll:()=>[]}};
sb.window=sb; sb.globalThis=sb; sb.addEventListener=()=>{}; sb.window.visualViewport=null;
sb.innerWidth=W; sb.innerHeight=H;
sb.AudioContext=function(){return{createGain:()=>({connect(){},gain:{}}),destination:{}}};
const c=vm.createContext(sb);
const ORDER=fs.readFileSync(path.join(ROOT,'game.html'),'utf8').split('\n').map(l=>(l.match(/<script src="(js\/[^"]+)"><\/script>/)||[])[1]).filter(Boolean);
for(const r of ORDER){ if(r==='js/init.js'||r==='js/dev.js') continue; try{vm.runInContext(fs.readFileSync(path.join(ROOT,r),'utf8'),c,{filename:r})}catch(e){} }
const run=s=>vm.runInContext(s,c);
run(`canvas.width=${W};canvas.height=${H};frame=40;`);
const TILE_W=run('TILE_W'), TILE_H=run('TILE_H');
const ctx=real.getContext('2d');

run('player.visualX=3.5; player.visualY=1.5; player.x=3.5; player.y=1.5; player.selectedElement="fire";');
const sx=(x,y)=>(x-3.5-(y-1.5))*TILE_W+W/2;
const sy=(x,y)=>(x-3.5+(y-1.5))*TILE_H+H/2;

// A lit pylon so the light-occlusion path is exercised.
run(`_pillarCache = [{x:5,y:3,pillarTeam:'green',pillarCol:'#0f8',attackMode:true,attackModeColor:'#ff5522',health:20,maxHealth:20,destroyed:false,upgraded:true}];`);
run('crystal.x=0; crystal.y=2; crystal.health=300; crystal.maxHealth=300;');
run('elementEffects.length=0; followerProjectiles.length=0; projectiles.length=0;');
run('world.length=0; _wallPanelCache.length=0; _nestCache.length=0; _capturableNodeCache.length=0; traps.length=0;');

ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
const tiles=[]; for(let x=0;x<=7;x++) for(let y=0;y<=3;y++) tiles.push({x,y});
tiles.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
for(const t of tiles){
  const px=sx(t.x,t.y), py=sy(t.x,t.y);
  const d=Math.hypot(t.x-3.5,t.y-1.5);
  const amb=Math.max(0.1,0.8-d/22), glo=Math.max(0,1.0-d/5);
  ctx.fillStyle=`rgb(${(16*amb+8*glo)|0},${(26*amb+20*glo)|0},${(42*amb+52*glo)|0})`;
  ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+TILE_W,py+TILE_H);
  ctx.lineTo(px,py+TILE_W); ctx.lineTo(px-TILE_W,py+TILE_H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=`rgba(80,130,180,${0.55*amb})`; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(px,py+1); ctx.lineTo(px-TILE_W+1,py+TILE_H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px,py+1); ctx.lineTo(px+TILE_W-1,py+TILE_H); ctx.stroke();
}
function mkPred(species,cls,x,y,dir){
  const sp=run('SPECIES')[species];
  const def=Object.assign({},sp[cls],{color:sp.color});
  const b=new (run('Predator'))(cls,def,x,y);
  b.speciesName=species; b.className=cls; b.state='hunt'; b.walkCycle=1.1;
  b.dirX=Math.cos(dir); b.dirY=Math.sin(dir);
  run('applySpeciesBody')(b,species); run('initAbility')(b);
  b.abilityCharge=62;
  return b;
}
const mkVirus=(x,y,el)=>({type:'virus',element:el,x,y,team:'green',isFollower:true,health:80,maxHealth:100,moveSpeed:0.02,power:10,stats:{attack:12,specialAttack:11,accuracy:10,defense:10,speed:10,will:20},walkCycle:1.2,state:'hunt',hitFlash:0,dead:false,ultimateCharge:40,currentResonance:10,currentWill:20});
const subs=[
  {o:mkVirus(2,1,'fire'),pred:false},
  {o:mkVirus(2.6,2.2,'ice'),pred:false},
  {o:mkPred('ant','scout',4,1,0.3),pred:true},
  {o:mkPred('beetle','tank',5.6,2.4,2.6),pred:true},
  {o:mkPred('ant','worker',3.2,3,1.0),pred:true},
];
run('actors.length=0'); subs.forEach(s=>run('actors').push(s.o));
subs.sort((a,b)=>(a.o.x+a.o.y)-(b.o.x+b.o.y));
for(const s of subs){
  const o=s.o, px=sx(o.x,o.y), py=sy(o.x,o.y);
  run('drawNPC')(o,px,py);
}
{ const px=sx(1,0), py=sy(1,0);
  run('drawPlayer')({x:px,y:py}); }
ctx.fillStyle='#fff'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
ctx.fillText('Conduit — floor and actors', 14, 24);
fs.writeFileSync(path.join(__dirname,'frame.png'), real.toBuffer('image/png'));
console.log('wrote frame.png');
