import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {materializePackage,resolveTokens,generateCSS} from '../core/engine.mjs';
import {componentGeometryReport} from '../core/geometry.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const themes=PUBLIC_THEME_IDS.map(id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8')));
test('switch geometry and generated CSS retain centring across themes and border sizes',()=>{
 for(const theme of themes){
  const model=materializePackage(theme),resolved=resolveTokens(theme);
  for(const geometry of [{},{'border.width.default':'2px','size.switch.height':'30px','size.switch.thumb':'20px'}]){
   const checks=componentGeometryReport(model,{...resolved,...geometry}).filter(check=>check.id.startsWith('switch.'));
   assert.equal(checks.length,2,'centring and both end positions are covered');
   assert.ok(checks.every(check=>check.status==='pass'),theme.id+': '+JSON.stringify(checks));
  }
  assert.match(generateCSS(theme),/top: calc\(\(100% - var\(--ds-size-switch-thumb\)\) \/ 2\)/);
 }
});

test('desktop families use the common geometry report and keep wrapped actions free to grow',()=>{
 for(const theme of themes){
  const model=materializePackage(theme),components=model.components,report=componentGeometryReport(model,resolveTokens(theme));
  const controls=report.filter(check=>check.id.startsWith('desktop.'));
  assert.ok(controls.length>=7,'native, menu and toolbar families are covered');
  for(const check of controls){assert.equal(check.status,'pass',theme.id+'/'+check.id+': '+check.details);assert.equal(check.measured,32);}
  for(const id of ['button','input','select','segmented-option'])assert.equal(report.find(check=>check.id==='target.'+id).status,'pass',theme.id+'/'+id+': standard targets remain large');
  const desktop=id=>({...components[id].parts.root.styles,...components[id].variants.desktop.styles});
  const wrapping=[['button',desktop('button')],['segmented-option',desktop('segmented-option')],
   ['toolbar action',{...components.toolbar.parts.action.styles,...components.toolbar.variants.desktop.parts.action.styles}],
   ['menu-item',components['menu-item'].parts.root.styles]];
  for(const [id,styles]of wrapping){
   assert.equal(styles.height,undefined,theme.id+'/'+id+': wrapped labels may grow beyond the minimum');
   assert.equal(styles.maxHeight,undefined,theme.id+'/'+id+': wrapped labels are not clipped by a fixed maximum');
  }
 }
});
