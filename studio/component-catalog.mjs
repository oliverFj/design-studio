import {createComponentRenderer,animateStandard,renderIcon} from '../core/components.mjs';
import {buttonVariantIds,COMPONENT_COVERAGE} from '../core/library.mjs';
import {renderMenuExample,bindMenuExamples} from './menu-example.mjs';
import {renderNavigationExample,bindNavigationExamples} from './navigation-example.mjs';
import {renderOverlayExample,bindOverlayExamples} from './overlay-example.mjs';
import {renderContentExample,bindContentExamples} from './content-example.mjs';
import {renderInputChoiceExample,bindInputChoiceExamples} from './input-choice-example.mjs';
import {renderFeedbackExample,bindFeedbackExamples} from './feedback-example.mjs';
import {renderFileExample,bindFileExamples} from './file-example.mjs';
import {renderDataTableExample,bindDataTableExamples} from './data-table-example.mjs';
import {renderDataGridExample,bindDataGridExamples} from './data-grid-example.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stateNames={normal:'Normal',hover:'Hover',active:'Trykket ned',focus:'Tastaturfokus',disabled:'Deaktiveret',loading:'Arbejder',pressed:'Valgt',current:'Aktuelt mål',expanded:'Udvidet'};
const coverageStatus={available:'Implementeret',partial:'Delvis adfærd',planned:'Planlagt'};
const coverageBehavior={static:'Indhold og layout',native:'Native kontrol',controller:'Fælles controller'};
export const createCatalogState=()=>({expanded:null,views:{},buttonSize:'medium',buttonIntent:'normal'});
export const catalogVariants=(pack,id,component)=>pack.schemaVersion===2&&id==='button'?buttonVariantIds(component):Object.keys(component.variants??{}).filter(variant=>pack.schemaVersion!==2||id!=='link'||variant!=='action');

