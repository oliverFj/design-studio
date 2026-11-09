import { getComponents, resolveTokens } from '../core/engine.mjs';
import { STANDARD_MOTION, animateThemed } from '../core/motion.mjs';
import { renderComponent } from '../core/components.mjs';
import { renderComponentCatalog } from './component-catalog.mjs';

function renderMaterialToolbox(theme){
  if(theme.schemaVersion!==2)return '';
  const card=options=>renderComponent(theme,'card',options);
  const heading=(text,attrs={})=>({component:'heading',options:{variant:'expressive',text,attrs}});
  return '<section class="material-toolbox" aria-labelledby="material-toolbox-title"><div class="material-toolbox-heading"><p class="eyebrow">Materialeværktøjskassen</p><h3 id="material-toolbox-title">Lys, pigment og dybde</h3><p class="help">Brug effekterne dér, hvor de giver en flade eller fortælling karakter. Skift tema og farve for at se materialerne følge med.</p></div><div class="material-toolbox-grid">'+
    card({variant:'rimmed',slots:{header:'Lysende kant',body:[heading('En kant af lys.'),{tag:'p',text:'Farven samler opmærksomheden omkring en rolig indholdsflade. Brug den til et udvalgt kort eller en vigtig introduktion.'}],footer:[{component:'badge',options:{text:'Opakt indre'}}]}})+
    card({slots:{header:'Gradient i skriften',body:[{component:'heading',options:{variant:'gradient',text:'Farve med retning.'}},{tag:'p',text:'Pigmentet følger bogstaverne. Store overskrifter får karakter, mens læsetekst og betjening beholder deres klare, stabile farver.'}],footer:[{component:'badge',options:{text:'Målt tekstkontrast'}}]}})+
    card({slots:{header:'Atmosfære og frost',body:[{tag:'div',attrs:{'data-material-sample':'atmosphere','data-material':'atmosphere','aria-hidden':'true'},children:[{tag:'span',attrs:{'data-material-sample':'frost','data-material':'frost','aria-hidden':'true'}}]},{tag:'p',text:'Lys og sløring skaber dybde i dekorative felter. Vigtig information ligger på en opak flade, og frosten får en solid fallback.'}],footer:[{component:'badge',options:{text:'Dekorative lag'}}]}})+
    '</div><p class="help">Effekterne står stille, indtil du vælger en bevægelse. Højkontrast forenkler materialerne; reduceret gennemsigtighed gør frostlaget opakt, hvor browseren understøtter præferencen.</p></section>';
}

export function renderMotionView(theme, state) {
  const components = getComponents(theme);
  const demo = renderComponentCatalog(theme, {
    components: { button: components.button, input: components.input }, state,
    selected: state.expanded,
  });
  const render=(id,options)=>renderComponent(theme,id,options);
  const tokens=resolveTokens(theme);
  const study=theme.schemaVersion===2?'<section class="theme-study ds-layout" data-layout="split" aria-labelledby="theme-study-title">'+
    '<div><p class="eyebrow">Materialer · form · bevægelse</p><h3 id="theme-study-title">Samme byggesten, nye udtryk</h3><p class="help">Skift tema og farvetilstand for at sammenligne. Materialefladen er opak; felter og fokus beholder deres egen tydelige afgrænsning.</p></div>'+
    '<div class="theme-study-grid">'+
    render('card',{variant:'material',attrs:{'data-motion-study':''},slots:{header:'Nye perspektiver',body:[{component:'heading',options:{variant:'expressive',text:'Giv idéer en form.'}},{tag:'p',text:'En materialeflade med målbar kontrast gennem hele farveovergangen.'}],footer:[{component:'button',options:{variant:'primary',text:'Afprøv bevægelsen',attrs:{'data-theme-motion':''}}}]}})+
    render('card',{variant:'embossed',slots:{header:'Relief og præcision',body:[{component:'field',options:{idPrefix:'material-name',label:'Studiets navn',value:state.materialName??'Nye perspektiver',hint:'Native felt på en opak, præget flade.',attrs:{'data-material-name':''}}}],footer:[{component:'badge',options:{text:'Indvendig prægning'}}]}})+
    render('card',{variant:'asymmetric',slots:{header:'Et hjørne med karakter',body:'Fremhævede hjørner giver en flade identitet. Indhold, afstande og klikflader følger fortsat det fælles bibliotek.',footer:[{component:'badge',options:{text:'Asymmetrisk form'}}]}})+
    '</div><p class="help" data-theme-motion-status role="status">Temaets valgfrie bevægelse: '+tokens['duration.expressive']+'. Aktiver knappen for at afprøve den.</p></section>':'';
  return '<div class="canvas-toolbar"><h2>Animation og effekter</h2></div>' + study + renderMaterialToolbox(theme) +
    '<div class="motion-studio ds-layout" data-layout="split">' +
    '<section class="motion-intro"><p class="eyebrow">Standardanimation</p><h3>Udfoldning og tilbagevenden</h3>' +
    '<p>Indhold åbner og vender tilbage med samme hurtige bevægelse. Elementerne bevæger sig samtidig, så der ikke opstår ventetid mellem lukning og tilbagevenden.</p>' +
    '<dl class="motion-facts"><div><dt>Varighed</dt><dd>' + STANDARD_MOTION.duration + ' ms</dd></div>' +
    '<div><dt>Forsinkelse</dt><dd>Ingen</dd></div><div><dt>Bevægelse</dt><dd>Hurtig start · rolig afslutning</dd></div></dl></section>' +
    '<section class="motion-preview" aria-labelledby="motion-preview-title"><h3 id="motion-preview-title">Afprøv standarden</h3>' +
    '<p class="help">Klik på en korttop for at åbne. Klik igen eller tryk Escape for at se kortene vende tilbage.</p>' + demo + '</section>' +
    '<p class="help motion-accessibility">Standarden bruges i komponentkortenes udfoldning. Ved reduceret bevægelse vises indholdet straks uden animation.</p></div>';
}

export function bindMotionStudy(root,state={}) {
  const button=root.querySelector('[data-theme-motion]');
  const target=root.querySelector('[data-motion-study]');
  const status=root.querySelector('[data-theme-motion-status]');
  let animation=null;
  const input=root.querySelector('[data-material-name]')?.querySelector('input');
  const remember=()=>{state.materialName=input.value;};
  input?.addEventListener('input',remember);
  const play=()=>{
    animation?.cancel();
    animation=animateThemed(target,[{transform:'translateY(10px) scale(.98)'},{transform:'translateY(0) scale(1)'}]);
    status.textContent=animation?'Temaets bevægelse afprøves.':'Fladen vises straks; bevægelse er reduceret eller ikke tilgængelig.';
  };
  button?.addEventListener('click',play);
  return {destroy(){button?.removeEventListener('click',play);input?.removeEventListener('input',remember);animation?.cancel();}};
}
