import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {PUBLIC_THEME_IDS} from '../../../tools/public-themes.mjs';
import {resolveThemeMode,themeModeOptions} from '../../../core/theme-modes.mjs';
import {resolveTokens} from '../../../core/engine.mjs';
import {GRAPHIC_TOKEN_BINDINGS} from '../../../core/graphic-tokens.mjs';
import {cssVariableName} from '../../../core/contract.mjs';

const website='E:/AI projekter/Second Gen/Hjemmeside';
const html=await readFile(path.join(website,'dist/index.html'),'utf8');
const {themes}=JSON.parse(html.match(/<script type="application\/json" id="journal-config">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(themes.map(theme=>theme.id),PUBLIC_THEME_IDS,'Temasamlingen skal svare præcist til Stade.');
const normalize=value=>{const text=String(value).trim().toLowerCase();return /^-?(?:\d+\.?\d*|\.\d+)$/.test(text)?String(Number(text)):text.replace(/^#([a-f0-9])([a-f0-9])([a-f0-9])$/,'#$1$1$2$2$3$3');};
let colors=0,materials=0;
for(const theme of themes){
 const pack=JSON.parse(await readFile(new URL('../../../packages/'+theme.id+'.json',import.meta.url),'utf8'));
 assert.deepEqual(theme.options,themeModeOptions(pack),theme.id+': samme farvenavne og rækkefølge.');
 assert.deepEqual(Object.keys(theme.modes),Object.keys(pack.modes),theme.id+': alle faktiske farver.');
 assert.equal(theme.defaultMode,pack.defaultMode);
 for(const [mode,info] of Object.entries(theme.modes)){
  const tokens=resolveTokens(resolveThemeMode(pack,mode));
  const css=await readFile(path.join(website,'dist',info.href),'utf8');
  assert.equal(info.dark,pack.modes[mode].colorScheme==='dark');
  for(const token of [...Object.values(GRAPHIC_TOKEN_BINDINGS),'color.background.canvas']){
   const variable=cssVariableName(token),actual=css.match(new RegExp(variable+':([^;}]+)'))?.[1];
   assert.equal(normalize(actual),normalize(tokens[token]),theme.id+'/'+mode+': '+token);materials++;
  }
  colors++;
 }
}
console.log(`Stade-paritet bestået: ${themes.length} temaer, ${colors} navngivne farver og ${materials} materiale-/farveværdier matcher kilderne.`);
