import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Bump when the starter templates change; separate from the component library.
export const STARTER_VERSION = '1.1.0';
export const STARTER_FILES = ['package.json', '.gitignore', 'src/index.html', 'src/app.mjs', 'src/styles.css', 'tools/build.mjs'];
export const PACKAGE_FIELDS = ['type', 'private', 'engines.node', 'scripts.build', 'scripts.doctor', 'devDependencies.esbuild'];
export const contentHash = content => createHash('sha256').update(content).digest('hex');
export const packageField = (metadata, field) => field.split('.').reduce((value, key) => value?.[key], metadata);

export async function starterFiles(studioRoot, { id, name }) {
  return Promise.all(STARTER_FILES.map(async file => {
    let content = await readFile(path.join(studioRoot, 'templates/offline', file), 'utf8');
    if (file === 'package.json') {
      const metadata = JSON.parse(content); metadata.name = id;
      content = JSON.stringify(metadata, null, 2) + '\n';
    }
    if (file === 'src/index.html') {
      const title = name.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
      content = content.replace('<title>Offlineprojekt</title>', () => '<title>' + title + '</title>');
    }
    if (file === 'tools/build.mjs') content = content.replace("'../../../tools/offline-checks.mjs'", "'../design/tools/offline-checks.mjs'");
    return { relative: file, content };
  }));
}

export function starterSnapshot(files) {
  const metadata = JSON.parse(files.find(file => file.relative === 'package.json').content);
  return {
    version: STARTER_VERSION,
    files: Object.fromEntries(files.map(file => [file.relative, contentHash(file.content)])),
    package: Object.fromEntries(PACKAGE_FIELDS.map(field => [field, packageField(metadata, field)])),
  };
}
