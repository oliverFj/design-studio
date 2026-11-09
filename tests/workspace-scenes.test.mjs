import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {mountEditorScene,mountOverviewScene} from '../studio/scenes/workspaces.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=id=>{const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));return resolveThemeMode(source,source.defaultMode);};

test('project filtering, selection, notes and status changes survive a theme remount',()=>{
 const document=dom(),state={},messages=[];
 let mounted=mountOverviewScene(theme('studio-light'),{document,state,announce:text=>messages.push(text)});document.body.append(mounted.element);
 const search=mounted.element.querySelector('#case-overview-search-control');search.value='langs';fire(search,'input');
 assert.equal(state.query,'langs');assert.equal(mounted.element.querySelectorAll('[data-table-row]').length,1);
 fire(mounted.element.querySelector('[data-table-action]'),'click');assert.equal(state.selected,'kyst');
 let note=mounted.element.querySelector('textarea');note.value='Bevar denne note.';fire(note,'input');
 mounted.destroy();mounted.element.remove();
 mounted=mountOverviewScene(theme('terminal'),{document,state,announce:text=>messages.push(text)});document.body.append(mounted.element);
 assert.equal(mounted.element.querySelector('#case-overview-search-control').value,'langs');
 assert.equal(mounted.element.querySelector('textarea').textContent,'Bevar denne note.');
 const action=mounted.element.querySelectorAll('button').find(button=>button.textContent==='Markér klar');fire(action,'click');
 assert.equal(state.projects.find(project=>project.id==='kyst').status,'done');
 assert.equal(state.projects.find(project=>project.id==='kyst').completed,12);
 assert.equal(mounted.element.querySelector('textarea').textContent,'Bevar denne note.');
 assert.match(messages.at(-1),/afsluttet/);
 assert.equal(document.activeElement.textContent,'Åbn projektet igen');
 mounted.destroy();
});

test('exhibition editor uses the shared object model and retains an unfinished property draft',()=>{
 const document=dom(),state={};
 let mounted=mountEditorScene(theme('studio-light'),{document,state});document.body.append(mounted.element);
 assert.equal(state.workbench.objects.find(object=>object.id==='panel').label,'Scenografi');
 const name=mounted.element.querySelector('#case-editor-objects-object-name-control');
 assert.ok(name,'the shared inspector exposes a native property control');name.value='Mit ufærdige titelfelt';fire(name,'input');
 const before=JSON.stringify(state.workbench.drafts);
 mounted.destroy();
 mounted=mountEditorScene(theme('terminal'),{document,state});document.body.append(mounted.element);
 assert.equal(JSON.stringify(state.workbench.drafts),before);
 assert.equal(mounted.element.querySelector('#case-editor-objects-object-name-control').value,'Mit ufærdige titelfelt');
 mounted.destroy();
});
