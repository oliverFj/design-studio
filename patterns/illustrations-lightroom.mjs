import { node, paint, part } from './illustrations-primitives.mjs';

// Lysrum references: lightroom-catalog.mjs ledge/well, input/card/inspector;
// lightroom.mjs imageGeometry supplies the clipped sky and curved terrain.
const R = (x, y, width, height, role = 'plane', rx = 5, extra = {}) => node('rect', { x, y, width, height, rx, fill: paint(role), ...extra });
const C = (cx, cy, r, role = 'subject', extra = {}) => node('circle', { cx, cy, r, fill: paint(role), ...extra });
const P = (d, role = 'subject', extra = {}) => node('path', { d, fill: paint(role), ...extra });
const L = (d, role = 'edge', width = 'var(--g-line-width)', extra = {}) => node('path', { d, fill: 'none', stroke: paint(role), 'stroke-width': width, ...extra });
const outline = (x, y, width, height, rx = 5, role = 'edge', extra = {}) => R(x, y, width, height, role, rx, { fill: 'none', stroke: paint(role), 'stroke-width': 'var(--g-line-width)', ...extra });
const ring = (cx, cy, r, role = 'edge', width = 'var(--g-line-width)') => C(cx, cy, r, role, { fill: 'none', stroke: paint(role), 'stroke-width': width });
const shade = (...children) => node('g', { fill: paint('depth'), opacity: 'var(--g-depth-opacity)' }, children);
const lines = (x, y, widths, gap = 22, role = 'edge', weight = 2) => widths.map((w, i) => L(`M${x} ${y + i * gap}h${w}`, role, weight));
const check = (x, y, role = 'light', scale = 1) => L(`M${x} ${y}l${7 * scale} ${8 * scale} ${16 * scale}-${19 * scale}`, role, 3 * scale);
const glyph = (x, y, text, size = 22, role = 'ink', extra = {}) => node('text', { x, y, fill: paint(role), 'font-family': 'Arial,sans-serif', 'font-size': size, ...extra }, [], text);

