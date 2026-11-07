import {renderComponentCatalog,bindCatalogExamples} from './component-catalog.mjs';
import {renderIcon,createComponentRenderer,animateStandard} from '../core/components.mjs';
import {renderCatalogArtwork} from './catalog-artwork.mjs';
import {bindDecorativeGraphics} from './graphic-decorations.mjs';
import {createGraphicRenderer} from '../core/graphics.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameOrder=new Intl.Collator('da',{numeric:true,sensitivity:'base'});
const componentIcons={signature:'palette',button:'plus','action-button':'plus',toolbar:'adjustments',link:'arrow-right',menu:'menu-2',menubar:'menu-2','menu-item':'menu-2',input:'pencil',textarea:'file-text','number-input':'adjustments',field:'pencil','field-group':'template',select:'chevron-down',checkbox:'check',radio:'circle',switch:'adjustments','choice-field':'check','segmented-option':'template','segmented-control':'layout-grid','range-field':'adjustments',combobox:'search',multiselect:'check','date-picker':'layout-grid','time-picker':'activity','file-upload':'upload',label:'file-text',navigation:'menu-2',tabs:'folder',breadcrumb:'chevron-right',pagination:'arrow-right',tree:'folder-open',alert:'alert-triangle',toast:'info-circle',spinner:'activity',progress:'activity',skeleton:'template','empty-state':'files',badge:'check','instruction-note':'info-circle',tooltip:'info-circle',heading:'file-text',text:'file-text',image:'photo',caption:'photo',avatar:'circle','avatar-group':'components',tag:'star','metric-row':'activity','brand-mark':'palette','data-table':'layout-grid','data-grid':'layout-grid',card:'template',stack:'stack-2',divider:'menu-2','scroll-area':'arrow-right',accordion:'chevron-down',inspector:'layout-dashboard',dialog:'template',drawer:'layout-dashboard',popover:'copy'};
const componentIcon=id=>renderIcon(componentIcons[id]??'components');
export const CATALOG_CATEGORIES=[
 ['actions','Handlinger',['signature','button','action-button','toolbar','link','menu','menubar','menu-item']],
 ['forms','Formularer',['input','textarea','number-input','field','field-group','select','checkbox','radio','switch','choice-field','segmented-option','segmented-control','range-field','combobox','multiselect','date-picker','time-picker','file-upload','label']],
 ['navigation','Navigation',['navigation','list-item','tabs','breadcrumb','pagination','tree']],
 ['feedback','Feedback',['alert','toast','spinner','progress','skeleton','empty-state','badge','instruction-note','tooltip']],
 ['content','Indhold',['heading','text','image','caption','avatar','avatar-group','tag','metric-row','brand-mark','data-table','data-grid']],
 ['layout','Layout og paneler',['card','stack','divider','scroll-area','accordion','inspector','dialog','drawer','popover']],
];
export function filterCatalog(components,{query='',category='all'}={}){
 const words=query.trim().toLocaleLowerCase('da').split(/\s+/).filter(Boolean);
 const group=CATALOG_CATEGORIES.find(([key])=>key===category);
 return Object.fromEntries(Object.entries(components).sort(([aId,a],[bId,b])=>nameOrder.compare(a.name,b.name)||nameOrder.compare(aId,bId)).filter(([id,c])=>{
  const text=[id,c.name,c.description,...CATALOG_CATEGORIES.filter(([, ,ids])=>ids.includes(id)).map(([,name])=>name)].join(' ').toLocaleLowerCase('da');
  return (!group||group[2].includes(id))&&words.every(word=>text.includes(word));
 }));
}

export function renderCatalogDetails(pack,{components,state,variantFor}={}){
 return components[state.expanded]?'<section class="catalog-detail catalog-inline-detail" id="catalog-inline-details"><div class="catalog-inline-body"><div class="catalog-inline-heading"><div><h2 id="catalog-detail-title" tabindex="-1">'+escape(components[state.expanded].name)+'</h2><p>'+escape(components[state.expanded].description)+'</p></div><button type="button" class="studio-button" data-catalog-back>Luk visning</button></div>'+renderComponentCatalog(pack,{components:{[state.expanded]:components[state.expanded]},state,variantFor,detailOnly:true})+'</div></section>':'';
}

