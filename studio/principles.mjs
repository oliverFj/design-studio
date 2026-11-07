import constitution from '../docs/DESIGN-PRINCIPLES.md';
import { renderComponent } from '../core/components.mjs';
import { animateStandard } from '../core/motion.mjs';
import { createGraphicRenderer } from '../core/graphics.mjs';
import { parsePrinciples, renderPrincipleText } from './principles-document.mjs';
import { bindDecorativeGraphics } from './graphic-decorations.mjs';

const document = parsePrinciples(constitution);

function comparison({ label, beforeTitle, before, beforeNote, afterTitle, after, afterNote, caption }) {
  return `<figure class="principles-example principles-lesson"><p class="principles-study-label">${label}</p><div class="principles-comparison">
    <div class="principles-case"><p class="principles-case-label">Undgå <span aria-hidden="true">↙</span></p><div class="principles-diagram" aria-hidden="true">${before}</div><p class="principles-case-title">${beforeTitle}</p><p class="principles-case-note">${beforeNote}</p></div>
    <div class="principles-case"><p class="principles-case-label">Foretræk <span aria-hidden="true">↗</span></p><div class="principles-diagram" aria-hidden="true">${after}</div><p class="principles-case-title">${afterTitle}</p><p class="principles-case-note">${afterNote}</p></div>
    </div><figcaption>${caption} Skitserne er illustrationer, ikke betjening.</figcaption></figure>`;
}

