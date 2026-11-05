const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const ids = ['opgaven', 'hierarki', 'tokens', 'farve', 'farvetilstande', 'typografi', 'komponenter', 'moenstre', 'bevaegelse', 'materialer', 'tilgaengelighed', 'produkter', 'kilder'];
const shortTitles = ['Opgave og hensigt', 'Hierarki og opmærksomhed', 'Tokens og betydning', 'Farve og karakter', 'Lys og mørke', 'Typografi og rum', 'Komponenter og adfærd', 'Mønstre og forløb', 'Bevægelse og feedback', 'Gradienter og materialer', 'Tilgængelighed', 'Kvalitet i produkter'];

/** The repository document is the single content source; this renders its small Markdown subset. */
export function parsePrinciples(source) {
  const [opening, ...sections] = source.replace(/\r\n/g, '\n').split(/^## /m);
  const paragraphs = opening.trim().split(/\n\s*\n/);
  return {
    description: escape(paragraphs[1]),
    introduction: paragraphs.slice(2).join('\n\n'),
    sections: sections.map((section, index) => {
      const newline = section.indexOf('\n');
      const heading = section.slice(0, newline).trim();
      return { id: ids[index], number: heading.match(/^\d+/)?.[0], title: escape(heading.replace(/^\d+\.\s*/, '')), shortTitle: shortTitles[index], body: section.slice(newline + 1).trim() };
    }),
  };
}

function inline(text) {
  return text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).map(part => {
    if (part.startsWith('`')) return `<code>${escape(part.slice(1, -1))}</code>`;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (!/^(https:\/\/|#[a-z][a-z0-9-]*$)/i.test(href)) return escape(label);
      return `<a href="${escape(href.startsWith('#s') ? '#principle-' + href.slice(1) : href)}">${escape(label)}</a>`;
    }
    if (part.startsWith('**')) return `<strong>${escape(part.slice(2, -2))}</strong>`;
    return escape(part);
  }).join('');
}

export function renderPrincipleText(source) {
  return source.split(/\n\s*\n/).map(block => {
    if (block.startsWith('### ')) {
      const text = block.slice(4).trim();
      const sourceId = text.match(/^(S\d+)(?: · |$)/)?.[1].toLowerCase();
      return `<h3${sourceId ? ` id="principle-${sourceId}" tabindex="-1"` : ''}>${inline(text)}</h3>`;
    }
    if (block.startsWith('> ')) return `<aside class="principles-evidence" aria-label="Grundlag og kilder"><p>${inline(block.replace(/^> /gm, '').replace(/\n/g, ' '))}</p></aside>`;
    if (block.startsWith('- ')) return `<ul>${block.split('\n').map(line => `<li>${inline(line.replace(/^- /, ''))}</li>`).join('')}</ul>`;
    if (/^\d+\. /.test(block)) return `<ol>${block.split('\n').map(line => `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
  }).join('');
}
