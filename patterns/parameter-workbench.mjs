import { createComponentFactory, createLayout, mountRangeField } from '../core/components.mjs';
import { resolveTokens } from '../core/engine.mjs';

const PARAMS = [
  { key: 'spacing', label: 'Gentagelse', min: 8, max: 48, hint: 'Afstand mellem båndene: 8–48 px i prøven.' },
  { key: 'width', label: 'Båndbredde', min: 2, max: 16, hint: '2–16 px. Bredden skal være mindre end gentagelsen.' },
  { key: 'angle', label: 'Vinkel', min: -60, max: 60, hint: 'Hældning fra −60° til 60°.' },
];
const clone = value => structuredClone(value);
const equal = (a, b) => PARAMS.every(({ key }) => a?.[key] === b?.[key]);
function validate(draft) {
  const input = {}, errors = {};
  for (const { key, label, min, max } of PARAMS) {
    const value = Number(draft[key]);
    if (String(draft[key]).trim() === '' || !Number.isInteger(value) || value < min || value > max) errors[key] = label + ' skal være et helt tal mellem ' + min + ' og ' + max + '.';
    input[key] = value;
  }
  if (!errors.width && !errors.spacing && input.width >= input.spacing) errors.width = 'Båndbredden skal være mindre end gentagelsen.';
  return { input, errors };
}

export function createParameterWorkbenchState() {
  const input = { spacing: 24, width: 6, angle: -30 };
  return {
    name: 'Rytme 01', draft: { spacing: '24', width: '6', angle: '-30' }, revision: 0,
    result: { revision: 0, input: { ...input }, sample: { ...input } },
    phase: 'idle', errors: {}, error: '', message: '', records: [], savedId: null, nextId: 1, lastUsed: null,
  };
}

