import { generateCSS, getComponents, resolveTokens } from './core/engine.mjs';
import { createComponent } from './core/components.mjs';
import { themes } from './themes.mjs';
import { createProjectOverview, createProjectOverviewDraft } from './preview/project-overview.mjs';
import { mountCompositionGallery, createGalleryState } from './patterns/gallery.mjs';
import {buttonVariantIds} from './core/library.mjs';

const $ = selector => document.querySelector(selector);
const themeDescriptions = {
  'studio-light': 'Præcist produktdesign. Lyse flader, klar typografi og sikker blå accent.',
  'midnight-editorial': 'Redaktionel dybde. Mørkt blæk, varm kobber og karakterfulde overskrifter.',
  fjordside: 'Nordisk ro. Papir, terracotta og raffineret serif med en personlig identitet.',
  'castle-studio': 'Kreativ varme. Bløde former, naturlige farver og et venligt, professionelt udtryk.',
};
let activeTheme = themes.find(theme => theme.id === 'studio-light') ?? themes[0];
let catalog = getComponents(activeTheme);
let selectedComponent = 'card';
let selectedVariant = 'default';
let activeView = 'example';
const draft = createProjectOverviewDraft();
const patternState = createGalleryState();
let patternGallery;
const component = (id, options = {}) => createComponent(activeTheme, id, options, { document });
const element = (tag, className, children = []) => {
  const result = document.createElement(tag);
  if (className) result.className = className;
  result.append(...children);
  return result;
};
const announce = message => { $('#demo-status').textContent = message; };

function renderThemeButtons() {
  $('#theme-count').textContent = themes.length + ' udtryk';
  $('#themes').replaceChildren(...themes.map(theme => {
    const colors = resolveTokens(theme);
    const swatches = element('span', 'theme-colors');
    swatches.setAttribute('aria-hidden', 'true');
    for (const id of ['color.background.canvas', 'color.text.primary', 'color.action.primary']) {
      const swatch = document.createElement('span');
      swatch.style.backgroundColor = colors[id];
      swatches.append(swatch);
    }
    const button = element('button', 'theme-button', [swatches, document.createTextNode(theme.name)]);
    button.type = 'button';
    button.dataset.theme = theme.id;
    button.setAttribute('aria-pressed', String(theme.id === activeTheme.id));
    const check = element('span', 'theme-check', [document.createTextNode(theme.id === activeTheme.id ? '✓' : '')]);
    check.setAttribute('aria-hidden', 'true');
    button.append(check);
    button.addEventListener('click', () => setTheme(theme));
    return button;
  }));
}

function setTheme(theme, { announceChange = true } = {}) {
  patternGallery?.destroy();
  $('#example').querySelector('dialog[open]')?.close();
  activeTheme = theme;
  catalog = getComponents(theme);
  $('#theme-css').textContent = generateCSS(theme);
  $('#theme-description').textContent = themeDescriptions[theme.id] ?? theme.description;
  $('#example-theme').textContent = theme.name.toUpperCase();
  $('#component-count').textContent = Object.keys(catalog).length;
  renderThemeButtons();
  $('#example').replaceChildren(createProjectOverview(theme, { document, draft, announce, idPrefix: 'showcase-example' }));
  patternGallery=mountCompositionGallery(theme,{document,state:patternState,announce,idPrefix:'showcase-patterns'});
  $('#patterns').replaceChildren(patternGallery.element);
  renderCatalog();
  if (announceChange) announce('Temaet er skiftet til ' + theme.name + '.');
}

function renderCatalogList() {
  const search = $('#component-search').value.toLocaleLowerCase('da').trim();
  const matches = Object.entries(catalog).filter(([id, item]) => (id + ' ' + item.name + ' ' + item.description).toLocaleLowerCase('da').includes(search));
  $('#component-list').replaceChildren(...matches.map(([id, item]) => {
    const button = element('button', 'component-button', [
      document.createTextNode(item.name),
      element('span', '', [document.createTextNode('↗')]),
    ]);
    button.type = 'button';
    button.dataset.component = id;
    button.setAttribute('aria-pressed', String(selectedComponent === id));
    button.addEventListener('click', () => {
      selectedComponent = id;
      selectedVariant = (id==='button'?buttonVariantIds(item):Object.keys(item.variants).filter(v=>id!=='link'||v!=='action'))[0] ?? '';
      renderCatalog();
    });
    return button;
  }));
  $('#no-results').hidden = matches.length > 0;
}

function renderCatalog() {
  if (!catalog[selectedComponent]) selectedComponent = Object.keys(catalog)[0];
  const item = catalog[selectedComponent];
  const variants = selectedComponent==='button'?buttonVariantIds(item):Object.keys(item.variants).filter(v=>selectedComponent!=='link'||v!=='action');
  if (!variants.includes(selectedVariant)) selectedVariant = variants[0] ?? '';
  $('#component-id').textContent = selectedComponent.toUpperCase();
  $('#component-name').textContent = item.name;
  $('#component-description').textContent = item.description;
  $('#component-usage').textContent = item.usage;
  const select = $('#variant');
  select.replaceChildren(...(variants.length ? variants : ['standard']).map(id => {
    const option = document.createElement('option');
    option.value = id === 'standard' ? '' : id;
    option.textContent = id === 'standard' ? 'Standard' : id;
    return option;
  }));
  select.value = selectedVariant;
  select.disabled = variants.length === 0;
  select.title = item.variants[selectedVariant]?.description ?? 'Komponentens standardudtryk';
  const preview = component(selectedComponent, { variant: selectedVariant || undefined, idPrefix: 'catalog-' + selectedComponent, open: selectedComponent === 'dialog' });
  $('#component-preview').replaceChildren(preview);
  $('#component-parts').replaceChildren(...Object.keys(item.parts).map(part => element('span', '', [document.createTextNode(part)])));
  renderCatalogList();
}

$('#component-search').addEventListener('input', renderCatalogList);
$('#variant').addEventListener('change', event => {
  selectedVariant = event.target.value;
  renderCatalog();
  announce('Varianten er skiftet til ' + (selectedVariant || 'standard') + '.');
});
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  activeView = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.view === activeView)));
  $('#example-view').hidden = activeView !== 'example';
  $('#catalog-view').hidden = activeView !== 'catalog';
  $('#patterns-view').hidden = activeView !== 'patterns';
}));
setTheme(activeTheme, { announceChange: false });
