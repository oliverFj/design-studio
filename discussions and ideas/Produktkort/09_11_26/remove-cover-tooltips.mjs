import {readFile,writeFile} from 'node:fs/promises';

const file='E:/AI projekter/Second Gen/Hjemmeside/tools/render-site.mjs';
const source=await readFile(file,'utf8');
const anchor="    let markup = await readFile(localFile(root, media.source),'utf8');";
if(!source.includes(anchor))throw Error('Medierendererens kilde har ændret sig.');
const addition=`
    // SVG titles show native hover tooltips. Keep the same ARIA references
    // and description text without the visible popup on product covers.
    if(media.kind==='cover')markup=markup.replace(/<title(?=[\\s>])/g,'<desc').replace(/<\\/title>/g,'</desc>');`;
if(!source.includes('SVG titles show native hover tooltips.'))await writeFile(file,source.replace(anchor,anchor+addition));
console.log('Produktkort bruger SVG-beskrivelser uden browserens hover-popup.');
