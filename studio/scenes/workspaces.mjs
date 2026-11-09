import {createComponentFactory,mountDataTable} from '../../core/components.mjs';
import {createCompositionState,mountComposition} from '../../patterns/compositions.mjs';

const node=(document,tag,className,text)=>{const result=document.createElement(tag);if(className)result.className=className;if(text!==undefined)result.textContent=text;return result;};
const seedEditor=()=>{
 const state=createCompositionState('editor');
 state.objects=[
  {id:'collection',kind:'group',label:'Rum 03 · Udstilling',visible:true,locked:false},
  {id:'panel',groupId:'collection',kind:'object',label:'Scenografi',width:8,visible:true,locked:false},
  {id:'detail',parent:'panel',kind:'object',label:'Titelfelt',width:3,visible:true,locked:false},
  {id:'caption',parent:'panel',kind:'object',label:'Værkbeskrivelse',width:5,visible:true,locked:false},
  {id:'archive',kind:'group',label:'Alternative opstillinger',visible:true,locked:false},
 ];
 return state;
};

/** The same object editor as the pattern library, with a concrete exhibition model. */
export function mountEditorScene(theme,{document=globalThis.document,state={},idPrefix='case-editor',announce=()=>{}}={}){
 state.workbench ||= seedEditor();
 const c=createComponentFactory(theme,{document});
 const element=node(document,'section','case-editor');element.setAttribute('aria-label','Formværk · udstillingseditor');
 const header=node(document,'header','case-editor__header');
 const identity=node(document,'div');identity.append(c('text',{variant:'small',text:'FORMVÆRK / UDSTILLINGSRUM'}),c('heading',{variant:'title',text:'Rum til nye perspektiver'}));
 const documentInfo=node(document,'div','case-editor__document');documentInfo.append(c('badge',{variant:'accent',text:'Rum 03'}),c('text',{variant:'small',text:'En arbejdskopi til næste udstilling'}));
 header.append(identity,documentInfo);
 const editor=mountComposition(theme,'editor',{document,state:state.workbench,idPrefix:idPrefix+'-objects',announce});
 const intro=editor.element.firstChild;
 intro.replaceChildren(c('heading',{variant:'panel',text:'Din opstilling'}),c('text',{variant:'secondary',text:'Vælg et element i rummet, eller find det i lagene. Justér navn, bredde og placering i egenskaberne.'}));
 element.append(header,editor.element);
 return {element,state,destroy(){editor.destroy();}};
}

const PROJECTS=Object.freeze([
 {id:'lys',name:'Lys i byen',kind:'Visuel identitet',owner:'Lea Holm',initials:'LH',due:'12. november',status:'active',progress:68,note:'Afstem de sidste skilte med resten af identiteten.',tasks:8,completed:5},
 {id:'kyst',name:'Langs kysten',kind:'Redaktionelt website',owner:'Noah Lund',initials:'NL',due:'14. november',status:'review',progress:90,note:'Forsiden er klar til en fælles gennemgang.',tasks:12,completed:10},
 {id:'rum',name:'Rum for ro',kind:'Udstillingsdesign',owner:'Aya Berg',initials:'AB',due:'18. november',status:'active',progress:42,note:'Undersøg overgangen mellem de to udstillingsrum.',tasks:10,completed:4},
 {id:'papir',name:'Papir & perspektiv',kind:'Tryksag',owner:'Lea Holm',initials:'LH',due:'20. november',status:'planned',progress:12,note:'Saml skitser og papirprøver til første oplæg.',tasks:6,completed:1},
 {id:'spor',name:'Nye spor',kind:'Kampagne',owner:'Milo Vang',initials:'MV',due:'24. november',status:'planned',progress:5,note:'Første workshop er planlagt.',tasks:9,completed:0},
 {id:'form',name:'Form & fællesskab',kind:'Visuel identitet',owner:'Aya Berg',initials:'AB',due:'6. november',status:'done',progress:100,note:'Alle leverancer er gennemgået.',tasks:7,completed:7},
]);
const STATUSES=Object.freeze({planned:'Planlagt',active:'I gang',review:'Til review',done:'Afsluttet'});

