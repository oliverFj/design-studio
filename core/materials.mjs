/** Opt-in visual treatments for existing components and decorative artwork.
 * Products still own composition; these effects introduce no controls or motion.
 */
export const MATERIAL_TOKEN_DEFAULTS={
  'gradient.rim':{$type:'gradient',$value:'linear-gradient(135deg, {color.action.primary.rest.surface} 0%, {color.focus} 100%)',description:'Dekorativ farveovergang i kanten af et kort med opakt indre.'},
  'gradient.atmosphere':{$type:'gradient',$value:'radial-gradient(ellipse at 20% 20%, {color.action.primary.rest.surface} 0%, {color.background.subtle} 100%)',description:'Lysfelt til dekorative, aria-hidden områder. Brug ikke som underlag for tekst eller betjening.'},
  'gradient.ink':{$type:'gradient',$value:'linear-gradient(115deg, {color.text.primary} 0%, {color.text.primary} 100%)',description:'Pigment til store overskrifter. Hele overgangen skal holde mindst 4,5:1 mod canvas, surface og subtle.'},
  'material.rim.width':{$type:'dimension',$value:'1px',description:'Tykkelse af den dekorative gradientkant; påvirker ikke fokusmarkeringen.'},
  'material.frost.blur':{$type:'dimension',$value:'16px',description:'Sløring i dekorative frostlag. Indholdsflader og kontroller forbliver opake.'},
  'material.frost.opacity':{$type:'number',$value:.72,description:'Frostlagets andel af den opake temaflade, fra 0 til 1. Læseøer i frostede kort forbliver helt opake.'},
};

export const MATERIAL_TREATMENTS=Object.freeze([
  {id:'rim',name:'Lysende kant',description:'En farvet kant omkring en rolig, opak indholdsflade.',usage:'Kort og præsentationsflader med et afgrænset fokus.',selector:'.ds-card[data-material="rim"]'},
  {id:'ink',name:'Gradient i skriften',description:'Farven følger bogstavernes form og giver en stor overskrift retning.',usage:'Store overskrifter på canvas, almindelig eller afdæmpet flade.',selector:'.ds-heading[data-material="ink"]'},
  {id:'atmosphere',name:'Atmosfærisk lys',description:'Et selvstændigt lysfelt, der kan give en introduktion eller illustration dybde.',usage:'Dekorative felter uden tekst eller kontroller.',selector:'[data-material="atmosphere"][aria-hidden="true"]'},
  {id:'frost',name:'Frostet lys',description:'Et sløret dekorativt lag med en solid fallback.',usage:'Dekorativt lag over et kendt motiv. Hold vigtig information på opake flader.',selector:'[data-material="frost"][aria-hidden="true"]'},
  {id:'frosted',name:'Frostet ramme',description:'En transparent, sløret ramme omkring opake læseøer.',usage:'Rumlige præsentationskort over et kendt motiv. Header, indhold og handlinger bevarer deres egne målbare flader.',selector:'.ds-card[data-variant="frosted"]'},
]);

export function generateMaterialCSS(scope='.ds-scope'){
  if(typeof scope!=='string'||!/^[.#][a-zA-Z_][a-zA-Z0-9_-]*$/.test(scope))throw new Error('CSS scope must be a single class or ID selector.');
  const select=id=>{
    const selectors=[MATERIAL_TREATMENTS.find(item=>item.id===id).selector];
    if(id==='rim')selectors.push('.ds-card[data-variant="rimmed"]');
    if(id==='ink')selectors.push('.ds-heading[data-variant="gradient"]');
    return selectors.map(selector=>scope+' '+selector).join(', ');
  };
  const rim=select('rim'),ink=select('ink'),atmosphere=select('atmosphere'),frost=select('frost'),frosted=select('frosted');
  const glass=frost+', '+frosted;
  const islands=['header','body','footer'].map(part=>frosted+' > .ds-card__'+part).join(', ');
  return [
    `${rim} { border: var(--ds-material-rim-width) solid var(--ds-color-border-default); background: var(--ds-color-background-surface); color: var(--ds-color-text-primary); }`,
    '@supports (background: linear-gradient(white, white) padding-box, linear-gradient(black, black) border-box) {',
    `${rim} { border-color: transparent; background: linear-gradient(var(--ds-color-background-surface), var(--ds-color-background-surface)) padding-box, var(--ds-gradient-rim) border-box; }`,
    '}',
    `${ink} { color: var(--ds-color-text-primary); }`,
    '@supports ((background-clip: text) or (-webkit-background-clip: text)) {',
    `${ink} { background-color: var(--ds-color-text-primary); background-image: var(--ds-gradient-ink); background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }`,
    '}',
    `${atmosphere} { background-color: var(--ds-color-background-subtle); background-image: var(--ds-gradient-atmosphere); }`,
    `${glass} { background: var(--ds-color-background-surface); border: var(--ds-border-width-default) solid var(--ds-color-border-default); border-radius: var(--ds-radius-card); }`,
    `${frosted} { box-shadow: var(--ds-shadow-floating); }`,
    // Reading islands remain measurable even when a theme changes card paint.
    `${islands} { background: var(--ds-color-background-surface) !important; color: var(--ds-color-text-primary) !important; }`,
    `${frosted} > .ds-card__body { color: var(--ds-color-text-secondary) !important; }`,
    '@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {',
    // Both the filter and color mix must work before reducing the solid fallback.
    '@supports (background: color-mix(in srgb, white 72%, transparent)) {',
    // A text-only card remains solid; transparency requires native reading parts.
    `${frost}, ${frosted}:has(> .ds-card__body) { background: color-mix(in srgb, var(--ds-color-background-surface) calc(var(--ds-material-frost-opacity) * 100%), transparent); backdrop-filter: blur(var(--ds-material-frost-blur)); -webkit-backdrop-filter: blur(var(--ds-material-frost-blur)); }`,
    '}',
    '}',
    '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {',
    `${glass} { background: var(--ds-color-background-surface) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`,
    `${ink} { color: var(--ds-color-text-primary); -webkit-text-fill-color: currentColor; background: none; }`,
    `${rim} { border-color: var(--ds-color-border-default); background: var(--ds-color-background-surface); }`,
    '}',
    '@media (forced-colors: active) {',
    `${rim}, ${glass} { background: Canvas !important; color: CanvasText !important; border-color: CanvasText !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`,
    `${islands} { background: Canvas !important; color: CanvasText !important; }`,
    `${ink} { color: CanvasText !important; -webkit-text-fill-color: CanvasText !important; background: none !important; }`,
    `${atmosphere} { background: Canvas !important; }`,
    '}',
  ].join('\n');
}
