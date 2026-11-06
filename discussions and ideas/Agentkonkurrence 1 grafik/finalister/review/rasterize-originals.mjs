import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const sharp=require('C:/Users/olive/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const here=path.dirname(fileURLToPath(import.meta.url));
const competition=path.resolve(here,'../..');

export async function rasterizeSVG(svg,output,{width}={}){
 let pipeline=sharp(Buffer.from(svg));
 if(width)pipeline=pipeline.resize({width});
 await pipeline.png().toFile(output);
 return output;
}

/** Inline the source's class rules and authored variables for librsvg.
 * Keeps presentation-attribute/CSS precedence, including existing inline styles. */
export function flattenSVG(svg,html,variables){
 const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]??'';
 const rules={};
 for(const match of css.matchAll(/\.([a-zA-Z][\w-]*)\{([^{}]*)\}/g))rules[match[1]]=(rules[match[1]]??'')+match[2]+';';
 svg=svg.replace(/<[a-zA-Z][^>]*>/g,tag=>{
  const classes=tag.match(/\bclass="([^"]+)"/)?.[1];
  const tagName=tag.match(/^<([a-zA-Z]+)/)?.[1];
  const inherited=tagName==='text'?(css.match(/svg text\{([^}]*)\}/)?.[1]??''):'';
  if(!classes&&!inherited)return tag;
  const styles=inherited+';'+(classes??'').split(/\s+/).map(name=>rules[name]??'').join('');
  const own=tag.match(/\bstyle="([^"]*)"/)?.[1]??'';
  return tag.replace(/\sclass="[^"]*"/,'').replace(/\sstyle="[^"]*"/,'').replace(/\/?>$/,end=>' style="'+styles+own+'"'+end);
 });
 return svg.replace(/var\(--([\w-]+)\)/g,(_,key)=>variables[key]??'black');
}

const html1=fs.readFileSync(path.join(competition,'agent-1.html'),'utf8');
const html2=fs.readFileSync(path.join(competition,'agent-2.html'),'utf8');
const html3=fs.readFileSync(path.join(competition,'agent-3.html'),'utf8');
const section=(html,id)=>html.slice(html.indexOf('<section'),html.length).match(new RegExp('<section[^>]*id="'+id+'"[\\s\\S]*?<\\/section>'))?.[0]??'';
const svgs=fragment=>[...fragment.matchAll(/<svg[\s\S]*?<\/svg>/g)].map(m=>m[0]);
const anatomy=svgs(section(html1,'anatomy')).slice(0,4);
const lysrum=svgs(section(html2,'lysrum'));
let script3=html3.match(/<script>([\s\S]*?)<\/script>/)[1];
script3=script3.slice(script3.indexOf("'use strict';"),script3.indexOf("document.querySelectorAll('[data-art]')"));
const exports3=vm.runInNewContext(script3+';({art,palettes})');
const script2=html2.match(/<script>([\s\S]*?)<\/script>/)[1];
const themes2=vm.runInNewContext(script2.slice(script2.indexOf('const themes='),script2.indexOf('const tokenDefinitions='))+';themes');

const anatomyPalettes={light:{paper:'#f7f1e5',ink:'#352c29',primary:'#8a4646',counter:'#b9904d',tint:'#e5d9c7',guide:'#d9d2c8',wash:'#eeece6',muted:'#5e584f'},dark:{paper:'#2b2420',ink:'#f0e5d3',primary:'#d6aca0',counter:'#ba9b6e',tint:'#51413b',guide:'#45403a',wash:'#4d473d',muted:'#dedbd4'}};
const families=[
 {id:'anatomy',name:'Tegnets anatomi',html:html1,svgs:anatomy,theme:'Atelier',variables:mode=>{const p=anatomyPalettes[mode];return Object.fromEntries(Object.entries(p).flatMap(([k,v])=>[[k,v],['g-'+k,v]]));},background:mode=>anatomyPalettes[mode].paper,labels:['Principplakat','Accordion','Avatargruppe','Billedtekst']},
 {id:'lysrum',name:'Lysrum',html:html2,svgs:lysrum,theme:'Fjordside',variables:mode=>Object.fromEntries(Object.entries(themes2.fjordside[mode]).map(([k,v])=>['g-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v])),background:mode=>themes2.fjordside[mode].ground,labels:['Principplakat','Afkrydsning','Avatargruppe','Billede','Fokus','Relation']},
 ...['passage','feltlinjer'].map(id=>({id,name:id==='passage'?'Passage':'Feltlinjer',html:html3,svgs:['hero','accordion','avatars','progress'].map(role=>exports3.art[id+'-'+role]()),theme:'Midnight Editorial',variables:mode=>Object.fromEntries(Object.entries(exports3.palettes.midnight[mode]).map(([k,v])=>['g-'+k,v])),background:mode=>exports3.palettes.midnight[mode].field,labels:['Principplakat','Accordion','Avatargruppe','Progress']})),
];

function placed(svg,x,y,w,h){return svg.replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" `);}
for(const f of families){
 const width=1500,rowHeight=f.svgs.length>4?740:590,height=rowHeight*2+95;
 let board=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#efefeb"/><text x="32" y="42" font-family="sans-serif" font-size="26" fill="#20231f">${f.name} · originalgrafik til peer review</text>`;
 for(const[mi,mode]of ['light','dark'].entries()){
  const y=70+mi*rowHeight;board+=`<rect x="20" y="${y}" width="1460" height="${rowHeight-16}" rx="8" fill="${f.background(mode)}"/><text x="42" y="${y+31}" font-family="sans-serif" font-size="16" fill="${mode==='light'?'#282b27':'#e8e8e0'}">${f.theme} / ${mode==='light'?'lys':'mørk'}</text>`;
  const originals=f.svgs.map(s=>flattenSVG(s,f.html,f.variables(mode)));
  board+=placed(originals[0],40,y+50,710,510);
  for(let i=1;i<originals.length;i++){
   const column=(i-1)%2,row=Math.floor((i-1)/2),x=790+column*333,sy=y+55+row*217;
   board+=placed(originals[i],x,sy,310,185)+`<text x="${x+12}" y="${sy+205}" font-family="sans-serif" font-size="13" fill="${mode==='light'?'#282b27':'#e8e8e0'}">${f.labels[i]}</text>`;
  }
 }
 board+='</svg>';
 const output=path.join(here,'original-'+f.id+'.png');await rasterizeSVG(board,output);console.log(output);
}
