import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build,transform} from 'esbuild';
import {generateCSS,resolveTokens} from '../core/engine.mjs';
import {resolveThemeMode,resolveThemeModeId} from '../core/theme-modes.mjs';
import {GRAPHIC_FAMILIES} from '../core/graphics.mjs';
import {renderComponent} from '../core/components.mjs';
import {CONCEPTS,conceptScene,renderConcept} from '../examples/graphics/concepts.mjs';
import {offlineIssues} from './offline-checks.mjs';
import {TABLER_LICENSE} from '../core/icons.mjs';
import {SIGNATURE_LICENSE} from '../core/signature-assets.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rawScript=value=>value.replace(/<\/script/gi,'<\\/script');

/** Build only authored local recipes. No prompt service, executable JSON or network. */
export async function buildGraphicLab({theme='studio-light',mode,family='all',concept='all',output=path.join(root,'artifacts/graphic-lab'),force=false}={}){
 if(!/^[a-z][a-z0-9-]*$/.test(theme))throw new Error('Theme must be a local theme ID.');
 const source=JSON.parse(await readFile(path.join(root,'packages',theme+'.json'),'utf8'));
 mode??=source.defaultMode??'light';
 const pack=resolveThemeMode(source,mode),tokens=resolveTokens(pack),selectedMode=resolveThemeModeId(source,mode);
 const families=GRAPHIC_FAMILIES.filter(item=>family==='all'||item.id===family),concepts=CONCEPTS.filter(item=>concept==='all'||item.id===concept);
 if(!families.length||!concepts.length)throw new Error('Unknown family or concept. See --help.');
 const scenes=families.flatMap(item=>concepts.map(c=>conceptScene(c.id,item.id)));
 const button=(id,label,variant='secondary')=>renderComponent(pack,'button',{label,variant,attrs:{id}});
 const cards=scenes.map(scene=>{
  const id=scene.family+'-'+scene.concept,svg=renderConcept(pack,scene,{tokens});
  const name=CONCEPTS.find(c=>c.id===scene.concept).name,style=families.find(f=>f.id===scene.family).name;
  const steps=scene.parts.map(p=>`<li><strong>${esc(p.name)}</strong> · ${Math.round(p.start*100)}–${Math.round(p.end*100)} %<br>${esc(p.purpose)}</li>`).join('');
  return `<article class="study" data-study="${id}">${svg}<div class="caption"><h2>${esc(name)} / ${esc(style)}</h2><span class="eyebrow">${esc(scene.family)}</span></div><p>${esc(scene.label)}</p><div class="links">${renderComponent(pack,'button',{label:'Afspil igen',variant:'tertiary',attrs:{'data-replay':''}})}<a download="${id}.svg" href="data:image/svg+xml,${esc(encodeURIComponent(svg))}">Hent SVG</a></div><details class="recipe"><summary>Se lag og handlingsforløb</summary><ol>${steps}</ol></details></article>`;
 }).join('');
 const bundle=await build({entryPoints:[path.join(root,'examples/graphics/preview.mjs')],bundle:true,write:false,format:'iife',target:'es2022',minify:true,legalComments:'none',define:{__GRAPHIC_LAB_DATA__:JSON.stringify({scenes})}});
 const css=(await transform(await readFile(path.join(root,'examples/graphics/preview.css'),'utf8'),{loader:'css',minify:true})).code;
 const licenses=[TABLER_LICENSE,SIGNATURE_LICENSE,...(pack.brand?.assets??[]).filter(asset=>asset.mimeType==='text/plain').map(asset=>Buffer.from(asset.data,'base64').toString('utf8'))].join('\n\n');
 const html=`<!doctype html><html lang="da"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Grafikværksted · Hus og musik</title><style>${generateCSS(pack)}${css}</style><body class="ds-scope"><main class="ds-layout" data-layout="workspace"><header><p class="eyebrow">Design Studio / Grafikværksted</p><h1>Et begreb.<br>Fire måder at se det på.</h1><p class="intro">Hus og musik som tegnede studier. Hver stil har sit eget materiale, sin egen fortælling og sin egen måde at komme til syne på.</p><p>${esc(source.name)} · ${esc(selectedMode)} · ${scenes.length} studier</p></header><div class="toolbar" aria-label="Animationsværktøjer">${button('play-all','Afspil alle','primary')}${button('pause-all','Pause')}${button('reverse-all','Spil baglæns')}${button('settle-all','Vis færdig')}<label class="timeline" for="timeline">Forløb<input id="timeline" type="range" min="0" max="100" value="100"><output id="position" for="timeline">100 %</output></label><label class="reduce"><input id="reduce" type="checkbox">Reducer bevægelse</label></div><p id="motion-help">Før markøren over et motiv, eller fokusér det med Tab. Enter afspiller eller pauser. Lysrum reagerer også diskret på markør og piletaster. Systemets reducerede bevægelse respekteres altid.</p><section class="studies" aria-label="Begrebsstudier">${cards}</section><footer>En begyndelse på en opskriftsbaseret generator. Nye begreber tegnes og beskrives i kildekoden; prøvevisningen bruger Design Studios fælles afspiller. Musikmotiverne er visuelle fortolkninger, ikke en analyse af lyddata.</footer></main><script type="text/plain" id="asset-licenses">${rawScript(licenses)}</script><script>${rawScript(bundle.outputFiles[0].text)}</script></body></html>`;
 const issues=offlineIssues(html);
 if(issues.length)throw new Error('Graphic lab is not self-contained: '+issues.join(', '));
 output=path.resolve(output);
 const existing=await readdir(output).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
 if(existing.length&&!force)throw new Error('Output directory is not empty; choose a new --out or use --force to rebuild the lab files.');
 await mkdir(output,{recursive:true});
 const flag=force?'w':'wx';
 await writeFile(path.join(output,'index.html'),html,{flag});
 for(const scene of scenes)await writeFile(path.join(output,scene.family+'-'+scene.concept+'.svg'),renderConcept(pack,scene,{tokens}),{flag});
 const manifest={version:1,theme,mode:selectedMode,scenes:scenes.map(({parts,...scene})=>({...scene,parts:parts.map(({body,...part})=>part)}))};
 await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag});
 return {output,scenes:scenes.length,html,manifest};
}

export function parseGraphicLabArgs(args){
 const options={};
 for(let i=0;i<args.length;i++){
  const key=args[i];
  if(key==='--help')return {help:true};
  if(key==='--force'){options.force=true;continue;}
  const name={'--theme':'theme','--mode':'mode','--family':'family','--concept':'concept','--out':'output'}[key];
  if(!name||!args[i+1]||args[i+1].startsWith('--'))throw new Error('Unknown or incomplete argument: '+key);
  options[name]=args[++i];
 }
 return options;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const options=parseGraphicLabArgs(process.argv.slice(2));
 if(options.help)console.log('node tools/graphic-lab.mjs [--theme ID] [--mode MODE] [--family anatomy|lightroom|passage|fieldlines|all] [--concept house|music|all] [--out DIRECTORY] [--force]');
 else {const result=await buildGraphicLab(options);console.log('Grafikværksted: '+result.output+' · '+result.scenes+' studier');}
}
