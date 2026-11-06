# Screenshots og produktkort til hjemmesiden

Fælles udgangspunkt for projekter, der laver medier til Oliver Fjordsides hjemmeside. Design Studio er referencecasen: produktkort B, **Samme form, flere udtryk**, og seks screenshots er godkendt og udgivet. Præcedensen er kvalitet, tydelig produktfortælling og sammenlignelige forslag; andre produkter skal finde deres eget motiv og udtryk.

Hjemmesidens `docs/PRODUCT-MEDIA.md` ejer den tekniske mediekontrakt. Projektregistrering, build og udgivelse beskrives i [WEBSITE-SHOWCASE.md](WEBSITE-SHOWCASE.md) og hjemmesidens `docs/ADD-PROJECT.md`.

## Fra produkt til medier

1. Læs produktets aktuelle funktioner, tema og brandregler. Vælg, hvad kortet skal fortælle, og hvilke forskellige sider af produktet screenshots skal vise.
2. Optag screenshotserien fra det byggede produkt med meningsfulde eksempeldata. Gem opskriften og de fulde optagelser sammen med eventuelle beskårne eksportfiler.
3. Lav som udgangspunkt tre tydeligt forskellige produktkort ved første produktion eller en ny visuel retning. Små opdateringer genbruger den godkendte retning.
4. Præsenter kortene samlet, i lille størrelse og i hjemmesidens faktiske billedmål. Lad screenshots kunne åbnes i fuld opløsning. Design Studios selvstændige sammenligningsside er reference for præsentationen.
5. Færdiggør den valgte retning efter brugerens feedback. Kopiér godkendte eksportfiler ind i hjemmesidens egen mediemappe, opdatér projektposten og byg hjemmesiden. Udgiv kun efter brugerens bestilling; en eksisterende bestilling om udgivelse kræver ikke en ekstra bekræftelse.

## Screenshots

- Giv hvert billede ét hovedformål: overblik, en særlig funktion, et resultat eller en vigtig detalje. Antallet følger produktet; der er hverken krav om to billeder eller et fast maksimum. Undgå næsten ens billeder uden en tydelig grund.
- Vis den faktiske grænseflade. Beskæring er tilladt; omarrangerede kontroller, grafiske tilføjelser og konstruerede interfaces hører til produktkort eller tydeligt mærkede kompositioner.
- Brug troværdige eksempeldata og interessante produkttilstande. Undgå private oplysninger, udviklingsværktøjer, tilfældige hovertilstande og ufærdig indlæsning. Vent på lokale skrifter og relevante ressourcer.
- Vælg viewport efter motivet og hold skaleringen sammenhængende i serien. Brug normalt en fast desktopbredde; tilpas højden, så det relevante område kan vises uden afklippede kontroller. Medtag mobil, når mobiloplevelsen har selvstændig betydning.
- Optag skarpt, normalt ved 2× pixeltæthed. Vurdér også motivet i galleriets faktiske størrelse: høj opløsning kan ikke redde et for bredt udsnit med utydeligt hovedmotiv.
- Gem side, eksempeldata, relevante valg, tema, farvetilstand, viewport, pixeltæthed og beskæring. Bevar originalernes proportioner og giv billederne beskrivende alternative tekster.

## Produktkort

**Der må ikke bruges billedgenerering.** Byg med HTML/CSS, SVG, godkendte originalressourcer og faktiske screenshots. Kodebaseret komposition og eksport til en billedfil er tilladt. Genbrug fælles komponenter til UI-fragmenter og bevar produktets brand, skrifter og licenser.

Kortet har ét tydeligt hovedmotiv og skal formidle noget karakteristisk ved produktet. Brug et klart hierarki, få konkurrerende elementer og sparsom tekst. Logo, titel og screenshots er valgfrie. Et logo bruges som godkendt original og må ikke gentegnes.

De tre forslag skal afprøve forskellige visuelle idéer; ændrede baggrundsfarver alene er ikke tre retninger. Forklar kort, hvad hvert forslag fortæller. En komposition er grafik og må ikke præsenteres som en faktisk skærmoptagelse.

