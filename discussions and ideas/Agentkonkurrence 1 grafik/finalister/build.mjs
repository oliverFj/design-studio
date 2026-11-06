import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {FAMILIES,MOTIFS,makeSvg} from './src/graphics.mjs';
import {THEMES,TOKENS} from './src/palettes.mjs';
import {MOTION} from './src/motion/player.mjs';
import {animatedDocument} from './src/motion/document.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const read=relative=>fs.readFileSync(path.join(here,relative),'utf8');
const write=(relative,content)=>{const target=path.join(here,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content,'utf8');};
const files=fs.readdirSync(path.join(root,'packages')).filter(name=>name.endsWith('.json'));
for(const file of files){
 const theme=JSON.parse(fs.readFileSync(path.join(root,'packages',file),'utf8'));
 const profile=THEMES[theme.id];
 if(!profile)throw new Error('Mangler illustrationspalet: '+theme.id);
 for(const mode of Object.keys(theme.modes??{}))if(!profile.modes[mode])throw new Error('Mangler farvevariation: '+theme.id+'/'+mode);
}
let fontCSS='',licenses='';
for(const [name,file,license] of [
 ['Inter','inter-latin-wght-normal.woff2','inter-OFL.txt'],
 ['Source Serif 4','source-serif-4-latin-wght-normal.woff2','source-serif-4-OFL.txt']
]){
 const base=path.join(root,'assets/fonts');
 fontCSS+=`@font-face{font-family:'${name}';font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(base,file)).toString('base64')}) format('woff2')}`;
 licenses+=fs.readFileSync(path.join(base,license),'utf8')+'\n';
}
const playerBuild=await build({entryPoints:[path.join(here,'src/motion/standalone.mjs')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,logLevel:'silent'});
const playerSource=playerBuild.outputFiles[0].text;
new Function(playerSource);
const {outputFiles}=await build({entryPoints:[path.join(here,'src/app.mjs')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:false,logLevel:'silent',define:{__ANIMATED_PLAYER__:JSON.stringify(playerSource)}});
const app=outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=read('src/presentation.html').replace('/*__FONTS__*/',fontCSS).replace('/*__STYLES__*/',read('src/styles.css')).replace('/*__APP__*/',()=>app).replace('<!--__LICENSES__-->',()=>`<!-- ${licenses.replaceAll('--','—')} -->`);
if(/<(?:script|link|img)\b[^>]*(?:src|href)=["'](?:https?:|\/\/)/i.test(html))throw new Error('Prøvevisningen skal være selvstændig.');
new Function(app);
write('index.html',html);

const manifest={schemaVersion:1,status:'motion-study',name:'Design Studio · Fire grafiske finalister med animation',viewBox:'0 0 600 420',defaultExport:{theme:'signal',mode:'light'},motion:{playback:'finite, reversible, seekable',interaction:'pointer and arrow keys',reducedMotion:'static approved form',loop:'explicit opt-in'},tokens:TOKENS.map(([key,name,purpose])=>({key,name,purpose})),themes:THEMES,families:[]};
let count=0;
for(const family of FAMILIES){
 const info={...family.meta,motion:MOTION[family.meta.id].meta,motifs:[]};
 for(const motif of MOTIFS){
  const prefix=family.meta.id+'-'+motif.id;
  const scene=makeSvg(family.meta.id,motif.id,THEMES.signal.modes.light,{prefix,resolved:true});
  const groups=[...scene.body.matchAll(/data-part="([^"]+)"/g)].map(m=>m[1]);
  if(groups.length!==scene.parts.length||new Set(groups).size!==groups.length||scene.parts.some(p=>!groups.includes(p.key)))throw new Error('Uoverensstemmende dele: '+prefix);
  if(/var\(/.test(scene.svg))throw new Error('Uopløst SVG-variabel: '+prefix);
  if(scene.viewBox!=='0 0 600 420')throw new Error('Forkert billedformat: '+prefix);
  const ids=[...scene.svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)throw new Error('Dobbelt SVG-id: '+prefix);
  for(const ref of scene.svg.matchAll(/url\(#([^)]+)\)/g))if(!ids.includes(ref[1]))throw new Error('Ugyldig SVG-reference: '+ref[1]);
  const file=`svg/${family.meta.id}/${motif.id}.svg`;
  write(file,'<?xml version="1.0" encoding="UTF-8"?>\n'+scene.svg);
  const animatedFile=`animated/${family.meta.id}/${motif.id}.html`;
  write(animatedFile,animatedDocument({svg:scene.svg,title:family.meta.name+' · '+motif.name,description:MOTION[family.meta.id].meta.description,playerSource}));
  info.motifs.push({...motif,label:scene.label,file,animatedFile,parts:scene.parts});count++;
 }
 manifest.families.push(info);
}
write('manifest.json',JSON.stringify(manifest,null,2)+'\n');
write('font-licenses.txt',licenses);
console.log(`Bygget: index.html · ${count} SVG-motiver og ${count} animerede HTML-filer · ${Object.keys(THEMES).length} temaer · ${Object.values(THEMES).reduce((n,t)=>n+Object.keys(t.modes).length,0)} farvevariationer.`);
