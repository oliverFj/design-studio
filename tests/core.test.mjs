import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePackage, resolveTokens, generateCSS, validateCompatibility, brandAssetDataURL, getComponents, materializePackage, migratePackage} from '../core/engine.mjs';
import {REQUIRED_TOKENS, COMPONENT_CONTRACTS} from '../core/contract.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const themeFixture = id => JSON.parse(readFileSync(new URL(`../packages/${id}.json`, import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const fixture = id => materializePackage(themeFixture(id));
const base = () => fixture('studio-light');
const errorsFor = pack => {const result = validatePackage(pack); assert.equal(result.valid, false); return result.errors.join('\n');};
const token = (type, value) => ({$type:type, $value:value, description:'Test token'});

test('both visual packages satisfy one contract and replace each other', () => {
  const first=base(), second=fixture('midnight-editorial');
  assert.deepEqual(validatePackage(first), {valid:true, errors:[]});
  assert.deepEqual(validatePackage(second), {valid:true, errors:[]});
  assert.deepEqual(validateCompatibility(first, second), {compatible:true, errors:[]});
  assert.deepEqual(validateCompatibility(second, first), {compatible:true, errors:[]});
  assert.notEqual(generateCSS(first), generateCSS(second));
});
test('schema and runtime share required tokens and component contract', () => {
  const schema=JSON.parse(readFileSync(new URL('../schema/design-package.schema.json', import.meta.url),'utf8'));
  assert.deepEqual(schema.allOf[0].then.properties.tokens.required, Object.keys(REQUIRED_TOKENS));
  assert.deepEqual(schema.properties.components.required, Object.keys(COMPONENT_CONTRACTS));
});
test('alias chains resolve without changing package data', () => {
  const pack=base();
  pack.tokens['color.brand.alias']=token('color', '{color.action.primary}');
  pack.tokens['color.brand.alias2']=token('color', '{color.brand.alias}');
  const before=JSON.stringify(pack);
  assert.equal(resolveTokens(pack)['color.brand.alias2'],pack.tokens['color.action.primary'].$value);
  assert.equal(JSON.stringify(pack),before);
});
test('missing references in token aliases and style recipes are explained', () => {
  const pack=base();
  pack.tokens['color.brand.alias']=token('color','{color.missing}');
  pack.components.button.parts.root.styles.padding='{space.missing}';
  const errors=errorsFor(pack);
  assert.match(errors,/color.missing: reference does not exist/);
  assert.match(errors,/styles.padding: token space.missing does not exist/);
  assert.throws(()=>generateCSS(pack),/Invalid design package/);
});
test('circular aliases and incompatible aliases fail validation', () => {
  const pack=base();
  pack.tokens['color.brand.a']=token('color','{color.brand.b}');
  pack.tokens['color.brand.b']=token('color','{color.brand.a}');
  assert.match(errorsFor(pack),/circular token alias/);
  const wrongType=base();
  wrongType.tokens['color.brand.a']=token('color','{space.1}');
  assert.match(errorsFor(wrongType),/expected color/);
});
test('tokens require correctly typed values and documented meanings', () => {
  const pack=base();
  pack.tokens['space.1'].$value='banana';
  pack.tokens['color.text.primary'].$value='#zzzzzz';
  pack.tokens['typography.weight.body'].$value=Infinity;
  delete pack.tokens['color.text.secondary'].description;
  const errors=errorsFor(pack);
  assert.match(errors,/invalid dimension/);
  assert.match(errors,/invalid color/);
  assert.match(errors,/invalid fontWeight/);
  assert.match(errors,/description: must be a non-empty string/);
});
test('CSS declaration, resource and selector injection is rejected', () => {
  for (const value of ['red; } body { display:none', 'url(https://attacker.invalid/a)', 'image-set("https://attacker.invalid/a" 1x)', 'expression(alert(1))', 'red/*oops*/', '"broken', 'calc(3px']) {
    const pack=base();
    pack.components.button.parts.root.styles.backgroundColor=value;
    assert.match(errorsFor(pack),/invalid or unsafe CSS/);
  }
  const pack=base();
  pack.components.button.parts.root.selector='.ds-button, body';
  assert.match(errorsFor(pack),/expected one .ds-/);
  const tokenInjection=base();
  tokenInjection.tokens['color.text.primary'].$value='red; color:blue';
  assert.match(errorsFor(tokenInjection),/invalid color/);
});
test('malformed references and unsupported property spelling fail', () => {
  const pack=base();
  pack.components.button.parts.root.styles.padding='{space 1}';
  pack.components.button.parts.root.styles['background-color']='#fff';
  assert.match(errorsFor(pack),/malformed token reference/);
  assert.match(errorsFor(pack),/unsupported CSS property/);
});
test('prototype keys, accessors and cyclic input objects are rejected safely', () => {
  const pack=base();
  pack.tokens=JSON.parse('{"__proto__":{"$type":"color","$value":"#fff","description":"Unsafe"}}');
  assert.match(errorsFor(pack),/reserved key/);
  const getter=base();
  Object.defineProperty(getter,'name',{get(){throw new Error('must not execute');},enumerable:true});
  assert.match(errorsFor(getter),/accessors are not allowed/);
  const cyclic=base();cyclic.history.push(cyclic);
  assert.match(errorsFor(cyclic),/circular object/);
});
test('foundational selectors, variants and states cannot drift', () => {
  const pack=base();
  pack.components.field.parts.control.selector='.ds-alternative';
  delete pack.components.button.variants.secondary;
  delete pack.components.button.states.focus;
  const errors=errorsFor(pack);
  assert.match(errors,/expected .ds-input/);
  assert.match(errors,/secondary: required foundation variant/);
  assert.match(errors,/focus: required foundation state/);
});
test('composition references are checked and cycles are rejected', () => {
  const pack=base();
  pack.components.button.composes=['card'];
  pack.components.card.composes=['button'];
  assert.match(errorsFor(pack),/circular composition/);
  const missing=base();missing.components.card.composes=['missing'];
  assert.match(errorsFor(missing),/component missing does not exist/);
});
test('CSS variables cannot collide through equivalent dotted and dashed names', () => {
  const pack=base();
  pack.tokens['brand.test']=token('color','#fff');
  pack.tokens['brand-test']=token('color','#000');
  assert.match(errorsFor(pack),/CSS variable collides/);
});
test('generated CSS scopes variables, recipes, variants and native control states', () => {
  const pack=base();
  pack.components.field.states.focus.parts = {control:{styles:{outline:'1px solid {color.action.primary}'}}};
  const css=generateCSS(pack,{scope:'#product'});
  assert.match(css,/#product \{/);
  assert.match(css,/--ds-color-text-primary:/);
  assert.match(css,/#product \.ds-button\[data-variant="primary"\]/);
  assert.match(css,/#product \.ds-button:focus-visible/);
  assert.match(css,/#product \.ds-field:focus-within \.ds-input/);
  assert.match(css,/#product \.ds-field \.ds-input:disabled/);
  assert.match(css,/var\(--ds-/);
  assert.doesNotMatch(css,/\{color\./);
  assert.throws(()=>generateCSS(pack,{scope:'body, *'}),/single class or ID selector/);
});
test('custom composite native controls map focus, checked and disabled within their scope', () => {
  const pack=base();
  for (const id of ['radio', 'switch']) {
    pack.components[id]={
      name:id, description:'Composite native control', usage:'Label wraps its own native input', composes:[],
      parts:{
        root:{selector:`.ds-${id}`,styles:{display:'inline-flex'}},
        control:{selector:`.ds-${id}__control`,styles:{accentColor:'{color.action.primary}'}},
        label:{selector:`.ds-${id}__label`,styles:{color:'{color.text.primary}'}}
      },
      variants:{},
      states:{
        focus:{description:'Focus within the composite',styles:{outline:'1px solid {color.action.primary}'}},
        checked:{description:'Native checked input marks the composite',styles:{color:'{color.action.primary}'},parts:{control:{styles:{backgroundColor:'{color.action.primary}'}}}},
        disabled:{description:'Native disabled control',parts:{control:{styles:{opacity:0.5}},label:{styles:{color:'{color.text.secondary}'}}}}
      },
      preview:{tag:'label',part:'root',children:[{tag:'input',part:'control',attrs:{type:id === 'radio' ? 'radio' : 'checkbox'}},{tag:'span',part:'label',text:'Native control'}]}
    };
  }
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
  const css=generateCSS(pack,{scope:'#product'});
  for (const id of ['radio', 'switch']) {
    const root=`#product .ds-${id}`;
    const checked=`${root}:is([aria-checked="true"], :has(.ds-${id}__control:checked))`;
    assert.ok(css.includes(`${root}:focus-within {`));
    assert.ok(css.includes(`${checked} {`));
    assert.ok(css.includes(`${checked} .ds-${id}__control {`));
    assert.ok(css.includes(`${root} .ds-${id}__control:disabled {\n  opacity: 0.5;\n}`));
    assert.ok(css.includes(`${root}:is(:disabled, [aria-disabled="true"], [data-state="disabled"]) .ds-${id}__label {`));
    assert.ok(!css.includes(`${root}:focus-visible`));
    assert.ok(!css.includes(`${root} .ds-${id}__label:disabled`));
  }
  pack.components.input.states.checked={description:'Standalone native checked control',styles:{color:'{color.action.primary}'}};
  const standaloneCSS=generateCSS(pack,{scope:'#product'});
  assert.ok(standaloneCSS.includes('#product .ds-input:focus-visible {'));
  assert.ok(standaloneCSS.includes('#product .ds-input:is(:checked, [aria-checked="true"]) {'));
});
test('replacement may extend vocabulary, but cannot remove used tokens and recipes', () => {
  const first=base(), second=base();
  first.tokens['color.brand.extra']=token('color','#aabbcc');
  first.components.button.variants.extra={description:'New choice',styles:{color:'{color.brand.extra}'}};
  const result=validateCompatibility(first,second);
  assert.equal(result.compatible,false);
  assert.match(result.errors.join('\n'),/missing a token/);
  assert.match(result.errors.join('\n'),/missing this variant/);
  assert.equal(validateCompatibility(second,first).compatible,true);
});
test('replacement preserves token types and composed elements', () => {
  const first=base(), second=base();
  first.tokens['brand.extra']=token('color','#fff');
  second.tokens['brand.extra']=token('dimension','1rem');
  first.components.card.composes=['button'];
  second.components.card.composes=[];
  const result=validateCompatibility(first,second);
  assert.equal(result.compatible,false);
  assert.match(result.errors.join('\n'),/changes token type/);
  assert.match(result.errors.join('\n'),/omits composed component button/);
});
test('preview trees support custom safe components without executable markup', () => {
  const pack=base();
  pack.components.notice={name:'Notice',description:'Test component',usage:'Status text',composes:[],parts:{root:{selector:'.ds-notice',styles:{padding:'{space.4}'}},label:{selector:'.ds-notice__label',styles:{color:'{color.text.primary}'}}},variants:{default:{description:'Default',styles:{}}},states:{},preview:{tag:'section',part:'root',variant:'default',children:[{tag:'strong',part:'label',text:'<escaped sample>'}]}};
  assert.equal(validatePackage(pack).valid,true);
  pack.components.notice.preview.children[0].attrs={onclick:'alert(1)'};
  assert.match(errorsFor(pack),/unsupported preview attribute/);
  delete pack.components.notice.preview.children[0].attrs;
  pack.components.notice.preview.children[0].tag='script';
  assert.match(errorsFor(pack),/unsupported preview tag/);
});
test('preview trees validate part references, input attributes and depth', () => {
  const pack=base();
  pack.components.button.preview={tag:'button',part:'missing',attrs:{disabled:'yes',type:'file'}};
  const errors=errorsFor(pack);
  assert.match(errors,/preview root must use root part/);
  assert.match(errors,/component part does not exist/);
  assert.match(errors,/must be boolean/);
  assert.match(errors,/unsupported input type/);
  const deep=base();
  let node={tag:'div',part:'root'};deep.components.card.preview=node;
  for(let index=0;index<14;index++){const child={tag:'div'};node.children=[child];node=child;}
  assert.match(errorsFor(deep),/preview exceeds maximum depth/);
});
test('invalid calendar dates and unknown package fields are rejected', () => {
  const pack=base();pack.history=[{date:'2026-02-30',note:'Invalid date'}];pack.typo=true;
  assert.match(errorsFor(pack),/valid YYYY-MM-DD/);
  assert.match(errorsFor(pack),/typo: unknown property/);
});

test('long alias chains are rejected without stack overflow', () => {
  const pack=base();
  for(let index=0;index<150;index++) pack.tokens['brand.chain'+index]=token('color',index===149?'#fff':'{brand.chain'+(index+1)+'}');
  assert.match(errorsFor(pack),/alias chain exceeds maximum depth/);
});


const brandFixture = () => ({
  name:'Fixture brand', summary:'A documented visual identity.',
  principles:[{id:'calm',title:'Calm',description:'Use clear hierarchy.'}],
  sections:[{id:'color',title:'Palette',description:'Use the existing color roles.',tokens:['color.background.canvas'],components:['button'],dos:['Use existing roles.'],donts:['Invent parallel roles.']}],
  logos:[], assets:[], sources:[{title:'Reference guide',location:'E:/Brand/Guide.html'}]
});
const assetFixture = (id, fileName, mimeType, data, font) => ({
  id,name:id,fileName,mimeType,data:Buffer.from(data).toString('base64'),description:'Embedded test resource',...(font?{font}:{})
});
const brandPack = () => {const pack=base();pack.brand=brandFixture();return pack;};

test('brand is optional, has explicit lists and does not constrain visual replacement', () => {
  const first=brandPack(), second=base();
  assert.deepEqual(validatePackage(first),{valid:true,errors:[]});
  assert.deepEqual(validateCompatibility(first,second),{compatible:true,errors:[]});
  delete first.brand.sections;
  assert.match(errorsFor(first),/brand.sections: must be an array/);
  const schema=JSON.parse(readFileSync(new URL('../schema/design-package.schema.json',import.meta.url),'utf8'));
  assert.equal(schema.required.includes('brand'),false);
  assert.deepEqual(schema.$defs.brand.required,['name','summary','principles','sections','logos','assets','sources']);
});

test('brand sections and logos reference existing typed roles and image resources', () => {
  const pack=brandPack();
  const svg=readFileSync(new URL('../assets/fjordside/logo/mark-terracotta.svg',import.meta.url));
  pack.brand.assets.push(assetFixture('mark','mark.svg','image/svg+xml',svg));
  pack.brand.logos.push({id:'mark',name:'Logo',asset:'mark',usage:'Place on paper.',background:'color.background.canvas',foreground:'color.text.primary'});
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
  pack.brand.sections[0].tokens=['missing'];pack.brand.sections[0].components=['missing'];
  pack.brand.logos[0].background='space.1';pack.brand.logos[0].asset='missing';
  const errors=errorsFor(pack);
  assert.match(errors,/sections.0.tokens.0: reference does not exist/);
  assert.match(errors,/sections.0.components.0: reference does not exist/);
  assert.match(errors,/logos.0.background: must reference an existing color token/);
  assert.match(errors,/logos.0.asset: must reference an existing image asset/);
});

test('brand rejects duplicate local IDs, unknown fields and malformed object data safely', () => {
  const pack=brandPack();pack.brand.principles.push({...pack.brand.principles[0]});pack.brand.sections[0].typo=true;
  assert.match(errorsFor(pack),/duplicate ID/);assert.match(errorsFor(pack),/typo: unknown property/);
  for (const value of [null,[],false,'brand']) { const malformed=base();malformed.brand=value;assert.match(errorsFor(malformed),/brand: must be an object/); }
  const malformed=brandPack();malformed.brand.assets=[null,{id:'bad',data:{value:'not base64'},font:null}];malformed.brand.logos=[{asset:{}}];malformed.brand.sources=[false];
  assert.doesNotThrow(()=>validatePackage(malformed));assert.equal(validatePackage(malformed).valid,false);
  const accessor=brandPack();Object.defineProperty(accessor.brand,'assets',{get(){throw new Error('must not execute');},enumerable:true});
  assert.match(errorsFor(accessor),/accessors are not allowed/);
  const reserved=brandPack();reserved.brand.sections[0]=JSON.parse('{"constructor":"unsafe"}');assert.match(errorsFor(reserved),/reserved key/);
});

test('embedded SVG supports Fjordside clip paths and passive presentation attributes', () => {
  const pack=brandPack();
  for (const [index,name] of ['mark-terracotta.svg','mark-paper.svg','mark-ink.svg','mark-currentcolor.svg'].entries()) {
    const svg=readFileSync(new URL('../assets/fjordside/logo/'+name,import.meta.url));
    pack.brand.assets.push(assetFixture('mark'+index,name,'image/svg+xml',svg));
  }
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
  assert.ok(brandAssetDataURL(pack.brand.assets[0]).startsWith('data:image/svg+xml;base64,'));
  const local='<svg xmlns="http://www.w3.org/2000/svg"><defs><path id="shape" d="M0 0h10v10z"/></defs><use href="#shape" style="fill:url(#shape);opacity:0.5"/></svg>';
  pack.brand.assets=[assetFixture('local','local.svg','image/svg+xml','<?xml version="1.0" encoding="UTF-8"?>\n<!-- Passive exported logo -->'+local)];
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
});

test('SVG scripts, events, foreign content, entities and external resources are rejected', () => {
  const unsafe=[
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>HTML</div></foreignObject></svg>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///secret">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.invalid/image.svg"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:url(https://example.invalid/a)"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:u&#114;l(https://example.invalid/a)"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><style>@import "https://example.invalid/a"</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:u\\72l(https://example.invalid/a)"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml,unsafe"/></svg>'
  ];
  for (const svg of unsafe) {
    const pack=brandPack();pack.brand.assets=[assetFixture('unsafe','unsafe.svg','image/svg+xml',svg)];
    assert.match(errorsFor(pack),/invalid or unsafe asset content/);
    assert.throws(()=>brandAssetDataURL(pack.brand.assets[0]),/unsafe brand asset/);
  }
});

test('asset payloads require canonical base64, matching content and a safe basename', () => {
  for (const data of ['Zg=', 'Zh==', 'Z g==', 'data:text/plain;base64,Zg==', '', {}, '\nZg==']) {
    const pack=brandPack();pack.brand.assets=[{...assetFixture('license','OFL.txt','text/plain','License'),data}];
    assert.match(errorsFor(pack),/canonical base64/);
  }
  for (const fileName of ['../OFL.txt','C:\\OFL.txt','sub/OFL.txt','OFL.html']) {
    const pack=brandPack();pack.brand.assets=[assetFixture('license',fileName,'text/plain','License')];
    assert.match(errorsFor(pack),/basename with a matching extension/);
  }
  const collision=brandPack();collision.brand.assets=[assetFixture('first','OFL.txt','text/plain','License'),assetFixture('second','ofl.TXT','text/plain','License')];
  assert.match(errorsFor(collision),/duplicate filename/);
  const wrongContent=brandPack();wrongContent.brand.assets=[assetFixture('image','image.png','image/png','this is not PNG')];
  assert.match(errorsFor(wrongContent),/invalid or unsafe asset content/);
  const licenseLogo=brandPack();licenseLogo.brand.assets=[assetFixture('license','OFL.txt','text/plain','License')];licenseLogo.brand.logos=[{id:'wrong',name:'Wrong',asset:'license',usage:'Not an image'}];
  assert.match(errorsFor(licenseLogo),/existing image asset/);
});

test('brand limits bound both entry counts and decoded asset sizes', () => {
  const tooLarge=brandPack();tooLarge.brand.assets=[assetFixture('large','large.txt','text/plain',Buffer.alloc(262145,65))];
  assert.match(errorsFor(tooLarge),/canonical base64 containing 1–262144 bytes/);
  const combined=brandPack();combined.brand.assets=[0,1,2].map(index=>assetFixture('large'+index,'large'+index+'.txt','text/plain',Buffer.alloc(200000,65)));
  assert.match(errorsFor(combined),/maximum combined size/);
  for (const [key,count] of Object.entries({principles:31,sections:61,logos:31,assets:31,sources:21})) {
    const pack=brandPack();pack.brand[key]=Array.from({length:count},()=>({}));
    assert.match(errorsFor(pack),new RegExp('brand.'+key+': maximum of'));
  }
});

test('font assets generate standalone font faces without external paths', () => {
  const pack=brandPack(), font=readFileSync(new URL('../assets/fjordside/fonts/Platypi-variable.ttf',import.meta.url));
  pack.brand.assets=[assetFixture('voice','Platypi-variable.ttf','font/ttf',font,{family:'Platypi',style:'normal',weight:'300 800'})];
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
  const css=generateCSS(pack);
  assert.match(css,/@font-face \{/);assert.match(css,/font-family: "Platypi";/);assert.match(css,/font-weight: 300 800;/);
  assert.match(css,/font-display: swap;/);assert.match(css,/src: url\("data:font\/ttf;base64,/);assert.match(css,/format\("truetype"\)/);
  assert.doesNotMatch(css,/\.\.\/assets|https?:/);
  for (const update of [{family:'Bad"; color:red'},{style:'oblique'},{weight:'800 300'},{weight:99},{weight:450.5}]) {
    const wrong=structuredClone(pack);Object.assign(wrong.brand.assets[0].font,update);assert.equal(validatePackage(wrong).valid,false);
  }
  const missing=structuredClone(pack);delete missing.brand.assets[0].font;assert.match(errorsFor(missing),/required for font assets/);
  const wrongType=brandPack();wrongType.brand.assets=[assetFixture('license','OFL.txt','text/plain','License',{family:'Platypi',style:'normal',weight:400})];
  assert.match(errorsFor(wrongType),/only font assets/);
});
import {renderComponent, createComponent} from '../core/components.mjs';
import {COMPONENT_LIBRARY, DEFAULT_TOKENS, APPEARANCE_PROPERTIES, POSITIVE_SPACING_TOKENS} from '../core/library.mjs';

test('all v2 themes share every component, part, variant, state and declarative preview',()=>{
 const signature=components=>Object.fromEntries(Object.entries(components).map(([id,c])=>[id,{parts:Object.keys(c.parts),variants:Object.keys(c.variants),states:Object.keys(c.states),composes:c.composes,preview:c.preview}]));
 const expected=signature(COMPONENT_LIBRARY);
 for(const id of PUBLIC_THEME_IDS){
  const theme=themeFixture(id);
  assert.equal(theme.schemaVersion,2);assert.equal(Object.hasOwn(theme,'components'),false);
  assert.deepEqual(validatePackage(theme),{valid:true,errors:[]});
  assert.deepEqual(signature(getComponents(theme)),expected);
  for(const component of Object.values(getComponents(theme)))assert.ok(component.preview);
 }
});
test('Castle surfaces retain positive shared padding and gaps independently of theme recipes',()=>{
 const theme=themeFixture('castle-studio'),components=getComponents(theme),resolved=resolveTokens(theme),css=generateCSS(theme);
 for(const id of ['card','alert','dialog']){
  const reference=components[id].parts.root.styles.padding.match(/^\{(.+)\}$/)[1];
  assert.ok(POSITIVE_SPACING_TOKENS.includes(reference));assert.ok(parseFloat(resolved[reference])>0);
  assert.match(css,new RegExp('\\.ds-'+id+' \\{[\\s\\S]*?padding: var\\(--ds-space-component-padding'));
 }
 assert.match(css,/\.ds-dialog-host \{[\s\S]*?padding: 0;/);
});
test('new shared roles and documented tokens work with a minimal existing theme',()=>{
 const theme={schemaVersion:2,id:'minimal',name:'Minimal',description:'Uses the central defaults.',tokens:{'color.action.primary':token('color','#663399')},history:[]};
 assert.deepEqual(validatePackage(theme),{valid:true,errors:[]});
 assert.equal(resolveTokens(theme)['size.brand.logo'],DEFAULT_TOKENS['size.brand.logo'].$value);
 for(const id of ['action-button','range-field','inspector','tag','radio','switch','choice-field'])assert.match(renderComponent(theme,id),new RegExp('class="'+COMPONENT_LIBRARY[id].parts.root.selector.slice(1)+'"'));
 assert.equal(Object.hasOwn(theme,'components'),false);assert.equal(Object.keys(theme.tokens).length,1);
});
test('themes cannot remove padding, gap, component parts or the shared catalog',()=>{
 for(const property of ['padding','paddingInline','gap','display','width']){
  const theme=themeFixture('castle-studio');theme.appearance.card={parts:{root:{styles:{[property]:'0'}}}};
  assert.match(errorsFor(theme),/layout is owned by the shared library/);
 }
 const theme=themeFixture('studio-light');theme.components={};assert.match(errorsFor(theme),/components: unknown property/);
 const badPart=themeFixture('studio-light');badPart.appearance.card={parts:{other:{styles:{color:'#fff'}}}};assert.match(errorsFor(badPart),/shared component part does not exist/);
 for(const id of POSITIVE_SPACING_TOKENS){
  const zero=themeFixture('studio-light');zero.tokens[id]=token('dimension','0');assert.match(errorsFor(zero),/must resolve to a positive/);
  const alias=themeFixture('studio-light');alias.tokens['space.zero']=token('dimension','0px');alias.tokens[id]=token('dimension','{space.zero}');assert.match(errorsFor(alias),/must resolve to a positive/);
 }
 const indirect=themeFixture('studio-light');indirect.tokens['space.component.paddingLarge']=token('dimension','{space.6}');indirect.tokens['space.6'].$value='0';assert.match(errorsFor(indirect),/must resolve to a positive/);
});
test('schema appearance properties match runtime allowlist and reject v2 structural definitions',()=>{
 const schema=JSON.parse(readFileSync(new URL('../schema/design-package.schema.json',import.meta.url),'utf8'));
 assert.deepEqual(schema.$defs.appearanceStyles.propertyNames.enum,APPEARANCE_PROPERTIES);
 assert.deepEqual(schema.allOf[1].then.not,{required:['components']});
});
test('explicit migration is nonmutating and v1 CSS remains readable before migration',()=>{
 const legacy=base();legacy.components.card.parts.root.styles.padding='0';
 const before=JSON.stringify(legacy),css=generateCSS(legacy);
 assert.match(css,/\.ds-card \{[\s\S]*?padding: 0;/);
 const migrated=migratePackage(legacy);
 assert.equal(JSON.stringify(legacy),before);assert.equal(migrated.schemaVersion,2);assert.equal(Object.hasOwn(migrated,'components'),false);
 assert.deepEqual(validatePackage(migrated),{valid:true,errors:[]});assert.notEqual(getComponents(migrated).card.parts.root.styles.padding,'0');
 const custom=base();custom.components.custom={...structuredClone(custom.components.text),parts:{root:{selector:'.ds-custom',styles:{}}}};
 assert.throws(()=>migratePackage(custom),/register its shared definition/);
});
test('shared renderer escapes content, preserves slot part classes and connects native fields',()=>{
 const theme=themeFixture('studio-light');
 const html=renderComponent(theme,'card',{slots:{header:{tag:'h3',text:'<script>unsafe</script>'},body:[{component:'field',options:{idPrefix:'account',label:'Konto',hint:'Din konto',error:'Udfyld konto',name:'account'}}],footer:[{component:'button',options:{text:'Gem',variant:'primary'}}]}});
 assert.match(html,/&lt;script&gt;unsafe&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);
 assert.match(html,/<h3 class="ds-card__header">/);assert.match(html,/<div class="ds-card__body">/);assert.match(html,/<footer class="ds-card__footer">/);
 assert.match(html,/for="account-control"/);assert.match(html,/id="account-control" aria-describedby="account-hint account-error" aria-invalid="true"/);
 assert.match(html,/id="account-hint"/);assert.match(html,/id="account-error"/);
 assert.throws(()=>renderComponent(theme,'button',{attrs:{onclick:'alert(1)'}}),/Unsupported component attribute/);
 assert.throws(()=>renderComponent(theme,'card',{slots:{body:{tag:'script',text:'unsafe'}}}),/Unsupported component tag/);
});
test('shared native DOM API uses one tree without innerHTML and native dialog semantics',()=>{
 const document={createElement(tag){return {tag,attrs:{},children:[],setAttribute(name,value){this.attrs[name]=value;},appendChild(child){this.children.push(child);}};},createTextNode(text){return {text};}};
 const theme=themeFixture('studio-light'),element=createComponent(theme,'dialog',{idPrefix:'save',open:true,slots:{footer:[{component:'button',options:{text:'Gem'}}]}},{document});
 assert.equal(element.tag,'dialog');assert.equal(element.attrs.open,'');assert.equal(element.attrs['aria-labelledby'],'save-title');assert.equal(element.children[0].attrs.class,'ds-dialog');
 const closed=renderComponent(theme,'dialog',{idPrefix:'closed'});assert.match(closed,/<dialog /);assert.doesNotMatch(closed,/ open>/);
});
test('brand renderer uses approved originals and generic previews never redraw a logo',()=>{
 const fjordside=themeFixture('fjordside'),logo=fjordside.brand.logos[0],asset=fjordside.brand.assets.find(asset=>asset.id===logo.asset);
 const html=renderComponent(fjordside,'brand-mark');assert.ok(html.includes(brandAssetDataURL(asset)));assert.match(html,/<img class="ds-brand-mark__asset"/);
 assert.equal(renderComponent(themeFixture('studio-light'),'brand-mark'),'<div class="ds-brand-mark"><span class="ds-brand-mark__name">Dit brand</span></div>');
});
test('native checkbox false overrides preview defaults and explicit disabled states disable controls',()=>{
 const theme=themeFixture('studio-light');
 assert.doesNotMatch(renderComponent(theme,'checkbox',{checked:false}),/ checked/);
 assert.match(renderComponent(theme,'button',{state:'disabled'}),/<button[^>]* disabled/);
 assert.match(renderComponent(theme,'input',{state:'disabled'}),/<input[^>]* disabled/);
});
test('shared fallback roles follow foundation tokens while explicit theme values take precedence',()=>{
 const minimal={schemaVersion:2,id:'fallback-roles',name:'Fallback roles',description:'Semantic alias fixture.',history:[],tokens:{
  'color.text.primary':token('color','#222238'),
  'color.text.secondary':token('color','#566278'),
  'color.background.surface':token('color','#fcfcff'),
  'typography.font.heading':token('fontFamily','Georgia, serif'),
  'radius.control':token('dimension','0.625rem')
 }};
 const aliases={
  'color.text.label':'color.text.secondary','color.text.muted':'color.text.secondary',
  'color.background.control':'color.background.surface','color.background.detail':'color.background.surface',
  'color.narrative.text':'color.caption.text','color.narrative.clock':'color.caption.labelSurface',
  'typography.font.narrative':'typography.font.expressive','typography.font.expressive':'typography.font.heading',
  'radius.tool':'radius.actionButton','radius.actionButton':'radius.control','radius.segment':'radius.control'
 };
 const defaults=resolveTokens(minimal);
 for(const [role,target] of Object.entries(aliases)){
  assert.equal(DEFAULT_TOKENS[role].$value,'{'+target+'}',role+' documents its fallback');
  assert.equal(defaults[role],defaults[target],role+' follows the selected foundation');
 }
 const explicit=structuredClone(minimal);
 explicit.tokens['color.background.control']=token('color','#f2f0ec');
 explicit.tokens['color.text.label']=token('color','#535a61');
 explicit.tokens['radius.segment']=token('dimension','0.375rem');
 const before=JSON.stringify(explicit),resolved=resolveTokens(explicit);
 for(const role of ['color.background.control','color.text.label','radius.segment'])assert.equal(resolved[role],explicit.tokens[role].$value);
 assert.equal(resolved['color.background.detail'],resolved['color.background.surface']);
 assert.equal(JSON.stringify(explicit),before,'Resolving fallbacks never changes explicit theme data.');
 const castleTheme=themeFixture('castle-studio'),castle=resolveTokens(castleTheme);
 for(const role of ['typography.font.expressive','radius.actionButton'])assert.equal(castle[role],castleTheme.tokens[role].$value);
 assert.equal(getComponents(minimal).badge.variants.data.styles.borderColor,COMPONENT_LIBRARY.badge.variants.data.styles.borderColor);
 explicit.tokens['color.palette.fjord']=token('color','#35616e');
 explicit.appearance={badge:{variants:{data:{styles:{borderColor:'{color.palette.fjord}'}}}}};
 assert.equal(getComponents(explicit).badge.variants.data.styles.borderColor,'{color.palette.fjord}','Explicit brand colour recipes override the shared fallback.');
});

test('v2 CSS hides closed native dialog hosts while v1 CSS remains unchanged',()=>{
 const theme=themeFixture('studio-light'),css=generateCSS(theme);
 assert.match(css,/dialog\.ds-dialog:not\(\[open\]\) \{\n  display: none;/);
 assert.match(css,/dialog\.ds-dialog-host:not\(\[open\]\) \{\n  display: none;/);
 assert.doesNotMatch(generateCSS(base()),/dialog\.ds-dialog(?:-host)?:not\(\[open\]\)/);
 assert.doesNotMatch(renderComponent(theme,'dialog',{open:false}),/ open>/);
});
test('explicit root variants take precedence over preview defaults while child variants remain',()=>{
 const pack=base();pack.components.card.preview.variant='default';pack.components.card.preview.children.at(-1).variant='outlined';
 const html=renderComponent(pack,'card',{variant:'inverse'});
 assert.match(html,/<article class="ds-card" data-variant="inverse">/);
 assert.match(html,/<footer class="ds-card__footer" data-variant="outlined">/);
 assert.throws(()=>renderComponent(pack,'card',{variant:'missing'}),/Unknown component variant/);
});

test('canonical catalog and previews use project-agnostic anatomy without legacy duplicate roles',()=>{
 const source=Object.values(COMPONENT_LIBRARY).map(c=>JSON.stringify({name:c.name,description:c.description,usage:c.usage,preview:c.preview,variants:Object.fromEntries(Object.entries(c.variants).map(([id,v])=>[id,v.description])),states:Object.fromEntries(Object.entries(c.states).map(([id,v])=>[id,v.description]))})).join('\n');
 assert.doesNotMatch(source,/Castle|Fjordside|byggeværktøj|fortælling|borg|tårn|murkrone|rumpanel|terracotta|Nunito|Alegreya|setParam|limitsFor/i);
 for(const id of ['action-button','caption','choice-field','metric-row'])assert.ok(COMPONENT_LIBRARY[id]);
 for(const id of ['tool-button','simulation-caption','brandSelect','stat-row'])assert.equal(Object.hasOwn(COMPONENT_LIBRARY,id),false);
 assert.equal(Object.keys(COMPONENT_LIBRARY).length,30);
 assert.equal(Object.keys(DEFAULT_TOKENS).some(id=>id.startsWith('color.scene.')),false);
 assert.deepEqual(COMPONENT_LIBRARY['action-button'].preview.children.map(node=>node.part),['icon','label','shortcut']);
});
test('old v2 component, variant, part, state, token and selector references remain explicit aliases',()=>{
 const minimal={schemaVersion:2,id:'aliases',name:'Aliases',description:'Compatibility fixture.',tokens:{'typography.font.narrative':token('fontFamily','Georgia, serif')},history:[],appearance:{'tool-button':{variants:{icon:{styles:{color:'{color.text.primary}'}}},states:{selected:{styles:{color:'{color.action.primaryText}'}}}},'simulation-caption':{parts:{clock:{styles:{backgroundColor:'{color.text.secondary}'}}}}}};
 assert.deepEqual(validatePackage(minimal),{valid:true,errors:[]});
 const catalog=getComponents(minimal);assert.equal(Object.hasOwn(catalog,'tool-button'),false);assert.equal(catalog['action-button'].variants.horizontal.styles.color,'{color.text.primary}');
 assert.equal(resolveTokens(minimal)['typography.font.expressive'],'Georgia, serif');
 const old=renderComponent(minimal,'tool-button',{variant:'icon',label:'Tilføj',icon:'+',state:'selected'});
 assert.match(old,/class="ds-action-button" data-variant="horizontal" data-state="pressed" aria-pressed="true"/);
 assert.match(renderComponent(minimal,'simulation-caption',{slots:{clock:'Information'}}),/class="ds-caption__label">Information/);
 const css=generateCSS(minimal);assert.match(css,/\.ds-tool-button/);assert.match(css,/\.ds-simulation-caption__clock/);assert.match(css,/data-variant="icon"/);assert.match(css,/data-state~="selected"/);
});
test('shared action buttons retain label anatomy, support optional shortcuts and native toggle semantics',()=>{
 const theme=themeFixture('studio-light');
 const html=renderComponent(theme,'action-button',{label:'Tilføj',icon:'+',shortcut:'Alt+N',variant:'horizontal'});
 assert.match(html,/<button type="button"/);assert.match(html,/class="ds-action-button__label">Tilføj/);assert.match(html,/aria-keyshortcuts="Alt\+N"/);assert.doesNotMatch(html,/aria-pressed/);
 assert.doesNotMatch(renderComponent(theme,'action-button',{text:'Gem'}),/Alt\+N/);
 assert.match(renderComponent(theme,'action-button',{label:'Vis detaljer',pressed:false}),/aria-pressed="false"/);
 assert.match(renderComponent(theme,'action-button',{label:'Vis detaljer',pressed:true}),/aria-pressed="true"/);
 assert.match(renderComponent(theme,'action-button',{label:'Tilføj',icon:'+',variant:'icon-only'}),/aria-label="Tilføj"/);
});
test('native choice fields connect labels, help and errors and value rows retain dl semantics',()=>{
 const theme=themeFixture('studio-light');
 const html=renderComponent(theme,'choice-field',{idPrefix:'category',label:'Kategori',error:'Vælg kategori',value:'b'});
 assert.match(html,/for="category-control"/);assert.match(html,/<select[^>]*id="category-control"[^>]*aria-describedby="category-hint category-error"/);assert.match(html,/<option value="b"[^>]* selected>/);
 assert.match(renderComponent(theme,'metric-row'),/^<dl[^>]*><dt[^>]*>Antal<\/dt><dd[^>]*>24<\/dd><\/dl>$/);
});
test('v2 focus rules remain mandatory and scoped while canonical controls retain 44px target sizes',()=>{
 const theme=themeFixture('studio-light');theme.appearance.button={states:{focus:{styles:{outline:'none',opacity:0}}}};
 const css=generateCSS(theme,{scope:'#product'});
 assert.match(css,/#product \.ds-button:focus-visible/);assert.match(css,/outline: max\(3px, var\(--ds-border-width-focus\)\) solid var\(--ds-color-focus\) !important;/);assert.match(css,/opacity: 1 !important;/);
 assert.match(css,/min-height: max\(44px, var\(--ds-size-control-height\)\)/);assert.doesNotMatch(css,/(?:^|,) button:focus-visible/m);
 assert.doesNotMatch(generateCSS(base()),/outline: max\(3px, var\(--ds-border-width-focus\)\)/);
});
test('action buttons can use an approved image asset without permitting arbitrary image sources',()=>{
 const theme=themeFixture('fjordside'),logo=theme.brand.logos[0],asset=theme.brand.assets.find(asset=>asset.id===logo.asset);
 const html=renderComponent(theme,'action-button',{label:'Åbn',iconAssetId:asset.id,shortcut:'Alt+O'});
 assert.match(html,/<span aria-hidden="true" class="ds-action-button__icon"><img class="ds-action-button__asset"/);
 assert.ok(html.includes(brandAssetDataURL(asset)));assert.match(html,/alt=""/);assert.match(html,/class="ds-action-button__label">Åbn/);assert.match(html,/class="ds-action-button__shortcut">Alt\+O/);
 assert.throws(()=>renderComponent(theme,'action-button',{label:'Åbn',iconAssetId:'missing'}),/Unknown approved icon image asset/);
 assert.throws(()=>renderComponent(theme,'action-button',{slots:{icon:{tag:'img',attrs:{src:'https://example.invalid/logo.png'}}}}),/Unsupported component attribute: src/);
 assert.equal(COMPONENT_LIBRARY['action-button'].parts.asset.styles.objectFit,'contain');
});
test('canonical alias normalization retains malformed treatment errors',()=>{
 for(const value of [null,0,false,'']){
  const theme={schemaVersion:2,id:'invalid-treatment',name:'Invalid',description:'Malformed compatibility treatment.',tokens:{},history:[],appearance:{'tool-button':{variants:{icon:value}}}};
  assert.match(errorsFor(theme),/must be an object/);
 }
});


test('v2 composition keeps direct card anatomy and nested button variants independent',()=>{
 const theme=themeFixture('nocturne'), css=generateCSS(theme,{scope:'#product'}),components=getComponents(theme);
 assert.match(css,/#product \.ds-card\[data-variant="inverse"\] > \.ds-card__body/);
 assert.doesNotMatch(css,/#product \.ds-card\[data-variant="inverse"\] \.ds-(?:button|text) \{/);
 assert.equal(components.toolbar.parts.action.selector,'.ds-toolbar__action');
 assert.doesNotMatch(css,/#product \.ds-toolbar (?:> )?\.ds-button \{/);
 assert.match(css,/color-scheme: dark;/);
 assert.match(css,/#product \[hidden\] \{ display: none !important;/);
 assert.match(generateCSS(themeFixture('studio-light')),/color-scheme: light;/);
 assert.doesNotMatch(generateCSS(base()),/color-scheme:/);
});


test('shared segments preserve whole words inside each option and the wrap variant sizes from content',()=>{
 const css=generateCSS(themeFixture('castle-studio'),{scope:'#product'});
 const rule=selector=>css.slice(css.indexOf(selector+' {')).split('}')[0];
 for(const selector of ['#product .ds-segmented-option','#product .ds-segmented-control > .ds-segmented-option','#product .ds-segmented-control > .ds-segmented-control__preview-choice']){
  const styles=rule(selector);assert.match(styles,/max-width: 100%;/);assert.match(styles,/white-space: normal;/);assert.match(styles,/overflow-wrap: normal;/);assert.match(styles,/word-break: normal;/);
 }
 assert.match(rule('#product .ds-segmented-option'),/min-width: min-content;/);
 for(const part of ['.ds-segmented-option','.ds-segmented-control__preview-choice'])assert.match(rule('#product .ds-segmented-control[data-variant="wrap"] > '+part),/flex: 1 1 auto;/);
 assert.doesNotMatch(css,/flex: 1 0 30%/);
 const html=renderComponent(themeFixture('studio-light'),'segmented-option',{text:'Et langt valg med sammenhængende-tekst-der-skal-ombrydes'});
 assert.match(html,/Et langt valg med sammenhængende-tekst-der-skal-ombrydes/);
});

test('vertical action buttons stretch in toolbars and framed controls share the field border',()=>{
 const theme=themeFixture('castle-studio'),css=generateCSS(theme,{scope:'#product'}),components=getComponents(theme);
 const start=css.indexOf('#product .ds-action-button[data-variant="vertical"]');const vertical=css.slice(start).split('}')[0];
 assert.match(vertical,/width: auto;/);assert.match(vertical,/min-width: min\(100%, var\(--ds-size-actionButton-width\)\);/);assert.match(vertical,/max-width: 100%;/);
 assert.match(css,/#product \.ds-toolbar\[data-variant="vertical"\] \{[^}]*align-items: stretch;[^}]*flex-wrap: nowrap;/);
 for(const id of ['input','select','action-button'])assert.ok(components[id].parts.root.styles.border.includes('{color.border.field}'));
 for(const id of ['field','choice-field'])assert.ok(components[id].parts.control.styles.border.includes('{color.border.field}'));
 assert.equal(components.button.variants.secondary.styles.borderColor,'{color.border.field}');
 const minimal={schemaVersion:2,id:'field-fallback',name:'Field fallback',description:'Shared default.',tokens:{},history:[]};assert.equal(resolveTokens(minimal)['color.border.field'],resolveTokens(minimal)['color.border.default']);
});

test('scroll areas retain owned nested anatomy, inset scrollbars and unclipped native viewport focus',()=>{
 const theme=themeFixture('studio-light'),css=generateCSS(theme,{scope:'#product'});
 const html=renderComponent(theme,'scroll-area',{variant:'contained',slots:{content:[{component:'inspector'}]}});
 assert.match(html,/<div class="ds-scroll-area" data-variant="contained"><div[^>]*tabindex="0"[^>]*class="ds-scroll-area__viewport"><div class="ds-scroll-area__content"><section class="ds-inspector"><h3 class="ds-inspector__header">/);
 assert.match(css,/#product \.ds-scroll-area > \.ds-scroll-area__viewport > \.ds-scroll-area__content \{/);
 const components=getComponents(theme);assert.equal(components['scroll-area'].parts.viewport.styles.scrollbarGutter,'auto');assert.equal(components['scroll-area'].variants.contained.styles.backgroundColor,'{color.background.surface}');assert.equal(components['scroll-area'].variants.contained.styles.border,'{border.width.default} solid {color.border.default}');
 assert.match(css,/#product \.ds-scroll-area\[data-variant="contained"\] \{[^}]*background-color: var\(--ds-color-background-surface\);/);
 assert.match(css,/scrollbar-gutter: auto;/);assert.doesNotMatch(css,/scrollbar-gutter: stable;/);
 assert.doesNotMatch(css,/#product \.ds-scroll-area\[data-variant="contained"\] \.ds-scroll-area__content \{/);
 assert.match(css,/\.ds-scroll-area__viewport \{[^}]*margin: var\(--ds-space-1\);[^}]*overflow: auto;[^}]*scrollbar-width: thin;[^}]*scrollbar-color: var\(--ds-color-border-field\) transparent;/);
 assert.match(css,/:has\(> \.ds-scroll-area__viewport:focus-visible\)[^}]*> \.ds-scroll-area__viewport \{[^}]*outline: var\(--ds-border-width-focus\) solid var\(--ds-color-focus\);[^}]*outline-offset: calc\(-1 \* var\(--ds-border-width-focus\)\);/);
 assert.match(css,/padding: max\(var\(--ds-space-component-paddingCompact\), calc\(max\(3px, var\(--ds-border-width-focus\)\) \+ max\(2px, var\(--ds-border-offset-focus\)\)\)\);/);
 for(const tabindex of ['1','-2','x']){const legacy=base();legacy.components.card.preview.attrs={tabindex};assert.match(errorsFor(legacy),/tabindex: must be 0 or -1/);}
 const legacy=base();legacy.components.card.preview.attrs={tabindex:'-1'};assert.deepEqual(validatePackage(legacy),{valid:true,errors:[]});
 const unsafe=themeFixture('studio-light');unsafe.appearance={'scroll-area':{parts:{viewport:{styles:{overflow:'hidden'}}}}};assert.match(errorsFor(unsafe),/layout is owned by the shared library/);
});

test('list actions preserve heading and description parts and expose native current navigation',()=>{
 const theme=themeFixture('studio-light'),css=generateCSS(theme,{scope:'#product'});
 const html=renderComponent(theme,'button',{variant:'list-item',attrs:{'aria-current':'page'},slots:{heading:'Eksempel',description:'En supplerende beskrivelse'}});
 assert.match(html,/aria-current="page"/);assert.match(html,/<span class="ds-button__heading">Eksempel<\/span><span class="ds-button__description">En supplerende beskrivelse<\/span>/);assert.doesNotMatch(html,/aria-pressed/);
 assert.match(css,/#product \.ds-button\[data-variant="list-item"\] > \.ds-button__description \{[^}]*display: block;/);
 assert.match(css,/\[aria-current\]:not\(\[aria-current="false"\]\)/);
 assert.match(css,/\[aria-pressed="true"\][^}]*> \.ds-button__description \{[^}]*color: inherit;/);
});


test('semantic hover and active fills preserve primary, accent, danger and selected families',()=>{
 const theme=themeFixture('castle-studio'),components=getComponents(theme),css=generateCSS(theme,{scope:'#product'});
 const binding='--ds-interaction-hover-surface';
 assert.equal(components.button.parts.root.styles[binding],'{color.action.primaryHover}');
 for(const [variant,family]of [['secondary','neutral'],['ghost','neutral'],['danger','danger'],['danger-subtle','danger'],['accent','accent']])assert.equal(components.button.variants[variant].styles[binding],'{color.action.'+family+'Hover}');
 assert.equal(components['action-button'].states.pressed.styles[binding],'{color.action.primaryHover}');assert.equal(components['segmented-option'].states.pressed.styles[binding],'{color.action.selectedHover}');
 for(const id of ['button','action-button','segmented-option'])for(const state of ['hover','active']){
  assert.equal(components[id].states[state].styles.backgroundColor,'var(--ds-interaction-'+state+'-surface)');assert.equal(components[id].states[state].styles.color,'var(--ds-interaction-'+state+'-text)');assert.equal(Object.hasOwn(components[id].states[state].styles,'opacity'),false);
 }
 assert.ok(css.indexOf('.ds-action-button:is(:hover')>css.indexOf('.ds-action-button:is([aria-pressed="true"]'));
 assert.match(css,/\.ds-button:is\(:hover,[^}]*:not\(:is\(:disabled, \[aria-disabled="true"\], \[data-state~="disabled"\]\)\) \{[^}]*background-color: var\(--ds-interaction-hover-surface\);/);
 assert.match(css,/\.ds-toolbar__action:hover:not\(:is\(:disabled/);
 const bad=themeFixture('studio-light');bad.appearance.button={parts:{root:{styles:{[binding]:'#fff'}}}};assert.match(errorsFor(bad),/layout is owned by the shared library/);
 const minimal={schemaVersion:2,id:'interaction-defaults',name:'Defaults',description:'No custom interaction tokens.',tokens:{},history:[]},tokens=resolveTokens(minimal);
 assert.notEqual(tokens['color.action.primaryHover'],tokens['color.action.primary']);assert.notEqual(tokens['color.action.neutralHover'],tokens['color.background.control']);assert.deepEqual(validatePackage(minimal),{valid:true,errors:[]});
});

test('scroll surface composition has one frame, retains native inner anatomy and supports fixed-header bodies',()=>{
 const theme=themeFixture('studio-light'),components=getComponents(theme),css=generateCSS(theme,{scope:'#product'});
 const html=renderComponent(theme,'scroll-area',{variant:'contained',slots:{content:[{component:'inspector',part:'surface'}]}});
 assert.match(html,/<section class="ds-inspector ds-scroll-area__surface"><h3 class="ds-inspector__header">/);
 assert.match(css,/#product \.ds-scroll-area > \.ds-scroll-area__viewport > \.ds-scroll-area__content > \.ds-scroll-area__surface \{[^}]*border: 0;[^}]*border-radius: 0;[^}]*background-color: transparent;[^}]*box-shadow: none;/);
 assert.deepEqual(Object.keys(components['scroll-area'].parts.surface.styles).sort(),['backgroundColor','border','borderRadius','boxShadow']);
 assert.equal(components['scroll-area'].variants.body.styles.border,'0');assert.equal(components['scroll-area'].variants.body.parts.viewport.styles.margin,'0');assert.ok(components.inspector.parts.root.styles.padding.includes('paddingLarge'));
 assert.throws(()=>renderComponent(theme,'scroll-area',{slots:{content:[{component:'inspector',part:'unknown'}]}}),/Unknown composition part/);
 assert.equal(components.divider.variants.vertical.styles.alignSelf,'stretch');assert.equal(components.divider.variants.vertical.styles.flexShrink,'0');
});


test('shared stacks separate composed controls without adding inner padding or touching nested segmented gaps',()=>{
 const theme=themeFixture('castle-studio'),components=getComponents(theme),css=generateCSS(theme,{scope:'#product'});
 assert.deepEqual(components.stack.parts.root.styles,{display:'flex',flexDirection:'column',minWidth:'0',gap:'{space.component.gapLarge}'});assert.deepEqual(components.stack.variants.compact.styles,{gap:'{space.component.gap}'});assert.deepEqual(components.stack.variants['disclosure-body'].styles,{gap:'{space.component.gap}',paddingBlockStart:'{space.component.gapLarge}'});
 const document={createElement(tag){return{tag,attrs:{},children:[],setAttribute(name,value){this.attrs[name]=value;},appendChild(child){this.children.push(child);}};},createTextNode(text){return{text};}};
 const stack=createComponent(theme,'stack',{}, {document});assert.equal(stack.attrs.class,'ds-stack');assert.equal(stack.attrs['data-variant'],'default');assert.deepEqual(stack.children.map(child=>child.attrs.class),['ds-instruction-note','ds-field','ds-button']);assert.equal(stack.children[1].children.find(child=>child.tag==='input').attrs.class,'ds-input');
 const html=renderComponent(theme,'stack',{variant:'compact',slots:{root:[{component:'segmented-control'},{component:'instruction-note'}]}});assert.match(html,/class="ds-stack" data-variant="compact"><div[^>]*class="ds-segmented-control"/);assert.equal(components['segmented-control'].parts.root.styles.gap,'{space.1}');assert.doesNotMatch(css,/#product \.ds-stack [*>]/);
 const missing=base();missing.components.card.preview.children=[{component:'missing'}];assert.match(errorsFor(missing),/shared component does not exist/);
 const undeclared=base();undeclared.components.card.composes=[];undeclared.components.card.preview.children=[{component:'field'}];assert.match(errorsFor(undeclared),/must be declared in composes/);
});
