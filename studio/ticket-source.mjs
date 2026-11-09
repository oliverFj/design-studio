import {readJSONFile} from '../core/files.mjs';
import {TICKET_TYPES,TICKET_STATUSES,TICKET_PRIORITIES} from '../collaboration/catalog.mjs';
import {createTicketMemory} from './ticket-memory.mjs';

const ticketId=/^ticket-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const MAX_BYTES=128*1024,MAX_TOTAL=8*1024*1024,MAX_TICKETS=2000;
const text=(value,max=6000)=>typeof value==='string'&&value.length<=max;
const strings=(value,max=20)=>Array.isArray(value)&&value.length<=max&&value.every(item=>text(item));
const timestamp=value=>text(value,100)&&Number.isFinite(Date.parse(value));

/** A read-only view adapter. The authoritative write schema stays in the MCP
 * service; this adapter selects bounded, renderable data and executes no paths. */
export function ticketView(value){
  if(!value||value.schemaVersion!==1||!ticketId.test(value.id)||!Number.isInteger(value.revision)||value.revision<1||value.revision>500
    ||!Object.hasOwn(TICKET_TYPES,value.type)||!Object.hasOwn(TICKET_STATUSES,value.status)||!Object.hasOwn(TICKET_PRIORITIES,value.priority)
    ||!['title','description','requestedChange','area','createdBy'].every(key=>text(value[key])&&value[key].trim())
    ||!timestamp(value.createdAt)||!timestamp(value.updatedAt)||!strings(value.files)||!strings(value.tags)||!strings(value.reproductionSteps,15)
    ||!(value.assignee===null||text(value.assignee,300))||!(value.duplicateOf===null||ticketId.test(value.duplicateOf)))throw new Error('Ticketfilen indeholder ugyldige data. Den seneste visning er bevaret.');
  const relations=value.relations??{components:[],patterns:[]};
  if(!strings(relations.components)||!strings(relations.patterns))throw new Error('Ticketens relationer er ugyldige.');
  const resolution=value.resolution??null;
  if(resolution&&(!text(resolution.summary)||!Array.isArray(resolution.changes)||resolution.changes.length>20
    ||!resolution.changes.every(item=>item&&text(item.file,300)&&text(item.note))||!strings(resolution.heuristicIds)
    ||!resolution.verification||!['tested','source-inspection','user-report'].includes(resolution.verification.kind)||!text(resolution.verification.summary)))throw new Error('Ticketens afslutning indeholder ugyldige data.');
  const last=Array.isArray(value.history)?value.history.at(-1):null;
  return {schemaVersion:1,id:value.id,target:'stade',type:value.type,title:value.title,description:value.description,requestedChange:value.requestedChange,area:value.area,
    reportedFrom:text(value.reportedFrom,300)?value.reportedFrom:undefined,tags:value.tags,files:value.files,reproductionSteps:value.reproductionSteps,
    priority:value.priority,status:value.status,assignee:value.assignee,duplicateOf:value.duplicateOf,createdAt:value.createdAt,updatedAt:value.updatedAt,createdBy:value.createdBy,revision:value.revision,
    relations,resolution,latestNote:text(last?.note)?last.note:text(value.latestNote)?value.latestNote:'',updatedBy:text(last?.actor,300)?last.actor:text(value.updatedBy,300)?value.updatedBy:value.createdBy};
}

const sort=entries=>entries.sort((a,b)=>Number(['resolved','declined','duplicate'].includes(a.status))-Number(['resolved','declined','duplicate'].includes(b.status))
  ||({high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority])||b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));

export function ticketSnapshot(value){
  if(!value||!Array.isArray(value.tickets)||value.tickets.length>MAX_TICKETS||!Number.isInteger(value.total)||value.total<value.tickets.length||value.total>MAX_TICKETS)throw new Error('Vælg en ticket-oversigt fra Stade. Den seneste visning er bevaret.');
  const tickets=sort(value.tickets.map(ticketView));
  if(new Set(tickets.map(entry=>entry.id)).size!==tickets.length)throw new Error('Oversigten indeholder gentagne ticket-id’er.');
  return {total:value.total,tickets};
}

export async function readTicketDirectory(directory){
  if(directory?.kind!=='directory'||directory.name!=='tickets')throw new Error('Vælg mappen tickets i Stades collaboration-mappe.');
  const entries=[];let bytes=0,count=0;
  for await(const child of directory.values()){
    if(child.kind!=='directory'||!ticketId.test(child.name))continue;
    if(++count>MAX_TICKETS)throw new Error('Indbakken indeholder mere end 2000 tickets.');
    let latest=null;
    for await(const file of child.values())if(file.kind==='file'&&/^\d{6}\.json$/.test(file.name)&&(!latest||file.name>latest.name))latest=file;
    if(!latest)continue; // A producer has created the folder but not published revision 1 yet.
    const file=await latest.getFile();bytes+=file.size;
    if(bytes>MAX_TOTAL)throw new Error('Indbakken er for stor til denne visning. Brug MCP til den samlede gennemgang.');
    const entry=ticketView(await readJSONFile(file,{maxBytes:MAX_BYTES}));
    if(entry.id!==child.name||entry.revision!==Number(latest.name.slice(0,6)))throw new Error('Ticketens id eller revision svarer ikke til filen.');
    entries.push(entry);
  }
  return {total:entries.length,tickets:sort(entries)};
}

/** Remember only the selected handle. Restore/poll never prompt or write to the
 * folder; renewed read permission requires a direct user action. */
