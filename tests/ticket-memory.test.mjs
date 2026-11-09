import test from 'node:test';
import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {createTicketSource} from '../studio/ticket-source.mjs';
import {createTicketMemory} from '../studio/ticket-memory.mjs';

const snapshot=tickets=>({total:tickets.length,tickets});
const ticket=number=>({schemaVersion:1,id:`ticket-00000000-0000-0000-0000-${String(number).padStart(12,'0')}`,target:'stade',type:'gap',title:`Ticket ${number}`,
  description:'En mangel',requestedChange:'En konkret ændring',area:'studio',tags:[],files:[],reproductionSteps:[],priority:'normal',status:'new',assignee:null,duplicateOf:null,
  createdAt:'2026-11-09T09:00:00.000Z',updatedAt:'2026-11-09T09:00:00.000Z',createdBy:'test',revision:1});
const file=value=>new File([JSON.stringify(value)],'tickets.json',{type:'application/json'});
const drain=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function folder(number,permission='granted'){
  const entry=ticket(number);
  return {kind:'directory',name:'tickets',permission,queries:0,prompts:0,reads:0,
    async queryPermission(options){assert.deepEqual(options,{mode:'read'});this.queries++;return this.permission;},
    async requestPermission(options){assert.deepEqual(options,{mode:'read'});this.prompts++;this.permission='granted';return this.permission;},
    async *values(){this.reads++;yield {kind:'directory',name:entry.id,async *values(){yield {kind:'file',name:'000001.json',async getFile(){return file(entry);}};}};}};
}
function environment(candidate){
  const timers=new Map(),listeners=new Map();let timerId=0;
  const env={picks:0,view:{document:{visibilityState:'visible',addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type);}},
    setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},
    async showDirectoryPicker(options){assert.deepEqual(options,{mode:'read',id:'stade-tickets'});env.picks++;return candidate;}}};
  return env;
}
function memory(initial=null){
  return {value:initial,reads:0,writes:[],async read(){this.reads++;return this.value;},async write(value){this.writes.push(value);this.value=value;}};
}

test('a remembered granted directory reconnects on subscription without a picker or prompt',async()=>{
  const remembered=folder(1),store=memory(remembered),env=environment(folder(2));
  const source=createTicketSource(snapshot([]),{view:env.view,memory:store});
  assert.equal(store.reads,0);
  const unsubscribe=source.subscribe(()=>{});await drain();
  assert.equal(store.reads,1);assert.equal(env.picks,0);assert.equal(remembered.prompts,0);
  assert.equal(source.state.connected,true);assert.equal(source.state.remembered,true);assert.equal(source.state.tickets[0].title,'Ticket 1');
  unsubscribe();const again=source.subscribe(()=>{});await drain();
  assert.equal(store.reads,1);assert.equal(store.writes.length,0);
  again();source.destroy();
});

test('prompt and denied remembered permissions wait for a click that reuses the directory',async()=>{
  for(const permission of ['prompt','denied']){
    const remembered=folder(1,permission),store=memory(remembered),env=environment(folder(2));
    const source=createTicketSource(snapshot([]),{view:env.view,memory:store});source.subscribe(()=>{});await drain();
    assert.equal(source.state.remembered,true);assert.equal(source.state.connected,false);
    assert.equal(remembered.prompts,0);assert.equal(remembered.reads,0);assert.equal(env.picks,0);
    const connecting=source.connect();
    assert.equal(remembered.prompts,1,'permission must be requested synchronously in the click call');
    await connecting;
    assert.equal(source.state.connected,true);assert.equal(source.state.tickets[0].title,'Ticket 1');assert.equal(env.picks,0);assert.equal(store.value,remembered);
    source.destroy();
  }
});

test('an unsuccessful renewed permission preserves the remembered directory and current data',async()=>{
  const remembered=folder(1,'prompt'),store=memory(remembered),env=environment(folder(2));
  remembered.requestPermission=async()=>{remembered.prompts++;return 'denied';};
  const source=createTicketSource(snapshot([ticket(3)]),{view:env.view,memory:store});source.subscribe(()=>{});await drain();await source.connect();
  assert.equal(source.state.connected,false);assert.equal(source.state.remembered,true);assert.equal(source.state.tickets[0].title,'Ticket 3');
  assert.match(source.state.error,/Læseadgang/);assert.equal(env.picks,0);assert.equal(store.writes.length,0);source.destroy();
});

test('choosing a different directory replaces the remembered reference, while cancellation preserves it',async()=>{
  const remembered=folder(1,'prompt'),replacement=folder(2),store=memory(remembered),env=environment(replacement);
  const source=createTicketSource(snapshot([]),{view:env.view,memory:store});source.subscribe(()=>{});await drain();
  env.view.showDirectoryPicker=async()=>{env.picks++;throw new DOMException('Cancelled','AbortError');};
  await source.connect({choose:true});assert.equal(source.state.remembered,true);assert.equal(store.value,remembered);assert.equal(store.writes.length,0);
  env.view.showDirectoryPicker=async()=>{env.picks++;return replacement;};await source.connect({choose:true});
  assert.equal(remembered.prompts,0);assert.equal(store.value,replacement);assert.equal(source.state.tickets[0].title,'Ticket 2');source.destroy();
});

