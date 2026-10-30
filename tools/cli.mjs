import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { generateCSS, validateCompatibility, validatePackage, migratePackage, LIBRARY_VERSION } from '../core/engine.mjs';
import { doctor, formatDoctor, PROJECT_RUNTIME, runtimeContent } from './doctor.mjs';
import { STARTER_VERSION, STARTER_FILES, PACKAGE_FIELDS, contentHash, packageField, starterFiles, starterSnapshot } from './starter.mjs';
import { PATTERN_FILES } from '../patterns/catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = '<!-- design-studio -->';
const HELP = `Design Studio
  node tools/cli.mjs validate FILE
  node tools/cli.mjs css FILE [--out FILE] [--scope .ds-scope]
  node tools/cli.mjs assets FILE --out DIRECTORY
  node tools/cli.mjs compare BASE CANDIDATE
  node tools/cli.mjs init PROJECT_DIR [--theme studio-light] [--design-only]
  node tools/cli.mjs sync PROJECT_DIR
  node tools/cli.mjs doctor PROJECT_DIR
  node tools/cli.mjs update PROJECT_DIR [--apply]
  node tools/cli.mjs examples PROJECT_DIR
  node tools/cli.mjs migrate FILE --out NEW_FILE

init opretter et minimalt offlineprojekt med færdig index.html, kildefiler og npm run build samt tema, runtime, CSS, brandressourcer, konfiguration og agentanvisning.
Brug --design-only til at tilknytte et eksisterende produkt uden at oprette applikationsfiler.
sync opdaterer komponentruntime og genereret CSS. migrate skriver en ny temafil og bevarer originalen.
doctor kontrollerer tema, runtime, adaptere og offlinebuild uden at ændre projektet.
update viser valgfrie startprojektopdateringer. --apply opdaterer kun uændrede filer og manglende nye filer; lokale ændringer bevares.
examples kopierer valgfrie sammensætningseksempler til design/patterns uden at overskrive eksisterende filer.
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

function argumentsFor(args, allowedFlags, booleanFlags = []) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument.startsWith('--')) {
      if (!allowedFlags.includes(argument)) throw new Error(`Ukendt argument: ${argument}`);
      if (options[argument] !== undefined) throw new Error(`Angiv kun ${argument} én gang.`);
      if (booleanFlags.includes(argument)) { options[argument] = true; continue; }
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Angiv en værdi efter ${argument}.`);
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
  return Promise.all(PROJECT_RUNTIME.map(async ([source, relative]) => ({
    file: path.join(designDir, relative),
    content: runtimeContent(source, await fs.readFile(path.join(ROOT, source), 'utf8')),
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

async function updateStarter(projectArgument, apply) {
  const project = await fs.realpath(projectArgument);
  const configFile = path.join(project, 'design-studio.project.json');
  await directoriesFor(path.dirname(configFile));
  const configInfo = await fs.lstat(configFile);
  if (!configInfo.isFile() || configInfo.isSymbolicLink()) throw new Error('Projektkonfigurationen skal være en almindelig fil.');
  const configBefore = await fs.readFile(configFile, 'utf8');
  const config = JSON.parse(configBefore);
  const pack = await readPackage(withinProject(project, config.package));
  const app = await starterFiles(ROOT, { id: pack.id, name: path.basename(project) });
  if (!config.offline && !config.starterTemplate) throw new Error('Projektet har ingen registreret offline-startskabelon. Brug sync til fælles runtime og CSS; behold produktets egen app- og buildopsætning.');
  const runtime = await runtimeCopies(path.join(project, 'design'));
  const targets = [...app, ...runtime.map(copy => ({ relative: path.relative(project, copy.file).replaceAll('\\', '/'), content: copy.content })), { relative: config.css, content: generateCSS(pack, { scope: config.scope || '.ds-scope' }) }];
  const names = new Set();
  for (const target of targets) {
    const file = withinProject(project, target.relative);
    const key = file.toLowerCase();
    if (names.has(key) || [configFile, withinProject(project, config.package)].some(protectedFile => protectedFile.toLowerCase() === key)) throw new Error('Startprojektets output må ikke overlappe tema, konfiguration eller andre filer.');
    names.add(key);
  }
  const previous = config.starterTemplate;
  if (previous?.version) {
    const local = String(previous.version).split('.').map(Number), latest = STARTER_VERSION.split('.').map(Number);
    const difference = local.findIndex((value, index) => value !== latest[index]);
    if (!/^\d+\.\d+\.\d+$/.test(previous.version) || (difference >= 0 && local[difference] > latest[difference])) throw new Error('Projektets startprojektversion er nyere eller ukendt. Automatisk nedgradering understøttes ikke.');
  }
  const nextSnapshot = starterSnapshot(targets);
  const rows = [], writes = [], proposals = [];
  const readOutput = async relative => {
    const file = withinProject(project, relative);
    await directoriesFor(path.dirname(file));
    const info = await exists(file);
    if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error('Output skal være en almindelig fil: ' + file);
    return { file, before: info ? await fs.readFile(file, 'utf8') : null };
  };
  const classify = (current, baseline, target) => current === target ? 'current'
    : baseline === target ? (current === null ? 'deleted' : 'custom')
    : current === null ? (baseline === undefined ? 'add' : 'review')
    : current === baseline ? 'update' : 'review';
  const setField = (metadata, field, value) => {
    const parts = field.split('.'); const key = parts.pop();
    let node = metadata;
    for (const part of parts) {
      if (!node[part] || typeof node[part] !== 'object' || Array.isArray(node[part])) node[part] = {};
      node = node[part];
    }
    node[key] = value;
  };
  for (const target of targets) {
    const output = await readOutput(target.relative);
    if (target.relative === 'package.json' && output.before !== null) {
      const current = JSON.parse(output.before), next = structuredClone(current), suggested = structuredClone(current);
      if (!current || Array.isArray(current) || typeof current !== 'object' || ['scripts', 'engines', 'devDependencies'].some(key => current[key] !== undefined && (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])))) throw new Error('package.json skal have en objektstruktur for scripts, engines og devDependencies. Filen bevares.');
      const desired = JSON.parse(target.content);
      let changed = false, needsReview = false;
      for (const field of PACKAGE_FIELDS) {
        const local = packageField(current, field), base = previous?.package?.[field], incoming = packageField(desired, field);
        const action = classify(local === undefined ? null : JSON.stringify(local), base === undefined ? undefined : JSON.stringify(base), JSON.stringify(incoming));
        rows.push({ file: 'package.json → ' + field, action });
        if (action === 'add' || action === 'update') { setField(next, field, incoming); changed = true; }
        if (action === 'review') needsReview = true;
        if (action === 'review' || action === 'add' || action === 'update') setField(suggested, field, incoming);
      }
      if (changed) writes.push({ ...output, content: JSON.stringify(next, null, 2) + '\n' });
      if (needsReview) proposals.push({ relative: target.relative, content: JSON.stringify(suggested, null, 2) + '\n' });
      continue;
    }
    const action = classify(output.before === null ? null : contentHash(output.before), previous?.files?.[target.relative], contentHash(target.content));
    rows.push({ file: target.relative, action });
    if (action === 'add' || action === 'update') writes.push({ ...output, content: target.content });
    if (action === 'review') proposals.push(target);
  }
  const report = { from: previous?.version || 'ukendt', to: STARTER_VERSION, applied: apply, files: rows, proposals: [] };
  if (!apply) return report;
  for (const proposal of proposals) {
    const relative = '.design-studio/updates/' + STARTER_VERSION + '/' + contentHash(proposal.content).slice(0, 12) + '/' + proposal.relative;
    const output = await readOutput(relative);
    if (output.before !== null && output.before !== proposal.content) throw new Error('Et eksisterende opdateringsforslag er redigeret og bevares: ' + output.file);
    if (output.before === null) writes.push({ ...output, content: proposal.content });
    report.proposals.push(relative);
  }
  // This is the new reference baseline; customized product code remains customized.
  config.starterTemplate = nextSnapshot;
  const sharedReady = runtime.every(copy => !rows.some(row => row.file === path.relative(project, copy.file).replaceAll('\\', '/') && ['review', 'deleted'].includes(row.action)));
  if (sharedReady) config.libraryVersion = LIBRARY_VERSION;
  const configAfter = JSON.stringify(config, null, 2) + '\n';
  if (configAfter !== configBefore) writes.push({ file: configFile, before: configBefore, content: configAfter });
  const created = [], directories = [], replaced = [];
  try {
    const missing = [...new Set((await Promise.all(writes.map(output => directoriesFor(path.dirname(output.file))))).flat())];
    await createDirectories(missing, directories);
    // Recheck every original before writing, and again immediately before replacement.
    for (const output of writes) {
      const current = await exists(output.file) ? await fs.readFile(output.file, 'utf8') : null;
      if (current !== output.before) throw new Error('Projektfilen blev ændret under opdateringen: ' + output.file);
    }
    for (const output of writes) {
      if (output.before === null) await writeNewFile(output.file, output.content, created);
      else {
        if (await fs.readFile(output.file, 'utf8') !== output.before) throw new Error('Projektfilen blev ændret under opdateringen: ' + output.file);
        await atomicWrite(output.file, output.content); replaced.push(output);
      }
    }
  } catch (error) {
    for (const output of replaced.reverse()) {
      if (await fs.readFile(output.file, 'utf8').catch(() => null) === output.content) await atomicWrite(output.file, output.before);
    }
    await rollbackCreated(created, directories); throw error;
  }
  return report;
}

async function initialize(projectArgument, theme, designOnly = false) {
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
  const appFiles = designOnly ? [] : STARTER_FILES;
  const appOutputs = appFiles.map(file => path.join(project, file));
  const indexFile = path.join(project, 'index.html');
  const allOutputs = [...outputs, ...appOutputs, ...(designOnly ? [] : [indexFile])];
  for (const file of allOutputs) {
    if (await exists(file)) throw new Error(`Filen findes allerede; intet er ændret: ${file}` + (appOutputs.includes(file) || file === indexFile ? '\nBrug --design-only for at tilknytte et eksisterende produkt uden offline-startprojektet.' : ''));
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
  const appSources = designOnly ? [] : await starterFiles(ROOT, { id: pack.id, name: projectName });
  const appContents = appSources.map(file => file.content);
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
    ...(!designOnly ? { offline: true } : {}),
    ...(!designOnly ? { starterTemplate: starterSnapshot([
      ...appSources,
      ...runtime.map(copy => ({ relative: path.relative(project, copy.file).replaceAll('\\', '/'), content: copy.content })),
      { relative: 'design/design.css', content: css },
    ]) } : {}),
  };
  const agentInstruction = `${MARKER}
## Design Studio

Brug Design Studio-systemet i ${ROOT.replaceAll('\\', '/')}.
Læs systemets AGENTS.md og README.md samt docs/AGENT-WORKFLOW.md før UI-arbejde. Arbejdsgangen er den fælles indgang; docs/INTEGRATION.md indeholder API-eksempler, og docs/DESIGN-FOUNDATIONS.md forklarer designprincipperne. Følg også dette produkts egne anvisninger.
Find design-studio.project.json og brug dens faktiske stier og scope. Projektets tema er design/design.json; design/design.css og design/runtime genereres af sync og må ikke håndredigeres.

Lever som standard projektets egen index.html i roden, som åbnes direkte via file:// uden server, terminal eller installeret runtime.
Brug projektets npm run build til at pakke kode, runtime, CSS og nødvendige ressourcer til offlinebrug; undgå CDN'er og lokale fetch-/modulkald, der kræver en server.
Agenten installerer udviklingsafhængigheder og genbygger efter kode-, tema- og ressourceændringer. Brugeren skal blot genindlæse browseren.
${designOnly ? 'Init er kørt med --design-only og har kun oprettet designtilknytningen. Bevar produktets eksisterende app og build.' : 'Init har oprettet src-filer, tools/build.mjs, package.json og en færdig index.html. Kør npm install ved første udviklingsopsætning. Redigér src-filerne, ikke den genererede index.html.'}
Bevar eksisterende arkitektur og brand. En anden driftsmodel kræver et udtrykkeligt brugerkrav eller konkret nødvendig funktionalitet.

Genbrug biblioteket fra design/runtime/components.mjs og temaets tokens under ds-scope. Brug de fælles breddeprofiler gennem createLayout eller ds-layout/data-layout; produktet ejer kolonner og placering.
Registrér kun faktiske frameworkadaptere i konfigurationens components med verificerede file og export. Direkte runtimebrug kræver ingen lokal adapter. Nye genbrugelige roller og varianter udvikles i det fælles bibliotek, ikke som lokale kopier.
Brug de fælles controllere til interaktion: mountMenuControls til kommandomenuer, mountTree til hierarkier og native showModal()/close() til dialoger. Produktet ejer data, kommandoer og validering. Bevar kladder, fejl og valg ved temaskift; ryd controllere ved genmontering.
Læs brandprincipper, sektionsregler og logobrug i temaet. Brug logo-originalerne fra design/assets efter brandreglerne og bevar licenser.
Brug createProjectFile fra design/runtime/files.mjs med produktets format-id, version og validering. Annullerede eller ugyldige åbninger bevarer state. Downloads overskriver ikke automatisk originalfilen.

Kør sync fra systemmappen ved ændret tema eller fælles runtime og genbyg derefter produktet. Rene produktændringer kræver ikke sync. Brug npm run doctor i offline-startprojektet til at finde konkrete fejl; kontrollen ændrer ikke filer.
tools/cli.mjs update PROJECT_DIR viser valgfrie skabelonopdateringer. Gennemgå planen før --apply; lokale ændringer bevares. Opdatering erstatter ikke dette produkts AGENTS.md.
Kontrollér den berørte funktion proportionelt. Nye skærme skal inspiceres i browseren med relevant tastatur, smal bredde og fejl-/tomtilstande. HTTP-kontrol beviser ikke file://; respekter værktøjets URL-politik og angiv manglende kontrol præcist.
Åbn "${path.join(ROOT, 'index.html')}" direkte i browseren, og vælg Åbn tema for at indlæse "${packageFile}".
Gem tema henter en JSON-fil. Placér den som projektets design/design.json før sync; originalfilen overskrives ikke automatisk.
`;
  const agentContent = agentsBefore?.includes(MARKER)
    ? agentsBefore
    : `${agentsBefore ? `${agentsBefore.trimEnd()}\n\n` : ''}${agentInstruction}`;
  const contents = [`${JSON.stringify(pack, null, 2)}\n`, css, `${JSON.stringify(config, null, 2)}\n`, ...runtime.map(copy => copy.content)];
  const appDirectories = (await Promise.all(appOutputs.map(file => directoriesFor(path.dirname(file))))).flat();
  const created = [], createdDirectories = [];
  try {
    const runtimeDirectories = (await Promise.all(runtime.map(copy => directoriesFor(path.dirname(copy.file))))).flat();
    await createDirectories([...new Set([...designDirectories, ...runtimeDirectories, ...assetPlan.directories, ...appDirectories])], createdDirectories);
    for (let index = 0; index < outputs.length; index++) await writeNewFile(outputs[index], contents[index], created);
    for (const {file, content} of assetPlan.files) await writeNewFile(file, content, created);
    for (let index = 0; index < appOutputs.length; index++) await writeNewFile(appOutputs[index], appContents[index], created);
    if (!designOnly) {
      const { buildHTML } = await import('../templates/offline/tools/build.mjs');
      await writeNewFile(indexFile, await buildHTML(project), created);
    }
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
  return [...allOutputs, ...assetPlan.files.map(({file}) => file), agentsFile];
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
  } else if (command === 'examples') {
    const { positionals } = argumentsFor(remaining, []);
    if (positionals.length !== 1) throw new Error('Brug: examples PROJECT_DIR');
    const project = await fs.realpath(path.resolve(cwd, positionals[0]));
    await fs.access(path.join(project, 'design/runtime/components.mjs'));
    const destination = path.join(project, 'design/patterns');
    const files = await Promise.all(PATTERN_FILES.map(async name => ({
      file: path.join(destination, name),
      content: (await fs.readFile(path.join(ROOT, 'patterns', name), 'utf8')).replaceAll("'../core/", "'../runtime/"),
    })));
    for (const { file } of files) if (await exists(file)) throw new Error('Filen findes allerede; intet er ændret: ' + file);
    const created = [], directories = [];
    try {
      await createDirectories(await directoriesFor(destination), directories);
      for (const { file, content } of files) await writeNewFile(file, content, created);
    } catch (error) { await rollbackCreated(created, directories); throw error; }
    log('Referenceeksempler kopieret. Produktet ejer nu tilpasningerne; sync overskriver dem ikke.\n' + files.map(file => '  ' + file.file).join('\n') + '\nIndlæs design/patterns/styles.css i produktets build, og importer de ønskede eksempler.');
  } else if (command === 'update') {
    const { positionals, options } = argumentsFor(remaining, ['--apply'], ['--apply']);
    if (positionals.length !== 1) throw new Error('Brug: update PROJECT_DIR [--apply]');
    const report = await updateStarter(path.resolve(cwd, positionals[0]), !!options['--apply']);
    const labels = { current: 'AKTUEL', add: 'TILFØJ', update: 'OPDATÉR', custom: 'BEVAR LOKAL', deleted: 'BEVAR SLETTET', review: 'MANUEL GENNEMGANG' };
    log('Startprojekt: ' + report.from + ' → ' + report.to + '\n' + report.files.map(file => labels[file.action] + ' · ' + file.file).join('\n'));
    if (report.applied) log('Sikre ændringer er anvendt. Projektets egen kode er bevaret.\n' + report.proposals.map(file => 'Forslag: ' + file).join('\n') + '\nGenbyg med npm run build efter ændringer.');
    else log('Ingen filer er ændret. Brug --apply for at anvende sikre ændringer og få forslag til manuel fletning.');
    return report;
  } else if (command === 'doctor') {
    const { positionals } = argumentsFor(remaining, []);
    if (positionals.length !== 1) throw new Error('Brug: doctor PROJECT_DIR');
    const report = await doctor(path.resolve(cwd, positionals[0]), { studioRoot: ROOT });
    log(formatDoctor(report));
    if (!report.valid) throw new Error('Doctor fandt fejl i projektet. Se rapporten ovenfor.');
    return report;
  } else if (command === 'sync') {
    const { positionals } = argumentsFor(remaining, []);
    if (positionals.length !== 1) throw new Error('Brug: sync PROJECT_DIR');
    const files = await synchronize(path.resolve(cwd, positionals[0]));
    log('Fælles bibliotek og CSS opdateret:\n' + files.map(file => '  ' + file).join('\n'));
  } else if (command === 'init') {
    const { positionals, options } = argumentsFor(remaining, ['--theme', '--design-only'], ['--design-only']);
    if (positionals.length !== 1) throw new Error('Brug: init PROJECT_DIR [--theme studio-light] [--design-only]');
    const files = await initialize(path.resolve(cwd, positionals[0]), options['--theme'] || 'studio-light', options['--design-only'] || false);
    log(`Design Studio tilføjet:\n${files.map(file => `  ${file}`).join('\n')}`);
  } else throw new Error(`Ukendt kommando: ${command}\n${HELP}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  runCLI(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}





