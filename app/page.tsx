'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, UserRound, Compass, List, Plus, Minus, Maximize, Navigation2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, TrainFront, Building2, Mountain, Sun, TreePalm, Anchor, Cog, Waves } from 'lucide-react';
import { projects } from '@/lib/projects';
import { clampCamera, nearestProject, moveExplorer, screenToWorld, projectZone, zoneDetails, movementHeading } from '@/lib/world';

import WaterMotion from '@/components/water-motion';

const zoneIcons=[TrainFront,Building2,Mountain,Sun,TreePalm,Anchor,Cog];
type Point={x:number;y:number};
const WORLD={width:1536,height:1024};
const START={x:770,y:530};
export default function World() {
 const stage=useRef<HTMLDivElement>(null);
 const [pointer,setPointer]=useState<Point|null>(null);
 const [cursorHeading,setCursorHeading]=useState(0);
 const [explorerHeading,setExplorerHeading]=useState(0);
 const previousCursor=useRef<Point|null>(null);
 const viewport=useRef<HTMLElement>(null);
 const [size,setSize]=useState({width:1440,height:800});
 const [zoom,setZoom]=useState(1);
 const [pan,setPan]=useState<Point>({x:0,y:0});
 const [player,setPlayer]=useState<Point>(START);
 const [selected,setSelected]=useState(0);
 const [moving,setMoving]=useState(false);
 const [interacted,setInteracted]=useState(false);
 const [help,setHelp]=useState(false);
 const keys=useRef(new Set<string>());
 const drag=useRef<{x:number;y:number;pan:Point}|null>(null);
 const base=Math.max(size.width/WORLD.width,size.height/WORLD.height);
 const scale=base*zoom;
 const minZoom=Math.min(size.width/WORLD.width,size.height/WORLD.height)/base;
 const p=projects[selected];
 const zone=projectZone(pointer||player,projects);
 const zoneInfo=zone===null?null:zoneDetails[zone];
 const ZoneIcon=zone===null?Waves:zoneIcons[zone];
 const near=nearestProject(player,projects);
 const playerRef=useRef(player); playerRef.current=player;
 const nearRef=useRef(near); nearRef.current=near;
 const cameraRef=useRef({size,scale});cameraRef.current={size,scale};
 useEffect(()=>{const el=viewport.current;if(!el)return;const observer=new ResizeObserver(([e])=>{setSize({width:e.contentRect.width,height:e.contentRect.height});});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{setPan(v=>clampCamera(v,size,scale))},[size,scale]);
 const focusProject=useCallback((index:number)=>{const pr=projects[index];const target={x:pr.x*15.36+35,y:pr.y*10.24+40};setSelected(index);setPlayer(target);setInteracted(true);setPan(clampCamera({x:(768-target.x)*scale,y:(512-target.y)*scale},size,scale));},[size,scale]);
 useEffect(()=>{let raf=0;let last=0;
  function frame(time:number){const dt=Math.min((time-last)/1000,.04);last=time;const k=keys.current;
   const dx=Number(k.has('ArrowRight')||k.has('d'))-Number(k.has('ArrowLeft')||k.has('a'));
   const dy=Number(k.has('ArrowDown')||k.has('s'))-Number(k.has('ArrowUp')||k.has('w'));
   if(dx||dy){setExplorerHeading(angle=>movementHeading(angle,dx*10,dy*10));const pos=moveExplorer(playerRef.current,dx,dy,dt,k.has('Shift'));playerRef.current=pos;setPlayer(pos);setMoving(true);setInteracted(true);const {size,scale}=cameraRef.current;setPan(clampCamera({x:(768-pos.x)*scale,y:(512-pos.y)*scale},size,scale));const found=nearestProject(pos,projects);if(found!==null)setSelected(found)}else setMoving(false);
   raf=requestAnimationFrame(frame);
  }raf=requestAnimationFrame(frame);
  const stop=()=>{keys.current.clear();drag.current=null};window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop)}
 },[]);
 const overview=()=>{setZoom(minZoom);setPan({x:0,y:0});setInteracted(true)};
 function adjustZoom(amount:number){setZoom(z=>Math.max(minZoom,Math.min(2.6,z+amount)));setInteracted(true)}
 const stopKey=(key:string)=>{keys.current.delete(key)};
 return <main className="world-app">
  <header className="world-header"><div className="brand-navigation"><a className="wordmark" href="/">EDEN<span>LANDSCAPE WORLDS</span></a><a href="/cv" className="profile-link" aria-label="View my CV" title="View my CV"><UserRound size={21}/></a></div><a className="pill" href="#project-index"><List size={16}/> Project index <span>07</span></a></header>
  <section ref={viewport} className={`map-viewport explorer-map ${pointer?"has-map-pointer":""}`} aria-label="Explore seven portfolio landscapes" aria-describedby="map-instructions" tabIndex={0}
   onPointerDown={e=>{if((e.target as HTMLElement).closest('button,a,aside,label'))return;viewport.current?.focus({preventScroll:true});drag.current={x:e.clientX,y:e.clientY,pan};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerLeave={()=>{setPointer(null);previousCursor.current=null}}
   onPointerMove={e=>{const current={x:e.clientX,y:e.clientY};const prev=previousCursor.current;if(prev&&Math.hypot(current.x-prev.x,current.y-prev.y)>=2){setCursorHeading(angle=>movementHeading(angle,current.x-prev.x,current.y-prev.y));previousCursor.current=current}else if(!prev)previousCursor.current=current;const rect=stage.current?.getBoundingClientRect();if(rect&&e.pointerType!=="touch")setPointer((e.target as HTMLElement).closest("button,a,aside,label")?null:screenToWorld({x:e.clientX,y:e.clientY},rect));const d=drag.current;if(d){setInteracted(true);setPan(clampCamera({x:d.pan.x+e.clientX-d.x,y:d.pan.y+e.clientY-d.y},size,scale))}}}
   onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}
   onKeyDown={e=>{if(e.target!==e.currentTarget)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','Shift'].includes(key)){e.preventDefault();keys.current.add(key)}if(key==='Enter'&&nearRef.current!==null){e.preventDefault();window.location.href='/projects/'+projects[nearRef.current].slug}if(key==='Escape')overview();}}
   onKeyUp={e=>stopKey(e.key.length===1?e.key.toLowerCase():e.key)} onBlur={()=>keys.current.clear()}>
   <div ref={stage} className="map-stage" style={{width:WORLD.width,height:WORLD.height,transform:`translate(calc(-50% + ${pan.x}px),calc(-50% + ${pan.y}px)) scale(${scale})`}}>
    <img className="world-image" src="/images/world.webp" alt="An imaginary archipelago linking seven landscape architecture projects" width={1536} height={1024} draggable={false}/>
    <WaterMotion enabled={true} pointer={pointer} explorer={player} heading={explorerHeading}/>
    {pointer&&<div className="world-pointer" style={{left:pointer.x,top:pointer.y,transform:`translate(-50%,-50%) scale(${1/scale})`}} aria-hidden="true"><Navigation2 className="direction-arrow" style={{transform:`rotate(${cursorHeading}deg)`}} size={24} fill="currentColor" strokeWidth={1.5}/></div>}
    {projects.map((pr,i)=><button key={pr.id} className={`map-pin ${i===selected?'selected':''} ${i===zone?'zone-active':''}`} style={{left:pr.x+'%',top:pr.y+'%',transform:`translate(-50%,-50%) scale(${1/scale})`}} onClick={()=>focusProject(i)} aria-label={`Travel to ${pr.title}`} aria-pressed={selected===i}><span className="pin-number">{pr.id}</span><span className="pin-label">{pr.title}</span></button>)}

   </div>
   {!interacted&&<div className="map-intro"><span className="eyebrow">A PORTFOLIO TO EXPLORE</span><h1><i>Landscape<br/>worlds.</i></h1><p>Choose an island. Follow your curiosity.</p></div>}
   {zoneInfo&&<aside className="zone-discovery" style={{borderColor:zoneInfo.color}}><ZoneIcon size={18} style={{color:zoneInfo.color}}/><div><strong>{zoneInfo.label}</strong><p>{zoneInfo.detail}</p></div></aside>}

   <div className="map-compass"><Compass size={30} strokeWidth={1}/><span>N</span></div>
   <div className="map-top-note"><span className="status-dot"/> 7 places to discover</div>
   <div className="map-tools"><button onClick={()=>setHelp(!help)} aria-expanded={help} aria-controls="map-instructions">How to explore <span>?</span></button><div id="map-instructions" className={help?'instructions open':'instructions'}><p>Drag to pan. Select a landmark to travel.</p><p>Focus the map, then use arrow keys or WASD to explore. Press Enter near a landmark to open its project. Escape shows the whole world.</p><p>On touch screens, use the direction buttons or choose a project below.</p></div></div>
   <div className="map-controls"><button aria-label="Zoom in" disabled={zoom>=2.6} onClick={()=>adjustZoom(.2)}><Plus size={18}/></button><button aria-label="Zoom out" disabled={zoom<=minZoom+.001} onClick={()=>adjustZoom(-.2)}><Minus size={18}/></button><button aria-label="Show whole world" onClick={overview}><Maximize size={17}/></button></div>
   <div className="touch-pad" aria-label="Move around the world">{[['ArrowUp',ArrowUp],['ArrowLeft',ArrowLeft],['ArrowDown',ArrowDown],['ArrowRight',ArrowRight]].map(([key,Icon])=>{const K=key as string;const I=Icon as typeof ArrowUp;return <button key={K} aria-label={`Move ${K.replace('Arrow','').toLowerCase()}`} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(K)}} onPointerUp={()=>stopKey(K)} onPointerCancel={()=>stopKey(K)}><I size={20}/></button>})}</div>
   <aside className="destination-bar" aria-label="Selected project"><img src={`/images/${p.key}-small.webp`} alt=""/><div className="destination-text"><span className="eyebrow">{p.id} / {p.category}</span><h2>{p.title}</h2><p className="destination-subtitle">{p.subtitle}</p><p className="destination-location">{p.location}</p></div><div className="destination-actions"><div className="destination-cycle"><button aria-label="Previous destination" onClick={()=>focusProject((selected+6)%7)}><ChevronLeft size={18}/></button><span>{p.id} / 07</span><button aria-label="Next destination" onClick={()=>focusProject((selected+1)%7)}><ChevronRight size={18}/></button></div><a href={`/projects/${p.slug}`} className="destination-enter">Enter project <ArrowUpRight size={18}/></a></div></aside>
   <footer className="map-footer"><span>{near!==null?'Press Enter on the map to enter '+projects[near].title:'Drag to explore · Arrow keys / WASD to move'}</span><span>Conceptual world · Not a geographic map</span></footer>
  </section>
  <section id="project-index" className="project-index"><div className="section-heading"><span className="eyebrow">SELECTED WORKS / 2021—2025</span><h2>Seven landscapes.<br/>One curious mind.</h2></div><div className="project-grid">{projects.map(pr=><a key={pr.id} href={`/projects/${pr.slug}`}><img src={`/images/${pr.key}-small.webp`} alt={pr.title} loading="lazy"/><span className="eyebrow">{pr.id} / {pr.category}</span><h3>{pr.title} <ArrowUpRight size={20}/></h3><p>{pr.location} · {pr.year}</p></a>)}</div><div className="portfolio-note"><p>Yizhan Zhang (Eden)<br/>Landscape architect & urban designer</p><p>Selected professional work at BIG — Bjarke Ingels Group, alongside graduate work at UCL’s Bartlett School of Architecture.</p><a href="#" onClick={e=>{e.preventDefault();viewport.current?.scrollIntoView({behavior:'smooth'})}}>Back to the world <span className="back-top-arrow" aria-hidden="true">↑</span></a></div></section>
 </main>
}

