import { COMPOSITIONS } from './catalog.mjs';
import { mountComposition, createCompositionState } from './compositions.mjs';

const LIMITATIONS = Object.freeze([
  'Kontrollen undersøger DOM-struktur og udvalgte adfærdsforløb, ikke pixels eller skrifternes faktiske mål.',
  'Responsivitet, zoom, visuel rytme og konkrete hjælpemidler kræver fortsat kontrol i browseren.',
]);
const nodes = root => [root, ...Array.from(root.children ?? []).flatMap(nodes)];
const hasClass = (node, name) => (node.getAttribute?.('class') ?? '').split(/\s+/).includes(name);
const controls = root => nodes(root).filter(node => ['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName));
const textControls = root => controls(root).filter(node => !['checkbox', 'radio', 'range', 'hidden'].includes(node.getAttribute('type')) && !hasClass(node, 'ds-range-field__number'));
const heading = node => /^H[1-6]$/.test(node.tagName);
const check = (composition, scenario, id, label, passed, details = '') => ({
  id: composition + ':' + scenario + ':' + id, composition, scenario, label,
  status: passed ? 'pass' : 'warning', details,
});

/** Inspect an existing composition without mutating it or measuring visual layout. */
export function compositionStructureReport(root, { composition, scenario = 'initial' } = {}) {
  const all = nodes(root), ids = new Map(), checks = [];
  for (const node of all) { const id = node.getAttribute?.('id'); if (id) ids.set(id, [...(ids.get(id) ?? []), node]); }
  const add = (id, label, passed, details) => checks.push(check(composition, scenario, id, label, passed, details));
  const duplicates = [...ids].filter(([, values]) => values.length > 1).map(([id]) => id);
  add('unique-ids', 'Entydige id’er', !duplicates.length, duplicates.join(', '));
  const labels = all.filter(node => node.tagName === 'LABEL');
  const orphaned = labels.filter(node => node.getAttribute('for') && !ids.has(node.getAttribute('for')));
  const unnamed = controls(root).filter(control => !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')
    && !labels.some(label => (control.getAttribute('id') && label.getAttribute('for') === control.getAttribute('id')) || label.contains(control)));
  add('labels', 'Kontroller har forbundne labels', !orphaned.length && !unnamed.length,
    orphaned.length + ' labels uden kontrol; ' + unnamed.length + ' kontroller uden navn.');
  const references = all.flatMap(node => ['aria-describedby', 'aria-labelledby', 'aria-controls']
    .flatMap(attribute => (node.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)));
  const missing = references.filter(id => !ids.has(id));
  const invalid = controls(root).filter(control => control.getAttribute('aria-invalid') === 'true');
  const silentErrors = invalid.filter(control => !(control.getAttribute('aria-describedby') ?? '').split(/\s+/)
    .some(id => /-error$/.test(id) && ids.get(id)?.some(node => node.textContent.trim())));
  add('descriptions', 'Hjælp og fejl peger på eksisterende tekst', !missing.length && !silentErrors.length,
    missing.length + ' manglende referencer; ' + silentErrors.length + ' fejl uden beskrivelse.');
  const nested = all.filter(node => heading(node) && nodes(node).slice(1).some(heading));
  add('heading-anatomy', 'Overskrifter er ikke indlejret i overskrifter', !nested.length, nested.length + ' ugyldige overskriftsforældre.');
  const compact = textControls(root).filter(node => node.getAttribute('data-variant') === 'desktop');
  add('control-density', composition === 'form' ? 'Formularen bevarer standardkontroller' : 'Værktøjsfelter bruger desktopvarianten',
    (!COMPOSITIONS[composition]?.components.includes('field') || textControls(root).length > 0)
      && (composition === 'form' ? !compact.length : compact.length === textControls(root).length),
    compact.length + ' af ' + textControls(root).length + ' tekstkontroller bruger desktop.');
  if (composition === 'editor') {
    const workspace = all.find(node => hasClass(node, 'composition-workbench'));
    add('workspace', 'Arbejdsområdet har én åben ramme og en overskrift', Boolean(workspace) && !hasClass(workspace, 'ds-card')
      && Boolean(ids.get(workspace.getAttribute('aria-labelledby'))?.some(node => workspace.contains(node))));
    const tabs = all.filter(node => node.getAttribute('role') === 'tab');
    add('tab-density', 'Fanerne følger den kompakte kontrolrytme', tabs.length > 0 && tabs.every(node => node.getAttribute('data-variant') === 'desktop'));
  }
  if (composition === 'list-detail') {
    const entries = all.filter(node => node.getAttribute('data-item'));
    if (entries.length) add('list-spacing', 'Listeposter deler en kompakt stak', entries.every(node => hasClass(node.parentNode, 'ds-stack') && node.parentNode.getAttribute('data-variant') === 'compact'));
  }
  if (composition === 'resource-library' || composition === 'history') {
    const bodies = all.filter(node => hasClass(node, 'ds-card__body'));
    add('metadata-spacing', 'Kortets relaterede indhold deler en kompakt stak', (scenario !== 'initial' || bodies.length > 0) && bodies.every(node => node.children.length === 1
      && hasClass(node.children[0], 'ds-stack') && node.children[0].getAttribute('data-variant') === 'compact'));
  }
  if (composition === 'resource-library') {
    const use = root.querySelector('[data-action="use-resource"]');
    const primary = all.filter(node => node.tagName === 'BUTTON' && node.getAttribute('data-variant') === 'primary');
    add('action-hierarchy', 'Brug ressourcen er den eneste primære handling',
      use ? primary.length === 1 && primary[0] === use : primary.length === 0);
    const count = root.querySelector('[data-resource-count]');
    const results = all.find(node => hasClass(node, 'composition-resource-layout'));
    add('result-count', 'Resultatantallet står ved filtrene og uden for resultatlisten',
      Boolean(count?.textContent.trim()) && Boolean(results) && count.parentNode.nextSibling === results);
  }
  return checks;
}

/** Run the catalog's representative samples in an isolated document, on explicit request. */
export async function compositionQualityReport(theme, { document = globalThis.document, dispatch, onProgress = () => {} } = {}) {
  const checks = [], entries = Object.entries(COMPOSITIONS);
  const doc = document?.implementation?.createHTMLDocument?.('Design Studio · kvalitetsprøve') ?? document;
  const previousFocus = doc?.activeElement;
  const eventType = doc?.defaultView?.Event ?? globalThis.Event;
  const canDispatch = typeof dispatch === 'function' || (typeof doc?.createElement?.('div')?.dispatchEvent === 'function' && typeof eventType === 'function');
  const send = (node, type) => {
    if (!node) throw new Error('Den forventede kontrol findes ikke: ' + type);
    if (dispatch) dispatch(node, type);
    else node.dispatchEvent(new eventType(type, { bubbles: true, cancelable: true }));
  };
  for (const [index, [composition, metadata]] of entries.entries()) {
    await onProgress({ composition, index: index + 1, total: entries.length, phase: 'start' });
    // A task boundary lets the editor paint progress before mounting the next sample.
    await new Promise(resolve => setTimeout(resolve, 0));
    let mounted;
    const add = (scenario, id, label, passed, details) => checks.push(check(composition, scenario, id, label, passed, details));
    try {
      if (!doc?.createElement) {
        checks.push({ id: composition + ':dom', composition, scenario: 'initial', label: metadata.name, status: 'unmeasurable', details: 'Et DOM-dokument er nødvendigt for sammensætningsprøven.' });
        continue;
      }
      const state = createCompositionState(composition), prefix = 'quality-' + composition;
      mounted = mountComposition(theme, composition, { document: doc, state, idPrefix: prefix });
      const host = doc.createElement('div'); host.appendChild(mounted.element);
      const root = mounted.element;
      checks.push(...compositionStructureReport(root, { composition }));
      if (!canDispatch) {
        for (const scenario of metadata.qualityScenarios.filter(value => value !== 'initial')) checks.push({
          id: composition + ':' + scenario, composition, scenario, label: 'Adfærd: ' + scenario,
          status: 'unmeasurable', details: 'Miljøet kan ikke sende native events til prøven.',
        });
        continue;
      }
      if (composition === 'resizable-panel') {
        const input=root.querySelector('#'+prefix+'-name-control');
        input.value='Bevar min panelkladde';send(input,'input');input.focus();
        const toggle=root.querySelector('[data-panel-demo-toggle]');
        send(toggle,'click');
        add('disclosure','closed','Panelet kan lukkes med bevaret kladde',state.panel.open===false&&state.name==='Bevar min panelkladde');
        send(toggle,'click');
        add('disclosure','restore','Genåbning bevarer feltets node og værdi',state.panel.open===true&&root.querySelector('#'+prefix+'-name-control')===input&&input.value==='Bevar min panelkladde');
        checks.push(...compositionStructureReport(root,{composition,scenario:'disclosure'}));
      } else if (composition === 'editor') {
        send(root.querySelector('[data-object="detail"]'), 'click');
        add('selection', 'surface-selection', 'Direkte fladevalg følger træ og egenskaber', state.selected === 'detail' && root.querySelector('#' + prefix + '-object-name-control')?.value === 'Detalje');
        send(root.querySelector('[data-tab="relations"]'), 'click');
        const active = root.querySelector('[data-tab="relations"]'), panel = root.querySelector('#' + active.getAttribute('aria-controls'));
        add('tabs', 'selection', 'Fanevalg og synligt panel følger samme tilstand', state.tab === 'relations' && active.getAttribute('aria-selected') === 'true' && panel.hidden === false);
        checks.push(...compositionStructureReport(root, { composition, scenario: 'tabs' }));
      } else if (composition === 'form') {
        const savedName = state.saved.name;
        let name = root.querySelector('#' + prefix + '-name-control'); name.value = ''; send(name, 'input'); send(root.querySelector('form'), 'submit');
        add('validation', 'rejection', 'Ugyldigt input bevarer de gemte værdier', state.saved.name === savedName && Boolean(root.querySelector('[aria-invalid="true"]')));
        checks.push(...compositionStructureReport(root, { composition, scenario: 'validation' }));
        name = root.querySelector('#' + prefix + '-name-control'); name.value = 'Kvalitetsprøve'; send(name, 'input'); send(root.querySelector('form'), 'submit');
        const feedback = root.querySelector('.ds-alert'), body = root.querySelector('.ds-card__body');
        add('confirmation', 'feedback', 'Bekræftelsen følger formularens fælles afstandsstak', state.saved.name === 'Kvalitetsprøve' && Boolean(feedback)
          && body.children.length === 1 && feedback.parentNode === body.children[0] && hasClass(feedback.parentNode, 'ds-stack'));
        checks.push(...compositionStructureReport(root, { composition, scenario: 'confirmation' }));
      } else if (composition === 'list-detail') {
        const target = root.querySelectorAll('[data-item]')[1], selected = target.getAttribute('data-item'); send(target, 'click');
        add('selection', 'selection', 'Postvalg og detaljehandling bevares sammen', state.selected === selected && Boolean(root.querySelector('[data-action="review"]')));
        const search = root.querySelector('input'); search.value = '__quality_no_matches__'; send(search, 'input');
        add('empty', 'empty-result', 'Tomt søgeresultat har ingen forældet detaljehandling', state.selected === null && !root.querySelector('[data-action="review"]'));
        checks.push(...compositionStructureReport(root, { composition, scenario: 'empty' }));
      } else if (composition === 'resource-library') {
        const selected = state.selected; send(root.querySelector('[data-action="view-list"]'), 'click');
        add('list', 'selection', 'Listevisning bevarer ressourcevalget', state.view === 'list' && state.selected === selected && Boolean(root.querySelector('[data-resource]')));
        const search = root.querySelector('#' + prefix + '-search-control'); search.value = '__quality_no_matches__'; send(search, 'input');
        add('empty', 'empty-result', 'Tomt bibliotekssøg har ingen forældet brugshandling', state.selected === null && !root.querySelector('[data-action="use-resource"]'));
        checks.push(...compositionStructureReport(root, { composition, scenario: 'empty' }));
      } else if (composition === 'parameter-workbench') {
        const previous = state.result;
        const input = root.querySelector('#' + prefix + '-spacing-number'); input.value = '7'; send(input, 'input');
        add('calculation', 'draft', 'Ugyldigt input bevarer sidste gyldige prøve og spærrer for brug', state.result === previous && root.querySelector('[data-action="use"]').disabled);
        input.value = '32'; send(input, 'input'); await mounted.whenSettled();
        add('calculation', 'current', 'Gyldige parametre opdaterer prøven live', state.result.input.spacing === 32 && state.result.revision === state.revision);
        send(root.querySelector('[data-action="save"]'), 'click');
        send(root.querySelector('[data-action="save-copy"]'), 'click');
        add('copy', 'identity', 'Gem som kopi opretter en selvstændig post', state.records.length === 2 && state.records[0].id !== state.records[1].id);
        checks.push(...compositionStructureReport(root, { composition, scenario: 'copy' }));
      } else if (composition === 'recipe-editor') {
        send(root.querySelector('[data-recipe-view="front"]').querySelector('[data-layer="base"]'), 'click');
        add('selection', 'direct-selection', 'Direkte fladevalg opdaterer aktivt lag og udvalget', state.activeLayer === 'base' && state.selectedIds.length === 1 && state.selectedIds[0] === 'base');
        const original = mounted.history.value.layers.find(layer => layer.id === state.activeLayer).thickness;
        const number = root.querySelector('#' + prefix + '-thickness-number'); number.value = String(original + 1); send(number, 'input');
        add('edit', 'live', 'Begge visninger følger den gyldige ændring live', Array.from(root.querySelectorAll('[data-recipe-view]')).every(view => view.querySelector('[data-layer="base"]').getAttribute('data-thickness') === String(original + 1)));
        send(number, 'change');
        add('edit', 'one-step', 'Afsluttet parameterændring danner ét fortrydtrin og bevarer den placerede kopi', state.history.past.length === 1 && mounted.history.value.layers.find(layer => layer.id === state.activeLayer).thickness === original + 1
          && state.placed.recipe.layers.find(layer => layer.id === state.activeLayer).thickness === original);
        send(root.querySelector('[data-action="undo"]'), 'click');
        add('undo', 'restore', 'Fortryd gendanner den validerede opskrift', mounted.history.value.layers.find(layer => layer.id === state.activeLayer).thickness === original && !mounted.history.dirty);
        checks.push(...compositionStructureReport(root, { composition, scenario: 'undo' }));
      } else if (composition === 'history') {
        const original = state.history.present.title, input = root.querySelector('input'); input.value = 'Kvalitetsprøve'; send(input, 'input'); send(input, 'change');
        add('edit', 'one-step', 'Afsluttet navneændring bliver ét historiktrin', state.history.present.title === 'Kvalitetsprøve' && state.history.past.length === 1);
        send(root.querySelector('[data-action="undo"]'), 'click');
        add('undo', 'restore', 'Fortryd gendanner dokumentets oprindelige værdi', state.history.present.title === original && state.history.past.length === 0);
        checks.push(...compositionStructureReport(root, { composition, scenario: 'undo' }));
      }
    } catch (error) {
      add('execution', 'error', 'Mønstret kan gennemføre kvalitetsprøven', false, String(error?.message ?? error));
    } finally {
      mounted?.destroy();
      if (doc === document && previousFocus?.focus && doc.activeElement !== previousFocus) previousFocus.focus();
      await onProgress({ composition, index: index + 1, total: entries.length, phase: 'complete' });
    }
  }
  return { scope: 'Sammensætning og udvalgt adfærd · ingen visuel kontrol', checks, limitations: [...LIMITATIONS] };
}
