import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { generateCSS, validateCompatibility, validatePackage, migratePackage, LIBRARY_VERSION } from '../core/engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_FILES = ['contract.mjs', 'library.mjs', 'quality.mjs', 'engine.mjs', 'components.mjs'];
const MARKER = '<!-- design-studio -->';
const HELP = `Design Studio
  node tools/cli.mjs validate FILE
  node tools/cli.mjs css FILE [--out FILE] [--scope .ds-scope]
  node tools/cli.mjs assets FILE --out DIRECTORY
  node tools/cli.mjs compare BASE CANDIDATE
  node tools/cli.mjs init PROJECT_DIR [--theme studio-light]
  node tools/cli.mjs sync PROJECT_DIR
  node tools/cli.mjs migrate FILE --out NEW_FILE

init tilføjer tema, fælles komponentruntime, CSS, brandressourcer, konfiguration og agentanvisning.
sync opdaterer komponentruntime og genereret CSS. migrate skriver en ny temafil og bevarer originalen.
Eksisterende designfiler overskrives ikke.`;

async function readPackage(file) {
  let pack;
  try {
    pack = JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Ugyldig JSON i ${file}.`);
    throw error;
  }
  const result = validatePackage(pack);
  if (!result.valid) throw new Error(`Designpakken er ikke gyldig: ${file}\n${result.errors.map(error => `  - ${error}`).join('\n')}`);
  return pack;
}

function argumentsFor(args, allowedFlags) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument.startsWith('--')) {
      if (!allowedFlags.includes(argument)) throw new Error(`Ukendt argument: ${argument}`);
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Angiv en værdi efter ${argument}.`);
      if (options[argument] !== undefined) throw new Error(`Angiv kun ${argument} én gang.`);
      options[argument] = value;
    } else positionals.push(argument);
  }
  return { positionals, options };
}

