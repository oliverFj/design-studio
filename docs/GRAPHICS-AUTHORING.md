# Lav grafik og animationer med Design Studio

Denne guide er indgangen til at tegne produktillustrationer, nye begreber og kunstneriske UI-studier med de fire godkendte illustrationsstilarter. Metoden kombinerer en agents fortolkning af et begreb med redigerbare SVG-opskrifter, temaets grafikmaterialer og én fælles animationsafspiller, når der leveres bevægelse.

## Stilkontrakt og referencehierarki

**Version 1 · 6. november 2026. Målet er at videreføre komponentkortenes faktiske illustrationsstil.** Samme farver, motividé og familienavn er ikke tilstrækkeligt. Stilen ligger også i forholdet mellem kontur og masse, tekstspor, tomrum, materialelag, kurver, lys og bevægelse.

Denne guide og familieguidernes **bindende tegneregler** er arbejdsstandarden for nye illustrationer. Den maskinlæsbare [stilkontrakt](graphics/style-contract.json) registrerer fælles regler, faktiske materiale-defaults, familieopskrifter, referencevalg og vurderingskriterier. Stade-MCP udleverer grundlaget med `get_graphic_profile`; stilgodkendelse kræver fortsat konkret visuel sammenligning.

Brug kilderne i denne rækkefølge:

1. **Opgavens betydning og den valgte families regler.** Bevar den efterspurgte funktion og vælg udtrykket bevidst. Et motiv skal ikke overtage navigation eller rigtige kontrollertilstande.
2. **Registrerede komponentmotiver.** [Kortets rendering](../studio/catalog-artwork.mjs) bruger `createGraphicRenderer`/`renderGraphic` og familiens faktiske `draw()` direkte. [Motivregistret](../core/graphics/catalog.mjs) følger komponentrollerne. Brug tegningerne i `core/graphics/families/*` og familieguidens referencepakke som æstetisk facit.
3. **Præsentationen omkring motivet.** [Komponentkortets CSS](../studio/component-catalog.css) ejer kort, billedvindue, kanter, hover og fokus. Kortets afrunding er ikke automatisk motivets hjørneradius. Familien ejer geometrien inde i SVG'en.
4. **Godkendt, afledt produktgrafik.** Designmønstrenes 11 motiver i hver af de fire familier er godkendte anvendelser af standarden. [Produktets wrapper](../patterns/illustrations.mjs) samler de særskilte familieopskrifter, som beskrives nedenfor. Motiverne kan vise, hvordan reglerne bruges på sammensatte produktbegreber; de ændrer ikke familiens normalværdier og erstatter ikke komponentmotiverne som primærreference.
5. **Studier og storyboards.** Hus/musik i `examples/graphics/concepts.mjs` og storyboards i guiderne er forslag, som skal sammenlignes og godkendes mod komponentmotiverne, før de kan bruges som afledte stilreferencer.

Familieguidernes tabeller mærker **observerede kodeværdier**, **nye forfatterkrav** og **motivbestemte undtagelser** særskilt. En helpers default er et startpunkt; en scenes koordinater er et eksempel; et observeret interval er ikke en automatisk tilladelse til alle værdier i intervallet. En historisk specialscene ophæver ikke normalopskriften. Udvidelser af stilen beskrives som udvidelser og må ikke indføres som stilbevarelse.

### Fælles regler for gentaget arbejde

