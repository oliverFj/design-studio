import { build, transform } from 'esbuild';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePackage } from '../core/engine.mjs';
import { buildWorkspace } from './build-workspace.mjs';
import {TABLER_LICENSE} from '../core/icons.mjs';
import {dataModule} from './bundle-data.mjs';
import {assertDeliverySize} from './delivery-size.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const themes = [];
for (const file of (await readdir(path.join(root, 'packages'))).filter(name => name.endsWith('.json')).sort()) {
  const pack = JSON.parse(await readFile(path.join(root, 'packages', file), 'utf8'));
  const result = validatePackage(pack);
  if (!result.valid) throw new Error(file + ': ' + result.errors.join('\n'));
  themes.push({ key: path.basename(file, '.json'), package: pack });
}
const bundle = await build({
  entryPoints: [path.join(root, 'studio/app.mjs')], bundle: true, write: false,
  format: 'iife', target: 'es2022', minify: true, legalComments: 'none',
  plugins: [{
    name: 'offline-studio',
    setup(builder) {
      builder.onLoad({ filter: /[\\/]bundled-themes\.mjs$/ }, () => ({ contents: dataModule(themes), loader: 'js' }));
    },
  }],
});
let html = await readFile(path.join(root, 'studio/index.html'), 'utf8');
for (const file of ['styles.css', 'project-overview.css', 'component-catalog.css']) {
  const css = (await transform(await readFile(path.join(root, 'studio', file), 'utf8'), {loader:'css',minify:true,legalComments:'none'})).code;
  html = html.replace('<link rel="stylesheet" href="./' + file + '">', () => '<style>' + css.replace(/<\/style/gi, '<\\/style') + '</style>');
}
html = html.replace('<script type="module" src="./app.mjs"></script>', '');
const patternCSS = (await transform(await readFile(path.join(root, 'patterns/styles.css'), 'utf8'), {loader:'css',minify:true,legalComments:'none'})).code;
html = html.replace('<link rel="stylesheet" href="../patterns/styles.css">', () => '<style>' + patternCSS.replace(/<\/style/gi, '<\\/style') + '</style>');
// Escape raw-text closing tags even inside theme descriptions or embedded assets.
html = html.replace('</body>', () => '<script>' + bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script></body>');
html=html.replace('</head>',()=>'<script type="text/plain" id="tabler-license">'+TABLER_LICENSE+'</script></head>');
assertDeliverySize('studio',html);
await writeFile(path.join(root, 'index.html'), html);
console.log('Offline Design Studio bygget: index.html · ' + themes.length + ' temaer · ' + Math.round(Buffer.byteLength(html) / 1024) + ' KB');
await buildWorkspace(root);
