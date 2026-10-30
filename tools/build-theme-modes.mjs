import {readFile,writeFile} from 'node:fs/promises';
import {validatePackage} from '../core/engine.mjs';
import {PUBLIC_THEME_IDS} from './public-themes.mjs';

// Authored identity anchors. Shared semantic mappings below never define markup.
const identities={
 'studio-light':['#232638','#5147d9','#ffffff','light'],
 'midnight-editorial':['#29212a','#985638','#fffaf4','dark'],
 fjordside:['#292820','#7e4732','#faf8f1','light',true,'#aa6346'],
 'castle-studio':['#263d3a','#285e5e','#fffaf0','light',false,'#9c553e'],
 'castle-studio-v2':['#263d3a','#285e5e','#f8f7f1','light',false,'#9c553e'],
 atelier:['#30291f','#783d43','#fffdf7','light'],
 signal:['#172635','#174ed1','#ffffff','light'],
 nocturne:['#281e38','#7950a8','#faf7ff','dark'],
};
const token=(type,value,description)=>({$type:type,$value:value,...(description?{description}:{})});
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const ref=id=>'{'+id+'}';
function palette(neutral,brand,paper,accent=brand){
 const result={};
 const color=(id,value)=>result['palette.'+id]=token('color',value,'Primitiv paletteværdi; komponenter anvender semantiske farver.');
 for(const [step,amount]of [[0,0],[50,.04],[100,.08],[200,.16],[300,.30],[400,.42],[500,.55],[550,.60],[600,.68],[700,.78],[800,.86]])color('neutral.'+step,mix(paper,neutral,amount));
 color('neutral.850',mix(neutral,paper,.05));color('neutral.900',mix(neutral,'#000000',.05));color('neutral.950',mix(neutral,'#000000',.35));color('neutral.1000','#000000');
 for(const [family,seed]of Object.entries({brand,accent,danger:'#ad3048',success:'#286044',info:'#315ba0',warning:'#795414'})){
  for(const [step,amount]of [[50,.94],[100,.86],[200,.72],[300,.55],[400,.35],[500,.15]])color(family+'.'+step,mix(seed,paper,amount));
  color(family+'.600',seed);for(const [step,amount]of [[700,.15],[800,.30],[900,.45],[950,.60]])color(family+'.'+step,mix(seed,'#000000',amount));
 }
 return result;
}
function semantics(mode,neutralAction){
 const dark=mode==='dark',values={},set=(id,p)=>values[id]=token('color',ref('palette.'+p),'Semantisk farverolle: '+id+'.');
 const primary=neutralAction?'neutral.'+(dark?'50':'900'):'brand.'+(dark?'200':'600');
 const entries={
  'color.background.canvas':'neutral.'+(dark?'950':'50'),'color.background.surface':'neutral.'+(dark?'900':'0'),
  'color.background.control':'neutral.'+(dark?'850':'0'),'color.background.detail':'neutral.'+(dark?'900':'0'),'color.background.subtle':'neutral.'+(dark?'800':'100'),
  'color.text.primary':'neutral.'+(dark?'50':'900'),'color.text.secondary':'neutral.'+(dark?'200':'700'),'color.text.muted':'neutral.'+(dark?'200':'700'),'color.text.label':'neutral.'+(dark?'200':'700'),
  'color.border.default':'neutral.'+(dark?'700':'200'),'color.border.field':'neutral.'+(dark?'400':'600'),'color.border.strong':'neutral.'+(dark?'200':'700'),
  'color.action.primary.rest.surface':primary,'color.action.primary.rest.text':'neutral.'+(dark?'950':'0'),
  'color.action.selected.rest.surface':'brand.'+(dark?'900':'50'),'color.action.selected.rest.text':'brand.'+(dark?'100':'800'),
  'color.background.inverse':'neutral.'+(dark?'100':'900'),'color.text.inverse':'neutral.'+(dark?'900':'0'),
  'color.focus':'brand.'+(dark?'200':'600'),'color.brand.accent':'accent.'+(dark?'300':'600'),'color.brand.accentDeep':'accent.'+(dark?'200':'800'),
  'color.status.danger':'danger.'+(dark?'200':'600'),'color.status.dangerSurface':'danger.'+(dark?'950':'50'),'color.status.dangerText':'danger.'+(dark?'100':'800'),'color.status.dangerContrast':'neutral.'+(dark?'950':'0'),
  'color.status.success':'success.'+(dark?'200':'600'),'color.status.info':'info.'+(dark?'200':'600'),'color.status.warning':'warning.'+(dark?'200':'600'),
  'color.disabled.surface':'neutral.'+(dark?'800':'100'),'color.disabled.text':'neutral.'+(dark?'400':'500'),
  'color.caption.surface':'neutral.'+(dark?'900':'0'),'color.caption.text':'neutral.'+(dark?'50':'900'),'color.caption.labelSurface':primary,'color.caption.labelText':'neutral.'+(dark?'950':'0'),
 };
 for(const [id,value]of Object.entries(entries))set(id,value);
 for(const [family,hover,active,text]of [
  ['neutral',dark?'neutral.800':'neutral.200',dark?'neutral.700':'neutral.300',dark?'neutral.50':'neutral.900'],
  ['selected',dark?'neutral.800':'brand.100',dark?'neutral.700':'brand.200',dark?'neutral.50':'neutral.900'],
  ['primary',neutralAction?(dark?'neutral.100':'neutral.800'):'brand.'+(dark?'100':'700'),neutralAction?(dark?'neutral.200':'neutral.950'):'brand.'+(dark?'50':'800'),dark?'neutral.950':'neutral.0'],
  ['secondary',dark?'neutral.200':'neutral.800',dark?'neutral.300':'neutral.700',dark?'neutral.900':'neutral.0'],
  ['danger','danger.'+(dark?'100':'700'),'danger.'+(dark?'50':'800'),dark?'neutral.950':'neutral.0'],
  ['accent','accent.'+(dark?'100':'700'),'accent.'+(dark?'50':'800'),dark?'neutral.950':'neutral.0'],
 ])for(const [state,surface]of [['Hover',hover],['Active',active]]){set('color.action.'+family+'.'+state.toLowerCase()+'.surface',surface);set('color.action.'+family+'.'+state.toLowerCase()+'.text',text);}
 return values;
}
const outputs=[];
for(const id of PUBLIC_THEME_IDS){
 const file=new URL('../packages/'+id+'.json',import.meta.url),theme=JSON.parse(await readFile(file,'utf8'));
 const [neutral,brand,paper,defaultMode,neutralAction,accent]=identities[id],light=semantics('light',neutralAction),dark=semantics('dark',neutralAction);
 theme.tokens={...theme.tokens,...palette(neutral,brand,paper,accent),...(defaultMode==='dark'?dark:light)};
 for(const [role,level]of [['shadow.selected','elevation.level1'],['shadow.card','elevation.level2'],['shadow.floating','elevation.level3']]){
  const original=theme.tokens[role];
  if(original?.$value&&!String(original.$value).startsWith('{elevation.'))theme.tokens[level]=token('shadow',original.$value,'Temaværdi for '+level+'.');
  theme.tokens[role]=token('shadow',ref(level),'Semantisk hævning: '+role+'.');
 }
 theme.defaultMode=defaultMode;theme.modes={light:{tokens:light},dark:{tokens:dark}};
 const note='Parrede lyse/mørke farvetilstande, primitive paletter og bindende feltkanter med kontrastmargin.';
 if(!theme.history.some(item=>item.note===note))theme.history.push({date:'2026-10-30',note});
 const result=validatePackage(theme);if(!result.valid)throw new Error(id+':\n'+result.errors.join('\n'));
 outputs.push([file,theme]);console.log(id+': light/dark paletter valideret.');
}
for(const [file,theme]of outputs)await writeFile(file,JSON.stringify(theme,null,2)+'\n');
