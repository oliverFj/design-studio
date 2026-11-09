import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePackage,resolveTokens,materializePackage} from '../core/engine.mjs';
import {resolveThemeMode,resolveThemeModeId,themeModeOptions,createColorModePreference} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const color=value=>({$type:'color',$value:value,description:'A deliberate mode-quality regression.'});

test('all authored appearances resolve to independent valid snapshots and preserve editable sources',()=>{
 for(const id of PUBLIC_THEME_IDS){
  const pack=theme(id),before=structuredClone(pack);
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]},id);
  const snapshots=Object.keys(pack.modes??{}).map(id=>resolveThemeMode(pack,id));
  for(const snapshot of snapshots){
   assert.equal(snapshot.modes,undefined);assert.equal(snapshot.defaultMode,undefined);
   assert.deepEqual(validatePackage(snapshot),{valid:true,errors:[]},id);
   assert.equal(snapshot.id,pack.id);assert.deepEqual(snapshot.brand,pack.brand);
  }
  const [light,dark]=snapshots;
  if(dark)assert.notEqual(resolveTokens(light)['color.background.canvas'],resolveTokens(dark)['color.background.canvas'],id+' has distinct authored appearances');
  light.tokens['color.background.canvas'].$value='#abcdef';
  if(light.brand?.principles?.length)light.brand.principles[0]='A changed snapshot';
  assert.deepEqual(pack,before,id+' remains an editable source, including its mode overrides');
 }
});

test('named colorways use their own labels and native schemes without inventing a dark appearance',()=>{
 const pack=theme('bauhaus');
 // A deliberately light-only authoring fixture remains supported even when
 // the shipped collection also supplies a dark color.
 pack.modes=Object.fromEntries(['solgul','kalk','signalroed'].map(id=>[id,pack.modes[id]]));
 const before=structuredClone(pack);
 assert.deepEqual(themeModeOptions(pack),[{value:'solgul',label:'Solgul'},{value:'kalk',label:'Kalk'},{value:'signalroed',label:'Signalrød'}]);
 assert.equal(pack.modes.dark,undefined);
 assert.equal(resolveThemeModeId(pack,'system','dark'),'solgul');
 assert.equal(resolveThemeModeId(pack,'dark'),'solgul');
 assert.equal(resolveTokens(resolveThemeMode(pack,'kalk'))['color.background.canvas'],'#fffbea');
 assert.notEqual(resolveTokens(resolveThemeMode(pack,'signalroed'))['color.action.primary.rest.surface'],resolveTokens(resolveThemeMode(pack,'solgul'))['color.action.primary.rest.surface']);
 assert.deepEqual(pack,before);
 for(const mutate of [
  p=>{p.defaultMode='missing';},p=>{delete p.modes.kalk.name;},p=>{p.modes.kalk.colorScheme='sepia';},
  p=>{p.modes.system=p.modes.kalk;},p=>{p.modes.kalk.appearance={};},
  p=>{p.modes.kalk.tokens['color.text.primary']=color('{color.background.canvas}');}
 ]){const invalid=structuredClone(pack);mutate(invalid);assert.equal(validatePackage(invalid).valid,false);}
});

test('single-mode and legacy themes are not silently converted by color preference',()=>{
 const single=theme('midnight-editorial');delete single.modes;delete single.defaultMode;
 for(const mode of ['light','dark','system'])assert.deepEqual(resolveThemeMode(single,mode),single);
 const legacy=materializePackage(single);
 assert.deepEqual(resolveThemeMode(legacy,'dark'),legacy);
 assert.throws(()=>resolveThemeMode(single,'sepia'),/Unknown color mode/);
 assert.throws(()=>resolveThemeMode(single,'system','automatic'),/Unknown color mode/);
});

test('paired theme validation rejects missing modes, unknown schema fields and quality failures in either mode',()=>{
 const pairedTheme=()=>{
  const pack=theme('studio-light');
  pack.modes=Object.fromEntries(['light','dark'].map(id=>[id,{tokens:pack.modes[id].tokens}]));
  pack.defaultMode='light';
  return pack;
 };
 const mutations=[
  pack=>{delete pack.modes.light;},
  pack=>{delete pack.modes.dark;},
  pack=>{delete pack.defaultMode;},
  pack=>{pack.defaultMode='system';},
  pack=>{pack.modes.sepia={tokens:{}};},
  pack=>{pack.modes.light.appearance={};},
  pack=>{pack.modes.dark.tokens=[];},
  pack=>{pack.modes.dark.tokens['color.text.primary']=color('{color.background.canvas}');},
  pack=>{pack.modes.light.tokens['color.border.field']=color('{color.background.canvas}');},
 ];
 for(const mutate of mutations){const pack=pairedTheme();mutate(pack);const checked=validatePackage(pack);assert.equal(checked.valid,false);assert.ok(checked.errors.some(error=>/modes|defaultMode/.test(error)),checked.errors.join('\n'));}
 const unpaired=theme('studio-light');delete unpaired.modes;
 assert.match(validatePackage(unpaired).errors.join('\n'),/defaultMode requires/);
 const bad=theme('studio-light');bad.modes.dark.tokens['color.text.primary']=color('{color.background.canvas}');
 assert.match(validatePackage(bad).errors.join('\n'),/modes.dark.*contrast/,'validating the unselected base must not conceal a broken dark mode');
});

