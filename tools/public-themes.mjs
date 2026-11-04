import {readdirSync} from 'node:fs';

/** The canonical packages directory is also the public theme collection. */
export function discoverThemeIds(directory=new URL('../packages/',import.meta.url)){
  const ids=readdirSync(directory,{withFileTypes:true})
    .filter(entry=>entry.isFile()&&entry.name.endsWith('.json'))
    .map(entry=>entry.name.slice(0,-5)).sort();
  for(const id of ids)if(!/^[a-z][a-z0-9-]*$/.test(id))throw new Error('Ugyldigt temafilnavn: '+id+'.json');
  // Keep the default first without maintaining a separate list of themes.
  return [...ids.filter(id=>id==='studio-light'),...ids.filter(id=>id!=='studio-light')];
}

export const PUBLIC_THEME_IDS=Object.freeze(discoverThemeIds());
