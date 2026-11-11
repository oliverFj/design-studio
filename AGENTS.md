# Design Studio: indgang for agenter

Læs produktets egne anvisninger og denne indgang. Vælg derefter kun de relevante afsnit nedenfor; README og hele dokumentationssamlingen er ikke obligatorisk grundlæsning. Genbrug allerede etableret viden og genlæs kun ændrede eller relevante dele. Regler i de henviste kontrakter gælder fortsat for den berørte funktion.

## Find opgavens grundlag

| Opgave | Læs og brug | Kontrol |
| --- | --- | --- |
| Lille produktrettelse | Produktets `design-studio.project.json`, berørt rolle og dens afsnit i [INTEGRATION](docs/INTEGRATION.md). | Højst én hurtig relevant kontrol; byg efter kode-/ressourceændringer. |
| Nyt produkt eller ny skærm | [Start](docs/AGENT-WORKFLOW.md#start-eller-fortsæt-et-produkt), [sammensætning](docs/AGENT-WORKFLOW.md#vælg-og-sammensæt), mønsterkatalog og [bredder](docs/INTEGRATION.md#fælles-breddeprofiler). | Browserforløb og relevante randtilstande efter [kontrolvejen](docs/AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion). |
| Tema eller design | Berørte [designprincipper](docs/DESIGN-PRINCIPLES.md), [designgrundlag](docs/DESIGN-FOUNDATIONS.md), brandregler og [temaformat](docs/PACKAGE-FORMAT.md). | Alle leverede farvetilstande; nyt tema eller væsentlig visuel ændring kræver browserkontrol. |
| Interaktion eller controller | [Controlleroversigt](docs/INTEGRATION.md#vælg-controller) og det konkrete API-afsnit. | Det berørte forløb, kladder, fejl, tastatur og fokus. |
| Fælles bibliotek, runtime eller værktøj | [Systemændringer](docs/AGENT-WORKFLOW.md#når-selve-systemet-ændres), berørte kontrakter og [udvidelsesregler](docs/DESIGN-FOUNDATIONS.md#når-en-agent-udvider-biblioteket). | Kør testfilerne for berørte roller, controllere eller værktøjer. Brug den fulde pakke ved udgivelse og brede ændringer. |
| Grafik eller animation | [Grafikguiden](docs/GRAPHICS-AUTHORING.md) før nye illustrationer eller animationsplaner; genbrug fælles afspiller. | Berørte materialer, bevægelse og reduceret bevægelse. |
| Nyt eller ændret fælles mønster | Relevante dele af [produktmønstre](docs/PRODUCT-PATTERNS.md). | Brug `npm run test:patterns` til mønsterprøverne og afprøv den berørte betjening i produktet. |
| Levering, hjemmeside eller produktmedier | [Produktion](docs/PRODUCTION.md), [hjemmeside](docs/WEBSITE-SHOWCASE.md) og ved medier [PRODUCT-MEDIA](docs/PRODUCT-MEDIA.md). | Leveringskontrol; produktmedier følger screenshot-/kortarbejdsgangen uden billedgenerering. |

MCP er en målrettet læsevej til samme grundlag: søg i bibliotek og erfaringer, hent den berørte komponent, mønsterdefinition eller et guideafsnit. Se [samarbejdsguiden](docs/COLLABORATION.md) for installation, projektadgang, kilder og kuratering. Ved gentagen fejlsøgning læses relevante erfaringers belæg og begrænsninger før genbrug.

## Faste grænser

- `core/library.mjs` ejer roller, dele, layout, varianter, tilstande og previews; `core/components.mjs` leverer markup, native DOM og fælles interaktionshjælpere. Bevar framework-uafhængigheden og genbrug en eksisterende rolle før central udvidelse.
- Format 2-temaer ejer tokens, afgrænset appearance, brandguide og historik; aldrig komponentdefinitioner, struktur, display, padding, gap, positionering eller fokusmekanik. Tæthed bruger positive semantiske spacingtokens. Ét eller begge farveudtryk er tilladt efter behov.
- Produktet ejer indhold, navigation, data, kommandoer, lagring og skærmkomposition. Brug fælles runtime eller tynde adaptere; opret ikke konkurrerende lokale roller. Registrér kun faktiske adapteres verificerede `file` og `export`; direkte runtimebrug kræver ingen adapter.
- Bevar native controls, labels, hjælp/fejl, tilgængelige navne og meningsfuldt fokus. Forbind kompleks adfærd med fælles controller og modal dialog med `showModal()` eller etableret tilgængelig adapter. Bevar kladder, fejl og valg ved genmontering.
- Bevar produktets brand; genbrug godkendte originaler fra `brand.assets` efter `brand.logos`, proportioner og licenser. Hold token-, komponent- og ressourcehenvisninger ajour. Produktet ejer kolonner; indlejrede paneler bevarer deres breddegrænse.

## Standardleverance

Nye produkter oprettes med `tools/cli.mjs init PROJECT_DIR --theme THEME_ID` og leveres som én offline `index.html`, der kan åbnes via `file://` uden server, terminal eller installeret runtime. Eksisterende app/build bevares med `--design-only`. En anden driftsmodel kræver udtrykkeligt brugerkrav eller konkret nødvendig funktionalitet og en forklaring. Følg [start- og byggereglerne](docs/AGENT-WORKFLOW.md#start-eller-fortsæt-et-produkt).

Agenten installerer nødvendige udviklingsafhængigheder og bygger efter kode-, tema- og ressourceændringer; brugeren genindlæser. Håndredigér ikke genereret HTML/CSS eller kopieret runtime. Ved ændret tema eller fælles bibliotek bruges `sync` før produktets build. `doctor` er et læsetjek; `update` er valgfrit og bevarer lokal kode.

Brug `createProjectFile` med produktets format-id, version og datavalidering. Filvælger og downloads er standarden; annullering og ugyldige filer bevarer state. Downloads overskriver ikke originalen automatisk, og browserlagring erstatter ikke gemte projektfiler. Se [projektfilkontrakten](docs/INTEGRATION.md#fælles-projektfiler).

## Kontrol og ændringer i systemet

Følg [kontrolvejen](docs/AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion) før kontrol og [systemkravene](docs/AGENT-WORKFLOW.md#når-selve-systemet-ændres) ved fælles ændringer. Nye skærme, nye temaer og væsentlige ændringer i layout, materialer, bevægelse eller interaktion kræver browserkontrol. Den byggede fil kontrolleres over lokal HTTP på loopback; statisk offlinekontrol og direkte filkontrol er særskilte prøver. Respektér browserværktøjets dokumenterede URL-understøttelse og omgå aldrig en afvisning. Kontrolvejen beskriver, hvornår manuel filkontrol skal aftales.

Dokumentation vedligeholdes kun på bestilling eller ved konkret væsentlig teknisk risiko; beskriv den aktuelle implementering uden sessionshistorik. Lever kort på dansk med ændring, faktisk kontrol og væsentlige begrænsninger.
