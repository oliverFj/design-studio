import {build,transform} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validatePackage} from '../core/engine.mjs';
import {TABLER_LICENSE} from '../core/icons.mjs';
import {SIGNATURE_LICENSE} from '../core/signature-assets.mjs';
import {offlineIssues} from './offline-checks.mjs';
import {assertDeliverySize} from './delivery-size.mjs';
import {dataModule} from './bundle-data.mjs';

const studioRoot=fileURLToPath(new URL('../',import.meta.url));
export const SCENE_IDS=Object.freeze(['aureol','obsidian']);

/** Render both independent offline pages. No existing build output is read. */
export async function buildScenePages(root=studioRoot){
 const themes=await Promise.all(SCENE_IDS.map(async id=>{
  const source=JSON.parse(await readFile(path.join(root,'packages',id+'.json'),'utf8'));
  const result=validatePackage(source);if(!result.valid)throw new Error(id+': '+result.errors.join('\n'));
  return source;
 }));
 const directory=path.join(root,'examples/scenes');
 const bundle=await build({absWorkingDir:root,entryPoints:[path.join(directory,'boot.mjs')],bundle:true,write:false,format:'iife',target:'es2022',minify:true,legalComments:'none',plugins:[{
  name:'scene-themes',setup(builder){
   builder.onResolve({filter:/bundled-themes\.mjs$/},()=>({path:'scene-themes',namespace:'scenes'}));
   builder.onLoad({filter:/^scene-themes$/,namespace:'scenes'},()=>({contents:dataModule(themes),loader:'js'}));
  },
 }]});
 const [template,styles]=await Promise.all([readFile(path.join(directory,'index.template.html'),'utf8'),readFile(path.join(directory,'styles.css'),'utf8')]);
 const css=(await transform(styles,{loader:'css',minify:true,legalComments:'none'})).code;
 const script=bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
 return SCENE_IDS.map(id=>{
  const title=id==='aureol'?'Aureol · Mellem lys og virkelighed':'Obsidian · Et andet tyngdepunkt';
  const html=template.replaceAll('{{SCENE_ID}}',id).replaceAll('{{SCENE_TITLE}}',title)
   .replace('<link rel="stylesheet" href="./styles.css">',()=>'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>')
   .replace('<script type="module" src="./boot.mjs"></script>',()=>'<script>'+script+'</script>')
   .replace('</head>',()=>'<script type="text/plain" id="stade-licenses">'+TABLER_LICENSE+'\n\n'+SIGNATURE_LICENSE+'</script></head>');
  const issues=offlineIssues(html);if(issues.length)throw new Error(id+': '+issues.join('\n'));
  assertDeliverySize('workspace',html);
  return {id,html};
 });
}

export async function buildScenes({root=studioRoot,outputDirectory=path.join(root,'examples/scenes')}={}){
 const pages=await buildScenePages(root);await mkdir(outputDirectory,{recursive:true});
 for(const {id,html}of pages){await writeFile(path.join(outputDirectory,id+'.html'),html);console.log('Offline scene bygget: '+id+' · '+Math.round(Buffer.byteLength(html)/1024)+' KB');}
 return pages;
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await buildScenes();