async function exists(file) {
  try { return await fs.lstat(file); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function atomicWrite(file, content) {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, content, { flag: 'wx' });
    await fs.rename(temporary, file);
  } finally {
    await fs.unlink(temporary).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}


// Validate every output before creating anything, including case-insensitive
// filename collisions so exported packages remain portable to Windows.
async function directoriesFor(directory) {
  const missing = [];
  let current = directory;
  while (true) {
    const info = await exists(current);
    if (info) {
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Ressourcemappen og dens overmapper skal være almindelige mapper: ' + current);
    } else missing.unshift(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return missing;
}

async function assetOutputs(pack, directory) {
  const assets = pack.brand?.assets || [];
  if (!assets.length) return { files: [], directories: [] };
  const directories = await directoriesFor(directory);
  const names = new Set();
  const files = [];
  for (const asset of assets) {
    const name = asset.fileName;
    if (typeof name !== 'string' || !name || name === '.' || name === '..' || /[\\/:]/.test(name) || path.basename(name) !== name) {
      throw new Error('Brandressourcen skal have et filnavn uden mapper: ' + name);
    }
    const key = name.toLowerCase();
    if (names.has(key)) throw new Error('Flere brandressourcer bruger samme filnavn: ' + name);
    names.add(key);
    const file = path.join(directory, name);
    if (await exists(file)) throw new Error('Filen findes allerede; intet er ændret: ' + file);
    files.push({ file, content: Buffer.from(asset.data, 'base64') });
  }
  return { files, directories };
}

async function createDirectories(directories, created) {
  for (const directory of directories) {
    // Recheck the complete parent chain before each exclusive creation.
    await directoriesFor(path.dirname(directory));
    try {
      await fs.mkdir(directory);
      created.push(directory);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await directoriesFor(directory);
    }
  }
}

async function writeNewFile(file, content, created) {
  await directoriesFor(path.dirname(file));
  const handle = await fs.open(file, 'wx');
  created.push(file);
  try { await handle.writeFile(content); } finally { await handle.close(); }
}

async function rollbackCreated(files, directories) {
  for (const file of [...files].reverse()) await fs.unlink(file).catch(() => {});
  for (const directory of [...directories].reverse()) await fs.rmdir(directory).catch(() => {});
}

async function extractAssets(pack, directory) {
  const plan = await assetOutputs(pack, directory);
  const created = [], createdDirectories = [];
  try {
    await createDirectories(plan.directories, createdDirectories);
    for (const {file, content} of plan.files) await writeNewFile(file, content, created);
  } catch (error) {
    await rollbackCreated(created, createdDirectories);
    throw error;
  }
  return created;
}

async function runtimeCopies(designDir) {
  return Promise.all(RUNTIME_FILES.map(async name => ({
    file: path.join(designDir, 'runtime', name),
    content: await fs.readFile(path.join(ROOT, 'core', name), 'utf8'),
  })));
}
function withinProject(project, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) throw new Error('Projektkonfigurationen skal bruge relative filstier.');
  const file = path.resolve(project, relative);
  const distance = path.relative(project, file);
  if (distance === '..' || distance.startsWith('..' + path.sep) || path.isAbsolute(distance)) throw new Error('Filstien skal blive inden for projektmappen.');
  return file;
}
async function synchronize(projectArgument) {
  const project = await fs.realpath(projectArgument);
  const configFile = path.join(project, 'design-studio.project.json');
  const configInfo = await fs.lstat(configFile);
  if (!configInfo.isFile() || configInfo.isSymbolicLink()) throw new Error('Projektkonfigurationen skal være en almindelig fil.');
  const config = JSON.parse((await fs.readFile(configFile, 'utf8')).replace(/^\uFEFF/, ''));
  const packageFile = withinProject(project, config.package);
  const pack = await readPackage(packageFile);
  const cssFile = withinProject(project, config.css);
  const copies = await runtimeCopies(path.join(project, 'design'));
  if ([packageFile, configFile, ...copies.map(copy => copy.file)].some(file => file.toLowerCase() === cssFile.toLowerCase())) throw new Error('CSS-output må ikke overskrive tema, konfiguration eller runtime.');
  const plan = [...copies, { file: cssFile, content: generateCSS(pack, { scope: config.scope || '.ds-scope' }) }];
  for (const output of plan) {
    await directoriesFor(path.dirname(output.file));
    const info = await exists(output.file);
    if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error('Output skal være en almindelig fil: ' + output.file);
  }
  const missing = [...new Set((await Promise.all(plan.map(output => directoriesFor(path.dirname(output.file))))).flat())];
  await createDirectories(missing, []);
  for (const output of plan) await atomicWrite(output.file, output.content);
  config.schemaVersion = 2;
  config.library = 'design/runtime/components.mjs';
  config.libraryVersion = LIBRARY_VERSION;
  await atomicWrite(configFile, JSON.stringify(config, null, 2) + '\n');
  return [...plan.map(output => output.file), configFile];
}

async function initialize(projectArgument, theme) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(theme)) throw new Error('--theme skal være id for en pakke i packages-mappen.');
  const starter = await readPackage(path.join(ROOT, 'packages', `${theme}.json`));
  const project = await fs.realpath(projectArgument);
  if (!(await fs.stat(project)).isDirectory()) throw new Error('PROJECT_DIR skal være en eksisterende projektmappe.');
  const designDir = path.join(project, 'design');
  const designInfo = await exists(designDir);
  if (designInfo && (!designInfo.isDirectory() || designInfo.isSymbolicLink())) {
    throw new Error('Projektets design-mappe skal være en almindelig mappe.');
  }
  const packageFile = path.join(designDir, 'design.json');
  const cssFile = path.join(designDir, 'design.css');
  const configFile = path.join(project, 'design-studio.project.json');
  const runtime = await runtimeCopies(designDir);
  const outputs = [packageFile, cssFile, configFile, ...runtime.map(copy => copy.file)];
  for (const file of outputs) {
    if (await exists(file)) throw new Error(`Filen findes allerede; intet er ændret: ${file}`);
  }
  const agentsFile = path.join(project, 'AGENTS.md');
  const agentsInfo = await exists(agentsFile);
  if (agentsInfo && (!agentsInfo.isFile() || agentsInfo.isSymbolicLink())) {
    throw new Error('AGENTS.md skal være en almindelig fil.');
  }
  const agentsBefore = agentsInfo ? await fs.readFile(agentsFile, 'utf8') : null;
  const projectName = path.basename(project);
  const pack = structuredClone(starter);
  pack.id = projectName.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '') || 'project-design';
  if (!/^[a-z]/.test(pack.id)) pack.id = `project-${pack.id}`.slice(0, 80).replace(/-$/, '');
  pack.name = `${projectName} · tema`;
  const result = validatePackage(pack);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  const css = generateCSS(pack);
  const assetPlan = await assetOutputs(pack, path.join(designDir, 'assets'));
  const designDirectories = await directoriesFor(designDir);
  const config = {
    schemaVersion: 2,
    libraryVersion: LIBRARY_VERSION,
    library: 'design/runtime/components.mjs',
    studioRoot: ROOT.replaceAll('\\', '/'),
    package: 'design/design.json',
    css: 'design/design.css',
    scope: '.ds-scope',
    starter: starter.id,
    components: {},
  };
  const agentInstruction = `${MARKER}
## Design Studio

Brug Design Studio-systemet i ${ROOT.replaceAll('\\', '/')}.
Læs systemets AGENTS.md og README.md før visuelt arbejde.
Projektets tema er design/design.json; design/design.css genereres fra temaet og det fælles bibliotek.
Læs også docs/AGENT-WORKFLOW.md og docs/DESIGN-FOUNDATIONS.md i systemmappen.
Importér fælles komponenter fra design/runtime/components.mjs; brug renderComponent/createComponent, eller en tynd frameworkadapter.
Grundlayout, semantik og komponentstruktur ejes af core/library.mjs i Design Studio, aldrig af temaet.
design-studio.project.json registrerer projektets komponentimplementeringer i components.
For hver implementeret komponent: tilføj komponent-id med {file, export}; file er projektets relative filsti, export er navnet på eksporten.
Læs brandprincipper, sektionsregler og logobrug i pakkens brand-felt før visuelt arbejde, når pakken har en brandguide.
Når pakken har brandressourcer, ligger de i design/assets; brug logo-originalerne efter pakkens anvisninger.
Pakkens eventuelle indlejrede skrifter indgår automatisk i den genererede CSS.
Find registrerede implementeringer og det fælles katalog før du bygger UI. Genbrug komponenter og temaets tokens.
Nye genbrugelige komponenter tilføjes i systemets core/library.mjs med projektagnostiske navne, beskrivelser, eksempler og defaults; ikke i temaet. Brug kanoniske komponent-id'er og Fluent 2/Carbon-principperne beskrevet i DESIGN-FOUNDATIONS.md.
Efter biblioteksændringer: kør sync for produktet, og opdatér showcasen. Produktets særlige sammensætninger kan forblive lokale.
UX, indhold, handlinger og produktarkitektur bestemmes af dette projekt.
Efter ændringer: validér temaet og kør tools/cli.mjs sync PROJECT_DIR, så runtime og CSS følges ad.
Åbn Design Studio desktop-app, og vælg Filer > Åbn projekttema. Browseralternativ: node "${path.join(ROOT, 'tools/launch.mjs')}" --project "${packageFile}".
`;
  const agentContent = agentsBefore?.includes(MARKER)
    ? agentsBefore
    : `${agentsBefore ? `${agentsBefore.trimEnd()}\n\n` : ''}${agentInstruction}`;
  const contents = [`${JSON.stringify(pack, null, 2)}\n`, css, `${JSON.stringify(config, null, 2)}\n`, ...runtime.map(copy => copy.content)];
  const created = [], createdDirectories = [];
  try {
    await createDirectories([...new Set([...designDirectories, ...await directoriesFor(path.join(designDir, 'runtime')), ...assetPlan.directories])], createdDirectories);
    for (let index = 0; index < outputs.length; index++) await writeNewFile(outputs[index], contents[index], created);
    for (const {file, content} of assetPlan.files) await writeNewFile(file, content, created);
    // Preserve existing project guidance, and refuse a concurrent replacement.
    const currentAgents = await exists(agentsFile) ? await fs.readFile(agentsFile, 'utf8') : null;
    if (currentAgents !== agentsBefore) throw new Error('AGENTS.md blev ændret under oprettelsen. Prøv igen.');
    if (agentsBefore === null) {
      const handle = await fs.open(agentsFile, 'wx');
      created.push(agentsFile);
      try { await handle.writeFile(agentContent, 'utf8'); } finally { await handle.close(); }
    } else if (agentContent !== agentsBefore) await atomicWrite(agentsFile, agentContent);
  } catch (error) {
    await rollbackCreated(created, createdDirectories);
    throw error;
  }
  return [...outputs, ...assetPlan.files.map(({file}) => file), agentsFile];
}

