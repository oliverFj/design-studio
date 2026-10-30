import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {getComponents,materializePackage,validatePackage,generateCSS,resolveTokens} from '../core/engine.mjs';
import {renderComponent,createComponent,mountTree} from '../core/components.mjs';
import {componentGeometryReport} from '../core/geometry.mjs';

const pack=id=>JSON.parse(readFileSync(new URL(`../packages/${id}.json`,import.meta.url),'utf8').replace(/^\uFEFF/,''));

// A small DOM model exercises native node identity, bubbling and focus loss on
// removal without adding a browser or DOM-library dependency to the runtime.
class Element {
 [Symbol.for('nodejs.util.inspect.custom')](){return '<'+this.tagName+' '+(this.getAttribute('data-tree-id')??this.getAttribute('class')??'')+'>';}
 constructor(tag,document){this.tagName=tag.toUpperCase();this.ownerDocument=document;this.attributes=new Map();this.childNodes=[];this.parentNode=null;this.listeners=new Map();this.disabled=false;this.hidden=false;this._text='';}
 get children(){return this.childNodes.filter(node=>node.tagName!=='#TEXT');}
 get firstChild(){return this.childNodes[0]??null;}
 get nextSibling(){const siblings=this.parentNode?.childNodes??[];return siblings[siblings.indexOf(this)+1]??null;}
 get textContent(){return this._text+this.childNodes.map(child=>child.textContent).join('');}
 set textContent(value){for(const child of [...this.childNodes])this.removeChild(child);this._text=String(value);}
 setAttribute(name,value){this.attributes.set(name,String(value));if(name==='disabled')this.disabled=true;if(name==='hidden')this.hidden=true;}
 getAttribute(name){return this.attributes.get(name)??null;}
 removeAttribute(name){this.attributes.delete(name);if(name==='disabled')this.disabled=false;if(name==='hidden')this.hidden=false;}
 contains(node){return node===this||this.childNodes.some(child=>child.contains(node));}
 appendChild(node){return this.insertBefore(node,null);}
 insertBefore(node,before){if(node===before)return node;if(before!==null&&!this.childNodes.includes(before))throw new Error('Unknown sibling');node.parentNode?.removeChild(node);const index=before===null?this.childNodes.length:this.childNodes.indexOf(before);this.childNodes.splice(index,0,node);node.parentNode=this;return node;}
 removeChild(node){const index=this.childNodes.indexOf(node);if(index<0)throw new Error('Unknown child');if(node.contains(this.ownerDocument.activeElement))this.ownerDocument.activeElement=this.ownerDocument.body;this.childNodes.splice(index,1);node.parentNode=null;return node;}
 remove(){this.parentNode?.removeChild(this);}
 addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);}
 removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);}
 focus(){if(this.disabled)return;this.ownerDocument.activeElement=this;event(this,'focusin');}
 getBoundingClientRect(){return {top:0,height:44};}
}
function dom(){const document={createElement(tag){return new Element(tag,document);},createTextNode(text){const node=new Element('#text',document);node.textContent=text;return node;}};document.body=document.createElement('body');document.activeElement=document.body;return document;}
function event(target,type,values={}){const result={target,type,bubbles:true,defaultPrevented:false,key:'',clientY:22,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...values};for(let node=target;node;node=node.parentNode){for(const listener of [...(node.listeners.get(type)??[])])listener(result);if(result.stopped||!result.bubbles)break;}return result;}
const walk=(node,predicate)=>predicate(node)?node:node.childNodes.map(child=>walk(child,predicate)).find(Boolean);
const byId=(tree,id)=>walk(tree.element,node=>node.getAttribute('data-tree-id')===id);
const part=(node,name)=>walk(node,child=>child.getAttribute('class')==='ds-tree__'+name);
const key=(document,value,options={})=>event(document.activeElement,'keydown',{key:value,...options});
function fixture(options={}){const document=dom(),host=document.createElement('section');document.body.appendChild(host);const tree=mountTree(pack('studio-light'),host,{items:[],...options},{document});return {document,host,tree};}

