# Format 2: fælles bibliotek og tema

Denne vejledning beskriver temaets brand og oprindelse. Komponentstruktur, padding og grundlayout kommer nu fra core/library.mjs. Temaet indeholder visuelle tokens og appearance-overrides. Ældre projekter i format 1 bevarer deres CSS indtil eksplicit migration; se INTEGRATION.md.

# Fjordside

Fjordside-pakken er omsat fra Design System-mappen, især brandguiden v1.2.1, tokens, logoressourcerne og komponenterne. Den bevarer den visuelle hensigt og følger Design Studios fælles navne. Originalmappen er ikke ændret.

## Hensigt

Varmt papir og kalk fylder fladen. Tryksværte bærer teksten. Terracotta bruges sparsomt, til én særlig handling eller markering pr. blik. Kildens 90/8/2-regel er en kompositionsregel; tokenværdier kan ikke alene håndhæve den.

Platypi bærer overskrifter, display og redaktionelle citater. Den lokale Inter-webfont bruges til funktioner, webbrødtekst, labels og tal og overtager den oprindelige Helvetica-staks tilbageholdende rolle. I trykte dokumenter bruges Platypi også som brødtekst. Det offentlige tema arver bibliotekets fælles størrelser og 4px-baserede afstandsskala, som også rummer kildens 8px-rytme.

Kontroller og kort er firkantede. Almindelige kort er flade og har fine kanter; kun løsrevne lag bruger skygge. Hover og tryk ændrer farve og kant, ikke størrelse eller placering. Fokus følger bibliotekets synlige markering på mindst 3 deklarerede pixels uden for kontrollen.

## Indhold

Pakken ligger i packages/fjordside.json. Temaet har sine visuelle tokens, appearance-overrides og brandguide. Det fælles bibliotek giver alle temaer samme katalog; den aktuelle version og roller findes i core/library.mjs. Fjordside tilbyder fire farvevariationer, herunder Havpapir og Skumring, med både lyse og mørke valg. Platypi, sværte, terracotta og de godkendte originalmærker fastholder brandet på tværs af farverne.

Grundroller og startsættets tokennavne er bevaret. I format 2 har alle temaer samme komponentstruktur. Produktets ekstra tokens kan fortsat kræve tilsvarende værdier ved temaskift.

## Brandguiden er en del af pakken

JSON-filens brand-felt indeholder Oliver Fjordsides navn, hensigt og tre principper: rolig, præcis og håndværksmæssig. Otte emner beskriver logo og ordmærke, farver, typografi, stemme, materialer og billeder, komposition, flader og mål samt visuelle tilstande.

Hvert emne har konkrete anbefalinger og ting, der skal undgås, samt henvisninger til de tokens og komponenter, som det vedrører. Agenter skal læse disse regler sammen med de visuelle opskrifter. Reglerne er kildebaserede; hvor kilden viser et personligt portfolio, er det markeret som en reference frem for en fælles produktarkitektur.

Logoet har mindst 20px størrelse og en frizone på mindst halvdelen af mærkets bredde. Ved et ordmærke står mærket til venstre, optisk centreret på x-højden. Ordmærket er Platypi, vægt 300 og −0.024em fra 26px og op, vægt 400 derunder. Mærket må ikke omtegnes, roteres, få outline, skygge eller gradient. På sværtebaggrund vælges papirvarianten, hvis terracotta mister kontrast.

Stemmeguiden beskriver korte sætninger, konkrete verber, første person som personlig afsender og almindeligt dansk. Den afviser buzzwords, superlativer og udråbstegn. Brandets afsender og personlige indhold overføres ikke automatisk til andre produkter.

Brandguiden kan ses og redigeres på **Temaet**; originalmærker og kilder ligger under **Brand, originaler og kilder**. sources-feltet peger på de oprindelige lokale kilder, hvis en agent har brug for mere sammenhæng. Selve reglerne og de indlejrede ressourcer er tilgængelige i pakken uden adgang til originalmappen.

## Bevidste tilpasninger

