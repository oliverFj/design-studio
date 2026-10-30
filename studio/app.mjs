import { createBrandStudio } from './brand.mjs';

import { validatePackage, resolveTokens, generateCSS, validateCompatibility, getComponents, materializePackage, migratePackage } from '../core/engine.mjs';

import { renderComponent, mountPanelControls } from '../core/components.mjs';
import { DEFAULT_TOKENS, COMPONENT_LIBRARY, TOKEN_ALIASES } from '../core/library.mjs';
import { tokenUsageReport } from '../core/token-usage.mjs';
import { usageLabel, usageDetails } from './token-usage.mjs';
import { createQualityStudio } from './quality.mjs';
import { createViewMemory } from './view-state.mjs';
import { generateAppShellCSS, generateScrollbarCSS } from '../core/layout.mjs';
import { createProjectOverview, createProjectOverviewDraft } from './project-overview.mjs';
import bundledThemes from './bundled-themes.mjs';
import { createThemeStorage } from './theme-storage.mjs';
import { readJSONFile, downloadFile } from '../core/files.mjs';
import { mountCompositionGallery, createGalleryState } from '../patterns/gallery.mjs';
import {renderMotionView} from './motion.mjs';
import {createCatalogState,renderComponentCatalog,bindComponentCatalog,catalogVariants} from './component-catalog.mjs';