test('tree is one neutral shared component in all eight themes, with native preview and safe attributes',()=>{
 const themes=readdirSync(new URL('../packages/',import.meta.url)).filter(name=>name.endsWith('.json'));assert.equal(themes.length,8);
 for(const name of themes){const theme=pack(name.slice(0,-5));assert.deepEqual(validatePackage(theme),{valid:true,errors:[]});const components=getComponents(theme);assert.equal(Object.keys(components).length,37);assert.deepEqual(components.tree.composes,['button','badge']);const css=generateCSS(theme);assert.match(css,/\.ds-tree \.ds-tree__group/);assert.match(css,/\.ds-tree__item[^\n]* > \.ds-tree__row/);assert.match(css,/\[hidden\].*display: none !important/);assert.match(css,/min-height: max\(44px,/);}
 const theme=pack('studio-light'),html=renderComponent(theme,'tree',{state:['selected','focus','disabled']});assert.match(html,/^<ul[^>]+role="tree"/);assert.doesNotMatch(html.slice(0,html.indexOf('>')),/aria-selected/);assert.match(html,/<li[^>]+aria-selected="true"/);assert.match(html,/<button[^>]+class="ds-tree__label"[^>]+disabled/);const toggle=html.match(/<button\b(?=[^>]*\bclass="ds-tree__toggle")[^>]*>/)?.[0];assert.ok(toggle,'preview has a native fold button');assert.match(toggle,/aria-disabled="false"/);
 assert.match(renderComponent(theme,'tree',{attrs:{draggable:false,'aria-label':'<Items>'}}),/draggable="false"/);assert.match(renderComponent(theme,'tree',{attrs:{'aria-label':'<Items>'}}),/aria-label="&lt;Items&gt;"/);assert.throws(()=>renderComponent(theme,'tree',{attrs:{draggable:'yes'}}),/draggable/);assert.throws(()=>renderComponent(theme,'tree',{attrs:{onclick:'run()'}}),/Unsupported/);
 const document=dom(),preview=createComponent(theme,'tree',{}, {document});assert.equal(preview.tagName,'UL');assert.equal(part(preview,'toggle').tagName,'BUTTON');assert.equal(part(preview,'action').tagName,'BUTTON');
});

test('selection is controlled; focus, toggle and visible range selection remain distinct',()=>{
 const selections=[],{tree,document}=fixture({items:[{id:'a',label:'Alpha'},{id:'b',label:'Beta'},{id:'c',label:'Gamma'}],selectedIds:['a'],onSelect:(ids,detail)=>selections.push({ids,detail})});
 byId(tree,'a').focus();key(document,'ArrowDown');assert.equal(document.activeElement,byId(tree,'b'));assert.equal(selections.length,0);assert.equal(byId(tree,'a').getAttribute('aria-selected'),'true');
 key(document,' ');assert.deepEqual(selections.at(-1).ids,['a','b']);assert.equal(byId(tree,'b').getAttribute('aria-selected'),'false');tree.update({selectedIds:['a','b']});key(document,' ');assert.deepEqual(selections.at(-1).ids,['a']);
 event(part(byId(tree,'c'),'label'),'click',{shiftKey:true});assert.deepEqual(selections.at(-1).ids,['b','c']);assert.equal(selections.at(-1).detail.range,true);
 event(part(byId(tree,'c'),'label'),'click',{metaKey:true});assert.deepEqual(selections.at(-1).ids,['a','b','c']);key(document,'a',{ctrlKey:true});assert.deepEqual(selections.at(-1).ids,['a','b','c']);
 tree.update({multiSelect:false,selectedIds:['a']});event(part(byId(tree,'b'),'label'),'click',{ctrlKey:true,shiftKey:true});assert.deepEqual(selections.at(-1).ids,['b']);assert.equal(tree.element.getAttribute('aria-multiselectable'),'false');
});

test('fold navigation, type-ahead, native actions and context menus work on locked branches',()=>{
 const toggles=[],actions=[],menus=[],selections=[],items=[{id:'locked',label:'Locked',disabled:true,actions:[{id:'unlock',label:'Unlock'}],children:[{id:'child',label:'Child'}]},{id:'skip',label:'Unavailable',disabled:true},{id:'alpha',label:'Alpha'},{id:'beta',label:'Beta'}];
 const {tree,document}=fixture({items,onToggle:(...args)=>toggles.push(args),onAction:(...args)=>actions.push(args),onSelect:ids=>selections.push(ids),onContextMenu:(...args)=>menus.push(args)});const locked=byId(tree,'locked');locked.focus();key(document,' ');assert.equal(selections.length,0);key(document,'ArrowRight');assert.equal(toggles.at(-1)[0],'locked');assert.equal(toggles.at(-1)[1],true);assert.equal(locked.getAttribute('aria-expanded'),'false');
 tree.update({expandedIds:['locked']});key(document,'ArrowRight');assert.equal(document.activeElement,byId(tree,'child'));key(document,'ArrowLeft');assert.equal(document.activeElement,locked);key(document,'ArrowLeft');assert.equal(toggles.at(-1)[1],false);
 assert.equal(part(locked,'toggle').getAttribute('aria-disabled'),'false');const action=part(locked,'action');assert.equal(action.disabled,false);assert.equal(action.getAttribute('tabindex'),'0');action.focus();event(action,'click');assert.deepEqual(actions.at(-1).slice(0,2),['locked','unlock']);key(document,'F10',{shiftKey:true});assert.equal(menus.at(-1)[0],'locked');
 locked.focus();key(document,'End');assert.equal(document.activeElement,byId(tree,'beta'));key(document,'Home');assert.equal(document.activeElement,locked);key(document,'b');assert.equal(document.activeElement,byId(tree,'beta'));key(document,'ArrowUp');assert.equal(document.activeElement,byId(tree,'alpha'));key(document,'ArrowUp');assert.equal(document.activeElement,byId(tree,'child'));event(part(locked,'toggle'),'click');assert.equal(toggles.at(-1)[1],false);
});

test('keyed updates retain row and action identity, restore removed action focus and reveal ancestor focus',()=>{
 const a={id:'a',label:'A',actions:[{id:'eye',label:'Show'}]},b={id:'b',label:'B'},group={id:'g',label:'Group',children:[]},{tree,document}=fixture({items:[a,b,group],expandedIds:['g']});const rowA=byId(tree,'a'),eye=part(rowA,'action');rowA.focus();eye.focus();
 tree.update({items:[b,{...group,children:[{...a,label:'Renamed',meta:'Details'}]}]});assert.equal(byId(tree,'a'),rowA);assert.equal(part(rowA,'action'),eye);assert.equal(document.activeElement,eye);assert.equal(part(rowA,'name').textContent,'Renamed');assert.equal(rowA.getAttribute('aria-level'),'2');
 tree.update({items:[b,{...group,children:[{...a,actions:[]}]}]});assert.equal(document.activeElement,rowA);tree.update({expandedIds:[]});assert.equal(document.activeElement,byId(tree,'g'));assert.equal(rowA.getAttribute('tabindex'),'-1');assert.equal(part(byId(tree,'g'),'group').hidden,true);
 tree.update({items:[b]});assert.equal(document.activeElement,byId(tree,'b'));assert.equal(tree.element.children.length,1);
});

test('range selection falls back from a hidden or disabled anchor instead of selecting from list start',()=>{
 const selections=[],g={id:'g',label:'Group',children:[{id:'anchor',label:'Anchor'}]},items=[{id:'first',label:'First'},g,{id:'b',label:'B'},{id:'c',label:'C'}],{tree,document}=fixture({items,expandedIds:['g'],onSelect:ids=>selections.push(ids)});
 event(part(byId(tree,'anchor'),'label'),'click');tree.update({expandedIds:[],selectedIds:['b']});byId(tree,'b').focus();key(document,'ArrowDown',{shiftKey:true});assert.deepEqual(selections.at(-1),['b','c']);
 event(part(byId(tree,'b'),'label'),'click');tree.update({items:[items[0],g,{...items[2],disabled:true},items[3]],selectedIds:['c']});byId(tree,'c').focus();key(document,'ArrowUp',{shiftKey:true});assert.deepEqual(selections.at(-1),['g','c']);
});

test('drag and drop only proposes an allowed move and excludes selected descendants',()=>{
 const moves=[],a={id:'a',label:'A',draggable:true,children:[{id:'child',label:'Child',draggable:true,dropTarget:true}]},b={id:'b',label:'B',dropTarget:{inside:true,before:true,after:true}},disabled={id:'locked',label:'Locked',disabled:true,draggable:true,dropTarget:true};
 const {tree}=fixture({items:[a,b,disabled],selectedIds:['a','child'],expandedIds:['a'],onMove:(...args)=>moves.push(args)}),dataTransfer={values:{},setData(name,value){this.values[name]=value;}};
 event(part(byId(tree,'a'),'row'),'dragstart',{dataTransfer});assert.deepEqual(JSON.parse(dataTransfer.values['application/x-design-studio-tree']).ids,['a']);assert.equal(event(part(byId(tree,'child'),'row'),'dragover',{dataTransfer}).defaultPrevented,false);
 const target=part(byId(tree,'b'),'row');assert.equal(event(target,'dragover',{dataTransfer,clientY:1}).defaultPrevented,true);assert.equal(byId(tree,'b').getAttribute('data-drop-position'),'before');assert.match(byId(tree,'b').getAttribute('data-state'),/drop-target/);event(target,'drop',{dataTransfer,clientY:1});assert.deepEqual(moves.at(-1).slice(0,2),[['a'],'b']);assert.equal(moves.at(-1)[2].position,'before');assert.equal(tree.element.children[0],byId(tree,'a'));assert.equal(byId(tree,'b').getAttribute('data-drop-position'),null);
 for(const [y,position]of [[22,'inside'],[43,'after']]){event(part(byId(tree,'a'),'row'),'dragstart',{dataTransfer});event(target,'drop',{dataTransfer,clientY:y});assert.equal(moves.at(-1)[2].position,position);}
 assert.equal(part(byId(tree,'locked'),'row').getAttribute('draggable'),'false');assert.equal(event(part(byId(tree,'locked'),'row'),'dragstart',{dataTransfer}).defaultPrevented,true);assert.equal(moves.length,3);
});

test('invalid controlled updates are rejected before DOM changes; text stays text and destroy detaches listeners',()=>{
 let calls=0;const {tree,host}=fixture({items:[{id:'a',label:'<script>unsafe</script>',actions:[{id:'safe',label:'Safe'}]}],onSelect:()=>calls++}),row=byId(tree,'a'),label=part(row,'label');assert.equal(part(row,'name').textContent,'<script>unsafe</script>');assert.equal(part(row,'name').children.length,0);
 for(const items of [[{id:'a',label:'A'},{id:'a',label:'B'}],[{id:'a',label:'A',actions:[{id:'x',label:'X'},{id:'x',label:'Y'}]}],[{id:'bad',label:'Bad',children:{}}]]){assert.throws(()=>tree.update({items}),/unique|array/);assert.equal(byId(tree,'a'),row);assert.equal(part(row,'name').textContent,'<script>unsafe</script>');}
 const cycle={id:'cycle',label:'Cycle'};cycle.children=[cycle];assert.throws(()=>tree.update({items:[cycle]}),/unique/);event(label,'click');assert.equal(calls,1);tree.destroy();assert.equal(host.children.length,0);event(label,'click');assert.equal(calls,1);assert.throws(()=>tree.update({}),/destroyed/);tree.destroy();
});


test('compact tree is the shared default and roomy retains the larger targets',()=>{
 for(const name of readdirSync(new URL('../packages/',import.meta.url)).filter(name=>name.endsWith('.json'))){
  const theme=pack(name.slice(0,-5)),component=getComponents(theme).tree;
  assert.equal(component.parts.row.styles.minHeight,'32px');
  assert.equal(component.parts.toggle.styles.minWidth,'24px');
  assert.equal(component.parts.action.styles.minHeight,'28px');
  assert.equal(component.parts.group.styles.gap,'0');
  assert.equal(component.parts.meta.styles.flexShrink,'0');
  assert.equal(component.parts.meta.styles.whiteSpace,'nowrap');
  assert.equal(component.parts.name.styles.textOverflow,'ellipsis');
  assert.equal(component.variants.roomy.parts.meta.styles.flexShrink,'1');
  assert.equal(component.variants.roomy.parts.meta.styles.whiteSpace,'normal');
  assert.match(component.variants.roomy.parts.row.styles.minHeight,/44px/);
  assert.equal(component.variants.roomy.parts.name.styles.whiteSpace,'normal');
  assert.match(renderComponent(theme,'tree'),/data-variant="default"/);
  assert.match(renderComponent(theme,'tree',{variant:'roomy'}),/data-variant="roomy"/);
 }
 const {tree}=fixture();assert.equal(tree.element.getAttribute('data-variant'),'default');tree.update({variant:'roomy'});assert.equal(tree.element.getAttribute('data-variant'),'roomy');
});

test('compact row geometry fits labels, badges and native actions inside 32px in every theme',()=>{
 for(const name of readdirSync(new URL('../packages/',import.meta.url)).filter(name=>name.endsWith('.json'))){
  const theme=pack(name.slice(0,-5)),model=materializePackage(theme),component=model.components.tree;
  const report=componentGeometryReport(model,resolveTokens(theme));
  for(const variant of ['default','desktop']){
   const check=report.find(item=>item.id==='tree.'+variant),row={...component.parts.row.styles,...component.variants[variant].parts?.row?.styles};
   assert.equal(check.status,'pass',`${theme.id}/${variant}: ${check.details}`);
   assert.equal(check.measured,32,`${theme.id}/${variant}: badge, actions and borders fit the compact row`);
   assert.equal(row.height,undefined,'larger content may grow rather than clip');
  }
 }
});
