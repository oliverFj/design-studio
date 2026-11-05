# Temaformat og komponentbibliotek

Format 2 er ét tema i en JSON-fil. Komponentdefinitioner ligger i det fælles core/library.mjs. Den samme renderer og CSS-compiler bruges i produkter, offline-editoren i browseren og web-showcase.

## Temafelter

| Felt | Indhold |
| --- | --- |
| schemaVersion | 2. |
| id | Stabilt id, små bogstaver/tal/bindestreg; starter med et bogstav. |
| name, description | Navn og visuel hensigt. |
| tokens | Flade token-id'er med $type, $value og description. Kan være sparsomme; centrale defaults suppleres. |
| appearance | Valgfrie overrides af godkendte visuelle egenskaber på eksisterende dele, varianter og tilstande. |
| brand | Valgfri brandguide og originalressourcer; se BRANDGUIDE.md. |
| history | Dato og beskrivelse af temabeslutninger. |
| modes | Valgfrie farvetilstande: et `light`/`dark`-par eller navngivne farvevariationer med `name`, `colorScheme` og `tokens`. |
| defaultMode | Id på temaets standardtilstand, påkrævet sammen med `modes`. |

components er ikke tilladt i format 2. Tilføj komponenter til det fælles bibliotek.

## Tokens og defaults

Typerne er color, dimension, fontFamily, fontWeight, number, duration, shadow og gradient. Et alias er hele værdien, eksempelvis {color.action.primary}; det skal referere til et token med samme type. Ukendte eller cirkulære aliases afvises.

`gradient` er en CSS-streng med `linear-gradient` eller `radial-gradient`, 2–8 opake, målbare farvestop og stigende procentpositioner fra 0% til 100%. Lineær retning angives som vinkel eller `to right`/`to bottom` med eventuel vandret hjørneretning; radial form er `circle`/`ellipse`, eventuelt `at 50% 50%`. Eksempel: `{"$type":"gradient","$value":"linear-gradient(135deg, {palette.brand.700} 0%, {palette.accent.700} 100%)","description":"Brandets farveovergang."}`. Farvestop kan referere til color-tokens; hele værdien kan referere til et gradient-token. Det er Design Studios CSS-orienterede repræsentation, ikke DTCG's sammensatte gradientformat. Farvestop er begrænset til opake hex-, rgb-, hsl- og målbare navngivne sRGB-farver; oklab/oklch/color()-stop afvises. CSS-eksporten angiver eksplicit `in srgb`, så interpolation og kontrastberegning følger samme farverum. Editoren viser en farveprøve og et flerlinjetekstfelt.

Gradienter bruges gennem `background` i tilladte appearance-overrides eller via deres CSS-variabler i produktets komposition. Grundfladernes color-tokens forbliver opake enkeltfarver. Kontrastkontrollen af komponentopskrifter bruger konservative sRGB-kanalgrænser for hele gradientens lyshedsspænd, også mellem farvestoppene. Den kan afvise en brugbar gradient; den godkender ikke blot ud fra endepunkterne. Den dokumenterer ikke automatisk kontrast på billeder, lokale produktflader eller vilkårlig CSS.

core/contract.mjs beskriver grundvokabularet. core/library.mjs indeholder DEFAULT_TOKENS med dokumenterede værdier/aliases for alle bibliotekets roller. Temaet overskriver værdier uden at ændre tokenets type. getComponents og materializePackage giver en afledt læsemodel; gem altid det oprindelige tema, ikke læsemodellen.

De offentlige temaer bruger primitive farver under `palette.*` og semantiske aliases under `color.*`. `core/scales.mjs` leverer `space.scale.*`, `elevation.level0…3`, `layer.*` og `size.icon.small/medium/large`. Ældre semantiske navne kan fortsat overskrives af temaer. `BREAKPOINTS` er fælles talværdier til genereret CSS; de er ikke CSS-variable, der kan anvendes som betingelse i en media query.

space.component.padding, paddingLarge, paddingCompact, gap og gapLarge skal efter aliasopløsning have positive absolutte eller skriftrelative længder. Nul, negative værdier og procentafstande afvises. Bibliotekets padding og mellemrum kan dermed ikke forsvinde gennem et tema.

