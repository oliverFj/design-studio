import {getComponents, brandAssetDataURL} from './engine.mjs';
export { createLayout, generateAppShellCSS } from './layout.mjs';
export { mountPanelControls } from './panels.mjs';
import {COMPONENT_LIBRARY, canonicalComponentId, canonicalVariantId, canonicalStateId, canonicalPartId} from './library.mjs';

const tags=new Set(['div','span','p','strong','label','button','input','select','option','h1','h2','h3','h4','h5','h6','hr','section','article','header','footer','dialog','textarea','ul','li','img','dl','dt','dd']);
const inputTypes=new Set(['button','submit','reset','text','email','number','password','checkbox','radio','search','tel','url','range','color','date']);
const booleans=new Set(['disabled','checked','selected','multiple','required','readOnly','readonly','hidden','open']);
const voidTags=new Set(['input','hr','img']);
const safeAttribute=name=>booleans.has(name)||['id','for','name','type','value','placeholder','min','max','step','rows','cols','autocomplete','role','title','tabindex','draggable'].includes(name)||/^aria-[a-z-]+$/.test(name)||/^data-[a-z-]+$/.test(name);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sequence=0;
function attributes(attrs={}){
 const result={};
 for(const [key,value]of Object.entries(attrs)){
  if(!safeAttribute(key))throw new Error('Unsupported component attribute: '+key);
  if(key==='type'&&!inputTypes.has(value))throw new Error('Unsupported native input type: '+value);
  if(key==='draggable'){if(![true,false,'true','false'].includes(value))throw new Error('Boolean draggable attribute required.');result[key]=String(value);}
  else if(booleans.has(key)){if(typeof value!=='boolean')throw new Error('Boolean component attribute required: '+key);if(value)result[key==='readOnly'?'readonly':key]=true;}
  else {if(!['string','number'].includes(typeof value))throw new Error('Text component attribute required: '+key);result[key]=String(value);}
 }
 return result;
}
function prefix(options){return String(options.idPrefix??'ds-component-'+(++sequence)).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100)||'ds-component-'+(++sequence);}
function model(pack,id,options,components,depth=0){
 if(depth>12)throw new Error('Component composition exceeds maximum depth 12.');
 if(pack.schemaVersion===2)id=canonicalComponentId(id);
 const component=components[id];if(!component)throw new Error('Unknown shared component: '+id);
 if(options.controlVariant!==undefined&&(!['field','choice-field'].includes(id)||options.controlVariant!=='desktop'))throw new Error('Unsupported control variant: '+options.controlVariant);
 let iconAsset;
 if(id==='action-button'&&options.iconAssetId!==undefined){iconAsset=pack.brand?.assets?.find(asset=>asset.id===options.iconAssetId);if(!iconAsset||!iconAsset.mimeType.startsWith('image/'))throw new Error('Unknown approved icon image asset: '+options.iconAssetId);}
 const identifier=prefix(options), slots=Object.fromEntries(Object.entries(options.slots??{}).map(([key,value])=>[pack.schemaVersion===2?canonicalPartId(id,key):key,value]));
 if(id==='action-button'){if(options.icon!==undefined)slots.icon=options.icon;if(options.shortcut!==undefined)slots.shortcut=String(options.shortcut);}
 if(id==='brand-mark'&&pack.brand?.logos?.length){
  const logo=options.logoId?pack.brand.logos.find(logo=>logo.id===options.logoId):pack.brand.logos[0];
  if(!logo)throw new Error('Unknown approved brand logo: '+options.logoId);
  const asset=pack.brand.assets.find(asset=>asset.id===logo.asset);
  return {tag:'div',attrs:{class:component.parts.root.selector.slice(1)},children:[{tag:'img',attrs:{class:'ds-brand-mark__asset',src:brandAssetDataURL(asset),alt:logo.name},children:[]}]};
 }
 let variant=options.variant??component.preview?.variant??['default','primary','neutral','horizontal'].find(key=>Object.hasOwn(component.variants,key));
 if(pack.schemaVersion===2&&variant)variant=canonicalVariantId(id,variant);
 if(variant&&!Object.hasOwn(component.variants,variant))throw new Error('Unknown component variant: '+id+'.'+variant);
 if(options.error&&['field','choice-field'].includes(id))variant='invalid';
 const hasError=['field','choice-field'].includes(id)&&(Boolean(options.error)||variant==='invalid');
 const hasHint=options.hint!=='';
 function visit(source,root=false,slotApplied=false,nodeDepth=0){
  if(nodeDepth>12)throw new Error('Component tree exceeds maximum depth 12.');
  if(typeof source==='string')return {tag:'span',text:source,attrs:{},children:[]};
  if(source?.component){
   const composed=model(pack,source.component,source.options??{},components,depth+1);
   if(source.part){if(!Object.hasOwn(component.parts,source.part))throw new Error('Unknown composition part: '+id+'.'+source.part);composed.attrs.class+=' '+component.parts[source.part].selector.slice(1);}
   return composed;
  }
  if(!source||typeof source!=='object'||Array.isArray(source))throw new Error('Expected a declarative component node.');
  let node=structuredClone(source);
  if(!tags.has(node.tag))throw new Error('Unsupported component tag: '+node.tag);
  if(node.part&&!Object.hasOwn(component.parts,node.part))throw new Error('Unknown component part: '+id+'.'+node.part);
  const part=node.part;
  if(!slotApplied&&part&&Object.hasOwn(slots,part)){
   const slot=slots[part];
   if(typeof slot==='string'){node.text=slot;delete node.children;}
   else if(Array.isArray(slot)||slot?.component){node.children=Array.isArray(slot)?slot:[slot];delete node.text;if(node.tag==='p'||/^h[1-6]$/.test(node.tag))node.tag='div';}
   else if(slot&&typeof slot==='object'){node={...slot,part};}
   else throw new Error('Expected text or declarative nodes in component slot '+part);
  }
  if(!tags.has(node.tag))throw new Error('Unsupported component tag: '+node.tag);
  if(root&&options.text!==undefined&&id!=='action-button'){node.text=String(options.text);delete node.children;}
  const attrs=attributes({...node.attrs,...(root?options.attrs:{})});
  if(part)attrs.class=component.parts[part].selector.slice(1);
  if(root&&variant)attrs['data-variant']=variant;
  if(!root&&node.variant)attrs['data-variant']=node.variant;
  if(root&&options.state){const states=(Array.isArray(options.state)?options.state:[options.state]).map(state=>pack.schemaVersion===2?canonicalStateId(id,state):state);for(const state of states)if(!Object.hasOwn(component.states,state))throw new Error('Unknown component state: '+state);if(id!=='tree'){attrs['data-state']=states.join(' ');if(states.includes('selected'))attrs['aria-selected']='true';if(states.includes('pressed'))attrs['aria-pressed']='true';if(states.includes('expanded'))attrs['aria-expanded']='true';if(states.includes('loading'))attrs['aria-busy']='true';}}
  const nativeControl=['input','select','textarea'].includes(node.tag);
  if(nativeControl){
   for(const key of ['name','value','placeholder','type','min','max','step'])if(options[key]!==undefined)Object.assign(attrs,attributes({[key]:String(options[key])}));
   for(const key of ['disabled','checked','required','readOnly'])if(options[key]!==undefined){const attribute=key==='readOnly'?'readonly':key;if(options[key])attrs[attribute]=true;else delete attrs[attribute];}
  }
  if(node.tag==='button'){
   attrs.type??='button';
   if(options.disabled!==undefined){if(options.disabled)attrs.disabled=true;else delete attrs.disabled;}
  }
  if(id!=='tree'&&(nativeControl||node.tag==='button')&&(Array.isArray(options.state)?options.state:[options.state]).includes('disabled'))attrs.disabled=true;
  if(root&&options.disabled)attrs['aria-disabled']='true';
  if(id==='action-button'&&part==='label'&&(options.label!==undefined||options.text!==undefined))node.text=String(options.label??options.text);
  if(id==='action-button'&&['icon','shortcut'].includes(part)&&(Object.hasOwn(options,'label')||Object.hasOwn(options,'text'))&&!Object.hasOwn(options,part)&&!Object.hasOwn(slots,part)&&!(part==='icon'&&iconAsset)){attrs.hidden=true;delete node.text;delete node.children;}
  if(id==='action-button'&&part==='shortcut'&&node.text===''&&!node.children?.length)attrs.hidden=true;
  if(root&&id==='action-button'&&options.pressed!==undefined){attrs['aria-pressed']=String(Boolean(options.pressed));attrs['data-state']=options.pressed?'pressed':'idle';}
  if(root&&id==='action-button'&&variant==='icon-only')attrs['aria-label']??=String(options.label??options.text??'Tilføj');
  if(root&&id==='action-button'&&options.shortcut)attrs['aria-keyshortcuts']??=String(options.shortcut);
  if(part==='value'&&id==='range-field'&&options.value!==undefined)node.text=String(options.value);
  if(['field','range-field','choice-field'].includes(id)){
   if(part==='label'){attrs.for=identifier+'-control';if(options.label!==undefined)node.text=String(options.label);}
   if(part==='control'){
    attrs.id=identifier+'-control';
    if(options.controlVariant){
     if(!['input','select'].includes(node.tag))throw new Error('Desktop field controls require a native input or select.');
     attrs['data-variant']=options.controlVariant;
    }
    const described=[];if(component.parts.hint&&hasHint)described.push(identifier+'-hint');if(hasError)described.push(identifier+'-error');
    if(described.length)attrs['aria-describedby']=described.join(' ');
    if(hasError)attrs['aria-invalid']='true';
   }
   if(part==='hint'){attrs.id=identifier+'-hint';if(options.hint!==undefined)node.text=String(options.hint);if(!hasHint)attrs.hidden=true;}
   if(part==='error'){attrs.id=identifier+'-error';if(options.error!==undefined)node.text=String(options.error);if(!hasError)attrs.hidden=true;}
  }
  if(['checkbox','radio','switch'].includes(id)&&part==='label'&&options.label!==undefined)node.text=String(options.label);
  if(id==='dialog'&&part==='title')attrs.id=identifier+'-title';
  if(id==='dialog'&&part==='body')attrs.id=identifier+'-body';
  if(id==='alert'&&root)attrs.role=options.role??(variant==='danger'?'alert':'status');
  if(id==='tooltip'&&root){attrs.role='tooltip';attrs.id=identifier+'-tooltip';}
  if(id==='switch'&&part==='control')attrs.role='switch';
  let children=(node.children??[]).map(child=>visit(child,false,false,nodeDepth+1));
  if(id==='action-button'&&part==='icon'&&iconAsset){delete node.text;children=[{tag:'img',attrs:{class:'ds-action-button__asset',src:brandAssetDataURL(iconAsset),alt:''},children:[]}];}
  if(node.tag==='select'&&options.value!==undefined)for(const child of children)if(child.tag==='option'&&(child.attrs.value??child.text)===String(options.value))child.attrs.selected=true;
  if(voidTags.has(node.tag)&&(node.text!==undefined||children.length))throw new Error('Native void control cannot have children.');
  return {tag:node.tag,attrs,text:node.text,children};
 }
 const tree=visit(component.preview??COMPONENT_LIBRARY[canonicalComponentId(id)]?.preview,true);
 if(id==='tree'&&options.state){const item=tree.children?.[0],states=Array.isArray(options.state)?options.state:[options.state];if(item){item.attrs['data-state']=states.join(' ');for(const state of ['selected','expanded','disabled'])if(states.includes(state))item.attrs['aria-'+state]='true';if(states.includes('disabled'))for(const child of item.children?.[0]?.children??[])if(child.tag==='button'){if(child.attrs.class===component.parts.label.selector.slice(1))child.attrs.disabled=true;else child.attrs['aria-disabled']='false';}}}
 if(id==='dialog')return {tag:'dialog',attrs:{class:'ds-dialog-host','aria-labelledby':identifier+'-title','aria-describedby':identifier+'-body',...(options.open?{open:true}:{})},children:[tree]};
 return tree;
}
function serialize(node){
 const attrs=Object.entries(node.attrs??{}).map(([key,value])=>value===true?' '+key:' '+key+'="'+escape(value)+'"').join('');
 return '<'+node.tag+attrs+'>'+(voidTags.has(node.tag)?'':(node.text===undefined?'':escape(node.text))+(node.children??[]).map(serialize).join('')+'</'+node.tag+'>');
}
/** Safe HTML from the same shared declarative implementation used by createComponent.
 * options: variant, state, idPrefix, text, slots, attrs and native control values.
 * field/choice-field accept controlVariant: 'desktop' independently of validation state.
 * slots accept escaped text, declarative nodes, arrays or {component, options}.
 * Dialog returns a native dialog host: call showModal()/close() in the product.
 */