export function createTicketSource(initial,{view=globalThis,interval=3000,memory=createTicketMemory(view)}={}){
  const state={...ticketSnapshot(initial),source:initial.public?'public':'build',checkedAt:null,builtAt:initial.builtAt??null,error:'',memoryError:'',remembered:false,connected:false,dataRevision:0};
  let handle=null,remembered=null,restored=false,saving=Promise.resolve(),timer=null,pending=null,generation=0,selection=0,signature=JSON.stringify(state.tickets),disposed=false;
  const listeners=new Set(),document=view.document;
  const emit=()=>{for(const listener of listeners)listener(state);};
  const stop=()=>{if(timer!==null)view.clearTimeout(timer);timer=null;};
  const visible=()=>document?.visibilityState!=='hidden';
  async function persist(value,epoch=generation){
    // A later forget must always run after any earlier save, even on slow storage.
    const operation=saving.then(()=>memory.write(value));saving=operation.catch(()=>{});
    try{await operation;}catch{if(epoch===generation&&!disposed){state.memoryError=value?'Mappen er forbundet i denne session, men browseren kunne ikke huske den til næste gang.':'Browseren kunne ikke glemme mappen. Prøv Frakobl igen.';emit();}}
  }
  function commit(data,source){
    const next=JSON.stringify(data.tickets);
    if(signature!==next||state.total!==data.total){state.dataRevision++;signature=next;}
    Object.assign(state,data,{source,checkedAt:new Date().toISOString(),error:'',connected:Boolean(handle)});emit();
  }
  function schedule(){stop();if(!disposed&&handle&&listeners.size&&visible())timer=view.setTimeout(()=>{timer=null;refresh().finally(schedule);},interval);}
  async function refresh(){
    if(!handle||disposed||!visible())return;
    if(pending)return pending;
    const current=handle,epoch=generation;
    const operation=(async()=>{
      try{
        if(await current.queryPermission({mode:'read'})!=='granted'){const error=new Error('Læseadgangen er udløbet. Forbind ticketmappen igen.');error.name='NotAllowedError';throw error;}
        const data=await readTicketDirectory(current);
        if(epoch===generation&&!disposed)commit(data,'folder');
      }catch(error){
        if(epoch!==generation||disposed)return;
        if(['NotAllowedError','SecurityError'].includes(error.name)){handle=null;generation++;stop();state.connected=false;}
        state.error=error.message||'Indbakken kunne ikke læses. Den seneste visning er bevaret.';emit();
      }
    })();
    pending=operation;try{await operation;}finally{if(pending===operation)pending=null;}
  }
  async function restore(){
    const epoch=generation,choice=selection;
    const current=()=>epoch===generation&&choice===selection&&!disposed;
    try{
      const candidate=await memory.read();
      if(!current()||!candidate)return;
      if(candidate.kind!=='directory'||candidate.name!=='tickets'||typeof candidate.queryPermission!=='function')throw new Error('Ugyldig mappehenvisning.');
      const permission=await candidate.queryPermission({mode:'read'});
      if(!current())return;
      remembered=candidate;state.remembered=true;emit();
      if(permission==='granted'){handle=candidate;await refresh();schedule();}
    }catch{if(current()){state.memoryError='Den huskede mappe kunne ikke hentes. Vælg ticketmappen igen.';emit();}}
  }
  const visibility=()=>{if(visible()&&handle)refresh().finally(schedule);else stop();};
  return {
    state,
    supported:()=>typeof view.showDirectoryPicker==='function',
    subscribe(listener){
      listeners.add(listener);listener(state);
      if(listeners.size===1){document?.addEventListener('visibilitychange',visibility);if(handle)refresh().finally(schedule);else if(!restored&&!initial.public){restored=true;restore();}}
      return ()=>{listeners.delete(listener);if(!listeners.size){stop();document?.removeEventListener('visibilitychange',visibility);}};
    },
    async connect({choose=false}={}){
      if(initial.public||disposed)return;
      const choice=++selection;
      if(typeof view.showDirectoryPicker!=='function'){state.error='Denne browser kan ikke forbinde en mappe. Indlæs en JSON-oversigt i stedet.';emit();return;}
      const epoch=generation;
      try{
        let candidate=remembered;
        // Both permission and picker calls must precede any await to retain activation.
        if(candidate&&!handle&&!choose){
          if(await candidate.requestPermission({mode:'read'})!=='granted')throw new Error('Læseadgang blev ikke givet. Mappen er stadig husket.');
        }else candidate=await view.showDirectoryPicker({mode:'read',id:'stade-tickets'});
        const data=await readTicketDirectory(candidate);
        if(epoch!==generation||choice!==selection||disposed)return;
        generation++;handle=remembered=candidate;state.remembered=true;state.memoryError='';commit(data,'folder');schedule();await persist(candidate);
      }catch(error){if(error.name==='AbortError'||epoch!==generation||choice!==selection||disposed)return;state.error=error.name==='SecurityError'?'Browseren tillader ikke mappeadgang her. Indlæs en JSON-oversigt i stedet.':error.message;emit();}
    },
    refresh,
    disconnect(){generation++;selection++;handle=remembered=null;stop();state.connected=false;state.remembered=false;state.error='';state.memoryError='';if(state.source==='folder')state.source='disconnected';emit();return initial.public?Promise.resolve():persist(null);},
    async importFile(file){
      if(initial.public||disposed)return;
      const epoch=generation,choice=++selection;
      try{const data=ticketSnapshot(await readJSONFile(file,{maxBytes:MAX_TOTAL}));if(epoch!==generation||choice!==selection||disposed)return;generation++;handle=remembered=null;state.remembered=false;state.memoryError='';stop();commit(data,'import');await persist(null);}
      catch(error){if(epoch===generation&&choice===selection&&!disposed){state.error=error.message;emit();}}
    },
    destroy(){disposed=true;generation++;selection++;handle=null;stop();document?.removeEventListener('visibilitychange',visibility);listeners.clear();},
  };
}
