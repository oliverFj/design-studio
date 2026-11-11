import { readdir, mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const patternTests = [
  'compositions', 'form-pattern', 'history', 'object-workbench', 'parameter-workbench',
  'pattern-gallery', 'pattern-keyboard', 'pattern-quality', 'recipe-editor',
  'resizable-panel-pattern', 'web-patterns',
];

export async function testFiles(directory = root) {
  return (await readdir(path.join(directory, 'tests'))).filter(name => name.endsWith('.test.mjs')).sort()
    .map(name => path.join(directory, 'tests', name));
}

/** Enumerate files in Node rather than relying on shell glob expansion. */
export async function runTests(args = [], directory = root) {
  const patternsOnly = args[0] === '--patterns';
  const files = patternsOnly
    ? patternTests.map(name => path.join(directory, 'tests', name + '.test.mjs'))
    : await testFiles(directory);
  const testArgs = patternsOnly ? args.slice(1) : args;
  const parent = path.join(directory, 'artifacts', 'test-runs');
  await mkdir(parent, { recursive: true });
  const resolvedParent = await realpath(parent);
  const temporary = await mkdtemp(path.join(resolvedParent, 'run-'));
  try {
    const environment = { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary };
    // A runner invoked by its own regression test must start a real child run.
    delete environment.NODE_TEST_CONTEXT;
    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--test', ...testArgs, ...files], {
        cwd: directory, stdio: 'inherit', windowsHide: true,
        // Child-only settings: esbuild and fixtures share an accessible location.
        env: environment,
      });
      child.once('error', reject);
      child.once('exit', code => resolve(code ?? 1));
    });
  } finally {
    const resolved = await realpath(temporary);
    if (!resolved.startsWith(resolvedParent + path.sep)) throw new Error('Testmappen ligger uden for den forventede mappe.');
    await rm(resolved, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = await runTests(process.argv.slice(2));
}
