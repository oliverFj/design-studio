import test from 'node:test';
import assert from 'node:assert/strict';
import { createViewMemory } from '../studio/view-state.mjs';
import { dom } from './support/dom.mjs';

function fixture() {
  const document = dom(), root = document.createElement('div'); document.body.append(root);
  const memory = createViewMemory({ document });
  const mount = (attributes = { id: 'current-input' }) => {
    root.replaceChildren();
    const navigation = document.createElement('nav'); navigation.className = 'ds-app-navigation';
    const link = document.createElement('button'); link.setAttribute('data-view', 'tokens'); navigation.append(link);
    const main = document.createElement('main'); main.className = 'ds-app-content'; main.setAttribute('tabindex', '0');
    const content = document.createElement('section'); content.className = 'ds-panel-content'; content.setAttribute('tabindex', '0');
    const inspector = document.createElement('aside'); inspector.className = 'ds-panel-side'; inspector.setAttribute('tabindex', '0');
    const input = document.createElement('input'); for (const [key, value] of Object.entries(attributes)) input.setAttribute(key, value); content.append(input);
    main.append(content, inspector); root.append(navigation, main);
    return { navigation, link, main, content, inspector, input };
  };
  return { document, root, memory, mount };
}

test('canvas and inspector scroll belong to each view and mode while navigation follows across views', () => {
  const { root, memory, mount } = fixture();
  let nodes = mount(); nodes.content.scrollTop = 320; nodes.content.scrollLeft = 24; nodes.inspector.scrollTop = 460; nodes.inspector.scrollLeft = 18; nodes.navigation.scrollTop = 80; nodes.navigation.scrollLeft = 6;
  memory.capture(root, 'components:grid');
  nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(nodes.content.scrollTop, 0); assert.equal(nodes.content.scrollLeft, 0);
  assert.equal(nodes.inspector.scrollTop, 0); assert.equal(nodes.inspector.scrollLeft, 0);
  assert.equal(nodes.navigation.scrollTop, 80); assert.equal(nodes.navigation.scrollLeft, 6);
  nodes.content.scrollTop = 720; nodes.inspector.scrollTop = 130; nodes.navigation.scrollTop = 140; memory.capture(root, 'tokens:list');
  nodes = mount(); memory.restore(root, 'components:grid');
  assert.equal(nodes.content.scrollTop, 320); assert.equal(nodes.content.scrollLeft, 24);
  assert.equal(nodes.inspector.scrollTop, 460); assert.equal(nodes.inspector.scrollLeft, 18);
  assert.equal(nodes.navigation.scrollTop, 140);
  memory.capture(root, 'components:grid'); nodes = mount(); memory.restore(root, 'components:list');
  assert.equal(nodes.content.scrollTop, 0);
  assert.equal(nodes.inspector.scrollTop, 0);
  memory.capture(root, 'components:list'); nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(nodes.content.scrollTop, 720);
  assert.equal(nodes.inspector.scrollTop, 130);
});

test('a collapsed inspector sends its previous control focus to the canvas and preserves both positions', () => {
  const { document, root, memory, mount } = fixture();
  let nodes = mount(); nodes.input.remove(); nodes.inspector.append(nodes.input); nodes.input.focus();
  nodes.content.scrollTop = 300; nodes.inspector.scrollTop = 600; memory.capture(root, 'tokens:list');
  nodes = mount(); nodes.input.remove(); nodes.inspector.append(nodes.input); nodes.inspector.hidden = true;
  memory.restore(root, 'tokens:list');
  assert.equal(document.activeElement, nodes.content);
  assert.equal(nodes.content.scrollTop, 300); assert.equal(nodes.inspector.scrollTop, 600);
  // A browser can expose zero scroll for display:none; it must not overwrite the saved position.
  nodes.inspector.scrollTop = 0; memory.capture(root, 'tokens:list'); nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(nodes.inspector.scrollTop, 600);
});

test('views without a panel canvas keep the app content fallback', () => {
  const { document, root, memory, mount } = fixture();
  let nodes = mount(); nodes.content.className = ''; nodes.main.scrollTop = 420; nodes.main.scrollLeft = 20; nodes.input.focus();
  memory.capture(root, 'overview:grid'); nodes = mount(); nodes.content.className = ''; nodes.input.remove(); memory.restore(root, 'overview:grid');
  assert.equal(nodes.main.scrollTop, 420); assert.equal(nodes.main.scrollLeft, 20);
  assert.equal(document.activeElement, nodes.main);
});

