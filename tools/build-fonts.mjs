import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validatePackage} from '../core/engine.mjs';
import {PUBLIC_THEME_IDS} from './public-themes.mjs';

// Offline regeneration from the reviewed webfonts and their original licenses.
// manifest.json pins the exact upstream files and records Platypi conversion.
const root=new URL('../',import.meta.url),directory=new URL('assets/fonts/',root);
const manifest=JSON.parse(await readFile(new URL('manifest.json',directory),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sans='Inter, system-ui, sans-serif',serif='"Source Serif 4", Georgia, serif',mono='"Roboto Mono", ui-monospace, monospace';
const families={
 'studio-light':['inter','roboto-mono'],
 'midnight-editorial':['inter','source-serif-4','roboto-mono'],
 atelier:['inter','source-serif-4','roboto-mono'],
 nocturne:['inter','source-serif-4','roboto-mono'],
 signal:['inter','roboto-mono'],
 fjordside:['inter','platypi','roboto-mono'],
 'castle-studio':['nunito','alegreya','roboto-mono'],
 'castle-studio-v2':['nunito','alegreya','roboto-mono'],
};
const typography={
 'studio-light':'Inter følger temaet som lokal variabel WOFF2 og giver samme primære skrift på tværs af platforme. Vægt og størrelse skaber hierarki. Roboto Mono bruges til kode og tekniske detaljer.',
 'midnight-editorial':'Source Serif 4 giver overskrifterne et redaktionelt udtryk; Inter giver kontroller og brødtekst præcision. Begge følger temaet som lokale variable WOFF2-filer. Roboto Mono bruges til tekniske detaljer.',
 atelier:'Source Serif 4 giver titler og korte expressive passager karakter; Inter bruges til brødtekst og kontroller. De lokale variable WOFF2-filer gør primærskrifterne uafhængige af installerede systemskrifter. Roboto Mono bruges til tekniske detaljer.',
 nocturne:'Inter står for overskrifter, brødtekst og kontroller. Source Serif 4 giver korte expressive tekststeder en mere poetisk karakter. Roboto Mono bruges til tekniske detaljer. Alle tre leveres som lokale variable WOFF2-filer.',
 signal:'Inter gør lange labels og indhold let at læse. Roboto Mono giver korte tekniske detaljer identitet uden at overtage grænsefladen. Begge leveres som lokale variable WOFF2-filer.',
 fjordside:'Platypi er stemmen i overskrifter, display, citater og trykt brødtekst. Inter er den portable websans til webbrødtekst og funktioner, med samme tilbageholdende rolle som den oprindelige Helvetica-stak. Webbrødtekst er 17px med 1.65 linjeafstand og højst 62ch. Redaktionelle labels er særskilte sans-labels på 11px med versaler og 0.16em tracking; funktionelle formularlabels er 14px uden versaler. Overskriftsvægte er 300–500; ordmærkets særregel findes under Logo. Platypi-normal og -kursiv er WOFF2-konverteringer uden tab af tegn eller variable vægte; de originale TTF-filer bevares i kilderne. Roboto Mono bruges til tekniske detaljer.',
};
const assetsByFamily={};
for(const [id,family]of Object.entries(manifest.families)){
 const fontAssets=[];
 for(const face of family.files){
  const bytes=await readFile(new URL(face.file,directory));
  if(hash(bytes)!==face.sha256||bytes.length!==face.bytes||bytes.subarray(0,4).toString()!=='wOF2')throw new Error('Webfonten afviger fra manifestet: '+face.file);
  fontAssets.push({id:'font-'+id+'-'+face.style,name:family.family+' · '+face.style,fileName:face.file.split('/').at(-1),mimeType:'font/woff2',data:bytes.toString('base64'),description:family.family+' som lokal WOFF2. '+face.coverage+' Den medfølgende OFL-licens skal bevares.',font:{family:family.family,style:face.style,weight:face.weight}});
 }
 const license=await readFile(new URL(family.licenseFile,directory));
 if(hash(license)!==family.licenseSha256||license.length!==family.licenseBytes)throw new Error('Fontlicensen afviger fra manifestet: '+family.licenseFile);
 fontAssets.push({id:'license-'+id,name:family.family+' · OFL-licens',fileName:id+'-OFL.txt',mimeType:'text/plain',data:license.toString('base64'),description:'Uændret original SIL Open Font License, som følger fontfilerne.'});
 assetsByFamily[id]=fontAssets;
}
for(const id of PUBLIC_THEME_IDS){
 const file=new URL('packages/'+id+'.json',root),theme=JSON.parse(await readFile(file,'utf8'));
 const body=id.startsWith('castle-studio')?'Nunito, system-ui, sans-serif':sans;
 const heading=id==='fjordside'?'Platypi, Georgia, serif':['atelier','midnight-editorial'].includes(id)?serif:'{typography.font.body}';
 for(const [role,value]of Object.entries({body,heading,mono,...(['atelier','nocturne'].includes(id)?{expressive:serif}:id==='signal'?{expressive:mono}:{})}))theme.tokens['typography.font.'+role]={$type:'fontFamily',$value:value,description:'Primærskriften følger temaet som lokal WOFF2; generisk fallback bruges til tegn uden for den medfølgende dækning.'};
 // Logo originals and non-font brand resources remain byte-for-byte intact.
 const fontLicenses=new Set(['license-platypi','nunito-license','alegreya-license',...Object.keys(manifest.families).map(family=>'license-'+family)]);
 theme.brand.assets=theme.brand.assets.filter(asset=>!asset.font&&!fontLicenses.has(asset.id));
 theme.brand.assets.push(...families[id].flatMap(family=>structuredClone(assetsByFamily[family])));
 const section=theme.brand.sections.find(item=>item.id==='typography'||item.id==='type');
 if(section&&typography[id])section.description=typography[id];
 if(section&&id.startsWith('castle-studio')){
  section.description=section.description.replace('De lokale fontoriginaler og licenser følger temaet.','De lokale WOFF2-fontoriginaler og licenser følger temaet.');
  if(!section.description.includes('Variabel Nunito'))section.description+=' Variabel Nunito dækker 500, 600, 700 og 800; Alegreya-kursiv bevares i vægt 500. Roboto Mono følger med til tekniske detaljer.';
 }
 if(id==='signal'&&section){section.title='Portable skrifter og tekniske detaljer';section.dos=section.dos.map(text=>text.replace('i systemskriften','i Inter'));}
 theme.brand.sources=theme.brand.sources.filter(source=>!/(?:font|woff|skrift|Platypi)/i.test(source.title)&&!source.location.includes('node_modules/@fontsource/'));
 for(const family of families[id])theme.brand.sources.push({title:manifest.families[family].family+' · WOFF2 og original licens',location:'assets/fonts/manifest.json; '+manifest.families[family].source});
 if(id==='fjordside')for(const source of theme.brand.sources)source.location=source.location.replace('E:/AI projekter/Design System/','Historisk brandkilde: Design System/');
 const note='Portable lokale WOFF2-skrifter med originale OFL-licenser. Primære sans-, serif- og mono-roller afhænger ikke af installerede platformskrifter; Platypi er komprimeret uden subsetting.';
 if(!theme.history.some(item=>item.note===note))theme.history.push({date:'2026-10-30',note});
 const result=validatePackage(theme);if(!result.valid)throw new Error(id+':\n'+result.errors.join('\n'));
 await writeFile(file,JSON.stringify(theme,null,2)+'\n');
 console.log(id+': '+families[id].map(key=>manifest.families[key].family).join(', '));
}