| Regel | Krav til den, der tegner | Kontrol |
| --- | --- | --- |
| **G-01 · Reference før tegning** | Vælg mindst tre registrerede motiver fra samme familie: en enkel form, en sammensat relation og den nærmeste materiale-/indholdsreference. Brug kun en specialscene som hovedreference, når dens undtagelse er relevant for opgaven. | Angiv motiv-id og det konkrete træk, der videreføres, fx `inspector` → objekt–panel-forbindelse. |
| **G-02 · Fælles tegningsrum** | Tegn på `viewBox="0 0 600 420"`. Skaler hele scenen proportionalt. Bevar dens eget billedfelt i `ground`. | Ingen ændret viewBox, automatisk beskæring, strækning eller `non-scaling-stroke` som lokal kompensation. |
| **G-03 · Streg efter opgave** | Adskil grundkontur, tekstspor, guides, markører og egentligt materiale. Grundkonturen bruger familiens opskrift og materialets `lineWidth` uændret. | Ingen global stregmultiplikator. En bred bane, ring eller flade er en navngiven betydningsbærende form, ikke ny generel konturvægt. |
| **G-04 · Materialer efter familie** | Brug `GRAPHIC_TOKEN_BINDINGS`, men kun de roller, motivet har brug for. Følg familiens behandling af farve, lys og dybde. | Ingen faste brandfarver, tilfældige UI-statusfarver eller krav om at bruge alle ni farver. Lysrums skygger bruger `depthOpacity`; en opak `depth`-blok er ikke samme materiale. |
| **G-05 · Tekst har et hierarki** | Tegn almindeligt indhold som fine spor med varieret længde og bevidste afstande. Brug familiens glyph-skrift til nødvendige tal, bogstaver og genveje. | Ingen generel erstatning med 14 enheder høje, afrundede tekstblokke. Et stort typografisk motiv er en særskilt semantisk opgave. |
| **G-06 · Formen følger betydningen** | Vælg ramme, hjørner, åbning, landskab og perspektiv ud fra familie og relation. | Ingen universel kortplade, radius, sikkerhedsmargin, isometrisk terning eller landskabshjælper på tværs af alle familier. |
| **G-07 · Samlinger er eksakte** | Del koordinater mellem forbindelse, anker, hul og fælles kant. Vælg lagorden bevidst. | Ruten møder sin synlige destination; et hul har korrekt underlag eller reel udskæring; ingen løse knuder eller konturer skjult af tilfældig overmaling. |
| **G-08 · Stil bevares ved skalering** | Vis først den samme SVG i stor og faktisk produktstørrelse. Forenkling fjerner underordnet information før ændring af materialevægt. | En særskilt mikro-/ikonvariant navngives og vurderes særskilt. Den må ikke blive normalgeometri, når illustrationen senere vises stort. |
| **G-09 · Ét statisk facit** | Den færdige geometri skal forklare motivet uden afspilning. Parts navngives efter betydning. | Intet væsentligt indhold findes kun i animationen; 100 % og reduceret bevægelse svarer til det statiske motiv. |
| **G-10 · Bevægelse tilhører familien** | Følg familiens koreografi og genbrug den fælles player. Når kortgrafik animeres, bruges dekorativ afspilning med `interactive:false`; den omgivende knap ejer fokus og handling. | Ingen egen timer/RAF-motor, automatisk loop eller tilfældig parallax. Et fælles fade på alle lag er ikke en erstatning for familiens bevægelse. |
| **G-11 · Sammenlign under samme forhold** | Vis kandidat og de tre referencer ved samme billedmål, tema, farvetilstand og færdige pose; kontrollér derefter relevante bevægelsesposer. | Stilvurderingen må ikke baseres på forskellige paletter, forskellig zoom eller et isoleret flot billede. |
| **G-12 · Registrér afvigelser** | Angiv regel, valgt alternativ, grund og berørte referencer ved en bevidst afvigelse. | En uafklaret stilafvigelse leveres som kandidat. Gyldig SVG, tokens og tests er ikke stilgodkendelse. |

### Værdier fælles for renderer og præsentation

Tallene herunder er kildeaflæste. Tegneparametre angives i SVG-enheder; kortets ydre mål i CSS-pixel.