test('modes repeating the base still enforce override envelopes and changed token definitions',()=>{
 const repeated=theme('studio-light');
 repeated.modes={light:{tokens:structuredClone(repeated.tokens)},dark:{tokens:{}}};
 const before=structuredClone(repeated);
 assert.deepEqual(validatePackage(repeated),{valid:true,errors:[]});assert.deepEqual(repeated,before);
 const unknownField=structuredClone(repeated);unknownField.modes.light.appearance={};
 assert.match(validatePackage(unknownField).errors.join('\n'),/modes.light.appearance/);
 const changedDefinition=structuredClone(repeated);changedDefinition.modes.light.tokens['color.border.field'].unknown=true;
 assert.match(validatePackage(changedDefinition).errors.join('\n'),/modes.light.*unknown/);
 const changedValue=structuredClone(repeated);changedValue.modes.dark.tokens['color.border.field']=color('{color.background.canvas}');
 assert.match(validatePackage(changedValue).errors.join('\n'),/modes.dark.*contrast/);
 const invalidBase=structuredClone(repeated);invalidBase.tokens['color.border.field']=color('{color.background.canvas}');
 assert.equal(validatePackage(invalidBase).valid,false,'valid mode overrides cannot make an invalid base valid');
});

function mediaFixture(initial=false,legacy=false){
 const listeners=new Set();
 const media={matches:initial};
 if(legacy){media.addListener=fn=>listeners.add(fn);media.removeListener=fn=>listeners.delete(fn);}
 else{media.addEventListener=(type,fn)=>{assert.equal(type,'change');listeners.add(fn);};media.removeEventListener=(type,fn)=>{assert.equal(type,'change');listeners.delete(fn);};}
 return {media,listeners,change(matches){media.matches=matches;for(const fn of [...listeners])fn({matches});}};
}

test('saved manual preference wins over OS events; automatic choice follows OS and persists explicitly',()=>{
 const values=new Map([['product.mode','dark']]),calls=[],fixture=mediaFixture(false);
 const preference=createColorModePreference({key:'product.mode',storage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},media:fixture.media,onChange:(resolved,value)=>calls.push([resolved,value])});
 assert.equal(preference.value,'dark');assert.equal(preference.resolved,'dark');
 fixture.change(true);fixture.change(false);assert.equal(calls.length,0,'OS changes cannot replace a manual choice');
 preference.set('light');assert.deepEqual(calls.at(-1),['light','light']);assert.equal(values.get('product.mode'),'light');
 preference.set('system');fixture.change(true);assert.deepEqual(calls.at(-1),['dark','system']);
 fixture.change(false);assert.deepEqual(calls.at(-1),['light','system']);assert.equal(values.get('product.mode'),'system');
 const before=calls.length;assert.throws(()=>preference.set('sepia'),/Unknown color mode/);assert.equal(preference.value,'system');assert.equal(calls.length,before);
 const listener=[...fixture.listeners][0];preference.destroy();preference.destroy();
 assert.equal(fixture.listeners.size,0);fixture.change(true);listener({matches:true});assert.equal(calls.length,before,'neither queued nor future media events survive destroy');
 assert.throws(()=>preference.set('dark'),/destroyed/);
});

test('blocked storage, invalid stored choices and older media-listener APIs remain usable',()=>{
 const fixture=mediaFixture(true,true),calls=[];
 const preference=createColorModePreference({media:fixture.media,storage:{getItem(){throw new Error('Storage is blocked');},setItem(){throw new Error('Storage is blocked');}},onChange:(...args)=>calls.push(args)});
 assert.equal(preference.value,'system');assert.equal(preference.resolved,'dark');
 preference.set('light');assert.equal(preference.resolved,'light');assert.deepEqual(calls.at(-1),['light','light']);
 preference.set('system');fixture.change(false);assert.deepEqual(calls.at(-1),['light','system']);preference.destroy();assert.equal(fixture.listeners.size,0);
 const invalid=createColorModePreference({storage:{getItem(){return 'unrecognised';}},media:fixture.media});assert.equal(invalid.value,'system');invalid.destroy();
 const missing=createColorModePreference({storage:{},media:{}});assert.equal(missing.resolved,'light');missing.set('dark');assert.equal(missing.resolved,'dark');missing.destroy();
});

test('denied localStorage access does not prevent a file/private-context preference',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Access denied');}});
  const preference=createColorModePreference({media:{matches:true}});assert.equal(preference.resolved,'dark');preference.set('light');assert.equal(preference.resolved,'light');preference.destroy();
 }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;}
});
