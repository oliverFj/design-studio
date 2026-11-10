import {readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PUBLIC_THEME_IDS} from '../../../tools/public-themes.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root='E:/AI projekter/Second Gen/Hjemmeside';
const read=async name=>(await readFile(path.join(root,name),'utf8')).replaceAll('\r\n','\n');
const write=(name,text)=>writeFile(path.join(root,name),text);
const site=JSON.parse(await read('content/site.json'));site.themeIds=[...PUBLIC_THEME_IDS];
await write('content/site.json',JSON.stringify(site,null,2)+'\n');

let sync=await read('tools/sync-design-studio.mjs');
sync=sync.replace(/\/\/ Keep existing saved choices[\s\S]*?(?=await mkdir)/,"// The website exposes exactly Stade's current curated collection.\nconst {PUBLIC_THEME_IDS}=await import(pathToFileURL(path.join(config.studioRoot,'tools/public-themes.mjs')).href);\nsite.themeIds=[...PUBLIC_THEME_IDS];\nawait writeFile(path.join(ROOT,'content/site.json'),JSON.stringify(site,null,2)+'\\n');\n\n");
await write('tools/sync-design-studio.mjs',sync);

let build=await read('tools/build.mjs');
build=build.replace("import {resolveThemeMode}","import {resolveThemeMode,themeModeOptions}");
build=build.replace("if(packs[0].id!=='fjordside')throw new Error('Fjordside skal være standardtema.');","const defaultPack=packs.find(pack=>pack.id==='fjordside');\n  if(!defaultPack)throw new Error('Fjordside skal findes som hjemmesidens standardtema.');");
build=build.replace("const entry={id:pack.id,name:pack.name,modes:{}};","const entry={id:pack.id,name:pack.name,defaultMode:pack.defaultMode,options:themeModeOptions(pack),modes:{}};");
build=build.replace("for(const mode of ['light','dark']){","for(const mode of Object.keys(pack.modes)){");
build=build.replace("entry.modes[mode]={background:","entry.modes[mode]={label:pack.modes[mode].name,background:");
build=build.replace("dark:contrastRatio('#ffffff',tokens['color.background.canvas'])>contrastRatio('#000000',tokens['color.background.canvas'])","dark:pack.modes[mode].colorScheme?pack.modes[mode].colorScheme==='dark':contrastRatio('#ffffff',tokens['color.background.canvas'])>contrastRatio('#000000',tokens['color.background.canvas'])");
build=build.replace("  const styles=await css", "  const defaultTheme=themes.find(theme=>theme.id===defaultPack.id);\n  const styles=await css");
build=build.replaceAll('packs[0]','defaultPack').replaceAll('themes[0].modes.light','defaultTheme.modes[defaultTheme.defaultMode]');
await write('tools/build.mjs',build);

let render=await read('tools/render-site.mjs');
render="import {themeModeOptions} from '../design/runtime/theme-modes.mjs';\n"+render;
render=render.replace("label==='Visning'?'Vælg lys eller mørk visning'","label==='Farve'?'Vælg temafarve'");
render=render.replace("attrs:{value},text","attrs:{value,...((id==='journal-theme'&&value===theme.id)||(id==='journal-appearance'&&value===theme.defaultMode)?{selected:true}:{})},text");
render=render.replace("select('journal-appearance','Visning',[['system','System'],['light','Lys'],['dark','Mørk']])","select('journal-appearance','Farve',themeModeOptions(theme).map(option=>[option.value,option.label]))");
await write('tools/render-site.mjs',render);

