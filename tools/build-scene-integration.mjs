import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { offlineIssues } from './offline-checks.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const SCENE_INTEGRATION_DIRECTORY = 'examples/stade-scene';
export function readSceneFileNames(html) {
  const delivery = /<meta name="stade-scene-demos" content="([^"]*)">/.exec(html);
  const demos = delivery?.[1].split(',') ?? ['overblik.html'];
  if (demos.some(name => !/^[a-z][a-z0-9-]*\.html$/.test(name) || name === 'index.html') || new Set(demos).size !== demos.length) {
    throw new Error('Stade Scene-kataloget har ugyldige eller dublerede filnavne.');
  }
  return ['index.html', ...demos];
}

export function sceneDemoCatalog(files) {
  return Object.fromEntries(files.flatMap(({ template, filename, title }) =>
    template ? [[template, { filename, name:title }]] : []));
}

/** Build the companion product without reading or overwriting a user's saved apps. */
export async function buildSceneIntegration(output, {
  sceneRoot = process.env.STADE_SCENE_ROOT,
} = {}) {
  const source = sceneRoot ? path.resolve(sceneRoot) : path.resolve(root, '../Second Gen/Stade Scene');
  const entry = path.join(source, 'tools/build.mjs');
  try { await access(entry); }
  catch (error) {
    if (!sceneRoot && error.code === 'ENOENT') return [];
    throw error;
  }
  const { buildHTML, buildSceneDemos, buildOverviewHTML } = await import(pathToFileURL(entry).href);
  const options = { stadeRoot: root };
  const [editor, demos] = await Promise.all([
    buildHTML(source, options),
    buildSceneDemos ? buildSceneDemos(source, options) : buildOverviewHTML(source, options)
      .then(html => [{ template:'overview', name:'Overblik', filename:'overblik.html', html }]),
  ]);
  const files = [{ filename:'index.html', html:editor }, ...demos].map(({ filename, html, template, name:title }) => {
    const name = SCENE_INTEGRATION_DIRECTORY + '/' + filename;
    const issues = offlineIssues(html);
    if (issues.length) throw new Error(name + ': ' + issues.join('\n'));
    return { name, data: Buffer.from(html), template, filename, title };
  });
  if (output) {
    await mkdir(path.join(output, SCENE_INTEGRATION_DIRECTORY), { recursive: true });
    await Promise.all(files.map(({ name, data }) => writeFile(path.join(output, name), data)));
  }
  return files;
}
