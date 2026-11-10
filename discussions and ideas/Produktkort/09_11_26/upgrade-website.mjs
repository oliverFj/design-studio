import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {products,families,scene} from './scenes.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const website='E:/AI projekter/Second Gen/Hjemmeside';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const projects=JSON.parse(await readFile(path.join(website,'content/projects.json'),'utf8'));
const logoRoot='E:/AI projekter/Second Gen/Guitar/design/assets';
for(const mode of ['light','dark'])await copyFile(path.join(logoRoot,`tonerum-symbol-${mode}.svg`),path.join(website,`assets/projects/tonerum/logo-${mode}.svg`));
await mkdir(path.join(website,'assets/projects/formlab'),{recursive:true});
await copyFile('E:/AI projekter/Second Gen/FormLab/design/assets/castle-studio-logo.svg',path.join(website,'assets/projects/formlab/logo.svg'));
function brand(product){
 let logo='',word=esc(product.name);
 if(product.id==='tonerum'){
  logo=['light','dark'].map(mode=>`<img class="product-cover-logo product-cover-logo--${mode}" src="assets/projects/tonerum/logo-${mode}.svg" alt="">`).join('');
  word='tonerum<span class="product-cover-dot">.</span>';
 }else if(product.id==='ringsmith')logo='<span class="product-cover-ring-mark">◎</span>';
 else if(product.id==='formationsstudio')logo='<span class="product-cover-formation-mark">F</span>';
 else if(product.id==='formlab')logo='<img class="product-cover-logo product-cover-logo--formlab" src="assets/projects/formlab/logo.svg" alt="">';
 return `<div class="product-cover-brand" data-product="${product.id}" aria-hidden="true">${logo}<span class="product-cover-wordmark">${word}</span></div>`;
}
await mkdir(path.join(website,'content/covers'),{recursive:true});
for(const product of products){
 const project=projects.find(p=>p.id===product.id);
 for(const [family,name] of Object.entries(families)){
  const artwork=scene(product.id,0,family),prefix='product-'+artwork.id;
  const svg=`<svg class="journal-product-art" xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" role="img" aria-labelledby="${prefix}-title" data-product-illustration="${product.id}" data-family="${family}" data-motif="${artwork.id}"><title id="${prefix}-title">${esc(artwork.label)}</title><rect width="600" height="420" fill="var(--g-ground)"/><g fill="none" stroke-linecap="round" stroke-linejoin="round">${artwork.parts.map(part=>`<g data-part="${part.key}">${part.body}</g>`).join('')}</g></svg>`;
  const source=`content/covers/${product.id}-a-${family}.html`;
  const transparent=svg.replace('<rect width="600" height="420" fill="var(--g-ground)"/>','');
  await writeFile(path.join(website,source),`<div class="journal-product-illustration">${brand(product)}${transparent}</div>\n`);
  project.media[0].illustrations[family]={source,alt:`${product.name}: ${product.ideas[0][0]}. ${product.ideas[0][1]} Illustreret i ${name}.`};
 }
}
await writeFile(path.join(website,'content/projects.json'),JSON.stringify(projects,null,2)+'\n');
await copyFile(path.join(here,'website-product-illustrations.mjs'),path.join(website,'src/product-illustrations.mjs'));
const animation=(await readFile(path.join(here,'animation.mjs'),'utf8')).replace('../../../core/graphics/motion/primitives.mjs','../design/runtime/graphics/motion/primitives.mjs');
await writeFile(path.join(website,'src/product-illustration-plan.mjs'),animation);
const cssPath=path.join(website,'src/styles.css'),css=await readFile(cssPath,'utf8');
if(!css.includes('.journal-product-illustration{'))await writeFile(cssPath,css+'\n'+await readFile(path.join(here,'website-product-illustrations.css'),'utf8'));
const appPath=path.join(website,'src/app.mjs');
let app=await readFile(appPath,'utf8');
if(!app.includes("from './product-illustrations.mjs'")){
 app="import {mountProductIllustrations} from './product-illustrations.mjs';\n"+app;
 app=app.replace("const root=document.getElementById('fjordside-site');","const root=document.getElementById('fjordside-site');\nconst productIllustrations=mountProductIllustrations(root);\nwindow.addEventListener('pagehide',event=>{if(event.persisted)productIllustrations.settle();else productIllustrations.destroy();});");
 app=app.replace('root.dataset.theme=theme.id;root.dataset.mode=modeName;','root.dataset.theme=theme.id;root.dataset.mode=modeName;\n    productIllustrations.settle();');
 app=app.replace('function applyIllustration(announce=false){','function applyIllustration(announce=false){\n  productIllustrations.settle();');
 await writeFile(appPath,app);
}
// Changing link.media may dispatch load again. A completed swap must not later
// remove its own active stylesheet when another preference changes the revision.
app=app.replace(/next.onload=\(\)=>\{\r?\n    if\(run!==revision\)/,"next.onload=()=>{\n    next.onload=null;next.onerror=null;\n    if(run!==revision)");
await writeFile(appPath,app);
const syncPath=path.join(website,'tools/sync-design-studio.mjs');
let sync=await readFile(syncPath,'utf8');
if(!sync.includes('PUBLIC_THEME_IDS')){
 sync=sync.replace('{readFile,mkdir,copyFile}','{readFile,writeFile,mkdir,copyFile}');
 sync="import {pathToFileURL} from 'node:url';\n"+sync;
 const anchor="const site=JSON.parse(await readFile(path.join(ROOT,'content/site.json'),'utf8'));";
 if(!sync.includes(anchor))throw Error('Tema-synkroniseringens kilde har ændret sig.');
 sync=sync.replace(anchor,anchor+"\n// Keep existing saved choices while discovering newly published central themes.\nconst {PUBLIC_THEME_IDS}=await import(pathToFileURL(path.join(config.studioRoot,'tools/public-themes.mjs')).href);\nconst added=PUBLIC_THEME_IDS.filter(id=>!site.themeIds.includes(id));\nif(added.length){site.themeIds.push(...added);await writeFile(path.join(ROOT,'content/site.json'),JSON.stringify(site,null,2)+'\\n');}\n");
 await writeFile(syncPath,sync);
}
console.log('Overført: 16 temabundne SVG-kompositioner, produktlogoer, fælles animationsplan og opdagelse af nye temaer.');
