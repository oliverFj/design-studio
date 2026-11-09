import {renderComponent} from '../core/components.mjs';
import {downloadFile} from '../core/files.mjs';
import {COMPONENT_LIBRARY} from '../core/library.mjs';
import {COMPOSITIONS} from '../patterns/catalog.mjs';
import {TICKET_TYPES,TICKET_STATUSES,TICKET_PRIORITIES} from '../collaboration/catalog.mjs';
import {createTicketSource} from './ticket-source.mjs';
import snapshot from './bundled-tickets.mjs';

const source=createTicketSource(snapshot);
const draft={query:'',type:'',status:'open',open:new Set()};
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const closed=new Set(['resolved','declined','duplicate']);
const selected=()=>source.state.tickets.filter(entry=>(!draft.type||entry.type===draft.type)&&(draft.status==='all'||(draft.status==='open'?!closed.has(entry.status):entry.status===draft.status))&&draft.query.toLocaleLowerCase('da').split(/\s+/).every(word=>JSON.stringify(entry).toLocaleLowerCase('da').includes(word)));
const p=text=>({tag:'p',text});
const evidenceLabels={'tested':'Afprøvet','source-inspection':'Kildegennemgang','user-report':'Brugerobservation'};
const date=value=>value?new Intl.DateTimeFormat('da-DK',{dateStyle:'short',timeStyle:'medium',timeZone:'Europe/Copenhagen'}).format(new Date(value)):'ukendt tidspunkt';
function sourceLabel(){
  const state=source.state;
  if(state.source==='public')return 'Den private indbakke er ikke med i denne udgave.';
  if(state.remembered&&!state.connected)return 'Ticketmappen er husket · Giv læseadgang for at forbinde igen';
  if(state.source==='build')return 'Gemt kopi fra build · '+date(state.builtAt)+' · Opdateres ikke automatisk';
  if(state.source==='import')return 'Importeret kopi · Læst '+date(state.checkedAt)+' · Opdateres ikke automatisk';
  return (state.connected?'Forbundet til ticketmappen':'Frakoblet · Seneste læsning bevaret')+' · Sidst læst '+date(state.checkedAt);
}
function relations(theme,entry){
  const buttons=[['component',entry.relations?.components??[],COMPONENT_LIBRARY],['pattern',entry.relations?.patterns??[],COMPOSITIONS]].flatMap(([kind,ids,catalog])=>ids.map(id=>renderComponent(theme,'button',{variant:'ghost',size:'small',text:catalog[id]?.name??id,attrs:{'data-ticket-target':kind,'data-ticket-target-id':id}})));
  return buttons.length?'<div class="ticket-relations" role="group" aria-label="Berørte komponenter og mønstre">'+buttons.join('')+'</div>':'';
}
function details(entry){
  const proof=entry.resolution;
  return [{tag:'h4',text:'Ønsket ændring'},p(entry.requestedChange),
    ...(entry.reproductionSteps.length?[{tag:'h4',text:'Genskabelse'},{tag:'ol',children:entry.reproductionSteps.map(text=>({tag:'li',text}))}]:[]),
    ...(entry.files.length?[{tag:'h4',text:'Berørte Stade-filer'},{tag:'ul',children:entry.files.map(text=>({tag:'li',text}))}]:[]),
    p('Område: '+entry.area+(entry.reportedFrom?' · Indberettet fra '+entry.reportedFrom:'')),p('Ansvarlig: '+(entry.assignee??'Ikke tildelt')),
    ...(entry.latestNote?[{tag:'h4',text:'Seneste note'},p(entry.latestNote+' · '+entry.updatedBy)]:[]),
    ...(proof?[{tag:'h4',text:'Rettelse'},p(proof.summary),{tag:'ul',children:proof.changes.map(change=>({tag:'li',text:change.file+' — '+change.note}))},
      {tag:'h4',text:'Kontrol · '+evidenceLabels[proof.verification.kind]},p(proof.verification.summary),
      ...(proof.heuristicIds.length?[{tag:'h4',text:'Heuristik fra arbejdet'},...proof.heuristicIds.map(id=>({component:'button',options:{variant:'ghost',size:'small',text:id,attrs:{'data-ticket-target':'heuristic','data-ticket-target-id':id}}}))]:[])]:entry.status==='resolved'?[p('Historisk afslutning: den gemte post har endnu ingen struktureret rettelse og kontrol.')]:[]),
    ...(entry.duplicateOf?[p('Dublet af '+entry.duplicateOf)]:[]),p(entry.id+' · Revision '+entry.revision+' · '+entry.updatedAt)];
}
function results(theme){
  const entries=selected();
  if(!entries.length)return renderComponent(theme,'empty-state',{slots:{title:'Ingen tickets i denne visning',body:snapshot.public?'Tickets opbevares lokalt og medtages ikke i webudgaven.':source.state.connected?'Ingen tickets passer til filtrene. Indbakken opdateres automatisk.':'Prøv andre filtre, eller forbind ticketmappen for at læse den aktuelle indbakke.'}});
  return entries.map(entry=>renderComponent(theme,'card',{attrs:{'data-ticket-id':entry.id},slots:{header:{tag:'h3',text:entry.title},body:[p(entry.description),
    {component:'accordion',options:{idPrefix:entry.id,items:[{id:entry.id,label:'Læs ønsket og grundlaget',open:draft.open.has(entry.id),content:details(entry)}]}}],
    footer:[{component:'badge',options:{text:TICKET_TYPES[entry.type]}},{component:'badge',options:{text:TICKET_STATUSES[entry.status],variant:entry.status==='in_progress'?'accent':'neutral'}},{tag:'span',text:'Prioritet: '+TICKET_PRIORITIES[entry.priority]}]}}).replace('</article>',()=>relations(theme,entry)+'</article>')).join('');
}
export function renderTicketInbox(theme){
  const options=(entries,current)=>entries.map(([value,label])=>'<option value="'+value+'"'+(value===current?' selected':'')+'>'+label+'</option>').join('');
  const button=(text,id,other={})=>renderComponent(theme,'button',{text,variant:'tertiary',size:'small',attrs:{id,...other}});
  return `<section class="connections-section ticket-inbox" aria-labelledby="ticket-inbox-title"><h2 id="ticket-inbox-title" class="connections-section-title">Tickets og ændringsønsker til Stade</h2>
    <p class="connections-copy">Fejl, mangler og udvidelsesforslag samles her. Heuristik nedenfor beskriver gode praksisser, der kan gives videre.</p>
    <p class="connections-note">${snapshot.public?'Indbakken er lokal og offentliggøres ikke på hjemmesiden.':'Forbind mappen tickets i Stades collaboration-mappe med læseadgang. Stade husker mappen i denne browser og forbinder automatisk, når læseadgangen stadig gælder. Indbakken læses cirka hvert tredje sekund, mens denne visning er åben og siden er synlig. Tickets ændres gennem MCP.'}</p>
    ${snapshot.public?'':`<div class="ticket-source-actions">${button(source.state.remembered?'Giv læseadgang':'Forbind ticketmappe','ticket-connect',{disabled:!source.supported(),hidden:source.state.connected})}${button('Vælg anden mappe','ticket-choose',{hidden:!source.state.remembered,disabled:!source.supported()})}${button('Læs nu','ticket-refresh',{disabled:!source.state.connected})}${button('Frakobl og glem','ticket-disconnect',{hidden:!source.state.remembered})}${button('Indlæs oversigt','ticket-import')}<input type="file" id="ticket-import-file" accept=".json,application/json" hidden></div>${source.supported()?'':'<p class="connections-note">Mappeforbindelse er ikke tilgængelig i denne browser. Indlæs en JSON-oversigt i stedet.</p>'}`}
    <p id="ticket-source-status" class="connections-note">${escape(sourceLabel())}</p><p id="ticket-memory-error" class="connections-note"${source.state.memoryError?'':' hidden'}>${escape(source.state.memoryError)}</p><p id="ticket-source-error" class="error-box" role="alert"${source.state.error?'':' hidden'}>${escape(source.state.error)}</p>
    <form class="ticket-filters" role="search" aria-label="Søg i tickets"><label class="studio-field" for="ticket-query">Søg<input id="ticket-query" class="studio-input" type="search" value="${escape(draft.query)}" placeholder="Titel, område eller behov"></label><label class="studio-field" for="ticket-type">Type<select id="ticket-type" class="studio-input">${options([['','Alle typer'],...Object.entries(TICKET_TYPES)],draft.type)}</select></label><label class="studio-field" for="ticket-status">Status<select id="ticket-status" class="studio-input">${options([['open','Åbne'],['all','Alle'],...Object.entries(TICKET_STATUSES)],draft.status)}</select></label></form>
    <div class="experience-result-bar"><p id="ticket-count" role="status">${selected().length} viste · ${source.state.total} tickets i kilden</p>${renderComponent(theme,'button',{text:'Hent ticket-oversigt',variant:'tertiary',disabled:!source.state.tickets.length,attrs:{id:'ticket-export'}})}</div><div class="ticket-results">${results(theme)}</div></section>`;
}
export function bindTicketInbox(root,theme,{onNavigate=()=>{}}={}){
  let dataRevision=source.state.dataRevision,busy=false;
  const text=(selector,value)=>{const node=root.querySelector(selector);if(node&&node.textContent!==value)node.textContent=value;};
  const update=()=>{
    const host=root.querySelector('.ticket-results'),active=root.ownerDocument.activeElement;
    const focused=host.contains(active)?active.closest('[data-ticket-id]')?.dataset.ticketId:null;
    host.innerHTML=results(theme);
    text('#ticket-count',selected().length+' viste · '+source.state.total+' tickets i kilden');
    const exporting=root.querySelector('#ticket-export');exporting.disabled=!source.state.tickets.length;exporting.setAttribute('aria-disabled',String(exporting.disabled));
    if(focused)(host.querySelector('[data-ticket-id="'+focused+'"] summary')??root.querySelector('#ticket-query')).focus({preventScroll:true});
  };
  const updateSource=state=>{
    text('#ticket-source-status',sourceLabel());text('#ticket-source-error',state.error);root.querySelector('#ticket-source-error').hidden=!state.error;
    text('#ticket-memory-error',state.memoryError);root.querySelector('#ticket-memory-error').hidden=!state.memoryError;
    const connect=root.querySelector('#ticket-connect');if(connect){connect.disabled=busy||!source.supported();connect.hidden=state.connected;connect.textContent=state.remembered?'Giv læseadgang':'Forbind ticketmappe';}
    const choose=root.querySelector('#ticket-choose');if(choose){choose.disabled=busy||!source.supported();choose.hidden=!state.remembered;}
    const refresh=root.querySelector('#ticket-refresh');if(refresh)refresh.disabled=busy||!state.connected;
    const disconnect=root.querySelector('#ticket-disconnect');if(disconnect)disconnect.hidden=!state.remembered&&!state.memoryError;
    const importing=root.querySelector('#ticket-import');if(importing)importing.disabled=busy;
    if(dataRevision!==state.dataRevision){dataRevision=state.dataRevision;update();}
  };
  const unsubscribe=source.subscribe(updateSource);
  const action=async operation=>{busy=true;updateSource(source.state);try{await operation();}finally{busy=false;updateSource(source.state);}};
  root.querySelector('.ticket-filters').addEventListener('submit',event=>event.preventDefault());
  for(const [id,key,type]of [['ticket-query','query','input'],['ticket-type','type','change'],['ticket-status','status','change']])root.querySelector('#'+id).addEventListener(type,event=>{draft[key]=event.target.value;update();});
  root.querySelector('#ticket-connect')?.addEventListener('click',()=>action(()=>source.connect()));
  root.querySelector('#ticket-choose')?.addEventListener('click',()=>action(()=>source.connect({choose:true})));
  root.querySelector('#ticket-refresh')?.addEventListener('click',()=>source.refresh());
  root.querySelector('#ticket-disconnect')?.addEventListener('click',()=>source.disconnect());
  root.querySelector('#ticket-import')?.addEventListener('click',()=>root.querySelector('#ticket-import-file').click());
  root.querySelector('#ticket-import-file')?.addEventListener('change',event=>{const file=event.target.files[0];if(file)action(()=>source.importFile(file));event.target.value='';});
  root.querySelector('#ticket-export').addEventListener('click',()=>downloadFile('stade-tickets.json',JSON.stringify({total:source.state.total,tickets:source.state.tickets,readAt:source.state.checkedAt},null,2)+'\n','application/json'));
  root.querySelector('.ticket-results').addEventListener('toggle',event=>{const id=event.target.closest('[data-ticket-id]')?.dataset.ticketId;if(id){if(event.target.open)draft.open.add(id);else draft.open.delete(id);}},true);
  root.querySelector('.ticket-results').addEventListener('click',event=>{const target=event.target.closest('[data-ticket-target]');if(!target)return;const {ticketTarget:kind,ticketTargetId:id}=target.dataset;
    if(kind==='heuristic'){const entry=root.querySelector('[data-experience-id="'+id+'"]');if(entry){const detail=entry.querySelector('details');if(detail)detail.open=true;entry.scrollIntoView({block:'start',behavior:'smooth'});}}
    else onNavigate({kind,id});
  });
  return {destroy:unsubscribe};
}
