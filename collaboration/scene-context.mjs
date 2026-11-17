import { createHash } from 'node:crypto';
import { COMPONENT_LIBRARY } from '../core/library.mjs';
import { z } from 'zod';
import { validateSceneContract } from '../core/scene-fields.mjs';

const manifestTag = '<script type="application/json" id="stade-native-app">';
const registryTag = '<script type="application/json" id="stade-scene-registry">';
const maxAppBytes = 10 * 1024 * 1024;
const maxContextBytes = 256 * 1024;
const identifier = /^[a-z][a-z0-9-]{0,79}$/;
const appIdentifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fieldName = /^[a-z][a-zA-Z0-9-]*$/;
const cardComponents = new Set(['container', ...Object.keys(COMPONENT_LIBRARY)]);
const flows = new Set(['stack', 'row', 'grid', 'wrap']);
const alignments = new Set(['start', 'center', 'end', 'stretch']);
const actModes = new Set(['side', 'panel']);
const startActNames = { practice: 'Øvelse', overview: 'Overblik' };

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isId = value => typeof value === 'string' && identifier.test(value);
const isName = value => typeof value === 'string' && value.trim() && value.length <= 80;
const inRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

const registryId = z.string().regex(identifier);
const registryName = z.string().refine(value => Boolean(isName(value)));
const fieldKey = z.string().regex(fieldName);
const fieldLabel = { label: z.string().min(1) };
const sceneField = z.discriminatedUnion('type', [
  z.strictObject({ ...fieldLabel, type: z.literal('text'), defaultValue: z.string(), maxLength: z.number().int().positive(), slot: fieldKey.optional() }),
  z.strictObject({ ...fieldLabel, type: z.literal('enum'), defaultValue: z.string(), options: z.record(fieldKey, z.string()) }),
  z.strictObject({ ...fieldLabel, type: z.literal('number'), defaultValue: z.number(), min: z.number(), max: z.number(), step: z.number() }),
  z.strictObject({ ...fieldLabel, type: z.literal('checkbox'), defaultValue: z.boolean() }),
]);
const scenePart = z.strictObject({ ...fieldLabel, textKey: fieldKey.optional(), sizeKey: fieldKey.optional(), visibleKey: fieldKey.optional() });
const actionDefinition = z.strictObject({ label: registryName, defaultBlockType: registryId.optional(), recordCollection: registryId.optional() });
const actionTarget = z.strictObject({ kind: z.enum(['block', 'act']), id: registryId });
export const sceneBindingsSchema = z.record(registryId, actionTarget.nullable());
const registeredBlock = z.strictObject({
  type: registryId, name: registryName, fields: z.record(fieldKey, sceneField), parts: z.record(fieldKey, scenePart),
  actions: z.record(registryId, actionDefinition).optional(),
  repeatable: z.boolean().optional(),
  collection: registryId.optional(),
  acceptsCollection: registryId.optional(),
}).superRefine(({ fields, parts }, context) => {
  if (!Object.keys(fields).length && !Object.keys(parts).length) return;
  const error = validateSceneContract({ fields, parts }, { parts });
  if (error) context.addIssue({ code: 'custom', message: error });
});

export const sceneRegistrySchema = z.strictObject({
  version: z.literal(1),
  patterns: z.array(z.strictObject({
    id: registryId, name: registryName, description: z.string().refine(value => Boolean(value.trim())),
    parts: z.array(registeredBlock).min(1),
  })),
}).superRefine(({ patterns }, context) => {
  const patternIds = patterns.map(pattern => pattern.id);
  const blockTypes = patterns.flatMap(pattern => pattern.parts.map(part => part.type));
  if (new Set(patternIds).size !== patternIds.length || new Set(blockTypes).size !== blockTypes.length) {
    context.addIssue({ code: 'custom', message: 'Mønstre og bloktyper skal have entydige id’er.' });
  }
  for (const { parts } of patterns) {
    const types = new Set(parts.map(part => part.type));
    if (parts.some(({ actions }) => Object.values(actions ?? {}).some(({ defaultBlockType }) =>
      defaultBlockType !== undefined && !types.has(defaultBlockType)))) {
      context.addIssue({ code: 'custom', message: 'En handlings standardmål skal være en bloktype i samme mønster.' });
    }
  }
});

