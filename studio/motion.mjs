import { getComponents } from '../core/engine.mjs';
import { STANDARD_MOTION } from '../core/motion.mjs';
import { renderComponentCatalog } from './component-catalog.mjs';

export function renderMotionView(theme, state) {
  const components = getComponents(theme);
  const demo = renderComponentCatalog(theme, {
    components: { button: components.button, input: components.input }, state,
    selected: state.expanded,
  });
  return '<div class="canvas-toolbar"><h2>Animation og effekter</h2></div>' +
    '<div class="motion-studio ds-layout" data-layout="split">' +
    '<section class="motion-intro"><p class="eyebrow">Standardanimation</p><h3>Udfoldning og tilbagevenden</h3>' +
    '<p>Indhold åbner og vender tilbage med samme hurtige bevægelse. Elementerne bevæger sig samtidig, så der ikke opstår ventetid mellem lukning og tilbagevenden.</p>' +
    '<dl class="motion-facts"><div><dt>Varighed</dt><dd>' + STANDARD_MOTION.duration + ' ms</dd></div>' +
    '<div><dt>Forsinkelse</dt><dd>Ingen</dd></div><div><dt>Bevægelse</dt><dd>Hurtig start · rolig afslutning</dd></div></dl></section>' +
    '<section class="motion-preview" aria-labelledby="motion-preview-title"><h3 id="motion-preview-title">Afprøv standarden</h3>' +
    '<p class="help">Klik på en korttop for at åbne. Klik igen eller tryk Escape for at se kortene vende tilbage.</p>' + demo + '</section>' +
    '<p class="help motion-accessibility">Standarden bruges i komponentkortenes udfoldning. Ved reduceret bevægelse vises indholdet straks uden animation.</p></div>';
}
