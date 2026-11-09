import { resolveTokens } from '../core/engine.mjs';
import { getGraphicFamily } from '../core/graphics.mjs';
import { GRAPHIC_TOKEN_BINDINGS, GRAPHIC_TOKEN_DEFAULTS } from '../core/graphic-tokens.mjs';
import { COMPOSITIONS } from './catalog.mjs';
import { createCatalogPlaceholder } from '../core/catalog-placeholder.mjs';
import { paint } from './illustrations-primitives.mjs';
import * as anatomy from './illustrations-anatomy.mjs';
import * as lightroom from './illustrations-lightroom.mjs';
import * as passage from './illustrations-passage.mjs';
import * as fieldlines from './illustrations-fieldlines.mjs';

const families = { anatomy, lightroom, passage, fieldlines };
let sequence = 0;

/** Static product compositions, using the component catalog's family materials. */
export function createPatternIllustrator(theme, { document = globalThis.document } = {}) {
  const family = getGraphicFamily(theme), tokens = resolveTokens(theme);
  const style = Object.entries(GRAPHIC_TOKEN_BINDINGS).map(([key, token]) => {
    const local = key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    return `--g-${local}:var(--ds-${token.replaceAll('.', '-')},${tokens[token] ?? GRAPHIC_TOKEN_DEFAULTS[token].$value})`;
  }).join(';');
  const create = (tag, attrs = {}, children = [], text) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (text !== undefined) element.textContent = text;
    for (const child of children) element.append(create(child.tag, child.attrs, child.children, child.text));
    return element;
  };
  return id => {
    if (!Object.hasOwn(COMPOSITIONS, id)) throw new Error('Unknown pattern illustration: ' + id);
    if (COMPOSITIONS[id].illustration === false) return createCatalogPlaceholder({document});
    const prefix = `pattern-${family}-${id}-${++sequence}`;
    const { parts, definitions = [] } = families[family].draw(id, { prefix });
    const svg = create('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 600 420', width: 600, height: 420, 'aria-hidden': 'true', focusable: 'false', 'data-family': family, 'data-pattern-illustration': id, style });
    if (definitions.length) svg.append(create('defs', {}, definitions));
    svg.append(create('rect', { width: 600, height: 420, fill: paint('ground') }));
    const content = create('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'font-family': 'Arial,sans-serif' });
    for (const { key, name, purpose, shapes } of parts) {
      content.append(create('g', { 'data-part': key, 'data-name': name, 'data-purpose': purpose }, shapes));
    }
    svg.append(content);
    return svg;
  };
}
