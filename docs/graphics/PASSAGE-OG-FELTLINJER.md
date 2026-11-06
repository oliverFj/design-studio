# Passage og Feltlinjer: fra betydning til bevægelse

En praktisk deltagerguide til illustrationer og kunstnerisk UI med de to billedfamilier. Målet er en form, der kan aflæses, og et forløb, der gør formen mere forståelig. En stærk statisk slutkomposition kommer før animationen.

Brug [den fælles forfatterguide](../GRAPHICS-AUTHORING.md) til værktøj, forhåndsvisning og produktintegration. Her beskrives familiernes håndværk og den aktuelle kildekode. Hus og musik nedenfor er storyboards til produktillustrationer; de er ikke navne på nye biblioteksroller eller eksisterende motiv-ID'er.

## Referenceprofiler og bindende tegneregler

Følg først [stilkontrakten og referencehierarkiet](../GRAPHICS-AUTHORING.md#stilkontrakt-og-referencehierarki). Komponentkortenes registrerede grafik er den primære stilreference. Mønstersidens [Passage](../../patterns/illustrations-passage.mjs) og [Feltlinjer](../../patterns/illustrations-fieldlines.mjs) er godkendt afledt produktgrafik; deres kompositioner fastlægger ikke nye normalværdier. Begrebsstudier og storyboards vurderes fortsat mod komponentreferencerne. Alle mål herunder er **SVG-enheder på 600 × 420**, ikke CSS-pixel.

Tabellerne beskriver kildeaflæste værdier. Afsnittene »Startopskrift« og »Afvis disse afvigelser« er leveringsregler udledt af disse referencer. Et enkeltscenes mål er et sammenligningsgrundlag, ikke et krav om identiske dimensioner i nye motiver.

### Passage: materiale er tyngden, konturen er præcisionen

Passages massive udtryk kommer af udfyldte planer, udskårne modformer og afstemte forskydninger. Det kommer ikke af at gøre alle linjer tykke. [Katalogets tegnere](../../core/graphics/families/passage-catalog.mjs) skelner disse arbejdsopgaver:

| Arbejde | Faktisk referenceværdi | Anvendelse ved ny tegning |
| --- | --- | --- |
| Almindelig kontur | `L`: `edge`, `var(--g-line-width)`; shared default er 1,8. Rundt cap/join. | Brug til samlinger og konturer. Angiv `ink` eksplicit, når en kontur skal bære betydning. |
| Materialeplan | `R` har `plane` som default; `P` har `subject`. Rektangler har skarpe hjørner. | Vælg fill efter lagets opgave. Giv ikke alle flader pigment, og indfør ikke en fælles afrunding. |
| Udskåret vindue | `windowFrame`: 15 i standardtykkelse; fx input 19, detaljepanel 15 og tabel 14. `fill-rule="evenodd"`. | Brug en faktisk modform. Bevar forskellen mellem materialets tykkelse og en tynd kantstreg. |
| Udskåret ring | `ring`: 14 i standardtykkelse; mindre symboler bruger fx 5–7. | Brug tykkelsen som materiale omkring en åbning, ikke som en standardkontur. |
| Tekstspor | `bars`: `ink`, streg 2, linjeafstand 25. Konkrete motiver bruger også 1,8–3 og en stærkere titellinje på 4–5. | Variér længder og behold luft mellem linjerne. På pigment bruger teksten normalt `ground`; på papir `ink`. |
| Bogstaver og tal | `T`: Arial/sans-serif, vægt 600, helperdefault 20. Fx `24` i grid: 23; `AB`: 25; `LOGO`: 37. Overskrift/nøgletal: 126/127. | Bogstaver må være motivets hovedform, når begrebet handler om typografi eller tal. Store displaymål er ikke en ny normal for labels. |
| Mål og registrering | `sideMeasure`: streg 1, opacity .6, tværstreger 12 lange. Guidelinjer er typisk 1–1,3. | Tilføj et mål, som forklarer et konkret forhold; hold det finere end indholdet. |
| Statisk bagplan | Fx tabel: front `(82,78)`, bagplan `(99,94)`; avatar: front `(202,63)`, bagplan `(220,79)`. | Bevar en konsistent forskydningsretning i motivet. Disse +17/+16 og +18/+16 er referencemål, ikke et universelt perspektivgrid. |

Brug disse fem motiver som referencekort; vælg mindst ét, der ligner den nye opgave:

- **`button`**: massiv front, mørk forkant, forskudt bagplan, 5-enheders navnespor og 1-enheders mål. Gør vægtforskellen tydelig.
- **`input`**: præcis rektangulær udskæring med 19-enheders materiale. Adskiller hulrum fra en almindelig stregtegnet kontrol.
- **`inspector`**: objekt, selvstændigt panel, fine tekstniveauer og en fæstnet forbindelse på 1,8 med et 5-enheders anker. Relevant for editor-/detaljemotiver.
- **`data-grid`**: materialeomslutning 14, cellenet 1, aktiv cellekontur/markør 2,5. Viser, at præcis information forbliver fin, selv i en solid familie.
- **`spinner`**: særtilfælde med koncentrisk materiale på 36 og et åbent aktivitetsspor på 24, fine konturer på 1,2 samt butt-ender. De brede streger er selve ringmaterialet og må ikke genbruges som normalvægt til tekst, forbindelser eller panelkonturer.

De fire eksplicitte rektangelafrundinger i den gennemgåede Passage-komponentsamling tilhører `switch`: `rx=33` på en 66 høj kapsel. Det er en formbestemt undtagelse, ikke familiens hjørneradius. Cirkeludskæringer og buer er naturligvis stadig en del af familien.

**Startopskrift:** Tag den nærmeste references lagstruktur. Tegn først én bærende masse og den åbning, der forklarer begrebet. Placér et eventuelt bagplan i en afstemt retning. Tilføj indhold med normale 1,8–3-enheders streger, en begrundet modfarve og til sidst fine mål. Hold de fælles kanter, akser og indlæg præcise. Et nyt perspektiv eller en isometrisk konstruktion skal begrundes særskilt mod den valgte reference; stilordet »arkitektonisk« kræver ikke en terning.

**Afvis disse afvigelser:** 6× stregmultiplikation som generel stilregel; 14-enheders afrundede tekstblokke i stedet for referencefamiliernes fine tekstspor; identiske bjerge/landskabspolygoner på tværs af familier; tunge pile eller forbindelser, der konkurrerer med materialemassen; baggrundsfarvede »huller«, som skjuler et bagplan, der skulle være synligt. Mere læsbar grafik i lille format kræver en vurderet forenkling, ikke en ny fælles stregskala.

### Feltlinjer: én læsbar rute i et fint tegningsfelt

[Katalogets tegnere](../../core/graphics/families/fieldlines-catalog.mjs) bruger en klar lagdeling mellem et afgrænset hovedspor, fine alternative baner, rollekendetegn og mindre knuder. Bevar denne forskel, også når motivet skal vises lille.

| Arbejde | Faktisk referenceværdi | Anvendelse ved ny tegning |
| --- | --- | --- |
| Hovedrute i kataloget | `flow(d)`: samme `d` tegnes i `ground` 17, `subject` 10 og `ink` 1,1, i den rækkefølge. | Genbrug geometrien uændret mellem de tre lag. Frirummet i billedbundens farve og den fine midterstreg er en del af rutens karakter. |
| Sekundær streg | `line`: `edge`, `var(--g-line-width)`; forbindelser/tekst typisk 1–2. Runde caps/joins. | Sekundære baner skal stå tydeligt finere end pigmentruten. |
| Ledsagende felt | `fan`: fem kurver, `i=-2…2`, startforskydning `i×15`, slutforskydning `i×25`; Bézier-kontroller +90/−90 vandret; `edge`, 1, opacity .45. | Brug et kontrolleret fælles kurveforløb. Antallet fem er denne helpers opskrift, ikke et krav om fem kurver i alle scener. |
| Fyldt knude | `dot`: default radius 8, `counter`; faktiske forbindelsesankre ofte 5–9. | Sæt knuden på sin faktiske bane/forgrening. Store fokusknuder kræver samme begrundelse som i fokusreferencen. |
| Åben knude | `ring`: default radius 18, fyld `ground`, kontur `ink` med materialets lineWidth. | Lad den åbne indre form skelne en destination eller alternativ tilstand fra et fyldt anker. |
| Indholdsflade | `plate`: `plane`, `edge`-kontur med materialets lineWidth, default radius 14. | En flade er støtte for et bestemt indhold; den må ikke opsluge rutens hierarki. Kapsler er konkrete rolleformer, fx button-radius 48 på højde 96. |
| Tekstspor | `writing`: `ink`, streg 2, linjeafstand 24; grundlængde 160 og hver anden linje 35 kortere. | Bevar den fine, varierede læserytme. Tekst er ikke endnu en hovedbane. |
| Bogstaver og tal | `text`: ui-monospace/monospace, default 16. Fx overskrift `Aa` 64, nøgletal `42` 79. | Behold familiens tekniske typografiske tone. Displayformer er begrundede motivundtagelser. |
| Registrering | Katalogdefault: to kryds, streg 1, opacity .45, arme 14 lange. | Hold mærker tilbagetrukne og adskilt fra hovedrutens knuder. Placeringen må tilpasses kompositionen. |

**Oprindelige motiver er særskilte opskrifter.** [fieldlines.mjs](../../core/graphics/families/fieldlines.mjs) indeholder bevidste variationer: `poster` har 22/14/1,3-rute; `focus` har 10/1,2 uden ground-underlag; `relation` har to 11/1,1-baner i modfarver; `rhythm` har en 5-enheders hovedbølge; `progress` har 18-enheders passeret/ventende bane. Det er bevarede kompositioner med egen fortælling. Nye kataloglignende motiver starter ved `flow`, mens afvigelser skal knyttes til en konkret reference og forklares. Normalisér ikke eksisterende originaler til én helper.

Brug disse fem motiver som referencekort:

- **`button`**: fem fine ledsagekurver samles i en tredobbelt rute, som ankommer ved en stor handlingsflade. Skelner ruten fra dens destination.
- **`range-field`**: passeret og mulig kurve mødes ved skyderens faktiske position. Fine trin og lille talværdi er underordnet ruten.
- **`inspector`**: en rute forbinder et bestemt objekt med et separat egenskabspanel; tynde tekstspor og små ankre giver lokal præcision.
- **`data-grid`**: hovedrute, cellenet, aktiv celle og tekstmarkør har forskellige vægte og opgaver. Bevarer et faktisk rolletegn frem for et generisk netværk.
- **`image`** i originalmodulet: let billedramme på 1,7; ét kurvet landskabsspor på 11; to ekkoer på 1,4 med opacity .65/.4; afgrænset sol med radius 26. Referencen bruger kurvelandskab, ikke de samme polygonbjerge som Passage.

**Startopskrift:** Placér kilder, forgreninger og destination først. Tegn én kontinuerlig Bézier-rute med en klar ankomst; brug samme `d` til rutens tre materialelag. Lad eventuelle sekundære baner og guides blive på 1–2-enheders niveau. Tilføj kun de flader og indholdstegn, som præciserer begrebet. Anbring små fyldte/åbne markører nøjagtigt på forløbet. Sammenlign med referencen både uden farveforklaring og ved den faktiske visningsstørrelse.

**Afvis disse afvigelser:** flad 16–18-enheders pigmentstreg som automatisk erstatning for `flow`; 10–14-enheders alternative baner, der får næsten samme vægt som hovedruten; store cirkler på alle forbindelsesender; fine oplysninger erstattet af fede afrundede bjælker; kurver, hvis knuder kun ligger omtrent på banen; universelle polygonbilleder på tværs af familier. At alle farver kommer fra de rigtige tokens dokumenterer ikke, at geometri og vægthierarki passer til Feltlinjer.

### Kontrol ved aflevering

1. Angiv de valgte referencemotiver og hvorfor de matcher den nye opgave. Adskil materialetykkelse, kontur, tekstspor og guides i din værdioversigt.
2. Vis nyt motiv og referencer med samme tema, farvetilstand og billedmål. Et komponentkort har en 154 CSS-pixel høj billedramme; SVG'en skaleres med bevaret 600:420-forhold. Sammenlign også ved 600 × 420. Opfind ikke et lokalt 6×-forstærket ikon som grundlag for en senere stor illustration.
3. Kontrollér især, om Passage stadig får sin vægt fra masse/modform, og om Feltlinjer stadig har et klart forhold mellem rute og fint felt. En opfyldt token- eller SVG-kontrakt er ikke en æstetisk godkendelse.
4. Ved animation: kontrollér færdig pose, mellemposer og tilbageafspilning. Finere spor må ikke blive opake hovedstreger ved 100 %, og sammenhørende geometri må ikke glide fra hinanden.

## Vælg billedets arbejde

Skriv én sætning om det, billedet skal vise. »Et hus« er en genstand; »en åbning giver adgang til et fælles rum« er en billedidé. »Musik« er et emne; »flere toner bliver til én frase« giver komposition og bevægelse retning.

| Spørgsmål | Passage | Feltlinjer |
| --- | --- | --- |
| Hvad bærer betydningen? | Massiv form, udskæring, kant, fælles base og materialelag. | Forløb, forgrening, forbindelse og ankomst til et punkt. |
| Hvor opstår karakteren? | I forholdet mellem tyngde og aktivt tomrum. | I spændingen mellem organiske kurver og præcis geometri. |
| Hvad gør bevægelsen? | Registrerer materialer, afslører rum og færdiggør konstruktionen. | Tegner en sammenhæng og lader dens knuder svare. |
| Hvad gør pointeren? | Undersøger begrænset materialedybde. | Finder et præcist punkt på et meningsfuldt forløb. |

Brug genkendelige rolletegn. Et tekstinput har en indsætningsmarkør, en valgliste en åbning til kendte muligheder, og en feltgruppe har et fælles navn omkring flere selvstændige felter. Geometriske figurer alene kan ikke forklare alle de forskelle. Læs den berørte rolle i [biblioteket](../../core/library.mjs), før du tegner et katalogmotiv.

## Find den rigtige kilde

| Fil | Faktisk ansvar |
| --- | --- |
| [graphics.mjs](../../core/graphics.mjs) | Offentligt register, rendering, native SVG og valideret renderer-snapshot. |
| [graphic-tokens.mjs](../../core/graphic-tokens.mjs) | Farver, materialeparametre, familievalg og standardvarighed. |
| [families/passage.mjs](../../core/graphics/families/passage.mjs) | Passages særskilte kompositioner og indgangen `draw`. |
| [families/passage-catalog.mjs](../../core/graphics/families/passage-catalog.mjs) | Katalogets Passage-tegninger, `drawCatalog`, `PASSAGE_CATALOG_IDS` og `catalogMotion`. |
| [families/fieldlines.mjs](../../core/graphics/families/fieldlines.mjs) | Feltlinjers særskilte kompositioner og indgangen `draw`. |
| [families/fieldlines-catalog.mjs](../../core/graphics/families/fieldlines-catalog.mjs) | Katalogets forløb, forgreninger og rollekendetegn gennem `drawCatalog`. |
| [motion/passage.mjs](../../core/graphics/motion/passage.mjs), [motion/fieldlines.mjs](../../core/graphics/motion/fieldlines.mjs) | Familiernes `meta` og `create(svg, motif)`, der beskriver koreografi og interaktion. |
| [motion/primitives.mjs](../../core/graphics/motion/primitives.mjs) | `part`, `track`, `trace` og `parallax`. |
| [motion/player.mjs](../../core/graphics/motion/player.mjs) | Én fælles tidslinje, afspilning, tastatur, præferencer og oprydning. |
| [patterns/illustrations-passage.mjs](../../patterns/illustrations-passage.mjs), [patterns/illustrations-fieldlines.mjs](../../patterns/illustrations-fieldlines.mjs) | Godkendte statiske mønsterkompositioner; hver eksporterer `draw(id, {prefix})` med `label`, semantiske `parts` af SVG-deskriptorer og eventuelle `definitions`. |
| [patterns/illustrations.mjs](../../patterns/illustrations.mjs), [patterns/illustrations-primitives.mjs](../../patterns/illustrations-primitives.mjs) | `createPatternIllustrator` samler produktgrafikken som native inline-SVG med temabindinger og unikke præfikser; `node`, `paint` og `part` beskriver dens elementer og lag. |

Tegnehjælpere som katalogets `windowFrame`, `ring`, `flow` og `scene` er lokale implementeringshjælpere. De er ikke offentlige imports til et produkt. Mønsterkompositionerne har egne familiebestemte tegnere, som viderefører de relevante materialeopskrifter; de bruger ikke en fælles geometrisk oversættelse mellem familierne. Mønstrene er ikke registrerede komponentmotiver og monterer ingen animationsafspiller. Andre produkter bruger den fælles runtime eller en særskilt forfatterindgang til egne illustrationer.

## Tegn en slutkomposition, der kan stå alene

Familiernes `draw(motif, {prefix})` returnerer:

```js
{
  body,                    // SVG-indhold uden ydre <svg>
  viewBox: '0 0 600 420',
  label,                   // forståelig beskrivelse af motivet
  parts: [{key, name, purpose}]
}
```

Hver semantisk del har `data-part="key"` og tilsvarende metadata. Vælg dele efter det, en fremtidig bevægelse skal forklare: bagplan, ramme, åbning, indhold, forbindelse og markør. Et vilkårligt stykke path behøver ikke sit eget lag. `name` og `purpose` skal være brugbart dansk; `key` er et stabilt teknisk navn.

Brug `prefix` i alle lokale gradient-, clip- og øvrige definitions-ID'er samt deres referencer. Samme illustration skal kunne stå flere gange på én side. Det offentlige renderer-API laver et unikt præfiks, når `idPrefix` ikke er angivet.

### Passage: konstruér et rum

1. **Forankr massen.** Find hovedfladen og dens grundplan. En stor illustration må være modig; små katalogmotiver skal stadig have en tydelig silhuet.
2. **Giv åbningen en opgave.** En portal afslører noget bagved, en fælles sokkel samler personer, og et hulrum giver indhold plads. En ekstra ramme skal forklare noget nyt.
3. **Afstem samlingerne.** Delte akser, ens mellemrum og synlige fæstner giver formen autoritet. Lidt asymmetri kan give liv, når den er bevidst.
4. **Tegn hjælpelinjer til sidst.** De understøtter konstruktionen og skal kunne træde tilbage i små formater.

I koden laver `windowFrame` og `ring` ægte modformer med `fill-rule="evenodd"`. Et `GROUND`-farvet element kan også tegne et modtegn mod en solid flade; det er dog ikke et transparent hul gennem vilkårlige baglag. Brug en faktisk udskæring eller clipping, når noget bagved skal kunne ses.

Vælg rektanglers materiale eksplicit. `R` i katalogmodulet har `plane` som default, mens `P` har `subject`. Et lyst navn på en implicit papirflade kan derfor forsvinde. Solide trykflader og portrætter kan bruge `SUBJECT` med `GROUND` som modtegn. Papirflader har normalt `INK`-indhold. Gennemgå parret i den leverede farvetilstand.

### Feltlinjer: tegn en årsag og en destination

1. **Placér knuderne først.** Hvad er kilden, hvad forbindes, og hvor slutter forløbet?
2. **Tegn hovedruten.** Lad Bézier-kurvens ind- og udgang følge en klar retning. En streg må ikke standse tilfældigt før sin knude.
3. **Tilføj ledsagespor.** De giver felt og rytme, men hovedsporet skal fortsat kunne udpeges straks.
4. **Tilføj rollekendetegn.** Personer, tal, kalenderceller, tekstspor og kontroltegn præciserer betydningen.

Katalogets `flow(d)` tegner samme path tre gange: `ground` med bredde 17, `subject` med bredde 10 og `ink` med bredde 1,1. De særskilte kompositioner bruger også andre bevidste bredder. Bevar fælles geometri mellem underlag og hovedstreg, når de skal opleves som ét spor.

Katalogets `scene` samler normalt `context`, `routes`, `content`, `markers` og `guides`; tomme grupper udelades. De særskilte motiver har mere præcise navne som `decision`, `completed-route` og `current-node`. Brug deres konkrete anatomi, når der skrives motion.

Et aktuelt punkt skal stå ved den faktisk nåede position. En løs markør længere fremme kan få en illustration til at love mere fremdrift, end stregen viser. En forgrening skal have en ubrudt fælles stamme.

## Farven navngiver en grafisk rolle

SVG-familierne bruger disse lokale variabler:

| Variabler | Opgave |
| --- | --- |
| `--g-ground`, `--g-plane` | Billedbund og selvstændigt materialeplan. |
| `--g-subject`, `--g-counter` | Hovedpigment og en afstemt modstemme. |
| `--g-ink`, `--g-edge` | Betydningsbærende tegn og sekundære kanter. |
| `--g-context` | Tilbagetrukket masse og sammenhæng. |
| `--g-light`, `--g-depth` | Lys og materialedybde. |
| `--g-line-width`, `--g-depth-opacity` | Stregvægt og dybdens styrke. |

Bindingerne ligger i `GRAPHIC_TOKEN_BINDINGS`. Eksempelvis bindes `--g-counter` til `color.illustration.counterpoint`. Materialetokens har camelCase i deres offentlige ID'er, og `cssVariableName` bevarer det: `--ds-illustration-material-lineWidth` og `--ds-illustration-material-depthOpacity`.

Lad det fælles renderer-API lave bindingen. Det giver live SVG'er adgang til temaets `--ds-*`-værdier og sikker fallback. `resolved:true` giver selvstændige farveværdier til SVG- og data-URL-eksport. Et illustrationspigment er ikke i sig selv en fejl-, succes- eller handlingsfarve.

## Brug den fælles runtime i et produkt

Find produktets faktiske runtime i `design-studio.project.json`. Følgende eksempel bruger standardplaceringen:

```js
import {
  createGraphicRenderer,
  mountGraphicMotion
} from './design/runtime/components.mjs';

export function mountIllustration(host, playButton, theme) {
  const graphics = createGraphicRenderer(theme);
  const svg = graphics.create('poster', {
    family: 'passage'
  }, {document: host.ownerDocument});
  host.replaceChildren(svg);

  const motion = mountGraphicMotion(svg, {interactive: true});
  const play = () => motion.play();
  playButton.addEventListener('click', play);

  return () => {
    playButton.removeEventListener('click', play);
    motion.destroy();
  };
}
```

Mount viser det færdige motiv og starter ingen afspilning. Brug `decorative:true` og `interactive:false`, når billedet kun ledsager en allerede navngivet kontrol. Et meningsbærende billede får sin beskrivelse via SVG-titlen. Angiv kun `hintId`, når det peger på en faktisk forklaring i produktets DOM.

`createGraphicRenderer(theme)` validerer og resolver én gang i en frisk snapshot-lukning. Genbrug den til flere motiver i samme visning. Opret en ny renderer efter ændringer i temakilden; brug ingen global cache omkring mutable temaer. `renderGraphic` og `createGraphic` er bekvemme enkeltkald. `getGraphicParts` giver danske lagnavne og beskrivelser uden montering.

`GRAPHIC_MOTION[familyId]` er selve metadataobjektet med `title`, `description`, `interactionHint` og `duration`; der er ikke et ekstra `.meta`-niveau i dette offentlige register.

## Skriv et forløb, der kan spoles

Et familiespecifikt `create(svg, motif)` returnerer `{duration, tracks, interact, destroy}`. Der startes ingen animation i funktionen. Den beskriver forløbet; den fælles player udfører det.

| Hjælper | Kontrakt |
| --- | --- |
| `part(svg, key)` | Finder den navngivne `data-part`-gruppe. |
| `track(target, frames, start=0, end=1, easing=...)` | Returnerer en track-record; den starter ikke WAAPI. |
| `trace(shape, start, end, {reverse=false, easing}={})` | Bruger `getTotalLength()` til dash-afsløring. Returnerer `null`, hvis formen ikke kan spores. |
| `parallax(target, {x=6, y=4})` | Pakker delen ind, så pointeroffset ikke konkurrerer med tidslinjens transform. Giver `update` og `destroy`. |

Et track har `{target, frames, start, end, easing}`. Tiderne er brøker af hele varigheden, og `0 <= start < end <= 1`. Standardvarigheden er 3200 ms, men `duration.illustration` og en eksplicit player-option kan ændre den. Tegnerækkefølgen må derfor ikke bygge på egne timere.

Sluttilstanden skal være den fulde statiske illustration: opacity tilbage til 1, trace-offset til 0 og midlertidige transforms væk. Respektér en forms eksisterende opacity, når et barn animeres direkte. Ellers kan en sekundær streg blive lige så stærk som hovedsporet.

Passage bruger `SOLID = cubic-bezier(.22,.78,.2,1)` til materialers ankomst og `REGISTER = cubic-bezier(.4,0,.2,1)` til registrering og stregafsløring. Katalogets `catalogMotion` leverer delvise opskrifter med `start`, `end`, `x`, `y`, `trace` og `depth`. Særlige motiver kan have deres eget scene-forløb.

Feltlinjer bruger `FLOW = cubic-bezier(.35,0,.2,1)` og `SOFT = cubic-bezier(.2,.7,.2,1)`. Knuder kan komme ind fra en mindre skala, passere 1,025 og lande på 1. Rytmemotivets kurver tegnes lineært; formen og de forskudte ekkoer bærer rytmen.

Ved absolutte matrixberegninger bruges `transformBox:'view-box'` og `transformOrigin:'0px 0px'`. Et SVG-lags CSS kan ellers bruge sit eget centrum og lægge endnu en forskydning oven i beregningen. Vælg ét koordinatsystem gennem hele forløbet.

### To faktiske forløb at lære af

**Passages aktivitetsindikator** bygger formen op omkring ét fælles centrum `(300,210)`. Materialet har radius 101 og stregbredde 36; konturerne ligger ved 83 og 119. En åben bue med radius 101 og bredde 24 får et kort accentindlæg på samme geometri. Butt-enderne holder samlingerne præcise.

| Fase | Faktisk forløb |
| --- | --- |
| Materiale | `rear-plane` fades ind `.02–.30`. |
| Konstruktion | `orbit` fades ind `.23–.34` og spores `.25–.56`. |
| Aktivitetsspor | `activity` fades ind `.42–.48` og spores `.44–.81`. |
| Grundplan | `guides` fades ind `.62–.75` og spores `.65–.87`. |
| Registrering | `accent` fades ind `.82–.86` og spores `.84–.95`. |

Ingen af delene roterer eller forskydes, og dette motiv tilføjer ingen parallax. Det almene greb er at holde geometrien velordnet og lade hvert trin færdiggøre et forståeligt forhold. Et bevægelsesgreb vælges efter billedets fortælling.

**Feltlinjers fremdrift** viser den ventende bane først. `completed-route` tegnes `.12–.80`, mens `current-node` følger samme kurve og samme easing i samme tidsvindue. `follow` sampler 49 positioner med `getPointAtLength()`; den aktuelle markør ankommer dermed til sin faktiske slutposition `(366,126)`. Den åbne destination står særskilt ved `(510,126)`.

Hold stroke-afsløring og bevægende markør på samme tidsgrundlag. To næsten ens kurver eller forskellige easingkurver giver et synligt brud, selv om begge spor ser rigtige ud hver for sig.

## Interaktion og afmontering

Playeren giver `play(backwards=false)`, `pause()`, `toggle()`, `seek(progress,{direction}={})`, `settle()`, `setReduced(value)`, `setLoop(value)`, `setInteraction(value)`, `state` og `destroy()`. `seek` kan gendanne en pauset retning med `-1` eller `1`. Loop er et aktivt valg og har den fælles afslutningspause på 650 ms.

Pointer og piletaster føres gennem samme normaliserede input `{x,y,active}`, hvor x/y går fra -1 til 1. Mellemrum styrer afspilning; Escape eller Home nulstiller pointerundersøgelsen. Interaktion udføres ved den færdige pose, ikke midt i en igangværende tegning.

- **Passage:** små offsets i bagplanerne afslører materialedybde. Lad faste ankre blive stående. En scrollbar, skyder eller valgt knude må ikke glide væk fra sin faktiske bane.
- **Feltlinjer:** pointersonden bruger 41 prøver pr. kandidatkurve og forfiner det nærmeste punkt. Den skjules langt fra banen og respekterer udvalgte okklusioner og billedåbninger. Hjælperen er et SVG-overlay med `data-motion-helper` og fjernes ved `destroy`.

Systemets reducerede bevægelse har forrang. Den fælles player viser slutformen, fjerner midlertidige bevægelseslag og udelader pointerbevægelsen. Manglende WAAPI efterlader også en statisk illustration. Produktet skal kalde `destroy` før genmontering og må ikke lægge et ekstra RAF-loop oven på playeren.

## Storyboard: hus

### Passage — adgang til et fælles rum

Tegn en genkendelig facade med tag, sokkel og én betydningsfuld døråbning. Giv vinduer og dør fælles akser; tagudhæng og bagplan må gerne give tyngde. Lad det aktive tomrum være selve adgangsmuligheden.

| Interval | Forslag til lag og handling |
| --- | --- |
| `0–.28` | `foundation` og et roligt `rear-plane` registreres. |
| `.16–.52` | `facade` lander; tagets og vinduernes konstruktionskanter tegnes. |
| `.40–.72` | `door-opening` afslører et indre plan. En faktisk clip bevarer åbningens grænse. |
| `.64–.90` | `entrance-route` forbinder døren med den fælles sokkel; et lille anker afslutter forbindelsen. |
| `.84–1` | Udvalgte mållinjer og en kort forklaring færdiggør billedet. |

Pointeren kan forskyde det indre bagplan 2–4 SVG-enheder. Facade, dørkant og adgangsanker bliver stående. En rigtig åbne-/lukkehandling i et produkt skal have en navngivet native kontrol ved siden af illustrationen.

### Feltlinjer — et hus af forbindelser

Lad en rolig huskontur afgrænse motivet. En rute starter ved entréen og forgrener sig til to forskellige rum. Knuderne er steder i huset, ikke tilfældige pyntemarkører.

| Interval | Forslag til lag og handling |
| --- | --- |
| `0–.25` | `house-context` og en enkel planstruktur bliver synlig. |
| `.12–.50` | `entrance-route` tegnes til den fælles fordelingsknude. |
| `.38–.76` | To `room-route`-grene tegnes fra samme faktiske stamme. |
| `.65–.93` | `room-nodes` svarer ved ankomst; rummenes navne følger. |
| `.78–1` | Få ledsagespor og registreringsmærker færdiggør feltet. |

En sonde kan følge den nærmeste synlige rute. Gør rumvalg til en særskilt tilgængelig handling, hvis billedet bruges som navigation. Brug samme koordinater til ruteendepunkt, synlig knude og eventuelt hotspot.

## Storyboard: musik

### Passage — en rytme bliver til en konstruktion

To solide notehoveder med præcist fæstnede stængler og en fælles bjælke giver et genkendeligt musikmotiv. Et let nodesystem holder tonen uden at dominere. Lad luften mellem delene skabe den åbning, som kendetegner familien.

| Interval | Forslag til lag og handling |
| --- | --- |
| `0–.30` | `staff` tegnes som et tilbagetrukket, stabilt grundlag. |
| `.14–.51` | `note-head-1` og `note-head-2` registreres med en lille tidsforskydning. |
| `.35–.69` | `stems` fæstnes til hovederne; samlingerne skal være præcise i alle poser. |
| `.56–.86` | `beam` samler tonerne til en visuel frase. |
| `.82–1` | Et kort accentindlæg og eventuel tekst afslutter motivet. |

Hold de bærende samlinger samlet under parallax. Ved nodegrafik skal form og sammenbinding fortsat ligne det musikalske tegn, der menes. Animationen giver ingen lyd af sig selv; eventuel afspilning kræver produktets egne kontroller og lydhåndtering.

### Feltlinjer — en frase finder sin afslutning

Placér nogle få tonepunkter med en meningsfuld vandret rækkefølge. Lad en melodisk kurve forbinde dem og et par svagere ekkospor følge samme frasering. En lille nodehenvisning eller et udsnit af et nodesystem gør emnet klart uden forklaring.

| Interval | Forslag til lag og handling |
| --- | --- |
| `0–.25` | `musical-context` etablerer nodesystem eller en anden tydelig musikhenvisning. |
| `.08–.76` | `phrase-route` tegnes fra begyndelse til afslutning. |
| `.16–.87` | `echo-1` og `echo-2` følger med kontrolleret forsinkelse. |
| Under rutens ankomst | `tone-nodes` registreres ved de tilsvarende positioner langs kurven. |
| `.78–1` | Sidste tone og en rolig afslutningsmarkering bliver stående. |

En pointersonde kan undersøge frasens kurve. Kurven er kunstnerisk komposition, medmindre produktet faktisk binder den til lyddata. En figur bør derfor ikke udgive en dekorativ bølge for at være et målt signal eller en aktiv afspilningsposition.

## Et lille værktøj, der hjælper beslutningen

Det nyttige minimum er én offline forhåndsvisning af **samme begreb i flere familier**, med temavalg, farvetilstand, play/pause, baglæns, tidslinje og reduceret bevægelse. Tilføj danske delnavne og fire faste posenedslag: `0`, `.33`, `.66` og `1`.

Lad værktøjet bruge den fælles player og en betroet customplan. Det skal kunne prøve hus og musik uden at registrere dem som nye komponentroller. Det har ikke brug for en generel SVG-editor, egen animationsmotor eller automatisk motivgenerering. Se [forfatterguiden](../GRAPHICS-AUTHORING.md) for den konkrete `graphic-lab`-indgang.

Før videre integration bør en agent kunne vise en klar silhuet i lille format, et sammenhængende bevægelsesforløb, den færdige statiske pose og faktisk kontrol i de farvetilstande, der leveres. Kontrollér også bagskift i tidslinjen, pointerreset, unikke ID'er og afmontering. Arbejd proportionelt; fælles runtimeændringer følger projektets krav til test, check og build.