export function renderCatalogBrowser(pack,{components,state,variantFor}={}){
 const filtered=filterCatalog(components,state);
 const count=Object.keys(filtered).length;
 const list=state.layout==='list';
 const artworkRenderer=list?null:createGraphicRenderer(pack);
 const render=createComponentRenderer(pack);
 const choice=(id,body)=>render('button',{
  variant:'ghost',size:'small',state:state.expanded===id?'current':undefined,
  attrs:{id:'catalog-'+id+'-toggle','data-browser-open':id,'aria-expanded':String(state.expanded===id),...(state.expanded===id?{'aria-controls':'catalog-inline-details'}:{})},
  slots:{root:[]}
 }).replace('class="ds-button"','class="ds-button ds-preview-choice '+(list?'catalog-list-row':'catalog-icon-card')+'"').replace('</button>',()=>body+'</button>');
 const details=renderCatalogDetails(pack,{components:filtered,state,variantFor});
 const cards=list?'<ul class="catalog-list">'+Object.entries(filtered).map(([id,component])=>{
  const [,name]=CATALOG_CATEGORIES.find(([, ,ids])=>ids.includes(id))??['other','Øvrige'];
  return '<li>'+choice(id,'<span class="catalog-list-icon" aria-hidden="true">'+componentIcon(id)+'</span><span class="catalog-list-copy"><strong>'+escape(component.name)+'</strong><span>'+escape(component.description)+'</span></span><span class="catalog-list-category">'+name+'</span><span aria-hidden="true">'+renderIcon(state.expanded===id?'chevron-up':'chevron-down',{size:'small'})+'</span>')+(state.expanded===id?details:'')+'</li>';
 }).join('')+'</ul>':'<div class="catalog-icon-grid">'+Object.entries(filtered).map(([id,component])=>choice(id,(renderCatalogArtwork(id,pack,artworkRenderer)||'<span class="catalog-concept-icon" aria-hidden="true">'+componentIcon(id)+'</span>')+'<span>'+escape(component.name)+'</span>')).join('')+details+'</div>';
 const layoutPicker='<div class="segmented catalog-layout-picker" role="group" aria-label="Bibliotekets layout">'+[['cards','Kort','layout-grid'],['list','Liste','menu-2']].map(([value,label,icon])=>'<button type="button" id="catalog-layout-'+value+'" data-catalog-layout="'+value+'" aria-pressed="'+((list?'list':'cards')===value)+'" class="'+((list?'list':'cards')===value?'active':'')+'">'+renderIcon(icon,{size:'small'})+label+'</button>').join('')+'</div>';
 return '<div class="catalog-browser"><div class="catalog-filters"><label class="catalog-search" for="catalog-search"><span>Søg i biblioteket</span><input type="search" class="studio-input" id="catalog-search" placeholder="Navn, funktion eller komponent-id…" value="'+escape(state.query??'')+'" aria-controls="catalog-results"></label><div class="catalog-categories" role="group" aria-label="Komponentkategori">'+[['all','Alle'],...CATALOG_CATEGORIES].map(([id,name])=>'<button type="button" class="studio-button" data-catalog-category="'+id+'" aria-pressed="'+((state.category??'all')===id)+'">'+name+'</button>').join('')+'</div></div><div class="catalog-results-toolbar"><p class="catalog-result-count" role="status">'+count+' af '+Object.keys(components).length+' komponenter · A–Å</p>'+layoutPicker+'</div><div id="catalog-results">'+(count?cards:'<div class="empty"><h3>Ingen komponenter fundet</h3><p>Prøv et andet søgeord eller en anden kategori.</p><button type="button" class="studio-button" data-catalog-reset>Nulstil filtre</button></div>')+'</div></div>';
}