| Egenskab | Faktisk værdi / kilde | Anvendelse |
| --- | --- | --- |
| Tegnefelt | `600 × 420`, forhold `10:7`; [renderer](../core/graphics.mjs). | Samme koordinatsystem på tværs af motiver og størrelser. |
| Grundmaterialets kontur | Tokendefault `1.8`; de 15 medfølgende temaers 40 farvetilstande opløser aktuelt til `1.6–2.2`. [Grafiktokens](../core/graphic-tokens.mjs), `packages/*.json`. | Læs det valgte temas faktiske værdi. Intervallet er en observation, ikke en ny tokenbegrænsning. |
| Grundmaterialets dybdestyrke | Tokendefault `.12`; observeret `.10–.18` i samme samling. | Opacitet for illustrativ skygge, hvor familien bruger den. Ikke et krav om skygge i alle motiver. |
| Varighed | `duration.illustration`, default og alle aktuelt leverede tilstande `3200ms`. | Ét afgrænset illustrationsforløb. Bibliotekets almindelige UI-udfoldning på `240ms` er en anden rolle. |
| SVG-wrapper | `fill="none"`, runde caps/joins, `font-family="Arial,sans-serif"`; familieopskrifter kan angive egen skrift. | Runde stregender er ikke samme beslutning som afrundede rektangler. |
| Komponentkort | Minimumshøjde `232px`, padding `12px`, gap `12px`; billedvindue `154px` højt og fuld tilgængelig bredde. | Disse værdier tilhører kortet. SVG'en får ingen automatisk ikonforenkling eller fortykkelse. |
| Hvile og interaktion | Montering viser slutbilledet. Kortets hover/fokus starter én gennemgang; ingen ekstra interaktiv SVG. [Dekorationsbinding](../studio/graphic-decorations.mjs). | Bevar den omgivende knaps native betjening. Reduceret bevægelse viser slutbilledet. |

Ved et billedvindue `W × H` er skalafaktoren `s = min(W/600, H/420)` med den normale proportionale SVG-visning. En kontur på `1.8` bliver derfor cirka `.66` CSS-pixel ved `220 × 154`; `10.8` bliver `3.96`. At begge bruger samme tema ændrer ikke denne vægtforskel. Ved meget små billedmål vælges en enklere godkendt motivvariant eller et ikon efter opgavens behov; man må ikke stiltiende opfinde en tykkere illustrationsfamilie.

### Fire forskellige materialelogikker

Dette er en indgang til familieguidernes detaljer, ikke en geometrioversætter.

| Familie | Det, der skal genkendes på tværs af motiver | Konkrete startreferencer |
| --- | --- | --- |
| **Tegnets anatomi** | Kontur og aktivt tomrum bærer formen. Almindelige tekst-/målstreger er `1`; hovedkontur følger `lineWidth`; få lokale accenter er `2–4`. Kataloget bruger ikke gradienter, `counter` eller `depth`. | `button`, `field`, `inspector`, `caption`. `spinner` er vægtundtagelse. |
| **Lysrum** | Beskeden fysisk dybde, fine `edge`-kanter og lokalt lys. `ledge` har 10-enheders inset; `well` har 7. Ydre aftryk er ned/højre med `depthOpacity`; lys er øvre/venstre. Indfældninger har deres egen afgrænsede indre skygge. Gradienter bruges, hvor materialet kræver dem. | `input`, `card`, `inspector`, `image`. `spinner` er vægtundtagelse. |
| **Passage** | Tyngde fra pigmentflader, modformer og forskudte materialeplaner; præcision fra tynde konturer og tekstspor. `windowFrame` defaulttykkelse `15`, ring `14`, tekstspor normalt `2`. | `button`, `input`, `inspector`, `data-grid`. `spinner` er materialeundtagelse. |
| **Feltlinjer** | En prioriteret rute omgivet af finere baner og små præcise knuder. Katalogets `flow` er samme kurve i tre lag: `ground 17 → subject 10 → ink 1.1`; almindelig tekst er `2`, ledsagefelt typisk `1`. | `button`, `range-field`, `inspector`, `data-grid`, `image`. Originalmotiver har dokumenterede rutevarianter. |

Der findes ikke en generel »højst tre former«- eller »samme ramme om alt«-regel. Enkelhed betyder et tydeligt hierarki mellem relationer. Et sammensat panel kan kræve mere indhold end en afkrydsning. Antallet af former, procent farvet areal og præcise ydermargener er ikke fælles, kildeunderbyggede stilkonstanter.

### Hent de faktiske referencebilleder

Brug rendererens registrerede motiver frem for at gentegne eller beskrive referencerne på hukommelsen. Dette eksempel køres som Node ES-modulkode fra projektroden; det eksporterer tre selvstændige SVG'er med det valgte temas faktiske farver. Vælg andre id'er fra familieprofilen efter opgaven.

