import { createBrandStudio } from '/brand.mjs';

import { validatePackage, resolveTokens, generateCSS, validateCompatibility, getComponents, materializePackage, migratePackage } from '/core/engine.mjs';

import { renderComponent } from '/core/components.mjs';
import { DEFAULT_TOKENS, COMPONENT_LIBRARY } from '/core/library.mjs';
import { createProjectOverview, createProjectOverviewDraft } from '/project-overview.mjs';

const root = document.querySelector('#app');
const state = { packages: [], key: null, file: '', revision: null, pack: null, saved: '', view: 'components', mode: 'catalog', component: 'button', token: null, variants: {}, recipeDraft: null, error: '', busy: false };
const exampleDraft = createProjectOverviewDraft();
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = value => structuredClone(value);
const brandStudio = createBrandStudio(state, {escape, field, edited, render, notice, allowNavigation, download});
const icon = name => {
  const paths = { brand:'<path d="M4 5h16v14H4zM8 9h8M8 13h5"/><path d="m17 15 2 2"/>', components:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', tokens:'<path d="M12 3 21 8v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8"/>', package:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>' };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[name]+'</svg>';
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
const editableToken = () => state.pack.tokens[state.token] ||= clone(themeTokens()[state.token]);
const dirty = () => state.pack && (JSON.stringify(state.pack) !== state.saved || state.recipeDraft !== null);
const validation = () => state.pack ? validatePackage(state.pack) : { valid: false, errors: [] };
const groupName = id => ({color:'Farver',typography:'Typografi',space:'Afstande',radius:'Hjørner',shadow:'Skygger',duration:'Overgange',border:'Kanter',size:'Størrelser',opacity:'Gennemsigtighed'})[id] || id;
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error([data.error || 'Handlingen kunne ikke gennemføres.', ...(data.errors || [])].join('\n'));
  return data;
}
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
  lastPreviewTheme = clone(state.pack);
  return checked;
}
function refreshStatus() {
  const checked = validation();
  const bar = document.querySelector('#status-bar');
  if (!bar) return;
  const invalid = !checked.valid || state.recipeDraft !== null;
  bar.className = 'status-bar'+(!checked.valid ? ' error' : dirty() ? ' changed' : '');
  const message = !checked.valid ? 'Ret de værdier, der bryder temaets designregler, før du gemmer.' : state.recipeDraft !== null ? 'Komponentopskriften skal anvendes før du gemmer.' : dirty() ? 'Ændringerne er endnu ikke gemt.' : 'Temaet er gemt. Ændringer vises straks i eksemplerne.';
  bar.innerHTML = '<span>'+escape(message)+'</span><span>'+Object.keys(themeTokens()).length+' tokens · '+Object.keys(components()).length+' komponenter</span>';
  const save = document.querySelector('#save');
  if (save) save.disabled = !dirty() || invalid || state.busy;
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
function componentsView() {
  const entries = Object.entries(components());
  const toolbar = '<div class="canvas-toolbar"><h2>Komponenter <span class="count">'+entries.length+'</span></h2><div class="segmented" aria-label="Visning"><button type="button" data-mode="catalog" class="'+(state.mode==='catalog'?'active':'')+'" aria-pressed="'+(state.mode==='catalog')+'">Bibliotek</button><button type="button" data-mode="example" class="'+(state.mode==='example'?'active':'')+'" aria-pressed="'+(state.mode==='example')+'">Samlet eksempel</button></div></div>';
  if (state.mode === 'example' && state.pack.schemaVersion === 2) return toolbar+'<div id="project-overview-host"></div><p class="help">Samme samlede eksempel som i web-showcasen. Prøv temaer, indstillinger og et nyt projekt her.</p>';
  if (state.mode === 'example') return toolbar+'<div class="example-stage ds-scope"><div class="example-width"><div class="example-header"><div><p class="preview-copy preview-muted">Din samling</p><h2 class="ds-heading">Næste gode idé</h2></div><span class="ds-badge" data-variant="default">Kladde</span></div>'+cardMarkup('example')+'<div class="ds-card" data-variant="default"><header class="ds-card__header"><h3 class="preview-title">Gør den til din</h3></header><div class="ds-card__body"><div class="example-fields">'+dsField('Titel','Min nye samling','example-title')+dsField('Beskrivelse','Noter og inspiration','example-description')+'</div></div><footer class="ds-card__footer">'+button('Gem samling')+button('Annuller','secondary')+'</footer></div></div></div><p class="help">Samme komponenter og indhold, uanset hvilket tema du vælger.</p>';
  return toolbar+'<div class="component-grid">'+entries.map(([id,component]) => '<article class="specimen '+(state.component===id?'selected':'')+'"><button type="button" class="specimen-label" data-component="'+escape(id)+'" aria-pressed="'+(state.component===id)+'"><span>'+escape(component.name)+'</span><span>'+escape(id)+'</span></button><div class="specimen-preview ds-scope">'+specimen(id)+'</div></article>').join('')+'</div>';
}
function componentInspector() {
  const id = state.component, component = components()[id];
  if (!component) return '<p class="help">Vælg en komponent.</p>';
  const variants = Object.keys(component.variants || {});
  const refs = [...new Set(JSON.stringify(component).match(/\{([a-zA-Z0-9_.-]+)\}/g) || [])].map(ref => ref.slice(1,-1));
  return '<div class="inspector-heading">Fælles komponentbibliotek</div><h2>'+escape(component.name)+'</h2><p class="inspector-id">'+escape(id)+'</p><p>'+escape(component.description)+'</p>'+
    '<div class="inspector-section"><h3>Anvendelse</h3><p>'+escape(component.usage)+'</p></div>'+
    (variants.length ? '<div class="inspector-section variant-picker"><label class="studio-field" for="variant-select">Variant<select id="variant-select" class="studio-input"><option value="" '+(!variantFor(id)?'selected':'')+'>Grundudgave</option>'+variants.map(v=>'<option value="'+escape(v)+'" '+(variantFor(id)===v?'selected':'')+'>'+escape(v)+'</option>').join('')+'</select></label></div>' : '')+
    '<div class="inspector-section"><h3>Dele</h3>'+Object.entries(component.parts).map(([name,part])=>'<div class="property-row"><span>'+escape(name)+'</span><span>'+escape(part.selector)+'</span></div>').join('')+'</div>'+
    (component.composes?.length ? '<div class="inspector-section"><h3>Sammensat af</h3>'+component.composes.map(c=>'<button class="token-ref" type="button" data-component="'+escape(c)+'">'+escape(components()[c]?.name || c)+'</button>').join('')+'</div>' : '')+
    '<div class="inspector-section"><h3>Temaværdier i brug</h3>'+refs.map(ref=>'<button class="token-ref" type="button" data-token="'+escape(ref)+'">'+escape(ref)+'</button>').join('')+'</div>'+
    '<details class="code-details"><summary>Se komponentdefinition</summary><p class="help">Struktur og grundlayout kommer fra det fælles bibliotek. Tilpas temaets værdier under Tokens.</p><pre>'+escape(JSON.stringify(component,null,2))+'</pre></details><div id="validation-errors" class="error-box" hidden></div>';
}
function tokensView() {
  let resolved={}; try {resolved=resolveTokens(state.pack);} catch {}
  const groups=new Map();
  for (const [id,token] of Object.entries(themeTokens())) {
    const group=id.split('.')[0];
    if (!groups.has(group)) groups.set(group,[]);
    groups.get(group).push([id,token]);
  }
  return '<div class="canvas-toolbar"><h2>Tokens <span class="count">'+Object.keys(themeTokens()).length+'</span></h2></div><div class="token-list">'+[...groups].map(([group,tokens]) => '<section class="token-group"><h3>'+escape(groupName(group))+'</h3>'+tokens.map(([id,token]) => '<button type="button" class="token-item '+(id===state.token?'selected':'')+'" data-token="'+escape(id)+'" aria-pressed="'+(id===state.token)+'"><span class="swatch" data-swatch="'+escape(id)+'"></span><span class="token-name">'+escape(id)+'</span><span class="token-value" data-value="'+escape(id)+'">'+escape(token.$value)+'</span></button>').join('')+'</section>').join('')+'</div>';
}
function tokenInspector() {
  const id=state.token, token=themeTokens()[id];
  if (!token) return '<p class="help">Vælg et token.</p>';
  let value=token.$value;try{value=resolveTokens(state.pack)[id];}catch{}
  const users=Object.entries(components()).filter(([,component])=>JSON.stringify(component).includes('{'+id+'}'));
  const aliases=Object.entries(themeTokens()).filter(([,t])=>t.$value==='{'+id+'}');
  const hex=token.$type==='color' && /^#[0-9a-f]{6}$/i.test(String(token.$value));
  return '<div class="inspector-heading">Token</div><h2>'+escape(groupName(id.split('.')[0]))+'</h2><p class="inspector-id">'+escape(id)+'</p><div class="property-row"><span>Type</span><span>'+escape(token.$type)+'</span></div><div class="inspector-section">'+field('token-value','Værdi',token.$value)+
    (hex?'<div class="color-editor"><input type="color" id="token-color" value="'+escape(token.$value)+'" aria-label="Vælg farve"><span class="help">Vælg en farve</span></div>':'')+
    '<p class="help">Henvis til et andet token med <code>{token.navn}</code>.</p>'+field('token-description','Beskrivelse',token.description,{textarea:true})+'</div>'+
    '<div class="inspector-section"><h3>Aktuel værdi</h3><div class="token-example" id="token-example">'+escape(value)+'</div></div>'+
    '<div class="inspector-section"><h3>Bruges af</h3>'+(users.length?users.map(([id,component])=>'<button type="button" class="token-ref" data-component="'+escape(id)+'">'+escape(component.name)+'</button>').join(''):'<p class="help">Ingen direkte komponenthenvisninger.</p>')+
    aliases.map(([alias])=>'<button type="button" class="token-ref" data-token="'+escape(alias)+'">'+escape(alias)+'</button>').join('')+'</div><div id="validation-errors" class="error-box" hidden></div>';
}
function packageView() {
  return '<div class="canvas-toolbar"><h2>Temaets oplysninger</h2></div><section class="meta-panel">'+field('package-name','Navn',state.pack.name)+field('package-description','Beskrivelse',state.pack.description,{textarea:true})+''+(state.pack.schemaVersion === 1 ? '<div class="error-box">Dette er en tidligere designpakke. Konvertér den til et tema for at bruge det fælles bibliotek.<button type="button" class="studio-button" id="migrate-theme">Konvertér til tema</button><p>Konverteringen vises først som en kladde. Eksportér en kopi, eller gem ændringen efter gennemgang.</p></div>' : '')+'<p class="file-info">'+escape(state.file)+'</p><details class="code-details"><summary>Se hele designpakken</summary><pre>'+escape(JSON.stringify(state.pack,null,2))+'</pre></details></section><section class="meta-panel" style="margin-top:18px"><h3>Ændringshistorik</h3>'+(state.pack.history || []).slice().reverse().map(entry=>'<div class="history-entry"><time>'+escape(entry.date)+'</time>'+escape(entry.note)+'</div>').join('')+'</section>';
}
function packageInspector() {
  return '<div class="inspector-heading">Tema</div><h2>Ét bibliotek. Flere temaer.</h2><p>Biblioteket ejer struktur og grundlayout. Temaet giver komponenterne deres visuelle udtryk.</p><div class="inspector-section"><h3>Designgrundlag</h3><p>Projektagnostiske roller med principper fra Fluent 2 og Carbon. Fælles afstande og tastaturfokus fastholdes; målbare kontrastpar kontrolleres, før temaet kan gemmes.</p></div><div class="inspector-section"><h3>Indhold</h3><div class="property-row"><span>Formatversion</span><span>'+state.pack.schemaVersion+'</span></div><div class="property-row"><span>Identitet</span><span>'+escape(state.pack.id)+'</span></div><div class="property-row"><span>Tokens</span><span>'+Object.keys(themeTokens()).length+'</span></div><div class="property-row"><span>Komponenter</span><span>'+Object.keys(components()).length+'</span></div></div><div class="inspector-section"><h3>Eksport</h3><p>Eksportér pakken som JSON, eller hent dens CSS til et produkt.</p><button type="button" class="studio-button" id="download-css">Hent CSS</button></div><div id="validation-errors" class="error-box" hidden></div>';
}
function render() {
  if (!state.pack) return;
  readModel = null;
  const currentURL=new URL(location.href);currentURL.searchParams.set('package',state.key);currentURL.searchParams.set('view',state.view);currentURL.searchParams.set('mode',state.mode);history.replaceState(null,'',currentURL);
  cssPreview();
  root.innerHTML='<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Design Studio</div><div><div class="side-label">Designsystem</div><nav class="navigation" aria-label="Design Studio">'+[['brand','Brandguide'],['components','Komponenter'],['tokens','Tokens'],['package','Temaet']].map(([view,name])=>'<button type="button" class="nav-item '+(state.view===view?'active':'')+'" data-view="'+view+'" '+(state.view===view?'aria-current="page"':'')+'>'+icon(view)+name+'</button>').join('')+'</nav></div><div class="side-footer"><strong>Fælles struktur. Eget udtryk.</strong>Fælles bibliotek · temaer</div></aside><main class="workspace"><header class="topbar"><div class="breadcrumb">Design Studio <span>/</span><strong>Temaer</strong></div><div class="actions"><button type="button" class="studio-button quiet" id="discard" hidden>Fortryd ændringer</button><button type="button" class="studio-button" id="import">Importér tema</button><button type="button" class="studio-button" id="export">Eksportér</button><button type="button" class="studio-button primary" id="save">Gem ændringer</button><input type="file" id="import-file" accept=".json,application/json" hidden></div></header><div class="page-heading"><div><p class="eyebrow">Komponentbibliotek og temaer</p><h1>'+escape(state.pack.name)+'</h1><p class="page-description">'+escape(state.pack.description)+'</p></div><label class="package-picker" for="package-select">Aktivt tema<select id="package-select">'+state.packages.map(pack=>'<option value="'+escape(pack.key)+'" '+(pack.key===state.key?'selected':'')+'>'+escape(pack.name)+'</option>').join('')+'</select></label></div><div class="content"><section class="canvas" aria-label="Designindhold">'+(state.view==='brand'?brandStudio.content():state.view==='components'?componentsView():state.view==='tokens'?tokensView():packageView())+'</section><aside class="inspector" aria-label="Egenskaber">'+(state.view==='brand'?brandStudio.inspector():state.view==='components'?componentInspector():state.view==='tokens'?tokenInspector():packageInspector())+'</aside></div><footer id="status-bar" class="status-bar" role="status"></footer></main></div>';
  document.querySelectorAll('[data-swatch]').forEach(el=> {
    const id=el.dataset.swatch;
    if(themeTokens()[id].$type==='color') {try {el.style.backgroundColor=resolveTokens(state.pack)[id];}catch{}}
    else el.textContent=themeTokens()[id].$type==='fontFamily'?'Aa':'';
  });
  const exampleHost = document.querySelector('#project-overview-host');
  if (exampleHost) exampleHost.replaceChildren(createProjectOverview(previewTheme(), { document, draft: exampleDraft, announce: message => { document.querySelector('#announcer').textContent = message; }, idPrefix: 'studio-example' }));
  bind();
  refreshStatus();
}
async function load(key, checkCompatibility=false) {
  const data=await request('/api/packages/'+encodeURIComponent(key));
  const checked=validatePackage(data.package);
  if(!checked.valid) throw new Error('Pakken er ugyldig:\n'+checked.errors.join('\n'));
  // Browsing shared-library themes does not replace a product token contract.
  if(checkCompatibility && state.pack && (state.pack.schemaVersion!==2 || data.package.schemaVersion!==2)) {
    const comparison=validateCompatibility(state.pack,data.package);
    if(!comparison.compatible) notice('Pakken kan inspiceres, men er ikke fuldt kompatibel med den forrige pakke. Se formatets sammenligningsværktøj.',true);
  }
  state.pack=data.package;readModel=null;lastValidModel=null;lastPreviewTheme=null;state.key=key;state.file=data.file;state.revision=data.revision;state.saved=JSON.stringify(state.pack);state.recipeDraft=null;state.error='';state.variants={};
  if(!components()[state.component]) state.component=Object.keys(components())[0];
  if(!themeTokens()[state.token]) state.token=Object.keys(themeTokens())[0];
  render();
}
function allowNavigation() {
  if(state.recipeDraft!==null) { notice('Anvend komponentopskriften, eller fortryd ændringerne, før du skifter visning.',true);return false; }
  return true;
}
function edited() { readModel = null; cssPreview();refreshStatus(); }
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
  const url=URL.createObjectURL(new Blob([body],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function bind() {
  document.querySelector('#migrate-theme')?.addEventListener('click', () => {
    try { state.pack = migratePackage(state.pack); state.variants = {}; render(); notice('Temaet er konverteret som en kladde. Gennemgå det, og gem eller eksportér.'); }
    catch (error) { notice(error.message, true); }
  });
  brandStudio.bind();
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.view=el.dataset.view;render();}}));
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.mode=el.dataset.mode;render();}}));
  document.querySelectorAll('[data-component]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.component=el.dataset.component;state.view='components';render();}}));
  document.querySelectorAll('[data-token]').forEach(el=>el.addEventListener('click',()=>{if(allowNavigation()){state.token=el.dataset.token;state.view='tokens';render();}}));
  document.querySelector('#package-select').addEventListener('change',async event=>{
    if(dirty() && !confirm('Du har ændringer, der ikke er gemt. Vil du skifte pakke og kassere ændringerne?')){event.target.value=state.key;return;}
    try{await load(event.target.value,true);}catch(error){event.target.value=state.key;notice(error.message,true);}
  });
  document.querySelector('#save').addEventListener('click',async()=>{
    if(!validation().valid||state.recipeDraft!==null)return;
    state.busy=true;refreshStatus();
    try{
      const candidate=clone(state.pack);
      candidate.history ||= [];
      candidate.history.push({date:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),note:'Designpakken blev opdateret i Design Studio.'});
      const data=await request('/api/packages/'+encodeURIComponent(state.key),{method:'PUT',headers:{'Content-Type':'application/json','If-Match':state.revision},body:JSON.stringify(candidate)});
      state.pack=data.package;state.saved=JSON.stringify(state.pack);state.file=data.file;state.revision=data.revision;
      const summary=state.packages.find(p=>p.key===state.key);if(summary){summary.name=state.pack.name;summary.description=state.pack.description;}
      render();notice('Designpakken er gemt.');
    }catch(error){notice(error.message,true);}finally{state.busy=false;refreshStatus();}
  });
  document.querySelector('#discard').addEventListener('click',()=>{if(confirm('Vil du kassere de ændringer, der ikke er gemt?')){state.pack=JSON.parse(state.saved);state.recipeDraft=null;render();}});
  document.querySelector('#export').addEventListener('click',()=>{
    if(!validation().valid||state.recipeDraft!==null){notice('Ret de ugyldige værdier og anvend opskriften før eksport.',true);return;}
    download(state.pack.id+'.json',JSON.stringify(state.pack,null,2)+'\n','application/json');
  });
  document.querySelector('#import').addEventListener('click',()=>document.querySelector('#import-file').click());
  document.querySelector('#import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    if(dirty()&&!confirm('Du har ændringer, der ikke er gemt. Vil du indlæse en pakke og kassere ændringerne?'))return;
    try{
      if(file.size>1024*1024)throw new Error('Pakken må højst fylde 1 MB.');
      const pack=JSON.parse((await file.text()).replace(/^\uFEFF/,''));
      const checked=validatePackage(pack);if(!checked.valid)throw new Error(checked.errors.join('\n'));
      const data=await request('/api/packages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pack)});
      const list=await request('/api/packages');state.packages=list.packages;
      await load(data.key);notice('Pakken er indlæst som en kopi i Design Studio.');
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
try{
  const data=await request('/api/packages');state.packages=data.packages;
  const params=new URLSearchParams(location.search);
  const requested=params.get('package');
  if(['catalog','example'].includes(params.get('mode')))state.mode=params.get('mode');
  if(['brand','components','tokens','package'].includes(params.get('view')))state.view=params.get('view');
  const first=data.packages.find(p=>p.key===requested)?.key || data.activeProject || data.packages.find(p=>p.id==='studio-light')?.key || data.packages[0]?.key;
  if(!first)throw new Error('Der er ingen designpakker. Tilføj en pakke i mappen packages, og åbn Design Studio igen.');
  await load(first);
}catch(error){
  root.innerHTML='<main class="loading"><h1>Design Studio kunne ikke åbnes</h1><p>'+escape(error.message)+'</p><button class="studio-button" id="retry">Prøv igen</button></main>';
  document.querySelector('#retry').addEventListener('click',()=>location.reload());
}

