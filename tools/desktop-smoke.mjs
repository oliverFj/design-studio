import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const portable = process.argv.includes('--portable');
const metadata = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
const config = JSON.parse(await fs.readFile(path.join(ROOT, 'desktop', 'electron-builder.json'), 'utf8'));
const executable = portable
  ? path.join(ROOT, 'release', 'Design-Studio-' + metadata.version + '-portable.exe')
  : path.join(ROOT, config.directories.output, 'win-unpacked', 'Design Studio.exe');
const output = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-desktop-smoke-'));
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(executable, ['--desktop-smoke', output], { windowsHide: true, stdio: 'pipe', env });
let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });
const timer = setTimeout(() => child.kill(), 45_000);
try {
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  assert.equal(code, 0, stderr || 'Desktop-appen afsluttede ikke korrekt.');
  const report = JSON.parse(await fs.readFile(path.join(output, 'desktop.json'), 'utf8'));
  assert.equal(report.packaged, true);
  assert.equal(report.nodeExposed, false);
  assert.match(report.text, /Design Studio/);
  assert.doesNotMatch(report.text, /Design Studio kunne ikke åbnes/);
  await assert.rejects(fetch(report.url + '/api/status', { signal: AbortSignal.timeout(1000) }));
  const artifacts = path.join(ROOT, 'artifacts', 'desktop');
  await fs.mkdir(artifacts, { recursive: true });
  await fs.copyFile(path.join(output, 'desktop.png'), path.join(artifacts, portable ? 'desktop-portable.png' : 'desktop.png'));
  await fs.writeFile(path.join(artifacts, portable ? 'desktop-portable-smoke.json' : 'desktop-smoke.json'), JSON.stringify({ version: report.version, portable, packaged: true, nodeExposed: false, serverClosed: true }, null, 2) + '\n');
  console.log('Pakket desktop-app åbner, renderer er isoleret, og den lokale server lukker med appen.');
} finally {
  clearTimeout(timer);
  if (child.exitCode === null && child.signalCode === null) child.kill();
  await fs.rm(output, { recursive: true, force: true });
}