- Primary er sværte. Terracotta findes som den særlige accent-variant; alle handlinger bliver ikke accentfarvede.
- Kort har default/subtle-border, subtle, inverse og floating. Det eksisterende navn elevated er bevaret for kompatibilitet, men almindelige kort får fortsat ingen skygge.
- Den fælles knapopskrift bruger rolig inversion på hover. Kildens helt præcise hover pr. variant er forenklet i det fælles bibliotek; temaet kan give godkendte visuelle behandlinger.
- Små operationelle labels og hjælpetekst bruger kontrastkontrolleret sværte. Kildens svageste metadatalabel er gjort mørkere.
- Checkboxens lille diamant og switchens track følger et native inputs checked-tilstand.
- Radiovalget bevarer en native rund kontrol; den håndtegnede radiogeometri er ikke rekonstrueret.
- choice-field bruger en native select i det fælles bibliotek. Popup og tastaturadfærd følger platformens native kontrol; produktet håndterer værdien og events.
- Notice er mappet til den fælles alert-rolle som en besked i dokumentstrømmen. Ingen toast eller automatisk timeout er tilføjet.
- Kildens website-, portfolio- og slidelayouts er beskrevet som kompositionsreferencer. Navigation, brugerforløb og personligt indhold er fortsat projektspecifikke.
- Billedplaceholderens striber er dokumenteret som en placeholder og er ikke gjort til en dekorativ systembaggrund. Portrætter og arbejdsprøver er ikke leveret i kilden.

## Skrifter og logoer følger JSON-filen

brand.assets indlejrer de fire originale logo-SVG'er, Platypi normal og kursiv, de fælles Inter-/Roboto Mono-webfonte og deres uændrede OFL-licenser som base64. De følger derfor med, når pakken gemmes, eksporteres eller importeres. brand.logos forbinder mærkerne med deres anvendelse og baggrunds-/forgrundstokens.

De normale og kursive Platypi-variablefonte dækker vægt 300–800. De medfølgende TTF-originaler er konverteret til WOFF2 uden subsetting; tegn, glyffer, advance widths og variable aksler er bevaret. Originalerne ligger fortsat under assets/fjordside/fonts. Proveniens og SHA-256 er registreret i assets/fonts/manifest.json. CSS-genereringen indlejrer de nødvendige font-face-definitioner fra pakkens data. Bevar de medfølgende OFL-licenser ved videre distribution af fontfilerne.

De fire standardmærker er uændrede kopier af kildens terracotta-, papir-, sværte- og currentColor-mærke. Brug de faktiske SVG-data; rekonstruer ikke monogrammet. Standardfilerne har ingen indbygget frizone. Kildens særskilte avatarvarianter findes fortsat i originalmappen og er ikke indlejret i denne pakke.

currentColor-mærket er til sikker inline-brug og arver kun farve i den sammenhæng. En ekstern SVG i et img-element arver ikke forælderens CSS-farve. Brandguide-previewet kan vise den godkendte forgrundsfarve uden at ændre den indlejrede original.

assets/fjordside i systemmappen indeholder fortsat de oprindelige ledsagerfiler som reference. Pakkens indlejrede ressourcer er kilden for eksport og integration.

## Brug i et fremtidigt projekt

Start med:

~~~powershell
node tools/cli.mjs init "PROJECT_DIR" --theme fjordside
~~~

init opretter projektets designpakke, genereret CSS og konfiguration og udpakker de medfølgende ressourcer til design/assets. CSS indeholder fontdefinitionerne. Projektets agent forbinder produktet med CSS og bruger de udpakkede logoer efter projektets normale assetmekanisme. Bevar fontlicensen sammen med ressourcerne.

Ressourcer kan også udpakkes særskilt:

~~~powershell
node tools/cli.mjs assets packages/fjordside.json --out "PROJECT_DIR/design/assets"
~~~

Følg derefter den almindelige integration. Læs brandguiden før nye visuelle valg, genbrug temaets tokens og det fælles bibliotek og registrer produktets faktiske komponentimplementeringer. Denne pakke kopierer ikke kildens React-logik eller websiteforløb.

## Kontrol

~~~powershell
node tools/cli.mjs validate packages/fjordside.json
node tools/cli.mjs compare packages/studio-light.json packages/fjordside.json
node tools/cli.mjs compare packages/midnight-editorial.json packages/fjordside.json
node tools/cli.mjs css packages/fjordside.json --out artifacts/fjordside.css
~~~

Den genererede CSS er afledt af JSON. Designpakken er kilden. Se også docs/INTEGRATION.md.
