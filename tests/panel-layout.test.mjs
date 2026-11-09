import test from 'node:test';
import assert from 'node:assert/strict';
import { mountPanelControls } from '../core/panels.mjs';
import { mountPanelControls as publicPanelControls } from '../core/components.mjs';
import { generateAppShellCSS } from '../core/layout.mjs';
import { PROJECT_RUNTIME } from '../tools/doctor.mjs';
import { dom, fire } from './support/dom.mjs';

function fixture(options = {}) {
  const document = dom(), events = document.createElement('document-events');
  document.addEventListener = events.addEventListener.bind(events); document.removeEventListener = events.removeEventListener.bind(events);
  const container = document.createElement('div'), content = document.createElement('main'), panel = document.createElement('aside');
  const handle = document.createElement('button'), toggle = document.createElement('button'), field = document.createElement('input');
  panel.append(field); container.append(content, handle, panel); document.body.append(toggle, container);
  let bounds = { width: 900, height: 500 }, resized, disconnected = false, cssHidden = false, viewportFlow = false;
  container.getBoundingClientRect = () => bounds;
  const windowEvents = document.createElement('window-events');
  document.defaultView = {
    addEventListener: windowEvents.addEventListener.bind(windowEvents), removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
    matchMedia: () => ({ matches: viewportFlow }), getComputedStyle: () => ({ display: cssHidden ? 'none' : 'grid' }),
    ResizeObserver: class { constructor(callback) { resized = callback; } observe(node) { assert.equal(node, container); } disconnect() { disconnected = true; } },
  };
  const changes = [], controls = mountPanelControls({ container, panel, handle, toggle, document, onChange: state => changes.push(state), ...options });
  return { document, events, container, content, panel, handle, toggle, field, changes, controls,
    resize(value) { bounds = { ...bounds, ...value }; resized(); },
    hideHandle(value) { cssHidden = value; resized(); },
    viewportFlow(value) { viewportFlow = value; fire(windowEvents, 'resize'); }, disconnected: () => disconnected };
}

