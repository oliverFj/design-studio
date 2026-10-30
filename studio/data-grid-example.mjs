import {createComponentRenderer,mountDataGrid} from '../core/components.mjs';

const columns=[{id:'name',label:'Arbejdsområde',editable:true,required:true},{id:'quantity',label:'Antal',type:'number',min:0,max:999,step:1,editable:true},{id:'status',label:'Status',type:'select',options:[{value:'Kladde',label:'Kladde'},{value:'Klar',label:'Klar'},{value:'Godkendt',label:'Godkendt'}],editable:true}];
const initialRows=()=>[{id:'entrance',label:'Indgang',cells:{name:'Indgang og fællesarealer',quantity:4,status:'Kladde'}},{id:'workshop',label:'Værksted',cells:{name:'Værksted med et længere navn',quantity:2,status:'Klar'}},{id:'archive',label:'Arkiv',readOnly:true,cells:{name:'Arkiv · kun læsning',quantity:6,status:'Godkendt'}}];
export function renderDataGridExample(pack,idPrefix='data-grid-example',render=createComponentRenderer(pack)){
 return '<div data-grid-example>'+render('data-grid',{idPrefix,label:'Planlæg arbejdsområder',columns,rows:initialRows()})+render('toolbar',{label:'Afprøv datagrid',slots:{root:[
  {component:'button',options:{text:'Indsæt eksempel',variant:'tertiary',attrs:{'data-grid-paste-sample':''}}},
  {component:'button',options:{text:'Vend rækkefølge',variant:'tertiary',attrs:{'data-grid-reverse':''}}},
  {component:'button',options:{text:'Nulstil eksempel',variant:'ghost',attrs:{'data-grid-reset':''}}}
 ]}})+'<p role="status" data-grid-example-result>Vælg en celle. Afviste værdier bevares som kladder; den sidste række kan kun læses.</p></div>';
}
export function bindDataGridExamples(root){
 const controls=[],listeners=[];
 for(const example of root.querySelectorAll('[data-grid-example]')){
  const result=example.querySelector('[data-grid-example-result]');
  const grid=mountDataGrid(example,{label:'Planlæg arbejdsområder',columns,rows:initialRows(),onCommit(changes,{reason}){result.textContent=changes.length+' celler ændret'+(reason==='paste'?' ved indsætning.':'.')+' Ændringerne findes i dette eksempel.';}});controls.push(grid);
  const listen=(selector,handler)=>{const button=example.querySelector(selector);button.addEventListener('click',handler);listeners.push([button,handler]);};
  listen('[data-grid-paste-sample]',()=>{if(grid.draft){result.textContent='Afslut eller annullér kladden først.';return;}grid.clearSelection();grid.update({activeCell:{rowId:'entrance',columnId:'name'}});grid.paste('Nyt fællesområde\t8\tKlar');});
  listen('[data-grid-reverse]',()=>{if(!grid.update({rows:grid.rows.reverse()}))result.textContent='Afslut eller annullér kladden først.';});
  listen('[data-grid-reset]',()=>{grid.cancelEdit({restoreFocus:false});grid.clearSelection();grid.update({rows:initialRows(),activeCell:{rowId:'entrance',columnId:'name'}});result.textContent='Eksemplet er nulstillet.';});
 }
 return {destroy(){for(const control of controls)control.destroy();for(const [node,handler]of listeners)node.removeEventListener('click',handler);}};
}
