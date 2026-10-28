# Design Studio: indgang for agenter

Læs README.md, docs/AGENT-WORKFLOW.md og docs/DESIGN-FOUNDATIONS.md før UI-arbejde. Læs produktets egne anvisninger; navigation, indhold og forretningslogik er projektspecifikke.

## Standard for nye projekter: offline i browseren

- Lever en selvstændig index.html i produktets rod, som brugeren kan dobbeltklikke på og åbne direkte via file://. Appen skal fungere uden server, terminal, startfil eller installeret runtime.
- Pak programkode, komponentruntime, CSS og nødvendige ressourcer til offlinebrug, som i FormLab. Brug ikke modulindlæsning, fetch af lokale filer eller eksterne CDN-afhængigheder, der forhindrer direkte åbning.
- Projektet skal have npm run build, når output genereres. Agenten installerer nødvendige udviklingsafhængigheder og genbygger efter kode-, design-, tema- og ressourceændringer. Brugeren skal blot genindlæse browseren; byggeværktøjer er ikke et krav ved brug af den færdige fil.
- Brug browserens filvælger til åbning og downloads til gemning. Gør det tydeligt, at downloads ikke automatisk overskriver originalfilen. Browserlagring kan supplere, men erstatter ikke brugerens gemte projektfiler.
- Genbrug createProjectFile fra design/runtime/files.mjs med produktets format-id, version og datavalidering. Bevar state ved ugyldige filer eller annulleret åbning. Nye init-projekter får modulet og et åbn/gem-eksempel med fra starten.
- Brug npm run doctor i nye startprojekter eller tools/cli.mjs doctor PROJECT_DIR fra systemmappen til at finde konkrete fejl og forældede filer. Tjekket ændrer ikke filer og erstatter ikke relevant funktionskontrol.
- Startprojektets struktur er et udgangspunkt, ikke en fast arkitektur. tools/cli.mjs update PROJECT_DIR viser valgfrie skabelonopdateringer; --apply bevarer lokal kode og forbereder forslag til manuel fletning. Ingen opdatering er nødvendig for at bruge eller bygge produktet. Hæv STARTER_VERSION i tools/starter.mjs ved ændringer i startskabelonerne.
- Kontrollér, at leverancen kan åbnes via file://; en fungerende udviklingsserver er ikke tilstrækkelig. Brug proportional kontrol og bevar eksisterende projekters arkitektur, medmindre en omlægning er bestilt.
- Afvig kun, når brugerens udtrykkelige krav eller konkret nødvendig funktionalitet kræver en anden driftsmodel. Forklar da behovet; indfør ikke en server eller Windows-app alene som standardvalg.

## Ét bibliotek, flere temaer

- core/library.mjs er den fælles kilde til komponenternes roller, dele, layout, varianter, tilstande og previews. core/components.mjs leverer den fælles markup og native DOM-implementering.
- packages/*.json og projektets design/design.json er temaer i format 2. De ejer tokens, afgrænsede appearance-overrides, brandguide og historik. Temaer indeholder ikke komponentdefinitioner.
- Temaer må ikke tilsidesætte struktur, display, padding, gap, positionering eller fokusmekanik. Indvendige afstande tilpasses gennem bibliotekets positive semantiske spacingtokens.
- Nye komponenter skal bruge eksisterende semantiske tokens eller dokumenterede centrale defaults. De skal kunne vises med alle medfølgende temaer uden nye opskrifter i hvert tema.
- Ved hele skærme: undersøg også patterns/catalog.mjs og de valgfrie referenceeksempler. tools/cli.mjs examples PROJECT_DIR kopierer dem uden overskrivning. De er inspiration og tilpasningsbar produktkode, ikke en obligatorisk arkitektur eller nye komponentroller. Bevar ophav og licenser, når en løsning hentes fra et eksisterende produkt.
- Vælg bredde efter indholdets rolle. Genbrug profilerne fra core/layout.mjs gennem ds-layout/data-layout eller createLayout fra components.mjs. Fælles CSS og init/sync leverer dem; --ds-layout-max-width giver lokale tilpasninger uden at brede indlejrede paneler ud. Brug kun fuld bredde til indhold, der reelt udnytter den. Produktet ejer stadig kolonner og placering; se docs/DESIGN-FOUNDATIONS.md.

## Når et produkt anvender systemet

1. Find design-studio.project.json og projektets tema. Mangler tilknytningen i et nyt projekt, kør tools/cli.mjs init PROJECT_DIR --theme THEME_ID; det opretter også en minimal offline-app med src-filer, npm run build og færdig index.html. Brug --design-only til eksisterende produkter med egen app-/buildopsætning. Bevar produktets eksisterende brand og instrukser.
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

Bevar framework-uafhængigheden i bibliotek og temaer. Standardleverancen er en selvstændig offline-webapp: åbn index.html direkte i browseren uden server eller Windows-app. Temaer åbnes med filvælgeren og gemmes som JSON-downloads. Hjemmesidens showcase bruger samme browserkompatible kerne med offentlige temaer.

Hold core/contract.mjs, core/library.mjs, core/components.mjs, core/quality.mjs, skema, temaer, interface og dokumentation konsistente. Kør npm test og npm run check efter ændringer i format, runtime eller værktøjer. Kør npm run build efter kode-, design- eller temaændringer, så den genererede index.html er opdateret; brugeren skal blot genindlæse browseren. Håndredigér ikke index.html. Test proportionelt efter den berørte funktion; udvid ikke scope med uvedkommende refaktorering.