```js
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createGraphicRenderer} from './core/graphics.mjs';
import {resolveThemeMode} from './core/theme-modes.mjs';

const pack = JSON.parse(await readFile('packages/kyst.json', 'utf8'));
const active = resolveThemeMode(pack, 'light');
const renderer = createGraphicRenderer({...active, graphics: {family: 'lightroom'}});
const output = 'artifacts/style-references/lightroom-kyst-light';
await mkdir(output, {recursive: true});
for (const id of ['input', 'card', 'inspector']) {
  await writeFile(`${output}/${id}.svg`, renderer.render(id, {
    resolved: true, idPrefix: `reference-lightroom-${id}`
  }));
}
```

Denne eksport viser eksisterende referencer, ikke ny geometri. Præsenter SVG'erne og kandidaten i ens billedvinduer uden produktets valgte/hover-farver omkring kun ét af billederne. Hold alle stillestående på slutposen under den første sammenligning. Ved animeret arbejde vælges koreografi fra de samme referencers motion-modul; primitivehjælpernes standardeasing er ikke automatisk den rigtige for alle familier.

### Arbejdsbrief og stilkontrol

Udfyld dette i opgavebeskrivelsen, opskriftens metadata eller den konkrete aflevering. Det er ikke et krav om separate procesdokumenter ved hvert lille greb.

```text
Stilkontrakt: 1
Familie: [anatomy | lightroom | passage | fieldlines]
Betydning: [én konkret relation]
Brugssted og billedmål: [faktiske CSS-mål samt 600 × 420 til konstruktion]
Referencer: [mindst tre registrerede motiv-id'er og deres opgave i forlægget]
Tema/farvetilstand: [præcise valg til sammenligning]
Materialeplan: [kontur, tekstspor, guides, fyld, hjørner, lys/dybde eller rute]
Parts og ankre: [key, navn, formål; delte koordinater hvor relationer mødes]
Bevægelse: [statisk eller familiens afgrænsede årsagsforløb]
Afvigelser: [regel-id, ændring og begrundelse; ellers ingen]
Kontrol: [hvad der faktisk er set og målt; stilgodkendelse eller kandidat]
```

Bedøm kandidaten i denne rækkefølge:

1. **Betydning:** kan den rigtige relation aflæses i slutbilledet? En søgning, et valg og et gemt trin må ikke ende som samme generiske netværk.
2. **Familie:** sammenlign kontur/massetæthed, tekstniveauer, tomrum, hjørner, kurver og materialelag mod referencepakken. Ret en systematisk afvigelse i den fælles tegnehjælper frem for at lappe enkelte motiver.
3. **Produktstørrelse og tema:** sammenlign ved `600 × 420` og den faktiske kortstørrelse. Kontrollér de farvetilstande, der leveres. For grafik, der skal følge hele Studio-temavælgeren, gennemgå alle medfølgende temaer og deres tilstande samlet; afgrænsede studier kan bruge et udtrykkeligt valgt udsnit. Brug eksempelvis Studio Light lys/mørk og Kyst som første prøve, men rapportér ikke dette som kontrol af alle temaer.
4. **Bevægelse, når den leveres:** se `0`, `.25`, `.5`, `.75`, `1`, pause/genoptag, baglæns og reduceret bevægelse. Sammenlign slutpose og oprydning med den statiske komposition. Statisk produktgrafik kræver ikke en animationsplan.

De automatiske prøver i [graphics.test.mjs](../tests/graphics.test.mjs) kontrollerer blandt andet motiver, navngivne dele, SVG-referencer og afspilleradfærd. De bedømmer ikke stregens optiske vægt, familiens komposition eller kvaliteten af en metafor. Et stilafvigende motiv kan bestå samtlige tekniske prøver.

Brug `get_graphic_profile({})` til familieoversigten og de fælles regler. `get_graphic_profile({family:"anatomy"})` henter eksempelvis Tegnets anatomis kontraktprofil, referencevalg, kontrolkrav og guidehenvisninger med kildehash. De øvrige familie-id'er er `lightroom`, `passage` og `fieldlines`. Læs de relevante guideafsnit med `get_guide`, og gennemgå de faktiske motiver før tegning. Et kildehash viser en kildeversion, ikke en æstetisk godkendelse.

