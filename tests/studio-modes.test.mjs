import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {dom,fire} from './support/dom.mjs';
import {resolveTokens} from '../core/engine.mjs';

// Exercise the real editor functions and event handlers; the test DOM does not
// parse its HTML shell, so mount the small set of controls used by bind().
async function editor({showcase=false,themeId='studio-light'}={}){
 const file=new URL('../studio/app.mjs',import.meta.url),source=readFileSync(file,'utf8');
 const exposed=source.replace(/startStudio\(\);\s*$/,'')+`
 render=()=>{};
 brandStudio.bind=()=>{};qualityStudio.bind=()=>{};
 download=(...args)=>globalThis.downloads.push(args);
 export const editorTest={state,model,tokenInspector,changeToken,bind,download,packageInspector,brandContent:()=>brandStudio.content(),
   chooseMode:value=>colorPreference.set(value),
   resetModel:()=>{readModel=null;},
   activeTheme,principlesContent:()=>renderPrinciples(activeTheme())};`;
 const result=await build({stdin:{contents:exposed,resolveDir:fileURLToPath(new URL('../studio/',import.meta.url)),sourcefile:'app.mjs'},bundle:true,write:false,format:'cjs',platform:'browser',loader:{'.md':'text'},define:{__STUDIO_SHOWCASE__:JSON.stringify(showcase)}});
 const document=dom(),window=document.createElement('window');
 document.head=document.createElement('head');document.documentElement=document.createElement('html');document.documentElement.classList={add(){}};
 const root=document.createElement('div');root.setAttribute('id','app');document.body.append(root);
 const themeLabel=document.createElement('label'),themeSelect=document.createElement('select');themeSelect.setAttribute('id','package-select');themeLabel.append(themeSelect);root.append(themeLabel);
 Object.defineProperty(themeSelect,'parentElement',{get(){return this.parentNode;}});
 themeLabel.before=node=>themeLabel.parentNode.insertBefore(node,themeLabel);
 for(const id of ['save','discard','import','import-file','download-css']){const node=document.createElement('button');node.setAttribute('id',id);root.append(node);}
 document.querySelector=selector=>document.body.querySelector(selector)||document.head.querySelector(selector)||(selector==='#color-mode'?document.body.querySelectorAll('select').find(node=>node.id==='color-mode'):null);
 document.querySelectorAll=selector=>document.body.querySelectorAll(selector);
 const context=createContext({document,window,Intl,URL,Blob,atob,btoa,TextDecoder,TextEncoder,setTimeout,clearTimeout,downloads:[],CSS:{escape:value=>value},module:{exports:{}},exports:{}});
 context.exports=context.module.exports;
 context.structuredClone=new Script('(value)=>JSON.parse(JSON.stringify(value))').runInContext(context);
 new Script(result.outputFiles[0].text,{filename:'studio-modes.cjs'}).runInContext(context,{timeout:10000});
 context.fixture=readFileSync(new URL('../packages/'+themeId+'.json',import.meta.url),'utf8');
 new Script('module.exports.editorTest.state.pack=JSON.parse(fixture);module.exports.editorTest.state.view="tokens";module.exports.editorTest.state.token="color.background.canvas";').runInContext(context);
 const api=context.module.exports.editorTest;api.bind();
 return {api,document,downloads:context.downloads};
}

