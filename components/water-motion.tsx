'use client';
import { useEffect, useRef, useState } from 'react';
import type { Point } from '@/lib/world';
import { drawBoat3D, drawPlane3D } from '@/lib/boat-model';
import { waterPixel } from '@/lib/world';
type Boat={x:number;y:number;angle:number;speed:number;size:number};
type Ripple={x:number;y:number;born:number};
export default function WaterMotion({enabled,pointer,explorer,heading}:{enabled:boolean;pointer:Point|null;explorer:Point;heading:number}){
 const headingRef=useRef(heading);headingRef.current=heading;
 const jet=useRef({angle:-Math.PI/2,last:null as Point|null,particles:[] as {x:number;y:number;vx:number;vy:number;born:number;water:boolean}[]});
 const canvas=useRef<HTMLCanvasElement>(null);
 const pointerRef=useRef(pointer);pointerRef.current=pointer;
 const explorerRef=useRef(explorer);explorerRef.current=explorer;
 const assets=useRef<{mask:Uint8ClampedArray}|null>(null);
 const simulation=useRef({time:0,boats:[] as Boat[],ripples:[] as Ripple[],lastPointer:null as Point|null,lastExplorer:null as Point|null});
 const [ready,setReady]=useState(false);
 useEffect(()=>{let active=true;const map=new Image();map.src='/images/world.webp';
  map.decode().then(()=>{if(!active)return;const sample=document.createElement('canvas');sample.width=384;sample.height=256;const c=sample.getContext('2d',{willReadFrequently:true});if(!c)return;c.drawImage(map,0,0,384,256);assets.current={mask:c.getImageData(0,0,384,256).data};setReady(true)}).catch(()=>{ /* Core map and project navigation remain available if decoration cannot load. */ });return()=>{active=false};
 },[]);
 useEffect(()=>{const c=canvas.current?.getContext('2d'),a=assets.current;if(!ready||!c||!a)return;
  const s=simulation.current;let raf=0,last=0;
  function water(x:number,y:number){if(x<6||y<6||x>1530||y>1018)return false;const i=(Math.floor(y/4)*384+Math.floor(x/4))*4;return waterPixel(a!.mask[i],a!.mask[i+1],a!.mask[i+2]);}
  function clearWater(x:number,y:number){return [[0,0],[-14,0],[14,0],[0,14],[0,-14]].every(([dx,dy])=>water(x+dx,y+dy));}
  if(!s.boats.length){[[760,520],[550,880],[980,920]].forEach(([x,y],i)=>{let pos={x,y};for(let k=0;k<500&&!clearWater(pos.x,pos.y);k++)pos={x:70+((k*173+i*319)%1390),y:60+((k*109+i*211)%900)};if(clearWater(pos.x,pos.y))s.boats.push({...pos,angle:i*2.3,speed:9+i*2,size:43+i*4})});}
  const waves=Array.from({length:180},(_,i)=>({x:20+((i*173)%1496),y:20+((i*113)%984),phase:i*1.7})).filter(p=>water(p.x,p.y));
  function frame(now:number){if(document.hidden&&enabled){last=now;raf=requestAnimationFrame(frame);return;}const dt=last?Math.min((now-last)/1000,.06):0;last=now;if(enabled)s.time+=dt;
   c!.clearRect(0,0,1536,1024);c!.lineCap='round';
   for(const p of waves){const x=p.x+Math.sin(s.time*.35+p.phase)*7,y=p.y+Math.sin(s.time*.5+p.phase)*4;if(!water(x-12,y)||!water(x+12,y))continue;const alpha=.035+(.5+.5*Math.sin(s.time*.8+p.phase))*.10;c!.strokeStyle=`rgba(210,253,255,${alpha})`;c!.lineWidth=.8;c!.beginPath();c!.moveTo(x-11,y);c!.quadraticCurveTo(x,y-3,x+11,y);c!.stroke();}
   for(const b of s.boats){if(enabled){let next=b.angle+Math.sin(s.time*.12+b.size)*dt*.12;let found=false;for(let j=0;j<24;j++){const angle=next+j*Math.PI/12;const ax=b.x+Math.cos(angle)*26,ay=b.y+Math.sin(angle)*26;if(clearWater(ax,ay)){next=angle;found=true;break;}}if(found){b.angle=next;b.x+=Math.cos(next)*b.speed*dt;b.y+=Math.sin(next)*b.speed*dt;}}
    c!.save();c!.translate(b.x,b.y);c!.rotate(b.angle);c!.strokeStyle='rgba(220,255,255,.38)';c!.lineWidth=1;c!.beginPath();c!.moveTo(-7,-2);c!.quadraticCurveTo(-18,-4,-34,-10);c!.moveTo(-7,2);c!.quadraticCurveTo(-18,4,-34,10);c!.stroke();
    c!.restore();drawBoat3D(c!,b.x,b.y,b.angle,b.size,s.time);}
   for(const [point,key] of [[pointerRef.current,'lastPointer'],[explorerRef.current,'lastExplorer']] as const){const prev=s[key];if(enabled&&point&&water(point.x,point.y)&&(!prev||Math.hypot(point.x-prev.x,point.y-prev.y)>16)){s.ripples.push({...point,born:s.time});s[key]={...point};}if(!point)s[key]=null;}
   s.ripples=s.ripples.filter(p=>s.time-p.born<1.6).slice(-28);
   for(const p of s.ripples){const age=s.time-p.born,r=3+age*16;if(!water(p.x+r,p.y)||!water(p.x-r,p.y))continue;c!.strokeStyle=`rgba(205,250,255,${.4*(1-age/1.6)})`;c!.lineWidth=1;c!.beginPath();c!.ellipse(p.x,p.y,r,r*.48,0,0,Math.PI*2);c!.stroke();}
   const j=jet.current,pos=explorerRef.current,target=(headingRef.current-90)*Math.PI/180;
   const delta=Math.atan2(Math.sin(target-j.angle),Math.cos(target-j.angle));j.angle+=delta*Math.min(1,dt*12);
   const distance=j.last?Math.hypot(pos.x-j.last.x,pos.y-j.last.y):0;
   if(distance>0.2&&distance<40){for(let k=0;k<3;k++){const spread=Math.sin(s.time*87+k*2.1)*.8,angle=j.angle+Math.PI+spread;j.particles.push({x:pos.x-Math.cos(j.angle)*17,y:pos.y-Math.sin(j.angle)*17,vx:Math.cos(angle)*(20+k*7),vy:Math.sin(angle)*(20+k*7),born:s.time,water:water(pos.x,pos.y)});}}
   j.last={...pos};j.particles=j.particles.filter(p=>s.time-p.born<.8).slice(-100);
   for(const p of j.particles){const age=s.time-p.born;c!.fillStyle=`rgba(${p.water?'214,252,255':'229,238,218'},${(1-age/.8)*(p.water?.65:.22)})`;c!.beginPath();c!.ellipse(p.x+p.vx*age,p.y+p.vy*age-Math.sin(age*4)*3,1+age*4,.7+age*2,0,0,Math.PI*2);c!.fill();}
   drawPlane3D(c!,pos.x,pos.y,j.angle,s.time);
   if(enabled)raf=requestAnimationFrame(frame);
  }frame(performance.now());return()=>cancelAnimationFrame(raf);
 },[ready,enabled]);
 return <canvas ref={canvas} className="water-motion" width={1536} height={1024} aria-hidden="true"/>;
}
