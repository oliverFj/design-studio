/** Optional outer-layout primitives. Products own columns, placement and overrides. */
export const LAYOUT_PROFILES = Object.freeze({
  prose: Object.freeze({ name: 'Læsetekst', maxWidth: '70ch', usage: 'Forklaringer, vejledning og længere tekst.' }),
  form: Object.freeze({ name: 'Formular', maxWidth: '44rem', usage: 'Formularer og indstillinger med én primær læseretning.' }),
  panel: Object.freeze({ name: 'Panel', maxWidth: '23rem', usage: 'Egenskaber, filtre og værktøjer ved siden af indhold.' }),
  split: Object.freeze({ name: 'Liste og detaljer', maxWidth: '72rem', usage: 'Samlinger med en liste og tilhørende detaljevisning.' }),
  workspace: Object.freeze({ name: 'Arbejdsområde', maxWidth: '84rem', usage: 'Sammensatte editorer med arbejdsflade og paneler.' }),
  fluid: Object.freeze({ name: 'Fuld bredde', maxWidth: 'none', usage: 'Canvas, kort, tidslinjer og data, som faktisk udnytter hele bredden.' }),
});

export function generateLayoutCSS(scope = '.ds-scope') {
  if (typeof scope !== 'string' || !/^[.#][a-zA-Z_][a-zA-Z0-9_-]*$/.test(scope)) throw new Error('CSS scope must be a single class or ID selector.');
  const selector = suffix => `:where(${scope}) .ds-layout${suffix}, :where(${scope}).ds-layout${suffix}`;
  return [
    `${selector('')} { --ds-layout-max-width: initial; box-sizing: border-box; inline-size: 100%; min-inline-size: 0; margin-inline: auto; }`,
    ...Object.entries(LAYOUT_PROFILES).map(([id, profile]) => `${selector('[data-layout="' + id + '"]')} { max-inline-size: var(--ds-layout-max-width, ${profile.maxWidth}); }`),
  ].join('\n');
}

export function createLayout(profile = 'form', { document = globalThis.document } = {}) {
  if (!Object.hasOwn(LAYOUT_PROFILES, profile)) throw new Error('Ukendt breddeprofil: ' + profile);
  const element = document.createElement('div');
  element.className = 'ds-layout'; element.setAttribute('data-layout', profile);
  return element;
}