test('editor mode edits, inspector values and CSS export retain the selected mode and complete source',async()=>{
 const {api,document,downloads}=await editor(),pack=api.state.pack;
 const originalLight=JSON.stringify(pack.modes.light),baseCanvas=pack.tokens['color.background.canvas'].$value;
 api.chooseMode('dark');
 const darkCanvas=pack.modes.dark.tokens['color.background.canvas'].$value;
 const darkResolved=resolveTokens(JSON.parse(JSON.stringify(api.activeTheme())))['color.background.canvas'];
 assert.ok(api.tokenInspector().includes('value="'+darkCanvas+'"'));
 assert.ok(api.tokenInspector().includes('id="token-example">'+darkResolved),'the resolved inspector value follows dark mode');
 api.changeToken('#181a25');
 assert.equal(pack.modes.dark.tokens['color.background.canvas'].$value,'#181a25');
 assert.equal(pack.tokens['color.background.canvas'].$value,baseCanvas);assert.equal(JSON.stringify(pack.modes.light),originalLight);
 fire(document.querySelector('#download-css'),'click');
 assert.equal(downloads.length,1);assert.match(downloads[0][1],/--ds-color-background-canvas:\s*#181a25/,'CSS export matches the selected edited mode');
 assert.ok(pack.modes.light&&pack.modes.dark,'the editable source retains both modes after export');
 api.changeToken('invalid-colour');api.resetModel();
 assert.match(api.tokenInspector(),/value="invalid-colour"/,'invalid mode drafts remain visible after model refresh');
 api.chooseMode('light');
 const lightResolved=resolveTokens(JSON.parse(JSON.stringify(api.activeTheme())))['color.background.canvas'];
 assert.ok(document.head.children.findLast(node=>node.id==='package-styles').textContent.includes('--ds-color-background-canvas: '+lightResolved),'a valid active mode still previews while the other mode has an invalid draft');
 api.chooseMode('dark');
 api.changeToken(darkCanvas);
 api.chooseMode('light');api.changeToken('#f5f5f6');
 assert.equal(pack.tokens['color.background.canvas'].$value,'#f5f5f6','editing the authored default mode keeps the compatibility base synchronized');
 assert.equal(pack.modes.light.tokens['color.background.canvas'].$value,'#f5f5f6');
 assert.equal(pack.modes.dark.tokens['color.background.canvas'].$value,darkCanvas);
 assert.equal(api.model().tokens['color.background.canvas'].$value,'#f5f5f6');
 const principles=api.principlesContent();
 assert.equal((principles.match(/class="principles-chapter(?: principles-references)?"/g)||[]).length,13);
 assert.match(principles,/id="principle-s17"/,'the real editor bundles the constitution and its source targets');
 assert.match(principles,/Afspil bevægelse/,'the motion example uses the shared component runtime');
});

test('public studio offers the same theme experiments and exports as the local editor',async()=>{
 const {api,downloads}=await editor({showcase:true});
 api.chooseMode('dark');api.changeToken('#181a25');
 assert.equal(api.state.pack.modes.dark.tokens['color.background.canvas'].$value,'#181a25');
 assert.match(api.packageInspector(),/id="download-css"/);
 assert.match(api.brandContent(),/data-brand-download/);
 api.download('theme.json','{}','application/json');
 assert.equal(downloads.length,1);
});

test('editor offers named Bauhaus colors, edits only the selected appearance and exports the full theme',async()=>{
 const {api,document,downloads}=await editor({themeId:'bauhaus'}),pack=api.state.pack;
 const picker=document.querySelector('#color-mode');
 assert.deepEqual(Array.from(picker.children,option=>option.textContent),['Solgul','Kalk','Signalrød']);
 const original=JSON.stringify(pack.modes.solgul),base=pack.tokens['color.background.canvas'].$value;
 picker.value='kalk';fire(picker,'change');
 assert.equal(resolveTokens(JSON.parse(JSON.stringify(api.activeTheme())))['color.background.canvas'],'#fffbea');
 api.changeToken('#fff8e5');
 assert.equal(pack.modes.kalk.tokens['color.background.canvas'].$value,'#fff8e5');
 assert.equal(JSON.stringify(pack.modes.solgul),original);assert.equal(pack.tokens['color.background.canvas'].$value,base);
 fire(document.querySelector('#download-css'),'click');assert.match(downloads[0][1],/--ds-color-background-canvas:\s*#fff8e5/);
 assert.equal(pack.modes.dark,undefined);
});