Nye godkendte stiludvidelser skal opdatere både den relevante familieguide og kontrakten; de aktuelle SVG-kilder og temaets tokens forbliver de faktiske tegne- og materialekilder. Produktkort med animation bruger den fælles afspiller, dekorativ afspilning og et meningsfuldt statisk slutbillede efter reglerne ovenfor. Valg af illustrationsfamilie erstatter ikke produktets brand eller behovet for at godkende motivet.

## Det eksisterende grafikværksted

Det medfølgende **Grafikværksted** er en første opskriftsbaseret generator. Det kan bygge **hus** og **musik** i alle fire stilarter. Det fortolker ikke vilkårlige ord og genererer ikke geometri gennem en ekstern AI-tjeneste. En agent tegner og tilføjer en ny opskrift; værktøjet sørger derefter for ensartet prøvevisning, farver, afspilning og eksport. Nye studier bliver ikke automatisk en del af Design Studios komponentkatalog.

## Deltagernes metoder

| Stil | Guide | Bærende idé |
| --- | --- | --- |
| Tegnets anatomi | [Agent 1: konstruktion og visuel logik](graphics/TEGNETS-ANATOMI.md) | Referencer → konturer → betydning → mål. |
| Lysrum | [Agent 2: lys, åbninger og rolig afsløring](graphics/LYSRUM.md) | Et stabilt rum bliver forståeligt gennem lys og dybde. |
| Passage | [Agent 3: Passage og Feltlinjer](graphics/PASSAGE-OG-FELTLINJER.md) | Materialelag → præcis konstruktion → åbning → ankomst. |
| Feltlinjer | [Agent 3: Passage og Feltlinjer](graphics/PASSAGE-OG-FELTLINJER.md) | Mulige forbindelser → valgt rute → hændelser → destination. |

Guiderne indeholder referenceprofiler og bindende tegneregler samt tekniske metoder og nye storyboards. Storyboards og værkstedets studier er forslag, som skal vurderes mod referenceprofilerne; de er ikke nye stilnormer eller skjulte, allerede registrerede motiver i biblioteket.

## Åbn værkstedet

Fra Design Studios projektmappe, med de normale udviklingsafhængigheder installeret:

```sh
node tools/graphic-lab.mjs
```

Åbn derefter `artifacts/graphic-lab/index.html`. Den genererede prøvevisning er selvstændig og indeholder kode, CSS og nødvendige skrifter. Den har otte studier, afspilning ved hover/fokus, frem/baglæns, pause, tidslinje, reduceret bevægelse, lagforklaring og statisk SVG-eksport. Der afspilles ingen lyd.

Vælg et andet tema eller en afgrænset prøve:

```sh
node tools/graphic-lab.mjs --theme midnight-editorial --mode dark --out artifacts/graphic-lab-dark
node tools/graphic-lab.mjs --family passage --concept house --out artifacts/passage-house
node tools/graphic-lab.mjs --theme terminal --mode ultraviolet --out artifacts/graphic-lab-terminal
```

`--theme` er et lokalt pakke-id fra `packages/`. `--mode` er en faktisk farvetilstand; uden valg bruges temaets standard eller lys tilstand. `--family` accepterer `anatomy`, `lightroom`, `passage`, `fieldlines` og `all`. Begreberne hedder `house` og `music` i koden. Brug `--help` for argumentlisten.

En ikke-tom outputmappe overskrives kun med `--force`. Flaget genbygger værkstedets kendte filer; det rydder ikke andre filer i mappen. Brug helst en ny mappe til hver valgt prøve. Output består af `index.html`, de valgte SVG'er og `manifest.json` med lag, formål og tidsintervaller. Den genererede HTML/SVG redigeres ikke i hånden.

## Fra begreb til opskrift