function sampleSVG(sample, colors) {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const color = name => escape(colors['color.illustration.' + name]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300"><defs><pattern id="bands" width="${sample.spacing}" height="${sample.spacing}" patternUnits="userSpaceOnUse" patternTransform="rotate(${sample.angle})"><rect width="${sample.width}" height="${sample.spacing}" fill="${color('subject')}"/></pattern><clipPath id="sample"><rect x="42" y="32" width="336" height="224" rx="16"/></clipPath></defs><rect width="420" height="300" rx="20" fill="${color('ground')}"/><rect x="52" y="46" width="336" height="224" rx="16" fill="${color('depth')}" opacity=".16"/><rect x="42" y="32" width="336" height="224" rx="16" fill="${color('plane')}"/><g clip-path="url(#sample)"><rect x="42" y="32" width="336" height="224" fill="url(#bands)"/></g><rect x="42" y="32" width="336" height="224" rx="16" fill="none" stroke="${color('edge')}" stroke-width="1"/><path d="M58 33H360" fill="none" stroke="${color('light')}" stroke-width="2"/><path d="M64 278H356" stroke="${color('edge')}" opacity=".5"/><path d="M64 274V282M356 274V282" stroke="${color('edge')}"/></svg>`;
}

/** A small reference producer. Hosts may return a Promise of the same numeric sample.
 * produce(input, {signal, revision}) owns computation; this composition owns revision acceptance.
 * Save/copy are session operations. onUse receives an independent snapshot, not a storage promise.
 */
export function mountParameterWorkbench(theme, {
  document = globalThis.document, state = createParameterWorkbenchState(), announce = () => {},
  onChange = () => {}, onUse = () => {}, produce = input => ({ ...input }), idPrefix = 'parameter-workbench',
} = {}) {
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const c = createComponentFactory(theme, { document }), colors = resolveTokens(theme);
  const node = (tag, className = '') => { const item = document.createElement(tag); item.className = className; return item; };
  const stack = (items, variant = 'default') => { const item = c('stack', { variant }); item.replaceChildren(...items); return item; };
  const heading = (text, id) => c('heading', { variant: 'panel', slots: { root: { tag: 'h3', text } }, attrs: { id } });
  const card = (text, id) => {
    const item = c('card', { slots: { header: { tag: 'header', children: [] }, body: { tag: 'div', children: [] }, footer: { tag: 'footer', children: [] } } });
    item.querySelector('.ds-card__header').append(heading(text, id)); return item;
  };
  const button = (text, action, variant = 'tertiary') => c('button', { text, variant, size: 'small', attrs: { 'data-action': action } });
  const root = createLayout('workspace', { document }); root.className += ' ds-composition ds-scope';
  root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Parametrisk værksted');
  const previewCard = card('Bånd og rytme', prefix + '-preview-title'), controlCard = card('Parametre', prefix + '-controls-title');
  const preview = node('div', 'composition-parameter-preview'), previewState = c('badge', { text: '', attrs: { 'data-preview-state': '' } });
  previewCard.querySelector('.ds-card__body').append(stack([previewState, preview]));
  const calculateButton = button('Prøv igen', 'calculate', 'primary');
  previewCard.querySelector('.ds-card__footer').append(calculateButton);
  const fields = node('div');
  const save = button('Gem', 'save'), copy = button('Gem som kopi', 'save-copy', 'ghost'), use = button('Brug prøve', 'use');
  const commands = node('div', 'composition-actions'); commands.append(save, copy, use);
  const saveNote = c('text', { variant: 'small', text: 'Gem ændrer prøven; Gem som kopi opretter en ny.' });
  controlCard.querySelector('.ds-card__body').append(stack([fields, c('divider'), commands, saveNote]));
  controlCard.querySelector('.ds-card__footer').remove();
  const layout = node('div', 'composition-parameter-layout'); layout.append(previewCard, controlCard);
  const savedHeading = heading('Gemte prøver i sessionen', prefix + '-library-title');
  const library = node('ul', 'composition-parameter-library'); library.setAttribute('aria-labelledby', prefix + '-library-title');
  const libraryNote = c('text', { variant: 'small', text: 'Ingen fil eller server bliver opdateret.' });
  const usedNote = c('text', { variant: 'small', text: '', attrs: { 'data-used-sample': '' } });
  const status = c('text', { variant: 'small', text: state.message, attrs: { role: 'status', 'aria-live': 'polite' } });
  const errorHost = node('div');
  root.append(stack([layout, errorHost, status, stack([savedHeading, library, libraryNote, usedNote], 'compact')]));
  let destroyed = false, task = null, fieldCleanups = [], renderedResult, previewFigure, previewFrame = null;
  let renderedRecords, renderedSavedId, renderedError, latestCalculation = Promise.resolve(true);
  const view = document.defaultView ?? globalThis;
  const requestFrame = view.requestAnimationFrame?.bind(view), cancelFrame = view.cancelAnimationFrame?.bind(view);
  const parameterFields = new Map(); let nameField;
  const listeners = [];
  const listen = (item, type, callback, collection = listeners) => { item.addEventListener(type, callback); collection.push(() => item.removeEventListener(type, callback)); };
  const clearFieldListeners = () => {
    fieldCleanups.forEach(dispose => dispose()); fieldCleanups = [];
    for (const record of parameterFields.values()) record.controller.destroy(); parameterFields.clear();
  };
  const current = () => {
    const checked = validate(state.draft);
    return Boolean(state.phase !== 'error' && state.result && state.result.revision === state.revision && !Object.keys(checked.errors).length && equal(state.result.input, checked.input));
  };
  const savedCurrent = () => {
    const record = state.records.find(item => item.id === state.savedId);
    return Boolean(record && current() && record.name === state.name.trim() && equal(record.input, state.result.input) && equal(record.sample, state.result.sample));
  };
  function abortCalculation() {
    if (task) task.abort(); task = null;
    if (state.phase === 'calculating') state.phase = 'idle';
  }
  function notify(message, speak = true) {
    state.message = message; if (status.textContent !== message) status.textContent = message;
    if (speak) announce(message); onChange(state);
  }
  const show = (item, visible) => { item.hidden = !visible; if (visible) item.removeAttribute('hidden'); else item.setAttribute('hidden', ''); };
  function fieldRecord(field, id) {
    return { root: field, input: field.querySelector('input'), error: field.querySelector('.ds-field__error'), errorId: id + '-error', variant: field.getAttribute('data-variant') };
  }
  function updateError(record, error = '') {
    record.error.textContent = error; show(record.error, Boolean(error));
    if (error) record.root.setAttribute('data-variant', 'invalid');
    else if (record.variant) record.root.setAttribute('data-variant', record.variant); else record.root.removeAttribute('data-variant');
    const described = (record.input.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && id !== record.errorId);
    if (error) { record.input.setAttribute('aria-invalid', 'true'); described.push(record.errorId); } else record.input.removeAttribute('aria-invalid');
    if (described.length) record.input.setAttribute('aria-describedby', described.join(' ')); else record.input.removeAttribute('aria-describedby');
  }
  function refreshErrors() {
    updateError(nameField, state.errors.name);
    for (const { key } of PARAMS) {
      parameterFields.get(key).controller.update({ draft: String(state.draft[key]), error: state.errors[key] || '' });
    }
  }
  function updateParameter(key, value) {
    if (state.draft[key] === value) return;
    abortCalculation(); state.draft[key] = value; state.revision++; state.error = ''; state.phase = 'idle';
    if (state.message) { state.message = ''; status.textContent = ''; }
    // Live calculation never remounts controls, moves focus, or announces slider ticks.
    void calculate({ live: true });
  }
  function buildFields() {
    clearFieldListeners();
    const name = c('field', { idPrefix: prefix + '-name', label: 'Prøvens navn', placeholder: 'Fx Rytme 01', value: state.name, controlVariant: 'desktop', hint: 'Navnet ændrer ikke beregningen.', error: '' });
    nameField = fieldRecord(name, prefix + '-name');
    listen(name.querySelector('input'), 'input', event => {
      state.name = event.target.value; if (state.name.trim()) delete state.errors.name;
      if (state.message) { state.message = ''; status.textContent = ''; }
      refreshErrors(); render(); onChange(state);
    }, fieldCleanups);
    const groups = PARAMS.map(({ key, label, min, max, hint }) => {
      const sliderValue = Math.max(min, Math.min(max, Number.isInteger(Number(state.draft[key])) && String(state.draft[key]).trim() ? Number(state.draft[key]) : state.result?.input[key] ?? min));
      const range = c('range-field', { variant: 'with-input', idPrefix: prefix + '-' + key, label, min, max, step: 1, value: sliderValue, hint, error: '' });
      const controller = mountRangeField(range, { onInput: ({ draft }) => updateParameter(key, draft) });
      parameterFields.set(key, { root: range, input: range.querySelector('.ds-range-field__number'), controller });
      return range;
    });
    fields.replaceChildren(stack([name, c('divider'), ...groups]));
    refreshErrors();
  }
  function renderPreview() {
    if (destroyed || state.result === renderedResult) return;
    renderedResult = state.result;
    if (state.result) {
      const sample = state.result.sample, caption = sample.spacing + ' px gentagelse · ' + sample.width + ' px bånd · ' + sample.angle + '°';
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sampleSVG(sample, colors));
      const alt = 'Båndprøve med ' + caption;
      if (!previewFigure) { previewFigure = c('image', { src, alt, caption }); preview.replaceChildren(previewFigure); }
      else { const image = previewFigure.querySelector('img'); image.setAttribute('src', src); image.setAttribute('alt', alt); previewFigure.querySelector('figcaption').textContent = caption; }
    } else { previewFigure = null; preview.replaceChildren(c('empty-state', { idPrefix: prefix + '-empty', title: 'Prøven opdateres automatisk', body: 'Vælg gyldige parametre for at se din prøve.' })); }
  }
  function queuePreview() {
    if (state.result === renderedResult || previewFrame !== null) return;
    if (!requestFrame || renderedResult === undefined) renderPreview();
    else previewFrame = requestFrame(() => { previewFrame = null; renderPreview(); });
  }
  function render() {
    const valid = current(), saved = savedCurrent(), calculating = state.phase === 'calculating', invalid = Object.keys(validate(state.draft).errors).length > 0;
    const label = calculating ? 'Opdaterer prøven' : state.error ? 'Beregning mislykkedes' : invalid ? 'Viser sidste gyldige prøve' : !valid ? 'Prøven skal opdateres' : saved ? 'Gemt i sessionen' : 'Prøven er aktuel';
    previewState.textContent = label; previewState.setAttribute('data-preview-state', calculating ? 'calculating' : valid ? 'current' : 'stale');
    previewCard.setAttribute('aria-busy', String(calculating));
    queuePreview();
    calculateButton.textContent = state.error ? 'Prøv igen' : 'Opdatér prøve'; calculateButton.disabled = calculating;
    show(calculateButton, !valid && !calculating && !invalid);
    show(previewCard.querySelector('.ds-card__footer'), !calculateButton.hidden);
    for (const action of [save, copy, use]) action.disabled = !valid || calculating;
    save.setAttribute('data-variant', valid && !saved ? 'primary' : 'tertiary');
    use.setAttribute('data-variant', valid && saved ? 'primary' : 'tertiary');
    if (state.records !== renderedRecords || state.savedId !== renderedSavedId) {
      renderedRecords = state.records; renderedSavedId = state.savedId;
      library.replaceChildren(...(state.records.length ? state.records.map(record => {
      const row = node('li', 'composition-parameter-library-row'); row.setAttribute('data-sample-id', record.id);
      row.append(c('text', { text: record.name }), c('badge', { text: record.id === state.savedId ? 'Aktiv post' : 'Gemt prøve' })); return row;
      }) : [(() => { const row = node('li'); row.append(c('text', { text: 'Der er endnu ikke gemt en prøve.', variant: 'secondary' })); return row; })()]));
    }
    usedNote.hidden = !state.lastUsed;
    usedNote.textContent = state.lastUsed ? 'Valgt til brug: ' + state.lastUsed.name : '';
    if (state.error !== renderedError) {
      renderedError = state.error;
      errorHost.replaceChildren(...(state.error ? [c('alert', { role: 'group', slots: { title: 'Prøven kunne ikke beregnes', body: state.error } })] : []));
    }
  }
  async function runCalculation({ live = false } = {}) {
    if (destroyed) return false;
    abortCalculation();
    const checked = validate(state.draft); state.errors = { ...(state.errors.name ? { name: state.errors.name } : {}), ...checked.errors }; state.error = ''; state.phase = 'idle';
    refreshErrors();
    if (Object.keys(checked.errors).length) {
      render();
      if (live) onChange(state); else { parameterFields.get(PARAMS.find(({ key }) => checked.errors[key]).key).input.focus(); notify('Ret de markerede parametre. Prøven følger gyldige værdier automatisk.'); }
      return false;
    }
    const revision = state.revision, input = clone(checked.input), controller = new AbortController(); task = controller;
    state.phase = 'calculating';
    const accepts = () => !destroyed && task === controller && !controller.signal.aborted && revision === state.revision && equal(input, validate(state.draft).input);
    const discardStale = () => {
      if (accepts()) return false;
      if (!destroyed && task === controller) {
        controller.abort(); task = null; state.phase = 'idle';
        render();
      }
      return true;
    };
    const restoreCommandFocus = () => { if (document.activeElement === calculateButton || document.activeElement === document.body) (calculateButton.hidden ? save : calculateButton).focus(); };
    try {
      const pending = produce(clone(input), { signal: controller.signal, revision });
      let produced = pending;
      if (pending && typeof pending.then === 'function') {
        render(); if (live) onChange(state); else notify('Beregner prøve…');
        produced = await pending;
      }
      if (discardStale()) return false;
      const checkedSample = validate(produced);
      if (Object.keys(checkedSample.errors).length) throw new Error('Ugyldig prøve');
      state.result = { revision, input, sample: checkedSample.input }; state.phase = 'idle'; task = null;
      render();
      if (live) onChange(state); else { restoreCommandFocus(); notify('Prøven er opdateret. Den er klar til Gem eller Brug.'); }
      return true;
    } catch {
      if (discardStale()) return false;
      state.phase = 'error'; state.error = 'Kladden og det tidligere resultat er bevaret. Prøv at beregne igen.'; task = null;
      render();
      if (live) onChange(state); else { restoreCommandFocus(); notify('Prøven kunne ikke beregnes.'); }
      return false;
    }
  }
  function calculate(options) { latestCalculation = runCalculation(options); return latestCalculation; }
  async function whenSettled() {
    if (destroyed) return false;
    let pending;
    do { pending = latestCalculation; await pending; } while (!destroyed && pending !== latestCalculation);
    return !destroyed && current();
  }
  const namedSnapshot = () => {
    if (!current() || state.phase === 'calculating') return null;
    if (!state.name.trim()) {
      state.errors.name = 'Giv prøven et navn.'; refreshErrors(); nameField.input.focus(); notify('Giv prøven et navn før Gem eller Brug.'); return null;
    }
    return { name: state.name.trim(), revision: state.result.revision, input: clone(state.result.input), sample: clone(state.result.sample) };
  };
  function saveSample(asCopy) {
    const snapshot = namedSnapshot(); if (!snapshot) return;
    const existing = !asCopy && state.records.find(item => item.id === state.savedId);
    const record = { ...snapshot, id: existing?.id ?? 'sample-' + state.nextId++ };
    if (asCopy) record.name += ' · kopi';
    state.records = existing ? state.records.map(item => item.id === existing.id ? record : item) : [...state.records, record];
    state.savedId = record.id; state.name = record.name; state.errors.name = ''; nameField.input.value = state.name; refreshErrors(); render();
    (asCopy ? copy : save).focus(); notify(asCopy ? 'Kopien er gemt i sessionen.' : 'Prøven er gemt i sessionen.');
  }
  listen(calculateButton, 'click', () => { void calculate(); });
  listen(save, 'click', () => saveSample(false)); listen(copy, 'click', () => saveSample(true));
  listen(use, 'click', () => {
    const snapshot = namedSnapshot(); if (!snapshot) return;
    snapshot.sourceId = savedCurrent() ? state.savedId : null;
    state.lastUsed = clone(snapshot); onUse(clone(snapshot)); render(); notify('Prøven er valgt til brug. Gemning er en særskilt handling.');
  });
  // Theme remounts keep accepted results; interrupted live work resumes from the retained draft.
  if (state.phase === 'calculating') { state.phase = 'idle'; state.message = 'Beregningen er afbrudt. Kladden er bevaret.'; status.textContent = state.message; }
  state.errors = { ...(state.errors.name ? { name: state.errors.name } : {}), ...validate(state.draft).errors };
  buildFields(); render();
  if (!current() && !Object.keys(validate(state.draft).errors).length && state.phase !== 'error') void calculate({ live: true });
  return { element: root, state, calculate, whenSettled, destroy() {
    if (destroyed) return; destroyed = true;
    const pending = Boolean(task); abortCalculation();
    if (pending) state.message = 'Beregningen er afbrudt. Kladden er bevaret.';
    if (previewFrame !== null) { cancelFrame?.(previewFrame); previewFrame = null; }
    clearFieldListeners(); listeners.forEach(dispose => dispose()); root.remove();
  } };
}