function illustration(id, theme, graphics) {
  if (id === 'opgaven') return `<figure class="principles-example principles-inspiration"><p class="principles-study-label">Visuel hensigt / få præcise greb</p><div class="principles-poster-series">
    <div><div class="principles-poster" data-graphic-decoration tabindex="0" role="img" aria-label="Fokus: Giv én form plads.">${graphics.render('focus',{idPrefix:'principles-focus',decorative:true})}</div><p><span>01 / Fokus</span>Giv én form plads.</p></div>
    <div><div class="principles-poster" data-graphic-decoration tabindex="0" role="img" aria-label="Relation: Lad lagene tale sammen.">${graphics.render('relation',{idPrefix:'principles-relation',decorative:true})}</div><p><span>02 / Relation</span>Lad lagene tale sammen.</p></div>
    <div><div class="principles-poster" data-graphic-decoration tabindex="0" role="img" aria-label="Rytme: Gentag med en hensigt.">${graphics.render('rhythm',{idPrefix:'principles-rhythm',decorative:true})}</div><p><span>03 / Rytme</span>Gentag med en hensigt.</p></div>
    </div><figcaption>Tre studier i temaets grafiske formsprog. Kompositionen giver hvert motiv en hensigt; illustrationernes egne farver og materialer følger dit tema.</figcaption></figure>`;
  if (id === 'hierarki') return comparison({
    label: '02 / Opmærksomhed', beforeTitle: 'Alt beder om opmærksomhed', afterTitle: 'Indholdet får et tyngdepunkt',
    before: '<div class="principles-type-sample principles-type-equal"><span>Din samling</span><strong>En ny begyndelse</strong><small>12 noter · Opdateret i dag</small></div>',
    after: '<div class="principles-type-sample principles-type-directed"><span>Din samling</span><strong>En ny begyndelse</strong><small>12 noter · Opdateret i dag</small></div>',
    beforeNote: 'Titel, kategori og metadata får samme vægt.', afterNote: 'Størrelse, luft og vægt viser læseretningen.',
    caption: 'Samme indhold og samme farver. Forskellen ligger i den typografiske prioritering.',
  });
  if (id === 'tokens') return `<figure class="principles-example"><div class="principles-token-path"><div><span>Værdi</span><code>palette.neutral.0</code></div><span aria-hidden="true">→</span><div><span>Betydning</span><code>color.background.surface</code></div><span aria-hidden="true">→</span><div><span>Anvendelse</span><code>card · root</code></div></div><figcaption>Fra palet til semantisk flade til komponent. En fælles hensigt kan genbruges uden at binde komponenten til en bestemt farve.</figcaption></figure>`;
  if (id === 'farve') return comparison({
    label: '04 / Farvens arbejde', beforeTitle: 'Accenten fylder alle roller', afterTitle: 'Accenten viser det aktuelle',
    before: '<div class="principles-color-sample principles-color-loud"><span>Oversigt</span><span>Samlinger</span><span>Arkiv</span></div>',
    after: '<div class="principles-color-sample principles-color-focused"><span>Oversigt</span><span class="is-current">Samlinger <b>←</b></span><span>Arkiv</span></div>',
    beforeNote: 'Tre lige stærke farveflader konkurrerer.', afterNote: 'En rolig omgivelse giver markeringen betydning.',
    caption: 'Eksemplet bruger accent til at vise det aktuelle område. Andre farveroller skal vælges efter deres konkrete formål.',
  });
  if (id === 'farvetilstande') return `<figure class="principles-example"><div class="principles-layer-canvas"><span class="principles-example-label">Canvas</span><div class="principles-layer-surface"><span class="principles-example-label">Arbejdsflade</span><div class="principles-layer-control">Kontrolflade</div></div></div><figcaption>Temaets aktuelle flader. Skift tema eller farvetilstand øverst og sammenlign lagene. Figuren viser farveroller, ikke en færdig kontrol.</figcaption></figure>`;
  if (id === 'typografi') return comparison({
    label: '06 / Rum viser relationer', beforeTitle: 'Afstandene skjuler relationen', afterTitle: 'Nærhed samler det beslægtede',
    before: '<div class="principles-spacing-sample principles-spacing-loose"><span>Titel</span><i>Min samling</i><span>Beskrivelse</span><i>Noter til næste skridt</i></div>',
    after: '<div class="principles-spacing-sample principles-spacing-grouped"><span>Titel</span><i>Min samling</i><span>Beskrivelse</span><i>Noter til næste skridt</i></div>',
    beforeNote: 'Labelen står lige så langt fra sit felt som fra næste gruppe.', afterNote: 'Lille afstand inden i gruppen; større afstand mellem grupper.',
    caption: 'Gruppering kan bæres af afstand alene. En ekstra panelramme er ikke nødvendig her.',
  });
  if (id === 'komponenter') return comparison({
    label: '07 / Tilstandenes betydning', beforeTitle: 'To betydninger, samme signal', afterTitle: 'Valg og fokus kan skelnes',
    before: '<div class="principles-state-sample principles-state-ambiguous"><span>Samling A</span><span>Samling B</span></div>',
    after: '<div class="principles-state-sample principles-state-distinct"><span>Samling A <b>✓ Valgt</b></span><span>Samling B <b>Fokus</b></span></div>',
    beforeNote: 'Ens konturer gør det uklart, hvad der er valgt.', afterNote: 'Flade og flueben viser valg. Konturen viser tastaturfokus.',
    caption: 'En vedvarende tilstand og brugerens aktuelle fokus har hver sin opgave.',
  });
  if (id === 'moenstre') return comparison({
    label: '08 / Komposition', beforeTitle: 'En ramme om hver del', afterTitle: 'Én samlet arbejdsflade',
    before: '<div class="principles-nesting-sample principles-nesting-heavy"><div><span>Din samling</span><div><span>Seneste noter</span><div><i></i><i></i><i></i></div></div></div></div>',
    after: '<div class="principles-nesting-sample principles-nesting-calm"><div><span>Din samling</span><div><span>Seneste noter</span><div><i></i><i></i><i></i></div></div></div></div>',
    beforeNote: 'Gentagne rammer giver strukturen mere vægt end indholdet.', afterNote: 'Luft og en skillelinje forklarer de indre relationer.',
    caption: 'Indram en gruppe, når den har brug for en grænse. Indlejring alene er ikke en begrundelse.',
  });
  if (id === 'bevaegelse') return `<figure class="principles-example"><div class="principles-motion-track" aria-hidden="true"><span class="principles-motion-marker"></span></div><div class="principles-motion-controls"><div class="principles-replay-control">${renderComponent(theme, 'button', { text: 'Afspil bevægelse', variant: 'tertiary', idPrefix: 'principles-replay' })}</div><span class="principles-motion-status" role="status">240 ms · hurtig start, rolig afslutning</span></div><figcaption>En afgrænset overgang med bibliotekets fælles timing. Ved reduceret bevægelse vises slutpositionen straks.</figcaption></figure>`;
  if (id === 'materialer') return comparison({
    label: '10 / Materiale og læsbarhed', beforeTitle: 'Teksten mister sin underflade', afterTitle: 'Stemning og læsning får plads',
    before: '<div class="principles-gradient-sample principles-gradient-unsafe"><i></i><strong>Plads til<br>nye tanker.</strong></div>',
    after: '<div class="principles-gradient-sample principles-gradient-safe"><i></i><strong>Plads til<br>nye tanker.</strong></div>',
    beforeNote: 'Samme tekstfarve forsvinder mod dele af gradienten.', afterNote: 'En stabil tekstflade lader gradienten give karakter ved siden af.',
    caption: 'Gradienten er den samme i begge skitser. Placeringen afgør, om den støtter eller forstyrrer indholdet; konkrete kontrastpar skal stadig måles.',
  });
  if (id === 'tilgaengelighed') return comparison({
    label: '11 / Flere signaler', beforeTitle: 'Betydningen ligger kun i farven', afterTitle: 'Farve, form og tekst hjælpes ad',
    before: '<div class="principles-status-sample"><span><i class="is-ready"></i>Forslag A</span><span><i class="is-error"></i>Forslag B</span></div>',
    after: '<div class="principles-status-sample"><span><i class="is-ready">✓</i>Forslag A <b>Klar</b></span><span><i class="is-error">!</i>Forslag B <b>Ret fejl</b></span></div>',
    beforeNote: 'To farvede prikker kræver, at man kender og kan skelne farverne.', afterNote: 'Ord og symboler gør status forståelig uden farven.',
    caption: 'Vigtig information skal også have et læsbart signal. Symboler og tekst har stadig brug for tilstrækkelig kontrast.',
  });
  if (id === 'produkter') return `<figure class="principles-example principles-product-study"><p class="principles-study-label">12 / Samme identitet, forskellige opgaver</p><div class="principles-mini-products" aria-hidden="true">
    <div class="principles-mini-product principles-mini-editorial"><div class="principles-mini-art"><i></i></div><span class="principles-mockline"></span><span class="principles-mockline"></span><span class="principles-mockline"></span></div>
    <div class="principles-mini-product principles-mini-form"><span class="principles-mockline"></span><i></i><span class="principles-mockline"></span><i></i><b></b></div>
    <div class="principles-mini-product principles-mini-workspace"><div><i></i><i></i><i></i></div><div><span class="principles-mockline"></span><i></i><span class="principles-mockline"></span><span class="principles-mockline"></span></div></div>
    </div><div class="principles-product-labels"><span>Præsentation</span><span>Formular</span><span>Arbejdsflade</span></div><figcaption>Ét tema skal kunne give både en fortælling, en fokuseret formular og et tæt værktøj karakter. Skitserne viser kompositioner; et faktisk brugerforløb skal stadig afprøves.</figcaption></figure>`;
  return '';
}