## Læsbarhed og kompatible navne

Format 2 validerer semantiske kontrastpar, målbare eksplicitte farvepar i varianter/tilstande og grundlæggende tekst-/kontrolmål gennem core/quality.mjs. Feltgrænser har mindst 3:1 mod kontrol-, indholds- og grundflader; også input/select/field/choice-field-opskrifter og deres varianter kontrolleres, så svage appearance-overrides ikke kan omgå tokenkravet. Disabled er undtaget; dekorative kortkanter er ikke feltgrænser. Se DESIGN-FOUNDATIONS.md for kontrollens rækkevidde. Native tastaturfokus fastholdes af CSS-generatoren uanset temaets udtryk.

## Farvetilstande og navngivne farvevariationer

En format 2-pakke kan have et valgfrit `modes: {light: {tokens: {...}}, dark: {tokens: {...}}}`-par eller navngivne variationer som `modes: {solgul: {name: "Solgul", colorScheme: "light", tokens: {...}}, kalk: {name: "Kalk", colorScheme: "light", tokens: {...}}}`. `defaultMode` skal referere til en deklareret tilstand. Navngivne variationer kræver et læsbart `name` og `colorScheme: "light"` eller `"dark"` til native kontroller; de kræver ikke et lys/mørk-par. Id'er bruger små bogstaver, tal og bindestreger; `system` er reserveret. Alle leverede tilstande valideres som grundtokens plus egne overrides. De samme tokenregler, typer, aliaser, kontrastkrav og positive komponentafstande gælder. Brand, appearance, struktur og komponentdefinitioner gentages ikke i modes.

`resolveThemeMode(source, preference, systemMode)` fra `theme-modes.mjs` returnerer et selvstændigt, klonet tema uden `modes`/`defaultMode`. Preference er et deklareret tilstands-id eller `system`, `light`, `dark`; systemMode er `light` eller `dark`. Hvis den ønskede lys/mørk-tilstand ikke findes, bruges temaets `defaultMode`. Kilden ændres ikke. `themeModeOptions(source)` leverer pickerens værdier og labels, og `resolveThemeModeId` leverer det valgte id. En enkeltstående pakke uden modes beholder sine værdier; nye modes tilføjes ikke stiltiende.

