import { createComponentFactory, createLayout, animateStandard } from '../core/components.mjs';
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
  const root = createLayout('fluid', { document }); root.className += ' ds-composition-gallery composition-gallery-layout ds-scope';
  const rail = el('aside', 'composition-pattern-rail');
  const viewport = rail;
  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('id', prefix + '-rail');
  viewport.setAttribute('aria-label', 'Gennemse designmønstre');
  const navigation = el('nav', 'composition-pattern-navigation'); navigation.setAttribute('aria-label', 'Designmønstre');
  const navButtons = new Map();
  for (const [kind, group] of Object.entries(COMPOSITION_KINDS).reverse()) {
    const section = el('section', 'composition-pattern-group');
    section.append(el('h3', 'composition-eyebrow', group.name));
    const cards = el('div', 'composition-pattern-cards');
    for (const [id, item] of Object.entries(COMPOSITIONS).filter(([, item]) => item.kind === kind)) {
      const button = c('button', { text: item.name, variant: 'ghost', size: 'small', attrs: { 'data-pattern-nav': id } });
      button.className += ' composition-pattern-link ds-preview-choice';
      const drawing = el('span', 'composition-pattern-thumbnail'); drawing.setAttribute('aria-hidden', 'true');
      drawing.append(illustrate(id));
      button.replaceChildren(drawing, el('span', 'composition-pattern-label', item.name));
      button.addEventListener('click', () => choose(id, 'navigation'));
      navButtons.set(id, button); cards.append(button);
    }
    section.append(cards);
    navigation.append(section);
  }
  rail.append(navigation);
  const content = el('article', 'composition-pattern-content');
  root.append(rail, content);
  let mounted;
  const transitions=new Set();
  function stopTransition(){for(const effect of transitions)effect.cancel();transitions.clear();}
  function render() {
    stopTransition();
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
    content.scrollTop = 0;
    for(const child of content.children){
      const effect=animateStandard(child,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}]);
      if(effect){transitions.add(effect);effect.finished.catch(()=>{}).finally(()=>transitions.delete(effect));}
    }
    if (origin === 'related') {
      const title = content.querySelector('#' + prefix + '-active-title'); title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true });
    }
    if (origin === 'related') {
      const card = navButtons.get(id).getBoundingClientRect(), frame = viewport.getBoundingClientRect();
      const top = card.top < frame.top ? card.top - frame.top : card.bottom > frame.bottom ? card.bottom - frame.bottom : 0;
      if (top) viewport.scrollBy?.({ top, behavior: 'instant' });
    }
    announce(COMPOSITIONS[id].name + ' vises.');
  }
  render();
  return { element: root, rail, content, state, destroy() { stopTransition(); mounted?.destroy(); root.remove(); } };
}
