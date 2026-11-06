import { node, paint, part } from './illustrations-primitives.mjs';

// Reference grammar: anatomy-catalog's button, field, inspector and stack;
// anatomy's image/caption supply landscape, registration and attached text.
// Strokes remain in the 600 × 420 source space, including at menu-card size.
const color = role => role === 'none' ? 'none' : paint(role);
const width = 'var(--g-line-width)';
const L = (x1, y1, x2, y2, role = 'ink', weight = 1) => node('line', { x1, y1, x2, y2, stroke: color(role), 'stroke-width': weight });
const P = (d, fill = 'none', stroke = 'ink', weight = width) => node('path', { d, fill: color(fill), stroke: color(stroke), 'stroke-width': weight });
const R = (x, y, w, h, fill = 'none', stroke = 'ink') => node('rect', { x, y, width: w, height: h, fill: color(fill), stroke: color(stroke), 'stroke-width': width });
const O = (cx, cy, r, fill = 'none', stroke = 'ink') => node('circle', { cx, cy, r, fill: color(fill), stroke: color(stroke), 'stroke-width': width });
const T = (x, y, value, size = 20, fill = 'ink') => node('text', { x, y, fill: color(fill), 'font-family': 'ui-monospace,monospace', 'font-size': size }, [], value);
const rows = (x, y, lengths, gap = 23, role = 'ink') => lengths.map((length, i) => L(x, y + i * gap, x + length, y + i * gap, role));
const dot = (x, y) => O(x, y, 4, 'subject', 'none');
const dim = (x, y, length) => [L(x, y, x + length, y, 'edge'), L(x, y - 6, x, y + 6, 'edge'), L(x + length, y - 6, x + length, y + 6, 'edge')];

