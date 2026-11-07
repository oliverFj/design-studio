import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMPOSITIONS } from '../patterns/catalog.mjs';
import { mountCompositionGallery, createGalleryState } from '../patterns/gallery.mjs';
import { dom, fire } from './support/dom.mjs';
import { createPatternIllustrator } from '../patterns/illustrations.mjs';
import { GRAPHIC_FAMILY_IDS } from '../core/graphic-tokens.mjs';

const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));

test('all pattern illustrations follow their family and isolate SVG definitions without adding controls', () => {
  const document = dom();
  const usedIds = new Set();
  const descendants = element => element.children.flatMap(child => [child, ...descendants(child)]);
  for (const family of GRAPHIC_FAMILY_IDS) {
    const illustrate = createPatternIllustrator({ ...theme, graphics: { family } }, { document });
    const signatures = new Set();
    for (const id of Object.keys(COMPOSITIONS)) {
      const svg = illustrate(id);
      assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
      assert.equal(svg.getAttribute('data-family'), family);
      assert.equal(svg.getAttribute('aria-hidden'), 'true');
      assert.equal(svg.getAttribute('focusable'), 'false');
      const localIds = new Set();
      for (const element of svg.querySelectorAll('[id]')) {
        const id = element.getAttribute('id');
        assert.ok(!usedIds.has(id), 'SVG definitions must be unique across the gallery: ' + id);
        usedIds.add(id); localIds.add(id);
      }
      for (const element of [svg, ...descendants(svg)]) {
        for (const [, value] of element.attributes) for (const [, id] of value.matchAll(/url\(#([^)]*)\)/g)) {
          assert.ok(localIds.has(id), 'SVG paint and clip references must resolve inside their own illustration: ' + id);
        }
      }
      for (const element of illustrate(id).querySelectorAll('[id]')) {
        const repeatedId = element.getAttribute('id');
        assert.ok(!usedIds.has(repeatedId), 'Repeated instances must not share SVG definitions: ' + repeatedId);
        usedIds.add(repeatedId);
      }
      if (family === 'anatomy' && id === 'parameter-workbench') {
        assert.deepEqual(svg.querySelectorAll('text').map(element => element.textContent), ['8', '3'],
          'native construction preserves the parameter readouts');
      }
      assert.equal(svg.querySelectorAll('[tabindex]').length, 0);
      assert.ok(svg.querySelectorAll('[data-part]').length);
      const signature = JSON.stringify(svg.querySelectorAll('path').map(node => node.getAttribute('d')))
        + JSON.stringify(svg.querySelectorAll('rect').map(node => [...node.attributes]));
      assert.ok(!signatures.has(signature), family + ': ' + id + ' needs a distinct composition');
      signatures.add(signature);
    }
  }
});

test('vertical choices and current preview agree without losing drafts, focus or the browsing position', () => {
  const document = dom(), state = createGalleryState();
  const mounted = mountCompositionGallery(theme, { document, state }); document.body.append(mounted.element);
  const root = mounted.element, viewport = root.querySelector('.composition-pattern-rail');
  viewport.scrollTop = 360;
  assert.equal(root.querySelectorAll('[data-pattern-nav]').length, Object.keys(COMPOSITIONS).length);
  const form = root.querySelector('[data-pattern-nav="form"]'); form.focus(); fire(form, 'click');
  assert.equal(document.activeElement, form);
  assert.equal(form.getAttribute('aria-current'), 'true');
  assert.equal(viewport.scrollTop, 360);
  const name = root.querySelector('#patterns-form-name-control'); name.value = 'Bevar dette'; fire(name, 'input');
  fire(root.querySelector('[data-pattern-nav="editor"]'), 'click');
  fire(root.querySelector('[data-action="reset-pattern"]'), 'click');
  assert.equal(document.activeElement, root.querySelector('[data-action="reset-pattern"]'));
  fire(root.querySelector('[data-pattern-nav="form"]'), 'click');
  assert.equal(root.querySelector('#patterns-form-name-control').value, 'Bevar dette');
  assert.equal(root.querySelectorAll('[aria-current="true"]').filter(node => node.getAttribute('data-pattern-nav')).length, 1);
  mounted.destroy();
});

test('related patterns reveal the selected item vertically in the shared viewport', () => {
  const document = dom(), state = createGalleryState();
  const mounted = mountCompositionGallery(theme, { document, state });
  const root = mounted.element, viewport = root.querySelector('.composition-pattern-rail'), moves = [];
  const related = root.querySelector('[data-pattern]'), id = related.getAttribute('data-pattern');
  viewport.getBoundingClientRect = () => ({ top: 10, bottom: 210 });
  root.querySelector('[data-pattern-nav="'+id+'"]').getBoundingClientRect = () => ({ top: 310, bottom: 390 });
  viewport.scrollBy = options => moves.push(options);
  fire(related, 'click');
  assert.deepEqual(moves, [{ top: 180, behavior: 'instant' }]);
  assert.equal(state.selected, id);
  assert.equal(viewport.getAttribute('tabindex'), '0');
  assert.equal(root.querySelector('.composition-gallery-heading'), null);
  assert.equal(root.querySelector('[data-pattern-scroll]'), null);
  mounted.destroy();
});

test('catalog recovers an unknown selection and gives references a readable structure', () => {
  const document = dom(), state = { selected: 'removed-example', drafts: {} };
  const mounted = mountCompositionGallery(theme, { document, state });
  assert.equal(state.selected, 'editor');
  assert.equal(mounted.element.querySelector('[data-preview]').getAttribute('data-preview'), 'editor');
  assert.ok(mounted.element.querySelector('.composition-behaviour-list'));
  assert.ok(mounted.element.querySelector('.composition-component-tags'));
  assert.equal(mounted.element.querySelectorAll('pre').length, 1, 'only the optional integration code uses a code block');
  mounted.destroy();
});

test('pattern switches animate immediately and cancel superseded transitions', () => {
  const document=dom(), create=document.createElement, effects=[];
  document.createElement=tag=>{
    const node=create(tag);
    node.animate=(frames,options)=>{
      const effect={frames,options,cancelled:false,finished:new Promise(()=>{}),cancel(){this.cancelled=true;}};
      effects.push(effect);return effect;
    };
    return node;
  };
  const state=createGalleryState(), mounted=mountCompositionGallery(theme,{document,state});
  assert.equal(effects.length,0,'initial mounting stays still');
  mounted.content.scrollTop=420;mounted.rail.scrollTop=300;
  fire(mounted.element.querySelector('[data-pattern-nav="form"]'),'click');
  assert.equal(state.selected,'form');
  assert.equal(mounted.content.scrollTop,0);
  assert.equal(mounted.rail.scrollTop,300);
  const first=[...effects];
  assert.equal(first.length,4);
  assert.ok(first.every(effect=>effect.options.duration===240));
  fire(mounted.element.querySelector('[data-pattern-nav="editor"]'),'click');
  assert.equal(state.selected,'editor');
  assert.ok(first.every(effect=>effect.cancelled));
  mounted.destroy();
  assert.ok(effects.every(effect=>effect.cancelled));
});
