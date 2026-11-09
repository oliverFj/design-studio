import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {materializePackage,resolveTokens} from '../core/engine.mjs';
import {componentGeometryReport} from '../core/geometry.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
const themes=PUBLIC_THEME_IDS.map(id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8')));
const fixture=()=>({model:materializePackage(themes.find(t=>t.id==='fjordside')),resolved:resolveTokens(themes.find(t=>t.id==='fjordside'))});
const result=(model,resolved,id)=>componentGeometryReport(model,resolved).find(check=>check.id===id);

test('all public themes pass supported calculated component geometry without mutation',()=>{
 for(const theme of themes){
  const model=materializePackage(theme),resolved=resolveTokens(theme),before=JSON.stringify({model,resolved});
  const report=componentGeometryReport(model,resolved);
  assert.ok(report.length>=20,theme.id+': representative checks are present');
  assert.deepEqual(report.filter(check=>check.status!=='pass'),[],theme.id);
  assert.ok(report.every(check=>check.method==='calculated'&&check.referenceRootPx===16));
  assert.equal(JSON.stringify({model,resolved}),before,'report does not change the theme');
 }
});

test('old switch inset is reported as uneven geometry, including in checked state',()=>{
 const {model,resolved}=fixture();
 // Reproduce the historical 2px track border explicitly; the common default
 // now uses 1px, where this inset happens to be correctly centered.
 model.components.switch.parts.track.styles.border='2px solid {color.border.strong}';
 model.components.switch.parts.thumb.styles.top='{size.switch.inset}';
 const check=result(model,resolved,'switch.centered');
 assert.equal(check.status,'warning');assert.equal(check.measured,2);
 model.components.switch.parts.thumb.styles.top='calc((100% - {size.switch.thumb}) / 2)';
 model.components.switch.states.checked.parts.thumb.styles.left='100px';
 assert.equal(result(model,resolved,'switch.end-stops').status,'warning');
});

test('desktop report catches padding regressions and fixed-height clipping in native and composite controls',()=>{
 const {model,resolved}=fixture();
 model.components.button.variants.desktop.styles.padding='8px {space.component.padding}';
 assert.equal(result(model,resolved,'desktop.button').status,'warning');
 model.components.input.variants.desktop.styles.padding='10px';
 model.components.input.variants.desktop.styles.height='32px';
 assert.equal(result(model,resolved,'desktop.input').status,'warning');
 assert.equal(result(model,resolved,'desktop.field').status,'warning','composite borrows the same native geometry');
 model.components['choice-field'].variants.invalid.parts.control.styles.height='12px';
 model.components['choice-field'].variants.invalid.parts.control.styles.minHeight='12px';
 assert.equal(result(model,resolved,'desktop.choice-field-invalid').status,'warning');
});

test('tree report includes badge padding, inherited line height and row borders',()=>{
 const {model,resolved}=fixture(),tree=model.components.tree;
 tree.parts.badge.styles.padding='10px';tree.parts.badge.styles.lineHeight='inherit';
 assert.equal(result(model,resolved,'tree.default').status,'warning');
 tree.parts.badge.styles.padding='0';tree.parts.toggle.styles.minHeight='32px';
 const row=result(model,resolved,'tree.default');assert.equal(row.status,'warning');assert.ok(row.measured>=34);
});

test('desktop report includes the declared text children instead of only the root font',()=>{
 const {model,resolved}=fixture();
 resolved['typography.size.small']='48px';
 const shortcut=result(model,resolved,'desktop.menu-item');
 assert.equal(shortcut.status,'warning');assert.ok(shortcut.measured>32,'a tall shortcut enlarges the menu item');
 model.components.button.parts.heading.styles.fontSize='48px';
 assert.equal(result(model,resolved,'desktop.button').status,'warning','the visible heading contributes to button height');
 model.components.button.parts.heading.styles.fontSize='14px';
 model.components.button.parts.description.styles.fontSize='48px';
 assert.equal(result(model,resolved,'desktop.button').status,'pass','a hidden description does not enlarge the button');
 model.components.button.variants.desktop.parts={description:{styles:{display:'block'}}};
 assert.equal(result(model,resolved,'desktop.button').status,'warning','a visible description contributes to button height');
});

test('unsupported or malformed CSS is unmeasurable rather than passed or executed',()=>{
 for(const value of ['var(--unknown)','clamp(0px, 1vw, 20px)','calc(1px * 2px)','calc(12px / 0)','calc(2px + 1)','(()=>{throw 1})()']){
  const {model,resolved}=fixture();model.components.button.variants.desktop.styles.padding=value;
  assert.equal(result(model,resolved,'desktop.button').status,'unmeasurable',value);
 }
 const {model,resolved}=fixture();resolved['size.switch.thumb']='{cycle}';resolved.cycle='{size.switch.thumb}';
 assert.equal(result(model,resolved,'switch.centered').status,'unmeasurable','cycles cannot produce a pass');
});
