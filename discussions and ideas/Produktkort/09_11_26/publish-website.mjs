import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const website='E:/AI projekter/Second Gen/Hjemmeside';
const moduleAt=name=>import(pathToFileURL(path.join(website,'tools',name)).href);
const {checkBuild}=await moduleAt('check.mjs');
const {openHosting,remoteBuffer}=await moduleAt('hosting.mjs');
const {digest}=await moduleAt('build.mjs');
const manifest=await checkBuild();
if(manifest.target!=='production')throw Error('Der kræves et produktionsbuild.');
const site=JSON.parse(await readFile(path.join(website,'content/site.json'),'utf8'));
if(new URL(site.url).hostname!=='oliver.fjordside.dk')throw Error('Forkert hjemmeside.');
const previous=JSON.parse(await readFile(path.join(website,'.deploy-state.json'),'utf8'));
// This delivery updates the portfolio only; locally changed embedded apps/demo stay local.
const portfolio=name=>['index.html','brand.json','robots.txt','licenses.txt'].includes(name)||name.startsWith('assets/');
const names=Object.keys(manifest.files).filter(name=>portfolio(name)&&previous.files[name]?.sha256!==manifest.files[name].sha256).sort((a,b)=>a==='index.html'?1:b==='index.html'?-1:a.localeCompare(b));
let {client,base}=await openHosting();
try{
 const marker=JSON.parse((await remoteBuffer(client,path.posix.join(base,'.fjordside-site.json'))).toString());
 if(marker.site!=='fjordside-portfolio'||marker.target!=='production')throw Error('Hovedadressen tilhører ikke dette produktionsprojekt.');
 for(const name of names){
  const remote=path.posix.join(base,name);
  for(let attempt=0;attempt<2;attempt++){
   try{await client.ensureDir(path.posix.dirname(remote));await client.uploadFrom(path.join(website,'dist',name),remote);break;}
   catch(error){if(attempt||!['ECONNRESET','ETIMEDOUT','EPIPE'].includes(error.code))throw Error('Upload mislykkedes: '+name,{cause:error});client.close();({client,base}=await openHosting());}
  }
 }
 for(const name of names){
  const actual=await remoteBuffer(client,path.posix.join(base,name));
  if(digest(actual)!==manifest.files[name].sha256)throw Error('Uploadkontrol fejlede: '+name);
 }
 // Keep records for unchanged public demos instead of claiming the local versions were sent.
 const files={...previous.files,...Object.fromEntries(Object.entries(manifest.files).filter(([name])=>portfolio(name)))};
 await writeFile(path.join(website,'.deploy-state.json'),JSON.stringify({url:site.url,uploadedAt:new Date().toISOString(),files},null,2)+'\n');
 console.log(`Udgivet og hashkontrolleret: ${site.url} (${names.length} ændrede filer; separat Stade-demo og apps er ikke uploadet).`);
}finally{client.close();}
