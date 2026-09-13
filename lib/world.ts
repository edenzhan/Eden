export type Point={x:number;y:number};
export function clampCamera(pan:Point,size:{width:number;height:number},scale:number):Point{
 const x=Math.max(0,(1536*scale-size.width)/2), y=Math.max(0,(1024*scale-size.height)/2);
 return {x:Math.max(-x,Math.min(x,pan.x)),y:Math.max(-y,Math.min(y,pan.y))};
}
export function moveExplorer(p:Point,dx:number,dy:number,dt:number,sprint=false):Point{
 const length=Math.hypot(dx,dy)||1; const speed=sprint?400:220;
 return {x:Math.max(24,Math.min(1512,p.x+dx/length*speed*dt)),y:Math.max(24,Math.min(1000,p.y+dy/length*speed*dt))};
}
export function nearestProject(p:Point,projects:{x:number;y:number}[]):number|null{
 let nearest:number|null=null;let distance=70;
 projects.forEach((pr,i)=>{const d=Math.hypot(p.x-pr.x*15.36,p.y-pr.y*10.24);if(d<distance){nearest=i;distance=d}});return nearest;
}
export function screenToWorld(point:Point,rect:{left:number;top:number;width:number;height:number}):Point|null{
 const x=(point.x-rect.left)/rect.width*1536,y=(point.y-rect.top)/rect.height*1024;
 return x>=0&&x<=1536&&y>=0&&y<=1024?{x,y}:null;
}
export function waterPixel(r:number,g:number,b:number):boolean{return b>65&&g>r*1.12&&b>r*1.3;}
export function projectZone(point:Point,projects:{x:number;y:number}[]):number|null{
 let nearest:number|null=null,closest=1;
 projects.forEach((p,i)=>{const rx=i===0?240:i===2?235:205,ry=i===0?185:i===2?180:165;const distance=((point.x-p.x*15.36)/rx)**2+((point.y-p.y*10.24)/ry)**2;if(distance<closest){closest=distance;nearest=i}});return nearest;
}
export const zoneDetails=[
 {label:'Railway park',color:'#d1ef9c',icon:'rail',detail:'Retained railway traces, orchard rows and a green civic landscape for York.'},
 {label:'Green Y district',color:'#a8dfed',icon:'city',detail:'A planted urban spine connects Dubai’s mixed-use districts and public spaces.'},
 {label:'The Ridge',color:'#f1cea0',icon:'ridge',detail:'Excavation spoil becomes an artificial mountain for sport and exploration.'},
 {label:'Desert terraces',color:'#ecd3ab',icon:'sun',detail:'Carved spaces, planted terraces and water reinterpret a lost desert city.'},
 {label:'Coastal gardens',color:'#a5e4d1',icon:'palms',detail:'Guest arrivals, pools and private gardens unfold along the Red Sea coast.'},
 {label:'Marina to beach',color:'#b4e9ed',icon:'anchor',detail:'A terraced landscape guides guests from the marina towards the shoreline.'},
 {label:'Kinetic landscape',color:'#e7b9a0',icon:'cog',detail:'Water, machinery and human interaction bring industrial heritage into public life.'}
];

export function movementHeading(previous:number,dx:number,dy:number):number{
 if(Math.hypot(dx,dy)<2)return previous;
 const target=Math.atan2(dy,dx)*180/Math.PI+90;
 return previous+((target-previous+540)%360+360)%360-180;
}