1. **Læs profil og vælg referencer.** Udfyld arbejdsbriefet ovenfor og find mindst tre faktiske komponentmotiver fra samme familie. Læs deres geometri og materialer; nøjes ikke med navn og stilord.
2. **Beslut betydningen.** Skriv én konkret sætning: »En vej leder ind i et beboet hus« eller »enkelttoner bliver til en samlet frase«. Et ord alene fortæller ikke, hvad illustrationen skal forklare.
3. **Find det genkendelige.** Vælg få træk, som stadig gør motivet læseligt i produktets faktiske størrelse. Hus kan være tag, facade og adgang; musik kan være toner, forbindelse og rytme. Brug abstraktion bevidst.
4. **Vælg stilens handling.** Et Passage-hus bygges af velordnede flader. Et Feltlinjer-hus kan være en adresse for en rute. Den samme animation passer ikke nødvendigvis til begge.
5. **Tegn slutkompositionen.** Illustrationens betydning og stil skal kunne aflæses uden animation. Sammenlign med referencepakken. Kontroller samlinger, cirkelcentre, endepunkter, udskæringer og optisk vægt, før tidslinjen tilføjes.
6. **Navngiv delene.** En del beskriver et meningsfuldt lag: `route`, `opening`, `notes`, `light-field`. Dens navn er ikke blot rækkefølgen i filen.
7. **Skriv et afgrænset forløb, hvis der leveres animation.** Tidsintervaller angives som brøker af hele varigheden. Giv hver fase en årsag. Lad slutbilledet få ro.
8. **Tilføj højst én meningsfuld interaktion først.** Lys kan følge beskueren diskret; en måleprobe kan vise et nærmeste anker. Husets vægge skal ikke drive fra hinanden, fordi markøren flytter sig.
9. **Kontrollér valgte temaer og brugssituationer.** Følg stilkontrollen ovenfor. Rapportér faktisk kontrol, afvigelser og om resultatet er stilgodkendt eller stadig en kandidat.

## Hvor koden hører hjemme

| Fil | Ansvar |
| --- | --- |
| [examples/graphics/concepts.mjs](../examples/graphics/concepts.mjs) | Redigerbare begrebsopskrifter, SVG og deres animationsplaner. |
| [examples/graphics/preview.mjs](../examples/graphics/preview.mjs) | Tynd forbindelse mellem prøvevisningens kontroller og fælles afspiller. |
| [tools/graphic-lab.mjs](../tools/graphic-lab.mjs) | Lokalt build, temavalg, offlinepakning og eksport. |
| [core/graphic-tokens.mjs](../core/graphic-tokens.mjs) | Fælles materialeordbog for illustrationer. |
| [core/graphics/motion/primitives.mjs](../core/graphics/motion/primitives.mjs) | `part`, `track`, `trace` og `parallax`. |
| [core/graphics/motion/player.mjs](../core/graphics/motion/player.mjs) | Timing, seek, reverse, input, reduceret bevægelse og oprydning. |

I grafikværkstedet tilføjes et begreb ved at udvide `CONCEPTS` og skrive en opskrift under hver relevant stil i `recipes`. En opskrift returnerer `label` og `parts`. Hver del har `key`, `name`, `purpose`, `start`, `end` og `body`. Lagordenen er også SVG'ens malerækkefølge. Der findes ingen automatisk geometrioversættelse mellem stilarterne.

`conceptScene(concept, family)` vælger en betroet opskrift. `renderConcept(pack, scene)` laver en selvstændig SVG med temaets validerede, opløste grafikfarver. `createConceptPlan(svg, scene)` returnerer en plan til den fælles afspiller. Eksemplerne bruger almindelige SVG-former; ved gradienter, clips og masker skal id'er have et unikt præfiks pr. illustration.

### Designmønstrenes produktgrafik

Designmønstrene bruger 44 godkendte, statiske illustrationer: ét særskilt motiv for hvert af de 11 mønstre i hver af de fire familier. De følger de samme semantiske grafikmaterialer og `600 × 420`-tegnefelt som komponentreferencerne. Den vandrette kortvælger i [gallery.mjs](../patterns/gallery.mjs) ejer navigation og klikflader; SVG'erne er dekorative og har ikke ekstra tastaturstop eller egen afspiller.

