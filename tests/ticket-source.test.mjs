import test from 'node:test';
import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {createTicketSource,readTicketDirectory,ticketSnapshot,ticketView} from '../studio/ticket-source.mjs';

const id=number=>`ticket-00000000-0000-0000-0000-${String(number).padStart(12,'0')}`;
const ticket=(number=1,overrides={})=>({schemaVersion:1,id:id(number),target:'stade',type:'bug',title:`Ticket ${number}`,description:'Beskrivelse',requestedChange:'En konkret ændring',area:'studio',
  tags:[],files:[],reproductionSteps:[],priority:'normal',status:'new',assignee:null,duplicateOf:null,createdAt:'2026-11-09T09:00:00.000Z',updatedAt:'2026-11-09T09:00:00.000Z',createdBy:'test',revision:1,
  history:[{at:'2026-11-09T09:00:00.000Z',actor:'test',note:'Oprettet',changes:{}}],...overrides});
const snapshot=entries=>({total:entries.length,tickets:entries});
const jsonFile=(value,name='tickets.json')=>new File([JSON.stringify(value)],name,{type:'application/json'});
function revision(value,name=`${String(value.revision).padStart(6,'0')}.json`){
  return {kind:'file',name,reads:0,async getFile(){this.reads++;return jsonFile(value,name);}};
}
function directory(name,children=[]){
  return {kind:'directory',name,children,permission:'granted',queries:0,prompts:0,
    async *values(){yield* this.children;},
    async queryPermission(options){assert.deepEqual(options,{mode:'read'});this.queries++;return this.permission;},
    requestPermission(){this.prompts++;throw new Error('Background refresh must never prompt.');}};
}
const inbox=(...values)=>directory('tickets',values.map(value=>directory(value.id,[revision(value)])));
function browser(pick){
  const events=new Map(),timers=new Map();let timerId=0;
  const view={document:{visibilityState:'visible',addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}},
    setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(key){timers.delete(key);},
    async showDirectoryPicker(options){assert.deepEqual(options,{mode:'read',id:'stade-tickets'});return pick();}};
  return {view,timers,events,visibility(value){view.document.visibilityState=value;events.get('visibilitychange')?.();},
    tick(){assert.equal(timers.size,1);const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}};
}
const drain=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}

test('directory inbox reads newest published revisions and ignores temporary and incomplete entries',async()=>{
  const first=ticket(),updated=ticket(1,{revision:2,title:'Opdateret'}),closed=ticket(2,{status:'resolved',priority:'high'});
  const newest=revision(updated),folder=directory('tickets',[
    directory(first.id,[revision(first),{kind:'file',name:'.partial.tmp',getFile(){assert.fail('Temporary file read');}},newest]),
    directory(id(3),[]),directory('other',[revision(ticket(4))]),{kind:'file',name:'notes.json'},directory(closed.id,[revision(closed)]),
  ]);
  const result=await readTicketDirectory(folder);
  assert.equal(result.total,2);assert.deepEqual(result.tickets.map(entry=>entry.title),['Opdateret','Ticket 2']);assert.equal(newest.reads,1);
  assert.equal(result.tickets[0].latestNote,'Oprettet');assert.equal('history' in result.tickets[0],false);
});

test('directory adapter rejects mismatched records, corrupt latest revision, oversized files and wrong folder',async()=>{
  await assert.rejects(readTicketDirectory(directory('collaboration')),/Vælg mappen tickets/);
  await assert.rejects(readTicketDirectory(directory('tickets',[directory(id(1),[revision(ticket(2))])])),/id eller revision/);
  await assert.rejects(readTicketDirectory(directory('tickets',[directory(id(1),[revision(ticket(1),'000002.json')])])),/id eller revision/);
  const corrupt={kind:'file',name:'000002.json',async getFile(){return new File(['{'],'000002.json');}};
  await assert.rejects(readTicketDirectory(directory('tickets',[directory(id(1),[revision(ticket()),corrupt])])),/gyldig JSON/);
  const large={kind:'file',name:'000001.json',async getFile(){return {size:128*1024+1,text(){assert.fail('Oversized file read');}};}};
  await assert.rejects(readTicketDirectory(directory('tickets',[directory(id(1),[large])])),/for stor/);
});

