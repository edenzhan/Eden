'use client';
import { useState } from 'react';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { Expand, ArrowLeft, ArrowRight } from 'lucide-react';
import sheets from '@/lib/sheets.json';
import captions from '@/lib/sheet-captions.json';
export default function ProjectGallery({start,end,title}:{start:number,end:number,title:string}){
 const [active,setActive]=useState<number|null>(null);
 const copy=captions as Record<string,string[]>;
 const pages=Array.from({length:end-start+1},(_,i)=>start+i);
 const data=sheets as Record<string,{text:string;width:number;height:number}>;
 return <section className="gallery-section"><div className="gallery-heading"><div><h2>Inside the project</h2><span className="eyebrow">DRAWINGS, PROCESS & PERSPECTIVES</span></div></div>
 <div className="sheets-grid">{pages.map((n,i)=><figure key={n} className="wide-sheet sheet-spread"><button className="sheet-button" onClick={()=>setActive(n)} aria-label={`Enlarge ${title} portfolio sheet ${i+1}`}><img src={`/sheets/${n}.webp`} alt={`${title}, portfolio page ${n}. ${copy[n]?.[1]||'Project illustration'}`} width={data[n]?.width} height={data[n]?.height} loading="lazy"/><span className="expand-badge"><Expand size={17}/></span></button><figcaption className="sheet-sidebar"><span className="sheet-number">{String(i+1).padStart(2,'0')} / {String(pages.length).padStart(2,'0')}</span><h3>{copy[n]?.[0] || 'Portfolio sheet'}</h3><p className="sheet-caption">{copy[n]?.[1]}</p></figcaption></figure>)}</div>
 <Dialog open={active!==null} onOpenChange={open=>{if(!open)setActive(null)}}><DialogContent className="sheet-dialog"><DialogTitle>{title} · Sheet {active!==null?active-start+1:''}</DialogTitle><DialogDescription>{active!==null?copy[active]?.[1]:'Original portfolio layout.'}</DialogDescription>{active!==null&&<><a className="enlarged-image" href={`/sheets/${active}.webp`} target="_blank" rel="noreferrer" aria-label="Open full image in a new tab"><img src={`/sheets/${active}.webp`} alt={`${title}: ${copy[active]?.[0]}. ${copy[active]?.[1]}`}/></a><div className="lightbox-controls"><button disabled={active===start} onClick={()=>setActive(active-1)}><ArrowLeft size={18}/> Previous</button><span>{active-start+1} / {end-start+1}</span><button disabled={active===end} onClick={()=>setActive(active+1)}>Next <ArrowRight size={18}/></button></div></>}</DialogContent></Dialog>
 </section>
}