export function renderComponentCatalog(pack,{components,state,selected,variantFor=()=>undefined}={}){
 const render=createComponentRenderer(pack);
 const planned=Object.entries(COMPONENT_COVERAGE).filter(([,item])=>item.status==='planned');
 const coverage=pack.schemaVersion===2?'<details class="catalog-coverage"><summary>Dækning: '+Object.keys(components).length+' roller i biblioteket · '+planned.length+' planlagte</summary><p class="help">Implementeret beskriver leveret struktur og adfærd, ikke en tilgængelighedsgodkendelse. Et statisk preview er ikke en færdig interaktion.</p><ul>'+Object.entries(components).map(([id,component])=>{
  const item=COMPONENT_COVERAGE[id];return '<li><strong>'+escape(component.name)+'</strong> · '+escape(coverageStatus[item?.status]??'Ikke vurderet')+' · '+escape(coverageBehavior[item?.behavior]??'Ikke vurderet')+(item?.entryPoint?' · <code>'+escape(item.entryPoint)+'</code>':'')+'<p class="help">'+escape(item?.note??'Ingen registreret leverancebeskrivelse.')+'</p></li>';
 }).join('')+'</ul>'+(planned.length?'<h3>Planlagte roller</h3><ul>'+planned.map(([id,item])=>'<li>'+escape(item.name)+' · <code>'+escape(id)+'</code></li>').join('')+'</ul>':'<p>Der er ingen planlagte roller i det aftalte katalog.</p>')+'</details>':'';
 let details='';
 const specimen=(id,variant,prefix,condition)=>{
  const intent=id==='button'?state.buttonIntent:'normal';
  if(intent==='danger'&&variant==='secondary')return '<p class="catalog-unavailable">Secondary bruges til neutrale ledsagehandlinger.</p>';
  if(id==='menubar'&&!condition)return renderMenuExample(pack,prefix,render);
  if(id==='tabs'&&!condition)return renderNavigationExample(pack,prefix,render);
  if(['dialog','drawer','popover','tooltip'].includes(id)&&!condition)return renderOverlayExample(pack,id,prefix,render,variant);
  if(['combobox','multiselect','date-picker','time-picker'].includes(id)&&!condition)return renderInputChoiceExample(pack,id,prefix,render,variant);
  if(['spinner','progress','skeleton','toast','empty-state'].includes(id)&&!condition)return renderFeedbackExample(pack,id,prefix,render,variant);
  if(id==='file-upload'&&!condition)return renderFileExample(pack,prefix,render,variant);
  if(id==='data-table'&&!condition)return renderDataTableExample(pack,prefix,render);
  if(id==='data-grid'&&!condition)return renderDataGridExample(pack,prefix,render);
  return render(id,{variant,idPrefix:prefix,open:id==='dialog',...(condition&&condition!=='normal'?{state:condition}:{}),...(id==='button'&&condition?{text:'Gem'}:{}),...(id==='button'&&pack.schemaVersion===2?{size:state.buttonSize,intent}:{}),...(id==='button'&&condition==='loading'?{loading:true}:{})});
 };
 return coverage+'<div class="component-grid">'+Object.entries(components).map(([id,component])=>{
  const variants=catalogVariants(pack,id,component),samples=[...variants];
  if(!samples.length||!samples.includes(component.preview?.variant??['default','primary','neutral','horizontal'].find(v=>variants.includes(v))))samples.unshift(undefined);
  const order=['hover','active','focus','disabled','loading','pressed','current'];
  const states=['normal',...Object.keys(component.states??{}).sort((a,b)=>order.indexOf(a)-order.indexOf(b))];
  const open=state.expanded===id,view=state.views[id]??'variants',prefix='catalog-'+id;
  const axes=id==='button'&&pack.schemaVersion===2?'<div class="catalog-axes"><label for="catalog-button-size">Størrelse<select id="catalog-button-size" data-catalog-size>'+[['small','Small · 32 px'],['medium','Medium · 44 px'],['large','Large · 48 px']].map(([value,label])=>'<option value="'+value+'"'+(state.buttonSize===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label><label for="catalog-button-intent">Betydning<select id="catalog-button-intent" data-catalog-intent>'+[['normal','Normal'],['danger','Destruktiv']].map(([value,label])=>'<option value="'+value+'"'+(state.buttonIntent===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label></div>':'';
  let panel='';
  if(open){
   const picker='<div class="catalog-panel-toolbar"><div class="catalog-view-picker"><div class="segmented" role="group" aria-label="Visning for '+escape(component.name)+'">'+['variants','states'].map(v=>'<button type="button" id="'+prefix+'-'+v+'" data-catalog-view="'+v+'" class="'+(view===v?'active':'')+'" aria-pressed="'+(view===v)+'">'+(v==='variants'?'Varianter':'Tilstande')+'</button>').join('')+'</div><code class="catalog-technical-name">'+escape(id)+'</code></div>'+axes+'</div>';
   const variantGrid=()=>'<div class="catalog-variants">'+samples.map((variant,index)=>'<section class="catalog-variant"><h3>'+escape(variant??'Grundudgave')+'</h3><p class="help">'+escape(component.variants?.[variant]?.description??component.description)+'</p><div class="catalog-sample ds-scope">'+specimen(id,variant,prefix+'-variant-'+index)+'</div></section>').join('')+'</div>';
   const matrix=()=>states.length===1?'<p class="help">Komponenten har ingen særskilt deklarerede tilstande.</p>':'<p class="help">Tilstandene vises fast. Tabellen kan rulles vandret.</p><div class="catalog-state-scroll" tabindex="0" role="region" aria-label="Tilstande for '+escape(component.name)+'"><table class="catalog-state-table"><caption class="sr-only">Varianter og tilstande for '+escape(component.name)+'</caption><thead><tr><th scope="col">Variant</th>'+states.map(s=>'<th scope="col">'+escape(stateNames[s]??s)+'</th>').join('')+'</tr></thead><tbody>'+samples.map((variant,index)=>'<tr><th scope="row">'+escape(variant??'Grundudgave')+'</th>'+states.map(s=>'<td><div class="catalog-sample ds-scope" inert>'+specimen(id,variant,prefix+'-'+index+'-'+s,s)+'</div></td>').join('')+'</tr>').join('')+'</tbody></table></div>';
   panel='<div class="catalog-expansion" id="'+prefix+'-panel" data-catalog-details="'+id+'" role="region" aria-labelledby="'+prefix+'-name"><div class="catalog-panel">'+picker+(view==='variants'?variantGrid():matrix())+(id==='avatar-group'&&view==='variants'?'<section class="catalog-variant"><h3>Indhold og handlinger sammen</h3>'+renderContentExample(pack,prefix+'-content',render)+'</section>':'')+'</div></div>';
   details=panel;
  }
  return '<article class="specimen'+(selected===id?' selected':'')+(open?' expanded':'')+'" data-catalog-card="'+id+'"><h3 class="catalog-heading"><button type="button" class="specimen-label" id="'+prefix+'-toggle" data-catalog-toggle="'+id+'" aria-expanded="'+open+'"'+(open?' aria-controls="'+prefix+'-panel"':'')+'><b id="'+prefix+'-name" title="'+escape(component.name)+'">'+escape(component.name)+'</b><span class="catalog-summary"><small>'+samples.length+' '+(samples.length===1?'variant':'varianter')+'</small><span aria-hidden="true">'+renderIcon(open?'chevron-up':'chevron-down',{size:'small'})+'</span></span></button></h3><div class="specimen-preview ds-scope">'+specimen(id,variantFor(id),'specimen-'+id)+'</div></article>';
 }).join('')+details+'</div>';
}

export function bindComponentCatalog(root,{state,onChange,allowNavigation=()=>true,document=globalThis.document}){
 const grid=root.querySelector('.component-grid');
 if(!grid)return {destroy(){}};
 const menus=bindMenuExamples(grid);
 const navigation=bindNavigationExamples(grid),overlays=bindOverlayExamples(grid),content=bindContentExamples(grid);
 const additions=[bindInputChoiceExamples(grid),bindFeedbackExamples(grid),bindFileExamples(grid),bindDataTableExamples(grid),bindDataGridExamples(grid)];
 const cards=[...grid.querySelectorAll('[data-catalog-card]')],panel=grid.querySelector('[data-catalog-details]');
 const view=document.defaultView??globalThis;
 const reveals=new Set();
 let disposed=false,animation=null,request=0,columns=0;
 const columnCount=()=>Math.max(1,view.getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(track=>parseFloat(track)>0).length);
 const row=id=>Math.floor(cards.findIndex(card=>card.dataset.catalogCard===id)/columnCount());
 const rowCards=id=>cards.slice(row(id)*columnCount(),(row(id)+1)*columnCount());
 const previewHeight=id=>Math.max(...rowCards(id).map(card=>card.getBoundingClientRect().height))-Math.max(...rowCards(id).map(card=>card.querySelector('.catalog-heading').getBoundingClientRect().height+2));
 function placePanel(){
  if(!panel)return;
  // A spanning panel must not revive empty auto-fit tracks and narrow the cards.
  const display=panel.style.display;
  panel.style.display='none';
  grid.style.removeProperty('grid-template-columns');
  const count=columnCount();
  grid.style.gridTemplateColumns='repeat('+count+',minmax(0,1fr))';
  panel.style.display=display;
  if(columns===count)return;
  columns=count;
  const index=cards.findIndex(card=>card.dataset.catalogCard===state.expanded);
  if(index<0)return;
  cards.forEach(card=>card.removeAttribute('data-catalog-row'));
  const siblings=rowCards(state.expanded);
  siblings.forEach(card=>card.setAttribute('data-catalog-row',''));
  const last=siblings.at(-1);
  last.after(panel);
  grid.style.setProperty('--catalog-row-gap',view.getComputedStyle(grid).rowGap);
 }
 placePanel();
 const observer=view.ResizeObserver?new view.ResizeObserver(placePanel):null;
 observer?.observe(grid);
 async function animatePanel(from,to,{opening=false,closing=false}={}){
  animation?.cancel();
  const effect=animateStandard(panel,[
   {height:from+'px',opacity:opening?0:1},
   {height:to+'px',opacity:closing?0:1},
  ],{fill:'both'});
  if(!effect)return;
  animation=effect;
  try{await effect.finished;}catch{/* A newer selection or view may replace this transition. */}
  if(animation===effect){effect.cancel();animation=null;}
 }
 const pending=state.motion;delete state.motion;
 if(panel&&pending)void animatePanel(pending.from,panel.getBoundingClientRect().height,{opening:pending.opening});
 function track(effect){
  if(!effect)return;
  reveals.add(effect);effect.finished.catch(()=>{}).finally(()=>reveals.delete(effect));
 }
 function restoreRow(id){
  if(panel.style.position==='absolute')return;
  const previous=new Map(cards.map(card=>[card,card.getBoundingClientRect().top]));
  const top=panel.getBoundingClientRect().top-grid.getBoundingClientRect().top;
  // Let the old panel fade above the returning cards while the following rows move once.
  Object.assign(panel.style,{position:'absolute',top:top+'px',left:'0',width:'100%',margin:'0',zIndex:'3',pointerEvents:'none'});
  const siblings=rowCards(id);
  siblings.forEach(card=>card.removeAttribute('data-catalog-row'));
  const positions=new Map(cards.map(card=>[card,card.getBoundingClientRect().top]));
  for(const card of cards){
   if(siblings.includes(card)){
    const header=card.querySelector('.catalog-heading').getBoundingClientRect().height+2;
    track(animateStandard(card,[{clipPath:'inset(0 0 calc(100% - '+header+'px) 0)'},{clipPath:'inset(0)'}]));
    track(animateStandard(card.querySelector('.specimen-preview'),[{opacity:0},{opacity:1}]));
   }else{
    const offset=previous.get(card)-positions.get(card);
    if(Math.abs(offset)>1)track(animateStandard(card,[{transform:'translateY('+offset+'px)'},{transform:'translateY(0)'}]));
   }
  }
 }
 const refresh=(id,focus)=>{onChange(id);if(focus)document.getElementById(focus)?.focus({preventScroll:true});};
 async function toggle(id){
  if(!allowNavigation())return;
  const operation=++request,current=state.expanded,closing=current===id;
  let from=panel?.getBoundingClientRect().height??Math.max(0,previewHeight(id)),opening=!panel;
  if(panel&&(closing||row(current)!==row(id))){
   if(panel.contains(document.activeElement))document.getElementById('catalog-'+current+'-toggle')?.focus({preventScroll:true});
   panel.inert=true;
   observer?.disconnect();
   restoreRow(current);
   await animatePanel(from,0,{closing:true});
   if(disposed||operation!==request)return;
   from=closing?0:Math.max(0,previewHeight(id));opening=true;
  }
  state.expanded=closing?null:id;
  if(!closing)state.motion={from,opening};
  refresh(id,'catalog-'+id+'-toggle');
  const button=document.getElementById('catalog-'+id+'-toggle'),canvas=button?.closest('.ds-panel-content');
  if(button&&canvas){const bounds=button.getBoundingClientRect(),area=canvas.getBoundingClientRect();if(bounds.top<Math.max(0,area.top)||bounds.bottom>Math.min(view.innerHeight,area.bottom))button.scrollIntoView({block:'nearest'});}
 }
 root.querySelectorAll('[data-catalog-toggle]').forEach(button=>button.addEventListener('click',()=>void toggle(button.dataset.catalogToggle)));
 root.querySelectorAll('[data-catalog-view]').forEach(button=>button.addEventListener('click',()=>{state.views[state.expanded]=button.dataset.catalogView;refresh(state.expanded,button.id);}));
 root.querySelector('[data-catalog-size]')?.addEventListener('change',event=>{state.buttonSize=event.target.value;refresh(state.expanded,event.target.id);});
 root.querySelector('[data-catalog-intent]')?.addEventListener('change',event=>{state.buttonIntent=event.target.value;refresh(state.expanded,event.target.id);});
 grid.addEventListener('keydown',event=>{if(!event.defaultPrevented&&event.key==='Escape'&&state.expanded&&(panel?.contains(event.target)||event.target.closest('[data-catalog-card]')?.dataset.catalogCard===state.expanded)){event.preventDefault();void toggle(state.expanded);}});
 return {destroy(){disposed=true;menus.destroy();navigation.destroy();overlays.destroy();content.destroy();for(const control of additions)control.destroy();observer?.disconnect();animation?.cancel();for(const effect of reveals)effect.cancel();}};
}
