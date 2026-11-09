/** Shared, browser-safe descriptions. Execution stays in the local MCP service. */
export const TOOL_PACKAGES = Object.freeze([
  { id: 'library', name: 'Bibliotek og mønstre', description: 'Find fælles komponenter, designmønstre og deres kilder.', tools: [
    { name: 'search_library', title: 'Søg i biblioteket', description: 'Find eksisterende komponenter, mønstre og vejledninger før nyt arbejde.', readOnly: true },
    { name: 'get_component', title: 'Forklar en komponent', description: 'Hent den centrale komponents anvendelse, dele, varianter og eksempel.', readOnly: true },
  ] },
  { id: 'projects', name: 'Projektgrundlag', description: 'Hent projektets anvisninger og kontrollér dets designtilknytning.', tools: [
    { name: 'get_project_context', title: 'Hent projektgrundlag', description: 'Læs grundlaget for et projekt, som er tilladt ved serverstart.', readOnly: true },
    { name: 'check_project', title: 'Kontrollér projekt', description: 'Kør Stades eksisterende læsende projekttjek uden at udføre projektets scripts.', readOnly: true },
  ] },
  { id: 'experience', name: 'Fælles erfaringer', description: 'Find tidligere erfaringer og indsend nye som kladder til gennemgang.', tools: [
    { name: 'search_experiences', title: 'Find erfaringer', description: 'Søg i erfaringer med tydelig kilde, status og anvendelsesområde.', readOnly: true },
    { name: 'get_experience', title: 'Læs en erfaring', description: 'Læs problemet, fremgangsmåden, belægget og begrænsningerne med automatisk kontrol af de aktuelle kildefiler.', readOnly: true },
    { name: 'check_experience_sources', title: 'Kontrollér erfaringens kilder', description: 'Sammenlign registrerede kildehash med aktuelle filbytes i tilladte projekter uden at ændre erfaringen.', readOnly: true },
    { name: 'propose_experience', title: 'Foreslå en erfaring', description: 'Opret en ny kladde til gennemgang. Kan ikke godkende eller erstatte eksisterende erfaringer.', readOnly: false },
  ] },
]);

export const EXPERIENCE_STATUSES = Object.freeze({ draft: 'Kladde', reviewed: 'Gennemgået', retired: 'Udgået' });

const normalize = value => String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('da');

/** All query words must occur; a missing status excludes retired knowledge. */
export function searchExperiences(entries, { query = '', scope, status } = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return entries.filter(entry => (!scope || entry.scope === scope)
    && (status ? entry.status === status : entry.status !== 'retired')
    && words.every(word => normalize(JSON.stringify(entry)).includes(word)));
}
