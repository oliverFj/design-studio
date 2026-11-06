import * as anatomy from './families/anatomy.mjs';
import * as lightroom from './families/lightroom.mjs';
import * as passage from './families/passage.mjs';
import * as fieldlines from './families/fieldlines.mjs';
import {cssVariables} from './palettes.mjs';

export const FAMILIES=[fieldlines,passage,lightroom,anatomy];
export const MOTIFS=[
 {id:'poster',name:'Principplakat',meaning:'En større komposition om hensigt og form.'},
 {id:'focus',name:'Fokus',meaning:'Ét tydeligt tyngdepunkt får plads.'},
 {id:'relation',name:'Relation',meaning:'Selvstændige dele har en synlig forbindelse.'},
 {id:'rhythm',name:'Rytme',meaning:'Gentagelse med en begrundet variation.'},
 {id:'accordion',name:'Accordion',meaning:'Skjult og åbent indhold kan skelnes.'},
 {id:'avatar-group',name:'Avatargruppe',meaning:'Personer hører sammen uden at miste deres identitet.'},
 {id:'progress',name:'Fremdrift',meaning:'Passeret, aktuelt og ventende er forskellige tilstande.'},
 {id:'image',name:'Billede',meaning:'En afgrænset åbning til et motiv.'},
 {id:'caption',name:'Billedtekst',meaning:'Tekst er knyttet til et bestemt billede.'},
 {id:'checkbox',name:'Afkrydsning',meaning:'Samme kontrolform viser valgt og ikke valgt.'}
];
export const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function makeSvg(familyId,motif,palette,{prefix='graphic',resolved=false}={}){
 const family=FAMILIES.find(f=>f.meta.id===familyId);
 if(!family||!MOTIFS.some(m=>m.id===motif))throw new Error('Ukendt grafik eller motiv.');
 if(!/^[a-z][a-z0-9-]*$/i.test(prefix))throw new Error('Ugyldigt SVG-præfiks.');
 const scene=family.draw(motif,{prefix});
 const vars=cssVariables(palette),style=Object.entries(vars).map(([k,v])=>k+':'+v).join(';');
 let body=scene.body;
 if(resolved)body=body.replace(/var\((--g-[\w-]+)\)/g,(_,key)=>{if(!(key in vars))throw new Error('Ukendt grafikvariabel '+key);return vars[key];});
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${scene.viewBox}" width="600" height="420" role="img" aria-labelledby="${prefix}-title" data-family="${familyId}" data-motif="${motif}" style="${style}"><title id="${prefix}-title">${escape(scene.label)}</title><rect width="600" height="420" fill="${resolved?palette.ground:'var(--g-ground)'}"/><g fill="none" stroke-linejoin="round" stroke-linecap="round" font-family="Arial, sans-serif">${body}</g></svg>`;
 return {svg,...scene};
}
