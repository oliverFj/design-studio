import test from 'node:test';
import assert from 'node:assert/strict';
import {parseColor,contrastRatio,themeContrastReport,componentContrastReport,controlBoundaryReport,componentBoundaryReport} from '../core/quality.mjs';
import {validatePackage,materializePackage,resolveTokens} from '../core/engine.mjs';
import {DEFAULT_TOKENS} from '../core/library.mjs';
import fs from 'node:fs';
const theme = () => { const pack=JSON.parse(fs.readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));pack.tokens['color.border.field'].$value='#667085';return pack; };
test('contrast uses sRGB luminance and alpha compositing',()=>{
 assert.equal(contrastRatio('#fff','#000'),21);
 assert.ok(Math.abs(contrastRatio('rgb(0 0 0 / 50%)','#fff')-3.97665)<.0001);
 assert.deepEqual(parseColor('hsl(0 100% 50%)'),[1,0,0,1]);
 assert.ok(Math.abs(contrastRatio('oklch(1 0 0)','oklch(0 0 0)')-21)<.001);
 assert.equal(contrastRatio('#fff','transparent'),null);
 assert.equal(parseColor('currentColor'),null);
});
test('theme validation rejects invisible text, low focus contrast and undersized foundations',()=>{
 const text=theme();text.tokens['color.text.secondary'].$value='#dddddd';
 assert.match(validatePackage(text).errors.join(' '),/color.text.secondary.*contrast/);
 const focus=theme();focus.tokens['color.focus'].$value='#ffffff';
 assert.match(validatePackage(focus).errors.join(' '),/color.focus.*contrast/);
 const small=theme();small.tokens['size.control.height']={...DEFAULT_TOKENS['size.control.height'],$value:'12px'};
 assert.match(validatePackage(small).errors.join(' '),/size.control.height/);
 const clear=theme();clear.tokens['color.background.surface'].$value='rgb(255 255 255 / .5)';
 assert.match(validatePackage(clear).errors.join(' '),/opaque/);
});
test('semantic report never silently passes unmeasurable role colors',()=>{
 const report=themeContrastReport({'color.text.primary':'currentColor','color.background.surface':'#fff'});
 assert.equal(report[0].passed,false);assert.equal(report[0].ratio,null);
});

test('field boundaries are binding on control, surface and canvas and reject unmeasurable edges',()=>{
 const pack=theme(),resolved=resolveTokens(pack);
 assert.ok(controlBoundaryReport(resolved).every(check=>check.passed&&!check.advisory));
 assert.deepEqual(controlBoundaryReport(resolved).map(check=>check.background),['color.background.control','color.background.surface','color.background.canvas']);
 const weak={...resolved,'color.border.field':resolved['color.background.control']};
 const report=controlBoundaryReport(weak);assert.equal(report[0].passed,false);assert.equal(report[0].ratio,1);
 assert.ok(report.every(check=>check.foreground==='color.border.field'&&check.minimum===3));
 assert.ok(controlBoundaryReport({...resolved,'color.border.field':'currentColor'}).every(check=>check.ratio===null&&!check.passed));
 pack.tokens['color.border.field'].$value=resolved['color.background.control'];
 assert.equal(validatePackage(pack).valid,false,'the same minimum is enforced by editor/save/CLI validation');
 assert.match(validatePackage(pack).errors.join(' '),/color.border.field.*minimum 3:1/);
 const legacy=materializePackage(theme());legacy.tokens['color.border.field'].$value=resolved['color.background.control'];
 assert.equal(validatePackage(legacy).valid,true,'format 1 keeps its historical validation contract');
});

