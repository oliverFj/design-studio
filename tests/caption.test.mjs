import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateCSS, getComponents, validatePackage } from '../core/engine.mjs';
import { createComponentFactory, renderComponent } from '../core/components.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';
import { dom } from './support/dom.mjs';

const theme = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));

test('caption labels keep full font metrics and a text-relative inset in every theme', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const pack = theme(id), styles = getComponents(pack).caption.parts.label.styles;
    assert.equal(validatePackage(pack).valid, true);
    assert.equal(styles.fontFamily, '{typography.font.body}', id + ': the practical label has its own font role');
    assert.equal(styles.fontStyle, 'normal');
    assert.equal(styles.lineHeight, 'normal', id + ': the label uses its font metrics rather than a desktop-control line box');
    assert.equal(styles.boxSizing, 'border-box');
    assert.equal(styles.alignItems, 'center');
    assert.equal(styles.justifyContent, 'center');
    assert.equal(styles.flexShrink, '0', id + ': a constrained caption must not squeeze the label vertically');
    assert.match(styles.padding, /max\(calc\(\{space\.component\.paddingCompact\} \/ 2\), 0\.25em\)/);
    assert.match(styles.padding, /max\(\{space\.component\.paddingCompact\}, 0\.5em\)/);
    assert.equal(styles.maxWidth, '100%');
    assert.equal(styles.whiteSpace, 'normal');
    assert.equal(styles.overflowWrap, 'anywhere');
    for (const property of ['height', 'maxHeight', 'position', 'top', 'transform']) assert.equal(styles[property], undefined, id + ': the label grows with its content');
    const css = generateCSS(pack, { scope: '#caption-test' });
    assert.match(css, /\.ds-caption__label[^{}]*\{[^}]*display: inline-flex;[^}]*font-style: normal;[^}]*line-height: normal;/);
    assert.match(css, /padding: max\(calc\(var\(--ds-space-component-paddingCompact\) \/ 2\), 0\.25em\) max\(var\(--ds-space-component-paddingCompact\), 0\.5em\);/);
  }
});

test('long and accented caption labels remain complete and independent of expressive caption text', () => {
  const label = 'Vigtig information om ældre illustrationer & tilgængelighed';
  for (const id of ['castle-studio', 'castle-studio-v2', 'fjordside', 'midnight-editorial']) {
    const pack = theme(id), create = createComponentFactory(pack, { document: dom() });
    const node = create('caption', { slots: { label, text: 'En kort beskrivelse af indholdet.' } });
    assert.equal(node.querySelector('.ds-caption__label').textContent, label);
    assert.equal(node.querySelector('.ds-caption__text').textContent, 'En kort beskrivelse af indholdet.');
    assert.match(renderComponent(pack, 'caption', { slots: { label } }), /illustrationer &amp; tilgængelighed/);
    const caption = getComponents(pack).caption;
    assert.equal(caption.parts.label.styles.fontStyle, 'normal');
    assert.equal(caption.parts.text.styles.fontStyle, id.startsWith('castle-') ? 'italic' : 'normal', 'the description retains its intended theme identity');
  }
});