/** A small project workspace. All figures are derived from the editable sample data. */
export function mountOverviewScene(theme,{document=globalThis.document,state={},idPrefix='case-overview',announce=()=>{}}={}){
 state.projects ||= PROJECTS.map(project=>({...project}));state.query??='';state.status??='all';state.selected??=state.projects[0].id;state.notes ||= {};
 const c=createComponentFactory(theme,{document});
 const element=node(document,'section','case-overview');element.setAttribute('aria-label','Studio Nord · projektoverblik');
 const header=node(document,'header','case-overview__header');
 const identity=node(document,'div');identity.append(c('text',{variant:'small',text:'STUDIO NORD / ARBEJDSRUM'}),c('heading',{variant:'title',text:'Plads til det næste.'}),c('text',{variant:'secondary',text:'Et fælles overblik over projekter, fremskridt og næste skridt.'}));
 header.append(identity,c('badge',{variant:'accent',text:'Eksempelprojekter'}));
 const metrics=node(document,'div','case-overview__metrics');
 const workspace=node(document,'div','case-overview__workspace'),list=node(document,'section','case-overview__list'),detail=node(document,'aside','case-overview__detail');detail.setAttribute('aria-label','Det valgte projekt');
 const toolbar=node(document,'div','case-overview__filters');
 const search=c('field',{idPrefix:idPrefix+'-search',label:'Find projekt',type:'search',value:state.query,placeholder:'Navn, fagområde eller ansvarlig',hint:''});
 const filter=c('field',{idPrefix:idPrefix+'-status',label:'Fase',hint:'',slots:{control:{tag:'select',children:[{tag:'option',attrs:{value:'all'},text:'Alle faser'},...Object.entries(STATUSES).map(([id,label])=>({tag:'option',attrs:{value:id},text:label}))]}}});
 const input=search.querySelector('input'),select=filter.querySelector('select');select.value=state.status;
 toolbar.append(search,filter);
 const tableHost=node(document,'div','case-overview__table'),count=c('text',{variant:'small',text:'',attrs:{role:'status'}});
 list.append(toolbar,count,tableHost);workspace.append(list,detail);
 const footnote=c('text',{variant:'small',text:'Vælg et projekt for at se næste skridt. Dine noter følger med, når du skifter tema.'});
 element.append(header,metrics,workspace,footnote);
 let tableController,detailCleanups=[];
 const cleanups=[];
 const listen=(target,event,handler)=>{target.addEventListener(event,handler);cleanups.push(()=>target.removeEventListener(event,handler));};
 const card=(title,body)=>{const result=c('card',{slots:{header:title,body:[],footer:''}});result.querySelector('.ds-card__body').replaceChildren(...body);result.querySelector('.ds-card__footer').remove();return result;};
 function renderMetrics(){
  const total=state.projects.length,active=state.projects.filter(project=>project.status==='active').length,review=state.projects.filter(project=>project.status==='review').length,completed=state.projects.filter(project=>project.status==='done').length;
  metrics.replaceChildren(...[['Projekter',total],['I gang',active],['Til review',review],['Afsluttet',completed]].map(([label,value])=>{const result=card(label,[c('heading',{variant:'title',text:String(value)})]);result.className+=' case-overview__metric';return result;}));
 }
 function choose(id){if(!state.projects.some(project=>project.id===id))return;state.selected=id;renderDetail();tableController?.update({selectedIds:[id]});}
 function renderTable(){
  tableController?.destroy();
  const query=state.query.trim().toLocaleLowerCase('da');
  const visible=state.projects.filter(project=>(state.status==='all'||project.status===state.status)&&(!query||[project.name,project.kind,project.owner].join(' ').toLocaleLowerCase('da').includes(query)));
  const table=c('data-table',{idPrefix:idPrefix+'-table',label:'Aktuelle projekter',selection:'single',selectedIds:[state.selected],emptyText:'Ingen projekter matcher dit valg.',columns:[{id:'project',label:'Projekt'},{id:'phase',label:'Fase'},{id:'next',label:'Næste skridt'}],rows:visible.map(project=>({id:project.id,label:project.name,cells:{project:[{component:'text',options:{text:project.name}},{component:'text',options:{variant:'small',text:project.kind}}],phase:{component:'badge',options:{variant:project.status==='review'?'accent':'neutral',text:STATUSES[project.status]}},next:project.due},actions:[{id:'open',label:'Se '+project.name}]}))});
  tableHost.replaceChildren(table);count.textContent=visible.length+' af '+state.projects.length+' projekter';
  tableController=mountDataTable(table,{onSelectionChange:ids=>{if(ids.length)choose(ids.at(-1));},onAction:id=>{choose(id);detail.querySelector('textarea')?.focus();}});
 }
 function renderDetail(){
  for(const cleanup of detailCleanups)cleanup();detailCleanups=[];
  const project=state.projects.find(project=>project.id===state.selected)||state.projects[0];state.selected=project.id;
  const identity=node(document,'div','case-overview__project-identity');
  identity.append(c('badge',{variant:'accent',text:STATUSES[project.status]}),c('heading',{variant:'subtitle',text:project.name}),c('text',{variant:'secondary',text:project.kind}));
  const owner=node(document,'div','case-overview__owner');
  const initials=node(document,'span','case-overview__initials',project.initials);initials.setAttribute('aria-hidden','true');
  owner.append(initials,c('text',{variant:'small',text:project.owner+' · ansvarlig'}));
  const progress=c('progress',{label:'Fremdrift',value:project.progress,max:100,idPrefix:idPrefix+'-progress'});
  const description=c('text',{variant:'small',text:project.completed+' af '+project.tasks+' opgaver · næste skridt '+project.due});
  const note=c('textarea',{idPrefix:idPrefix+'-note',label:'Projektnote',hint:'',value:state.notes[project.id]??project.note});
  const control=note.querySelector('textarea'),remember=()=>{state.notes[project.id]=control.value;};control.addEventListener('input',remember);detailCleanups.push(()=>control.removeEventListener('input',remember));
  const transition={planned:['Sæt i gang','active'],active:['Send til review','review'],review:['Markér klar','done'],done:['Åbn projektet igen','active']}[project.status];
  const action=c('button',{text:transition[0],variant:'primary'});
  const move=()=>{project.status=transition[1];if(project.status==='done'){project.progress=100;project.completed=project.tasks;}renderMetrics();renderTable();renderDetail();detail.querySelector('button')?.focus();announce(project.name+' er nu '+STATUSES[project.status].toLocaleLowerCase('da')+'.');};
  action.addEventListener('click',move);detailCleanups.push(()=>action.removeEventListener('click',move));
  const content=card('Projektet lige nu',[identity,owner,progress,description,note,action]);
  detail.replaceChildren(content);
 }
 listen(input,'input',()=>{state.query=input.value;renderTable();});listen(select,'change',()=>{state.status=select.value;renderTable();});
 renderMetrics();renderTable();renderDetail();
 return {element,state,destroy(){tableController?.destroy();for(const cleanup of [...cleanups,...detailCleanups])cleanup();}};
}
