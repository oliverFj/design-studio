import { node, paint, part } from './illustrations-primitives.mjs';

// Feltlinjer references: inspector, range-field, field-group, stack and image.
// The catalogue's three coincident route layers remain separate from fine data.
const L = (d, role = 'edge', width = 'var(--g-line-width)', extra = {}) => node('path', { d, fill: 'none', stroke: paint(role), 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
const flow = d => [L(d, 'ground', 17), L(d, 'subject', 10), L(d, 'ink', 1.1)];
const dot = (cx, cy, r = 8, role = 'counter') => node('circle', { cx, cy, r, fill: paint(role) });
const ring = (cx, cy, r = 18, role = 'ink') => node('circle', { cx, cy, r, fill: paint('ground'), stroke: paint(role), 'stroke-width': 'var(--g-line-width)' });
const plate = (x, y, width, height, role = 'plane', rx = 14) => node('rect', { x, y, width, height, rx, fill: paint(role), stroke: paint('edge'), 'stroke-width': 'var(--g-line-width)' });
const writing = (x, y, widths, gap = 24, role = 'ink', weight = 2) => widths.map((w, i) => L(`M${x} ${y + i * gap}h${w}`, role, weight));
const T = (text, x, y, size = 16, role = 'ink') => node('text', { x, y, 'font-family': 'ui-monospace,monospace', 'font-size': size, fill: paint(role) }, [], text);
const fan = (x1, y1, x2, y2) => [-2, -1, 0, 1, 2].map(i => L(`M${x1} ${y1 + i * 15}C${x1 + 90} ${y1 + i * 15} ${x2 - 90} ${y2 + i * 25} ${x2} ${y2 + i * 25}`, 'edge', 1, { opacity: .45 }));
const guides = () => part('guides', 'Registrering', 'Fine mærker afstemmer feltet.', L('M65 63h14M72 56v14M521 357h14M528 350v14', 'edge', 1, { opacity: .45 }));
const scene = (label, ...parts) => ({ label, parts: [...parts, guides()] });

function landscape(x, y, w, h, key, definitions) {
  definitions.push(node('clipPath', { id: key }, [node('rect', { x, y, width: w, height: h })]));
  const route = offset => `M${x} ${y + h * .66 + offset}C${x + w * .18} ${y + h * .66 + offset} ${x + w * .2} ${y + h * .34 + offset} ${x + w * .38} ${y + h * .34 + offset}S${x + w * .62} ${y + h * .88 + offset} ${x + w * .8} ${y + h * .88 + offset}S${x + w} ${y + h * .5 + offset} ${x + w * 1.08} ${y + h * .5 + offset}`;
  return node('g', { 'clip-path': `url(#${key})` }, [
    L(route(0), 'subject', 5), L(route(h * .11), 'edge', 1.4, { opacity: .65 }), L(route(h * .22), 'edge', 1.4, { opacity: .4 }),
    ring(x + w * .75, y + h * .24, h * .13, 'edge'), dot(x + w * .75, y + h * .24, h * .095, 'counter'),
  ]);
}

const drawings = {
  editor: () => scene('En udvalgt form ligger inde i sin ejer og forbindes med et separat panel, der beskriver netop denne form.',
    part('context', 'Ejer og panel', 'To lette flader viser objektets sammenhæng.', plate(84, 103, 252, 225), plate(386, 77, 137, 270, 'plane', 12)),
    part('selection-route', 'Objektets forbindelse', 'En ubrudt rute møder panelets synlige kant.', flow('M242 215C316 215 309 166 386 166')),
    part('objects', 'Indlejret objekt', 'Et valgt objekt forbliver inde i den større komposition.', plate(143, 153, 99, 124, 'context', 10), ring(143, 153, 4, 'edge'), ring(242, 277, 4, 'edge')),
    part('properties', 'Egenskaber', 'Fine tekstspor samler navn og egenskaber.', writing(407, 118, [88], 24), writing(407, 164, [75, 91, 62], 26), L('M403 253h104', 'edge', 1), writing(407, 285, [81, 54], 25)),
    part('anchors', 'Valgets ankre', 'Små punkter fastholder den præcise relation.', dot(242, 215, 7), dot(386, 166, 5, 'ink'))),

  'parameter-workbench': () => scene('Tre parametre har hver sin præcise position. Den aktuelle indstilling fører til en fælles formprøve.',
    part('context', 'Mulige indstillinger', 'Fine spor bevarer de mulige parameterruter.', [117, 210, 303].map(y => L(`M84 ${y}H236`, 'edge', 2)), L('M236 117C298 117 285 156 351 156M236 303C298 303 285 264 351 264', 'edge', 1, { opacity: .45 }), plate(351, 84, 175, 252, 'plane', 14)),
    part('result-route', 'Aktuel parameter', 'Ét prioriteret spor ankommer til prøvens kant.', flow('M183 210C270 210 270 210 351 210')),
    part('parameters', 'Præcise greb', 'Skydere og tal tilhører samme parameter.', [117, 210, 303].map((y, i) => [ring([133, 183, 158][i], y, 14, i === 1 ? 'ink' : 'edge'), dot([133, 183, 158][i], y, 5, i === 1 ? 'subject' : 'context'), T(['24', '60', '42'][i], 259, y - 15)])),
    part('preview', 'Formprøve', 'Koncentriske detaljer viser et selvstændigt resultat.', ring(438, 210, 54, 'subject'), ring(438, 210, 37, 'edge'), L('M438 143v13M438 264v13M371 210h13M492 210h13', 'edge', 1), dot(438, 210, 10, 'counter')),
    part('arrival', 'Forbindelsens ankomst', 'Resultatet er fæstnet til den valgte parameter.', dot(351, 210, 6, 'ink'))),

  'recipe-editor': () => scene('Tre lag deler en opskrift. En samlet gren og en fremhævet forbindelse udpeger det aktive lag.',
    part('context', 'Laglisten', 'Ens indholdsflader bevarer de enkelte lags identitet.', [114, 210, 306].map((y, i) => plate(211, y - 30, 270, 60, i === 1 ? 'context' : 'plane', 15)), L('M139 114V306M139 114H211M139 306H211', 'edge', 2)),
    part('active-route', 'Aktivt lag', 'Den valgte rute går fra den fælles stamme til ét lag.', flow('M139 114V178Q139 210 174 210H211')),
    part('layer-content', 'Lagenes indhold', 'Fine navne og parametre forbliver i deres eget lag.', [114, 210, 306].map((y, i) => [T(String(i + 1), 230, y + 5), writing(266, y, [178 - i * 17], 24), L(`M445 ${y - 8}v16`, 'edge', 1)])),
    part('layer-anchors', 'Lagankre', 'Fyldte og åbne ankre skelner aktuelt fra tilgængeligt.', ring(139, 114, 8, 'edge'), dot(211, 210, 7), ring(139, 306, 8, 'edge'))),

  form: () => scene('To navngivne indtastninger samles i en afsluttende kontrol. Værdier, tekstmarkør og validering har hver sin plads.',
    part('context', 'Formularfelter', 'Lette kontrolflader og labels samler oplysningerne.', plate(104, 113, 286, 72), plate(104, 253, 286, 72), writing(104, 86, [125], 24), writing(104, 226, [155], 24), L('M390 149C455 149 417 233 458 233', 'edge', 1.5)),
    part('validation-route', 'Samlet kontrol', 'Ét prioriteret forløb leder fra input til bekræftelsen.', flow('M390 289C456 289 417 233 458 233')),
    part('values', 'Værdier og hjælp', 'Fine tekstspor og en indsætningsmarkør beskriver reel indtastning.', writing(131, 149, [173], 24), L('M320 133v32', 'ink', 2), writing(131, 289, [194], 24), writing(104, 359, [249], 24, 'edge', 1.8)),
    part('confirmation', 'Validering', 'Et afgrænset kontroltegn afslutter forbindelsen.', dot(480, 233, 22, 'subject'), L('m468 232 9 10 17-23', 'ground', 3), dot(390, 289, 5, 'ink'))),

  'list-detail': () => scene('Én post er valgt i en samling. Dens rute fører til en selvstændig detaljevisning uden at fjerne de andre poster.',
    part('context', 'Samling og detaljer', 'Tre poster og et større indholdsfelt har hver sin lette afgrænsning.', [111, 207, 303].map((y, i) => plate(86, y - 33, 196, 66, i === 1 ? 'context' : 'plane', 12)), plate(377, 73, 146, 274, 'plane', 12)),
    part('selected-route', 'Valgt post', 'Den aktuelle række forbindes præcist til detaljefeltet.', flow('M282 207C332 207 325 157 377 157')),
    part('content', 'Navne og beskrivelser', 'Fine tekstniveauer giver både overblik og uddybning.', [111, 207, 303].map((y, i) => writing(108, y - 8, [142 - i * 13, 105 - i * 7], 23)), writing(399, 116, [99], 24, 'ink', 3), writing(399, 163, [87, 101, 68], 26), L('M392 250h116', 'edge', 1), writing(399, 280, [92, 74], 24)),
    part('markers', 'Aktuelle ankre', 'Ét anker hører til den valgte række og dens detalje.', dot(282, 207, 7), dot(377, 157, 5, 'ink'))),

  'resource-library': ({ prefix }) => {
    const definitions = [];
    const result = scene('En søgning fordeler sig over en samling af selvstændige ressourcer. Den aktuelle rute ender ved det valgte dokument.',
      part('context', 'Søgning og samling', 'Søgefelt og tre ressourcer har egne afgrænsninger.', plate(111, 65, 399, 61, 'plane', 14), plate(87, 189, 111, 140, 'plane', 12), plate(244, 189, 111, 140, 'context', 12), plate(401, 189, 111, 140, 'plane', 12), L('M160 126C160 165 142 157 142 189M160 126C250 126 455 151 455 189', 'edge', 1, { opacity: .45 })),
      part('discovery-route', 'Aktuel ressource', 'Ét spor samler søgningen og det udpegede resultat.', flow('M160 126C160 171 258 144 300 189')),
      part('resources', 'Forskellige ressourcetyper', 'Et billede, et dokument og en favoritskabelon er forskellige genbrugelige elementer.', ring(139, 95, 11, 'ink'), L('m147 103 7 7', 'ink', 2), writing(174, 96, [223], 24), landscape(99, 207, 87, 82, prefix + '-resource-image', definitions), writing(262, 232, [73, 51, 64], 24), node('path', { d: 'M456 217l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2Z', fill: paint('counter') }), writing(419, 287, [72], 24)),
      part('markers', 'Valg og navne', 'Et lille anker angiver den valgte ressource.', dot(300, 189, 7), L('M87 352h89M244 352h89M401 352h89', 'ink', 2)));
    return { ...result, definitions };
  },

  history: () => scene('Et aktuelt dokument står mellem tidligere og mulige ændringer. En tilbagegående rute og en fin gentagelsesgren gør historikken reversibel.',
    part('context', 'Dokumentets tilstande', 'Tre forskellige positioner bevarer fortid, nutid og mulighed.', plate(91, 134, 109, 151, 'context', 12), plate(245, 92, 109, 224, 'plane', 14), plate(399, 134, 109, 151, 'plane', 12), L('M327 316C327 371 453 371 453 303', 'edge', 2), L('m445 313 8-10 8 10', 'ink', 2)),
    part('undo-route', 'Tilbagevenden', 'En ubrudt rute fører fra den aktuelle version til et tidligere trin.', flow('M272 316C272 371 146 371 146 303')),
    part('content', 'Versionernes indhold', 'Fine spor viser beslægtede dokumenter med forskellige revisioner.', writing(109, 171, [73, 57, 66], 26, 'edge', 1.8), writing(263, 132, [73, 55, 70, 49], 27), writing(417, 171, [73, 49, 60], 26, 'edge', 1.8), L('M263 271h72', 'subject', 3)),
    part('markers', 'Historiske trin', 'Åbne fremtidspunkter adskilles fra det fyldte tidligere trin.', dot(146, 303, 8), ring(453, 303, 8, 'edge'), L('M146 285v10M453 285v10', 'ink', 1.8), L('m138 313 8-10 8 10', 'ink', 2), dot(272, 316, 5, 'ink'))),

  'site-header': () => scene('Navigationen står øverst i en websiteflade. En valgt destination føres ned til det relevante indhold.',
    part('context', 'Websiteflade', 'En samlet let ramme adskiller navigation fra indhold.', plate(80, 103, 442, 235, 'plane', 14), L('M80 177h442', 'edge', 1)),
    part('navigation-route', 'Aktuel destination', 'Et fremhævet link forbindes med sidens indhold.', flow('M346 152C346 211 278 205 278 257')),
    part('identity-links', 'Afsender og links', 'Et neutralt afsenderfelt og tre navnespor skelner afsender fra navigation.', ring(121, 140, 18, 'subject'), L('M154 140h68M272 140h43M336 140h43M400 140h43', 'ink', 2), L('M463 133h27M463 140h27M463 147h27', 'ink', 2)),
    part('body', 'Indhold', 'Fine læsespor ligger under navigationsområdet.', writing(112, 228, [125, 118, 173], 26, 'ink', 2), writing(336, 253, [149, 107], 26, 'edge', 1.8)),
    part('markers', 'Tilhørende indhold', 'Små ankre viser rutens begyndelse og ankomst.', dot(346, 152, 5, 'ink'), dot(278, 257, 7))),

  hero: ({ prefix }) => {
    const definitions = [];
    const result = scene('Et budskab og en introduktionshandling leder videre til et stort billede med et flydende landskabsforløb.',
      part('context', 'Introduktion og billede', 'Et stort billedfelt står frit ved tekstens side.', plate(327, 80, 190, 248, 'plane', 12), L('M91 117h186M91 150h140', 'ink', 3.5), writing(91, 205, [183, 147, 162], 24)),
      part('introduction-route', 'Vejen ind i billedet', 'En afgrænset handling fører til billedets synlige kant.', flow('M148 321C202 369 259 247 327 247')),
      part('landscape', 'Landskabsforløb', 'Et kurvet landskab følger Feltlinjers egen billedopskrift.', landscape(328, 81, 188, 246, prefix + '-hero-landscape', definitions)),
      part('action', 'Introduktionshandling', 'En særskilt let handling navngiver indgangen.', plate(91, 278, 114, 43, 'context', 21), L('M111 300h65', 'ink', 2)),
      part('markers', 'Ankomst til billedet', 'Forbindelsen møder præcist den store billedflade.', dot(327, 247, 6), dot(148, 321, 4, 'ink')));
    return { ...result, definitions };
  },

  'site-footer': () => scene('Sidens indhold samles ved en afsluttende linkregion. Et prioriteret forløb peger på én af de supplerende destinationer.',
    part('context', 'Indhold og afslutning', 'En afsluttende region ligger under sidens øvrige indhold.', writing(113, 86, [280, 348, 236], 27, 'edge', 1.8), plate(82, 230, 438, 119, 'plane', 12), L('M300 190v40C300 263 390 247 390 285', 'edge', 1.5)),
    part('footer-route', 'Supplerende destination', 'Et sammenhængende spor leder fra indhold til et link ved bunden.', flow('M300 190V230C300 263 204 247 204 285')),
    part('links', 'Afsender og linkgrupper', 'Tre fine grupper bevarer deres forskellige navne og destinationer.', ring(119, 263, 12, 'subject'), writing(108, 302, [65, 48], 22), writing(228, 285, [99, 72, 84], 22), writing(418, 285, [69, 51, 60], 22)),
    part('markers', 'Afsluttende ankre', 'Små markerede destinationer hører til footerens links.', dot(300, 190, 5, 'ink'), dot(204, 285, 7), ring(390, 285, 7, 'edge'))),

  'image-gallery': ({ prefix }) => {
    const definitions = [];
    const images = [[90, 104, 250, 208], [375, 73, 133, 126], [375, 229, 133, 114]];
    const result = scene('Tre forskellige billedudsnit forbindes som en læsbar samling. Ét forløb fører fra det store billede til det næste udsnit.',
      part('context', 'Billedsamlingen', 'Forskellige formater bevarer deres egne lette afgrænsninger.', images.map(([x, y, w, h]) => plate(x, y, w, h, 'plane', 10)), L('M340 207C365 207 354 136 375 136', 'edge', 1.4, { opacity: .55 })),
      part('viewing-route', 'Billedrækkefølge', 'En ubrudt rute møder billedernes faktiske kanter.', flow('M215 312C215 376 344 376 344 286Q344 286 375 286')),
      part('landscapes', 'Kurvede billedudsnit', 'Hvert billede bruger familiens flydende landskab og fine ekkoer.', images.map(([x, y, w, h], i) => landscape(x + 1, y + 1, w - 2, h - 2, prefix + '-gallery-landscape-' + i, definitions))),
      part('markers', 'Billedankre og navne', 'Små ankre binder den prioriterede rute til billedsamlingen.', dot(215, 312, 6, 'ink'), dot(375, 286, 6), L('M90 342h107M375 365h99', 'ink', 1.8)));
    return { ...result, definitions };
  },
};

export function draw(id, { prefix = 'pattern-fieldlines' } = {}) {
  if (!Object.hasOwn(drawings, id)) throw new RangeError('Ukendt Feltlinjer-mønster: ' + id);
  return drawings[id]({ prefix });
}
