import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { generateCSS, validatePackage } from './core/engine.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MAX_BODY = 1024 * 1024;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATIC_FILES = new Map([
  ['/', ['studio/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['studio/index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['studio/app.mjs', 'text/javascript; charset=utf-8']],
  ['/brand.mjs', ['studio/brand.mjs', 'text/javascript; charset=utf-8']],
  ['/project-overview.mjs', ['studio/project-overview.mjs', 'text/javascript; charset=utf-8']],
  ['/project-overview.css', ['studio/project-overview.css', 'text/css; charset=utf-8']],
  ['/styles.css', ['studio/styles.css', 'text/css; charset=utf-8']],
  ['/core/engine.mjs', ['core/engine.mjs', 'text/javascript; charset=utf-8']],
  ['/core/contract.mjs', ['core/contract.mjs', 'text/javascript; charset=utf-8']],
  ['/core/library.mjs', ['core/library.mjs', 'text/javascript; charset=utf-8']],
  ['/core/quality.mjs', ['core/quality.mjs', 'text/javascript; charset=utf-8']],
  ['/core/components.mjs', ['core/components.mjs', 'text/javascript; charset=utf-8']],
  ['/assets/fjordside/fonts.css', ['assets/fjordside/fonts.css', 'text/css; charset=utf-8']],
  ['/assets/fjordside/fonts/Platypi-variable.ttf', ['assets/fjordside/fonts/Platypi-variable.ttf', 'font/ttf']],
  ['/assets/fjordside/fonts/Platypi-italic-variable.ttf', ['assets/fjordside/fonts/Platypi-italic-variable.ttf', 'font/ttf']],
]);

class RequestError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function assertPackage(pack) {
  const result = validatePackage(pack);
  if (!result.valid) throw new RequestError(422, 'Designpakken er ikke gyldig.', result.errors);
}

function revisionFor(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readSnapshot(file) {
  try {
    const bytes = await fs.readFile(file);
    return { package: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')), revision: revisionFor(bytes) };
  } catch (error) {
    if (error instanceof SyntaxError) throw new RequestError(422, 'Designfilen indeholder ugyldig JSON.');
    if (error.code === 'ENOENT') throw new RequestError(404, 'Designfilen findes ikke længere.');
    throw error;
  }
}

async function readPackage(file) {
  return (await readSnapshot(file)).package;
}

async function readBody(request) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers['content-type'] || '')) {
    throw new RequestError(415, 'Send designpakken som application/json.');
  }
  if (Number(request.headers['content-length']) > MAX_BODY) {
    throw new RequestError(413, 'Designpakken må højst fylde 1 MiB.');
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > MAX_BODY) throw new RequestError(413, 'Designpakken må højst fylde 1 MiB.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Anmodningen indeholder ugyldig JSON.');
  }
}

