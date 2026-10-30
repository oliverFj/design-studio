import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPONENT_LIBRARY} from '../core/library.mjs';
import {createComponentFactory,createComponentRenderer,mountAvatarFallbacks} from '../core/components.mjs';
import {generateCSS,materializePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
import {renderContentExample} from '../studio/content-example.mjs';

const themes=PUBLIC_THEME_IDS.flatMap(id=>{
 const theme=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
 return Object.keys(theme.modes).map(mode=>resolveThemeMode(theme,mode));
});

test('avatars and overlapping groups retain names, fallback initials and wrapping in every theme mode',()=>{
 for(const pack of themes){
  const render=createComponentRenderer(pack);
  const avatar=render('avatar',{name:'  Anna Marie Østergaard  '});
  assert.match(avatar,/role="img" aria-label="Anna Marie Østergaard"/);
  assert.match(avatar,/>AØ<\/span>/);assert.match(avatar,/aria-hidden="true"/);
  const group=render('avatar-group',{label:'Ansvarlige',variant:'overlap',items:[{name:'Anna Larsen'},{name:'王'},{name:'Mikkel Holm',initials:'MH'}]});
  assert.match(group,/^<ul /);assert.match(group,/aria-label="Ansvarlige"/);assert.equal((group.match(/<li /g)||[]).length,3);
  assert.match(group,/aria-label="王"/);assert.match(group,/>王<\/span>/);
  assert.match(render('avatar-group',{items:[]}),/<\/ul>$/);
 }
 assert.equal(COMPONENT_LIBRARY['avatar-group'].parts.root.styles.flexWrap,'wrap');
 assert.equal(COMPONENT_LIBRARY['avatar-group'].parts.root.styles.overflow,'visible');
 assert.equal(COMPONENT_LIBRARY['avatar-group'].parts.item.styles.overflow,'visible');
 const render=createComponentRenderer(themes[0]);
 assert.throws(()=>render('avatar',{name:''}),/non-empty accessible name/);
 assert.throws(()=>render('avatar',{name:'Anna',src:'javascript:alert(1)'}),/Unsupported component URL/);
 assert.throws(()=>render('avatar-group',{items:[{}]}),/requires a name/);
 assert.match(render('avatar',{name:'<Anna & Mikkel>'}),/aria-label="&lt;Anna &amp; Mikkel&gt;"/);
 assert.match(render('avatar',{name:'👩‍💻 Jensen'}),/>👩‍💻J<\/span>/);
});

test('native avatars handle loading, broken images, cached images and recovery without losing their name',()=>{
 const document=dom(),create=createComponentFactory(themes[0],{document});
 const avatar=create('avatar',{name:'Anna Larsen',src:'portraet.jpg'}),image=avatar.querySelector('img'),initials=avatar.querySelector('.ds-avatar__initials');
 assert.equal(image.getAttribute('alt'),'');assert.equal(image.getAttribute('hidden'),'');assert.equal(initials.getAttribute('hidden'),null);
 image.naturalWidth=96;fire(image,'load');assert.equal(image.getAttribute('hidden'),null);assert.equal(initials.getAttribute('hidden'),'');
 fire(image,'error');assert.equal(image.getAttribute('hidden'),'');assert.equal(initials.getAttribute('hidden'),null);assert.equal(avatar.getAttribute('aria-label'),'Anna Larsen');
 fire(image,'load');assert.equal(image.getAttribute('hidden'),null);
 mountAvatarFallbacks(avatar);assert.equal(image.listeners.get('error').size,1,'rebinding is idempotent');
 const host=document.createElement('span'),cached=document.createElement('img'),fallback=document.createElement('span');
 fallback.className='ds-avatar__initials';cached.setAttribute('data-avatar-image','true');cached.complete=true;cached.naturalWidth=120;host.append(fallback,cached);
 const control=mountAvatarFallbacks(host);assert.equal(cached.getAttribute('hidden'),null);assert.equal(fallback.getAttribute('hidden'),'');
 control.destroy();control.destroy();assert.equal(cached.listeners.get('load').size,0);assert.equal(cached.listeners.get('error').size,0);
});

test('action loading, pressed and disabled coexist and named icons work on tags and segmented choices',()=>{
 const document=dom(),create=createComponentFactory(themes[0],{document});
 const action=create('action-button',{label:'Gem ændringer',iconName:'device-floppy',state:['loading','disabled'],pressed:true});
 assert.equal(action.getAttribute('disabled'),'');assert.equal(action.getAttribute('aria-busy'),'true');assert.equal(action.getAttribute('aria-pressed'),'true');
 assert.equal(action.getAttribute('data-state'),'loading disabled pressed');
 assert.equal(action.querySelector('.ds-action-button__label').textContent,'Gem ændringer');assert.equal(action.querySelector('.ds-action-button__progress').getAttribute('hidden'),null);assert.equal(action.querySelector('.ds-action-button__icon').getAttribute('hidden'),'');
 const unpressed=create('action-button',{label:'Fastgør',state:'disabled',pressed:false});assert.equal(unpressed.getAttribute('data-state'),'disabled');assert.equal(unpressed.getAttribute('aria-pressed'),'false');
 for(const id of ['tag','segmented-option']){
  const choice=create(id,{text:'En mulighed med en længere beskrivelse',iconName:'star',pressed:true,disabled:true});
  assert.ok(choice.querySelector('[data-icon="star"]'));assert.equal(choice.querySelector('.ds-'+id+'__label').textContent,'En mulighed med en længere beskrivelse');
  assert.equal(choice.getAttribute('aria-pressed'),'true');assert.equal(choice.getAttribute('disabled'),'');
 }
 assert.equal(create('tag',{variant:'selected'}).getAttribute('aria-pressed'),'true');
 assert.equal(create('tag',{variant:'selected',pressed:false}).getAttribute('data-variant'),'default');
 assert.throws(()=>create('action-button',{variant:'icon-only',icon:'×'}),/accessible name/);
 const css=generateCSS(themes[0]);
 assert.ok([...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(([,selectors,body])=>selectors.includes('.ds-action-button[aria-busy="true"] > .ds-action-button__progress')&&body.includes('display: inline-block;')),'busy action-button must display its progress part, including when legacy selectors are emitted');
 assert.match(css,/\.ds-avatar-group__item:focus-within/);
});

test('format 1 preserves custom avatar anatomy instead of replacing it with the shared preview',()=>{
 const legacy=materializePackage(themes[0]);
 legacy.components.avatar={name:'Historisk avatar',description:'Et eksisterende produkts navngivne identitet.',usage:'Bevar produktets eksisterende dele.',composes:[],parts:{root:{selector:'.ds-custom-avatar',styles:{}},name:{selector:'.ds-custom-avatar__name',styles:{}}},variants:{},states:{},preview:{tag:'span',part:'root',children:[{tag:'strong',part:'name',text:'Et bevaret navn'}]}};
 legacy.components['avatar-group']={name:'Historisk gruppe',description:'En eksisterende produktgruppe.',usage:'Bevar produktets markup.',composes:['avatar'],parts:{root:{selector:'.ds-custom-avatar-group',styles:{}}},variants:{},states:{},preview:{tag:'div',part:'root',children:[{component:'avatar'}]}};
 const document=dom(),create=createComponentFactory(legacy,{document});
 const avatar=create('avatar'),group=create('avatar-group');
 assert.equal(avatar.className,'ds-custom-avatar');assert.equal(avatar.querySelector('strong').textContent,'Et bevaret navn');
 assert.equal(group.tagName,'DIV');assert.equal(group.querySelector('.ds-custom-avatar__name').textContent,'Et bevaret navn');
});

test('nested content preserves component boundaries and long text is allowed to shrink and wrap',()=>{
 const document=dom(),create=createComponentFactory(themes[0],{document}),long='EtMegetLangtProjektnavnUdenNaturligeMellemrum'.repeat(4);
 const card=create('card',{slots:{header:long,body:[{component:'card',options:{slots:{header:'Indlejret kort',body:long,footer:[{component:'button',options:{text:'Gem',iconName:'device-floppy'}}]}}}]}});
 assert.equal(card.querySelectorAll('.ds-card').length,1);assert.equal(card.querySelectorAll('.ds-card__body').length,2);assert.ok(card.querySelector('.ds-button'));
 for(const id of ['card','badge'])assert.equal(COMPONENT_LIBRARY[id].parts.root.styles.overflowWrap,'anywhere');
 for(const part of ['header','body'])assert.equal(COMPONENT_LIBRARY.card.parts[part].styles.minWidth,'0');
 assert.equal(COMPONENT_LIBRARY['metric-row'].parts.value.styles.whiteSpace,'normal');
 const example=renderContentExample(themes[0],'content-example',createComponentRenderer(themes[0]));
 assert.match(example,/data-avatar-image="true"/);assert.match(example,/data-content-toggle="true"/);assert.match(example,/aria-label="Visning af arbejdsområdet"/);assert.match(example,/Gemmer ændringer/);
});
