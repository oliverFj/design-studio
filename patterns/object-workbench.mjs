import { createComponentFactory, createLayout, mountTree } from '../core/components.mjs';

// Adapted from FormLab's object-panel.js and inspector in ui.js (2026-10-27).
// The model is deliberately generic; geometry and application commands stay in the product.
export function createObjectWorkbenchState() {
  return {
    selected: 'panel', selectedIds: ['panel'], expanded: ['collection'], query: '', tab: 'properties', folds: {}, drafts: {},
    objects: [
      { id: 'collection', kind: 'group', label: 'Samling', width: 12, visible: true, locked: false },
      { id: 'panel', parent: 'collection', kind: 'object', label: 'Hovedflade', width: 8, visible: true, locked: false },
      { id: 'detail', parent: 'collection', kind: 'object', label: 'Detalje', width: 3, visible: true, locked: false },
      { id: 'archive', kind: 'group', label: 'Alternativer', width: 12, visible: true, locked: false },
    ],
  };
}

export function mountObjectWorkbench(theme, { document = globalThis.document, state = createObjectWorkbenchState(), announce = () => {}, onChange = () => {}, idPrefix = 'object-workbench' } = {}) {
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  state.selectedIds ||= state.selected ? [state.selected] : [];
  state.query ||= ''; state.tab ||= 'properties'; state.folds ||= {}; state.drafts ||= {};
  for (const item of state.objects) { item.kind ||= state.objects.some(child => child.parent === item.id) ? 'group' : 'object'; item.locked ??= false; }
  const c = createComponentFactory(theme, { document });
  const el = (tag, className = '') => { const node = document.createElement(tag); node.className = className; return node; };
  const stack = (...children) => { const node = c('stack'); node.replaceChildren(...children); return node; };
  const compact = (...children) => { const node = c('stack', { variant: 'compact' }); node.replaceChildren(...children); return node; };
  const field = (key, label, value, options = {}) => c('field', { label, value, hint: '', controlVariant: 'desktop', idPrefix: prefix + '-' + key, ...options });
  const button = (text, action, options = {}) => c('button', { text, variant: 'tertiary', size:'small', attrs: { 'data-action': action }, ...options });
  const card = (title, ...children) => {
    const node = c('card', { slots: { header: { component: 'heading', options: { text: title, variant: 'panel' } }, body: '', footer: '' } });
    node.querySelector('.ds-card__body').replaceChildren(...children); node.querySelector('.ds-card__footer').remove(); return node;
  };
  const scroll = (content, label, className) => {
    const area = c('scroll-area', { variant: 'body', slots: { content: '' } });
    area.className += ' ' + className;
    area.querySelector('.ds-scroll-area__viewport').setAttribute('aria-label', label);
    area.querySelector('.ds-scroll-area__content').append(content); return area;
  };
  const root = createLayout('workspace', { document }); root.className += ' ds-composition ds-scope'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Objekteditor inspireret af FormLab');
  const layout = el('div', 'composition-object-editor'), dock = el('aside', 'composition-object-dock'); dock.setAttribute('aria-label', 'Objekter og egenskaber');
  dock.className += ' ds-layout'; dock.setAttribute('data-layout', 'panel');
  const preview = el('div', 'composition-workspace'), treeHost = el('div');
  const summary = c('text', { text: '', variant: 'small', attrs: { role: 'status' } });
  const search = field('object-search', 'Find objekt', state.query, { type: 'search', hint: 'Søgning bevarer matchende objekters placering i hierarkiet.' });
  const inspectorHost = el('div', 'composition-properties');
  dock.append(card('Objekter', stack(summary, search, scroll(treeHost, 'Objekter', 'composition-tree-scroll'))), inspectorHost);
  const workspace = el('section', 'composition-workbench'); workspace.setAttribute('aria-labelledby', prefix + '-workspace-title');
  workspace.append(c('heading', { text: 'Arbejdsområde', variant: 'panel', attrs: { id: prefix + '-workspace-title' } }), preview);
  layout.append(workspace, dock);
  const status = c('text', { text: 'Ctrl/⌘-klik eller Shift i træet vælger flere. Gruppehandlinger ændrer ikke valget.', variant: 'small', attrs: { role: 'status', 'aria-live': 'polite' } });
  root.append(layout, status);
  let tree;
  const itemById = id => state.objects.find(item => item.id === id);
  const selected = () => state.selectedIds.map(itemById).filter(Boolean);
  const inherited = (item, key) => {
    const own = key === 'visible' ? !item.visible : item.locked;
    return own || Boolean(item.parent && inherited(itemById(item.parent), key));
  };
  const notify = message => { status.textContent = message; announce(message); onChange(state); };
  const reveal = ids => { for (const id of ids) { let item = itemById(id); while (item?.parent) { if (!state.expanded.includes(item.parent)) state.expanded.push(item.parent); item = itemById(item.parent); } } };
  function choose(ids, focusCanvas = false) {
    state.selectedIds = ids; state.selected = ids.at(-1) || null; reveal(ids);
    refreshTree(); renderPreview(); renderInspector();
    if (focusCanvas && state.selected) preview.querySelector('[data-object="' + state.selected + '"]')?.focus();
    notify(ids.length + ' valgt.');
  }
  function treeItems(parent) {
    return state.objects.filter(item => item.parent === parent).map(item => ({
      id: item.id, label: item.label, meta: inherited(item, 'locked') ? 'Låst' : inherited(item, 'visible') ? 'Skjult' : item.kind === 'group' ? 'Gruppe' : 'Objekt',
      disabled: inherited(item, 'locked') || inherited(item, 'visible'), children: treeItems(item.id),
      actions: item.kind === 'group' ? [
        { id: 'visibility', label: item.visible ? 'Skjul gruppen' : 'Vis gruppen', icon: item.visible ? '◉' : '○', pressed: item.visible },
        { id: 'lock', label: item.locked ? 'Lås gruppen op' : 'Lås gruppen', icon: item.locked ? '▣' : '◇', pressed: item.locked },
      ] : [],
    }));
  }
  function treeOptions() {
    const expanded = new Set(state.expanded), term = state.query.trim().toLocaleLowerCase('da');
    const matching = nodes => nodes.flatMap(item => {
      if (item.label.toLocaleLowerCase('da').includes(term)) return [item];
      const children = matching(item.children); if (!children.length) return [];
      expanded.add(item.id); return [{ ...item, children }];
    });
    const all = treeItems(undefined), items = term ? matching(all) : all;
    return { items, selectedIds: state.selectedIds, expandedIds: [...expanded], multiSelect: true,
      onSelect: ids => choose(ids),
      onToggle: (id, open) => { state.expanded = open ? [...new Set([...state.expanded, id])] : state.expanded.filter(value => value !== id); refreshTree(); onChange(state); },
      onAction: (id, action) => {
        const item = itemById(id); if (action === 'lock') item.locked = !item.locked; else if (action === 'visibility') item.visible = !item.visible;
        refreshTree(); renderPreview(); renderInspector(); notify(item.label + ': ' + (action === 'lock' ? item.locked ? 'låst.' : 'låst op.' : item.visible ? 'vist.' : 'skjult.'));
      },
    };
  }
  function refreshTree() { const options = treeOptions(); tree.update(options); summary.textContent = state.selectedIds.length + ' valgt' + (!options.items.length ? ' · Ingen søgeresultater' : ''); }
  function renderPreview() {
    const nodes = state.objects.filter(item => !inherited(item, 'visible')).map(item => {
      const node = c('button', { text: 'Vælg ' + item.label, variant: state.selectedIds.includes(item.id) ? 'primary' : 'tertiary', disabled: inherited(item, 'locked'), attrs: { 'data-object': item.id, 'aria-pressed': String(state.selectedIds.includes(item.id)) } });
      node.addEventListener('click', event => {
        const ids = event.ctrlKey || event.metaKey ? state.selectedIds.includes(item.id) ? state.selectedIds.filter(id => id !== item.id) : [...state.selectedIds, item.id] : [item.id]; choose(ids, true);
      });
      const tile = card(item.label, compact(c('text', { text: item.kind === 'group' ? 'Gruppe' : 'Objekt', variant: 'small' }), c('text', { text: 'Bredde: ' + item.width, variant: 'secondary' }), node));
      tile.className += ' composition-object-preview';
      return tile;
    });
    const note = c('text', { text: 'Objekterne er vist som kort. I produktet kan arbejdsområdet være en scene, et dokument eller en anden visning.', variant: 'small' });
    note.className += ' composition-workspace-note';
    preview.replaceChildren(...nodes, note);
  }
  function disclosure(key, title, ...children) {
    const details = el('details'); details.open = state.folds[key] ?? true;
    const label = el('summary'); label.textContent = title;
    const body = c('stack', { variant: 'disclosure-body' }); body.replaceChildren(...children); details.append(label, body);
    details.addEventListener('toggle', () => { state.folds[key] = details.open; }); return details;
  }
  function renderInspector(errors = {}) {
    const selection = selected(), single = selection.length === 1 ? selection[0] : null;
    const locked = selection.some(item => inherited(item, 'locked'));
    const title = single ? single.label : selection.length ? selection.length + ' objekter valgt' : 'Intet valgt';
    const path = single ? [single.parent ? itemById(single.parent).label : 'Dokument', single.kind === 'group' ? 'Gruppe' : 'Objekt'].join(' / ') : 'Fælles egenskaber for udvalget';
    const inspector = c('inspector', { slots: { header: title, description: path } });
    inspector.lastElementChild.remove(); inspector.querySelector('.ds-inspector__section').remove();
    if (!selection.length) { inspector.append(c('instruction-note', { text: 'Vælg et objekt i træet eller arbejdsområdet.' })); inspectorHost.replaceChildren(inspector); return; }
    const key = [...state.selectedIds].sort().join('|');
    const mixedWidth = !selection.every(item => item.width === selection[0].width);
    const draft = state.drafts[key] ||= { name: single?.label || '', width: mixedWidth ? '' : String(selection[0].width), mixedWidth };
    const form = el('form'); form.noValidate = true;
    const name = single ? field('object-name', 'Navn', draft.name, { disabled: locked, error: errors.name || '' }) : null;
    const width = field('object-width', 'Bredde', draft.width, { type: 'number', min: '0', step: 'any', disabled: locked, placeholder: draft.mixedWidth ? 'Forskellige værdier' : '', hint: draft.mixedWidth ? 'Tomt felt bevarer de enkelte mål. En ny værdi gælder hele udvalget.' : 'Et positivt mål i eksemplets enheder.', error: errors.width || '' });
    const apply = button('Anvend', 'apply-properties', { disabled: locked, attrs: { type: 'submit', 'data-action': 'apply-properties' } });
    name?.querySelector('input').addEventListener('input', event => { draft.name = event.target.value; });
    width.querySelector('input').addEventListener('input', event => { draft.width = event.target.value; });
    form.append(compact(...(name ? [name] : []), disclosure('dimensions', 'Mål', width), apply));
    form.addEventListener('submit', event => {
      event.preventDefault(); if (locked) return;
      const invalid = {}, hasWidth = Boolean(draft.width.trim());
      if (single && !draft.name.trim()) invalid.name = 'Giv objektet et navn.';
      if ((!hasWidth && !draft.mixedWidth) || (hasWidth && (!Number.isFinite(Number(draft.width)) || Number(draft.width) <= 0))) invalid.width = 'Bredden skal være større end nul.';
      if (Object.keys(invalid).length) { if (invalid.width) state.folds.dimensions = true; renderInspector(invalid); inspectorHost.querySelector('[aria-invalid="true"]')?.focus(); notify('Ret de markerede egenskaber.'); return; }
      for (const item of selection) { if (hasWidth) item.width = Number(draft.width); if (single) item.label = draft.name.trim(); }
      for (const draftKey of Object.keys(state.drafts)) if (draftKey.split('|').some(id => state.selectedIds.includes(id))) delete state.drafts[draftKey];
      refreshTree(); renderPreview(); renderInspector(); inspectorHost.querySelector('[data-action="apply-properties"]').focus(); notify('Egenskaberne er opdateret i eksemplet.');
    });
    const propertyContent = stack(...(locked ? [c('instruction-note', { text: 'Udvalget indeholder låste objekter. Lås gruppen op i træet for at redigere.' })] : []), form);
    const parents = [...new Set(selection.map(item => item.parent ? itemById(item.parent).label : 'Uden gruppe'))];
    const relations = compact(c('heading', { text: 'Gruppemedlemskab', variant: 'panel' }), c('text', { text: parents.join(' · ') }), c('text', { text: 'Træet viser ejerskab. Flytning sker gennem Handlinger og har et klikbart alternativ til træk.', variant: 'small' }));
    const moveAllowed = !locked && selection.every(item => item.kind !== 'group');
    const parentIds = [...new Set(selection.map(item => item.parent || ''))];
    const target = field('move-target', 'Flyt til gruppe', parentIds.length === 1 ? parentIds[0] : '__mixed__', {
      disabled: !moveAllowed,
      slots: { control: { tag: 'select', children: [
        ...(parentIds.length > 1 ? [{ tag: 'option', attrs: { value: '__mixed__', disabled: true }, text: 'Forskellige grupper' }] : []),
        { tag: 'option', attrs: { value: '' }, text: 'Uden gruppe' },
        ...state.objects.filter(item => item.kind === 'group' && !item.locked).map(item => ({ tag: 'option', attrs: { value: item.id }, text: item.label })),
      ] } },
    });
    const move = button('Flyt til', 'move-objects', { disabled: !moveAllowed || parentIds.length > 1 });
    target.querySelector('select').addEventListener('change', () => { move.disabled = !moveAllowed || target.querySelector('select').value === '__mixed__'; });
    move.addEventListener('click', () => {
      const groupId = target.querySelector('select').value;
      if (!moveAllowed || groupId === '__mixed__' || (groupId && itemById(groupId)?.locked)) return;
      for (const item of selection) { if (groupId) item.parent = groupId; else delete item.parent; }
      reveal(state.selectedIds); refreshTree(); renderPreview(); renderInspector(); inspectorHost.querySelector('[data-tab="actions"]').focus(); notify('Udvalget er flyttet.');
    });
    const actions = compact(c('text', { text: 'Handlinger gælder udvalget. Gruppevalg og låste objekter kan ikke flyttes her.', variant: 'small' }), target, move);
    const tabs = c('segmented-control', { variant: 'wrap' }); tabs.replaceChildren(); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Objektoplysninger');
    const sections = [['properties', 'Egenskaber', propertyContent], ['relations', 'Relationer', relations], ['actions', 'Handlinger', actions]];
    const panels = [], tabNodes = [];
    function activate(id, focus = false) {
      state.tab = id;
      sections.forEach(([value], index) => { const active = value === id; tabNodes[index].setAttribute('aria-selected', String(active)); tabNodes[index].setAttribute('tabindex', active ? '0' : '-1'); tabNodes[index].setAttribute('data-state', active ? 'selected' : 'idle'); panels[index].hidden = !active; });
      if (focus) tabNodes[sections.findIndex(([value]) => value === id)].focus();
    }
    for (const [id, label, content] of sections) {
      const tab = c('segmented-option', { text: label, variant: 'desktop', attrs: { role: 'tab', id: prefix + '-tab-' + id, 'aria-controls': prefix + '-panel-' + id, 'data-tab': id } });
      tab.removeAttribute('aria-pressed');
      const panel = el('div', 'composition-tab-panel'); panel.setAttribute('role', 'tabpanel'); panel.setAttribute('id', prefix + '-panel-' + id); panel.setAttribute('aria-labelledby', prefix + '-tab-' + id);
      panel.append(scroll(content, label, 'composition-inspector-scroll'));
      tab.addEventListener('click', () => activate(id));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); const current = sections.findIndex(([value]) => value === id);
        activate(sections[event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3][0], true);
      });
      tabNodes.push(tab); panels.push(panel); tabs.append(tab);
    }
    activate(state.tab); inspector.append(tabs, ...panels); inspectorHost.replaceChildren(inspector);
  }
  const onSearch = event => { state.query = event.target.value; refreshTree(); };
  search.querySelector('input').addEventListener('input', onSearch);
  tree = mountTree(theme, treeHost, { ...treeOptions(), label: 'Objekter', idPrefix: prefix + '-tree' }, { document });
  refreshTree(); renderPreview(); renderInspector();
  return { element: root, state, destroy() { search.querySelector('input').removeEventListener('input', onSearch); tree.destroy(); root.remove(); } };
}
