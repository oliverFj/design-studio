# Brug Design Studio i et produkt

## Tilknyt og synkronisér

~~~sh
node tools/cli.mjs init "E:/produkt" --theme studio-light
~~~

Init kræver en eksisterende projektmappe og opretter følgende uden at overskrive filer:

- design/design.json: projektets tema i format 2.
- design/design.css: temaets tokens og bibliotekets fælles komponent-CSS.
- design/runtime/: engine, contract, library, quality og components som browserkompatible moduler.
- design/assets/: godkendte brandoriginaler og licenser, hvis temaet indeholder dem.
- design-studio.project.json: filstier, scope, biblioteksudgave og registrerede produktadaptere.
- En anvisning i AGENTS.md; eksisterende produktregler bevares.

Efter ændringer i tema eller fælles bibliotek:

~~~sh
node tools/cli.mjs sync "E:/produkt"
~~~

Sync opdaterer runtime og CSS fra systemets kilder. Kopieret runtime må ikke blive en parallel lokal biblioteksudgave.

## Brug de faktiske komponenter

Indlæs design/design.css gennem produktets normale stylesheetmekanisme. Komponenternes roots ligger inden i et ds-scope-element.

~~~js
import { createComponent } from './design/runtime/components.mjs';

const card = createComponent(theme, 'card', {
  idPrefix: 'collection',
  slots: {
    header: { tag: 'h3', text: 'Min samling' },
    body: { tag: 'p', text: 'Indholdet bestemmes af produktet.' },
    footer: { component: 'button', options: { text: 'Gem' } },
  },
}, { document });

document.querySelector('.ds-scope').append(card);
card.querySelector('button').addEventListener('click', saveCollection);
~~~

createComponent returnerer native DOM. renderComponent(theme, id, options) returnerer tilsvarende sikker HTML, når produktet arbejder med tekstbaseret rendering. Tekst escapes; slots bruger deklarative noder eller andre fælles komponenter, ikke vilkårlig HTML.

Formularfelter bruger label, hint, error og idPrefix. Biblioteket forbinder for/id og aria-describedby. Controls bevarer native type, disabled og checked. Lad produktet håndtere værdier, events og state.

Frameworkadaptere må forbinde komponenter til React, Vue eller lignende, men skal bevare fælles dele, native semantik og bibliotekets grundlayout. Registrér adaptere i components-feltet med verificerede file og export. Skærmlayout og routing er produktspecifikke.

Handlingsknappen action-button har slots icon, label og shortcut. iconAssetId kan vælge en godkendt logo- eller billedressource fra temaets brand.assets; billedet bevarer proportionerne. Brug den til en handling med symbol og tekst; forbind genvejen i produktet, hvis den vises. Billedtekst caption og nøgletal metric-row har ingen produktspecifik indholdslogik. Se DESIGN-FOUNDATIONS.md for valg mellem rollerne.

## Tema og tokens

Temaet indeholder tokens, brandguide, historik og eventuelt appearance. Det indeholder ikke komponentdefinitioner. Brug bibliotekets positive semantiske spacingtokens til tæthed. appearance kan ændre godkendte visuelle egenskaber, men ikke padding, gap eller struktur.

Produktets sidelayout kan bruge CSS-variabler som --ds-space-6 og --ds-color-background-canvas. Token-id'ers punktummer bliver bindestreger; store bogstaver bevares. Biblioteket ejer komponenternes interne layout.

## Afstande og indlejrede flader

Brug den uindrammede stack til afstand mellem direkte børn: standard bruger space.component.gapLarge, compact bruger space.component.gap. Felter og valggrupper ejer stadig deres interne padding og afstand; undgå ekstra lokale margins på samme grænse. Produktet vælger grupperne, biblioteket leverer rytmen.

Native details beholder almindeligt block-layout. Efter summary placeres en separat stack med varianten disclosure-body. Den bruger gapLarge fra overskriften og gap mellem børnene, og fylder kun, når details er åben. Sæt ikke flex-stack på selve details-roden.

En contained scroll-area ejer den synlige flade, kant, radius og klipning. Den indre card, inspector eller toolbar får scroll-areaens surface-part: dens ekstra ramme fjernes, mens originale dele og indvendig spacing bevares. Når et allerede indrammet kort har en fast header, bruges body-varianten på det scrollende indhold. Tilføj ikke endnu en indrammet wrapper alene til scrollbarens placering.

Valggrupper bruger indholdsbaserede minimumsbredder. Brug segmented-control med wrap til lange labels og mange valg; gruppen kan gå over flere rækker. Giv produktpanelet tilstrækkelig bredde. Del ikke almindelige ord vilkårligt for at presse dem ind. Brug divider med vertical til funktionelle grupper i en vandret toolbar frem for store tomme mellemrum.

## Synlige interaktioner og tæthed

Handlingsfamilierne neutral, primary, selected, danger og accent har hver fire tokens under color.action: eksempelvis neutralHover, neutralHoverText, neutralActive og neutralActiveText. Biblioteket binder disse flade-/tekstpar til de relevante roller og varianter; synlig hover må ikke bero på en lille tekstfarveændring alene. Vedvarende valg og aria-pressed bevares under hover og tryk, og disabled er undtaget.

Temaer justerer tæthed med positive space.component.padding, paddingLarge, paddingCompact, gap og gapLarge samt typografitokens. Bevar bibliotekets minimumsklikflader. De interne --ds-interaction-variabler er komponentlokale implementeringsdetaljer og må ikke sættes som globale tema-overrides.

## Brand og dialoger

Læs relevante brandregler og brug godkendte originaler fra design/assets. Bevar proportioner og licenser. Temaets indlejrede skrifter genererer selvstændige @font-face-regler. Se BRANDGUIDE.md.

Dialoger skal følge native dialog-semantik eller produktets etablerede tilgængelige adapter. Visuelle dialogeksempler er ikke i sig selv modaladfærd. Produktet styrer åbning, lukning og events.

## Tidligere produkter

~~~sh
node tools/cli.mjs migrate "E:/produkt/design/design.json" --out "E:/produkt/design/theme-v2.json"
~~~

Originalen bevares. Ukendte komponentroller skal registreres i det fælles bibliotek først. Tilpas produktets markup og tidligere paddingregler før temaet bliver aktivt, og synkronisér derefter. Format 1 kan fortsat generere sin hidtidige CSS, indtil produktet migreres.
