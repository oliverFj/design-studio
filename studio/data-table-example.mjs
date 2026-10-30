import {createComponentRenderer,mountDataTable} from '../core/components.mjs';

export function renderDataTableExample(pack,idPrefix='data-table-example',render=createComponentRenderer(pack)){
 return '<div data-data-table-example>'+render('data-table',{idPrefix,label:'Samlinger',columns:[{id:'name',label:'Navn',sortable:true},{id:'status',label:'Status',sortable:true}],selection:'multiple',rows:[
  {id:'coast',label:'Kystens fortællinger',cells:{name:'Kystens fortællinger',status:'Klar'},detail:[{component:'field',options:{idPrefix:idPrefix+'-note',label:'En note, der bevares ved sortering',value:'Min kladde',hint:''}}],actions:[{id:'open',label:'Åbn'}]},
  {id:'archive',label:'Arkiv',cells:{name:'Arkiv',status:'Kladde'},detail:'Materiale til senere gennemgang.',actions:[{id:'open',label:'Åbn'}]},
  {id:'locked',label:'Beskyttet samling',cells:{name:'Beskyttet samling',status:'Låst'},disabled:true,actions:[{id:'open',label:'Åbn'}]},
 ],pagination:{label:'Sider i samlingseksemplet',items:[{label:'Forrige',disabled:true},{label:'1',current:true},{label:'Næste',disabled:true}]}})+'<p role="status" data-table-example-result>Sortér, vælg rækker, og åbn detaljerne.</p></div>';
}

export function bindDataTableExamples(root){
 const controllers=[...root.querySelectorAll('[data-data-table-example]')].map(host=>{
  const result=host.querySelector('[data-table-example-result]');let controller;
  controller=mountDataTable(host,{
   onSort(sort){
    const body=host.querySelector('.ds-data-table__body'),rows=[...body.children].filter(node=>node.getAttribute('data-table-row')!==null);
    rows.sort((a,b)=>{
     const value=row=>[...row.querySelectorAll('[data-cell-column]')].find(cell=>cell.getAttribute('data-cell-column')===sort.columnId)?.textContent??'';
     return value(a).localeCompare(value(b),'da',{numeric:true})*(sort.direction==='ascending'?1:-1);
    });
    for(const row of rows){const id=row.getAttribute('data-table-row'),detail=[...body.children].find(node=>node.getAttribute('data-table-detail')===id);body.append(row);if(detail)body.append(detail);}
    controller.update({sort});result.textContent='Rækkerne er sorteret '+(sort.direction==='ascending'?'stigende.':'faldende.');
   },
   onSelectionChange(ids){result.textContent=ids.length+' rækker valgt.';},
   onAction(id,action){result.textContent='Handling: '+action+' · '+id;},
   onExpand(ids){result.textContent=ids.length+' detaljer åbne.';},
  });
  return controller;
 });
 return {destroy(){for(const controller of controllers)controller.destroy();}};
}
