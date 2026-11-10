import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import './upgrade-website.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const file='E:/AI projekter/Second Gen/Hjemmeside/src/styles.css';
const current=await readFile(file,'utf8');
const marker='/* Product artwork inherits live theme tokens, including after light/dark changes. */';
const start=current.indexOf(marker);
if(start<0)throw Error('Produktgrafikkens CSS-afsnit mangler.');
// This final section is owned by the product-card authoring recipe.
await writeFile(file,current.slice(0,start)+(await readFile(path.join(here,'website-product-illustrations.css'),'utf8')).trim()+'\n');
console.log('Logoer centreret; de 16 illustrationer har ingen fladedækkende billedbund.');
