import {getComponents, brandAssetDataURL} from './engine.mjs';
import {COMPONENT_LIBRARY, canonicalComponentId, canonicalVariantId, canonicalStateId, canonicalPartId} from './library.mjs';

const tags=new Set(['div','span','p','strong','label','button','input','select','option','h1','h2','h3','h4','h5','h6','hr','section','article','header','footer','dialog','textarea','ul','li','img','dl','dt','dd']);
const inputTypes=new Set(['button','submit','reset','text','email','number','password','checkbox','radio','search','tel','url','range','color','date']);
const booleans=new Set(['disabled','checked','selected','multiple','required','readOnly','readonly','hidden','open']);
const voidTags=new Set(['input','hr','img']);
const safeAttribute=name=>booleans.has(name)||['id','for','name','type','value','placeholder','min','max','step','rows','cols','autocomplete','role','title','tabindex'].includes(name)||/^aria-[a-z-]+$/.test(name)||/^data-[a-z-]+$/.test(name);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sequence=0;
function attributes(attrs={}){
 const result={};
 for(const [key,value]of Object.entries(attrs)){
  if(!safeAttribute(key))throw new Error('Unsupported component attribute: '+key);
  if(key==='type'&&!inputTypes.has(value))throw new Error('Unsupported native input type: '+value);
  if(booleans.has(key)){if(typeof value!=='boolean')throw new Error('Boolean component attribute required: '+key);if(value)result[key==='readOnly'?'readonly':key]=true;}
  else {if(!['string','number'].includes(typeof value))throw new Error('Text component attribute required: '+key);result[key]=String(value);}
 }
 return result;
}
function prefix(options){return String(options.idPrefix??'ds-component-'+(++sequence)).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100)||'ds-component-'+(++sequence);}
function model(pack,id,options,components,depth=0){
 if(depth>12)throw new Error('Component composition exceeds maximum depth 12.');
 if(pack.schemaVersion===2)id=canonicalComponentId(id);
 const component=components[id];if(!component)throw new Error('Unknown shared component: '+id);
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
   else if(Array.isArray(slot)){node.children=slot;delete node.text;if(node.tag==='p')node.tag='div';}
   else if(slot?.component){node.children=[slot];delete node.text;if(node.tag==='p')node.tag='div';}
   else if(slot&&typeof slot==='object'){node={...slot,part};}
   else throw new Error('Expected text or declarative nodes in component slot '+part);
  }
  if(!tags.has(node.tag))throw new Error('Unsupported component tag: '+node.tag);
  if(root&&options.text!==undefined&&id!=='action-button'){node.text=String(options.text);delete node.children;}
  const attrs=attributes({...node.attrs,...(root?options.attrs:{})});
  if(part)attrs.class=component.parts[part].selector.slice(1);
  if(root&&variant)attrs['data-variant']=variant;
  if(!root&&node.variant)attrs['data-variant']=node.variant;
  if(root&&options.state){const states=(Array.isArray(options.state)?options.state:[options.state]).map(state=>pack.schemaVersion===2?canonicalStateId(id,state):state);for(const state of states)if(!Object.hasOwn(component.states,state))throw new Error('Unknown component state: '+state);attrs['data-state']=states.join(' ');if(states.includes('selected'))attrs['aria-selected']='true';if(states.includes('pressed'))attrs['aria-pressed']='true';if(states.includes('expanded'))attrs['aria-expanded']='true';if(states.includes('loading'))attrs['aria-busy']='true';}
  const nativeControl=['input','select','textarea'].includes(node.tag);
  if(nativeControl){
   for(const key of ['name','value','placeholder','type','min','max','step'])if(options[key]!==undefined)Object.assign(attrs,attributes({[key]:String(options[key])}));
   for(const key of ['disabled','checked','required','readOnly'])if(options[key]!==undefined){const attribute=key==='readOnly'?'readonly':key;if(options[key])attrs[attribute]=true;else delete attrs[attribute];}
  }
  if(node.tag==='button'){
   attrs.type??='button';
   if(options.disabled!==undefined){if(options.disabled)attrs.disabled=true;else delete attrs.disabled;}
  }
  if((nativeControl||node.tag==='button')&&(Array.isArray(options.state)?options.state:[options.state]).includes('disabled'))attrs.disabled=true;
  if(root&&options.disabled)attrs['aria-disabled']='true';
  if(id==='action-button'&&part==='label'&&(options.label!==undefined||options.text!==undefined))node.text=String(options.label??options.text);
  if(id==='action-button'&&['icon','shortcut'].includes(part)&&(Object.hasOwn(options,'label')||Object.hasOwn(options,'text'))&&!Object.hasOwn(options,part)&&!Object.hasOwn(slots,part)&&!(part==='icon'&&iconAsset)){attrs.hidden=true;delete node.text;delete node.children;}
  if(root&&id==='action-button'&&options.pressed!==undefined){attrs['aria-pressed']=String(Boolean(options.pressed));attrs['data-state']=options.pressed?'pressed':'idle';}
  if(root&&id==='action-button'&&variant==='icon-only')attrs['aria-label']??=String(options.label??options.text??'Tilføj');
  if(root&&id==='action-button'&&options.shortcut)attrs['aria-keyshortcuts']??=String(options.shortcut);
  if(part==='value'&&id==='range-field'&&options.value!==undefined)node.text=String(options.value);
  if(['field','range-field','choice-field'].includes(id)){
   if(part==='label'){attrs.for=identifier+'-control';if(options.label!==undefined)node.text=String(options.label);}
   if(part==='control'){
    attrs.id=identifier+'-control';
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
 if(id==='dialog')return {tag:'dialog',attrs:{class:'ds-dialog-host','aria-labelledby':identifier+'-title','aria-describedby':identifier+'-body',...(options.open?{open:true}:{})},children:[tree]};
 return tree;
}
function serialize(node){
 const attrs=Object.entries(node.attrs??{}).map(([key,value])=>value===true?' '+key:' '+key+'="'+escape(value)+'"').join('');
 return '<'+node.tag+attrs+'>'+(voidTags.has(node.tag)?'':(node.text===undefined?'':escape(node.text))+(node.children??[]).map(serialize).join('')+'</'+node.tag+'>');
}
/** Safe HTML from the same shared declarative implementation used by createComponent.
 * options: variant, state, idPrefix, text, slots, attrs and native control values.
 * slots accept escaped text, declarative nodes, arrays or {component, options}.
 * Dialog returns a native dialog host: call showModal()/close() in the product.
 */
export function renderComponent(pack,id,options={}) {return serialize(model(pack,id,options,getComponents(pack)));}
/** Build native DOM without innerHTML. Attach product event handlers to the returned node. */
export function createComponent(pack,id,options={}, {document=globalThis.document}={}) {
 if(!document?.createElement)throw new Error('createComponent requires a DOM document.');
 const tree=model(pack,id,options,getComponents(pack));
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

