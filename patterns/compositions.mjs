import { createComponentFactory, createLayout } from '../core/components.mjs';
import { COMPOSITIONS } from './catalog.mjs';
import { createObjectWorkbenchState, mountObjectWorkbench } from './object-workbench.mjs';
import { createResourceLibraryState, mountResourceLibrary } from './resource-library.mjs';
import { createHistoryEditorState, mountHistoryEditor } from './history-editor.mjs';
import { WEB_PATTERNS, createWebState, mountWebPattern } from './web.mjs';

export function createCompositionState(id) {
  if (WEB_PATTERNS.includes(id)) return createWebState(id);
  if (id === 'editor') return createObjectWorkbenchState();
  if (id === 'resource-library') return createResourceLibraryState();
  if (id === 'history') return createHistoryEditorState();
  if (id === 'form') return { draft: { name: 'Mit arbejdsområde', email: 'team@example.com', notifications: true }, saved: { name: 'Mit arbejdsområde', email: 'team@example.com', notifications: true } };
  if (id === 'list-detail') return {
    selected: 'introduction', query: '', items: [
      { id: 'introduction', title: 'Introduktion', description: 'Et fælles sted at begynde.', category: 'Vejledning', reviewed: false },
      { id: 'practice', title: 'Øvelse', description: 'Prøv en afgrænset opgave i dit eget tempo.', category: 'Aktivitet', reviewed: false },
      { id: 'reference', title: 'Reference', description: 'Saml de oplysninger, du vender tilbage til.', category: 'Ressource', reviewed: true },
      { id: 'notes', title: 'Arbejdsnoter', description: 'Bevar observationer og idéer til næste skridt.', category: 'Ressource', reviewed: false },
    ],
  };
  throw new Error('Ukendt sammensætning: ' + id);
}

