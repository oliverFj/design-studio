# Start en opgave med Stade

Læs projektets egne anvisninger. Kald `get_onboarding({projectId, tasks})` med det registrerede projekt-id. Brug `stade` for arbejde i Stade eller ved produktstart fra Stade. Vælg alle de opgavetyper, der ændrer krav eller kontrol. Ved almindelige opslag kan `tasks` være tom. En valgfri kort `query` kan finde en konkret rolle, et mønster eller et API.

Brug samme afsnit lokalt, hvis opslaget er utilgængeligt. Start med projektets driftsform og vælg derefter de relevante opgavetyper. Der er ingen grund til at læse hele kataloget eller gentage opslag for samme opgavegrundlag.

Vælg kun `small-fix` for en afgrænset, reversibel rettelse. De mere specifikke kontroller gælder, når arbejdet fx omfatter et nyt brugerforløb eller ændrer et filformat.

| Opgavetype | Afsnit |
| --- | --- |
| `small-fix` | [Lille produktrettelse](#lille-produktrettelse) |
| `new-product` | [Nyt produkt](#nyt-produkt) |
| `new-screen` | [Ny skærm](#ny-skærm) |
| `theme` | [Tema og design](#tema-og-design) |
| `interaction` | [Interaktion](#interaktion) |
| `project-files` | [Projektfiler](#projektfiler) |
| `shared-system` | [Fælles bibliotek og værktøjer](#fælles-bibliotek-og-værktøjer) |
| `shared-pattern` | [Fælles mønstre](#fælles-mønstre) |
| `graphics` | [Grafik og animation](#grafik-og-animation) |
| `delivery` | [Levering](#levering) |
| `website` | [Hjemmeside](#hjemmeside) |
| `product-media` | [Produktmedier](#produktmedier) |

## Stade

`core/library.mjs` ejer roller, dele, layout, varianter, tilstande og previews. `core/components.mjs` leverer markup, native DOM og fælles interaktionshjælpere. Bevar framework-uafhængigheden, og genbrug en eksisterende rolle før en fælles udvidelse.

## Offlineprodukt

Brug de faktiske stier og temaet i `design-studio.project.json`. Lever produktets enkeltstående `index.html`. Byg efter kode-, tema- og ressourceændringer. Redigér kildefilerne og brug `sync` før build, når tema eller fælles runtime ændres. Produktet ejer indhold, navigation, data og skærmkomposition. [Byg og opdatér](AGENT-WORKFLOW.md#byg-og-opdatér)

## Eksisterende produkt

Bevar produktets arkitektur, brand og byggeopsætning. Brug faktiske stier og adaptere i `design-studio.project.json`. Byg produktet med dets etablerede kommando efter kode-, tema- og ressourceændringer. Brug `sync` før produktets build ved ændringer i tema eller fælles runtime. [Byg og opdatér](AGENT-WORKFLOW.md#byg-og-opdatér)

## Produkt uden designtilknytning

Følg produktets egne anvisninger og etablerede build. Når opgaven omfatter at tilknytte et eksisterende produkt, bruges `init --design-only`. [Start eller fortsæt et produkt](AGENT-WORKFLOW.md#start-eller-fortsæt-et-produkt)

## Lille produktrettelse

Find den berørte rolle og genbrug eksisterende markup, tokens og interaktion. [Brug de faktiske komponenter](INTEGRATION.md#brug-de-faktiske-komponenter)

**Kontrol.** Højst én hurtig relevant kontrol ud over det påkrævede build efter kode- eller ressourceændringer. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Nyt produkt

Opret produktet med `node tools/cli.mjs init PROJECT_DIR --theme THEME_ID`. Standardleverancen er én offline `index.html`, der åbnes direkte uden server eller runtime. En anden driftsform kræver et udtrykkeligt brugerkrav eller konkret nødvendig funktionalitet. [Start eller fortsæt et produkt](AGENT-WORKFLOW.md#start-eller-fortsæt-et-produkt)

**Kontrol.** Byg, kontrollér offlinepakningen, og afprøv produktet i browseren. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Ny skærm

Genbrug komponenter og relevante mønstre. Vælg bredde efter indhold, og lad produktet eje kolonner og placering. [Vælg og sammensæt](AGENT-WORKFLOW.md#vælg-og-sammensæt) · [Breddeprofiler](INTEGRATION.md#fælles-breddeprofiler)

**Kontrol.** Afprøv normaltilstand og relevante fejl-, tom- og randtilstande i browseren. Kontrollér tastatur, fokus og smal visning omkring 320 CSS-px. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Tema og design

Format 2 ejer tokens, afgrænset appearance, brand og historik. Brug positive semantiske afstandstokens til tæthed. Struktur, layout og fokusmekanik hører til komponenten eller produktet. Brug godkendte brandaktiver, proportioner og licenser. [Designprincipper](DESIGN-PRINCIPLES.md#03-tokens-fastholder-beslutninger) · [Temaformat](PACKAGE-FORMAT.md#appearance) · [Brand](INTEGRATION.md#brand)

**Kontrol.** Kontrollér de leverede farvetilstande. Nye temaer og væsentlige visuelle ændringer kræver browserkontrol. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Interaktion

Bevar native controls, labels, hjælp, fejl og tilgængelige navne. Brug fælles controller ved kompleks adfærd. Ved modal dialog bruges `showModal()` eller den etablerede tilgængelige adapter. Bevar kladder, fejl og valg ved genmontering. [Controlleroversigt](INTEGRATION.md#vælg-controller) · [Forbind den faktiske adfærd](AGENT-WORKFLOW.md#forbind-den-faktiske-adfærd)

**Kontrol.** Afprøv berørt adfærd, tastatur, fokus og de relevante kladde- og fejltilstande. Væsentlige interaktionsændringer kræver browserkontrol. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Projektfiler

Brug `createProjectFile` med produktets format-id, version og validering. Filvælger og download er standarden. Annullerede og ugyldige åbninger bevarer tilstanden. Downloads overskriver ikke originalen automatisk. Brugeren gemmer udvekslelige projektfiler via filfunktionen. [Projektfilkontrakten](INTEGRATION.md#fælles-projektfiler)

**Kontrol.** Afprøv gemning, genåbning og afvisning uden datatab. Følg den særskilte filkontrol ved ændret filhåndtering. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Fælles bibliotek og værktøjer

Ændr den fælles kilde og bevar de berørte kontrakter. Find den ansvarlige rolle, controller eller kommando, og synkronisér produkter, der skal have ændringen. [Udvidelsesregler](DESIGN-FOUNDATIONS.md#når-en-agent-udvider-biblioteket)

**Kontrol.** Kør testfilerne for de berørte roller, controllere eller værktøjer. Genbyg berørt output. Brug den fulde pakke ved udgivelse og brede ændringer. [Systemkontrol](AGENT-WORKFLOW.md#når-selve-systemet-ændres)

## Fælles mønstre

Undersøg eksisterende mønstre og referenceprodukter før en fælles udvidelse. Bevar produktets egne tilpasninger. [Produktmønstre](PRODUCT-PATTERNS.md#sådan-indføres-en-fælles-løsning)

**Kontrol.** Kør `npm run test:patterns` eller de berørte mønsterprøver, og afprøv betjeningen i et relevant produkt. [Systemkontrol](AGENT-WORKFLOW.md#når-selve-systemet-ændres)

## Grafik og animation

Læs stilkontrakten og de relevante referencer før nye illustrationer eller animationsplaner. Brug Stades eksisterende grafikfamilier og den fælles afspiller, hvor de passer. [Grafikguiden](GRAPHICS-AUTHORING.md#stilkontrakt-og-referencehierarki) · [Fælles afspiller](GRAPHICS-AUTHORING.md#en-plan-på-den-fælles-afspiller)

**Kontrol.** Afprøv materialer, bevægelse og reduceret bevægelse. Væsentlige skift i udtrykket kræver browserkontrol. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Levering

Følg projektets driftsform og den relevante leveringsopskrift. [Levering af Stade](PRODUCTION.md#byg-og-lever-offline-editoren) · [Nye og eksisterende produkter](PRODUCTION.md#nye-og-eksisterende-produkter)

**Kontrol.** Kontrollér den byggede leverance. Vurder behovet for særskilt offline- og filkontrol. [Kontrolvejen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion)

## Hjemmeside

Brug den dokumenterede showcase-arbejdsgang, når opgaven omfatter at publicere produktet på hjemmesiden. [Showcase](WEBSITE-SHOWCASE.md#opdatér-design-studio-på-hjemmesiden)

**Kontrol.** Byg showcasen, og kontrollér de ændrede sider og deres ressourcer. [Showcase til hjemmesider](PRODUCTION.md#showcase-til-hjemmesider)

## Produktmedier

Brug screenshots af den faktiske app og den etablerede arbejdsgang for produktkort. [Screenshots](PRODUCT-MEDIA.md#screenshots) · [Produktkort](PRODUCT-MEDIA.md#produktkort)

**Kontrol.** Kontrollér at billeder, kilder og leverede kort stemmer overens med produktet. [Mediekontrol](PRODUCT-MEDIA.md#kilder-levering-og-kontrol)
