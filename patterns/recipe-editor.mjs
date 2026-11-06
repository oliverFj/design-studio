import {createComponentFactory,createLayout,mountDialog,mountRangeField} from '../core/components.mjs';
import {createHistoryState,createHistory} from './history.mjs';

const clone=value=>structuredClone(value);
const initialRecipes=()=>[
 {id:'layered',name:'Lagdelte flader',width:120,height:80,layers:[{id:'base',name:'Grundlag',thickness:8,inset:0},{id:'middle',name:'Mellemlag',thickness:5,inset:7},{id:'surface',name:'Overflade',thickness:3,inset:14}]},
 {id:'stepped',name:'Enkel aftrapning',width:120,height:80,layers:[{id:'base',name:'Grundlag',thickness:6,inset:0},{id:'middle',name:'Mellemlag',thickness:6,inset:10},{id:'surface',name:'Overflade',thickness:6,inset:20}]},
];

export function createRecipeEditorState(){
 const recipes=initialRecipes(),recipe=recipes[0];
 return {recipes,recipeId:recipe.id,history:createHistoryState(recipe),activeLayer:'surface',selectedIds:['surface'],selectionAnchor:'surface',drafts:{},errors:{},gesture:null,pendingRecipeId:null,
  placed:{id:'placed-copy',sourceId:recipe.id,recipe:clone(recipe)},message:''};
}