export async function runCLI(args, { cwd = process.cwd(), log = console.log } = {}) {
  const [command, ...remaining] = args;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    log(HELP);
    return;
  }
  if (command === 'validate') {
    const { positionals } = argumentsFor(remaining, []);
    if (positionals.length !== 1) throw new Error('Brug: validate FILE');
    const file = path.resolve(cwd, positionals[0]);
    const pack = await readPackage(file);
    log(`Gyldig designpakke: ${pack.name} (${file})`);
  } else if (command === 'css') {
    const { positionals, options } = argumentsFor(remaining, ['--out', '--scope']);
    if (positionals.length !== 1) throw new Error('Brug: css FILE [--out FILE] [--scope .ds-scope]');
    const input = path.resolve(cwd, positionals[0]);
    const pack = await readPackage(input);
    const css = generateCSS(pack, options['--scope'] ? { scope: options['--scope'] } : {});
    if (options['--out']) {
      const output = path.resolve(cwd, options['--out']);
      if (output === input || ((await exists(output)) && await fs.realpath(output) === await fs.realpath(input))) {
        throw new Error('CSS-output må ikke overskrive designpakken. Vælg en anden fil.');
      }
      await atomicWrite(output, css);
      log(`CSS gemt: ${output}`);
    } else log(css);
  } else if (command === 'assets') {
    const { positionals, options } = argumentsFor(remaining, ['--out']);
    if (positionals.length !== 1 || !options['--out']) throw new Error('Brug: assets FILE --out DIRECTORY');
    const pack = await readPackage(path.resolve(cwd, positionals[0]));
    const files = await extractAssets(pack, path.resolve(cwd, options['--out']));
    log(files.length ? 'Brandressourcer udpakket:\n' + files.map(file => '  ' + file).join('\n') : 'Pakken indeholder ingen brandressourcer.');
  } else if (command === 'compare') {
    const { positionals } = argumentsFor(remaining, []);
    if (positionals.length !== 2) throw new Error('Brug: compare BASE CANDIDATE');
    const base = await readPackage(path.resolve(cwd, positionals[0]));
    const candidate = await readPackage(path.resolve(cwd, positionals[1]));
    const result = validateCompatibility(base, candidate);
    if (!result.compatible) {
      throw new Error(`Designpakkerne er ikke kompatible:\n${result.errors.map(error => `  - ${error}`).join('\n')}`);
    }
    log(`Kompatible designpakker: ${base.name} → ${candidate.name}`);
  } else if (command === 'migrate') {
    const { positionals, options } = argumentsFor(remaining, ['--out']);
    if (positionals.length !== 1 || !options['--out']) throw new Error('Brug: migrate FILE --out NEW_FILE');
    const input = path.resolve(cwd, positionals[0]);
    const output = path.resolve(cwd, options['--out']);
    if (output === input || await exists(output)) throw new Error('Output findes allerede; originalen bevares. Vælg en ny fil.');
    const source = await readPackage(input);
    const theme = migratePackage(source);
    const result = validatePackage(theme);
    if (!result.valid) throw new Error(result.errors.join('\n'));
    await directoriesFor(path.dirname(output));
    const created = [];
    await writeNewFile(output, JSON.stringify(theme, null, 2) + '\n', created);
    log('Tema gemt; originalen er bevaret: ' + output);
  } else if (command === 'sync') {
    const { positionals } = argumentsFor(remaining, []);
    if (positionals.length !== 1) throw new Error('Brug: sync PROJECT_DIR');
    const files = await synchronize(path.resolve(cwd, positionals[0]));
    log('Fælles bibliotek og CSS opdateret:\n' + files.map(file => '  ' + file).join('\n'));
  } else if (command === 'init') {
    const { positionals, options } = argumentsFor(remaining, ['--theme']);
    if (positionals.length !== 1) throw new Error('Brug: init PROJECT_DIR [--theme studio-light]');
    const files = await initialize(path.resolve(cwd, positionals[0]), options['--theme'] || 'studio-light');
    log(`Design Studio tilføjet:\n${files.map(file => `  ${file}`).join('\n')}`);
  } else throw new Error(`Ukendt kommando: ${command}\n${HELP}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  runCLI(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}





