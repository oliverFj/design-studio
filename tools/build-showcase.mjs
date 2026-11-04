import {transform} from 'esbuild';
import {dataModule} from './bundle-data.mjs';
import {assertDeliverySize} from './delivery-size.mjs';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTheme, getComponents, validatePackage } from '../core/engine.mjs';
import { LIBRARY_VERSION } from '../core/library.mjs';
import { TABLER_LICENSE } from '../core/icons.mjs';
import { PUBLIC_THEME_IDS } from './public-themes.mjs';
import { COMPOSITIONS, PATTERN_FILES } from '../patterns/catalog.mjs';
import {buildStudio} from './build-studio.mjs';

const studio = fileURLToPath(new URL('../', import.meta.url));
const outputIndex = process.argv.indexOf('--out');
if (outputIndex >= 0 && !process.argv[outputIndex + 1]) throw new Error('--out kræver en mappe.');
const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : join(studio, 'artifacts/showcase'));
const themes = [];
for (const id of PUBLIC_THEME_IDS) {
  const source = JSON.parse(await readFile(join(studio, 'packages', id + '.json'), 'utf8'));
  if(source.id!==id)throw new Error(id+'.json: temaets id skal svare til filnavnet.');
  const theme = createTheme(source);
  // Publish the canonical collection. Local source paths are editorial metadata.
  if (theme.brand) theme.brand.sources = [];
  theme.history = [];
  const validation = validatePackage(theme);
  if (!validation.valid) throw new Error(id + ': ' + validation.errors.join('\n'));
  getComponents(theme);
  themes.push(theme);
}
if(process.argv.includes('--studio')) {
  await mkdir(output,{recursive:true});
  await buildStudio({output:join(output,'index.html'),showcase:true,themes:themes.map(theme=>({key:theme.id,package:theme}))});
} else {
const browserImports = source => source.replace(/\.mjs(['"])/g, '.js$1');
const compactJS = async source => (await transform(source,{loader:'js',minify:true,target:'es2022',legalComments:'none'})).code;
const compactCSS = async source => (await transform(source,{loader:'css',minify:true,legalComments:'none'})).code;
const themeModule=await compactJS(dataModule(themes,{exportName:'themes'}));
assertDeliverySize('themes',themeModule);
await mkdir(join(output, 'patterns'), { recursive: true });
for (const name of PATTERN_FILES) {
  const source = await readFile(join(studio, 'patterns', name), 'utf8');
  await writeFile(join(output, 'patterns', name.replace('.mjs', '.js')), name.endsWith('.mjs')?await compactJS(browserImports(source)):await compactCSS(source), 'utf8');
}
await mkdir(join(output, 'core'), { recursive: true });
for (const name of ['contract.mjs', 'library.mjs', 'quality.mjs', 'geometry.mjs', 'token-usage.mjs', 'engine.mjs', 'components.mjs', 'signature-assets.mjs', 'layout.mjs', 'panels.mjs', 'motion.mjs', 'menus.mjs','icons.mjs','scales.mjs','preferences.mjs','theme-modes.mjs','navigation.mjs','overlays.mjs','input-choices.mjs','feedback.mjs','uploads.mjs','data-table.mjs','data-grid.mjs']) {
  const source = await readFile(join(studio, 'core', name), 'utf8');
  await writeFile(join(output, 'core', name.replace('.mjs', '.js')), await compactJS(browserImports(source)), 'utf8');
  await rm(join(output, 'core', name), { force: true });
}
await mkdir(join(output, 'preview'), { recursive: true });
await mkdir(join(output,'licenses'),{recursive:true});
await writeFile(join(output,'licenses','tabler-icons-MIT.txt'),TABLER_LICENSE);
for (const name of ['project-overview.mjs', 'project-overview.css', 'menu-example.mjs','navigation-example.mjs','overlay-example.mjs','content-example.mjs','input-choice-example.mjs','feedback-example.mjs','file-example.mjs','data-table-example.mjs','data-grid-example.mjs']) {
  const source = await readFile(join(studio, 'studio', name), 'utf8');
  await writeFile(join(output, 'preview', name.replace('.mjs', '.js')), name.endsWith('.mjs')?await compactJS(browserImports(source)):await compactCSS(source), 'utf8');
}
for (const name of ['index.html', 'showcase.css', 'showcase.mjs']) {
  const destination = name.replace('.mjs', '.js');
  const source = await readFile(join(studio, 'showcase', name), 'utf8');
  await writeFile(join(output, destination), name.endsWith('.mjs')?await compactJS(browserImports(source)):name.endsWith('.css')?await compactCSS(source):browserImports(source), 'utf8');
}
await rm(join(output, 'showcase.mjs'), { force: true });
await rm(join(output, 'themes.mjs'), { force: true });
await writeFile(join(output, 'themes.js'), themeModule, 'utf8');
for (const theme of themes) {
  for (const asset of theme.brand?.assets ?? []) {
    if (asset.mimeType !== 'text/plain') continue;
    if (basename(asset.fileName) !== asset.fileName) throw new Error('Licensfil skal have et almindeligt filnavn.');
    const directory = join(output, 'licenses', theme.id);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, asset.fileName), Buffer.from(asset.data, 'base64'));
  }
}
await writeFile(join(output, 'manifest.json'), JSON.stringify({
  libraryVersion: LIBRARY_VERSION,
  themes: themes.map(theme => ({ id: theme.id, name: theme.name })),
  components: Object.keys(getComponents(themes[0])),
  compositions: Object.entries(COMPOSITIONS).map(([id, item]) => ({ id, name: item.name, version: item.version, components: item.components })),
}, null, 2) + '\n');
console.log('Design Studio-showcase bygget: ' + output);
}

