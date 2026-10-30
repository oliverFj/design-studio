import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTheme, getComponents, validatePackage } from '../core/engine.mjs';
import { LIBRARY_VERSION } from '../core/library.mjs';
import { PUBLIC_THEME_IDS } from './public-themes.mjs';
import { COMPOSITIONS, PATTERN_FILES } from '../patterns/catalog.mjs';

const studio = fileURLToPath(new URL('../', import.meta.url));
const outputIndex = process.argv.indexOf('--out');
if (outputIndex >= 0 && !process.argv[outputIndex + 1]) throw new Error('--out kræver en mappe.');
const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : join(studio, 'artifacts/showcase'));
const themes = [];
for (const id of PUBLIC_THEME_IDS) {
  const source = JSON.parse(await readFile(join(studio, 'packages', id + '.json'), 'utf8'));
  const theme = createTheme(source);
  // Publish only the selected demo themes. Local source paths are editorial metadata.
  if (theme.brand) theme.brand.sources = [];
  const validation = validatePackage(theme);
  if (!validation.valid) throw new Error(id + ': ' + validation.errors.join('\n'));
  getComponents(theme);
  themes.push(theme);
}
const browserImports = source => source.replace(/\.mjs(['"])/g, '.js$1');
await mkdir(join(output, 'patterns'), { recursive: true });
for (const name of PATTERN_FILES) {
  const source = await readFile(join(studio, 'patterns', name), 'utf8');
  await writeFile(join(output, 'patterns', name.replace('.mjs', '.js')), browserImports(source), 'utf8');
}
await mkdir(join(output, 'core'), { recursive: true });
for (const name of ['contract.mjs', 'library.mjs', 'quality.mjs', 'geometry.mjs', 'token-usage.mjs', 'engine.mjs', 'components.mjs', 'layout.mjs', 'panels.mjs', 'motion.mjs']) {
  const source = await readFile(join(studio, 'core', name), 'utf8');
  await writeFile(join(output, 'core', name.replace('.mjs', '.js')), browserImports(source), 'utf8');
  await rm(join(output, 'core', name), { force: true });
}
await mkdir(join(output, 'preview'), { recursive: true });
for (const name of ['project-overview.mjs', 'project-overview.css']) {
  const source = await readFile(join(studio, 'studio', name), 'utf8');
  await writeFile(join(output, 'preview', name.replace('.mjs', '.js')), browserImports(source), 'utf8');
}
for (const name of ['index.html', 'showcase.css', 'showcase.mjs']) {
  const destination = name.replace('.mjs', '.js');
  const source = await readFile(join(studio, 'showcase', name), 'utf8');
  await writeFile(join(output, destination), browserImports(source), 'utf8');
}
await rm(join(output, 'showcase.mjs'), { force: true });
await rm(join(output, 'themes.mjs'), { force: true });
await writeFile(join(output, 'themes.js'), 'export const themes = ' + JSON.stringify(themes) + ';\n', 'utf8');
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