| Fil | Ansvar |
| --- | --- |
| [illustrations.mjs](../patterns/illustrations.mjs) | `createPatternIllustrator(theme, {document})` vælger familie, opløser grafikmaterialer og bygger native SVG. Wrapperen samler `defs`, billedbund og semantiske parts og giver hver tegning et unikt præfiks. |
| [illustrations-anatomy.mjs](../patterns/illustrations-anatomy.mjs) | Tegnets anatomi: konturer, fine tekstspor, små ankre og få lokale pigmentaccenter. |
| [illustrations-lightroom.mjs](../patterns/illustrations-lightroom.mjs) | Lysrum: afgrænsede nicher, fine kanter, lys og beskeden materialedybde. |
| [illustrations-passage.mjs](../patterns/illustrations-passage.mjs) | Passage: selvstændige materialeplaner, udskæringer og præcise forbindelser. |
| [illustrations-fieldlines.mjs](../patterns/illustrations-fieldlines.mjs) | Feltlinjer: prioriterede ruter, finere ledsagebaner og præcise destinationer. |
| [illustrations-primitives.mjs](../patterns/illustrations-primitives.mjs) | Betroede beskrivelser med `node`, `paint` og `part`. Hjælperne samler SVG-noder og parts uden at dele motivgeometri mellem familierne. |

Familiefilernes `draw(id, {prefix})` returnerer `label`, `parts` og eventuelt `definitions`. En part indeholder `key`, `name`, `purpose` og `shapes`; noderne kan have egne attributter, tekst og indlejrede børn. Gradienter og clips bruger det modtagne præfiks til både definition og lokal reference. Denne statiske produktvej kræver ingen tidsintervaller eller animationsplan. Nye motiver tilføjes i den relevante familieopskrift efter samme reference- og stilkontrol; produktgodkendelsen gør ikke en lokal løsning til en ny fælles komponentrolle.

## En plan på den fælles afspiller

Eksisterende katalogmotiver bruger fortsat `createGraphicRenderer(pack)` og `mountGraphicMotion(svg)` uændret. Nye studier kan levere en betroet funktion gennem `createPlan`:

```js
import {mountGraphicMotion} from './core/graphics/motion/player.mjs';
import {part, track, trace} from './core/graphics/motion/primitives.mjs';

const controller = mountGraphicMotion(svg, {
  family: 'passage',
  motif: 'house',
  createPlan(element, motif) {
    const facade = part(element, 'structure');
    const contour = part(element, 'contours').querySelector('path');
    const solid = 'cubic-bezier(.22,.78,.2,1)';
    const register = 'cubic-bezier(.4,0,.2,1)';
    return {
      tracks: [
        track(facade, [{opacity: 0}, {opacity: 1}], 0, .3, solid),
        trace(contour, .3, .72, {easing: register})
      ].filter(Boolean),
      interact(input) { /* x og y er normaliserede; active viser kontakt. */ },
      destroy() { /* Fjern kun egne hjælpere; lad slutgeometrien bestå. */ }
    };
  }
});

// Produktet bestemmer, hvornår forløbet skal begynde.
host.addEventListener('pointerenter', () => controller.play());
// Ved afmontering: fjern egne listeners og kald controller.destroy().
```

Stierne i kodeeksemplet er relative til Design Studio-roden; brug produktets synkroniserede runtime i et tilknyttet produkt. `svg` skal være en native SVG med det færdige motiv og de nævnte dele. Uden `createPlan` kræver afspilleren stadig et registreret motiv. Stil-id'et er altid en af de fire eksisterende stilarter. En custom-plan ændrer ikke `GRAPHIC_MOTIFS`, rendererens register eller Studio-temaet.

`createPlan` er almindelig kildekode, som agenten skriver og gennemgår. Den er **ikke** et JSON-felt med JavaScript og bruger hverken `eval` eller dynamisk hentet kode. Montér ikke en ny afspiller ved hvert hover. Funktionen kaldes først, når der er brug for animation eller interaktion, og kan kaldes igen efter oprydning; opret friske hjælpere hver gang.

