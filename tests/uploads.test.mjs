import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponentFactory,createComponentRenderer,mountFileUpload,validateFileSelection} from '../core/components.mjs';
import {materializePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
import {bindFileExamples} from '../studio/file-example.mjs';
const source=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const theme=()=>resolveThemeMode(source('studio-light'),'light');
const file=(name,type='text/plain',size=10)=>({name,type,size});

test('local file validator checks extensions, MIME types, count and byte limits together',()=>{
 assert.equal(validateFileSelection([file('RAPPORT.PDF','application/pdf')],{accept:'.pdf'}).valid,true);
 assert.equal(validateFileSelection([file('foto.webp','image/webp')],{accept:'image/*'}).valid,true);
 assert.equal(validateFileSelection([file('rapport.pdf','application/pdf')],{accept:'application/pdf'}).valid,true);
 const invalid=validateFileSelection([file('rapport.pdf','application/pdf',100),file('script.js','text/javascript')],{accept:'.pdf',multiple:true,maxFiles:1,maxSize:50});
 assert.deepEqual(invalid.errors.map(error=>error.code),['max-files','max-size','accept']);
 assert.equal(validateFileSelection([file('a'),file('b')]).valid,false);assert.equal(validateFileSelection([]).valid,true);
 assert.equal(validateFileSelection([{}]).errors[0].code,'invalid-file');
 for(const options of [{accept:'javascript:bad'},{maxSize:0},{maxFiles:0},{multiple:'true'}])assert.throws(()=>validateFileSelection([],options),/File|Unsupported file/);
});

test('file selection remains native and labelled with working descriptions in every public mode',()=>{
 for(const id of PUBLIC_THEME_IDS){const sourcePack=source(id);for(const mode of Object.keys(sourcePack.modes)){
  const render=createComponentRenderer(resolveThemeMode(sourcePack,mode));
  const html=render('file-upload',{idPrefix:'attachments',label:'Vælg bilag',accept:'.pdf,image/*',multiple:true,maxFiles:3,maxSize:100000,variant:'drop'});
  assert.match(html,/type="file"/);assert.match(html,/for="attachments-files"/);assert.match(html,/id="attachments-files"/);assert.match(html,/accept=".pdf,image\/\*"/);assert.match(html,/ multiple/);assert.match(html,/data-upload-drop="true"/);assert.match(html,/aria-describedby="attachments-hint"/);
 }}
 const render=createComponentRenderer(theme());assert.throws(()=>render('file-upload',{value:'fake.pdf'}),/cannot be prefilled/);assert.throws(()=>render('file-upload',{type:'text'}),/type=file/);
 assert.throws(()=>render('file-upload',{slots:{control:{tag:'input',attrs:{value:'fake.pdf'}}}}),/cannot be prefilled/);
 const composed=render('file-upload',{idPrefix:'custom-files',hint:'Læs begrænsningerne',error:'En synlig fejl',accept:'.pdf',slots:{control:{tag:'input',attrs:{accept:'.exe','aria-describedby':'external-description'}}}});
 assert.match(composed,/accept=".pdf"/);assert.match(composed,/aria-describedby="external-description custom-files-hint custom-files-error"/);
});

test('cancel and invalid selections preserve previously accepted files without calling onChange',()=>{
 const document=dom(),create=createComponentFactory(theme(),{document}),root=create('file-upload',{accept:'.pdf',multiple:true,maxFiles:2,maxSize:50}),input=root.querySelector('input'),changes=[],invalid=[];document.body.append(root);
 const previous=file('første.pdf','application/pdf'),upload=mountFileUpload(root,{files:[previous],onChange:(...args)=>changes.push(args),onInvalid:(...args)=>invalid.push(args)});
 input.files=[];fire(input,'cancel');fire(input,'change');assert.deepEqual(upload.files,[previous]);assert.equal(changes.length,0);
 input.files=[file('forkert.txt')];input.value='C:\\fakepath\\forkert.txt';fire(input,'change');assert.deepEqual(upload.files,[previous]);assert.equal(changes.length,0);assert.equal(invalid.length,1);assert.equal(input.value,'');
 assert.equal(input.getAttribute('aria-invalid'),'true');assert.match(input.getAttribute('aria-describedby'),/-error/);
 const next=file('næste.pdf','application/pdf');input.files=[next];fire(input,'change');assert.deepEqual(upload.files,[next]);assert.equal(changes.length,1);assert.equal(input.getAttribute('aria-invalid'),null);assert.doesNotMatch(input.getAttribute('aria-describedby'),/-error/);
 const copy=upload.files;copy.pop();assert.deepEqual(upload.files,[next]);upload.destroy();
});

test('drop uses the same validator, filenames stay text, and removing files preserves a useful focus target',()=>{
 const document=dom(),create=createComponentFactory(theme(),{document}),root=create('file-upload',{accept:'.pdf',multiple:true,maxFiles:2,variant:'drop'}),input=root.querySelector('input'),changes=[];document.body.append(root);
 const upload=mountFileUpload(root,{onChange:files=>changes.push(files)}),first=file('<img onerror=alert(1)>.pdf','application/pdf'),second=file('to.pdf','application/pdf');
 fire(root,'dragover',{dataTransfer:{types:['Files'],files:[first]}});assert.equal(root.getAttribute('data-drag-state'),'over');
 fire(root,'drop',{dataTransfer:{types:['Files'],files:[first,second]}});assert.equal(upload.files.length,2);assert.equal(root.querySelector('.ds-file-upload__name').textContent,first.name);assert.equal(root.querySelector('img'),null);
 fire(root,'drop',{dataTransfer:{types:['Files'],files:[file('forkert.txt')]}});assert.equal(upload.files.length,2);assert.equal(changes.length,1);
 const remove=root.querySelector('.ds-file-upload__remove');remove.focus();fire(remove,'click');assert.equal(upload.files.length,1);assert.equal(document.activeElement,root.querySelector('.ds-file-upload__remove'));
 fire(document.activeElement,'click');assert.equal(upload.files.length,0);assert.equal(document.activeElement,input);
 input.setAttribute('disabled','');fire(root,'drop',{dataTransfer:{types:['Files'],files:[second]}});assert.equal(upload.files.length,0);
 upload.destroy();fire(root,'drop',{dataTransfer:{types:['Files'],files:[second]}});assert.equal(upload.files.length,0);
});

test('initial validation precedes mutation and format-1 custom file roles remain intact',()=>{
 const document=dom(),create=createComponentFactory(theme(),{document}),root=create('file-upload',{accept:'.pdf'}),before=root.textContent;
 assert.throws(()=>mountFileUpload(root,{files:[file('a.txt')]}),/Initial file selection/);assert.equal(root.textContent,before);
 const pack=materializePackage(theme());pack.components['file-upload']={name:'Historisk filvalg',description:'Eget filvalg.',usage:'Bevar produktets markup.',composes:[],parts:{root:{selector:'.ds-old-file-choice',styles:{}}},variants:{},states:{},preview:{tag:'p',part:'root',text:'Eget filvalg'}};
 assert.match(createComponentRenderer(pack)('file-upload'),/^<p class="ds-old-file-choice">Eget filvalg<\/p>$/);
});

test('live file example synchronizes native and ARIA availability after selection and clearing',()=>{
 const document=dom(),create=createComponentFactory(theme(),{document}),example=document.createElement('div');
 example.setAttribute('data-file-example','');
 const picker=create('file-upload',{accept:'.txt,.json',multiple:true,maxSize:1048576,maxFiles:3,drop:true});
 const clear=create('button',{text:'Ryd filvalget',disabled:true,attrs:{'data-file-clear':''}});
 example.append(picker,clear);document.body.append(example);
 const binding=bindFileExamples(document.body),input=picker.querySelector('input');
 assert.equal(clear.getAttribute('disabled'),'');assert.equal(clear.getAttribute('aria-disabled'),'true');
 input.files=[file('noter.txt')];fire(input,'change');
 assert.equal(picker.querySelectorAll('.ds-file-upload__item').length,1);
 assert.equal(clear.disabled,false);assert.equal(clear.getAttribute('disabled'),null);assert.equal(clear.getAttribute('aria-disabled'),'false');
 clear.focus();fire(clear,'click');
 assert.equal(picker.querySelectorAll('.ds-file-upload__item').length,0);
 assert.equal(clear.disabled,true);assert.equal(clear.getAttribute('disabled'),'');assert.equal(clear.getAttribute('aria-disabled'),'true');assert.equal(document.activeElement,input);
 binding.destroy();
});
