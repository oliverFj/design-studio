import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponentFactory,createComponentRenderer,mountToast} from '../core/components.mjs';
import {materializePackage,generateCSS} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
const source=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const theme=()=>resolveThemeMode(source('studio-light'),'light');
function fixture(){
 const document=dom(),tasks=new Map();let time=0,sequence=0;
 document.defaultView={performance:{now:()=>time},setTimeout(callback,delay){const id=++sequence;tasks.set(id,{at:time+delay,callback});return id;},clearTimeout(id){tasks.delete(id);}};
 const advance=milliseconds=>{const target=time+milliseconds;for(;;){const next=[...tasks.entries()].filter(([,task])=>task.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;tasks.delete(next[0]);next[1].callback();}time=target;};
 const create=createComponentFactory(theme(),{document});return {document,create,advance};
}

test('feedback roles render named native progress, quiet decorative placeholders and escaped empty content in all theme modes',()=>{
 for(const id of PUBLIC_THEME_IDS){const pack=source(id);for(const mode of Object.keys(pack.modes)){
  const render=createComponentRenderer(resolveThemeMode(pack,mode));
  assert.match(render('spinner',{label:'Indlæser rækker…'}),/role="status"/);
  assert.doesNotMatch(render('spinner',{label:'Indlæser rækker…',announce:false}),/role="status"/);
  const progress=render('progress',{idPrefix:'files',label:'Behandler filer',value:0,max:10});
  assert.match(progress,/<label[^>]*for="files-progress"/);assert.match(progress,/<progress[^>]*value="0"[^>]*id="files-progress"|<progress[^>]*id="files-progress"[^>]*value="0"/);
  assert.doesNotMatch(render('progress',{label:'Forbereder'}),/<progress[^>]*value=/);
  assert.match(render('skeleton',{attrs:{'aria-hidden':'false',tabindex:'0'}}),/aria-hidden="true"/);
  assert.doesNotMatch(render('skeleton'),/role="status"|aria-live/);
  const empty=render('empty-state',{title:'Ingen <resultater>',body:'Prøv "en anden" søgning',slots:{actions:[{component:'button',options:{text:'Nulstil filtre'}}]}});
  assert.match(empty,/Ingen &lt;resultater&gt;/);assert.match(empty,/Nulstil filtre/);assert.doesNotMatch(empty,/role="status"|aria-live/);
  assert.match(render('toast',{title:'Gemt',body:'Alle ændringer er gemt'}),/data-toast-close/);
 }}
 const render=createComponentRenderer(theme());
 for(const options of [{value:-1},{value:101},{max:0},{max:Infinity},{value:NaN}])assert.throws(()=>render('progress',options),/Progress/);
 assert.throws(()=>render('spinner',{label:''}),/non-empty label/);
 assert.throws(()=>render('progress',{slots:{control:{tag:'div'}}}),/native progress/);
 assert.throws(()=>render('skeleton',{slots:{root:[{tag:'button',text:'Ikke dekorativ'}]}}),/decorative/);
 const css=generateCSS(theme());assert.match(css,/prefers-reduced-motion/);assert.match(css,/ds-feedback-spin/);assert.match(css,/ds-skeleton-pulse/);
});

test('toast announces once without its action labels, never moves focus and pauses its remaining lifetime',()=>{
 const {document,create,advance}=fixture(),outside=document.createElement('button'),toast=create('toast',{title:'Gemt',body:'Dit projekt er gemt'});document.body.append(outside,toast);outside.focus();
 const closed=[],control=mountToast(toast,{duration:100,onClose:reason=>closed.push(reason)});
 assert.equal(document.activeElement,outside);assert.equal(toast.querySelector('.ds-toast__announcer').textContent,'');
 advance(30);assert.equal(toast.querySelector('.ds-toast__announcer').textContent,'Gemt. Dit projekt er gemt');
 advance(10);fire(toast,'pointerenter');advance(200);assert.equal(control.closed,false);
 fire(toast,'pointerleave');advance(59);assert.equal(control.closed,false);advance(1);assert.equal(control.closed,true);assert.deepEqual(closed,['timeout']);assert.equal(toast.getAttribute('hidden'),'');assert.equal(document.activeElement,outside);
 control.destroy();
});

test('toast persists with actions and pauses for keyboard focus or a hidden document',()=>{
 const {document,create,advance}=fixture(),outside=document.createElement('button');document.body.append(outside);outside.focus();
 const toast=create('toast',{title:'Elementet blev fjernet',slots:{actions:[{component:'button',options:{text:'Fortryd'}}]}});document.body.append(toast);
 const control=mountToast(toast,{duration:10});advance(1000);assert.equal(control.closed,false);assert.doesNotMatch(toast.querySelector('.ds-toast__announcer').textContent,/Fortryd|Luk/);
 fire(toast.querySelector('.ds-toast__close'),'click');assert.equal(control.closed,true);control.destroy();
 const timed=create('toast',{title:'Klar'});document.body.append(timed);const next=mountToast(timed,{duration:100});
 advance(20);timed.querySelector('.ds-toast__close').focus();advance(200);assert.equal(next.closed,false);
 outside.focus();fire(timed,'focusout',{relatedTarget:outside});advance(20);document.hidden=true;fire(document.body,'visibilitychange');advance(200);assert.equal(next.closed,false);
 document.hidden=false;fire(document.body,'visibilitychange');advance(59);assert.equal(next.closed,false);advance(1);assert.equal(next.closed,true);next.destroy();
 const quiet=create('toast');document.body.append(quiet);const persistent=mountToast(quiet,{duration:0,announce:false});advance(10000);assert.equal(persistent.closed,false);assert.equal(quiet.querySelector('.ds-toast__announcer').textContent,'');persistent.destroy();
 assert.throws(()=>mountToast(quiet,{duration:-1}),/duration/);
});

test('custom format-1 feedback keeps its authored anatomy',()=>{
 const pack=materializePackage(theme());
 pack.components.progress={name:'Historisk status',description:'Eget statusindhold.',usage:'Bevar produktets status.',composes:[],parts:{root:{selector:'.ds-old-progress',styles:{}}},variants:{},states:{},preview:{tag:'p',part:'root',text:'Egen status'}};
 const render=createComponentRenderer(pack);assert.match(render('progress'),/^<p class="ds-old-progress">Egen status<\/p>$/);
});