Hver track har `{target, frames, start, end, easing}` med `0 ≤ start < end ≤ 1`. `target` skal ligge inde i SVG'en. `track()` konstruerer beskrivelsen; `trace()` bruger formens faktiske længde til stregtegning. Elementet må ikke samtidig have konkurrerende tracks for samme CSS-egenskab. Et lag kan godt fade ind samtidig med, at dets børns konturer tegnes.

Planen returnerer `{tracks, interact?, destroy?}`. `interact({x,y,active})` modtager normaliserede input; afspilleren forbinder pointer og tastatur. Brug separate wrapperlag, hvis en interaktion og tidslinjen ellers begge ville eje samme transform. `parallax()` tilbyder netop et midlertidigt wrapperlag med `update()` og `destroy()`.

Afspilleren ejer `play()`, `play(true)`, `pause()`, `seek(.5)`, `settle()`, `setReduced(true)`, `setLoop(true)` og `destroy()`. Den færdige komposition vises ved montering. Systemets reducerede bevægelse kan ikke slås fra af produktet: her bevares det statiske slutbillede. Et animeret SVG indlæst som almindelig `img` afspiller ikke denne JavaScript-plan; brug inline-SVG og montér afspilleren.

## Materialer og temaer

Brug grafikrollerne `ground`, `plane`, `ink`, `subject`, `counter`, `context`, `edge`, `light` og `depth` gennem bindings fra `GRAPHIC_TOKEN_BINDINGS`. Stregvægt og dybdestyrke kommer fra `illustration.material.*`; varighed fra `duration.illustration`. Lad ikke en illustration hente tilfældige knap- eller statusfarver. Geometri skal normalt kunne genbruges på tværs af temaer, mens materialerne giver forskelligt udtryk.

Illustrationsstilen er Studio-/produktvalg og gemmes ikke i temaet. En scene må heller ikke tage ejerskab over navigation, lagring eller rigtige kontrollertilstande.

## Kunstnerisk og eksperimentel UI

Brug samme metode på faktiske relationer i en grænseflade. En rute kan forbinde valgt objekt og egenskaber; en åbning kan afsløre indhold; et lysfelt kan samle opmærksomheden om en relevant region. Vis en reel tilstand med native controls og fælles controllere. Bind derefter illustrationen til den samme produktstate. Tegnet fremdrift er ikke en faktisk aktivitetsindikator, medmindre den drives af den virkelige aktivitet.

Bevar fokus, labels, klikflader og informationsadgang, også når bevægelsen er slået fra. En dekorativ tegning omkring en knap må ikke blive et ekstra, skjult kliklag. Ved skift af data: stop eller afmontér den gamle controller, og montér den nye scene med en entydig identitet. Udvid først produktet med mere fri bevægelse, når den grundlæggende handling og genvejen uden animation fungerer.

## Kort opgave til næste agent

> Brug stilkontrakt version 1 i docs/GRAPHICS-AUTHORING.md, docs/graphics/style-contract.json og den valgte familieguide. Illustrér [begreb] med betydningen [konkret relation] i [familie] til [billedmål]. Vælg først mindst tre registrerede komponentreferencer og forklar, hvilke proportioner og materialegreb du viderefører. Tegn på 600 × 420 med familiens faktiske kontur-, tekst-, flade- og lys-/ruteopskrifter. Ingen generel stregforstærkning eller geometrioversættelse mellem familier. Vis kandidat og referencer i samme tema, farvetilstand og størrelse; kontrollér også den store statiske komposition. Angiv parts, ankre og bevidste afvigelser. Ved animation: følg familiens koreografi og genbrug mountGraphicMotion med en betroet createPlan; kontrollér mellemposer, slutpose, tastatur og reduceret bevægelse. Brug grafikværkstedet til en selvstændig prøve, når opgaven er et nyt begrebsstudie. Rapportér det faktisk kontrollerede og vis resultatet til vurdering; teknisk validering alene er ikke stilgodkendelse.

Ved senere optagelse i det fælles komponentkatalog skal motivets rolle, tegning, parts, bevægelse og tests indføres gennem de eksisterende registre. Et produktbegreb som hus eller musik behøver normalt ikke blive en fælles komponentrolle.