async function atomicWrite(file, pack, expectedRevision) {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  const content = `${JSON.stringify(pack, null, 2)}\n`;
  try {
    await fs.writeFile(temporary, content, { flag: 'wx' });
    if (expectedRevision && revisionFor(await fs.readFile(file)) !== expectedRevision) {
      throw new RequestError(412, 'Designfilen er ændret siden indlæsningen. Genindlæs pakken før du gemmer.');
    }
    await fs.rename(temporary, file);
    return revisionFor(content);
  } finally {
    await fs.unlink(temporary).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

/** Creates a local-only server. The caller owns listen() and close(). */
export async function createStudioServer({ projectPath = null, rootDir = ROOT } = {}) {
  const root = await fs.realpath(rootDir);
  const packageDir = await fs.realpath(path.join(root, 'packages'));
  let projectFile = null;
  if (projectPath) {
    if (path.extname(projectPath).toLowerCase() !== '.json') {
      throw new Error('--project skal pege på en eksisterende .json-designpakke.');
    }
    projectFile = await fs.realpath(path.resolve(projectPath));
    if (!(await fs.stat(projectFile)).isFile()) throw new Error('--project skal pege på en fil.');
    assertPackage(await readPackage(projectFile));
  }

  const saveQueues = new Map();
  async function withFileLock(file, operation) {
    const previous = saveQueues.get(file) || Promise.resolve();
    const pending = previous.catch(() => {}).then(operation);
    saveQueues.set(file, pending);
    try { return await pending; } finally {
      if (saveQueues.get(file) === pending) saveQueues.delete(file);
    }
  }


  async function registry() {
    const files = await fs.readdir(packageDir, { withFileTypes: true });
    const entries = new Map();
    for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!file.isFile() || path.extname(file.name) !== '.json') continue;
      const key = path.basename(file.name, '.json');
      if (!SLUG.test(key)) continue;
      const absolute = await fs.realpath(path.join(packageDir, file.name));
      if (path.dirname(absolute) !== packageDir) continue;
      entries.set(key, absolute);
    }
    if (projectFile) entries.set('@project', projectFile);
    return entries;
  }

  async function requireFile(entries, key) {
    const file = entries.get(key);
    if (!file) throw new RequestError(404, 'Designpakken findes ikke.');
    const info = await fs.lstat(file);
    if (!info.isFile() || await fs.realpath(file) !== file) {
      throw new RequestError(409, 'Designfilens placering er ændret. Genstart Design Studio.');
    }
    return file;
  }

  const server = http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      const localPort = request.socket.localPort;
      const allowedHosts = [`127.0.0.1:${localPort}`, `localhost:${localPort}`];
      if (localPort === 80) allowedHosts.push('127.0.0.1', 'localhost');
      const host = request.headers.host;
      if (!allowedHosts.includes(host)) throw new RequestError(403, 'Design Studio accepterer kun lokale anmodninger.');
      if (request.headers.origin && request.headers.origin !== `http://${host}`) {
        throw new RequestError(403, 'Anmodningen skal komme fra dette Design Studio-vindue.');
      }
      const rawPath = (request.url || '/').split('?')[0];
      let pathname;
      try { pathname = decodeURIComponent(rawPath); } catch { throw new RequestError(400, 'Ugyldig adresse.'); }
      if (pathname.includes('\\') || pathname.split('/').some(segment => segment === '..' || segment === '.')) {
        throw new RequestError(400, 'Ugyldig adresse.');
      }
      const method = request.method;
      if (pathname === '/api/status') {
        if (method !== 'GET') throw new RequestError(405, 'Denne handling understøttes ikke.');
        return json(response, 200, { app: 'design-studio', root, projectFile });
      }
      if (pathname === '/api/packages') {
        const entries = await registry();
        if (method === 'GET') {
          const packages = [];
          for (const [key, file] of entries) {
            const pack = await readPackage(file);
            packages.push({ key, id: pack.id, name: pack.name, description: pack.description || '', file });
          }
          return json(response, 200, { packages, activeProject: projectFile ? '@project' : null });
        }
        if (method === 'POST') {
          const pack = await readBody(request);
          assertPackage(pack);
          if (!SLUG.test(pack.id) || pack.id.length > 80) {
            throw new RequestError(422, 'Pakkens id skal være højst 80 små bogstaver, tal og bindestreger.');
          }
          const file = path.join(packageDir, `${pack.id}.json`);
          try {
            await fs.writeFile(file, `${JSON.stringify(pack, null, 2)}\n`, { flag: 'wx' });
          } catch (error) {
            if (error.code === 'EEXIST') throw new RequestError(409, 'Der findes allerede en pakke med dette id. Vælg et andet id.');
            throw error;
          }
          return json(response, 201, { key: pack.id, package: pack, file });
        }
        throw new RequestError(405, 'Denne handling understøttes ikke.');
      }
      const packageRoute = pathname.match(/^\/api\/packages\/([^/]+)(\/css)?$/);
      if (packageRoute) {
        const entries = await registry();
        const key = packageRoute[1];
        const file = await requireFile(entries, key);
        if (packageRoute[2]) {
          if (method !== 'GET') throw new RequestError(405, 'Denne handling understøttes ikke.');
          const snapshot = await readSnapshot(file);
          assertPackage(snapshot.package);
          response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', ETag: `"${snapshot.revision}"` });
          return response.end(generateCSS(snapshot.package));
        }
        if (method === 'GET') {
          const snapshot = await readSnapshot(file);
          response.setHeader('ETag', `"${snapshot.revision}"`);
          return json(response, 200, { ...snapshot, file });
        }
        if (method === 'PUT') {
          const updated = await readBody(request);
          assertPackage(updated);
          const suppliedRevision = request.headers['if-match'];
          if (!suppliedRevision) {
            throw new RequestError(428, 'Indlæs designpakken før gemning, og send dens revision i If-Match.');
          }
          const revision = await withFileLock(file, async () => {
            await requireFile(entries, key);
            const snapshot = await readSnapshot(file);
            if (suppliedRevision !== snapshot.revision && suppliedRevision !== `"${snapshot.revision}"`) {
              throw new RequestError(412, 'Designfilen er ændret siden indlæsningen. Genindlæs pakken før du gemmer.');
            }
            if (updated.id !== snapshot.package.id) throw new RequestError(422, 'Pakkens id kan ikke ændres ved gemning. Importér den med et nyt id.');
            return atomicWrite(file, updated, snapshot.revision);
          });
          response.setHeader('ETag', `"${revision}"`);
          return json(response, 200, { key, package: updated, file, revision });
        }
        throw new RequestError(405, 'Denne handling understøttes ikke.');
      }
      if (pathname.startsWith('/api/')) throw new RequestError(404, 'Handlingen findes ikke.');
      if (method !== 'GET' && method !== 'HEAD') throw new RequestError(405, 'Denne handling understøttes ikke.');
      const entry = STATIC_FILES.get(pathname);
      if (!entry) throw new RequestError(404, 'Siden findes ikke.');
      const content = await fs.readFile(path.join(root, entry[0]));
      response.writeHead(200, { 'Content-Type': entry[1], 'Content-Length': content.length });
      response.end(method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      if (!response.headersSent) {
        json(response, status, { error: status === 500 ? 'Handlingen kunne ikke gennemføres. Se terminalen for detaljer.' : error.message, ...(error.errors ? { errors: error.errors } : {}) });
      } else response.end();
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return server;
}

async function main() {
  const args = process.argv.slice(2);
  let port = 3000;
  let projectPath = null;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--port') {
      port = Number(args[++index]);
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--port skal være et tal mellem 1 og 65535.');
    } else if (args[index] === '--project') {
      projectPath = args[++index];
      if (!projectPath) throw new Error('Angiv en designfil efter --project.');
    } else if (args[index] === '--help' || args[index] === '-h') {
      console.log('node server.mjs [--port 3000] [--project sti/til/design.json]');
      return;
    } else throw new Error(`Ukendt argument: ${args[index]}`);
  }
  const server = await createStudioServer({ projectPath });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  console.log(`Design Studio: http://127.0.0.1:${port}`);
  if (projectPath) console.log(`Projektets design: ${path.resolve(projectPath)}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    console.error(error.code === 'EADDRINUSE' ? 'Porten er optaget. Brug --port med en anden port.' : error.message);
    process.exitCode = 1;
  });
}




