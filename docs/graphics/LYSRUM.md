# Lysrum — lys, åbninger og rolig afsløring

Denne guide samler Agent 2's metode til Lysrum. Stilen kan illustrere både konkrete ting og abstrakte forhold: En åbning giver adgang, et overlap viser fællesskab, og et lysfelt angiver opmærksomhed. Animationen skal gøre netop det forhold lettere at se.

## Stilreference og præcisionsniveau

Følg det fælles [referencehierarki](../GRAPHICS-AUTHORING.md#stilkontrakt-og-referencehierarki) og den maskinlæsbare [stilkontrakt](style-contract.json). Komponentkortenes eksisterende motiver er den primære billedreference. [Mønstersidens Lysrum-illustrationer](../../patterns/illustrations-lightroom.mjs) er godkendt afledt produktgrafik; deres kompositioner fastlægger ikke nye normalværdier for familien. Begrebsstudier, storyboards og øvrige nye illustrationer vurderes fortsat mod komponentreferencen. Samme tokenfarver og en genkendelig niche er ikke i sig selv tilstrækkelig stiloverensstemmelse.

**Kodefakta:** [renderCatalogArtwork](../../studio/catalog-artwork.mjs) bruger familiens SVG direkte. Kortets billedfelt er 154 CSS-px højt i [component-catalog.css](../../studio/component-catalog.css); selve tegningen er fortsat 600 × 420. Der sker ingen automatisk ikonforenkling eller stregfortykkelse. Tallene nedenfor er SVG-enheder, medmindre andet er angivet.

### Dokumenteret referenceprofil

Tabellen beskriver de eksisterende tegninger og deres materialeopskrifter. Den er ikke en regel om, at alle motiver skal indeholde samtlige effekter.

| Egenskab | Faktisk reference | Kilde og afgrænsning |
| --- | --- | --- |
| Bærende kontur | `edge`, `--g-line-width`; tokenets standard er `1.8`. Stregender og samlinger er runde. | `stroke`, `outline` og `ring` i [lightroom-catalog.mjs](../../core/graphics/families/lightroom-catalog.mjs); [tokenstandarder](../../core/graphic-tokens.mjs). `ink` er forbeholdt tydeligere indhold og symboler, ikke alle rumkanter. |
| Sekundære spor | Eksempelvis `1–1.7`, undertiden opacity `.4–.65`. | `time-picker`, `textarea`, `field`, `inspector` og `scroll-area`. Dette er observerede vægte, ikke obligatoriske grænser for enhver figur. |
| Tekst og symboler | Almindelige tekstspor ofte `2–3`; titler `3–4`. Chevron `2`, plus `2.5`, kryds `1.8`, almindeligt flueben `3`. | Hjælperne `lines`, `check`, `cross`, `chevron` og `plus`. Motivets vægthierarki er vigtigere end et enkelt universelt tal. |
| Løftet flade, `ledge` | Aftryk ved `(x+4,y+7)`; ydre væggradient; indre `plane` med 10-enheds inset; fin `edge`-kontur; øvre lyskant på `1.8`. Standardradius `7`, indre radius `max(2,r−4)`. | `ledge(prefix,x,y,w,h,r)` i katalogmodulet. De oprindelige motiver har desuden individuelt konstruerede rammer. |
| Indfældning, `well` | Ydre `context`, indre `ground` med 7-enheds inset, `edge`-kontur og en afgrænset indre skygge. Standardradius `5`, indre `max(1,r−3)`. | `well(x,y,w,h,r)` i katalogmodulet. En tilfældig mørk plade bag et lyst rektangel er ikke samme materialeopbygning. |
| Materialedybde | `depth` dæmpes med `--g-depth-opacity`; tokenets standard er `.12`. | `shade` i katalogmodulet og `depth` i [lightroom.mjs](../../core/graphics/families/lightroom.mjs). Temaet kan levere en anden styrke; brug den opløste værdi. |
| Væglys | Lineær gradient fra `light` til `context`, `(0,0) → (1,1)` i objektets egen boks. | `material`/`materials`. Lyset og den lille forskydning nedad/højre giver fladen retning. |
| Koncentreret lys | Radialgradient: centrum `.45,.38`, radius `.7`, stop `light@0`, `subject@.68`, `counter@1`. | `material`/`materials`. Eksempelvis `card` og principposten `focus`; en radialglød er ikke påkrævet i alle motiver. |
| Hjørner | Rektangulære paneler har ofte små radier, fx `5–11`; oprindelige billedrum også `1–6`. Knapper, piller, kædeled og kontakter har begrundet større kurver. | Sammenlign `input`, `card`, `button`, `link` og `switch`. Radius følger genstandens anatomi, ikke ordet »mild«. |
| Ægte tekst | Arial/sans-serif; størrelsen følger opgaven, fx `NOV` på `24`, tidsværdi på `28`, store tal på `76/79` og overskriftens `Aa` på `111`. | `writing`, `date-picker`, `time-picker`, `number-input`, `metric-row` og `heading`. Ingen af disse størrelser er en fælles standard for al tekst. |

Hold følgende fem referencer ved siden af arbejdet:

| Motiv | Det, der skal genbruges som princip |
| --- | --- |
| `input` i [katalogmodulet](../../core/graphics/families/lightroom-catalog.mjs) | Ét aflangt, indfældet rum; et tekstspor og en fin markør; en lav lyskant. Konturens lethed og materialets inset er vigtigere end de konkrete koordinater. |
| `card` i katalogmodulet | En løftet samlet flade med tydeligt forskellige header-, billed-, tekst- og handlingszoner. Det lille lysfelt er afgrænset inden i billedet. |
| `inspector` i katalogmodulet | Et objekt, en præcis forbindelse og et højt panel. Formen følger relationen; hele kompositionen pakkes ikke i en ekstra niche. |
| `image` i [hovedmodulet](../../core/graphics/families/lightroom.mjs) | Fin ramme, skyggens lille forskydning, klippet himmelgradient, lyskilde og bølgende terrænplaner. Landskabet er særskilt Lysrum-geometri. |
| `spinner` i katalogmodulet | En bevidst undtagelse: 12-enheds pigmentbane er selve kredsløbet. Omkring den bruges stadig fine ringkonturer. Den tykke bane er ikke familiens generelle konturvægt. |

Motivernes udstrækning varierer med deres betydning: `card` har hovedflade x131–469/y61–363, `input` x111–489/y158–262, og `data-table` x83–517/y77–343. Tallene dokumenterer forskellig silhuet og luft omkring indholdet; de fastlægger ikke én obligatorisk midterboks.

### Forfatterkrav til nye Lysrum-motiver

Følgende er arbejdsregler for nye tegninger, afledt af ovenstående referenceprofil. De er ikke en påstand om nye automatiske runtimekontroller.

1. **Vælg reference før geometri.** Navngiv mindst tre relevante registrerede komponentmotiver efter G-01, og angiv, hvilket form-, materiale- eller forbindelsesprincip der genbruges. Et nyt begreb må have sin egen silhuet.
2. **Konstruér materialet sammenhængende.** Brug enten en løftet flade, en indfældning eller en særskilt begrundet konstruktion. Bevar forholdet mellem yderkant, indre inset, lyskant og dæmpet dybde. Benyt de dokumenterede opskrifter som startpunkt; deres private kodehjælpere er ikke offentlige produktimports.
3. **Bevar vægthierarkiet.** Begynd med tokenkonturen, fine hjælpespor og differentierede tekstspor. En tykkere streg skal tegne en konkret genstand eller fremhævelse. Den må ikke være en generel skalafaktor på hele familien.
4. **Brug lys selektivt.** Lad en kant, en åbning eller et indre felt bære lyset. Brug væg- eller glødgradient, når materialet eller hovedsagen kræver den; tilføj ikke en glød som obligatorisk stilbadge. En skygge bruger dybdetokenets opacitet.
5. **Lad kurver og mellemrum følge indholdet.** Bevar rolige tomrum og præcise samlinger. Vælg radius ud fra genstanden. Gør ikke alle plader store og rundt afsluttede, og overtag ikke hjørneværdier fra produktets kort-CSS som SVG-geometri.
6. **Vurdér ved samme skala.** Sammenlign nyt motiv og referencer i samme tema, farvetilstand og billedhøjde på 154 CSS-px samt ved 600 × 420. Ved behov for en mindre visning fjernes sekundære detaljer først. En særlig ikonfortolkning kræver en særskilt vurdering og er ikke automatisk en godkendt Lysrum-illustration.

### Afvigelser, som skal opdages ved review

| Fristende genvej | Hvorfor den ændrer stilen | Retning for rettelsen |
| --- | --- | --- |
| Alle konturer får `6 × --g-line-width`, fordi motivet skal vises småt. | Standardens `1.8` bliver `10.8`; ved kortets billedhøjde ændres ca. `0.66` CSS-px til `3.96` CSS-px. En materialetegning bliver en kraftig ikontegning. | Bevar grundkonturen, og forenkle sekundært indhold. Begrund lokale tykke elementer særskilt. |
| Alle tekstspor bliver 14-enheds, afrundede massive piller. | Titler, løbende tekst, hjælp og markører mister deres vægtforskel og begynder at ligne kontroller. | Brug referencehierarkiet af fine tekststreger og tydeligere titler. Massive felter bruges, når de faktisk repræsenterer fx reserveret indhold i `skeleton`. |
| Opak `depth` males som et ekstra mørkt indre plan. | Temaets dybdestyrke ignoreres, og skyggen bliver en konkurrerende masse. | Brug `depth` med `--g-depth-opacity`; adskil reelt bagmateriale fra skygge. |
| Samme radius `22` og samme store bagplade gives til alle motiver. | Motiverne får en ny fælles silhuet, selvom referencen varierer mellem papir, panel, niche, pille og cirkel. | Bevar den semantiske geometri; en stor radius kan være rigtig for en bestemt genstand. |
| Samme kantede bjergsymbol genbruges i alle fire familier. | Farverne kan følge temaet, men Lysrums billedrum, lysretning og bølgende terræn forsvinder. | Tegn Lysrums egen komposition med de relevante materiale- og landskabsprincipper. |

## Begynd med en relation

Skriv én sætning, før du tegner: »Lyset viser et beboet rum«, »tre personer deler samme rum« eller »en åbning afslører indhold«. Begynd med få bærende relationer og tilføj kun de former, som forklarer dem. Der er ikke et fast maksimum på tre former; et egenskabspanel kræver mere indhold end en enkelt kontrol. Et motiv bliver ikke mere Lysrum af flere rammer, skygger eller gradienter.

Lysrums kendetegn er:

- En stabil ramme, niche eller anden tydelig afgrænsning.
- Et roligt indre med én primær lys- eller materialeflade.
- Dybde fra sammenhængende kanter og beskedne forskydninger.
- Et afsluttet bevægelsesforløb, hvor detaljen bliver forståelig gennem afsløring.
- En diskret reaktion på markøren, som påvirker lys eller materialedybde uden at opløse konstruktionen.

En ramme skal have en opgave. Er konceptet musik, kan den være instrumentets krop, en resonanskasse eller et fælles rum for rytme. En dekorativ billedramme omkring en node er en svagere oversættelse.

## Tegn en færdig, statisk komposition først

Den fælles tegneflade er `600 × 420` med `viewBox="0 0 600 420"`. Udgangspunktet skal være den færdige illustration. Der må ikke ligge skjulte oplysninger, som kun bliver læselige efter afspilning. Monteringen af animationen lader denne slutkomposition stå urørt, indtil nogen afspiller eller interagerer.

Del geometrien i meningsfulde SVG-grupper med `data-part`. Et lag hedder eksempelvis `recess`, `light-field` eller `sill`, fordi det har en funktion. Det skal være muligt at forklare, hvorfor laget findes, uden at tale om animation.

I [lightroom.mjs](../../core/graphics/families/lightroom.mjs) returnerer `draw(motif, {prefix})` en scene med `body`, `viewBox`, `label` og `parts`. Hvert element i `parts` har `key`, `name` og `purpose`. Den tilsvarende SVG-gruppe har samme `data-part`-nøgle. De supplerende komponentmotiver ligger i [lightroom-catalog.mjs](../../core/graphics/families/lightroom-catalog.mjs).

Hold lysretningen konsekvent. De eksisterende materialer bruger en lysere øvre/venstre kant og en diskret højre/nedre dybde. Dybde må ikke være den eneste måde at skelne foran fra bagved: Lad også kontur, overlap og forkant vise forholdet. Begræns bløde lysfelter med en egentlig silhuet eller et `clipPath`.

Brug motivets eget `prefix` i alle gradient- og clip-id'er. Gentagne motiver på samme side må aldrig dele definitioner ved et uheld.

## Brug illustrationens farver

Geometrien bruger variablerne fra [graphic-tokens.mjs](../../core/graphic-tokens.mjs). De er illustrationens materialer; de betyder ikke knap, fejl eller valgt UI-tilstand.

| SVG-variabel | Opgave i Lysrum |
| --- | --- |
| `--g-ground` | Motivets rolige billedfelt. |
| `--g-plane` | En selvstændig flade eller et lyst indre. |
| `--g-context` | Den tilbagetrukne ramme eller sekundære masse. |
| `--g-subject` | Hovedmotivets farvevægt. |
| `--g-counter` | En begrænset modstemme, også i gradienter. |
| `--g-light` | Lyskant, lyskilde eller oplyst detalje. |
| `--g-edge`, `--g-ink` | Samling og bærende kontur/symbol. |
| `--g-depth`, `--g-depth-opacity` | Afgrænset materialedybde. |
| `--g-line-width` | Den fælles illustrative stregvægt. |

Giv ikke Lysrum en fast lilla palet. Det milde udtryk kommer fra prioritering, flader og lysretning. Et mørkt tema skal stadig have et aflæseligt rum uden en hvid glød, der overstråler hele motivet. Kontrollér de farvetilstande, som temaet faktisk leverer.

## Animationens grammatik

Lysrum handler om, at et rum bliver nærværende. Brug en opbygning med overlappende faser: Rummet bliver tydeligt, lyset ankommer, og en lille betydningsbærende detalje afslutter forløbet. Flyt kun det, der har en forståelig fysisk eller grafisk grund til at flytte sig.

Et eksisterende eksempel er `focus` i [motion/lightroom.mjs](../../core/graphics/motion/lightroom.mjs):

| Del | Interval af hele forløbet | Handling |
| --- | --- | --- |
| `recess` | `0–.40` | Nichen går fra opacitet `.70` til `1`. |
| `depth` | `.10–.60` | Den indre dybde går fra `.35` til `1`. |
| `light-field` | `.16–.82` | Lyset går fra `.06` og skala `.92` til den færdige form. |
| `sill` | `.34–.76` | Forkanten går fra `.30` til `1`. |

Tiderne er andele, ikke sekunder. Den fælles standard er `duration.illustration: 3200ms`, og afspilleren kan få en eksplicit varighed. Lysrums forløb bruger især `cubic-bezier(.22,.68,.28,1)` og `cubic-bezier(.18,.68,.24,1)`. De giver en rolig ankomst uden hop eller elastisk eftersving.

Brug omtrent `4–9` SVG-enheders forskydning eller en skala nær `1` som udgangspunkt for en afsløring. Det er retningslinjer fra de eksisterende motiver, ikke et krav om bevægelse på alle lag. I principposterens åbning animeres selve lysformen inde i den faste clipping; åbningen glider ikke rundt.

En streg må kun tegnes, når tegningen støtter betydningen. Lysrum behøver ikke optegne enhver kontur som en teknisk konstruktion. Et flueben, en kort forbindelse eller en afsluttende rute er oplagte streger; en stor ramme kan ofte blot blive tydelig.

## Den eksisterende kodevej

Mønstersidens statiske produktgrafik ligger i [illustrations-lightroom.mjs](../../patterns/illustrations-lightroom.mjs). Dens `draw(id, {prefix})` returnerer `label`, semantiske `parts` med SVG-deskriptorer og en liste `definitions` til gradienter og clips. [createPatternIllustrator](../../patterns/illustrations.mjs) samler dem som native inline-SVG med temabindinger og unikke præfikser; [illustrations-primitives.mjs](../../patterns/illustrations-primitives.mjs) leverer de fælles deskriptorhjælpere. Mønstrene er ikke registrerede komponentmotiver og monterer ingen animationsafspiller.

Brug de offentlige funktioner fra [core/graphics.mjs](../../core/graphics.mjs) til at skabe og montere et eksisterende motiv. Eksemplet forudsætter et gyldigt tema og en eksisterende DOM-container:

```js
import {createGraphicRenderer, mountGraphicMotion} from './core/graphics.mjs';

const renderer = createGraphicRenderer(theme);
const svg = renderer.create('focus', {
  family: 'lightroom',
  idPrefix: 'listening-room',
  document: container.ownerDocument
});
container.append(svg);

const motion = mountGraphicMotion(svg, {interactive: true});
const replay = () => motion.play();
svg.addEventListener('pointerenter', replay);
svg.addEventListener('focus', replay);

// Ved afmontering:
function destroy() {
  svg.removeEventListener('pointerenter', replay);
  svg.removeEventListener('focus', replay);
  motion.destroy();
  svg.remove();
}
```

`mountGraphicMotion` starter ikke automatisk på hover; den produktkode, der ejer udløseren, forbinder `play()`. Afspilleren håndterer den indbyggede markør- og tastaturinteraktion, når `interactive` er sand. Den understøtter blandt andet `pause()`, `seek(0.5)`, `play(true)` baglæns, `settle()`, `setReduced(true)`, `setLoop(true)` og `destroy()`. Et loop har en fælles slutpause på `650ms`; brug ikke loop som standard for stemningsgrafik.

Selve stilmodulet eksporterer `create(svg, motif)`. Det beskriver en plan med `tracks`, `interact(...)` og `destroy()`. Det starter ingen selvstændig tidsløkke. Hjælperne i [primitives.mjs](../../core/graphics/motion/primitives.mjs) er:

```js
part(svg, 'light-field');
track(target, frames, start, end, easing);
trace(path, start, end, {reverse: false, easing});
parallax(target, {x: 2, y: 1});
```

Hvert animationsspor skal have et mål inde i SVG'en og `0 <= start < end <= 1`. `trace` kan returnere `null`, hvis kurven ikke har en positiv, målelig længde. Sporene filtreres for tomme værdier, før de bruges. `parallax` returnerer en hjælper med `update({x,y,active})` og `destroy()`; den flytter et omslag omkring formen, så markørbevægelse ikke overskriver afspilningens egen `transform`.

### Katalogets forkortede deklarationer

De supplerende Lysrum-motiver markerer grupper med `data-lightroom-motion` og eventuelt `data-lightroom-origin="300 210"`. `rise`, `slide`, `turn`, `light` og `draw` omsættes af stilmodulet til bestemte afsløringer. `draw` tegner underliggende `path`-elementer med `fill="none"` og en `stroke`. Andre former bliver ikke automatisk optegnet. En `turn` er en begrænset indledende drejning fra `-18deg` til slutstillingen; den er ikke en vedvarende rotation.

Dette er interne tegneregler for det registrerede katalog. Renderer og afspiller validerer normalt motiv-id'er. Et nyt id som `house` eller `music` bliver ikke understøttet ved blot at sætte attributterne på en vilkårlig SVG. Authoring-indgangen bruger en eksplicit, betroet `createPlan(svg, motif)`-factory til den fælles afspiller; den registrerer ikke automatisk motivet i Design Studios katalog. Se den [fælles authoring-guide](../GRAPHICS-AUTHORING.md).

## Interaktion og reduceret bevægelse

Lad et færdigt motiv reagere på opmærksomhed. Det eksisterende lysfelt kan flytte gradientens centrum få hundrededele og lampen få SVG-enheder. Rammen skal fortsat føles som det faste holdepunkt. Sammenhørende dele skal flyttes ens: Et flueben må ikke glide væk fra sit valgte felt, og et overlap må ikke holde op med at være et overlap.

Afspilleren tillader først markørreaktionen, når forløbet er færdigt og standset. Med tastatur kan mellemrum afspille/pause, piletaster påvirke den interaktive stilling, og Home eller Escape nulstille reaktionen. Et interaktivt motiv skal have en forståelig beskrivelse og en synlig fokusmarkering i produktets CSS.

Ved systemets reducerede bevægelse, `setReduced(true)` eller manglende Web Animations-understøttelse viser afspilleren den færdige komposition og deaktiverer den bevægelige reaktion. Kod ikke en anden skjult animationsvej uden om dette. Gendan ændrede gradientattributter og fjern hjælpelag i `destroy()`; det gør Lysrums eksisterende modul allerede.

Illustrationer af kontroller er ikke selve kontrollerne. Et tegnet flueben ændrer ikke et valg, og et animeret musikmotiv starter ikke lyd. Virkelig betjening og tilstande ejes af produktets native kontroller og fælles controllere.

## Storyboard: hus

Dette er en opskrift til et nyt motiv, ikke et allerede registreret motiv-id.

**Betydning:** Et beskyttet rum er beboet, fordi lyset er tændt indenfor. Silhuetten skal kunne genkendes som et hus uden animation og uden en forklarende overskrift.

| Lag | Statisk form | Bevægelse |
| --- | --- | --- |
| `shelter` | Samlet tag og væg med klar hus-silhuet. | Afstem materialet fra `.7` til `1` i `0–.40`; ingen vippende tagflader. |
| `window-recess` | Ét tydeligt vindue med karm og dybde. | Afslør indsnittet i `.10–.55`; hold karmen i ro. |
| `interior-light` | Afgrænset lysfelt bag vinduets faste clip. | Fra svagt lys og skala `.96` til slutformen i `.20–.80`. |
| `threshold` | Dør og én lys forkant ved tærsklen. | Afslør forkanten i `.45–.90`, efter at rummet kan læses. |

Afslut med huset helt stille. Markørreaktionen kan flytte lysfeltet højst et par SVG-enheder inde i vinduet. Vindue, karm og væg skal bevare deres samlinger. Undlad at få døren til at åbne, medmindre betydningen faktisk er adgang frem for hjem eller beboelse.

## Storyboard: musik

Dette er også en ny opskrift. Vælg, hvad »musik« betyder i motivet: lyd, rytme, samspil eller et bestemt instrument. Et stigende søjlediagram bliver let læst som data eller lydstyrke og er derfor ikke et neutralt synonym for musik.

**Betydning:** Gentagelse og forskel danner en fælles frase. Tegn en lav resonanskasse med fire ligeværdige, smalle lysåbninger. En enkel, tydelig nodesilhuet over åbningerne gør begrebet genkendeligt; åbningerne viser frasens rytme.

| Lag | Statisk form | Bevægelse |
| --- | --- | --- |
| `resonance-room` | Ét stabilt fælles rum under de fire åbninger. | Materialet bliver tydeligt i `0–.35`. |
| `phrase-sign` | Én node eller to forbundne noder med klare stammer. | Nodeformen afsløres i `.12–.50`; undgå at en flyvende prik kortvarigt ligner en anden betydning. |
| `beats` | Fire åbninger med samme ydre størrelse og velovervejede mellemrum. | Lys ankommer forskudt fra ca. `.20` til `.85`; hver åbning ender i samme rolige slutstilling. |
| `shared-edge` | En ubrudt lyskant samler modulerne. | Kanten bliver tydelig i `.50–.92`. |

Lad frasen afslutte frem for at køre som en uendelig equalizer. En markør kan forskyde et fælles gradientlys en smule på tværs; den må ikke tilfældigt ændre nodernes antal eller placering. Hvis motivet kobles til rigtig lyd, skal synkroniseringen bygge på produktets faktiske afspilning, ikke på et illustrativt løfte om en målt bølgeform.

## Kunstnerisk UI og et nyttigt agentværktøj

Lysrum kan blive mere eksperimentelt ved at lade indhold fremtræde gennem nicher eller lade en komposition reagere på læserens opmærksomhed. Bevar læsbar tekst på en stabil flade, faste klikmål, synligt fokus og en klar hviletilstand. Kunstnerisk bevægelse må ikke være den eneste vej til information eller betjening.

Brug [den fælles authoring-guide](../GRAPHICS-AUTHORING.md) til `tools/graphic-lab.mjs` og konceptstudierne i `examples/graphics/concepts.mjs`. Denne vej giver plads til nye motiver uden at udskifte den fælles afspillers timing, oprydning og reducerede bevægelse. Storyboardene ovenfor er en metode til at udforme konceptet, ikke en garanti for, at de konkrete eksempelstudier har præcis disse lag eller tidsintervaller.

For et authoring-værktøj er de nyttigste oplysninger motivets betydning, lag, tokenroller og tidsintervaller sammen med en lokal prøvevisning. Kontroller for tema, farvetilstand, afspilning, tidslinje og reduceret bevægelse gør det lettere at bedømme resultatet. Eventuelle udvidelser bør prioritere manglende animationsmål, overlappende id'er og ulovlige tidsintervaller frem for mange tilfældige dekorationsparametre.

Det afgørende er en gennemsigtig oversættelse: Betydning → komposition → navngivne lag → begrundet bevægelse. En agent skal stadig vælge metaforen og bedømme resultatet. Værktøjet kan gøre udførelsen mere ensartet og nemmere at afprøve; en emneknap alene sikrer ikke en god illustration.

## Gennemgå før aflevering

- Kan motivet forstås i slutstillingen uden animation og uden farvenavne?
- Har rammen, lyset og de bevægelige lag hver sin konkrete opgave?
- Forbliver clips, overlap, samlinger og markører korrekte ved begyndelse, midte og afslutning?
- Føles lysretning og materialer sammenhængende i de relevante temaer?
- Er hover, tastatur, reduceret bevægelse og afmontering koblet til den fælles afspiller?
- Ender forløbet i ro med samme geometri som den oprindelige illustration?