export function renderPrinciples(theme) {
  const graphics = createGraphicRenderer(theme);
  const chapters = document.sections.filter(section => section.id !== 'kilder');
  return `<div class="principles ds-layout" data-layout="workspace">
    <header class="principles-hero">
      <div class="principles-hero-copy"><p class="principles-kicker">Stades designgrundlov · 1.0</p><h2>Karakter.<br>Klarhed.<br><em>Omhu.</em></h2><p class="principles-lead">${document.description}</p><a class="principles-start" href="#principle-opgaven">Læs grundloven <span aria-hidden="true">↘</span></a></div>
      <figure class="principles-cover" tabindex="0" aria-label="Form følger en hensigt · animeret illustration"><div class="principles-cover-art" data-graphic-decoration>${graphics.render('poster',{idPrefix:'principles-cover',decorative:true})}</div><figcaption><span>Form følger<br>en hensigt.</span><small>DS / 01—12</small></figcaption></figure>
    </header>
    <div class="principles-overview"><p>Én fælles retning.<br><strong>Mange selvstændige udtryk.</strong></p><div><span>12 principper</span><span>17 kildereferencer</span><span>Fra tokens til produkter</span></div></div>
    <div class="principles-reading-layout"><nav class="principles-index" aria-label="Indhold i Principper"><p class="principles-kicker">I grundloven</p><ol>${chapters.map(section => `<li><a href="#principle-${section.id}"><span>${section.number}</span>${section.shortTitle}</a></li>`).join('')}</ol><a class="principles-sources-link" href="#principle-kilder">Kilder og evidens <span aria-hidden="true">↗</span></a></nav>
    <article class="principles-article" aria-label="Stades designgrundlov"><section class="principles-introduction" aria-labelledby="principles-intro-title"><p class="principles-kicker">Sådan bruges grundloven</p><h2 id="principles-intro-title">Et grundlag for at vælge.</h2>${renderPrincipleText(document.introduction)}<div class="principles-evidence-key"><span>Forskningsfund</span><span>Faglig praksis</span><span>Vores beslutning</span></div><p>Læs begrundelsen, anvend reglerne, og prøv dem på et konkret produkt. Kildetype og begrænsninger står ved hvert princip og i kildelisten.</p></section>
    ${document.sections.map(section => `<section class="principles-chapter${section.id === 'kilder' ? ' principles-references' : ''}" id="principle-${section.id}" tabindex="-1" aria-labelledby="principle-heading-${section.id}"><header class="principles-chapter-heading"><span class="principles-number">${section.number || '↗'}</span><h2 id="principle-heading-${section.id}">${section.title}</h2></header>${illustration(section.id, theme, graphics)}${renderPrincipleText(section.body)}</section>`).join('')}
    <footer class="principles-colophon"><span>Stade</span><p>Et levende grundlag for bevidste valg.<br>Version 1.0 · 5. november 2026</p><a href="#principle-opgaven">Til første princip ↑</a></footer></article></div></div>`;
}

export function bindPrinciples(root) {
  const replay = root.querySelector('.principles-replay-control button');
  const marker = root.querySelector('.principles-motion-marker');
  const status = root.querySelector('.principles-motion-status');
  const graphics = bindDecorativeGraphics(root,{triggerSelector:'.principles-cover,.principles-poster'});
  let animation;
  const replayMotion = () => {
    animation?.cancel();
    marker.style.transform = 'translateX(120px)';
    animation = animateStandard(marker, [{ transform: 'translateX(0)' }, { transform: 'translateX(120px)' }]);
    status.textContent = animation ? 'Afspillet med fælles timing · 240 ms' : 'Slutposition vist uden bevægelse';
  };
  replay?.addEventListener('click', replayMotion);
  return { destroy() { animation?.cancel();graphics.destroy();replay?.removeEventListener('click', replayMotion); } };
}
