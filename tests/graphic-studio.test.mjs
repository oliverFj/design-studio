import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderGraphicsView,createGraphicsState,resolveGraphicFamily,filterGraphicMotifs,graphicPreviewTheme} from '../studio/graphics.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {GRAPHIC_FAMILIES,GRAPHIC_MOTIFS} from '../core/graphics.mjs';

const theme=()=>resolveThemeMode(JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8')),'light');

test('Studio follows the authored family unless the user explicitly chooses another style',()=>{
 const pack={...theme(),graphics:{family:'lightroom'}};
 assert.equal(resolveGraphicFamily(pack),'lightroom');
 assert.equal(resolveGraphicFamily(pack,''),'lightroom');
 assert.equal(resolveGraphicFamily(pack,'obsolete'),'lightroom');
 assert.equal(resolveGraphicFamily(pack,'passage'),'passage');
 assert.equal(resolveGraphicFamily({...pack,graphics:{family:'anatomy'}},'passage'),'passage');
 assert.equal(resolveGraphicFamily({...pack,graphics:undefined}),'anatomy');
});

test('a family selection survives theme changes without changing editable or saved theme data',()=>{
 const first=theme(),second={...theme(),id:'another-theme'},saved=JSON.stringify(first),state=createGraphicsState(),originalFamily=first.graphics;
 state.family='passage';
 assert.equal(graphicPreviewTheme(first,state.family).graphics.family,'passage');
 assert.equal(graphicPreviewTheme(second,state.family).graphics.family,'passage');
 assert.equal(JSON.stringify(first),saved);
 assert.deepEqual(first.graphics,originalFamily);assert.deepEqual(second.graphics,originalFamily);
});

test('the graphic workspace exposes each family, every motif and a uniquely named accessible stage',()=>{
 for(const family of GRAPHIC_FAMILIES){
  const pack=theme();pack.graphics={family:family.id};
  const html=renderGraphicsView(pack,createGraphicsState());
  assert.equal([...html.matchAll(/data-graphic-family=/g)].length,4);
  assert.equal([...html.matchAll(/data-graphic-motif=/g)].length,GRAPHIC_MOTIFS.length);
  assert.ok(html.includes(GRAPHIC_FAMILIES.length * GRAPHIC_MOTIFS.length + ' motiver'));
  assert.match(html,/4 illustrationsstile/);
  assert.doesNotMatch(html,/billedfamilie/i);
  assert.ok(html.includes('Alle ' + (GRAPHIC_MOTIFS.length - 4) + ' komponentroller og 4 principillustrationer'));
  assert.match(html,new RegExp('id="studio-graphic-'+family.id+'-poster-title"'));
  assert.match(html,/id="graphic-timeline" type="range"/);
  assert.match(html,/id="graphic-reduced"/);
  assert.doesNotMatch(html,/Agent [123]|konkurrence|review/i);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
 }
});

test('motif search includes the entire catalog by name and function without losing the selected scene',()=>{
 assert.equal(filterGraphicMotifs().length,GRAPHIC_MOTIFS.length);
 assert.deepEqual(filterGraphicMotifs('redigerbart datagrid').map(item=>item.id),['data-grid']);
 assert.equal(filterGraphicMotifs('dette findes bestemt ikke').length,0);
 const state={...createGraphicsState(),query:'redigerbart datagrid'};
 const html=renderGraphicsView(theme(),state);
 assert.ok(html.includes('1 af ' + GRAPHIC_MOTIFS.length + ' motiver'));
 assert.match(html,/data-graphic-motif="data-grid"[^>]*aria-pressed="false">/);
 assert.match(html,/id="graphic-stage"/);
});

test('SVG export is present locally and absent in the public graphic workspace',()=>{
 assert.match(renderGraphicsView(theme(),createGraphicsState()),/id="graphic-download"/);
 assert.doesNotMatch(renderGraphicsView(theme(),createGraphicsState(),{showcase:true}),/id="graphic-download"/);
});
