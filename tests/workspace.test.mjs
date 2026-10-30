import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountWorkspace } from '../examples/workspace/app.mjs';
import { createWorkspaceState, workspaceData, validateWorkspaceData, projectDraft, validateProjectDraft, workspaceHasDrafts } from '../examples/workspace/data.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';
import { dom, fire } from './support/dom.mjs';

const theme = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
const fixture = (id = 'fjordside', state = createWorkspaceState()) => {
  const document = dom(), changes = [];
  const mounted = mountWorkspace(theme(id), { document, state, onChange: data => changes.push(workspaceData(data)) });
  document.body.append(mounted.element);
  return { ...mounted, document, changes };
};
const field = (root, id) => root.querySelector('#workspace-' + id + '-control');
const action = (root, id) => root.querySelector('[data-action="' + id + '"]');
const set = (node, value, type = 'input') => { node.value = value; fire(node, type); };

test('workspace files validate real dates, bounded data and unique project and task identities', () => {
  const original = createWorkspaceState(), data = workspaceData(original);
  assert.equal(validateWorkspaceData(data).valid, true);
  data.projects[0].title = 'Ændret kopi';
  assert.notEqual(original.projects[0].title, data.projects[0].title);
  assert.deepEqual(Object.keys(data), ['projects'], 'unfinished drafts and view settings are not silently saved as projects');
  assert.equal(validateWorkspaceData({ projects: [] }).valid, true);
  for (const mutate of [
    data => data.projects.push(structuredClone(data.projects[0])),
    data => { data.projects[0].tasks.push(structuredClone(data.projects[0].tasks[0])); },
    data => { data.projects[0].due = '2026-02-30'; },
    data => { data.projects[0].notifications = 'false'; },
    data => { data.projects[0].title = 'x'.repeat(301); },
    data => { data.projects[0].tasks = {}; },
    data => { data.projects[0].activity = null; },
  ]) {
    const invalid = workspaceData(original); mutate(invalid);
    assert.equal(validateWorkspaceData(invalid).valid, false);
  }
  const draft = projectDraft(original.projects[0]); draft.title = ' '; draft.due = '2026-11-31';
  assert.deepEqual(Object.keys(validateProjectDraft(draft)).sort(), ['due', 'title']);
});

test('the same realistic page mounts with named controls, unique associations and complete long text in all eight themes', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const { element, destroy } = fixture(id);
    const ids = element.querySelectorAll('[id]').map(node => node.id);
    assert.equal(new Set(ids).size, ids.length, id);
    assert.equal(element.querySelectorAll('h1').length, 1);
    const shell = element.querySelector('.ds-app-shell');
    const navigation = shell.querySelector('.ds-app-navigation'), workspace = shell.querySelector('.ds-app-workspace');
    assert.equal(navigation.parentNode, shell);
    assert.equal(workspace.parentNode, shell);
    assert.deepEqual(workspace.children.map(node => node.className.split(' ').find(name => /^ds-app-/.test(name))), ['ds-app-header', 'ds-app-content', 'ds-app-footer']);
    const content = workspace.querySelector('.ds-app-content');
    assert.equal(content.tagName, 'MAIN');
    assert.equal(content.id, 'workspace-main');
    assert.equal(content.getAttribute('tabindex'), '0');
    assert.ok(content.getAttribute('aria-label'));
    assert.equal(content.contains(element.querySelector('[data-action="new-project"]')), false, 'the header action is outside the scrolling content');
    assert.equal(content.contains(element.querySelector('[data-project="kyst"]')), true);
    const panels = content.querySelector('.ds-panel-layout');
    assert.deepEqual(panels.children.map(node => node.className.split(' ').find(name => /^ds-panel-/.test(name))), ['ds-panel-content', 'ds-panel-resize', 'ds-panel-side']);
    assert.equal(panels.querySelector('.ds-panel-side').id, 'workspace-detail');
    assert.equal(element.querySelector('[data-action="toggle-details"]').getAttribute('aria-controls'), 'workspace-detail');
    assert.match(element.textContent, /En fælles indgang til rådgivning, arrangementer og lokale fællesskaber/);
    for (const label of element.querySelectorAll('label')) {
      const target = label.getAttribute('for');
      if (target) assert.ok(element.querySelector('#' + target), id + ': connected label');
    }
    const selected = element.querySelector('[data-project="kyst"]');
    assert.equal(selected.getAttribute('aria-current'), 'true');
    for (const node of element.querySelectorAll('[role="tab"]')) {
      assert.ok(element.querySelector('#' + node.getAttribute('aria-controls')));
      assert.equal(node.getAttribute('aria-pressed'), null);
    }
    destroy();
  }
});

