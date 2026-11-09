import {generateCSS} from '../../core/engine.mjs';
import {createComponentFactory,mountDialog,mountRangeField,animateThemed} from '../../core/components.mjs';
import {resolveThemeMode,themeModeOptions} from '../../core/theme-modes.mjs';
import {renderStadeMark} from '../../studio/identity.mjs';

export const SCENES=Object.freeze({
  aureol:{name:'Aureol',eyebrow:'Et studie i lys og nærvær',title:['Mellem lys','og virkelighed.'],description:'Træd ind i et rum, der kun findes i mødet mellem farve, materiale og dig.',primary:'Om oplevelsen',secondary:'Form dit lys',detailTitle:'Et rum til at blive i',detail:'Aureol er en digital lysinstallation. Flyt lyset, vælg et nyt rum og se den samme form få en anden karakter. Oplevelsen er visuel og indeholder ingen lydafspilning.',spaces:[['morgen','Morgenlys','Et varmt lys strejfer den opale ring.'],['dis','Dis','Materialet træder frem i et køligt, diffust lys.'],['efterglod','Efterglød','Lavt lys samler sig i materialets kanter.']]},
  obsidian:{name:'Obsidian',eyebrow:'Observatorium  /  Studie 02',title:['Et andet','tyngdepunkt.'],description:'Et lille observatorium for store perspektiver. Undersøg, hvordan lys giver mørket form.',primary:'Åbn observation',secondary:'Indstil rummet',detailTitle:'Observation 07 · Brydning',detail:'Den facetterede kerne er en visuel model af et rumligt objekt. Vælg et observationsfelt og ændr lysstyrken for at undersøge kontur, refleks og dybde. Tallene beskriver kun dette studie.',spaces:[['brydning','Brydning','Kantlys tegner kernens brudflader.'],['horisont','Horisont','Et lavt lysfelt åbner rummet bag kernen.'],['dybde','Dybde','Kernen flytter sig tilbage i et mørkere felt.']]},
});

const el=(doc,tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};

/** A product composition of shared controls. Theme changes keep the live DOM,
 * range draft, observation and modal state intact. The sculpture is decorative.
 */
