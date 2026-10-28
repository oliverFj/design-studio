import { createComponentFactory, createLayout } from '../../core/components.mjs';
import { mountPanelControls } from '../../core/panels.mjs';
import { createWorkspaceState, PROJECT_STATUSES, projectDraft, validateProjectDraft } from './data.mjs';

const dateLabel = value => new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
const tabs = [['overview', 'Overblik'], ['tasks', 'Opgaver'], ['settings', 'Indstillinger']];

/** A small product composition. The shared library owns every control and its anatomy. */
export function mountWorkspace(theme, { document = globalThis.document, state = createWorkspaceState(), onChange = () => {}, announce = () => {} } = {}) {
  state.drafts = Object.assign(Object.create(null), state.drafts);
  state.panel ??= { open: true, width: 420 };
  const c = createComponentFactory(theme, { document });
  const el = (tag, className = '') => { const node = document.createElement(tag); if (className) node.className = className; return node; };
  const heading = (text, level = 2, variant = 'panel', attrs = {}) => c('heading', { variant, slots: { root: { tag: 'h' + level, text } }, attrs });
  const text = (copy, variant = 'secondary') => c('text', { text: copy, variant });
  const stack = (nodes, variant = 'compact') => { const node = c('stack', { variant }); node.replaceChildren(...nodes); return node; };
  const button = (copy, action, variant = 'desktop') => c('button', { text: copy, variant, attrs: { 'data-action': action } });
  const card = (title, content, { level = 2, className = '' } = {}) => {
    const node = c('card', { slots: { header: { tag: 'h' + level, text: title }, body: { tag: 'div' }, footer: '' } });
    node.className += className ? ' ' + className : '';
    node.querySelector('.ds-card__body').append(content); node.querySelector('.ds-card__footer').remove(); return node;
  };
  const root = createLayout('workspace', { document }); root.className += ' workspace ds-scope'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Arbejdsrum — projektstyring');
  const shell = el('div', 'workspace-shell ds-app-shell'), sidebar = el('aside', 'workspace-sidebar ds-app-navigation'), main = el('div', 'workspace-main ds-app-workspace');
  sidebar.setAttribute('aria-label', 'Projektfiltre og team'); sidebar.setAttribute('tabindex', '0');
  const content = el('main', 'workspace-content ds-app-content'); content.setAttribute('id', 'workspace-main'); content.setAttribute('tabindex', '0'); content.setAttribute('aria-label', 'Projektoversigt og detaljer');
  const brand = stack([heading('Arbejdsrum', 2, 'panel'), text('Design, der bliver til noget.', 'small')]);
  const navigation = el('nav', 'workspace-navigation'); navigation.setAttribute('aria-label', 'Vis projekter');
  const navTitle = heading('Dit overblik', 2, 'section'), navItems = el('div', 'workspace-filter-list');
  navigation.append(navTitle, navItems);
  sidebar.append(brand, navigation, stack([heading('Et lille hold. Fælles retning.', 2, 'section'), text('Freja, Emil og Asta', 'small'), text('Her samler vi projekter, aftaler og det næste, der skal ske.', 'small')]), text('Eksempeldata · ændringer kan hentes som en fil.', 'tiny'));
  const header = el('header', 'workspace-header ds-app-header');
  const titleGroup = stack([text('NORD / DESIGNSTUDIO', 'tiny'), heading('Plads til det næste.', 1, 'title'), text('Hold overblik over projekterne — og tag det næste skridt sammen.', 'small')]);
  const create = button('Nyt projekt', 'new-project', 'primary');
  const togglePanel = button(state.panel.open ? 'Skjul projektdetaljer' : 'Vis projektdetaljer', 'toggle-details');
  const headerActions = el('div', 'workspace-inline-actions'); headerActions.append(togglePanel, create);
  header.append(titleGroup, headerActions);
  const metrics = el('div', 'workspace-metrics'); metrics.setAttribute('aria-label', 'Arbejdsrummet i tal');
  const layout = el('div', 'workspace-projects ds-panel-layout');
  const listStack = stack([], 'default'), listHeader = el('div', 'workspace-list-header');
  const search = c('field', { idPrefix: 'workspace-search', label: 'Find et projekt', value: state.query, type: 'search', placeholder: 'Søg efter projekt, kunde eller ansvarlig', hint: '', controlVariant: 'desktop' });
  const count = text('', 'small');
  listHeader.append(search, count);
  const list = el('ul', 'workspace-project-list');
  listStack.append(listHeader, list);
  const listCard = card('Projekter', listStack, { className: 'workspace-list-card ds-panel-content' });
  listCard.setAttribute('tabindex', '0'); listCard.setAttribute('aria-label', 'Projektliste og søgning');
  const detail = el('section', 'workspace-detail ds-panel-side'); detail.setAttribute('id', 'workspace-detail'); detail.setAttribute('aria-label', 'Det valgte projekt');
  const handle = el('button', 'workspace-panel-resize ds-panel-resize'); handle.setAttribute('type', 'button'); handle.setAttribute('aria-label', 'Justér bredden på projektdetaljer');
  layout.append(listCard, handle, detail);
  const status = text('Vælg et projekt for at se dets aftaler og opgaver.', 'small'); status.className += ' workspace-status ds-app-footer'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  content.append(metrics, layout); main.append(header, content, status); shell.append(sidebar, main); root.append(shell);
  const notify = message => { status.textContent = message; announce(message); };
  const changed = message => { onChange(state); if (message) notify(message); };
  const panels = mountPanelControls({ container: layout, panel: detail, handle, toggle: togglePanel, minimum: 300, maximum: 560, width: state.panel.width, open: state.panel.open, document,
    onChange: value => { state.panel = { open: value.open, width: value.width }; togglePanel.textContent = value.open ? 'Skjul projektdetaljer' : 'Vis projektdetaljer'; },
  });

  function renderNavigation() {
    const active = state.projects.filter(item => item.status !== 'completed').length;
    navItems.replaceChildren(...[['all', 'Alle projekter', state.projects.length], ['active', 'I gang', active], ['completed', 'Afsluttede', state.projects.length - active]].map(([id, label, total]) => {
      const node = c('button', { variant: 'list-item', slots: { heading: label, description: total + (total === 1 ? ' projekt' : ' projekter') }, attrs: { 'data-filter': id, 'aria-pressed': String(state.filter === id) } });
      if (state.filter === id) node.setAttribute('data-state', 'pressed');
      node.addEventListener('click', () => { state.filter = id; render(); navItems.querySelector('[data-filter="' + id + '"]').focus(); notify(label + ' vises. ' + count.textContent + '.'); });
      return node;
    }));
  }
  function renderMetrics() {
    const active = state.projects.filter(item => item.status !== 'completed');
    const unfinished = active.reduce((total, item) => total + item.tasks.filter(task => !task.done).length, 0);
    metrics.replaceChildren(...[['Aktive projekter', active.length], ['Til godkendelse', state.projects.filter(item => item.status === 'review').length], ['Åbne opgaver', unfinished]].map(([label, value]) => c('metric-row', { slots: { label, value: String(value) } })));
  }
  function selectedProject() { return state.projects.find(item => item.id === state.selected); }
  function renderList() {
    const query = state.query.trim().toLocaleLowerCase('da');
    const filtered = state.projects.filter(item => (state.filter === 'all' || (state.filter === 'completed' ? item.status === 'completed' : item.status !== 'completed'))
      && [item.title, item.client, item.owner].join(' ').toLocaleLowerCase('da').includes(query));
    if (!filtered.some(item => item.id === state.selected)) state.selected = filtered[0]?.id ?? null;
    count.textContent = filtered.length + ' af ' + state.projects.length + ' projekter';
    list.replaceChildren(...filtered.map(project => {
      const row = el('li');
      const done = project.tasks.filter(task => task.done).length;
      const node = c('button', { variant: 'list-item', slots: { heading: project.title, description: project.client + ' · ' + PROJECT_STATUSES[project.status] + ' · ' + done + '/' + project.tasks.length + ' opgaver' }, attrs: { 'data-project': project.id, 'aria-current': project.id === state.selected ? 'true' : 'false' } });
      node.addEventListener('click', () => { state.selected = project.id; panels.setOpen(true); renderList(); renderDetail(); list.querySelector('[data-project="' + project.id + '"]').focus(); notify(project.title + ' er valgt.'); });
      row.append(node); return row;
    }));
    if (!filtered.length) {
      const row = el('li'); row.append(c('instruction-note', { text: state.projects.length ? 'Ingen projekter matcher din søgning. Prøv et andet søgeord eller vælg Alle projekter.' : 'Arbejdsrummet er tomt. Opret et projekt for at komme i gang.' })); list.append(row);
    }
  }
  function renderOverview(project, host) {
    const facts = el('dl', 'workspace-facts');
    for (const [label, value] of [['Kunde', project.client], ['Ansvarlig', project.owner], ['Aflevering', dateLabel(project.due)], ['Opgaver', project.tasks.filter(task => task.done).length + ' af ' + project.tasks.length + ' afsluttet']]) {
      const pair = el('div'); const dt = el('dt'), dd = el('dd'); dt.append(text(label, 'small')); dd.append(text(value)); pair.append(dt, dd); facts.append(pair);
    }
    const activity = el('ul', 'workspace-activity');
    for (const entry of project.activity.slice(-3).reverse()) { const item = el('li'); item.append(text(entry, 'small')); activity.append(item); }
    const edit = button('Redigér projekt', 'edit-project');
    edit.addEventListener('click', () => { panels.setOpen(true); state.tab = 'settings'; renderDetail(); detail.querySelector('#workspace-title-control').focus(); });
    host.append(stack([text(project.description), facts, c('divider'), heading('Seneste aktivitet', 3, 'section'), activity, el('div', 'workspace-inline-actions')]));
    host.querySelector('.workspace-inline-actions').append(edit);
  }
  function renderTasks(project, host) {
    const tasks = el('ul', 'workspace-tasks');
    for (const task of project.tasks) {
      const row = el('li');
      const choice = c('checkbox', { label: task.title, checked: task.done });
      const input = choice.querySelector('input'); input.setAttribute('data-task', task.id);
      input.addEventListener('change', event => {
        task.done = event.target.checked;
        renderMetrics(); renderList(); renderDetail(); detail.querySelector('[data-task="' + task.id + '"]')?.focus();
        changed(task.done ? 'Opgaven er afsluttet.' : 'Opgaven er åbnet igen.');
      });
      row.append(choice); tasks.append(row);
    }
    const done = project.tasks.filter(task => task.done).length;
    host.append(stack([text(done + ' af ' + project.tasks.length + ' opgaver er afsluttet.', 'small'), tasks]));
    if (!project.tasks.length) host.append(c('instruction-note', { text: 'Projektet har endnu ingen opgaver.' }));
  }
  function renderSettings(project, host, errors = {}) {
    const draft = state.drafts[project.id] ??= projectDraft(project);
    const form = el('form', 'ds-form-layout'); form.setAttribute('novalidate', '');
    const fields = [];
    const field = (key, label, options = {}) => {
      const node = c('field', { idPrefix: 'workspace-' + key, label, value: draft[key], hint: '', controlVariant: 'desktop', ...options, ...(errors[key] ? { error: errors[key] } : {}) });
      const control = node.querySelector('input') || node.querySelector('select') || node.querySelector('textarea');
      control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', event => { draft[key] = event.target.value; });
      fields.push(node); return node;
    };
    field('title', 'Projektnavn'); field('client', 'Kunde'); field('owner', 'Ansvarlig'); field('due', 'Afleveringsdato', { type: 'date' });
    field('status', 'Status', { slots: { control: { tag: 'select', children: Object.entries(PROJECT_STATUSES).map(([value, label]) => ({ tag: 'option', attrs: { value }, text: label })) } } });
    field('description', 'Kort beskrivelse', { controlVariant: undefined, slots: { control: { tag: 'textarea', attrs: { rows: '4' }, text: draft.description } } });
    const notifications = c('switch', { label: 'Modtag besked om projektets afleveringer', checked: draft.notifications });
    notifications.querySelector('input').addEventListener('change', event => { draft.notifications = event.target.checked; });
    const actions = el('div', 'workspace-inline-actions ds-form-actions');
    const save = button('Gem ændringer', 'save-project', 'primary'); save.setAttribute('type', 'submit');
    const reset = button('Fortryd ændringer', 'reset-project');
    actions.append(save, reset);
    const formFields = stack([...fields, notifications], 'default'); formFields.className += ' ds-form-fields'; formFields.setAttribute('tabindex', '0'); formFields.setAttribute('aria-label', 'Projektets indstillinger');
    form.append(formFields, actions);
    form.addEventListener('submit', event => {
      event.preventDefault(); const invalid = validateProjectDraft(draft);
      if (Object.keys(invalid).length) { renderDetail(invalid); detail.querySelector('[aria-invalid="true"]')?.focus(); notify('Ret de markerede felter.'); return; }
      for (const key of Object.keys(draft)) project[key] = typeof draft[key] === 'string' ? draft[key].trim() : draft[key];
      state.drafts[project.id] = projectDraft(project);
      project.activity.push('Projektets oplysninger er opdateret.'); project.activity = project.activity.slice(-50);
      // A saved status may move the project out of the current filter. Keep it visible.
      if ((state.filter === 'active' && project.status === 'completed') || (state.filter === 'completed' && project.status !== 'completed')) state.filter = 'all';
      if (state.query && ![project.title, project.client, project.owner].join(' ').toLocaleLowerCase('da').includes(state.query.trim().toLocaleLowerCase('da'))) {
        state.query = ''; search.querySelector('input').value = '';
      }
      render(); detail.querySelector('[data-action="save-project"]')?.focus(); changed('Projektet er opdateret. Hent arbejdsrummet for at gemme det som en fil.');
    });
    reset.addEventListener('click', () => { state.drafts[project.id] = projectDraft(project); renderDetail(); detail.querySelector('[data-action="reset-project"]').focus(); notify('Projektets gemte oplysninger er gendannet.'); });
    host.append(form);
  }
  function renderDetail(errors = {}) {
    const project = selectedProject();
    if (!project) { detail.replaceChildren(c('instruction-note', { text: 'Vælg et projekt, når listen har resultater.' })); return; }
    const badge = c('badge', { text: PROJECT_STATUSES[project.status], variant: project.status === 'review' ? 'accent' : 'default' });
    const title = heading(project.title, 2, 'panel', { id: 'workspace-project-heading' });
    const tabBar = c('segmented-control', { variant: 'wrap' }); tabBar.replaceChildren(); tabBar.setAttribute('role', 'tablist'); tabBar.setAttribute('aria-label', 'Projektets indhold');
    const panel = el('div', 'workspace-tab-content'); panel.setAttribute('id', 'workspace-tab-panel'); panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'workspace-tab-' + state.tab); panel.setAttribute('tabindex', '0');
    if (state.tab === 'settings') panel.className += ' workspace-settings-panel';
    for (const [id, label] of tabs) {
      const node = c('segmented-option', { text: label, variant: 'desktop', attrs: { id: 'workspace-tab-' + id, 'data-tab': id, role: 'tab', 'aria-selected': String(id === state.tab), 'aria-controls': 'workspace-tab-panel', tabindex: id === state.tab ? '0' : '-1' } });
      node.removeAttribute('aria-pressed'); if (id === state.tab) node.setAttribute('data-state', 'pressed');
      const activate = () => { state.tab = id; renderDetail(); detail.querySelector('[data-tab="' + id + '"]').focus(); };
      node.addEventListener('click', activate);
      node.addEventListener('keydown', event => {
        const index = tabs.findIndex(([tab]) => tab === id); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : null;
        if (next === null) return; event.preventDefault(); state.tab = tabs[next][0]; renderDetail(); detail.querySelector('[data-tab="' + state.tab + '"]').focus();
      });
      tabBar.append(node);
    }
    const label = el('div', 'workspace-detail-label'); label.append(badge, text(project.client, 'small'));
    if (state.tab === 'settings') renderSettings(project, panel, errors);
    else if (state.tab === 'tasks') renderTasks(project, panel);
    else renderOverview(project, panel);
    const surface = c('card', { slots: { header: { tag: 'header' }, body: { tag: 'div' }, footer: '' } });
    surface.className += ' workspace-detail-surface';
    surface.querySelector('.ds-card__header').className += ' workspace-detail-header';
    surface.querySelector('.ds-card__body').className += ' workspace-detail-body';
    surface.querySelector('.ds-card__header').append(stack([label, title, tabBar], 'default'));
    surface.querySelector('.ds-card__footer').remove(); surface.querySelector('.ds-card__body').append(panel);
    detail.replaceChildren(surface);
  }
  function render() {
    search.querySelector('input').value = state.query;
    renderNavigation(); renderMetrics(); renderList(); renderDetail();
    if (state.projects.length >= 100) create.setAttribute('disabled', ''); else create.removeAttribute('disabled');
  }
  search.querySelector('input').addEventListener('input', event => { state.query = event.target.value; renderList(); renderDetail(); notify(count.textContent + '.'); });
  create.addEventListener('click', () => {
    if (state.projects.length >= 100) { notify('Arbejdsrummet kan indeholde højst 100 projekter.'); return; }
    let number = 1; while (state.projects.some(project => project.id === 'project-' + number)) number++;
    const project = { id: 'project-' + number, title: 'Nyt projekt', client: 'Ny kunde', owner: 'Freja Madsen', due: '2026-11-30', status: 'active', notifications: true, description: 'Beskriv projektets formål og den næste leverance.', tasks: [], activity: ['Projektet er oprettet.'] };
    state.projects.unshift(project); state.selected = project.id; state.filter = 'active'; state.query = ''; state.tab = 'settings'; search.querySelector('input').value = '';
    panels.setOpen(true); render(); detail.querySelector('#workspace-title-control').focus(); changed('Projektet er oprettet. Tilpas dets oplysninger.');
  });
  render();
  return { element: root, state, panels, destroy() { panels.destroy(); root.remove(); }, refresh: render };
}
