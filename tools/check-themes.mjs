import { runCLI } from './cli.mjs';
import { PUBLIC_THEME_IDS } from './public-themes.mjs';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {materializePackage,resolveTokens,generateCSS} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {componentGeometryReport} from '../core/geometry.mjs';
import {controlBoundaryReport} from '../core/quality.mjs';

for (const id of PUBLIC_THEME_IDS) {
  await runCLI(['validate', `packages/${id}.json`]);
  if (id !== PUBLIC_THEME_IDS[0]) {
    await runCLI(['compare', `packages/${PUBLIC_THEME_IDS[0]}.json`, `packages/${id}.json`]);
  }
  const theme=JSON.parse(await readFile(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
  for(const mode of theme.modes?Object.keys(theme.modes):[null]){
    const snapshot=mode?resolveThemeMode(theme,mode):theme;
    // Build both actual appearances; validating only the base would miss export
    // failures or state-dependent regressions in the other color mode.
    generateCSS(snapshot);
    const resolved=resolveTokens(snapshot),geometry=componentGeometryReport(materializePackage(snapshot),resolved),boundaries=controlBoundaryReport(resolved);
    const issues=[...geometry.filter(check=>check.status!=='pass').map(check=>check.label+': '+check.status+' · '+check.details),
      ...boundaries.filter(check=>!check.passed).map(check=>check.foreground+' / '+check.background+': '+(check.ratio===null?'kan ikke måles':check.ratio.toFixed(2)+':1'))];
    const subject=id+(mode?' / '+mode:'');
    if(issues.length)throw new Error(subject+' · kvalitetsregression:\n'+issues.join('\n'));
    console.log('Kvalitet: '+subject+' · CSS, '+geometry.length+' beregnede geometritjek og '+boundaries.length+' feltkantpar består.');
  }
}
// Exercise the same explicit composition samples as the editor, using the test DOM adapter.
const patterns=spawnSync(process.execPath,['--test','--test-reporter=spec','tests/pattern-quality.test.mjs'],{
  cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit',windowsHide:true,
});
if(patterns.error)throw patterns.error;
if(patterns.status!==0)process.exitCode=patterns.status??1;
