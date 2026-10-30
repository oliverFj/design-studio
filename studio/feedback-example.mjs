import {createComponentRenderer,mountToast} from '../core/components.mjs';

export function renderFeedbackExample(pack,role,idPrefix='feedback-example',render=createComponentRenderer(pack),variant){
 idPrefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
 const button=(text,attrs={})=>render('button',{text,variant:'tertiary',attrs});
 if(role==='toast'){
  const message=(suffix,actions)=>'<div data-feedback-toast>'+button(actions?'Vis med handling':'Vis kort meddelelse',{'data-feedback-open':''})+render('toast',{idPrefix:idPrefix+'-'+suffix,variant,title:actions?'Elementet er fjernet':'Ændringerne er gemt',body:actions?'Du kan fortryde, indtil du lukker beskeden.':'Beskeden lukker efter fem sekunder. Hover eller fokus sætter tiden på pause.',attrs:{hidden:true},slots:{actions:actions?[{component:'button',options:{text:'Fortryd',attrs:{'data-feedback-action':''}}}]:[]}})+'</div>';
  return '<div data-feedback-example="toast">'+message('timed',false)+message('action',true)+'<p role="status" data-feedback-result></p></div>';
 }
 if(role==='progress')return '<div data-feedback-example="progress">'+render('progress',{idPrefix,variant,label:'Forbereder fire dele',value:0,max:4})+button('Næste del',{'data-feedback-advance':''})+button('Ukendt varighed',{'data-feedback-indeterminate':''})+'<p role="status" data-feedback-result></p></div>';
 if(role==='skeleton')return '<div data-feedback-example="skeleton">'+render('spinner',{label:'Indlæser forhåndsvisningen…'})+'<div aria-busy="true" aria-label="Forhåndsvisning">'+render('skeleton',{variant:variant??'block'})+render('skeleton')+render('skeleton')+'</div></div>';
 if(role==='empty-state')return '<div data-feedback-example="empty-state">'+render('empty-state',{idPrefix,variant,title:'Ingen resultater i denne visning',body:'Ændr søgningen, eller tilføj et element.',slots:{actions:[{component:'button',options:{text:'Afprøv handlingen',attrs:{'data-feedback-empty-action':''}}}]}})+'<p role="status" data-feedback-result></p></div>';
 return '<div data-feedback-example="spinner">'+render('spinner',{variant,label:'Indlæser indhold…'})+'</div>';
}

export function bindFeedbackExamples(root){
 const controls=new Map(),listeners=[];
 const listen=(node,type,fn)=>{if(!node)return;node.addEventListener(type,fn);listeners.push(()=>node.removeEventListener(type,fn));};
 for(const example of root.querySelectorAll('[data-feedback-example]')){
  const result=example.querySelector('[data-feedback-result]');
  for(const wrapper of example.querySelectorAll('[data-feedback-toast]')){
   const toast=wrapper.querySelector('.ds-toast');
   listen(wrapper.querySelector('[data-feedback-open]'),'click',()=>{controls.get(toast)?.destroy();controls.set(toast,mountToast(toast,{onClose:reason=>{if(result&&reason==='dismissed')result.textContent='Beskeden er lukket.';}}));});
   listen(wrapper.querySelector('[data-feedback-action]'),'click',()=>{controls.get(toast)?.close('action');if(result)result.textContent='Handlingen er fortrudt.';});
  }
  const progress=example.querySelector('progress'),value=example.querySelector('.ds-progress__value');
  listen(example.querySelector('[data-feedback-advance]'),'click',()=>{
   const next=Math.min(4,Number(progress.getAttribute('value')??0)+1);progress.setAttribute('value',String(next));value.textContent=Math.round(next/4*100)+' %';
   if(result)result.textContent=next===4?'Alle fire dele er klar.':'';
  });
  listen(example.querySelector('[data-feedback-indeterminate]'),'click',()=>{progress.removeAttribute('value');value.textContent='Arbejder…';if(result)result.textContent='Varigheden er endnu ukendt.';});
  listen(example.querySelector('[data-feedback-empty-action]'),'click',()=>{if(result)result.textContent='Eksempelhandlingen er aktiveret.';});
 }
 return {destroy(){for(const control of controls.values())control.destroy();for(const dispose of listeners)dispose();}};
}
