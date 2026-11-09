import { z } from 'zod';

const shortText = z.string().trim().min(1).max(300);
const prose = z.string().trim().min(1).max(6000);
const sourceFile = shortText.refine(value => !/^(?:[a-z]:|[\\/])|(?:^|[\\/])\.\.(?:[\\/]|$)|[\u0000-\u001f]/i.test(value), 'Kildens filsti skal være relativ uden ..-led.');
export const experienceIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);

export const experienceSchema = z.object({
  schemaVersion: z.literal(1),
  id: experienceIdSchema,
  title: shortText,
  summary: z.string().trim().min(1).max(1000),
  status: z.enum(['draft', 'reviewed', 'retired']),
  scope: z.enum(['shared', 'project']),
  project: shortText.optional(),
  tags: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  problem: prose,
  approach: prose,
  verification: z.object({ kind: z.enum(['source-inspection', 'tested', 'user-report']), summary: prose }).strict(),
  limits: z.array(z.string().trim().min(1).max(1500)).min(1).max(20),
  sources: z.array(z.object({ project: shortText, file: sourceFile, line: z.number().int().positive().optional(), note: prose, sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(), revision: shortText.optional() }).strict()).min(1).max(20),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Ugyldig kalenderdato.'),
}).strict().refine(entry => entry.scope !== 'project' || Boolean(entry.project), 'Projekterfaringer skal angive project.');

export const proposalSchema = experienceSchema.refine(entry => entry.status === 'draft', 'Nye erfaringer skal være kladder.');
