import {readdirSync} from 'node:fs';

// Retired identities remain loadable by filename for existing products. Their
// authored colours now live in the curated themes rather than duplicate cards.
export const LEGACY_THEME_IDS=Object.freeze(['atelier','castle-studio-v2','kyst','midnight-editorial','nocturne']);

/** Discover the public collection without exposing retired duplicate identities. */
export function discoverThemeIds(directory=new URL('../packages/',import.meta.url)){
  const ids=readdirSync(directory,{withFileTypes:true})
    .filter(entry=>entry.isFile()&&entry.name.endsWith('.json'))
    .map(entry=>entry.name.slice(0,-5)).sort();
  for(const id of ids)if(!/^[a-z][a-z0-9-]*$/.test(id))throw new Error('Ugyldigt temafilnavn: '+id+'.json');
  // Keep the default first without maintaining a separate list of themes.
  const publicIds=ids.filter(id=>!LEGACY_THEME_IDS.includes(id));
  return [...publicIds.filter(id=>id==='studio-light'),...publicIds.filter(id=>id!=='studio-light')];
}

export const PUBLIC_THEME_IDS=Object.freeze(discoverThemeIds());
