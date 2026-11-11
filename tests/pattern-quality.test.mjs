import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createCollaborationService} from '../collaboration/service.mjs';
import {COMPOSITIONS,PATTERN_FILES} from '../patterns/catalog.mjs';
import {mountComposition} from '../patterns/compositions.mjs';
import {compositionQualityReport,compositionStructureReport} from '../patterns/quality.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));

test('every pattern has existing reference paths and correct direct controller imports', async () => {
  const service = await createCollaborationService();
  for (const id of Object.keys(COMPOSITIONS)) {
    const pattern = await service.getPattern({ id });
    assert.equal(pattern.pattern.name, COMPOSITIONS[id].name);
    for (const file of pattern.exampleFiles) assert.ok((await stat(new URL('../' + file, import.meta.url))).isFile());
    for (const basis of pattern.controllerBasis) {
      const module = await import(new URL('../' + basis.file, import.meta.url));
      for (const symbol of basis.symbols) assert.equal(typeof module[symbol], 'function');
    }
  }
  const panel = await service.getPattern({ id: 'resizable-panel' });
  assert.ok(panel.controllerBasis.some(item => item.symbols.includes('mountPanelControls')));
});

test('catalog patterns are representative quality samples in every theme',async()=>{
 assert.ok(PATTERN_FILES.includes('quality.mjs'),'project exports carry the same composition checks');
 for(const id of PUBLIC_THEME_IDS){
  const pack=theme(id),original=JSON.stringify(pack),document=dom(),progress=[];
  const outside=document.createElement('input');outside.value='Bevar brugerens kladde';document.body.append(outside);outside.focus();
  const report=await compositionQualityReport(pack,{document,dispatch:fire,onProgress:item=>progress.push(item)});
  assert.deepEqual(report.checks.filter(item=>item.status!=='pass'),[],id);
  assert.equal(new Set(report.checks.map(item=>item.id)).size,report.checks.length,'check IDs are stable and distinct');
  for(const [composition,metadata]of Object.entries(COMPOSITIONS)){
   const scenarios=new Set(report.checks.filter(item=>item.composition===composition).map(item=>item.scenario));
   for(const scenario of metadata.qualityScenarios)assert.ok(scenarios.has(scenario),composition+'/'+scenario);
  }
  assert.equal(progress.length,Object.keys(COMPOSITIONS).length*2);
  assert.deepEqual(progress.filter(item=>item.phase==='complete').map(item=>item.composition),Object.keys(COMPOSITIONS));
  assert.equal(document.body.children.length,1,'samples never enter the user document');
  assert.equal(document.activeElement,outside,'the supplied document retains its focus');
  assert.equal(outside.value,'Bevar brugerens kladde');
  assert.equal(JSON.stringify(pack),original,'quality checking does not alter the theme');
  assert.match(report.scope,/ingen visuel kontrol/);
 }
});

test('composition inspection catches broken associations, old heading nesting and density regression',()=>{
 const mounted=mountComposition(theme('studio-light'),'editor',{document:dom()});
 const root=mounted.element,input=root.querySelector('input');
 input.removeAttribute('data-variant');
 input.setAttribute('aria-describedby','missing-hint');
 const heading=root.querySelector('h2'),nested=root.ownerDocument.createElement('h3');heading.append(nested);
 const duplicate=root.ownerDocument.createElement('div');duplicate.setAttribute('id',input.id);root.append(duplicate);
 const checks=compositionStructureReport(root,{composition:'editor'});
 for(const id of ['unique-ids','descriptions','heading-anatomy','control-density'])assert.equal(checks.find(item=>item.id.endsWith(':'+id)).status,'warning',id);
 mounted.destroy();
});

test('missing DOM or event capability is reported rather than treated as a successful sample',async()=>{
 const absent=await compositionQualityReport(theme('studio-light'),{document:null});
 assert.equal(absent.checks.length,Object.keys(COMPOSITIONS).length);
 assert.ok(absent.checks.every(item=>item.status==='unmeasurable'));
 const report=await compositionQualityReport(theme('studio-light'),{document:dom()});
 assert.ok(report.checks.some(item=>item.status==='unmeasurable'&&item.scenario==='validation'));
 assert.deepEqual(report.checks.filter(item=>item.status==='warning'),[]);
});

test('resource quality catches competing primary actions and a misplaced result count',()=>{
 const mounted=mountComposition(theme('fjordside'),'resource-library',{document:dom()});
 const root=mounted.element;
 root.querySelector('[data-resource]').setAttribute('data-variant','primary');
 root.querySelector('.composition-resource-layout').append(root.querySelector('[data-resource-count]'));
 const checks=compositionStructureReport(root,{composition:'resource-library'});
 for(const id of ['action-hierarchy','result-count'])assert.equal(checks.find(item=>item.id.endsWith(':'+id)).status,'warning',id);
 mounted.destroy();
});
