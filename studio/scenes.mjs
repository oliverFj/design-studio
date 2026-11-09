import {createComponentFactory} from '../core/components.mjs';
import {mountBlogScene,mountShopScene} from './scenes/editorial-commerce.mjs';
import {mountEditorScene,mountOverviewScene} from './scenes/workspaces.mjs';

const CASES=Object.freeze({
 blog:{name:'Blog',label:'Historier og læsning',title:'Et magasin med noget på hjerte',description:'En redaktionel forside med artikler, kategorier og plads til fordybelse.',mount:mountBlogScene},
 shop:{name:'Webshop',label:'Produkter og kurv',title:'Fra fund til favorit',description:'En lille designbutik med produktvalg, antal og en samlet kurv.',mount:mountShopScene},
 editor:{name:'Editor',label:'Objekter og egenskaber',title:'Et rum under arbejde',description:'Et arbejdsredskab med objektvalg, egenskaber og en kladde, der følger med.',mount:mountEditorScene},
 overview:{name:'Overblik',label:'Projekter og data',title:'Det vigtigste samlet',description:'Et projektoverblik med søgning, status og detaljer om det aktuelle arbejde.',mount:mountOverviewScene},
});

export const createSceneState=()=>({selected:'blog',drafts:{}});

/** The platform owns theme selection; each case owns its independent draft. */
export function mountSceneGallery(theme,{document=globalThis.document,state=createSceneState(),announce=()=>{},idPrefix='use-scenes'}={}){
 const c=createComponentFactory(theme,{document});
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const prefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
 if(!Object.hasOwn(CASES,state.selected))state.selected='blog';
 state.drafts||={};
 const root=el('div','use-scenes ds-scope');
 const choices=el('div','use-scene-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','Vælg brugsscene');
 const buttons=new Map();
 for(const [id,item]of Object.entries(CASES)){
  const button=c('button',{text:item.name,variant:'tertiary',size:'large',attrs:{'data-use-scene':id,'aria-pressed':String(state.selected===id),'aria-controls':prefix+'-preview'}});
  button.className+=' use-scene-choice';
  const label=el('span','use-scene-choice-copy');label.append(el('strong','',item.name),el('span','',item.label));button.replaceChildren(label);
  button.addEventListener('click',()=>choose(id));buttons.set(id,button);choices.append(button);
 }
 const content=el('section','use-scene-content');content.setAttribute('id',prefix+'-preview');content.setAttribute('aria-labelledby',prefix+'-title');
 const studies=el('section','use-scene-studies');studies.setAttribute('aria-labelledby',prefix+'-studies');
 const studyIntro=el('div');
 studyIntro.append(c('heading',{variant:'panel',slots:{root:{tag:'h2',text:'Materialestudier'}},attrs:{id:prefix+'-studies'}}),el('p','','Giv lys, frost og rumlighed hele scenen i de to særlige studier.'));
 const studyLinks=el('div','use-scene-study-links');
 for(const [id,name]of [['aureol','Aureol'],['obsidian','Obsidian']]){
  const link=c('button',{variant:'secondary',href:'./examples/scenes/'+id+'.html',text:name+' ↗'});
  link.setAttribute('target','_blank');link.setAttribute('rel','noopener');link.setAttribute('aria-label','Åbn '+name+' i en ny fane');studyLinks.append(link);
 }
 studies.append(studyIntro,studyLinks);root.append(choices,content,studies);
 let mounted,active=false;
 function render(){
  mounted?.destroy();
  const id=state.selected,item=CASES[id];
  for(const [key,button]of buttons)button.setAttribute('aria-pressed',String(key===id));
  const intro=el('header','use-scene-intro');
  const copy=el('div');copy.append(el('p','use-scene-eyebrow',item.name+' · Demo'),c('heading',{variant:'panel',slots:{root:{tag:'h2',text:item.title}},attrs:{id:prefix+'-title'}}),el('p','',item.description));
  const reset=c('button',{variant:'ghost',size:'small',text:'Nulstil scene',attrs:{'data-reset-use-scene':''}});
  reset.addEventListener('click',()=>{state.drafts[id]={};render();content.querySelector('[data-reset-use-scene]').focus();announce(item.name+' er nulstillet.');});
  intro.append(copy,reset);
  mounted=item.mount(theme,{document,state:state.drafts[id]||={},idPrefix:prefix+'-'+id,announce});
  const stage=el('div','use-scene-stage');stage.setAttribute('data-case-preview',id);stage.append(mounted.element);
  content.replaceChildren(intro,stage);
  if(active)mounted.activate?.();
 }
 function choose(id){
  if(state.selected===id||!Object.hasOwn(CASES,id))return;
  state.selected=id;render();buttons.get(id).focus();announce(CASES[id].name+' vises.');
 }
 render();
 return {element:root,state,activate(){if(active)return;active=true;mounted.activate?.();},destroy(){active=false;mounted?.destroy();root.remove();}};
}