export function renderComponent(pack,id,options={}) {return serialize(model(pack,id,options,getComponents(pack)));}
/** Build native DOM without innerHTML. Attach product event handlers to the returned node. */
export function createComponent(pack,id,options={}, {document=globalThis.document}={}) {
 if(!document?.createElement)throw new Error('createComponent requires a DOM document.');
 return createNative(model(pack,id,options,getComponents(pack)),document);
}
/** Build a product screen from one validated theme snapshot. Recreate after theme edits. */
export function createComponentFactory(pack,{document=globalThis.document}={}) {
 if(!document?.createElement)throw new Error('createComponentFactory requires a DOM document.');
 const snapshot=structuredClone(pack),components=getComponents(snapshot);
 return (id,options={})=>createNative(model(snapshot,id,options,components),document);
}
function createNative(tree,document) {
 function create(node){
  const element=document.createElement(node.tag);
  for(const [name,value]of Object.entries(node.attrs??{}))element.setAttribute(name,value===true?'':value);
  if(node.text!==undefined)element.appendChild(document.createTextNode(String(node.text)));
  for(const child of node.children??[])element.appendChild(create(child));
  if(node.attrs?.value!==undefined&&'value' in element)element.value=node.attrs.value;
  return element;
 }
 return create(tree);
}