Produktkortet er kvadratisk og vurderes både stort, som lille miniature og i hjemmesidens galleri. Brug 1080 × 1080 px som udgangspunkt for rastereksport. Design Studios brug af tre temaer er en produktspecifik idé, ikke en obligatorisk skabelon for alle projekter.

## Kilder, levering og kontrol

Produktet ejer redigerbare mediekilder og optageopskrifter. Hjemmesiden ejer kopier af de færdige, godkendte mediefiler; dens normale build må ikke læse produktets udviklingsmappe. Et medieskift kræver ingen ændring af Design Studios komponentbibliotek eller en designsynkronisering.

Følg hjemmesidens kontrakt: ét kvadratisk `cover` først, derefter screenshots som `image`. Desktopgalleriet er 400 CSS-px højt med billedets egne proportioner. På mobil vises hele motivet i et kvadratisk felt. Produktkortet åbner Om projektet; screenshots kan forstørres. Fjern `placeholder: true`, når et medie er godkendt. Andre projekters placeholders bevares, indtil de har deres egne godkendte medier.

Kontrollér den berørte projektpost efter hjemmesidebuild: kortets kvadratiske format, billedrækkefølge, proportioner, Om projektet, forstørrelse, navigation og Escape samt bred og smal visning. Agentens standard er lokal HTTP-kontrol og relevante statiske offlineprøver; særskilt direkte filkontrol ved en samlet offlineleverance følger [agentarbejdsgangen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion). Optageopskriften foretager HTTP-kontrol og registrerer direkte filkontrol som ikke udført. Kør hjemmesidens `npm run check`. Efter bestilt udgivelse kontrolleres udgiverens bekræftelse og de offentlige filer. Tilpas yderligere kontrol til faktiske ændringer.

## Design Studio som reference

De redigerbare kilder ligger i [media/design-studio-study](../media/design-studio-study/):

| Fil | Ansvar |
| --- | --- |
| `build.mjs`, `covers.css` | Tre passive kortkompositioner fra det fælles bibliotek og et aktuelt showcasebuild til optagelse. |
| `shots.json` | Seks motiver med tema, farvetilstand, viewport, valg og udsnit. |
| `capture.mjs` | Faktiske browseroptagelser, PNG-eksport af kortene og kontrol af sammenligningssiden. |
| `review.mjs`, `review.css` | Selvstændig sammenligningsside med kortvalg, galleriprøve og stor visning. |

Kør fra Design Studios mappe efter normal udviklingsopsætning:

```powershell
node media/design-studio-study/build.mjs
node media/design-studio-study/capture.mjs
```

Optagelsen kræver tilgængelige Node-pakker `playwright` og `sharp` samt en installeret Edge-browser. De er udviklingsværktøjer og kræves ikke for at åbne resultatet. I Codex kan `load_workspace_dependencies` finde de medfølgende pakker; sæt ved behov `NODE_PATH` til den returnerede Node-pakkemappe. `MEDIA_BROWSER_CHANNEL` kan vælge en anden installeret Playwright-kanal. Dette er et casescript, ikke et generelt medie-CLI for alle projekter.

Output ligger i `artifacts/product-media/design-studio/`: `index.html` er den selvstændige præsentation, `covers/` indeholder kortene, `originals/` de fulde skærmoptagelser og `screenshots/` de valgte udsnit. `capture.json` registrerer browser og billedmål, mens `verification.json` beskriver den udførte kontrol. Output er Git-ignoreret og kan gendannes fra kilderne; gem godkendte eksportfiler før ny optagelse. Kun præsentationen kan genbygges med `node media/design-studio-study/review.mjs`, når optagelserne allerede findes.

Den udgivne reference findes i hjemmesidens `assets/projects/studio/`: `cover-themes.png` er kort B, efterfulgt af `01-bibliotek.png` til `06-designmoenstre.png`. Serien viser kataloget, knapfamilien, samme projektoverblik i Studio Light og mørk Nocturne, farvetokens og objekteditoren i Castle Studio. De godkendte eksportfiler versionsstyres i hjemmesidens repository.