/** Optional reference code. State belongs to the host; callbacks never imply disk persistence. */
export function mountComposition(theme, id, {
  document = globalThis.document, state = createCompositionState(id),
  announce = () => {}, onChange = () => {}, onUse = () => {}, idPrefix = 'composition-' + id,
} = {}) {
  if (!COMPOSITIONS[id]) throw new Error('Ukendt sammensætning: ' + id);
  if (WEB_PATTERNS.includes(id)) return mountWebPattern(theme, id, { document, state, onChange, idPrefix });
  if (id === 'editor') return mountObjectWorkbench(theme, { document, state, announce, onChange, idPrefix });
  if (id === 'resource-library') return mountResourceLibrary(theme, { document, state, announce, onChange, onUse, idPrefix });
  if (id === 'history') return mountHistoryEditor(theme, { document, state, announce, onChange, idPrefix });
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const cleanups = [];
  const component = createComponentFactory(theme, { document });
  const element = (tag, className = '') => { const node = document.createElement(tag); node.className = className; return node; };
  const root = createLayout(COMPOSITIONS[id].layout, { document });
  root.className += ' ds-composition ds-scope';
  root.setAttribute('aria-label', COMPOSITIONS[id].name);
  root.setAttribute('role', 'region');
  const listen = (node, event, handler) => { node.addEventListener(event, handler); cleanups.push(() => node.removeEventListener(event, handler)); };
  const stack = (...children) => { const node = component('stack'); node.replaceChildren(...children); return node; };
  const compact = (...children) => { const node = component('stack', { variant: 'compact' }); node.replaceChildren(...children); return node; };
  const card = (title, children) => {
    const node = component('card', { slots: { header: { component: 'heading', options: { text: title, variant: 'panel' } }, body: '', footer: '' } });
    node.querySelector('.ds-card__body').replaceChildren(...children);
    node.querySelector('.ds-card__footer').remove();
    return node;
  };
  const field = (key, label, value, options = {}) => component('field', { idPrefix: prefix + '-' + key, label, value, hint: '', ...options });
  const button = (text, action, options = {}) => component('button', { text, attrs: { 'data-action': action }, ...options });
  const status = component('text', { text: '', variant: 'small', attrs: { role: 'status', 'aria-live': 'polite' } });
  const notify = message => { status.textContent = message; announce(message); onChange(state); };

  if (id === 'form') {
    const host = element('div', 'composition-form'); root.append(host, status);
    function render(errors = {}, saved = false) {
      const form = element('form'); form.noValidate = true;
      const name = field('name', 'Navn', state.draft.name, { required: true, error: errors.name || '', hint: 'Et navn, der er nemt at genkende.' });
      const email = field('email', 'E-mail', state.draft.email, { type: 'email', required: true, error: errors.email || '', hint: 'Brug en adresse, du kan kontaktes på.' });
      const checkbox = component('checkbox', { idPrefix: prefix + '-notifications', label: 'Send mig opdateringer', checked: state.draft.notifications });
      const save = button('Gem indstillinger', 'save-form', { attrs: { type: 'submit', 'data-action': 'save-form' } });
      const reset = button('Fortryd ændringer', 'reset-form', { variant: 'secondary' });
      const actions = element('div', 'composition-actions'); actions.append(save, reset);
      const content = [name, email, checkbox, actions];
      if (saved) content.push(component('alert', { slots: { title: 'Gemt i eksemplet', body: 'Indstillingerne bevares, mens du skifter tema. Ingen fil er skrevet.' } }));
      form.append(card('Indstillinger', [stack(...content)]));
      name.querySelector('input').addEventListener('input', event => { state.draft.name = event.target.value; });
      email.querySelector('input').addEventListener('input', event => { state.draft.email = event.target.value; });
      checkbox.querySelector('input').addEventListener('change', event => { state.draft.notifications = event.target.checked; });
      form.addEventListener('submit', event => {
        event.preventDefault(); const invalid = {};
        if (!state.draft.name.trim()) invalid.name = 'Udfyld et navn.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.draft.email.trim())) invalid.email = 'Angiv en gyldig e-mailadresse.';
        if (Object.keys(invalid).length) { render(invalid); host.querySelector('[aria-invalid="true"]')?.focus(); notify('Ret de markerede felter.'); return; }
        state.saved = { ...state.draft, name: state.draft.name.trim(), email: state.draft.email.trim() };
        state.draft = { ...state.saved }; render({}, true); host.querySelector('[data-action="save-form"]').focus(); notify('Indstillingerne er gemt i eksemplet.');
      });
      reset.addEventListener('click', () => { state.draft = { ...state.saved }; render(); host.querySelector('[data-action="reset-form"]').focus(); notify('De senest gemte værdier er gendannet.'); });
      host.replaceChildren(form);
    }
    render();
  }

  if (id === 'list-detail') {
    const search = field('search', 'Søg i samlingen', state.query, { type: 'search', controlVariant: 'desktop', hint: 'Søg efter navn eller beskrivelse.' });
    const list = element('div'), detail = element('div');
    const layout = element('div', 'composition-list-detail');
    layout.append(card('Samling', [stack(search, list)]), detail); root.append(layout, status);
    function render(focusAction = false) {
      const query = state.query.toLocaleLowerCase('da').trim();
      const filtered = state.items.filter(item => (item.title + ' ' + item.description).toLocaleLowerCase('da').includes(query));
      if (!filtered.some(item => item.id === state.selected)) state.selected = filtered[0]?.id || null;
      const entries = filtered.map(item => {
        const entry = component('button', { variant: 'list-item', slots: { heading: item.title, description: item.category + (item.reviewed ? ' · Gennemgået' : '') }, attrs: { 'data-item': item.id, 'aria-current': item.id === state.selected ? 'true' : 'false' } });
        entry.addEventListener('click', () => { state.selected = item.id; render(); list.querySelector('[data-item="' + item.id + '"]').focus(); notify(item.title + ' er valgt.'); });
        return entry;
      });
      list.replaceChildren(entries.length ? compact(...entries) : component('instruction-note', { text: 'Ingen poster matcher søgningen. Prøv et andet søgeord.' }));
      const selected = state.items.find(item => item.id === state.selected);
      if (!selected) { detail.replaceChildren(component('instruction-note', { text: 'Vælg en post, når der er søgeresultater.' })); return; }
      const review = button(selected.reviewed ? 'Markér som ikke gennemgået' : 'Markér som gennemgået', 'review');
      review.setAttribute('aria-pressed', String(selected.reviewed));
      review.addEventListener('click', () => { selected.reviewed = !selected.reviewed; render(true); notify('Postens status er opdateret i eksemplet.'); });
      detail.replaceChildren(card(selected.title, [compact(component('badge', { text: selected.category }), component('text', { text: selected.description }), component('text', { text: selected.reviewed ? 'Denne post er gennemgået.' : 'Denne post afventer gennemgang.', variant: 'secondary' }), review)]));
      if (focusAction) detail.querySelector('[data-action="review"]').focus();
    }
    listen(search.querySelector('input'), 'input', event => { state.query = event.target.value; render(); notify('Søgningen er opdateret.'); });
    render();
  }

  return { element: root, state, destroy() { for (const cleanup of cleanups) cleanup(); root.remove(); } };
}
