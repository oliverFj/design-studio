import { node, paint, part } from './illustrations-primitives.mjs';

// Passage references: inspector, input, stack, image and data-grid in the shared
// family. Weight comes from cut material; text and construction stay fine.
const R = (x, y, width, height, role = 'plane') => node('rect', { x, y, width, height, fill: paint(role) });
const P = (d, role = 'subject', extra = {}) => node('path', { d, fill: paint(role), ...extra });
const L = (d, role = 'edge', width = 'var(--g-line-width)', extra = {}) => node('path', { d, fill: 'none', stroke: paint(role), 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
const C = (cx, cy, r, role = 'subject') => node('circle', { cx, cy, r, fill: paint(role) });
const T = (text, x, y, size = 20, role = 'ink') => node('text', { x, y, 'font-family': 'Arial,sans-serif', 'font-size': size, 'font-weight': 600, fill: paint(role) }, [], text);
const frame = (x, y, w, h, thickness = 15, role = 'subject') => P(`M${x} ${y}h${w}v${h}h-${w}Z M${x + thickness} ${y + thickness}h${w - thickness * 2}v${h - thickness * 2}h-${w - thickness * 2}Z`, role, { 'fill-rule': 'evenodd' });
const ring = (x, y, r, thickness = 14, role = 'subject') => P(`M${x + r} ${y}a${r} ${r} 0 1 1-${2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0Z M${x + r - thickness} ${y}a${r - thickness} ${r - thickness} 0 1 1-${2 * (r - thickness)} 0a${r - thickness} ${r - thickness} 0 1 1 ${2 * (r - thickness)} 0Z`, role, { 'fill-rule': 'evenodd' });
const writing = (x, y, widths, gap = 25, role = 'ink', weight = 2) => widths.map((w, i) => L(`M${x} ${y + i * gap}h${w}`, role, weight));
const measure = (x, y, w) => L(`M${x} ${y}h${w}M${x} ${y - 6}v12M${x + w} ${y - 6}v12`, 'edge', 1, { opacity: .6 });
const registration = (x, y) => L(`M${x - 7} ${y}h14M${x} ${y - 7}v14`, 'edge', 1, { opacity: .55 });
const scene = (label, ...parts) => ({ label, parts });

// Separate silhouette, background and opening: no ground-coloured fake hole.
function landscape(x, y, w, h, key, definitions) {
  definitions.push(node('clipPath', { id: key }, [R(x, y, w, h)]));
  return node('g', { 'clip-path': `url(#${key})` }, [
    R(x, y, w, h, 'ground'), C(x + w * .77, y + h * .28, h * .13, 'counter'),
    P(`M${x} ${y + h * .82}l${w * .31}-${h * .43} ${w * .29} ${h * .43} ${w * .23}-${h * .27} ${w * .23} ${h * .34}V${y + h}H${x}Z`, 'context'),
    P(`M${x + w * .42} ${y + h}l${w * .3}-${h * .43} ${w * .32} ${h * .43}Z`, 'ink'),
  ]);
}

const drawings = {
  editor: () => scene('Et udvalgt objekt ligger inde i en større komposition og er fæstnet til sit eget egenskabspanel.',
    part('rear-planes', 'Bagplaner', 'Forskudte materialeplaner giver scenen og panelet fysisk vægt.', R(101, 120, 201, 207, 'context'), R(346, 79, 176, 278, 'context')),
    part('composition', 'Objektets ejer', 'En større åben komposition omslutter det redigerbare objekt.', frame(84, 104, 201, 207, 13, 'edge'), frame(126, 161, 112, 105, 16), C(182, 213, 23, 'counter')),
    part('panel', 'Egenskabspanel', 'Et separat opretstående panel samler objektets titel og egenskaber.', frame(329, 63, 176, 278, 15, 'ink'), R(344, 78, 146, 44, 'subject'), writing(360, 101, [113], 25, 'ground', 3), writing(360, 158, [106, 78]), L('M350 206h134', 'edge', 1.2), writing(360, 243, [75, 109], 31)),
    part('selection-link', 'Valgets forbindelse', 'Et præcist anker forbinder objektet til netop dets egenskaber.', L('M238 213h47V165h44', 'ink', 1.8), C(238, 213, 5, 'counter')),
    part('guides', 'Konstruktionsmål', 'Diskrete fælles mål afstemmer de selvstændige flader.', measure(84, 365, 421), registration(73, 64))),

  'parameter-workbench': () => scene('Tre præcise parameterindlæg styrer en cirkulær prøve i et selvstændigt materialeplan.',
    part('rear-planes', 'Værkstedets bagplaner', 'Kontrolfladen og prøven har samme velordnede materialedybde.', R(106, 107, 163, 216, 'context'), R(331, 88, 192, 246, 'context')),
    part('parameters', 'Skyderparametre', 'Tre afgrænsede greb og tilhørende tal præciserer indstillingerne.', R(90, 91, 163, 216, 'plane'), [135, 204, 273].map((y, i) => [L(`M108 ${y}h111`, 'ink', 2), ring([142, 192, 166][i], y, 12, 5, 'counter'), T(['24', '60', '42'][i], 218, y + 5, 14)])),
    part('preview', 'Levende prøve', 'En udskåret ring er resultatet af parametrene, ikke et nyt ikon for en tredimensionel model.', frame(314, 72, 192, 246, 15), ring(410, 188, 61, 17), C(410, 188, 28, 'counter'), L('M349 188h122M410 127v122', 'edge', 1, { opacity: .55 })),
    part('apply', 'Bevidst anvendelse', 'En særskilt handling ligger efter prøven og dens indstillinger.', R(365, 273, 97, 29, 'ink'), L('M385 288h57', 'ground', 2), L('M253 204h26V188h35', 'ink', 1.8), C(253, 204, 4, 'counter')),
    part('guides', 'Prøvens udstrækning', 'En fin målestreg fastholder forskellen på materiale og registrering.', measure(314, 359, 192))),

  'recipe-editor': () => scene('Tre lag samles i en lodret opskrift. Det midterste indlæg er aktivt, mens de øvrige lag bevarer deres egen plads.',
    part('rear-planes', 'Lagenes bagplaner', 'Samme beskedne forskydning giver hvert lag en fysisk kant.', [87, 175, 263].map(y => R(161, y + 15, 296, 51, 'context'))),
    part('recipe-layers', 'Opskriftens lag', 'Ens formater og faste mellemrum gør lagene til én sammensætning.', R(144, 87, 296, 51, 'subject'), R(144, 185, 296, 51, 'ink'), R(144, 175, 296, 51, 'counter'), R(144, 263, 296, 51, 'subject'), R(144, 175, 8, 51, 'subject')),
    part('layer-content', 'Lagenes indhold', 'Fine indholdsspor tilhører hvert selvstændigt lag.', L('M170 112h196M170 288h218', 'ground', 2.5), L('M170 200h168', 'ink', 2.5), T('1', 112, 117, 15), T('2', 112, 205, 15), T('3', 112, 293, 15)),
    part('active-layer', 'Aktivt lag', 'Et fæstnet anker udpeger præcis det lag, der redigeres.', L('M440 200h42v-48h30', 'ink', 1.8), C(440, 200, 5, 'counter')),
    part('guides', 'Samlet lagafstand', 'En fin klamme viser opskriftens fælles udstrækning.', L('M90 87H77v227h13M77 138h13M77 175h13M77 226h13M77 263h13', 'edge', 1.3), measure(144, 354, 296))),

  form: () => scene('En samlet formular har to navngivne tekståbninger og en særskilt bekræftelse på de kontrollerede oplysninger.',
    part('rear-plane', 'Formularens bagplan', 'Et enkelt bagplan holder feltgrupperne sammen.', R(123, 94, 328, 247, 'context')),
    part('fields', 'Navngivne indtastninger', 'Hvert felt har sin egen label, værdi og indvendige åbning.', writing(106, 82, [112], 25, 'ink', 3), frame(106, 112, 328, 67, 13), L('M134 145h159M311 130v30', 'ink', 2.4), writing(106, 224, [142], 25, 'ink', 3), frame(106, 254, 328, 67, 13), L('M134 287h178', 'ink', 2.4)),
    part('validation', 'Samlet validering', 'En indlagt kontrol ved siden af felterne bekræfter formularens oplysninger.', R(461, 177, 56, 56, 'counter'), L('m474 203 10 12 20-27', 'ink', 3), L('M434 145h17v60h10', 'ink', 1.8), C(434, 145, 4, 'counter')),
    part('help', 'Supplerende hjælp', 'Et fint tekstspor følger formularen uden at forveksles med feltværdier.', writing(106, 354, [257, 184], 21, 'edge', 1.6)),
    part('guides', 'Feltgruppering', 'En fælles sideklamme beskriver de to selvstændige felter.', L('M82 79H70v242h12', 'edge', 1.1))),

  'list-detail': () => scene('Den midterste post i en samling er valgt og forbindes til en større, selvstændig detaljevisning.',
    part('rear-planes', 'Samling og detalje', 'To forskellige læseområder deler afstemt materialedybde.', R(97, 95, 185, 250, 'context'), R(347, 88, 174, 257, 'context')),
    part('list', 'Samlingens poster', 'Tre lige store poster bevarer overblikket omkring det aktuelle valg.', R(80, 79, 185, 65, 'plane'), R(80, 175, 185, 65, 'subject'), R(80, 271, 185, 65, 'plane'), R(80, 175, 8, 65, 'counter'), writing(102, 103, [123, 95], 21), writing(102, 199, [127, 83], 21, 'ground'), writing(102, 295, [104, 132], 21)),
    part('detail', 'Den valgte posts detaljer', 'En selvstændig ramme viser mere indhold om én bestemt post.', frame(330, 72, 174, 257, 14, 'ink'), R(344, 86, 146, 46, 'subject'), L('M363 109h107', 'ground', 3), writing(360, 170, [118, 91], 27), L('M350 220h134', 'edge', 1.2), writing(360, 254, [92, 113], 27)),
    part('selection', 'Sammenhæng mellem valg og indhold', 'En tynd forbindelse er fysisk fæstnet til den markerede række.', L('M265 207h32V170h33', 'ink', 1.8), C(265, 207, 5, 'counter')),
    part('guides', 'Fælles bund', 'Et fælles mål samler begge læseområder.', measure(80, 365, 424))),

  'resource-library': () => scene('En søgeåbning står over en samling af billed-, dokument- og skabelonressourcer. Ét indlæg er fremhævet som favorit.',
    part('search', 'Søgning i samlingen', 'En smal udskæring og en linse viser opdagelse frem for redigering.', frame(122, 61, 347, 48, 11, 'ink'), L('M171 85h204', 'ink', 2), ring(145, 83, 8, 2, 'ink'), L('m151 89 7 7', 'ink', 2)),
    part('rear-planes', 'Ressourcernes bagplaner', 'Ens bagforskydning gør de tre ressourcer til en familie.', [100, 253, 406].map(x => R(x + 14, 155, 108, 168, 'context'))),
    part('resources', 'Selvstændige ressourcer', 'Tre forskellige udskårne ressourcer har samme størrelse og egen betydning.', frame(100, 141, 108, 168, 12), frame(253, 141, 108, 168, 12, 'ink'), frame(406, 141, 108, 168, 12), C(177, 181, 12, 'counter'), P('M112 260l29-54 27 40 28-28v57h-84Z', 'context'), writing(273, 185, [68, 52, 63], 27), frame(430, 177, 60, 64, 7, 'counter'), L('M460 190v38M442 209h36', 'ink', 2)),
    part('favorite', 'Favoritindlæg', 'En beskeden stjerne sidder på dokumentets materialekant.', R(331, 126, 42, 44, 'counter'), P('M352 134l4 10 11 1-8 7 2 11-9-6-9 6 2-11-8-7 11-1Z', 'ink')),
    part('captions', 'Ressourcenavne', 'Korte fine navnespor giver hver ressource sin egen identitet.', [100, 253, 406].map(x => L(`M${x} 344h88`, 'ink', 2))),
    part('guides', 'Samlingens mål', 'Et fælles grundmål samler de tre selvstændige elementer.', measure(100, 369, 414))),

  history: () => scene('Et aktuelt dokument står mellem tidligere og kommende ændringer. To modrettede buer viser, at redigeringen kan fortrydes og gentages.',
    part('rear-plane', 'Dokumentets bagplan', 'Et forskudt plan understøtter det aktuelle dokuments vægt.', P('M207 78h150l31 31v218H207Z', 'context')),
    part('document', 'Aktuelt dokument', 'En samlet papirform bærer det indhold, der redigeres.', P('M190 62h150l31 31v218H190Z'), L('M340 62v31h31', 'ground', 2), writing(220, 125, [105, 122, 83], 29, 'ground', 2.2), R(220, 242, 120, 37, 'ink'), L('M241 261h78', 'ground', 2)),
    part('undo-redo', 'Tilbage og frem', 'Fine modrettede buer peger på adskilte historiske trin uden massive pilflader.', L('M151 227c-67-12-72-100-4-121m-18-5 18 5-7 18', 'ink', 3), L('M411 106c68 21 63 109-4 121m7-18-7 18 18 5', 'ink', 3)),
    part('history-states', 'Tidligere, aktuelt og kommende', 'Et fyldt gemmeanker og to åbne nabotrin skelner positionerne geometrisk.', L('M107 358H489', 'ink', 1.8), ring(142, 358, 9, 2, 'edge'), C(281, 358, 10, 'counter'), ring(426, 358, 9, 2, 'edge'), L('M281 311v37', 'ink', 1.8)),
    part('guides', 'Registrering', 'Et lille registreringsmærke afslutter konstruktionen.', registration(478, 80))),

  'site-header': () => scene('En samlet websiteflade har afsender og navigation i den øverste materialebjælke. Ét link er markeret som aktuelt.',
    part('rear-plane', 'Sidens bagplan', 'En velordnet forskydning giver topbjælken fysisk nærvær.', R(103, 106, 420, 234, 'context')),
    part('page', 'Side med topnavigation', 'En skarp udskåret ramme samler header og indhold uden ekstra kortrunding.', frame(86, 90, 420, 234, 12, 'ink'), R(98, 102, 396, 57, 'subject')),
    part('identity-navigation', 'Afsender og destinationer', 'Et neutralt originalfelt står ved siden af tre navngivne destinationer.', frame(113, 114, 33, 33, 6, 'ground'), L('M166 130h82M295 130h43M362 130h43M429 130h43', 'ground', 2.5), R(360, 146, 47, 4, 'counter')),
    part('body', 'Indhold under navigationen', 'Et lille indholdshierarki viser topbjælkens placering på siden.', L('M123 205h210', 'ink', 3), writing(123, 243, [321, 257], 29, 'edge', 1.8)),
    part('guides', 'Sidens bredde', 'En fælles målestreg beskriver hele konstruktionen.', measure(86, 362, 420))),

  hero: ({ prefix }) => {
    const definitions = [];
    const result = scene('Et kort budskab og en tydelig introduktionshandling står ved siden af et stort landskab i en udskåret billedramme.',
      part('rear-plane', 'Billedets bagplan', 'Et forskudt plan adskiller billedets materiale fra tekstens åbne felt.', R(345, 87, 181, 261, 'context')),
      part('message', 'Introduktionens budskab', 'En stærkere titellinje, fine tekstspor og én handling danner et læsbart hierarki.', L('M91 125h188M91 158h145', 'ink', 4), writing(91, 213, [184, 151, 174], 25, 'edge', 1.8), R(91, 310, 115, 32, 'subject'), L('M112 326h73', 'ground', 2.5)),
      part('landscape', 'Introduktionens billede', 'Et landskab ses gennem en reel materialevinduesåbning.', landscape(343, 86, 151, 231, prefix + '-hero-landscape', definitions)),
      part('frame', 'Udskåret billedramme', 'En massiv kant afgrænser billedindholdet.', frame(328, 71, 181, 261, 15), L('M328 332h181', 'ink', 1.8)),
      part('guides', 'Billedets udstrækning', 'Et enkelt finere mål giver den store billedflade ro.', measure(328, 368, 181)));
    return { ...result, definitions };
  },

  'site-footer': () => scene('Sidens indhold afsluttes af en fælles materialebund med afsender og tre grupper af supplerende links.',
    part('page-content', 'Indhold før afslutningen', 'Et roligt tekstfelt leder ned til sidens afsluttende område.', writing(115, 83, [282, 354, 241], 30, 'edge', 1.8), L('M87 203H507', 'edge', 1)),
    part('rear-plane', 'Footerens bagplan', 'En enkel forskydning gør afslutningen til en fælles bund.', R(104, 246, 420, 106, 'context')),
    part('footer-base', 'Fælles afslutningsplan', 'En solid bund samler afsender og links uden en ekstra ramme om hver gruppe.', R(87, 230, 420, 106, 'subject'), frame(107, 251, 43, 43, 8, 'ground'), L('M107 316h70', 'ground', 2)),
    part('link-groups', 'Supplerende destinationer', 'Tre fine linkgrupper bevarer deres indbyrdes rytme.', [221, 317, 413].map(x => [L(`M${x} 258h64`, 'ground', 3), writing(x, 285, [65, 47], 23, 'ground', 1.8)])),
    part('guides', 'Fælles bundmål', 'Et fint breddeled forankrer den afsluttende flade.', measure(87, 370, 420))),

  'image-gallery': ({ prefix }) => {
    const definitions = [];
    const images = [[86, 116, 122, 158], [228, 72, 172, 246], [420, 144, 100, 161]];
    const result = scene('Tre forskellige landskabsudsnit står i selvstændige udskårne rammer og samles af afstemte materialelag og billedtekster.',
      part('rear-planes', 'Billedernes bagplaner', 'Samme forskydning giver de forskellige formater én materialefamilie.', images.map(([x, y, w, h]) => R(x + 14, y + 14, w, h, 'context'))),
      part('landscapes', 'Forskellige billedudsnit', 'Hver ramme viser et eget udsnit af familiens landskab.', images.map(([x, y, w, h], i) => landscape(x + 12, y + 12, w - 24, h - 24, prefix + '-gallery-landscape-' + i, definitions))),
      part('frames', 'Selvstændige billedrammer', 'Forskellige størrelser bevarer samme præcise materialekant.', images.map(([x, y, w, h], i) => frame(x, y, w, h, 12, i === 1 ? 'subject' : 'ink'))),
      part('captions', 'Tilhørende billedtekster', 'Fine tekstspor står tæt på netop deres billedudsnit.', L('M86 302h104M228 347h143M420 333h86', 'edge', 2)),
      part('guides', 'Samlingens grundmål', 'Et fælles mål samler formaterne uden en ydre galleriramme.', measure(86, 377, 434)));
    return { ...result, definitions };
  },
};

export function draw(id, { prefix = 'pattern-passage' } = {}) {
  if (!Object.hasOwn(drawings, id)) throw new RangeError('Ukendt Passage-mønster: ' + id);
  return drawings[id]({ prefix });
}