await copyFile(path.join(here,'website-theme-choice.mjs'),path.join(root,'src/theme-choice.mjs'));
await copyFile(path.join(here,'website-theme-choice.test.mjs'),path.join(root,'tools/theme-choice.test.mjs'));
let app=await read('src/app.mjs');
app=app.replace("import {createColorModePreference} from '../design/runtime/theme-modes.mjs';","import {colorChoice,restoreThemeChoice} from './theme-choice.mjs';");
const start=app.indexOf("const key='fjordside.projektjournal.theme';"),end=app.indexOf('let compact=false;');
if(start<0||end<start)throw Error('Temavælgerens kilde er ændret.');
const controller=`const key='fjordside.projektjournal.theme',colorsKey='fjordside.projektjournal.colors';
let savedTheme,savedColors={},legacyMode=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
try{savedTheme=localStorage.getItem(key);savedColors=JSON.parse(localStorage.getItem(colorsKey)||'{}');const previous=localStorage.getItem('fjordside.projektjournal.appearance');if(['light','dark'].includes(previous))legacyMode=previous;}catch{}
const restored=restoreThemeChoice(themes,savedTheme,legacyMode,savedColors);
let current=restored.theme,colors=restored.colors,revision=0;
const status=document.createElement('span');
status.className='journal-theme-status';status.setAttribute('role','status');root.append(status);
function populateColors(){
 modeSelect.replaceChildren(...current.options.map(({value,label})=>{const option=document.createElement('option');option.value=value;option.textContent=label;return option;}));
 modeSelect.value=colorChoice(current,colors[current.id]);
}
function rememberChoice(){try{localStorage.setItem(key,current.id);localStorage.setItem(colorsKey,JSON.stringify(colors));}catch{}}
function apply(announce=false){
 const run=++revision,theme=current,modeName=colorChoice(theme,colors[theme.id]),mode=theme.modes[modeName];
 colors[theme.id]=modeName;select.value=theme.id;populateColors();
 const commit=()=>{
  root.dataset.theme=theme.id;root.dataset.mode=modeName;root.dataset.colorScheme=mode.dark?'dark':'light';
  productIllustrations.settle();document.body.style.backgroundColor=mode.background;
  document.documentElement.style.colorScheme=mode.dark?'dark':'light';
  root.querySelectorAll('[data-brand-logo]').forEach(img=>img.src=mode.dark?logos.paper:logos.terracotta);
  rememberChoice();if(announce)status.textContent='Tema: '+theme.name+', farve: '+mode.label;
 };
 const library=document.getElementById('journal-theme-library');
 if(mode.css!==undefined){library.textContent=mode.css;commit();return;}
 if(library.getAttribute('href')===mode.href){commit();return;}
 const next=document.createElement('link');next.rel='stylesheet';next.href=mode.href;next.media='not all';
 next.onload=()=>{
  next.onload=null;next.onerror=null;if(run!==revision){next.remove();return;}
  next.media='all';library.replaceWith(next);next.id='journal-theme-library';commit();
 };
 next.onerror=()=>{
  next.onload=null;next.onerror=null;next.remove();if(run!==revision)return;
  current=themes.find(theme=>theme.id===root.dataset.theme)||themes.find(theme=>theme.id==='fjordside');
  colors[current.id]=colorChoice(current,root.dataset.mode);select.value=current.id;populateColors();
  status.textContent='Farven kunne ikke indlæses. Prøv igen.';
 };
 library.after(next);
}
select.addEventListener('change',()=>{current=themes.find(theme=>theme.id===select.value);apply(true);});
modeSelect.addEventListener('change',()=>{colors[current.id]=modeSelect.value;apply(true);});
`;
app=app.slice(0,start)+controller+app.slice(end);await write('src/app.mjs',app);

let styles=await read('src/styles.css');
const brandBlock=/\/\* Product artwork inherits live theme tokens, including after light\/dark changes\. \*\/[\s\S]*?#fjordside-site \.product-cover-placeholder\{[^}]+\}(?:\n@container[^\n]+)?/;
if(!brandBlock.test(styles))throw Error('Produktlogoernes CSS er ændret.');
styles=styles.replace(brandBlock,(await readFile(path.join(here,'website-product-illustrations.css'),'utf8')).trim());
await write('src/styles.css',styles);
console.log('Tilpasset til Stades 13 temaer og alle navngivne farver. Produktlogoer og logotekst er forstørret.');
