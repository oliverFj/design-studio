// Traced from the approved Stade reference. Keep the shared anchors together.
export const STADE_NAME = 'Stade';
export const STADE_TAGLINE = 'Agentisk Design- og Udviklingsplatform';

export function renderStadeMark() {
  return `<svg class="stade-mark" xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 208 208" aria-hidden="true" focusable="false">
    <path class="stade-facet stade-facet-nw" d="M100 0 13.4 50V100C70 94 100 64 100 0Z"/>
    <path class="stade-facet stade-facet-ne" d="M100 0 186.6 50V100C130 94 100 64 100 0Z"/>
    <path class="stade-facet stade-facet-se" d="M186.6 100V150L100 200C100 136 130 106 186.6 100Z"/>
    <path class="stade-facet stade-facet-sw" d="M100 200 13.4 150V100C70 106 100 136 100 200Z"/>
    <path fill="none" stroke="currentColor" stroke-width="3.8" stroke-linejoin="round" stroke-linecap="round" d="M100 0 186.6 50V150L100 200 13.4 150V50ZM100 0C100 66 70 96 0 100 70 104 100 134 100 200 100 134 130 104 200 100 130 96 100 66 100 0Z"/>
  </svg>`;
}

export function renderStadeBrand() {
  return `<div class="brand">${renderStadeMark()}<div class="stade-wordmark"><strong>STADE</strong><span>${STADE_TAGLINE}</span></div></div>`;
}
