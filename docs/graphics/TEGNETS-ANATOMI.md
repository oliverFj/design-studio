# Tegnets anatomi: fra begreb til præcis, levende grafik

Tegnets anatomi gør en sammenhæng synlig med få præcise tegn. En klamme samler. En kontur afgrænser. En åbning giver adgang. Et markeret anker viser, hvad en forbindelse hører til. Det tekniske udtryk kommer af disse beslutninger og deres indbyrdes præcision.

Brug familien, når et motiv skal være skarpt, rent og teknisk. Den kan godt være eksperimenterende: store spring i skala, aktive mellemrum og udsnit af en konstruktion kan give stærk karakter. Den bærende relation skal stadig kunne aflæses i det statiske billede.

## Referenceprofil og bindende tegneregler

Følg den fælles [stilkontrakt og referencehierarkiet](../GRAPHICS-AUTHORING.md#stilkontrakt-og-referencehierarki). **Primærreferencen er de faktiske komponentmotiver i `anatomy.mjs` og `anatomy-catalog.mjs`.** Designmønstrenes godkendte produktillustrationer viser en afledt anvendelse af reglerne. De ændrer ikke familiens normalværdier. Begrebsstudier og beskrivende ord som »teknisk« erstatter heller ikke de centrale referencetegninger. Farvefællesskab alene gør ikke en ny tegning til Tegnets anatomi.

### Observeret i referencekoden

Dette er kildefakta fra de 62 komponentmotiver ved denne gennemgang, ikke en statistisk model, der automatisk godkender nye billeder. Værdier er SVG-enheder i `600 × 420`; de må ikke aflæses som CSS-pixel.

| Egenskab | Faktisk brug og kilde | Betydning for udtrykket |
| --- | --- | --- |
| Primære konturer | `P`, `R` og `O` bruger uændret `var(--g-line-width)`. Temaernes grundværdier ligger aktuelt mellem `1.6` og `2.2`; Studio Light og Kyst bruger `1.8`. [Katalogets hjælpere](../../core/graphics/families/anatomy-catalog.mjs#L2), [tokenstandard](../../core/graphic-tokens.mjs#L31). | Tynd, præcis konstruktion frem for en tung ikonsilhuet. |
| Tekstspor, ledere og mål | `L` bruger `1`; `rows` gentager disse streger, normalt med afstand `23`. `dim` har ende-ticks på `±6`; klammer har `10` i højde. [Hjælpere](../../core/graphics/families/anatomy-catalog.mjs#L6). | Navne, indhold, forbindelser og måleapparat kan læses som forskellige hierarkiske lag. |
| Lokale stærkere streger | Fx feltlabel `2`, tekstmarkør `3`, posttitler `2.5`, knappens handlingsnavn `4`. På tværs af de 62 motiver er `282` synlige stregattributter `1` og `145` bruger materialets grundbredde. Kun `2` er `4`, og én er `7`. [Field](../../core/graphics/families/anatomy-catalog.mjs#L40), [button](../../core/graphics/families/anatomy-catalog.mjs#L89), [list-item](../../core/graphics/families/anatomy-catalog.mjs#L22). | Vægt fremhæver en bestemt betydning; den skalerer ikke alle konturer. `7` er specifikt spinnerens aktivitetsbue, ikke familiens standard. [Spinner](../../core/graphics/families/anatomy-catalog.mjs#L266). |
| Hjørner og afslutninger | Rektangler har normalt ingen `rx`. De to baner i `switch` bruger `rx="28"`, fordi de er kontaktbaner. Paths og line-endepunkter bruger runde samlinger/afslutninger. [Grundformer](../../core/graphics/families/anatomy-catalog.mjs#L3), [switch](../../core/graphics/families/anatomy-catalog.mjs#L81). | Runde stregender betyder ikke afrundede kort, kapsler eller bløde blokke overalt. |
| Pigment og flader | Konturer bruger `ink`; støtteflader bruger især `plane` og `context`. `subject` udpeger en aktuel form, en lille kerne eller en kort accent. De 62 komponentmotiver bruger ikke `counter` eller `depth`, selv om variablerne findes. [Input](../../core/graphics/families/anatomy-catalog.mjs#L27), [inspector](../../core/graphics/families/anatomy-catalog.mjs#L175). | Hele materialepaletten skal ikke forbruges i hvert motiv. Pigment er en prioritering, ikke fyld i alle tomme rum. |
| Størrelse og tomrum | Inputfeltet står i `(125,150)` med mål `350 × 110`; kortet står i `(135,70)` med mål `330 × 290`; dialogens kontekst er `460 × 300` fra `(70,60)`, mens selve dialogen er `300 × 245`. [Input](../../core/graphics/families/anatomy-catalog.mjs#L27), [card](../../core/graphics/families/anatomy-catalog.mjs#L180), [dialog](../../core/graphics/families/anatomy-catalog.mjs#L170). | Motiverne har forskellig udstrækning efter opgaven. Tallene er referencekompositioner, **ikke én fælles sikkerhedsmargin**. |
| Skrift | Faktiske glyphs bruger `ui-monospace,monospace`; kataloghjælperens standard er `20`. Små genvejstaster bruger `19`, talfelt `60`, nøgletal `93` og overskriftens »Aa« `112`. Plakatens tekniske annotationer er `9` med bogstavafstand `1.2`. [Typografihjælper](../../core/graphics/families/anatomy-catalog.mjs#L7), [overskrift](../../core/graphics/families/anatomy-catalog.mjs#L225), [annotationer](../../core/graphics/families/anatomy.mjs#L29). | Typografisk skalaforskel skal forklare en rolle; almindelig tekst vises fortrinsvis som tynde, varierede linjer. |
| Lag | `60` af de `62` motiver har `3–4` semantiske parts. `caption` adskiller billede, forbindelse og tekst; `inspector` adskiller valg, panel, egenskaber og forbindelse. [Caption](../../core/graphics/families/anatomy.mjs#L155), [inspector](../../core/graphics/families/anatomy-catalog.mjs#L175). | Delene følger betydning, ikke en vilkårlig fordeling af lige mange former i hver gruppe. |

Komponentkortets billedvindue er `154` CSS-pixel højt; SVG'en bevarer sit `600 × 420`-koordinatsystem. Kortets ydre ramme og afrunding tilhører præsentationen og er ikke en del af motivets geometri. [Kortets CSS](../../studio/component-catalog.css#L60).

### Normativ startopskrift for nye motiver

Disse regler gør de observerede mønstre til et arbejdsgrundlag for nye opgaver. En undtagelse i ét eksisterende motiv er ikke tilladelse til at ændre standarden for hele familien.

1. **AN-01 · Kontur før masse.** Tegn primært med `ink` på åbent `ground` og enkelte `plane`-/`context`-flader. Brug materialets stregbredde uændret til hovedkonturer. Tilføj ikke gradient, skygge, glød eller generel dybdeforskydning.
2. **AN-02 · Bevar stregens hierarki.** Brug `1` til almindelige tekstspor, ledere, mål og hjælpelinjer. Brug en lokal bredde `2–4`, når der er en navngiven grund, fx titel, indsætningsmarkør eller aktiv kant. Ingen global multiplikation af stregvægten. En bredde over `4` kræver særskilt begrundelse og en relevant undtagelsesreference; spinnerens bue må ikke bruges som normal kontur.
3. **AN-03 · Små mærker, præcise ender.** Start med katalogets `dot` på radius `4`, chevrons omkring `7` og målticks `±6`. Ændr dem kun, hvis tegnets semantiske opgave eller skala kræver det. Lad ledere ramme deres navngivne ankre og rammekanter præcist.
4. **AN-04 · Begrænset pigment.** Vælg ét dominerende semantisk tyngdepunkt. Flere pigmentmærker er tilladt, når de gentager samme relation, fx flere passerede trin. Brug som udgangspunkt ingen `counter` eller `depth`; en ny brug skal forklare en selvstændig opgave og vurderes ved siden af referencepakken.
5. **AN-05 · Tegn tekst som tekstspor.** Brug tynde streger med fælles venstre akse, varierede længder og bevidste linje-/afsnitsafstande. Brug egentlige monospaced glyphs til tal, enheder, initialer og andre tegn, som er nødvendige for betydningen. Erstat ikke almindelige tekstspor med brede, afrundede kapsler.
6. **AN-06 · Lad betydningen bestemme udstrækningen.** Vælg først en reference med samme slags relation. Bevar dens forhold mellem hovedform, støtteindhold og tomrum som udgangspunkt; kopier ikke koordinater blindt. Fyld ikke lærredet alene for at gøre et miniaturebillede mere synligt.
7. **AN-07 · Slutbilledet er facit.** Opdel normalt første udkast i `3–4` meningsfulde parts; brug færre eller flere, når betydningen kræver det. Statisk tilstand skal vise alle nødvendige relationer. Lad en kontur normalt blive registreret før sit eget pigment, men vælg den samlede partorden efter den nærmeste references betydning. Mål eller en klamme kan etablere et fælles felt tidligt, som i `list-item`; reference → kontur → pigment → afsluttende mål er en starteramme, ikke én universel faselov. Animation må ikke efterlade en anden geometri.
8. **AN-08 · Samme geometri ved lille visning.** Vis først den samme SVG i referencens kortstørrelse. Hvis en detalje forsvinder, fjern en underordnet detalje eller vælg en enklere komposition. En særskilt miniaturevariant med tykkere streger er en ny variant, som kræver eksplicit vurdering; den følger ikke automatisk af denne familieprofil.

### Referencepakke og konkrete afvigelser

Vælg de tre referencer efter **G-01**, herunder en enkel og en sammensat reference. Sammenlign i **samme tema, farvetilstand og billedstørrelse**:

- `button`: tynd kontur, koncentreret handlingsaccent og ét mål.
- `field`: label, indtastning og hjælp med hver sin placering og stregvægt.
- `inspector`: en lille udpeget genstand, et større vedvarende panel og en præcis knækleder.
- `caption`: en rolig billedflade og en leder, som slutter direkte i tekstens første linje.
- `spinner`: kontrolreference for en **lokal undtagelse**, hvor den tykke bue betyder aktivitet.

| Anti-eksempel | Hvorfor det skifter stil | Korrektionsretning |
| --- | --- | --- |
| Alle konturer sættes til `calc(var(--g-line-width) * 6)`. | Ved standard `1.8` bliver den generelle kontur `10.8` i stedet for `1.8`; mål og hovedform mister deres vægtforskel. | Brug grundbredden direkte og giv få, navngivne accenter deres egne værdier. |
| Tekst bliver til rektangler med højde `14` og `rx="7"`. | De fremstår som bløde piktogramblokke frem for katalogets fine tekst- og måleapparat. | Brug `L`/`rows` med tynde streger; bevar en reel forskel mellem titel, tekst og hjælp. |
| Et lille forbindelsesanker bliver en farvet cirkel med radius `12–24` uden ny betydning. | Ankeret begynder at konkurrere med den form, forbindelsen skal forklare. | Start ved referencens radius `4`; en større cirkel skal være et selvstændigt motiv, ikke et forstørret hjælpepunkt. |
| Store pigmentfyldte isometriske plader og en ekstra modfarve bruges som almindelig konstruktion. | Motivet begynder at ligne Passages materialemasser. Anatomy kan vise rum, men lader normalt kontur og aktivt tomrum bære det. | Tegn først rumligheden med kontur; begræns fyldet til det udpegede forhold. |
| Billedet vurderes alene eller kun mod en fælles palette. | En tegning kan være pæn og bruge alle korrekte tokens, men stadig have en anden streg, tæthed og visuel rytme. | Vis den ved siden af referencepakken før godkendelse. |

De 11 godkendte anatomy-motiver til Designmønstre ligger i [illustrations-anatomy.mjs](../../patterns/illustrations-anatomy.mjs) og vises gennem [produktets wrapper](../../patterns/illustrations.mjs). `editor` forbinder et indlejret valg med et egenskabspanel; `parameter-workbench` kombinerer fine skydere, tal og en målt 2D-prøve; `recipe-editor` knytter et tværsnit til laglisten. De er anvendelseseksempler på standarden. Brug fortsat komponentmotiverne i referencepakken som primært grundlag ved nyt arbejde.

## Find den rigtige kilde

| Kilde | Ansvar |
| --- | --- |
| [anatomy.mjs](../../core/graphics/families/anatomy.mjs) | Eksporterer `meta` og `draw(motif, {prefix})`. Indeholder de ti oprindelige motiver og sender katalogudvidelser videre til katalogmodulet. |
| [anatomy-catalog.mjs](../../core/graphics/families/anatomy-catalog.mjs) | Katalogets supplerende scener. Eksporterer `drawCatalog`, `CATALOG_IDS`, `CATALOG_ANCHORS` og `CATALOG_MOTION`. |
| [motion/anatomy.mjs](../../core/graphics/motion/anatomy.mjs) | Eksporterer familiens bevægelses-`meta` og `create(svg, motif)`: animationsplan og måleprobe. |
| [primitives.mjs](../../core/graphics/motion/primitives.mjs) | `part`, `track`, `trace` og `parallax`; små hjælpere til eksisterende animationsplaner. |
| [player.mjs](../../core/graphics/motion/player.mjs) | Den fælles afspiller med pause, tidslinje, baglæns afspilning, interaktion, reduceret bevægelse og oprydning. |
| [graphics.mjs](../../core/graphics.mjs) | Offentlig rendering, native SVG-oprettelse, familier, motivmetadata, dele og montering af animation. |
| [graphic-tokens.mjs](../../core/graphic-tokens.mjs) | Grafikfamilier, standardværdier og bindinger mellem lokale SVG-variabler og temaets semantiske tokens. |
| [illustrations-anatomy.mjs](../../patterns/illustrations-anatomy.mjs) | Godkendte, afledte anatomy-kompositioner til Designmønstrenes 11 produktbegreber. |
| [illustrations.mjs](../../patterns/illustrations.mjs) | Produktets fælles native SVG-wrapper for de fire særskilte familiefiler; materialeopløsning, unikke definitioner og semantiske parts. |

Den fælles [authoringguide](../GRAPHICS-AUTHORING.md) beskriver integration og værktøjer på tværs af familierne. Dette dokument forklarer arbejdsmetoden i Tegnets anatomi.

## 1. Skriv motivets betydning før dets former

Start med én sætning om en relation: »En billedtekst hører til dette billede«, »kun én mulighed er valgt« eller »et hus beskytter et rum og giver adgang«. Vælg derefter de mindste tegn, der kan gøre relationen synlig.

For en katalogrolle er bibliotekets navn, beskrivelse og anvendelse i [library.mjs](../../core/library.mjs) grundlaget. Forskellene er konkrete:

- Et tekstinput har en indsætningsmarkør; en lukket native valgliste har en åbnepil.
- En combobox må vise både skrivning og filtrerede muligheder. Flervalg skal kunne vise flere selvstændige værdier.
- En datatabel viser ordnede data. Et redigerbart grid skal kunne skelne markering fra aktiv celle og redigering.
- Ens store felter med en aktuel position kan vise trinvis fremdrift. Stigende søjler læses let som en voksende datamængde.
- En filvælger kan vise en lokal fil og en bakke. En sky er et ekstra løfte om netoverførsel, som rollen ikke indeholder.

En illustration af en rolle er dekorativ produktformidling. Den skal ikke blive en lokal udgave af selve komponenten eller dens interaktionscontroller.

## 2. Tegn i et fælles rum, men lad kompositionen følge indholdet

Familiens scener bruger `viewBox: '0 0 600 420'`. Det giver fælles mål, ikke en skabelon med et obligatorisk kort i midten. En tekst kan være en åben strøm, et ur en cirkel, et træ en forgrening og en dialog en afgrænset flade foran noget andet.

Tegn først den største bærende kontur og dens vigtigste anker. Placér sekundære former efter den. Mellemrum og tyngdepunkt skal fungere, før målelinjer tilføjes.

De eksisterende kilder bruger følgende greb:

1. **Kontur med begrundet vægt.** Bærende konturer følger normalt `--g-line-width`; flere mål og ledere bruger eksplicit én SVG-enhed. Plakatens net bruger `0.7` og `opacity=".25"`. Disse tal er eksempler fra familien, ikke et krav om samme detailgrad i alle motiver.
2. **Få pigmentflader.** `--g-subject` udpeger en betydningsbærende form eller tilstand. Store bagflader kan bruge `--g-plane` eller `--g-context`.
3. **Forbindelser, der faktisk mødes.** En gren rammer sin knude. En billedtekstleder rammer tekstblokkens begyndelse. Højre og venstre side af en symmetrisk komposition har samme afstand.
4. **Mål med en opgave.** En måleklamme kan vise klikflade, interval eller udstrækning. Den skal ikke foregive en fysisk måleenhed eller konstruktionspræcision, som indholdet ikke giver grundlag for.
5. **Aktivt tomrum.** Et hul tegnet med baggrundens farve skal passe til sit reelle underlag. En indre form i `--g-plane` kræver tilsvarende et hul i `--g-plane`, ikke automatisk i `--g-ground`.

Ved små visninger må et hjælpenet gerne udelades. Den bærende kontur, det afgørende tegn og den vigtigste relation skal være læselige alene.

### Temaet giver materialet

| Lokal SVG-variabel | Semantisk token | Arbejde i Tegnets anatomi |
| --- | --- | --- |
| `--g-ground` | `color.illustration.ground` | Hele billedfeltet og åbninger mod det. |
| `--g-plane` | `color.illustration.plane` | Et selvstændigt indre felt eller en kontrolskitse. |
| `--g-ink` | `color.illustration.ink` | Bærende kontur, symbol og vigtig tekst. |
| `--g-subject` | `color.illustration.subject` | Det ene prioriterede tyngdepunkt eller den aktuelle relation. |
| `--g-counter` | `color.illustration.counterpoint` | En begrundet grafisk modstemme. |
| `--g-context` | `color.illustration.context` | Tilbagetrukket masse og sekundære felter. |
| `--g-edge` | `color.illustration.edge` | Sekundære konturer, mål og hjælpespor. |
| `--g-light` | `color.illustration.light` | Lyse detaljer, eksempelvis et flueben i pigment. |
| `--g-depth` | `color.illustration.depth` | Tilgængelig dybdefarve; familien kræver ikke skygger i hvert motiv. |
| `--g-line-width` | `illustration.material.lineWidth` | Den positive bærende stregvægt i SVG-enheder. |
| `--g-depth-opacity` | `illustration.material.depthOpacity` | Fælles parameter for illustrativ dybde, når den faktisk anvendes. |

Brug ikke knapfarver eller UI-statusfarver som skjulte genveje. Temafamilien har allerede dedikerede grafikroller. Kontroller de leverede farvetilstande med samme motiv og samme tilstand; geometri og betydning ændres ikke med paletten.

## 3. Del efter betydning og fremtidig bevægelse

Det offentlige `draw` returnerer `{body, viewBox, label, parts}`. `body` er SVG-indhold uden den ydre `<svg>`. Hver semantisk gruppe får `data-part`, et præfikset ID og metadata med `{key, name, purpose}`.

`caption` er en nyttig reference: `frame` afgrænser billedet, `landscape` er billedmotivet, `connector` binder billedet til teksten, og `caption-lines` er teksten. Det gør det muligt at tegne forbindelsen før teksten uden at flytte selve billedet.

I katalogmodulet oprettes en scene med de private hjælpere `S(label, anchors, parts)` og `part(key, name, purpose, body)`. Det er familiens interne forfatterformat. `drawCatalog(motif, group)` lader hovedmodulet oprette de faktiske grupper og samle metadata.

Vælg nøgler som `doorway`, `shared-bracket` eller `caption-lines`. En nøgle som `path-7` siger ikke, hvad der kan bevæges samlet. Reservér ikke `title` som partkey: den offentlige wrapper bruger `${idPrefix}-title` til sin tilgængelige SVG-titel.

SVG'ens malerækkefølge er også en semantisk beslutning. En senere, opak flade dækker tidligere linjer. Forbindelser skal enten slutte ved en synlig kant eller ligge i et bevidst overliggende lag. Et grid skal fortsat vise sine cellegrænser, når en markering lægges ind.

## 4. Byg en animationsplan, ikke en ny afspiller

Familiens `create(svg, motif)` returnerer `{duration, tracks, interact, destroy}`. Den starter ingen afspilning og har ingen egne timere eller RAF-løkker. Afspilleren monterer planen efter behov og ejer tiden.

En track-record er:

```js
{
  target: element,
  frames: [{ opacity: 0 }, { opacity: 1 }],
  start: 0.25,
  end: 0.55,
  easing: 'cubic-bezier(.2,.7,.2,1)'
}
```

`start` og `end` er brøker af hele forløbet og skal opfylde `0 <= start < end <= 1`. Varigheden styres gennem `duration.illustration` og den fælles controller; familiens fallback er `3200` millisekunder. Bibliotekets UI-bevægelse på 240 ms er en anden rolle.

Hjælperne i `primitives.mjs` er konkrete:

- `part(svg, key)` finder en semantisk gruppe.
- `track(target, frames, start, end, easing)` opretter en record.
- `trace(shape, start, end, {reverse, easing})` bruger `getTotalLength()` og animerer stregens dasharray/dashoffset. Den returnerer `null`, hvis formen ikke kan spores.
- `parallax(target, {x, y})` tilbyder en separat wrapper med `update`/`destroy`. Tegnets anatomi bruger sin måleprobe i stedet for automatisk parallax.

Anatomy-planens private `build` kombinerer gruppens synlighed, konturindtegning, fladereveal og tekst. De oprindelige motiver har særskilte forløb. Katalogudvidelsernes `CATALOG_MOTION` afledes af den semantiske rækkefølge i hver scenes `parts`: grundstart `.025`, forskydning `.145` per del og grundslut `.31`, begrænset til `.96`. `build` forskyder de enkelte former yderligere med `.012` i denne katalogvej. Hvis en ny scene kræver en anden årsagsrækkefølge, skal planen udformes efter den frem for blot at tilføje flere lag til samme forskydning.

### Læs eksisterende koreografi som årsag og virkning

| Motiv | Det konkrete forløb |
| --- | --- |
| `poster` | Nettet etableres; struktur tegnes fra `.12`; tyngdepunkt registreres fra `.58`; mål og labels afslutter. |
| `accordion` | Lukkede rækker tegnes først. Det åbne felt etableres; chevronen drejer fra højre til ned mellem `.19` og `.45`; accentkanten vokser mellem `.28` og `.65`; målet følger. |
| `avatar-group` | Portrætter registreres forskudt. Fælles klamme tegnes mellem `.56` og `.88`; samlingspunktet følger. |
| `progress` | Ens store trin etableres. Den passerede rute tegnes til det aktuelle trin; den ventende strækning og åbne destination kommer bagefter. |
| `caption` | Billede etableres; anker og knækleder tegnes; tekstlinjer følger fra `.76`. |

Alle sidste keyframes skal give den godkendte statiske geometri. Indtegningshjælpere må ikke efterlade en forkert position, en mindre cirkel eller en anden opacitet ved 100 %.

Ved SVG-absolutte transformationsankre skal keyframes bruge `transformBox: 'view-box'`. Accordionens chevron bruger eksempelvis `transformOrigin: '154px 211px'`. Uden en entydig koordinatboks kan en senere `fill-box`-regel flytte dreje- eller skaleringspunktet.

Ringe kræver særlig omhu: den indre, opake åbning bevares, mens pigmentet omkring den vises. Hvis både den ydre og den indre skive fader fra transparent samtidig, bliver ringen midlertidigt til en plet.

## 5. Brug den eksisterende integration

De offentlige funktioner kan importeres fra `core/graphics.mjs` eller geneksporterne i `core/components.mjs`. Eksemplet her er tænkt i et modul ved projektets rod; brug produktets faktiske runtime-sti i et tilknyttet produkt.

```js
import {createGraphicRenderer, mountGraphicMotion} from './core/graphics.mjs';
import {resolveThemeMode} from './core/theme-modes.mjs';

const active = resolveThemeMode(pack, 'light');
const renderer = createGraphicRenderer({
  ...active,
  graphics: {family: 'anatomy'}
});
const svg = renderer.create('caption', {idPrefix: 'article-caption'});
host.replaceChildren(svg);

const motion = mountGraphicMotion(svg, {hintId: 'graphic-hint'});
const replay = () => motion.play();
playButton.addEventListener('click', replay);

// Kald ved genmontering eller afmontering:
function destroy() {
  playButton.removeEventListener('click', replay);
  motion.destroy();
}
```

Der skal findes en læsbar forklaring med ID `graphic-hint`, når den angives. Ved dekoration bruges `renderer.create(motif, {decorative: true, ...})` og `mountGraphicMotion(svg, {interactive: false})`; en omgivende native knap kan starte én gennemgang. Montér ikke en ekstra interaktiv SVG inde i en knap.

En renderer er en frisk, valideret snapshot-lukning med `render` og `create`. Genbrug den til flere motiver fra samme aktuelle tema, og opret en ny efter temaændringer. Det undgår gentagen fuld temavalidering for hvert billede uden en global cache, som kan blive forældet.

Controlleren tilbyder `play()`, `play(true)`, `pause()`, `toggle()`, `seek(0..1)`, `settle()`, `setReduced()`, `setLoop()`, `setInteraction()`, `state` og `destroy()`. `seek` kan desuden gendanne en retning med `{direction: -1}` eller `{direction: 1}`. Brug `toggle` til pause/genoptag; den bevarer en baglæns retning midt i forløbet. `settle` viser originalens slutbillede og fjerner animationsplanens midlertidige hjælpere.

## 6. Interaktion og reduceret bevægelse

Måleproben er en lokal forklaring. `interact({x, y, active})` modtager koordinater fra `-1` til `1`; familiens scene svarer til `px = 300 + x * 300` og `py = 210 + y * 210`. Proben finder det nærmeste deklarerede anker og tegner en diskret knækleder mellem markør og anker. Den får først synlig styrke inden for 160 SVG-enheder og når højst opacitet `.72`.

Ankre skal ligge på et meningsfuldt forhold: et tærskelpunkt, et knudepunkt eller en præcis teksttilknytning. Proben følger ikke automatisk en vilkårlig kurve og måler ikke rigtige fysiske afstande. Vælg derfor ankre bevidst i `CATALOG_ANCHORS` eller den oprindelige motifs ankerliste.

Den fælles afspiller aktiverer først proben ved slutbilledet, når animationen står stille. Piletaster kan styre den fokuserede grafik; Mellemrum afspiller/pauser, og Escape eller Home nulstiller proben. Pointerleave, blur og afmontering nulstiller også interaktionen. Skjult dokument og grafik uden for visningen pauser afspilningen.

`prefers-reduced-motion`, eksplicit reduceret bevægelse og manglende Web Animations-understøttelse giver det statiske slutmotiv. Der skal ikke lægges en alternativ CSS-animation ovenpå. Den statiske illustration skal allerede forklare betydningen. `destroy` fjerner proben, effekter og hændelseslyttere gennem den fælles lifecycle.

## 7. Storyboard: et hus som beskyttet rum og adgang

**Brief:** »Et hus afgrænser et beskyttet rum og har en tydelig adgang.« Formen skal kunne genkendes uden en label og uden bevægelse. Der tegnes ikke en teknisk byggetegning med påståede fysiske mål.

**Statisk konstruktion i 600 × 420:** Terrænlinje fra `(100,330)` til `(500,330)`. Ydervægge fra `(165,165)` til `(435,330)`. Tagryg ved `(300,75)` og tagfod ved `(145,165)`/`(455,165)`. Adgangsåbning fra `(273,225)` til `(327,330)`. To mindre vinduesfelter ved `(195,195)` og `(350,195)`, hver 55 × 45. Tag og vægge mødes præcist ved samme vandrette niveau.

| Del | Betydning og tegnevalg | Foreslået tid |
| --- | --- | --- |
| `site` | Terræn og to små referencer giver huset en base. Brug `edge`. | `0–.16` |
| `shell` | Vægge i `plane`; tagets bærende kontur i `ink`. Undgå en dekorativ ekstra papirstak bag huset. | `.10–.44` |
| `openings` | To rolige vinduer og en reelt åben adgang. Dørens underlag skal skjule vægfladen opakt. | `.38–.70` |
| `entry` | En tynd `subject`-kant ved adgangens side og et punkt ved `(300,330)` prioriterer indgangen. | `.66–.86` |
| `extent` | Ét breddeinterval fra `(165,365)` til `(435,365)` afslutter konstruktionen. Ingen tal eller opfundne meter. | `.78–.96` |

Ved 50 % skal man allerede kunne forstå »hus«, selv om åbningerne endnu registreres. Ved 100 % står alle former stille. Proben kan have ankre ved tagryg, væggenes samling, et vinduescentrum og tærsklen. Den forklarer konstruktionen ved at knytte sig til disse punkter; den skal ikke få hele huset til at vippe.

Den kunstneriske variation ligger eksempelvis i en meget stor åbning eller et overraskende udsnit af tag og væg. Bevar adgangens læsbarhed og det bevidste tyngdepunkt, når proportionerne ændres.

## 8. Storyboard: musik som puls, frase og variation

**Brief:** »Fire hændelser deler en grundpuls; den tredje varierer, og de fire danner én frase.« Det er en musikalsk begrebsillustration. Den foregiver hverken lydafspilning, et bestemt BPM-tal eller et komplet nodesystem.

**Statisk konstruktion:** Fem fine vandrette nodelinjer fra `x=125` til `x=475` ved `y=145,165,185,205,225`. Fire nodeinspirerede hændelser placeres ved `x=165,255,345,435`. De første, anden og fjerde har hoved ved `y=185`; den tredje ved `y=165`. Brug ens størrelse på hoveder og ens stammelængde. Tredje hændelse får `subject`; de andre bærer `ink`. En klamme under systemet samler hele frasen.

| Del | Betydning og tegnevalg | Foreslået tid |
| --- | --- | --- |
| `staff` | Et lavmælt koordinatsystem giver hændelserne en fælles musikalsk plads. | `0–.18` |
| `beat-1` | Første hændelse etablerer grundformen. | `.20–.33` |
| `beat-2` | Samme form og samme tidsafstand gør gentagelsen forståelig. | `.35–.48` |
| `variation` | Tredje hændelse følger grundpulsen, men varierer sin lodrette placering og pigment. | `.50–.63` |
| `beat-4` | Tilbagevenden til grundformen afslutter A–A–B–A-forholdet. | `.65–.78` |
| `phrase` | En fælles klamme og fire ens intervaller samler forløbet. | `.78–.96` |

Tegn stammer og hoveder som dele af samme hændelse, så de ikke løsriver sig under indtegning. Der behøves ingen hop, glød eller pulserende baggrund. En tydelig rytme kan opstå af fire ens tidsafstande og én begrundet variation.

Proben kan snappe til de fire nodehoveder og frasens samlingspunkt. En fremtidig lydfunktion ville kræve en særskilt produktbeslutning med eksplicit brugerinput; illustrationen spiller ingen lyd. Reduceret bevægelse viser allerede forholdet mellem gentagelse og variation.

Hus og musik er her storyboards for nye begrebsmotiver. De er ikke eksisterende katalogrolle-ID'er i `renderGraphic`. Se [den fælles authoringguide](../GRAPHICS-AUTHORING.md), [graphic-lab.mjs](../../tools/graphic-lab.mjs) og [begrebseksemplerne](../../examples/graphics/concepts.mjs) for den aktuelle vej fra udkast til en prøvevisning. Opret ikke en UI-komponentrolle alene for at få et begreb ind i grafikkataloget.

## 9. Fejl, der er værd at lede efter

| Fejl | Konsekvens | Retning for rettelsen |
| --- | --- | --- |
| En leder stopper få enheder før sit anker. | Tilhørsforholdet bliver tvetydigt. | Del koordinater mellem linjeende og anker i stedet for at tilpasse på øjemål. |
| En flade males oven på sin egen forbindelse. | Knuden ser løs ud; en probe kan pege på en usynlig kurve. | Slut ved en synlig kant, vælg bevidst malerækkefølge og kontrollér det reelle overlap. |
| Alle accordion-chevrons peger ned. | Åbne og lukkede tilstande bliver ens. | Højre for lukket; ned for åbent i denne families godkendte motiv. |
| Fremdrift tegnes som stigende søjler. | Et trinforløb ligner en datatrend. | Gentag samme modul og skeln passeret, aktuelt og ventende. |
| Et ur og en digital værdi viser forskellige tider. | Den illustrative forklaring modsiger sig selv. | Afled begge fra samme valgte tidspunkt. |
| SVG-absolut origin kombineres med `fill-box`. | Skalering eller rotation sker om et forkert punkt. | Angiv `transformBox: 'view-box'` med de absolutte koordinater. |
| Hele ringen fader som to transparente skiver. | Hullet bliver midlertidigt en farvet plet. | Bevar åbningen opak, og vis pigmentet separat. |
| Dele får faste, delte ID'er eller partkey `title`. | Flere motiver kan ramme hinandens referencer. | Præfiks alle egne ID'er og undgå wrapperens titel-ID. |
| Hvert motiv løser og validerer samme tema igen. | Et større katalog bliver unødigt langsomt. | Genbrug én frisk `createGraphicRenderer` til den aktuelle batch. |

## 10. En lille praktisk kontrol og et nyttigt værktøj

Se først slutbilledet i stor og lille størrelse, i de farvetilstande der leveres. Stop derefter ved 0, 25, 50, 75 og 100 %. Prøv baglæns, pause/genoptag og reduceret bevægelse. Kontrollér, at der ikke efterlades hjælpere efter afmontering. En korrekt wrapper og gyldige tracks erstatter ikke denne visuelle vurdering.

Et minimalt forfatterværktøj bør vise fire ting ved siden af hinanden: det statiske motiv, en liste over `data-part` og deres betydning, de faktiske ankerkoordinater og den fælles tidslinje. Det bør kunne vise en valgt del alene og advare om dobbelte ID'er, manglende dele og ugyldige tidsintervaller. Brug de eksisterende renderer- og playerfunktioner til preview.

For Tegnets anatomi er den vigtigste ekstra funktion et synligt ankerlag, som kan slås til: en agent skal kunne se, om en leder faktisk ender ved sit punkt. Det er mere nyttigt end endnu en effektvælger. Værktøjet skal hjælpe med at bedømme komposition og sammenhæng; den kunstneriske beslutning bliver hos forfatteren.
