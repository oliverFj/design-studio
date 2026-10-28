import { createComponent, createLayout } from '../core/components.mjs';
import { createHistoryState, createHistory } from './history.mjs';

export function createHistoryEditorState() {
  return { history: createHistoryState({ title: 'Min samling', items: ['Element 1', 'Element 2'] }), draftTitle: 'Min samling' };
}

export function mountHistoryEditor(theme, { document = globalThis.document, state = createHistoryEditorState(), announce = () => {}, onChange = () => {}, idPrefix = 'history-editor' } = {}) {
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const c = (id, options = {}) => createComponent(theme, id, options, { document });
  const stack = (...nodes) => { const node = c('stack'); node.replaceChildren(...nodes); return node; };
  const button = (text, action, variant = 'secondary') => c('button', { text, variant, attrs: { 'data-action': action } });
  const root = createLayout('form', { document }); root.className += ' ds-composition ds-scope'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Fortryd og gentag');
  const history = createHistory(state.history);
  const toolbar = document.createElement('div'); toolbar.className = 'composition-actions';
  const undo = button('Fortryd', 'undo'), redo = button('Gentag', 'redo'), save = button('Gem i eksemplet', 'save-history'); toolbar.append(undo, redo, save);
  const name = c('field', { idPrefix: prefix + '-title', label: 'Samlingens navn', value: state.draftTitle, hint: 'Navneændringen bliver ét trin, når du forlader feltet.', error: '' });
  const input = name.querySelector('input'), error = name.querySelector('.ds-field__error');
  const actions = document.createElement('div'); actions.className = 'composition-actions';
  const add = button('Tilføj element', 'add-item', 'primary'), remove = button('Fjern sidste element', 'remove-item'), cancel = button('Fortryd kladde', 'cancel-draft', 'ghost'); actions.append(add, remove, cancel);
  const preview = document.createElement('div');
  const status = c('text', { text: '', variant: 'small', attrs: { role: 'status', 'aria-live': 'polite' } });
  root.append(stack(toolbar, name, actions, preview, status));
  const invalidDraft = () => !state.draftTitle.trim();
  const draftChanged = () => state.draftTitle !== history.value.title;
  const notify = text => { status.textContent = text; announce(text); onChange(state); };
  function render() {
    const value = history.value;
    undo.disabled = !history.canUndo || draftChanged(); redo.disabled = !history.canRedo || draftChanged(); save.disabled = draftChanged();
    undo.setAttribute('title', history.undoLabel ? 'Fortryd: ' + history.undoLabel : 'Intet at fortryde'); redo.setAttribute('title', history.redoLabel ? 'Gentag: ' + history.redoLabel : 'Intet at gentage');
    add.disabled = draftChanged(); remove.disabled = !value.items.length || draftChanged(); cancel.hidden = !draftChanged();
    const card = c('card', { slots: {
      header: { component: 'heading', options: { text: value.title, variant: 'panel' } },
      body: { component: 'stack', options: { slots: { root: { tag: 'div', children: value.items.length ? value.items.map(text => ({ component: 'text', options: { text } })) : [{ component: 'instruction-note', options: { text: 'Samlingen er tom. Tilføj et element eller fortryd fjernelsen.' } }] } } } },
      footer: { component: 'badge', options: { text: draftChanged() ? 'Kladde ikke anvendt' : history.dirty ? 'Ugemte ændringer' : 'Ved gemmepunktet' } },
    } });
    preview.replaceChildren(card);
    if (draftChanged()) status.textContent = invalidDraft() ? 'Giv samlingen et navn, eller fortryd kladden.' : 'Forlad feltet for at anvende navnet som ét fortrydtrin.';
    else status.textContent = (history.dirty ? 'Dokumentet har ugemte ændringer.' : 'Dokumentet svarer til gemmepunktet.') + ' Gemmepunktet gælder kun denne session; ingen fil er skrevet.';
  }
  function commit(label, next) { if (history.commit(label, next)) { render(); notify(label + '. ' + (history.dirty ? 'Ugemte ændringer.' : 'Ved gemmepunktet.')); } }
  input.addEventListener('input', event => { state.draftTitle = event.target.value; render(); });
  input.addEventListener('change', () => {
    if (invalidDraft()) {
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', prefix + '-title-hint ' + prefix + '-title-error'); error.hidden = false; error.textContent = 'Udfyld et navn.'; render(); return;
    }
    input.removeAttribute('aria-invalid'); input.setAttribute('aria-describedby', prefix + '-title-hint'); error.hidden = true;
    state.draftTitle = state.draftTitle.trim(); input.value = state.draftTitle;
    commit('Omdøb samling', { ...history.value, title: state.draftTitle }); render();
  });
  add.addEventListener('click', () => { if (draftChanged()) return; const value = history.value; commit('Tilføj element', { ...value, items: [...value.items, 'Element ' + (value.items.length + 1)] }); });
  remove.addEventListener('click', () => { if (draftChanged() || !history.value.items.length) return; const value = history.value; commit('Fjern element', { ...value, items: value.items.slice(0, -1) }); });
  cancel.addEventListener('click', () => { state.draftTitle = history.value.title; input.value = state.draftTitle; input.removeAttribute('aria-invalid'); input.setAttribute('aria-describedby', prefix + '-title-hint'); error.hidden = true; render(); notify('Kladden er fortrudt.'); });
  function travel(direction) {
    if (draftChanged() || !history[direction]()) return false;
    state.draftTitle = history.value.title; input.value = state.draftTitle; render(); notify(direction === 'undo' ? 'Ændringen er fortrudt.' : 'Ændringen er gentaget.'); return true;
  }
  undo.addEventListener('click', () => travel('undo')); redo.addEventListener('click', () => travel('redo'));
  save.addEventListener('click', () => { if (draftChanged()) return; history.markSaved(); render(); notify('Gemmepunktet er opdateret i eksemplet. Ingen fil er skrevet.'); });
  const shortcut = event => {
    if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey)) return;
    for (let target = event.target; target && target !== root; target = target.parentNode) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || target.getAttribute?.('contenteditable') === 'true') return;
    }
    const key = event.key.toLowerCase(), direction = key === 'z' ? event.shiftKey ? 'redo' : 'undo' : key === 'y' && event.ctrlKey ? 'redo' : null;
    if (direction && travel(direction)) event.preventDefault();
  };
  root.addEventListener('keydown', shortcut); render();
  return { element: root, state, history, destroy() { root.removeEventListener('keydown', shortcut); root.remove(); } };
}
