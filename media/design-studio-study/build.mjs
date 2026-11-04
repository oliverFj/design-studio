import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {generateCSS, resolveTokens} from '../../core/engine.mjs';
import {renderComponent, renderIcon} from '../../core/components.mjs';
import {resolveThemeMode} from '../../core/theme-modes.mjs';
import {buildStudio} from '../../tools/build-studio.mjs';

export const output = fileURLToPath(new URL('../../artifacts/product-media/design-studio/', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));
const themes = {};
for (const [key, id, mode] of [['studio','studio-light','light'], ['castle','castle-studio','light'], ['night','nocturne','dark']]) {
  themes[key] = resolveThemeMode(JSON.parse(await readFile(path.join(root, 'packages', id + '.json'), 'utf8')), mode);
}
const css = await readFile(new URL('./covers.css', import.meta.url), 'utf8');
const themeCSS = Object.entries(themes).map(([key, theme]) => generateCSS(theme, {scope:'.theme-' + key})).join('\n');
const c = (key, role, options = {}) => renderComponent(themes[key], role, options);
const node = (role, options) => ({component:role, options});
const baseTokens = resolveTokens(themes.studio);

// All UI fragments are rendered by the shared library, then made passive for artwork.
function collection(key) {
  return c(key, 'card', {idPrefix:'collection-' + key, slots:{
    header:{tag:'div', attrs:{'data-art-layout':'row'}, children:[node('text',{text:'DIN SAMLING',variant:'caption'}),node('badge',{text:'Kladde',variant:'neutral'})]},
    body:{tag:'div', attrs:{'data-art-layout':'stack'}, children:[node('heading',{text:'Plads til idéer',variant:'title'}),node('text',{text:'Saml det, der bliver til noget.',variant:'secondary'}),node('field',{label:'Titel',value:'Min næste idé',hint:'',idPrefix:'idea-' + key})]},
    footer:node('button',{text:'Åbn samlingen',variant:'primary'}),
  }});
}

const a = `<article class="art art-a theme-studio" aria-label="Komponentværkstedet: faktiske komponenter samlet til en komposition">
  <div class="art-top"><span>Design Studio</span><span class="art-index">01 / Bibliotek</span></div>
  <h1 class="art-title">Fra dele<br>til helhed<span>.</span></h1>
  <div class="workbench" inert>
    <div class="fragment fragment-main">${collection('studio')}</div>
    <div class="fragment fragment-tools"><div class="fragment-label">Handlinger</div><div class="tool-row">${c('studio','action-button',{label:'Tilføj',iconName:'plus',variant:'tool'})}${c('studio','action-button',{label:'Tilpas',iconName:'adjustments',variant:'tool'})}${c('studio','action-button',{label:'Gem',iconName:'download',variant:'tool'})}</div></div>
    <div class="fragment fragment-choice"><div class="fragment-label">Valg</div>${c('studio','switch',{label:'Giv idéen plads',checked:true,idPrefix:'art-switch'})}${c('studio','checkbox',{label:'Klar til næste skridt',checked:true,idPrefix:'art-check'})}</div>
    <div class="fragment fragment-type"><span class="type-sample">Aa</span><span>Form. Funktion.<br>Fælles grundlag.</span></div>
  </div>
  <div class="art-bottom"><span>Komponenter, der arbejder sammen</span>${renderIcon('components')}</div>
</article>`;

const b = `<article class="art art-b" aria-label="Samme form, flere udtryk: samme komponentgruppe i Studio Light, Castle Studio og Nocturne">
  <div class="art-top"><span>Design Studio</span><span class="art-index">02 / Temaer</span></div>
  <h1 class="art-title">Ét bibliotek.<br><span>Flere udtryk.</span></h1>
  <div class="theme-triptych" inert>${[['studio','Studio Light'],['castle','Castle Studio'],['night','Nocturne']].map(([key,label],index)=>`<section class="theme-pane theme-${key} pane-${index}"><div class="theme-swatch-line"><i></i><i></i><i></i></div><div class="theme-component">${collection(key)}</div><p class="theme-label">${label}</p></section>`).join('')}</div>
  <div class="art-bottom"><span>Samme komponenter. Samme indhold.</span><span class="three-dots"><i></i><i></i><i></i></span></div>
</article>`;

const palette = ['color.background.canvas','color.text.primary','color.action.primary.rest.surface'];
const d = `<article class="art art-c theme-studio" aria-label="Fra token til interface: farve, typografi og form forbindes med en færdig komponent">
  <div class="art-top"><span>Design Studio</span><span class="art-index">03 / System</span></div>
  <h1 class="art-title">Små valg.<br>Et helt udtryk.</h1>
  <div class="token-flow" inert>
    <div class="token-inputs"><div class="token-node token-color"><div class="token-node-label">Farve</div><div class="token-swatches">${palette.map(id=>`<i style="background:${baseTokens[id]}"></i>`).join('')}</div></div><div class="token-node token-type"><div class="token-node-label">Typografi</div><span>Aa</span></div><div class="token-node token-shape"><div class="token-node-label">Form</div><div></div></div></div>
    <svg class="flow-lines" viewBox="0 0 872 154" aria-hidden="true"><path d="M130 0V64Q130 86 152 86H414Q436 86 436 108V154M436 0V154M742 0V64Q742 86 720 86H458Q436 86 436 108" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="436" cy="86" r="7" fill="currentColor"/></svg>
    <div class="token-result"><span class="result-label">Interface</span><div class="result-card">${collection('studio')}</div></div>
  </div>
  <div class="art-bottom"><span>Fra designbeslutning til fælles grænseflade</span>${renderIcon('arrow-right')}</div>
</article>`;

export const concepts = [
  {id:'a',name:'Komponentværkstedet',subtitle:'Fra dele til helhed',description:'Et udvalg af faktiske komponenter som et lille værksted. Fokus på bibliotekets byggesten og deres samspil.',html:a},
  {id:'b',name:'Samme form, flere udtryk',subtitle:'Ét bibliotek. Flere udtryk.',description:'Præcis samme komponentgruppe og indhold i tre temaer. Fokus på Design Studios spændvidde.',html:b},
  {id:'c',name:'Fra token til interface',subtitle:'Små valg. Et helt udtryk.',description:'Farve, typografi og form samles i en færdig komponent. Fokus på forbindelsen mellem designbeslutning og produkt.',html:d},
];
const document = (body, title, extra='') => `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${themeCSS}\n${css}\n${extra}</style></head><body>${body}</body></html>`;
await mkdir(path.join(output,'screenshots'), {recursive:true});
await mkdir(path.join(output,'covers'), {recursive:true});
for (const concept of concepts) await writeFile(path.join(output,'covers',concept.id + '.html'),document(concept.html,concept.name,'body{margin:0;width:1080px;height:1080px;overflow:hidden}.art{width:1080px;height:1080px}'));
await buildStudio({output:path.join(output,'studio.html'),showcase:true});
await writeFile(path.join(output,'concepts.json'),JSON.stringify(concepts.map(({html,...item})=>item),null,2));
console.log('Tre produktkort bygget i ' + output);
