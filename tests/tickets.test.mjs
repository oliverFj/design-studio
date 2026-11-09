import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createTicketService} from '../collaboration/tickets.mjs';
import {createCollaborationService,experienceRevision} from '../collaboration/service.mjs';
import {heuristicProposalSchema,experienceSchema} from '../collaboration/schema.mjs';
import {buildStudio} from '../tools/build-studio.mjs';
const execute=promisify(execFile);
const input=(type='enhancement')=>({type,title:'Panelgreb',description:'Grebet er svært at opdage.',requestedChange:'Gør den lukkede tilstand tydelig.',area:'Panelcontroller',actor:'agent-a',files:['core/panels.mjs']});
const resolution=()=>({summary:'Grebet er gjort lettere at finde.',changes:[{file:'core/panels.mjs',note:'Grebet bevares langs kanten.'}],verification:{kind:'tested',summary:'Træk, klik og genåbning er afprøvet i denne testbeskrivelse.'},heuristicIds:[]});
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'stade-tickets-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.writeFile(path.join(root,'experiences.json'),'[]');return {root,service:await createTicketService({root})};}

test('tickets cover bugs, gaps and enhancements with filters, comments and auditable status',async t=>{
 const {root,service}=await fixture(t);
 const entries=await Promise.all(['bug','gap','enhancement'].map(type=>service.createTicket({ticket:input(type)})));
 assert.equal((await service.searchTickets()).total,3);
 assert.equal((await service.searchTickets({type:'gap'})).total,1);
 const page=await service.searchTickets({limit:1});assert.equal(page.hasMore,true);assert.equal(page.results.length,1);
 const id=entries[0].ticket.id;
 await assert.rejects(service.updateTicket({id,expectedRevision:1,changes:{status:'in_progress'},actor:'reviewer'}),/ansvarlig/);
 const active=await service.updateTicket({id,expectedRevision:1,changes:{status:'in_progress',assignee:'agent-b',priority:'high'},actor:'reviewer',note:'Undersøg grebet.'});
 assert.equal(active.ticket.revision,2);assert.equal(active.ticket.history.length,2);
 await assert.rejects(service.updateTicket({id,expectedRevision:2,changes:{status:'resolved'},actor:'agent-b'}),/begrundelse/);
 const resolved=await service.updateTicket({id,expectedRevision:2,changes:{status:'resolved',resolution:resolution()},actor:'agent-b',note:'Rettet og afprøvet med træk og klik.'});
 assert.equal(resolved.ticket.history.at(-1).actor,'agent-b');
 assert.equal((await service.searchTickets()).total,2);assert.equal((await service.searchTickets({status:'resolved'})).total,1);
 assert.equal((await(await createTicketService({root})).getTicket({id})).ticket.revision,3);
 const revisions=await fs.readdir(path.join(root,'tickets',id));assert.deepEqual(revisions.sort(),['000001.json','000002.json','000003.json']);
 assert.equal(JSON.parse(await fs.readFile(path.join(root,'tickets',id,'000001.json'))).status,'new');
});

test('catalog relations can be discovered precisely and comments preserve them',async t=>{
 const {service}=await fixture(t);
 const relations={components:['button'],patterns:['resizable-panel']};
 const first=(await service.createTicket({ticket:{...input(),relations}})).ticket;
 await service.createTicket({ticket:{...input(),relations:{components:['field'],patterns:[]}}});
 const related=await service.searchTickets({component:'button',pattern:'resizable-panel'});
 assert.equal(related.total,1);assert.equal(related.results[0].id,first.id);
 assert.deepEqual(related.results[0].relations,relations);assert.equal(related.results[0].resolution,null);
 assert.equal((await service.searchTickets({component:'field',pattern:'resizable-panel'})).total,0);
 const commented=(await service.updateTicket({id:first.id,expectedRevision:1,changes:{},actor:'reviewer',note:'Sammenhold med panelmønstret.'})).ticket;
 assert.deepEqual(commented.relations,relations);
 assert.deepEqual((await service.snapshot()).tickets.find(item=>item.id===first.id).relations,relations);
});

test('unknown catalog IDs and unsafe resolution references are rejected before publishing',async t=>{
 const {service}=await fixture(t);
 for(const relations of [{components:['invented'],patterns:[]},{components:[],patterns:['invented']},{components:['button','button'],patterns:[]}])await assert.rejects(service.createTicket({ticket:{...input(),relations}}));
 const ticket=(await service.createTicket({ticket:input()})).ticket;
 await assert.rejects(service.updateTicket({id:ticket.id,expectedRevision:1,changes:{relations:{components:['missing'],patterns:[]}},actor:'reviewer'}),/Ukendt komponent/);
 await assert.rejects(service.updateTicket({id:ticket.id,expectedRevision:1,changes:{status:'resolved'},actor:'reviewer',note:'Lukket'}),/resolution/);
 for(const invalid of [{...resolution(),changes:[]},{...resolution(),changes:[{file:'../outside',note:'Ugyldig.'}]},{...resolution(),heuristicIds:['../outside']}])await assert.rejects(service.updateTicket({id:ticket.id,expectedRevision:1,changes:{status:'resolved',resolution:invalid},actor:'reviewer',note:'Lukket'}));
 assert.equal((await service.getTicket({id:ticket.id})).ticket.revision,1);
});

