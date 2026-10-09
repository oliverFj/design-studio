# Design Studio: indgang for agenter

Læs README.md, docs/AGENT-WORKFLOW.md og docs/DESIGN-FOUNDATIONS.md før UI-arbejde. Læs produktets egne anvisninger; navigation, indhold og forretningslogik er projektspecifikke.

## Ét bibliotek, flere temaer

- core/library.mjs er den fælles kilde til komponenternes roller, dele, layout, varianter, tilstande og previews. core/components.mjs leverer den fælles markup og native DOM-implementering.
- packages/*.json og projektets design/design.json er temaer i format 2. De ejer tokens, afgrænsede appearance-overrides, brandguide og historik. Temaer indeholder ikke komponentdefinitioner.
- Temaer må ikke tilsidesætte struktur, display, padding, gap, positionering eller fokusmekanik. Indvendige afstande tilpasses gennem bibliotekets positive semantiske spacingtokens.
- Nye komponenter skal bruge eksisterende semantiske tokens eller dokumenterede centrale defaults. De skal kunne vises med alle medfølgende temaer uden nye opskrifter i hvert tema.

## Når et produkt anvender systemet

1. Find design-studio.project.json og projektets tema. Mangler tilknytningen, kør tools/cli.mjs init PROJECT_DIR --theme THEME_ID. Bevar produktets eksisterende brand og instrukser.
2. Undersøg det fælles katalog, temaets tokens/brandguide og registrerede produktadaptere. Vælg et tema efter opgaven; ingen bestemt æstetik er et systemkrav.
3. Brug runtime fra design/runtime/components.mjs eller en tynd frameworkadapter over de fælles dele. Indlæs genereret design/design.css under ds-scope. Opfind ikke en parallel lokal version af en eksisterende komponentrolle.
4. Registrér frameworkadaptere i konfigurationens components: { "button": { "file": "src/components/Button.tsx", "export": "Button" } }. Verificér stier og exports.
5. Genbrug først. Udvid den fælles komponent med en variant, når rollen allerede findes. Tilføj en ny fælles komponent, når en genbrugelig rolle mangler. Produktspecifikke skærme og sammensætninger kan forblive i produktet.
6. Brug projektagnostiske navne, beskrivelser, variantnavne og eksempler. Bibliotekets principper følger Fluent 2 og Carbon; kilder og begrundelser findes i DESIGN-FOUNDATIONS.md. Nye fælles komponenter skal have navn, formål, anvendelse, parts, variants, states, composes og et deklarativt preview. Tilføj nødvendige tokens/defaults centralt. Temaerne bestemmer værdierne; biblioteket bestemmer hvordan de bruges.
7. Kør tools/cli.mjs sync PROJECT_DIR efter tema- eller biblioteksændringer. Det kopierer runtime og regenererer CSS. Kontrollér de påvirkede komponenter visuelt og produktets relevante funktioner.
8. Ved ændringer i biblioteket: kontrollér alle medfølgende temaer og opdatér website-showcase fra hjemmesidens mappe med npm run sync:design-studio og dens normale build. tools/build-showcase.mjs --out DIRECTORY eksporterer samme demo til andre websites. Notér ændringer i temaets history, når temaet ændres.

## Semantik og brand

Bevar native controls og forbind label, hjælp og fejl gennem for/id og aria-describedby. Dialogadfærd bruger native dialog eller produktets etablerede tilgængelige dialogadapter. Produktet ejer åbning, lukning, events og state.

Genbrug godkendte logo-originaler fra brand.assets efter brand.logos-reglerne; bevar proportioner og licenser. Læs brandprincipper, relevante sektionsregler og logobrug, og følg docs/BRANDGUIDE.md. Registrér produktets eksisterende brand frem for at overtage et startsæts afsender. Hold token-, komponent- og ressourcehenvisninger ajour.

## Eksisterende format 1

Format 1 kan fortsat læses og generere sin eksisterende CSS. Brug migrate FILE --out NEW_FILE for eksplicit konvertering, og bevar originalen. Gennemgå produktets gamle padding/layout før tilkobling til format 2, så indvendig afstand ikke tilføjes to gange. Nye projekter bruger format 2.

## Arbejde på selve Design Studio

Bevar framework-uafhængigheden i bibliotek og temaer. Desktop er en vært omkring samme webinterface; hjemmesidens showcase bruger samme browserkompatible kerne med offentlige temaer.

Hold core/contract.mjs, core/library.mjs, core/components.mjs, core/quality.mjs, skema, temaer, interface og dokumentation konsistente. Kør npm test og npm run check efter ændringer i format, runtime eller værktøjer. Byg desktop-appen igen efter ændringer, der skal med i distributionen. Test proportionelt efter den berørte funktion; udvid ikke scope med uvedkommende refaktorering.
