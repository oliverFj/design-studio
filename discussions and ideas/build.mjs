import { readFile, writeFile, readdir } from 'node:fs/promises';
import { generateCSS } from '../core/engine.mjs';
import { renderComponent } from '../core/components.mjs';
import { COMPONENT_LIBRARY } from '../core/library.mjs';

const here = new URL('./', import.meta.url);
const themes = [];
for (const file of (await readdir(new URL('../packages/', here))).filter(name => name.endsWith('.json'))) {
  const theme = JSON.parse(await readFile(new URL('../packages/' + file, here), 'utf8'));
  themes.push({ id: theme.id, name: theme.name, css: generateCSS(theme, { scope: '.demo-scope' }) });
}
const theme = JSON.parse(await readFile(new URL('../packages/studio-light.json', here), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const destinations = {
  primary: ['Primary', 'Bevar som det vigtigste valg.'],
  secondary: ['Tertiary', 'Den nuværende lyse, indrammede knap flyttes hertil. Ny secondary får en solid neutral flade.'],
  ghost: ['Ghost', 'Bevar som den mindst fremtrædende knap.'],
  danger: ['intent: danger', 'Destruktiv betydning kombineres med primary, tertiary eller ghost.'],
  accent: ['Primary + tema', 'Farvemæssig fremhævning kommer fra temaet; ingen konkurrerende primær rolle.'],
  desktop: ['size: small', '32 px vælges uafhængigt af fremhævelsen.'],
  toolbar: ['Ghost + small', 'Værktøjslinjen ejer placeringen.'],
  icon: ['iconOnly', 'Samme knap med tilgængeligt navn og kvadratisk klikflade.'],
  menu: ['menu-item', 'Genbrug den eksisterende rolle til menupunkter.'],
  dismiss: ['Ghost + iconOnly', 'Luk er en handling og et ikon, ikke en selvstændig fremhævelse.'],
  'list-item': ['Særskilt listehandling', 'Bevar heading/description-anatomien i en særskilt rolle; migrér ikke blindt til en almindelig knap.'],
  link: ['Ghost', 'Udfas det tvetydige variantnavn. Almindelig navigation i tekst bruger linkrollen.'],
  'danger-subtle': ['Ghost + danger', 'Samme destruktive betydning med mindre visuel vægt.'],
  rounded: ['Temaets radius', 'Form er en temaværdi, ikke en handlingstype.'],
  'dismiss-small': ['Ghost + iconOnly + small', 'Én lukkeadfærd med valgt størrelse.'],
  compact: ['size: small', 'Størrelse skal ikke samtidig vælge neutral fremhævelse.'],
  'dismiss-compact': ['Ghost + iconOnly + small', 'Samles med de øvrige lukkeknapper.'],
};
const audit = Object.keys(COMPONENT_LIBRARY.button.variants).map(id => {
  const [target, reason] = destinations[id];
  const example = renderComponent(theme, 'button', { variant: id, text: id === 'primary' ? 'Gem ændringer' : id === 'link' ? 'Læs mere' : 'Eksempel' });
  return `<tr><th scope="row"><code>${id}</code></th><td class="current-sample">${example}</td><td><strong>${escape(target)}</strong><p>${escape(reason)}</p></td></tr>`;
}).join('');
const proposedButton = (kind, label = 'Gem ændringer') => `<button type="button" class="p-btn" data-kind="${kind}" data-feedback="Prøve af ${kind}-knappen.">${label}</button>`;
const catalogCards = ['button', 'field', 'badge', 'card', 'text', 'image'].map(id => {
  const component = COMPONENT_LIBRARY[id];
  const variants = id === 'button' ? ['primary', 'secondary', 'tertiary', 'ghost'] : [...new Set(['default', ...Object.keys(component.variants)])];
  const sample = (variant, prefix) => id === 'button' ? proposedButton(variant) : renderComponent(theme, id, {
    ...(variant !== 'default' ? { variant } : {}), idPrefix: prefix,
    ...(id === 'field' ? { label: 'Projektnavn', value: 'Mit arbejdsområde', hint: 'Et kort, genkendeligt navn.', ...(variant === 'invalid' ? { error: 'Angiv et gyldigt projektnavn.' } : {}) } : {}),
    ...(id === 'text' ? { text: 'En kort beskrivelse af indholdet.' } : {}),
  });
  const name = id === 'button' ? 'Knap · forslag' : component.name;
  return `<article class="fold-card" data-component="${id}">
    <h3 class="fold-heading"><button type="button" class="fold-toggle" id="fold-${id}-toggle" aria-expanded="false" aria-controls="fold-${id}-panel"><span><b>${escape(name)}</b><code>${id}</code></span><span class="fold-toggle-meta"><span>${variants.length} varianter</span><span class="fold-action">Vis varianter</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></span></button></h3>
    <div class="fold-preview">${sample(id === 'button' ? 'primary' : 'default', 'fold-' + id + '-preview')}</div>
    <div class="fold-panel" id="fold-${id}-panel" role="region" aria-labelledby="fold-${id}-toggle" hidden>
      <div class="fold-panel-toolbar"><div class="segmented" role="group" aria-label="Visning for ${escape(name)}"><button type="button" data-fold-view="variants" aria-pressed="true">Varianter</button>${id === 'button' ? '<button type="button" data-fold-view="states" aria-pressed="false">Tilstande</button>' : ''}</div><p>${id === 'button' ? 'Fire fremhævelser. Se deres fælles adfærd under Tilstande.' : 'Alle nuværende varianter fra det fælles bibliotek.'}</p></div>
      <div class="fold-variants">${variants.map(variant => `<section class="fold-variant"><h4>${escape(variant)}</h4><div class="fold-sample">${sample(variant, 'fold-' + id + '-' + variant)}</div></section>`).join('')}</div>
      ${id === 'button' ? '<div class="fold-states" hidden><p class="fold-state-hint">Tilstandene vises fast. Rul vandret, hvis hele tabellen ikke kan være der.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Knapkortets tilstandstabel, kan rulles vandret"></div></div>' : ''}
    </div></article>`;
}).join('');
let html = await readFile(new URL('src/index.html', here), 'utf8');
html = html.replace('/*__PAGE_CSS__*/', await readFile(new URL('src/styles.css', here), 'utf8'));
html = html.replace('/*__THEME_CSS__*/', themes.find(t => t.id === 'studio-light').css);
html = html.replace('<!--__THEMES__-->', themes.map(t => `<option value="${escape(t.id)}"${t.id === 'studio-light' ? ' selected' : ''}>${escape(t.name)}</option>`).join(''));
html = html.replace('<!--__AUDIT__-->', audit);
html = html.replace('<!--__CATALOG_CARDS__-->', catalogCards);
html = html.replace('<!--__OLD_HERO__-->', renderComponent(theme, 'link', { text: 'Udforsk samlingen', href: '#samling', variant: 'action' }) + renderComponent(theme, 'link', { text: 'Kontakt os', href: '#kontakt', variant: 'navigation' }));
const data = JSON.stringify(themes).replace(/</g, '\\u003c');
html = html.replace('/*__APP__*/', 'const themeData = ' + data + ';\n' + await readFile(new URL('src/app.js', here), 'utf8'));
await writeFile(new URL('index.html', here), html);
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
if (/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i.test(html)) throw new Error('Udkastet må ikke indlæse eksterne ressourcer.');
console.log('Bygget: discussions and ideas/index.html · selvstændigt udkast · ' + themes.length + ' indbyggede temaer');