test('resolution links a completed request to the actual change, validation and optional heuristics',async t=>{
 const {service}=await fixture(t),ticket=(await service.createTicket({ticket:input()})).ticket;
 const proof={...resolution(),heuristicIds:['kontroller-aktuel-kilde-foer-historisk-rettelse']};
 const completed=(await service.updateTicket({id:ticket.id,expectedRevision:1,changes:{status:'resolved',resolution:proof},actor:'agent-a',note:'Rettelse og kontrol er dokumenteret.'})).ticket;
 assert.deepEqual(completed.resolution,proof);assert.deepEqual(completed.history.at(-1).changes.resolution,proof);
 const found=await service.searchTickets({status:'resolved'});assert.deepEqual(found.results[0].resolution,proof);
 assert.deepEqual((await service.snapshot()).tickets[0].resolution,proof);
 await assert.rejects(service.updateTicket({id:ticket.id,expectedRevision:2,changes:{resolution:null},actor:'agent-a',note:'Fjern ikke belæg.'}),/resolution/);
});

test('historical closed tickets without relations or resolution remain readable and commentable',async t=>{
 const {root,service}=await fixture(t),ticket=(await service.createTicket({ticket:input()})).ticket;
 const legacy={...ticket,status:'resolved',revision:2,history:[...ticket.history,{at:ticket.updatedAt,actor:'earlier-agent',note:'Afsluttet før sporbar afslutning.',changes:{status:'resolved'}}]};
 delete legacy.relations;delete legacy.resolution;
 await fs.writeFile(path.join(root,'tickets',ticket.id,'000002.json'),JSON.stringify(legacy));
 const read=(await service.getTicket({id:ticket.id})).ticket;
 assert.equal(read.resolution,null);assert.deepEqual(read.relations,{components:[],patterns:[]});
 const commented=(await service.updateTicket({id:ticket.id,expectedRevision:2,changes:{},actor:'reviewer',note:'Historisk afslutning bevares.'})).ticket;
 assert.equal(commented.status,'resolved');assert.equal(commented.resolution,null);assert.equal(commented.revision,3);
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'tickets',ticket.id,'000002.json'),'utf8')),legacy,'reading does not rewrite the original revision');
});

test('independent MCP processes cannot claim the same revision or lose each other’s changes',async t=>{
 const {root,service}=await fixture(t);const {ticket}=await service.createTicket({ticket:input()});
 const module=new URL('../collaboration/tickets.mjs',import.meta.url).href;
 const results=await Promise.allSettled(['one','two'].map(actor=>execute(process.execPath,['--input-type=module','-e',`import {createTicketService} from ${JSON.stringify(module)}; const service=await createTicketService({root:${JSON.stringify(root)}});try {await service.updateTicket({id:${JSON.stringify(ticket.id)},expectedRevision:1,changes:{status:'in_progress',assignee:${JSON.stringify(actor)}},actor:${JSON.stringify(actor)}});}catch(e){console.error(e.message);process.exitCode=1;}`],{windowsHide:true})));
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1,results.map(result=>result.status==='rejected'?(result.reason.stderr||result.reason.message):'ok').join('\n'));
 assert.match(results.find(result=>result.status==='rejected').reason.stderr,/ændret af en anden agent/);
 const current=(await service.getTicket({id:ticket.id})).ticket;assert.equal(current.revision,2);assert.equal(current.history.length,2);
 await assert.rejects(service.updateTicket({id:ticket.id,expectedRevision:1,changes:{title:'Forældet ændring'},actor:'three'}),/aktuelle revision/);
 assert.equal((await service.getTicket({id:ticket.id})).ticket.title,'Panelgreb');
});

test('comment-only updates are kept and a size-limit failure leaves the previous revision intact',async t=>{
 const {root,service}=await fixture(t);let current=(await service.createTicket({ticket:input()})).ticket,limited=false;
 for(let index=0;index<30;index++){
   try{current=(await service.updateTicket({id:current.id,expectedRevision:current.revision,changes:{},actor:'reviewer',note:'Kommentar '+index+' '+ 'x'.repeat(5900)})).ticket;}
   catch(error){assert.match(error.message,/128 KiB/);limited=true;break;}
 }
 assert.equal(limited,true);assert.ok(current.history.at(-1).note.startsWith('Kommentar'));
 assert.deepEqual((await service.getTicket({id:current.id})).ticket,current);
 assert.equal((await fs.readdir(path.join(root,'tickets',current.id))).some(name=>name.endsWith('.tmp')),false);
});

