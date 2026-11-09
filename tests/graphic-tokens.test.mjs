import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GRAPHIC_FAMILY_IDS,DEFAULT_GRAPHIC_FAMILY,GRAPHIC_TOKEN_DEFAULTS,GRAPHIC_TOKEN_BINDINGS} from '../core/graphic-tokens.mjs';
import {DEFAULT_TOKENS} from '../core/library.mjs';
import {validatePackage,resolveTokens,generateCSS,materializePackage,migratePackage,normalizeThemeReferences} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const load=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const minimal=()=>({schemaVersion:2,id:'graphic-fallback',name:'Graphic fallback',description:'An older format 2 theme without an illustration register.',tokens:{},history:[]});
const token=($type,$value)=>({$type,$value,description:'Illustration contract fixture.'});
const errorText=pack=>validatePackage(pack).errors.join('\n');

test('older format 2 themes receive independent illustration defaults without source mutation',()=>{
  const pack=minimal(),before=structuredClone(pack),resolved=resolveTokens(pack);
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
  assert.equal(DEFAULT_GRAPHIC_FAMILY,'anatomy');
  assert.equal(Object.keys(GRAPHIC_TOKEN_BINDINGS).length,11);
  for(const [id,definition]of Object.entries(GRAPHIC_TOKEN_DEFAULTS)){
    assert.deepEqual(DEFAULT_TOKENS[id],definition,id);
    assert.equal(resolved[id],definition.$value,id);
    assert.equal(String(definition.$value).includes('{'),false,id+' has a curated fallback, independent of UI roles');
  }
  const css=generateCSS(pack).split('\n').filter(line=>line.trim().startsWith('--ds-')).join('\n');
  assert.match(css,/--ds-illustration-family: anatomy;/);
  assert.match(css,/--ds-color-illustration-counterpoint: #72a09c;/);
  assert.match(css,/--ds-illustration-material-lineWidth: 1.8;/);
  assert.match(css,/--ds-duration-illustration: 3200ms;/);
  assert.deepEqual(pack,before);
});

test('family metadata validates, round-trips and remains passive in a materialized legacy read model',()=>{
  for(const family of GRAPHIC_FAMILY_IDS){
    const pack={...minimal(),graphics:{family}},before=structuredClone(pack);
    const reopened=normalizeThemeReferences(JSON.parse(JSON.stringify(pack)));
    assert.deepEqual(reopened.graphics,{family});
    assert.match(generateCSS(reopened),new RegExp('--ds-illustration-family: '+family+';'));
    const model=materializePackage(reopened);
    assert.equal(model.schemaVersion,1);
    assert.deepEqual(model.graphics,{family});
    assert.deepEqual(validatePackage(model),{valid:true,errors:[]});
    assert.doesNotThrow(()=>generateCSS(model));
    assert.doesNotMatch(generateCSS(model),/--ds-illustration-family:/,'legacy CSS does not adopt new rendering rules implicitly');
    assert.deepEqual(migratePackage(model).graphics,{family},'explicit migration preserves the chosen family');
    assert.deepEqual(pack,before);
  }
  for(const graphics of [null,[],{},'anatomy',{family:'other'},{family:'anatomy',layout:'local'},{family:'anatomy; color:red'}]){
    assert.equal(validatePackage({...minimal(),graphics}).valid,false,JSON.stringify(graphics));
    assert.match(errorText({...minimal(),graphics}),/graphics/);
  }
});

test('illustration material bounds validate resolved aliases and every authored mode',()=>{
  for(const [$value,id,$type]of [
    [0,'illustration.material.lineWidth','number'],[-1,'illustration.material.lineWidth','number'],
    [-.01,'illustration.material.depthOpacity','number'],[1.01,'illustration.material.depthOpacity','number'],
    ['0ms','duration.illustration','duration'],['0s','duration.illustration','duration']
  ]){
    const pack=minimal();pack.tokens[id]=token($type,$value);
    assert.match(errorText(pack),new RegExp(id.replaceAll('.','\\.')));
  }
  for(const value of [0,1]){
    const pack=minimal();pack.tokens['illustration.material.depthOpacity']=token('number',value);
    assert.equal(validatePackage(pack).valid,true);
  }
  const aliased=minimal();
  aliased.tokens['graphic.test.zero']=token('number',0);
  aliased.tokens['illustration.material.lineWidth']=token('number','{graphic.test.zero}');
  assert.match(errorText(aliased),/lineWidth.*positive/);
  const durationAlias=minimal();
  durationAlias.tokens['graphic.test.duration']=token('duration','0s');
  durationAlias.tokens['duration.illustration']=token('duration','{graphic.test.duration}');
  assert.match(errorText(durationAlias),/duration.illustration.*positive/);
  const wrongType=minimal();wrongType.tokens['illustration.material.lineWidth']=token('dimension','2px');
  assert.match(errorText(wrongType),/lineWidth.*type number/);
  const named=load('porcelaen');named.modes.celadon.tokens['illustration.material.depthOpacity']=token('number',2);
  assert.match(errorText(named),/modes.celadon.*depthOpacity/);
});

test('shipped themes recommend a family and keep material geometry stable across colors',()=>{
  for(const id of PUBLIC_THEME_IDS){
    const pack=load(id),before=structuredClone(pack);
    assert.ok(GRAPHIC_FAMILY_IDS.includes(pack.graphics?.family),id+' recommends a registered family');
    const base=resolveTokens(pack);
    const defaultColors=resolveTokens(resolveThemeMode(pack,pack.defaultMode));
    for(const tokenId of Object.keys(GRAPHIC_TOKEN_DEFAULTS))assert.equal(base[tokenId],defaultColors[tokenId],id+' base matches the default color: '+tokenId);
    for(const mode of Object.keys(pack.modes)){
      const snapshot=resolveThemeMode(pack,mode);
      assert.deepEqual(validatePackage(snapshot),{valid:true,errors:[]},id+'/'+mode);
      assert.deepEqual(snapshot.graphics,pack.graphics);
      for(const [tokenId,definition]of Object.entries(GRAPHIC_TOKEN_DEFAULTS)){
        const authored=pack.modes[mode].tokens[tokenId]??pack.tokens[tokenId];
        assert.equal(authored?.$type,definition.$type,id+'/'+mode+': '+tokenId);
        if(definition.$type!=='color')assert.equal(resolveTokens(snapshot)[tokenId],base[tokenId],id+'/'+mode+' preserves '+tokenId);
      }
    }
    assert.deepEqual(pack,before);
  }
  const signal=resolveTokens(resolveThemeMode(load('signal'),'light'));
  assert.equal(signal['color.illustration.subject'],'#3157cf');
  assert.notEqual(signal['color.illustration.subject'],signal['color.action.primary.rest.surface']);
  assert.equal(load('porcelaen').modes.celadon.name,'Celadon');
  assert.equal(load('terminal').modes.rav.name,'Rav');
  for(const mode of ['solgul','kalk','signalroed'])assert.ok(load('bauhaus').modes[mode]);
});

test('unmigrated format 1 packages gain neither illustration tokens nor family metadata',()=>{
  const legacy=materializePackage(minimal());
  for(const id of Object.keys(GRAPHIC_TOKEN_DEFAULTS))delete legacy.tokens[id];
  const before=JSON.stringify(legacy);
  assert.deepEqual(validatePackage(legacy),{valid:true,errors:[]});
  assert.equal(resolveTokens(legacy)['color.illustration.ground'],undefined);
  assert.equal(legacy.graphics,undefined);
  assert.doesNotMatch(generateCSS(legacy),/--ds-(?:color-illustration|illustration-family|duration-illustration)/);
  assert.equal(JSON.stringify(legacy),before);
  const migrated=migratePackage(legacy);
  assert.equal(migrated.schemaVersion,2);
  assert.equal(resolveTokens(migrated)['duration.illustration'],'3200ms');
  assert.equal(JSON.stringify(legacy),before);
});

test('the package schema exposes the same optional family and material contract',()=>{
  const schema=JSON.parse(readFileSync(new URL('../schema/design-package.schema.json',import.meta.url),'utf8'));
  assert.equal(schema.properties.graphics.$ref,'#/$defs/graphics');
  assert.deepEqual(schema.$defs.graphics.properties.family.enum,[...GRAPHIC_FAMILY_IDS]);
  assert.equal(schema.$defs.graphics.additionalProperties,false);
  assert.equal(schema.required.includes('graphics'),false);
  assert.equal(schema.properties.tokens.properties['illustration.material.lineWidth'].allOf[1].properties.$value.anyOf[0].exclusiveMinimum,0);
  assert.equal(schema.properties.tokens.properties['illustration.material.depthOpacity'].allOf[1].properties.$value.anyOf[0].maximum,1);
});
