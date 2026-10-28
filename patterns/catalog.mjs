export const COMPOSITIONS = Object.freeze({
  editor: Object.freeze({
    name: 'Objekteditor med kontekstpanel', version: '1.1.1', layout: 'workspace',
    description: 'Et søgbart objekttræ og et kontekstpanel med Egenskaber, Relationer og Handlinger, inspireret af FormLab.',
    usage: 'Til værktøjer med hierarkier og multivalg. Produktet leverer sin egen model og arbejdsflade; mønstret er valgfri referencekode.',
    source: Object.freeze({ product: 'FormLab', files: ['object-panel.js', 'ui.js', 'ui.css'], reviewed: '2026-10-27', adaptation: 'Søgehierarki, rækkehandlinger, kontekst, faner og foldesektioner. Tilpasset til en neutral objektmodel uden bygnings- eller 3D-afhængigheder.' }),
    components: ['tree', 'card', 'inspector', 'field', 'select', 'segmented-control', 'segmented-option', 'scroll-area', 'button', 'stack', 'heading', 'text', 'instruction-note'],
    interactions: ['Hierarkisk søgning uden tab af foldetilstand', 'Multivalg med fælles og forskellige værdier', 'Synlighed og låsning uden ændring af valg', 'Kontekst, tastaturbetjente faner og bevarede foldesektioner', 'Validering og klikbar flytning mellem grupper'],
  }),
  form: Object.freeze({
    name: 'Formular med validering', version: '1.0.0', layout: 'form',
    description: 'En lille formular med label, hjælp, feltfejl, bekræftelse og fortrydelse.',
    usage: 'Til indstillinger og registrering. Gemningen i demonstrationen gælder kun denne session; produktet bestemmer sin lagring.',
    components: ['card', 'field', 'checkbox', 'button', 'stack', 'alert', 'heading', 'text'],
    interactions: ['Fejl forbindes med felterne', 'Fokus flyttes til første fejl', 'Fortryd gendanner senest gemte værdier'],
  }),
  'list-detail': Object.freeze({
    name: 'Liste med detaljevisning', version: '1.0.0', layout: 'split',
    description: 'Find en post med søgning, vælg den, og arbejd videre i detaljevisningen.',
    usage: 'Til biblioteker, forløb og samlinger. Produktet bestemmer indhold, handlinger og eventuel navigation.',
    components: ['card', 'field', 'button', 'stack', 'badge', 'heading', 'text', 'instruction-note'],
    interactions: ['Filtrering og tomt søgeresultat', 'Valg og detaljer holdes sammen', 'Markering af gennemgåede poster'],
  }),
  'resource-library': Object.freeze({
    name: 'Ressourcebibliotek', version: '1.0.0', layout: 'workspace',
    description: 'Find og genbrug ressourcer med søgning, typefiltre, favoritter og kort- eller listevisning.',
    usage: 'Til skabeloner, øvelser, scenarier og andre samlinger. Produktet leverer ressourcerne og bestemmer, hvad Brug ressourcen gør.',
    components: ['card', 'field', 'select', 'checkbox', 'segmented-control', 'segmented-option', 'button', 'stack', 'badge', 'heading', 'text', 'instruction-note'],
    interactions: ['Kombineret søgning og filtrering', 'Favoritter uden at overtage valg', 'Kort- og listevisning med bevaret tilstand', 'Tomt bibliotek og ingen søgeresultater', 'Brug en ressource gennem produktets callback'],
  }),
  history: Object.freeze({
    name: 'Fortryd og gentag', version: '1.0.0', layout: 'form',
    description: 'Et lille dokument med navngivne ændringer, fortryd, gentag og et tydeligt gemmepunkt.',
    usage: 'Til redigering, hvor brugeren skal kunne eksperimentere trygt. Produktet vælger, hvad ét trin omfatter, og hvornår en ændring faktisk er gemt.',
    components: ['card', 'field', 'button', 'stack', 'badge', 'heading', 'text', 'instruction-note'],
    interactions: ['Ét afsluttet greb eller feltvalg pr. trin', 'Ny ændring efter fortryd rydder gentag-grenen', 'Ctrl/⌘+Z, Ctrl+Y og Ctrl/⌘+Shift+Z', 'Native tekstfelter beholder deres egen fortrydelse', 'Gemmepunkt følger dokumentets indhold'],
  }),
});

export const PATTERN_FILES = Object.freeze(['catalog.mjs', 'compositions.mjs', 'object-workbench.mjs', 'resource-library.mjs', 'history.mjs', 'history-editor.mjs', 'gallery.mjs', 'styles.css']);
