import {FAMILIES,MOTIFS,makeSvg,escape} from './graphics.mjs';
import {THEMES,TOKENS} from './palettes.mjs';
import {REVIEWS} from './reviews.mjs';
import {mountGraphicMotion,MOTION} from './motion/player.mjs';
import {bindMotionControls,updateMotionControls,controlMarkup} from './motion/controls.mjs';
import {animatedDocument} from './motion/document.mjs';

const $=id=>document.getElementById(id);
let themeId='signal',modeId='light',familyId='fieldlines',motifId='poster',partKey='';
let stageMotion=null,comparisonMotion=[],unbindControls=null,userReduced=false;
$('motion-controls-slot').innerHTML=controlMarkup();
const palette=()=>THEMES[themeId].modes[modeId];
const selectedFamily=()=>FAMILIES.find(f=>f.meta.id===familyId);
const selectOptions=(items,value)=>items.map(([id,name])=>`<option value="${escape(id)}"${id===value?' selected':''}>${escape(name)}</option>`).join('');
$('theme').innerHTML=selectOptions(Object.entries(THEMES).map(([id,t])=>[id,t.name]),themeId);
$('family').innerHTML=selectOptions(FAMILIES.map(f=>[f.meta.id,f.meta.name]),familyId);
$('motif').innerHTML=selectOptions(MOTIFS.map(m=>[m.id,m.name]),motifId);

