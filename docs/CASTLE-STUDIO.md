# Castle Studio-tema

Castle Studio er et visuelt tema med varme papirfarver, dybe grønne handlingsfarver, Nunito og Alegreya. Det fælles bibliotek er projektagnostisk: handlingsknapper, billedtekst, nøgletal og paneler kan bruges i ethvert produkt. Temaets navn og originalmærke fortæller om dets ophav, ikke om komponenternes anvendelse.

## Den genbrugelige temakilde

[packages/castle-studio.json](../packages/castle-studio.json) er Design Studios tema i format 2. Det indeholder tokens, appearance, brandressourcer og historik. Struktur, indvendig afstand, dele, varianter og native semantik kommer fra core/library.mjs. Læs DESIGN-FOUNDATIONS.md før biblioteket udvides.

Castle Studio-produktet i E:/AI projekter/Castle Studio bruger nu format 2 og bibliotek 2.5.0 med registrerede tynde DOM-adaptere. Den tidligere pakke er bevaret som design/design-v1.original.json. Produktets design/design.json er dets egen temakilde; ændringer i det offentlige startsæt ændrer ikke automatisk produktet. Se INTEGRATION.md og produktets docs/DESIGN.md.

## Forbedringer i temaet

Indhold bruger solide papir- og kontrolflader. Handlingsknapper har en synlig hvilende flade. Billedtekst har en læselig underflade og en solid labelflade; dens indhold forudsætter hverken en scene eller en fortælling. Ghost-handlinger og skygger kan stadig bruge transparens, når det passer til rollen.

Sekundærtekst er mørknet, så den også kan læses på canvas. Primære handlinger bruger dyb grøn med kontrastkontrolleret lys tekst. Blåt tastaturfokus bevares med bibliotekets minimumsbredde. Valgte segmenter bruger en solid kontrolflade og en diskret skygge. De konkrete værdier og begrundelser er registreret i temaets tokens og history.

Nunito bruges til kontroltekst og funktionelle titler. Alegreya italic er et ekspressivt typografisk valg i dette tema. Andre temaer kan bruge helt andre fonte og udtryk på de samme roller. Originale WOFF2-filer og fontlicenser følger temaets brand.assets.

## Brug i et produkt

Start med init PROJECT_DIR --theme castle-studio, og forbind produktets kode med den fælles runtime. Nye produkter bruger action-button, caption, metric-row og de øvrige kanoniske roller fra getComponents(theme). Brug funktionelle varianter som compact, horizontal og expressive; gamle Castle-prægede id'er og varianter er kompatibilitetsaliases.

Produktet ejer placering, handlinger, værdier og genveje. Native toggleknapper bruger aria-pressed og pressed-state. Formularlabels, hjælp og fejl forbindes gennem rendererens id'er. Dialoger anvender native dialog eller en tilgængelig frameworkadapter.

Castle-mærket bruger produktets nye godkendte Logo.svg, registreret som castle-symbol. Den indlejrede castle-studio-logo.svg er den godkendte webkopi med bevaret geometri og proportioner; rodens Logo.svg bevares urørt. Samme webkopi findes i det offentlige tema og produktets tema. Andre produkter registrerer deres egne godkendte logoer. Brandets symbol må ikke efterlignes med tekst, CSS eller en nytegning.

Efter ændringer: validér temaet, synkronisér runtime/CSS og kontrollér relevante skærme. De automatiske kontrast- og formatkontroller erstatter ikke kontrol af et produkts indhold og brugerforløb.

## Kompakt tæthed og fælles layout

Castle-temaet bruger 14 px brødtekst, 13 px kontroltekst og mindst 44 px klikflader. Semantiske paddingtokens er 12/16/8 px, og gap/gapLarge er 8/12 px. Hele ord sætter valgknappers naturlige minimumsbredde; wrap-varianten flytter valg til næste række. Produktet giver panelet plads frem for at bryde almindelige ord.

Brug stack til ydre afstand mellem felter, noter og handlinger. Indlejret scrollindhold bruger scroll-areaens surface-part eller body-variant, så der kun er én synlig panelramme. Hover og tryk bruger synlige flade-/tekstpar for neutral, primary, selected, danger og accent; alle temaer følger samme mekanik. De praktiske regler står i INTEGRATION.md.