test('snapshot rejects malformed and duplicate records, while legacy tickets retain view defaults',()=>{
  assert.deepEqual(ticketView(ticket()).relations,{components:[],patterns:[]});assert.equal(ticketView(ticket()).resolution,null);
  assert.throws(()=>ticketSnapshot({total:0,tickets:[ticket()]}),/Vælg en ticket-oversigt/);
  assert.throws(()=>ticketSnapshot(snapshot([ticket(),ticket()])),/gentagne ticket-id/);
  assert.throws(()=>ticketSnapshot(snapshot([ticket(1,{status:'unknown'})])),/ugyldige data/);
});

test('source polls without overlap, observes new revisions and preserves data revision when content is unchanged',async()=>{
  const folder=inbox(ticket()),env=browser(()=>folder),source=createTicketSource(snapshot([]),{view:env.view});
  await source.connect();assert.equal(source.state.connected,true);assert.equal(env.timers.size,0);
  const unsubscribe=source.subscribe(()=>{});await drain();assert.equal(env.timers.size,1);
  const before=source.state.dataRevision;await source.refresh();assert.equal(source.state.dataRevision,before);
  folder.children[0].children.push(revision(ticket(1,{revision:2,title:'Ny revision'})));
  env.tick();await drain();assert.equal(source.state.tickets[0].title,'Ny revision');assert.equal(source.state.dataRevision,before+1);assert.equal(env.timers.size,1);
  const read=deferred(),started=deferred();folder.children[0].children.push({kind:'file',name:'000003.json',getFile(){started.resolve();return read.promise;}});
  const pending=source.refresh();await started.promise;const queries=folder.queries;const second=source.refresh();
  assert.equal(folder.queries,queries);read.resolve(jsonFile(ticket(1,{revision:3})));await Promise.all([pending,second]);
  assert.equal(source.state.tickets[0].revision,3);unsubscribe();assert.equal(env.timers.size,0);source.destroy();
});

test('visibility and subscriber lifecycle pause polling and resume with a fresh read',async()=>{
  const folder=inbox(ticket()),env=browser(()=>folder),source=createTicketSource(snapshot([]),{view:env.view});
  const unsubscribe=source.subscribe(()=>{});await source.connect();assert.equal(env.timers.size,1);
  env.visibility('hidden');assert.equal(env.timers.size,0);const queries=folder.queries;await source.refresh();assert.equal(folder.queries,queries);
  folder.children.push(directory(id(2),[revision(ticket(2))]));env.visibility('visible');await drain();assert.equal(source.state.total,2);assert.equal(env.timers.size,1);
  unsubscribe();assert.equal(env.timers.size,0);assert.equal(env.events.size,0);
  const queriesBefore=folder.queries;const unsubscribeAgain=source.subscribe(()=>{});await drain();assert.equal(folder.queries,queriesBefore+1);assert.equal(env.timers.size,1);
  unsubscribeAgain();source.destroy();assert.equal(env.events.size,0);
});

test('revoked or prompt permission disconnects without prompting and keeps the last valid data',async()=>{
  for(const permission of ['denied','prompt']){
    const folder=inbox(ticket()),env=browser(()=>folder),source=createTicketSource(snapshot([]),{view:env.view});
    const unsubscribe=source.subscribe(()=>{});await source.connect();const entries=source.state.tickets;folder.permission=permission;await source.refresh();
    assert.equal(source.state.connected,false);assert.equal(source.state.tickets,entries);assert.match(source.state.error,/Læseadgangen/);assert.equal(folder.prompts,0);assert.equal(env.timers.size,0);
    unsubscribe();source.destroy();
  }
});

