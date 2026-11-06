import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {CONCEPTS,conceptScene,renderConcept} from '../examples/graphics/concepts.mjs';
import {GRAPHIC_FAMILIES} from '../core/graphics.mjs';
import {resolveTokens} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {buildGraphicLab,parseGraphicLabArgs} from '../tools/graphic-lab.mjs';
import {offlineIssues} from '../tools/offline-checks.mjs';

test('concept recipes have semantic parts, bounded stories and resolved theme materials in every delivered mode',()=>{
 for(const id of PUBLIC_THEME_IDS){
  const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url)));
  for(const mode of Object.keys(source.modes??{light:{}})){
   const pack=resolveThemeMode(source,mode),tokens=resolveTokens(pack),colors=new Set(Object.values(tokens));
   for(const family of GRAPHIC_FAMILIES)for(const concept of CONCEPTS){
    const scene=conceptScene(concept.id,family.id),svg=renderConcept(pack,scene,{tokens});
    assert.equal(new Set(scene.parts.map(p=>p.key)).size,scene.parts.length);
    for(const part of scene.parts){assert.ok(part.name&&part.purpose&&part.body);assert.ok(part.start>=0&&part.end>part.start&&part.end<=1);}
    assert.doesNotMatch(svg,/var\(|undefined|NaN|<script|\bon\w+=/);
    assert.match(svg,/<title id="study-/);
    for(const [,value]of svg.matchAll(/(?:fill|stroke)="([^"]+)"/g))assert.ok(value==='none'||colors.has(value),id+'/'+mode+': '+value);
    if(scene.route)assert.ok(scene.parts.find(p=>p.key==='route').body.includes(scene.route),'the probe follows the exact visible route');
   }
  }
 }
});

test('graphic lab emits an offline preview and SVGs, preserves other files and rejects accidental overwrites',async t=>{
 const output=await mkdtemp(path.join(tmpdir(),'graphic-lab-'));
 t.after(()=>rm(output,{recursive:true,force:true}));
 const result=await buildGraphicLab({output,family:'passage',concept:'house'});
 assert.equal(result.scenes,1);assert.deepEqual(offlineIssues(result.html),[]);
 assert.match(result.html,/data-study="passage-house"/);assert.match(result.html,/id="play-all"/);
 assert.match(result.html,/SIL OPEN FONT LICENSE/,'embedded font licenses travel with the preview');
 assert.match(result.html,/<button[^>]*data-replay/);
 assert.equal(JSON.parse(await readFile(path.join(output,'manifest.json'),'utf8')).scenes[0].concept,'house');
 assert.match(await readFile(path.join(output,'passage-house.svg'),'utf8'),/data-motif="house"/);
 const bytes=(await stat(path.join(output,'index.html'))).size;
 await assert.rejects(buildGraphicLab({output}),/not empty/);
 assert.equal((await stat(path.join(output,'index.html'))).size,bytes);
 await assert.rejects(buildGraphicLab({output,theme:'../private'}),/local theme ID/);
 await assert.rejects(buildGraphicLab({output,family:'unknown'}),/Unknown family/);
 assert.throws(()=>conceptScene('arbitrary prompt','passage'),/Unknown concept/);
 assert.throws(()=>parseGraphicLabArgs(['--out']),/incomplete/);
 assert.deepEqual(parseGraphicLabArgs(['--family','passage','--force']),{family:'passage',force:true});
});