const materials = prefix => [
  node('linearGradient', { id: prefix + '-wall', x1: 0, y1: 0, x2: 1, y2: 1 }, [node('stop', { 'stop-color': paint('light') }), node('stop', { offset: 1, 'stop-color': paint('context') })]),
  node('radialGradient', { id: prefix + '-glow', cx: .45, cy: .38, r: .7 }, [node('stop', { 'stop-color': paint('light') }), node('stop', { offset: .68, 'stop-color': paint('subject') }), node('stop', { offset: 1, 'stop-color': paint('counter') })]),
  node('linearGradient', { id: prefix + '-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, [node('stop', { 'stop-color': paint('counter') }), node('stop', { offset: 1, 'stop-color': paint('context') })]),
];

// Keep the original inset, contour and translucent depth recipes; scale the scene.
const ledge = (p, x, y, w, h, r = 7) => [
  shade(node('rect', { x: x + 4, y: y + 7, width: w, height: h, rx: r })),
  R(x, y, w, h, 'plane', r, { fill: `url(#${p}-wall)` }),
  R(x + 10, y + 10, w - 20, h - 20, 'plane', Math.max(2, r - 4)),
  outline(x, y, w, h, r), L(`M${x + 10} ${y + 10}H${x + w - 10}`, 'light', 1.8),
];
const well = (x, y, w, h, r = 5) => [
  R(x, y, w, h, 'context', r), R(x + 7, y + 7, w - 14, h - 14, 'ground', Math.max(1, r - 3)),
  outline(x, y, w, h, r),
  shade(node('path', { d: `M${x + 7} ${y + 7}H${x + w - 7}V${y + h - 7}h-5V${y + 12}H${x + 7}Z` })),
];
const thumb = (p, x, y, r = 14) => [
  shade(node('circle', { cx: x + 3, cy: y + 5, r })),
  C(x, y, r, 'plane', { fill: `url(#${p}-wall)` }), ring(x, y, r),
  L(`M${x - 3} ${y - 5}v10M${x + 3} ${y - 5}v10`, 'edge', 1.2),
];

function image(p, key, x, y, w, h, definitions) {
  const inset = 14, left = x + inset, right = x + w - inset, top = y + inset, bottom = y + h - inset;
  const clip = p + '-' + key + '-clip';
  definitions.push(node('clipPath', { id: clip }, [R(left, top, w - inset * 2, h - inset * 2, 'plane', 1)]));
  return [
    shade(node('rect', { x: x + 6, y: y + 9, width: w, height: h, rx: 3 })),
    R(x, y, w, h, 'plane', 3, { fill: `url(#${p}-wall)` }), outline(x, y, w, h, 3),
    node('g', { 'clip-path': `url(#${clip})` }, [
      R(left, top, w - inset * 2, h - inset * 2, 'context', 1, { fill: `url(#${p}-sky)` }),
      C(x + w * .73, y + h * .28, Math.min(w, h) * .095, 'light'),
      P(`M${left} ${bottom - h * .15}Q${x + w * .29} ${y + h * .36} ${x + w * .56} ${bottom - h * .29}T${right} ${bottom - h * .23}V${bottom + 10}H${left}Z`, 'plane'),
      P(`M${x + w * .36} ${bottom + 10}Q${x + w * .67} ${y + h * .5} ${right} ${bottom - h * .14}V${bottom + 10}Z`, 'subject'),
    ]),
    L(`M${left} ${top}H${right}`, 'light', 2),
  ];
}

const recipes = {
  // inspector + tree + input: nested ownership is separate from the property dock.
  editor: p => ({
    label: 'Et valgt objekt ligger inde i en større komposition og forbindes til sit egenskabspanel.',
    parts: [
      part('workspace', 'Arbejdsflade', 'Et åbent indre rum indeholder flere fysiske objekter.', well(79, 104, 236, 220, 7), R(102, 125, 81, 42, 'context', 4), lines(116, 146, [53], 20)),
      part('selected-object', 'Valgt objekt', 'En markeret ejer rummer et mindre indlejret objekt.', R(119, 182, 160, 117, 'plane', 5), outline(115, 178, 168, 125, 6, 'subject'), R(142, 209, 91, 64, 'subject', 4), L('M144 270h87', 'light', 1.8), L('M132 195h104', 'ink', 3)),
      part('context-link', 'Kontekstforbindelse', 'Den valgte ejers synlige kant er panelets udgangspunkt.', L('M283 240h62', 'edge', 1.7), C(345, 240, 3.5)),
      part('properties', 'Egenskabspanel', 'Navn og beslægtede felter tilhører det udpegede objekt.', ledge(p, 349, 64, 174, 296, 8), L('M369 96h107', 'ink', 4), lines(369, 122, [129, 101], 19), L('M369 171h76M369 260h93', 'edge', 2), well(368, 184, 135, 45, 4), well(368, 273, 135, 45, 4), L('M384 207h72M384 296h58', 'ink', 2.5)),
    ],
  }),
  // range-field + card + focus: parameters and preview share state, not a cube icon.
  'parameter-workbench': p => ({
    label: 'Tre præcise parametre styrer et roligt, belyst formresultat ved siden af indstillingerne.',
    parts: [
      part('parameter-panel', 'Parametre', 'Et selvstændigt værktøj holder navne, skydere og talværdier samlet.', ledge(p, 87, 76, 199, 278, 8), L('M108 107h128', 'ink', 4), [146, 216, 286].map((y, i) => [L(`M108 ${y - 18}h${[66, 83, 58][i]}`, 'edge', 2), well(109, y, 121, 21, 10), L(`M118 ${y + 10}h${[39, 72, 55][i]}`, 'subject', 4), thumb(p, [157, 190, 173][i], y + 10, 13), outline(241, y - 2, 25, 25, 3), glyph(253.5, y + 16, ['4', '8', '6'][i], 14, 'ink', { 'text-anchor': 'middle' })])),
      part('live-relation', 'Levende prøve', 'En kort pil forbinder indstillingerne med resultatet.', L('M292 216h34m-8-8 8 8-8 8', 'ink', 2)),
      part('result', 'Formresultat', 'En præcis åbning rummer en ændringsbar form og dens afgrænsede lys.', well(343, 105, 169, 198, 6), C(427.5, 204, 56, 'subject', { fill: `url(#${p}-glow)` }), L('M386 220Q407 160 443 183T475 213', 'edge', 1.4), L('M351 296h153', 'light', 2)),
      part('apply', 'Bevidst anvendelse', 'En særskilt lille handling står under prøven.', ledge(p, 384, 324, 127, 37, 7), R(394, 334, 107, 17, 'subject', 3), L('M414 343h65', 'light', 2)),
    ],
  }),
  // stack + list-item + range-field: cross-section and layer list show the same choice.
  'recipe-editor': p => ({
    label: 'Et tværsnit og en lagliste udpeger samme indre lag i en sammensat opskrift.',
    parts: [
      part('cross-section', 'Opskriftens tværsnit', 'Tre materialelag har egne indre flader og en fælles konstruktionsretning.', ledge(p, 100, 86, 193, 256, 8), R(123, 119, 147, 53, 'context', 4), R(123, 184, 147, 67, 'subject', 4), R(123, 263, 147, 53, 'context', 4), L('M124 120h145M124 250h145M124 264h145', 'light', 1.8), outline(119, 180, 155, 75, 5, 'subject'), lines(144, 143, [98], 20), lines(144, 216, [98], 20, 'light', 3), lines(144, 289, [83], 20)),
      part('shared-selection', 'Samme lag i to visninger', 'En kort forbindelse fortsætter fra det aktive lag til laglisten.', L('M274 217h54', 'edge', 1.5), C(328, 217, 3)),
      part('layers', 'Lagliste', 'Navngivne lag bevarer hver sin plads, mens det aktive har en lysende indlægning.', ledge(p, 332, 104, 173, 213, 8), L('M353 135h110', 'ink', 3.5), lines(354, 176, [110], 20), R(345, 196, 147, 42, 'subject', 4), L('M356 217h113', 'light', 2.5), L('M346 202v30', 'light', 2), lines(354, 272, [94], 20)),
      part('parameter', 'Lagets parameter', 'En lav skyder hører til det valgte lag.', well(351, 341, 137, 19, 9), L('M361 350h57', 'subject', 4), thumb(p, 419, 350, 12)),
    ],
  }),
  // field-group + field + checkbox: labels, controls and confirmation stay distinct.
  form: p => ({
    label: 'En navngivet formular samler to felter og en valideret afslutning i samme dokument.',
    parts: [
      part('form', 'Formularens dokument', 'Et samlet løftet objekt afgrænser oplysningerne.', ledge(p, 131, 56, 338, 308, 9), L('M156 90h185', 'ink', 4), L('M156 112h244', 'edge', 2)),
      part('fields', 'Navngivne felter', 'Hvert indfældet felt har sin egen label og tekstmarkør.', L('M156 149h103M156 237h126', 'edge', 2.4), well(153, 163, 291, 49, 5), well(153, 251, 291, 49, 5), L('M171 189h154M337 178v23', 'ink', 2.5), L('M171 277h128M311 266v23', 'ink', 2.5)),
      part('validation', 'Kontrol og bekræftelse', 'Et lille flueben og en afsluttende handling viser et accepteret sæt oplysninger.', R(156, 325, 18, 18, 'subject', 3), check(159, 333, 'light', .5), L('M187 335h101', 'edge', 2), R(342, 322, 101, 25, 'subject', 5), L('M361 335h61', 'light', 2)),
    ],
  }),
  // list-item + inspector + card: the selected row, not a nested object, is the cause.
  'list-detail': p => ({
    label: 'En udpeget række i en søgbar samling forbindes til et selvstændigt detaljekort.',
    parts: [
      part('collection', 'Søgbar samling', 'Søgning og tre ligeværdige rækker bevarer samlingens overblik.', ledge(p, 83, 92, 214, 240, 8), well(98, 108, 184, 33, 4), ring(113, 123, 5, 'edge', 1.5), L('M117 127l5 5M133 124h112', 'edge', 1.8), lines(110, 171, [151, 117], 18), lines(110, 284, [143, 126], 18)),
      part('selected-row', 'Valgt række', 'En enkelt række udpeges uden at skjule naboerne.', R(97, 211, 186, 49, 'subject', 4), L('M99 217v37', 'light', 2.5), lines(110, 230, [144, 107], 17, 'light', 2.4)),
      part('relation', 'Udvalg til detalje', 'En præcis forbindelse går fra rækkens kant til kortets kant.', L('M283 235h44', 'edge', 1.6), C(327, 235, 3)),
      part('detail', 'Detaljekort', 'Et større enkeltobjekt har egen titel, indhold og afsluttende handling.', ledge(p, 331, 68, 186, 285, 8), C(359, 99, 9), L('M378 96h111M378 111h78', 'ink', 2.5), R(351, 139, 146, 91, 'context', 4), C(424, 184, 29, 'subject', { fill: `url(#${p}-glow)` }), lines(352, 253, [145, 127, 104], 20), R(409, 317, 87, 19, 'subject', 4), L('M426 327h53', 'light', 1.8)),
    ],
  }),
  // combobox + card + image: a search discovers different reusable resource objects.
  'resource-library': (p, defs) => ({
    label: 'Søgning afgrænser et bibliotek med billeder, dokumenter og gemte ressourcer.',
    parts: [
      part('search', 'Søgning', 'En skriveflade og en linse afgrænser den fælles samling.', ledge(p, 126, 58, 348, 53, 7), ring(149, 84, 7, 'ink', 1.8), L('M154 90l7 7M174 85h197', 'ink', 2.5), L('M394 75v19', 'subject', 2)),
      part('image-resource', 'Billedressource', 'Et indrammet billede og dets tekst er én selvstændig ressource.', image(p, 'resource-image', 83, 157, 133, 129, defs), lines(99, 311, [102, 76], 18)),
      part('document-resource', 'Dokumentressource', 'En lys papirflade med fold og afsnit viser en anden ressourceart.', shade(node('path', { d: 'M249 163h94l24 24v119H249Z' })), P('M245 156h94l24 24v119H245Z', 'plane'), L('M245 156h94l24 24v119H245Z'), P('M339 156v24h24Z', 'context'), lines(264, 200, [77, 67, 74, 48], 20), lines(252, 323, [103], 18)),
      part('favorite-resource', 'Gemte ressourcer', 'En navngiven skabelon har en separat favoritmarkør.', ledge(p, 392, 155, 126, 161, 8), R(408, 172, 94, 65, 'context', 4), L('M419 199h73M419 215h56', 'edge', 2), lines(410, 259, [88, 62], 18), P('M489 287l3.2 6.8 7.5.9-5.5 5.2 1.4 7.5-6.6-3.7-6.6 3.7 1.4-7.5-5.5-5.2 7.5-.9Z', 'counter')),
    ],
  }),
  // card + progress + iconography: a document changes while its history stays ordered.
  history: p => ({
    label: 'Et redigeret dokument står mellem tilbage- og fremretning og har et tydeligt gemmepunkt i sin historik.',
    parts: [
      part('earlier-document', 'Tidligere indhold', 'Et tilbagetrukket papirspor viser en forudgående udgave.', R(169, 91, 222, 208, 'context', 6), outline(169, 91, 222, 208, 6), L('M185 113h132', 'light', 1.5)),
      part('document', 'Aktuelt dokument', 'Det aktuelle indhold har et selvstændigt materiale og en lokal ændring.', ledge(p, 191, 72, 222, 209, 7), L('M214 106h154', 'ink', 4), lines(214, 142, [171, 146], 23), R(210, 190, 183, 43, 'ground', 3), L('M222 212h142', 'subject', 3), L('M214 252h118', 'edge', 2)),
      part('undo-redo', 'Tilbage og frem', 'To små vendende buer ligger omkring dokumentet frem for at erstatte det.', L('M157 221C101 221 102 147 153 147M153 147l-13-12M153 147l-13 12', 'ink', 2.5), L('M447 147C503 147 502 221 451 221M451 221l13-12M451 221l13 12', 'ink', 2.5)),
      part('history', 'Historik og gemmepunkt', 'Ens trin deler en rute; en dobbelt markør udpeger den gemte position.', L('M124 336h352', 'context', 12), L('M124 336h352', 'edge', 1.3), [145, 250, 355, 460].map((x, i) => [C(x, 336, 12, i === 2 ? 'subject' : 'plane'), ring(x, 336, 12)]), ring(355, 336, 18, 'subject', 1.4), L('M355 355v13h34', 'edge', 1.4), L('M403 368h48', 'edge', 2)),
    ],
  }),
  // navigation + signature + divider: the header is a light upper strip, not a page frame.
  'site-header': p => ({
    label: 'Et navngivet afsendermærke og tre destinationer deler en lys header over sidens indhold.',
    parts: [
      part('header', 'Headerens grundflade', 'En lav, løftet flade samler afsender og navigation.', ledge(p, 83, 103, 434, 81, 7)),
      part('identity', 'Afsender', 'Et neutralt mærkefelt og et navn reserverer originalens plads.', outline(102, 121, 43, 43, 4), C(123.5, 142.5, 12, 'context'), ring(123.5, 142.5, 8, 'edge', 1.2), L('M159 137h92M159 154h65', 'ink', 2.5)),
      part('navigation', 'Destinationer', 'Tre tekstmål har én vedvarende udpeget destination.', L('M292 143h43M369 143h44M449 143h45', 'ink', 2.5), L('M291 160h45', 'subject', 3)),
      part('content-below', 'Sideindhold', 'En fin opdeling og begyndelsen på indholdet viser headerens placering.', L('M92 209h416', 'edge', 1.2), L('M112 253h241', 'ink', 3.5), lines(112, 286, [344, 302, 319], 25)),
    ],
  }),
  // heading + button + image: typography is open beside a real luminous image plane.
  hero: (p, defs) => ({
    label: 'Et introducerende budskab og en tydelig handling står ved siden af et indrammet landskab.',
    parts: [
      part('message', 'Introduktion', 'To tydelige overskriftsspor efterfølges af lettere forklarende tekst.', L('M94 124h173M94 150h141', 'ink', 4), lines(94, 200, [173, 157, 164], 23)),
      part('action', 'Første skridt', 'En særskilt løftet handlingsflade afslutter introduktionen.', ledge(p, 93, 294, 141, 47, 9), R(104, 305, 119, 25, 'subject', 4), L('M122 318h65m9 0h11m-5-5 5 5-5 5', 'light', 2)),
      part('image', 'Hovedbillede', 'Et billedrum rummer himmel, lys og bølgende forgrund i samme retning.', image(p, 'hero-image', 315, 73, 194, 274, defs)),
    ],
  }),
  // divider + signature + navigation: the grouping is a footer, not a set of controls.
  'site-footer': p => ({
    label: 'Sidens indhold afsluttes ved en fælles fod med afsender, grupperede links og en diskret afslutningslinje.',
    parts: [
      part('page-ending', 'Sidens sidste indhold', 'Kortere tekstgrupper efterlader luft før sidens afslutning.', L('M112 86h192', 'ink', 3.5), lines(112, 119, [313, 278, 247], 23), L('M92 212h416', 'edge', 1.5), L('M92 215h416', 'light', 1.5)),
      part('footer', 'Fælles sidefod', 'En lav materialeflade samler de supplerende destinationer.', ledge(p, 93, 244, 414, 111, 7)),
      part('identity', 'Afsender', 'Et mærke og et kort navn giver sidefoden sin egen identitet.', outline(111, 266, 42, 42, 4), C(132, 287, 12, 'context'), ring(132, 287, 8, 'edge', 1.2), L('M166 279h82M166 297h63', 'ink', 2.5)),
      part('links', 'Linkgrupper', 'To navngivne grupper bevarer tydelig afstand mellem deres links.', L('M285 274h74M397 274h76', 'ink', 3), lines(285, 298, [68, 51], 18), lines(397, 298, [71, 57], 18)),
      part('credit', 'Afslutning', 'En kort fin linje ligger samlet under de primære linkgrupper.', L('M112 376h149', 'edge', 1.8)),
    ],
  }),
  // image + caption + card: different crops share the original family material recipe.
  'image-gallery': (p, defs) => ({
    label: 'Et stort billede og to mindre udsnit danner en samlet, indrammet billedsamling.',
    parts: [
      part('main-image', 'Stort billede', 'Et større udsnit har selvstændig ramme og en kort billedtekst.', image(p, 'gallery-main', 91, 72, 238, 251, defs), lines(109, 350, [195, 143], 18)),
      part('first-image', 'Første mindre udsnit', 'Et andet billede har samme materiale med sin egen beskæring.', image(p, 'gallery-top', 356, 72, 152, 124, defs)),
      part('second-image', 'Andet mindre udsnit', 'En tredje billedflade afslutter rytmen med samme lysretning.', image(p, 'gallery-bottom', 356, 221, 152, 124, defs)),
      part('inspect', 'Undersøg billedet', 'En lille linse peger på mulighed for at undersøge et billede nærmere.', C(483, 320, 12, 'plane'), ring(483, 320, 7, 'ink', 1.5), L('M488 325l6 6', 'ink', 1.5)),
    ],
  }),
};

export function draw(id, { prefix = 'pattern-lightroom' } = {}) {
  if (!Object.hasOwn(recipes, id)) throw new Error('Unknown Lysrum pattern illustration: ' + id);
  const definitions = materials(prefix);
  return { ...recipes[id](prefix, definitions), definitions };
}
