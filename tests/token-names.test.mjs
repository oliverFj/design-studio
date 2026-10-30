import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_TOKENS,COMPONENT_LIBRARY} from '../core/library.mjs';
import {TOKEN_NAME_ALIASES} from '../core/scales.mjs';
import {validatePackage,resolveTokens,normalizeThemeReferences,generateCSS} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const token=value=>({$type:'dimension',$value:value,description:'Compatibility test value.'});
test('old v2 overrides feed canonical recipes; explicit canonical values win without mutating sources',()=>{
 const old={schemaVersion:2,id:'compat',name:'Compat',description:'Token compatibility.',tokens:{'space.4':token('1.2rem'),'space.px4':token('3px')},history:[]};
 const before=structuredClone(old),resolved=resolveTokens(old);
 assert.equal(resolved['space.scale.4'],'1.2rem');assert.equal(resolved['space.4'],'1.2rem');
 assert.equal(resolved['space.control.inset'],'3px');assert.equal(resolved['space.px4'],'3px');
 assert.match(generateCSS(old),/--ds-space-4: 1.2rem/);
 const normalized=normalizeThemeReferences(old);assert.equal(normalized.tokens['space.4'],undefined);assert.equal(normalized.tokens['space.scale.4'].$value,'1.2rem');
 old.tokens['space.scale.4']=token('1.1rem');assert.equal(resolveTokens(old)['space.4'],'1.1rem');
 assert.deepEqual(before.tokens,{'space.4':token('1.2rem'),'space.px4':token('3px')});
 const invalid=structuredClone(before);invalid.tokens['space.4']=token('0');assert.equal(validatePackage(invalid).valid,false);
});

test('legacy mode overrides take precedence over canonical base values',()=>{
 const pack=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
 pack.modes.dark.tokens['space.4']=token('1.2rem');
 assert.equal(resolveTokens(resolveThemeMode(pack,'dark'))['space.scale.4'],'1.2rem');
 assert.equal(validatePackage(pack).valid,true);
});

test('authored themes, shared recipes and canonical defaults have no deprecated token references',()=>{
 const refs=value=>[...JSON.stringify(value).matchAll(/\{([^{}]+)\}/g)].map(match=>match[1]);
 for(const id of PUBLIC_THEME_IDS){const theme=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));for(const key of [...Object.keys(theme.tokens),...Object.values(theme.modes).flatMap(mode=>Object.keys(mode.tokens)),...refs(theme)])assert.equal(Object.hasOwn(TOKEN_NAME_ALIASES,key),false,id+': '+key);}
 for(const key of refs(COMPONENT_LIBRARY))assert.equal(Object.hasOwn(TOKEN_NAME_ALIASES,key),false,key);
 for(const [key,value]of Object.entries(DEFAULT_TOKENS))if(!Object.hasOwn(TOKEN_NAME_ALIASES,key))for(const ref of refs(value))assert.equal(Object.hasOwn(TOKEN_NAME_ALIASES,ref),false,key+' -> '+ref);
});
