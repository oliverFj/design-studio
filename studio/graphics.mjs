import {GRAPHIC_FAMILIES,GRAPHIC_MOTIFS,GRAPHIC_MOTION,getGraphicFamily,getGraphicParts,renderGraphic,createGraphicRenderer,mountGraphicMotion} from '../core/graphics.mjs';
import {GRAPHIC_TOKEN_DEFAULTS,DEFAULT_GRAPHIC_FAMILY} from '../core/graphic-tokens.mjs';
import {resolveTokens} from '../core/engine.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const createGraphicsState=()=>({family:DEFAULT_GRAPHIC_FAMILY,motif:'poster',part:'',progress:1,direction:1,loop:false,reduced:false,query:''});
export function resolveGraphicFamily(pack,preference){
 return GRAPHIC_FAMILIES.some(item=>item.id===preference)?preference:getGraphicFamily(pack);
}
export const graphicPreviewTheme=(pack,family)=>({...pack,graphics:{family}});
export function filterGraphicMotifs(query=''){
 const words=query.trim().toLocaleLowerCase('da').split(/\s+/).filter(Boolean);
 return GRAPHIC_MOTIFS.filter(item=>words.every(word=>[item.id,item.name,item.meaning].join(' ').toLocaleLowerCase('da').includes(word)));
}