Gem den oprindelige kilde med alle modeoverrides. CSS-eksporten af en resolved læsemodel er én fremtoning. Produktet vælger selv, hvordan det anvender brugerens præference; se [runtimeintegration](INTEGRATION.md#lyse-og-mørke-farvetilstande).

Det fælles katalog bruger kanoniske, projektagnostiske navne. Tidligere format 2-id'er som tool-button, simulation-caption, brandSelect og stat-row er eksplicitte aliases for action-button, caption, choice-field og metric-row. Tidligere domænevarianter oversættes til funktionelle navne; nye temaer og kode bruger kanoniske id'er. Format 1 beholder sine hidtidige navne og regler.

Bibliotek 3.0 adskiller de fire offentlige knapvarianter primary, secondary, tertiary og ghost fra historiske kompatibilitetsopskrifter. Eksisterende appearance-overrides for gamle knapvarianter accepteres fortsat. size og intent er renderingsvalg og bliver ikke nye komponentdefinitioner i temaet. Secondary har centrale defaults for secondaryHover/Active og tilhørende tekstfarver; temaet kan tilpasse værdierne med de almindelige farve- og kontrastregler.

## Appearance

~~~json
{
  "appearance": {
    "card": {
      "parts": {
        "root": {
          "styles": {
            "backgroundColor": "{color.background.surface}",
            "borderRadius": "{radius.card}"
          }
        }
      }
    }
  }
}
~~~

parts, variants og states må kun referere til roller, der allerede findes i biblioteket. APPEARANCE_PROPERTIES er den autoritative tilladelsesliste: farver, typografi, kanter, afrunding, skygger og tilsvarende visuelle egenskaber. Layout som display, padding, gap, bredde, højde og position er ikke tilladt. Sikker CSS-validering, tokenreferencer og ressourceregler gælder stadig.

## Komponentdefinitioner

COMPONENT_LIBRARY har name, description, usage, composes, parts, variants, states og preview for hver rolle. parts.root er roden. Dele har én .ds-klasse og styles med camelCase-egenskaber og tokenreferencer. composes angiver andre fælles roller. Varianter og tilstande genbruges på tværs af temaer.

Previewet er et deklarativt træ med tag, part, text, attrs og children. En node kan også referere til en eksisterende fælles rolle med {component: "field"}; rollen skal være deklareret i ejerens composes. Bibliotekets previewreferencer bruger ikke produktets options. En sammensat node kan få ejerens part, eksempelvis {component: "inspector", part: "surface"}, så indlejret indhold følger den fælles fladeregel. Det er samme strukturelle basis som fælles komponentrendering. Nye roller skal have et preview, dokumentation og alle nødvendige token-defaults. Bibliotekets katalog er immutable i runtime; udvid kildefilen og synkronisér berørte produkter.

Biblioteksversionen er LIBRARY_VERSION. Produktkonfiguration registrerer libraryVersion og den kopierede library-entrypoint samt produktadaptere.

`COMPONENT_COVERAGE` i library.mjs beskriver leveret adfærd og aftalte mangler. `available`, `partial` og `planned` er leverancestatus, ikke tilgængelighedsgodkendelse. Metadata viser native adfærd, statisk indhold/layout eller faktisk controller-entrypoint. Planlagte roller har ingen komponentdefinition og vises ikke som falske previews.

## CSS og semantik

CSS bruger .ds-scope som standard. Roots ligger inden i scope; underdele ligger inde i komponenten. data-variant vælger en eksisterende variant. Native pseudo-klasser og aria-attributter styrer relevante tilstande; brugerdefinerede states kan bruge data-state.

renderComponent giver sikker HTML. createComponent giver native DOM. options omfatter variant, state, idPrefix, text, slots, attrs og relevante formularværdier. slots bruger tekst, deklarative noder eller {component, options}. Ingen vilkårlige scriptstrenge eller usikker HTML.

## Format 1 og migration

Skemaet og runtime accepterer eksisterende format 1, hvor komponentopskrifter ligger i pakken. CSS forbliver uændret. migratePackage er eksplicit og giver et nyt format 2-tema: visuelle egenskaber og brand bevares, mens struktur/layout kommer fra biblioteket. Ukendte roller/dele/varianter skal registreres før migration; de bortfalder ikke stiltiende.

CLI migrate FILE --out NEW_FILE bevarer originalen og nægter at overskrive eksisterende output. Offline-editorens konvertering er først en kladde; **Gem tema** henter resultatet som en ny JSON-fil, som ikke automatisk erstatter originalen. Gennemgå produktet for dobbelt padding før et migreret tema aktiveres.

validateCompatibility kontrollerer det effektive token- og komponentkontrakt. Alle medfølgende temaer har samme katalog; projektspecifikke ekstra tokens kan fortsat kræve en tilsvarende rolle i kandidaten. Validering kontrollerer også definerede kontrastpar. Den garanterer ikke produktkode, teksttilpasning eller alle mulige farvekombinationer i et konkret sidelayout.

## Ensartede tokennavne og kompatibilitet

Ny format 2-kode bruger `space.scale.*` til den primitive afstandsskala og `space.component.*` til komponenternes semantiske afstande. `space.control.inset` er den faste kontrolafstand, som tidligere hed `space.px4`.

Handlingsfarver følger `color.action.FAMILY.STATE.PART`, eksempelvis `color.action.primary.hover.surface` og `color.action.primary.hover.text`. De eksisterende 28 farveværdier er bevaret som særskilte flade-/tekstpar; navngivningen beskriver akserne ensartet.

Historiske navne læses fortsat som aliases og eksporteres som kompatible CSS-variabler. Format 2 normaliserer gamle tokenoverrides før sammenlægning med defaults og farvetilstande. Hvis begge navne udtrykkeligt findes i samme tokensæt, har det kanoniske navn forrang; en tilstands override har forrang over grundtemaet. `normalizeThemeReferences(theme)` giver en ny normaliseret kopi, inklusive appearance- og brandreferencer; inputfilen ændres ikke. Format 1 beholder sin eksisterende kontrakt.