function readEmbeddedJSON(html, tag, label) {
  const first = html.indexOf(tag);
  if (first === -1) return null;
  const start = first + tag.length;
  const end = html.indexOf('</script>', start);
  if (end === -1 || html.indexOf(tag, start) !== -1) {
    throw new Error('Appfilen skal indeholde ét komplet ' + label + '.');
  }

  try { return { value: JSON.parse(html.slice(start, end)), start, end }; }
  catch { throw new Error('Appens ' + label + ' indeholder ikke gyldig JSON.'); }
}

function readRegistry(html) {
  const embedded = readEmbeddedJSON(html, registryTag, 'Scene-register');
  if (embedded === null) return undefined;
  const registry = sceneRegistrySchema.safeParse(embedded.value);
  if (!registry.success) throw new Error('Appens Scene-register har en ugyldig version eller mønsterdefinition.');
  return registry.data;
}

function parseManifest(html, appId) {
  const embedded = readEmbeddedJSON(html, manifestTag, 'Stade-manifest');
  if (embedded === null) throw new Error('Appfilen mangler et Stade-manifest.');
  const { value: manifest, start, end } = embedded;
  if (!isRecord(manifest) || manifest.format !== 'stade-native-app' || manifest.version !== 1 || !isName(manifest.name)) {
    throw new Error('Appens format, version eller navn er ugyldigt.');
  }
  if (typeof manifest.id !== 'string' || manifest.id.length > 80 || !appIdentifier.test(manifest.id) || manifest.id !== appId) {
    throw new Error('Appens id stemmer ikke med den registrerede app.');
  }
  const { scene } = manifest;
  if (!isRecord(scene) || scene.format !== 'stade-scene' || scene.version !== 2
    || !isRecord(scene.data) || !isId(scene.data.template)) {
    throw new Error('Appen indeholder ikke en Stade-scene i version 2.');
  }
  return { manifest, start, end };
}

function actsFromScene(data, name) {
  if (Object.hasOwn(data, 'acts')) {
    if (Object.hasOwn(data, 'layout') || !Array.isArray(data.acts) || !data.acts.length) {
      throw new Error('Scenen har en ugyldig liste over akter.');
    }
    return data.acts;
  }
  const known = Object.hasOwn(startActNames, data.template);
  return [{
    id: known ? data.template + '-main' : 'main',
    name: known ? startActNames[data.template] : name,
    mode: 'side',
    layout: data.layout,
  }];
}

function validateContainer(block) {
  const { layout } = block;
  if (!isName(block.name) || !Array.isArray(block.children) || !isRecord(layout)
    || !flows.has(layout.flow) || !alignments.has(layout.align)
    || !inRange(layout.gap, 0, 64) || !inRange(layout.columns, 1, 6) || !inRange(block.width, 15, 100)) {
    throw new Error('Ugyldigt layout for containeren ' + block.id + '.');
  }
}

function validateSizing(block) {
  const { sizing } = block;
  if (sizing === undefined) return;
  if (!isRecord(sizing) || !(sizing.mode === 'fit' && sizing.basis === undefined
    || (sizing.mode === 'fixed' || sizing.mode === 'grow') && inRange(sizing.basis, 56, 1200))) {
    throw new Error('Ugyldig fleksibel bredde i ' + block.id + '.');
  }
}

function savedProperties(block) {
  const { props } = block;
  if (props !== undefined && (!isRecord(props) || Object.entries(props).some(([name, value]) =>
    !fieldName.test(name) || !(typeof value === 'string' || typeof value === 'boolean' || Number.isFinite(value))))) {
    throw new Error('Ugyldige gemte egenskaber i blokken ' + block.id + '.');
  }
  return props;
}

