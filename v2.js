/* RailForge Studio v2 — offline-friendly progressive enhancements.
   Everything in real millimetres. Fixed Märklin pieces are never stretched. */
(function(){
'use strict';
const V2={gapStart:null,gapEnd:null,solution:null,gapMode:false,hover:null,ghostOn:true,showGrid:true,ghostAngle:0,markerMap:new Map(),dragHeight:null};
const MM=(n)=>`${Number(n).toFixed(Math.abs(n)>100?0:1)} mm`;
const DEG=(rad)=>((rad/RAD+360)%360).toFixed(1)+'°';
const epsilon=1e-5;
const portKey=p=>p.t.id+':'+p.idx;
const gapCandidates=['5106','5107','5108','5109','5110','5129','5208','5210','5100L','5100R','5101L','5101R','5102L','5102R','5200L','5200R','5201L','5201R','5205L','5205R','5120L','5120R'].filter(id=>partById[id]);
const baseCSS=`
body{--accent:#74e0b9}
.brand small::after{content:' · V2';color:#7beac2}
.v2Section{border:1px solid #314459;background:#15273a;border-radius:10px;margin:12px 10px;padding:11px}
.v2Section h3{font-size:13px;margin:0 0 6px;color:#eaf9f4}
.v2Help{font-size:11px;color:#9db1c6;line-height:1.6;margin:6px 0}
.v2Buttons{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}
.v2Buttons button{flex:1;min-width:82px}
.part.v2Part{width:100%;display:grid;grid-template-columns:82px 1fr;gap:9px;align-items:center;text-align:left;padding:8px 9px}
.v2Part svg{width:82px;height:56px;border-radius:7px;background:#0d1d2c;border:1px solid #294157}
.v2Part .v2Dim{color:#76dcb9;display:block;margin-top:3px;font-size:10px}
.v2Part .v2Tag{font-size:10px;color:#a9bed1;display:block}
#v2Layer{position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden}
#v2Layer .v2Port{position:absolute;width:17px;height:17px;border-radius:50%;border:2px solid #dffeed;background:#36d3a4;box-shadow:0 0 0 4px #225b52a0,0 0 12px #52e9b0b0;transform:translate(-50%,-50%);will-change:left,top;transition:background .1s}
#v2Layer .v2Port.v2Hot{width:24px;height:24px;background:#ffde79;box-shadow:0 0 0 5px #bd974290,0 0 22px #ffe0a9}
#v2Layer .v2Port.v2Start{background:#8cb7ff;box-shadow:0 0 0 5px #6581d97a}
#v2Layer .v2Port.v2End{background:#fead78;box-shadow:0 0 0 5px #ca82597a}
#v2Layer .v2Port .v2Arrow{position:absolute;top:6px;left:19px;border-top:2px solid #f3ffe9;width:15px;transform-origin:-11px 0;filter:drop-shadow(0 1px 1px #13282a)}
#v2Layer .v2Port .v2Arrow:after{content:'';position:absolute;right:-1px;top:-4px;border:3px solid transparent;border-left-color:#f3ffe9}
#v2Layer .v2Port .v2Height{position:absolute;top:-23px;left:50%;transform:translateX(-50%);background:#081828e3;border:1px solid #4a7c84;color:#d2fff0;white-space:nowrap;font:10px/1.4 system-ui;padding:2px 4px;border-radius:4px}
#v2GhostSVG{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#v2Measure{position:absolute;top:13px;left:50%;transform:translateX(-50%);pointer-events:none;color:#c9f9e9;background:#0c1c2bdf;border:1px solid #427463;border-radius:9px;padding:6px 10px;font:12px system-ui;display:none;white-space:nowrap}
.v2Legend{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;font-size:10px;color:#b2c1d1}
.v2Legend b{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:3px}
.v2PlanRow{padding:8px;border:1px solid #334e60;border-radius:8px;margin:6px 0;display:grid;grid-template-columns:1fr auto;align-items:center;gap:7px}
.v2PlanRow small{display:block;color:#8fa5b7}
.v2InspectorSketch{margin:8px 0;padding:8px;border:1px solid #365064;border-radius:9px;background:#0e1b2a;display:grid;place-items:center}
.v2InspectorSketch svg{width:100%;max-height:112px}
.v2HeightSlide{width:100%;accent-color:#66dfb9}
#v2Bottom{position:absolute;left:14px;bottom:78px;z-index:4;display:flex;gap:6px;pointer-events:auto}
.v2Badge{background:#112839db;color:#b5dccf;border:1px solid #426457;padding:5px 8px;border-radius:7px;font-size:11px}
`;
const style=document.createElement('style');style.textContent=baseCSS;document.head.appendChild(style);
// Original renderer uses a back-face cull that hides some thin sloped, double-sided track sheets.
// Keep real per-face normals, but draw both sides of those thin low-poly surfaces.
if(gl)gl.disable(gl.CULL_FACE);
// Cleanly reusable, real-dimensioned SVG track sketches; the same local paths drive 3D geometry.
function partSketch(p,wide=false){
 const paths=localPaths(p),pts=paths.flat(1),minX=Math.min(...pts.map(q=>q[0]))-20,maxX=Math.max(...pts.map(q=>q[0]))+20,
 minZ=Math.min(...pts.map(q=>q[1]))-20,maxZ=Math.max(...pts.map(q=>q[1]))+20;
 const w=wide?255:118,h=wide?103:79,scale=wide?Math.min((w-25)/(maxX-minX),(h-23)/(maxZ-minZ)):0.36,ox=(w-(maxX-minX)*scale)/2,oy=(h-(maxZ-minZ)*scale)/2;
 const xy=q=>[ox+(q[0]-minX)*scale,oy+(maxZ-q[1])*scale];
 const lines=paths.map(path=>`<polyline points="${path.map(q=>xy(q).map(n=>n.toFixed(2)).join(',')).join(' ')}" stroke="#a1b6bf" stroke-width="${Math.max(6,Math.min(21,35*scale)).toFixed(1)}" fill="none" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${path.map(q=>xy(q).map(n=>n.toFixed(2)).join(',')).join(' ')}" stroke="#eff3dc" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('');
 const ports=localPorts(p).map((q,i)=>{const [x,y]=xy([q.x,q.z]);return `<circle cx="${x}" cy="${y}" r="4" fill="${i?'#f9b777':'#62edbb'}" stroke="#0e1d26" stroke-width="1"/>`}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Scale drawing of ${p.id}"><g>${lines}${ports}</g></svg>`;
}
function sizeDescription(p){if(p.kind==='straight')return `${p.L} mm straight`;if(p.kind==='curve')return `R${p.R} · ${p.a}° · ${(p.R*p.a*RAD).toFixed(1)} mm arc`;return `${p.L} mm straight + R${p.R} · ${p.a}° branch`}
renderCatalog=function(){const query=$('catalogSearch').value.toLowerCase().trim(),container=$('catalog');container.replaceChildren();let shown=0;
 for(const group of ['Straights','Curves','Turnouts']){
 const pieces=PARTS.filter(p=>p.group===group&&(!query||(p.id+' '+p.title+' '+sizeDescription(p)).toLowerCase().includes(query)));if(!pieces.length)continue;
 const hdr=document.createElement('div');hdr.className='catTitle';hdr.textContent=group;container.appendChild(hdr);
 for(const p of pieces){shown++;const b=document.createElement('button');b.className='part v2Part'+(active===p.id?' active':'');b.dataset.part=p.id;b.innerHTML=partSketch(p)+`<div><strong>${p.id}</strong><small>${p.title}</small><span class="v2Dim">${sizeDescription(p)}</span></div>`;b.onclick=()=>{active=p.id;moveMode=false;renderCatalog();renderInspector();toast(`${p.id} selected · click a green connector or the board`)};container.appendChild(b)}
 }
 if(!shown)container.innerHTML='<div class="catalogEmpty">No matching track sections</div>';$('countParts').textContent=PARTS.length+' variants';
};
// Prevent duplicate physical track pieces on the exact same position and orientation.
const baseAttach=attachTrack;
attachTrack=function(pid,existing,idx){const port=wports(existing)[idx],p=partById[pid];if(!port||!p)return;
const t=previewPose(p,port);
if(S.tracks.some(q=>q.pid===pid&&Math.hypot(q.x-t.x,q.z-t.z)<1&&Math.abs(q.h0-t.h0)<1&&Math.abs(normalize(q.a-t.a))<.003)){
 toast('That piece is already there. Choose another part or open end.');return;
}
baseAttach(pid,existing,idx);
};
// V1 checked every connector against every other connector on every animation frame.
// Spatial hashing makes connected-end checks scale roughly linearly with the layout.
portConnections=function(){
 const ports=S.tracks.flatMap(t=>wports(t)),bucket=new Map(),result=new Map(),key=(x,y,z)=>`${x}|${y}|${z}`;
 const quant=p=>[Math.round(p.x/2),Math.round(p.y/2),Math.round(p.z/2)];
 for(const p of ports){const q=quant(p),pk=portKey(p);let match=null;
 for(let dx=-1;dx<=1&&!match;dx++)for(let dy=-1;dy<=1&&!match;dy++)for(let dz=-1;dz<=1&&!match;dz++){
  const candidates=bucket.get(key(q[0]+dx,q[1]+dy,q[2]+dz))||[];
  for(const other of candidates){if(other.t.id!==p.t.id&&!result.has(portKey(other))&&connectPorts(other,p)){match=other;break}}
 }
 if(match){result.set(pk,{track:match.t,index:match.idx});result.set(portKey(match),{track:p.t,index:p.idx})}
 else{const k=key(...q);if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(p)}
 }
 return result;
};
// New port overlays are persistent DOM nodes, repositioned every frame.
const overlay=document.createElement('div');overlay.id='v2Layer';overlay.innerHTML='<svg id="v2GhostSVG"></svg><div id="v2Measure"></div>'; $('overlay').appendChild(overlay);
function portIsFree(p){return freePorts().some(q=>q.t.id===p.t.id&&q.idx===p.idx)}
function previewPose(p,source,sourceIndex=0){const local=localPorts(p)[sourceIndex],ang=normalize(source.ang+PI-local.ang),rp=rot(local.x,local.z,ang);return{id:-1,pid:p.id,x:source.x-rp[0],z:source.z-rp[1],a:ang,h0:source.y,h1:source.y,tunnel:false}}
const oldPick=pickAt;
pickAt=function(x,y){if(tab==='track'){
 let nearest=null,best=27;for(const p of freePorts()){const s=project([p.x,p.y+7,p.z]);if(!s)continue;const distance=Math.hypot(s.x-x,s.y-y);if(distance<best){best=distance;nearest=p}}
 if(nearest)return{kind:'port',p:nearest};}
 return oldPick(x,y)
};
function svgLine(points,stroke,width=3,dash=''){return `<polyline fill="none" stroke="${stroke}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''} stroke-linecap="round" stroke-linejoin="round" points="${points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"/>`}
function renderGhost(){let svg=$('v2GhostSVG'),items=[],measurement=$('v2Measure');measurement.style.display='none';
 if(tab!=='track'){svg.innerHTML='';return;}
 let gp=groundPoint(mouse.x,mouse.y,buildHeight),pt=hoverPort&&portIsFree(hoverPort)?hoverPort:null;
 if(V2.gapStart&&V2.gapEnd){const a=project([V2.gapStart.x,V2.gapStart.y+15,V2.gapStart.z]),b=project([V2.gapEnd.x,V2.gapEnd.y+15,V2.gapEnd.z]);if(a&&b){items.push(svgLine([a,b],'#f9c675',2,'7 7'));measurement.textContent=`Gap: ${Math.hypot(V2.gapStart.x-V2.gapEnd.x,V2.gapStart.z-V2.gapEnd.z).toFixed(1)} mm · Δh ${(V2.gapEnd.y-V2.gapStart.y).toFixed(1)} mm`;measurement.style.display='block';}}
 else if(V2.ghostOn&&mouse.inside&&!moveMode&&!V2.gapMode&&partById[active]&&(pt||isInside(gp))){
 const t=pt?previewPose(partById[active],pt):{pid:active,x:Math.round(gp.x/5)*5,z:Math.round(gp.z/5)*5,a:heading,h0:buildHeight,h1:buildHeight};
 for(const path of samplePaths(t)){const pp=path.map(q=>project([q.x,q.y+8,q.z]));if(pp.every(Boolean))items.push(svgLine(pp,pt?'#81e5b5':'#8bcdff',7,'13 5'),svgLine(pp,'#effff9',1.3,'5 5'));}
 }
 svg.setAttribute('viewBox',`0 0 ${canvas.clientWidth} ${canvas.clientHeight}`);svg.innerHTML=items.join('');
}
refreshOverlay=function(){const ports=tab==='track'?freePorts():[],seen=new Set();
 for(const p of ports){const id=portKey(p);seen.add(id);let marker=V2.markerMap.get(id);
 if(!marker){marker=document.createElement('div');marker.className='v2Port';marker.innerHTML='<div class="v2Arrow"></div><span class="v2Height"></span>';overlay.appendChild(marker);V2.markerMap.set(id,marker)}
 const pt=project([p.x,p.y+7,p.z]),visible=pt&&pt.x>=0&&pt.y>=0&&pt.x<canvas.clientWidth&&pt.y<canvas.clientHeight;
 marker.style.display=visible?'block':'none';if(!visible)continue;
 marker.style.left=pt.x+'px';marker.style.top=pt.y+'px';
 const isHot=hoverPort&&portKey(hoverPort)===id,isStart=V2.gapStart&&portKey(V2.gapStart)===id,isEnd=V2.gapEnd&&portKey(V2.gapEnd)===id;
 marker.className='v2Port'+(isHot?' v2Hot':'')+(isStart?' v2Start':'')+(isEnd?' v2End':'');marker.querySelector('.v2Height').textContent=p.y===0?'':`${p.y.toFixed(0)} mm`;
 const ahead=project([p.x+30*Math.cos(p.ang),p.y+7,p.z+30*Math.sin(p.ang)]);
 marker.querySelector('.v2Arrow').style.transform=`rotate(${ahead?Math.atan2(ahead.y-pt.y,ahead.x-pt.x)*180/PI:0}deg)`;
 }
 for(const [id,node]of V2.markerMap)if(!seen.has(id)){node.remove();V2.markerMap.delete(id)}
 renderGhost();
};
// The original UI was on a 100 ms tick, causing marker lag during orbit and zoom.
// Attach a real per-frame overlay sync, including pointer interactions.
function tick(){if(graphicsOK){refreshOverlay()}requestAnimationFrame(tick)}requestAnimationFrame(tick);
const controls=document.createElement('div');controls.className='v2Section';controls.id='v2Controls';controls.innerHTML=`<h3>Precision builder · V2</h3><p class="v2Help">Green dots are live connections. Hover to preview the exact next piece, then click to snap. No stretching or guessed lengths.</p><div class="v2Buttons"><button class="btn small" id="v2GapBtn">⌁ Bridge a gap</button><button class="btn small" id="v2GhostBtn">◉ Preview on</button></div><div class="v2Legend"><span><b style="background:#4cdaa5"></b>Open end</span><span><b style="background:#8cb7ff"></b>Start</span><span><b style="background:#fead78"></b>Finish</span></div><p class="v2Help">Right drag: orbit · Middle drag or Shift + right drag: pan · Wheel: zoom · <b>R</b>: rotate · <b>Esc</b>: cancel.</p>`;
$('trackTab').insertBefore(controls,$('trackTab').children[1]);
const finder=document.createElement('div');finder.className='v2Section';finder.id='v2Finder';finder.innerHTML=`<h3>Connect two open ends</h3><p class="v2Help" id="v2GapStatus">Select “Bridge a gap”, then click the first and second green connectors. RailForge searches exact-length parts.</p><div id="v2Suggestions"></div><div class="v2Buttons"><button id="v2GapClear" class="btn small">Clear selection</button></div>`;
$('trackTab').insertBefore(finder,$('trackTab').children[2]);
const bar=document.createElement('div');bar.id='v2Bottom';bar.innerHTML='<div class="v2Badge" id="v2Info">Scale 1:1 · millimetres</div><button class="btn small" id="v2Top">▦ 2D plan</button><button class="btn small" id="v2Iso">▣ 3D</button>';
$('overlay').appendChild(bar);
$('v2Top').onclick=()=>{$('topView').click();toast('Top-down plan view: dimensions remain in mm')};$('v2Iso').onclick=()=>$('isoView').click();
$('v2GhostBtn').onclick=()=>{V2.ghostOn=!V2.ghostOn;$('v2GhostBtn').textContent=V2.ghostOn?'◉ Preview on':'◯ Preview off'};
function gapMode(enable){V2.gapMode=enable;$('v2GapBtn').classList.toggle('active',enable);$('v2GapBtn').textContent=enable?'✓ Choose open ends':'⌁ Bridge a gap';$('v2GapStatus').textContent=enable?'Click the first green connector, then the second. Only truly compatible track sections will be inserted.':'Select “Bridge a gap”, then click two green connectors.';}
$('v2GapBtn').onclick=()=>gapMode(!V2.gapMode);
function clearGap(){V2.gapStart=null;V2.gapEnd=null;V2.solution=null;$('v2Suggestions').replaceChildren();gapMode(false)}
$('v2GapClear').onclick=clearGap;
// An exact deterministic chain search. Never "close" a gap by stretching or rotating a real rail.
function findGap(a,b,maxPieces=3){
 if(!a||!b||portKey(a)===portKey(b))return[];
 const pool=gapCandidates.map(id=>partById[id]),out=[],seen=new Set(),targAng=normalize(b.ang+PI),desiredDist=Math.hypot(b.x-a.x,b.z-a.z),deltaH=b.y-a.y;
 // DFS prunes by remaining maximum possible length to avoid large combinatorial branches.
 const maxLen=Math.max(...pool.map(p=>p.kind==='straight'?p.L:p.R*p.a*RAD));
 function dfs(x,z,ang,seq,len,limit){
 if(seq.length){const d=Math.hypot(x-b.x,z-b.z),da=Math.abs(normalize(ang-targAng));
  if(d<=1&&da<.003){const key=seq.map(p=>p.id).join(',');if(!seen.has(key)){seen.add(key);out.push({parts:seq.map(p=>p.id),length:len,residual:d,rotation:da,grade:Math.abs(deltaH)/len*100});}return;}
 }
 if(seq.length>=limit||out.length>50)return;
 const remaining=limit-seq.length;if(Math.hypot(x-b.x,z-b.z)>remaining*maxLen+1) return;
 for(const p of pool){const length=p.kind==='straight'?p.L:p.R*p.a*RAD;if(len+length>3900)continue;
 const end=localPorts(p)[1],pos=rot(end.x,end.z,ang),nx=x+pos[0],nz=z+pos[1],na=normalize(ang+end.ang);
 if(seq.length+1===limit&&Math.hypot(nx-b.x,nz-b.z)>1)continue;
 seq.push(p);dfs(nx,nz,na,seq,len+length,limit);seq.pop();if(out.length>50)return;
 }
 }
 for(let n=1;n<=maxPieces;n++){dfs(a.x,a.z,normalize(a.ang),[],0,n);if(out.length)break;}
 return out.sort((u,v)=>u.parts.length-v.parts.length||u.grade-v.grade||u.residual-v.residual).slice(0,8);
}
function addGapSolution(sol){if(!V2.gapStart||!V2.gapEnd||!sol)return;const a=V2.gapStart,b=V2.gapEnd;
 const matches=findGap(a,b,sol.parts.length).find(x=>x.parts.join(',')===sol.parts.join(','));if(!matches){toast('Gap no longer matches: try selecting the ends again');clearGap();return;}
 if(sol.grade>5&&!confirm(`The proposed connection climbs ${sol.grade.toFixed(1)}%, which may be too steep for H0 trains. Place it anyway?`))return;
 saveUndo();let x=a.x,z=a.z,ang=a.ang,acc=0;
 for(const id of sol.parts){const p=partById[id],len=p.kind==='straight'?p.L:p.R*p.a*RAD;
 const section=makeTrack(id,x,z,ang,a.y+acc/sol.length*(b.y-a.y));acc+=len;section.h1=a.y+acc/sol.length*(b.y-a.y);S.tracks.push(section);
 const end=wports(section)[1];x=end.x;z=end.z;ang=end.ang;
 }
 selected={kind:'track',id:S.tracks[S.tracks.length-1].id};clearGap();refreshAll();toast(`Connected ${sol.parts.length} parts exactly · ${sol.length.toFixed(1)} mm`);
}
function updateGap(){const a=V2.gapStart,b=V2.gapEnd;if(!a||!b)return;
 const straight=Math.hypot(b.x-a.x,b.z-a.z),dh=b.y-a.y;
 $('v2GapStatus').textContent=`Ends ${portKey(a)} → ${portKey(b)} · straight-line ${straight.toFixed(1)} mm · Δheight ${dh.toFixed(1)} mm`;
 const out=findGap(a,b,3);const list=$('v2Suggestions');list.replaceChildren();V2.solution=out[0]||null;
 if(!out.length){const el=document.createElement('div');el.className='message alert';el.textContent='No exact closure using 1–3 standard sections. Try repositioning the track, adding a curve, or adjusting the two branches. The editor will never fake a connection.';list.appendChild(el);return;}
 for(const sol of out){const div=document.createElement('div');div.className='v2PlanRow';const label=document.createElement('div');label.innerHTML=`<strong>${sol.parts.join(' + ')}</strong><small>${sol.length.toFixed(1)} mm track · ${sol.grade.toFixed(2)}% slope · error ${sol.residual.toFixed(2)} mm</small>`;
 const btn=document.createElement('button');btn.className='btn small primary';btn.textContent='Place';btn.onclick=()=>addGapSolution(sol);div.append(label,btn);list.appendChild(div);}
}
// Intercept a green-port click only when the user explicitly selected the gap assistant.
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!V2.gapMode||tab!=='track')return;const r=canvas.getBoundingClientRect(),hit=pickAt(e.clientX-r.left,e.clientY-r.top);
 if(hit?.kind!=='port'){toast('Choose a green connector to set a gap endpoint');e.stopImmediatePropagation();return;}
 e.preventDefault();e.stopImmediatePropagation();if(!V2.gapStart||V2.gapEnd){V2.gapStart=hit.p;V2.gapEnd=null;$('v2Suggestions').replaceChildren();$('v2GapStatus').textContent='First endpoint selected. Click the other green connector.'}
 else if(portKey(V2.gapStart)!==portKey(hit.p)){V2.gapEnd=hit.p;gapMode(false);updateGap();}refreshOverlay();
},true);
const oldInspector=renderInspector;
renderInspector=function(){oldInspector();const sel=selected&&byId(selected.id);if(!sel||selected.kind!=='track')return;
 const p=partById[sel.pid],ins=$('inspector'),section=document.createElement('div');section.className='v2Section';section.style.margin='12px';
 section.innerHTML=`<h3>True-size part geometry</h3><div class="v2InspectorSketch">${partSketch(p,true)}</div><div class="mapKey"><span>Heading</span><b>${DEG(sel.a)}</b></div><div class="mapKey"><span>Track length</span><b>${MM(lengthOf(sel))}</b></div><div class="mapKey"><span>End-to-end distance</span><b>${MM(Math.hypot(...(()=>{const q=localPorts(p)[1];return[q.x,q.z]})()))}</b></div><p class="v2Help">For curves, centerline arc length is longer than the straight-line end distance.</p><h3>Quick elevation</h3><p class="v2Help">Slide either end to make an incline. Adjacent connected ends follow automatically.</p><label class="v2Help">Start: <b id="v2H0">${MM(sel.h0)}</b></label><input class="v2HeightSlide" id="v2Slide0" type="range" min="-50" max="250" step="1" value="${sel.h0}"><label class="v2Help">Finish: <b id="v2H1">${MM(sel.h1)}</b></label><input class="v2HeightSlide" id="v2Slide1" type="range" min="-50" max="250" step="1" value="${sel.h1}"><div class="v2Buttons"><button class="btn small" id="v2LevelUp">↑ Raise whole piece 10 mm</button><button class="btn small" id="v2LevelDown">↓ Lower 10 mm</button></div>`;
 const badge=ins.querySelector('.selectionBadge');if(badge)badge.insertAdjacentElement('afterend',section);else ins.prepend(section);
 for(const i of [0,1]){const el=$('v2Slide'+i);let saved=false;el.addEventListener('pointerdown',()=>{saveUndo();saved=true});el.addEventListener('input',()=>{if(!saved){saveUndo();saved=true;}updatePortHeight(sel,i,+el.value);$('v2H'+i).textContent=MM(+el.value);const numeric=$('height'+i);if(numeric)numeric.value=el.value;dirty=true;});el.addEventListener('change',()=>{saved=false;refreshAll()})}
 $('v2LevelUp').onclick=()=>shiftLevel(sel.id,10);$('v2LevelDown').onclick=()=>shiftLevel(sel.id,-10);
};
function shiftLevel(id,delta){const t=byId(id);if(!t)return;saveUndo();const v0=t.h0+delta,v1=t.h1+delta;updatePortHeight(t,0,v0);updatePortHeight(t,1,v1);refreshAll()}
// New renderers always carry consistent upward normals on level terrain, including altered hills.
// WebGL already respects mesh face normals; removing backface culling prevents thin geometry popping out.
// Controls: Shift+right mouse pans, instead of forcing a middle mouse button on a laptop.
canvas.addEventListener('pointerdown',e=>{if(e.button===2&&e.shiftKey){/* native handler sees button=2; it will orbit; override initial mode after it handles */setTimeout(()=>{if(pointer)pointer.mode='pan'},0)}},false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(V2.gapMode||V2.gapStart)){clearGap();refreshOverlay()}},true);
// Never overwrite saved local projects. The existing v1 JSON remains readable in v2.
const oldRefresh=refreshAll;
refreshAll=function(){oldRefresh();$('v2Info').textContent=`${S.tracks.length} rails · ${freePorts().length} free ends · 1:1 mm`;if(V2.gapStart&&V2.gapEnd){const ports=freePorts();if(!ports.some(q=>portKey(q)===portKey(V2.gapStart))||!ports.some(q=>portKey(q)===portKey(V2.gapEnd)))clearGap();}};
// Replace the initial version stamp without changing the original model and export format.
const foot=document.querySelector('.panel.right .footer .fine');if(foot)foot.textContent='PRECISION BUILDER · v2.0';
const hud=$('bottomHud');if(hud)hud.textContent='V2: Choose a rail → hover any green end → click to snap · R rotate · Right drag orbit · Middle drag pan · Scroll zoom';
renderCatalog();refreshAll();
window.RailForgeV2={state:V2,partSketch,sizeDescription,findGap,previewPose,refreshOverlay,closeWith:addGapSolution,gapCandidates};
})();