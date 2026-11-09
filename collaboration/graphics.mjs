import { createHash } from 'node:crypto';
import { GRAPHIC_FAMILIES } from '../core/graphics.mjs';
import { GRAPHIC_FAMILY_IDS, GRAPHIC_TOKEN_BINDINGS, GRAPHIC_TOKEN_DEFAULTS } from '../core/graphic-tokens.mjs';
import { parseGuide } from './guides.mjs';

const CONTRACT = 'docs/graphics/style-contract.json';
const GUIDE = 'docs/GRAPHICS-AUTHORING.md';
const FAMILY_GUIDES = Object.freeze({
  anatomy: 'docs/graphics/TEGNETS-ANATOMI.md',
  lightroom: 'docs/graphics/LYSRUM.md',
  passage: 'docs/graphics/PASSAGE-OG-FELTLINJER.md',
  fieldlines: 'docs/graphics/PASSAGE-OG-FELTLINJER.md',
});
const RUNTIME = Object.freeze([
  { file: 'core/graphics.mjs', exports: ['createGraphicRenderer', 'renderGraphic', 'mountGraphicMotion'] },
  { file: 'core/graphics/motion/player.mjs', exports: ['mountGraphicMotion', 'GRAPHIC_MOTION'] },
  { file: 'core/graphic-tokens.mjs', exports: ['GRAPHIC_TOKEN_BINDINGS', 'GRAPHIC_TOKEN_DEFAULTS'] },
]);
const hash = text => createHash('sha256').update(text).digest('hex');

/** Read the maintained authoring contract, never evaluate or load client-selected files. */
export async function getGraphicProfile({ root, read, family }) {
  if (family !== undefined && !GRAPHIC_FAMILY_IDS.includes(family)) throw new Error('Ukendt illustrationsfamilie. Brug anatomy, lightroom, passage eller fieldlines.');
  const contractText = await read(root, CONTRACT, 512 * 1024);
  const contract = JSON.parse(contractText.replace(/^\uFEFF/, ''));
  if (contract.contractVersion !== 1 || !Array.isArray(contract.rules) || !contract.shared || !contract.review ||
      GRAPHIC_FAMILY_IDS.some(id => contract.families?.[id]?.guide !== FAMILY_GUIDES[id])) {
    throw new Error('Grafikkontrakten har et ukendt format eller mangler en registreret familieguide.');
  }
  const files = [...new Set([CONTRACT, GUIDE, ...RUNTIME.map(entry => entry.file), ...(family ? [
    FAMILY_GUIDES[family], `core/graphics/families/${family}.mjs`,
    `core/graphics/families/${family}-catalog.mjs`, `core/graphics/motion/${family}.mjs`,
  ] : [])])];
  const texts = new Map([[CONTRACT, contractText]]);
  for (const file of files) if (!texts.has(file)) texts.set(file, await read(root, file, 512 * 1024));
  const sources = files.map(file => ({ file, sha256: hash(texts.get(file)) }));
  const guideReferences = [GUIDE, ...(family ? [FAMILY_GUIDES[family]] : [])].map(source => ({
    id: source.replace(/^docs\//, '').replace(/\.md$/, '').toLocaleLowerCase('da').replaceAll('/', '-'),
    source, sha256: hash(texts.get(source)),
    sections: parseGuide(texts.get(source)).sections.map(({ section, title, line }) => ({ section, title, line })),
  }));
  return {
    source: CONTRACT, sha256: hash(contractText), contractVersion: contract.contractVersion,
    status: contract.status, auditedOn: contract.auditedOn,
    families: GRAPHIC_FAMILIES.map(({ id, name, description, qualities }) => ({ id, name, description, qualities })),
    shared: contract.shared, rules: contract.rules, review: contract.review,
    materials: {
      source: 'core/graphic-tokens.mjs', kind: 'runtime-defaults',
      bindings: Object.fromEntries(Object.entries(GRAPHIC_TOKEN_BINDINGS).map(([role, token]) => [role, {
        token, defaultValue: GRAPHIC_TOKEN_DEFAULTS[token].$value,
      }])),
      duration: { token: 'duration.illustration', defaultValue: GRAPHIC_TOKEN_DEFAULTS['duration.illustration'].$value },
    },
    runtime: RUNTIME,
    ...(family ? { family, profile: contract.families[family], derivedProductGraphics: {
      status: contract.derivedProductGraphics.status, definesFamilyDefaults: contract.derivedProductGraphics.definesFamilyDefaults,
      entryPoint: contract.derivedProductGraphics.entryPoint,
      familyModule: contract.derivedProductGraphics.familyModules[family],
      familyExport: contract.derivedProductGraphics.familyExport, notes: contract.derivedProductGraphics.notes,
    } } : {}),
    guideReferences, sources,
    note: 'Profilen er et forfattergrundlag, ikke automatisk stilgodkendelse. Læs familiens bindende guideafsnit med get_guide og sammenlign med de registrerede referencer. Kontraktens code-observation og auditdato er historiske aflæsninger; aktuelle kildehash er ikke en ny faglig gennemgang. Materialedefaults og familienavne følger serverens indlæste runtime; genindlæs serveren efter kodeændringer. Temaets opløste værdier kan være andre end defaults. Historiske temasnapshots er udeladt.',
  };
}