function flattenAct(act, blockIds) {
  if (act.layout?.type !== 'container' || act.layout.width !== 100) {
    throw new Error('Akten ' + act.id + ' mangler en container i fuld bredde som rod.');
  }

  const blocks = [];
  function visit(block, parentId, index, depth, inArticleCard = false) {
    if (!isRecord(block) || !isId(block.id) || !isId(block.type)) throw new Error('En blok mangler et gyldigt id eller en type.');
    if (blockIds.has(block.id)) throw new Error('Flere blokke bruger id’et ' + block.id + '.');
    if (blocks.length >= 100 || depth > 8) throw new Error('En akt må højst have 100 blokke og otte indlejrede niveauer.');
    if (block.name !== undefined && !isName(block.name)) throw new Error('Blokken ' + block.id + ' har et ugyldigt navn.');
    blockIds.add(block.id);

    validateSizing(block);
    const savedProps = savedProperties(block);
    const legacy = block.type === 'practice-open-act';
    const type = legacy ? 'act-trigger' : block.type;
    if (inArticleCard && !cardComponents.has(type)) throw new Error('Kortlayoutet bruger containere og komponenter.');
    const props = legacy ? { label: 'Lyd og værktøjer', ...savedProps } : savedProps;
    const actions = block.actions === undefined ? undefined : sceneBindingsSchema.safeParse(block.actions);
    if (actions && !actions.success) throw new Error('Ugyldige handlingsmål i blokken ' + block.id + '.');
    const { bindings } = block;
    if (bindings !== undefined && (!inArticleCard || !isRecord(bindings) || Object.entries(bindings).some(([field, key]) =>
      !fieldName.test(field) || typeof key !== 'string' || !fieldName.test(key)))) {
      throw new Error('Ugyldige databindinger i blokken ' + block.id + '.');
    }

    blocks.push({ id: block.id, type, ...(block.name === undefined ? {} : { name: block.name }),
      parentId, index, ...(props === undefined ? {} : { props }), ...(actions && { actions: actions.data }),
      ...(bindings && { bindings }) });

    if (type === 'container') {
      validateContainer(block);
      block.children.forEach((child, position) => visit(child, block.id, position, depth + 1, inArticleCard));
    } else if (type === 'blog-list' && block.children !== undefined) {
      if (inArticleCard || !Array.isArray(block.children) || block.children.length !== 1 || block.children[0]?.type !== 'container') {
        throw new Error('Et kortlayout skal have én container som rod.');
      }
      visit(block.children[0], block.id, 0, depth + 1, true);
    } else if (block.children !== undefined) {
      throw new Error('Kun containere kan have underblokke.');
    }
  }
  visit(act.layout, null, 0, 0);
  return blocks;
}

