import { runCLI } from './cli.mjs';
import { PUBLIC_THEME_IDS } from './public-themes.mjs';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {materializePackage,resolveTokens} from '../core/engine.mjs';
import {componentGeometryReport} from '../core/geometry.mjs';
import {controlBoundaryReport} from '../core/quality.mjs';

for (const id of PUBLIC_THEME_IDS) {
  await runCLI(['validate', `packages/${id}.json`]);
  if (id !== PUBLIC_THEME_IDS[0]) {
    await runCLI(['compare', `packages/${PUBLIC_THEME_IDS[0]}.json`, `packages/${id}.json`]);
  }
  const theme=JSON.parse(await readFile(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
  const resolved=resolveTokens(theme),geometry=componentGeometryReport(materializePackage(theme),resolved),boundaries=controlBoundaryReport(resolved);
  const issues=[...geometry.filter(check=>check.status!=='pass').map(check=>check.label+': '+check.status+' · '+check.details),
    ...boundaries.filter(check=>!check.passed).map(check=>check.foreground+' / '+check.background+': '+(check.ratio===null?'kan ikke måles':check.ratio.toFixed(2)+':1'))];
  if(issues.length)throw new Error(id+' · kvalitetsregression:\n'+issues.join('\n'));
  console.log('Kvalitet: '+id+' · '+geometry.length+' beregnede geometritjek og '+boundaries.length+' feltkantpar består.');
}
// Exercise the same explicit composition samples as the editor, using the test DOM adapter.
const patterns=spawnSync(process.execPath,['--test','--test-reporter=spec','tests/pattern-quality.test.mjs'],{
  cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit',windowsHide:true,
});
if(patterns.error)throw patterns.error;
if(patterns.status!==0)process.exitCode=patterns.status??1;