test('public builds never read, save or delete remembered private directories',async()=>{
  const store={read(){assert.fail('Public memory read');},write(){assert.fail('Public memory write');}},env=environment(folder(1));
  const source=createTicketSource({...snapshot([]),public:true},{view:env.view,memory:store});source.subscribe(()=>{});await drain();
  await source.connect();await source.connect({choose:true});await source.importFile(file(snapshot([ticket(1)])));await source.disconnect();
  assert.equal(env.picks,0);assert.equal(source.state.source,'public');assert.equal(source.state.total,0);source.destroy();
});

test('late remembered reads and permission checks cannot override a newer chosen source',async()=>{
  for(const stage of ['read','permission'])for(const action of ['connect','import','disconnect','destroy']){
    const gate=deferred(),started=deferred(),remembered=folder(1),replacement=folder(2),store=memory(remembered),env=environment(replacement);
    if(stage==='read')store.read=()=>{store.reads++;started.resolve();return gate.promise;};
    else remembered.queryPermission=()=>{remembered.queries++;started.resolve();return gate.promise;};
    const source=createTicketSource(snapshot([]),{view:env.view,memory:store});source.subscribe(()=>{});await started.promise;
    if(action==='connect')await source.connect({choose:true});
    else if(action==='import')await source.importFile(file(snapshot([ticket(3)])));
    else await source[action]();
    const before=JSON.stringify(source.state);gate.resolve(stage==='read'?remembered:'granted');await drain();
    assert.equal(JSON.stringify(source.state),before,`${stage} restore overrode ${action}`);
    assert.equal(remembered.reads,0);source.destroy();
  }
});

test('forget and valid import are saved after an earlier slow directory save',async()=>{
  for(const action of ['disconnect','import']){
    const candidate=folder(1),store=memory(),gate=deferred(),started=deferred(),env=environment(candidate);
    store.write=async value=>{store.writes.push(value);if(value){started.resolve();await gate.promise;}store.value=value;};
    const source=createTicketSource(snapshot([]),{view:env.view,memory:store});
    const connecting=source.connect();await started.promise;
    const forgetting=action==='import'?source.importFile(file(snapshot([ticket(2)]))):source.disconnect();await drain();
    assert.deepEqual(store.writes,[candidate]);assert.equal(source.state.remembered,false);assert.equal(source.state.connected,false);
    gate.resolve();await Promise.all([connecting,forgetting]);
    assert.deepEqual(store.writes,[candidate,null]);assert.equal(store.value,null);
    if(action==='import')assert.equal(source.state.tickets[0].title,'Ticket 2');source.destroy();
  }
});

test('invalid imports preserve the saved directory, while a valid import forgets it',async()=>{
  const candidate=folder(1),store=memory(candidate),env=environment(candidate),source=createTicketSource(snapshot([]),{view:env.view,memory:store});
  source.subscribe(()=>{});await drain();
  await source.importFile(new File(['{'],'invalid.json'));
  assert.equal(source.state.connected,true);assert.equal(source.state.remembered,true);assert.equal(store.writes.length,0);assert.equal(store.value,candidate);
  await source.importFile(file(snapshot([ticket(2)])));
  assert.equal(source.state.source,'import');assert.equal(source.state.remembered,false);assert.equal(store.value,null);source.destroy();
});

test('storage failures leave a working session and permit retrying a failed forget',async()=>{
  const candidate=folder(1),env=environment(candidate),store=memory();
  store.read=async()=>{throw new Error('Storage denied');};store.write=async()=>{throw new Error('Storage full');};
  const source=createTicketSource(snapshot([]),{view:env.view,memory:store});source.subscribe(()=>{});await drain();
  assert.match(source.state.memoryError,/kunne ikke hentes/);await source.connect();
  assert.equal(source.state.connected,true);assert.equal(source.state.tickets[0].title,'Ticket 1');assert.match(source.state.memoryError,/denne session/);
  await source.refresh();assert.equal(source.state.connected,true);assert.equal(source.state.tickets[0].title,'Ticket 1');
  await source.disconnect();assert.equal(source.state.connected,false);assert.match(source.state.memoryError,/kunne ikke glemme/);
  store.write=async value=>{store.value=value;};await source.disconnect();assert.equal(source.state.memoryError,'');assert.equal(store.value,null);source.destroy();
});

test('an unavailable IndexedDB falls back to session mode without preventing reads or forgets',async()=>{
  const store=createTicketMemory({});assert.equal(await store.read(),null);assert.equal(await store.write(null),null);
  await assert.rejects(store.write(folder(1)),/ikke tilgængeligt/);
});