function readLinks(acts, registry, actIds) {
  const definitions = new Map(registry?.patterns.flatMap(pattern =>
    pattern.parts.map(part => [part.type, part])));
  const blockActs = new Map();
  const typesByBlock = new Map();
  const firstByType = new Map();
  for (const { id, blocks } of acts) {
    for (const block of blocks) {
      blockActs.set(block.id, id);
      typesByBlock.set(block.id, block.type);
      if (!firstByType.has(block.type)) firstByType.set(block.type, block.id);
    }
  }

  const links = [];
  for (const { id: actId, blocks } of acts) {
    for (const block of blocks) {
      const source = { actId, blockId: block.id };
      const overrides = block.actions ?? {};
      let available = definitions.get(block.type)?.actions ?? {};
      if (block.type === 'act-trigger') {
        const { label = 'Åbn akt', targetAct } = block.props ?? {};
        if (!isName(label) || (targetAct !== undefined && !isId(targetAct))) {
          throw new Error('Aktknappen ' + block.id + ' har en ugyldig tekst eller aktforbindelse.');
        }
        if (targetAct !== undefined && !Object.hasOwn(overrides, 'open')) {
          if (actId === targetAct || !actIds.has(targetAct)) throw new Error('En aktknap skal åbne en anden gyldig akt i scenen.');
          links.push({ ...source, targetActId: targetAct, label });
        }
        available = { open: { label } };
      }

      for (const actionId of Object.keys(overrides)) {
        if (!Object.hasOwn(available, actionId)) throw new Error('Ukendt handling ' + actionId + ' i blokken ' + block.id + '.');
      }
      for (const [actionId, { label, defaultBlockType, recordCollection }] of Object.entries(available)) {
        const link = { ...source, actionId, label };
        const target = Object.hasOwn(overrides, actionId) ? overrides[actionId] : undefined;
        if (target === null) continue;
        if (target?.kind === 'act') {
          if (actId === target.id || !actIds.has(target.id)) throw new Error('En handling skal åbne en anden gyldig akt i scenen.');
          const receiver = recordCollection && acts.find(act => act.id === target.id).blocks
            .find(candidate => definitions.get(candidate.type)?.acceptsCollection === recordCollection);
          if (recordCollection && !receiver) throw new Error('Målet kan ikke modtage posten fra samlingen.');
          links.push({ ...link, targetActId: target.id, ...(receiver && { targetBlockId: receiver.id }) });
          continue;
        }
        const targetBlockId = target?.id ?? firstByType.get(defaultBlockType);
        if (!targetBlockId) continue;
        const targetActId = blockActs.get(targetBlockId);
        if (!targetActId || targetBlockId === block.id) {
          if (!target) continue;
          throw new Error('En handling skal pege på en anden gyldig blok i scenen.');
        }
        if (recordCollection && definitions.get(typesByBlock.get(targetBlockId))?.acceptsCollection !== recordCollection) {
          throw new Error('Målet kan ikke modtage posten fra samlingen.');
        }
        links.push({ ...link, targetActId, targetBlockId });
      }
    }
  }
  return links;
}

/** Read and validate the embedded scene without evaluating the app's scripts. */
export function readSceneApp(html, appId) {
  if (typeof html !== 'string') throw new Error('Appfilen skal være læsbar som tekst.');
  if (Buffer.byteLength(html, 'utf8') > maxAppBytes) throw new Error('Appfilen er for stor. Grænsen er 10 MB.');
  const { manifest, start, end } = parseManifest(html, appId);
  const { name, scene } = manifest;
  const actIds = new Set();
  const blockIds = new Set();
  const actLayouts = actsFromScene(scene.data, name);
  const acts = actLayouts.map((act, index) => {
    if (!isRecord(act) || !isId(act.id) || !isName(act.name)) throw new Error('En akt mangler et gyldigt id eller navn.');
    if (actIds.has(act.id)) throw new Error('Flere akter bruger id’et ' + act.id + '.');
    if (!actModes.has(act.mode) || (index === 0 && act.mode !== 'side')) {
      throw new Error('Akten ' + act.id + ' har en ugyldig visningsform. Den første akt skal være en side.');
    }
    actIds.add(act.id);
    return { id: act.id, name: act.name, mode: act.mode, blocks: flattenAct(act, blockIds) };
  });
  const registry = readRegistry(html);
  const links = readLinks(acts, registry, actIds);
  const revision = createHash('sha256').update(html, 'utf8').digest('hex');
  const context = { name, template: scene.data.template, version: scene.version, acts, links, revision, ...(registry && { registry }) };
  if (Buffer.byteLength(JSON.stringify(context), 'utf8') > maxContextBytes) {
    throw new Error('Sceneoversigten er for stor. Grænsen er 256 KB.');
  }
  return { manifest, start, end, actLayouts, context };
}

export function readSceneContext(html, appId) {
  return readSceneApp(html, appId).context;
}
