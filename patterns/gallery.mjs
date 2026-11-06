import { createComponentFactory, createLayout, createIcon } from '../core/components.mjs';
import { COMPOSITIONS, COMPOSITION_KINDS } from './catalog.mjs';
import { LAYOUT_PROFILES } from '../core/layout.mjs';
import { mountComposition, createCompositionState } from './compositions.mjs';
import { createPatternIllustrator } from './illustrations.mjs';

export const createGalleryState = () => ({ selected: 'editor', drafts: {} });

export function mountCompositionGallery(theme, {
  document = globalThis.document, state = createGalleryState(), announce = () => {}, idPrefix = 'patterns',
} = {}) {
  const c = createComponentFactory(theme, { document });
  const illustrate = createPatternIllustrator(theme, { document });
  const el = (tag, className = '', text) => {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const heading = (text, tag = 'h4') => c('heading', { variant: 'panel', slots: { root: { tag, text } } });
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  if (!COMPOSITIONS[state.selected]) state.selected = 'editor';
  state.drafts ||= {};
  const root = createLayout('fluid', { document }); root.className += ' ds-composition-gallery ds-scope';
  const header = el('header', 'composition-gallery-heading');
  const title = el('div');
  title.append(el('p', 'composition-eyebrow', 'Fra opgave til oplevelse'),
    c('heading', { variant: 'title', slots: { root: { tag: 'h2', text: 'Mønstre til rigtigt arbejde' } } }),
    c('text', { text: 'Sammenhængende forløb med fælles komponenter. Vælg et mønster, og prøv det i dit tema.' }));
  const controls = el('div', 'composition-gallery-controls');
  controls.append(el('p', 'composition-gallery-count', Object.keys(COMPOSITIONS).length + ' interaktive eksempler'));
  header.append(title, controls);
  const layout = el('div', 'composition-gallery-layout');
  const rail = c('scroll-area', { variant: 'body', slots: { content: '' } });
  rail.className += ' composition-pattern-rail';
  const viewport = rail.querySelector('.ds-scroll-area__viewport');
  viewport.setAttribute('id', prefix + '-rail');
  viewport.setAttribute('aria-label', 'Gennemse designmønstre vandret');
  for (const [direction, icon, label] of [[-1, 'arrow-left', 'Rul mod venstre'], [1, 'arrow-right', 'Rul mod højre']]) {
    const button = c('button', { variant: 'secondary', size: 'small', attrs: { 'aria-label': label, 'aria-controls': prefix + '-rail', 'data-pattern-scroll': String(direction) } });
    button.replaceChildren(createIcon(icon, { decorative: true }, { document }));
    button.addEventListener('click', () => viewport.scrollBy?.({ left: direction * Math.max(240, viewport.clientWidth * .8), behavior: 'instant' }));
    controls.append(button);
  }
  const navigation = el('nav', 'composition-pattern-navigation'); navigation.setAttribute('aria-label', 'Designmønstre');
  const navButtons = new Map();
  for (const [kind, group] of Object.entries(COMPOSITION_KINDS).reverse()) {
    const section = el('section', 'composition-pattern-group');
    section.append(el('h3', 'composition-eyebrow', group.name));
    const cards = el('div', 'composition-pattern-cards');
    for (const [id, item] of Object.entries(COMPOSITIONS).filter(([, item]) => item.kind === kind)) {
      const button = c('button', { text: item.name, variant: 'ghost', size: 'small', attrs: { 'data-pattern-nav': id } });
      button.className += ' composition-pattern-link';
      const drawing = el('span', 'composition-pattern-thumbnail'); drawing.setAttribute('aria-hidden', 'true');
      drawing.append(illustrate(id));
      button.replaceChildren(drawing, el('span', 'composition-pattern-label', item.name));
      button.addEventListener('click', () => choose(id, 'navigation'));
      navButtons.set(id, button); cards.append(button);
    }
    section.append(cards);
    navigation.append(section);
  }
  rail.querySelector('.ds-scroll-area__content').append(navigation);
  const content = el('article', 'composition-pattern-content');
  layout.append(rail, content); root.append(header, layout);
  let mounted;
  function render() {
    mounted?.destroy();
    const id = state.selected, item = COMPOSITIONS[id];
    for (const [key, button] of navButtons) {
      if (key === id) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    }
    const intro = el('header', 'composition-pattern-intro');
    const identity = el('div', 'composition-pattern-identity');
    identity.append(el('p', 'composition-eyebrow', COMPOSITION_KINDS[item.kind].name),
      c('heading', { variant: 'title', slots: { root: { tag: 'h3', text: item.name } }, attrs: { id: prefix + '-active-title' } }),
      c('text', { text: item.description }));
    const reset = c('button', { text: 'Nulstil eksempel', variant: 'ghost', size: 'small', attrs: { 'data-action': 'reset-pattern' } });
    reset.addEventListener('click', () => {
      state.drafts[id] = createCompositionState(id); render();
      content.querySelector('[data-action="reset-pattern"]').focus(); announce('Eksemplet er nulstillet.');
    });
    intro.append(identity, reset); content.setAttribute('aria-labelledby', prefix + '-active-title');
    const host = el('div', 'composition-demo'); host.setAttribute('data-preview', id);
    const previewBar = el('div', 'composition-preview-bar');
    previewBar.append(el('span', '', 'Interaktivt eksempel'), el('span', '', 'Prøv valg, ændringer og tilbagevenden'));
    const previewBody = el('div', 'composition-preview-body');
    mounted = mountComposition(theme, id, { document, state: state.drafts[id] ||= createCompositionState(id), announce, idPrefix: prefix + '-' + id });
    previewBody.append(mounted.element); host.append(previewBar, previewBody);
    const guide = el('div', 'composition-pattern-guide');
    const when = el('section'); when.append(heading('Hvornår bruges det?'), c('text', { text: item.useWhen }), c('text', { text: item.usage, variant: 'secondary' }));
    const behaviour = el('section'); behaviour.append(heading('Det skal fungere'));
    const interactions = el('ul', 'composition-behaviour-list');
    for (const text of item.interactions) interactions.append(el('li', '', text));
    behaviour.append(interactions); guide.append(when, behaviour);
    if (item.related.length) {
      const related = el('div', 'composition-related'); related.setAttribute('role', 'group'); related.setAttribute('aria-label', 'Beslægtede mønstre');
      related.append(el('span', 'composition-eyebrow', 'Se også'));
      for (const relatedId of item.related) {
        const button = c('button', { text: COMPOSITIONS[relatedId].name, variant: 'ghost', size: 'small', attrs: { 'data-pattern': relatedId } });
        button.addEventListener('click', () => choose(relatedId, 'related')); related.append(button);
      }
      guide.append(related);
    }
    const notes = el('details', 'composition-reuse');
    const summary = el('summary', '', 'Genbrug og sammensætning');
    const reuse = el('div', 'composition-reuse-body');
    reuse.append(c('text', { text: 'Valgfri referencekode · version ' + item.version + ' · ' + LAYOUT_PROFILES[item.layout].name }),
      c('text', { text: 'Produktet ejer data, kommandoer og lagring. Kopieret kode tilpasses i produktet og opdateres ikke automatisk.', variant: 'secondary' }));
    const components = el('div', 'composition-component-tags');
    for (const role of item.components) components.append(el('code', '', role));
    reuse.append(heading('Bygget af fælles komponenter'), components);
    if (item.source) reuse.append(heading('Reference og ophav'), c('text', { text: item.source.product + ' · gennemgået ' + item.source.reviewed }),
      c('text', { text: item.source.adaptation, variant: 'secondary' }), el('p', 'composition-source-files', item.source.files.join(' · ')));
    const pre = el('pre');
    pre.textContent = 'node tools/cli.mjs examples PROJECT_DIR\n\n'
      + "import { mountComposition } from './design/patterns/compositions.mjs';\n"
      + "const example = mountComposition(theme, '" + id + "', { state, onChange });\n"
      + 'host.append(example.element);\n// Ved afmontering: example.destroy();';
    reuse.append(heading('Brug i et tilknyttet projekt'), pre,
      c('text', { text: 'Indlæs også design/patterns/styles.css. Bibliotekets komponenter og tema skal følge samme runtimeversion.', variant: 'small' }));
    notes.append(summary, reuse); content.replaceChildren(intro, host, guide, notes);
  }
  function choose(id, origin) {
    if (!COMPOSITIONS[id] || state.selected === id) return;
    state.selected = id; render();
    if (origin === 'related') {
      const title = content.querySelector('#' + prefix + '-active-title'); title.setAttribute('tabindex', '-1'); title.focus();
    }
    if (origin === 'related') {
      const card = navButtons.get(id).getBoundingClientRect(), frame = viewport.getBoundingClientRect();
      const left = card.left < frame.left ? card.left - frame.left : card.right > frame.right ? card.right - frame.right : 0;
      if (left) viewport.scrollBy?.({ left, behavior: 'instant' });
    }
    announce(COMPOSITIONS[id].name + ' vises.');
  }
  render();
  return { element: root, state, destroy() { mounted?.destroy(); root.remove(); } };
}
