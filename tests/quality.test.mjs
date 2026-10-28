import test from 'node:test';
import assert from 'node:assert/strict';
import {parseColor,contrastRatio,themeContrastReport,componentContrastReport,controlBoundaryReport} from '../core/quality.mjs';
import {validatePackage,materializePackage,resolveTokens} from '../core/engine.mjs';
import fs from 'node:fs';
const theme = () => JSON.parse(fs.readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
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
 const small=theme();small.tokens['size.control.height'].$value='12px';
 assert.match(validatePackage(small).errors.join(' '),/size.control.height/);
 const clear=theme();clear.tokens['color.background.surface'].$value='rgb(255 255 255 / .5)';
 assert.match(validatePackage(clear).errors.join(' '),/opaque/);
});
test('semantic report never silently passes unmeasurable role colors',()=>{
 const report=themeContrastReport({'color.text.primary':'currentColor','color.background.surface':'#fff'});
 assert.equal(report[0].passed,false);assert.equal(report[0].ratio,null);
});

test('field boundary advice exposes weak or unmeasurable edges without claiming save validation or decorative contrast',()=>{
 const pack=theme(),resolved=resolveTokens(pack);
 assert.ok(controlBoundaryReport(resolved).every(check=>check.passed&&check.advisory));
 const weak={...resolved,'color.border.field':resolved['color.background.control']};
 const report=controlBoundaryReport(weak);assert.equal(report[0].passed,false);assert.equal(report[0].ratio,1);
 assert.ok(report.every(check=>check.foreground==='color.border.field'&&check.minimum===3));
 assert.ok(controlBoundaryReport({...resolved,'color.border.field':'currentColor'}).every(check=>check.ratio===null&&!check.passed));
 pack.tokens['color.border.field'].$value=resolved['color.background.control'];
 assert.equal(validatePackage(pack).valid,true,'advice remains separate from the existing save contract');
});

test('appearance cannot introduce an unreadable explicit foreground/surface pair',()=>{
 const pack=theme();pack.appearance??={};pack.appearance.button??={};pack.appearance.button.parts??={};
 pack.appearance.button.parts.root={styles:{color:'#fff',backgroundColor:'#fff'}};
 assert.match(validatePackage(pack).errors.join(' '),/components.button.root.*contrast/);
});


test('interaction token pairs and persistent selection combinations are measured',()=>{
 const pack=theme(),resolved=resolveTokens(pack),report=componentContrastReport(materializePackage(pack),resolved);
 for(const [component,state,family]of [['button','pressed+hover','primary'],['action-button','pressed+active','primary'],['segmented-option','pressed+hover','selected']]){
  const check=report.find(row=>row.component===component&&row.part==='root'&&row.variant==='base'&&row.state===state);assert.ok(check,component+' '+state+' must be measured');assert.equal(check.ratio,contrastRatio(resolved['color.action.'+family+(state.endsWith('hover')?'HoverText':'ActiveText')],resolved['color.action.'+family+(state.endsWith('hover')?'Hover':'Active')]));assert.equal(check.passed,true);
 }
 const bad=theme();bad.tokens['color.action.primaryHoverText']={$type:'color',$value:resolved['color.action.primaryHover'],description:'Deliberate regression.'};assert.match(validatePackage(bad).errors.join(' '),/color.action.primaryHoverText.*contrast/);
});
