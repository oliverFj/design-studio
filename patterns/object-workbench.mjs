import { createComponentFactory, createLayout, createIcon, mountTree, mountTabs } from '../core/components.mjs';

// Adapted from FormLab's object-panel.js and inspector in ui.js (2026-10-27).
// The model is deliberately generic; geometry and application commands stay in the product.
export function createObjectWorkbenchState() {
  return {
    selected: 'panel', selectedIds: ['panel'], expanded: ['collection', 'panel'], query: '', tab: 'properties', folds: {}, drafts: {},
    objects: [
      { id: 'collection', kind: 'group', label: 'Hovedkomposition', visible: true, locked: false },
      { id: 'panel', groupId: 'collection', kind: 'object', label: 'Hovedflade', width: 8, visible: true, locked: false },
      { id: 'detail', parent: 'panel', kind: 'object', label: 'Detalje', width: 3, visible: true, locked: false },
      { id: 'archive', kind: 'group', label: 'Alternativer', visible: true, locked: false },
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
    const heading = typeof title === 'string' ? { text: title } : { slots: { root: title } };
    const node = c('card', { slots: { header: { component: 'heading', options: { ...heading, variant: 'panel' } }, body: [], footer: '' } });
    node.querySelector('.ds-card__body').replaceChildren(...children); node.querySelector('.ds-card__footer').remove(); return node;
  };
  const scroll = (content, label, className) => {
    const area = c('scroll-area', { variant: 'body', slots: { content: '' } });
    area.className += ' ' + className;
    area.querySelector('.ds-scroll-area__viewport').setAttribute('aria-label', label);
    area.querySelector('.ds-scroll-area__content').append(content); return area;
  };
  const root = createLayout('workspace', { document }); root.className += ' ds-composition ds-scope composition-object-studio'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Objekteditor inspireret af FormLab');
  const layout = el('div', 'composition-object-editor'), dock = el('aside', 'composition-object-dock'); dock.setAttribute('aria-label', 'Objekter og egenskaber');
  dock.className += ' ds-layout'; dock.setAttribute('data-layout', 'panel');
  const preview = el('div', 'composition-workspace'), treeHost = el('div');
  const summary = c('text', { text: '', variant: 'small', attrs: { role: 'status' } });
  const search = field('object-search', 'Find objekt', state.query, { type: 'search', placeholder: 'Navn på objekt eller gruppe', hint: 'Søgning bevarer matchende objekters placering i hierarkiet.' });
  const inspectorHost = el('section', 'composition-properties'); inspectorHost.setAttribute('aria-label', 'Udvalgets egenskaber');
  const treeEmpty = c('instruction-note', { text: 'Ingen objekter matcher. Prøv et andet navn.' });
  const collectionPanel = card('Objekter', stack(search, summary, scroll(treeHost, 'Objekter', 'composition-tree-scroll'), treeEmpty));
  collectionPanel.className += ' composition-object-collection'; dock.append(collectionPanel, inspectorHost);
  const workspace = el('section', 'composition-workbench'); workspace.setAttribute('aria-labelledby', prefix + '-workspace-title');
  const workspaceHeader = el('div', 'composition-workbench-header');
  const selectionSummary = c('text', { text: '', variant: 'small' });
  const showProperties = button('Gå til egenskaber', 'show-properties', { variant: 'ghost' });
  showProperties.addEventListener('click', () => inspectorHost.querySelector('[data-tab="' + state.tab + '"]')?.focus());
  workspaceHeader.append(stack(c('heading', { text: 'Arbejdsområde', variant: 'panel', attrs: { id: prefix + '-workspace-title' } }), selectionSummary), showProperties);
  workspace.append(workspaceHeader, preview, c('text', { text: 'Rammer viser, hvad der ligger inde i hvad. Samlinger organiserer objekterne. Ctrl/⌘-klik tilføjer eller fjerner fra udvalget.', variant: 'small' }));
  layout.append(workspace, dock);
  const status = c('text', { text: 'Ctrl/⌘-klik eller Shift i træet vælger flere. Gruppehandlinger ændrer ikke valget.', variant: 'small', attrs: { role: 'status', 'aria-live': 'polite' } });
  root.append(stack(c('heading', { text: 'Objekter i sammenhæng', variant: 'subtitle' }), c('text', { text: 'Vælg i arbejdsfladen eller hierarkiet. Redigér ejeren og dens indhold, og flyt hele objekter mellem samlinger.', variant: 'secondary' })), layout, status);
  let tree, inspectorTabs;
  const itemById = id => state.objects.find(item => item.id === id);
  const selected = () => state.selectedIds.map(itemById).filter(Boolean);
  // parent is ownership; groupId is organization. Legacy group parents remain readable.
  const ownerOf = item => { const parent = itemById(item.parent); return parent?.kind === 'object' ? parent : null; };
  const groupOf = item => { const owner = ownerOf(item); return owner ? groupOf(owner) : itemById(item.groupId ?? item.parent); };
  const displayParent = item => ownerOf(item) ?? (item.kind === 'group' ? null : groupOf(item));
  const inherited = (item, key) => {
    const own = key === 'visible' ? !item.visible : item.locked;
    const parent = displayParent(item); return own || Boolean(parent && inherited(parent, key));
  };
  const notify = message => { status.textContent = message; announce(message); onChange(state); };
  const reveal = ids => { for (const id of ids) { let parent = displayParent(itemById(id)); while (parent) { if (!state.expanded.includes(parent.id)) state.expanded.push(parent.id); parent = displayParent(parent); } } };
  function choose(ids, focusCanvas = false, focusId = ids.at(-1)) {
    state.selectedIds = ids; state.selected = ids.at(-1) || null; reveal(ids);
    refreshTree(); renderPreview(); renderInspector();
    if (focusCanvas && focusId) preview.querySelector('[data-object="' + focusId + '"]')?.focus();
    notify(ids.length + ' valgt.');
  }
  function treeItems(parent) {
    return state.objects.filter(item => (displayParent(item)?.id) === parent).map(item => ({
      id: item.id, label: item.label, meta: inherited(item, 'locked') ? 'Låst' : inherited(item, 'visible') ? 'Skjult' : item.kind === 'group' ? '' : 'Objekt',
      disabled: inherited(item, 'locked') || inherited(item, 'visible'), children: treeItems(item.id),
      actions: [
        { id: 'visibility', label: item.visible ? 'Skjul ' + item.label : 'Vis ' + item.label, iconName: item.visible ? 'eye' : 'eye-off', pressed: item.visible },
        { id: 'lock', label: item.locked ? 'Lås ' + item.label + ' op' : 'Lås ' + item.label, iconName: item.locked ? 'lock' : 'lock-open', pressed: item.locked },
      ],
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
  function refreshTree() {
    const options = treeOptions(); tree.update(options);
    summary.textContent = state.objects.length + ' objekter · ' + state.selectedIds.length + ' valgt' + (!options.items.length ? ' · Ingen søgeresultater' : '');
    treeEmpty.hidden = Boolean(options.items.length);
  }
  function renderPreview() {
    const visible = state.objects.filter(item => !inherited(item, 'visible'));
    selectionSummary.textContent = visible.filter(item => item.kind === 'object').length + ' synlige objekter · ' + state.selectedIds.length + ' valgt';
    showProperties.disabled = !state.selectedIds.length;
    const selectionControl = item => {
      const chosen = state.selectedIds.includes(item.id), locked = inherited(item, 'locked');
      const markerId = prefix + '-object-status-' + state.objects.indexOf(item);
      // A native hit button is a sibling of the visible content and nested objects.
      // CSS stretches it over this region while child regions retain their own layer.
      const node = button('', 'select-object', { variant: 'ghost', disabled: locked, attrs: { 'data-object': item.id, 'aria-label': 'Vælg ' + item.label, 'aria-describedby': markerId } });
      node.className += ' composition-scene-hit';
      node.addEventListener('click', event => {
        event.stopPropagation();
        if (locked) return;
        const ids = event.ctrlKey || event.metaKey ? state.selectedIds.includes(item.id) ? state.selectedIds.filter(id => id !== item.id) : [...state.selectedIds, item.id] : [item.id]; choose(ids, true, item.id);
      });
      const marker = c('badge', { text: chosen ? 'Valgt' : locked ? 'Låst' : 'Ikke valgt', variant: chosen ? 'data' : 'neutral', attrs: { id: markerId } });
      return { node, marker, chosen, locked };
    };
    const sceneWidth = Math.max(12, ...visible.filter(item => item.kind === 'object' && !ownerOf(item)).map(item => item.width));
    const drawObject = (item, depth = 0) => {
      const { node, marker, chosen, locked } = selectionControl(item), owner = ownerOf(item);
      const titleId = prefix + '-scene-title-' + state.objects.indexOf(item);
      const region = el('section', 'composition-scene-object'); region.setAttribute('aria-labelledby', titleId);
      region.setAttribute('data-scene-object', item.id); region.setAttribute('data-selected', String(chosen));
      region.setAttribute('data-locked', String(locked));
      if (owner) region.setAttribute('data-owner', owner.id);
      region.style.width = Math.min(100, item.width / (owner?.width ?? sceneWidth) * 100) + '%';
      const header = el('div', 'composition-scene-object-header');
      const heading = c('heading', { variant: 'panel', attrs: { id: titleId }, slots: { root: { tag: 'h' + Math.min(6, 4 + depth), text: item.label } } });
      header.append(heading, c('text', { text: item.width + ' enheder', variant: 'small' }));
      const controls = el('div', 'composition-scene-object-controls'); controls.append(marker);
      region.append(node, header, controls);
      if (locked) region.append(c('text', { text: item.locked ? 'Låst' : 'Låst gennem ejer eller samling', variant: 'small' }));
      const children = visible.filter(child => ownerOf(child)?.id === item.id);
      if (children.length) { const content = el('div', 'composition-scene-children'); content.append(...children.map(child => drawObject(child, depth + 1))); region.append(content); }
      return region;
    };
    const sections = [];
    const groups = visible.filter(item => item.kind === 'group');
    const loose = visible.filter(item => item.kind === 'object' && !ownerOf(item) && !groupOf(item));
    for (const group of [...groups, ...(loose.length ? [null] : [])]) {
      const items = visible.filter(item => item.kind === 'object' && !ownerOf(item) && (groupOf(item)?.id ?? null) === (group?.id ?? null));
      const section = el('section', 'composition-object-group');
      const titleId = prefix + '-group-' + (group ? state.objects.indexOf(group) : 'loose'); section.setAttribute('aria-labelledby', titleId);
      if (group) section.setAttribute('data-scene-group', group.id);
      const header = el('div', 'composition-scene-group-header');
      header.append(createIcon('folder', { size: 'small' }, { document }), c('heading', { variant: 'section', attrs: { id: titleId }, slots: { root: { tag: 'h3', text: group?.label ?? 'Uden samling' } } }));
      if (group) { const { node, marker, chosen, locked } = selectionControl(group); section.setAttribute('data-selected', String(chosen)); section.setAttribute('data-locked', String(locked)); section.append(node); header.append(marker); }
      const surface = el('div', 'composition-scene-surface');
      surface.append(...(items.length ? items.map(item => drawObject(item)) : [c('text', { text: 'Samlingen er tom. Flyt et helt objekt hertil via Handlinger.', variant: 'small' })]));
      section.append(header, surface); sections.push(section);
    }
    preview.replaceChildren(...(sections.length ? sections : [c('empty-state', { title: 'Ingen synlige objekter', body: 'Vis en samling eller et objekt i træet for at arbejde videre.' })]));
  }
  function disclosure(key, title, ...children) {
    const details = el('details', 'composition-object-disclosure'); details.open = state.folds[key] ?? true;
    const label = el('summary'); label.textContent = title;
    const body = c('stack', { variant: 'disclosure-body' }); body.replaceChildren(...children); details.append(label, body);
    details.addEventListener('toggle', () => { state.folds[key] = details.open; }); return details;
  }
  function renderInspector() {
    inspectorTabs?.destroy(); inspectorTabs=null;
    const selection = selected(), single = selection.length === 1 ? selection[0] : null;
    const locked = selection.some(item => inherited(item, 'locked'));
    const title = single ? single.label : selection.length ? selection.length + ' objekter valgt' : 'Intet valgt';
    const ancestors = []; if (single) { let parent = displayParent(single); while (parent) { ancestors.unshift(parent.label); parent = displayParent(parent); } }
    const path = single ? [...ancestors, single.kind === 'group' ? 'Samling' : 'Objekt'].join(' / ') : 'Fælles egenskaber for udvalget';
    const inspector = c('inspector', { slots: { header: title, description: path } });
    inspector.lastElementChild.remove(); inspector.querySelector('.ds-inspector__section').remove();
    if (!selection.length) { inspector.append(c('instruction-note', { text: 'Vælg et objekt i træet eller arbejdsområdet.' })); inspectorHost.replaceChildren(inspector); return; }
    const key = [...state.selectedIds].sort().join('|');
    const hasDimensions = selection.every(item => item.kind === 'object');
    const mixedWidth = hasDimensions && !selection.every(item => item.width === selection[0].width);
    const modelWidth = hasDimensions ? mixedWidth ? '' : String(selection[0].width) : '';
    const draft = state.drafts[key] ||= { name: single?.label || '', width: modelWidth, mixedWidth };
    const errors = draft.errors ?? {};
    const propertyStatus = c('text', { text: '', variant: 'small', attrs: { role: 'status', 'data-property-status': '' } });
    const updatePropertyStatus = () => {
      const dirty = (single && draft.name !== single.label) || (hasDimensions && draft.width !== modelWidth);
      const message = locked ? 'Låst udvalg · egenskaberne kan læses.' : Object.keys(errors).length ? 'Ret de markerede felter før anvendelse.' : dirty ? 'Kladde · ændringerne er ikke anvendt.' : draft.applied ? 'Anvendt på udvalget i eksemplet.' : 'Ingen ændringer · klar til redigering.';
      propertyStatus.textContent = message; propertyStatus.setAttribute('data-property-state', locked ? 'locked' : Object.keys(errors).length ? 'invalid' : dirty ? 'draft' : draft.applied ? 'applied' : 'clean');
    };
    updatePropertyStatus();
    const form = el('form'); form.noValidate = true;
    const name = single ? field('object-name', 'Navn', draft.name, { disabled: locked, error: errors.name || '' }) : null;
    const width = hasDimensions ? field('object-width', 'Bredde', draft.width, { type: 'number', min: '0', step: 'any', disabled: locked, placeholder: draft.mixedWidth ? 'Forskellige værdier' : '', hint: draft.mixedWidth ? 'Tomt felt bevarer de enkelte mål. En ny værdi gælder hele udvalget; indholdet skal fortsat kunne være hos ejeren.' : single && ownerOf(single) ? 'Kan højst være ' + ownerOf(single).width + ' enheder, så objektet bliver inden for ' + ownerOf(single).label + '.' : 'Et positivt mål. Indlejrede objekter skal fortsat kunne være i rammen.', error: errors.width || '' }) : null;
    const apply = button('Anvend ændringer', 'apply-properties', { variant: 'primary', disabled: locked, attrs: { type: 'submit', 'data-action': 'apply-properties' } });
    const reset = button('Kassér kladde', 'reset-properties', { variant: 'ghost', disabled: locked });
    reset.addEventListener('click', () => {
      if (locked) return;
      delete state.drafts[key]; renderInspector(); inspectorHost.querySelector('[data-action="reset-properties"]').focus(); notify('Kladden er kasseret. Objektets anvendte egenskaber er bevaret.');
    });
    name?.querySelector('input').addEventListener('input', event => { draft.name = event.target.value; updatePropertyStatus(); onChange(state); });
    width?.querySelector('input').addEventListener('input', event => { draft.width = event.target.value; updatePropertyStatus(); onChange(state); });
    const formActions = el('div', 'composition-object-apply'); formActions.append(apply, reset);
    form.append(compact(...(name ? [name] : []), ...(width ? [disclosure('dimensions', 'Mål', width)] : [c('instruction-note', { text: 'Samlinger organiserer selvstændige objekter. De har ingen fysisk bredde og ændrer ikke objekternes ejerskab.' })]), propertyStatus, formActions));
    form.addEventListener('submit', event => {
      event.preventDefault(); if (locked) return;
      const invalid = {}, hasWidth = hasDimensions && Boolean(draft.width.trim());
      if (single && !draft.name.trim()) invalid.name = 'Giv objektet et navn.';
      if (hasDimensions && ((!hasWidth && !draft.mixedWidth) || (hasWidth && (!Number.isFinite(Number(draft.width)) || Number(draft.width) <= 0)))) invalid.width = 'Bredden skal være større end nul.';
      if (hasWidth && !invalid.width) {
        const affected = new Set(state.selectedIds), candidateWidth = item => affected.has(item.id) ? Number(draft.width) : item.width;
        for (const item of state.objects) {
          const owner = ownerOf(item);
          if (owner && (affected.has(item.id) || affected.has(owner.id)) && candidateWidth(item) > candidateWidth(owner)) { invalid.width = item.label + ' skal kunne være inden for ' + owner.label + '. Justér udvalget eller bredden.'; break; }
        }
      }
      if (Object.keys(invalid).length) { draft.errors = invalid; if (invalid.width) state.folds.dimensions = true; state.tab = 'properties'; renderInspector(); inspectorHost.querySelector('[aria-invalid="true"]')?.focus(); notify('Ret de markerede egenskaber.'); return; }
      for (const item of selection) { if (hasWidth) item.width = Number(draft.width); if (single) item.label = draft.name.trim(); }
      for (const draftKey of Object.keys(state.drafts)) if (draftKey.split('|').some(id => state.selectedIds.includes(id))) delete state.drafts[draftKey];
      state.drafts[key] = { name: single?.label || '', width: hasDimensions && selection.every(item => item.width === selection[0].width) ? String(selection[0].width) : '', mixedWidth: hasDimensions && !selection.every(item => item.width === selection[0].width), applied: true };
      refreshTree(); renderPreview(); renderInspector(); inspectorHost.querySelector('[data-action="apply-properties"]').focus(); notify('Egenskaberne er opdateret i eksemplet.');
    });
    const propertyContent = stack(...(locked ? [c('instruction-note', { text: 'Udvalget er låst direkte eller gennem sin ejer eller samling. Lås det op i træet for at redigere.' })] : []), form);
    const parents = [...new Set(selection.map(item => ownerOf(item)?.label ?? (item.kind === 'group' ? 'Organisatorisk samling' : 'Selvstændigt objekt')))];
    const memberships = [...new Set(selection.filter(item => item.kind !== 'group').map(item => groupOf(item)?.label ?? 'Uden samling'))];
    const relations = compact(c('heading', { text: 'Ejerskab', variant: 'panel' }), c('text', { text: parents.join(' · ') }), c('heading', { text: 'Samling', variant: 'panel' }), c('text', { text: memberships.join(' · ') || 'Samlingen organiserer objekter.' }), c('text', { text: 'Et barn bliver hos sin ejer. Samlingsflytning organiserer hele objektet med indhold og ændrer ikke deres mål.', variant: 'small' }));
    const selectedAncestor = item => { let owner = ownerOf(item); while (owner) { if (state.selectedIds.includes(owner.id)) return true; owner = ownerOf(owner); } return false; };
    const moveRoots = selection.filter(item => item.kind === 'object' && !ownerOf(item));
    const movesLockedContent = state.objects.some(item => inherited(item, 'locked') && selectedAncestor(item));
    const moveAllowed = !locked && !movesLockedContent && moveRoots.length > 0 && selection.every(item => item.kind === 'object' && (!ownerOf(item) || selectedAncestor(item)));
    const parentIds = [...new Set((moveRoots.length ? moveRoots : selection).map(item => groupOf(item)?.id || ''))];
    const target = field('move-target', 'Flyt til samling', parentIds.length === 1 ? parentIds[0] : '__mixed__', {
      disabled: !moveAllowed,
      slots: { control: { tag: 'select', children: [
        ...(parentIds.length > 1 ? [{ tag: 'option', attrs: { value: '__mixed__', disabled: true }, text: 'Forskellige grupper' }] : []),
        { tag: 'option', attrs: { value: '' }, text: 'Uden gruppe' },
        ...state.objects.filter(item => item.kind === 'group' && !inherited(item, 'locked') && !inherited(item, 'visible')).map(item => ({ tag: 'option', attrs: { value: item.id }, text: item.label })),
      ] } },
    });
    const move = button('Flyt til', 'move-objects', { disabled: !moveAllowed || parentIds.length > 1 });
    target.querySelector('select').addEventListener('change', () => { move.disabled = !moveAllowed || target.querySelector('select').value === '__mixed__'; });
    move.addEventListener('click', () => {
      const groupId = target.querySelector('select').value;
      const destination = itemById(groupId);
      if (!moveAllowed || groupId === '__mixed__' || (groupId && (destination?.kind !== 'group' || inherited(destination, 'locked') || inherited(destination, 'visible')))) return;
      for (const item of moveRoots) { if (item.parent && !ownerOf(item)) delete item.parent; if (groupId) item.groupId = groupId; else delete item.groupId; }
      reveal(state.selectedIds); refreshTree(); renderPreview(); renderInspector(); inspectorHost.querySelector('[data-tab="actions"]').focus(); notify('Udvalget er flyttet.');
    });
    const actions = compact(c('text', { text: moveAllowed ? 'Flyt hele objektet med dets indhold. Ejerskab og bredder bevares.' : 'Vælg et selvstændigt objekt for at flytte det med indholdet. Samlinger, børn alene og objekter med låst indhold kan ikke flyttes her.', variant: 'small' }), target, move);
    const tabs = c('segmented-control', { variant: 'wrap' }); tabs.replaceChildren(); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Objektoplysninger');
    const sections = [['properties', 'Egenskaber', propertyContent], ['relations', 'Relationer', relations], ['actions', 'Handlinger', actions]];
    const panels = [];
    for (const [id, label, content] of sections) {
      const tab = c('segmented-option', { text: label, variant: 'desktop', attrs: { role: 'tab', id: prefix + '-tab-' + id, 'aria-controls': prefix + '-panel-' + id, 'data-tab': id, 'data-tab-id':id } });
      tab.removeAttribute('aria-pressed');
      const panel = el('div', 'composition-tab-panel'); panel.setAttribute('role', 'tabpanel'); panel.setAttribute('id', prefix + '-panel-' + id); panel.setAttribute('aria-labelledby', prefix + '-tab-' + id);panel.setAttribute('tabindex','0');
      panel.append(scroll(content, label, 'composition-inspector-scroll'));
      panels.push(panel); tabs.append(tab);
    }
    inspector.append(tabs, ...panels); inspectorHost.replaceChildren(inspector);
    inspectorTabs=mountTabs(inspector,{selectedId:state.tab,onChange(id){state.tab=id;}});
  }
  const onSearch = event => { state.query = event.target.value; refreshTree(); onChange(state); };
  search.querySelector('input').addEventListener('input', onSearch);
  tree = mountTree(theme, treeHost, { ...treeOptions(), label: 'Objekter', idPrefix: prefix + '-tree' }, { document });
  refreshTree(); renderPreview(); renderInspector();
  return { element: root, state, destroy() { search.querySelector('input').removeEventListener('input', onSearch); inspectorTabs?.destroy();tree.destroy(); root.remove(); } };
}
