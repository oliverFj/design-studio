import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, detached: true, stdio: 'ignore' });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); resolve(); });
  });
}

const page = new URL('../index.html', import.meta.url);
try {
  await access(page);
  await openBrowser(page.href);
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'Offlinefilen mangler. Kør npm run build, og åbn index.html.' : error.message);
  process.exitCode = 1;
}
