import { promises as fs, constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const META = '.stade-skill.json';
const INSTALLATION = 'references/stade-installation.json';
const validId = id => typeof id === 'string' && id.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
const MAX_FILES = 256, MAX_ENTRIES = 512, MAX_BYTES = 16 * 1024 * 1024;
const internals = new WeakMap();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const own = (object, key) => Object.hasOwn(object, key);

async function info(file) {
  try { return await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Inspect every existing path component; realpath alone would hide junctions.
async function plainPath(file, { directory = false } = {}) {
  const absolute = path.resolve(file), root = path.parse(absolute).root;
  let current = root;
  for (const part of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const stat = await info(current);
    if (!stat) continue;
    if (stat.isSymbolicLink() || (current !== absolute || directory ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error('Skillstier skal bruge almindelige filer og mapper uden links: ' + current);
    }
  }
}

function relativeFile(file) {
  return typeof file === 'string' && file.length > 0 && file.length <= 512 &&
    !file.includes('\\') && !file.includes(':') && !file.startsWith('/') &&
    file.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$/.test(part) &&
      !/[<>"|?*\x00-\x1f]/.test(part) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part));
}

async function scan(directory) {
  await plainPath(directory, { directory: true });
  if (!await info(directory)) return { exists: false, files: new Map(), dirs: [], signature: 'absent' };
  const files = new Map(), dirs = [], names = new Set();
  let bytes = 0, entries = 0;
  async function visit(folder, prefix = '') {
    for (const name of (await fs.readdir(folder)).sort()) {
      const relative = prefix + name, file = path.join(folder, name), stat = await fs.lstat(file);
      if (++entries > MAX_ENTRIES) throw new Error('Skillmappen har for mange filer eller mapper.');
      if (!relativeFile(relative) || names.has(relative.toLowerCase())) throw new Error('Ugyldigt eller tvetydigt skillfilnavn: ' + relative);
      names.add(relative.toLowerCase());
      if (stat.isSymbolicLink()) throw new Error('Skillmappen må ikke indeholde links: ' + file);
      if (stat.isDirectory()) { dirs.push(relative); await visit(file, relative + '/'); }
      else if (stat.isFile()) {
        if (files.size >= MAX_FILES || (bytes += stat.size) > MAX_BYTES) throw new Error('Skillmappen overskrider fil- eller størrelsesgrænsen.');
        const content = await fs.readFile(file);
        if (content.length !== stat.size) throw new Error('Skillfilen blev ændret under læsning: ' + file);
        files.set(relative, { content, sha256: hash(content) });
      } else throw new Error('Skillmappen må kun indeholde almindelige filer og mapper: ' + file);
    }
  }
  await visit(directory);
  const signature = hash(JSON.stringify({ dirs, files: [...files].map(([name, value]) => [name, value.sha256]) }));
  return { exists: true, files, dirs, signature };
}

function readMetadata(tree, id) {
  const file = tree.files.get(META);
  if (!file) return null;
  let value;
  try { value = JSON.parse(file.content.toString('utf8')); }
  catch { throw new Error('Skillens ejerskabsfil er ikke gyldig JSON.'); }
  if (value.schemaVersion !== 1 || value.id !== id || typeof value.sourceRoot !== 'string' ||
      !path.isAbsolute(value.sourceRoot) || !value.files || typeof value.files !== 'object' || Array.isArray(value.files) ||
      !own(value.files, 'SKILL.md') || !own(value.files, INSTALLATION) || Object.keys(value.files).length > MAX_FILES ||
      Object.entries(value.files).some(([name, digest]) => name === META || !relativeFile(name) || !/^[a-f0-9]{64}$/.test(digest))) {
    throw new Error('Skillens ejerskabsfil har et ugyldigt format.');
  }
  const names = Object.keys(value.files).map(name => name.toLowerCase());
  if (new Set(names).size !== names.length) throw new Error('Skillens ejerskabsfil har tvetydige filnavne.');
  return value;
}

function collidesAsDirectory(tree, relative) {
  const key = relative.toLowerCase();
  if (tree.dirs.some(name => name.toLowerCase() === key)) return true;
  const parts = relative.split('/');
  for (let count = 1; count < parts.length; count++) {
    const parent = parts.slice(0, count).join('/').toLowerCase();
    if ([...tree.files.keys()].some(name => name.toLowerCase() === parent)) return true;
  }
  return false;
}

function assertSameCase(tree, relative) {
  const parts = relative.split('/');
  for (let count = 1; count <= parts.length; count++) {
    const prefix = parts.slice(0, count).join('/');
    const existing = [...tree.files.keys(), ...tree.dirs].find(name => name.toLowerCase() === prefix.toLowerCase());
    if (existing && existing !== prefix) throw new Error('Et eksisterende filnavn kolliderer med skillfilen: ' + prefix);
  }
}

function overlaps(first, second) {
  const a = path.resolve(first).toLowerCase(), b = path.resolve(second).toLowerCase();
  return a === b || a.startsWith(b + path.sep) || b.startsWith(a + path.sep);
}

export async function planSkills({ studioRoot, codexHome = path.join(os.homedir(), '.codex'), skillsDir, skills = ['stade-collaboration'] } = {}) {
  if (typeof studioRoot !== 'string' || !studioRoot || typeof codexHome !== 'string' || !codexHome ||
      skillsDir !== undefined && (typeof skillsDir !== 'string' || !skillsDir) || !Array.isArray(skills) ||
      !skills.length || new Set(skills).size !== skills.length || skills.some(id => !validId(id))) {
    throw new Error('Angiv en Stade-mappe og gyldige, entydige skill-id’er.');
  }
  const options = { studioRoot: path.resolve(studioRoot), codexHome: path.resolve(codexHome),
    ...(skillsDir === undefined ? {} : { skillsDir: path.resolve(skillsDir) }), skills: [...skills] };
  const plan = { changed: false, skills: [], conflicts: [], options, snapshots: [] }, details = [];
  for (const id of skills) {
    const sourceRoot = path.join(options.studioRoot, 'skills', id);
    let target = path.join(options.skillsDir ?? path.join(os.homedir(), '.agents', 'skills'), id);
    const item = { id, target, state: 'conflict', changed: false };
    plan.skills.push(item);
    try {
      if (options.skillsDir === undefined && !await info(target)) {
        const legacy = path.join(options.codexHome, 'skills', id);
        if (await info(legacy)) target = item.target = legacy;
      }
      if (overlaps(sourceRoot, target)) throw new Error('Kildens og installationens mapper må ikke overlappe.');
      const source = await scan(sourceRoot), destination = await scan(target);
      if (!source.files.has('SKILL.md')) throw new Error('Skillkilden mangler SKILL.md: ' + sourceRoot);
      if ([...source.files.keys(), ...source.dirs].some(name => [META, INSTALLATION].includes(name.toLowerCase()))) throw new Error('Skillkilden indeholder installationsspecifikke filer.');
      const desired = new Map(source.files);
      const installation = json({ schemaVersion: 1, stadeRoot: options.studioRoot });
      desired.set(INSTALLATION, { content: installation, sha256: hash(installation) });
      if (desired.size + 1 > MAX_FILES || source.files.size + source.dirs.length + 3 > MAX_ENTRIES || collidesAsDirectory(source, INSTALLATION)) throw new Error('Skillkildens filer blokerer installationsgrundlaget eller overskrider filgrænsen.');
      assertSameCase(source, INSTALLATION); assertSameCase(destination, META);
      if (collidesAsDirectory(destination, META)) throw new Error('En mappe blokerer skillens ejerskabsfil.');
      const metadata = readMetadata(destination, id), owned = metadata?.files ?? {};
      for (const [name, digest] of Object.entries(owned)) {
        if (destination.files.get(name)?.sha256 !== digest) throw new Error('En ejet skillfil er lokalt ændret eller slettet: ' + name);
      }
      for (const [name, value] of desired) {
        assertSameCase(destination, name);
        if (collidesAsDirectory(destination, name)) throw new Error('En mappe eller overordnet fil blokerer skillfilen: ' + name);
        const actual = destination.files.get(name);
        if (metadata && actual && !own(owned, name)) throw new Error('En ikke-ejet fil blokerer skillopdateringen: ' + name);
        if (!metadata && destination.exists && name !== INSTALLATION && actual?.sha256 !== value.sha256) {
          throw new Error('En eksisterende skill kan kun overtages, når alle kildefiler matcher: ' + name);
        }
        if (!metadata && actual && actual.sha256 !== value.sha256) throw new Error('En eksisterende ikke-ejet fil er forskellig: ' + name);
      }
      const content = json({ schemaVersion: 1, id, sourceRoot,
        files: Object.fromEntries([...desired].sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => [name, value.sha256])) });
      desired.set(META, { content, sha256: hash(content) });
      if ([...desired.values()].reduce((sum, value) => sum + value.content.length, 0) > MAX_BYTES) throw new Error('Skillinstallationen overskrider størrelsesgrænsen.');
      const removed = Object.keys(owned).filter(name => !desired.has(name));
      item.changed = removed.length > 0 || [...desired].some(([name, value]) => destination.files.get(name)?.sha256 !== value.sha256);
      item.state = !destination.exists ? 'install' : !metadata ? 'adopt' : item.changed ? 'update' : 'unchanged';
      plan.changed ||= item.changed;
      plan.snapshots.push({ id, target, source: source.signature, destination: destination.signature });
      details.push({ ...item, desired, removed, destination });
    } catch (error) {
      const conflict = { id, target: item.target, message: error.message };
      item.conflicts = [conflict.message]; plan.conflicts.push(conflict);
    }
  }
  internals.set(plan, details);
  return plan;
}

async function ensureDirectory(directory) {
  await plainPath(directory, { directory: true });
  await fs.mkdir(directory, { recursive: true });
  await plainPath(directory, { directory: true });
}

async function currentHash(file) {
  await plainPath(file);
  return await info(file) ? hash(await fs.readFile(file)) : null;
}

// Publish individual files atomically. Backups stay until the whole apply has
// succeeded, so an I/O failure can restore files without overwriting new edits.
async function publish(file, content, expected, changes) {
  await ensureDirectory(path.dirname(file));
  if (await currentHash(file) !== expected) throw new Error('Skilldestinationen blev ændret efter planen: ' + file);
  const suffix = randomUUID(), temporary = file + '.stade-' + suffix + '.tmp', backup = expected === null ? null : file + '.stade-' + suffix + '.bak';
  let recorded = false;
  try {
    if (backup) {
      await fs.copyFile(file, backup, constants.COPYFILE_EXCL);
      if (hash(await fs.readFile(backup)) !== expected || await currentHash(file) !== expected) throw new Error('Skilldestinationen blev ændret under opdateringen: ' + file);
    }
    if (content !== null) {
      await fs.writeFile(temporary, content, { flag: 'wx' });
      await plainPath(file);
      if (await currentHash(file) !== expected) throw new Error('Skilldestinationen blev ændret under opdateringen: ' + file);
      await fs.rename(temporary, file);
    } else await fs.unlink(file);
    changes.push({ file, backup, written: content === null ? null : hash(content) }); recorded = true;
  } finally {
    await fs.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (backup && !recorded) await fs.unlink(backup);
  }
}

export async function applySkills(plan) {
  if (!plan?.options || !Array.isArray(plan.snapshots)) throw new Error('Skillplanen har et ugyldigt format.');
  if (plan.conflicts?.length) throw new Error('Skillplanen har konflikter: ' + plan.conflicts.map(item => item.message).join('; '));
  // Re-plan every skill before the first mkdir/write, including additions,
  // deletions, source changes, junctions and previously unowned collisions.
  const current = await planSkills(plan.options);
  if (current.conflicts.length || JSON.stringify(current.snapshots) !== JSON.stringify(plan.snapshots)) {
    throw new Error('Skillplanen er forældet; kilder eller destinationer er ændret. ' + current.conflicts.map(item => item.message).join('; '));
  }
  const changes = [];
  try {
    for (const detail of internals.get(current)) {
      if (!detail.changed) continue;
      for (const name of detail.removed) await publish(path.join(detail.target, name), null, detail.destination.files.get(name).sha256, changes);
      for (const [name, value] of detail.desired) {
        const expected = detail.destination.files.get(name)?.sha256 ?? null;
        if (expected !== value.sha256) await publish(path.join(detail.target, name), value.content, expected, changes);
      }
    }
  } catch (error) {
    const retained = [];
    for (const change of changes.reverse()) {
      try {
        if (await currentHash(change.file) !== change.written) {
          if (change.backup) { change.keepBackup = true; retained.push(change.backup); }
          continue;
        }
        if (change.backup) await fs.rename(change.backup, change.file);
        else await fs.unlink(change.file);
      } catch (rollbackError) {
        if (change.backup) { change.keepBackup = true; retained.push(change.backup); }
        error.message += ' Tilbagerulning kunne ikke afsluttes: ' + rollbackError.message;
      }
    }
    if (retained.length) error.message += ' Lokale ændringer er bevaret; oprindelige filer ligger i backup: ' + retained.join(', ');
    throw error;
  } finally {
    for (const change of changes) if (change.backup && !change.keepBackup) await fs.unlink(change.backup).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
  return { changed: current.changed, skills: current.skills, conflicts: [] };
}
