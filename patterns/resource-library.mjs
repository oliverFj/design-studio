import { createComponentFactory, createLayout } from '../core/components.mjs';

export function createResourceLibraryState() {
  return { query: '', type: 'all', favoritesOnly: false, view: 'grid', selected: 'starter', lastUsed: null, items: [
    { id: 'starter', title: 'Startskabelon', type: 'Skabelon', description: 'Et enkelt udgangspunkt til en ny idé.', tags: ['Start', 'Enkel'], favorite: true },
    { id: 'compact', title: 'Kompakt opsætning', type: 'Skabelon', description: 'En tættere opsætning med plads til flere værktøjer.', tags: ['Kompakt'], favorite: false },
    { id: 'workflow', title: 'Arbejdsgang', type: 'Vejledning', description: 'Fra første valg til et færdigt resultat.', tags: ['Start', 'Trinvis'], favorite: false },
    { id: 'reference', title: 'Visuel reference', type: 'Reference', description: 'Et overblik over relevante detaljer og variationer.', tags: ['Visuelt'], favorite: true },
    { id: 'practice', title: 'Øveforløb', type: 'Vejledning', description: 'Prøv metoden på en afgrænset opgave.', tags: ['Øvelse'], favorite: false },
    { id: 'advanced', title: 'Udvidet opsætning', type: 'Skabelon', description: 'Et udgangspunkt med flere muligheder.', tags: ['Avanceret'], favorite: false },
  ] };
}

