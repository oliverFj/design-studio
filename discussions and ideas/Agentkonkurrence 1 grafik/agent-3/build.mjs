import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const folder=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(folder,'../../..');
const font=(name)=>fs.readFileSync(path.join(root,'assets/fonts',name)).toString('base64');
const base=fs.readFileSync(path.join(folder,'presentation.html'),'utf8');
const output=base.replace('INTER_FONT_DATA',font('inter-latin-wght-normal.woff2')).replace('SERIF_FONT_DATA',font('source-serif-4-latin-wght-normal.woff2'));
fs.writeFileSync(path.join(folder,'../agent-3.html'),output);
console.log('Skrevet agent-3.html: '+Buffer.byteLength(output)+' bytes');
