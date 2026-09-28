'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, List, Plus, Minus, Maximize, Navigation2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, TrainFront, Building2, Mountain, Sun, TreePalm, Anchor, Cog, Waves } from 'lucide-react';
import { projects } from '@/lib/projects';
import { beginGesture, updateGesture, type Gesture } from '@/lib/map-gesture';
import type { PointerEvent as ReactPointerEvent } from 'react';
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
 const touches=useRef(new Map<number,Point>());
 const gesture=useRef<Gesture|null>(null);
 const tap=useRef<{start:Point;project:number|null;moved:boolean}|null>(null);
 const suppressClick=useRef(false);
 const [gesturing,setGesturing]=useState(false);
 const joystick=useRef<Point>({x:0,y:0});
 const joystickPointer=useRef<number|null>(null);
 const [stick,setStick]=useState<Point>({x:0,y:0});
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
 const cameraRef=useRef({size,scale,zoom,pan,base,minZoom});cameraRef.current={size,scale,zoom,pan,base,minZoom};
 useEffect(()=>{const el=viewport.current;if(!el)return;const observer=new ResizeObserver(([e])=>{setSize({width:e.contentRect.width,height:e.contentRect.height});});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{setPan(v=>clampCamera(v,size,scale))},[size,scale]);
 const focusProject=useCallback((index:number)=>{const pr=projects[index];const target={x:pr.x*15.36+35,y:pr.y*10.24+40};setSelected(index);setPlayer(target);setInteracted(true);setPan(clampCamera({x:(768-target.x)*scale,y:(512-target.y)*scale},size,scale));},[size,scale]);
 useEffect(()=>{let raf=0;let last=0;
  function frame(time:number){const dt=Math.min((time-last)/1000,.04);last=time;const k=keys.current;
   const dx=joystick.current.x||Number(k.has('ArrowRight')||k.has('d'))-Number(k.has('ArrowLeft')||k.has('a'));
   const dy=joystick.current.y||Number(k.has('ArrowDown')||k.has('s'))-Number(k.has('ArrowUp')||k.has('w'));
   if((dx||dy)&&touches.current.size===0){setExplorerHeading(angle=>movementHeading(angle,dx*100,dy*100));const speed=Math.min(1,Math.hypot(dx,dy));const pos=moveExplorer(playerRef.current,dx,dy,dt*speed,k.has('Shift'));playerRef.current=pos;setPlayer(pos);setMoving(true);setInteracted(true);const {size,scale}=cameraRef.current;setPan(clampCamera({x:(768-pos.x)*scale,y:(512-pos.y)*scale},size,scale));const found=nearestProject(pos,projects);if(found!==null)setSelected(found)}else setMoving(false);
   raf=requestAnimationFrame(frame);
  }raf=requestAnimationFrame(frame);
  const stop=()=>{keys.current.clear();joystick.current={x:0,y:0};joystickPointer.current=null;setStick({x:0,y:0});touches.current.clear();gesture.current=null;tap.current=null;setGesturing(false)};window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop)}
 },[]);
 const overview=()=>{setZoom(minZoom);setPan({x:0,y:0});setInteracted(true)};
 function adjustZoom(amount:number){setZoom(z=>Math.max(minZoom,Math.min(2.6,z+amount)));setInteracted(true)}
 const stopKey=(key:string)=>{keys.current.delete(key)};
 function moveStick(e:ReactPointerEvent<HTMLButtonElement>){
  if(joystickPointer.current!==e.pointerId)return;
  e.preventDefault();const rect=e.currentTarget.getBoundingClientRect();
  const x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;
  const distance=Math.hypot(x,y),radius=32,ratio=Math.min(1,radius/(distance||1));
  const next={x:x*ratio,y:y*ratio};setStick(next);
  joystick.current=distance<5?{x:0,y:0}:{x:next.x/radius,y:next.y/radius};
 }
 function releaseStick(e:ReactPointerEvent<HTMLButtonElement>){
  if(joystickPointer.current!==e.pointerId)return;
  joystickPointer.current=null;joystick.current={x:0,y:0};setStick({x:0,y:0});
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 function mapPoint(e:ReactPointerEvent<HTMLElement>):Point {
  const rect=e.currentTarget.getBoundingClientRect();
  return {x:e.clientX-rect.left-rect.width/2,y:e.clientY-rect.top-rect.height/2};
 }
 function startMapGesture(e:ReactPointerEvent<HTMLElement>){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  const target=e.target as HTMLElement;
  const pin=target.closest<HTMLElement>('.map-pin');
  if(target.closest('a,aside,.map-tools,.map-controls,.touch-joystick')||(target.closest('button')&&(!pin||e.pointerType==='mouse')))return;
  e.preventDefault();keys.current.clear();setPointer(null);
  if(e.pointerType==='mouse')e.currentTarget.focus({preventScroll:true});
  const point=mapPoint(e);touches.current.set(e.pointerId,point);
  if(touches.current.size===1){suppressClick.current=false;tap.current={start:point,project:pin?Number(pin.dataset.project):null,moved:false};}
  else if(tap.current)tap.current.moved=true;
  const camera=cameraRef.current;gesture.current=beginGesture([...touches.current.values()],camera.zoom,camera.pan);
  e.currentTarget.setPointerCapture(e.pointerId);setGesturing(true);
 }
 function moveMapGesture(e:ReactPointerEvent<HTMLElement>){
  if(touches.current.has(e.pointerId)&&gesture.current){
   e.preventDefault();const point=mapPoint(e);touches.current.set(e.pointerId,point);
   if(tap.current&&Math.hypot(point.x-tap.current.start.x,point.y-tap.current.start.y)>5)tap.current.moved=true;
   const camera=cameraRef.current;
   const next=updateGesture(gesture.current,[...touches.current.values()],camera.minZoom,2.6);
   const nextScale=camera.base*next.zoom;next.pan=clampCamera(next.pan,camera.size,nextScale);
   cameraRef.current={...camera,...next,scale:nextScale};setZoom(next.zoom);setPan(next.pan);
   if(tap.current?.moved)setInteracted(true);
   return;
  }
  if(e.pointerType==='touch')return;
  const current={x:e.clientX,y:e.clientY};const prev=previousCursor.current;
  if(prev&&Math.hypot(current.x-prev.x,current.y-prev.y)>=2){setCursorHeading(angle=>movementHeading(angle,current.x-prev.x,current.y-prev.y));previousCursor.current=current}else if(!prev)previousCursor.current=current;
  const rect=stage.current?.getBoundingClientRect();if(rect)setPointer((e.target as HTMLElement).closest('button,a,aside,label')?null:screenToWorld(current,rect));
 }
 function endMapGesture(e:ReactPointerEvent<HTMLElement>){
  if(!touches.current.delete(e.pointerId))return;
  const cancelled=e.type!=='pointerup';
  if(cancelled&&tap.current)tap.current.moved=true;
  if(touches.current.size){const camera=cameraRef.current;gesture.current=beginGesture([...touches.current.values()],camera.zoom,camera.pan);}
  else {const last=tap.current;suppressClick.current=!!last?.moved||last?.project!==null;gesture.current=null;tap.current=null;setGesturing(false);if(!cancelled&&last&&!last.moved&&last.project!==null)focusProject(last.project);}
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 return <main className="world-app">
  <header className="world-header"><a className="wordmark" href="/">EDEN<span>LANDSCAPE WORLDS</span></a><nav className="header-actions" aria-label="Portfolio navigation"><a className="pill" href="#project-index"><List size={16}/> Project index <span>07</span></a><a href="/cv" className="profile-link" aria-label="View my CV" title="View my CV"><img src="/images/profile.jpg" alt="" width={36} height={36} className="profile-avatar"/></a></nav></header>
  <section ref={viewport} className={`map-viewport explorer-map ${pointer?"has-map-pointer":""} ${gesturing||moving?"is-manipulating":""}`} aria-label="Explore seven portfolio landscapes" aria-describedby="map-instructions" tabIndex={0}
   onPointerDownCapture={()=>{suppressClick.current=false}} onPointerDown={startMapGesture} onPointerMove={moveMapGesture}
   onPointerLeave={()=>{setPointer(null);previousCursor.current=null}}
   onPointerUp={endMapGesture} onPointerCancel={endMapGesture} onLostPointerCapture={endMapGesture}
   onContextMenu={e=>e.preventDefault()}
   onClickCapture={e=>{if(suppressClick.current&&e.detail>0){e.preventDefault();e.stopPropagation();suppressClick.current=false}}}
   onKeyDown={e=>{if(e.target!==e.currentTarget)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','Shift'].includes(key)){e.preventDefault();keys.current.add(key)}if(key==='Enter'&&nearRef.current!==null){e.preventDefault();window.location.href='/projects/'+projects[nearRef.current].slug}if(key==='Escape')overview();}}
   onKeyUp={e=>stopKey(e.key.length===1?e.key.toLowerCase():e.key)} onBlur={()=>keys.current.clear()}>
   <div ref={stage} className="map-stage" style={{width:WORLD.width,height:WORLD.height,transform:`translate(calc(-50% + ${pan.x}px),calc(-50% + ${pan.y}px)) scale(${scale})`}}>
    <img className="world-image" src="/images/world.webp" alt="An imaginary archipelago linking seven landscape architecture projects" width={1536} height={1024} draggable={false}/>
    <WaterMotion enabled={true} pointer={pointer} explorer={player} heading={explorerHeading}/>
    {pointer&&<div className="world-pointer" style={{left:pointer.x,top:pointer.y,transform:`translate(-50%,-50%) scale(${1/scale})`}} aria-hidden="true"><Navigation2 className="direction-arrow" style={{transform:`rotate(${cursorHeading}deg)`}} size={24} fill="currentColor" strokeWidth={1.5}/></div>}
    {projects.map((pr,i)=><button key={pr.id} data-project={i} className={`map-pin ${i===selected?'selected':''} ${i===zone?'zone-active':''}`} style={{left:pr.x+'%',top:pr.y+'%',transform:`translate(-50%,-50%) scale(${1/scale})`}} onClick={()=>focusProject(i)} aria-label={`Travel to ${pr.title}`} aria-pressed={selected===i}><span className="pin-number">{pr.id}</span><span className="pin-label">{pr.title}</span></button>)}

   </div>
   {!interacted&&<div className="map-intro"><span className="eyebrow">A PORTFOLIO TO EXPLORE</span><h1><i>Landscape<br/>worlds.</i></h1><p>Choose an island. Follow your curiosity.</p></div>}
   {zoneInfo&&<aside className="zone-discovery" style={{borderColor:zoneInfo.color}}><ZoneIcon size={18} style={{color:zoneInfo.color}}/><div><strong>{zoneInfo.label}</strong><p>{zoneInfo.detail}</p></div></aside>}


   <div className="map-top-note"><span className="status-dot"/> 7 places to discover</div>
   <div className="map-tools"><button onClick={()=>setHelp(!help)} aria-expanded={help} aria-controls="map-instructions">How to explore <span>?</span></button><div id="map-instructions" className={help?'instructions open':'instructions'}><p>Drag to pan. Select a landmark to travel.</p><p>Focus the map, then use arrow keys or WASD to explore. Press Enter near a landmark to open its project. Escape shows the whole world.</p><p>Touch: drag with one finger to pan. Pinch with two fingers to zoom. Drag the joystick to steer the plane; release to stop. Tap a landmark to select it.</p></div></div>
   <div className="map-controls"><button aria-label="Zoom in" disabled={zoom>=2.6} onClick={()=>adjustZoom(.2)}><Plus size={18}/></button><button aria-label="Zoom out" disabled={zoom<=minZoom+.001} onClick={()=>adjustZoom(-.2)}><Minus size={18}/></button><button aria-label="Show whole world" onClick={overview}><Maximize size={17}/></button></div>
   <div className="touch-joystick"><button className="joystick-base" aria-label="Steer plane: drag to choose direction and speed, release to stop" onPointerDown={e=>{if(joystickPointer.current!==null)return;e.preventDefault();joystickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveStick(e)}} onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick} onContextMenu={e=>e.preventDefault()}><span className="joystick-crosshair" aria-hidden="true"/><span className="joystick-marker north" aria-hidden="true">▴</span><span className="joystick-marker east" aria-hidden="true">▸</span><span className="joystick-marker south" aria-hidden="true">▾</span><span className="joystick-marker west" aria-hidden="true">◂</span><span className="joystick-knob" style={{transform:`translate(${stick.x}px,${stick.y}px)`}} aria-hidden="true"/></button></div>
   <aside className="destination-bar" aria-label="Selected project"><img src={`/images/${p.key}-small.webp`} alt=""/><div className="destination-text"><span className="eyebrow">{p.id} / {p.category}</span><h2>{p.title}</h2><p className="destination-subtitle">{p.subtitle}</p><p className="destination-location">{p.location}</p></div><div className="destination-actions"><div className="destination-cycle"><button aria-label="Previous destination" onClick={()=>focusProject((selected+6)%7)}><ChevronLeft size={18}/></button><span>{p.id} / 07</span><button aria-label="Next destination" onClick={()=>focusProject((selected+1)%7)}><ChevronRight size={18}/></button></div><a href={`/projects/${p.slug}`} className="destination-enter">Enter project <ArrowUpRight size={18}/></a></div></aside>
   <footer className="map-footer"><span className="desktop-map-hint">{near!==null?'Press Enter on the map to enter '+projects[near].title:'Drag to explore · Arrow keys / WASD to move'}</span><span className="touch-map-hint">One finger to pan · Pinch to zoom</span><span>Conceptual world · Not a geographic map</span></footer>
  </section>
  <section id="project-index" className="project-index"><div className="section-heading"><span className="eyebrow">SELECTED WORKS / 2021—2025</span><h2>Seven landscapes.<br/>One curious mind.</h2></div><div className="project-grid">{projects.map(pr=><a key={pr.id} href={`/projects/${pr.slug}`}><img src={`/images/${pr.key}-small.webp`} alt={pr.title} loading="lazy"/><span className="eyebrow">{pr.id} / {pr.category}</span><h3>{pr.title} <ArrowUpRight size={20}/></h3><p>{pr.location} · {pr.year}</p></a>)}</div><div className="portfolio-note"><p>Yizhan Zhang (Eden)<br/>Landscape architect & urban designer</p><p>Selected professional work at BIG — Bjarke Ingels Group, alongside graduate work at UCL’s Bartlett School of Architecture.</p><a href="#" onClick={e=>{e.preventDefault();viewport.current?.scrollIntoView({behavior:'smooth'})}}>Back to the world <span className="back-top-arrow" aria-hidden="true">↑</span></a></div></section>
 </main>
}

