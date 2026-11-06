import { createComponentFactory, createLayout } from '../core/components.mjs';

export function createListDetailState() {
  return {
    selected: 'introduction', preferredSelection: 'introduction', query: '', reviewFilter: 'all', items: [
      { id: 'introduction', title: 'Et godt sted at begynde', category: 'Vejledning', reviewed: false, description: 'Skab et fælles udgangspunkt, før arbejdet går i gang. Beskriv opgaven, aftal hvad et godt resultat skal kunne, og saml de vigtigste beslutninger ét sted.' },
      { id: 'practice', title: 'Fra idé til første udkast', category: 'Aktivitet', reviewed: false, description: 'Prøv en afgrænset opgave i dit eget tempo. Start med det vigtigste brugerforløb, gør idéen konkret, og brug det første udkast til at opdage, hvad der skal justeres.' },
      { id: 'reference', title: 'Fælles reference og beslutninger', category: 'Ressource', reviewed: true, description: 'Saml de oplysninger, der skal holde på tværs af opgaver. En kort begrundelse og et konkret eksempel gør det lettere for andre at bruge beslutningen i en ny sammenhæng.' },
      { id: 'notes', title: 'Observationer og næste skridt', category: 'Ressource', reviewed: false, description: 'Bevar det, du lærer undervejs. Skeln mellem observationer, åbne spørgsmål og aftalte ændringer, så næste gennemgang kan begynde med det, der stadig kræver opmærksomhed.' },
    ],
  };
}

