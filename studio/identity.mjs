import {renderStadeMark} from '../core/stade-mark.mjs';
export {renderStadeMark};

export const STADE_NAME = 'Stade';
export const STADE_TAGLINE = 'Agentisk Design- og Udviklingsplatform';

export function renderStadeBrand() {
  return `<div class="brand">${renderStadeMark()}<div class="stade-wordmark"><strong>STADE</strong><span>${STADE_TAGLINE}</span></div></div>`;
}