test('workspace search, tab keys and task changes preserve focus and update the same project data', () => {
  for (const id of ['fjordside', 'midnight-editorial']) {
    const { element, state, document, changes, destroy } = fixture(id);
    const search = field(element, 'search'); search.focus();
    set(search, 'umuligt søgeresultat');
    assert.equal(state.selected, null);
    assert.equal(element.querySelector('[data-project]'), null);
    assert.equal(document.activeElement, search);
    assert.equal(element.querySelector('[role="tab"]'), null, 'empty results have no stale details');
    set(search, '');
    const tab = name => element.querySelector('[data-tab="' + name + '"]');
    tab('overview').focus(); fire(tab('overview'), 'keydown', { key: 'ArrowRight' });
    assert.equal(state.tab, 'tasks');
    assert.equal(document.activeElement, tab('tasks'));
    assert.equal(element.querySelectorAll('[role="tab"]').filter(node => node.getAttribute('tabindex') === '0').length, 1);
    const task = () => element.querySelector('[data-task="præsentation"]');
    task().focus(); task().checked = true; fire(task(), 'change');
    assert.equal(state.projects[0].tasks.find(item => item.id === 'præsentation').done, true);
    assert.equal(document.activeElement, task());
    assert.equal(changes.length, 1);
    fire(tab('tasks'), 'keydown', { key: 'End' });
    assert.equal(state.tab, 'settings');
    assert.equal(document.activeElement, tab('settings'));
    fire(tab('settings'), 'keydown', { key: 'Home' });
    assert.equal(state.tab, 'overview');
    destroy();
  }
});

test('workspace drafts survive project and theme changes; invalid edits cannot overwrite saved content', () => {
  const { element, state, document, destroy } = fixture();
  fire(element.querySelector('[data-tab="settings"]'), 'click');
  const original = state.projects[0].title;
  set(field(element, 'title'), '');
  fire(element.querySelector('form'), 'submit');
  assert.equal(state.projects[0].title, original);
  assert.equal(document.activeElement, field(element, 'title'));
  assert.equal(field(element, 'title').getAttribute('aria-invalid'), 'true');
  set(field(element, 'title'), 'Ny retning');
  fire(element.querySelector('[data-project="atlas"]'), 'click');
  assert.equal(document.activeElement, element.querySelector('[data-project="atlas"]'));
  fire(element.querySelector('[data-project="kyst"]'), 'click');
  assert.equal(field(element, 'title').value, 'Ny retning');
  destroy();
  const remounted = fixture('midnight-editorial', state);
  assert.equal(field(remounted.element, 'title').value, 'Ny retning');
  fire(action(remounted.element, 'reset-project'), 'click');
  assert.equal(field(remounted.element, 'title').value, original);
  assert.equal(remounted.document.activeElement, action(remounted.element, 'reset-project'));
  remounted.destroy();
});

test('workspace tabs preserve mounted panels, unfinished controls and panel scroll',()=>{
 const {element,state,destroy}=fixture();
 const tab=id=>element.querySelector('[data-tab="'+id+'"]');
 fire(tab('settings'),'click');
 const title=field(element,'title'),panel=element.querySelector('#'+tab('settings').getAttribute('aria-controls'));
 set(title,'Min ufærdige kladde');panel.scrollTop=85;
 fire(tab('overview'),'click');assert.equal(panel.getAttribute('hidden'),'');
 fire(tab('settings'),'click');
 assert.equal(field(element,'title'),title);assert.equal(title.value,'Min ufærdige kladde');assert.equal(panel.scrollTop,85);
 assert.equal(state.tab,'settings');assert.equal(element.querySelectorAll('[role="tabpanel"]').length,3);
 destroy();
});

test('workspace validation survives theme changes and stays attached to the correct project', () => {
  let mounted = fixture();
  fire(mounted.element.querySelector('[data-tab="settings"]'), 'click');
  set(field(mounted.element, 'title'), ''); fire(mounted.element.querySelector('form'), 'submit');
  const state = mounted.state; mounted.destroy();
  mounted = fixture('midnight-editorial', state);
  assert.equal(field(mounted.element, 'title').getAttribute('aria-invalid'), 'true');
  fire(mounted.element.querySelector('[data-project="atlas"]'), 'click');
  assert.equal(field(mounted.element, 'title').getAttribute('aria-invalid'), null);
  fire(mounted.element.querySelector('[data-project="kyst"]'), 'click');
  assert.equal(field(mounted.element, 'title').getAttribute('aria-invalid'), 'true');
  set(field(mounted.element, 'title'), 'Rettet navn');
  mounted.destroy(); mounted = fixture('fjordside', state);
  assert.equal(field(mounted.element, 'title').getAttribute('aria-invalid'), null, 'validation uses the current draft');
  fire(action(mounted.element, 'reset-project'), 'click');
  assert.equal(field(mounted.element, 'title').value, state.projects[0].title);
  assert.equal(field(mounted.element, 'title').getAttribute('aria-invalid'), null);
  mounted.destroy();
});

