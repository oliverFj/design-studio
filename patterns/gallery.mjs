import { createComponentFactory, createLayout } from '../core/components.mjs';
import { COMPOSITIONS } from './catalog.mjs';
import { LAYOUT_PROFILES } from '../core/layout.mjs';
import { mountComposition, createCompositionState } from './compositions.mjs';

export const createGalleryState = () => ({ selected: 'editor', drafts: {} });

export function mountCompositionGallery(theme, {
  document = globalThis.document, state = createGalleryState(), announce = () => {}, idPrefix = 'patterns',
} = {}) {
  const component = createComponentFactory(theme, { document });
  const root = createLayout('workspace', { document }); root.className += ' ds-composition-gallery ds-scope';
  const heading = document.createElement('div'); heading.className = 'composition-heading composition-actions';
  const picker = component('field', { idPrefix: idPrefix + '-picker', label: 'Vælg et designmønster', value: state.selected, hint: '', controlVariant: 'desktop',
    slots: { control: { tag: 'select', children: Object.entries(COMPOSITIONS).map(([id, item]) => ({ tag: 'option', attrs: { value: id }, text: item.name })) } },
  });
  const reset = component('button', { text: 'Nulstil eksempel', variant: 'ghost', size:'small' });
  const content = document.createElement('div');
  heading.append(picker, reset); root.append(heading, content);
  let mounted;
  function render() {
    mounted?.destroy();
    const id = state.selected, item = COMPOSITIONS[id];
    const intro = component('stack', { variant: 'compact' });
    intro.replaceChildren(component('heading', { text: item.name, variant: 'panel' }), component('text', { text: item.description }));
    const host = document.createElement('div'); host.className = 'composition-demo';
    mounted = mountComposition(theme, id, { document, state: state.drafts[id] ||= createCompositionState(id), announce, idPrefix: idPrefix + '-' + id });
    host.append(mounted.element);
    const notes = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Genbrug og sammensætning';
    const pre = document.createElement('pre');
    const modulePath = ['./design/patterns/compositions', 'mjs'].join('.');
    pre.textContent = 'Referencekode · version ' + item.version + '\n\nAnvendelse: ' + item.usage
      + '\n\nBreddeprofil: ' + LAYOUT_PROFILES[item.layout].name + ' · kan tilpasses i produktet.'
      + '\n\nKomponenter: ' + item.components.join(', ') + '\n\n'
      + item.interactions.map(text => '• ' + text).join('\n')
      + (item.source ? '\n\nOphav: '+item.source.product+' · gennemgået '+item.source.reviewed+'\nFiler: '+item.source.files.join(', ')+'\n'+item.source.adaptation : '')
      + '\n\nKopiér eksempler til et tilknyttet projekt fra Design Studios mappe:\nnode tools/cli.mjs examples PROJECT_DIR\n\n'
      + "import { mountComposition } from '" + modulePath + "';\n"
      + "const example = mountComposition(theme, '" + id + "', { state, onChange });\nhost.append(example.element);\n// Ved afmontering: example.destroy();\n\n"
      + 'Indlæs også design/patterns/styles.css. Produktet ejer data, lagring og videre tilpasning. Kilde: Design Studios fælles komponenter.';
    notes.append(summary, pre); content.replaceChildren(intro, host, notes);
  }
  const select = picker.querySelector('select');
  select.addEventListener('change', () => { state.selected = select.value; render(); announce(COMPOSITIONS[state.selected].name + ' vises.'); });
  reset.addEventListener('click', () => { state.drafts[state.selected] = createCompositionState(state.selected); render(); announce('Eksemplet er nulstillet.'); });
  render();
  return { element: root, state, destroy() { mounted?.destroy(); root.remove(); } };
}
