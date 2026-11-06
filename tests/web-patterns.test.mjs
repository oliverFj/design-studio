import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { renderComponent } from '../core/components.mjs';
import { resolveTokens } from '../core/engine.mjs';
import { mountComposition } from '../patterns/compositions.mjs';
import { dom, fire } from './support/dom.mjs';
const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url)));

test('shared links and images reject executable URLs and preserve native semantics', () => {
  for (const href of ['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,hello']) {
    assert.throws(() => renderComponent(theme, 'link', { href }), /Unsupported component URL/);
    assert.throws(() => renderComponent(theme, 'image', { src: href, alt: '' }), /Unsupported component URL/);
  }
  assert.match(renderComponent(theme, 'link', { text: '<Læs>', href: '#indhold' }), /href="#indhold"[^>]*>&lt;Læs&gt;<\/a>/);
  assert.throws(() => renderComponent(theme, 'image', { src: './billede.png' }), /explicit alt/);
  const image = renderComponent(theme, 'image', { src: './billede.png', alt: '', caption: '' });
  assert.match(image, /<figure/); assert.match(image, /alt=""/); assert.match(image, /<figcaption[^>]*hidden/);
});

test('header navigation marks both responsive copies and moves focus to a real destination', () => {
  const document = dom(), mounted = mountComposition(theme, 'site-header', { document });
  document.body.append(mounted.element);
  const links = mounted.element.querySelectorAll('[data-destination]');
  fire(links[1], 'click');
  assert.equal(mounted.state.selected, 'samling');
  assert.equal(document.activeElement.id, 'composition-site-header-samling');
  assert.equal(links.filter(link => link.getAttribute('aria-current') === 'location').length, 2);
  const details = mounted.element.querySelector('details'); details.open = true;
  fire(details, 'keydown', { key: 'Escape' });
  assert.equal(details.open, false); assert.equal(document.activeElement.tagName, 'SUMMARY');
  mounted.destroy();
});

test('gallery dialog shows the full selected image and returns focus to its opener', () => {
  const document = dom(), mounted = mountComposition(theme, 'image-gallery', { document });
  document.body.append(mounted.element);
  const dialog = mounted.element.querySelector('dialog');
  // Model native methods here; real modal focus containment and Escape are browser checks.
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; fire(dialog, 'close'); };
  const opener = mounted.element.querySelector('[data-image="1"]');
  fire(opener, 'click');
  assert.equal(dialog.open, true); assert.equal(mounted.state.selected, 1);
  assert.equal(dialog.querySelector('img').getAttribute('alt'), 'Selvstændige dele har en synlig forbindelse.');
  assert.equal(dialog.querySelector('.ds-dialog__body').tagName, 'DIV');
  fire(dialog.querySelector('button'), 'click');
  assert.equal(mounted.state.selected, null); assert.equal(document.activeElement, opener);
  mounted.destroy();
});


test('sample images follow every theme while supplied image sources stay unchanged', () => {
  const sources = new Set();
  const assertPalette = (svg, palette, label) => {
    const gradients = new Set([...svg.matchAll(/<(?:linearGradient|radialGradient)\b[^>]*\sid="([^"]+)"/g)].map(match => match[1]));
    for (const [, paint] of svg.matchAll(/(?:fill|stop-color)="([^"]+)"/g)) {
      const reference = /^url\(#([^()\s]+)\)$/.exec(paint);
      if (reference) assert.ok(gradients.has(reference[1]), label + ': sample gradients resolve inside the SVG');
      else assert.ok(paint === 'none' || palette.has(paint), label + ': sample colors belong to the selected palette');
    }
  };
  for (const file of readdirSync(new URL('../packages/', import.meta.url)).filter(file => file.endsWith('.json'))) {
    const pack = JSON.parse(readFileSync(new URL('../packages/' + file, import.meta.url)));
    const palette = new Set(Object.values(resolveTokens(pack)));
    const document = dom();
    const sample = renderComponent(pack, 'image');
    const source = sample.match(/src="([^"]+)"/)[1];
    sources.add(source);
    for (const id of ['hero', 'image-gallery']) {
      const mounted = mountComposition(pack, id, { document });
      for (const image of mounted.element.querySelectorAll('img')) {
        const svg = decodeURIComponent(image.getAttribute('src').split(',')[1]);
        const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(match => match[1]);
        assert.ok(fills.length > 1);
        assertPalette(svg, palette, file);
      }
      mounted.destroy();
    }
    const svg = decodeURIComponent(source.split(',')[1]);
    assertPalette(svg, palette, file);
    assert.match(renderComponent(pack, 'image', { src: './original.png', alt: 'Original' }), /src="\.\/original.png"/);
  }
  assert.ok(sources.size > 1, 'changing themes changes the sample image');
});
