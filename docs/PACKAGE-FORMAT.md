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

components er ikke tilladt i format 2. Tilføj komponenter til det fælles bibliotek.

## Tokens og defaults

Typerne er color, dimension, fontFamily, fontWeight, number, duration og shadow. Et alias er hele værdien, eksempelvis {color.action.primary}; det skal referere til et token med samme type. Ukendte eller cirkulære aliases afvises.

core/contract.mjs beskriver grundvokabularet. core/library.mjs indeholder DEFAULT_TOKENS med dokumenterede værdier/aliases for alle bibliotekets roller. Temaet overskriver værdier uden at ændre tokenets type. getComponents og materializePackage giver en afledt læsemodel; gem altid det oprindelige tema, ikke læsemodellen.

space.component.padding, paddingLarge, paddingCompact, gap og gapLarge skal efter aliasopløsning have positive absolutte eller skriftrelative længder. Nul, negative værdier og procentafstande afvises. Bibliotekets padding og mellemrum kan dermed ikke forsvinde gennem et tema.

## Læsbarhed og kompatible navne

Format 2 validerer semantiske kontrastpar, målbare eksplicitte farvepar i varianter/tilstande og grundlæggende tekst-/kontrolmål gennem core/quality.mjs. Se DESIGN-FOUNDATIONS.md for præcise grænser og kontrollens rækkevidde. Native tastaturfokus fastholdes af CSS-generatoren uanset temaets udtryk.

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

## CSS og semantik

CSS bruger .ds-scope som standard. Roots ligger inden i scope; underdele ligger inde i komponenten. data-variant vælger en eksisterende variant. Native pseudo-klasser og aria-attributter styrer relevante tilstande; brugerdefinerede states kan bruge data-state.

renderComponent giver sikker HTML. createComponent giver native DOM. options omfatter variant, state, idPrefix, text, slots, attrs og relevante formularværdier. slots bruger tekst, deklarative noder eller {component, options}. Ingen vilkårlige scriptstrenge eller usikker HTML.

## Format 1 og migration

Skemaet og runtime accepterer eksisterende format 1, hvor komponentopskrifter ligger i pakken. CSS forbliver uændret. migratePackage er eksplicit og giver et nyt format 2-tema: visuelle egenskaber og brand bevares, mens struktur/layout kommer fra biblioteket. Ukendte roller/dele/varianter skal registreres før migration; de bortfalder ikke stiltiende.

CLI migrate FILE --out NEW_FILE bevarer originalen og nægter at overskrive eksisterende output. Offline-editorens konvertering er først en kladde; **Gem tema** henter resultatet som en ny JSON-fil, som ikke automatisk erstatter originalen. Gennemgå produktet for dobbelt padding før et migreret tema aktiveres.

validateCompatibility kontrollerer det effektive token- og komponentkontrakt. Alle medfølgende temaer har samme katalog; projektspecifikke ekstra tokens kan fortsat kræve en tilsvarende rolle i kandidaten. Validering kontrollerer også definerede kontrastpar. Den garanterer ikke produktkode, teksttilpasning eller alle mulige farvekombinationer i et konkret sidelayout.
