// A small orthographic 3D sailboat, rendered from solid faces rather than a sprite.
type V=[number,number,number];
type Face={vertices:V[];color:[number,number,number]};
const faces:Face[]=[];
function solid(bottom:number[][],top:number[][],z0:number,z1:number,color:[number,number,number]){
 const lower=bottom.map(([x,y])=>[x,y,z0] as V),upper=top.map(([x,y])=>[x,y,z1] as V);
 faces.push({vertices:upper,color});
 for(let i=0;i<lower.length;i++){const j=(i+1)%lower.length;faces.push({vertices:[lower[i],lower[j],upper[j],upper[i]],color});}
}
const hull=[[-.49,-.15],[.12,-.19],[.38,-.12],[.55,0],[.38,.12],[.12,.19],[-.49,.15]];
solid(hull.map(([x,y])=>[x*.88,y*.7]),hull,0,.085,[225,237,235]);
solid(hull,hull.map(([x,y])=>[x*.99,y*.98]),.085,.11,[37,68,79]);
solid(hull.map(([x,y])=>[x*.99,y*.98]),hull.map(([x,y])=>[x*.98,y*.95]),.11,.14,[247,248,232]);
const deck=hull.map(([x,y])=>[x*.87,y*.78]);
solid(deck,deck,.14,.145,[188,156,112]);
// Timber mast, low cockpit and softly filled canvas sails.
solid([[-.25,-.09],[-.06,-.09],[-.06,.09],[-.25,.09]],[[-.25,-.09],[-.06,-.09],[-.06,.09],[-.25,.09]],.145,.19,[116,81,51]);
solid([[.035,-.012],[.06,-.012],[.06,.012],[.035,.012]],[[.035,-.009],[.055,-.009],[.055,.009],[.035,.009]],.15,1.04,[151,112,70]);
function sail(edge:V[],center:V,color:[number,number,number]){
 for(let i=0;i<edge.length;i++)faces.push({vertices:[edge[i],edge[(i+1)%edge.length],center],color});
}
sail([[.035,0,1.01],[.035,0,.28],[-.42,.055,.28],[-.25,.045,.59]],[-.12,.115,.54],[243,234,204]);
sail([[.085,0,.94],[.49,0,.22],[.085,0,.27]],[.22,-.065,.43],[228,218,180]);
export function projectBoatVertex([x,y,z]:V,heading:number,size:number,bob=0):V{
 const a=Math.atan2(Math.sin(heading)/.65,Math.cos(heading));
 const rx=(x*Math.cos(a)-y*Math.sin(a))*size,ry=(x*Math.sin(a)+y*Math.cos(a))*size,rz=z*size+bob;
 return [rx,ry*.65-rz*.76,ry*.76-rz*.65];
}
export function drawBoat3D(c:CanvasRenderingContext2D,x:number,y:number,heading:number,size:number,time:number,model:Face[]=faces){
 const a=Math.atan2(Math.sin(heading)/.65,Math.cos(heading));
 const bob=Math.sin(time*1.5+size)*.35;
 const rendered=model.map(f=>{const vertices=f.vertices.map(v=>projectBoatVertex(v,heading,size,bob));return {...f,vertices,depth:vertices.reduce((n,v)=>n+v[2],0)/vertices.length,original:f.vertices}}).sort((f,g)=>g.depth-f.depth);
 c.save();c.translate(x,y);
 // Soft waterline shadow anchors the hull to the sea.
 c.save();c.rotate(heading);c.fillStyle='rgba(2,35,46,.23)';c.filter='blur(1.4px)';c.beginPath();c.ellipse(1,2,size*.49,size*.12,0,0,Math.PI*2);c.fill();c.restore();
 for(const f of rendered){const [p,q,r]=f.original;const u=q.map((v,i)=>v-p[i]),v=r.map((v,i)=>v-p[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const len=Math.hypot(...n)||1;const nx=(n[0]*Math.cos(a)-n[1]*Math.sin(a))/len,ny=(n[0]*Math.sin(a)+n[1]*Math.cos(a))/len,nz=n[2]/len;const light=.68+.32*Math.max(0,-nx*.4-ny*.45+nz*.8);c.fillStyle=`rgb(${f.color.map(k=>Math.round(k*light)).join(',')})`;c.beginPath();f.vertices.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fill();}
 c.restore();
}

// Reference-inspired high-wing floatplane with twin pontoons.
const sailFaceCount=faces.length;
for(const side of [-1,1]){
 const y=side*.27,outline=[[-.58,y-.075],[.38,y-.075],[.62,y],[.38,y+.075],[-.58,y+.075]];
 solid(outline.map(([x,yy])=>[x*.93,y+(yy-y)*.65]),outline,0,.12,[198,208,203]);
 solid(outline,outline,.12,.14,[242,240,221]);
 for(const x of [-.25,.25])solid([[x-.015,y-.013],[x+.015,y-.013],[x+.015,y+.013],[x-.015,y+.013]],[[x-.015,y-.013],[x+.015,y-.013],[x+.015,y+.013],[x-.015,y+.013]],.14,.46,[137,153,150]);
}
// Faceted fuselage rings give the nose and tail real volume.
const sections=[[-.69,.028,.52],[-.40,.065,.51],[-.10,.14,.53],[.25,.145,.53],[.50,.105,.51],[.59,.06,.51]];
const rings=sections.map(([x,r,z])=>Array.from({length:8},(_,i)=>[x,Math.cos(i*Math.PI/4)*r,z+Math.sin(i*Math.PI/4)*r] as V));
for(let j=0;j<rings.length-1;j++)for(let i=0;i<8;i++)faces.push({vertices:[rings[j][i],rings[j+1][i],rings[j+1][(i+1)%8],rings[j][(i+1)%8]],color:j===4?[220,175,47]:[238,238,219]});
faces.push({vertices:rings.at(-1)!,color:[43,62,63]});
// Glazed cabin, high main wing and yellow tips.
solid([[-.12,-.12],[.24,-.12],[.30,0],[.24,.12],[-.12,.12]],[[-.13,-.08],[.15,-.08],[.21,0],[.15,.08],[-.13,.08]],.56,.73,[47,87,94]);
const wing=[[-.22,-.99],[.06,-1.02],[.19,-.89],[.22,.89],[.06,1.02],[-.22,.99]];
solid(wing,wing,.72,.76,[246,243,223]);
for(const side of [-1,1]){const tip=[[-.21,side*.80],[.20,side*.80],[.18,side*.90],[.06,side*1.02],[-.22,side*.99]];solid(tip,tip,.763,.77,[231,183,48]);}
const tail=[[-.72,-.36],[-.47,-.30],[-.40,0],[-.47,.30],[-.72,.36]];
solid(tail,tail,.55,.58,[235,226,192]);
faces.push({vertices:[[-.69,-.008,.55],[-.48,-.008,.56],[-.66,-.008,.98],[-.76,-.008,.94]],color:[230,182,46]});
faces.push({vertices:[[-.69,.008,.55],[-.48,.008,.56],[-.66,.008,.98],[-.76,.008,.94]],color:[230,182,46]});
const planeFaces=faces.splice(sailFaceCount);
export function drawPlane3D(c:CanvasRenderingContext2D,x:number,y:number,heading:number,time:number){
 const angle=time*35,rotor:Face={vertices:[[-.025,-.25],[.025,-.25],[.025,.25],[-.025,.25]].map(([u,v])=>[.615,u*Math.cos(angle)-v*Math.sin(angle),.51+u*Math.sin(angle)+v*Math.cos(angle)] as V),color:[81,91,84]};
 drawBoat3D(c,x,y,heading,42,time,[...planeFaces,rotor]);
}
