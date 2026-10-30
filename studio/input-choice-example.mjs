import {createComponentRenderer,mountCombobox,mountMultiselect} from '../core/components.mjs';

const people=[{id:'anna',label:'Anna Larsen'},{id:'mikkel',label:'Mikkel Holm'},{id:'sara',label:'Sara Østergaard'},{id:'unavailable',label:'En person, der ikke kan vælges',disabled:true}];

/** Product examples bind the public controller and retain real selected IDs. */
export function renderInputChoiceExample(pack,role,idPrefix='input-choice-example',render=createComponentRenderer(pack),variant){
 const multiple=role==='multiselect',picker=role==='date-picker'||role==='time-picker';
 const options={idPrefix,variant,label:role==='date-picker'?'Dato for gennemgang':role==='time-picker'?'Tidspunkt for gennemgang':multiple?'Ansvarlige for projektet':'Projektets kontaktperson',hint:picker?'Browseren leverer indtastning og den lokale vælger.':'Skriv for at filtrere. Brug piletaster, Enter og Escape.',...(role==='date-picker'?{value:'2026-11-02',min:'2026-01-01',max:'2030-12-31'}:role==='time-picker'?{value:'09:30',min:'08:00',max:'18:00',step:900}:multiple?{items:people,values:['anna']}:{items:people,value:'mikkel'})};
 return '<div data-input-choice-example="'+role+'">'+render(role,options)+'<p role="status" data-input-choice-result>Værdier og indtastningskladder tilhører produktet.</p></div>';
}

export function bindInputChoiceExamples(root){
 const controllers=[],listeners=[];
 for(const host of root.querySelectorAll('[data-input-choice-example]')){
  const role=host.getAttribute('data-input-choice-example'),result=host.querySelector('[data-input-choice-result]');
  if(role==='combobox'||role==='multiselect'){
   const element=host.querySelector('[data-input-choice]');
   controllers.push((role==='multiselect'?mountMultiselect:mountCombobox)(element,{onChange(value){result.textContent='Valgt: '+(Array.isArray(value)?value.join(', '):value??'intet')+'.';},onQueryChange(query){result.textContent=query?'Filterkladde: '+query:'Filteret er tomt.';}}));
  }else{
   const input=host.querySelector('input'),change=()=>{result.textContent=input.value?'Valgt værdi: '+input.value+'.':'Ingen værdi valgt.';};
   input.addEventListener('input',change);listeners.push(()=>input.removeEventListener('input',change));
  }
 }
 return {destroy(){for(const controller of controllers)controller.destroy();for(const dispose of listeners)dispose();}};
}
