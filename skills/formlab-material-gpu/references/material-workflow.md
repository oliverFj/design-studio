# Kildekort og eksisterende prøver

Stierne nedenfor er relative til FormLabs faktiske projektmappe. Find den i den aktuelle projektkontekst; der er ingen fast installationssti. Kortet er gennemlæst 8. november 2026. Læs aktuelle filer og kontrollér erfaringskildernes hashes; filnavne er indgange, ikke et løfte om uændret implementation. Versionsgrundlaget for de oprindelige Stade-erfaringer ligger i deres `verification` og `sources`.

## Find den berørte vej

| Spørgsmål | Kilde og ansvar |
| --- | --- |
| Hvilken producent og vej bruges faktisk? | `material-production.js`: `materialProductionForRecipe`, `materialSourceProduction`, units/field/kompatibilitetsveje. `docs/MATERIALEGENERATOR_V2.md` forklarer kontrakten. |
| Hvilken overflade beregnes faktisk? | `material-source-runtime.js`: `resolveMaterialSource`, `createMaterialSourceMaterial` og `sourceMaterial`. Sammenhold bibliotekspost, source-id, familie, asset og værtskoordinater før forskellige flader sammenlignes. |
| Bliver generatorens resultat til samme overflade på bygningen? | `material-source-element-material.js`, `material-source-appearance-material.js`, `baked-material.js` og produktionsvalget. Værten leverer bl.a. `masonryUv`, `roofTileData`/`roofTileWorld` eller `roofFibreUv`. |
| Hvor kommer fugens normal fra? | `material-surface-gradient.js` og den konkrete brug i `baked-material.js`/`foundation-pbr-material.js`. Skeln kontinuerte koordinater og filterfodaftryk fra diskret ejerskab og skærm-AA. |
| Hvilken del af blændingen er berørt? | `gothic-detail-geometry.js` danner v2-fladen `gothicZone:'blind-panels'` med `blindingRole:'gothic-masonry'`. `masonry-detail-descriptor.js` vælger `axis:'field'`, og `masonry-study-plan.js` sender den gennem `mapMasonryFieldGeometry` i `masonry-field.js` (herringbone/radial/bond). `masonry-study-shader.js` omsætter feltdomænernes koordinater til shaderen. Den enklere `blindingRole:'back'`-fixture er en anden vej og må ikke stå i stedet for den konkrete v2-flade. |
| Hvem ejer teksturer og sene svar? | `material-texture.js`, `material-source-runtime.js`, `material-source-asset-identity.js` og `material-source-studio.js`. Bevar sidste-ejer-frigivelse og revisionskontrol. |

Ved **Værktøjer → Materialegenerator → Materiale** vises den færdige produktionsshader. **Grundlag** og **3D-model** er kilden; de enkelte teksturkanaler er rå bagte kort. Sammenlign de relevante visninger med samme opskrift og frø. På bygningen kontrolleres den faktiske værtsflade, samling og mapping. Gem, kopi og påføring er særskilte handlinger; undgå at ændre brugerens bibliotek alene for at tage et preview.

Afklar også hvad “kantsten” betegner: materialegeneratorens tegnede **Kantsten og vindue**-overlay (`material-plan-reference.js`) og bygningsmaterialer med eksempelvis `laying:'edge'` er forskellige visninger. Vælg det faktiske mesh og materiale før en kantstensprøve bruges som evidens.

## Vælg den eksisterende prøve

Kommandoerne køres fra FormLab, når den konkrete opgave og miljøet tillader det. Læs den valgte prøve før kørsel; nogle kræver en aktuel bygget `index.html` og starter browser. Kør de berørte prøver, ikke hele tabellen som standard.