test('duplicates, path boundaries and invalid content do not overwrite tickets or read other projects',async t=>{
 const {root,service}=await fixture(t);
 for(const file of ['../secret','C:/secret','/secret'])await assert.rejects(service.createTicket({ticket:{...input(),files:[file]}}));
 await assert.rejects(service.getTicket({id:'../outside'}));
 const first=(await service.createTicket({ticket:input()})).ticket,second=(await service.createTicket({ticket:input()})).ticket;
 await assert.rejects(service.updateTicket({id:first.id,expectedRevision:1,actor:'review',changes:{status:'duplicate',duplicateOf:first.id},note:'Dublet'}),/sig selv/);
 const duplicate=await service.updateTicket({id:second.id,expectedRevision:1,actor:'review',changes:{status:'duplicate',duplicateOf:first.id},note:'Samme ønske som den første.'});
 assert.equal(duplicate.ticket.duplicateOf,first.id);
 assert.equal((await service.searchTickets({status:'all'})).total,2);
 const before=await fs.readFile(path.join(root,'tickets',first.id,'000001.json'),'utf8');
 await assert.rejects(service.updateTicket({id:first.id,expectedRevision:1,actor:'agent',changes:{files:['../../outside']}}));
 assert.equal(await fs.readFile(path.join(root,'tickets',first.id,'000001.json'),'utf8'),before);
});

test('partial unpublished writes are ignored and symlinked stores are refused',async t=>{
 const {root,service}=await fixture(t);const id='ticket-00000000-0000-0000-0000-000000000001';
 await fs.mkdir(path.join(root,'tickets',id),{recursive:true});await fs.writeFile(path.join(root,'tickets',id,'.partial.tmp'),'{');
 assert.equal((await service.searchTickets()).total,0);
 const other=await fs.mkdtemp(path.join(os.tmpdir(),'stade-ticket-outside-'));t.after(()=>fs.rm(other,{recursive:true,force:true}));
 const linked=path.join(root,'tickets','ticket-00000000-0000-0000-0000-000000000002');
 try{await fs.symlink(other,linked,process.platform==='win32'?'junction':'dir');}catch(error){if(['EPERM','EACCES'].includes(error.code)){t.diagnostic('Miljøet tillader ikke symbolske links.');return;}throw error;}
 await assert.rejects(service.searchTickets(),/almindelig mappe/);
});

test('heuristics have a context, rule and rationale; old knowledge remains readable',async t=>{
 const {root}=await fixture(t),service=await createCollaborationService({experienceRoot:root,allowCuration:true});
 const heuristic={schemaVersion:2,id:'preserve-drafts',title:'Bevar kladder ved panelændringer',summary:'Genbrug DOM og state ved lukning.',status:'draft',scope:'shared',tags:['panel','kladde'],context:'Genmontering efter en visuel ændring mistede brugerens tekst.',heuristic:'Bevar feltets node og kladde, når et panel skjules.',rationale:'En visuel tilstandsændring bør ikke kassere brugerens arbejde.',verification:{kind:'user-report',summary:'Brugeren observerede problemet, og rettelsen blev gennemgået.'},limits:['Kontrollér også fejl, valg og fokus.'],sources:[],updatedAt:'2026-11-09'};
 assert.equal(heuristicProposalSchema.safeParse(heuristic).success,true);
 assert.equal(heuristicProposalSchema.safeParse({...heuristic,heuristic:undefined}).success,false);
 await service.proposeExperience({experience:heuristic});
 const result=await service.getExperience({id:heuristic.id});assert.equal(result.sourceStatus,'unverifiable');assert.deepEqual(result.sourceChecks,[]);
 await service.curateExperience({id:heuristic.id,expectedRevision:experienceRevision(heuristic),experience:{...heuristic,status:'reviewed'}});
 assert.equal((await service.getExperience({id:heuristic.id})).experience.status,'reviewed');
 const old={schemaVersion:1,id:'old',title:'Tidligere erfaring',summary:'Bevares.',status:'draft',scope:'shared',tags:['test'],problem:'En situation.',approach:'En praksis.',verification:{kind:'user-report',summary:'Observeret.'},limits:['Afgrænset.'],sources:[{project:'stade',file:'core/panels.mjs',note:'Filgrundlag.'}],updatedAt:'2026-11-09'};
 assert.equal(experienceSchema.safeParse(old).success,true);assert.equal(heuristicProposalSchema.safeParse(old).success,false);
});

test('local ticket snapshots are excluded from public and distributable builds',async t=>{
 const {root,service}=await fixture(t),marker='PRIVATE-TICKET-CONTENT-72941';
 await service.createTicket({ticket:{...input(),title:marker}});
 const theme=JSON.parse(await fs.readFile(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
 const options={themes:[{key:'studio-light',package:theme}],ticketRoot:root};
 const local=await buildStudio({...options,output:path.join(root,'local.html')});assert.ok(local.includes(marker));
 const publicHTML=await buildStudio({...options,showcase:true,output:path.join(root,'public.html')});assert.equal(publicHTML.includes(marker),false);
 const distribution=await buildStudio({...options,includeTickets:false,output:path.join(root,'distribution.html')});assert.equal(distribution.includes(marker),false);
});
