import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { build } from 'electron-builder';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, content) {
  const name = Buffer.from(type);
  const header = Buffer.alloc(4); header.writeUInt32BE(content.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, content])));
  return Buffer.concat([header, name, content, checksum]);
}

// Match the interface's existing four-square mark without an image dependency.
async function writeIcon() {
  const size = 256;
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    const square = ((x >= 64 && x < 120) || (x >= 136 && x < 192))
      && ((y >= 64 && y < 120) || (y >= 136 && y < 192));
    const clampedX = Math.max(48, Math.min(207, x));
    const clampedY = Math.max(48, Math.min(207, y));
    const opaque = (x - clampedX) ** 2 + (y - clampedY) ** 2 <= 48 ** 2;
    pixels.set(square ? [91, 168, 255, 255] : [27, 36, 52, opaque ? 255 : 0], offset);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
  await fs.writeFile(path.join(ROOT, 'desktop', 'icon.png'), png);
  const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
  ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
  await fs.writeFile(path.join(ROOT, 'desktop', 'icon.ico'), Buffer.concat([ico, png]));
}

await writeIcon();
const config = JSON.parse(await fs.readFile(path.join(ROOT, 'desktop', 'electron-builder.json'), 'utf8'));
await build({ projectDir: ROOT, config, publish: 'never' });
// Keep the distributable at one predictable path while the unpacked app updates beside open versions.
const metadata = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
await fs.copyFile(path.join(ROOT, config.directories.output, 'Design-Studio-' + metadata.version + '-portable.exe'), path.join(ROOT, 'release', 'Design-Studio-' + metadata.version + '-portable.exe'));

if (process.platform === 'win32') {
  const literal = value => "'" + value.replaceAll("'", "''") + "'";
  const shortcut = path.join(ROOT, 'Design Studio.lnk');
  const executable = path.join(ROOT, config.directories.output, 'win-unpacked', 'Design Studio.exe');
  const script = [
    '$studioShell = New-Object -ComObject WScript.Shell',
    '$studioLink = $studioShell.CreateShortcut(' + literal(shortcut) + ')',
    '$studioLink.TargetPath = ' + literal(executable),
    '$studioLink.WorkingDirectory = ' + literal(ROOT),
    '$studioLink.IconLocation = ' + literal(executable + ',0'),
    '$studioLink.Description = ' + literal('Design Studio – komponentbibliotek og temaer'),
    '$studioLink.Save()',
  ].join('\n');
  await promisify(execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true });
}