test('cancelled selection and invalid import preserve the active source; valid import disconnects it',async()=>{
  let selection=inbox(ticket());const env=browser(()=>selection),source=createTicketSource(snapshot([]),{view:env.view});
  const unsubscribe=source.subscribe(()=>{});await source.connect();const entries=source.state.tickets;
  env.view.showDirectoryPicker=async()=>{throw new DOMException('Cancelled','AbortError');};await source.connect();
  assert.equal(source.state.connected,true);assert.equal(source.state.tickets,entries);assert.equal(source.state.error,'');
  await source.importFile(new File(['{'],'bad.json'));assert.equal(source.state.connected,true);assert.equal(source.state.tickets,entries);assert.match(source.state.error,/gyldig JSON/);
  await source.importFile(jsonFile({total:0,tickets:[ticket()]}));assert.equal(source.state.tickets,entries);assert.equal(source.state.source,'folder');
  await source.importFile(jsonFile(snapshot([ticket(2)])));assert.equal(source.state.source,'import');assert.equal(source.state.connected,false);assert.equal(source.state.tickets[0].id,id(2));assert.equal(env.timers.size,0);
  unsubscribe();source.destroy();
});

test('a malformed newly published revision leaves the previous valid view and successful read time intact',async()=>{
  const folder=inbox(ticket()),env=browser(()=>folder),source=createTicketSource(snapshot([]),{view:env.view});await source.connect();
  const entries=source.state.tickets,checkedAt=source.state.checkedAt;
  folder.children[0].children.push({kind:'file',name:'000002.json',async getFile(){return new File(['{'],'000002.json');}});
  await source.refresh();assert.equal(source.state.tickets,entries);assert.equal(source.state.checkedAt,checkedAt);assert.match(source.state.error,/gyldig JSON/);assert.equal(source.state.connected,true);
  source.destroy();
});

test('in-flight old refresh cannot replace a later import or restore a disconnected source',async()=>{
  for(const nextAction of ['disconnect','import','destroy']){
    const folder=inbox(ticket()),env=browser(()=>folder),source=createTicketSource(snapshot([]),{view:env.view});await source.connect();
    const read=deferred(),started=deferred();folder.children[0].children.push({kind:'file',name:'000002.json',getFile(){started.resolve();return read.promise;}});
    const pending=source.refresh();await started.promise;
    if(nextAction==='import')await source.importFile(jsonFile(snapshot([ticket(2)])));else source[nextAction]();
    const after=JSON.stringify(source.state);read.resolve(jsonFile(ticket(1,{revision:2,title:'Stale'})));await pending;
    assert.equal(JSON.stringify(source.state),after);if(nextAction!=='destroy')assert.equal(source.state.connected,false);source.destroy();
  }
});

test('late picker completion cannot reconnect after explicit disconnect',async()=>{
  const pick=deferred(),env=browser(()=>pick.promise),source=createTicketSource(snapshot([]),{view:env.view});
  const connecting=source.connect();source.disconnect();pick.resolve(inbox(ticket()));await connecting;
  assert.equal(source.state.connected,false);assert.equal(source.state.total,0);source.destroy();
});

test('the latest selected source wins even when an earlier source finishes reading first',async()=>{
  for(const methods of [['connect','connect'],['import','import'],['connect','import'],['import','connect']]){
    const env=browser(()=>assert.fail('Picker fixture missing')),source=createTicketSource(snapshot([]),{view:env.view});
    function selection(method,number){
      const read=deferred(),started=deferred(),value=method==='import'?snapshot([ticket(number)]):ticket(number),contents=JSON.stringify(value);
      const file={size:Buffer.byteLength(contents),async text(){started.resolve();return read.promise;}};
      if(method==='connect')env.view.showDirectoryPicker=async()=>directory('tickets',[directory(id(number),[{kind:'file',name:'000001.json',async getFile(){return file;}}])]);
      return {started:started.promise,finish(){read.resolve(contents);},pending:method==='connect'?source.connect():source.importFile(file)};
    }
    const first=selection(methods[0],1);await first.started;const second=selection(methods[1],2);await second.started;
    first.finish();await first.pending;second.finish();await second.pending;
    assert.equal(source.state.tickets[0].id,id(2),`${methods.join(' then ')}`);source.destroy();
  }
});

test('public snapshots never open a local picker or import private files',async()=>{
  let picks=0;const env=browser(()=>{picks++;return inbox(ticket());});const source=createTicketSource({...snapshot([]),public:true},{view:env.view});
  await source.connect();await source.importFile(jsonFile(snapshot([ticket()])));assert.equal(picks,0);assert.equal(source.state.source,'public');assert.equal(source.state.total,0);source.destroy();
});
