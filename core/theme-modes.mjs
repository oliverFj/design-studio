import {canonicalizeTokenSet} from './scales.mjs';
/** Resolve an optional light/dark pair without mutating the editable source.
 * A resolved snapshot deliberately omits modes so it can be validated/rendered
 * independently. Old single-mode themes retain their original values.
 */
export function resolveThemeMode(theme, mode = 'system', systemMode = 'light') {
 if(!['system','light','dark'].includes(mode)||!['light','dark'].includes(systemMode))throw new Error('Unknown color mode.');
 const copy=structuredClone(theme),selected=mode==='system'?systemMode:mode;
 if(copy.modes){copy.tokens=copy.schemaVersion===2?{...canonicalizeTokenSet(copy.tokens),...canonicalizeTokenSet(copy.modes[selected]?.tokens)}:{...copy.tokens,...copy.modes[selected]?.tokens};delete copy.modes;delete copy.defaultMode;}
 return copy;
}

/** Explicit choice wins over OS changes. Storage is optional, including file://. */
export function createColorModePreference({storage,media,key='design-studio.color-mode',onChange=()=>{}}={}) {
 try{storage??=globalThis.localStorage;}catch{/* File/private contexts may deny storage. */}
 media??=globalThis.matchMedia?.('(prefers-color-scheme: dark)');
 let value='system',destroyed=false;
 try{const saved=storage?.getItem(key);if(['system','light','dark'].includes(saved))value=saved;}catch{}
 const resolved=()=>value==='system'?(media?.matches?'dark':'light'):value;
 const changed=()=>{if(!destroyed&&value==='system')onChange(resolved(),value);};
 if(media?.addEventListener)media.addEventListener('change',changed);else media?.addListener?.(changed);
 return {get value(){return value;},get resolved(){return resolved();},set(next){
  if(!['system','light','dark'].includes(next))throw new Error('Unknown color mode preference.');
  if(destroyed)throw new Error('Color mode preference has been destroyed.');
  value=next;try{storage?.setItem(key,next);}catch{}onChange(resolved(),value);
 },destroy(){destroyed=true;if(media?.removeEventListener)media.removeEventListener('change',changed);else media?.removeListener?.(changed);}};
}