function updateModes(){
 const modes=THEMES[themeId].modes;
 if(!modes[modeId])modeId=Object.keys(modes)[0];
 $('mode').innerHTML=selectOptions(Object.entries(modes).map(([id,p])=>[id,p.name]),modeId);
}
function render({preserveMotion=false}={}){
 const previous=stageMotion?.state;
 unbindControls?.();stageMotion?.destroy();comparisonMotion.forEach(player=>player.destroy());comparisonMotion=[];
 const f=selectedFamily(),p=palette(),motif=MOTIFS.find(m=>m.id===motifId);
 $('comparison').innerHTML=FAMILIES.map((family,i)=>`<article class="compare-card${family.meta.id===familyId?' is-selected':''}"><div class="compare-label"><span>0${i+1}</span><span>${escape(family.meta.author)}</span></div><div class="graphic">${makeSvg(family.meta.id,motifId,p,{prefix:'compare-'+family.meta.id}).svg}</div><h3>${escape(family.meta.name)}</h3><p>${escape(family.meta.qualities.join(' · '))}</p><button type="button" data-family-choice="${family.meta.id}" aria-pressed="${family.meta.id===familyId}">Udforsk ${escape(family.meta.name)} <span aria-hidden="true">↘</span></button></article>`).join('');
 const scene=makeSvg(familyId,motifId,p,{prefix:'stage-'+familyId+'-'+motifId});
 $('stage').innerHTML=scene.svg;
 $('family-title').textContent=f.meta.name;
 $('family-description').textContent=f.meta.description;
 $('motif-title').textContent=motif.name;
 $('motif-meaning').textContent=scene.label;
 $('gallery').innerHTML=MOTIFS.map(m=>`<button class="motif-card" type="button" data-motif-choice="${m.id}" aria-label="${escape(m.name)}" aria-pressed="${m.id===motifId}"><span class="graphic">${makeSvg(familyId,m.id,p,{prefix:'thumb-'+familyId+'-'+m.id}).svg}</span><span>${escape(m.name)}<i aria-hidden="true">${m.id===motifId?'●':'↗'}</i></span></button>`).join('');
 if(!scene.parts.some(part=>part.key===partKey))partKey='';
 $('part').innerHTML=selectOptions([['','Hele motivet'],...scene.parts.map(part=>[part.key,part.name])],partKey);
 $('part-list').innerHTML=scene.parts.map(part=>`<li><code>${escape(part.key)}</code><span>${escape(part.purpose)}</span></li>`).join('');
 $('changes').innerHTML=f.meta.changes.map(item=>`<li>${escape(item)}</li>`).join('');
 $('animation-ideas').innerHTML=f.meta.animation.map(item=>`<li>${escape(item)}</li>`).join('');
 $('palette-note').textContent=THEMES[themeId].note;
 $('tokens').innerHTML=TOKENS.map(([key,name,meaning])=>`<div class="token">${typeof p[key]==='string'?`<span class="swatch" style="background:${p[key]}"></span>`:'<span class="metric" aria-hidden="true">↔</span>'}<div><code>${escape(name)}</code><p>${escape(meaning)}</p><b>${key==='depthOpacity'?Math.round(p[key]*100)+' %':escape(p[key])}</b></div></div>`).join('');
 $('current').textContent=`${THEMES[themeId].name} · ${p.name} · ${motif.name}`;
 $('selection-status').textContent=`${f.meta.name} · ${motif.name}. ${THEMES[themeId].name}, ${p.name.toLowerCase()}.`;
 $('motion-title').textContent=MOTION[familyId].meta.title;
 $('motion-description').textContent=MOTION[familyId].meta.description;
 $('motion-interaction-hint').textContent=MOTION[familyId].meta.interactionHint+' Du kan også fokusere grafikken og bruge piletasterne. Escape nulstiller.';
 const clearPart=()=>{if(partKey){partKey='';$('part').value='';highlightPart();}stageMotion?.setInteraction(true);};
 stageMotion=mountGraphicMotion($('stage').querySelector('svg'),{reduced:userReduced,beforePlay:clearPart,onUpdate:state=>updateMotionControls($('motion-panel'),state)});
 comparisonMotion=[...$('comparison').querySelectorAll('svg')].map(svg=>mountGraphicMotion(svg,{interactive:false,reduced:userReduced,onUpdate:updateComparisonControl}));
 unbindControls=bindMotionControls($('motion-panel'),stageMotion,{beforePlay:clearPart,onReduced:value=>{userReduced=value;stageMotion.setReduced(value);comparisonMotion.forEach(player=>player.setReduced(value));updateComparisonControl();}});
 stageMotion.setLoop(previous?.loop||false);
 if(preserveMotion&&previous&&!previous.reduced){stageMotion.seek(previous.progress);if(previous.playing)stageMotion.play(previous.direction<0);}
 if(partKey){stageMotion.settle();stageMotion.setInteraction(false);}
 updateComparisonControl();
 highlightPart();
}
function updateComparisonControl(){
 const reduced=userReduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 $('compare-play').disabled=reduced;
 $('compare-play').textContent=comparisonMotion.some(player=>player.state.playing)?'Pause de fire':'Afspil de fire';
}
function highlightPart(){
 const scene=selectedFamily().draw(motifId,{prefix:'parts'}),part=scene.parts.find(part=>part.key===partKey);
 $('part-purpose').textContent=part?part.purpose:'Alle lag vises samlet. Vælg et lag for at fremhæve det i den store prøve.';
 $('stage').querySelectorAll('[data-part]').forEach(group=>{
  const related=group.dataset.part===partKey||group.querySelector(`[data-part="${partKey}"]`)||group.parentElement.closest(`[data-part="${partKey}"]`);
  group.classList.toggle('is-muted',Boolean(partKey)&&!related);
 });
}
function chooseFamily(id){familyId=id;partKey='';$('family').value=id;render();}
function chooseMotif(id){motifId=id;partKey='';$('motif').value=id;render();}
$('theme').addEventListener('change',event=>{themeId=event.target.value;updateModes();render({preserveMotion:true});});
$('mode').addEventListener('change',event=>{modeId=event.target.value;render({preserveMotion:true});});
$('family').addEventListener('change',event=>chooseFamily(event.target.value));
$('motif').addEventListener('change',event=>chooseMotif(event.target.value));
$('part').addEventListener('change',event=>{stageMotion.settle();partKey=event.target.value;stageMotion.setInteraction(!partKey);highlightPart();});
$('compare-play').addEventListener('click',()=>{
 if(comparisonMotion.some(player=>player.state.playing))comparisonMotion.forEach(player=>player.pause());
 else{$('comparison').scrollIntoView({block:'center'});comparisonMotion.forEach(player=>player.play());}
 updateComparisonControl();
});
document.addEventListener('click',event=>{
 const familyButton=event.target.closest('[data-family-choice]'),motifButton=event.target.closest('[data-motif-choice]');
 if(familyButton){const id=familyButton.dataset.familyChoice;chooseFamily(id);document.querySelector(`[data-family-choice="${id}"]`).focus({preventScroll:true});}
 if(motifButton){const id=motifButton.dataset.motifChoice;chooseMotif(id);document.querySelector(`[data-motif-choice="${id}"]`).focus({preventScroll:true});}
});
$('download').addEventListener('click',()=>{
 const {svg}=makeSvg(familyId,motifId,palette(),{prefix:familyId+'-'+motifId,resolved:true});
 const blob=new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`${familyId}-${motifId}-${themeId}-${modeId}.svg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('download-status').textContent='SVG-filen er sendt til browserens downloads.';
});
$('download-animated').addEventListener('click',()=>{
 const family=selectedFamily(),motif=MOTIFS.find(m=>m.id===motifId);
 const {svg}=makeSvg(familyId,motifId,palette(),{prefix:familyId+'-'+motifId,resolved:true});
 const html=animatedDocument({svg,title:family.meta.name+' · '+motif.name,description:MOTION[familyId].meta.description,playerSource:__ANIMATED_PLAYER__});
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');
 link.href=url;link.download=`${familyId}-${motifId}-${themeId}-${modeId}-animeret.html`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('download-status').textContent='Det selvstændige animerede motiv er sendt til browserens downloads.';
});
$('reviews').innerHTML=REVIEWS.map(review=>`<article class="review-card"><h3>${escape(review.author)} ser på de andre</h3>${review.items.map(item=>`<section><h4>${escape(item.family)}</h4><p class="praise">${escape(item.praise)}</p><ul>${item.pointers.map(pointer=>`<li>${escape(pointer)}</li>`).join('')}</ul></section>`).join('')}</article>`).join('');
updateModes();render();
window.addEventListener('pagehide',()=>{unbindControls?.();stageMotion?.destroy();comparisonMotion.forEach(player=>player.destroy());},{once:true});