const scenes = {
  editor: () => ({
    label: 'Et valgt indlejret objekt forbindes præcist til dets egenskaber i et vedvarende panel.',
    parts: [
      part('nested-objects', 'Indlejrede objekter', 'To indre konturer viser ejerskab; den mindste er udpeget.',
        R(100, 117, 158, 180, 'plane'), R(122, 153, 112, 105, 'plane'),
        R(143, 183, 70, 48, 'context'), L(153, 207, 203, 207, 'subject', 2)),
      part('context-panel', 'Vedvarende panel', 'Egenskaber har et afgrænset sted ved siden af objektet.',
        R(327, 80, 180, 272, 'plane'), L(327, 140, 507, 140, 'edge'), L(347, 247, 487, 247, 'edge')),
      part('properties', 'Navngivne egenskaber', 'Fine labels og korte felter deler samme akse.',
        L(350, 111, 462, 111, 'ink', 2), L(350, 174, 407, 174, 'edge'), R(350, 190, 132, 28, 'plane'),
        L(350, 274, 422, 274, 'edge'), R(350, 290, 132, 28, 'plane')),
      part('selection-link', 'Objektets tilhørsforhold', 'En knækleder løber fra det indlejrede objekt til panelets kant.',
        P('M213 207H282V124H327', 'none', 'subject', 1.5), dot(213, 207)),
    ],
  }),
  'parameter-workbench': () => ({
    label: 'To skydere med præcise værdier styrer en fælles grafisk prøve.',
    parts: [
      part('parameters', 'Afgrænsede parametre', 'To navngivne skalaer har præcise endepunkter og selvstændige greb.',
        L(100, 111, 224, 111, 'ink', 2), L(100, 155, 250, 155, 'edge'), L(100, 155, 190, 155, 'subject', 3),
        O(190, 155, 12, 'plane'), O(190, 155, 4, 'subject', 'none'),
        L(100, 225, 199, 225, 'ink', 2), L(100, 269, 250, 269, 'edge'), L(100, 269, 150, 269, 'subject', 3),
        O(150, 269, 12, 'plane'), O(150, 269, 4, 'subject', 'none')),
      part('readouts', 'Præcise værdier', 'Talfelter supplerer de samme skalaer uden at blive brede tekstblokke.',
        R(270, 136, 42, 38, 'plane'), T(282, 162, '8'), R(270, 250, 42, 38, 'plane'), T(282, 276, '3')),
      part('live-result', 'Aktuel prøve', 'Et målt felt indeholder en konstrueret form fra de viste parametre.',
        R(355, 111, 155, 208, 'plane'), O(432.5, 208, 48, 'plane'), O(432.5, 208, 22, 'context'),
        P('M432.5 141V160M432.5 256V275M365 208H384.5M480.5 208H500', 'none', 'edge', 1),
        L(312, 155, 355, 155, 'edge'), P('M350 150L355 155L350 160', 'none', 'subject', 1.5)),
      part('result-extent', 'Prøvens udstrækning', 'Et enkelt mål fastholder det fælles resultatfelt.', dim(355, 350, 155)),
    ],
  }),
  'recipe-editor': () => ({
    label: 'Tre lag ses i et tværsnit; det aktive lag forbindes til den samme post i laglisten.',
    parts: [
      part('section', 'Lag i tværsnit', 'Tre sammenhængende bånd udgør én sammensat detalje.',
        R(130, 100, 210, 220, 'plane'), L(130, 160, 340, 160), L(130, 230, 340, 230),
        L(156, 128, 285, 128, 'edge'), rows(156, 263, [151, 109], 28, 'edge')),
      part('active-layer', 'Aktivt lag', 'En afgrænset indre flade udpeger netop det midterste lag.',
        R(131, 161, 208, 68, 'context', 'none'), L(130, 160, 130, 230, 'subject', 3), dot(151, 195)),
      part('layer-list', 'Samme lag i listen', 'Tre navngivne poster svarer til tværsnittets tre niveauer.',
        L(401, 130, 489, 130, 'ink', 2), L(401, 151, 474, 151, 'edge'),
        L(401, 202, 496, 202, 'subject', 3), L(401, 225, 468, 225, 'edge'),
        L(401, 279, 483, 279, 'ink', 2), L(401, 302, 463, 302, 'edge')),
      part('coordinated-selection', 'Koordineret valg', 'En leder binder tværsnittets aktive lag til listens aktive række.',
        P('M340 195H371V202H389', 'none', 'subject', 1.5), dot(389, 202), dim(130, 350, 210)),
    ],
  }),
  form: () => ({
    label: 'To navngivne felter har tilknyttet validering og en samlet gemmehandling.',
    parts: [
      part('labels', 'Feltets navne', 'Begge labels følger deres egen kontrols venstre akse.',
        L(155, 92, 280, 92, 'ink', 2), L(155, 208, 267, 208, 'ink', 2),
        P('M134 92H122V300H134', 'none', 'edge', 1)),
      part('fields', 'Redigerbare oplysninger', 'To fine feltkonturer og en indsætningsmarkør viser indtastning.',
        R(155, 120, 265, 65, 'plane'), L(178, 153, 330, 153), L(346, 135, 346, 173, 'subject', 3),
        R(155, 235, 265, 65, 'plane'), L(178, 267, 317, 267)),
      part('validation', 'Tilknyttet validering', 'Et lille kontroltegn hører til feltet; hjælp står på samme navneakse.',
        L(420, 267, 439, 267, 'edge'), O(451, 267, 12, 'context'),
        P('M445 267L449 271L457 262', 'none', 'ink', 1.5), rows(155, 325, [130, 96], 20, 'edge')),
      part('commit', 'Samlet gemmehandling', 'En lille afgrænset handling står efter oplysninger og hjælp.',
        R(310, 337, 110, 35, 'plane'), L(334, 354.5, 396, 354.5, 'subject', 2)),
    ],
  }),
  'list-detail': () => ({
    label: 'En valgt post bevarer sin plads i listen og knyttes til et selvstændigt detaljefelt.',
    parts: [
      part('collection', 'Samlingens poster', 'Tre titler og korte beskrivelser følger en fælles venstre akse.',
        L(111, 157, 273, 157, 'edge'), L(111, 250, 273, 250, 'edge'),
        L(129, 113, 242, 113, 'ink', 2), L(129, 136, 230, 136, 'edge'),
        L(129, 285, 237, 285, 'ink', 2), L(129, 308, 216, 308, 'edge')),
      part('current-item', 'Aktuel post', 'En begrænset flade fremhæver én post uden at omordne listen.',
        R(111, 171, 162, 62, 'context', 'edge'), L(111, 171, 111, 233, 'subject', 3),
        L(129, 193, 242, 193, 'ink', 2), L(129, 216, 218, 216)),
      part('detail', 'Detaljeindhold', 'En titel, et lille indholdsfelt og tekststreger har plads i egen ramme.',
        R(345, 85, 160, 250, 'plane'), L(365, 113, 476, 113, 'ink', 2),
        R(365, 143, 50, 50, 'context'), rows(365, 229, [117, 96, 105], 23)),
      part('selection-link', 'Post og detalje', 'En knækleder forbinder den aktuelle post med detaljens ramme.',
        P('M273 202H302V125H345', 'none', 'subject', 1.5), dot(273, 202)),
    ],
  }),
  'resource-library': () => ({
    label: 'Søgning og typefilter afgrænser tre forskellige ressourcer; en favorit bevarer sin egen markering.',
    parts: [
      part('discovery', 'Søgning og filter', 'Et søgefelt og en selvstændig valgliste står over samlingen.',
        R(125, 80, 250, 60, 'plane'), L(146, 110, 282, 110), O(338, 106, 10), P('M345 113L357 125', 'none', 'ink', 1),
        R(395, 80, 80, 60, 'plane'), L(408, 109, 438, 109), P('M451 104L458 111L465 104', 'none', 'edge', 1)),
      part('resources', 'Ligeværdige ressourcer', 'Tre selvstændige kort har samme ydre størrelse og fælles grundlinje.',
        [125, 245, 365].map(x => R(x, 180, 110, 160, 'plane')), dim(125, 368, 350)),
      part('content-types', 'Forskelligt indhold', 'Billede, dokument og en enkel sammensætning skelnes med forskellige indre tegn.',
        R(138, 198, 84, 65, 'plane'), P('M138 247L164 224L186 239L204 216L222 231V263H138Z', 'context', 'none'),
        P('M138 247L164 224L186 239L204 216L222 231', 'none', 'ink', 1), O(160, 214, 6, 'subject', 'none'),
        L(139, 293, 211, 293, 'ink', 2), L(139, 316, 196, 316, 'edge'),
        rows(259, 212, [82, 69, 76, 52], 22), L(259, 316, 322, 316, 'edge'),
        R(381, 222, 28, 32, 'context'), R(420, 222, 38, 32, 'plane'), L(381, 278, 458, 278), L(381, 301, 438, 301, 'edge')),
      part('favorite', 'Favorit', 'Et lille stjernetegn udpeger en favorit uden at overtage ressourcevalget.',
        P('M455 187L458 194L466 195L460 200L462 208L455 204L448 208L450 200L444 195L452 194Z', 'none', 'subject', 1.5)),
    ],
  }),
  history: () => ({
    label: 'Et dokument hører til et aktuelt historiktrin; fortryd, gentag og et gemmepunkt har forskellige tegn.',
    parts: [
      part('document', 'Aktuelt dokument', 'En lille dokumentflade indeholder titel og sammenhængende tekst.',
        R(220, 95, 160, 185, 'plane'), L(242, 129, 349, 129, 'ink', 2), rows(242, 173, [110, 87, 102], 26)),
      part('traversal', 'Fortryd og gentag', 'To fine retningspile vender mod tidligere og senere tilstand.',
        P('M185 158C147 127 120 165 146 193M146 193L141 178M146 193L131 188'),
        P('M415 158C453 127 480 165 454 193M454 193L459 178M454 193L469 188')),
      part('changes', 'Historiktrin', 'En rute forbinder tidligere, aktuelt og kommende trin med dokumentets position.',
        L(125, 325, 475, 325, 'edge'), L(125, 325, 335, 325, 'subject', 2),
        O(125, 325, 4, 'plane'), O(335, 325, 6, 'subject', 'none'), O(445, 325, 4, 'ground', 'edge'),
        L(335, 280, 335, 319, 'edge')),
      part('savepoint', 'Gemmepunkt', 'Et separat lille kontroltegn fastholder det gemte trin frem for den aktuelle position.',
        O(225, 325, 10, 'plane'), P('M219 325L223 329L231 320', 'none', 'ink', 1.5),
        P('M225 335V358H261', 'none', 'edge', 1), L(261, 358, 308, 358)),
    ],
  }),
  'site-header': () => ({
    label: 'Afsender og links deler sidens øverste bjælke; en enkelt understregning viser den aktuelle destination.',
    parts: [
      part('page-context', 'Indhold under headeren', 'Et åbent sideudsnit viser navigationens placering over indholdet.',
        P('M115 175V320H485V175', 'none', 'edge', 1), rows(145, 231, [192, 250, 162], 28, 'edge')),
      part('navigation', 'Afsender og destinationer', 'En samlet header har plads til originalens mærke og tre ligeværdige links.',
        R(115, 100, 370, 75, 'plane'), R(135, 121, 34, 34, 'context'),
        L(188, 137, 251, 137), L(300, 137, 344, 137), L(365, 137, 409, 137), L(430, 137, 465, 137)),
      part('current-page', 'Aktuelt mål', 'En lokal accent er knyttet til ét link og ændrer ikke naboernes vægt.',
        L(365, 153, 409, 153, 'subject', 2), dot(387, 164)),
    ],
  }),
  hero: () => ({
    label: 'Et kort introducerende budskab med en handling står ved siden af et større, afgrænset billede.',
    parts: [
      part('message', 'Introduktion', 'To titelstreger og et kort afsnit giver budskabet et læsbart hierarki.',
        L(110, 134, 252, 134, 'ink', 2.5), L(110, 161, 218, 161, 'ink', 2.5), rows(110, 213, [133, 117], 23)),
      part('image', 'Introduktionens billede', 'En tynd billedkontur og præcist landskab giver motivet en selvstændig plads.',
        R(295, 90, 210, 195, 'plane'), P('M295 246L360 184L410 215L458 157L505 208V285H295Z', 'context', 'none'),
        P('M295 246L360 184L410 215L458 157L505 208', 'none', 'ink', 1), O(350, 140, 14, 'subject', 'none')),
      part('next-step', 'Første handling', 'En lille afgrænset handling følger teksten frem for at blive sidens ramme.',
        R(110, 282, 106, 36, 'plane'), L(131, 300, 195, 300, 'subject', 2)),
      part('registration', 'Billedets beskæring', 'To beskedne hjørnespor viser billedfeltets bestemte udstrækning.',
        P('M279 116V74H321M479 301H521V259', 'none', 'edge', 1)),
    ],
  }),
  'site-footer': () => ({
    label: 'Sidens indhold afsluttes af afsenderoplysninger og tre adskilte linkgrupper nederst.',
    parts: [
      part('content-ending', 'Sidens afslutning', 'Et kort indholdsudsnit ender ved én fælles skillelinje.',
        rows(130, 90, [255, 300, 180], 22, 'edge'), L(115, 185, 485, 185, 'edge')),
      part('identity', 'Afsender', 'Et neutralt originalfelt og fine navnelinjer står samlet i sidefoden.',
        R(130, 220, 48, 48, 'plane'), L(197, 233, 322, 233, 'ink', 2), L(197, 256, 289, 256, 'edge')),
      part('link-groups', 'Supplerende destinationer', 'Tre ligeværdige grupper holder deres links under egne navne.',
        [130, 265, 400].map(x => [L(x, 306, x + 74, 306, 'ink', 2), rows(x, 333, [68, 49], 22)]),
        P('M196 355H217M210 348L217 355L210 362', 'none', 'subject', 1.5)),
    ],
  }),
  'image-gallery': () => ({
    label: 'Tre forskellige billeder danner en afbalanceret samling, hvor hvert billede har tilknyttet tekst.',
    parts: [
      part('frames', 'Tre billedfelter', 'Forskellige formater deler præcise akser og bevarer hver sin kontur.',
        R(115, 95, 220, 240, 'plane'), R(365, 95, 120, 100, 'plane'), R(365, 235, 120, 100, 'plane')),
      part('landscapes', 'Selvstændige billedmotiver', 'Tre forskellige landskabskonturer forklarer billedindhold uden massiv fælles bagplade.',
        P('M115 260L185 190L240 230L286 175L335 230V335H115Z', 'context', 'none'),
        P('M115 260L185 190L240 230L286 175L335 230', 'none', 'ink', 1), O(174, 151, 16, 'subject', 'none'),
        P('M365 170L398 135L435 155L458 126L485 145V195H365Z', 'context', 'none'),
        P('M365 170L398 135L435 155L458 126L485 145', 'none', 'ink', 1), O(389, 119, 7, 'subject', 'none'),
        P('M365 315L410 280L445 309L485 270V335H365Z', 'context', 'none'),
        P('M365 315L410 280L445 309L485 270', 'none', 'ink', 1), O(459, 257, 7, 'subject', 'none')),
      part('attached-captions', 'Tilhørende tekster', 'Korte ledere møder deres egne tekststreger frem for et fælles løst navn.',
        P('M225 335V365H250', 'none', 'edge', 1), dot(225, 335), L(250, 365, 332, 365, 'ink', 2),
        P('M425 195V213H445', 'none', 'edge', 1), dot(425, 195), L(445, 213, 485, 213),
        P('M425 335V365H445', 'none', 'edge', 1), dot(425, 335), L(445, 365, 485, 365)),
    ],
  }),
};

export function draw(id, _options = {}) {
  if (!Object.hasOwn(scenes, id)) throw new RangeError('Unknown anatomy pattern: ' + id);
  return scenes[id]();
}