| Symptom eller ændring | Prøve | Hvad den kan vise |
| --- | --- | --- |
| Munkestensfuger flimrer ved lille kameraflytning | `node --test material-source-brick-shimmer-browser.test.mjs` | Sammenligner faktisk WebGL ved én pixels fysisk kameraflytning for nye og tidligere source-kort, nær/fjern og mørtelprofil. Et negativt kontroltilfælde skal afsløre den gamle AA-højdefejl. |
| Kantsten eller profilfuger flimrer | `node --test stone-quoin-shimmer-browser.test.mjs` | Farve/normaler under kameraflytning, flere afstande, profilretninger og en tidligere beregningsvej som kontrol. Denne stenprøve dækker ikke uden videre munkestenenes særskilte kantstensvej. |
| Blændingens tilmurede vinduesfelt flimrer | Start med `blinding-materials.test.mjs`, `material-source-detail-browser.test.mjs` og `masonry-finish.browser.test.mjs` som kilde-/fixturegrundlag. | Afklar det faktiske back/blind-panels-mesh, materiale, field-domain og koordinater. Detailprøven sampler bl.a. `outer-profile:arch`; snapshots af herringbone/radial i finishprøven er heller ikke alene temporal evidens. Udvid målrettet fra eksisterende fixture, hvis den konkrete flade ikke allerede er dækket. |
| Relief skjuler eller flytter sten/fuger | `node --test baked-material-relief-browser.test.mjs` | Isoleret normalstyrke og bevarede flader fra begge sider; ikke alene en temporal brugerprøve. |
| Flimren afhænger af produktionsvejen | `node --test material-source-runtime-browser.test.mjs` eller `material-source-element-render-browser.test.mjs` | Produktionsshader og færdige kort. Vælg efter faktisk field/units-vej; se også `material-source-detail-browser.test.mjs` for murværksdetaljer. |
| Delte teksturer, resize eller sen indlæsning | `node --test material-texture.test.mjs material-texture-browser.test.mjs` | Ejerskabslivscyklus i CPU-prøver og faktisk WebGL-upload i browserprøven. |
| Spor-/familieskift eller lukning under indlæsning | `node --test material-source-studio-race-browser.test.mjs` | Aktuelle standardkort, kladder og beskyttelse mod afbrudt eller forældet indlæsning. |
| Produktionsvalg, måleoversættelse eller kompatibilitet ændres | `npm run test:materials:contracts` | Den eksisterende afgrænsede kontraktsamling. Den erstatter ikke visuel shaderkontrol. |

`tests/browser-helpers.mjs` vælger aktuelt SwiftShader. Det skal fremgå af kontrolresultatet; en bestået software-rendererprøve dokumenterer ikke alene brugerens hardware-GPU. Brug produktets eksisterende preview og relevant tilladt browserkontrol til det konkrete synlige forløb. Hvis et værktøj afviser en URL-type, følges miljøets kontrolvej i stedet for at omgå afvisningen.

## Målrettet observation af blændingens tilmuring

Skillens `scripts/observe-blind-panel.mjs` genbruger FormLabs produktionsscene og browserhjælper. Den isolerer det faktiske `blind-panels`-mesh med source-munkesten og observerer farve og normaler ved én pixels kameraflytning i bond, herringbone og radial. Den kompilerer aktuelle kilder i hukommelsen og skriver kun resultatet til standardoutput.

Kør kun ved et relevant blændingsproblem: `node --test ABSOLUT_SKILLMAPPE/scripts/observe-blind-panel.mjs`. Kør fra FormLabs projektmappe, eller angiv mappen i `FORMLAB_PROJECT_DIR`. Scriptet kontrollerer `package.json` og FormLabs materialefiler, før afhængigheder indlæses. FormLabs allerede installerede udviklingsafhængigheder og browser bruges. Ingen produktfiler ændres.

En bestået kørsel betyder, at den forventede flade blev renderet uden de kontrollerede WebGL-/sidefejl. Rapportens `temporalRegressionAsserted:false` er væsentlig: rå pixelforskelle har ingen kalibreret flimmergrænse og må ikke kaldes en bestået temporal regression. Brugerens model, overlappende geometri, skygger, perspektivkamera og fysisk GPU er ikke dækket af denne isolerede prøve.

Hvis parameterændringer tilsyneladende ingen effekt har, findes `tools/audit-material-source-effects.mjs`. Det kan sammenligne højde, normaler og simuleret belysning for udvalgte familier/felter; det er CPU-belæg og ikke en temporal GPU-prøve. Et afgrænset eksempel er:

```text
node tools/audit-material-source-effects.mjs --families=brick --fields=relief --resolution=128 --output=output/material-relief-audit.json
```

Vælg familie og felter efter det faktisk observerede problem. Rapporten er et hjælperedskab, ikke en færdig reproduktion af alle materialefejl.
