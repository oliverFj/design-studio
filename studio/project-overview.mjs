import { getComponents } from '../core/engine.mjs';
import { createComponent } from '../core/components.mjs';

const defaults = Object.freeze({ name: 'Digitale oplevelser', owner: 'Produktteamet', notifications: true });

/** Independent, in-memory state for the shared demonstration. */
export function createProjectOverviewDraft() {
  return { ...defaults, projects: [] };
}

/** A product composition of shared components. Hosts own the theme and stylesheet. */
export function createProjectOverview(theme, {
  document = globalThis.document,
  draft = createProjectOverviewDraft(),
  announce = () => {},
  idPrefix = 'project-overview',
} = {}) {
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const catalog = getComponents(theme);
  const node = (component, options = {}) => ({ component, options });
  const component = (id, options = {}) => createComponent(theme, id, options, { document });
  const element = (tag, className, children = []) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    result.append(...children);
    return result;
  };
  const supportedVariant = (id, preferred) => catalog[id]?.variants[preferred] ? preferred : Object.keys(catalog[id]?.variants ?? {})[0];
  const root = element('div', 'project-overview ds-scope');
  const canvas = element('div', 'example-canvas');
  root.append(canvas);
  let modal;

  function renderExample() {
    const heading = component('heading', { text: draft.name, variant: 'title' });
    const add = component('action-button', { label: 'Nyt projekt', icon: '+', shortcut: 'Alt+N', variant: 'horizontal', attrs: { 'aria-keyshortcuts': 'Alt+N' } });
    add.addEventListener('click', () => modal.showModal());
    const headingRow = element('div', 'example-heading', [
      element('div', 'example-heading-copy', [
        component('text', { text: 'ARBEJDSOMRÅDE / PRODUKTTEAM', variant: 'caption' }),
        heading,
        component('text', { text: 'Et samlet overblik over projekter, beslutninger og næste skridt.', variant: 'secondary' }),
      ]),
      element('div', 'example-actions', [add]),
    ]);
  
    const stats = element('div', 'example-stats', [
      ['Aktive projekter', String(6 + draft.projects.length).padStart(2, '0'), 'I gang', 'accent', 'To nye projekter denne uge'],
      ['Til gennemgang', '03', 'Review', 'neutral', 'Klar til teamets feedback'],
      ['Afsluttede projekter', '12', 'Leveret', 'default', 'Fra idé til færdig oplevelse'],
    ].map(([label, value, status, variant, description]) => component('card', {
      variant: 'default',
      slots: {
        header: { tag: 'div', children: [node('text', { text: label, variant: 'small' })] },
        body: { tag: 'div', attrs: { 'data-example-layout': 'stat' }, children: [
          node('heading', { text: value, variant: 'display' }),
          node('badge', { text: status, variant }),
        ] },
        footer: node('text', { text: description, variant: 'small' }),
      },
    })));
  
    const projectCards = [
      ['01', 'Kundeportal', 'En enklere vej fra første kontakt til et godt samarbejde.', 'Design', 'accent', 'Næste skridt', 'Review'],
      ['02', 'Brandplatform', 'Et fælles udtryk på tværs af produkt, indhold og kommunikation.', 'Planlægning', 'neutral', 'Næste skridt', 'Workshop'],
      ...draft.projects,
    ];
    const projects = element('div', 'example-projects', projectCards.map(([number, name, description, status, variant, label, value]) => component('card', {
      variant: 'default',
      slots: {
        header: { tag: 'div', attrs: { 'data-example-layout': 'project-heading' }, children: [
          node('text', { text: 'PROJEKT ' + number, variant: 'caption' }),
          node('badge', { text: status, variant }),
        ] },
        body: { tag: 'div', attrs: { 'data-example-layout': 'project-copy' }, children: [
          node('heading', { text: name, variant: 'panel' }),
          node('text', { text: description, variant: 'secondary' }),
        ] },
        footer: node('metric-row', { slots: { label, value } }),
      },
    })));
  
    const projectHeading = element('div', 'example-section-heading', [
      component('heading', { text: 'Dine projekter', variant: 'panel' }),
      component('text', { text: 'Senest opdateret', variant: 'small' }),
    ]);
  
    const notice = element('div', '', [component('alert', {
      variant: supportedVariant('alert', 'neutral'),
      slots: {
        title: 'Klar til næste designreview',
        body: 'Tre projekter er klar til feedback. Saml teamets kommentarer, og aftal det næste skridt.',
      },
    })]);
    notice.id = prefix + '-notice';
  
    const formCard = component('card', {
      variant: 'default',
      slots: {
        header: { tag: 'div', attrs: { 'data-example-stack': 'heading' }, children: [
          node('heading', { text: 'Arbejdsområdets indstillinger', variant: 'panel' }),
          node('text', { text: 'Gør plads til dit næste projekt.', variant: 'secondary' }),
        ] },
        body: { tag: 'div', attrs: { 'data-example-stack': 'form' }, children: [
          node('field', { label: 'Navn', value: draft.name, name: 'projectName', idPrefix: prefix + '-name', hint: draft.notifications ? 'Et navn, der samler teamets arbejde.' : '' }),
          node('field', { label: 'Ansvarlig', value: draft.owner, name: 'projectOwner', idPrefix: prefix + '-owner', hint: draft.notifications ? 'Teamet, der driver projekterne frem.' : '' }),
          node('checkbox', { label: 'Vis hjælp undervejs', checked: draft.notifications, idPrefix: prefix + '-help' }),
        ] },
        footer: [
          node('button', { text: 'Gem ændringer', variant: 'primary', attrs: { type: 'submit' } }),
          node('button', { text: 'Nulstil', variant: 'ghost', attrs: { type: 'reset' } }),
        ],
      },
    });
    const form = element('form', 'example-form', [formCard]);
    const fields = [...form.querySelectorAll('input:not([type="checkbox"])')];
    if (fields[0]) {
      fields[0].required = true;
      fields[0].addEventListener('input', event => { draft.name = event.target.value; });
    }
    if (fields[1]) fields[1].addEventListener('input', event => { draft.owner = event.target.value; });
    form.querySelector('input[type="checkbox"]')?.addEventListener('change', event => {
      draft.notifications = event.target.checked;
      for (const hint of form.querySelectorAll('.ds-field__hint')) {
        hint.hidden = !draft.notifications;
        if (!hint.textContent) hint.textContent = hint.id.startsWith(prefix + '-name') ? 'Et navn, der samler teamets arbejde.' : 'Teamet, der driver projekterne frem.';
        const control = hint.parentElement.querySelector('input');
        if (!control) continue;
        const described = new Set((control.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean));
        if (draft.notifications) described.add(hint.id); else described.delete(hint.id);
        if (described.size) control.setAttribute('aria-describedby', [...described].join(' ')); else control.removeAttribute('aria-describedby');
      }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      heading.textContent = draft.name.trim() || defaults.name;
      notice.replaceChildren(component('alert', {
        variant: supportedVariant('alert', 'accent'),
        slots: { title: 'Ændringerne er gemt i eksemplet', body: 'Dit arbejdsområde beholder indholdet, når du skifter tema.' },
      }));
      announce('Arbejdsområdet er opdateret.');
    });
    form.addEventListener('reset', event => {
      event.preventDefault();
      Object.assign(draft, defaults, { projects: [] });
      renderExample();
      announce('Eksemplet er nulstillet.');
    });
  
    canvas.replaceChildren(headingRow, stats, element('div', 'example-grid', [
      element('div', 'example-stack', [element('section', '', [projectHeading, projects]), notice]),
      form,
    ]));
  }
  function renderModal() {
    modal = component('dialog', {
      idPrefix: prefix + '-new-project',
      slots: {
        title: 'Opret et projekt',
        body: { tag: 'div', attrs: { 'data-example-stack': 'dialog' }, children: [
          node('text', { text: 'Giv dit projekt et navn, så teamet har et fælles sted at begynde.' }),
          node('field', { label: 'Projektnavn', placeholder: 'Fx et nyt projekt', name: 'newProjectName', idPrefix: prefix + '-modal-name' }),
        ] },
        footer: [
          node('button', { text: 'Annuller', variant: 'ghost' }),
          node('button', { text: 'Opret projekt', variant: 'primary' }),
        ],
      },
    });
    modal.classList.add('example-modal');
    const buttons = modal.querySelectorAll('button');
    buttons[0]?.addEventListener('click', () => modal.close());
    buttons[1]?.addEventListener('click', () => {
      const nameInput = modal.querySelector('input');
      if (!nameInput) return;
      nameInput.required = true;
      if (!nameInput.reportValidity()) return;
      const name = nameInput.value.trim();
      draft.projects.push([String(3 + draft.projects.length).padStart(2, '0'), name, 'Et nyt projekt er klar til teamets idéer og næste skridt.', 'Nyt', 'neutral', 'Næste skridt', 'Planlægning']);
      modal.close();
      nameInput.value = '';
      renderExample();
      announce('Projektet ' + name + ' er oprettet i eksemplet.');
    });
    modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
    root.append(modal);
  }

  renderModal();
  renderExample();
  root.addEventListener('keydown', event => {
    if (event.altKey && event.code === 'KeyN' && !event.ctrlKey && !event.metaKey && !modal.open) {
      event.preventDefault();
      modal.showModal();
    }
  });
  return root;
}