/** A neutral recipe workflow; product geometry, storage and placed copies remain product concerns. */
export function mountRecipeEditor(theme,{document=globalThis.document,state=createRecipeEditorState(),announce=()=>{},onChange=()=>{},onUse=()=>{},idPrefix='recipe-editor'}={}){
 const prefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-'),c=createComponentFactory(theme,{document});
 let history=createHistory(state.history),destroyed=false,finishingSwitch=false,parameterControllers=[];
 state.selectionAnchor??=state.activeLayer;
 const el=(tag,className='',text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const stack=(...nodes)=>{const node=c('stack',{variant:'compact'});node.replaceChildren(...nodes);return node;};
 const button=(text,action,variant='tertiary')=>c('button',{text,variant,size:'small',attrs:{'data-action':action}});
 const heading=text=>c('heading',{text,variant:'panel'});
 const hostCard=(title,content)=>{const node=c('card',{slots:{root:{tag:'section',children:[{tag:'div',part:'header',children:[{component:'heading',options:{text:title,variant:'panel'}}]},{tag:'div',part:'body',children:[]}]}}});node.querySelector('.ds-card__body').append(content);return node;};
 const root=createLayout('workspace',{document});root.className+=' ds-composition ds-scope composition-recipe-editor';root.setAttribute('role','region');root.setAttribute('aria-label','Opskriftseditor med lag og placeret kopi');
 const picker=c('field',{idPrefix:prefix+'-recipe',label:'Opskrift i biblioteket',hint:'',value:state.recipeId,controlVariant:'desktop',slots:{control:{tag:'select',children:state.recipes.map(recipe=>({tag:'option',attrs:{value:recipe.id},text:recipe.name}))}}});
 const select=picker.querySelector('select'),undo=button('Fortryd','undo'),redo=button('Gentag','redo'),save=button('Gem opskrift','save-recipe'),apply=button('Anvend på kopien','apply-copy','primary');
 const toolbar=el('div','composition-recipe-toolbar composition-actions');toolbar.append(undo,redo,save,apply);
 const saveStatus=c('text',{variant:'small',text:''}),selectionStatus=c('text',{variant:'small',text:''});
 const previews=el('div','composition-recipe-previews'),layers=el('div','composition-recipe-layers'),parameters=el('div','composition-recipe-parameters'),placed=el('div','composition-recipe-placed');
 const bulk=button('Øg valgte lag med 1','thicken-selection'),cancelDraft=button('Kassér ugyldige feltkladder','cancel-drafts','ghost');
 const layerPanel=hostCard('Lag og aktivt element',stack(c('text',{variant:'small',text:'Klik vælger og aktiverer et lag. Shift vælger et interval; Ctrl/⌘ tilføjer eller fjerner.'}),selectionStatus,layers,bulk));
 const dock=el('aside','composition-recipe-dock');dock.setAttribute('aria-label','Lag og parametre');dock.append(layerPanel,hostCard('Aktivt lags parametre',parameters));
 const main=el('div','composition-recipe-main');main.append(previews,hostCard('Placeret kopi',placed));
 const layout=el('div','composition-recipe-layout');layout.append(main,dock);
 const status=c('text',{text:state.message||'',variant:'small',attrs:{role:'status','aria-live':'polite'}});
 root.append(stack(heading('Fra opskrift til selvstændig kopi'),c('text',{text:'Visningerne følger samme opskrift. Gem opdaterer biblioteket; Anvend opdaterer kopien.',variant:'secondary'})),picker,toolbar,saveStatus,layout,status);
 const currentLayer=()=>history.value.layers.find(layer=>layer.id===state.activeLayer);
 const draftFor=layer=>state.drafts[layer.id]??{thickness:String(layer.thickness),inset:String(layer.inset)};
 const validParameter=(key,value)=>String(value).trim()!==''&&Number.isInteger(Number(value))&&Number(value)>=(key==='thickness'?1:0)&&Number(value)<=(key==='thickness'?16:30);
 const hasDrafts=()=>history.value.layers.some(layer=>Object.entries(draftFor(layer)).some(([key,value])=>!validParameter(key,value)));
 const dirty=()=>history.dirty||hasDrafts();
 const notify=text=>{state.message=text;status.textContent=text;announce(text);onChange(state);};
 const resetDrafts=()=>{state.drafts={};state.errors={};};
 const pendingChange=()=>state.gesture&&JSON.stringify(state.gesture.before)!==JSON.stringify(history.value);
 function finishGesture(emit=true){
  if(!state.gesture)return false;
  const {before,label}=state.gesture,after=history.value;state.gesture=null;
  // Preview changes the current candidate; only a completed gesture enters the shared history.
  state.history.present=before;const committed=history.commit(label,after);updateCommands();
  if(emit&&committed)onChange(state);return committed;
 }
 function updateCommands(){
  undo.disabled=(!history.canUndo&&!pendingChange())||hasDrafts();redo.disabled=!history.canRedo||Boolean(pendingChange())||hasDrafts();save.disabled=!dirty();cancelDraft.hidden=!hasDrafts();
  bulk.disabled=!state.selectedIds.length||hasDrafts();
  undo.setAttribute('title',history.undoLabel?'Fortryd: '+history.undoLabel:'Intet at fortryde');redo.setAttribute('title',history.redoLabel?'Gentag: '+history.redoLabel:'Intet at gentage');
  saveStatus.textContent=(hasDrafts()?'Ret den ugyldige feltkladde. Seneste gyldige opskrift vises. ':history.dirty?'Opskriften har ugemte ændringer. ':'Opskriften er ved gemmepunktet. ')+'Gem gælder kun denne session.';
 }
 function validateDrafts(){
  finishGesture();const value=history.value,errors={};
  for(const layer of value.layers){
   const draft=draftFor(layer),thickness=Number(draft.thickness),inset=Number(draft.inset),error={};
   if(!draft.thickness.trim()||!Number.isInteger(thickness)||thickness<1||thickness>16)error.thickness='Angiv en tykkelse i hele enheder fra 1 til 16.';
   if(!draft.inset.trim()||!Number.isInteger(inset)||inset<0||inset>30)error.inset='Angiv en indrykning i hele enheder fra 0 til 30.';
   if(Object.keys(error).length)errors[layer.id]=error;
  }
  state.errors=errors;
  if(Object.keys(errors).length){state.activeLayer=Object.keys(errors)[0];render();focusError();notify('Ret de markerede felter. Den validerede opskrift er bevaret.');return false;}
  return true;
 }
 function focusError(){(Array.from(parameters.querySelectorAll('.ds-range-field__number')).find(node=>node.getAttribute('aria-invalid')==='true')??parameters.querySelector('[aria-invalid="true"]'))?.focus();}
 function renderParameters(){
  parameterControllers.forEach(control=>control.destroy());parameterControllers=[];
  const layer=currentLayer(),draft=draftFor(layer),errors=state.errors[layer.id]||{};
  const parameter=(key,label,min,max)=>{
   const node=c('range-field',{variant:'with-input',idPrefix:prefix+'-'+key,label,hint:min+'–'+max+' hele enheder',value:layer[key],min,max,step:1,error:errors[key]||''});
   const controller=mountRangeField(node,{onInput:result=>{
    if(state.message){state.message='';status.textContent='';}
    state.drafts[layer.id]={...draftFor(layer),[key]:result.draft};state.errors[layer.id]={...state.errors[layer.id],[key]:result.valid?'':result.error};
    if(result.valid&&result.value!==history.value.layers.find(item=>item.id===layer.id)[key]){
     if(state.gesture&&(state.gesture.layerId!==layer.id||state.gesture.key!==key))finishGesture();
     state.gesture??={before:history.value,label:'Justér '+label.toLocaleLowerCase('da')+' på '+layer.name,layerId:layer.id,key};
     const value=history.value;value.layers.find(item=>item.id===layer.id)[key]=result.value;state.history.present=value;
     render(false);
    }else updateCommands();
    onChange(state);
   },onCommit:()=>finishGesture()});
   controller.update({draft:draft[key],error:errors[key]||''});parameterControllers.push(controller);
   node.querySelector('.ds-range-field__number').addEventListener('blur',()=>finishGesture());
   node.querySelector('.ds-range-field__control').addEventListener('pointerup',()=>finishGesture());
   return node;
  };
  const thickness=parameter('thickness','Tykkelse',1,16),inset=parameter('inset','Indrykning',0,30);
  parameters.replaceChildren(stack(c('badge',{text:'Aktivt: '+layer.name}),thickness,inset,c('text',{text:'Visningen følger gyldige ændringer live. Ét greb giver ét fortrydtrin.',variant:'small'}),cancelDraft));
 }
 const svgNode=(tag,attrs={})=>{const node=document.createElementNS?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node;};
 function drawView(cross){
  const recipe=history.value,name=cross?'Tværsnit':'Front',figure=el('figure','composition-recipe-view'),caption=el('figcaption','',name),total=recipe.layers.reduce((sum,layer)=>sum+layer.thickness,0);
  const view=cross?'section':'front';
  const svg=svgNode('svg',{viewBox:'0 0 240 '+(cross?Math.max(180,total*3+56):180),role:'group','aria-labelledby':prefix+'-'+view+'-title','data-recipe-view':view});
  const title=svgNode('title',{id:svg.getAttribute('aria-labelledby')});title.textContent=name+' af '+recipe.name+'. Aktivt lag: '+currentLayer().name+'. '+state.selectedIds.length+' lag valgt.';svg.append(title);
  let depth=28;
  recipe.layers.forEach((layer,index)=>{
   const active=layer.id===state.activeLayer,selected=state.selectedIds.includes(layer.id),inset=layer.inset*1.3;
   const group=svgNode('g',{id:prefix+'-'+view+'-layer-'+layer.id,role:'button',tabindex:'0','aria-label':layer.name+' · '+(selected?'valgt':'ikke valgt')+(active?' · aktivt lag':''),'aria-pressed':String(selected),'aria-current':String(active),'data-layer':layer.id,'data-active':String(active),'data-selected':String(selected),'data-thickness':layer.thickness,'data-inset':layer.inset});
   const rect=svgNode('rect',{x:42+inset,y:cross?depth:35+inset,width:recipe.width*1.3-inset*2,height:cross?layer.thickness*3:recipe.height*1.3-inset*2,fill:['var(--ds-color-background-surface)','var(--ds-color-background-subtle)','var(--ds-color-background-control)'][index%3],stroke:active?'var(--ds-color-focus)':selected?'var(--ds-color-action-primary-rest-surface)':'var(--ds-color-border-field)','stroke-width':active?3:1.5,...(selected&&!active?{'stroke-dasharray':'5 3'}:{})});
   group.addEventListener('click',event=>chooseLayer(layer.id,event,group.getAttribute('id')));
   group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();chooseLayer(layer.id,event,group.getAttribute('id'));}});
   group.append(rect);svg.append(group);depth+=layer.thickness*3;
  });
  figure.append(svg,caption);return figure;
 }
 function render(includeParameters=true){
  const focused=document.activeElement?.getAttribute?.('id'),value=history.value;
  select.value=state.recipeId;selectionStatus.textContent=state.selectedIds.length+' lag valgt · aktivt lag: '+currentLayer().name;
  layers.replaceChildren(...value.layers.map(layer=>{
   const row=el('div','composition-recipe-layer');row.setAttribute('data-layer-row',layer.id);
   const selected=state.selectedIds.includes(layer.id),active=layer.id===state.activeLayer;
   const activate=c('list-item',{idPrefix:prefix+'-layer-'+layer.id,text:layer.name,description:layer.thickness+' enheder · indrykning '+layer.inset,current:active,attrs:{id:prefix+'-activate-'+layer.id,'data-active-layer':layer.id,'aria-pressed':String(selected),'data-selected':String(selected)},slots:{trailing:[{component:'badge',options:{text:(active?'Aktivt · ':'')+(selected?'Valgt':'Ikke valgt'),variant:selected?'data':'neutral'}}]}});
   activate.addEventListener('click',event=>chooseLayer(layer.id,event,activate.getAttribute('id')));
   row.append(activate);return row;
  }));
  previews.replaceChildren(drawView(false),drawView(true));if(includeParameters)renderParameters();
  placed.replaceChildren(c('text',{text:state.placed.recipe.name+' · samlet tykkelse '+state.placed.recipe.layers.reduce((sum,layer)=>sum+layer.thickness,0)+' enheder'}));
  updateCommands();if(focused){const target=root.querySelector('#'+focused);if(target&&target!==document.activeElement)target.focus();}
 }
 function chooseLayer(id,event,focusId){
  finishGesture();
  const ids=history.value.layers.map(layer=>layer.id),selected=new Set(state.selectedIds);
  if(event.shiftKey){
   const anchor=ids.includes(state.selectionAnchor)?state.selectionAnchor:state.activeLayer;
   state.selectionAnchor=anchor;const first=ids.indexOf(anchor),last=ids.indexOf(id);
   state.selectedIds=ids.slice(Math.min(first,last),Math.max(first,last)+1);
  }else if(event.ctrlKey||event.metaKey){
   if(selected.has(id))selected.delete(id);else selected.add(id);
   state.selectedIds=ids.filter(value=>selected.has(value));state.selectionAnchor=id;
  }else{state.selectedIds=[id];state.selectionAnchor=id;}
  state.activeLayer=id;render();root.querySelector('#'+focusId)?.focus();notify(state.selectedIds.length+' lag valgt · '+currentLayer().name+' er aktivt.');
 }
 function saveRecipe(){
  const focused=document.activeElement;
  if(!validateDrafts())return false;
  const index=state.recipes.findIndex(recipe=>recipe.id===state.recipeId);state.recipes[index]=history.value;history.markSaved();render();if(focused===save&&save.disabled)apply.focus();notify('Opskriften er gemt i sessionen. Kopien er uændret.');return true;
 }
 undo.addEventListener('click',()=>travel('undo'));redo.addEventListener('click',()=>travel('redo'));save.addEventListener('click',saveRecipe);
 function travel(direction){
  finishGesture();
  if(hasDrafts()||!history[direction]())return false;
  const focused=document.activeElement;resetDrafts();render();
  if(focused===undo&&undo.disabled)(redo.disabled?parameters.querySelector('input'):redo)?.focus();
  else if(focused===redo&&redo.disabled)(undo.disabled?parameters.querySelector('input'):undo)?.focus();
  notify(direction==='undo'?'Ændringen er fortrudt.':'Ændringen er gentaget.');return true;
 }
 cancelDraft.addEventListener('click',()=>{finishGesture();resetDrafts();render();notify('Ugyldige kladder er kasseret. Opskriften er bevaret.');parameters.querySelector('.ds-range-field__number')?.focus();});
 bulk.addEventListener('click',()=>{
  finishGesture();if(hasDrafts()||!state.selectedIds.length)return;const value=history.value,selected=value.layers.filter(layer=>state.selectedIds.includes(layer.id));
  if(selected.some(layer=>layer.thickness+1>16)){notify('Et valgt lag kan ikke øges inden for grænsen på 16 enheder. Ingen lag er ændret.');return;}
  selected.forEach(layer=>layer.thickness+=1);history.commit('Øg valgte lag',value);render();notify(selected.length+' lag er ændret i ét fortrydtrin.');
 });
 apply.addEventListener('click',()=>{if(!validateDrafts())return;state.placed={id:state.placed.id,sourceId:state.recipeId,recipe:history.value};render();onUse(clone(state.placed));notify('Kopien er opdateret. Gemmepunktet er uændret.');});
 const switchDialog=c('dialog',{idPrefix:prefix+'-switch',title:'Gem ændringer før opskriftsskift?',describeBody:false,slots:{body:'Opskriften eller dens feltkladder er ændret. Vælg, hvad der skal ske med ændringerne.',footer:[]}});
 const dialogSave=button('Gem','save-and-switch','primary'),discard=button('Fortsæt uden','discard-and-switch'),stay=button('Bliv','stay','ghost');switchDialog.querySelector('.ds-dialog__footer').replaceChildren(dialogSave,discard,stay);root.append(switchDialog);
 const modal=mountDialog(switchDialog,{initialFocus:stay,onOpenChange:open=>{if(!open&&!finishingSwitch&&!destroyed&&state.pendingRecipeId){state.pendingRecipeId=null;select.focus();notify('Du bliver i opskriften. Kladderne er bevaret.');}}});
 function switchTo(id){
  const recipe=state.recipes.find(item=>item.id===id);state.recipeId=id;state.history=createHistoryState(recipe);history=createHistory(state.history);state.activeLayer=recipe.layers[0].id;state.selectedIds=[recipe.layers[0].id];state.selectionAnchor=recipe.layers[0].id;resetDrafts();state.pendingRecipeId=null;render();notify(recipe.name+' er åbnet. Den placerede kopi er uændret.');select.focus();
 }
 function closeSwitch(){finishingSwitch=true;modal.close();finishingSwitch=false;}
 select.addEventListener('change',()=>{
  finishGesture();const next=select.value;if(next===state.recipeId)return;
  if(dirty()){state.pendingRecipeId=next;select.value=state.recipeId;onChange(state);modal.open();}
  else switchTo(next);
 });
 stay.addEventListener('click',()=>{state.pendingRecipeId=null;closeSwitch();select.focus();notify('Du bliver i opskriften. Kladderne er bevaret.');});
 discard.addEventListener('click',()=>{const next=state.pendingRecipeId;if(!next)return;closeSwitch();switchTo(next);});
 dialogSave.addEventListener('click',()=>{const next=state.pendingRecipeId;if(!next)return;if(!saveRecipe()){state.pendingRecipeId=null;closeSwitch();focusError();return;}closeSwitch();switchTo(next);});
 const shortcut=event=>{
  if(event.defaultPrevented||event.altKey||!(event.ctrlKey||event.metaKey)||modal.opened)return;
  for(let target=event.target;target&&target!==root;target=target.parentNode)if(['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable)return;
  const key=event.key.toLowerCase(),direction=key==='z'?(event.shiftKey?'redo':'undo'):key==='y'&&event.ctrlKey?'redo':null;
  if(direction&&travel(direction))event.preventDefault();
 };
 root.addEventListener('keydown',shortcut);if(state.gesture)finishGesture(false);render();
 if(state.pendingRecipeId)Promise.resolve().then(()=>{if(!destroyed&&root.parentNode)modal.open();});
 return {element:root,state,get history(){return history;},destroy(){destroyed=true;finishGesture(false);parameterControllers.forEach(control=>control.destroy());modal.destroy();root.removeEventListener('keydown',shortcut);root.remove();}};
}
