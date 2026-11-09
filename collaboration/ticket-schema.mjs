import {z} from 'zod';
import {TICKET_TYPES,TICKET_STATUSES,TICKET_PRIORITIES} from './catalog.mjs';
const short=z.string().trim().min(1).max(300),prose=z.string().trim().min(1).max(6000);
const relative=short.refine(value=>!/^(?:[a-z]:|[\\/])|(?:^|[\\/])\.\.(?:[\\/]|$)|[\u0000-\u001f]/i.test(value),'Filhenvisninger skal være relative uden ..-led.');
export const ticketIdSchema=z.string().regex(/^ticket-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
const catalogId=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const ids=z.array(catalogId).max(20).refine(values=>new Set(values).size===values.length,'Henvisninger må ikke gentages.');
export const ticketRelationsSchema=z.object({components:ids.default([]),patterns:ids.default([])}).strict();
export const ticketResolutionSchema=z.object({
  summary:prose,
  changes:z.array(z.object({file:relative,note:prose}).strict()).min(1).max(20),
  verification:z.object({kind:z.enum(['tested','source-inspection','user-report']),summary:prose}).strict(),
  heuristicIds:ids.default([]),
}).strict();
const fields={type:z.enum(Object.keys(TICKET_TYPES)),title:short,description:prose,requestedChange:prose,area:short,
  reportedFrom:short.optional(),tags:z.array(z.string().trim().min(1).max(80)).max(20),
  files:z.array(relative).max(20),reproductionSteps:z.array(prose).max(15),relations:ticketRelationsSchema};
export const createTicketSchema=z.object({...fields,tags:fields.tags.default([]),files:fields.files.default([]),reproductionSteps:fields.reproductionSteps.default([]),relations:ticketRelationsSchema.default({components:[],patterns:[]}),priority:z.enum(Object.keys(TICKET_PRIORITIES)).default('normal'),actor:short}).strict();
export const ticketChangesSchema=z.object({...Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,value.optional()])),
  priority:z.enum(Object.keys(TICKET_PRIORITIES)).optional(),status:z.enum(Object.keys(TICKET_STATUSES)).optional(),assignee:short.nullable().optional(),duplicateOf:ticketIdSchema.nullable().optional(),resolution:ticketResolutionSchema.nullable().optional()}).strict();
export const ticketSchema=z.object({...fields,schemaVersion:z.literal(1),id:ticketIdSchema,target:z.literal('stade'),priority:z.enum(Object.keys(TICKET_PRIORITIES)),status:z.enum(Object.keys(TICKET_STATUSES)),
  relations:ticketRelationsSchema.default({components:[],patterns:[]}),
  assignee:short.nullable(),duplicateOf:ticketIdSchema.nullable(),createdAt:z.string().datetime(),updatedAt:z.string().datetime(),createdBy:short,revision:z.number().int().positive().max(500),
  resolution:ticketResolutionSchema.nullable().default(null),
  history:z.array(z.object({at:z.string().datetime(),actor:short,note:z.string().max(6000),changes:z.record(z.string(),z.unknown())}).strict()).min(1).max(500),
}).strict().refine(value=>value.history.length===value.revision,'Historikken skal følge ticketens revision.').refine(value=>value.status!=='in_progress'||Boolean(value.assignee),'En ticket i gang skal have en ansvarlig.').refine(value=>value.status!=='duplicate'||Boolean(value.duplicateOf),'En dublet skal henvise til en ticket.').refine(value=>value.status==='duplicate'||value.duplicateOf===null,'duplicateOf bruges kun til dubletter.');
export const searchTicketsSchema=z.object({query:z.string().max(300).optional(),type:z.enum(Object.keys(TICKET_TYPES)).optional(),status:z.enum(['open','all',...Object.keys(TICKET_STATUSES)]).optional(),priority:z.enum(Object.keys(TICKET_PRIORITIES)).optional(),area:short.optional(),component:catalogId.optional(),pattern:catalogId.optional(),limit:z.number().int().min(1).max(50).optional(),offset:z.number().int().min(0).max(2000).optional()}).strict();
export const updateTicketSchema=z.object({id:ticketIdSchema,expectedRevision:z.number().int().positive().max(500),changes:ticketChangesSchema,actor:short,note:prose.optional()}).strict().refine(value=>Object.keys(value.changes).length>0||Boolean(value.note),'Angiv en ændring eller en kommentar.');
export const ticketSummarySchema=z.object({id:ticketIdSchema,title:short,type:fields.type,status:z.enum(Object.keys(TICKET_STATUSES)),priority:z.enum(Object.keys(TICKET_PRIORITIES)),area:short,reportedFrom:short.optional(),assignee:short.nullable(),createdAt:z.string().datetime(),updatedAt:z.string().datetime(),revision:z.number().int().positive(),summary:z.string(),duplicateOf:ticketIdSchema.nullable(),relations:ticketRelationsSchema.default({components:[],patterns:[]}),resolution:ticketResolutionSchema.nullable().default(null)});