/** Controlled hierarchical list. Product callbacks own selection, expansion,
 * context menus and accepted moves; keyed updates keep native controls alive.
 * Row actions are independent of item.disabled (which blocks selection/drag).
 */
export function mountTree(pack,host,options={}, {document=globalThis.document}={}){
 if(!document?.createElement||!host?.appendChild)throw new Error('mountTree requires a DOM host and document.');
 const component=getComponents(pack).tree;if(!component)throw new Error('The theme does not provide the shared tree component.');
 const element=document.createElement('ul'),identifier=prefix(options),records=new Map(),listeners=[];
 let config={},flat=[],visible=[],focusedId=null,anchorId=null,dragIds=[],dropId=null,dropPosition=null,typeText='',typeAt=0,nodeSequence=0,destroyed=false;
 const part=(tag,name)=>{const node=document.createElement(tag);node.setAttribute('class',component.parts[name].selector.slice(1));return node;};
 const attr=(node,name,value)=>{if(value===null||value===undefined)node.removeAttribute(name);else node.setAttribute(name,String(value));};
 const hidden=(node,value)=>{node.hidden=Boolean(value);if(value)node.setAttribute('hidden','');else node.removeAttribute('hidden');};
 const listen=(node,type,handler)=>{node.addEventListener(type,handler);listeners.push([node,type,handler]);};
 const unlisten=node=>{for(let i=listeners.length-1;i>=0;i--)if(listeners[i][0]===node){node.removeEventListener(listeners[i][1],listeners[i][2]);listeners.splice(i,1);}};
 const selected=()=>new Set(config.selectedIds??[]),expanded=()=>new Set(config.expandedIds??[]);
 const navigable=record=>!record.item.disabled||record.item.children?.length||record.item.actions?.some(action=>!action.disabled);
 const rowFor=node=>{while(node&&node!==element){const id=node.getAttribute?.('data-tree-id');if(id&&records.has(id))return records.get(id);node=node.parentNode;}return null;};
 function applyStops(){for(const record of records.values()){const active=record.id===focusedId&&visible.includes(record)&&navigable(record);attr(record.li,'tabindex',active?'0':'-1');for(const [id,button]of record.actionNodes)attr(button,'tabindex',active&&!record.item.actions.find(action=>action.id===id)?.disabled?'0':'-1');}attr(element,'tabindex',visible.some(navigable)?null:'0');}
 function focus(record){if(!record||!visible.includes(record)||!navigable(record))return;focusedId=record.id;applyStops();record.li.focus();}
 function propose(record,event,{toggle=false,range=false,fromId=null}={}){
  if(record.item.disabled)return;
  const multi=config.multiSelect!==false,ids=selected();
  if(multi&&range){const candidates=visible.filter(record=>!record.item.disabled),anchor=[anchorId,...ids,fromId,record.id].find(id=>candidates.some(record=>record.id===id)),first=candidates.findIndex(record=>record.id===anchor),last=candidates.indexOf(record);if(last<0)return;anchorId=anchor;ids.clear();for(const candidate of candidates.slice(Math.min(first,last),Math.max(first,last)+1))ids.add(candidate.id);}
  else if(multi&&toggle){ids.has(record.id)?ids.delete(record.id):ids.add(record.id);anchorId=record.id;}
  else{ids.clear();ids.add(record.id);anchorId=record.id;}
  config.onSelect?.([...ids],{id:record.id,item:record.item,event,toggle:multi&&toggle,range:multi&&range});
 }
 function toggle(record,event,value=!expanded().has(record.id)){if(record.item.children?.length)config.onToggle?.(record.id,value,{item:record.item,event});}
 function context(record,event){event.preventDefault();config.onContextMenu?.(record.id,{item:record.item,event,selectedIds:[...selected()]});}
 function clearDrop(){dropId=null;dropPosition=null;for(const record of records.values()){attr(record.li,'data-drop-position',null);paint(record);}}
 function paint(record){const states=[...(selected().has(record.id)?['selected']:[]),...(expanded().has(record.id)&&record.item.children?.length?['expanded']:[]),...(record.item.disabled?['disabled']:[]),...(dropId===record.id?['drop-target']:[])];attr(record.li,'data-state',states.length?states.join(' '):null);}
 function dropAt(record,event){
  if(!dragIds.length||record.item.disabled)return null;
  if(dragIds.some(id=>id===record.id||record.ancestors.includes(id)))return null;
  const target=record.item.dropTarget===true?{inside:true}:record.item.dropTarget;if(!target||typeof target!=='object')return null;
  const rect=record.row.getBoundingClientRect(),fraction=rect.height?(event.clientY-rect.top)/rect.height:.5;
  return fraction<.25&&target.before?'before':fraction>.75&&target.after?'after':target.inside?'inside':fraction<.5&&target.before?'before':target.after?'after':target.before?'before':null;
 }
 function createRecord(id){
  const li=part('li','item'),row=part('div','row'),fold=part('button','toggle'),spacer=part('span','spacer'),label=part('button','label'),icon=part('span','icon'),name=part('span','name'),meta=part('span','meta'),badge=part('span','badge'),actions=part('span','actions'),group=part('ul','group');
  const record={id,li,row,fold,spacer,label,icon,name,meta,badge,actions,group,actionNodes:new Map()};records.set(id,record);
  attr(li,'role','treeitem');attr(li,'data-tree-id',id);attr(li,'id',identifier+'-item-'+(++nodeSequence));attr(group,'role','group');attr(fold,'type','button');attr(fold,'tabindex','-1');attr(fold,'aria-disabled','false');attr(label,'type','button');attr(label,'tabindex','-1');attr(icon,'aria-hidden','true');attr(spacer,'aria-hidden','true');
  attr(name,'id',li.getAttribute('id')+'-name');attr(meta,'id',li.getAttribute('id')+'-meta');attr(li,'aria-labelledby',name.getAttribute('id'));
  label.appendChild(icon);label.appendChild(name);for(const child of [fold,spacer,label,meta,badge,actions])row.appendChild(child);li.appendChild(row);li.appendChild(group);
  listen(label,'click',event=>{event.stopPropagation();focus(record);propose(record,event,{toggle:Boolean(event.ctrlKey||event.metaKey),range:Boolean(event.shiftKey)});});
  listen(row,'click',event=>{if(event.target===row||event.target===meta||event.target===badge||event.target===spacer){focus(record);propose(record,event,{toggle:Boolean(event.ctrlKey||event.metaKey),range:Boolean(event.shiftKey)});}});
  listen(fold,'click',event=>{event.stopPropagation();focus(record);toggle(record,event);});
  listen(row,'dragstart',event=>{
   if(record.item.disabled||!record.item.draggable){event.preventDefault();return;}
   const candidates=selected().has(record.id)?flat.filter(record=>selected().has(record.id)&&record.item.draggable&&!record.item.disabled):[record],ids=new Set(candidates.map(record=>record.id));dragIds=candidates.filter(record=>!record.ancestors.some(id=>ids.has(id))).map(record=>record.id);
   if(!dragIds.length){event.preventDefault();return;}event.stopPropagation();if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-design-studio-tree',JSON.stringify({tree:identifier,ids:dragIds}));event.dataTransfer.setData('text/plain',dragIds.join('\n'));}
  });
  listen(row,'dragover',event=>{const position=dropAt(record,event);if(!position)return;event.preventDefault();event.stopPropagation();if(event.dataTransfer)event.dataTransfer.dropEffect='move';if(dropId!==record.id||dropPosition!==position){clearDrop();dropId=record.id;dropPosition=position;attr(li,'data-drop-position',position);paint(record);}});
  listen(row,'dragleave',event=>{if(!row.contains(event.relatedTarget)&&dropId===record.id)clearDrop();});
  listen(row,'drop',event=>{const position=dropAt(record,event);if(!position)return;event.preventDefault();event.stopPropagation();const ids=[...dragIds];dragIds=[];clearDrop();config.onMove?.(ids,record.id,{position,event});});
  listen(row,'dragend',()=>{dragIds=[];clearDrop();});return record;
 }
 function updateRecord(record,item,ancestors,index,size){
  record.item=item;record.ancestors=ancestors;record.parentId=ancestors.at(-1)??null;
  const branch=Boolean(item.children?.length),open=branch&&expanded().has(item.id);attr(record.li,'aria-level',ancestors.length+1);attr(record.li,'aria-posinset',index+1);attr(record.li,'aria-setsize',size);attr(record.li,'aria-selected',selected().has(item.id));attr(record.li,'aria-disabled',item.disabled?'true':null);attr(record.li,'aria-expanded',branch?String(open):null);
  hidden(record.fold,!branch);hidden(record.spacer,branch);hidden(record.group,!open);attr(record.fold,'aria-label',(open?'Luk ':'Åbn ')+item.label);record.fold.textContent=open?'▾':'▸';record.name.textContent=item.label;record.icon.textContent=item.icon??'';hidden(record.icon,item.icon===undefined||item.icon==='');record.meta.textContent=item.meta??'';hidden(record.meta,item.meta===undefined||item.meta==='');record.badge.textContent=item.badge??'';hidden(record.badge,item.badge===undefined||item.badge==='');attr(record.li,'aria-describedby',item.meta===undefined||item.meta===''?null:record.meta.getAttribute('id'));record.label.disabled=Boolean(item.disabled);attr(record.label,'aria-disabled',String(Boolean(item.disabled)));attr(record.row,'draggable',String(Boolean(item.draggable&&!item.disabled)));
  const wanted=new Set((item.actions??[]).map(action=>action.id));
  for(const [id,button]of record.actionNodes)if(!wanted.has(id)){unlisten(button);button.remove();record.actionNodes.delete(id);}
  let cursor=record.actions.firstChild;
  for(const action of item.actions??[]){let button=record.actionNodes.get(action.id);if(!button){button=part('button','action');attr(button,'type','button');record.actionNodes.set(action.id,button);listen(button,'click',event=>{event.stopPropagation();const current=record.item.actions?.find(action=>action.id===button.getAttribute('data-tree-action'));if(!current||current.disabled)return;config.onAction?.(record.id,current.id,{item:record.item,event});});}attr(button,'data-tree-action',action.id);attr(button,'aria-label',action.label);attr(button,'title',action.label);attr(button,'aria-pressed',action.pressed===undefined?null:String(Boolean(action.pressed)));attr(button,'aria-disabled',String(Boolean(action.disabled)));button.disabled=Boolean(action.disabled);button.textContent=action.icon??action.label;if(button!==cursor)record.actions.insertBefore(button,cursor);cursor=button.nextSibling;}
  hidden(record.actions,!wanted.size);paint(record);
 }
 function validateItems(items){
  if(!Array.isArray(items))throw new Error('Tree items must be an array.');const seen=new Set();let count=0;
  const visit=(items,depth=0)=>{if(depth>64)throw new Error('Tree exceeds 64 levels.');for(const item of items){if(!item||typeof item.id!=='string'||!item.id||item.id.length>200||seen.has(item.id)||typeof item.label!=='string')throw new Error('Tree items need unique text ids and labels.');seen.add(item.id);if(++count>5000)throw new Error('Tree exceeds 5000 items.');for(const key of ['icon','meta','badge'])if(item[key]!==undefined&&!['string','number'].includes(typeof item[key]))throw new Error('Tree '+key+' must be text.');if(item.actions!==undefined&&!Array.isArray(item.actions))throw new Error('Tree actions must be an array.');const actions=new Set();for(const action of item.actions??[]){if(!action||typeof action.id!=='string'||!action.id||actions.has(action.id)||typeof action.label!=='string')throw new Error('Tree actions need unique ids and labels.');actions.add(action.id);}if(item.children!==undefined){if(!Array.isArray(item.children))throw new Error('Tree children must be an array.');visit(item.children,depth+1);}}};visit(items);return seen;
 }
 function update(next={}){
  if(destroyed)throw new Error('The tree has been destroyed.');
  const candidate={...config,...next},items=candidate.items??[],ids=validateItems(items);if(!Object.hasOwn(component.variants,candidate.variant??'default'))throw new Error('Unknown tree variant.');config=candidate;
  const previousActive=document.activeElement,hadTreeFocus=element.contains(previousActive),previousFocus=records.get(focusedId),known=new Set();flat=[];
  attr(element,'class',component.parts.root.selector.slice(1));attr(element,'role','tree');attr(element,'aria-label',config.label??'Hierarkisk liste');attr(element,'aria-multiselectable',String(config.multiSelect!==false));attr(element,'data-variant',config.variant??'default');
  function reconcile(parent,items,ancestors=[]){let cursor=parent.firstChild;const branches=[];for(const [index,item]of items.entries()){const record=records.get(item.id)??createRecord(item.id);known.add(item.id);updateRecord(record,item,ancestors,index,items.length);if(record.li!==cursor)parent.insertBefore(record.li,cursor);cursor=record.li.nextSibling;branches.push([record,item]);}while(cursor){const next=cursor.nextSibling;parent.removeChild(cursor);cursor=next;}for(const [record,item]of branches){flat.push(record);reconcile(record.group,item.children??[],[...ancestors,item.id]);}}
  reconcile(element,items);
  for(const [id,record]of records)if(!known.has(id)){for(const node of [record.row,record.fold,record.label,...record.actionNodes.values()])unlisten(node);record.li.remove();records.delete(id);}
  if(dragIds.some(id=>!known.has(id))){dragIds=[];clearDrop();}
  const open=expanded();visible=flat.filter(record=>record.ancestors.every(id=>open.has(id)));
  if(!records.has(focusedId)||!visible.includes(records.get(focusedId))||!navigable(records.get(focusedId))){focusedId=previousFocus?.ancestors.slice().reverse().find(id=>visible.includes(records.get(id))&&navigable(records.get(id)))??visible.find(record=>selected().has(record.id)&&navigable(record))?.id??visible.find(navigable)?.id??null;}
  if(!ids.has(anchorId))anchorId=null;applyStops();
  if(previousActive&&element.contains(previousActive)){const record=rowFor(previousActive);if(record&&!visible.includes(record))records.get(focusedId)?.li.focus();else if(document.activeElement!==previousActive)previousActive.focus?.({preventScroll:true});}
  else if(hadTreeFocus&&focusedId)records.get(focusedId)?.li.focus();
  return api;
 }
 listen(element,'focusin',event=>{const record=rowFor(event.target);if(record&&visible.includes(record)&&navigable(record)){focusedId=record.id;applyStops();}});
 listen(element,'contextmenu',event=>{const record=rowFor(event.target);if(record)context(record,event);});
 listen(element,'keydown',event=>{
  const record=rowFor(event.target);if(!record)return;
  if(event.key==='ContextMenu'||event.key==='F10'&&event.shiftKey){context(record,event);return;}
  if(event.target!==record.li)return;
  const candidates=visible.filter(navigable),index=candidates.indexOf(record);let target=null;
  if(event.key==='ArrowDown')target=candidates[Math.min(candidates.length-1,index+1)];else if(event.key==='ArrowUp')target=candidates[Math.max(0,index-1)];else if(event.key==='Home')target=candidates[0];else if(event.key==='End')target=candidates.at(-1);
  else if(event.key==='ArrowRight'){event.preventDefault();if(record.item.children?.length){if(!expanded().has(record.id))toggle(record,event,true);else target=candidates.find(child=>child.parentId===record.id);}if(target)focus(target);return;}
  else if(event.key==='ArrowLeft'){event.preventDefault();if(record.item.children?.length&&expanded().has(record.id))toggle(record,event,false);else focus(records.get(record.parentId));return;}
  else if(event.key===' '||event.key==='Enter'){event.preventDefault();propose(record,event,{toggle:event.key===' '||Boolean(event.ctrlKey||event.metaKey),range:Boolean(event.shiftKey)});return;}
  else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a'&&config.multiSelect!==false){event.preventDefault();config.onSelect?.(visible.filter(record=>!record.item.disabled).map(record=>record.id),{id:record.id,item:record.item,event,toggle:false,range:true});return;}
  else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){const now=Date.now();typeText=now-typeAt>700?event.key:typeText+event.key;typeAt=now;const needle=(typeText.split('').every(char=>char.toLocaleLowerCase()===typeText[0].toLocaleLowerCase())?typeText[0]:typeText).toLocaleLowerCase(),order=[...candidates.slice(index+1),...candidates.slice(0,index+1)];target=order.find(record=>record.item.label.toLocaleLowerCase().startsWith(needle));if(target)event.preventDefault();}
  if(target){event.preventDefault();const fromId=record.id;focus(target);if(event.shiftKey)propose(target,event,{range:true,fromId});}
 });
 const api={element,update,destroy(){if(destroyed)return;destroyed=true;for(const [node,type,handler]of listeners)node.removeEventListener(type,handler);listeners.length=0;records.clear();element.remove();}};
 update(options);host.appendChild(element);return api;
}