const root = document.querySelector('#app');
const shellStyle = document.createElement('style');
shellStyle.textContent = generateAppShellCSS('#app') + '\n' + generateScrollbarCSS('#app');
document.head.append(shellStyle);
const viewMemory = createViewMemory({ document });
let renderedView = null;
const inspectorPanel = { open: true, width: 310 };
let inspectorControls;
const state = { packages: [], key: null, file: '', pack: null, saved: '', view: 'components', mode: 'catalog', component: 'button', token: null, variants: {}, recipeDraft: null, error: '', busy: false };
const exampleDraft = createProjectOverviewDraft();
const galleryState = createGalleryState();
const catalogState=createCatalogState();
const motionState=createCatalogState();
let catalogControls;
let compositionGallery;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = value => structuredClone(value);
const themeStorage = createThemeStorage(bundledThemes, { download });
const brandStudio = createBrandStudio(state, {escape, field, edited, render, notice, allowNavigation, download});
const qualityStudio = createQualityStudio(state, {escape, validation:()=>validation(), render, notice});
const icon = name => {
  const paths = { motion:'<path d="M4 16h3l3-8 4 10 3-10h3"/><path d="M4 4h16M4 22h16"/>', quality:'<path d="M5 4h14v16H5zM8 9l2 2 5-5M8 15h8"/>', patterns:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M14 3v18M3 10h11M14 14h7"/>', brand:'<path d="M4 5h16v14H4zM8 9h8M8 13h5"/><path d="m17 15 2 2"/>', components:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', tokens:'<path d="M12 3 21 8v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8"/>', package:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>' };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name] || paths.components)+'</svg>';
};
let readModel = null, lastValidModel = null, lastPreviewTheme = null;
const previewTheme = () => lastPreviewTheme || state.pack;
const model = () => {
  if (readModel) return readModel;
  try { lastValidModel = readModel = materializePackage(state.pack); }
  catch { readModel = { ...state.pack, tokens: { ...DEFAULT_TOKENS, ...state.pack.tokens }, components: state.pack.schemaVersion === 1 ? state.pack.components : lastValidModel?.components || COMPONENT_LIBRARY }; }
  return readModel;
};
const components = () => model().components;
const themeTokens = () => model().tokens;
let usageModel=null,usageCache=null;
function tokenUsage(){
  const current=model();
  if(usageModel!==current){usageModel=current;usageCache=tokenUsageReport(current,{compatibilityTokens:[...Object.keys(TOKEN_ALIASES),'size.switch.checkedOffset']});}
  return usageCache;
}
const editableToken = () => state.pack.tokens[state.token] ||= clone(themeTokens()[state.token]);
const dirty = () => state.pack && (JSON.stringify(state.pack) !== state.saved || state.recipeDraft !== null);
const validation = () => state.pack ? validatePackage(state.pack) : { valid: false, errors: [] };
const groupName = id => ({color:'Farver',typography:'Typografi',space:'Afstande',radius:'Hjørner',shadow:'Skygger',duration:'Overgange',border:'Kanter',size:'Størrelser',opacity:'Gennemsigtighed'})[id] || id;
function notice(message, error = false) {
  document.querySelector('.notification')?.remove();
  const node = document.createElement('div');
  node.className = 'notification'+(error ? ' error' : '');
  node.setAttribute('role', error ? 'alert' : 'status');
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 6500);
  document.querySelector('#announcer').textContent = message;
}
function cssPreview() {
  const checked = validation();
  if (!checked.valid) return checked;
  let style = document.querySelector('#package-styles');
  if (!style) { style = document.createElement('style'); style.id = 'package-styles'; document.head.append(style); }
  style.textContent = generateCSS(state.pack);
  document.documentElement.classList.add('ds-scope');
  lastPreviewTheme = clone(state.pack);
  return checked;
}
function refreshStatus() {
  const checked = validation();
  const bar = document.querySelector('#status-bar');
  if (!bar) return;
  const invalid = !checked.valid || state.recipeDraft !== null;
  bar.className = 'status-bar'+(!checked.valid ? ' error' : dirty() ? ' changed' : '');
  const message = !checked.valid ? 'Ret de værdier, der bryder temaets designregler, før du gemmer.' : state.recipeDraft !== null ? 'Komponentopskriften skal anvendes før du gemmer.' : dirty() ? 'Ændringerne er endnu ikke gemt.' : 'Offline · Gem tema henter en JSON-fil. Browseren håndterer placeringen.';
  bar.innerHTML = '<span>'+escape(message)+'</span><span>'+Object.keys(themeTokens()).length+' tokens · '+Object.keys(components()).length+' komponenter</span>';
  const save = document.querySelector('#save');
  if (save) save.disabled = invalid || state.busy;
  const discard = document.querySelector('#discard');
  if (discard) discard.hidden = !dirty();
  const errors = document.querySelector('#validation-errors');
  if (errors) { errors.hidden = checked.valid; errors.textContent = checked.errors.join('\n'); }
}
function field(id, label, value, { textarea = false, type = 'text', placeholder = '' } = {}) {
  return '<label class="studio-field" for="'+id+'">'+escape(label)+(textarea ? '<textarea class="studio-input" id="'+id+'">'+escape(value)+'</textarea>' : '<input class="studio-input" type="'+type+'" id="'+id+'" value="'+escape(value)+'" placeholder="'+escape(placeholder)+'">')+'</label>';
}
function variantFor(id) {
  const variants = components()[id]?.variants || {};
  if (Object.hasOwn(state.variants, id)) return state.variants[id] || undefined;
  return components()[id]?.preview?.variant || ['default', 'primary', 'neutral', 'horizontal'].find(key => Object.hasOwn(variants, key));
}
function button(text, variant = 'primary', disabled = false) {
  return renderComponent(previewTheme(), 'button', { text, variant, disabled });
}
function dsField(label, value, prefix, error = false, variant = 'default') {
  return renderComponent(previewTheme(), 'field', { label, value, idPrefix: prefix, error: error ? 'Udfyld feltet.' : '', hint: 'En kort hjælp til feltet.', variant });
}
function cardMarkup(prefix = 'card') {
  return renderComponent(previewTheme(), 'card', { variant: variantFor('card'), idPrefix: prefix, slots: {
    header: { tag: 'h3', text: 'Et sted til idéer' },
    body: { tag: 'p', text: 'Saml dine noter, og giv den næste idé plads.' },
    footer: { component: 'button', options: { text: 'Åbn samlingen' } },
  } });
}
function specimen(id) {
  return renderComponent(previewTheme(), id, { variant: variantFor(id), idPrefix: 'specimen-' + id, open: id === 'dialog' });
}
function patternsView() {
  if(state.pack.schemaVersion!==2) return '<div class="canvas-toolbar"><h2>Designmønstre</h2></div><p class="help">Designmønstre bruger det fælles bibliotek i temaformat 2.</p>';
  return '<div class="canvas-toolbar"><h2>Designmønstre</h2></div><p class="help">Genbrugelige løsninger fra komponenter til arbejdsflow. Prøv dem med dit tema, og åbn Genbrug og sammensætning for kode og ophav.</p><div id="compositions-host"></div>';
}
function componentsView() {
  const entries = Object.entries(components());
  const toolbar = '<div class="canvas-toolbar"><h2>Komponenter <span class="count">'+entries.length+'</span></h2><div class="segmented" aria-label="Visning"><button type="button" data-mode="catalog" class="'+(state.mode==='catalog'?'active':'')+'" aria-pressed="'+(state.mode==='catalog')+'">Bibliotek</button><button type="button" data-mode="example" class="'+(state.mode==='example'?'active':'')+'" aria-pressed="'+(state.mode==='example')+'">Samlet eksempel</button></div></div>';
  if (state.mode === 'example' && state.pack.schemaVersion === 2) return toolbar+'<div id="project-overview-host"></div><p class="help">Samme samlede eksempel som i web-showcasen. Prøv temaer, indstillinger og et nyt projekt her.</p>';
  if (state.mode === 'example') return toolbar+'<div class="example-stage ds-scope"><div class="example-width"><div class="example-header"><div><p class="preview-copy preview-muted">Din samling</p><h2 class="ds-heading">Næste gode idé</h2></div><span class="ds-badge" data-variant="default">Kladde</span></div>'+cardMarkup('example')+'<div class="ds-card" data-variant="default"><header class="ds-card__header"><h3 class="preview-title">Gør den til din</h3></header><div class="ds-card__body"><div class="example-fields">'+dsField('Titel','Min nye samling','example-title')+dsField('Beskrivelse','Noter og inspiration','example-description')+'</div></div><footer class="ds-card__footer">'+button('Gem samling')+button('Annuller','secondary')+'</footer></div></div></div><p class="help">Samme komponenter og indhold, uanset hvilket tema du vælger.</p>';
  return toolbar+renderComponentCatalog(previewTheme(),{components:components(),state:catalogState,selected:state.component,variantFor});
}
function componentInspector() {
  const id = state.component, source = components()[id];
  const component=source&&state.pack.schemaVersion===2?{...source,variants:Object.fromEntries(catalogVariants(state.pack,id,source).map(key=>[key,source.variants[key]]))}:source;
  if (!component) return '<p class="help">Vælg en komponent.</p>';
  const variants = catalogVariants(state.pack,id,component);
  const refs = [...new Set(JSON.stringify(component).match(/\{([a-zA-Z0-9_.-]+)\}/g) || [])].map(ref => ref.slice(1,-1));
  return '<div class="inspector-heading">Fælles komponentbibliotek</div><h2>'+escape(component.name)+'</h2><p class="inspector-id">'+escape(id)+'</p><p>'+escape(component.description)+'</p>'+
    '<div class="inspector-section"><h3>Anvendelse</h3><p>'+escape(component.usage)+'</p></div>'+
    (variants.length&&catalogState.expanded!==id ? '<div class="inspector-section variant-picker"><label class="studio-field" for="variant-select">Variant<select id="variant-select" class="studio-input"><option value="" '+(!variantFor(id)?'selected':'')+'>Grundudgave</option>'+variants.map(v=>'<option value="'+escape(v)+'" '+(variantFor(id)===v?'selected':'')+'>'+escape(v)+'</option>').join('')+'</select></label></div>' : '')+
    '<div class="inspector-section"><h3>Dele</h3>'+Object.entries(component.parts).map(([name,part])=>'<div class="property-row"><span>'+escape(name)+'</span><span>'+escape(part.selector)+'</span></div>').join('')+'</div>'+
    (component.composes?.length ? '<div class="inspector-section"><h3>Sammensat af</h3>'+component.composes.map(c=>'<button class="token-ref" type="button" data-component="'+escape(c)+'">'+escape(components()[c]?.name || c)+'</button>').join('')+'</div>' : '')+
    '<div class="inspector-section"><h3>Temaværdier i brug</h3>'+refs.map(ref=>'<button class="token-ref" type="button" data-token="'+escape(ref)+'">'+escape(ref)+'</button>').join('')+'</div>'+
    '<details class="code-details"><summary>Se komponentdefinition</summary><p class="help">Struktur og grundlayout kommer fra det fælles bibliotek. Tilpas temaets værdier under Tokens.</p><pre>'+escape(JSON.stringify(component,null,2))+'</pre></details><div id="validation-errors" class="error-box" hidden></div>';
}
function tokensView() {
  const usage=tokenUsage();
  const groups=new Map();
  for (const [id,token] of Object.entries(themeTokens())) {
    const group=id.split('.')[0];
    if (!groups.has(group)) groups.set(group,[]);
    groups.get(group).push([id,token]);
  }
  return '<div class="canvas-toolbar"><h2>Tokens <span class="count">'+Object.keys(themeTokens()).length+'</span></h2></div><p class="help">I brug omfatter også værdier, der påvirker komponenter gennem andre tokens. Referencer kan stadig bruges i produktets egen kode.</p><div class="token-list">'+[...groups].map(([group,tokens]) => '<section class="token-group"><h3>'+escape(groupName(group))+'</h3>'+tokens.map(([id,token]) => '<button type="button" class="token-item '+(id===state.token?'selected':'')+'" data-token="'+escape(id)+'" aria-pressed="'+(id===state.token)+'"><span class="swatch" data-swatch="'+escape(id)+'"></span><span class="token-name">'+escape(id)+'<small class="token-usage-status" data-usage="'+escape(id)+'">'+escape(usageLabel(usage[id]))+'</small></span><span class="token-value" data-value="'+escape(id)+'">'+escape(token.$value)+'</span></button>').join('')+'</section>').join('')+'</div>';
}
function tokenInspector() {
  const id=state.token, token=themeTokens()[id];
  if (!token) return '<p class="help">Vælg et token.</p>';
  let value=token.$value;try{value=resolveTokens(state.pack)[id];}catch{}
  const hex=token.$type==='color' && /^#[0-9a-f]{6}$/i.test(String(token.$value));
  return '<div class="inspector-heading">Token</div><h2>'+escape(groupName(id.split('.')[0]))+'</h2><p class="inspector-id">'+escape(id)+'</p><div class="property-row"><span>Type</span><span>'+escape(token.$type)+'</span></div><div class="inspector-section">'+field('token-value','Værdi',token.$value)+
    (hex?'<div class="color-editor"><input type="color" id="token-color" value="'+escape(token.$value)+'" aria-label="Vælg farve"><span class="help">Vælg en farve</span></div>':'')+
    '<p class="help">Henvis til et andet token med <code>{token.navn}</code>.</p>'+field('token-description','Beskrivelse',token.description,{textarea:true})+'</div>'+
    '<div class="inspector-section"><h3>Aktuel værdi</h3><div class="token-example" id="token-example">'+escape(value)+'</div></div>'+
    '<div class="inspector-section" id="token-usage-content">'+usageDetails(tokenUsage()[id],components(),escape)+'</div><div id="validation-errors" class="error-box" hidden></div>';
}
function packageView() {
  return '<div class="canvas-toolbar"><h2>Temaets oplysninger</h2></div><section class="meta-panel">'+field('package-name','Navn',state.pack.name)+field('package-description','Beskrivelse',state.pack.description,{textarea:true})+''+(state.pack.schemaVersion === 1 ? '<div class="error-box">Dette er en tidligere designpakke. Konvertér den til et tema for at bruge det fælles bibliotek.<button type="button" class="studio-button" id="migrate-theme">Konvertér til tema</button><p>Konverteringen vises først som en kladde. Eksportér en kopi, eller gem ændringen efter gennemgang.</p></div>' : '')+'<p class="file-info">'+escape(state.file)+'</p><details class="code-details"><summary>Se hele designpakken</summary><pre>'+escape(JSON.stringify(state.pack,null,2))+'</pre></details></section><section class="meta-panel" style="margin-top:18px"><h3>Ændringshistorik</h3>'+(state.pack.history || []).slice().reverse().map(entry=>'<div class="history-entry"><time>'+escape(entry.date)+'</time>'+escape(entry.note)+'</div>').join('')+'</section>';
}
function packageInspector() {
  return '<div class="inspector-heading">Tema</div><h2>Ét bibliotek. Flere temaer.</h2><p>Biblioteket ejer struktur og grundlayout. Temaet giver komponenterne deres visuelle udtryk.</p><div class="inspector-section"><h3>Designgrundlag</h3><p>Projektagnostiske roller med principper fra Fluent 2 og Carbon. Fælles afstande og tastaturfokus fastholdes; målbare kontrastpar kontrolleres, før temaet kan gemmes.</p></div><div class="inspector-section"><h3>Indhold</h3><div class="property-row"><span>Formatversion</span><span>'+state.pack.schemaVersion+'</span></div><div class="property-row"><span>Identitet</span><span>'+escape(state.pack.id)+'</span></div><div class="property-row"><span>Tokens</span><span>'+Object.keys(themeTokens()).length+'</span></div><div class="property-row"><span>Komponenter</span><span>'+Object.keys(components()).length+'</span></div></div><div class="inspector-section"><h3>Eksport</h3><p>Eksportér pakken som JSON, eller hent dens CSS til et produkt.</p><button type="button" class="studio-button" id="download-css">Hent CSS</button></div><div id="validation-errors" class="error-box" hidden></div>';
}
function render() {
  catalogControls?.destroy();
  if (!state.pack) return;
  if (renderedView !== null) viewMemory.capture(root, renderedView);
  inspectorControls?.destroy(); inspectorControls = null;
  compositionGallery?.destroy(); compositionGallery=null;
  readModel = null;
  if(location.protocol !== 'file:') {
    const currentURL=new URL(location.href);currentURL.searchParams.set('package',state.key);currentURL.searchParams.set('view',state.view);currentURL.searchParams.set('mode',state.mode);history.replaceState(null,'',currentURL);
  }
  cssPreview();
  const wideView=['patterns','motion'].includes(state.view);
  root.innerHTML='<a class="studio-skip" href="#studio-content">Gå til indhold</a><div class="shell ds-app-shell"><aside data-scrollbar-surface="inverse" class="sidebar ds-app-navigation" tabindex="0" aria-label="Designsystemets navigation"><div class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Design Studio</div><div><div class="side-label">Designsystem</div><nav class="navigation" aria-label="Design Studio">'+[['brand','Brandguide'],['components','Komponenter'],['patterns','Designmønstre'],['motion','Animation og effekter'],['tokens','Tokens'],['quality','Kvalitet'],['package','Temaet']].map(([view,name])=>'<button type="button" class="nav-item '+(state.view===view?'active':'')+'" data-view="'+view+'" '+(state.view===view?'aria-current="page"':'')+'>'+icon(view)+name+'</button>').join('')+'</nav></div><div class="side-footer"><strong>Fælles struktur. Eget udtryk.</strong>Fælles bibliotek · temaer</div></aside><div class="workspace ds-app-workspace"><header class="topbar ds-app-header"><div class="breadcrumb">Design Studio <span>/</span><strong>'+(state.view==='motion'?'Animation og effekter':state.view==='patterns'?'Designmønstre':state.view==='quality'?'Kvalitet':'Temaer')+'</strong></div><div class="actions"><button type="button" class="studio-button quiet" id="toggle-inspector" aria-controls="studio-inspector"'+(wideView?' hidden':'')+'>'+(inspectorPanel.open?'Skjul egenskaber':'Vis egenskaber')+'</button><button type="button" class="studio-button quiet" id="discard" hidden>Fortryd ændringer</button><button type="button" class="studio-button" id="import">Åbn tema</button><button type="button" class="studio-button primary" id="save">Gem tema</button><input type="file" id="import-file" accept=".json,application/json" hidden></div></header><main id="studio-main" class="ds-app-content studio-main" tabindex="-1" aria-label="Design Studio – indhold"><div class="page-heading"><div><p class="eyebrow">Komponentbibliotek og temaer</p><h1>'+escape(state.pack.name)+'</h1><p class="page-description">'+escape(state.pack.description)+'</p></div><label class="package-picker" for="package-select">Aktivt tema<select id="package-select">'+state.packages.map(pack=>'<option value="'+escape(pack.key)+'" '+(pack.key===state.key?'selected':'')+'>'+escape(pack.name)+'</option>').join('')+'</select></label></div><div class="content ds-panel-layout'+(wideView?' patterns-content':'')+'" data-panel-open="'+(!wideView&&inspectorPanel.open)+'"><section id="studio-content" class="canvas ds-panel-content" tabindex="0" aria-label="Designindhold">'+(state.view==='brand'?brandStudio.content():state.view==='components'?componentsView():state.view==='patterns'?patternsView():state.view==='motion'?renderMotionView(previewTheme(),motionState):state.view==='tokens'?tokensView():state.view==='quality'?qualityStudio.content():packageView())+'</section><button type="button" id="inspector-resize" class="inspector-resize ds-panel-resize" aria-label="Tilpas egenskabspanelets bredde"></button><aside id="studio-inspector" class="inspector ds-panel-side" tabindex="0" aria-label="Egenskaber">'+(state.view==='brand'?brandStudio.inspector():state.view==='components'?componentInspector():wideView?'':state.view==='tokens'?tokenInspector():state.view==='quality'?qualityStudio.inspector():packageInspector())+'</aside></div></main><footer id="status-bar" class="status-bar ds-app-footer" role="status"></footer></div></div>';
  document.querySelectorAll('[data-swatch]').forEach(el=> {
    const id=el.dataset.swatch;
    if(themeTokens()[id].$type==='color') {try {el.style.backgroundColor=resolveTokens(state.pack)[id];}catch{}}
    else el.textContent=themeTokens()[id].$type==='fontFamily'?'Aa':'';
  });
  const exampleHost = document.querySelector('#project-overview-host');
  if (exampleHost) exampleHost.replaceChildren(createProjectOverview(previewTheme(), { document, draft: exampleDraft, announce: message => { document.querySelector('#announcer').textContent = message; }, idPrefix: 'studio-example' }));
  const compositionHost=document.querySelector('#compositions-host');
  if(compositionHost) {
    compositionGallery=mountCompositionGallery(previewTheme(),{document,state:galleryState,announce:message=>{document.querySelector('#announcer').textContent=message;},idPrefix:'studio-patterns'});
    compositionHost.append(compositionGallery.element);
  }
  bind();
  refreshStatus();
  if (!wideView) {
    inspectorControls = mountPanelControls({
      container: root.querySelector('.ds-panel-layout'), panel: root.querySelector('#studio-inspector'),
      handle: root.querySelector('#inspector-resize'), toggle: root.querySelector('#toggle-inspector'),
      width: inspectorPanel.width, open: inspectorPanel.open, document,
      onChange: value => {
        Object.assign(inspectorPanel, value);
        root.querySelector('#toggle-inspector').textContent = value.open ? 'Skjul egenskaber' : 'Vis egenskaber';
      },
    });
  }
  renderedView = state.view + ':' + state.mode;
  viewMemory.restore(root, renderedView);
}
async function load(key, checkCompatibility=false) {
  const data=await themeStorage.read(key);
  const checked=validatePackage(data.package);
  if(!checked.valid) throw new Error('Pakken er ugyldig:\n'+checked.errors.join('\n'));
  // Browsing shared-library themes does not replace a product token contract.
  if(checkCompatibility && state.pack && (state.pack.schemaVersion!==2 || data.package.schemaVersion!==2)) {
    const comparison=validateCompatibility(state.pack,data.package);
    if(!comparison.compatible) notice('Pakken kan inspiceres, men er ikke fuldt kompatibel med den forrige pakke. Se formatets sammenligningsværktøj.',true);
  }
  state.pack=data.package;readModel=null;lastValidModel=null;lastPreviewTheme=null;state.key=key;state.file=data.file;state.saved=JSON.stringify(state.pack);state.recipeDraft=null;state.error='';state.variants={};
  if(!components()[state.component]) state.component=Object.keys(components())[0];
  if(!themeTokens()[state.token]) state.token=Object.keys(themeTokens())[0];
  render();
}
function allowNavigation() {
  if(state.recipeDraft!==null) { notice('Anvend komponentopskriften, eller fortryd ændringerne, før du skifter visning.',true);return false; }
  return true;
}
function edited() {
  readModel = null; qualityStudio.invalidate(); cssPreview();refreshStatus();
  if(state.view==='tokens'){
    const usage=tokenUsage();
    document.querySelectorAll('[data-usage]').forEach(node=>{node.textContent=usageLabel(usage[node.dataset.usage]);});
    const details=document.querySelector('#token-usage-content');
    if(details){details.innerHTML=usageDetails(usage[state.token],components(),escape);bindInspectionLinks(details);}
  }
}
function changeToken(value) {
  const token=editableToken();
  token.$value=['fontWeight','number'].includes(token.$type) && value.trim()!=='' && Number.isFinite(Number(value)) ? Number(value) : value;
  edited();
  const row=document.querySelector('[data-value="'+CSS.escape(state.token)+'"]');if(row)row.textContent=value;
  const hex=document.querySelector('#token-color');if(hex && /^#[0-9a-f]{6}$/i.test(value))hex.value=value;
  try {
    const resolved=resolveTokens(state.pack);
    const el=document.querySelector('#token-example');if(el)el.textContent=resolved[state.token];
    document.querySelectorAll('[data-swatch]').forEach(el=>{if(themeTokens()[el.dataset.swatch].$type==='color')el.style.backgroundColor=resolved[el.dataset.swatch];});
  }catch{}
}
function download(name,body,type) {
  downloadFile(name,body,type);
}
function bindInspectionLinks(scope=document){
  scope.querySelectorAll('[data-component]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.component=el.dataset.component;state.view='components';render();}}));
  scope.querySelectorAll('[data-token]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.token=el.dataset.token;state.view='tokens';render();}}));
}
function bind() {
  catalogControls=bindComponentCatalog(root,{state:state.view==='motion'?motionState:catalogState,allowNavigation,onChange(id){if(state.view!=='motion')state.component=id;render();}});
  document.querySelector('#migrate-theme')?.addEventListener('click', () => {
    try { state.pack = migratePackage(state.pack); state.variants = {}; render(); notice('Temaet er konverteret som en kladde. Gennemgå det, og gem eller eksportér.'); }
    catch (error) { notice(error.message, true); }
  });
  brandStudio.bind();
  qualityStudio.bind();
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.view=el.dataset.view;render();}}));
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.mode=el.dataset.mode;render();}}));
  bindInspectionLinks();
  document.querySelector('#package-select').addEventListener('change',async event=>{
    if(dirty() && !confirm('Du har ændringer, der ikke er gemt. Vil du skifte pakke og kassere ændringerne?')){event.target.value=state.key;return;}
    try{await load(event.target.value,true);}catch(error){event.target.value=state.key;notice(error.message,true);}
  });
  document.querySelector('#save').addEventListener('click',async()=>{
    if(!validation().valid||state.recipeDraft!==null)return;
    state.busy=true;refreshStatus();
    try{
      const candidate=clone(state.pack);
      if(dirty()) {
        candidate.history ||= [];
        candidate.history.push({date:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),note:'Designpakken blev opdateret i Design Studio.'});
      }
      const data=await themeStorage.save(state.key,candidate);
      state.pack=data.package;state.saved=JSON.stringify(state.pack);state.file=data.file;
      const summary=state.packages.find(p=>p.key===state.key);if(summary){summary.name=state.pack.name;summary.description=state.pack.description;}
      render();notice('Temaets JSON-fil er sendt til browserens downloads. Gem den dér, hvor du vil opbevare temaet.');
    }catch(error){notice(error.message,true);}finally{state.busy=false;refreshStatus();}
  });
  document.querySelector('#discard').addEventListener('click',()=>{if(confirm('Vil du kassere de ændringer, der ikke er gemt?')){state.pack=JSON.parse(state.saved);state.recipeDraft=null;render();}});
  document.querySelector('#import').addEventListener('click',()=>document.querySelector('#import-file').click());
  document.querySelector('#import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    if(dirty()&&!confirm('Du har ændringer, der ikke er gemt. Vil du indlæse en pakke og kassere ændringerne?'))return;
    try{
      const pack=await readJSONFile(file,{maxBytes:1024*1024,validate:validatePackage});
      const data=await themeStorage.open(pack,file.name);
      const list=await themeStorage.list();state.packages=list.packages;
      await load(data.key);notice('Temaet er åbnet. Gem tema henter den redigerede fil.');
    }catch(error){notice(error.message,true);}finally{event.target.value='';}
  });
  document.querySelector('#token-value')?.addEventListener('input',event=>changeToken(event.target.value));
  document.querySelector('#token-color')?.addEventListener('input',event=>{document.querySelector('#token-value').value=event.target.value;changeToken(event.target.value);});
  document.querySelector('#token-description')?.addEventListener('input',event=>{editableToken().description=event.target.value;edited();});
  document.querySelector('#variant-select')?.addEventListener('change',event=>{state.variants[state.component]=event.target.value;render();});
  document.querySelector('#package-name')?.addEventListener('input',event=>{state.pack.name=event.target.value;document.querySelector('h1').textContent=event.target.value;edited();});
  document.querySelector('#package-description')?.addEventListener('input',event=>{state.pack.description=event.target.value;document.querySelector('.page-description').textContent=event.target.value;edited();});
  document.querySelector('#download-css')?.addEventListener('click',()=>{if(!validation().valid||state.recipeDraft!==null){notice('Ret fejlene før du henter CSS.',true);return;}download(state.pack.id+'.css',generateCSS(state.pack),'text/css');});
}
window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
async function startStudio() {
try{
  const data=await themeStorage.list();state.packages=data.packages;
  const params=new URLSearchParams(location.search);
  const requested=params.get('package');
  if(['catalog','example'].includes(params.get('mode')))state.mode=params.get('mode');
  if(['brand','components','patterns','motion','tokens','quality','package'].includes(params.get('view')))state.view=params.get('view');
  if(params.get('mode')==='patterns')state.view='patterns';
  const first=data.packages.find(p=>p.key===requested)?.key || data.packages.find(p=>p.id==='studio-light')?.key || data.packages[0]?.key;
  if(!first)throw new Error('Der er ingen designpakker. Tilføj en pakke i mappen packages, og åbn Design Studio igen.');
  await load(first);
}catch(error){
  root.innerHTML='<main class="loading"><h1>Design Studio kunne ikke åbnes</h1><p>'+escape(error.message)+'</p><button class="studio-button" id="retry">Prøv igen</button></main>';
  document.querySelector('#retry').addEventListener('click',()=>location.reload());
}
}
startStudio();