test('effective field recipes cannot bypass contrast with appearance borders or backgrounds',()=>{
 for(const [id,appearance]of [
  ['input',{parts:{root:{styles:{borderColor:'#fff'}}}}],
  ['select',{variants:{compact:{styles:{borderColor:'#fff'}}}}],
  ['field',{parts:{control:{styles:{border:'none'}}}}],
  ['choice-field',{parts:{control:{styles:{borderColor:'#fff'}}}}],
 ]){
  const pack=theme();pack.appearance={...pack.appearance,[id]:appearance};
  const checked=validatePackage(pack);
  assert.equal(checked.valid,false,id+' appearance must not hide the control');
  assert.ok(checked.errors.some(message=>message.startsWith('components.'+id+'.')&&message.includes('field boundary')));
 }
 const pack=theme(),model=materializePackage(pack),resolved=resolveTokens(pack);
 model.components.input.parts.root.styles.backgroundColor=resolved['color.border.field'];
 assert.ok(componentBoundaryReport(model,resolved).some(check=>check.component==='input'&&check.background==='control'&&!check.passed),'local backgrounds are measured against the actual boundary');
 const decorative=theme();decorative.appearance={...decorative.appearance,card:{parts:{root:{styles:{borderColor:'#fff'}}}}};
 assert.equal(validatePackage(decorative).valid,true,'decorative card edges are not treated as required field boundaries');
});

test('appearance cannot introduce an unreadable explicit foreground/surface pair',()=>{
 const pack=theme();pack.appearance??={};pack.appearance.button??={};pack.appearance.button.parts??={};
 pack.appearance.button.parts.root={styles:{color:'#fff',backgroundColor:'#fff'}};
 assert.match(validatePackage(pack).errors.join(' '),/components.button.root.*contrast/);
});

test('new native fields and temporary grid editors enforce the boundary of the actual control',()=>{
 const expected=[['combobox','control'],['multiselect','control'],['date-picker','control'],['time-picker','control'],['file-upload','control'],['data-grid','editor']];
 const pack=theme(),resolved=resolveTokens(pack),report=componentBoundaryReport(materializePackage(pack),resolved);
 for(const [id,part]of expected){
  const measured=report.filter(check=>check.component===id&&check.part===part);assert.ok(measured.length,id+' has a measured field boundary');assert.ok(measured.every(check=>check.passed),id);
  const bad=theme();bad.appearance={...bad.appearance,[id]:{parts:{[part]:{styles:{borderColor:'#ffffff'}}}}};
  assert.match(validatePackage(bad).errors.join('\n'),new RegExp('components\\.'+id+'\\.'+part+'.*field boundary'),id+' cannot hide its native boundary with appearance');
 }
 const wrapper=theme();wrapper.appearance={...wrapper.appearance,combobox:{parts:{wrapper:{styles:{borderColor:'#ffffff'}}}}};assert.equal(validatePackage(wrapper).valid,true,'a layout wrapper is not incorrectly treated as the input boundary');
 const variant=theme();variant.appearance={...variant.appearance,'date-picker':{variants:{invalid:{parts:{control:{styles:{borderColor:'#ffffff'}}}}}}};assert.match(validatePackage(variant).errors.join('\n'),/components\.date-picker\.control \[invalid\/.*field boundary/);
});


test('interaction token pairs and persistent selection combinations are measured',()=>{
 const pack=theme(),resolved=resolveTokens(pack),report=componentContrastReport(materializePackage(pack),resolved);
 for(const [component,state,family]of [['button','pressed+hover','primary'],['action-button','pressed+active','primary'],['segmented-option','pressed+hover','selected']]){
  const check=report.find(row=>row.component===component&&row.part==='root'&&row.variant==='base'&&row.state===state);assert.ok(check,component+' '+state+' must be measured');assert.equal(check.ratio,contrastRatio(resolved['color.action.'+family+(state.endsWith('hover')?'HoverText':'ActiveText')],resolved['color.action.'+family+(state.endsWith('hover')?'Hover':'Active')]));assert.equal(check.passed,true);
 }
 const bad=theme();bad.tokens['color.action.primary.hover.text']={$type:'color',$value:resolved['color.action.primary.hover.surface'],description:'Deliberate regression.'};assert.match(validatePackage(bad).errors.join(' '),/color.action.primary.hover.text.*contrast/);
});
