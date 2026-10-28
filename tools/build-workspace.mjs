import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validatePackage } from '../core/engine.mjs';
import { PUBLIC_THEME_IDS } from './public-themes.mjs';
import { offlineIssues } from './offline-checks.mjs';

const studioRoot = fileURLToPath(new URL('../', import.meta.url));

/** Internal product example: bundle the same library and public themes as the editor. */
export async function buildWorkspaceHTML(root = studioRoot) {
  const themes = await Promise.all(PUBLIC_THEME_IDS.map(async key => {
    const pack = JSON.parse(await readFile(path.join(root, 'packages', key + '.json'), 'utf8'));
    const result = validatePackage(pack);
    if (!result.valid) throw new Error(key + ': ' + result.errors.join('\n'));
    return { key, package: pack };
  }));
  const directory = path.join(root, 'examples/workspace');
  const bundle = await build({
    absWorkingDir: root, entryPoints: [path.join(directory, 'boot.mjs')],
    bundle: true, write: false, format: 'iife', target: 'es2022',
    minify: true, legalComments: 'none',
    plugins: [{
      name: 'workspace-themes',
      setup(builder) {
        builder.onResolve({ filter: /bundled-themes\.mjs$/ }, () => ({ path: 'themes', namespace: 'workspace' }));
        builder.onLoad({ filter: /^themes$/, namespace: 'workspace' }, () => ({ contents: 'export default ' + JSON.stringify(themes), loader: 'js' }));
      },
    }],
  });
  const [template, styles] = await Promise.all([
    readFile(path.join(directory, 'index.template.html'), 'utf8'),
    readFile(path.join(directory, 'styles.css'), 'utf8'),
  ]);
  const html = template
    .replace('<link rel="stylesheet" href="./styles.css">', () => '<style>' + styles.replace(/<\/style/gi, '<\\/style') + '</style>')
    .replace('<script type="module" src="./boot.mjs"></script>', () => '<script>' + bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>');
  const issues = offlineIssues(html);
  if (issues.length) throw new Error('Arbejdsrum: ' + issues.join('\n'));
  return html;
}

export async function buildWorkspace(root = studioRoot) {
  const html = await buildWorkspaceHTML(root);
  await writeFile(path.join(root, 'examples/workspace/index.html'), html);
  console.log('Offline Arbejdsrum bygget: examples/workspace/index.html · ' + PUBLIC_THEME_IDS.length + ' temaer · ' + Math.round(Buffer.byteLength(html) / 1024) + ' KB');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await buildWorkspace();
