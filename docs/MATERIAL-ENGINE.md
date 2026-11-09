# Forslag: en genbrugelig materialemotor

Status: afgrænset udviklingsforslag, 8. november 2026. Ingen materialemotor er udtrukket eller koblet ind i andre produkter som del af dette forslag. Grundlaget er gennemlæsning af FormLabs aktuelle materialekode og `docs/MATERIALEGENERATOR_V2.md`; det er ikke en dokumenteret integration i en anden app.

## Mål

Genbrug arbejdet med parametriske materialekilder, færdige overfladedata og deres kontroller, så en rettelse kan komme flere produkter til gode. Bevar samtidig hvert produkts geometri, betjening, filer og materialeanvendelse. Et fælles bibliotek bør først stabiliseres gennem en konkret ekstra anvendelse.

## Det eksisterende grundlag

Kilderne ligger i `E:/AI projekter/Second Gen/FormLab`:

| Eksisterende moduler | Mulig genbrugelig kerne | Afhængighed, som skal vurderes |
| --- | --- | --- |
| `material-source-brick.js`, `material-source-wood.js`, `material-source-roof.js` | Parametriske kilder, deterministiske frø og fysiske mål. | Familier, profiler og geometri bruger i dag bl.a. Three.js og produktets materialebegreber. |
| `material-bake.js`, `material-source-unit-atlas.js` | Eksplicit CPU-bagning, kort og elementatlas. | Bagerens geometrifactory og understøttede familier er stadig forbundet til FormLabs øvrige moduler. |
| `material-production.js`, `material-source-asset-identity.js` | Produktionsvalg, validering af atlas og identitet af færdige aktiver. | Nuværende regler indeholder bl.a. `wallSourceId`, `roofSourceId`, mur-/tagroller og produktets kompatibilitetsveje. |
| `material-texture.js`, `material-surface-gradient.js` | Afgrænset Three/WebGL-adapter til teksturer og fysiske overfladehældninger. | Motorversion, shaderintegration og ejerlivscyklus skal følge adapteren. |
| `material-source-runtime.js`, `material-source-element-material.js` | Eksisterende reference for at bruge samme data i preview og på bygningen. | Biblioteksregister, globale ready-events og værtens koordinater er ikke allerede en neutral port. |

Dette er kandidater til en opdeling. Hele filer kan ikke uden videre flyttes og kaldes applikationsuafhængige.

## Den foreslåede grænse

En kommende port kan modtage en normaliseret materialeopskrift med familie/frø, fysiske mål og parametre og returnere et versioneret aktiv: farve, normal, højde, ruhed og AO, eventuel elementidentitet/atlas samt mål og ressourceidentitet. Fraværende eller inkompatible data skal have en eksplicit status.

En særskilt renderadapter kan omsætte disse data til den valgte grafikmotor. Værten leverer geometri, koordinatbeskrivelse, åbninger, samlinger, lys og kamera. For FormLab skal det fortsat være muligt at bruge de nuværende konstruktionsshadere og acceptere materialedata uden at ændre værtsgeometrien.

Produktet beholder biblioteksposter, projektfiler, lagring, Gem/Kopi/Brug, historik, valg og jobadoption. Motoren bør ikke overtage disse ansvar gennem et fælles globalt register. Ressourceejerskab og annullering skal have klare grænser; en delt tekstur må ikke frigives af én vilkårlig vært.

## En konkret første pilot

Vælg én eksisterende munkestensopskrift og dens bagte felt-/units-data. Beskriv en lille dataaftale og brug den samme ressource i FormLabs eksisterende produktionspreview og i en enkel, separat overfladeprøve. Pilotens særskilte prøve er en forbruger af samme implementering, ikke en kopieret shader.

Før et udtræk accepteres, skal fysiske mål og alle PBR-kanalers ejeridentitet bevares. Sammenlign billeder ved samme frø, lys, afstande og små kameraflytninger, og kontrollér upload og frigivelse. FormLabs eksisterende `material-source-brick-shimmer-browser.test.mjs`, produktionskontrakter og teksturlivscyklus er relevante startpunkter; software-rendering alene er ikke belæg for alle hardware-GPU'er.

Hvis piloten kræver mange bygningsbegreber eller særlige omgåelser, præciseres grænsen før flere materialefamilier flyttes. Først derefter giver det mening at vælge selvstændigt pakkenavn, versionspolitik og en anden produktintegration. Den aktuelle undersøgelse af flimrende fuger, blændingsfelter og munkestenskantsten kan fortsætte i FormLab uafhængigt af forslaget.

## Nye lokale motorer: forbered genbrug fra starten

- Lad beregningskernen modtage almindelige data og returnere almindelige data. Importér ikke produktets DOM, navigation, globale state eller lagring i kernen.
- Gør måleenheder, frø, formatversion og understøttede egenskaber eksplicitte. Samme input skal give et reproducerbart resultat inden for den beskrevne implementation.
- Hold grafikmotor, workertransport og filadgang i tynde adaptere. Beskriv hvem der ejer og frigiver ressourcer, og hvordan sene resultater afvises ved annullering eller ændrede input.
- Bevar én implementation, som både produktet og en lille selvstændig prøve kan bruge. Kopieret produktkode giver ikke fælles vedligeholdelse.
- Afprøv grænsen med en anden konkret forbruger, før produktets specialtilfælde bliver til fælles API. Uafhængighed kræver tydeligt ansvar; det kræver ikke støtte til alle grafikmotorer fra første version.
