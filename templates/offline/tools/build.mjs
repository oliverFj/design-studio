import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildStamp } from '../../../tools/offline-checks.mjs';
import {TABLER_LICENSE} from '../../../core/icons.mjs';
import {SIGNATURE_LICENSE} from '../../../core/signature-assets.mjs';

export async function buildHTML(root) {
  const bundle = await build({
    absWorkingDir: root,
    entryPoints: ['src/app.mjs'],
    bundle: true, write: false, format: 'iife', target: 'es2022',
    minify: true, legalComments: 'none', metafile: true,
  });
  const [template, themeCSS, appCSS] = await Promise.all([
    readFile(path.join(root, 'src/index.html'), 'utf8'),
    readFile(path.join(root, 'design/design.css'), 'utf8'),
    readFile(path.join(root, 'src/styles.css'), 'utf8'),
  ]);
  const css = (themeCSS + '\n' + appCSS).replace(/<\/style/gi, '<\\/style');
  const script = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const stamp = await buildStamp(root, [...Object.keys(bundle.metafile.inputs), 'src/index.html', 'src/styles.css', 'design/design.css', 'package.json', 'tools/build.mjs', 'design/tools/offline-checks.mjs']);
  return template
    .replace('</head>', () => stamp + '\n<script type="text/plain" id="tabler-license">'+TABLER_LICENSE+'\n\n'+SIGNATURE_LICENSE+'</script>\n</head>')
    .replace('<link rel="stylesheet" href="./styles.css">', () => '<style>' + css + '</style>')
    .replace('<script type="module" src="./app.mjs"></script>', () => '<script>' + script + '</script>');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  await writeFile(path.join(root, 'index.html'), await buildHTML(root));
  console.log('Offlineprojekt bygget: index.html. Genindlæs browseren.');
}