test('panel disclosure preserves content and restores focus before hiding its active controls', () => {
  assert.equal(publicPanelControls, mountPanelControls);
  assert.ok(PROJECT_RUNTIME.some(([source]) => source === 'core/panels.mjs'));
  const { document, container, panel, handle, toggle, field, changes, controls } = fixture();
  assert.deepEqual(changes, [], 'mounting does not report an edit');
  assert.equal(container.getAttribute('data-panel-open'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.getAttribute('aria-controls'), panel.getAttribute('id'));
  assert.equal(handle.getAttribute('role'), 'separator');
  assert.equal(handle.getAttribute('aria-orientation'), 'vertical');
  assert.equal(handle.getAttribute('aria-valuenow'), '320');
  field.value = 'Bevar min kladde'; field.focus(); fire(toggle, 'click');
  assert.equal(document.activeElement, toggle);
  assert.equal(panel.hidden, true); assert.equal(handle.hidden, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  fire(toggle, 'click');
  assert.equal(panel.hidden, false); assert.equal(handle.getAttribute('tabindex'), '0');
  assert.equal(panel.querySelector('input'), field); assert.equal(field.value, 'Bevar min kladde');
  handle.focus(); controls.setOpen(false);
  assert.equal(document.activeElement, toggle);
  assert.deepEqual(changes.at(-1), { width: 320, open: false });
  controls.destroy();
});

test('separator keys resize a right-hand panel, clamp its bounds and cancel a keyboard session', () => {
  const { container, handle, controls } = fixture();
  handle.focus();
  assert.equal(fire(handle, 'keydown', { key: 'ArrowLeft' }).defaultPrevented, true);
  assert.equal(handle.getAttribute('aria-valuenow'), '336');
  fire(handle, 'keydown', { key: 'ArrowRight', shiftKey: true });
  assert.equal(handle.getAttribute('aria-valuenow'), '304');
  fire(handle, 'keydown', { key: 'End' }); assert.equal(handle.getAttribute('aria-valuenow'), '560');
  fire(handle, 'keydown', { key: 'Home' }); assert.equal(handle.getAttribute('aria-valuenow'), '240');
  fire(handle, 'keydown', { key: 'Escape' }); assert.equal(handle.getAttribute('aria-valuenow'), '320');
  assert.equal(container.style['--ds-panel-width'], '320px');
  assert.notEqual(fire(handle, 'keydown', { key: 'ArrowLeft', altKey: true }).defaultPrevented, true);
  controls.setWidth(10000); assert.equal(handle.getAttribute('aria-valuenow'), '560');
  controls.setWidth(-10); assert.equal(handle.getAttribute('aria-valuenow'), '240');
  assert.throws(() => controls.setWidth(Infinity), /finite/);
  controls.destroy();
});

test('pointer resizing preserves focus, ignores other pointers and cancels or commits predictably', () => {
  const { document, events, handle, controls } = fixture();
  const released = []; handle.setPointerCapture = () => {}; handle.releasePointerCapture = id => released.push(id);
  fire(handle, 'pointerdown', { pointerId: 1, clientX: 500, button: 0 });
  fire(events, 'pointermove', { pointerId: 2, clientX: 300 });
  assert.equal(handle.getAttribute('aria-valuenow'), '320');
  fire(events, 'pointermove', { pointerId: 1, clientX: 450 });
  assert.equal(handle.getAttribute('aria-valuenow'), '370'); assert.equal(document.activeElement, handle);
  fire(handle, 'keydown', { key: 'Escape' }); assert.equal(handle.getAttribute('aria-valuenow'), '320');
  assert.deepEqual(released, [1]);
  fire(handle, 'pointerdown', { pointerId: 3, clientX: 500, button: 0 });
  fire(events, 'pointermove', { pointerId: 3, clientX: 480 });
  fire(events, 'pointerup', { pointerId: 3 });
  assert.equal(handle.getAttribute('aria-valuenow'), '340');
  fire(handle, 'pointerdown', { pointerId: 4, clientX: 500, button: 0 });
  fire(events, 'pointermove', { pointerId: 4, clientX: 400 }); fire(events, 'pointercancel', { pointerId: 4 });
  assert.equal(handle.getAttribute('aria-valuenow'), '340');
  controls.destroy();
});

test('panel limits reserve main content and switch to one scroller for narrow or low work areas', () => {
  const { container, handle, controls, resize, disconnected, changes } = fixture({ width: 500 });
  resize({ width: 620 });
  assert.equal(handle.getAttribute('aria-valuemax'), '372');
  assert.equal(handle.getAttribute('aria-valuenow'), '372');
  resize({ width: 450 }); assert.equal(container.getAttribute('data-panel-compact'), 'true');
  resize({ width: 900, height: 260 }); assert.equal(container.getAttribute('data-panel-compact'), 'true');
  resize({ height: 500 }); assert.equal(container.getAttribute('data-panel-compact'), 'false');
  assert.equal(handle.getAttribute('aria-valuemax'), '560');
  controls.destroy(); assert.equal(disconnected(), true);
  const before = changes.length; fire(handle, 'keydown', { key: 'ArrowLeft' });
  assert.equal(changes.length, before); assert.throws(() => controls.setOpen(true), /destroyed/);
  controls.destroy();
});

test('a hidden resize handle gives focus back and cancels dragging when the work area or viewport changes', () => {
  const { document, container, events, handle, toggle, controls, resize, hideHandle, viewportFlow } = fixture({ width: 360 });
  fire(handle, 'pointerdown', { pointerId: 1, clientX: 500, button: 0 });
  fire(events, 'pointermove', { pointerId: 1, clientX: 450 });
  assert.equal(handle.getAttribute('aria-valuenow'), '410');
  resize({ height: 260 });
  assert.equal(container.getAttribute('data-panel-compact'), 'true');
  assert.equal(document.activeElement, toggle);
  assert.equal(handle.getAttribute('aria-valuenow'), '360', 'a resize fallback cancels the unfinished drag');
  fire(events, 'pointermove', { pointerId: 1, clientX: 300 });
  assert.equal(handle.getAttribute('aria-valuenow'), '360');
  resize({ height: 500 }); handle.focus();
  fire(handle, 'keydown', { key: 'ArrowLeft' });
  hideHandle(true); assert.equal(document.activeElement, toggle);
  hideHandle(false); handle.focus();
  viewportFlow(true); assert.equal(document.activeElement, toggle);
  viewportFlow(false);
  container.clientWidth = 480; resize({ width: 500 });
  assert.equal(container.getAttribute('data-panel-compact'), 'false', 'border-box width avoids scrollbar-gutter hysteresis');
  controls.destroy();
});

test('collapsible panels preview a close, allow reversal and only close on release while remembering their width', () => {
  const {container, panel, handle, toggle, events, controls} = fixture({collapsible:true, width:360});
  fire(handle,'pointerdown',{pointerId:1,clientX:400,button:0});
  fire(events,'pointermove',{pointerId:1,clientX:610});
  assert.equal(container.getAttribute('data-panel-drag'),'close');
  assert.equal(container.getAttribute('data-panel-open'),'true');
  assert.equal(panel.hidden,false);
  assert.equal(handle.getAttribute('aria-valuenow'),'240','content is not squeezed below its minimum');
  fire(events,'pointermove',{pointerId:1,clientX:500});
  assert.equal(container.getAttribute('data-panel-drag'),'resize');
  assert.equal(container.getAttribute('data-panel-hint'),null);
  fire(events,'pointermove',{pointerId:1,clientX:610});
  fire(events,'pointerup',{pointerId:1});
  assert.equal(container.getAttribute('data-panel-open'),'false');
  assert.equal(panel.hidden,true);
  assert.equal(handle.getAttribute('aria-valuenow'),'360');
  fire(toggle,'click');
  assert.equal(panel.hidden,false);
  assert.equal(handle.getAttribute('aria-valuenow'),'360');
  controls.destroy();
});

test('the edge grip previews reopening, ignores short pulls and suppresses the click after a completed drag', () => {
  const {container, panel, handle, toggle, events, controls} = fixture({collapsible:true,open:false,width:380});
  fire(toggle,'pointerdown',{pointerId:1,clientX:880,button:0});
  fire(events,'pointermove',{pointerId:1,clientX:850});
  assert.equal(container.getAttribute('data-panel-revealing'),'true');
  assert.equal(panel.inert,true);
  fire(events,'pointerup',{pointerId:1}); fire(toggle,'click',{detail:1});
  assert.equal(container.getAttribute('data-panel-open'),'false'); assert.equal(panel.hidden,true);
  fire(toggle,'pointerdown',{pointerId:2,clientX:880,button:0});
  fire(events,'pointermove',{pointerId:2,clientX:790});
  fire(events,'pointerup',{pointerId:2}); fire(toggle,'click',{detail:1});
  assert.equal(container.getAttribute('data-panel-open'),'true');
  assert.equal(handle.getAttribute('aria-valuenow'),'380','a short intentional pull restores the previous width');
  assert.equal(panel.inert,false);
  fire(handle,'keydown',{key:'Enter'}); assert.equal(panel.hidden,true);
  fire(toggle,'click',{detail:0}); assert.equal(panel.hidden,false,'keyboard activation remains available');
  controls.destroy();
});

test('Escape, cancellation, viewport changes and disposal clear drag previews without losing content', () => {
  const {container, panel, field, handle, toggle, events, controls, viewportFlow} = fixture({collapsible:true,width:350});
  field.value='Min kladde';
  fire(toggle,'pointerdown',{pointerId:1,clientX:500,button:0});
  fire(events,'pointermove',{pointerId:1,clientX:710});
  fire(events,'keydown',{key:'Escape'}); fire(toggle,'click',{detail:1});
  assert.equal(panel.hidden,false); assert.equal(handle.getAttribute('aria-valuenow'),'350');
  assert.equal(container.getAttribute('data-panel-drag'),null);
  controls.setOpen(false);
  fire(toggle,'pointerdown',{pointerId:2,clientX:880,button:0});
  fire(events,'pointermove',{pointerId:2,clientX:780});
  fire(events,'pointercancel',{pointerId:2});
  assert.equal(panel.hidden,true); assert.equal(container.getAttribute('data-panel-revealing'),null);
  controls.setOpen(true);
  fire(handle,'pointerdown',{pointerId:3,clientX:500,button:0});
  fire(events,'pointermove',{pointerId:3,clientX:710}); viewportFlow(true);
  fire(events,'pointerup',{pointerId:3});
  assert.equal(panel.hidden,false); assert.equal(handle.getAttribute('aria-valuenow'),'350');
  viewportFlow(false);
  fire(toggle,'pointerdown',{pointerId:4,clientX:500,button:0});
  fire(events,'pointermove',{pointerId:4,clientX:710}); controls.destroy();
  assert.equal(container.getAttribute('data-panel-drag'),null); assert.equal(field.value,'Min kladde');
});

test('unfinished disclosure animations cannot hide a reopened panel', async () => {
  const {container,document,panel,controls}=fixture({collapsible:true});
  document.defaultView.getComputedStyle=()=>({gridTemplateColumns:container.getAttribute('data-panel-open')==='true'?'572px 8px 320px':'900px 0px 0px'});
  const animations=[];
  container.animate=()=>{let resolve;const animation={finished:new Promise(r=>{resolve=r;}),cancel(){this.cancelled=true;},finish(){resolve();}};animations.push(animation);return animation;};
  controls.setOpen(false); assert.equal(panel.hidden,false); assert.equal(panel.inert,true);
  controls.setOpen(true); assert.equal(animations[0].cancelled,true);
  animations[0].finish(); await Promise.resolve(); assert.equal(panel.hidden,false);
  animations[1].finish(); await Promise.resolve(); assert.equal(panel.inert,false);
  controls.setOpen(false); controls.destroy();
  assert.equal(panel.hidden,true); assert.equal(container.getAttribute('data-panel-transition'),null);
});

test('shared panel and form layouts isolate scroll without changing card or stack display in compact mode', () => {
  const css = generateAppShellCSS('#product');
  assert.match(css, /\.ds-panel-layout > \.ds-panel-side/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 8px var\(--ds-panel-width, 20rem\)/);
  assert.match(css, /\[data-panel-open="false"\][^{]*\{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.ds-form-layout[^{}]*\{ display: grid; grid-template-rows: minmax\(0, 1fr\) auto; overflow: hidden/);
  assert.match(css, /padding: max\(var\(--ds-space-component-paddingCompact, 6px\), calc\(max\(3px, var\(--ds-border-width-focus, 3px\)\) \+ max\(2px, var\(--ds-border-offset-focus, 3px\)\)\)\)/);
  const compactChildren = [...css.matchAll(/([^{}]*\[data-panel-compact="true"\][^{}]*)\{([^{}]*)\}/g)]
    .filter(([, selector]) => /ds-panel-content|ds-panel-side|ds-form-fields/.test(selector) && !selector.includes('ds-form-layout'));
  assert.ok(compactChildren.length);
  for (const [, , declarations] of compactChildren) assert.doesNotMatch(declarations, /display:/, 'shared cards and stacks retain their anatomy');
  const mobile = css.slice(css.indexOf('@media (max-width: 800px), (max-height: 480px)'));
  assert.match(mobile, /\.ds-panel-layout[^{}]*\{ display: block; block-size: auto; overflow: visible/);
  assert.match(mobile, /\.ds-panel-resize[^{}]*\{ display: none/);
  assert.doesNotMatch(css, /position:\s*(?:sticky|fixed)/, 'form actions occupy a separate layout row rather than covering fields');
});