test('DOM replacement restores the latest focus by safe attribute comparison without scrolling', () => {
  for (const attribute of ['id', 'data-view', 'data-token', 'data-component', 'data-mode', 'data-action']) {
    const { document, root, memory, mount } = fixture();
    const value = 'name" ] .unexpected-selector #test';
    let nodes = mount({ [attribute]: value }); nodes.input.focus(); nodes.content.scrollTop = 220;
    memory.capture(root, 'tokens:list'); nodes = mount({ [attribute]: value });
    const nativeFocus = nodes.input.focus.bind(nodes.input); let options;
    nodes.input.focus = value => { options = value; nativeFocus(); };
    memory.restore(root, 'tokens:list');
    assert.equal(document.activeElement, nodes.input, attribute);
    assert.deepEqual(options, { preventScroll: true });
    assert.equal(nodes.content.scrollTop, 220);
  }
});

test('navigation changes keep the latest navigation control instead of reviving old content focus', () => {
  const { document, root, memory, mount } = fixture();
  let nodes = mount(); nodes.input.focus(); memory.capture(root, 'tokens:list');
  nodes = mount(); memory.restore(root, 'components:grid');
  nodes.link.focus(); memory.capture(root, 'components:grid');
  nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(document.activeElement, nodes.link);
});

test('missing, hidden and disabled controls fall back to the main content', () => {
  for (const unavailable of ['missing', 'hidden', 'hidden-parent', 'css-hidden', 'disabled', 'aria-disabled', 'inert-parent']) {
    const { document, root, memory, mount } = fixture();
    let nodes = mount(); nodes.input.focus(); memory.capture(root, 'tokens:list'); nodes = mount();
    if (unavailable === 'missing') nodes.input.remove();
    if (unavailable === 'hidden') nodes.input.hidden = true;
    if (unavailable === 'disabled') nodes.input.setAttribute('disabled', '');
    if (unavailable === 'aria-disabled') nodes.input.setAttribute('aria-disabled', 'true');
    if (unavailable === 'css-hidden') document.defaultView = { getComputedStyle: node => ({ display: node === nodes.input ? 'none' : 'block' }) };
    if (unavailable.endsWith('-parent')) {
      const parent = document.createElement('div'); nodes.input.remove(); parent.append(nodes.input); nodes.content.append(parent);
      parent.setAttribute(unavailable === 'hidden-parent' ? 'hidden' : 'inert', '');
    }
    memory.restore(root, 'tokens:list');
    assert.equal(document.activeElement, nodes.content, unavailable);
  }
});

test('outside focus remains untouched and unknown controls use the content fallback', () => {
  const { document, root, memory, mount } = fixture();
  let nodes = mount(), outside = document.createElement('button'); document.body.append(outside); outside.focus();
  memory.capture(root, 'tokens:list'); nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(document.activeElement, outside);
  nodes.input.removeAttribute('id'); nodes.input.focus(); memory.capture(root, 'tokens:list'); nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(document.activeElement, nodes.content);
});

test('compact layout remembers its shared scroll separately and retains a focusable canvas fallback', () => {
  const { document, root, memory, mount } = fixture();
  let nodes = mount(); nodes.content.scrollTop = 320; nodes.inspector.scrollTop = 460;
  memory.capture(root, 'tokens:list');
  nodes.main.className += ' ds-panel-layout'; nodes.main.setAttribute('data-panel-compact', 'true');
  nodes.main.scrollTop = 540; nodes.content.scrollTop = 0; nodes.inspector.scrollTop = 0; nodes.input.focus();
  memory.capture(root, 'tokens:list');
  nodes = mount(); nodes.input.remove(); nodes.main.className += ' ds-panel-layout'; nodes.main.setAttribute('data-panel-compact', 'true');
  memory.restore(root, 'tokens:list');
  assert.equal(nodes.main.scrollTop, 540);
  assert.equal(document.activeElement, nodes.content, 'the shared scroller is not itself a focusable control');
  memory.capture(root, 'tokens:list'); nodes = mount(); memory.restore(root, 'tokens:list');
  assert.equal(nodes.content.scrollTop, 320);
  assert.equal(nodes.inspector.scrollTop, 460);
});