test('saving a renamed and completed project keeps that project visible and focused', () => {
  const { element, state, document, destroy } = fixture();
  set(field(element, 'search'), 'Kyst');
  fire(element.querySelector('[data-tab="settings"]'), 'click');
  set(field(element, 'title'), 'Havet — ny identitet');
  set(field(element, 'client'), 'Havets Kulturhus');
  set(field(element, 'status'), 'completed', 'change');
  fire(element.querySelector('form'), 'submit');
  assert.equal(state.projects[0].title, 'Havet — ny identitet');
  assert.equal(state.projects[0].status, 'completed');
  assert.equal(state.selected, 'kyst');
  assert.equal(document.activeElement, action(element, 'save-project'));
  assert.equal(element.querySelector('[data-project="kyst"]').getAttribute('aria-current'), 'true');
  assert.equal(validateWorkspaceData(workspaceData(state)).valid, true);
  destroy();
});

test('a truly empty workspace can create its first valid project and focus the editable title', () => {
  const state = createWorkspaceState(); state.projects = []; state.selected = null;
  const { element, document, destroy } = fixture('fjordside', state);
  assert.match(element.textContent, /Arbejdsrummet er tomt/);
  fire(action(element, 'new-project'), 'click');
  assert.equal(state.projects.length, 1);
  assert.equal(document.activeElement, field(element, 'title'));
  assert.equal(validateWorkspaceData(workspaceData(state)).valid, true);
  destroy();
});

test('an imported project ID cannot collide with inherited draft properties', () => {
  const state = createWorkspaceState(); state.projects[0].id = '__proto__'; state.selected = '__proto__'; state.tab = 'settings';
  assert.equal(validateWorkspaceData(workspaceData(state)).valid, true);
  const { element, destroy } = fixture('fjordside', state);
  assert.equal(field(element, 'title').value, state.projects[0].title);
  assert.equal(workspaceHasDrafts(state), false);
  set(field(element, 'title'), 'Ændret importeret projekt');
  assert.equal(workspaceHasDrafts(state), true);
  assert.equal(Object.getPrototypeOf(state.drafts), null);
  fire(action(element, 'reset-project'), 'click');
  assert.equal(workspaceHasDrafts(state), false);
  destroy();
});

test('project details can fold and resize without discarding drafts or changing project files', () => {
  const { element, state, document, panels, destroy } = fixture();
  fire(element.querySelector('[data-tab="settings"]'), 'click');
  set(field(element, 'title'), 'En bevaret kladde');
  const before = workspaceData(state);
  const toggle = action(element, 'toggle-details'), side = element.querySelector('#workspace-detail'), handle = element.querySelector('.ds-panel-resize');
  field(element, 'title').focus(); panels.setOpen(false);
  assert.equal(document.activeElement, toggle, 'folding a focused panel returns focus to the disclosure');
  assert.equal(side.getAttribute('hidden'), '');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.textContent, 'Vis projektdetaljer');
  assert.deepEqual(state.panel, { open: false, width: 420 });
  fire(element.querySelector('[data-project="atlas"]'), 'click');
  assert.equal(state.panel.open, true, 'an explicit project choice opens its details');
  assert.equal(side.getAttribute('hidden'), null);
  fire(element.querySelector('[data-project="kyst"]'), 'click');
  assert.equal(field(element, 'title').value, 'En bevaret kladde');
  handle.focus(); fire(handle, 'keydown', { key: 'ArrowLeft' });
  assert.equal(state.panel.width, 436);
  assert.equal(handle.getAttribute('aria-valuenow'), '436');
  assert.deepEqual(workspaceData(state), before, 'view choices are not exported as project data');
  panels.setOpen(false); destroy();
  const remounted = fixture('midnight-editorial', state);
  assert.equal(remounted.element.querySelector('#workspace-detail').getAttribute('hidden'), '');
  assert.equal(action(remounted.element, 'toggle-details').textContent, 'Vis projektdetaljer');
  assert.equal(remounted.element.querySelector('.ds-panel-resize').getAttribute('aria-valuenow'), '436');
  fire(action(remounted.element, 'toggle-details'), 'click');
  assert.equal(field(remounted.element, 'title').value, 'En bevaret kladde');
  remounted.destroy();
});

test('project form actions stay outside the fields scroller, and creating a project opens hidden details', () => {
  const state = createWorkspaceState(); state.panel.open = false;
  const { element, document, destroy } = fixture('fjordside', state);
  fire(action(element, 'new-project'), 'click');
  assert.equal(state.panel.open, true);
  assert.equal(document.activeElement, field(element, 'title'));
  const form = element.querySelector('form');
  assert.ok(form.className.split(' ').includes('ds-form-layout'));
  assert.equal(form.children.length, 2);
  const fields = form.querySelector('.ds-form-fields'), actions = form.querySelector('.ds-form-actions');
  assert.equal(fields.parentNode, form); assert.equal(actions.parentNode, form);
  assert.equal(fields.contains(field(element, 'title')), true);
  assert.equal(fields.contains(action(element, 'save-project')), false);
  assert.equal(actions.contains(action(element, 'save-project')), true);
  set(field(element, 'title'), ''); fire(form, 'submit');
  assert.equal(document.activeElement, field(element, 'title'));
  assert.equal(field(element, 'title').getAttribute('aria-invalid'), 'true');
  destroy();
});