/** Optional reference composition. Selection and review belong to the host, not storage. */
export function mountListDetail(theme, {
  document = globalThis.document, state = createListDetailState(), announce = () => {},
  onChange = () => {}, idPrefix = 'composition-list-detail',
} = {}) {
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const c = createComponentFactory(theme, { document });
  const element = (tag, className = '') => { const node = document.createElement(tag); node.className = className; return node; };
  const stack = (nodes, variant = 'default') => { const node = c('stack', { variant }); node.replaceChildren(...nodes); return node; };
  const heading = (text, variant, id) => c('heading', { variant, slots: { root: { tag: 'h3', text } }, ...(id ? { attrs: { id, tabindex: '-1' } } : {}) });
  const card = () => c('card', { slots: { header: { tag: 'header', children: [] }, body: { tag: 'div', children: [] }, footer: { tag: 'footer', children: [] } } });
  const button = (text, action, variant = 'ghost') => c('button', { text, variant, attrs: { 'data-action': action } });
  const root = createLayout('split', { document }); root.className += ' ds-composition ds-scope';
  root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Liste med detaljevisning');
  const listeners = [];
  const listen = (node, type, handler) => { node.addEventListener(type, handler); listeners.push(() => node.removeEventListener(type, handler)); };
  if (state.selected != null && (!Object.hasOwn(state, 'lastRenderedSelection') || state.selected !== state.lastRenderedSelection)) {
    state.preferredSelection = state.selected;
  }
  state.preferredSelection ??= state.selected;
  state.reviewFilter ??= 'all';

  const summary = c('text', { variant: 'secondary', text: '' });
  const intro = stack([c('label', { text: 'Indholdsoverblik' }), heading('Gennemgå samlingen', 'title'), summary], 'compact');
  const search = c('field', { idPrefix: prefix + '-search', label: 'Søg i samlingen', value: state.query, type: 'search', controlVariant: 'desktop', hint: '', placeholder: 'Navn, beskrivelse eller kategori' });
  const filter = c('field', {
    idPrefix: prefix + '-review-filter', label: 'Gennemgang', value: state.reviewFilter, hint: '', controlVariant: 'desktop',
    slots: { control: { tag: 'select', children: [['all', 'Alle poster'], ['pending', 'Afventer gennemgang'], ['reviewed', 'Gennemgået']].map(([value, text]) => ({ tag: 'option', attrs: { value }, text })) } },
  });
  const filters = element('div', 'composition-list-filters'); filters.append(search, filter);
  const count = c('text', { variant: 'small', text: '', attrs: { role: 'status', 'aria-live': 'polite', 'data-list-count': '' } });
  const reset = button('Nulstil filtre', 'reset-filters');
  const resultBar = element('div', 'composition-list-result-bar'); resultBar.append(count, reset);
  const list = stack([], 'compact'); list.setAttribute('aria-label', 'Poster i samlingen');
  const collection = card();
  collection.querySelector('.ds-card__header').append(heading('Samling', 'panel'));
  collection.querySelector('.ds-card__body').append(stack([filters, resultBar, list]));
  collection.querySelector('.ds-card__footer').remove();
  const detail = card(); detail.className += ' composition-list-detail-card';
  detail.setAttribute('aria-label', 'Postens detaljer');
  const layout = element('div', 'composition-list-detail'); layout.append(collection, detail);
  const status = c('text', { variant: 'small', text: state.message ?? '', attrs: { role: 'status', 'aria-live': 'polite' } });
  root.append(stack([intro, layout, status]));
  let entries = new Map();
  const notify = message => { state.message = message; status.textContent = message; announce(message); onChange(state); };
  const narrow = () => {
    const width = root.getBoundingClientRect().width;
    return Number.isFinite(width) && width > 0 && width <= 700;
  };
  function clearFilters() {
    state.query = ''; state.reviewFilter = 'all';
    search.querySelector('input').value = ''; filter.querySelector('select').value = 'all';
    render(); search.querySelector('input').focus(); notify('Filtrene er nulstillet.');
  }
  listen(reset, 'click', clearFilters);

  function render() {
    const query = state.query.trim().toLocaleLowerCase('da');
    const filtered = state.items.filter(item => [item.title, item.description, item.category].join(' ').toLocaleLowerCase('da').includes(query)
      && (state.reviewFilter === 'all' || (state.reviewFilter === 'reviewed' ? item.reviewed : !item.reviewed)));
    const preferred = state.items.find(item => item.id === state.preferredSelection);
    if (!preferred && state.items.length) state.preferredSelection = state.items[0].id;
    state.selected = filtered.find(item => item.id === state.preferredSelection)?.id ?? filtered[0]?.id ?? null;
    state.lastRenderedSelection = state.selected;
    const pending = state.items.filter(item => !item.reviewed).length;
    const noun = state.items.length === 1 ? 'post' : 'poster';
    summary.textContent = state.items.length + ' ' + noun + ' i samlingen · ' + pending + ' afventer gennemgang.';
    count.textContent = filtered.length + ' af ' + state.items.length + ' ' + noun;
    reset.hidden = !state.query && state.reviewFilter === 'all';
    if (reset.hidden) reset.setAttribute('hidden', ''); else reset.removeAttribute('hidden');
    entries = new Map();
    const rows = filtered.map(item => {
      const entry = c('list-item', {
        current: item.id === state.selected,
        slots: { heading: item.title, description: item.category + ' · ' + (item.reviewed ? 'Gennemgået' : 'Afventer gennemgang') },
        attrs: { 'data-item': item.id, 'aria-controls': prefix + '-detail' },
      });
      entry.addEventListener('click', () => {
        state.preferredSelection = item.id; render();
        (narrow() ? detail.querySelector('#' + prefix + '-detail-title') : entries.get(item.id))?.focus();
        notify(item.title + ' er valgt.');
      });
      entries.set(item.id, entry); return entry;
    });
    if (!rows.length) {
      const empty = c('empty-state', {
        idPrefix: prefix + '-empty', title: state.items.length ? 'Ingen poster matcher' : 'Samlingen er tom',
        body: state.items.length ? 'Prøv et andet søgeord, eller nulstil filtrene for at se hele samlingen.' : 'Nye poster vises her, når de føjes til samlingen.',
      });
      if (state.items.length) {
        const clear = button('Vis alle poster', 'clear-empty', 'tertiary'); clear.addEventListener('click', clearFilters);
        const actions = empty.querySelector('.ds-empty-state__actions'); actions.replaceChildren(clear); actions.hidden = false; actions.removeAttribute('hidden');
      }
      rows.push(empty);
    }
    list.replaceChildren(...rows);
    detail.setAttribute('id', prefix + '-detail');
    const selected = state.items.find(item => item.id === state.selected);
    const header = detail.querySelector('.ds-card__header'), body = detail.querySelector('.ds-card__body'), footer = detail.querySelector('.ds-card__footer');
    if (!selected) {
      header.replaceChildren(heading('Ingen post valgt', 'panel'));
      body.replaceChildren(c('text', { text: state.items.length ? 'En post vises her, når søgningen giver resultater.' : 'Detaljer og handlinger vises, når der er indhold at arbejde med.', variant: 'secondary' }));
      footer.replaceChildren(); footer.hidden = true; return;
    }
    const badges = element('div', 'composition-actions');
    badges.append(c('badge', { text: selected.category }), c('badge', { text: selected.reviewed ? 'Gennemgået' : 'Afventer gennemgang', variant: selected.reviewed ? 'accent' : 'neutral' }));
    const title = heading(selected.title, 'title', prefix + '-detail-title');
    header.replaceChildren(stack([badges, title], 'compact'));
    body.replaceChildren(stack([
      c('text', { text: selected.description }), c('divider'),
      stack([heading('Gennemgang', 'panel'), c('text', { variant: 'secondary', text: selected.reviewed ? 'Posten er gennemgået. Du kan sætte den tilbage til gennemgang, hvis noget skal genbesøges.' : 'Læs posten, og markér den som gennemgået, når indholdet er afklaret.' })], 'compact'),
    ]));
    const review = button(selected.reviewed ? 'Markér som ikke gennemgået' : 'Markér som gennemgået', 'review', selected.reviewed ? 'tertiary' : 'primary');
    review.setAttribute('aria-pressed', String(selected.reviewed));
    review.addEventListener('click', () => {
      const itemId = selected.id; selected.reviewed = !selected.reviewed; render();
      (state.selected === itemId ? detail.querySelector('[data-action="review"]') : detail.querySelector('#' + prefix + '-detail-title') || search.querySelector('input'))?.focus();
      notify(selected.title + (selected.reviewed ? ' er markeret som gennemgået.' : ' afventer gennemgang.'));
    });
    footer.hidden = false; footer.replaceChildren(review);
  }
  listen(search.querySelector('input'), 'input', event => { state.query = event.target.value; state.message = ''; render(); status.textContent = ''; onChange(state); });
  listen(filter.querySelector('select'), 'change', event => { state.reviewFilter = event.target.value; state.message = ''; render(); status.textContent = ''; onChange(state); });
  render();
  return { element: root, state, destroy() { listeners.forEach(dispose => dispose()); root.remove(); } };
}