export function mountResourceLibrary(theme, { document = globalThis.document, state = createResourceLibraryState(), announce = () => {}, onChange = () => {}, onUse = () => {}, idPrefix = 'resource-library' } = {}) {
  const c = createComponentFactory(theme, { document });
  const stack = (...nodes) => { const node = c('stack'); node.replaceChildren(...nodes); return node; };
  const compact = (...nodes) => { const node = c('stack', { variant: 'compact' }); node.replaceChildren(...nodes); return node; };
  const field = (key, label, value, options = {}) => c('field', { idPrefix: idPrefix + '-' + key, label, value, hint: '', controlVariant: 'desktop', ...options });
  const button = (text, action, variant = 'secondary') => c('button', { text, variant, attrs: { 'data-action': action } });
  const card = (title, nodes) => {
    const node = c('card', { slots: { header: { component: 'heading', options: { text: title, variant: 'panel' } }, body: '', footer: '' } });
    node.querySelector('.ds-card__body').replaceChildren(compact(...nodes)); node.querySelector('.ds-card__footer').remove(); return node;
  };
  const root = createLayout('workspace', { document }); root.className += ' ds-composition ds-scope'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Ressourcebibliotek');
  const filters = document.createElement('div'); filters.className = 'composition-resource-filters';
  const search = field('search', 'Søg i biblioteket', state.query, { type: 'search', placeholder: 'Søg efter navn, beskrivelse eller emne' });
  const types = [...new Set(state.items.map(item => item.type))];
  const type = field('type', 'Type', state.type, { slots: { control: { tag: 'select', children: ['all', ...types].map(value => ({ tag: 'option', attrs: { value }, text: value === 'all' ? 'Alle typer' : value })) } } });
  const favorites = c('checkbox', { idPrefix: idPrefix + '-favorites', label: 'Kun favoritter', checked: state.favoritesOnly });
  filters.append(search, type, favorites);
  const controls = document.createElement('div'); controls.className = 'composition-actions';
  const views = c('segmented-control', { variant: 'wrap' }); views.replaceChildren(); views.setAttribute('aria-label', 'Visning af ressourcer');
  const viewButtons = new Map();
  for (const [id, label] of [['grid', 'Kort'], ['list', 'Liste']]) {
    const node = c('segmented-option', { text: label, variant: 'desktop', attrs: { 'data-action': 'view-' + id } });
    node.addEventListener('click', () => { state.view = id; render(); node.focus(); notify('Visningen er skiftet til ' + label.toLocaleLowerCase('da') + '.'); });
    viewButtons.set(id, node); views.append(node);
  }
  const reset = button('Nulstil filtre', 'reset-filters', 'desktop');
  const count = c('text', { text: '', variant: 'small', attrs: { 'data-resource-count': '', role: 'status', 'aria-live': 'polite' } });
  controls.append(views, reset, count);
  const results = document.createElement('div'), detail = document.createElement('aside'); detail.setAttribute('aria-label', 'Ressourcens detaljer'); detail.className = 'ds-layout'; detail.setAttribute('data-layout', 'panel');
  const layout = document.createElement('div'); layout.className = 'composition-resource-layout'; layout.append(results, detail);
  const status = c('text', { text: '', variant: 'small', attrs: { role: 'status', 'aria-live': 'polite' } });
  root.append(stack(filters, controls, layout, status));
  let favoriteButtons = new Map(), openButtons = new Map();
  const notify = message => { status.textContent = message; announce(message); onChange(state); };
  function clearFilters() {
    state.query = ''; state.type = 'all'; state.favoritesOnly = false;
    search.querySelector('input').value = ''; type.querySelector('select').value = 'all'; favorites.querySelector('input').checked = false;
    render(); search.querySelector('input').focus(); notify('Filtrene er nulstillet.');
  }
  reset.addEventListener('click', clearFilters);
  function render() {
    const term = state.query.trim().toLocaleLowerCase('da');
    const filtered = state.items.filter(item => (state.type === 'all' || item.type === state.type) && (!state.favoritesOnly || item.favorite) && [item.title, item.description, ...item.tags].join(' ').toLocaleLowerCase('da').includes(term));
    if (!filtered.some(item => item.id === state.selected)) state.selected = filtered[0]?.id || null;
    for (const [id, node] of viewButtons) { node.setAttribute('aria-pressed', String(state.view === id)); node.setAttribute('data-state', state.view === id ? 'selected' : 'idle'); }
    favoriteButtons = new Map(); openButtons = new Map(); results.className = state.view === 'grid' ? 'composition-resource-grid' : 'composition-resource-list';
    const nodes = filtered.map(item => {
      const favorite = button(item.favorite ? '★ Favorit' : '☆ Gem favorit', 'favorite', 'ghost');
      favorite.setAttribute('aria-label', (item.favorite ? 'Fjern ' : 'Føj ') + item.title + (item.favorite ? ' fra favoritter' : ' til favoritter')); favorite.setAttribute('aria-pressed', String(item.favorite)); favorite.setAttribute('data-resource-favorite', item.id);
      favoriteButtons.set(item.id, favorite);
      favorite.addEventListener('click', () => {
        item.favorite = !item.favorite; render();
        (favoriteButtons.get(item.id) || search.querySelector('input')).focus(); notify('Favoritterne er opdateret.');
      });
      const open = state.view === 'list'
        ? c('button', { variant: 'list-item', slots: { heading: item.title, description: item.type + ' · ' + item.description }, attrs: { 'aria-current': item.id === state.selected ? 'true' : 'false' } })
        : button('Se detaljer', 'resource-details');
      open.setAttribute('data-resource', item.id);
      openButtons.set(item.id, open);
      if(state.view === 'grid') open.setAttribute('aria-pressed', String(item.id === state.selected));
      open.addEventListener('click', () => { state.selected = item.id; render(); openButtons.get(item.id).focus(); notify(item.title + ' er valgt.'); });
      if (state.view === 'list') { const row = document.createElement('div'); row.className = 'composition-resource-row'; row.append(open, favorite); return row; }
      const tags = document.createElement('div'); tags.className = 'composition-actions'; tags.append(...item.tags.map(text => c('badge', { text })));
      if (item.id === state.selected) tags.append(c('badge', { text: '✓ Valgt', variant: 'data' }));
      const actions = document.createElement('div'); actions.className = 'composition-actions'; actions.append(open, favorite);
      const resource = card(item.title, [c('text', { text: item.type, variant: 'small' }), c('text', { text: item.description }), tags, actions]);
      resource.className += ' composition-resource-card'; resource.setAttribute('data-selected', String(item.id === state.selected));
      return resource;
    });
    if (!nodes.length) {
      const empty = state.items.length ? 'Ingen ressourcer matcher filtrene.' : 'Biblioteket er tomt.';
      const message = c('instruction-note', { text: empty + (state.items.length ? ' Prøv et andet søgeord eller nulstil filtrene.' : 'Produktet kan tilføje egne ressourcer.') });
      if (state.items.length) { const clear = button('Nulstil filtre', 'clear-empty'); clear.addEventListener('click', clearFilters); nodes.push(stack(message, clear)); }
      else nodes.push(message);
    }
    results.replaceChildren(...nodes);
    const selected = state.items.find(item => item.id === state.selected);
    if (!selected) detail.replaceChildren(c('instruction-note', { text: 'Vælg en ressource, når der er resultater.' }));
    else {
      const use = button('Brug ressourcen', 'use-resource', 'primary');
      use.addEventListener('click', () => { state.lastUsed = selected.id; onUse(structuredClone(selected)); notify(selected.title + ' er valgt til brug i eksemplet.'); });
      detail.replaceChildren(card(selected.title, [c('badge', { text: selected.type }), c('text', { text: selected.description }), c('text', { text: 'Emner: ' + selected.tags.join(', '), variant: 'small' }), use]));
    }
    const summary = filtered.length + ' af ' + state.items.length + ' ressourcer.';
    if (count.textContent !== summary) count.textContent = summary;
    status.textContent = '';
  }
  const onSearch = event => { state.query = event.target.value; render(); onChange(state); };
  const onType = event => { state.type = event.target.value; render(); onChange(state); };
  const onFavorites = event => { state.favoritesOnly = event.target.checked; render(); onChange(state); };
  search.querySelector('input').addEventListener('input', onSearch); type.querySelector('select').addEventListener('change', onType); favorites.querySelector('input').addEventListener('change', onFavorites);
  render();
  return { element: root, state, destroy() { search.querySelector('input').removeEventListener('input', onSearch); type.querySelector('select').removeEventListener('change', onType); favorites.querySelector('input').removeEventListener('change', onFavorites); root.remove(); } };
}