export function bindCatalogBrowser(root,{state,onChange,onSelect=()=>{},pack,components,variantFor,allowNavigation=()=>true,document=globalThis.document}){
 const browser=root.querySelector('.catalog-browser');
 if(!browser)return {destroy(){}};
 const view=document.defaultView;
 let panel=browser.querySelector('#catalog-inline-details'),examples=bindCatalogExamples(browser),disposed=false,scrollFrame=0;
 const artwork=bindDecorativeGraphics(browser,{triggerSelector:'.catalog-icon-card'});
 const grid=browser.querySelector('.catalog-icon-grid');
 const effects=new Set();
 function animatePanel(element,opening){
  const height=element.getBoundingClientRect().height,opacity=view.getComputedStyle(element).opacity;
  element.getAnimations?.().forEach(effect=>effect.cancel());
  const gap=grid?parseFloat(view.getComputedStyle(grid).rowGap)||0:0;
  const margin=parseFloat(view.getComputedStyle(element).marginBottom)||0;
  const collapsed={height:'0px',opacity:0,marginBottom:-gap+'px'};
  const expanded={height:height+'px',opacity,marginBottom:margin+'px'};
  const effect=animateStandard(element,opening?[collapsed,expanded]:[expanded,collapsed],{fill:'both'});
  if(!effect){if(!opening)element.remove();return null;}
  element.style.overflow='hidden';effects.add(effect);
  effect.finished.catch(()=>{}).then(()=>{
   effects.delete(effect);
   if(!opening)element.remove();
   if(!disposed&&opening&&panel===element){effect.cancel();element.style.overflow='';}
  });
  return effect;
 }

 function placePanel(){
  if(!grid||!panel)return;
  const cards=[...grid.querySelectorAll('.catalog-icon-card')];
  const columns=view.getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length;
  const index=cards.findIndex(card=>card.dataset.browserOpen===state.expanded);
  if(index<0)return;
  const last=cards[Math.min(cards.length-1,(Math.floor(index/columns)+1)*columns-1)];
  if(last.nextElementSibling!==panel){const focused=panel.contains(document.activeElement)?document.activeElement:null;last.after(panel);focused?.focus({preventScroll:true});}
 }
 placePanel();
 let gridWidth=grid?.getBoundingClientRect().width;
 const observer=grid&&view.ResizeObserver?new view.ResizeObserver(entries=>{
  const width=entries[0].contentRect.width;
  if(width!==gridWidth){gridWidth=width;placePanel();}
 }):null;
 observer?.observe(grid);
 const opening=state.browserOpening;delete state.browserOpening;
 if(panel&&opening)void animateDetail(true);
 function refresh(id,focus){onChange(id);if(focus)document.getElementById(focus)?.focus({preventScroll:true});}
 browser.querySelectorAll('[data-catalog-layout]').forEach(button=>button.addEventListener('click',()=>{
  if(!allowNavigation())return;
  state.layout=button.dataset.catalogLayout;
  refresh(null,'catalog-layout-'+state.layout);
 }));
 const search=browser.querySelector('#catalog-search');
 search?.addEventListener('input',()=>{
  if(!allowNavigation())return;
  const start=search.selectionStart,end=search.selectionEnd;
  state.query=search.value;
  state.expanded=null;
  refresh(null,'catalog-search');
  document.getElementById('catalog-search')?.setSelectionRange(start,end);
  root.querySelector('.ds-panel-content').scrollTop=0;
 });
 browser.querySelectorAll('[data-catalog-category]').forEach(button=>button.addEventListener('click',()=>{
  if(!allowNavigation())return;
  state.category=button.dataset.catalogCategory;
  state.expanded=null;
  refresh();
  root.querySelector('[data-catalog-category="'+state.category+'"]').focus({preventScroll:true});
  root.querySelector('.ds-panel-content').scrollTop=0;
 }));
 browser.querySelector('[data-catalog-reset]')?.addEventListener('click',()=>{if(allowNavigation()){state.query='';state.category='all';refresh(null,'catalog-search');}});
 function scrollToChoice(id,effect){
  view.cancelAnimationFrame(scrollFrame);
  const button=document.getElementById('catalog-'+id+'-toggle');
  const area=button?.closest('.ds-panel-layout[data-panel-compact="true"]')??button?.closest('.ds-panel-content');
  if(!area)return;
  const from=area.scrollTop;
  function step(){
   if(disposed)return;
   const progress=effect?.playState==='running'?(effect.effect.getComputedTiming().progress??0):1;
   const target=Math.max(0,area.scrollTop+button.getBoundingClientRect().top-area.getBoundingClientRect().top-16);
   area.scrollTo({top:from+(target-from)*progress,behavior:'instant'});
   if(progress<1)scrollFrame=view.requestAnimationFrame(step);
  }
  step();
 }
 const stopScroll=()=>view.cancelAnimationFrame(scrollFrame);
 browser.addEventListener('pointerdown',stopScroll,{passive:true});
 browser.addEventListener('wheel',stopScroll,{passive:true});
 function toggle(id){
  if(!allowNavigation())return;
  const closing=state.expanded===id,previous=panel;
  examples.destroy();
  if(previous){
   if(previous.contains(document.activeElement))document.getElementById('catalog-'+state.expanded+'-toggle')?.focus({preventScroll:true});
   previous.inert=true;previous.setAttribute('aria-hidden','true');
   previous.removeAttribute('id');previous.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  }
  state.expanded=closing?null:id;panel=null;
  browser.querySelectorAll('[data-browser-open]').forEach(button=>{
   const selected=button.dataset.browserOpen===state.expanded;
   button.setAttribute('aria-expanded',String(selected));
   if(button.classList.contains('catalog-list-row'))button.lastElementChild.innerHTML=renderIcon(selected?'chevron-up':'chevron-down',{size:'small'});
   if(selected){button.setAttribute('data-state','current');button.setAttribute('aria-controls','catalog-inline-details');}
   else{button.removeAttribute('data-state');button.removeAttribute('aria-controls');}
  });
  if(!closing){
   const holder=document.createElement('div');holder.innerHTML=renderCatalogDetails(pack,{components,state,variantFor});
   panel=holder.firstElementChild;
   if(grid){grid.append(panel);placePanel();}
   else document.getElementById('catalog-'+id+'-toggle').after(panel);
  }
  const outgoing=previous?animatePanel(previous,false):null;
  const incoming=panel?animatePanel(panel,true):null;
  examples=bindCatalogExamples(panel??document.createElement('div'));
  onSelect(closing?null:id);
  document.getElementById('catalog-'+id+'-toggle')?.focus({preventScroll:true});
  scrollToChoice(id,incoming??outgoing);
 }
 browser.querySelectorAll('[data-browser-open]').forEach(button=>button.addEventListener('click',()=>toggle(button.dataset.browserOpen)));
 browser.addEventListener('click',event=>{
  if(event.target.closest('[data-catalog-back]')&&panel?.contains(event.target))toggle(state.expanded);
  const choice=event.target.closest('[data-catalog-view]');
  if(choice&&panel?.contains(choice)&&allowNavigation()){state.views[state.expanded]=choice.dataset.catalogView;refresh(state.expanded,choice.id);}
 });
 browser.addEventListener('change',event=>{
  for(const [selector,key]of [['size','buttonSize'],['intent','buttonIntent']])if(event.target.matches('[data-catalog-'+selector+']')&&allowNavigation()){state[key]=event.target.value;refresh(state.expanded,event.target.id);}
 });
 browser.addEventListener('keydown',event=>{if(!event.defaultPrevented&&event.key==='Escape'&&panel&&(panel.contains(event.target)||event.target.closest('[data-browser-open]')?.dataset.browserOpen===state.expanded)){event.preventDefault();toggle(state.expanded);}});

 return {destroy(){disposed=true;view.cancelAnimationFrame(scrollFrame);for(const effect of effects)effect.cancel();artwork.destroy();examples.destroy();observer?.disconnect();}};
}
