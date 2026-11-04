import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {build} from 'esbuild';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const execute=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));

test('the exported showcase HTML and complete JavaScript graph resolve only to delivered files',async t=>{
 const parent=path.join(root,'artifacts','showcase-tests');await mkdir(parent,{recursive:true});
 const output=await mkdtemp(path.join(parent,'export with spaces-'));
 t.after(async()=>{assert.ok(path.resolve(output).startsWith(path.resolve(parent)+path.sep));await rm(output,{recursive:true,force:true});});
 await execute(process.execPath,[path.join(root,'tools/build-showcase.mjs'),'--out',output],{cwd:root,windowsHide:true});
 const manifest=JSON.parse(await readFile(path.join(output,'manifest.json'),'utf8'));
 assert.deepEqual(manifest.themes.map(theme=>theme.id),PUBLIC_THEME_IDS,'the export includes the complete discovered collection');
 const page=path.join(output,'index.html'),html=await readFile(page,'utf8');
 const attribute=(tag,name)=>tag.match(new RegExp('\\b'+name+'=["\']([^"\']+)["\']','i'))?.[1];
 const references=[];
 for(const [tag]of html.matchAll(/<script\b[^>]*>/gi)){const src=attribute(tag,'src');if(src)references.push({kind:'script',href:src});}
 for(const [tag]of html.matchAll(/<link\b[^>]*>/gi)){if(attribute(tag,'rel')==='stylesheet')references.push({kind:'style',href:attribute(tag,'href')});}
 assert.ok(references.some(item=>item.kind==='script'),'HTML exposes a real application entry');
 const entries=[];
 for(const item of references){
  assert.ok(item.href?.startsWith('./')||item.href?.startsWith('../'),'delivered '+item.kind+' is local: '+item.href);
  const target=fileURLToPath(new URL(item.href,pathToFileURL(page)));
  assert.ok(path.resolve(target).startsWith(path.resolve(output)+path.sep),'HTML resource stays within the delivery');
  assert.ok((await stat(target)).isFile(),item.href+' exists');
  if(item.kind==='script')entries.push(target);
 }
 // Resolve the actual static and dynamic imports using the same JavaScript
 // parser as the build, rather than guessing import syntax with a regex.
 const graph=await build({absWorkingDir:root,entryPoints:entries,bundle:true,write:false,outdir:path.join(output,'unused'),platform:'browser',format:'esm',target:'es2022',metafile:true,logLevel:'silent'});
 for(const [input,metadata]of Object.entries(graph.metafile.inputs)){
  const file=path.resolve(root,input);
  assert.ok(file.startsWith(path.resolve(output)+path.sep),'JavaScript dependency belongs to the exported folder: '+input);
  assert.ok((await stat(file)).isFile(),input+' exists');
  assert.ok(metadata.imports.every(item=>!item.external),'no dependency is left for an external runtime');
 }
});
