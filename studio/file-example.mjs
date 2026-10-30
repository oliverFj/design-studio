import {createComponentRenderer,mountFileUpload} from '../core/components.mjs';

export function renderFileExample(pack,idPrefix='file-example',render=createComponentRenderer(pack),variant='drop'){
 return '<div data-file-example>'+render('file-upload',{idPrefix,variant,label:'Vælg lokale tekstfiler',hint:'Vælg op til tre .txt- eller .json-filer på højst 1 MB hver. Du kan også slippe dem på fladen.',accept:'.txt,.json',multiple:true,maxSize:1048576,maxFiles:3,drop:true})+render('button',{text:'Ryd filvalget',variant:'tertiary',disabled:true,attrs:{'data-file-clear':''}})+'</div>';
}

export function bindFileExamples(root){
 const controls=[],listeners=[];
 for(const example of root.querySelectorAll('[data-file-example]')){
  const clear=example.querySelector('[data-file-clear]');
  const control=mountFileUpload(example.querySelector('.ds-file-upload'),{onChange(files){clear.disabled=files.length===0;clear.setAttribute('aria-disabled',String(files.length===0));if(files.length)clear.removeAttribute('disabled');else clear.setAttribute('disabled','');}});
  const reset=()=>{if(control.clear())example.querySelector('.ds-file-upload__control').focus();};clear.addEventListener('click',reset);listeners.push(()=>clear.removeEventListener('click',reset));controls.push(control);
 }
 return {destroy(){for(const control of controls)control.destroy();for(const dispose of listeners)dispose();}};
}
