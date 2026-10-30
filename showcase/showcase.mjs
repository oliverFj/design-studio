import { generateCSS, generateFontCSS, getComponents, resolveTokens } from './core/engine.mjs';
import { createComponent, createIcon } from './core/components.mjs';
import { themes } from './themes.mjs';
import { createProjectOverview, createProjectOverviewDraft } from './preview/project-overview.mjs';
import { mountCompositionGallery, createGalleryState } from './patterns/gallery.mjs';
import {buttonVariantIds} from './core/library.mjs';
import {renderMenuExample,bindMenuExamples} from './preview/menu-example.mjs';
import {renderNavigationExample,bindNavigationExamples} from './preview/navigation-example.mjs';
import {renderOverlayExample,bindOverlayExamples} from './preview/overlay-example.mjs';
import {renderContentExample,bindContentExamples} from './preview/content-example.mjs';
import {renderInputChoiceExample,bindInputChoiceExamples} from './preview/input-choice-example.mjs';
import {renderFeedbackExample,bindFeedbackExamples} from './preview/feedback-example.mjs';
import {renderFileExample,bindFileExamples} from './preview/file-example.mjs';
import {renderDataTableExample,bindDataTableExamples} from './preview/data-table-example.mjs';
import {renderDataGridExample,bindDataGridExamples} from './preview/data-grid-example.mjs';
import { resolveThemeMode, createColorModePreference } from './core/theme-modes.mjs';

const $ = selector => document.querySelector(selector);
const themeDescriptions = {
  'studio-light': 'Præcist produktdesign. Lyse flader, klar typografi og sikker blå accent.',
  'midnight-editorial': 'Redaktionel dybde. Mørkt blæk, varm kobber og karakterfulde overskrifter.',
  fjordside: 'Nordisk ro. Papir, terracotta og raffineret serif med en personlig identitet.',
  'castle-studio': 'Kreativ varme. Bløde former, naturlige farver og et venligt, professionelt udtryk.',
};
const shellTheme = themes.find(theme => theme.id === 'studio-light') ?? themes[0];
const shellFonts = document.createElement('style');
shellFonts.textContent = generateFontCSS(shellTheme);
document.head.append(shellFonts);
let selectedTheme = shellTheme;
const colorMode = createColorModePreference({ key: 'design-studio.showcase.color-mode', onChange: applyColorMode });
let activeTheme = resolveThemeMode(selectedTheme, colorMode.value, colorMode.resolved);
let catalog = getComponents(activeTheme);
let selectedComponent = 'card';
let selectedVariant = 'default';
let activeView = 'example';
const draft = createProjectOverviewDraft();
const patternState = createGalleryState();
let patternGallery;
let catalogExample;
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
    const colors = resolveTokens(resolveThemeMode(theme, colorMode.value, colorMode.resolved));
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
    const check = element('span', 'theme-check', theme.id === activeTheme.id ? [createIcon('check',{size:'small'},{document})] : []);
    check.setAttribute('aria-hidden', 'true');
    button.append(check);
    button.addEventListener('click', () => setTheme(theme));
    return button;
  }));
}

function applyColorMode() {
  // Mode changes update the palette in place, preserving controls and drafts.
  activeTheme = resolveThemeMode(selectedTheme, colorMode.value, colorMode.resolved);
  catalog = getComponents(activeTheme);
  $('#theme-css').textContent = generateCSS(activeTheme);
  $('#color-mode').value = colorMode.value;
  renderThemeButtons();
  announce('Farvetilstanden er skiftet. Dit arbejde er bevaret.');
}

function setTheme(theme, { announceChange = true } = {}) {
  patternGallery?.destroy();
  $('#example').querySelector('dialog[open]')?.close();
  selectedTheme = theme;
  activeTheme = resolveThemeMode(theme, colorMode.value, colorMode.resolved);
  catalog = getComponents(activeTheme);
  $('#theme-css').textContent = generateCSS(activeTheme);
  $('#color-mode').value = colorMode.value;
  $('#theme-description').textContent = themeDescriptions[theme.id] ?? theme.description;
  $('#example-theme').textContent = theme.name.toUpperCase();
  $('#component-count').textContent = Object.keys(catalog).length;
  renderThemeButtons();
  $('#example').replaceChildren(createProjectOverview(activeTheme, { document, draft, announce, idPrefix: 'showcase-example' }));
  patternGallery=mountCompositionGallery(activeTheme,{document,state:patternState,announce,idPrefix:'showcase-patterns'});
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
      createIcon('arrow-right',{size:'small'},{document}),
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
  catalogExample?.destroy();
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
  if(selectedComponent==='menubar'){
    $('#component-preview').innerHTML=renderMenuExample(activeTheme,'showcase-menu');
    catalogExample=bindMenuExamples($('#component-preview'));
  }
  if(selectedComponent==='tabs'){
    $('#component-preview').innerHTML=renderNavigationExample(activeTheme,'showcase-tabs');
    catalogExample=bindNavigationExamples($('#component-preview'));
  }
  if(['dialog','drawer','popover','tooltip'].includes(selectedComponent)){
    $('#component-preview').innerHTML=renderOverlayExample(activeTheme,selectedComponent,'showcase-overlay',undefined,selectedVariant||undefined);
    catalogExample=bindOverlayExamples($('#component-preview'));
  }
  if(selectedComponent==='avatar-group'){
    $('#component-preview').innerHTML=renderContentExample(activeTheme,'showcase-content');
    catalogExample=bindContentExamples($('#component-preview'));
  }
  if(['combobox','multiselect','date-picker','time-picker'].includes(selectedComponent)){
    $('#component-preview').innerHTML=renderInputChoiceExample(activeTheme,selectedComponent,'showcase-input-choice',undefined,selectedVariant||undefined);
    catalogExample=bindInputChoiceExamples($('#component-preview'));
  }
  if(['spinner','progress','skeleton','toast','empty-state'].includes(selectedComponent)){
    $('#component-preview').innerHTML=renderFeedbackExample(activeTheme,selectedComponent,'showcase-feedback',undefined,selectedVariant||undefined);
    catalogExample=bindFeedbackExamples($('#component-preview'));
  }
  if(selectedComponent==='file-upload'){
    $('#component-preview').innerHTML=renderFileExample(activeTheme,'showcase-file',undefined,selectedVariant||undefined);
    catalogExample=bindFileExamples($('#component-preview'));
  }
  if(selectedComponent==='data-table'){
    $('#component-preview').innerHTML=renderDataTableExample(activeTheme,'showcase-table');
    catalogExample=bindDataTableExamples($('#component-preview'));
  }
  if(selectedComponent==='data-grid'){
    $('#component-preview').innerHTML=renderDataGridExample(activeTheme,'showcase-grid');
    catalogExample=bindDataGridExamples($('#component-preview'));
  }
  $('#component-parts').replaceChildren(...Object.keys(item.parts).map(part => element('span', '', [document.createTextNode(part)])));
  renderCatalogList();
}

$('#component-search').addEventListener('input', renderCatalogList);
$('#color-mode').addEventListener('change', event => colorMode.set(event.target.value));
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
setTheme(selectedTheme, { announceChange: false });