export function renderGraphicsView(pack,state,{showcase=false}={}){
 const familyId=getGraphicFamily(pack),family=GRAPHIC_FAMILIES.find(item=>item.id===familyId);
 const motif=GRAPHIC_MOTIFS.find(item=>item.id===state.motif)||GRAPHIC_MOTIFS[0];
 const motion=GRAPHIC_MOTION[familyId],graphics=createGraphicRenderer(pack);
 const matching=new Set(filterGraphicMotifs(state.query).map(item=>item.id));
 const editorial=GRAPHIC_MOTIFS.slice(0,4),components=GRAPHIC_MOTIFS.slice(4).toSorted((a,b)=>a.name.localeCompare(b.name,'da'));
 let tokens={};try{tokens=resolveTokens(pack);}catch{}
 return `<div class="graphics-studio"><div class="canvas-toolbar"><h2>Grafik <span class="count">${GRAPHIC_FAMILIES.length} illustrationsstile · ${GRAPHIC_FAMILIES.length*GRAPHIC_MOTIFS.length} motiver</span></h2></div>
 <p class="help">Temaet anbefaler en illustrationsstil og leverer farver og materialer. Du kan frit vælge et andet formsprog eller følge temaets anbefaling i menuen.</p>
 <div class="graphic-families" role="group" aria-label="Vælg illustrationsstil">${GRAPHIC_FAMILIES.map(item=>`<button type="button" class="graphic-family" id="graphic-family-${item.id}" data-graphic-family="${item.id}" aria-pressed="${item.id===familyId}"><span class="graphic-art">${graphics.render('poster',{family:item.id,idPrefix:'studio-family-'+item.id,decorative:true})}</span><strong>${escape(item.name)}</strong><span>${escape(item.qualities.join(' · '))}</span></button>`).join('')}</div>
 <div class="graphic-heading"><div><p class="eyebrow">${escape(family.qualities.join(' · '))}</p><h2>${escape(family.name)}</h2><p>${escape(family.description)}</p></div><label class="studio-field" for="graphic-motif">Motiv<select class="studio-input" id="graphic-motif">${[['Principillustrationer',editorial],['Komponenter',components]].map(([name,items])=>`<optgroup label="${name}">${items.map(item=>`<option value="${item.id}"${item.id===motif.id?' selected':''}>${escape(item.name)}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
 <div class="graphic-workbench"><figure class="graphic-figure"><div class="graphic-stage graphic-art" id="graphic-stage">${graphics.render(motif.id,{idPrefix:'studio-graphic-'+familyId+'-'+motif.id})}</div><figcaption><strong>${escape(motif.name)}</strong><span>${escape(motif.meaning)}</span></figcaption></figure>
 <section class="graphic-player" aria-label="Afspilning og interaktion"><h3>${escape(motion.title)}</h3><p>${escape(motion.description)}</p><div class="graphic-play-buttons"><button type="button" class="studio-button primary" id="graphic-play">Afspil</button><button type="button" class="studio-button" id="graphic-reverse">Baglæns</button><button type="button" class="studio-button" id="graphic-finish">Vis færdig</button></div>
 <label class="graphic-timeline-label" for="graphic-timeline">Tidslinje <output id="graphic-time"></output></label><input id="graphic-timeline" type="range" min="0" max="1000" step="1" value="${Math.round(state.progress*1000)}">
 <div class="graphic-options"><label><input type="checkbox" id="graphic-loop"${state.loop?' checked':''}> Gentag</label><label><input type="checkbox" id="graphic-reduced"${state.reduced?' checked':''}> Rolig visning</label></div><p class="help" id="graphic-motion-note"></p>
 <p id="graphic-interaction-hint">${escape(motion.interactionHint)} Du kan også fokusere grafikken og bruge piletasterne. Escape nulstiller.</p>
 <details class="graphic-layer-details"><summary>Undersøg motivets dele</summary><label class="studio-field" for="graphic-part">Fremhæv et lag<select id="graphic-part" class="studio-input"></select></label><p id="graphic-part-description" class="help"></p></details>
 ${showcase?'':`<button type="button" class="studio-button graphic-download" id="graphic-download">Hent motiv som SVG</button>`}</section></div>
 <div class="graphic-gallery-heading"><div><h3 class="graphic-motifs-heading">Stilens ${GRAPHIC_MOTIFS.length} motiver</h3><p class="help">Alle ${components.length} komponentroller og ${editorial.length} principillustrationer.</p></div><label class="studio-field" for="graphic-search">Find motiv<input type="search" id="graphic-search" class="studio-input" value="${escape(state.query)}" placeholder="Navn eller funktion…" aria-controls="graphic-motif-gallery"></label></div><p class="help" id="graphic-result-count" role="status">${matching.size} af ${GRAPHIC_MOTIFS.length} motiver</p><div id="graphic-motif-gallery" class="graphic-motifs" role="group" aria-label="Vælg motiv">${[...editorial,...components].map(item=>`<button type="button" class="graphic-motif" id="graphic-motif-${item.id}" data-graphic-motif="${item.id}" aria-label="${escape(item.name)}" aria-pressed="${item.id===motif.id}"${matching.has(item.id)?'':' hidden'}><span class="graphic-art">${graphics.render(item.id,{idPrefix:'studio-thumb-'+familyId+'-'+item.id,decorative:true})}</span><span>${escape(item.name)}</span></button>`).join('')}</div><p id="graphic-empty" class="help"${matching.size?' hidden':''}>Ingen motiver matcher. Prøv et andet navn eller en funktion.</p>
 <details class="graphic-token-details"><summary>Grafikkens farver og materialer</summary><p class="help">Temaet styrer billedbund, pigment, modstemme, lys og materiale særskilt fra betjeningens farver. Vælg en variabel for at redigere den under Tokens.</p><div class="graphic-token-grid">${Object.entries(GRAPHIC_TOKEN_DEFAULTS).map(([id,definition])=>`<button type="button" class="graphic-token" data-token="${id}">${definition.$type==='color'?`<span class="swatch" style="background:var(--ds-${id.replaceAll('.','-')})" aria-hidden="true"></span>`:'<span class="graphic-token-metric" aria-hidden="true">↔</span>'}<span><strong>${escape(definition.description)}</strong><code>${escape(id)}</code><small>${escape(tokens[id]??definition.$value)}</small></span></button>`).join('')}</div></details>
 </div>`;
}

export function bindGraphicsView(root,{pack,state,onChange,onFamily,download,showcase=false,document=root.ownerDocument}={}){
 const scope=root.querySelector('.graphics-studio');
 if(!scope)return {destroy(){}};
 const get=id=>scope.querySelector('#'+id),svg=get('graphic-stage').querySelector('svg');
 const familyId=getGraphicFamily(pack),cleanups=[];
 const listen=(node,event,handler)=>{node?.addEventListener(event,handler);if(node)cleanups.push(()=>node.removeEventListener(event,handler));};
 let controller,destroyed=false;
 const clearPart=()=>{state.part='';get('graphic-part').value='';highlight();controller?.setInteraction(true);};
 const refresh=motion=>{
  if(destroyed)return;
  state.progress=motion.progress;state.direction=motion.direction;state.loop=motion.loop;
  get('graphic-play').textContent=motion.playing?'Pause':'Afspil';
  for(const id of ['graphic-play','graphic-reverse','graphic-timeline','graphic-loop'])get(id).disabled=motion.reduced;
  get('graphic-timeline').value=String(Math.round(motion.progress*1000));
  get('graphic-timeline').setAttribute('aria-valuetext',Math.round(motion.progress*100)+' procent');
  get('graphic-time').textContent=`${(motion.time/1000).toFixed(1)} / ${(motion.duration/1000).toFixed(1)} s`;
  get('graphic-reduced').checked=motion.reduced;get('graphic-reduced').disabled=motion.systemReduced;
  get('graphic-motion-note').textContent=motion.reduced?(motion.systemReduced?'Systemets indstilling for reduceret bevægelse er aktiv.':'Det færdige motiv vises uden bevægelse.'):(motion.loop?'Gentagelse er slået til. Pause stopper afspilningen.':'Afspilningen gentages kun, når du vælger Gentag.');
 };
 const originalProgress=state.progress,originalLoop=state.loop,originalDirection=state.direction;
 controller=mountGraphicMotion(svg,{reduced:state.reduced,hintId:'graphic-interaction-hint',beforePlay:clearPart,onUpdate:refresh});
 controller.setLoop(originalLoop);
 if(originalProgress<1)controller.seek(originalProgress,{direction:originalDirection});
 const parts=getGraphicParts(pack,state.motif),knownParts=parts.map(part=>part.key);
 get('graphic-part').innerHTML='<option value="">Hele motivet</option>'+parts.map(part=>`<option value="${escape(part.key)}">${escape(part.name)}</option>`).join('');
 if(!knownParts.includes(state.part))state.part='';
 get('graphic-part').value=state.part;
 function highlight(){
  svg.querySelectorAll('[data-part]').forEach(group=>{
   const key=state.part,related=group.dataset.part===key||group.querySelector(`[data-part="${key}"]`)||group.parentElement.closest(`[data-part="${key}"]`);
   group.classList.toggle('graphic-muted',Boolean(key)&&!related);
  });
  get('graphic-part-description').textContent=parts.find(part=>part.key===state.part)?.purpose||'Alle lag vises samlet. Vælg et lag for at fremhæve det.';
 }
 if(state.part){controller.settle();controller.setInteraction(false);}highlight();
 listen(get('graphic-play'),'click',()=>controller.toggle());
 listen(get('graphic-reverse'),'click',()=>controller.play(true));
 listen(get('graphic-finish'),'click',()=>controller.settle());
 listen(get('graphic-timeline'),'input',event=>{clearPart();controller.seek(Number(event.target.value)/1000);});
 listen(get('graphic-loop'),'change',event=>{state.loop=event.target.checked;controller.setLoop(state.loop);});
 listen(get('graphic-reduced'),'change',event=>{state.reduced=event.target.checked;controller.setReduced(state.reduced);});
 listen(get('graphic-part'),'change',event=>{controller.settle();state.part=event.target.value;controller.setInteraction(!state.part);highlight();});
 const changeMotif=(motif,focus)=>{state.motif=motif;state.part='';state.progress=1;onChange();document.getElementById(focus)?.focus({preventScroll:true});};
 listen(get('graphic-motif'),'change',event=>changeMotif(event.target.value,'graphic-motif'));
 listen(get('graphic-search'),'input',event=>{
  state.query=event.target.value;
  const ids=new Set(filterGraphicMotifs(state.query).map(item=>item.id));
  scope.querySelectorAll('[data-graphic-motif]').forEach(button=>{button.hidden=!ids.has(button.dataset.graphicMotif);});
  get('graphic-result-count').textContent=`${ids.size} af ${GRAPHIC_MOTIFS.length} motiver`;
  get('graphic-empty').hidden=ids.size>0;
 });
 scope.querySelectorAll('[data-graphic-motif]').forEach(button=>listen(button,'click',()=>changeMotif(button.dataset.graphicMotif,button.id)));
 scope.querySelectorAll('[data-graphic-family]').forEach(button=>listen(button,'click',()=>{if(button.dataset.graphicFamily===familyId)return;state.part='';state.progress=1;onFamily(button.dataset.graphicFamily);document.getElementById(button.id)?.focus({preventScroll:true});}));
 listen(get('graphic-download'),'click',()=>{
  if(showcase)return;
  const body=renderGraphic(pack,state.motif,{resolved:true,idPrefix:familyId+'-'+state.motif});
  download(`${pack.id}-${familyId}-${state.motif}.svg`,'<?xml version="1.0" encoding="UTF-8"?>\n'+body,'image/svg+xml');
 });
 return {destroy(){destroyed=true;cleanups.forEach(cleanup=>cleanup());controller.destroy();}};
}
