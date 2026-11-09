# Stade · Design Studio

Et fælles, framework-uafhængigt komponentbibliotek med udskiftelige temaer, offline-editor og web-showcase. MCP og skills hjælper agenter med at finde komponenter, mønstre, vejledninger og kildeunderstøttede erfaringer.

Biblioteket bestemmer struktur, semantik og grundlayout. Temaet bestemmer det visuelle udtryk. Produktet bestemmer indhold, navigation og forretningslogik.

[Kildekode](https://github.com/oliverFj/design-studio) · [Offentlig showcase](https://oliver.fjordside.dk/design-studio/index.html)

## Åbn Design Studio

Dobbeltklik på **[index.html](index.html)**. Den færdige editor fungerer offline uden installation eller server og har de medfølgende temaer indbygget. **Åbn tema** læser en valgt JSON-fil; **Gem tema** henter en ny fil og overskriver ikke originalen automatisk. Gem ændringer før genindlæsning eller lukning. Se [brug editoren](docs/PRODUCTION.md#brug-editoren) for funktioner og filhåndtering.

## Byg offlineudgaven

Et nyt checkout kræver Node.js 20 eller nyere:

```sh
npm ci
npm run build
```

`index.html` er genereret og Git-ignoreret. Efter kode-, design- og temaændringer bygger agenten igen; brugeren genindlæser blot. Rene dokumentationsændringer kræver ikke build. [Produktion](docs/PRODUCTION.md) beskriver pakker, licenser, opdatering og levering.

## Samarbejde med agenter

Start i **[AGENTS.md](AGENTS.md)** og vælg opgavens læsevej. Der er ikke krav om at indlæse hele dokumentationen. MCP søger i samme kilder og kan hente konkrete komponenter, mønstre og guideafsnit. [Samarbejdsguiden](docs/COLLABORATION.md) ejer installation, adgangsgrænser, tickets, erfaringer og kuratering. En serverprøve dokumenterer forbindelsen i sin egen klient, ikke den aktuelle chats indlæste værktøjer.

## Ét bibliotek, flere temaer

Editoren viser komponenter, interaktive designmønstre, tokens og brandguide i de medfølgende temaer. Temaer kan være lyse, mørke eller have flere farvetilstande. Struktur og genbrugelig adfærd udvikles centralt. Aktuelt katalog, biblioteksversion og controllerdækning findes i `core/library.mjs`; editorens versionsnummer er særskilt. Se [temaformatet](docs/PACKAGE-FORMAT.md).

## Grafik og animation

[Grafikguiden](docs/GRAPHICS-AUTHORING.md) ejer stilguider, referencepakker, animationsregler og det lokale grafikværksted. Genbrug eksisterende motiver og den fælles afspiller.

## Brug i et produkt

Bed agenten om at bruge det tilknyttede Design Studio, læse produktets anvisninger og systemets AGENTS.md og vælge de relevante kontrakter gennem opgavematricen. Nye produkter oprettes fra systemmappen med:

```sh
node tools/cli.mjs init PROJECT_DIR --theme studio-light
```

Mappen skal eksistere. Eksisterende produkter tilknyttes med `--design-only`, som bevarer app og build. [Arbejdsgangen](docs/AGENT-WORKFLOW.md#start-eller-fortsæt-et-produkt) ejer opsætning og kontrol; [integrationsguiden](docs/INTEGRATION.md) ejer API, controllere, projektfiler, `sync`, `doctor` og valgfrie opdateringer.

## Designgrundlag

[Designgrundloven](docs/DESIGN-PRINCIPLES.md) ejer den æstetiske og funktionelle retning. [Designgrundlaget](docs/DESIGN-FOUNDATIONS.md) ejer generelle tekniske principper og målbare kvalitetskrav. [Brandguiden](docs/BRANDGUIDE.md) ejer brandstrukturen.

## Nye komponenter

Genbrug eksisterende roller før udvidelse. Følg [udvidelsesreglerne](docs/DESIGN-FOUNDATIONS.md#når-en-agent-udvider-biblioteket) og [kravene til systemændringer](docs/AGENT-WORKFLOW.md#når-selve-systemet-ændres).

## Web-showcase

Den offentlige udgave viser editoren uden filåbning, gemning og eksport. Besøgendes ændringer påvirker ingen produkter. Et lokalt build opdaterer ikke hjemmesiden; følg [hjemmesideguiden](docs/WEBSITE-SHOWCASE.md). [Produktmedier](docs/PRODUCT-MEDIA.md) beskriver screenshots og produktkort; [signaturen](docs/SIGNATURE.md) beskriver Fjordside-kreditering.

## Portabilitet og kontrolgrænser

Den færdige editor er én fil; udviklingsopsætning og MCP kræver særskilt installation. Lokale skrifter og ressourcer følger leverancen med licenser. Se [produktion](docs/PRODUCTION.md) og den daterede [verifikationsstatus](docs/PRODUCTION.md#verifikationsstatus) for faktisk kontrol og resterende begrænsninger.

## Indhold

| Behov | Autoritativ kilde |
| --- | --- |
| Opgavevalg og faste grænser | [AGENTS.md](AGENTS.md) |
| Arbejdsgang og kontrolkrav | [AGENT-WORKFLOW](docs/AGENT-WORKFLOW.md) |
| Komponentkontrakter, API og eksempler | [INTEGRATION](docs/INTEGRATION.md) og `core/library.mjs` |
| Temaformat og migration | [PACKAGE-FORMAT](docs/PACKAGE-FORMAT.md) |
| MCP, skills, tickets og erfaringer | [COLLABORATION](docs/COLLABORATION.md) |
| Produktbaserede mønstre og skånsom indføring | [PRODUCT-PATTERNS](docs/PRODUCT-PATTERNS.md) |
| Pakning, editorbrug og kontrolstatus | [PRODUCTION](docs/PRODUCTION.md) |

## Kontrol og migration

Følg [kontrolvejen](docs/AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion). Migration fra format 1 er eksplicit og bevarer originalen; se [formatkontrakten](docs/PACKAGE-FORMAT.md). Tidligere udkast i `discussions and ideas/` er idéhistorik; editoren bygges fra `studio/`.

En mulig fælles materialemotor er et [udviklingsforslag](docs/MATERIAL-ENGINE.md); der er endnu ingen udtrukket motor eller produktintegration.
