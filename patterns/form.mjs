import { createComponentFactory, createLayout } from '../core/components.mjs';

export function createFormState() {
  const values = { name: 'Mit arbejdsområde', email: 'team@example.com', notifications: true };
  return { draft: { ...values }, saved: { ...values } };
}

/** Optional reference composition. Saving accepts a session draft; it does not write a file. */
export function mountForm(theme, {
  document = globalThis.document, state = createFormState(), announce = () => {},
  onChange = () => {}, idPrefix = 'composition-form',
} = {}) {
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const c = createComponentFactory(theme, { document });
  const element = (tag, className = '') => { const node = document.createElement(tag); node.className = className; return node; };
  const stack = (nodes, variant = 'default') => { const node = c('stack', { variant }); node.replaceChildren(...nodes); return node; };
  const heading = (text, id, variant = 'panel', tag = 'h4') => c('heading', { variant, slots: { root: { tag, text } }, attrs: { id } });
  const dirty = () => ['name', 'email', 'notifications'].some(key => state.draft[key] !== state.saved[key]);
  const dirtyMessage = 'Der er ændringer, som ikke er gemt i eksemplet.';
  state.errors ??= {};
  state.confirmed ??= false;
  if (state.confirmed && dirty()) { state.confirmed = false; state.message = dirtyMessage; }
  const root = createLayout('form', { document }); root.className += ' ds-composition ds-scope';
  root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Formular med validering');
  let cleanups = [];
  const listen = (node, type, callback) => { node.addEventListener(type, callback); cleanups.push(() => node.removeEventListener(type, callback)); };
  const cleanup = () => { for (const dispose of cleanups) dispose(); cleanups = []; };

  function render() {
    cleanup();
    const form = element('form', 'composition-form-settings'); form.noValidate = true;
    const card = c('card', {
      slots: { header: { tag: 'header', children: [] }, body: { tag: 'div', children: [] }, footer: '' },
    });
    card.querySelector('.ds-card__footer').remove();
    card.querySelector('.ds-card__header').append(stack([
      heading('Indstillinger for arbejdsområdet', prefix + '-title', 'title', 'h3'),
      c('text', { variant: 'secondary', text: 'Giv arbejdsområdet et genkendeligt navn, og vælg, hvordan du vil modtage opdateringer.' }),
    ], 'compact'));
    form.setAttribute('aria-labelledby', prefix + '-title');
    const field = (key, label, options = {}) => c('field', {
      idPrefix: prefix + '-' + key, label, value: state.draft[key], required: true,
      error: state.errors[key] || '', ...options,
    });
    const name = field('name', 'Navn på arbejdsområdet', { hint: 'Brug et kort navn, som andre kan genkende.' });
    const email = field('email', 'E-mail', { type: 'email', autocomplete: 'email', hint: 'Den adresse, der skal modtage opdateringer.' });
    const fields = stack([name, email]); fields.className += ' composition-form-fields';
    const contact = element('section'); contact.setAttribute('aria-labelledby', prefix + '-contact-title');
    contact.append(stack([heading('Arbejdsområde og kontakt', prefix + '-contact-title'), fields]));
    const notifications = c('checkbox', {
      idPrefix: prefix + '-notifications', label: 'Send mig opdateringer', checked: state.draft.notifications,
      hint: 'Slå til for at modtage besked om vigtige ændringer i arbejdsområdet.',
    });
    const preferences = element('section'); preferences.setAttribute('aria-labelledby', prefix + '-preferences-title');
    preferences.append(stack([heading('Opdateringer', prefix + '-preferences-title'), notifications], 'compact'));
    const save = c('button', { text: 'Gem indstillinger', variant: 'primary', attrs: { type: 'submit', 'data-action': 'save-form' } });
    const reset = c('button', { text: 'Fortryd ændringer', variant: 'ghost', attrs: { 'data-action': 'reset-form' } });
    const actions = element('div', 'composition-actions'); actions.append(save, reset);
    const draftStatus = c('badge', { text: '', attrs: { 'data-form-state': '' } });
    const actionBar = element('div', 'composition-form-action-bar'); actionBar.append(actions, draftStatus);
    const scope = c('text', { variant: 'small', text: 'Eksemplet gemmer kun indstillingerne i denne session. Ingen fil bliver skrevet.' });
    const status = c('text', { variant: 'small', text: state.message ?? '', attrs: { role: 'status', 'aria-live': 'polite' } });
    const content = stack([contact, c('divider'), preferences, c('divider'), stack([actionBar, scope], 'compact')]);
    card.querySelector('.ds-card__body').append(content);
    const updateDraftStatus = () => {
      const changed = dirty();
      draftStatus.textContent = changed ? 'Ugemte ændringer' : state.confirmed ? 'Gemt i eksemplet' : 'Ingen ændringer';
      draftStatus.setAttribute('data-form-state', changed ? 'dirty' : state.confirmed ? 'saved' : 'clean');
    };
    updateDraftStatus();
    if (state.confirmed) content.append(c('alert', {
      role: 'group', attrs: { 'aria-label': 'Gemt i eksemplet' },
      slots: { title: 'Gemt i eksemplet', body: 'Dine indstillinger er opdateret og bevares, mens du skifter tema.' },
    }));
    form.append(card); root.replaceChildren(form, status);
    const publish = (message, speak = true) => {
      state.message = message; if (status.textContent !== message) status.textContent = message;
      if (speak && message) announce(message);
      onChange(state);
    };
    const edited = () => {
      const wasConfirmed = state.confirmed;
      state.confirmed = false; form.querySelector('.ds-alert')?.remove(); updateDraftStatus();
      const message = dirty() ? dirtyMessage : Object.keys(state.errors).length ? 'Ret de markerede felter.' : '';
      publish(message, wasConfirmed && dirty());
    };
    listen(name.querySelector('input'), 'input', event => { state.draft.name = event.target.value; edited(); });
    listen(email.querySelector('input'), 'input', event => { state.draft.email = event.target.value; edited(); });
    listen(notifications.querySelector('input'), 'change', event => { state.draft.notifications = event.target.checked; edited(); });
    listen(form, 'submit', event => {
      event.preventDefault();
      const errors = {};
      if (!state.draft.name.trim()) errors.name = 'Udfyld et navn.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.draft.email.trim())) errors.email = 'Angiv en gyldig e-mailadresse.';
      state.errors = errors;
      if (Object.keys(errors).length) {
        state.confirmed = false; state.message = 'Ret de markerede felter.';
        render(); root.querySelector('[aria-invalid="true"]')?.focus(); announce(state.message); onChange(state); return;
      }
      state.saved = { ...state.draft, name: state.draft.name.trim(), email: state.draft.email.trim() };
      state.draft = { ...state.saved }; state.confirmed = true; state.message = 'Indstillingerne er gemt i eksemplet.';
      render(); root.querySelector('[data-action="save-form"]').focus(); announce(state.message); onChange(state);
    });
    listen(reset, 'click', () => {
      state.draft = { ...state.saved }; state.errors = {}; state.confirmed = false; state.message = 'De senest gemte værdier er gendannet.';
      render(); root.querySelector('[data-action="reset-form"]').focus(); announce(state.message); onChange(state);
    });
  }
  render();
  return { element: root, state, destroy() { cleanup(); root.remove(); } };
}