export function mountScene({root,themes,sceneId='aureol',style,document:doc=root?.ownerDocument}){
 if(!root||!doc||!themes?.length)throw new Error('A scene requires a root and authored themes.');
 const scene=SCENES[sceneId];if(!scene)throw new Error('Unknown scene.');
 const sources=themes.map(item=>item.package??item);
 const initial=sources.find(item=>item.id===sceneId)??sources[0];
 const state={theme:initial.id,color:initial.defaultMode,intensity:72,space:scene.spaces[0][0]};
 const active=()=>sources.find(item=>item.id===state.theme);
 let theme=resolveThemeMode(initial,state.color),animation=null;
 const c=createComponentFactory(theme,{document:doc});
 const cleanups=[];
 const listen=(node,type,handler)=>{node.addEventListener(type,handler);cleanups.push(()=>node.removeEventListener(type,handler));};
 root.className='scene ds-scope scene-'+sceneId;
 root.setAttribute('data-space',state.space);
 const skip=el(doc,'a','scene-skip','Gå til lyskontroller');skip.setAttribute('href','#light-controls');
 const header=el(doc,'header','scene-header');
 const brand=el(doc,'a','scene-brand','STADE');brand.setAttribute('aria-label','Stade · tilbage til Scener');
 const mark=el(doc,'span','scene-brand-mark');mark.innerHTML=renderStadeMark();brand.insertBefore(mark,brand.firstChild);
 const nav=el(doc,'nav','scene-nav');nav.setAttribute('aria-label','Rumlige scener');
 for(const [id,definition]of Object.entries(SCENES)){const link=el(doc,'a','scene-nav-link',definition.name);link.setAttribute('href',id+'.html');if(id===sceneId)link.setAttribute('aria-current','page');nav.append(link);}
 const edition=el(doc,'span','scene-edition',sceneId==='aureol'?'LYS / FORM / NÆRVÆR':'RUM / STOF / PERSPEKTIV');
 header.append(brand,nav,edition);

 const hero=el(doc,'section','scene-hero');hero.setAttribute('aria-labelledby','scene-title');
 const atmosphere=el(doc,'div','scene-atmosphere');atmosphere.setAttribute('aria-hidden','true');
 atmosphere.append(el(doc,'div','ambient ambient-one'),el(doc,'div','ambient ambient-two'),el(doc,'div','ambient ambient-three'));
 const artwork=el(doc,'div','scene-art');artwork.setAttribute('aria-hidden','true');
 const stage=el(doc,'div','sculpture-stage');
 stage.innerHTML=sceneId==='aureol'?'<div class="aureol-shadow"></div><div class="aureol-veil" data-material="frost" aria-hidden="true"></div><div class="aureol-ring ring-back"></div><div class="aureol-ring ring-main"></div><div class="aureol-ring ring-highlight"></div><div class="aureol-sphere"></div><div class="aureol-tile" data-material="frost" aria-hidden="true"></div>':'<div class="orbital-plane"></div><div class="orbital-halo halo-back"></div><div class="obsidian-core"><div class="core-face core-face-one"></div><div class="core-face core-face-two"></div><div class="core-face core-face-three"></div><div class="core-face core-face-four"></div><div class="core-face core-face-five"></div></div><div class="orbital-halo halo-front"></div><div class="orbital-glass" data-material="frost" aria-hidden="true"></div><div class="orbital-beacon"></div>';
 artwork.append(stage);
 const copy=el(doc,'div','hero-copy');
 copy.append(el(doc,'p','scene-eyebrow',scene.eyebrow));
 const title=el(doc,'h1','scene-title');title.setAttribute('id','scene-title');
 scene.title.forEach((line,index)=>title.append(el(doc,'span',index?'title-second':'',line)));
 copy.append(title,el(doc,'p','scene-description',scene.description));
 const actions=el(doc,'div','hero-actions');
 const open=c('button',{text:scene.primary,variant:'primary',size:'large'});
 const controlsLink=c('button',{text:scene.secondary,variant:'ghost',size:'large',href:'#light-controls'});
 actions.append(open,controlsLink);copy.append(actions);
 const annotation=el(doc,'div','art-annotation');annotation.append(el(doc,'span','annotation-index',sceneId==='aureol'?'01 — OPAL':'07 — BRYDNING'),el(doc,'span','annotation-copy',sceneId==='aureol'?'Lys bliver til materiale.':'Et fast punkt i et åbent rum.'));
 hero.append(atmosphere,artwork,copy,annotation);

 const instrument=c('card',{variant:'frosted',slots:{header:'',body:'',footer:''}});instrument.className+=' scene-instrument';instrument.setAttribute('id','light-controls');instrument.setAttribute('aria-labelledby','instrument-title');
 const instrumentBody=el(doc,'div','instrument-body');
 const intro=el(doc,'div','instrument-intro');intro.append(el(doc,'p','scene-eyebrow',sceneId==='aureol'?'Dit lille lysværksted':'Observationsfelt'));
 const instrumentTitle=el(doc,'h2','instrument-title',sceneId==='aureol'?'Et rum. Dit lys.':'Skift dit perspektiv.');instrumentTitle.setAttribute('id','instrument-title');intro.append(instrumentTitle);
 const spaceButtons=el(doc,'div','space-buttons');spaceButtons.setAttribute('role','group');spaceButtons.setAttribute('aria-label','Vælg rum');
 const spaceControls=[];
 for(const [id,label]of scene.spaces){const button=c('button',{text:label,variant:'tertiary',size:'small',attrs:{'aria-pressed':String(id===state.space)}});spaceControls.push([id,button]);listen(button,'click',()=>setSpace(id));spaceButtons.append(button);}
 intro.append(spaceButtons);
 const adjust=el(doc,'div','instrument-adjust');
 const range=c('range-field',{idPrefix:'scene-light',label:'Lysstyrke',value:state.intensity,min:15,max:100,step:1,hint:'Ændrer lyset i installationen.'});
 const rangeBinding=mountRangeField(range,{onInput:({value})=>{state.intensity=value;applyLight();}});cleanups.push(()=>rangeBinding.destroy());
 adjust.append(range);
 const palette=el(doc,'div','instrument-palette');
 const themeField=c('field',{idPrefix:'scene-theme',label:'Tema',hint:'',controlVariant:'desktop',slots:{control:{tag:'select',children:sources.map(source=>({tag:'option',attrs:{value:source.id},text:source.name}))}}});
 const colorField=c('field',{idPrefix:'scene-color',label:'Farve',hint:'',controlVariant:'desktop',slots:{control:{tag:'select'}}});
 const themeSelect=themeField.querySelector('select'),colorSelect=colorField.querySelector('select');themeSelect.value=state.theme;
 listen(themeSelect,'change',()=>{state.theme=themeSelect.value;state.color=active().defaultMode;applyTheme();});
 listen(colorSelect,'change',()=>{state.color=colorSelect.value;applyTheme(false);});
 palette.append(themeField,colorField);instrumentBody.append(intro,adjust,palette);instrument.querySelector('.ds-card__body').replaceChildren(instrumentBody);

 const foot=el(doc,'footer','scene-footer');
 const status=el(doc,'p','scene-status',scene.spaces[0][2]);status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const note=el(doc,'p','scene-footnote','Et interaktivt materialestudie med Stade.');foot.append(status,note);
 const dialog=c('dialog',{idPrefix:'scene-observation',title:scene.detailTitle,describeBody:false,slots:{body:[{tag:'p',text:scene.detail}],footer:[{component:'button',options:{text:'Tilbage til rummet',variant:'primary',attrs:{'data-ds-close':''}}}]}});
 root.replaceChildren(skip,header,hero,instrument,foot,dialog);
 const dialogBinding=mountDialog(dialog,{trigger:open});cleanups.push(()=>dialogBinding.destroy());

 function applyLight(){
  root.style.setProperty('--scene-light',String(state.intensity/100));
  root.style.setProperty('--scene-light-scale',String(.8+state.intensity/250));
  root.style.setProperty('--scene-light-angle',(state.intensity/3-12)+'deg');
 }
 function setSpace(id){
  if(!scene.spaces.some(space=>space[0]===id))return;
  state.space=id;root.setAttribute('data-space',id);
  for(const [key,button]of spaceControls)button.setAttribute('aria-pressed',String(key===id));
  status.textContent=scene.spaces.find(space=>space[0]===id)[2];
  animation?.cancel();animation=animateThemed(stage,[{opacity:.45,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}]);
 }
 function applyTheme(rebuildColors=true){
  theme=resolveThemeMode(active(),state.color);
  brand.setAttribute('href','../../index.html?view=scenes&package='+state.theme);
  if(style)style.textContent=generateCSS(theme);
  if(rebuildColors){colorSelect.replaceChildren(...themeModeOptions(active()).map(({value,label})=>{const option=el(doc,'option','',label);option.setAttribute('value',value);return option;}));colorSelect.value=state.color;}
  root.setAttribute('data-color-scheme',active().modes?.[state.color]?.colorScheme??state.color);
  const scheme=active().modes?.[state.color]?.colorScheme??state.color;
  if(doc.documentElement)doc.documentElement.style.colorScheme=['light','dark'].includes(scheme)?scheme:'normal';
 }
 applyTheme();applyLight();
 return {state,setSpace,destroy(){animation?.cancel();for(const cleanup of cleanups)cleanup();root.replaceChildren();}};
}
